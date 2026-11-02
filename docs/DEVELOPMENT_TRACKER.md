# bitmon — Development Tracker

**Purpose:** Track implementation progress, evidence, blockers, and product decisions separately from the normative [Product Requirements](PRODUCT_REQUIREMENTS.md).  
**Baseline PRD:** v0.6 (2 November 2026)  
**Related design:** [Technical Design](TECHNICAL_DESIGN.md)  
**Tracker created:** 2 November 2026  
**Current reporting state:** Task 001 map/PWA foundation merged into `preview` in [PR #3](https://github.com/s3ton/bitmon/pull/3) and promoted to `main` in [PR #4](https://github.com/s3ton/bitmon/pull/4). GitHub Pages deployment succeeded; the user reports that the published prototype works. Full E0 acceptance remains pending.

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

**Current overview:** 32 tracked requirements; **0 marked Done** against their full acceptance criteria. The public map/PWA foundation is live, with one positive user report; its partial capabilities are **In review**. Avatar movement, independent geographic-fidelity checks, home-screen installation and cross-device acceptance remain open. Successful deployment is not equivalent to completing E0.

## 2. Requirements implementation matrix

The requirement IDs and language are defined in [PRODUCT_REQUIREMENTS.md](PRODUCT_REQUIREMENTS.md). Priority refers to the *first relevant slice* of each requirement: **E0** = exploration-only PWA prototype (immediate focus), **P0** = later verified game vertical slice, **P1** = usable first release. E0 completion must not be confused with fully verified play or worldwide coverage.

| ID | Player-facing capability | Priority | Status | First acceptance evidence to attach | Owner / issue / PR |
|---|---|---|---|---|---|
| WORLD-01 | Earth geography preserved in the mapped world | E0 | In review | Compare a known OpenFreeMap neighborhood with bitmon at source coordinates; no fabricated features | [PR #3](https://github.com/s3ton/bitmon/pull/3) |
| WORLD-02 | Roads and paths correspond to existing OpenFreeMap geometry | E0 | In review | Road-source feature audit; test no added road, intersection, alley or connector | [PR #3](https://github.com/s3ton/bitmon/pull/3) |
| WORLD-03 | Distinct environments and habitats from available tile context | P0 | Not started | Demonstrate tile-driven park/water/residential-context artwork with neutral fallbacks | — |
| WORLD-04 | Global continuity and graceful gaps | P1 | Not started | Urban, rural and missing-data scenarios without invented geography | — |
| VIS-01 | Fixed-angle, non-rotating low-poly 2.5D exploration camera | E0 | In review | Portrait phone follows avatar with constant bearing/pitch | [PR #3](https://github.com/s3ton/bitmon/pull/3) |
| VIS-02 | Mapped building footprints become low-poly volumes | E0 | In review | Source polygon ↔ simple rendered volume test; no unsourced building instance | [PR #3](https://github.com/s3ton/bitmon/pull/3) |
| VIS-03 | OpenFreeMap-only inferred facade and window art | E0 | Not started | Deterministic generic + residential-like variants using only source tile fields/context | — |
| VIS-04 | Layers, roofs and player occlusion work together | P0 | Not started | Walk behind buildings and stay visible via agreed cutaway/fade | — |
| VIS-05 | Low-poly streaming and smartphone performance | P0 | Not started | Dense-city seam and low-/mid-range portrait-phone performance demonstration | — |
| MOVE-01 | Touch-first movement on mapped space | E0 | Not started | Thumb-control movement, collision and passability demonstration on a phone | — |
| EXPL-01 | Original male avatar with four-direction walking cycles | E0 | Not started | Up/down/left/right frames loop while moving, idle when stopped, no jitter | — |
| MOVE-02 | Practical long-distance world travel | P1 | Not started | Approved travel specification, then demonstrable city-to-city trip | — |
| MOVE-03 | Player location privacy | P1 | Not started | Verified exploration flow with no mandatory GPS permission | — |
| ENC-01 | Registration precedes verified encounter randomness | P0 | Not started | Reject pre-registration/guest encounter on verified settlement | — |
| ENC-02 | Location-aware encounters without hindsight selection | P1 | Not started | Threat-model test: choose location after randomness reveal → invalid | — |
| ENC-03 | Turn-based local encounter and deterministic capture | P0 | Not started | One encounter/capture plus proof of valid state transition | — |
| ENC-04 | Limited, fair and understandable encounter opportunities | P1 | Not started | Tests for quota, uniqueness, timing and rarity rules | — |
| GAME-01 | Inspectable, coherent bitmon collection | P0 | Not started | Starter + one captured bitmon show traits and pending/finalized status | — |
| GAME-02 | Deterministic combat and capture | P0 | Not started | Same input actions → same legal result across clients | — |
| CAM-01 | Zoom into active OpenFreeMap world for battle and restore exploration camera | P0 (post-E0) | Not started | Battle retains mapped world backdrop; returns exact fixed camera pose | — |
| GAME-03 | Pending save, finalization and recovery | P0 | Not started | Save locally, finalize, export/import and show correct status | — |
| TRADE-01 | Same-tier, one-for-one restricted swaps | P1 | Not started | Atomic swap with level reset and 24-hour quota tests | — |
| GYM-01 | Each gym has one immutable type | P1 | Not started | Fire and Fire/Wind allowed, Water/Wind rejected | — |
| GYM-02 | Win and defend a player-led gym | P1 | Not started | Verified challenge changes leader, eligible defense snapshots stay locked | — |
| GYM-03 | Fame and history without financial reward | P1 | Not started | View reigns, defenses and non-transferable recognition | — |
| ACCOUNT-01 | Permissionless registration-first onboarding | P0 | Not started | Wallet + verified genesis + first safe future encounter epoch | — |
| FEES-01 | Optional sponsorship without sponsor dependency | P1 | Not started | Self-paid progression succeeds when sponsor is unavailable | — |
| INDEPENDENCE-01 | Alternative client/map endpoint continuity | P1 | Not started | Equivalent OpenFreeMap mirror/self-hosted tiles and independent settlement | — |
| UX-01 | Usable, accessible controls and clear status | P0 | Not started | Portrait touch UI, loading, attribution and finality states | — |
| MOBILE-01 | Smartphone-first, portrait-only gameplay | E0 | In review | Portrait UI covers all play; unsupported landscape rotation preserves state with prompt | [PR #3](https://github.com/s3ton/bitmon/pull/3) |
| PWA-01 | Install and launch from Android/iOS home screens | E0 | In review | HTTPS PWA manifest, standalone launch, offline shell and local-save behavior | [PR #3](https://github.com/s3ton/bitmon/pull/3) |
| DIST-01 | Public repository GitHub Pages prototype | P0 | In review | Deployment successful from `main` and user confirmed app works; install, manifest/service-worker scope and artifact audit not individually verified | [PR #3](https://github.com/s3ton/bitmon/pull/3), [PR #4](https://github.com/s3ton/bitmon/pull/4), [Pages run](https://github.com/s3ton/bitmon/actions/runs/41504378759) |

## 3. Map fidelity release gates

These requirements are **fixed decisions**, not open design options. A change requires an explicit amendment to the PRD and this tracker.

| Gate | What a passing implementation proves | Status / evidence |
|---|---|---|
| MAP-GATE-01 — One geographic source | All rendered world geography comes from OpenFreeMap tiles; no external map/enrichment query or extra geographic database | Code uses one OpenFreeMap tile source in `src/main.ts`; independent network/source audit pending |
| MAP-GATE-02 — No invented buildings | Every building volume corresponds to a source building footprint/part at the selected detail level; missing source polygon means nothing is built | Extrusions reference OpenFreeMap `building` source-layer; rendered footprint comparison pending |
| MAP-GATE-03 — No invented roads | Every visual road/path is traceable to the tile transportation geometry; no fake lane/path/link appears in gaps | Road/path styles reference OpenFreeMap `transportation` source-layer; rendered topology audit pending |
| MAP-GATE-04 — Inferred art only | Window/facade/roof selection uses OpenFreeMap fields/context and deterministic art rules; no inferred building use is presented as an established fact | Not tested |
| MAP-GATE-05 — Style does not mutate geography | Building outlines remain within source footprints, road topology stays unchanged across art variants and tile boundaries | Not tested |
| MAP-GATE-06 — Missing-data fallback | Sparse/unknown areas use neutral styling or omissions, never generated physical features | Not tested |

**Evidence expected:** a build/demo URL or recording, tests comparing source features to rendered features, chosen OpenFreeMap tile/style revision, and any known limitations. "Looks plausible" alone does not satisfy the no-invented-geometry gates.

## 4. Development milestones

**Build only the exploration experience first.** Do not implement combat, ZK, registration, trading, gyms or advertising as dependencies of E0. The future game requirements remain documented.

| Milestone | Scope | Status | Exit evidence |
|---|---|---|---|
| M0 — Map feasibility | OpenFreeMap source inspection, low-poly art, facade inference and portrait phone baseline | In review | One reference neighborhood on a phone, tile evidence and no-enrichment proof |
| M1 / E0 — Animated avatar exploration | Low-poly MapLibre map, source-mapped streets/buildings, fixed camera, portrait touch movement, animated male avatar, installable shell | In progress | Playable E0 on a portrait smartphone with four walking directions, stable camera, and zero fabricated buildings/roads |
| M2 — First verified encounter and same-world battle | Registration-first onboarding, active identity, same-world camera zoom, local battle and proof/finalization | Not started | Battle retains mapped backdrop and returns camera; valid capture and replay rejection |
| M3 — Installable smartphone PWA slice | Portrait UI, local saves, collection, install manifest, app shell, GitHub Pages distribution | In progress | P0 acceptance on Android and iPhone, installed from GitHub Pages URL |
| M4 — Social mechanics | Fixed-type gyms, same-tier swaps, recognition, optional fees | Not started | Two independent clients can trade and claim a gym |
| M5 — First release readiness | Wider region coverage, travel, fair region binding, performance, recovery | Not started | P1 acceptance and security reviews complete |

Milestones are **proposed sequencing**, not calendar commitments or evidence of implementation.

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
| 2026-11-02 | DEC-014 | **Accepted** | **Fixed-angle exploration camera:** follows the avatar; bearing and pitch do not rotate while walking | **v0.4** VIS-01, EXPL-01 |
| 2026-11-02 | DEC-015 | **Accepted** | **Same-world battles:** camera zooms/reframes to bitmon against existing mapped low-poly world; restores original exploration framing afterward | **v0.4** CAM-01 |
| 2026-11-02 | DEC-016 | **Accepted** | **Exploration-only E0 now comes first:** touch movement with a male four-direction walking avatar; defer battle, wallet and blockchain | **v0.4** EXPL-01, E0 milestone |

| 2026-11-02 | DEC-017 | **Superseded by DEC-018** | Public-source-repository Pages testing was initially proposed from feature/`preview` | **v0.5** DIST-01 |
| 2026-11-02 | DEC-018 | **Accepted** | Deploy compiled PWA artifacts to GitHub Pages **only from `main`** following feature PR into `preview` and separate reviewed `preview` → `main` release PR. Keep the website a test prototype | **v0.6** DIST-01 |

### Open decisions to resolve before related implementation

| ID | Decision | Blocks / affects | Status |
|---|---|---|---|
| OPEN-01 | Virtual traversal and long-distance travel mechanics | MOVE-01/02, ENC-02 | Open |
| OPEN-02 | Where and when region/location is committed relative to randomness | ENC-02, regional species | Open — fairness-critical |
| OPEN-03 | Walkable/off-road surfaces and inferred access on incomplete tile attributes | MOVE-01, WORLD-02 | Open |
| OPEN-04 | Deterministic facade inference weightings and default art library | VIS-03 | Open — **must stay OpenFreeMap-only** |
| OPEN-05 | **Fixed** exploration pitch/bearing values, sprite scale and frame timing, low-poly roof occlusion, portrait touch sizes and mobile budgets | VIS-01/04/05, EXPL-01, MOBILE-01 | Open |
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

## 7. Next actionable work

**Working foundation:** The publicly deployed map prototype loads Brera, Milan using OpenFreeMap tiles in MapLibre; the initial oblique camera and source-footprint building extrusions are implemented. GitHub Actions builds and publishes compiled `dist/` files from `main` only. The user has reported that the deployed app works.

**Next implementation slice (separate PR to `preview`):** Add an original four-direction animated male avatar, touch-first walking, collision/passability decisions grounded in mapped space, and a fixed-angle camera that follows the avatar. Keep encounters, battles, wallet/blockchain and backend work deferred.

**Remaining validation:** Confirm on-device portrait and landscape behavior; Android/iOS Add to Home Screen and standalone launch; asset/manifest/service-worker paths; mobile performance; cross-tile motion; explicit comparison of rendered roads and buildings with source features, including gaps; attribution visibility; and portrait screenshots. These were not established by the successful build or the brief user report.

## Task 001 — Map/PWA foundation and live test (2 November 2026)

| Event | Evidence | Outcome |
|---|---|---|
| Feature implementation → `preview` | [PR #3](https://github.com/s3ton/bitmon/pull/3), merged at `5ca0e2d` | Merged |
| `preview` → `main` release | [PR #4](https://github.com/s3ton/bitmon/pull/4), merged at `f2532b9` | Merged |
| TypeScript and production build | [Release PR CI run 41504248392](https://github.com/s3ton/bitmon/actions/runs/41504248392) | Passed |
| Build + GitHub Pages deployment from `main` | [Pages run 41504378759](https://github.com/s3ton/bitmon/actions/runs/41504378759) | Passed |
| Public prototype | https://s3ton.github.io/bitmon/ | User reported: “it works well” (2 November 2026); not a device test report |
| Full E0 and PWA acceptance | Device checks, installation, camera/footprint audit, screenshots | Pending |

**Scope actually delivered:** Vite + TypeScript + MapLibre; OpenFreeMap-only Brera map; tile-driven roads, paths, land cover and water; low-poly extrusions using mapped building footprints, available heights or a constant visual fallback; fixed 45° pitch and -20° bearing; rotation-disabled map; portrait-only overlay; PWA manifest/icons; application-shell service worker; visible map attribution control; GitHub Pages publishing of compiled `dist/` from `main`. All these are implementation descriptions, not independently verified results on every phone/browser.

**Remaining scope:** No avatar, walking animation/movement/collision, encounters, creatures, battles, wallet, backend or blockchain. The M1/E0 milestone is **In progress**, not Done.

**Verification and quality accounting:** `npm install`, TypeScript checks and Vite build passed in GitHub Actions; build and Pages publish passed from `main`. A real-user report confirms the visible app operates, but it does not establish installation, every map-fidelity invariant, or Android/iOS compatibility. No new automated tests were added; none removed or consolidated (net 0). The existing baseline and new code were reviewed for avoidable complexity during PR #3. Future code changes still require the full engineering-policy review before merge.

**Deployment workflow:** Feature PR → `preview`; separate release PR → `main`; a push to `main` triggers `.github/workflows/pages.yml` using the GitHub Pages Actions source and uploads only `dist/`. The previously blocked feature-branch deployment is historical and no longer part of the workflow.
