import type { VisualPreferences, VisualQuality } from '../VisualQuality';
import type { RendererKind } from './RenderTypes';

export interface RendererSupport {
  readonly webgl2: boolean;
  readonly canvas2d: boolean;
}

export interface RenderQualityPolicy {
  readonly dprCap: number;
  readonly fieldDetail: number;
  readonly trailDetail: number;
  readonly particleScale: number;
  readonly bloomScale: number;
}

export function selectRendererKind(
  support: RendererSupport,
): RendererKind {
  if (support.webgl2) {
    return 'webgl2';
  }

  if (support.canvas2d) {
    return 'canvas2d';
  }

  return 'none';
}

function basePolicy(quality: VisualQuality): RenderQualityPolicy {
  switch (quality) {
    case 'high':
      return {
        dprCap: 2,
        fieldDetail: 1,
        trailDetail: 1,
        particleScale: 1,
        bloomScale: 1,
      };
    case 'balanced':
      return {
        dprCap: 1.5,
        fieldDetail: 0.72,
        trailDetail: 0.72,
        particleScale: 0.62,
        bloomScale: 0.72,
      };
    case 'battery':
      return {
        dprCap: 1,
        fieldDetail: 0.42,
        trailDetail: 0.34,
        particleScale: 0.24,
        bloomScale: 0.3,
      };
  }
}

export function renderPolicyForPreferences(
  preferences: VisualPreferences,
): RenderQualityPolicy {
  const base = basePolicy(preferences.quality);

  return {
    ...base,
    trailDetail: preferences.reduceMotion ? 0 : base.trailDetail,
    particleScale: preferences.reduceParticles ? 0 : base.particleScale,
    bloomScale: preferences.reduceBloom
      ? Math.min(0.2, base.bloomScale)
      : base.bloomScale,
  };
}

export function clampRenderDevicePixelRatio(
  devicePixelRatio: number,
  preferences: VisualPreferences,
): number {
  const safe = Number.isFinite(devicePixelRatio)
    ? Math.max(1, devicePixelRatio)
    : 1;

  return Math.min(
    safe,
    renderPolicyForPreferences(preferences).dprCap,
  );
}
