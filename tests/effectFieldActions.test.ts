import { describe, expect, it } from 'vitest';
import {
  addEffectField,
  deleteEffectField,
  moveEffectField,
  resizeEffectField,
} from '../src/core/world/EffectFieldActions';
import { createEmptyWorld } from '../src/core/world/World';

describe('EffectFieldActions', () => {
  it('adds one field of a requested type', () => {
    const world = createEmptyWorld({ id: 'world', now: 100 });
    const result = addEffectField(world, 'echo', 200);

    expect(result.createdId).not.toBeNull();
    expect(result.world.effectFields).toHaveLength(1);
    expect(result.world.effectFields[0]?.type).toBe('echo');
  });

  it('prevents duplicate field types in the same World', () => {
    const first = addEffectField(createEmptyWorld(), 'space').world;
    const second = addEffectField(first, 'space');

    expect(second.createdId).toBeNull();
    expect(second.reason).toBe('duplicate');
    expect(second.world).toBe(first);
  });

  it('enforces the five-field V1 cap', () => {
    let world = createEmptyWorld();

    for (const type of ['space', 'echo', 'heat', 'frost', 'filter'] as const) {
      world = addEffectField(world, type).world;
    }

    const blocked = addEffectField(world, 'space');

    expect(world.effectFields).toHaveLength(5);
    expect(blocked.createdId).toBeNull();
  });

  it('moves and clamps field position', () => {
    const added = addEffectField(createEmptyWorld(), 'heat').world;
    const id = added.effectFields[0]!.id;
    const moved = moveEffectField(added, id, { x: 2, y: -1 }, 200);

    expect(moved.effectFields[0]?.position).toEqual({ x: 1, y: 0 });
    expect(moved.updatedAt).toBe(200);
  });

  it('resizes within safe bounds', () => {
    const added = addEffectField(createEmptyWorld(), 'frost').world;
    const id = added.effectFields[0]!.id;

    const tiny = resizeEffectField(added, id, 0.01, 200);
    const huge = resizeEffectField(added, id, 0.9, 200);

    expect(tiny.effectFields[0]?.radius).toBe(0.1);
    expect(huge.effectFields[0]?.radius).toBe(0.34);
  });

  it('deletes only the requested field', () => {
    let world = addEffectField(createEmptyWorld(), 'echo').world;
    world = addEffectField(world, 'space').world;
    const echoId = world.effectFields.find((field) => field.type === 'echo')!.id;

    const next = deleteEffectField(world, echoId, 200);

    expect(next.effectFields).toHaveLength(1);
    expect(next.effectFields[0]?.type).toBe('space');
  });
});
