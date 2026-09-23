import type { ProceduralInstrument } from '../audio/ProceduralInstrument';
import type { SoundDefinition, SoundRole } from '../sounds/SoundDefinition';
import type { SoundOrbDocument } from '../world/SoundOrb';
import { midiForScaleDegree, type Harmony } from './Harmony';
import type { ScheduledTick } from './LookaheadScheduler';
import type { MusicalTransport } from './MusicalTransport';
import {
  effectivePattern,
  grooveOffsetBeats,
  type MelodyPatternDocument,
} from './Pattern';

export interface ScheduledOrbEvent {
  readonly intensity: number;
  readonly time: number;
}

export interface OrbPatternContext {
  readonly orb: SoundOrbDocument;
  readonly sound: SoundDefinition;
  readonly tick: ScheduledTick;
  readonly transport: MusicalTransport;
  readonly harmony: Harmony;
  readonly instrument: ProceduralInstrument;
  readonly gain: number;
}

export interface ReactiveOrbContext {
  readonly orb: SoundOrbDocument;
  readonly sound: SoundDefinition;
  readonly time: number;
  readonly step: number;
  readonly transport: MusicalTransport;
  readonly harmony: Harmony;
  readonly instrument: ProceduralInstrument;
  readonly gain: number;
  readonly intensity?: number;
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

function nearestMelodyDegree(
  pattern: MelodyPatternDocument,
  step: number,
): number {
  const normalizedStep = ((Math.floor(step) % 16) + 16) % 16;
  const exact = pattern.notes[normalizedStep];

  if (exact !== null && exact !== undefined) {
    return exact;
  }

  for (let distance = 1; distance < 16; distance += 1) {
    const before = pattern.notes[(normalizedStep - distance + 16) % 16];
    if (before !== null && before !== undefined) {
      return before;
    }

    const after = pattern.notes[(normalizedStep + distance) % 16];
    if (after !== null && after !== undefined) {
      return after;
    }
  }

  return 0;
}

function scheduleTonalEvent(
  context: {
    readonly orb: SoundOrbDocument;
    readonly sound: SoundDefinition;
    readonly time: number;
    readonly step: number;
    readonly transport: MusicalTransport;
    readonly harmony: Harmony;
    readonly instrument: ProceduralInstrument;
    readonly gain: number;
    readonly velocity: number;
  },
): void {
  const {
    orb,
    sound,
    time,
    step,
    transport,
    harmony,
    instrument,
    gain,
    velocity,
  } = context;
  const pattern = effectivePattern(orb.pattern, sound);
  const degree = pattern?.kind === 'melody'
    ? nearestMelodyDegree(pattern, step)
    : 0;
  const baseMidi = melodicBaseMidi(sound.role);

  if (sound.role === 'harmony' || sound.role === 'voice') {
    instrument.schedule(sound.source.preset, time, {
      midiNotes: [
        midiForScaleDegree(baseMidi, harmony, degree),
        midiForScaleDegree(baseMidi, harmony, degree + 2),
        midiForScaleDegree(baseMidi, harmony, degree + 4),
      ],
      duration: transport.secondsPerBeat * (sound.role === 'harmony' ? 1.4 : 1.8),
      velocity,
      gain,
    });
    return;
  }

  instrument.schedule(sound.source.preset, time, {
    midi: midiForScaleDegree(baseMidi, harmony, degree),
    duration: transport.secondsPerBeat * (sound.role === 'bass' ? 0.56 : 0.36),
    velocity,
    gain,
  });
}

export function scheduleOrbPattern(
  context: OrbPatternContext,
): ScheduledOrbEvent | null {
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
      return {
        intensity: velocity,
        time: tick.time,
      };
    }

    return null;
  }

  const step = tick.stepInBar;
  const velocityTrim = roleVelocityTrim(sound.role);
  const eventTime = tick.time
    + transport.secondsPerBeat * grooveOffsetBeats(pattern.groove, step);

  if (pattern.kind === 'rhythm') {
    if (!pattern.steps[step]) {
      return null;
    }

    const velocity = (step % 4 === 0 ? 0.9 : 0.68) * velocityTrim;
    instrument.schedule(sound.source.preset, eventTime, {
      velocity,
      gain,
    });

    return {
      intensity: velocity,
      time: eventTime,
    };
  }

  const degree = pattern.notes[step];

  if (degree === null || degree === undefined) {
    return null;
  }

  const velocity = (step % 4 === 0 ? 0.76 : 0.62) * velocityTrim;

  scheduleTonalEvent({
    orb,
    sound,
    time: eventTime,
    step,
    transport,
    harmony,
    instrument,
    gain,
    velocity,
  });

  return {
    intensity: velocity,
    time: eventTime,
  };
}

export function scheduleReactiveOrbHit(
  context: ReactiveOrbContext,
): ScheduledOrbEvent | null {
  const {
    orb,
    sound,
    time,
    step,
    transport,
    harmony,
    instrument,
    gain,
  } = context;

  if (orb.muted) {
    return null;
  }

  const velocity = Math.max(
    0.2,
    Math.min(
      1,
      (context.intensity ?? 0.72) * roleVelocityTrim(sound.role),
    ),
  );

  if (sound.role === 'beat' || sound.role === 'percussion') {
    instrument.schedule(sound.source.preset, time, {
      velocity,
      gain,
    });
  } else if (sound.role === 'texture') {
    instrument.schedule(sound.source.preset, time, {
      duration: transport.secondsPerBeat * 1.4,
      velocity: velocity * 0.72,
      gain,
    });
  } else {
    scheduleTonalEvent({
      orb,
      sound,
      time,
      step,
      transport,
      harmony,
      instrument,
      gain,
      velocity,
    });
  }

  return {
    intensity: velocity,
    time,
  };
}
