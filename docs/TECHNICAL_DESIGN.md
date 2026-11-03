# bitmon — Hybrid Game Backend and Optional On-Chain Collectibles

**Document type:** Technical architecture and threat model
**Version:** 4.1 — WebSocket-only gym DO battles, per-encounter online rarity lottery, concurrent snapshot challenges
**Date:** 3 November 2026
**Status:** Approved direction; detailed parameters and external compliance remain open; implementation not started
**Product requirements:** [PRODUCT_REQUIREMENTS.md](PRODUCT_REQUIREMENTS.md)
**Development decisions:** [DEVELOPMENT_TRACKER.md](DEVELOPMENT_TRACKER.md)

> **Architecture change (DEC-048):** This supersedes the registration-first on-chain/ZK protocol, general-purpose Rare/Legendary NFTs, public-beacon battle commitments, on-chain gym contest resolution, and gas sponsorship described in earlier versions. Those historical decisions remain discoverable in git history and the tracker; they are **not** current implementation requirements.

## 1. Product boundary and principles

bitmon is a complete smartphone-first, offline-capable PWA based on OpenFreeMap/MapLibre. Opening the game, traveling through already cached map areas, training, ordinary wild battles and Common/Uncommon captures need **no account, network, wallet or ads**. Real-world GPS is **not** required: travel happens via the virtual avatar/joystick, including existing preview coordinate jumps. Existing PWA cache, 1:1 source geometry, collisions, low-poly presentation and the OpenFreeMap-only geography policy remain intact. Offline exploration is limited to previously cached tiles; no client may invent missing mapped roads or buildings.

Only **online, signed-in** players can receive authoritative Rare/Legendary encounters, save competitive inventories, enter official gym challenges, or claim rare online rewards. Supabase provides **authentication only**; the canonical game data lives on Cloudflare. Casual PvP may be guest-to-guest, without a persisted leaderboard or rewards.

On-chain features are optional embellishments, **not** the game engine:
- The server is authoritative for gym outcomes, inventories and the visible leaderboard.
- Bitmon asynchronously pays for a public **Hall of Fame** record after each eligible official gym win. There is no user wallet or NFT mint for this record.
- Truly distinctive **one-of-one event monsters** may be claimed as freely transferable ERC-721 NFTs. The NFT holder controls in-game use of that particular monster; Bitmon pays the initial mint cost. No wallet is needed until claim.
- Normal Rare/Legendary creatures **are not NFTs** and require no crypto to battle, trade or train.
- Digital Gold is an ordinary non-transferable, off-chain in-game currency used to attempt official gym challenges, earned via opt-in rewarded advertising. No paymaster, gas-fee reward or chain settlement is involved in a Digital Gold purchase. The operator bears hall-of-fame gas independently.
- Subscriptions and advertising are possible revenue sources, subject to ad-network, privacy and age-related rules; no specific approval is assumed.

## 2. Runtime architecture

```text
   Bitmon PWA (GitHub Pages Preview/Stable)
   ├─ IndexedDB: settings, world position, cached raw OpenFreeMap PBF tiles,
   │             local monster collection/progress and guest save
   ├─ crypto.getRandomValues(): local encounter/capture random draws
   ├─ WebRTC RTCDataChannel: direct unranked player-vs-player turns
   └─ Optional login / online requests
               │
      ┌────────┴─────────────┐
      │ Supabase Auth ONLY   │ Email/social login, signed session JWT
      └────────┬─────────────┘
               │ JWT passed to public API
      ┌────────▼───────────────────┐
      │ Cloudflare Worker API      │ JWT verification, rate limits,
      │                            │ matchmaking signaling, encounters,
      │                            │ currency operations, event claims
      └────────┬───────────────────┘
               │
      ┌────────┼─────────────────────────┐
      │        │                         │
    D1 SQL   Gym Durable Object       WebRTC signaling
    --------  per gym ID, SQLite       Worker + expiring D1 rendezvous
    verified  authoritative combat     STUN, TURN fallback
    trainer   serialized challenge
    inventory WebSockets optional
    rare roll Hibernate between events
    gold      alarms for deadlines
    NFT grant │
    records   └────┐
    leaderboard     │ idempotent projection / outbox
      │             │
      └─────┬───────┘
            ▼
    Cloudflare Queue/Worker (durable retry + idempotency)
      ├─ Publish gym wins to public chain (Bitmon pays gas)
      └─ Optional one-of-one NFT claim mint (Bitmon pays gas)
                        │
             ERC-721 ownerOf on reads/actions
             Current NFT holder controls unique event monster
```

