import type { AppState } from './state';
import type { EffectFieldDocument } from '../core/world/EffectField';
import type { PlaygroundToyDocument } from '../core/world/PlaygroundToy';
import type { NormalizedPoint } from '../core/world/SoundOrb';
import type { VisualPreferences } from '../core/visual/VisualQuality';
import { AnimationClock } from '../core/visual/v2/AnimationClock';
import {
  IDLE_FIELD_INTERACTION,
  IDLE_ORB_INTERACTION,
  LONG_PRESS_CANCEL_DISTANCE_PX,
  LONG_PRESS_CHARGE_MS,
  dragVelocitySample,
  hoverInteractionAtPoint,
  movedDistancePixels,
  pointerPositionInRect,
  resizeTension,
} from '../core/visual/v2/InteractionModel';
import {
  motionRenderIntervalMs,
  rendererDevicePixelRatio,
} from '../core/visual/v2/RendererPolicy';
import { projectWorldToRenderScene } from '../core/visual/v2/SceneAdapter';
import type {
  RenderFieldInteraction,
  RenderOrbInteraction,
  RenderScene,
  RenderVector,
  RenderViewport,
  RendererKind,
  WorldRenderer,
} from '../core/visual/v2/RenderTypes';
import { VisualEventBridge } from '../core/visual/v2/VisualEventBridge';
import { TrailHistory } from '../core/visual/v2/TrailModel';
import { FieldInfluenceTransitions } from '../core/visual/v2/FieldMaterialModel';
import { createWorldRenderer } from '../core/visual/v2/createWorldRenderer';

export interface WorldRendererDiagnostics {
  readonly kind: RendererKind;
  readonly frames: number;
  readonly averageRenderMs: number;
  readonly lastRenderMs: number;
  readonly contextLosses: number;
  readonly viewport: RenderViewport;
}

interface ActiveOrbPointer {
  readonly orbId: string;
  readonly pointerId: number;
  readonly startPosition: NormalizedPoint;
  lastPosition: NormalizedPoint;
  lastAtMs: number;
  movedPixels: number;
  velocity: RenderVector;
  speed: number;
}

interface ActiveFieldPointer {
  readonly fieldId: string;
  readonly pointerId: number;
  readonly kind: 'move' | 'resize';
  readonly center: NormalizedPoint;
  readonly initialRadius: number;
}

export class WorldRendererView {
  private readonly canvas: HTMLCanvasElement;
  private readonly shell: HTMLElement;
  private readonly worldCanvas: HTMLElement;
  private renderer: WorldRenderer;
  private readonly events = new VisualEventBridge();
  private readonly trailHistory = new TrailHistory();
  private readonly fieldTransitions = new FieldInfluenceTransitions();
  private readonly clock: AnimationClock;
  private readonly liveOrbPositions = new Map<string, NormalizedPoint>();
  private readonly orbInteractions = new Map<string, RenderOrbInteraction>();
  private readonly fieldInteractions = new Map<string, RenderFieldInteraction>();
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
  private fieldTransitionsActive = false;
  private lastMotionInvalidationMs = Number.NEGATIVE_INFINITY;
  private externalFrameDriverActive = false;
  private lastPointerPosition: NormalizedPoint | null = null;
  private lastPointerAtMs = 0;
  private focusedOrbId: string | null = null;
  private activeOrbPointer: ActiveOrbPointer | null = null;
  private activeFieldPointer: ActiveFieldPointer | null = null;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly handleWindowResize = () => {
    this.syncViewport();
    this.requestRender();
  };

