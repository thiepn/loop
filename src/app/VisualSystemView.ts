import {
  type VisualQuality,
} from '../core/visual/VisualQuality';
import type { AppState } from './state';
import { ModalFocusController } from './ModalFocusController';

export interface VisualSystemCallbacks {
  readonly onOpenSettings: () => void;
  readonly onCloseSettings: () => void;
  readonly onQuality: (quality: VisualQuality) => void;
  readonly onReduceMotion: (value: boolean) => void;
  readonly onReduceParticles: (value: boolean) => void;
  readonly onReduceBloom: (value: boolean) => void;
}

export class VisualSystemView {
  private readonly shell: HTMLElement;
  private readonly settingsButton: HTMLButtonElement;
  private readonly settingsBackdrop: HTMLElement;
  private readonly settingsFocus: ModalFocusController;
  private readonly qualityButtons = new Map<VisualQuality, HTMLButtonElement>();
  private readonly reduceMotionInput: HTMLInputElement;
  private readonly reduceParticlesInput: HTMLInputElement;
  private readonly reduceBloomInput: HTMLInputElement;
  private readonly systemMotionNote: HTMLElement;

  public constructor(
    root: HTMLElement,
    callbacks: VisualSystemCallbacks,
  ) {
    const shell = root.querySelector<HTMLElement>('.playground-shell');
    const topbarActions = root.querySelector<HTMLElement>('[data-topbar-actions]');
    const playButton = topbarActions?.querySelector<HTMLElement>('[data-play]');

    if (!shell || !topbarActions || !playButton) {
      throw new Error('Visual system requires the playground shell.');
    }

    this.shell = shell;

    const settingsButton = document.createElement('button');
    settingsButton.type = 'button';
    settingsButton.className = 'visual-settings-button';
    settingsButton.setAttribute('aria-label', 'Visual settings');
    settingsButton.setAttribute('aria-haspopup', 'dialog');
    settingsButton.setAttribute('aria-expanded', 'false');
    settingsButton.title = 'Visual settings';
    settingsButton.innerHTML = '<span aria-hidden="true">✺</span>';
    settingsButton.addEventListener('click', callbacks.onOpenSettings);
    topbarActions.insertBefore(settingsButton, playButton);
    this.settingsButton = settingsButton;

    const settingsBackdrop = document.createElement('div');
    settingsBackdrop.className = 'visual-settings-backdrop';
    settingsBackdrop.hidden = true;
    settingsBackdrop.innerHTML = `
      <section class="visual-settings-sheet" role="dialog" aria-modal="true" aria-labelledby="visual-settings-title">
        <header class="visual-settings-header">
          <div>
            <span>Visual experience</span>
            <h2 id="visual-settings-title">How alive should Loop feel?</h2>
            <p>These settings only change visuals. Audio stays exactly the same.</p>
          </div>
          <button class="visual-settings-close" type="button" data-visual-close aria-label="Close visual settings">×</button>
        </header>

        <div class="visual-quality-grid" data-visual-quality role="group" aria-label="Visual quality"></div>

        <div class="visual-accessibility-list">
          <label>
            <span>
              <strong>Reduce motion</strong>
              <small>Keep state feedback, remove travel-heavy animation</small>
              <small id="visual-system-motion-note" data-system-motion-note hidden>Enabled by your system accessibility setting</small>
            </span>
            <input type="checkbox" data-reduce-motion aria-describedby="visual-system-motion-note" />
          </label>

          <label>
            <span>
              <strong>Reduce particles</strong>
              <small>Remove ambient and burst particles</small>
            </span>
            <input type="checkbox" data-reduce-particles />
          </label>

          <label>
            <span>
              <strong>Reduce glow</strong>
              <small>Lower bloom and luminous depth</small>
            </span>
            <input type="checkbox" data-reduce-bloom />
          </label>
        </div>
      </section>
    `;
    shell.append(settingsBackdrop);
    this.settingsBackdrop = settingsBackdrop;
    this.settingsFocus = new ModalFocusController(settingsBackdrop, {
      onEscape: callbacks.onCloseSettings,
      initialFocusSelector: '[data-visual-close]',
    });

    const qualityGrid = settingsBackdrop.querySelector<HTMLElement>(
      '[data-visual-quality]',
    );
    const reduceMotionInput = settingsBackdrop.querySelector<HTMLInputElement>(
      '[data-reduce-motion]',
    );
    const reduceParticlesInput = settingsBackdrop.querySelector<HTMLInputElement>(
      '[data-reduce-particles]',
    );
    const reduceBloomInput = settingsBackdrop.querySelector<HTMLInputElement>(
      '[data-reduce-bloom]',
    );
    const systemMotionNote = settingsBackdrop.querySelector<HTMLElement>(
      '[data-system-motion-note]',
    );

    if (
      !qualityGrid
      || !reduceMotionInput
      || !reduceParticlesInput
      || !reduceBloomInput
      || !systemMotionNote
    ) {
      throw new Error('Visual settings failed to mount.');
    }

    this.reduceMotionInput = reduceMotionInput;
    this.reduceParticlesInput = reduceParticlesInput;
    this.reduceBloomInput = reduceBloomInput;
    this.systemMotionNote = systemMotionNote;

    const qualityChoices: readonly {
      readonly id: VisualQuality;
      readonly label: string;
      readonly description: string;
    }[] = [
      {
        id: 'high',
        label: 'High',
        description: 'Longer trails, more particles and bloom',
      },
      {
        id: 'balanced',
        label: 'Balanced',
        description: 'The default mix of detail and efficiency',
      },
      {
        id: 'battery',
        label: 'Battery Saver',
        description: 'Minimal extras, same musical interaction',
      },
    ];

    for (const choice of qualityChoices) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'visual-quality-choice';
      button.dataset.visualQuality = choice.id;
      button.innerHTML = `
        <span class="visual-quality-art" aria-hidden="true"></span>
        <span>
          <strong>${choice.label}</strong>
          <small>${choice.description}</small>
        </span>
      `;
      button.addEventListener('click', () => callbacks.onQuality(choice.id));
      qualityGrid.append(button);
      this.qualityButtons.set(choice.id, button);
    }

