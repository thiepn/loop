import type {
  PersistenceMeta,
  QuarantineRecord,
  StoredWorldRecord,
  WorldStorage,
} from './PersistenceTypes';

export class MemoryWorldStorage implements WorldStorage {
  private readonly worlds = new Map<string, StoredWorldRecord>();
  private readonly quarantine = new Map<string, QuarantineRecord>();
  private meta: PersistenceMeta = {
    key: 'active-world',
    worldId: null,
  };

  public async listWorldRecords(): Promise<readonly StoredWorldRecord[]> {
    return [...this.worlds.values()];
  }

  public async getWorldRecord(id: string): Promise<StoredWorldRecord | null> {
    return this.worlds.get(id) ?? null;
  }

  public async putWorldRecord(record: StoredWorldRecord): Promise<void> {
    this.worlds.set(record.id, record);
  }

  public async deleteWorldRecord(id: string): Promise<void> {
    this.worlds.delete(id);
  }

  public async getActiveWorldId(): Promise<string | null> {
    return this.meta.worldId;
  }

  public async setActiveWorldId(id: string | null): Promise<void> {
    this.meta = {
      key: 'active-world',
      worldId: id,
    };
  }

  public async putQuarantineRecord(record: QuarantineRecord): Promise<void> {
    this.quarantine.set(record.id, record);
  }

  public getQuarantineRecords(): readonly QuarantineRecord[] {
    return [...this.quarantine.values()];
  }
}
