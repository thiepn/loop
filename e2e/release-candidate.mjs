import {
  expect,
  test,
} from '@playwright/test';

async function expectNoFatalShell(page) {
  await expect(page.locator('.fatal-shell')).toHaveCount(0);
}

function isTouchProject(testInfo) {
  return (
    testInfo.project.name === 'android-chromium'
    || testInfo.project.name === 'ios-webkit'
    || testInfo.project.name === 'ipad-webkit'
  );
}

async function activate(locator, testInfo) {
  await expect(locator).toBeVisible();
  await expect(locator).toBeEnabled();

  if (isTouchProject(testInfo)) {
    await locator.tap({ force: true });
    return;
  }

  await locator.click({ force: true });
}

async function waitForSurface(locator) {
  await expect(locator).toBeVisible();

  await locator.evaluate(async (element) => {
    const animations = element.getAnimations().filter(
      (animation) => (
        animation.playState === 'running'
        || animation.playState === 'pending'
      ),
    );

    await Promise.all(
      animations.map(
        (animation) => animation.finished.catch(() => undefined),
      ),
    );
  });
}

async function stopPlayback(page) {
  const play = page.locator('[data-play]');

  if (await play.getAttribute('aria-pressed') === 'true') {
    await expect(play).toBeVisible();
    await play.evaluate((button) => button.click());
    await expect(play).toHaveAttribute('aria-pressed', 'false');
  }
}

async function openStarter(
  page,
  testInfo,
  starter = 'beat',
) {
  await page.goto('./');
  await expect(page.locator('.home-shell')).toBeVisible();
  await expectNoFatalShell(page);

  await activate(
    page.locator(`[data-starter="${starter}"]`),
    testInfo,
  );

  await expect(page.locator('.playground-shell')).toBeVisible();
  await expect(page.locator('.sound-orb').first()).toBeVisible();

  const play = page.locator('[data-play]');

  if (await play.getAttribute('aria-pressed') !== 'true') {
    await activate(play, testInfo);
    await page.waitForTimeout(250);
  }

  const playing = await play.getAttribute('aria-pressed') === 'true';

  if (!playing) {
    await expect(page.locator('.world-hint[data-status]')).toContainText(
      /Tap Play to allow sound|Sound could not start/i,
    );
  }

  return playing;
}

