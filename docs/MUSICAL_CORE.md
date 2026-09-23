# Loop — Musical Core

## Status
Phase 2 implementation contract.

Loop now has a real musical engine beneath the playground surface. The engine is deliberately opinionated: it handles timing, tonal compatibility, and safe levels so future visual interactions can remain simple.

## 1. Musical transport

The transport owns:
- BPM;
- beats per bar;
- conversion between AudioContext time and musical beat position;
- quantization boundaries;
- tempo changes that preserve musical position.

Supported quantization:
- immediate;
- sixteenth;
- eighth;
- quarter;
- bar;
- two bars.

The transport does not depend on DOM animation timing.

## 2. Lookahead scheduling

The scheduler uses a short lookahead window and schedules against AudioContext time.

Default timing:
- scheduler pulse: 25 ms;
- lookahead: 140 ms in the Phase 2 groove;
- subdivision: 16th notes.

This avoids tying musical timing to requestAnimationFrame.

If the main thread is paused long enough to miss many events, the scheduler resynchronizes rather than rapidly firing stale events.

## 3. Harmony model

V1 harmonic vocabulary is intentionally small:
- major;
- minor;
- major pentatonic;
- minor pentatonic.

The engine understands:
- pitch-class normalization;
- shortest transposition;
- scale-degree-to-MIDI mapping;
- MIDI-to-frequency conversion.

Users do not need to see these concepts directly.

## 4. World musical settings

World schema version 2 includes:

- bpm;
- tonic;
- scale;
- deterministic seed.

Current default:
- 108 BPM;
- tonic pitch class 0;
- minor pentatonic;
- seed 1.

These settings become the musical context future Sound Orbs follow.

## 5. Smart sound metadata

Every built-in sound can describe:

- id;
- human-readable name;
- role;
- description;
- tags;
- energy;
- brightness;
- nominal level;
- loop length;
- optional source BPM;
- optional tonal metadata;
- safe pitch-shift range;
- source engine.

The user-facing product should prefer descriptions such as "Warm Bass" or "Glass Hats" rather than filenames.

## 6. Compatibility ranking

The compatibility engine can evaluate sounds against a target World using:

- requested role;
- tempo proximity;
- tonic transposition;
- scale match;
- safe pitch range;
- desired energy;
- excluded/duplicate sounds.

The result includes an internal score plus any tempo/pitch adaptation required.

This is infrastructure for future Add and Magic flows; Phase 2 does not expose a sound browser yet.

## 7. Automatic level policy

Loop uses metadata-driven normalization plus active-voice headroom compensation.

Current policy:
- metadata correction is bounded;
- correction never exceeds +6 dB;
- attenuation correction can reach -9 dB;
- active layer compensation follows approximately 1/sqrt(n);
- compensation is bounded so large Worlds do not collapse to silence;
- the master limiter remains the final safety boundary.

This is not mastering. It is a conservative safety policy for playful combination.

## 8. Curated Phase 2 catalog

The first built-in catalog is intentionally tiny and procedural:

- Round Kick
- Soft Clap
- Glass Hats
- Warm Bass
- Dream Chords
- Soft Pluck
- Air

They are generated in-browser and require no third-party audio licensing.

The catalog is a foundation, not the final V1 library.

## 9. Foundation Groove

A temporary integration groove proves the musical systems together.

It contains:
- kick;
- clap;
- hats;
- bass;
- harmony;
- melody;
- texture.

It demonstrates:
- common timing;
- scale-aware notes;
- safe level compensation;
- lookahead scheduling;
- start/stop lifecycle.

The Foundation Groove is an internal development bridge. Phase 3 should replace this proof surface with actual Sound Orbs rather than turning it into a permanent song/demo mode.

## 10. Architecture boundary

Phase 2 does not implement:
- editable patterns;
- user-facing sound selection;
- Sound Orbs;
- Effect Fields;
- Motion;
- Links;
- Magic;
- persistence;
- recording.

Those remain assigned to later roadmap phases.

## 11. Acceptance principle

Phase 2 is successful when later UI systems can ask simple questions such as:

- "When is the next bar?"
- "Which bass fits this World?"
- "What note belongs to this scale?"
- "How loud should this new layer begin?"
- "Schedule this event on the next safe musical boundary."

without duplicating timing or theory logic inside UI code.
