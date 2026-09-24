# Loop — Visual V2 Sound Orb Material Engine

## Status

Phase 4 implementation is present on the Visual V2 track.

## Goal

Sound Orbs are no longer generic role-colored discs.

Phase 4 gives every role a distinct procedural body, internal visual material, musical fingerprint, pulse response and state treatment while keeping the same semantic DOM hit targets and the same underlying musical behavior.

The visual target is label-free recognition through redundant cues:

- silhouette;
- internal structure;
- motion/deformation;
- size;
- musical fingerprint;
- color.

## Material projection

Every Sound Orb now projects a presentation-only `RenderOrbMaterial`.

Inputs already present in the product:

- Sound role;
- sound energy;
- sound brightness;
- rhythm/melody pattern;
- pattern groove;
- pattern variation;
- Orb id and sound id;
- current Effect Field influence.

Derived outputs:

- energy;
- brightness;
- pattern density;
- groove scalar;
- melodic/rhythmic contour;
- pitch/syncopation spread;
- variation amount;
- deterministic material seed;
- 16-position abstract pattern fingerprint;
- Field-influence hook.

No visual material parameter is persisted.

## Pattern fingerprints

Fingerprints remain abstract.

### Rhythm

The 16 pattern steps are represented as active/inactive material marks.

The renderer also derives:

- density;
- off-beat balance;
- syncopation/spread;
- groove.

### Melody / bass / harmony / voice

Active steps encode normalized degree height.

The renderer derives:

- note density;
- first-to-last contour;
- pitch spread;
- groove.

These values shape internal visual structure without exposing notation, piano-roll UI, or technical music-production controls.

### Texture

Texture has no step pattern, so it receives a deterministic low-density atmospheric fingerprint rather than invented musical notes.

## Role identities

### Beat — kinetic nucleus

Visual traits:

- compact four-sided pressure deformation;
- impact spokes;
- dense body;
- sharp pulse squash/expansion;
- radial rhythm-step marks.

### Percussion — granular facets

Visual traits:

- faceted high-frequency silhouette;
- bright material response;
- deterministic grains/fragments;
- compact fast pulse;
- rhythm-step marks.

### Bass — viscous pressure body

Visual traits:

- slow two-lobed membrane deformation;
- broad liquid body;
- internal pressure bands;
- strongest pulse expansion/compression;
- melodic fingerprint points.

### Harmony — layered membranes

Visual traits:

- three-lobed/petal silhouette;
- overlapping internal ellipses/rings;
- wider body;
- pitch-spread-sensitive internal spacing;
- broad pulse bloom.

### Melody — filament + satellites

Visual traits:

- compact five-wave silhouette;
- animated internal filament;
- two satellites;
- contour-sensitive line;
- pitch fingerprint marks;
- nimble pulse stretch.

### Texture — gaseous volume

Visual traits:

- largest diffuse body;
- cloud clusters/noise;
- slow irregular edge;
- no fake step markers;
- restrained activity response.

### Voice — organic ribbons

Visual traits:

- asymmetric multi-wave boundary;
- two internal ribbon contours;
- organic material motion;
- melodic fingerprint marks;
- elastic pulse response.

## Pulse deformation

Scheduled `orb-pulse` events now drive the material itself.

Role response remains distinct:

- Beat squashes vertically and expands sharply.
- Percussion brightens/facets with a compact response.
- Bass expands heavily and compresses laterally.
- Harmony blooms broadly.
- Melody stretches directionally.
- Texture remains slower/subtler.
- Voice responds elastically.

The event also produces a restrained material pulse ring.

The existing audio scheduler remains authoritative; this is presentation-only.

## Internal animation

Material time is sampled only on renderer frames already justified by:

- scheduled visual events;
- Motion;
- pointer activity;
- other render invalidation.

Reduce Motion sets the material motion scale to zero.

There is no new permanent animation loop.

## Selection, focus and mute

### Selected

Selected Orbs receive a continuous outer material ring.

### Keyboard focused

Focused Orbs receive a separate dashed inner focus ring.

This is independent from selection state.

The semantic DOM button and its existing focus outline remain present as an accessibility fallback.

### Muted

Muted Orbs:

- desaturate;
- reduce material alpha;
- reduce aura;
- retain silhouette and fingerprint geometry.

Mute therefore remains recognizable without color alone.

## Quality scaling

The renderer policy now includes `orbDetail`.

### High

- full internal material detail;
- full fingerprints;
- richest grains/petals/ribbons/clouds.

### Balanced

- same role identity;
- reduced internal detail.

### Battery Saver

- keeps silhouette, role color, pulse, selection/focus and major identity;
- aggressively reduces small internal detail.

The quality profile never changes sound.

## WebGL path

Hardware WebGL2 now renders Orbs through a dedicated `WebGLOrbMaterialLayer`.

It uses:

- one shared material program;
- one static quad buffer;
- per-Orb uniforms;
- a maximum of the existing 12 Orb draw calls;
- role-specific signed radial boundaries;
- procedural internal material functions;
- 16-entry pattern uniforms;
- event-driven deformation.

The old generic Orb discs were removed from the WebGL renderer.

## Canvas2D fallback

Canvas2D receives a dedicated `CanvasOrbMaterialLayer` with equivalent role identity:

- procedural polygon/blob boundaries;
- gradients;
- pressure rings;
- petals;
- filaments;
- cloud clusters;
- voice ribbons;
- pattern markers;
- melody satellites;
- selection/focus rings.

It remains governed by the Phase 2 reduced-resolution/cadence fallback policy.

## Field-ready material hook

Every projected Orb includes current `EffectAmounts` at its rendered position.

Phase 4 does not fully implement Field-specific material transformations; Phase 7 owns that work.

This hook prevents a later architecture rewrite when Heat/Frost/Space/Echo/Filter begin modifying Orb materials.

## Legacy handoff

When Visual V2 rendering is healthy:

- the old DOM Orb body remains transparent;
- its continuous decorative child animations are disabled;
- hidden DOM pulse animations are skipped;
- the DOM Orb button still owns input, accessibility, labels and fallback rendering.

If the renderer is lost or errors, the existing DOM visual body can reappear.

## State boundary

Orb materials do not:

- alter `WorldDocument`;
- create history;
- trigger autosave;
- alter backup/export data;
- change audio;
- change pattern semantics;
- change Orb hit geometry.

## Phase 5 handoff

Phase 5 — Physical Interaction & Object Game Feel can now build on material bodies that already understand:

- role;
- current musical fingerprint;
- selected state;
- keyboard focus;
- mute;
- transient pulse deformation;
- Field influence.

Phase 5 should add grab/drag/drop physics and interaction deformation rather than redesigning Orb identity again.
