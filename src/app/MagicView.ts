import {
  type MagicIntent,
  type MagicStrength,
  type MagicTarget,
} from '../core/world/Magic';
import { effectFieldLabel } from '../core/world/EffectField';
import { playgroundToyLabel } from '../core/world/PlaygroundToy';
import { soundById } from '../core/sounds/coreCatalog';
import type { AppState } from './state';
import { ModalFocusController } from './ModalFocusController';

export interface MagicViewCallbacks {
  readonly onOpenRemix: () => void;
  readonly onCloseRemix: () => void;
  readonly onStartRemix: (intent: MagicIntent) => void;
  readonly onRetry: () => void;
  readonly onKeep: () => void;
  readonly onRevert: () => void;
  readonly onStrength: (strength: MagicStrength) => void;
  readonly onUndo: () => void;
}

const INTENTS: readonly {
  readonly id: MagicIntent;
  readonly label: string;
  readonly description: string;
}[] = [
  { id: 'surprise', label: 'Surprise Me', description: 'A balanced fresh variation' },
  { id: 'more-energy', label: 'More Energy', description: 'Brighter, busier and more active' },
  { id: 'calmer', label: 'Calmer', description: 'Softer, slower and more spacious' },
  { id: 'stranger', label: 'Stranger', description: 'Push the World somewhere unusual' },
  { id: 'simpler', label: 'Simpler', description: 'Fewer events and calmer movement' },
  { id: 'busier', label: 'Busier', description: 'More notes, hits and motion' },
];

const STRENGTHS: readonly {
  readonly id: MagicStrength;
  readonly label: string;
}[] = [
  { id: 'gentle', label: 'Gentle' },
  { id: 'playful', label: 'Playful' },
  { id: 'wild', label: 'Wild' },
];

function intentLabel(intent: MagicIntent): string {
  return INTENTS.find((item) => item.id === intent)?.label ?? 'Magic';
}

function targetLabel(
  state: Readonly<AppState>,
  target: MagicTarget,
): string {
  switch (target.kind) {
    case 'world':
      return 'World Remix';

    case 'orb': {
      const orb = state.world.soundOrbs.find(
        (candidate) => candidate.id === target.id,
      );
      return orb
        ? soundById(orb.soundId)?.name ?? orb.role
        : 'Sound';
    }

    case 'field': {
      const field = state.world.effectFields.find(
        (candidate) => candidate.id === target.id,
      );
      return field ? effectFieldLabel(field.type) : 'Effect Field';
    }

    case 'toy': {
      const toy = state.world.playgroundToys.find(
        (candidate) => candidate.id === target.id,
      );
      return toy ? playgroundToyLabel(toy.type) : 'Playground Toy';
    }
  }
}

export class MagicView {
  private readonly shell: HTMLElement;
  private readonly remixButton: HTMLButtonElement;
  private readonly intentBackdrop: HTMLElement;
  private readonly intentFocus: ModalFocusController;
  private readonly previewBar: HTMLElement;
  private readonly previewTitle: HTMLElement;
  private readonly previewSummary: HTMLElement;
  private readonly strengthOptions: HTMLElement;
  private readonly undoButton: HTMLButtonElement;

