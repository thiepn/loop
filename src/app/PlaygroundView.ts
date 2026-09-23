import { soundById } from '../core/sounds/coreCatalog';
import { clampPoint, type NormalizedPoint, type SoundOrbDocument } from '../core/world/SoundOrb';
import type { AppState } from './state';

export interface PlaygroundCallbacks {
  readonly onTogglePlayback: () => void;
  readonly onSelectOrb: (orbId: string | null) => void;
  readonly onMovePreview: (orbId: string, position: NormalizedPoint) => void;
  readonly onMoveCommit: (orbId: string, position: NormalizedPoint) => void;
  readonly onToggleMute: (orbId: string) => void;
  readonly onDuplicate: (orbId: string) => void;
  readonly onDelete: (orbId: string) => void;
}

interface DragSession {
  readonly orbId: string;
  readonly pointerId: number;
  moved: boolean;
  lastPosition: NormalizedPoint;
}

function roleLabel(orb: SoundOrbDocument): string {
  switch (orb.role) {
    case 'beat':
      return 'Beat';
    case 'percussion':
      return 'Percussion';
    case 'bass':
      return 'Bass';
    case 'harmony':
      return 'Chords';
    case 'melody':
      return 'Melody';
    case 'texture':
      return 'Texture';
    case 'voice':
      return 'Voice';
  }
}

export class PlaygroundView {
  private readonly orbElements = new Map<string, HTMLButtonElement>();
  private readonly canvas: HTMLElement;
  private readonly playButton: HTMLButtonElement;
  private readonly status: HTMLElement;
  private readonly worldName: HTMLElement;
  private readonly selectedPanel: HTMLElement;
  private readonly selectedName: HTMLElement;
  private readonly selectedRole: HTMLElement;
  private readonly muteButton: HTMLButtonElement;
  private drag: DragSession | null = null;

  public constructor(
    private readonly root: HTMLElement,
    private readonly callbacks: PlaygroundCallbacks,
  ) {
    root.innerHTML = `
      <main class="playground-shell">
        <div class="world-glow world-glow-a" aria-hidden="true"></div>
        <div class="world-glow world-glow-b" aria-hidden="true"></div>

        <header class="playground-topbar">
          <a class="brand" href="${import.meta.env.BASE_URL}" aria-label="Loop home">
            <span class="brand-mark" aria-hidden="true"><span></span></span>
            <span>Loop</span>
          </a>

          <div class="world-heading">
            <strong data-world-name>First Orbit</strong>
            <span>108 BPM</span>
          </div>

          <button class="play-toggle" type="button" data-play aria-pressed="false">
            <span class="play-icon" aria-hidden="true">▶</span>
            <span data-play-label>Play</span>
          </button>
        </header>

        <section class="world-canvas" data-canvas aria-label="Musical playground">
          <div class="world-grid" aria-hidden="true"></div>
          <div class="listener-rings" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
          <div class="listener-core" aria-label="You are here">
            <span class="listener-dot"></span>
            <small>YOU</small>
          </div>
          <div class="orb-layer" data-orb-layer></div>

          <p class="world-hint" data-status aria-live="polite">Tap play, then move a sound.</p>
        </section>

        <aside class="selection-panel" data-selection hidden>
          <div class="selection-copy">
            <span data-selected-role>Sound</span>
            <strong data-selected-name>Sound</strong>
          </div>
          <div class="selection-actions">
            <button type="button" data-action="mute">Mute</button>
            <button type="button" data-action="duplicate">Duplicate</button>
            <button class="danger-action" type="button" data-action="delete">Delete</button>
          </div>
        </aside>
      </main>
    `;

    const canvas = root.querySelector<HTMLElement>('[data-canvas]');
    const playButton = root.querySelector<HTMLButtonElement>('[data-play]');
    const status = root.querySelector<HTMLElement>('[data-status]');
    const worldName = root.querySelector<HTMLElement>('[data-world-name]');
    const selectedPanel = root.querySelector<HTMLElement>('[data-selection]');
    const selectedName = root.querySelector<HTMLElement>('[data-selected-name]');
    const selectedRole = root.querySelector<HTMLElement>('[data-selected-role]');
    const muteButton = root.querySelector<HTMLButtonElement>('[data-action="mute"]');

    if (
      !canvas ||
      !playButton ||
      !status ||
      !worldName ||
      !selectedPanel ||
      !selectedName ||
      !selectedRole ||
      !muteButton
    ) {
      throw new Error('Playground view failed to mount required controls.');
    }

    this.canvas = canvas;
    this.playButton = playButton;
    this.status = status;
    this.worldName = worldName;
    this.selectedPanel = selectedPanel;
    this.selectedName = selectedName;
    this.selectedRole = selectedRole;
    this.muteButton = muteButton;

    this.playButton.addEventListener('click', () => this.callbacks.onTogglePlayback());

    this.canvas.addEventListener('pointerdown', (event) => {
      if (event.target === this.canvas || (event.target as HTMLElement).classList.contains('world-grid')) {
        this.callbacks.onSelectOrb(null);
      }
    });

    root.querySelector<HTMLButtonElement>('[data-action="mute"]')?.addEventListener('click', () => {
      const selected = this.selectedOrbId();
      if (selected) {
        this.callbacks.onToggleMute(selected);
      }
    });

    root.querySelector<HTMLButtonElement>('[data-action="duplicate"]')?.addEventListener('click', () => {
      const selected = this.selectedOrbId();
      if (selected) {
        this.callbacks.onDuplicate(selected);
      }
    });

    root.querySelector<HTMLButtonElement>('[data-action="delete"]')?.addEventListener('click', () => {
      const selected = this.selectedOrbId();
      if (selected) {
        this.callbacks.onDelete(selected);
      }
    });
  }

