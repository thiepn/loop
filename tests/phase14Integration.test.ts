import { describe, expect, it } from 'vitest';
import {
  decodeLoopBackup,
  encodeLoopBackup,
} from '../src/core/persistence/Backup';
import { MemoryWorldStorage } from '../src/core/persistence/MemoryWorldStorage';
import { WorldRepository } from '../src/core/persistence/WorldRepository';
import { WorldHistory } from '../src/core/state/WorldHistory';
import { evaluateMotionFrame } from '../src/core/music/MotionEngine';
import { addEffectField } from '../src/core/world/EffectFieldActions';
import { addLink, validateLinkCandidate } from '../src/core/world/LinkActions';
import { mutateWithMagic } from '../src/core/world/Magic';
import { setOrbMotionMode } from '../src/core/world/MotionActions';
import { addPlaygroundToy } from '../src/core/world/PlaygroundToyActions';
import { addSnapshot, recallSnapshot } from '../src/core/world/Snapshot';
import { createSoundOrb } from '../src/core/world/SoundOrb';
import { createEmptyWorld } from '../src/core/world/World';

function createIntegratedWorld() {
  let world = createEmptyWorld({
    id: 'phase-14-integrated',
    now: 100,
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
        position: { x: 0.42, y: 0.58 },
      }),
      createSoundOrb({
        id: 'melody',
        soundId: 'melody-soft-pluck',
        role: 'melody',
        position: { x: 0.7, y: 0.36 },
      }),
      createSoundOrb({
        id: 'harmony',
        soundId: 'harmony-dream',
        role: 'harmony',
        position: { x: 0.76, y: 0.68 },
      }),
    ],
  });

  world = addEffectField(world, 'space', 110).world;
  world = addPlaygroundToy(world, 'spinner', 120).world;
  world = setOrbMotionMode(world, 'melody', 'orbit', 130);
  world = addLink(
    world,
    'kick-pushes-bass',
    'kick',
    'bass',
    140,
  ).world;
  world = addLink(
    world,
    'copy-movement',
    'melody',
    'harmony',
    150,
  ).world;

  return addSnapshot(world, 'Known good', 160).world;
}

describe('Phase 14 cross-system integrity', () => {
  it('preserves one integrated World through Magic backup Trash restore Snapshot and history', async () => {
    const base = createIntegratedWorld();
    const history = new WorldHistory(base);
    const magic = mutateWithMagic(
      base,
      { kind: 'world' },
      {
        intent: 'stranger',
        strength: 'wild',
        attempt: 1,
        now: 200,
      },
    ).world;

    history.record(magic);

    const frame = evaluateMotionFrame(magic, 3.5);
    expect(frame.size).toBe(magic.soundOrbs.length);

    for (const link of magic.links) {
      const withoutCurrent = {
        ...magic,
        links: magic.links.filter(
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

    const decoded = decodeLoopBackup(
      encodeLoopBackup([magic], 220),
    );
    expect(decoded.warnings).toEqual([]);
    expect(decoded.worlds[0]).toEqual(magic);

    const storage = new MemoryWorldStorage();
    const repository = new WorldRepository(storage);
    await repository.saveWorld(decoded.worlds[0]!, 230);
    await repository.setActiveWorld(magic.id);

    expect(await repository.trashWorld(magic.id, 240)).toBe(true);
    expect(await repository.loadActiveWorld(250)).toBeNull();

    expect(await repository.restoreWorld(magic.id)).toBe(true);
    const restored = await repository.loadWorld(
      magic.id,
      260,
      false,
      false,
    );

    expect(restored?.world).toEqual(magic);

    const recalled = recallSnapshot(
      restored!.world,
      restored!.world.snapshots[0]!.id,
      270,
    );

    expect(recalled.music).toEqual(base.music);
    expect(recalled.soundOrbs).toEqual(base.soundOrbs);
    expect(recalled.effectFields).toEqual(base.effectFields);
    expect(recalled.playgroundToys).toEqual(base.playgroundToys);
    expect(recalled.links).toEqual(base.links);

    expect(history.undo()).toBe(base);
    expect(history.redo()).toBe(magic);
  });
});
