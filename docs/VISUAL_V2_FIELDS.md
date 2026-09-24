# Loop — Visual V2 Effect Fields V2

## Status

Phase 7 implementation is present on the Visual V2 track.

## Goal

Effect Fields are no longer translucent circles.

Phase 7 turns them into spatial materials that visibly transform:

- their own boundary and interior;
- Orbs inside them;
- motion trails passing through them;
- the surrounding World atmosphere;
- overlap regions with other Fields.

The audio/DSP Field behavior remains unchanged.

## Field material model

Each Field projects a deterministic material identity from:

- Field id;
- Field type;
- current radius;
- selected state;
- drag/resize tension.

The deterministic seed is based only on id/type, so moving or resizing a Field does not visually reroll it.

## Organic boundaries

Field boundaries use bounded procedural deformation.

The deformation is intentionally small so the visible region continues to match the real interaction/DSP geometry.

Reduce Motion freezes continuous edge movement while keeping the material identity.

## Space

Space is rendered as a nebular spatial volume:

- violet/blue atmospheric body;
- soft procedural cloud structure;
- sparse internal stars/motes;
- softer edge;
- increased Orb aura/depth;
- slightly wider/softer trails;
- cool global ambience proportional to Field coverage.

Reduce Particles removes the internal star points while retaining the volume.

## Echo

Echo uses temporal repetition language:

- concentric moving rings inside the Field;
- cyan ghost character;
- Orb after-rings;
- displaced ghost trails;
- restrained rhythmic environmental tint.

The visual repeats are not a second timing system; they are renderer animation only.

## Heat

Heat uses thermal/turbulent language:

- most irregular organic boundary;
- animated thermal bands;
- warm red/orange core;
- turbulent Orb boundary response;
- warmer Orb material;
- laterally disturbed trails;
- warm atmospheric influence.

This is a refractive-looking material treatment, not a second render-to-texture scene-distortion pass.

## Frost

Frost uses crystalline/faceted language:

- pale blue body;
- radial crystalline rays;
- faceted boundary response;
- Orb cooling/crystal lines;
- narrow segmented trails;
- cool World ambience.

The Field remains spatially soft enough that its real effect boundary remains understandable.

## Filter

Filter uses a spectral threshold:

- dark-to-bright horizontal gradient;
- green/cyan body;
- spectral band lines;
- slightly contracted/darker Orb body;
- spectral trail shift;
- restrained green World tint.

The material communicates filtering without presenting technical frequency-response UI.

## Orb transformation

Every Orb already receives current Effect depth.

Phase 7 now consumes that depth directly.

Effects are continuous scalars rather than binary flags.

An Orb may therefore receive blended Space/Echo/Heat/Frost/Filter treatment when Fields overlap.

## Entry / exit continuity

`FieldInfluenceTransitions` provides a renderer-only short response envelope.

When an Orb crosses a Field boundary:

- target effect depth still comes from the real geometry;
- the visual material approaches that target smoothly;
- the transition remains active briefly after motion stops;
- no new permanent RAF is introduced.

Reduce Motion switches Field influence immediately instead of animating the transition.

## Trail transformation

Phase 6 trail samples already stored Field depth.

Phase 7 keeps and formalizes those reactions:

- Space → wider/softer;
- Echo → ghost ribbon;
- Heat → thermal color/turbulence;
- Frost → cool segmented/crystal trail;
- Filter → spectral shift/reduced intensity.

No trail geometry is invented outside the real sampled path.

## Environment influence

Global Field ambience is scaled by actual approximate Field coverage rather than Field count alone.

A single small Field therefore does not recolor the entire World.

Larger or multiple Fields progressively influence:

- Space violet/blue depth;
- Echo cyan pulse tint;
- Heat warmth;
- Frost pale coolness;
- Filter green/cyan atmosphere;
- overlap luminosity.

All values are bounded.

## Two-Field intersections

Pairwise overlaps derive a deterministic intersection material from real Field geometry.

The intersection renderer receives:

- both Field types;
- overlap position;
- overlap radius;
- normalized strength.

It creates a blended local material instead of simply stacking two opaque surfaces.

## Three-or-more overlap simplification

With a maximum of five Fields there can be many pair combinations.

Phase 7 deliberately limits visual intersection overlays to the five strongest.

When an intersection point lies inside three or more Fields:

- the pair-specific material is simplified;
- it shifts toward a neutral luminous blend;
- the renderer avoids combinatorial shader/material complexity.

Musical Field stacking remains unchanged.

## Move / resize continuity

Field preview movement and resize use the same Field id and material seed.

The visual material therefore moves/stretches continuously rather than regenerating.

Phase 5 resize tension remains integrated with the new boundary.

## WebGL renderer

`WebGLFieldMaterialLayer` owns Field and intersection rendering.

The WebGL path uses:

- one shared Field shader;
- one static quad;
- up to five Field draws;
- up to five bounded intersection draws;
- type-specific procedural interior material;
- organic boundary;
- selection/tension treatment;
- quality/reduced-effect uniforms.

The old generic Field disc rendering is removed.

## Canvas2D fallback

`CanvasFieldMaterialLayer` implements the same identities with bounded Canvas primitives:

- procedural perimeter path;
- gradients;
- Space clouds/stars;
- Echo ellipses;
- Heat wave bands;
- Frost radial crystal lines;
- Filter spectral gradients/bands;
- local intersection glows.

It remains governed by the existing Canvas fallback resolution/cadence policy.

## Reduced effects

### Reduce Motion

- freezes organic-boundary drift;
- freezes moving Echo/Heat material motion;
- removes temporal Orb entry/exit interpolation;
- preserves Field identity and state.

### Reduce Particles

- removes Space star/mote detail;
- preserves Field bodies and intersections.

### Reduce Glow

- lowers luminous Field-edge contribution through the existing bloom policy;
- does not remove boundary/state readability.

## State boundary

Field V2 presentation does not:

- modify Field DSP;
- modify Field radius/position;
- change overlap audio semantics;
- alter Orb saved state;
- create history;
- trigger autosave;
- affect scheduler timing.

## Phase 8 handoff

Phase 8 — Cross-System Visual Interaction can now assume that Fields are true spatial materials.

Phase 8 should focus on cross-object interactions such as:

- Links refracting through Fields;
- local light propagation across Orbs/Fields;
- toy/Field combinations;
- Orb-to-Orb aura interaction;

rather than rebuilding Field identities.
