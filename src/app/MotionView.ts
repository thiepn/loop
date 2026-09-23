import {
  motionForOrb,
  type MotionMode,
  type MotionRange,
  type MotionSpeed,
} from '../core/world/Motion';
import {
  MAX_PLAYGROUND_TOYS,
  playgroundToyDescription,
  playgroundToyLabel,
  type PlaygroundToyDocument,
  type PlaygroundToyType,
} from '../core/world/PlaygroundToy';
import { soundById } from '../core/sounds/coreCatalog';
import type { NormalizedPoint } from '../core/world/SoundOrb';
import type { AppState } from './state';

export interface MotionViewCallbacks {
  readonly onCloseMotion: () => void;
  readonly onSetMotionMode: (orbId: string, mode: MotionMode) => void;
  readonly onSetMotionSpeed: (orbId: string, speed: MotionSpeed) => void;
  readonly onSetMotionRange: (orbId: string, range: MotionRange) => void;
  readonly onSetFollowTarget: (orbId: string, targetOrbId: string) => void;

  readonly onOpenToyPalette: () => void;
  readonly onCloseToyPalette: () => void;
  readonly onAddToy: (type: PlaygroundToyType) => void;
  readonly onSelectToy: (toyId: string | null) => void;
  readonly onToyPreview: (toy: PlaygroundToyDocument) => void;
  readonly onToyMoveCommit: (toyId: string, position: NormalizedPoint) => void;
  readonly onPortalExitCommit: (toyId: string, position: NormalizedPoint) => void;
  readonly onToyPreviewEnd: (toyId: string) => void;
  readonly onDeleteToy: (toyId: string) => void;
}

type ToyGesture =
  | {
      readonly kind: 'body';
      readonly toyId: string;
      readonly pointerId: number;
      lastPosition: NormalizedPoint;
    }
  | {
      readonly kind: 'portal-exit';
      readonly toyId: string;
      readonly pointerId: number;
      lastPosition: NormalizedPoint;
    };

const MOTION_MODES: readonly {
  readonly id: MotionMode;
  readonly label: string;
  readonly description: string;
}[] = [
  { id: 'still', label: 'Still', description: 'Stay where you put it' },
  { id: 'orbit', label: 'Orbit', description: 'Circle around its home' },
  { id: 'bounce', label: 'Bounce', description: 'Move back and forth' },
  { id: 'drift', label: 'Drift', description: 'Float gently' },
  { id: 'follow', label: 'Follow', description: 'Trail another sound' },
  { id: 'wander', label: 'Wander', description: 'Roam on its own' },
];

const TOY_TYPES: readonly PlaygroundToyType[] = [
  'spinner',
  'magnet',
  'repulsor',
  'portal',
];

export class MotionView {
  private readonly canvas: HTMLElement;
  private readonly toyLayer: HTMLElement;
  private readonly toysButton: HTMLButtonElement;
  private readonly motionBackdrop: HTMLElement;
  private readonly motionTitle: HTMLElement;
  private readonly modeGrid: HTMLElement;
  private readonly speedOptions: HTMLElement;
  private readonly rangeOptions: HTMLElement;
  private readonly followGroup: HTMLElement;
  private readonly followOptions: HTMLElement;
  private readonly toyPalette: HTMLElement;
  private readonly toyPanel: HTMLElement;
  private readonly toyPanelName: HTMLElement;
  private readonly toyElements = new Map<string, HTMLElement>();
  private readonly portalExitElements = new Map<string, HTMLElement>();
  private latestState: Readonly<AppState> | null = null;
  private gesture: ToyGesture | null = null;

