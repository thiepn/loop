import { describe, expect, it } from 'vitest';
import {
  decodeLoopBackup,
  encodeLoopBackup,
} from '../src/core/persistence/Backup';
import { PersistenceError } from '../src/core/persistence/PersistenceError';
import { createStarterWorld } from '../src/core/world/StarterWorlds';
import { WORLD_SCHEMA_VERSION } from '../src/core/world/World';

describe('Loop backup', () => {
  it('round-trips current Worlds', () => {
    const worlds = [
      createStarterWorld('beat', 100),
      createStarterWorld('dreamy', 200),
    ];

    const text = encodeLoopBackup(worlds, 300);
    const decoded = decodeLoopBackup(text);

    expect(decoded.worlds).toEqual(worlds);
    expect(decoded.warnings).toEqual([]);
  });

  it('migrates recoverable legacy Worlds inside a backup', () => {
    const world = createStarterWorld('beat', 100);
    const legacy = {
      ...world,
      schemaVersion: 7,
      snapshots: ['old'],
    };

    const text = JSON.stringify({
      format: 'loop-world-backup',
      version: 1,
      exportedAt: 300,
      worlds: [legacy],
    });

    const decoded = decodeLoopBackup(text);

    expect(decoded.worlds[0]?.schemaVersion).toBe(WORLD_SCHEMA_VERSION);
    expect(decoded.worlds[0]?.snapshots).toEqual([]);
    expect(decoded.warnings.length).toBeGreaterThan(0);
  });

  it('rejects malformed or unsupported backup envelopes', () => {
    expect(() => decodeLoopBackup('{bad json')).toThrow(PersistenceError);
    expect(() => decodeLoopBackup(JSON.stringify({
      format: 'something-else',
      version: 1,
      worlds: [],
    }))).toThrow(PersistenceError);
  });

  it('skips unrecoverable Worlds when another World can be imported', () => {
    const valid = createStarterWorld('chill', 100);
    const text = JSON.stringify({
      format: 'loop-world-backup',
      version: 1,
      exportedAt: 300,
      worlds: [
        { schemaVersion: 8 },
        valid,
      ],
    });

    const decoded = decodeLoopBackup(text);

    expect(decoded.worlds).toHaveLength(1);
    expect(decoded.worlds[0]?.id).toBe(valid.id);
    expect(decoded.warnings).toHaveLength(1);
  });
});
