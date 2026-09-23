import { audioEngine } from '../core/audio/AudioEngine';
import { PlaygroundEngine, type OrbActivity } from '../core/music/PlaygroundEngine';
import type { DensityLevel, GrooveFeel } from '../core/music/Pattern';
import {
  clearOrbPattern,
  paintMelodyNote,
  paintRhythmStep,
  setOrbPatternDensity,
  setOrbPatternGroove,
  varyOrbPattern,
} from '../core/world/PatternActions';
import { detectCapabilities } from '../core/platform/capabilities';
import {
  paletteCategoryForRole,
  soundsForCategory,
  surpriseSoundForWorld,
  type SoundPaletteCategoryId,
} from '../core/sounds/SoundPalette';
import { soundById } from '../core/sounds/coreCatalog';
import {
  createStarterWorld,
  createSurpriseWorld,
  type StarterWorldId,
} from '../core/world/StarterWorlds';
import {
  addSoundOrb,
  deleteSoundOrb,
  duplicateSoundOrb,
  moveSoundOrb,
  replaceSoundOrb,
  soundOrbById,
  toggleSoundOrbMuted,
} from '../core/world/WorldActions';
import { MAX_SOUND_ORBS, type NormalizedPoint } from '../core/world/SoundOrb';
import { HomeView } from './HomeView';
import { PatternEditorView } from './PatternEditorView';
import { PlaygroundView } from './PlaygroundView';
import { appStore, type AppScreen, type AppState } from './state';

export class App {
  private unsubscribeStore: (() => void) | null = null;
  private unsubscribeActivity: (() => void) | null = null;
  private homeView: HomeView | null = null;
  private playgroundView: PlaygroundView | null = null;
  private patternEditorView: PatternEditorView | null = null;
  private playground: PlaygroundEngine | null = null;
  private mountedScreen: AppScreen | null = null;
  private onboardingComplete = false;
  private readonly activityTimers = new Set<ReturnType<typeof setTimeout>>();
  private readonly capabilities = detectCapabilities();

  public constructor(private readonly root: HTMLElement) {}

  public mount(): void {
    this.unsubscribeStore = appStore.subscribe((state) => {
      this.renderState(state);
      this.playground?.syncWorld(state.world);
    });

    appStore.patch({
      boot: 'ready',
      message: this.capabilities.audio
        ? 'Pick a starting point.'
        : 'Your browser cannot play Loop audio.',
    });
  }

  public destroy(): void {
    this.clearActivityTimers();
    this.clearPlaygroundRuntime();

    this.unsubscribeStore?.();
    this.unsubscribeStore = null;

    this.homeView?.destroy();
    this.homeView = null;

    this.patternEditorView?.destroy();
    this.patternEditorView = null;

    this.playgroundView?.destroy();
    this.playgroundView = null;
    this.mountedScreen = null;

    void audioEngine.close();
  }

  private renderState(state: Readonly<AppState>): void {
    if (state.screen !== this.mountedScreen) {
      this.homeView?.destroy();
      this.homeView = null;

      this.patternEditorView?.destroy();
      this.patternEditorView = null;

      this.playgroundView?.destroy();
      this.playgroundView = null;

      this.mountedScreen = state.screen;

      if (state.screen === 'home') {
        this.mountHome();
      } else {
        this.mountPlayground();
      }
    }

    this.playgroundView?.render(state);
    this.patternEditorView?.render(state);
  }

  private mountHome(): void {
    this.homeView = new HomeView(this.root, {
      onChooseStarter: (starterId) => {
        void this.chooseStarter(starterId);
      },
      onSurprise: () => {
        void this.chooseSurprise();
      },
    });
  }

