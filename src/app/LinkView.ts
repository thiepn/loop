import {
  linkById,
  linkDescription,
  linkLabel,
  type LinkDocument,
  type LinkType,
} from '../core/world/Link';
import {
  validateLinkCandidate,
  type LinkValidationReason,
} from '../core/world/LinkActions';
import { soundById } from '../core/sounds/coreCatalog';
import type { NormalizedPoint } from '../core/world/SoundOrb';
import type { AppState } from './state';
import { ModalFocusController } from './ModalFocusController';
import { loopIcon } from './LoopIcons';

export interface LinkViewCallbacks {
  readonly onCloseEditor: () => void;
  readonly onChooseTarget: (targetOrbId: string) => void;
  readonly onCreateLink: (type: LinkType) => void;
  readonly onSelectLink: (linkId: string | null) => void;
  readonly onDeleteLink: (linkId: string) => void;
}

const LINK_TYPES: readonly LinkType[] = [
  'pulse-together',
  'take-turns',
  'follow',
  'kick-pushes-bass',
  'copy-movement',
];

interface LinkElements {
  readonly group: SVGGElement;
  readonly path: SVGPathElement;
  readonly hit: SVGPathElement;
  readonly node: SVGCircleElement;
}

function validationReasonText(reason?: LinkValidationReason): string {
  switch (reason) {
    case 'missing-orb':
      return 'Sound is no longer available';
    case 'self':
      return 'Choose a different sound';
    case 'duplicate':
      return 'This relationship already exists';
    case 'limit':
      return 'This World already has eight Links';
    case 'incompatible':
      return 'These sound roles do not fit this Link';
    case 'target-driven':
      return 'That target is already driven by another Link';
    case 'take-turns-conflict':
      return 'One of these sounds already Takes Turns elsewhere';
    case 'copy-target-conflict':
      return 'That target already copies another movement';
    case 'copy-chain-conflict':
      return 'Copy Movement stays one level deep';
    case 'copy-cycle':
      return 'That would create a movement loop';
    case undefined:
      return '';
  }
}

function orbName(state: Readonly<AppState>, orbId: string): string {
  const orb = state.world.soundOrbs.find((candidate) => candidate.id === orbId);
  if (!orb) {
    return 'Missing sound';
  }

  return soundById(orb.soundId)?.name ?? orb.role;
}

export class LinkView {
  private readonly svg: SVGSVGElement;
  private readonly editor: HTMLElement;
  private readonly editorFocus: ModalFocusController;
  private readonly editorTitle: HTMLElement;
  private readonly targetList: HTMLElement;
  private readonly relationGrid: HTMLElement;
  private readonly selectionPanel: HTMLElement;
  private readonly selectionName: HTMLElement;
  private readonly selectionPair: HTMLElement;
  private readonly elements = new Map<string, LinkElements>();
  private readonly positions = new Map<string, NormalizedPoint>();
  private latestState: Readonly<AppState> | null = null;

