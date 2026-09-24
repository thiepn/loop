import { describe, expect, it } from 'vitest';
import {
  TrailHistory,
  shouldBreakTrail,
  strongestToyInfluence,
  trailPolicyForPreferences,
  trailRoleStyle,
} from '../src/core/visual/v2/TrailModel';
import {
  smoothedTrailPoints,
  trailAgeAlpha,
  trailVisualStyle,
} from '../src/core/visual/v2/TrailGeometry';
import { createEffectField } from '../src/core/world/EffectField';
import { createPlaygroundToy } from '../src/core/world/PlaygroundToy';
import { createSoundOrb } from '../src/core/world/SoundOrb';
import { createEmptyWorld } from '../src/core/world/World';
import type {
  RenderTrailPoint,
} from '../src/core/visual/v2/RenderTypes';

const HIGH = {
  quality: 'high' as const,
  reduceMotion: false,
  reduceParticles: false,
  reduceBloom: false,
};

const BALANCED = {
  quality: 'balanced' as const,
  reduceMotion: false,
  reduceParticles: false,
  reduceBloom: false,
};

const REDUCED = {
  quality: 'high' as const,
  reduceMotion: true,
  reduceParticles: false,
  reduceBloom: false,
};

function point(
  x: number,
  y: number,
  timestampMs: number,
  overrides: Partial<RenderTrailPoint> = {},
): RenderTrailPoint {
  return {
    position: { x, y },
    timestampMs,
    speed: 0.4,
    acceleration: 0.2,
    turn: 0.1,
    velocity: { x: 1, y: 0 },
    fieldInfluence: {
      space: 0,
      echo: 0,
      heat: 0,
      frost: 0,
      filter: 0,
    },
    toyInfluence: null,
    breakBefore: false,
    ...overrides,
  };
}

describe('Visual V2 trail policy', () => {
  it('scales point count and lifetime by quality', () => {
    const high = trailPolicyForPreferences(HIGH);
    const balanced = trailPolicyForPreferences(BALANCED);
    const battery = trailPolicyForPreferences({
      ...BALANCED,
      quality: 'battery',
    });

    expect(high.maxPoints).toBeGreaterThan(balanced.maxPoints);
    expect(balanced.maxPoints).toBeGreaterThan(battery.maxPoints);
    expect(high.lifetimeMs).toBeGreaterThan(balanced.lifetimeMs);
    expect(balanced.lifetimeMs).toBeGreaterThan(battery.lifetimeMs);
  });

  it('disables trail history completely under Reduce Motion', () => {
    const policy = trailPolicyForPreferences(REDUCED);

    expect(policy.maxPoints).toBe(0);
    expect(policy.lifetimeMs).toBe(0);
    expect(policy.baseAlpha).toBe(0);
  });

  it('defines distinct role materials', () => {
    expect(trailRoleStyle('bass').widthPx)
      .toBeGreaterThan(trailRoleStyle('melody').widthPx);
    expect(trailRoleStyle('harmony').layerCount).toBe(2);
    expect(trailRoleStyle('percussion').sparkScale)
      .toBeGreaterThan(trailRoleStyle('bass').sparkScale);
    expect(trailRoleStyle('texture').alpha)
      .toBeLessThan(trailRoleStyle('beat').alpha);
  });
});

