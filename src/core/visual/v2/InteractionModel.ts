import type { NormalizedPoint } from '../../world/SoundOrb';
import type {
  RenderFieldInteraction,
  RenderOrbInteraction,
} from './RenderTypes';

export const LONG_PRESS_CHARGE_MS = 420;
export const LONG_PRESS_CANCEL_DISTANCE_PX = 9;

export const IDLE_ORB_INTERACTION: RenderOrbInteraction = {
  hoverStrength: 0,
  hoverOffset: { x: 0, y: 0 },
  grabbed: false,
  dragVelocity: { x: 0, y: 0 },
  dragSpeed: 0,
  charging: false,
};

export const IDLE_FIELD_INTERACTION: RenderFieldInteraction = {
  dragging: false,
  resizing: false,
  tension: 0,
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function pointerPositionInRect(
  clientX: number,
  clientY: number,
  rect: Pick<DOMRectReadOnly, 'left' | 'top' | 'width' | 'height'>,
): NormalizedPoint | null {
  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  return {
    x: clamp01((clientX - rect.left) / rect.width),
    y: clamp01((clientY - rect.top) / rect.height),
  };
}

export function hoverInteractionAtPoint(
  pointer: NormalizedPoint,
  orb: NormalizedPoint,
  width: number,
  height: number,
  enabled: boolean,
): Pick<RenderOrbInteraction, 'hoverStrength' | 'hoverOffset'> {
  if (!enabled || width <= 0 || height <= 0) {
    return {
      hoverStrength: 0,
      hoverOffset: { x: 0, y: 0 },
    };
  }

  const dx = (pointer.x - orb.x) * width;
  const dy = (pointer.y - orb.y) * height;
  const distance = Math.hypot(dx, dy);
  const outer = Math.max(88, Math.min(132, Math.min(width, height) * 0.15));

  if (distance >= outer) {
    return {
      hoverStrength: 0,
      hoverOffset: { x: 0, y: 0 },
    };
  }

  const normalized = 1 - distance / outer;
  const strength = normalized * normalized * (3 - 2 * normalized);
  const length = distance || 1;

  return {
    hoverStrength: clamp01(strength),
    hoverOffset: {
      x: dx / length * strength,
      y: dy / length * strength,
    },
  };
}

export interface DragVelocitySample {
  readonly direction: NormalizedPoint;
  readonly speed: number;
}

export function dragVelocitySample(
  previous: NormalizedPoint,
  current: NormalizedPoint,
  elapsedMs: number,
  width: number,
  height: number,
): DragVelocitySample {
  const safeElapsed = Math.max(8, elapsedMs);
  const dx = (current.x - previous.x) * width;
  const dy = (current.y - previous.y) * height;
  const distance = Math.hypot(dx, dy);

  if (distance <= 0.001) {
    return {
      direction: { x: 0, y: 0 },
      speed: 0,
    };
  }

  const pixelsPerSecond = distance * 1000 / safeElapsed;

  return {
    direction: {
      x: dx / distance,
      y: dy / distance,
    },
    speed: clamp01(pixelsPerSecond / 1450),
  };
}

export function resizeTension(
  center: NormalizedPoint,
  pointer: NormalizedPoint,
  initialRadius: number,
  width: number,
  height: number,
): number {
  const dx = (pointer.x - center.x) * width;
  const dy = (pointer.y - center.y) * height;
  const radiusPx = Math.hypot(dx, dy);
  const referencePx = Math.max(
    1,
    initialRadius * Math.min(width, height),
  );

  return clamp01(
    Math.abs(radiusPx - referencePx)
    / Math.max(34, referencePx * 0.7),
  );
}

export function settleEnvelope(progress: number): number {
  const t = clamp01(progress);
  return Math.sin(t * Math.PI * 3.25)
    * Math.pow(1 - t, 1.8);
}

export function chargeEnvelope(progress: number): number {
  const t = clamp01(progress);
  return Math.sin(t * Math.PI)
    * Math.pow(1 - t * 0.35, 1.2);
}

export function movedDistancePixels(
  a: NormalizedPoint,
  b: NormalizedPoint,
  width: number,
  height: number,
): number {
  return Math.hypot(
    (b.x - a.x) * width,
    (b.y - a.y) * height,
  );
}
