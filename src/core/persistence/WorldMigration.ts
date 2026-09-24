import type { ScaleId } from '../music/Harmony';
import {
  normalizePattern,
  type GrooveFeel,
  type MelodyPatternDocument,
  type RhythmPatternDocument,
} from '../music/Pattern';
import { soundById } from '../sounds/coreCatalog';
import {
  createEffectField,
  type EffectFieldDocument,
  type EffectFieldType,
} from '../world/EffectField';
import {
  createLink,
  type LinkDocument,
  type LinkType,
} from '../world/Link';
import { validateLinkCandidate } from '../world/LinkActions';
import {
  createMotion,
  type MotionDocument,
  type MotionMode,
  type MotionRange,
  type MotionSpeed,
} from '../world/Motion';
import {
  createPlaygroundToy,
  type PlaygroundToyDocument,
  type PlaygroundToyType,
} from '../world/PlaygroundToy';
import type {
  SnapshotDocument,
  SnapshotState,
} from '../world/Snapshot';
import {
  MAX_SOUND_ORBS,
  createSoundOrb,
  type NormalizedPoint,
  type SoundOrbDocument,
} from '../world/SoundOrb';
import {
  WORLD_SCHEMA_VERSION,
  type WorldDocument,
  type WorldMusicSettings,
} from '../world/World';
import { PersistenceError } from './PersistenceError';

export interface WorldMigrationResult {
  readonly world: WorldDocument;
  readonly fromVersion: number;
  readonly warnings: readonly string[];
}

type UnknownRecord = Record<string, unknown>;

const SCALE_IDS: readonly ScaleId[] = [
  'major',
  'minor',
  'major-pentatonic',
  'minor-pentatonic',
];

const FIELD_TYPES: readonly EffectFieldType[] = [
  'space',
  'echo',
  'heat',
  'frost',
  'filter',
];

const TOY_TYPES: readonly PlaygroundToyType[] = [
  'spinner',
  'magnet',
  'repulsor',
  'portal',
];

const LINK_TYPES: readonly LinkType[] = [
  'pulse-together',
  'take-turns',
  'follow',
  'kick-pushes-bass',
  'copy-movement',
];

const MOTION_MODES: readonly MotionMode[] = [
  'still',
  'orbit',
  'bounce',
  'drift',
  'follow',
  'wander',
];

const MOTION_SPEEDS: readonly MotionSpeed[] = [
  'slow',
  'medium',
  'fast',
];

const MOTION_RANGES: readonly MotionRange[] = [
  'tight',
  'medium',
  'wide',
];

const GROOVES: readonly GrooveFeel[] = [
  'straight',
  'bounce',
  'loose',
];

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : null;
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : fallback;
}

function integerValue(value: unknown, fallback: number): number {
  return Math.floor(finiteNumber(value, fallback));
}

function enumValue<T extends string>(
  value: unknown,
  values: readonly T[],
  fallback: T,
): T {
  return typeof value === 'string' && values.includes(value as T)
    ? value as T
    : fallback;
}

function optionalEnumValue<T extends string>(
  value: unknown,
  values: readonly T[],
): T | undefined {
  return typeof value === 'string' && values.includes(value as T)
    ? value as T
    : undefined;
}

function normalizedPoint(
  value: unknown,
  fallback: NormalizedPoint = { x: 0.5, y: 0.5 },
): NormalizedPoint {
  if (!isRecord(value)) {
    return fallback;
  }

  const x = finiteNumber(value.x, fallback.x);
  const y = finiteNumber(value.y, fallback.y);

  return {
    x: Math.min(1, Math.max(0, x)),
    y: Math.min(1, Math.max(0, y)),
  };
}

function migrateMusic(value: unknown): WorldMusicSettings {
  const record = isRecord(value) ? value : {};
  const bpm = Math.min(220, Math.max(40, finiteNumber(record.bpm, 108)));
  const tonic = ((integerValue(record.tonic, 0) % 12) + 12) % 12;

  return {
    bpm,
    tonic,
    scale: enumValue(record.scale, SCALE_IDS, 'minor-pentatonic'),
    seed: integerValue(record.seed, 1),
  };
}

function migratePattern(value: unknown): SoundOrbDocument['pattern'] {
  if (!isRecord(value)) {
    return undefined;
  }

  const groove = enumValue(value.groove, GROOVES, 'straight');
  const variation = Math.max(0, integerValue(value.variation, 0));

  if (value.kind === 'rhythm' && Array.isArray(value.steps)) {
    const pattern: RhythmPatternDocument = {
      kind: 'rhythm',
      steps: value.steps.map(Boolean),
      groove,
      variation,
    };

    return normalizePattern(pattern);
  }

  if (value.kind === 'melody' && Array.isArray(value.notes)) {
    const notes = value.notes.map((note) => {
      if (note === null) {
        return null;
      }

      return typeof note === 'number' && Number.isFinite(note)
        ? Math.floor(note)
        : null;
    });
    const pattern: MelodyPatternDocument = {
      kind: 'melody',
      notes,
      groove,
      variation,
    };

    return normalizePattern(pattern);
  }

  return undefined;
}

