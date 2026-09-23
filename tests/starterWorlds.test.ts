import { describe, expect, it } from 'vitest';
import {
  STARTER_WORLDS,
  createStarterWorld,
  createSurpriseWorld,
} from '../src/core/world/StarterWorlds';
import { soundById } from '../src/core/sounds/coreCatalog';

describe('starter Worlds', () => {
  it('offers the six locked starting directions', () => {
    expect(STARTER_WORLDS.map((world) => world.id)).toEqual([
      'beat',
      'chill',
      'dreamy',
      'dance',
      'weird',
      'empty',
    ]);
  });

  it('keeps every non-empty starter immediately playable', () => {
    for (const definition of STARTER_WORLDS) {
      const world = createStarterWorld(definition.id, 100);

      if (definition.id === 'empty') {
        expect(world.soundOrbs).toHaveLength(0);
        continue;
      }

      expect(world.soundOrbs.length).toBeGreaterThanOrEqual(5);

      for (const orb of world.soundOrbs) {
        expect(soundById(orb.soundId)).toBeDefined();
      }

      expect(world.effectFields.length).toBeGreaterThanOrEqual(1);
      expect(world.effectFields.length).toBeLessThanOrEqual(5);
      expect(new Set(world.effectFields.map((field) => field.type)).size).toBe(
        world.effectFields.length,
      );
    }
  });

  it('creates deterministic surprise choices for the same seed', () => {
    const first = createSurpriseWorld(42, 100);
    const second = createSurpriseWorld(42, 100);

    expect(first.name).toBe(second.name);
    expect(first.music).toEqual(second.music);
    expect(first.soundOrbs).toEqual(second.soundOrbs);
  });
});
