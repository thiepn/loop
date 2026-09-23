import type { AudioEngineState } from '../core/audio/AudioEngine';
import type { SoundPaletteCategoryId } from '../core/sounds/SoundPalette';
import { Store } from '../core/state/Store';
import { createStarterWorld } from '../core/world/StarterWorlds';
import type { WorldDocument } from '../core/world/World';

export type AppBootState = 'booting' | 'ready' | 'error';
export type AppScreen = 'home' | 'playground';
export type OnboardingStep = 'move' | 'near' | 'add' | 'done';

export type PaletteState =
  | {
      readonly mode: 'add';
      readonly category: SoundPaletteCategoryId;
    }
  | {
      readonly mode: 'replace';
      readonly orbId: string;
      readonly category: SoundPaletteCategoryId;
    };

export interface AppState {
  readonly boot: AppBootState;
  readonly audio: AudioEngineState;
  readonly screen: AppScreen;
  readonly world: WorldDocument;
  readonly selectedOrbId: string | null;
  readonly palette: PaletteState | null;
  readonly patternEditorOrbId: string | null;
  readonly onboardingStep: OnboardingStep;
  readonly playing: boolean;
  readonly message: string;
}

export const appStore = new Store<AppState>({
  boot: 'booting',
  audio: 'idle',
  screen: 'home',
  world: createStarterWorld('dreamy', 0),
  selectedOrbId: null,
  palette: null,
  patternEditorOrbId: null,
  onboardingStep: 'move',
  playing: false,
  message: 'Pick a starting point.',
});
