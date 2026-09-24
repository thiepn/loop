# Visual V2 Phase 6 — Motion Trails & Kinetic Graphics Acceptance

## History
- [x] renderer-level TrailHistory exists.
- [x] automatic Motion samples final live positions.
- [x] manual Orb dragging uses the same history.
- [x] history stores timestamp/speed/acceleration/turn.
- [x] history stores Field influence.
- [x] history stores strongest toy influence.
- [x] history is bounded per Orb.
- [x] history lifetime is bounded.
- [x] minimum pixel spacing prevents redundant samples.
- [x] World changes clear transient history.

## Quality
- [x] High has longest/densest trail history.
- [x] Balanced uses reduced history.
- [x] Battery Saver uses short sparse history.
- [x] Reduce Motion disables trail history.
- [x] Reduce Particles removes turn fragments without removing ribbons.
- [x] Reduce Glow continues to control overall luminous presentation.

## Role identity
- [x] Beat uses dense short ribbon language.
- [x] Percussion uses narrow segmented trail language.
- [x] Bass uses broad heavy ribbon language.
- [x] Harmony uses layered ribbons.
- [x] Melody uses fine filament language.
- [x] Texture uses broad diffuse trail language.
- [x] Voice uses medium organic ribbon language.

## Kinematics
- [x] trail width responds to speed.
- [x] trail width responds to acceleration.
- [x] turn sharpness is derived from velocity vectors.
- [x] sharp turns can emit bounded fragments.
- [x] stationary micro-movement is filtered.

## Geometry
- [x] High/Balanced centerlines are smoothed.
- [x] Battery Saver can use raw bounded polyline.
- [x] smoothing preserves explicit breaks.
- [x] Portal/large discontinuities create breaks.
- [x] trails never imply a false teleport path.

## Effect Fields
- [x] Space widens/softens trails.
- [x] Echo creates ghost trail copy.
- [x] Heat adds thermal color/turbulence.
- [x] Frost cools/segments trails.
- [x] Filter changes spectral presentation.
- [x] effects use actual sampled Field depth.

## Toys
- [x] trail centerline already reflects MotionEngine toy output.
- [x] Spinner adds visual curvature treatment.
- [x] Magnet concentrates width.
- [x] Repulsor broadens width.
- [x] Portal fades/segments nearby trail.
- [x] strongest toy influence is deterministic.

## WebGL
- [x] dedicated WebGL trail layer exists.
- [x] trail geometry uses triangle ribbons.
- [x] one shared shader/buffer path exists.
- [x] alpha is per vertex.
- [x] Harmony layered ribbons are supported.
- [x] Echo ghost ribbons are supported.
- [x] turn fragments are supported.
- [x] resources participate in context-loss lifecycle.

## Canvas2D
- [x] dedicated Canvas trail layer exists.
- [x] Canvas uses rounded curved segments.
- [x] role widths are preserved.
- [x] Field/toy styles are preserved.
- [x] turn fragments are preserved where particles are enabled.
- [x] existing fallback resolution/cadence policy remains.

## Decay
- [x] age is evaluated against quality lifetime.
- [x] trails fade after Motion stops.
- [x] demand-driven clock stays alive only while visible trail history remains.
- [x] expired points are pruned.
- [x] renderer returns to idle after decay.

## Legacy cleanup
- [x] DOM trail-point generation is removed.
- [x] DOM trail timers are removed.
- [x] DOM trail arrays are removed.
- [x] App no longer feeds legacy VisualSystem trail previews.
- [x] semantic DOM interaction remains unchanged.

## Tests
- [x] quality/lifetime policy is covered.
- [x] Reduce Motion policy is covered.
- [x] role styles are covered.
- [x] bounded sampling is covered.
- [x] speed/acceleration/turn sampling is covered.
- [x] minimum spacing is covered.
- [x] Field/toy sampling is covered.
- [x] expiry/pruning is covered.
- [x] Portal break behavior is covered.
- [x] smoothing/break preservation is covered.
- [x] Field styling is covered.
- [x] toy styling is covered.
- [x] age fade is covered.

## State protection
- [x] no World schema change.
- [x] no persistence migration.
- [x] no audio engine change.
- [x] no Motion semantic change.
- [x] no toy semantic change.
- [x] no Effect Field semantic change.
- [x] no hit-test geometry change.
- [x] no history/autosave change.

## Exit condition

Phase 6 is complete only when the exact final Phase 6 head passes:

- strict TypeScript typecheck;
- complete unit/soak suite;
- production build;
- Phase 16 browser certification without relaxing its budgets.


## Verification record

The implemented Phase 6 head passed the existing repository verification gates without changing certification budgets:

- strict TypeScript typecheck: passed;
- unit/soak suite: **43 files, 240 tests passed**;
- production Vite build: passed;
- Phase 16 browser certification: passed;
- JS+CSS gzip: **99,449 bytes** (< 120 KiB budget);
- navigation load: **429.9 ms** (< 3,000 ms budget);
- Home → World: **779.6 ms** (< 1,500 ms budget);
- sampled animation-frame p95: **16.7 ms** (< 80 ms budget);
- average main-thread work per sampled frame: **3.77 ms** (< 8 ms budget);
- post-GC heap growth: **538,772 bytes** (< 5 MiB budget);
- DOM node growth: **119** (< 250 budget);
- longest observed long task: **0 ms**;
- frozen → active lifecycle recovery: passed.

Renderer-level ribbon trails therefore fit inside the existing release-performance envelope while replacing the DOM trail-point system and preserving headroom for Phase 7 Field materials.
