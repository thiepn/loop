# Phase 17 — Release Candidate Acceptance

## Status

Phase 17 converts the feature-frozen, audited, and performance-certified V1 tree into the first release candidate.

The release candidate version is:

**`1.0.0-rc.1`**

The corresponding Git tag is:

**`v1.0.0-rc.1`**

No new creative system was added during Phase 17. Changes were limited to release blockers, compatibility corrections, release-candidate test infrastructure, and deterministic release packaging.

## Supported V1 release matrix

The V1 platform contract names:

- modern Chromium desktop;
- Firefox desktop;
- Android Chromium;
- mobile/tablet touch layouts;
- iOS Safari/PWA where supported by platform capabilities.

Phase 17 represents that contract with the following automated production-build projects:

| RC project | Engine / profile |
| --- | --- |
| `chromium-desktop` | Chromium desktop, 1440 × 900 |
| `firefox-desktop` | Firefox desktop, 1440 × 900 |
| `android-chromium` | Chromium with Android mobile/touch profile |
| `ios-webkit` | WebKit with iPhone mobile/touch profile |
| `ipad-webkit` | WebKit with iPad tablet/touch profile |

These are automated browser-engine/device-profile tests on GitHub Actions, not a claim of testing every physical phone, tablet, browser build, audio device, or OS combination. Real deployed-site smoke testing remains Phase 18.

## Clean-user V1 workflow

The release-candidate matrix executes the product as a production Vite build and verifies the integrated user path:

1. load Home;
2. choose a starter World;
3. enter the Playground;
4. start sound when the browser permits it, or surface the explicit browser-audio fallback;
5. select and move a Sound Orb;
6. edit a rhythm pattern;
7. add a Sound Orb;
8. add an Effect Field;
9. add a Playground Toy;
10. enable Motion;
11. create a Link;
12. run global Remix / Magic and Keep the result;
13. stop playback;
14. save a Snapshot;
15. make a later World edit;
16. recall the Snapshot;
17. wait for local autosave durability;
18. reload the page and restore the active World;
19. verify persisted sounds, fields, toys, Links, and Snapshot state;
20. download a World backup;
21. return Home;
22. reopen the saved World from the local library.

The workflow also asserts that no fatal shell or uncaught page error appears.

## Recording / export RC check

Each release project runs the recording surface.

The test accepts only one of the product's explicit capability outcomes:

- recording is supported, reaches `recording`, produces a ready capture, and downloads a browser-native audio file; or
- the browser/audio environment cannot provide the required recording/audio capability and Loop reaches a clear supported/blocked error state rather than hanging or crashing.

Existing unit coverage continues to certify:

- post-limiter capture ownership;
- cancellation;
- cancellation → immediate restart;
- unexpected browser stop preservation;
- the production 10-minute cap;
- native-format preservation when optional WAV conversion fails.

## Offline / PWA RC check

The canonical production service-worker smoke runs in Chromium desktop:

- wait for service-worker readiness;
- reload under control;
- switch the browser context offline;
- reload the real production preview path;
- verify the cached Loop Home shell still opens;
- verify the Offline badge appears;
- restore connectivity.

The service-worker implementation and `/loop/` scoping remain covered by the Phase 13–16 build/unit gates.

## Touch-layout RC check

Android Chromium, iPhone WebKit, and iPad WebKit verify:

- the primary Effect sheet fits within the viewport;
- contextual selection UI remains visible;
- the selection panel remains separated from the bottom dock;
- Add remains reachable after contextual interaction.

## Final clean matrix

The final pre-version release-candidate matrix completed with:

- **14 passed**
- **6 intentionally skipped**
- **0 flaky**
- **0 failed**

The six skips are deliberate project scoping:

- the canonical offline/service-worker smoke runs only on Chromium desktop;
- touch-layout geometry runs only on the three touch projects.

The complete clean-user workflow itself runs on all five release projects.

## Normal verification gate

The same certified source tree also passes the normal Verify workflow:

- dependency installation;
- strict TypeScript typecheck;
- **37 test files**;
- **193 tests**;
- deterministic Phase 16 soak budgets;
- production Vite build;
- service-worker generation;
- Phase 16 headless-Chrome performance certification.

## Release blockers found and fixed in Phase 17

### Input and accessibility
- Link target choices now expose their selected state with `aria-pressed`.
- Arrow-key Sound Orb movement also selects the Orb, keeping contextual actions coherent for keyboard users.

### Browser audio lifecycle
- starter and Surprise actions prime browser audio inside the actual user gesture before queued Home work;
- suspended AudioContext resume is bounded so a browser that refuses/resists resume cannot hang the app indefinitely;
- the RC workflow verifies the explicit fallback when a headless/browser environment still refuses audio.

### Touch layout
- contextual selection panels are kept above the bottom dock on coarse-pointer layouts;
- RC geometry checks certify panel/dock separation.

### Persistence truthfulness
- an edited World now enters visible `Saving` state as soon as an autosave is queued, including the debounce interval;
- the UI therefore no longer advertises stale `Saved` state while newer World data is still volatile.

### Release infrastructure
- Playwright tests are isolated from Vitest discovery;
- independent browser projects run in parallel;
- modal/action timing is animation-tolerant without weakening semantic assertions;
- the Phase 16 Chrome certification probe retries transient runner startup failures and uses Chrome's dynamic DevTools port.

## RC tag gate

The versioned Phase 17 tree includes a rerunnable self-verifying release-candidate tagging workflow.

While the package version is an RC and its tag does not yet exist, that workflow independently runs:

1. dependency installation;
2. strict TypeScript + unit/soak tests;
3. production build;
4. Chromium/Firefox/Android/WebKit release-candidate matrix;
5. Phase 16 browser performance certification.

Only after those gates pass does it create and push the annotated tag matching the package version. If the RC tag already exists, later main-branch pushes do not retag it. Non-RC versions make this workflow a no-op.

The exact tag gate completed successfully with:

- **37 / 37 test files passed**;
- **193 / 193 unit/soak tests passed**;
- **14 RC matrix tests passed**;
- **6 intentional platform-scoped skips**;
- production build and 9-URL service-worker generation passed;
- browser performance certification passed with **0 long tasks**;
- annotated tag **`v1.0.0-rc.1`** created.

The annotated tag dereferences to certified commit:

**`c904d6f822af0f89d73652d886aabbf04769f9a9`**

## Scope protection

- [x] No new creative system.
- [x] No DAW/studio expansion.
- [x] No new DSP feature.
- [x] No cloud/account scope.
- [x] No release blocker was hidden by weakening product correctness.
- [x] Platform-dependent audio capability is treated as progressive enhancement with explicit fallback.
- [x] Automated mobile profiles are not misrepresented as physical-device certification.

## Exit condition

Phase 17 succeeds when the exact versioned RC tree passes both the normal Verify gate and the complete release-candidate browser matrix, and the self-verifying tag workflow creates `v1.0.0-rc.1`.

**Phase 17 status: complete, exact-head verified, and tagged as `v1.0.0-rc.1`.**

**Next: Phase 18 — Production Release & GitHub Pages.**
