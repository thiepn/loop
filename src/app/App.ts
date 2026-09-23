import { audioEngine } from '../core/audio/AudioEngine';
import { FoundationGroove } from '../core/music/FoundationGroove';
import { detectCapabilities } from '../core/platform/capabilities';
import { appStore } from './state';

export class App {
  private unsubscribe: (() => void) | null = null;
  private groove: FoundationGroove | null = null;

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
          <span class="phase-pill">Musical Core</span>
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
            <p class="eyebrow">Smart musical foundation</p>
            <h1 id="hero-title">Everything stays <em>together.</em></h1>
            <p class="hero-description">
              Loop now has one shared musical clock, safe automatic levels, scale-aware pitch rules,
              and a small built-in sound system. This temporary groove proves the engine before
              Sound Orbs arrive in Phase 3.
            </p>

            <div class="hero-actions">
              <button class="primary-action" type="button" data-preview>Play foundation groove</button>
              <span class="status-text" data-status aria-live="polite">Preparing the musical core…</span>
            </div>
          </div>
        </section>

        <footer class="foundation-footer">
          <span>World: <strong data-world-name>Foundation Groove</strong></span>
          <span><strong data-tempo>108 BPM</strong> · smart sync</span>
        </footer>
      </main>
    `;

    const status = this.root.querySelector<HTMLElement>('[data-status]');
    const button = this.root.querySelector<HTMLButtonElement>('[data-preview]');
    const worldName = this.root.querySelector<HTMLElement>('[data-world-name]');
    const tempo = this.root.querySelector<HTMLElement>('[data-tempo]');

    if (!status || !button || !worldName || !tempo) {
      throw new Error('Loop shell failed to mount required controls.');
    }

    button.disabled = !capabilities.audio;

    button.addEventListener('click', async () => {
      button.disabled = true;

      try {
        if (this.groove?.isPlaying) {
          this.groove.stop();
          appStore.patch({
            previewPlaying: false,
            message: 'Ready to play',
          });
          return;
        }

        appStore.patch({ message: 'Starting the groove…' });

        const audio = await audioEngine.initialize();
        const runtime = audioEngine.getRuntime();

        if (!runtime || audio.state !== 'running') {
          appStore.patch({
            audio: audio.state,
            previewPlaying: false,
            message: 'Sound needs browser permission',
          });
          return;
        }

        const world = appStore.getState().world;

        this.groove ??= new FoundationGroove(
          runtime.context,
          runtime.destination,
          {
            bpm: world.music.bpm,
            harmony: {
              tonic: world.music.tonic,
              scale: world.music.scale,
            },
          },
        );

        this.groove.start();

        appStore.patch({
          audio: audio.state,
          previewPlaying: true,
          message: 'Everything is locked to the same beat',
        });
      } catch (error) {
        console.error('[Loop] Musical core preview failed.', error);
        appStore.patch({
          previewPlaying: false,
          message: 'The groove could not start',
        });
      } finally {
        button.disabled = !capabilities.audio;
      }
    });

    this.unsubscribe = appStore.subscribe((state) => {
      status.textContent = state.message;
      worldName.textContent = state.world.name;
      tempo.textContent = `${state.world.music.bpm} BPM`;

      button.textContent = state.previewPlaying
        ? 'Stop groove'
        : 'Play foundation groove';
      button.classList.toggle('is-ready', state.previewPlaying);
      button.disabled = !capabilities.audio;
    });

    appStore.patch({
      boot: 'ready',
      message: capabilities.audio
        ? 'Ready to play'
        : 'Audio is not supported in this browser',
    });
  }

  public destroy(): void {
    this.groove?.stop();
    this.groove = null;
    void audioEngine.close();

    this.unsubscribe?.();
    this.unsubscribe = null;
    this.root.replaceChildren();
  }
}
