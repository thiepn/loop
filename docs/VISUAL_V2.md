# Loop — Visual V2 Specification & Art Direction Lock

## Status

**Visual V2 Phase 1 — specification complete.**

This document defines the post-V1 visual direction for Loop. It is a visual-system contract, not a runtime implementation.

The current `v1.0.0-rc.1` release candidate remains feature-frozen. Visual V2 implementation begins only after the V1 production release or an explicit decision to supersede that release process.

## Purpose

Loop should evolve from a polished browser playground with layered DOM/CSS effects into a coherent **living audiovisual universe** in which sound appears to illuminate, deform, disturb, connect, and transform the World.

Visual V2 is not a cosmetic reskin. Its purpose is to make the existing product model materially more understandable, tactile, expressive, and memorable without turning Loop into:

- a DAW;
- a graphics editor;
- a particle sandbox;
- a 3D world builder;
- a technical audio visualizer;
- a game with unrelated progression systems.

The visual system must continue serving the same product promise: immediate, visual, physical, forgiving musical play.

---

# 1. Visual thesis

The Visual V2 art-direction sentence is:

> **Music behaves like living light inside a tactile spatial universe.**

Every major visual decision should reinforce at least one of these ideas:

1. **Sound has a body.**
2. **Sound occupies space.**
3. **Sound can influence nearby things.**
4. **Musical relationships can be seen.**
5. **Interaction should feel physical rather than form-like.**
6. **The World itself should react to music.**

Visual V2 should feel closer to interactive generative art than a conventional web application, while retaining clear controls and predictable behavior.

---

# 2. Visual decision test

A new visual effect belongs only when it materially improves at least one of:

- musical understanding;
- spatial understanding;
- manipulation feedback;
- role recognition;
- hierarchy;
- state communication;
- delight directly connected to an existing Loop action.

Effects should be removed or rejected when they primarily add:

- visual noise;
- fake complexity;
- decorative motion with no relation to state;
- generic neon/glass aesthetics;
- technical-looking telemetry;
- ambiguity about what can be interacted with.

A useful test is:

> If the effect disappeared, would the user understand the musical object, interaction, or state less clearly?

Pure delight effects are allowed, but they must be bounded, rare, and never compete with primary feedback.

---

# 3. Core composition hierarchy

The World is the primary surface. UI chrome is secondary.

Visual hierarchy:

1. **World atmosphere**
2. **Sound Orbs and listener**
3. **active interactions and musical events**
4. **Effect Fields, Links, Motion and toys**
5. **selection/context feedback**
6. **navigation and application chrome**

The user should be able to hide most interface chrome and still see a complete, intentional composition.

## Scene layers

The renderer should preserve a consistent conceptual stack:

1. deep backdrop;
2. distant atmosphere;
3. far particles / dust;
4. environmental light;
5. Effect Fields;
6. Links;
7. motion traces;
8. Sound Orbs;
9. listener;
10. transient VFX;
11. interaction affordances;
12. DOM UI / accessibility overlays.

Layer order may be optimized internally, but the perceived hierarchy must remain stable.

---

# 4. Depth model

Loop remains a fundamentally two-dimensional interaction surface with a **2.5D visual presentation**.

Depth may be expressed through:

- parallax;
- particle scale;
- haze;
- luminance falloff;
- blur;
- occlusion;
- local shadowing;
- halo depth;
- trail sharpness;
- slight perspective cues.

Depth must not:

- change hit-test geometry;
- make object positions ambiguous;
- create hidden navigable Z coordinates;
- require camera orbit;
- imply a 3D editing model.

## Depth bands

Use three perceptual bands:

### Far
- backdrop;
- low-frequency haze;
- tiny slow particles;
- very low contrast.

### World plane
- Fields;
- Links;
- Orbs;
- listener;
- interaction VFX.

### Near
- large sparse foreground motes;
- selected-object emphasis;
- brief transient fragments.

The World plane must always remain the clearest layer.

---

# 5. Color system

Role color remains important, but Visual V2 must stop relying on color alone.

Baseline role families remain:

- Beat — rose/red;
- Percussion — amber/gold;
- Bass — cyan;
- Harmony — violet;
- Melody — green;
- Texture — blue;
- Voice — pink/magenta.

## Rules

- Role color identifies source identity.
- Shape, material, motion, and internal detail must provide redundant identity.
- Background color should derive from the current composition rather than using fixed decorative gradients.
- Simultaneously active roles may contribute to a shared atmospheric palette.
- High-energy moments may temporarily increase saturation, never permanently bleach the World.
- Mute reduces energy and saturation while preserving object readability.
- Selected state must not be communicated by hue alone.

