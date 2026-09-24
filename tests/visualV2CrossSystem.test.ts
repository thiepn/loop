import { describe, expect, it } from 'vitest';
import {
  deriveCrossEnvironment,
  deriveFieldCrossInteraction,
  deriveLinkCrossInteraction,
  deriveOrbCouplings,
  deriveOrbCrossInteractions,
  deriveToyCrossInteraction,
} from '../src/core/visual/v2/CrossSystemModel';
import {
  crossAffectedLinkPoints,
  curvedLinkPoints,
} from '../src/core/visual/v2/LinkGeometry';
import {
  fieldInfluencedColor,
} from '../src/core/visual/v2/RenderPalette';
import { projectWorldToRenderScene } from '../src/core/visual/v2/SceneAdapter';
import { createEffectField } from '../src/core/world/EffectField';
import { createLink } from '../src/core/world/Link';
import { createPlaygroundToy } from '../src/core/world/PlaygroundToy';
import { createSoundOrb } from '../src/core/world/SoundOrb';
import { createEmptyWorld } from '../src/core/world/World';

function orb(
  id: string,
  x: number,
  y: number,
  role: 'beat' | 'bass' | 'melody' | 'harmony' = 'melody',
) {
  const soundId = role === 'beat'
    ? 'beat-round-kick'
    : role === 'bass'
      ? 'bass-warm'
      : role === 'harmony'
        ? 'harmony-dream'
        : 'melody-soft-pluck';

  return createSoundOrb({
    id,
    soundId,
    role,
    position: { x, y },
  });
}

describe('Visual V2 Orb cross-system coupling', () => {
  it('creates proximity coupling only for nearby Orbs', () => {
    const orbs = [
      orb('a', 0.4, 0.5, 'beat'),
      orb('b', 0.48, 0.5, 'bass'),
      orb('far', 0.9, 0.9, 'melody'),
    ];
    const positions = new Map(
      orbs.map((item) => [item.id, item.position]),
    );

    const couplings = deriveOrbCouplings(
      orbs,
      positions,
    );

    expect(couplings).toHaveLength(1);
    expect(couplings[0]?.orbAId).toBe('a');
    expect(couplings[0]?.orbBId).toBe('b');
    expect(couplings[0]?.strength).toBeGreaterThan(0);
  });

  it('caps dense 12-Orb coupling graphics deterministically', () => {
    const orbs = Array.from(
      { length: 12 },
      (_, index) => orb(
        'orb-' + index,
        0.45 + (index % 4) * 0.018,
        0.45 + Math.floor(index / 4) * 0.018,
        index % 2 === 0 ? 'beat' : 'melody',
      ),
    );
    const positions = new Map(
      orbs.map((item) => [item.id, item.position]),
    );

    const first = deriveOrbCouplings(orbs, positions);
    const second = deriveOrbCouplings(orbs, positions);

    expect(first).toHaveLength(6);
    expect(second.map((item) => item.id))
      .toEqual(first.map((item) => item.id));
    expect(
      first.every(
        (item, index) => index === 0
          || first[index - 1]!.strength >= item.strength,
      ),
    ).toBe(true);
  });

  it('propagates drag wake and nearest-neighbor light without moving saved state', () => {
    const a = orb('a', 0.45, 0.5, 'melody');
    const b = orb('b', 0.52, 0.5, 'bass');
    const orbs = [a, b];
    const positions = new Map(
      orbs.map((item) => [item.id, item.position]),
    );
    const couplings = deriveOrbCouplings(
      orbs,
      positions,
    );
    const interactions = new Map([
      ['b', {
        hoverStrength: 0,
        hoverOffset: { x: 0, y: 0 },
        grabbed: true,
        dragVelocity: { x: 1, y: 0 },
        dragSpeed: 0.9,
        charging: false,
      }],
    ]);

    const result = deriveOrbCrossInteractions(
      orbs,
      positions,
      interactions,
      [],
      couplings,
    );
    const cross = result.get('a');

    expect(cross?.auraBlend).toBeGreaterThan(0);
    expect(cross?.neighborLight).toBeGreaterThan(0);
    expect(cross?.wakeStrength).toBeGreaterThan(0);
    expect(cross?.wakeDirection.x).toBeLessThan(0);
    expect(a.position).toEqual({ x: 0.45, y: 0.5 });
  });
});

