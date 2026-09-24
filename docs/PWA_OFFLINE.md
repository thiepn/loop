# Loop — Mobile, PWA & Offline

## Status
Phase 13 implementation contract.

Phase 13 is the final V1 product-build phase.

After this phase, Loop enters feature freeze. Phases 14–18 may audit, fix, certify, package, and release, but they must not introduce new creative systems.

## Canonical deployment target

Loop is a static Vite application intended for GitHub Pages at:

`https://thiepn.github.io/loop/`

Vite remains configured with:

`base: '/loop/'`

PWA registration, manifest start/scope, cached URLs, and runtime asset paths must remain inside the `/loop/` project path.

The service worker must never claim the site root.

## Native app viewport

The document uses:
- `viewport-fit=cover`;
- `maximum-scale=1`;
- `user-scalable=no`.

This matches Loop's direct-manipulation PWA interaction contract: the installed playground behaves like an application surface rather than a zoomable document.

Normal browser-page scrolling remains disabled inside the playground.

Home/library may scroll internally on narrow screens because it is a browsing surface rather than the musical canvas.

## Manifest

Production includes:

`/loop/manifest.webmanifest`

Manifest contract:
- id: `/loop/`;
- start URL: current project root;
- scope: current project root;
- display: standalone;
- dark background/theme colors;
- orientation: any;
- music/entertainment/game categories.

Icons include:
- explicit 192×192 app icon;
- explicit 512×512 app icon;
- 512×512 maskable icon.

The maskable icon uses an opaque full-canvas background and keeps the important Loop ring/core/dots within a conservative central safe area.

## Install behavior

### Browsers with beforeinstallprompt
PwaController captures `beforeinstallprompt` and prevents the browser from showing an uncontrolled prompt.

Home then exposes **Install Loop**.

The install prompt appears only when:
- the browser offers an install prompt;
- Loop is not already installed/standalone;
- the user is on Home.

The app never interrupts active musical play with an install dialog.

### iOS / iPadOS
WebKit does not provide the Chromium install prompt flow.

When Loop detects an iPhone/iPad-style environment that is not already standalone, Home shows concise guidance:

**Install Loop: Share → Add to Home Screen**

iPad desktop-style user agents are detected via MacIntel + touch points.

The hint disappears in standalone mode.

### Installed detection
Standalone is detected through:
- `display-mode: standalone`;
- iOS `navigator.standalone` where available;
- the `appinstalled` event.

## Service worker generation

Loop does not maintain a hand-written list of hashed Vite bundles.

Production build runs:

`vite build`

then:

`node scripts/generate-service-worker.mjs`

The generator:
1. walks the final `dist/` output;
2. excludes sourcemaps and the worker itself;
3. verifies required PWA assets;
4. verifies explicit 192×192 and 512×512 manifest icon entries;
5. converts every cacheable built file to a `/loop/` URL;
6. hashes the precache URL list;
7. writes `dist/sw.js` from the worker template.

This means the service worker always knows the actual generated JS/CSS bundle names.

The Phase 13 production build currently reports:

**9 precached URLs**

This includes the app shell and built static assets for the current repository shape.

If future release-hardening work changes build outputs, the count may change while the generated-list rule remains authoritative.

## Service worker caches

The worker uses versioned:
- `loop-precache-<hash>`;
- `loop-runtime-<hash>`.

### Install
The current generated asset list is precached.

The worker intentionally does **not** call `skipWaiting()` automatically.

A newer build may install and wait while the current Loop session keeps running.

### Activate
Activation:
- deletes older Loop precache/runtime versions;
- keeps only current cache names;
- calls `clients.claim()`.

### Static assets
Same-origin GET requests inside the worker scope use cache-first behavior.

If an asset is not already cached:
- network is attempted;
- successful responses are added to runtime cache.

No cross-origin request is cached by this worker.

### Navigation
Navigation uses network-first behavior.

If network fails, the worker falls back to:
1. matching navigation cache;
2. cached `/loop/`;
3. cached `/loop/index.html`;
4. a minimal offline failure page only when the app shell was never cached.

Once Loop has been installed/controlled successfully, the normal offline fallback is the cached application shell.

## Update lifecycle

Updates are explicit rather than disruptive.

PwaController detects:
- an already waiting worker;
- a newly installed replacement worker when an older controller exists.

AppState exposes:

`pwaUpdateReady`

The UI shows:

**Loop update ready — Update**

Until the user chooses Update:
- the existing controlled app continues;
- no automatic reload interrupts music/recording/editing.

When Update is selected:
1. App sends `SKIP_WAITING` to the waiting worker;
2. the new worker activates;
3. `controllerchange` fires;
4. Loop reloads once intentionally.

The worker uses `skipWaiting()` only in response to that explicit message.

## Update checks

The registered service worker uses:

`updateViaCache: 'none'`

Loop performs best-effort update checks:
- after registration;
- when connectivity returns;
- when the app becomes visible;
- on window focus.

Checks are throttled to avoid repeated network work.

Update-check failure never interrupts the playground.

## Online / offline state

PwaController watches browser:
- `online`;
- `offline`.

When offline, Loop shows a small **Offline** badge.