  private mountPlayground(): void {
    this.playgroundView = new PlaygroundView(this.root, {
      onTogglePlayback: () => {
        void this.togglePlayback();
      },
      onOpenHome: () => {
        this.openHome();
      },
      onSelectOrb: (orbId) => {
        appStore.patch({ selectedOrbId: orbId });
      },
      onMovePreview: (orbId, position) => {
        this.playground?.updateOrbSpatial(orbId, position);
      },
      onMoveCommit: (orbId, position) => {
        this.commitMove(orbId, position);
      },
      onToggleMute: (orbId) => {
        this.toggleMute(orbId);
      },
      onDuplicate: (orbId) => {
        this.duplicateOrb(orbId);
      },
      onDelete: (orbId) => {
        this.deleteOrb(orbId);
      },
      onOpenAdd: () => {
        this.openAddPalette();
      },
      onOpenChange: (orbId) => {
        this.openChangePalette(orbId);
      },
      onOpenPattern: (orbId) => {
        appStore.patch({
          patternEditorOrbId: orbId,
          palette: null,
          message: 'Shape it however you like.',
        });
      },
      onClosePalette: () => {
        appStore.patch({ palette: null });
      },
      onSelectPaletteCategory: (category) => {
        this.selectPaletteCategory(category);
      },
      onChooseSound: (soundId) => {
        void this.chooseSound(soundId);
      },
      onSurpriseSound: () => {
        void this.chooseSurpriseSound();
      },
      onSkipOnboarding: () => {
        this.onboardingComplete = true;
        appStore.patch({
          onboardingStep: 'done',
          message: 'Explore freely.',
        });
      },
    });

    this.patternEditorView = new PatternEditorView(this.root, {
      onClose: () => {
        appStore.patch({ patternEditorOrbId: null });
      },
      onPaintRhythm: (orbId, step, active) => {
        this.applyPatternWorld(
          paintRhythmStep(appStore.getState().world, orbId, step, active),
          'Beat updated.',
        );
      },
      onPaintMelody: (orbId, step, degree) => {
        this.applyPatternWorld(
          paintMelodyNote(appStore.getState().world, orbId, step, degree),
          'Melody updated.',
        );
      },
      onDensity: (orbId, density) => {
        this.setPatternDensity(orbId, density);
      },
      onGroove: (orbId, groove) => {
        this.setPatternGroove(orbId, groove);
      },
      onClear: (orbId) => {
        this.applyPatternWorld(
          clearOrbPattern(appStore.getState().world, orbId),
          'Pattern cleared.',
        );
      },
      onVary: (orbId) => {
        this.applyPatternWorld(
          varyOrbPattern(appStore.getState().world, orbId),
          'Here’s another version.',
        );
      },
    });
  }

  private async chooseStarter(starterId: StarterWorldId): Promise<void> {
    const world = createStarterWorld(starterId);
    await this.enterWorld(world);
  }

  private async chooseSurprise(): Promise<void> {
    const world = createSurpriseWorld(Date.now());
    await this.enterWorld(world);
  }

  private async enterWorld(world: ReturnType<typeof createStarterWorld>): Promise<void> {
    this.clearActivityTimers();
    this.clearPlaygroundRuntime();

    const hasSounds = world.soundOrbs.length > 0;
    const onboardingStep = this.onboardingComplete
      ? 'done'
      : hasSounds
        ? 'move'
        : 'add';

    appStore.patch({
      screen: 'playground',
      world,
      selectedOrbId: null,
      palette: null,
      patternEditorOrbId: null,
      onboardingStep,
      playing: false,
      message: hasSounds
        ? 'Starting your World…'
        : 'Add something to begin.',
    });

    if (hasSounds) {
      await this.startPlayback();
    }
  }

  private openHome(): void {
    this.clearActivityTimers();
    this.clearPlaygroundRuntime();

    appStore.patch({
      screen: 'home',
      selectedOrbId: null,
      palette: null,
      patternEditorOrbId: null,
      playing: false,
      message: 'Pick a starting point.',
    });
  }

  private async togglePlayback(): Promise<void> {
    const state = appStore.getState();

    if (state.world.soundOrbs.length === 0) {
      this.openAddPalette();
      appStore.patch({ message: 'Add a sound first.' });
      return;
    }

    if (state.playing) {
      this.playground?.stop();
      appStore.patch({
        playing: false,
        message: 'Paused.',
      });
      return;
    }

    await this.startPlayback();
  }

