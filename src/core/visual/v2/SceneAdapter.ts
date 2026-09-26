import type { WorldDocument } from '../../world/World';
import {
  effectAmountsAtPoint,
  type EffectAmounts,
  type EffectFieldDocument,
} from '../../world/EffectField';
import type { PlaygroundToyDocument } from '../../world/PlaygroundToy';
import type { NormalizedPoint } from '../../world/SoundOrb';
import {
  IDLE_FIELD_INTERACTION,
  IDLE_ORB_INTERACTION,
} from './InteractionModel';
import type {
  RenderFieldInteraction,
  RenderLink,
  RenderOrbInteraction,
  RenderScene,
  RenderTrail,
} from './RenderTypes';
import { deriveWorldEnvironment } from './EnvironmentModel';
import {
  deriveFieldEnvironment,
  deriveFieldIntersections,
  deriveFieldMaterial,
} from './FieldMaterialModel';
import { deriveOrbMaterial } from './OrbMaterialModel';
const environmentCache = new WeakMap<
  WorldDocument,
  ReturnType<typeof deriveWorldEnvironment>
>();
const fieldSetCache = new WeakMap<
  readonly EffectFieldDocument[],
  {
    readonly intersections: ReturnType<typeof deriveFieldIntersections>;
    readonly environment: ReturnType<typeof deriveFieldEnvironment>;
  }
>();
const fieldMaterialCache = new WeakMap<
  EffectFieldDocument,
  ReturnType<typeof deriveFieldMaterial>
>();
const orbIndexCache = new WeakMap<
  WorldDocument,
  ReadonlyMap<string, WorldDocument['soundOrbs'][number]>
>();

function worldEnvironment(
  world: WorldDocument,
): ReturnType<typeof deriveWorldEnvironment> {
  let environment = environmentCache.get(world);

  if (!environment) {
    environment = deriveWorldEnvironment(world);
    environmentCache.set(world, environment);
  }

  return environment;
}

function fieldSet(
  fields: readonly EffectFieldDocument[],
): {
  readonly intersections: ReturnType<typeof deriveFieldIntersections>;
  readonly environment: ReturnType<typeof deriveFieldEnvironment>;
} {
  let cached = fieldSetCache.get(fields);

  if (!cached) {
    const intersections = deriveFieldIntersections(fields);
    cached = {
      intersections,
      environment: deriveFieldEnvironment(
        fields,
        intersections,
      ),
    };
    fieldSetCache.set(fields, cached);
  }

  return cached;
}

function fieldMaterial(
  field: EffectFieldDocument,
): ReturnType<typeof deriveFieldMaterial> {
  let material = fieldMaterialCache.get(field);

  if (!material) {
    material = deriveFieldMaterial(field);
    fieldMaterialCache.set(field, material);
  }

  return material;
}

function orbIndex(
  world: WorldDocument,
): ReadonlyMap<string, WorldDocument['soundOrbs'][number]> {
  let index = orbIndexCache.get(world);

  if (!index) {
    index = new Map(
      world.soundOrbs.map((orb) => [orb.id, orb]),
    );
    orbIndexCache.set(world, index);
  }

  return index;
}

import {
  deriveCrossEnvironment,
  deriveFieldCrossInteraction,
  deriveLinkCrossInteraction,
  deriveOrbCouplings,
  deriveOrbCrossInteractions,
  deriveToyCrossInteraction,
} from './CrossSystemModel';

export interface SceneProjectionOptions {
  readonly selectedOrbId: string | null;
  readonly focusedOrbId?: string | null;
  readonly selectedFieldId: string | null;
  readonly selectedToyId: string | null;
  readonly selectedLinkId: string | null;
  readonly playing: boolean;
  readonly recording: boolean;
  readonly liveOrbPositions?: ReadonlyMap<string, NormalizedPoint>;
  readonly orbInteractions?: ReadonlyMap<string, RenderOrbInteraction>;
  readonly orbFieldInfluenceOverrides?: ReadonlyMap<string, EffectAmounts>;
  readonly fieldInteractions?: ReadonlyMap<string, RenderFieldInteraction>;
  readonly trails?: readonly RenderTrail[];
  readonly fieldOverrides?: ReadonlyMap<string, EffectFieldDocument>;
  readonly toyOverrides?: ReadonlyMap<string, PlaygroundToyDocument>;
}

function effectiveFields(
  world: WorldDocument,
  overrides?: ReadonlyMap<string, EffectFieldDocument>,
): readonly EffectFieldDocument[] {
  if (!overrides || overrides.size === 0) {
    return world.effectFields;
  }

  return world.effectFields.map(
    (field) => overrides.get(field.id) ?? field,
  );
}

