import {
  STARTER_WORLDS,
  createStarterWorld,
  type StarterWorldId,
} from '../core/world/StarterWorlds';
import {
  deriveWorldVisualIdentity,
  type WorldVisualIdentity,
} from '../core/world/WorldVisualIdentity';
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

function pct(value: number): string {
  return (Math.max(0, Math.min(1, value)) * 100).toFixed(1) + '%';
}

function dioramaMarkup(
  visual: WorldVisualIdentity,
  className = '',
): string {
  const fields = visual.fields.map((field) => (
    '<i class="world-mini-field"'
    + ' data-field-type="' + field.type + '"'
    + ' style="--x:' + pct(field.x)
    + ';--y:' + pct(field.y)
    + ';--r:' + (42 + field.radius * 55).toFixed(1) + '%"></i>'
  )).join('');

  const orbs = visual.orbs.map((orb, index) => (
    '<i class="world-mini-orb"'
    + ' data-role="' + orb.role + '"'
    + ' style="--x:' + pct(orb.x)
    + ';--y:' + pct(orb.y)
    + ';--s:' + orb.scale.toFixed(2)
    + ';--delay:' + (-index * 0.31).toFixed(2) + 's"></i>'
  )).join('');

  const toys = visual.toys.map((toy) => (
    '<i class="world-mini-toy"'
    + ' data-toy-type="' + toy.type + '"'
    + ' style="--x:' + pct(toy.x)
    + ';--y:' + pct(toy.y) + '"></i>'
  )).join('');

  return (
    '<span class="world-diorama ' + className + '"'
    + ' style="--world-density:' + visual.density.toFixed(3) + '">'
    + '<span class="world-mini-haze"></span>'
    + fields
    + toys
    + orbs
    + '<span class="world-mini-listener"></span>'
    + '</span>'
  );
}

function glyphMarkup(
  visual: WorldVisualIdentity,
): string {
  return (
    '<span class="world-glyph" aria-hidden="true"'
    + ' style="--ga:' + visual.glyphA + 'deg;'
    + '--gb:' + visual.glyphB + 'deg;'
    + '--gc:' + visual.glyphC + 'deg">'
    + '<i></i><i></i><i></i><b></b>'
    + '</span>'
  );
}

const STARTER_VISUALS = new Map(
  STARTER_WORLDS.map((starter) => [
    starter.id,
    deriveWorldVisualIdentity(
      createStarterWorld(starter.id, 0),
    ),
  ]),
);

export class HomeView {
  private readonly librarySection: HTMLElement;
  private readonly libraryList: HTMLElement;
  private readonly trashSection: HTMLElement;
  private readonly trashList: HTMLElement;
  private readonly storageNote: HTMLElement;
  private readonly backupAllButton: HTMLButtonElement;
  private readonly fileInput: HTMLInputElement;
  private readonly homeState: HTMLElement;

