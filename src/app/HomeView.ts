import { STARTER_WORLDS, type StarterWorldId } from '../core/world/StarterWorlds';

export interface HomeViewCallbacks {
  readonly onChooseStarter: (starterId: StarterWorldId) => void;
  readonly onSurprise: () => void;
}

export class HomeView {
  public constructor(
    private readonly root: HTMLElement,
    callbacks: HomeViewCallbacks,
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
          <span class="home-tagline">Play with sound</span>
        </header>

        <section class="home-content" aria-labelledby="home-title">
          <div class="home-heading">
            <p class="home-eyebrow">No music knowledge needed</p>
            <h1 id="home-title">Start somewhere.</h1>
            <p>Pick a vibe. Music begins, then you move it around.</p>
          </div>

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

        <footer class="home-footer">
          <span>Move sounds. Hear what happens.</span>
        </footer>
      </main>
    `;

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
  }

  public destroy(): void {
    this.root.replaceChildren();
  }
}
