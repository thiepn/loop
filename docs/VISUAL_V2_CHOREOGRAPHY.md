# Loop — Visual V2 Musical Choreography

## Status

Phase 10 implementation is present on the Visual V2 track.

## Goal

Phase 10 coordinates the Visual V2 systems as one musical performance.

The renderer does not invent musical timing.

All bar/downbeat/simultaneous/phrase/silence cues derive from the existing LookaheadScheduler and MusicalTransport, while play/stop/recording cues derive from real application state transitions.

## Single timing authority

`PlaygroundEngine` now exposes a read-only choreography subscription.

A choreography activity contains:

- scheduler audio time;
- absolute step;
- step within the 16-step bar;
- bar number;
- position within a four-bar visual phrase;
- scheduler-derived bar duration;
- active unmuted Orb count;
- audible Orb events scheduled on that tick;
- previous bar audible-event count;
- number of prior silent bars;
- silence re-entry state.

The App schedules the renderer callback with the same audio-context delay calculation already used for Orb/Link pulses.

No visual interval or beat clock exists.

## Callback budget

The engine does not forward every sixteenth-note tick.

A renderer choreography callback is emitted only when:

- a bar begins;
- two or more audible Orb events occur on one scheduler tick;
- sound re-enters after one or more silent bars.

The engine still observes every scheduler tick internally to maintain accurate bar/silence counts.

## Play wake-up

When `playing` changes false → true, the renderer emits one bounded play cue.

It coordinates:

- listener energy;
- a central World wake;
- small shared Orb lift/brightness;
- restrained Link emphasis.

It does not delay playback.

## Stop / settle

When `playing` changes true → false:

- the environment darkens/settles;
- Orbs slightly reduce common material energy;
- the listener releases energy.

Existing object-specific state remains visible.

## Downbeats

A scheduler tick with `stepInBar === 0` creates a downbeat choreography hit.

Downbeat intensity is density-aware and can coordinate:

- listener;
- environment;
- Links;
- actual scheduled Orb pulses.

Inactive Orbs are not falsely shown as producing sound; they receive only the small shared material wake/breath component.

## Simultaneous events

If two or more audible Orb hits are scheduled on the same scheduler tick, the choreography hit records the extra simultaneous count.

The visual model converts that into a bounded intensity contribution.

Four or more simultaneous extras already saturate the simultaneous visual scale.

## Four-bar phrase structure

Visual phrase cadence uses existing bar numbers:

- phrase position 0 → boundary/release;
- position 1 → neutral;
- position 2 → neutral;
- position 3 → gradual build.

The position-3 bar event lasts exactly one scheduler-derived bar duration, allowing the visual build to progress across the bar without another timer.

At the next non-initial position-0 boundary, the World receives a bounded release/bloom.

This is presentation-only and does not alter musical phrases.

## Silence detection

The engine tracks audible Orb events scheduled per bar.

At the next bar boundary:

- if the previous bar contained zero audible Orb events, the new bar is marked visually silent;
- continued silent bars renew the calm state;
- muted/empty musical behavior is therefore reflected without audio analysis.

Silence settles:

- atmosphere;
- listener energy;
- common object emphasis.

## Comeback / re-entry

After one or more silent bars, the first audible scheduler tick receives a re-entry flag.

Re-entry has higher wake priority than ordinary downbeat emphasis.

The same scheduler tick remains responsible for the real Orb events, so the comeback visual lands with actual sound.

## Bass compression

Scheduled Bass Orb pulses produce a dedicated choreography compression scalar.

The environment uses it to increase center pressure / outer falloff rather than simply adding another glow.

## Transient pressure waves

Beat and Percussion Orb events generate a bounded pressure cue and phase.

WebGL renders the pressure through the World shader.

Canvas renders an expanding listener-centered ring.

Downbeats, simultaneous hits and re-entry may reinforce the pressure value.

Reduce Motion freezes pressure travel while retaining the pressure-state cue.

## Harmony palette bloom

Harmony activity contributes to a shared palette bloom.

Voice activity contributes at lower weight.

Four-bar phrase build/release and multi-role simultaneous events can reinforce that bloom.

This gives harmonic sections broader color response without making every Orb identical.

## Role balance

The choreography model tracks distinct Sound roles active in the current event sample.

Role spread only affects shared bloom/intensity scaling.

Individual Sound role material identity remains unchanged.

## Recording choreography

Renderer state observes `captureStatus`.

Transitions produce:

- record-start cue;
- record-stop cue.

The cues affect listener/environment color/energy while the persistent recording listener state from Phase 9 remains authoritative.

No capture lifecycle is delayed.

## Choreography priority

The visual model resolves competing signals approximately as:

1. re-entry / play wake;
2. phrase release;
3. downbeat;
4. simultaneous hit;
5. phrase build;
6. silence / stop settle.

Values are bounded rather than stacked without limit.

At object level, the shared choreography contribution is intentionally much weaker than direct Orb/Link event response.

## Density-aware intensity

Active unmuted Orb count is normalized against the existing 12-Orb cap.

Density scales broad choreography such as:

- pressure;
- phrase bloom;
- simultaneous-event intensity.

Dense Worlds therefore become broader, not simply brighter everywhere.

## Environment choreography

The environment now consumes:

- wake;
- settle;
- pressure and pressure phase;
- phrase build;
- phrase release;
- silence;
- re-entry;
- Bass compression;
- Harmony bloom;
- record-start;
- record-stop.

WebGL handles these inside the procedural World shader.

Canvas uses equivalent gradients, rings, tint and settling overlays.

## Orb choreography

Orb materials consume a deliberately small shared choreography energy:

- play wake;
- downbeat;
- phrase release;
- re-entry.

Stop/settle reduces shared Orb energy slightly.

Direct Orb pulse events remain much stronger and continue to communicate actual sound activity.

## Link choreography

Links receive a bounded global choreography boost during:

- downbeats;
- phrase releases;
- re-entry;
- play wake.

Their real scheduled packets remain the primary indication of actual Link activity.

## Listener choreography

The Phase 9 listener adds energy for:

- play wake;
- downbeat;
- phrase release;
- re-entry;
- recording start/stop.

Listener arrival from real Orb packets remains intact.

## Reduced Motion

Reduce Motion:

- freezes pressure-wave travel;
- leaves wake/settle state changes;
- leaves palette/brightness choreography;
- leaves listener/downbeat state response;
- does not remove actual event identity.

## Performance policy

Phase 10 adds no permanent animation loop.

Long-running phrase build and silent-bar state use the existing demand-driven VisualEventBridge lifetime derived from the scheduler's bar duration.

The renderer remains active only while a real visual event or existing Motion source requires frames.

## State boundary

Choreography does not:

- change patterns;
- change tempo;
- alter scheduler timing;
- add musical hits;
- move objects;
- change Links;
- change Field DSP;
- enter WorldDocument;
- create history;
- trigger autosave.

## Phase 11 handoff

Phase 11 — Magic, Portal, Snapshot & State Transitions can now use the same choreography/event infrastructure for deliberate cinematic state changes without introducing another timing system.
