import { describe, expect, it } from 'vitest';
import { CORE_SOUND_CATALOG, soundsByRole } from '../src/core/sounds/coreCatalog';

describe('core sound catalog', () => {
  it('contains unique ids and human-readable names', () => {
    const ids = CORE_SOUND_CATALOG.map((sound) => sound.id);
    const names = CORE_SOUND_CATALOG.map((sound) => sound.name);

    expect(new Set(ids).size).toBe(ids.length);
    expect(names.every((name) => name.trim().length > 0)).toBe(true);
  });

  it('provides the roles needed for the Phase 2 integration groove', () => {
    expect(soundsByRole('beat').length).toBeGreaterThan(0);
    expect(soundsByRole('percussion').length).toBeGreaterThan(0);
    expect(soundsByRole('bass').length).toBeGreaterThan(0);
    expect(soundsByRole('harmony').length).toBeGreaterThan(0);
    expect(soundsByRole('melody').length).toBeGreaterThan(0);
    expect(soundsByRole('texture').length).toBeGreaterThan(0);
  });

  it('keeps friendly sound descriptions instead of filenames', () => {
    for (const sound of CORE_SOUND_CATALOG) {
      expect(sound.name).not.toMatch(/\.(wav|mp3|flac)$/i);
      expect(sound.description.length).toBeGreaterThan(5);
    }
  });
});
