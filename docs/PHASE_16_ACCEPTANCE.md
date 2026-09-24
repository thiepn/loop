# Phase 16 — Performance & Soak Certification Acceptance

## Status

Phase 16 certifies the frozen V1 implementation against deterministic stress workloads and a real production build running in headless Google Chrome on the GitHub Actions Linux runner.

No product feature was added. Phase 16 changes are limited to certification infrastructure, regression budgets, and harness fixes required to produce reliable measurements.

## Certified V1 structural maximum

The deterministic max-World fixture reaches every current V1 structural cap simultaneously:

- **12 Sound Orbs**
- **5 Effect Fields**
- **4 Playground Toys**
- **8 Links**
- **8 Snapshots**

This fixture is used by Motion, Magic, persistence, and backup soak tests.

## Deterministic soak results

Latest clean Phase 16 run:

| Workload | Measured time | Regression budget |
| --- | ---: | ---: |
| 36,000 max-World Motion frames (10 simulated minutes at 60 Hz) | **382.55 ms** | **1,500 ms** |
| 10 simulated minutes of production scheduler pulses | **33.20 ms** | **500 ms** |
| 1,000 wild max-World Magic previews | **125.81 ms** | **1,000 ms** |
| 100 max-World library saves + 10 complete list/load passes | **703.91 ms** | **3,000 ms** |
| 100 max-World backup encode/decode round-trips | **111.46 ms** | **1,000 ms** |
| 250 recorder start/cancel cycles | **18.66 ms** | **1,000 ms** |

All deterministic certification tests passed.

## Recording certification

- [x] 250 consecutive start/cancel cycles return the recorder to idle and dispose every capture tap.
- [x] The production default recording limit is explicitly tested at **10 minutes**.
- [x] The limit callback does not fire before the cap.
- [x] The limit callback fires when the 10-minute boundary is reached.
- [x] Existing unexpected-stop, cancellation-race, native-format, and WAV fallback regressions remain green.

## Production build certification

Latest production build:

- CSS: **107.28 kB raw / 18.97 kB gzip**
- JavaScript: **233.28 kB raw / 57.23 kB gzip**
- Combined JS + CSS: **343,730 bytes raw / 77,096 bytes gzip**
- Service worker: **9 precached URLs**
- Production Vite build: **71 ms** on the measured CI run

Enforced release budgets:

- JS + CSS raw: **≤ 500 KiB**
- JS + CSS gzip: **≤ 120 KiB**

## Real-browser certification

Environment:

- GitHub Actions Linux runner
- `/usr/bin/google-chrome-stable`
- production Vite preview
- 1440 × 900 headless viewport
- production `/loop/` path
- dynamic Chrome DevTools port
- browser background-throttling disabled for deterministic sampling

Latest clean measurements:

| Metric | Result | Budget |
| --- | ---: | ---: |
| DOMContentLoaded | **102 ms** | informational |
| Load event | **107.9 ms** | **≤ 3,000 ms** |
| Home → World | **98 ms** | **≤ 1,500 ms** |
| Headless frame average | **22.09 ms** | telemetry |
| Headless frame p95 | **33.40 ms** | **≤ 80 ms** |
| Headless frame max | **50.10 ms** | **≤ 200 ms** |
| Main-thread work / sampled frame | **3.38 ms** | **≤ 8 ms** |
| Frame-sample task duration | **591.11 ms** | telemetry |
| Frame-sample script duration | **88.87 ms** | telemetry |
| Frame-sample layout duration | **32.82 ms** | telemetry |
| Frame-sample style recalculation | **155.60 ms** | telemetry |
| Modal churn sequence | **3,770.4 ms** | telemetry |
| Post-GC JS heap growth | **313,348 bytes** | **≤ 5 MiB** |
| DOM-node growth | **117 nodes** | **≤ 250 nodes** |
| Long tasks | **0** | max task **≤ 200 ms** |
| Longest long task | **0 ms** | **≤ 200 ms** |

### Audio environment

Headless Chrome reported:

- AudioContext state: **running**
- sample rate: **44.1 kHz**
- base latency: **10 ms**
- reported output latency: **0 ms** in the headless CI environment

The latency values are environment measurements rather than a guarantee for physical user hardware.

## Background / foreground recovery

The browser certification freezes and reactivates the page using Chrome lifecycle controls.

Result:

- [x] Playground remains mounted after freeze → active.
- [x] No browser-certification crash.
- [x] Existing Phase 14 visibility/audio reconciliation regressions remain green.

## Memory and lifecycle observations

After repeated modal churn and lifecycle recovery:

- post-GC heap increase: **~306 KiB**
- DOM node increase: **117**
- document count remained **1**
- no observed long tasks

These values are guarded by CI budgets for future regressions.

## Frame-cadence methodology

Raw `requestAnimationFrame` cadence in headless CI is retained as telemetry and a broad sanity guard, but it is not treated as a literal physical-display FPS guarantee.

The hard app-controlled rendering signal is **average browser main-thread work per sampled frame**, measured from Chrome Performance metrics. The latest value is **3.38 ms**, under the **8 ms** release budget.

This avoids falsely failing Loop because of headless compositor scheduling while still catching actual main-thread rendering regressions.

## Automated verification

Latest certified head passed:

- strict TypeScript typecheck
- **37 test files**
- **193 tests**
- deterministic max-World soak suite
- recorder lifecycle and 10-minute-cap tests
- production Vite build
- 9-URL service-worker generation
- production headless-Chrome certification
- all Phase 1–15 regressions

## Scope protection

- [x] No creative feature expansion.
- [x] No DAW/studio expansion.
- [x] No new DSP feature.
- [x] No product behavior changed merely to satisfy synthetic metrics.
- [x] The only browser-cert changes were measurement/harness reliability corrections.
- [x] Performance budgets are based on measured Phase 16 evidence rather than arbitrary aspirational numbers.

## Exit condition

Phase 16 succeeds when the frozen V1 product survives maximum-structure deterministic soak tests, recording lifecycle stress, large persistence/backup workloads, production build budgets, and real-browser startup/render/memory/lifecycle certification with no release-blocking regression.

**Phase 16 status: complete and CI-verified.**

**Next: Phase 17 — Release Candidate.**
