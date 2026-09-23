import {
  MAX_EFFECT_FIELDS,
  clampEffectFieldRadius,
  createEffectField,
  type EffectFieldDocument,
  type EffectFieldType,
} from './EffectField';
import { clampPoint, type NormalizedPoint } from './SoundOrb';
import type { WorldDocument } from './World';

export interface AddEffectFieldResult {
  readonly world: WorldDocument;
  readonly createdId: string | null;
  readonly reason?: 'limit' | 'duplicate';
}

function touch(
  world: WorldDocument,
  effectFields: readonly EffectFieldDocument[],
  now: number,
): WorldDocument {
  return {
    ...world,
    updatedAt: now,
    effectFields,
  };
}

export function effectFieldById(
  world: WorldDocument,
  fieldId: string,
): EffectFieldDocument | undefined {
  return world.effectFields.find((field) => field.id === fieldId);
}

export function suggestedEffectFieldPlacement(type: EffectFieldType): {
  readonly position: NormalizedPoint;
  readonly radius: number;
} {
  switch (type) {
    case 'space':
      return { position: { x: 0.74, y: 0.68 }, radius: 0.23 };
    case 'echo':
      return { position: { x: 0.76, y: 0.3 }, radius: 0.19 };
    case 'heat':
      return { position: { x: 0.24, y: 0.7 }, radius: 0.17 };
    case 'frost':
      return { position: { x: 0.27, y: 0.27 }, radius: 0.19 };
    case 'filter':
      return { position: { x: 0.52, y: 0.18 }, radius: 0.18 };
  }
}

export function addEffectField(
  world: WorldDocument,
  type: EffectFieldType,
  now = Date.now(),
): AddEffectFieldResult {
  if (world.effectFields.some((field) => field.type === type)) {
    return {
      world,
      createdId: null,
      reason: 'duplicate',
    };
  }

  if (world.effectFields.length >= MAX_EFFECT_FIELDS) {
    return {
      world,
      createdId: null,
      reason: 'limit',
    };
  }

  const placement = suggestedEffectFieldPlacement(type);
  const field = createEffectField({
    type,
    position: placement.position,
    radius: placement.radius,
  });

  return {
    world: touch(world, [...world.effectFields, field], now),
    createdId: field.id,
  };
}

export function moveEffectField(
  world: WorldDocument,
  fieldId: string,
  position: NormalizedPoint,
  now = Date.now(),
): WorldDocument {
  const nextPosition = clampPoint(position);
  let changed = false;

  const fields = world.effectFields.map((field) => {
    if (field.id !== fieldId) {
      return field;
    }

    if (
      field.position.x === nextPosition.x &&
      field.position.y === nextPosition.y
    ) {
      return field;
    }

    changed = true;
    return {
      ...field,
      position: nextPosition,
    };
  });

  return changed ? touch(world, fields, now) : world;
}

export function resizeEffectField(
  world: WorldDocument,
  fieldId: string,
  radius: number,
  now = Date.now(),
): WorldDocument {
  const nextRadius = clampEffectFieldRadius(radius);
  let changed = false;

  const fields = world.effectFields.map((field) => {
    if (field.id !== fieldId || field.radius === nextRadius) {
      return field;
    }

    changed = true;
    return {
      ...field,
      radius: nextRadius,
    };
  });

  return changed ? touch(world, fields, now) : world;
}

export function deleteEffectField(
  world: WorldDocument,
  fieldId: string,
  now = Date.now(),
): WorldDocument {
  const fields = world.effectFields.filter((field) => field.id !== fieldId);

  return fields.length === world.effectFields.length
    ? world
    : touch(world, fields, now);
}