function migrateMotion(value: unknown): MotionDocument | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const mode = optionalEnumValue(value.mode, MOTION_MODES);

  if (!mode || mode === 'still') {
    return undefined;
  }

  const speed = enumValue(value.speed, MOTION_SPEEDS, 'medium');
  const range = enumValue(value.range, MOTION_RANGES, 'medium');
  const targetOrbId = stringValue(value.targetOrbId);

  return createMotion({
    mode,
    speed,
    range,
    seed: integerValue(value.seed, 1),
    ...(targetOrbId ? { targetOrbId } : {}),
  });
}

function migrateSoundOrbs(
  value: unknown,
  warnings: string[],
  prefix: string,
): readonly SoundOrbDocument[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: SoundOrbDocument[] = [];
  const ids = new Set<string>();

  for (const [index, item] of value.entries()) {
    if (result.length >= MAX_SOUND_ORBS) {
      warnings.push(
        `${prefix}.soundOrbs exceeded the ${MAX_SOUND_ORBS}-sound limit; extra sounds were dropped.`,
      );
      break;
    }

    if (!isRecord(item)) {
      warnings.push(`${prefix}.soundOrbs[${index}] was invalid and was dropped.`);
      continue;
    }

    const id = stringValue(item.id);
    const soundId = stringValue(item.soundId);
    const sound = soundId ? soundById(soundId) : undefined;

    if (!id || !sound || ids.has(id)) {
      warnings.push(`${prefix}.soundOrbs[${index}] could not be recovered and was dropped.`);
      continue;
    }

    ids.add(id);

    const pattern = migratePattern(item.pattern);
    const motion = migrateMotion(item.motion);

    result.push(createSoundOrb({
      id,
      soundId: sound.id,
      role: sound.role,
      position: normalizedPoint(item.position),
      muted: Boolean(item.muted),
      ...(pattern ? { pattern } : {}),
      ...(motion ? { motion } : {}),
    }));
  }

  return result;
}

function migrateFields(
  value: unknown,
  warnings: string[],
  prefix: string,
): readonly EffectFieldDocument[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: EffectFieldDocument[] = [];
  const ids = new Set<string>();
  const types = new Set<EffectFieldType>();

  for (const [index, item] of value.entries()) {
    if (!isRecord(item)) {
      warnings.push(`${prefix}.effectFields[${index}] was invalid and was dropped.`);
      continue;
    }

    const id = stringValue(item.id);
    const type = optionalEnumValue(item.type, FIELD_TYPES);

    if (!id || !type || ids.has(id) || types.has(type)) {
      warnings.push(`${prefix}.effectFields[${index}] could not be recovered and was dropped.`);
      continue;
    }

    ids.add(id);
    types.add(type);

    result.push(createEffectField({
      id,
      type,
      position: normalizedPoint(item.position),
      radius: finiteNumber(item.radius, 0.18),
    }));
  }

  return result;
}

function migrateToys(
  value: unknown,
  warnings: string[],
  prefix: string,
): readonly PlaygroundToyDocument[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: PlaygroundToyDocument[] = [];
  const ids = new Set<string>();
  const types = new Set<PlaygroundToyType>();

  for (const [index, item] of value.entries()) {
    if (!isRecord(item)) {
      warnings.push(`${prefix}.playgroundToys[${index}] was invalid and was dropped.`);
      continue;
    }

    const id = stringValue(item.id);
    const type = optionalEnumValue(item.type, TOY_TYPES);

    if (!id || !type || ids.has(id) || types.has(type)) {
      warnings.push(`${prefix}.playgroundToys[${index}] could not be recovered and was dropped.`);
      continue;
    }

    ids.add(id);
    types.add(type);

    result.push(createPlaygroundToy({
      id,
      type,
      position: normalizedPoint(item.position),
      radius: finiteNumber(item.radius, 0.14),
      strength: finiteNumber(item.strength, 0.65),
      ...(type === 'portal'
        ? { exitPosition: normalizedPoint(item.exitPosition, { x: 0.78, y: 0.72 }) }
        : {}),
    }));
  }

  return result;
}

