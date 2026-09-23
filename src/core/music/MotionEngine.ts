import {
  evaluateFollowMotion,
  evaluateIndependentMotion,
  motionForOrb,
  nearestFollowTarget,
} from '../world/Motion';
import {
  toyDepthAtPoint,
  type PlaygroundToyDocument,
  type PlaygroundToyType,
} from '../world/PlaygroundToy';
import { clampPoint, type NormalizedPoint } from '../world/SoundOrb';
import type { WorldDocument } from '../world/World';

export type MotionFrame = ReadonlyMap<string, NormalizedPoint>;

const TOY_ORDER: Record<PlaygroundToyType, number> = {
  spinner: 0,
  magnet: 1,
  repulsor: 2,
  portal: 3,
};

function clampLivePoint(point: NormalizedPoint): NormalizedPoint {
  return clampPoint({
    x: Math.min(0.98, Math.max(0.02, point.x)),
    y: Math.min(0.98, Math.max(0.02, point.y)),
  });
}

function rotateAround(
  point: NormalizedPoint,
  center: NormalizedPoint,
  angle: number,
): NormalizedPoint {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);

  return {
    x: center.x + dx * cosine - dy * sine,
    y: center.y + dx * sine + dy * cosine,
  };
}

function applySpinner(
  point: NormalizedPoint,
  toy: PlaygroundToyDocument,
  timeSeconds: number,
  depth: number,
): NormalizedPoint {
  const angularSpeed = 0.55 + toy.strength * 0.9;
  const angle = timeSeconds * angularSpeed * depth;

  return rotateAround(point, toy.position, angle);
}

function applyMagnet(
  point: NormalizedPoint,
  toy: PlaygroundToyDocument,
  depth: number,
): NormalizedPoint {
  const pull = depth * toy.strength * 0.42;

  return {
    x: point.x + (toy.position.x - point.x) * pull,
    y: point.y + (toy.position.y - point.y) * pull,
  };
}

function deterministicDirection(id: string): number {
  let hash = 0;

  for (let index = 0; index < id.length; index += 1) {
    hash = Math.imul(hash ^ id.charCodeAt(index), 2654435761);
  }

  return ((hash >>> 0) / 0xffffffff) * Math.PI * 2;
}

function applyRepulsor(
  point: NormalizedPoint,
  toy: PlaygroundToyDocument,
  depth: number,
): NormalizedPoint {
  let dx = point.x - toy.position.x;
  let dy = point.y - toy.position.y;
  let distance = Math.hypot(dx, dy);

  if (distance < 1e-6) {
    const angle = deterministicDirection(toy.id);
    dx = Math.cos(angle);
    dy = Math.sin(angle);
    distance = 1;
  }

  const push = toy.radius * depth * toy.strength * 0.65;

  return {
    x: point.x + (dx / distance) * push,
    y: point.y + (dy / distance) * push,
  };
}

function applyPortal(
  point: NormalizedPoint,
  toy: PlaygroundToyDocument,
  depth: number,
): NormalizedPoint {
  const exit = toy.exitPosition;

  if (!exit || depth <= 0.08) {
    return point;
  }

  const dx = point.x - toy.position.x;
  const dy = point.y - toy.position.y;
  const compression = 0.48 + (1 - depth) * 0.3;

  return {
    x: exit.x + dx * compression,
    y: exit.y + dy * compression,
  };
}

export function applyPlaygroundToys(
  point: NormalizedPoint,
  toys: readonly PlaygroundToyDocument[],
  timeSeconds: number,
): NormalizedPoint {
  let result = point;

  const ordered = [...toys].sort(
    (a, b) => TOY_ORDER[a.type] - TOY_ORDER[b.type],
  );

  for (const toy of ordered) {
    const depth = toyDepthAtPoint(toy, result);

    if (depth <= 0) {
      continue;
    }

    switch (toy.type) {
      case 'spinner':
        result = applySpinner(result, toy, timeSeconds, depth);
        break;
      case 'magnet':
        result = applyMagnet(result, toy, depth);
        break;
      case 'repulsor':
        result = applyRepulsor(result, toy, depth);
        break;
      case 'portal':
        result = applyPortal(result, toy, depth);
        break;
    }

    result = clampLivePoint(result);
  }

  return result;
}

function applyCopyMovementLinks(
  world: WorldDocument,
  positions: Map<string, NormalizedPoint>,
): void {
  const byId = new Map(world.soundOrbs.map((orb) => [orb.id, orb]));
  const links = [...world.links]
    .filter((link) => link.type === 'copy-movement')
    .sort((a, b) => a.id.localeCompare(b.id));

  for (const link of links) {
    const source = byId.get(link.sourceOrbId);
    const target = byId.get(link.targetOrbId);

    if (!source || !target) {
      continue;
    }

    const sourcePosition = positions.get(source.id) ?? source.position;
    const delta = {
      x: sourcePosition.x - source.position.x,
      y: sourcePosition.y - source.position.y,
    };

    positions.set(
      target.id,
      clampLivePoint({
        x: target.position.x + delta.x,
        y: target.position.y + delta.y,
      }),
    );
  }
}

export function evaluateMotionFrame(
  world: WorldDocument,
  timeSeconds: number,
): MotionFrame {
  const positions = new Map<string, NormalizedPoint>();

  for (const orb of world.soundOrbs) {
    const motion = motionForOrb(orb);

    if (motion.mode !== 'follow') {
      positions.set(
        orb.id,
        evaluateIndependentMotion(orb, timeSeconds),
      );
    }
  }

  for (const orb of world.soundOrbs) {
    const motion = motionForOrb(orb);

    if (motion.mode !== 'follow') {
      continue;
    }

    const target = (
      motion.targetOrbId
        ? world.soundOrbs.find((candidate) => candidate.id === motion.targetOrbId)
        : undefined
    ) ?? nearestFollowTarget(orb, world.soundOrbs);

    const targetPosition = target
      ? positions.get(target.id) ?? target.position
      : orb.position;

    positions.set(
      orb.id,
      evaluateFollowMotion(orb, targetPosition, timeSeconds),
    );
  }

  for (const orb of world.soundOrbs) {
    const base = positions.get(orb.id) ?? orb.position;
    positions.set(
      orb.id,
      applyPlaygroundToys(base, world.playgroundToys, timeSeconds),
    );
  }

  applyCopyMovementLinks(world, positions);

  return positions;
}

export function worldHasActiveMotion(world: WorldDocument): boolean {
  if (world.soundOrbs.length === 0) {
    return false;
  }

  const copyMovementNeedsFrames = world.links.some(
    (link) => link.type === 'copy-movement',
  );

  return world.playgroundToys.length > 0
    || copyMovementNeedsFrames
    || world.soundOrbs.some((orb) => (orb.motion?.mode ?? 'still') !== 'still');
}
