import { describe, expect, it } from 'vitest';
import { MemoryWorldStorage } from '../src/core/persistence/MemoryWorldStorage';
import { WorldRepository } from '../src/core/persistence/WorldRepository';
import { createStarterWorld } from '../src/core/world/StarterWorlds';

describe('WorldRepository', () => {
  it('saves lists activates and restores a World', async () => {
    const storage = new MemoryWorldStorage();
    const repository = new WorldRepository(storage);
    const world = createStarterWorld('beat', 100);

    await repository.saveWorld(world, 200);
    await repository.setActiveWorld(world.id);

    const library = await repository.listLibrary();
    const active = await repository.loadActiveWorld(300);

    expect(library).toHaveLength(1);
    expect(library[0]).toMatchObject({
      id: world.id,
      name: world.name,
      deletedAt: null,
    });
    expect(active?.world).toEqual(world);
    expect(active?.lastOpenedAt).toBe(300);
  });

  it('moves Worlds to Trash restores them and purges permanently', async () => {
    const storage = new MemoryWorldStorage();
    const repository = new WorldRepository(storage);
    const world = createStarterWorld('chill', 100);

    await repository.saveWorld(world, 200);
    await repository.setActiveWorld(world.id);
    expect(await repository.trashWorld(world.id, 300)).toBe(true);

    expect(await repository.loadActiveWorld(400)).toBeNull();

    let library = await repository.listLibrary();
    expect(library[0]?.deletedAt).toBe(300);

    expect(await repository.restoreWorld(world.id)).toBe(true);
    library = await repository.listLibrary();
    expect(library[0]?.deletedAt).toBeNull();

    expect(await repository.purgeWorld(world.id)).toBe(true);
    expect(await repository.listLibrary()).toEqual([]);
  });

  it('duplicates and imports as new World identities', async () => {
    const storage = new MemoryWorldStorage();
    const repository = new WorldRepository(storage);
    const world = createStarterWorld('dreamy', 100);

    await repository.saveWorld(world, 200);

    const duplicate = await repository.duplicateWorld(world.id, 300);
    const imported = await repository.importWorlds([world], 400);
    const library = await repository.listLibrary();

    expect(duplicate).not.toBeNull();
    expect(duplicate?.id).not.toBe(world.id);
    expect(imported[0]?.id).not.toBe(world.id);
    expect(imported[0]?.name).toContain('Imported');
    expect(library).toHaveLength(3);
  });

  it('quarantines and removes an unrecoverable stored World', async () => {
    const storage = new MemoryWorldStorage();
    const repository = new WorldRepository(storage);

    await storage.putWorldRecord({
      id: 'broken',
      world: {
        schemaVersion: 8,
        name: 'Missing id',
      },
      lastOpenedAt: 100,
      deletedAt: null,
    });

    const library = await repository.listLibrary();

    expect(library).toEqual([]);
    expect(storage.getQuarantineRecords()).toHaveLength(1);
    expect(await storage.getWorldRecord('broken')).toBeNull();
  });

  it('quarantines a record whose storage key disagrees with its World id', async () => {
    const storage = new MemoryWorldStorage();
    const repository = new WorldRepository(storage);
    const world = createStarterWorld('beat', 100);

    await storage.putWorldRecord({
      id: 'wrong-storage-key',
      world,
      lastOpenedAt: 200,
      deletedAt: null,
    });
    await storage.setActiveWorldId('wrong-storage-key');

    const library = await repository.listLibrary();

    expect(library).toEqual([]);
    expect(storage.getQuarantineRecords()).toHaveLength(1);
    expect(await storage.getWorldRecord('wrong-storage-key')).toBeNull();
    expect(await storage.getActiveWorldId()).toBeNull();
  });

  it('can read without changing last-opened metadata', async () => {
    const storage = new MemoryWorldStorage();
    const repository = new WorldRepository(storage);
    const world = createStarterWorld('beat', 100);

    await repository.saveWorld(world, 200);
    const loaded = await repository.loadWorld(
      world.id,
      999,
      false,
      false,
    );

    expect(loaded?.lastOpenedAt).toBe(200);

    const library = await repository.listLibrary();
    expect(library[0]?.lastOpenedAt).toBe(200);
  });
});
