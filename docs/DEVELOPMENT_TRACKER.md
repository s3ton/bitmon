# bitmon — Development Tracker

**Purpose:** Track implementation progress, evidence, blockers, and product decisions separately from the normative [Product Requirements](PRODUCT_REQUIREMENTS.md).  
**Baseline PRD:** v0.20 (3 November 2026)  
**Related design:** [Technical Design](TECHNICAL_DESIGN.md)  
**Tracker created:** 2 November 2026  
**Current reporting state:** Task 002 camera, controls and occlusion corrections are deployed to Stable via PR #25; phone acceptance remains outstanding. Maintenance [PR #26](https://github.com/s3ton/bitmon/pull/26) was merged into preview (not main) on 3 November and provides reproducible builds and opt-in PWA updates. The new coordinate jump/locally persisted position/100 MiB visited-vector-tile cache implementation was merged to `preview` via [PR #27](https://github.com/s3ton/bitmon/pull/27); device acceptance remains pending. The installed-PWA-only persistence change was merged to `preview` via [PR #29](https://github.com/s3ton/bitmon/pull/29), with device acceptance pending. The source-cleanup and settings-persistence feature was merged into `preview` via [PR #30](https://github.com/s3ton/bitmon/pull/30); phone acceptance remains pending, and no merge to `main` is authorized. **Last evidence review:** 3 November 2026.

> **Separation of concerns:** The PRD says **what bitmon must do from the player's perspective**. This tracker says **what has been implemented, tested, blocked, or decided**. Changing a requirement requires updating the PRD first (or in the same change), then logging it here. Do not silently redefine requirements through tracker comments.

## 1. How progress is recorded

**Allowed status values**

- **Not started** — No implementation and acceptance evidence linked here.
- **In progress** — Work has started; link the branch/PR/issue and responsible owner.
- **Blocked** — Work cannot proceed until a named dependency or decision is resolved.
- **In review** — Candidate implementation exists, but acceptance tests or review are incomplete.
- **Done** — Requirement has implementation evidence and user-visible acceptance criteria have passed.
- **Deferred** — Explicitly postponed; state the decision and release impact.

Each requirement should eventually record an **owner**, GitHub issue/PR, test/demo evidence, remaining blocker, and last verified date. The statuses below describe **documented evidence**, not assumptions about work outside this repository.

**Current overview:** 32 tracked requirements: **0 fully accepted Done, 10 In review, 22 Not started**. A publicly accessible map/PWA shell is deployed and has received a positive owner smoke-test report, but the recorded evidence does not yet establish the full player-facing acceptance criteria (especially avatar/movement, Android/iOS installation and map fidelity audits).

## 2. Requirements implementation matrix

The requirement IDs and language are defined in [PRODUCT_REQUIREMENTS.md](PRODUCT_REQUIREMENTS.md). Priority refers to the *first relevant slice* of each requirement: **E0** = exploration-only PWA prototype (immediate focus), **P0** = later verified game vertical slice, **P1** = usable first release. E0 completion must not be confused with fully verified play or worldwide coverage.

