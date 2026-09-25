import type { VisualPreferences } from '../VisualQuality';
import type {
  RenderColor,
} from './RenderPalette';
import type {
  RenderEventSample,
  RenderScene,
} from './RenderTypes';

export type DelightKind =
  | 'constellation'
  | 'mote'
  | 'alignment'
  | 'orbit'
  | 'silence';

export interface DelightLine {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly color: RenderColor;
}

export interface DelightDot {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly color: RenderColor;
}

export interface DelightFrame {
  readonly kinds: readonly DelightKind[];
  readonly lines: readonly DelightLine[];
  readonly dots: readonly DelightDot[];
}

export const EMPTY_DELIGHT_FRAME: DelightFrame = {
  kinds: [],
  lines: [],
  dots: [],
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function hash01(seed: number, salt: number): number {
  let value = (
    Math.floor(clamp01(seed) * 0xffffffff)
    ^ Math.imul(salt + 1, 0x9e3779b1)
  ) >>> 0;

  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return (value >>> 0) / 0xffffffff;
}

export function deriveDelightFrame(
  scene: Readonly<RenderScene>,
  samples: readonly RenderEventSample[],
  preferences: Readonly<VisualPreferences>,
  width: number,
  height: number,
  dpr: number,
): DelightFrame {
  if (!scene.playing) {
    return EMPTY_DELIGHT_FRAME;
  }

  const barSample = samples.find(
    (sample) => sample.event.kind === 'choreography-bar',
  );

  if (!barSample || barSample.event.kind !== 'choreography-bar') {
    return EMPTY_DELIGHT_FRAME;
  }

  const bar = barSample.event;
  const hitSample = samples.find(
    (sample) => (
      sample.event.kind === 'choreography-hit'
      && sample.event.downbeat
    ),
  );
  const hit = hitSample?.event.kind === 'choreography-hit'
    ? hitSample.event
    : null;
  const seed = hash01(
    scene.environment.seed,
    bar.bar * 97 + bar.phrasePosition * 17,
  );
  const envelope = Math.sin(Math.PI * clamp01(barSample.progress));
  const active = scene.orbs.filter((orb) => !orb.muted);
  const pulsingIds = new Set(
    samples.flatMap((sample) => (
      sample.event.kind === 'orb-pulse'
      && sample.progress < 0.72
        ? [sample.event.orbId]
        : []
    )),
  );
  const pulsing = active.filter((orb) => pulsingIds.has(orb.id));
  const moving = !preferences.reduceMotion
    && preferences.quality !== 'battery';
  const particles = moving && !preferences.reduceParticles;
  const glow = preferences.reduceBloom ? 0.58 : 1;
  const minDimension = Math.min(width, height);
  const primary = scene.environment.primary;
  const secondary = scene.environment.secondary;
  const kinds: DelightKind[] = [];
  const lines: DelightLine[] = [];
  const dots: DelightDot[] = [];
  const color = (
    rgb: readonly [number, number, number],
    alpha: number,
  ): RenderColor => [
    rgb[0],
    rgb[1],
    rgb[2],
    clamp01(alpha * glow),
  ];
  const ordered = (salt: number, limit: number) => active
    .map((orb, index) => ({
      position: orb.position,
      order: hash01(seed + salt * 0.001, index + 101),
    }))
    .sort((a, b) => a.order - b.order)
    .slice(0, limit)
    .map((entry) => entry.position);

  if (
    moving
    && bar.phrasePosition === 0
    && active.length >= 3
    && hash01(seed, 11) < (
      preferences.quality === 'high' ? 0.16 : 0.09
    )
  ) {
    kinds.push('constellation');
    const points = ordered(11, Math.min(5, active.length));
    const strength = envelope * (0.58 + bar.density * 0.34);

    for (let index = 1; index < points.length; index += 1) {
      const a = points[index - 1]!;
      const b = points[index]!;
      lines.push({
        x1: a.x * width,
        y1: a.y * height,
        x2: b.x * width,
        y2: b.y * height,
        color: color(secondary, strength * 0.12),
      });
    }

    for (const point of points) {
      dots.push({
        x: point.x * width,
        y: point.y * height,
        radius: Math.max(1, dpr * (1.2 + strength * 1.4)),
        color: color(primary, strength * 0.34),
      });
    }
  }

  if (
    particles
    && hash01(seed, 23) < (
      preferences.quality === 'high' ? 0.055 : 0.03
    )
  ) {
    kinds.push('mote');
    const reverse = hash01(seed, 24) > 0.5;
    const startY = 0.14 + hash01(seed, 25) * 0.5;
    const endY = clamp01(
      startY + (hash01(seed, 26) - 0.5) * 0.24,
    );
    const progress = clamp01(barSample.progress);
    const travel = progress * progress * (3 - 2 * progress);
    const fromX = reverse ? 1.04 : -0.04;
    const toX = reverse ? -0.04 : 1.04;
    const headX = fromX + (toX - fromX) * travel;
    const headY = startY + (endY - startY) * travel;
    const strength = envelope * 0.72;

    lines.push({
      x1: (headX + (fromX - headX) * 0.16) * width,
      y1: (headY + (startY - headY) * 0.16) * height,
      x2: headX * width,
      y2: headY * height,
      color: color(secondary, strength * 0.22),
    });
    dots.push({
      x: headX * width,
      y: headY * height,
      radius: Math.max(1, dpr * 1.7),
      color: color(primary, strength * 0.62),
    });
  }

  if (
    moving
    && hit
    && hit.simultaneousCount >= 2
    && pulsing.length >= 2
    && hash01(seed, 37) < (
      preferences.quality === 'high' ? 0.08 : 0.045
    )
  ) {
    kinds.push('alignment');
    const strength = Math.pow(
      1 - (hitSample?.progress ?? 1),
      1.8,
    ) * hit.intensity;

    for (const orb of pulsing.slice(0, 4)) {
      const point = orb.position;
      lines.push({
        x1: scene.listener.x * width,
        y1: scene.listener.y * height,
        x2: point.x * width,
        y2: point.y * height,
        color: color(primary, strength * 0.09),
      });
    }
  }

  if (
    particles
    && bar.phrasePosition === 0
    && hash01(seed, 49) < (
      preferences.quality === 'high' ? 0.018 : 0.008
    )
  ) {
    kinds.push('orbit');
    const phase = hash01(seed, 50) * Math.PI * 2
      + barSample.progress * Math.PI * 1.5;
    const radius = minDimension * (
      0.055 + hash01(seed, 51) * 0.018
    );
    const strength = envelope * 0.72;

    for (let index = 0; index < 3; index += 1) {
      const angle = phase + Math.PI * 2 * index / 3;
      dots.push({
        x: scene.listener.x * width + Math.cos(angle) * radius,
        y: scene.listener.y * height + Math.sin(angle) * radius,
        radius: Math.max(1, dpr * 1.45),
        color: color(secondary, strength * 0.48),
      });
    }
  }

  if (bar.silent && !preferences.reduceParticles) {
    kinds.push('silence');
    const fall = preferences.reduceMotion
      ? 0
      : clamp01(barSample.progress) * 0.1;
    const strength = preferences.reduceMotion
      ? 0.22
      : 0.36 + barSample.progress * 0.34;
    const count = preferences.quality === 'high' ? 8 : 5;

    for (let index = 0; index < count; index += 1) {
      const x = 0.12 + hash01(seed, 301 + index * 2) * 0.76;
      const baseY = 0.18 + hash01(seed, 302 + index * 2) * 0.56;
      const y = Math.min(
        0.94,
        baseY + fall * (0.42 + (index % 3) * 0.16),
      );

      dots.push({
        x: x * width,
        y: y * height,
        radius: Math.max(
          0.65,
          dpr * (0.72 + (index % 3) * 0.18),
        ),
        color: color(
          primary,
          strength * (0.11 + (index % 2) * 0.035),
        ),
      });
    }
  }

  return kinds.length === 0
    ? EMPTY_DELIGHT_FRAME
    : { kinds, lines, dots };
}
