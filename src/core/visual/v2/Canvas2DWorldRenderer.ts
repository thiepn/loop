import type { VisualPreferences } from '../VisualQuality';
import {
  LINK_RENDER_COLORS,
  LISTENER_RENDER_COLOR,
  ROLE_RENDER_COLORS,
  TOY_RENDER_COLORS,
  fieldInfluencedColor,
  renderColorCss,
  withAlpha,
  type RenderColor,
} from './RenderPalette';
import {
  crossAffectedLinkPoints,
  curvedLinkPoints,
} from './LinkGeometry';
import {
  deriveEnvironmentDynamics,
  environmentParticleLayout,
} from './EnvironmentModel';
import { CanvasCrossSystemLayer } from './CanvasCrossSystemLayer';
import { CanvasFieldMaterialLayer } from './CanvasFieldMaterialLayer';
import { CanvasOrbMaterialLayer } from './CanvasOrbMaterialLayer';
import { CanvasTrailLayer } from './CanvasTrailLayer';
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
  private readonly crossLayer: CanvasCrossSystemLayer;
  private readonly fieldLayer: CanvasFieldMaterialLayer;
  private readonly trailLayer: CanvasTrailLayer;
  private readonly orbMaterial: CanvasOrbMaterialLayer;

  public constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly context: CanvasRenderingContext2D,
  ) {
    this.crossLayer = new CanvasCrossSystemLayer(context);
    this.fieldLayer = new CanvasFieldMaterialLayer(context);
    this.trailLayer = new CanvasTrailLayer(context);
    this.orbMaterial = new CanvasOrbMaterialLayer(context);
  }

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
    const width = this.canvas.width;
    const height = this.canvas.height;
    const dpr = this.viewport.dpr;
    const minDimension = Math.min(width, height);

    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0, 0, width, height);
    this.context.lineCap = 'round';
    this.context.lineJoin = 'round';

    const dynamics = deriveEnvironmentDynamics(
      scene,
      events,
      preferences,
    );
    const particles = environmentParticleLayout(
      scene.environment,
      preferences,
    );

    this.drawEnvironment(
      scene,
      dynamics,
      preferences,
      timestampMs,
      width,
      height,
    );
    this.drawEnvironmentParticles(
      scene,
      dynamics,
      preferences,
      particles,
      timestampMs,
      width,
      height,
      false,
    );

    this.fieldLayer.render(
      scene.fields,
      scene.fieldIntersections,
      preferences,
      timestampMs,
      width,
      height,
      dpr,
    );

    this.crossLayer.render(
      scene.orbCouplings,
      preferences,
      events,
      width,
      height,
      dpr,
    );

    for (const link of scene.links) {
      const points = crossAffectedLinkPoints(
        curvedLinkPoints(
          link.id,
          link.source,
          link.target,
          width,
          height,
        ),
        link.cross,
        width,
        height,
      );
      const base = fieldInfluencedColor(
        LINK_RENDER_COLORS[link.type],
        link.cross.fieldInfluence,
      );
      const color = withAlpha(
        base,
        link.selected ? 0.92 : base[3],
      );
      const frost = link.cross.fieldInfluence.frost;
      const echo = link.cross.fieldInfluence.echo;

      this.context.beginPath();
      points.forEach((point, index) => {
        if (frost > 0.34 && index > 0 && index % 2 === 0) {
          return;
        }
        if (index === 0) {
          this.context.moveTo(point.x, point.y);
        } else {
          this.context.lineTo(point.x, point.y);
        }
      });
      this.context.strokeStyle = renderColorCss(color);
      this.context.lineWidth = (
        link.selected ? 3 : 1.5
      ) * dpr * (
        1 + link.cross.fieldInfluence.space * 0.14
      );
      this.context.stroke();

      if (echo > 0.08) {
        const dx = link.target.x - link.source.x;
        const dy = link.target.y - link.source.y;
        const len = Math.hypot(dx, dy) || 1;
        const normalX = -dy / len;
        const normalY = dx / len;
        const offset = echo * 6 * dpr;

        this.context.beginPath();
        points.forEach((point, index) => {
          if (index === 0) {
            this.context.moveTo(
              point.x + normalX * offset,
              point.y + normalY * offset,
            );
          } else {
            this.context.lineTo(
              point.x + normalX * offset,
              point.y + normalY * offset,
            );
          }
        });
        this.context.strokeStyle = renderColorCss(
          withAlpha(
            color,
            color[3] * echo * 0.3,
          ),
        );
        this.context.lineWidth = 1.2 * dpr;
        this.context.stroke();
      }
    }

    for (const toy of scene.toys) {
      const [radiusX, radiusY] = toyDiameterPixels(
        toy.radius,
        width,
        height,
      );
      const color = fieldInfluencedColor(
        TOY_RENDER_COLORS[toy.type],
        toy.cross.fieldInfluence,
      );
      const responseScale = 1
        + toy.cross.nearbyOrbStrength * 0.08;

      if (toy.selected) {
        this.drawEllipse(
          toy.position.x * width,
          toy.position.y * height,
          radiusX * 0.62 * responseScale,
          radiusY * 0.62 * responseScale,
          [1, 1, 1, 0.14],
        );
      }

      if (toy.cross.nearbyOrbStrength > 0.04) {
        this.drawEllipse(
          toy.position.x * width,
          toy.position.y * height,
          radiusX * 0.58 * responseScale,
          radiusY * 0.58 * responseScale,
          withAlpha(
            color,
            0.05 + toy.cross.nearbyOrbStrength * 0.08,
          ),
        );
      }

      this.drawEllipse(
        toy.position.x * width,
        toy.position.y * height,
        radiusX * 0.5 * responseScale,
        radiusY * 0.5 * responseScale,
        color,
      );

      if (toy.type === 'portal' && toy.exitPosition) {
        this.drawEllipse(
          toy.exitPosition.x * width,
          toy.exitPosition.y * height,
          radiusX * 0.42,
          radiusY * 0.42,
          fieldInfluencedColor(
            [0.957, 0.447, 0.714, 0.72],
            toy.cross.fieldInfluence,
          ),
        );
      }
    }

    this.trailLayer.render(
      scene.trails,
      preferences,
      timestampMs,
      width,
      height,
      dpr,
    );

    this.orbMaterial.render(
      scene.orbs,
      preferences,
      events,
      timestampMs,
      width,
      height,
      dpr,
    );

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

    this.drawEnvironmentParticles(
      scene,
      dynamics,
      preferences,
      particles,
      timestampMs,
      width,
      height,
      true,
    );
  }

  public restore(): void {}

  public destroy(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawEnvironment(
    scene: Readonly<RenderScene>,
    dynamics: ReturnType<typeof deriveEnvironmentDynamics>,
    preferences: Readonly<VisualPreferences>,
    timestampMs: number,
    width: number,
    height: number,
  ): void {
    const context = this.context;
    const primary = scene.environment.primary;
    const secondary = scene.environment.secondary;
    const awake = scene.playing ? 1 : 0;
    const motionScale = preferences.reduceMotion ? 0 : 1;
    const time = timestampMs * 0.00008 * motionScale * (0.2 + awake * 0.8);
    const parallaxX = (
      dynamics.pointerPosition.x - 0.5
    ) * dynamics.pointerStrength * motionScale;
    const parallaxY = (
      dynamics.pointerPosition.y - 0.5
    ) * dynamics.pointerStrength * motionScale;

    context.fillStyle = 'rgb(3, 3, 7)';
    context.fillRect(0, 0, width, height);

    const hazeA = context.createRadialGradient(
      width * (0.30 + Math.sin(time + scene.environment.seed * 4) * 0.035 + parallaxX * 0.08),
      height * (0.38 + Math.cos(time * 0.8) * 0.03 + parallaxY * 0.06),
      0,
      width * 0.32,
      height * 0.42,
      Math.max(width, height) * 0.58,
    );
    hazeA.addColorStop(
      0,
      this.rgbCss(
        primary,
        0.11 * scene.environment.ambience + dynamics.energy * 0.045,
      ),
    );
    hazeA.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = hazeA;
    context.fillRect(0, 0, width, height);

    const hazeB = context.createRadialGradient(
      width * (0.72 + Math.cos(time * 0.7 + 1.8) * 0.035 - parallaxX * 0.11),
      height * (0.62 + Math.sin(time * 0.65) * 0.035 - parallaxY * 0.08),
      0,
      width * 0.72,
      height * 0.62,
      Math.max(width, height) * 0.52,
    );
    hazeB.addColorStop(
      0,
      this.rgbCss(
        secondary,
        0.085 * scene.environment.ambience + dynamics.energy * 0.035,
      ),
    );
    hazeB.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = hazeB;
    context.fillRect(0, 0, width, height);

    const fields = scene.fieldEnvironment;

    if (
      fields.space
      + fields.echo
      + fields.heat
      + fields.frost
      + fields.filter
      + fields.overlap
      > 0.001
    ) {
      context.fillStyle = 'rgba(96, 75, 180, '
        + (
          fields.space * 0.018
          + fields.overlap * 0.009
        ).toFixed(3)
        + ')';
      context.fillRect(0, 0, width, height);

      context.fillStyle = 'rgba(19, 128, 154, '
        + (fields.echo * 0.012).toFixed(3)
        + ')';
      context.fillRect(0, 0, width, height);

      context.fillStyle = 'rgba(162, 44, 9, '
        + (fields.heat * 0.02).toFixed(3)
        + ')';
      context.fillRect(0, 0, width, height);

      context.fillStyle = 'rgba(103, 178, 215, '
        + (fields.frost * 0.016).toFixed(3)
        + ')';
      context.fillRect(0, 0, width, height);

      context.fillStyle = 'rgba(11, 116, 79, '
        + (fields.filter * 0.014).toFixed(3)
        + ')';
      context.fillRect(0, 0, width, height);
    }

    if (dynamics.eventStrength > 0.001) {
      const radius = Math.max(width, height) * (
        0.16 + dynamics.eventStrength * 0.14
      );
      const eventGlow = context.createRadialGradient(
        dynamics.eventPosition.x * width,
        dynamics.eventPosition.y * height,
        0,
        dynamics.eventPosition.x * width,
        dynamics.eventPosition.y * height,
        radius,
      );
      eventGlow.addColorStop(
        0,
        this.rgbCss(
          primary,
          dynamics.eventStrength * 0.085,
        ),
      );
      eventGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = eventGlow;
      context.fillRect(0, 0, width, height);
    }

    if (dynamics.pointerStrength > 0.001) {
      const pointerGlow = context.createRadialGradient(
        dynamics.pointerPosition.x * width,
        dynamics.pointerPosition.y * height,
        0,
        dynamics.pointerPosition.x * width,
        dynamics.pointerPosition.y * height,
        Math.max(width, height) * 0.18,
      );
      pointerGlow.addColorStop(
        0,
        this.rgbCss(
          secondary,
          dynamics.pointerStrength * 0.04,
        ),
      );
      pointerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = pointerGlow;
      context.fillRect(0, 0, width, height);
    }

    if (dynamics.dragStrength > 0.001) {
      const dragGlow = context.createRadialGradient(
        dynamics.dragPosition.x * width,
        dynamics.dragPosition.y * height,
        0,
        dynamics.dragPosition.x * width,
        dynamics.dragPosition.y * height,
        Math.max(width, height) * 0.16,
      );
      dragGlow.addColorStop(
        0,
        this.rgbCss(
          primary,
          dynamics.dragStrength * 0.055,
        ),
      );
      dragGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = dragGlow;
      context.fillRect(0, 0, width, height);
    }

    if (dynamics.spotlightStrength > 0.001) {
      context.fillStyle = 'rgba(0, 0, 0, '
        + (dynamics.spotlightStrength * 0.035).toFixed(3)
        + ')';
      context.fillRect(0, 0, width, height);

      const spotlight = context.createRadialGradient(
        dynamics.spotlightPosition.x * width,
        dynamics.spotlightPosition.y * height,
        0,
        dynamics.spotlightPosition.x * width,
        dynamics.spotlightPosition.y * height,
        Math.max(width, height) * 0.3,
      );
      spotlight.addColorStop(
        0,
        this.rgbCss(
          primary,
          dynamics.spotlightStrength * 0.06,
        ),
      );
      spotlight.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = spotlight;
      context.fillRect(0, 0, width, height);
    }

    if (scene.recording) {
      context.fillStyle = 'rgba(92, 10, 32, 0.035)';
      context.fillRect(0, 0, width, height);
    }
  }

  private drawEnvironmentParticles(
    scene: Readonly<RenderScene>,
    dynamics: ReturnType<typeof deriveEnvironmentDynamics>,
    preferences: Readonly<VisualPreferences>,
    particles: ReturnType<typeof environmentParticleLayout>,
    timestampMs: number,
    width: number,
    height: number,
    near: boolean,
  ): void {
    const context = this.context;
    const motion = preferences.reduceMotion ? 0 : scene.playing ? 1 : 0;
    const time = timestampMs * 0.00012 * motion;
    const pointerX = dynamics.pointerPosition.x - 0.5;
    const pointerY = dynamics.pointerPosition.y - 0.5;

    for (const particle of particles) {
      if (particle.near !== near) {
        continue;
      }

      const drift = Math.sin(time * (0.7 + particle.depth) + particle.phase);
      const parallax = dynamics.pointerStrength * particle.depth * motion;
      const dragDx = particle.x - dynamics.dragPosition.x;
      const dragDy = particle.y - dynamics.dragPosition.y;
      const dragDistance = Math.hypot(dragDx, dragDy);
      const wake = Math.exp(
        -dragDistance * dragDistance * 34,
      ) * dynamics.dragStrength * particle.depth * motion;
      let x = particle.x
        + drift * 0.006 * particle.depth
        + pointerX * parallax * 0.045
        + dynamics.dragDelta.x * wake * 0.07;
      let y = particle.y
        + Math.cos(time * 0.83 + particle.phase) * 0.004 * particle.depth
        + pointerY * parallax * 0.04
        + dynamics.dragDelta.y * wake * 0.07;

      x = x - Math.floor(x);
      y = y - Math.floor(y);

      context.beginPath();
      context.arc(
        x * width,
        y * height,
        Math.max(0.45, particle.size * this.viewport.dpr),
        0,
        Math.PI * 2,
      );
      context.fillStyle = this.rgbCss(
        near ? [0.78, 0.84, 1] : [0.58, 0.68, 0.92],
        particle.alpha * (scene.playing ? 1 : 0.72),
      );
      context.fill();
    }
  }

  private rgbCss(
    rgb: readonly [number, number, number],
    alpha: number,
  ): string {
    return 'rgba('
      + Math.round(rgb[0] * 255)
      + ', '
      + Math.round(rgb[1] * 255)
      + ', '
      + Math.round(rgb[2] * 255)
      + ', '
      + Math.max(0, Math.min(1, alpha)).toFixed(3)
      + ')';
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
    const event = sample.event;

    if (event.kind === 'orb-pulse') {
      const orb = scene.orbs.find(
        (candidate) => candidate.id === event.orbId,
      );

      if (!orb) {
        return;
      }

      const position = event.position ?? orb.position;
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
          fade * 0.22 * event.intensity,
        ),
      );
      return;
    }

    if (
      event.kind === 'pointer-disturbance'
      || event.kind === 'orb-drop'
      || event.kind === 'orb-charge'
    ) {
      return;
    }

    const link = scene.links.find(
      (candidate) => candidate.id === event.linkId,
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
        fade * 0.5 * event.intensity,
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
