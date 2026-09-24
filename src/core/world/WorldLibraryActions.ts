import { createWorldId, type WorldDocument } from './World';

export function renameWorld(
  world: WorldDocument,
  name: string,
  now = Date.now(),
): WorldDocument {
  const cleanName = name.trim();

  if (!cleanName || cleanName === world.name) {
    return world;
  }

  return {
    ...world,
    name: cleanName,
    updatedAt: now,
  };
}

export function duplicateWorldDocument(
  world: WorldDocument,
  name?: string,
  now = Date.now(),
): WorldDocument {
  return {
    ...world,
    id: createWorldId(),
    name: name?.trim() || `${world.name} Copy`,
    createdAt: now,
    updatedAt: now,
  };
}
