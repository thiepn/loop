import { describe, expect, it } from 'vitest';
import {
  applyPlaygroundToys,
  evaluateMotionFrame,
  worldHasActiveMotion,
} from '../src/core/music/MotionEngine';
import { createLink } from '../src/core/world/Link';
import { createMotion } from '../src/core/world/Motion';
import { createPlaygroundToy } from '../src/core/world/PlaygroundToy';
import { createSoundOrb } from '../src/core/world/SoundOrb';
import { createEmptyWorld } from '../src/core/world/World';

describe('MotionEngine', () => {
  it('reports static Worlds as inactive', () => {
    const world = createEmptyWorld({
      soundOrbs: [
        createSoundOrb({
          id: 'orb',
          soundId: 'beat-round-kick',
          role: 'beat',
          position: { x: 0.5, y: 0.5 },
        }),
      ],
    });

    expect(worldHasActiveMotion(world)).toBe(false);
  });

  it('becomes active for either Motion or toys', () => {
    const moving = createEmptyWorld({
      soundOrbs: [
        createSoundOrb({
          id: 'orb',
          soundId: 'beat-round-kick',
          role: 'beat',
          position: { x: 0.5, y: 0.5 },
          motion: createMotion({ mode: 'orbit' }),
        }),
      ],
    });
    const toyWorld = createEmptyWorld({
      soundOrbs: [
        createSoundOrb({
          id: 'toy-orb',
          soundId: 'beat-round-kick',
          role: 'beat',
          position: { x: 0.5, y: 0.5 },
        }),
      ],
      playgroundToys: [
        createPlaygroundToy({
          id: 'spinner',
          type: 'spinner',
          position: { x: 0.5, y: 0.5 },
        }),
      ],
    });
    const emptyToyWorld = createEmptyWorld({
      playgroundToys: toyWorld.playgroundToys,
    });

    expect(worldHasActiveMotion(moving)).toBe(true);
    expect(worldHasActiveMotion(toyWorld)).toBe(true);
    expect(worldHasActiveMotion(emptyToyWorld)).toBe(false);
  });

  it('evaluates Follow after independent target motion', () => {
    const target = createSoundOrb({
      id: 'target',
      soundId: 'bass-warm',
      role: 'bass',
      position: { x: 0.7, y: 0.5 },
      motion: createMotion({ mode: 'orbit', seed: 2 }),
    });
    const follower = createSoundOrb({
      id: 'follower',
      soundId: 'melody-soft-pluck',
      role: 'melody',
      position: { x: 0.2, y: 0.5 },
      motion: createMotion({
        mode: 'follow',
        targetOrbId: 'target',
        seed: 3,
      }),
    });
    const world = createEmptyWorld({ soundOrbs: [target, follower] });
    const frame = evaluateMotionFrame(world, 4);

    expect(frame.get('target')).toBeDefined();
    expect(frame.get('follower')).toBeDefined();
    expect(frame.get('follower')).not.toEqual(follower.position);
  });

  it('falls back to another nearby target if a saved Follow target disappears', () => {
    const follower = createSoundOrb({
      id: 'follower',
      soundId: 'melody-soft-pluck',
      role: 'melody',
      position: { x: 0.2, y: 0.5 },
      motion: createMotion({
        mode: 'follow',
        targetOrbId: 'gone',
        seed: 3,
      }),
    });
    const remaining = createSoundOrb({
      id: 'remaining',
      soundId: 'bass-warm',
      role: 'bass',
      position: { x: 0.78, y: 0.5 },
    });
    const world = createEmptyWorld({
      soundOrbs: [follower, remaining],
    });

    const frame = evaluateMotionFrame(world, 2);
    const position = frame.get('follower');

    expect(position).toBeDefined();
    expect(position).not.toEqual(follower.position);
  });

  it('copies source movement delta onto the target anchor', () => {
    const source = createSoundOrb({
      id: 'source',
      soundId: 'melody-soft-pluck',
      role: 'melody',
      position: { x: 0.3, y: 0.3 },
      motion: createMotion({
        mode: 'orbit',
        speed: 'medium',
        range: 'tight',
        seed: 14,
      }),
    });
    const target = createSoundOrb({
      id: 'target',
      soundId: 'harmony-dream',
      role: 'harmony',
      position: { x: 0.7, y: 0.65 },
    });
    const world = createEmptyWorld({
      soundOrbs: [source, target],
      links: [
        createLink({
          id: 'copy',
          type: 'copy-movement',
          sourceOrbId: 'source',
          targetOrbId: 'target',
        }),
      ],
    });

    const frame = evaluateMotionFrame(world, 3);
    const sourcePosition = frame.get('source')!;
    const targetPosition = frame.get('target')!;

    expect(targetPosition.x - target.position.x).toBeCloseTo(
      sourcePosition.x - source.position.x,
    );
    expect(targetPosition.y - target.position.y).toBeCloseTo(
      sourcePosition.y - source.position.y,
    );
  });

  it('does not start the frame loop for a static Copy Movement pair', () => {
    const source = createSoundOrb({
      id: 'source',
      soundId: 'beat-round-kick',
      role: 'beat',
      position: { x: 0.3, y: 0.5 },
    });
    const target = createSoundOrb({
      id: 'target',
      soundId: 'bass-warm',
      role: 'bass',
      position: { x: 0.7, y: 0.5 },
    });
    const world = createEmptyWorld({
      soundOrbs: [source, target],
      links: [
        createLink({
          id: 'copy',
          type: 'copy-movement',
          sourceOrbId: 'source',
          targetOrbId: 'target',
        }),
      ],
    });

    expect(worldHasActiveMotion(world)).toBe(false);
  });

  it('Spinner rotates a point inside its radius', () => {
    const toy = createPlaygroundToy({
      id: 'spinner',
      type: 'spinner',
      position: { x: 0.5, y: 0.5 },
      radius: 0.2,
      strength: 0.8,
    });
    const point = { x: 0.6, y: 0.5 };

    expect(applyPlaygroundToys(point, [toy], 2)).not.toEqual(point);
  });

  it('Magnet reduces distance and Repulsor increases it', () => {
    const point = { x: 0.6, y: 0.5 };
    const center = { x: 0.5, y: 0.5 };
    const magnet = createPlaygroundToy({
      id: 'magnet',
      type: 'magnet',
      position: center,
      radius: 0.2,
      strength: 0.8,
    });
    const repulsor = createPlaygroundToy({
      id: 'repulsor',
      type: 'repulsor',
      position: center,
      radius: 0.2,
      strength: 0.8,
    });

    const magnetResult = applyPlaygroundToys(point, [magnet], 1);
    const repulsorResult = applyPlaygroundToys(point, [repulsor], 1);

    expect(Math.hypot(
      magnetResult.x - center.x,
      magnetResult.y - center.y,
    )).toBeLessThan(0.1);

    expect(Math.hypot(
      repulsorResult.x - center.x,
      repulsorResult.y - center.y,
    )).toBeGreaterThan(0.1);
  });

  it('Portal maps entry space near its exit', () => {
    const portal = createPlaygroundToy({
      id: 'portal',
      type: 'portal',
      position: { x: 0.2, y: 0.2 },
      exitPosition: { x: 0.8, y: 0.7 },
      radius: 0.15,
    });
    const result = applyPlaygroundToys(
      { x: 0.21, y: 0.2 },
      [portal],
      1,
    );

    expect(result.x).toBeGreaterThan(0.7);
    expect(result.y).toBeGreaterThan(0.6);
  });

  it('leaves points outside toys unchanged', () => {
    const magnet = createPlaygroundToy({
      id: 'magnet',
      type: 'magnet',
      position: { x: 0.1, y: 0.1 },
      radius: 0.1,
    });
    const point = { x: 0.8, y: 0.8 };

    expect(applyPlaygroundToys(point, [magnet], 10)).toEqual(point);
  });
});