## Atmospheric color blending

The environment may derive a slow-moving palette from:

- active roles;
- current Field influences;
- playback state;
- broad musical energy.

This derived palette is presentation-only and is never saved into WorldDocument.

---

# 6. Light model

Light is the main unifying metaphor.

Sound Orbs, listener, Fields, Links and transient events may act as local light sources.

Visual V2 should support the illusion of:

- local illumination;
- colored light spill;
- overlapping light pools;
- atmospheric scattering;
- event-driven flashes;
- emissive materials;
- restrained bloom;
- depth-sensitive luminance.

## Light rules

- Light communicates activity, not loudness with scientific precision.
- Strong events may brighten nearby objects.
- Multiple simultaneous sounds may briefly increase World illumination.
- Active Links may carry light between connected Orbs.
- Fields may tint or refract light.
- Recording may add a restrained rose edge treatment.
- Bloom must never destroy object boundaries or text contrast.

## Forbidden light behavior

Do not use:

- permanent full-screen glow;
- heavy chromatic aberration everywhere;
- overexposed halos on every object;
- rapidly flashing full-screen light;
- bloom as a substitute for material design.

---

# 7. Sound Orb material system

Every Sound Orb consists conceptually of:

1. aura;
2. body silhouette;
3. internal material;
4. musical fingerprint;
5. activity response;
6. Field influence;
7. interaction deformation;
8. selection/focus treatment;
9. trail emitter.

The body must remain recognizable at small mobile sizes.

## Beat

Character:
- grounded;
- dense;
- percussive;
- forceful.

Material:
- compact kinetic nucleus;
- angular impact geometry;
- short-lived compression lines.

Motion:
- fast anticipation;
- sharp radial expansion;
- short settle.

Audio response:
- crisp brightness attack;
- compact pressure wave;
- minimal lingering motion.

## Percussion

Character:
- light;
- granular;
- sharp;
- agile.

Material:
- metallic grains;
- segmented fragments;
- fine spark structure.

Motion:
- quick flicker;
- small fragment displacement;
- extremely fast recovery.

## Bass

Character:
- heavy;
- viscous;
- pressurized;
- stable.

Material:
- fluid membrane;
- broad internal pressure bands;
- soft refraction.

Motion:
- slow deformation;
- broad expansion;
- heavy settle.

Bass should visually feel massive without being physically larger enough to interfere with interactions.

## Harmony

Character:
- layered;
- spacious;
- balanced;
- resonant.

Material:
- translucent shells;
- overlapping membranes;
- chord-petal geometry;
- slow orbital detail.

Motion:
- broad bloom;
- gentle phase rotation;
- long decay.

## Melody

Character:
- nimble;
- clear;
- expressive;
- directional.

Material:
- luminous filaments;
- small satellites;
- abstract pitch-contour traces.

Motion:
- quick directional pulse;
- satellite response;
- fine trail.

## Texture

Character:
- atmospheric;
- soft;
- diffuse;
- continuous.

Material:
- gaseous noise;
- soft cloud-like internal flow;
- low-contrast grain.

Motion:
- slow breathing;
- drifting deformation;
- broad soft decay.

## Voice

Character:
- organic;
- expressive;
- asymmetric;
- elastic.

Material:
- ribbon membranes;
- contour bands;
- fluid asymmetric interior.

Motion:
- elastic envelope;
- gentle asymmetric deformation;
- expressive brightness pulse.

---

# 8. Musical fingerprints

Different content of the same role should produce visually related but non-identical Orbs.

Allowed fingerprint inputs include:

- pattern density;
- step distribution;
- melodic contour;
- chord complexity;
- motion behavior;
- current mute state;
- current Field influence.

Examples:

- Beat may show radial rhythm marks.
- Melody may show an abstract contour path.
- Harmony may alter shell/petal distribution.
- Bass may vary pressure-band spacing.
- Texture may alter internal cloud density.

Fingerprints must stay abstract. Do not turn Orbs into mini piano rolls, meters, waveforms, or spectrograms.

---

# 9. World environment

The World must react to music as a coherent environment rather than a static backdrop.

## Environmental inputs

May include:

- playback state;
- broad energy;
- bass activity;
- transient density;
- simultaneous events;
- silence duration;
- role balance;
- recording state.

## Environmental outputs

