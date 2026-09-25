# Visual V2 Phase 16 — Delight & Rare Events Acceptance

## Scope
- [x] delight is presentation-only renderer state.
- [x] no WorldDocument field was added.
- [x] no audio scheduler or musical timing behavior changed.
- [x] no undo/autosave/export payload is affected.
- [x] no progression, reward, unlock or game system was added.
- [x] scheduler-derived choreography events remain the only timing authority.

## Rare constellations
- [x] constellations require at least three active Orbs.
- [x] they occur only at phrase boundaries.
- [x] selection is deterministic from World visual seed + bar.
- [x] dotted constellation geometry is intentionally sparse so it cannot be confused with authored Links.
- [x] they are disabled in Battery Saver and Reduce Motion.

## Rare particle moments
- [x] a bounded shooting-mote moment exists.
- [x] direction, height and timing are deterministic for the World/bar.
- [x] the event cannot affect interaction or hit geometry.
- [x] Reduce Particles disables it.
- [x] Reduce Motion disables it.
- [x] Battery Saver disables it.

## Synchronized alignment
- [x] alignment is eligible only on a simultaneous downbeat.
- [x] it uses Orbs that have real overlapping orb-pulse events.
- [x] it never changes Orb coordinates.
- [x] it is renderer-only and short-lived.
- [x] Reduce Motion and Battery Saver disable it.

## Easter egg
- [x] a very rare three-point listener orbit exists.
- [x] it is deterministic rather than runtime-random.
- [x] it is subtle, input-transparent and music-neutral.
- [x] Reduce Particles, Reduce Motion and Battery Saver disable it.

## Silence settle
- [x] scheduler-reported silent bars can produce settling dust.
- [x] particle count is quality-bounded.
- [x] Reduce Particles removes the dust entirely.
- [x] Reduce Motion keeps the cue static rather than travelling.
- [x] the silence cue never creates an audio event.

## Renderer parity
- [x] one shared model derives exact bounded disc primitives.
- [x] WebGL2 paints them with the existing disc renderer; no delight-specific shader was added.
- [x] Canvas2D paints the same primitives.
- [x] the previously unused generic WebGL line shader/resource was retired to recover bundle budget.
- [x] no-renderer compatibility remains functional without decorative delight.
- [x] renderer canvas remains pointer-transparent.

## Determinism / budgets
- [x] rare-event decisions are derived from World visual seed and scheduler bar.
- [x] event rates are bounded and explicitly regression-tested.
- [x] no unbounded particle emitter, timer, queue or persistent cache was added.
- [x] existing Visual V2 quality and reduced-effect preferences remain authoritative.
- [ ] exact final tree passes strict typecheck/unit suite.
- [ ] production JS+CSS raw/gzip budgets pass without threshold changes.
- [ ] browser performance certification passes.
- [ ] main release-candidate browser matrix passes after merge.

## Exit condition
Phase 16 is complete when the final implementation passes the existing verification and browser certification gates with no bundle-budget relaxation.
