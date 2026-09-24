import type { VisualPreferences } from '../VisualQuality';
import { MAX_SOUND_ORBS } from '../../world/SoundOrb';
import type { WorldDocument } from '../../world/World';
import {
  FIELD_RENDER_COLORS,
  ROLE_RENDER_COLORS,
} from './RenderPalette';
import type {
  EnvironmentDynamics,
  EnvironmentParticle,
  RenderEnvironment,
  RenderEventSample,
  RenderRgb,
  RenderScene,
} from './RenderTypes';

const BASE_PRIMARY: RenderRgb = [0.35, 0.27, 0.68];
const BASE_SECONDARY: RenderRgb = [0.08, 0.55, 0.68];

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function mixRgb(
  a: RenderRgb,
  b: RenderRgb,
  amount: number,
): RenderRgb {
  const t = clamp01(amount);

  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

function normalizeRgb(
  red: number,
  green: number,
  blue: number,
  weight: number,
  fallback: RenderRgb,
): RenderRgb {
  if (weight <= 0) {
    return fallback;
  }

  return [
    clamp01(red / weight),
    clamp01(green / weight),
    clamp01(blue / weight),
  ];
}

export function visualSeedFromWorld(
  worldId: string,
  musicSeed = 0,
): number {
  let hash = 2166136261 >>> 0;
  const input = worldId + ':' + musicSeed;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 0xffffffff;
}

export function deriveWorldEnvironment(
  world: WorldDocument,
): RenderEnvironment {
  let primaryRed = BASE_PRIMARY[0] * 0.8;
  let primaryGreen = BASE_PRIMARY[1] * 0.8;
  let primaryBlue = BASE_PRIMARY[2] * 0.8;
  let primaryWeight = 0.8;

  let secondaryRed = BASE_SECONDARY[0] * 0.85;
  let secondaryGreen = BASE_SECONDARY[1] * 0.85;
  let secondaryBlue = BASE_SECONDARY[2] * 0.85;
  let secondaryWeight = 0.85;

  let activeCount = 0;

  for (const orb of world.soundOrbs) {
    const color = ROLE_RENDER_COLORS[orb.role];
    const weight = orb.muted ? 0.16 : 1;

    if (!orb.muted) {
      activeCount += 1;
    }

    primaryRed += color[0] * weight;
    primaryGreen += color[1] * weight;
    primaryBlue += color[2] * weight;
    primaryWeight += weight;

    const spatialWeight = (
      orb.role === 'bass'
      || orb.role === 'harmony'
      || orb.role === 'texture'
      || orb.role === 'voice'
    )
      ? weight
      : weight * 0.34;

    secondaryRed += color[0] * spatialWeight;
    secondaryGreen += color[1] * spatialWeight;
    secondaryBlue += color[2] * spatialWeight;
    secondaryWeight += spatialWeight;
  }

  for (const field of world.effectFields) {
    const color = FIELD_RENDER_COLORS[field.type];
    const weight = 0.34;

    secondaryRed += color[0] * weight;
    secondaryGreen += color[1] * weight;
    secondaryBlue += color[2] * weight;
    secondaryWeight += weight;
  }

  const primaryRaw = normalizeRgb(
    primaryRed,
    primaryGreen,
    primaryBlue,
    primaryWeight,
    BASE_PRIMARY,
  );
  const secondaryRaw = normalizeRgb(
    secondaryRed,
    secondaryGreen,
    secondaryBlue,
    secondaryWeight,
    BASE_SECONDARY,
  );
  const density = clamp01(
    world.soundOrbs.length / MAX_SOUND_ORBS,
  );
  const activeRatio = world.soundOrbs.length > 0
    ? activeCount / world.soundOrbs.length
    : 0;

  return {
    primary: mixRgb(BASE_PRIMARY, primaryRaw, 0.78),
    secondary: mixRgb(BASE_SECONDARY, secondaryRaw, 0.76),
    density,
    ambience: clamp01(
      0.72
      - density * 0.24
      + activeRatio * 0.12,
    ),
    particleDensity: clamp01(
      (world.soundOrbs.length === 0 ? 0.62 : 1)
      * (1 - density * 0.46),
    ),
    seed: visualSeedFromWorld(
      world.id,
      world.music.seed,
    ),
  };
}

export function deriveEnvironmentDynamics(
  scene: Readonly<RenderScene>,
  samples: readonly RenderEventSample[],
  preferences: Readonly<VisualPreferences>,
): EnvironmentDynamics {
  let energy = 0;
  let bassPressure = 0;
  let transient = 0;
  let eventPosition = scene.listener;
  let eventStrength = 0;
  let pointerPosition = scene.listener;
  let pointerDelta = { x: 0, y: 0 };
  let pointerStrength = 0;
  let dragPosition = scene.listener;
  let dragDelta = { x: 0, y: 0 };
  let dragStrength = 0;

  const selectedOrb = scene.orbs.find((orb) => orb.selected);
  const spotlightPosition = selectedOrb?.position ?? scene.listener;
  const spotlightStrength = selectedOrb ? 0.58 : 0;

  for (const orb of scene.orbs) {
    if (orb.interaction.dragSpeed <= dragStrength) {
      continue;
    }

    dragStrength = orb.interaction.dragSpeed;
    dragPosition = orb.position;
    dragDelta = preferences.reduceMotion
      ? { x: 0, y: 0 }
      : orb.interaction.dragVelocity;
  }

  for (const sample of samples) {
    const event = sample.event;
    const fade = Math.max(0, 1 - sample.progress);

    if (event.kind === 'pointer-disturbance') {
      const strength = event.intensity * fade;

      if (strength >= pointerStrength) {
        pointerStrength = strength;
        pointerPosition = event.position;
        pointerDelta = preferences.reduceMotion
          ? { x: 0, y: 0 }
          : event.delta;
      }
      continue;
    }

    if (event.kind === 'link-pulse') {
      energy += event.intensity * fade * 0.09;
      continue;
    }

    if (event.kind === 'orb-drop') {
      const strength = event.intensity
        * fade
        * fade;

      if (strength >= dragStrength) {
        dragStrength = strength;
        dragPosition = event.position;
        dragDelta = preferences.reduceMotion
          ? { x: 0, y: 0 }
          : event.velocity;
      }

      energy += strength * 0.12;
      continue;
    }

    if (event.kind === 'orb-charge') {
      const strength = event.intensity * fade;
      energy += strength * 0.06;

      if (strength > eventStrength) {
        eventStrength = strength;
        eventPosition = event.position;
      }
      continue;
    }

    if (
      event.kind === 'link-created'
      || event.kind === 'link-deleted'
    ) {
      continue;
    }

    const orb = scene.orbs.find(
      (candidate) => candidate.id === event.orbId,
    );

    if (!orb) {
      continue;
    }

    const envelope = fade * fade;
    const amount = event.intensity * envelope;
    energy += amount * 0.42;

    if (orb.role === 'bass') {
      bassPressure += amount;
    } else if (orb.role === 'beat') {
      bassPressure += amount * 0.32;
    }

    if (
      orb.role === 'beat'
      || orb.role === 'percussion'
    ) {
      transient = Math.max(transient, amount);
    }

    if (amount > eventStrength) {
      eventStrength = amount;
      eventPosition = event.position ?? orb.position;
    }
  }

  return {
    energy: clamp01(energy),
    bassPressure: clamp01(bassPressure),
    transient: clamp01(transient),
    eventPosition,
    eventStrength: clamp01(eventStrength),
    pointerPosition,
    pointerDelta,
    pointerStrength: clamp01(
      preferences.reduceMotion
        ? pointerStrength * 0.35
        : pointerStrength,
    ),
    dragPosition,
    dragDelta,
    dragStrength: clamp01(
      preferences.reduceMotion
        ? dragStrength * 0.25
        : dragStrength,
    ),
    spotlightPosition,
    spotlightStrength,
  };
}

function particleRandom(
  seed: number,
  index: number,
  salt: number,
): number {
  const value = Math.sin(
    (seed * 971.17 + index * 91.7 + salt * 47.31) * 12.9898,
  ) * 43758.5453;

  return value - Math.floor(value);
}

export function environmentParticleLayout(
  environment: Readonly<RenderEnvironment>,
  preferences: Readonly<VisualPreferences>,
): readonly EnvironmentParticle[] {
  if (preferences.reduceParticles) {
    return [];
  }

  const baseCounts = (() => {
    switch (preferences.quality) {
      case 'high':
        return { far: 34, near: 9 };
      case 'balanced':
        return { far: 20, near: 5 };
      case 'battery':
        return { far: 7, near: 2 };
    }
  })();

  const scale = environment.particleDensity;
  const farCount = Math.round(baseCounts.far * scale);
  const nearCount = Math.round(baseCounts.near * scale);
  const result: EnvironmentParticle[] = [];

  for (let index = 0; index < farCount + nearCount; index += 1) {
    const near = index >= farCount;

    result.push({
      x: particleRandom(environment.seed, index, 1),
      y: particleRandom(environment.seed, index, 2),
      depth: near
        ? 0.72 + particleRandom(environment.seed, index, 3) * 0.28
        : 0.12 + particleRandom(environment.seed, index, 3) * 0.3,
      size: near
        ? 1.4 + particleRandom(environment.seed, index, 4) * 1.8
        : 0.55 + particleRandom(environment.seed, index, 4) * 0.9,
      alpha: near
        ? 0.11 + particleRandom(environment.seed, index, 5) * 0.16
        : 0.08 + particleRandom(environment.seed, index, 5) * 0.15,
      phase: particleRandom(environment.seed, index, 6) * Math.PI * 2,
      near,
    });
  }

  return result;
}