May include:

- haze density;
- background luminance;
- local light;
- particle energy;
- very subtle spatial compression;
- palette drift;
- brief pressure waves;
- ambient motion speed.

## Silence

Silence is an explicit visual state.

As activity decreases:

- particles lose kinetic energy;
- trails dissolve;
- haze settles;
- listener becomes calmer;
- background luminance decreases slightly;
- residual effects decay naturally.

Visual V2 must avoid constant maximum activity.

---

# 10. Effect Field art direction

Fields are spatial materials, not translucent circles.

## Space

Material:
- deep nebular volume;
- tiny star flecks;
- subtle lens-like refraction.

Object influence:
- passing Orbs appear optically deeper;
- trails stretch;
- local light diffuses.

## Echo

Material:
- temporal rings;
- translucent afterimages;
- repeated fading geometry.

Object influence:
- delayed visual ghosts;
- repeated trail copies;
- decaying temporal pulses.

## Heat

Material:
- thermal distortion;
- molten turbulence;
- ember-like fragments.

Object influence:
- hotter palette;
- turbulent aura;
- refractive shimmer;
- unstable trail edges.

## Frost

Material:
- crystalline boundary;
- faceted refraction;
- fine fracture geometry.

Object influence:
- sharper edges;
- crystal fragments;
- frozen-looking trail segments.

## Filter

Material:
- spectral threshold;
- dark-to-clear spatial transition;
- controlled hue separation.

Object influence:
- visible change in clarity and spectral character across the boundary.

## Field geometry

Field edges may be slightly organic and dynamic.

They must remain:
- legible;
- bounded;
- stable enough for direct manipulation;
- aligned with actual interaction geometry.

The visual boundary must never imply a materially different effect region from the real one.

---

# 11. Overlapping Fields

Field intersections are a major Visual V2 signature.

When Fields overlap, the renderer may create a blended visual material such as:

- Space + Heat → fiery nebula;
- Frost + Echo → crystalline repeated ripples;
- Filter + Space → spectral void;
- Heat + Frost → visually unstable thermal/crystal boundary.

Rules:

- blending is visual only unless existing audio behavior already combines;
- intersection visuals must remain readable;
- no unbounded shader combinations;
- all supported pairings must have a deterministic fallback;
- three-or-more overlaps may simplify instead of producing combinatorial effects.

---

# 12. Motion and trail language

Motion should leave expressive evidence.

Trail properties may respond to:

- role;
- speed;
- acceleration;
- direction changes;
- current Field;
- quality profile.

## Role trail identities

- Beat — short dense wake;
- Percussion — spark fragments;
- Bass — broad heavy ribbon;
- Harmony — layered smooth ribbon;
- Melody — fine luminous filament;
- Texture — diffuse mist;
- Voice — organic ribbon.

## Trail rules

Trails must:
- taper;
- decay;
- remain bounded;
- never obscure interaction targets;
- never imply a path that the Orb did not travel;
- obey Reduce Motion and Reduce Particles.

---

# 13. Toys and local physics visualization

## Spinner
Visual effect:
- local trajectory curvature;
- orbital dust;
- subtle twisting of nearby trails.

## Magnet
Visual effect:
- particles and auras stretch inward;
- temporary attraction lines;
- nearby trails curve toward it.

## Repulsor
Visual effect:
- dust evacuates;
- radial pressure response;
- facing sides of nearby auras flatten subtly.

## Portal
Visual effect:
- suction;
- body elongation;
- collapse;
- destination ignition;
- reformation;
- residual wave.

Toy VFX must reflect the existing toy behavior. They must not imply new physical rules.

---

# 14. Links

Links are relationships, never patch cables.

Visual language:
- curved light path;
- role-aware color blending;
- subtle thickness variation;
- event packets;
- relationship-specific rhythm;
- local glow.

Creation:
1. source focuses;
2. elastic ghost tether appears;
3. target responds;
4. relationship stabilizes.

Deletion:
- energy dissipates toward both endpoints;
- path breaks into bounded particles or fades.

Activation:
- pulse travels in the real semantic direction where a direction exists.

Links crossing Fields may be visually refracted, but the path must remain easy to follow.

---

# 15. Listener

The listener is the visual anchor of the World.

Anatomy:
- compact luminous core;
- concentric spatial layers;
- subtle iris-like geometry;
- orbiting motes;
- local atmospheric influence.

Playback:
- listener wakes;
- rings breathe;
- major events may arrive as restrained light packets.