describe('Visual V2 trail history', () => {
  it('samples speed, acceleration and turning while staying bounded', () => {
    const history = new TrailHistory();
    const orb = createSoundOrb({
      id: 'mover',
      soundId: 'melody-soft-pluck',
      role: 'melody',
      position: { x: 0.1, y: 0.1 },
    });
    const world = createEmptyWorld({
      soundOrbs: [orb],
    });

    for (let index = 0; index < 40; index += 1) {
      const x = 0.1 + index * 0.012;
      const y = index < 20
        ? 0.2
        : 0.2 + (index - 20) * 0.012;

      history.sampleOrb(
        orb,
        { x, y },
        index * 20,
        1000,
        700,
        [],
        [],
        HIGH,
      );
    }

    const trail = history.snapshot(world)[0];

    expect(trail).toBeDefined();
    expect(trail!.points.length)
      .toBeLessThanOrEqual(trailPolicyForPreferences(HIGH).maxPoints);
    expect(trail!.points.some((sample) => sample.speed > 0)).toBe(true);
    expect(trail!.points.some((sample) => sample.acceleration >= 0)).toBe(true);
    expect(trail!.points.some((sample) => sample.turn > 0.05)).toBe(true);
  });

  it('skips samples below the minimum pixel spacing', () => {
    const history = new TrailHistory();
    const orb = createSoundOrb({
      id: 'tiny',
      soundId: 'bass-warm',
      role: 'bass',
      position: { x: 0.2, y: 0.2 },
    });

    const first = history.sampleOrb(
      orb,
      { x: 0.2, y: 0.2 },
      0,
      1000,
      700,
      [],
      [],
      BALANCED,
    );
    const second = history.sampleOrb(
      orb,
      { x: 0.202, y: 0.2 },
      16,
      1000,
      700,
      [],
      [],
      BALANCED,
    );

    expect(first).toBe(true);
    expect(second).toBe(false);
  });

  it('captures Field and strongest toy influence at each sample', () => {
    const history = new TrailHistory();
    const orb = createSoundOrb({
      id: 'fx',
      soundId: 'melody-soft-pluck',
      role: 'melody',
      position: { x: 0.5, y: 0.5 },
    });
    const heat = createEffectField({
      id: 'heat',
      type: 'heat',
      position: { x: 0.5, y: 0.5 },
      radius: 0.25,
    });
    const magnet = createPlaygroundToy({
      id: 'magnet',
      type: 'magnet',
      position: { x: 0.5, y: 0.5 },
      radius: 0.2,
      strength: 0.9,
    });
    const world = createEmptyWorld({
      soundOrbs: [orb],
    });

    history.sampleOrb(
      orb,
      { x: 0.5, y: 0.5 },
      0,
      1000,
      700,
      [heat],
      [magnet],
      HIGH,
    );
    history.sampleOrb(
      orb,
      { x: 0.52, y: 0.5 },
      20,
      1000,
      700,
      [heat],
      [magnet],
      HIGH,
    );

    const sample = history.snapshot(world)[0]?.points.at(-1);

    expect(sample?.fieldInfluence.heat).toBeGreaterThan(0);
    expect(sample?.toyInfluence?.type).toBe('magnet');
    expect(sample?.toyInfluence?.amount).toBeGreaterThan(0);
  });

  it('prunes expired trails but keeps recent trails visible', () => {
    const history = new TrailHistory();
    const orb = createSoundOrb({
      id: 'decay',
      soundId: 'beat-round-kick',
      role: 'beat',
      position: { x: 0.1, y: 0.1 },
    });

    history.sampleOrb(
      orb,
      { x: 0.1, y: 0.1 },
      0,
      1000,
      700,
      [],
      [],
      BALANCED,
    );
    history.sampleOrb(
      orb,
      { x: 0.2, y: 0.1 },
      30,
      1000,
      700,
      [],
      [],
      BALANCED,
    );

    expect(history.hasVisible(100, BALANCED)).toBe(true);
    expect(history.prune(2000, BALANCED)).toBe(true);
    expect(history.hasVisible(2000, BALANCED)).toBe(false);
  });

  it('clears existing history when Reduce Motion becomes active', () => {
    const history = new TrailHistory();
    const orb = createSoundOrb({
      id: 'reduce',
      soundId: 'beat-round-kick',
      role: 'beat',
      position: { x: 0.1, y: 0.1 },
    });

    history.sampleOrb(
      orb,
      { x: 0.1, y: 0.1 },
      0,
      1000,
      700,
      [],
      [],
      HIGH,
    );
    history.sampleOrb(
      orb,
      { x: 0.2, y: 0.1 },
      30,
      1000,
      700,
      [],
      [],
      HIGH,
    );

    expect(history.prune(30, REDUCED)).toBe(true);
    expect(history.hasVisible(30, REDUCED)).toBe(false);
  });
});