**Supabase is not a monster, leaderboard, Digital Gold or gym database.** Its identity UID is the stable foreign key for authenticated Cloudflare data. The frontend never receives a Cloudflare admin key or directly edits authoritative records.

**Cloudflare D1** is the shared, queryable canonical store for authenticated players, inventories, encounter tickets/results, Digital Gold ledger, special-event entitlements and public-facing leaderboard projections. **SQLite-backed Durable Objects** own the serialized live gym state, active challenge sessions and canonical sequence of gym leadership transitions. D1 leaderboard is a **read model** updated idempotently from those transitions, not a second competing authority.

For simple operations, start with one Worker API, one D1 database, one gym Durable Object class and the smallest necessary publisher worker/queue; no microservice framework, separate matchmaking database, or Supabase Postgres game tables. Do not deploy cloud services as dependencies of E0 exploration.

## 3. Authentication and save boundaries

### Guest/offline

- Launch and train instantly with local IndexedDB save and existing bounded OpenFreeMap tile cache. The client may run deterministic, reproducible battle rules using locally generated unpredictable seeds from browser `crypto.getRandomValues()`. Never rely on `Math.random()` for a security-sensitive draw.
- Every few meters of accepted local virtual exploration, schedule an encounter using a device-randomized distance threshold (exact distance distribution is a balance parameter). Offline/guest encounters roll **Common or Uncommon only**, using their relative weights; no Rare/Legendary tickets are issued offline or pre-cached for later redemption. This is a deliberate online eligibility rule, not a promise of full-rarity chances without login.
- Local-only captures/stats are editable and **cheating in offline Common/Uncommon exploration is an accepted risk**, not something to police with server movement proofs. Players can change local storage or fork the client; this must not be allowed to fabricate Rare/Legendary tickets, gym leadership or Digital Gold. Gym team combat uses server-normalized legal presets rather than arbitrary client levels/items.
- The UI labels monsters as *Local* versus *Verified online*. Logging in does not wipe or invalidate local creatures. For official gyms, the server assigns published **fixed battle levels, moves, items and stats** to each allowed species/loadout so editable guest XP/items provide no competitive benefit. There is **no launch-blocking guest-inventory migration or ownership-verification problem** for permitted Common/Uncommon presets; locally supplied data are treated as cosmetic/team selection, not authoritative stats. A Rare/Legendary or unique event monster still requires the corresponding server record/NFT ownership before being eligible.
- MapCache, collision and virtual avatar travel stay as currently implemented. No mandatory device geolocation is introduced.

### Online identity

- The browser signs in through Supabase Auth only when requesting verified Rare/Legendary encounter eligibility, persistent competitive progression, gym challenges, official events or ranked features.
- A Cloudflare Worker validates Supabase JWT signature using the project's appropriate JWKS, issuer, audience, expiration and user ID (no client-supplied UID trusted). Apply short-lived sessions, logout/revocation considerations and access-control checks before every authoritative mutation.
- Never store gameplay secrets in JWT user-editable metadata, or expose Supabase service keys in the PWA. Verify account status and ownership on the server.
- The authenticated game profile is in D1; no on-chain trainer registration or wallet prerequisite.
- Ordinary local training remains possible when auth, network, Supabase or Cloudflare is down.

## 4. Encounter generation and online rarity lottery

### 4.1 Distance-triggered local encounters

- Every few **locally traveled** meters, the client may trigger a wild encounter. Draw the next encounter distance from a published random distance interval/distribution using device `crypto.getRandomValues()`. Persist the threshold and movement accumulator so reloading does not accidentally restart the cadence. No precise distance interval or rarity percentages are changed by this decision; tune later through playtesting.
- **Offline or unsigned guest:** only Common/Uncommon can appear, drawn according to their **relative weights**; there is no offline Rare/Legendary possibility. Device seeds plus deterministic counters make local battle outcomes reproducible, not fraud-resistant.
- **Online signed-in:** when an encounter triggers, request the **same complete rarity lottery on every eligible online encounter** (Common, Uncommon, Rare, Legendary, with one published probability table, not a second lottery just for rares). The Worker generates the rarity/species; the browser never chooses or overrides the outcome. If a user isn't online or does not log in, they remain in the Common/Uncommon pool.
- Do not claim that an offline encounter has identical absolute rarity probabilities to an online encounter; its Rare/Legendary probability is intentionally zero.

