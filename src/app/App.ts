import { audioEngine } from '../core/audio/AudioEngine';
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
import type { MotionMode, MotionRange, MotionSpeed } from '../core/world/Motion';
import type { LinkType } from '../core/world/Link';
import {
  addLink,
  deleteLink,
} from '../core/world/LinkActions';
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
  addSoundOrb,
  deleteSoundOrb,
  duplicateSoundOrb,
  moveSoundOrb,
  replaceSoundOrb,
  soundOrbById,
  toggleSoundOrbMuted,
} from '../core/world/WorldActions';
import { MAX_SOUND_ORBS, type NormalizedPoint } from '../core/world/SoundOrb';
import { EffectFieldView } from './EffectFieldView';
import { HomeView } from './HomeView';
import { LinkView } from './LinkView';
import { MotionView } from './MotionView';
import { PatternEditorView } from './PatternEditorView';
import { PlaygroundView } from './PlaygroundView';
import { appStore, type AppScreen, type AppState } from './state';

export class App {
  private unsubscribeStore: (() => void) | null = null;
  private unsubscribeActivity: (() => void) | null = null;
  private unsubscribeLinkActivity: (() => void) | null = null;
  private homeView: HomeView | null = null;
  private playgroundView: PlaygroundView | null = null;
  private effectFieldView: EffectFieldView | null = null;
  private linkView: LinkView | null = null;
  private motionView: MotionView | null = null;
  private patternEditorView: PatternEditorView | null = null;
  private playground: PlaygroundEngine | null = null;
  private mountedScreen: AppScreen | null = null;
  private onboardingComplete = false;
  private motionFrameRequest: number | null = null;
  private motionEpochMs: number | null = null;
  private readonly liveOrbOverrides = new Map<string, NormalizedPoint>();
  private readonly fieldPreviewOverrides = new Map<string, EffectFieldDocument>();
  private readonly toyPreviewOverrides = new Map<string, PlaygroundToyDocument>();
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
    this.cancelMotionLoop();
    this.clearPlaygroundRuntime();

    this.unsubscribeStore?.();
    this.unsubscribeStore = null;

    this.homeView?.destroy();
    this.homeView = null;

    this.patternEditorView?.destroy();
    this.patternEditorView = null;

    this.motionView?.destroy();
    this.motionView = null;

    this.linkView?.destroy();
    this.linkView = null;

    this.effectFieldView?.destroy();
    this.effectFieldView = null;

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

      this.motionView?.destroy();
      this.motionView = null;

      this.linkView?.destroy();
      this.linkView = null;

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

    this.playgroundView?.render(state);
    this.effectFieldView?.render(state);
    this.linkView?.render(state);
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
        this.playground?.updateOrbSpatial(orbId, position);
        this.effectFieldView?.previewOrbEffect(
          orbId,
          position,
          appStore.getState().world.effectFields,
        );
        this.linkView?.previewOrbPosition(orbId, position);
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