| ID | Player-facing capability | Priority | Status | First acceptance evidence to attach | Owner / issue / PR |
|---|---|---|---|---|---|
| WORLD-01 | Earth geography preserved in the mapped world | E0 | In review | Compare a known OpenFreeMap neighborhood with bitmon at source coordinates; no fabricated features | [#3](https://github.com/s3ton/bitmon/pull/3) |
| WORLD-02 | Roads and paths correspond to existing OpenFreeMap geometry | E0 | In review | Road-source feature audit; test no added road, intersection, alley or connector | [#3](https://github.com/s3ton/bitmon/pull/3) |
| WORLD-03 | Distinct environments and habitats from available tile context | P0 | Not started | Demonstrate tile-driven park/water/residential-context artwork with neutral fallbacks | — |
| WORLD-04 | Global continuity and graceful gaps | P1 | Not started | Urban, rural and missing-data scenarios without invented geography | — |
| VIS-01 | Soft-follow camera with preset delay/capped yaw, building-safe pitch and 15.5–20 zoom slider | E0 | In review — device check pending | Phone checks hamburger accessibility/preset dismissal, delayed turns, no reverse flip/idle coast, visible zoom, 45° pitch and avatar resizing | [#8](https://github.com/s3ton/bitmon/pull/8), control/zoom fix PR |
| VIS-02 | Mapped building footprints become low-poly volumes | E0 | In review | Source polygon ↔ simple rendered volume test; no unsourced building instance | [#3](https://github.com/s3ton/bitmon/pull/3) |
| VIS-03 | OpenFreeMap-only inferred facade and window art | E0 | Not started | Deterministic generic + residential-like variants using only source tile fields/context | — |
| VIS-04 | Layers, roofs and player occlusion work together | P0 | In review — source-based pitch correction | Walk behind mapped buildings: no through-wall overlay, camera pitches toward overhead then restores 45°, collision unchanged | — |
| VIS-05 | Low-poly streaming and smartphone performance | P0 | Not started | Dense-city seam and low-/mid-range portrait-phone performance demonstration | — |
| MOVE-01 | 10 m/s geographic movement, screen-relative vertical touch mapping, floating 80% joystick and diagonals | E0 | In review — inversion fix merged; owner device retest pending | Device verifies swipe up/down against intended direction, slider never triggers joystick, 10 m/s maximum and mapped collision | [#13](https://github.com/s3ton/bitmon/pull/13), control/zoom fix PR |
| EXPL-01 | Illustrated avatar with 2× visual scale; 8 directions × idle + four walking frames | E0 | In review — owner art/scale approval pending | Confirm street/person-relative scale, diagonal direction sprites and gait/idle vs rotating camera | [#13](https://github.com/s3ton/bitmon/pull/13) |
| MOVE-02 | Practical long-distance world travel | P1 | Not started — E0 coordinate jump is not canonical travel | Define verified travel/anti-seed-shopping rules before treating arbitrary jumps as progress | — |
| MOVE-03 | Player location privacy | P1 | Not started | Verified exploration flow with no mandatory GPS permission | — |
| ENC-01 | Registration precedes verified encounter randomness | P0 | Not started | Reject pre-registration/guest encounter on verified settlement | — |
| ENC-02 | Location-aware encounters without hindsight selection | P1 | Not started | Threat-model test: choose location after randomness reveal → invalid | — |
| ENC-03 | Turn-based local encounter and deterministic capture | P0 | Not started | One encounter/capture plus proof of valid state transition | — |
| ENC-04 | Limited, fair and understandable encounter opportunities | P1 | Not started | Tests for quota, uniqueness, timing and rarity rules | — |
| GAME-01 | Inspectable, coherent bitmon collection | P0 | Not started | Starter + one captured bitmon show traits and pending/finalized status | — |
| GAME-02 | Deterministic combat and capture | P0 | Not started | Same input actions → same legal result across clients | — |
| CAM-01 | Same-world battle zoom and restore heading-following exploration mode | P0 (post-E0) | Not started | Restore captured pre-battle pose, then resume automatic heading following | — |
| GAME-03 | Pending save, finalization and recovery | P0 | Not started | Save locally, finalize, export/import and show correct status | — |
| TRADE-01 | Same-tier, one-for-one restricted swaps | P1 | Not started | Atomic swap with level reset and 24-hour quota tests | — |
| GYM-01 | Each gym has one immutable type | P1 | Not started | Fire and Fire/Wind allowed, Water/Wind rejected | — |
| GYM-02 | Win and defend a player-led gym | P1 | Not started | Verified challenge changes leader, eligible defense snapshots stay locked | — |
| GYM-03 | Fame and history without financial reward | P1 | Not started | View reigns, defenses and non-transferable recognition | — |
| ACCOUNT-01 | Permissionless registration-first onboarding | P0 | Not started | Wallet + verified genesis + first safe future encounter epoch | — |
| FEES-01 | Optional sponsorship without sponsor dependency | P1 | Not started | Self-paid progression succeeds when sponsor is unavailable | — |
| INDEPENDENCE-01 | Alternative client/map endpoint continuity | P1 | Not started | Equivalent OpenFreeMap mirror/self-hosted tiles and independent settlement | — |
| UX-01 | Usable, accessible controls and clear status | P0 | Not started | Portrait touch UI, loading, attribution and finality states | — |
| MOBILE-01 | Smartphone-first, portrait-only gameplay | E0 | In review | Portrait UI covers all play; unsupported landscape rotation preserves state with prompt | [#3](https://github.com/s3ton/bitmon/pull/3) |
| PWA-01 | Install independently named/iconed Preview and Stable PWA home-screen apps | E0 | In review — manifest-ID fix deployed; device re-test pending | Verify Preview prompts a separate installation with its own name/icon, Stable remains installed, standalone launch and scoped caches work | [#16](https://github.com/s3ton/bitmon/pull/16), install identity fix PR |
| DIST-01 | Separate Preview/Stable Pages builds with explicit unique Preview PWA ID | P0 | In review — distinct manifest identity deployed; device re-test pending | Confirm working links, independently installable icons and root stable stays unchanged by `preview` pushes | [#15](https://github.com/s3ton/bitmon/pull/15), [#16](https://github.com/s3ton/bitmon/pull/16), install identity fix PR |

## 3. Map fidelity release gates

These requirements are **fixed decisions**, not open design options. A change requires an explicit amendment to the PRD and this tracker.

| Gate | What a passing implementation proves | Status / evidence |
|---|---|---|
| MAP-GATE-01 — One geographic source | All rendered world geography comes from OpenFreeMap tiles; no external map/enrichment query or extra geographic database | Source review: one OpenFreeMap PBF tile source configured in `src/main.ts` using a local IndexedDB-backed MapLibre protocol; independent network/data audit pending |
| MAP-GATE-02 — No invented buildings | Every building volume corresponds to a source building footprint/part at the selected detail level; missing source polygon means nothing is built | Source review: extrusion layer uses the OpenFreeMap `building` source-layer; rendered-feature/footprint comparison pending |
| MAP-GATE-03 — No invented roads | Every visual road/path is traceable to the tile transportation geometry; no fake lane/path/link appears in gaps | Source review: road/path styling uses the OpenFreeMap `transportation` source-layer; feature-level audit pending |
| MAP-GATE-04 — Inferred art only | Window/facade/roof selection uses OpenFreeMap fields/context and deterministic art rules; no inferred building use is presented as an established fact | Not tested |
| MAP-GATE-05 — Style does not mutate geography | Building outlines remain within source footprints, road topology stays unchanged across art variants and tile boundaries | Not tested |
| MAP-GATE-06 — Missing-data fallback | Sparse/unknown areas use neutral styling or omissions, never generated physical features | Not tested |

**Evidence expected:** a build/demo URL or recording, tests comparing source features to rendered features, chosen OpenFreeMap tile/style revision, and any known limitations. "Looks plausible" alone does not satisfy the no-invented-geometry gates.

## 4. Development milestones

**Build only the exploration experience first.** Do not implement combat, ZK, registration, trading, gyms or advertising as dependencies of E0. The future game requirements remain documented.

| Milestone | Scope | Status | Exit evidence |
|---|---|---|---|
| M0 — Map feasibility | OpenFreeMap source inspection, low-poly art, facade inference and portrait phone baseline | In review | One reference neighborhood on a phone, tile evidence and no-enrichment proof |
| M1 / E0 — Animated avatar exploration | OpenFreeMap geometry, heading-up camera, 10 m/s floating-zone controls, compact eight-way sprite atlas and source collision | Blocked — previous failed device test | Owner confirms street-scale avatar, smooth diagonal walk/turning, valid 10–90% touch activation and collision/PWA on phone |
| M2 — First verified encounter and same-world battle | Registration-first onboarding, active identity, same-world camera zoom, local battle and proof/finalization | Not started | Battle retains mapped backdrop and returns camera; valid capture and replay rejection |
| M3 — Installable smartphone PWA slice | Portrait UI, local saves, collection, install manifest, app shell, GitHub Pages distribution | In progress | P0 acceptance on Android and iPhone, installed from GitHub Pages URL |
| M4 — Social mechanics | Fixed-type gyms, same-tier swaps, recognition, optional fees | Not started | Two independent clients can trade and claim a gym |
| M5 — First release readiness | Wider region coverage, travel, fair region binding, performance, recovery | Not started | P1 acceptance and security reviews complete |

Milestones are **proposed sequencing**, not calendar commitments. M1/E0's code is integrated through PRs #8, #10, #12 and #13, but its **first owner device check failed** and the corrective build is deployed, but a full device retest remains pending; M3 includes a confirmed owner-installed Task 001 PWA but requires offline/cross-platform evidence. Neither exit criterion has passed.

## 5. Decisions and requirement change log

This section records **requirements evolution** separately from actual implementation progress.

| Date | ID | State | Decision / change | PRD impact |
|---|---|---|---|---|
| 2026-11-02 | DEC-001 | Accepted | The product and creatures are named **bitmon** for now | v0.1 product identity |
| 2026-11-02 | DEC-002 | Accepted | World positions at 1:1 Earth scale; visually styled as an original 2.5D top-down RPG | v0.1 WORLD/VIS |
| 2026-11-02 | DEC-003 | Accepted | Verified trainer registration happens **before** eligible randomness and canonical encounters | v0.1 ACCOUNT/ENC |
| 2026-11-02 | DEC-004 | Accepted | Gyms have **one immutable type**; dual-type bitmon qualify when either matches | v0.1 GYM |
| 2026-11-02 | DEC-005 | Accepted | Restricted same-tier one-for-one swaps, lower-level reset, one per 24 hours | v0.1 TRADE |
| 2026-11-02 | DEC-006 | **Accepted** | **OpenFreeMap is the sole geographic data source.** Do not use enriched OSM, alternative map sources, or extra building databases | **v0.2** WORLD/VIS/§15 |
| 2026-11-02 | DEC-007 | **Accepted** | **Never invent buildings or roads absent in OpenFreeMap.** Artistic invention is confined to rendering mapped structures/surfaces | **v0.2** WORLD/VIS/§15 |
| 2026-11-02 | DEC-008 | **Accepted** | Building facades may be plausible deterministic **visual inferences** from OpenFreeMap attributes and tile context; uncertain usage is not a factual label | **v0.2** VIS-03/§15 |
| 2026-11-02 | DEC-009 | Accepted | Track implementation progress and product-requirement changes here rather than clutter the PRD with status fields | New Development Tracker |
| 2026-11-02 | DEC-010 | **Accepted** | **Smartphones are the primary platform**; bitmon is delivered as an installable PWA | **v0.3** MOBILE-01, PWA-01 |
| 2026-11-02 | DEC-011 | **Accepted** | **Portrait-only** gameplay; no landscape game layout; use a rotate-device fallback where orientation lock is unsupported | **v0.3** MOBILE-01 |
| 2026-11-02 | DEC-012 | **Accepted** | Original **low-poly 2.5D** style replaces pixel-art framing; simpler meshes/materials and mobile rendering priority | **v0.3** VIS-01/02/03/05 |
| 2026-11-02 | DEC-013 | **Accepted** | **GitHub-only publishing**: private source repository, separate public build-only PWA repository hosted with GitHub Pages | **v0.3** DIST-01 |
| 2026-11-02 | DEC-014 | **Superseded by DEC-019** | Former constant-bearing exploration camera; neither bearing nor pitch turned while walking | **v0.4** VIS-01, EXPL-01 |
| 2026-11-02 | DEC-015 | **Accepted** | **Same-world battles:** camera zooms/reframes to bitmon against existing mapped low-poly world; restores original exploration framing afterward | **v0.4** CAM-01 |
| 2026-11-02 | DEC-016 | **Accepted** | **Exploration-only E0 now comes first:** touch movement with a male four-direction walking avatar; defer battle, wallet and blockchain | **v0.4** EXPL-01, E0 milestone |
| 2026-11-02 | DEC-017 | **Superseded by DEC-018** | Public-source-repository Pages testing was initially proposed from feature/`preview` | **v0.5** DIST-01 |
| 2026-11-02 | DEC-018 | **Superseded by DEC-022 for preview publishing** | Earlier Pages workflow published only on `main` pushes; retained separation of `preview`/`main` release responsibilities | **v0.6** DIST-01 |
| 2026-11-02 | DEC-019 | **Accepted — supersedes DEC-014** | Exploration pitch/zoom remain fixed; camera smooth-turns to actual accepted movement heading via shortest path, retaining bearing when idle; manual rotate/tilt disabled | **v0.7** VIS-01, MOVE-01, EXPL-01, CAM-01, E0/P0 |
| 2026-11-02 | DEC-020 | **Accepted** | Original illustrated four-direction character atlas with discrete walking poses replaces procedural placeholder SVG; spawn must be collision-safe on OpenFreeMap world | **v0.8** EXPL-01, MOVE-01 |
| 2026-11-02 | DEC-021 | **Accepted** | Trainer is small and roughly human-scale (1.8 m target with 8 px readability floor); exploration full-speed 10 m/s; animate 8-way including mirrored diagonals; float hidden joystick under finger only for pointer starts within 20–80% viewport height | **v0.9** VIS-01, MOVE-01, EXPL-01, E0/P0 |
| 2026-11-02 | DEC-022 | **Accepted — supersedes DEC-018 trigger policy** | One Pages site hosts Preview (`/bitmon/preview/`) and Stable (`/bitmon/`) from distinct branches, with protected `main` deployment and scoped caches | **v0.10** DIST-01, PWA-01 |
| 2026-11-02 | DEC-023 | **Accepted** | Correct origin-root Preview manifest-ID collision via explicit `/bitmon/preview/` ID and purple Preview icon; introduce right-side zoom slider (initial 15.5–18.5) while pitch stays fixed and heading-following remains automatic; attempted joystick Y correction proved inverted on phone | **v0.11** PWA-01, DIST-01, MOVE-01, VIS-01, CAM-01 |
| 2026-11-02 | DEC-024 | **Accepted — supersedes DEC-023 joystick mapping and zoom upper limit** | Interpret touch Y as down-positive and negate it for camera-relative geographic heading, just as keyboard input does; scale displayed trainer dimensions 2× without changing world collision; extend slider and map maximum zoom to 20 | **v0.12** MOVE-01, VIS-01, EXPL-01, CAM-01 |
| 2026-11-02 | DEC-025 | **Accepted — supersedes DEC-021 activation zone only** | Increase floating joystick start zone to viewport fractions 0.1–0.9 (middle 80%); keep top/bottom 10% excluded. Double-size sprite is a rendering/readability adjustment, not a physical growth of the trainer; collision probes remain in geographic meters regardless of zoom. | **v0.13** MOVE-01, EXPL-01, MOBILE-01 |
| 2026-11-02 | DEC-026 | **Accepted — refines DEC-019 camera responsiveness** | Replace immediate heading chase with delayed soft-follow yaw, capped angular speed, 12° turn dead zone, reverse-input guard and idle freeze. Add Relaxed/Balanced/Responsive presets for mobile tuning; position follows immediately and camera/input geography remains independent. | **v0.14** VIS-01, MOVE-01, EXPL-01, MOBILE-01 |
| 2026-11-02 | DEC-027 | **Accepted** | Move the camera presets under a compact top-right hamburger menu. Open/close through a native accessible disclosure; selecting a preset dismisses it. Keep the zoom slider visible at the right of the map. Owner explicitly approves promotion of all currently reviewed Preview gameplay to Stable through a separate release PR, subject to CI and deployment verification. | **v0.15** VIS-01, MOVE-01, MOBILE-01, DIST-01 |
| 2026-11-02 | DEC-028 | **Accepted — refines normal fixed-pitch exploration** | When a real mapped building would block the trainer, automatically tilt the camera toward overhead by the minimum clearance angle instead of depicting the avatar through walls. Restore 45° when clear, preserve geographic movement, zoom and bearing; account for source rendering heights. | **v0.16** VIS-01, VIS-04, MOVE-01 |
| 2026-11-03 | DEC-029 | **Merged into preview in PR #26; phone acceptance pending** | Make PWA updates non-disruptive: revision the service worker with compiled assets, keep it waiting, show a Reload prompt on an existing installed app, and change worker only after the player's action. Preserve separate Preview/Stable cache scopes and offline shell; uncached tiles remain online-only. | **v0.17** PWA-01, DIST-01 |
| 2026-11-03 | DEC-030 | **Merged into preview in PR #27; device acceptance pending** | In settings permit latitude, longitude jump to a source-loaded walkable position, save last avatar coordinate per PWA channel, and keep visited OpenFreeMap z14 PBF tiles offline in a 100 MiB per-channel IndexedDB cache. Evict farthest from the player first; never treat jumps as verified travel or GPS proof. | **v0.18** MOVE-02, PWA-01, WORLD-04 |
| 2026-11-03 | DEC-031 | **Merged into preview in PR #29; device acceptance pending** | Request browser persistent storage only while running the installed standalone PWA, show outcome and retry in Settings; keep PBF cache and avatar save unchanged. Document that the permission/quota applies to the origin (shared with browser/Stable/Preview on current host), not exclusively to one PWA. | **v0.19** PWA-01, DIST-01 |
| 2026-11-03 | DEC-032 | **Merged to preview in PR #30; device acceptance pending** | Centralize saved camera responsiveness/zoom and future opted-in controls in one channel-scoped settings record. Keep collision geometry only from decoded local tiles, deduplicate identical polygons, deduplicate PBF reads and avoid blocking rendering on storage writes, remove derived metadata and unnecessary asset re-downloads/duplicate TypeScript checks. | **v0.20** PWA-01, VIS-01, MOVE-01, WORLD-01/04 |

### Open decisions to resolve before related implementation

| ID | Decision | Blocks / affects | Status |
|---|---|---|---|
| OPEN-01 | Virtual traversal and long-distance travel mechanics | MOVE-01/02, ENC-02 | Open |
| OPEN-02 | Where and when region/location is committed relative to randomness | ENC-02, regional species | Open — fairness-critical |
| OPEN-03 | Walkable/off-road surfaces and inferred access on incomplete tile attributes | MOVE-01, WORLD-02 | Open |
| OPEN-04 | Deterministic facade inference weightings and default art library | VIS-03 | Open — **must stay OpenFreeMap-only** |
| OPEN-05 | DEC-026 introduces camera response presets and DEC-024 extends 15.5–20 zoom; remaining tuning includes final preset calibration, readable sprite scaling, joystick orientation after camera turns, diagonal art, and mobile performance | VIS-01/04/05, MOVE-01, EXPL-01, MOBILE-01 | Open — parameters only |
| OPEN-06 | Gym placement in worldwide mapped geography without new physical structures | GYM-01/02 | Open |
| OPEN-07 | Tile/source revision cadence and persistent collision/encounter consistency | WORLD-04, ENC-02 | Open |
| OPEN-08 | Starter roster, battle details and final rarity/XP quotas | GAME-01/02, ENC-04 | Open |
| OPEN-09 | Android/iOS browser/version support and phone acceptance of scoped caches, offline shell, reload prompt, local coordinate save and tile eviction | PWA-01, MOBILE-01 | Open — PRs #26, #27 and #29 merged to preview; full device verification pending |
| OPEN-10 | Longer-term production deployment strategy following direct public-repo Pages prototype | DIST-01 | Open — not blocking test |

## 6. Rules for updating this tracker

1. **When product behavior changes:** Update [Product Requirements](PRODUCT_REQUIREMENTS.md), increment its version, and add a dated decision row here with the exact affected requirement IDs.
2. **When implementation begins:** Change the row to **In progress**, identify an owner and link the issue/branch/PR; update relevant milestone.
3. **When work is blocked:** Mark **Blocked**, describe the concrete blocker, and point to the open decision or dependency.
4. **When code is merged:** Supply test/demo evidence. Only mark **Done** after the stated player-facing acceptance criterion passes.
5. **When requirements are split or removed:** Preserve their old IDs in the change history, rather than silently reassigning or deleting past tracking evidence.
6. **When the source map changes:** Verify no invented road/building behavior, tile-boundary continuity, and facade inference determinism again.
7. **Do not turn a tracker hypothesis into a fixed game rule** without a documented PRD decision.

## 7. Verified progress and next actions

### Task 001 — Map and PWA foundation, deployed for testing (2 November 2026)

| Event | Evidence | Status |
|---|---|---|
| Feature PR into `preview` | [PR #3](https://github.com/s3ton/bitmon/pull/3), merged as `5ca0e2d` | Complete |
| Integration-to-release PR `preview` → `main` | [PR #4](https://github.com/s3ton/bitmon/pull/4), merged as `f2532b9` | Complete |
| Feature validation | [GitHub Actions build](https://github.com/s3ton/bitmon/actions/runs/41503955234) — TypeScript and Vite build passed | Complete |
| Release validation | [GitHub Actions release PR check](https://github.com/s3ton/bitmon/actions/runs/41504248392) — TypeScript and Vite build passed | Complete |
| Pages publication from `main` | [Deploy run](https://github.com/s3ton/bitmon/actions/runs/41504378759) — build, artifact upload and Pages deployment passed | Complete |
| Smartphone installation and map impression | Owner reports PWA installed and launched on their phone and that the neighborhood map looks extremely faithful (2 Nov 2026) | Confirmed owner report; device/OS unspecified; not a formal source-geometry audit |
| Full E0 / PWA acceptance | Source geometry audit, representative OS/device installs, screenshots, new walking avatar and joystick | Not complete; owner Task 002 phone tests pending |

**Implemented baseline:** Vite + TypeScript + MapLibre/OpenFreeMap, real-world extrusions, portrait prompt, app manifest and offline shell. The **two-channel** Pages workflow is deployed: Stable uses `main` at the root and Preview uses `preview` at `/bitmon/preview/`. Latest Pages deployment [run 41536543717](https://github.com/s3ton/bitmon/actions/runs/41536543717) succeeded on 2 November 2026. Independent installed-app identities and complete phone gameplay remain unverified.

**Evidence boundary:** A confirmed smartphone installation and positive map fidelity report do **not** establish that all OpenFreeMap source geometries match, that both Android and iOS are supported, that service-worker caching behaves as intended, or that performance targets are met. No portrait screenshots or measured device benchmarks are attached. Tile loading still requires a network connection for uncached geography. No permanent test suite was added (0 added, 0 removed, net 0).

**Current released build limitations:** the first Task 002 phone test found movement blocked and the old sprite unacceptable. The subsequent corrections, camera controls, and occlusion adaptation are now merged to `main` (PR #25) and deployed, but have not yet passed the owner's new phone acceptance. No battles, captures, wallets, blockchain or backend exist.

### Task 002 — Walking trainer, geographic joystick, direction-following camera (2 November 2026)

**Implementation:** [PR #8](https://github.com/s3ton/bitmon/pull/8), `feat/task-002-avatar-movement` → `preview`. A lightweight original SVG trainer with four visible directional walking cycles/idle and foot shadow is anchored through a geographic MapLibre Marker. Pointer-captured safe-area joystick and optional keyboard input drive frame-rate-independent meter/second movement, including diagonals. Camera uses shortest-angle bearing easing toward accepted movement, retaining pitch and zoom; building/water collision uses OpenFreeMap source polygons only, pausing while tiles load. No new dependencies or permanent automated tests.

**Validation boundary:** [GitHub Actions PWA build run 41512017734](https://github.com/s3ton/bitmon/actions/runs/41512017734) passed `npm install --no-audit --no-fund`, `npm run check` and `npm run build` on the Task 002 branch (before the final documentation/performance cleanup). Owner will manually verify on a portrait phone after separately reviewing and promoting `preview` → `main`. **Do not mark VIS-01/MOVE-01/EXPL-01 Done before those checks.** Manual cases: cardinal/diagonal walks, continuous and rapid opposite turns, stop/idle, wall/water collisions, tile boundaries, geographic recognizability, orientation prompt, installed PWA relaunch and screenshots/recording. No device acceptance results are claimed here.

**Limitations:** Loaded source polygons are not a pedestrian access-rights graph; footprints can be generalized, source tiles unavailable, and long-distance routing absent. Source-revision consistency, rural gaps, water edges, collision behavior and phone frame rates await manual validation. No GPS, battles, verified movement or wallet features.

### Next development task after Task 002

**Task 003 — Geographic visual audit and E0 map readability:** assess dense and sparse OpenFreeMap regions for invented/missing geometry, improve deterministic facade variation and avatar/building occlusion using existing source tiles, and tune performance on mid-range phones. Keep creatures and blockchain deferred until E0 acceptance.

**Release workflow (DEC-022):** Feature PR → `preview` → successful push CI → trusted main-context workflow rebuilds both PWAs and deploys only `/bitmon/preview/` code changes; Stable root always rebuilds from unchanged `main`. Once phone-approved, separate reviewed `preview` → `main` PR changes Stable gameplay. The infrastructure-only release has already been completed; both Preview and Stable Pages URLs are deployed.

### Task 002 corrective response — phone report (2 November 2026)

Owner reports an immobile trainer after the PR #9 Pages release and rejects placeholder trainer art. Potential causes: starting inside mapped building and gating movement on globally loaded tile source state. Fix PR #10 adds collision-safe nearby map-derived start, checked-area collision cache while source tiles load, and an illustrated 20-frame sprite atlas with independent idle/walk poses per direction. **The corrective build has not passed owner smartphone acceptance**, and no tests or visuals are falsely marked as device-verified.

### Task 002 visual and floating-control refinement — 2 November 2026

Owner requested reducing the building-scale trainer to normal-human proportions, full input speed **10 m/s**, dedicated diagonal-facing frame cycles (left/right reuse by mirroring), and a virtual joystick that is **hidden until a pointer begins within the middle 60% of portrait height**. Implemented in merged [PR #13](https://github.com/s3ton/bitmon/pull/13) and verified by [TypeScript/build workflow](https://github.com/s3ton/bitmon/actions/runs/41520401521). The top/bottom 20% do not initiate movement, and the joystick disappears on release. Implementation uses an 8-row/40-frame SVG atlas, background-position facing selection, WGS84 marker with an approximately 1.8 m visual target and 8 px readability floor, and pointer capture on the app surface. No mobile device tests have yet passed; measure apparent scale and art quality on the installed phone before marking VIS-01/MOVE-01/EXPL-01 done.

### Dual-channel PWA testing — deployment infrastructure (2 November 2026)

The owner identified that requiring an untested gameplay PR to merge into `main` before phone validation defeats the `preview` release gate. DEC-022 defines **two installable PWAs on one GitHub Pages domain**. Source branch `preview` can be tested in the `/bitmon/preview/` app after successful review/CI; stable `/bitmon/` remains compiled from `main` until separate release approval. Main-only Pages environment protection is retained by using the default-branch `workflow_run` context. Separate PWA manifest identities, service-worker scopes, CacheStorage prefixes and a preview visual label/icon are part of the infrastructure. The two channels have successful Pages deployments; manual verification of independent installed-app identities, offline shell and future updates is still outstanding.

### Owner Preview issues and Task 002 follow-up — 2 November 2026

After deployment of dual-channel Pages, the owner reported the Preview installation is recognized as already installed, joystick up/down input appears reversed, and requests a right-side zoom slider. **Identified manifest fault:** using `id: "."` for both installs resolves to the same origin-root ID. Corrective work gives Preview a unique explicit `/bitmon/preview/` manifest ID plus distinctive purple Preview icon/name (without changing Stable's prior ID), reverses touch vertical mapping only, and adds a portrait side range slider (15.5–18.5) that adjusts MapLibre zoom while preserving heading/pitch, updates avatar visual size and never triggers the joystick. Source tiles, PWA domains and stable gameplay remain unchanged. The owner subsequently verified that joystick down still moves forward in the merged Preview, so the old touch-only Y sign is incorrect. A follow-up fix unifies touch/keyboard Y inversion, doubles rendered sprite size, and increases zoom maximum to 20. Manual verification of these changes **pending**.

### Joystick activation zone revision — 2 November 2026

The owner requested that only the top and bottom 10% of the portrait viewport reject joystick starts, expanding the interactive region from the original 60% to 80% (`0.1 ≤ y/viewportHeight ≤ 0.9`). The earlier DEC-021 20–80% range is historical and superseded by DEC-025. Existing zoom/UI input exclusions, hidden-until-pointerdown behavior, camera control and 10 m/s movement are unchanged. This change does not increase the trainer's real-world size: the previous 2× increase was visual only and collision stays meter-based. Owner phone verification is pending.

### Toolchain refresh audit — 2 November 2026

The owner requested checking and updating stale tooling. Node 22 CI is replaced by **Node 26 Active LTS**, with a root `.nvmrc` and package engine boundary; TypeScript 5.9.3 is upgraded to 7.0.2; MapLibre GL JS 6.16.0 and Vite 8.3.5 are confirmed current and exact-pinned. GitHub Actions checkout/setup-node are upgraded from v4 to v7, and Pages artifact/setup/deploy actions to v5/v6/v5. Current runner and task build compatibility require CI; a Pages workflow in `preview` is not active until a separate release into `main`. That initial upgrade did not include a tracked lockfile. PR #26 (3 November) now proposes npm lockfile v3 and `npm ci` for reproducible installs; see the maintenance entry below. No gameplay or map source changes are caused by this audit.

### Preview camera soft-follow refinement — 2 November 2026

The owner reported that rotating the camera almost instantly toward every joystick direction felt unnatural, especially for reverse and short sideways input. DEC-026 sets a Balanced soft-follow default (0.4 s stable-travel delay, max 60°/s, 0.8 s damping, 12° dead zone), with Relaxed and Responsive selector presets to compare on a smartphone. Player position updates immediately, but yaw is suppressed on backward gestures (≥135° relative to the control basis), small heading changes and brief sideways taps. Releasing input or being blocked freezes yaw immediately. The camera rotates only presentation; actual geographic movement retains its snapshot input bearing, 10 m/s full speed and existing OpenFreeMap collision. No phone acceptance or quantitative motion-sickness measurements are claimed.

### Hamburger settings and owner-directed Stable release — 2 November 2026

The top-right camera selector is now a hamburger button (44 × 44 CSS px) with a native disclosure panel containing Relaxed/Balanced/Responsive choices. Selecting a preset closes the panel; zoom remains exposed separately on the right side. All settings interaction is excluded from joystick gestures. The owner explicitly requested promoting the full current Preview feature set to Main after this refinement; the release PR remains a separate integration gate with CI and Pages publication evidence tracked independently. This owner-directed release does not imply phone-based E0 gameplay acceptance or that additional systems are finished.

### Building occlusion visibility correction — 2 November 2026

The owner requested not drawing the player visibly through buildings. The camera instead adjusts pitch toward top-down only if a source building intersects the line of sight from trainer to camera; exact source footprint edges and MapLibre extrusion `render_height`/14 m fallback supply a conservative clearance pitch. The camera gradually restores its normal 45° angle after clearing the obstruction. The DOM trainer is hidden while adjusting to avoid a transient through-wall overlay. This is a camera/view rule; it must not change the OpenFreeMap footprint, geographic position, collision tests, heading controls, or zoom. Smartphone acceptance, dense-city performance, and difficult geometry cases remain unverified.

### Reproducible builds and controlled PWA updates — 3 November 2026

The owner approved only **maintenance items 1, 2, 4 and 5**. [PR #26](https://github.com/s3ton/bitmon/pull/26) was created from `preview` and targets `preview`; it does **not** authorize a merge into `main`. Implementation adds a Node 26-generated `package-lock.json` (npm v3 lockfile; 87 entries at generation), switches the `check.yml` and `pages.yml` installers to `npm ci`, and stamps the production service worker from a digest of the emitted application shell. Existing per-channel cache isolation remains in place. A waiting update shows a Reload button; the player chooses when the page activates the new worker. First installs activate automatically. The offline shell is cached; uncached OpenFreeMap tile requests are still not supported offline.

**Verification boundary:** GitHub PR build must pass `npm ci --no-audit --no-fund`, `npm run check`, and `npm run build`. Device testing remains required for installed Preview update notice, reload, offline shell and channel isolation. The revised `pages.yml` runs from `main` and is not active there unless separately released. No permanent automated tests were added or removed (net 0); the existing `tsc` and Vite build are the minimal repository checks. No geographic data, collision, movement or visual world rules were changed. No stable promotion is authorized.


### Coordinate jumps and bounded offline exploration — 3 November 2026

The owner requested an E0 settings text field accepting latitude/longitude with a Go action, local position persistence and offline reuse of previously visited OpenFreeMap tiles. DEC-030 clarifies that a free coordinate jump is only for prototype map exploration and is not a verified travel mechanic or location/encounter proof. [Feature PR #27](https://github.com/s3ton/bitmon/pull/27) has merged into preview; main remains unchanged. The merged implementation uses channel-specific localStorage for accepted WGS84 coordinates and IndexedDB for cached OpenFreeMap z14 PBF source tiles, with a 100 MiB per-channel tile-byte cap and geographically farthest-first eviction; current player tile protected. No bulk prefetch, new geography or secondary basemap is introduced.

**Validation:** [Final PR #27 GitHub Actions build](https://github.com/s3ton/bitmon/actions/runs/41603419674) passed `npm ci`, `npm run check`, and `npm run build` before merge. **Pending device acceptance:** online coordinate jump to valid walkable land, invalid/out-of-bounds and unmapped/offline destination rollback, building/water landing rejection, position restored after closing/relaunching, offline walking inside previously viewed terrain with hard boundary at uncached tiles, predictable farthest-tile eviction, Android/iOS persistence and independently isolated Stable/Preview storage. No permanent automated test suite is introduced for this isolated E0 feature (0 added, 0 removed, net 0); device acceptance is the open gate.


### Standalone PWA storage protection — 3 November 2026

Owner requested stronger durability after device shutdown and for the request to apply to installed PWA use rather than browsing in a normal tab. [PR #29](https://github.com/s3ton/bitmon/pull/29) from feature branch `feat/preview-pwa-persistent-storage` targets `preview`; `main` is unchanged. Candidate implementation adds `navigator.storage.persisted()` / `persist()` only on standalone PWA startup, with iOS legacy standalone detection and Settings outcome/retry. **The platform permission is origin-scoped**: GitHub Pages Stable and Preview and other pages on the same `s3ton.github.io` origin can share that protection/quota, despite channel-specific bitmon cache data. Exclusive per-installed-PWA storage requires separate hosting origins, not merely a manifest change. PBF tile representation, 100 MiB accounting and saved coordinates are untouched.

**CI evidence:** [PR #29 run 41609491504](https://github.com/s3ton/bitmon/actions/runs/41609491504) passed `npm ci`, `npm run check`, and `npm run build` before merge. **Pending device validation:** standalone/browser detection; persistence granted/denied/unsupported display; manual retry; PBF tiles and position surviving phone shutdown; no prompt in a normal browser tab; cross-channel storage isolation. No test additions or deletions, net 0; manual platform acceptance required.


### Audit cleanup and saved settings — 3 November 2026

The owner requested remediation of a cross-system code audit against `skill.md` and persistent settings for the current and future user-adjustable options. [PR #30](https://github.com/s3ton/bitmon/pull/30) was merged into `preview` (squash commit `b68bab1`), with `main` unchanged. Implementation centralizes channel detection, stores camera responsiveness plus zoom and future `data-setting`-marked controls in a single channel-specific localStorage record, keeps coordinate entry out of preferences, and restores zoom/preset before gameplay initializes. Collision refreshes now wait for decoded source tiles immediately around the avatar instead of using potentially incomplete nearby geometry; exact duplicate rings from MapLibre tile queries are skipped only when their height is the same, preserving other overlapping buildings and clipped fragments. Tile/foot readiness is derived exclusively from MapLibre decoded tile events, removing the cache's redundant long-lived downloaded-tile set. One in-flight PBF fetch/read serves concurrent callers; storage writes complete asynchronously after map bytes are returned, with per-caller transferable copies. Tile metadata now stores only key and byte count, app shell assets use cache-first, and CI avoids checking TypeScript twice in one build. The Pages workflow executes from `main` and cannot use its preview-branch cleanup until separate release authorization.

**Engineering discipline:** No test framework or new permanent tests introduced (0 added, 0 removed, net 0); original map provider, raw PBF format, player position storage, camera movement and collision feature layers remain intact. Simplifications remove repeated I/O or duplicate computation without adding an alternative renderer or data source. **CI evidence:** [PR #30 run 41613342877](https://github.com/s3ton/bitmon/actions/runs/41613342877) passed `npm ci --no-audit --no-fund` and `npm run build` (TypeScript/Vite/stamp). **Pending device verification:** smartphone camera/zoom settings after restart, tile-boundary and missing-tile collision safety, offline rendering, disk durability, service-worker updates, and Preview/Stable data isolation. Exact user device acceptance remains required; no feature code is authorized for `main`.
