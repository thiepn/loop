import { MAX_SNAPSHOTS } from '../core/world/Snapshot';
import type { AppState } from './state';

export interface HistoryAvailability {
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}

export interface PersistenceViewCallbacks {
  readonly onOpenSnapshots: () => void;
  readonly onCloseSnapshots: () => void;
  readonly onSaveSnapshot: (name?: string) => void;
  readonly onRecallSnapshot: (snapshotId: string) => void;
  readonly onRenameSnapshot: (snapshotId: string, name: string) => void;
  readonly onDeleteSnapshot: (snapshotId: string) => void;
  readonly onUndo: () => void;
  readonly onRedo: () => void;
  readonly onRenameWorld: (name: string) => void;
  readonly onExportCurrent: () => void;
}

function autosaveLabel(state: Readonly<AppState>): string {
  if (state.persistence === 'error') {
    return 'Not saved';
  }

  switch (state.autosave) {
    case 'saving':
      return 'Saving…';
    case 'saved':
      return 'Saved';
    case 'error':
      return 'Save failed';
    case 'idle':
      return 'Local';
  }
}

export class PersistenceView {
  private readonly autosaveStatus: HTMLElement;
  private readonly undoButton: HTMLButtonElement;
  private readonly redoButton: HTMLButtonElement;
  private readonly snapshotButton: HTMLButtonElement;
  private readonly backdrop: HTMLElement;
  private readonly list: HTMLElement;
  private readonly saveButton: HTMLButtonElement;
  private readonly worldName: HTMLElement;

  public constructor(
    root: HTMLElement,
    private readonly callbacks: PersistenceViewCallbacks,
  ) {
    const topbar = root.querySelector<HTMLElement>('.playground-topbar');
    const playButton = topbar?.querySelector<HTMLElement>('[data-play]');
    const dock = root.querySelector<HTMLElement>('.playground-dock');
    const shell = root.querySelector<HTMLElement>('.playground-shell');

    if (!topbar || !playButton || !dock || !shell) {
      throw new Error('Persistence view requires the playground shell.');
    }

    const status = document.createElement('div');
    status.className = 'persistence-topbar-tools';
    status.innerHTML = `
      <span class="autosave-status" data-autosave-status>Local</span>
      <button type="button" data-history-undo aria-label="Undo">↶</button>
      <button type="button" data-history-redo aria-label="Redo">↷</button>
    `;

    topbar.insertBefore(status, playButton);

    const autosaveStatus = status.querySelector<HTMLElement>('[data-autosave-status]');
    const undoButton = status.querySelector<HTMLButtonElement>('[data-history-undo]');
    const redoButton = status.querySelector<HTMLButtonElement>('[data-history-redo]');

    if (!autosaveStatus || !undoButton || !redoButton) {
      throw new Error('Persistence topbar controls failed to mount.');
    }

    this.autosaveStatus = autosaveStatus;
    this.undoButton = undoButton;
    this.redoButton = redoButton;

    undoButton.addEventListener('click', callbacks.onUndo);
    redoButton.addEventListener('click', callbacks.onRedo);

    const snapshotButton = document.createElement('button');
    snapshotButton.type = 'button';
    snapshotButton.className = 'snapshots-button';
    snapshotButton.innerHTML = '<span aria-hidden="true">◫</span> Snapshots';
    snapshotButton.addEventListener('click', callbacks.onOpenSnapshots);
    dock.append(snapshotButton);
    this.snapshotButton = snapshotButton;

    const backdrop = document.createElement('div');
    backdrop.className = 'snapshot-backdrop';
    backdrop.hidden = true;
    backdrop.innerHTML = `
      <section class="snapshot-sheet" role="dialog" aria-modal="true" aria-labelledby="snapshot-title">
        <header class="snapshot-header">
          <div>
            <span>Playable states</span>
            <h2 id="snapshot-title">Snapshots</h2>
            <p>Save a moment, then jump back to it later.</p>
          </div>
          <button class="snapshot-close" type="button" data-snapshot-close aria-label="Close Snapshots">×</button>
        </header>

        <div class="snapshot-world-row">
          <div>
            <span>World</span>
            <strong data-snapshot-world-name>World</strong>
          </div>
          <div>
            <button type="button" data-world-rename>Rename</button>
            <button type="button" data-world-backup>Backup</button>
          </div>
        </div>

        <div class="snapshot-list" data-snapshot-list></div>

        <footer class="snapshot-footer">
          <span data-snapshot-count>0 / ${MAX_SNAPSHOTS}</span>
          <button class="snapshot-save" type="button" data-snapshot-save>
            <span aria-hidden="true">＋</span>
            Save Snapshot
          </button>
        </footer>
      </section>
    `;
    shell.append(backdrop);
    this.backdrop = backdrop;

    const list = backdrop.querySelector<HTMLElement>('[data-snapshot-list]');
    const saveButton = backdrop.querySelector<HTMLButtonElement>('[data-snapshot-save]');
    const worldName = backdrop.querySelector<HTMLElement>('[data-snapshot-world-name]');

    if (!list || !saveButton || !worldName) {
      throw new Error('Snapshot sheet failed to mount.');
    }

    this.list = list;
    this.saveButton = saveButton;
    this.worldName = worldName;

    backdrop.querySelector<HTMLButtonElement>('[data-snapshot-close]')?.addEventListener(
      'click',
      callbacks.onCloseSnapshots,
    );

    backdrop.addEventListener('pointerdown', (event) => {
      if (event.target === backdrop) {
        callbacks.onCloseSnapshots();
      }
    });

    saveButton.addEventListener('click', () => {
      const name = prompt('Snapshot name', '');

      if (name === null) {
        return;
      }

      callbacks.onSaveSnapshot(name.trim() || undefined);
    });

    backdrop.querySelector<HTMLButtonElement>('[data-world-rename]')?.addEventListener(
      'click',
      () => {
        const stateName = this.worldName.textContent ?? 'World';
        const name = prompt('Rename World', stateName);
        if (name?.trim()) {
          callbacks.onRenameWorld(name);
        }
      },
    );

    backdrop.querySelector<HTMLButtonElement>('[data-world-backup]')?.addEventListener(
      'click',
      callbacks.onExportCurrent,
    );
  }