    settingsBackdrop.querySelector<HTMLButtonElement>(
      '[data-visual-close]',
    )?.addEventListener('click', callbacks.onCloseSettings);

    settingsBackdrop.addEventListener('pointerdown', (event) => {
      if (event.target === settingsBackdrop) {
        callbacks.onCloseSettings();
      }
    });

    reduceMotionInput.addEventListener('change', () => {
      callbacks.onReduceMotion(reduceMotionInput.checked);
    });
    reduceParticlesInput.addEventListener('change', () => {
      callbacks.onReduceParticles(reduceParticlesInput.checked);
    });
    reduceBloomInput.addEventListener('change', () => {
      callbacks.onReduceBloom(reduceBloomInput.checked);
    });
  }

  public render(state: Readonly<AppState>): void {
    this.shell.dataset.visualQuality = state.visualQuality;
    this.shell.dataset.reduceMotion = String(state.visualReduceMotion);
    this.shell.dataset.reduceParticles = String(state.visualReduceParticles);
    this.shell.dataset.reduceBloom = String(state.visualReduceBloom);

    this.settingsBackdrop.hidden = !state.visualSettingsOpen;
    this.settingsFocus.sync(state.visualSettingsOpen);
    this.settingsButton.setAttribute(
      'aria-expanded',
      String(state.visualSettingsOpen),
    );

    for (const [quality, button] of this.qualityButtons) {
      const selected = state.visualQuality === quality;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    }

    this.reduceMotionInput.checked = state.visualReduceMotion;
    this.reduceMotionInput.disabled = state.visualSystemReduceMotion;
    this.systemMotionNote.hidden = !state.visualSystemReduceMotion;
    this.reduceParticlesInput.checked = state.visualReduceParticles;
    this.reduceBloomInput.checked = state.visualReduceBloom;
  }

  public destroy(): void {
    this.settingsFocus.destroy();
    this.settingsButton.remove();
    this.settingsBackdrop.remove();
  }
}
