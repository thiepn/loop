import {
  densityForPattern,
  effectivePattern,
  MELODY_ROWS,
  PATTERN_STEPS,
  type DensityLevel,
  type GrooveFeel,
} from '../core/music/Pattern';
import { soundById } from '../core/sounds/coreCatalog';
import type { AppState } from './state';
import { ModalFocusController } from './ModalFocusController';

export interface PatternEditorCallbacks {
  readonly onClose: () => void;
  readonly onPaintRhythm: (orbId: string, step: number, active: boolean) => void;
  readonly onPaintMelody: (orbId: string, step: number, degree: number | null) => void;
  readonly onDensity: (orbId: string, density: DensityLevel) => void;
  readonly onGroove: (orbId: string, groove: GrooveFeel) => void;
  readonly onClear: (orbId: string) => void;
  readonly onVary: (orbId: string) => void;
}

type PaintSession =
  | {
      readonly kind: 'rhythm';
      readonly orbId: string;
      readonly active: boolean;
      lastKey: string;
    }
  | {
      readonly kind: 'melody';
      readonly orbId: string;
      readonly erase: boolean;
      lastKey: string;
    };

function pitchLabel(degree: number): string {
  if (degree === MELODY_ROWS - 1) {
    return 'High';
  }

  if (degree === 0) {
    return 'Low';
  }

  return '';
}

export class PatternEditorView {
  private readonly backdrop: HTMLElement;
  private readonly modalFocus: ModalFocusController;
  private readonly title: HTMLElement;
  private readonly subtitle: HTMLElement;
  private readonly grid: HTMLElement;
  private readonly densityControls: HTMLElement;
  private readonly grooveControls: HTMLElement;
  private paintSession: PaintSession | null = null;

  public constructor(
    private readonly root: HTMLElement,
    private readonly callbacks: PatternEditorCallbacks,
  ) {
    const backdrop = document.createElement('div');
    backdrop.className = 'pattern-backdrop';
    backdrop.hidden = true;
    backdrop.innerHTML = `
      <section class="pattern-sheet" role="dialog" aria-modal="true" aria-labelledby="pattern-title">
        <header class="pattern-header">
          <div>
            <span class="pattern-kicker">Make it yours</span>
            <h2 id="pattern-title" data-pattern-title>Pattern</h2>
            <p data-pattern-subtitle></p>
          </div>
          <button class="pattern-close" type="button" data-pattern-close aria-label="Close pattern editor">×</button>
        </header>

        <div class="pattern-grid-wrap">
          <div class="pattern-grid" data-pattern-grid></div>
        </div>

        <div class="pattern-macros">
          <div class="macro-group">
            <span>Amount</span>
            <div class="macro-options" data-density></div>
          </div>
          <div class="macro-group">
            <span>Feel</span>
            <div class="macro-options" data-groove></div>
          </div>
        </div>

        <footer class="pattern-footer">
          <button type="button" data-pattern-clear>Clear</button>
          <button class="pattern-vary" type="button" data-pattern-vary>
            <span aria-hidden="true">✦</span>
            Try another
          </button>
        </footer>
      </section>
    `;

    root.append(backdrop);

    const title = backdrop.querySelector<HTMLElement>('[data-pattern-title]');
    const subtitle = backdrop.querySelector<HTMLElement>('[data-pattern-subtitle]');
    const grid = backdrop.querySelector<HTMLElement>('[data-pattern-grid]');
    const densityControls = backdrop.querySelector<HTMLElement>('[data-density]');
    const grooveControls = backdrop.querySelector<HTMLElement>('[data-groove]');

    if (!title || !subtitle || !grid || !densityControls || !grooveControls) {
      throw new Error('Pattern editor failed to mount.');
    }

    this.backdrop = backdrop;
    this.modalFocus = new ModalFocusController(backdrop, {
      onEscape: callbacks.onClose,
      initialFocusSelector: '[data-pattern-close]',
    });
    this.title = title;
    this.subtitle = subtitle;
    this.grid = grid;
    this.densityControls = densityControls;
    this.grooveControls = grooveControls;

    backdrop.querySelector<HTMLButtonElement>('[data-pattern-close]')?.addEventListener('click', callbacks.onClose);
    backdrop.querySelector<HTMLButtonElement>('[data-pattern-clear]')?.addEventListener('click', () => {
      const orbId = this.currentOrbId();
      if (orbId) {
        callbacks.onClear(orbId);
      }
    });
    backdrop.querySelector<HTMLButtonElement>('[data-pattern-vary]')?.addEventListener('click', () => {
      const orbId = this.currentOrbId();
      if (orbId) {
        callbacks.onVary(orbId);
      }
    });

    backdrop.addEventListener('pointerdown', (event) => {
      if (event.target === backdrop) {
        callbacks.onClose();
      }
    });

    this.grid.addEventListener('pointerdown', (event) => this.beginPaint(event));
    this.grid.addEventListener('pointermove', (event) => this.continuePaint(event));
    this.grid.addEventListener('pointerup', () => this.endPaint());
    this.grid.addEventListener('pointercancel', () => this.endPaint());
  }

