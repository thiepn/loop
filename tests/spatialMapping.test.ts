import { describe, expect, it } from 'vitest';
import { spatialMixForPoint } from '../src/core/world/SpatialMapping';

describe('spatialMixForPoint', () => {
  it('keeps the listener center full and centered', () => {
    expect(spatialMixForPoint({ x: 0.5, y: 0.5 })).toEqual({
      pan: 0,
      presence: 1,
      distance: 0,
    });
  });

  it('maps horizontal position to bounded stereo pan', () => {
    expect(spatialMixForPoint({ x: 0, y: 0.5 }).pan).toBeCloseTo(-0.95);
    expect(spatialMixForPoint({ x: 1, y: 0.5 }).pan).toBeCloseTo(0.95);
  });

  it('reduces presence with distance while retaining audible floor', () => {
    const corner = spatialMixForPoint({ x: 0, y: 0 });
    expect(corner.distance).toBeCloseTo(1);
    expect(corner.presence).toBeCloseTo(0.32);
  });
});
