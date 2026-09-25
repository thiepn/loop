import type { AppState } from './state';
import { loopIcon } from './LoopIcons';
import { presentationCameraForWorld } from '../core/visual/v2/PresentationCamera';

function blocksPresentation(state: Readonly<AppState>): boolean {
  return Boolean(
    state.palette
    || state.effectPaletteOpen
    || state.toyPaletteOpen
    || state.patternEditorOrbId
    || state.motionEditorOrbId
    || state.linkEditorSourceOrbId
    || state.magicIntentOpen
    || state.magicSession
    || state.snapshotsOpen
    || state.visualSettingsOpen
    || state.captureStatus === 'processing'
    || state.captureStatus === 'ready'
  );
}

export class PresentationView {
  private readonly shell: HTMLElement;
  private readonly canvas: HTMLElement;
  private readonly renderer: HTMLCanvasElement;
  private readonly domStage: HTMLElement;
  private readonly enterButton: HTMLButtonElement;
  private readonly exitButton: HTMLButtonElement;
  private readonly resizeObserver: ResizeObserver | null;
  private readonly rendererObserver: MutationObserver | null;
  private state: Readonly<AppState> | null = null;
  private active = false;
  private nativeFullscreen = false;
  private frameRequest: number | null = null;
  private lastCameraFrame = Number.NEGATIVE_INFINITY;
  private chromeTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly handleActivity = () => {
    if (this.active) {
      this.revealChrome();
    }
  };

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (!this.active) {
      return;
    }

    this.revealChrome();

