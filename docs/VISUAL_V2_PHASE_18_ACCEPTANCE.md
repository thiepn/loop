# Visual V2 Phase 18 — Accessibility & Reduced-Effects Certification

## Scope
- [x] no WorldDocument/schema migration.
- [x] no audio scheduling or musical behavior change.
- [x] no progression or new visual feature system.
- [x] accessibility remains presentation/runtime state only.
- [x] Canvas2D, WebGL and semantic DOM fallback remain supported.

## Reduce Motion
- [x] OS `prefers-reduced-motion` is a live effective safety floor.
- [x] the system preference no longer overwrites stored user intent.
- [x] changing the OS setting updates an open Loop session.
- [x] removing the OS setting restores the user's own preference.
- [x] the Visual Settings control explains when motion reduction is system-enforced.
- [x] trails, camera drift, travel beams, light packets and travel-heavy delight remain suppressed.
- [x] state feedback remains visible instead of being removed entirely.
- [x] presentation framing remains time-invariant under reduced motion.

## Reduce Particles
- [x] ambient renderer particles are removed when requested.
- [x] listener motes and particle-based delight are removed.
- [x] reduced motion does not silently force the user's explicit Reduce Particles preference.
- [x] the semantic fallback remains understandable with decorative particles absent.

## Reduce Glow
- [x] renderer bloom/light policy remains capped.
- [x] Canvas local-light propagation now respects Reduce Glow.
- [x] WebGL local-light propagation now respects Reduce Glow.
- [x] semantic DOM fallback removes decorative filters/shadows while preserving borders/state.
- [x] selected/focused state remains visible without glow.

## Grayscale / non-color redundancy
- [x] selected Orbs retain a structural ring and `aria-pressed`.
- [x] selected Fields retain boundary emphasis and resize affordance.
- [x] selected toys/portal exits retain boundary emphasis.
- [x] selected Links retain increased stroke/node emphasis.
- [x] muted Orbs retain opacity reduction plus line-through labeling.
- [x] role labels/material/shape cues remain available independently of hue.
- [x] canonical grayscale regression coverage verifies selected-state structure.

## Keyboard / focus
- [x] Sound Orbs now have an explicit `:focus-visible` outline.
- [x] Fields, toys, portal exits, links, buttons and anchors retain keyboard focus treatment.
- [x] keyboard Orb movement remains available.
- [x] modal focus controllers remain authoritative for dialogs.
- [x] high-contrast focus treatment is thicker and non-color dependent.

## Forced colors / high contrast
- [x] forced colors hide Canvas/WebGL and expose semantic DOM visuals.
- [x] critical chrome uses system Canvas/ButtonText colors.
- [x] selected world objects use structural outlines.
- [x] selected Links use Highlight stroke/fill in forced-colors mode.
- [x] `prefers-contrast: more` increases focus and selection emphasis.
- [x] presentation forced-colors mode remains semantic and static when combined with Reduce Motion.

## Reduced-effect transitions
- [x] Reduce Motion removes transition travel beams while retaining state light.
- [x] transition/state feedback remains bounded under Battery Saver.
- [x] global/local glow is reduced without removing transition semantics.
- [x] rare delight already respects Reduce Motion / Reduce Particles / Reduce Glow.

## Permanent regression gates
- [x] live OS reduced-motion changes + stored intent.
- [x] high-contrast keyboard focus.
- [x] grayscale selected-state redundancy.
- [x] reduced-particles / reduced-glow semantic fallback.
- [x] existing forced-colors + Reduce Motion presentation stress.
- [x] existing renderer-less compatibility presentation.
- [x] exact final tree passes strict typecheck/unit/soak suite.
- [x] production JS+CSS raw/gzip budgets pass unchanged: 504,921 raw bytes / 122,641 gzip bytes.
- [x] browser performance certification passes.
- [ ] full Release Candidate Matrix passes after merge.

## Exit condition

Phase 18 is complete when the exact final tree passes the unchanged verification, bundle/performance budgets and cross-browser Release Candidate Matrix.

**Next: Phase 19 — Visual Performance Engineering.**