### 4.2 Secure online lottery and authenticated captures

1. At an ordinary distance-triggered encounter, a logged-in client requests an online encounter from a Cloudflare Worker using an idempotent opportunity identifier. It supplies its current **virtual** region/location; client distance claims are **not trusted as physical proof**.
2. The Worker validates JWT and enforces **one server-authorized online draw per accepted encounter opportunity**, with a modest account-wide **server-clock minimum interval/rate cap** to stop scripts from sending thousands of extra lottery requests. This is not a walking-distance anti-cheat system; farming Common/Uncommon local encounters is acceptable. If online draw eligibility has not yet returned, the player receives an ordinary Common/Uncommon local encounter rather than a second rare lottery. Publish this distinction transparently.
3. Atomically bind trainer ID, server sequence, source location/region if supported, versioned rarity table and idempotency key **before** sampling secure Worker randomness. Store the **full** Common/Uncommon/Rare/Legendary result and expiry in D1. A refresh, duplicate request or retry returns the same result, not another draw. Each accepted online opportunity uses the same published rarity probabilities.
4. Common/Uncommon from the online lottery may use the ordinary local presentation and need not be individually verified for low-stakes local progression. Rare/Legendary outcomes issue a single-use server-recorded encounter ticket with immutable species and rarity.
5. For a Rare/Legendary encounter, server-authoritative battle validation checks moves, rules version, capture RNG and ticket owner/expiry, then awards a canonical creature in D1 at most once. Client-generated final battle outcomes or modified saves are insufficient.
6. Timeout, escape or loss consumes/expires that ticket under published rules; never grant a new lottery draw for a failed capture.

### 4.3 Scope of cheating prevention

- No movement surveillance or anti-spoofing system for Common/Uncommon. Virtual coordinate jumps and modified browser movement are accepted aspects of low-stakes gameplay.
- Protect **lottery request counts, uniqueness and server-authored rarity** only. Basic per-account throttling, idempotency, rate limiting and transactional ticket consumption are enough for MVP; make no claim of bot-proof Rare/Legendary scarcity or physical location integrity. Enforce any optional species/habitat rules using OpenFreeMap-only information, and do not let teleporting multiply independent lottery draws.
- A rare encounter **must be online** when issued and while recording the authoritative capture. If connectivity fails, a stored pending ticket may be resumed within its published deadline, never transformed into an offline transferable entitlement.
- Publish odds and server rule versions. Optional server-seed audits cannot independently prove an operator never withheld outcomes; the backend is trusted.

## 5. Inventory, gameplay and trading

- Canonical online inventories, XP, levels, captures, items, rules versions, bans and ownership are stored in D1 and writable only through authenticated server business logic. Clients may cache read models but not authoritatively update them.
- Ordinary offline Common/Uncommon saves remain valid for local use. **Official gym combat normalizes selected Common/Uncommon monsters to published legal species/loadout templates** (stats, level, moves, items), so a player can choose a permitted local creature without proving its complete local capture/XP history. This is not a trusted inventory import. Rare/Legendary use server-verified online records, and one-of-one NFT monsters require fresh chain ownership checks.
- Preserve prior game-balance intent for ordinary **server-mediated** exchanges: exactly one creature for one of the same rarity tier, one completed swap per trainer per rolling 24 hours, both reset to the lower level. Use an atomic, consented database swap with unique request IDs; no NFT mint, crypto, wallet or open marketplace is involved for normal creatures.
- All rarity tiers can compete in ordinary authenticated gym battles and eligible ranked PvP **without NFTs**; rarity does not require blockchain custody. Local-only monsters are for practice/unranked play unless admitted under a separately verifiable import rule.
- Keep combat pure/deterministic given explicitly supplied seed, legal action sequence and rules version. Share one rules implementation between client for presentation and server for validation; don't duplicate two divergent game engines.
- Do not monetize by selling combat power or randomized transferable collectibles without a separate policy/legal review.

