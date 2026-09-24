# Loop — Sound Orb Playground

## Status
Introduced in Phase 3 and updated through Phase 10.

Loop's main product surface is a bounded spatial World containing living Sound Orbs. Later phases extend what those orbs can do without replacing the canvas-first interaction model.

## Core surface

The main screen contains:
- a central listener;
- draggable Sound Orbs;
- directly manipulable Effect Fields;
- optional Sound Orb Motion;
- directly manipulable playground toys;
- visible reactive Links between Sound Orbs;
- one shared musical clock;
- minimal top-level controls;
- contextual controls for the selected orb or field.

The canvas remains the primary interface.

## Sound Orb document

Each orb stores:
- id;
- sound id;
- musical role;
- normalized x/y position;
- mute state;
- optional edited rhythm or melody pattern;
- optional Motion behavior.

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

ProceduralInstrument → EffectRack → spatial gain → StereoPannerNode → master audio graph

The shared PlaygroundEngine owns:
- MusicalTransport;
- LookaheadScheduler;
- one runtime channel per orb;
- synchronization with the serializable World;
- audio activity events for visual feedback.

Adding, removing, muting, moving, editing an orb, changing field geometry, or evaluating Motion updates the same runtime without creating another AudioContext.

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
- Motion — choose Still/Orbit/Bounce/Drift/Follow/Wander;
- Link — connect this sound to another using a fixed relationship;
- ✦ Magic — create a compatible live variation;
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

## Effect Fields

Phase 6 adds five visible regions:

- Space
- Echo
- Heat
- Frost
- Filter

A field can be dragged directly. Select it to reveal a corner resize handle and Delete action.

Effect depth is spatial: entering the edge starts subtly and moving toward the center strengthens the transformation.

The **Effects** button in the playground dock adds missing field types. A World supports at most one of each type in Phase 6.

Sound Orbs visually pick up their strongest active field treatment, while audio can combine multiple overlapping fields at once.

## Motion

Phase 7 adds simple contextual Motion to Sound Orbs.

Available behaviors:
- Still
- Orbit
- Bounce
- Drift
- Follow
- Wander

Motion also exposes:
- Speed — Slow / Medium / Fast
- Range — Tight / Medium / Wide

The saved Sound Orb position remains its anchor. Live animation positions are computed at runtime and are never written to World state every frame.

Manual dragging temporarily overrides Motion. Releasing the pointer moves the anchor and Motion resumes around it.

Follow uses another ordinary Sound Orb as a target and falls back safely if that target disappears.

## Playground toys

The dock now includes **Toys**.

Phase 7 toys:
- Spinner
- Magnet
- Repulsor
- Portal

Spinner rotates nearby live positions. Magnet pulls them inward. Repulsor pushes them outward. Portal maps IN-region positions near a separately movable OUT endpoint.

Toys affect live Motion geometry, so even a Still orb can react when it sits inside a toy's influence.

Toy effects then flow through the existing spatial/effect systems:
toy-adjusted live position → Effect Fields → SpatialVoice.

## Links

Phase 8 adds five visible one-way Sound Orb relationships:

- **Pulse Together** — target plays when source plays;
- **Take Turns** — pair alternates by bar;
- **Follow** — target answers one 16th later;
- **Kick Pushes Bass** — Beat/Percussion briefly pushes a Bass;
- **Copy Movement** — target mirrors source live movement around its own anchor.

This musical **Follow** is separate from Phase 7 Motion Follow.

Select an orb → **Link** → choose another sound → choose a relationship.

Invalid combinations remain visible but disabled with a plain-language explanation.

Links render as curved SVG relationships behind the Sound Orbs and follow:
- Motion;
- toy movement;
- manual drag previews.

Reactive Link lines pulse at actual audio-event time.

Clicking a Link selects it and exposes Delete.

Relationship rules are deliberately bounded:
- no self/duplicate Links;
- max eight Links;
- Pulse/Follow playback drivers cannot form chains;
- Take Turns stays isolated from conflicting reactive drivers;
- Kick Pushes Bass is Beat/Percussion → Bass only;
- Copy Movement stays one level deep.

## Magic

Phase 9 adds controlled seeded experimentation.

