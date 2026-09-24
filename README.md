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
- **Phase 16 — Performance & Soak Certification: complete and CI-verified**
- **Phase 17 — Release Candidate: complete and tagged as `v1.0.0-rc.1`**
- **V1 feature development remains frozen**
- **Next: Phase 18 — Production Release & GitHub Pages**
- **Post-V1 Visual V2 Phase 1 — Specification & Art Direction Lock: complete (documentation only; runtime unchanged)**
- **Post-V1 Visual V2 Phase 2 — Rendering Architecture V2: complete and CI-verified**
- **Post-V1 Visual V2 Phase 3 — World Environment, Atmosphere & Depth: complete and CI-verified**
- **Post-V1 Visual V2 Phase 4 — Sound Orb Material Engine: complete and CI-verified**
- **Next Visual V2 phase after certification: Phase 5 — Physical Interaction & Object Game Feel**

Loop's planned V1 product feature set is implemented and feature-frozen. The release candidate now carries the complete functional, accessibility, persistence, performance, PWA, and cross-browser release gates.

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
- [PWA_OFFLINE.md](docs/PWA_OFFLINE.md) — mobile layouts, safe areas, touch policy, manifest/installability, service worker, offline/update behavior, and `/loop/` deployment rules
- [PHASE_1_ACCEPTANCE.md](docs/PHASE_1_ACCEPTANCE.md) through [PHASE_13_ACCEPTANCE.md](docs/PHASE_13_ACCEPTANCE.md) — implementation and feature-freeze gates
- [PHASE_14_ACCEPTANCE.md](docs/PHASE_14_ACCEPTANCE.md) — functional/data-integrity audit and regression gate
- [PHASE_15_ACCEPTANCE.md](docs/PHASE_15_ACCEPTANCE.md) — UX, accessibility, keyboard, reduced-motion, and regression gate
- [PHASE_16_ACCEPTANCE.md](docs/PHASE_16_ACCEPTANCE.md) — performance, soak, bundle, memory, lifecycle, and browser certification gate
- [PHASE_17_ACCEPTANCE.md](docs/PHASE_17_ACCEPTANCE.md) — release-candidate matrix, release blockers, and RC tag gate
- [ROADMAP.md](docs/ROADMAP.md) — closed V1 development sequence through release
- [VISUAL_V2.md](docs/VISUAL_V2.md) — locked post-V1 visual thesis, materials, depth, lighting, motion, VFX, accessibility, performance, and state boundaries
- [VISUAL_V2_ROADMAP.md](docs/VISUAL_V2_ROADMAP.md) — complete post-V1 visual revamp sequence
- [VISUAL_V2_PHASE_1_ACCEPTANCE.md](docs/VISUAL_V2_PHASE_1_ACCEPTANCE.md) — Phase 1 art-direction/specification gate
- [VISUAL_V2_RENDERER.md](docs/VISUAL_V2_RENDERER.md) — WebGL2/Canvas2D renderer architecture, ownership boundaries, lifecycle, and diagnostics
- [VISUAL_V2_PHASE_2_ACCEPTANCE.md](docs/VISUAL_V2_PHASE_2_ACCEPTANCE.md) — Phase 2 renderer foundation gate
- [VISUAL_V2_ENVIRONMENT.md](docs/VISUAL_V2_ENVIRONMENT.md) — derived World palette, procedural atmosphere, depth bands, parallax, silence, and environmental energy
- [VISUAL_V2_PHASE_3_ACCEPTANCE.md](docs/VISUAL_V2_PHASE_3_ACCEPTANCE.md) — Phase 3 environment/depth gate
- [VISUAL_V2_ORB_MATERIALS.md](docs/VISUAL_V2_ORB_MATERIALS.md) — role-specific procedural bodies, fingerprints, pulse deformation, state treatment, and Field hooks
- [VISUAL_V2_PHASE_4_ACCEPTANCE.md](docs/VISUAL_V2_PHASE_4_ACCEPTANCE.md) — Phase 4 Orb material gate

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
npm run cert:browser
npm run test:rc
```

## Current automated verification

The release-candidate source tree carries:

- **41 unit/soak test files**
- **216 unit/soak tests**
- strict TypeScript typecheck
- production Vite build
- generated `dist/sw.js`
- **9 verified precached URLs**
- Phase 16 browser performance/memory/lifecycle certification
- five-project release-candidate matrix:
  - Chromium desktop
  - Firefox desktop
  - Android Chromium touch profile
  - iPhone WebKit touch profile
  - iPad WebKit touch profile

The final pre-version RC matrix completed with **14 passed, 6 intentionally skipped, 0 flaky, 0 failed**. The exact tagged RC tree then independently repeated the full release gates before creating the annotated **`v1.0.0-rc.1`** tag at commit **`c904d6f`**. The six skips are platform-scoped checks: canonical offline/service-worker testing runs in Chromium desktop, and touch geometry runs only on touch projects.

## Product rule

A feature belongs in V1 only if it materially improves **immediate, visual, understandable musical play**.

If it mainly adds technical sophistication, professional production depth, or architectural/acoustic realism, it stays out of V1.

## Deployment target

The canonical V1 product is a static web app / PWA at the `/loop/` GitHub Pages project path.

Public production deployment remains Phase 18. The audited release candidate is now tagged as `v1.0.0-rc.1`; Phase 18 deploys, smoke-tests the real GitHub Pages URL/PWA, and then creates the final `v1.0.0` release tag.
