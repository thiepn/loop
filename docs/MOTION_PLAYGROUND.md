# Loop — Motion Playground

## Status
Phase 7 implementation contract.

Motion makes the World feel alive without introducing automation lanes, keyframes, curves, or a physics editor.

The saved World stores:
- each Sound Orb's anchor position;
- optional simple Motion behavior;
- optional playground toys.

Live positions are computed at runtime and are not written back every animation frame.

## Motion model

A Sound Orb may store:

- mode;
- Speed;
- Range;
- deterministic seed;
- optional Follow target.

If no Motion document exists, the orb is **Still**.

### Still
The Sound Orb remains at its saved anchor.

### Orbit
The orb circles around its saved anchor.

### Bounce
The orb moves back and forth through a bounded two-axis path.

### Drift
The orb moves through a slow smooth floating path.

### Follow
The orb moves toward another Sound Orb while retaining its own anchor and a small trailing offset.

If the selected target disappears, runtime evaluation falls back to the nearest remaining Sound Orb.

### Wander
The orb follows a deterministic multi-wave path that feels less repetitive than a simple orbit while remaining bounded.

## Speed

User-facing choices:
- Slow
- Medium
- Fast

Speed maps to bounded internal motion frequencies.

Changing Speed while Still does nothing. The user must explicitly choose a moving behavior first.

## Range

User-facing choices:
- Tight
- Medium
- Wide

Range maps to bounded normalized travel distance around the saved anchor.

Changing Range while Still also does nothing.

## Saved anchor vs live position

The Sound Orb document's `position` remains the user's anchor.

For example:

anchor = (0.50, 0.40)
motion = Orbit / Medium / Tight

The runtime may currently render the Sound Orb at (0.55, 0.43), but the World document still stores (0.50, 0.40).

This prevents:
- persistence churn;
- undo history pollution;
- constant serialization;
- animation-frame writes into app state.

If the user manually drags a moving orb, pointer position temporarily overrides Motion. At gesture end:
1. the dragged position becomes the new saved anchor;
2. the override is released;
3. Motion resumes around the new anchor.

## Runtime evaluation

Phase 7 uses one demand-driven animation loop in the app layer.

The loop runs only when:
- the playground contains at least one Sound Orb; and
- at least one orb has active Motion or a playground toy exists.

A World with no moving sounds and no toys has no Motion frame loop.

A World with toys but zero Sound Orbs also does not run an empty loop.

## Determinism

Orbit, Bounce, Drift, Wander, and Follow use:
- saved anchor;
- saved Motion settings;
- per-orb seed;
- runtime elapsed time.

For the same World state and same elapsed time, the computed position is reproducible.

Motion is creative deterministic animation, not physical simulation.

## Follow evaluation

Motion uses two passes:

1. evaluate all independent Motion types;
2. evaluate Follow orbs using the target's already-computed position.

This avoids recursive dependency chains.

If a Follow target is itself following another sound, Phase 7 deliberately does not recursively solve an arbitrary graph. It uses the target's available independent/base position.

Complex inter-orb behavioral relationships remain Phase 8 Link scope.

# Playground toys

Toys are serializable World objects that transform live Sound Orb positions.

V1 Phase 7 supports four toys:
- Spinner;
- Magnet;
- Repulsor;
- Portal.

The World cap is four toys and the UI allows one of each type.

## Spinner

Spinner rotates a nearby live Sound Orb position around the toy center.

Depth inside the Spinner controls how strongly the rotational influence applies.

The saved Sound Orb anchor does not rotate.

## Magnet

Magnet pulls nearby live positions toward its center.

Pull strength rises with spatial depth.

## Repulsor

Repulsor pushes nearby live positions away from its center.

A deterministic fallback direction is used if a Sound Orb sits exactly at the center, avoiding undefined direction.

## Portal

Portal contains:
- an IN position/radius;
- a separate OUT position.

When a live Sound Orb enters the IN region, its live position maps near the OUT position while preserving part of its local offset.

The saved Sound Orb anchor is not teleported.

Users can drag IN and OUT independently.

## Toy order

When toy regions overlap, runtime transformations use a fixed order:

1. Spinner
2. Magnet
3. Repulsor
4. Portal

