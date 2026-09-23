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
    pattern: 'kick-steady',
    source: { type: 'procedural', preset: 'round-kick' },
  },
  {
    id: 'beat-punch-kick',
    name: 'Punch Kick',
    role: 'beat',
    description: 'Tighter kick with extra impact',
    tags: ['punchy', 'tight', 'bold'],
    energy: 0.88,
    brightness: 0.3,
    nominalDb: -15,
    loopBars: 1,
    pattern: 'kick-steady',
    source: { type: 'procedural', preset: 'punch-kick' },
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
    pattern: 'clap-backbeat',
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
    pattern: 'hat-eighths',
    source: { type: 'procedural', preset: 'glass-hat' },
  },
  {
    id: 'perc-dust-shaker',
    name: 'Dust Shaker',
    role: 'percussion',
    description: 'Dry off-beat shuffle',
    tags: ['dry', 'bouncy', 'dusty'],
    energy: 0.4,
    brightness: 0.72,
    nominalDb: -23,
    loopBars: 1,
    pattern: 'shaker-offbeats',
    source: { type: 'procedural', preset: 'dust-shaker' },
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
    pattern: 'bass-pulse',
    tonal: {
      root: 0,
      scale: 'minor-pentatonic',
      safePitchShiftSemitones: 6,
    },
    source: { type: 'procedural', preset: 'warm-bass' },
  },
  {
    id: 'bass-deep',
    name: 'Deep Bass',
    role: 'bass',
    description: 'Darker, heavier low pulse',
    tags: ['deep', 'heavy', 'dark'],
    energy: 0.8,
    brightness: 0.12,
    nominalDb: -18,
    loopBars: 2,
    pattern: 'bass-pulse',
    tonal: {
      root: 0,
      scale: 'minor-pentatonic',
      safePitchShiftSemitones: 6,
    },
    source: { type: 'procedural', preset: 'deep-bass' },
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
    pattern: 'harmony-pad',
    tonal: {
      root: 0,
      scale: 'minor-pentatonic',
      safePitchShiftSemitones: 6,
    },
    source: { type: 'procedural', preset: 'dream-chord' },
  },
  {
    id: 'harmony-glow',
    name: 'Glow Chords',
    role: 'harmony',
    description: 'Brighter, glassy harmony',
    tags: ['bright', 'glowing', 'open'],
    energy: 0.46,
    brightness: 0.72,
    nominalDb: -23,
    loopBars: 2,
    pattern: 'harmony-pad',
    tonal: {
      root: 0,
      scale: 'minor-pentatonic',
      safePitchShiftSemitones: 6,
    },
    source: { type: 'procedural', preset: 'glow-chord' },
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
    pattern: 'melody-spark',
    tonal: {
      root: 0,
      scale: 'minor-pentatonic',
      safePitchShiftSemitones: 6,
    },
    source: { type: 'procedural', preset: 'soft-pluck' },
  },
  {
    id: 'melody-bell',
    name: 'Tiny Bell',
    role: 'melody',
    description: 'Bright little melodic chime',
    tags: ['tiny', 'bright', 'bell'],
    energy: 0.5,
    brightness: 0.86,
    nominalDb: -23,
    loopBars: 2,
    pattern: 'melody-spark',
    tonal: {
      root: 0,
      scale: 'minor-pentatonic',
      safePitchShiftSemitones: 6,
    },
    source: { type: 'procedural', preset: 'bell-pluck' },
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
    pattern: 'texture-bed',
    source: { type: 'procedural', preset: 'air-texture' },
  },
  {
    id: 'texture-haze',
    name: 'Haze',
    role: 'texture',
    description: 'Dark slow-moving atmosphere',
    tags: ['hazy', 'dark', 'slow'],
    energy: 0.28,
    brightness: 0.28,
    nominalDb: -28,
    loopBars: 4,
    pattern: 'texture-bed',
    source: { type: 'procedural', preset: 'haze-texture' },
  },
  {
    id: 'voice-soft-hum',
    name: 'Soft Hum',
    role: 'voice',
    description: 'Gentle wordless humming layer',
    tags: ['voice', 'soft', 'human'],
    energy: 0.34,
    brightness: 0.38,
    nominalDb: -25,
    loopBars: 2,
    pattern: 'voice-hum',
    tonal: {
      root: 0,
      scale: 'minor-pentatonic',
      safePitchShiftSemitones: 6,
    },
    source: { type: 'procedural', preset: 'soft-hum' },
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
