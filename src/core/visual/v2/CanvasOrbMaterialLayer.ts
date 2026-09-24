import type { VisualPreferences } from '../VisualQuality';
import type { SoundRole } from '../../sounds/SoundDefinition';
import type { EffectAmounts } from '../../world/EffectField';
import {
  ROLE_RENDER_COLORS,
  renderColorCss,
  withAlpha,
  type RenderColor,
} from './RenderPalette';
import { transientOrbInteraction } from './InteractionModel';
import { renderPolicyForPreferences } from './RendererPolicy';
import { orbDiameterPixels } from './RenderMetrics';
import type {
  RenderEventSample,
  RenderOrb,
} from './RenderTypes';

interface PulseState {
  readonly amount: number;
  readonly progress: number;
}

function pulseForOrb(
  orbId: string,
  events: readonly RenderEventSample[],
): PulseState {
  let amount = 0;
  let progress = 1;

  for (const sample of events) {
    if (
      sample.event.kind !== 'orb-pulse'
      || sample.event.orbId !== orbId
    ) {
      continue;
    }

    const candidate = sample.event.intensity
      * Math.pow(1 - sample.progress, 1.65);

    if (candidate > amount) {
      amount = candidate;
      progress = sample.progress;
    }
  }

  return { amount, progress };
}

function roleBoundary(
  role: SoundRole,
  angle: number,
  time: number,
  seed: number,
  pulse: number,
): number {
  switch (role) {
    case 'beat':
      return 0.94 + Math.cos(angle * 4) * 0.035 + pulse * 0.065;
    case 'percussion':
      return 0.89 + Math.cos(angle * 8 + seed * 6.28) * 0.058 + pulse * 0.025;
    case 'bass':
      return 0.98 + Math.sin(angle * 2 + time * 0.8 + seed * 5) * 0.035 + pulse * 0.075;
    case 'harmony':
      return 0.95 + Math.cos(angle * 3 + time * 0.28) * 0.052 + pulse * 0.04;
    case 'melody':
      return 0.9 + Math.sin(angle * 5) * 0.024 + pulse * 0.04;
    case 'texture':
      return 1 + Math.sin(angle * 3 - time * 0.22) * 0.035 + Math.sin(angle * 7 + seed * 9) * 0.022;
    case 'voice':
      return 0.94 + Math.sin(angle * 2 + 0.8 + time * 0.2) * 0.052 + Math.sin(angle * 5 - time * 0.32) * 0.026 + pulse * 0.045;
  }
}

function mix(
  a: number,
  b: number,
  amount: number,
): number {
  return a + (b - a) * Math.max(0, Math.min(1, amount));
}

function adjustedFieldColor(
  color: RenderColor,
  effects: EffectAmounts,
): RenderColor {
  let result: RenderColor = color;
  const blend = (
    target: RenderColor,
    amount: number,
  ) => {
    result = [
      mix(result[0], target[0], amount),
      mix(result[1], target[1], amount),
      mix(result[2], target[2], amount),
      result[3],
    ];
  };

  blend([0.48, 0.4, 1, 1], effects.space * 0.16);
  blend([0.38, 0.9, 1, 1], effects.echo * 0.12);
  blend([1, 0.28, 0.08, 1], effects.heat * 0.34);
  blend([0.78, 0.94, 1, 1], effects.frost * 0.42);
  blend([0.18, 0.78, 0.58, 1], effects.filter * 0.24);

  return [
    result[0] * (1 - effects.filter * 0.12),
    result[1] * (1 - effects.filter * 0.12),
    result[2] * (1 - effects.filter * 0.12),
    result[3],
  ];
}

function fieldBoundaryDelta(
  effects: EffectAmounts,
  angle: number,
  time: number,
): number {
  return effects.space * 0.018
    + effects.heat * 0.028 * Math.sin(angle * 5 + time * 2.1)
    - effects.frost * 0.012 * (
      0.5 + 0.5 * Math.cos(angle * 8)
    )
    - effects.filter * 0.008;
}

