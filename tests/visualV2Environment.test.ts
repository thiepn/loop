import { describe, expect, it } from 'vitest';
import {
  deriveEnvironmentDynamics,
  deriveWorldEnvironment,
  environmentParticleLayout,
  visualSeedFromWorld,
} from '../src/core/visual/v2/EnvironmentModel';
import { projectWorldToRenderScene } from '../src/core/visual/v2/SceneAdapter';
import { createSoundOrb } from '../src/core/world/SoundOrb';
import { createEmptyWorld } from '../src/core/world/World';

function worldWithRoles(
  roles: readonly ('beat' | 'bass' | 'harmony' | 'melody' | 'texture')[],
) {
  return createEmptyWorld({
    id: 'visual-world',
    music: { seed: 47 },
    soundOrbs: roles.map((role, index) => createSoundOrb({
      id: role + '-' + index,
      soundId: role + '-sound',
      role,
      position: {
        x: 0.2 + index * 0.1,
        y: 0.3 + index * 0.07,
      },
    })),
  });
}

describe('Visual V2 environment model', () => {
  it('derives deterministic palette and seed from creative World structure', () => {
    const world = worldWithRoles(['beat', 'bass', 'harmony']);
    const first = deriveWorldEnvironment(world);
    const second = deriveWorldEnvironment(world);

    expect(first).toEqual(second);
    expect(first.seed).toBe(visualSeedFromWorld('visual-world', 47));
    expect(first.primary).not.toEqual(first.secondary);
    expect(first.density).toBeCloseTo(3 / 12);
  });

  it('reduces ambient particle density as the World becomes visually dense', () => {
    const sparse = deriveWorldEnvironment(
      worldWithRoles(['melody']),
    );
    const dense = deriveWorldEnvironment(
      worldWithRoles([
        'beat',
        'bass',
        'harmony',
        'melody',
        'texture',
        'beat',
        'bass',
        'harmony',
        'melody',
        'texture',
      ]),
    );

    expect(dense.density).toBeGreaterThan(sparse.density);
    expect(dense.particleDensity).toBeLessThan(sparse.particleDensity);
  });

  it('scales deterministic particles by quality and respects Reduce Particles', () => {
    const environment = deriveWorldEnvironment(
      worldWithRoles(['beat', 'bass']),
    );
    const high = environmentParticleLayout(environment, {
      quality: 'high',
      reduceMotion: false,
      reduceParticles: false,
      reduceBloom: false,
    });
    const balanced = environmentParticleLayout(environment, {
      quality: 'balanced',
      reduceMotion: false,
      reduceParticles: false,
      reduceBloom: false,
    });
    const reduced = environmentParticleLayout(environment, {
      quality: 'high',
      reduceMotion: false,
      reduceParticles: true,
      reduceBloom: false,
    });

    expect(high.length).toBeGreaterThan(balanced.length);
    expect(reduced).toHaveLength(0);
    expect(high[0]).toEqual(
      environmentParticleLayout(environment, {
        quality: 'high',
        reduceMotion: false,
        reduceParticles: false,
        reduceBloom: false,
      })[0],
    );
  });

  it('turns scheduled Orb activity into bounded environmental energy', () => {
    const world = worldWithRoles(['bass', 'beat']);
    const scene = projectWorldToRenderScene(world, {
      selectedOrbId: null,
      selectedFieldId: null,
      selectedToyId: null,
      selectedLinkId: null,
      playing: true,
      recording: false,
    });
    const bass = scene.orbs[0]!;

    const dynamics = deriveEnvironmentDynamics(
      scene,
      [{
        event: {
          kind: 'orb-pulse',
          orbId: bass.id,
          intensity: 0.9,
          position: bass.position,
        },
        progress: 0.2,
      }],
      {
        quality: 'high',
        reduceMotion: false,
        reduceParticles: false,
        reduceBloom: false,
      },
    );

    expect(dynamics.energy).toBeGreaterThan(0);
    expect(dynamics.bassPressure).toBeGreaterThan(0);
    expect(dynamics.eventStrength).toBeGreaterThan(0);
    expect(dynamics.eventPosition).toEqual(bass.position);
    expect(dynamics.energy).toBeLessThanOrEqual(1);
  });

  it('keeps pointer light but removes directional disturbance under Reduce Motion', () => {
    const world = worldWithRoles(['melody']);
    const scene = projectWorldToRenderScene(world, {
      selectedOrbId: null,
      selectedFieldId: null,
      selectedToyId: null,
      selectedLinkId: null,
      playing: false,
      recording: false,
    });

    const dynamics = deriveEnvironmentDynamics(
      scene,
      [{
        event: {
          kind: 'pointer-disturbance',
          position: { x: 0.8, y: 0.2 },
          delta: { x: 0.08, y: -0.05 },
          intensity: 1,
        },
        progress: 0.1,
      }],
      {
        quality: 'balanced',
        reduceMotion: true,
        reduceParticles: false,
        reduceBloom: false,
      },
    );

    expect(dynamics.pointerPosition).toEqual({ x: 0.8, y: 0.2 });
    expect(dynamics.pointerDelta).toEqual({ x: 0, y: 0 });
    expect(dynamics.pointerStrength).toBeGreaterThan(0);
    expect(dynamics.pointerStrength).toBeLessThan(0.5);
  });
});
