import type { NormalizedPoint } from './SoundOrb';

export interface SpatialMix {
  readonly pan: number;
  readonly presence: number;
  readonly distance: number;
}

const MAX_CENTER_DISTANCE = Math.SQRT1_2;

export function spatialMixForPoint(point: NormalizedPoint): SpatialMix {
  const dx = point.x - 0.5;
  const dy = point.y - 0.5;
  const distance = Math.min(1, Math.hypot(dx, dy) / MAX_CENTER_DISTANCE);

  return {
    pan: Math.max(-0.95, Math.min(0.95, dx * 1.9)),
    presence: 1 - distance * 0.68,
    distance,
  };
}