  private readonly handlePointerMove = (event: PointerEvent) => {
    const rect = this.worldCanvas.getBoundingClientRect();
    const position = pointerPositionInRect(
      event.clientX,
      event.clientY,
      rect,
    );

    if (!position) {
      return;
    }
    const now = performance.now();
    const previous = this.lastPointerPosition;
    const elapsed = Math.max(8, now - this.lastPointerAtMs);
    const delta = previous
      ? {
          x: Math.max(-0.12, Math.min(0.12, position.x - previous.x)),
          y: Math.max(-0.12, Math.min(0.12, position.y - previous.y)),
        }
      : { x: 0, y: 0 };
    const speed = previous
      ? Math.hypot(delta.x, delta.y) * 1000 / elapsed
      : 0;

    this.lastPointerPosition = position;
    this.lastPointerAtMs = now;
    this.events.emit(
      {
        kind: 'pointer-disturbance',
        position,
        delta,
        intensity: Math.max(
          0.16,
          Math.min(1, 0.18 + speed * 0.42),
        ),
      },
      now,
    );
    this.requestRender();
  };

  private readonly handlePointerLeave = () => {
    this.lastPointerPosition = null;
    this.lastPointerAtMs = 0;

    if (!this.activeOrbPointer) {
      this.clearHoverInteractions();
    }
  };

