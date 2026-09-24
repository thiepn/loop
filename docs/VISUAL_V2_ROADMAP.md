# Loop — Visual V2 Roadmap

## Status

Visual V2 is a **post-V1 visual revamp track**.

The existing V1 roadmap remains authoritative for shipping `v1.0.0`. This roadmap does not silently reopen the V1 release candidate.

## Goal

Transform Loop from a polished DOM/CSS audiovisual playground into a coherent living visual universe while preserving:

- the existing musical model;
- beginner-first interaction;
- local-first persistence;
- accessibility;
- PWA behavior;
- deterministic audio timing;
- bounded product scope.

## Phase 1 — Visual V2 Specification & Art Direction Lock — complete

Lock:
- visual thesis;
- hierarchy;
- depth;
- color/light;
- Orb materials;
- Field materials;
- trail language;
- cross-system interactions;
- motion grammar;
- accessibility rules;
- quality profiles;
- performance budgets;
- anti-goals.

See:
- [VISUAL_V2.md](VISUAL_V2.md)
- [VISUAL_V2_PHASE_1_ACCEPTANCE.md](VISUAL_V2_PHASE_1_ACCEPTANCE.md)

## Phase 2 — Rendering Architecture V2 — complete

Build the visual runtime foundation:

- renderer technology selection;
- scene graph;
- render layers;
- renderer lifecycle;
- World-to-render adapter;
- visual event bridge;
- animation clock;
- viewport/DPR management;
- context loss/recovery;
- DOM/canvas interaction boundary;
- quality capability detection;
- instrumentation;
- deterministic fallbacks.

Use placeholder visuals before art polish.

## Phase 3 — World Environment, Atmosphere & Depth — complete

Implement:
- deep backdrop;
- far/near particles;
- atmospheric haze;
- 2.5D depth;
- parallax;
- palette derivation;
- environmental energy;
- silence state;
- pointer/touch disturbance;
- density-aware ambience.

## Phase 4 — Sound Orb Material Engine — complete

Implement:
- procedural Orb bodies;
- role-specific internal materials;
- deformation;
- role-specific event response;
- musical fingerprints;
- selection/mute/focus treatment;
- label-free identity.

## Phase 5 — Physical Interaction & Object Game Feel — complete

Implement:
- hover magnetism;
- grab/lift;
- drag stretch;
- velocity response;
- drop/settle;
- Field resize tension;
- selection spotlighting;
- long-press visual feedback.

## Phase 6 — Motion Trails & Kinetic Graphics — complete

Implement:
- spline/ribbon trails;
- role-specific trail materials;
- speed/acceleration response;
- Field-modified trails;
- bounded trail memory;
- toy-modified trajectories;
- reduced-motion fallback.

## Phase 7 — Effect Fields V2 — complete

Implement:
- Space;
- Echo;
- Heat;
- Frost;
- Filter;
- procedural boundaries;
- object influence;
- environment influence;
- two-Field intersection materials;
- overlap simplification.

## Phase 8 — Cross-System Visual Interaction — complete

Unify:
- Orb ↔ Orb;
- Orb ↔ Field;
- Orb ↔ toy;
- trail ↔ Field;
- trail ↔ toy;
- Link ↔ Field;
- light ↔ nearby objects;
- atmosphere ↔ interaction.

## Phase 9 — Links, Listener & Light Propagation — complete

Implement:
- Link light paths;
- Link creation/activation/deletion VFX;
- listener redesign;
- event light packets;
- local illumination;
- interaction-safe light spill.

## Phase 10 — Musical Choreography — implemented; certification pending

Coordinate:
- Play;
- Stop;
- downbeats;
- simultaneous events;
- phrase boundaries;
- silence;
- recording state;
- density/energy changes.

No second musical clock.

## Phase 11 — Magic, Portal, Snapshot & State Transitions

Implement:
- Magic transformation;
- Remix transformation;
- Portal transfer;
- Snapshot morph;
- delete material exits;
- undo reconstruction;
- bounded cinematic state changes.

