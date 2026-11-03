# bitmon — Decentralized Creature-Collection RPG

**Companion technical design to the bitmon product requirements**

**Geographic world contract:** The [bitmon Product Requirements](PRODUCT_REQUIREMENTS.md) are authoritative for world geometry and visual rendering. **OpenFreeMap is the sole geographic source**; MapLibre renders the tiles; no new real-world building or road geometry may be invented. Mapped building facades and windows may use deterministic art inferred only from OpenFreeMap's available fields and context. Implementation and decision status is tracked separately in the [Development Tracker](DEVELOPMENT_TRACKER.md).

**Status:** Concept / architecture proposal, not a security-audited specification
**Version:** 3.13 (optional verified multiplayer, self-funded Rare/Legendary NFTs, Digital Gold gyms)
**Date:** 3 November 2026
**Project name:** **bitmon** (game and creature name; original characters and artwork required)

> **The vision in one sentence:** Build a browser-first creature-collection RPG whose ordinary Common/Uncommon wild play can continue offline from authenticated cached state, whose Rare/Legendary encounters and captures use fresh public randomness online, whose competitive chance events are committed before future randomness is revealed, and whose progression remains cryptographically verifiable without trusting the original game developer.

### What changed from version 1.0

| Area | v1.0 | v2.0 |
|---|---|---|
| Sybil defense | Proof-of-personhood credential at registration | **Removed.** Defense is by game design: restricted trading, bound XP, no cross-tier conversion, trade quota, no financial reward from PvP. |
| Trading | Free ERC-721 export/transfer | **Same-tier 1-for-1 swaps only**, levels reset to the lower creature, **max 1 trade per day per trainer**. No gifts, no free-transfer NFTs. |
| PvP | Signed battles, rankings, rewards | **Player-led gyms**: the winner becomes leader and is defended by their own team. Reward is fame only. In v2.1, each gym has a permanent type restriction rather than leader-set rules. |
| Registration | Needs external credential | Permissionless registration with an initial proposed 24-hour activation delay (v2.0); v2.2 moves registration to the start of verified play and proposes activation at the first safely eligible future epoch. |

### What changed from version 2.0

- Every gym is assigned **one permanent creature type** when created (for example, Fire).
- Every creature on a challenger or defending gym team must include that type. Dual-type creatures qualify if **either** of their types matches.
- Gym leaders **cannot change the assigned type or add rules** about species, levels, rarity tiers, team size, or items. Standard global battle rules still apply.
- Leaders can update their defending team, subject to a cooldown and delayed activation; this does not alter the gym type.

### What changed from version 2.1

- **Registration occurs before the verified adventure begins**, not later when the player first wants to trade or challenge a gym.
- The trainer's immutable ID and initial region are recorded before the beacon rounds that may generate their encounters. Old guest-mode encounters cannot be retroactively verified or imported into the canonical collection.
- **Local-first means local execution, not an unregistered canonical save.** After registration, exploration, ordinary battles, and proof preparation still run locally; blockchain settlements occur only at the defined boundaries.
- A separate **optional guest/demo mode** can work without a wallet or transaction, but it has its own non-transferable, non-verifiable save. It is not the beginning of the same verified adventure.
- Replace the proposed 24-hour wait with **activation at the first future eligible randomness epoch after registration is finalized and the protocol's safety margin has passed**. Exact finality buffer/epoch duration remain to be benchmarked; the waiting period is a parameter, not a fixed security requirement.

---

## 1. Executive summary

bitmon takes the exploration, collection, training, and turn-based combat of classic handheld creature RPGs and separates **playing** from **settling shared state**.

**The complete single-player game works without a wallet, ads or blockchain.** Verified multiplayer is a separate opt-in whose canonical lineage begins with on-chain trainer registration; most gameplay still runs locally in a progressive web app (PWA). The client can be modified, but cannot create valid progress merely by editing JavaScript, storage, or save files. An independently verifiable game ruleset, a distributed randomness beacon, and zero-knowledge (ZK) progression proofs establish which changes to a trainer's creature collection are legitimate. An existing blockchain records finalized state and ownership.

The game is **not** a single, synchronized MMO. Every trainer has a personal adventure and personal random encounters. The shared world consists of interoperable rules, authenticated progression checkpoints, restricted creature swaps, and **player-led gyms**. There is no global quota of legendary dragons: two trainers can each legitimately discover the same species.

A previously registered, active trainer receives bounded encounter opportunities tied to verifiable time epochs. The randomness beacon publishes a globally shared value; hashing it with each trainer's **already-registered, fixed ID** yields different encounters for Alice and Bob. Rare encounters require a promptly recorded, expiring on-chain claim. Catching a creature is deterministic once it appears and the battle state meets the rules.

**There is no proof-of-personhood requirement.** Anyone can register as many trainers as they like. The game therefore does not try to stop mass account creation. It makes mass account creation **not worth it**:

1. Creatures can only be swapped one-for-one within the same rarity tier, so rarity cannot be funneled into one account.
2. A swap resets both creatures to the lower of their two levels, so training effort cannot be transferred.
3. Each trainer can make at most one swap per day, so no account can absorb a flood of trades.
4. Tiers cannot be converted into each other (no fusion, breeding, or release-for-rarity).
5. Competitive play (gyms) pays only in fame, so there is no financial prize to farm for.

**Verified Rare/Legendary monsters are individually NFT-minted only from legitimate fresh-public-randomness spawns and timely ZK proofs, paid with the player's own crypto.** They must be minted before competitive gym or friend PvP use; Common/Uncommon remain authenticated inventory entries without NFTs. Restricted NFT swaps and registration are likewise self-funded. The **official gym UI uses Digital Gold exclusively** for the pre-battle challenge commitment and post-win leadership/fame proof. Digital Gold is earned through optional rewarded ads, stored off-chain and consumed by an independent operator that pays only gym-operation gas; it never funds NFTs or enters player wallets as crypto. Official gym leadership/fame are public on-chain. Independent clients retain a direct self-funded path to the gym contracts. **No ad-provider approval is assumed.**

**The non-negotiable principle:** The game must remain playable, verifiable, and settleable if the developer, the sponsor, an indexer, or the original website disappears. Practical implementations still depend on the underlying blockchain and a verifiable randomness network.

---

## 2. Problem and opportunity

### 2.1 The problem

Traditional offline RPG saves are controlled by the player. A modified client can fabricate XP, inventory, rare creatures, or victories. This is harmless in purely single-player play, but becomes unfair when collections are traded or used in PvP.

A traditional solution is a centralized, authoritative online server. That makes the game dependent on one operator, its database, business continuity, and moderation decisions.

Putting every in-game action on a blockchain would be slow and costly. A different solution is needed: **local execution plus verifiable, intermittent settlement**.

A second problem appears as soon as trading exists: a farmer can create thousands of accounts, harvest creatures and levels, and funnel everything into one account. Version 1.0 answered this with identity checks. Version 2.0 answers it by designing the trade rules so that funneling does not work.

### 2.2 The opportunity

Two experiences share game art and combat rules but **not provenance**:

1. **Full local single-player** needs no wallet, blockchain or ads. Players can find and keep all rarities and fight practice gyms. These captures are non-canonical.
2. **Optional verified multiplayer** begins with self-funded on-chain trainer registration before future authenticated randomness. Local saves survive opt-in, but old local Rare/Legendary captures cannot be backdated, minted or used competitively; new verified spawns and timely self-funded NFT mints are necessary. Unverified XP and levels are not automatically canonical.
3. **Competition:** non-NFT Common/Uncommon use authenticated inventory; Rare/Legendary require restricted NFTs. NFT swaps are self-funded. Official gym commitments and on-chain fame claims are charged in Digital Gold within the official interface; permissionless clients can call the same contracts by self-paying gas.

Whether any locally acquired Common/Uncommon may enter the verified starting roster, and at what fixed verifier-checkable baseline stats, is unresolved. Never trust arbitrary client saves.

### 2.3 Original intellectual property

The product should use original creature designs, maps, text, music, names, and branding. It can adopt general genre mechanics without copying protected Pokémon assets or implying official affiliation.

---

## 3. Product principles

| Principle | Product consequence |
|---|---|
| Local-first | Exploration, UI, animations, and most battles run in the browser. |
| Verify rules, not clients | Modified clients are permitted; invalid state transitions are rejected. |
| Explicit entry boundary | Full local single-player needs no wallet or ads; **opt-in verified multiplayer** requires self-funded registration before authenticated future randomness. |
| Self-custody | Players authorize settlements and retain ownership of finalized creatures. |
| Replaceable infrastructure | RPCs, websites, indexers, proof services, and sponsor services have alternatives. |
| Economical settlement | No per-step or per-wild-battle blockchain transaction. |
| Personalized rarity | Shared public entropy, distinct per-trainer encounter outcomes. |
| **Worthless to farm** | Trading rules, bound XP, and fame-only rewards make mass accounts unprofitable rather than impossible. |
| Transparent scarcity | No undisclosed developer minting and no manipulated rare spawn odds. |
| Sponsor independence | Digital Gold is an optional ad-funded official gym UI mechanism; the operator never controls NFT minting, swaps, proof verification, or contract access. |
| Honest limits | No claim that ZK proves human playtime or that bots are prevented. |

### Non-goals for the first release

- A continuously synchronized multiplayer overworld or fully autonomous browser-node blockchain.
- Mining, a speculative game token, staking rewards, or a developer-run token sale.
- An on-chain transaction for every movement, turn, or wild encounter.
- Prevention of bots or multiple accounts per person.
- A marketplace, price discovery, or any in-protocol sale of creatures.
- Financial prizes for PvP or gym ownership.
- Advertising as a mandatory prerequisite for the local game, registration, NFT minting, trading or independent contract access.

---

## 4. Core player experience

### 4.1 Full local single-player

Bitmon starts as a complete single-player RPG with local saves, exploration, battles, collection and gym practice, with no wallet, blockchain or advertising requirement. Local-only Rare/Legendary bitmon can be captured and used in single-player, but are not authenticated and can never be promoted into verified NFTs or official competitive teams later. The save remains intact after multiplayer opt-in. The UI clearly labels **local-only / verified pending / finalized / NFT minted** status. Unverified level, XP and combat history are not portable into canonical progression.

