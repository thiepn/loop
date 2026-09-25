import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  applySystemVisualPreferences,
  chooseAutomaticVisualQuality,
  initialVisualPreferences,
  loadVisualPreferences,
  profileForVisualPreferences,
  saveVisualPreferences,
} from '../src/core/visual/VisualQuality';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('VisualQuality', () => {
  it('chooses High for strong hardware', () => {
    expect(
      chooseAutomaticVisualQuality({
        hardwareConcurrency: 12,
        deviceMemoryGb: 16,
        saveData: false,
      }),
    ).toBe('high');
  });

  it('chooses Battery Saver for constrained hardware or data saver', () => {
    expect(
      chooseAutomaticVisualQuality({
        hardwareConcurrency: 4,
        deviceMemoryGb: 8,
      }),
    ).toBe('battery');

    expect(
      chooseAutomaticVisualQuality({
        hardwareConcurrency: 12,
        deviceMemoryGb: 16,
        saveData: true,
      }),
    ).toBe('battery');
  });

  it('defaults uncertain hardware to Balanced', () => {
    expect(
      chooseAutomaticVisualQuality({
        hardwareConcurrency: 6,
        deviceMemoryGb: 6,
      }),
    ).toBe('balanced');
  });

  it('respects system reduced-motion when creating initial preferences', () => {
    expect(
      initialVisualPreferences({
        hardwareConcurrency: 8,
        deviceMemoryGb: 8,
        prefersReducedMotion: true,
      }),
    ).toEqual({
      quality: 'high',
      reduceMotion: true,
      reduceParticles: true,
      reduceBloom: false,
    });
  });

  it('treats system reduced motion as a live effective floor without changing stored intent', () => {
    const intent = {
      quality: 'high' as const,
      reduceMotion: false,
      reduceParticles: false,
      reduceBloom: true,
    };

    const reduced = applySystemVisualPreferences(intent, true);
    const restored = applySystemVisualPreferences(intent, false);

    expect(reduced).toEqual({
      ...intent,
      reduceMotion: true,
    });
    expect(reduced.reduceParticles).toBe(false);
    expect(restored).toBe(intent);
  });

  it('scales visual density without changing semantic feature availability', () => {
    const high = profileForVisualPreferences({
      quality: 'high',
      reduceMotion: false,
      reduceParticles: false,
      reduceBloom: false,
    });
    const balanced = profileForVisualPreferences({
      quality: 'balanced',
      reduceMotion: false,
      reduceParticles: false,
      reduceBloom: false,
    });
    const battery = profileForVisualPreferences({
      quality: 'battery',
      reduceMotion: false,
      reduceParticles: false,
      reduceBloom: false,
    });

    expect(high.ambientParticleCount).toBeGreaterThan(
      balanced.ambientParticleCount,
    );
    expect(balanced.ambientParticleCount).toBeGreaterThan(
      battery.ambientParticleCount,
    );
    expect(high.trailPointLimit).toBeGreaterThan(
      battery.trailPointLimit,
    );
    expect(high.bloomScale).toBeGreaterThan(
      battery.bloomScale,
    );
  });

  it('combines reduce-motion, particles, and bloom rather than overriding them', () => {
    const profile = profileForVisualPreferences({
      quality: 'high',
      reduceMotion: true,
      reduceParticles: true,
      reduceBloom: true,
    });

    expect(profile.animateAmbient).toBe(false);
    expect(profile.animateTrails).toBe(false);
    expect(profile.trailPointLimit).toBe(0);
    expect(profile.ambientParticleCount).toBe(0);
    expect(profile.burstParticleCount).toBe(0);
    expect(profile.bloomScale).toBeLessThanOrEqual(0.3);
  });

  it('round-trips explicit user preferences through local storage', () => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    });

    const preferences = {
      quality: 'battery' as const,
      reduceMotion: true,
      reduceParticles: false,
      reduceBloom: true,
    };

    saveVisualPreferences(preferences);

    expect(loadVisualPreferences()).toEqual(preferences);
  });

  it('falls back safely when stored visual preferences are malformed', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => '{bad json',
      setItem: () => undefined,
    });

    const preferences = loadVisualPreferences();

    expect(['high', 'balanced', 'battery']).toContain(
      preferences.quality,
    );
    expect(typeof preferences.reduceMotion).toBe('boolean');
  });

  it('keeps reduced motion readable instead of disabling all visual feedback', () => {
    const profile = profileForVisualPreferences({
      quality: 'balanced',
      reduceMotion: true,
      reduceParticles: false,
      reduceBloom: false,
    });

    expect(profile.trailPointLimit).toBe(0);
    expect(profile.animateAmbient).toBe(false);
    expect(profile.burstParticleCount).toBe(1);
  });
});
