import type { VisualPreferences } from '../VisualQuality';
import type { RenderColor } from './RenderPalette';
import type {
  RenderEventSample,
  RenderScene,
} from './RenderTypes';

export type DelightDot = readonly [
  x: number,
  y: number,
  radius: number,
  color: RenderColor,
];

export interface DelightFrame {
  readonly mask: number;
  readonly dots: readonly DelightDot[];
}

export const EMPTY_DELIGHT_FRAME: DelightFrame = {
  mask: 0,
  dots: [],
};

const CONSTELLATION = 1;
const MOTE = 2;
const ALIGNMENT = 4;
const ORBIT = 8;
const SILENCE = 16;

function random(seed: number, salt: number): number {
  let value = Math.imul(
    ((seed * 0x7fffffff) | 0) ^ salt,
    1597334677,
  );
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
  const active = scene.orbs.filter((orb) => !orb.muted);
  const pulsing = active.filter((orb) => samples.some(
    (sample) => (
      sample.event.kind === 'orb-pulse'
      && sample.event.orbId === orb.id
      && sample.progress < 0.72
    ),
  ));
  const seed = random(
    scene.environment.seed,
    bar.bar * 97 + bar.phrasePosition * 17,
  );
  const rand = (salt: number) => random(seed, salt);
  const moving = (
    !preferences.reduceMotion
    && preferences.quality !== 'battery'
  );
  const particles = moving && !preferences.reduceParticles;
  const bloom = preferences.reduceBloom ? 0.58 : 1;
  const environment = scene.environment;
  const listener = scene.listener;
  const high = high;
  const envelope = Math.sin(Math.PI * barSample.progress);
  const dots: DelightDot[] = [];
  let mask = 0;

  const dot = (
    x: number,
    y: number,
    radius: number,
    rgb: readonly [number, number, number],
    alpha: number,
  ) => {
    dots.push([
      x * width,
      y * height,
      radius * dpr,
      [rgb[0], rgb[1], rgb[2], alpha * bloom],
    ]);
  };

  if (
    moving
    && bar.phrasePosition === 0
    && active.length >= 3
    && rand(11) < (high ? 0.16 : 0.09)
  ) {
    mask |= CONSTELLATION;
    const count = Math.min(5, active.length);
    const start = Math.floor(rand(12) * active.length);
    let previous = active[start]!.position;

    dot(
      previous.x,
      previous.y,
      1.45,
      environment.primary,
      envelope * 0.3,
    );

    for (let index = 1; index < count; index += 1) {
      const point = active[(start + index) % active.length]!.position;

      dot(
        (previous.x + point.x) * 0.5,
        (previous.y + point.y) * 0.5,
        0.82,
        environment.secondary,
        envelope * 0.14,
      );
      dot(
        point.x,
        point.y,
        1.45,
        environment.primary,
        envelope * 0.3,
      );
      previous = point;
    }
  }

  if (
    particles
    && rand(23) < (high ? 0.055 : 0.03)
  ) {
    mask |= MOTE;
    const reverse = rand(24) > 0.5;
    const startY = 0.14 + rand(25) * 0.5;
    const endY = startY + (rand(26) - 0.5) * 0.24;
    const p = barSample.progress;
    const travel = p * p * (3 - 2 * p);
    const startX = reverse ? 1.04 : -0.04;
    const endX = reverse ? -0.04 : 1.04;
    const x = startX + (endX - startX) * travel;
    const y = startY + (endY - startY) * travel;

    for (let tail = 3; tail >= 0; tail -= 1) {
      const amount = tail * 0.026;
      dot(
        x + (startX - x) * amount,
        y + (startY - y) * amount,
        tail === 0 ? 1.7 : 0.72,
        tail === 0
          ? environment.primary
          : environment.secondary,
        envelope * (tail === 0 ? 0.6 : 0.1),
      );
    }
  }

  if (
    moving
    && hit
    && hit.simultaneousCount >= 2
    && pulsing.length >= 2
    && rand(37) < (high ? 0.08 : 0.045)
  ) {
    mask |= ALIGNMENT;
    const strength = Math.pow(
      1 - (hitSample?.progress ?? 1),
      1.8,
    ) * hit.intensity;

    for (const orb of pulsing.slice(0, 4)) {
      for (const amount of [0.34, 0.58, 0.82]) {
        dot(
          listener.x + (orb.position.x - listener.x) * amount,
          listener.y + (orb.position.y - listener.y) * amount,
          0.72,
          environment.primary,
          strength * 0.085,
        );
      }
    }
  }

  if (
    particles
    && bar.phrasePosition === 0
    && rand(49) < (high ? 0.018 : 0.008)
  ) {
    mask |= ORBIT;
    const phase = rand(50) * Math.PI * 2
      + barSample.progress * Math.PI * 1.5;
    const radius = 0.055 + rand(51) * 0.018;

    for (let index = 0; index < 3; index += 1) {
      const angle = phase + Math.PI * 2 * index / 3;
      dot(
        listener.x + Math.cos(angle) * radius,
        listener.y + Math.sin(angle) * radius,
        1.4,
        environment.secondary,
        envelope * 0.46,
      );
    }
  }

  if (bar.silent && !preferences.reduceParticles) {
    mask |= SILENCE;
    const progress = barSample.progress;
    const fall = preferences.reduceMotion ? 0 : progress * 0.1;
    const strength = preferences.reduceMotion
      ? 0.22
      : 0.36 + progress * 0.34;
    const count = high ? 8 : 5;

    for (let index = 0; index < count; index += 1) {
      dot(
        0.12 + rand(301 + index * 2) * 0.76,
        0.18
          + rand(302 + index * 2) * 0.56
          + fall * (0.42 + (index % 3) * 0.16),
        0.72 + (index % 3) * 0.18,
        environment.primary,
        strength * (0.11 + (index % 2) * 0.035),
      );
    }
  }

  return mask === 0
    ? EMPTY_DELIGHT_FRAME
    : { mask, dots };
}
