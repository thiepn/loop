# Loop — Visual V2 Cross-System Visual Interaction

## Status

Phase 8 implementation is present on the Visual V2 track.

## Goal

Phase 8 makes the major Visual V2 systems visibly inhabit one shared physical universe.

Before Phase 8, Orbs, Fields, Links, toys, trails and atmosphere each had strong individual rendering systems. Phase 8 adds bounded presentation-only coupling between them without changing creative state or musical semantics.

## Deterministic interaction priority

Cross-effects are deliberately bounded.

The renderer derives:

- only nearby Orb couplings;
- a quality-independent cap on strongest coupling bridges;
- one strongest environmental toy force;
- sampled Field influence along each Link;
- strongest local toy influence where a single response is needed;
- capped Field intersection material from Phase 7.

Dense Worlds simplify rather than rendering every possible relationship.

For Orb coupling bridges:

- fewer than 6 Orbs → at most 12 visual pairs;
- 6–8 Orbs → at most 9;
- 9–12 Orbs → at most 6.

Pairs are ordered by strength with deterministic id tie-breaking.

## Orb ↔ Orb

Nearby Orbs now create a restrained shared-aura relationship.

The cross-system model derives:

- proximity strength;
- strongest neighbor direction;
- accumulated neighbor light;
- capped coupling pairs.

The renderer draws a soft role-color bridge between nearby Orbs.

The bridge:

- fades before reaching unrelated objects;
- uses the two endpoint role colors;
- remains low-alpha;
- pulses when either endpoint receives a real scheduled Orb pulse.

Orb materials also receive:

- additional aura softness;
- subtle directional light from the nearest strong neighbor.

This is not a new Link and has no musical behavior.

## Drag wake ↔ neighboring Orbs

Phase 5 already created environmental drag wakes.

Phase 8 propagates the strongest nearby drag wake into neighboring Orb materials.

A fast dragged Orb can therefore slightly deform another nearby Orb in the direction of the wake.

The response is:

- distance-bounded;
- speed-bounded;
- presentation-only;
- naturally reduced by the existing Reduce Motion drag-speed policy.

## Orb ↔ toy

Every Orb now receives its strongest local toy influence.

### Spinner

- adds bounded swirl modulation to the Orb boundary;
- contributes violet material tint.

### Magnet

- slightly compresses/concentrates the Orb body;
- contributes green tint.

### Repulsor

- slightly expands the Orb body;
- contributes rose tint.

### Portal

- subtly thins/fades the Orb material near strong influence;
- contributes cyan tint.

Actual toy physics remain entirely owned by MotionEngine.

## Orb ↔ Field

Phase 7 Field depth remains the authoritative material influence.

Phase 8 adds reciprocal local energy:

- active nearby Orbs increase Field-local material luminance;
- Field transformation continues to alter Orb body/trail/environment.

The visual relationship therefore reads in both directions instead of only Field → Orb.

## Orb aura bridges

A dedicated cross-system renderer now draws temporary-looking but state-derived aura bridges between nearby Orbs.

WebGL uses a stretched quad with:

- transverse falloff;
- end falloff;
- role-color interpolation;
- scheduled pulse amplification.

Canvas2D uses a bounded wide role-gradient stroke.

Reduce Glow substantially lowers bridge strength instead of removing proximity understanding completely.

## Field ↔ Link

Links are no longer visually indifferent to the space they cross.

Each Link samples five points along its source-to-target span and derives:

- Space;
- Echo;
- Heat;
- Frost;
- Filter;
- dominant Field type;
- midpoint refraction direction/strength.

The rendered Link then receives:

- Field color mixing;
- bounded geometric refraction;
- Space width lift on Canvas;
- Echo ghost copy;
- Frost segmentation;
- existing selection state.

If a Field center lies exactly on the Link midpoint, a deterministic perpendicular direction derived from Link id prevents zero-vector refraction.

Scheduled Link pulses use the same refracted geometry and Field color, so transient feedback never snaps back to the old path.

## Link ↔ toy

The Link midpoint also receives strongest local toy influence.

Toy influence refines the Field refraction curve:

- Spinner adds oscillatory path treatment;
- Magnet concentrates the bend;
- Repulsor exaggerates it;
- Portal adds bounded segmented-looking spatial disturbance.

This remains presentation-only.

## Field ↔ toy

Toys inside Fields now visually inherit Field material color.

Fields also receive their strongest nearby toy influence.

### Spinner

Adds mild rotating/wave-like boundary modulation.

### Magnet

Slightly compresses the Field boundary.

### Repulsor

Slightly expands the Field boundary.

### Portal

Adds a small paired-wave boundary distortion.

This does not alter Field radius or DSP geometry.

## Toy ↔ Orb

Toys now visually respond to Orbs inside their influence:

- body size/luminance increases slightly with nearby Orb energy;
- a bounded response envelope surrounds the toy;
- Field tinting and Orb response combine.

The actual toy hit target and Motion behavior remain unchanged.

## Trail ↔ Field ↔ toy

Phase 6 and Phase 7 already stored real Field/toy influence at each trail point.

Phase 8 keeps those systems under the same interaction-priority model:

- trail centerlines remain the actual final Motion path;
- strongest toy influence is used for styling;
- Field depth remains continuous;
- Portal breaks remain explicit.

No second trail system is added.

## Particle forces

The World environment now receives one deterministic strongest toy force.

Only one environmental force is rendered at a time to keep dense Worlds bounded.

### Spinner

Locally rotates particle/haze sampling.

### Magnet

Pulls environment detail inward.

### Repulsor

Pushes it outward.

### Portal

Creates stronger inward suction-like displacement.

WebGL applies the force during procedural environment sampling.

Canvas applies the same force to far/near particle positions.

Reduce Motion sets the force displacement to zero through the existing environment motion scale.

## Coupling ambience

The total bounded strength of active Orb proximity relationships contributes a very small shared atmospheric illumination term.

This helps dense musical clusters feel coherent without becoming a full global-lighting system.

Phase 9 still owns deliberate listener/light propagation.

## Density simplification

Cross-system work is bounded by:

- maximum 12 Orbs;
- capped strongest Orb pairs;
- maximum 5 Fields;
- maximum 5 Field intersections;
- one strongest environmental toy force;
- one strongest toy influence per object where applicable;
- five Field samples per Link.

The renderer never constructs the full combinatorial interaction graph.

## Reduced effects

### Reduce Motion

- stops particle-force displacement;
- already reduces drag wake input;
- keeps static proximity/aura relationships;
- keeps Field-aware Link geometry because it communicates spatial state.

### Reduce Glow

- strongly reduces Orb aura bridge intensity;
- retains enough proximity feedback to remain understandable.

### Reduce Particles

- removes particle-like effects from earlier phases;
- does not remove cross-system geometry or Field-aware Links.

## State boundary

Cross-system visual interaction does not:

- create Links;
- move Orbs;
- change Field geometry;
- change toy physics;
- change Link semantics;
- create history;
- trigger autosave;
- alter audio scheduling;
- enter WorldDocument.

## Phase 9 handoff

Phase 9 — Links, Listener & Light Propagation can now build on:

- Field-aware Link geometry;
- Orb proximity lighting;
- coupling bridges;
- shared environment interaction;
- Field/toy material coupling.

Phase 9 should deepen deliberate light transport and listener identity rather than rebuilding these spatial relationships.
