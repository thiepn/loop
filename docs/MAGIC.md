# Loop — Magic, Mutation & Controlled Randomness

## Status
Phase 9 implementation contract.

Magic is Loop's experimentation system.

It is designed to make "what if?" fast without turning the World into arbitrary noise.

Magic is:
- seeded;
- deterministic for the same input;
- role-aware;
- bounded;
- previewable;
- retryable;
- reversible;
- compatible with existing Links and World caps.

Magic is not an unrestricted randomizer.

## Product vocabulary

### Per-object Magic
Select a Sound Orb, Effect Field, or playground toy and choose **✦ Magic**.

The app immediately creates a live preview.

### Remix
The playground dock includes **✦ Remix**.

Remix changes a coherent subset of the current World rather than replacing it with unrelated content.

Available intent choices:
- Surprise Me
- More Energy
- Calmer
- Stranger
- Simpler
- Busier

### Strength
Every active Magic preview exposes:
- Gentle
- Playful
- Wild

Strength controls how many compatible dimensions may change and how far bounded geometry may move.

## Magic preview transaction

Magic uses transient app state rather than adding editor/session metadata to the World schema.

A Magic session stores:
- base World;
- target;
- intent;
- strength;
- attempt number;
- deterministic seed;
- human-readable summary.

The preview World becomes the live app World so audio, Motion, Effect Fields, Links, and visuals react immediately.

### Retry
Retry always generates from the original **base World**.

It does not stack mutations on top of the previous preview.

Attempt 0, 1, 2, ... produce different deterministic seeds.

### Strength changes
Changing Gentle / Playful / Wild also regenerates from the original base World using:
- the same target;
- same intent;
- same attempt;
- new strength.

### Revert
Revert restores the exact pre-Magic World object.

### Keep
Keep accepts the preview and ends the session.

The app then stores a one-step Magic undo pair:

before World ↔ kept World

### Undo Magic
Undo remains available while the current World is still the exact kept World.

Selection/UI-only changes keep Undo available.

Any later material World edit creates a new World object, so the Magic undo button automatically disappears rather than undoing unrelated later work.

This provides Phase 9-specific undo safety before the broader persistent undo/history work arrives.

## Preview interaction lock

While a Magic preview is active:
- the World keeps playing;
- Motion keeps moving;
- reactive Links keep firing;
- Effect Fields remain audible;
- the main canvas is pointer-locked.

This prevents hidden destructive sequences such as:

Magic preview → manually drag orb → Retry → manual drag silently disappears.

The user must first:
- Keep;
- Retry; or
- Revert.

## Deterministic seed

Magic seed is derived from:
- World musical seed;
- target identity;
- intent;
- strength;
- attempt number.

Date/time is not part of the mutation seed.

The same base World + target + intent + strength + attempt yields the same creative result.

The mutation operation may still receive a supplied `now` value for `updatedAt`; tests fix this value when comparing whole documents.

## Sound Orb Magic

Sound Orb Magic preserves:
- orb id;
- role;
- position;
- mute state;
- structural Links.

It can change:
- same-role sound identity;
- editable rhythm/melody pattern;
- Motion.

It never changes a Sound Orb to another musical role.

Examples:
- Bass remains Bass;
- Melody remains Melody;
- Beat remains Beat.

This is the main reason existing Phase 8 Link role constraints remain valid.

### Sound mutation
Sound choices come only from the current role.

Intent affects selection.

#### More Energy / Busier
Only accepts a candidate whose energy metadata is higher than the current sound.

If no higher-energy same-role sound exists, the sound remains unchanged.

#### Calmer / Simpler
Only accepts a candidate whose energy metadata is lower.

If no lower-energy same-role sound exists, the sound remains unchanged.

#### Stranger
Prefers the same-role sound with the largest combined energy/brightness distance.

#### Surprise Me
Selects a deterministic same-role alternative.

### Pattern mutation
If the role has an editable pattern:
1. start from the orb's effective current pattern;
2. apply deterministic variation;
3. apply intent-aware density when relevant.

Intent mapping:

- More Energy → Busy
- Busier → Busy
- Calmer → Sparse
- Simpler → Sparse
- Stranger → seeded Sparse/Balanced/Busy
- Surprise → seeded Sparse/Balanced/Busy

