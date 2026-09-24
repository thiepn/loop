import {
  MAX_EFFECT_FIELDS,
  clampEffectFieldRadius,
  dominantEffectAtPoint,
  effectFieldDescription,
  effectFieldLabel,
  type EffectFieldDocument,
  type EffectFieldType,
} from '../core/world/EffectField';
import type { NormalizedPoint } from '../core/world/SoundOrb';
import type { AppState } from './state';
import { ModalFocusController } from './ModalFocusController';

export interface EffectFieldCallbacks {
  readonly onOpenPalette: () => void;
  readonly onClosePalette: () => void;
  readonly onAddField: (type: EffectFieldType) => void;
  readonly onSelectField: (fieldId: string | null) => void;
  readonly onMovePreview: (field: EffectFieldDocument) => void;
  readonly onMoveCommit: (fieldId: string, position: NormalizedPoint) => void;
  readonly onResizePreview: (field: EffectFieldDocument) => void;
  readonly onResizeCommit: (fieldId: string, radius: number) => void;
  readonly onDeleteField: (fieldId: string) => void;
  readonly onMagicField: (fieldId: string) => void;
}

type FieldGesture =
  | {
      readonly kind: 'move';
      readonly fieldId: string;
      readonly pointerId: number;
      lastPosition: NormalizedPoint;
    }
  | {
      readonly kind: 'resize';
      readonly fieldId: string;
      readonly pointerId: number;
      readonly center: NormalizedPoint;
      lastRadius: number;
    };

const EFFECT_TYPES: readonly EffectFieldType[] = [
  'space',
  'echo',
  'heat',
  'frost',
  'filter',
];

export class EffectFieldView {
  private readonly canvas: HTMLElement;
  private readonly layer: HTMLElement;
  private readonly fieldElements = new Map<string, HTMLElement>();
  private readonly palette: HTMLElement;
  private readonly paletteFocus: ModalFocusController;
  private readonly fieldPanel: HTMLElement;
  private readonly fieldPanelName: HTMLElement;
  private readonly effectsButton: HTMLButtonElement;
  private gesture: FieldGesture | null = null;
  private latestState: Readonly<AppState> | null = null;

