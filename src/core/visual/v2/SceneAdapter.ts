import type { WorldDocument } from '../../world/World';
import {
  effectAmountsAtPoint,
  type EffectFieldDocument,
} from '../../world/EffectField';
import type { PlaygroundToyDocument } from '../../world/PlaygroundToy';
import type { NormalizedPoint } from '../../world/SoundOrb';
import type { RenderLink, RenderScene } from './RenderTypes';
import { deriveWorldEnvironment } from './EnvironmentModel';
import { deriveOrbMaterial } from './OrbMaterialModel';

export interface SceneProjectionOptions {
  readonly selectedOrbId: string | null;
  readonly selectedFieldId: string | null;
  readonly selectedToyId: string | null;
  readonly selectedLinkId: string | null;
  readonly playing: boolean;
  readonly recording: boolean;
  readonly liveOrbPositions?: ReadonlyMap<string, NormalizedPoint>;
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

  const orbs = world.soundOrbs.map((orb) => {
    const position = options.liveOrbPositions?.get(orb.id) ?? orb.position;
    positions.set(orb.id, position);

    return {
      id: orb.id,
      role: orb.role,
      position,
      muted: orb.muted,
      selected: options.selectedOrbId === orb.id,
      material: deriveOrbMaterial(
        orb,
        effectAmountsAtPoint(fieldDocuments, position),
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
    }),
  );

  const toys = effectiveToys(world, options.toyOverrides).map(
    (toy) => ({
      id: toy.id,
      type: toy.type,
      position: toy.position,
      radius: toy.radius,
      selected: options.selectedToyId === toy.id,
      exitPosition: toy.exitPosition ?? null,
    }),
  );

  const links: RenderLink[] = [];

  for (const link of world.links) {
    const source = positions.get(link.sourceOrbId);
    const target = positions.get(link.targetOrbId);

    if (!source || !target) {
      continue;
    }

    links.push({
      id: link.id,
      type: link.type,
      sourceOrbId: link.sourceOrbId,
      targetOrbId: link.targetOrbId,
      source,
      target,
      selected: options.selectedLinkId === link.id,
    });
  }

  return {
    worldId: world.id,
    playing: options.playing,
    recording: options.recording,
    orbs,
    fields,
    toys,
    links,
    listener: { x: 0.5, y: 0.5 },
    environment: deriveWorldEnvironment(world),
  };
}