  public constructor(
    private readonly root: HTMLElement,
    private readonly callbacks: MotionViewCallbacks,
  ) {
    const canvas = root.querySelector<HTMLElement>('[data-canvas]');
    const dock = root.querySelector<HTMLElement>('.playground-dock');
    const shell = root.querySelector<HTMLElement>('.playground-shell');

    if (!canvas || !dock || !shell) {
      throw new Error('Motion view requires the playground shell.');
    }

    this.canvas = canvas;

    const toyLayer = document.createElement('div');
    toyLayer.className = 'playground-toy-layer';
    canvas.append(toyLayer);
    this.toyLayer = toyLayer;

    const toysButton = document.createElement('button');
    toysButton.type = 'button';
    toysButton.className = 'toys-button';
    toysButton.innerHTML = '<span aria-hidden="true">✣</span> Toys';
    toysButton.addEventListener('click', callbacks.onOpenToyPalette);
    dock.append(toysButton);
    this.toysButton = toysButton;

    const motionBackdrop = document.createElement('div');
    motionBackdrop.className = 'motion-backdrop';
    motionBackdrop.hidden = true;
    motionBackdrop.innerHTML = `
      <section class="motion-sheet" role="dialog" aria-modal="true" aria-labelledby="motion-title">
        <header class="motion-header">
          <div>
            <span>Make it move</span>
            <h2 id="motion-title" data-motion-title>Motion</h2>
            <p>Pick a behavior. Loop handles the path.</p>
          </div>
          <button class="motion-close" type="button" data-motion-close aria-label="Close Motion">×</button>
        </header>

        <div class="motion-mode-grid" data-motion-modes></div>

        <div class="motion-macros">
          <div class="motion-macro">
            <span>Speed</span>
            <div class="motion-options" data-motion-speed></div>
          </div>
          <div class="motion-macro">
            <span>Range</span>
            <div class="motion-options" data-motion-range></div>
          </div>
        </div>

        <div class="follow-target-group" data-follow-group hidden>
          <span>Follow</span>
          <div class="follow-targets" data-follow-targets></div>
        </div>
      </section>
    `;
    shell.append(motionBackdrop);
    this.motionBackdrop = motionBackdrop;

    const motionTitle = motionBackdrop.querySelector<HTMLElement>('[data-motion-title]');
    const modeGrid = motionBackdrop.querySelector<HTMLElement>('[data-motion-modes]');
    const speedOptions = motionBackdrop.querySelector<HTMLElement>('[data-motion-speed]');
    const rangeOptions = motionBackdrop.querySelector<HTMLElement>('[data-motion-range]');
    const followGroup = motionBackdrop.querySelector<HTMLElement>('[data-follow-group]');
    const followOptions = motionBackdrop.querySelector<HTMLElement>('[data-follow-targets]');

    if (!motionTitle || !modeGrid || !speedOptions || !rangeOptions || !followGroup || !followOptions) {
      throw new Error('Motion sheet failed to mount.');
    }

    this.motionTitle = motionTitle;
    this.modeGrid = modeGrid;
    this.speedOptions = speedOptions;
    this.rangeOptions = rangeOptions;
    this.followGroup = followGroup;
    this.followOptions = followOptions;

    motionBackdrop.querySelector<HTMLButtonElement>('[data-motion-close]')?.addEventListener(
      'click',
      callbacks.onCloseMotion,
    );
    motionBackdrop.addEventListener('pointerdown', (event) => {
      if (event.target === motionBackdrop) {
        callbacks.onCloseMotion();
      }
    });

    const toyPanel = document.createElement('aside');
    toyPanel.className = 'toy-selection-panel';
    toyPanel.hidden = true;
    toyPanel.innerHTML = `
      <div class="toy-selection-copy">
        <span>Playground Toy</span>
        <strong data-toy-name>Toy</strong>
      </div>
      <div class="toy-selection-actions">
        <span data-toy-help>Drag to move</span>
        <button class="danger-action" type="button" data-toy-delete>Delete</button>
      </div>
    `;
    shell.append(toyPanel);
    this.toyPanel = toyPanel;

    const toyPanelName = toyPanel.querySelector<HTMLElement>('[data-toy-name]');
    if (!toyPanelName) {
      throw new Error('Toy selection panel failed to mount.');
    }
    this.toyPanelName = toyPanelName;

    toyPanel.querySelector<HTMLButtonElement>('[data-toy-delete]')?.addEventListener('click', () => {
      const toyId = this.root.dataset.selectedToyId || null;
      if (toyId) {
        callbacks.onDeleteToy(toyId);
      }
    });

    const toyPalette = document.createElement('div');
    toyPalette.className = 'toy-palette-backdrop';
    toyPalette.hidden = true;
    toyPalette.innerHTML = `
      <section class="toy-palette-sheet" role="dialog" aria-modal="true" aria-labelledby="toys-title">
        <header class="toy-palette-header">
          <div>
            <span>Playground toys</span>
            <h2 id="toys-title">Add a toy</h2>
            <p>Toys push, pull and redirect moving sounds.</p>
          </div>
          <button class="toy-palette-close" type="button" data-toys-close aria-label="Close toys">×</button>
        </header>
        <div class="toy-palette-grid" data-toy-choices></div>
      </section>
    `;
    shell.append(toyPalette);
    this.toyPalette = toyPalette;

    toyPalette.querySelector<HTMLButtonElement>('[data-toys-close]')?.addEventListener(
      'click',
      callbacks.onCloseToyPalette,
    );
    toyPalette.addEventListener('pointerdown', (event) => {
      if (event.target === toyPalette) {
        callbacks.onCloseToyPalette();
      }
    });
  }