function migrateLinks(
  value: unknown,
  soundOrbs: readonly SoundOrbDocument[],
  warnings: string[],
  prefix: string,
): readonly LinkDocument[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const links: LinkDocument[] = [];
  const ids = new Set<string>();

  for (const [index, item] of value.entries()) {
    if (!isRecord(item)) {
      if (item !== undefined) {
        warnings.push(`${prefix}.links[${index}] was obsolete or invalid and was dropped.`);
      }
      continue;
    }

    const id = stringValue(item.id);
    const type = optionalEnumValue(item.type, LINK_TYPES);
    const sourceOrbId = stringValue(item.sourceOrbId);
    const targetOrbId = stringValue(item.targetOrbId);

    if (!id || !type || !sourceOrbId || !targetOrbId || ids.has(id)) {
      warnings.push(`${prefix}.links[${index}] could not be recovered and was dropped.`);
      continue;
    }

    const candidate = createLink({
      id,
      type,
      sourceOrbId,
      targetOrbId,
    });

    const validationWorld: WorldDocument = {
      schemaVersion: WORLD_SCHEMA_VERSION,
      id: '__migration__',
      name: 'Migration',
      createdAt: 0,
      updatedAt: 0,
      music: {
        bpm: 108,
        tonic: 0,
        scale: 'minor-pentatonic',
        seed: 1,
      },
      soundOrbs,
      effectFields: [],
      playgroundToys: [],
      links,
      snapshots: [],
    };

    if (!validateLinkCandidate(
      validationWorld,
      candidate.type,
      candidate.sourceOrbId,
      candidate.targetOrbId,
    ).ok) {
      warnings.push(`${prefix}.links[${index}] violated current Link rules and was dropped.`);
      continue;
    }

    ids.add(id);
    links.push(candidate);
  }

  return links;
}

function migrateCreativeState(
  value: unknown,
  warnings: string[],
  prefix: string,
): SnapshotState | null {
  if (!isRecord(value)) {
    return null;
  }

  const soundOrbs = migrateSoundOrbs(value.soundOrbs, warnings, prefix);
  const effectFields = migrateFields(value.effectFields, warnings, prefix);
  const playgroundToys = migrateToys(value.playgroundToys, warnings, prefix);
  const links = migrateLinks(value.links, soundOrbs, warnings, prefix);

  return {
    music: migrateMusic(value.music),
    soundOrbs,
    effectFields,
    playgroundToys,
    links,
  };
}

function migrateSnapshots(
  value: unknown,
  warnings: string[],
): readonly SnapshotDocument[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const snapshots: SnapshotDocument[] = [];
  const ids = new Set<string>();

  for (const [index, item] of value.entries()) {
    if (!isRecord(item)) {
      if (item !== undefined) {
        warnings.push(`world.snapshots[${index}] was obsolete or invalid and was dropped.`);
      }
      continue;
    }

    const id = stringValue(item.id);
    const name = stringValue(item.name);
    const state = migrateCreativeState(
      item.state,
      warnings,
      `world.snapshots[${index}].state`,
    );

    if (!id || !name || !state || ids.has(id)) {
      warnings.push(`world.snapshots[${index}] could not be recovered and was dropped.`);
      continue;
    }

    ids.add(id);
    snapshots.push({
      id,
      name,
      createdAt: finiteNumber(item.createdAt, 0),
      state,
    });
  }

  return snapshots.slice(0, 8);
}

export function migrateWorldDocument(raw: unknown): WorldMigrationResult {
  if (!isRecord(raw)) {
    throw new PersistenceError(
      'corrupt',
      'Saved World is not a valid document.',
    );
  }

  const rawVersion = integerValue(raw.schemaVersion, 1);
  const fromVersion = Math.max(1, rawVersion);

  if (fromVersion > WORLD_SCHEMA_VERSION) {
    throw new PersistenceError(
      'future-version',
      `This World was created by a newer Loop schema (v${fromVersion}).`,
    );
  }

  const id = stringValue(raw.id);

  if (!id) {
    throw new PersistenceError(
      'corrupt',
      'Saved World has no valid id.',
    );
  }

  const warnings: string[] = [];
  const soundOrbs = migrateSoundOrbs(raw.soundOrbs, warnings, 'world');
  const effectFields = fromVersion >= 5
    ? migrateFields(raw.effectFields, warnings, 'world')
    : [];
  const playgroundToys = fromVersion >= 6
    ? migrateToys(raw.playgroundToys, warnings, 'world')
    : [];
  const links = fromVersion >= 7
    ? migrateLinks(raw.links, soundOrbs, warnings, 'world')
    : [];
  const snapshots = fromVersion >= 8
    ? migrateSnapshots(raw.snapshots, warnings)
    : [];

  if (fromVersion < 5 && Array.isArray(raw.effectFields) && raw.effectFields.length > 0) {
    warnings.push('Legacy placeholder Effect Fields were discarded during migration.');
  }

  if (fromVersion < 7 && Array.isArray(raw.links) && raw.links.length > 0) {
    warnings.push('Legacy placeholder Links were discarded during migration.');
  }

  if (fromVersion < 8 && Array.isArray(raw.snapshots) && raw.snapshots.length > 0) {
    warnings.push('Legacy placeholder Snapshots were discarded during migration.');
  }

  const createdAt = finiteNumber(raw.createdAt, Date.now());
  const updatedAt = finiteNumber(raw.updatedAt, createdAt);

  return {
    world: {
      schemaVersion: WORLD_SCHEMA_VERSION,
      id,
      name: stringValue(raw.name) ?? 'Untitled World',
      createdAt,
      updatedAt: Math.max(createdAt, updatedAt),
      music: migrateMusic(raw.music),
      soundOrbs,
      effectFields,
      playgroundToys,
      links,
      snapshots,
    },
    fromVersion,
    warnings,
  };
}
