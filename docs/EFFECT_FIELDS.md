# Loop — Effect Fields

## Status
Phase 6 implementation contract.

Effect Fields turn audio processing into a physical playground interaction. Users do not manage sends, buses, plugin slots, wet percentages, feedback values, or filter frequencies. They move Sound Orbs through visible regions.

## Field model

Each Effect Field is serializable World state containing:
- id;
- type;
- normalized center position;
- normalized radius.

V1 supports exactly five field types:
- Space;
- Echo;
- Heat;
- Frost;
- Filter.

A World may contain at most five fields and Phase 6 allows at most one field of each type.

## Geometry

Fields are represented as normalized ellipses in the responsive canvas.

For a Sound Orb at a point:
1. x/y distance from the field center is divided by field radius;
2. normalized elliptical distance is calculated;
3. positions outside the boundary produce zero effect;
4. positions inside use a smooth depth curve;
5. the center reaches full field amount.

The boundary snaps to exact zero to avoid tiny ghost effect values from floating-point error.

This makes the visual field boundary and DSP boundary agree across viewport sizes.

## Overlap

Different field types can overlap.

The audio system evaluates all five amounts independently, so a Sound Orb can simultaneously be:
- inside Space;
- partially inside Echo;
- slightly inside Filter.

If multiple same-type fields ever appear through imported/migrated data, amounts combine with a bounded probabilistic-style union and never exceed 1.

The Phase 6 UI itself prevents duplicate field types.

For simple visual feedback, the orb displays the strongest active field while the audio can still contain all overlapping effects.

## Direct manipulation

### Add
The playground dock contains **Effects**.

The palette offers:
- Space — Wide and roomy
- Echo — Repeats and trails
- Heat — Warm to rough
- Frost — Icy and fractured
- Filter — Soft and dark

A type already present in the World is disabled in the palette.

### Move
Press/drag a field to reposition it.

During drag:
- the field visual moves immediately;
- affected Sound Orbs update their visual treatment;
- EffectRack amounts update live;
- World state commits at gesture end.

### Resize
Select a field and drag its corner handle.

Radius is hard-clamped:
- minimum: 0.10
- maximum: 0.34

Live resize previews update sound before committing to World state.

### Keyboard
Selected fields can be nudged with arrow keys.

Shift + arrow performs a larger move.

Delete/Backspace or the contextual Delete button removes the field.

## Runtime audio chain

Each Sound Orb now uses:

ProceduralInstrument
→ EffectRack
→ SpatialVoice
→ master safety chain

The EffectRack is created once per live Sound Orb and kept alive while fields move.

Moving fields or orbs only updates AudioParams; the audio graph is not rebuilt.

## DSP behavior

### Filter
A low-pass filter maps field depth approximately from:
- outside: ~18 kHz;
- center: ~650 Hz.

Resonance rises slightly with depth but remains bounded.

### Heat
A waveshaper provides soft saturation.

Heat uses parallel dry/wet mixing:
- dry level remains present;
- wet saturation rises with depth;
- total output remains bounded before the master limiter.

### Frost
Phase 6 uses a lightweight crystalline fragmentation network:
- short delay;
- narrow band-pass coloration;
- bounded feedback;
- wet/dry crossfade.

It creates an icy/metallic fractured character without running a granular AudioWorklet per Sound Orb.

If a later quality pass proves true granular freeze materially improves the product without unacceptable CPU cost, it can replace this implementation behind the same field contract.

### Echo
Echo uses:
- one tempo-aware delay;
- filtered feedback;
- bounded wet gain.

Delay time follows roughly 0.75 beat of the shared musical tempo.

Changing World BPM updates the delay smoothly.

Maximum feedback remains below runaway levels.

### Space
Space uses a lightweight dual-delay diffusion network:
- two short delay taps;
- separate low-pass damping;
- bounded feedback;
- parallel wet output.

This intentionally replaces the earlier per-orb convolution experiment because up to 12 stereo convolvers would be wasteful on mobile.

The product behavior remains: deeper inside Space sounds wider, longer, and more atmospheric.

## Safety

All field amounts are clamped from 0 to 1.

Feedback maxima remain bounded:
- Frost: below 0.40
- Echo: 0.40
- Space taps: below 0.25

The final master limiter from Phase 1 remains active.

Field movement uses smoothed AudioParam targets to reduce zipper noise.

## Starter Worlds

Non-empty starter Worlds now demonstrate fields immediately.

Examples:
- Beat — Echo around the hats;
- Chill — Space around the harmony;
- Dreamy — Frost + Space;
- Dance — Echo + Heat;
- Weird — Frost + Filter.

Empty starts with no fields.

Starter fields are ordinary EffectFieldDocument values, not a special preset mechanism.

## Visual language

Each field has a distinct visual identity:

### Space
Violet nebula / breathing cloud.

### Echo
Cyan concentric ripples.

### Heat
Rose/orange turbulent glow.

### Frost
Pale blue crystalline angular light.

### Filter
Green/blue spectral gradient.

When an orb enters a field, its orb visual picks up a matching treatment proportional to field depth.

## Performance strategy

Phase 6 deliberately avoids:
- convolution reverb per Sound Orb;
- granular AudioWorklets per Sound Orb;
- GPU wave simulation;
- physical acoustics.

The current implementation uses standard Web Audio nodes:
- GainNode;
- BiquadFilterNode;
- DelayNode;
- WaveShaperNode.

This preserves the interaction concept while keeping the graph practical for the V1 12-orb cap.

## Scope boundary

Phase 6 does not add:
- automatic field movement;
- orbiting Sound Orbs;
- physics toys;
- inter-orb Links;
- global Magic;
- studio effect parameter panels.

Those remain assigned to later phases.

## Acceptance principle

A first-time user should be able to:
1. see an Effect Field;
2. drag a Sound Orb into it;
3. hear the sound transform continuously;
4. see the orb visually react;
5. drag deeper and hear a stronger result;
6. move or resize the field itself;
7. add another field from plain-language choices;
8. overlap fields and get a combined result;
9. understand the broad behavior without seeing a single DSP parameter.
