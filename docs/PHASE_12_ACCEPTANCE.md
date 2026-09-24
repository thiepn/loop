# Phase 12 — Visual Identity, Game Feel & Delight Acceptance

## Visual architecture
- [x] Dedicated visual-quality policy exists.
- [x] Dedicated VisualSystemView exists.
- [x] Visual effects are presentation-only.
- [x] Visual preferences are not WorldDocument state.
- [x] Visual preference changes do not create World history.
- [x] Visual preference changes do not trigger World autosave.
- [x] No second permanent requestAnimationFrame loop was added.
- [x] Existing Motion loop remains authoritative for live positions.
- [x] Audio scheduling remains independent from visual animation.

## Sound Orb identity
- [x] Orb anatomy includes aura/detail/wave/core layers.
- [x] Beat has distinct heavy/impact identity.
- [x] Percussion has distinct segmented/spark identity.
- [x] Bass has distinct heavy aura/deformation identity.
- [x] Harmony has distinct layered/orbital identity.
- [x] Melody has distinct satellite identity.
- [x] Texture has distinct atmospheric identity.
- [x] Voice has distinct contour identity.
- [x] Selection remains visually clear.
- [x] Mute remains visually clear.
- [x] Labels remain available.
- [x] New orbs receive bounded entrance feedback.

## Audio-reactive game feel
- [x] Audio pulses remain aligned to scheduled AudioContext event time.
- [x] Beat pulse behavior differs from Percussion.
- [x] Bass pulse is slower/heavier.
- [x] Harmony pulse is broader/slower.
- [x] Melody pulse is nimble.
- [x] Texture pulse is soft/longer.
- [x] Voice pulse is expressive.
- [x] Transient burst particles are role-colored.
- [x] Burst particles use the current rendered orb position.
- [x] Reduced Motion removes scale travel but preserves brightness feedback.

## Motion trails
- [x] Trails use live Motion/manual preview positions.
- [x] Trails are role-colored.
- [x] Trail emission requires meaningful distance.
- [x] Trail lifetime is bounded.
- [x] Trail count per orb is bounded.
- [x] Expired trail bookkeeping cannot remove another live point.
- [x] High/Balanced/Battery Saver change trail density.
- [x] Reduce Motion disables trails.
- [x] Removing an orb cleans its trail state.

## Ambient / particles
- [x] Ambient particles are deterministic DOM elements.
- [x] Ambient particles use CSS animation.
- [x] No ambient JS render loop exists.
- [x] Ambient count scales by quality.
- [x] Reduce Particles removes ambient particles.
- [x] Reduce Particles removes audio burst particles.
- [x] Battery Saver trims built-in orb particles.
- [x] Reduced Motion stops continuous built-in orb particle animation.

## Effect Fields
- [x] Space has nebula/star/ring identity.
- [x] Echo has ripple/ghost identity.
- [x] Heat has molten/turbulent identity.
- [x] Frost has crystalline identity.
- [x] Filter has spectral gradient identity.
- [x] Field interaction geometry remains unchanged.
- [x] Field visual treatment scales under quality/reduction settings.

## Toys
- [x] Spinner has orbital identity.
- [x] Magnet visually contracts/pulls.
- [x] Repulsor visually expands/pushes.
- [x] Portal IN/OUT remain distinct.
- [x] Toy animations obey Reduce Motion.

## Links
- [x] Link type styling remains distinct.
- [x] High quality can animate patterned Link energy flow.
- [x] Battery Saver removes extra Link filter cost.
- [x] Link activation pulse remains audio-timed.
- [x] Kick Pushes Bass translation is replaced by brightness under Reduce Motion.

## Listener / canvas
- [x] Listener keeps a clear central identity.
- [x] Playback gives the World subtle alive-state ambience.
- [x] Recording state has restrained visual distinction.
- [x] Canvas remains the dominant surface.
- [x] No fake audio meters/telemetry were introduced.

## Transitions / delight
- [x] Sound Orb entrance exists.
- [x] Effect Field entrance exists.
- [x] toy entrance exists.
- [x] Link entrance exists.
- [x] sheets share consistent entrance language.
- [x] backdrops share consistent fade language.
- [x] contextual panels share consistent entrance language.
- [x] Reduce Motion collapses transition duration.

## Home / brand
- [x] Home retains dark spatial atmosphere.
- [x] Starter cards use living circular-object language.
- [x] Starter art responds on hover/focus.
- [x] World library cards have restrained depth feedback.
- [x] Brand mark has subtle life.
- [x] Home remains non-technical.

## Maximum-density readability
- [x] 9+ Sound Orbs automatically reduce aura noise.
- [x] 9+ Sound Orbs reduce decorative particles.
- [x] 9+ Sound Orbs reduce label prominence.
- [x] Hover/selection restores label prominence.
- [x] V1 12-orb cap remains unchanged.

## Quality system
- [x] High exists.
- [x] Balanced exists.
- [x] Battery Saver exists.
- [x] Automatic initial quality uses hardware/data-saver hints.
- [x] Strong known hardware can select High.
- [x] Constrained hardware/data saver selects Battery Saver.
- [x] Uncertain/middle hardware defaults Balanced.
- [x] Quality affects visuals only.
- [x] Quality does not change audio.
- [x] Quality does not change creative state.

## Accessibility settings
- [x] Reduce Motion exists.
- [x] Reduce Particles exists.
- [x] Reduce Glow exists.
- [x] reductions combine correctly.
- [x] system reduced-motion influences initial settings.
- [x] reduced-motion CSS fallback exists.
- [x] reduced motion preserves state feedback instead of removing all feedback.
- [x] visual settings use everyday language.

## Preference persistence
- [x] Preferences persist in localStorage.
- [x] Preferences are not saved in Worlds.
- [x] Preferences are not exported in World backups.
- [x] malformed saved preferences fall back safely.
- [x] localStorage failure cannot block Loop startup.

## Automated coverage
Tests cover:
- automatic High selection;
- automatic Battery Saver selection;
- Balanced fallback;
- system reduced-motion initial preferences;
- quality profile density ordering;
- combined motion/particles/glow reductions;
- reduced-motion readability profile;
- visual-preference localStorage round-trip;
- malformed local preference fallback;
- all Phase 1–11 regression tests.

## Scope protection
- [x] No new musical system.
- [x] No new DSP.
- [x] No WebGL/WebGPU renderer added just for sophistication.
- [x] No audio behavior changed by quality mode.
- [x] No fake telemetry.
- [x] No DAW/studio visual language.
- [x] No Phase 13 service-worker/PWA work implemented early.

## Exit condition
Phase 12 is complete only when the exact final main head passes:
- dependency installation;
- strict TypeScript typecheck;
- complete unit-test suite;
- production Vite build.

Final CI result is recorded after shared documentation/status commits.
