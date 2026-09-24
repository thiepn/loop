import {
  EMPTY_EFFECT_AMOUNTS,
  effectAmountsAtPoint,
  type EffectAmounts,
  type EffectFieldDocument,
  type EffectFieldType,
} from '../../world/EffectField';
import type {
  NormalizedPoint,
  SoundOrbDocument,
} from '../../world/SoundOrb';
import type {
  RenderFieldEnvironment,
  RenderFieldIntersection,
  RenderFieldMaterial,
} from './RenderTypes';

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function hashString(value: string): number {
  let hash = 2166136261 >>> 0;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 0xffffffff;
}

export function deriveFieldMaterial(
  field: EffectFieldDocument,
): RenderFieldMaterial {
  const seed = hashString(field.id + ':' + field.type);

  const edgeRoughness = (() => {
    switch (field.type) {
      case 'space':
        return 0.022;
      case 'echo':
        return 0.012;
      case 'heat':
        return 0.034;
      case 'frost':
        return 0.018;
      case 'filter':
        return 0.01;
    }
  })();

  const detail = clamp01(
    0.55
    + (field.radius - 0.1) / 0.24 * 0.35
    + seed * 0.1,
  );

  return {
    seed,
    edgeRoughness,
    detail,
  };
}

function distance(
  a: NormalizedPoint,
  b: NormalizedPoint,
): number {
  return Math.hypot(
    a.x - b.x,
    a.y - b.y,
  );
}

function overlapPosition(
  a: EffectFieldDocument,
  b: EffectFieldDocument,
): NormalizedPoint {
  const total = Math.max(1e-6, a.radius + b.radius);

  return {
    x: clamp01(
      (a.position.x * b.radius + b.position.x * a.radius)
      / total,
    ),
    y: clamp01(
      (a.position.y * b.radius + b.position.y * a.radius)
      / total,
    ),
  };
}

function overlapRadius(
  a: EffectFieldDocument,
  b: EffectFieldDocument,
): number {
  const d = distance(a.position, b.position);
  const overlap = Math.max(
    0,
    a.radius + b.radius - d,
  );

  return Math.min(
    Math.min(a.radius, b.radius),
    overlap * 0.58,
  );
}

function fieldsAtPoint(
  fields: readonly EffectFieldDocument[],
  point: NormalizedPoint,
): number {
  let count = 0;

  for (const field of fields) {
    if (effectAmountsAtPoint([field], point)[field.type] > 0.025) {
      count += 1;
    }
  }

  return count;
}

export function deriveFieldIntersections(
  fields: readonly EffectFieldDocument[],
): readonly RenderFieldIntersection[] {
  const result: RenderFieldIntersection[] = [];

  for (let first = 0; first < fields.length; first += 1) {
    for (
      let second = first + 1;
      second < fields.length;
      second += 1
    ) {
      const a = fields[first]!;
      const b = fields[second]!;
      const radius = overlapRadius(a, b);

      if (radius <= 0.008) {
        continue;
      }

      const position = overlapPosition(a, b);
      const denominator = Math.max(
        0.01,
        Math.min(a.radius, b.radius),
      );
      const strength = clamp01(radius / denominator);
      const simplified = fieldsAtPoint(
        fields,
        position,
      ) >= 3;

      result.push({
        id: [a.id, b.id].sort().join('::'),
        typeA: a.type,
        typeB: b.type,
        position,
        radius,
        strength,
        simplified,
      });
    }
  }

  return result
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 5);
}

export function deriveFieldEnvironment(
  fields: readonly EffectFieldDocument[],
  intersections: readonly RenderFieldIntersection[],
): RenderFieldEnvironment {
  const amounts: Record<EffectFieldType, number> = {
    space: 0,
    echo: 0,
    heat: 0,
    frost: 0,
    filter: 0,
  };

  for (const field of fields) {
    const area = field.radius * field.radius;
    amounts[field.type] += area;
  }

  const coverageReference = 0.16;

  return {
    space: clamp01(amounts.space / coverageReference),
    echo: clamp01(amounts.echo / coverageReference),
    heat: clamp01(amounts.heat / coverageReference),
    frost: clamp01(amounts.frost / coverageReference),
    filter: clamp01(amounts.filter / coverageReference),
    overlap: clamp01(
      intersections.reduce(
        (sum, intersection) => (
          sum
          + intersection.strength
          * (intersection.simplified ? 0.55 : 0.35)
        ),
        0,
      ),
    ),
  };
}

function mixAmount(
  current: number,
  target: number,
  amount: number,
): number {
  return current + (target - current) * amount;
}

function mixEffects(
  current: EffectAmounts,
  target: EffectAmounts,
  amount: number,
): EffectAmounts {
  return {
    space: mixAmount(current.space, target.space, amount),
    echo: mixAmount(current.echo, target.echo, amount),
    heat: mixAmount(current.heat, target.heat, amount),
    frost: mixAmount(current.frost, target.frost, amount),
    filter: mixAmount(current.filter, target.filter, amount),
  };
}

function maxEffectDelta(
  a: EffectAmounts,
  b: EffectAmounts,
): number {
  return Math.max(
    Math.abs(a.space - b.space),
    Math.abs(a.echo - b.echo),
    Math.abs(a.heat - b.heat),
    Math.abs(a.frost - b.frost),
    Math.abs(a.filter - b.filter),
  );
}

interface TransitionEntry {
  value: EffectAmounts;
  lastTimestampMs: number;
}

export class FieldInfluenceTransitions {
  private readonly values = new Map<string, TransitionEntry>();

  public update(
    orbs: readonly SoundOrbDocument[],
    positions: ReadonlyMap<string, NormalizedPoint>,
    fields: readonly EffectFieldDocument[],
    timestampMs: number,
    reduceMotion: boolean,
  ): boolean {
    const liveIds = new Set(orbs.map((orb) => orb.id));
    let active = false;

    for (const orbId of [...this.values.keys()]) {
      if (!liveIds.has(orbId)) {
        this.values.delete(orbId);
      }
    }

    for (const orb of orbs) {
      const position = positions.get(orb.id) ?? orb.position;
      const target = effectAmountsAtPoint(
        fields,
        position,
      );
      const previous = this.values.get(orb.id);

      if (!previous) {
        this.values.set(orb.id, {
          value: target,
          lastTimestampMs: timestampMs,
        });
        continue;
      }

      const elapsed = Math.max(
        0,
        timestampMs - previous.lastTimestampMs,
      );
      const blend = reduceMotion
        ? 1
        : 1 - Math.exp(-elapsed / 82);
      const next = mixEffects(
        previous.value,
        target,
        Math.max(0.08, Math.min(1, blend)),
      );
      const delta = maxEffectDelta(
        next,
        target,
      );

      this.values.set(orb.id, {
        value: delta < 0.003
          ? target
          : next,
        lastTimestampMs: timestampMs,
      });

      if (delta >= 0.003) {
        active = true;
      }
    }

    return active;
  }

  public snapshot(): ReadonlyMap<string, EffectAmounts> {
    return new Map(
      [...this.values.entries()].map(
        ([orbId, entry]) => [orbId, entry.value],
      ),
    );
  }

  public get(orbId: string): EffectAmounts {
    return this.values.get(orbId)?.value
      ?? EMPTY_EFFECT_AMOUNTS;
  }

  public clear(): void {
    this.values.clear();
  }
}