describe('Visual V2 Field-aware Links', () => {
  it('samples Field influence and refracts the rendered path', () => {
    const link = createLink({
      id: 'link',
      type: 'pulse-together',
      sourceOrbId: 'a',
      targetOrbId: 'b',
    });
    const heat = createEffectField({
      id: 'heat',
      type: 'heat',
      position: { x: 0.5, y: 0.43 },
      radius: 0.24,
    });
    const source = { x: 0.2, y: 0.5 };
    const target = { x: 0.8, y: 0.5 };

    const interaction = deriveLinkCrossInteraction(
      link,
      source,
      target,
      [heat],
      [],
    );

    expect(interaction.dominantField).toBe('heat');
    expect(interaction.fieldInfluence.heat).toBeGreaterThan(0);
    expect(interaction.refractionStrength).toBeGreaterThan(0);

    const base = curvedLinkPoints(
      link.id,
      source,
      target,
      1000,
      700,
      12,
    );
    const affected = crossAffectedLinkPoints(
      base,
      interaction,
      1000,
      700,
    );
    const middle = Math.floor(base.length / 2);

    expect(affected[0]).toEqual(base[0]);
    expect(affected.at(-1)).toEqual(base.at(-1));
    expect(affected[middle]).not.toEqual(base[middle]);
  });

  it('uses deterministic perpendicular refraction when Field center sits exactly on Link midpoint', () => {
    const link = createLink({
      id: 'center-link',
      type: 'follow',
      sourceOrbId: 'a',
      targetOrbId: 'b',
    });
    const space = createEffectField({
      id: 'space',
      type: 'space',
      position: { x: 0.5, y: 0.5 },
      radius: 0.25,
    });

    const interaction = deriveLinkCrossInteraction(
      link,
      { x: 0.2, y: 0.5 },
      { x: 0.8, y: 0.5 },
      [space],
      [],
    );

    expect(interaction.refractionStrength).toBeGreaterThan(0);
    expect(
      Math.hypot(
        interaction.refractionDirection.x,
        interaction.refractionDirection.y,
      ),
    ).toBeGreaterThan(0.9);
  });

  it('carries toy influence at the Link midpoint', () => {
    const link = createLink({
      id: 'toy-link',
      type: 'copy-movement',
      sourceOrbId: 'a',
      targetOrbId: 'b',
    });
    const spinner = createPlaygroundToy({
      id: 'spinner',
      type: 'spinner',
      position: { x: 0.5, y: 0.5 },
      radius: 0.2,
      strength: 1,
    });

    const interaction = deriveLinkCrossInteraction(
      link,
      { x: 0.3, y: 0.5 },
      { x: 0.7, y: 0.5 },
      [],
      [spinner],
    );

    expect(interaction.toyInfluence?.type).toBe('spinner');
    expect(interaction.toyInfluence?.amount).toBeGreaterThan(0);
  });
});

describe('Visual V2 toy and Field reciprocity', () => {
  it('lets Fields tint toys and nearby Orbs energize them', () => {
    const heat = createEffectField({
      id: 'heat',
      type: 'heat',
      position: { x: 0.5, y: 0.5 },
      radius: 0.25,
    });
    const magnet = createPlaygroundToy({
      id: 'magnet',
      type: 'magnet',
      position: { x: 0.5, y: 0.5 },
      radius: 0.2,
      strength: 0.8,
    });
    const nearby = orb('near', 0.53, 0.5, 'bass');
    const positions = new Map([
      ['near', nearby.position],
    ]);

    const toyCross = deriveToyCrossInteraction(
      magnet,
      [heat],
      [nearby],
      positions,
    );
    const fieldCross = deriveFieldCrossInteraction(
      heat,
      [magnet],
      [nearby],
      positions,
    );

    expect(toyCross.fieldInfluence.heat).toBeGreaterThan(0);
    expect(toyCross.nearbyOrbStrength).toBeGreaterThan(0);
    expect(fieldCross.toyInfluence?.type).toBe('magnet');
    expect(fieldCross.nearbyOrbEnergy).toBeGreaterThan(0);
  });

  it('selects one strongest environmental force with deterministic type priority', () => {
    const magnet = createPlaygroundToy({
      id: 'magnet',
      type: 'magnet',
      position: { x: 0.3, y: 0.5 },
      radius: 0.18,
      strength: 0.8,
    });
    const repulsor = createPlaygroundToy({
      id: 'repulsor',
      type: 'repulsor',
      position: { x: 0.7, y: 0.5 },
      radius: 0.18,
      strength: 0.8,
    });

    const environment = deriveCrossEnvironment(
      [magnet, repulsor],
      [],
    );

    expect(environment.forceType).toBe('repulsor');
    expect(environment.forceStrength).toBeGreaterThan(0);
  });
});

describe('Visual V2 cross-system styling and projection', () => {
  it('mixes Link/Toy colors with Field material influence', () => {
    const base = [0.4, 0.5, 0.8, 0.7] as const;
    const affected = fieldInfluencedColor(base, {
      space: 0,
      echo: 0,
      heat: 1,
      frost: 0,
      filter: 0,
    });

    expect(affected).not.toEqual(base);
    expect(affected[0]).toBeGreaterThan(base[0]);
  });

  it('projects cross-system state without mutating creative documents', () => {
    const a = orb('a', 0.44, 0.5, 'beat');
    const b = orb('b', 0.52, 0.5, 'bass');
    const heat = createEffectField({
      id: 'heat',
      type: 'heat',
      position: { x: 0.5, y: 0.45 },
      radius: 0.25,
    });
    const spinner = createPlaygroundToy({
      id: 'spinner',
      type: 'spinner',
      position: { x: 0.5, y: 0.5 },
      radius: 0.2,
      strength: 1,
    });
    const link = createLink({
      id: 'link',
      type: 'pulse-together',
      sourceOrbId: 'a',
      targetOrbId: 'b',
    });
    const world = createEmptyWorld({
      id: 'cross-world',
      soundOrbs: [a, b],
      effectFields: [heat],
      playgroundToys: [spinner],
      links: [link],
    });

    const scene = projectWorldToRenderScene(world, {
      selectedOrbId: null,
      selectedFieldId: null,
      selectedToyId: null,
      selectedLinkId: null,
      playing: true,
      recording: false,
    });

    expect(scene.orbCouplings.length).toBeGreaterThan(0);
    expect(scene.orbs[0]?.cross.neighborLight).toBeGreaterThan(0);
    expect(scene.fields[0]?.cross.toyInfluence?.type).toBe('spinner');
    expect(scene.toys[0]?.cross.fieldInfluence.heat).toBeGreaterThan(0);
    expect(scene.links[0]?.cross.fieldInfluence.heat).toBeGreaterThan(0);
    expect(scene.crossEnvironment.forceType).toBe('spinner');

    expect(world.soundOrbs[0]?.position).toEqual({ x: 0.44, y: 0.5 });
    expect(world.effectFields[0]?.position).toEqual({ x: 0.5, y: 0.45 });
  });
});
