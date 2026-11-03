# bitmon — Decentralized Creature-Collection RPG

**Companion technical design to the bitmon product requirements**

**Geographic world contract:** The [bitmon Product Requirements](PRODUCT_REQUIREMENTS.md) are authoritative for world geometry and visual rendering. **OpenFreeMap is the sole geographic source**; MapLibre renders the tiles; no new real-world building or road geometry may be invented. Mapped building facades and windows may use deterministic art inferred only from OpenFreeMap's available fields and context. Implementation and decision status is tracked separately in the [Development Tracker](DEVELOPMENT_TRACKER.md).

**Status:** Concept / architecture proposal, not a security-audited specification
**Version:** 3.3 (E0 settings persistence, decoded-tile collision safety and map-cache simplification; protocol unchanged)
**Date:** 2 November 2026
**Project name:** **bitmon** (game and creature name; original characters and artwork required)

> **The vision in one sentence:** Build a browser-first, single-player creature-collection RPG whose progression and creatures are cryptographically verifiable, whose rare encounters are fairly and independently determined, whose trading rules make farming pointless, and whose network features (trading, player-led gyms) remain accessible without trusting or paying the original game developer.

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

Verified adventures begin with a one-time on-chain trainer registration; **the gameplay itself then runs mostly locally** in a progressive web app (PWA). The client can be modified, but cannot create valid progress merely by editing JavaScript, storage, or save files. An independently verifiable game ruleset, a distributed randomness beacon, and zero-knowledge (ZK) progression proofs establish which changes to a trainer's creature collection are legitimate. An existing blockchain records finalized state and ownership.

The game is **not** a single, synchronized MMO. Every trainer has a personal adventure and personal random encounters. The shared world consists of interoperable rules, authenticated progression checkpoints, restricted creature swaps, and **player-led gyms**. There is no global quota of legendary dragons: two trainers can each legitimately discover the same species.

A previously registered, active trainer receives bounded encounter opportunities tied to verifiable time epochs. The randomness beacon publishes a globally shared value; hashing it with each trainer's **already-registered, fixed ID** yields different encounters for Alice and Bob. Rare encounters require a promptly recorded, expiring on-chain claim. Catching a creature is deterministic once it appears and the battle state meets the rules.

**There is no proof-of-personhood requirement.** Anyone can register as many trainers as they like. The game therefore does not try to stop mass account creation. It makes mass account creation **not worth it**:

1. Creatures can only be swapped one-for-one within the same rarity tier, so rarity cannot be funneled into one account.
2. A swap resets both creatures to the lower of their two levels, so training effort cannot be transferred.
3. Each trainer can make at most one swap per day, so no account can absorb a flood of trades.
4. Tiers cannot be converted into each other (no fusion, breeding, or release-for-rarity).
5. Competitive play (gyms) pays only in fame, so there is no financial prize to farm for.

Players may finalize state by paying network fees themselves. A separately operated, optional **gas sponsorship provider** may fund eligible transactions. That provider could finance itself with advertising and keep a commercial margin; it must not be necessary for gameplay, have authority over creature issuance, or hold players' keys. **Google-specific rewarded-ad sponsorship is an unapproved business hypothesis, not a confirmed policy-compliant integration.**

**The non-negotiable principle:** The game must remain playable, verifiable, and settleable if the developer, the sponsor, an indexer, or the original website disappears. Practical implementations still depend on the underlying blockchain and a verifiable randomness network.

---

## 2. Problem and opportunity

### 2.1 The problem

Traditional offline RPG saves are controlled by the player. A modified client can fabricate XP, inventory, rare creatures, or victories. This is harmless in purely single-player play, but becomes unfair when collections are traded or used in PvP.

A traditional solution is a centralized, authoritative online server. That makes the game dependent on one operator, its database, business continuity, and moderation decisions.

Putting every in-game action on a blockchain would be slow and costly. A different solution is needed: **local execution plus verifiable, intermittent settlement**.

A second problem appears as soon as trading exists: a farmer can create thousands of accounts, harvest creatures and levels, and funnel everything into one account. Version 1.0 answered this with identity checks. Version 2.0 answers it by designing the trade rules so that funneling does not work.

### 2.2 The opportunity

Offer one canonical verified adventure with an optional practice/demo path:

1. **Optional wallet-free guest/demo:** Try exploration, tutorials, and locally generated practice encounters. Guest encounters, creatures, and XP **cannot later be imported into or backdated as** verified progress.
2. **Verified adventure (canonical):** Register a trainer **before the first verifiable encounter**, then generate authentic encounter slots and progression proofs while mostly playing locally. Registration needs a valid on-chain transaction; players may self-pay or use a sponsor when available.
3. **Social layer:** Use the same verified trainer to swap creatures under fair rules and challenge **player-led gyms** where the reigning leader's own team defends.

