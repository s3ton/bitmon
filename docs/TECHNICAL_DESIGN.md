# bitmon — Hybrid Game Backend and Optional On-Chain Collectibles

**Document type:** Technical architecture and threat model
**Version:** 4.2 — cached public randomness lottery and single-challenger gym queue
**Date:** 4 November 2026
**Status:** Approved direction; detailed parameters and external compliance remain open; implementation not started
**Product requirements:** [PRODUCT_REQUIREMENTS.md](PRODUCT_REQUIREMENTS.md)
**Development decisions:** [DEVELOPMENT_TRACKER.md](DEVELOPMENT_TRACKER.md)

> **Architecture history:** DEC-048 supersedes the registration-first on-chain/ZK game engine and gas sponsorship. **DEC-050 further supersedes the per-encounter server RNG and parallel/refund gym concurrency proposals** of DEC-049. Public beacon randomness is now used **off-chain for rare eligibility only**, not for on-chain battle commitments; historical designs remain in git/tracker, not as current requirements.

## 1. Product boundary and principles

bitmon is a complete smartphone-first, offline-capable PWA based on OpenFreeMap/MapLibre. Opening the game, traveling through already cached map areas, training, ordinary wild battles and Common/Uncommon captures need **no account, network, wallet or ads**. Real-world GPS is **not** required: travel happens via the virtual avatar/joystick, including existing preview coordinate jumps. Existing PWA cache, 1:1 source geometry, collisions, low-poly presentation and the OpenFreeMap-only geography policy remain intact. Offline exploration is limited to previously cached tiles; no client may invent missing mapped roads or buildings.

Only **online, signed-in** players can claim authenticated Rare/Legendary encounters, save competitive inventories, enter official gyms or claim rare online rewards. The **beacon draw itself is checked locally once per period**; Cloudflare processes only winners' claims and subsequent rare battles. Supabase provides **authentication only**; Cloudflare owns canonical game data. Casual PvP may be guest-to-guest without ranked rewards.

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
   ├─ crypto.getRandomValues(): ordinary local encounters and capture draws
   ├─ Shared CDN-cached, authenticated public randomness beacon (each period)
   │  + hash(beacon, fixed trainer ID, period) for local Rare/Legendary eligibility
   ├─ WebRTC RTCDataChannel: direct unranked player-vs-player turns
   └─ Optional login / winning rare claim / gym queue WebSocket
               │
      ┌────────┴─────────────┐
      │ Supabase Auth ONLY   │ Email/social login, signed session JWT
      └────────┬─────────────┘
               │ JWT passed to public API
      ┌────────▼───────────────────┐
      │ Cloudflare Worker API      │ JWT verification, rare WIN claims,
      │                            │ matchmaking signaling, battle validation,
      │                            │ currency operations, event claims
      └────────┬───────────────────┘
               │
      ┌────────┼─────────────────────────┐
      │        │                         │
    D1 SQL   Gym Durable Object       WebRTC signaling
    --------  per gym ID, SQLite       Worker + expiring D1 rendezvous
    trainer   one active battle         STUN, TURN fallback
    inventory durable free FIFO queue
    winning   WebSocket-only turns
    claims    Hibernate between events
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

**Cloudflare D1** stores stable trainer identities/eligibility times, winning beacon-period claim/tickets, verified rare capture results, inventories, Digital Gold ledger, one-off NFT entitlements and public leaderboard projections. **Non-winning beacon outcomes create no D1 entry or authenticated Worker request.** SQLite-backed gym Durable Objects own the durable FIFO queue, single active battle, leadership transitions and replay-safe session state. The D1 leaderboard is an idempotent **read model**, not a second leader authority.

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

## 4. Encounter generation and low-request public-beacon lottery

### 4.1 Local exploration remains independent

- At device-randomized distances of a few virtual meters, the PWA generates an ordinary **Common or Uncommon** encounter from a local probability distribution. Use browser `crypto.getRandomValues()` for the initial unpredictable seed and a versioned deterministic stream for reproducible battle/capture results. Persist threshold, movement counter and seed in IndexedDB.
- No account, network, beacon, Worker call or server permission is required for these encounters. Browser movement, location and local-save cheating are deliberately not policed. Offline players never obtain genuine Rare/Legendary claim rights.

