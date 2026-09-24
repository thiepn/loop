import type { VisualPreferences } from '../VisualQuality';
import type { EffectFieldType } from '../../world/EffectField';
import {
  FIELD_RENDER_COLORS,
  renderColorCss,
  withAlpha,
  type RenderColor,
} from './RenderPalette';
import { renderPolicyForPreferences } from './RendererPolicy';
import type {
  RenderField,
  RenderFieldIntersection,
} from './RenderTypes';

function boundaryScale(
  field: RenderField,
  angle: number,
  timestampMs: number,
  preferences: Readonly<VisualPreferences>,
): number {
  const motion = preferences.reduceMotion ? 0 : 1;
  const time = timestampMs * 0.001 * motion;
  const seed = field.material.seed;

  return 0.985
    + (
      Math.sin(
        angle * (3 + Math.floor(seed * 4))
        + time * 0.37
        + seed * 7,
      ) * 0.62
      + Math.sin(
        angle * (7 + Math.floor(seed * 5))
        - time * 0.23
        + seed * 13,
      ) * 0.38
    ) * field.material.edgeRoughness * motion
    + field.interaction.tension * 0.024;
}

function colorForType(
  type: EffectFieldType,
): RenderColor {
  return FIELD_RENDER_COLORS[type];
}

export class CanvasFieldMaterialLayer {
  public constructor(
    private readonly context: CanvasRenderingContext2D,
  ) {}

  public render(
    fields: readonly RenderField[],
    intersections: readonly RenderFieldIntersection[],
    preferences: Readonly<VisualPreferences>,
    timestampMs: number,
    width: number,
    height: number,
    dpr: number,
  ): void {
    if (fields.length === 0) {
      return;
    }

    const policy = renderPolicyForPreferences(preferences);

    for (const field of fields) {
      this.drawField(
        field,
        preferences,
        timestampMs,
        width,
        height,
        dpr,
        policy.fieldDetail,
      );
    }

    for (const intersection of intersections) {
      this.drawIntersection(
        intersection,
        timestampMs,
        width,
        height,
      );
    }
  }

  private drawField(
    field: RenderField,
    preferences: Readonly<VisualPreferences>,
    timestampMs: number,
    width: number,
    height: number,
    dpr: number,
    detail: number,
  ): void {
    const context = this.context;
    const color = colorForType(field.type);
    const centerX = field.position.x * width;
    const centerY = field.position.y * height;
    const radiusX = field.radius * width;
    const radiusY = field.radius * height;
    const points = detail > 0.8 ? 52 : detail > 0.45 ? 38 : 26;

    context.save();
    context.beginPath();

    for (let index = 0; index <= points; index += 1) {
      const angle = index / points * Math.PI * 2;
      const scale = boundaryScale(
        field,
        angle,
        timestampMs,
        preferences,
      );
      const x = centerX + Math.cos(angle) * radiusX * scale;
      const y = centerY + Math.sin(angle) * radiusY * scale;

      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }

    context.closePath();
    context.clip();

    const fill = context.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      Math.max(radiusX, radiusY),
    );
    fill.addColorStop(
      0,
      renderColorCss(withAlpha(color, color[3] * 0.72)),
    );
    fill.addColorStop(
      0.72,
      renderColorCss(withAlpha(color, color[3] * 0.42)),
    );
    fill.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = fill;
    context.fillRect(
      centerX - radiusX,
      centerY - radiusY,
      radiusX * 2,
      radiusY * 2,
    );

    this.drawMaterial(
      field,
      preferences,
      timestampMs,
      centerX,
      centerY,
      radiusX,
      radiusY,
      dpr,
      detail,
    );

    context.restore();

    context.save();
    context.beginPath();
    context.ellipse(
      centerX,
      centerY,
      radiusX * 0.985,
      radiusY * 0.985,
      0,
      0,
      Math.PI * 2,
    );
    context.strokeStyle = renderColorCss(
      withAlpha(
        color,
        field.selected
          ? 0.48
          : 0.12 + field.interaction.tension * 0.16,
      ),
    );
    context.lineWidth = Math.max(
      0.8,
      (field.selected ? 1.6 : 1) * dpr,
    );
    context.stroke();

