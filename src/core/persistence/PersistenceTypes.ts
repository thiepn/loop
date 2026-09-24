import type { WorldDocument } from '../world/World';
import type { WorldVisualIdentity } from '../world/WorldVisualIdentity';

export type PersistenceStatus = 'loading' | 'ready' | 'error';
export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface StoredWorldRecord {
  readonly id: string;
  readonly world: unknown;
  readonly lastOpenedAt: number;
  readonly deletedAt: number | null;
}

export interface WorldLibraryItem {
  readonly id: string;
  readonly name: string;
  readonly updatedAt: number;
  readonly lastOpenedAt: number;
  readonly deletedAt: number | null;
  readonly snapshotCount: number;
  readonly visual: WorldVisualIdentity;
}

export interface QuarantineRecord {
  readonly id: string;
  readonly raw: unknown;
  readonly reason: string;
  readonly detectedAt: number;
}

export interface PersistenceMeta {
  readonly key: 'active-world';
  readonly worldId: string | null;
}

export interface WorldStorage {
  listWorldRecords(): Promise<readonly StoredWorldRecord[]>;
  getWorldRecord(id: string): Promise<StoredWorldRecord | null>;
  putWorldRecord(record: StoredWorldRecord): Promise<void>;
  deleteWorldRecord(id: string): Promise<void>;
  getActiveWorldId(): Promise<string | null>;
  setActiveWorldId(id: string | null): Promise<void>;
  putQuarantineRecord(record: QuarantineRecord): Promise<void>;
}

export interface LoadedWorld {
  readonly world: WorldDocument;
  readonly warnings: readonly string[];
  readonly lastOpenedAt: number;
  readonly deletedAt: number | null;
}
