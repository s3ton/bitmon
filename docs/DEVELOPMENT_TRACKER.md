# bitmon — Development Tracker

**Purpose:** Track implementation progress, evidence, blockers, and product decisions separately from the normative [Product Requirements](PRODUCT_REQUIREMENTS.md).  
**Baseline PRD:** v0.4 (2 November 2026)  
**Related design:** [Technical Design](TECHNICAL_DESIGN.md)  
**Tracker created:** 2 November 2026  
**Current reporting state:** Task 001 implementation proposed in PR from `feat/task-001-pwa-world`; acceptance and on-device checks pending.

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

**Current overview:** 32 tracked requirements; **0 verified Done**. Task 001 introduces map and PWA implementation; no phone acceptance evidence has been recorded. This is a documentation baseline, not a claim that nobody has experimented elsewhere.

## 2. Requirements implementation matrix

The requirement IDs and language are defined in [PRODUCT_REQUIREMENTS.md](PRODUCT_REQUIREMENTS.md). Priority refers to the *first relevant slice* of each requirement: **E0** = exploration-only PWA prototype (immediate focus), **P0** = later verified game vertical slice, **P1** = usable first release. E0 completion must not be confused with fully verified play or worldwide coverage.

| ID | Player-facing capability | Priority | Status | First acceptance evidence to attach | Owner / issue / PR |
|---|---|---|---|---|---|
| WORLD-01 | Earth geography preserved in the mapped world | E0 | In review | Compare a known OpenFreeMap neighborhood with bitmon at source coordinates; no fabricated features | — |
| WORLD-02 | Roads and paths correspond to existing OpenFreeMap geometry | E0 | In review | Road-source feature audit; test no added road, intersection, alley or connector | — |
| WORLD-03 | Distinct environments and habitats from available tile context | P0 | Not started | Demonstrate tile-driven park/water/residential-context artwork with neutral fallbacks | — |
| WORLD-04 | Global continuity and graceful gaps | P1 | Not started | Urban, rural and missing-data scenarios without invented geography | — |
| VIS-01 | Fixed-angle, non-rotating low-poly 2.5D exploration camera | E0 | In review | Portrait phone follows avatar with constant bearing/pitch | — |
| VIS-02 | Mapped building footprints become low-poly volumes | E0 | In review | Source polygon ↔ simple rendered volume test; no unsourced building instance | — |
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
| MOBILE-01 | Smartphone-first, portrait-only gameplay | E0 | In review | Portrait UI covers all play; unsupported landscape rotation preserves state with prompt | — |
| PWA-01 | Install and launch from Android/iOS home screens | E0 | In review | HTTPS PWA manifest, standalone launch, offline shell and local-save behavior | — |
| DIST-01 | GitHub-only public compiled PWA, private source | P0 | Not started | GitHub Pages distribution, correct subpath scope, no private sources/secrets/maps | — |

## 3. Map fidelity release gates

These requirements are **fixed decisions**, not open design options. A change requires an explicit amendment to the PRD and this tracker.

| Gate | What a passing implementation proves | Status / evidence |
|---|---|---|
| MAP-GATE-01 — One geographic source | All rendered world geography comes from OpenFreeMap tiles; no external map/enrichment query or extra geographic database | Not tested |
| MAP-GATE-02 — No invented buildings | Every building volume corresponds to a source building footprint/part at the selected detail level; missing source polygon means nothing is built | Not tested |
| MAP-GATE-03 — No invented roads | Every visual road/path is traceable to the tile transportation geometry; no fake lane/path/link appears in gaps | Not tested |
| MAP-GATE-04 — Inferred art only | Window/facade/roof selection uses OpenFreeMap fields/context and deterministic art rules; no inferred building use is presented as an established fact | Not tested |
| MAP-GATE-05 — Style does not mutate geography | Building outlines remain within source footprints, road topology stays unchanged across art variants and tile boundaries | Not tested |
| MAP-GATE-06 — Missing-data fallback | Sparse/unknown areas use neutral styling or omissions, never generated physical features | Not tested |

