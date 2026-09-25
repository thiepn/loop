import { chromium } from '@playwright/test';

const DEFAULT_URL = 'https://thiepn.github.io/loop/';
const productionUrl = new URL(
  process.env.LOOP_PRODUCTION_URL || DEFAULT_URL,
);

if (productionUrl.protocol === 'http:') {
  productionUrl.protocol = 'https:';
}

assertProtocol(productionUrl);
const expectedCommit = process.env.EXPECTED_COMMIT ?? '';
const expectedVersion = process.env.EXPECTED_VERSION ?? '1.0.0';

if (!productionUrl.pathname.endsWith('/')) {
  productionUrl.pathname += '/';
}

function assertProtocol(url) {
  if (url.protocol !== 'https:') {
    throw new Error(
      `Production URL must use HTTP(S) and resolve through HTTPS: ${url.href}`,
    );
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function scopedUrl(path) {
  return new URL(path, productionUrl);
}

async function delay(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url,
  {
    timeoutMs = 120_000,
    validate = async (response) => response.ok,
  } = {},
) {
  const deadline = Date.now() + timeoutMs;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const candidate = new URL(url);
      candidate.searchParams.set('_loop_release', String(Date.now()));
      const response = await fetch(candidate, {
        cache: 'no-store',
        redirect: 'follow',
      });

      if (await validate(response.clone())) {
        return response;
      }

      lastError = new Error(
        `Unexpected response from ${candidate}: ${response.status}`,
      );
    } catch (error) {
      lastError = error;
    }

    await delay(2_000);
  }

  throw new Error(
    `Timed out waiting for ${url}: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}

async function waitForReleaseMetadata() {
  const url = scopedUrl('release.json');

  return fetchWithRetry(url, {
    validate: async (response) => {
      if (!response.ok) {
        return false;
      }

      try {
        const value = await response.json();
        return (
          value.version === expectedVersion
          && (!expectedCommit || value.commit === expectedCommit)
        );
      } catch {
        return false;
      }
    },
  });
}

async function run() {
  assert(
    productionUrl.pathname === '/loop/',
    `Expected canonical /loop/ project path, got ${productionUrl.pathname}`,
  );

  const releaseResponse = await waitForReleaseMetadata();
  const release = await releaseResponse.json();
  const liveProductionUrl = new URL('./', releaseResponse.url);

  assert(
    liveProductionUrl.protocol === 'https:',
    `Production did not resolve to HTTPS: ${releaseResponse.url}`,
  );
  assert(
    liveProductionUrl.pathname === '/loop/',
    `Resolved production path is not /loop/: ${liveProductionUrl.pathname}`,
  );

  assert(
    release.version === expectedVersion,
    `Live release version mismatch: ${release.version} !== ${expectedVersion}`,
  );
  if (expectedCommit) {
    assert(
      release.commit === expectedCommit,
      `Live release commit mismatch: ${release.commit} !== ${expectedCommit}`,
    );
  }

  const manifestResponse = await fetchWithRetry(
    scopedUrl('manifest.webmanifest'),
  );
  const manifest = await manifestResponse.json();

  const manifestBaseUrl = new URL(manifestResponse.url);
  const manifestId = new URL(manifest.id, manifestBaseUrl);
  const manifestScope = new URL(manifest.scope, manifestBaseUrl);
  const manifestStartUrl = new URL(manifest.start_url, manifestBaseUrl);

  assert(
    manifestId.pathname === '/loop/',
    `Manifest id resolves to ${manifestId.pathname}`,
  );
  assert(
    manifestScope.pathname === '/loop/',
    `Manifest scope resolves to ${manifestScope.pathname}`,
  );
  assert(
    manifestStartUrl.pathname === '/loop/',
    `Manifest start_url resolves to ${manifestStartUrl.pathname}`,
  );

  const iconSizes = new Set(
    (manifest.icons ?? []).map((icon) => icon.sizes),
  );
  assert(iconSizes.has('192x192'), 'Manifest is missing the 192x192 icon.');
  assert(iconSizes.has('512x512'), 'Manifest is missing the 512x512 icon.');

  const swResponse = await fetchWithRetry(scopedUrl('sw.js'));
  const swText = await swResponse.text();

  assert(
    swText.includes('loop-precache-'),
    'Live service worker is missing the Loop precache contract.',
  );
  assert(
    swText.includes('/loop/'),
    'Live service worker does not contain the /loop/ deployment path.',
  );

  const browser = await chromium.launch({
    args: ['--autoplay-policy=no-user-gesture-required'],
  });
  const context = await browser.newContext({
    serviceWorkers: 'allow',
    viewport: {
      width: 1440,
      height: 900,
    },
  });
  const page = await context.newPage();
  const pageErrors = [];

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  try {
    const liveUrl = new URL(liveProductionUrl);
    liveUrl.searchParams.set('release', release.commit);

    const navigation = await page.goto(liveUrl.href, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    assert(
      navigation?.ok(),
      `Production navigation failed with ${navigation?.status() ?? 'no response'}`,
    );

    await page.locator('.home-shell').waitFor({
      state: 'visible',
      timeout: 15_000,
    });

    assert(
      await page.locator('.fatal-shell').count() === 0,
      'Production rendered the fatal shell.',
    );

    const manifestHref = await page
      .locator('link[rel="manifest"]')
      .getAttribute('href');
    assert(Boolean(manifestHref), 'Production page has no manifest link.');

    const resolvedManifest = new URL(manifestHref, page.url());
    assert(
      resolvedManifest.pathname === '/loop/manifest.webmanifest',
      `Manifest link escaped /loop/: ${resolvedManifest.href}`,
    );

    const registration = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service workers are unavailable in production smoke.');
      }

      const ready = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => {
          setTimeout(
            () => reject(new Error('Service worker readiness timed out.')),
            20_000,
          );
        }),
      ]);

      return {
        scope: ready.scope,
        scriptURL: ready.active?.scriptURL ?? null,
      };
    });

    assert(
      new URL(registration.scope).pathname === '/loop/',
      `Live service-worker scope is ${registration.scope}`,
    );
    assert(
      registration.scriptURL
      && new URL(registration.scriptURL).pathname === '/loop/sw.js',
      `Live service-worker script is ${registration.scriptURL}`,
    );

    await page.reload({
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await page.locator('.home-shell').waitFor({
      state: 'visible',
      timeout: 15_000,
    });

    await page.waitForFunction(
      () => Boolean(navigator.serviceWorker?.controller),
      undefined,
      { timeout: 15_000 },
    );

    const resources = await page.evaluate(() => (
      performance
        .getEntriesByType('resource')
        .map((entry) => entry.name)
    ));

    const origin = liveProductionUrl.origin;
    for (const resource of resources) {
      const url = new URL(resource);

      if (url.origin === origin) {
        assert(
          url.pathname.startsWith('/loop/'),
          `Production resource escaped /loop/: ${url.href}`,
        );
      }
    }

    await context.setOffline(true);

    await page.reload({
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await page.locator('.home-shell').waitFor({
      state: 'visible',
      timeout: 15_000,
    });
    await page.locator('.pwa-offline-badge').waitFor({
      state: 'visible',
      timeout: 10_000,
    });

    await context.setOffline(false);
    await page.reload({
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await page.locator('.home-shell').waitFor({
      state: 'visible',
      timeout: 15_000,
    });

    await page.locator('[data-starter="beat"]').click();
    await page.locator('.playground-shell').waitFor({
      state: 'visible',
      timeout: 15_000,
    });
    assert(
      await page.locator('.sound-orb').count() > 0,
      'Live production starter World has no Sound Orbs.',
    );

    assert(
      pageErrors.length === 0,
      `Production emitted page errors: ${pageErrors.join(' | ')}`,
    );

    console.log(
      `PHASE18_LIVE_SMOKE ${JSON.stringify({
        url: liveProductionUrl.href,
        version: release.version,
        commit: release.commit,
        manifest: resolvedManifest.href,
        serviceWorkerScope: registration.scope,
        serviceWorkerScript: registration.scriptURL,
        offlineShell: true,
        starterWorld: true,
        pageErrors: pageErrors.length,
      })}`,
    );
  } finally {
    await browser.close();
  }
}

try {
  await run();
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
