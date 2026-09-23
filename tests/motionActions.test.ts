import { describe, expect, it } from 'vitest';
import {
  setOrbFollowTarget,
  setOrbMotionMode,
  setOrbMotionRange,
  setOrbMotionSpeed,
} from '../src/core/world/MotionActions';
import { createSoundOrb } from '../src/core/world/SoundOrb';
import { createEmptyWorld } from '../src/core/world/World';

function worldWithTwoOrbs() {
  return createEmptyWorld({
    id: 'motion-world',
    music: { seed: 12 },
    soundOrbs: [
      createSoundOrb({
        id: 'a',
        soundId: 'bass-warm',
        role: 'bass',
        position: { x: 0.2, y: 0.5 },
      }),
      createSoundOrb({
        id: 'b',
        soundId: 'melody-soft-pluck',
        role: 'melody',
        position: { x: 0.7, y: 0.5 },
      }),
    ],
  });
}

describe('MotionActions', () => {
  it('adds and removes Motion without changing the saved anchor', () => {
    const world = worldWithTwoOrbs();
    const moving = setOrbMotionMode(world, 'a', 'orbit', 200);
    const still = setOrbMotionMode(moving, 'a', 'still', 300);

    expect(moving.soundOrbs[0]?.motion?.mode).toBe('orbit');
    expect(moving.soundOrbs[0]?.position).toEqual({ x: 0.2, y: 0.5 });
    expect(still.soundOrbs[0]?.motion).toBeUndefined();
  });

  it('changes Speed and Range while preserving the motion mode', () => {
    let world = setOrbMotionMode(worldWithTwoOrbs(), 'a', 'wander');
    world = setOrbMotionSpeed(world, 'a', 'fast');
    world = setOrbMotionRange(world, 'a', 'wide');

    expect(world.soundOrbs[0]?.motion).toMatchObject({
      mode: 'wander',
      speed: 'fast',
      range: 'wide',
    });
  });

  it('assigns a valid explicit Follow target', () => {
    let world = setOrbMotionMode(worldWithTwoOrbs(), 'a', 'follow');
    world = setOrbFollowTarget(world, 'a', 'b');

    expect(world.soundOrbs[0]?.motion?.mode).toBe('follow');
    expect(world.soundOrbs[0]?.motion?.targetOrbId).toBe('b');
  });

  it('rejects following itself or a missing target', () => {
    const world = worldWithTwoOrbs();

    expect(setOrbFollowTarget(world, 'a', 'a')).toBe(world);
    expect(setOrbFollowTarget(world, 'a', 'missing')).toBe(world);
  });
});
