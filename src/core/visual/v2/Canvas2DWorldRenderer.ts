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
  deriveEnvironmentDynamics,
  environmentParticleLayout,
} from './EnvironmentModel';
import { CanvasOrbMaterialLayer } from './CanvasOrbMaterialLayer';
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
  private readonly orbMaterial: CanvasOrbMaterialLayer;

  public constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly context: CanvasRenderingContext2D,
  ) {
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
      let x = particle.x
        + drift * 0.006 * particle.depth
        + pointerX * parallax * 0.045;
      let y = particle.y
        + Math.cos(time * 0.83 + particle.phase) * 0.004 * particle.depth
        + pointerY * parallax * 0.04;

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

    if (event.kind === 'pointer-disturbance') {
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
