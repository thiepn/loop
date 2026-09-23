import type { ScaleId } from '../music/Harmony';

export type SoundRole =
  | 'beat'
  | 'percussion'
  | 'bass'
  | 'harmony'
  | 'melody'
  | 'texture'
  | 'voice';

export type ProceduralPreset =
  | 'round-kick'
  | 'soft-clap'
  | 'glass-hat'
  | 'warm-bass'
  | 'dream-chord'
  | 'soft-pluck'
  | 'air-texture';

export interface TonalMetadata {
  readonly root: number;
  readonly scale?: ScaleId;
  readonly safePitchShiftSemitones: number;
}

export interface SoundDefinition {
  readonly id: string;
  readonly name: string;
  readonly role: SoundRole;
  readonly description: string;
  readonly tags: readonly string[];
  readonly energy: number;
  readonly brightness: number;
  readonly nominalDb: number;
  readonly loopBars: number;
  readonly sourceBpm?: number;
  readonly tonal?: TonalMetadata;
  readonly source: {
    readonly type: 'procedural';
    readonly preset: ProceduralPreset;
  };
}

export function assertSoundDefinition(definition: SoundDefinition): void {
  if (!definition.id.trim()) {
    throw new Error('Sound id cannot be empty.');
  }

  if (!definition.name.trim()) {
    throw new Error(`Sound ${definition.id} must have a name.`);
  }

  if (definition.energy < 0 || definition.energy > 1) {
    throw new Error(`Sound ${definition.id} energy must be between 0 and 1.`);
  }

  if (definition.brightness < 0 || definition.brightness > 1) {
    throw new Error(`Sound ${definition.id} brightness must be between 0 and 1.`);
  }

  if (definition.loopBars <= 0 || !Number.isFinite(definition.loopBars)) {
    throw new Error(`Sound ${definition.id} must have a positive loop length.`);
  }

  if (definition.sourceBpm !== undefined && (!Number.isFinite(definition.sourceBpm) || definition.sourceBpm <= 0)) {
    throw new Error(`Sound ${definition.id} has an invalid source BPM.`);
  }

  if (definition.tonal && definition.tonal.safePitchShiftSemitones < 0) {
    throw new Error(`Sound ${definition.id} has an invalid pitch-shift range.`);
  }
}
