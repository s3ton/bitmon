# bitmon

**bitmon** is a **smartphone-first, portrait-only, installable PWA** creature-collection RPG set on a 1:1 representation of Earth, rendered as an original **low-poly 2.5D** world.

The geographic base uses **OpenFreeMap as the sole geographic data source** and **MapLibre for rendering**. No physical building or road may be generated unless it exists in the OpenFreeMap tiles. Original window, roof, and facade art may be inferred from those tiles but does not claim to reproduce actual architecture. The game adds original facade and roof treatments on mapped buildings, plus characters and creatures. **Immediate development focus:** touch-controlled walking-avatar exploration with a normally 45° zoomable camera that gently recenters after sustained movement and tilts toward overhead only when real mapped buildings obscure the avatar. **Later battles** zoom/reframe in the same low-poly world, then restore and resume heading-following exploration. Progression is local-first and verifiable with permissionless trainer registration, public randomness, restricted creature swaps, and player-led gyms.

## Documents

- [Product Requirements](docs/PRODUCT_REQUIREMENTS.md) — player-facing development requirements.
- [Technical Design](docs/TECHNICAL_DESIGN.md) — mechanics, verification, anti-farming, trading, gyms, and sponsorship.
- [Development Tracker](docs/DEVELOPMENT_TRACKER.md) — implementation status, acceptance evidence, open decisions, and requirements change history.
- [Agent Engineering Skill](skill.md) — mandatory test minimization, no-dead-code policy, simplification review, and PR-to-preview workflow.

The source repository is **public**. The currently deployed build is [bitmon Stable](https://s3ton.github.io/bitmon/) from `main`. A [bitmon Preview](https://s3ton.github.io/bitmon/preview/) channel is now deployed alongside Stable. A Preview-specific app ID and purple icon were integrated to distinguish its installation from Stable; smartphone confirmation of independent installs remains pending. The two PWAs share GitHub Pages hosting but use separate manifest identities and service-worker caches; no second repository is required.

## Current development status (3 November 2026)

- [Task 001 PR #3](https://github.com/s3ton/bitmon/pull/3) and [release PR #4](https://github.com/s3ton/bitmon/pull/4) established the map, portrait PWA and initial deployment. The owner installed the app on a phone and reported strong geographic fidelity; that report is not a source-geometry audit.
- Task 002 exploration has reached Stable: street-scale geographic movement at **10 m/s**, eight-direction walking sprites, an invisible floating joystick within the middle **80%** of the portrait screen, corrected direction, and zoom **15.5–20**. The soft-follow heading camera and camera responsiveness presets are under the top-right hamburger menu. The reviewed [release PR #11](https://github.com/s3ton/bitmon/pull/11) and [PR #25](https://github.com/s3ton/bitmon/pull/25) are merged.
- The [building occlusion change #24](https://github.com/s3ton/bitmon/pull/24) adjusts camera pitch just enough to reveal a trainer blocked by a mapped building, rather than drawing the trainer through walls. CI and Pages deployment passed on 2 November. Phone acceptance of camera, movement, collision and sprite readability remains pending.
- [Maintenance PR #26](https://github.com/s3ton/bitmon/pull/26) has merged to `preview`: a tracked lockfile, `npm ci` CI/build steps, build-revisioned offline app shell and a deliberate update/reload prompt. Stable is unchanged pending separately approved promotion.
- [**New Preview feature PR #27**](https://github.com/s3ton/bitmon/pull/27): enter latitude/longitude under the top-right settings menu and tap **Go** to jump to a loaded, walkable source location; save the last accepted trainer coordinate locally; retain visited OpenFreeMap vector tiles for offline walking in a bounded 100 MiB per-channel map cache. This is prototype navigation, not an authenticated location/progression system.
- **Not yet accepted:** independent installed Preview/Stable behavior on devices, Android/iOS offline/update flow, coordinate-jump cancellation and map-cache eviction, tile-boundary collisions, device performance, and wider source-geometry fidelity.

## Toolchain

Use **Node.js 26 LTS** (root `.nvmrc`, package engine, and GitHub Actions). Direct packages are exact-pinned: MapLibre GL JS 6.16.0, Vite 8.3.5 and TypeScript 7.0.2. PR #26 adds `package-lock.json` (npm lockfile v3) and switches both CI jobs to `npm ci` for reproducible transitive dependencies. **The Pages workflow executes from `main`**, so its `npm ci` change only takes effect after an explicitly approved promotion to `main`.

## Local build

```sh
nvm use
npm ci
npm run check
npm run build
npm run dev
```

The build stamps `dist/sw.js` with a digest of the compiled app shell and assets so each changed deployed build is detectable by the browser, even if the service-worker source itself did not change.

**Preview map storage:** When deployed, the exploration PWA keeps only the OpenFreeMap vector tiles that are actually requested while viewing and walking, or explicitly jumping to coordinates. MapLibre reads and writes them through IndexedDB (not a speculative planet download). The storage target is **100 MiB of tile bytes per channel**; when full, farthest-from-player cached tiles are deleted to make room, while the player's current tile is protected. The live map and settings indicator show how much is used. The saved player coordinate uses a channel-specific localStorage key. Neither location nor map tiles are sent to a bitmon server; online loading still contacts OpenFreeMap. The browser may independently clear stored site data.

## Two GitHub Pages PWAs — phone testing and stable releases

1. Keep [Settings → Pages](https://github.com/s3ton/bitmon/settings/pages) set to **GitHub Actions** with `github-pages` environment deployments restricted to `main`. The independent Preview/Stable publishing infrastructure has already been bootstrapped on `main`.
2. After deployment, open and install **[bitmon Preview](https://s3ton.github.io/bitmon/preview/)** to test the latest reviewed `preview` branch. It should have a **purple Preview icon and "bitmon DEV" home-screen label**, distinct from the teal Stable app. A successful `preview` push CI automatically republishes Preview without a gameplay merge to `main`. The root [bitmon Stable](https://s3ton.github.io/bitmon/) remains compiled only from `main`.
3. On a portrait phone, verify Preview offers a **separate installation**, with its purple icon and distinct name, while Stable remains installed. Then check joystick up/down direction, short sidesteps/backward walks without sudden camera flips, source-driven automatic overhead tilt instead of through-wall avatar rendering, the top-right hamburger menu with camera presets (close it by choosing a preset), 10 m/s diagonals, 15.5–20 right-side zoom slider, scale-adjusting trainer, collision, offline shell and both home-screen launches. For the new prototype: enter coordinates such as `45.4715, 9.1869` (latitude first), confirm an online jump to walkable land and invalid/unavailable destination rejection, walk around to save tiles, reload to restore position, then switch offline and verify movement stops at the edge of uncached geography. Verify changing preview leaves Stable unchanged.
4. [Release PR #11](https://github.com/s3ton/bitmon/pull/11) and [release PR #25](https://github.com/s3ton/bitmon/pull/25) have been merged. Future changes to Stable still require a separate, explicitly approved `preview` → `main` release PR.

On a device running a previously installed version, a new service worker waits until the user taps **Reload** in the update notice; a new build does not forcibly reload an active session. After PR #26 reaches Preview, test this by deploying a subsequent changed Preview build, reopening/foregrounding the installed app, and verifying that the prompt appears and reloads only on request. Check offline reopening of the cached shell and confirm Stable's cache is unchanged. Both PWAs require internet for uncached OpenFreeMap tiles; previously visited vector tiles can be used offline after the new feature is deployed. No game progress is saved yet; future localStorage or IndexedDB keys must be namespaced by channel because browser storage is origin-wide.

These are working design documents, not a completed game or security audit.
