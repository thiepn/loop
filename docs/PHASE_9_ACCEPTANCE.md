# Phase 9 — Magic, Mutation & Controlled Randomness Acceptance

## Core mutation engine
- [x] Magic is seeded.
- [x] Same base/target/intent/strength/attempt is deterministic.
- [x] Retry attempt changes the deterministic seed.
- [x] Random seed does not depend on wall-clock time.
- [x] Mutation functions are pure over the supplied World aside from returned updated document metadata.
- [x] Missing object targets fail safely without changing the World.

## Sound Orb Magic
- [x] Sound Orb id is preserved.
- [x] Musical role is preserved.
- [x] Saved position is preserved.
- [x] Mute state is preserved.
- [x] Existing Links are preserved.
- [x] Sound swaps use same-role catalog candidates only.
- [x] More Energy/Busier never choose a lower-energy sound.
- [x] Calmer/Simpler never choose a higher-energy sound.
- [x] Stranger prefers a role-compatible contrasting sound.
- [x] Surprise is deterministic.
- [x] Editable rhythm/melody receives deterministic pattern variation.
- [x] More Energy/Busier biases Busy density.
- [x] Calmer/Simpler biases Sparse density.
- [x] Melody values remain scale-degree based.
- [x] Motion mutation remains bounded.
- [x] Follow Motion chooses/keeps a real target where possible.
- [x] Gentle Magic changes fewer dimensions.
- [x] Texture Magic remains useful despite having no editable step pattern.

## Effect Field Magic
- [x] Field id is preserved.
- [x] Field type is preserved.
- [x] Position remains normalized.
- [x] Radius remains inside Phase 6 bounds.
- [x] Strength changes mutation distance rather than exposing DSP parameters.
- [x] No hidden effect routing/parameter UI is introduced.

## Toy Magic
- [x] Toy id is preserved.
- [x] Toy type is preserved.
- [x] Position remains normalized.
- [x] Strength remains clamped.
- [x] Portal OUT stays normalized.
- [x] Magic does not add/delete toys.

## Global Remix
- [x] Remix has Surprise Me.
- [x] Remix has More Energy.
- [x] Remix has Calmer.
- [x] Remix has Stranger.
- [x] Remix has Simpler.
- [x] Remix has Busier.
- [x] Gentle / Playful / Wild strength is supported.
- [x] Sound Orb count is preserved.
- [x] Sound Orb ids are preserved.
- [x] Sound Orb roles are preserved.
- [x] Effect Field count/types are preserved.
- [x] Toy count/types are preserved.
- [x] Links are preserved structurally.
- [x] Existing Link relationships remain valid.
- [x] More Energy/Busier increases tempo within bounds.
- [x] Calmer/Simpler reduces tempo within bounds.
- [x] Stranger/Surprise tempo variation remains bounded.
- [x] BPM remains within 72–138.

## Preview transaction
- [x] Per-object Magic creates a live preview immediately.
- [x] Global Remix first asks for an intent.
- [x] Preview World drives normal audio/visual runtime.
- [x] Retry always regenerates from the original base World.
- [x] Retry does not stack mutations.
- [x] Changing strength regenerates from the original base World.
- [x] Revert restores the exact base World.
- [x] Keep accepts the preview.
- [x] Keep creates a one-step Magic undo pair.
- [x] Undo Magic restores the pre-Magic World.
- [x] Undo remains available across UI-only state changes.
- [x] Undo is automatically unavailable after a later material World edit.
- [x] Starting a new Magic clears stale Magic undo state.
- [x] Preview canvas is interaction-locked to prevent hidden destructive edits.
- [x] Audio playback may continue during preview.

## UI
- [x] Selected Sound Orb exposes ✦ Magic.
- [x] Selected Effect Field exposes ✦ Magic.
- [x] Selected playground toy exposes ✦ Magic.
- [x] Playground dock exposes ✦ Remix.
- [x] Remix intent labels use ordinary language.
- [x] Preview bar exposes Gentle / Playful / Wild.
- [x] Preview bar exposes Revert / Retry / Keep.
- [x] Kept result exposes Undo Magic while still safe.
- [x] No seed numbers or random-engine terminology appear in normal UI.
- [x] No prompt box is introduced.
- [x] No technical parameter-randomizer panel is introduced.

## Architecture
- [x] World schema remains version 7.
- [x] Magic session metadata stays transient in AppState.
- [x] Magic undo metadata stays transient in AppState.
- [x] World remains the single creative-state document.
- [x] Existing PlaygroundEngine receives previews through normal World synchronization.
- [x] No extra AudioContext is created.
- [x] No permanent new animation loop is created.
- [x] Motion remains demand-driven.
- [x] Phase 8 Link structure is not rewritten by Magic.

## Automated coverage
Tests cover:
- deterministic same-input mutation;
- different Retry seeds;
- orb identity/role/position/mute preservation;
- Link preservation;
- energy-direction honesty;
- Busy intent density;
- Calmer sound direction;
- Gentle mutation scope;
- Effect Field type/bounds;
- Toy type/strength/position bounds;
- World Remix count/id/role preservation;
- tempo intent direction;
- retained Link validity;
- missing-target no-op;
- catalog role stability;
- all Phase 1–8 regression tests.

## Scope protection
- [x] No persistent World library implemented early.
- [x] No persistent general undo stack implemented early.
- [x] No Snapshots implemented early.
- [x] No AI/cloud generation.
- [x] No arbitrary role-changing randomization.
- [x] No structural add/delete Remix.
- [x] No Link graph randomization.
- [x] No studio parameter randomizer.

## Final CI verification

GitHub Actions passed on the completed Phase 9 implementation with:

- dependency installation;
- strict TypeScript typecheck;
- **24 test files**;
- **124 tests**;
- production Vite build.

## Exit condition
- [x] Dependency installation passes.
- [x] Strict TypeScript typecheck passes.
- [x] Complete unit-test suite passes.
- [x] Production Vite build passes.

**Phase 9 status: complete and CI-verified.**
