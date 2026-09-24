# Visual V2 Phase 5 — Physical Interaction & Object Game Feel Acceptance

## Hover
- [x] bounded proximity hover exists for mouse/pen.
- [x] hover strength follows a smooth curve.
- [x] hover visual offset is bounded.
- [x] hover does not change hit geometry.
- [x] touch does not synthesize hover.
- [x] pointer leave clears hover state.

## Grab / drag
- [x] pointer-down creates visual grab state.
- [x] grab adds visual lift.
- [x] drag velocity is derived in pixel space.
- [x] drag direction is normalized.
- [x] drag speed is bounded.
- [x] materials stretch along velocity.
- [x] materials compress across velocity.
- [x] renderer does not replace existing pointer capture.

## Drop / settle
- [x] pointer release emits bounded Orb drop event.
- [x] drop carries rendered position.
- [x] drop carries last drag direction.
- [x] settle uses damped oscillation.
- [x] repeated drop events for one Orb coalesce.
- [x] drop events expire automatically.
- [x] no drop event changes creative state.

## Long press
- [x] long-press threshold is 420 ms.
- [x] movement beyond 9 px cancels charge.
- [x] charge is presentation-only.
- [x] charge has bounded material ring.
- [x] repeated charge events coalesce.
- [x] timer clears on release/cancel/destroy.

## Selection / focus
- [x] selected Orb creates local World spotlight.
- [x] environment dims only subtly.
- [x] non-selected Orb materials de-emphasize slightly.
- [x] keyboard focus remains independent from selection.
- [x] focus remains visible through DOM and material fallback.

## Environment wake
- [x] strongest active drag drives environment wake.
- [x] wake uses live rendered Orb position.
- [x] wake uses drag direction.
- [x] near/far particles receive depth-scaled displacement.
- [x] drop leaves short residual wake.
- [x] wake is removed/reduced by Reduce Motion.

## Field tension
- [x] existing resize handle is observed in capture phase.
- [x] resize tension derives from distance relative to initial radius.
- [x] tension is bounded.
- [x] resize produces a larger low-alpha Field envelope.
- [x] Field movement receives a lighter lifted state.
- [x] actual Field geometry remains authoritative in EffectFieldView.

## Keyboard / touch
- [x] arrow-key movement receives bounded physical feedback.
- [x] touch supports grab/drag/drop/long press.
- [x] mouse supports hover/grab/drag/drop/long press.
- [x] pen uses the same bounded interaction path.
- [x] pointer cancellation clears runtime state.

## Reduced effects
- [x] Reduce Motion removes hover travel.
- [x] Reduce Motion removes drag direction displacement.
- [x] Reduce Motion strongly reduces stretch/settle intensity.
- [x] Field tension remains as non-travel state feedback.
- [x] selection/focus/grab state remains visible.

## Architecture
- [x] interaction state lives outside WorldDocument.
- [x] SceneAdapter projects interaction state.
- [x] renderer remains presentation-only.
- [x] no new permanent animation loop is introduced.
- [x] transient events use existing demand-driven clock.
- [x] existing Motion RAF remains authoritative when active.

## Tests
- [x] pointer normalization/clamping is covered.
- [x] hover falloff/bounds are covered.
- [x] drag direction/speed are covered.
- [x] long-press threshold/cancel distance are covered.
- [x] Field resize tension is covered.
- [x] settle/charge envelopes are covered.
- [x] transient Orb response extraction is covered.
- [x] drop/charge event coalescing is covered.
- [x] drag wake/spotlight dynamics are covered.
- [x] reduced-motion wake behavior is covered.

## State protection
- [x] no World schema change.
- [x] no persistence migration.
- [x] no audio engine change.
- [x] no hit-test geometry change.
- [x] no undo/history change.
- [x] no autosave behavior change.

## Exit condition

Phase 5 is complete only when the exact final Phase 5 head passes:

- strict TypeScript typecheck;
- complete unit/soak suite;
- production build;
- Phase 16 browser certification without relaxing its budgets.
