# Loop — Architecture Baseline

## Status
Updated through Phase 13.

The architecture remains intentionally smaller than the old Spatial Tape Matrix experiments. It creates boundaries only when a user-facing roadmap phase requires them.

## Runtime layers

### app/
Owns application bootstrap, the starter Home, the full-screen playground view, top-level interaction orchestration, and fatal-error handling.

Current responsibilities include:
- mounting/switching Home and Playground surfaces;
- starting a selected starter World directly from the Home;
- mounting the playground;
- translating pointer/keyboard intent into World actions;
- starting/stopping the audio runtime;
- forwarding live drag previews to spatial audio;
- rendering serializable World state;
- aligning visual pulse feedback to scheduled audio time.

The app layer should not implement timing math, harmony rules, compatibility scoring, or DSP.

### core/audio/
Owns browser audio lifecycle and audio-producing primitives.

Current responsibilities:
- AudioContext feature detection;
- user-gesture initialization;
- master gain;
- safety limiter;
- suspend/resume/close lifecycle;
- one bounded AudioRuntime containing context + destination;
- lightweight procedural event synthesis;
- SpatialVoice channels that map orb presence/pan into Web Audio nodes;
- EffectRack channels that provide bounded Filter, Heat, Frost, Echo, and Space processing per live Sound Orb;
- temporary post-limiter master capture taps;
- MasterRecorder — bounded MediaRecorder orchestration;
- RecordingFormat — browser MIME negotiation;
- RecordingExport + WavEncoder — optional bounded PCM16 WAV conversion.

No feature may create hidden AudioContexts independently.

### core/music/
Owns musical behavior independent of UI:

- MusicalTransport — BPM, bars/beats, time conversion, quantization;
- LookaheadScheduler — short-horizon audio-time scheduling;
- Harmony — small scale vocabulary and pitch mapping;
- MixPolicy — metadata normalization and voice-count headroom;
- Pattern — serializable rhythm/melody documents, density/groove macros, deterministic variation;
- OrbPattern — schedules each orb’s effective editable pattern and exposes actual event time;
- ReactiveLinks — pure base-event gating and reactive Link timing rules;
- MotionEngine — deterministic live-position evaluation for Motion presets, playground toys, and Copy Movement Links;
- PlaygroundEngine — shared transport/scheduler plus one runtime audio channel per Sound Orb, with two-pass Link scheduling and live positions applied to EffectRack + SpatialVoice;
- Magic — deterministic role-aware mutation over existing World structures.

The old one-off FoundationGroove runtime was removed in Phase 3. There is now one playback architecture.

### core/sounds/
Owns built-in sound meaning and compatibility.

Current responsibilities:
- typed sound definitions;
- reusable musical pattern identity separate from concrete timbre;
- beginner-facing palette categories and friendly sound grouping;
- lightweight deterministic Surprise Me selection;
- role metadata;
- energy/brightness descriptors;
- nominal level metadata;
- optional tempo/tonal metadata;
- procedural source identity;
- catalog validation;
- compatibility ranking.

The UI should ask this layer for suitable options rather than implementing music-theory rules itself.

### core/state/
Contains the small observable Store primitive plus bounded in-memory World history.

Current responsibilities:
- Store — observable application state;
- WorldHistory — bounded 64-entry World undo/redo history with branch/reset semantics.

Neither depends on DOM or Web Audio.

### core/persistence/
Owns browser-local durability outside the musical runtime.

Current responsibilities:
- IndexedDbWorldStorage — native IndexedDB adapter;
- MemoryWorldStorage — deterministic test backend;
- WorldRepository — library, active-World, Trash, restore, purge, duplicate/import, migration and quarantine;
- WorldMigration — schema v1–v8 validation/migration;
- Backup — versioned JSON backup encode/decode;
- PersistenceError — quota/unavailable/corruption/future-version classification;
- PersistenceTypes — storage/library contracts.

App does not issue IndexedDB requests directly.

### core/world/
Owns the serializable World document boundary and pure creative-state mutations.

