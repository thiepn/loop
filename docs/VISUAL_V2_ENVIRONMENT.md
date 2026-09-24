# Loop — Visual V2 World Environment, Atmosphere & Depth

## Status

Phase 3 implementation is present on the Visual V2 track.

## Goal

The World is no longer a static dark panel behind the interactive objects.

Visual V2 Phase 3 makes the World itself communicate:

- which sounds inhabit it;
- whether it is awake or quiet;
- how visually dense it is;
- where recent musical energy occurred;
- whether bass/transient energy is active;
- how the pointer or touch is disturbing the space.

The environment remains presentation-only.

## Deterministic World palette

Every World derives a visual atmosphere from its existing creative structure.

Inputs:

- Sound Orb roles;
- mute state;
- Effect Field types;
- World id;
- musical seed;
- object density.

Outputs:

- primary atmospheric color;
- secondary atmospheric color;
- ambience strength;
- particle-density scale;
- deterministic visual seed.

The derived palette is never stored in `WorldDocument`.

Changing the creative World naturally changes its atmosphere; there is no separate theme editor.

## Depth bands

Phase 3 implements the three Phase 1 depth bands.

### Far

- deep procedural backdrop;
- low-frequency haze;
- fine distant particle field;
- subtle grain;
- lowest contrast.

### World plane

Existing Visual V2 placeholders remain the clearest layer:

- Fields;
- Links;
- toys;
- Orbs;
- listener.

### Near

A smaller, sparser particle population uses:

- larger points;
- stronger pointer parallax;
- slightly higher luminance.

Near particles are still restrained so they cannot obscure controls.

## WebGL environment

Hardware WebGL2 uses a dedicated full-screen procedural environment shader.

The shader provides:

- dual-color atmospheric haze;
- low-frequency procedural fog;
- deterministic far and near star/mote fields;
- quality-scaled particle density;
- pointer parallax;
- pointer-local distortion;
- local musical-event illumination;
- listener-centered bass pressure;
- transient luminance lift;
- subtle recording tint;
- restrained vignette;
- subtle deterministic grain.

It is intentionally not a full post-processing stack. Later Visual V2 phases own materials, true local lighting and advanced distortion.

## Canvas2D fallback

Canvas2D implements the same semantic hierarchy with cheaper primitives:

- dark deep backdrop;
- two atmosphere gradients;
- deterministic far/near particles;
- event-position glow;
- pointer glow;
- parallax/drift;
- recording tint.

The fallback keeps the reduced-resolution and reduced-cadence policy established in Phase 2.

## Event-driven atmosphere

Phase 3 does not introduce a permanent new renderer loop.

Atmospheric motion is sampled when an existing visual reason already keeps rendering alive:

- scheduled Orb activity;
- Link activity;
- existing Motion RAF;
- pointer/touch disturbance;
- explicit state/viewport invalidation.

This creates an important behavior:

### Active music

Repeated musical events keep the atmosphere moving and illuminated.

### Silence / stopped playback

When events stop:

- environmental energy decays;
- bass pressure disappears;
- pointer disturbance fades;
- haze settles at its deterministic resting composition;
- particles stop drifting if no existing frame source remains.

The World therefore has a real visual silence state.

## Environmental energy

Scheduled Orb activity contributes bounded visual energy.

The environment derives:

- overall energy;
- bass pressure;
- transient emphasis;
- strongest recent event position.

Bass has the strongest pressure contribution.

Beat contributes smaller low-frequency pressure plus transient emphasis.

Percussion contributes transient emphasis.

All quantities are clamped to safe visual ranges.

## Spatial illumination

The strongest recent sound event creates a restrained local environmental glow around the sound's actual rendered position.

This is not a scientific loudness meter.

It exists to reinforce:

> sound happened here.

Phase 9 will later deepen this into cross-object light propagation.

## Pointer and touch disturbance

Pointer/touch motion emits one coalesced transient presentation event.

The event contains:

- normalized position;
- bounded directional delta;
- bounded movement intensity.

It drives:

- local light;
- haze displacement;
- depth-band parallax.

Only the newest pointer disturbance is retained.

The pointer cannot mutate World state.

## Reduced effects

### Reduce Motion

- removes directional pointer distortion;
- removes environment drift/parallax;
- keeps restrained pointer light/state feedback;
- keeps the resting atmosphere.

### Reduce Particles

- removes procedural environment particles;
- old DOM ambient particles also remain disabled under the Visual V2 renderer.

### Reduce Glow

- retains palette/depth;
- environment illumination uses the existing reduced bloom scale.

## Density-aware ambience

As the World approaches the maximum Orb count:

- atmosphere strength reduces slightly;
- particle density falls;
- object plane remains dominant.

Dense Worlds therefore do not become visual fog clouds.

## State boundary

Environment state is derived or transient.

It does not:

- alter WorldDocument;
- create history;
- trigger autosave;
- affect backup/export data;
- schedule audio;
- affect motion or hit testing.

## Phase 4 handoff

Phase 4 — Sound Orb Material Engine can now assume:

- a real depth-bearing World background exists;
- role colors already influence ambient palette;
- scheduled sound activity produces environmental energy;
- recent sound position can illuminate the environment;
- pointer/touch parallax exists;
- quality/reduced-effect policies already scale the World.

Phase 4 should focus on procedural Orb bodies and identity instead of adding another environment system.