Offline state is transient app state and does not alter WorldDocument.

When connectivity returns:
- badge clears;
- Loop may perform a best-effort service-worker update check.

## Local creative data offline

Phase 10 already stores Worlds in IndexedDB.

Therefore offline Loop combines:
- cached application shell/static assets from Phase 13;
- local Worlds/Snapshots/history base data from Phase 10.

No server/account is required to reopen previously saved Worlds.

Performance recordings remain transient runtime artifacts as defined by Phase 11.

## Responsive top bar

Phase 13 fixes a structural header regression introduced as features accumulated.

The top bar is now explicitly:

- Brand
- optional World heading
- one right-side action cluster

The action cluster contains:
- save status / Undo / Redo;
- visual settings;
- Play/Stop.

These no longer become extra implicit CSS-grid children.

## Phone layout

At narrow widths:
- shell padding follows safe-area insets;
- World heading may disappear;
- brand copy may hide while the mark remains;
- Play becomes compact/icon-first at very small widths;
- top-bar actions remain grouped;
- canvas corner radius tightens;
- bottom dock becomes horizontally scrollable;
- dock does not wrap into multiple uncontrolled rows;
- dock respects left/right/bottom safe areas;
- contextual selection panels move above the dock;
- World hint moves above the dock and above active selection panels;
- modal sheets use `dvh` limits and safe-area padding.

The playground remains the dominant visible surface.

## Touch targets

For coarse pointers:
- critical top-bar controls;
- dock controls;
- contextual action buttons;
- Snapshot/capture/Magic actions

use at least approximately 44px vertical hit targets.

The Effect Field resize handle grows substantially for touch input.

Canvas objects continue using Pointer Events rather than separate touch/mouse implementations.

## Pointer behavior

The playground canvas:
- uses `touch-action: none`;
- disables iOS touch callout;
- prevents accidental page scrolling while manipulating objects.

Buttons use `touch-action: manipulation` on coarse pointers.

Existing pointer capture/cancel behavior remains authoritative for Sound Orbs, fields, and toys.

Phase 13 does not create separate gesture code paths that could diverge between mouse and touch.

## Bottom dock

The V1 dock now contains several bounded actions.

On phones it becomes one horizontally scrollable row with hidden scrollbar and momentum scrolling.

This is preferable to:
- shrinking controls below safe touch sizes;
- wrapping into two/three rows over the World;
- replacing the playground with a navigation drawer.

## Contextual panels

Sound/field/toy/Link selection panels move above the mobile dock.

Very narrow screens use vertically stacked contextual copy/actions where necessary.

The World status hint automatically moves higher when a contextual panel is open.

## Mobile Home/library

Unlike the musical playground, Home may scroll.

On small screens:
- `home-shell` becomes an internal vertical scroll surface;
- overscroll is contained;
- Home top bar becomes sticky;
- starter/library grids collapse to one column;
- safe-area padding protects the top/bottom edges.

Body/page scrolling itself remains disabled.

## Landscape phones

A dedicated short-height landscape mode:
- reduces shell/top-bar spacing;
- hides nonessential brand/World/status text;
- preserves compact action controls;
- reduces canvas radius;
- keeps the dock at the lower safe edge;
- keeps contextual panels above the dock;
- hides nonessential World hint/onboarding copy;
- constrains sheets to the available `dvh`.

Audio behavior is unchanged.

## Standalone installed mode

`@media (display-mode: standalone)` keeps:
- full dynamic viewport height;
- dark app background;
- safe-area layout.

There is no separate installed-PWA UI implementation; the same product surface runs in browser and standalone modes.

## PWA runtime ownership

PWA state is transient AppState:
- installAvailable;
- manualInstallAvailable;
- installed;
- updateReady;
- offline.

It is not:
- WorldDocument;
- history;
- IndexedDB World data;
- Snapshot data;
- backup data.

PwaController owns browser events/registration.

PwaView owns only visible install/update/offline presentation.

## Progressive enhancement

If service workers are unavailable:
- Loop remains a normal web app.

If install prompts are unavailable:
- Loop remains usable in browser.

If IndexedDB is unavailable:
- Phase 10 already falls back to an unsaved session.

PWA functionality may fail independently without crashing musical play.

## Build verification

The normal production build is now also a PWA integrity check.

Build fails if required output is missing:
- index.html;
- manifest.webmanifest;
- favicon;
- PWA icon assets.

Build also fails if the manifest lacks explicit:
- 192×192 icon;
- 512×512 icon.

A successful build must emit `dist/sw.js`.

## Public deployment boundary

Phase 13 makes the app technically ready for GitHub Pages/PWA deployment.

It does **not** publish the unfinished development build.

Public deployment remains Phase 18 after:
- functional/data audit;
- UX/accessibility audit;
- performance/soak certification;
- release-candidate verification.

## Feature freeze

With Phase 13 complete, all planned V1 product features are implemented.

From Phase 14 onward:
- no new creative systems;
- no new production/studio systems;
- no roadmap expansion;
- no visual feature expansion.

Only:
- bug fixes;
- regressions;
- accessibility corrections;
- performance fixes;
- compatibility fixes;
- release blockers

may change the product unless the product contract is explicitly reopened.
