# bitmon

**bitmon** is a **smartphone-first, portrait-only, installable PWA** creature-collection RPG set on a 1:1 representation of Earth, rendered as an original **low-poly 2.5D** world.

The geographic base uses **OpenFreeMap as the sole geographic data source** and **MapLibre for rendering**. No physical building or road may be generated unless it exists in the OpenFreeMap tiles. Original window, roof, and facade art may be inferred from those tiles but does not claim to reproduce actual architecture. The game adds original facade and roof treatments on mapped buildings, plus characters and creatures. **Immediate development focus:** touch-controlled walking-avatar exploration with a fixed-pitch, zoomable camera that gently recenters only after sustained movement. **Later battles** zoom/reframe in the same low-poly world, then restore and resume heading-following exploration. Progression is local-first and verifiable with permissionless trainer registration, public randomness, restricted creature swaps, and player-led gyms.

## Documents

- [Product Requirements](docs/PRODUCT_REQUIREMENTS.md) — player-facing development requirements.
- [Technical Design](docs/TECHNICAL_DESIGN.md) — mechanics, verification, anti-farming, trading, gyms, and sponsorship.
- [Development Tracker](docs/DEVELOPMENT_TRACKER.md) — implementation status, acceptance evidence, open decisions, and requirements change history.
- [Agent Engineering Skill](skill.md) — mandatory test minimization, no-dead-code policy, simplification review, and PR-to-preview workflow.

The source repository is **public**. The currently deployed build is [bitmon Stable](https://s3ton.github.io/bitmon/) from `main`. A [bitmon Preview](https://s3ton.github.io/bitmon/preview/) channel is now deployed alongside Stable. A Preview-specific app ID and purple icon were integrated to distinguish its installation from Stable; smartphone confirmation of independent installs remains pending. The two PWAs share GitHub Pages hosting but use separate manifest identities and service-worker caches; no second repository is required.

## Current development status (2 November 2026)

- [Task 001 PR #3](https://github.com/s3ton/bitmon/pull/3) merged into `preview`; [release PR #4](https://github.com/s3ton/bitmon/pull/4) merged `preview` into `main`.
- The **Task 001 map-rendering foundation** is live on `main`: OpenFreeMap geographic tiles, extruded mapped buildings, oblique 45° camera pitch, portrait fallback and installable PWA shell.
- [**Task 002 PR #8**](https://github.com/s3ton/bitmon/pull/8) has been released from `main` via [PR #9](https://github.com/s3ton/bitmon/pull/9), but the owner's first phone test shows **movement is blocked** and the placeholder SVG avatar does not meet the desired illustration quality.
- [**Corrective PR #10**](https://github.com/s3ton/bitmon/pull/10) and [PWA cache PR #12](https://github.com/s3ton/bitmon/pull/12) are merged into `preview`; the [release PR #11](https://github.com/s3ton/bitmon/pull/11) remains open. Their phone acceptance is pending.
- [**Task 002 refinement PR #13**](https://github.com/s3ton/bitmon/pull/13) is merged into `preview`: the eight-way 40-frame atlas, **10 m/s** geographic walking, and invisible floating joystick. The latest follow-up expands the joystick start area from the historical 20–80% range to **10–90%** of portrait screen height. Stable remains unchanged; owner phone acceptance is pending.
- [Control/zoom PR #17](https://github.com/s3ton/bitmon/pull/17) was followed by merged [PR #19](https://github.com/s3ton/bitmon/pull/19), correcting downward input, rendering the avatar at 2× display size (not physical collision size), and extending the zoom slider to level 20. A new soft-follow camera replaces rapid heading chase with a short delay, yaw speed cap, idle freeze, reverse-movement hold and three camera response presets (**Balanced** default). Phone acceptance remains pending.
- The repository owner confirmed installation and successful launch on a smartphone, and reports high real-world map fidelity. This is not a formal geometry audit.
- **Still pending:** owner re-test of movement, map collision and sprite quality, cross-platform Android/iOS support, service-worker/offline behavior, tile-edge handling, screenshots and performance.

## Local build

```sh
npm install
npm run check
npm run build
npm run dev
```

## Two GitHub Pages PWAs — phone testing and stable releases

1. Keep [Settings → Pages](https://github.com/s3ton/bitmon/settings/pages) set to **GitHub Actions** with `github-pages` environment deployments restricted to `main`. First, review/merge the small **infrastructure-only main release PR** (not gameplay PR #11), which activates the dual-channel Pages workflow on the default branch.
2. After deployment, open and install **[bitmon Preview](https://s3ton.github.io/bitmon/preview/)** to test the latest reviewed `preview` branch. It should have a **purple Preview icon and "bitmon DEV" home-screen label**, distinct from the teal Stable app. It auto-updates after `preview` branch **successful** push CI, without a gameplay merge to `main`. The root [bitmon Stable](https://s3ton.github.io/bitmon/) remains compiled only from `main`.
3. On a portrait phone, verify Preview offers a **separate installation**, with its purple icon and distinct name, while Stable remains installed. Then check joystick up/down direction, short sidesteps/backward walks without sudden camera flips, the top-right camera preset selector, 10 m/s diagonals, 15.5–20 right-side zoom slider, scale-adjusting trainer, collision, offline shell and both home-screen launches. Verify changing preview leaves Stable unchanged.
4. **Only after approving the preview**, merge a reviewed `preview` → `main` release PR (currently [#11](https://github.com/s3ton/bitmon/pull/11)) to promote its exact gameplay to Stable. Existing GitHub Pages deploys both compiled outputs together, not two separate Pages sites.

Both PWAs need internet for uncached map tiles. Current source code has no saved game progress; any future localStorage or IndexedDB keys must include the channel name because browser storage is shared by origin.

These are working design documents, not a completed game or security audit.
