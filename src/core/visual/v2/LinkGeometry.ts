import type { NormalizedPoint } from '../../world/SoundOrb';
import type { RenderLinkCrossInteraction } from './RenderTypes';

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


export function crossAffectedLinkPoints(
  points: readonly PixelPoint[],
  interaction: Readonly<RenderLinkCrossInteraction>,
  width: number,
  height: number,
): readonly PixelPoint[] {
  if (points.length < 2) {
    return points;
  }

  const baseScale = Math.min(width, height);
  const result: PixelPoint[] = [];

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index]!;
    const t = index / Math.max(1, points.length - 1);
    const bell = Math.sin(t * Math.PI);
    let offsetX = interaction.refractionDirection.x
      * interaction.refractionStrength
      * baseScale
      * 0.022
      * bell;
    let offsetY = interaction.refractionDirection.y
      * interaction.refractionStrength
      * baseScale
      * 0.022
      * bell;

    const toy = interaction.toyInfluence;

    if (toy) {
      switch (toy.type) {
        case 'spinner': {
          const wave = Math.sin(t * Math.PI * 2) * toy.amount;
          offsetX += -interaction.refractionDirection.y
            * wave
            * baseScale
            * 0.01;
          offsetY += interaction.refractionDirection.x
            * wave
            * baseScale
            * 0.01;
          break;
        }
        case 'magnet':
          offsetX *= 1 - toy.amount * 0.28;
          offsetY *= 1 - toy.amount * 0.28;
          break;
        case 'repulsor':
          offsetX *= 1 + toy.amount * 0.38;
          offsetY *= 1 + toy.amount * 0.38;
          break;
        case 'portal':
          offsetX += Math.sin(t * Math.PI * 4)
            * toy.amount
            * baseScale
            * 0.004;
          break;
      }
    }

    result.push({
      x: point.x + offsetX,
      y: point.y + offsetY,
    });
  }

  return result;
}
