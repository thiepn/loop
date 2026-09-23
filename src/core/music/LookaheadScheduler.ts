import { MusicalTransport } from './MusicalTransport';

export interface ScheduledTick {
  readonly time: number;
  readonly absoluteStep: number;
  readonly stepInBar: number;
  readonly bar: number;
}

export interface LookaheadSchedulerOptions {
  readonly intervalMs?: number;
  readonly scheduleAheadSeconds?: number;
  readonly stepsPerBeat?: number;
}

export type TickListener = (tick: ScheduledTick) => void;

export class LookaheadScheduler {
  private readonly listeners = new Set<TickListener>();
  private readonly intervalMs: number;
  private readonly scheduleAheadSeconds: number;
  private readonly stepsPerBeat: number;

  private timer: ReturnType<typeof setInterval> | null = null;
  private nextAbsoluteStep = 0;

  public constructor(
    private readonly getCurrentTime: () => number,
    private readonly transport: MusicalTransport,
    options: LookaheadSchedulerOptions = {},
  ) {
    this.intervalMs = options.intervalMs ?? 25;
    this.scheduleAheadSeconds = options.scheduleAheadSeconds ?? 0.12;
    this.stepsPerBeat = options.stepsPerBeat ?? 4;
  }

  public subscribe(listener: TickListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  public start(): void {
    if (this.timer || !this.transport.isRunning) {
      return;
    }

    this.resync();
    this.pulse();
    this.timer = setInterval(() => this.pulse(), this.intervalMs);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public pulse(): void {
    if (!this.transport.isRunning) {
      return;
    }

    const now = this.getCurrentTime();
    const currentStep = this.transport.beatAt(now) * this.stepsPerBeat;

    if (this.nextAbsoluteStep < Math.floor(currentStep) - this.stepsPerBeat) {
      this.resync();
    }

    const horizon = now + this.scheduleAheadSeconds;
    const beatPerStep = 1 / this.stepsPerBeat;
    const stepsPerBar = this.transport.beatsPerBar * this.stepsPerBeat;

    while (true) {
      const absoluteBeat = this.nextAbsoluteStep * beatPerStep;
      const scheduledTime = this.transport.timeAtBeat(absoluteBeat);

      if (scheduledTime > horizon) {
        break;
      }

      if (scheduledTime >= now - 0.002) {
        const tick: ScheduledTick = {
          time: scheduledTime,
          absoluteStep: this.nextAbsoluteStep,
          stepInBar: ((this.nextAbsoluteStep % stepsPerBar) + stepsPerBar) % stepsPerBar,
          bar: Math.floor(this.nextAbsoluteStep / stepsPerBar),
        };

        for (const listener of this.listeners) {
          listener(tick);
        }
      }

      this.nextAbsoluteStep += 1;
    }
  }

  private resync(): void {
    const now = this.getCurrentTime();
    const currentStep = this.transport.beatAt(now) * this.stepsPerBeat;
    this.nextAbsoluteStep = Math.ceil(currentStep - 1e-8);
  }
}
