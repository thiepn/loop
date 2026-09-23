import { describe, expect, it } from 'vitest';
import {
  densityForPattern,
  effectivePattern,
} from '../src/core/music/Pattern';
import { soundById } from '../src/core/sounds/coreCatalog';
import { validateLinkCandidate } from '../src/core/world/LinkActions';
import {
  magicCatalogIsRoleStable,
  mutateWithMagic,
} from '../src/core/world/Magic';
import { createStarterWorld } from '../src/core/world/StarterWorlds';

describe('Magic', () => {
  it('is deterministic for the same base target intent strength and attempt', () => {
    const world = createStarterWorld('dreamy', 100);

    const first = mutateWithMagic(
      world,
      { kind: 'orb', id: 'dream-bass' },
      {
        intent: 'more-energy',
        strength: 'playful',
        attempt: 2,
        now: 200,
      },
    );
    const second = mutateWithMagic(
      world,
      { kind: 'orb', id: 'dream-bass' },
      {
        intent: 'more-energy',
        strength: 'playful',
        attempt: 2,
        now: 200,
      },
    );

    expect(first.seed).toBe(second.seed);
    expect(first.world).toEqual(second.world);
  });

  it('uses a different deterministic seed for Retry attempts', () => {
    const world = createStarterWorld('dreamy', 100);

    const first = mutateWithMagic(
      world,
      { kind: 'world' },
      {
        intent: 'stranger',
        strength: 'wild',
        attempt: 0,
        now: 200,
      },
    );
    const retry = mutateWithMagic(
      world,
      { kind: 'world' },
      {
        intent: 'stranger',
        strength: 'wild',
        attempt: 1,
        now: 200,
      },
    );

    expect(first.seed).not.toBe(retry.seed);
    expect(first.world).not.toEqual(retry.world);
  });

  it('preserves Sound Orb identity role position mute and existing Links', () => {
    const world = createStarterWorld('dreamy', 100);
    const before = world.soundOrbs.find((orb) => orb.id === 'dream-bass')!;

    const result = mutateWithMagic(
      world,
      { kind: 'orb', id: before.id },
      {
        intent: 'more-energy',
        strength: 'wild',
        attempt: 0,
        now: 200,
      },
    );
    const after = result.world.soundOrbs.find((orb) => orb.id === before.id)!;

    expect(after.id).toBe(before.id);
    expect(after.role).toBe(before.role);
    expect(after.position).toEqual(before.position);
    expect(after.muted).toBe(before.muted);
    expect(result.world.links).toEqual(world.links);
  });

  it('makes More Energy role-aware and busier without changing role', () => {
    const world = createStarterWorld('dreamy', 100);
    const before = world.soundOrbs.find((orb) => orb.id === 'dream-bass')!;
    const beforeSound = soundById(before.soundId)!;

    const result = mutateWithMagic(
      world,
      { kind: 'orb', id: before.id },
      {
        intent: 'more-energy',
        strength: 'playful',
        attempt: 0,
        now: 200,
      },
    );
    const after = result.world.soundOrbs.find((orb) => orb.id === before.id)!;
    const afterSound = soundById(after.soundId)!;
    const pattern = effectivePattern(after.pattern, afterSound);

    expect(after.role).toBe('bass');
    expect(afterSound.energy).toBeGreaterThanOrEqual(beforeSound.energy);
    expect(pattern).not.toBeNull();
    expect(densityForPattern(pattern!)).toBe('busy');
  });

  it('keeps Calmer sound swaps directionally honest', () => {
    const world = createStarterWorld('dance', 100);
    const before = world.soundOrbs.find((orb) => orb.id === 'dance-bass')!;
    const beforeSound = soundById(before.soundId)!;

    const result = mutateWithMagic(
      world,
      { kind: 'orb', id: before.id },
      {
        intent: 'calmer',
        strength: 'playful',
        attempt: 0,
        now: 200,
      },
    );
    const after = result.world.soundOrbs.find((orb) => orb.id === before.id)!;
    const afterSound = soundById(after.soundId)!;

    expect(afterSound.energy).toBeLessThanOrEqual(beforeSound.energy);
  });

  it('keeps Gentle orb Magic local to the musical idea', () => {
    const world = createStarterWorld('dreamy', 100);
    const before = world.soundOrbs.find((orb) => orb.id === 'dream-bass')!;

    const result = mutateWithMagic(
      world,
      { kind: 'orb', id: before.id },
      {
        intent: 'surprise',
        strength: 'gentle',
        attempt: 0,
        now: 200,
      },
    );
    const after = result.world.soundOrbs.find((orb) => orb.id === before.id)!;

    expect(after.soundId).toBe(before.soundId);
    expect(after.motion).toEqual(before.motion);
    expect(after.pattern).not.toEqual(before.pattern);
  });

  it('mutates Effect Field geometry while preserving field identity and type', () => {
    const world = createStarterWorld('dreamy', 100);
    const before = world.effectFields.find((field) => field.id === 'dream-space')!;

    const result = mutateWithMagic(
      world,
      { kind: 'field', id: before.id },
      {
        intent: 'stranger',
        strength: 'wild',
        attempt: 1,
        now: 200,
      },
    );
    const after = result.world.effectFields.find((field) => field.id === before.id)!;

    expect(after.id).toBe(before.id);
    expect(after.type).toBe(before.type);
    expect(after.position.x).toBeGreaterThanOrEqual(0);
    expect(after.position.x).toBeLessThanOrEqual(1);
    expect(after.position.y).toBeGreaterThanOrEqual(0);
    expect(after.position.y).toBeLessThanOrEqual(1);
    expect(after.radius).toBeGreaterThanOrEqual(0.1);
    expect(after.radius).toBeLessThanOrEqual(0.34);
    expect(after).not.toEqual(before);
  });

  it('mutates Toy placement/strength within safe bounds while preserving type', () => {
    const world = createStarterWorld('weird', 100);
    const before = world.playgroundToys[0]!;

    const result = mutateWithMagic(
      world,
      { kind: 'toy', id: before.id },
      {
        intent: 'more-energy',
        strength: 'wild',
        attempt: 0,
        now: 200,
      },
    );
    const after = result.world.playgroundToys[0]!;

    expect(after.id).toBe(before.id);
    expect(after.type).toBe(before.type);
    expect(after.strength).toBeGreaterThanOrEqual(0.2);
    expect(after.strength).toBeLessThanOrEqual(1);
    expect(after.position.x).toBeGreaterThanOrEqual(0);
    expect(after.position.x).toBeLessThanOrEqual(1);
    expect(after.position.y).toBeGreaterThanOrEqual(0);
    expect(after.position.y).toBeLessThanOrEqual(1);
  });

  it('Remix preserves object counts ids roles and structural Links', () => {
    const world = createStarterWorld('dance', 100);

    const result = mutateWithMagic(
      world,
      { kind: 'world' },
      {
        intent: 'busier',
        strength: 'wild',
        attempt: 0,
        now: 200,
      },
    );

    expect(result.world.soundOrbs).toHaveLength(world.soundOrbs.length);
    expect(result.world.effectFields).toHaveLength(world.effectFields.length);
    expect(result.world.playgroundToys).toHaveLength(world.playgroundToys.length);
    expect(result.world.links).toEqual(world.links);

    expect(
      result.world.soundOrbs.map((orb) => [orb.id, orb.role]),
    ).toEqual(
      world.soundOrbs.map((orb) => [orb.id, orb.role]),
    );

    expect(result.world.music.bpm).toBeGreaterThan(world.music.bpm);
  });

  it('Calmer Remix reduces tempo and keeps every existing Link valid', () => {
    const world = createStarterWorld('beat', 100);

    const result = mutateWithMagic(
      world,
      { kind: 'world' },
      {
        intent: 'calmer',
        strength: 'playful',
        attempt: 0,
        now: 200,
      },
    );

    expect(result.world.music.bpm).toBeLessThan(world.music.bpm);

    for (const link of result.world.links) {
      const withoutCurrent = {
        ...result.world,
        links: result.world.links.filter(
          (candidate) => candidate.id !== link.id,
        ),
      };

      expect(
        validateLinkCandidate(
          withoutCurrent,
          link.type,
          link.sourceOrbId,
          link.targetOrbId,
        ).ok,
      ).toBe(true);
    }
  });

  it('returns the same World for a missing object target', () => {
    const world = createStarterWorld('beat', 100);

    const result = mutateWithMagic(
      world,
      { kind: 'orb', id: 'missing' },
      {
        attempt: 0,
        now: 200,
      },
    );

    expect(result.world).toBe(world);
  });

  it('keeps the built-in catalog role-stable for Magic sound swaps', () => {
    expect(magicCatalogIsRoleStable()).toBe(true);
  });
});