World schema version 8 contains:
- BPM;
- tonic;
- scale;
- deterministic random seed;
- full SoundOrbDocument objects;
- full EffectFieldDocument objects;
- PlaygroundToyDocument objects;
- typed LinkDocument objects;
- typed SnapshotDocument objects.

SoundOrbDocument contains:
- id;
- sound id;
- role;
- normalized x/y position;
- mute state;
- optional editable rhythm/melody pattern state;
- optional MotionDocument.

WorldActions owns immutable:
- move;
- mute/unmute;
- duplicate;
- delete;
- Add from the sound palette;
- Replace while preserving orb identity/position/mute.

StarterWorlds owns the bounded starter templates (Beat, Chill, Dreamy, Dance, Weird, Empty) and lightweight starter Surprise Me behavior.

PatternActions owns immutable pattern painting, clear, density, groove, and variation edits.

EffectFieldActions owns immutable field Add, move, resize, and delete operations.

MotionActions owns immutable mode/Speed/Range/Follow target updates.

PlaygroundToyActions owns immutable toy Add/move/Portal OUT/delete operations.

LinkActions owns bounded Link validation, Add/Delete, and lifecycle cleanup.

Magic owns seeded mutation of existing Sound Orbs, Effect Fields, toys, and coherent whole-World Remix without changing structural caps or roles.

Snapshot owns bounded playable-state capture/rename/delete/recall.

WorldLibraryActions owns pure World rename/duplicate operations.

EffectField geometry maps normalized orb/field positions into smooth 0–1 effect amounts.

SpatialMapping translates normalized position into bounded stereo pan and listener-distance presence.

### core/assets/
Resolves static assets through Vite's BASE_URL so production assets work under GitHub Pages at /loop/.

All future public asset references should go through this boundary rather than hard-coded root paths.

### core/platform/
Centralizes browser/platform capability and install/runtime behavior rather than scattering checks through feature code.

Current responsibilities:
- capabilities — feature detection for audio, IndexedDB, recording, service workers, pointer events, and other browser primitives;
- PwaController — install availability, iOS/iPadOS manual-install policy, standalone detection, service-worker registration, update readiness, explicit update activation, online/offline state, and throttled update checks.

PWA runtime state remains transient application state.

### core/visual/
Owns visual-performance/accessibility policy independent of audio and creative World state.

Current responsibilities:
- VisualQuality — High/Balanced/Battery Saver profiles;
- automatic initial quality from hardware/data-saver hints;
- reduced-motion/particles/bloom composition;
- global localStorage visual-preference persistence.

Visual policy never imports or changes the audio engine.

## Dependency direction

UI/app → domain/core modules

Core modules must not import the application shell.

Audio, music, sounds, World, state, asset, and platform modules should remain independently testable.

## State ownership
Avoid duplicated mutable truth.

Examples:
- AudioContext and master graph belong to AudioEngine;
- musical clock state belongs to MusicalTransport;
- runtime Sound Orb channels, EffectRacks, and transient Motion preview overrides belong to PlaygroundEngine;
- serialized Motion anchors/toys belong to World;
- live Motion positions do not belong to persistent app state;
- Link definitions belong to World while Link activity events remain runtime-only;
- sound metadata belongs to the catalog;
- serializable creative state belongs to World;
- transient selection/playback UI state belongs to AppState/Store;
- Magic preview/session/undo metadata is transient AppState;
- library metadata (last-opened, deletedAt, active World) belongs to persistence records, not WorldDocument;
- autosave/persistence status and open Snapshot sheet state are transient AppState;
- undo/redo stacks belong to WorldHistory and are intentionally session-only;
- recording Blob/WAV data and preview object URLs are transient App runtime state;
- capture status/duration/format metadata is transient AppState;
- recordings never belong to WorldDocument, IndexedDB Worlds, Snapshots, or WorldHistory;
- visual quality/reduction preferences are global app preferences, not World state;
- VisualSystemView owns ephemeral ambient/trail/burst DOM nodes;
- PWA install/manual-install/update/offline state belongs to PwaController + transient AppState;
- service-worker caches contain built application assets, never creative World truth;
- rendered DOM is a projection of state, not a second persistent data model.