  public render(state: Readonly<AppState>): void {
    const orbId = state.patternEditorOrbId;
    const orb = orbId
      ? state.world.soundOrbs.find((candidate) => candidate.id === orbId)
      : undefined;
    const sound = orb ? soundById(orb.soundId) : undefined;
    const pattern = orb && sound ? effectivePattern(orb.pattern, sound) : null;

    this.root.dataset.patternOrbId = orbId ?? '';
    const open = Boolean(orb && sound && pattern);
    this.backdrop.hidden = !open;
    this.modalFocus.sync(open);

    if (!orb || !sound || !pattern) {
      this.paintSession = null;
      return;
    }

    this.title.textContent = sound.name;
    this.subtitle.textContent = pattern.kind === 'rhythm'
      ? 'Tap or drag across the row to shape the beat.'
      : 'Paint a shape. Every dot stays in tune.';

    if (pattern.kind === 'rhythm') {
      this.renderRhythm(pattern.steps);
    } else {
      this.renderMelody(pattern.notes);
    }

    this.renderDensity(orb.id, densityForPattern(pattern));
    this.renderGroove(orb.id, pattern.groove);
  }

  public destroy(): void {
    this.modalFocus.destroy();
    this.paintSession = null;
    this.backdrop.remove();
  }

  private renderRhythm(steps: readonly boolean[]): void {
    this.grid.className = 'pattern-grid rhythm-grid';
    this.grid.replaceChildren();

    for (let step = 0; step < PATTERN_STEPS; step += 1) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'rhythm-step';
      button.classList.toggle('is-on', Boolean(steps[step]));
      button.classList.toggle('is-beat-start', step % 4 === 0);
      button.dataset.step = String(step);
      button.dataset.active = String(Boolean(steps[step]));
      button.setAttribute('aria-label', `Step ${step + 1}`);
      button.setAttribute('aria-pressed', String(Boolean(steps[step])));
      this.grid.append(button);
    }
  }

  private renderMelody(notes: readonly (number | null)[]): void {
    this.grid.className = 'pattern-grid melody-grid';
    this.grid.replaceChildren();

    for (let visualRow = MELODY_ROWS - 1; visualRow >= 0; visualRow -= 1) {
      const label = document.createElement('span');
      label.className = 'melody-row-label';
      label.textContent = pitchLabel(visualRow);
      this.grid.append(label);

      for (let step = 0; step < PATTERN_STEPS; step += 1) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'melody-cell';
        button.classList.toggle('is-on', notes[step] === visualRow);
        button.classList.toggle('is-beat-start', step % 4 === 0);
        button.dataset.step = String(step);
        button.dataset.degree = String(visualRow);
        button.dataset.active = String(notes[step] === visualRow);
        button.setAttribute(
          'aria-label',
          `Step ${step + 1}, pitch level ${visualRow + 1}`,
        );
        button.setAttribute('aria-pressed', String(notes[step] === visualRow));
        this.grid.append(button);
      }
    }
  }

  private renderDensity(orbId: string, selected: DensityLevel): void {
    this.densityControls.replaceChildren();

    const options: readonly [DensityLevel, string][] = [
      ['sparse', 'Sparse'],
      ['balanced', 'Balanced'],
      ['busy', 'Busy'],
    ];

    for (const [value, label] of options) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.classList.toggle('is-active', value === selected);
      button.setAttribute('aria-pressed', String(value === selected));
      button.addEventListener('click', () => this.callbacks.onDensity(orbId, value));
      this.densityControls.append(button);
    }
  }

  private renderGroove(orbId: string, selected: GrooveFeel): void {
    this.grooveControls.replaceChildren();

    const options: readonly [GrooveFeel, string][] = [
      ['straight', 'Straight'],
      ['bounce', 'Bounce'],
      ['loose', 'Loose'],
    ];

    for (const [value, label] of options) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.classList.toggle('is-active', value === selected);
      button.setAttribute('aria-pressed', String(value === selected));
      button.addEventListener('click', () => this.callbacks.onGroove(orbId, value));
      this.grooveControls.append(button);
    }
  }

  private beginPaint(event: PointerEvent): void {
    const cell = this.patternCellFromTarget(event.target);

    if (!cell) {
      return;
    }

    event.preventDefault();
    this.grid.setPointerCapture(event.pointerId);

    const orbId = this.currentOrbId();
    if (!orbId) {
      return;
    }

    const step = Number.parseInt(cell.dataset.step ?? '', 10);
    if (!Number.isFinite(step)) {
      return;
    }

    if (cell.classList.contains('rhythm-step')) {
      const active = cell.dataset.active !== 'true';
      const key = `r-${step}`;
      this.paintSession = {
        kind: 'rhythm',
        orbId,
        active,
        lastKey: key,
      };
      this.callbacks.onPaintRhythm(orbId, step, active);
      return;
    }

    const degree = Number.parseInt(cell.dataset.degree ?? '', 10);
    if (!Number.isFinite(degree)) {
      return;
    }

    const erase = cell.dataset.active === 'true';
    const key = `m-${step}-${degree}`;
    this.paintSession = {
      kind: 'melody',
      orbId,
      erase,
      lastKey: key,
    };
    this.callbacks.onPaintMelody(orbId, step, erase ? null : degree);
  }

  private continuePaint(event: PointerEvent): void {
    const session = this.paintSession;
    if (!session) {
      return;
    }

    const target = document.elementFromPoint(event.clientX, event.clientY);
    const cell = this.patternCellFromTarget(target);
    if (!cell) {
      return;
    }

    const step = Number.parseInt(cell.dataset.step ?? '', 10);
    if (!Number.isFinite(step)) {
      return;
    }

    if (session.kind === 'rhythm' && cell.classList.contains('rhythm-step')) {
      const key = `r-${step}`;
      if (key === session.lastKey) {
        return;
      }

      session.lastKey = key;
      this.callbacks.onPaintRhythm(session.orbId, step, session.active);
      return;
    }

    if (session.kind === 'melody' && cell.classList.contains('melody-cell')) {
      const degree = Number.parseInt(cell.dataset.degree ?? '', 10);
      if (!Number.isFinite(degree)) {
        return;
      }

      const key = `m-${step}-${degree}`;
      if (key === session.lastKey) {
        return;
      }

      session.lastKey = key;
      this.callbacks.onPaintMelody(session.orbId, step, session.erase ? null : degree);
    }
  }

  private endPaint(): void {
    this.paintSession = null;
  }

  private currentOrbId(): string | null {
    return this.root.dataset.patternOrbId || null;
  }

  private patternCellFromTarget(target: EventTarget | null): HTMLButtonElement | null {
    if (!(target instanceof Element)) {
      return null;
    }

    return target.closest<HTMLButtonElement>('.rhythm-step, .melody-cell');
  }
}