### 4.2 Verified multiplayer opt-in

1. When a player chooses official multiplayer, generate/connect a self-custodial wallet and **self-fund** on-chain trainer registration; commit immutable trainer ID, initial state and required region before the first eligible public beacon.
2. Activation waits for finality and a safe future encounter epoch. Old local encounters are never eligible.
3. Authenticated Common/Uncommon play uses verified inventory commitments, optionally with cached offline encounter material, and batched settlement; no individual NFT mints.
4. Online fresh-beacon Rare/Legendary spawns can be captured locally, then finalized through **one timely, self-funded ZK proof and restricted NFT mint**. Missing the deadline makes that spawn ineligible for canonical capture. Digital Gold is not accepted for this operation.
5. The resulting minted NFT is required whenever a Rare/Legendary creature participates in a competitive gym or friend PvP battle. Verified Common/Uncommon can participate as authenticated non-NFT team entries. Trainer-control rotation preserves quotas and IDs.

### 4.3 Competing and paying

- **NFT mint, trainer registration, restricted NFT swap:** use the player's own crypto, outside the Digital Gold sponsor.
- **Official gym challenge:** in the Bitmon UI, spend **Digital Gold** to sponsor the on-chain pre-battle commitment before future randomness and, on victory only, the final on-chain proof transferring leadership and recording fame. A lost or abandoned challenge has no final proof transaction.
- **Free practice gym battle:** local-only outcome, no on-chain leadership or fame, no Digital Gold.
- **Friend PvP:** off-chain signed turn commitments before future public randomness; no per-turn chain write, and any eventual canonical settlement is self-funded. Rare/Legendary participants must already be minted NFTs.
- **Protocol independence:** while the official Bitmon gym UI accepts only Digital Gold, the gym smart contracts accept permissionless, independently self-funded valid calls. No Digital Gold ledger or ad account can become a canonical validity condition.

### 4.4 Social restrictions

NFT swaps are exactly one-for-one, same-tier, once per trainer per rolling 24 hours, with the lower-level reset. Gym teams must match the permanent gym type. On-chain fame and recognition are non-transferable; there is no monetary gym prize.

## 5. Gameplay systems and balancing assumptions

**Values below are design placeholders, not final balance decisions.**

| Parameter | Initial hypothesis | Rationale |
|---|---:|---|
| Encounter opportunity spacing | One per 5 minutes | Rate-limits farming on one trainer. |
| Daily encounter budget | 96 in a rolling 24-hour window | About 8 hours of five-minute opportunities. |
| Daily XP budget | Level- or region-adjusted cap | Restricts progression beyond intended pace. |
| Unused encounters | Expire rather than accumulate | Prevents storing months of farming opportunities. |
| Rare/Legendary catch-claim window | ~5–10 minutes from the assigned spawn beacon (placeholder) | A successful high-rarity catch must be proven promptly; historical beacon scanning cannot be claimed later. |
| Trainer registration activation | First future eligible epoch after finalized registration and a chain/beacon safety buffer (duration TBD) | Ensures the ID is fixed **before** the corresponding public draw, without an arbitrary day-long first-play delay. |
| PvE chance mechanics | Deterministic pseudorandom stream | Preserves familiar crit/accuracy/status/catch variation where desired without requiring fresh public randomness or allowing restart rerolls. |
| Rare/Legendary security boundary | Fresh randomness for spawn only; one timely final catch claim | Scarcity/luck comes from receiving the high-rarity spawn, not from a second cryptographic capture lottery. |
| Rare spawn limits | Per-trainer probabilistic, **not** globally capped | Preserves classic single-player collection. |
| **Swaps per trainer** | **1 per rolling 24 hours** | Caps how fast any one account can change its collection. |
| **Swap rule** | **Same tier, 1-for-1, levels reset to the lower** | Prevents concentrating rarity or training. |
| Gym challenge eligibility | Finalized team of 1–6 creatures; each has the gym's fixed type | Dual-type creatures qualify if either type matches; pending creatures cannot participate. |
| Gym type restrictions | One permanent type assigned at gym creation | No gym-specific rules can be changed or added by leaders. |
| Gym defense-team updates | Max 1 per 24 hours, with delayed activation (proposed: 1 hour) | Limits defense snapshot bait-and-switch; gym type remains unchanged. |

A quota of 96 encounters per day **does not prove eight hours of human play**. A bot can act immediately on each permitted opportunity. That is accepted: the protocol caps what one trainer can earn, not whether a person operated the keyboard. Because progress carries no financial reward and cannot be pooled across accounts, bot play is tolerated rather than fought.

### Spawn rarity

| Tier | Illustrative chance per eligible slot |
|---|---:|
| Common | 85.0% |
| Uncommon | 12.0% |
| Rare | 2.9% |
| Legendary | 0.1% |

A 0.1% rate means roughly one legendary **spawn** per 1,000 eligible encounters on average, before battle and capture success. Outcomes are probabilistic.

**Note on supply:** because anyone can register trainers, the total number of creatures of any tier grows with the number of registered trainers. That is consistent with the personal-rarity design; scarcity here is per account, never global.

---

## 6. Shared randomness, individual creatures

### 6.1 Core construction

A distributed randomness beacon such as **drand** publishes an authenticated, unpredictable output for round `e`:

```text
B[e] = verified public beacon randomness for epoch e
T    = immutable, game-specific trainer ID fixed at registration
R    = hash("BITMON_SPAWN_V1" || chain_id || rules_version || T || e || B[e])
```

Every trainer sees the same `B[e]`, but different trainer IDs produce independently distributed-looking spawn rolls.

The circuit must verify the beacon result or an authenticated commitment to verified beacon results; a value copied from an arbitrary API is not sufficient.

A cryptographically sound hash-to-range algorithm should avoid modulo bias, particularly for small rarity thresholds. Fixed encoding, domain separation, and rules-version binding are essential.

### 6.2 Preventing identity and encounter grinding

The proof and contract jointly enforce:

- Trainer ID registered, finalized, and active **before** the beacon round became available; no guest or pre-registration rounds are eligible.
- Trainer ID stable across wallet rotations.
- Each eligible `(trainer, epoch)` used at most once.
- The epoch was within the allowed active windows and daily budget.
- No player-supplied random seed, alternate slot number, or reroll.
- No claiming old rare encounters after the deadline.

**Residual risk (accepted):** since registration is permissionless, a player can register many trainers, watch all of their rolls, and promptly claim only the rare ones. That is a farming strategy the protocol does not block. Its payoff is deliberately limited: each farmed creature stays inside its own trainer account, can only leave through a same-tier 1-for-1 swap, and carries no training with it (Section 10).

### 6.3 Regions and player choice

If players can wait until after seeing `B[e]`, compute all region outcomes, and claim whichever zone yields the best species, they gain a hindsight advantage.

Recommended MVP rule: **rarity is independent of region**, and the encounter zone is derived from a previously finalized, immutable-for-the-epoch checkpoint or other prior commitment. Region-specific species tables then map the same rarity to a zone-appropriate species. If committing location needs too many transactions, simplify early versions to a global species table or the **initial region fixed in the registration/genesis state**, with explicit later region-transition commitments.

A separate `hash(... || "species")` provides the species draw; domain separation prevents reuse of the rarity bits.

### 6.4 Beacon availability and cost

No player-specific randomness transaction is necessary merely to read a beacon round. Players fetch published rounds from interchangeable endpoints, while the proving circuit authenticates them. A drand BN254-compatible beacon is a candidate for EVM verification; prover and on-chain performance must be benchmarked.

Network outages need predefined handling: suspend affected online high-rarity/competitive slots, shift deadlines deterministically, or apply a transparent fallback protocol. Never let a central developer choose substitute values after seeing player outcomes.

### 6.5 Offline ordinary play versus online high-rarity play

The protocol deliberately separates ordinary offline-capable play from high-value randomness:

- **Verified offline ordinary mode:** previously authenticated encounter material may authorize only **Common or Uncommon** wild encounters. It must be domain-separated from high-rarity draws and must not contain a hidden future Rare/Legendary result that the player can inspect offline.
- **Verified online high-rarity mode:** an eligible encounter slot is bound to the trainer, rules version and required location/region commitment **before** the deciding future beacon round. The fresh round may yield Rare/Legendary outcomes. A player cannot wait for a published round and then elect to apply it to an arbitrary slot or region.
- **Mode selection cannot be hindsight-selected.** If the protocol lets a player choose an offline ordinary slot versus an online full-rarity slot, that choice must be fixed before the online slot's deciding randomness is available.
- **Public security RNG domains:** use strict domain separation such as `BITMON_SPAWN_V1` and `BITMON_COMPETITIVE_V1`. Public-beacon randomness is reserved for outcomes where advance predictability would undermine fairness.
- **Local deterministic PRNG:** chance-like mechanics that do not require cryptographic unpredictability derive rolls from a canonical seed such as `hash("BITMON_LOCAL_RNG_V1" || rules_version || encounter_or_battle_id || domain || event_index)`. The seed is not secret. Stable domain tags and canonical event counters make results reproducible across clients and restarts. Where feasible, counters advance on fixed game events rather than on player-selected move names, limiting action-shopping for favorable rolls.
- The battle/UI layer should use one RNG abstraction whose provider is either the authenticated public beacon or the deterministic local PRNG. A normal player should see the same style of crit/miss/status/catch feedback regardless of provider.
- Reloading, reconnecting, changing devices or replaying the same local encounter must preserve the same deterministic PRNG sequence rather than producing another roll.

This uses one authenticated public-randomness infrastructure for security-critical outcomes and a separate deterministic pseudorandom mechanism for ordinary gameplay feel; the latter is explicitly **not** a security source.

---

## 7. Verifiable combat and capture

**World and camera presentation (Task 002 / DEC-019, DEC-021):** The **first prototype is exploration-only**: original male eight-direction animated trainer, floating mid-screen gesture joystick, and a **fixed-pitch, player-zoomable, heading-following camera** over MapLibre's unchanged OpenFreeMap geometry. Later battles remain in the **same 2.5D world scene**, zoom/reframe toward the encountered bitmon, restore the captured pre-battle bearing/pitch/zoom/follow state, and then resume heading-following mode. Camera rotation is **presentation only**: it never rotates true geographic player coordinates, modifies mapped geometry, or affects encounter validity and battle rules.