During a drag, DOM position and spatial audio may preview continuously. The normalized position is committed back to World state when the drag ends.

## Timing rule
Musical scheduling must not depend on requestAnimationFrame.

The runtime uses:
- AudioContext.currentTime as the authoritative clock;
- a short lookahead scheduler for future Web Audio events;
- musical quantization math for safe boundaries.

Visual pulse feedback may use timers only to align already-scheduled UI animation with audio time. UI timers never schedule audio.

After long main-thread gaps, missed historical ticks are skipped rather than burst-fired.

## Spatial rule
V1 spatial audio is musical, not physically simulated.

Spatial mapping:
- horizontal normalized position → bounded stereo pan;
- distance from center listener → bounded presence gain;
- Effect Field overlap/depth → bounded effect amounts.

No room geometry, wall simulation, diffraction, or physical propagation belongs in this layer.

## Audio lifecycle
Browsers require user interaction before reliable audio playback.

Therefore:
1. app boots without starting AudioContext;
2. Play initializes/resumes AudioEngine;
3. PlaygroundEngine receives the one AudioRuntime boundary;
4. one EffectRack and one SpatialVoice exist per live Sound Orb;
5. procedural event sources connect through EffectRack → SpatialVoice;
6. field/orb movement updates smoothed AudioParams without rebuilding graphs;
7. removal/deletion tears down that orb channel;
8. app teardown disposes the playground and closes AudioEngine.

## Musical intelligence rule
Beginner-facing UI should not calculate:
- scales;
- transposition;
- timing boundaries;
- compatibility;
- headroom.

Those decisions belong to core/music and core/sounds.

## Interaction rule
Direct manipulation should change sound before opening abstract controls.

The primary interaction remains direct manipulation:
- pointer/touch/stylus dragging;
- keyboard arrow nudging;
- selection;
- mute;
- duplicate;
- delete.

Phase 5 adds a contextual **Shape** sheet only for editable sound roles. It is secondary to the canvas and writes directly to serializable Sound Orb state rather than creating a separate sequencer model.

Phase 6 adds directly manipulable Effect Fields. Fields live behind Sound Orbs on the same canvas, can be dragged/resized, and expose no technical DSP parameters.

Phase 7 adds contextual Motion plus directly manipulable playground toys. Motion computes transient live positions around saved anchors; it does not write World state every animation frame.

Phase 8 adds visible one-way Links between Sound Orbs. Link creation is vocabulary-driven rather than port/routing driven, and reactive audio is deliberately non-recursive.

Phase 9 adds ✦ Magic and ✦ Remix as bounded mutation operations over the existing World model. Preview transactions live in AppState.

Phase 10 adds the local World library, autosave/restore, typed Snapshots, bounded general undo/redo, schema migration/quarantine, and versioned JSON backups. Persistence remains independent of the audio runtime.

Phase 11 adds transient master performance capture and download. Recording taps the post-limiter master without changing the creative World model or persistence schema.

Phase 12 completes the V1 visual identity/game-feel system with layered role identities, audio-timed burst feedback, bounded motion trails, richer field/toy/link treatment, shared transitions, max-density de-cluttering, and High/Balanced/Battery Saver profiles.

Phase 13 completes the V1 product-build sequence with safe-area-aware responsive layouts, coarse-pointer hardening, a grouped responsive top-bar action cluster, installability metadata/icons, explicit PWA install/update/offline state, build-generated /loop/ service-worker precaching, offline shell/runtime caching, iOS/iPadOS manual install guidance, and GitHub Pages path validation.

## GitHub Pages / PWA
The canonical production URL uses the repository path:

https://thiepn.github.io/loop/

Vite uses:

base: '/loop/'

Static assets resolve through Vite BASE_URL / AssetLoader.

Phase 13 additionally guarantees:
- manifest id/start/scope remain inside /loop/;
- service worker registers at /loop/sw.js;
- service-worker scope is /loop/, never the site root;
- generated precache URLs all use /loop/;
- same-origin requests outside the project scope are ignored by the worker;
- production build generates and validates the final worker from actual Vite output.

