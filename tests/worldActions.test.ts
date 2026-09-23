import { describe, expect, it } from 'vitest';
import { createDefaultPattern } from '../src/core/music/Pattern';
import { createMotion } from '../src/core/world/Motion';
import { soundById } from '../src/core/sounds/coreCatalog';
import { createEmptyWorld } from '../src/core/world/World';
import { createSoundOrb, MAX_SOUND_ORBS } from '../src/core/world/SoundOrb';
import {
  addSoundOrb,
  deleteSoundOrb,
  duplicateSoundOrb,
  moveSoundOrb,
  replaceSoundOrb,
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

  it('duplicates edited pattern state', () => {
    const pattern = createDefaultPattern('kick-steady');
    expect(pattern?.kind).toBe('rhythm');

    const world = createEmptyWorld({
      id: 'pattern-world',
      now: 100,
      soundOrbs: [
        createSoundOrb({
          id: 'orb-a',
          soundId: 'beat-round-kick',
          role: 'beat',
          position: { x: 0.2, y: 0.3 },
          pattern: pattern!,
        }),
      ],
    });

    const result = duplicateSoundOrb(world, 'orb-a', 200);

    expect(result.world.soundOrbs[1]?.pattern).toEqual(pattern);
  });

  it('duplicates Motion state with the musical idea', () => {
    const world = createEmptyWorld({
      id: 'motion-world',
      now: 100,
      soundOrbs: [
        createSoundOrb({
          id: 'orb-a',
          soundId: 'melody-soft-pluck',
          role: 'melody',
          position: { x: 0.2, y: 0.3 },
          motion: createMotion({
            mode: 'wander',
            speed: 'slow',
            range: 'wide',
            seed: 22,
          }),
        }),
      ],
    });

    const result = duplicateSoundOrb(world, 'orb-a', 200);

    expect(result.world.soundOrbs[1]?.motion).toEqual(
      world.soundOrbs[0]?.motion,
    );
  });

  it('preserves Motion when changing the sound', () => {
    const motion = createMotion({
      mode: 'orbit',
      speed: 'medium',
      range: 'tight',
      seed: 7,
    });
    const world = createEmptyWorld({
      id: 'motion-world',
      now: 100,
      soundOrbs: [
        createSoundOrb({
          id: 'orb-a',
          soundId: 'bass-warm',
          role: 'bass',
          position: { x: 0.2, y: 0.3 },
          motion,
        }),
      ],
    });
    const replacement = soundById('bass-deep');
    expect(replacement).toBeDefined();

    const changed = replaceSoundOrb(world, 'orb-a', replacement!, 200);

    expect(changed.soundOrbs[0]?.motion).toEqual(motion);
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

  it('adds a palette sound at a safe suggested position', () => {
    const bass = soundById('bass-warm');
    expect(bass).toBeDefined();

    const result = addSoundOrb(makeWorld(), bass!, 200);

    expect(result.createdId).not.toBeNull();
    expect(result.world.soundOrbs).toHaveLength(2);
    expect(result.world.soundOrbs[1]?.soundId).toBe('bass-warm');
    expect(result.world.soundOrbs[1]?.role).toBe('bass');
  });

  it('replaces sound identity while preserving the orb itself', () => {
    const bass = soundById('bass-deep');
    expect(bass).toBeDefined();

    const original = makeWorld();
    const replaced = replaceSoundOrb(original, 'orb-a', bass!, 200);

    expect(replaced.soundOrbs[0]).toMatchObject({
      id: 'orb-a',
      soundId: 'bass-deep',
      role: 'bass',
      position: { x: 0.2, y: 0.3 },
      muted: false,
    });
  });

  it('preserves custom rhythm when changing between rhythm sounds', () => {
    const pattern = createDefaultPattern('kick-steady');
    expect(pattern?.kind).toBe('rhythm');

    const world = createEmptyWorld({
      id: 'pattern-world',
      now: 100,
      soundOrbs: [
        createSoundOrb({
          id: 'orb-a',
          soundId: 'beat-round-kick',
          role: 'beat',
          position: { x: 0.2, y: 0.3 },
          pattern: pattern!,
        }),
      ],
    });
    const shaker = soundById('perc-dust-shaker');
    expect(shaker).toBeDefined();

    const replaced = replaceSoundOrb(world, 'orb-a', shaker!, 200);

    expect(replaced.soundOrbs[0]?.pattern).toEqual(pattern);
  });

  it('drops incompatible custom pattern when changing rhythm to melody', () => {
    const pattern = createDefaultPattern('kick-steady');
    const world = createEmptyWorld({
      id: 'pattern-world',
      now: 100,
      soundOrbs: [
        createSoundOrb({
          id: 'orb-a',
          soundId: 'beat-round-kick',
          role: 'beat',
          position: { x: 0.2, y: 0.3 },
          pattern: pattern!,
        }),
      ],
    });
    const bass = soundById('bass-warm');
    expect(bass).toBeDefined();

    const replaced = replaceSoundOrb(world, 'orb-a', bass!, 200);

    expect(replaced.soundOrbs[0]?.pattern).toBeUndefined();
  });
});
