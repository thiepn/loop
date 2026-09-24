# Loop — Play, Capture & Export

## Status
Phase 11 implementation contract.

Phase 11 records the **master experience the user actually hears**.

It does not introduce tracks, stems, buses, routing, microphones, or a studio bounce workflow.

## Product flow

The playground dock exposes:

**● Record**

Pressing Record:
1. ensures Loop audio/playback is running;
2. creates a temporary post-limiter master capture tap;
3. begins browser recording;
4. shows live elapsed time.

Pressing the same button again stops recording.

While recording, users can continue:
- dragging Sound Orbs;
- using Effect Fields;
- using Motion and toys;
- triggering Links;
- using Magic;
- recalling Snapshots;
- changing patterns;
- starting/stopping musical playback.

Those audible actions become part of the captured performance.

## Master capture point

The existing master graph remains:

Sound Orbs
→ EffectRack
→ SpatialVoice
→ master gain
→ safety limiter
→ speakers

Phase 11 temporarily adds:

safety limiter
→ MediaStreamAudioDestinationNode
→ MediaRecorder

The recording therefore receives the same limited master signal sent to the listener.

Recording never creates another AudioContext.

The capture tap exists only during an active recording and is disconnected/disposed afterward.

## No microphone permission

Phase 11 records Loop's Web Audio output.

It does not call:
- getUserMedia();
- microphone APIs;
- camera APIs.

The user is not asked for microphone permission.

## Browser recording format

MediaRecorder output format is browser-dependent.

Loop asks the browser which formats it supports and prefers:

1. audio/webm;codecs=opus
2. audio/ogg;codecs=opus
3. audio/mp4
4. audio/webm
5. audio/ogg

If none of those explicit choices report support, Loop lets MediaRecorder choose its default.

If a preferred MIME type reports support but its constructor still fails, Loop retries with the browser default before giving up.

The final download extension derives from the actual MediaRecorder/chunk MIME type.

Typical labels:
- WebM / Opus
- Ogg / Opus
- MPEG-4 Audio
- browser-selected audio

The browser recording file is the primary guaranteed export.

## Recording bitrate

Loop requests approximately:

**160 kbit/s audio**

This is an encoder hint rather than a promise that every browser will use exactly that rate.

## Chunking

MediaRecorder starts with a:

**1 second timeslice**

This keeps the browser delivering bounded Blob chunks during recording rather than retaining one single opaque recording chunk until the end.

Chunks are still accumulated in memory for the finished V1 download.

## Maximum recording duration

One capture is capped at:

**10 minutes**

The recorder service enforces this independently of UI state.

At the limit:
- recording stops;
- the captured performance is finalized;
- the result sheet explains that the safety limit was reached.

At 160 kbit/s, the compressed target size remains in a browser-friendly range rather than allowing indefinite memory growth.

Phase 16 will perform longer soak/performance certification around real browser behavior.

## Background behavior

When the document becomes hidden while recording, Loop stops/finalizes the recording.

Reason:
mobile/desktop browsers may suspend or throttle Web Audio/background execution differently.

Stopping produces a known complete artifact instead of pretending background capture is reliable across platforms.

Pending World autosave still flushes through the Phase 10 visibility handler.

## Browser-initiated stop/error

MediaRecorder can stop independently because of resource/stream/browser failure.

MasterRecorder distinguishes:
- user-requested Stop;
- browser-initiated Stop;
- recorder Error.

If the browser stops but emitted usable chunks:
- Loop preserves those chunks;
- builds the result;
- tells the user that recording stopped unexpectedly.

A recorder error:
- cleans the capture tap;
- clears timers/object URLs;
- returns the UI to a recoverable error state.

The user can start another recording.

## Result sheet

After a successful capture, Loop shows:

- duration;
- actual browser format;
- an audio playback control;
- Download Audio;
- Download WAV when available;
- New Recording;
- Discard.

The performance result is transient application state.

It is not added to:
- WorldDocument;
- Snapshots;
- IndexedDB;
- undo/redo history;
- JSON World backup.

