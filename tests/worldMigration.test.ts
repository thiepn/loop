import { describe, expect, it } from 'vitest';
import { PersistenceError } from '../src/core/persistence/PersistenceError';
import { migrateWorldDocument } from '../src/core/persistence/WorldMigration';
import { WORLD_SCHEMA_VERSION } from '../src/core/world/World';
import { MAX_SOUND_ORBS } from '../src/core/world/SoundOrb';
import { addSnapshot } from '../src/core/world/Snapshot';
import { createStarterWorld } from '../src/core/world/StarterWorlds';

describe('WorldMigration', () => {
  it('migrates schema v7 into typed Snapshot schema v8', () => {
    const current = createStarterWorld('beat', 100);
    const legacy = {
      ...current,
      schemaVersion: 7,
      snapshots: ['placeholder'],
    };

    const result = migrateWorldDocument(legacy);

    expect(result.fromVersion).toBe(7);
    expect(result.world.schemaVersion).toBe(WORLD_SCHEMA_VERSION);
    expect(result.world.snapshots).toEqual([]);
    expect(result.warnings.some((warning) => warning.includes('Snapshots'))).toBe(true);
  });

  it('fills collections that did not exist in older Worlds', () => {
    const current = createStarterWorld('dreamy', 100);
    const legacy = {
      schemaVersion: 4,
      id: current.id,
      name: current.name,
      createdAt: current.createdAt,
      updatedAt: current.updatedAt,
      music: current.music,
      soundOrbs: current.soundOrbs,
      effectFields: ['placeholder'],
      links: ['placeholder'],
      snapshots: ['placeholder'],
    };

    const result = migrateWorldDocument(legacy);

    expect(result.world.soundOrbs.length).toBe(current.soundOrbs.length);
    expect(result.world.effectFields).toEqual([]);
    expect(result.world.playgroundToys).toEqual([]);
    expect(result.world.links).toEqual([]);
    expect(result.world.snapshots).toEqual([]);
  });

  it('preserves typed v8 Snapshots during validation migration', () => {
    const world = addSnapshot(
      createStarterWorld('dreamy', 100),
      'Keep me',
      200,
    ).world;

    const result = migrateWorldDocument(world);

    expect(result.world.snapshots).toHaveLength(1);
    expect(result.world.snapshots[0]?.name).toBe('Keep me');
    expect(result.world.snapshots[0]?.state.soundOrbs).toEqual(
      world.soundOrbs,
    );
  });

  it('drops a corrupt child record but preserves recoverable World data', () => {
    const current = createStarterWorld('beat', 100);
    const damaged = {
      ...current,
      soundOrbs: [
        ...current.soundOrbs,
        { id: '', soundId: 'missing' },
      ],
    };

    const result = migrateWorldDocument(damaged);

    expect(result.world.soundOrbs).toEqual(current.soundOrbs);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('bounds oversized recovered sound collections to the product limit', () => {
    const current = createStarterWorld('beat', 100);
    const source = current.soundOrbs[0]!;
    const damaged = {
      ...current,
      soundOrbs: Array.from(
        { length: MAX_SOUND_ORBS + 4 },
        (_, index) => ({
          ...source,
          id: `recovered-orb-${index}`,
        }),
      ),
    };

    const result = migrateWorldDocument(damaged);

    expect(result.world.soundOrbs).toHaveLength(MAX_SOUND_ORBS);
    expect(
      result.warnings.some((warning) => warning.includes('sound limit')),
    ).toBe(true);
  });

  it('rejects invalid roots', () => {
    expect(() => migrateWorldDocument(null)).toThrow(PersistenceError);
    expect(() => migrateWorldDocument({ schemaVersion: 8 })).toThrow(
      PersistenceError,
    );
  });

  it('rejects future schema versions instead of guessing', () => {
    expect(() => migrateWorldDocument({
      schemaVersion: WORLD_SCHEMA_VERSION + 1,
      id: 'future',
    })).toThrow(/newer Loop schema/);
  });
});
