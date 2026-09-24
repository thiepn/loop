import {
  MAX_RECORDING_MS,
} from '../core/audio/MasterRecorder';
import type { AppState } from './state';
import { ModalFocusController } from './ModalFocusController';

export interface CaptureViewCallbacks {
  readonly onStart: () => void;
  readonly onStop: () => void;
  readonly onCancel: () => void;
  readonly onDownloadOriginal: () => void;
  readonly onDownloadWav: () => void;
  readonly onDiscard: () => void;
}

function durationLabel(durationMs: number): string {
  const seconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

export class CaptureView {
  private readonly recordButton: HTMLButtonElement;
  private readonly liveBar: HTMLElement;
  private readonly liveDuration: HTMLElement;
  private readonly resultBackdrop: HTMLElement;
  private readonly resultFocus: ModalFocusController;
  private readonly resultAudio: HTMLAudioElement;
  private readonly resultDuration: HTMLElement;
  private readonly resultFormat: HTMLElement;
  private readonly wavButton: HTMLButtonElement;

  public constructor(
    root: HTMLElement,
    private readonly supported: boolean,
    callbacks: CaptureViewCallbacks,
  ) {
    const dock = root.querySelector<HTMLElement>('.playground-dock');
    const shell = root.querySelector<HTMLElement>('.playground-shell');

    if (!dock || !shell) {
      throw new Error('Capture view requires the playground shell.');
    }

    const recordButton = document.createElement('button');
    recordButton.type = 'button';
    recordButton.className = 'record-button';
    recordButton.dataset.captureRecord = '';
    recordButton.innerHTML = '<span aria-hidden="true">●</span> Record';
    recordButton.disabled = !supported;
    recordButton.title = supported
      ? 'Record this performance'
      : 'Performance recording is not supported in this browser.';
    recordButton.addEventListener('click', () => {
      const state = root.dataset.captureStatus;

      if (state === 'recording') {
        callbacks.onStop();
      } else {
        callbacks.onStart();
      }
    });
    dock.append(recordButton);
    this.recordButton = recordButton;

    const liveBar = document.createElement('aside');
    liveBar.className = 'capture-live-bar';
    liveBar.hidden = true;
    liveBar.innerHTML = `
      <div class="capture-live-copy">
        <span class="capture-live-dot" aria-hidden="true"></span>
        <div>
          <strong>Recording performance</strong>
          <small data-capture-live-duration>0:00</small>
        </div>
      </div>
      <span class="capture-live-limit">10 min max</span>
      <button type="button" data-capture-cancel>Cancel</button>
    `;
    shell.append(liveBar);
    this.liveBar = liveBar;

    const liveDuration = liveBar.querySelector<HTMLElement>(
      '[data-capture-live-duration]',
    );
    if (!liveDuration) {
      throw new Error('Capture duration failed to mount.');
    }
    this.liveDuration = liveDuration;

    liveBar.querySelector<HTMLButtonElement>('[data-capture-cancel]')?.addEventListener(
      'click',
      callbacks.onCancel,
    );

    const resultBackdrop = document.createElement('div');
    resultBackdrop.className = 'capture-result-backdrop';
    resultBackdrop.hidden = true;
    resultBackdrop.innerHTML = `
      <section class="capture-result-sheet" role="dialog" aria-modal="true" aria-labelledby="capture-result-title">
        <header class="capture-result-header">
          <div>
            <span>Performance captured</span>
            <h2 id="capture-result-title">Keep the moment.</h2>
            <p>Listen back or save it as an audio file.</p>
          </div>
        </header>

        <div class="capture-result-meta">
          <strong data-capture-result-duration>0:00</strong>
          <span data-capture-result-format>Browser Audio</span>
        </div>

        <audio controls preload="metadata" data-capture-audio aria-label="Recorded performance preview"></audio>

        <div class="capture-result-actions">
          <button class="capture-download-primary" type="button" data-capture-download>
            Download Audio
          </button>
          <button type="button" data-capture-wav>
            Download WAV
          </button>
          <button type="button" data-capture-new>
            New Recording
          </button>
          <button class="danger-action" type="button" data-capture-discard>
            Discard
          </button>
        </div>
      </section>
    `;
    shell.append(resultBackdrop);
    this.resultBackdrop = resultBackdrop;
    this.resultFocus = new ModalFocusController(resultBackdrop, {
      initialFocusSelector: '[data-capture-audio]',
    });

    const resultAudio = resultBackdrop.querySelector<HTMLAudioElement>(
      '[data-capture-audio]',
    );
    const resultDuration = resultBackdrop.querySelector<HTMLElement>(
      '[data-capture-result-duration]',
    );
    const resultFormat = resultBackdrop.querySelector<HTMLElement>(
      '[data-capture-result-format]',
    );
    const wavButton = resultBackdrop.querySelector<HTMLButtonElement>(
      '[data-capture-wav]',
    );

    if (!resultAudio || !resultDuration || !resultFormat || !wavButton) {
      throw new Error('Capture result sheet failed to mount.');
    }

    this.resultAudio = resultAudio;
    this.resultDuration = resultDuration;
    this.resultFormat = resultFormat;
    this.wavButton = wavButton;

    resultBackdrop.querySelector<HTMLButtonElement>('[data-capture-download]')?.addEventListener(
      'click',
      callbacks.onDownloadOriginal,
    );
    resultBackdrop.querySelector<HTMLButtonElement>('[data-capture-wav]')?.addEventListener(
      'click',
      callbacks.onDownloadWav,
    );
    resultBackdrop.querySelector<HTMLButtonElement>('[data-capture-new]')?.addEventListener(
      'click',
      callbacks.onStart,
    );
    resultBackdrop.querySelector<HTMLButtonElement>('[data-capture-discard]')?.addEventListener(
      'click',
      callbacks.onDiscard,
    );
  }

  public render(state: Readonly<AppState>, root: HTMLElement): void {
    root.dataset.captureStatus = state.captureStatus;

    const recording = state.captureStatus === 'recording';
    const processing = state.captureStatus === 'processing';
    const ready = state.captureStatus === 'ready';

    this.recordButton.disabled = !this.supported || processing;
    this.recordButton.classList.toggle('is-recording', recording);
    this.recordButton.setAttribute(
      'aria-label',
      recording ? 'Stop recording' : 'Start recording',
    );
    this.recordButton.innerHTML = recording
      ? `<span aria-hidden="true">■</span> Stop ${durationLabel(state.captureDurationMs)}`
      : '<span aria-hidden="true">●</span> Record';

    this.liveBar.hidden = !recording;
    this.liveDuration.textContent = durationLabel(state.captureDurationMs);

    const remaining = Math.max(
      0,
      MAX_RECORDING_MS - state.captureDurationMs,
    );
    const limit = this.liveBar.querySelector<HTMLElement>('.capture-live-limit');
    if (limit) {
      limit.textContent = remaining < 60_000
        ? `${Math.ceil(remaining / 1000)} sec left`
        : '10 min max';
    }

    this.resultBackdrop.hidden = !ready;
    this.resultFocus.sync(ready);

    if (!ready) {
      if (this.resultAudio.src) {
        this.resultAudio.removeAttribute('src');
        this.resultAudio.load();
      }
      return;
    }

    this.resultDuration.textContent = durationLabel(state.captureDurationMs);
    this.resultFormat.textContent = state.captureAutoStopped
      ? `${state.captureFormatLabel ?? 'Audio file'} · stopped at 10 min`
      : state.captureFormatLabel ?? 'Audio file';
    this.wavButton.hidden = !state.captureWavAvailable;

    if (
      state.capturePreviewUrl
      && this.resultAudio.src !== state.capturePreviewUrl
    ) {
      this.resultAudio.src = state.capturePreviewUrl;
    }
  }

  public destroy(): void {
    this.resultFocus.destroy();
    this.resultAudio.pause();
    this.recordButton.remove();
    this.liveBar.remove();
    this.resultBackdrop.remove();
  }
}
