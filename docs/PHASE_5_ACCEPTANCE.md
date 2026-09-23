# Phase 5 — Playful Beat & Melody Creation Acceptance

## World model
- [x] World schema advanced to version 4.
- [x] Sound Orbs can store optional serializable pattern state.
- [x] Default patterns remain implicit until edited.
- [x] Rhythm and melody patterns are discriminated document types.
- [x] Pattern arrays normalize to exactly 16 steps.

## Rhythm creation
- [x] Editable beat/percussion orbs expose Shape.
- [x] Rhythm editor has 16 steps.
- [x] Tap can add a hit.
- [x] Tap can erase a hit.
- [x] Pointer drag can paint multiple hits.
- [x] Pointer drag can erase multiple hits.
- [x] Clear produces an empty rhythm.
- [x] Pattern changes update live World state.

## Melody creation
- [x] Bass, Chords, Melody, and Voice can expose Shape.
- [x] Melody editor uses seven visual pitch levels.
- [x] Melody editor uses 16 horizontal time steps.
- [x] UI shows High/Low orientation rather than note names.
- [x] Painted values are bounded scale degrees.
- [x] Playback converts scale degrees through the World harmony context.
- [x] Tap/drag painting supports set and erase semantics.
- [x] Texture remains intentionally non-editable in Phase 5.

## Amount / density
- [x] Sparse exists.
- [x] Balanced exists.
- [x] Busy exists.
- [x] Density transforms are bounded.
- [x] Density stays within the selected pattern kind.
- [x] UI exposes no percentage/event-count controls.

## Feel / groove
- [x] Straight exists.
- [x] Bounce exists.
- [x] Loose exists.
- [x] Groove uses bounded timing offsets.
- [x] Downbeats remain unshifted.
- [x] Shared MusicalTransport remains authoritative.
- [x] No per-orb clock was introduced.

## Variation
- [x] Try another exists.
- [x] Variation is deterministic from the same state/seed.
- [x] Variation counter is serializable.
- [x] Melody variation remains inside visible scale-degree bounds.
- [x] Rhythm variation preserves a downbeat anchor when available.
- [x] Successive rhythm variation changes actual hit placement when possible.
- [x] Phase 5 variation is scoped to the selected pattern and does not implement Phase 9 Magic early.

## Orb lifecycle
- [x] Duplicate preserves explicit edited pattern state.
- [x] Change rhythm → rhythm preserves the custom rhythm.
- [x] Change melody → melody preserves the custom melody.
- [x] Incompatible Change resets pattern state.
- [x] Add still creates a safe default-pattern orb without requiring explicit pattern data.
- [x] Delete closes the editor when deleting the edited orb.

## UI
- [x] Selected editable orbs have a Shape action.
- [x] Shape is hidden for non-editable texture orbs.
- [x] Editor is a temporary bottom sheet.
- [x] Rhythm grid is touch/pointer friendly.
- [x] Melody grid scrolls horizontally on narrow screens.
- [x] Amount and Feel controls use everyday language.
- [x] Clear and Try another are available.
- [x] No piano-roll keyboard is shown.
- [x] No permanent sequencer/timeline was added.

## Audio integration
- [x] PlaygroundEngine continues to use one MusicalTransport.
- [x] OrbPattern reads explicit edited pattern or safe sound default.
- [x] Pattern changes do not restart playback.
- [x] Groove modifies scheduled event time only within a bounded offset.
- [x] Texture scheduling remains supported outside editable patterns.

## Automated coverage
Tests cover:
- default rhythm patterns;
- default melody patterns;
- rhythm painting immutability;
- melody degree clamping;
- density classification;
- groove offsets;
- deterministic melody variation;
- grounded successive rhythm variation;
- PatternActions materialization;
- melody World painting;
- density/groove/variation World actions;
- pattern clear;
- texture edit rejection;
- duplicate pattern preservation;
- compatible Change preservation;
- incompatible Change reset;
- all prior Phase 1–4 tests.

## Scope protection
- [x] No DAW timeline.
- [x] No track mixer.
- [x] No piano-roll-first workflow.
- [x] No automation lanes.
- [x] No Effect Fields implemented early.
- [x] No Motion implemented early.
- [x] No Phase 9 global Magic implemented early.

## Exit condition
Phase 5 is complete only when the exact final main head passes:
- dependency installation;
- strict TypeScript typecheck;
- complete unit-test suite;
- production Vite build.

Final CI result is recorded after the status/documentation commits.