test('complete clean-user V1 workflow survives the release-candidate matrix', async ({
  page,
}, testInfo) => {
  const pageErrors = [];
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  await openStarter(page, testInfo, 'beat');

  const initialSoundCount = await page.locator('.sound-orb').count();
  const firstOrb = page.locator('.sound-orb').first();

  await activate(firstOrb, testInfo);
  await expect(page.locator('.selection-panel')).toBeVisible();

  const initialX = Number(await firstOrb.getAttribute('data-x'));
  await firstOrb.focus();
  await firstOrb.press('ArrowRight');

  await expect.poll(async () => (
    Number(await page.locator('.sound-orb').first().getAttribute('data-x'))
  )).toBeGreaterThan(initialX);

  await activate(page.locator('[data-action="pattern"]'), testInfo);
  await waitForSurface(page.locator('.pattern-sheet'));

  const firstStep = page.locator('.rhythm-step').first();
  const stepBefore = await firstStep.getAttribute('aria-pressed');
  await activate(firstStep, testInfo);
  await expect(firstStep).toHaveAttribute(
    'aria-pressed',
    stepBefore === 'true' ? 'false' : 'true',
  );
  await activate(page.locator('[data-pattern-close]'), testInfo);
  await expect(page.locator('.pattern-backdrop')).toBeHidden();

  await activate(page.locator('[data-add]'), testInfo);
  await waitForSurface(page.locator('.palette-sheet'));
  await activate(page.locator('.sound-choice').first(), testInfo);
  await expect(page.locator('.sound-orb')).toHaveCount(initialSoundCount + 1);

  const fieldCount = await page.locator('.effect-field').count();
  await activate(page.locator('.effects-button'), testInfo);
  await waitForSurface(page.locator('.effect-palette-sheet'));
  await activate(
    page.locator('.effect-choice:not([disabled])').first(),
    testInfo,
  );
  await expect(page.locator('.effect-field')).toHaveCount(fieldCount + 1);

  const toyCount = await page.locator('.playground-toy').count();
  await activate(page.locator('.toys-button'), testInfo);
  await waitForSurface(page.locator('.toy-palette-sheet'));
  await activate(
    page.locator('.toy-choice:not([disabled])').first(),
    testInfo,
  );
  await expect(page.locator('.playground-toy')).toHaveCount(toyCount + 1);

  const snapshotOrb = page.locator('.sound-orb').first();
  await snapshotOrb.focus();
  await snapshotOrb.press('ArrowRight');
  await expect(page.locator('.selection-panel')).toBeVisible();

  await activate(page.locator('[data-action="motion"]'), testInfo);
  await waitForSurface(page.locator('.motion-sheet'));
  await activate(
    page.locator('[data-motion-mode="orbit"]'),
    testInfo,
  );
  await expect(
    page.locator('[data-motion-mode="orbit"]'),
  ).toHaveAttribute('aria-pressed', 'true');
  await activate(page.locator('[data-motion-close]'), testInfo);

  const linkCount = await page.locator('.link-connection').count();
  await expect(page.locator('.selection-panel')).toBeVisible();
  await activate(page.locator('[data-action="link"]'), testInfo);
  await waitForSurface(page.locator('.link-editor-sheet'));

  const target = page.locator('.link-target-choice').first();
  await activate(target, testInfo);
  await expect(target).toHaveAttribute('aria-pressed', 'true');

  const relation = page.locator(
    '.link-relation-choice:not([disabled])',
  ).first();
  await expect(relation).toBeVisible();
  await activate(relation, testInfo);
  await expect(page.locator('.link-editor-backdrop')).toBeHidden();
  await expect(page.locator('.link-connection')).toHaveCount(linkCount + 1);

  await activate(page.locator('.remix-button'), testInfo);
  await waitForSurface(page.locator('.magic-intent-sheet'));
  await activate(
    page.locator('[data-magic-intent="surprise"]'),
    testInfo,
  );
  await expect(page.locator('.magic-preview-bar')).toBeVisible();
  await activate(page.locator('[data-magic-keep]'), testInfo);
  await expect(page.locator('.magic-preview-bar')).toBeHidden();

  await stopPlayback(page);

  await snapshotOrb.focus();
  await snapshotOrb.press('Enter');
  await expect(page.locator('.selection-panel')).toBeVisible();
  await activate(page.locator('[data-action="motion"]'), testInfo);
  await waitForSurface(page.locator('.motion-sheet'));
  await activate(
    page.locator('[data-motion-mode="still"]'),
    testInfo,
  );
  await expect(
    page.locator('[data-motion-mode="still"]'),
  ).toHaveAttribute('aria-pressed', 'true');
  await activate(page.locator('[data-motion-close]'), testInfo);

  await activate(page.locator('.snapshots-button'), testInfo);
  await waitForSurface(page.locator('.snapshot-sheet'));

  page.once('dialog', async (dialog) => {
    await dialog.accept('RC Snapshot');
  });
  await activate(page.locator('[data-snapshot-save]'), testInfo);
  await expect(page.locator('.snapshot-row')).toHaveCount(1);
  await expect(page.locator('.snapshot-recall strong')).toHaveText(
    'RC Snapshot',
  );

  const snapshotX = Number(
    await page.locator('.sound-orb').first().getAttribute('data-x'),
  );

  await activate(page.locator('[data-snapshot-close]'), testInfo);
  await page.locator('.sound-orb').first().focus();
  await page.locator('.sound-orb').first().press('ArrowLeft');

  await expect.poll(async () => (
    Number(await page.locator('.sound-orb').first().getAttribute('data-x'))
  )).not.toBe(snapshotX);

  await activate(page.locator('.snapshots-button'), testInfo);
  await waitForSurface(page.locator('.snapshot-sheet'));
  await activate(page.locator('.snapshot-recall').first(), testInfo);
  await expect(page.locator('.snapshot-backdrop')).toBeHidden();

  await expect.poll(async () => (
    Math.abs(
      Number(
        await page.locator('.sound-orb').first().getAttribute('data-x'),
      ) - snapshotX
    )
  )).toBeLessThan(0.0001);

  await expect(
    page.locator('[data-autosave-status]'),
  ).toHaveText('Saved');

  const persistedCounts = {
    sounds: await page.locator('.sound-orb').count(),
    fields: await page.locator('.effect-field').count(),
    toys: await page.locator('.playground-toy').count(),
    links: await page.locator('.link-connection').count(),
  };

  await page.reload();

  await expect(page.locator('.playground-shell')).toBeVisible();
  await expect(page.locator('[data-play]')).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await expect(page.locator('.sound-orb')).toHaveCount(
    persistedCounts.sounds,
  );
  await expect(page.locator('.effect-field')).toHaveCount(
    persistedCounts.fields,
  );
  await expect(page.locator('.playground-toy')).toHaveCount(
    persistedCounts.toys,
  );
  await expect(page.locator('.link-connection')).toHaveCount(
    persistedCounts.links,
  );

  await activate(page.locator('.snapshots-button'), testInfo);
  await waitForSurface(page.locator('.snapshot-sheet'));
  await expect(page.locator('.snapshot-row')).toHaveCount(1);

  const downloadPromise = page.waitForEvent('download');
  await activate(page.locator('[data-world-backup]'), testInfo);
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.json$/);

  await activate(page.locator('[data-snapshot-close]'), testInfo);
  await activate(page.locator('[data-home]'), testInfo);

  await expect(page.locator('.home-shell')).toBeVisible();
  await expect(page.locator('.world-library-open').first()).toBeVisible();
  await activate(page.locator('.world-library-open').first(), testInfo);
  await expect(page.locator('.playground-shell')).toBeVisible();

  await expectNoFatalShell(page);
  expect(pageErrors).toEqual([]);
});