Public deployment itself remains Phase 18 after audit/certification.

## Testing baseline
Current automated coverage includes:
- generic state behavior;
- World construction and musical defaults;
- GitHub Pages asset path resolution;
- transport math and quantization;
- scheduler behavior and gap recovery;
- harmony/transposition helpers;
- headroom policy;
- sound compatibility ranking;
- built-in catalog integrity;
- spatial mapping;
- immutable Sound Orb World mutations;
- orb cap behavior;
- starter-World sound/role integrity;
- starter Home definitions;
- palette category grouping;
- deterministic Surprise Me behavior;
- Add/Replace World actions;
- rhythm/melody pattern normalization;
- density/groove/variation transforms;
- immutable PatternActions;
- pattern preservation/reset behavior across duplicate/change;
- Effect Field depth geometry;
- overlap combination;
- field size/position clamping;
- EffectFieldActions;
- starter field integrity;
- Motion preset determinism/bounds;
- Follow targeting/fallback;
- Motion frame activation;
- Spinner/Magnet/Repulsor/Portal transforms;
- MotionActions;
- PlaygroundToyActions;
- Motion preservation across Duplicate/Change;
- starter Motion/toy integrity;
- Link validation/conflict rules;
- Pulse/Follow/Take Turns timing/gating;
- Copy Movement geometry;
- Link lifecycle cleanup;
- starter Link integrity;
- deterministic Magic seeding;
- role/id/position preservation;
- intent-aware sound/density/tempo behavior;
- Effect Field and toy bounds under Magic;
- Remix structure/Link validity preservation;
- Snapshot capture/recall/cap;
- bounded undo/redo history;
- schema v1–v8 migration and future-version rejection;
- backup round-trip and partial recovery;
- WorldRepository library/Trash/restore/purge/duplicate/import;
- corruption quarantine;
- persistence error/quota classification;
- recording MIME negotiation;
- PCM16 WAV encoding/interleaving/clamping;
- MasterRecorder Stop/Cancel/tap cleanup;
- bounded duration callback;
- unexpected browser-stop recovery;
- automatic visual-quality selection;
- visual profile density ordering;
- reduced-motion/particles/bloom composition;
- visual-preference persistence/fallback;
- GitHub Pages/PWA path normalization;
- service-worker URL/scope isolation;
- install/manual-install platform policy;
- production service-worker generation and required PWA asset validation.

Future phases add tests at their domain boundaries.

## Error handling
The root bootstrap catches fatal startup failures and renders a recoverable fallback instead of leaving a blank page.

Recoverable subsystem errors, such as denied audio initialization, update app state without crashing the shell.

## Performance baseline
The scheduler runs only while musical playback is active.

Procedural sources are finite-lived and clean themselves up after ending.

Sound Orb and Effect Field visuals use lightweight DOM/CSS animation. Heavier rendering remains deferred to the dedicated visual phase.

Phase 6 explicitly avoids a convolution engine or granular AudioWorklet per Sound Orb. Space uses filtered delay diffusion and Frost uses bounded short-delay feedback so the 12-orb cap remains realistic for web/mobile hardware.

Phase 7 adds one demand-driven requestAnimationFrame loop. It runs only while at least one Sound Orb exists and Motion/toys require live position evaluation; static Worlds do not keep the loop alive.

Phase 10 persistence is event/debounce-driven and adds no render or audio loop. Live Motion positions are never serialized.

Phase 11 recording adds no permanent audio graph. The MediaStreamAudioDestinationNode capture tap exists only while recording. Captures are capped at 10 minutes, arrive in 1-second MediaRecorder chunks, and automatic WAV decoding is capped at 3 minutes to avoid large PCM memory spikes.

Phase 12 adds no new permanent render loop. VisualSystemView creates bounded DOM particles only on profile changes, audio events, or existing live-position updates. High/Balanced/Battery Saver change visual density only. Max-orb Worlds automatically reduce decorative noise.

Phase 13 adds no musical/audio runtime. Mobile layout is CSS/pointer hardening, and the service worker runs independently of World/audio state. Its production precache list is generated from actual Vite output and remains scoped to /loop/.

