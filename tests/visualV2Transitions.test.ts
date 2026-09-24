import { describe, expect, it } from 'vitest';
import {
  buildWorldTransition,
  detectPortalTransition,
  deriveTransitionFrame,
} from '../src/core/visual/v2/TransitionModel';
import { VisualEventBridge } from '../src/core/visual/v2/VisualEventBridge';
import { addEffectField } from '../src/core/world/EffectFieldActions';
import { addLink } from '../src/core/world/LinkActions';
import { addPlaygroundToy } from '../src/core/world/PlaygroundToyActions';
import {
  addSoundOrb,
  deleteSoundOrb,
  moveSoundOrb,
} from '../src/core/world/WorldActions';
import { createEmptyWorld, type WorldDocument } from '../src/core/world/World';
import { soundById } from '../src/core/sounds/coreCatalog';

const PREFS = {
  quality: 'high' as const,
  reduceMotion: false,
  reduceParticles: false,
  reduceBloom: false,
};

function addAt(
  world: WorldDocument,
  soundId: string,
  position: { x: number; y: number },
) {
  const sound = soundById(soundId);

  if (!sound) {
    throw new Error('Missing test sound: ' + soundId);
  }

  const result = addSoundOrb(world, sound);

  return {
    world: result.createdId
      ? moveSoundOrb(
          result.world,
          result.createdId,
          position,
        )
      : result.world,
    createdId: result.createdId,
  };
}

function worldWithObjects() {
  let world = createEmptyWorld({
    id: 'transition-world',
  });

  const first = addAt(
    world,
    'beat-round-kick',
    { x: 0.25, y: 0.4 },
  );
  world = first.world;
  const second = addAt(
    world,
    'bass-warm',
    { x: 0.7, y: 0.55 },
  );
  world = second.world;

  const heat = addEffectField(world, 'heat');
  world = heat.world;

  const magnet = addPlaygroundToy(world, 'magnet');
  world = magnet.world;

  const link = addLink(
    world,
    'pulse-together',
    first.createdId!,
    second.createdId!,
  );
  world = link.world;

  return {
    world,
    firstId: first.createdId!,
    secondId: second.createdId!,
    fieldId: heat.createdId!,
    toyId: magnet.createdId!,
    linkId: link.createdId!,
  };
}

describe('Visual V2 state transition payloads', () => {
  it('builds deterministic targeted Magic transitions', () => {
    const { world, firstId } = worldWithObjects();
    const changed = moveSoundOrb(
      world,
      firstId,
      { x: 0.5, y: 0.25 },
    );

    const transition = buildWorldTransition(
      'magic',
      world,
      changed,
      12345,
      0.8,
      'orb:' + firstId,
    );

    expect(transition.kind).toBe('magic');
    expect(transition.key).toBe('world');
    expect(transition.seed).toBe(12345);
    expect(transition.intensity).toBeCloseTo(0.8);
    expect(transition.nodes).toHaveLength(1);
    expect(transition.nodes[0]?.id).toBe('orb:' + firstId);
    expect(transition.nodes[0]?.from).toEqual({ x: 0.25, y: 0.4 });
    expect(transition.nodes[0]?.to).toEqual({ x: 0.5, y: 0.25 });
  });

  it('includes Orb, Field, toy and Link continuity in full-world Snapshot morphs', () => {
    const { world } = worldWithObjects();

    const transition = buildWorldTransition(
      'snapshot',
      world,
      world,
      77,
      0.84,
    );

    const kinds = new Set(
      transition.nodes.map((node) => node.kind),
    );

    expect(kinds.has('orb')).toBe(true);
    expect(kinds.has('field')).toBe(true);
    expect(kinds.has('toy')).toBe(true);
    expect(kinds.has('link')).toBe(true);
  });

  it('keeps delete transitions focused on the removed object', () => {
    const { world, firstId } = worldWithObjects();
    const after = deleteSoundOrb(world, firstId);

    const transition = buildWorldTransition(
      'delete',
      world,
      after,
      undefined,
      0.82,
      'orb:' + firstId,
    );

    expect(transition.key).toBe('delete:orb:' + firstId);
    expect(transition.nodes).toHaveLength(1);
    expect(transition.nodes[0]?.from).not.toBeNull();
    expect(transition.nodes[0]?.to).toBeNull();
  });

  it('keeps undo/redo nodes even when geometry is unchanged', () => {
    const { world } = worldWithObjects();

    const undo = buildWorldTransition(
      'undo',
      world,
      world,
    );
    const redo = buildWorldTransition(
      'redo',
      world,
      world,
    );

    expect(undo.nodes.length).toBeGreaterThan(0);
    expect(redo.nodes.length).toBeGreaterThan(0);
  });

  it('caps captured nodes in dense worlds', () => {
    let world = createEmptyWorld({
      id: 'dense-transition',
    });

    for (let index = 0; index < 12; index += 1) {
      world = addAt(
        world,
        index % 2 === 0
          ? 'beat-round-kick'
          : 'melody-soft-pluck',
        {
          x: 0.08 + (index % 4) * 0.22,
          y: 0.15 + Math.floor(index / 4) * 0.25,
        },
      ).world;
    }

    for (const type of ['space', 'echo', 'heat', 'frost', 'filter'] as const) {
      world = addEffectField(world, type).world;
    }

    for (const type of ['spinner', 'magnet', 'repulsor', 'portal'] as const) {
      world = addPlaygroundToy(world, type).world;
    }

    const transition = buildWorldTransition(
      'snapshot',
      world,
      world,
    );

    expect(transition.nodes.length).toBeLessThanOrEqual(18);
  });
});