  public constructor(
    private readonly root: HTMLElement,
    private readonly callbacks: EffectFieldCallbacks,
  ) {
    const canvas = root.querySelector<HTMLElement>('[data-canvas]');
    const dock = root.querySelector<HTMLElement>('.playground-dock');

    if (!canvas || !dock) {
      throw new Error('Effect Field view requires the playground canvas.');
    }

    this.canvas = canvas;

    const layer = document.createElement('div');
    layer.className = 'effect-field-layer';
    layer.setAttribute('role', 'group');
    layer.setAttribute('aria-label', 'Effect fields');
    canvas.append(layer);
    this.layer = layer;

    const effectsButton = document.createElement('button');
    effectsButton.type = 'button';
    effectsButton.className = 'effects-button';
    effectsButton.innerHTML = '<span aria-hidden="true">◌</span> Effects';
    effectsButton.setAttribute('aria-haspopup', 'dialog');
    effectsButton.setAttribute('aria-expanded', 'false');
    effectsButton.addEventListener('click', callbacks.onOpenPalette);
    dock.append(effectsButton);
    this.effectsButton = effectsButton;

    const fieldPanel = document.createElement('aside');
    fieldPanel.className = 'field-selection-panel';
    fieldPanel.hidden = true;
    fieldPanel.innerHTML = `
      <div class="field-selection-copy">
        <span>Effect Field</span>
        <strong data-field-name>Field</strong>
      </div>
      <div class="field-selection-actions">
        <span class="field-help">Drag to move · corner to resize</span>
        <button class="magic-action" type="button" data-field-magic>✦ Magic</button>
        <button class="danger-action" type="button" data-field-delete>Delete</button>
      </div>
    `;
    root.querySelector<HTMLElement>('.playground-shell')?.append(fieldPanel);
    this.fieldPanel = fieldPanel;

    const fieldPanelName = fieldPanel.querySelector<HTMLElement>('[data-field-name]');
    if (!fieldPanelName) {
      throw new Error('Effect Field panel failed to mount.');
    }
    this.fieldPanelName = fieldPanelName;

    fieldPanel.querySelector<HTMLButtonElement>('[data-field-magic]')?.addEventListener('click', () => {
      const fieldId = this.root.dataset.selectedFieldId || null;
      if (fieldId) {
        callbacks.onMagicField(fieldId);
      }
    });

    fieldPanel.querySelector<HTMLButtonElement>('[data-field-delete]')?.addEventListener('click', () => {
      const fieldId = this.root.dataset.selectedFieldId || null;
      if (fieldId) {
        callbacks.onDeleteField(fieldId);
      }
    });

    const palette = document.createElement('div');
    palette.className = 'effect-palette-backdrop';
    palette.hidden = true;
    palette.innerHTML = `
      <section class="effect-palette-sheet" role="dialog" aria-modal="true" aria-labelledby="effects-title">
        <header class="effect-palette-header">
          <div>
            <span>Playground effects</span>
            <h2 id="effects-title">Add a field</h2>
            <p>Move sounds through a field to transform them.</p>
          </div>
          <button class="effect-palette-close" type="button" data-effects-close aria-label="Close effects">×</button>
        </header>
        <div class="effect-palette-grid" data-effect-choices></div>
      </section>
    `;
    root.querySelector<HTMLElement>('.playground-shell')?.append(palette);
    this.palette = palette;
    this.paletteFocus = new ModalFocusController(palette, {
      onEscape: callbacks.onClosePalette,
      initialFocusSelector: '[data-effects-close]',
    });

    palette.querySelector<HTMLButtonElement>('[data-effects-close]')?.addEventListener('click', callbacks.onClosePalette);
    palette.addEventListener('pointerdown', (event) => {
      if (event.target === palette) {
        callbacks.onClosePalette();
      }
    });
  }

  public render(state: Readonly<AppState>): void {
    this.latestState = state;
    this.root.dataset.selectedFieldId = state.selectedFieldId ?? '';
    this.effectsButton.disabled = Boolean(state.magicSession)
      || state.world.effectFields.length >= MAX_EFFECT_FIELDS;
    this.effectsButton.setAttribute('aria-expanded', String(state.effectPaletteOpen));
    this.palette.hidden = !state.effectPaletteOpen;
    this.paletteFocus.sync(state.effectPaletteOpen);

    this.syncFields(state);
    this.renderFieldPanel(state);
    this.renderPalette(state);
    this.renderOrbEffects(state);
  }

  public previewOrbEffect(
    orbId: string,
    position: NormalizedPoint,
    fields: readonly EffectFieldDocument[],
  ): void {
    const element = this.findOrbElement(orbId);
    if (!element) {
      return;
    }

    this.applyOrbEffectVisual(element, position, fields);
  }

  public previewFieldEffects(field: EffectFieldDocument): void {
    const state = this.latestState;

    if (!state) {
      return;
    }

    const fields = state.world.effectFields.some((candidate) => candidate.id === field.id)
      ? state.world.effectFields.map((candidate) => candidate.id === field.id ? field : candidate)
      : [...state.world.effectFields, field];

    for (const orb of state.world.soundOrbs) {
      const element = this.findOrbElement(orb.id);
      if (element) {
        this.applyOrbEffectVisual(element, orb.position, fields);
      }
    }
  }

  public destroy(): void {
    this.paletteFocus.destroy();
    this.gesture = null;
    this.fieldElements.clear();
    this.layer.remove();
    this.palette.remove();
    this.fieldPanel.remove();
    this.effectsButton.remove();
  }