## Phase 12 — Home, Library, Branding & Application Surfaces

Revamp:
- Home environment;
- starter dioramas;
- deterministic World thumbnails;
- World glyphs;
- brand mark;
- PWA artwork;
- loading visuals;
- World open/close continuity.

## Phase 13 — UI Chrome, Panels, Icons & Spatial Controls

Refine:
- lightweight chrome;
- contextual controls;
- custom Loop iconography;
- role-aware panel details;
- typography;
- interaction hierarchy;
- responsive visual polish.

## Phase 14 — Performance / Presentation Mode

Implement:
- low-chrome performance surface;
- automatic framing;
- quality-aware camera drift;
- fullscreen presentation;
- observer-safe controls;
- large-screen composition behavior.

## Phase 15 — Recording & Generated Artwork

Implement:
- recording ambience;
- capture-state visuals;
- World-derived artwork;
- recording preview identity;
- export/share artwork where supported.

## Phase 16 — Delight & Rare Events

Add bounded:
- constellations;
- rare particle moments;
- synchronized visual alignments;
- subtle Easter eggs;
- silence-settle events.

No new music or progression systems.

## Phase 17 — Adaptive Visual Intelligence

Implement:
- density-sensitive detail;
- music-derived atmospheric mood;
- composition-derived color;
- sparse/dense composition treatment;
- focus-aware detail restoration;
- adaptive framing inputs.

## Phase 18 — Accessibility & Reduced-Effects Certification

Complete and verify:
- Reduce Motion;
- Reduce Particles;
- Reduce Glow;
- grayscale/non-color redundancy;
- forced-colors UI;
- keyboard/focus resilience;
- high-contrast states;
- reduced-effect special transitions.

## Phase 19 — Visual Performance Engineering

Optimize:
- frame time;
- GPU time;
- draw calls;
- texture memory;
- JS allocations;
- particle limits;
- trail geometry;
- DPR;
- shader cost;
- context recovery;
- adaptive quality degradation.

Graphics yield before audio.

## Phase 20 — Art-Direction QA

Audit:
- Home;
- empty World;
- sparse World;
- dense World;
- all Orb roles;
- all Fields;
- Links;
- toys;
- Magic;
- Snapshots;
- recording;
- mobile;
- tablet;
- desktop;
- ultrawide.

Create repeatable screenshot fixtures.

## Phase 21 — Adversarial Graphics & Interaction Stress

Stress:
- maximum Orbs;
- motion;
- overlapping Fields;
- Links;
- recording;
- rapid Magic;
- Snapshot recall;
- resize/rotate;
- background/resume;
- context loss;
- deletion during animation;
- pointer cancellation.

## Phase 22 — Cross-Device Visual Certification

Certify:
- Chromium;
- Firefox;
- WebKit/Safari where available;
- Android touch;
- iPhone;
- iPad;
- lower-capability profiles;
- high DPR;
- high refresh;
- PWA resume/install;
- battery/reduced-effects modes.

## Phase 23 — Final Visual Polish & Freeze

Only:
- tune;
- simplify;
- fix;
- normalize;
- remove redundant effects.

No new visual subsystems.

## Phase 24 — Visual V2 Production Release

Run:
- complete checks;
- production build;
- live smoke tests;
- visual regression tests;
- performance certification;
- PWA verification;
- final docs/screenshots;
- release tagging.

## Dependency rule

Implementation order is intentionally constrained:

```
specification
→ renderer
→ environment
→ Orbs
→ interaction feel
→ motion
→ Fields
→ cross-system VFX
→ Links/listener/light
→ choreography
→ transitions
→ application surfaces
→ UI
→ presentation
→ export visuals
→ delight
→ adaptive visuals
→ accessibility
→ performance
→ QA/stress/device certification
→ freeze/release
```

Do not skip ahead and build expensive final effects before the renderer, state boundary and fallback model are stable.
