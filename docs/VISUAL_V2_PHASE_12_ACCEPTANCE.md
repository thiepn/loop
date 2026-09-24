# Visual V2 Phase 12 — Home, Library, Branding & Application Surfaces Acceptance

## Home
- [x] Home uses the Visual V2 spatial language.
- [x] ambient environment exists.
- [x] hero uses a real starter World composition.
- [x] Home remains internally scrollable for large libraries.
- [x] responsive safe-area handling remains.

## Starter Worlds
- [x] starter cards use real World layouts.
- [x] Orb roles/positions appear in starter dioramas.
- [x] Fields/toys appear where present.
- [x] starter identity is stable across generated document IDs.
- [x] Surprise receives a distinct visual treatment.
- [x] animations stop under Reduce Motion / prefers-reduced-motion.

## Library
- [x] generic three-dot thumbnail is removed.
- [x] Library metadata carries derived visual identity.
- [x] no persistence schema migration is required.
- [x] no extra loadWorld call is required for thumbnails.
- [x] saved cards use real Orb layout.
- [x] saved cards use Field/toy layout.
- [x] saved cards show BPM/sound/snapshot metadata.
- [x] management actions remain available.
- [x] Recently Deleted retains restore/purge actions.

## Fingerprints
- [x] stable seed exists.
- [x] three-angle glyph exists.
- [x] saved Worlds use real World id identity.
- [x] duplicated layouts can have unique glyphs.
- [x] starter previews use stable starter keys.
- [x] thumbnail Orb detail is capped at 9.
- [x] thumbnail Field detail is capped at 3.
- [x] thumbnail toy detail is capped at 2.
- [x] density is bounded.

## States
- [x] loading state exists.
- [x] empty-library state exists.
- [x] persistence-error state exists.
- [x] new World creation remains available during persistence error.
- [x] fatal startup surface uses current brand identity.

## Branding / PWA
- [x] Home brand mark uses orbital identity.
- [x] playground brand mark inherits same identity.
- [x] boot mark uses same concept.
- [x] favicon updated.
- [x] 192 icon updated.
- [x] 512 icon updated.
- [x] maskable icon updated.
- [x] manifest colors updated.
- [x] no font/image asset dependency was introduced.

## Surface continuity
- [x] Home → World cue exists.
- [x] World → Home cue exists.
- [x] cue does not delay synchronous state commit.
- [x] cue is pointer-transparent.
- [x] Reduce Motion suppresses it.
- [x] audio/persistence semantics are unchanged.

## Responsive
- [x] desktop three-column surfaces exist.
- [x] tablet two-column surfaces exist.
- [x] mobile one-column surfaces exist.
- [x] mobile card actions remain touch-sized.
- [x] installed-PWA safe-area behavior remains.

## Cleanup / budget
- [x] legacy Phase 4 Home layout CSS is removed.
- [x] legacy generic Library visuals are removed.
- [x] duplicate late Home polish is removed.
- [x] obsolete Home responsive rules are removed.
- [x] Snapshot shared persistence styles are preserved.
- [x] no independent canvas/GPU thumbnail renderer is introduced.

## Tests
- [x] starter deterministic identity is covered.
- [x] saved-World uniqueness is covered.
- [x] real Orb layout projection is covered.
- [x] Field/toy projection is covered.
- [x] thumbnail detail caps are covered.
- [x] density bounds are covered.
- [x] dominant role is covered.
- [x] glyph bounds are covered.

## State protection
- [x] no World schema change.
- [x] no persistence migration.
- [x] no audio change.
- [x] no World-edit semantic change.
- [x] no Library action semantic change.
- [x] no autosave semantic change.

## Exit condition

Phase 12 is complete only when the exact final Phase 12 head passes:

- strict TypeScript typecheck;
- complete unit/soak suite;
- production build;
- existing raw and gzip build budgets;
- Phase 16 browser certification without relaxing any threshold.


## Verification record

The implemented Phase 12 head passed the existing repository verification gates without changing certification budgets:

- strict TypeScript typecheck: passed;
- unit/soak suite: **49 files, 306 tests passed**;
- production Vite build: passed;
- Phase 16 browser certification: passed;
- JS+CSS raw: **511,383 bytes** (< 512,000-byte budget);
- JS+CSS gzip: **121,081 bytes** (< 120 KiB / 122,880-byte budget);
- navigation load: **1,632.9 ms** (< 3,000 ms budget);
- Home → World: **914 ms** (< 1,500 ms budget);
- sampled animation-frame p95: **16.7 ms** (< 80 ms budget);
- average main-thread work per sampled frame: **3.60 ms** (< 8 ms budget);
- post-GC heap growth: **496,452 bytes** (< 5 MiB budget);
- DOM node growth: **125** (< 250 budget);
- longest observed long task: **0 ms**;
- frozen → active lifecycle recovery: passed.

Phase 12 therefore restores Home/Library/branding quality while remaining inside the original release envelope. The cleanup pass also retires hidden legacy Orb animation CSS so the new application surfaces fit under the unchanged raw-size budget.
