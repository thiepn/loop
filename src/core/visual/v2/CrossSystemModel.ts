import {
  effectAmountsAtPoint,
  type EffectAmounts,
  type EffectFieldDocument,
  type EffectFieldType,
} from '../../world/EffectField';
import type {
  LinkDocument,
} from '../../world/Link';
import {
  toyDepthAtPoint,
  type PlaygroundToyDocument,
  type PlaygroundToyType,
} from '../../world/PlaygroundToy';
import type {
  NormalizedPoint,
  SoundOrbDocument,
} from '../../world/SoundOrb';
import {
  strongestToyInfluence,
} from './TrailModel';
import type {
  RenderCrossEnvironment,
  RenderFieldCrossInteraction,
  RenderLinkCrossInteraction,
  RenderOrbCoupling,
  RenderOrbCrossInteraction,
  RenderOrbInteraction,
  RenderToyCrossInteraction,
  RenderVector,
} from './RenderTypes';

const ZERO_EFFECTS: EffectAmounts = {
  space: 0,
  echo: 0,
  heat: 0,
  frost: 0,
  filter: 0,
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function direction(
  from: NormalizedPoint,
  to: NormalizedPoint,
): RenderVector {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);

  if (length <= 1e-6) {
    return { x: 0, y: 0 };
  }

  return {
    x: dx / length,
    y: dy / length,
  };
}

function distance(
  a: NormalizedPoint,
  b: NormalizedPoint,
): number {
  return Math.hypot(
    b.x - a.x,
    b.y - a.y,
  );
}

function proximityStrength(
  a: NormalizedPoint,
  b: NormalizedPoint,
  inner = 0.045,
  outer = 0.19,
): number {
  const d = distance(a, b);

  if (d >= outer) {
    return 0;
  }

  if (d <= inner) {
    return 1;
  }

  const t = 1 - (d - inner) / (outer - inner);
  return t * t * (3 - 2 * t);
}

function effectSum(
  target: EffectAmounts,
  source: EffectAmounts,
  weight: number,
): EffectAmounts {
  return {
    space: target.space + source.space * weight,
    echo: target.echo + source.echo * weight,
    heat: target.heat + source.heat * weight,
    frost: target.frost + source.frost * weight,
    filter: target.filter + source.filter * weight,
  };
}

function clampEffects(
  effects: EffectAmounts,
): EffectAmounts {
  return {
    space: clamp01(effects.space),
    echo: clamp01(effects.echo),
    heat: clamp01(effects.heat),
    frost: clamp01(effects.frost),
    filter: clamp01(effects.filter),
  };
}

function dominantEffect(
  effects: EffectAmounts,
): EffectFieldType | null {
  const entries = Object.entries(effects) as Array<
    [EffectFieldType, number]
  >;
  entries.sort((a, b) => b[1] - a[1]);

  return (entries[0]?.[1] ?? 0) > 0.04
    ? entries[0]![0]
    : null;
}

function stableSign(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return (hash & 1) === 0 ? 1 : -1;
}

