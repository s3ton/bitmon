# bitmon

**bitmon** is a **smartphone-first, portrait-only, installable PWA** creature-collection RPG set on a 1:1 representation of Earth, rendered as an original **low-poly 2.5D** world.

The geographic base uses **OpenFreeMap as the sole geographic data source** and **MapLibre for rendering**. No physical building or road may be generated unless it exists in the OpenFreeMap tiles. Original window, roof, and facade art may be inferred from those tiles but does not claim to reproduce actual architecture. The game adds original facade and roof treatments on mapped buildings, plus characters and creatures. **Immediate development focus:** touch-controlled walking-avatar exploration with a fixed-angle camera that follows without rotating. **Later battles** zoom/reframe the camera in the same low-poly world, then return to the exploration view. Progression is local-first and verifiable with permissionless trainer registration, public randomness, restricted creature swaps, and player-led gyms.

## Documents

- [Product Requirements](docs/PRODUCT_REQUIREMENTS.md) — player-facing development requirements.
- [Technical Design](docs/TECHNICAL_DESIGN.md) — mechanics, verification, anti-farming, trading, gyms, and sponsorship.
- [Development Tracker](docs/DEVELOPMENT_TRACKER.md) — implementation status, acceptance evidence, open decisions, and requirements change history.
- [Agent Engineering Skill](skill.md) — mandatory test minimization, no-dead-code policy, simplification review, and PR-to-preview workflow.

The source repository is **public**. The initial map/PWA prototype is live at [https://s3ton.github.io/bitmon/](https://s3ton.github.io/bitmon/), published as compiled `dist/` output from `main`. The owner confirmed that the deployed application works on 2 November 2026. [Task 001 PR #3](https://github.com/s3ton/bitmon/pull/3) was merged into `preview`; [release PR #4](https://github.com/s3ton/bitmon/pull/4) promoted it to `main`. [The Pages workflow](https://github.com/s3ton/bitmon/actions/runs/41504378759) passed.

## Current prototype status

**Implemented:** A fixed-angle low-poly MapLibre world centered on Brera, Milan, using only OpenFreeMap roads, paths, water, land use and mapped building footprints. Includes a portrait orientation prompt, PWA manifest/icons, lightweight offline app shell and required map attribution.

**Next:** Four-direction walking avatar, touch movement, map-aligned collision and camera following. Creatures, encounters, battles, wallets and blockchain features are not implemented.

**Acceptance still open:** Android/iOS home-screen install and standalone mode, detailed geographic-source/geometry audits, multi-device performance and portrait screenshots. A successful deployment and owner feedback do not establish those checks. Track exact status in the [Development Tracker](docs/DEVELOPMENT_TRACKER.md).

## Local build

```sh
npm install
npm run check
npm run build
npm run dev
```

## GitHub Pages smartphone test

1. The [Pages source setting](https://github.com/s3ton/bitmon/settings/pages) is configured for **GitHub Actions**; keep it set to Actions rather than deploying repository source files.
2. Merge feature work into `preview` through a reviewed PR; promote `preview` to `main` through a separate release PR. [The Pages workflow](https://github.com/s3ton/bitmon/actions/workflows/pages.yml) runs only when `main` changes and uploads only `dist/`.
3. Open `https://s3ton.github.io/bitmon/` on a portrait phone. Check map fidelity and attribution, rotate the device and test adding the PWA to the home screen. Record exact device and installation results before marking acceptance criteria complete.

Map tiles still need network access; only the app shell is cached. The public URL is a preview, not a verified game.

These are working design documents, not a completed game or security audit.
