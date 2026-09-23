import { describe, expect, it } from 'vitest';
import {
  baseEventAllowedByLinks,
  reactiveLinkTime,
  reactiveLinksFromSource,
  takeTurnsLinkForActivity,
} from '../src/core/music/ReactiveLinks';
import { MusicalTransport } from '../src/core/music/MusicalTransport';
import { createLink } from '../src/core/world/Link';
import { createSoundOrb } from '../src/core/world/SoundOrb';
import { createEmptyWorld } from '../src/core/world/World';

const tick = (bar: number) => ({
  time: 2,
  absoluteStep: bar * 16,
  stepInBar: 0,
  bar,
});

describe('ReactiveLinks', () => {
  it('suppresses a target base pattern when Pulse/Follow drives it', () => {
    const world = createEmptyWorld({
      soundOrbs: [
        createSoundOrb({
          id: 'source',
          soundId: 'beat-round-kick',
          role: 'beat',
          position: { x: 0.3, y: 0.5 },
        }),
        createSoundOrb({
          id: 'target',
          soundId: 'bass-warm',
          role: 'bass',
          position: { x: 0.7, y: 0.5 },
        }),
      ],
      links: [
        createLink({
          id: 'pulse',
          type: 'pulse-together',
          sourceOrbId: 'source',
          targetOrbId: 'target',
        }),
      ],
    });

    expect(baseEventAllowedByLinks(world, 'source', tick(0))).toBe(true);
    expect(baseEventAllowedByLinks(world, 'target', tick(0))).toBe(false);
  });

  it('alternates Take Turns by bar', () => {
    const world = createEmptyWorld({
      soundOrbs: [
        createSoundOrb({
          id: 'a',
          soundId: 'beat-round-kick',
          role: 'beat',
          position: { x: 0.3, y: 0.5 },
        }),
        createSoundOrb({
          id: 'b',
          soundId: 'perc-soft-clap',
          role: 'percussion',
          position: { x: 0.7, y: 0.5 },
        }),
      ],
      links: [
        createLink({
          id: 'turns',
          type: 'take-turns',
          sourceOrbId: 'a',
          targetOrbId: 'b',
        }),
      ],
    });

    expect(baseEventAllowedByLinks(world, 'a', tick(0))).toBe(true);
    expect(baseEventAllowedByLinks(world, 'b', tick(0))).toBe(false);
    expect(baseEventAllowedByLinks(world, 'a', tick(1))).toBe(false);
    expect(baseEventAllowedByLinks(world, 'b', tick(1))).toBe(true);
    expect(takeTurnsLinkForActivity(world.links, 'b')?.id).toBe('turns');
  });

  it('returns only reactive audio Links for a source', () => {
    const links = [
      createLink({
        id: 'pulse',
        type: 'pulse-together',
        sourceOrbId: 'a',
        targetOrbId: 'b',
      }),
      createLink({
        id: 'copy',
        type: 'copy-movement',
        sourceOrbId: 'a',
        targetOrbId: 'c',
      }),
    ];

    expect(reactiveLinksFromSource(links, 'a').map((link) => link.id)).toEqual([
      'pulse',
    ]);
  });

  it('delays Follow by exactly one 16th note', () => {
    const transport = new MusicalTransport({ bpm: 120 });
    const follow = createLink({
      id: 'follow',
      type: 'follow',
      sourceOrbId: 'a',
      targetOrbId: 'b',
    });
    const pulse = createLink({
      id: 'pulse',
      type: 'pulse-together',
      sourceOrbId: 'a',
      targetOrbId: 'b',
    });

    expect(reactiveLinkTime(follow, 3, transport)).toBeCloseTo(3.125);
    expect(reactiveLinkTime(pulse, 3, transport)).toBe(3);
  });
});
