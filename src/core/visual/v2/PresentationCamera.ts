import type { VisualQuality } from '../VisualQuality';
import { motionForOrb, motionRangeAmount } from '../../world/Motion';
import type { NormalizedPoint } from '../../world/SoundOrb';
import type { WorldDocument } from '../../world/World';

export interface PresentationCamera {
  readonly center: NormalizedPoint;
  readonly zoom: number;
}

export interface PresentationCameraOptions {
  readonly width: number;
  readonly height: number;
  readonly quality: VisualQuality;
  readonly reduceMotion: boolean;
  readonly playing: boolean;
  readonly recording: boolean;
  readonly timestampMs: number;
  readonly focus?: NormalizedPoint | null;
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function include(
  bounds: Bounds,
  point: NormalizedPoint,
  radius: number,
): void {
  bounds.minX = Math.min(bounds.minX, point.x - radius);
  bounds.minY = Math.min(bounds.minY, point.y - radius);
  bounds.maxX = Math.max(bounds.maxX, point.x + radius);
  bounds.maxY = Math.max(bounds.maxY, point.y + radius);
}

function cameraRange(
  bounds: Bounds,
  zoom: number,
  marginX: number,
  marginY: number,
): {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
} {
  const halfX = (0.5 - marginX) / zoom;
  const halfY = (0.5 - marginY) / zoom;
  const canvasMin = 0.5 / zoom;
  const canvasMax = 1 - canvasMin;

  return {
    minX: Math.max(canvasMin, bounds.maxX - halfX),
    maxX: Math.min(canvasMax, bounds.minX + halfX),
    minY: Math.max(canvasMin, bounds.maxY - halfY),
    maxY: Math.min(canvasMax, bounds.minY + halfY),
  };
}

export function presentationCameraForWorld(
  world: Readonly<WorldDocument>,
  options: Readonly<PresentationCameraOptions>,
): PresentationCamera {
  const width = Math.max(1, options.width);
  const height = Math.max(1, options.height);
  const minDimension = Math.max(320, Math.min(width, height));
  const pixel = 1 / minDimension;
  const bounds: Bounds = {
    minX: 0.5,
    minY: 0.5,
    maxX: 0.5,
    maxY: 0.5,
  };

  include(bounds, { x: 0.5, y: 0.5 }, 34 * pixel);

  let sumX = 1;
  let sumY = 1;
  let weight = 2;

  for (const orb of world.soundOrbs) {
    const motion = motionForOrb(orb);
    const motionPad = motion.mode === 'still'
      ? 0
      : motionRangeAmount(motion.range);
    include(bounds, orb.position, 48 * pixel + motionPad);
    sumX += orb.position.x;
    sumY += orb.position.y;
    weight += 1;
  }

  for (const field of world.effectFields) {
    include(bounds, field.position, field.radius + 10 * pixel);
    sumX += field.position.x * 0.45;
    sumY += field.position.y * 0.45;
    weight += 0.45;
  }

  for (const toy of world.playgroundToys) {
    include(bounds, toy.position, toy.radius + 8 * pixel);
    sumX += toy.position.x * 0.5;
    sumY += toy.position.y * 0.5;
    weight += 0.5;

    if (toy.exitPosition) {
      include(bounds, toy.exitPosition, 30 * pixel);
      sumX += toy.exitPosition.x * 0.25;
      sumY += toy.exitPosition.y * 0.25;
      weight += 0.25;
    }
  }

  const boundsCenter = {
    x: (bounds.minX + bounds.maxX) * 0.5,
    y: (bounds.minY + bounds.maxY) * 0.5,
  };
  const centroid = {
    x: sumX / weight,
    y: sumY / weight,
  };
  let center = {
    x: boundsCenter.x * 0.64 + centroid.x * 0.36,
    y: boundsCenter.y * 0.64 + centroid.y * 0.36,
  };

  if (options.focus) {
    center = {
      x: center.x * 0.82 + options.focus.x * 0.18,
      y: center.y * 0.82 + options.focus.y * 0.18,
    };
  }

  const marginPx = Math.min(
    88,
    Math.max(38, minDimension * 0.05),
  );
  const marginX = marginPx / width;
  const marginY = marginPx / height;
  const distanceX = Math.max(
    0.001,
    center.x - bounds.minX,
    bounds.maxX - center.x,
  );
  const distanceY = Math.max(
    0.001,
    center.y - bounds.minY,
    bounds.maxY - center.y,
  );
  const fitZoom = Math.min(
    (0.5 - marginX) / distanceX,
    (0.5 - marginY) / distanceY,
  );
  const objectCount = world.soundOrbs.filter(
    (orb) => !orb.muted,
  ).length
    + world.effectFields.length * 1.25
    + world.playgroundToys.length
    + world.links.length * 0.35;
  const density = Math.min(1, objectCount / 14);
  const spread = Math.max(
    bounds.maxX - bounds.minX,
    bounds.maxY - bounds.minY,
  );
  const aspect = width / height;
  let desiredZoom = 1.36
    - density * 0.24
    - Math.min(0.1, spread * 0.08)
    + (options.focus ? 0.04 : 0);

  if (aspect >= 2) {
    desiredZoom = Math.min(desiredZoom, 1.12);
  } else if (aspect >= 1.65 || aspect <= 0.78) {
    desiredZoom = Math.min(desiredZoom, 1.18);
  }

  if (minDimension >= 900 || options.recording) {
    desiredZoom = Math.min(desiredZoom, 1.18);
  }

  const zoom = Math.max(1, Math.min(desiredZoom, fitZoom));

  if (zoom <= 1.001) {
    center = { x: 0.5, y: 0.5 };
  } else {
    const range = cameraRange(bounds, zoom, marginX, marginY);

    center.x = range.minX <= range.maxX
      ? clamp(center.x, range.minX, range.maxX)
      : clamp(center.x, 0.5 / zoom, 1 - 0.5 / zoom);
    center.y = range.minY <= range.maxY
      ? clamp(center.y, range.minY, range.maxY)
      : clamp(center.y, 0.5 / zoom, 1 - 0.5 / zoom);

    if (!options.reduceMotion && objectCount > 0) {
      const drift = (
        options.quality === 'high'
          ? 0.007
          : options.quality === 'balanced'
            ? 0.0045
            : 0.002
      ) * (
        options.recording
          ? 0.55
          : options.playing
            ? 1
            : 0.35
      );
      const phase = (world.music.seed % 997) * 0.013;
      const driftX = Math.sin(options.timestampMs / 23000 + phase)
        * drift
        * (aspect >= 2 ? 0.72 : 1);
      const driftY = Math.cos(options.timestampMs / 29000 + phase * 0.7)
        * drift;

      if (range.minX <= range.maxX) {
        center.x = clamp(center.x + driftX, range.minX, range.maxX);
      }

      if (range.minY <= range.maxY) {
        center.y = clamp(center.y + driftY, range.minY, range.maxY);
      }
    }
  }

  return {
    center: {
      x: clamp(center.x, 0, 1),
      y: clamp(center.y, 0, 1),
    },
    zoom,
  };
}
