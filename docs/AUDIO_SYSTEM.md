# Loop — Audio System Contract

## Goal
The audio system exists to make playful experimentation sound coherent, responsive, and safe.

Users should not need to manage synchronization, tuning, gain staging, or technical signal routing.

## Core responsibilities

### Timing
Provide:
- master tempo;
- stable musical clock;
- bar/beat subdivision;
- quantized start/stop;
- synchronized loop launch;
- click-free state changes.

### Compatibility
Built-in content must carry enough metadata for the engine to make sensible choices.

Recommended metadata:
- role;
- source BPM;
- key/root where relevant;
- scale/mode where relevant;
- loop length;
- energy;
- brightness;
- compatible categories;
- safe pitch range;
- nominal loudness.

### Automatic musical behavior
The engine should quietly:
- synchronize built-in loops;
- align loop boundaries;
- transpose compatible tonal material when needed;
- constrain generated melody notes;
- avoid unsafe volume summing;
- maintain master headroom;
- smooth parameter changes;
- quantize musically sensitive actions.

## V1 audio building blocks
Use the simplest reliable implementation that satisfies the experience.

Expected building blocks:
- AudioContext;
- AudioBuffer / decoded assets;
- GainNode;
- StereoPannerNode or equivalent spatial balance;
- BiquadFilterNode;
- DelayNode or proven custom delay if necessary;
- lightweight filtered delay diffusion for ambience;
- saturation/waveshaping;
- bounded short-delay coloration for Frost where sufficient;
- DynamicsCompressorNode / limiter;
- AudioWorklet only for features that materially benefit from it.

Do not move DSP into custom worklets merely for sophistication.

## Sound Orb model
Each Sound Orb needs:
- identity;
- role;
- source;
- transport state;
- position;
- level/presence;
- pan;
- pattern state where applicable;
- motion state;
- active Effect Field influences;
- Links;
- mute state.

## Spatial mapping
V1 uses musical spatialization, not architectural simulation.

Suggested mapping:
- horizontal position → stereo balance;
- distance from listener → presence/level and optional subtle space;
- Effect Field overlap → effect amount.

Mappings must be bounded, smoothed, and tested for headphones and speakers.

## Effect Fields

### Space
Primary behavior: ambience / roomy diffusion.

Phase 6 uses two short filtered feedback delays per orb rather than a convolution engine. Wet level and feedback follow field depth. No user-facing decay-time or send terminology exists.

### Echo
Primary behavior: synchronized delay.

Phase 6 uses one filtered feedback delay per orb at approximately 0.75 beat of the shared tempo. Feedback is capped at 0.40 and delay time follows BPM changes smoothly.

### Heat
Primary behavior: saturation/distortion.

Phase 6 uses a parallel WaveShaper path with bounded wet gain so the original signal remains present and output stays controlled.

### Frost
Primary behavior: icy / fractured coloration.

Phase 6 uses a short resonant filtered-delay feedback network instead of a granular AudioWorklet per orb. This keeps CPU bounded while delivering the intended crystalline character. True granular freeze is optional future implementation detail, not a user-facing contract.

### Filter
Primary behavior: spectral darkening.

Phase 6 maps field depth from a near-open low-pass to roughly 650 Hz at full depth, with bounded resonance.

## Motion
Motion updates visual position and, where appropriate, audible spatial parameters.

Motion must not:
- introduce zipper noise;
- cause dangerous volume spikes;
- create unusable Doppler effects by default;
- drift off the musical clock when the behavior is rhythm-sensitive.

Doppler-like character may be used subtly as an artistic effect, but physical simulation is not a V1 requirement.

## Links
Links are musical relationships.

Possible internal implementations:
- envelope follower;
- shared trigger;
- quantized alternation;
- sidechain-like gain ducking;
- shared movement;
- synchronized phase/pulse.

The implementation must remain deterministic enough for save/restore and undo.

## Magic engine
Magic must be controlled rather than arbitrary.

Requirements:
- seeded randomness;
- bounded parameter ranges;
- musical compatibility;
- role awareness;
- undoability;
- reproducibility within a saved World.

## Built-in sound library
Prefer a small curated library to a large inconsistent library.

Initial target:
- several coherent World packs;
- roughly 6–8 useful elements per starter World;
- strong coverage of Beat, Bass, Melody/Chords, Texture, Percussion, and occasional Voice/FX.

Every built-in starter World should sound good before user interaction.

## Imported audio
Custom sample import may be supported, but V1 should not promise perfect automatic analysis.

Safe behavior:
- decode supported browser formats;
- normalize conservatively;
- allow loop or one-shot classification where practical;
- handle failures gracefully;
- never corrupt the current World when decoding fails.

Built-in content remains the primary guaranteed musical experience.

## Recording
Record the master experience rather than exposing studio routing.

V1 goals:
- obvious start/stop;
- stable capture;
- export a useful audio file;
- no advanced stem matrix.

## Phase 6 field runtime

Every live Sound Orb routes:

ProceduralInstrument → EffectRack → SpatialVoice → master.

EffectRack exists even when all field amounts are zero, so moving through fields only changes AudioParams rather than rebuilding nodes.

Current hard feedback ceilings:
- Frost < 0.40;
- Echo = 0.40 maximum;
- Space taps < 0.25.

All field amounts are clamped to 0–1 and smoothed.

## Audio safety
Requirements:
- master output ceiling;
- gain smoothing;
- bounded feedback;
- bounded resonance;
- no infinite feedback paths;
- no unbounded simultaneous voice creation;
- suspend/restore AudioContext safely;
- handle device/background state changes;
- release disconnected nodes.

## Performance targets
The engine must remain stable at the V1 object cap.

Prefer hard, understandable caps over allowing unlimited objects that degrade audio.

Performance testing must include:
- maximum Sound Orbs;
- simultaneous fields;
- active motion;
- Links;
- Frost/granular processing;
- long sessions;
- background/foreground cycles.

## Non-goals for V1 audio
Not required:
- professional mastering;
- sample-accurate DAW editing;
- multitrack stem workflow;
- VST/AU/CLAP hosting;
- MPE;
- advanced MIDI routing;
- physical room acoustics;
- GTD diffraction;
- image-source room simulation;
- WebGPU/FDTD acoustic simulation;
- surround/Atmos/ambisonics.

## Audio acceptance test
A non-musician should be able to combine supported built-in elements freely and usually produce something coherent, while interaction remains responsive and free from clicks, dangerous peaks, and obvious timing drift.
