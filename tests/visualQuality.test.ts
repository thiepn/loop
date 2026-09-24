import { describe, expect, it } from 'vitest';
import {
  chooseAutomaticVisualQuality,
  initialVisualPreferences,
  profileForVisualPreferences,
} from '../src/core/visual/VisualQuality';

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
