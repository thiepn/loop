import {
  SOUND_PALETTE_CATEGORIES,
  soundsForCategory,
  type SoundPaletteCategoryId,
} from '../core/sounds/SoundPalette';
import { soundById } from '../core/sounds/coreCatalog';
import { patternKindForRole } from '../core/music/Pattern';
import { clampPoint, type NormalizedPoint, type SoundOrbDocument } from '../core/world/SoundOrb';
import type { AppState } from './state';

export interface PlaygroundCallbacks {
  readonly onTogglePlayback: () => void;
  readonly onOpenHome: () => void;
  readonly onSelectOrb: (orbId: string | null) => void;
  readonly onMovePreview: (orbId: string, position: NormalizedPoint) => void;
  readonly onMoveCommit: (orbId: string, position: NormalizedPoint) => void;
  readonly onToggleMute: (orbId: string) => void;
  readonly onDuplicate: (orbId: string) => void;
  readonly onDelete: (orbId: string) => void;
  readonly onOpenAdd: () => void;
  readonly onOpenChange: (orbId: string) => void;
  readonly onOpenPattern: (orbId: string) => void;
  readonly onClosePalette: () => void;
  readonly onSelectPaletteCategory: (category: SoundPaletteCategoryId) => void;
  readonly onChooseSound: (soundId: string) => void;
  readonly onSurpriseSound: () => void;
  readonly onSkipOnboarding: () => void;
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

function onboardingCopy(step: AppState['onboardingStep']): string {
  switch (step) {
    case 'move':
      return '1 of 3 · Drag any sound';
    case 'near':
      return '2 of 3 · Bring it closer to YOU';
    case 'add':
      return '3 of 3 · Add something new';
    case 'done':
      return '';
  }
}

export class PlaygroundView {
  private readonly orbElements = new Map<string, HTMLButtonElement>();
  private readonly canvas: HTMLElement;
  private readonly playButton: HTMLButtonElement;
  private readonly status: HTMLElement;
  private readonly worldName: HTMLElement;
  private readonly tempo: HTMLElement;
  private readonly selectedPanel: HTMLElement;
  private readonly selectedName: HTMLElement;
  private readonly selectedRole: HTMLElement;
  private readonly muteButton: HTMLButtonElement;
  private readonly patternButton: HTMLButtonElement;
  private readonly addButton: HTMLButtonElement;
  private readonly palette: HTMLElement;
  private readonly paletteTitle: HTMLElement;
  private readonly paletteCategories: HTMLElement;
  private readonly paletteSounds: HTMLElement;
  private readonly onboarding: HTMLElement;
  private readonly onboardingText: HTMLElement;
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
          <button class="brand brand-button" type="button" data-home aria-label="Choose another World">
            <span class="brand-mark" aria-hidden="true"><span></span></span>
            <span>Loop</span>
          </button>

          <div class="world-heading">
            <strong data-world-name>World</strong>
            <span data-tempo>108 BPM</span>
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
          <div class="listener-core" data-listener aria-label="You are here">
            <span class="listener-dot"></span>
            <small>YOU</small>
          </div>
          <div class="orb-layer" data-orb-layer></div>

          <p class="world-hint" data-status aria-live="polite"></p>

          <div class="onboarding-tip" data-onboarding hidden>
            <span data-onboarding-text></span>
            <button type="button" data-skip-onboarding>Skip</button>
          </div>

          <div class="playground-dock">
            <button class="add-sound-button" type="button" data-add>
              <span aria-hidden="true">＋</span>
              Add
            </button>
          </div>
        </section>

        <aside class="selection-panel" data-selection hidden>
          <div class="selection-copy">
            <span data-selected-role>Sound</span>
            <strong data-selected-name>Sound</strong>
          </div>
          <div class="selection-actions">
            <button type="button" data-action="pattern">Shape</button>
            <button type="button" data-action="change">Change</button>
            <button type="button" data-action="mute">Mute</button>
            <button type="button" data-action="duplicate">Duplicate</button>
            <button class="danger-action" type="button" data-action="delete">Delete</button>
          </div>
        </aside>