  public render(
    state: Readonly<AppState>,
    history: HistoryAvailability,
  ): void {
    this.autosaveStatus.textContent = autosaveLabel(state);
    this.autosaveStatus.dataset.status = state.autosave;

    const locked = Boolean(state.magicSession);

    this.undoButton.disabled = locked || !history.canUndo;
    this.redoButton.disabled = locked || !history.canRedo;
    this.snapshotButton.disabled = locked;

    this.backdrop.hidden = !state.snapshotsOpen;
    this.worldName.textContent = state.world.name;

    const count = this.backdrop.querySelector<HTMLElement>('[data-snapshot-count]');
    if (count) {
      count.textContent = `${state.world.snapshots.length} / ${MAX_SNAPSHOTS}`;
    }

    this.saveButton.disabled = state.world.snapshots.length >= MAX_SNAPSHOTS;

    this.list.replaceChildren();

    if (state.world.snapshots.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'snapshot-empty';
      empty.innerHTML = `
        <strong>No snapshots yet</strong>
        <span>Save the current playable state when you reach something you like.</span>
      `;
      this.list.append(empty);
      return;
    }

    for (const snapshot of state.world.snapshots) {
      const row = document.createElement('article');
      row.className = 'snapshot-row';
      row.innerHTML = `
        <button class="snapshot-recall" type="button" data-recall>
          <span class="snapshot-mini-art" aria-hidden="true"></span>
          <span>
            <strong></strong>
            <small>Recall on a safe musical boundary</small>
          </span>
        </button>
        <div class="snapshot-row-actions">
          <button type="button" data-rename>Rename</button>
          <button class="danger-action" type="button" data-delete>Delete</button>
        </div>
      `;

      const name = row.querySelector<HTMLElement>('.snapshot-recall strong');
      if (name) {
        name.textContent = snapshot.name;
      }

      row.querySelector<HTMLButtonElement>('[data-recall]')?.addEventListener(
        'click',
        () => this.callbacks.onRecallSnapshot(snapshot.id),
      );

      row.querySelector<HTMLButtonElement>('[data-rename]')?.addEventListener(
        'click',
        () => {
          const next = prompt('Rename Snapshot', snapshot.name);
          if (next?.trim()) {
            this.callbacks.onRenameSnapshot(snapshot.id, next);
          }
        },
      );

      row.querySelector<HTMLButtonElement>('[data-delete]')?.addEventListener(
        'click',
        () => {
          if (confirm(`Delete snapshot “${snapshot.name}”?`)) {
            this.callbacks.onDeleteSnapshot(snapshot.id);
          }
        },
      );

      this.list.append(row);
    }
  }

  public destroy(): void {
    this.backdrop.remove();
    this.snapshotButton.remove();
    this.autosaveStatus.parentElement?.remove();
  }
}
