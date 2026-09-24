import { describe, expect, it } from 'vitest';
import {
  MAX_SNAPSHOTS,
  addSnapshot,
  deleteSnapshot,
  recallSnapshot,
  renameSnapshot,
} from '../src/core/world/Snapshot';
import { createStarterWorld } from '../src/core/world/StarterWorlds';

describe('Snapshots', () => {
  it('captures playable state without recursive Snapshot state', () => {
    const world = createStarterWorld('dreamy', 100);
    const result = addSnapshot(world, 'Calm', 200);
    const snapshot = result.world.snapshots[0];

    expect(result.createdId).not.toBeNull();
    expect(snapshot?.name).toBe('Calm');
    expect(snapshot?.state.soundOrbs).toEqual(world.soundOrbs);
    expect(snapshot?.state.effectFields).toEqual(world.effectFields);
    expect('snapshots' in (snapshot?.state ?? {})).toBe(false);
  });

  it('recalls creative state while preserving World identity and Snapshot list', () => {
    const base = createStarterWorld('beat', 100);
    const saved = addSnapshot(base, 'Original', 200).world;
    const changed = {
      ...saved,
      name: 'Renamed World',
      updatedAt: 300,
      music: {
        ...saved.music,
        bpm: saved.music.bpm + 12,
      },
      soundOrbs: saved.soundOrbs.slice(1),
    };

    const recalled = recallSnapshot(
      changed,
      saved.snapshots[0]!.id,
      400,
    );

    expect(recalled.id).toBe(base.id);
    expect(recalled.name).toBe('Renamed World');
    expect(recalled.snapshots).toEqual(saved.snapshots);
    expect(recalled.music).toEqual(base.music);
    expect(recalled.soundOrbs).toEqual(base.soundOrbs);
    expect(recalled.updatedAt).toBe(400);
  });

  it('renames and deletes Snapshots immutably', () => {
    const added = addSnapshot(
      createStarterWorld('chill', 100),
      'First',
      200,
    ).world;
    const id = added.snapshots[0]!.id;
    const renamed = renameSnapshot(added, id, 'Soft', 300);
    const deleted = deleteSnapshot(renamed, id, 400);

    expect(added.snapshots[0]?.name).toBe('First');
    expect(renamed.snapshots[0]?.name).toBe('Soft');
    expect(deleted.snapshots).toHaveLength(0);
  });

  it('enforces the bounded Snapshot cap', () => {
    let world = createStarterWorld('beat', 100);

    for (let index = 0; index < MAX_SNAPSHOTS; index += 1) {
      world = addSnapshot(world, `S${index}`, 200 + index).world;
    }

    const blocked = addSnapshot(world, 'Too many', 999);

    expect(world.snapshots).toHaveLength(MAX_SNAPSHOTS);
    expect(blocked.createdId).toBeNull();
    expect(blocked.world).toBe(world);
  });
});
