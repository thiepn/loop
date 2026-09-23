import type { ScaleId } from '../music/Harmony';
import { createSoundOrb, type SoundOrbDocument } from './SoundOrb';

export const WORLD_SCHEMA_VERSION = 3 as const;

export interface WorldMusicSettings {
  readonly bpm: number;
  readonly tonic: number;
  readonly scale: ScaleId;
  readonly seed: number;
}

export interface WorldDocument {
  readonly schemaVersion: typeof WORLD_SCHEMA_VERSION;
  readonly id: string;
  readonly name: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly music: WorldMusicSettings;
  readonly soundOrbs: readonly SoundOrbDocument[];
  readonly effectFields: readonly string[];
  readonly links: readonly string[];
  readonly snapshots: readonly string[];
}

export interface CreateWorldOptions {
  readonly id?: string;
  readonly now?: number;
  readonly name?: string;
  readonly music?: Partial<WorldMusicSettings>;
  readonly soundOrbs?: readonly SoundOrbDocument[];
}

function createWorldId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `world-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyWorld(options: CreateWorldOptions = {}): WorldDocument {
  const now = options.now ?? Date.now();

  return {
    schemaVersion: WORLD_SCHEMA_VERSION,
    id: options.id ?? createWorldId(),
    name: options.name?.trim() || 'Untitled World',
    createdAt: now,
    updatedAt: now,
    music: {
      bpm: options.music?.bpm ?? 108,
      tonic: options.music?.tonic ?? 0,
      scale: options.music?.scale ?? 'minor-pentatonic',
      seed: options.music?.seed ?? 1,
    },
    soundOrbs: options.soundOrbs ?? [],
    effectFields: [],
    links: [],
    snapshots: [],
  };
}

export function createPhaseThreeWorld(now = Date.now()): WorldDocument {
  return createEmptyWorld({
    id: 'phase-3-playground',
    name: 'First Orbit',
    now,
    music: {
      bpm: 108,
      tonic: 0,
      scale: 'minor-pentatonic',
      seed: 1,
    },
    soundOrbs: [
      createSoundOrb({
        id: 'orb-kick',
        soundId: 'beat-round-kick',
        role: 'beat',
        position: { x: 0.22, y: 0.58 },
      }),
      createSoundOrb({
        id: 'orb-hats',
        soundId: 'perc-glass-hat',
        role: 'percussion',
        position: { x: 0.74, y: 0.28 },
      }),
      createSoundOrb({
        id: 'orb-bass',
        soundId: 'bass-warm',
        role: 'bass',
        position: { x: 0.31, y: 0.31 },
      }),
      createSoundOrb({
        id: 'orb-chords',
        soundId: 'harmony-dream',
        role: 'harmony',
        position: { x: 0.7, y: 0.67 },
      }),
      createSoundOrb({
        id: 'orb-melody',
        soundId: 'melody-soft-pluck',
        role: 'melody',
        position: { x: 0.56, y: 0.18 },
      }),
      createSoundOrb({
        id: 'orb-air',
        soundId: 'texture-air',
        role: 'texture',
        position: { x: 0.84, y: 0.53 },
      }),
    ],
  });
}
