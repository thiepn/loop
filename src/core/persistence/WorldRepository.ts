import {
  duplicateWorldDocument,
} from '../world/WorldLibraryActions';
import type { WorldDocument } from '../world/World';
import {
  classifyPersistenceError,
  PersistenceError,
} from './PersistenceError';
import type {
  LoadedWorld,
  QuarantineRecord,
  StoredWorldRecord,
  WorldLibraryItem,
  WorldStorage,
} from './PersistenceTypes';
import {
  migrateWorldDocument,
} from './WorldMigration';

export class WorldRepository {
  public constructor(
    private readonly storage: WorldStorage,
  ) {}

  public async listLibrary(): Promise<readonly WorldLibraryItem[]> {
    const records = await this.storage.listWorldRecords();
    const items: WorldLibraryItem[] = [];

    for (const record of records) {
      try {
        const migrated = migrateWorldDocument(record.world);
        this.assertRecordIdentity(record, migrated.world);

        items.push({
          id: migrated.world.id,
          name: migrated.world.name,
          updatedAt: migrated.world.updatedAt,
          lastOpenedAt: record.lastOpenedAt,
          deletedAt: record.deletedAt,
          snapshotCount: migrated.world.snapshots.length,
        });
      } catch (error) {
        await this.quarantine(record, error);
      }
    }

    return items.sort((a, b) => {
      if (a.deletedAt !== null && b.deletedAt === null) {
        return 1;
      }

      if (a.deletedAt === null && b.deletedAt !== null) {
        return -1;
      }

      return Math.max(b.lastOpenedAt, b.updatedAt)
        - Math.max(a.lastOpenedAt, a.updatedAt);
    });
  }

  public async loadWorld(
    id: string,
    now = Date.now(),
    includeDeleted = false,
    markOpened = true,
  ): Promise<LoadedWorld | null> {
    const record = await this.storage.getWorldRecord(id);

    if (!record || (!includeDeleted && record.deletedAt !== null)) {
      return null;
    }

    let migrated;

    try {
      migrated = migrateWorldDocument(record.world);
      this.assertRecordIdentity(record, migrated.world);
    } catch (error) {
      await this.quarantine(record, error);
      return null;
    }

    const migratedRecord: StoredWorldRecord = {
      id: migrated.world.id,
      world: migrated.world,
      lastOpenedAt: markOpened ? now : record.lastOpenedAt,
      deletedAt: record.deletedAt,
    };

    try {
      await this.storage.putWorldRecord(migratedRecord);
    } catch (error) {
      throw classifyPersistenceError(error);
    }

    return {
      world: migrated.world,
      warnings: migrated.warnings,
      lastOpenedAt: markOpened ? now : record.lastOpenedAt,
      deletedAt: record.deletedAt,
    };
  }

  public async loadActiveWorld(
    now = Date.now(),
  ): Promise<LoadedWorld | null> {
    const activeId = await this.storage.getActiveWorldId();

    if (!activeId) {
      return null;
    }

    const loaded = await this.loadWorld(activeId, now);

    if (!loaded) {
      await this.storage.setActiveWorldId(null);
      return null;
    }

    return loaded;
  }

  public async saveWorld(
    world: WorldDocument,
    now = Date.now(),
  ): Promise<void> {
    try {
      await this.storage.putWorldRecord({
        id: world.id,
        world,
        lastOpenedAt: now,
        deletedAt: null,
      });
    } catch (error) {
      throw classifyPersistenceError(error);
    }
  }

  public async setActiveWorld(id: string | null): Promise<void> {
    try {
      await this.storage.setActiveWorldId(id);
    } catch (error) {
      throw classifyPersistenceError(error);
    }
  }

  public async trashWorld(
    id: string,
    now = Date.now(),
  ): Promise<boolean> {
    const record = await this.storage.getWorldRecord(id);

    if (!record) {
      return false;
    }

    await this.storage.putWorldRecord({
      ...record,
      deletedAt: now,
    });

    if (await this.storage.getActiveWorldId() === id) {
      await this.storage.setActiveWorldId(null);
    }

    return true;
  }

  public async restoreWorld(id: string): Promise<boolean> {
    const record = await this.storage.getWorldRecord(id);

    if (!record || record.deletedAt === null) {
      return false;
    }

    await this.storage.putWorldRecord({
      ...record,
      deletedAt: null,
    });

    return true;
  }

  public async purgeWorld(id: string): Promise<boolean> {
    const record = await this.storage.getWorldRecord(id);

    if (!record) {
      return false;
    }

    await this.storage.deleteWorldRecord(id);

    if (await this.storage.getActiveWorldId() === id) {
      await this.storage.setActiveWorldId(null);
    }

    return true;
  }

  public async duplicateWorld(
    id: string,
    now = Date.now(),
  ): Promise<WorldDocument | null> {
    const loaded = await this.loadWorld(id, now, true);

    if (!loaded) {
      return null;
    }

    const duplicate = duplicateWorldDocument(
      loaded.world,
      undefined,
      now,
    );

    await this.saveWorld(duplicate, now);
    return duplicate;
  }

  public async importWorlds(
    worlds: readonly WorldDocument[],
    now = Date.now(),
  ): Promise<readonly WorldDocument[]> {
    const imported: WorldDocument[] = [];

    for (const [index, world] of worlds.entries()) {
      const copy = duplicateWorldDocument(
        world,
        `${world.name} Imported`,
        now + index,
      );
      await this.saveWorld(copy, now + index);
      imported.push(copy);
    }

    return imported;
  }

  private assertRecordIdentity(
    record: StoredWorldRecord,
    world: WorldDocument,
  ): void {
    if (record.id === world.id) {
      return;
    }

    throw new PersistenceError(
      'corrupt',
      `Stored World key ${record.id} does not match document id ${world.id}.`,
    );
  }

  private async quarantine(
    record: StoredWorldRecord,
    error: unknown,
  ): Promise<void> {
    const classified = classifyPersistenceError(error);
    const quarantine: QuarantineRecord = {
      id: `${record.id}-${Date.now().toString(36)}`,
      raw: record.world,
      reason: classified.message,
      detectedAt: Date.now(),
    };

    try {
      await this.storage.putQuarantineRecord(quarantine);
    } catch {
      // Quarantine is best-effort; the corrupt primary record still needs removal.
    }

    try {
      await this.storage.deleteWorldRecord(record.id);
    } catch {
      throw new PersistenceError(
        'corrupt',
        `World ${record.id} is corrupt and could not be isolated.`,
        { cause: error },
      );
    }

    try {
      if (await this.storage.getActiveWorldId() === record.id) {
        await this.storage.setActiveWorldId(null);
      }
    } catch {
      // A stale active pointer is recoverable on the next active-World load.
    }
  }
}
