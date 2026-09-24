import type { EffectFieldDocument } from './EffectField';
import type { LinkDocument } from './Link';
import type { PlaygroundToyDocument } from './PlaygroundToy';
import type { SoundOrbDocument } from './SoundOrb';
import type { WorldDocument, WorldMusicSettings } from './World';

export const MAX_SNAPSHOTS = 8;

export interface SnapshotState {
  readonly music: WorldMusicSettings;
  readonly soundOrbs: readonly SoundOrbDocument[];
  readonly effectFields: readonly EffectFieldDocument[];
  readonly playgroundToys: readonly PlaygroundToyDocument[];
  readonly links: readonly LinkDocument[];
}

export interface SnapshotDocument {
  readonly id: string;
  readonly name: string;
  readonly createdAt: number;
  readonly state: SnapshotState;
}

export interface AddSnapshotResult {
  readonly world: WorldDocument;
  readonly createdId: string | null;
}

function createSnapshotId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `snapshot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function snapshotStateFromWorld(world: WorldDocument): SnapshotState {
  return {
    music: world.music,
    soundOrbs: world.soundOrbs,
    effectFields: world.effectFields,
    playgroundToys: world.playgroundToys,
    links: world.links,
  };
}

export function addSnapshot(
  world: WorldDocument,
  name?: string,
  now = Date.now(),
): AddSnapshotResult {
  if (world.snapshots.length >= MAX_SNAPSHOTS) {
    return {
      world,
      createdId: null,
    };
  }

  const id = createSnapshotId();
  const fallback = `Snapshot ${world.snapshots.length + 1}`;
  const snapshot: SnapshotDocument = {
    id,
    name: name?.trim() || fallback,
    createdAt: now,
    state: snapshotStateFromWorld(world),
  };

  return {
    world: {
      ...world,
      updatedAt: now,
      snapshots: [...world.snapshots, snapshot],
    },
    createdId: id,
  };
}

export function renameSnapshot(
  world: WorldDocument,
  snapshotId: string,
  name: string,
  now = Date.now(),
): WorldDocument {
  const cleanName = name.trim();

  if (!cleanName) {
    return world;
  }

  let changed = false;
  const snapshots = world.snapshots.map((snapshot) => {
    if (snapshot.id !== snapshotId || snapshot.name === cleanName) {
      return snapshot;
    }

    changed = true;
    return {
      ...snapshot,
      name: cleanName,
    };
  });

  return changed
    ? {
        ...world,
        updatedAt: now,
        snapshots,
      }
    : world;
}

export function deleteSnapshot(
  world: WorldDocument,
  snapshotId: string,
  now = Date.now(),
): WorldDocument {
  const snapshots = world.snapshots.filter(
    (snapshot) => snapshot.id !== snapshotId,
  );

  return snapshots.length === world.snapshots.length
    ? world
    : {
        ...world,
        updatedAt: now,
        snapshots,
      };
}

export function recallSnapshot(
  world: WorldDocument,
  snapshotId: string,
  now = Date.now(),
): WorldDocument {
  const snapshot = world.snapshots.find(
    (candidate) => candidate.id === snapshotId,
  );

  if (!snapshot) {
    return world;
  }

  return {
    ...world,
    updatedAt: now,
    music: snapshot.state.music,
    soundOrbs: snapshot.state.soundOrbs,
    effectFields: snapshot.state.effectFields,
    playgroundToys: snapshot.state.playgroundToys,
    links: snapshot.state.links,
  };
}
