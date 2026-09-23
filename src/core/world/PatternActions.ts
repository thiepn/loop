import {
  clearPattern,
  effectivePattern,
  setMelodyNote,
  setPatternDensity,
  setPatternGroove,
  setRhythmStep,
  varyPattern,
  type DensityLevel,
  type GrooveFeel,
  type OrbPatternDocument,
} from '../music/Pattern';
import { soundById } from '../sounds/coreCatalog';
import type { WorldDocument } from './World';

function updatePattern(
  world: WorldDocument,
  orbId: string,
  updater: (pattern: OrbPatternDocument) => OrbPatternDocument,
  now: number,
): WorldDocument {
  let changed = false;

  const soundOrbs = world.soundOrbs.map((orb) => {
    if (orb.id !== orbId) {
      return orb;
    }

    const sound = soundById(orb.soundId);
    if (!sound) {
      return orb;
    }

    const pattern = effectivePattern(orb.pattern, sound);
    if (!pattern) {
      return orb;
    }

    changed = true;
    return {
      ...orb,
      pattern: updater(pattern),
    };
  });

  if (!changed) {
    return world;
  }

  return {
    ...world,
    updatedAt: now,
    soundOrbs,
  };
}

export function toggleRhythmStep(
  world: WorldDocument,
  orbId: string,
  step: number,
  now = Date.now(),
): WorldDocument {
  return updatePattern(world, orbId, (pattern) => {
    if (pattern.kind !== 'rhythm') {
      return pattern;
    }

    return setRhythmStep(pattern, step, !pattern.steps[step]);
  }, now);
}

export function paintRhythmStep(
  world: WorldDocument,
  orbId: string,
  step: number,
  active: boolean,
  now = Date.now(),
): WorldDocument {
  return updatePattern(world, orbId, (pattern) => {
    if (pattern.kind !== 'rhythm') {
      return pattern;
    }

    return setRhythmStep(pattern, step, active);
  }, now);
}

export function paintMelodyNote(
  world: WorldDocument,
  orbId: string,
  step: number,
  degree: number | null,
  now = Date.now(),
): WorldDocument {
  return updatePattern(world, orbId, (pattern) => {
    if (pattern.kind !== 'melody') {
      return pattern;
    }

    return setMelodyNote(pattern, step, degree);
  }, now);
}

export function clearOrbPattern(
  world: WorldDocument,
  orbId: string,
  now = Date.now(),
): WorldDocument {
  return updatePattern(world, orbId, clearPattern, now);
}

export function setOrbPatternDensity(
  world: WorldDocument,
  orbId: string,
  density: DensityLevel,
  now = Date.now(),
): WorldDocument {
  return updatePattern(
    world,
    orbId,
    (pattern) => setPatternDensity(pattern, density, world.music.seed + pattern.variation * 17),
    now,
  );
}

export function setOrbPatternGroove(
  world: WorldDocument,
  orbId: string,
  groove: GrooveFeel,
  now = Date.now(),
): WorldDocument {
  return updatePattern(world, orbId, (pattern) => setPatternGroove(pattern, groove), now);
}

export function varyOrbPattern(
  world: WorldDocument,
  orbId: string,
  now = Date.now(),
): WorldDocument {
  return updatePattern(
    world,
    orbId,
    (pattern) => varyPattern(pattern, world.music.seed),
    now,
  );
}
