import type { AppState } from './state';
import type { EffectFieldDocument } from '../core/world/EffectField';
import type { PlaygroundToyDocument } from '../core/world/PlaygroundToy';
import type { NormalizedPoint } from '../core/world/SoundOrb';
import type { VisualPreferences } from '../core/visual/VisualQuality';
import { AnimationClock } from '../core/visual/v2/AnimationClock';
import {
  clampRenderDevicePixelRatio,
  motionRenderIntervalMs,
} from '../core/visual/v2/RendererPolicy';
import { projectWorldToRenderScene } from '../core/visual/v2/SceneAdapter';
import type {
  RenderScene,
  RenderViewport,
  RendererKind,
  WorldRenderer,
} from '../core/visual/v2/RenderTypes';
import { VisualEventBridge } from '../core/visual/v2/VisualEventBridge';
import { createWorldRenderer } from '../core/visual/v2/createWorldRenderer';

export interface WorldRendererDiagnostics {
  readonly kind: RendererKind;
  readonly frames: number;
  readonly averageRenderMs: number;
  readonly lastRenderMs: number;
  readonly contextLosses: number;
  readonly viewport: RenderViewport;
}

export class WorldRendererView {
  private readonly canvas: HTMLCanvasElement;
  private readonly shell: HTMLElement;
  private readonly worldCanvas: HTMLElement;
  private renderer: WorldRenderer;
  private readonly events = new VisualEventBridge();
  private readonly clock: AnimationClock;
  private readonly liveOrbPositions = new Map<string, NormalizedPoint>();
  private readonly fieldOverrides = new Map<string, EffectFieldDocument>();
  private readonly toyOverrides = new Map<string, PlaygroundToyDocument>();
  private state: Readonly<AppState> | null = null;
  private scene: RenderScene | null = null;
  private preferences: VisualPreferences = {
    quality: 'balanced',
    reduceMotion: false,
    reduceParticles: false,
    reduceBloom: false,
  };
  private viewport: RenderViewport = {
    width: 1,
    height: 1,
    dpr: 1,
  };
  private resizeObserver: ResizeObserver | null = null;
  private frames = 0;
  private totalRenderMs = 0;
  private lastRenderMs = 0;
  private contextLosses = 0;
  private contextLost = false;
  private currentWorldId: string | null = null;
  private lastMotionInvalidationMs = Number.NEGATIVE_INFINITY;
  private externalFrameDriverActive = false;

  private readonly handleWindowResize = () => {
    this.syncViewport();
    this.requestRender();
  };

  private readonly handleContextLost = (event: Event) => {
    if (this.renderer.kind !== 'webgl2') {
      return;
    }

    event.preventDefault();
    this.contextLost = true;
    this.contextLosses += 1;
    this.shell.dataset.rendererState = 'lost';
  };

  private readonly handleContextRestored = () => {
    if (this.renderer.kind !== 'webgl2') {
      return;
    }

    try {
      this.renderer.restore();
      this.contextLost = false;
      this.shell.dataset.rendererState = 'ready';
      this.syncViewport();
      this.requestRender();
    } catch (error) {
      console.warn('[Loop] Visual renderer restore failed.', error);
      this.shell.dataset.rendererState = 'error';
    }
  };

