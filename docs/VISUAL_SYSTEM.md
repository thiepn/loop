# Loop — Visual System

## Status
Implemented through Phase 12.

Loop should feel like an animated musical universe, not a technical audio dashboard.

The visual system communicates sound behavior while remaining playful, readable, and bounded enough for the full V1 object caps.

## Core visual principles

### Behavior before decoration
Visual feedback should explain something the user can hear or do.

Mappings include:
- louder/transient → brighter/larger pulse;
- mute → dim/desaturate;
- bass → slower heavy deformation;
- percussion → fast sparks/flicker;
- melody → smaller satellites/particles;
- texture → breathing atmospheric aura;
- reverb/Space → expanding ambient rings;
- Echo → concentric ghost waves;
- Heat → molten/turbulent glow;
- Frost → crystalline breakup;
- Filter → spectral/dark-to-bright gradient;
- Motion → fading role-colored trail;
- Link activation → relationship pulse;
- recording → restrained rose capture state.

### Distinct identities
Sound roles, Effect Fields, toys, Links, and major app states should be recognizable without relying on labels alone.

### Soft depth, not HUD clutter
Use:
- dark neutral spatial canvas;
- luminous role colors;
- soft bloom;
- circular living forms;
- transparent field geometry;
- controlled trails/particles;
- restrained glass/chrome surfaces.

Avoid:
- fake telemetry;
- dense engineering grids;
- scanlines;
- meaningless meters;
- audio-plugin aesthetics;
- visual effects that imply features which do not exist.

## Brand vocabulary

The recognizable Loop visual language is:
- dark spatial World;
- luminous circular Sound Orbs;
- central listener;
- translucent interactive fields;
- curved relationship paths;
- small restrained chrome;
- violet/cyan atmospheric depth;
- role-specific accent colors.

The brand should remain identifiable in a screenshot without requiring the Loop wordmark.

## Sound Orb anatomy

Phase 12 Sound Orbs use layered anatomy:

1. **Aura** — soft role-colored surrounding energy.
2. **Detail layer** — role-specific non-text identity.
3. **Wave/rhythm halo** — circular activity pattern.
4. **Core** — luminous body.
5. **Built-in particles** — only where useful.
6. **Selection ring**.
7. **Label**.
8. **Transient audio burst particles**.
9. **Motion trail** when moving and allowed by quality/accessibility settings.

The underlying Sound Orb position/interaction element remains unchanged.

## Role identities

### Beat
- rose;
- grounded larger body;
- angular impact detail;
- crisp, short scale pulse;
- stronger transient burst.

### Percussion
- amber;
- smaller body;
- fine segmented detail;
- short fast brightness flicker;
- small spark particles.

### Bass
- cyan;
- large heavy body;
- broad local aura/space warp;
- slow breathing core;
- slower heavier audio pulse.

### Harmony / chords
- violet;
- larger layered halo;
- multiple concentric rings;
- slow orbital detail;
- broad gentle audio bloom.

### Melody
- green;
- compact clear body;
- small satellite points;
- quicker expressive pulse;
- role-colored burst/trail.

### Texture
- blue;
- largest atmospheric body;
- diffuse soft aura;
- slow cloud rotation;
- soft wide burst.

### Voice
- pink;
- expressive asymmetric contour;
- elastic halo;
- distinct from texture/harmony.

## Audio-synchronized game feel

The existing audio scheduler remains authoritative.

When a scheduled orb event reaches its AudioContext time:

1. PlaygroundView runs a role-specific orb pulse.
2. VisualSystemView creates a bounded role-colored burst at the orb's **current rendered position**.

Visual timing follows already-scheduled audio. Visual animations never schedule audio.

Role pulse profiles differ in:
- scale amount;
- brightness;
- duration;
- easing.

Reduced Motion preserves brightness feedback while removing travel-heavy scale movement.

## Motion trails

Trails are generated only when an existing live position changes.

There is no second motion/render loop.

Trail behavior:
- normalized position comes from the same runtime position used by Motion/spatial audio;
- a new point is emitted only after sufficient movement distance;
- points fade automatically;
- role color is preserved;
- old points are bounded and removed;
- trail count/lifetime depend on visual quality;
- Reduce Motion removes trails entirely.

Current quality limits:

### High
- up to 18 trail points per moving orb;
- roughly 1200 ms trail lifetime.

### Balanced
- up to 10 points;
- roughly 800 ms.

### Battery Saver
- up to 4 points;
- roughly 450 ms;
- animated trail behavior disabled by profile.

## Ambient particles

VisualSystemView owns one lightweight ambient particle layer.

Ambient particles:
- are deterministic DOM elements;
- do not require a render loop;
- use CSS animation only;
- scale by visual-quality profile;
- disappear entirely under Reduce Particles.

Current target counts:

- High: 28
- Balanced: 14
- Battery Saver: 5

## Effect Field identities

### Space
- violet/blue nebula;
- star flecks;
- breathing cloud;
- expanding atmospheric ring.

### Echo
- cyan repeating radial geometry;
- ghost ripple ring;
- visible repetition without waveform/UI terminology.

### Heat
- rose/orange glow;
- moving molten turbulence;
- stronger saturated visual temperature.

### Frost
- pale blue crystal geometry;
- angular shard-like breakup.

### Filter
- green/cyan spectral gradient;
- dark-to-clear spatial treatment.

