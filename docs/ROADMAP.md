# Loop — Closed V1 Development Roadmap

This roadmap is intentionally finite. Phases 0–13 build the product. After Phase 13, feature development stops and Phases 14–18 only audit, fix, certify, and ship.

## Phase 0 — Product Consolidation & Specification Lock
Create and lock the product contract, interaction model, visual system, audio contract, V1 scope, and non-goals.

## Phase 1 — Clean Repository, Architecture & Deployment Foundation
Set up TypeScript, Vite, test tooling, modular state/audio/world architecture, asset loading, GitHub Pages-safe base paths, and CI.

## Phase 2 — Musical Core & Smart Sound System
Implement transport, quantized scheduling, curated asset metadata, loop synchronization, tonal compatibility, normalization, and master safety.

## Phase 3 — Sound Orbs & Core Playground
Build the central canvas, listener, draggable Sound Orbs, spatial position-to-sound mapping, selection, mute, duplicate/delete, and sound-reactive orb visuals.

## Phase 4 — Zero-Friction Home, Sound Palette & Onboarding
Implement starter Worlds, human-readable Add flow, immediate playback, and the minimal self-teaching onboarding sequence.

## Phase 5 — Playful Beat & Melody Creation
Add simple rhythm steps, scale-locked melody painting, controlled density/groove tools, and non-technical pattern variation.

## Phase 6 — Effect Fields
Build Space, Echo, Heat, Frost, and Filter as spatially continuous audiovisual playground objects.

## Phase 7 — Motion Playground
Add Still, Orbit, Bounce, Drift, Follow, and Wander plus the first bounded toy set: Spinner, Magnet, Repulsor, and Portal.

## Phase 8 — Links & Reactive Music
Add understandable inter-orb relationships such as Pulse Together, Take Turns, Follow, Kick Pushes Bass, and Copy Movement.

## Phase 9 — Magic, Mutation & Controlled Randomness
Add seeded, undoable, role-aware per-object Magic and global Remix with bounded musical intent controls.

## Phase 10 — Worlds, Snapshots & Persistence
Implement IndexedDB-backed Worlds, autosave/restore, duplication/deletion, Snapshots, and reliable state hydration.

## Phase 11 — Play, Capture & Export
Add simple master recording and straightforward audio export without studio-style routing.

## Phase 12 — Visual Identity, Game Feel & Delight
Complete the major visual pass, particles, trails, field identities, sound-reactive motion, transitions, performance quality levels, and cohesive brand feel.

## Phase 13 — Mobile, PWA & Offline Hardening
Finish touch layouts, pointer behavior, service worker, manifest, offline shell/assets, installability, update behavior, and GitHub Pages deployment compatibility.

# Feature Freeze

After Phase 13:
- no new creative systems;
- no new studio features;
- no new experimental DSP;
- no roadmap expansion.

Only defects and release blockers may change the product.

## Phase 14 — Functional & Data-Integrity Audit — complete
Systematically tested audio lifecycle, scheduler gaps, object manipulation, Motion, Links, Magic transactions, Snapshot recall, undo/redo, IndexedDB/autosave, Trash/import/backup, recording, PWA lifecycle, pointer cancellation, rapid navigation, corrupted data, and cross-feature interactions. Confirmed defects were fixed without reopening feature scope. See [PHASE_14_ACCEPTANCE.md](PHASE_14_ACCEPTANCE.md).

## Phase 15 — UX, Accessibility & Regression Audit
Run beginner-first usability review, technical-language purge, interaction regression matrix, keyboard/focus checks, contrast, reduced-motion support, touch targets, and cross-feature regressions.

## Phase 16 — Performance & Soak Certification
Measure FPS, long tasks, memory growth, audio underruns, latency, startup, persistence, background/foreground recovery, recording duration, and maximum supported World complexity.

## Phase 17 — Release Candidate
Produce `v1.0.0-rc.1`, run the complete clean-user workflow across supported browsers/devices, and repeat RC fixes until no release blocker remains.

## Phase 18 — Production Release & GitHub Pages
Run clean CI, deploy the certified build to GitHub Pages, smoke-test the real production URL and PWA behavior, then tag `v1.0.0`.

## Scope authority
If a later phase conflicts with `PRODUCT.md`, `V1_SCOPE.md`, or `NON_GOALS.md`, the product contract wins. Change the contract explicitly before changing the product direction.
