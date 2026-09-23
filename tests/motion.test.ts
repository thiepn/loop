import { describe, expect, it } from 'vitest';
import {
  createMotion,
  evaluateFollowMotion,
  evaluateIndependentMotion,
} from '../src/core/world/Motion';
import { createSoundOrb } from '../src/core/world/SoundOrb';

function makeOrb(
  id: string,
  mode: Parameters<typeof createMotion>[0]['mode'],
) {
  return createSoundOrb({
    id,
    soundId: 'melody-soft-pluck',
    role: 'melody',
    position: { x: 0.5, y: 0.5 },
    motion: createMotion({
      mode,
      speed: 'medium',
      range: 'medium',
      seed: 42,
    }),
  });
}

describe('Motion', () => {
  it('keeps Still at the saved anchor', () => {
    const orb = makeOrb('still-orb', 'still');

    expect(evaluateIndependentMotion(orb, 10)).toEqual({
      x: 0.5,
      y: 0.5,
    });
  });

  it('moves Orbit around the saved anchor and stays bounded', () => {
    const orb = makeOrb('orbit-orb', 'orbit');
    const first = evaluateIndependentMotion(orb, 0);
    const later = evaluateIndependentMotion(orb, 3);

    expect(later).not.toEqual(first);
    expect(later.x).toBeGreaterThanOrEqual(0.04);
    expect(later.x).toBeLessThanOrEqual(0.96);
    expect(later.y).toBeGreaterThanOrEqual(0.04);
    expect(later.y).toBeLessThanOrEqual(0.96);
  });

  it('moves Bounce deterministically', () => {
    const orb = makeOrb('bounce-orb', 'bounce');

    expect(evaluateIndependentMotion(orb, 2)).toEqual(
      evaluateIndependentMotion(orb, 2),
    );
    expect(evaluateIndependentMotion(orb, 2)).not.toEqual(
      evaluateIndependentMotion(orb, 0),
    );
  });

  it('keeps Drift and Wander reproducible for the same time', () => {
    for (const mode of ['drift', 'wander'] as const) {
      const orb = makeOrb(`${mode}-orb`, mode);
      expect(evaluateIndependentMotion(orb, 12.5)).toEqual(
        evaluateIndependentMotion(orb, 12.5),
      );
    }
  });

  it('moves Follow toward its target rather than storing the target position', () => {
    const orb = makeOrb('follow-orb', 'follow');
    const target = { x: 0.82, y: 0.28 };
    const result = evaluateFollowMotion(orb, target, 3);

    const originalDistance = Math.hypot(
      target.x - orb.position.x,
      target.y - orb.position.y,
    );
    const resultDistance = Math.hypot(
      target.x - result.x,
      target.y - result.y,
    );

    expect(resultDistance).toBeLessThan(originalDistance);
    expect(result).not.toEqual(target);
  });
});
