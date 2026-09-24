import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AudioEngine } from '../src/core/audio/AudioEngine';
import {
  MasterRecorder,
} from '../src/core/audio/MasterRecorder';

class FakeMediaRecorder extends EventTarget {
  public static latest: FakeMediaRecorder | null = null;

  public static isTypeSupported(mimeType: string): boolean {
    return mimeType === 'audio/webm;codecs=opus';
  }

  public state: RecordingState = 'inactive';
  public readonly mimeType: string;
  public startedWith: number | undefined;

  public constructor(
    public readonly stream: MediaStream,
    options?: MediaRecorderOptions,
  ) {
    super();
    this.mimeType = options?.mimeType ?? 'audio/webm';
    FakeMediaRecorder.latest = this;
  }

  public start(timeslice?: number): void {
    this.state = 'recording';
    this.startedWith = timeslice;
  }

  public stop(): void {
    if (this.state === 'inactive') {
      throw new DOMException('Already inactive', 'InvalidStateError');
    }

    const dataEvent = new Event('dataavailable') as Event & {
      data: Blob;
    };
    Object.defineProperty(dataEvent, 'data', {
      value: new Blob(['loop-audio'], {
        type: this.mimeType,
      }),
    });

    this.dispatchEvent(dataEvent);
    this.state = 'inactive';
    this.dispatchEvent(new Event('stop'));
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  FakeMediaRecorder.latest = null;
});

function fakeEngine(dispose: () => void): AudioEngine {
  return {
    createMasterCaptureTap: () => ({
      stream: {} as MediaStream,
      dispose,
    }),
  } as AudioEngine;
}

describe('MasterRecorder', () => {
  it('collects chunks and disposes the post-limiter capture tap', async () => {
    vi.stubGlobal('MediaRecorder', FakeMediaRecorder);

    const dispose = vi.fn();
    const recorder = new MasterRecorder();

    await recorder.start(fakeEngine(dispose));

    expect(recorder.state).toBe('recording');
    expect(FakeMediaRecorder.latest?.startedWith).toBe(1_000);

    const result = await recorder.stop();

    expect(result.blob.size).toBeGreaterThan(0);
    expect(result.format.extension).toBe('webm');
    expect(recorder.state).toBe('idle');
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it('cancels an active recording and still cleans the tap', async () => {
    vi.stubGlobal('MediaRecorder', FakeMediaRecorder);

    const dispose = vi.fn();
    const recorder = new MasterRecorder();

    await recorder.start(fakeEngine(dispose));
    await recorder.cancel();

    expect(recorder.state).toBe('idle');
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it('fires the bounded-duration callback while recording', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('MediaRecorder', FakeMediaRecorder);

    const onLimitReached = vi.fn();
    const recorder = new MasterRecorder();

    await recorder.start(
      fakeEngine(vi.fn()),
      {
        maxDurationMs: 1_000,
        onLimitReached,
      },
    );

    vi.advanceTimersByTime(1_000);

    expect(onLimitReached).toHaveBeenCalledTimes(1);

    await recorder.cancel();
  });
});