Future render loops and expensive DSP must be pausable when hidden or unnecessary.

## Architecture rule
Do not create a subsystem because the roadmap mentions it eventually.

Create the smallest stable boundary needed for the current phase, then extend it when the user-facing feature arrives.


## Phase 4 entry-flow rule

Home and Sound Palette are presentation/orchestration layers over ordinary World and sound definitions.

They do not create a second project format.

A starter selection creates a normal WorldDocument. Add and Change use the same immutable WorldActions that later persistence will serialize.

The browser user gesture used to select a non-empty starter is intentionally reused to initialize/resume Web Audio, allowing the World to begin playing without an extra permission/setup screen.

Onboarding state remains transient application state in Phase 4. Persistent onboarding preferences belong with later persistence/settings work.


## Phase 5 pattern-state rule

Pattern editing is part of the Sound Orb document model.

Rhythm patterns store:
- 16 boolean steps;
- friendly groove feel;
- variation counter.

Melodic patterns store:
- 16 optional scale-degree values;
- friendly groove feel;
- variation counter.

The UI never stores note names or raw MIDI pitches. Melody cells store scale degrees only; Harmony maps those degrees into the current World scale at playback time.

A sound without explicit edited pattern state uses the sound definition's default pattern. The first user edit materializes that pattern into the Sound Orb document.

Duplicate preserves edited patterns. Change preserves a pattern only when the old and new sounds share the same broad pattern kind (rhythm → rhythm or melody → melody); incompatible changes intentionally reset to the new sound's default.

Groove is implemented as a bounded per-orb timing offset applied to already-quantized scheduler ticks. It does not replace the shared transport or create per-orb clocks.


## Phase 6 Effect Field rule

Effect Fields are serializable World geometry, not audio-plugin instances.

Each field stores only:
- id;
- type;
- normalized center;
- normalized radius.

PlaygroundEngine computes field depth for each Sound Orb and applies the resulting five effect amounts to that orb's persistent EffectRack.

During direct manipulation, App can preview a temporary field geometry in PlaygroundEngine before committing it through EffectFieldActions. The preview path changes AudioParams only; it never becomes a second persistent state model.

The runtime chain is:

ProceduralInstrument → EffectRack → SpatialVoice → master graph

EffectRack order is intentionally fixed and hidden:
Filter → Heat → Frost → Echo → Space.

All wet/feedback parameters remain bounded and smoothed.


## Phase 7 Motion rule

World state stores Motion rules and Sound Orb anchors, not live animation positions.

Runtime evaluation order:

saved Sound Orb anchors
→ independent Motion presets
→ Follow pass
→ playground toys
→ live positions
→ Effect Field depth
→ SpatialVoice

App owns the demand-driven requestAnimationFrame lifecycle because rendering is a UI concern. MotionEngine is a pure deterministic evaluator and contains no DOM or audio dependencies.

PlaygroundEngine consumes the same live positions to update SpatialVoice and EffectRack. This prevents audio and visuals from diverging.

Manual Sound Orb drag uses a transient override that wins over Motion until pointer commit. The commit moves the saved anchor and releases the override.

Effect Field and toy drag previews are transient runtime state. Motion frames use those previews without serializing them each frame.

Playground toys are bounded geometry transforms, not physics bodies. Phase 7 intentionally has no collision solver, velocity integration, acceleration model, or Doppler simulation.


## Phase 8 Link rule

Links are serializable relationships, not audio connections.

World stores:
- Link id;
- fixed Link type;
- source Sound Orb id;
- target Sound Orb id.

Reactive playback uses a two-pass scheduler:

1. schedule allowed base events;
2. derive Pulse Together, Link Follow, and Kick Pushes Bass reactions from those base events.

Pass-2 events never become new Link sources. This prevents recursive reactive graphs and keeps timing deterministic.

Take Turns gates base patterns by bar parity rather than rewriting pattern documents.

Copy Movement belongs to live-position geometry:

saved anchors
→ Phase 7 Motion
→ Phase 7 toys
→ Phase 8 Copy Movement
→ Effect Fields
→ SpatialVoice