## 6. PvP without a continuous battle server

**Casual/direct PvP (initial scope):**

1. Two players exchange an invite or join an optional matchmaking/signaling endpoint in a Cloudflare Worker. Use a short-lived D1 rendezvous record for offers/answers/ICE (with expiry and cleanup), or a tiny signaling room Durable Object later if lower latency is needed. Guests may participate without Supabase login; this coordination endpoint does not execute battles.
2. Negotiate an encrypted `RTCDataChannel` using WebRTC ICE/STUN. **TURN (Traversal Using Relays around NAT) fallback** means a relay forwards WebRTC traffic when players cannot connect directly because of mobile carrier NAT/firewalls. It does **not** calculate battle turns or provide HTTP turn requests. A QR/manual invite still needs ICE candidate exchange and may fail without TURN. Signaling is ephemeral coordination, **not** the battle engine.
3. Both peers agree on battle rules version, roster snapshot, turn order, initial seed commitment/hash, and an immutable match ID. Each turn exchanges actions/sequence numbers, acknowledgments and, if needed, a commit-then-reveal phase to avoid second-mover advantage. Resolve chance through a combined seed contribution revealed after both sides commit. Missing reveal/disconnect means **void/incomplete**, not a provable loss.
4. Both browsers run the same deterministic combat engine and compare signed/hashed transcript checkpoints. The UI warns about mismatches or aborts. No authoritative ranking, Digital Gold prizes, rarity awards or ownership changes are granted from an untrusted direct match.
5. Peers cannot reliably prevent each other from cheating, stalling, withholding a reveal, manipulating their client or fabricating a local roster. **A trustless competitive PvP system is not achieved by WebRTC or commit/reveal alone.**

**Official ranked/rewarding PvP (future option):** require Supabase login and server-validated rosters/results, a server arbiter or an auditable action transcript with independent server adjudication, disconnection penalties, and explicit ranking rules. A minimal Worker/DO match arbiter could be added if ranked PvP proves valuable; **do not deploy an always-on PvP simulation server for casual matches**. No NFT requirement for ordinary PvP.

## 7. Gyms: WebSocket-only Cloudflare Durable Objects

One **SQLite-backed Durable Object per gym ID** is authoritative for the gym's permanent type, leader/version, defense policy, active challenges and win ledger. Its WebSocket Hibernation API allows it to sleep between events while retaining accepted WebSocket connections. **All gameplay turns use this gym DO's WebSocket. There are no HTTP battle-turn routes, polling endpoints or HTTP fallbacks.** A WebSocket technically starts via HTTP Upgrade; the handshake/authentication routing is allowed, but no battle turn uses HTTP.

### 7.1 Starting and processing a challenge

1. A player signs in and opens the gym WebSocket routed directly to its DO; an auth gate verifies Supabase identity. A client may also obtain ordinary leaderboard metadata without an active battle.
2. The player selects a team from allowed gym-type species/templates. **Every combat-relevant value—level, stats, moves, items, abilities and per-team caps—is replaced with published server-approved loadout rules.** Locally edited Common/Uncommon stats and inventory cannot grant advantage. Rare/Legendary eligibility uses canonical online ownership, and one-of-one event monsters require a current on-chain owner check.
3. The DO creates an idempotent session with the current **leader_version** and immutable defender snapshot, reserves/debits Digital Gold **once** through an authenticated D1 currency operation, and durably stores its charge/session state. Cross-store updates use an idempotent outbox/compensating refund; do not assume a transaction spans DO SQLite and D1.
4. The WebSocket delivers commands and state updates. The DO validates actions, computes one turn with server randomness and a shared deterministic combat engine, persists the transition to its own SQLite before acknowledging it, then can sleep. On reconnect the same authenticated player reattaches to the existing session and reads authoritative state **over WebSocket only**. Disconnection expiry uses durable alarms, not in-memory timers.

### 7.2 Concurrent challenges: parallel battles, single winner

**Multiple users may fight the same frozen defender snapshot concurrently.** Do not queue every player behind a single active match: a popular gym could otherwise block players for hours. The gym DO may impose a bounded active-session count and at most one active official challenge per trainer, determined by real device/load testing.