The same field geometry remains the interaction/effect boundary.

## Playground toy identities

### Spinner
- violet;
- rotating dashed orbital rings.

### Magnet
- green;
- contracting attraction rings.

### Repulsor
- rose;
- radial outward spokes/breathing expansion.

### Portal
- cyan IN;
- pink OUT;
- rotating inner portal ring.

Toy visuals remain bounded CSS/DOM presentation over the existing Phase 7 behavior.

## Links

Links remain curved relationships rather than modular cables.

Phase 12 adds:
- quality-aware glow;
- High-quality dash-flow animation for patterned Link types;
- selected-Link emphasis;
- existing audio-timed pulse feedback;
- Reduced Motion removal of continuous dash travel.

Kick Pushes Bass removes its translation reaction under Reduce Motion and substitutes brightness feedback.

## Listener / World ambience

The listener keeps a compact bright core and concentric spatial rings.

While playback is active:
- listener rings subtly breathe;
- canvas border/depth becomes slightly more alive.

While recording:
- World/listener ambience receives a restrained rose capture tint.

These are status cues, not meters.

## Object entrances & transitions

New visual objects receive short bounded entrance animations:
- Sound Orb → quick scale/opacity arrival;
- Effect Field → soft expansion;
- toy → compact pop-in;
- Link → fade-in.

Contextual sheets and overlays share:
- short backdrop fade;
- bottom-origin sheet entrance;
- contextual selection-panel entrance.

Reduce Motion collapses these transitions to near-instant state changes.

## Home / library identity

Home uses the same living-object vocabulary:
- atmospheric violet/cyan depth;
- circular starter art;
- subtle card depth;
- animated brand mark;
- richer World-library hover state.

Starter art remains abstract rather than showing fake screenshots/features.

## Maximum-density readability

At high Sound Orb counts, Loop automatically de-emphasizes decorative noise:
- aura intensity reduces;
- built-in particles reduce;
- labels become quieter until hover/selection.

This protects the V1 12-orb cap from becoming a bloom cloud.

Quality profiles further reduce decoration without changing interaction/audio.

## Visual quality

Phase 12 provides:

- **High**
- **Balanced**
- **Battery Saver**

The initial quality is selected from lightweight browser hints:
- hardware concurrency;
- device memory where exposed;
- data-saver hint.

Heuristic:
- constrained hardware or data saver → Battery Saver;
- strong known hardware → High;
- uncertain/middle hardware → Balanced.

This is only the initial choice.

User selection is saved globally in:
`localStorage: loop.visual-preferences.v1`

Visual settings are **not** stored inside WorldDocument.

### High
Highest:
- ambient particle count;
- trail length;
- bloom;
- decorative field/link detail.

### Balanced
Default middle profile.

### Battery Saver
Reduces:
- ambient particles;
- trails;
- bloom;
- built-in orb particles;
- continuous decorative animations.

Audio and creative behavior are identical in all modes.

## Visual accessibility

The Visual settings sheet provides independent controls:

### Reduce motion
- removes motion trails;
- stops continuous orb/field/toy/link/listener loops;
- removes Kick Push travel;
- keeps brightness/state feedback;
- keeps a minimal non-travel particle pulse unless Reduce Particles is also enabled.

### Reduce particles
- removes ambient particles;
- removes transient burst particles;
- removes built-in decorative orb particles.

### Reduce glow
- lowers bloom/depth;
- disables strong visual filters/glow treatments where practical.

These reductions combine rather than replacing one another.

System `prefers-reduced-motion` is used when selecting initial preferences.

A CSS media-query fallback also reduces animation if the system asks for reduced motion.

## Performance architecture

Phase 12 intentionally does **not** add WebGL/WebGPU.

Reasons:
- existing V1 visuals can meet the product goal using bounded DOM/CSS;
- another render engine would add lifecycle/performance complexity immediately before mobile/release hardening;
- Audio/Motion correctness already uses existing runtimes.

VisualSystemView is event-driven.

It creates:
- ambient DOM particles when profile changes;
- trail points when live positions actually move;
- burst particles on audio events.

It does not own a requestAnimationFrame loop.

Existing Phase 7 Motion remains the only live position loop when needed.

## State ownership

Visual preferences are global app preferences, not creative World state.

AppState contains transient:
- visual-settings sheet state;
- current quality;
- reduce-motion flag;
- reduce-particles flag;
- reduce-bloom flag.

Explicit preferences persist in localStorage.

No visual preference:
- changes audio;
- changes WorldDocument;
- creates history entries;
- creates autosave writes;
- changes exported World backups.

## Responsive boundary

Phase 12 includes responsive visual settings and density protection, but complete mobile/PWA hardening remains Phase 13.

Phase 13 still owns:
- final phone/landscape layouts;
- safe-area edge cases;
- installability;
- offline shell;
- service worker/update behavior;
- final touch/pointer hardening.

## Visual acceptance tests

The visual system passes when:
- sound roles are distinguishable by form/color/behavior;
- scheduled audio produces synchronized visible response;
- moving orbs leave readable bounded trails when enabled;
- Effect Fields/toys/Links have distinct identities;
- High/Balanced/Battery Saver visibly scale decoration;
- reduced-motion/particles/glow remain understandable;
- visual preferences survive reload safely;
- max-orb Worlds automatically reduce decorative clutter;
- audio behavior is unaffected by quality;
- no extra permanent render loop exists.
