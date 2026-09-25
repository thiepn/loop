# Visual V2 Phase 13 — UI Chrome, Panels, Icons & Spatial Controls Acceptance

## Iconography
- [x] shared Loop icon primitive exists.
- [x] no third-party icon dependency exists.
- [x] icons inherit currentColor.
- [x] icons are decorative/aria-hidden.
- [x] Play and Stop are distinct.
- [x] Mute and Unmute are distinct.
- [x] Add has a native icon.
- [x] Shape has a native icon.
- [x] Motion has a native icon.
- [x] Link has a native icon.
- [x] Magic has a native icon.
- [x] Change has a native icon.
- [x] Duplicate has a native icon.
- [x] Delete has a native icon.
- [x] Effects and Toys have native icons.
- [x] Record uses native iconography.
- [x] editor close buttons use native iconography.

## Top bar / dock
- [x] top bar remains low-chrome.
- [x] transport icon tracks Play/Stop state.
- [x] dock controls share one visual family.
- [x] dock has one glass container.
- [x] narrow dock can horizontally scroll.
- [x] touch targets are preserved.

## Sound panel
- [x] selection panel receives Sound role.
- [x] all seven roles have contextual accent.
- [x] Shape action remains conditional by role.
- [x] Motion On state remains visible.
- [x] Mute/Unmute changes icon and label.
- [x] destructive Delete remains visually distinct.
- [x] existing callbacks/ARIA expansion state remain.

## Field / toy / Link panels
- [x] Field panel receives Field type.
- [x] all five Field accents exist.
- [x] toy panel receives toy type.
- [x] all four toy accents exist.
- [x] Link panel receives Link type.
- [x] Link accents remain subordinate to rendered Link material.
- [x] Magic/Delete callbacks are unchanged.

## Shared sheets
- [x] palette/editor backdrops share one primitive.
- [x] sheet shells share one primitive.
- [x] per-editor z-index is preserved.
- [x] per-editor width is preserved through variables.
- [x] per-editor accent remains possible.
- [x] close controls share one primitive.
- [x] existing modal focus controllers remain authoritative.
- [x] backdrop-click close semantics remain unchanged.

## Typography / hierarchy
- [x] editor eyebrow hierarchy is unified.
- [x] editor title hierarchy is unified.
- [x] editor help copy hierarchy is unified.
- [x] contextual object copy is unified.
- [x] primary/neutral/destructive actions remain distinguishable.

## Mobile / landscape
- [x] contextual actions become icon-first grid on phone.
- [x] Sound action labels may hide visually without removing accessible text.
- [x] contextual panel stays above dock/safe area.
- [x] dock can scroll without shrinking actions.
- [x] short landscape viewport uses side-biased contextual panel.
- [x] contextual panel height is bounded in landscape.

## Accessibility
- [x] focus-visible system is retained.
- [x] forced-colors fallback exists.
- [x] icons do not replace accessible labels.
- [x] no creative-object hit geometry is changed.
- [x] existing modal focus trapping is unchanged.
- [x] Reduce Motion does not depend on chrome animation.

## Cleanup / budget
- [x] repeated backdrop CSS is removed.
- [x] repeated sheet-shell CSS is removed.
- [x] repeated close-button CSS is removed.
- [x] repeated contextual-panel CSS is removed.
- [x] repeated editor-header typography is removed.
- [x] repeated panel typography is removed.
- [x] superseded editor mobile overrides are removed.
- [x] new icon system fits inside existing release-size gates.

## Tests
- [x] every Loop icon renders an SVG primitive.
- [x] icon accessibility metadata is covered.
- [x] icon output bounds are covered.
- [x] semantic state icon distinction is covered.
- [x] decorative icons contain no text/ARIA label.

## State protection
- [x] no World schema change.
- [x] no persistence migration.
- [x] no audio change.
- [x] no interaction semantic change.
- [x] no history/autosave change.

## Exit condition

Phase 13 is complete only when the exact final Phase 13 head passes:

- strict TypeScript typecheck;
- complete unit/soak suite;
- production build;
- existing raw/gzip build budgets;
- Phase 16 browser certification without relaxing any threshold.


## Verification record

The implemented Phase 13 head passed the existing repository verification gates without changing certification budgets:

- strict TypeScript typecheck: passed;
- unit/soak suite: **50 files, 310 tests passed**;
- production Vite build: passed;
- Phase 16 browser certification: passed;
- JS+CSS raw: **511,413 bytes** (< 512,000-byte budget);
- JS+CSS gzip: **122,294 bytes** (< 120 KiB / 122,880-byte budget);
- navigation load: **132.6 ms** (< 3,000 ms budget);
- Home → World: **267 ms** (< 1,500 ms budget);
- first contentful paint: **68 ms**;
- sampled animation-frame p95: **16.7 ms** (< 80 ms budget);
- average main-thread work per sampled frame: **3.03 ms** (< 8 ms budget);
- post-GC heap growth: **742,360 bytes** (< 5 MiB budget);
- DOM node growth: **123** (< 250 budget);
- longest observed long task: **67 ms** (< 200 ms budget);
- frozen → active lifecycle recovery: passed.

The chrome/icon overhaul therefore fits inside the original release envelope while replacing several generations of duplicated editor/panel CSS. The remaining raw-size margin is intentionally small, so Phase 14 should primarily reuse or conditionally hide this unified chrome rather than add another independent control layer.