The value of a collection derives from the game itself: accomplishment, completion, fame, and personal interest—not a promise of financial returns.

### 2.3 Original intellectual property

The product should use original creature designs, maps, text, music, names, and branding. It can adopt general genre mechanics without copying protected Pokémon assets or implying official affiliation.

---

## 3. Product principles

| Principle | Product consequence |
|---|---|
| Local-first | Exploration, UI, animations, and most battles run in the browser. |
| Verify rules, not clients | Modified clients are permitted; invalid state transitions are rejected. |
| Explicit entry boundary | The optional guest/demo needs no wallet or fee; the **verified adventure requires on-chain trainer registration first**. Gas may be self-paid or optionally sponsored. |
| Self-custody | Players authorize settlements and retain ownership of finalized creatures. |
| Replaceable infrastructure | RPCs, websites, indexers, proof services, and sponsor services have alternatives. |
| Economical settlement | No per-step or per-wild-battle blockchain transaction. |
| Personalized rarity | Shared public entropy, distinct per-trainer encounter outcomes. |
| **Worthless to farm** | Trading rules, bound XP, and fame-only rewards make mass accounts unprofitable rather than impossible. |
| Transparent scarcity | No undisclosed developer minting and no manipulated rare spawn odds. |
| Sponsor independence | An advertising company is commercially and technically separate from the game's rules. |
| Honest limits | No claim that ZK proves human playtime or that bots are prevented. |

### Non-goals for the first release

- A continuously synchronized multiplayer overworld or fully autonomous browser-node blockchain.
- Mining, a speculative game token, staking rewards, or a developer-run token sale.
- An on-chain transaction for every movement, turn, or wild encounter.
- Prevention of bots or multiple accounts per person.
- A marketplace, price discovery, or any in-protocol sale of creatures.
- Financial prizes for PvP or gym ownership.
- Advertising as a mandatory prerequisite for registering, saving, or playing; direct self-payment remains supported.

---

## 4. Core player experience

### 4.1 First launch and local play

At first launch, the player chooses **Start Verified Adventure** or **Try Guest Demo**. The main, canonical game starts with trainer registration (Section 4.2); it does not create verifiable encounters for an unregistered identity.

The player chooses a starter during registration and then explores handcrafted zones, completes quests, encounters creatures, and plays deterministic turn-based combat **locally**. The browser stores its event log and pending progress; it does not submit a transaction for every movement or ordinary encounter. The starting region and initial starter/state must be anchored by the registration/genesis rules so they cannot be chosen retroactively after a randomness reveal.

**Guest demo (optional):** A wallet-free player can try the tutorial, exploration, and non-canonical practice battles with locally generated randomness. Guest-mode captures, levels, and XP have no authenticated trainer lineage and **never transfer or convert into verified assets**. If the player later registers, the verified adventure starts with a fresh canonical genesis state, not a backfilled guest save. The game must label this boundary clearly.

The PWA should explicitly indicate **guest / local pending / committed / finalized** states, to avoid implying that unsent or guest progress is globally recognized.

### 4.2 Registering a trainer before the first verified encounter

Verified onboarding is part of starting the adventure, not a later upgrade:

1. Generate or connect a **self-custodial trainer key/wallet**. Avoid making a centralized login, sponsor, or operator account mandatory.
2. Choose the initial starter and region under published genesis rules; prepare an **on-chain registration transaction** that fixes the immutable, game-specific trainer ID and initial state/region commitment before the relevant beacon output exists.
3. Submit that registration transaction, paying the gas directly or using an optional independent sponsor if available. If neither gas nor sponsorship is available, the user can enter the separate guest demo, **but cannot begin verified acquisition**.
4. Once registration is **finalized**, wait only until the **first future eligible encounter epoch** after a protocol-defined confirmation/finality safety margin. A previous proposal used 24 hours; that duration is **not inherently needed** to prevent using a known randomness round, because eligibility is already restricted to future rounds. Benchmark the safe buffer on the chosen chain and beacon before locking it.
5. Begin receiving personalized, time-limited encounter opportunities. The player uses beacon data and their fixed trainer ID to compute rolls locally; the proving circuit authenticates the inputs on settlement.

Registration is permissionless and may also have a modest registration fee or bond (Section 10.6). **Control of a trainer can be rotated to a new wallet** for key-loss recovery, but rotation is time-locked (proposed: 7 days), retains the immutable trainer ID, and does not reset any quota, cooldown, or lock.

**Non-retroactivity invariant:** The protocol must reject an encounter whose randomness round is not strictly after the trainer's accepted registration/activation boundary. Merely generating a key locally without a prior verifiable commitment is not enough: otherwise a player could test many IDs against already published beacon outputs and register only a favorable one.

