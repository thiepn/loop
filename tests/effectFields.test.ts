import { describe, expect, it } from 'vitest';
import {
  createEffectField,
  dominantEffectAtPoint,
  effectAmountAtPoint,
  effectAmountsAtPoint,
} from '../src/core/world/EffectField';

describe('EffectField geometry', () => {
  it('is strongest at the center and zero at the boundary', () => {
    const field = createEffectField({
      id: 'space-a',
      type: 'space',
      position: { x: 0.5, y: 0.5 },
      radius: 0.2,
    });

    expect(effectAmountAtPoint(field, { x: 0.5, y: 0.5 })).toBeCloseTo(1);
    expect(effectAmountAtPoint(field, { x: 0.7, y: 0.5 })).toBe(0);
  });

  it('changes smoothly with depth', () => {
    const field = createEffectField({
      id: 'echo-a',
      type: 'echo',
      position: { x: 0.5, y: 0.5 },
      radius: 0.2,
    });

    const deep = effectAmountAtPoint(field, { x: 0.54, y: 0.5 });
    const shallow = effectAmountAtPoint(field, { x: 0.64, y: 0.5 });

    expect(deep).toBeGreaterThan(shallow);
    expect(shallow).toBeGreaterThan(0);
  });

  it('combines overlapping fields without exceeding one', () => {
    const fields = [
      createEffectField({
        id: 'space-a',
        type: 'space',
        position: { x: 0.5, y: 0.5 },
        radius: 0.3,
      }),
      createEffectField({
        id: 'space-b',
        type: 'space',
        position: { x: 0.54, y: 0.5 },
        radius: 0.3,
      }),
      createEffectField({
        id: 'heat-a',
        type: 'heat',
        position: { x: 0.5, y: 0.5 },
        radius: 0.15,
      }),
    ];

    const amounts = effectAmountsAtPoint(fields, { x: 0.5, y: 0.5 });

    expect(amounts.space).toBeGreaterThan(0.9);
    expect(amounts.space).toBeLessThanOrEqual(1);
    expect(amounts.heat).toBeCloseTo(1);
    expect(amounts.echo).toBe(0);
  });

  it('reports the strongest effect for visual feedback', () => {
    const fields = [
      createEffectField({
        id: 'space-a',
        type: 'space',
        position: { x: 0.5, y: 0.5 },
        radius: 0.3,
      }),
      createEffectField({
        id: 'frost-a',
        type: 'frost',
        position: { x: 0.7, y: 0.5 },
        radius: 0.12,
      }),
    ];

    expect(dominantEffectAtPoint(fields, { x: 0.7, y: 0.5 })?.type).toBe('frost');
  });

  it('clamps unsafe field sizes', () => {
    const tiny = createEffectField({
      id: 'tiny',
      type: 'filter',
      position: { x: 0.5, y: 0.5 },
      radius: 0,
    });
    const huge = createEffectField({
      id: 'huge',
      type: 'filter',
      position: { x: 0.5, y: 0.5 },
      radius: 4,
    });

    expect(tiny.radius).toBe(0.1);
    expect(huge.radius).toBe(0.34);
  });
});
