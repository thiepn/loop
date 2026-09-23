# Loop — Architecture Baseline

## Status
Phase 1 architecture contract.

The architecture is intentionally smaller than the old Spatial Tape Matrix experiments. It provides clear boundaries for future phases without pre-building advanced systems.

## Runtime layers

### app/
Owns application bootstrap, top-level UI lifecycle, and fatal-error handling.

It may orchestrate domain services but should not implement audio DSP or World rules directly.

### core/audio/
Owns browser audio lifecycle and the eventual master audio graph.

Phase 1 includes only:
- AudioContext feature detection;
- user-gesture initialization;
- master gain;
- safety limiter;
- suspend/resume/close lifecycle.

Musical transport, scheduling, voices, and effects belong to later phases.

### core/state/
Contains a small observable Store primitive.

The Store has no dependency on DOM or Web Audio and can be tested in isolation.

### core/world/
Owns the serializable World document boundary.

Phase 1 defines schema versioning and an empty World shape only. Later phases may replace placeholder ID collections with richer typed entities while preserving explicit schema migration.

### core/assets/
Resolves static assets through Vite's BASE_URL so production assets work under GitHub Pages at /loop/.

All future public asset references should go through this boundary rather than hard-coded root paths.

### core/platform/
Centralizes capability detection rather than scattering browser checks through feature code.

## Dependency direction

UI/app → domain/core modules

Core modules must not import the application shell.

Audio, World, state, asset, and platform modules should remain independently testable.

## State ownership
Avoid duplicated mutable truth.

Examples:
- audio runtime objects belong to AudioEngine;
- serializable creative state belongs to World;
- transient application shell state belongs to AppState/Store;
- rendered DOM is a projection of state, not a second data model.

## Audio lifecycle
Browsers require user interaction before reliable audio playback.

Therefore:
1. app boots without starting AudioContext;
2. user chooses Turn on sound;
3. AudioEngine initializes or resumes;
4. future audio features connect through AudioEngine.input;
5. teardown disconnects nodes and closes context.

No feature may create hidden AudioContexts independently.

## GitHub Pages
The production URL is expected to use the repository path:
https://thiepn.github.io/loop/

Vite therefore uses:
base: '/loop/'

Static public assets must be addressed through import.meta.env.BASE_URL or AssetLoader.

Deployment itself remains a release task. Phase 1 establishes compatibility but does not publish an unfinished product.

## Testing baseline
Phase 1 tests:
- generic state subscription/update behavior;
- World document construction/schema defaults;
- GitHub Pages asset path resolution.

Later phases add tests at their domain boundaries.

## Error handling
The root bootstrap catches fatal startup failures and renders a recoverable fallback instead of leaving a blank page.

Recoverable subsystem errors, such as denied audio initialization, update app state without crashing the shell.

## Performance baseline
Phase 1 deliberately contains no render loop and no sound scheduler.

Future systems must justify persistent animation/audio work and must be pausable when hidden or unnecessary.

## Architecture rule
Do not create a subsystem because the roadmap mentions it eventually.

Create the smallest stable boundary needed for the current phase, then extend it when the user-facing feature arrives.