Recording:
- restrained rose capture edge;
- no flashing recording spectacle.

The listener must remain visually distinct from Sound Orbs.

---

# 16. Cross-system interaction rules

Visual V2 should make existing systems appear to inhabit one universe.

Supported visual interactions should include:

- Orbs illuminate nearby surfaces;
- Fields alter Orb material presentation;
- Fields alter trail appearance;
- toys bend particles and trails;
- Links can receive local light;
- Portal transforms an Orb during transport;
- close Orbs may blend auras;
- fast-moving Orbs may produce local wakes;
- overlapping Fields blend their visual material.

Cross-system effects must remain deterministic enough to reproduce and test.

No cross-system VFX may:
- schedule audio;
- alter saved musical state;
- create history;
- trigger autosave;
- change hit-test geometry.

---

# 17. Motion grammar

Visual V2 uses four motion families.

## Physical
For:
- Orbs;
- Fields;
- toys;
- direct manipulation.

Character:
- spring;
- inertia;
- anticipation;
- small overshoot;
- settle.

## Luminous
For:
- pulses;
- light packets;
- transient feedback.

Character:
- fast attack;
- smooth decay;
- minimal spatial travel unless semantically meaningful.

## Atmospheric
For:
- haze;
- distant particles;
- background fields.

Character:
- slow;
- low amplitude;
- non-distracting;
- never synchronized so strongly that the background flickers.

## Interface
For:
- sheets;
- menus;
- buttons;
- focus feedback.

Character:
- precise;
- short;
- minimal;
- predictable.

Magic and major state transitions may use a fifth **transformative** family with stronger morphing, but only in short bounded sequences.

---

# 18. Timing principles

Exact timings may be tuned during implementation, but the following ranges are the Phase 1 contract.

- micro feedback: 70–160 ms;
- button/icon response: 100–180 ms;
- object grab/drop settle: 140–320 ms;
- local transient VFX: 120–500 ms;
- panel transitions: 160–280 ms;
- major object creation/removal: 220–450 ms;
- Portal/Magic special transformation: 350–900 ms;
- World-to-World visual transition: 450–1200 ms;
- atmosphere: multi-second continuous drift.

Do not stack several long delays before interaction becomes available.

Input response must remain immediate even when visual settling continues.

---

# 19. Musical choreography

The visual system may coordinate independent objects during meaningful existing musical events.

Useful event classes:

- playback start;
- playback stop;
- strong downbeat;
- simultaneous multi-orb event;
- phrase boundary;
- sudden silence;
- recording start/stop;
- Magic commit;
- Snapshot recall.

Choreography must be derived from existing scheduler/state information.

It must never introduce a second musical clock.

---

# 20. Interaction game-feel contract

## Hover
- slight clarity increase;
- local aura concentration;
- optional sub-pixel/very-small magnetic response.

## Grab
- immediate lift;
- body tension;
- stronger local shadow/depth;
- trail readiness.

## Drag
- velocity stretch;
- wake;
- local atmosphere displacement.

## Drop
- subtle overshoot;
- compressed aura;
- short impact response;
- settle.

## Selection
- selected object gains detail;
- related Links clarify;
- surrounding World may dim slightly;
- selection remains clear without relying on glow.

## Long press
- bounded energy accumulation;
- clear contextual intent;
- no large-screen takeover.

---

# 21. UI and chrome art direction

The UI should visually recede behind the World.

Use:
- compact controls;
- high contrast;
- consistent spacing;
- restrained translucency;
- soft material depth;
- custom Loop iconography;
- contextual role accents.

Avoid:
- large floating dashboards;
- heavy card grids over the playground;
- generic audio-plugin controls;
- gratuitous glassmorphism;
- excessive gradients;
- permanent technical labels.

Common object actions may use spatial/radial affordances when this reduces travel and remains accessible.

Complex settings continue to use conventional semantic panels/sheets.

---

# 22. Home and library direction

The Home surface must use the same universe as the playground.

Goals:
- animated but calm background;
- miniature World vocabulary;
- starter cards that resemble living dioramas;
- deterministic visual thumbnails for saved Worlds;
- one recognizable Loop brand mark.

World thumbnails should derive from real World structure rather than generic artwork.

Possible inputs:
- role mix;
- object positions;
- Link topology;
- Field layout;
- dominant palette.

Opening a World may visually transition from its thumbnail into the live scene where practical.

---

# 23. Brand mark direction

The Loop mark should be constructible from the same primitives as the product:

