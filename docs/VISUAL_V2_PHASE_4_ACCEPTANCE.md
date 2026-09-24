# Visual V2 Phase 4 — Sound Orb Material Engine Acceptance

## Material model
- [x] every Orb projects a presentation-only material.
- [x] catalog energy influences material.
- [x] catalog brightness influences material.
- [x] default sound patterns are resolved when explicit pattern is absent.
- [x] explicit rhythm patterns produce fingerprints.
- [x] explicit melody patterns produce fingerprints.
- [x] texture receives a deterministic non-notation fallback fingerprint.
- [x] material seed is deterministic.
- [x] material seed changes with pattern variation.
- [x] all material scalar values remain bounded.

## Musical fingerprints
- [x] 16-position rhythm signature exists.
- [x] 16-position melodic signature exists.
- [x] rhythm density is represented.
- [x] melodic density is represented.
- [x] groove is represented.
- [x] melodic contour is represented.
- [x] melodic pitch spread is represented.
- [x] rhythm syncopation/spread contributes to material.
- [x] fingerprints remain abstract rather than notation UI.

## Role identities
- [x] Beat has kinetic/impact identity.
- [x] Percussion has granular/faceted identity.
- [x] Bass has viscous pressure identity.
- [x] Harmony has layered membrane/petal identity.
- [x] Melody has filament/satellite identity.
- [x] Texture has gaseous/cloud identity.
- [x] Voice has organic ribbon identity.
- [x] role identity is not based on color alone.
- [x] role-specific size hierarchy remains.

## WebGL
- [x] dedicated Orb material shader/program exists.
- [x] generic Orb placeholder discs are removed.
- [x] one shared static quad buffer is used.
- [x] role-specific procedural boundaries exist.
- [x] internal material functions exist.
- [x] per-Orb pattern fingerprint uniform exists.
- [x] pulse deformation is event-driven.
- [x] material time obeys Reduce Motion.
- [x] GPU resources clean up and restore with renderer lifecycle.

## Canvas2D fallback
- [x] dedicated Orb material layer exists.
- [x] role-specific procedural outlines exist.
- [x] role-specific internal structures exist.
- [x] pattern markers exist.
- [x] Melody satellites exist.
- [x] selected/focused/muted states remain distinct.
- [x] Phase 2 fallback performance policy remains in force.

## States
- [x] selection has material treatment.
- [x] keyboard focus has separate material treatment.
- [x] mute desaturates/reduces alpha without destroying silhouette.
- [x] DOM semantic focus outline remains available.
- [x] hidden legacy DOM Orb animations are disabled under healthy Visual V2 rendering.
- [x] hidden legacy Orb pulse animation is skipped under healthy Visual V2 rendering.

## Event response
- [x] Beat pulse response differs from Percussion.
- [x] Bass response is heavier/slower in shape.
- [x] Harmony response is broader.
- [x] Melody response is directional.
- [x] Voice response is elastic.
- [x] material pulse ring exists.
- [x] no material event schedules audio.

## Quality/accessibility
- [x] renderer policy includes Orb detail.
- [x] High preserves full detail.
- [x] Balanced reduces internal detail.
- [x] Battery Saver keeps major role identity while reducing detail.
- [x] Reduce Motion freezes continuous material motion.
- [x] state feedback remains visible under Reduce Motion.
- [x] role identity includes non-color geometry.

## Field hook
- [x] current EffectAmounts are projected per Orb.
- [x] Field preview position can change projected influence.
- [x] Field influence is presentation-only.
- [x] full Field material transformation remains deferred to Phase 7.

## State protection
- [x] no World schema change.
- [x] no persistence migration.
- [x] no audio engine change.
- [x] no pattern semantic change.
- [x] no interaction geometry change.
- [x] no history/autosave behavior change.

## Tests
- [x] catalog metadata/default pattern derivation is covered.
- [x] rhythm fingerprint derivation is covered.
- [x] melody contour/spread derivation is covered.
- [x] seed determinism/variation sensitivity is covered.
- [x] Field-influence projection is covered.
- [x] keyboard focus projection is covered.
- [x] all seven roles are bounded and covered.

## Exit condition

Phase 4 is complete only when the exact final Phase 4 head passes:

- strict TypeScript typecheck;
- complete unit/soak suite;
- production build;
- Phase 16 browser certification without relaxing its budgets.


## Verification record

The implemented Phase 4 head passed the existing repository verification gates without changing certification budgets:

- strict TypeScript typecheck: passed;
- unit/soak suite: **41 files, 216 tests passed**;
- production Vite build: passed;
- Phase 16 browser certification: passed;
- JS+CSS gzip: **92,832 bytes** (< 120 KiB budget);
- navigation load: **377.6 ms** (< 3,000 ms budget);
- Home → World: **440.3 ms** (< 1,500 ms budget);
- sampled animation-frame p95: **16.8 ms** (< 80 ms budget);
- average main-thread work per sampled frame: **4.70 ms** (< 8 ms budget);
- post-GC heap growth: **468,360 bytes** (< 5 MiB budget);
- DOM node growth: **113** (< 250 budget);
- longest observed long task: **0 ms**;
- frozen → active lifecycle recovery: passed.

The dedicated Orb material system therefore remains inside the existing release-performance envelope while leaving headroom for Phase 5 interaction deformation.