export class CanvasOrbMaterialLayer {
  public constructor(
    private readonly context: CanvasRenderingContext2D,
  ) {}

  public render(
    orbs: readonly RenderOrb[],
    preferences: Readonly<VisualPreferences>,
    events: readonly RenderEventSample[],
    timestampMs: number,
    width: number,
    height: number,
    dpr: number,
  ): void {
    const detail = renderPolicyForPreferences(preferences).orbDetail;
    const minDimension = Math.min(width, height);
    const time = preferences.reduceMotion
      ? 0
      : timestampMs * 0.001;

    const hasSelection = orbs.some((orb) => orb.selected);

    for (const orb of orbs) {
      const diameter = orbDiameterPixels(
        orb.role,
        minDimension,
        dpr,
      );
      const radius = diameter * 0.5;
      const transient = transientOrbInteraction(
        orb.id,
        events,
      );
      const hoverShift = preferences.reduceMotion
        ? { x: 0, y: 0 }
        : {
            x: orb.interaction.hoverOffset.x * 4 * dpr,
            y: orb.interaction.hoverOffset.y * 4 * dpr,
          };
      const settleShift = preferences.reduceMotion
        ? { x: 0, y: 0 }
        : {
            x: transient.settleDirection.x
              * transient.settle
              * radius
              * 0.11,
            y: transient.settleDirection.y
              * transient.settle
              * radius
              * 0.11,
          };
      const x = orb.position.x * width
        + hoverShift.x
        + settleShift.x;
      const y = orb.position.y * height
        + hoverShift.y
        + settleShift.y;
      const pulse = pulseForOrb(orb.id, events);
      const color = adjustedFieldColor(
        ROLE_RENDER_COLORS[orb.role],
        orb.material.fieldInfluence,
      );

      this.context.save();
      if (hasSelection && !orb.selected) {
        this.context.globalAlpha *= 0.9;
      }

      this.drawLiftShadow(
        orb,
        x,
        y,
        radius,
        dpr,
        transient.charge,
      );
      this.drawAura(
        x,
        y,
        radius,
        color,
        orb.muted,
        orb.material.energy
          + orb.material.fieldInfluence.space * 0.2,
      );
      this.drawBody(
        orb,
        x,
        y,
        radius,
        color,
        pulse.amount,
        time,
        transient.settle,
      );

      this.drawFieldInfluence(
        orb,
        x,
        y,
        radius,
        color,
        time,
        dpr,
      );

      if (detail > 0.25) {
        this.drawInternalMaterial(
          orb,
          x,
          y,
          radius,
          color,
          time,
          detail,
        );
        this.drawPatternFingerprint(
          orb,
          x,
          y,
          radius,
          detail,
        );
      }

      if (orb.role === 'melody' && detail > 0.38) {
        this.drawMelodySatellites(
          orb,
          x,
          y,
          radius,
          color,
          time,
        );
      }

      if (orb.focused) {
        this.context.save();
        this.context.setLineDash([
          Math.max(2, radius * 0.12),
          Math.max(2, radius * 0.08),
        ]);
        this.context.beginPath();
        this.context.arc(
          x,
          y,
          radius * 1.11,
          0,
          Math.PI * 2,
        );
        this.context.strokeStyle = 'rgba(220, 228, 255, 0.66)';
        this.context.lineWidth = Math.max(1, 1.05 * dpr);
        this.context.stroke();
        this.context.restore();
      }

      if (orb.selected) {
        this.context.beginPath();
        this.context.arc(
          x,
          y,
          radius * 1.2,
          0,
          Math.PI * 2,
        );
        this.context.strokeStyle = 'rgba(240, 244, 255, 0.76)';
        this.context.lineWidth = Math.max(1, 1.25 * dpr);
        this.context.stroke();
      }

      const charge = Math.max(
        transient.charge,
        orb.interaction.charging ? 0.72 : 0,
      );

      if (charge > 0.01) {
        this.context.beginPath();
        this.context.arc(
          x,
          y,
          radius * (1.07 + charge * 0.05),
          0,
          Math.PI * 2,
        );
        this.context.strokeStyle = renderColorCss(
          withAlpha(color, 0.24 + charge * 0.35),
        );
        this.context.lineWidth = Math.max(1, dpr * 1.4);
        this.context.stroke();
      }

      this.context.restore();
    }
  }

