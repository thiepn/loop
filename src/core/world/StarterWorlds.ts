import { createEffectField, type EffectFieldType } from './EffectField';
import { createMotion, type CreateMotionOptions } from './Motion';
import { createPlaygroundToy } from './PlaygroundToy';
import { createSoundOrb } from './SoundOrb';
import { createEmptyWorld, type WorldDocument } from './World';

export type StarterWorldId =
  | 'beat'
  | 'chill'
  | 'dreamy'
  | 'dance'
  | 'weird'
  | 'empty';

export interface StarterWorldDefinition {
  readonly id: StarterWorldId;
  readonly name: string;
  readonly description: string;
  readonly mood: string;
}

export const STARTER_WORLDS: readonly StarterWorldDefinition[] = [
  {
    id: 'beat',
    name: 'Beat',
    description: 'Punchy and simple',
    mood: 'bold',
  },
  {
    id: 'chill',
    name: 'Chill',
    description: 'Soft and laid-back',
    mood: 'calm',
  },
  {
    id: 'dreamy',
    name: 'Dreamy',
    description: 'Floating and gentle',
    mood: 'dreamy',
  },
  {
    id: 'dance',
    name: 'Dance',
    description: 'Bright and energetic',
    mood: 'bright',
  },
  {
    id: 'weird',
    name: 'Weird',
    description: 'Odd but still musical',
    mood: 'strange',
  },
  {
    id: 'empty',
    name: 'Empty',
    description: 'Start with silence',
    mood: 'empty',
  },
] as const;

function orb(
  id: string,
  soundId: string,
  role: Parameters<typeof createSoundOrb>[0]['role'],
  x: number,
  y: number,
  motion?: CreateMotionOptions,
) {
  const base = {
    id,
    soundId,
    role,
    position: { x, y },
  };

  return createSoundOrb(
    motion
      ? { ...base, motion: createMotion(motion) }
      : base,
  );
}

function field(
  id: string,
  type: EffectFieldType,
  x: number,
  y: number,
  radius: number,
) {
  return createEffectField({
    id,
    type,
    position: { x, y },
    radius,
  });
}