**Evidence expected:** a build/demo URL or recording, tests comparing source features to rendered features, chosen OpenFreeMap tile/style revision, and any known limitations. "Looks plausible" alone does not satisfy the no-invented-geometry gates.

## 4. Development milestones

**Build only the exploration experience first.** Do not implement combat, ZK, registration, trading, gyms or advertising as dependencies of E0. The future game requirements remain documented.

| Milestone | Scope | Status | Exit evidence |
|---|---|---|---|
| M0 — Map feasibility | OpenFreeMap source inspection, low-poly art, facade inference and portrait phone baseline | In review | One reference neighborhood on a phone, tile evidence and no-enrichment proof |
| M1 / E0 — Animated avatar exploration | Low-poly MapLibre map, source-mapped streets/buildings, fixed camera, portrait touch movement, animated male avatar, installable shell | Not started | Playable E0 on a portrait smartphone with four walking directions, stable camera, and zero fabricated buildings/roads |
| M2 — First verified encounter and same-world battle | Registration-first onboarding, active identity, same-world camera zoom, local battle and proof/finalization | Not started | Battle retains mapped backdrop and returns camera; valid capture and replay rejection |
| M3 — Installable smartphone PWA slice | Portrait UI, local saves, collection, install manifest, app shell, GitHub Pages distribution | Not started | P0 acceptance on Android and iPhone, installed from GitHub Pages URL |
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
| OPEN-10 | Public build-only repository name, GitHub Actions credential and controlled release trigger | DIST-01 | Open |

## 6. Rules for updating this tracker

1. **When product behavior changes:** Update [Product Requirements](PRODUCT_REQUIREMENTS.md), increment its version, and add a dated decision row here with the exact affected requirement IDs.
2. **When implementation begins:** Change the row to **In progress**, identify an owner and link the issue/branch/PR; update relevant milestone.
3. **When work is blocked:** Mark **Blocked**, describe the concrete blocker, and point to the open decision or dependency.
4. **When code is merged:** Supply test/demo evidence. Only mark **Done** after the stated player-facing acceptance criterion passes.
5. **When requirements are split or removed:** Preserve their old IDs in the change history, rather than silently reassigning or deleting past tracking evidence.
6. **When the source map changes:** Verify no invented road/building behavior, tile-boundary continuity, and facade inference determinism again.
7. **Do not turn a tracker hypothesis into a fixed game rule** without a documented PRD decision.

## 7. Next actionable work

The first engineering demonstration (E0) should load a real OpenFreeMap neighborhood through MapLibre **on a portrait smartphone**, draw only mapped roads and mapped low-poly buildings, show a **four-direction animated male avatar**, and allow walking via **touch controls while a fixed-angle camera follows without rotating**. Test sparse areas without fabricated roads/buildings. Package as an **installable PWA** and publish a deliberate compiled build via GitHub-only distribution. **Do not build the battle system or its camera transition yet**; CAM-01 is specified for M2.

No implementation task is claimed complete by this document.


## Task 001 — PWA map foundation (2 November 2026)

- **Branch:** `feat/task-001-pwa-world`; **PR:** see the open pull request targeting `preview` (reference added in PR description).
- **Delivered for review:** Vite/TypeScript app; OpenFreeMap-only MapLibre rendering of Brera, Milan; original fixed 45° pitch/-20° bearing; mapped-footprint extrusion with `render_height` and deterministic fallback; portrait rotation overlay; PWA manifest and app-shell worker.
- **Pending evidence:** dependency installation, TypeScript compilation, production build, browser render, Android/iOS home-screen install, attribution inspection, source-footprint audit, and portrait smartphone screenshots. No manual or automated validation is claimed.
- **Scope deferred:** avatar, walking, collision, facade variations, battles, registration and blockchain; no public repository or deployment created.
- **Test accounting:** 0 added, 0 removed, net 0. No permanent test is justified for this initial presentation-only slice; PR workflow provides proposed build checks.
