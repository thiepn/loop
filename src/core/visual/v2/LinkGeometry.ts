import type { NormalizedPoint } from '../../world/SoundOrb';

export interface PixelPoint {
  readonly x: number;
  readonly y: number;
}

function linkDirection(id: string): number {
  const hash = [...id].reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0,
  );

  return hash % 2 === 0 ? 1 : -1;
}

export function curvedLinkPoints(
  id: string,
  source: NormalizedPoint,
  target: NormalizedPoint,
  width: number,
  height: number,
  segments = 16,
): readonly PixelPoint[] {
  const x1 = source.x * width;
  const y1 = source.y * height;
  const x2 = target.x * width;
  const y2 = target.y * height;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const curve = Math.min(90, distance * 0.14);
  const nx = -dy / distance;
  const ny = dx / distance;
  const direction = linkDirection(id);
  const cx = (x1 + x2) / 2 + nx * curve * direction;
  const cy = (y1 + y2) / 2 + ny * curve * direction;
  const count = Math.max(2, Math.floor(segments));
  const points: PixelPoint[] = [];

  for (let index = 0; index <= count; index += 1) {
    const t = index / count;
    const inverse = 1 - t;

    points.push({
      x: inverse * inverse * x1 + 2 * inverse * t * cx + t * t * x2,
      y: inverse * inverse * y1 + 2 * inverse * t * cy + t * t * y2,
    });
  }

  return points;
}
