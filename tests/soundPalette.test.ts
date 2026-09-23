import { describe, expect, it } from 'vitest';
import {
  SOUND_PALETTE_CATEGORIES,
  paletteCategoryForRole,
  soundsForCategory,
  surpriseSoundForWorld,
} from '../src/core/sounds/SoundPalette';
import { createStarterWorld } from '../src/core/world/StarterWorlds';

describe('SoundPalette', () => {
  it('uses everyday category names', () => {
    expect(SOUND_PALETTE_CATEGORIES.map((category) => category.name)).toEqual([
      'Beat',
      'Bass',
      'Chords',
      'Melody',
      'Texture',
      'Voice',
    ]);
  });

  it('groups beat and percussion together for beginners', () => {
    const roles = new Set(soundsForCategory('beat').map((sound) => sound.role));

    expect(roles.has('beat')).toBe(true);
    expect(roles.has('percussion')).toBe(true);
  });

  it('maps technical harmony role to Chords', () => {
    expect(paletteCategoryForRole('harmony')).toBe('chords');
  });

  it('returns a deterministic unused surprise when possible', () => {
    const world = createStarterWorld('chill', 100);
    const first = surpriseSoundForWorld(world);
    const second = surpriseSoundForWorld(world);
    const used = new Set(world.soundOrbs.map((orb) => orb.soundId));

    expect(first?.id).toBe(second?.id);
    expect(first).not.toBeNull();
    expect(used.has(first!.id)).toBe(false);
  });
});