SpatialVoice owns a separate reactiveGain node for Kick Pushes Bass so reactive pumping does not overwrite listener-distance gain automation.

LinkView owns only visual relationship rendering and editor interaction. It receives the same live Sound Orb positions used by the runtime, keeping Link curves aligned with Motion and manual drag.


## Phase 9 Magic rule

Magic is an operation over the existing World document, not a new persistent object type.

World schema remains version 7.

Per-object Magic targets:
- Sound Orb;
- Effect Field;
- playground toy.

Global Remix targets the World.

Mutation seed derives from:
- World musical seed;
- target identity;
- intent;
- strength;
- attempt number.

Wall-clock time does not influence creative randomness.

Sound Orb Magic preserves:
- id;
- role;
- anchor position;
- mute state;
- existing Link structure.

Same-role sound changes, pattern changes, and Motion changes are allowed.

Global Remix preserves object counts, IDs, roles, and Link definitions. It may mutate a deterministic subset of sounds/patterns/Motion/field geometry/toy geometry and bounded BPM.

Magic preview is transactional AppState:

base World → live preview World → Keep / Retry / Revert

Retry and strength changes always regenerate from the base World, never from the previous preview.

Keep stores a one-step transient Magic undo pair. Undo remains available only while the current World is the exact kept World, preventing later unrelated edits from being accidentally reverted.

During an active preview, the main canvas is pointer-locked while audio/Motion/Links continue running. This prevents hidden edits from being destroyed by Retry/Revert.

Magic creates no additional audio graph, scheduler, worker, or animation loop.


## Phase 10 persistence rule

Persistence is a boundary around WorldDocument, not part of audio scheduling.

World schema v8 replaces the old Snapshot placeholder array with typed SnapshotDocument objects. Snapshot payloads contain playable creative state but exclude the Snapshot collection itself, preventing recursive documents.

Library metadata is stored separately from the World:
- lastOpenedAt;
- deletedAt;
- active World id.

The IndexedDB database `loop-local` contains:
- `worlds`;
- `meta`;
- `quarantine`.

WorldRepository is the only application-facing persistence boundary. Every loaded/imported record passes through WorldMigration before entering AppState.

Migration:
- recovers schemas v1–v8;
- revalidates current Sound/Field/Toy/Link rules;
- can drop damaged child records with warnings;
- rejects invalid roots;
- rejects unsupported future schemas rather than guessing.

Unrecoverable stored Worlds are quarantined best-effort and removed from the normal library. User Trash remains a separate recoverable state.

Autosave watches immutable World-reference changes, not UI state. It is debounced, ignores active Magic preview Worlds, flushes when the document becomes hidden, and performs a final serialized save before Home library operations.

The active World id allows reload/restart restoration. Restored playback remains stopped until a new browser user gesture.

General WorldHistory is intentionally session-only and bounded to 64 past states. It resets when switching Worlds and supports top-bar + Ctrl/Cmd keyboard undo/redo.

Snapshot recall:
- immediate while stopped;
- queued to the next bar through MusicalTransport while playing;
- cancelled if a newer material World edit occurs before recall fires.

Backup format is versioned JSON (`loop-world-backup`, version 1). Imported Worlds are always assigned new World ids, preventing silent overwrite.


## Phase 11 capture rule

Performance capture records the already-limited master, not individual Sound Orbs.

Normal master:

master gain → safety limiter → speakers

Temporary recording branch:

safety limiter → MediaStreamAudioDestinationNode → MediaRecorder

AudioEngine creates/disposes the temporary tap; it does not expose the limiter itself to the UI.

MasterRecorder owns:
- one-active-recording state;
- MIME negotiation;
- 1-second chunk collection;
- 10-minute hard limit;
- Stop/Cancel behavior;
- browser-initiated Stop/Error recovery;
- tap cleanup.

The app owns only user-facing orchestration and the transient finished artifacts.

The browser's original MediaRecorder file is the primary export. Optional WAV conversion is:

recorded Blob → decodeAudioData → PCM16 RIFF/WAVE

