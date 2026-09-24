import { describe, expect, it } from 'vitest';
import {
  LONG_PRESS_CANCEL_DISTANCE_PX,
  LONG_PRESS_CHARGE_MS,
  chargeEnvelope,
  dragVelocitySample,
  hoverInteractionAtPoint,
  movedDistancePixels,
  pointerPositionInRect,
  resizeTension,
  settleEnvelope,
  transientOrbInteraction,
} from '../src/core/visual/v2/InteractionModel';

describe('Visual V2 interaction model', () => {
  it('normalizes and clamps pointer coordinates inside the World', () => {
    const rect = {
      left: 100,
      top: 50,
      width: 400,
      height: 200,
    };

    expect(pointerPositionInRect(300, 150, rect)).toEqual({
      x: 0.5,
      y: 0.5,
    });
    expect(pointerPositionInRect(0, 900, rect)).toEqual({
      x: 0,
      y: 1,
    });
    expect(pointerPositionInRect(0, 0, {
      ...rect,
      width: 0,
    })).toBeNull();
  });

  it('creates bounded magnetic hover attraction only near an Orb', () => {
    const near = hoverInteractionAtPoint(
      { x: 0.53, y: 0.5 },
      { x: 0.5, y: 0.5 },
      1000,
      700,
      true,
    );
    const far = hoverInteractionAtPoint(
      { x: 0.9, y: 0.9 },
      { x: 0.5, y: 0.5 },
      1000,
      700,
      true,
    );
    const disabled = hoverInteractionAtPoint(
      { x: 0.53, y: 0.5 },
      { x: 0.5, y: 0.5 },
      1000,
      700,
      false,
    );

    expect(near.hoverStrength).toBeGreaterThan(0);
    expect(near.hoverStrength).toBeLessThanOrEqual(1);
    expect(near.hoverOffset.x).toBeGreaterThan(0);
    expect(Math.abs(near.hoverOffset.y)).toBeLessThan(0.001);
    expect(far.hoverStrength).toBe(0);
    expect(disabled.hoverStrength).toBe(0);
  });

  it('converts drag movement into bounded direction and speed', () => {
    const sample = dragVelocitySample(
      { x: 0.2, y: 0.2 },
      { x: 0.32, y: 0.26 },
      16,
      1000,
      700,
    );

    expect(sample.direction.x).toBeGreaterThan(0);
    expect(sample.direction.y).toBeGreaterThan(0);
    expect(Math.hypot(
      sample.direction.x,
      sample.direction.y,
    )).toBeCloseTo(1);
    expect(sample.speed).toBeGreaterThan(0);
    expect(sample.speed).toBeLessThanOrEqual(1);
  });

  it('measures long-press cancellation distance in pixels', () => {
    const moved = movedDistancePixels(
      { x: 0.5, y: 0.5 },
      { x: 0.51, y: 0.5 },
      1000,
      700,
    );

    expect(LONG_PRESS_CHARGE_MS).toBe(420);
    expect(LONG_PRESS_CANCEL_DISTANCE_PX).toBe(9);
    expect(moved).toBeCloseTo(10);
    expect(moved).toBeGreaterThan(LONG_PRESS_CANCEL_DISTANCE_PX);
  });

  it('maps Field resize distance into bounded visual tension', () => {
    const low = resizeTension(
      { x: 0.5, y: 0.5 },
      { x: 0.68, y: 0.5 },
      0.18,
      1000,
      1000,
    );
    const high = resizeTension(
      { x: 0.5, y: 0.5 },
      { x: 0.9, y: 0.5 },
      0.18,
      1000,
      1000,
    );

    expect(low).toBeLessThan(high);
    expect(high).toBeLessThanOrEqual(1);
  });

  it('provides damped settle and bounded charge envelopes', () => {
    expect(settleEnvelope(0)).toBeCloseTo(0);
    expect(settleEnvelope(1)).toBeCloseTo(0);
    expect(Math.abs(settleEnvelope(0.2))).toBeGreaterThan(0);
    expect(chargeEnvelope(0)).toBeCloseTo(0);
    expect(chargeEnvelope(1)).toBeCloseTo(0);
    expect(chargeEnvelope(0.5)).toBeGreaterThan(0);
  });

  it('extracts the strongest transient drop and charge response per Orb', () => {
    const response = transientOrbInteraction(
      'orb',
      [
        {
          event: {
            kind: 'orb-drop',
            orbId: 'orb',
            position: { x: 0.5, y: 0.5 },
            velocity: { x: 1, y: 0 },
            intensity: 0.8,
          },
          progress: 0.18,
        },
        {
          event: {
            kind: 'orb-charge',
            orbId: 'orb',
            position: { x: 0.5, y: 0.5 },
            intensity: 1,
          },
          progress: 0.4,
        },
      ],
    );

    expect(Math.abs(response.settle)).toBeGreaterThan(0);
    expect(response.settleDirection).toEqual({ x: 1, y: 0 });
    expect(response.charge).toBeGreaterThan(0);
    expect(response.charge).toBeLessThanOrEqual(1);
  });
});
