import type { VisualPreferences } from '../VisualQuality';
import {
  renderColorCss,
  withAlpha,
} from './RenderPalette';
import {
  smoothedTrailPoints,
  trailAgeAlpha,
  trailVisualStyle,
} from './TrailGeometry';
import { renderPolicyForPreferences } from './RendererPolicy';
import type {
  RenderTrail,
  RenderTrailPoint,
} from './RenderTypes';

function pointPixels(
  point: RenderTrailPoint,
  width: number,
  height: number,
): { x: number; y: number } {
  return {
    x: point.position.x * width,
    y: point.position.y * height,
  };
}

export class CanvasTrailLayer {
  public constructor(
    private readonly context: CanvasRenderingContext2D,
  ) {}

  public render(
    trails: readonly RenderTrail[],
    preferences: Readonly<VisualPreferences>,
    timestampMs: number,
    width: number,
    height: number,
    dpr: number,
  ): void {
    if (trails.length === 0 || preferences.reduceMotion) {
      return;
    }

    const detail = renderPolicyForPreferences(
      preferences,
    ).trailDetail;

    for (const trail of trails) {
      const points = smoothedTrailPoints(
        trail.points,
        detail,
      );

      for (let index = 1; index < points.length; index += 1) {
        const a = points[index - 1]!;
        const b = points[index]!;

        if (b.breakBefore) {
          continue;
        }

        const style = trailVisualStyle(
          trail.role,
          b,
          preferences,
          timestampMs,
        );

        if (
          style.segmented
          && index % 2 === 0
        ) {
          continue;
        }

        const alpha = trailAgeAlpha(
          b,
          timestampMs,
          preferences,
        ) * style.alpha * (trail.muted ? 0.28 : 1);

        if (alpha <= 0.002) {
          continue;
        }

        const from = pointPixels(a, width, height);
        const to = pointPixels(b, width, height);
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.hypot(dx, dy);
        const nx = length > 0 ? -dy / length : 0;
        const ny = length > 0 ? dx / length : 0;

        for (
          let layer = 0;
          layer < style.layerCount;
          layer += 1
        ) {
          const layerOffset = style.layerCount > 1
            ? (layer === 0 ? -2.2 : 2.2) * dpr
            : 0;

          this.strokeSegment(
            from.x + nx * (
              style.lateralOffsetPx * dpr + layerOffset
            ),
            from.y + ny * (
              style.lateralOffsetPx * dpr + layerOffset
            ),
            to.x + nx * (
              style.lateralOffsetPx * dpr + layerOffset
            ),
            to.y + ny * (
              style.lateralOffsetPx * dpr + layerOffset
            ),
            style.widthPx * dpr,
            withAlpha(
              style.color,
              alpha * (layer === 0 ? 1 : 0.72),
            ),
          );
        }

        if (style.ghostAlpha > 0.01) {
          const offset = (
            style.lateralOffsetPx
            + style.ghostOffsetPx
          ) * dpr;

          this.strokeSegment(
            from.x + nx * offset,
            from.y + ny * offset,
            to.x + nx * offset,
            to.y + ny * offset,
            style.widthPx * dpr * 0.82,
            withAlpha(
              style.color,
              alpha * style.ghostAlpha,
            ),
          );
        }

        if (
          !preferences.reduceParticles
          && b.turn > 0.32
        ) {
          this.drawSpark(
            to.x,
            to.y,
            (
              2.2 + b.turn * 4.2
            ) * style.sparkScale * dpr,
            withAlpha(
              style.color,
              alpha * 0.72,
            ),
          );
        }
      }
    }
  }

  private strokeSegment(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    width: number,
    color: readonly [number, number, number, number],
  ): void {
    const context = this.context;
    const middleX = (x1 + x2) / 2;
    const middleY = (y1 + y2) / 2;

    context.beginPath();
    context.moveTo(x1, y1);
    context.quadraticCurveTo(
      middleX,
      middleY,
      x2,
      y2,
    );
    context.lineWidth = Math.max(0.8, width);
    context.strokeStyle = renderColorCss(color);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.stroke();
  }

  private drawSpark(
    x: number,
    y: number,
    size: number,
    color: readonly [number, number, number, number],
  ): void {
    const context = this.context;

    context.beginPath();
    context.moveTo(x, y - size);
    context.lineTo(x + size, y);
    context.lineTo(x, y + size);
    context.lineTo(x - size, y);
    context.closePath();
    context.fillStyle = renderColorCss(color);
    context.fill();
  }
}
