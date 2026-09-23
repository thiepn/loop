import {
  effectivePattern,
  setPatternDensity,
  varyPattern,
  type DensityLevel,
} from '../music/Pattern';
import {
  CORE_SOUND_CATALOG,
  soundById,
  soundsByRole,
} from '../sounds/coreCatalog';
import type { SoundDefinition } from '../sounds/SoundDefinition';
import {
  clampEffectFieldRadius,
  type EffectFieldDocument,
} from './EffectField';
import {
  createMotion,
  motionForOrb,
  type MotionMode,
  type MotionRange,
  type MotionSpeed,
} from './Motion';
import {
  clampToyStrength,
  type PlaygroundToyDocument,
} from './PlaygroundToy';
import {
  clampPoint,
  type SoundOrbDocument,
} from './SoundOrb';
import type { WorldDocument } from './World';

export type MagicIntent =
  | 'surprise'
  | 'more-energy'
  | 'calmer'
  | 'stranger'
  | 'simpler'
  | 'busier';

export type MagicStrength =
  | 'gentle'
  | 'playful'
  | 'wild';

export type MagicTarget =
  | {
      readonly kind: 'orb';
      readonly id: string;
    }
  | {
      readonly kind: 'field';
      readonly id: string;
    }
  | {
      readonly kind: 'toy';
      readonly id: string;
    }
  | {
      readonly kind: 'world';
    };

export interface MagicMutationOptions {
  readonly intent?: MagicIntent;
  readonly strength?: MagicStrength;
  readonly attempt?: number;
  readonly now?: number;
}

export interface MagicMutationResult {
  readonly world: WorldDocument;
  readonly seed: number;
  readonly summary: string;
}

class SeededRandom {
  private state: number;

  public constructor(seed: number) {
    this.state = (seed >>> 0) || 0x6d2b79f5;
  }

  public next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;

    let value = this.state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  public int(maxExclusive: number): number {
    if (maxExclusive <= 1) {
      return 0;
    }

    return Math.floor(this.next() * maxExclusive);
  }

  public chance(probability: number): boolean {
    return this.next() < Math.max(0, Math.min(1, probability));
  }

  public pick<T>(values: readonly T[]): T | undefined {
    return values[this.int(values.length)];
  }

  public signed(amount: number): number {
    return (this.next() * 2 - 1) * amount;
  }
}

