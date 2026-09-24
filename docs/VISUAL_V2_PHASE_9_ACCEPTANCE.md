# Visual V2 Phase 9 — Links, Listener & Light Propagation Acceptance

## Link V2
- [x] dedicated WebGL Link light renderer exists.
- [x] dedicated Canvas Link light renderer exists.
- [x] generic healthy-renderer Link line path is retired.
- [x] source role is projected into RenderLink.
- [x] target role is projected into RenderLink.
- [x] Link color blends source/target roles with Link identity.
- [x] Field influence still modifies Link material.
- [x] Phase 8 transformed geometry remains authoritative.
- [x] selection remains distinct.
- [x] Reduce Glow retains readable core path.

## Link packets
- [x] scheduled Link pulse produces energy packet.
- [x] packet follows transformed Link path.
- [x] directed relationships transport source → target.
- [x] Take Turns uses mirrored packet directions.
- [x] packet color interpolates source/target role color.
- [x] packets expire with existing transient events.

## Link lifecycle
- [x] successful create emits link-created event.
- [x] creation visually grows the tether.
- [x] creation does not delay state commit.
- [x] deletion captures render-only Link snapshot.
- [x] deletion dissipates after creative state removal.
- [x] lifecycle events expire automatically.
- [x] lifecycle events are not persisted.
- [x] legacy hidden SVG pulse animation is skipped under healthy V2.

## Listener
- [x] dedicated WebGL listener material exists.
- [x] dedicated Canvas listener material exists.
- [x] generic renderer listener discs are retired.
- [x] listener has luminous core.
- [x] listener has concentric rings.
- [x] listener has iris geometry.
- [x] listener has bounded energy state.
- [x] listener has arrival response.
- [x] listener has recording rose state.
- [x] listener remains visually distinct from Orbs.

## Orb → listener
- [x] scheduled Orb pulse can create listener packet.
- [x] packet source uses actual rendered Orb/event position.
- [x] packet follows bounded curved travel.
- [x] packet uses role color.
- [x] packet uses current Field tint.
- [x] packet arrival contributes listener energy.
- [x] Reduce Motion removes travel while retaining state feedback.

## Local light
- [x] Orb pulse creates local light.
- [x] Link pulse creates local light.
- [x] selected Orb creates low static light.
- [x] focused Orb creates lower static light.
- [x] selected light is stronger than focused-only light.
- [x] light radius/intensity are bounded.
- [x] Field tint changes emitted light color.
- [x] nonlinear distance falloff exists.

## Light budget
- [x] High caps local lights at 8.
- [x] Balanced caps local lights at 6.
- [x] Battery Saver caps local lights at 4.
- [x] High caps listener packets at 5.
- [x] Balanced caps listener packets at 3.
- [x] Battery Saver caps listener packets at 1.
- [x] source ordering is deterministic.
- [x] simultaneous events can accumulate within the cap.

## Reduced effects
- [x] Reduce Motion removes traveling listener packets.
- [x] Reduce Motion freezes listener continuous motion.
- [x] Reduce Particles removes listener mote.
- [x] Reduce Glow reduces local light and Link glow.
- [x] relationship/listener geometry remains readable.

## Renderer integration
- [x] light propagation renders after object bodies for visible spill.
- [x] listener renders as foreground anchor.
- [x] WebGL resources clean up/context-restore normally.
- [x] Canvas stays under fallback resolution/cadence policy.
- [x] no new permanent animation loop is introduced.

## Tests
- [x] Field-tinted Orb light is covered.
- [x] Orb→listener packet is covered.
- [x] Reduce Motion packet suppression is covered.
- [x] quality local-light caps are covered.
- [x] selected/focused hierarchy is covered.
- [x] recording listener tint is covered.
- [x] directed Link packet semantics are covered.
- [x] Take Turns packet semantics are covered.
- [x] source/target role projection is covered.
- [x] create/delete event expiry is covered.

## State protection
- [x] no World schema change.
- [x] no persistence migration.
- [x] no audio engine change.
- [x] no scheduler timing change.
- [x] no Link semantic change.
- [x] no listener-position change.
- [x] no hit-test geometry change.
- [x] no history/autosave change.

## Exit condition

Phase 9 is complete only when the exact final Phase 9 head passes:

- strict TypeScript typecheck;
- complete unit/soak suite;
- production build;
- Phase 16 browser certification without relaxing its budgets.


## Verification record

The implemented Phase 9 head passed the existing repository verification gates without changing certification budgets:

- strict TypeScript typecheck: passed;
- unit/soak suite: **46 files, 272 tests passed**;
- production Vite build: passed;
- Phase 16 browser certification: passed;
- JS+CSS gzip: **112,762 bytes** (< 120 KiB budget);
- navigation load: **858.0 ms** (< 3,000 ms budget);
- Home → World: **658.5 ms** (< 1,500 ms budget);
- sampled animation-frame p95: **16.7 ms** (< 80 ms budget);
- average main-thread work per sampled frame: **5.32 ms** (< 8 ms budget);
- post-GC heap growth: **652,460 bytes** (< 5 MiB budget);
- DOM node growth: **119** (< 250 budget);
- longest observed long task: **153 ms** (< 200 ms budget);
- frozen → active lifecycle recovery: passed.

The Link V2 renderer, listener material, local light propagation, energy packets and lifecycle choreography therefore remain inside the existing release-performance envelope while preserving room for Phase 10 musical choreography.
