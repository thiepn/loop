import type { EffectFieldType } from '../../world/EffectField';
import type { LinkType } from '../../world/Link';
import type { PlaygroundToyType } from '../../world/PlaygroundToy';
import type { SoundRole } from '../../sounds/SoundDefinition';

export type RenderColor = readonly [
  red: number,
  green: number,
  blue: number,
  alpha: number,
];

export const ROLE_RENDER_COLORS: Record<SoundRole, RenderColor> = {
  beat: [0.984, 0.443, 0.522, 1],
  percussion: [0.984, 0.749, 0.141, 1],
  bass: [0.133, 0.827, 0.933, 1],
  harmony: [0.655, 0.545, 0.98, 1],
  melody: [0.204, 0.827, 0.6, 1],
  texture: [0.376, 0.647, 0.98, 1],
  voice: [0.957, 0.447, 0.714, 1],
};

export const FIELD_RENDER_COLORS: Record<EffectFieldType, RenderColor> = {
  space: [0.49, 0.35, 0.96, 0.16],
  echo: [0.13, 0.83, 0.93, 0.13],
  heat: [0.98, 0.36, 0.28, 0.15],
  frost: [0.58, 0.82, 1, 0.14],
  filter: [0.2, 0.83, 0.6, 0.13],
};

export const TOY_RENDER_COLORS: Record<PlaygroundToyType, RenderColor> = {
  spinner: [0.655, 0.545, 0.98, 0.72],
  magnet: [0.204, 0.827, 0.6, 0.72],
  repulsor: [0.984, 0.443, 0.522, 0.72],
  portal: [0.133, 0.827, 0.933, 0.78],
};

export const LINK_RENDER_COLORS: Record<LinkType, RenderColor> = {
  'pulse-together': [0.655, 0.545, 0.98, 0.58],
  'take-turns': [0.984, 0.749, 0.141, 0.54],
  follow: [0.204, 0.827, 0.6, 0.54],
  'kick-pushes-bass': [0.984, 0.443, 0.522, 0.58],
  'copy-movement': [0.133, 0.827, 0.933, 0.54],
};

export const LISTENER_RENDER_COLOR: RenderColor = [
  0.77,
  0.71,
  0.99,
  0.92,
];

export function withAlpha(
  color: RenderColor,
  alpha: number,
): RenderColor {
  return [
    color[0],
    color[1],
    color[2],
    Math.max(0, Math.min(1, alpha)),
  ];
}

export function renderColorCss(color: RenderColor): string {
  return 'rgba('
    + Math.round(color[0] * 255)
    + ', '
    + Math.round(color[1] * 255)
    + ', '
    + Math.round(color[2] * 255)
    + ', '
    + color[3].toFixed(3)
    + ')';
}


export function mixRenderColor(
  a: RenderColor,
  b: RenderColor,
  amount: number,
): RenderColor {
  const t = Math.max(0, Math.min(1, amount));

  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
    a[3] + (b[3] - a[3]) * t,
  ];
}

export function fieldInfluencedColor(
  base: RenderColor,
  effects: Readonly<import('../../world/EffectField').EffectAmounts>,
): RenderColor {
  let result = base;
  result = mixRenderColor(
    result,
    [0.49, 0.35, 0.96, result[3]],
    effects.space * 0.18,
  );
  result = mixRenderColor(
    result,
    [0.13, 0.83, 0.93, result[3]],
    effects.echo * 0.14,
  );
  result = mixRenderColor(
    result,
    [0.98, 0.36, 0.28, result[3]],
    effects.heat * 0.28,
  );
  result = mixRenderColor(
    result,
    [0.68, 0.88, 1, result[3]],
    effects.frost * 0.34,
  );
  result = mixRenderColor(
    result,
    [0.2, 0.83, 0.6, result[3]],
    effects.filter * 0.26,
  );

  return result;
}
