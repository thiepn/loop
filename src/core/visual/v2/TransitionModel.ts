import type { VisualPreferences } from '../VisualQuality';
import type { WorldDocument } from '../../world/World';
import type { PlaygroundToyDocument } from '../../world/PlaygroundToy';
import type { NormalizedPoint } from '../../world/SoundOrb';
import {
  FIELD_RENDER_COLORS,
  ROLE_RENDER_COLORS,
  TOY_RENDER_COLORS,
  type RenderColor,
} from './RenderPalette';
import type {
  RenderEventSample,
  StateTransitionKind,
  StateTransitionNode,
  StateTransitionPayload,
} from './RenderTypes';

export interface TransitionBeam {
  readonly from: NormalizedPoint;
  readonly to: NormalizedPoint;
  readonly color: RenderColor;
  readonly strength: number;
  readonly width: number;
}

export interface TransitionLight {
  readonly id: string;
  readonly position: NormalizedPoint;
  readonly color: RenderColor;
  readonly intensity: number;
  readonly radius: number;
}

export interface TransitionFrame {
  readonly beams: readonly TransitionBeam[];
  readonly lights: readonly TransitionLight[];
  readonly worldEnergy: number;
  readonly worldPhase: number;
  readonly dissolve: number;
  readonly reconstruct: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function hashString(value: string): number {
  let hash = 2166136261 >>> 0;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function stableUnit(value: string): number {
  return hashString(value) / 0xffffffff;
}

function colorForOrb(role: keyof typeof ROLE_RENDER_COLORS) {
  const color = ROLE_RENDER_COLORS[role];
  return [color[0], color[1], color[2]] as const;
}

function worldNodes(
  world: WorldDocument,
): readonly StateTransitionNode[] {
  const nodes: StateTransitionNode[] = [];

  for (const orb of world.soundOrbs) {
    nodes.push({
      id: 'orb:' + orb.id,
      kind: 'orb',
      from: null,
      to: orb.position,
      color: colorForOrb(orb.role),
      radius: 0.045,
    });
  }

  for (const field of world.effectFields) {
    const color = FIELD_RENDER_COLORS[field.type];
    nodes.push({
      id: 'field:' + field.id,
      kind: 'field',
      from: null,
      to: field.position,
      color: [color[0], color[1], color[2]],
      radius: Math.min(0.12, field.radius * 0.52),
    });
  }

  for (const toy of world.playgroundToys) {
    const color = TOY_RENDER_COLORS[toy.type];
    nodes.push({
      id: 'toy:' + toy.id,
      kind: 'toy',
      from: null,
      to: toy.position,
      color: [color[0], color[1], color[2]],
      radius: Math.min(0.075, toy.radius * 0.5),
    });
  }

  return nodes;
}

function mergeWorldNodes(
  before: WorldDocument,
  after: WorldDocument,
  kind: StateTransitionKind,
): readonly StateTransitionNode[] {
  const beforeNodes = new Map(
    worldNodes(before).map((node) => [node.id, node]),
  );
  const afterNodes = new Map(
    worldNodes(after).map((node) => [node.id, node]),
  );
  const ids = [...new Set([
    ...beforeNodes.keys(),
    ...afterNodes.keys(),
  ])].sort();
  const nodes: StateTransitionNode[] = [];

  for (const id of ids) {
    const a = beforeNodes.get(id);
    const b = afterNodes.get(id);

    if (
      kind === 'delete'
      && (!a || b)
    ) {
      continue;
    }

    const from = a?.to ?? null;
    const to = b?.to ?? null;

    if (!from && !to) {
      continue;
    }

    const color = b?.color ?? a?.color ?? [0.8, 0.8, 1];
    const radius = b?.radius ?? a?.radius ?? 0.04;

    nodes.push({
      id,
      kind: b?.kind ?? a?.kind ?? 'orb',
      from,
      to,
      color,
      radius,
    });
  }

  const changed = nodes.filter((node) => {
    if (!node.from || !node.to) {
      return true;
    }

    const distance = Math.hypot(
      node.to.x - node.from.x,
      node.to.y - node.from.y,
    );

    return distance > 0.002
      || kind === 'magic'
      || kind === 'magic-revert'
      || kind === 'snapshot';
  });

  return changed.slice(0, 18);
}

function centroid(
  nodes: readonly StateTransitionNode[],
): NormalizedPoint {
  const points = nodes.flatMap((node) => {
    const point = node.to ?? node.from;
    return point ? [point] : [];
  });

  if (points.length === 0) {
    return { x: 0.5, y: 0.5 };
  }

  return {
    x: points.reduce((sum, point) => sum + point.x, 0)
      / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0)
      / points.length,
  };
}

function priorityFor(kind: StateTransitionKind): number {
  switch (kind) {
    case 'magic':
    case 'magic-revert':
      return 5;
    case 'snapshot':
      return 4;
    case 'undo':
    case 'redo':
      return 3;
    case 'delete':
      return 2;
    case 'portal':
      return 1;
  }
}

export function buildWorldTransition(
  kind: Exclude<StateTransitionKind, 'portal'>,
  before: WorldDocument,
  after: WorldDocument,
  seed?: number,
  intensity = 1,
): StateTransitionPayload {
  const nodes = mergeWorldNodes(before, after, kind);
  const deleteNode = kind === 'delete'
    ? nodes.find((node) => node.from && !node.to)
    : undefined;

  return {
    kind,
    key: kind === 'delete' && deleteNode
      ? 'delete:' + deleteNode.id
      : 'world',
    priority: priorityFor(kind),
    seed: seed ?? hashString(
      kind + ':' + before.id + ':' + after.id,
    ),
    intensity: clamp01(intensity),
    origin: centroid(nodes),
    nodes,
  };
}

export function detectPortalTransition(
  orbId: string,
  from: NormalizedPoint,
  to: NormalizedPoint,
  toys: readonly PlaygroundToyDocument[],
): StateTransitionPayload | null {
  const jump = Math.hypot(
    to.x - from.x,
    to.y - from.y,
  );

  if (jump < 0.12) {
    return null;
  }

  const portal = toys
    .filter((toy) => toy.type === 'portal' && toy.exitPosition)
    .map((toy) => {
      const exit = toy.exitPosition!;
      const entryDistance = Math.hypot(
        from.x - toy.position.x,
        from.y - toy.position.y,
      );
      const exitDistance = Math.hypot(
        to.x - exit.x,
        to.y - exit.y,
      );

      return {
        toy,
        score: entryDistance + exitDistance,
      };
    })
    .sort((a, b) => (
      a.score - b.score
      || a.toy.id.localeCompare(b.toy.id)
    ))[0];

  if (
    !portal
    || portal.score > portal.toy.radius * 1.5
  ) {
    return null;
  }

  const seed = hashString(
    'portal:' + portal.toy.id + ':' + orbId,
  );

  return {
    kind: 'portal',
    key: 'portal:' + orbId,
    priority: priorityFor('portal'),
    seed,
    intensity: clamp01(0.55 + jump * 1.4),
    origin: portal.toy.position,
    nodes: [{
      id: 'orb:' + orbId,
      kind: 'orb',
      from,
      to,
      color: [0.13, 0.83, 0.93],
      radius: 0.045,
    }],
  };
}

function asColor(
  node: StateTransitionNode,
): RenderColor {
  return [
    node.color[0],
    node.color[1],
    node.color[2],
    1,
  ];
}

export function deriveTransitionFrame(
  samples: readonly RenderEventSample[],
  preferences: Readonly<VisualPreferences>,
): TransitionFrame {
  const beams: TransitionBeam[] = [];
  const lights: TransitionLight[] = [];
  let worldEnergy = 0;
  let worldPhase = 0;
  let dissolve = 0;
  let reconstruct = 0;

  for (const sample of samples) {
    if (sample.event.kind !== 'state-transition') {
      continue;
    }

    const transition = sample.event.transition;
    const progress = clamp01(sample.progress);
    const fade = Math.pow(1 - progress, 1.25);
    const wave = Math.sin(Math.PI * progress);
    const motion = preferences.reduceMotion ? 0 : 1;

    const cinematic = transition.kind === 'magic'
      || transition.kind === 'magic-revert'
      || transition.kind === 'snapshot'
      || transition.kind === 'undo'
      || transition.kind === 'redo';

    if (cinematic) {
      const energy = transition.intensity
        * (
          transition.kind === 'magic'
            ? 0.92
            : transition.kind === 'snapshot'
              ? 0.72
              : 0.58
        );

      if (energy * wave > worldEnergy) {
        worldEnergy = energy * wave;
        worldPhase = progress;
      }
    }

    if (transition.kind === 'delete') {
      dissolve = Math.max(
        dissolve,
        transition.intensity * fade,
      );
    }

    if (
      transition.kind === 'undo'
      || transition.kind === 'redo'
      || transition.kind === 'magic-revert'
    ) {
      reconstruct = Math.max(
        reconstruct,
        transition.intensity * wave,
      );
    }

    for (const node of transition.nodes) {
      const color = asColor(node);
      const from = node.from;
      const to = node.to;

      if (
        from
        && to
        && motion > 0
      ) {
        beams.push({
          from,
          to,
          color,
          strength: transition.intensity
            * fade
            * (
              transition.kind === 'portal'
                ? 0.9
                : 0.34
            ),
          width: (
            transition.kind === 'portal'
              ? 0.014
              : 0.006 + node.radius * 0.05
          ),
        });
      }

      const lightPosition = (() => {
        if (transition.kind === 'portal' && from && to) {
          return progress < 0.48 ? from : to;
        }

        if (from && to) {
          return preferences.reduceMotion
            ? to
            : {
                x: from.x + (to.x - from.x) * progress,
                y: from.y + (to.y - from.y) * progress,
              };
        }

        return to ?? from;
      })();

      if (!lightPosition) {
        continue;
      }

      const added = !from && to;
      const removed = from && !to;
      const intensity = transition.intensity
        * (
          transition.kind === 'portal'
            ? 0.58 + wave * 0.35
            : removed
              ? fade * 0.48
              : added
                ? wave * 0.46
                : 0.14 + wave * 0.26
        );

      lights.push({
        id: transition.key + ':' + node.id,
        position: lightPosition,
        color,
        intensity: clamp01(intensity),
        radius: Math.min(
          0.18,
          node.radius * (
            transition.kind === 'portal' ? 2.1 : 1.6
          ) + 0.035,
        ),
      });
    }

    if (
      cinematic
      && transition.nodes.length > 0
    ) {
      const hue = stableUnit(
        transition.kind + ':' + transition.seed,
      );
      lights.push({
        id: transition.key + ':origin',
        position: transition.origin,
        color: [
          0.62 + hue * 0.2,
          0.52 + (1 - hue) * 0.15,
          1,
          1,
        ],
        intensity: transition.intensity
          * wave
          * 0.42,
        radius: 0.18,
      });
    }
  }

  return {
    beams: beams
      .sort((a, b) => b.strength - a.strength)
      .slice(0, preferences.quality === 'high' ? 12 : 7),
    lights: lights
      .sort((a, b) => (
        b.intensity - a.intensity
        || a.id.localeCompare(b.id)
      ))
      .slice(0, preferences.quality === 'high' ? 12 : 8),
    worldEnergy: clamp01(worldEnergy),
    worldPhase: clamp01(worldPhase),
    dissolve: clamp01(dissolve),
    reconstruct: clamp01(reconstruct),
  };
}
