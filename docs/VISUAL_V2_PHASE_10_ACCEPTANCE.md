# Visual V2 Phase 10 — Musical Choreography Acceptance

## Timing authority
- [x] choreography derives from LookaheadScheduler ticks.
- [x] activities include scheduler audio time.
- [x] App uses existing audio-context delay scheduling.
- [x] no second beat/bar clock exists.
- [x] bar duration comes from MusicalTransport tempo.
- [x] callbacks are suppressed for ordinary non-choreographic sixteenth ticks.

## Play / stop
- [x] false → true playback emits play cue.
- [x] play cue creates World/listener wake.
- [x] play cue adds restrained Orb/Link common emphasis.
- [x] true → false playback emits stop cue.
- [x] stop settles World/common object energy.
- [x] playback is never delayed by choreography.

## Downbeat / simultaneous
- [x] stepInBar 0 is the downbeat cue.
- [x] downbeat intensity is bounded.
- [x] simultaneous audible Orb hits are counted.
- [x] simultaneous contribution saturates.
- [x] density scales broad response.
- [x] actual Orb pulses remain the primary sound indicator.

## Phrase
- [x] visual phrase cadence is four bars.
- [x] phrase position derives from scheduler bar number.
- [x] position 3 builds across the scheduler-derived bar duration.
- [x] non-initial position 0 creates release.
- [x] bar 0 does not falsely create phrase release.
- [x] phrase choreography is presentation-only.

## Silence / re-entry
- [x] audible Orb events are counted per scheduled bar.
- [x] zero-event previous bar creates silent-bar state.
- [x] consecutive silent bars remain calm.
- [x] first audible tick after silence is marked re-entry.
- [x] re-entry has higher wake priority.
- [x] silence/re-entry does not use audio amplitude analysis.

## Roles
- [x] Bass activity drives compression scalar.
- [x] Beat/Percussion drive pressure.
- [x] Harmony drives palette bloom.
- [x] Voice contributes lower harmony bloom.
- [x] active role spread is bounded.
- [x] role-specific Orb materials remain distinct.

## Environment
- [x] wake is rendered.
- [x] settle is rendered.
- [x] expanding pressure is rendered.
- [x] phrase build/release is rendered.
- [x] silence is rendered.
- [x] re-entry is rendered.
- [x] Bass compression is rendered.
- [x] Harmony bloom is rendered.
- [x] recording start/stop cues are rendered.
- [x] WebGL shader ordering is valid on hardware.

## Orbs / Links / Listener
- [x] Orbs receive small shared choreography energy.
- [x] stop/silence can reduce common Orb energy.
- [x] Links receive bounded downbeat/phrase/re-entry boost.
- [x] real Link packets remain activity truth.
- [x] listener receives play/downbeat/phrase/re-entry energy.
- [x] listener recording identity from Phase 9 remains intact.
- [x] WebGL listener playing uniform is genuinely consumed.

## Recording
- [x] captureStatus recording transition emits record-start.
- [x] leaving recording emits record-stop.
- [x] cues do not delay MasterRecorder lifecycle.
- [x] persistent recording state remains authoritative.

## Reduced effects
- [x] Reduce Motion freezes pressure travel.
- [x] Reduce Motion preserves pressure-state feedback.
- [x] Reduce Glow policy from prior phases remains.
- [x] Reduce Particles does not remove structural choreography.

## Event budget
- [x] choreography-state events coalesce.
- [x] choreography-bar events coalesce.
- [x] hit events may overlap briefly.
- [x] bar event duration is bounded.
- [x] all choreography events expire automatically.
- [x] no permanent choreography RAF is introduced.

## Tests
- [x] play/stop frame is covered.
- [x] phrase build/release is covered.
- [x] initial-bar release suppression is covered.
- [x] downbeat/simultaneous pressure is covered.
- [x] silence/re-entry priority is covered.
- [x] Bass/Harmony role response is covered.
- [x] transient pressure phase is covered.
- [x] Reduce Motion pressure travel is covered.
- [x] recording cues are covered.
- [x] object/Link common emphasis is covered.
- [x] event coalescing/duration is covered.

## State protection
- [x] no World schema change.
- [x] no persistence migration.
- [x] no audio engine change.
- [x] no pattern semantic change.
- [x] no scheduler timing change.
- [x] no Link semantic change.
- [x] no hit-test geometry change.
- [x] no history/autosave change.

## Exit condition

Phase 10 is complete only when the exact final Phase 10 head passes:

- strict TypeScript typecheck;
- complete unit/soak suite;
- production build;
- Phase 16 browser certification without relaxing its budgets.
