import type { WorldDocument } from '../world/World';
import { PersistenceError } from './PersistenceError';
import { migrateWorldDocument } from './WorldMigration';

export const LOOP_BACKUP_VERSION = 1 as const;
export const LOOP_BACKUP_FORMAT = 'loop-world-backup' as const;

export interface LoopBackupEnvelope {
  readonly format: typeof LOOP_BACKUP_FORMAT;
  readonly version: typeof LOOP_BACKUP_VERSION;
  readonly exportedAt: number;
  readonly worlds: readonly WorldDocument[];
}

export interface DecodedLoopBackup {
  readonly worlds: readonly WorldDocument[];
  readonly warnings: readonly string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function encodeLoopBackup(
  worlds: readonly WorldDocument[],
  now = Date.now(),
): string {
  const envelope: LoopBackupEnvelope = {
    format: LOOP_BACKUP_FORMAT,
    version: LOOP_BACKUP_VERSION,
    exportedAt: now,
    worlds,
  };

  return JSON.stringify(envelope, null, 2);
}

export function decodeLoopBackup(text: string): DecodedLoopBackup {
  let raw: unknown;

  try {
    raw = JSON.parse(text) as unknown;
  } catch (error) {
    throw new PersistenceError(
      'invalid-backup',
      'This file is not valid JSON.',
      { cause: error },
    );
  }

  if (
    !isRecord(raw)
    || raw.format !== LOOP_BACKUP_FORMAT
    || raw.version !== LOOP_BACKUP_VERSION
    || !Array.isArray(raw.worlds)
  ) {
    throw new PersistenceError(
      'invalid-backup',
      'This is not a supported Loop backup file.',
    );
  }

  const worlds: WorldDocument[] = [];
  const warnings: string[] = [];

  for (const [index, worldRaw] of raw.worlds.entries()) {
    try {
      const migrated = migrateWorldDocument(worldRaw);
      worlds.push(migrated.world);
      warnings.push(
        ...migrated.warnings.map(
          (warning) => `World ${index + 1}: ${warning}`,
        ),
      );
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Unknown World error.';
      warnings.push(
        `World ${index + 1} could not be imported: ${message}`,
      );
    }
  }

  if (worlds.length === 0) {
    throw new PersistenceError(
      'invalid-backup',
      'The backup did not contain any recoverable Worlds.',
    );
  }

  return {
    worlds,
    warnings,
  };
}