- circle/orb;
- orbit;
- relationship arc;
- listener/core;
- repeating loop.

It should work as:
- static favicon;
- PWA icon;
- monochrome glyph;
- animated launch mark;
- loading state;
- small toolbar mark.

The brand must not depend on a complex illustration to remain recognizable.

---

# 24. Texture and finish

Visual V2 may use subtle:
- film-like noise;
- dithering;
- procedural grain;
- soft caustics;
- refraction;
- edge highlights.

These should improve material richness without making the World look dirty.

Avoid obvious wallpaper-like noise textures.

---

# 25. Post-processing direction

A High/Ultra-quality renderer may conceptually use:

1. base world render;
2. local light accumulation;
3. restrained bloom;
4. selective refraction/distortion;
5. subtle vignette;
6. grain/dither;
7. final composite.

Rules:
- post-processing is optional;
- readability cannot depend on it;
- Balanced and Battery Saver must retain the same identity;
- expensive effects must have deterministic fallbacks.

---

# 26. Quality profiles

Visual V2 keeps three required profiles.

## High

Target:
- full procedural materials;
- richer particles;
- smooth ribbon trails;
- Field refraction;
- local illumination;
- restrained post-processing.

## Balanced

Target:
- same composition and identities;
- reduced particle counts;
- simpler trail geometry;
- simplified Field distortion;
- reduced post-processing.

This should be the default on uncertain hardware.

## Battery Saver

Target:
- clear static/procedural identity;
- minimal particles;
- simple trails or none;
- no expensive refraction;
- minimal bloom;
- reduced continuous ambience.

Audio and interaction behavior remain unchanged.

An optional Ultra profile may be evaluated later, but it is **not** part of the Phase 1 locked requirement.

---

# 27. Performance budgets

These are design budgets, not final certification thresholds.

## Desktop High

Aim for:
- 60 fps under normal interaction;
- frame budget near 16.7 ms;
- no unbounded GPU or JS allocation;
- stable rendering at maximum supported V1 object counts.

## Mobile Balanced

Aim for:
- 60 fps on capable devices;
- graceful stable fallback where 60 fps cannot be sustained;
- graphics must never interfere with audio scheduling.

## General limits

Visual V2 must:
- cap particles globally and per emitter;
- cap trail geometry;
- reuse buffers where practical;
- avoid per-frame DOM layout;
- avoid shader permutation explosion;
- recover from graphics-context loss;
- reduce DPR/effects before compromising interaction/audio responsiveness.

---

# 28. Accessibility contract

Visual V2 must preserve the existing independent controls:

- Reduce Motion;
- Reduce Particles;
- Reduce Glow.

## Reduce Motion

Remove or simplify:
- camera drift;
- long travel;
- continuous orbiting decoration;
- trails;
- large morphs.

Preserve:
- brightness/state feedback;
- selection;
- creation/deletion clarity;
- semantic relationship activation.

## Reduce Particles

Remove:
- ambient dust;
- sparks;
- fragments;
- decorative motes;
- transient particle bursts.

Core geometry remains understandable.

## Reduce Glow

Replace heavy bloom with:
- crisp edges;
- direct luminance;
- contrast;
- controlled outlines.

## Additional requirements

- role identity must survive grayscale reasonably well;
- focus indicators remain DOM-accessible and visible;
- forced-colors UI remains usable;
- visual-only canvas content must not remove semantic DOM controls;
- animation must avoid high-frequency flashing.

---

# 29. Renderer and product-state boundary

Presentation state must remain separate from creative state.

Visual runtime may store ephemeral data such as:
- particle positions;
- animation progress;
- interpolation values;
- cached geometry;
- shader uniforms;
- transient light intensity;
- camera framing;
- visual mood.

None of those belong in WorldDocument unless they represent an existing user-visible creative setting.

Visual state must not:
- create undo entries;
- trigger autosave;
- modify exports;
- affect musical random seeds;
- alter scheduler timing.

---

# 30. Visual event boundary

The audio scheduler remains authoritative.

Visuals may subscribe to already-scheduled or already-resolved events.

The rendering engine must never become an audio clock.

Preferred flow:

```
Audio scheduler / app state
          ↓
   visual event bridge
          ↓
    renderer reactions
```

If a frame is late, graphics may skip or compress an effect rather than delaying sound.

---

# 31. Maximum-density behavior

At high object counts, Visual V2 must intentionally simplify.

