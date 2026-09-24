# Loop — Visual V2 Motion Trails & Kinetic Graphics

## Status

Phase 6 implementation is present on the Visual V2 track.

## Goal

Phase 6 replaces the legacy DOM trail dots with one bounded renderer-level trail system.

Trails now communicate real movement through:

- continuous ribbon geometry;
- role identity;
- velocity;
- acceleration;
- turning;
- Effect Field influence;
- toy influence;
- time-based decay.

They remain visual evidence of existing motion, not a new drawing or animation tool.

## Trail history

`TrailHistory` owns transient renderer-only motion samples.

Each point stores:

- normalized position;
- timestamp;
- normalized speed;
- acceleration;
- direction;
- turn sharpness;
- current Effect Field amounts;
- strongest toy influence;
- explicit path-break marker.

History is capped by quality profile and never saved.

## Quality budgets

### High

- up to 28 points per Orb;
- approximately 1320 ms lifetime;
- smallest sample-spacing threshold;
- two-pass centerline smoothing.

### Balanced

- up to 18 points;
- approximately 900 ms lifetime;
- one-pass smoothing.

### Battery Saver

- up to 8 points;
- approximately 520 ms lifetime;
- unsmoothed bounded ribbons.

### Reduce Motion

Trail history is disabled and existing history is pruned.

## One trail system

The old `.motion-trail-point` DOM generation is removed.

Automatic Motion and manual Orb dragging now feed the same renderer history:

```
existing live Orb position
        ↓
TrailHistory
        ↓
RenderTrail
      ↙   ↘
 WebGL   Canvas2D
```

No additional permanent RAF was introduced.

## Role-specific trail language

### Beat

- dense short wake;
- medium width;
- firm decay.

### Percussion

- narrow segmented trail;
- strongest sharp-turn spark response.

### Bass

- broad heavy ribbon;
- lower opacity;
- strongest physical width.

### Harmony

- paired/layered ribbons;
- smooth wide relationship to the body.

### Melody

- fine luminous filament;
- strong turn accents.

### Texture

- broad diffuse low-alpha trail;
- deliberately atmospheric rather than line-like.

### Voice

- medium organic ribbon;
- softer turn accents.

## Velocity and acceleration

Trail width responds to real movement:

- faster samples widen/energize the ribbon;
- acceleration adds a smaller secondary width response;
- stationary/small movements are filtered by minimum pixel spacing.

Direction comes from actual screen-space movement.

## Spline smoothing

High and Balanced use bounded Chaikin-style centerline smoothing.

Smoothing:

- never crosses explicit path breaks;
- preserves endpoints;
- carries interpolated visual metadata;
- does not alter actual Orb motion.

Battery Saver uses the sampled polyline directly.

## Sharp-turn response

Turn angle is normalized from consecutive velocity vectors.

When the turn becomes sharp:

- WebGL can emit a small diamond fragment;
- Canvas2D renders the same bounded marker.

`Reduce Particles` removes these turn fragments while retaining the ribbon.

## Effect Field trail hooks

Phase 6 visually reacts to current Field influence without replacing the deeper Phase 7 Field material system.

### Space

- widens/stretches the trail slightly;
- softens alpha.

### Echo

- adds a displaced ghost ribbon.

### Heat

- shifts toward thermal color;
- adds controlled lateral turbulence.

### Frost

- cools color;
- narrows and segments/crystallizes the trail.

### Filter

- shifts toward spectral green/cyan;
- reduces trail intensity slightly.

All influence is sampled at the real rendered trail point.

## Toy influence

The actual centerline already includes toy-modified Motion because TrailHistory samples the final existing MotionEngine output.

The strongest nearby toy also adds visual treatment:

### Spinner

- slight lateral oscillation around the already-curved path.

### Magnet

- narrows/concentrates the ribbon.

### Repulsor

- broadens the ribbon.

### Portal

- fades/segments nearby ribbon;
- teleport-sized jumps become explicit path breaks.

Loop never draws a false straight connection across a Portal teleport.

## WebGL ribbons

`WebGLTrailLayer` converts trail segments into dynamic triangle ribbons.

It uses:

- one shared shader;
- one dynamic vertex buffer;
- per-vertex alpha/color;
- bounded CPU geometry generation;
- role-specific widths/layers;
- ghost copies for Echo;
- turn-fragment triangles.

The layer renders below Orb bodies so moving objects remain the focal point.

## Canvas2D fallback

`CanvasTrailLayer` renders equivalent bounded curves with:

- rounded quadratic segments;
- role-specific widths;
- layered Harmony lines;
- Echo ghosts;
- Field/toy styling;
- turn diamonds.

It remains subject to the existing reduced-resolution and cadence fallback policy.

## Decay

Trail age is evaluated at render time.

Opacity follows a smooth nonlinear fade until the quality-specific lifetime expires.

When Motion stops:

- the renderer's demand-driven clock remains alive only long enough to fade visible trails;
- expired history is pruned;
- rendering returns to idle.

## Density / memory safety

History is bounded by:

- existing 12-Orb maximum;
- quality-specific point count;
- quality-specific lifetime;
- minimum sample spacing.

Portal discontinuities and World switches cannot create unbounded geometry.

## Legacy handoff

Phase 6 retires:

- DOM motion-trail point creation;
- DOM trail timers;
- per-Orb DOM trail arrays.

The remaining legacy visual burst particles are intentionally left for later VFX/material phases.

## State boundary

Trails do not:

- modify Orb position;
- modify Motion documents;
- modify toy behavior;
- modify Effect Field behavior;
- create undo history;
- trigger autosave;
- enter backups/exports;
- affect audio.

## Phase 7 handoff

Phase 7 — Effect Fields V2 can build on trails that already expose per-point Field influence.

Phase 7 should deepen:

- Field boundary materials;
- Orb material transformation;
- environment transformation;
- Field intersections;

rather than redesigning the trail data path.