function hashString(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function magicSeed(
  world: WorldDocument,
  target: MagicTarget,
  intent: MagicIntent,
  strength: MagicStrength,
  attempt: number,
): number {
  const targetKey = target.kind === 'world'
    ? 'world'
    : `${target.kind}:${target.id}`;

  return (
    world.music.seed
    ^ hashString(targetKey)
    ^ hashString(intent)
    ^ hashString(strength)
    ^ Math.imul(Math.max(0, Math.floor(attempt)) + 1, 0x9e3779b1)
  ) >>> 0;
}

function densityForIntent(
  intent: MagicIntent,
  rng: SeededRandom,
): DensityLevel | null {
  switch (intent) {
    case 'more-energy':
    case 'busier':
      return 'busy';
    case 'calmer':
    case 'simpler':
      return 'sparse';
    case 'stranger':
      return rng.pick(['sparse', 'balanced', 'busy'] as const) ?? 'balanced';
    case 'surprise':
      return rng.pick(['sparse', 'balanced', 'busy'] as const) ?? null;
  }
}

function strengthMutationCount(strength: MagicStrength): number {
  switch (strength) {
    case 'gentle':
      return 1;
    case 'playful':
      return 2;
    case 'wild':
      return 3;
  }
}

function sortedSoundCandidates(
  current: SoundDefinition,
  intent: MagicIntent,
): readonly SoundDefinition[] {
  const candidates = soundsByRole(current.role).filter(
    (sound) => sound.id !== current.id,
  );

  if (candidates.length <= 1) {
    return candidates;
  }

  switch (intent) {
    case 'more-energy':
    case 'busier':
      return [...candidates].sort((a, b) => b.energy - a.energy);
    case 'calmer':
    case 'simpler':
      return [...candidates].sort((a, b) => a.energy - b.energy);
    case 'stranger':
      return [...candidates].sort((a, b) => {
        const aDistance = Math.abs(a.energy - current.energy)
          + Math.abs(a.brightness - current.brightness);
        const bDistance = Math.abs(b.energy - current.energy)
          + Math.abs(b.brightness - current.brightness);
        return bDistance - aDistance;
      });
    case 'surprise':
      return candidates;
  }
}

function chooseMagicSound(
  current: SoundDefinition,
  intent: MagicIntent,
  rng: SeededRandom,
): SoundDefinition {
  const candidates = sortedSoundCandidates(current, intent);

  if (candidates.length === 0) {
    return current;
  }

  if (intent === 'more-energy' || intent === 'busier') {
    return candidates.find(
      (candidate) => candidate.energy > current.energy + 0.01,
    ) ?? current;
  }

  if (intent === 'calmer' || intent === 'simpler') {
    return candidates.find(
      (candidate) => candidate.energy < current.energy - 0.01,
    ) ?? current;
  }

  if (intent === 'stranger') {
    return candidates[0] ?? current;
  }

  return rng.pick(candidates) ?? current;
}

function motionModePool(intent: MagicIntent): readonly MotionMode[] {
  switch (intent) {
    case 'more-energy':
      return ['orbit', 'bounce', 'wander'];
    case 'calmer':
      return ['still', 'drift'];
    case 'stranger':
      return ['wander', 'bounce', 'follow', 'orbit'];
    case 'simpler':
      return ['still', 'drift'];
    case 'busier':
      return ['orbit', 'bounce', 'wander'];
    case 'surprise':
      return ['still', 'orbit', 'bounce', 'drift', 'follow', 'wander'];
  }
}

function speedForIntent(
  intent: MagicIntent,
  rng: SeededRandom,
): MotionSpeed {
  switch (intent) {
    case 'more-energy':
    case 'busier':
      return rng.pick(['medium', 'fast'] as const) ?? 'fast';
    case 'calmer':
    case 'simpler':
      return 'slow';
    case 'stranger':
      return rng.pick(['slow', 'medium', 'fast'] as const) ?? 'medium';
    case 'surprise':
      return rng.pick(['slow', 'medium', 'fast'] as const) ?? 'medium';
  }
}

function rangeForIntent(
  intent: MagicIntent,
  rng: SeededRandom,
): MotionRange {
  switch (intent) {
    case 'more-energy':
    case 'busier':
      return rng.pick(['medium', 'wide'] as const) ?? 'medium';
    case 'calmer':
    case 'simpler':
      return 'tight';
    case 'stranger':
      return 'wide';
    case 'surprise':
      return rng.pick(['tight', 'medium', 'wide'] as const) ?? 'medium';
  }
}

function followTargetForOrb(
  world: WorldDocument,
  orb: SoundOrbDocument,
  rng: SeededRandom,
): string | undefined {
  const candidates = world.soundOrbs.filter(
    (candidate) => candidate.id !== orb.id,
  );

  return rng.pick(candidates)?.id;
}

function mutateMotion(
  world: WorldDocument,
  orb: SoundOrbDocument,
  intent: MagicIntent,
  strength: MagicStrength,
  rng: SeededRandom,
): SoundOrbDocument['motion'] {
  const current = motionForOrb(orb);
  const shouldChangeMode = strength !== 'gentle' || current.mode === 'still';
  const mode = shouldChangeMode
    ? rng.pick(motionModePool(intent)) ?? current.mode
    : current.mode;

  if (mode === 'still') {
    return undefined;
  }

  const targetOrbId = mode === 'follow'
    ? (
        current.mode === 'follow' && current.targetOrbId
          ? current.targetOrbId
          : followTargetForOrb(world, orb, rng)
      )
    : undefined;

  return createMotion({
    mode,
    speed: speedForIntent(intent, rng),
    range: rangeForIntent(intent, rng),
    seed: current.seed ^ Math.floor(rng.next() * 0xffffffff),
    ...(targetOrbId ? { targetOrbId } : {}),
  });
}

function mutateOrb(
  world: WorldDocument,
  orb: SoundOrbDocument,
  intent: MagicIntent,
  strength: MagicStrength,
  rng: SeededRandom,
): { readonly orb: SoundOrbDocument; readonly changes: readonly string[] } {
  const currentSound = soundById(orb.soundId);
  const changes: string[] = [];
  let next: SoundOrbDocument = orb;
  const mutationCount = strengthMutationCount(strength);

  if (currentSound && mutationCount >= 2) {
    const sound = chooseMagicSound(currentSound, intent, rng);

    if (sound.id !== orb.soundId) {
      next = {
        ...next,
        soundId: sound.id,
      };
      changes.push('sound');
    }
  }

  const effectiveSound = soundById(next.soundId) ?? currentSound;

  if (effectiveSound) {
    const pattern = effectivePattern(orb.pattern, effectiveSound);

    if (pattern) {
      let mutated = varyPattern(pattern, Math.floor(rng.next() * 0x7fffffff));
      const density = densityForIntent(intent, rng);

      if (density) {
        mutated = setPatternDensity(
          mutated,
          density,
          Math.floor(rng.next() * 0x7fffffff),
        );
      }

      next = {
        ...next,
        pattern: mutated,
      };
      changes.push('pattern');
    }
  }

  if (mutationCount >= 2 || orb.role === 'texture') {
    const motion = mutateMotion(world, orb, intent, strength, rng);

    if (motion) {
      next = {
        ...next,
        motion,
      };
    } else {
      const { motion: _motion, ...withoutMotion } = next;
      next = withoutMotion;
    }

    changes.push('motion');
  }

  if (changes.length === 0 && currentSound) {
    const sound = chooseMagicSound(currentSound, 'surprise', rng);
    if (sound.id !== orb.soundId) {
      next = {
        ...next,
        soundId: sound.id,
      };
      changes.push('sound');
    }
  }

  return {
    orb: next,
    changes,
  };
}

function mutateField(
  field: EffectFieldDocument,
  intent: MagicIntent,
  strength: MagicStrength,
  rng: SeededRandom,
): EffectFieldDocument {
  const distance = strength === 'gentle'
    ? 0.035
    : strength === 'playful'
      ? 0.075
      : 0.13;
  const radiusDelta = strength === 'gentle'
    ? 0.018
    : strength === 'playful'
      ? 0.04
      : 0.07;
  const intentRadius = (
    intent === 'more-energy'
    || intent === 'busier'
    || intent === 'stranger'
  )
    ? radiusDelta
    : (
        intent === 'calmer'
        || intent === 'simpler'
      )
      ? -radiusDelta
      : rng.signed(radiusDelta);

  return {
    ...field,
    position: clampPoint({
      x: field.position.x + rng.signed(distance),
      y: field.position.y + rng.signed(distance),
    }),
    radius: clampEffectFieldRadius(field.radius + intentRadius),
  };
}

function mutateToy(
  toy: PlaygroundToyDocument,
  intent: MagicIntent,
  strength: MagicStrength,
  rng: SeededRandom,
): PlaygroundToyDocument {
  const distance = strength === 'gentle'
    ? 0.035
    : strength === 'playful'
      ? 0.08
      : 0.14;
  const strengthDelta = strength === 'gentle'
    ? 0.08
    : strength === 'playful'
      ? 0.16
      : 0.26;
  const nextStrength = (
    intent === 'more-energy'
    || intent === 'busier'
    || intent === 'stranger'
  )
    ? toy.strength + strengthDelta
    : (
        intent === 'calmer'
        || intent === 'simpler'
      )
      ? toy.strength - strengthDelta
      : toy.strength + rng.signed(strengthDelta);

  const next = {
    ...toy,
    position: clampPoint({
      x: toy.position.x + rng.signed(distance),
      y: toy.position.y + rng.signed(distance),
    }),
    strength: clampToyStrength(nextStrength),
  };

  if (toy.type !== 'portal') {
    return next;
  }

  return {
    ...next,
    exitPosition: clampPoint({
      x: (toy.exitPosition?.x ?? 0.78) + rng.signed(distance),
      y: (toy.exitPosition?.y ?? 0.72) + rng.signed(distance),
    }),
  };
}

function mutateTempo(
  bpm: number,
  intent: MagicIntent,
  strength: MagicStrength,
  rng: SeededRandom,
): number {
  const amount = strength === 'gentle'
    ? 3
    : strength === 'playful'
      ? 7
      : 12;

  let next = bpm;

  switch (intent) {
    case 'more-energy':
    case 'busier':
      next += amount;
      break;
    case 'calmer':
    case 'simpler':
      next -= amount;
      break;
    case 'stranger':
      next += rng.signed(amount);
      break;
    case 'surprise':
      next += rng.signed(Math.max(2, amount * 0.65));
      break;
  }

  return Math.max(72, Math.min(138, Math.round(next)));
}

function intentLabel(intent: MagicIntent): string {
  switch (intent) {
    case 'surprise':
      return 'Surprise';
    case 'more-energy':
      return 'More energy';
    case 'calmer':
      return 'Calmer';
    case 'stranger':
      return 'Stranger';
    case 'simpler':
      return 'Simpler';
    case 'busier':
      return 'Busier';
  }
}

export function mutateWithMagic(
  world: WorldDocument,
  target: MagicTarget,
  options: MagicMutationOptions = {},
): MagicMutationResult {
  const intent = options.intent ?? 'surprise';
  const strength = options.strength ?? 'playful';
  const attempt = Math.max(0, Math.floor(options.attempt ?? 0));
  const seed = magicSeed(world, target, intent, strength, attempt);
  const rng = new SeededRandom(seed);
  const now = options.now ?? Date.now();

  if (target.kind === 'orb') {
    const orb = world.soundOrbs.find((candidate) => candidate.id === target.id);

    if (!orb) {
      return {
        world,
        seed,
        summary: 'That sound is no longer available.',
      };
    }

    const mutation = mutateOrb(world, orb, intent, strength, rng);
    const soundOrbs = world.soundOrbs.map(
      (candidate) => candidate.id === orb.id ? mutation.orb : candidate,
    );

    return {
      world: {
        ...world,
        updatedAt: now,
        soundOrbs,
      },
      seed,
      summary: mutation.changes.length > 0
        ? `${mutation.changes.join(' + ')} changed`
        : 'A subtle variation',
    };
  }

  if (target.kind === 'field') {
    const exists = world.effectFields.some((field) => field.id === target.id);

    if (!exists) {
      return {
        world,
        seed,
        summary: 'That field is no longer available.',
      };
    }

    return {
      world: {
        ...world,
        updatedAt: now,
        effectFields: world.effectFields.map(
          (field) => field.id === target.id
            ? mutateField(field, intent, strength, rng)
            : field,
        ),
      },
      seed,
      summary: 'Field shape and placement changed',
    };
  }

  if (target.kind === 'toy') {
    const exists = world.playgroundToys.some((toy) => toy.id === target.id);

    if (!exists) {
      return {
        world,
        seed,
        summary: 'That toy is no longer available.',
      };
    }

    return {
      world: {
        ...world,
        updatedAt: now,
        playgroundToys: world.playgroundToys.map(
          (toy) => toy.id === target.id
            ? mutateToy(toy, intent, strength, rng)
            : toy,
        ),
      },
      seed,
      summary: 'Toy behavior and placement changed',
    };
  }

  const mutationChance = strength === 'gentle'
    ? 0.45
    : strength === 'playful'
      ? 0.72
      : 0.94;

  const soundOrbs = world.soundOrbs.map((orb) => {
    if (!rng.chance(mutationChance)) {
      return orb;
    }

    return mutateOrb(world, orb, intent, strength, rng).orb;
  });

  const effectFields = world.effectFields.map(
    (field) => rng.chance(mutationChance * 0.65)
      ? mutateField(field, intent, strength, rng)
      : field,
  );

  const playgroundToys = world.playgroundToys.map(
    (toy) => rng.chance(mutationChance * 0.55)
      ? mutateToy(toy, intent, strength, rng)
      : toy,
  );

  return {
    world: {
      ...world,
      updatedAt: now,
      music: {
        ...world.music,
        bpm: mutateTempo(world.music.bpm, intent, strength, rng),
      },
      soundOrbs,
      effectFields,
      playgroundToys,
    },
    seed,
    summary: `${intentLabel(intent)} Remix`,
  };
}

export function magicTargetExists(
  world: WorldDocument,
  target: MagicTarget,
): boolean {
  switch (target.kind) {
    case 'world':
      return true;
    case 'orb':
      return world.soundOrbs.some((orb) => orb.id === target.id);
    case 'field':
      return world.effectFields.some((field) => field.id === target.id);
    case 'toy':
      return world.playgroundToys.some((toy) => toy.id === target.id);
  }
}

export function magicCatalogIsRoleStable(): boolean {
  return CORE_SOUND_CATALOG.every(
    (sound) => soundsByRole(sound.role).some((candidate) => candidate.id === sound.id),
  );
}
