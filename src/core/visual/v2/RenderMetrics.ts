import type { SoundRole } from '../../sounds/SoundDefinition';

const ROLE_SCALE: Record<SoundRole, number> = {
  beat: 1.06,
  percussion: 0.78,
  bass: 1.15,
  harmony: 1.28,
  melody: 0.9,
  texture: 1.34,
  voice: 1.06,
};

export function orbDiameterPixels(
  role: SoundRole,
  minDimension: number,
  dpr: number,
): number {
  const base = Math.max(
    54 * dpr,
    Math.min(86 * dpr, minDimension * 0.115),
  );

  return base * ROLE_SCALE[role];
}

export function listenerDiameterPixels(dpr: number): number {
  return 34 * dpr;
}

export function toyDiameterPixels(
  radius: number,
  width: number,
  height: number,
): readonly [number, number] {
  return [
    Math.max(28, radius * width * 1.05),
    Math.max(28, radius * height * 1.05),
  ];
}
