import type { ProceduralInstrument } from '../audio/ProceduralInstrument';
import type { SoundDefinition, SoundRole } from '../sounds/SoundDefinition';
import type { SoundOrbDocument } from '../world/SoundOrb';
import { midiForScaleDegree, type Harmony } from './Harmony';
import type { ScheduledTick } from './LookaheadScheduler';
import type { MusicalTransport } from './MusicalTransport';

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

  const step = tick.stepInBar;
  const beatSeconds = transport.secondsPerBeat;
  const velocityTrim = roleVelocityTrim(sound.role);

  switch (sound.pattern) {
    case 'kick-steady':
      if (step === 0 || step === 8) {
        const velocity = (step === 0 ? 0.96 : 0.84) * velocityTrim;
        instrument.schedule(sound.source.preset, tick.time, { velocity, gain });
        return velocity;
      }
      return null;

    case 'clap-backbeat':
      if (step === 4 || step === 12) {
        const velocity = 0.82 * velocityTrim;
        instrument.schedule(sound.source.preset, tick.time, { velocity, gain });
        return velocity;
      }
      return null;

    case 'hat-eighths':
      if (step % 2 === 0) {
        const velocity = (step % 4 === 2 ? 0.56 : 0.38) * velocityTrim;
        instrument.schedule(sound.source.preset, tick.time, { velocity, gain });
        return velocity;
      }
      return null;

    case 'shaker-offbeats':
      if (step === 2 || step === 6 || step === 10 || step === 14) {
        const velocity = (step === 6 || step === 14 ? 0.64 : 0.48) * velocityTrim;
        instrument.schedule(sound.source.preset, tick.time, { velocity, gain });
        return velocity;
      }
      return null;

    case 'bass-pulse': {
      const degrees: Readonly<Record<number, number>> = {
        0: 0,
        3: 0,
        7: 2,
        10: 3,
        14: 1,
      };
      const degree = degrees[step];

      if (degree === undefined) {
        return null;
      }

      const velocity = (step === 0 ? 0.94 : 0.7) * velocityTrim;
      instrument.schedule(sound.source.preset, tick.time, {
        midi: midiForScaleDegree(36, harmony, degree),
        duration: beatSeconds * 0.72,
        velocity,
        gain,
      });
      return velocity;
    }

    case 'harmony-pad':
      if ((step === 0 || step === 8) && tick.bar % 2 === 0) {
        const rootDegree = step === 0 ? 0 : 3;
        const velocity = 0.7 * velocityTrim;
        instrument.schedule(sound.source.preset, tick.time, {
          midiNotes: [
            midiForScaleDegree(48, harmony, rootDegree),
            midiForScaleDegree(48, harmony, rootDegree + 2),
            midiForScaleDegree(48, harmony, rootDegree + 4),
          ],
          duration: beatSeconds * 1.8,
          velocity,
          gain,
        });
        return velocity;
      }
      return null;

    case 'melody-spark': {
      const degrees: Readonly<Record<number, number>> = {
        3: 4,
        7: 3,
        11: 5,
        15: 2,
      };
      const degree = degrees[step];

      if (degree === undefined || tick.bar % 2 === 0) {
        return null;
      }

      const velocity = 0.62 * velocityTrim;
      instrument.schedule(sound.source.preset, tick.time, {
        midi: midiForScaleDegree(60, harmony, degree),
        duration: beatSeconds * 0.48,
        velocity,
        gain,
      });
      return velocity;
    }

    case 'texture-bed':
      if (step === 0 && tick.bar % 4 === 0) {
        const velocity = 0.52 * velocityTrim;
        instrument.schedule(sound.source.preset, tick.time, {
          duration: beatSeconds * 3.4,
          velocity,
          gain,
        });
        return velocity;
      }
      return null;

    case 'voice-hum':
      if (step === 0 && tick.bar % 2 === 1) {
        const velocity = 0.5 * velocityTrim;
        instrument.schedule(sound.source.preset, tick.time, {
          midiNotes: [
            midiForScaleDegree(48, harmony, 2),
            midiForScaleDegree(48, harmony, 4),
          ],
          duration: beatSeconds * 2.6,
          velocity,
          gain,
        });
        return velocity;
      }
      return null;
  }
}