  private async startPlayback(): Promise<void> {
    const state = appStore.getState();
    appStore.patch({ message: 'Starting your World…' });

    try {
      const audio = await audioEngine.initialize();
      const runtime = audioEngine.getRuntime();

      if (!runtime || audio.state !== 'running') {
        appStore.patch({
          audio: audio.state,
          playing: false,
          message: 'Tap Play to allow sound.',
        });
        return;
      }

      if (!this.playground) {
        this.playground = new PlaygroundEngine(
          runtime.context,
          runtime.destination,
          state.world,
        );
        this.unsubscribeActivity = this.playground.subscribeActivity((activity) => {
          this.scheduleVisualPulse(activity);
        });
      } else {
        this.playground.syncWorld(state.world);
      }

      this.playground.start();

      appStore.patch({
        audio: audio.state,
        playing: true,
        message: this.onboardingComplete
          ? 'Move anything. Hear what happens.'
          : 'Drag a sound.',
      });
    } catch (error) {
      console.error('[Loop] Playground playback failed.', error);
      appStore.patch({
        playing: false,
        message: 'Sound could not start.',
      });
    }
  }

  private commitMove(orbId: string, position: NormalizedPoint): void {
    const current = appStore.getState();
    const world = moveSoundOrb(current.world, orbId, position);

    if (world === current.world) {
      return;
    }

    let onboardingStep = current.onboardingStep;
    let message = 'Position changes how close and where the sound feels.';

    if (onboardingStep === 'move') {
      onboardingStep = 'near';
      message = 'Now bring a sound closer to YOU.';
    } else if (onboardingStep === 'near') {
      const distance = Math.hypot(position.x - 0.5, position.y - 0.5);

      if (distance <= 0.24) {
        onboardingStep = 'add';
        message = 'Nice. Now add something new.';
      } else {
        message = 'Bring it a little closer to YOU.';
      }
    }

    appStore.patch({
      world,
      onboardingStep,
      message,
    });
  }

  private toggleMute(orbId: string): void {
    const current = appStore.getState();
    const before = soundOrbById(current.world, orbId);

    if (!before) {
      return;
    }

    const world = toggleSoundOrbMuted(current.world, orbId);
    this.playground?.setOrbMuted(orbId, !before.muted);

    appStore.patch({
      world,
      message: before.muted ? 'Sound is back.' : 'Sound muted.',
    });
  }

  private duplicateOrb(orbId: string): void {
    const current = appStore.getState();
    const result = duplicateSoundOrb(current.world, orbId);

    if (!result.createdId) {
      appStore.patch({
        message: 'This World already has 12 sounds.',
      });
      return;
    }

    appStore.patch({
      world: result.world,
      selectedOrbId: result.createdId,
      message: 'Copy added. Put it somewhere different.',
    });
  }

  private deleteOrb(orbId: string): void {
    const current = appStore.getState();
    const world = deleteSoundOrb(current.world, orbId);

    if (world === current.world) {
      return;
    }

    appStore.patch({
      world,
      selectedOrbId: current.selectedOrbId === orbId ? null : current.selectedOrbId,
      patternEditorOrbId: current.patternEditorOrbId === orbId ? null : current.patternEditorOrbId,
      message: world.soundOrbs.length > 0
        ? 'Sound removed.'
        : 'Your World is quiet. Add something.',
    });
  }

  private openAddPalette(): void {
    const current = appStore.getState();

    if (current.world.soundOrbs.length >= MAX_SOUND_ORBS) {
      appStore.patch({
        message: 'This World already has 12 sounds.',
      });
      return;
    }

    appStore.patch({
      palette: {
        mode: 'add',
        category: 'beat',
      },
      patternEditorOrbId: null,
      selectedOrbId: null,
      message: 'Pick anything that sounds interesting.',
    });
  }

  private openChangePalette(orbId: string): void {
    const current = appStore.getState();
    const orb = soundOrbById(current.world, orbId);

    if (!orb) {
      return;
    }

    appStore.patch({
      palette: {
        mode: 'replace',
        orbId,
        category: paletteCategoryForRole(orb.role),
      },
      patternEditorOrbId: null,
      message: 'Choose a different sound.',
    });
  }

