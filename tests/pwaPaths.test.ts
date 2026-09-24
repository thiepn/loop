import { describe, expect, it } from 'vitest';
import {
  normalizePwaBaseUrl,
  pwaManifestUrl,
  pwaServiceWorkerScope,
  pwaServiceWorkerUrl,
} from '../src/core/platform/PwaPaths';

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
