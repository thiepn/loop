# Phase 13 — Mobile, PWA & Offline Hardening Acceptance

## Manifest / installability
- [x] Web app manifest exists.
- [x] Manifest is linked from index.html.
- [x] Manifest id is scoped to /loop/.
- [x] start_url stays inside /loop/.
- [x] scope stays inside /loop/.
- [x] display is standalone.
- [x] dark theme/background colors are declared.
- [x] explicit 192×192 icon exists.
- [x] explicit 512×512 icon exists.
- [x] maskable 512×512 icon exists.
- [x] maskable art uses opaque background/safe central geometry.
- [x] mobile/Apple standalone metadata exists.
- [x] viewport-fit=cover exists.
- [x] page zoom is disabled for native-app interaction.

## Install flow
- [x] beforeinstallprompt is captured.
- [x] browser-controlled prompt is suppressed until user action.
- [x] Install Loop appears only on Home when appropriate.
- [x] installed/standalone state suppresses install CTA.
- [x] appinstalled state is handled.
- [x] iPhone/iPad manual Add-to-Home-Screen guidance exists.
- [x] iPad desktop-style user agent can be detected through touch points.
- [x] manual iOS guidance disappears in standalone mode.

## Service worker build
- [x] Production build generates dist/sw.js.
- [x] Worker precache list comes from actual dist output.
- [x] Hashed Vite bundles do not need a manual source list.
- [x] Sourcemaps are excluded from precache.
- [x] Worker itself is excluded from its precache list.
- [x] Required PWA assets are validated during build.
- [x] Manifest 192×192 and 512×512 icon entries are validated during build.
- [x] Cache version is derived from precache URL hash.
- [x] GitHub Pages paths are generated under /loop/.
- [x] Current verified build generated nine precached URLs.

## Service worker runtime
- [x] Worker is registered only in production.
- [x] Worker registration URL is /loop/sw.js.
- [x] Worker scope is /loop/.
- [x] Worker cannot claim site root.
- [x] updateViaCache is none.
- [x] install precaches application shell/assets.
- [x] install does not skipWaiting automatically.
- [x] activate removes old Loop cache generations.
- [x] activate claims clients.
- [x] same-origin scoped static GETs use cache-first behavior.
- [x] uncached successful static responses enter runtime cache.
- [x] navigation uses network-first behavior.
- [x] navigation has cached app-shell fallback.
- [x] cross-origin requests are not cached by Loop worker.
- [x] non-GET requests are ignored.

## Update lifecycle
- [x] already waiting worker is detected.
- [x] newly installed replacement worker is detected.
- [x] update-ready UI exists.
- [x] update does not auto-reload active play.
- [x] Update sends explicit SKIP_WAITING message.
- [x] controllerchange reload occurs only after explicit Update.
- [x] update checks occur after registration.
- [x] update checks occur after reconnect.
- [x] update checks occur on visible/focus.
- [x] update checks are throttled.
- [x] update-check failures are nonfatal.

## Offline
- [x] online/offline browser state is observed.
- [x] Offline badge exists.
- [x] reconnect clears offline state.
- [x] reconnect may trigger update check.
- [x] previously saved Worlds remain local through IndexedDB.
- [x] offline/PWA state is not stored in WorldDocument.
- [x] PWA failure does not crash musical play.

## Top bar
- [x] right-side controls are grouped structurally.
- [x] Phase 10 history controls no longer become extra grid children.
- [x] Phase 12 visual settings no longer become an extra grid child.
- [x] desktop top-bar alignment remains Brand / World / actions.

## Touch / pointers
- [x] playground uses Pointer Events.
- [x] canvas uses touch-action:none.
- [x] iOS touch callout is disabled on canvas.
- [x] coarse-pointer controls use manipulation behavior.
- [x] critical coarse-pointer actions target roughly 44px minimum height.
- [x] field resize handle grows for touch.
- [x] existing pointer capture/cancel semantics remain shared across input types.
- [x] no parallel touch-only creative engine exists.

## Phone layout
- [x] shell respects safe-area insets.
- [x] compact top bar exists.
- [x] brand text can collapse while mark remains.
- [x] Play can collapse to icon-first control.
- [x] canvas remains dominant.
- [x] bottom dock remains one row.
- [x] dock scrolls horizontally instead of uncontrolled wrapping.
- [x] dock respects bottom/side safe areas.
- [x] selection panels sit above dock.
- [x] World hint sits above dock.
- [x] World hint rises above active selection panels.
- [x] modal sheets use dvh and safe-area padding.
- [x] modal overscroll is contained.

## Home / library mobile
- [x] Home can scroll internally on small screens.
- [x] body/page remains non-scrolling.
- [x] Home overscroll is contained.
- [x] Home top bar becomes sticky.
- [x] starter/library grids collapse appropriately.
- [x] Home respects safe areas.

## Landscape phone
- [x] short-height landscape mode exists.
- [x] nonessential brand/World/status copy can hide.
- [x] top bar remains usable.
- [x] dock remains accessible.
- [x] contextual panels remain above dock.
- [x] nonessential hint/onboarding copy hides.
- [x] sheets fit within available dynamic viewport.

## Standalone mode
- [x] display-mode:standalone layout exists.
- [x] dynamic viewport height is preserved.
- [x] standalone background remains dark.
- [x] same app/World implementation runs browser and installed modes.

## State ownership
- [x] PWA runtime state is transient AppState.
- [x] install state is not World state.
- [x] offline state is not World state.
- [x] update state is not World state.
- [x] PWA state does not create creative history.
- [x] PWA state does not enter World backups.

## Automated/build coverage
- [x] /loop/ base path normalization tested.
- [x] service-worker URL tested.
- [x] service-worker scope tested.
- [x] manifest URL tested.
- [x] root-scope leakage guard tested.
- [x] iPhone/iPad platform policy tested.
- [x] iPad MacIntel+touch policy tested.
- [x] standalone iOS manual-install suppression tested.
- [x] non-iOS manual-install suppression tested.
- [x] production build executes worker generator.
- [x] production build validates required PWA assets.
- [x] production build logs generated precache count.
- [x] all Phase 1–12 regression tests remain included.

## Scope protection
- [x] No new creative feature added.
- [x] No cloud sync.
- [x] No account requirement.
- [x] No background music claim.
- [x] No push notifications.
- [x] No native wrapper.
- [x] No public deployment performed early.
- [x] No Phase 14+ audit work treated as new feature scope.

## Feature freeze
- [x] Phase 13 is the final V1 product-build phase.
- [x] Phases 14–18 are audit/certification/release only.
- [x] Feature additions stop after this acceptance gate.

## Final CI verification

GitHub Actions passed on the completed Phase 13 implementation and shared documentation with:

- dependency installation;
- strict TypeScript typecheck;
- **35 test files**;
- **177 tests**;
- production Vite build;
- generated `dist/sw.js`;
- **9 verified precached URLs** under the `/loop/` deployment path.

## Exit condition
- [x] Dependency installation passes.
- [x] Strict TypeScript typecheck passes.
- [x] Complete unit-test suite passes.
- [x] Production Vite build passes.
- [x] Service-worker generation passes.
- [x] Required PWA assets validate.
- [x] V1 feature freeze is active.

**Phase 13 status: complete and CI-verified.**

**V1 product-build status: feature-frozen. Phase 14 begins audit/fix work only.**
