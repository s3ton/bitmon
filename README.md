# bitmon

**bitmon** is a **smartphone-first, portrait-only, installable PWA** creature-collection RPG set on a 1:1 representation of Earth, rendered as an original **low-poly 2.5D** world.

The geographic base uses **OpenFreeMap as the sole geographic data source** and **MapLibre for rendering**. No physical building or road may be generated unless it exists in the OpenFreeMap tiles. Original window, roof, and facade art may be inferred from those tiles but does not claim to reproduce actual architecture. The game adds original facade and roof treatments on mapped buildings, plus characters and creatures. **Immediate development focus:** touch-controlled walking-avatar exploration with a fixed-angle camera that follows without rotating. **Later battles** zoom/reframe the camera in the same low-poly world, then return to the exploration view. Progression is local-first and verifiable with permissionless trainer registration, public randomness, restricted creature swaps, and player-led gyms.

## Documents

- [Product Requirements](docs/PRODUCT_REQUIREMENTS.md) — player-facing development requirements.
- [Technical Design](docs/TECHNICAL_DESIGN.md) — mechanics, verification, anti-farming, trading, gyms, and sponsorship.
- [Development Tracker](docs/DEVELOPMENT_TRACKER.md) — implementation status, acceptance evidence, open decisions, and requirements change history.
- [Agent Engineering Skill](skill.md) — mandatory test minimization, no-dead-code policy, simplification review, and PR-to-preview workflow.

The source repository is now **public**. The test PWA is deployed to [GitHub Pages](https://s3ton.github.io/bitmon/) directly from this repository once Pages is enabled and the workflow succeeds. No separate distribution repository is needed.

## Local build

```sh
npm install
npm run check
npm run build
npm run dev
```

## GitHub Pages smartphone test

1. Open [Settings → Pages](https://github.com/s3ton/bitmon/settings/pages) and set **Build and deployment → Source** to **GitHub Actions**.
2. Check the [Pages deployment workflow](https://github.com/s3ton/bitmon/actions/workflows/pages.yml). It uploads only `dist/`. While Task 001 is in review, the named feature branch can publish for smartphone testing; remove this temporary trigger before merging to `preview`.
3. Once the deployment succeeds, open `https://s3ton.github.io/bitmon/` on a portrait phone, test the map and attribution, rotate the device and add the PWA to the home screen.

Map tiles still need network access; only the app shell is cached. The public URL is a preview, not a verified game.

These are working design documents, not a completed game or security audit.