  private drawLiftShadow(
    orb: RenderOrb,
    x: number,
    y: number,
    radius: number,
    dpr: number,
    charge: number,
  ): void {
    const lift = orb.interaction.hoverStrength * 0.35
      + (orb.interaction.grabbed ? 0.75 : 0)
      + Math.min(0.45, charge);

    if (lift <= 0.01) {
      return;
    }

    this.context.save();
    this.context.beginPath();
    this.context.ellipse(
      x,
      y + radius * (0.16 + lift * 0.08),
      radius * (0.62 + lift * 0.08),
      radius * (0.22 + lift * 0.03),
      0,
      0,
      Math.PI * 2,
    );
    this.context.fillStyle = 'rgba(0, 0, 0, '
      + Math.min(0.28, 0.08 + lift * 0.14).toFixed(3)
      + ')';
    this.context.shadowBlur = Math.max(0, 8 * dpr * lift);
    this.context.shadowColor = 'rgba(0, 0, 0, 0.26)';
    this.context.fill();
    this.context.restore();
  }

  private drawAura(
    x: number,
    y: number,
    radius: number,
    color: RenderColor,
    muted: boolean,
    energy: number,
  ): void {
    const gradient = this.context.createRadialGradient(
      x,
      y,
      radius * 0.52,
      x,
      y,
      radius * 1.42,
    );
    gradient.addColorStop(
      0,
      renderColorCss(
        withAlpha(
          color,
          muted ? 0.025 : 0.055 + energy * 0.045,
        ),
      ),
    );
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.context.fillStyle = gradient;
    this.context.beginPath();
    this.context.arc(
      x,
      y,
      radius * 1.44,
      0,
      Math.PI * 2,
    );
    this.context.fill();
  }

  private drawBody(
    orb: RenderOrb,
    x: number,
    y: number,
    radius: number,
    color: RenderColor,
    pulse: number,
    time: number,
    settle: number,
  ): void {
    const points = orb.role === 'percussion' ? 18 : 34;
    this.context.save();

    const direction = orb.interaction.dragVelocity;
    const angle = Math.atan2(direction.y, direction.x);
    const dragSpeed = preferencesScale(
      orb.interaction.dragSpeed,
      this.context,
    );
    const interactionScale = 1
      + orb.interaction.hoverStrength * 0.025
      + (orb.interaction.grabbed ? 0.055 : 0)
      + Math.abs(settle) * 0.045;

    this.context.translate(x, y);
    this.context.rotate(angle);
    this.context.scale(
      interactionScale * (1 + dragSpeed * 0.16),
      interactionScale * (1 - dragSpeed * 0.07),
    );
    this.context.rotate(-angle);
    this.context.translate(-x, -y);

    if (orb.role === 'beat') {
      this.context.translate(x, y);
      this.context.scale(1, 1 - pulse * 0.055);
      this.context.translate(-x, -y);
    } else if (orb.role === 'bass') {
      this.context.translate(x, y);
      this.context.scale(1 + pulse * 0.06, 1 - pulse * 0.025);
      this.context.translate(-x, -y);
    } else if (orb.role === 'melody') {
      this.context.translate(x, y);
      this.context.scale(1 + pulse * 0.035, 1 - pulse * 0.03);
      this.context.translate(-x, -y);
    }

    this.context.beginPath();

    for (let index = 0; index <= points; index += 1) {
      const angle = index / points * Math.PI * 2;
      const boundary = roleBoundary(
        orb.role,
        angle,
        time,
        orb.material.seed,
        pulse,
      ) + fieldBoundaryDelta(
        orb.material.fieldInfluence,
        angle,
        time,
      );
      const px = x + Math.cos(angle) * radius * boundary;
      const py = y + Math.sin(angle) * radius * boundary;

      if (index === 0) {
        this.context.moveTo(px, py);
      } else {
        this.context.lineTo(px, py);
      }
    }

    this.context.closePath();
    const bodyGradient = this.context.createRadialGradient(
      x - radius * 0.2,
      y - radius * 0.25,
      radius * 0.08,
      x,
      y,
      radius,
    );
    const alpha = orb.muted ? 0.3 : 0.94;
    bodyGradient.addColorStop(
      0,
      renderColorCss(withAlpha(color, alpha)),
    );
    bodyGradient.addColorStop(
      0.58,
      renderColorCss(
        withAlpha(
          [
            color[0] * 0.82,
            color[1] * 0.82,
            color[2] * 0.82,
            1,
          ],
          alpha,
        ),
      ),
    );
    bodyGradient.addColorStop(
      1,
      renderColorCss(
        withAlpha(
          [
            color[0] * 0.42,
            color[1] * 0.42,
            color[2] * 0.42,
            1,
          ],
          alpha,
        ),
      ),
    );

    this.context.fillStyle = bodyGradient;
    this.context.fill();

    if (orb.muted) {
      this.context.fillStyle = 'rgba(16, 18, 24, 0.52)';
      this.context.fill();
    }

    this.context.restore();
  }

