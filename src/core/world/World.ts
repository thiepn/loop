export const WORLD_SCHEMA_VERSION = 1 as const;

export interface WorldDocument {
  readonly schemaVersion: typeof WORLD_SCHEMA_VERSION;
  readonly id: string;
  readonly name: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly soundOrbs: readonly string[];
  readonly effectFields: readonly string[];
  readonly links: readonly string[];
  readonly snapshots: readonly string[];
}

export interface CreateWorldOptions {
  readonly id?: string;
  readonly now?: number;
  readonly name?: string;
}

function createWorldId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `world-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyWorld(options: CreateWorldOptions = {}): WorldDocument {
  const now = options.now ?? Date.now();

  return {
    schemaVersion: WORLD_SCHEMA_VERSION,
    id: options.id ?? createWorldId(),
    name: options.name?.trim() || 'Untitled World',
    createdAt: now,
    updatedAt: now,
    soundOrbs: [],
    effectFields: [],
    links: [],
    snapshots: [],
  };
}
