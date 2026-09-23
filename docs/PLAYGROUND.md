# Loop — Sound Orb Playground

## Status
Introduced in Phase 3 and updated through Phase 5.

Loop's main product surface is a bounded spatial World containing living Sound Orbs. Later phases extend what those orbs can do without replacing the canvas-first interaction model.

## Core surface

The main screen contains:
- a central listener;
- draggable Sound Orbs;
- one shared musical clock;
- minimal top-level controls;
- contextual controls only for the selected orb.

The canvas remains the primary interface.

## Sound Orb document

Each orb stores:
- id;
- sound id;
- musical role;
- normalized x/y position;
- mute state;
- optional edited rhythm or melody pattern.

Positions are normalized from 0 to 1 so Worlds remain independent of viewport size.

The V1 hard cap remains 12 Sound Orbs.

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

Adding, removing, muting, moving, or editing an orb updates the same runtime without creating another AudioContext.

## Musical behavior

Built-in sounds still provide safe default musical patterns, but Phase 5 makes those defaults editable.

Rhythmic sounds use 16-step rhythm documents.

Bass, chords, melody, and voice use scale-degree melody documents.

Texture sounds remain intentionally non-editable in Phase 5.

When a pattern has never been edited, playback derives a default from the current sound. Once the user changes it, the pattern becomes explicit serializable orb state.

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
The contextual selection panel can provide:
- Shape — edit rhythm/melody when supported;
- Change — choose another sound;
- Mute / Unmute;
- Duplicate;
- Delete.

Texture orbs hide Shape because they do not expose a Phase 5 step pattern.

No mixer or technical parameter inspector is exposed.

## Shape editor

The Shape sheet is contextual and temporary.

### Rhythm
A single 16-step row supports:
- tap;
- drag-paint;
- drag-erase;
- clear;
- Sparse / Balanced / Busy;
- Straight / Bounce / Loose;
- Try another.

### Melody
A 7×16 visual grid supports:
- tap;
- drag-paint;
- drag-erase;
- high/low spatial orientation;
- no note names;
- only scale-degree values valid in the current World;
- the same density/groove/variation macros.

The editor is not a DAW timeline or piano roll.

## Duplication

Duplicate:
- creates a new orb with the same sound and role;
- offsets its position slightly;
- preserves mute state;
- preserves edited pattern state;
- selects the new copy;
- respects the 12-orb cap.

## Change

Change preserves an edited pattern when the replacement sound uses the same broad pattern kind.

Examples:
- Round Kick → Dust Shaker: rhythm survives.
- Warm Bass → Deep Bass: melody survives.
- Kick → Bass: incompatible rhythm is dropped and the bass receives its own default melody behavior.

## Mute

Mute is represented consistently in both layers:
- audio channel smoothly approaches silence;
- visual orb becomes dim/desaturated;
- the orb remains movable and editable.

## Audio-reactive visuals

The audio scheduler publishes lightweight activity events.

Visual pulses are delayed until the corresponding AudioContext event time so the canvas reacts near the audible transient rather than when the event was scheduled ahead.

Role identities include:
- beat: strong rose pulse;
- percussion: small amber sparks;
- bass: larger cyan body and slow breathing;
- harmony: large violet halo;
- melody: compact green particles;
- texture: broad blue atmospheric orb;
- voice: pink expressive orb.

## Starter entry

Since Phase 4, Loop starts from the dedicated Home rather than a single fixed starter World.

Starter choices are:
- Beat;
- Chill;
- Dreamy;
- Dance;
- Weird;
- Empty;
- Surprise Me.

Every non-empty starter is an ordinary WorldDocument and enters this same playground.

## World schema

World schema version 4 includes full SoundOrbDocument objects with optional serializable pattern state.

Effect Fields, Links, and Snapshots remain placeholders until their roadmap phases.

## Current scope boundary

The playground currently includes:
- starter Worlds;
- Add/Change palette;
- spatial dragging;
- selection/mute/duplicate/delete;
- rhythm editing;
- scale-locked melody editing;
- density/groove/variation macros.

It does not yet include:
- Effect Fields;
- Motion;
- Links;
- Phase 9 Magic;
- persistent World library;
- recording/export.

Those remain assigned to later roadmap phases.