describe('Visual V2 Portal transitions', () => {
  it('detects a real entry-to-exit Portal jump', () => {
    let world = createEmptyWorld({
      id: 'portal-world',
    });
    const portalResult = addPlaygroundToy(
      world,
      'portal',
    );
    world = portalResult.world;
    const portal = world.playgroundToys.find(
      (toy) => toy.id === portalResult.createdId,
    )!;

    const transition = detectPortalTransition(
      'orb',
      {
        x: portal.position.x + 0.01,
        y: portal.position.y,
      },
      {
        x: portal.exitPosition!.x + 0.01,
        y: portal.exitPosition!.y,
      },
      world.playgroundToys,
    );

    expect(transition?.kind).toBe('portal');
    expect(transition?.key).toBe('portal:orb');
    expect(transition?.nodes).toHaveLength(1);
    expect(transition?.intensity).toBeGreaterThan(0.5);
  });

  it('ignores large jumps that are not aligned with a Portal pair', () => {
    let world = createEmptyWorld();
    world = addPlaygroundToy(world, 'portal').world;

    expect(
      detectPortalTransition(
        'orb',
        { x: 0.02, y: 0.02 },
        { x: 0.95, y: 0.95 },
        world.playgroundToys,
      ),
    ).toBeNull();
  });

  it('ignores small ordinary motion', () => {
    expect(
      detectPortalTransition(
        'orb',
        { x: 0.3, y: 0.3 },
        { x: 0.34, y: 0.32 },
        [],
      ),
    ).toBeNull();
  });
});

