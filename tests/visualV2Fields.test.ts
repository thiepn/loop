import { describe, expect, it } from 'vitest';
import {
  FieldInfluenceTransitions,
  deriveFieldEnvironment,
  deriveFieldIntersections,
  deriveFieldMaterial,
} from '../src/core/visual/v2/FieldMaterialModel';
import { projectWorldToRenderScene } from '../src/core/visual/v2/SceneAdapter';
import {
  createEffectField,
  type EffectFieldDocument,
} from '../src/core/world/EffectField';
import { createSoundOrb } from '../src/core/world/SoundOrb';
import { createEmptyWorld } from '../src/core/world/World';

function field(
  id: string,
  type: EffectFieldDocument['type'],
  x: number,
  y: number,
  radius = 0.2,
): EffectFieldDocument {
  return createEffectField({
    id,
    type,
    position: { x, y },
    radius,
  });
}

describe('Visual V2 Field materials', () => {
  it('keeps deterministic identity across move/resize previews', () => {
    const original = field(
      'stable-field',
      'heat',
      0.3,
      0.4,
      0.18,
    );
    const preview = {
      ...original,
      position: { x: 0.68, y: 0.57 },
      radius: 0.28,
    };

    const first = deriveFieldMaterial(original);
    const second = deriveFieldMaterial(preview);

    expect(first.seed).toBe(second.seed);
    expect(first.edgeRoughness).toBe(second.edgeRoughness);
    expect(second.detail).toBeGreaterThan(first.detail);
  });

  it('gives the five Field roles distinct boundary character', () => {
    const materials = [
      deriveFieldMaterial(field('space', 'space', 0.5, 0.5)),
      deriveFieldMaterial(field('echo', 'echo', 0.5, 0.5)),
      deriveFieldMaterial(field('heat', 'heat', 0.5, 0.5)),
      deriveFieldMaterial(field('frost', 'frost', 0.5, 0.5)),
      deriveFieldMaterial(field('filter', 'filter', 0.5, 0.5)),
    ];

    const roughness = materials.map(
      (material) => material.edgeRoughness,
    );

    expect(new Set(roughness).size).toBe(5);
    expect(materials.every(
      (material) => material.seed >= 0 && material.seed <= 1,
    )).toBe(true);
  });
});

describe('Visual V2 Field intersections', () => {
  it('derives a two-Field overlap material from real geometry', () => {
    const fields = [
      field('space', 'space', 0.44, 0.5, 0.2),
      field('heat', 'heat', 0.56, 0.5, 0.2),
    ];

    const intersections = deriveFieldIntersections(fields);

    expect(intersections).toHaveLength(1);
    expect(intersections[0]?.typeA).toBe('space');
    expect(intersections[0]?.typeB).toBe('heat');
    expect(intersections[0]?.strength).toBeGreaterThan(0);
    expect(intersections[0]?.simplified).toBe(false);
    expect(intersections[0]?.position.x).toBeCloseTo(0.5);
  });

  it('simplifies pair materials inside a three-Field overlap', () => {
    const fields = [
      field('space', 'space', 0.48, 0.5, 0.22),
      field('heat', 'heat', 0.52, 0.5, 0.22),
      field('echo', 'echo', 0.5, 0.52, 0.22),
    ];

    const intersections = deriveFieldIntersections(fields);

    expect(intersections.length).toBeGreaterThanOrEqual(3);
    expect(
      intersections.some(
        (intersection) => intersection.simplified,
      ),
    ).toBe(true);
  });

  it('caps visual intersection overlays for maximum overlap density', () => {
    const fields = [
      field('space', 'space', 0.5, 0.5, 0.24),
      field('heat', 'heat', 0.5, 0.5, 0.23),
      field('echo', 'echo', 0.5, 0.5, 0.22),
      field('frost', 'frost', 0.5, 0.5, 0.21),
      field('filter', 'filter', 0.5, 0.5, 0.2),
    ];

    const intersections = deriveFieldIntersections(fields);

    expect(intersections.length).toBeLessThanOrEqual(5);
    expect(intersections.every(
      (intersection) => intersection.simplified,
    )).toBe(true);
  });

  it('does not create intersection material for separated Fields', () => {
    const fields = [
      field('left', 'space', 0.15, 0.2, 0.1),
      field('right', 'frost', 0.85, 0.8, 0.1),
    ];

    expect(deriveFieldIntersections(fields)).toHaveLength(0);
  });
});

describe('Visual V2 Field environment', () => {
  it('scales global ambience by actual Field coverage', () => {
    const small = deriveFieldEnvironment(
      [field('small', 'heat', 0.5, 0.5, 0.1)],
      [],
    );
    const large = deriveFieldEnvironment(
      [field('large', 'heat', 0.5, 0.5, 0.3)],
      [],
    );

    expect(small.heat).toBeCloseTo(0.0625);
    expect(large.heat).toBeCloseTo(0.5625);
    expect(large.heat).toBeGreaterThan(small.heat);
  });

  it('records bounded overlap energy separately from type weights', () => {
    const fields = [
      field('space', 'space', 0.46, 0.5, 0.22),
      field('filter', 'filter', 0.54, 0.5, 0.22),
    ];
    const intersections = deriveFieldIntersections(fields);
    const environment = deriveFieldEnvironment(
      fields,
      intersections,
    );

    expect(environment.space).toBeGreaterThan(0);
    expect(environment.filter).toBeGreaterThan(0);
    expect(environment.overlap).toBeGreaterThan(0);
    expect(environment.overlap).toBeLessThanOrEqual(1);
  });
});

