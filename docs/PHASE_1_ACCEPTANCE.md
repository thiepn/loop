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

## Exit condition
Phase 1 is complete only when a clean install can typecheck, run tests, and produce the production Vite build.
