import type { SoundRole } from '../sounds/SoundDefinition';

export const MAX_SOUND_ORBS = 12;

export interface NormalizedPoint {
  readonly x: number;
  readonly y: number;
}

export interface SoundOrbDocument {
  readonly id: string;
  readonly soundId: string;
  readonly role: SoundRole;
  readonly position: NormalizedPoint;
  readonly muted: boolean;
}

export interface CreateSoundOrbOptions {
  readonly id?: string;
  readonly soundId: string;
  readonly role: SoundRole;
  readonly position: NormalizedPoint;
  readonly muted?: boolean;
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function clampPoint(point: NormalizedPoint): NormalizedPoint {
  return {
    x: clamp01(point.x),
    y: clamp01(point.y),
  };
}

function createOrbId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `orb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createSoundOrb(options: CreateSoundOrbOptions): SoundOrbDocument {
  return {
    id: options.id ?? createOrbId(),
    soundId: options.soundId,
    role: options.role,
    position: clampPoint(options.position),
    muted: options.muted ?? false,
  };
}