  public render(state: Readonly<AppState>): void {
    this.root.dataset.selectedOrbId = state.selectedOrbId ?? '';
    this.worldName.textContent = state.world.name;
    this.status.textContent = state.message;

    const playLabel = this.playButton.querySelector<HTMLElement>('[data-play-label]');
    const playIcon = this.playButton.querySelector<HTMLElement>('.play-icon');

    if (playLabel) {
      playLabel.textContent = state.playing ? 'Stop' : 'Play';
    }

    if (playIcon) {
      playIcon.textContent = state.playing ? '■' : '▶';
    }

    this.playButton.setAttribute('aria-pressed', String(state.playing));
    this.playButton.classList.toggle('is-playing', state.playing);

    this.syncOrbs(state);
    this.renderSelection(state);
  }

  public previewOrbPosition(orbId: string, position: NormalizedPoint): void {
    const element = this.orbElements.get(orbId);
    if (!element) {
      return;
    }

    const point = clampPoint(position);
    element.style.left = `${point.x * 100}%`;
    element.style.top = `${point.y * 100}%`;
    element.dataset.x = String(point.x);
    element.dataset.y = String(point.y);
  }

  public pulseOrb(orbId: string, intensity: number): void {
    const element = this.orbElements.get(orbId);
    const visual = element?.querySelector<HTMLElement>('.orb-visual');

    if (!visual || visual.matches(':active')) {
      return;
    }

    const amount = Math.min(1, Math.max(0.2, intensity));
    visual.animate(
      [
        { transform: 'scale(1)', filter: 'brightness(1)' },
        {
          transform: `scale(${1 + amount * 0.13})`,
          filter: `brightness(${1 + amount * 0.42})`,
          offset: 0.28,
        },
        { transform: 'scale(1)', filter: 'brightness(1)' },
      ],
      {
        duration: 220,
        easing: 'cubic-bezier(.2,.8,.2,1)',
      },
    );
  }

  public destroy(): void {
    this.drag = null;
    this.orbElements.clear();
    this.root.replaceChildren();
  }

  private syncOrbs(state: Readonly<AppState>): void {
    const layer = this.root.querySelector<HTMLElement>('[data-orb-layer]');
    if (!layer) {
      return;
    }

    const liveIds = new Set(state.world.soundOrbs.map((orb) => orb.id));

    for (const [orbId, element] of this.orbElements) {
      if (!liveIds.has(orbId)) {
        element.remove();
        this.orbElements.delete(orbId);
      }
    }

    for (const orb of state.world.soundOrbs) {
      let element = this.orbElements.get(orb.id);

      if (!element) {
        element = this.createOrbElement(orb);
        layer.append(element);
        this.orbElements.set(orb.id, element);
      }

      this.updateOrbElement(element, orb, state.selectedOrbId === orb.id);
    }
  }