A fixed order keeps the result deterministic and avoids dependence on the order toys happened to be added.

## Toy previews

Dragging a toy does not write World state every frame.

The runtime maintains a transient preview override:
- toy visual moves immediately;
- live Sound Orb positions react immediately;
- audio spatial position reacts immediately;
- Effect Field depth reacts immediately;
- only pointer release commits the toy's final position.

Portal OUT uses the same preview/commit model.

# Motion + audio

The same live position drives:

- stereo pan;
- listener-distance presence;
- Effect Field overlap/depth.

There is no separate visual-only Motion path.

Runtime flow:

saved World anchor
→ Motion preset
→ playground toys
→ live position
→ Effect Fields
→ SpatialVoice

This means an orbiting orb can naturally move in and out of Echo, Frost, Heat, Space, or Filter.

## Manual drag precedence

While the user drags a moving orb:

manual pointer override
→ Effect Fields
→ SpatialVoice

Motion resumes only after the gesture commits.

This prevents the animation system from fighting the pointer.

# Cross-phase preview correctness

Phase 7 keeps Phase 6 field previews active during Motion frames.

A moving orb therefore continues to react to the field's temporary dragged/resized geometry before that field is committed.

Toy previews follow the same transient-state pattern.

# UI

## Motion sheet

Select a Sound Orb and choose **Motion**.

The sheet exposes:
- Still
- Orbit
- Bounce
- Drift
- Follow
- Wander

plus:
- Speed: Slow / Medium / Fast
- Range: Tight / Medium / Wide

Follow additionally shows ordinary sound names as possible targets.

No coordinates, velocities, paths, keyframes, or easing curves are exposed.

## Toys

The playground dock includes **Toys**.

Toy palette:
- Spinner — Makes nearby sounds circle
- Magnet — Pulls sounds toward it
- Repulsor — Pushes sounds away
- Portal — Sends sounds somewhere else

Toys are directly draggable on the canvas.

Portal OUT is directly draggable as a separate endpoint.

## Visuals

Moving orbs receive restrained motion-path hints.

Toys have distinct visual identities:
- Spinner — rotating dashed ring
- Magnet — green attraction marker
- Repulsor — rose radial burst
- Portal IN — cyan ring
- Portal OUT — pink ring

These visuals remain lightweight DOM/CSS. The deeper game-feel pass remains Phase 12.

# Starter Worlds

Phase 7 adds restrained Motion to non-empty starter Worlds so the canvas feels alive immediately without becoming chaotic.

Examples:
- Beat — slow chord drift
- Chill — slow texture drift
- Dreamy — gentle melody orbit
- Dance — hat bounce
- Weird — texture wander + Spinner

Empty remains free of motion/toys.

# World schema

World schema version 6 adds:
- optional MotionDocument on SoundOrbDocument;
- serializable PlaygroundToyDocument[].

Effect Fields remain schema-backed from Phase 6.

Links and Snapshots remain future systems.

# Performance

Phase 7 adds one requestAnimationFrame loop only while needed.

It does not:
- serialize live positions;
- dispatch app-state changes per frame;
- rebuild audio graphs;
- run a physics engine;
- create per-orb timers.

Each frame evaluates at most the bounded V1 set:
- 12 Sound Orbs;
- 4 toys;
- 5 Effect Fields.

# Scope boundary

Phase 7 does not add:
- keyframe automation;
- spline/path editors;
- arbitrary physics bodies;
- collision simulation;
- Doppler simulation;
- inter-orb trigger relationships;
- Phase 8 Links;
- global Magic.

Follow in Phase 7 is specifically a movement preset, not a general dependency/link system.

## Acceptance principle

Phase 7 succeeds when a user can:
1. select a sound;
2. make it Orbit, Bounce, Drift, Follow, or Wander;
3. understand Slow/Medium/Fast and Tight/Medium/Wide immediately;
4. watch and hear the sound move;
5. watch it pass through Effect Fields and hear those effects evolve;
6. manually grab it and move its anchor without fighting the animation;
7. add a Spinner, Magnet, Repulsor, or Portal;
8. move the toy and see/hear nearby sounds react immediately;
9. understand the behavior without seeing an automation curve or physics parameter.
