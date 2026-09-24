import { audioEngine } from '../core/audio/AudioEngine';
import {
  MAX_RECORDING_MS,
  MasterRecorder,
  type RecordingResult,
} from '../core/audio/MasterRecorder';
import {
  MAX_AUTOMATIC_WAV_CONVERSION_MS,
  convertRecordingToWav,
} from '../core/audio/RecordingExport';
import {
  decodeLoopBackup,
  encodeLoopBackup,
} from '../core/persistence/Backup';
import { IndexedDbWorldStorage } from '../core/persistence/IndexedDbWorldStorage';
import { classifyPersistenceError } from '../core/persistence/PersistenceError';
import { WorldRepository } from '../core/persistence/WorldRepository';
import {
  PlaygroundEngine,
  type LinkActivity,
  type OrbActivity,
} from '../core/music/PlaygroundEngine';
import {
  evaluateMotionFrame,
  worldHasActiveMotion,
} from '../core/music/MotionEngine';
import type { DensityLevel, GrooveFeel } from '../core/music/Pattern';
import { WorldHistory } from '../core/state/WorldHistory';
import type { MotionMode, MotionRange, MotionSpeed } from '../core/world/Motion';
import type { LinkType } from '../core/world/Link';
import {
  addLink,
  deleteLink,
} from '../core/world/LinkActions';
import {
  magicTargetExists,
  mutateWithMagic,
  type MagicIntent,
  type MagicStrength,
  type MagicTarget,
} from '../core/world/Magic';
import {
  setOrbFollowTarget,
  setOrbMotionMode,
  setOrbMotionRange,
  setOrbMotionSpeed,
} from '../core/world/MotionActions';
import {
  addEffectField,
  deleteEffectField,
  moveEffectField,
  resizeEffectField,
} from '../core/world/EffectFieldActions';
import type { EffectFieldDocument, EffectFieldType } from '../core/world/EffectField';
import {
  addPlaygroundToy,
  deletePlaygroundToy,
  movePlaygroundToy,
  movePortalExit,
} from '../core/world/PlaygroundToyActions';
import type {
  PlaygroundToyDocument,
  PlaygroundToyType,
} from '../core/world/PlaygroundToy';
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
  addSnapshot,
  deleteSnapshot,
  recallSnapshot,
  renameSnapshot,
} from '../core/world/Snapshot';
import {
  renameWorld,
} from '../core/world/WorldLibraryActions';
import type { WorldDocument } from '../core/world/World';
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
import { CaptureView } from './CaptureView';
import { EffectFieldView } from './EffectFieldView';
import { HomeView } from './HomeView';
import { LinkView } from './LinkView';
import { MagicView } from './MagicView';
import { MotionView } from './MotionView';
import { PatternEditorView } from './PatternEditorView';
import { PersistenceView } from './PersistenceView';
import { PlaygroundView } from './PlaygroundView';
import { appStore, type AppScreen, type AppState } from './state';

export class App {
  private unsubscribeStore: (() => void) | null = null;
  private unsubscribeActivity: (() => void) | null = null;
  private unsubscribeLinkActivity: (() => void) | null = null;
  private homeView: HomeView | null = null;
  private playgroundView: PlaygroundView | null = null;
  private captureView: CaptureView | null = null;
  private effectFieldView: EffectFieldView | null = null;
  private linkView: LinkView | null = null;
  private magicView: MagicView | null = null;
  private motionView: MotionView | null = null;
  private patternEditorView: PatternEditorView | null = null;
  private persistenceView: PersistenceView | null = null;
  private playground: PlaygroundEngine | null = null;
  private mountedScreen: AppScreen | null = null;
  private onboardingComplete = false;
  private motionFrameRequest: number | null = null;
  private motionEpochMs: number | null = null;
  private readonly liveOrbOverrides = new Map<string, NormalizedPoint>();
  private readonly fieldPreviewOverrides = new Map<string, EffectFieldDocument>();
  private readonly toyPreviewOverrides = new Map<string, PlaygroundToyDocument>();
  private readonly activityTimers = new Set<ReturnType<typeof setTimeout>>();
  private readonly masterRecorder = new MasterRecorder();
  private captureResult: RecordingResult | null = null;
  private captureWavBlob: Blob | null = null;
  private capturePreviewUrl: string | null = null;
  private captureTimer: ReturnType<typeof setInterval> | null = null;
  private readonly storage = new IndexedDbWorldStorage();
  private readonly repository = new WorldRepository(this.storage);
  private readonly history = new WorldHistory(appStore.getState().world);
  private persistenceReady = false;
  private autosaveTimer: ReturnType<typeof setTimeout> | null = null;
  private autosavePendingWorld: WorldDocument | null = null;
  private autosaveInFlightWorld: WorldDocument | null = null;
  private lastSavedWorld: WorldDocument | null = null;
  private snapshotRecallTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingHomeSave: Promise<void> | null = null;
  private bootstrapInteractionOccurred = false;
  private readonly handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      void this.flushAutosave();

