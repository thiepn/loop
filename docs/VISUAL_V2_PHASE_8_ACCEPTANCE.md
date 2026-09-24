# Visual V2 Phase 8 — Cross-System Visual Interaction Acceptance

## Architecture
- [x] dedicated cross-system derivation model exists.
- [x] cross data is render-only.
- [x] SceneAdapter projects Orb/Field/Link/toy cross state.
- [x] creative documents remain unchanged.
- [x] cross-system relationships are capped/deterministic.
- [x] no full combinatorial interaction graph is built.

## Orb ↔ Orb
- [x] nearby Orb coupling strength is derived.
- [x] far Orbs do not couple.
- [x] dense 12-Orb Worlds cap visual pairs at six.
- [x] strongest neighbor direction is derived.
- [x] neighbor-light accumulation is bounded.
- [x] shared aura bridge rendering exists in WebGL.
- [x] shared aura bridge rendering exists in Canvas.
- [x] bridge colors interpolate role identities.
- [x] scheduled Orb pulses amplify related bridges.
- [x] Reduce Glow reduces bridge strength.

## Wake ↔ Orb
- [x] active dragged Orbs can influence nearby Orb materials.
- [x] wake strength is distance/speed bounded.
- [x] wake direction is derived from real rendered positions.
- [x] saved Orb positions are never modified.
- [x] existing Reduce Motion drag scaling limits wake response.

## Orb ↔ toy
- [x] strongest local toy influence is projected per Orb.
- [x] Spinner changes Orb visual material.
- [x] Magnet concentrates Orb material.
- [x] Repulsor expands Orb material.
- [x] Portal tints/fades Orb material.
- [x] MotionEngine toy behavior remains authoritative.

## Field ↔ Orb
- [x] Phase 7 Field influence remains continuous.
- [x] nearby Orbs add bounded local Field energy.
- [x] Field → Orb and Orb → Field visual response both exist.
- [x] Field DSP semantics are unchanged.

## Field ↔ Link
- [x] each Link samples Field influence along its span.
- [x] dominant Field type is derived.
- [x] bounded refraction strength is derived.
- [x] refraction direction is deterministic.
- [x] midpoint-zero case uses deterministic perpendicular fallback.
- [x] Field influence changes Link color.
- [x] Echo creates ghost Link presentation.
- [x] Frost can segment Link presentation.
- [x] Link pulse follows the same refracted geometry.
- [x] Link semantics are unchanged.

## Link ↔ toy
- [x] strongest toy influence is sampled at Link midpoint.
- [x] Spinner refines Link spatial curve.
- [x] Magnet concentrates Link refraction.
- [x] Repulsor exaggerates Link refraction.
- [x] Portal adds bounded Link disturbance.
- [x] no toy interaction creates/deletes a Link.

## Field ↔ toy
- [x] toy body receives Field material tint.
- [x] Field receives strongest nearby toy influence.
- [x] Spinner changes Field boundary visually.
- [x] Magnet compresses Field boundary visually.
- [x] Repulsor expands Field boundary visually.
- [x] Portal changes Field boundary visually.
- [x] Field radius/DSP geometry stays authoritative.

## Toy ↔ Orb
- [x] toy nearby-Orb strength is derived.
- [x] toy presentation responds to nearby Orb energy.
- [x] Field tint and Orb response can combine.
- [x] hit geometry remains unchanged.

## Trails
- [x] existing Field-aware trail material remains.
- [x] existing toy-aware trail material remains.
- [x] final Motion path remains authoritative.
- [x] strongest toy priority remains deterministic.
- [x] Portal trail breaks remain intact.

## Environment / particles
- [x] one strongest toy environmental force is derived.
- [x] force priority is deterministic.
- [x] Spinner produces tangential force presentation.
- [x] Magnet produces inward force presentation.
- [x] Repulsor produces outward force presentation.
- [x] Portal produces stronger inward force presentation.
- [x] WebGL environment consumes the force.
- [x] Canvas particles consume the force.
- [x] Reduce Motion removes displacement.
- [x] Orb coupling energy contributes bounded ambience.

## Density / simplification
- [x] Orb pair cap scales down with density.
- [x] Field intersection cap from Phase 7 remains.
- [x] only one environment force is active.
- [x] Link Field sampling is fixed at five samples.
- [x] strongest-object priorities use deterministic tie-breaking.

## Tests
- [x] near/far Orb coupling is covered.
- [x] dense coupling cap/determinism is covered.
- [x] drag-wake propagation is covered.
- [x] Field-aware Link sampling/refraction is covered.
- [x] centered-Field refraction fallback is covered.
- [x] Link toy influence is covered.
- [x] toy Field/Orb reciprocity is covered.
- [x] environment-force priority is covered.
- [x] Field-influenced color mixing is covered.
- [x] full SceneAdapter cross projection is covered.

## State protection
- [x] no World schema change.
- [x] no persistence migration.
- [x] no audio engine change.
- [x] no Link semantic change.
- [x] no Field DSP change.
- [x] no toy physics change.
- [x] no Motion semantic change.
- [x] no hit-test geometry change.
- [x] no history/autosave change.

## Exit condition

Phase 8 is complete only when the exact final Phase 8 head passes:

- strict TypeScript typecheck;
- complete unit/soak suite;
- production build;
- Phase 16 browser certification without relaxing its budgets.


## Verification record

The implemented Phase 8 head passed the existing repository verification gates without changing certification budgets:

- strict TypeScript typecheck: passed;
- unit/soak suite: **45 files, 263 tests passed**;
- production Vite build: passed;
- Phase 16 browser certification: passed;
- JS+CSS gzip: **108,993 bytes** (< 120 KiB budget);
- navigation load: **396.5 ms** (< 3,000 ms budget);
- Home → World: **486.0 ms** (< 1,500 ms budget);
- sampled animation-frame p95: **16.8 ms** (< 80 ms budget);
- average main-thread work per sampled frame: **5.06 ms** (< 8 ms budget);
- post-GC heap growth: **474,524 bytes** (< 5 MiB budget);
- DOM node growth: **117** (< 250 budget);
- longest observed long task: **0 ms**;
- frozen → active lifecycle recovery: passed.

The cross-system coupling layer therefore remains inside the existing release-performance envelope while preserving headroom for Phase 9 deliberate Link/listener/light propagation.