All melody values remain Phase 5 scale degrees, so Harmony continues to keep results in tune.

### Motion mutation
Gentle Magic generally keeps the current Motion mode and changes less.

Playful/Wild may change mode within a bounded intent pool.

Examples:

More Energy:
- Orbit
- Bounce
- Wander
- faster / wider

Calmer:
- Still
- Drift
- Slow / Tight

Stranger:
- Wander
- Bounce
- Follow
- Orbit
- Wide

Follow always chooses/keeps an actual Sound Orb target when one is available.

## Effect Field Magic

Effect Field Magic preserves:
- field id;
- field type.

It can change:
- normalized center position;
- radius.

Movement distance is bounded by strength.

Radius continues through Phase 6 clamping:
- minimum 0.10
- maximum 0.34

Intent can bias radius:
- More Energy / Busier / Stranger → generally larger;
- Calmer / Simpler → generally smaller;
- Surprise → signed seeded change.

No hidden DSP parameters are randomized.

The user still only sees/controls the physical field.

## Playground Toy Magic

Toy Magic preserves:
- toy id;
- toy type.

It can change:
- position;
- bounded strength;
- Portal OUT position where relevant.

Strength remains clamped by the Phase 7 toy contract.

Magic does not add/delete toys.

## Global Remix

Remix preserves the World's structure.

It does not:
- add Sound Orbs;
- delete Sound Orbs;
- add/remove Effect Fields;
- add/remove toys;
- add/remove Links;
- change Sound Orb roles.

It can mutate a seeded subset of:
- same-role Sound Orb sounds;
- patterns;
- Motion;
- Effect Field geometry;
- toy placement/strength;
- World tempo.

Mutation probability depends on strength:

- Gentle ≈ small subset
- Playful ≈ majority subset
- Wild ≈ nearly all eligible objects

The exact selections remain deterministic.

## Intent-aware tempo

Global Remix may shift BPM.

Bounds:
- minimum 72 BPM
- maximum 138 BPM

Approximate strength deltas:
- Gentle: ±3
- Playful: ±7
- Wild: ±12

Intent direction:
- More Energy / Busier → faster
- Calmer / Simpler → slower
- Stranger / Surprise → bounded seeded signed shift

The existing MusicalTransport handles the live BPM transition.

## Link safety

Magic deliberately does not rewrite Links in Phase 9.

Sound Orb roles remain stable, therefore role-dependent Link contracts remain valid.

Global Remix tests re-run the same public Phase 8 validation rules against retained Links.

No Magic operation creates:
- recursive Link chains;
- new routing;
- invalid Kick Pushes Bass roles;
- duplicate Links.

## Caps and structure

Magic respects all existing V1 structural caps by not creating structural objects.

Existing caps remain:
- 12 Sound Orbs
- 5 Effect Fields
- 4 toys
- 8 Links

## Performance

Magic is event-driven.

It adds:
- no permanent render loop;
- no background worker;
- no additional AudioContext;
- no new DSP graph.

A mutation produces a new immutable World document; existing app/world subscriptions update the normal runtimes.

Phase 7's Motion loop remains demand-driven.

## World schema

Phase 9 does **not** advance the World schema.

World schema remains version 7 because Magic is an operation over existing serializable structures.

Magic preview/session/undo metadata is transient application state and does not belong in saved Worlds.

## Scope boundary

Phase 9 does not add:
- persistent World history;
- full general undo/redo stack;
- saving/loading;
- Snapshots;
- AI-generated audio;
- text prompting;
- arbitrary randomness;
- random role changes;
- Link graph mutation;
- automatic content creation/deletion.

Persistent Worlds, Snapshots, and broader undo/history are Phase 10.

## Acceptance principle

Phase 9 succeeds when a beginner can:

1. select a Sound Orb and press ✦ Magic;
2. immediately hear a compatible variation;
3. choose Gentle / Playful / Wild;
4. Retry without mutation stacking;
5. Revert safely;
6. Keep a result they like;
7. Undo that kept Magic before another material World edit;
8. use Magic on fields/toys;
9. use Remix with a plain-language intent;
10. trust that Remix still sounds like a variation of the same World rather than unrelated chaos.
