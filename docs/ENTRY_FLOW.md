# Loop — Zero-Friction Entry Flow

## Status
Phase 4 implementation contract.

Phase 4 converts Loop from a fixed playground demo into an app that a first-time user can enter, understand, and change without music-production knowledge.

## Home

Loop opens on a simple starter screen rather than directly dropping users into a technical workspace.

Available starting directions:
- Beat — punchy and simple;
- Chill — soft and laid-back;
- Dreamy — floating and gentle;
- Dance — bright and energetic;
- Weird — unusual but still musical;
- Empty — start with silence;
- Surprise Me — chooses a non-empty starter direction.

The labels describe feel rather than music theory.

## Immediate playback

Choosing any non-empty starter World is itself the browser user gesture used to initialize Web Audio.

The flow is:

starter click → World created → playground mounted → AudioContext initialized/resumed → World begins playing

There is no extra setup screen between choosing a starter and hearing it.

Empty intentionally stays silent and points the user toward Add.

## Starter World factory

Starter Worlds are ordinary WorldDocument objects.

Each starter defines:
- name;
- BPM;
- hidden harmonic context;
- deterministic seed;
- initial Sound Orbs;
- spatial positions.

They do not create a parallel preset/project architecture.

## Sound palette

The playground has one prominent **Add** action.

The top-level categories are:

- Beat
- Bass
- Chords
- Melody
- Texture
- Voice

Beat intentionally groups beat/percussion roles together because that distinction is not useful to a beginner at selection time.

Every sound presents:
- friendly name;
- short descriptive phrase;
- role-colored visual preview.

Technical IDs, filenames, MIDI data, root notes, and synthesis parameters stay hidden.

## Expanded built-in palette

Phase 4 expands the procedural catalog to include alternatives such as:

- Round Kick
- Punch Kick
- Soft Clap
- Glass Hats
- Dust Shaker
- Warm Bass
- Deep Bass
- Dream Chords
- Glow Chords
- Soft Pluck
- Tiny Bell
- Air
- Haze
- Soft Hum

The purpose is not a large sample library. It is enough variety for Add and Change to feel meaningful before later content expansion.

## Pattern identity

Sound timbre and musical pattern are now separate metadata concepts.

For example:
- Round Kick and Punch Kick can share the same simple kick pattern;
- Warm Bass and Deep Bass can share the same scale-aware bass behavior;
- Dream Chords and Glow Chords can share the same harmony behavior.

This allows a beginner to use **Change** without breaking the musical role of the selected object.

Editable patterns remain Phase 5.

## Add

Choosing a sound from the palette:
1. creates a Sound Orb;
2. assigns a safe suggested position;
3. inserts it into the current World;
4. selects the new orb;
5. adds a live audio runtime automatically;
6. starts playback if the World was previously silent.

The existing 12-orb cap remains enforced.

## Change

Selecting an orb exposes **Change**.

Change:
- opens the same human-readable sound palette;
- starts on the category matching the current role;
- preserves orb id, position, and mute state;
- changes sound identity and role;
- keeps the shared transport running.

There is no plugin browser or file chooser.

## Surprise Me

There are two deliberately small Phase 4 surprise behaviors.

### Home
Surprise Me chooses one of the non-empty starter Worlds deterministically from the supplied seed.

### Sound palette
Surprise Me chooses an unused built-in sound when possible.

This is lightweight convenience, not the later Phase 9 Magic/mutation system.

## Onboarding

First-session onboarding is contextual and bounded.

### Step 1
**Drag any sound**

The user learns that the main objects are movable.

### Step 2
**Bring it closer to YOU**

The listener center becomes visually emphasized.

This teaches that distance has audible meaning.

### Step 3
**Add something new**

The Add control becomes emphasized.

Choosing a new sound completes onboarding.

A Skip action is always available.

After completion within the current app session, switching to another starter World does not repeat the onboarding.

Persistent onboarding preferences are intentionally deferred with the broader persistence work.

## Navigation

The Loop brand in the playground returns to the starter Home.

Returning Home:
- stops the current playground runtime;
- clears scheduled visual activity;
- keeps the browser audio engine available;
- does not introduce account/project navigation.

## Scope boundary

Phase 4 does not add:
- editable rhythms;
- melody editor;
- Effects Fields;
- Motion;
- Links;
- Magic mutation;
- persistent World library;
- recording/export.

Those remain assigned to their roadmap phases.

## Acceptance principle

A new user should now be able to:

1. open Loop;
2. pick a vibe;
3. hear it without another setup step;
4. move a sound;
5. understand that the center matters;
6. add a sound from plain-language choices;
7. change an existing sound;
8. return Home and try a different starting point.

At no point should the user need to understand a DAW, scale, MIDI, synthesis, routing, or sample filenames.
