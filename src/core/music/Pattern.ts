import type { OrbPatternId, SoundDefinition, SoundRole } from '../sounds/SoundDefinition';

export const PATTERN_STEPS = 16;
export const MELODY_ROWS = 7;

export type GrooveFeel = 'straight' | 'bounce' | 'loose';
export type DensityLevel = 'sparse' | 'balanced' | 'busy';

export interface RhythmPatternDocument {
  readonly kind: 'rhythm';
  readonly steps: readonly boolean[];
  readonly groove: GrooveFeel;
  readonly variation: number;
}

export interface MelodyPatternDocument {
  readonly kind: 'melody';
  readonly notes: readonly (number | null)[];
  readonly groove: GrooveFeel;
  readonly variation: number;
}

export type OrbPatternDocument = RhythmPatternDocument | MelodyPatternDocument;

const RHYTHM_PRIORITY = [0, 8, 4, 12, 2, 6, 10, 14, 3, 7, 11, 15, 1, 5, 9, 13] as const;
const MELODY_STEP_PRIORITY = [0, 8, 4, 12, 3, 7, 11, 15, 2, 6, 10, 14, 1, 5, 9, 13] as const;

function rhythmSteps(active: readonly number[]): readonly boolean[] {
  const set = new Set(active);
  return Array.from({ length: PATTERN_STEPS }, (_, index) => set.has(index));
}

function melodyNotes(entries: Readonly<Record<number, number>>): readonly (number | null)[] {
  return Array.from({ length: PATTERN_STEPS }, (_, index) => entries[index] ?? null);
}

export function patternKindForRole(role: SoundRole): OrbPatternDocument['kind'] | null {
  switch (role) {
    case 'beat':
    case 'percussion':
      return 'rhythm';
    case 'bass':
    case 'harmony':
    case 'melody':
    case 'voice':
      return 'melody';
    case 'texture':
      return null;
  }
}

export function patternKindForSound(sound: SoundDefinition): OrbPatternDocument['kind'] | null {
  return patternKindForRole(sound.role);
}

export function createDefaultPattern(patternId: OrbPatternId): OrbPatternDocument | null {
  switch (patternId) {
    case 'kick-steady':
      return {
        kind: 'rhythm',
        steps: rhythmSteps([0, 8]),
        groove: 'straight',
        variation: 0,
      };
    case 'clap-backbeat':
      return {
        kind: 'rhythm',
        steps: rhythmSteps([4, 12]),
        groove: 'straight',
        variation: 0,
      };
    case 'hat-eighths':
      return {
        kind: 'rhythm',
        steps: rhythmSteps([0, 2, 4, 6, 8, 10, 12, 14]),
        groove: 'straight',
        variation: 0,
      };
    case 'shaker-offbeats':
      return {
        kind: 'rhythm',
        steps: rhythmSteps([2, 6, 10, 14]),
        groove: 'bounce',
        variation: 0,
      };
    case 'bass-pulse':
      return {
        kind: 'melody',
        notes: melodyNotes({ 0: 0, 3: 0, 7: 2, 10: 3, 14: 1 }),
        groove: 'straight',
        variation: 0,
      };
    case 'harmony-pad':
      return {
        kind: 'melody',
        notes: melodyNotes({ 0: 0, 8: 3 }),
        groove: 'straight',
        variation: 0,
      };
    case 'melody-spark':
      return {
        kind: 'melody',
        notes: melodyNotes({ 3: 4, 7: 3, 11: 5, 15: 2 }),
        groove: 'bounce',
        variation: 0,
      };
    case 'voice-hum':
      return {
        kind: 'melody',
        notes: melodyNotes({ 0: 2, 8: 4 }),
        groove: 'loose',
        variation: 0,
      };
    case 'texture-bed':
      return null;
  }
}

export function effectivePattern(
  pattern: OrbPatternDocument | null | undefined,
  sound: SoundDefinition,
): OrbPatternDocument | null {
  const expectedKind = patternKindForSound(sound);

  if (!expectedKind) {
    return null;
  }

  if (pattern?.kind === expectedKind) {
    return normalizePattern(pattern);
  }

  return createDefaultPattern(sound.pattern);
}

function normalizeRhythmPattern(pattern: RhythmPatternDocument): RhythmPatternDocument {
  return {
    ...pattern,
    steps: Array.from(
      { length: PATTERN_STEPS },
      (_, index) => Boolean(pattern.steps[index]),
    ),
  };
}

function normalizeMelodyPattern(pattern: MelodyPatternDocument): MelodyPatternDocument {
  return {
    ...pattern,
    notes: Array.from({ length: PATTERN_STEPS }, (_, index) => {
      const degree = pattern.notes[index];
      if (degree === null || degree === undefined) {
        return null;
      }

      return Math.max(0, Math.min(MELODY_ROWS - 1, Math.floor(degree)));
    }),
  };
}

export function normalizePattern(pattern: OrbPatternDocument): OrbPatternDocument {
  return pattern.kind === 'rhythm'
    ? normalizeRhythmPattern(pattern)
    : normalizeMelodyPattern(pattern);
}

export function setRhythmStep(
  pattern: RhythmPatternDocument,
  step: number,
  active: boolean,
): RhythmPatternDocument {
  const index = Math.max(0, Math.min(PATTERN_STEPS - 1, Math.floor(step)));
  const steps = [...normalizeRhythmPattern(pattern).steps];
  steps[index] = active;

  return {
    ...pattern,
    steps,
  };
}

