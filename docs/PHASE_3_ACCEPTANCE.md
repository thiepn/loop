# Phase 3 — Sound Orbs & Core Playground Acceptance

## World model
- [x] World schema advanced to version 3.
- [x] Sound Orbs are real serializable documents rather than placeholder ids.
- [x] Orb positions use normalized coordinates.
- [x] Orb mute state is serializable.
- [x] V1 orb cap is enforced at 12.
- [x] First Orbit starter World contains six distinct built-in sounds.

## Spatial audio
- [x] Every runtime orb has an independent audio channel.
- [x] Horizontal movement controls stereo position.
- [x] Listener distance controls presence.
- [x] Pan is deliberately bounded.
- [x] Distant sounds retain a safe audible floor.
- [x] Spatial changes are smoothed.
- [x] Mute is smoothed rather than hard-disconnected.

## Playback
- [x] All orbs share one MusicalTransport.
- [x] All events use the Phase 2 lookahead scheduler.
- [x] Fixed Phase 3 patterns remain synchronized.
- [x] Runtime channels can be created/removed while the World exists.
- [x] The superseded FoundationGroove runtime has been removed.

## Direct manipulation
- [x] Sound Orbs are selectable.
- [x] Mouse drag works through Pointer Events.
- [x] Touch/stylus use the same pointer path.
- [x] Audio updates during drag preview.
- [x] World state commits after the drag.
- [x] Pointer cancellation preserves the last valid drag position.
- [x] Arrow-key nudging is supported.
- [x] Shift + arrow provides a larger nudge.

## Orb actions
- [x] Mute / Unmute.
- [x] Duplicate.
- [x] Delete.
- [x] Duplicate offsets the copy.
- [x] Duplicate respects the 12-orb cap.
- [x] Delete removes only the requested orb.
- [x] Selection follows a newly duplicated orb.

## Visual system
- [x] Full-screen bounded World replaces the Phase 2 hero/demo surface.
- [x] Listener center is visually explicit.
- [x] Orbs have role-specific size/color/animation.
- [x] Muted state is visually distinct.
- [x] Selected state is visually distinct.
- [x] Scheduled sound events produce near-audio-time visual pulses.
- [x] Canvas remains the dominant UI surface.
- [x] Contextual controls are compact and non-technical.
- [x] Responsive mobile sizing exists.
- [x] Reduced-motion behavior remains supported.

## Regression coverage
Automated tests cover:
- spatial mapping;
- stereo bounds;
- distance/presence behavior;
- immutable World move/mute/delete/duplicate operations;
- coordinate clamping;
- duplicate offset;
- 12-orb cap;
- starter-World catalog integrity;
- starter-World role coverage;
- all Phase 1 and Phase 2 tests.

## Scope protection
- [x] No Add palette implemented early.
- [x] No editable sequencer implemented early.
- [x] No Effect Fields implemented early.
- [x] No Motion system implemented early.
- [x] No DAW mixer introduced.
- [x] No persistence or recording pulled forward.

## Exit condition
Phase 3 is complete only when the exact final main head passes:
- dependency installation;
- strict TypeScript typecheck;
- complete unit-test suite;
- production Vite build.

CI verification is recorded after the final Phase 3 documentation/status commits.
