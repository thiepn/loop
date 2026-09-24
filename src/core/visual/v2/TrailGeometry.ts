import type { VisualPreferences } from '../VisualQuality';
import type { EffectAmounts } from '../../world/EffectField';
import type {
  RenderColor,
} from './RenderPalette';
import { ROLE_RENDER_COLORS } from './RenderPalette';
import {
  trailPolicyForPreferences,
  trailRoleStyle,
} from './TrailModel';
import type {
  RenderTrailPoint,
  RenderTrailToyInfluence,
} from './RenderTypes';
import type { SoundRole } from '../../sounds/SoundDefinition';

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function mix(
  a: number,
  b: number,
  amount: number,
): number {
  return a + (b - a) * clamp01(amount);
}

function mixColor(
  a: RenderColor,
  b: RenderColor,
  amount: number,
): RenderColor {
  return [
    mix(a[0], b[0], amount),
    mix(a[1], b[1], amount),
    mix(a[2], b[2], amount),
    mix(a[3], b[3], amount),
  ];
}

function averageEffects(
  a: EffectAmounts,
  b: EffectAmounts,
): EffectAmounts {
  return {
    space: (a.space + b.space) / 2,
    echo: (a.echo + b.echo) / 2,
    heat: (a.heat + b.heat) / 2,
    frost: (a.frost + b.frost) / 2,
    filter: (a.filter + b.filter) / 2,
  };
}

function strongerToy(
  a: RenderTrailToyInfluence | null,
  b: RenderTrailToyInfluence | null,
): RenderTrailToyInfluence | null {
  if (!a) {
    return b;
  }

  if (!b) {
    return a;
  }

  return a.amount >= b.amount ? a : b;
}

function normalize(
  x: number,
  y: number,
): { x: number; y: number } {
  const length = Math.hypot(x, y);

  if (length <= 1e-6) {
    return { x: 0, y: 0 };
  }

  return {
    x: x / length,
    y: y / length,
  };
}

function midpoint(
  a: RenderTrailPoint,
  b: RenderTrailPoint,
  amount: number,
): RenderTrailPoint {
  const velocity = normalize(
    mix(a.velocity.x, b.velocity.x, amount),
    mix(a.velocity.y, b.velocity.y, amount),
  );

  return {
    position: {
      x: mix(a.position.x, b.position.x, amount),
      y: mix(a.position.y, b.position.y, amount),
    },
    timestampMs: mix(a.timestampMs, b.timestampMs, amount),
    speed: mix(a.speed, b.speed, amount),
    acceleration: mix(
      a.acceleration,
      b.acceleration,
      amount,
    ),
    turn: mix(a.turn, b.turn, amount),
    velocity,
    fieldInfluence: averageEffects(
      a.fieldInfluence,
      b.fieldInfluence,
    ),
    toyInfluence: strongerToy(
      a.toyInfluence,
      b.toyInfluence,
    ),
    breakBefore: false,
  };
}

function chaikinChunk(
  points: readonly RenderTrailPoint[],
): RenderTrailPoint[] {
  if (points.length < 3) {
    return [...points];
  }

  const result: RenderTrailPoint[] = [
    {
      ...points[0]!,
      breakBefore: true,
    },
  ];

  for (let index = 0; index < points.length - 1; index += 1) {
    const a = points[index]!;
    const b = points[index + 1]!;

    result.push(
      midpoint(a, b, 0.25),
      midpoint(a, b, 0.75),
    );
  }

  result.push({
    ...points[points.length - 1]!,
    breakBefore: false,
  });

  return result;
}