**PWA channel architecture (DEC-022; 2026-11-02):** `main` is the only source of stable application code. `preview` contains reviewed experimental work; after a **successful** `push` CI run on that trusted branch, a `workflow_run` executes on the default branch `main`, satisfies its protected `github-pages` environment, checks out the successful preview commit SHA and `main`, independently builds each with Vite's relative asset paths, and publishes a **single** GitHub Pages artifact with root Stable and `preview/` experimental. Rebuild the stable artifact from `main` on preview-only updates: never substitute `preview` compiled assets into the stable root. A `main` push also updates both; pull requests and failed CI runs do not deploy. A one-time **infrastructure-only reviewed release** is needed to bootstrap this main-branch workflow without promoting untested gameplay.

**PWA isolation and update lifecycle (DEC-029):** the Preview manifest remains scoped to its own subpath and receives a distinct visible name/title/theme/icon at **build time**. **Manifest `id: "."` was not distinct:** the `id` URL is resolved relative to the **start URL's origin**, so both relative dots identify the origin root. Keep Stable's original ID for existing installations; set Preview to explicit `id: "/bitmon/preview/"`, `start_url: "./?channel=preview"`, and `scope: "./"` during the trusted Pages build. Preview uses a large purple preview-specific icon and distinct name; Stable keeps its existing teal icon. Verify the browser's computed app ID on a real device. Each service worker uses a scope-derived cache key and cleans only its own CacheStorage entries; the stable root worker skips preview requests. Both apps share a web origin, so future localStorage/IndexedDB game data must be explicitly namespaced. No second repository, PAT, custom domain or remote hosting provider is introduced. The Pages output contains compiled app files only, not source or Git history. npm lockfile v3 is committed and both build workflows use `npm ci` to reproduce dependency resolution. After each Vite production build, a Node-only build step hashes the emitted HTML/manifest/icons/trainer atlas and hashed JS/CSS assets, replacing a service-worker build revision token; changes to compiled gameplay then produce changed SW bytes without manual cache-version increments. The SW pre-caches only the app shell, uses network-first requests with offline shell fallback, and deletes only cache entries for its own scope. On updates it remains waiting until the controlled client displays an update notice and the player explicitly taps Reload; the client sends `SKIP_WAITING`, then reloads on `controllerchange`. Checking for updates when an app returns to the foreground avoids frequent background polling. The initial install may activate normally. Uncached OpenFreeMap tiles remain network-dependent. The `pages.yml` workflow always runs from `main`: its `npm ci` change is not operational until separately promoted to `main`.

**Installed-PWA storage durability (DEC-031; 2026-11-03):** The existing IndexedDB tile PBF bytes, lightweight metadata and per-channel localStorage avatar position are retained without duplication. At PWA registration, detect an installed standalone launch with CSS `(display-mode: standalone)` or iOS `navigator.standalone`. Only from an installed launch, call `navigator.storage.persisted()` and, if not granted, `navigator.storage.persist()`; expose the result or unsupported state in Settings and offer a manual retry if denied or failed. Ordinary browser tabs do not request protection. Persistence may be granted or declined by browser heuristics, and manual deletion of app/site data remains possible.

**Storage-scope limitation:** Web platform storage persistence and quotas are for the **origin**, not the installed PWA manifest identity or individual IndexedDB database. Both GitHub Pages channels use `https://s3ton.github.io`, so the permission and quota can apply to other pages on that same origin despite requesting it only from the installed bitmon app. Separate namespaced IndexedDB databases (`bitmon-map-preview`, `bitmon-map-stable`), `bitmon:...:position:v1` keys, and service-worker caches avoid logical cross-channel overwrites, but **cannot guarantee exclusive storage or exclusive permission for the PWA**. This would require a distinct origin/hosting arrangement if required later. No new storage format, backup service or duplicate tile representation is introduced.

**Coordinate travel and offline world cache (DEC-030; 2026-11-03):** E0 offers a *prototype-only* coordinate jump in the camera/settings menu. Parse a single input as **latitude, longitude**, validate finite bounds (latitude within ±85°, longitude within ±180°) and never interpret it as physical GPS. Probe the destination's OpenFreeMap vector tile either from local storage or via the public endpoint; move the map provisionally, wait for MapLibre to report loaded source tiles, and refresh source building/water footprints. Treat the requested coordinate as an anchor: commit it directly when walkable; if blocked, run the same bounded nearest-clear search used for obstructed startup positions, preferring loaded OpenFreeMap transportation lines and then exact nearby source collision geometry. Save only the resulting validated landing. If source data is unavailable or no clear landing is found within 70 m, restore the original map center, cached collision state and player coordinate. This debug/exploration convenience creates no verified travel proof, and must not be used to claim encounter-region eligibility.

The OpenFreeMap vector-tile source uses a MapLibre custom protocol backed by **origin-local IndexedDB**; it loads actual vector PBF bytes without generating synthetic geography. MapLibre overzooms tiles beyond OpenFreeMap zoom 14, so one z14 tile key also guards higher-zoom movement. A successful live request persists the tile in a separate **Preview or Stable** IndexedDB; revisiting tiles returns stored bytes, including offline. There is **no background region prefetch** or bulk offline download. A tile is downloaded only when MapLibre renders it or the player explicitly requests a coordinate jump. No bulk offline download is implemented. OpenFreeMap separately limits explicit offline-area downloads (3,000 tiles or 50 MB per download, at most four concurrent requests, identifying User-Agent); a future prefetch workflow requires a separate terms-compliance review because browser scripts cannot customize User-Agent. The 100 MiB per-channel budget is measured in stored PBF ArrayBuffer bytes, not IndexedDB bookkeeping, browser HTTP cache, or the service worker's shell. When adding a tile would exceed it, transactionally delete cached entries in descending great-circle distance from the current player, never deleting the tile containing the player solely to save a remote tile. If the browser has a smaller quota or disabled IndexedDB, online streaming can continue, but new tiles may not persist. The browser/OS can still evict all site data. An offline attempt to walk or jump outside already available source tile data stops at the boundary; ordinary building/water collision and map attribution are unchanged. Map data can become stale until a cached tile is evicted; consistent map revision pinning is deferred.

Each channel's last accepted WGS84 position is separately saved in localStorage (bitmon:preview:position:v1 or bitmon:stable:position:v1), throttled during movement and flushed on page hide, with save on successful initial spawn and teleport. Read it at startup before initializing the map/camera; reject corrupt or out-of-range coordinates. Local saves are convenience state for the exploration prototype, **not authoritative or cryptographically verified progression**. Manual phone acceptance must cover offline restart, tile-edge stopping, blocked-coordinate relocation to the nearest clear landing, unavailable/no-clear teleport rollback, cache eviction under constrained storage and independent Stable/Preview saves.

**Simplified settings and source-cache architecture (DEC-032; 2026-11-03):** All player-adjustable native form controls that are actual preferences opt in with `data-setting="key"`. The single `src/settings.ts` initialization restores checked/select/range/text values from a channel-prefixed `bitmon:{preview|stable}:settings:v1` JSON record **before the map is constructed**. Changes persist on each control's native `change` event. It verifies select options and numeric bounds, ignores corrupt storage, and writes only the currently mounted marked controls (discarding obsolete settings). Camera responsiveness and the on-screen zoom slider use this mechanism; new preferences must add `data-setting` rather than introducing ad-hoc persistence. Destination coordinate input and transient progress/status controls remain unsaved. Position remains a separate progression key, while geographic PBF caching remains IndexedDB only.

MapLibre `querySourceFeatures` can duplicate clipped source features across tile boundaries and returns only currently loaded vector geometry. The collision snapshot refresh now requires the actual canonical z/x/y tiles covering the player's near-foot sample ring to have emitted successfully decoded source-tile events; a downloaded/stored PBF by itself does not count as decoded. If neighboring tile decoding is incomplete, retain the previous verified collision snapshot and block movement to undecoded tile locations, without freezing the player for missing tiles elsewhere in the viewport. Remove **exact duplicate** building/water polygons of the same height, retaining overlapping buildings with different heights and distinct clipped fragments along tile boundaries; never deduplicate solely by feature ID. This is a source-safety guard, not a full navigation/entrance model.

**Startup map readiness recovery (DEC-033; 2026-11-03):** Real-device report after PR #30: movement is blocked by "Map data is not loaded here" immediately after updating Preview. The new tile-decoded-only gate can leave the spawn collision snapshot uninitialized even if MapLibre has finished loading source data. The feature startup `idle` handler previously only called `refreshCollision` once; an intended fallback had been inadvertently placed in the **teleport rollback** path instead. Restore the teleport catch to a single collision refresh, listen for map `idle` whenever collision geometry has not yet initialized, and allow the tile-readiness guard to accept a tile when both (a) its raw PBF was actually delivered through the bitmon MapLibre protocol during the running session and (b) MapLibre reports its source and visible tiles settled. Decoded per-tile events are still preferred for partial-offline operation, and source requests that fail remove any supplied-PBF mark. This does not accept a tile just because it exists in IndexedDB metadata or because distant source data finished loading, nor does it fabricate geography. The session-only supplied-key set is an availability signal, not another PBF cache. Manual smartphone confirmation is required before marking the regression resolved.

The cache keeps one network/IndexedDB read in flight per z/x/y and makes each caller its own transferable ArrayBuffer view so MapLibre worker transfers cannot detach the buffer being persisted. Raw PBF writes are queued without blocking map rendering; only one persisted copy is stored. MapLibre's decoded tile list is the only movement-readiness authority; the former long-lived cache-side list of downloaded tile keys has been deleted. Pending write buffers may temporarily exist in memory, and an unfinished write at sudden shutdown is not yet durable. IndexedDB metadata stores only key and byte size (the geographic center derives from z/x/y); old metadata fields remain readable until eviction. Scoped PWA shell caches serve already cached non-navigation assets before network requests, while navigations remain network-first to detect new app releases. The CI and production build run TypeScript checks **once**, as `npm run build` already includes `tsc --noEmit` followed by Vite and service-worker stamping. On current Pages hosting the deployed `pages.yml` is taken from `main`, so it will retain its previous redundant check until a separately approved main promotion.