export function setMelodyNote(
  pattern: MelodyPatternDocument,
  step: number,
  degree: number | null,
): MelodyPatternDocument {
  const index = Math.max(0, Math.min(PATTERN_STEPS - 1, Math.floor(step)));
  const notes = [...normalizeMelodyPattern(pattern).notes];
  notes[index] = degree === null
    ? null
    : Math.max(0, Math.min(MELODY_ROWS - 1, Math.floor(degree)));

  return {
    ...pattern,
    notes,
  };
}

export function clearPattern(pattern: OrbPatternDocument): OrbPatternDocument {
  if (pattern.kind === 'rhythm') {
    return {
      ...pattern,
      steps: rhythmSteps([]),
    };
  }

  return {
    ...pattern,
    notes: melodyNotes({}),
  };
}

export function setPatternGroove(
  pattern: OrbPatternDocument,
  groove: GrooveFeel,
): OrbPatternDocument {
  return {
    ...pattern,
    groove,
  };
}

function targetCount(level: DensityLevel, kind: OrbPatternDocument['kind']): number {
  if (kind === 'rhythm') {
    return level === 'sparse' ? 3 : level === 'balanced' ? 6 : 10;
  }

  return level === 'sparse' ? 3 : level === 'balanced' ? 5 : 8;
}

function rotatedPriority(priority: readonly number[], seed: number): readonly number[] {
  const offset = Math.abs(Math.floor(seed)) % priority.length;
  return [...priority.slice(offset), ...priority.slice(0, offset)];
}

export function setPatternDensity(
  pattern: OrbPatternDocument,
  level: DensityLevel,
  seed: number,
): OrbPatternDocument {
  const target = targetCount(level, pattern.kind);

  if (pattern.kind === 'rhythm') {
    const normalized = normalizeRhythmPattern(pattern);
    const active = new Set(
      normalized.steps.flatMap((value, index) => value ? [index] : []),
    );

    const priority = rotatedPriority(RHYTHM_PRIORITY, seed);
    const kept = priority.filter((step) => active.has(step)).slice(0, target);
    const result = new Set(kept);

    for (const step of priority) {
      if (result.size >= target) {
        break;
      }
      result.add(step);
    }

    return {
      ...pattern,
      steps: rhythmSteps([...result]),
    };
  }

  const normalized = normalizeMelodyPattern(pattern);
  const occupied = normalized.notes
    .map((degree, step) => degree === null ? null : { step, degree })
    .filter((item): item is { step: number; degree: number } => item !== null);

  const priority = rotatedPriority(MELODY_STEP_PRIORITY, seed);
  const chosen = new Map<number, number>();

  for (const step of priority) {
    const existing = occupied.find((item) => item.step === step);
    if (existing && chosen.size < target) {
      chosen.set(step, existing.degree);
    }
  }

  for (const step of priority) {
    if (chosen.size >= target) {
      break;
    }

    if (!chosen.has(step)) {
      chosen.set(step, (step + seed + chosen.size * 2) % MELODY_ROWS);
    }
  }

  return {
    ...pattern,
    notes: melodyNotes(Object.fromEntries(chosen)),
  };
}

export function varyPattern(
  pattern: OrbPatternDocument,
  seed: number,
): OrbPatternDocument {
  const variation = pattern.variation + 1;
  const effectiveSeed = seed + variation * 31;

  if (pattern.kind === 'rhythm') {
    const activeCount = pattern.steps.filter(Boolean).length;
    const level: DensityLevel = activeCount <= 3
      ? 'sparse'
      : activeCount >= 9
        ? 'busy'
        : 'balanced';

    const varied = setPatternDensity(pattern, level, effectiveSeed) as RhythmPatternDocument;
    const shift = 1 + Math.abs(effectiveSeed) % 3;
    const steps = Array.from(
      { length: PATTERN_STEPS },
      (_, index) => Boolean(varied.steps[(index - shift + PATTERN_STEPS) % PATTERN_STEPS]),
    );

    return {
      ...varied,
      steps,
      variation,
    };
  }

  const activeCount = pattern.notes.filter((degree) => degree !== null).length;
  const level: DensityLevel = activeCount <= 3
    ? 'sparse'
    : activeCount >= 7
      ? 'busy'
      : 'balanced';
  const varied = setPatternDensity(pattern, level, effectiveSeed) as MelodyPatternDocument;

  return {
    ...varied,
    notes: varied.notes.map((degree, step) => {
      if (degree === null) {
        return null;
      }

      const offset = ((step + effectiveSeed) % 3) - 1;
      return Math.max(0, Math.min(MELODY_ROWS - 1, degree + offset));
    }),
    variation,
  };
}

export function densityForPattern(pattern: OrbPatternDocument): DensityLevel {
  const count = pattern.kind === 'rhythm'
    ? pattern.steps.filter(Boolean).length
    : pattern.notes.filter((degree) => degree !== null).length;

  if (pattern.kind === 'rhythm') {
    return count <= 3 ? 'sparse' : count >= 9 ? 'busy' : 'balanced';
  }

  return count <= 3 ? 'sparse' : count >= 7 ? 'busy' : 'balanced';
}

export function grooveOffsetBeats(groove: GrooveFeel, step: number): number {
  if (step % 2 === 0) {
    return 0;
  }

  switch (groove) {
    case 'straight':
      return 0;
    case 'bounce':
      return 0.075;
    case 'loose':
      return step % 4 === 1 ? 0.035 : 0.055;
  }
}