        <div class="palette-backdrop" data-palette hidden>
          <section class="palette-sheet" role="dialog" aria-modal="true" aria-labelledby="palette-title">
            <header class="palette-header">
              <div>
                <span>Sound palette</span>
                <h2 id="palette-title" data-palette-title>Add something</h2>
              </div>
              <button class="palette-close" type="button" data-close-palette aria-label="Close sound palette">×</button>
            </header>

            <div class="palette-categories" data-palette-categories></div>

            <button class="surprise-sound" type="button" data-surprise-sound>
              <span aria-hidden="true">✦</span>
              <strong>Surprise Me</strong>
              <small>Choose something that fits</small>
            </button>

            <div class="palette-sounds" data-palette-sounds></div>
          </section>
        </div>
      </main>
    `;

    const canvas = root.querySelector<HTMLElement>('[data-canvas]');
    const playButton = root.querySelector<HTMLButtonElement>('[data-play]');
    const status = root.querySelector<HTMLElement>('[data-status]');
    const worldName = root.querySelector<HTMLElement>('[data-world-name]');
    const tempo = root.querySelector<HTMLElement>('[data-tempo]');
    const selectedPanel = root.querySelector<HTMLElement>('[data-selection]');
    const selectedName = root.querySelector<HTMLElement>('[data-selected-name]');
    const selectedRole = root.querySelector<HTMLElement>('[data-selected-role]');
    const muteButton = root.querySelector<HTMLButtonElement>('[data-action="mute"]');
    const patternButton = root.querySelector<HTMLButtonElement>('[data-action="pattern"]');
    const addButton = root.querySelector<HTMLButtonElement>('[data-add]');
    const palette = root.querySelector<HTMLElement>('[data-palette]');
    const paletteTitle = root.querySelector<HTMLElement>('[data-palette-title]');
    const paletteCategories = root.querySelector<HTMLElement>('[data-palette-categories]');
    const paletteSounds = root.querySelector<HTMLElement>('[data-palette-sounds]');
    const onboarding = root.querySelector<HTMLElement>('[data-onboarding]');
    const onboardingText = root.querySelector<HTMLElement>('[data-onboarding-text]');

    if (
      !canvas ||
      !playButton ||
      !status ||
      !worldName ||
      !tempo ||
      !selectedPanel ||
      !selectedName ||
      !selectedRole ||
      !muteButton ||
      !patternButton ||
      !addButton ||
      !palette ||
      !paletteTitle ||
      !paletteCategories ||
      !paletteSounds ||
      !onboarding ||
      !onboardingText
    ) {
      throw new Error('Playground view failed to mount required controls.');
    }

    this.canvas = canvas;
    this.playButton = playButton;
    this.status = status;
    this.worldName = worldName;
    this.tempo = tempo;
    this.selectedPanel = selectedPanel;
    this.selectedName = selectedName;
    this.selectedRole = selectedRole;
    this.muteButton = muteButton;
    this.patternButton = patternButton;
    this.addButton = addButton;
    this.palette = palette;
    this.paletteTitle = paletteTitle;
    this.paletteCategories = paletteCategories;
    this.paletteSounds = paletteSounds;
    this.onboarding = onboarding;
    this.onboardingText = onboardingText;

    root.querySelector<HTMLButtonElement>('[data-home]')?.addEventListener('click', () => callbacks.onOpenHome());
    this.playButton.addEventListener('click', () => callbacks.onTogglePlayback());
    this.addButton.addEventListener('click', () => callbacks.onOpenAdd());

    this.canvas.addEventListener('pointerdown', (event) => {
      if (event.target === this.canvas || (event.target as HTMLElement).classList.contains('world-grid')) {
        callbacks.onSelectOrb(null);
      }
    });

    this.patternButton.addEventListener('click', () => {
      const selected = this.selectedOrbId();
      if (selected) {
        callbacks.onOpenPattern(selected);
      }
    });

    root.querySelector<HTMLButtonElement>('[data-action="change"]')?.addEventListener('click', () => {
      const selected = this.selectedOrbId();
      if (selected) {
        callbacks.onOpenChange(selected);
      }
    });

    root.querySelector<HTMLButtonElement>('[data-action="mute"]')?.addEventListener('click', () => {
      const selected = this.selectedOrbId();
      if (selected) {
        callbacks.onToggleMute(selected);
      }
    });

    root.querySelector<HTMLButtonElement>('[data-action="duplicate"]')?.addEventListener('click', () => {
      const selected = this.selectedOrbId();
      if (selected) {
        callbacks.onDuplicate(selected);
      }
    });

    root.querySelector<HTMLButtonElement>('[data-action="delete"]')?.addEventListener('click', () => {
      const selected = this.selectedOrbId();
      if (selected) {
        callbacks.onDelete(selected);
      }
    });

    root.querySelector<HTMLButtonElement>('[data-close-palette]')?.addEventListener('click', () => callbacks.onClosePalette());
    root.querySelector<HTMLButtonElement>('[data-surprise-sound]')?.addEventListener('click', () => callbacks.onSurpriseSound());
    root.querySelector<HTMLButtonElement>('[data-skip-onboarding]')?.addEventListener('click', () => callbacks.onSkipOnboarding());

    this.palette.addEventListener('pointerdown', (event) => {
      if (event.target === this.palette) {
        callbacks.onClosePalette();
      }
    });
  }

  public render(state: Readonly<AppState>): void {
    this.root.dataset.selectedOrbId = state.selectedOrbId ?? '';
    this.worldName.textContent = state.world.name;
    this.tempo.textContent = `${state.world.music.bpm} BPM`;
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
    this.renderPalette(state);
    this.renderOnboarding(state);
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
    this.patternButton.hidden = patternKindForRole(selected.role) === null;
  }

  private renderPalette(state: Readonly<AppState>): void {
    const paletteState = state.palette;
    this.palette.hidden = paletteState === null;

    if (!paletteState) {
      return;
    }

    this.paletteTitle.textContent = paletteState.mode === 'replace'
      ? 'Change this sound'
      : 'Add something';

    this.paletteCategories.replaceChildren();

    for (const category of SOUND_PALETTE_CATEGORIES) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'palette-category';
      button.classList.toggle('is-active', category.id === paletteState.category);
      button.textContent = category.name;
      button.title = category.description;
      button.addEventListener('click', () => this.callbacks.onSelectPaletteCategory(category.id));
      this.paletteCategories.append(button);
    }

    this.paletteSounds.replaceChildren();
    const currentSoundId = paletteState.mode === 'replace'
      ? state.world.soundOrbs.find((orb) => orb.id === paletteState.orbId)?.soundId
      : null;

    for (const sound of soundsForCategory(paletteState.category)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sound-choice';
      button.classList.toggle('is-current', sound.id === currentSoundId);
      button.innerHTML = `
        <span class="sound-choice-orb" data-role="${sound.role}" aria-hidden="true"></span>
        <span class="sound-choice-copy">
          <strong>${sound.name}</strong>
          <small>${sound.description}</small>
        </span>
      `;
      button.addEventListener('click', () => this.callbacks.onChooseSound(sound.id));
      this.paletteSounds.append(button);
    }
  }

  private renderOnboarding(state: Readonly<AppState>): void {
    const step = state.onboardingStep;
    this.onboarding.hidden = step === 'done';
    this.onboardingText.textContent = onboardingCopy(step);

    this.canvas.classList.toggle('onboarding-move', step === 'move');
    this.canvas.classList.toggle('onboarding-near', step === 'near');
    this.addButton.classList.toggle('onboarding-add', step === 'add');
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