### 4.3 A typical verified session

- Open the app and retrieve the next authenticated encounter seed.
- The fixed trainer ID and epoch determine the encounter rarity.
- Play the battle locally; capture is deterministic according to HP, status, abilities, and consumable resources.
- Ordinary XP and creatures remain pending until a later settlement proof.
- If an encounter is rare/legendary, submit a small on-chain commitment **before its deadline**, complete the battle later, and prove it.
- When ready to swap, challenge a gym, or simply secure progress, generate a ZK proof and submit a settlement transaction.
- Choose direct gas payment or an independent sponsor if available.

### 4.4 Swapping and gyms

Swapping requires both sides' creatures to be finalized and unlocked, of the same tier, and each trainer to have an unused daily swap (Section 10). Gym challenges use a finalized team in which every creature has the gym's permanent assigned type, including creatures with that type as one of two types (Section 11). No sponsor can determine who wins, which creature spawns, or what XP a valid battle grants.

---

## 5. Gameplay systems and balancing assumptions

**Values below are design placeholders, not final balance decisions.**

| Parameter | Initial hypothesis | Rationale |
|---|---:|---|
| Encounter opportunity spacing | One per 5 minutes | Rate-limits farming on one trainer. |
| Daily encounter budget | 96 in a rolling 24-hour window | About 8 hours of five-minute opportunities. |
| Daily XP budget | Level- or region-adjusted cap | Restricts progression beyond intended pace. |
| Unused encounters | Expire rather than accumulate | Prevents storing months of farming opportunities. |
| Rare-encounter claim window | ~5–10 minutes from slot availability | Blocks claims hours after a known spawn. |
| Trainer registration activation | First future eligible epoch after finalized registration and a chain/beacon safety buffer (duration TBD) | Ensures the ID is fixed **before** the corresponding public draw, without an arbitrary day-long first-play delay. |
| Capture mechanic | Deterministic | Eliminates repeatable public catch-roll attacks. |
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

No player-specific randomness transaction is necessary. Players fetch published rounds from interchangeable endpoints, while the proving circuit authenticates them. A drand BN254-compatible beacon is a candidate for EVM verification; prover and on-chain performance must be benchmarked.

Network outages need predefined handling: suspend affected slots, shift deadlines deterministically, or apply a transparent fallback protocol. Never let a central developer choose substitute values after seeing player outcomes.

---

## 7. Deterministic combat and capture

**World and camera presentation (Task 002 / DEC-019, DEC-021):** The **first prototype is exploration-only**: original male eight-direction animated trainer, floating mid-screen gesture joystick, and a **fixed-pitch, player-zoomable, heading-following camera** over MapLibre's unchanged OpenFreeMap geometry. Later battles remain in the **same 2.5D world scene**, zoom/reframe toward the encountered bitmon, restore the captured pre-battle bearing/pitch/zoom/follow state, and then resume heading-following mode. Camera rotation is **presentation only**: it never rotates true geographic player coordinates, modifies mapped geometry, or affects encounter validity and battle rules.

**PWA channel architecture (DEC-022; 2026-11-02):** `main` is the only source of stable application code. `preview` contains reviewed experimental work; after a **successful** `push` CI run on that trusted branch, a `workflow_run` executes on the default branch `main`, satisfies its protected `github-pages` environment, checks out the successful preview commit SHA and `main`, independently builds each with Vite's relative asset paths, and publishes a **single** GitHub Pages artifact with root Stable and `preview/` experimental. Rebuild the stable artifact from `main` on preview-only updates: never substitute `preview` compiled assets into the stable root. A `main` push also updates both; pull requests and failed CI runs do not deploy. A one-time **infrastructure-only reviewed release** is needed to bootstrap this main-branch workflow without promoting untested gameplay.

