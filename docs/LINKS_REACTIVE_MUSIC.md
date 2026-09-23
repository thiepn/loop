# Loop — Links & Reactive Music

## Status
Phase 8 implementation contract.

Links let Sound Orbs react to one another through a small set of understandable relationships.

They are intentionally **not**:
- CV cables;
- signal-routing wires;
- MIDI routing;
- logic nodes;
- an automation graph;
- a modular patch bay.

A Link is a visible, serializable, one-way relationship:

**source Sound Orb → target Sound Orb**

## Link model

Each Link stores:
- id;
- type;
- source Sound Orb id;
- target Sound Orb id.

Phase 8 supports at most **8 Links per World**.

Available Link types:

- Pulse Together
- Take Turns
- Follow
- Kick Pushes Bass
- Copy Movement

## Pulse Together

**Target plays whenever the source plays.**

Behavior:
1. target's ordinary base pattern is suppressed;
2. source continues using its own pattern;
3. when the source produces a base musical event, target receives one reactive event at the same actual audio time.

The source event time includes any Phase 5 groove offset.

A Pulse Together target cannot simultaneously be driven by another Pulse Together or Follow relationship.

## Take Turns

**Source and target alternate by bar.**

Phase 8 uses a deterministic simple rule:

- even-numbered bar → source base pattern active;
- odd-numbered bar → target base pattern active.

Take Turns does not rewrite either stored pattern.

A Sound Orb may belong to only one Take Turns pair.

Take Turns is also kept separate from Pulse/Follow playback-driver relationships for the same participant so the result remains understandable.

## Follow

Phase 8 musical Follow is distinct from the Phase 7 Motion preset named Follow.

### Phase 7 Motion Follow
One orb's **position** trails another orb.

### Phase 8 Link Follow
One orb's **musical event** answers another event.

Link Follow behavior:
1. target base pattern is suppressed;
2. source plays normally;
3. target responds exactly one 16th-note step after each source base event.

The delay is derived from the shared MusicalTransport:

one sixteenth = secondsPerBeat / 4

No separate timer/clock is introduced.

## Kick Pushes Bass

Kick Pushes Bass is available only when:

- source role = Beat or Percussion;
- target role = Bass.

When the source produces a base event:
- the bass receives a short bounded gain push/pump;
- the reactive gain is independent of the bass's spatial-presence gain;
- the Link line pulses;
- the bass visual briefly moves away from the source.

This is a playful sidechain-like relationship without exposing compression, threshold, ratio, attack, release, or routing terminology.

## Copy Movement

**Target mirrors the source's live movement delta around its own anchor.**

Example:

source anchor: (0.30, 0.30)
source live position: (0.35, 0.27)

source delta: (+0.05, -0.03)

target anchor: (0.70, 0.65)
target live position: (0.75, 0.62)

Copy Movement works after ordinary Phase 7 Motion/toy evaluation.

It therefore mirrors:
- Orbit;
- Bounce;
- Drift;
- Follow Motion;
- Wander;
- toy-driven movement.

It also previews during manual source dragging.

A static Copy Movement pair does not start the Motion requestAnimationFrame loop on its own.

## Relationship safety

Phase 8 deliberately prevents arbitrary reactive graphs.

### Self-links
A Sound Orb cannot Link to itself.

### Duplicate relationship
The same type/source/target Link cannot be added twice.

### Playback-driver targets
Pulse Together and Link Follow are playback-driver Links.

A target may have at most one incoming playback driver.

Playback-driver Links cannot form chains through another playback-driven Sound Orb.

This means:

A Pulse→B Follow→C

is rejected.

Reactive events never recursively trigger outgoing Links.

### Take Turns
A participant may belong to only one Take Turns pair.

Take Turns is kept separate from playback-driver relationships on the same participants.

### Copy Movement
A target may copy only one movement source.

Copy Movement stays one level deep.

Chains such as:

A copies B → C copies A

are rejected, and cycle detection remains as a defensive guard.

### Kick Pushes Bass
Only Beat/Percussion → Bass is valid.

### Texture targets
Pulse Together and Link Follow do not drive Texture targets in Phase 8.

## Two-pass audio scheduling

Reactive musical Links are integrated into the existing lookahead scheduler.

For every scheduled 16th tick:

### Pass 1 — base events
Loop evaluates each Sound Orb's normal pattern, applying:
- Pulse/Follow target suppression;
- Take Turns bar gating;
- mute state;
- Phase 5 groove.

Successful events record:
- orb id;
- actual scheduled AudioContext time;
- intensity.

### Pass 2 — reactive Links
Only those recorded base events can trigger:
- Pulse Together;
- Link Follow;
- Kick Pushes Bass.

Events produced in Pass 2 are **not** fed back into Pass 2.

This prevents recursive Link feedback while retaining precise audio scheduling.

## Accurate audio timing

Phase 8 changes OrbPattern scheduling to return:

- intensity;
- actual scheduled event time.

That event time includes groove.

Link reactions and visual pulses use that same time.

The visual relationship therefore reacts when the event is actually heard, not when the scheduler happened to queue it.

## Reactive target notes

When Pulse/Follow triggers a melodic target, Loop does not expose note selection.

It derives a safe scale degree from the target's current pattern:

1. exact step degree if one exists;
2. nearest active target degree;
3. fallback degree 0.

Harmony then maps that degree through the current World scale.

Reactive target events therefore remain compatible with the existing musical context.

# Visible Link layer

Links appear as curved lightweight lines between Sound Orbs.

The SVG Link layer lives:
- above Effect Fields;
- below playground toys and Sound Orbs.

Each relationship has its own visual identity.

### Pulse Together
Purple continuous relationship.

### Take Turns
Amber dashed relationship.

### Follow
Green dotted/trailing relationship.

### Kick Pushes Bass
Rose relationship with stronger transient pulse.

### Copy Movement
Blue patterned relationship.

Lines follow:
- saved positions;
- Phase 7 Motion;
- toy-driven movement;
- manual drag previews.

## Link activity

When a reactive relationship fires:
- Link line pulses at the scheduled audio time;
- reactive target Sound Orb receives its normal audio-reactive pulse;
- Kick Pushes Bass additionally pushes the target visual away from the source.

Take Turns pulses the relationship whenever the currently active member produces a base event.

Copy Movement is continuously visible rather than event-pulsed.

# Link editor

Select a Sound Orb and choose **Link**.

Flow:

1. choose another Sound Orb by human-readable sound name;
2. choose a relationship;
3. invalid relationships remain visible but disabled with a short explanation.

Examples of disabled explanations:
- target already driven by another Link;
- one of these sounds already Takes Turns elsewhere;
- Copy Movement stays one level deep;
- these sound roles do not fit this Link;
- World already has eight Links.

There is no source/target port vocabulary.

## Link selection/deletion

Click/tap a Link curve to select it.

The contextual panel shows:
- relationship name;
- Source → Target using friendly sound names;
- Delete.

Keyboard-focused Link hit paths support:
- Enter / Space to select;
- Delete / Backspace to remove.

# Lifecycle

## Delete Sound Orb
Deleting a Sound Orb removes every Link touching it.

No dangling Link ids remain.

## Change Sound
Changing the sound preserves Links that remain semantically valid.

Example:

Kick Pushes Bass
Beat → Bass

If Bass is changed to Melody:
- Kick Pushes Bass is removed;
- an unrelated Copy Movement Link can remain.

## Duplicate Sound Orb
Duplicate copies:
- sound;
- pattern;
- Motion;

but does **not** copy external Links.

This avoids unexpectedly rewiring the World.

# Motion integration

Runtime position order is now:

saved Sound Orb anchors
→ Phase 7 independent Motion
→ Phase 7 Motion Follow
→ playground toys
→ Phase 8 Copy Movement
→ live position
→ Effect Fields
→ SpatialVoice

Copy Movement does not alter saved anchors.

During manual dragging, the source and copied target update in the same transient preview path.

# Starter Worlds

Every non-empty starter demonstrates exactly one restrained Phase 8 relationship:

- Beat → Kick Pushes Bass
- Chill → Copy Movement
- Dreamy → Pulse Together
- Dance → Take Turns
- Weird → Link Follow

Empty has no Links.

Starter relationships are ordinary LinkDocument values and pass the same validation rules as user-created Links.

# World schema

World schema version 7 replaces the old placeholder Link string array with:

`readonly LinkDocument[]`

Links are now fully serializable and ready for:
- persistence;
- Snapshots;
- future Magic mutation.

# Performance

Phase 8 adds no new permanent animation loop.

- event Links run inside the existing audio lookahead scheduler;
- visual Link pulses use event-aligned short animations;
- Link geometry updates through the existing Motion loop when Motion/toys are active;
- static Link lines require no continuous rendering;
- static Copy Movement does not activate Motion frames.

Maximum V1 complexity remains bounded:
- 12 Sound Orbs;
- 5 Effect Fields;
- 4 toys;
- 8 Links.

# Scope boundary

Phase 8 does not add:
- CV values;
- modular ports;
- arbitrary Link graphs;
- user-defined logic;
- recursive event feedback;
- signal/audio routing;
- MIDI routing;
- conditional expressions;
- automation lanes;
- Phase 9 Magic.

## Acceptance principle

Phase 8 succeeds when a beginner can:

1. select a Sound Orb;
2. choose Link;
3. choose another sound by name;
4. understand the five relationship choices from their labels/descriptions;
5. see a clear connection appear;
6. hear Pulse Together / Take Turns / Follow / Kick Pushes Bass change the music;
7. see Copy Movement affect motion;
8. watch the Link react in time with the sound;
9. delete the relationship without encountering routing or modular-synth terminology.