  public constructor(root: HTMLElement) {
    const worldCanvas = root.querySelector<HTMLElement>('[data-canvas]');
    const shell = root.querySelector<HTMLElement>('.playground-shell');

    if (!worldCanvas || !shell) {
      throw new Error('Visual V2 renderer requires the playground canvas.');
    }

    this.worldCanvas = worldCanvas;
    this.shell = shell;

    const canvas = document.createElement('canvas');
    canvas.className = 'world-renderer-v2';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.tabIndex = -1;
    worldCanvas.prepend(canvas);
    this.canvas = canvas;

    this.renderer = createWorldRenderer(canvas);
    this.shell.dataset.rendererV2 = this.renderer.kind;
    this.shell.dataset.rendererState = 'ready';

    this.clock = new AnimationClock((timestampMs) => {
      return this.renderFrame(timestampMs);
    });

    canvas.addEventListener(
      'webglcontextlost',
      this.handleContextLost,
    );
    canvas.addEventListener(
      'webglcontextrestored',
      this.handleContextRestored,
    );

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.syncViewport();
        this.requestRender();
      });
      this.resizeObserver.observe(worldCanvas);
    } else {
      window.addEventListener('resize', this.handleWindowResize);
    }

    this.syncViewport();
  }

  public render(state: Readonly<AppState>): void {
    if (this.currentWorldId !== state.world.id) {
      this.clearRuntimeOverrides();
      this.currentWorldId = state.world.id;
    }

    this.state = state;
    this.preferences = {
      quality: state.visualQuality,
      reduceMotion: state.visualReduceMotion,
      reduceParticles: state.visualReduceParticles,
      reduceBloom: state.visualReduceBloom,
    };
    this.rebuildScene();
    this.syncViewport();
    this.requestRender();
  }

  public setExternalFrameDriver(active: boolean): void {
    if (this.externalFrameDriverActive === active) {
      return;
    }

    this.externalFrameDriverActive = active;
    this.lastMotionInvalidationMs = Number.NEGATIVE_INFINITY;

    if (active) {
      this.clock.destroy();
      return;
    }

    this.clock.invalidate();
  }

  public previewOrbPosition(
    orbId: string,
    position: NormalizedPoint,
  ): void {
    this.liveOrbPositions.set(orbId, position);
    this.rebuildScene();
    this.requestRender();
  }

  public updateLivePositions(
    positions: ReadonlyMap<string, NormalizedPoint>,
    timestampMs?: number,
  ): void {
    for (const [orbId, position] of positions) {
      this.liveOrbPositions.set(orbId, position);
    }

    if (timestampMs !== undefined) {
      const interval = motionRenderIntervalMs(
        this.renderer.kind,
        this.preferences.quality,
      );

      if (
        interval > 0
        && timestampMs - this.lastMotionInvalidationMs < interval
      ) {
        return;
      }

      this.lastMotionInvalidationMs = timestampMs;
    }

    this.rebuildScene();

    if (
      timestampMs !== undefined
      && this.externalFrameDriverActive
    ) {
      this.renderFrame(timestampMs);
      return;
    }

    this.requestRender();
  }

  public releaseOrbPreview(orbId: string): void {
    if (this.liveOrbPositions.delete(orbId)) {
      this.rebuildScene();
      this.requestRender();
    }
  }

  public previewField(field: EffectFieldDocument): void {
    this.fieldOverrides.set(field.id, field);
    this.rebuildScene();
    this.requestRender();
  }

  public releaseFieldPreview(fieldId: string): void {
    if (this.fieldOverrides.delete(fieldId)) {
      this.rebuildScene();
      this.requestRender();
    }
  }

  public previewToy(toy: PlaygroundToyDocument): void {
    this.toyOverrides.set(toy.id, toy);
    this.rebuildScene();
    this.requestRender();
  }

  public releaseToyPreview(toyId: string): void {
    if (this.toyOverrides.delete(toyId)) {
      this.rebuildScene();
      this.requestRender();
    }
  }

  public pulseOrb(
    orbId: string,
    intensity: number,
    position?: NormalizedPoint,
  ): void {
    this.events.emit(
      {
        kind: 'orb-pulse',
        orbId,
        intensity: Math.max(0.2, Math.min(1, intensity)),
        position: position ?? null,
      },
      performance.now(),
    );
    this.requestRender();
  }

  public pulseLink(
    linkId: string,
    intensity = 1,
  ): void {
    this.events.emit(
      {
        kind: 'link-pulse',
        linkId,
        intensity: Math.max(0.2, Math.min(1, intensity)),
      },
      performance.now(),
    );
    this.requestRender();
  }

  public clearRuntimeOverrides(): void {
    this.liveOrbPositions.clear();
    this.fieldOverrides.clear();
    this.toyOverrides.clear();
    this.events.clear();
    this.lastMotionInvalidationMs = Number.NEGATIVE_INFINITY;
    this.rebuildScene();
  }

  public getDiagnostics(): WorldRendererDiagnostics {
    return {
      kind: this.renderer.kind,
      frames: this.frames,
      averageRenderMs: this.frames > 0
        ? this.totalRenderMs / this.frames
        : 0,
      lastRenderMs: this.lastRenderMs,
      contextLosses: this.contextLosses,
      viewport: this.viewport,
    };
  }

  public destroy(): void {
    this.clock.destroy();
    this.events.clear();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    window.removeEventListener('resize', this.handleWindowResize);
    this.canvas.removeEventListener(
      'webglcontextlost',
      this.handleContextLost,
    );
    this.canvas.removeEventListener(
      'webglcontextrestored',
      this.handleContextRestored,
    );
    this.renderer.destroy();
    this.canvas.remove();
    delete this.shell.dataset.rendererV2;
    delete this.shell.dataset.rendererState;
  }

  private rebuildScene(): void {
    const state = this.state;

    if (!state) {
      this.scene = null;
      return;
    }

    this.scene = projectWorldToRenderScene(
      state.world,
      {
        selectedOrbId: state.selectedOrbId,
        selectedFieldId: state.selectedFieldId,
        selectedToyId: state.selectedToyId,
        selectedLinkId: state.selectedLinkId,
        playing: state.playing,
        recording: state.captureStatus === 'recording',
        liveOrbPositions: this.liveOrbPositions,
        fieldOverrides: this.fieldOverrides,
        toyOverrides: this.toyOverrides,
      },
    );
  }

  private syncViewport(): void {
    const rect = this.worldCanvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const dpr = clampRenderDevicePixelRatio(
      window.devicePixelRatio || 1,
      this.preferences,
    );

    if (
      Math.abs(width - this.viewport.width) < 0.5
      && Math.abs(height - this.viewport.height) < 0.5
      && Math.abs(dpr - this.viewport.dpr) < 0.01
    ) {
      return;
    }

    this.viewport = {
      width,
      height,
      dpr,
    };
    this.renderer.resize(this.viewport);
  }

  private requestRender(): void {
    if (!this.externalFrameDriverActive) {
      this.clock.invalidate();
    }
  }

  private renderFrame(timestampMs: number): boolean {
    if (this.contextLost || !this.scene) {
      return false;
    }

    const snapshot = this.events.sample(timestampMs);
    const startedAt = performance.now();

    try {
      this.renderer.render(
        this.scene,
        this.preferences,
        snapshot.samples,
        timestampMs,
      );
    } catch (error) {
      console.warn('[Loop] Visual V2 render failed.', error);
      this.shell.dataset.rendererState = 'error';
      return false;
    }

    const elapsed = Math.max(0, performance.now() - startedAt);
    this.frames += 1;
    this.lastRenderMs = elapsed;
    this.totalRenderMs += elapsed;

    if (this.frames > 600) {
      this.totalRenderMs = this.totalRenderMs / this.frames;
      this.frames = 1;
    }

    return snapshot.hasActiveEvents;
  }
}
