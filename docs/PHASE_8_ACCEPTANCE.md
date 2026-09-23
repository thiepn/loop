# Phase 8 — Links & Reactive Music Acceptance

## World model
- [x] World schema advanced to version 7.
- [x] Links are typed serializable LinkDocument values.
- [x] Link stores id/type/source/target.
- [x] World Link cap is eight.
- [x] Pulse Together exists.
- [x] Take Turns exists.
- [x] Link Follow exists.
- [x] Kick Pushes Bass exists.
- [x] Copy Movement exists.

## Validation
- [x] Self-links are rejected.
- [x] Exact duplicate relationships are rejected.
- [x] Playback-driver target has at most one incoming Pulse/Follow.
- [x] Playback-driver chains are rejected.
- [x] Take Turns participants cannot belong to multiple Take Turns pairs.
- [x] Take Turns is isolated from conflicting playback-driver relationships.
- [x] Kick Pushes Bass only accepts Beat/Percussion → Bass.
- [x] Pulse/Follow reject Texture targets.
- [x] Copy Movement target has at most one driver.
- [x] Copy Movement chains are rejected.
- [x] Copy Movement cycle detection remains defensive.
- [x] Invalid choices remain visible/disabled in the UI with a reason.

## Pulse Together
- [x] Target base pattern is suppressed.
- [x] Source base pattern remains active.
- [x] Target reactive event uses source actual audio-event time.
- [x] Reactive target event does not recursively trigger Links.
- [x] Target still follows World harmony/scale.

## Take Turns
- [x] Even bars allow the source.
- [x] Odd bars allow the target.
- [x] Stored patterns are not rewritten.
- [x] Relationship visual can pulse for whichever participant is active.

## Link Follow
- [x] Target base pattern is suppressed.
- [x] Target responds one 16th after the source.
- [x] Delay derives from MusicalTransport rather than an independent timer.
- [x] Phase 7 Motion Follow remains a separate concept.

## Kick Pushes Bass
- [x] Trigger derives from source base audio event.
- [x] Bass uses a separate reactive gain stage.
- [x] Reactive gain does not overwrite spatial-presence gain automation.
- [x] Push amount is bounded.
- [x] Link line pulses.
- [x] Bass receives a visible source→target push reaction.
- [x] No compressor/sidechain terminology appears in the UI.

## Copy Movement
- [x] Target mirrors source live displacement around its own anchor.
- [x] Copy applies after ordinary Motion/toy geometry.
- [x] Saved target anchor remains unchanged.
- [x] Manual source drag previews copied target movement.
- [x] Copy target spatial audio updates during manual preview.
- [x] Copy target Effect Field depth updates during manual preview.
- [x] Link curve follows copied target movement.
- [x] Static Copy Movement does not start the Motion frame loop.

## Scheduler architecture
- [x] Base events are scheduled first.
- [x] Reactive Links consume only base events.
- [x] Reactive events do not become new Link sources.
- [x] OrbPattern exposes actual scheduled event time.
- [x] Phase 5 groove offset is preserved.
- [x] Reactive visual timing uses AudioContext-relative event time.
- [x] Target reactive events emit ordinary orb activity feedback.

## Link UI
- [x] Selected Sound Orb has Link action.
- [x] Link editor is source-first.
- [x] Targets use friendly sound names.
- [x] All five relationships use plain-language labels.
- [x] Invalid relation choices are disabled with explanation.
- [x] Links render as curves behind Sound Orbs.
- [x] Lines update with Motion.
- [x] Lines update with toy movement.
- [x] Lines update during manual orb drag.
- [x] Link curves are pointer-selectable.
- [x] Keyboard selection/deletion exists.
- [x] Selected Link has contextual Delete.
- [x] Link visual style differs by relationship type.

## Lifecycle
- [x] Deleting a Sound Orb removes attached Links.
- [x] Changing a sound prunes only Links that become role-incompatible.
- [x] Valid Links survive sound replacement.
- [x] Duplicating a Sound Orb does not silently duplicate/reassign Links.
- [x] Link selection is cleared when its relationship disappears.
- [x] App teardown unsubscribes Link activity listeners.

## Starter Worlds
- [x] Beat demonstrates Kick Pushes Bass.
- [x] Chill demonstrates Copy Movement.
- [x] Dreamy demonstrates Pulse Together.
- [x] Dance demonstrates Take Turns.
- [x] Weird demonstrates Link Follow.
- [x] Empty has no Links.
- [x] Starter Links pass the public validation rules.
- [x] Starter Link IDs are unique.

## Automated coverage
Tests cover:
- valid Link creation;
- self/duplicate rejection;
- one incoming playback driver;
- playback-driver chain rejection;
- Take Turns participant conflict;
- Take Turns/playback-driver isolation;
- eight-Link cap;
- Kick Push role restrictions;
- texture playback-target rejection;
- Copy Movement driver conflict;
- Copy Movement chain protection;
- Link deletion;
- Pulse/Follow base suppression;
- Take Turns even/odd gating;
- reactive-source filtering;
- exact one-16th Follow delay;
- Copy Movement geometry;
- static Copy Movement idle behavior;
- Link cleanup on orb deletion;
- role-change Link pruning;
- starter Link integrity;
- all Phase 1–7 regression tests.

## Scope protection
- [x] No CV values.
- [x] No patch-bay UI.
- [x] No arbitrary routing graph.
- [x] No recursive reactive feedback.
- [x] No signal/audio routing.
- [x] No MIDI routing.
- [x] No user-defined logic language.
- [x] No automation lanes.
- [x] No Phase 9 Magic implemented early.

## Exit condition
Phase 8 is complete only when the exact final main head passes:
- dependency installation;
- strict TypeScript typecheck;
- complete unit-test suite;
- production Vite build.

Final CI result is recorded after documentation/status commits.
