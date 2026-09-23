# Phase 6 — Effect Fields Acceptance

## World model
- [x] World schema advanced to version 5.
- [x] Effect Fields are real serializable documents.
- [x] Field document stores id, type, position, and radius.
- [x] Space exists.
- [x] Echo exists.
- [x] Heat exists.
- [x] Frost exists.
- [x] Filter exists.
- [x] V1 field cap is five.
- [x] Normal UI prevents duplicate field types.

## Geometry
- [x] Effect amount is derived from spatial depth.
- [x] Field center reaches full amount.
- [x] Field boundary reaches exact zero.
- [x] Outside produces zero amount.
- [x] Depth uses a smooth interpolation curve.
- [x] Multiple active effects combine without exceeding one.
- [x] Field radius is clamped to safe bounds.
- [x] Field position is clamped to the World.

## Field interaction
- [x] Effects button exists in the playground dock.
- [x] Five-field palette uses plain-language descriptions.
- [x] Existing field types are disabled in the palette.
- [x] Fields are directly draggable.
- [x] Field movement previews audio before World commit.
- [x] Fields are directly resizable.
- [x] Resize previews audio before World commit.
- [x] Selected field has a visible resize handle.
- [x] Selected field has a contextual Delete action.
- [x] Arrow-key field nudging exists.
- [x] Delete/Backspace keyboard removal exists.
- [x] Selecting a field clears Sound Orb selection.
- [x] Selecting a Sound Orb clears field selection.

## Audio runtime
- [x] Each live Sound Orb has one persistent EffectRack.
- [x] EffectRack sits before SpatialVoice.
- [x] Moving fields does not rebuild the audio graph.
- [x] Moving Sound Orbs updates field amounts continuously.
- [x] World sync updates field amounts.
- [x] BPM changes update Echo timing smoothly.
- [x] Removing an orb disposes its EffectRack.
- [x] App teardown disposes EffectRacks.

## DSP
- [x] Filter uses bounded low-pass mapping.
- [x] Heat uses bounded parallel saturation.
- [x] Frost uses bounded short-delay crystalline feedback.
- [x] Echo uses tempo-aware bounded feedback delay.
- [x] Space uses lightweight dual-delay filtered diffusion.
- [x] No feedback path can reach unity.
- [x] Field amounts are clamped.
- [x] AudioParam transitions are smoothed.
- [x] Master limiter remains the final safety boundary.

## Performance
- [x] Per-orb convolution was rejected/removed before Phase 6 close.
- [x] Space uses standard lightweight Web Audio nodes.
- [x] No per-orb granular AudioWorklet is required.
- [x] No persistent visual render loop was introduced.
- [x] Field visuals remain CSS/DOM based pending the later visual phase.

## Visual feedback
- [x] Every field type has a distinct visual identity.
- [x] Field label is visible on the canvas.
- [x] Selected field state is visible.
- [x] Orb visual reflects its strongest active field.
- [x] Orb visual intensity follows field depth.
- [x] Overlapping audio effects can coexist even though one dominant visual treatment is shown.

## Starter Worlds
- [x] Every non-empty starter includes at least one field.
- [x] Starter fields reference valid unique effect types.
- [x] Starter field count stays within the V1 cap.
- [x] Empty World remains free of fields.

## Automated coverage
Tests cover:
- center/boundary field depth;
- smooth depth ordering;
- overlapping effect amounts;
- dominant visual effect calculation;
- radius clamping;
- field Add;
- duplicate-type prevention;
- five-field cap;
- move/position clamping;
- resize bounds;
- field deletion;
- starter field integrity;
- all Phase 1–5 regression tests.

## Scope protection
- [x] No plugin-style parameter panels.
- [x] No mixer sends.
- [x] No physical room acoustics.
- [x] No convolution-per-orb implementation retained.
- [x] No Motion system implemented early.
- [x] No Links implemented early.
- [x] No Phase 9 Magic implemented early.

## Final CI verification

GitHub Actions passed on the completed Phase 6 implementation with:

- dependency installation;
- strict TypeScript typecheck;
- **17 test files**;
- **68 tests**;
- production Vite build.

## Exit condition
- [x] Dependency installation passes.
- [x] Strict TypeScript typecheck passes.
- [x] Complete unit-test suite passes.
- [x] Production Vite build passes.

**Phase 6 status: complete and CI-verified.**
