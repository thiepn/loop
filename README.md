# Loop

**Loop is a visual music playground where anyone can create satisfying beats, loops, and soundscapes by moving, combining, transforming, and animating living sound objects.**

Loop is intentionally **not a DAW**. The product is designed first for people with little or no music-production knowledge and prioritizes immediate audiovisual play over studio workflows.

## Current status

- **Phase 0 — Product Consolidation & Specification Lock: complete**
- **Phase 1 — Clean Repository, Architecture & Deployment Foundation: complete and CI-verified**
- **Phase 2 — Musical Core & Smart Sound System: complete and CI-verified**
- **Phase 3 — Sound Orbs & Core Playground: complete and CI-verified**
- **Phase 4 — Zero-Friction Home, Sound Palette & Onboarding: complete and CI-verified**
- **Phase 5 — Playful Beat & Melody Creation: complete and CI-verified**
- **Phase 6 — Effect Fields: complete and CI-verified**
- **Phase 7 — Motion Playground: complete and CI-verified**
- **Phase 8 — Links & Reactive Music: complete and CI-verified**
- **Phase 9 — Magic, Mutation & Controlled Randomness: complete and CI-verified**
- **Phase 10 — Worlds, Snapshots & Persistence: complete and CI-verified**
- **Phase 11 — Play, Capture & Export: complete and CI-verified**
- **Phase 12 — Visual Identity, Game Feel & Delight: complete and CI-verified**
- **Phase 13 — Mobile, PWA & Offline Hardening: complete and CI-verified**
- **Phase 14 — Functional & Data-Integrity Audit: complete and CI-verified**
- **Phase 15 — UX, Accessibility & Regression Audit: complete and CI-verified**
- **V1 feature development remains frozen**
- **Next: Phase 16 — Performance & Soak Certification**

Loop's planned V1 product feature set is now implemented: the visual music playground works across responsive pointer/touch layouts, is installable as a scoped `/loop/` PWA, caches its built application shell for offline use, preserves local Worlds in IndexedDB, exposes non-disruptive update/offline/install state, and is now under feature freeze for audit/certification.

## Product contract

The authoritative specifications live in `docs/`:

- [PRODUCT.md](docs/PRODUCT.md) — product definition, audience, vocabulary, principles, success criteria
- [INTERACTIONS.md](docs/INTERACTIONS.md) — gestures, Sound Orbs, Effect Fields, Motion, Links, Magic, Snapshots
- [VISUAL_SYSTEM.md](docs/VISUAL_SYSTEM.md) — audiovisual language, orb identities, fields, motion, responsive behavior
- [AUDIO_SYSTEM.md](docs/AUDIO_SYSTEM.md) — timing, compatibility, automatic musical behavior, DSP boundaries
- [V1_SCOPE.md](docs/V1_SCOPE.md) — hard V1 feature boundary and feature-complete definition
- [NON_GOALS.md](docs/NON_GOALS.md) — explicit anti-goals preventing DAW/acoustics/platform scope creep
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — current runtime boundaries and dependency rules
- [MUSICAL_CORE.md](docs/MUSICAL_CORE.md) — timing, harmony, catalog, compatibility, and mix contracts
- [PLAYGROUND.md](docs/PLAYGROUND.md) — Sound Orb model, spatial behavior, direct manipulation, and runtime
- [ENTRY_FLOW.md](docs/ENTRY_FLOW.md) — starter Home, palette, Add/Change, Surprise Me, and onboarding
- [PATTERN_PLAY.md](docs/PATTERN_PLAY.md) — rhythm/melody pattern state, Shape editor, density, groove, and variation
- [EFFECT_FIELDS.md](docs/EFFECT_FIELDS.md) — field geometry, direct manipulation, DSP behavior, overlap, and safety
- [MOTION_PLAYGROUND.md](docs/MOTION_PLAYGROUND.md) — Motion presets, live-position runtime, playground toys, previews, and performance boundaries
- [LINKS_REACTIVE_MUSIC.md](docs/LINKS_REACTIVE_MUSIC.md) — Link vocabulary, reactive timing, relationship safety, visual connections, and lifecycle rules
- [MAGIC.md](docs/MAGIC.md) — seeded mutation, intents, per-object Magic, Remix, preview transactions, and undo safety
- [PERSISTENCE.md](docs/PERSISTENCE.md) — World library, autosave/restore, IndexedDB, Snapshots, history, migration, Trash, quarantine, and backups
- [CAPTURE_EXPORT.md](docs/CAPTURE_EXPORT.md) — post-limiter master recording, browser formats, duration safety, listen-back, downloads, and WAV conversion
- [VISUAL_SYSTEM.md](docs/VISUAL_SYSTEM.md) — implemented role identity, fields/toys/Links, trails, particles, quality profiles, accessibility, and visual-performance rules
- [PWA_OFFLINE.md](docs/PWA_OFFLINE.md) — mobile layouts, safe areas, touch policy, manifest/installability, service worker, offline/update behavior, and `/loop/` deployment rules
- [PHASE_1_ACCEPTANCE.md](docs/PHASE_1_ACCEPTANCE.md) — Phase 1 verification gate
- [PHASE_2_ACCEPTANCE.md](docs/PHASE_2_ACCEPTANCE.md) — Phase 2 verification gate
- [PHASE_3_ACCEPTANCE.md](docs/PHASE_3_ACCEPTANCE.md) — Phase 3 verification gate
- [PHASE_4_ACCEPTANCE.md](docs/PHASE_4_ACCEPTANCE.md) — Phase 4 verification gate
- [PHASE_5_ACCEPTANCE.md](docs/PHASE_5_ACCEPTANCE.md) — Phase 5 verification gate
- [PHASE_6_ACCEPTANCE.md](docs/PHASE_6_ACCEPTANCE.md) — Phase 6 verification gate
- [PHASE_7_ACCEPTANCE.md](docs/PHASE_7_ACCEPTANCE.md) — Phase 7 verification gate
- [PHASE_8_ACCEPTANCE.md](docs/PHASE_8_ACCEPTANCE.md) — Phase 8 verification gate
- [PHASE_9_ACCEPTANCE.md](docs/PHASE_9_ACCEPTANCE.md) — Phase 9 verification gate
- [PHASE_10_ACCEPTANCE.md](docs/PHASE_10_ACCEPTANCE.md) — Phase 10 verification gate
- [PHASE_11_ACCEPTANCE.md](docs/PHASE_11_ACCEPTANCE.md) — Phase 11 verification gate
- [PHASE_12_ACCEPTANCE.md](docs/PHASE_12_ACCEPTANCE.md) — Phase 12 verification gate
- [PHASE_13_ACCEPTANCE.md](docs/PHASE_13_ACCEPTANCE.md) — Phase 13 verification / feature-freeze gate
- [PHASE_14_ACCEPTANCE.md](docs/PHASE_14_ACCEPTANCE.md) — functional/data-integrity audit, confirmed fixes, and regression gate
- [PHASE_15_ACCEPTANCE.md](docs/PHASE_15_ACCEPTANCE.md) — UX, accessibility, keyboard, reduced-motion, and regression gate
- [ROADMAP.md](docs/ROADMAP.md) — closed development sequence through release

## Development

Requires Node.js 22.12 or newer.

```bash
npm install
npm run dev
```

Verification:

```bash
npm run check
npm run build
```

## Current automated verification

The integrated Phase 15 audit suite passed CI with:

- **36 test files**
- **185 tests**
- strict TypeScript typecheck
- production Vite build
- generated `dist/sw.js`
- **9 verified precached URLs**

Phase 15 hardens modal focus/isolation, keyboard parity across creative objects and the pattern grid, programmatic selection state, reduced-motion behavior, focus/contrast, coarse-pointer targets, screen-reader status behavior, and beginner-facing terminology. The V1 feature set remains frozen; Phase 16 is performance and soak certification.

## Product rule

A feature belongs in V1 only if it materially improves **immediate, visual, understandable musical play**.

If it mainly adds technical sophistication, professional production depth, or architectural/acoustic realism, it stays out of V1.

## Deployment target

The canonical V1 product will be a static web app / PWA deployed to GitHub Pages from this repository at the `/loop/` project path.

The app is technically ready for GitHub Pages/PWA deployment, but public deployment remains intentionally deferred until Phase 18 so only the audited/certified release candidate is presented as the product.
