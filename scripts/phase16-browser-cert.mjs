import {
  spawn,
  spawnSync,
} from 'node:child_process';
import {
  readdir,
  rm,
  stat,
} from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import {
  extname,
  join,
} from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const DIST = join(ROOT, 'dist');
const APP_URL = 'http://127.0.0.1:4173/loop/';
const DEBUG_PORT = 9222;
const DEBUG_BASE = `http://127.0.0.1:${DEBUG_PORT}`;
const USER_DATA_DIR = `/tmp/loop-phase16-${process.pid}`;

const budgets = {
  jsCssRawBytes: 500 * 1024,
  jsCssGzipBytes: 120 * 1024,
  navigationLoadMs: 3_000,
  homeToWorldMs: 1_500,
  frameP95Ms: 35,
  frameMaxMs: 150,
  heapGrowthBytes: 5 * 1024 * 1024,
  nodeGrowth: 250,
  longTaskMaxMs: 200,
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHttp(url, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { cache: 'no-store' });

      if (response.ok) {
        return response;
      }
    } catch (error) {
      lastError = error;
    }

    await delay(100);
  }

  throw new Error(
    `Timed out waiting for ${url}: ${lastError ?? 'no response'}`,
  );
}

function findBrowser() {
  for (const name of [
    'google-chrome-stable',
    'google-chrome',
    'chromium',
    'chromium-browser',
  ]) {
    const result = spawnSync('which', [name], {
      encoding: 'utf8',
    });
    const found = result.stdout.trim();

    if (result.status === 0 && found) {
      return found;
    }
  }

  throw new Error(
    'Phase 16 browser certification requires Chrome/Chromium on the CI runner.',
  );
}

async function walk(directory) {
  const entries = await readdir(directory, {
    withFileTypes: true,
  });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await walk(path));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }

  return files;
}

async function measureBuildSize() {
  const files = await walk(DIST);
  let jsCssRawBytes = 0;
  let jsCssGzipBytes = 0;
  let totalRawBytes = 0;

  for (const path of files) {
    const info = await stat(path);
    totalRawBytes += info.size;

    if (!['.js', '.css'].includes(extname(path))) {
      continue;
    }

    const buffer = await import('node:fs/promises')
      .then(({ readFile }) => readFile(path));

    jsCssRawBytes += buffer.byteLength;
    jsCssGzipBytes += gzipSync(buffer).byteLength;
  }

  return {
    totalRawBytes,
    jsCssRawBytes,
    jsCssGzipBytes,
  };
}

class CdpClient {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
    this.eventWaiters = new Map();
  }

  async open() {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('Timed out opening DevTools WebSocket.')),
        10_000,
      );

      this.socket.addEventListener('open', () => {
        clearTimeout(timeout);
        resolve();
      }, { once: true });

      this.socket.addEventListener('error', () => {
        clearTimeout(timeout);
        reject(new Error('DevTools WebSocket failed to open.'));
      }, { once: true });
    });

    this.socket.addEventListener('message', (event) => {
      const text = typeof event.data === 'string'
        ? event.data
        : Buffer.from(event.data).toString('utf8');
      const message = JSON.parse(text);

      if (message.id) {
        const waiter = this.pending.get(message.id);

        if (!waiter) {
          return;
        }

        this.pending.delete(message.id);

        if (message.error) {
          waiter.reject(
            new Error(
              `${message.error.message} (${message.error.code})`,
            ),
          );
        } else {
          waiter.resolve(message.result ?? {});
        }
        return;
      }

      if (!message.method) {
        return;
      }

      const waiters = this.eventWaiters.get(message.method) ?? [];
      const waiter = waiters.shift();

      if (waiter) {
        clearTimeout(waiter.timeout);
        waiter.resolve(message.params ?? {});
      }

      if (waiters.length === 0) {
        this.eventWaiters.delete(message.method);
      } else {
        this.eventWaiters.set(message.method, waiters);
      }
    });
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({
        id,
        method,
        params,
      }));
    });
  }

  once(method, timeoutMs = 10_000) {
    return new Promise((resolve, reject) => {
      const waiters = this.eventWaiters.get(method) ?? [];
      const timeout = setTimeout(() => {
        const current = this.eventWaiters.get(method) ?? [];
        this.eventWaiters.set(
          method,
          current.filter((item) => item.resolve !== resolve),
        );
        reject(new Error(`Timed out waiting for CDP event ${method}.`));
      }, timeoutMs);

      waiters.push({ resolve, reject, timeout });
      this.eventWaiters.set(method, waiters);
    });
  }

  async evaluate(expression, {
    awaitPromise = true,
    userGesture = false,
  } = {}) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise,
      returnByValue: true,
      userGesture,
    });

    if (result.exceptionDetails) {
      throw new Error(
        result.exceptionDetails.exception?.description
        ?? result.exceptionDetails.text
        ?? 'Browser evaluation failed.',
      );
    }

    return result.result?.value;
  }

  close() {
    this.socket.close();
  }
}

