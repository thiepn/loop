import { describe, expect, it } from 'vitest';
import {
  normalizePwaBaseUrl,
  pwaManifestUrl,
  pwaServiceWorkerScope,
  pwaServiceWorkerUrl,
} from '../src/core/platform/PwaPaths';
import {
  isIosLikePlatform,
  shouldOfferManualInstall,
} from '../src/core/platform/PwaController';

describe('PwaPaths', () => {
  it('keeps the canonical GitHub Pages project base', () => {
    expect(normalizePwaBaseUrl('/loop/')).toBe('/loop/');
    expect(pwaServiceWorkerScope('/loop/')).toBe('/loop/');
    expect(pwaServiceWorkerUrl('/loop/')).toBe('/loop/sw.js');
    expect(pwaManifestUrl('/loop/')).toBe('/loop/manifest.webmanifest');
  });

  it('repairs missing leading/trailing slashes', () => {
    expect(normalizePwaBaseUrl('loop')).toBe('/loop/');
    expect(normalizePwaBaseUrl('/loop')).toBe('/loop/');
  });

  it('does not leak the worker to site root scope', () => {
    expect(pwaServiceWorkerScope('/loop/')).not.toBe('/');
    expect(pwaServiceWorkerUrl('/loop/').startsWith('/loop/')).toBe(true);
  });
});

describe('PWA install platform policy', () => {
  it('detects iPhone/iPad style platforms', () => {
    expect(isIosLikePlatform({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
      platform: 'iPhone',
      maxTouchPoints: 5,
      standalone: false,
    })).toBe(true);

    expect(isIosLikePlatform({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)',
      platform: 'MacIntel',
      maxTouchPoints: 5,
      standalone: false,
    })).toBe(true);
  });

  it('offers manual install guidance only when iOS is not already standalone', () => {
    expect(shouldOfferManualInstall({
      userAgent: 'Mozilla/5.0 (iPhone)',
      platform: 'iPhone',
      maxTouchPoints: 5,
      standalone: false,
    })).toBe(true);

    expect(shouldOfferManualInstall({
      userAgent: 'Mozilla/5.0 (iPhone)',
      platform: 'iPhone',
      maxTouchPoints: 5,
      standalone: true,
    })).toBe(false);
  });

  it('does not offer iOS instructions on ordinary desktop browsers', () => {
    expect(shouldOfferManualInstall({
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
      platform: 'Linux x86_64',
      maxTouchPoints: 0,
      standalone: false,
    })).toBe(false);
  });
});

