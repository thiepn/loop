import { clamp01, clampPoint, type NormalizedPoint } from './SoundOrb';

export const MAX_EFFECT_FIELDS = 5;
export const MIN_EFFECT_FIELD_RADIUS = 0.1;
export const MAX_EFFECT_FIELD_RADIUS = 0.34;
export const DEFAULT_EFFECT_FIELD_RADIUS = 0.18;

export type EffectFieldType =
  | 'space'
  | 'echo'
  | 'heat'
  | 'frost'
  | 'filter';

export interface EffectFieldDocument {
  readonly id: string;
  readonly type: EffectFieldType;
  readonly position: NormalizedPoint;
  readonly radius: number;
}

export interface EffectAmounts {
  readonly space: number;
  readonly echo: number;
  readonly heat: number;
  readonly frost: number;
  readonly filter: number;
}

export const EMPTY_EFFECT_AMOUNTS: EffectAmounts = {
  space: 0,
  echo: 0,
  heat: 0,
  frost: 0,
  filter: 0,
};

export interface CreateEffectFieldOptions {
  readonly id?: string;
  readonly type: EffectFieldType;
  readonly position: NormalizedPoint;
  readonly radius?: number;
}

function createEffectFieldId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `field-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function clampEffectFieldRadius(radius: number): number {
  if (!Number.isFinite(radius)) {
    return DEFAULT_EFFECT_FIELD_RADIUS;
  }

  return Math.min(
    MAX_EFFECT_FIELD_RADIUS,
    Math.max(MIN_EFFECT_FIELD_RADIUS, radius),
  );
}

export function createEffectField(options: CreateEffectFieldOptions): EffectFieldDocument {
  return {
    id: options.id ?? createEffectFieldId(),
    type: options.type,
    position: clampPoint(options.position),
    radius: clampEffectFieldRadius(options.radius ?? DEFAULT_EFFECT_FIELD_RADIUS),
  };
}

export function effectFieldLabel(type: EffectFieldType): string {
  switch (type) {
    case 'space':
      return 'Space';
    case 'echo':
      return 'Echo';
    case 'heat':
      return 'Heat';
    case 'frost':
      return 'Frost';
    case 'filter':
      return 'Filter';
  }
}

export function effectFieldDescription(type: EffectFieldType): string {
  switch (type) {
    case 'space':
      return 'Wide and roomy';
    case 'echo':
      return 'Repeats and trails';
    case 'heat':
      return 'Warm to rough';
    case 'frost':
      return 'Icy and fractured';
    case 'filter':
      return 'Soft and dark';
  }
}

function smoothDepth(value: number): number {
  const clamped = clamp01(value);
  return clamped * clamped * (3 - 2 * clamped);
}

export function effectAmountAtPoint(
  field: EffectFieldDocument,
  point: NormalizedPoint,
): number {
  const radius = clampEffectFieldRadius(field.radius);
  const dx = (point.x - field.position.x) / radius;
  const dy = (point.y - field.position.y) / radius;
  const distance = Math.hypot(dx, dy);

  if (distance >= 1) {
    return 0;
  }

  return smoothDepth(1 - distance);
}

function combineAmounts(current: number, incoming: number): number {
  return 1 - (1 - clamp01(current)) * (1 - clamp01(incoming));
}

export function effectAmountsAtPoint(
  fields: readonly EffectFieldDocument[],
  point: NormalizedPoint,
): EffectAmounts {
  let amounts: EffectAmounts = EMPTY_EFFECT_AMOUNTS;

  for (const field of fields) {
    const amount = effectAmountAtPoint(field, point);

    if (amount <= 0) {
      continue;
    }

    amounts = {
      ...amounts,
      [field.type]: combineAmounts(amounts[field.type], amount),
    };
  }

  return amounts;
}

export function dominantEffectAtPoint(
  fields: readonly EffectFieldDocument[],
  point: NormalizedPoint,
): { readonly type: EffectFieldType; readonly amount: number } | null {
  const amounts = effectAmountsAtPoint(fields, point);
  const entries = Object.entries(amounts) as [EffectFieldType, number][];
  const strongest = entries.sort((a, b) => b[1] - a[1])[0];

  if (!strongest || strongest[1] <= 0) {
    return null;
  }

  return {
    type: strongest[0],
    amount: strongest[1],
  };
}
