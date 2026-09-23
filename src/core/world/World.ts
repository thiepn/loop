import type { ScaleId } from '../music/Harmony';
import type { EffectFieldDocument } from './EffectField';
import type { LinkDocument } from './Link';
import type { PlaygroundToyDocument } from './PlaygroundToy';
import type { SoundOrbDocument } from './SoundOrb';

export const WORLD_SCHEMA_VERSION = 7 as const;

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
  readonly effectFields: readonly EffectFieldDocument[];
  readonly playgroundToys: readonly PlaygroundToyDocument[];
  readonly links: readonly LinkDocument[];
  readonly snapshots: readonly string[];
}

export interface CreateWorldOptions {
  readonly id?: string;
  readonly now?: number;
  readonly name?: string;
  readonly music?: Partial<WorldMusicSettings>;
  readonly soundOrbs?: readonly SoundOrbDocument[];
  readonly effectFields?: readonly EffectFieldDocument[];
  readonly playgroundToys?: readonly PlaygroundToyDocument[];
  readonly links?: readonly LinkDocument[];
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
    effectFields: options.effectFields ?? [],
    playgroundToys: options.playgroundToys ?? [],
    links: options.links ?? [],
    snapshots: [],
  };
}
