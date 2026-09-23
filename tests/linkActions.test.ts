import { describe, expect, it } from 'vitest';
import {
  addLink,
  deleteLink,
  validateLinkCandidate,
} from '../src/core/world/LinkActions';
import { createMotion } from '../src/core/world/Motion';
import { createSoundOrb } from '../src/core/world/SoundOrb';
import { createEmptyWorld } from '../src/core/world/World';

function makeWorld() {
  return createEmptyWorld({
    id: 'link-world',
    soundOrbs: [
      createSoundOrb({
        id: 'kick',
        soundId: 'beat-round-kick',
        role: 'beat',
        position: { x: 0.2, y: 0.5 },
      }),
      createSoundOrb({
        id: 'bass',
        soundId: 'bass-warm',
        role: 'bass',
        position: { x: 0.5, y: 0.5 },
      }),
      createSoundOrb({
        id: 'melody',
        soundId: 'melody-soft-pluck',
        role: 'melody',
        position: { x: 0.8, y: 0.5 },
        motion: createMotion({ mode: 'orbit', seed: 2 }),
      }),
      createSoundOrb({
        id: 'harmony',
        soundId: 'harmony-dream',
        role: 'harmony',
        position: { x: 0.5, y: 0.75 },
      }),
      createSoundOrb({
        id: 'texture',
        soundId: 'texture-air',
        role: 'texture',
        position: { x: 0.5, y: 0.2 },
      }),
    ],
  });
}

describe('LinkActions', () => {
  it('adds a valid one-way relationship', () => {
    const result = addLink(
      makeWorld(),
      'pulse-together',
      'kick',
      'bass',
      200,
    );

    expect(result.createdId).not.toBeNull();
    expect(result.world.links).toHaveLength(1);
    expect(result.world.links[0]).toMatchObject({
      type: 'pulse-together',
      sourceOrbId: 'kick',
      targetOrbId: 'bass',
    });
  });

  it('rejects self links and exact duplicates', () => {
    const world = makeWorld();

    expect(
      validateLinkCandidate(world, 'follow', 'kick', 'kick').reason,
    ).toBe('self');

    const linked = addLink(
      world,
      'follow',
      'kick',
      'melody',
    ).world;

    expect(
      addLink(linked, 'follow', 'kick', 'melody').reason,
    ).toBe('duplicate');
  });

  it('limits Pulse/Follow to one incoming playback driver', () => {
    let world = addLink(
      makeWorld(),
      'pulse-together',
      'kick',
      'melody',
    ).world;

    const blocked = addLink(
      world,
      'follow',
      'bass',
      'melody',
    );

    expect(blocked.createdId).toBeNull();
    expect(blocked.reason).toBe('target-driven');
  });

  it('allows only one Take Turns pair per participant', () => {
    let world = addLink(
      makeWorld(),
      'take-turns',
      'kick',
      'bass',
    ).world;

    const blocked = addLink(
      world,
      'take-turns',
      'kick',
      'melody',
    );

    expect(blocked.reason).toBe('take-turns-conflict');
  });

  it('prevents reactive playback-driver chains', () => {
    let world = addLink(
      makeWorld(),
      'pulse-together',
      'kick',
      'melody',
    ).world;

    expect(
      addLink(
        world,
        'follow',
        'melody',
        'harmony',
      ).reason,
    ).toBe('target-driven');

    world = makeWorld();
    world = addLink(
      world,
      'follow',
      'bass',
      'harmony',
    ).world;

    expect(
      addLink(
        world,
        'pulse-together',
        'kick',
        'bass',
      ).reason,
    ).toBe('target-driven');
  });

  it('restricts Kick Pushes Bass to beat/percussion → bass', () => {
    const world = makeWorld();

    expect(
      addLink(
        world,
        'kick-pushes-bass',
        'kick',
        'bass',
      ).createdId,
    ).not.toBeNull();

    expect(
      addLink(
        world,
        'kick-pushes-bass',
        'melody',
        'bass',
      ).reason,
    ).toBe('incompatible');

    expect(
      addLink(
        world,
        'kick-pushes-bass',
        'kick',
        'melody',
      ).reason,
    ).toBe('incompatible');
  });

  it('rejects playback-driving Links to texture targets', () => {
    expect(
      addLink(
        makeWorld(),
        'pulse-together',
        'kick',
        'texture',
      ).reason,
    ).toBe('incompatible');
  });

  it('prevents multiple Copy Movement drivers and chains', () => {
    let world = addLink(
      makeWorld(),
      'copy-movement',
      'melody',
      'bass',
    ).world;

    expect(
      addLink(
        world,
        'copy-movement',
        'harmony',
        'bass',
      ).reason,
    ).toBe('copy-target-conflict');

    expect(
      addLink(
        world,
        'copy-movement',
        'bass',
        'harmony',
      ).reason,
    ).toBe('copy-chain-conflict');
  });

  it('deletes only the requested Link', () => {
    let world = addLink(
      makeWorld(),
      'pulse-together',
      'kick',
      'bass',
    ).world;
    world = addLink(
      world,
      'copy-movement',
      'melody',
      'harmony',
    ).world;

    const firstId = world.links[0]!.id;
    const next = deleteLink(world, firstId, 300);

    expect(next.links).toHaveLength(1);
    expect(next.links[0]?.type).toBe('copy-movement');
  });
});
