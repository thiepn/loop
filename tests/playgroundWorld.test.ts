import { describe, expect, it } from 'vitest';
import { createPhaseThreeWorld } from '../src/core/world/World';
import { soundById } from '../src/core/sounds/coreCatalog';

describe('Phase 3 starter World', () => {
  it('starts with six distinct playable Sound Orbs', () => {
    const world = createPhaseThreeWorld(123);

    expect(world.soundOrbs).toHaveLength(6);
    expect(new Set(world.soundOrbs.map((orb) => orb.id)).size).toBe(6);
  });

  it('uses valid built-in sounds and normalized positions', () => {
    const world = createPhaseThreeWorld(123);

    for (const orb of world.soundOrbs) {
      expect(soundById(orb.soundId)).toBeDefined();
      expect(orb.position.x).toBeGreaterThanOrEqual(0);
      expect(orb.position.x).toBeLessThanOrEqual(1);
      expect(orb.position.y).toBeGreaterThanOrEqual(0);
      expect(orb.position.y).toBeLessThanOrEqual(1);
    }
  });

  it('covers the core visual roles without duplicate sound ids', () => {
    const world = createPhaseThreeWorld(123);
    const roles = new Set(world.soundOrbs.map((orb) => orb.role));

    expect(roles).toEqual(new Set([
      'beat',
      'percussion',
      'bass',
      'harmony',
      'melody',
      'texture',
    ]));
    expect(new Set(world.soundOrbs.map((orb) => orb.soundId)).size).toBe(6);
  });
});
