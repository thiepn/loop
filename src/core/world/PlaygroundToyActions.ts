import {
  MAX_PLAYGROUND_TOYS,
  createPlaygroundToy,
  type PlaygroundToyDocument,
  type PlaygroundToyType,
} from './PlaygroundToy';
import { clampPoint, type NormalizedPoint } from './SoundOrb';
import type { WorldDocument } from './World';

export interface AddPlaygroundToyResult {
  readonly world: WorldDocument;
  readonly createdId: string | null;
  readonly reason?: 'limit' | 'duplicate';
}

function touch(
  world: WorldDocument,
  toys: readonly PlaygroundToyDocument[],
  now: number,
): WorldDocument {
  return {
    ...world,
    updatedAt: now,
    playgroundToys: toys,
  };
}

export function playgroundToyById(
  world: WorldDocument,
  toyId: string,
): PlaygroundToyDocument | undefined {
  return world.playgroundToys.find((toy) => toy.id === toyId);
}

export function suggestedToyPlacement(type: PlaygroundToyType): {
  readonly position: NormalizedPoint;
  readonly exitPosition?: NormalizedPoint;
} {
  switch (type) {
    case 'spinner':
      return { position: { x: 0.24, y: 0.26 } };
    case 'magnet':
      return { position: { x: 0.76, y: 0.28 } };
    case 'repulsor':
      return { position: { x: 0.28, y: 0.76 } };
    case 'portal':
      return {
        position: { x: 0.76, y: 0.72 },
        exitPosition: { x: 0.24, y: 0.48 },
      };
  }
}

export function addPlaygroundToy(
  world: WorldDocument,
  type: PlaygroundToyType,
  now = Date.now(),
): AddPlaygroundToyResult {
  if (world.playgroundToys.some((toy) => toy.type === type)) {
    return {
      world,
      createdId: null,
      reason: 'duplicate',
    };
  }

  if (world.playgroundToys.length >= MAX_PLAYGROUND_TOYS) {
    return {
      world,
      createdId: null,
      reason: 'limit',
    };
  }

  const placement = suggestedToyPlacement(type);
  const toy = createPlaygroundToy({
    type,
    position: placement.position,
    ...(placement.exitPosition
      ? { exitPosition: placement.exitPosition }
      : {}),
  });

  return {
    world: touch(world, [...world.playgroundToys, toy], now),
    createdId: toy.id,
  };
}

export function movePlaygroundToy(
  world: WorldDocument,
  toyId: string,
  position: NormalizedPoint,
  now = Date.now(),
): WorldDocument {
  const nextPosition = clampPoint(position);
  let changed = false;

  const toys = world.playgroundToys.map((toy) => {
    if (toy.id !== toyId) {
      return toy;
    }

    if (
      toy.position.x === nextPosition.x &&
      toy.position.y === nextPosition.y
    ) {
      return toy;
    }

    changed = true;
    return {
      ...toy,
      position: nextPosition,
    };
  });

  return changed ? touch(world, toys, now) : world;
}

export function movePortalExit(
  world: WorldDocument,
  toyId: string,
  exitPosition: NormalizedPoint,
  now = Date.now(),
): WorldDocument {
  const nextPosition = clampPoint(exitPosition);
  let changed = false;

  const toys = world.playgroundToys.map((toy) => {
    if (toy.id !== toyId || toy.type !== 'portal') {
      return toy;
    }

    if (
      toy.exitPosition?.x === nextPosition.x &&
      toy.exitPosition?.y === nextPosition.y
    ) {
      return toy;
    }

    changed = true;
    return {
      ...toy,
      exitPosition: nextPosition,
    };
  });

  return changed ? touch(world, toys, now) : world;
}

export function deletePlaygroundToy(
  world: WorldDocument,
  toyId: string,
  now = Date.now(),
): WorldDocument {
  const toys = world.playgroundToys.filter((toy) => toy.id !== toyId);

  return toys.length === world.playgroundToys.length
    ? world
    : touch(world, toys, now);
}
