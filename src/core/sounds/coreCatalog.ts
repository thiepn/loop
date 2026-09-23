import {
  assertSoundDefinition,
  type SoundDefinition,
  type SoundRole,
} from './SoundDefinition';

const catalog: readonly SoundDefinition[] = [
  {
    id: 'beat-round-kick',
    name: 'Round Kick',
    role: 'beat',
    description: 'Deep, soft-edged pulse',
    tags: ['round', 'deep', 'steady'],
    energy: 0.72,
    brightness: 0.16,
    nominalDb: -14,
    loopBars: 1,
    source: { type: 'procedural', preset: 'round-kick' },
  },
  {
    id: 'perc-soft-clap',
    name: 'Soft Clap',
    role: 'percussion',
    description: 'Warm clap with a short tail',
    tags: ['soft', 'warm', 'backbeat'],
    energy: 0.52,
    brightness: 0.62,
    nominalDb: -18,
    loopBars: 1,
    source: { type: 'procedural', preset: 'soft-clap' },
  },
  {
    id: 'perc-glass-hat',
    name: 'Glass Hats',
    role: 'percussion',
    description: 'Light sparkling rhythm',
    tags: ['light', 'sparkly', 'quick'],
    energy: 0.48,
    brightness: 0.9,
    nominalDb: -22,
    loopBars: 1,
    source: { type: 'procedural', preset: 'glass-hat' },
  },
  {
    id: 'bass-warm',
    name: 'Warm Bass',
    role: 'bass',
    description: 'Rounded low melody',
    tags: ['warm', 'smooth', 'low'],
    energy: 0.66,
    brightness: 0.25,
    nominalDb: -17,
    loopBars: 2,
    tonal: {
      root: 0,
      scale: 'minor-pentatonic',
      safePitchShiftSemitones: 6,
    },
    source: { type: 'procedural', preset: 'warm-bass' },
  },
  {
    id: 'harmony-dream',
    name: 'Dream Chords',
    role: 'harmony',
    description: 'Soft floating harmony',
    tags: ['dreamy', 'soft', 'wide'],
    energy: 0.38,
    brightness: 0.48,
    nominalDb: -22,
    loopBars: 2,
    tonal: {
      root: 0,
      scale: 'minor-pentatonic',
      safePitchShiftSemitones: 6,
    },
    source: { type: 'procedural', preset: 'dream-chord' },
  },
  {
    id: 'melody-soft-pluck',
    name: 'Soft Pluck',
    role: 'melody',
    description: 'Small rounded melodic spark',
    tags: ['gentle', 'clear', 'playful'],
    energy: 0.44,
    brightness: 0.7,
    nominalDb: -21,
    loopBars: 2,
    tonal: {
      root: 0,
      scale: 'minor-pentatonic',
      safePitchShiftSemitones: 6,
    },
    source: { type: 'procedural', preset: 'soft-pluck' },
  },
  {
    id: 'texture-air',
    name: 'Air',
    role: 'texture',
    description: 'Quiet drifting atmosphere',
    tags: ['airy', 'soft', 'background'],
    energy: 0.2,
    brightness: 0.58,
    nominalDb: -28,
    loopBars: 4,
    source: { type: 'procedural', preset: 'air-texture' },
  },
] as const;

function validateCatalog(definitions: readonly SoundDefinition[]): void {
  const ids = new Set<string>();

  for (const definition of definitions) {
    assertSoundDefinition(definition);

    if (ids.has(definition.id)) {
      throw new Error(`Duplicate sound id: ${definition.id}`);
    }

    ids.add(definition.id);
  }
}

validateCatalog(catalog);

export const CORE_SOUND_CATALOG = catalog;

export function soundById(id: string): SoundDefinition | undefined {
  return CORE_SOUND_CATALOG.find((sound) => sound.id === id);
}

export function soundsByRole(role: SoundRole): readonly SoundDefinition[] {
  return CORE_SOUND_CATALOG.filter((sound) => sound.role === role);
}
