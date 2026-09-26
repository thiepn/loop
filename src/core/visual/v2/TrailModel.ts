import {
  effectAmountsAtPoint,
  type EffectFieldDocument,
} from '../../world/EffectField';
import {
  toyDepthAtPoint,
  type PlaygroundToyDocument,
  type PlaygroundToyType,
} from '../../world/PlaygroundToy';
import type {
  NormalizedPoint,
  SoundOrbDocument,
} from '../../world/SoundOrb';
import type { WorldDocument } from '../../world/World';
import type {
  RenderTrail,
  RenderTrailPoint,
  RenderTrailToyInfluence,
  RenderVector,
} from './RenderTypes';
import type { VisualPreferences } from '../VisualQuality';

export interface TrailPolicy {
  readonly maxPoints: number;
  readonly lifetimeMs: number;
  readonly minSpacingPx: number;
  readonly baseAlpha: number;
}

interface MutableTrail {
  readonly orbId: string;
  readonly role: SoundOrbDocument['role'];
  points: RenderTrailPoint[];
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function trailPolicyForPreferences(
  preferences: Readonly<VisualPreferences>,
): TrailPolicy {
  if (preferences.reduceMotion) {
    return {
      maxPoints: 0,
      lifetimeMs: 0,
      minSpacingPx: Number.POSITIVE_INFINITY,
      baseAlpha: 0,
    };
  }

  switch (preferences.quality) {
    case 'high':
      return {
        maxPoints: 28,
        lifetimeMs: 1320,
        minSpacingPx: 5,
        baseAlpha: 0.72,
      };
    case 'balanced':
      return {
        maxPoints: 18,
        lifetimeMs: 900,
        minSpacingPx: 7,
        baseAlpha: 0.62,
      };
    case 'battery':
      return {
        maxPoints: 8,
        lifetimeMs: 520,
        minSpacingPx: 10,
        baseAlpha: 0.46,
      };
  }
}

export interface TrailRoleStyle {
  readonly widthPx: number;
  readonly alpha: number;
  readonly layerCount: number;
  readonly sparkScale: number;
}

export function trailRoleStyle(
  role: SoundOrbDocument['role'],
): TrailRoleStyle {
  switch (role) {
    case 'beat':
      return {
        widthPx: 5.4,
        alpha: 0.72,
        layerCount: 1,
        sparkScale: 0.72,
      };
    case 'percussion':
      return {
        widthPx: 2.6,
        alpha: 0.8,
        layerCount: 1,
        sparkScale: 1.25,
      };
    case 'bass':
      return {
        widthPx: 9.2,
        alpha: 0.56,
        layerCount: 1,
        sparkScale: 0.4,
      };
    case 'harmony':
      return {
        widthPx: 5.8,
        alpha: 0.5,
        layerCount: 2,
        sparkScale: 0.45,
      };
    case 'melody':
      return {
        widthPx: 3.1,
        alpha: 0.78,
        layerCount: 1,
        sparkScale: 0.95,
      };
    case 'texture':
      return {
        widthPx: 10.5,
        alpha: 0.3,
        layerCount: 1,
        sparkScale: 0.25,
      };
    case 'voice':
      return {
        widthPx: 5.1,
        alpha: 0.58,
        layerCount: 1,
        sparkScale: 0.62,
      };
  }
}

function distancePixels(
  a: NormalizedPoint,
  b: NormalizedPoint,
  width: number,
  height: number,
): number {
  return Math.hypot(
    (b.x - a.x) * width,
    (b.y - a.y) * height,
  );
}

function normalizedDirection(
  a: NormalizedPoint,
  b: NormalizedPoint,
  width: number,
  height: number,
): RenderVector {
  const dx = (b.x - a.x) * width;
  const dy = (b.y - a.y) * height;
  const length = Math.hypot(dx, dy);

  if (length <= 1e-6) {
    return { x: 0, y: 0 };
  }

  return {
    x: dx / length,
    y: dy / length,
  };
}

function turnAmount(
  previous: RenderVector,
  current: RenderVector,
): number {
  const previousLength = Math.hypot(previous.x, previous.y);
  const currentLength = Math.hypot(current.x, current.y);

  if (previousLength <= 1e-6 || currentLength <= 1e-6) {
    return 0;
  }

  const dot = Math.max(
    -1,
    Math.min(
      1,
      previous.x * current.x + previous.y * current.y,
    ),
  );

  return Math.acos(dot) / Math.PI;
}

export function strongestToyInfluence(
  toys: readonly PlaygroundToyDocument[],
  position: NormalizedPoint,
): RenderTrailToyInfluence | null {
  let strongest: {
    type: PlaygroundToyType;
    amount: number;
  } | null = null;

  for (const toy of toys) {
    const depth = toyDepthAtPoint(toy, position)
      * toy.strength;

    if (depth <= (strongest?.amount ?? 0)) {
      continue;
    }

    strongest = {
      type: toy.type,
      amount: clamp01(depth),
    };
  }

  return strongest;
}

export function shouldBreakTrail(
  previous: NormalizedPoint,
  current: NormalizedPoint,
  width: number,
  height: number,
  toyInfluence: RenderTrailToyInfluence | null,
): boolean {
  const distance = distancePixels(
    previous,
    current,
    width,
    height,
  );
  const diagonal = Math.hypot(width, height);

  if (distance > Math.max(120, diagonal * 0.22)) {
    return true;
  }

  return toyInfluence?.type === 'portal'
    && toyInfluence.amount > 0.18
    && distance > 42;
}

export class TrailHistory {
  private readonly trails = new Map<string, MutableTrail>();

