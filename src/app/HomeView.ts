import { STARTER_WORLDS, type StarterWorldId } from '../core/world/StarterWorlds';
import type { AppState } from './state';

export interface HomeViewCallbacks {
  readonly onChooseStarter: (starterId: StarterWorldId) => void;
  readonly onSurprise: () => void;
  readonly onOpenWorld: (worldId: string) => void;
  readonly onRenameWorld: (worldId: string, name: string) => void;
  readonly onDuplicateWorld: (worldId: string) => void;
  readonly onTrashWorld: (worldId: string) => void;
  readonly onRestoreWorld: (worldId: string) => void;
  readonly onPurgeWorld: (worldId: string) => void;
  readonly onExportWorld: (worldId: string) => void;
  readonly onExportAll: () => void;
  readonly onImportBackup: (text: string) => void;
}

function dateLabel(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return 'Saved locally';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export class HomeView {
  private readonly librarySection: HTMLElement;
  private readonly libraryList: HTMLElement;
  private readonly trashSection: HTMLElement;
  private readonly trashList: HTMLElement;
  private readonly storageNote: HTMLElement;
  private readonly backupAllButton: HTMLButtonElement;
  private readonly fileInput: HTMLInputElement;

  public constructor(
    private readonly root: HTMLElement,
    private readonly callbacks: HomeViewCallbacks,
  ) {
    const starterCards = STARTER_WORLDS.map((world) => `
      <button
        class="starter-card starter-${world.mood}"
        type="button"
        data-starter="${world.id}"
        aria-label="Start ${world.name}: ${world.description}"
      >
        <span class="starter-art" aria-hidden="true">
          <i></i><i></i><i></i>
        </span>
        <span class="starter-copy">
          <strong>${world.name}</strong>
          <small>${world.description}</small>
        </span>
      </button>
    `).join('');

    root.innerHTML = `
      <main class="home-shell">
        <div class="home-aurora home-aurora-a" aria-hidden="true"></div>
        <div class="home-aurora home-aurora-b" aria-hidden="true"></div>

        <header class="home-topbar">
          <div class="brand" aria-label="Loop">
            <span class="brand-mark" aria-hidden="true"><span></span></span>
            <span>Loop</span>
          </div>

          <div class="home-library-actions">
            <button type="button" data-import>Import Backup</button>
            <button type="button" data-backup-all>Backup All</button>
          </div>
        </header>

        <section class="home-content" aria-labelledby="home-title">
          <div class="home-heading">
            <p class="home-eyebrow">No music knowledge needed</p>
            <h1 id="home-title">Start somewhere.</h1>
            <p>Open one of your Worlds, or pick a vibe and make another.</p>
          </div>

          <section class="world-library-section" data-library-section hidden>
            <header class="home-section-heading">
              <div>
                <span>Your Worlds</span>
                <small data-storage-note>Saved on this device</small>
              </div>
            </header>
            <div class="world-library-grid" data-library-list></div>
          </section>

          <section class="starter-section">
            <header class="home-section-heading">
              <div>
                <span>New World</span>
                <small>Choose a starting point</small>
              </div>
            </header>

            <div class="starter-grid">
              ${starterCards}
              <button class="starter-card starter-surprise" type="button" data-surprise>
                <span class="starter-art surprise-art" aria-hidden="true">
                  <i></i><i></i><i></i>
                </span>
                <span class="starter-copy">
                  <strong>Surprise Me</strong>
                  <small>Pick something for me</small>
                </span>
              </button>
            </div>
          </section>

          <section class="world-trash-section" data-trash-section hidden>
            <header class="home-section-heading">
              <div>
                <span>Recently Deleted</span>
                <small>Restore or remove permanently</small>
              </div>
            </header>
            <div class="world-trash-list" data-trash-list></div>
          </section>
        </section>

        <input
          type="file"
          accept="application/json,.json"
          data-import-file
          hidden
        />

        <footer class="home-footer">
          <span>Worlds save automatically on this device.</span>
        </footer>
      </main>
    `;

    const librarySection = root.querySelector<HTMLElement>('[data-library-section]');
    const libraryList = root.querySelector<HTMLElement>('[data-library-list]');
    const trashSection = root.querySelector<HTMLElement>('[data-trash-section]');
    const trashList = root.querySelector<HTMLElement>('[data-trash-list]');
    const storageNote = root.querySelector<HTMLElement>('[data-storage-note]');
    const backupAllButton = root.querySelector<HTMLButtonElement>('[data-backup-all]');
    const fileInput = root.querySelector<HTMLInputElement>('[data-import-file]');

    if (
      !librarySection
      || !libraryList
      || !trashSection
      || !trashList
      || !storageNote
      || !backupAllButton
      || !fileInput
    ) {
      throw new Error('Home library failed to mount.');
    }

    this.librarySection = librarySection;
    this.libraryList = libraryList;
    this.trashSection = trashSection;
    this.trashList = trashList;
    this.storageNote = storageNote;
    this.backupAllButton = backupAllButton;
    this.fileInput = fileInput;

    for (const element of root.querySelectorAll<HTMLButtonElement>('[data-starter]')) {
      element.addEventListener('click', () => {
        const starterId = element.dataset.starter as StarterWorldId | undefined;
        if (starterId) {
          callbacks.onChooseStarter(starterId);
        }
      });
    }

    root.querySelector<HTMLButtonElement>('[data-surprise]')?.addEventListener('click', () => {
      callbacks.onSurprise();
    });

    root.querySelector<HTMLButtonElement>('[data-import]')?.addEventListener('click', () => {
      this.fileInput.value = '';
      this.fileInput.click();
    });

    this.backupAllButton.addEventListener('click', callbacks.onExportAll);

    this.fileInput.addEventListener('change', () => {
      const file = this.fileInput.files?.[0];

      if (!file) {
        return;
      }

      void file.text()
        .then((text) => callbacks.onImportBackup(text))
        .catch(() => {
          // Import decoding reports user-facing errors at the App layer.
        });
    });
  }

  public render(state: Readonly<AppState>): void {
    const active = state.library.filter((item) => item.deletedAt === null);
    const deleted = state.library.filter((item) => item.deletedAt !== null);

    this.storageNote.textContent = state.persistence === 'loading'
      ? 'Loading local storage…'
      : state.persistence === 'error'
        ? 'Local storage unavailable'
        : 'Saved on this device';

    this.backupAllButton.disabled = active.length === 0;

    this.librarySection.hidden = active.length === 0;
    this.libraryList.replaceChildren();

    for (const item of active) {
      const card = document.createElement('article');
      card.className = 'world-library-card';
      card.innerHTML = `
        <button class="world-library-open" type="button" data-open>
          <span class="world-library-art" aria-hidden="true">
            <i></i><i></i><i></i>
          </span>
          <span class="world-library-copy">
            <strong></strong>
            <small></small>
          </span>
        </button>
        <div class="world-library-card-actions">
          <button type="button" data-rename>Rename</button>
          <button type="button" data-duplicate>Duplicate</button>
          <button type="button" data-export>Backup</button>
          <button class="danger-action" type="button" data-trash>Trash</button>
        </div>
      `;

      const name = card.querySelector<HTMLElement>('.world-library-copy strong');
      const meta = card.querySelector<HTMLElement>('.world-library-copy small');

      if (name) {
        name.textContent = item.name;
      }

      if (meta) {
        const snapshotText = item.snapshotCount === 1
          ? '1 snapshot'
          : `${item.snapshotCount} snapshots`;
        meta.textContent = `Edited ${dateLabel(item.updatedAt)} · ${snapshotText}`;
      }

      card.querySelector<HTMLButtonElement>('[data-open]')?.addEventListener(
        'click',
        () => this.callbacks.onOpenWorld(item.id),
      );

      card.querySelector<HTMLButtonElement>('[data-rename]')?.addEventListener(
        'click',
        () => {
          const next = prompt('Rename World', item.name);
          if (next?.trim()) {
            this.callbacks.onRenameWorld(item.id, next);
          }
        },
      );

      card.querySelector<HTMLButtonElement>('[data-duplicate]')?.addEventListener(
        'click',
        () => this.callbacks.onDuplicateWorld(item.id),
      );

      card.querySelector<HTMLButtonElement>('[data-export]')?.addEventListener(
        'click',
        () => this.callbacks.onExportWorld(item.id),
      );

      card.querySelector<HTMLButtonElement>('[data-trash]')?.addEventListener(
        'click',
        () => {
          if (confirm(`Move “${item.name}” to Recently Deleted?`)) {
            this.callbacks.onTrashWorld(item.id);
          }
        },
      );

      this.libraryList.append(card);
    }

    this.trashSection.hidden = deleted.length === 0;
    this.trashList.replaceChildren();

    for (const item of deleted) {
      const row = document.createElement('article');
      row.className = 'world-trash-row';
      row.innerHTML = `
        <div>
          <strong></strong>
          <small></small>
        </div>
        <div class="world-trash-actions">
          <button type="button" data-restore>Restore</button>
          <button class="danger-action" type="button" data-purge>Delete permanently</button>
        </div>
      `;

      const name = row.querySelector<HTMLElement>('strong');
      const meta = row.querySelector<HTMLElement>('small');

      if (name) {
        name.textContent = item.name;
      }

      if (meta) {
        meta.textContent = item.deletedAt
          ? `Deleted ${dateLabel(item.deletedAt)}`
          : 'Recently deleted';
      }

      row.querySelector<HTMLButtonElement>('[data-restore]')?.addEventListener(
        'click',
        () => this.callbacks.onRestoreWorld(item.id),
      );

      row.querySelector<HTMLButtonElement>('[data-purge]')?.addEventListener(
        'click',
        () => {
          if (confirm(`Permanently delete “${item.name}”? This cannot be undone.`)) {
            this.callbacks.onPurgeWorld(item.id);
          }
        },
      );

      this.trashList.append(row);
    }
  }

  public destroy(): void {
    this.root.replaceChildren();
  }
}
