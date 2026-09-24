import type { VisualPreferences } from '../VisualQuality';
import type { SoundRole } from '../../sounds/SoundDefinition';
import {
  ROLE_RENDER_COLORS,
  renderColorCss,
  withAlpha,
  type RenderColor,
} from './RenderPalette';
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

    for (const orb of orbs) {
      const diameter = orbDiameterPixels(
        orb.role,
        minDimension,
        dpr,
      );
      const radius = diameter * 0.5;
      const x = orb.position.x * width;
      const y = orb.position.y * height;
      const pulse = pulseForOrb(orb.id, events);
      const color = ROLE_RENDER_COLORS[orb.role];

      this.drawAura(
        x,
        y,
        radius,
        color,
        orb.muted,
        orb.material.energy,
      );
      this.drawBody(
        orb,
        x,
        y,
        radius,
        color,
        pulse.amount,
        time,
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
    }
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
  ): void {
    const points = orb.role === 'percussion' ? 18 : 34;
    this.context.save();

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
