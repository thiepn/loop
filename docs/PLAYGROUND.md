# Loop — Sound Orb Playground

## Status
Phase 3 implementation contract.

Loop is now an actual interactive musical playground rather than an audio-engine demo.

## Core surface

The main screen is a bounded spatial World with:
- a central listener;
- draggable Sound Orbs;
- one shared musical clock;
- minimal top-level controls;
- contextual controls only for the selected orb.

The canvas is the primary interface.

## Sound Orb document

Each orb stores:
- id;
- sound id;
- musical role;
- normalized x/y position;
- mute state.

Positions are normalized from 0 to 1 so Worlds remain independent of viewport size.

The V1 hard cap is 12 Sound Orbs.

## Spatial behavior

The listener sits at the center of the World.

Orb position maps to sound in two intentionally simple ways:

### Horizontal position
Controls stereo pan.

The mapping is bounded to approximately -0.95 through +0.95 rather than hard full-left/full-right.

### Distance from listener
Controls presence.

The center produces full presence. The outermost corners retain an audible floor rather than fading completely to silence.

This is musical spatialization, not physical room simulation.

## Audio runtime

Each Sound Orb owns a runtime channel:

ProceduralInstrument → spatial gain → StereoPannerNode → master audio graph

The shared PlaygroundEngine owns:
- MusicalTransport;
- LookaheadScheduler;
- one runtime channel per orb;
- synchronization with the serializable World;
- audio activity events for visual feedback.

Adding, removing, muting, or moving an orb updates its runtime without creating another AudioContext.

## Fixed Phase 3 musical behavior

Phase 3 deliberately keeps patterns internal.

The starter sounds retain fixed compatible behavior:
- kick;
- hats;
- bass;
- chords;
- melody;
- texture.

Editable rhythm and melody patterns remain Phase 5 scope.

This keeps Phase 3 focused on proving the physical canvas interaction first.

## Direct manipulation

### Pointer/touch
- press an orb to select it;
- drag to reposition;
- audio pan/presence updates during the drag;
- World state commits when the drag ends;
- interrupted pointer gestures preserve the last valid position.

### Keyboard
Focused orbs can be moved with arrow keys.

Shift + arrow performs a larger movement.

### Selection controls
The contextual selection panel provides:
- Mute / Unmute;
- Duplicate;
- Delete.

No mixer or technical parameter inspector is exposed.

## Duplication

Duplicate:
- creates a new orb with the same sound and role;
- offsets its position slightly so it remains visible;
- preserves mute state;
- selects the new copy;
- respects the 12-orb cap.

## Deletion

Delete:
- removes only the selected orb;
- removes its runtime audio channel;
- stops its active/future scheduled sources;
- clears selection when necessary.

## Mute

Mute is represented consistently in both layers:
- audio channel smoothly approaches silence;
- visual orb becomes dim/desaturated;
- the orb remains movable and editable.

## Audio-reactive visuals

The audio scheduler publishes lightweight activity events.

Visual pulses are delayed until the corresponding AudioContext event time so the canvas reacts near the audible transient rather than when the event was scheduled ahead.

Role identities currently include:
- beat: strong rose pulse;
- percussion: small amber sparks;
- bass: larger cyan body and slow breathing;
- harmony: large violet halo;
- melody: compact green particles;
- texture: broad blue atmospheric orb.

These are CSS/DOM visuals for Phase 3. A later visual-system phase can deepen rendering without changing the World/audio contract.

## Starter World

Phase 3 opens directly into **First Orbit** with six distinct orbs:
- Round Kick;
- Glass Hats;
- Warm Bass;
- Dream Chords;
- Soft Pluck;
- Air.

The purpose is immediate play, not a blank canvas.

Starter-World selection and the proper New World flow remain Phase 4.

## World schema

World schema version 3 replaces placeholder sound-orb id strings with full SoundOrbDocument objects.

Effect Fields, Links, and Snapshots remain placeholders until their roadmap phases.

## Scope boundaries

Phase 3 does not add:
- Add-sound palette;
- onboarding flow;
- editable step sequencer;
- melody editor;
- Effect Fields;
- Motion;
- Links;
- Magic;
- persistence;
- recording.

Those remain assigned to later phases.

## Acceptance principle

Phase 3 succeeds when a user can:
1. press Play;
2. hear a coherent loop;
3. visually identify separate musical objects;
4. drag an object left/right and hear stereo movement;
5. drag it closer/farther and hear presence change;
6. select it;
7. mute, duplicate, or delete it;
8. see the object react when its sound plays.

The interaction should already feel like a musical toy before any advanced playground systems are added.