export function smoothedTrailPoints(
  points: readonly RenderTrailPoint[],
  detail: number,
): readonly RenderTrailPoint[] {
  if (points.length < 3 || detail < 0.5) {
    return points;
  }

  const chunks: RenderTrailPoint[][] = [];
  let chunk: RenderTrailPoint[] = [];

  for (const point of points) {
    if (point.breakBefore && chunk.length > 0) {
      chunks.push(chunk);
      chunk = [];
    }

    chunk.push(point);
  }

  if (chunk.length > 0) {
    chunks.push(chunk);
  }

  const passes = detail >= 0.9 ? 2 : 1;
  const result: RenderTrailPoint[] = [];

  for (const source of chunks) {
    let smoothed = source;

    for (let pass = 0; pass < passes; pass += 1) {
      smoothed = chaikinChunk(smoothed);
    }

    if (smoothed.length > 0) {
      smoothed[0] = {
        ...smoothed[0]!,
        breakBefore: true,
      };
    }

    result.push(...smoothed);
  }

  return result;
}

export interface TrailVisualStyle {
  readonly color: RenderColor;
  readonly widthPx: number;
  readonly alpha: number;
  readonly ghostAlpha: number;
  readonly ghostOffsetPx: number;
  readonly lateralOffsetPx: number;
  readonly segmented: boolean;
  readonly layerCount: number;
  readonly sparkScale: number;
}

export function trailVisualStyle(
  role: SoundRole,
  point: RenderTrailPoint,
  preferences: Readonly<VisualPreferences>,
  timestampMs: number,
): TrailVisualStyle {
  const roleStyle = trailRoleStyle(role);
  const policy = trailPolicyForPreferences(preferences);
  const effects = point.fieldInfluence;
  let color = ROLE_RENDER_COLORS[role];
  let width = roleStyle.widthPx
    * (
      0.72
      + point.speed * 0.52
      + point.acceleration * 0.24
    );
  let alpha = roleStyle.alpha
    * policy.baseAlpha;
  let lateralOffsetPx = 0;
  let segmented = role === 'percussion';

  if (effects.heat > 0) {
    color = mixColor(
      color,
      [1, 0.34, 0.12, 1],
      effects.heat * 0.5,
    );
    lateralOffsetPx += Math.sin(
      point.timestampMs * 0.018 + timestampMs * 0.003,
    ) * effects.heat * 2.8;
    width *= 1 + effects.heat * 0.12;
  }

  if (effects.frost > 0) {
    color = mixColor(
      color,
      [0.7, 0.9, 1, 1],
      effects.frost * 0.58,
    );
    segmented = segmented || effects.frost > 0.28;
    width *= 1 - effects.frost * 0.12;
  }

  if (effects.filter > 0) {
    color = mixColor(
      color,
      [0.2, 0.86, 0.68, 1],
      effects.filter * 0.38,
    );
    alpha *= 1 - effects.filter * 0.18;
  }

  width *= 1 + effects.space * 0.32;
  alpha *= 1 - effects.space * 0.16;

  const toy = point.toyInfluence;

  if (toy) {
    switch (toy.type) {
      case 'spinner':
        lateralOffsetPx += Math.sin(
          point.timestampMs * 0.015,
        ) * toy.amount * 3.4;
        break;
      case 'magnet':
        width *= 1 - toy.amount * 0.22;
        alpha *= 1 + toy.amount * 0.08;
        break;
      case 'repulsor':
        width *= 1 + toy.amount * 0.3;
        break;
      case 'portal':
        alpha *= 1 - toy.amount * 0.42;
        segmented = segmented || toy.amount > 0.35;
        break;
    }
  }

  return {
    color,
    widthPx: Math.max(1.2, width),
    alpha: clamp01(alpha),
    ghostAlpha: clamp01(effects.echo * 0.3),
    ghostOffsetPx: 4 + effects.echo * 7,
    lateralOffsetPx,
    segmented,
    layerCount: roleStyle.layerCount,
    sparkScale: roleStyle.sparkScale,
  };
}

export function trailAgeAlpha(
  point: RenderTrailPoint,
  timestampMs: number,
  preferences: Readonly<VisualPreferences>,
): number {
  const policy = trailPolicyForPreferences(preferences);

  if (policy.lifetimeMs <= 0) {
    return 0;
  }

  const age = clamp01(
    (timestampMs - point.timestampMs)
    / policy.lifetimeMs,
  );

  return Math.pow(1 - age, 1.65);
}
