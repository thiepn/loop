# Loop

**Loop is a visual music playground where anyone can create satisfying beats, loops, and soundscapes by moving, combining, transforming, and animating living sound objects.**

Loop is intentionally **not a DAW**. The product is designed first for people with little or no music-production knowledge and prioritizes immediate audiovisual play over studio workflows.

## Current status

- **Phase 0 — Product Consolidation & Specification Lock: complete**
- **Phase 1 — Clean Repository, Architecture & Deployment Foundation: complete and CI-verified**
- **Phase 2 — Musical Core & Smart Sound System: complete and CI-verified**
- **Phase 3 — Sound Orbs & Core Playground: complete and CI-verified**
- **Next: Phase 4 — Zero-Friction Home, Sound Palette & Onboarding**

Loop now opens directly into a playable spatial World containing six living Sound Orbs. Users can play the shared groove, drag sounds around the listener to change stereo position/presence, select them, mute/unmute, duplicate, delete, and see sound-synchronized visual reactions.

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
- [PHASE_1_ACCEPTANCE.md](docs/PHASE_1_ACCEPTANCE.md) — Phase 1 verification gate
- [PHASE_2_ACCEPTANCE.md](docs/PHASE_2_ACCEPTANCE.md) — Phase 2 verification gate
- [PHASE_3_ACCEPTANCE.md](docs/PHASE_3_ACCEPTANCE.md) — Phase 3 verification gate
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

Phase 3's integrated verification passed:

- **12 test files**
- **35 tests**
- strict TypeScript typecheck
- production Vite build

## Product rule

A feature belongs in V1 only if it materially improves **immediate, visual, understandable musical play**.

If it mainly adds technical sophistication, professional production depth, or architectural/acoustic realism, it stays out of V1.

## Deployment target

The canonical V1 product will be a static web app / PWA deployed to GitHub Pages from this repository at the `/loop/` project path.

Public deployment remains intentionally deferred until the release phase so unfinished development builds are not presented as the product.
