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
  readonly selectedFieldId: string | null;
  readonly selectedToyId: string | null;
  readonly selectedLinkId: string | null;
  readonly palette: PaletteState | null;
  readonly effectPaletteOpen: boolean;
  readonly toyPaletteOpen: boolean;
  readonly patternEditorOrbId: string | null;
  readonly motionEditorOrbId: string | null;
  readonly linkEditorSourceOrbId: string | null;
  readonly linkEditorTargetOrbId: string | null;
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
  selectedFieldId: null,
  selectedToyId: null,
  selectedLinkId: null,
  palette: null,
  effectPaletteOpen: false,
  toyPaletteOpen: false,
  patternEditorOrbId: null,
  motionEditorOrbId: null,
  linkEditorSourceOrbId: null,
  linkEditorTargetOrbId: null,
  onboardingStep: 'move',
  playing: false,
  message: 'Pick a starting point.',
});