  private drawFieldInfluence(
    orb: RenderOrb,
    x: number,
    y: number,
    radius: number,
    color: RenderColor,
    time: number,
    dpr: number,
  ): void {
    const effects = orb.material.fieldInfluence;
    const context = this.context;

    if (effects.space > 0.01) {
      context.save();
      context.beginPath();
      context.arc(
        x,
        y,
        radius * (1.08 + effects.space * 0.08),
        0,
        Math.PI * 2,
      );
      context.strokeStyle = 'rgba(138, 118, 255, '
        + (effects.space * 0.18).toFixed(3)
        + ')';
      context.lineWidth = Math.max(1, dpr);
      context.stroke();
      context.restore();
    }

    if (effects.echo > 0.01) {
      context.save();
      context.strokeStyle = 'rgba(93, 226, 255, '
        + (effects.echo * 0.24).toFixed(3)
        + ')';
      context.lineWidth = Math.max(0.8, dpr);
      for (const scale of [1.1, 1.25]) {
        context.beginPath();
        context.arc(
          x,
          y,
          radius * scale,
          0,
          Math.PI * 2,
        );
        context.stroke();
      }
      context.restore();
    }

    if (effects.heat > 0.01) {
      context.save();
      context.strokeStyle = 'rgba(255, 104, 46, '
        + (effects.heat * 0.24).toFixed(3)
        + ')';
      context.lineWidth = Math.max(1, dpr);
      context.beginPath();
      for (let index = 0; index <= 14; index += 1) {
        const normalized = index / 14 * 2 - 1;
        const px = x + normalized * radius * 0.72;
        const py = y
          + Math.sin(
            normalized * 4.5 + time * 1.6,
          ) * radius * 0.16 * effects.heat;
        if (index === 0) {
          context.moveTo(px, py);
        } else {
          context.lineTo(px, py);
        }
      }
      context.stroke();
      context.restore();
    }

    if (effects.frost > 0.01) {
      context.save();
      context.strokeStyle = 'rgba(211, 242, 255, '
        + (effects.frost * 0.28).toFixed(3)
        + ')';
      context.lineWidth = Math.max(0.7, dpr * 0.8);
      for (let index = 0; index < 6; index += 1) {
        const angle = index / 6 * Math.PI * 2
          + orb.material.seed * 2;
        context.beginPath();
        context.moveTo(
          x + Math.cos(angle) * radius * 0.18,
          y + Math.sin(angle) * radius * 0.18,
        );
        context.lineTo(
          x + Math.cos(angle) * radius * 0.74,
          y + Math.sin(angle) * radius * 0.74,
        );
        context.stroke();
      }
      context.restore();
    }

    if (effects.filter > 0.01) {
      context.save();
      context.beginPath();
      context.arc(x, y, radius * 0.86, 0, Math.PI * 2);
      context.clip();
      const gradient = context.createLinearGradient(
        x - radius,
        y,
        x + radius,
        y,
      );
      gradient.addColorStop(
        0,
        'rgba(6, 34, 30, '
          + (effects.filter * 0.18).toFixed(3)
          + ')',
      );
      gradient.addColorStop(
        1,
        renderColorCss(
          withAlpha(
            color,
            effects.filter * 0.08,
          ),
        ),
      );
      context.fillStyle = gradient;
      context.fillRect(
        x - radius,
        y - radius,
        radius * 2,
        radius * 2,
      );
      context.restore();
    }
  }

