export const MIN_BPM = 40;
export const MAX_BPM = 220;

export type Quantization =
  | 'immediate'
  | 'sixteenth'
  | 'eighth'
  | 'quarter'
  | 'bar'
  | 'two-bars';

export interface MusicalPosition {
  readonly absoluteBeat: number;
  readonly bar: number;
  readonly beatInBar: number;
  readonly phaseInBeat: number;
}

export interface MusicalTransportOptions {
  readonly bpm?: number;
  readonly beatsPerBar?: number;
}

function clampBpm(bpm: number): number {
  if (!Number.isFinite(bpm)) {
    throw new Error('BPM must be a finite number.');
  }

  return Math.min(MAX_BPM, Math.max(MIN_BPM, bpm));
}

export class MusicalTransport {
  private bpmValue: number;
  private readonly beatsPerBarValue: number;
  private running = false;
  private originTime = 0;
  private originBeat = 0;

  public constructor(options: MusicalTransportOptions = {}) {
    this.bpmValue = clampBpm(options.bpm ?? 108);
    this.beatsPerBarValue = Math.max(1, Math.floor(options.beatsPerBar ?? 4));
  }

  public get bpm(): number {
    return this.bpmValue;
  }

  public get beatsPerBar(): number {
    return this.beatsPerBarValue;
  }

  public get isRunning(): boolean {
    return this.running;
  }

  public get secondsPerBeat(): number {
    return 60 / this.bpmValue;
  }

  public start(contextTime: number, startBeat = 0): void {
    this.originTime = contextTime;
    this.originBeat = startBeat;
    this.running = true;
  }

  public stop(contextTime: number): void {
    if (!this.running) {
      return;
    }

    this.originBeat = this.beatAt(contextTime);
    this.originTime = contextTime;
    this.running = false;
  }

  public setBpm(bpm: number, contextTime: number): void {
    const preservedBeat = this.beatAt(contextTime);
    this.bpmValue = clampBpm(bpm);
    this.originBeat = preservedBeat;
    this.originTime = contextTime;
  }

  public beatAt(contextTime: number): number {
    if (!this.running || contextTime <= this.originTime) {
      return this.originBeat;
    }

    return this.originBeat + (contextTime - this.originTime) / this.secondsPerBeat;
  }

  public timeAtBeat(absoluteBeat: number): number {
    return this.originTime + (absoluteBeat - this.originBeat) * this.secondsPerBeat;
  }

  public positionAt(contextTime: number): MusicalPosition {
    const absoluteBeat = this.beatAt(contextTime);
    const bar = Math.floor(absoluteBeat / this.beatsPerBarValue);
    const beatInBarFloat = absoluteBeat - bar * this.beatsPerBarValue;
    const beatInBar = Math.floor(beatInBarFloat);
    const phaseInBeat = beatInBarFloat - beatInBar;

    return {
      absoluteBeat,
      bar,
      beatInBar,
      phaseInBeat,
    };
  }

  public nextQuantizedTime(
    contextTime: number,
    quantization: Quantization,
    includeCurrentBoundary = false,
  ): number {
    if (quantization === 'immediate' || !this.running) {
      return contextTime;
    }

    const quantumBeats = this.quantizationBeats(quantization);
    const currentBeat = this.beatAt(contextTime);
    const scaled = currentBeat / quantumBeats;
    const nearestInteger = Math.round(scaled);
    const isOnBoundary = Math.abs(scaled - nearestInteger) < 1e-8;

    const nextIndex = includeCurrentBoundary && isOnBoundary
      ? nearestInteger
      : Math.floor(scaled + 1e-8) + 1;

    return this.timeAtBeat(nextIndex * quantumBeats);
  }

  public quantizationBeats(quantization: Quantization): number {
    switch (quantization) {
      case 'immediate':
        return 0;
      case 'sixteenth':
        return 0.25;
      case 'eighth':
        return 0.5;
      case 'quarter':
        return 1;
      case 'bar':
        return this.beatsPerBarValue;
      case 'two-bars':
        return this.beatsPerBarValue * 2;
    }
  }
}