- Each session stores `leader_version` and the defense snapshot captured at entry.
- The DO serializes victory settlement: **the first valid completed victory whose `leader_version` still equals the gym's current version** becomes leader. Atomically increment the leader version and append exactly one unique win ID in the DO's SQLite state.
- Other challenges targeting the replaced version **cannot overwrite** the winner. Mark those overlapping sessions **superseded**, notify clients over their WebSockets, and **refund their Digital Gold** once through the idempotent ledger. A superseded session grants no loss and may be replayed as a new attempt against the new leader. A genuine defeat completed against the then-current version still consumes the normal attempt cost.
- If multiple results arrive nearly simultaneously, the DO's serialized durable order is authoritative; never use browser clocks, winner claims or last-write-wins in D1 to choose a champion.
- On disconnected/abandoned matches, publish a modest timeout, release stale sessions and apply the normal forfeiture policy; **refund only server-error/cancelled/superseded charges**, not deliberate disconnects to avoid a loss.
- The D1 leaderboard is a **projection**, not a second leader authority; the DO sends idempotent leader-change events through an outbox. An eligible win is queued once for Bitmon-funded asynchronous on-chain Hall-of-Fame publishing; chain delay/failure never blocks the gym.

### 7.3 Hibernation and protocol

- Use `ctx.acceptWebSocket()`, WebSocket message/close handlers, serialized socket attachments, and durable SQLite for leader, session, turns, random seed/counters, currency/outbox and winner history. Restore all required state when a hibernating DO wakes.
- Do **not** use `ws.accept()`, per-turn HTTP endpoints, synchronous polling, or timers that keep the DO continuously active. Use Durable Object alarms for session timeout and retry scheduling.
- A disconnected client reconnects the WebSocket to the same DO with a signed authenticated resume token/session ID. If no WebSocket can be established, the official challenge waits or expires according to the rules; **there is no fallback transport**.
- Cloudflare request handling still carries the **initial HTTP Upgrade** required to create a WebSocket. The no-HTTP rule refers specifically to the transport for gameplay turn messages.
- Publish the leader-version race, refund/expiry policy and disconnection behavior before launch so players understand contested gyms.

## 8. Digital Gold, monetization, and legal review

- **Digital Gold** remains a non-transferable, non-cashable, off-chain game currency. Initial proposal: earn only through explicitly opt-in, ad-network-permitted rewarded ads; exact credit rate and any necessary free allocation are policy/UX decisions.
- Official gym challenges debit Digital Gold **for the attempt**, not for the blockchain write or a separate post-win claim. The game backend later pays for Hall-of-Fame publication out of its own budget. Winners don't need a wallet, crypto or ad view at the moment of victory.
- Rewarded ads, ordinary ads, and optional subscriptions are ordinary-game monetization; require appropriate publisher permission, privacy/consent and child-protection compliance. There is no guarantee an ad network approves any specific placement or that placing a reward off-chain guarantees compliance.
- No rewarded Digital Gold path may mint, award, purchase, or be redeemable for a **transferable event NFT**. Those collectibles come from **separately administered free, skill-based unique events** with independently specified eligibility, not paid or ad-currency-linked chance.
- Subscription must not grant fabricated competitive results or guaranteed rare-event NFTs. Assess consumer law, app-store/web payment terms, VAT, GDPR, youth audience and gambling/loot-box issues before launch.

## 9. Hall of Fame: company-funded chain publication

- The canonical leaderboard remains in the gym DO, projected into D1. **After** each eligible verified win, enqueue an immutable `gym_win_id`, gym ID, version, pseudonymous winner identifier, timestamp and rules/record hash for publishing to a low-cost public chain. No wallet connection is required from the winner.
- A separate publishing Worker funded by Bitmon writes an event/attestation or append-only contract record; persist transaction hash, chain ID, confirmation state and retry status. Use unique event IDs, deduplication and retry logic to prevent double publication on network errors. Queuing/retries cannot roll back legitimate game leadership.
- UI shows the normal centralized leaderboard immediately. On-chain proof is optional behind a detail/share view; marketing may accurately describe a public history of **results certified by Bitmon**. It must **not** claim that the chain independently validated battles, which remain server-authoritative.
- Avoid real names, contact details, precise historic physical locations, or other unnecessary personal data on immutable chains. Player handles and identifiers may still be personal data when linkable; use opaque identifiers/hashes and clear privacy disclosures. A public pseudonym opt-in policy is an open decision.
- Initial preference: one inexpensive on-chain record per official win; if costs grow, consider batching commitments with public inclusion proofs later. No chain transaction is performed for failed challenges.

