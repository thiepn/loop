import type {
  AudioEngine,
  MasterCaptureTap,
} from './AudioEngine';
import {
  chooseRecordingFormat,
  formatForMimeType,
  type RecordingFormat,
} from './RecordingFormat';

export const MAX_RECORDING_MS = 10 * 60 * 1000;
export const RECORDING_AUDIO_BITS_PER_SECOND = 160_000;

export interface RecordingResult {
  readonly blob: Blob;
  readonly format: RecordingFormat;
  readonly durationMs: number;
  readonly startedAt: number;
  readonly stoppedAt: number;
}

export interface StartRecordingOptions {
  readonly maxDurationMs?: number;
  readonly onLimitReached?: () => void;
}

export type MasterRecorderState =
  | 'idle'
  | 'recording'
  | 'stopping';

export class MasterRecorder {
  private recorder: MediaRecorder | null = null;
  private tap: MasterCaptureTap | null = null;
  private chunks: Blob[] = [];
  private startedAt = 0;
  private stateValue: MasterRecorderState = 'idle';
  private limitTimer: ReturnType<typeof setTimeout> | null = null;
  private stopPromise: Promise<RecordingResult> | null = null;
  private stopResolve: ((result: RecordingResult) => void) | null = null;
  private stopReject: ((error: unknown) => void) | null = null;

  public get state(): MasterRecorderState {
    return this.stateValue;
  }

  public get isRecording(): boolean {
    return this.stateValue === 'recording';
  }

  public async start(
    engine: AudioEngine,
    options: StartRecordingOptions = {},
  ): Promise<void> {
    if (this.stateValue !== 'idle') {
      throw new Error('A Loop recording is already active.');
    }

    if (typeof MediaRecorder === 'undefined') {
      throw new Error('This browser does not support performance recording.');
    }

    const tap = engine.createMasterCaptureTap();

    if (!tap) {
      throw new Error('Loop audio must be initialized before recording.');
    }

    const preferred = typeof MediaRecorder.isTypeSupported === 'function'
      ? chooseRecordingFormat((mimeType) => MediaRecorder.isTypeSupported(mimeType))
      : null;

    let recorder: MediaRecorder;

    try {
      recorder = preferred
        ? new MediaRecorder(tap.stream, {
            mimeType: preferred.mimeType,
            audioBitsPerSecond: RECORDING_AUDIO_BITS_PER_SECOND,
          })
        : new MediaRecorder(tap.stream, {
            audioBitsPerSecond: RECORDING_AUDIO_BITS_PER_SECOND,
          });
    } catch (error) {
      tap.dispose();
      throw error;
    }

    this.recorder = recorder;
    this.tap = tap;
    this.chunks = [];
    this.startedAt = Date.now();
    this.stateValue = 'recording';

    recorder.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    });

    recorder.addEventListener('error', (event) => {
      this.rejectStop(
        event.error ?? new Error('Browser recording failed.'),
      );
    });

    recorder.addEventListener('stop', () => {
      this.resolveStop();
    });

    const limit = Math.max(
      1_000,
      Math.min(
        MAX_RECORDING_MS,
        Math.floor(options.maxDurationMs ?? MAX_RECORDING_MS),
      ),
    );

    this.limitTimer = setTimeout(() => {
      this.limitTimer = null;

      if (this.stateValue === 'recording') {
        options.onLimitReached?.();
      }
    }, limit);

    recorder.start(1_000);
  }

  public stop(): Promise<RecordingResult> {
    if (this.stopPromise) {
      return this.stopPromise;
    }

    if (!this.recorder || this.stateValue === 'idle') {
      return Promise.reject(
        new Error('There is no active Loop recording.'),
      );
    }

    this.stateValue = 'stopping';
    this.clearLimitTimer();

    this.stopPromise = new Promise<RecordingResult>(
      (resolve, reject) => {
        this.stopResolve = resolve;
        this.stopReject = reject;
      },
    );

    try {
      if (this.recorder.state === 'inactive') {
        this.resolveStop();
      } else {
        this.recorder.stop();
      }
    } catch (error) {
      this.rejectStop(error);
    }

    return this.stopPromise;
  }

  public async cancel(): Promise<void> {
    if (!this.recorder || this.stateValue === 'idle') {
      this.cleanup();
      return;
    }

    try {
      await this.stop();
    } catch {
      // Cancellation intentionally discards both success and failure.
    } finally {
      this.cleanup();
    }
  }

  private resolveStop(): void {
    if (!this.recorder) {
      return;
    }

    const recorder = this.recorder;
    const stoppedAt = Date.now();
    const format = formatForMimeType(recorder.mimeType);
    const blob = new Blob(
      this.chunks,
      {
        type: recorder.mimeType || format.mimeType,
      },
    );

    const result: RecordingResult = {
      blob,
      format,
      durationMs: Math.max(0, stoppedAt - this.startedAt),
      startedAt: this.startedAt,
      stoppedAt,
    };

    const resolve = this.stopResolve;
    this.cleanup();
    resolve?.(result);
  }

  private rejectStop(error: unknown): void {
    const reject = this.stopReject;
    this.cleanup();
    reject?.(error);
  }

  private clearLimitTimer(): void {
    if (this.limitTimer !== null) {
      clearTimeout(this.limitTimer);
      this.limitTimer = null;
    }
  }

  private cleanup(): void {
    this.clearLimitTimer();

    this.tap?.dispose();
    this.tap = null;

    this.recorder = null;
    this.chunks = [];
    this.startedAt = 0;
    this.stateValue = 'idle';

    this.stopPromise = null;
    this.stopResolve = null;
    this.stopReject = null;
  }
}