  private drawInternalMaterial(
    orb: RenderOrb,
    x: number,
    y: number,
    radius: number,
    color: RenderColor,
    time: number,
    detail: number,
  ): void {
    this.context.save();
    this.context.globalAlpha = orb.muted
      ? 0.12
      : 0.18 + detail * 0.18;
    this.context.strokeStyle = 'rgba(240, 244, 255, 0.72)';
    this.context.fillStyle = renderColorCss(
      withAlpha(color, 0.3),
    );
    this.context.lineWidth = Math.max(0.8, radius * 0.018);

    switch (orb.role) {
      case 'beat': {
        for (let index = 0; index < 4; index += 1) {
          const angle = index / 4 * Math.PI * 2
            + orb.material.variation * 0.4;
          this.context.beginPath();
          this.context.moveTo(
            x + Math.cos(angle) * radius * 0.22,
            y + Math.sin(angle) * radius * 0.22,
          );
          this.context.lineTo(
            x + Math.cos(angle) * radius * 0.62,
            y + Math.sin(angle) * radius * 0.62,
          );
          this.context.stroke();
        }
        break;
      }
      case 'percussion': {
        const count = Math.max(
          4,
          Math.round(5 + orb.material.density * 8 * detail),
        );
        for (let index = 0; index < count; index += 1) {
          const angle = (
            index / count * Math.PI * 2
            + orb.material.seed * 2.4
          );
          const distance = radius * (
            0.18 + ((index * 37) % 7) / 10
          );
          this.context.beginPath();
          this.context.arc(
            x + Math.cos(angle) * distance,
            y + Math.sin(angle) * distance,
            Math.max(0.8, radius * 0.035),
            0,
            Math.PI * 2,
          );
          this.context.fill();
        }
        break;
      }
      case 'bass': {
        for (let index = 0; index < 3; index += 1) {
          this.context.beginPath();
          this.context.arc(
            x,
            y,
            radius * (0.28 + index * 0.18)
              * (1 + Math.sin(time * 0.8 + index) * 0.025),
            0,
            Math.PI * 2,
          );
          this.context.stroke();
        }
        break;
      }
      case 'harmony': {
        for (let index = 0; index < 3; index += 1) {
          const angle = time * 0.12 + index * Math.PI * 2 / 3;
          this.context.beginPath();
          this.context.ellipse(
            x + Math.cos(angle) * radius * 0.08,
            y + Math.sin(angle) * radius * 0.08,
            radius * (0.48 + orb.material.spread * 0.08),
            radius * 0.28,
            angle,
            0,
            Math.PI * 2,
          );
          this.context.stroke();
        }
        break;
      }
      case 'melody': {
        this.context.beginPath();
        for (let index = 0; index <= 18; index += 1) {
          const px = x - radius * 0.62 + index / 18 * radius * 1.24;
          const normalizedX = index / 18 * 2 - 1;
          const py = y
            + Math.sin(
              normalizedX * 4.2
              + orb.material.contour * 2
              + time * 0.5,
            ) * radius * 0.16;
          if (index === 0) {
            this.context.moveTo(px, py);
          } else {
            this.context.lineTo(px, py);
          }
        }
        this.context.stroke();
        break;
      }
      case 'texture': {
        const count = Math.max(3, Math.round(4 + detail * 3));
        for (let index = 0; index < count; index += 1) {
          const angle = orb.material.seed * 5
            + index * Math.PI * 2 / count
            + time * 0.06;
          this.context.beginPath();
          this.context.arc(
            x + Math.cos(angle) * radius * 0.22,
            y + Math.sin(angle) * radius * 0.2,
            radius * (0.22 + (index % 3) * 0.05),
            0,
            Math.PI * 2,
          );
          this.context.fill();
        }
        break;
      }
      case 'voice': {
        for (let ribbon = 0; ribbon < 2; ribbon += 1) {
          this.context.beginPath();
          for (let index = 0; index <= 18; index += 1) {
            const normalizedX = index / 18 * 2 - 1;
            const px = x + normalizedX * radius * 0.62;
            const py = y
              + Math.sin(
                normalizedX * (3.4 + ribbon * 0.8)
                + time * (0.34 + ribbon * 0.12)
                + ribbon * 1.7,
              ) * radius * (0.15 + ribbon * 0.08);
            if (index === 0) {
              this.context.moveTo(px, py);
            } else {
              this.context.lineTo(px, py);
            }
          }
          this.context.stroke();
        }
        break;
      }
    }

    this.context.restore();
  }

