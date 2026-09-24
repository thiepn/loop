# Loop — Visual V2 Links, Listener & Light Propagation

## Status

Phase 9 implementation is present on the Visual V2 track.

## Goal

Phase 9 turns relationships and scheduled sound activity into deliberate light transport.

It upgrades:

- Links from generic lines into role-aware luminous paths;
- the listener from a pair of discs into a central audiovisual anchor;
- Orb activity into bounded local illumination and Orb→listener energy travel.

All timing comes from the existing audio-aligned visual events.

## Link V2 light paths

Links now use dedicated renderer layers:

- `WebGLLinkLightLayer`;
- `CanvasLinkLightLayer`.

The old generic line renderer is removed from the healthy Visual V2 path.

Each Link path combines:

- source Sound role color;
- target Sound role color;
- Link-type identity;
- Phase 8 Field influence/refraction;
- Phase 8 toy influence;
- selection state.

The role colors interpolate along the path rather than using one flat Link color.

## Link glow hierarchy

A Link renders as:

1. restrained outer light path;
2. clearer inner relationship path;
3. optional energy packet during scheduled activity.

Reduce Glow strongly reduces the outer light contribution while preserving relationship readability.

## Semantic Link direction

Most Links visually transport energy source → target.

`Take Turns` is different: it receives two mirrored packets to communicate alternation rather than falsely implying one permanent direction.

This changes presentation only.

## Energy packets

Scheduled `link-pulse` events now produce a packet on the actual Phase 8 transformed Link geometry.

Packets therefore follow:

- curved base path;
- Field refraction;
- toy distortion.

They never snap back to a straight or pre-Field route.

## Link creation

Successful creation emits a bounded `link-created` visual event.

The new light path grows from source toward target over a short tether sequence.

Input remains available immediately; the animation does not delay creation.

## Link deletion

Deletion captures a presentation-only snapshot of the current rendered Link before creative state removes it.

A `link-deleted` event then dissipates that ghost path.

The ghost contains only renderer information needed for the short exit and is never persisted.

## Legacy Link fallback

The existing semantic SVG Link layer remains responsible for:

- keyboard focus;
- hit paths;
- ARIA semantics;
- renderer-loss fallback.

Its old pulse animation is skipped while the V2 renderer is healthy, avoiding invisible duplicate animation work.

## Listener V2

The listener is now a dedicated rendered material rather than generic circles.

Its visual anatomy includes:

- luminous central core;
- two spatial rings;
- six-segment iris geometry;
- bounded energy expansion;
- optional orbiting mote;
- arrival response;
- recording-state color shift.

The listener remains visually distinct from Sound Orbs.

## Listener energy

Listener energy is derived from:

- playback state;
- current scheduled Orb activity;
- energy packet arrival envelope.

There is no separate listener clock.

## Recording state

Recording shifts the listener toward a restrained rose state.

This replaces generic recording tint at the anchor with a more intentional identity while preserving existing capture behavior.

## Orb → listener energy travel

Scheduled Orb pulses create short energy packets from the Orb's actual rendered position toward the listener.

The packet:

- follows a small quadratic arc;
- uses the Orb role color;
- includes current Field tint;
- leaves a tiny bounded tail in WebGL;
- contributes to listener arrival energy.

Reduce Motion removes the traveling packet while retaining local light and listener arrival/state feedback.

## Local illumination

Active scheduled sound events create bounded local radial light.

Each light has:

- actual event position;
- role-derived color;
- current Field tint;
- event-derived intensity;
- bounded radius.

Selected and keyboard-focused Orbs also contribute very low static light so visual hierarchy remains coherent between events.

## Quality-aware light budget

Local lights are capped before rendering:

- High → 8 strongest;
- Balanced → 6;
- Battery Saver → 4.

Orb→listener packets are also capped:

- High → 5;
- Balanced → 3;
- Battery Saver → 1.

Sorting uses intensity then stable id ordering.

Simultaneous musical events therefore accumulate visibly without creating unbounded light work.

## Light falloff

Both renderer paths use radial nonlinear falloff.

The WebGL light layer uses additive radial sprites.

Canvas uses additive radial gradients.

This allows nearby:

- Orbs;
- Fields;
- Links;
- trails;
- toys;

to visibly sit inside the same pool of light without adding new object-state mutations.

## Field tint

Light emitted by an Orb inside a Field uses the same Phase 7 Field-influenced material color.

For example:

- Heat warms the light;
- Frost cools it;
- Filter shifts it spectrally.

This preserves cross-system visual consistency.

## Link local light

Link pulses also create a small bounded light source around the relationship midpoint.

This reinforces the Link as active without making it a second listener.

## Selected / focused hierarchy

Selected Orbs contribute more static illumination than keyboard-focused-only Orbs.

This supplements, rather than replaces:

- selection ring;
- focus ring;
- DOM accessibility states.

## WebGL light propagation

`WebGLLightPropagationLayer` renders:

- capped local radial lights;
- Orb→listener packet heads;
- short packet tails.

It uses additive blending and one dynamic buffer.

## Canvas light propagation

`CanvasLightPropagationLayer` renders equivalent:

- radial gradients;
- additive compositing;
- Orb→listener packet heads.

It remains within the software fallback quality policy.

## Listener WebGL / Canvas parity

Dedicated listener layers exist for both backends:

- `WebGLListenerLayer`;
- `CanvasListenerLayer`.

Reduce Motion freezes continuous iris/orbit movement.

Reduce Particles removes the listener mote.

Reduce Glow reduces light transport while preserving listener/ring geometry.

## State boundary

Phase 9 lighting does not:

- change sound;
- create Links;
- delay Link creation/deletion;
- change listener position;
- move Orbs;
- alter Field DSP;
- alter scheduler timing;
- create undo entries;
- trigger autosave;
- enter WorldDocument.

## Phase 10 handoff

Phase 10 — Musical Choreography can now coordinate:

- listener wake/settle;
- simultaneous light sources;
- downbeat pulses;
- phrase transitions;
- silence;

using a complete light-transport foundation rather than ad-hoc object flashes.
