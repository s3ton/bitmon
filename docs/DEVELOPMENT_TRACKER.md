# bitmon — Development Tracker

**Purpose:** Track implementation progress, evidence, blockers, and product decisions separately from the normative [Product Requirements](PRODUCT_REQUIREMENTS.md).  
**Baseline PRD:** v0.6 (2 November 2026)  
**Related design:** [Technical Design](TECHNICAL_DESIGN.md)  
**Tracker created:** 2 November 2026  
**Current reporting state:** Task 001 map/PWA foundation deployed from `main` after [#3](https://github.com/s3ton/bitmon/pull/3) and [#4](https://github.com/s3ton/bitmon/pull/4); owner confirms installed PWA and high perceived geographic fidelity on a phone. Task 002 is in review on [draft PR #8](https://github.com/s3ton/bitmon/pull/8) against `preview`. E0 acceptance, geometry audit and cross-device checks remain open. **Last evidence review:** 2 November 2026.

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

**Current overview:** 32 tracked requirements: **0 fully accepted Done, 7 In review, 25 Not started**. A publicly accessible map/PWA shell is deployed and has received a positive owner smoke-test report, but the recorded evidence does not yet establish the full player-facing acceptance criteria (especially avatar/movement, Android/iOS installation and map fidelity audits).

## 2. Requirements implementation matrix

The requirement IDs and language are defined in [PRODUCT_REQUIREMENTS.md](PRODUCT_REQUIREMENTS.md). Priority refers to the *first relevant slice* of each requirement: **E0** = exploration-only PWA prototype (immediate focus), **P0** = later verified game vertical slice, **P1** = usable first release. E0 completion must not be confused with fully verified play or worldwide coverage.

| ID | Player-facing capability | Priority | Status | First acceptance evidence to attach | Owner / issue / PR |
|---|---|---|---|---|---|
| WORLD-01 | Earth geography preserved in the mapped world | E0 | In review | Compare a known OpenFreeMap neighborhood with bitmon at source coordinates; no fabricated features | [#3](https://github.com/s3ton/bitmon/pull/3) |
| WORLD-02 | Roads and paths correspond to existing OpenFreeMap geometry | E0 | In review | Road-source feature audit; test no added road, intersection, alley or connector | [#3](https://github.com/s3ton/bitmon/pull/3) |
| WORLD-03 | Distinct environments and habitats from available tile context | P0 | Not started | Demonstrate tile-driven park/water/residential-context artwork with neutral fallbacks | — |
| WORLD-04 | Global continuity and graceful gaps | P1 | Not started | Urban, rural and missing-data scenarios without invented geography | — |
| VIS-01 | Smooth heading-up camera, fixed pitch/zoom | E0 | In review | Phone checks cardinal/diagonal direction, shortest turn at 0°/360°, stop/idle bearing, stable zoom/pitch | [#8](https://github.com/s3ton/bitmon/pull/8) |
| VIS-02 | Mapped building footprints become low-poly volumes | E0 | In review | Source polygon ↔ simple rendered volume test; no unsourced building instance | [#3](https://github.com/s3ton/bitmon/pull/3) |
| VIS-03 | OpenFreeMap-only inferred facade and window art | E0 | Not started | Deterministic generic + residential-like variants using only source tile fields/context | — |
| VIS-04 | Layers, roofs and player occlusion work together | P0 | Not started | Walk behind buildings and stay visible via agreed cutaway/fade | — |
| VIS-05 | Low-poly streaming and smartphone performance | P0 | Not started | Dense-city seam and low-/mid-range portrait-phone performance demonstration | — |
| MOVE-01 | Touch-driven geographic movement, diagonals and minimal building/water collision | E0 | In review | Phone joystick/motion, blocked mapped polygons, seam crossings and unloaded-tile pause | [#8](https://github.com/s3ton/bitmon/pull/8) |
| EXPL-01 | Original male avatar with four camera-relative facing cycles and idle | E0 | In review | Four directions, stop/idle, heading changes while rotating camera, geographic anchoring | [#8](https://github.com/s3ton/bitmon/pull/8) |
| MOVE-02 | Practical long-distance world travel | P1 | Not started | Approved travel specification, then demonstrable city-to-city trip | — |
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
| PWA-01 | Install and launch from Android/iOS home screens | E0 | In review | HTTPS PWA manifest, standalone launch, offline shell and local-save behavior | [#3](https://github.com/s3ton/bitmon/pull/3) |
| DIST-01 | Public repository GitHub Pages prototype | P0 | In review | Build and deploy succeeded on `main`; owner confirms site loads. Verify install/worker scope and deployed artifact contents before marking Done | [#3](https://github.com/s3ton/bitmon/pull/3), [#4](https://github.com/s3ton/bitmon/pull/4), [deploy](https://github.com/s3ton/bitmon/actions/runs/41504378759) |

## 3. Map fidelity release gates

These requirements are **fixed decisions**, not open design options. A change requires an explicit amendment to the PRD and this tracker.

| Gate | What a passing implementation proves | Status / evidence |
|---|---|---|
| MAP-GATE-01 — One geographic source | All rendered world geography comes from OpenFreeMap tiles; no external map/enrichment query or extra geographic database | Source review: one OpenFreeMap TileJSON source configured in `src/main.ts`; independent network/data audit pending |
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
| M1 / E0 — Animated avatar exploration | Low-poly OpenFreeMap map, fixed-pitch heading-up camera, geo touch movement, trainer animation and polygon collision | In review | Owner accepts four directions/diagonals, smooth turns, collision/seams and PWA on portrait phone; no fabricated geometry |
| M2 — First verified encounter and same-world battle | Registration-first onboarding, active identity, same-world camera zoom, local battle and proof/finalization | Not started | Battle retains mapped backdrop and returns camera; valid capture and replay rejection |
| M3 — Installable smartphone PWA slice | Portrait UI, local saves, collection, install manifest, app shell, GitHub Pages distribution | In progress | P0 acceptance on Android and iPhone, installed from GitHub Pages URL |
| M4 — Social mechanics | Fixed-type gyms, same-tier swaps, recognition, optional fees | Not started | Two independent clients can trade and claim a gym |
| M5 — First release readiness | Wider region coverage, travel, fair region binding, performance, recovery | Not started | P1 acceptance and security reviews complete |

Milestones are **proposed sequencing**, not calendar commitments. M1/E0 includes a proposed avatar/movement implementation on PR #8 awaiting owner smartphone validation; M3 includes a confirmed owner-installed PWA but requires offline/cross-platform evidence. Neither exit criterion has passed.

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
| 2026-11-02 | DEC-018 | **Accepted** | Deploy compiled PWA artifacts to GitHub Pages **only from `main`** following feature PR into `preview` and separate reviewed `preview` → `main` release PR. Keep the website a test prototype | **v0.6** DIST-01 |
| 2026-11-02 | DEC-019 | **Accepted — supersedes DEC-014** | Exploration pitch/zoom remain fixed; camera smooth-turns to actual accepted movement heading via shortest path, retaining bearing when idle; manual rotate/tilt disabled | **v0.7** VIS-01, MOVE-01, EXPL-01, CAM-01, E0/P0 |

### Open decisions to resolve before related implementation

| ID | Decision | Blocks / affects | Status |
|---|---|---|---|
| OPEN-01 | Virtual traversal and long-distance travel mechanics | MOVE-01/02, ENC-02 | Open |
| OPEN-02 | Where and when region/location is committed relative to randomness | ENC-02, regional species | Open — fairness-critical |
| OPEN-03 | Walkable/off-road surfaces and inferred access on incomplete tile attributes | MOVE-01, WORLD-02 | Open |
| OPEN-04 | Deterministic facade inference weightings and default art library | VIS-03 | Open — **must stay OpenFreeMap-only** |
| OPEN-05 | Heading-following bearing is decided by DEC-019; tune fixed pitch/zoom values, turn rate, dead zone, sprite frame rate/scale, roof occlusion, safe-area joystick size and mobile budgets | VIS-01/04/05, MOVE-01, EXPL-01, MOBILE-01 | Open — experimental tuning |
| OPEN-06 | Gym placement in worldwide mapped geography without new physical structures | GYM-01/02 | Open |
| OPEN-07 | Tile/source revision cadence and persistent collision/encounter consistency | WORLD-04, ENC-02 | Open |
| OPEN-08 | Starter roster, battle details and final rarity/XP quotas | GAME-01/02, ENC-04 | Open |
| OPEN-09 | Android/iOS browser/version support, offline-cache and service-worker strategy | PWA-01, MOBILE-01 | Open |
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

**Implemented:** Vite + TypeScript + MapLibre; a recognizable fixed-start Brera, Milan map sourced from OpenFreeMap; styled roads/paths, terrain and water; low-poly building extrusions from mapped footprint geometry with source height or deterministic fallback; fixed 45° pitch and -20° bearing; portrait orientation prompt; manifest, icons and a limited offline application shell. GitHub Pages deploys compiled `dist/` output on pushes to `main` only. The repository is public, and no separate distribution repository exists.

**Evidence boundary:** A confirmed smartphone installation and positive map fidelity report do **not** establish that all OpenFreeMap source geometries match, that both Android and iOS are supported, that service-worker caching behaves as intended, or that performance targets are met. No portrait screenshots or measured device benchmarks are attached. Tile loading still requires a network connection for uncached geography. No permanent test suite was added (0 added, 0 removed, net 0).

**Task 001 baseline limitations:** Released `main` still lacks trainer avatar, walking animation and touch movement; these exist only in draft PR #8. There are no encounters, battles, wallet, blockchain or backend. M0, M1 and M3 remain incomplete as full milestone definitions.

### Task 002 — Walking trainer, geographic joystick, direction-following camera (2 November 2026)

**Implementation:** [Draft PR #8](https://github.com/s3ton/bitmon/pull/8), `feat/task-002-avatar-movement` → `preview`. A lightweight original SVG trainer with four visible directional walking cycles/idle and foot shadow is anchored through a geographic MapLibre Marker. Pointer-captured safe-area joystick and optional keyboard input drive frame-rate-independent meter/second movement, including diagonals. Camera uses shortest-angle bearing easing toward accepted movement, retaining pitch and zoom; building/water collision uses OpenFreeMap source polygons only, pausing while tiles load. No new dependencies or permanent automated tests.

**Validation boundary:** GitHub Actions TypeScript/build checks are linked in PR #8. Owner will manually verify on a portrait phone after separately reviewing and promoting `preview` → `main`. **Do not mark VIS-01/MOVE-01/EXPL-01 Done before those checks.** Manual cases: cardinal/diagonal walks, continuous and rapid opposite turns, stop/idle, wall/water collisions, tile boundaries, geographic recognizability, orientation prompt, installed PWA relaunch and screenshots/recording. No device acceptance results are claimed here.

**Limitations:** Loaded source polygons are not a pedestrian access-rights graph; footprints can be generalized, source tiles unavailable, and long-distance routing absent. Source-revision consistency, rural gaps, water edges, collision behavior and phone frame rates await manual validation. No GPS, battles, verified movement or wallet features.

### Next development task after Task 002

**Task 003 — Geographic visual audit and E0 map readability:** assess dense and sparse OpenFreeMap regions for invented/missing geometry, improve deterministic facade variation and avatar/building occlusion using existing source tiles, and tune performance on mid-range phones. Keep creatures and blockchain deferred until E0 acceptance.

**Release workflow:** Feature PR → `preview` → separate reviewed `preview` → `main` PR → automatic `main`-only GitHub Pages deployment. Documentation-only changes on `preview` are not published to `main` until the next approved release PR.
