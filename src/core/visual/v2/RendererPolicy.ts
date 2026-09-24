import type { VisualPreferences, VisualQuality } from '../VisualQuality';
import type { RendererKind } from './RenderTypes';

export interface RendererSupport {
  readonly webgl2: boolean;
  readonly canvas2d: boolean;
}

export interface RenderQualityPolicy {
  readonly dprCap: number;
  readonly fieldDetail: number;
  readonly orbDetail: number;
  readonly trailDetail: number;
  readonly particleScale: number;
  readonly bloomScale: number;
  readonly lightSourceCap: number;
  readonly lightScale: number;
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
        orbDetail: 1,
        trailDetail: 1,
        particleScale: 1,
        bloomScale: 1,
        lightSourceCap: 8,
        lightScale: 1,
      };
    case 'balanced':
      return {
        dprCap: 1.5,
        fieldDetail: 0.72,
        orbDetail: 0.72,
        trailDetail: 0.72,
        particleScale: 0.62,
        bloomScale: 0.72,
        lightSourceCap: 6,
        lightScale: 0.72,
      };
    case 'battery':
      return {
        dprCap: 1,
        fieldDetail: 0.42,
        orbDetail: 0.38,
        trailDetail: 0.34,
        particleScale: 0.24,
        bloomScale: 0.3,
        lightSourceCap: 4,
        lightScale: 0.42,
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
    lightScale: preferences.reduceBloom
      ? Math.min(0.32, base.lightScale)
      : base.lightScale,
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


export function motionRenderIntervalMs(
  renderer: RendererKind,
  quality: VisualQuality,
): number {
  if (renderer !== 'canvas2d') {
    return 0;
  }

  switch (quality) {
    case 'high':
      return 1000 / 60;
    case 'balanced':
      return 1000 / 40;
    case 'battery':
      return 1000 / 30;
  }
}


export function rendererDevicePixelRatio(
  renderer: RendererKind,
  devicePixelRatio: number,
  preferences: VisualPreferences,
): number {
  const base = clampRenderDevicePixelRatio(
    devicePixelRatio,
    preferences,
  );

  if (renderer !== 'canvas2d') {
    return base;
  }

  switch (preferences.quality) {
    case 'high':
      return Math.min(base, 1);
    case 'balanced':
      return Math.min(base, 0.75);
    case 'battery':
      return Math.min(base, 0.5);
  }
}