  public constructor(
    private readonly root: HTMLElement,
    private readonly callbacks: LinkViewCallbacks,
  ) {
    const canvas = root.querySelector<HTMLElement>('[data-canvas]');
    const shell = root.querySelector<HTMLElement>('.playground-shell');

    if (!canvas || !shell) {
      throw new Error('Link view requires the playground shell.');
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('link-layer');
    svg.setAttribute('viewBox', '0 0 1000 1000');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('role', 'group');
    svg.setAttribute('aria-label', 'Sound relationships');
    canvas.append(svg);
    this.svg = svg;

    const editor = document.createElement('div');
    editor.className = 'link-editor-backdrop';
    editor.hidden = true;
    editor.innerHTML = `
      <section class="link-editor-sheet" role="dialog" aria-modal="true" aria-labelledby="link-editor-title">
        <header class="link-editor-header">
          <div>
            <span>Reactive relationship</span>
            <h2 id="link-editor-title" data-link-editor-title>Link a sound</h2>
            <p>Choose what this sound should react to.</p>
          </div>
          <button class="link-editor-close" type="button" data-link-close aria-label="Close Link editor">${loopIcon('close')}</button>
        </header>

        <div class="link-editor-section">
          <span class="link-editor-label">Connect to</span>
          <div class="link-target-list" data-link-targets></div>
        </div>

        <div class="link-editor-section link-relations-section" data-link-relations-section hidden>
          <span class="link-editor-label">Relationship</span>
          <div class="link-relation-grid" data-link-relations></div>
        </div>
      </section>
    `;
    shell.append(editor);
    this.editor = editor;
    this.editorFocus = new ModalFocusController(editor, {
      onEscape: callbacks.onCloseEditor,
      initialFocusSelector: '[data-link-close]',
    });

    const editorTitle = editor.querySelector<HTMLElement>('[data-link-editor-title]');
    const targetList = editor.querySelector<HTMLElement>('[data-link-targets]');
    const relationGrid = editor.querySelector<HTMLElement>('[data-link-relations]');

    if (!editorTitle || !targetList || !relationGrid) {
      throw new Error('Link editor failed to mount.');
    }

    this.editorTitle = editorTitle;
    this.targetList = targetList;
    this.relationGrid = relationGrid;

    editor.querySelector<HTMLButtonElement>('[data-link-close]')?.addEventListener(
      'click',
      callbacks.onCloseEditor,
    );
    editor.addEventListener('pointerdown', (event) => {
      if (event.target === editor) {
        callbacks.onCloseEditor();
      }
    });

    const selectionPanel = document.createElement('aside');
    selectionPanel.className = 'link-selection-panel';
    selectionPanel.hidden = true;
    selectionPanel.innerHTML = `
      <div class="link-selection-copy">
        <span>Link</span>
        <strong data-link-selection-name>Relationship</strong>
        <small data-link-selection-pair>Source → Target</small>
      </div>
      <div class="link-selection-actions">
        <button class="danger-action" type="button" data-link-delete>${loopIcon('trash')}<span>Delete</span></button>
      </div>
    `;
    shell.append(selectionPanel);
    this.selectionPanel = selectionPanel;

    const selectionName = selectionPanel.querySelector<HTMLElement>('[data-link-selection-name]');
    const selectionPair = selectionPanel.querySelector<HTMLElement>('[data-link-selection-pair]');

    if (!selectionName || !selectionPair) {
      throw new Error('Link selection panel failed to mount.');
    }

    this.selectionName = selectionName;
    this.selectionPair = selectionPair;

    selectionPanel.querySelector<HTMLButtonElement>('[data-link-delete]')?.addEventListener('click', () => {
      const linkId = this.root.dataset.selectedLinkId || null;
      if (linkId) {
        callbacks.onDeleteLink(linkId);
      }
    });
  }

  public render(state: Readonly<AppState>): void {
    this.latestState = state;
    this.root.dataset.selectedLinkId = state.selectedLinkId ?? '';

    for (const orb of state.world.soundOrbs) {
      if (!this.positions.has(orb.id)) {
        this.positions.set(orb.id, orb.position);
      }
    }

    const liveOrbIds = new Set(state.world.soundOrbs.map((orb) => orb.id));
    for (const orbId of [...this.positions.keys()]) {
      if (!liveOrbIds.has(orbId)) {
        this.positions.delete(orbId);
      }
    }

    this.syncLinks(state);
    this.renderEditor(state);
    this.renderSelection(state);
  }

  public updateLivePositions(
    positions: ReadonlyMap<string, NormalizedPoint>,
  ): void {
    for (const [orbId, position] of positions) {
      this.positions.set(orbId, position);
    }

    this.updateAllPaths();
  }

  public previewOrbPosition(
    orbId: string,
    position: NormalizedPoint,
  ): void {
    this.positions.set(orbId, position);
    this.updateAllPaths();
  }

  public pulseLink(linkId: string): void {
    const shell = this.root.querySelector<HTMLElement>(
      '.playground-shell',
    );
    const rendererReady = shell?.dataset.rendererState === 'ready'
      && (
        shell.dataset.rendererV2 === 'webgl2'
        || shell.dataset.rendererV2 === 'canvas2d'
      );

    if (rendererReady) {
      return;
    }

    const elements = this.elements.get(linkId);

    if (!elements) {
      return;
    }

    elements.path.animate(
      [
        { opacity: 0.5, strokeWidth: '2' },
        { opacity: 1, strokeWidth: '5', offset: 0.35 },
        { opacity: 0.58, strokeWidth: '2' },
      ],
      {
        duration: 260,
        easing: 'cubic-bezier(.2,.8,.2,1)',
      },
    );

    elements.node.animate(
      [
        { opacity: 0.5, transform: 'scale(1)' },
        { opacity: 1, transform: 'scale(1.8)', offset: 0.35 },
        { opacity: 0.5, transform: 'scale(1)' },
      ],
      {
        duration: 260,
        easing: 'cubic-bezier(.2,.8,.2,1)',
      },
    );
  }

  public pushOrb(
    sourceOrbId: string,
    targetOrbId: string,
    intensity: number,
  ): void {
    const targetElement = this.root.querySelector<HTMLElement>(
      `[data-orb-id="${CSS.escape(targetOrbId)}"]`,
    );
    const source = this.positions.get(sourceOrbId);
    const target = this.positions.get(targetOrbId);

    if (!targetElement || !source || !target) {
      return;
    }

    let dx = target.x - source.x;
    let dy = target.y - source.y;
    const length = Math.hypot(dx, dy) || 1;
    dx /= length;
    dy /= length;

    const amount = 8 + Math.max(0, Math.min(1, intensity)) * 10;
    const reducedMotion = this.root
      .querySelector<HTMLElement>('.playground-shell')
      ?.dataset.reduceMotion === 'true';

    if (reducedMotion) {
      targetElement.animate(
        [
          { filter: 'brightness(1)' },
          { filter: 'brightness(1.35)', offset: 0.35 },
          { filter: 'brightness(1)' },
        ],
        {
          duration: 180,
          easing: 'ease-out',
        },
      );
      return;
    }

    targetElement.animate(
      [
        { transform: 'translate(0, 0)' },
        {
          transform: `translate(${dx * amount}px, ${dy * amount}px)`,
          offset: 0.28,
        },
        { transform: 'translate(0, 0)' },
      ],
      {
        duration: 240,
        easing: 'cubic-bezier(.16,.8,.26,1)',
      },
    );
  }

  public destroy(): void {
    this.editorFocus.destroy();
    this.elements.clear();
    this.positions.clear();
    this.svg.remove();
    this.editor.remove();
    this.selectionPanel.remove();
  }

  private syncLinks(state: Readonly<AppState>): void {
    const liveIds = new Set(state.world.links.map((link) => link.id));

    for (const [linkId, elements] of this.elements) {
      if (!liveIds.has(linkId)) {
        elements.group.remove();
        this.elements.delete(linkId);
      }
    }

    for (const link of state.world.links) {
      let elements = this.elements.get(link.id);

      if (!elements) {
        elements = this.createLinkElements(link);
        this.svg.append(elements.group);
        this.elements.set(link.id, elements);
      }

      elements.group.dataset.linkType = link.type;
      const selected = state.selectedLinkId === link.id;
      elements.group.classList.toggle('is-selected', selected);
      elements.hit.setAttribute('aria-pressed', String(selected));
      elements.hit.setAttribute(
        'tabindex',
        state.magicSession ? '-1' : '0',
      );
      elements.hit.setAttribute(
        'aria-disabled',
        String(Boolean(state.magicSession)),
      );
      this.updatePath(link, elements);
    }
  }

  private createLinkElements(link: LinkDocument): LinkElements {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.classList.add('link-connection');
    group.dataset.linkId = link.id;
    group.dataset.linkType = link.type;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.classList.add('link-path');

    const hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hit.classList.add('link-hit');
    hit.setAttribute('tabindex', '0');
    hit.setAttribute('role', 'button');
    hit.setAttribute('aria-label', `${linkLabel(link.type)} Link`);

    const node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    node.classList.add('link-node');
    node.setAttribute('r', '5');

    hit.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.callbacks.onSelectLink(link.id);
    });

