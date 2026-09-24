export type AudioEngineState = AudioContextState | 'idle' | 'unsupported';

export interface AudioEngineSnapshot {
  readonly state: AudioEngineState;
  readonly sampleRate: number | null;
}

export interface AudioRuntime {
  readonly context: AudioContext;
  readonly destination: AudioNode;
}

export interface MasterCaptureTap {
  readonly stream: MediaStream;
  dispose(): void;
}

type BrowserAudioContextConstructor = new (options?: AudioContextOptions) => AudioContext;

const AUDIO_RESUME_TIMEOUT_MS = 1_500;

async function resumeAudioContext(
  context: AudioContext,
): Promise<void> {
  if (context.state !== 'suspended') {
    return;
  }

  const resumeAttempt = context.resume();
  void resumeAttempt.catch(() => undefined);

  let timeout: ReturnType<typeof setTimeout> | null = null;

  try {
    await Promise.race([
      resumeAttempt,
      new Promise<void>((resolve) => {
        timeout = setTimeout(
          resolve,
          AUDIO_RESUME_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
  }
}

function getAudioContextConstructor(): BrowserAudioContextConstructor | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const candidate = window.AudioContext
    ?? (window as Window & { webkitAudioContext?: BrowserAudioContextConstructor }).webkitAudioContext;

  return candidate ?? null;
}

export class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;

  public getSnapshot(): AudioEngineSnapshot {
    if (!this.context) {
      return {
        state: getAudioContextConstructor() ? 'idle' : 'unsupported',
        sampleRate: null,
      };
    }

    return {
      state: this.context.state,
      sampleRate: this.context.sampleRate,
    };
  }

  public getRuntime(): AudioRuntime | null {
    if (!this.context || !this.masterGain) {
      return null;
    }

    return {
      context: this.context,
      destination: this.masterGain,
    };
  }

  public async initialize(): Promise<AudioEngineSnapshot> {
    if (this.context) {
      if (this.context.state === 'suspended') {
        await resumeAudioContext(this.context);
      }

      return this.getSnapshot();
    }

    const AudioContextConstructor = getAudioContextConstructor();

    if (!AudioContextConstructor) {
      return {
        state: 'unsupported',
        sampleRate: null,
      };
    }

    const context = new AudioContextConstructor({
      latencyHint: 'interactive',
    });

    const masterGain = context.createGain();
    masterGain.gain.setValueAtTime(0.82, context.currentTime);

    const limiter = context.createDynamicsCompressor();
    limiter.threshold.setValueAtTime(-2, context.currentTime);
    limiter.knee.setValueAtTime(4, context.currentTime);
    limiter.ratio.setValueAtTime(12, context.currentTime);
    limiter.attack.setValueAtTime(0.003, context.currentTime);
    limiter.release.setValueAtTime(0.18, context.currentTime);

    masterGain.connect(limiter);
    limiter.connect(context.destination);

    this.context = context;
    this.masterGain = masterGain;
    this.limiter = limiter;

    if (context.state === 'suspended') {
      await resumeAudioContext(context);
    }

    return this.getSnapshot();
  }

  public createMasterCaptureTap(): MasterCaptureTap | null {
    if (!this.context || !this.limiter) {
      return null;
    }

    const destination = this.context.createMediaStreamDestination();
    this.limiter.connect(destination);

    let disposed = false;

    return {
      stream: destination.stream,
      dispose: () => {
        if (disposed) {
          return;
        }

        disposed = true;

        try {
          this.limiter?.disconnect(destination);
        } catch {
          // The AudioContext may already be closing.
        }

        for (const track of destination.stream.getTracks()) {
          track.stop();
        }
      },
    };
  }

  public get input(): AudioNode | null {
    return this.masterGain;
  }

  public async suspend(): Promise<AudioEngineSnapshot> {
    if (this.context?.state === 'running') {
      await this.context.suspend();
    }

    return this.getSnapshot();
  }

  public async resume(): Promise<AudioEngineSnapshot> {
    if (this.context?.state === 'suspended') {
      await resumeAudioContext(this.context);
    }

    return this.getSnapshot();
  }

  public async close(): Promise<void> {
    if (!this.context) {
      return;
    }

    this.masterGain?.disconnect();
    this.limiter?.disconnect();

    if (this.context.state !== 'closed') {
      await this.context.close();
    }

    this.context = null;
    this.masterGain = null;
    this.limiter = null;
  }
}

export const audioEngine = new AudioEngine();