  private createOrbElement(orb: SoundOrbDocument): HTMLButtonElement {
    const element = document.createElement('button');
    element.type = 'button';
    element.className = 'sound-orb';
    element.dataset.orbId = orb.id;
    element.innerHTML = `
      <span class="orb-visual" aria-hidden="true">
        <span class="orb-wave"></span>
        <span class="orb-core"></span>
        <span class="orb-particle orb-particle-a"></span>
        <span class="orb-particle orb-particle-b"></span>
        <span class="orb-particle orb-particle-c"></span>
      </span>
      <span class="orb-label"></span>
    `;

    element.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 && event.pointerType === 'mouse') {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      this.callbacks.onSelectOrb(orb.id);
      element.setPointerCapture(event.pointerId);

      const currentPosition = {
        x: Number.parseFloat(element.dataset.x ?? String(orb.position.x)),
        y: Number.parseFloat(element.dataset.y ?? String(orb.position.y)),
      };

      this.drag = {
        orbId: orb.id,
        pointerId: event.pointerId,
        moved: false,
        lastPosition: clampPoint(currentPosition),
      };
      element.classList.add('is-dragging');
    });

    element.addEventListener('pointermove', (event) => {
      if (!this.drag || this.drag.orbId !== orb.id || this.drag.pointerId !== event.pointerId) {
        return;
      }

      const position = this.positionFromPointer(event);
      this.drag.moved = true;
      this.drag.lastPosition = position;
      this.previewOrbPosition(orb.id, position);
      this.callbacks.onMovePreview(orb.id, position);
    });

    const finishDrag = (event: PointerEvent, cancelled: boolean) => {
      if (!this.drag || this.drag.orbId !== orb.id || this.drag.pointerId !== event.pointerId) {
        return;
      }

      const session = this.drag;
      const position = cancelled ? session.lastPosition : this.positionFromPointer(event);
      this.drag = null;
      element.classList.remove('is-dragging');

      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId);
      }

      if (session.moved) {
        this.previewOrbPosition(orb.id, position);
        this.callbacks.onMoveCommit(orb.id, position);
      }
    };

    element.addEventListener('pointerup', (event) => finishDrag(event, false));
    element.addEventListener('pointercancel', (event) => finishDrag(event, true));

    element.addEventListener('keydown', (event) => {
      const step = event.shiftKey ? 0.06 : 0.025;
      let dx = 0;
      let dy = 0;

      switch (event.key) {
        case 'ArrowLeft':
          dx = -step;
          break;
        case 'ArrowRight':
          dx = step;
          break;
        case 'ArrowUp':
          dy = -step;
          break;
        case 'ArrowDown':
          dy = step;
          break;
        default:
          return;
      }

      event.preventDefault();
      const current = {
        x: Number.parseFloat(element.dataset.x ?? '0.5'),
        y: Number.parseFloat(element.dataset.y ?? '0.5'),
      };
      const next = clampPoint({
        x: current.x + dx,
        y: current.y + dy,
      });

      this.previewOrbPosition(orb.id, next);
      this.callbacks.onMovePreview(orb.id, next);
      this.callbacks.onMoveCommit(orb.id, next);
    });

    return element;
  }

  private updateOrbElement(
    element: HTMLButtonElement,
    orb: SoundOrbDocument,
    selected: boolean,
  ): void {
    const sound = soundById(orb.soundId);
    const label = element.querySelector<HTMLElement>('.orb-label');

    element.dataset.role = orb.role;
    element.dataset.x = String(orb.position.x);
    element.dataset.y = String(orb.position.y);
    element.style.left = `${orb.position.x * 100}%`;
    element.style.top = `${orb.position.y * 100}%`;
    element.classList.toggle('is-selected', selected);
    element.classList.toggle('is-muted', orb.muted);
    element.setAttribute(
      'aria-label',
      `${sound?.name ?? roleLabel(orb)}. ${orb.muted ? 'Muted. ' : ''}Drag to move sound.`,
    );
    element.setAttribute('aria-pressed', String(selected));

    if (label) {
      label.textContent = sound?.name ?? roleLabel(orb);
    }
  }

  private renderSelection(state: Readonly<AppState>): void {
    const selected = state.world.soundOrbs.find((orb) => orb.id === state.selectedOrbId);

    if (!selected) {
      this.selectedPanel.hidden = true;
      return;
    }

    const sound = soundById(selected.soundId);

    this.selectedPanel.hidden = false;
    this.selectedName.textContent = sound?.name ?? roleLabel(selected);
    this.selectedRole.textContent = roleLabel(selected);
    this.muteButton.textContent = selected.muted ? 'Unmute' : 'Mute';
  }

  private selectedOrbId(): string | null {
    return this.root.dataset.selectedOrbId || null;
  }

  private positionFromPointer(event: PointerEvent): NormalizedPoint {
    const rect = this.canvas.getBoundingClientRect();

    return clampPoint({
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    });
  }
}
