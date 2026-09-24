import { defineConfig } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4173/loop/';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'release-candidate.mjs',
  timeout: 180_000,
  expect: {
    timeout: 8_000,
  },
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 5 : 1,
  reporter: process.env.CI ? [['line']] : [['list']],
  use: {
    baseURL,
    actionTimeout: 12_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'en-US',
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 900 },
        launchOptions: {
          args: ['--autoplay-policy=no-user-gesture-required'],
        },
      },
    },
    {
      name: 'firefox-desktop',
      use: {
        browserName: 'firefox',
        viewport: { width: 1440, height: 900 },
        launchOptions: {
          firefoxUserPrefs: {
            'media.autoplay.default': 0,
            'media.autoplay.blocking_policy': 0,
            'media.autoplay.block-webaudio': false,
            'media.block-autoplay-until-in-foreground': false,
          },
        },
      },
    },
    {
      name: 'android-chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 412, height: 915 },
        screen: { width: 412, height: 915 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2.625,
        userAgent: 'Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36',
        launchOptions: {
          args: ['--autoplay-policy=no-user-gesture-required'],
        },
      },
    },
    {
      name: 'ios-webkit',
      use: {
        browserName: 'webkit',
        viewport: { width: 390, height: 844 },
        screen: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 20_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/20.0 Mobile/15E148 Safari/604.1',
      },
    },
    {
      name: 'ipad-webkit',
      use: {
        browserName: 'webkit',
        viewport: { width: 1024, height: 1366 },
        screen: { width: 1024, height: 1366 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 20_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/20.0 Mobile/15E148 Safari/604.1',
      },
    },
  ],
});
