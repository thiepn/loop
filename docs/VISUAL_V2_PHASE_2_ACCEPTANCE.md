# Visual V2 Phase 2 — Rendering Architecture V2 Acceptance

## Renderer
- [x] WebGL2 is the preferred renderer.
- [x] Canvas2D fallback exists.
- [x] no-renderer fallback preserves semantic DOM operation.
- [x] no third-party rendering engine was added.
- [x] renderer is mounted inside the existing World canvas.
- [x] renderer cannot receive pointer input.

## Scene architecture
- [x] pure World-to-render scene projection exists.
- [x] Sound Orbs project into render state.
- [x] Effect Fields project into render state.
- [x] toys and Portal exits project into render state.
- [x] Links resolve against live Orb positions.
- [x] listener projects independently from Sound Orbs.
- [x] selection state is presentation-only.
- [x] playback/recording state is presentation-only.

## Runtime preview state
- [x] manual Orb previews reach the renderer.
- [x] Motion positions reach the renderer.
- [x] Field move/resize previews reach the renderer.
- [x] toy/Portal previews reach the renderer.
- [x] preview release clears renderer overrides.
- [x] runtime overrides never enter WorldDocument.

## Visual event bridge
- [x] Orb activity can emit renderer pulses.
- [x] Link activity can emit renderer pulses.
- [x] transient events expire automatically.
- [x] renderer events do not create history.
- [x] renderer events do not autosave.
- [x] renderer events do not schedule audio.
- [x] late visual frames cannot delay audio.

## Animation clock
- [x] demand-driven animation clock exists.
- [x] no new permanent requestAnimationFrame loop exists.
- [x] Motion loop remains authoritative for live positions.
- [x] transient event animation keeps the renderer alive only while needed.

## DOM / renderer boundary
- [x] accessible Orb buttons remain DOM.
- [x] Field keyboard and resize hit targets remain DOM.
- [x] toy keyboard and pointer hit targets remain DOM.
- [x] Link keyboard hit paths remain SVG/DOM.
- [x] labels remain DOM.
- [x] dialogs/sheets remain DOM.
- [x] GPU/Canvas owns the placeholder object bodies when available.
- [x] semantic fallback visuals reappear on renderer loss/error.

## WebGL lifecycle
- [x] shader compile/link failures are explicit.
- [x] GPU buffers/programs have explicit cleanup.
- [x] context loss is handled.
- [x] resources are recreated after context restoration.
- [x] viewport is restored after context restoration.

## Canvas lifecycle
- [x] ResizeObserver is used when available.
- [x] window-resize fallback exists.
- [x] backing resolution follows quality-aware DPR.
- [x] High is capped at 2× DPR.
- [x] Balanced is capped at 1.5× DPR.
- [x] Battery Saver is capped at 1× DPR.
- [x] resize does not change World state.

## Instrumentation
- [x] renderer kind is observable.
- [x] frame count is observable.
- [x] average render duration is observable.
- [x] last render duration is observable.
- [x] context-loss count is observable.
- [x] render viewport is observable.
- [x] instrumentation is not persisted.

## Placeholder migration
- [x] Fields have renderer placeholders.
- [x] Links have renderer placeholders.
- [x] toys have renderer placeholders.
- [x] Portal exit has renderer placeholder.
- [x] Orbs have role-colored renderer placeholders.
- [x] listener has renderer placeholder.
- [x] Orb pulse has renderer feedback.
- [x] Link pulse has renderer feedback.
- [x] final material polish is explicitly deferred.

## Regression protection
- [x] scene adapter has unit coverage.
- [x] live position/link resolution has unit coverage.
- [x] preview overrides have unit coverage.
- [x] renderer selection policy has unit coverage.
- [x] DPR policy has unit coverage.
- [x] combined reduced-effect policy has unit coverage.
- [x] transient event lifetime has unit coverage.

## Product/state boundaries
- [x] no World schema change.
- [x] no persistence migration.
- [x] no audio engine change.
- [x] no musical behavior change.
- [x] no interaction model change.
- [x] renderer state creates no undo entries.
- [x] renderer state creates no autosave writes.

## Exit condition

Phase 2 is complete when:
- source integration is checked in;
- unit/type/build verification passes;
- the renderer can survive unsupported WebGL through Canvas2D/DOM fallback;
- existing interaction semantics remain intact;
- Phase 3 can implement atmosphere entirely inside the new renderer architecture.


## Verification record

The completed Phase 2 implementation passed the repository's existing Verify workflow without relaxing any V1 certification budget:

- strict TypeScript typecheck: passed;
- unit/soak suite: **39 files, 203 tests passed**;
- production Vite build: passed;
- Phase 16 browser certification: passed;
- JS+CSS gzip: **83,620 bytes** (< 120 KiB budget);
- Home → World: **525.8 ms** (< 1,500 ms budget);
- sampled animation-frame p95: **16.8 ms** (< 80 ms budget);
- average main-thread work per sampled frame: **2.55 ms** (< 8 ms budget);
- post-GC heap growth: **354,444 bytes** (< 5 MiB budget);
- DOM node growth: **129** (< 250 budget);
- longest observed long task: **0 ms**;
- frozen → active lifecycle recovery: passed.

The performance gate was reached by preserving the existing Motion loop as the authoritative frame driver, rejecting known software WebGL implementations, and using a bounded reduced-resolution Canvas2D fallback rather than weakening certification thresholds.
