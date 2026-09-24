import {
  MELODY_ROWS,
  PATTERN_STEPS,
  effectivePattern,
  normalizePattern,
  type GrooveFeel,
  type OrbPatternDocument,
} from '../../music/Pattern';
import { soundById } from '../../sounds/coreCatalog';
import type { SoundRole } from '../../sounds/SoundDefinition';
import type { EffectAmounts } from '../../world/EffectField';
import type { SoundOrbDocument } from '../../world/SoundOrb';
import type { RenderOrbMaterial } from './RenderTypes';

const ROLE_ENERGY: Record<SoundRole, number> = {
  beat: 0.78,
  percussion: 0.5,
  bass: 0.72,
  harmony: 0.42,
  melody: 0.48,
  texture: 0.24,
  voice: 0.36,
};

const ROLE_BRIGHTNESS: Record<SoundRole, number> = {
  beat: 0.28,
  percussion: 0.78,
  bass: 0.2,
  harmony: 0.58,
  melody: 0.76,
  texture: 0.46,
  voice: 0.44,
};

const GROOVE_VALUE: Record<GrooveFeel, number> = {
  straight: 0.12,
  bounce: 0.62,
  loose: 0.88,
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function hashString(value: string): number {
  let hash = 2166136261 >>> 0;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 0xffffffff;
}

function resolvedPattern(
  orb: SoundOrbDocument,
): OrbPatternDocument | null {
  const sound = soundById(orb.soundId);

  if (sound) {
    return effectivePattern(orb.pattern, sound);
  }

  return orb.pattern
    ? normalizePattern(orb.pattern)
    : null;
}

function rhythmFingerprint(
  pattern: Extract<OrbPatternDocument, { kind: 'rhythm' }>,
): Pick<
  RenderOrbMaterial,
  'pattern' | 'density' | 'groove' | 'contour' | 'spread' | 'variation'
> {
  const patternValues = pattern.steps.map(
    (active) => active ? 1 : -1,
  );
  const active = pattern.steps.flatMap(
    (value, index) => value ? [index] : [],
  );
  const odd = active.filter((step) => step % 2 === 1).length;
  const offQuarter = active.filter(
    (step) => step % 4 !== 0,
  ).length;
  const activeCount = active.length;

  return {
    pattern: patternValues,
    density: activeCount / PATTERN_STEPS,
    groove: GROOVE_VALUE[pattern.groove],
    contour: activeCount > 0
      ? odd / activeCount * 2 - 1
      : 0,
    spread: activeCount > 0
      ? offQuarter / activeCount
      : 0,
    variation: clamp01((pattern.variation % 9) / 8),
  };
}

function melodyFingerprint(
  pattern: Extract<OrbPatternDocument, { kind: 'melody' }>,
): Pick<
  RenderOrbMaterial,
  'pattern' | 'density' | 'groove' | 'contour' | 'spread' | 'variation'
> {
  const patternValues = pattern.notes.map(
    (degree) => degree === null
      ? -1
      : degree / Math.max(1, MELODY_ROWS - 1),
  );
  const active = pattern.notes
    .map((degree, step) => degree === null
      ? null
      : { degree, step })
    .filter(
      (item): item is { degree: number; step: number } => item !== null,
    );

  if (active.length === 0) {
    return {
      pattern: patternValues,
      density: 0,
      groove: GROOVE_VALUE[pattern.groove],
      contour: 0,
      spread: 0,
      variation: clamp01((pattern.variation % 9) / 8),
    };
  }

  const degrees = active.map((item) => item.degree);
  const first = active[0]!;
  const last = active[active.length - 1]!;
  const min = Math.min(...degrees);
  const max = Math.max(...degrees);

  return {
    pattern: patternValues,
    density: active.length / PATTERN_STEPS,
    groove: GROOVE_VALUE[pattern.groove],
    contour: Math.max(
      -1,
      Math.min(
        1,
        (last.degree - first.degree)
          / Math.max(1, MELODY_ROWS - 1),
      ),
    ),
    spread: (max - min) / Math.max(1, MELODY_ROWS - 1),
    variation: clamp01((pattern.variation % 9) / 8),
  };
}

function emptyFingerprint(): Pick<
  RenderOrbMaterial,
  'pattern' | 'density' | 'groove' | 'contour' | 'spread' | 'variation'
> {
  return {
    pattern: Array.from(
      { length: PATTERN_STEPS },
      () => -1,
    ),
    density: 0.18,
    groove: 0.24,
    contour: 0,
    spread: 0.46,
    variation: 0,
  };
}

export function deriveOrbMaterial(
  orb: SoundOrbDocument,
  fieldInfluence: EffectAmounts,
): RenderOrbMaterial {
  const sound = soundById(orb.soundId);
  const pattern = resolvedPattern(orb);
  const fingerprint = pattern
    ? pattern.kind === 'rhythm'
      ? rhythmFingerprint(pattern)
      : melodyFingerprint(pattern)
    : emptyFingerprint();

  return {
    ...fingerprint,
    energy: clamp01(sound?.energy ?? ROLE_ENERGY[orb.role]),
    brightness: clamp01(
      sound?.brightness ?? ROLE_BRIGHTNESS[orb.role],
    ),
    seed: hashString(
      orb.id
      + ':'
      + orb.soundId
      + ':'
      + fingerprint.variation.toFixed(3),
    ),
    fieldInfluence,
  };
}