    if (field.interaction.resizing || field.interaction.dragging) {
      context.beginPath();
      context.ellipse(
        centerX,
        centerY,
        radiusX * (1.025 + field.interaction.tension * 0.065),
        radiusY * (1.025 + field.interaction.tension * 0.065),
        0,
        0,
        Math.PI * 2,
      );
      context.strokeStyle = renderColorCss(
        withAlpha(
          color,
          0.08 + field.interaction.tension * 0.16,
        ),
      );
      context.lineWidth = Math.max(1, dpr);
      context.stroke();
    }

    context.restore();
  }

  private drawMaterial(
    field: RenderField,
    preferences: Readonly<VisualPreferences>,
    timestampMs: number,
    centerX: number,
    centerY: number,
    radiusX: number,
    radiusY: number,
    dpr: number,
    detail: number,
  ): void {
    const context = this.context;
    const color = colorForType(field.type);
    const motion = preferences.reduceMotion ? 0 : 1;
    const time = timestampMs * 0.001 * motion;

    switch (field.type) {
      case 'space': {
        const clouds = Math.max(2, Math.round(2 + detail * 4));
        for (let index = 0; index < clouds; index += 1) {
          const angle = (
            index / clouds * Math.PI * 2
            + field.material.seed * 4
            + time * 0.04
          );
          const x = centerX + Math.cos(angle) * radiusX * 0.28;
          const y = centerY + Math.sin(angle) * radiusY * 0.22;
          const gradient = context.createRadialGradient(
            x,
            y,
            0,
            x,
            y,
            Math.max(radiusX, radiusY) * 0.42,
          );
          gradient.addColorStop(
            0,
            'rgba(100, 126, 255, 0.08)',
          );
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          context.fillStyle = gradient;
          context.fillRect(
            centerX - radiusX,
            centerY - radiusY,
            radiusX * 2,
            radiusY * 2,
          );
        }

        if (!preferences.reduceParticles) {
          const stars = Math.max(3, Math.round(5 + detail * 6));
          for (let index = 0; index < stars; index += 1) {
            const angle = (
              index * 2.399963
              + field.material.seed * 8
            );
            const radial = 0.18 + ((index * 37) % 9) / 12;
            context.beginPath();
            context.arc(
              centerX + Math.cos(angle) * radiusX * radial,
              centerY + Math.sin(angle) * radiusY * radial,
              Math.max(0.6, dpr * (0.75 + (index % 3) * 0.25)),
              0,
              Math.PI * 2,
            );
            context.fillStyle = 'rgba(205, 220, 255, 0.45)';
            context.fill();
          }
        }
        break;
      }

      case 'echo': {
        context.strokeStyle = 'rgba(112, 230, 255, 0.18)';
        context.lineWidth = Math.max(0.8, dpr);
        const count = Math.max(3, Math.round(3 + detail * 4));
        for (let index = 0; index < count; index += 1) {
          const phase = preferences.reduceMotion
            ? 0
            : (time * 0.35 + index / count) % 1;
          const scale = 0.18 + (
            index / count * 0.72
            + phase * 0.12
          ) % 0.78;
          context.beginPath();
          context.ellipse(
            centerX,
            centerY,
            radiusX * scale,
            radiusY * scale,
            0,
            0,
            Math.PI * 2,
          );
          context.stroke();
        }
        break;
      }

      case 'heat': {
        const lines = Math.max(4, Math.round(5 + detail * 5));
        context.strokeStyle = 'rgba(255, 104, 50, 0.15)';
        context.lineWidth = Math.max(1, dpr * 1.2);
        for (let line = 0; line < lines; line += 1) {
          context.beginPath();
          for (let step = 0; step <= 14; step += 1) {
            const t = step / 14;
            const x = centerX - radiusX
              + t * radiusX * 2;
            const baseY = centerY - radiusY
              + (line + 1) / (lines + 1) * radiusY * 2;
            const y = baseY
              + Math.sin(
                t * Math.PI * 3
                + time * 1.5
                + line * 0.8,
              ) * radiusY * 0.035;
            if (step === 0) {
              context.moveTo(x, y);
            } else {
              context.lineTo(x, y);
            }
          }
          context.stroke();
        }
        break;
      }

      case 'frost': {
        const rays = Math.max(5, Math.round(6 + detail * 6));
        context.strokeStyle = 'rgba(210, 240, 255, 0.22)';
        context.lineWidth = Math.max(0.7, dpr * 0.9);
        for (let index = 0; index < rays; index += 1) {
          const angle = index / rays * Math.PI * 2
            + field.material.seed * 2;
          context.beginPath();
          context.moveTo(
            centerX + Math.cos(angle) * radiusX * 0.15,
            centerY + Math.sin(angle) * radiusY * 0.15,
          );
          context.lineTo(
            centerX + Math.cos(angle) * radiusX * 0.82,
            centerY + Math.sin(angle) * radiusY * 0.82,
          );
          context.stroke();
        }
        break;
      }

      case 'filter': {
        const gradient = context.createLinearGradient(
          centerX - radiusX,
          centerY,
          centerX + radiusX,
          centerY,
        );
        gradient.addColorStop(
          0,
          'rgba(8, 48, 42, 0.16)',
        );
        gradient.addColorStop(
          0.48,
          renderColorCss(withAlpha(color, 0.05)),
        );
        gradient.addColorStop(
          1,
          'rgba(88, 250, 195, 0.15)',
        );
        context.fillStyle = gradient;
        context.fillRect(
          centerX - radiusX,
          centerY - radiusY,
          radiusX * 2,
          radiusY * 2,
        );

        context.strokeStyle = 'rgba(106, 236, 206, 0.12)';
        context.lineWidth = Math.max(0.7, dpr);
        const bands = Math.max(3, Math.round(3 + detail * 4));
        for (let index = 1; index < bands; index += 1) {
          const offset = index / bands;
          context.beginPath();
          context.moveTo(
            centerX - radiusX,
            centerY - radiusY + offset * radiusY * 2,
          );
          context.lineTo(
            centerX + radiusX,
            centerY - radiusY + offset * radiusY * 2,
          );
          context.stroke();
        }
        break;
      }
    }
  }

  private drawIntersection(
    intersection: RenderFieldIntersection,
    timestampMs: number,
    width: number,
    height: number,
  ): void {
    const context = this.context;
    const a = colorForType(intersection.typeA);
    const b = colorForType(intersection.typeB);
    const centerX = intersection.position.x * width;
    const centerY = intersection.position.y * height;
    const radiusX = intersection.radius * width * 1.22;
    const radiusY = intersection.radius * height * 1.22;
    const pulse = 0.5 + 0.5 * Math.cos(
      timestampMs * 0.0015,
    );

    const gradient = context.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      Math.max(radiusX, radiusY),
    );

    if (intersection.simplified) {
      gradient.addColorStop(
        0,
        'rgba(194, 199, 244, '
          + (0.07 + intersection.strength * 0.06).toFixed(3)
          + ')',
      );
    } else {
      const mixed: RenderColor = [
        (a[0] + b[0]) / 2,
        (a[1] + b[1]) / 2,
        (a[2] + b[2]) / 2,
        1,
      ];
      gradient.addColorStop(
        0,
        renderColorCss(
          withAlpha(
            mixed,
            intersection.strength
              * (0.07 + pulse * 0.035),
          ),
        ),
      );
    }

    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = gradient;
    context.beginPath();
    context.ellipse(
      centerX,
      centerY,
      Math.max(1, radiusX),
      Math.max(1, radiusY),
      0,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
}