## 10. Truly unique event monsters and optional NFTs

- Define exceptional events where an explicitly **one-of-one**, distinguishable creature exists with unique art, lore, traits and event history. This is **not** a re-label of all Rare/Legendary creatures or a fungible generated collection. Preserve one canonical event creature ID and a contract invariant permitting **one NFT ever** for that ID.
- The event winner receives a **server-side claim entitlement** in D1. No wallet or crypto is required to win, use ordinary game features, or hold an unminted entitlement. This entitlement is **not yet a blockchain asset**.
- On optional claim, let the winner connect an existing wallet or create an **exportable/recoverable non-custodial embedded wallet**. Require proof of control of the destination address and authenticated ownership of the entitlement; guard mint with a single-use, expiry-checked claim record.
- Bitmon pays initial mint gas and mints the ERC-721 **directly to the player's wallet**, not first to a centralized treasury wallet. A transaction failure must not lose the entitlement; retry safely using minted-event uniqueness checks. Record contract, token ID, chain, transaction and status.
- After mint, **the current on-chain NFT holder** (verified via signed wallet challenge and fresh `ownerOf(tokenId)` at important actions) is authoritative for **in-game control of that unique creature**. A sale or external transfer removes the previous player's right to use it; the new holder can link their wallet and claim use. Never rely solely on delayed indexer events or stale D1 mirrors for an ownership-critical battle.
- Transfers/sales are unrestricted by Bitmon; no internal NFT marketplace or secondary sale commission required. Handle marketplace transfers, chain outages, wallet recovery and conflicting in-game sessions with a strict ownership-check policy. Ordinary in-game creatures remain D1 assets.
- Genuine uniqueness supports but **does not guarantee** a MiCA exclusion. Rights, series/economic substance and other EU law still need assessment before offering transferable NFTs; uniqueness is not a legal workaround.

## 11. Security and correctness invariants

1. An unauthenticated client may play locally but **cannot mint verified inventory, change a leaderboard, earn server Digital Gold or issue verified Rare/Legendary tickets**.
2. JWT subject/role are server verified; never trust client-side UID, species, capture outcome, combat win or currency balance.
3. Only a previously persisted eligible online encounter opportunity can produce a verified Rare/Legendary capture; each ticket has one immutable outcome, one consumption and an expiry.
4. Local Common/Uncommon cheating is tolerated in guest play; official gym battles derive every combat stat/item/move/level from legal server templates, never from edited local saves. Rare/Legendary still require server-issued/owned records.
5. Parallel gym challenges freeze a defender version; only the **first serialized valid victory** against the current version changes leadership. Overlapping superseded sessions refund Digital Gold idempotently; stale/duplicate victories cannot change leadership or create duplicate on-chain records.
6. Every gym battle turn flows **only over the gym DO WebSocket**, is checked against server-normalized team/loadout/seed/rules and persisted before acknowledgment; hibernation/restarts cannot lose confirmed state. No HTTP turn fallback exists.
7. Unranked P2P matches never create independently trusted canonical rewards; transcript mismatch or missing reveals cancels/voids the match.
8. One-of-one event token IDs cannot be minted twice, and unique-monster game usage depends on **current** NFT owner, not old entitlement or database copy.
9. Ad credits cannot be redeemed or converted into transferable NFTs. Hall-of-Fame chain writes have unique victory IDs and no player-gas prerequisites.
10. OpenFreeMap is the sole geographic data source; no missing geographic road/building is invented; virtual travel does not prove physical presence.
11. Local PWA and guest save continue functioning during Supabase, Cloudflare, network, NFT chain or publisher outages within cached-map limits.

### Essential tests when implementation begins

Following `skill.md`, keep automated tests minimal and protect only high-impact invariants: (a) one rare ticket cannot be rerolled or double claimed, (b) one gym win/Digital Gold debit cannot double apply after retries, and (c) an NFT transfer revokes the old holder's competitive use. Prefer extending existing tests; these are candidates, **not tests added by this documentation PR**. Use inexpensive targeted manual scenarios for WebRTC fallback, DO wake/reconnect and offline mode.

