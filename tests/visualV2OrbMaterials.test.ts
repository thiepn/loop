import { describe, expect, it } from 'vitest';
import {
  EMPTY_EFFECT_AMOUNTS,
  createEffectField,
} from '../src/core/world/EffectField';
import { createSoundOrb } from '../src/core/world/SoundOrb';
import { createEmptyWorld } from '../src/core/world/World';
import { deriveOrbMaterial } from '../src/core/visual/v2/OrbMaterialModel';
import { projectWorldToRenderScene } from '../src/core/visual/v2/SceneAdapter';

function sixteen<T>(factory: (index: number) => T): T[] {
  return Array.from({ length: 16 }, (_, index) => factory(index));
}

describe('Visual V2 Orb material model', () => {
  it('uses catalog metadata and default pattern when an Orb has no explicit pattern', () => {
    const orb = createSoundOrb({
      id: 'kick',
      soundId: 'beat-round-kick',
      role: 'beat',
      position: { x: 0.3, y: 0.4 },
    });

    const material = deriveOrbMaterial(
      orb,
      EMPTY_EFFECT_AMOUNTS,
    );

    expect(material.energy).toBeCloseTo(0.72);
    expect(material.brightness).toBeCloseTo(0.16);
    expect(material.density).toBeCloseTo(2 / 16);
    expect(material.groove).toBeCloseTo(0.12);
    expect(material.pattern).toHaveLength(16);
    expect(material.pattern[0]).toBe(1);
    expect(material.pattern[8]).toBe(1);
  });

  it('turns rhythm density and groove into a stable visual fingerprint', () => {
    const orb = createSoundOrb({
      id: 'rhythm',
      soundId: 'perc-soft-clap',
      role: 'percussion',
      position: { x: 0.3, y: 0.4 },
      pattern: {
        kind: 'rhythm',
        steps: sixteen((index) => [1, 5, 9, 13].includes(index)),
        groove: 'bounce',
        variation: 3,
      },
    });

    const material = deriveOrbMaterial(
      orb,
      EMPTY_EFFECT_AMOUNTS,
    );

    expect(material.density).toBeCloseTo(4 / 16);
    expect(material.groove).toBeCloseTo(0.62);
    expect(material.contour).toBeCloseTo(1);
    expect(material.spread).toBeCloseTo(1);
    expect(material.variation).toBeCloseTo(3 / 8);
    expect(material.pattern.filter((value) => value >= 0)).toHaveLength(4);
  });

  it('derives melodic contour and pitch spread without exposing notation', () => {
    const orb = createSoundOrb({
      id: 'melody',
      soundId: 'melody-soft-pluck',
      role: 'melody',
      position: { x: 0.5, y: 0.5 },
      pattern: {
        kind: 'melody',
        notes: sixteen((index) => {
          if (index === 0) return 0;
          if (index === 8) return 3;
          if (index === 15) return 6;
          return null;
        }),
        groove: 'loose',
        variation: 2,
      },
    });

    const material = deriveOrbMaterial(
      orb,
      EMPTY_EFFECT_AMOUNTS,
    );

    expect(material.density).toBeCloseTo(3 / 16);
    expect(material.groove).toBeCloseTo(0.88);
    expect(material.contour).toBeCloseTo(1);
    expect(material.spread).toBeCloseTo(1);
    expect(material.pattern[0]).toBe(0);
    expect(material.pattern[8]).toBeCloseTo(0.5);
    expect(material.pattern[15]).toBe(1);
  });

  it('keeps material seeds deterministic and variation-sensitive', () => {
    const base = createSoundOrb({
      id: 'stable',
      soundId: 'bass-warm',
      role: 'bass',
      position: { x: 0.4, y: 0.6 },
      pattern: {
        kind: 'melody',
        notes: sixteen((index) => index === 0 ? 2 : null),
        groove: 'straight',
        variation: 0,
      },
    });
    const varied = {
      ...base,
      pattern: {
        ...base.pattern!,
        variation: 1,
      },
    };

    const first = deriveOrbMaterial(base, EMPTY_EFFECT_AMOUNTS);
    const second = deriveOrbMaterial(base, EMPTY_EFFECT_AMOUNTS);
    const changed = deriveOrbMaterial(varied, EMPTY_EFFECT_AMOUNTS);

    expect(first.seed).toBe(second.seed);
    expect(changed.seed).not.toBe(first.seed);
  });

  it('projects live Field influence as a presentation hook without changing World state', () => {
    const orb = createSoundOrb({
      id: 'field-orb',
      soundId: 'bass-deep',
      role: 'bass',
      position: { x: 0.08, y: 0.08 },
    });
    const field = createEffectField({
      id: 'space',
      type: 'space',
      position: { x: 0.5, y: 0.5 },
      radius: 0.3,
    });
    const world = createEmptyWorld({
      id: 'field-world',
      soundOrbs: [orb],
      effectFields: [field],
    });

    const scene = projectWorldToRenderScene(world, {
      selectedOrbId: null,
      focusedOrbId: null,
      selectedFieldId: null,
      selectedToyId: null,
      selectedLinkId: null,
      playing: true,
      recording: false,
      liveOrbPositions: new Map([
        ['field-orb', { x: 0.5, y: 0.5 }],
      ]),
    });

    expect(scene.orbs[0]?.material.fieldInfluence.space).toBeGreaterThan(0.99);
    expect(world.soundOrbs[0]?.position).toEqual({ x: 0.08, y: 0.08 });
  });

  it('projects keyboard focus independently from selection', () => {
    const orb = createSoundOrb({
      id: 'focus-orb',
      soundId: 'harmony-dream',
      role: 'harmony',
      position: { x: 0.5, y: 0.5 },
    });
    const world = createEmptyWorld({
      id: 'focus-world',
      soundOrbs: [orb],
    });

    const scene = projectWorldToRenderScene(world, {
      selectedOrbId: null,
      focusedOrbId: 'focus-orb',
      selectedFieldId: null,
      selectedToyId: null,
      selectedLinkId: null,
      playing: false,
      recording: false,
    });

    expect(scene.orbs[0]?.selected).toBe(false);
    expect(scene.orbs[0]?.focused).toBe(true);
  });

  it('produces bounded material data for every Sound Orb role', () => {
    const definitions = [
      ['beat-round-kick', 'beat'],
      ['perc-soft-clap', 'percussion'],
      ['bass-warm', 'bass'],
      ['harmony-dream', 'harmony'],
      ['melody-soft-pluck', 'melody'],
      ['texture-air', 'texture'],
      ['voice-soft-hum', 'voice'],
    ] as const;

    for (const [soundId, role] of definitions) {
      const material = deriveOrbMaterial(
        createSoundOrb({
          id: role,
          soundId,
          role,
          position: { x: 0.5, y: 0.5 },
        }),
        EMPTY_EFFECT_AMOUNTS,
      );

      expect(material.pattern).toHaveLength(16);
      expect(material.energy).toBeGreaterThanOrEqual(0);
      expect(material.energy).toBeLessThanOrEqual(1);
      expect(material.brightness).toBeGreaterThanOrEqual(0);
      expect(material.brightness).toBeLessThanOrEqual(1);
      expect(material.density).toBeGreaterThanOrEqual(0);
      expect(material.density).toBeLessThanOrEqual(1);
      expect(material.groove).toBeGreaterThanOrEqual(0);
      expect(material.groove).toBeLessThanOrEqual(1);
      expect(material.spread).toBeGreaterThanOrEqual(0);
      expect(material.spread).toBeLessThanOrEqual(1);
      expect(material.seed).toBeGreaterThanOrEqual(0);
      expect(material.seed).toBeLessThanOrEqual(1);
    }
  });
});
