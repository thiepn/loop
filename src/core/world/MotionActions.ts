import {
  createMotion,
  nearestFollowTarget,
  type MotionMode,
  type MotionRange,
  type MotionSpeed,
} from './Motion';
import type { WorldDocument } from './World';

function createMotionForOrb(
  mode: MotionMode,
  world: WorldDocument,
  orb: WorldDocument['soundOrbs'][number],
  overrides: {
    readonly speed?: MotionSpeed;
    readonly range?: MotionRange;
    readonly targetOrbId?: string | null;
  } = {},
) {
  const targetOrbId = overrides.targetOrbId === null
    ? undefined
    : overrides.targetOrbId ?? orb.motion?.targetOrbId;
  const speed = overrides.speed ?? orb.motion?.speed;
  const range = overrides.range ?? orb.motion?.range;

  return createMotion({
    mode,
    seed: orb.motion?.seed ?? world.music.seed + orb.id.length * 17,
    ...(speed ? { speed } : {}),
    ...(range ? { range } : {}),
    ...(targetOrbId ? { targetOrbId } : {}),
  });
}

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
          (
            existing?.targetOrbId
              ? world.soundOrbs.find((candidate) => candidate.id === existing.targetOrbId)
              : undefined
          )
          ?? nearestFollowTarget(orb, world.soundOrbs)
        )
      : null;

    return {
      ...orb,
      motion: createMotionForOrb(
        mode,
        world,
        orb,
        mode === 'follow'
          ? { targetOrbId: target?.id ?? null }
          : { targetOrbId: null },
      ),
    };
  }, now);
}

export function setOrbMotionSpeed(
  world: WorldDocument,
  orbId: string,
  speed: MotionSpeed,
  now = Date.now(),
): WorldDocument {
  const orb = world.soundOrbs.find((candidate) => candidate.id === orbId);

  if (!orb?.motion || orb.motion.mode === 'still') {
    return world;
  }

  return updateOrb(world, orbId, (candidate) => ({
    ...candidate,
    motion: createMotionForOrb(
      candidate.motion?.mode ?? 'orbit',
      world,
      candidate,
      { speed },
    ),
  }), now);
}

export function setOrbMotionRange(
  world: WorldDocument,
  orbId: string,
  range: MotionRange,
  now = Date.now(),
): WorldDocument {
  const orb = world.soundOrbs.find((candidate) => candidate.id === orbId);

  if (!orb?.motion || orb.motion.mode === 'still') {
    return world;
  }

  return updateOrb(world, orbId, (candidate) => ({
    ...candidate,
    motion: createMotionForOrb(
      candidate.motion?.mode ?? 'orbit',
      world,
      candidate,
      { range },
    ),
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
    motion: createMotionForOrb(
      'follow',
      world,
      orb,
      { targetOrbId },
    ),
  }), now);
}