## 12. Minimal implementation sequence

**E0 unchanged:** complete the existing OpenFreeMap-only low-poly exploration/PWA work, collision/caching and phone tests. No backend dependency for map exploration.

**Phase A — local creature loop:** Common/Uncommon encounters using device random seeds, deterministic local combat, indexed saves, offline behavior and explicit *Local* status.

**Phase B — authenticated online rarities:** Supabase Auth only; Worker verified JWT; Cloudflare D1 profile and encounter ticket/opportunity tables; server-controlled secure RNG, dedup and authoritative Rare/Legendary battle/capture results.

**Phase C — official gyms:** D1 Digital Gold ledger and optional rewarded ad verification; one SQLite-backed gym DO per gym; deterministic authoritative battles, persistent turn state and leader projection; hibernating sockets only when useful.

**Phase D — direct casual PvP:** common shared combat engine, WebRTC DataChannels, small signaling Worker and tested STUN/TURN fallback; guest/unranked allowed; ranked remains separate.

**Phase E — public achievements:** publish server-verified gym wins asynchronously via funded publisher with idempotent on-chain attestation/events; keep UI centralized.

**Phase F — occasional one-of-one NFTs:** unique-event entitlement, delayed wallet creation/claim, free-to-player mint, external transfers and live chain ownership checks. Launch only with policy/legal review and reliable recovery and NFT custody UX.

Do not integrate an on-chain battle engine, per-capture NFT protocol, ZK circuit, public randomness beacon, automatic wallet creation for all users, on-chain Digital Gold, or a general NFT marketplace.

## 13. Risks and unresolved design choices

- **Virtual movement integrity:** Decide server movement acceptance/cooldowns when arbitrary coordinate jumps remain allowed. Nothing in the browser proves physical travel; avoid geography-based rate boosts that can be farmed by teleporting.
- **Rare lottery:** One unchanged published probability table per accepted online encounter; random encounter distance trigger and server-clock anti-spam are decided. Tune encounter-distance distribution, lottery minimum interval, table odds, region modifiers, ticket expiry and reconnect behavior.
- **Guest -> account:** Guest data persists; official gyms use standardized server-owned legal loadout templates so unverified local Common/Uncommon stats/items cannot cheat. Only details of visual collection linking and exact legal templates remain open.
- **Gym concurrency:** Parallel frozen-defense sessions with first valid current-version victory winning and idempotent refunds for superseded sessions are decided; tune only active-session cap, timeout, duplicate-charge recovery and load-tested race performance.
- **WebRTC:** TURN is a WebRTC traffic relay for failed direct connections, not an HTTP battle-turn fallback. Validate mobile NAT reachability, relay cost, invitation signaling, disconnects and cheating tolerance.
- **Digital Gold economy:** Advertiser policy approval, underage access/consent, possible free credits, exact ad reward rate, ledger consistency and currency sinks.
- **Blockchain:** Network choice, publishing cost and batching threshold, pseudonymous identity/privacy, independent audit visibility, NFT licensing/rights and claim/recovery lifecycle.
- **Commercial assumptions:** Cost of Cloudflare D1/DO/Workers and TURN under real mobile traffic; no cost or security promise until measured.

## 14. References

- [Cloudflare Durable Objects with WebSocket Hibernation](https://developers.cloudflare.com/durable-objects/best-practices/websockets/)
- [Cloudflare SQLite-backed Durable Object storage](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/)
- [Cloudflare data storage choices](https://developers.cloudflare.com/workers/platform/storage-options/)
- [Cloudflare Worker Web Crypto](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/)
- [WebRTC peer connection setup and signaling](https://webrtc.org/getting-started/peer-connections)
- [WebRTC data channels](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels)
- [Supabase JWT verification and JWKS](https://supabase.com/docs/guides/auth/jwts)
- [MiCA Regulation (EU) 2023/1114](https://eur-lex.europa.eu/eli/reg/2023/1114/oj)

**Summary:** Local game first, Cloudflare-authoritative multiplayer only where necessary, Supabase for login, WebRTC for casual PvP, gym DOs that sleep when idle, Bitmon-funded public achievements, and scarce transferable NFTs only for genuinely unique events.