function metricMap(result) {
  return new Map(
    (result.metrics ?? []).map((metric) => [
      metric.name,
      metric.value,
    ]),
  );
}

function assertBudget(
  failures,
  label,
  actual,
  maximum,
  unit = '',
) {
  if (!(actual <= maximum)) {
    failures.push(
      `${label}: ${actual.toFixed(2)}${unit} > ${maximum.toFixed(2)}${unit}`,
    );
  }
}

async function main() {
  const build = await measureBuildSize();
  const browserPath = findBrowser();
  const preview = spawn(
    'npm',
    [
      'run',
      'preview',
      '--',
      '--host',
      '127.0.0.1',
      '--port',
      '4173',
      '--strictPort',
    ],
    {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  const chrome = spawn(
    browserPath,
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--window-size=1440,900',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-sync',
      '--mute-audio',
      '--autoplay-policy=no-user-gesture-required',
      `--remote-debugging-port=${DEBUG_PORT}`,
      '--remote-debugging-address=127.0.0.1',
      `--user-data-dir=${USER_DATA_DIR}`,
      'about:blank',
    ],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  let client = null;

  try {
    await waitForHttp(APP_URL);
    await waitForHttp(`${DEBUG_BASE}/json/version`);

    const targetResponse = await fetch(
      `${DEBUG_BASE}/json/new?${encodeURIComponent('about:blank')}`,
      { method: 'PUT' },
    );
    const target = await targetResponse.json();

    if (!target.webSocketDebuggerUrl) {
      throw new Error('Chrome did not expose a page DevTools target.');
    }

    client = new CdpClient(target.webSocketDebuggerUrl);
    await client.open();
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Performance.enable');
    await client.send('HeapProfiler.enable');

    const loaded = client.once('Page.loadEventFired');
    await client.send('Page.navigate', { url: APP_URL });
    await loaded;

    await client.evaluate(`
      (async () => {
        const deadline = performance.now() + 5000;
        while (!document.querySelector('.home-shell')) {
          if (performance.now() > deadline) {
            throw new Error('Home did not mount.');
          }
          await new Promise(requestAnimationFrame);
        }
        return true;
      })()
    `);

    const startup = await client.evaluate(`
      (() => {
        const nav = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByName('first-contentful-paint')[0];

        return {
          domContentLoadedMs: nav?.domContentLoadedEventEnd ?? 0,
          loadMs: nav?.loadEventEnd ?? 0,
          firstContentfulPaintMs: paint?.startTime ?? null,
          resourceCount: performance.getEntriesByType('resource').length,
        };
      })()
    `);

    const homeToWorldMs = await client.evaluate(`
      (async () => {
        const starter = document.querySelector('[data-starter="weird"]');
        if (!(starter instanceof HTMLButtonElement)) {
          throw new Error('Weird starter control is missing.');
        }

        const started = performance.now();
        starter.click();
        const deadline = started + 5000;

        while (!document.querySelector('.playground-shell')) {
          if (performance.now() > deadline) {
            throw new Error('Playground did not mount.');
          }
          await new Promise(requestAnimationFrame);
        }

        await new Promise(requestAnimationFrame);
        return performance.now() - started;
      })()
    `, { userGesture: true });

    await delay(500);

    const audio = await client.evaluate(`
      (async () => {
        const AudioContextClass = window.AudioContext
          || window.webkitAudioContext;

        if (!AudioContextClass) {
          return null;
        }

        const context = new AudioContextClass();
        await context.resume();

        const result = {
          state: context.state,
          sampleRate: context.sampleRate,
          baseLatency: context.baseLatency ?? null,
          outputLatency: context.outputLatency ?? null,
        };

        await context.close();
        return result;
      })()
    `, { userGesture: true });

    await client.evaluate(`
      (() => {
        window.__phase16LongTasks = [];
        try {
          window.__phase16LongTaskObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              window.__phase16LongTasks.push(entry.duration);
            }
          });
          window.__phase16LongTaskObserver.observe({
            entryTypes: ['longtask'],
          });
        } catch {
          window.__phase16LongTaskObserver = null;
        }
        return true;
      })()
    `);

    await client.send('HeapProfiler.collectGarbage');
    const beforeMetrics = metricMap(
      await client.send('Performance.getMetrics'),
    );
    const beforeDom = await client.send('Memory.getDOMCounters');

    const frames = await client.evaluate(`
      (async () => {
        const gaps = [];
        let previous = performance.now();

        for (let frame = 0; frame < 180; frame += 1) {
          const current = await new Promise(requestAnimationFrame);
          if (frame >= 5) {
            gaps.push(current - previous);
          }
          previous = current;
        }

        const sorted = [...gaps].sort((a, b) => a - b);
        const sum = gaps.reduce((total, value) => total + value, 0);

        return {
          count: gaps.length,
          averageMs: sum / gaps.length,
          p95Ms: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
          maxMs: Math.max(...gaps),
        };
      })()
    `);

    const churn = await client.evaluate(`
      (async () => {
        const nextFrame = () => new Promise(requestAnimationFrame);
        const started = performance.now();

        const openAndClose = async (openSelector, closeSelector) => {
          const open = document.querySelector(openSelector);
          if (!(open instanceof HTMLButtonElement) || open.disabled) {
            throw new Error('Missing modal opener: ' + openSelector);
          }

          open.click();
          await nextFrame();

          const close = document.querySelector(closeSelector);
          if (!(close instanceof HTMLButtonElement)) {
            throw new Error('Missing modal closer: ' + closeSelector);
          }

          close.click();
          await nextFrame();
        };

        const firstOrb = document.querySelector('.sound-orb');
        if (firstOrb instanceof HTMLButtonElement) {
          firstOrb.click();
          await nextFrame();
        }

        for (let cycle = 0; cycle < 12; cycle += 1) {
          await openAndClose(
            '.visual-settings-button',
            '[data-visual-close]',
          );
          await openAndClose(
            '.snapshots-button',
            '[data-snapshot-close]',
          );
          await openAndClose(
            '.effects-button',
            '[data-effects-close]',
          );
          await openAndClose(
            '.toys-button',
            '[data-toys-close]',
          );
          await openAndClose(
            '.remix-button',
            '[data-magic-intent-close]',
          );

          const pattern = document.querySelector('[data-action="pattern"]');
          if (
            pattern instanceof HTMLButtonElement
            && !pattern.hidden
            && !pattern.disabled
          ) {
            pattern.click();
            await nextFrame();

            const close = document.querySelector('[data-pattern-close]');
            if (close instanceof HTMLButtonElement) {
              close.click();
              await nextFrame();
            }
          }
        }

        return performance.now() - started;
      })()
    `);

    await client.send('Page.setWebLifecycleState', {
      state: 'frozen',
    });
    await delay(250);
    await client.send('Page.setWebLifecycleState', {
      state: 'active',
    });
    await delay(250);

    const recovery = await client.evaluate(`
      ({
        playgroundMounted: Boolean(
          document.querySelector('.playground-shell')
        ),
        bodyChildren: document.body.children.length,
      })
    `);

    await client.send('HeapProfiler.collectGarbage');
    const afterMetrics = metricMap(
      await client.send('Performance.getMetrics'),
    );
    const afterDom = await client.send('Memory.getDOMCounters');

    const longTasks = await client.evaluate(`
      (() => {
        const values = Array.isArray(window.__phase16LongTasks)
          ? window.__phase16LongTasks
          : [];
        return {
          count: values.length,
          maxMs: values.length > 0 ? Math.max(...values) : 0,
          totalMs: values.reduce((sum, value) => sum + value, 0),
        };
      })()
    `);

    const heapBefore = beforeMetrics.get('JSHeapUsedSize') ?? 0;
    const heapAfter = afterMetrics.get('JSHeapUsedSize') ?? 0;
    const metrics = {
      browserPath,
      build,
      startup,
      homeToWorldMs,
      audio,
      frames,
      modalChurnMs: churn,
      heapBeforeBytes: heapBefore,
      heapAfterBytes: heapAfter,
      heapGrowthBytes: heapAfter - heapBefore,
      nodesBefore: beforeDom.nodes ?? 0,
      nodesAfter: afterDom.nodes ?? 0,
      nodeGrowth: (afterDom.nodes ?? 0) - (beforeDom.nodes ?? 0),
      documentsBefore: beforeDom.documents ?? 0,
      documentsAfter: afterDom.documents ?? 0,
      longTasks,
      recovery,
      taskDurationBeforeMs:
        (beforeMetrics.get('TaskDuration') ?? 0) * 1000,
      taskDurationAfterMs:
        (afterMetrics.get('TaskDuration') ?? 0) * 1000,
    };

    console.log(
      `PHASE16_BROWSER_METRICS ${JSON.stringify(metrics)}`,
    );

    const failures = [];

    assertBudget(
      failures,
      'JS+CSS raw build size',
      build.jsCssRawBytes,
      budgets.jsCssRawBytes,
      ' bytes',
    );
    assertBudget(
      failures,
      'JS+CSS gzip build size',
      build.jsCssGzipBytes,
      budgets.jsCssGzipBytes,
      ' bytes',
    );
    assertBudget(
      failures,
      'Navigation load',
      startup.loadMs,
      budgets.navigationLoadMs,
      ' ms',
    );
    assertBudget(
      failures,
      'Home → World',
      homeToWorldMs,
      budgets.homeToWorldMs,
      ' ms',
    );
    assertBudget(
      failures,
      'Animation-frame p95',
      frames.p95Ms,
      budgets.frameP95Ms,
      ' ms',
    );
    assertBudget(
      failures,
      'Animation-frame max',
      frames.maxMs,
      budgets.frameMaxMs,
      ' ms',
    );
    assertBudget(
      failures,
      'Post-GC heap growth',
      Math.max(0, metrics.heapGrowthBytes),
      budgets.heapGrowthBytes,
      ' bytes',
    );
    assertBudget(
      failures,
      'DOM node growth',
      Math.max(0, metrics.nodeGrowth),
      budgets.nodeGrowth,
      ' nodes',
    );
    assertBudget(
      failures,
      'Longest observed long task',
      longTasks.maxMs,
      budgets.longTaskMaxMs,
      ' ms',
    );

    if (!recovery.playgroundMounted) {
      failures.push(
        'Playground did not survive frozen → active lifecycle recovery.',
      );
    }

    if (failures.length > 0) {
      throw new Error(
        `Phase 16 browser budgets failed:\n- ${failures.join('\n- ')}`,
      );
    }
  } finally {
    client?.close();
    chrome.kill('SIGTERM');
    preview.kill('SIGTERM');

    await delay(250);

    try {
      await rm(USER_DATA_DIR, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 100,
      });
    } catch {
      // Runner cleanup is best-effort and is not a product certification signal.
    }
  }
}

await main();
