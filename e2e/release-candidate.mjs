import {
  expect,
  test,
} from '@playwright/test';

async function expectNoFatalShell(page) {
  await expect(page.locator('.fatal-shell')).toHaveCount(0);
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
    await play.click();
    await expect(play).toHaveAttribute('aria-pressed', 'false');
  }
}

async function openStarter(page, starter = 'beat') {
  await page.goto('./');
  await expect(page.locator('.home-shell')).toBeVisible();
  await expectNoFatalShell(page);

  await page.locator(`[data-starter="${starter}"]`).click();

  await expect(page.locator('.playground-shell')).toBeVisible();
  await expect(page.locator('.sound-orb').first()).toBeVisible();
  await expect(page.locator('[data-play]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
}

test('complete clean-user V1 workflow survives the release-candidate matrix', async ({
  page,
}) => {
  const pageErrors = [];
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  await openStarter(page, 'beat');

  const initialSoundCount = await page.locator('.sound-orb').count();
  const firstOrb = page.locator('.sound-orb').first();

  await firstOrb.click();
  await expect(page.locator('.selection-panel')).toBeVisible();

  const initialX = Number(await firstOrb.getAttribute('data-x'));
  await firstOrb.focus();
  await firstOrb.press('ArrowRight');

  await expect.poll(async () => (
    Number(await page.locator('.sound-orb').first().getAttribute('data-x'))
  )).toBeGreaterThan(initialX);

  await page.locator('[data-action="pattern"]').click();
  await waitForSurface(page.locator('.pattern-sheet'));

  const firstStep = page.locator('.rhythm-step').first();
  const stepBefore = await firstStep.getAttribute('aria-pressed');
  await firstStep.click();
  await expect(firstStep).toHaveAttribute(
    'aria-pressed',
    stepBefore === 'true' ? 'false' : 'true',
  );
  await page.locator('[data-pattern-close]').click();
  await expect(page.locator('.pattern-backdrop')).toBeHidden();

  await page.locator('[data-add]').click();
  await waitForSurface(page.locator('.palette-sheet'));
  await page.locator('.sound-choice').first().click();
  await expect(page.locator('.sound-orb')).toHaveCount(initialSoundCount + 1);

  const fieldCount = await page.locator('.effect-field').count();
  await page.locator('.effects-button').click();
  await waitForSurface(page.locator('.effect-palette-sheet'));
  await page.locator('.effect-choice:not([disabled])').first().click();
  await expect(page.locator('.effect-field')).toHaveCount(fieldCount + 1);

  const toyCount = await page.locator('.playground-toy').count();
  await page.locator('.toys-button').click();
  await waitForSurface(page.locator('.toy-palette-sheet'));
  await page.locator('.toy-choice:not([disabled])').first().click();
  await expect(page.locator('.playground-toy')).toHaveCount(toyCount + 1);

  await page.locator('.sound-orb').first().click();
  await page.locator('[data-action="motion"]').click();
  await waitForSurface(page.locator('.motion-sheet'));
  await page.locator('[data-motion-mode="orbit"]').click();
  await expect(
    page.locator('[data-motion-mode="orbit"]'),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-motion-close]').click();

  const linkCount = await page.locator('.link-connection').count();
  await expect(page.locator('.selection-panel')).toBeVisible();
  await page.locator('[data-action="link"]').click();
  await waitForSurface(page.locator('.link-editor-sheet'));

  const target = page.locator('.link-target-choice').first();
  await target.click();
  await expect(target).toHaveAttribute('aria-pressed', 'true');

  const relation = page.locator(
    '.link-relation-choice:not([disabled])',
  ).first();
  await expect(relation).toBeVisible();
  await relation.click();
  await expect(page.locator('.link-editor-backdrop')).toBeHidden();
  await expect(page.locator('.link-connection')).toHaveCount(linkCount + 1);

  await page.locator('.remix-button').click();
  await waitForSurface(page.locator('.magic-intent-sheet'));
  await page.locator(
    '[data-magic-intent="surprise"]',
  ).click();
  await expect(page.locator('.magic-preview-bar')).toBeVisible();
  await page.locator('[data-magic-keep]').click();
  await expect(page.locator('.magic-preview-bar')).toBeHidden();

  await stopPlayback(page);

  await page.locator('.snapshots-button').click();
  await waitForSurface(page.locator('.snapshot-sheet'));

  page.once('dialog', async (dialog) => {
    await dialog.accept('RC Snapshot');
  });
  await page.locator('[data-snapshot-save]').click();
  await expect(page.locator('.snapshot-row')).toHaveCount(1);
  await expect(page.locator('.snapshot-recall strong')).toHaveText(
    'RC Snapshot',
  );

  const snapshotX = Number(
    await page.locator('.sound-orb').first().getAttribute('data-x'),
  );

  await page.locator('[data-snapshot-close]').click();
  await page.locator('.sound-orb').first().focus();
  await page.locator('.sound-orb').first().press('ArrowLeft');

  await expect.poll(async () => (
    Number(await page.locator('.sound-orb').first().getAttribute('data-x'))
  )).not.toBe(snapshotX);

  await page.locator('.snapshots-button').click();
  await waitForSurface(page.locator('.snapshot-sheet'));
  await page.locator('.snapshot-recall').first().click();
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

  await page.locator('.snapshots-button').click();
  await waitForSurface(page.locator('.snapshot-sheet'));
  await expect(page.locator('.snapshot-row')).toHaveCount(1);

  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-world-backup]').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.json$/);

  await page.locator('[data-snapshot-close]').click();
  await page.locator('[data-home]').click();

  await expect(page.locator('.home-shell')).toBeVisible();
  await expect(page.locator('.world-library-open').first()).toBeVisible();
  await page.locator('.world-library-open').first().click();
  await expect(page.locator('.playground-shell')).toBeVisible();

  await expectNoFatalShell(page);
  expect(pageErrors).toEqual([]);
});

test('recording either completes or degrades with an explicit unsupported state', async ({
  page,
}) => {
  await openStarter(page, 'dreamy');

  const recordButton = page.locator('[data-capture-record]');
  await expect(recordButton).toBeVisible();

  if (await recordButton.isDisabled()) {
    await expect(recordButton).toHaveAttribute(
      'title',
      /not supported/i,
    );
    return;
  }

  await recordButton.click();
  await expect(page.locator('#app')).toHaveAttribute(
    'data-capture-status',
    'recording',
  );

  await page.waitForTimeout(250);
  await recordButton.click();

  await expect(page.locator('#app')).toHaveAttribute(
    'data-capture-status',
    'ready',
    { timeout: 15_000 },
  );
  await waitForSurface(page.locator('.capture-result-sheet'));

  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-capture-download]').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(
    /\.(webm|ogg|m4a)$/i,
  );

  await page.locator('[data-capture-discard]').click();
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

  await openStarter(page, 'chill');

  await page.locator('.effects-button').click();
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
  await page.locator('.sound-orb').first().click();

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

  await page.locator('[data-add]').click();
  await waitForSurface(page.locator('.palette-sheet'));
});