    hit.addEventListener('keydown', (event) => {
      if (this.latestState?.magicSession) {
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.callbacks.onSelectLink(link.id);
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        this.callbacks.onDeleteLink(link.id);
      }
    });

    group.append(path, node, hit);

    return {
      group,
      path,
      hit,
      node,
    };
  }

  private updateAllPaths(): void {
    const state = this.latestState;
    if (!state) {
      return;
    }

    for (const link of state.world.links) {
      const elements = this.elements.get(link.id);
      if (elements) {
        this.updatePath(link, elements);
      }
    }
  }

  private updatePath(
    link: LinkDocument,
    elements: LinkElements,
  ): void {
    const state = this.latestState;
    if (!state) {
      return;
    }

    const sourceOrb = state.world.soundOrbs.find(
      (orb) => orb.id === link.sourceOrbId,
    );
    const targetOrb = state.world.soundOrbs.find(
      (orb) => orb.id === link.targetOrbId,
    );

    if (!sourceOrb || !targetOrb) {
      elements.group.setAttribute('visibility', 'hidden');
      return;
    }

    elements.group.removeAttribute('visibility');

    const source = this.positions.get(sourceOrb.id) ?? sourceOrb.position;
    const target = this.positions.get(targetOrb.id) ?? targetOrb.position;

    const x1 = source.x * 1000;
    const y1 = source.y * 1000;
    const x2 = target.x * 1000;
    const y2 = target.y * 1000;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const curve = Math.min(90, distance * 0.14);
    const nx = -dy / distance;
    const ny = dx / distance;
    const hash = [...link.id].reduce(
      (sum, char) => sum + char.charCodeAt(0),
      0,
    );
    const direction = hash % 2 === 0 ? 1 : -1;
    const cx = (x1 + x2) / 2 + nx * curve * direction;
    const cy = (y1 + y2) / 2 + ny * curve * direction;
    const pathData = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;

    elements.path.setAttribute('d', pathData);
    elements.hit.setAttribute('d', pathData);

    const midpointX = 0.25 * x1 + 0.5 * cx + 0.25 * x2;
    const midpointY = 0.25 * y1 + 0.5 * cy + 0.25 * y2;
    elements.node.setAttribute('cx', String(midpointX));
    elements.node.setAttribute('cy', String(midpointY));
  }

  private renderEditor(state: Readonly<AppState>): void {
    const sourceId = state.linkEditorSourceOrbId;
    const source = sourceId
      ? state.world.soundOrbs.find((orb) => orb.id === sourceId)
      : undefined;

    this.editor.hidden = !source;
    this.editorFocus.sync(Boolean(source));

    if (!source) {
      return;
    }

    this.editorTitle.textContent = `Link ${orbName(state, source.id)}`;
    this.targetList.replaceChildren();

    for (const target of state.world.soundOrbs) {
      if (target.id === source.id) {
        continue;
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'link-target-choice';
      const selected = state.linkEditorTargetOrbId === target.id;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
      button.innerHTML = `
        <span class="link-target-dot" data-role="${target.role}" aria-hidden="true"></span>
        <span>${orbName(state, target.id)}</span>
      `;
      button.addEventListener('click', () => {
        this.callbacks.onChooseTarget(target.id);
      });
      this.targetList.append(button);
    }

    const section = this.editor.querySelector<HTMLElement>('[data-link-relations-section]');
    const targetId = state.linkEditorTargetOrbId;

    if (!section) {
      return;
    }

    section.hidden = !targetId;
    this.relationGrid.replaceChildren();

    if (!targetId) {
      return;
    }

    for (const type of LINK_TYPES) {
      const validation = validateLinkCandidate(
        state.world,
        type,
        source.id,
        targetId,
      );
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'link-relation-choice';
      button.dataset.linkType = type;
      button.disabled = !validation.ok;
      button.innerHTML = `
        <span class="link-relation-art" aria-hidden="true"></span>
        <span class="link-relation-copy">
          <strong>${linkLabel(type)}</strong>
          <small>${validation.ok ? linkDescription(type) : validationReasonText(validation.reason)}</small>
        </span>
      `;

      if (validation.ok) {
        button.addEventListener('click', () => {
          this.callbacks.onCreateLink(type);
        });
      }

      this.relationGrid.append(button);
    }
  }

  private renderSelection(state: Readonly<AppState>): void {
    const selected = state.selectedLinkId
      ? linkById(state.world.links, state.selectedLinkId)
      : undefined;

    this.selectionPanel.hidden = !selected;

    if (!selected) {
      return;
    }

    this.selectionPanel.dataset.linkType = selected.type;
    this.selectionName.textContent = linkLabel(selected.type);
    this.selectionPair.textContent = `${orbName(state, selected.sourceOrbId)} → ${orbName(state, selected.targetOrbId)}`;
  }
}