test('presentation mode frames the World without changing creative coordinates', async ({
  page,
}, testInfo) => {
  await openStarter(page, testInfo, 'weird');
  await stopPlayback(page);

  const shell = page.locator('.playground-shell');
  const orb = page.locator('.sound-orb').first();
  const before = {
    x: await orb.getAttribute('data-x'),
    y: await orb.getAttribute('data-y'),
  };

  await activate(page.locator('[data-presentation-enter]'), testInfo);
  await expect(shell).toHaveAttribute('data-presentation', 'true');
  await expect(page.locator('[data-presentation-exit]')).toBeVisible();

  const rendererMode = await shell.getAttribute(
    'data-presentation-renderer',
  );
  expect(['v2', 'fallback']).toContain(rendererMode);

  const cameraSurface = rendererMode === 'v2'
    ? page.locator('.world-renderer-v2')
    : page.locator('.presentation-dom-stage');
  const transform = await cameraSurface.evaluate(
    (element) => getComputedStyle(element).transform,
  );
  expect(transform).not.toBe('none');

  await expect(page.locator('.world-canvas')).toHaveCSS(
    'transform',
    'none',
  );
  await expect(page.locator('.playground-dock')).toHaveCSS(
    'transform',
    'none',
  );

  if (rendererMode === 'fallback') {
    await expect(page.locator('.presentation-dom-stage')).toHaveAttribute(
      'inert',
      '',
    );
  }

  if (isTouchProject(testInfo)) {
    const box = await page.locator('[data-presentation-exit]').boundingBox();
    expect(box).not.toBeNull();

    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(48);
      expect(box.height).toBeGreaterThanOrEqual(48);
    }
  }

  await activate(page.locator('[data-presentation-exit]'), testInfo);
  await expect(shell).not.toHaveAttribute('data-presentation', 'true');
  await expect(orb).toHaveAttribute('data-x', before.x ?? '');
  await expect(orb).toHaveAttribute('data-y', before.y ?? '');
  await expectNoFatalShell(page);
});

