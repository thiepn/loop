# Phase 1 — Acceptance Checklist

## Repository
- [x] Vite + TypeScript project exists.
- [x] Runtime dependencies remain zero.
- [x] Current toolchain versions are pinned.
- [x] Node engine requirement is explicit.
- [x] Generated output and dependencies are ignored.

## Architecture
- [x] App bootstrap is isolated.
- [x] Audio lifecycle is isolated.
- [x] Generic state store is isolated.
- [x] World document/schema boundary exists.
- [x] Static asset loader is GitHub Pages base-aware.
- [x] Platform capability detection is centralized.
- [x] Fatal startup fallback exists.

## Testing
- [x] Store tests exist.
- [x] World construction tests exist.
- [x] Asset path tests exist.
- [x] CI runs typecheck, tests, and production build.

## GitHub Pages readiness
- [x] Vite base is /loop/.
- [x] public assets can resolve beneath /loop/.
- [x] HTML uses relative public favicon path.
- [x] Deployment is intentionally deferred until release rather than publishing an unfinished app.

## Scope
- [x] No Phase 2 transport/scheduling system implemented early.
- [x] No Sound Orb gameplay implemented early.
- [x] No studio/DAW/acoustics scope reintroduced.
- [x] Phase 0 product contract remains authoritative.

## Verification result

GitHub Actions verification passed on the Phase 1 code head after correcting two strict TypeScript issues found by CI:
- optional fetch signals are no longer passed as explicit `undefined` under `exactOptionalPropertyTypes`;
- the audio state type now follows the current DOM `AudioContextState` union.

The successful verification covered:
- dependency installation;
- strict TypeScript typecheck;
- unit tests;
- production Vite build.

## Exit condition
- [x] A clean GitHub Actions install can typecheck, run tests, and produce the production Vite build.

**Phase 1 status: complete.**
