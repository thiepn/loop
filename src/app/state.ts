import { Store } from '../core/state/Store';
import { createEmptyWorld, type WorldDocument } from '../core/world/World';
import type { AudioEngineState } from '../core/audio/AudioEngine';

export type AppBootState = 'booting' | 'ready' | 'error';

export interface AppState {
  readonly boot: AppBootState;
  readonly audio: AudioEngineState;
  readonly world: WorldDocument;
  readonly previewPlaying: boolean;
  readonly message: string;
}

export const appStore = new Store<AppState>({
  boot: 'booting',
  audio: 'idle',
  world: createEmptyWorld({
    id: 'phase-2-foundation-world',
    name: 'Foundation Groove',
    music: {
      bpm: 108,
      tonic: 0,
      scale: 'minor-pentatonic',
      seed: 1,
    },
  }),
  previewPlaying: false,
  message: 'Preparing the musical core…',
});
