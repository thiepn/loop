import type { VisualPreferences } from '../VisualQuality';
import type { NormalizedPoint } from '../../world/SoundOrb';
import type {
  RenderEventSample,
  RenderScene,
} from './RenderTypes';

export interface DelightConstellation {
  readonly points: readonly NormalizedPoint[];
  readonly strength: number;
}

export interface DelightMote {
  readonly from: NormalizedPoint;
  readonly to: NormalizedPoint;
  readonly head: NormalizedPoint;
  readonly strength: number;
}

export interface DelightAlignment {
  readonly points: readonly NormalizedPoint[];
  readonly strength: number;
}

export interface DelightOrbit {
  readonly phase: number;
  readonly radius: number;
  readonly strength: number;
}

export interface DelightDust {
  readonly points: readonly NormalizedPoint[];
  readonly progress: number;
  readonly strength: number;
}

export interface DelightFrame {
  readonly constellation: DelightConstellation | null;
  readonly mote: DelightMote | null;
  readonly alignment: DelightAlignment | null;
  readonly orbit: DelightOrbit | null;
  readonly silenceDust: DelightDust | null;
}

export const EMPTY_DELIGHT_FRAME: DelightFrame = {
  constellation: null,
  mote: null,
  alignment: null,
  orbit: null,
  silenceDust: null,
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

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

function eventEnvelope(progress: number): number {
  const p = clamp01(progress);
  return Math.sin(Math.PI * p);
}

function orderedOrbPoints(
  scene: Readonly<RenderScene>,
  seed: number,
  limit: number,
): readonly NormalizedPoint[] {
  return scene.orbs
    .filter((orb) => !orb.muted)
    .map((orb, index) => ({
      point: orb.position,
      order: hash01(seed, index + 101),
    }))
    .sort((a, b) => a.order - b.order)
    .slice(0, limit)
    .map((entry) => entry.point);
}

function dustPoints(
  seed: number,
  count: number,
): readonly NormalizedPoint[] {
  return Array.from({ length: count }, (_, index) => ({
    x: 0.12 + hash01(seed, 301 + index * 2) * 0.76,
    y: 0.18 + hash01(seed, 302 + index * 2) * 0.56,
  }));
}

export function deriveDelightFrame(
  scene: Readonly<RenderScene>,
  samples: readonly RenderEventSample[],
  preferences: Readonly<VisualPreferences>,
): DelightFrame {
  if (!scene.playing) {
    return EMPTY_DELIGHT_FRAME;
  }

  const barSample = samples.find(
    (sample) => sample.event.kind === 'choreography-bar',
  );
  const hitSample = samples.find(
    (sample) => (
      sample.event.kind === 'choreography-hit'
      && sample.event.downbeat
    ),
  );

  if (!barSample || barSample.event.kind !== 'choreography-bar') {
    return EMPTY_DELIGHT_FRAME;
  }

  const bar = barSample.event;
  const seed = hash01(
    scene.environment.seed,
    bar.bar * 97 + bar.phrasePosition * 17,
  );
  const envelope = eventEnvelope(barSample.progress);
  const activeCount = scene.orbs.filter((orb) => !orb.muted).length;
  const rareMotionAllowed = (
    !preferences.reduceMotion
    && preferences.quality !== 'battery'
  );
  const particleDelightAllowed = (
    rareMotionAllowed
    && !preferences.reduceParticles
  );

  const constellationRoll = hash01(seed, 11);
  const constellationChance = preferences.quality === 'high'
    ? 0.16
    : 0.09;
  const constellation = (
    rareMotionAllowed
    && bar.phrasePosition === 0
    && activeCount >= 3
    && constellationRoll < constellationChance
  )
    ? {
        points: orderedOrbPoints(
          scene,
          seed,
          Math.min(5, activeCount),
        ),
        strength: envelope * (0.58 + bar.density * 0.34),
      }
    : null;

  const moteRoll = hash01(seed, 23);
  const moteChance = preferences.quality === 'high'
    ? 0.055
    : 0.03;
  let mote: DelightMote | null = null;

  if (
    particleDelightAllowed
    && moteRoll < moteChance
  ) {
    const reverse = hash01(seed, 24) > 0.5;
    const startY = 0.14 + hash01(seed, 25) * 0.5;
    const endY = clamp01(
      startY + (hash01(seed, 26) - 0.5) * 0.24,
    );
    const travel = clamp01(barSample.progress);
    const eased = travel * travel * (3 - 2 * travel);
    const from = {
      x: reverse ? 1.04 : -0.04,
      y: startY,
    };
    const to = {
      x: reverse ? -0.04 : 1.04,
      y: endY,
    };

    mote = {
      from,
      to,
      head: {
        x: from.x + (to.x - from.x) * eased,
        y: from.y + (to.y - from.y) * eased,
      },
      strength: envelope * 0.72,
    };
  }

  const hitEvent = (
    hitSample?.event.kind === 'choreography-hit'
      ? hitSample.event
      : null
  );
  const alignmentRoll = hash01(seed, 37);
  const alignmentChance = preferences.quality === 'high'
    ? 0.08
    : 0.045;
  const alignmentPoints = orderedOrbPoints(
    scene,
    seed + 0.173,
    Math.min(4, activeCount),
  );
  const alignment = (
    rareMotionAllowed
    && hitEvent
    && hitEvent.simultaneousCount >= 2
    && activeCount >= 2
    && alignmentRoll < alignmentChance
  )
    ? {
        points: alignmentPoints,
        strength: (
          Math.pow(1 - (hitSample?.progress ?? 1), 1.8)
          * hitEvent.intensity
        ),
      }
    : null;

  const orbitRoll = hash01(seed, 49);
  const orbitChance = preferences.quality === 'high'
    ? 0.018
    : 0.008;
  const orbit = (
    particleDelightAllowed
    && bar.phrasePosition === 0
    && orbitRoll < orbitChance
  )
    ? {
        phase: (
          hash01(seed, 50) * Math.PI * 2
          + barSample.progress * Math.PI * 1.5
        ),
        radius: 0.055 + hash01(seed, 51) * 0.018,
        strength: envelope * 0.72,
      }
    : null;

  const silenceDust = (
    bar.silent
    && !preferences.reduceParticles
  )
    ? {
        points: dustPoints(
          seed,
          preferences.quality === 'high' ? 8 : 5,
        ),
        progress: clamp01(barSample.progress),
        strength: (
          preferences.reduceMotion
            ? 0.22
            : 0.36 + barSample.progress * 0.34
        ),
      }
    : null;

  if (
    !constellation
    && !mote
    && !alignment
    && !orbit
    && !silenceDust
  ) {
    return EMPTY_DELIGHT_FRAME;
  }

  return {
    constellation,
    mote,
    alignment,
    orbit,
    silenceDust,
  };
}