    if (event.key === 'Escape' && !this.nativeFullscreen) {
      this.deactivate(false);
    }
  };

  private readonly handleFullscreenChange = () => {
    if (!this.active) {
      return;
    }

    if (document.fullscreenElement === this.shell) {
      this.nativeFullscreen = true;
      this.shell.dataset.presentationSurface = 'fullscreen';
      this.updateCamera(performance.now());
      return;
    }

    if (this.nativeFullscreen) {
      this.nativeFullscreen = false;
      this.deactivate(false);
    }
  };

  private readonly handleVisibility = () => {
    if (!this.active) {
      return;
    }

    if (document.visibilityState === 'visible') {
      this.updateCamera(performance.now());
      this.syncAnimation();
    } else {
      this.cancelFrame();
    }
  };

  private readonly handlePageHide = () => {
    this.cancelFrame();
  };

  private readonly handlePageShow = () => {
    if (this.active) {
      this.updateCamera(performance.now());
      this.syncAnimation();
    }
  };

  private readonly animateCamera = (timestampMs: number) => {
    this.frameRequest = null;
    const state = this.state;

    if (
      !this.active
      || !state
      || state.visualReduceMotion
      || document.visibilityState === 'hidden'
    ) {
      return;
    }

    const interval = state.visualQuality === 'high'
      ? 1000 / 30
      : state.visualQuality === 'balanced'
        ? 50
        : 1000 / 12;

    if (timestampMs - this.lastCameraFrame >= interval) {
      this.lastCameraFrame = timestampMs;
      this.updateCamera(timestampMs);
    }

    this.frameRequest = requestAnimationFrame(this.animateCamera);
  };

  public constructor(root: HTMLElement) {
    const shell = root.querySelector<HTMLElement>('.playground-shell');
    const canvas = root.querySelector<HTMLElement>('[data-canvas]');
    const renderer = root.querySelector<HTMLCanvasElement>('.world-renderer-v2');
    const actions = root.querySelector<HTMLElement>('[data-topbar-actions]');
    const play = actions?.querySelector<HTMLElement>('[data-play]');

    if (!shell || !canvas || !renderer || !actions || !play) {
      throw new Error('Presentation mode requires the playground surface.');
    }

    this.shell = shell;
    this.canvas = canvas;
    this.renderer = renderer;

    const domStage = document.createElement('div');
    domStage.className = 'presentation-dom-stage';

    for (const selector of [
      '.listener-rings',
      '.listener-core',
      '.effect-field-layer',
      '.link-layer',
      '.playground-toy-layer',
      '.orb-layer',
    ]) {
      const element = canvas.querySelector(selector);

      if (element) {
        domStage.append(element);
      }
    }

    canvas.append(domStage);
    this.domStage = domStage;

    const enter = document.createElement('button');
    enter.type = 'button';
    enter.className = 'visual-settings-button presentation-button';
    enter.dataset.presentationEnter = '';
    enter.title = 'Present World';
    enter.setAttribute('aria-label', 'Present World');
    enter.setAttribute('aria-pressed', 'false');
    enter.innerHTML = loopIcon('present');
    enter.addEventListener('click', () => {
      void this.activate();
    });
    actions.insertBefore(enter, play);
    this.enterButton = enter;

    const exit = document.createElement('button');
    exit.type = 'button';
    exit.className = 'play-toggle presentation-exit-button';
    exit.dataset.presentationExit = '';
    exit.hidden = true;
    exit.setAttribute('aria-label', 'Exit presentation');
    exit.innerHTML = loopIcon('exit') + '<span>Exit</span>';
    exit.addEventListener('click', () => {
      this.deactivate(true);
    });
    shell.append(exit);
    this.exitButton = exit;

    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    document.addEventListener('visibilitychange', this.handleVisibility);
    window.addEventListener('pointermove', this.handleActivity, { passive: true });
    window.addEventListener('pointerdown', this.handleActivity, { passive: true });
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('pagehide', this.handlePageHide);
    window.addEventListener('pageshow', this.handlePageShow);

    this.resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => {
          if (this.active) {
            this.updateCamera(performance.now());
          }
        });
    this.resizeObserver?.observe(canvas);

    this.rendererObserver = typeof MutationObserver === 'undefined'
      ? null
      : new MutationObserver(() => {
          if (!this.active) {
            return;
          }

          this.syncRendererMode();
          this.updateCamera(performance.now());
        });
    this.rendererObserver?.observe(shell, {
      attributes: true,
      attributeFilter: [
        'data-renderer-state',
        'data-renderer-v2',
      ],
    });
  }

  public render(state: Readonly<AppState>): void {
    this.state = state;
    const blocked = blocksPresentation(state);
    const rendererReady = this.rendererReady();

    this.enterButton.disabled = blocked;
    this.enterButton.title = blocked
      ? 'Close the open panel before presenting'
      : rendererReady
        ? 'Present World'
        : 'Present World using compatibility visuals';

    if (this.active) {
      this.syncRendererMode();
    }

    if (
      this.active
      && (
        blocked
        || state.captureStatus === 'error'
      )
    ) {
      this.deactivate(true);
      return;
    }

    if (!this.active) {
      return;
    }

    this.shell.dataset.presentationActivity = state.captureStatus === 'recording'
      ? 'recording'
      : state.playing
        ? 'playing'
        : 'idle';
    this.updateCamera(performance.now());
    this.syncAnimation();
  }

  public destroy(): void {
    this.deactivate(true);
    this.resizeObserver?.disconnect();
    this.rendererObserver?.disconnect();
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('visibilitychange', this.handleVisibility);
    window.removeEventListener('pointermove', this.handleActivity);
    window.removeEventListener('pointerdown', this.handleActivity);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('pagehide', this.handlePageHide);
    window.removeEventListener('pageshow', this.handlePageShow);
    this.enterButton.remove();
    this.exitButton.remove();
    this.domStage.remove();
  }

  private async activate(): Promise<void> {
    const state = this.state;

    if (
      this.active
      || !state
      || blocksPresentation(state)
      || this.enterButton.disabled
    ) {
      return;
    }

    this.active = true;
    this.nativeFullscreen = false;
    this.shell.dataset.presentation = 'true';
    this.shell.dataset.presentationSurface = 'viewport';
    this.syncRendererMode();
    this.shell.dataset.presentationActivity = state.captureStatus === 'recording'
      ? 'recording'
      : state.playing
        ? 'playing'
        : 'idle';
    this.domStage.setAttribute('inert', '');
    this.domStage.setAttribute('aria-hidden', 'true');
    this.enterButton.setAttribute('aria-pressed', 'true');
    this.exitButton.hidden = false;
    this.revealChrome();
    this.updateCamera(performance.now());
    this.syncAnimation();
    this.exitButton.focus({ preventScroll: true });

    if (
      document.fullscreenElement === null
      && document.fullscreenEnabled
      && typeof this.shell.requestFullscreen === 'function'
    ) {
      try {
        await this.shell.requestFullscreen();
        if (this.active) {
          this.nativeFullscreen = true;
          this.shell.dataset.presentationSurface = 'fullscreen';
        }
      } catch {
        // Viewport presentation is the intended fallback for PWA/iOS/browser policy.
      }
    }
  }

  private deactivate(exitFullscreen: boolean): void {
    if (!this.active) {
      return;
    }

    this.active = false;
    this.cancelFrame();
    this.clearChromeTimer();
    this.renderer.style.removeProperty('transform');
    this.domStage.style.removeProperty('transform');
    this.domStage.removeAttribute('inert');
    this.domStage.removeAttribute('aria-hidden');
    delete this.shell.dataset.presentation;
    delete this.shell.dataset.presentationRenderer;
    delete this.shell.dataset.presentationChrome;
    delete this.shell.dataset.presentationSurface;
    delete this.shell.dataset.presentationActivity;
    this.enterButton.setAttribute('aria-pressed', 'false');
    this.exitButton.hidden = true;

    const shouldExitFullscreen = exitFullscreen
      && document.fullscreenElement === this.shell
      && typeof document.exitFullscreen === 'function';
    this.nativeFullscreen = false;

    if (shouldExitFullscreen) {
      void document.exitFullscreen().catch(() => undefined);
    }

    if (this.enterButton.isConnected) {
      this.enterButton.focus({ preventScroll: true });
    }
  }

  private updateCamera(timestampMs: number): void {
    const state = this.state;

    if (!this.active || !state) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const camera = presentationCameraForWorld(state.world, {
      width,
      height,
      quality: state.visualQuality,
      reduceMotion: state.visualReduceMotion,
      playing: state.playing,
      recording: state.captureStatus === 'recording',
      timestampMs,
    });
    const x = (0.5 - camera.zoom * camera.center.x) * width;
    const y = (0.5 - camera.zoom * camera.center.y) * height;
    const transform = 'translate3d('
      + x.toFixed(2)
      + 'px,'
      + y.toFixed(2)
      + 'px,0) scale('
      + camera.zoom.toFixed(4)
      + ')';

    if (this.rendererReady()) {
      this.domStage.style.removeProperty('transform');
      this.renderer.style.transform = transform;
    } else {
      this.renderer.style.removeProperty('transform');
      this.domStage.style.transform = transform;
    }
  }

  private rendererReady(): boolean {
    return this.shell.dataset.rendererState === 'ready'
      && this.shell.dataset.rendererV2 !== 'none';
  }

  private syncRendererMode(): void {
    this.shell.dataset.presentationRenderer = this.rendererReady()
      ? 'v2'
      : 'fallback';
  }

  private syncAnimation(): void {
    const state = this.state;

    if (
      !this.active
      || !state
      || state.visualReduceMotion
      || document.visibilityState === 'hidden'
    ) {
      this.cancelFrame();
      return;
    }

    if (this.frameRequest === null) {
      this.frameRequest = requestAnimationFrame(this.animateCamera);
    }
  }

  private cancelFrame(): void {
    if (this.frameRequest !== null) {
      cancelAnimationFrame(this.frameRequest);
      this.frameRequest = null;
    }

    this.lastCameraFrame = Number.NEGATIVE_INFINITY;
  }

  private revealChrome(): void {
    this.shell.dataset.presentationChrome = 'visible';
    this.clearChromeTimer();
    this.chromeTimer = setTimeout(() => {
      this.chromeTimer = null;

      if (this.active) {
        this.shell.dataset.presentationChrome = 'hidden';
      }
    }, 2200);
  }

  private clearChromeTimer(): void {
    if (this.chromeTimer !== null) {
      clearTimeout(this.chromeTimer);
      this.chromeTimer = null;
    }
  }
}