  private drawPatternFingerprint(
    orb: RenderOrb,
    x: number,
    y: number,
    radius: number,
    detail: number,
  ): void {
    this.context.save();
    this.context.globalAlpha = orb.muted
      ? 0.16
      : 0.38 * detail;
    this.context.fillStyle = 'rgba(245, 247, 255, 0.92)';

    for (
      let index = 0;
      index < orb.material.pattern.length;
      index += 1
    ) {
      const value = orb.material.pattern[index];

      if (value === undefined || value < 0) {
        continue;
      }

      const angle = index / 16 * Math.PI * 2 - Math.PI / 2;
      const distance = orb.role === 'beat'
        || orb.role === 'percussion'
        ? radius * 0.72
        : radius * (0.28 + value * 0.47);
      const size = Math.max(
        0.8,
        radius * (
          orb.role === 'percussion' ? 0.025 : 0.034
        ),
      );

      this.context.beginPath();
      this.context.arc(
        x + Math.cos(angle) * distance,
        y + Math.sin(angle) * distance,
        size,
        0,
        Math.PI * 2,
      );
      this.context.fill();
    }

    this.context.restore();
  }

  private drawMelodySatellites(
    orb: RenderOrb,
    x: number,
    y: number,
    radius: number,
    color: RenderColor,
    time: number,
  ): void {
    const orbit = preferencesSafeTime(time);
    const locations = [
      [0.98, -0.28, 0.075],
      [-0.88, 0.44, 0.06],
    ] as const;

    this.context.save();
    this.context.globalAlpha = orb.muted ? 0.18 : 0.7;

    for (let index = 0; index < locations.length; index += 1) {
      const [baseX, baseY, size] = locations[index]!;
      const angle = orbit * (0.11 + index * 0.04)
        + orb.material.seed * 3;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const px = x + (
        baseX * cos - baseY * sin
      ) * radius;
      const py = y + (
        baseX * sin + baseY * cos
      ) * radius;

      this.context.beginPath();
      this.context.arc(
        px,
        py,
        Math.max(1, radius * size),
        0,
        Math.PI * 2,
      );
      this.context.fillStyle = renderColorCss(
        withAlpha(color, 0.9),
      );
      this.context.fill();
    }

    this.context.restore();
  }
}

function preferencesSafeTime(time: number): number {
  return Number.isFinite(time) ? time : 0;
}


function preferencesScale(
  speed: number,
  context: CanvasRenderingContext2D,
): number {
  void context;
  return Math.max(0, Math.min(1, speed));
}