Possible reductions:
- smaller halos;
- fewer decorative particles;
- shorter trails;
- reduced internal detail;
- quieter labels;
- simplified overlap rendering;
- reduced local-light radius.

Selection and hover may temporarily restore detail for the focused object.

The dense World should look composed, not like a bloom cloud.

---

# 32. Generated visual identity

Each World should eventually be capable of producing a deterministic visual fingerprint from its existing creative structure.

Possible outputs:
- library thumbnail;
- World glyph;
- recording artwork;
- share image.

This system is allowed only if it reflects existing World state and does not create another customization workflow.

---

# 33. Special-event art direction

## Play
- listener wakes;
- environment gains energy;
- Orbs become active.

## Stop
- residual effects decay;
- atmosphere settles.

## Magic
- short destabilize → recombine → settle transformation.

## Portal
- suction → compression → transfer → reformation.

## Snapshot
- spatial morph between saved states where safe.

## Delete
- material-appropriate bounded dissolution.

## Undo
- reconstruction/reformation where the original action can be represented clearly.

Special events must remain brief enough that the app never feels locked behind animation.

---

# 34. Rare delight

Rare delight is allowed only after core readability is satisfied.

Examples may include:
- occasional Melody satellite slingshot;
- temporary constellation;
- synchronized ring alignment;
- single shooting mote;
- silence-settle dust.

Rules:
- presentation-only;
- low frequency;
- never blocks input;
- never changes music;
- disabled by reduced effects as appropriate.

---

# 35. Performance mode direction

A future Performance mode may hide most application chrome while preserving:

- Play/Pause;
- Record where applicable;
- exit;
- essential state.

The renderer may use:
- gentle camera drift;
- automatic framing;
- richer ambience;
- quality-aware presentation.

This is a presentation surface, not a separate creative mode.

---

# 36. Explicit anti-goals

Visual V2 must not become:

- a generic sci-fi HUD;
- an oscilloscope wall;
- a spectrum-analyzer dashboard;
- a DAW skin;
- a cyberpunk neon template;
- a particle demo;
- an infinite shader toy;
- a fake 3D navigation environment;
- a game progression layer;
- a theme marketplace;
- a manual lighting editor;
- a visual scripting system.

Do not expose shader, particle, lighting, bloom, refraction, or render-pipeline controls as creative parameters.

---

# 37. Screenshot quality target

A useful art-direction test:

> Hide the UI and capture the World. The result should look like intentional generative audiovisual artwork.

This does not mean maximum detail.

A good screenshot needs:
- focal hierarchy;
- negative space;
- restrained color;
- recognizable objects;
- coherent lighting;
- readable depth;
- bounded effects.

---

# 38. Silent interaction target

With audio muted, the following should still feel satisfying and understandable:

- hover;
- pick up;
- drag;
- drop;
- add;
- delete;
- link;
- enter/leave a Field;
- use a toy;
- Portal transfer;
- Magic transformation;
- Snapshot recall.

This is a game-feel target, not a requirement to add silent gameplay.

---

# 39. Label-free identity target

With text labels hidden, a reasonably familiar user should be able to distinguish major Orb roles using:

- silhouette;
- material;
- internal detail;
- motion;
- pulse behavior;
- trail language.

Color provides reinforcement, not the only signal.

---

# 40. Phase 1 lock

The following are locked for the start of implementation:

- living-light visual thesis;
- 2.5D rather than navigable 3D;
- World-first hierarchy;
- role-specific procedural Orb materials;
- Fields as spatial materials;
- cross-system visual interactions;
- local-light metaphor;
- expressive role-specific trails;
- listener as visual anchor;
- event-driven musical choreography;
- DOM semantics separated from rendered World graphics;
- High / Balanced / Battery Saver quality profiles;
- Reduce Motion / Reduce Particles / Reduce Glow;
- no visual influence on audio timing or saved creative state;
- no DAW/HUD/particle-sandbox visual direction.

Changes to these locked principles require an explicit specification revision before implementation.

---

# 41. Phase 2 handoff

Phase 2 — Rendering Architecture V2 should now define and implement:

- renderer technology choice;
- scene graph;
- render layers;
- World-to-render adapter;
- visual event bridge;
- animation clock;
- quality capability detection;
- DPR policy;
- resize/lifecycle behavior;
- context-loss handling;
- DOM/canvas interaction boundary;
- performance instrumentation;
- fallback strategy.

Phase 2 should use placeholder visuals first. It should not attempt to finish Orb materials or Field effects before the renderer architecture is stable.
