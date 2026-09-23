import { Store } from '../core/state/Store';
import { createEmptyWorld, type WorldDocument } from '../core/world/World';
import type { AudioEngineState } from '../core/audio/AudioEngine';

export type AppBootState = 'booting' | 'ready' | 'error';

export interface AppState {
  readonly boot: AppBootState;
  readonly audio: AudioEngineState;
  readonly world: WorldDocument;
  readonly message: string;
}

export const appStore = new Store<AppState>({
  boot: 'booting',
  audio: 'idle',
  world: createEmptyWorld({
    id: 'phase-1-empty-world',
    name: 'New World',
  }),
  message: 'Preparing the playground…',
});