describe('Visual V2 trail influence and geometry', () => {
  it('detects the strongest toy influence', () => {
    const magnet = createPlaygroundToy({
      id: 'magnet',
      type: 'magnet',
      position: { x: 0.5, y: 0.5 },
      radius: 0.2,
      strength: 0.5,
    });
    const repulsor = createPlaygroundToy({
      id: 'repulsor',
      type: 'repulsor',
      position: { x: 0.5, y: 0.5 },
      radius: 0.2,
      strength: 0.9,
    });

    expect(
      strongestToyInfluence(
        [magnet, repulsor],
        { x: 0.5, y: 0.5 },
      )?.type,
    ).toBe('repulsor');
  });

  it('breaks long or Portal teleport segments', () => {
    expect(
      shouldBreakTrail(
        { x: 0.1, y: 0.1 },
        { x: 0.9, y: 0.9 },
        1000,
        700,
        null,
      ),
    ).toBe(true);

    expect(
      shouldBreakTrail(
        { x: 0.45, y: 0.5 },
        { x: 0.52, y: 0.5 },
        1000,
        700,
        { type: 'portal', amount: 0.9 },
      ),
    ).toBe(true);
  });

  it('smooths high-detail trails while preserving explicit breaks', () => {
    const points = [
      point(0.1, 0.1, 0, { breakBefore: true }),
      point(0.2, 0.15, 20),
      point(0.3, 0.2, 40),
      point(0.8, 0.8, 60, { breakBefore: true }),
      point(0.85, 0.82, 80),
      point(0.9, 0.85, 100),
    ];

    const smooth = smoothedTrailPoints(points, 1);

    expect(smooth.length).toBeGreaterThan(points.length);
    expect(smooth.filter((sample) => sample.breakBefore).length).toBe(2);
  });

  it('applies Field-specific visual trail responses', () => {
    const base = point(0.3, 0.3, 100);
    const heat = trailVisualStyle(
      'melody',
      {
        ...base,
        fieldInfluence: {
          ...base.fieldInfluence,
          heat: 1,
        },
      },
      HIGH,
      200,
    );
    const echo = trailVisualStyle(
      'melody',
      {
        ...base,
        fieldInfluence: {
          ...base.fieldInfluence,
          echo: 1,
        },
      },
      HIGH,
      200,
    );
    const frost = trailVisualStyle(
      'melody',
      {
        ...base,
        fieldInfluence: {
          ...base.fieldInfluence,
          frost: 1,
        },
      },
      HIGH,
      200,
    );

    expect(heat.lateralOffsetPx).not.toBe(0);
    expect(echo.ghostAlpha).toBeGreaterThan(0);
    expect(frost.segmented).toBe(true);
  });

  it('applies toy-specific width/offset treatment', () => {
    const base = point(0.3, 0.3, 100);
    const normal = trailVisualStyle(
      'bass',
      base,
      HIGH,
      200,
    );
    const magnet = trailVisualStyle(
      'bass',
      {
        ...base,
        toyInfluence: {
          type: 'magnet',
          amount: 1,
        },
      },
      HIGH,
      200,
    );
    const repulsor = trailVisualStyle(
      'bass',
      {
        ...base,
        toyInfluence: {
          type: 'repulsor',
          amount: 1,
        },
      },
      HIGH,
      200,
    );

    expect(magnet.widthPx).toBeLessThan(normal.widthPx);
    expect(repulsor.widthPx).toBeGreaterThan(normal.widthPx);
  });

  it('fades trail points monotonically with age', () => {
    const sample = point(0.2, 0.2, 100);

    expect(trailAgeAlpha(sample, 150, HIGH))
      .toBeGreaterThan(trailAgeAlpha(sample, 900, HIGH));
    expect(trailAgeAlpha(sample, 2000, HIGH)).toBe(0);
  });
});
