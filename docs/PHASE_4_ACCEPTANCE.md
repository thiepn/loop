# Phase 4 — Zero-Friction Home, Sound Palette & Onboarding Acceptance

## Home
- [x] Loop opens on a dedicated starter Home.
- [x] Beat starter exists.
- [x] Chill starter exists.
- [x] Dreamy starter exists.
- [x] Dance starter exists.
- [x] Weird starter exists.
- [x] Empty starter exists.
- [x] Surprise Me exists.
- [x] Starter labels use mood/feel language rather than theory.
- [x] Non-empty starters contain at least five valid built-in Sound Orbs.
- [x] Empty intentionally contains no Sound Orbs.

## Immediate entry
- [x] Selecting a non-empty starter transitions directly to the playground.
- [x] The starter click is used to initialize/resume Web Audio.
- [x] Non-empty starter playback starts automatically when browser permission allows it.
- [x] Empty directs the user toward Add rather than showing an error.
- [x] Returning Home tears down the current PlaygroundEngine cleanly.

## Palette
- [x] Persistent Add control exists on the playground.
- [x] Categories are Beat, Bass, Chords, Melody, Texture, and Voice.
- [x] Beat groups beat/percussion choices for beginner simplicity.
- [x] Sound cards use friendly names.
- [x] Sound cards use short descriptions.
- [x] Technical sound ids and synthesis controls remain hidden.
- [x] Palette is responsive on mobile.
- [x] Clicking outside the sheet can close it.
- [x] Explicit close control exists.

## Sound variety
- [x] Alternate kick exists.
- [x] Multiple percussion choices exist.
- [x] Multiple bass choices exist.
- [x] Multiple chord choices exist.
- [x] Multiple melody choices exist.
- [x] Multiple texture choices exist.
- [x] Voice category has a usable built-in choice.
- [x] Catalog remains fully procedural/copyright-free.

## Add / Change
- [x] Add creates a real Sound Orb.
- [x] Add chooses bounded safe positions.
- [x] Add respects the 12-orb cap.
- [x] Added sound becomes selected.
- [x] Adding to a silent World can start playback.
- [x] Change preserves orb id.
- [x] Change preserves position.
- [x] Change preserves mute state.
- [x] Change can alter timbre without restarting the shared transport.
- [x] Sound pattern identity is decoupled from concrete sound id.

## Surprise
- [x] Starter Surprise Me is deterministic for a fixed seed.
- [x] Palette Surprise Me is deterministic for unchanged World state.
- [x] Palette Surprise prefers an unused sound where possible.
- [x] Surprise functionality remains lightweight and does not implement Phase 9 Magic early.

## Onboarding
- [x] Step 1 asks the user to move a sound.
- [x] Step 2 asks the user to bring a sound closer to YOU.
- [x] Step 3 asks the user to Add something.
- [x] Onboarding progression responds to actual user actions.
- [x] Listener gets additional visual emphasis during the distance step.
- [x] Add gets visual emphasis during the final step.
- [x] Skip is always available.
- [x] Completed/skipped onboarding does not repeat when switching starters during the same app session.
- [x] No long tutorial or modal walkthrough was introduced.

## Automated coverage
Tests cover:
- starter list;
- valid non-empty starter Worlds;
- Empty World behavior;
- deterministic starter surprise;
- palette category names;
- Beat/percussion beginner grouping;
- Harmony → Chords label mapping;
- deterministic unused sound surprise;
- Add World action;
- Replace World action;
- existing Sound Orb cap and spatial actions;
- all prior transport/harmony/audio/world tests.

## Scope protection
- [x] No editable pattern UI added early.
- [x] No Effect Fields added early.
- [x] No Motion added early.
- [x] No Magic mutation engine added early.
- [x] No persistent project library added early.
- [x] No DAW-style browser or mixer added.

## Exit condition
Phase 4 is complete only when the exact final main head passes:
- dependency installation;
- strict TypeScript typecheck;
- complete unit-test suite;
- production Vite build.

CI result is recorded after final cleanup/status commits.
