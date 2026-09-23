import { describe, expect, it } from 'vitest';
import { createEmptyWorld } from '../src/core/world/World';
import { createSoundOrb, MAX_SOUND_ORBS } from '../src/core/world/SoundOrb';
import {
  deleteSoundOrb,
  duplicateSoundOrb,
  moveSoundOrb,
  toggleSoundOrbMuted,
} from '../src/core/world/WorldActions';

function makeWorld() {
  return createEmptyWorld({
    id: 'test-world',
    now: 100,
    soundOrbs: [
      createSoundOrb({
        id: 'orb-a',
        soundId: 'beat-round-kick',
        role: 'beat',
        position: { x: 0.2, y: 0.3 },
      }),
    ],
  });
}

describe('WorldActions', () => {
  it('moves an orb and clamps normalized coordinates', () => {
    const moved = moveSoundOrb(makeWorld(), 'orb-a', { x: 1.4, y: -0.2 }, 200);

    expect(moved.soundOrbs[0]?.position).toEqual({ x: 1, y: 0 });
    expect(moved.updatedAt).toBe(200);
  });

  it('toggles mute without mutating the original World', () => {
    const original = makeWorld();
    const next = toggleSoundOrbMuted(original, 'orb-a', 200);

    expect(original.soundOrbs[0]?.muted).toBe(false);
    expect(next.soundOrbs[0]?.muted).toBe(true);
  });

  it('duplicates with a small spatial offset', () => {
    const original = makeWorld();
    const result = duplicateSoundOrb(original, 'orb-a', 200);

    expect(result.createdId).not.toBeNull();
    expect(result.world.soundOrbs).toHaveLength(2);
    expect(result.world.soundOrbs[1]?.soundId).toBe('beat-round-kick');
    expect(result.world.soundOrbs[1]?.position).toEqual({ x: 0.27, y: 0.36 });
  });

  it('enforces the V1 Sound Orb cap', () => {
    let world = makeWorld();

    while (world.soundOrbs.length < MAX_SOUND_ORBS) {
      world = duplicateSoundOrb(world, 'orb-a').world;
    }

    const blocked = duplicateSoundOrb(world, 'orb-a');

    expect(blocked.createdId).toBeNull();
    expect(blocked.world.soundOrbs).toHaveLength(MAX_SOUND_ORBS);
  });

  it('deletes only the requested orb', () => {
    const result = duplicateSoundOrb(makeWorld(), 'orb-a', 200);
    const duplicateId = result.createdId;
    expect(duplicateId).not.toBeNull();

    const cleaned = deleteSoundOrb(result.world, 'orb-a', 300);

    expect(cleaned.soundOrbs).toHaveLength(1);
    expect(cleaned.soundOrbs[0]?.id).toBe(duplicateId);
  });
});
