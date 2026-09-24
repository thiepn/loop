import { describe, expect, it } from 'vitest';
import {
  clampRenderDevicePixelRatio,
  renderPolicyForPreferences,
  motionRenderIntervalMs,
  rendererDevicePixelRatio,
  selectRendererKind,
} from '../src/core/visual/v2/RendererPolicy';
import { VisualEventBridge } from '../src/core/visual/v2/VisualEventBridge';
import { isLikelySoftwareRendererName } from '../src/core/visual/v2/createWorldRenderer';

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

  it('rejects known software WebGL renderer names', () => {
    expect(isLikelySoftwareRendererName('Google SwiftShader')).toBe(true);
    expect(isLikelySoftwareRendererName('llvmpipe (LLVM 18)')).toBe(true);
    expect(isLikelySoftwareRendererName('ANGLE (NVIDIA RTX 4070)')).toBe(false);
  });

  it('reduces Canvas2D backing resolution without changing WebGL DPR policy', () => {
    const preferences = {
      quality: 'balanced' as const,
      reduceMotion: false,
      reduceParticles: false,
      reduceBloom: false,
    };

    expect(rendererDevicePixelRatio('webgl2', 2, preferences)).toBe(1.5);
    expect(rendererDevicePixelRatio('canvas2d', 2, preferences)).toBe(0.75);
  });

  it('throttles software-canvas Motion while leaving WebGL externally unthrottled', () => {
    expect(motionRenderIntervalMs('webgl2', 'battery')).toBe(0);
    expect(motionRenderIntervalMs('canvas2d', 'high')).toBeCloseTo(16.67, 1);
    expect(motionRenderIntervalMs('canvas2d', 'balanced')).toBe(25);
    expect(motionRenderIntervalMs('canvas2d', 'battery')).toBeCloseTo(33.33, 1);
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
  it('coalesces pointer disturbances instead of accumulating pointer history', () => {
    const bridge = new VisualEventBridge();

    bridge.emit({
      kind: 'pointer-disturbance',
      position: { x: 0.2, y: 0.3 },
      delta: { x: 0.02, y: 0.01 },
      intensity: 0.4,
    }, 100);

    bridge.emit({
      kind: 'pointer-disturbance',
      position: { x: 0.7, y: 0.6 },
      delta: { x: 0.03, y: -0.01 },
      intensity: 0.8,
    }, 120);

    const snapshot = bridge.sample(120);
    expect(snapshot.samples).toHaveLength(1);
    expect(snapshot.samples[0]?.event.kind).toBe('pointer-disturbance');

    const event = snapshot.samples[0]?.event;
    if (event?.kind !== 'pointer-disturbance') {
      throw new Error('Expected pointer disturbance.');
    }

    expect(event.position).toEqual({ x: 0.7, y: 0.6 });
    expect(event.intensity).toBe(0.8);
  });

  it('coalesces repeated drop/charge events per Orb', () => {
    const bridge = new VisualEventBridge();

    bridge.emit({
      kind: 'orb-drop',
      orbId: 'orb',
      position: { x: 0.4, y: 0.5 },
      velocity: { x: 1, y: 0 },
      intensity: 0.4,
    }, 100);
    bridge.emit({
      kind: 'orb-drop',
      orbId: 'orb',
      position: { x: 0.6, y: 0.5 },
      velocity: { x: -1, y: 0 },
      intensity: 0.8,
    }, 120);
    bridge.emit({
      kind: 'orb-charge',
      orbId: 'orb',
      position: { x: 0.6, y: 0.5 },
      intensity: 0.5,
    }, 120);
    bridge.emit({
      kind: 'orb-charge',
      orbId: 'orb',
      position: { x: 0.6, y: 0.5 },
      intensity: 1,
    }, 140);

    const snapshot = bridge.sample(140);
    const drops = snapshot.samples.filter(
      (sample) => sample.event.kind === 'orb-drop',
    );
    const charges = snapshot.samples.filter(
      (sample) => sample.event.kind === 'orb-charge',
    );

    expect(drops).toHaveLength(1);
    expect(charges).toHaveLength(1);
    expect(drops[0]?.event.kind).toBe('orb-drop');
    if (drops[0]?.event.kind === 'orb-drop') {
      expect(drops[0].event.intensity).toBe(0.8);
    }
    expect(charges[0]?.event.kind).toBe('orb-charge');
    if (charges[0]?.event.kind === 'orb-charge') {
      expect(charges[0].event.intensity).toBe(1);
    }
  });

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
