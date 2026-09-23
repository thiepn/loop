import { clampPoint, type NormalizedPoint, type SoundOrbDocument } from './SoundOrb';

export type MotionMode =
  | 'still'
  | 'orbit'
  | 'bounce'
  | 'drift'
  | 'follow'
  | 'wander';

export type MotionSpeed = 'slow' | 'medium' | 'fast';
export type MotionRange = 'tight' | 'medium' | 'wide';

export interface MotionDocument {
  readonly mode: MotionMode;
  readonly speed: MotionSpeed;
  readonly range: MotionRange;
  readonly seed: number;
  readonly targetOrbId?: string;
}

export interface CreateMotionOptions {
  readonly mode: MotionMode;
  readonly speed?: MotionSpeed;
  readonly range?: MotionRange;
  readonly seed?: number;
  readonly targetOrbId?: string;
}

export const DEFAULT_MOTION_SPEED: MotionSpeed = 'medium';
export const DEFAULT_MOTION_RANGE: MotionRange = 'medium';

export function createMotion(options: CreateMotionOptions): MotionDocument {
  const base: MotionDocument = {
    mode: options.mode,
    speed: options.speed ?? DEFAULT_MOTION_SPEED,
    range: options.range ?? DEFAULT_MOTION_RANGE,
    seed: Math.floor(options.seed ?? 1),
  };

  return options.targetOrbId
    ? { ...base, targetOrbId: options.targetOrbId }
    : base;
}

export function motionForOrb(orb: SoundOrbDocument): MotionDocument {
  return orb.motion ?? createMotion({
    mode: 'still',
    seed: hashString(orb.id),
  });
}

export function motionSpeedCycles(speed: MotionSpeed): number {
  switch (speed) {
    case 'slow':
      return 0.045;
    case 'medium':
      return 0.085;
    case 'fast':
      return 0.145;
  }
}

export function motionRangeAmount(range: MotionRange): number {
  switch (range) {
    case 'tight':
      return 0.055;
    case 'medium':
      return 0.105;
    case 'wide':
      return 0.18;
  }
}

export function hashString(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function phaseForMotion(orb: SoundOrbDocument, motion: MotionDocument): number {
  const mixed = (hashString(orb.id) ^ motion.seed) >>> 0;
  return (mixed / 0xffffffff) * Math.PI * 2;
}

function clampMotionPoint(point: NormalizedPoint): NormalizedPoint {
  return clampPoint({
    x: Math.min(0.96, Math.max(0.04, point.x)),
    y: Math.min(0.96, Math.max(0.04, point.y)),
  });
}

function pingPong(value: number): number {
  const normalized = ((value % 2) + 2) % 2;
  return normalized <= 1 ? normalized : 2 - normalized;
}

export function evaluateIndependentMotion(
  orb: SoundOrbDocument,
  timeSeconds: number,
): NormalizedPoint {
  const motion = motionForOrb(orb);

  if (motion.mode === 'still' || motion.mode === 'follow') {
    return orb.position;
  }

  const cycles = motionSpeedCycles(motion.speed);
  const range = motionRangeAmount(motion.range);
  const phase = phaseForMotion(orb, motion);
  const angle = Math.PI * 2 * cycles * timeSeconds + phase;

  switch (motion.mode) {
    case 'orbit':
      return clampMotionPoint({
        x: orb.position.x + Math.cos(angle) * range,
        y: orb.position.y + Math.sin(angle) * range,
      });

    case 'bounce': {
      const travel = cycles * timeSeconds * 2.3 + phase / Math.PI;
      const x = (pingPong(travel) * 2 - 1) * range;
      const y = (pingPong(travel * 0.63 + 0.37) * 2 - 1) * range * 0.72;

      return clampMotionPoint({
        x: orb.position.x + x,
        y: orb.position.y + y,
      });
    }

    case 'drift':
      return clampMotionPoint({
        x: orb.position.x + Math.sin(angle * 0.72) * range * 0.8,
        y: orb.position.y + Math.cos(angle * 0.51 + 1.2) * range * 0.58,
      });

    case 'wander':
      return clampMotionPoint({
        x: orb.position.x
          + Math.sin(angle * 0.63) * range * 0.65
          + Math.sin(angle * 1.31 + 2.1) * range * 0.28,
        y: orb.position.y
          + Math.cos(angle * 0.47 + 0.8) * range * 0.6
          + Math.sin(angle * 1.17 + 0.2) * range * 0.3,
      });

  }
}

export function evaluateFollowMotion(
  orb: SoundOrbDocument,
  targetPosition: NormalizedPoint,
  timeSeconds: number,
): NormalizedPoint {
  const motion = motionForOrb(orb);
  const range = motionRangeAmount(motion.range);
  const cycles = motionSpeedCycles(motion.speed);
  const phase = phaseForMotion(orb, motion);
  const angle = Math.PI * 2 * cycles * timeSeconds + phase;
  const followStrength = motion.range === 'tight'
    ? 0.38
    : motion.range === 'wide'
      ? 0.68
      : 0.52;

  return clampMotionPoint({
    x: orb.position.x
      + (targetPosition.x - orb.position.x) * followStrength
      + Math.cos(angle) * range * 0.18,
    y: orb.position.y
      + (targetPosition.y - orb.position.y) * followStrength
      + Math.sin(angle) * range * 0.18,
  });
}

export function nearestFollowTarget(
  orb: SoundOrbDocument,
  orbs: readonly SoundOrbDocument[],
): SoundOrbDocument | null {
  const candidates = orbs.filter((candidate) => candidate.id !== orb.id);

  let best: SoundOrbDocument | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const distance = Math.hypot(
      candidate.position.x - orb.position.x,
      candidate.position.y - orb.position.y,
    );

    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }

  return best;
}