**PWA isolation and update lifecycle (DEC-029):** the Preview manifest remains scoped to its own subpath and receives a distinct visible name/title/theme/icon at **build time**. **Manifest `id: "."` was not distinct:** the `id` URL is resolved relative to the **start URL's origin**, so both relative dots identify the origin root. Keep Stable's original ID for existing installations; set Preview to explicit `id: "/bitmon/preview/"`, `start_url: "./?channel=preview"`, and `scope: "./"` during the trusted Pages build. Preview uses a large purple preview-specific icon and distinct name; Stable keeps its existing teal icon. Verify the browser's computed app ID on a real device. Each service worker uses a scope-derived cache key and cleans only its own CacheStorage entries; the stable root worker skips preview requests. Both apps share a web origin, so future localStorage/IndexedDB game data must be explicitly namespaced. No second repository, PAT, custom domain or remote hosting provider is introduced. The Pages output contains compiled app files only, not source or Git history. npm lockfile v3 is committed and both build workflows use `npm ci` to reproduce dependency resolution. After each Vite production build, a Node-only build step hashes the emitted HTML/manifest/icons/trainer atlas and hashed JS/CSS assets, replacing a service-worker build revision token; changes to compiled gameplay then produce changed SW bytes without manual cache-version increments. The SW pre-caches only the app shell, uses network-first requests with offline shell fallback, and deletes only cache entries for its own scope. On updates it remains waiting until the controlled client displays an update notice and the player explicitly taps Reload; the client sends `SKIP_WAITING`, then reloads on `controllerchange`. Checking for updates when an app returns to the foreground avoids frequent background polling. The initial install may activate normally. Uncached OpenFreeMap tiles remain network-dependent. The `pages.yml` workflow always runs from `main`: its `npm ci` change is not operational until separately promoted to `main`.

**Installed-PWA storage durability (DEC-031; 2026-11-03):** The existing IndexedDB tile PBF bytes, lightweight metadata and per-channel localStorage avatar position are retained without duplication. At PWA registration, detect an installed standalone launch with CSS `(display-mode: standalone)` or iOS `navigator.standalone`. Only from an installed launch, call `navigator.storage.persisted()` and, if not granted, `navigator.storage.persist()`; expose the result or unsupported state in Settings and offer a manual retry if denied or failed. Ordinary browser tabs do not request protection. Persistence may be granted or declined by browser heuristics, and manual deletion of app/site data remains possible.

**Storage-scope limitation:** Web platform storage persistence and quotas are for the **origin**, not the installed PWA manifest identity or individual IndexedDB database. Both GitHub Pages channels use `https://s3ton.github.io`, so the permission and quota can apply to other pages on that same origin despite requesting it only from the installed bitmon app. Separate namespaced IndexedDB databases (`bitmon-map-preview`, `bitmon-map-stable`), `bitmon:...:position:v1` keys, and service-worker caches avoid logical cross-channel overwrites, but **cannot guarantee exclusive storage or exclusive permission for the PWA**. This would require a distinct origin/hosting arrangement if required later. No new storage format, backup service or duplicate tile representation is introduced.

**Coordinate travel and offline world cache (DEC-030; 2026-11-03):** E0 offers a *prototype-only* coordinate jump in the camera/settings menu. Parse a single input as **latitude, longitude**, validate finite bounds (latitude within ±85°, longitude within ±180°) and never interpret it as physical GPS. Probe the destination's OpenFreeMap vector tile either from local storage or via the public endpoint; move the map provisionally, wait for MapLibre to report loaded source tiles, refresh source building/water footprints, and only commit the avatar marker and save if the landing position is walkable. On any failure, restore the original map center, cached collision state and player coordinate. This debug/exploration convenience creates no verified travel proof, and must not be used to claim encounter-region eligibility.

The OpenFreeMap vector-tile source uses a MapLibre custom protocol backed by **origin-local IndexedDB**; it loads actual vector PBF bytes without generating synthetic geography. MapLibre overzooms tiles beyond OpenFreeMap zoom 14, so one z14 tile key also guards higher-zoom movement. A successful live request persists the tile in a separate **Preview or Stable** IndexedDB; revisiting tiles returns stored bytes, including offline. There is **no background region prefetch** or bulk offline download. A tile is downloaded only when MapLibre renders it or the player explicitly requests a coordinate jump. No bulk offline download is implemented. OpenFreeMap separately limits explicit offline-area downloads (3,000 tiles or 50 MB per download, at most four concurrent requests, identifying User-Agent); a future prefetch workflow requires a separate terms-compliance review because browser scripts cannot customize User-Agent. The 100 MiB per-channel budget is measured in stored PBF ArrayBuffer bytes, not IndexedDB bookkeeping, browser HTTP cache, or the service worker's shell. When adding a tile would exceed it, transactionally delete cached entries in descending great-circle distance from the current player, never deleting the tile containing the player solely to save a remote tile. If the browser has a smaller quota or disabled IndexedDB, online streaming can continue, but new tiles may not persist. The browser/OS can still evict all site data. An offline attempt to walk or jump outside already available source tile data stops at the boundary; ordinary building/water collision and map attribution are unchanged. Map data can become stale until a cached tile is evicted; consistent map revision pinning is deferred.

Each channel's last accepted WGS84 position is separately saved in localStorage (bitmon:preview:position:v1 or bitmon:stable:position:v1), throttled during movement and flushed on page hide, with save on successful initial spawn and teleport. Read it at startup before initializing the map/camera; reject corrupt or out-of-range coordinates. Local saves are convenience state for the exploration prototype, **not authoritative or cryptographically verified progression**. Manual phone acceptance must cover offline restart, tile-edge stopping, teleport rejection/rollback, cache eviction under constrained storage and independent Stable/Preview saves.