test('compact viewport keeps the primary visual shell bounded', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium-desktop',
    'Canonical compact-layout stress is certified in Chromium.',
  );

  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('./');
  await expect(page.locator('.home-shell')).toBeVisible();

  const homeOverflow = await page.evaluate(() => (
    document.documentElement.scrollWidth - window.innerWidth
  ));
  expect(homeOverflow).toBeLessThanOrEqual(1);

  await openStarter(page, testInfo, 'chill');
  const viewport = page.viewportSize();
  const canvas = await page.locator('.world-canvas').boundingBox();

  expect(viewport).not.toBeNull();
  expect(canvas).not.toBeNull();

  if (viewport && canvas) {
    expect(canvas.x).toBeGreaterThanOrEqual(0);
    expect(canvas.x + canvas.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(canvas.y + canvas.height).toBeLessThanOrEqual(viewport.height + 1);
  }

  const playgroundOverflow = await page.evaluate(() => (
    document.documentElement.scrollWidth - window.innerWidth
  ));
  expect(playgroundOverflow).toBeLessThanOrEqual(1);
  await expectNoFatalShell(page);
});

test('forced colors and Reduce Motion keep presentation semantic and static', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium-desktop',
    'Canonical accessibility media stress is certified in Chromium.',
  );

  await page.emulateMedia({
    forcedColors: 'active',
    reducedMotion: 'reduce',
  });
  await openStarter(page, testInfo, 'weird');
  await stopPlayback(page);

  const shell = page.locator('.playground-shell');
  await expect(shell).toHaveAttribute('data-reduce-motion', 'true');
  await expect(page.locator('.world-renderer-v2')).toHaveCSS('opacity', '0');
  await expect(page.locator('.sound-orb .orb-visual').first()).toHaveCSS(
    'opacity',
    '1',
  );

  await activate(page.locator('[data-presentation-enter]'), testInfo);
  const stage = page.locator('.presentation-dom-stage');
  await expect(stage).toHaveCSS('opacity', '1');

  const firstTransform = await stage.evaluate(
    (element) => getComputedStyle(element).transform,
  );
  await page.waitForTimeout(350);
  const secondTransform = await stage.evaluate(
    (element) => getComputedStyle(element).transform,
  );

  expect(firstTransform).not.toBe('none');
  expect(secondTransform).toBe(firstTransform);

  await activate(page.locator('[data-presentation-exit]'), testInfo);
  await expectNoFatalShell(page);
});

test('system reduced motion updates live and is explained in visual settings', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium-desktop',
    'Canonical live accessibility preference stress is certified in Chromium.',
  );

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await openStarter(page, testInfo, 'chill');

  const shell = page.locator('.playground-shell');
  await expect(shell).toHaveAttribute('data-reduce-motion', 'false');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(shell).toHaveAttribute('data-reduce-motion', 'true');

  await activate(
    page.locator('[aria-label="Visual settings"]'),
    testInfo,
  );
  const motion = page.locator('[data-reduce-motion]');
  await expect(motion).toBeChecked();
  await expect(motion).toBeDisabled();
  await expect(page.locator('[data-system-motion-note]')).toBeVisible();

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(shell).toHaveAttribute('data-reduce-motion', 'false');
  await expect(motion).toBeEnabled();
  await expect(page.locator('[data-system-motion-note]')).toBeHidden();
});

test('high contrast and grayscale preserve keyboard and selected-state redundancy', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium-desktop',
    'Canonical non-color state certification is certified in Chromium.',
  );

  await page.emulateMedia({ contrast: 'more' });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;

    HTMLCanvasElement.prototype.getContext = function getContext(
      contextId,
      ...args
    ) {
      if (
        contextId === '2d'
        || contextId === 'webgl'
        || contextId === 'webgl2'
      ) {
        return null;
      }

      return original.call(this, contextId, ...args);
    };
  });

  await openStarter(page, testInfo, 'beat');
  await stopPlayback(page);

  const orb = page.locator('.sound-orb').first();
  await orb.focus();
  await page.keyboard.press('ArrowRight');

  await expect(orb).toBeFocused();
  await expect(orb).toHaveAttribute('aria-pressed', 'true');

  const focusVisible = await orb.evaluate(
    (element) => element.matches(':focus-visible'),
  );
  expect(focusVisible).toBe(true);

  const outlineWidth = await orb.evaluate(
    (element) => Number.parseFloat(getComputedStyle(element).outlineWidth),
  );
  expect(outlineWidth).toBeGreaterThanOrEqual(3);

  await page.evaluate(() => {
    document.documentElement.style.filter = 'grayscale(1)';
  });

  const selectedRingWidth = await orb.locator('.orb-visual').evaluate(
    (element) => Number.parseFloat(
      getComputedStyle(element, '::after').borderTopWidth,
    ),
  );
  expect(selectedRingWidth).toBeGreaterThanOrEqual(1);
  await expectNoFatalShell(page);
});