  public constructor(
    root: HTMLElement,
    private readonly callbacks: MagicViewCallbacks,
  ) {
    const dock = root.querySelector<HTMLElement>('.playground-dock');
    const shell = root.querySelector<HTMLElement>('.playground-shell');

    if (!dock || !shell) {
      throw new Error('Magic view requires the playground shell.');
    }

    this.shell = shell;

    const remixButton = document.createElement('button');
    remixButton.type = 'button';
    remixButton.className = 'remix-button';
    remixButton.innerHTML = '<span aria-hidden="true">✦</span> Remix';
    remixButton.setAttribute('aria-haspopup', 'dialog');
    remixButton.setAttribute('aria-expanded', 'false');
    remixButton.addEventListener('click', callbacks.onOpenRemix);
    dock.append(remixButton);
    this.remixButton = remixButton;

    const intentBackdrop = document.createElement('div');
    intentBackdrop.className = 'magic-intent-backdrop';
    intentBackdrop.hidden = true;
    intentBackdrop.innerHTML = `
      <section class="magic-intent-sheet" role="dialog" aria-modal="true" aria-labelledby="magic-intent-title">
        <header class="magic-intent-header">
          <div>
            <span>Remix this World</span>
            <h2 id="magic-intent-title">Which direction?</h2>
            <p>Loop keeps the same World, then bends it in that direction.</p>
          </div>
          <button class="magic-intent-close" type="button" data-magic-intent-close aria-label="Close Remix">×</button>
        </header>
        <div class="magic-intent-grid" data-magic-intents></div>
      </section>
    `;
    shell.append(intentBackdrop);
    this.intentBackdrop = intentBackdrop;
    this.intentFocus = new ModalFocusController(intentBackdrop, {
      onEscape: callbacks.onCloseRemix,
      initialFocusSelector: '[data-magic-intent-close]',
    });

    const intentGrid = intentBackdrop.querySelector<HTMLElement>('[data-magic-intents]');
    if (!intentGrid) {
      throw new Error('Magic intent grid failed to mount.');
    }

    intentBackdrop
      .querySelector<HTMLButtonElement>('[data-magic-intent-close]')
      ?.addEventListener('click', callbacks.onCloseRemix);

    intentBackdrop.addEventListener('pointerdown', (event) => {
      if (event.target === intentBackdrop) {
        callbacks.onCloseRemix();
      }
    });

    for (const intent of INTENTS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'magic-intent-choice';
      button.dataset.magicIntent = intent.id;
      button.innerHTML = `
        <span class="magic-intent-art" aria-hidden="true">✦</span>
        <span class="magic-intent-copy">
          <strong>${intent.label}</strong>
          <small>${intent.description}</small>
        </span>
      `;
      button.addEventListener('click', () => callbacks.onStartRemix(intent.id));
      intentGrid.append(button);
    }

    const previewBar = document.createElement('aside');
    previewBar.className = 'magic-preview-bar';
    previewBar.hidden = true;
    previewBar.innerHTML = `
      <div class="magic-preview-copy" role="status" aria-live="polite" aria-atomic="true">
        <span>Magic preview</span>
        <strong data-magic-preview-title>Magic</strong>
        <small data-magic-preview-summary>Variation ready</small>
      </div>
      <div class="magic-strength-options" data-magic-strengths role="group" aria-label="Magic strength"></div>
      <div class="magic-preview-actions">
        <button type="button" data-magic-revert>Revert</button>
        <button type="button" data-magic-retry><span aria-hidden="true">↻</span> Retry</button>
        <button class="magic-keep" type="button" data-magic-keep>Keep</button>
      </div>
    `;
    shell.append(previewBar);
    this.previewBar = previewBar;

    const previewTitle = previewBar.querySelector<HTMLElement>('[data-magic-preview-title]');
    const previewSummary = previewBar.querySelector<HTMLElement>('[data-magic-preview-summary]');
    const strengthOptions = previewBar.querySelector<HTMLElement>('[data-magic-strengths]');

    if (!previewTitle || !previewSummary || !strengthOptions) {
      throw new Error('Magic preview bar failed to mount.');
    }

    this.previewTitle = previewTitle;
    this.previewSummary = previewSummary;
    this.strengthOptions = strengthOptions;

    previewBar.querySelector<HTMLButtonElement>('[data-magic-revert]')?.addEventListener(
      'click',
      callbacks.onRevert,
    );
    previewBar.querySelector<HTMLButtonElement>('[data-magic-retry]')?.addEventListener(
      'click',
      callbacks.onRetry,
    );
    previewBar.querySelector<HTMLButtonElement>('[data-magic-keep]')?.addEventListener(
      'click',
      callbacks.onKeep,
    );

    const undoButton = document.createElement('button');
    undoButton.type = 'button';
    undoButton.className = 'magic-undo-button';
    undoButton.hidden = true;
    undoButton.innerHTML = '<span aria-hidden="true">↶</span> Undo Magic';
    undoButton.addEventListener('click', callbacks.onUndo);
    shell.append(undoButton);
    this.undoButton = undoButton;
  }

  public render(state: Readonly<AppState>): void {
    this.intentBackdrop.hidden = !state.magicIntentOpen;
    this.remixButton.setAttribute('aria-expanded', String(state.magicIntentOpen));
    this.intentFocus.sync(state.magicIntentOpen);
    this.shell.classList.toggle(
      'magic-preview-active',
      Boolean(state.magicSession),
    );

    const session = state.magicSession;
    this.previewBar.hidden = !session;

    if (session) {
      this.previewTitle.textContent = session.target.kind === 'world'
        ? intentLabel(session.intent)
        : `✦ ${targetLabel(state, session.target)}`;
      this.previewSummary.textContent =
        `${session.summary} · attempt ${session.attempt + 1}`;
      this.renderStrengths(session.strength);
    }

    const canUndo = Boolean(
      state.magicUndo
      && state.world === state.magicUndo.afterWorld
      && !state.magicSession,
    );
    this.undoButton.hidden = !canUndo;
    this.remixButton.disabled = Boolean(state.magicSession);
  }

  public destroy(): void {
    this.intentFocus.destroy();
    this.shell.classList.remove('magic-preview-active');
    this.remixButton.remove();
    this.intentBackdrop.remove();
    this.previewBar.remove();
    this.undoButton.remove();
  }

  private renderStrengths(selected: MagicStrength): void {
    this.strengthOptions.replaceChildren();

    for (const strength of STRENGTHS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = strength.label;
      button.classList.toggle('is-active', strength.id === selected);
      button.setAttribute('aria-pressed', String(strength.id === selected));
      button.addEventListener('click', () => {
        this.callbacks.onStrength(strength.id);
      });
      this.strengthOptions.append(button);
    }
  }
}