**Simplified settings and source-cache architecture (DEC-032; 2026-11-03):** All player-adjustable native form controls that are actual preferences opt in with `data-setting="key"`. The single `src/settings.ts` initialization restores checked/select/range/text values from a channel-prefixed `bitmon:{preview|stable}:settings:v1` JSON record **before the map is constructed**. Changes persist on each control's native `change` event. It verifies select options and numeric bounds, ignores corrupt storage, and writes only the currently mounted marked controls (discarding obsolete settings). Camera responsiveness and the on-screen zoom slider use this mechanism; new preferences must add `data-setting` rather than introducing ad-hoc persistence. Destination coordinate input and transient progress/status controls remain unsaved. Position remains a separate progression key, while geographic PBF caching remains IndexedDB only.

MapLibre `querySourceFeatures` can duplicate clipped source features across tile boundaries and returns only currently loaded vector geometry. The collision snapshot refresh now requires the actual canonical z/x/y tiles covering the player's near-foot sample ring to have emitted successfully decoded source-tile events; a downloaded/stored PBF by itself does not count as decoded. If neighboring tile decoding is incomplete, retain the previous verified collision snapshot and block movement to undecoded tile locations, without freezing the player for missing tiles elsewhere in the viewport. Remove **exact duplicate** building/water polygons of the same height, retaining overlapping buildings with different heights and distinct clipped fragments along tile boundaries; never deduplicate solely by feature ID. This is a source-safety guard, not a full navigation/entrance model.

The cache keeps one network/IndexedDB read in flight per z/x/y and makes each caller its own transferable ArrayBuffer view so MapLibre worker transfers cannot detach the buffer being persisted. Raw PBF writes are queued without blocking map rendering; only one persisted copy is stored. MapLibre's decoded tile list is the only movement-readiness authority; the former long-lived cache-side list of downloaded tile keys has been deleted. Pending write buffers may temporarily exist in memory, and an unfinished write at sudden shutdown is not yet durable. IndexedDB metadata stores only key and byte size (the geographic center derives from z/x/y); old metadata fields remain readable until eviction. Scoped PWA shell caches serve already cached non-navigation assets before network requests, while navigations remain network-first to detect new app releases. The CI and production build run TypeScript checks **once**, as `npm run build` already includes `tsc --noEmit` followed by Vite and service-worker stamping. On current Pages hosting the deployed `pages.yml` is taken from `main`, so it will retain its previous redundant check until a separately approved main promotion.

**E0 design/implementation contract (2026-11-02):**

