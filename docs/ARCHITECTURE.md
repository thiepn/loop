# Loop — Architecture Baseline

## Status
Updated through Phase 2.

The architecture remains intentionally smaller than the old Spatial Tape Matrix experiments. It creates boundaries only when a user-facing roadmap phase requires them.

## Runtime layers

### app/
Owns application bootstrap, top-level UI lifecycle, temporary phase integration surfaces, and fatal-error handling.

It orchestrates domain services but should not implement timing math, music theory, or audio DSP directly.

### core/audio/
Owns browser audio lifecycle and audio-producing primitives.

Current responsibilities:
- AudioContext feature detection;
- user-gesture initialization;
- master gain;
- safety limiter;
- suspend/resume/close lifecycle;
- one bounded AudioRuntime containing context + destination;
- lightweight procedural event synthesis for the Phase 2 integration groove.

No feature may create hidden AudioContexts independently.

### core/music/
Owns musical behavior that must remain independent of UI:

- MusicalTransport — BPM, bars/beats, time conversion, quantization;
- LookaheadScheduler — short-horizon audio-time scheduling;
- Harmony — small scale vocabulary and pitch mapping;
- MixPolicy — metadata normalization and voice-count headroom;
- FoundationGroove — temporary integration proof using the above systems.

FoundationGroove is not permanent product architecture. Phase 3 should replace its UI role with Sound Orbs while reusing the musical core.

### core/sounds/
Owns built-in sound meaning and compatibility.

Current responsibilities:
- typed sound definitions;
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
Owns the serializable World document boundary.

World schema version 2 now contains musical context:
- BPM;
- tonic;
- scale;
- deterministic random seed.

Creative object collections remain intentionally shallow until their roadmap phases arrive.

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
- sound metadata belongs to the catalog;
- serializable creative state belongs to World;
- transient application shell state belongs to AppState/Store;
- rendered DOM is a projection of state, not a second data model.

## Timing rule
Musical scheduling must not depend on requestAnimationFrame.

Phase 2 uses:
- AudioContext.currentTime as the authoritative clock;
- a short lookahead scheduler for future Web Audio events;
- musical quantization math for safe boundaries.

After long main-thread gaps, missed historical ticks are skipped rather than burst-fired.

## Audio lifecycle
Browsers require user interaction before reliable audio playback.

Therefore:
1. app boots without starting AudioContext;
2. a user action initializes/resumes AudioEngine;
3. future audio systems receive the one AudioRuntime boundary;
4. event sources connect through the AudioEngine destination;
5. teardown stops sources and closes the context.

## Musical intelligence rule
Beginner-facing UI should not calculate:
- scales;
- transposition;
- timing boundaries;
- compatibility;
- headroom.

Those decisions belong to core/music and core/sounds.

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
- built-in catalog integrity.

Future phases add tests at their domain boundaries.

## Error handling
The root bootstrap catches fatal startup failures and renders a recoverable fallback instead of leaving a blank page.

Recoverable subsystem errors, such as denied audio initialization, update app state without crashing the shell.

## Performance baseline
The scheduler runs only while musical playback is active.

Procedural Phase 2 sources are finite-lived and clean themselves up after ending.

Future render loops and expensive DSP must be pausable when hidden or unnecessary.

## Architecture rule
Do not create a subsystem because the roadmap mentions it eventually.

Create the smallest stable boundary needed for the current phase, then extend it when the user-facing feature arrives.
