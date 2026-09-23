import { ProceduralInstrument } from '../audio/ProceduralInstrument';
import { recommendedVoiceGain } from './MixPolicy';
import { midiForScaleDegree, type Harmony } from './Harmony';
import { LookaheadScheduler, type ScheduledTick } from './LookaheadScheduler';
import { MusicalTransport } from './MusicalTransport';
import { soundById } from '../sounds/coreCatalog';

export interface FoundationGrooveOptions {
  readonly bpm?: number;
  readonly harmony?: Harmony;
}

const ACTIVE_LAYER_COUNT = 6;

function catalogGain(id: string, roleTrimDb = 0): number {
  const definition = soundById(id);

  if (!definition) {
    return 0.4;
  }

  return recommendedVoiceGain(
    definition.nominalDb,
    ACTIVE_LAYER_COUNT,
    roleTrimDb,
  );
}

export class FoundationGroove {
  public readonly transport: MusicalTransport;

  private readonly scheduler: LookaheadScheduler;
  private readonly instrument: ProceduralInstrument;
  private readonly harmony: Harmony;
  private unsubscribeTicks: (() => void) | null = null;
  private playing = false;

  public constructor(
    private readonly context: AudioContext,
    destination: AudioNode,
    options: FoundationGrooveOptions = {},
  ) {
    this.transport = new MusicalTransport({
      bpm: options.bpm ?? 108,
      beatsPerBar: 4,
    });

    this.harmony = options.harmony ?? {
      tonic: 0,
      scale: 'minor-pentatonic',
    };

    this.scheduler = new LookaheadScheduler(
      () => this.context.currentTime,
      this.transport,
      {
        intervalMs: 25,
        scheduleAheadSeconds: 0.14,
        stepsPerBeat: 4,
      },
    );

    this.instrument = new ProceduralInstrument(context, destination);
  }

  public get isPlaying(): boolean {
    return this.playing;
  }

  public start(): void {
    if (this.playing) {
      return;
    }

    const startTime = this.context.currentTime + 0.08;
    this.transport.start(startTime, 0);
    this.unsubscribeTicks = this.scheduler.subscribe((tick) => this.scheduleTick(tick));
    this.scheduler.start();
    this.playing = true;
  }

  public stop(): void {
    if (!this.playing) {
      return;
    }

    this.scheduler.stop();
    this.unsubscribeTicks?.();
    this.unsubscribeTicks = null;
    this.instrument.stopAll(this.context.currentTime + 0.015);
    this.transport.stop(this.context.currentTime);
    this.playing = false;
  }

  public setBpm(bpm: number): void {
    this.transport.setBpm(bpm, this.context.currentTime);
  }

  private scheduleTick(tick: ScheduledTick): void {
    const step = tick.stepInBar;
    const beatSeconds = this.transport.secondsPerBeat;

    if (step === 0 || step === 8) {
      this.instrument.schedule('round-kick', tick.time, {
        velocity: step === 0 ? 0.95 : 0.84,
        gain: catalogGain('beat-round-kick', 1.5),
      });
    }

    if (step === 4 || step === 12) {
      this.instrument.schedule('soft-clap', tick.time, {
        velocity: 0.78,
        gain: catalogGain('perc-soft-clap'),
      });
    }

    if (step % 2 === 0) {
      this.instrument.schedule('glass-hat', tick.time, {
        velocity: step % 4 === 2 ? 0.52 : 0.34,
        gain: catalogGain('perc-glass-hat', -1),
      });
    }

    const bassDegrees: Readonly<Record<number, number>> = {
      0: 0,
      3: 0,
      7: 2,
      10: 3,
      14: 1,
    };

    const bassDegree = bassDegrees[step];
    if (bassDegree !== undefined) {
      this.instrument.schedule('warm-bass', tick.time, {
        midi: midiForScaleDegree(36, this.harmony, bassDegree),
        duration: beatSeconds * 0.72,
        velocity: step === 0 ? 0.92 : 0.68,
        gain: catalogGain('bass-warm', 1),
      });
    }

    if ((step === 0 || step === 8) && tick.bar % 2 === 0) {
      const rootDegree = step === 0 ? 0 : 3;
      this.instrument.schedule('dream-chord', tick.time, {
        midiNotes: [
          midiForScaleDegree(48, this.harmony, rootDegree),
          midiForScaleDegree(48, this.harmony, rootDegree + 2),
          midiForScaleDegree(48, this.harmony, rootDegree + 4),
        ],
        duration: beatSeconds * 1.8,
        velocity: 0.68,
        gain: catalogGain('harmony-dream', -1),
      });
    }

    const melodyDegrees: Readonly<Record<number, number>> = {
      3: 4,
      7: 3,
      11: 5,
      15: 2,
    };

    const melodyDegree = melodyDegrees[step];
    if (melodyDegree !== undefined && tick.bar % 2 === 1) {
      this.instrument.schedule('soft-pluck', tick.time, {
        midi: midiForScaleDegree(60, this.harmony, melodyDegree),
        duration: beatSeconds * 0.48,
        velocity: 0.58,
        gain: catalogGain('melody-soft-pluck'),
      });
    }

    if (step === 0 && tick.bar % 4 === 0) {
      this.instrument.schedule('air-texture', tick.time, {
        duration: beatSeconds * 3.4,
        velocity: 0.5,
        gain: catalogGain('texture-air', -3),
      });
    }
  }
}
