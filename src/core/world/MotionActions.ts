import {
  createMotion,
  nearestFollowTarget,
  type MotionMode,
  type MotionRange,
  type MotionSpeed,
} from './Motion';
import type { WorldDocument } from './World';

function updateOrb(
  world: WorldDocument,
  orbId: string,
  updater: (orb: WorldDocument['soundOrbs'][number]) => WorldDocument['soundOrbs'][number],
  now: number,
): WorldDocument {
  let changed = false;

  const soundOrbs = world.soundOrbs.map((orb) => {
    if (orb.id !== orbId) {
      return orb;
    }

    changed = true;
    return updater(orb);
  });

  return changed
    ? {
        ...world,
        updatedAt: now,
        soundOrbs,
      }
    : world;
}

export function setOrbMotionMode(
  world: WorldDocument,
  orbId: string,
  mode: MotionMode,
  now = Date.now(),
): WorldDocument {
  return updateOrb(world, orbId, (orb) => {
    if (mode === 'still') {
      const { motion: _motion, ...withoutMotion } = orb;
      return withoutMotion;
    }

    const existing = orb.motion;
    const target = mode === 'follow'
      ? (
          existing?.targetOrbId
            ? world.soundOrbs.find((candidate) => candidate.id === existing.targetOrbId)
            : nearestFollowTarget(orb, world.soundOrbs)
        )
      : null;

    return {
      ...orb,
      motion: createMotion({
        mode,
        speed: existing?.speed,
        range: existing?.range,
        seed: existing?.seed ?? world.music.seed + orb.id.length * 17,
        targetOrbId: target?.id,
      }),
    };
  }, now);
}

export function setOrbMotionSpeed(
  world: WorldDocument,
  orbId: string,
  speed: MotionSpeed,
  now = Date.now(),
): WorldDocument {
  return updateOrb(world, orbId, (orb) => ({
    ...orb,
    motion: createMotion({
      mode: orb.motion?.mode ?? 'orbit',
      speed,
      range: orb.motion?.range,
      seed: orb.motion?.seed ?? world.music.seed + orb.id.length * 17,
      targetOrbId: orb.motion?.targetOrbId,
    }),
  }), now);
}

export function setOrbMotionRange(
  world: WorldDocument,
  orbId: string,
  range: MotionRange,
  now = Date.now(),
): WorldDocument {
  return updateOrb(world, orbId, (orb) => ({
    ...orb,
    motion: createMotion({
      mode: orb.motion?.mode ?? 'orbit',
      speed: orb.motion?.speed,
      range,
      seed: orb.motion?.seed ?? world.music.seed + orb.id.length * 17,
      targetOrbId: orb.motion?.targetOrbId,
    }),
  }), now);
}

export function setOrbFollowTarget(
  world: WorldDocument,
  orbId: string,
  targetOrbId: string,
  now = Date.now(),
): WorldDocument {
  if (orbId === targetOrbId || !world.soundOrbs.some((orb) => orb.id === targetOrbId)) {
    return world;
  }

  return updateOrb(world, orbId, (orb) => ({
    ...orb,
    motion: createMotion({
      mode: 'follow',
      speed: orb.motion?.speed,
      range: orb.motion?.range,
      seed: orb.motion?.seed ?? world.music.seed + orb.id.length * 17,
      targetOrbId,
    }),
  }), now);
}