  private readonly handleInteractionPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 && event.pointerType === 'mouse') {
      return;
    }

    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const rect = this.worldCanvas.getBoundingClientRect();
    const position = pointerPositionInRect(
      event.clientX,
      event.clientY,
      rect,
    );

    if (!position) {
      return;
    }

    const orbElement = target.closest<HTMLElement>('[data-orb-id]');
    const orbId = orbElement?.dataset.orbId;

    if (orbId) {
      this.cancelLongPressTimer();
      this.activeOrbPointer = {
        orbId,
        pointerId: event.pointerId,
        startPosition: position,
        lastPosition: position,
        lastAtMs: performance.now(),
        movedPixels: 0,
        velocity: { x: 0, y: 0 },
        speed: 0,
      };
      this.orbInteractions.set(orbId, {
        ...IDLE_ORB_INTERACTION,
        hoverStrength: event.pointerType === 'touch' ? 0 : 1,
        grabbed: true,
      });
      this.rebuildScene();
      this.requestRender();

      this.longPressTimer = setTimeout(() => {
        this.longPressTimer = null;
        const active = this.activeOrbPointer;

        if (
          !active
          || active.orbId !== orbId
          || active.pointerId !== event.pointerId
          || active.movedPixels > LONG_PRESS_CANCEL_DISTANCE_PX
        ) {
          return;
        }

        const interaction = this.orbInteractions.get(orbId)
          ?? IDLE_ORB_INTERACTION;
        const orbPosition = this.liveOrbPositions.get(orbId)
          ?? this.scene?.orbs.find((orb) => orb.id === orbId)?.position
          ?? position;

        this.orbInteractions.set(orbId, {
          ...interaction,
          charging: true,
        });
        this.events.emit({
          kind: 'orb-charge',
          orbId,
          position: orbPosition,
          intensity: 1,
        }, performance.now());
        this.rebuildScene();
        this.requestRender();
      }, LONG_PRESS_CHARGE_MS);
      return;
    }

    const fieldElement = target.closest<HTMLElement>('[data-field-id]');
    const fieldId = fieldElement?.dataset.fieldId;

    if (!fieldId) {
      return;
    }

    const field = this.fieldOverrides.get(fieldId)
      ?? this.state?.world.effectFields.find(
        (candidate) => candidate.id === fieldId,
      );

    if (!field) {
      return;
    }

    const resizing = target.classList.contains('field-resize-handle');
    this.activeFieldPointer = {
      fieldId,
      pointerId: event.pointerId,
      kind: resizing ? 'resize' : 'move',
      center: field.position,
      initialRadius: field.radius,
    };
    this.fieldInteractions.set(fieldId, {
      ...IDLE_FIELD_INTERACTION,
      dragging: !resizing,
      resizing,
    });
    this.rebuildScene();
    this.requestRender();
  };

  private readonly handleInteractionPointerMove = (event: PointerEvent) => {
    const rect = this.worldCanvas.getBoundingClientRect();
    const position = pointerPositionInRect(
      event.clientX,
      event.clientY,
      rect,
    );

    if (!position) {
      return;
    }

    const activeOrb = this.activeOrbPointer;

    if (
      activeOrb
      && activeOrb.pointerId === event.pointerId
    ) {
      const now = performance.now();
      const velocity = dragVelocitySample(
        activeOrb.lastPosition,
        position,
        now - activeOrb.lastAtMs,
        rect.width,
        rect.height,
      );
      activeOrb.movedPixels += movedDistancePixels(
        activeOrb.lastPosition,
        position,
        rect.width,
        rect.height,
      );
      activeOrb.lastPosition = position;
      activeOrb.lastAtMs = now;
      activeOrb.velocity = velocity.direction;
      activeOrb.speed = velocity.speed;

      if (activeOrb.movedPixels > LONG_PRESS_CANCEL_DISTANCE_PX) {
        this.cancelLongPressTimer();
      }

      this.orbInteractions.set(activeOrb.orbId, {
        ...IDLE_ORB_INTERACTION,
        grabbed: true,
        dragVelocity: velocity.direction,
        dragSpeed: this.preferences.reduceMotion
          ? velocity.speed * 0.2
          : velocity.speed,
        charging: (
          this.orbInteractions.get(activeOrb.orbId)?.charging
          ?? false
        ) && activeOrb.movedPixels <= LONG_PRESS_CANCEL_DISTANCE_PX,
      });
      this.rebuildScene();
      this.requestRender();
      return;
    }

    const activeField = this.activeFieldPointer;

    if (
      activeField
      && activeField.pointerId === event.pointerId
    ) {
      const tension = activeField.kind === 'resize'
        ? resizeTension(
            activeField.center,
            position,
            activeField.initialRadius,
            rect.width,
            rect.height,
          )
        : 0.18;

      this.fieldInteractions.set(activeField.fieldId, {
        dragging: activeField.kind === 'move',
        resizing: activeField.kind === 'resize',
        tension: this.preferences.reduceMotion
          ? Math.min(0.24, tension)
          : tension,
      });
      this.rebuildScene();
      this.requestRender();
      return;
    }

    if (event.pointerType !== 'touch') {
      this.updateHoverInteractions(
        position,
        rect.width,
        rect.height,
      );
    }
  };

  private readonly handleInteractionPointerEnd = (event: PointerEvent) => {
    const rect = this.worldCanvas.getBoundingClientRect();
    const pointerPosition = pointerPositionInRect(
      event.clientX,
      event.clientY,
      rect,
    );
    const activeOrb = this.activeOrbPointer;

    if (
      activeOrb
      && activeOrb.pointerId === event.pointerId
    ) {
      this.cancelLongPressTimer();
      const orbPosition = this.liveOrbPositions.get(activeOrb.orbId)
        ?? this.scene?.orbs.find(
          (orb) => orb.id === activeOrb.orbId,
        )?.position
        ?? activeOrb.lastPosition;
      const intensity = Math.max(
        0.2,
        Math.min(1, activeOrb.speed * 0.9 + 0.18),
      );

      this.events.emit({
        kind: 'orb-drop',
        orbId: activeOrb.orbId,
        position: orbPosition,
        velocity: activeOrb.velocity,
        intensity,
      }, performance.now());

      this.activeOrbPointer = null;
      this.orbInteractions.delete(activeOrb.orbId);

      if (
        pointerPosition
        && event.pointerType !== 'touch'
      ) {
        this.updateHoverInteractions(
          pointerPosition,
          rect.width,
          rect.height,
        );
      }

      this.rebuildScene();
      this.requestRender();
    }

    const activeField = this.activeFieldPointer;

    if (
      activeField
      && activeField.pointerId === event.pointerId
    ) {
      this.activeFieldPointer = null;
      this.fieldInteractions.delete(activeField.fieldId);
      this.rebuildScene();
      this.requestRender();
    }
  };

  private readonly handleInteractionKeyDown = (event: KeyboardEvent) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const orbElement = target.closest<HTMLElement>('[data-orb-id]');
    const orbId = orbElement?.dataset.orbId;

    if (!orbId) {
      return;
    }

    const velocity = (() => {
      switch (event.key) {
        case 'ArrowLeft':
          return { x: -1, y: 0 };
        case 'ArrowRight':
          return { x: 1, y: 0 };
        case 'ArrowUp':
          return { x: 0, y: -1 };
        case 'ArrowDown':
          return { x: 0, y: 1 };
        default:
          return null;
      }
    })();

    if (!velocity) {
      return;
    }

    const position = this.liveOrbPositions.get(orbId)
      ?? this.scene?.orbs.find((orb) => orb.id === orbId)?.position;

    if (!position) {
      return;
    }

    this.events.emit({
      kind: 'orb-drop',
      orbId,
      position,
      velocity,
      intensity: this.preferences.reduceMotion ? 0.18 : 0.38,
    }, performance.now());
    this.requestRender();
  };

  private readonly handleFocusIn = (event: FocusEvent) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const orb = target.closest<HTMLElement>('[data-orb-id]');
    const next = orb?.dataset.orbId ?? null;

    if (next === this.focusedOrbId) {
      return;
    }

    this.focusedOrbId = next;
    this.rebuildScene();
    this.requestRender();
  };

  private readonly handleFocusOut = (event: FocusEvent) => {
    const related = event.relatedTarget;

    if (
      related instanceof HTMLElement
      && related.closest<HTMLElement>('[data-orb-id]')
    ) {
      return;
    }

    if (this.focusedOrbId === null) {
      return;
    }

    this.focusedOrbId = null;
    this.activeOrbPointer = null;
    this.activeFieldPointer = null;
    this.cancelLongPressTimer();
    this.rebuildScene();
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
    worldCanvas.addEventListener(
      'pointermove',
      this.handlePointerMove,
      { passive: true },
    );
    worldCanvas.addEventListener(
      'pointerdown',
      this.handlePointerMove,
      { passive: true },
    );
    worldCanvas.addEventListener(
      'pointerleave',
      this.handlePointerLeave,
      { passive: true },
    );
    worldCanvas.addEventListener(
      'focusin',
      this.handleFocusIn,
    );
    worldCanvas.addEventListener(
      'focusout',
      this.handleFocusOut,
    );
    worldCanvas.addEventListener(
      'pointerdown',
      this.handleInteractionPointerDown,
      { capture: true, passive: true },
    );
    worldCanvas.addEventListener(
      'pointermove',
      this.handleInteractionPointerMove,
      { capture: true, passive: true },
    );
    worldCanvas.addEventListener(
      'pointerup',
      this.handleInteractionPointerEnd,
      { capture: true, passive: true },
    );
    worldCanvas.addEventListener(
      'pointercancel',
      this.handleInteractionPointerEnd,
      { capture: true, passive: true },
    );
    worldCanvas.addEventListener(
      'keydown',
      this.handleInteractionKeyDown,
      true,
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
      this.trailHistory.clear();
      this.fieldTransitions.clear();
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
    timestampMs = performance.now(),
  ): void {
    this.liveOrbPositions.set(orbId, position);
    this.sampleTrailOrb(
      orbId,
      position,
      timestampMs,
    );
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

    this.sampleTrailWorld(
      positions,
      timestampMs ?? performance.now(),
    );

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

  public linkCreated(linkId: string): void {
    this.events.emit(
      {
        kind: 'link-created',
        linkId,
      },
      performance.now(),
    );
    this.requestRender();
  }

  public linkDeleted(linkId: string): void {
    const link = this.scene?.links.find(
      (candidate) => candidate.id === linkId,
    );

    if (!link) {
      return;
    }

    this.events.emit(
      {
        kind: 'link-deleted',
        link: {
          id: link.id,
          type: link.type,
          sourceRole: link.sourceRole,
          targetRole: link.targetRole,
          source: link.source,
          target: link.target,
          cross: link.cross,
        },
      },
      performance.now(),
    );
    this.requestRender();
  }

  public clearRuntimeOverrides(): void {
    this.liveOrbPositions.clear();
    this.orbInteractions.clear();
    this.fieldInteractions.clear();
    this.fieldOverrides.clear();
    this.toyOverrides.clear();
    this.events.clear();
    this.lastMotionInvalidationMs = Number.NEGATIVE_INFINITY;
    this.lastPointerPosition = null;
    this.lastPointerAtMs = 0;
    this.focusedOrbId = null;
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
    this.trailHistory.clear();
    this.fieldTransitions.clear();
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
    this.worldCanvas.removeEventListener(
      'pointermove',
      this.handlePointerMove,
    );
    this.worldCanvas.removeEventListener(
      'pointerdown',
      this.handlePointerMove,
    );
    this.worldCanvas.removeEventListener(
      'pointerleave',
      this.handlePointerLeave,
    );
    this.worldCanvas.removeEventListener(
      'focusin',
      this.handleFocusIn,
    );
    this.worldCanvas.removeEventListener(
      'focusout',
      this.handleFocusOut,
    );
    this.worldCanvas.removeEventListener(
      'pointerdown',
      this.handleInteractionPointerDown,
      true,
    );
    this.worldCanvas.removeEventListener(
      'pointermove',
      this.handleInteractionPointerMove,
      true,
    );
    this.worldCanvas.removeEventListener(
      'pointerup',
      this.handleInteractionPointerEnd,
      true,
    );
    this.worldCanvas.removeEventListener(
      'pointercancel',
      this.handleInteractionPointerEnd,
      true,
    );
    this.worldCanvas.removeEventListener(
      'keydown',
      this.handleInteractionKeyDown,
      true,
    );
    this.cancelLongPressTimer();
    this.renderer.destroy();
    this.canvas.remove();
    delete this.shell.dataset.rendererV2;
    delete this.shell.dataset.rendererState;
  }

  private rebuildScene(
    timestampMs = performance.now(),
  ): void {
    const state = this.state;

    if (!state) {
      this.scene = null;
      return;
    }

    this.fieldTransitionsActive = this.fieldTransitions.update(
      state.world.soundOrbs,
      this.liveOrbPositions,
      this.effectFieldsWithPreviews(state),
      timestampMs,
      this.preferences.reduceMotion,
    );

    this.scene = projectWorldToRenderScene(
      state.world,
      {
        selectedOrbId: state.selectedOrbId,
        focusedOrbId: this.focusedOrbId,
        selectedFieldId: state.selectedFieldId,
        selectedToyId: state.selectedToyId,
        selectedLinkId: state.selectedLinkId,
        playing: state.playing,
        recording: state.captureStatus === 'recording',
        liveOrbPositions: this.liveOrbPositions,
        orbInteractions: this.orbInteractions,
        orbFieldInfluenceOverrides: this.fieldTransitions.snapshot(),
        trails: this.trailHistory.snapshot(state.world),
        fieldInteractions: this.fieldInteractions,
        fieldOverrides: this.fieldOverrides,
        toyOverrides: this.toyOverrides,
      },
    );
  }

  private sampleTrailOrb(
    orbId: string,
    position: NormalizedPoint,
    timestampMs: number,
  ): void {
    const state = this.state;

    if (!state) {
      return;
    }

    const orb = state.world.soundOrbs.find(
      (candidate) => candidate.id === orbId,
    );

    if (!orb) {
      return;
    }

    this.trailHistory.sampleOrb(
      orb,
      position,
      timestampMs,
      this.viewport.width,
      this.viewport.height,
      this.effectFieldsWithPreviews(state),
      this.playgroundToysWithPreviews(state),
      this.preferences,
    );
  }

  private sampleTrailWorld(
    positions: ReadonlyMap<string, NormalizedPoint>,
    timestampMs: number,
  ): void {
    const state = this.state;

    if (!state) {
      return;
    }

    this.trailHistory.sampleWorld(
      state.world,
      positions,
      timestampMs,
      this.viewport.width,
      this.viewport.height,
      this.effectFieldsWithPreviews(state),
      this.playgroundToysWithPreviews(state),
      this.preferences,
    );
  }

  private effectFieldsWithPreviews(
    state: Readonly<AppState>,
  ): readonly EffectFieldDocument[] {
    if (this.fieldOverrides.size === 0) {
      return state.world.effectFields;
    }

    return state.world.effectFields.map(
      (field) => this.fieldOverrides.get(field.id) ?? field,
    );
  }

  private playgroundToysWithPreviews(
    state: Readonly<AppState>,
  ): readonly PlaygroundToyDocument[] {
    if (this.toyOverrides.size === 0) {
      return state.world.playgroundToys;
    }

    return state.world.playgroundToys.map(
      (toy) => this.toyOverrides.get(toy.id) ?? toy,
    );
  }

  private updateHoverInteractions(
    pointer: NormalizedPoint,
    width: number,
    height: number,
  ): void {
    const scene = this.scene;

    if (!scene) {
      return;
    }

    let changed = false;

    for (const orb of scene.orbs) {
      if (this.activeOrbPointer?.orbId === orb.id) {
        continue;
      }

      const hover = hoverInteractionAtPoint(
        pointer,
        orb.position,
        width,
        height,
        true,
      );
      const current = this.orbInteractions.get(orb.id)
        ?? IDLE_ORB_INTERACTION;

      if (
        Math.abs(current.hoverStrength - hover.hoverStrength) < 0.01
        && Math.abs(current.hoverOffset.x - hover.hoverOffset.x) < 0.01
        && Math.abs(current.hoverOffset.y - hover.hoverOffset.y) < 0.01
      ) {
        continue;
      }

      if (
        hover.hoverStrength <= 0
        && !current.grabbed
        && !current.charging
        && current.dragSpeed <= 0
      ) {
        this.orbInteractions.delete(orb.id);
      } else {
        this.orbInteractions.set(orb.id, {
          ...current,
          ...hover,
        });
      }

      changed = true;
    }

    if (changed) {
      this.rebuildScene();
      this.requestRender();
    }
  }

  private clearHoverInteractions(): void {
    let changed = false;

    for (const [orbId, interaction] of this.orbInteractions) {
      if (interaction.hoverStrength <= 0) {
        continue;
      }

      const next = {
        ...interaction,
        hoverStrength: 0,
        hoverOffset: { x: 0, y: 0 },
      };

      if (
        !next.grabbed
        && !next.charging
        && next.dragSpeed <= 0
      ) {
        this.orbInteractions.delete(orbId);
      } else {
        this.orbInteractions.set(orbId, next);
      }

      changed = true;
    }

    if (changed) {
      this.rebuildScene();
      this.requestRender();
    }
  }

  private cancelLongPressTimer(): void {
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private syncViewport(): void {
    const rect = this.worldCanvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const dpr = rendererDevicePixelRatio(
      this.renderer.kind,
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

    const trailChanged = this.trailHistory.prune(
      timestampMs,
      this.preferences,
    );

    if (trailChanged || this.fieldTransitionsActive) {
      this.rebuildScene(timestampMs);
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

    return snapshot.hasActiveEvents
      || this.fieldTransitionsActive
      || this.trailHistory.hasVisible(
        timestampMs,
        this.preferences,
      );
  }
}
