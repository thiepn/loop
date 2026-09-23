import {
  MAX_LINKS,
  createLink,
  isPlaybackDriverLink,
  linkIsCompatible,
  linkTouchesOrb,
  type LinkDocument,
  type LinkType,
} from './Link';
import type { SoundOrbDocument } from './SoundOrb';
import type { WorldDocument } from './World';

export type LinkValidationReason =
  | 'missing-orb'
  | 'self'
  | 'duplicate'
  | 'limit'
  | 'incompatible'
  | 'target-driven'
  | 'take-turns-conflict'
  | 'copy-target-conflict'
  | 'copy-chain-conflict'
  | 'copy-cycle';

export interface LinkValidation {
  readonly ok: boolean;
  readonly reason?: LinkValidationReason;
}

export interface AddLinkResult {
  readonly world: WorldDocument;
  readonly createdId: string | null;
  readonly reason?: LinkValidationReason;
}

function copyMovementWouldCycle(
  links: readonly LinkDocument[],
  sourceOrbId: string,
  targetOrbId: string,
): boolean {
  const adjacency = new Map<string, string[]>();

  for (const link of links) {
    if (link.type !== 'copy-movement') {
      continue;
    }

    const targets = adjacency.get(link.sourceOrbId) ?? [];
    targets.push(link.targetOrbId);
    adjacency.set(link.sourceOrbId, targets);
  }

  const stack = [targetOrbId];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const current = stack.pop();

    if (!current || visited.has(current)) {
      continue;
    }

    if (current === sourceOrbId) {
      return true;
    }

    visited.add(current);

    for (const next of adjacency.get(current) ?? []) {
      stack.push(next);
    }
  }

  return false;
}

export function validateLinkCandidate(
  world: WorldDocument,
  type: LinkType,
  sourceOrbId: string,
  targetOrbId: string,
): LinkValidation {
  if (world.links.length >= MAX_LINKS) {
    return { ok: false, reason: 'limit' };
  }

  const source = world.soundOrbs.find((orb) => orb.id === sourceOrbId);
  const target = world.soundOrbs.find((orb) => orb.id === targetOrbId);

  if (!source || !target) {
    return { ok: false, reason: 'missing-orb' };
  }

  if (sourceOrbId === targetOrbId) {
    return { ok: false, reason: 'self' };
  }

  if (
    world.links.some(
      (link) => (
        link.type === type
        && link.sourceOrbId === sourceOrbId
        && link.targetOrbId === targetOrbId
      ),
    )
  ) {
    return { ok: false, reason: 'duplicate' };
  }

  if (!linkIsCompatible(type, source, target)) {
    return { ok: false, reason: 'incompatible' };
  }

  if (
    isPlaybackDriverLink(type)
    && world.links.some(
      (link) => (
        isPlaybackDriverLink(link.type)
        && link.targetOrbId === targetOrbId
      ),
    )
  ) {
    return { ok: false, reason: 'target-driven' };
  }

  if (
    isPlaybackDriverLink(type)
    && world.links.some(
      (link) => (
        isPlaybackDriverLink(link.type)
        && (
          link.targetOrbId === sourceOrbId
          || link.sourceOrbId === targetOrbId
        )
      ),
    )
  ) {
    return { ok: false, reason: 'target-driven' };
  }


  if (
    type === 'take-turns'
    && world.links.some(
      (link) => (
        (
          link.type === 'take-turns'
          || isPlaybackDriverLink(link.type)
        )
        && (
          linkTouchesOrb(link, sourceOrbId)
          || linkTouchesOrb(link, targetOrbId)
        )
      ),
    )
  ) {
    return { ok: false, reason: 'take-turns-conflict' };
  }

  if (
    isPlaybackDriverLink(type)
    && world.links.some(
      (link) => (
        link.type === 'take-turns'
        && linkTouchesOrb(link, targetOrbId)
      ),
    )
  ) {
    return { ok: false, reason: 'take-turns-conflict' };
  }

  if (
    type === 'copy-movement'
    && world.links.some(
      (link) => (
        link.type === 'copy-movement'
        && link.targetOrbId === targetOrbId
      ),
    )
  ) {
    return { ok: false, reason: 'copy-target-conflict' };
  }

  if (
    type === 'copy-movement'
    && world.links.some(
      (link) => (
        link.type === 'copy-movement'
        && (
          link.targetOrbId === sourceOrbId
          || link.sourceOrbId === targetOrbId
        )
      ),
    )
  ) {
    return { ok: false, reason: 'copy-chain-conflict' };
  }


  if (
    type === 'copy-movement'
    && copyMovementWouldCycle(world.links, sourceOrbId, targetOrbId)
  ) {
    return { ok: false, reason: 'copy-cycle' };
  }

  return { ok: true };
}

export function addLink(
  world: WorldDocument,
  type: LinkType,
  sourceOrbId: string,
  targetOrbId: string,
  now = Date.now(),
): AddLinkResult {
  const validation = validateLinkCandidate(
    world,
    type,
    sourceOrbId,
    targetOrbId,
  );

  if (!validation.ok) {
    return {
      world,
      createdId: null,
      ...(validation.reason ? { reason: validation.reason } : {}),
    };
  }

  const link = createLink({
    type,
    sourceOrbId,
    targetOrbId,
  });

  return {
    world: {
      ...world,
      updatedAt: now,
      links: [...world.links, link],
    },
    createdId: link.id,
  };
}

export function deleteLink(
  world: WorldDocument,
  linkId: string,
  now = Date.now(),
): WorldDocument {
  const links = world.links.filter((link) => link.id !== linkId);

  return links.length === world.links.length
    ? world
    : {
        ...world,
        updatedAt: now,
        links,
      };
}

export function deleteLinksForOrb(
  links: readonly LinkDocument[],
  orbId: string,
): readonly LinkDocument[] {
  return links.filter((link) => !linkTouchesOrb(link, orbId));
}

export function pruneInvalidLinks(
  links: readonly LinkDocument[],
  soundOrbs: readonly SoundOrbDocument[],
): readonly LinkDocument[] {
  const byId = new Map(soundOrbs.map((orb) => [orb.id, orb]));

  return links.filter((link) => {
    const source = byId.get(link.sourceOrbId);
    const target = byId.get(link.targetOrbId);

    return Boolean(
      source
      && target
      && linkIsCompatible(link.type, source, target),
    );
  });
}