test('reduced particles and glow remain effective in semantic fallback visuals', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium-desktop',
    'Canonical reduced-effects fallback certification is certified in Chromium.',
  );

  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;

    HTMLCanvasElement.prototype.getContext = function getContext(
      contextId,
      ...args
    ) {
      if (
        contextId === '2d'
        || contextId === 'webgl'
        || contextId === 'webgl2'
      ) {
        return null;
      }

      return original.call(this, contextId, ...args);
    };
  });

  await openStarter(page, testInfo, 'weird');
  const shell = page.locator('.playground-shell');

  await activate(
    page.locator('[aria-label="Visual settings"]'),
    testInfo,
  );
  await page.locator('[data-reduce-particles]').check();
  await page.locator('[data-reduce-bloom]').check();

  await expect(shell).toHaveAttribute('data-reduce-particles', 'true');
  await expect(shell).toHaveAttribute('data-reduce-bloom', 'true');

  const bloom = await shell.evaluate(
    (element) => getComputedStyle(element).getPropertyValue('--visual-bloom'),
  );
  expect(Number.parseFloat(bloom)).toBeLessThanOrEqual(0.22);

  await expect(page.locator('.orb-visual').first()).toHaveCSS(
    'filter',
    'none',
  );
  await expectNoFatalShell(page);
});

test('renderer-less compatibility presentation remains fully usable', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium-desktop',
    'Canonical renderer-less fallback is certified in Chromium.',
  );

  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;

    HTMLCanvasElement.prototype.getContext = function getContext(
      contextId,
      ...args
    ) {
      if (
        contextId === '2d'
        || contextId === 'webgl'
        || contextId === 'webgl2'
      ) {
        return null;
      }

      return original.call(this, contextId, ...args);
    };
  });

  await openStarter(page, testInfo, 'beat');
  await stopPlayback(page);

  const shell = page.locator('.playground-shell');
  await expect(shell).toHaveAttribute('data-renderer-v2', 'none');
  await activate(page.locator('[data-presentation-enter]'), testInfo);
  await expect(shell).toHaveAttribute('data-presentation-renderer', 'fallback');

  const stage = page.locator('.presentation-dom-stage');
  await expect(stage).toHaveAttribute('inert', '');
  const transform = await stage.evaluate(
    (element) => getComputedStyle(element).transform,
  );
  expect(transform).not.toBe('none');

  await expect(page.locator('.playground-dock')).toHaveCSS(
    'transform',
    'none',
  );
  await activate(page.locator('[data-presentation-exit]'), testInfo);
  await expectNoFatalShell(page);
});

test('recording either completes or degrades with an explicit unsupported state', async ({
  page,
}, testInfo) => {
  const playing = await openStarter(page, testInfo, 'dreamy');

  const recordButton = page.locator('[data-capture-record]');
  await expect(recordButton).toBeVisible();

  if (await recordButton.isDisabled()) {
    await expect(recordButton).toHaveAttribute(
      'title',
      /not supported/i,
    );
    return;
  }

  await activate(recordButton, testInfo);

  if (!playing) {
    await expect(page.locator('#app')).toHaveAttribute(
      'data-capture-status',
      'error',
      { timeout: 8_000 },
    );
    await expect(page.locator('.world-hint[data-status]')).toContainText(
      /Recording could not start because audio is not running/i,
    );
    return;
  }

  await expect(page.locator('#app')).toHaveAttribute(
    'data-capture-status',
    'recording',
  );

  await page.waitForTimeout(250);
  await activate(recordButton, testInfo);

  await expect(page.locator('#app')).toHaveAttribute(
    'data-capture-status',
    'ready',
    { timeout: 15_000 },
  );
  await waitForSurface(page.locator('.capture-result-sheet'));

  const downloadPromise = page.waitForEvent('download');
  await activate(page.locator('[data-capture-download]'), testInfo);
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(
    /\.(webm|ogg|m4a)$/i,
  );

  await activate(page.locator('[data-capture-discard]'), testInfo);
  await expect(page.locator('.capture-result-backdrop')).toBeHidden();
});

