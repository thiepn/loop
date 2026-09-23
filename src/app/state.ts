import { Store } from '../core/state/Store';
import { createPhaseThreeWorld, type WorldDocument } from '../core/world/World';
import type { AudioEngineState } from '../core/audio/AudioEngine';

export type AppBootState = 'booting' | 'ready' | 'error';

export interface AppState {
  readonly boot: AppBootState;
  readonly audio: AudioEngineState;
  readonly world: WorldDocument;
  readonly selectedOrbId: string | null;
  readonly playing: boolean;
  readonly message: string;
}

export const appStore = new Store<AppState>({
  boot: 'booting',
  audio: 'idle',
  world: createPhaseThreeWorld(0),
  selectedOrbId: null,
  playing: false,
  message: 'Tap play, then move a sound.',
});
