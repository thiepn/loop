# Visual V2 Phase 14 — Performance / Presentation Mode Acceptance

## Presentation surface
- [x] dedicated presentation mode reuses the existing playground shell and Visual V2 renderer.
- [x] presentation entry is available from existing top-bar chrome.
- [x] native fullscreen is requested where supported.
- [x] viewport presentation remains available when fullscreen is unavailable or rejected.
- [x] exit control remains visible and touch-safe.
- [x] Escape exits the viewport fallback; native fullscreen exit is reconciled through fullscreenchange.
- [x] presentation does not create or persist a parallel World state.

## Camera / framing
- [x] camera state is ephemeral and never mutates creative coordinates.
- [x] listener remains part of every framing calculation.
- [x] Sound Orbs contribute position, visual padding and configured motion range.
- [x] Effect Fields contribute full radius to the safe frame.
- [x] Toys and portal exits contribute to the safe frame.
- [x] sparse compositions receive composition-aware centering.
- [x] object-edge protection bounds zoom before content can be cropped.
- [x] the camera never zooms out below 1x and therefore never exposes empty canvas outside the World.
- [x] dense Worlds receive a calmer zoom.
- [x] ultrawide/projector-style surfaces cap zoom more aggressively.
- [x] large presentation surfaces and recording use calmer framing.

## Motion / quality
- [x] camera drift is slow, bounded and deterministic.
- [x] High, Balanced and Battery Saver use progressively lower camera update/detail budgets.
- [x] recording reduces drift amplitude.
- [x] idle presentation reduces drift amplitude.
- [x] Reduce Motion makes framing static and time-invariant.
- [x] an empty World does not drift away from the listener.

## Chrome / interaction
- [x] creative hit surfaces and editing panels are hidden while presenting.
- [x] presentation keeps only the existing transport/recording chrome that is relevant to performance.
- [x] pointer, touch and keyboard activity temporarily reveal chrome.
- [x] chrome returns to the low-chrome state after inactivity.
- [x] recording state remains visible.
- [x] coarse-pointer exit target is at least 48 × 48 CSS px.
- [x] entry is blocked while conflicting sheets/editors are open.

## Lifecycle resilience
- [x] ResizeObserver re-frames the World when the presentation surface changes.
- [x] hidden/pagehide lifecycle stops the camera animation loop.
- [x] visibility/pageshow resumes presentation safely.
- [x] native fullscreen exit clears presentation state.
- [x] PWA/iOS-style fullscreen rejection falls back to viewport presentation.
- [x] renderer transform is fully removed on exit/destroy.

## Renderer ownership / bundle recovery
- [x] Canvas/WebGL Visual V2 remains the normal renderer owner.
- [x] duplicate DOM ambient/burst effect generation has been retired.
- [x] duplicate DOM transient pulse ownership has been retired.
- [x] legacy orb pulse fallback remains available when Visual V2 is unavailable.
- [x] ornate DOM material CSS already hidden by Visual V2 has been removed.
- [x] basic DOM fallback geometry/hit surfaces remain available.
- [x] no release budget was relaxed.

## Automated coverage
- [x] presentation camera empty-World centering is covered.
- [x] sparse composition framing is covered.
- [x] edge-spanning object protection is covered.
- [x] ultrawide zoom policy is covered.
- [x] Reduce Motion static framing is covered.
- [x] release-candidate test verifies presentation activation and exit.
- [x] release-candidate test verifies creative coordinates are unchanged.
- [x] touch RC projects verify the exit target.
- [x] browser performance certification samples presentation frame gaps.
- [x] browser performance certification verifies camera transform activation and clean exit.

## State protection
- [x] no World schema change.
- [x] no persistence migration.
- [x] no history/autosave semantic change.
- [x] no audio scheduling change.
- [x] no creative-coordinate mutation.
- [x] no new external dependency.

## Verification record

The Phase 14 implementation head passed the repository's Verify gate without relaxing a threshold:

- strict TypeScript typecheck: passed;
- complete unit/soak suite: **51 files, 315 tests passed**;
- production Vite build: passed;
- Phase 16 browser-performance certification: passed;
- JS+CSS raw: **506,311 bytes** (< 512,000-byte budget);
- JS+CSS gzip: **121,609 bytes** (< 122,880-byte budget);
- Phase 13 baseline: 511,635 raw / 122,319 gzip, so Phase 14 ends **5,324 raw bytes and 710 gzip bytes smaller** despite adding presentation mode;
- page load: **718 ms** (< 3,000 ms);
- Home → World: **738.8 ms** (< 1,500 ms);
- normal animation-frame p95 / max: **16.7 / 16.8 ms** (< 80 / 200 ms);
- presentation animation-frame p95 / max: **16.7 / 16.8 ms** (< 80 / 200 ms);
- average main-thread work per sampled frame: **4.05 ms** (< 8 ms);
- post-GC heap growth: **911,680 bytes** (< 5 MiB);
- DOM node growth: **117** (< 250);
- longest observed long task: **91 ms** (< 200 ms);
- frozen → active lifecycle recovery: passed;
- presentation activation, renderer transform and clean exit: passed.

The full multi-browser Release Candidate Matrix runs on the merged main tree. That promotion gate is intentionally kept separate from the PR Verify gate.
