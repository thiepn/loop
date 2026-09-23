# Loop — Interaction Specification

## Goal
Loop should teach itself through direct manipulation. The user should learn the product by touching the musical world, not by reading a manual.

## Interaction hierarchy
The preferred interaction order is:
1. direct physical manipulation;
2. contextual action;
3. simple macro control;
4. advanced control only when necessary.

Do not expose technical parameter panels as the default interaction model.

## Core canvas

### Listener / center
The center represents the listener or focal point of the World.

Sound Orb position influences the sound:
- closer generally means more present;
- farther generally means less present / more spacious;
- horizontal position influences stereo position.

These mappings must be smooth, safe, and immediately audible.

## Sound Orbs

### Primary gestures
- Tap: select the orb.
- Tap mute affordance or contextual action: mute/unmute.
- Drag: move through the World.
- Double-tap/click: open lightweight edit controls.
- Long press/right click: open contextual actions.
- Drag into Effect Field: continuously transform the sound.
- Drag onto another compatible orb: offer Link actions.

### Context menu
Contextual actions may include:
- Change sound
- Edit pattern
- Motion
- Link
- Magic
- Duplicate
- Mute
- Delete

Avoid exposing long technical lists.

## Add flow

### First level
+ Add Something

Categories:
- Beat
- Bass
- Melody
- Texture
- Voice
- Surprise Me

### Second level
Use human descriptions rather than filenames.

Examples for Beat:
- Punchy
- Soft
- Bouncy
- Broken
- Busy
- Surprise Me

Sound metadata and filenames remain internal.

## Pattern interaction

### Rhythm
Represent beats as an obvious row/grid of steps.
Example:
● · · · ● · · · ● · · · ● · · ·

Required interactions:
- tap to toggle;
- drag to paint;
- erase;
- clear;
- Magic variation;
- density control;
- optional simple swing/groove choice.

### Melody
Use a scale-locked visual grid rather than a traditional piano roll.

Requirements:
- notes always remain compatible with the World's harmonic rules;
- users can paint/erase notes;
- vertical position can represent relative pitch without requiring note names;
- Magic can create compatible variations;
- optional advanced labels must not be required.

## Effect Fields

### General behavior
Effect amount is derived primarily from spatial overlap/depth.

The user should hear and see a continuous change while moving an orb into or out of a field.

### V1 fields
- Space — ambience/reverb
- Echo — delay/repetition
- Heat — saturation/distortion
- Frost — freeze/granular fragmentation
- Filter — dark-to-bright spectral change

Each field needs a distinct visual identity and sound behavior.

## Motion

### Presets
- Still
- Orbit
- Bounce
- Drift
- Follow
- Wander

### Controls
Normal users should see at most:
- Speed
- Range
- optional Direction where useful

Motion must interact with fields. A moving orb passing through an Effect Field should create evolving sound automatically.

## Links

### Creation
Drag one Sound Orb onto another or choose Link from the contextual menu.

### V1 relationships
- Pulse Together
- Take Turns
- Follow
- Kick Pushes Bass
- Copy Movement
- Surprise Me

The implementation may use envelope following, gating, shared timing, or sidechain-like processing internally, but the UI must describe the musical behavior rather than the DSP mechanism.

## Magic

### Per-object Magic
Magic changes the selected object while preserving its identity and musical compatibility.

Examples:
- rhythm variation;
- alternate compatible sample;
- melody variation;
- motion variation;
- effect variation.

### Global Magic / Remix
Produces a coherent variation of the current World rather than replacing it with unrelated content.

Optional intent controls:
- More energy
- Calmer
- Stranger
- Simpler
- Busier

All Magic operations must be undoable.

## Snapshots
Snapshots save the current playable state of a World.

Examples:
- Calm
- Groove
- Chaos

Snapshot switching should quantize to a musically safe boundary where practical.

Snapshots are not a linear song timeline.

## Recording
Recording is intentionally simple:
- one Record action;
- capture the master performance;
- allow the user to move objects, trigger Magic, and switch Snapshots while recording;
- stop and export.

## Onboarding
Maximum initial onboarding:
1. Move this sound.
2. Drop it here.
3. Add something.

Then remove tutorial overlays and allow exploration.

## Input support
The same interaction model must work across:
- mouse;
- touch;
- stylus where available;
- keyboard for essential actions and accessibility.

Pointer cancellation, drag outside viewport, multi-touch interference, and accidental browser gestures must be handled deliberately.

## Undo expectation
Actions that materially change a World should normally be undoable:
- move orb;
- add/delete;
- pattern edit;
- Magic;
- Motion change;
- Link creation/removal;
- field creation/movement;
- Snapshot-affecting edits.

## Interaction quality gates
A feature fails interaction review if:
- it requires audio terminology to understand;
- it requires a tutorial longer than a short contextual hint;
- the user cannot predict the broad consequence of manipulating it;
- its visual state and audible state disagree;
- it introduces hidden destructive behavior;
- it makes the canvas feel like a conventional studio UI.