  public render(state: Readonly<AppState>): void {
    this.latestState = state;
    this.root.dataset.selectedToyId = state.selectedToyId ?? '';

    this.renderMotionSheet(state);
    this.syncToys(state);
    this.renderToyPanel(state);
    this.renderToyPalette(state);
  }

  public destroy(): void {
    this.gesture = null;
    this.toyElements.clear();
    this.portalExitElements.clear();
    this.toyLayer.remove();
    this.toysButton.remove();
    this.motionBackdrop.remove();
    this.toyPanel.remove();
    this.toyPalette.remove();
  }

  private renderMotionSheet(state: Readonly<AppState>): void {
    const orb = state.motionEditorOrbId
      ? state.world.soundOrbs.find((candidate) => candidate.id === state.motionEditorOrbId)
      : undefined;

    this.motionBackdrop.hidden = !orb;

    if (!orb) {
      return;
    }

    const sound = soundById(orb.soundId);
    const motion = motionForOrb(orb);

    this.motionTitle.textContent = sound?.name ?? 'Sound';

    this.modeGrid.replaceChildren();
    for (const mode of MOTION_MODES) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'motion-mode-choice';
      button.dataset.motionMode = mode.id;
      button.classList.toggle('is-active', motion.mode === mode.id);
      button.innerHTML = `
        <span class="motion-mode-art" aria-hidden="true"></span>
        <span>
          <strong>${mode.label}</strong>
          <small>${mode.description}</small>
        </span>
      `;
      button.addEventListener('click', () => {
        this.callbacks.onSetMotionMode(orb.id, mode.id);
      });
      this.modeGrid.append(button);
    }

    this.renderMacroOptions(
      this.speedOptions,
      [
        ['slow', 'Slow'],
        ['medium', 'Medium'],
        ['fast', 'Fast'],
      ] as const,
      motion.speed,
      (value) => this.callbacks.onSetMotionSpeed(orb.id, value),
      motion.mode === 'still',
    );

    this.renderMacroOptions(
      this.rangeOptions,
      [
        ['tight', 'Tight'],
        ['medium', 'Medium'],
        ['wide', 'Wide'],
      ] as const,
      motion.range,
      (value) => this.callbacks.onSetMotionRange(orb.id, value),
      motion.mode === 'still',
    );

    this.followGroup.hidden = motion.mode !== 'follow';
    this.followOptions.replaceChildren();

