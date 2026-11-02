# bitmon

**bitmon** is a **smartphone-first, portrait-only, installable PWA** creature-collection RPG set on a 1:1 representation of Earth, rendered as an original **low-poly 2.5D** world.

The geographic base uses **OpenFreeMap as the sole geographic data source** and **MapLibre for rendering**. No physical building or road may be generated unless it exists in the OpenFreeMap tiles. Original window, roof, and facade art may be inferred from those tiles but does not claim to reproduce actual architecture. The game adds original facade and roof treatments on mapped buildings, plus characters and creatures. **Immediate development focus:** touch-controlled walking-avatar exploration with a fixed-pitch/zoom camera that smoothly turns toward the actual movement heading. **Later battles** zoom/reframe in the same low-poly world, then restore and resume heading-following exploration. Progression is local-first and verifiable with permissionless trainer registration, public randomness, restricted creature swaps, and player-led gyms.

## Documents

- [Product Requirements](docs/PRODUCT_REQUIREMENTS.md) — player-facing development requirements.
- [Technical Design](docs/TECHNICAL_DESIGN.md) — mechanics, verification, anti-farming, trading, gyms, and sponsorship.
- [Development Tracker](docs/DEVELOPMENT_TRACKER.md) — implementation status, acceptance evidence, open decisions, and requirements change history.
- [Agent Engineering Skill](skill.md) — mandatory test minimization, no-dead-code policy, simplification review, and PR-to-preview workflow.

The source repository is **public**. The compiled test PWA is live at [https://s3ton.github.io/bitmon/](https://s3ton.github.io/bitmon/), deployed from **`main`** by GitHub Actions. [Deployment run 41504378759](https://github.com/s3ton/bitmon/actions/runs/41504378759) succeeded on 2 November 2026, and the repository owner confirmed the site works. No separate distribution repository is needed.

## Current development status (2 November 2026)

- [Task 001 PR #3](https://github.com/s3ton/bitmon/pull/3) merged into `preview`; [release PR #4](https://github.com/s3ton/bitmon/pull/4) merged `preview` into `main`.
- The **Task 001 map-rendering foundation** is live on `main`: OpenFreeMap geographic tiles, extruded mapped buildings, oblique 45° camera pitch, portrait fallback and installable PWA shell.
- [**Task 002 PR #8**](https://github.com/s3ton/bitmon/pull/8) has been released from `main` via [PR #9](https://github.com/s3ton/bitmon/pull/9), but the owner's first phone test shows **movement is blocked** and the placeholder SVG avatar does not meet the desired illustration quality.
- [**Corrective PR #10**](https://github.com/s3ton/bitmon/pull/10) and [PWA cache PR #12](https://github.com/s3ton/bitmon/pull/12) are merged into `preview`; the [release PR #11](https://github.com/s3ton/bitmon/pull/11) remains open. Their phone acceptance is pending.
- [**Task 002 refinement PR #13**](https://github.com/s3ton/bitmon/pull/13) is merged into `preview`: a **much smaller street-scale trainer**, an **eight-way 40-frame atlas**, **10 m/s full-speed geographic walking**, and an **invisible floating joystick** that appears under the finger only for gestures begun between 20% and 80% of portrait screen height. This has **not yet been released to `main` or phone-verified**.
- The repository owner confirmed installation and successful launch on a smartphone, and reports high real-world map fidelity. This is not a formal geometry audit.
- **Still pending:** owner re-test of movement, map collision and sprite quality, cross-platform Android/iOS support, service-worker/offline behavior, tile-edge handling, screenshots and performance.

## Local build

```sh
npm install
npm run check
npm run build
npm run dev
```

## GitHub Pages smartphone test

1. Open [Settings → Pages](https://github.com/s3ton/bitmon/settings/pages) and set **Build and deployment → Source** to **GitHub Actions**.
2. Merge feature work into `preview` through a reviewed PR; promote `preview` to `main` through a separate release PR. [The Pages workflow](https://github.com/s3ton/bitmon/actions/workflows/pages.yml) runs only when `main` changes and uploads only `dist/`.
3. When the deployment succeeds, open `https://s3ton.github.io/bitmon/` on a portrait phone. Swipe anywhere in the middle 60% of screen height to reveal a temporary joystick; verify the top/bottom 20% do not move the trainer, then test 10 m/s cardinal/diagonal walking, small human-scale appearance, camera rotation, collisions, map attribution, portrait fallback and PWA restart.

Map tiles still need network access; only the app shell is cached. The public URL is a preview, not a verified game.

These are working design documents, not a completed game or security audit.
