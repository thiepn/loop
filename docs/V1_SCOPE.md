# Loop — V1 Scope

## Purpose
This document is the hard scope boundary for the first public release.

After the feature-complete milestone, V1 enters feature freeze. Release phases may fix defects, regressions, performance, usability, accessibility, and data integrity only.

## Included

### 1. Starter Worlds
- Beat
- Chill
- Dreamy
- Dance
- Weird
- Surprise Me
- Empty

### 2. Sound Orbs
- draggable visual sound objects;
- Beat, Bass, Melody, Texture, Voice/FX categories;
- selection;
- mute/unmute;
- duplicate;
- replace/change sound;
- delete;
- role-specific visual response.

### 3. Musical engine
- shared tempo;
- synchronized loops;
- quantized launches;
- scale/key compatibility for supported built-in tonal content;
- automatic safe gain/headroom;
- smooth transitions.

### 4. Sound palette
- curated built-in packs;
- everyday descriptive labels;
- Surprise Me;
- optional custom sample import if stable.

### 5. Rhythm editing
- simple 8/16-step interaction;
- paint/erase/toggle;
- clear;
- controlled variation;
- simple density/groove controls.

### 6. Melody editing
- scale-locked visual note grid;
- paint/erase;
- compatible notes;
- controlled variation.

### 7. Effect Fields
- Space;
- Echo;
- Heat;
- Frost;
- Filter;
- spatially continuous effect amount;
- clear visual/audio feedback.

### 8. Motion
- Still;
- Orbit;
- Bounce;
- Drift;
- Follow;
- Wander;
- simple Speed/Range controls;
- integration with Effect Fields.

### 9. Playground toys
Initial small set:
- Spinner;
- Magnet;
- Repulsor;
- Portal.

Only include toys that prove fun and understandable during testing.

### 10. Links
Initial relationships:
- Pulse Together;
- Take Turns;
- Follow;
- Kick Pushes Bass;
- Copy Movement;
- Surprise Me.

### 11. Magic
- per-object Magic;
- global Remix;
- optional intent choices: More energy, Calmer, Stranger, Simpler, Busier;
- seeded and undoable behavior.

### 12. Worlds
- local World library;
- create;
- rename;
- duplicate;
- save/autosave;
- delete with recovery/confirmation strategy as appropriate;
- restore after refresh/browser restart.

### 13. Snapshots
- save current World state;
- recall on a safe musical boundary;
- small bounded Snapshot count.

### 14. Undo/redo
Cover material creative actions.

### 15. Recording/export
- simple master recording;
- straightforward audio export.

### 16. PWA
- GitHub Pages deployment;
- installable manifest;
- offline application shell;
- cached built-in assets where feasible;
- correct /loop/ base path;
- update-safe service worker behavior.

### 17. Platforms
Primary:
- modern Chromium desktop;
- Firefox desktop;
- Android Chromium;
- mobile/tablet touch layouts;
- iOS Safari/PWA where supported by platform capabilities.

## Recommended V1 caps
Exact numbers may be tuned after performance testing.

Initial targets:
- approximately 12 active Sound Orbs;
- small bounded number of Effect Fields;
- small bounded number of Links;
- limited simultaneous expensive Frost/granular processes;
- bounded Snapshots per World.

The implementation should degrade deliberately rather than collapse unpredictably.

## Definition of feature complete
V1 becomes feature complete when a user can:
1. open Loop;
2. start or choose a World;
3. hear a coherent result immediately;
4. add and manipulate Sound Orbs;
5. edit basic rhythm/melody;
6. use Effect Fields;
7. add Motion;
8. create a Link;
9. use Magic;
10. save/reload the World;
11. create/recall Snapshots;
12. record/export;
13. use the app on desktop and touch devices.

After this point: feature freeze.

## Release phases after feature freeze
Only:
- functional/data integrity audit;
- UX/accessibility/regression audit;
- performance/soak testing;
- release-candidate fixes;
- GitHub Pages deployment fixes.

No new creative systems may be introduced during release hardening.
