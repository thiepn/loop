# Loop — Visual V2 Home, Library, Branding & Application Surfaces

## Status

Phase 12 implementation is present on the Visual V2 track.

## Goal

Phase 12 carries Loop's in-World visual language outward into the application shell.

Home and Library now present Worlds as living spatial compositions instead of generic cards, while branding, startup, PWA artwork and screen transitions use the same orbit/core visual identity.

## Home environment

The Home surface now includes:

- deep spatial background rather than a flat dashboard;
- sparse ambient points;
- broad orbital geometry;
- a large hero World;
- restrained motion that respects reduced-motion settings.

The page remains internally scrollable so large libraries work despite the application body remaining non-scrolling.

## Hero

The Home headline and hero diorama introduce the product through its actual interaction metaphor:

- living Sound Orbs;
- spatial listener;
- Effect Field volumes;
- layered depth.

The hero uses the real Dreamy starter layout rather than decorative random dots.

## Starter World dioramas

Every starter card derives a visual identity from its real `WorldDocument`.

A starter thumbnail contains bounded representations of:

- Orb positions and roles;
- Effect Fields;
- toys;
- listener;
- composition density.

Starter preview identity uses a stable `starter:<id>` key so it does not change when the temporary starter document receives a new generated World id.

## Saved World fingerprints

`WorldRepository.listLibrary()` already migrates each stored World.

Phase 12 derives a compact `WorldVisualIdentity` during that same pass.

No additional storage read is required.

The identity contains:

- stable visual seed;
- three glyph rotations;
- BPM;
- Orb count;
- Link count;
- normalized density;
- dominant role;
- up to nine preview Orbs;
- up to three preview Fields;
- up to two preview toys.

The visual identity is Library metadata only. It is not persisted as a new schema field.

## Library thumbnails

Saved World cards now render deterministic mini-World dioramas using their real spatial metadata.

Cards show:

- actual Orb arrangement;
- role colors;
- Field placement;
- toy placement;
- central listener;
- BPM;
- sound count;
- snapshot count;
- edit date;
- deterministic glyph.

The old generic three-dot World art is removed.

## World glyphs

Every saved World receives a small deterministic orbit glyph.

The glyph is derived from the World visual seed and uses three independently rotated orbital strokes around a central core.

Saved World identity uses the actual World id, so otherwise-identical duplicated Worlds still receive distinct glyph identity.

## Loading, empty and error states

Home now exposes first-class states instead of only hiding an empty Library:

### Loading
Shows a small orbital loading object while local persistence initializes.

### Empty
Explains that the first World starts from the starter collection.

### Persistence error
Keeps starter creation available while clearly stating that local Worlds are unavailable.

## Branding

The Loop mark now uses the same design language everywhere:

- bright listener-like core;
- violet orbital path;
- cyan secondary orbit;
- cyan satellite.

The same mark is used by:

- Home;
- playground top bar;
- boot splash;
- fatal-error surface;
- favicon;
- PWA standard icon;
- PWA maskable icon.

## Startup

`index.html` now includes a lightweight pre-App boot surface.

It appears before application construction and is naturally replaced when the App mounts.

It uses no JavaScript timer.

## PWA artwork

The standard and maskable SVG icons were redrawn around the new orbital mark.

Manifest splash/background colors now match the Visual V2 dark spatial palette.

The browser/OS remains responsible for generated install splash behavior.

## Home ↔ World continuity

Screen state still commits synchronously.

The App adds a short pointer-transparent radial handoff cue around:

- Home → World;
- World → Home.

The cue never delays:

- state commit;
- audio initialization;
- persistence;
- playback.

Reduce Motion skips the cue entirely.

## Responsive behavior

The Home surface supports:

- desktop;
- tablet;
- narrow mobile;
- installed PWA safe areas.

Desktop uses three-column starter/library grids.

Tablet uses two columns.

Phone uses one column with larger touch actions.

## CSS consolidation

Phase 12 removes:

- original Phase 4 Home layout CSS;
- obsolete starter-card art;
- Phase 10 generic Library card visuals;
- later duplicate Home polish overrides;
- superseded Home responsive rules.

One Phase 12 Home/Library system now owns these surfaces.

Snapshot persistence controls that shared selectors with the old Library block were preserved separately.

## Bundle policy

Because Phase 11 left limited release-size headroom, Phase 12 treats visual cleanup as part of the feature.

The implementation:

- reuses CSS/DOM primitives;
- avoids a second thumbnail renderer;
- stores no image cache;
- derives thumbnail metadata during existing Library listing;
- removes obsolete CSS generations.

The `WorldVisualIdentity` held in App state is effectively the thumbnail cache for the current Library listing.

## Phase 13 handoff

Phase 13 — UI Chrome, Panels, Icons & Spatial Controls can now refine in-World application chrome against a coherent brand and Home/Library foundation instead of carrying the old Home visual language forward.
