import { describe, expect, it } from 'vitest';
import { createEmptyWorld, WORLD_SCHEMA_VERSION } from '../src/core/world/World';

describe('createEmptyWorld', () => {
  it('creates a deterministic empty document when id and time are supplied', () => {
    const world = createEmptyWorld({
      id: 'world-test',
      name: '  Dream Garden  ',
      now: 1234,
    });

    expect(world).toEqual({
      schemaVersion: WORLD_SCHEMA_VERSION,
      id: 'world-test',
      name: 'Dream Garden',
      createdAt: 1234,
      updatedAt: 1234,
      soundOrbs: [],
      effectFields: [],
      links: [],
      snapshots: [],
    });
  });

  it('falls back to an understandable default name', () => {
    const world = createEmptyWorld({
      id: 'world-test',
      name: '   ',
      now: 1234,
    });

    expect(world.name).toBe('Untitled World');
  });
});
