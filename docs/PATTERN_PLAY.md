# Loop — Playful Beat & Melody Creation

## Status
Phase 5 implementation contract.

Phase 5 lets users deliberately change what an orb plays without turning Loop into a conventional sequencer or music-production workstation.

## Product goal

A beginner should be able to select a sound, press **Shape**, touch a few cells, and immediately hear a different groove or melody.

The user does not need to understand:
- notation;
- MIDI;
- note names;
- scale construction;
- swing percentages;
- velocity;
- automation.

## Pattern model

Patterns belong to Sound Orbs.

There are only two editable pattern shapes in Phase 5:

### Rhythm
- 16 boolean steps;
- one bar;
- friendly groove feel;
- deterministic variation counter.

### Melody
- 16 time steps;
- at most one scale degree per step;
- seven visible vertical pitch levels;
- friendly groove feel;
- deterministic variation counter.

Texture orbs do not expose a Phase 5 pattern editor.

## Defaults and materialization

Every editable built-in sound has a safe default pattern.

If the user never edits an orb, that default can remain implicit.

The first user edit materializes the effective pattern into the orb document.

This keeps starter Worlds compact while making creative edits serializable.

## Rhythm editor

The rhythm editor is a single row of 16 large cells.

Interaction:
- tap an empty step to turn it on;
- tap an active step to erase it;
- drag across steps to paint;
- begin on an active step and drag to erase.

Quarter-beat boundaries are visually stronger, but no bar/beat terminology is required to use the row.

## Melody editor

The melody editor is a 7×16 shape grid.

Vertical direction communicates only:
- higher;
- lower.

The UI does not show piano keys or note names.

Each painted cell stores a **scale degree**, not an absolute MIDI note.

At playback time, the World’s hidden harmony context converts the degree to a valid pitch.

This ensures user-painted shapes stay in tune with the current World.

## Density

The **Amount** control has three labels:

- Sparse
- Balanced
- Busy

These labels regenerate a bounded number of active events while keeping the result in the same pattern type.

The user never sees event counts or percentages.

## Groove

The **Feel** control has three labels:

- Straight
- Bounce
- Loose

Internally, groove applies small bounded timing delays to offbeat 16th-note events.

Important constraints:
- there is still one shared MusicalTransport;
- groove does not create another clock;
- downbeats are not delayed;
- offsets remain smaller than the step duration.

## Try another

**Try another** is a small Phase 5 pattern variation control.

It:
- uses deterministic seeded transforms;
- preserves the broad density level;
- increments a serializable variation counter;
- changes scale degrees only within the visible legal range;
- keeps rhythm variations grounded;
- protects the downbeat anchor when present.

This is not Phase 9 Magic.

It changes only the selected orb’s pattern.

## Clear

Clear removes active rhythm hits or melody notes while preserving the Sound Orb itself.

The user can immediately paint a new pattern from silence.

## Live playback

Pattern editing does not restart the World.

The PlaygroundEngine already reads the current World on each scheduled tick.

When pattern state changes:
1. app state updates;
2. PlaygroundEngine receives the new World;
3. future lookahead ticks use the new pattern;
4. already-scheduled events in the very short lookahead window may still finish.

No separate sequencer transport exists.

## Sound replacement compatibility

A custom pattern is preserved when Change keeps the same broad pattern kind:

- rhythm → rhythm: preserve;
- melody → melody: preserve.

An incompatible Change resets pattern state:

- rhythm → melody;
- melody → rhythm;
- editable → texture.

The new sound then falls back to its own safe default.

## Duplication

Duplicating an orb copies its explicit edited pattern.

This makes duplication feel like copying the musical idea, not merely the sound color.

## UI boundary

Pattern creation remains contextual.

The permanent playground surface still shows:
- canvas;
- orbs;
- Add;
- Play;
- selected-orb controls.

The 16-step or melody grid appears only after the user selects an editable orb and chooses **Shape**.

There is no:
- permanent sequencer panel;
- track list;
- piano keyboard;
- arrangement timeline;
- clip launcher;
- automation lane.

## Acceptance principle

Phase 5 succeeds when a non-musician can:
1. select a kick or percussion orb;
2. press Shape;
3. tap/paint a recognizable new rhythm;
4. choose Sparse/Busy or Bounce and hear the result;
5. select a melody/bass/chord orb;
6. paint a visual melody shape;
7. hear only compatible notes;
8. press Try another for a safe variation;
9. close the sheet and return immediately to the visual playground.