- **Movement state:** player position is true WGS84 longitude/latitude, restored from per-channel local save when available; full input deflection moves **10 m/s**, integrated with elapsed time, clamped background-frame delta and normalized diagonals. Short local moves use a spherical Earth approximation. A MapLibre geographic marker anchors the sprite and shadow to the actual location, not to a decorative screen pixel.
- **Camera/input separation and soft-follow:** at the start of each gesture/key sequence, snapshot camera bearing as the geographic direction-input basis and keep it fixed for the sequence; the camera must not steer the geographic direction input as it rotates. Follow the **actual accepted displacement** immediately with the map center. Camera yaw begins only after the same accepted travel heading persists for a preset delay, with heading-change reset above 12° and dead-zone suppression for bearing errors of 12° or less. Ignore backward or backward-diagonal input at ≥135° from the captured input basis, so reverse movement never triggers a camera flip. When eligible, rotate along shortest-angle delta with `delta * (1 - exp(-dt / dampingSeconds))`, capped at `maxDegreesPerSecond * dt`. Balanced default: 0.4 s delay, 60°/s cap, 0.8 s damping; Relaxed: 0.7 s, 35°/s, 1.2 s; Responsive: 0.15 s, 100°/s, 0.45 s. Stop camera motion immediately when the avatar stops/blocks, without post-idle coasting. Presets are session-local: an accessible 44 px hamburger disclosure in the portrait top-right reveals a camera responsiveness select; native disclosure/summary provides keyboard/touch toggle, and the panel closes after preset selection. The full settings element is excluded from joystick pointer capture. Keep the zoom slider exposed on-map rather than nesting it in settings. Exploration pitch defaults to **45°**, with an automatic, bounded source-driven occlusion override down to 0°; right-side zoom remains **15.5–20** (default **16.4**, step **0.1**). Map drag/pinch rotation/tilt remain disabled. For a source building intersecting a horizontal ray from trainer to camera (opposite bearing), compute entry distance to its actual polygon edges in WGS84-to-meter coordinates and compare its OpenFreeMap `render_height` (same 14 m fallback as extrusion) to the ray clearance at pitch. Choose the highest safe pitch below 45° with a 1 m safety margin. Recompute at most 10 times/second using cached tile polygons; ease pitch faster when clearing occlusion, slower returning to 45°. Keep DOM marker hidden while the camera is still above the clearance pitch, because DOM markers otherwise appear over WebGL extrusions. Continue camera pitch animation while idle, without changing world collisions or camera yaw.
- **Avatar facing and scale:** geographic heading relative to current MapLibre bearing is quantized to **eight 45° sectors**. A reusable original SVG atlas contains **eight directional rows × five frames** (one idle, four walking each); diagonal rows derive from tilted/mirrored front/back artwork pending visual review. CSS background-position swaps frames without rebuilding SVG DOM. The sprite is based on a nominal **1.8 m** geographic projection with an **8 CSS px** readability floor, then both displayed dimensions are multiplied by **2** (yielding a 16 px minimum). This intentionally exaggerates only visual sprite size; the geographic position and collision probes remain unchanged. The feet remain on one geographic MapLibre marker anchor. Recompute the pixel dimensions when the camera's zoom changes to preserve relative ground scale and the readability minimum.
- **Minimal source collision and spawn:** cache WGS84 building/water source polygons around the player and test true geographic coordinates including a foot margin. On first loaded tiles, relocate an obstructed initial coordinate to the nearest clear point on OpenFreeMap transportation line geometry; if none exists, search nearby unblocked positions. Never invent a road or entrance. Permit movement inside a bounded already-checked geographic cache despite transient source tile loading, refreshing on source readiness before crossing the checked radius. Halt at unknown geometry; this is not a complete pedestrian access model.
- **Floating gesture control:** pointerdown on the portrait app within screen-height fraction **[0.1, 0.9]** displays a joystick centered on the start location; upper/lower 10% are excluded. UI inputs (notably the side zoom slider) are excluded from avatar control capture. Interpret both touch and keyboard Y as positive downward and use `atan2(x, -y)` relative to the camera bearing captured at control start: upward means screen-forward, downward screen-backward. The old touch-only `atan2(x, y)` branch was inverted. The camera can slowly rotate toward sustained non-backward travel (with the captured input basis unchanged); optional WASD/arrow input shares the same mapping. Subsequent captured pointer displacement supplies direction and analog magnitude independent of camera bearing during that gesture. Pointerup/cancel, blur, hide and landscape immediately remove the joystick and set idle. Keyboard debugging reuses the same world-motion path. Avoid idle animation frames unless camera easing remains active.
- **Later architecture:** entrance/access rights, navigation graphs, canonical/verified travel (separate from the E0 coordinate jump), GPS, verified movement/encounter region commitments, and battle-camera transition implementation are deferred. Prototype geographic movement is not a cryptographic locality proof.

### 7.1 Battles

The authoritative rules engine computes damage, defense, abilities, status effects, XP, healing, and consumable usage. The browser runs the same deterministic logic for immediate feedback. Settlement uses the exact, versioned rules engine rather than trusting a client claim of victory.

For the first release, minimize random events **within** combat. Random critical hits, stochastic drops, and probabilistic attacks would reintroduce the need for decisions committed before future randomness is revealed.

### 7.2 Capturing

After a spawn has been assigned, capture uses publicly specified deterministic conditions, for example:

- Wild creature's HP is below a species-dependent threshold.
- The player's party meets battle requirements.
- The capture item is available and consumed.
- Optional status, skill, and equipment requirements are satisfied.

This permits rare **encounters** without random **catch** rolls and makes complete sessions practical to prove in batches.

### 7.3 Rare-encounter claims and deadlines

A valuable encounter receives a short-lived **claim opportunity**. The cheapest humane variant is to require a transaction promptly **reserving the rare encounter**, not proving a completed multi-minute battle in the same window.

| Time | Event |
|---|---|
| 10:00 | Beacon reveals epoch 1,234. Trainer's fixed roll produces a rare dragon. |
| 10:04 | Trainer sends an on-chain commitment to this slot, trainer ID, rules version, and starting-state context. |
| 10:10 | New reservations for epoch 1,234 close. |
| Later | Player completes the deterministic encounter and proves the full state transition. |
| Later | Contract verifies the claim, proof, state lineage, and absence of replay. |
| 23:00 | A new claim for the 10:00 rare encounter is rejected as expired. |

A commitment alone **does not prove capture** or active play. It prevents late creation of a claim; only a later valid proof establishes capture. Commitments should be bound to the trainer, encounter, prior state lineage, protocol version, and nonce, with clear rules for multiple pending claims. An invalid or abandoned claim must not mint a creature.

### 7.4 Ordinary encounters