describe('Visual V2 Field influence transitions', () => {
  it('smooths Orb entry rather than snapping from zero to full depth', () => {
    const transitions = new FieldInfluenceTransitions();
    const orb = createSoundOrb({
      id: 'orb',
      soundId: 'bass-warm',
      role: 'bass',
      position: { x: 0.1, y: 0.1 },
    });
    const heat = field('heat', 'heat', 0.5, 0.5, 0.24);
    const positions = new Map([
      ['orb', { x: 0.1, y: 0.1 }],
    ]);

    expect(
      transitions.update(
        [orb],
        positions,
        [heat],
        0,
        false,
      ),
    ).toBe(false);
    expect(transitions.get('orb').heat).toBe(0);

    positions.set('orb', { x: 0.5, y: 0.5 });

    expect(
      transitions.update(
        [orb],
        positions,
        [heat],
        16,
        false,
      ),
    ).toBe(true);

    const entered = transitions.get('orb').heat;
    expect(entered).toBeGreaterThan(0);
    expect(entered).toBeLessThan(1);

    transitions.update(
      [orb],
      positions,
      [heat],
      200,
      false,
    );

    expect(transitions.get('orb').heat)
      .toBeGreaterThan(entered);
  });

  it('uses immediate state changes under Reduce Motion', () => {
    const transitions = new FieldInfluenceTransitions();
    const orb = createSoundOrb({
      id: 'orb',
      soundId: 'melody-soft-pluck',
      role: 'melody',
      position: { x: 0.1, y: 0.1 },
    });
    const frost = field(
      'frost',
      'frost',
      0.5,
      0.5,
      0.24,
    );
    const positions = new Map([
      ['orb', { x: 0.1, y: 0.1 }],
    ]);

    transitions.update(
      [orb],
      positions,
      [frost],
      0,
      true,
    );
    positions.set('orb', { x: 0.5, y: 0.5 });
    transitions.update(
      [orb],
      positions,
      [frost],
      16,
      true,
    );

    expect(transitions.get('orb').frost).toBeCloseTo(1);
  });

  it('removes transition state for deleted Orbs', () => {
    const transitions = new FieldInfluenceTransitions();
    const orb = createSoundOrb({
      id: 'orb',
      soundId: 'beat-round-kick',
      role: 'beat',
      position: { x: 0.5, y: 0.5 },
    });
    const space = field(
      'space',
      'space',
      0.5,
      0.5,
      0.24,
    );

    transitions.update(
      [orb],
      new Map(),
      [space],
      0,
      false,
    );
    expect(transitions.get('orb').space).toBeGreaterThan(0);

    transitions.update(
      [],
      new Map(),
      [space],
      16,
      false,
    );

    expect(transitions.get('orb').space).toBe(0);
  });
});

describe('Visual V2 Field scene projection', () => {
  it('projects materials, intersections, ambience and smoothed Orb overrides', () => {
    const orb = createSoundOrb({
      id: 'orb',
      soundId: 'melody-soft-pluck',
      role: 'melody',
      position: { x: 0.5, y: 0.5 },
    });
    const space = field(
      'space',
      'space',
      0.46,
      0.5,
      0.22,
    );
    const echo = field(
      'echo',
      'echo',
      0.54,
      0.5,
      0.22,
    );
    const world = createEmptyWorld({
      id: 'field-scene',
      soundOrbs: [orb],
      effectFields: [space, echo],
    });

    const scene = projectWorldToRenderScene(world, {
      selectedOrbId: null,
      selectedFieldId: 'space',
      selectedToyId: null,
      selectedLinkId: null,
      playing: true,
      recording: false,
      orbFieldInfluenceOverrides: new Map([
        ['orb', {
          space: 0.25,
          echo: 0.4,
          heat: 0,
          frost: 0,
          filter: 0,
        }],
      ]),
    });

    expect(scene.fields).toHaveLength(2);
    expect(scene.fields[0]?.material.seed).toBeDefined();
    expect(scene.fieldIntersections.length).toBeGreaterThan(0);
    expect(scene.fieldEnvironment.space).toBeGreaterThan(0);
    expect(scene.fieldEnvironment.echo).toBeGreaterThan(0);
    expect(scene.orbs[0]?.material.fieldInfluence.space)
      .toBeCloseTo(0.25);
    expect(scene.orbs[0]?.material.fieldInfluence.echo)
      .toBeCloseTo(0.4);
  });

  it('preserves Field material seed across preview move/resize overrides', () => {
    const original = field(
      'preview',
      'filter',
      0.3,
      0.4,
      0.18,
    );
    const preview = {
      ...original,
      position: { x: 0.7, y: 0.6 },
      radius: 0.28,
    };
    const world = createEmptyWorld({
      effectFields: [original],
    });

    const base = projectWorldToRenderScene(world, {
      selectedOrbId: null,
      selectedFieldId: null,
      selectedToyId: null,
      selectedLinkId: null,
      playing: false,
      recording: false,
    });
    const moved = projectWorldToRenderScene(world, {
      selectedOrbId: null,
      selectedFieldId: null,
      selectedToyId: null,
      selectedLinkId: null,
      playing: false,
      recording: false,
      fieldOverrides: new Map([
        ['preview', preview],
      ]),
    });

    expect(base.fields[0]?.material.seed)
      .toBe(moved.fields[0]?.material.seed);
    expect(moved.fields[0]?.position)
      .toEqual({ x: 0.7, y: 0.6 });
    expect(moved.fields[0]?.radius).toBe(0.28);
  });
});
