import {
  normalizeHarmony,
  shortestTransposition,
  type Harmony,
} from '../music/Harmony';
import type { SoundDefinition, SoundRole } from './SoundDefinition';

export interface SoundCompatibilityTarget {
  readonly role: SoundRole;
  readonly bpm: number;
  readonly harmony: Harmony;
  readonly energy: number;
  readonly excludedIds?: ReadonlySet<string>;
}

export interface SoundCompatibility {
  readonly sound: SoundDefinition;
  readonly score: number;
  readonly tempoRatio: number;
  readonly pitchShiftSemitones: number;
}

function tempoScore(sourceBpm: number | undefined, targetBpm: number): number {
  if (!sourceBpm) {
    return 1;
  }

  const ratio = targetBpm / sourceBpm;
  const octaveDistance = Math.abs(Math.log2(ratio));
  return Math.max(0, 1 - octaveDistance * 1.5);
}

function tonalPlan(sound: SoundDefinition, harmony: Harmony): {
  score: number;
  semitones: number;
} {
  if (!sound.tonal) {
    return { score: 1, semitones: 0 };
  }

  const normalizedHarmony = normalizeHarmony(harmony);
  const semitones = shortestTransposition(sound.tonal.root, normalizedHarmony.tonic);

  if (Math.abs(semitones) > sound.tonal.safePitchShiftSemitones) {
    return { score: 0, semitones };
  }

  const scaleScore = !sound.tonal.scale || sound.tonal.scale === normalizedHarmony.scale
    ? 1
    : 0.72;

  const pitchCost = Math.abs(semitones) / Math.max(1, sound.tonal.safePitchShiftSemitones);

  return {
    score: scaleScore * (1 - pitchCost * 0.18),
    semitones,
  };
}

export function evaluateSoundCompatibility(
  sound: SoundDefinition,
  target: SoundCompatibilityTarget,
): SoundCompatibility | null {
  if (sound.role !== target.role || target.excludedIds?.has(sound.id)) {
    return null;
  }

  const tempo = tempoScore(sound.sourceBpm, target.bpm);
  const tonal = tonalPlan(sound, target.harmony);
  const energy = 1 - Math.min(1, Math.abs(sound.energy - target.energy));

  const score = tempo * 0.25 + tonal.score * 0.5 + energy * 0.25;

  return {
    sound,
    score,
    tempoRatio: sound.sourceBpm ? target.bpm / sound.sourceBpm : 1,
    pitchShiftSemitones: tonal.semitones,
  };
}

export function rankCompatibleSounds(
  catalog: readonly SoundDefinition[],
  target: SoundCompatibilityTarget,
): readonly SoundCompatibility[] {
  return catalog
    .map((sound) => evaluateSoundCompatibility(sound, target))
    .filter((result): result is SoundCompatibility => result !== null)
    .sort((a, b) => b.score - a.score || a.sound.id.localeCompare(b.sound.id));
}