Common encounters, ordinary XP, and non-rare captures need no prompt claim for the MVP. Their results can be proven later, within enforced encounter and daily budgets. A player might therefore reconstruct old ordinary slots and simulate legal play afterward. **That remains permitted within the declared security model.**

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

Ordinary progress stays pending and local until the player wants to secure it, swap, or challenge a gym. One proof can validate many encounters.

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

## 9. Creature ownership

Creatures are **verifiable game assets with restricted transfer**, not freely tradable collectibles.

### Requirements

- Each trainer has an authenticated creature inventory commitment.
- Proof verification establishes species, tier, innate traits, capture lineage, XP, and ownership changes.
- A creature has exactly one canonical owner at any time.
- A creature may be represented as an ERC-721-style token for wallet display and provenance, **but the standard `transfer` and `approve` paths are disabled**. The only way to change owner is the game's swap contract (Section 10) or a documented, time-locked trainer-control rotation.
- Creatures exported into escrow for a swap are locked in the same step that imports their replacements, so there is no double ownership.
- Creatures assigned to a gym defense team are **trade-locked** while assigned (Section 11).
- Metadata derives from authenticated on-chain data and content-addressed assets, not operator-editable JSON.

**Why transfer must be restricted:** if a creature were a standard transferable NFT, anyone could gift or sell it outside the swap contract, and every anti-consolidation rule below would be bypassed. A free-transfer wrapper token must therefore not exist, and third-party marketplaces cannot list these assets natively.

**No global cap on every species:** rarity is personal and probabilistic. The goal is fair acquisition under fixed rules, not artificial universal scarcity.

---

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

Because verified play now begins with registration, **onboarding cost and availability are core UX constraints**, not an optional upgrade cost. Unlimited free registration creates state bloat and invites cheap spam. Options to evaluate: a small non-refundable fee scaled to storage cost, or a refundable bond released after a period. Either should be modest, and the game must honestly disclose the self-pay requirement unless a sponsor is available. Gas sponsors need their own abuse limits, because paying for unlimited registrations removes even the gas cost.

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
2. The challenger fights the leader's published defense **locally** using the deterministic engine. The defending team must pass the same type check. Failed attempts need no transaction.
3. On a win, the challenger generates a proof of the battle result. It is bound to the **gym ID, immutable gym type, active defense-team hash**, and the challenger's team.
4. The contract verifies the proof against the gym defense state **active at submission time**, including type eligibility for every creature on both sides.
5. On success, the challenger becomes leader. The winning team automatically becomes the new registered defense, any pending update from the previous leader is cancelled, and the gym type remains unchanged.

### 11.5 Defense updates and front-running

A leader may update **only their defense team and its battle policy**, not the gym type or eligibility rules. For the MVP, a leader-initiated defense update is allowed at most **once per 24 hours** and activates after a fixed delay (**proposed: 1 hour**). A new defense must meet the permanent gym-type condition.

A leader who sees a winning challenge in the public mempool cannot instantly replace the defense to invalidate it: a pending update does not affect proofs judged against the currently active defense. A challenge must match the defense that is active **at submission time**. If a previously scheduled update has already activated before submission, a proof against the old defense will not work and must be recreated. Leadership transfers cancel pending updates from the previous leader.

### 11.6 Defense-team integrity

- Defending creatures are **trade-locked** while assigned, so the leader cannot trade away a creature on their active defense.
- A defense uses a **snapshot** of its creatures' levels, forms/types, and moves taken at registration; later training or evolution does not silently change it. A new snapshot requires a defense update that passes the gym-type check.
- If an exceptional ownership change invalidates the defense, the gym becomes challengeable against a predefined **same-type NPC fallback team**, rather than becoming unchallengeable.

### 11.7 Genesis leaders

At launch, every gym is held by an **NPC leader** with a published team that satisfies its permanent type restriction. NPC teams are not owned by any account and have no privileged mint. The first challenger to defeat the NPC becomes the first player leader. Gym types are distributed across the world at creation, not selected by the first player who takes control.

### 11.8 Open design problem: deterministic battles are solvable

If combat has no randomness and the defender's behavior is a published, fixed policy, a challenger can search offline for a perfect counter. Outcomes would then be decided by **team strength and search effort**, not live play. Options:

| Option | Behavior | Trade-off |
|---|---|---|
| **A. Accept it (MVP recommendation)** | Gyms are puzzle-like. Leaders craft type-eligible teams and move-priority policies; challengers craft counters using the same gym type. Reigns are short and the metagame churns. | Simple and fully provable. Rewards preparation over reflexes. |
| **B. Live signed battles** | The leader plays defense live when online. | Needs both players present; unfit for async play. |
| **C. Future-beacon randomness** | Challenger commits a team and strategy; critical hits and similar events derive from a later beacon round. | Prevents precomputation but needs non-adaptive commitments and a more complex protocol. |

