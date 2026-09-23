import { describe, expect, it } from 'vitest';
import {
  addPlaygroundToy,
  deletePlaygroundToy,
  movePlaygroundToy,
  movePortalExit,
} from '../src/core/world/PlaygroundToyActions';
import { createEmptyWorld } from '../src/core/world/World';

describe('PlaygroundToyActions', () => {
  it('adds each toy type only once', () => {
    let world = createEmptyWorld();
    world = addPlaygroundToy(world, 'spinner').world;

    const duplicate = addPlaygroundToy(world, 'spinner');

    expect(world.playgroundToys).toHaveLength(1);
    expect(duplicate.createdId).toBeNull();
    expect(duplicate.reason).toBe('duplicate');
  });

  it('supports the four-toy V1 cap', () => {
    let world = createEmptyWorld();

    for (const type of ['spinner', 'magnet', 'repulsor', 'portal'] as const) {
      world = addPlaygroundToy(world, type).world;
    }

    expect(world.playgroundToys).toHaveLength(4);
    expect(addPlaygroundToy(world, 'spinner').createdId).toBeNull();
  });

  it('moves toys within normalized World bounds', () => {
    const added = addPlaygroundToy(createEmptyWorld(), 'magnet').world;
    const id = added.playgroundToys[0]!.id;
    const moved = movePlaygroundToy(added, id, { x: 2, y: -1 }, 200);

    expect(moved.playgroundToys[0]?.position).toEqual({ x: 1, y: 0 });
  });

  it('moves Portal exit independently', () => {
    const added = addPlaygroundToy(createEmptyWorld(), 'portal').world;
    const portal = added.playgroundToys[0]!;
    const moved = movePortalExit(
      added,
      portal.id,
      { x: 0.12, y: 0.88 },
      200,
    );

    expect(moved.playgroundToys[0]?.position).toEqual(portal.position);
    expect(moved.playgroundToys[0]?.exitPosition).toEqual({
      x: 0.12,
      y: 0.88,
    });
  });

  it('deletes only the requested toy', () => {
    let world = addPlaygroundToy(createEmptyWorld(), 'spinner').world;
    world = addPlaygroundToy(world, 'magnet').world;
    const spinnerId = world.playgroundToys.find((toy) => toy.type === 'spinner')!.id;

    const next = deletePlaygroundToy(world, spinnerId, 200);

    expect(next.playgroundToys).toHaveLength(1);
    expect(next.playgroundToys[0]?.type).toBe('magnet');
  });
});
