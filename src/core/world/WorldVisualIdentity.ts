import type { EffectFieldType } from './EffectField';
import type { PlaygroundToyType } from './PlaygroundToy';
import type { SoundRole } from '../sounds/SoundDefinition';
import type { WorldDocument } from './World';

export interface WorldVisualOrb {
  readonly role: SoundRole;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}

export interface WorldVisualField {
  readonly type: EffectFieldType;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

export interface WorldVisualToy {
  readonly type: PlaygroundToyType;
  readonly x: number;
  readonly y: number;
}

export interface WorldVisualIdentity {
  readonly seed: number;
  readonly glyphA: number;
  readonly glyphB: number;
  readonly glyphC: number;
  readonly bpm: number;
  readonly orbCount: number;
  readonly linkCount: number;
  readonly density: number;
  readonly primaryRole: SoundRole | null;
  readonly orbs: readonly WorldVisualOrb[];
  readonly fields: readonly WorldVisualField[];
  readonly toys: readonly WorldVisualToy[];
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function roleScale(role: SoundRole): number {
  switch (role) {
    case 'texture':
      return 1;
    case 'harmony':
      return 0.92;
    case 'bass':
      return 0.86;
    case 'beat':
    case 'voice':
      return 0.76;
    case 'melody':
      return 0.68;
    case 'percussion':
      return 0.58;
  }
}

function primaryRole(world: WorldDocument): SoundRole | null {
  const counts = new Map<SoundRole, number>();

  for (const orb of world.soundOrbs) {
    counts.set(
      orb.role,
      (counts.get(orb.role) ?? 0) + 1,
    );
  }

  return [...counts.entries()]
    .sort((a, b) => (
      b[1] - a[1]
      || a[0].localeCompare(b[0])
    ))[0]?.[0] ?? null;
}

function stableSeed(world: WorldDocument): number {
  let hash = (world.music.seed >>> 0) || 2166136261;

  for (const value of [
    world.id,
    world.name,
    String(world.soundOrbs.length),
    String(world.effectFields.length),
    String(world.playgroundToys.length),
    String(world.links.length),
  ]) {
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
  }

  return hash >>> 0;
}

export function deriveWorldVisualIdentity(
  world: WorldDocument,
): WorldVisualIdentity {
  const seed = stableSeed(world);

  return {
    seed,
    glyphA: seed % 360,
    glyphB: (seed >>> 7) % 360,
    glyphC: (seed >>> 15) % 360,
    bpm: world.music.bpm,
    orbCount: world.soundOrbs.length,
    linkCount: world.links.length,
    density: clamp01(
      (
        world.soundOrbs.length
        + world.effectFields.length * 0.45
        + world.playgroundToys.length * 0.55
        + world.links.length * 0.25
      ) / 15,
    ),
    primaryRole: primaryRole(world),
    orbs: world.soundOrbs
      .slice(0, 9)
      .map((orb) => ({
        role: orb.role,
        x: clamp01(orb.position.x),
        y: clamp01(orb.position.y),
        scale: roleScale(orb.role),
      })),
    fields: world.effectFields
      .slice(0, 3)
      .map((field) => ({
        type: field.type,
        x: clamp01(field.position.x),
        y: clamp01(field.position.y),
        radius: clamp01(field.radius / 0.34),
      })),
    toys: world.playgroundToys
      .slice(0, 2)
      .map((toy) => ({
        type: toy.type,
        x: clamp01(toy.position.x),
        y: clamp01(toy.position.y),
      })),
  };
}
