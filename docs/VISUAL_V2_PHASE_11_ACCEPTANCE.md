# Visual V2 Phase 11 — Magic, Portal, Snapshot & State Transitions Acceptance

## Architecture
- [x] unified renderer-only state-transition payload exists.
- [x] payload stores lightweight nodes rather than WorldDocument.
- [x] deterministic transition seed exists.
- [x] transition priority exists.
- [x] transition cancellation/coalescing exists.
- [x] transition frame has bounded beams/lights.
- [x] existing renderer/light/environment infrastructure is reused.

## Magic / Remix
- [x] Magic preview emits current → result transition.
- [x] mutation seed drives visual transition seed.
- [x] Magic strength scales visual intensity.
- [x] targeted Orb Magic focuses the Orb.
- [x] targeted Field Magic focuses the Field.
- [x] targeted toy Magic focuses the toy.
- [x] World Remix can use full bounded World node set.
- [x] retry replaces previous World transition.
- [x] strength change replaces previous World transition.
- [x] state commit is immediate.

## Magic revert / undo
- [x] revert emits preview → base transition.
- [x] revert retains target focus.
- [x] revert contributes reconstruction cue.
- [x] Undo Magic uses existing history logic.
- [x] Undo Magic has reconstruction transition.
- [x] transition does not alter Magic history state.

## Snapshot
- [x] recall emits current → recalled transition at actual commit.
- [x] existing immediate/bar-quantized recall semantics are unchanged.
- [x] Snapshot captures Orb continuity.
- [x] Snapshot captures Field continuity.
- [x] Snapshot captures toy continuity.
- [x] Snapshot captures Link midpoint continuity.
- [x] Snapshot full-world animation is bounded.

## Undo / redo
- [x] normal undo gets reconstruction transition.
- [x] normal redo gets reconstruction transition.
- [x] non-positional edits still receive reconstruction nodes.
- [x] WorldHistory remains authoritative.
- [x] undo/redo commit synchronously.

## Delete
- [x] Orb delete emits target-only dissolution.
- [x] Field delete emits target-only dissolution.
- [x] toy delete emits target-only dissolution.
- [x] deleted object leaves creative state immediately.
- [x] renderer retains only lightweight local trace.
- [x] different delete keys may coexist.

## Portal
- [x] Portal transfer is detected from consecutive final rendered positions.
- [x] detection requires meaningful discontinuity.
- [x] detection requires Portal entry/exit spatial consistency.
- [x] transition seed is deterministic from Portal + Orb.
- [x] entry and exit positions are preserved.
- [x] repeated Portal transfer for one Orb coalesces.
- [x] manual active dragging suppresses automatic Portal cinematic detection.
- [x] MotionEngine remains the only Portal physics authority.

## Rendering
- [x] morph beams reuse cross-system renderer.
- [x] local transition lights reuse light propagation.
- [x] World wave reuses environment shader.
- [x] deletion contributes dissolve state.
- [x] undo/revert contributes reconstruction state.
- [x] listener can receive bounded transition energy.
- [x] High caps transition beams at 12.
- [x] High caps transition lights at 12.
- [x] lower quality reduces transition caps.

## Reduced Motion
- [x] Reduce Motion removes morph beams.
- [x] Reduce Motion removes Portal transit travel.
- [x] destination/current state remains immediate.
- [x] transition local light remains.
- [x] World transition state cue remains.
- [x] dissolve/reconstruction meaning remains.

## Priority / interruption
- [x] Magic has highest transition priority.
- [x] Snapshot outranks history/delete/Portal.
- [x] history outranks delete/Portal.
- [x] same-key transitions replace previous one.
- [x] World-level transition cancels lower-priority visual clutter.
- [x] state is never rolled back by renderer cancellation.

## Tests
- [x] targeted Magic payload is covered.
- [x] Snapshot object-kind continuity is covered.
- [x] target-only delete payload is covered.
- [x] undo/redo unchanged-geometry nodes are covered.
- [x] dense node cap is covered.
- [x] Portal positive detection is covered.
- [x] Portal false-positive rejection is covered.
- [x] Magic world wave/morph frame is covered.
- [x] delete dissolve is covered.
- [x] undo reconstruction is covered.
- [x] Reduce Motion fallback is covered.
- [x] quality beam/light caps are covered.
- [x] Portal coalescing is covered.
- [x] transition priority cancellation is covered.
- [x] event expiry is covered.

## State protection
- [x] no World schema change.
- [x] no persistence migration.
- [x] no audio engine change.
- [x] no Magic semantic change.
- [x] no Snapshot semantic change.
- [x] no Portal physics change.
- [x] no history semantic change.
- [x] no autosave semantic change.
- [x] no hit-test geometry change.

## Exit condition

Phase 11 is complete only when the exact final Phase 11 head passes:

- strict TypeScript typecheck;
- complete unit/soak suite;
- production build;
- Phase 16 browser certification without relaxing its budgets.


## Verification record

The implemented Phase 11 head passed the existing repository verification gates without changing certification budgets:

- strict TypeScript typecheck: passed;
- unit/soak suite: **48 files, 299 tests passed**;
- production Vite build: passed;
- Phase 16 browser certification: passed;
- JS+CSS gzip: **118,073 bytes** (< 120 KiB budget);
- navigation load: **145.6 ms** (< 3,000 ms budget);
- Home → World: **162.3 ms** (< 1,500 ms budget);
- first contentful paint: **224 ms**;
- sampled animation-frame p95: **16.7 ms** (< 80 ms budget);
- average main-thread work per sampled frame: **3.58 ms** (< 8 ms budget);
- post-GC heap growth: **720,368 bytes** (< 5 MiB budget);
- DOM node growth: **115** (< 250 budget);
- longest observed long task: **0 ms**;
- frozen → active lifecycle recovery: passed.

The cinematic transition system therefore remains inside the existing release-performance envelope. Bundle headroom is now narrower, so subsequent Visual V2 phases should prioritize reuse, code consolidation and removal of obsolete legacy presentation paths instead of adding independent rendering stacks.
