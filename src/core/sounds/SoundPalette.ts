import type { WorldDocument } from '../world/World';
import { CORE_SOUND_CATALOG } from './coreCatalog';
import type { SoundDefinition, SoundRole } from './SoundDefinition';

export type SoundPaletteCategoryId =
  | 'beat'
  | 'bass'
  | 'chords'
  | 'melody'
  | 'texture'
  | 'voice';

export interface SoundPaletteCategory {
  readonly id: SoundPaletteCategoryId;
  readonly name: string;
  readonly description: string;
  readonly roles: readonly SoundRole[];
}

export const SOUND_PALETTE_CATEGORIES: readonly SoundPaletteCategory[] = [
  {
    id: 'beat',
    name: 'Beat',
    description: 'Kick, clap, hats and movement',
    roles: ['beat', 'percussion'],
  },
  {
    id: 'bass',
    name: 'Bass',
    description: 'Low sounds that hold things down',
    roles: ['bass'],
  },
  {
    id: 'chords',
    name: 'Chords',
    description: 'Soft musical atmosphere',
    roles: ['harmony'],
  },
  {
    id: 'melody',
    name: 'Melody',
    description: 'Small musical sparks',
    roles: ['melody'],
  },
  {
    id: 'texture',
    name: 'Texture',
    description: 'Air, haze and background color',
    roles: ['texture'],
  },
  {
    id: 'voice',
    name: 'Voice',
    description: 'Simple human-like layers',
    roles: ['voice'],
  },
] as const;

export function soundsForCategory(
  categoryId: SoundPaletteCategoryId,
): readonly SoundDefinition[] {
  const category = SOUND_PALETTE_CATEGORIES.find((item) => item.id === categoryId);

  if (!category) {
    return [];
  }

  return CORE_SOUND_CATALOG.filter((sound) => category.roles.includes(sound.role));
}

export function paletteCategoryForRole(role: SoundRole): SoundPaletteCategoryId {
  if (role === 'beat' || role === 'percussion') {
    return 'beat';
  }

  if (role === 'harmony') {
    return 'chords';
  }

  return role;
}

function deterministicIndex(seed: number, length: number): number {
  if (length <= 0) {
    return 0;
  }

  let value = Math.abs(Math.floor(seed)) || 1;
  value = (value * 1664525 + 1013904223) >>> 0;
  return value % length;
}

export function surpriseSoundForWorld(world: WorldDocument): SoundDefinition | null {
  const used = new Set(world.soundOrbs.map((orb) => orb.soundId));
  const unused = CORE_SOUND_CATALOG.filter((sound) => !used.has(sound.id));
  const pool = unused.length > 0 ? unused : CORE_SOUND_CATALOG;

  return pool[deterministicIndex(world.music.seed + world.soundOrbs.length * 17, pool.length)] ?? null;
}
