# Phase 11 — Play, Capture & Export Acceptance

## Audio graph
- [x] Recording captures post-master-limiter output.
- [x] Recording does not create another AudioContext.
- [x] Capture tap is temporary.
- [x] Capture tap is disposed on Stop.
- [x] Capture tap is disposed on Cancel.
- [x] Capture tap is disposed on errors/navigation/app teardown.
- [x] Recording does not require microphone permission.

## MediaRecorder
- [x] MediaRecorder capability is detected.
- [x] Unsupported browsers keep the playground usable.
- [x] MIME support is checked with MediaRecorder.isTypeSupported when available.
- [x] WebM/Opus is preferred where supported.
- [x] Ogg/Opus is considered.
- [x] MPEG-4 audio is considered.
- [x] Browser default is used when explicit preferences are unavailable.
- [x] Browser default is retried if preferred construction fails.
- [x] Actual output MIME/chunk MIME determines extension.
- [x] Requested audio bitrate is bounded.
- [x] Recorder starts with 1-second chunks.

## Recording lifecycle
- [x] Only one recording can run at once.
- [x] Record can start playback/audio when needed.
- [x] Stop finalizes without stopping World playback.
- [x] Cancel discards the active capture.
- [x] New Recording replaces/revokes the prior result.
- [x] Result is discarded when navigating away.
- [x] Result is discarded on App teardown.
- [x] Object URLs are revoked.
- [x] Browser-initiated Stop preserves emitted chunks.
- [x] Browser recorder errors return to recoverable UI state.
- [x] Empty browser recording is treated as failure.

## Duration / long capture
- [x] Live duration is visible.
- [x] Capture duration updates without changing World state.
- [x] Hard recording limit is 10 minutes.
- [x] Limit callback stops/finalizes the recording.
- [x] Result identifies a safety-limit stop.
- [x] Hiding/backgrounding the document stops/finalizes recording.
- [x] Long recording does not trigger automatic WAV decoding.

## Capture UI
- [x] Playground dock has a Record button.
- [x] Recording state is visually distinct.
- [x] Record button becomes Stop while recording.
- [x] Live recording bar exists.
- [x] Cancel exists during recording.
- [x] Result sheet has audio playback.
- [x] Result sheet shows duration.
- [x] Result sheet shows browser format.
- [x] Download Audio exists.
- [x] Download WAV appears only when available.
- [x] New Recording exists.
- [x] Discard exists.
- [x] Recording UI remains non-technical.

## Export
- [x] Native browser recording Blob can download.
- [x] Download extension follows actual media type.
- [x] Download uses a temporary DOM anchor.
- [x] Download URL is revoked.
- [x] Filename derives safely from World name.

## WAV
- [x] PCM16 RIFF/WAVE encoder exists.
- [x] WAV preserves decoded sample rate.
- [x] WAV preserves decoded channel count.
- [x] WAV interleaves channels.
- [x] WAV samples clamp to legal range.
- [x] WAV conversion is optional.
- [x] WAV conversion failure never invalidates original capture.
- [x] Automatic WAV conversion limit is 3 minutes.
- [x] Longer captures keep native Download Audio.

## State / persistence
- [x] Recording does not modify WorldDocument.
- [x] Recording does not create World-history entries.
- [x] Recording Blobs are not saved to IndexedDB.
- [x] Recording Blobs are not saved to Snapshots.
- [x] Recording Blobs are not included in JSON World backups.
- [x] Capture state is transient AppState/runtime state only.
- [x] Phase 10 autosave remains independent.

## Cross-feature behavior
- [x] Motion can continue while recording.
- [x] Effect Fields can continue while recording.
- [x] Links can continue while recording.
- [x] Magic can be performed while recording.
- [x] Snapshot recall can occur during recording.
- [x] Pattern edits can occur during recording.
- [x] Stopping musical playback while recording is allowed.
- [x] Stopping recording leaves musical playback independent.

## Automated coverage
Tests cover:
- recording MIME negotiation;
- fallback when explicit preferences are unsupported;
- MIME extension mapping;
- WAV header metadata;
- WAV stereo interleaving;
- WAV sample clamping;
- WAV invalid-input rejection;
- recorder chunk start;
- recorder Stop result;
- recorder tap cleanup;
- recorder Cancel cleanup;
- duration-limit callback;
- unexpected browser Stop preservation;
- all Phase 1–10 regression tests.

## Scope protection
- [x] No microphone capture.
- [x] No video capture.
- [x] No stems.
- [x] No multitrack recorder.
- [x] No per-orb export.
- [x] No mixer/bus routing.
- [x] No mastering controls.
- [x] No studio bounce dialog.
- [x] No cloud upload.
- [x] No recording library.

## Exit condition
Phase 11 is complete only when the exact final main head passes:
- dependency installation;
- strict TypeScript typecheck;
- complete unit-test suite;
- production Vite build.

Final CI result is recorded after documentation/status commits.
