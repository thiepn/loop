# Loop — Visual V2 Magic, Portal, Snapshot & State Transitions

## Status

Phase 11 implementation is present on the Visual V2 track.

## Goal

Phase 11 gives major state changes visual continuity without delaying or replacing the real state commit.

The rule is:

```
creative state commits immediately
           +
renderer receives a bounded before/after snapshot
           ↓
short deterministic transition
```

No transition owns application state.

## Unified transition payload

Visual V2 now uses one renderer-only `StateTransitionPayload`.

It contains only:

- transition kind;
- cancellation key;
- visual priority;
- deterministic seed;
- bounded intensity;
- transition origin;
- up to 18 lightweight object nodes.

Each node contains:

- object id;
- object kind;
- previous position or null;
- next position or null;
- RGB material identity;
- approximate visual radius.

Whole `WorldDocument` objects are never placed into the transient render queue.

## Supported transitions

- Magic;
- Magic revert;
- Snapshot recall;
- undo;
- redo;
- object delete;
- Portal transfer.

Existing Link create/delete choreography from Phase 9 remains separate because it already carries precise Link path geometry.

## Magic transformation

Starting a Magic preview captures current → mutated visual state before the App commits the new World.

### Targeted Magic

Orb/Field/toy Magic only emphasizes the target node.

### World Remix

World Magic may include the full bounded object set.

The transition uses the real Magic mutation seed, so the visual identity is deterministic for that mutation result.

Visual treatment includes:

- World-scale transformation wave;
- local material light;
- position morph beams when geometry changes;
- actual mutated object appearing immediately underneath the transition.

## Remix retry / strength

Retry and strength changes commit the new preview World immediately.

A new Magic transition replaces the previous World transition through the event priority/cancellation system.

Rapid retry therefore does not accumulate stale cinematic work.

## Magic revert

Revert uses current preview → base World.

The same target focus and Magic seed are retained.

Revert adds a reconstruction cue rather than treating the return as a new random mutation.

## Magic undo

Undo Last Magic uses the generic reconstruction transition around the existing history logic.

History remains authoritative.

## Snapshot morph

Snapshot recall already commits either immediately or at the existing bar-quantized recall time.

At the exact recall commit, Visual V2 captures current → recalled World.

Snapshot morph includes continuity nodes for:

- Sound Orbs;
- Effect Fields;
- toys;
- Links.

This allows the recalled scene to appear immediately while the old spatial arrangement leaves a short visual memory.

Snapshot scheduling itself is unchanged.

## Undo / redo reconstruction

Normal undo and redo now create a bounded reconstruction transition.

Nodes are retained even when position is unchanged because many valid edits change:

- sound material;
- pattern;
- motion;
- Field/t oy state;
- relationship state

without moving the object.

Undo/redo still execute synchronously through `WorldHistory`.

## Delete dissolution

Orb, Field and toy deletion capture only the removed target.

The target disappears from real creative state immediately.

The renderer keeps a short local light/dissolve trace at its former position.

Deleting an Orb may also remove Links through existing World logic; those state changes remain correct even though the delete transition focuses on the removed object.

## Portal transfer

Portal transport remains owned entirely by `MotionEngine`.

`WorldRendererView` compares consecutive final rendered Orb positions.

A Portal transition is emitted only when:

- displacement is large enough to be a discontinuity;
- the previous point is spatially consistent with a Portal input;
- the new point is spatially consistent with that Portal's exit.

The transition uses:

- entry position;
- exit position;
- stable Portal+Orb seed;
- cyan Portal material;
- bounded jump intensity.

Manual Orb dragging does not generate automatic Portal cinematic events while the pointer is actively grabbing the Orb.

## Portal presentation

Normal motion:

```
● ─────→
```

Portal transfer:

```
● → compression / entry light
        ═════ transit beam ═════
                         exit light → ●
```

The real Orb is already at the MotionEngine output position.

The transition is visual memory, not interpolation of creative position.

## Deterministic seeds

Magic uses its real mutation seed.

Portal uses a stable hash of Portal id + Orb id.

Other transition kinds use stable world/kind identity unless an explicit seed is supplied.

No `Math.random()` is used by the transition model.

## Transition priority

World-level cinematic transitions have priority:

1. Magic / Magic revert;
2. Snapshot;
3. undo / redo;
4. delete;
5. Portal.

A new World transition removes queued lower-priority state transitions.

Same-key transitions always replace their previous instance.

Examples:

- Magic Retry replaces prior Magic animation;
- repeated Portal transfers for one Orb coalesce;
- a Snapshot recall cancels lower-priority Portal clutter;
- deletion of two different objects may coexist briefly.

## Render frame

`deriveTransitionFrame()` produces:

- capped morph beams;
- capped local lights;
- World transition energy;
- World wave phase;
- dissolve amount;
- reconstruction amount.

High quality caps:

- 12 beams;
- 12 lights.

Balanced/Battery use smaller caps.

## Shared renderer infrastructure

Phase 11 does not add a new large shader stack.

Transition beams reuse the Phase 8 cross-system bridge renderer.

Transition lights reuse Phase 9 local illumination.

World cinematic waves reuse the existing procedural environment shader.

This keeps bundle/performance growth bounded.

## Field / toy / Link continuity

Full World/Snapshot/history transitions capture nodes for:

- Orbs;
- Fields;
- toys;
- Link midpoints.

Their actual Phase 4–9 materials remain rendered from the new state.

Transition lights/beams provide continuity across the state boundary instead of maintaining duplicate old object trees.

## Reduced Motion

Reduce Motion:

- removes travel/morph beams;
- stops Portal transit travel;
- uses the destination/current state immediately;
- retains local transition light;
- retains static World transition cue;
- retains dissolve/reconstruction state feedback.

Meaning remains without spatial travel.

## Interruption safety

Transition events never gate state changes.

If the user:

- retries Magic;
- reverts;
- recalls another Snapshot;
- undoes;
- moves through a Portal again

the event bridge applies deterministic replacement/coalescing and the latest real World state remains authoritative.

## State boundary

Phase 11 transitions do not:

- change World schema;
- delay state commits;
- change history;
- change autosave;
- change Portal physics;
- alter Snapshot quantization;
- alter Magic mutation;
- alter audio scheduling;
- persist transition data.

## Phase 12 handoff

Phase 12 — Home, Library, Branding & Application Surfaces can use the same transition infrastructure for World-open/close continuity while remaining separate from in-World creative state transitions.
