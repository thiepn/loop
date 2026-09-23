import type { ProceduralInstrument } from '../audio/ProceduralInstrument';
import type { SoundDefinition, SoundRole } from '../sounds/SoundDefinition';
import type { SoundOrbDocument } from '../world/SoundOrb';
import { midiForScaleDegree, type Harmony } from './Harmony';
import type { ScheduledTick } from './LookaheadScheduler';
import type { MusicalTransport } from './MusicalTransport';
import {
  effectivePattern,
  grooveOffsetBeats,
} from './Pattern';

export interface OrbPatternContext {
  readonly orb: SoundOrbDocument;
  readonly sound: SoundDefinition;
  readonly tick: ScheduledTick;
  readonly transport: MusicalTransport;
  readonly harmony: Harmony;
  readonly instrument: ProceduralInstrument;
  readonly gain: number;
}

function roleVelocityTrim(role: SoundRole): number {
  switch (role) {
    case 'beat':
      return 1;
    case 'bass':
      return 0.92;
    case 'percussion':
      return 0.84;
    case 'harmony':
      return 0.76;
    case 'melody':
      return 0.8;
    case 'texture':
      return 0.66;
    case 'voice':
      return 0.82;
  }
}

function melodicBaseMidi(role: SoundRole): number {
  switch (role) {
    case 'bass':
      return 36;
    case 'harmony':
    case 'voice':
      return 48;
    case 'melody':
      return 60;
    case 'beat':
    case 'percussion':
    case 'texture':
      return 60;
  }
}

export function scheduleOrbPattern(context: OrbPatternContext): number | null {
  const {
    orb,
    sound,
    tick,
    transport,
    harmony,
    instrument,
    gain,
  } = context;

  if (orb.muted) {
    return null;
  }

  const pattern = effectivePattern(orb.pattern, sound);

  if (!pattern) {
    if (sound.pattern === 'texture-bed' && tick.stepInBar === 0 && tick.bar % 4 === 0) {
      const velocity = 0.34;
      instrument.schedule(sound.source.preset, tick.time, {
        duration: transport.secondsPerBeat * 3.4,
        velocity,
        gain,
      });
      return velocity;
    }

    return null;
  }

  const step = tick.stepInBar;
  const velocityTrim = roleVelocityTrim(sound.role);
  const eventTime = tick.time + transport.secondsPerBeat * grooveOffsetBeats(pattern.groove, step);

  if (pattern.kind === 'rhythm') {
    if (!pattern.steps[step]) {
      return null;
    }

    const velocity = (step % 4 === 0 ? 0.9 : 0.68) * velocityTrim;
    instrument.schedule(sound.source.preset, eventTime, {
      velocity,
      gain,
    });
    return velocity;
  }

  const degree = pattern.notes[step];

  if (degree === null || degree === undefined) {
    return null;
  }

  const velocity = (step % 4 === 0 ? 0.76 : 0.62) * velocityTrim;
  const baseMidi = melodicBaseMidi(sound.role);

  if (sound.role === 'harmony' || sound.role === 'voice') {
    const thirdOffset = sound.role === 'harmony' ? 2 : 2;
    const fifthOffset = sound.role === 'harmony' ? 4 : 4;
    instrument.schedule(sound.source.preset, eventTime, {
      midiNotes: [
        midiForScaleDegree(baseMidi, harmony, degree),
        midiForScaleDegree(baseMidi, harmony, degree + thirdOffset),
        midiForScaleDegree(baseMidi, harmony, degree + fifthOffset),
      ],
      duration: transport.secondsPerBeat * (sound.role === 'harmony' ? 1.65 : 2.2),
      velocity,
      gain,
    });
    return velocity;
  }

  instrument.schedule(sound.source.preset, eventTime, {
    midi: midiForScaleDegree(baseMidi, harmony, degree),
    duration: transport.secondsPerBeat * (sound.role === 'bass' ? 0.68 : 0.45),
    velocity,
    gain,
  });

  return velocity;
}
