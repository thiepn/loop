import { audioEngine } from '../core/audio/AudioEngine';
import { detectCapabilities } from '../core/platform/capabilities';
import { appStore } from './state';

export class App {
  private unsubscribe: (() => void) | null = null;

  public constructor(private readonly root: HTMLElement) {}

  public mount(): void {
    const capabilities = detectCapabilities();

    this.root.innerHTML = `
      <main class="app-shell">
        <div class="ambient ambient-a" aria-hidden="true"></div>
        <div class="ambient ambient-b" aria-hidden="true"></div>

        <header class="topbar">
          <a class="brand" href="${import.meta.env.BASE_URL}" aria-label="Loop home">
            <span class="brand-mark" aria-hidden="true"><span></span></span>
            <span>Loop</span>
          </a>
          <span class="phase-pill">Foundation</span>
        </header>

        <section class="hero" aria-labelledby="hero-title">
          <div class="orb-stage" aria-hidden="true">
            <div class="orbit orbit-one"></div>
            <div class="orbit orbit-two"></div>
            <div class="demo-orb demo-orb-main"><span></span></div>
            <div class="demo-orb demo-orb-small demo-orb-a"></div>
            <div class="demo-orb demo-orb-small demo-orb-b"></div>
          </div>

          <div class="hero-copy">
            <p class="eyebrow">Visual music playground</p>
            <h1 id="hero-title">Make sound feel <em>touchable.</em></h1>
            <p class="hero-description">
              Loop's foundation is ready. The next phases turn this space into a playground of living sounds,
              motion, effects, and musical surprises.
            </p>

            <div class="hero-actions">
              <button class="primary-action" type="button" data-enable-audio>Turn on sound</button>
              <span class="status-text" data-status aria-live="polite">Preparing the playground…</span>
            </div>
          </div>
        </section>

        <footer class="foundation-footer">
          <span>World: <strong data-world-name>New World</strong></span>
          <span data-capability-note></span>
        </footer>
      </main>
    `;

    const status = this.root.querySelector<HTMLElement>('[data-status]');
    const button = this.root.querySelector<HTMLButtonElement>('[data-enable-audio]');
    const worldName = this.root.querySelector<HTMLElement>('[data-world-name]');
    const capabilityNote = this.root.querySelector<HTMLElement>('[data-capability-note]');

    if (!status || !button || !worldName || !capabilityNote) {
      throw new Error('Loop shell failed to mount required controls.');
    }

    const requiredCapabilities = [
      capabilities.audio,
      capabilities.pointerEvents,
    ];

    capabilityNote.textContent = requiredCapabilities.every(Boolean)
      ? 'Ready for Phase 2'
      : 'Some browser capabilities are unavailable';

    button.disabled = !capabilities.audio;

    button.addEventListener('click', async () => {
      button.disabled = true;
      appStore.patch({ message: 'Turning on sound…' });

      try {
        const audio = await audioEngine.initialize();

        appStore.patch({
          audio: audio.state,
          message: audio.state === 'running' ? 'Sound is ready' : 'Sound needs browser permission',
        });
      } catch (error) {
        console.error('[Loop] Audio initialization failed.', error);
        appStore.patch({
          audio: 'idle',
          message: 'Sound could not start',
        });
      } finally {
        button.disabled = !capabilities.audio;
      }
    });

    this.unsubscribe = appStore.subscribe((state) => {
      status.textContent = state.message;
      worldName.textContent = state.world.name;

      const ready = state.audio === 'running';
      button.textContent = ready ? 'Sound ready' : 'Turn on sound';
      button.classList.toggle('is-ready', ready);
      button.disabled = ready || !capabilities.audio;
    });

    appStore.patch({
      boot: 'ready',
      message: capabilities.audio ? 'Ready to begin' : 'Audio is not supported in this browser',
    });
  }

  public destroy(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.root.replaceChildren();
  }
}
