import { midiToFrequency } from '../music/Harmony';
import type { ProceduralPreset } from '../sounds/SoundDefinition';

export interface ProceduralEventOptions {
  readonly velocity?: number;
  readonly midi?: number;
  readonly midiNotes?: readonly number[];
  readonly duration?: number;
  readonly gain?: number;
}

interface TrackedSource {
  readonly source: AudioScheduledSourceNode;
  readonly cleanup: () => void;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export class ProceduralInstrument {
  private readonly activeSources = new Set<TrackedSource>();
  private noiseBuffer: AudioBuffer | null = null;

  public constructor(
    private readonly context: AudioContext,
    private readonly destination: AudioNode,
  ) {}

  public schedule(
    preset: ProceduralPreset,
    requestedTime: number,
    options: ProceduralEventOptions = {},
  ): void {
    const time = Math.max(requestedTime, this.context.currentTime + 0.001);
    const velocity = clamp01(options.velocity ?? 0.8);
    const gain = Math.max(0, options.gain ?? 1);

    switch (preset) {
      case 'round-kick':
        this.scheduleKick(time, velocity * gain);
        break;
      case 'soft-clap':
        this.scheduleNoiseHit(time, velocity * gain * 0.72, 1250, 0.18, 'bandpass');
        break;
      case 'glass-hat':
        this.scheduleNoiseHit(time, velocity * gain * 0.42, 7200, 0.065, 'highpass');
        break;
      case 'warm-bass':
        this.scheduleTone(
          time,
          options.midi ?? 36,
          options.duration ?? 0.32,
          velocity * gain * 0.5,
          'triangle',
          640,
        );
        break;
      case 'dream-chord':
        this.scheduleChord(
          time,
          options.midiNotes ?? [48, 51, 55],
          options.duration ?? 1.4,
          velocity * gain * 0.19,
        );
        break;
      case 'soft-pluck':
        this.scheduleTone(
          time,
          options.midi ?? 60,
          options.duration ?? 0.22,
          velocity * gain * 0.34,
          'sine',
          2400,
        );
        break;
      case 'air-texture':
        this.scheduleNoiseHit(
          time,
          velocity * gain * 0.12,
          1800,
          options.duration ?? 2.2,
          'bandpass',
        );
        break;
    }
  }

  public stopAll(when = this.context.currentTime): void {
    for (const tracked of [...this.activeSources]) {
      try {
        tracked.source.stop(when);
      } catch {
        tracked.cleanup();
        this.activeSources.delete(tracked);
      }
    }
  }

  private scheduleKick(time: number, amount: number): void {
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(145, time);
    oscillator.frequency.exponentialRampToValueAtTime(48, time + 0.12);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, amount), time + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.28);

    oscillator.connect(gain);
    gain.connect(this.destination);

    this.track(oscillator, () => {
      oscillator.disconnect();
      gain.disconnect();
    });

    oscillator.start(time);
    oscillator.stop(time + 0.3);
  }

  private scheduleNoiseHit(
    time: number,
    amount: number,
    cutoff: number,
    duration: number,
    filterType: BiquadFilterType,
  ): void {
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();

    source.buffer = this.getNoiseBuffer();
    filter.type = filterType;
    filter.frequency.setValueAtTime(cutoff, time);
    filter.Q.setValueAtTime(filterType === 'bandpass' ? 0.7 : 0.45, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, amount), time + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.destination);

    this.track(source, () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    });

    source.start(time);
    source.stop(time + duration + 0.01);
  }

  private scheduleTone(
    time: number,
    midi: number,
    duration: number,
    amount: number,
    wave: OscillatorType,
    cutoff: number,
  ): void {
    const oscillator = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();

    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(midiToFrequency(midi), time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, time);
    filter.Q.setValueAtTime(0.7, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, amount), time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(this.destination);

    this.track(oscillator, () => {
      oscillator.disconnect();
      filter.disconnect();
      gain.disconnect();
    });

    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
  }

  private scheduleChord(
    time: number,
    midiNotes: readonly number[],
    duration: number,
    amountPerVoice: number,
  ): void {
    for (const [index, midi] of midiNotes.entries()) {
      const oscillator = this.context.createOscillator();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();

      oscillator.type = index % 2 === 0 ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(midiToFrequency(midi), time);
      oscillator.detune.setValueAtTime(index === 1 ? 3 : -2, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1500, time);
      filter.Q.setValueAtTime(0.45, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, amountPerVoice), time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(this.destination);

      this.track(oscillator, () => {
        oscillator.disconnect();
        filter.disconnect();
        gain.disconnect();
      });

      oscillator.start(time);
      oscillator.stop(time + duration + 0.03);
    }
  }

  private getNoiseBuffer(): AudioBuffer {
    if (this.noiseBuffer) {
      return this.noiseBuffer;
    }

    const length = Math.ceil(this.context.sampleRate * 2.5);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const channel = buffer.getChannelData(0);

    for (let index = 0; index < channel.length; index += 1) {
      channel[index] = Math.random() * 2 - 1;
    }

    this.noiseBuffer = buffer;
    return buffer;
  }

  private track(source: AudioScheduledSourceNode, cleanup: () => void): void {
    const tracked: TrackedSource = { source, cleanup };
    this.activeSources.add(tracked);

    source.addEventListener('ended', () => {
      cleanup();
      this.activeSources.delete(tracked);
    }, { once: true });
  }
}
