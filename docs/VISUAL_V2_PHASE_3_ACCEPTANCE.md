# Visual V2 Phase 3 — World Environment, Atmosphere & Depth Acceptance

## Environment model
- [x] World palette derives from existing creative state.
- [x] role colors contribute to the environment.
- [x] mute state reduces a role's palette influence.
- [x] Effect Fields contribute to secondary atmosphere.
- [x] World id and music seed produce a deterministic visual seed.
- [x] derived environment data is not persisted.
- [x] empty Worlds have a deterministic restrained fallback atmosphere.

## Depth
- [x] Far depth band exists.
- [x] World plane remains visually dominant.
- [x] Near particle band exists.
- [x] near/far layers use different parallax strength.
- [x] depth presentation does not alter hit testing.
- [x] there is no navigable Z coordinate.

## WebGL atmosphere
- [x] dedicated environment shader exists.
- [x] procedural dual-color haze exists.
- [x] low-frequency fog exists.
- [x] deterministic far/near mote fields exist.
- [x] vignette exists.
- [x] subtle grain/dither exists.
- [x] recording receives restrained environmental tint.
- [x] shader resources participate in context-loss lifecycle.

## Canvas2D fallback
- [x] deep backdrop exists.
- [x] primary and secondary haze exist.
- [x] deterministic far/near particles exist.
- [x] event-position light exists.
- [x] pointer light exists.
- [x] recording tint exists.
- [x] Phase 2 software-rendering limits remain intact.

## Musical environment
- [x] Orb activity contributes bounded energy.
- [x] Bass contributes pressure.
- [x] Beat contributes pressure and transient response.
- [x] Percussion contributes transient response.
- [x] strongest recent Orb activity supplies spatial illumination position.
- [x] Link activity may add minor environmental energy.
- [x] no visual event schedules audio.

## Silence / playback
- [x] stopped/silent World is darker and calmer.
- [x] transient environment values expire.
- [x] particles do not require a permanent render loop.
- [x] existing Motion RAF remains authoritative when Motion is active.
- [x] scheduled visual activity may temporarily keep the demand-driven clock alive.

## Pointer / touch
- [x] pointer position is normalized inside the World.
- [x] pointer delta is bounded.
- [x] pointer intensity is bounded.
- [x] pointer events are coalesced rather than accumulated.
- [x] pointer/touch disturbance is presentation-only.
- [x] pointer handlers do not prevent interaction defaults.
- [x] listeners are removed during renderer teardown.

## Density
- [x] Orb density is normalized against the existing World cap.
- [x] dense Worlds reduce ambient particle density.
- [x] dense Worlds reduce atmosphere dominance.
- [x] sparse Worlds preserve more negative-space ambience.

## Quality / accessibility
- [x] High has the richest environment.
- [x] Balanced reduces environment particle detail.
- [x] Battery Saver reduces environment particle detail further.
- [x] Reduce Motion removes directional pointer/parallax motion.
- [x] Reduce Particles removes environment particles.
- [x] Reduce Glow reduces event illumination.
- [x] resting atmosphere remains understandable with all reductions combined.

## Legacy visual handoff
- [x] old DOM ambient particles are removed when Visual V2 renderer is active.
- [x] existing DOM trails remain for Phase 6.
- [x] existing transient burst particles remain until later material/VFX phases.
- [x] semantic DOM interaction objects remain intact.

## Tests
- [x] environment seed determinism is covered.
- [x] palette derivation is covered.
- [x] density-aware ambience is covered.
- [x] quality particle scaling is covered.
- [x] Reduce Particles is covered.
- [x] musical environmental energy is covered.
- [x] bass-pressure derivation is covered.
- [x] reduced-motion pointer behavior is covered.
- [x] pointer-event coalescing is covered.

## State protection
- [x] no World schema change.
- [x] no persistence migration.
- [x] no audio engine change.
- [x] no musical behavior change.
- [x] no history/autosave behavior change.
- [x] no interaction geometry change.

## Exit condition

Phase 3 is complete only when the exact final Phase 3 head passes:

- strict TypeScript typecheck;
- complete unit/soak suite;
- production build;
- Phase 16 browser certification without relaxing its budgets.


## Verification record

The implemented Phase 3 head passed the existing repository verification gates without changing certification budgets:

- strict TypeScript typecheck: passed;
- unit/soak suite: **40 files, 209 tests passed**;
- production Vite build: passed;
- Phase 16 browser certification: passed;
- JS+CSS gzip: **88,069 bytes** (< 120 KiB budget);
- navigation load: **1,070.8 ms** (< 3,000 ms budget);
- Home → World: **1,109.7 ms** (< 1,500 ms budget);
- sampled animation-frame p95: **16.7 ms** (< 80 ms budget);
- average main-thread work per sampled frame: **5.36 ms** (< 8 ms budget);
- post-GC heap growth: **354,988 bytes** (< 5 MiB budget);
- DOM node growth: **123** (< 250 budget);
- longest observed long task: **0 ms**;
- frozen → active lifecycle recovery: passed.

The environment therefore fits inside the existing release-performance envelope while preserving headroom for later Orb/material work.
