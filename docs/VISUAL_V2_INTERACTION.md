# Loop — Visual V2 Physical Interaction & Object Game Feel

## Status

Phase 5 implementation is present on the Visual V2 track.

## Goal

Phase 5 makes existing Loop objects feel physically graspable without changing their actual interaction rules.

The semantic DOM remains the input authority. The renderer observes those interactions and adds presentation-only responses.

## Orb interaction states

Each rendered Orb now has a bounded runtime interaction state:

- hover strength;
- hover direction;
- grabbed state;
- drag direction;
- normalized drag speed;
- long-press charge state.

These values never enter `WorldDocument`.

## Proximity hover

Mouse and pen pointers create a short-range magnetic response around nearby Orbs.

Behavior:

- response begins only inside a bounded proximity radius;
- strength follows a smooth curve rather than snapping on;
- the visual body shifts only a few pixels toward the pointer;
- the body lifts/scales slightly;
- the effect never changes the DOM hit target or saved position.

Touch does not synthesize hover.

## Grab / lift

Pointer-down on an Orb immediately adds:

- visual lift;
- stronger depth/shadow;
- grabbed brightness;
- suppression of hover drift.

The actual pointer capture and drag behavior remain in the existing `PlaygroundView`.

## Velocity stretch

While dragging, the renderer derives bounded velocity from pointer movement in pixel space.

The Orb then:

- stretches along the movement direction;
- compresses slightly perpendicular to travel;
- strengthens its atmospheric wake.

The velocity scalar is clamped and cannot create unbounded deformation.

## Drop / spring settle

Pointer-up creates a short `orb-drop` visual event containing:

- Orb id;
- rendered position;
- last drag direction;
- bounded intensity.

The material uses a damped oscillating settle envelope to create:

- small overshoot;
- return;
- secondary settle.

The environment keeps a short residual wake.

The event expires automatically and creates no history.

## Long-press charge

Holding an Orb without moving more than 9 px for 420 ms triggers a visual charge state.

Charge produces:

- stronger lift;
- material charge ring;
- temporary luminous response.

Moving beyond the cancellation threshold prevents accidental long-press charge while dragging.

Long press does not add a new product action in Phase 5; it is interaction feedback only.

## Selection spotlight

When one Orb is selected:

- the environment darkens only a few percent;
- a local atmospheric light pool forms around the selected Orb;
- non-selected Orb materials reduce emphasis slightly;
- labels and controls remain unchanged.

This creates visual hierarchy without hiding surrounding objects.

## Atmospheric drag wake

The World now knows the strongest active drag interaction.

Dragging an Orb produces a bounded local wake that affects:

- haze;
- procedural far/near particles;
- local atmospheric light.

The wake follows the rendered Orb position and drag direction.

On release, the `orb-drop` event carries a decaying residual wake.

## Particle displacement

Environment particles within the wake region shift along the drag direction.

Depth controls the amount:

- far particles move less;
- near particles move more.

Reduce Motion removes directional displacement.

## Interaction shadows

Lifted/grabbed Orbs receive stronger local depth treatment.

Canvas2D renders a bounded elliptical shadow.

WebGL material lift and aura provide the equivalent depth cue without adding a separate shadow pass.

## Field resize tension

The renderer observes the existing Field resize handle in capture phase before the existing Field handler stops propagation.

While resizing:

- distance from the initial radius produces normalized tension;
- a larger low-alpha Field envelope appears;
- tension increases as the pointer stretches away from the initial radius.

Field movement receives a smaller generic lifted state.

Actual Field geometry and commit logic remain unchanged.

## Keyboard-equivalent feedback

Focused Orbs already have a dedicated Phase 4 focus state.

Phase 5 adds physical response to arrow-key movement:

- the key direction generates a small bounded settle/nudge event;
- Reduce Motion keeps only a very small response;
- the DOM keyboard movement remains authoritative.

Keyboard users therefore receive equivalent state confirmation without pointer-only effects.

## Pointer / touch parity

Mouse:
- proximity hover;
- grab;
- drag stretch;
- drop settle;
- long press.

Pen:
- same as mouse where hover exists;
- grab/drag/drop/long press.

Touch:
- grab;
- drag stretch;
- drop settle;
- long press;
- no synthetic hover.

## Pointer cancellation

`pointercancel` uses the same cleanup path as release:

- long-press timer is cleared;
- grab state ends;
- Field tension resets;
- transient settle remains bounded;
- no stale renderer interaction state survives.

## Reduce Motion

Reduce Motion preserves state but suppresses travel-heavy behavior:

- hover positional shift is removed;
- drag wake direction is removed;
- drag stretch is strongly reduced;
- drop travel is removed/reduced;
- Field tension remains but is capped;
- lift, focus, selection and brightness feedback remain.

## State boundary

Interaction rendering does not:

- mutate creative positions;
- alter pointer capture;
- alter hit testing;
- create undo entries;
- trigger autosave;
- affect audio scheduling;
- modify Motion evaluation;
- modify Field geometry.

## Phase 6 handoff

Phase 6 can now replace the remaining DOM trail-point system with renderer-level kinetic graphics.

It can rely on:

- authoritative live Orb position;
- bounded drag velocity;
- drag direction;
- Field influence;
- toy influence;
- role material identity;
- reduced-motion policy.