Automatic WAV conversion is attempted only for captures ≤3 minutes and only when decodeAudioData succeeds. Native export remains valid if WAV conversion fails.

Recording does not use getUserMedia and requires no microphone permission.

When Record is pressed while musical playback is stopped, the existing browser gesture is used to initialize/resume audio and start the World before capture. Stopping recording is independent from stopping musical playback.

Capture data is never persisted. Object URLs are revoked on discard, replacement, navigation, and teardown.

Backgrounding the document finalizes an active recording rather than promising cross-browser background audio capture.


## Phase 12 visual-system rule

Visual quality is independent from creative/audio state.

Visual settings:
- High;
- Balanced;
- Battery Saver;
- Reduce Motion;
- Reduce Particles;
- Reduce Glow.

Initial quality may use browser hardware/data-saver hints, but an explicit user preference is stored globally in localStorage and wins afterward.

No visual preference is serialized in WorldDocument, Snapshots, backups, or WorldHistory.

VisualSystemView owns one presentation-only effects layer:
- deterministic ambient particles;
- bounded role-colored motion trail points;
- audio-event burst particles.

It does not own requestAnimationFrame. The existing Phase 7 Motion loop forwards live positions only while Motion/toys require them.

Scheduled audio activity remains the timing source for transient game feel:
AudioContext event time → PlaygroundView role pulse + VisualSystemView burst.

Reduce Motion removes travel-heavy effects while preserving brightness/state clarity. Reduce Particles removes ambient/burst/built-in decorative particles. Reduce Glow lowers luminous depth. These reductions compose.

Battery Saver reduces visual extras but never changes timing, DSP, patterns, Motion behavior, Links, Magic, persistence, or recording.

Phase 12 deliberately remains DOM/CSS-first. A WebGL/WebGPU renderer was not introduced because the bounded V1 visual target is satisfied without adding a second rendering architecture immediately before mobile/release hardening.

## Phase 13 mobile/PWA rule

Phase 13 is the final V1 product-build phase.

### Responsive shell
The playground top bar is structurally:
- Brand;
- optional World heading;
- one grouped right-side action cluster.

History controls, visual settings, and Play no longer become independent grid children.

At phone widths:
- safe-area insets protect all shell edges;
- the canvas remains the dominant surface;
- the dock stays one horizontally scrollable row;
- selection panels sit above the dock;
- modal sheets use dynamic viewport-height bounds;
- Home becomes its own contained vertical scroll surface.

Short-height landscape has a dedicated compact mode that hides nonessential copy while preserving creative controls.

### Touch/input
Creative manipulation remains one Pointer Events implementation for mouse, touch, and stylus.

The canvas prevents browser pan/zoom/callout interference during manipulation.

Coarse-pointer action targets are enlarged without creating a separate touch-only creative engine.

### Installability
The manifest is scoped to /loop/ and supplies explicit 192×192, 512×512, and maskable icon entries.

PwaController:
- captures beforeinstallprompt where supported;
- shows install CTA only from Home;
- recognizes standalone mode;
- provides manual Share → Add to Home Screen guidance on iPhone/iPad where appropriate;
- observes online/offline state.

### Offline worker
Production build runs Vite then scripts/generate-service-worker.mjs.

The generator walks actual dist/, validates required PWA assets/icons, excludes sourcemaps/worker, creates /loop/ precache URLs, derives a cache-version hash, and writes dist/sw.js.

Current verified Phase 13 build generated 9 precached URLs.

Worker behavior:
- static scoped GETs: cache-first + runtime fill;
- navigations: network-first + cached app-shell fallback;
- cross-origin/out-of-scope requests: untouched;
- non-GET requests: untouched.

### Updates
New service workers do not auto-skip-waiting.

The current session continues until the user explicitly selects Update. Only then is SKIP_WAITING sent and the app reloads on controllerchange.

This prevents a service-worker update from interrupting active music/editing/recording.

### Feature freeze
After Phase 13:
- no new creative systems;
- no new studio systems;
- no new visual feature expansion.

Phases 14–18 may only audit, fix, certify, and release within the locked product contract.
