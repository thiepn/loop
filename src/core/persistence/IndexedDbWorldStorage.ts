import {
  classifyPersistenceError,
} from './PersistenceError';
import type {
  PersistenceMeta,
  QuarantineRecord,
  StoredWorldRecord,
  WorldStorage,
} from './PersistenceTypes';

const DB_NAME = 'loop-local';
const DB_VERSION = 1;
const WORLDS_STORE = 'worlds';
const META_STORE = 'meta';
const QUARANTINE_STORE = 'quarantine';

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result), { once: true });
    request.addEventListener('error', () => reject(request.error), { once: true });
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.addEventListener('complete', () => resolve(), { once: true });
    transaction.addEventListener('abort', () => reject(transaction.error), { once: true });
    transaction.addEventListener('error', () => reject(transaction.error), { once: true });
  });
}

export class IndexedDbWorldStorage implements WorldStorage {
  private databasePromise: Promise<IDBDatabase> | null = null;

  public async listWorldRecords(): Promise<readonly StoredWorldRecord[]> {
    return this.run(async (database) => {
      const transaction = database.transaction(WORLDS_STORE, 'readonly');
      const done = transactionDone(transaction);
      const request = transaction.objectStore(WORLDS_STORE).getAll();
      const records = await requestResult(request) as StoredWorldRecord[];
      await done;
      return records;
    });
  }

  public async getWorldRecord(id: string): Promise<StoredWorldRecord | null> {
    return this.run(async (database) => {
      const transaction = database.transaction(WORLDS_STORE, 'readonly');
      const done = transactionDone(transaction);
      const request = transaction.objectStore(WORLDS_STORE).get(id);
      const record = await requestResult(request) as StoredWorldRecord | undefined;
      await done;
      return record ?? null;
    });
  }

  public async putWorldRecord(record: StoredWorldRecord): Promise<void> {
    await this.run(async (database) => {
      const transaction = database.transaction(WORLDS_STORE, 'readwrite');
      const done = transactionDone(transaction);
      transaction.objectStore(WORLDS_STORE).put(record);
      await done;
    });
  }

  public async deleteWorldRecord(id: string): Promise<void> {
    await this.run(async (database) => {
      const transaction = database.transaction(WORLDS_STORE, 'readwrite');
      const done = transactionDone(transaction);
      transaction.objectStore(WORLDS_STORE).delete(id);
      await done;
    });
  }

  public async getActiveWorldId(): Promise<string | null> {
    return this.run(async (database) => {
      const transaction = database.transaction(META_STORE, 'readonly');
      const done = transactionDone(transaction);
      const request = transaction.objectStore(META_STORE).get('active-world');
      const meta = await requestResult(request) as PersistenceMeta | undefined;
      await done;
      return meta?.worldId ?? null;
    });
  }

  public async setActiveWorldId(id: string | null): Promise<void> {
    await this.run(async (database) => {
      const transaction = database.transaction(META_STORE, 'readwrite');
      const done = transactionDone(transaction);
      const meta: PersistenceMeta = {
        key: 'active-world',
        worldId: id,
      };
      transaction.objectStore(META_STORE).put(meta);
      await done;
    });
  }

  public async putQuarantineRecord(record: QuarantineRecord): Promise<void> {
    await this.run(async (database) => {
      const transaction = database.transaction(QUARANTINE_STORE, 'readwrite');
      const done = transactionDone(transaction);
      transaction.objectStore(QUARANTINE_STORE).put(record);
      await done;
    });
  }

  public close(): void {
    void this.databasePromise?.then((database) => database.close());
    this.databasePromise = null;
  }

  private async run<T>(
    operation: (database: IDBDatabase) => Promise<T>,
  ): Promise<T> {
    try {
      const database = await this.openDatabase();
      return await operation(database);
    } catch (error) {
      throw classifyPersistenceError(error);
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    if (!('indexedDB' in globalThis)) {
      return Promise.reject(
        classifyPersistenceError(
          new DOMException('IndexedDB is not available.', 'NotSupportedError'),
        ),
      );
    }

    this.databasePromise ??= new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.addEventListener('upgradeneeded', () => {
        const database = request.result;

        if (!database.objectStoreNames.contains(WORLDS_STORE)) {
          database.createObjectStore(WORLDS_STORE, { keyPath: 'id' });
        }

        if (!database.objectStoreNames.contains(META_STORE)) {
          database.createObjectStore(META_STORE, { keyPath: 'key' });
        }

        if (!database.objectStoreNames.contains(QUARANTINE_STORE)) {
          database.createObjectStore(QUARANTINE_STORE, { keyPath: 'id' });
        }
      });

      request.addEventListener('success', () => {
        const database = request.result;
        database.addEventListener('versionchange', () => database.close());
        resolve(database);
      }, { once: true });
      request.addEventListener('error', () => reject(request.error), { once: true });
      request.addEventListener('blocked', () => {
        reject(new DOMException('Loop storage upgrade is blocked.', 'InvalidStateError'));
      }, { once: true });
    });

    return this.databasePromise;
  }
}