test('production service-worker shell reopens offline', async ({
  context,
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium-desktop',
    'Canonical offline smoke is certified in Chromium.',
  );

  await page.goto('./');
  await expect(page.locator('.home-shell')).toBeVisible();

  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are unavailable.');
    }

    await navigator.serviceWorker.ready;
  });

  await page.reload();
  await expect.poll(async () => page.evaluate(
    () => Boolean(navigator.serviceWorker.controller),
  )).toBe(true);

  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.home-shell')).toBeVisible();
  await expect(page.locator('.pwa-offline-badge')).toBeVisible();

  await context.setOffline(false);
});

test('touch layouts keep primary sheets inside the viewport', async ({
  page,
}, testInfo) => {
  const touchProject = (
    testInfo.project.name === 'android-chromium'
    || testInfo.project.name === 'ios-webkit'
    || testInfo.project.name === 'ipad-webkit'
  );

  test.skip(!touchProject, 'Touch-layout check only.');

  await openStarter(page, testInfo, 'chill');

  const topbarButtons = page.locator(
    '.playground-topbar-actions button:visible',
  );
  const topbarCount = await topbarButtons.count();

  for (let index = 0; index < topbarCount; index += 1) {
    const box = await topbarButtons.nth(index).boundingBox();
    expect(box).not.toBeNull();

    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  }

  const updateBanner = page.locator('.pwa-update-banner');
  await updateBanner.evaluate((element) => {
    element.hidden = false;
  });
  await expect(updateBanner).toBeVisible();

  const updateBox = await updateBanner.boundingBox();
  const presentBox = await page.locator(
    '[data-presentation-enter]',
  ).boundingBox();

  expect(updateBox).not.toBeNull();
  expect(presentBox).not.toBeNull();

  if (updateBox && presentBox) {
    const overlaps = !(
      updateBox.x + updateBox.width <= presentBox.x
      || presentBox.x + presentBox.width <= updateBox.x
      || updateBox.y + updateBox.height <= presentBox.y
      || presentBox.y + presentBox.height <= updateBox.y
    );

    expect(overlaps).toBe(false);
  }

  await updateBanner.evaluate((element) => {
    element.hidden = true;
  });

  await activate(page.locator('.effects-button'), testInfo);
  const sheet = page.locator('.effect-palette-sheet');
  await waitForSurface(sheet);

  const box = await sheet.boundingBox();
  const viewport = page.viewportSize();

  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();

  if (box && viewport) {
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(
      viewport.width + 1,
    );
    expect(box.y + box.height).toBeLessThanOrEqual(
      viewport.height + 1,
    );
  }

  await page.locator('[data-effects-close]').click();
  await activate(page.locator('.sound-orb').first(), testInfo);

  const selectionPanel = page.locator('.selection-panel');
  const dock = page.locator('.playground-dock');

  await expect(selectionPanel).toBeVisible();
  await expect(dock).toBeVisible();

  const selectionBox = await selectionPanel.boundingBox();
  const dockBox = await dock.boundingBox();

  expect(selectionBox).not.toBeNull();
  expect(dockBox).not.toBeNull();

  if (selectionBox && dockBox) {
    expect(
      selectionBox.y + selectionBox.height,
    ).toBeLessThanOrEqual(dockBox.y - 1);
  }

  await activate(page.locator('[data-add]'), testInfo);
  await waitForSurface(page.locator('.palette-sheet'));
});
