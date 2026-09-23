# Loop — Visual System

## Visual goal
Loop should feel like an animated musical universe, not a technical audio dashboard.

The visual system must communicate sound behavior while remaining playful, attractive, and immediately legible.

## Core visual principles

### Behavior before decoration
Animation and effects should communicate audio or interaction state.

Examples:
- louder → larger/brighter;
- quieter → smaller/dimmer;
- bass energy → slow heavy deformation;
- transient → fast pulse;
- reverb → expanding trails/rings;
- echo → repeated ghost images;
- distortion → rough/fractured edge behavior;
- filtering → color/detail shift;
- granular processing → fragmentation;
- motion → clear trail/path;
- mute → desaturated/dim state.

### Distinct identities
Sound roles and Effect Fields should be distinguishable without reading labels.

### Soft depth, not HUD clutter
Use:
- dark neutral background;
- luminous color;
- soft bloom;
- subtle depth;
- transparent fields;
- waveform halos;
- trails;
- particles;
- responsive movement.

Avoid:
- fake telemetry;
- engineering readouts;
- dense cyan technical grids;
- decorative scanlines;
- meaningless graphs;
- excessive labels.

## Sound Orb anatomy
Each Sound Orb may contain:
- core body;
- waveform or rhythmic halo;
- transient pulse;
- role-specific particles;
- selection ring;
- lightweight label when needed;
- motion trail when active.

The orb must remain readable at small sizes and on mobile.

## Role behavior

### Beat / kick
- crisp expansion pulse;
- short impact ring;
- grounded/heavy motion.

### Percussion / hats
- fine sparks;
- quick high-frequency flicker;
- lightweight motion.

### Bass
- slower, larger deformation;
- subtle local space warp;
- strong presence near center.

### Melody
- smaller orbiting particles;
- fluid tonal trail;
- clear pitch/activity animation.

### Texture / pad
- breathing aura;
- slower field motion;
- atmospheric particles.

### Voice
- animated waveform contour;
- expressive halo;
- clear distinction from synthetic textures.

## Effect Field identities

### Space
Soft cloud/nebula with expanding translucent waves.

### Echo
Concentric ripples and timed ghost copies.

### Heat
Molten glow, warping edges, increasing turbulence.

### Frost
Crystalline fragments, frozen particles, glass-like breakup.

### Filter
A visible gradient from dark/soft to bright/detailed.

Field boundaries should be visually understandable but not look like engineering geometry.

## Motion visualization
Motion should be visible before it is heard:
- Orbit → clear curved path/trail;
- Bounce → directional impact and rebound;
- Drift → slow fluid trail;
- Follow → subtle relational path;
- Wander → organic exploratory trail.

Trails should fade and should not overwhelm active controls.

## Links
Links should look like relationships, not modular synth patch cables.

Use:
- thin animated energy paths;
- pulses traveling between objects;
- shared-color accents;
- transient emphasis only when the relationship activates.

## Canvas composition
The canvas is the primary product surface.

Permanent UI should be minimal.

Suggested persistent controls:
- top: World name, Undo, Redo, Settings;
- bottom: Add, Magic, Record.

Everything else should appear contextually.

## Responsive design
Desktop, tablet, and phone require deliberate layouts rather than scaled copies.

Requirements:
- large touch targets;
- contextual sheets on small screens;
- labels that do not overlap or disappear;
- protected safe areas;
- canvas remains the dominant surface;
- no browser page scrolling during normal play.

## Motion accessibility
Support:
- reduced motion;
- reduced particles;
- reduced bloom/visual intensity.

Reduced motion must preserve state clarity rather than simply disabling all feedback.

## Performance modes
Provide automatic or user-selectable quality:
- High
- Balanced
- Battery Saver

Visual quality may scale:
- particle counts;
- bloom passes;
- trail length;
- shader resolution;
- background complexity.

Audio behavior must not change across visual quality modes.

## Brand direction
Loop should be recognizable from screenshots without relying on its logo.

The visual identity should come from:
- circular living sound objects;
- luminous interactive fields;
- visible music-driven motion;
- a dark spatial playground;
- elegant, restrained UI chrome.

## Visual acceptance tests
The visual system passes when:
- users can distinguish sound roles quickly;
- audio changes correspond to visible changes;
- screenshots communicate that the app is playful and musical;
- the canvas remains readable with the maximum supported V1 object count;
- mobile controls remain usable;
- disabling expensive visuals does not compromise interaction clarity.