function midpoint(
  a: NormalizedPoint,
  b: NormalizedPoint,
): NormalizedPoint {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

export function deriveOrbCouplings(
  orbs: readonly SoundOrbDocument[],
  positions: ReadonlyMap<string, NormalizedPoint>,
): readonly RenderOrbCoupling[] {
  const result: RenderOrbCoupling[] = [];

  for (let first = 0; first < orbs.length; first += 1) {
    for (
      let second = first + 1;
      second < orbs.length;
      second += 1
    ) {
      const a = orbs[first]!;
      const b = orbs[second]!;
      const positionA = positions.get(a.id) ?? a.position;
      const positionB = positions.get(b.id) ?? b.position;
      const strength = proximityStrength(
        positionA,
        positionB,
      );

      if (strength <= 0.025) {
        continue;
      }

      result.push({
        id: [a.id, b.id].sort().join('::'),
        orbAId: a.id,
        orbBId: b.id,
        roleA: a.role,
        roleB: b.role,
        positionA,
        positionB,
        midpoint: midpoint(positionA, positionB),
        strength,
      });
    }
  }

  const cap = orbs.length >= 9
    ? 6
    : orbs.length >= 6
      ? 9
      : 12;

  return result
    .sort((a, b) => (
      b.strength - a.strength
      || a.id.localeCompare(b.id)
    ))
    .slice(0, cap);
}

export function deriveOrbCrossInteractions(
  orbs: readonly SoundOrbDocument[],
  positions: ReadonlyMap<string, NormalizedPoint>,
  interactions: ReadonlyMap<string, RenderOrbInteraction> | undefined,
  toys: readonly PlaygroundToyDocument[],
  couplings: readonly RenderOrbCoupling[],
): ReadonlyMap<string, RenderOrbCrossInteraction> {
  const result = new Map<string, RenderOrbCrossInteraction>();
  const couplingByOrb = new Map<string, RenderOrbCoupling[]>();

  for (const coupling of couplings) {
    for (const orbId of [coupling.orbAId, coupling.orbBId]) {
      const list = couplingByOrb.get(orbId) ?? [];
      list.push(coupling);
      couplingByOrb.set(orbId, list);
    }
  }

  for (const orb of orbs) {
    const position = positions.get(orb.id) ?? orb.position;
    const localCouplings = couplingByOrb.get(orb.id) ?? [];
    const strongest = [...localCouplings].sort(
      (a, b) => b.strength - a.strength,
    )[0];
    const otherPosition = strongest
      ? strongest.orbAId === orb.id
        ? strongest.positionB
        : strongest.positionA
      : position;
    const neighborLight = clamp01(
      localCouplings.reduce(
        (sum, coupling) => sum + coupling.strength * 0.42,
        0,
      ),
    );

    let wakeStrength = 0;
    let wakeDirection: RenderVector = { x: 0, y: 0 };

    for (const source of orbs) {
      if (source.id === orb.id) {
        continue;
      }

      const interaction = interactions?.get(source.id);

      if (!interaction || interaction.dragSpeed <= 0.03) {
        continue;
      }

      const sourcePosition = positions.get(source.id) ?? source.position;
      const proximity = proximityStrength(
        sourcePosition,
        position,
        0.04,
        0.23,
      );
      const candidate = clamp01(
        interaction.dragSpeed
        * proximity
        * 0.72,
      );

      if (candidate > wakeStrength) {
        wakeStrength = candidate;
        wakeDirection = direction(
          sourcePosition,
          position,
        );
      }
    }

    result.set(orb.id, {
      auraBlend: strongest?.strength ?? 0,
      neighborLight,
      neighborDirection: strongest
        ? direction(position, otherPosition)
        : { x: 0, y: 0 },
      wakeStrength,
      wakeDirection,
      toyInfluence: strongestToyInfluence(
        toys,
        position,
      ),
    });
  }

  return result;
}

function sampleLinkEffects(
  source: NormalizedPoint,
  target: NormalizedPoint,
  fields: readonly EffectFieldDocument[],
): EffectAmounts {
  let total = { ...ZERO_EFFECTS };
  const samples = [0.18, 0.34, 0.5, 0.66, 0.82];

  for (const t of samples) {
    const point = {
      x: source.x + (target.x - source.x) * t,
      y: source.y + (target.y - source.y) * t,
    };
    total = effectSum(
      total,
      effectAmountsAtPoint(fields, point),
      1 / samples.length,
    );
  }

  return clampEffects(total);
}

function strongestFieldAtPoint(
  fields: readonly EffectFieldDocument[],
  point: NormalizedPoint,
): {
  field: EffectFieldDocument;
  amount: number;
} | null {
  let selectedField: EffectFieldDocument | undefined;
  let selectedAmount = 0;

  for (const field of fields) {
    const amount = effectAmountsAtPoint(
      [field],
      point,
    )[field.type];

    if (
      amount > selectedAmount
      || (
        amount === selectedAmount
        && amount > 0
        && field.id.localeCompare(
          selectedField?.id ?? '',
        ) < 0
      )
    ) {
      selectedField = field;
      selectedAmount = amount;
    }
  }

  if (!selectedField || selectedAmount <= 0.03) {
    return null;
  }

  return {
    field: selectedField,
    amount: selectedAmount,
  };
}

export function deriveLinkCrossInteraction(
  link: LinkDocument,
  source: NormalizedPoint,
  target: NormalizedPoint,
  fields: readonly EffectFieldDocument[],
  toys: readonly PlaygroundToyDocument[],
): RenderLinkCrossInteraction {
  const effects = sampleLinkEffects(
    source,
    target,
    fields,
  );
  const middle = midpoint(source, target);
  const strongestField = strongestFieldAtPoint(
    fields,
    middle,
  );
  const radialDirection = strongestField
    ? direction(strongestField.field.position, middle)
    : { x: 0, y: 0 };
  const linkDirection = direction(source, target);
  const refractionDirection = strongestField
    ? Math.hypot(
        radialDirection.x,
        radialDirection.y,
      ) > 0.001
      ? radialDirection
      : {
          x: -linkDirection.y * stableSign(link.id),
          y: linkDirection.x * stableSign(link.id),
        }
    : { x: 0, y: 0 };
  const toy = strongestToyInfluence(
    toys,
    middle,
  );

  return {
    fieldInfluence: effects,
    dominantField: dominantEffect(effects),
    refractionDirection,
    refractionStrength: clamp01(
      (strongestField?.amount ?? 0)
      * (
        0.35
        + effects.space * 0.35
        + effects.heat * 0.2
        + effects.frost * 0.1
      ),
    ),
    toyInfluence: toy,
  };
}

export function deriveFieldCrossInteraction(
  field: EffectFieldDocument,
  toys: readonly PlaygroundToyDocument[],
  orbs: readonly SoundOrbDocument[],
  positions: ReadonlyMap<string, NormalizedPoint>,
): RenderFieldCrossInteraction {
  let nearbyOrbEnergy = 0;

  for (const orb of orbs) {
    const position = positions.get(orb.id) ?? orb.position;
    const depth = effectAmountsAtPoint(
      [field],
      position,
    )[field.type];

    nearbyOrbEnergy += depth * (orb.muted ? 0.22 : 0.46);
  }

  return {
    toyInfluence: strongestToyInfluence(
      toys,
      field.position,
    ),
    nearbyOrbEnergy: clamp01(nearbyOrbEnergy),
  };
}

export function deriveToyCrossInteraction(
  toy: PlaygroundToyDocument,
  fields: readonly EffectFieldDocument[],
  orbs: readonly SoundOrbDocument[],
  positions: ReadonlyMap<string, NormalizedPoint>,
): RenderToyCrossInteraction {
  let nearbyOrbStrength = 0;
  let weightedX = 0;
  let weightedY = 0;
  let totalWeight = 0;

  for (const orb of orbs) {
    const position = positions.get(orb.id) ?? orb.position;
    const depth = toyDepthAtPoint(toy, position);
    const weight = depth * (orb.muted ? 0.35 : 1);

    nearbyOrbStrength += weight * 0.45;
    weightedX += (
      position.x - toy.position.x
    ) * weight;
    weightedY += (
      position.y - toy.position.y
    ) * weight;
    totalWeight += weight;
  }

  const nearbyDirection = totalWeight > 0
    ? direction(
        toy.position,
        {
          x: toy.position.x + weightedX / totalWeight,
          y: toy.position.y + weightedY / totalWeight,
        },
      )
    : { x: 0, y: 0 };

  return {
    fieldInfluence: effectAmountsAtPoint(
      fields,
      toy.position,
    ),
    nearbyOrbStrength: clamp01(nearbyOrbStrength),
    nearbyOrbDirection: nearbyDirection,
  };
}

function forcePriority(
  type: PlaygroundToyType,
): number {
  switch (type) {
    case 'portal':
      return 4;
    case 'repulsor':
      return 3;
    case 'magnet':
      return 2;
    case 'spinner':
      return 1;
  }
}

export function deriveCrossEnvironment(
  toys: readonly PlaygroundToyDocument[],
  couplings: readonly RenderOrbCoupling[],
): RenderCrossEnvironment {
  const strongest = [...toys]
    .map((toy) => ({
      toy,
      score: clamp01(
        toy.strength
        * (0.55 + toy.radius * 1.8),
      ),
    }))
    .sort((a, b) => (
      b.score - a.score
      || forcePriority(b.toy.type) - forcePriority(a.toy.type)
      || a.toy.id.localeCompare(b.toy.id)
    ))[0];

  return {
    forceType: strongest?.toy.type ?? null,
    forcePosition: strongest?.toy.position ?? {
      x: 0.5,
      y: 0.5,
    },
    forceStrength: strongest?.score ?? 0,
    couplingEnergy: clamp01(
      couplings.reduce(
        (sum, coupling) => sum + coupling.strength * 0.18,
        0,
      ),
    ),
  };
}

export function toyForceMode(
  type: PlaygroundToyType | null,
): number {
  switch (type) {
    case 'spinner':
      return 1;
    case 'magnet':
      return 2;
    case 'repulsor':
      return 3;
    case 'portal':
      return 4;
    case null:
      return 0;
  }
}