describe('Visual V2 transition frames', () => {
  it('creates Magic world wave, morph beam and local light', () => {
    const { world, firstId } = worldWithObjects();
    const after = moveSoundOrb(
      world,
      firstId,
      { x: 0.55, y: 0.3 },
    );
    const transition = buildWorldTransition(
      'magic',
      world,
      after,
      42,
      1,
      'orb:' + firstId,
    );

    const frame = deriveTransitionFrame(
      [{
        event: {
          kind: 'state-transition',
          transition,
        },
        progress: 0.4,
      }],
      PREFS,
    );

    expect(frame.worldEnergy).toBeGreaterThan(0);
    expect(frame.beams.length).toBeGreaterThan(0);
    expect(frame.lights.length).toBeGreaterThan(0);
  });

  it('uses dissolve for delete and reconstruction for undo', () => {
    const { world, firstId } = worldWithObjects();
    const deleted = deleteSoundOrb(world, firstId);

    const deleteFrame = deriveTransitionFrame(
      [{
        event: {
          kind: 'state-transition',
          transition: buildWorldTransition(
            'delete',
            world,
            deleted,
            undefined,
            1,
            'orb:' + firstId,
          ),
        },
        progress: 0.2,
      }],
      PREFS,
    );
    const undoFrame = deriveTransitionFrame(
      [{
        event: {
          kind: 'state-transition',
          transition: buildWorldTransition(
            'undo',
            deleted,
            world,
          ),
        },
        progress: 0.4,
      }],
      PREFS,
    );

    expect(deleteFrame.dissolve).toBeGreaterThan(0);
    expect(undoFrame.reconstruct).toBeGreaterThan(0);
  });

  it('removes travel beams under Reduce Motion while retaining state light', () => {
    const { world, firstId } = worldWithObjects();
    const after = moveSoundOrb(
      world,
      firstId,
      { x: 0.6, y: 0.3 },
    );
    const transition = buildWorldTransition(
      'snapshot',
      world,
      after,
    );

    const frame = deriveTransitionFrame(
      [{
        event: {
          kind: 'state-transition',
          transition,
        },
        progress: 0.35,
      }],
      {
        ...PREFS,
        reduceMotion: true,
      },
    );

    expect(frame.beams).toHaveLength(0);
    expect(frame.lights.length).toBeGreaterThan(0);
    expect(frame.worldEnergy).toBeGreaterThan(0);
  });

  it('caps transition beams and lights by quality', () => {
    let world = createEmptyWorld();

    for (let index = 0; index < 12; index += 1) {
      world = addAt(
        world,
        'melody-soft-pluck',
        {
          x: 0.08 + (index % 4) * 0.22,
          y: 0.1 + Math.floor(index / 4) * 0.25,
        },
      ).world;
    }

    let moved = world;

    for (const orb of world.soundOrbs) {
      moved = moveSoundOrb(
        moved,
        orb.id,
        {
          x: Math.min(0.95, orb.position.x + 0.08),
          y: Math.min(0.95, orb.position.y + 0.04),
        },
      );
    }

    const transition = buildWorldTransition(
      'snapshot',
      world,
      moved,
    );
    const high = deriveTransitionFrame(
      [{
        event: { kind: 'state-transition', transition },
        progress: 0.25,
      }],
      PREFS,
    );
    const battery = deriveTransitionFrame(
      [{
        event: { kind: 'state-transition', transition },
        progress: 0.25,
      }],
      {
        ...PREFS,
        quality: 'battery',
      },
    );

    expect(high.beams.length).toBeLessThanOrEqual(12);
    expect(high.lights.length).toBeLessThanOrEqual(12);
    expect(battery.beams.length).toBeLessThanOrEqual(7);
    expect(battery.lights.length).toBeLessThanOrEqual(8);
  });
});

describe('Visual V2 transition priority and lifecycle', () => {
  it('coalesces repeated Portal transfer for the same Orb', () => {
    const bridge = new VisualEventBridge();
    const base = {
      kind: 'portal' as const,
      key: 'portal:orb',
      priority: 1,
      seed: 1,
      intensity: 1,
      origin: { x: 0.4, y: 0.4 },
      nodes: [],
    };

    bridge.emit({
      kind: 'state-transition',
      transition: base,
    }, 0);
    bridge.emit({
      kind: 'state-transition',
      transition: {
        ...base,
        seed: 2,
      },
    }, 20);

    const transitions = bridge.sample(20).samples.filter(
      (sample) => sample.event.kind === 'state-transition',
    );

    expect(transitions).toHaveLength(1);
    if (transitions[0]?.event.kind === 'state-transition') {
      expect(transitions[0].event.transition.seed).toBe(2);
    }
  });

  it('world-level Magic cancels lower-priority transition clutter', () => {
    const bridge = new VisualEventBridge();

    bridge.emit({
      kind: 'state-transition',
      transition: {
        kind: 'portal',
        key: 'portal:orb',
        priority: 1,
        seed: 1,
        intensity: 1,
        origin: { x: 0.4, y: 0.4 },
        nodes: [],
      },
    }, 0);
    bridge.emit({
      kind: 'state-transition',
      transition: {
        kind: 'magic',
        key: 'world',
        priority: 5,
        seed: 2,
        intensity: 1,
        origin: { x: 0.5, y: 0.5 },
        nodes: [],
      },
    }, 20);

    const transitions = bridge.sample(20).samples.filter(
      (sample) => sample.event.kind === 'state-transition',
    );

    expect(transitions).toHaveLength(1);
    if (transitions[0]?.event.kind === 'state-transition') {
      expect(transitions[0].event.transition.kind).toBe('magic');
    }
  });

  it('expires transition events automatically', () => {
    const bridge = new VisualEventBridge();

    bridge.emit({
      kind: 'state-transition',
      transition: {
        kind: 'delete',
        key: 'delete:orb:x',
        priority: 2,
        seed: 1,
        intensity: 1,
        origin: { x: 0.5, y: 0.5 },
        nodes: [],
      },
    }, 100);

    expect(bridge.sample(500).samples).toHaveLength(1);
    expect(bridge.sample(800).samples).toHaveLength(0);
  });
});