Recommended path: ship option A, measure how quickly gyms turn over, and consider C or a hybrid later.

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

## 13. Optional advertising-funded gas sponsorship

### 13.1 Business separation

An independent company may operate an advertising and gas sponsorship service without owning the game or controlling its contracts. It may receive ad revenue, pay for selected transactions, and keep the difference after costs, taxes, and fraud losses.

Players must always have a fallback to **self-pay**. Refusal by the sponsor cannot block a valid contract call.

**Technical separation is not legal immunity.** An advertising company's branding, marketing, privacy processing, and commercial arrangements could still create legal duties. Publishing software as an individual does not eliminate the developer's legal obligations either. Legal advice is needed for the actual jurisdictions.

### 13.2 Sponsor-authorized transaction flow

1. Player locally prepares a permitted game transaction, such as `registerTrainer`, `commitRareEncounter`, `settleProgress`, `swap`, or `claimGym`.
2. Player requests sponsorship from an independent company.
3. If the sponsor offers an ad-based path, its own compliant advertising experience verifies ad completion.
4. The sponsor issues a **single-use authorization** bound to the wallet or trainer, exact operation/hash, target contract, chain ID, expiry, nonce, and maximum gas cost.
5. A paymaster or fee-payer signs/pays the transaction. The player retains authority over their action.
6. The contract validates the proof and updates state; the sponsor cannot override the result.
7. On refusal or outage, the player submits the same valid operation with self-paid gas or another sponsor.

Because personhood checks no longer exist, **sponsors must apply their own per-user and per-device limits**, especially for `registerTrainer`, to keep subsidies from funding mass account creation.

For Arbitrum and other EVM networks, investigate **ERC-4337 paymasters**. On Solana, third-party fee payers are supported natively; verifier feasibility and chain costs should drive the platform choice.

### 13.3 Google policy feasibility: **not yet approved**

- **Ordinary AdSense ads:** publishers generally cannot incentivize users to view or click non-rewarded ads. "Watch normal ads and we will pay your gas" is inappropriate for standard inventory.
- **Google Ad Manager rewarded web ads:** supports opt-in rewarded placements, but Google's reward rules prohibit direct monetary rewards and require indirect rewards to be **non-transferable** and usable within the **publisher's own platform**.

A **non-transferable, single-use gas-sponsorship service** is not the same as handing someone cryptocurrency. Version 2.0 helps here: because creatures can no longer be freely transferred or sold through the protocol, a sponsored action no longer creates a tradable NFT with market value. Off-chain account sales still exist, and a separate sponsor website might not qualify as the platform where the reward is consumed. These remain **unresolved policy interpretation issues**, not guaranteed exceptions.

Google expects the publisher to control and verify its inventory, take responsibility for opt-in and reward delivery, and handle invalid traffic. Its rewarded web flow provides server-side verification callbacks; the sponsor needs endpoint infrastructure. For EEA/UK/Swiss users, Google's consent and CMP rules and privacy law also apply.

**Feasibility gate before relying on Google:** obtain authoritative approval for (a) a separately operated sponsor/publisher, (b) opt-in ads at an approved publisher property, (c) non-transferable gas payment as the reward, (d) sponsored transactions that update non-freely-transferable game assets, (e) anti-fraud treatment, and (f) geographic restrictions.

### 13.4 Alternatives if Google declines

- An independent sponsor funded by ads on its own independently useful, policy-compliant website, **without** conditioning ordinary ad impressions/clicks on a gas reward.
- Direct advertiser-funded sponsorship campaigns with explicit contractual terms.
- Non-Google rewarded-ad networks that permit the service, subject to their policies.
- Community grants or voluntary donations to an independent sponsor/treasury.
- Self-funded gas as the guaranteed baseline.

Do not build a product that depends on evading ad policies.

### 13.5 Unit economics

```text
Gross ad revenue per completed impression = eCPM / 1,000
Contribution margin per sponsored action =
    eligible ads watched * (realized eCPM / 1,000)
    - actual network gas
    - ad/verification/relay fees
    - fraud and chargeback losses
    - infrastructure and compliance allocation
```

At a hypothetical **$3 eCPM**, one monetized impression yields about **$0.003**. A **$0.03** sponsorship would need roughly **10 such impressions just to cover that amount**, excluding overhead. This may be poor UX. Fill rates, geography, ad formats, revenue share, invalid traffic, prover costs, and chain fees must be measured.

A sponsor could instead subsidize some transactions, cap free saves per person, or fund only the cheapest operations. Advertising profit is a potential independent business, not a prerequisite for the game.

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