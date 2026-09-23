import { audioEngine } from '../core/audio/AudioEngine';
import { PlaygroundEngine, type OrbActivity } from '../core/music/PlaygroundEngine';
import { detectCapabilities } from '../core/platform/capabilities';
import {
  deleteSoundOrb,
  duplicateSoundOrb,
  moveSoundOrb,
  soundOrbById,
  toggleSoundOrbMuted,
} from '../core/world/WorldActions';
import type { NormalizedPoint } from '../core/world/SoundOrb';
import { PlaygroundView } from './PlaygroundView';
import { appStore } from './state';

export class App {
  private unsubscribeStore: (() => void) | null = null;
  private unsubscribeActivity: (() => void) | null = null;
  private view: PlaygroundView | null = null;
  private playground: PlaygroundEngine | null = null;
  private readonly activityTimers = new Set<ReturnType<typeof setTimeout>>();

  public constructor(private readonly root: HTMLElement) {}

  public mount(): void {
    const capabilities = detectCapabilities();

    this.view = new PlaygroundView(this.root, {
      onTogglePlayback: () => {
        void this.togglePlayback();
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
    });

    this.unsubscribeStore = appStore.subscribe((state) => {
      this.view?.render(state);
      this.playground?.syncWorld(state.world);
    });

    appStore.patch({
      boot: 'ready',
      message: capabilities.audio
        ? 'Tap play, then move a sound.'
        : 'Audio is not supported in this browser.',
    });
  }

  public destroy(): void {
    for (const timer of this.activityTimers) {
      clearTimeout(timer);
    }
    this.activityTimers.clear();

    this.unsubscribeActivity?.();
    this.unsubscribeActivity = null;

    this.playground?.dispose();
    this.playground = null;

    this.unsubscribeStore?.();
    this.unsubscribeStore = null;

    this.view?.destroy();
    this.view = null;

    void audioEngine.close();
  }

  private async togglePlayback(): Promise<void> {
    const state = appStore.getState();

    if (state.playing) {
      this.playground?.stop();
      appStore.patch({
        playing: false,
        message: 'Paused. Move anything, then play again.',
      });
      return;
    }

    appStore.patch({ message: 'Starting your World…' });

    try {
      const audio = await audioEngine.initialize();
      const runtime = audioEngine.getRuntime();

      if (!runtime || audio.state !== 'running') {
        appStore.patch({
          audio: audio.state,
          playing: false,
          message: 'Sound needs browser permission.',
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
        message: 'Drag sounds around you.',
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

    appStore.patch({
      world,
      message: 'Position changes how close and where the sound feels.',
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
        message: 'This World already has the maximum 12 sounds.',
      });
      return;
    }

    appStore.patch({
      world: result.world,
      selectedOrbId: result.createdId,
      message: 'Sound duplicated. Try placing the copy somewhere else.',
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
      message: world.soundOrbs.length > 0
        ? 'Sound removed.'
        : 'Your World is quiet.',
    });
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
      this.view?.pulseOrb(activity.orbId, activity.intensity);
    }, delayMs);

    this.activityTimers.add(timer);
  }
}
