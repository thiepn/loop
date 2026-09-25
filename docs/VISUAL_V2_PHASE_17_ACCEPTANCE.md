# Visual V2 Phase 17 — Adaptive Visual Intelligence Acceptance

## Scope
- [x] adaptation is presentation-only.
- [x] no WorldDocument field or migration is added.
- [x] no audio scheduling, music generation or timing behavior changes.
- [x] no user-facing AI/automation control is added.
- [x] existing visual quality and reduced-effect preferences remain authoritative.
- [x] adaptation is deterministic from existing composition/live visual inputs.

## Density-sensitive detail
- [x] visual density now includes Sound Orbs, Effect Fields, toys and Links.
- [x] sparse Worlds retain richer material detail.
- [x] dense Worlds reduce Orb/Field detail before compromising interaction or audio.
- [x] adaptive detail remains bounded and never exceeds normal High-quality detail.
- [x] existing quality profiles still set the primary detail ceiling.

## Music-derived atmospheric mood
- [x] live scheduler-derived energy influences atmosphere.
- [x] transient-heavy activity can warm the atmosphere subtly.
- [x] non-bass energy can lift the secondary/composition color.
- [x] Canvas2D and WebGL use the same existing energy/bass/transient signals.
- [x] no second musical clock or visual-to-audio feedback loop exists.

## Composition-derived color
- [x] role balance continues to derive the World primary palette.
- [x] spatial roles and Effect Fields continue to derive secondary atmosphere.
- [x] muted Orbs have deliberately reduced palette influence.
- [x] adaptive music mood modulates rather than replaces the World-derived palette.
- [x] tests verify different role balances create different deterministic palettes.

## Sparse / dense composition treatment
- [x] whole-World weighted density reduces decorative particle density.
- [x] whole-World weighted density reduces material detail.
- [x] sparse Worlds preserve negative-space ambience rather than being filled with extra UI.
- [x] dense Worlds simplify graphics instead of increasing bloom/noise.
- [x] adaptation is bounded at both sparse and dense extremes.

## Focus-aware detail restoration
- [x] a selected/focused Orb restores high local material detail even in a dense World.
- [x] a selected Field restores high local Field detail.
- [x] unselected neighbors remain density-simplified.
- [x] focus restoration changes rendering only and never hit geometry.
- [x] Canvas2D and WebGL apply the same restoration rule.

## Adaptive framing inputs
- [x] Presentation Camera density counts only active Orbs plus weighted Fields/toys/Links.
- [x] composition spread influences desired zoom.
- [x] an explicit selected-object focus can gently bias camera center.
- [x] focus never bypasses object-edge protection.
- [x] ultrawide / large-screen / recording caps remain authoritative.
- [x] Reduce Motion still makes presentation framing time-invariant.

## Bundle recovery
- [x] existing 500 KiB raw / 120 KiB gzip release limits remain unchanged.
- [x] GLSL shader literals were compacted without changing shader semantics.
- [x] no new shader program or external dependency was added.
- [x] Phase 17 is expected to recover the Phase 16 163-byte gzip overage rather than relax the budget.

## Regression coverage
- [x] density/detail scaling is covered.
- [x] composition-derived palette differentiation is covered.
- [x] focus-aware presentation framing is covered.
- [x] exact final tree passes strict typecheck/unit suite.
- [x] production JS+CSS raw/gzip budgets pass.
- [x] browser performance certification passes.
- [ ] Release Candidate browser matrix passes after merge.

## Exit condition

Phase 17 is complete when the exact final tree passes the existing verification and browser certification gates with no bundle-budget relaxation and no creative-state/audio behavior changes.

**Next: Phase 18 — Accessibility & Reduced-Effects Certification.**