      if (this.masterRecorder.isRecording) {
        void this.stopCapture(
          false,
          'Recording stopped when Loop went into the background.',
        );
      }
    }
  };
  private readonly handleHistoryShortcut = (event: KeyboardEvent) => {
    const target = event.target;

    if (
      target instanceof HTMLInputElement
      || target instanceof HTMLTextAreaElement
      || target instanceof HTMLSelectElement
      || (
        target instanceof HTMLElement
        && target.isContentEditable
      )
    ) {
      return;
    }

    if (
      appStore.getState().screen !== 'playground'
      || appStore.getState().magicSession
      || (!event.ctrlKey && !event.metaKey)
    ) {
      return;
    }

    const key = event.key.toLowerCase();

    if (key === 'z' && event.shiftKey) {
      event.preventDefault();
      this.redoWorld();
      return;
    }

    if (key === 'z') {
      event.preventDefault();
      this.undoWorld();
      return;
    }

    if (key === 'y') {
      event.preventDefault();
      this.redoWorld();
    }
  };
  private readonly capabilities = detectCapabilities();

  public constructor(private readonly root: HTMLElement) {}

  public mount(): void {
    document.addEventListener(
      'visibilitychange',
      this.handleVisibilityChange,
    );
    window.addEventListener(
      'keydown',
      this.handleHistoryShortcut,
    );

    this.unsubscribeStore = appStore.subscribe((state) => {
      this.trackHistory(state);
      this.renderState(state);
      this.playground?.syncWorld(state.world);
      this.scheduleAutosave(state);
    });

    void this.initializePersistence();
  }

  public destroy(): void {
    this.clearActivityTimers();
    this.discardCapture(false);
    this.cancelAutosave();
    this.cancelSnapshotRecall();
    this.cancelMotionLoop();
    this.clearPlaygroundRuntime();

    this.unsubscribeStore?.();
    this.unsubscribeStore = null;

    this.homeView?.destroy();
    this.homeView = null;

    this.patternEditorView?.destroy();
    this.patternEditorView = null;

    this.persistenceView?.destroy();
    this.persistenceView = null;

    this.captureView?.destroy();
    this.captureView = null;

    this.motionView?.destroy();
    this.motionView = null;

    this.linkView?.destroy();
    this.linkView = null;

    this.magicView?.destroy();
    this.magicView = null;

    this.effectFieldView?.destroy();
    this.effectFieldView = null;

    this.playgroundView?.destroy();
    this.playgroundView = null;
    this.mountedScreen = null;

    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange,
    );
    window.removeEventListener(
      'keydown',
      this.handleHistoryShortcut,
    );
    this.storage.close();
    void audioEngine.close();
  }

  private renderState(state: Readonly<AppState>): void {
    if (state.screen !== this.mountedScreen) {
      this.homeView?.destroy();
      this.homeView = null;

      this.patternEditorView?.destroy();
      this.patternEditorView = null;

      this.persistenceView?.destroy();
      this.persistenceView = null;

      this.captureView?.destroy();
      this.captureView = null;

      this.motionView?.destroy();
      this.motionView = null;

      this.linkView?.destroy();
      this.linkView = null;

      this.magicView?.destroy();
      this.magicView = null;

      this.effectFieldView?.destroy();
      this.effectFieldView = null;

      this.playgroundView?.destroy();
      this.playgroundView = null;

      this.mountedScreen = state.screen;

      if (state.screen === 'home') {
        this.mountHome();
      } else {
        this.mountPlayground();
      }
    }

    this.homeView?.render(state);
    this.playgroundView?.render(state);
    this.persistenceView?.render(state, {
      canUndo: this.history.canUndo,
      canRedo: this.history.canRedo,
    });
    this.captureView?.render(state, this.root);
    this.effectFieldView?.render(state);
    this.linkView?.render(state);
    this.magicView?.render(state);
    this.motionView?.render(state);
    this.patternEditorView?.render(state);
    this.syncMotionLoop(state);
  }

  private mountHome(): void {
    this.homeView = new HomeView(this.root, {
      onChooseStarter: (starterId) => {
        void this.chooseStarter(starterId);
      },
      onSurprise: () => {
        void this.chooseSurprise();
      },
      onOpenWorld: (worldId) => {
        void this.openLibraryWorld(worldId);
      },
      onRenameWorld: (worldId, name) => {
        void this.renameLibraryWorld(worldId, name);
      },
      onDuplicateWorld: (worldId) => {
        void this.duplicateLibraryWorld(worldId);
      },
      onTrashWorld: (worldId) => {
        void this.trashLibraryWorld(worldId);
      },
      onRestoreWorld: (worldId) => {
        void this.restoreLibraryWorld(worldId);
      },
      onPurgeWorld: (worldId) => {
        void this.purgeLibraryWorld(worldId);
      },
      onExportWorld: (worldId) => {
        void this.exportLibraryWorld(worldId);
      },
      onExportAll: () => {
        void this.exportAllWorlds();
      },
      onImportBackup: (text) => {
        void this.importBackup(text);
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
        appStore.patch({
          selectedOrbId: orbId,
          selectedFieldId: null,
          selectedToyId: null,
          selectedLinkId: null,
        });
      },
      onMovePreview: (orbId, position) => {
        this.liveOrbOverrides.set(orbId, position);

        const updates = this.playground?.updateOrbSpatial(
          orbId,
          position,
        ) ?? new Map([[orbId, position]]);

        for (const [changedOrbId, changedPosition] of updates) {
          this.playgroundView?.previewOrbPosition(
            changedOrbId,
            changedPosition,
          );
          this.effectFieldView?.previewOrbEffect(
            changedOrbId,
            changedPosition,
            appStore.getState().world.effectFields,
          );
          this.linkView?.previewOrbPosition(
            changedOrbId,
            changedPosition,
          );
        }
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
          motionEditorOrbId: null,
          linkEditorSourceOrbId: null,
          linkEditorTargetOrbId: null,
          selectedLinkId: null,
          palette: null,
          effectPaletteOpen: false,
          toyPaletteOpen: false,
          selectedFieldId: null,
          selectedToyId: null,
          message: 'Shape it however you like.',
        });
      },
      onOpenMotion: (orbId) => {
        appStore.patch({
          motionEditorOrbId: orbId,
          patternEditorOrbId: null,
          linkEditorSourceOrbId: null,
          linkEditorTargetOrbId: null,
          selectedLinkId: null,
          palette: null,
          effectPaletteOpen: false,
          toyPaletteOpen: false,
          selectedFieldId: null,
          selectedToyId: null,
          message: 'Give this sound some motion.',
        });
      },
      onOpenLink: (orbId) => {
        appStore.patch({
          linkEditorSourceOrbId: orbId,
          linkEditorTargetOrbId: null,
          patternEditorOrbId: null,
          motionEditorOrbId: null,
          palette: null,
          effectPaletteOpen: false,
          toyPaletteOpen: false,
          selectedFieldId: null,
          selectedToyId: null,
          selectedLinkId: null,
          message: 'Choose another sound to connect.',
        });
      },
      onMagicOrb: (orbId) => {
        this.startMagicPreview({
          kind: 'orb',
          id: orbId,
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

    this.captureView = new CaptureView(
      this.root,
      this.capabilities.recording,
      {
        onStart: () => {
          void this.startCapture();
        },
        onStop: () => {
          void this.stopCapture();
        },
        onCancel: () => {
          void this.cancelCapture();
        },
        onDownloadOriginal: () => {
          this.downloadCapture(false);
        },
        onDownloadWav: () => {
          this.downloadCapture(true);
        },
        onDiscard: () => {
          this.discardCapture();
        },
      },
    );

    this.effectFieldView = new EffectFieldView(this.root, {
      onOpenPalette: () => {
        appStore.patch({
          effectPaletteOpen: true,
          toyPaletteOpen: false,
          palette: null,
          patternEditorOrbId: null,
          motionEditorOrbId: null,
          linkEditorSourceOrbId: null,
          linkEditorTargetOrbId: null,
          selectedOrbId: null,
          selectedFieldId: null,
          selectedToyId: null,
          selectedLinkId: null,
          message: 'Add a field, then move sounds through it.',
        });
      },
      onClosePalette: () => {
        appStore.patch({ effectPaletteOpen: false });
      },
      onAddField: (type) => {
        this.addField(type);
      },
      onSelectField: (fieldId) => {
        appStore.patch({
          selectedFieldId: fieldId,
          selectedOrbId: null,
          selectedToyId: null,
          selectedLinkId: null,
          palette: null,
          patternEditorOrbId: null,
          motionEditorOrbId: null,
          linkEditorSourceOrbId: null,
          linkEditorTargetOrbId: null,
        });
      },
      onMovePreview: (field) => {
        this.previewField(field);
      },
      onMoveCommit: (fieldId, position) => {
        this.commitFieldMove(fieldId, position);
      },
      onResizePreview: (field) => {
        this.previewField(field);
      },
      onResizeCommit: (fieldId, radius) => {
        this.commitFieldResize(fieldId, radius);
      },
      onDeleteField: (fieldId) => {
        this.deleteField(fieldId);
      },
      onMagicField: (fieldId) => {
        this.startMagicPreview({
          kind: 'field',
          id: fieldId,
        });
      },
    });

    this.linkView = new LinkView(this.root, {
      onCloseEditor: () => {
        appStore.patch({
          linkEditorSourceOrbId: null,
          linkEditorTargetOrbId: null,
        });
      },
      onChooseTarget: (targetOrbId) => {
        appStore.patch({ linkEditorTargetOrbId: targetOrbId });
      },
      onCreateLink: (type) => {
        this.createLinkRelationship(type);
      },
      onSelectLink: (linkId) => {
        appStore.patch({
          selectedLinkId: linkId,
          selectedOrbId: null,
          selectedFieldId: null,
          selectedToyId: null,
          linkEditorSourceOrbId: null,
          linkEditorTargetOrbId: null,
          patternEditorOrbId: null,
          motionEditorOrbId: null,
          palette: null,
          effectPaletteOpen: false,
          toyPaletteOpen: false,
        });
      },
      onDeleteLink: (linkId) => {
        this.deleteLinkRelationship(linkId);
      },
    });

    this.motionView = new MotionView(this.root, {
      onCloseMotion: () => {
        appStore.patch({ motionEditorOrbId: null });
      },
      onSetMotionMode: (orbId, mode) => {
        this.applyMotionWorld(
          setOrbMotionMode(appStore.getState().world, orbId, mode),
          mode === 'still' ? 'Motion stopped.' : `${this.motionModeLabel(mode)} motion active.`,
        );
      },
      onSetMotionSpeed: (orbId, speed) => {
        this.applyMotionWorld(
          setOrbMotionSpeed(appStore.getState().world, orbId, speed),
          `${this.motionSpeedLabel(speed)} motion speed.`,
        );
      },
      onSetMotionRange: (orbId, range) => {
        this.applyMotionWorld(
          setOrbMotionRange(appStore.getState().world, orbId, range),
          `${this.motionRangeLabel(range)} motion range.`,
        );
      },
      onSetFollowTarget: (orbId, targetOrbId) => {
        this.applyMotionWorld(
          setOrbFollowTarget(appStore.getState().world, orbId, targetOrbId),
          'Now following that sound.',
        );
      },
      onOpenToyPalette: () => {
        appStore.patch({
          toyPaletteOpen: true,
          effectPaletteOpen: false,
          palette: null,
          patternEditorOrbId: null,
          motionEditorOrbId: null,
          selectedOrbId: null,
          selectedFieldId: null,
          selectedToyId: null,
          selectedLinkId: null,
          linkEditorSourceOrbId: null,
          linkEditorTargetOrbId: null,
          message: 'Add a toy to change how sounds move.',
        });
      },
      onCloseToyPalette: () => {
        appStore.patch({ toyPaletteOpen: false });
      },
      onAddToy: (type) => {
        this.addToy(type);
      },
      onSelectToy: (toyId) => {
        appStore.patch({
          selectedToyId: toyId,
          selectedOrbId: null,
          selectedFieldId: null,
          selectedLinkId: null,
          linkEditorSourceOrbId: null,
          linkEditorTargetOrbId: null,
          palette: null,
          effectPaletteOpen: false,
          patternEditorOrbId: null,
          motionEditorOrbId: null,
        });
      },
      onToyPreview: (toy) => {
        this.toyPreviewOverrides.set(toy.id, toy);
        this.playground?.previewPlaygroundToy(toy);
      },
      onToyMoveCommit: (toyId, position) => {
        this.commitToyMove(toyId, position);
      },
      onPortalExitCommit: (toyId, position) => {
        this.commitPortalExitMove(toyId, position);
      },
      onToyPreviewEnd: (toyId) => {
        this.toyPreviewOverrides.delete(toyId);
        this.playground?.releasePlaygroundToyPreview(toyId);
      },
      onDeleteToy: (toyId) => {
        this.deleteToy(toyId);
      },
      onMagicToy: (toyId) => {
        this.startMagicPreview({
          kind: 'toy',
          id: toyId,
        });
      },
    });

    this.magicView = new MagicView(this.root, {
      onOpenRemix: () => {
        this.openRemixIntent();
      },
      onCloseRemix: () => {
        appStore.patch({ magicIntentOpen: false });
      },
      onStartRemix: (intent) => {
        this.startMagicPreview(
          { kind: 'world' },
          intent,
          'playful',
        );
      },
      onRetry: () => {
        this.retryMagicPreview();
      },
      onKeep: () => {
        this.keepMagicPreview();
      },
      onRevert: () => {
        this.revertMagicPreview();
      },
      onStrength: (strength) => {
        this.changeMagicStrength(strength);
      },
      onUndo: () => {
        this.undoLastMagic();
      },
    });

    this.persistenceView = new PersistenceView(this.root, {
      onOpenSnapshots: () => {
        appStore.patch({
          snapshotsOpen: true,
          palette: null,
          effectPaletteOpen: false,
          toyPaletteOpen: false,
          patternEditorOrbId: null,
          motionEditorOrbId: null,
          linkEditorSourceOrbId: null,
          linkEditorTargetOrbId: null,
          magicIntentOpen: false,
          selectedOrbId: null,
          selectedFieldId: null,
          selectedToyId: null,
          selectedLinkId: null,
        });
      },
      onCloseSnapshots: () => {
        appStore.patch({ snapshotsOpen: false });
      },
      onSaveSnapshot: (name) => {
        this.saveSnapshot(name);
      },
      onRecallSnapshot: (snapshotId) => {
        this.queueSnapshotRecall(snapshotId);
      },
      onRenameSnapshot: (snapshotId, name) => {
        this.renameWorldSnapshot(snapshotId, name);
      },
      onDeleteSnapshot: (snapshotId) => {
        this.deleteWorldSnapshot(snapshotId);
      },
      onUndo: () => {
        this.undoWorld();
      },
      onRedo: () => {
        this.redoWorld();
      },
      onRenameWorld: (name) => {
        this.renameCurrentWorld(name);
      },
      onExportCurrent: () => {
        this.exportCurrentWorld();
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

  private async initializePersistence(): Promise<void> {
    try {
      const active = await this.repository.loadActiveWorld();
      const library = await this.repository.listLibrary();

      this.persistenceReady = true;

      if (
        active
        && !this.bootstrapInteractionOccurred
        && appStore.getState().screen === 'home'
      ) {
        this.history.reset(active.world);
        this.lastSavedWorld = active.world;

        appStore.patch({
          boot: 'ready',
          persistence: 'ready',
          autosave: 'saved',
          library,
          screen: 'playground',
          world: active.world,
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
          snapshotsOpen: false,
          onboardingStep: 'done',
          playing: false,
          message: active.warnings.length > 0
            ? `World restored with ${active.warnings.length} repair${active.warnings.length === 1 ? '' : 's'}. Press Play.`
            : 'World restored. Press Play.',
        });
        return;
      }

      const current = appStore.getState();

      appStore.patch({
        boot: 'ready',
        persistence: 'ready',
        autosave: current.screen === 'playground'
          ? current.autosave
          : 'idle',
        library,
        message: current.screen === 'playground'
          ? current.message
          : this.capabilities.audio
            ? 'Pick a starting point.'
            : 'Your browser cannot play Loop audio.',
      });
    } catch (error) {
      const failure = classifyPersistenceError(error);
      this.persistenceReady = false;

      appStore.patch({
        boot: 'ready',
        persistence: 'error',
        autosave: 'error',
        library: [],
        message: `Local saving unavailable: ${failure.message}`,
      });
    }
  }

  private trackHistory(state: Readonly<AppState>): void {
    if (state.magicSession) {
      return;
    }

    if (state.world !== this.history.present) {
      if (this.snapshotRecallTimer !== null) {
        this.cancelSnapshotRecall();
      }

      this.history.record(state.world);
    }
  }

  private scheduleAutosave(state: Readonly<AppState>): void {
    if (
      !this.persistenceReady
      || state.persistence !== 'ready'
      || state.screen !== 'playground'
      || state.magicSession
      || state.world === this.lastSavedWorld
      || state.world === this.autosavePendingWorld
      || state.world === this.autosaveInFlightWorld
    ) {
      return;
    }

    if (this.autosaveTimer !== null) {
      clearTimeout(this.autosaveTimer);
    }

    this.autosavePendingWorld = state.world;
    this.autosaveTimer = setTimeout(() => {
      this.autosaveTimer = null;
      void this.flushAutosave();
    }, 450);
  }

  private async flushAutosave(): Promise<void> {
    const world = this.autosavePendingWorld;

    if (!world || !this.persistenceReady) {
      return;
    }

    this.autosavePendingWorld = null;
    this.autosaveInFlightWorld = world;

    if (appStore.getState().autosave !== 'saving') {
      appStore.patch({ autosave: 'saving' });
    }

    try {
      await this.repository.saveWorld(world);
      await this.repository.setActiveWorld(world.id);
      this.lastSavedWorld = world;

      if (appStore.getState().world === world) {
        appStore.patch({ autosave: 'saved' });
      }

      await this.refreshLibrary();
    } catch (error) {
      this.handlePersistenceFailure(error, 'Autosave failed');
    } finally {
      this.autosaveInFlightWorld = null;

      const current = appStore.getState();
      if (
        this.persistenceReady
        && current.screen === 'playground'
        && !current.magicSession
        && current.world !== this.lastSavedWorld
      ) {
        this.scheduleAutosave(current);
      }
    }
  }

  private cancelAutosave(): void {
    if (this.autosaveTimer !== null) {
      clearTimeout(this.autosaveTimer);
      this.autosaveTimer = null;
    }

    this.autosavePendingWorld = null;
  }

  private async refreshLibrary(): Promise<void> {
    if (!this.persistenceReady) {
      return;
    }

    try {
      const library = await this.repository.listLibrary();
      appStore.patch({ library });
    } catch (error) {
      this.handlePersistenceFailure(error, 'Could not refresh Worlds');
    }
  }

  private handlePersistenceFailure(
    error: unknown,
    prefix: string,
  ): void {
    const failure = classifyPersistenceError(error);

    appStore.patch({
      persistence: 'error',
      autosave: 'error',
      message: `${prefix}: ${failure.message}`,
    });
  }

  private async chooseStarter(starterId: StarterWorldId): Promise<void> {
    this.bootstrapInteractionOccurred = true;
    const world = createStarterWorld(starterId);
    await this.enterWorld(world, {
      autoPlay: true,
      saveBeforeEnter: true,
    });
  }

  private async chooseSurprise(): Promise<void> {
    this.bootstrapInteractionOccurred = true;
    const world = createSurpriseWorld(Date.now());
    await this.enterWorld(world, {
      autoPlay: true,
      saveBeforeEnter: true,
    });
  }

  private async enterWorld(
    world: WorldDocument,
    options: {
      readonly autoPlay?: boolean;
      readonly saveBeforeEnter?: boolean;
    } = {},
  ): Promise<void> {
    const autoPlay = options.autoPlay ?? true;
    const saveBeforeEnter = options.saveBeforeEnter ?? true;

    this.clearActivityTimers();
    this.discardCapture();
    this.cancelSnapshotRecall();
    this.clearPlaygroundRuntime();
    this.history.reset(world);

    if (this.persistenceReady) {
      this.lastSavedWorld = world;
      this.cancelAutosave();
    }

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
      snapshotsOpen: false,
      onboardingStep,
      playing: false,
      autosave: this.persistenceReady ? 'saved' : 'error',
      message: hasSounds && autoPlay
        ? 'Starting your World…'
        : hasSounds
          ? 'World opened. Press Play.'
          : 'Add something to begin.',
    });

    const playbackPromise = hasSounds && autoPlay
      ? this.startPlayback()
      : Promise.resolve();

    if (this.pendingHomeSave) {
      await this.pendingHomeSave;
    }

    if (this.persistenceReady) {
      try {
        if (saveBeforeEnter) {
          await this.repository.saveWorld(world);
        }

        await this.repository.setActiveWorld(world.id);
        await this.refreshLibrary();
      } catch (error) {
        this.handlePersistenceFailure(error, 'Could not save World');
      }
    }

    await playbackPromise;
  }

  private openHome(): void {
    const current = appStore.getState();
    const leavingWorld = current.magicSession?.baseWorld ?? current.world;

    this.clearActivityTimers();
    this.discardCapture();
    this.cancelAutosave();
    this.cancelSnapshotRecall();
    this.clearPlaygroundRuntime();

    this.bootstrapInteractionOccurred = true;

    if (this.persistenceReady) {
      const save = (async () => {
        try {
          await this.repository.saveWorld(leavingWorld);
          this.lastSavedWorld = leavingWorld;
          await this.repository.setActiveWorld(null);
          await this.refreshLibrary();
        } catch (error) {
          this.handlePersistenceFailure(
            error,
            'Could not finish saving World',
          );
        }
      })();

      const trackedSave = save.finally(() => {
        if (this.pendingHomeSave === trackedSave) {
          this.pendingHomeSave = null;
        }
      });

      this.pendingHomeSave = trackedSave;
    }

    appStore.patch({
      screen: 'home',
      world: leavingWorld,
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
      snapshotsOpen: false,
      playing: false,
      message: 'Pick a starting point.',
    });
  }

  private async startCapture(): Promise<void> {
    const initial = appStore.getState();

    if (!this.capabilities.recording) {
      appStore.patch({
        captureStatus: 'error',
        captureError: 'Performance recording is not supported in this browser.',
        message: 'This browser cannot record Loop performances.',
      });
      return;
    }

    if (
      initial.captureStatus === 'recording'
      || initial.captureStatus === 'processing'
    ) {
      return;
    }

    if (initial.world.soundOrbs.length === 0) {
      appStore.patch({
        message: 'Add a sound before recording a performance.',
      });
      return;
    }

    this.discardCapture(false);

    await this.startPlayback();

    if (!appStore.getState().playing) {
      appStore.patch({
        captureStatus: 'error',
        captureError: 'Audio could not start.',
        message: 'Recording could not start because audio is not running.',
      });
      return;
    }

    try {
      await this.masterRecorder.start(
        audioEngine,
        {
          maxDurationMs: MAX_RECORDING_MS,
          onLimitReached: () => {
            void this.stopCapture(
              true,
              'Recording reached the 10 minute safety limit.',
            );
          },
          onUnexpectedStop: (result) => {
            void this.finalizeCaptureResult(
              result,
              false,
              'The browser stopped recording. The captured audio was preserved.',
            );
          },
          onError: (error) => {
            this.handleCaptureError(error);
          },
        },
      );

      const startedAt = Date.now();

      appStore.patch({
        captureStatus: 'recording',
        captureStartedAt: startedAt,
        captureDurationMs: 0,
        capturePreviewUrl: null,
        captureFormatLabel: null,
        captureWavAvailable: false,
        captureAutoStopped: false,
        captureError: null,
        message: 'Recording performance…',
      });

      this.startCaptureTimer();
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Performance recording could not start.';

      appStore.patch({
        captureStatus: 'error',
        captureStartedAt: null,
        captureDurationMs: 0,
        captureError: message,
        message,
      });
    }
  }

  private async stopCapture(
    autoStopped = false,
    completionMessage = 'Performance captured.',
  ): Promise<void> {
    const state = appStore.getState();

    if (
      state.captureStatus !== 'recording'
      || this.masterRecorder.state === 'idle'
    ) {
      return;
    }

    this.clearCaptureTimer();

    appStore.patch({
      captureStatus: 'processing',
      captureAutoStopped: autoStopped,
      message: 'Finishing recording…',
    });

    try {
      const result = await this.masterRecorder.stop();

      await this.finalizeCaptureResult(
        result,
        autoStopped,
        completionMessage,
      );
    } catch (error) {
      this.handleCaptureError(error);
    }
  }

  private async finalizeCaptureResult(
    result: RecordingResult,
    autoStopped: boolean,
    completionMessage: string,
  ): Promise<void> {
    this.clearCaptureTimer();

    if (result.blob.size === 0) {
      this.handleCaptureError(
        new Error('The browser returned an empty recording.'),
      );
      return;
    }

    this.clearCaptureArtifacts();

    this.captureResult = result;
    this.capturePreviewUrl = URL.createObjectURL(result.blob);

    const runtime = audioEngine.getRuntime();
    this.captureWavBlob = (
      runtime
      && result.durationMs <= MAX_AUTOMATIC_WAV_CONVERSION_MS
    )
      ? await convertRecordingToWav(
          runtime.context,
          result.blob,
        )
      : null;

    appStore.patch({
      captureStatus: 'ready',
      captureStartedAt: null,
      captureDurationMs: result.durationMs,
      capturePreviewUrl: this.capturePreviewUrl,
      captureFormatLabel: result.format.label,
      captureWavAvailable: this.captureWavBlob !== null,
      captureAutoStopped: autoStopped,
      captureError: null,
      message: completionMessage,
    });
  }

  private handleCaptureError(error: unknown): void {
    this.clearCaptureTimer();
    this.clearCaptureArtifacts();

    const message = error instanceof Error
      ? error.message
      : 'Performance recording failed.';

    appStore.patch({
      captureStatus: 'error',
      captureStartedAt: null,
      captureDurationMs: 0,
      capturePreviewUrl: null,
      captureFormatLabel: null,
      captureWavAvailable: false,
      captureAutoStopped: false,
      captureError: message,
      message,
    });
  }

  private async cancelCapture(): Promise<void> {
    this.clearCaptureTimer();

    try {
      await this.masterRecorder.cancel();
    } finally {
      this.clearCaptureArtifacts();

      appStore.patch({
        captureStatus: 'idle',
        captureStartedAt: null,
        captureDurationMs: 0,
        capturePreviewUrl: null,
        captureFormatLabel: null,
        captureWavAvailable: false,
        captureAutoStopped: false,
        captureError: null,
        message: 'Recording cancelled.',
      });
    }
  }

  private discardCapture(updateState = true): void {
    this.clearCaptureTimer();

    if (this.masterRecorder.state !== 'idle') {
      void this.masterRecorder.cancel();
    }

    this.clearCaptureArtifacts();

    if (updateState) {
      appStore.patch({
        captureStatus: 'idle',
        captureStartedAt: null,
        captureDurationMs: 0,
        capturePreviewUrl: null,
        captureFormatLabel: null,
        captureWavAvailable: false,
        captureAutoStopped: false,
        captureError: null,
      });
    }
  }

  private startCaptureTimer(): void {
    this.clearCaptureTimer();

    this.captureTimer = setInterval(() => {
      const state = appStore.getState();

      if (
        state.captureStatus !== 'recording'
        || state.captureStartedAt === null
      ) {
        this.clearCaptureTimer();
        return;
      }

      appStore.patch({
        captureDurationMs: Math.min(
          MAX_RECORDING_MS,
          Math.max(0, Date.now() - state.captureStartedAt),
        ),
      });
    }, 250);
  }

  private clearCaptureTimer(): void {
    if (this.captureTimer !== null) {
      clearInterval(this.captureTimer);
      this.captureTimer = null;
    }
  }

  private clearCaptureArtifacts(): void {
    if (this.capturePreviewUrl) {
      URL.revokeObjectURL(this.capturePreviewUrl);
    }

    this.capturePreviewUrl = null;
    this.captureResult = null;
    this.captureWavBlob = null;
  }

  private downloadCapture(wav: boolean): void {
    const result = this.captureResult;

    if (!result) {
      return;
    }

    const blob = wav
      ? this.captureWavBlob
      : result.blob;

    if (!blob) {
      appStore.patch({
        message: 'WAV conversion is not available for this recording.',
      });
      return;
    }

    const extension = wav
      ? 'wav'
      : result.format.extension;
    const base = appStore.getState().world.name
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, ' ')
      .trim() || 'Loop World';

    this.downloadBlob(
      blob,
      `${base} - Performance.${extension}`,
    );

    appStore.patch({
      message: wav
        ? 'WAV downloaded.'
        : 'Performance downloaded.',
    });
  }

  private downloadBlob(
    blob: Blob,
    filename: string,
  ): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 0);
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
        this.unsubscribeLinkActivity = this.playground.subscribeLinkActivity((activity) => {
          this.scheduleLinkVisual(activity);
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
      this.liveOrbOverrides.delete(orbId);
      this.playground?.releaseOrbMotionOverride(orbId);
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

    this.liveOrbOverrides.delete(orbId);
    this.playground?.releaseOrbMotionOverride(orbId);

    this.linkView?.previewOrbPosition(orbId, position);

    for (const link of world.links) {
      if (
        link.type === 'copy-movement'
        && link.sourceOrbId === orbId
      ) {
        const target = world.soundOrbs.find(
          (candidate) => candidate.id === link.targetOrbId,
        );

        if (target) {
          this.linkView?.previewOrbPosition(
            target.id,
            target.position,
          );
        }
      }
    }
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
      selectedLinkId: current.selectedLinkId && world.links.some((link) => link.id === current.selectedLinkId)
        ? current.selectedLinkId
        : null,
      patternEditorOrbId: current.patternEditorOrbId === orbId ? null : current.patternEditorOrbId,
      motionEditorOrbId: current.motionEditorOrbId === orbId ? null : current.motionEditorOrbId,
      linkEditorSourceOrbId: current.linkEditorSourceOrbId === orbId ? null : current.linkEditorSourceOrbId,
      linkEditorTargetOrbId: current.linkEditorTargetOrbId === orbId ? null : current.linkEditorTargetOrbId,
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
      motionEditorOrbId: null,
      effectPaletteOpen: false,
      toyPaletteOpen: false,
      selectedFieldId: null,
      selectedToyId: null,
      selectedLinkId: null,
      linkEditorSourceOrbId: null,
      linkEditorTargetOrbId: null,
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
      motionEditorOrbId: null,
      effectPaletteOpen: false,
      toyPaletteOpen: false,
      selectedFieldId: null,
      selectedToyId: null,
      selectedLinkId: null,
      linkEditorSourceOrbId: null,
      linkEditorTargetOrbId: null,
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

  private openRemixIntent(): void {
    const current = appStore.getState();

    if (current.magicSession) {
      return;
    }

    if (current.world.soundOrbs.length === 0) {
      appStore.patch({
        message: 'Add a sound before remixing the World.',
      });
      return;
    }

    appStore.patch({
      magicIntentOpen: true,
      palette: null,
      effectPaletteOpen: false,
      toyPaletteOpen: false,
      patternEditorOrbId: null,
      motionEditorOrbId: null,
      linkEditorSourceOrbId: null,
      linkEditorTargetOrbId: null,
      selectedOrbId: null,
      selectedFieldId: null,
      selectedToyId: null,
      selectedLinkId: null,
      message: 'Choose a Remix direction.',
    });
  }

  private startMagicPreview(
    target: MagicTarget,
    intent: MagicIntent = 'surprise',
    strength: MagicStrength = 'playful',
  ): void {
    const current = appStore.getState();

    if (current.magicSession) {
      return;
    }

    if (!magicTargetExists(current.world, target)) {
      appStore.patch({
        message: 'That object is no longer available.',
      });
      return;
    }

    const result = mutateWithMagic(
      current.world,
      target,
      {
        intent,
        strength,
        attempt: 0,
      },
    );

    appStore.patch({
      world: result.world,
      magicIntentOpen: false,
      magicSession: {
        baseWorld: current.world,
        target,
        intent,
        strength,
        attempt: 0,
        seed: result.seed,
        summary: result.summary,
      },
      magicUndo: null,
      palette: null,
      effectPaletteOpen: false,
      toyPaletteOpen: false,
      patternEditorOrbId: null,
      motionEditorOrbId: null,
      linkEditorSourceOrbId: null,
      linkEditorTargetOrbId: null,
      selectedOrbId: null,
      selectedFieldId: null,
      selectedToyId: null,
      selectedLinkId: null,
      message: 'Magic preview. Keep it, retry, or revert.',
    });
  }

  private retryMagicPreview(): void {
    const current = appStore.getState();
    const session = current.magicSession;

    if (!session) {
      return;
    }

    const attempt = session.attempt + 1;
    const result = mutateWithMagic(
      session.baseWorld,
      session.target,
      {
        intent: session.intent,
        strength: session.strength,
        attempt,
      },
    );

    appStore.patch({
      world: result.world,
      magicSession: {
        ...session,
        attempt,
        seed: result.seed,
        summary: result.summary,
      },
      message: 'New Magic variation.',
    });
  }

  private changeMagicStrength(strength: MagicStrength): void {
    const current = appStore.getState();
    const session = current.magicSession;

    if (!session || session.strength === strength) {
      return;
    }

    const result = mutateWithMagic(
      session.baseWorld,
      session.target,
      {
        intent: session.intent,
        strength,
        attempt: session.attempt,
      },
    );

    appStore.patch({
      world: result.world,
      magicSession: {
        ...session,
        strength,
        seed: result.seed,
        summary: result.summary,
      },
      message: `${strength[0]?.toUpperCase() ?? ''}${strength.slice(1)} Magic.`,
    });
  }

  private keepMagicPreview(): void {
    const current = appStore.getState();
    const session = current.magicSession;

    if (!session) {
      return;
    }

    appStore.patch({
      magicSession: null,
      magicUndo: {
        beforeWorld: session.baseWorld,
        afterWorld: current.world,
      },
      message: 'Magic kept. Undo is available until your next World edit.',
    });
  }

  private revertMagicPreview(): void {
    const current = appStore.getState();
    const session = current.magicSession;

    if (!session) {
      return;
    }

    appStore.patch({
      world: session.baseWorld,
      magicSession: null,
      magicUndo: null,
      message: 'Magic reverted.',
    });
  }

  private undoLastMagic(): void {
    const current = appStore.getState();
    const undo = current.magicUndo;

    if (!undo || current.world !== undo.afterWorld) {
      return;
    }

    appStore.patch({
      world: undo.beforeWorld,
      magicUndo: null,
      message: 'Magic undone.',
    });
  }

  private async waitForPendingHomeSave(): Promise<void> {
    if (this.pendingHomeSave) {
      await this.pendingHomeSave;
    }
  }

  private async openLibraryWorld(worldId: string): Promise<void> {
    await this.waitForPendingHomeSave();
    if (!this.persistenceReady) {
      return;
    }

    try {
      const loaded = await this.repository.loadWorld(worldId);

      if (!loaded) {
        await this.refreshLibrary();
        appStore.patch({
          message: 'That World could not be opened.',
        });
        return;
      }

      await this.enterWorld(loaded.world, {
        autoPlay: false,
        saveBeforeEnter: false,
      });

      if (loaded.warnings.length > 0) {
        appStore.patch({
          message: `Opened with ${loaded.warnings.length} repair${loaded.warnings.length === 1 ? '' : 's'}.`,
        });
      }
    } catch (error) {
      this.handlePersistenceFailure(error, 'Could not open World');
    }
  }

  private async renameLibraryWorld(
    worldId: string,
    name: string,
  ): Promise<void> {
    await this.waitForPendingHomeSave();
    if (!this.persistenceReady) {
      return;
    }

    try {
      const loaded = await this.repository.loadWorld(
        worldId,
        Date.now(),
        false,
        false,
      );

      if (!loaded) {
        await this.refreshLibrary();
        return;
      }

      const world = renameWorld(loaded.world, name);

      if (world !== loaded.world) {
        await this.repository.saveWorld(world);

        const current = appStore.getState();
        if (current.world.id === worldId) {
          appStore.patch({ world });
        }
      }

      await this.refreshLibrary();
    } catch (error) {
      this.handlePersistenceFailure(error, 'Could not rename World');
    }
  }

  private async duplicateLibraryWorld(worldId: string): Promise<void> {
    await this.waitForPendingHomeSave();
    if (!this.persistenceReady) {
      return;
    }

    try {
      await this.repository.duplicateWorld(worldId);
      await this.refreshLibrary();
      appStore.patch({
        message: 'World duplicated.',
      });
    } catch (error) {
      this.handlePersistenceFailure(error, 'Could not duplicate World');
    }
  }

  private async trashLibraryWorld(worldId: string): Promise<void> {
    await this.waitForPendingHomeSave();
    if (!this.persistenceReady) {
      return;
    }

    try {
      await this.repository.trashWorld(worldId);
      await this.refreshLibrary();
      appStore.patch({
        message: 'World moved to Recently Deleted.',
      });
    } catch (error) {
      this.handlePersistenceFailure(error, 'Could not move World to Trash');
    }
  }

  private async restoreLibraryWorld(worldId: string): Promise<void> {
    await this.waitForPendingHomeSave();
    if (!this.persistenceReady) {
      return;
    }

    try {
      await this.repository.restoreWorld(worldId);
      await this.refreshLibrary();
      appStore.patch({
        message: 'World restored.',
      });
    } catch (error) {
      this.handlePersistenceFailure(error, 'Could not restore World');
    }
  }

  private async purgeLibraryWorld(worldId: string): Promise<void> {
    await this.waitForPendingHomeSave();
    if (!this.persistenceReady) {
      return;
    }

    try {
      await this.repository.purgeWorld(worldId);
      await this.refreshLibrary();
      appStore.patch({
        message: 'World permanently deleted.',
      });
    } catch (error) {
      this.handlePersistenceFailure(error, 'Could not delete World');
    }
  }

  private async exportLibraryWorld(worldId: string): Promise<void> {
    await this.waitForPendingHomeSave();
    if (!this.persistenceReady) {
      return;
    }

    try {
      const loaded = await this.repository.loadWorld(
        worldId,
        Date.now(),
        false,
        false,
      );

      if (!loaded) {
        return;
      }

      this.downloadBackup(
        [loaded.world],
        `${loaded.world.name}.loop.json`,
      );
    } catch (error) {
      this.handlePersistenceFailure(error, 'Could not create backup');
    }
  }

  private async exportAllWorlds(): Promise<void> {
    await this.waitForPendingHomeSave();
    if (!this.persistenceReady) {
      return;
    }

    try {
      const worlds: WorldDocument[] = [];

      for (const item of appStore.getState().library) {
        if (item.deletedAt !== null) {
          continue;
        }

        const loaded = await this.repository.loadWorld(
          item.id,
          Date.now(),
          false,
          false,
        );

        if (loaded) {
          worlds.push(loaded.world);
        }
      }

      if (worlds.length === 0) {
        appStore.patch({
          message: 'There are no saved Worlds to back up.',
        });
        return;
      }

      this.downloadBackup(worlds, 'loop-worlds-backup.json');
    } catch (error) {
      this.handlePersistenceFailure(error, 'Could not create backup');
    }
  }

  private async importBackup(text: string): Promise<void> {
    await this.waitForPendingHomeSave();
    if (!this.persistenceReady) {
      appStore.patch({
        message: 'Local storage is unavailable, so the backup cannot be imported.',
      });
      return;
    }

    try {
      const decoded = decodeLoopBackup(text);
      const imported = await this.repository.importWorlds(decoded.worlds);
      await this.refreshLibrary();

      appStore.patch({
        message: decoded.warnings.length > 0
          ? `Imported ${imported.length} World${imported.length === 1 ? '' : 's'} with ${decoded.warnings.length} warning${decoded.warnings.length === 1 ? '' : 's'}.`
          : `Imported ${imported.length} World${imported.length === 1 ? '' : 's'}.`,
      });
    } catch (error) {
      const failure = classifyPersistenceError(error);
      appStore.patch({
        message: `Import failed: ${failure.message}`,
      });
    }
  }

  private downloadBackup(
    worlds: readonly WorldDocument[],
    filename: string,
  ): void {
    const text = encodeLoopBackup(worlds);
    const blob = new Blob([text], {
      type: 'application/json',
    });
    const safeName = filename
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, ' ')
      .trim() || 'loop-backup.json';

    this.downloadBlob(blob, safeName);
  }

  private exportCurrentWorld(): void {
    this.downloadBackup(
      [appStore.getState().world],
      `${appStore.getState().world.name}.loop.json`,
    );
  }

  private renameCurrentWorld(name: string): void {
    const current = appStore.getState();
    const world = renameWorld(current.world, name);

    if (world === current.world) {
      return;
    }

    appStore.patch({
      world,
      message: 'World renamed.',
    });
  }

  private saveSnapshot(name?: string): void {
    const current = appStore.getState();
    const result = addSnapshot(current.world, name);

    if (!result.createdId) {
      appStore.patch({
        message: 'This World already has eight Snapshots.',
      });
      return;
    }

    appStore.patch({
      world: result.world,
      snapshotsOpen: true,
      message: 'Snapshot saved.',
    });
  }

  private renameWorldSnapshot(
    snapshotId: string,
    name: string,
  ): void {
    const current = appStore.getState();
    const world = renameSnapshot(
      current.world,
      snapshotId,
      name,
    );

    if (world === current.world) {
      return;
    }

    appStore.patch({
      world,
      snapshotsOpen: true,
      message: 'Snapshot renamed.',
    });
  }

  private deleteWorldSnapshot(snapshotId: string): void {
    const current = appStore.getState();
    const world = deleteSnapshot(current.world, snapshotId);

    if (world === current.world) {
      return;
    }

    appStore.patch({
      world,
      snapshotsOpen: true,
      message: 'Snapshot deleted.',
    });
  }

  private queueSnapshotRecall(snapshotId: string): void {
    const current = appStore.getState();

    if (current.magicSession) {
      return;
    }

    this.cancelSnapshotRecall();

    const runtime = audioEngine.getRuntime();

    if (!current.playing || !this.playground || !runtime) {
      this.applySnapshotRecall(snapshotId);
      return;
    }

    const now = runtime.context.currentTime;
    const targetTime = this.playground.transport.nextQuantizedTime(
      now,
      'bar',
    );
    const delayMs = Math.max(0, (targetTime - now) * 1000);

    this.snapshotRecallTimer = setTimeout(() => {
      this.snapshotRecallTimer = null;
      this.applySnapshotRecall(snapshotId);
    }, delayMs);

    appStore.patch({
      snapshotsOpen: false,
      message: 'Snapshot queued for the next bar.',
    });
  }

  private applySnapshotRecall(snapshotId: string): void {
    const current = appStore.getState();
    const world = recallSnapshot(
      current.world,
      snapshotId,
    );

    if (world === current.world) {
      return;
    }

    appStore.patch({
      world,
      snapshotsOpen: false,
      magicUndo: null,
      message: 'Snapshot recalled.',
    });
  }

  private cancelSnapshotRecall(): void {
    if (this.snapshotRecallTimer !== null) {
      clearTimeout(this.snapshotRecallTimer);
      this.snapshotRecallTimer = null;
    }
  }

  private undoWorld(): void {
    if (appStore.getState().magicSession) {
      return;
    }

    this.cancelSnapshotRecall();
    const world = this.history.undo();

    if (!world) {
      return;
    }

    appStore.patch({
      world,
      magicUndo: null,
      snapshotsOpen: false,
      message: 'Undone.',
    });
  }

  private redoWorld(): void {
    if (appStore.getState().magicSession) {
      return;
    }

    this.cancelSnapshotRecall();
    const world = this.history.redo();

    if (!world) {
      return;
    }

    appStore.patch({
      world,
      magicUndo: null,
      snapshotsOpen: false,
      message: 'Redone.',
    });
  }

  private createLinkRelationship(type: LinkType): void {
    const current = appStore.getState();
    const sourceOrbId = current.linkEditorSourceOrbId;
    const targetOrbId = current.linkEditorTargetOrbId;

    if (!sourceOrbId || !targetOrbId) {
      return;
    }

    const result = addLink(
      current.world,
      type,
      sourceOrbId,
      targetOrbId,
    );

    if (!result.createdId) {
      appStore.patch({
        message: 'That Link is not available for these sounds.',
      });
      return;
    }

    appStore.patch({
      world: result.world,
      selectedLinkId: result.createdId,
      selectedOrbId: null,
      linkEditorSourceOrbId: null,
      linkEditorTargetOrbId: null,
      message: 'Link created. Watch how the sounds react.',
    });
  }

  private deleteLinkRelationship(linkId: string): void {
    const current = appStore.getState();
    const world = deleteLink(current.world, linkId);

    if (world === current.world) {
      return;
    }

    appStore.patch({
      world,
      selectedLinkId: current.selectedLinkId === linkId ? null : current.selectedLinkId,
      message: 'Link removed.',
    });
  }

  private addField(type: EffectFieldType): void {
    const current = appStore.getState();
    const result = addEffectField(current.world, type);

    if (!result.createdId) {
      appStore.patch({
        effectPaletteOpen: false,
        message: result.reason === 'duplicate'
          ? 'That field is already in this World.'
          : 'This World already has five effect fields.',
      });
      return;
    }

    appStore.patch({
      world: result.world,
      selectedFieldId: result.createdId,
      selectedOrbId: null,
      selectedToyId: null,
      selectedLinkId: null,
      linkEditorSourceOrbId: null,
      linkEditorTargetOrbId: null,
      effectPaletteOpen: false,
      toyPaletteOpen: false,
      palette: null,
      patternEditorOrbId: null,
      motionEditorOrbId: null,
      message: 'Field added. Drag a sound into it.',
    });
  }

  private previewField(field: EffectFieldDocument): void {
    this.fieldPreviewOverrides.set(field.id, field);
    this.playground?.previewEffectField(field);
    this.effectFieldView?.previewFieldEffects(field);
  }

  private commitFieldMove(fieldId: string, position: NormalizedPoint): void {
    const current = appStore.getState();
    const world = moveEffectField(current.world, fieldId, position);

    if (world !== current.world) {
      appStore.patch({
        world,
        message: 'Field moved. Sounds react wherever it overlaps.',
      });
    }

    this.fieldPreviewOverrides.delete(fieldId);
    this.playground?.releaseEffectFieldPreview(fieldId);
  }

  private commitFieldResize(fieldId: string, radius: number): void {
    const current = appStore.getState();
    const world = resizeEffectField(current.world, fieldId, radius);

    if (world !== current.world) {
      appStore.patch({
        world,
        message: 'Field resized.',
      });
    }

    this.fieldPreviewOverrides.delete(fieldId);
    this.playground?.releaseEffectFieldPreview(fieldId);
  }

  private deleteField(fieldId: string): void {
    const current = appStore.getState();
    const world = deleteEffectField(current.world, fieldId);

    if (world === current.world) {
      return;
    }

    this.fieldPreviewOverrides.delete(fieldId);
    this.playground?.releaseEffectFieldPreview(fieldId);

    appStore.patch({
      world,
      selectedFieldId: current.selectedFieldId === fieldId ? null : current.selectedFieldId,
      message: 'Effect field removed.',
    });
  }

  private addToy(type: PlaygroundToyType): void {
    const current = appStore.getState();
    const result = addPlaygroundToy(current.world, type);

    if (!result.createdId) {
      appStore.patch({
        toyPaletteOpen: false,
        message: result.reason === 'duplicate'
          ? 'That toy is already in this World.'
          : 'This World already has four toys.',
      });
      return;
    }

    appStore.patch({
      world: result.world,
      selectedToyId: result.createdId,
      selectedOrbId: null,
      selectedFieldId: null,
      selectedLinkId: null,
      linkEditorSourceOrbId: null,
      linkEditorTargetOrbId: null,
      toyPaletteOpen: false,
      palette: null,
      effectPaletteOpen: false,
      patternEditorOrbId: null,
      motionEditorOrbId: null,
      message: type === 'portal'
        ? 'Portal added. Move IN and OUT wherever you want.'
        : 'Toy added. Move a sound near it.',
    });
  }

  private commitToyMove(toyId: string, position: NormalizedPoint): void {
    const current = appStore.getState();
    const world = movePlaygroundToy(current.world, toyId, position);

    if (world !== current.world) {
      appStore.patch({
        world,
        message: 'Toy moved.',
      });
    }

    this.toyPreviewOverrides.delete(toyId);
    this.playground?.releasePlaygroundToyPreview(toyId);
  }

  private commitPortalExitMove(toyId: string, position: NormalizedPoint): void {
    const current = appStore.getState();
    const world = movePortalExit(current.world, toyId, position);

    if (world !== current.world) {
      appStore.patch({
        world,
        message: 'Portal exit moved.',
      });
    }

    this.toyPreviewOverrides.delete(toyId);
    this.playground?.releasePlaygroundToyPreview(toyId);
  }

  private deleteToy(toyId: string): void {
    const current = appStore.getState();
    const world = deletePlaygroundToy(current.world, toyId);

    if (world === current.world) {
      return;
    }

    this.toyPreviewOverrides.delete(toyId);
    this.playground?.releasePlaygroundToyPreview(toyId);

    appStore.patch({
      world,
      selectedToyId: current.selectedToyId === toyId ? null : current.selectedToyId,
      message: 'Playground toy removed.',
    });
  }

  private applyMotionWorld(world: AppState['world'], message: string): void {
    const current = appStore.getState();

    if (world === current.world) {
      return;
    }

    appStore.patch({
      world,
      message,
    });
  }

  private motionModeLabel(mode: MotionMode): string {
    switch (mode) {
      case 'still':
        return 'Still';
      case 'orbit':
        return 'Orbit';
      case 'bounce':
        return 'Bounce';
      case 'drift':
        return 'Drift';
      case 'follow':
        return 'Follow';
      case 'wander':
        return 'Wander';
    }
  }

  private motionSpeedLabel(speed: MotionSpeed): string {
    switch (speed) {
      case 'slow':
        return 'Slow';
      case 'medium':
        return 'Medium';
      case 'fast':
        return 'Fast';
    }
  }

  private motionRangeLabel(range: MotionRange): string {
    switch (range) {
      case 'tight':
        return 'Tight';
      case 'medium':
        return 'Medium';
      case 'wide':
        return 'Wide';
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

  private syncMotionLoop(state: Readonly<AppState>): void {
    const active = state.screen === 'playground'
      && (
        worldHasActiveMotion(state.world)
        || this.toyPreviewOverrides.size > 0
      );

    if (!active) {
      this.cancelMotionLoop();
      return;
    }

    if (this.motionFrameRequest !== null) {
      return;
    }

    this.motionEpochMs ??= performance.now();
    this.motionFrameRequest = requestAnimationFrame((timestamp) => {
      this.runMotionFrame(timestamp);
    });
  }

  private runMotionFrame(timestamp: number): void {
    this.motionFrameRequest = null;

    const state = appStore.getState();

    if (
      state.screen !== 'playground'
      || (
        !worldHasActiveMotion(state.world)
        && this.toyPreviewOverrides.size === 0
      )
    ) {
      this.cancelMotionLoop();
      return;
    }

    this.motionEpochMs ??= timestamp;
    const timeSeconds = Math.max(0, (timestamp - this.motionEpochMs) / 1000);
    const motionWorld = this.worldWithToyPreviews(state.world);
    const frame = this.playground
      ? this.playground.tickMotion(timeSeconds)
      : evaluateMotionFrame(motionWorld, timeSeconds);

    for (const orb of state.world.soundOrbs) {
      const position = this.liveOrbOverrides.get(orb.id)
        ?? frame.get(orb.id)
        ?? orb.position;

      this.playgroundView?.previewOrbPosition(orb.id, position);
      this.effectFieldView?.previewOrbEffect(
        orb.id,
        position,
        this.effectFieldsWithPreviews(state.world.effectFields),
      );
    }

    this.linkView?.updateLivePositions(
      new Map(
        state.world.soundOrbs.map((orb) => [
          orb.id,
          this.liveOrbOverrides.get(orb.id)
            ?? frame.get(orb.id)
            ?? orb.position,
        ]),
      ),
    );

    this.motionFrameRequest = requestAnimationFrame((nextTimestamp) => {
      this.runMotionFrame(nextTimestamp);
    });
  }

  private cancelMotionLoop(): void {
    if (this.motionFrameRequest !== null) {
      cancelAnimationFrame(this.motionFrameRequest);
      this.motionFrameRequest = null;
    }

    this.motionEpochMs = null;
    this.liveOrbOverrides.clear();
    this.fieldPreviewOverrides.clear();
    this.toyPreviewOverrides.clear();
  }

  private effectFieldsWithPreviews(
    fields: AppState['world']['effectFields'],
  ): AppState['world']['effectFields'] {
    if (this.fieldPreviewOverrides.size === 0) {
      return fields;
    }

    return fields.map(
      (field) => this.fieldPreviewOverrides.get(field.id) ?? field,
    );
  }

  private worldWithToyPreviews(world: AppState['world']): AppState['world'] {
    if (this.toyPreviewOverrides.size === 0) {
      return world;
    }

    return {
      ...world,
      playgroundToys: world.playgroundToys.map(
        (toy) => this.toyPreviewOverrides.get(toy.id) ?? toy,
      ),
    };
  }

  private clearPlaygroundRuntime(): void {
    this.cancelMotionLoop();

    this.unsubscribeActivity?.();
    this.unsubscribeActivity = null;

    this.unsubscribeLinkActivity?.();
    this.unsubscribeLinkActivity = null;

    this.playground?.dispose();
    this.playground = null;
  }

  private clearActivityTimers(): void {
    for (const timer of this.activityTimers) {
      clearTimeout(timer);
    }
    this.activityTimers.clear();
  }

  private scheduleLinkVisual(activity: LinkActivity): void {
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
      this.linkView?.pulseLink(activity.linkId);

      if (activity.type === 'kick-pushes-bass') {
        this.linkView?.pushOrb(
          activity.sourceOrbId,
          activity.targetOrbId,
          activity.intensity,
        );
      }
    }, delayMs);

    this.activityTimers.add(timer);
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