### 4.2 One public random value, one chance per trainer per period

The **same publicly authenticated randomness value** is distributed to all clients periodically through a shared cacheable endpoint/resource; there is **no per-player encounter WebSocket and no per-ordinary-encounter API call**. Prefer an externally verifiable, unpredictable beacon (for example signed drand rounds) or a documented commit-before-reveal publisher whose previous commitment is immutable before reveal. A beacon value must not be chosen after the operator observes target accounts.

1. **Eligibility established first.** On initial Supabase login, a Worker assigns a stable opaque trainer ID and server-records its activation time/first eligible future period in D1. A new account cannot register after a period's seed is revealed and retrospectively claim that period. Changing app storage, tab, wallet or virtual location does not change its trainer ID.
2. **Shared public data.** Each period has `(lottery_version, period_id, authenticated_beacon_value)`. Clients may retrieve it directly from CDN cache once per period and verify the provider signature/chain as appropriate; CDN misses still produce some traffic, but do not cause per-user authenticated game API work.
3. **Deterministic local test.** Compute a versioned, domain-separated cryptographic digest `H("bitmon-rare" || version || period_id || trainer_id || beacon_value)`. Interpret uniformly against **published disjoint Rare and Legendary thresholds**; every eligible trainer has at most **one special winning outcome per period**. No client-controlled nonce, encounter sequence, region, device random seed, or extra hash inputs.
4. **No winning result:** continue locally with Common/Uncommon encounters; do not send a game-backend lottery request. This avoids per-encounter Worker invocations, D1 reads/writes and dedicated rarity WebSockets for the large majority of players.
5. **Winning result:** during the published claim window, the trainer authenticates to one Worker claim endpoint. The Worker fetches/revalidates the authoritative period value, authenticates the account and its **pre-seed eligibility**, recomputes the exact hash and rarity, and atomically records the unique `(trainer_id, period_id)` claim plus a single expiring D1 ticket. Duplicate/replayed requests return existing ticket/status; losing a capture never reopens the period.
6. **Manifest in exploration:** a claimed winning entitlement replaces the **next local wild encounter** within a published spawn/claim window with the authenticated Rare/Legendary species. Capture requires server-authoritative actions and RNG, finalized once in D1. A lost connection can resume the existing ticket until expiry; an expired ticket cannot be minted/imported from a local save.
7. **Beacon unavailable/invalid:** do not substitute a client-created number or allow arbitrary historical-round claims. Let the period await a verified value within an explicit grace rule, or skip it with clear UX; local ordinary play is unaffected.

### 4.3 Distribution, odds and threats

- One draw per period is **not equivalent to** a rarity roll on each ordinary encounter. Determine period duration, Rare/Legendary thresholds and claim/spawn windows from expected active sessions; do **not** silently copy old per-encounter probabilities. Publish probability by trainer-period and rules version.
- One seed per epoch means **all users can compute the same period** but receive different deterministic outcomes because their immutable trainer IDs differ. Non-participating players may learn they would have won without exploring; physical activity requirements are explicitly absent. To discourage completely idle claims, require the successful trainer to reach a wild encounter while still within the allowed window, not client-proven steps.
- Multiple accounts can multiply chances, and a client can spoof virtual travel/locations. These are accepted MVP risks; no user tracking or anti-GPS-spoofing service is introduced. Do not permit signing up with a **chosen trainer ID** until after seeing the beacon: use server-issued immutable identities and only future-round eligibility.
- Geographic modifiers, if introduced later, may select species from OpenFreeMap-only information **at claim** but cannot multiply hash attempts by selecting a new region after reveal. For the MVP, keep Rare/Legendary thresholds independent of claimed location.
- The backend remains trusted to issue correct tickets/captures and to publish/serve authenticated period values; a public beacon proves entropy provenance, **not** fairness of account creation, claim processing or gameplay outcomes.

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

## 7. Gyms: free FIFO reservation queue, one WebSocket battle at a time

One **SQLite-backed Durable Object per gym ID** owns the permanent type, current leader and defender policy, durable FIFO queue, exactly **one active official challenge**, win ledger and idempotent currency/event outbox. Its WebSocket Hibernation API allows clients to stay connected while the object sleeps between messages. All queue operations, invitations, turns and resume actions use **WebSocket messages**: **no HTTP battle-turn, queue-status or polling fallback**. The only unavoidable HTTP interaction is the initial WebSocket Upgrade handshake.

