# Loop — Architecture Baseline

## Status
Updated through Phase 5.

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
- SpatialVoice channels that map orb presence/pan into Web Audio nodes.

No feature may create hidden AudioContexts independently.

### core/music/
Owns musical behavior independent of UI:

- MusicalTransport — BPM, bars/beats, time conversion, quantization;
- LookaheadScheduler — short-horizon audio-time scheduling;
- Harmony — small scale vocabulary and pitch mapping;
- MixPolicy — metadata normalization and voice-count headroom;
- Pattern — serializable rhythm/melody documents, density/groove macros, deterministic variation;
- OrbPattern — schedules each orb’s effective editable pattern;
- PlaygroundEngine — shared transport/scheduler plus one runtime audio channel per Sound Orb.

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
Contains the small observable Store primitive.

The Store has no dependency on DOM or Web Audio and can be tested in isolation.

### core/world/
Owns the serializable World document boundary and pure creative-state mutations.

World schema version 4 contains:
- BPM;
- tonic;
- scale;
- deterministic random seed;
- full SoundOrbDocument objects;
- placeholder collections for later Effect Fields, Links, and Snapshots.

SoundOrbDocument contains:
- id;
- sound id;
- role;
- normalized x/y position;
- mute state;
- optional editable rhythm/melody pattern state.

WorldActions owns immutable:
- move;
- mute/unmute;
- duplicate;
- delete;
- Add from the sound palette;
- Replace while preserving orb identity/position/mute.

StarterWorlds owns the bounded starter templates (Beat, Chill, Dreamy, Dance, Weird, Empty) and lightweight starter Surprise Me behavior.

PatternActions owns immutable pattern painting, clear, density, groove, and variation edits.

SpatialMapping translates normalized position into bounded stereo pan and listener-distance presence.

### core/assets/
Resolves static assets through Vite's BASE_URL so production assets work under GitHub Pages at /loop/.

All future public asset references should go through this boundary rather than hard-coded root paths.

### core/platform/
Centralizes capability detection rather than scattering browser checks through feature code.

## Dependency direction

UI/app → domain/core modules

Core modules must not import the application shell.

Audio, music, sounds, World, state, asset, and platform modules should remain independently testable.

## State ownership
Avoid duplicated mutable truth.

Examples:
- AudioContext and master graph belong to AudioEngine;
- musical clock state belongs to MusicalTransport;
- runtime Sound Orb channels belong to PlaygroundEngine;
- sound metadata belongs to the catalog;
- serializable creative state belongs to World;
- transient selection/playback UI state belongs to AppState/Store;
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

Phase 3 mapping:
- horizontal normalized position → bounded stereo pan;
- distance from center listener → bounded presence gain.

No room geometry, wall simulation, diffraction, or physical propagation belongs in this layer.

## Audio lifecycle
Browsers require user interaction before reliable audio playback.

Therefore:
1. app boots without starting AudioContext;
2. Play initializes/resumes AudioEngine;
3. PlaygroundEngine receives the one AudioRuntime boundary;
4. one SpatialVoice exists per live Sound Orb;
5. procedural event sources connect into each orb channel;
6. removal/deletion tears down that orb channel;
7. app teardown disposes the playground and closes AudioEngine.

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

## GitHub Pages
The production URL is expected to use the repository path:
https://thiepn.github.io/loop/

Vite therefore uses:
base: '/loop/'

Static public assets must be addressed through import.meta.env.BASE_URL or AssetLoader.

Deployment itself remains a release task. The architecture is compatible now, but unfinished builds are not published as the product.

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
- pattern preservation/reset behavior across duplicate/change.

Future phases add tests at their domain boundaries.

## Error handling
The root bootstrap catches fatal startup failures and renders a recoverable fallback instead of leaving a blank page.

Recoverable subsystem errors, such as denied audio initialization, update app state without crashing the shell.

## Performance baseline
The scheduler runs only while musical playback is active.

Procedural sources are finite-lived and clean themselves up after ending.

Sound Orb visuals use lightweight DOM/CSS animation in Phase 3. Heavier rendering remains deferred to the dedicated visual phase.

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
