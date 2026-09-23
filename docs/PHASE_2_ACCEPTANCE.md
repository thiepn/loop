# Phase 2 — Musical Core & Smart Sound System Acceptance

## Transport
- [x] Master BPM model exists.
- [x] Audio time converts deterministically to musical position.
- [x] Quantization supports sixteenth, eighth, quarter, bar, and two-bar boundaries.
- [x] Tempo changes preserve current musical position.
- [x] BPM is bounded to a safe supported range.

## Scheduling
- [x] Lookahead scheduler uses audio-context time rather than animation frames.
- [x] Scheduling works at 16th-note resolution.
- [x] Repeated scheduler pulses do not duplicate events.
- [x] Long main-thread gaps resynchronize instead of bursting stale events.

## Harmony
- [x] Small V1 scale vocabulary exists.
- [x] Pitch classes normalize correctly.
- [x] Shortest transposition is calculated.
- [x] Scale degrees map to playable MIDI notes.
- [x] User-facing UI does not need note or scale terminology.

## World model
- [x] World schema includes BPM.
- [x] World schema includes tonic and scale.
- [x] World schema includes deterministic random seed.
- [x] Schema version explicitly advanced to version 2.

## Smart sound system
- [x] Typed sound metadata exists.
- [x] Catalog validation rejects invalid metadata.
- [x] Catalog IDs are unique.
- [x] Friendly names/descriptions are stored separately from technical source details.
- [x] Compatibility ranking considers role, tempo, tonality, pitch range, and energy.
- [x] Exclusion support exists for avoiding duplicate choices.

## Automatic mix safety
- [x] Metadata normalization is bounded.
- [x] Active voice headroom compensation exists.
- [x] Role trim can be applied without exposing mixer concepts.
- [x] Master gain and limiter remain the final output safety boundary.

## Audible integration
- [x] Procedural copyright-free Phase 2 sound set exists.
- [x] Foundation Groove schedules percussion, bass, harmony, melody, and texture on one clock.
- [x] Groove start requires the normal user audio gesture.
- [x] Groove can stop and clean up active scheduled sources.
- [x] Foundation Groove is explicitly temporary and not a new permanent product mode.

## Scope protection
- [x] No Sound Orb gameplay implemented early.
- [x] No editable sequencer implemented early.
- [x] No Effect Fields implemented early.
- [x] No DAW mixer or studio routing added.
- [x] No unnecessary AudioWorklet DSP added.

## Automated verification

GitHub Actions on the integrated Phase 2 code head passed:

- dependency installation;
- strict TypeScript typecheck;
- **9 test files**;
- **24 tests**;
- production Vite build.

The successful build completed after the complete Phase 2 runtime and test set had landed.

## Exit condition
- [x] The shared musical engine can support future visual play without UI code reimplementing timing, harmony, compatibility, or headroom rules.
- [x] The current code head passes CI.

**Phase 2 status: complete.**