  private syncFields(state: Readonly<AppState>): void {
    const liveIds = new Set(state.world.effectFields.map((field) => field.id));

    for (const [fieldId, element] of this.fieldElements) {
      if (!liveIds.has(fieldId)) {
        element.remove();
        this.fieldElements.delete(fieldId);
      }
    }

    for (const field of state.world.effectFields) {
      let element = this.fieldElements.get(field.id);

      if (!element) {
        element = this.createFieldElement(field);
        this.layer.append(element);
        this.fieldElements.set(field.id, element);
      }

      this.updateFieldElement(
        element,
        field,
        state.selectedFieldId === field.id,
      );
      element.tabIndex = state.magicSession ? -1 : 0;
      element.setAttribute('aria-disabled', String(Boolean(state.magicSession)));
    }
  }

  private createFieldElement(field: EffectFieldDocument): HTMLElement {
    const element = document.createElement('div');
    element.className = 'effect-field';
    element.tabIndex = 0;
    element.setAttribute('role', 'button');
    element.dataset.fieldId = field.id;
    element.innerHTML = `
      <span class="field-surface" aria-hidden="true"></span>
      <span class="field-label">
        <strong></strong>
        <small></small>
      </span>
      <span class="field-resize-handle" aria-hidden="true"></span>
    `;

    element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.callbacks.onSelectField(field.id);
      }
    });

    element.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 && event.pointerType === 'mouse') {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      this.callbacks.onSelectField(field.id);

      const target = event.target as HTMLElement;
      const current = this.fieldFromLatestState(field.id) ?? field;

      if (target.classList.contains('field-resize-handle')) {
        element.setPointerCapture(event.pointerId);
        this.gesture = {
          kind: 'resize',
          fieldId: field.id,
          pointerId: event.pointerId,
          center: current.position,
          lastRadius: current.radius,
        };
        element.classList.add('is-resizing');
        return;
      }

      element.setPointerCapture(event.pointerId);
      this.gesture = {
        kind: 'move',
        fieldId: field.id,
        pointerId: event.pointerId,
        lastPosition: current.position,
      };
      element.classList.add('is-dragging');
    });

    element.addEventListener('pointermove', (event) => {
      const gesture = this.gesture;

      if (!gesture || gesture.fieldId !== field.id || gesture.pointerId !== event.pointerId) {
        return;
      }

      if (gesture.kind === 'move') {
        const position = this.positionFromPointer(event);
        gesture.lastPosition = position;
        const preview = {
          ...(this.fieldFromLatestState(field.id) ?? field),
          position,
        };
        this.updateFieldElement(element, preview, true);
        this.callbacks.onMovePreview(preview);
        return;
      }

      const pointer = this.positionFromPointer(event);
      const radius = clampEffectFieldRadius(Math.max(
        Math.abs(pointer.x - gesture.center.x),
        Math.abs(pointer.y - gesture.center.y),
      ));
      gesture.lastRadius = radius;
      const preview = {
        ...(this.fieldFromLatestState(field.id) ?? field),
        radius,
      };
      this.updateFieldElement(element, preview, true);
      this.callbacks.onResizePreview(preview);
    });

    const finishGesture = (event: PointerEvent) => {
      const gesture = this.gesture;

      if (!gesture || gesture.fieldId !== field.id || gesture.pointerId !== event.pointerId) {
        return;
      }

      this.gesture = null;
      element.classList.remove('is-dragging', 'is-resizing');

      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId);
      }

      if (gesture.kind === 'move') {
        this.callbacks.onMoveCommit(field.id, gesture.lastPosition);
      } else {
        this.callbacks.onResizeCommit(field.id, gesture.lastRadius);
      }
    };

    element.addEventListener('pointerup', finishGesture);
    element.addEventListener('pointercancel', finishGesture);

    element.addEventListener('keydown', (event) => {
      if (this.latestState?.magicSession) {
        return;
      }

      const current = this.fieldFromLatestState(field.id);
      if (!current) {
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        this.callbacks.onDeleteField(field.id);
        return;
      }

      const amount = event.shiftKey ? 0.035 : 0.015;

      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        this.callbacks.onResizeCommit(
          field.id,
          current.radius + amount,
        );
        return;
      }

      if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        this.callbacks.onResizeCommit(
          field.id,
          current.radius - amount,
        );
        return;
      }

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
      this.callbacks.onMoveCommit(field.id, {
        x: current.position.x + dx,
        y: current.position.y + dy,
      });
    });

    return element;
  }

  private updateFieldElement(
    element: HTMLElement,
    field: EffectFieldDocument,
    selected: boolean,
  ): void {
    element.dataset.fieldType = field.type;
    element.style.left = `${field.position.x * 100}%`;
    element.style.top = `${field.position.y * 100}%`;
    const diameterPercent = clampEffectFieldRadius(field.radius) * 200;
    element.style.width = `${diameterPercent}%`;
    element.style.height = `${diameterPercent}%`;
    element.classList.toggle('is-selected', selected);
    element.setAttribute('aria-pressed', String(selected));
    element.setAttribute(
      'aria-label',
      `${effectFieldLabel(field.type)} field. Drag or use arrow keys to move. Use plus and minus to resize.`,
    );

    const name = element.querySelector<HTMLElement>('.field-label strong');
    const description = element.querySelector<HTMLElement>('.field-label small');

    if (name) {
      name.textContent = effectFieldLabel(field.type);
    }

    if (description) {
      description.textContent = effectFieldDescription(field.type);
    }
  }

  private renderFieldPanel(state: Readonly<AppState>): void {
    const selected = state.selectedFieldId
      ? state.world.effectFields.find((field) => field.id === state.selectedFieldId)
      : undefined;

    this.fieldPanel.hidden = !selected;

    if (selected) {
      this.fieldPanelName.textContent = effectFieldLabel(selected.type);
    }
  }

  private renderPalette(state: Readonly<AppState>): void {
    if (!state.effectPaletteOpen) {
      return;
    }

    const container = this.palette.querySelector<HTMLElement>('[data-effect-choices]');
    if (!container) {
      return;
    }

    container.replaceChildren();
    const existing = new Set(state.world.effectFields.map((field) => field.type));

    for (const type of EFFECT_TYPES) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'effect-choice';
      button.dataset.fieldType = type;
      button.disabled = existing.has(type);
      button.innerHTML = `
        <span class="effect-choice-art" aria-hidden="true"></span>
        <span class="effect-choice-copy">
          <strong>${effectFieldLabel(type)}</strong>
          <small>${existing.has(type) ? 'Already in this World' : effectFieldDescription(type)}</small>
        </span>
      `;
      button.addEventListener('click', () => this.callbacks.onAddField(type));
      container.append(button);
    }
  }

  private renderOrbEffects(state: Readonly<AppState>): void {
    for (const orb of state.world.soundOrbs) {
      const element = this.findOrbElement(orb.id);
      if (element) {
        this.applyOrbEffectVisual(
          element,
          orb.position,
          state.world.effectFields,
        );
      }
    }
  }

  private applyOrbEffectVisual(
    element: HTMLElement,
    position: NormalizedPoint,
    fields: readonly EffectFieldDocument[],
  ): void {
    const dominant = dominantEffectAtPoint(fields, position);

    if (!dominant) {
      delete element.dataset.effect;
      element.style.setProperty('--effect-depth', '0');
      return;
    }

    element.dataset.effect = dominant.type;
    element.style.setProperty(
      '--effect-depth',
      dominant.amount.toFixed(3),
    );
  }

  private fieldFromLatestState(fieldId: string): EffectFieldDocument | undefined {
    return this.latestState?.world.effectFields.find((field) => field.id === fieldId);
  }

  private findOrbElement(orbId: string): HTMLElement | null {
    for (const element of this.root.querySelectorAll<HTMLElement>('[data-orb-id]')) {
      if (element.dataset.orbId === orbId) {
        return element;
      }
    }

    return null;
  }

  private positionFromPointer(event: PointerEvent): NormalizedPoint {
    const rect = this.canvas.getBoundingClientRect();

    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
  }
}
