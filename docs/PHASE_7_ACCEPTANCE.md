# Phase 7 — Motion Playground Acceptance

## World model
- [x] World schema advanced to version 6.
- [x] Sound Orbs can store optional Motion.
- [x] Motion stores mode, Speed, Range, seed, and optional Follow target.
- [x] Still requires no Motion document.
- [x] Playground toys are serializable World documents.
- [x] Toy cap is four.
- [x] UI prevents duplicate toy types.

## Motion presets
- [x] Still exists.
- [x] Orbit exists.
- [x] Bounce exists.
- [x] Drift exists.
- [x] Follow exists.
- [x] Wander exists.
- [x] Motion remains bounded inside the World.
- [x] Motion is deterministic for the same state/time.
- [x] Follow is evaluated after independent Motion.
- [x] Missing Follow target falls back to another nearby Sound Orb.
- [x] Follow does not recursively solve arbitrary dependency graphs.

## Motion controls
- [x] Motion action exists on selected Sound Orbs.
- [x] Slow / Medium / Fast exists.
- [x] Tight / Medium / Wide exists.
- [x] Speed does not implicitly activate Motion while Still.
- [x] Range does not implicitly activate Motion while Still.
- [x] Follow target chooser uses ordinary sound names.
- [x] No coordinates/path editor is exposed.
- [x] No keyframes or automation curves are exposed.

## Runtime
- [x] Saved orb position remains the Motion anchor.
- [x] Live positions are not serialized every frame.
- [x] One demand-driven requestAnimationFrame loop is used.
- [x] Static Worlds stop the Motion frame loop.
- [x] Empty Worlds with toys do not run an empty frame loop.
- [x] Manual orb drag temporarily overrides Motion.
- [x] Drag commit moves the saved anchor.
- [x] Motion resumes after manual drag.
- [x] Runtime Motion drives SpatialVoice.
- [x] Runtime Motion drives Effect Field depth.
- [x] Motion does not rebuild audio graphs.

## Toys
- [x] Spinner exists.
- [x] Magnet exists.
- [x] Repulsor exists.
- [x] Portal exists.
- [x] Spinner rotates nearby live positions.
- [x] Magnet pulls nearby live positions inward.
- [x] Repulsor pushes nearby live positions outward.
- [x] Repulsor handles exact-center direction safely.
- [x] Portal maps IN-region positions near OUT.
- [x] Portal OUT is independently movable.
- [x] Toy transformation order is fixed/deterministic.
- [x] Points outside toy influence remain unchanged.

## Toy interaction
- [x] Toys button exists in playground dock.
- [x] Toy palette uses plain-language descriptions.
- [x] Toys are directly draggable.
- [x] Toy drag uses transient runtime preview.
- [x] Toy drag does not write World state per animation frame.
- [x] Portal OUT drag uses transient preview.
- [x] Toy Delete exists.
- [x] Delete/Backspace works for focused toy bodies.
- [x] Arrow-key toy movement exists.
- [x] Selecting a toy clears orb/field selection.

## Cross-feature integration
- [x] Moving orbs continue to use Effect Fields.
- [x] Motion frames use live pan/presence.
- [x] Manual drag continues to preview field effects.
- [x] Field drag/resize preview is preserved while Motion is running.
- [x] Toy preview affects live motion/audio before commit.
- [x] Duplicate preserves Motion.
- [x] Change sound preserves Motion.
- [x] Delete closes Motion editor when deleting its orb.

## Starter Worlds
- [x] Every non-empty starter contains at least one restrained moving orb.
- [x] Weird demonstrates a Spinner.
- [x] Starter toy counts respect the cap.
- [x] Starter toy types are unique.
- [x] Empty remains motion/toy free.

## Automated coverage
Tests cover:
- Still anchor behavior;
- Orbit bounded movement;
- deterministic Bounce;
- deterministic Drift/Wander;
- Follow movement;
- Follow fallback after target disappearance;
- active-loop detection;
- empty-toy idle-loop behavior;
- Spinner influence;
- Magnet influence;
- Repulsor influence;
- Portal mapping;
- outside-toy no-op;
- Motion actions;
- explicit Motion activation;
- Follow target validation;
- toy Add/duplicate/cap;
- toy move;
- Portal OUT move;
- toy delete;
- Motion preservation on Duplicate;
- Motion preservation on Change;
- starter Motion/toy integrity;
- all Phase 1–6 regression tests.

## Scope protection
- [x] No keyframe editor.
- [x] No automation lanes.
- [x] No arbitrary physics engine.
- [x] No collision system.
- [x] No Doppler simulation.
- [x] No Phase 8 Links implemented early.
- [x] No Phase 9 Magic implemented early.

## Exit condition
Phase 7 is complete only when the exact final main head passes:
- dependency installation;
- strict TypeScript typecheck;
- complete unit-test suite;
- production Vite build.

Final CI result is recorded after documentation/status commits.