  private selectPaletteCategory(category: SoundPaletteCategoryId): void {
    const current = appStore.getState();

    if (!current.palette) {
      return;
    }

    appStore.patch({
      palette: current.palette.mode === 'replace'
        ? {
            mode: 'replace',
            orbId: current.palette.orbId,
            category,
          }
        : {
            mode: 'add',
            category,
          },
    });
  }

  private async chooseSound(soundId: string): Promise<void> {
    const current = appStore.getState();
    const sound = soundById(soundId);
    const palette = current.palette;

    if (!sound || !palette) {
      return;
    }

    if (palette.mode === 'replace') {
      const world = replaceSoundOrb(current.world, palette.orbId, sound);

      appStore.patch({
        world,
        selectedOrbId: palette.orbId,
        palette: null,
        patternEditorOrbId: null,
        message: `${sound.name} is now playing here.`,
      });
      return;
    }

    const result = addSoundOrb(current.world, sound);

    if (!result.createdId) {
      appStore.patch({
        palette: null,
        message: 'This World already has 12 sounds.',
      });
      return;
    }

    const completesOnboarding = current.onboardingStep === 'add';

    if (completesOnboarding) {
      this.onboardingComplete = true;
    }

    appStore.patch({
      world: result.world,
      selectedOrbId: result.createdId,
      palette: null,
      patternEditorOrbId: null,
      onboardingStep: completesOnboarding ? 'done' : current.onboardingStep,
      message: completesOnboarding
        ? 'That’s it. Now just play.'
        : `${sound.name} added.`,
    });

    if (!current.playing) {
      await this.startPlayback();
    }
  }

  private async chooseSurpriseSound(): Promise<void> {
    const current = appStore.getState();
    const palette = current.palette;

    if (!palette) {
      return;
    }

    if (palette.mode === 'replace') {
      const orb = soundOrbById(current.world, palette.orbId);
      const choices = soundsForCategory(palette.category).filter((sound) => sound.id !== orb?.soundId);
      const index = (current.world.music.seed + current.world.soundOrbs.length * 13) % Math.max(1, choices.length);
      const sound = choices[index] ?? soundsForCategory(palette.category)[0];

      if (sound) {
        await this.chooseSound(sound.id);
      }
      return;
    }

    const sound = surpriseSoundForWorld(current.world);
    if (sound) {
      await this.chooseSound(sound.id);
    }
  }

  private setPatternDensity(orbId: string, density: DensityLevel): void {
    const labels: Record<DensityLevel, string> = {
      sparse: 'Made it simpler.',
      balanced: 'Balanced the pattern.',
      busy: 'Made it busier.',
    };

    this.applyPatternWorld(
      setOrbPatternDensity(appStore.getState().world, orbId, density),
      labels[density],
    );
  }

  private setPatternGroove(orbId: string, groove: GrooveFeel): void {
    const labels: Record<GrooveFeel, string> = {
      straight: 'Playing it straight.',
      bounce: 'Added some bounce.',
      loose: 'Loosened the feel.',
    };

    this.applyPatternWorld(
      setOrbPatternGroove(appStore.getState().world, orbId, groove),
      labels[groove],
    );
  }

  private applyPatternWorld(world: AppState['world'], message: string): void {
    const current = appStore.getState();

    if (world === current.world) {
      return;
    }

    appStore.patch({
      world,
      message,
    });
  }

  private clearPlaygroundRuntime(): void {
    this.unsubscribeActivity?.();
    this.unsubscribeActivity = null;

    this.playground?.dispose();
    this.playground = null;
  }

  private clearActivityTimers(): void {
    for (const timer of this.activityTimers) {
      clearTimeout(timer);
    }
    this.activityTimers.clear();
  }

  private scheduleVisualPulse(activity: OrbActivity): void {
    const runtime = audioEngine.getRuntime();

    if (!runtime) {
      return;
    }

    const delayMs = Math.max(
      0,
      (activity.time - runtime.context.currentTime) * 1000,
    );

    const timer = setTimeout(() => {
      this.activityTimers.delete(timer);
      this.playgroundView?.pulseOrb(activity.orbId, activity.intensity);
    }, delayMs);

    this.activityTimers.add(timer);
  }
}
