import type { VisualPreferences } from '../VisualQuality';
import {
  ROLE_RENDER_COLORS,
  mixRenderColor,
  renderColorCss,
  withAlpha,
} from './RenderPalette';
import type {
  RenderEventSample,
  RenderOrbCoupling,
} from './RenderTypes';
import { deriveTransitionFrame } from './TransitionModel';

function pulseForCoupling(
  coupling: RenderOrbCoupling,
  events: readonly RenderEventSample[],
): number {
  let pulse = 0;
  for (const sample of events) {
    if (sample.event.kind !== 'orb-pulse') continue;
    if (
      sample.event.orbId !== coupling.orbAId
      && sample.event.orbId !== coupling.orbBId
    ) continue;

    pulse = Math.max(
      pulse,
      sample.event.intensity * Math.pow(1 - sample.progress, 1.4),
    );
  }
  return pulse;
}

export class CanvasCrossSystemLayer {
  public constructor(
    private readonly context: CanvasRenderingContext2D,
  ) {}

  public render(
    couplings: readonly RenderOrbCoupling[],
    preferences: Readonly<VisualPreferences>,
    events: readonly RenderEventSample[],
    width: number,
    height: number,
    dpr: number,
  ): void {
    const context = this.context;

    for (const coupling of couplings) {
      const ax = coupling.positionA.x * width;
      const ay = coupling.positionA.y * height;
      const bx = coupling.positionB.x * width;
      const by = coupling.positionB.y * height;
      const pulse = pulseForCoupling(coupling, events);
      const colorA = ROLE_RENDER_COLORS[coupling.roleA];
      const colorB = ROLE_RENDER_COLORS[coupling.roleB];
      const mixed = mixRenderColor(colorA, colorB, 0.5);
      const alpha = coupling.strength
        * (preferences.reduceBloom ? 0.045 : 0.07 + pulse * 0.06);

      if (alpha <= 0.002) continue;

      const gradient = context.createLinearGradient(
        ax,
        ay,
        bx,
        by,
      );
      gradient.addColorStop(
        0,
        renderColorCss(withAlpha(colorA, alpha * 0.7)),
      );
      gradient.addColorStop(
        0.5,
        renderColorCss(withAlpha(mixed, alpha)),
      );
      gradient.addColorStop(
        1,
        renderColorCss(withAlpha(colorB, alpha * 0.7)),
      );

      context.save();
      context.beginPath();
      context.moveTo(ax, ay);
      context.lineTo(bx, by);
      context.strokeStyle = gradient;
      context.lineWidth = (
        12 + coupling.strength * 18 + pulse * 7
      ) * dpr;
      context.lineCap = 'round';
      context.globalCompositeOperation = 'lighter';
      context.stroke();
      context.restore();
    }

    const transitions = deriveTransitionFrame(
      events,
      preferences,
    );

    for (const beam of transitions.beams) {
      context.save();
      context.beginPath();
      context.moveTo(
        beam.from.x * width,
        beam.from.y * height,
      );
      context.lineTo(
        beam.to.x * width,
        beam.to.y * height,
      );
      context.strokeStyle = renderColorCss(
        withAlpha(
          beam.color,
          beam.strength * (
            preferences.reduceBloom ? 0.28 : 0.5
          ),
        ),
      );
      context.lineWidth = Math.max(
        1.2 * dpr,
        beam.width * Math.min(width, height),
      );
      context.lineCap = 'round';
      context.globalCompositeOperation = 'lighter';
      context.stroke();
      context.restore();
    }
  }
}
