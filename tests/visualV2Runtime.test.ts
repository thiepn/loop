import { describe, expect, it } from 'vitest';
import {
  clampRenderDevicePixelRatio,
  renderPolicyForPreferences,
  selectRendererKind,
} from '../src/core/visual/v2/RendererPolicy';
import { VisualEventBridge } from '../src/core/visual/v2/VisualEventBridge';

describe('Visual V2 renderer policy', () => {
  it('prefers WebGL2 and falls back deterministically', () => {
    expect(selectRendererKind({
      webgl2: true,
      canvas2d: true,
    })).toBe('webgl2');

    expect(selectRendererKind({
      webgl2: false,
      canvas2d: true,
    })).toBe('canvas2d');

    expect(selectRendererKind({
      webgl2: false,
      canvas2d: false,
    })).toBe('none');
  });

  it('caps DPR by visual quality', () => {
    expect(clampRenderDevicePixelRatio(3, {
      quality: 'high',
      reduceMotion: false,
      reduceParticles: false,
      reduceBloom: false,
    })).toBe(2);

    expect(clampRenderDevicePixelRatio(3, {
      quality: 'balanced',
      reduceMotion: false,
      reduceParticles: false,
      reduceBloom: false,
    })).toBe(1.5);

    expect(clampRenderDevicePixelRatio(3, {
      quality: 'battery',
      reduceMotion: false,
      reduceParticles: false,
      reduceBloom: false,
    })).toBe(1);
  });

  it('combines reduced-effect preferences with the quality policy', () => {
    const policy = renderPolicyForPreferences({
      quality: 'high',
      reduceMotion: true,
      reduceParticles: true,
      reduceBloom: true,
    });

    expect(policy.trailDetail).toBe(0);
    expect(policy.particleScale).toBe(0);
    expect(policy.bloomScale).toBeLessThanOrEqual(0.2);
  });
});

describe('Visual V2 event bridge', () => {
  it('keeps transient events presentation-only and expires them', () => {
    const bridge = new VisualEventBridge();

    bridge.emit({
      kind: 'orb-pulse',
      orbId: 'orb',
      intensity: 0.8,
      position: { x: 0.4, y: 0.6 },
    }, 100);

    const start = bridge.sample(100);
    expect(start.samples).toHaveLength(1);
    expect(start.samples[0]?.progress).toBe(0);
    expect(start.hasActiveEvents).toBe(true);

    const middle = bridge.sample(360);
    expect(middle.samples[0]?.progress).toBeCloseTo(0.5, 1);

    const end = bridge.sample(700);
    expect(end.samples).toHaveLength(0);
    expect(end.hasActiveEvents).toBe(false);
  });
});
