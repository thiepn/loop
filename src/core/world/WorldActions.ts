import {
  MAX_SOUND_ORBS,
  clampPoint,
  createSoundOrb,
  type NormalizedPoint,
  type SoundOrbDocument,
} from './SoundOrb';
import {
  effectivePattern,
  patternKindForSound,
} from '../music/Pattern';
import type { SoundDefinition } from '../sounds/SoundDefinition';
import { soundById } from '../sounds/coreCatalog';
import {
  deleteLinksForOrb,
  pruneInvalidLinks,
} from './LinkActions';
import type { WorldDocument } from './World';

function touch(world: WorldDocument, soundOrbs: readonly SoundOrbDocument[], now: number): WorldDocument {
  return {
    ...world,
    updatedAt: now,
    soundOrbs,
  };
}

export function soundOrbById(
  world: WorldDocument,
  orbId: string,
): SoundOrbDocument | undefined {
  return world.soundOrbs.find((orb) => orb.id === orbId);
}

export function moveSoundOrb(
  world: WorldDocument,
  orbId: string,
  position: NormalizedPoint,
  now = Date.now(),
): WorldDocument {
  let changed = false;
  const nextPosition = clampPoint(position);

  const soundOrbs = world.soundOrbs.map((orb) => {
    if (orb.id !== orbId) {
      return orb;
    }

    if (orb.position.x === nextPosition.x && orb.position.y === nextPosition.y) {
      return orb;
    }

    changed = true;
    return {
      ...orb,
      position: nextPosition,
    };
  });

  if (!changed) {
    return world;
  }

  const next = touch(world, soundOrbs, now);

  return {
    ...next,
    links: pruneInvalidLinks(next.links, soundOrbs),
  };
}

export function setSoundOrbMuted(
  world: WorldDocument,
  orbId: string,
  muted: boolean,
  now = Date.now(),
): WorldDocument {
  let changed = false;

  const soundOrbs = world.soundOrbs.map((orb) => {
    if (orb.id !== orbId || orb.muted === muted) {
      return orb;
    }

    changed = true;
    return {
      ...orb,
      muted,
    };
  });

  return changed ? touch(world, soundOrbs, now) : world;
}

export function toggleSoundOrbMuted(
  world: WorldDocument,
  orbId: string,
  now = Date.now(),
): WorldDocument {
  const orb = soundOrbById(world, orbId);
  return orb ? setSoundOrbMuted(world, orbId, !orb.muted, now) : world;
}

export function deleteSoundOrb(
  world: WorldDocument,
  orbId: string,
  now = Date.now(),
): WorldDocument {
  const soundOrbs = world.soundOrbs.filter((orb) => orb.id !== orbId);

  if (soundOrbs.length === world.soundOrbs.length) {
    return world;
  }

  return {
    ...touch(world, soundOrbs, now),
    links: deleteLinksForOrb(world.links, orbId),
  };
}

export function duplicateSoundOrb(
  world: WorldDocument,
  orbId: string,
  now = Date.now(),
): { readonly world: WorldDocument; readonly createdId: string | null } {
  if (world.soundOrbs.length >= MAX_SOUND_ORBS) {
    return { world, createdId: null };
  }

  const source = soundOrbById(world, orbId);

  if (!source) {
    return { world, createdId: null };
  }

  const duplicateOptions = {
    soundId: source.soundId,
    role: source.role,
    muted: source.muted,
    position: {
      x: Math.min(0.94, source.position.x + 0.07),
      y: Math.min(0.94, source.position.y + 0.06),
    },
  };

  const duplicate = createSoundOrb({
    ...duplicateOptions,
    ...(source.pattern ? { pattern: source.pattern } : {}),
    ...(source.motion ? { motion: source.motion } : {}),
  });

  return {
    world: touch(world, [...world.soundOrbs, duplicate], now),
    createdId: duplicate.id,
  };
}

export function suggestedAddPosition(index: number): NormalizedPoint {
  const positions: readonly NormalizedPoint[] = [
    { x: 0.24, y: 0.34 },
    { x: 0.76, y: 0.34 },
    { x: 0.25, y: 0.68 },
    { x: 0.75, y: 0.68 },
    { x: 0.5, y: 0.18 },
    { x: 0.5, y: 0.82 },
    { x: 0.14, y: 0.5 },
    { x: 0.86, y: 0.5 },
  ];

  return positions[Math.abs(index) % positions.length] ?? { x: 0.5, y: 0.3 };
}

export function addSoundOrb(
  world: WorldDocument,
  sound: SoundDefinition,
  now = Date.now(),
): { readonly world: WorldDocument; readonly createdId: string | null } {
  if (world.soundOrbs.length >= MAX_SOUND_ORBS) {
    return { world, createdId: null };
  }

  const created = createSoundOrb({
    soundId: sound.id,
    role: sound.role,
    position: suggestedAddPosition(world.soundOrbs.length),
  });

  return {
    world: touch(world, [...world.soundOrbs, created], now),
    createdId: created.id,
  };
}

export function replaceSoundOrb(
  world: WorldDocument,
  orbId: string,
  sound: SoundDefinition,
  now = Date.now(),
): WorldDocument {
  let changed = false;

  const soundOrbs = world.soundOrbs.map((orb) => {
    if (orb.id !== orbId) {
      return orb;
    }

    if (orb.soundId === sound.id && orb.role === sound.role) {
      return orb;
    }

    const previousSound = soundById(orb.soundId);
    const previousKind = previousSound ? patternKindForSound(previousSound) : null;
    const nextKind = patternKindForSound(sound);
    const preservedPattern = previousKind && previousKind === nextKind
      ? effectivePattern(orb.pattern, previousSound!)
      : undefined;

    changed = true;
    const base = {
      ...orb,
      soundId: sound.id,
      role: sound.role,
    };

    if (preservedPattern) {
      return { ...base, pattern: preservedPattern };
    }

    return {
      id: base.id,
      soundId: base.soundId,
      role: base.role,
      position: base.position,
      muted: base.muted,
      ...(base.motion ? { motion: base.motion } : {}),
    };
  });

  return changed ? touch(world, soundOrbs, now) : world;
}
