import type { VisualPreferences } from '../VisualQuality';
import {
  ROLE_RENDER_COLORS,
  TOY_RENDER_COLORS,
  fieldInfluencedColor,
  renderColorCss,
  withAlpha,
  type RenderColor,
} from './RenderPalette';
import {
  deriveEnvironmentDynamics,
  environmentParticleLayout,
} from './EnvironmentModel';
import { CanvasCrossSystemLayer } from './CanvasCrossSystemLayer';
import { CanvasFieldMaterialLayer } from './CanvasFieldMaterialLayer';
import { CanvasLightPropagationLayer } from './CanvasLightPropagationLayer';
import { CanvasLinkLightLayer } from './CanvasLinkLightLayer';
import { CanvasListenerLayer } from './CanvasListenerLayer';
import { deriveLightFrame } from './LightModel';
import {
  deriveChoreographyFrame,
  type ChoreographyFrame,
} from './ChoreographyModel';
import {
  deriveTransitionFrame,
  type TransitionFrame,
} from './TransitionModel';
import { CanvasOrbMaterialLayer } from './CanvasOrbMaterialLayer';
import { CanvasTrailLayer } from './CanvasTrailLayer';
import {
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
  private readonly linkLayer: CanvasLinkLightLayer;
  private readonly lightLayer: CanvasLightPropagationLayer;
  private readonly listenerLayer: CanvasListenerLayer;
  private readonly trailLayer: CanvasTrailLayer;
  private readonly orbMaterial: CanvasOrbMaterialLayer;

  public constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly context: CanvasRenderingContext2D,
  ) {
    this.crossLayer = new CanvasCrossSystemLayer(context);
    this.fieldLayer = new CanvasFieldMaterialLayer(context);
    this.linkLayer = new CanvasLinkLightLayer(context);
    this.lightLayer = new CanvasLightPropagationLayer(context);
    this.listenerLayer = new CanvasListenerLayer(context);
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
    const lightFrame = deriveLightFrame(
      scene,
      events,
      preferences,
    );
    const choreography = deriveChoreographyFrame(
      scene,
      events,
      preferences,
    );
    const transition = deriveTransitionFrame(
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
      choreography,
      transition,
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

    this.linkLayer.render(
      scene.links,
      preferences,
      events,
      width,
      height,
      dpr,
    );

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

    for (const sample of events) {
      this.drawEvent(sample, scene, width, height, minDimension, dpr);
    }

    this.lightLayer.render(
      lightFrame,
      preferences,
      width,
      height,
      dpr,
    );

    this.listenerLayer.render(
      scene.listener,
      lightFrame.listener,
      scene.playing,
      scene.recording,
      preferences,
      timestampMs,
      width,
      height,
      dpr,
    );

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
    choreography: Readonly<ChoreographyFrame>,
    transition: Readonly<TransitionFrame>,
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

    if (scene.crossEnvironment.couplingEnergy > 0.001) {
      context.fillStyle = 'rgba(92, 104, 170, '
        + (scene.crossEnvironment.couplingEnergy * 0.022).toFixed(3)
        + ')';
      context.fillRect(0, 0, width, height);
    }

    const listenerX = scene.listener.x * width;
    const listenerY = scene.listener.y * height;
    const minDimension = Math.min(width, height);

    if (
      choreography.wake > 0.001
      || choreography.reentry > 0.001
    ) {
      const wake = context.createRadialGradient(
        listenerX,
        listenerY,
        0,
        listenerX,
        listenerY,
        minDimension * 0.52,
      );
      wake.addColorStop(
        0,
        this.rgbCss(
          primary,
          choreography.wake * 0.075
          + choreography.reentry * 0.095,
        ),
      );
      wake.addColorStop(1, 'rgba(0, 0, 0, 0)');
      context.fillStyle = wake;
      context.fillRect(0, 0, width, height);
    }

    if (choreography.pressure > 0.01) {
      context.save();
      context.beginPath();
      context.arc(
        listenerX,
        listenerY,
        minDimension * (
          0.12 + choreography.pressurePhase * 0.74
        ),
        0,
        Math.PI * 2,
      );
      context.strokeStyle = this.rgbCss(
        secondary,
        choreography.pressure * 0.09,
      );
      context.lineWidth = Math.max(
        1,
        minDimension * 0.012 * choreography.pressure,
      );
      context.stroke();
      context.restore();
    }

    if (
      choreography.phraseBuild > 0.001
      || choreography.phraseRelease > 0.001
      || choreography.harmonyBloom > 0.001
    ) {
      context.fillStyle = this.rgbCss(
        secondary,
        choreography.phraseBuild * 0.018
        + choreography.phraseRelease * 0.045
        + choreography.harmonyBloom * 0.028,
      );
      context.fillRect(0, 0, width, height);
    }

    if (
      choreography.settle > 0.001
      || choreography.silence > 0.001
      || choreography.bassCompression > 0.001
    ) {
      context.fillStyle = 'rgba(0, 0, 0, '
        + (
          choreography.settle * 0.055
          + choreography.silence * 0.07
          + choreography.bassCompression * 0.025
        ).toFixed(3)
        + ')';
      context.fillRect(0, 0, width, height);
    }

    if (transition.worldEnergy > 0.001) {
      context.save();
      context.beginPath();
      context.arc(
        listenerX,
        listenerY,
        minDimension * (
          preferences.reduceMotion
            ? 0.52
            : 0.1 + transition.worldPhase * 0.95
        ),
        0,
        Math.PI * 2,
      );
      context.strokeStyle = 'rgba(176, 146, 255, '
        + (transition.worldEnergy * 0.1).toFixed(3)
        + ')';
      context.lineWidth = Math.max(
        1,
        minDimension * 0.014 * transition.worldEnergy,
      );
      context.stroke();
      context.restore();
    }

    if (
      transition.dissolve > 0.001
      || transition.reconstruct > 0.001
    ) {
      context.fillStyle = 'rgba(95, 82, 150, '
        + (
          transition.reconstruct * 0.028
          - transition.dissolve * 0.012
        ).toFixed(3)
        + ')';
      if (transition.reconstruct > transition.dissolve) {
        context.fillRect(0, 0, width, height);
      }
    }

    if (
      choreography.recordStart > 0.001
      || choreography.recordStop > 0.001
    ) {
      context.fillStyle = 'rgba(128, 26, 62, '
        + (
          choreography.recordStart * 0.035
          + choreography.recordStop * 0.018
        ).toFixed(3)
        + ')';
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
      const force = scene.crossEnvironment;
      const forceDx = particle.x - force.forcePosition.x;
      const forceDy = particle.y - force.forcePosition.y;
      const forceDistance = Math.max(
        0.001,
        Math.hypot(forceDx, forceDy),
      );
      const forceLocal = Math.exp(
        -forceDistance * forceDistance * 24,
      ) * force.forceStrength * particle.depth * motion;
      const forceDirX = forceDx / forceDistance;
      const forceDirY = forceDy / forceDistance;
      let forceX = 0;
      let forceY = 0;

      switch (force.forceType) {
        case 'spinner':
          forceX = -forceDirY * forceLocal * 0.025;
          forceY = forceDirX * forceLocal * 0.025;
          break;
        case 'magnet':
          forceX = -forceDirX * forceLocal * 0.022;
          forceY = -forceDirY * forceLocal * 0.022;
          break;
        case 'repulsor':
          forceX = forceDirX * forceLocal * 0.027;
          forceY = forceDirY * forceLocal * 0.027;
          break;
        case 'portal':
          forceX = -forceDirX * forceLocal * 0.032;
          forceY = -forceDirY * forceLocal * 0.032;
          break;
        case null:
          break;
      }

      let x = particle.x
        + drift * 0.006 * particle.depth
        + pointerX * parallax * 0.045
        + dynamics.dragDelta.x * wake * 0.07
        + forceX;
      let y = particle.y
        + Math.cos(time * 0.83 + particle.phase) * 0.004 * particle.depth
        + pointerY * parallax * 0.04
        + dynamics.dragDelta.y * wake * 0.07
        + forceY;

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

    return;
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