**E0 design/implementation contract (2026-11-02):**

- **Movement state:** player position is true WGS84 longitude/latitude, restored from per-channel local save when available; full input deflection moves **10 m/s**, integrated with elapsed time, clamped background-frame delta and normalized diagonals. Short local moves use a spherical Earth approximation. The MapLibre 3D custom trainer layer anchors the sprite's feet to the actual geographic location, not to a decorative screen pixel.
- **Camera/input separation and soft-follow:** at the start of each gesture/key sequence, snapshot camera bearing as the geographic direction-input basis and keep it fixed for the sequence; the camera must not steer the geographic direction input as it rotates. Follow the **actual accepted displacement** immediately with the map center. Camera yaw begins only after the same accepted travel heading persists for a preset delay, with heading-change reset above 12° and dead-zone suppression for bearing errors of 12° or less. Ignore backward or backward-diagonal input at ≥135° from the captured input basis, so reverse movement never triggers a camera flip. When eligible, rotate along shortest-angle delta with `delta * (1 - exp(-dt / dampingSeconds))`, capped at `maxDegreesPerSecond * dt`. Balanced default: 0.4 s delay, 60°/s cap, 0.8 s damping; Relaxed: 0.7 s, 35°/s, 1.2 s; Responsive: 0.15 s, 100°/s, 0.45 s. Stop camera motion immediately when the avatar stops/blocks, without post-idle coasting. Presets are session-local: an accessible 44 px hamburger disclosure in the portrait top-right reveals a camera responsiveness select; native disclosure/summary provides keyboard/touch toggle, and the panel closes after preset selection. The full settings element is excluded from joystick pointer capture. Keep the zoom slider exposed on-map rather than nesting it in settings. Exploration pitch defaults to **45°**, with an automatic, bounded source-driven occlusion override down to 0°; right-side zoom remains **15.5–18** (default **18**, step **0.1**); the trainer billboard is drawn at 3× its true-scale height so it stays readable. Map drag/pinch rotation/tilt remain disabled. For a source building intersecting a horizontal ray from trainer to camera (opposite bearing), compute entry distance to its actual polygon edges in WGS84-to-meter coordinates and compare its OpenFreeMap `render_height` (same 14 m fallback as extrusion) to the ray clearance at pitch. Choose the highest safe pitch below 45° with a 1 m safety margin. Recompute source clearance at most 10 times/second. Use the same local spatial collision index to narrow camera candidates to a conservative corridor toward the camera, then keep the exact source-polygon ray intersection as the authoritative clearance test. Ease pitch symmetrically with a 45°/s cap and 0.65 s exponential damping so both movement toward overhead and restoration toward 45° are visibly gradual; brief real avatar occlusion while the camera catches up is allowed. Render the trainer through a MapLibre `CustomLayerInterface` with `renderingMode: "3d"`, after the building extrusion layer. Project its X/Y from a zoom-20 tile-relative local frame through MapLibre's per-tile matrix rather than passing absolute 0..1 Mercator coordinates to the shader; this avoids high-zoom float32 movement jitter while retaining the shared depth buffer. A single screen-facing textured quad uses the existing 5×8 trainer atlas and preserves the existing meter/pixel readability scale. Its screen position stays billboarded even near top-down pitch, while shader depth interpolates from the trainer's geographic feet to its physical 1.8 m head altitude; transparent texels are discarded. The layer shares MapLibre's depth buffer so fill-extrusion geometry performs per-pixel avatar occlusion on the GPU. No `queryRenderedFeatures`, DOM marker, CSS mask, or separate occlusion sampling path is used for avatar visibility. Continue camera pitch animation while idle, without changing world collisions or camera yaw.
- **Building facade art (DEC-040):** buildings render as three MapLibre `fill-extrusion` layers using `fill-extrusion-pattern`: ground floor (0–4 m), upper storeys, and a 0.5 m roof cap ending at the source `render_height` (14 m fallback, shared with collision). Pattern images are generated procedurally on demand (`bt-{part}-{style}-{variant}-{zoom}`), one per integer tile zoom with power-of-two CSS sizes, because MapLibre scales extrusion patterns per tile zoom. A Web Worker on the tile protocol path splits OpenFreeMap's merged building multipolygons into one feature per footprint, copying source attributes unchanged, and adds `bitmon_style` (POI points inside the footprint, else commercial/retail/industrial landuse) and `bitmon_variant` (vertex hash). After tagging, each footprint is clipped to its own tile square, with cut points rounded to whole tile units so neighbouring tiles cut at the same vertices. Every tile also carries a 64-unit margin of its neighbours' footprints, and a footprint crossing a tile edge can be styled differently in each tile; drawing both copies would make the overlap z-fight. The clipped parts meet along the edge and together cover the source footprint. Other tile layers pass through byte-for-byte; the offline cache stores raw source tiles.
- **Road surface art (DEC-043):** streets, footways and plazas are plain MapLibre `line`/`fill` layers on the `transportation` source layer (no custom renderer): sidewalk strip, kerb, asphalt, alley setts, centre and edge lines, footways by subclass and surface, painted crossings, then bridge sides and decks sorted by `layer` above the ground network. Carriageway widths are per-class art choices in metres (`CARRIAGEWAY_METRES`); the worker tags every transportation feature with `bitmon_ppm` (CSS px per metre at zoom 16 for its tile's latitude) and the style scales it exponentially per zoom, so widths stay true to the ground. The same tile worker (`tiles.worker.ts`) rebuilds the `transportation` layer with geometry and source attributes unchanged, marks streets whose length is mostly paralleled by a mapped footway 2 m to 8 m beyond the kerb with `bitmon_sidewalk: 'mapped'` (no painted sidewalk there), and writes a separate `bitmon_crossing` layer: for each at-ground footway crossing an at-ground street at 30° or more, the stretch of that footway across the carriageway, never past its own vertices. Line patterns stretch to the line width and need one image each; plaza and deck `fill-pattern` images are drawn per integer zoom with power-of-two CSS sizes, like facades. `oneway` is ignored because OpenFreeMap sets it on about 97% of roads. Tunnels, `indoor` features and negative `layer`/`level` are not drawn.
- **Landmark facades (DEC-041):** the tile worker marks a heritage-class POI (place of worship, attraction, monument, castle, museum, theatre, town hall, library, non-artwork gallery) with at least 20 `name:*` translations as a landmark. Starting with the most translated POI, it groups the building parts containing it and grows the group up to four steps to parts centred within a member's outline, to a base surrounding a member (at most 25× its area), or to parts stacked on or under a member (touching within about 2 m in plan). Grouped parts get `bitmon_landmark`, an archetype `bitmon_style` (DEC-042: cathedral, mosque, temple, shrine, fortress, ruins, arena, ironwork, bell tower, skyscraper, bridge, palace; class/subclass decide worship and castles, otherwise water plus a raised 80 m deck → bridge, a 120 m+ ground-standing body → skyscraper, taller open structures → ironwork, a POI part ≥3× taller than wide → bell tower, then ironwork, arena or palace) and a `bitmon_variant` that indexes the shared landmark tint palette, snapped from the mapped `colour`. Landmark walls stop 1 m below the roof cap, and a separate `fill-extrusion` layer fills that band with a gold cornice. POI, landuse and footprint lookups use a uniform 256-unit grid.
- **Avatar facing and scale:** geographic heading relative to current MapLibre bearing is quantized to **eight 45° sectors**. The current original WebP atlas is **8 animation columns × 5 authored direction rows**; left-facing directions reuse right-facing rows through shader mirroring, so eight screen directions do not require duplicate texture rows. The WebGL billboard selects atlas UVs without rebuilding DOM or re-uploading the image. The sprite is based on a nominal **1.8 m** geographic projection with an **8 CSS px** readability floor, then both displayed dimensions are multiplied by **2** (yielding a 16 px minimum). This intentionally exaggerates only visual sprite size; the geographic position and collision probes remain unchanged. The feet remain at the geographic custom-layer anchor, and pixel dimensions are recomputed from zoom to preserve relative ground scale and the readability minimum.
- **Minimal source collision and spawn:** cache WGS84 building/water source polygons around the player and test true geographic coordinates including a foot margin. The verified snapshot is indexed into **24 m local spatial-hash cells** so each movement probe checks only its cell instead of linearly scanning every nearby polygon. A footprint spanning more than **64 cells** stays in a small overflow list rather than multiplying references across the grid; the exact existing point-in-polygon test remains authoritative. On first loaded tiles, relocate an obstructed initial coordinate to the nearest clear point on OpenFreeMap transportation line geometry; if none exists, search nearby unblocked positions. Never invent a road or entrance. Permit movement inside a bounded already-checked geographic cache despite transient source tile loading, refreshing on source readiness before crossing the checked radius. Halt at unknown geometry; this is not a complete pedestrian access model. **Bridges and raised parts (DEC-044):** building parts with `render_min_height` of 3 m or more are walked under (they still count for camera clearance); transportation `bridge`/`pier` areas and each bridge road or path's drawn deck width (`deckMetres`, shared with the road art) are walkable over water and buildings. Rail bridges stay blocked. While the trainer stands inside rendered building footprints, only those parts (by world-unique part id from the tile worker) are filtered out of the opaque building layers and drawn by translucent copies above the trainer; no other case makes buildings translucent.
- **Floating gesture control:** pointerdown on the portrait app within screen-height fraction **[0.1, 0.9]** displays a joystick centered on the start location; upper/lower 10% are excluded. UI inputs (notably the side zoom slider) are excluded from avatar control capture. Interpret both touch and keyboard Y as positive downward and use `atan2(x, -y)` relative to the camera bearing captured at control start: upward means screen-forward, downward screen-backward. The old touch-only `atan2(x, y)` branch was inverted. The camera can slowly rotate toward sustained non-backward travel (with the captured input basis unchanged); optional WASD/arrow input shares the same mapping. Subsequent captured pointer displacement supplies direction and analog magnitude independent of camera bearing during that gesture. Pointerup/cancel, blur, hide and landscape immediately remove the joystick and set idle. Keyboard debugging reuses the same world-motion path. Avoid idle animation frames unless camera easing remains active.
- **Later architecture:** entrance/access rights, navigation graphs, canonical/verified travel (separate from the E0 coordinate jump), GPS, verified movement/encounter region commitments, and battle-camera transition implementation are deferred. Prototype geographic movement is not a cryptographic locality proof.

### 7.1 Battles

The authoritative rules engine computes damage, defense, abilities, status effects, XP, healing, consumable usage and any randomness-derived battle events. Settlement uses the exact, versioned rules engine rather than trusting a client claim of victory.

**Wild PvE is protocol-deterministic but can look random.** Once an encounter is authenticated, the browser resolves any chance-like crit, accuracy, status, damage-variance or capture mechanics through the canonical local PRNG. The same encounter/battle state and event sequence always produce the same rolls, including after restart. Predictability by sophisticated players is accepted here because these rolls are not the scarcity/security boundary.

**Friend PvP is online and mutually committed.** For each turn, both players sign/commit their actions to each other before the protocol-assigned **future** authenticated beacon round. Once both commitments are fixed, the beacon resolves security-relevant crit/accuracy/status rolls through domain-separated hashes. No on-chain transaction is required per turn; a later proof/final result may be submitted only if that battle affects canonical state.

**Gym challenges use one initial commitment, not per-turn chain writes.** Before the challenge randomness starts, the challenger commits the gym ID, active defense snapshot, challenger team, rules version and a deterministic battle policy/strategy capable of selecting actions from previously known battle state. The registered defense policy similarly fixes defender choices. Future beacon rounds then resolve security-relevant chance events. Because later manual choices are not separately timestamped, they cannot be changed after seeing a beacon; truly manual adaptive gym turns would require additional per-turn commitments and are outside this one-commitment design.

### 7.2 Capturing

Capture does **not** require a second public-randomness protocol for Rare/Legendary bitmon. The security goal is that the high-rarity **spawn itself** was legitimately assigned to the trainer.

Wild capture mechanics may still feel probabilistic if the game design calls for it. In that case, Common/Uncommon and Rare/Legendary PvE use the canonical deterministic local PRNG, with HP, status, item quality, species difficulty and other published state feeding the rules. Because this PRNG is reproducible rather than unpredictable, a sophisticated player may simulate or optimize the encounter after seeing a Rare/Legendary spawn. **That is an accepted trade-off:** rarity scarcity comes from the unpredictable spawn, not from cryptographically hiding the later battle/catch sequence.

A ZK proof can verify that the claimed post-encounter state follows the versioned PvE rules and deterministic PRNG sequence. No pre-capture commitment, future capture beacon, or per-attempt on-chain transaction is required.

### 7.3 Verified Rare/Legendary single-claim NFT mint and deadline

A high-rarity encounter is an **online-only, short-lived authenticated opportunity**, but there is no separate reservation transaction. The trainer's account registration is the prior on-chain commitment; protocol rules must deterministically bind each eligible high-rarity slot to its trainer, rules version, assigned beacon round and any required region/location context before that beacon exists.

Illustrative successful flow:

| Time | Event |
|---|---|
| 09:59 | Registered trainer/slot/required region context is already eligible and bound by protocol rules. |
| 10:00 | Assigned future beacon reveals; the fixed draw produces a Rare/Legendary species. |
| 10:00–10:07 | Player fights and captures locally under the versioned PvE rules and deterministic local PRNG. |
| 10:07 | Player **self-funds one high-rarity catch + restricted NFT mint transaction** with a ZK proof; Digital Gold is ineligible. |
| On-chain | Contract verifies registration predates the beacon, slot/region/rules binding, authenticated beacon, resulting rarity/species, unused slot, legal state transition and that the claim is still inside the deadline. |

If the player loses, abandons the encounter, cannot produce a valid proof, or submits after the deadline, no high-rarity creature is finalized. The exact deadline is a parameter; the current design hypothesis is only that it is measured in minutes and leaves enough time for normal battle, proof generation, mobile latency and chain inclusion.

This intentionally permits a player to know they received a Rare/Legendary spawn before deciding how aggressively to optimize the fight. What they cannot do is manufacture a different high-rarity spawn, substitute an old beacon round, reuse the slot, or claim it long after the live opportunity.

### 7.4 Ordinary encounters

**Verified Common and Uncommon** encounters and ordinary XP need no prompt online claim for the MVP. Authenticated ordinary encounter material can be cached while online and consumed later offline, within enforced encounter and daily budgets. Their chance-like battle/capture events use the deterministic local PRNG. Offline material cannot upgrade into Rare/Legendary outcomes. Results can be proven later.

A player might reconstruct old ordinary slots and simulate legal Common/Uncommon play afterward. **That remains permitted within the declared security model** because high-rarity issuance and competitive public randomness are excluded from this offline path.

---

## 8. Zero-knowledge progress verification

### 8.1 State transition

Let `S0` be the last canonical trainer state, `A` a series of actions, and `B` the authenticated beacon inputs:

```text
S1 = ExecuteGameRules(S0, A, B, rules_version)
```

The proof verifies that the claimed new state follows from the accepted prior state under the official rules and public inputs.

A settlement transaction supplies or commits to:

- Trainer ID and controlling wallet authorization.
- Previous finalized state root and version/nonce.
- New state root and XP/ownership outputs.
- Relevant epoch range and daily quotas.
- Verified randomness data and any required timely rare claims.
- Any swap records or gym results being consumed.
- Proof bound to the verifier, chain, game instance, and rules version.

The contract must reject replays, stale checkpoints, conflicting branches, forged signatures, and invalid proof versions. A valid proof of *some* transition is insufficient unless anchored to the latest accepted canonical state.

### 8.2 Checkpoint strategy

Verified ordinary progress stays pending and local until the player wants to secure it, swap, or challenge a gym; a local-only single-player save cannot be automatically canonized. One proof can validate many encounters.

**Trade-off:** fewer chain transactions shift work to proof generation and data retention. General-purpose zkVM proving can be resource-intensive on mobile devices. Evaluate:

1. Browser/local proving for small batches.
2. Optional user-chosen remote proving; sound verification prevents the prover from forging results, but it can see private inputs unless protected.
3. Incremental/recursive proofs or shorter session checkpoints.

Never promise that all players can generate long general-purpose proofs in a browser until measured on target hardware.

### 8.3 Save durability

An unfinalized local run is vulnerable to device loss. Offer encrypted user-controlled backups and explicit export/import of local logs. The verified state root makes cheating detectable; it does **not** preserve the full data. Provide redundant, independently served state/history data so the game can be reconstructed after a client or hosting outage.

### 8.4 Rules upgrades

Start with an immutable versioned ruleset and verifier. If bugs require revisions, adopt a public upgrade/migration process with a time delay and clear player choice. An unrestricted developer upgrade key would violate the promise that even the developer cannot mint arbitrary creatures.

---

## 9. Creature ownership and competitive eligibility

Only **verified Rare and Legendary** bitmon become individually minted, restricted-transfer NFTs. **Common and Uncommon** are authenticated inventory entries in verified play, with **no individual NFTs**. Local-only creatures at all rarities are game-save data, not on-chain assets.

### Requirements

- Verified trainer inventories carry authenticated commitments; proof verification establishes species, tiers, traits, lineage, XP and ownership.
- A Rare/Legendary NFT may be minted only through a **self-funded**, in-deadline proof for a lawful capture from a fresh, previously assigned public-beacon spawn. An old local capture can never be minted retroactively. Digital Gold is not authorized to fund NFT mints.
- Each verified creature has exactly one canonical owner. Rare/Legendary NFT metadata is authenticated and content-addressed; standard token `transfer` and `approve` paths are disabled. Ownership changes only via the restricted swap contract or documented time-locked wallet recovery.
- **Official gym and friend PvP eligibility:** every Rare/Legendary participant must be represented by an already-minted authenticated NFT; verified Common/Uncommon use authenticated inventory entries and valid competitive stats. No unverified local XP, levels or creatures can be asserted as canonical.
- Gym-defense creatures are trade-locked. NFT swaps must be atomic; no freely transferable wrapper bypassing swap restrictions may exist.
- Rarity is personal/probabilistic, not a global mint quota. Off-chain whole-account sales remain a residual risk.

## 10. Trading rules and anti-farming

This section replaces the v1.0 proof-of-personhood design. The aim is **not** to prove each trainer is a unique human. It is to make mass account creation unprofitable.

### 10.1 The attack being defended against

A farmer creates thousands of trainers, harvests rare creatures and levels on all of them, then moves the best into one account to build an unbeatable collection or sell it for off-chain value.

### 10.2 The rules

| Rule | Effect |
|---|---|
| **Same-tier 1-for-1 swaps only.** No gifts, no one-sided transfers, no in-protocol sales. | To receive a legendary, an account must give up a legendary. Rarity cannot be concentrated. |
| **Level reset to the lower.** After a swap, both creatures take the level of the lower-level creature (level 20 ↔ level 100: both become level 20). | Training effort cannot be moved between accounts; a farmed level-100 is worth the same as the level-20 it is swapped for. |
| **Trainer-earned properties reset or stay bound.** XP, training points, held items, friendship, and any moves beyond those learnable at the new level are reset or remain with the trainer. Only fixed properties travel: species, tier, innate traits, and provenance. | Closes the "level up on a throwaway, swap into main" path. |
| **No cross-tier conversion.** No fusion, breeding across tiers, "release N commons for a rare", or trade evolutions. The **tier is a property of the whole evolution line**, so evolving never changes tier. | Value cannot cross the tier wall. |
| **Max 1 swap per rolling 24 hours per trainer**, counted for both parties. | An account can change at most one creature per day, so it cannot absorb a flood of trades. The cap survives wallet rotation. |
| **Atomic settlement.** Both creatures move in one transaction with both trainers' consent. | No double sale or duplication. |

### 10.3 Why this works

- **Consolidation is capped by the tier wall.** A farm holding 1,000 legendaries can push none of them into the main account without taking one back.
- **Training is not portable.** A creature's power in gyms comes mostly from level, and level is bound to the trainer's own XP budget. Farming 1,000 accounts does not produce 1,000 trainer-days of XP for one account.
- **Collecting accounts does not merge inventories.** Even if someone obtains many accounts, a gym team of six must live in **one** account. Accounts and their inventories cannot be combined.
- **No financial reward to chase.** Gyms pay only in fame (Section 11). With no prize to extract, the economic case for mass farming is weak even before the trade rules apply.

### 10.4 Known costs to legitimate players

- Gifting a spare rare to a friend is impossible; friends must swap same-tier.
- One swap per day slows completionists. Tune the number if playtests find it too slow, but note that loosening it directly raises the rate at which an account can consolidate.
- Level reset removes the joy of receiving a high-level creature. Treat that as intended.

### 10.5 Residual risks (accepted, monitored)

- **Off-chain sales.** A farmer can sell a swap slot for money: the buyer hands over a same-tier creature and pays extra off-chain. The 1/day cap and the level reset limit the profit and volume.
- **Species desirability within a tier.** Players will swap toward the best species in each tier. Balance species within a tier, and consider finer sub-tiers if a few species dominate.
- **Account sales by key handoff.** Nothing prevents someone selling a private key. That transfers one account, not a merged inventory, so it does not break the rules above.
- **Large supply of high tiers.** With unlimited trainers, total legendaries grow with the number of accounts. Scarcity is personal, not global.
- **Optional hardening not adopted yet:** a multi-day lock after receiving a creature via swap (breaks relay chains), diminishing returns for duplicate species, and per-species swap limits.

### 10.6 Registration cost

Because **optional verified multiplayer** begins with registration, its self-funded onboarding cost is a choice rather than a single-player prerequisite. Unlimited free registration creates state bloat and invites spam; evaluate a modest non-refundable fee or refundable bond. **Digital Gold is never used for registration**, and any compatible client can register permissionlessly with native gas.

---

## 11. Player-led gyms

### 11.1 Concept

A **gym** is a named location with **one permanent assigned creature type**, such as Fire. Its type is fixed when the gym is created and **never changes**, including when leadership changes. Different gyms use different types wherever possible so each has a distinct identity and team-building challenge.

At any time, the gym has a **leader**: the trainer who last defeated the previous leader. Challengers fight the leader's own registered defending team. **Every creature on both the challenging team and the defending team must have the gym's assigned type.** A dual-type creature is eligible when **either** type matches. A gym's type is its **only gym-specific participation rule**; leaders cannot introduce or modify restrictions on levels, rarity tiers, species, items, or team size. Normal game-wide battle and proof requirements still apply.

Beating the leader makes the challenger the new leader. The only reward is **fame**: a permanent on-chain record of reigns and defenses, plus soulbound (non-transferable) badges bound to the trainer.

### 11.2 On-chain gym record

Each gym stores:

- Gym ID, name, and **immutable assigned type**, fixed at gym creation.
- Current leader's trainer ID.
- The leader's **defense team** (hash of up to six finalized creatures, a snapshot of species/forms and their types, levels, moves, and the defending battle policy).
- A pending **defense-team update** and its activation time, if any; there is no pending or editable gym-rule configuration.
- Reign start epoch and a log of past leaders and defenses.

The gym type is a fixed field validated against the canonical creature type data in the official ruleset. It cannot be changed through a leader action or by changing the defense team.

### 11.3 The one permanent type rule

For a **Fire gym**, examples of eligible creatures are:

- **Fire** — eligible.
- **Fire/Wind** — eligible.
- **Rock/Fire** — eligible.
- **Water/Wind** — ineligible, because neither type is Fire.

The test is `gym_type ∈ creature_types`, applied independently to **every creature** on both teams. A creature need not be exclusively the gym type; its **moves** need not be of the gym type. Type eligibility is determined from authenticated creature species/form metadata at the defense or challenge snapshot, not from a player's unsupported claim.

Both teams use the standard global battle team size of **1–6 creatures**. This is not a configurable gym restriction. No leader may set a higher level threshold, exclude a rarity tier, ban a species, ban items, add secondary types, or otherwise change the gym's eligibility rule.

For accessibility, the initial world design should make at least one Common-tier creature of each gym's assigned type obtainable through ordinary play. This is a **content-design requirement**, not an extra rule chosen by a leader.

### 11.4 Challenge flow

1. The challenger assembles a finalized, owned team of 1–6 creatures, **each matching the gym type** (with either type counting for dual-type creatures).
2. In the official Bitmon interface, the challenger **spends Digital Gold** to fund **one on-chain challenge commitment** binding the gym ID, immutable gym type, active defense-team hash/policy, verified challenger team, rules version and battle policy. Any Rare/Legendary participant must already be NFT-minted. An independent client may self-fund the same permissionless call. The commitment precedes future beacon randomness.
3. The challenge runs online. The committed challenger policy and registered defender policy choose actions only from already-known battle state; assigned future beacon rounds resolve security-relevant chance events.
4. On victory, the challenger generates one proof. The official UI spends **Digital Gold** on the **final on-chain proof transaction**, verifying commitment, future beacon rounds, rules, NFT/verified-inventory eligibility and defense snapshot before updating the leader and recording **on-chain fame**. Independent clients may self-fund the same public call.
5. On success, the challenger becomes leader. The winning team automatically becomes the new registered defense, any pending update from the previous leader is cancelled, and the gym type remains unchanged. A failed/abandoned challenge needs no final transaction.

### 11.5 Defense updates and front-running

A leader may update **only their defense team and its battle policy**, not the gym type or eligibility rules. For the MVP, a leader-initiated defense update is allowed at most **once per 24 hours** and activates after a fixed delay (**proposed: 1 hour**). A new defense must meet the permanent gym-type condition.

A leader who sees a winning challenge in the public mempool cannot instantly replace the defense to invalidate it: a pending update does not affect proofs judged against the currently active defense. A challenge must match the defense that is active **at submission time**. If a previously scheduled update has already activated before submission, a proof against the old defense will not work and must be recreated. Leadership transfers cancel pending updates from the previous leader.

### 11.6 Defense-team integrity

- Defending creatures are **trade-locked** while assigned, so the leader cannot trade away a creature on their active defense.
- A defense uses a **snapshot** of its creatures' levels, forms/types, and moves taken at registration; later training or evolution does not silently change it. A new snapshot requires a defense update that passes the gym-type check.
- If an exceptional ownership change invalidates the defense, the gym becomes challengeable against a predefined **same-type NPC fallback team**, rather than becoming unchallengeable.

### 11.7 Genesis leaders

At launch, every gym is held by an **NPC leader** with a published team that satisfies its permanent type restriction. NPC teams are not owned by any account and have no privileged mint. The first challenger to defeat the NPC becomes the first player leader. Gym types are distributed across the world at creation, not selected by the first player who takes control.

### 11.8 Competitive randomness model

Gym challenges use the **future-beacon** model with one pre-battle on-chain commitment and one post-win proof only on success. The official UI spends Digital Gold on both; alternate clients can self-fund these calls. The committed challenger battle policy/strategy may react deterministically to previously resolved battle state, but it cannot be rewritten after future randomness becomes known. The human gym leader does not need to be online because the registered defense policy is already fixed.

Friend PvP uses the same public-beacon randomness but does **not** need the gym's on-chain precommit pattern: the two live players mutually sign/commit each turn's actions before the assigned future beacon and can reject a peer who fails to reveal a matching action. This gives each participant a counterparty who timestamps the other's choice. Canonical rewards, rankings or other persistent consequences may still require a later proof/settlement transaction, but ordinary turn resolution stays off-chain.

Competitive battle latency, action timeouts, exact chance tables and how many chance events are derived from one beacon round remain balance/UX parameters. The security invariant is fixed: **no participant chooses or changes the action or policy input after learning the randomness that resolves it.**

### 11.9 Gym risks

- **Bots holding gyms.** Fame can be botted. Mitigation: fame is the only reward, level and XP are bound to each account's quota, and teams cannot be merged across accounts.
- **Win-trading with an alt.** A leader can lose to their own second account. No financial reward is attached, so this is accepted.
- **Type balance and coverage.** Some fixed types may be easier to assemble or defend than others. Ensure accessible Common-tier options for every assigned type and balance the roster and moves through global game design.
- **Defense-update timing.** A scheduled update may activate before a challenge is submitted; the proof must bind to the active snapshot. The fixed delay blocks reactive last-second changes.
- **Spam.** Failed attempts cost nothing on-chain, so there is no on-chain spam surface; successful challenges cost the challenger gas.

---

## 12. Architecture and trust boundaries

```text
                  PLAYER'S DEVICE
       +-----------------------------------+
       | Static PWA, local RPG engine       |
       | Local save / session event log     |
       | ZK prover (local or optional)      |
       | Wallet / signing client            |
       +-----------------+-----------------+
                         |
          reads public randomness / signs actions
                         |
             +-----------+-----------+
             | Distributed RNG       |
             | e.g., drand beacon    |
             +-----------+-----------+
                         |
        +----------------v-------------------+
        | EXISTING BLOCKCHAIN / ROLLUP       |
        | - trainer registration             |
        | - proof verification               |
        | - checkpoint roots and nonces      |
        | - rare encounter claims            |
        | - swap contract (restricted assets)|
        | - gym registry and leaders         |
        +----------------+-------------------+
                         ^
                         |
                self-pay OR sponsored
                         |
            +------------+-------------+
            | Independent gas sponsor  |
            | ads, fraud checks,       |
            | paymaster / fee payer    |
            +--------------------------+

       Optional: public RPCs, indexers, mirrors, IPFS,
                 encrypted backup services, proving services.
```

### Authority map

| Component | Can control canonical game rules/state? | Can withhold its own service? |
|---|---|---|
| Browser/PWA | No | Player can close it. |
| Randomness beacon | Provides entropy, not game mutations | Yes; requires outage policy. |
| Optional prover | No, if proof soundness and inputs are checked | Yes. |
| Indexer/RPC | No | Yes; clients must be able to switch. |
| Advertiser/sponsor | No | Yes; self-pay must remain possible. |
| Gym leader | Only their own type-eligible defense team and battle policy | Cannot change a gym's permanent type or add eligibility rules; cannot block challenges. |
| Game smart contracts | Yes, by published deterministic rules | Depends on underlying chain liveness. |
| Original developer | No privileged mint/update power after immutable deployment | Can stop updating the original frontend. |

This is **decentralized gameplay authority**, not proof that every dependency is decentralized. A base chain or rollup can have sequencer, governance, and data-availability trust assumptions.

---

## 13. Digital Gold — ad-funded official gym competition

### 13.1 Player-facing reward and separation

**Digital Gold** is a fictional, **off-chain, non-transferable, non-redeemable** credit earned **only from optional verified rewarded ads**. The official Bitmon interface accepts **exclusively Digital Gold** for official gym pre-battle challenges and successful post-battle proof/leadership claims. Local practice gym battles are free. The player receives no gas token or cryptocurrency; Digital Gold never enters a wallet as an asset.

A separate operator administers the Digital Gold ledger, verifies ad completion, funds eligible gym gas fees, and retains any advertising margin. This operator cannot mint, issue or transfer NFTs; control trainer registration, trading or canonical rules; override verifiers; choose battle outcomes; or hold player keys.

**Strict boundary:** registration, Rare/Legendary NFT minting and all NFT swaps/escrow are self-funded by players. Digital Gold cannot sponsor them. Friend PvP ownership verification also does not consume Digital Gold.

**Decentralization boundary:** "Digital Gold-only" describes the **official game's gym-payment UI**. Contracts remain permissionless and accept valid, self-funded gym commitment/victory calls from alternate clients. They must **never** check a Digital Gold balance or require the operator's approval. Otherwise the sponsor would become a centralized multiplayer gatekeeper.

### 13.2 Credit and transaction flow

1. Player voluntarily watches an eligible rewarded ad; the operator verifies its reward callback and credits a fixed number of Digital Gold units to a non-transferable off-chain balance. Do not assume exact per-impression revenue is known in real time.
2. Player submits an official gym challenge request or a successful victory-proof request. The client signs the exact game operation; the operator checks the balance and reserves the required credits.
3. Issue a **single-use** gym-only authorization bound to trainer, wallet, exact calldata hash, contract, chain ID, expiry, nonce and maximum gas; a paymaster or fee payer funds only that operation.
4. After confirmed settlement, consume the appropriate credits; failed/unsubmitted authorizations release reserved credits idempotently. No cryptocurrency is transferred to the player as an advertising reward.
5. If Digital Gold is insufficient or the provider is unavailable, the official UI cannot submit that official challenge; local practice continues, and an independent client can self-fund the public gym call.

Prevent fraudulent ads, duplicate callbacks, credit farming, replayed authorizations, and unlimited sponsor gas exposure. Credit reserves are future service liabilities. The provider must budget for reorgs, failures, variable proof costs, invalid traffic and ad revenue delays.

### 13.3 Google policy uncertainty

Google's rewarded-ad policies permit some non-transferable in-platform rewards, but **this precise blockchain fee-funded gym mechanic is not approved**. Do not state or imply that calling it Digital Gold, separating companies, not sending crypto to players, or excluding NFT mints automatically establishes compliance. Gym participants may include player-owned restricted NFTs; the distinction between NFT creation and indirect reward benefit still requires an authoritative ad-provider assessment.

Use opt-in rewarded inventory only; do not reward ordinary ad views/clicks. Meet applicable invalid-traffic, publisher/platform, privacy, consent/CMP, and child-protection rules. If the network declines, remove the ads/Digital Gold integration without altering gameplay rules or the self-funded contract route.

### 13.4 Economics and fallback

Start with a conservative target of **no more than 50% of realized eligible advertising proceeds allocated to Digital Gold gas capacity**; the remainder is a reserve for operating costs and margin, not guaranteed profit. Credits represent outstanding potential gas expenses. Never redeem credits for money, quote them as a stored dollar balance, or promise a fixed cash exchange rate.

```text
Contribution = realized eligible ad revenue
             - actual sponsored gym commitment/victory gas
             - ad verification and paymaster/relayer costs
             - proving, hosting, privacy/compliance and fraud expenses
             - credit reserve adjustments
```

Benchmark separately **gym pre-commit gas** and **ZK-verified victory gas**, as well as failure/retry behavior, before setting fixed Digital Gold prices. If ads fail commercially or contractually, the independent player-funded protocol and the complete local RPG still work.

---

## 14. Network selection: Arbitrum versus Solana

**Recommendation for prototyping:** favor an EVM L2 such as **Arbitrum** if a Solidity ZK verifier, ERC-4337 paymasters, and familiar token tooling accelerate delivery. This is provisional pending gas/proving benchmarks.

| Criterion | Arbitrum / EVM L2 | Solana |
|---|---|---|
| Contract implementation | Solidity/EVM | Rust/Anchor ecosystem |
| Paying gas for others | Paymaster/relay patterns | Native separate fee payer |
| Restricted-transfer assets | ERC-721 with transfer disabled except via swap contract | Non-transferable asset standards with controlled authority |
| ZK verifier | Established EVM patterns; proof cost varies | Possible, but needs verifier/program design |
| Fees | Benchmark proof verification, calldata, storage | Benchmark compute limits, storage rent, verifier feasibility |

Do not choose the chain solely on the price of a token transfer. Benchmark a **real proof settlement**, a rare claim, a trainer registration, a swap, and a gym challenge using production-sized payloads.

---

## 15. Security model and known limitations

### What the protocol should prevent

- Editing local storage to invent valid XP or creatures.
- Claiming a spawn for an unregistered/inactive trainer, from a guest save, from a pre-registration beacon round, or for an arbitrary slot index.
- Reusing an encounter slot after finalization.
- Forging the randomness beacon outcome.
- Registering a fresh trainer **after** a known round to pick its outcome.
- Claiming a rare encounter after the reservation deadline.
- Double-spending or duplicating a creature.
- Swapping across tiers, gifting, or swapping more than once per 24 hours.
- Carrying levels or training through a swap.
- Submitting incompatible, stale, or replayed progress checkpoints.
- Minting creatures through developer authority.
- Taking a gym with a proof against a defense state that was not active at submission, or using any creature that lacks the gym's immutable assigned type.

### What it does **not** inherently prevent

- Bots playing many accounts, or one account continuously.
- Many trainers per person, and the resulting growth in total high-tier supply.
- Off-chain payment for swaps or sale of whole accounts by key handoff.
- Fame farming of gyms by bots.
- A player reconstructing and proving older **ordinary** encounters.
- Favorable strategy selection after public randomness unless bound beforehand.
- Chain censorship, base-layer reorganization, or downtime.
- Loss of an unsynced local event log or private key.
- Offline search for perfect counters to deterministic gym defenses (Section 11.8).

### Critical invariants for test and audit

1. A trainer has at most one active canonical state lineage, **beginning at a registered genesis commitment before its eligible encounter rounds**.
2. Every rewarded epoch is eligible, unique, authenticated, after registration/finality/activation, and within budget; demo encounters can never settle.
3. Every time-limited rare claim was included by the deadline and matches its later proof.
4. New XP and inventory follow the deterministic rules exactly.
5. A creature has at most one canonical owner.
6. The only ownership change path is the swap contract (or time-locked control rotation); standard token transfers fail.
7. Every swap is same-tier, 1-for-1, atomic, and sets both levels to the lower of the two.
8. A trainer's swap count in any rolling 24 hours is at most one, and wallet rotation never resets it.
9. No path converts one tier into another.
10. A gym transition is valid only if the proof matches the active defense snapshot/hash at submission and every creature on both teams has the gym's permanent assigned type (including dual-type matches).
11. A gym's assigned type is immutable after creation; leadership transfers and defense-team updates cannot change it or introduce additional gym-specific eligibility restrictions.
12. A sponsor cannot change a game action, replay an authorization, or grant an invalid proof.
13. An invalid proof, malformed beacon round, or mismatched rules version always fails.
14. Any player with gas and a valid proof can progress without an advertising account.
15. Content distribution and contracts cannot silently replace the canonical rules with a developer-controlled mint path.

---

## 16. Product and technical implementation plan

### Phase 0 — Feasibility and adversarial design

**Goal:** Determine whether the core cryptography, trade rules, and optional sponsorship are viable before building a full game.

Deliverables:

- Formal state-transition model and threat model, including a **Sybil simulation** of the trade rules (many accounts, 1/day swaps, same-tier, level reset) to test whether any consolidation path remains.
- Quantitative spawn/XP/claim/swap policy and economic stress test.
- Prototype drand round verification and deterministic trainer spawn hashing.
- Test proof for a compact battle + capture transcript.
- Estimate phone proving time, memory, proof size, and chain verification gas.
- Demonstrate a rare claim deadline on a testnet.
- Obtain a direct policy assessment from a candidate advertising network.

**Decision gate:** If on-device proving is too expensive, adapt the engine or offer optional permissionless outsourced proving. If Google will not approve the incentive, drop that integration without changing the protocol.

### Phase 1 — Fun local single-player prototype

**Goal:** Build and balance the local RPG engine before integrating blockchain settlement; a separate guest demo can exercise it without verified progression.

Deliverables:

- Original starter creatures, zones, quests, inventory, and encounters.
- Deterministic combat, capture conditions, and XP curve.
- Local save with export/import and clear pending-state UI.
- Deterministic simulation test vectors across browser/VM platforms.

**Exit criterion:** Players can exercise the gameplay loop in a labeled local **demo** without a wallet, ads, or a server; no demo save is treated as a verified collection. Verified onboarding is introduced in Phase 2.

### Phase 2 — Verified progression prototype

**Goal:** Prove that modified clients cannot forge the finalized collection.

Deliverables:

- Permissionless **registration-first** onboarding, with genesis commitment and eligibility only for future beacon epochs after finality/safety buffer.
- Beacon-based epoch assignment and personalized spawn mapping; explicit tests rejecting every pre-registration/guest encounter, including attempted retroactive imports.
- ZK engine for a bounded set of encounters.
- On-chain verifier and accepted state roots/nonces.
- Expiring rare-encounter reservation transaction.
- Direct self-paid settlement on a public testnet.

**Exit criterion:** A new player registers before receiving verified encounters; independently reproduce and reject fraudulent proofs, retrospective/guest imports, replays, rerolls, and missed rare deadlines.

### Phase 3 — Swaps and gyms

**Goal:** Make the verified collection social without a central authority.

Deliverables:

- Restricted-transfer creature assets and the swap contract (same tier, level reset, 1/day).
- Gym registry with permanent assigned types, same-type NPC genesis leaders, type-checked challenge proofs, delayed defense-team updates, and defense trade-locks.
- Recovery, key rotation, and encrypted backup design.
- Optional prover services, alternate RPC/indexers, and mirrored PWA hosting.
- Testnet audit, stress testing, and an adversarial test for bypassing the swap rules.

**Exit criterion:** Two players using different frontends can independently verify, swap creatures, and take a gym from each other.

### Phase 4 — Independent sponsorship integration

**Goal:** Remove fee friction without turning the sponsor into a game authority.

Deliverables:

- Standard sponsorship request schema and paymaster/funder integration.
- Single-use signed allowances, per-user quotas, and abuse controls (including registration limits).
- At least one independent sponsor with a self-pay fallback.
- Advertising integration only after policy validation and privacy readiness.

**Exit criterion:** Sponsor shutdown or denial does not stop self-paid valid settlements.

### Phase 5 — Public ecosystem

**Goal:** Reduce operational dependence on the original team.

Deliverables:

- Source publication, reproducible builds, and protocol documentation.
- Permissionless frontend hosting and independent indexers.
- Third-party proving and sponsor implementations.
- Documented version migration, audits, and dispute-response playbooks.

**Exit criterion:** An unrelated third party can run a client and settle valid game state without developer permission.

---

## 17. Product success metrics

Track the game as a **game first**.

| Area | Metric |
|---|---|
| Engagement | 1-day / 7-day / 30-day retention, session completion, playtime satisfaction |
| Collection | Species discovered per trainer, progression milestones, capture diversity |
| Fairness | Forged-proof acceptance (target zero in tests), duplicate epoch claims rejected |
| Concentration | Share of top-tier creatures held by the top 1% of trainers; swaps per trainer per week; swap partner diversity |
| Farming signals | Registrations per funding source or sponsor; trainers that swap but never play |
| Gyms | Leader turnover time, distinct leaders per gym, defense-update frequency, available Common-tier creatures per gym type |
| Performance | Client FPS, proof latency and memory on mid-tier mobile, settlement confirmation time |
| Cost | Real gas per proof, claim, swap, registration, gym claim, plus prover costs |
| Decentralization | Ability to self-pay, use alternate RPC/host, verify independently, survive sponsor outages |
| Sponsor | Valid ad completion rate, realized revenue per action, invalid traffic rate, gross margin |
| Safety and trust | Lost-save incidents, key recovery success, audit findings, clear pending/final status |

Avoid using speculative trading volume as a success indicator. Do not build an in-game market.

---

## 18. Top risks and decisions still open

| Open issue | Why it matters | Proposed treatment |
|---|---|---|
| Mass-account farming | Registration is permissionless. | Tier wall, level reset, 1/day cap, fame-only rewards; simulate in Phase 0. |
| Swap-slot sales off-chain | Players may pay money for swaps. | Accept; the caps limit volume and profit. |
| Tier too coarse | Players swap toward the best species in each tier. | Balance within tiers; consider sub-tiers. |
| Swap cap too tight or too loose | Hurts casual play vs. enables consolidation. | Playtest; treat the cap as a tunable parameter. |
| Deterministic gyms are solvable | Outcome depends on search effort, not live play. | Option A for MVP; evaluate later options (Section 11.8). |
| Gym type imbalance | Some gym types may have too few accessible creatures or limited strategic variety. | Ensure Common-tier options for every assigned type and balance the roster globally. |
| Mempool front-running of gym claims | Leader could try to invalidate a challenger's proof by replacing the defense. | Delayed-activation defense-team updates; proof bound to the active snapshot. |
| Rare claim timing | Too-short deadlines punish human players or network outages. | Reserve promptly, capture afterward; tune the window. |
| Region hindsight | Public entropy enables post-hoc region choice. | Bind zone before reveal, or simplify. |
| State availability | A root proves validity but does not restore missing user data. | Portable logs and encrypted redundant storage. |
| ZK cost on phones | Local proofs may be slow. | Benchmark early; incremental proofs and optional outsourced proving. |
| Registration-first onboarding cost | Players need a confirmed transaction before verified encounters; a 24-hour delay would also harm the first session. | Minimal transaction, optional sponsor, first safely eligible future epoch instead of a fixed 24-hour wait, and a separate guest demo. |
| Registration spam and state bloat | Free accounts cost the chain storage. | Registration fee or bond; sponsor limits. |
| Google rewarded-ad eligibility | Fee sponsorship may conflict with reward conditions. | Get explicit confirmation; preserve self-pay and other sponsors. |
| Legal classification | Restricted-transfer game assets still need review. | Jurisdiction-specific legal review before commercial launch. |
| Blockchain dependency | An L2 may have sequencing or upgrade centralization. | Publish assumptions; support alternative access routes. |
| Contract exploit or upgrade | Immutable mistakes can be permanent; unrestricted upgrades undermine trust. | Audits, narrow permissions, governed migrations. |
| Intellectual property | Genre inspiration must not copy protected assets. | Original visual, audio, and textual content. |

---

## 19. Legal and publisher boundaries

**This is a product concept, not legal or advertising-policy advice.**

- A company can be commercially separate from the protocol, but corporate separation does **not** automatically make it uninvolved or immune from responsibility.
- Publishing contracts and PWA personally instead of through a company does not remove consumer, tax, IP, data-protection, or other legal duties.
- Ad networks impose responsibilities on the party operating the advertising inventory, including valid impressions, consent and privacy, and reward delivery.
- A static PWA and blockchain do not automatically satisfy GDPR, consumer protection, youth protection, or advertising consent obligations.
- Version 2.0 removes free transferability and in-protocol sales, which may reduce exposure compared with a tradable NFT collection. That is **not** an exemption: classification under frameworks such as EU MiCA depends on substance, and counsel should review the final design.
- Gyms and swaps carry no financial prizes by design. If any monetary reward, fee, or marketplace is added later, reassess before launch.
- Present creatures as game assets, not financial investments.

The most robust business separation is **functional**: the sponsor has no governance, minting, verifier, or user-asset authority; the game never requires it; all interactions with the sponsor are optional.

---

## 20. Key product decisions to lock next

1. **Swap economics:** exact tier definitions, whether sub-tiers are needed, and whether to add a post-swap lock.
2. **Level-reset details:** which properties reset, which stay bound, and which are fixed innate traits.
3. **Registration onboarding:** exact safe activation epoch/finality buffer, minimum self-pay cost, whether to provide a sponsor at launch, and whether the optional guest demo is worth maintaining. Registration **before verified play** and non-retroactivity are now fixed design decisions.
4. **Randomness / epoch schedule:** fixed global rounds versus account-relative opportunities, plus outage behavior.
5. **Region selection:** how to bind zone before the spawn seed is known.
6. **Rare-reservation policy:** which tiers require prompt claims and the deadline.
7. **Gym design:** permanent type assignment per gym, available Common-tier creatures for each type, defense-policy format, team-update cooldown, and the Section 11.8 option.
8. **Combat complexity:** keep initial deterministic mechanics ZK-efficient.
9. **State representation:** inventory Merkle structure, swap escrow mechanics, checkpoint lineage.
10. **Proof toolchain:** select and benchmark a circuit/zkVM and verifier on candidate networks.
11. **Sponsorship:** build self-pay first; ask Google or alternatives to review the full reward mechanism.
12. **Governance:** immutable game version or a transparent, narrow migration process.
13. **Legal boundaries:** confirm requirements for a separate sponsor business and a community-run game.

---

## 21. Preliminary reference links (reviewed 2 November 2026)

External references for feasibility and policy checks, not endorsements.

### Advertising and sponsorship

- [Google Ad Manager — policies for ad units that offer rewards](https://support.google.com/admanager/answer/7496282)
- [Google Ad Manager — rewarded ads for web](https://support.google.com/admanager/answer/9116812)
- [Google AdSense — invalid traffic and publisher responsibilities](https://support.google.com/adsense/answer/2660562)
- [Google AdSense — site ownership verification](https://support.google.com/adsense/answer/91205)
- [Google Ad Manager — EEA/UK/Swiss consent requirements](https://support.google.com/admanager/answer/13554020)
- [ERC-4337 Paymasters](https://docs.erc4337.io/paymasters/index.html)
- [Solana — fee abstraction](https://solana.com/docs/payments/send-payments/payment-processing/fee-abstraction)

### Core protocol

- [drand — developer guide](https://docs.drand.love/developer/)
- [drand — protocol specification](https://docs.drand.love/docs/specification/)
- [Solana fees](https://solana.com/docs/core/fees)

### Regulatory context

- [European supervisory authorities — MiCA crypto-assets factsheet](https://www.esma.europa.eu/sites/default/files/2025-10/Joint_ESAs_Factsheet_on_crypto-assets.pdf)
- [Google Ads — cryptocurrencies and related products](https://support.google.com/adspolicy/answer/14009787)

---

## Final vision statement

**bitmon is a permissionlessly registered, locally played game whose verified collection cannot be fabricated by modifying a client, and whose rules make farming pointless instead of trying to police who is human.** Its core innovation is a verifiable single-player progression protocol with personalized public randomness, limited time-based opportunities, deterministic capture, same-tier creature swaps, and player-led gyms where the reward is fame.

Independent companies may build businesses around the protocol—gas sponsorship, wallet tools, gym explorers, proving services, or game portals—without becoming owners of the rules. The original developer can stop operating, and the game can still exist as software, smart contracts, and a collection of independently verifiable player states.

The first milestone is **not** launching a marketplace or signing up with Google. It is proving that the cheapest honest player journey works: **register a trainer before any verified encounter**, obtain a fair rare spawn, claim it before expiration, capture it with valid actions, generate one proof, finalize the creature with a self-paid transaction, swap it for a same-tier creature, and take a gym. Everything else builds on that core.