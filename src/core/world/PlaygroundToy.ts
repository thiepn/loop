import { clampPoint, type NormalizedPoint } from './SoundOrb';

export const MAX_PLAYGROUND_TOYS = 4;
export const DEFAULT_TOY_RADIUS = 0.14;
export const MIN_TOY_RADIUS = 0.09;
export const MAX_TOY_RADIUS = 0.22;

export type PlaygroundToyType =
  | 'spinner'
  | 'magnet'
  | 'repulsor'
  | 'portal';

export interface PlaygroundToyDocument {
  readonly id: string;
  readonly type: PlaygroundToyType;
  readonly position: NormalizedPoint;
  readonly radius: number;
  readonly strength: number;
  readonly exitPosition?: NormalizedPoint;
}

export interface CreatePlaygroundToyOptions {
  readonly id?: string;
  readonly type: PlaygroundToyType;
  readonly position: NormalizedPoint;
  readonly radius?: number;
  readonly strength?: number;
  readonly exitPosition?: NormalizedPoint;
}

function createToyId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `toy-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function clampToyRadius(radius: number): number {
  if (!Number.isFinite(radius)) {
    return DEFAULT_TOY_RADIUS;
  }

  return Math.min(MAX_TOY_RADIUS, Math.max(MIN_TOY_RADIUS, radius));
}

export function clampToyStrength(strength: number): number {
  if (!Number.isFinite(strength)) {
    return 0.65;
  }

  return Math.min(1, Math.max(0.2, strength));
}

export function createPlaygroundToy(
  options: CreatePlaygroundToyOptions,
): PlaygroundToyDocument {
  const base: PlaygroundToyDocument = {
    id: options.id ?? createToyId(),
    type: options.type,
    position: clampPoint(options.position),
    radius: clampToyRadius(options.radius ?? DEFAULT_TOY_RADIUS),
    strength: clampToyStrength(options.strength ?? 0.65),
  };

  return options.type === 'portal'
    ? {
        ...base,
        exitPosition: clampPoint(
          options.exitPosition ?? { x: 0.78, y: 0.72 },
        ),
      }
    : base;
}

export function playgroundToyLabel(type: PlaygroundToyType): string {
  switch (type) {
    case 'spinner':
      return 'Spinner';
    case 'magnet':
      return 'Magnet';
    case 'repulsor':
      return 'Repulsor';
    case 'portal':
      return 'Portal';
  }
}

export function playgroundToyDescription(type: PlaygroundToyType): string {
  switch (type) {
    case 'spinner':
      return 'Makes nearby sounds circle';
    case 'magnet':
      return 'Pulls sounds toward it';
    case 'repulsor':
      return 'Pushes sounds away';
    case 'portal':
      return 'Sends sounds somewhere else';
  }
}

export function toyDepthAtPoint(
  toy: PlaygroundToyDocument,
  point: NormalizedPoint,
): number {
  const radius = clampToyRadius(toy.radius);
  const distance = Math.hypot(
    point.x - toy.position.x,
    point.y - toy.position.y,
  );

  if (distance >= radius - 1e-9) {
    return 0;
  }

  const depth = 1 - distance / radius;
  return Math.max(0, Math.min(1, depth));
}