export function createStarterWorld(
  starterId: StarterWorldId,
  now = Date.now(),
): WorldDocument {
  switch (starterId) {
    case 'beat':
      return createEmptyWorld({
        name: 'Pocket Beat',
        now,
        music: { bpm: 106, tonic: 0, scale: 'minor-pentatonic', seed: 11 },
        soundOrbs: [
          orb('beat-kick', 'beat-punch-kick', 'beat', 0.25, 0.61),
          orb('beat-clap', 'perc-soft-clap', 'percussion', 0.72, 0.64),
          orb('beat-hats', 'perc-glass-hat', 'percussion', 0.68, 0.26),
          orb('beat-bass', 'bass-warm', 'bass', 0.32, 0.31),
          orb('beat-chords', 'harmony-dream', 'harmony', 0.76, 0.42, {
            mode: 'drift',
            speed: 'slow',
            range: 'tight',
            seed: 111,
          }),
        ],
        effectFields: [
          field('beat-echo', 'echo', 0.68, 0.26, 0.15),
        ],
      });

    case 'chill':
      return createEmptyWorld({
        name: 'Soft Current',
        now,
        music: { bpm: 88, tonic: 5, scale: 'major-pentatonic', seed: 23 },
        soundOrbs: [
          orb('chill-kick', 'beat-round-kick', 'beat', 0.28, 0.64),
          orb('chill-shaker', 'perc-dust-shaker', 'percussion', 0.73, 0.28),
          orb('chill-bass', 'bass-warm', 'bass', 0.36, 0.3),
          orb('chill-chords', 'harmony-glow', 'harmony', 0.68, 0.66),
          orb('chill-air', 'texture-air', 'texture', 0.83, 0.48, {
            mode: 'drift',
            speed: 'slow',
            range: 'medium',
            seed: 223,
          }),
        ],
        effectFields: [
          field('chill-space', 'space', 0.72, 0.64, 0.21),
        ],
      });

    case 'dreamy':
      return createEmptyWorld({
        name: 'Dream Garden',
        now,
        music: { bpm: 96, tonic: 0, scale: 'minor-pentatonic', seed: 37 },
        soundOrbs: [
          orb('dream-kick', 'beat-round-kick', 'beat', 0.22, 0.6),
          orb('dream-bass', 'bass-warm', 'bass', 0.3, 0.32),
          orb('dream-chords', 'harmony-dream', 'harmony', 0.72, 0.67),
          orb('dream-melody', 'melody-bell', 'melody', 0.58, 0.2, {
            mode: 'orbit',
            speed: 'slow',
            range: 'tight',
            seed: 337,
          }),
          orb('dream-air', 'texture-air', 'texture', 0.83, 0.5),
          orb('dream-hum', 'voice-soft-hum', 'voice', 0.48, 0.76),
        ],
        effectFields: [
          field('dream-frost', 'frost', 0.58, 0.2, 0.14),
          field('dream-space', 'space', 0.76, 0.62, 0.2),
        ],
      });

    case 'dance':
      return createEmptyWorld({
        name: 'Neon Steps',
        now,
        music: { bpm: 124, tonic: 2, scale: 'minor-pentatonic', seed: 51 },
        soundOrbs: [
          orb('dance-kick', 'beat-punch-kick', 'beat', 0.22, 0.58),
          orb('dance-clap', 'perc-soft-clap', 'percussion', 0.76, 0.61),
          orb('dance-hats', 'perc-glass-hat', 'percussion', 0.72, 0.25, {
            mode: 'bounce',
            speed: 'medium',
            range: 'tight',
            seed: 451,
          }),
          orb('dance-bass', 'bass-deep', 'bass', 0.33, 0.29),
          orb('dance-chords', 'harmony-glow', 'harmony', 0.69, 0.7),
          orb('dance-melody', 'melody-soft-pluck', 'melody', 0.52, 0.17),
        ],
        effectFields: [
          field('dance-echo', 'echo', 0.72, 0.25, 0.16),
          field('dance-heat', 'heat', 0.33, 0.29, 0.13),
        ],
      });

    case 'weird':
      return createEmptyWorld({
        name: 'Odd Orbit',
        now,
        music: { bpm: 112, tonic: 7, scale: 'minor-pentatonic', seed: 79 },
        soundOrbs: [
          orb('weird-kick', 'beat-round-kick', 'beat', 0.16, 0.48),
          orb('weird-shaker', 'perc-dust-shaker', 'percussion', 0.82, 0.2),
          orb('weird-bass', 'bass-deep', 'bass', 0.72, 0.78),
          orb('weird-chords', 'harmony-dream', 'harmony', 0.26, 0.24),
          orb('weird-bell', 'melody-bell', 'melody', 0.85, 0.56),
          orb('weird-haze', 'texture-haze', 'texture', 0.45, 0.82, {
            mode: 'wander',
            speed: 'slow',
            range: 'medium',
            seed: 579,
          }),
          orb('weird-hum', 'voice-soft-hum', 'voice', 0.5, 0.16),
        ],
        effectFields: [
          field('weird-frost', 'frost', 0.85, 0.56, 0.16),
          field('weird-filter', 'filter', 0.26, 0.24, 0.18),
        ],
        playgroundToys: [
          createPlaygroundToy({
            id: 'weird-spinner',
            type: 'spinner',
            position: { x: 0.5, y: 0.52 },
            radius: 0.14,
            strength: 0.62,
          }),
        ],
      });

    case 'empty':
      return createEmptyWorld({
        name: 'Empty World',
        now,
        music: { bpm: 108, tonic: 0, scale: 'minor-pentatonic', seed: 101 },
      });
  }
}

export function createSurpriseWorld(seed = Date.now(), now = Date.now()): WorldDocument {
  const candidates = STARTER_WORLDS.filter((world) => world.id !== 'empty');
  const index = Math.abs(Math.floor(seed)) % candidates.length;
  const picked = candidates[index] ?? STARTER_WORLDS[0];

  if (!picked) {
    return createStarterWorld('beat', now);
  }

  const world = createStarterWorld(picked.id, now);

  return {
    ...world,
    id: `surprise-${Math.abs(Math.floor(seed)).toString(36)}`,
    name: `Surprise · ${world.name}`,
    music: {
      ...world.music,
      seed: Math.abs(Math.floor(seed)) || 1,
    },
  };
}
