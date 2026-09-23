export type ScaleId =
  | 'major'
  | 'minor'
  | 'major-pentatonic'
  | 'minor-pentatonic';

export interface Harmony {
  readonly tonic: number;
  readonly scale: ScaleId;
}

const SCALE_INTERVALS: Record<ScaleId, readonly number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  'major-pentatonic': [0, 2, 4, 7, 9],
  'minor-pentatonic': [0, 3, 5, 7, 10],
};

export function normalizePitchClass(value: number): number {
  return ((Math.round(value) % 12) + 12) % 12;
}

export function normalizeHarmony(harmony: Harmony): Harmony {
  return {
    tonic: normalizePitchClass(harmony.tonic),
    scale: harmony.scale,
  };
}

export function shortestTransposition(fromPitchClass: number, toPitchClass: number): number {
  const from = normalizePitchClass(fromPitchClass);
  const to = normalizePitchClass(toPitchClass);
  const upward = (to - from + 12) % 12;

  return upward > 6 ? upward - 12 : upward;
}

export function scaleIntervals(scale: ScaleId): readonly number[] {
  return SCALE_INTERVALS[scale];
}

export function midiForScaleDegree(
  baseMidi: number,
  harmony: Harmony,
  degree: number,
): number {
  const intervals = scaleIntervals(harmony.scale);
  const normalizedDegree = Math.max(0, Math.floor(degree));
  const octaveOffset = Math.floor(normalizedDegree / intervals.length) * 12;
  const interval = intervals[normalizedDegree % intervals.length] ?? 0;
  const baseOctave = Math.floor(baseMidi / 12) * 12;

  return baseOctave + normalizePitchClass(harmony.tonic) + octaveOffset + interval;
}

export function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}
