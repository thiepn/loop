import type { AudioEngineState } from '../core/audio/AudioEngine';
import type {
  AutosaveStatus,
  PersistenceStatus,
  WorldLibraryItem,
} from '../core/persistence/PersistenceTypes';
import type {
  MagicIntent,
  MagicStrength,
  MagicTarget,
} from '../core/world/Magic';
import type { SoundPaletteCategoryId } from '../core/sounds/SoundPalette';
import type { VisualQuality } from '../core/visual/VisualQuality';
import { Store } from '../core/state/Store';
import { createStarterWorld } from '../core/world/StarterWorlds';
import type { WorldDocument } from '../core/world/World';

export type AppBootState = 'booting' | 'ready' | 'error';
export type AppScreen = 'home' | 'playground';
export type OnboardingStep = 'move' | 'near' | 'add' | 'done';

export type CaptureStatus =
  | 'idle'
  | 'recording'
  | 'processing'
  | 'ready'
  | 'error';

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

export interface MagicSessionState {
  readonly baseWorld: WorldDocument;
  readonly target: MagicTarget;
  readonly intent: MagicIntent;
  readonly strength: MagicStrength;
  readonly attempt: number;
  readonly seed: number;
  readonly summary: string;
}

export interface MagicUndoState {
  readonly beforeWorld: WorldDocument;
  readonly afterWorld: WorldDocument;
}

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
  readonly magicIntentOpen: boolean;
  readonly magicSession: MagicSessionState | null;
  readonly magicUndo: MagicUndoState | null;
  readonly persistence: PersistenceStatus;
  readonly autosave: AutosaveStatus;
  readonly library: readonly WorldLibraryItem[];
  readonly snapshotsOpen: boolean;
  readonly visualSettingsOpen: boolean;
  readonly visualQuality: VisualQuality;
  readonly visualReduceMotion: boolean;
  readonly visualReduceParticles: boolean;
  readonly visualReduceBloom: boolean;
  readonly pwaInstallAvailable: boolean;
  readonly pwaInstalled: boolean;
  readonly pwaUpdateReady: boolean;
  readonly pwaOffline: boolean;
  readonly captureStatus: CaptureStatus;
  readonly captureStartedAt: number | null;
  readonly captureDurationMs: number;
  readonly capturePreviewUrl: string | null;
  readonly captureFormatLabel: string | null;
  readonly captureWavAvailable: boolean;
  readonly captureAutoStopped: boolean;
  readonly captureError: string | null;
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
  magicIntentOpen: false,
  magicSession: null,
  magicUndo: null,
  persistence: 'loading',
  autosave: 'idle',
  library: [],
  snapshotsOpen: false,
  visualSettingsOpen: false,
  visualQuality: 'balanced',
  visualReduceMotion: false,
  visualReduceParticles: false,
  visualReduceBloom: false,
  pwaInstallAvailable: false,
  pwaInstalled: false,
  pwaUpdateReady: false,
  pwaOffline: false,
  captureStatus: 'idle',
  captureStartedAt: null,
  captureDurationMs: 0,
  capturePreviewUrl: null,
  captureFormatLabel: null,
  captureWavAvailable: false,
  captureAutoStopped: false,
  captureError: null,
  onboardingStep: 'move',
  playing: false,
  message: 'Loading your Worlds…',
});
