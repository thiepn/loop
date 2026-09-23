import { describe, expect, it } from 'vitest';
import { AssetLoader } from '../src/core/assets/AssetLoader';

describe('AssetLoader', () => {
  it('resolves repository-relative public assets under the GitHub Pages base path', () => {
    const loader = new AssetLoader('/loop/');

    expect(loader.resolve('sounds/kick.wav')).toBe('/loop/sounds/kick.wav');
    expect(loader.resolve('/sounds/kick.wav')).toBe('/loop/sounds/kick.wav');
  });

  it('normalizes missing slashes around the base path', () => {
    const loader = new AssetLoader('loop');

    expect(loader.resolve('icons/app.svg')).toBe('/loop/icons/app.svg');
  });
});