### Per-object Magic
Selected Sound Orbs, Effect Fields, and playground toys expose **✦ Magic**.

Magic immediately creates a live preview.

Sound Orb Magic can vary:
- same-role sound;
- pattern;
- Motion.

It preserves:
- id;
- role;
- position;
- mute state;
- Links.

Effect Field Magic keeps its field type and varies only bounded spatial geometry.

Toy Magic keeps its type and varies bounded placement/strength, including Portal OUT where relevant.

### Remix
The dock includes **✦ Remix**.

Intent choices:
- Surprise Me
- More Energy
- Calmer
- Stranger
- Simpler
- Busier

Remix changes a coherent subset of existing objects rather than adding/removing content.

### Strength
Magic preview exposes:
- Gentle
- Playful
- Wild

### Preview controls
Every preview exposes:
- Revert
- Retry
- Keep

Retry regenerates from the original base World rather than stacking mutations.

Keep leaves a one-step **Undo Magic** while no later material World edit has occurred.

The canvas is temporarily pointer-locked during preview so Revert/Retry cannot silently erase a manual edit made after the preview began.

Magic itself does not add a persistent schema field. Phase 10 later advances the World schema only for typed Snapshots.

## Worlds, persistence & history

Phase 10 makes every ordinary World locally durable.

### Your Worlds
Home now shows **Your Worlds** above the starter choices.

A saved World can:
- Open
- Rename
- Duplicate
- Backup
- move to Recently Deleted

Recently Deleted supports:
- Restore
- Delete permanently

Starter choices still create ordinary WorldDocument values; there is no separate starter-project format.

### Autosave
Material World edits save automatically to IndexedDB after a short debounce.

The playground shows:
- Local
- Saving…
- Saved
- Save failed

UI selections, open sheets and playback state do not trigger World saves.

Active Magic previews are not autosaved.

### Restore after refresh
If the user refreshes/restarts while a World is active, Loop restores that World but keeps playback stopped until the user presses Play.

Returning Home clears the active-World pointer, so Home remains the startup destination after a deliberate return.

### Undo / Redo
The playground top bar provides bounded session undo/redo.

Keyboard:
- Ctrl/Cmd + Z
- Ctrl/Cmd + Shift + Z
- Ctrl/Cmd + Y

Text-entry controls are not intercepted.

### Snapshots
The dock includes **Snapshots**.

A World can store up to eight playable Snapshots.

Snapshot actions:
- Save Snapshot
- Recall
- Rename
- Delete

When stopped, recall is immediate.

When playing, recall is queued to the next musical bar. A later material edit cancels the queued recall instead of letting it overwrite newer work.

Snapshots preserve the World identity/name and the Snapshot collection itself while recalling:
- music;
- Sound Orbs;
- Effect Fields;
- toys;
- Links.

### Backups
Home provides:
- Backup one World
- Backup All
- Import Backup

Imports migrate supported older Worlds and always create new local World ids instead of overwriting existing Worlds.

## World schema

World schema version 8 includes:
- full SoundOrbDocument objects with optional serializable pattern + Motion state;
- full EffectFieldDocument objects;
- full PlaygroundToyDocument objects;
- full LinkDocument objects;
- bounded typed SnapshotDocument objects.

## Current scope boundary

The playground currently includes:
- starter Worlds;
- Add/Change palette;
- spatial dragging;
- selection/mute/duplicate/delete;
- rhythm editing;
- scale-locked melody editing;
- density/groove/variation macros;
- Space/Echo/Heat/Frost/Filter Effect Fields;
- field drag/resize/delete;
- overlapping field processing;
- Still/Orbit/Bounce/Drift/Follow/Wander;
- Speed/Range Motion macros;
- Spinner/Magnet/Repulsor/Portal toys;
- Pulse Together/Take Turns/Follow/Kick Pushes Bass/Copy Movement Links;
- per-object ✦ Magic;
- global ✦ Remix with six intent choices;
- Gentle/Playful/Wild preview strength;
- Retry/Keep/Revert and one-step Undo Magic;
- IndexedDB World library/autosave/restore;
- Trash/recovery;
- eight Snapshots per World;
- bounded general undo/redo;
- versioned JSON backups/import.

It does not yet include:
- audio recording/export.

Those remain assigned to later roadmap phases.
