import type { VisualPreferences } from '../VisualQuality';
import {
  FIELD_RENDER_COLORS,
  LINK_RENDER_COLORS,
  LISTENER_RENDER_COLOR,
  ROLE_RENDER_COLORS,
  TOY_RENDER_COLORS,
  renderColorCss,
  withAlpha,
  type RenderColor,
} from './RenderPalette';
import { curvedLinkPoints } from './LinkGeometry';
import {
  listenerDiameterPixels,
  orbDiameterPixels,
  toyDiameterPixels,
} from './RenderMetrics';
import type {
  RenderEventSample,
  RenderScene,
  RenderViewport,
  WorldRenderer,
} from './RenderTypes';

export class Canvas2DWorldRenderer implements WorldRenderer {
  public readonly kind = 'canvas2d' as const;
  private viewport: RenderViewport = {
    width: 1,
    height: 1,
    dpr: 1,
  };

  public constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly context: CanvasRenderingContext2D,
  ) {}

  public resize(viewport: RenderViewport): void {
    this.viewport = viewport;
    this.canvas.width = Math.max(1, Math.round(viewport.width * viewport.dpr));
    this.canvas.height = Math.max(1, Math.round(viewport.height * viewport.dpr));
  }

  public render(
    scene: Readonly<RenderScene>,
    preferences: Readonly<VisualPreferences>,
    events: readonly RenderEventSample[],
    timestampMs: number,
  ): void {
    void preferences;
    void timestampMs;

    const width = this.canvas.width;
    const height = this.canvas.height;
    const dpr = this.viewport.dpr;
    const minDimension = Math.min(width, height);

    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0, 0, width, height);
    this.context.lineCap = 'round';
    this.context.lineJoin = 'round';

    for (const field of scene.fields) {
      const color = FIELD_RENDER_COLORS[field.type];

      if (field.selected) {
        this.drawEllipse(
          field.position.x * width,
          field.position.y * height,
          field.radius * width * 1.02,
          field.radius * height * 1.02,
          [1, 1, 1, 0.1],
        );
      }

      this.drawEllipse(
        field.position.x * width,
        field.position.y * height,
        field.radius * width,
        field.radius * height,
        color,
      );
    }

    for (const link of scene.links) {
      const points = curvedLinkPoints(
        link.id,
        link.source,
        link.target,
        width,
        height,
      );
      const color = LINK_RENDER_COLORS[link.type];

      this.context.beginPath();
      points.forEach((point, index) => {
        if (index === 0) {
          this.context.moveTo(point.x, point.y);
        } else {
          this.context.lineTo(point.x, point.y);
        }
      });
      this.context.strokeStyle = renderColorCss(
        withAlpha(color, link.selected ? 0.92 : color[3]),
      );
      this.context.lineWidth = (link.selected ? 3 : 1.5) * dpr;
      this.context.stroke();
    }

    for (const toy of scene.toys) {
      const [radiusX, radiusY] = toyDiameterPixels(
        toy.radius,
        width,
        height,
      );
      const color = TOY_RENDER_COLORS[toy.type];

      if (toy.selected) {
        this.drawEllipse(
          toy.position.x * width,
          toy.position.y * height,
          radiusX * 0.62,
          radiusY * 0.62,
          [1, 1, 1, 0.14],
        );
      }

      this.drawEllipse(
        toy.position.x * width,
        toy.position.y * height,
        radiusX * 0.5,
        radiusY * 0.5,
        color,
      );

      if (toy.type === 'portal' && toy.exitPosition) {
        this.drawEllipse(
          toy.exitPosition.x * width,
          toy.exitPosition.y * height,
          radiusX * 0.42,
          radiusY * 0.42,
          [0.957, 0.447, 0.714, 0.72],
        );
      }
    }

    for (const orb of scene.orbs) {
      const diameter = orbDiameterPixels(
        orb.role,
        minDimension,
        dpr,
      );
      const color = ROLE_RENDER_COLORS[orb.role];
      const alpha = orb.muted ? 0.28 : 0.92;

      this.drawCircle(
        orb.position.x * width,
        orb.position.y * height,
        diameter * 0.67,
        withAlpha(color, orb.muted ? 0.05 : 0.09),
      );

      if (orb.selected) {
        this.drawCircle(
          orb.position.x * width,
          orb.position.y * height,
          diameter * 0.55,
          [1, 1, 1, 0.22],
        );
      }

      this.drawCircle(
        orb.position.x * width,
        orb.position.y * height,
        diameter * 0.47,
        withAlpha(color, alpha),
      );
    }

    const listenerDiameter = listenerDiameterPixels(dpr);
    this.drawCircle(
      scene.listener.x * width,
      scene.listener.y * height,
      listenerDiameter * 0.75,
      withAlpha(LISTENER_RENDER_COLOR, scene.playing ? 0.14 : 0.07),
    );
    this.drawCircle(
      scene.listener.x * width,
      scene.listener.y * height,
      listenerDiameter * 0.5,
      LISTENER_RENDER_COLOR,
    );

    for (const sample of events) {
      this.drawEvent(sample, scene, width, height, minDimension, dpr);
    }
  }

  public restore(): void {}

  public destroy(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawEvent(
    sample: RenderEventSample,
    scene: Readonly<RenderScene>,
    width: number,
    height: number,
    minDimension: number,
    dpr: number,
  ): void {
    const fade = 1 - sample.progress;

    if (sample.event.kind === 'orb-pulse') {
      const orb = scene.orbs.find(
        (candidate) => candidate.id === sample.event.orbId,
      );

      if (!orb) {
        return;
      }

      const position = sample.event.position ?? orb.position;
      const diameter = orbDiameterPixels(
        orb.role,
        minDimension,
        dpr,
      );
      const expansion = 1 + sample.progress * 0.9;
      const color = ROLE_RENDER_COLORS[orb.role];

      this.drawCircle(
        position.x * width,
        position.y * height,
        diameter * 0.58 * expansion,
        withAlpha(
          color,
          fade * 0.22 * sample.event.intensity,
        ),
      );
      return;
    }

    const link = scene.links.find(
      (candidate) => candidate.id === sample.event.linkId,
    );

    if (!link) {
      return;
    }

    const points = curvedLinkPoints(
      link.id,
      link.source,
      link.target,
      width,
      height,
      12,
    );
    const midpoint = points[Math.floor(points.length / 2)];

    if (!midpoint) {
      return;
    }

    this.drawCircle(
      midpoint.x,
      midpoint.y,
      (8 + sample.progress * 16) * dpr,
      withAlpha(
        LINK_RENDER_COLORS[link.type],
        fade * 0.5 * sample.event.intensity,
      ),
    );
  }

  private drawCircle(
    x: number,
    y: number,
    radius: number,
    color: RenderColor,
  ): void {
    this.drawEllipse(x, y, radius, radius, color);
  }

  private drawEllipse(
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    color: RenderColor,
  ): void {
    this.context.beginPath();
    this.context.ellipse(
      x,
      y,
      Math.max(1, radiusX),
      Math.max(1, radiusY),
      0,
      0,
      Math.PI * 2,
    );
    this.context.fillStyle = renderColorCss(color);
    this.context.fill();
  }
}