  public sampleOrb(
    orb: SoundOrbDocument,
    position: NormalizedPoint,
    timestampMs: number,
    width: number,
    height: number,
    fields: readonly EffectFieldDocument[],
    toys: readonly PlaygroundToyDocument[],
    preferences: Readonly<VisualPreferences>,
  ): boolean {
    const policy = trailPolicyForPreferences(preferences);

    if (policy.maxPoints <= 0) {
      return this.trails.delete(orb.id);
    }

    let trail = this.trails.get(orb.id);

    if (!trail) {
      trail = {
        orbId: orb.id,
        role: orb.role,
        points: [],
      };
      this.trails.set(orb.id, trail);
    }

    const previous = trail.points[trail.points.length - 1];

    if (
      previous
      && distancePixels(
        previous.position,
        position,
        width,
        height,
      ) < policy.minSpacingPx
    ) {
      return false;
    }

    const previousPosition = previous?.position ?? position;
    const distance = previous
      ? distancePixels(
          previous.position,
          position,
          width,
          height,
        )
      : 0;
    const elapsed = Math.max(
      8,
      timestampMs - (previous?.timestampMs ?? timestampMs),
    );
    const speed = clamp01(
      distance * 1000 / elapsed / 1200,
    );
    const velocity = previous
      ? normalizedDirection(
          previous.position,
          position,
          width,
          height,
        )
      : { x: 0, y: 0 };
    const acceleration = previous
      ? clamp01(Math.abs(speed - previous.speed) * 1.8)
      : 0;
    const turn = previous
      ? turnAmount(previous.velocity, velocity)
      : 0;
    const toyInfluence = strongestToyInfluence(
      toys,
      position,
    );

    trail.points.push({
      position,
      timestampMs,
      speed,
      acceleration,
      turn,
      velocity,
      fieldInfluence: effectAmountsAtPoint(fields, position),
      toyInfluence,
      breakBefore: previous
        ? shouldBreakTrail(
            previousPosition,
            position,
            width,
            height,
            toyInfluence,
          )
        : true,
    });

    if (trail.points.length > policy.maxPoints) {
      trail.points.splice(
        0,
        trail.points.length - policy.maxPoints,
      );
    }

    this.prune(timestampMs, preferences);
    return true;
  }

  public sampleWorld(
    world: WorldDocument,
    positions: ReadonlyMap<string, NormalizedPoint>,
    timestampMs: number,
    width: number,
    height: number,
    fields: readonly EffectFieldDocument[],
    toys: readonly PlaygroundToyDocument[],
    preferences: Readonly<VisualPreferences>,
  ): boolean {
    let changed = false;

    for (const orb of world.soundOrbs) {
      const position = positions.get(orb.id);

      if (!position) {
        continue;
      }

      changed = this.sampleOrb(
        orb,
        position,
        timestampMs,
        width,
        height,
        fields,
        toys,
        preferences,
      ) || changed;
    }

    return changed;
  }

  public prune(
    nowMs: number,
    preferences: Readonly<VisualPreferences>,
  ): boolean {
    const policy = trailPolicyForPreferences(preferences);
    let changed = false;

    if (policy.maxPoints <= 0) {
      changed = this.trails.size > 0;
      this.trails.clear();
      return changed;
    }

    for (const [orbId, trail] of this.trails) {
      let expired = 0;

      while (
        expired < trail.points.length
        && nowMs - trail.points[expired]!.timestampMs > policy.lifetimeMs
      ) {
        expired += 1;
      }

      if (expired > 0) {
        trail.points.splice(0, expired);
        changed = true;
      }

      if (trail.points.length > policy.maxPoints) {
        trail.points.splice(
          0,
          trail.points.length - policy.maxPoints,
        );
        changed = true;
      }

      if (trail.points.length === 0) {
        this.trails.delete(orbId);
        changed = true;
      }
    }

    return changed;
  }

  public snapshot(
    world: WorldDocument,
  ): readonly RenderTrail[] {
    const byId = new Map(
      world.soundOrbs.map((orb) => [orb.id, orb]),
    );
    const result: RenderTrail[] = [];

    for (const trail of this.trails.values()) {
      const orb = byId.get(trail.orbId);

      if (!orb || trail.points.length < 2) {
        continue;
      }

      result.push({
        orbId: orb.id,
        role: orb.role,
        muted: orb.muted,
        points: trail.points,
      });
    }

    return result;
  }

  public hasVisible(
    nowMs: number,
    preferences: Readonly<VisualPreferences>,
  ): boolean {
    const policy = trailPolicyForPreferences(preferences);

    if (policy.maxPoints <= 0) {
      return false;
    }

    for (const trail of this.trails.values()) {
      const newest = trail.points[trail.points.length - 1];

      if (
        trail.points.length >= 2
        && newest
        && nowMs - newest.timestampMs <= policy.lifetimeMs
      ) {
        return true;
      }
    }

    return false;
  }

  public clearOrb(orbId: string): void {
    this.trails.delete(orbId);
  }

  public clear(): void {
    this.trails.clear();
  }
}
