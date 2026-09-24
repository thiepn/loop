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

async function stopPlayback(page, testInfo) {
  const play = page.locator('[data-play]');

  if (await play.getAttribute('aria-pressed') === 'true') {
    await activate(play, testInfo);
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

  await stopPlayback(page, testInfo);

  await activate(page.locator('.sound-orb').first(), testInfo);
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