### 7.1 Free queue and paid activation

1. After Supabase login, the client connects to the gym DO by WebSocket. Join/leave/inspect/resume queue is free. Enforce **one queued or active position per trainer per gym**, FIFO order and a bounded queue size; persist membership, join order, last-known session and any expiration in the DO's SQLite. A trainer can continue normal map exploration while queued.
2. If the gym is idle, the head of the queue receives a **time-limited start offer**, not an immediate Digital Gold debit. If the player is disconnected/backgrounded, a briefly resumable queue position may receive its offer after reconnect; the offer itself is not charged. An absent/declining player loses the opportunity after an acceptance deadline without paying and the DO offers the next trainer. Maintain fair FIFO; no indefinite hold by absent accounts.
3. On **explicit WebSocket acceptance**, the DO uses server-authoritative identity and published gym-legal species/loadout templates. Local Common/Uncommon levels, moves, items, abilities and stats are replaced by fixed allowed values; Rare/Legendary ownership comes from verified D1 records and unique event NFT access requires current owner verification.
4. **At actual match start**, atomically create the active battle in DO SQLite against **the current leader and latest defender snapshot**, and initiate/confirm **exactly one** Digital Gold debit in D1 using a unique idempotency key. A cross-store transaction is impossible; use a short **pending-start** state plus retryable debit/outbox/compensating refund so a user is never charged for a battle that was never activated and duplicate accepts cannot double-charge. Only mark the match active and send the first turn after the debit is confirmed.
5. Each WebSocket action checks active trainer/session/turn/rules and versioned server RNG, computes one deterministic transition with the shared combat engine, and persists it in gym SQLite **before acknowledging**. Ordinary idle time does not require continuous DO execution; alarms enforce deadlines.

### 7.2 Sequential leadership: no stale concurrent battles

- **Exactly one active paid official challenge per gym**, including during reconnect grace. There can be many free queued trainers, but they do not fight stale defense versions in parallel.
- A legitimate win immediately replaces the leader, increments the version and appends one unique victory ID inside the DO. The D1 leaderboard receives an idempotent projection, and a company-funded asynchronous on-chain Hall-of-Fame publisher processes the unique win after the ordinary game result.
- A loss, surrender or active-battle timeout ends that match and advances the queue; the next accepted challenge uses **whatever leader/defender is current when it starts**. No paid challenger has their battle invalidated because another player won.
- Player disconnect: keep the paid battle state durably for a **bounded reconnect window**, then use a scheduled alarm to forfeit if the player does not return. Disconnected queue users are not charged, have a short published resume/offer policy, and cannot block an active gym indefinitely.
- Refunds are **not** part of normal gym concurrency. Refund only for genuine platform failures such as an idempotent D1 debit succeeded but DO session creation failed. Do not allow intentional disconnect/surrender to reverse a valid paid attempt.
- Popular gyms can have long queues. Define maximum queue length, offer acceptance window, active turn/battle timer and reconnect grace as balance/operational parameters. Display actual queue position; do not invent precise waiting-time estimates. Consider scheduled tournaments separately only if congestion becomes a demonstrated issue.

### 7.3 WebSocket hibernation and protocol

- Use `ctx.acceptWebSocket()`, persistent SQLite records for queue, offered-turn state, active session, turn history, deterministic RNG seed/counter, leader/version, timeout alarms and an idempotent D1/outbox record. Socket attachments contain only reconnect identity/routing; never keep the sole copy of a confirmed action in memory.
- On wake/redeploy, reconstruct the queue/active battle from SQLite; reconnecting clients reauthenticate and receive authoritative queue or match state **over WebSocket only**. Browser-background suspension is expected, not treated as permanent connectivity.
- Avoid per-client polling, HTTP gameplay turns and timers that keep the DO active. Durable Object alarms handle offer/forfeit expirations and retryable outbox work.
- A failed WebSocket connection means a gym challenge is unavailable until WebSocket connection is restored; **there is no HTTP fallback**. TURN (for casual WebRTC PvP) is unrelated to this transport.

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
