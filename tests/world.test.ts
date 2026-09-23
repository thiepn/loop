import { describe, expect, it } from 'vitest';
import { createEmptyWorld, WORLD_SCHEMA_VERSION } from '../src/core/world/World';

describe('createEmptyWorld', () => {
  it('creates a deterministic empty document when id and time are supplied', () => {
    const world = createEmptyWorld({
      id: 'world-test',
      name: '  Dream Garden  ',
      now: 1234,
      music: {
        bpm: 96,
        tonic: 9,
        scale: 'major-pentatonic',
        seed: 42,
      },
    });

    expect(world).toEqual({
      schemaVersion: WORLD_SCHEMA_VERSION,
      id: 'world-test',
      name: 'Dream Garden',
      createdAt: 1234,
      updatedAt: 1234,
      music: {
        bpm: 96,
        tonic: 9,
        scale: 'major-pentatonic',
        seed: 42,
      },
      soundOrbs: [],
      effectFields: [],
      links: [],
      snapshots: [],
    });
  });

  it('provides safe musical defaults', () => {
    const world = createEmptyWorld({
      id: 'world-test',
      name: '   ',
      now: 1234,
    });

    expect(world.name).toBe('Untitled World');
    expect(world.music).toEqual({
      bpm: 108,
      tonic: 0,
      scale: 'minor-pentatonic',
      seed: 1,
    });
  });
});
