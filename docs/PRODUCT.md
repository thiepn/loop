# Loop — Product Specification

## Status
Phase 0 product contract. This document is the primary source of truth for product direction.

## Product definition
Loop is a browser-based visual music playground where anyone can make satisfying beats, loops, and soundscapes by moving, combining, transforming, and animating living sound objects.

Loop is not a simplified DAW. It is an interactive musical toy with enough depth to remain interesting.

## Target user
Loop is designed first for people who:
- have little or no music theory knowledge;
- have never used a DAW;
- want immediate audiovisual feedback;
- enjoy experimentation more than technical production;
- may use desktop, tablet, or phone;
- should be able to create something enjoyable without reading documentation.

Experienced musicians may enjoy Loop, but V1 is not optimized around professional production workflows.

## Core promise
A first-time user should be able to open Loop and, within roughly one minute:
1. hear music;
2. move a sound and hear the result;
3. add another sound;
4. alter a rhythm or musical idea;
5. transform a sound with a visible playground object;
6. discover an unexpected but musically coherent result;
7. want to keep experimenting.

## Product principles

### Immediate
The user should reach a satisfying musical state within seconds. Non-empty starter Worlds begin with music already running.

### Visual
Important sound changes must have visible consequences. The interface should often let users see what they are hearing.

### Physical
Direct manipulation is preferred over abstract controls. Move, drop, drag, orbit, link, and collide before adding sliders or parameter panels.

### Forgiving
Loop should quietly handle timing, compatibility, gain, synchronization, and safe effect ranges so experimentation rarely produces unusable output.

### Playful
The product optimizes for curiosity, discovery, and repeat play rather than precision editing.

### Simple surface, capable engine
Complex DSP may exist internally, but user-facing concepts must remain understandable without audio-engineering terminology.

### Local-first
V1 requires no account, server, or cloud database. Worlds are saved locally.

### Web-first
The canonical product is the GitHub Pages web app and installable PWA.

### Bounded scope
V1 must not evolve into a DAW, studio suite, or acoustic simulator.

## Core mental model

### World
A self-contained musical playground containing sounds, effect objects, motion, links, and optional Snapshots.

### Sound Orb
A living visual object representing one musical layer such as a beat, bass, melody, texture, or voice.

### Effect Field
A spatial region that transforms Sound Orbs placed inside it.

### Motion
Simple movement behaviors such as Orbit, Bounce, Drift, Follow, or Wander.

### Link
A simple relationship between two Sound Orbs, such as Pulse Together or Kick Pushes Bass.

### Magic
Controlled, musically constrained variation or mutation.

### Snapshot
A saved moment of the current World that can be recalled on beat.

## Core loop
Start a World → hear it immediately → move Sound Orbs → add/remove sounds → alter patterns → use Effect Fields → add Motion or Links → use Magic → save a Snapshot → record or continue playing.

## Default starter Worlds
V1 should include a small set of high-quality starting directions:
- Beat
- Chill
- Dreamy
- Dance
- Weird
- Surprise Me
- Empty

Non-empty starters must launch with a coherent, playable arrangement.

## User-facing language
Prefer everyday words:
- Beat
- Bass
- Melody
- Texture
- Voice
- Space
- Echo
- Heat
- Frost
- Filter
- Move
- Link
- Magic
- Snapshot
- Record

Avoid exposing internal terms such as:
- CV
- bus
- send
- modulation matrix
- hysteresis
- AudioWorklet
- LFO
- diffraction
- reflection tap
- gain staging

## Primary success metrics
V1 is successful if:
- a new user can create a meaningful change without instruction;
- the first interaction-to-sound-feedback delay feels immediate;
- most actions remain undoable;
- randomization remains musical rather than chaotic;
- users can understand the main interactions by observing the canvas;
- the app remains fun even when the user never exports anything;
- the app runs reliably from GitHub Pages on supported desktop and mobile browsers.

## Product decision test
Before adding any feature, ask:
1. Does it make musical play more immediate?
2. Does it make the World more visually understandable?
3. Does it increase expressive play without requiring expertise?
4. Can it be explained in everyday language?
5. Does it fit the bounded playground model?

If the answer is mostly no, the feature stays out of V1.
