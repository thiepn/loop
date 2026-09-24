# Visual V2 Phase 7 — Effect Fields V2 Acceptance

## Field identity
- [x] deterministic Field material model exists.
- [x] material seed is stable across move/resize previews.
- [x] all five Field types have distinct edge/material character.
- [x] organic boundaries remain bounded near real geometry.
- [x] selection remains visible.
- [x] Phase 5 resize tension remains integrated.

## Space
- [x] nebular volume treatment exists.
- [x] cloud structure exists.
- [x] optional star/mote detail exists.
- [x] Orbs gain spatial aura treatment.
- [x] trails widen/soften.
- [x] World receives bounded cool ambience.

## Echo
- [x] temporal concentric Field rings exist.
- [x] Orbs receive after-rings.
- [x] trails receive ghost copies.
- [x] World receives restrained cyan ambience.
- [x] no second musical clock is introduced.

## Heat
- [x] most turbulent boundary profile exists.
- [x] internal thermal-band treatment exists.
- [x] Orbs receive warm/turbulent transformation.
- [x] trails receive thermal color/turbulence.
- [x] World receives bounded warmth.

## Frost
- [x] crystalline/faceted treatment exists.
- [x] radial fracture/ray structure exists.
- [x] Orbs receive pale crystalline response.
- [x] trails narrow/segment.
- [x] World receives bounded cool ambience.

## Filter
- [x] spectral threshold material exists.
- [x] horizontal spectral bands exist.
- [x] Orbs receive spectral/darker treatment.
- [x] trails receive spectral treatment.
- [x] World receives bounded green/cyan ambience.
- [x] no technical frequency-response UI is introduced.

## Orb entry/exit
- [x] target influence comes from existing Field geometry.
- [x] renderer-only transition state exists.
- [x] entry is visually smoothed.
- [x] exit is visually smoothed.
- [x] transition can finish after Orb motion stops.
- [x] Reduce Motion makes transitions immediate.
- [x] transition state is removed for deleted Orbs.
- [x] transition state is cleared on World change/destroy.

## Intersections
- [x] two-Field overlap geometry is derived.
- [x] overlap position is bounded.
- [x] overlap radius/strength are bounded.
- [x] pair material blends both Field identities.
- [x] three-or-more overlap is detected.
- [x] 3+ overlap uses simplified neutral material.
- [x] visual intersections are capped at five strongest.
- [x] overlap audio semantics are unchanged.

## Environment
- [x] Field environment summary is projected into RenderScene.
- [x] global influence scales by Field coverage.
- [x] Space ambience is bounded.
- [x] Echo ambience is bounded.
- [x] Heat ambience is bounded.
- [x] Frost ambience is bounded.
- [x] Filter ambience is bounded.
- [x] overlap ambience is bounded.

## WebGL
- [x] dedicated Field material layer exists.
- [x] generic Field placeholder discs are removed.
- [x] one shared Field shader/buffer path exists.
- [x] all five materials render from type uniforms.
- [x] intersection rendering uses the same bounded layer.
- [x] resources participate in context-loss lifecycle.
- [x] Orb Field uniforms are consumed by Orb shader.
- [x] Orb fragment motion-scale declaration is corrected.

## Canvas2D
- [x] dedicated Field material layer exists.
- [x] procedural boundaries exist.
- [x] all five material identities have fallback rendering.
- [x] intersection rendering exists.
- [x] Orb Field transformation exists.
- [x] global Field atmosphere exists.
- [x] existing fallback resolution/cadence remains.

## Reduced effects
- [x] Reduce Motion freezes Field motion.
- [x] Reduce Motion makes Orb influence transitions immediate.
- [x] Reduce Particles removes Space particle detail.
- [x] Reduce Particles does not remove Field bodies.
- [x] Reduce Glow continues to scale luminous contribution.
- [x] state/boundary readability survives combined reductions.

## Tests
- [x] deterministic material identity is covered.
- [x] type-specific boundary character is covered.
- [x] two-Field intersection geometry is covered.
- [x] 3+ overlap simplification is covered.
- [x] maximum intersection cap is covered.
- [x] separated Fields produce no overlap material.
- [x] environment coverage scaling is covered.
- [x] overlap environment energy is covered.
- [x] smooth Orb entry is covered.
- [x] Reduce Motion immediate transition is covered.
- [x] deleted-Orb transition cleanup is covered.
- [x] SceneAdapter Field material/intersection projection is covered.
- [x] preview material continuity is covered.

## State protection
- [x] no World schema change.
- [x] no persistence migration.
- [x] no audio engine change.
- [x] no Field DSP semantic change.
- [x] no overlap audio semantic change.
- [x] no hit-test geometry change.
- [x] no history/autosave change.

## Exit condition

Phase 7 is complete only when the exact final Phase 7 head passes:

- strict TypeScript typecheck;
- complete unit/soak suite;
- production build;
- Phase 16 browser certification without relaxing its budgets.


## Verification record

The implemented Phase 7 head passed the existing repository verification gates without changing certification budgets:

- strict TypeScript typecheck: passed;
- unit/soak suite: **44 files, 253 tests passed**;
- production Vite build: passed;
- Phase 16 browser certification: passed;
- JS+CSS gzip: **104,568 bytes** (< 120 KiB budget);
- navigation load: **436.4 ms** (< 3,000 ms budget);
- Home → World: **588.0 ms** (< 1,500 ms budget);
- sampled animation-frame p95: **16.8 ms** (< 80 ms budget);
- average main-thread work per sampled frame: **4.26 ms** (< 8 ms budget);
- post-GC heap growth: **569,772 bytes** (< 5 MiB budget);
- DOM node growth: **125** (< 250 budget);
- longest observed long task: **0 ms**;
- frozen → active lifecycle recovery: passed.

The procedural Field materials, overlap rendering, Orb influence transitions and global environment coupling therefore remain inside the existing release-performance envelope while preserving headroom for Phase 8 cross-system interactions.