    if (motion.mode === 'follow') {
      for (const candidate of state.world.soundOrbs) {
        if (candidate.id === orb.id) {
          continue;
        }

        const candidateSound = soundById(candidate.soundId);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'follow-target';
        button.classList.toggle('is-active', motion.targetOrbId === candidate.id);
        button.textContent = candidateSound?.name ?? candidate.role;
        button.addEventListener('click', () => {
          this.callbacks.onSetFollowTarget(orb.id, candidate.id);
        });
        this.followOptions.append(button);
      }
    }
  }

  private renderMacroOptions<T extends string>(
    container: HTMLElement,
    options: readonly (readonly [T, string])[],
    selected: T,
    onSelect: (value: T) => void,
    disabled = false,
  ): void {
    container.replaceChildren();

    for (const [value, label] of options) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.disabled = disabled;
      button.classList.toggle('is-active', value === selected);
      button.addEventListener('click', () => onSelect(value));
      container.append(button);
    }
  }

  private syncToys(state: Readonly<AppState>): void {
    const liveIds = new Set(state.world.playgroundToys.map((toy) => toy.id));

    for (const [toyId, element] of this.toyElements) {
      if (!liveIds.has(toyId)) {
        element.remove();
        this.toyElements.delete(toyId);
      }
    }

    for (const [toyId, element] of this.portalExitElements) {
      if (!liveIds.has(toyId)) {
        element.remove();
        this.portalExitElements.delete(toyId);
      }
    }

    for (const toy of state.world.playgroundToys) {
      let element = this.toyElements.get(toy.id);

      if (!element) {
        element = this.createToyElement(toy);
        this.toyLayer.append(element);
        this.toyElements.set(toy.id, element);
      }

      this.updateToyElement(
        element,
        toy,
        state.selectedToyId === toy.id,
      );

      if (toy.type === 'portal') {
        let exit = this.portalExitElements.get(toy.id);

        if (!exit) {
          exit = this.createPortalExitElement(toy);
          this.toyLayer.append(exit);
          this.portalExitElements.set(toy.id, exit);
        }

        this.updatePortalExitElement(exit, toy);
      } else {
        this.portalExitElements.get(toy.id)?.remove();
        this.portalExitElements.delete(toy.id);
      }
    }
  }

  private createToyElement(toy: PlaygroundToyDocument): HTMLElement {
    const element = document.createElement('div');
    element.className = 'playground-toy';
    element.tabIndex = 0;
    element.dataset.toyId = toy.id;
    element.innerHTML = `
      <span class="toy-surface" aria-hidden="true"></span>
      <span class="toy-symbol" aria-hidden="true"></span>
      <span class="toy-label"></span>
    `;

    element.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 && event.pointerType === 'mouse') {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      this.callbacks.onSelectToy(toy.id);
      element.setPointerCapture(event.pointerId);

      const current = this.toyFromState(toy.id) ?? toy;
      this.gesture = {
        kind: 'body',
        toyId: toy.id,
        pointerId: event.pointerId,
        lastPosition: current.position,
      };
      element.classList.add('is-dragging');
    });

    element.addEventListener('pointermove', (event) => {
      const gesture = this.gesture;

      if (
        !gesture ||
        gesture.kind !== 'body' ||
        gesture.toyId !== toy.id ||
        gesture.pointerId !== event.pointerId
      ) {
        return;
      }

      const position = this.positionFromPointer(event);
      gesture.lastPosition = position;
      const preview = {
        ...(this.toyFromState(toy.id) ?? toy),
        position,
      };
      this.updateToyElement(element, preview, true);
      this.callbacks.onToyPreview(preview);
    });

    const finish = (event: PointerEvent) => {
      const gesture = this.gesture;

      if (
        !gesture ||
        gesture.kind !== 'body' ||
        gesture.toyId !== toy.id ||
        gesture.pointerId !== event.pointerId
      ) {
        return;
      }

      this.gesture = null;
      element.classList.remove('is-dragging');

      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId);
      }

      this.callbacks.onToyMoveCommit(toy.id, gesture.lastPosition);
      this.callbacks.onToyPreviewEnd(toy.id);
    };

    element.addEventListener('pointerup', finish);
    element.addEventListener('pointercancel', finish);

    element.addEventListener('keydown', (event) => {
      const current = this.toyFromState(toy.id);
      if (!current) {
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        this.callbacks.onDeleteToy(toy.id);
        return;
      }

      const amount = event.shiftKey ? 0.035 : 0.015;
      let dx = 0;
      let dy = 0;

      switch (event.key) {
        case 'ArrowLeft':
          dx = -amount;
          break;
        case 'ArrowRight':
          dx = amount;
          break;
        case 'ArrowUp':
          dy = -amount;
          break;
        case 'ArrowDown':
          dy = amount;
          break;
        default:
          return;
      }

      event.preventDefault();
      this.callbacks.onToyMoveCommit(toy.id, {
        x: current.position.x + dx,
        y: current.position.y + dy,
      });
    });

    return element;
  }

  private createPortalExitElement(toy: PlaygroundToyDocument): HTMLElement {
    const element = document.createElement('div');
    element.className = 'portal-exit';
    element.tabIndex = 0;
    element.dataset.portalToyId = toy.id;
    element.innerHTML = `
      <span class="portal-exit-surface" aria-hidden="true"></span>
      <span class="portal-exit-label">OUT</span>
    `;

    element.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 && event.pointerType === 'mouse') {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      this.callbacks.onSelectToy(toy.id);
      element.setPointerCapture(event.pointerId);

      const current = this.toyFromState(toy.id) ?? toy;
      this.gesture = {
        kind: 'portal-exit',
        toyId: toy.id,
        pointerId: event.pointerId,
        lastPosition: current.exitPosition ?? { x: 0.78, y: 0.72 },
      };
      element.classList.add('is-dragging');
    });

    element.addEventListener('pointermove', (event) => {
      const gesture = this.gesture;

      if (
        !gesture ||
        gesture.kind !== 'portal-exit' ||
        gesture.toyId !== toy.id ||
        gesture.pointerId !== event.pointerId
      ) {
        return;
      }

      const exitPosition = this.positionFromPointer(event);
      gesture.lastPosition = exitPosition;
      const preview = {
        ...(this.toyFromState(toy.id) ?? toy),
        exitPosition,
      };
      this.updatePortalExitElement(element, preview);
      this.callbacks.onToyPreview(preview);
    });

    const finish = (event: PointerEvent) => {
      const gesture = this.gesture;

      if (
        !gesture ||
        gesture.kind !== 'portal-exit' ||
        gesture.toyId !== toy.id ||
        gesture.pointerId !== event.pointerId
      ) {
        return;
      }

      this.gesture = null;
      element.classList.remove('is-dragging');

      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId);
      }

      this.callbacks.onPortalExitCommit(toy.id, gesture.lastPosition);
      this.callbacks.onToyPreviewEnd(toy.id);
    };

    element.addEventListener('pointerup', finish);
    element.addEventListener('pointercancel', finish);

    return element;
  }

  private updateToyElement(
    element: HTMLElement,
    toy: PlaygroundToyDocument,
    selected: boolean,
  ): void {
    element.dataset.toyType = toy.type;
    element.style.left = `${toy.position.x * 100}%`;
    element.style.top = `${toy.position.y * 100}%`;
    element.style.width = `${toy.radius * 200}%`;
    element.style.height = `${toy.radius * 200}%`;
    element.classList.toggle('is-selected', selected);
    element.setAttribute(
      'aria-label',
      `${playgroundToyLabel(toy.type)}. ${playgroundToyDescription(toy.type)}. Drag to move.`,
    );

    const label = element.querySelector<HTMLElement>('.toy-label');
    if (label) {
      label.textContent = playgroundToyLabel(toy.type);
    }
  }

  private updatePortalExitElement(
    element: HTMLElement,
    toy: PlaygroundToyDocument,
  ): void {
    const exit = toy.exitPosition ?? { x: 0.78, y: 0.72 };
    element.style.left = `${exit.x * 100}%`;
    element.style.top = `${exit.y * 100}%`;
    element.classList.toggle('is-selected', this.latestState?.selectedToyId === toy.id);
  }

  private renderToyPanel(state: Readonly<AppState>): void {
    const selected = state.selectedToyId
      ? state.world.playgroundToys.find((toy) => toy.id === state.selectedToyId)
      : undefined;

    this.toyPanel.hidden = !selected;

    if (!selected) {
      return;
    }

    this.toyPanelName.textContent = playgroundToyLabel(selected.type);

    const help = this.toyPanel.querySelector<HTMLElement>('[data-toy-help]');
    if (help) {
      help.textContent = selected.type === 'portal'
        ? 'Drag IN or OUT'
        : playgroundToyDescription(selected.type);
    }
  }

  private renderToyPalette(state: Readonly<AppState>): void {
    this.toyPalette.hidden = !state.toyPaletteOpen;
    this.toysButton.disabled = state.world.playgroundToys.length >= MAX_PLAYGROUND_TOYS;

    if (!state.toyPaletteOpen) {
      return;
    }

    const container = this.toyPalette.querySelector<HTMLElement>('[data-toy-choices]');
    if (!container) {
      return;
    }

    container.replaceChildren();
    const existing = new Set(state.world.playgroundToys.map((toy) => toy.type));

    for (const type of TOY_TYPES) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'toy-choice';
      button.dataset.toyType = type;
      button.disabled = existing.has(type);
      button.innerHTML = `
        <span class="toy-choice-art" aria-hidden="true"></span>
        <span class="toy-choice-copy">
          <strong>${playgroundToyLabel(type)}</strong>
          <small>${existing.has(type) ? 'Already in this World' : playgroundToyDescription(type)}</small>
        </span>
      `;
      button.addEventListener('click', () => this.callbacks.onAddToy(type));
      container.append(button);
    }
  }

  private toyFromState(toyId: string): PlaygroundToyDocument | undefined {
    return this.latestState?.world.playgroundToys.find((toy) => toy.id === toyId);
  }

  private positionFromPointer(event: PointerEvent): NormalizedPoint {
    const rect = this.canvas.getBoundingClientRect();

    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
  }
}