function effectiveToys(
  world: WorldDocument,
  overrides?: ReadonlyMap<string, PlaygroundToyDocument>,
): readonly PlaygroundToyDocument[] {
  if (!overrides || overrides.size === 0) {
    return world.playgroundToys;
  }

  return world.playgroundToys.map(
    (toy) => overrides.get(toy.id) ?? toy,
  );
}

export function projectWorldToRenderScene(
  world: WorldDocument,
  options: SceneProjectionOptions,
): RenderScene {
  const positions = new Map<string, NormalizedPoint>();
  const fieldDocuments = effectiveFields(
    world,
    options.fieldOverrides,
  );
  const toyDocuments = effectiveToys(
    world,
    options.toyOverrides,
  );

  for (const orb of world.soundOrbs) {
    positions.set(
      orb.id,
      options.liveOrbPositions?.get(orb.id) ?? orb.position,
    );
  }

  const orbCouplings = deriveOrbCouplings(
    world.soundOrbs,
    positions,
  );
  const orbCross = deriveOrbCrossInteractions(
    world.soundOrbs,
    positions,
    options.orbInteractions,
    toyDocuments,
    orbCouplings,
  );

  const orbs = world.soundOrbs.map((orb) => {
    const position = positions.get(orb.id) ?? orb.position;

    return {
      id: orb.id,
      role: orb.role,
      position,
      muted: orb.muted,
      selected: options.selectedOrbId === orb.id,
      focused: options.focusedOrbId === orb.id,
      interaction: options.orbInteractions?.get(orb.id)
        ?? IDLE_ORB_INTERACTION,
      cross: orbCross.get(orb.id) ?? {
        auraBlend: 0,
        neighborLight: 0,
        neighborDirection: { x: 0, y: 0 },
        wakeStrength: 0,
        wakeDirection: { x: 0, y: 0 },
        toyInfluence: null,
      },
      material: deriveOrbMaterial(
        orb,
        options.orbFieldInfluenceOverrides?.get(orb.id)
          ?? effectAmountsAtPoint(fieldDocuments, position),
      ),
    };
  });

  const fields = fieldDocuments.map(
    (field) => ({
      id: field.id,
      type: field.type,
      position: field.position,
      radius: field.radius,
      selected: options.selectedFieldId === field.id,
      interaction: options.fieldInteractions?.get(field.id)
        ?? IDLE_FIELD_INTERACTION,
      cross: deriveFieldCrossInteraction(
        field,
        toyDocuments,
        world.soundOrbs,
        positions,
      ),
      material: fieldMaterial(field),
    }),
  );

  const {
    intersections: fieldIntersections,
    environment: fieldEnvironment,
  } = fieldSet(fieldDocuments);

  const toys = toyDocuments.map(
    (toy) => ({
      id: toy.id,
      type: toy.type,
      position: toy.position,
      radius: toy.radius,
      selected: options.selectedToyId === toy.id,
      exitPosition: toy.exitPosition ?? null,
      cross: deriveToyCrossInteraction(
        toy,
        fieldDocuments,
        world.soundOrbs,
        positions,
      ),
    }),
  );

  const links: RenderLink[] = [];
  const indexedOrbs = orbIndex(world);

  for (const link of world.links) {
    const source = positions.get(link.sourceOrbId);
    const target = positions.get(link.targetOrbId);

    if (!source || !target) {
      continue;
    }

    const sourceOrb = indexedOrbs.get(link.sourceOrbId);
    const targetOrb = indexedOrbs.get(link.targetOrbId);

    if (!sourceOrb || !targetOrb) {
      continue;
    }

    links.push({
      id: link.id,
      type: link.type,
      sourceOrbId: link.sourceOrbId,
      targetOrbId: link.targetOrbId,
      sourceRole: sourceOrb.role,
      targetRole: targetOrb.role,
      source,
      target,
      selected: options.selectedLinkId === link.id,
      cross: deriveLinkCrossInteraction(
        link,
        source,
        target,
        fieldDocuments,
        toyDocuments,
      ),
    });
  }

  return {
    worldId: world.id,
    playing: options.playing,
    recording: options.recording,
    orbs,
    fields,
    fieldIntersections,
    fieldEnvironment,
    toys,
    links,
    orbCouplings,
    crossEnvironment: deriveCrossEnvironment(
      toyDocuments,
      orbCouplings,
    ),
    trails: options.trails ?? [],
    listener: { x: 0.5, y: 0.5 },
    environment: worldEnvironment(world),
  };
}
