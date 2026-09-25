# Visual V2 Phase 15 — Final Visual QA, Resilience & Polish Acceptance

## Scope
- [x] Phase 15 is a capstone hardening phase, not a new creative subsystem.
- [x] no World schema change.
- [x] no audio scheduling change.
- [x] no persistence migration.
- [x] no new runtime dependency.
- [x] existing Visual V2 renderer/chrome/presentation architecture remains authoritative.

## Compact / responsive resilience
- [x] 320 px viewport is an explicit release-matrix stress case.
- [x] Home cannot create horizontal page overflow at 320 px.
- [x] Playground cannot create horizontal page overflow at 320 px.
- [x] World canvas remains inside the viewport at 320 px.
- [x] long desktop World headings are bounded and ellipsized rather than expanding top-bar geometry.
- [x] existing phone and landscape breakpoints remain authoritative.

## Touch ergonomics
- [x] coarse-pointer top-bar buttons have a minimum 44 px width.
- [x] coarse-pointer top-bar buttons retain the existing minimum 44 px height.
- [x] the release matrix measures actual rendered touch targets on Android Chromium, iOS WebKit and iPad WebKit.
- [x] presentation exit remains at least 48 × 48 CSS px.

## Forced colors / high contrast
- [x] Canvas/WebGL art yields to the semantic DOM visual layer in forced-colors mode.
- [x] semantic Orb/Field/toy/Link/listener visuals remain visible under forced colors.
- [x] top-bar, dock and presentation chrome use system colors in forced-colors mode.
- [x] decorative shadows/backdrop filters are removed from critical forced-colors chrome.
- [x] forced-colors presentation keeps the semantic stage visible even when the V2 renderer is healthy.

## Reduce Motion
- [x] browser Reduce Motion remains connected to Loop visual preferences.
- [x] presentation framing is time-invariant under Reduce Motion.
- [x] accessibility media stress is exercised in the release matrix.
- [x] no new animation bypasses the existing Reduce Motion policy.

## Renderer fallback
- [x] renderer-less compatibility is explicitly exercised even on Chromium.
- [x] presentation remains enterable with no Canvas2D/WebGL renderer.
- [x] compatibility presentation uses the semantic DOM camera stage.
- [x] the semantic stage becomes inert while presenting.
- [x] transport/dock chrome remains screen-fixed.
- [x] creative coordinates remain untouched.
- [x] renderer and semantic camera transforms stay synchronized so forced-colors switching cannot desynchronize framing.

## Visual release gate
- [x] compact viewport stress is automated.
- [x] touch target geometry is automated.
- [x] forced-colors semantic fallback is automated.
- [x] Reduce Motion static presentation is automated.
- [x] renderer-less presentation is automated.
- [x] existing five-browser RC matrix remains the final cross-browser authority.
- [x] existing browser performance/bundle budgets remain unchanged.

## Exit condition

Phase 15 is complete only when the exact final Phase 15 tree passes:

- strict TypeScript typecheck;
- complete unit/soak suite;
- production build;
- existing raw/gzip build budgets without threshold relaxation;
- Phase 16 browser-performance certification;
- the expanded Release Candidate Matrix across Chromium desktop, Firefox desktop, Android Chromium, iOS WebKit and iPad WebKit;
- live production HTTPS/PWA smoke after deployment.