  public constructor(
    private readonly root: HTMLElement,
    private readonly callbacks: HomeViewCallbacks,
  ) {
    const starterCards = STARTER_WORLDS.map((world) => {
      const visual = STARTER_VISUALS.get(world.id)!;

      return `
        <button
          class="starter-card"
          type="button"
          data-starter="${world.id}"
          data-primary-role="${visual.primaryRole ?? 'none'}"
          aria-label="Start ${world.name}: ${world.description}"
        >
          ${dioramaMarkup(visual, 'starter-diorama')}
          <span class="starter-card-bottom">
            <span class="starter-copy">
              <strong>${world.name}</strong>
              <small>${world.description}</small>
            </span>
            ${glyphMarkup(visual)}
          </span>
        </button>
      `;
    }).join('');

    const heroVisual = STARTER_VISUALS.get('dreamy')!;

    root.innerHTML = `
      <main class="home-shell">
        <div class="home-universe" aria-hidden="true">
          <i></i><i></i><i></i><i></i><i></i>
          <span></span>
        </div>

        <header class="home-topbar">
          <div class="brand home-brand" aria-label="Loop">
            <span class="brand-mark" aria-hidden="true"><span></span></span>
            <span>Loop</span>
          </div>

          <div class="home-library-actions">
            <button type="button" data-import>Import</button>
            <button type="button" data-backup-all>Backup All</button>
          </div>
        </header>

        <section class="home-content" aria-labelledby="home-title">
          <section class="home-hero">
            <div class="home-heading">
              <p class="home-eyebrow">Visual music playground</p>
              <h1 id="home-title">Make a World.<br />Hear it move.</h1>
              <p>
                Build beats and soundscapes by placing living sounds,
                moving them through space, and watching everything react.
              </p>
            </div>

            <div class="home-hero-world" aria-hidden="true">
              ${dioramaMarkup(heroVisual, 'hero-diorama')}
              <span class="home-hero-ring"></span>
              <span class="home-hero-label">Sound becomes space</span>
            </div>
          </section>

          <section class="home-state" data-home-state>
            <span class="home-state-orbit" aria-hidden="true"><i></i></span>
            <div>
              <strong data-home-state-title>Loading your Worlds</strong>
              <small data-home-state-copy>Preparing local music spaces…</small>
            </div>
          </section>

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
                <span>Start a World</span>
                <small>Choose a musical shape, then make it yours</small>
              </div>
            </header>

            <div class="starter-grid">
              ${starterCards}
              <button class="starter-card starter-surprise" type="button" data-surprise>
                <span class="surprise-cosmos" aria-hidden="true">
                  <i></i><i></i><i></i><i></i>
                  <b>✦</b>
                </span>
                <span class="starter-card-bottom">
                  <span class="starter-copy">
                    <strong>Surprise Me</strong>
                    <small>Let Loop choose the starting universe</small>
                  </span>
                  <span class="world-glyph surprise-glyph" aria-hidden="true">
                    <i></i><i></i><i></i><b></b>
                  </span>
                </span>
              </button>
            </div>
          </section>

          <section class="world-trash-section" data-trash-section hidden>
            <header class="home-section-heading">
              <div>
                <span>Recently Deleted</span>
                <small>Restore a World or remove it permanently</small>
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
          <span>Local-first · Offline-ready · Autosaved</span>
          <span>Move sound. Shape space. Make it yours.</span>
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
    const homeState = root.querySelector<HTMLElement>('[data-home-state]');

    if (
      !librarySection
      || !libraryList
      || !trashSection
      || !trashList
      || !storageNote
      || !backupAllButton
      || !fileInput
      || !homeState
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
    this.homeState = homeState;

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

    const stateTitle = this.homeState.querySelector<HTMLElement>(
      '[data-home-state-title]',
    );
    const stateCopy = this.homeState.querySelector<HTMLElement>(
      '[data-home-state-copy]',
    );
    const showState = state.persistence !== 'ready'
      || active.length === 0;

    this.homeState.hidden = !showState;
    this.homeState.dataset.state = state.persistence === 'error'
      ? 'error'
      : state.persistence === 'loading'
        ? 'loading'
        : 'empty';

    if (stateTitle && stateCopy) {
      if (state.persistence === 'error') {
        stateTitle.textContent = 'Local Worlds are unavailable';
        stateCopy.textContent = 'You can still start a new World in this session.';
      } else if (state.persistence === 'loading') {
        stateTitle.textContent = 'Loading your Worlds';
        stateCopy.textContent = 'Preparing local music spaces…';
      } else {
        stateTitle.textContent = 'Your first World starts here';
        stateCopy.textContent = 'Choose a starting universe below. It will autosave as you play.';
      }
    }

    this.librarySection.hidden = active.length === 0;
    this.libraryList.replaceChildren();

    for (const item of active) {
      const card = document.createElement('article');
      card.className = 'world-library-card';
      card.dataset.primaryRole = item.visual.primaryRole ?? 'none';
      card.innerHTML = `
        <button class="world-library-open" type="button" data-open>
          ${dioramaMarkup(item.visual, 'library-diorama')}
          <span class="world-library-card-bottom">
            <span class="world-library-copy">
              <strong></strong>
              <small></small>
            </span>
            ${glyphMarkup(item.visual)}
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
          : item.snapshotCount + ' snapshots';
        const soundText = item.visual.orbCount === 1
          ? '1 sound'
          : item.visual.orbCount + ' sounds';
        meta.textContent = soundText
          + ' · ' + item.visual.bpm + ' BPM'
          + ' · ' + snapshotText
          + ' · ' + dateLabel(item.updatedAt);
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
          if (confirm('Move “' + item.name + '” to Recently Deleted?')) {
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
        <span class="trash-world-glyph">${glyphMarkup(item.visual)}</span>
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
          ? 'Deleted ' + dateLabel(item.deletedAt)
          : 'Recently deleted';
      }

      row.querySelector<HTMLButtonElement>('[data-restore]')?.addEventListener(
        'click',
        () => this.callbacks.onRestoreWorld(item.id),
      );

      row.querySelector<HTMLButtonElement>('[data-purge]')?.addEventListener(
        'click',
        () => {
          if (confirm('Permanently delete “' + item.name + '”? This cannot be undone.')) {
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