Navigating away from the World discards the transient result and revokes its object URL.

## Native download

**Download Audio** saves the original MediaRecorder Blob.

This path does not transcode the browser output.

It is therefore the lowest-risk export path and remains available for every successful capture.

## WAV conversion

Loop also contains a PCM16 WAV encoder.

For captures up to:

**3 minutes**

Loop attempts:

browser recording Blob
→ AudioContext.decodeAudioData()
→ interleaved PCM16
→ RIFF/WAVE Blob

WAV conversion is offered only if decoding succeeds.

If the browser cannot decode its own MediaRecorder container through Web Audio:
- recording itself still succeeds;
- Download Audio remains available;
- Download WAV is hidden.

### Why the 3-minute conversion limit
Decoded stereo PCM is much larger than compressed MediaRecorder data.

Automatically decoding a ten-minute stereo capture can require hundreds of MB of transient memory.

Phase 11 therefore treats WAV as a convenience path where practical rather than risking the whole playground for a format conversion.

## WAV format

Current WAV output:
- RIFF/WAVE
- PCM format 1
- 16-bit integer samples
- source AudioBuffer sample rate
- source channel count
- interleaved samples
- samples clamped to -1…1

No normalization/mastering is added during conversion.

The WAV represents the already-limited captured master.

## Download lifecycle

Download object URLs are temporary.

Loop:
1. creates an object URL;
2. attaches a hidden anchor;
3. triggers download;
4. removes the anchor;
5. revokes the URL.

The longer-lived preview URL is revoked when:
- the result is discarded;
- a new recording replaces it;
- the World/Home changes;
- App is destroyed.

## One recording at a time

MasterRecorder has explicit states:
- idle
- recording
- stopping

A second recording cannot begin while another is active.

Repeated Stop calls reuse the same stop Promise rather than producing duplicate files.

## Capture UI state

AppState stores only transient presentation information:
- status;
- start time;
- elapsed duration;
- preview URL;
- format label;
- WAV availability;
- auto-stop indicator;
- error message.

The actual original Blob and optional WAV Blob stay in App runtime memory.

This prevents binary recording data from leaking into immutable World state.

## Relationship to playback

Record is performance-oriented.

If playback is stopped when Record is pressed:
- Loop uses the same user gesture to initialize/resume Web Audio;
- starts the World;
- begins capture around that startup.

PlaygroundEngine already schedules its first music slightly ahead of current AudioContext time, giving the recording path time to attach before the audible first event.

Stopping recording does **not** automatically stop World playback.

The user may keep playing after capture is complete.

## Platform capability

Recording availability requires browser MediaRecorder support.

If unavailable:
- the Record button is disabled;
- the musical playground remains fully usable.

Recording is an enhancement to the World, not a startup requirement.

## Testing

Pure tests cover:
- MIME preference ordering;
- MIME → safe download extension mapping;
- unsupported explicit format fallback;
- PCM16 WAV RIFF header;
- sample rate/channel metadata;
- stereo interleaving;
- sample clamping;
- malformed WAV input rejection.

Recorder-service tests use a fake MediaRecorder to cover:
- 1-second chunking start;
- chunk collection;
- Stop finalization;
- capture-tap cleanup;
- Cancel cleanup;
- 10-minute-limit callback mechanism;
- browser-initiated unexpected Stop preservation.

## Scope boundary

Phase 11 does not add:
- microphone recording;
- voice-over recording;
- video/screen recording;
- stems;
- multitrack capture;
- per-orb audio files;
- mixer routing;
- offline DAW bounce;
- mastering;
- MP3 encoder;
- cloud upload/share;
- persistent recording library.

The next phase focuses on game feel and visual identity, not deeper production tooling.

## Acceptance principle

Phase 11 succeeds when a beginner can:

1. press Record;
2. play with the World normally;
3. see that recording is active and how long it has run;
4. press Stop;
5. immediately listen back;
6. download the captured audio;
7. download WAV when safely available;
8. discard and try again;
9. never encounter tracks, buses, codecs, bit depth, routing, or bounce settings in the normal creative flow.
