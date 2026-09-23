# Loop

**Loop is a visual music playground where anyone can create satisfying beats, loops, and soundscapes by moving, combining, transforming, and animating living sound objects.**

Loop is intentionally **not a DAW**. The product is designed first for people with little or no music-production knowledge and prioritizes immediate audiovisual play over studio workflows.

## Current status

- **Phase 0 — Product Consolidation & Specification Lock: complete**
- **Phase 1 — Clean Repository, Architecture & Deployment Foundation: complete and CI-verified**
- **Phase 2 — Musical Core & Smart Sound System: complete and CI-verified**
- **Next: Phase 3 — Sound Orbs & Core Playground**

The repository now contains a runnable Vite + TypeScript application, a safe Web Audio lifecycle, a shared musical transport, audio-time lookahead scheduling, scale-aware pitch rules, smart sound metadata/compatibility, automatic headroom policy, and a tiny procedural sound catalog used by the temporary Foundation Groove.

## Product contract

The authoritative specifications live in `docs/`:

- [PRODUCT.md](docs/PRODUCT.md) — product definition, audience, vocabulary, principles, success criteria
- [INTERACTIONS.md](docs/INTERACTIONS.md) — gestures, Sound Orbs, Effect Fields, Motion, Links, Magic, Snapshots
- [VISUAL_SYSTEM.md](docs/VISUAL_SYSTEM.md) — audiovisual language, orb identities, fields, motion, responsive behavior
- [AUDIO_SYSTEM.md](docs/AUDIO_SYSTEM.md) — timing, compatibility, automatic musical behavior, DSP boundaries
- [V1_SCOPE.md](docs/V1_SCOPE.md) — hard V1 feature boundary and feature-complete definition
- [NON_GOALS.md](docs/NON_GOALS.md) — explicit anti-goals preventing DAW/acoustics/platform scope creep
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — runtime boundaries and dependency rules
- [MUSICAL_CORE.md](docs/MUSICAL_CORE.md) — Phase 2 timing, harmony, catalog, compatibility, and mix contracts
- [PHASE_1_ACCEPTANCE.md](docs/PHASE_1_ACCEPTANCE.md) — Phase 1 verification gate
- [PHASE_2_ACCEPTANCE.md](docs/PHASE_2_ACCEPTANCE.md) — Phase 2 verification gate
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

## Product rule

A feature belongs in V1 only if it materially improves **immediate, visual, understandable musical play**.

If it mainly adds technical sophistication, professional production depth, or architectural/acoustic realism, it stays out of V1.

## Deployment target

The canonical V1 product will be a static web app / PWA deployed to GitHub Pages from this repository at the `/loop/` project path.

Public deployment remains intentionally deferred until the release phase so unfinished development builds are not presented as the product.
