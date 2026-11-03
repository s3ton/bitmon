# bitmon — Hybrid Game Backend and Optional On-Chain Collectibles

**Document type:** Technical architecture and threat model
**Version:** 4.0 — Cloudflare-authoritative multiplayer, offline guest play, optional hall of fame and one-of-one NFTs
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

\`\`\`text
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
    --------  per gym ID, SQLite       via Workers/ephemeral rooms
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
\`\`\`

**Supabase is not a monster, leaderboard, Digital Gold or gym database.** Its identity UID is the stable foreign key for authenticated Cloudflare data. The frontend never receives a Cloudflare admin key or directly edits authoritative records.

**Cloudflare D1** is the shared, queryable canonical store for authenticated players, inventories, encounter tickets/results, Digital Gold ledger, special-event entitlements and public-facing leaderboard projections. **SQLite-backed Durable Objects** own the serialized live gym state, active challenge sessions and canonical sequence of gym leadership transitions. D1 leaderboard is a **read model** updated idempotently from those transitions, not a second competing authority.

For simple operations, start with one Worker API, one D1 database, one gym Durable Object class and the smallest necessary publisher worker/queue; no microservice framework, separate matchmaking database, or Supabase Postgres game tables. Do not deploy cloud services as dependencies of E0 exploration.

## 3. Authentication and save boundaries

### Guest/offline

- Launch and train instantly with local IndexedDB save and existing bounded OpenFreeMap tile cache. The client may run deterministic, reproducible battle rules using locally generated unpredictable seeds from browser \`crypto.getRandomValues()\`. Never rely on \`Math.random()\` for a security-sensitive draw.
- Only Common/Uncommon wild encounters appear offline. **No Rare/Legendary encounter tickets are issued offline**, even when cached tiles exist. Do not cache future online tickets as if they were offline rare spawns.
- Local-only captures and stats are **untrusted** for competitive ownership. A user can edit local storage, fork the frontend, roll back their clock or modify client code. The experience remains complete for training and local play but offers no guaranteed import into authoritative inventory.
- The UI labels monsters as *Local* versus *Verified online*. On login, retain the guest save separately and start a server-authoritative profile. An optional fixed starter/baseline roster can be awarded; importing arbitrary local levels/XP is prohibited. Detailed import policy is open.
- MapCache, collision and virtual avatar travel stay as currently implemented. No mandatory device geolocation is introduced.

### Online identity

- The browser signs in through Supabase Auth only when requesting verified Rare/Legendary encounter eligibility, persistent competitive progression, gym challenges, official events or ranked features.
- A Cloudflare Worker validates Supabase JWT signature using the project's appropriate JWKS, issuer, audience, expiration and user ID (no client-supplied UID trusted). Apply short-lived sessions, logout/revocation considerations and access-control checks before every authoritative mutation.
- Never store gameplay secrets in JWT user-editable metadata, or expose Supabase service keys in the PWA. Verify account status and ownership on the server.
- The authenticated game profile is in D1; no on-chain trainer registration or wallet prerequisite.
- Ordinary local training remains possible when auth, network, Supabase or Cloudflare is down.

## 4. Encounter generation and authenticated rarity

### 4.1 Offline local encounters

- Using visited/cached OpenFreeMap tiles and published game rules, the client schedules Common/Uncommon encounter opportunities based on movement/time/gameplay.
- Use \`crypto.getRandomValues()\` for fresh local seeds, then a deterministic PRNG driven by that seed plus stable counters for reproducible battle effects and debugging. Persist the seed, event counter and resolved result together, preventing accidental rerolls after reload; this is UX consistency, **not** anti-cheat security.
- Disconnected players can explore and collect Common/Uncommon locally indefinitely in cached areas, with no server validation promise. Uncached map regions remain unavailable offline.

### 4.2 Online Rare/Legendary encounters

**Never let a client choose rarity, present a fabricated spawn, or ask for unlimited rerolls.** The recommended MVP is an authenticated, server-issued encounter opportunity rather than a continuous position stream:

1. After login, the client reports virtual travel to the Worker. The Worker maintains last accepted position, server time, eligible distance/encounter counter and any permitted coordinate-jump state for that trainer. Reject implausible high-frequency requests, duplicate IDs and excessive event attempts. GPS is not required; virtual coordinates are **not proof of physical location**.
2. At a deterministic, server-eligible opportunity (for example bounded accepted virtual distance plus cooldown), the Worker **first binds** trainer ID, event sequence, location/region key, map/rules revision, and expiry. The server, not the browser, decides when an online Rare/Legendary lottery happens.
3. The Worker draws secure unpredictable random bytes via Web Crypto (or derives a uniformly distributed result from a keyed server-secret PRF and the immutable opportunity tuple), calculates rarity/species under the versioned drop table, and **atomically stores one immutable ticket/outcome** in D1. Provide idempotent \`opportunity_id\`: reconnects return the same result, not another roll.
4. If Common/Uncommon, the local game may resolve its ordinary encounter. If Rare/Legendary, the server issues an **expiring opaque ticket** with server-stored species, encounter ID, owner, rules, version, location and status. Only this ticket is eligible for a competitive Rare/Legendary capture. Rate/cooldown apply across the account, not to an arbitrarily selected region or browser tab.
5. For Rare/Legendary combat, send actions to a server-authoritative Worker endpoint (or use a persisted turn state machine). The server validates the canonical party, turn order, legal actions, chance/capture rolls and action sequence before awarding the monster transactionally. The frontend merely renders battle animation; submitting a final client-claimed victory or local save is **not sufficient**.
6. Mark the ticket consumed exactly once, write the unique canonical creature instance in D1, and return authenticated outcome. Timeout/abandonment consumes or expires the opportunity under published rules; no refresh reroll.

**Location abuse:** Bitmon's avatar can virtually teleport to coordinates. Server-side speed checks and online eligibility quotas can reduce spam, but no browser-only system can prove actual geographic presence. Do not promise physical-location scarcity or rely on GPS spoof prevention. To prevent location-hopping farming, bind each opportunity's location **before** outcome generation and limit attempts globally; a region can influence species but not grant extra independent draws simply by teleporting. If region-based rarity cannot be validated from existing OpenFreeMap material without relying on client assertions, launch with location-independent high-rarity odds. Never import a second geographic data provider.

**Fairness:** Version published encounter distributions and optionally commit/reveal server seeds in an append-only audit log; transparency is not independent proof that the operator never withholds rolls. Treat the server as trusted for randomness, inventory and anti-cheat. Do not reintroduce ZK, public randomness beacons, mandatory NFT minting or on-chain trainer registration as release prerequisites.

## 5. Inventory, gameplay and trading

- Canonical online inventories, XP, levels, captures, items, rules versions, bans and ownership are stored in D1 and writable only through authenticated server business logic. Clients may cache read models but not authoritatively update them.
- Ordinary online Common/Uncommon capture/XP follows the same published rules; to make these creatures competitive, register them through server-authoritative online capture/progression. **Do not silently promote an editable local save**.
- Preserve prior game-balance intent for ordinary **server-mediated** exchanges: exactly one creature for one of the same rarity tier, one completed swap per trainer per rolling 24 hours, both reset to the lower level. Use an atomic, consented database swap with unique request IDs; no NFT mint, crypto, wallet or open marketplace is involved for normal creatures.
- All rarity tiers can compete in ordinary authenticated gym battles and eligible ranked PvP **without NFTs**; rarity does not require blockchain custody. Local-only monsters are for practice/unranked play unless admitted under a separately verifiable import rule.
- Keep combat pure/deterministic given explicitly supplied seed, legal action sequence and rules version. Share one rules implementation between client for presentation and server for validation; don't duplicate two divergent game engines.
- Do not monetize by selling combat power or randomized transferable collectibles without a separate policy/legal review.

## 6. PvP without a continuous battle server

**Casual/direct PvP (initial scope):**

1. Two players exchange an invite or join a simple optional matchmaking/signaling endpoint in a Cloudflare Worker. Guests may participate without Supabase login.
2. Negotiate an encrypted \`RTCDataChannel\` using WebRTC ICE/STUN; provide a TURN relay fallback for mobile NAT/firewall cases. A QR/manual invite still requires ICE candidate exchange and may fail without TURN. Signaling is a small ephemeral coordination service, **not** the turn-by-turn game engine.
3. Both peers agree on battle rules version, roster snapshot, turn order, initial seed commitment/hash, and an immutable match ID. Each turn exchanges actions/sequence numbers, acknowledgments and, if needed, a commit-then-reveal phase to avoid second-mover advantage. Resolve chance through a combined seed contribution revealed after both sides commit. Missing reveal/disconnect means **void/incomplete**, not a provable loss.
4. Both browsers run the same deterministic combat engine and compare signed/hashed transcript checkpoints. The UI warns about mismatches or aborts. No authoritative ranking, Digital Gold prizes, rarity awards or ownership changes are granted from an untrusted direct match.
5. Peers cannot reliably prevent each other from cheating, stalling, withholding a reveal, manipulating their client or fabricating a local roster. **A trustless competitive PvP system is not achieved by WebRTC or commit/reveal alone.**

**Official ranked/rewarding PvP (future option):** require Supabase login and server-validated rosters/results, a server arbiter or an auditable action transcript with independent server adjudication, disconnection penalties, and explicit ranking rules. A minimal Worker/DO match arbiter could be added if ranked PvP proves valuable; **do not deploy an always-on PvP simulation server for casual matches**. No NFT requirement for ordinary PvP.

## 7. Gyms: Cloudflare Durable Objects

One **SQLite-backed Durable Object per gym ID** is the authoritative actor for that gym's current leader, fixed type, defense snapshot, event/version, active challenges, and result ledger. Every gym permanently has one type; dual-type creatures qualify if either matches. Published game rules define roster constraints, defense updates and cooldowns.

**Official challenge:**

1. Player signs in, has a valid canonical online roster and sufficient **Digital Gold**; local practice fights remain free and do not affect gym ownership.
2. Worker checks JWT and passes a request with idempotency key to the gym DO. The DO freezes the active defense snapshot, checks type/roster/leader eligibility and creates a durable challenge session. Digital Gold is atomically **reserved/debited once** through an authenticated D1 currency operation. Recover safely from a cross-store failure via a durable transaction/outbox state and compensating refund when necessary; never charge twice on retry.
3. The gym DO generates secure server-owned battle entropy. Player sends commands over HTTP turn endpoints or an optional hibernatable WebSocket; DO validates and executes each action against the shared rules engine. This can be an asynchronous fight against an AI defense policy, not a live leader. Persist **every authoritative state transition** in that DO's SQLite storage before acknowledging it.
4. On a legitimate victory, the DO atomically updates its leader/version and an immutable gym win ID, then emits an idempotent event for D1 leaderboard projection and Hall-of-Fame publishing. Failed challenges have no leadership event. If defender changed during the attempt, published lock/snapshot/collision rules decide the result; don't accept a stale defense silently.
5. Worker surfaces the new leader from D1 read model (or the DO when strict freshness is needed); the ordinary player UI does not need to show blockchain. Publish the win on-chain **asynchronously at Bitmon's cost**, not as a condition for immediate leaderboard success.

**Hibernation rules:** Cloudflare's WebSocket Hibernation API is used only if sockets materially improve the game UX. If turn-by-turn HTTP is enough, idle DO eviction already avoids keeping a battle server running. With hibernatable sockets, use \`ctx.acceptWebSocket()\`, socket attachments for reconnect identity, and persistent SQLite for **all important battle state**; in-memory state disappears on hibernation/deployment. Avoid polling timers and loops that keep the DO awake; use alarms for timeouts/retries. An active battle wakes on requests/messages, computes one finite step, persists, and can sleep between actions. This is **not a permanently executing paused process**.

## 8. Digital Gold, monetization, and legal review

- **Digital Gold** remains a non-transferable, non-cashable, off-chain game currency. Initial proposal: earn only through explicitly opt-in, ad-network-permitted rewarded ads; exact credit rate and any necessary free allocation are policy/UX decisions.
- Official gym challenges debit Digital Gold **for the attempt**, not for the blockchain write or a separate post-win claim. The game backend later pays for Hall-of-Fame publication out of its own budget. Winners don't need a wallet, crypto or ad view at the moment of victory.
- Rewarded ads, ordinary ads, and optional subscriptions are ordinary-game monetization; require appropriate publisher permission, privacy/consent and child-protection compliance. There is no guarantee an ad network approves any specific placement or that placing a reward off-chain guarantees compliance.
- No rewarded Digital Gold path may mint, award, purchase, or be redeemable for a **transferable event NFT**. Those collectibles come from **separately administered free, skill-based unique events** with independently specified eligibility, not paid or ad-currency-linked chance.
- Subscription must not grant fabricated competitive results or guaranteed rare-event NFTs. Assess consumer law, app-store/web payment terms, VAT, GDPR, youth audience and gambling/loot-box issues before launch.

## 9. Hall of Fame: company-funded chain publication

- The canonical leaderboard remains in the gym DO, projected into D1. **After** each eligible verified win, enqueue an immutable \`gym_win_id\`, gym ID, version, pseudonymous winner identifier, timestamp and rules/record hash for publishing to a low-cost public chain. No wallet connection is required from the winner.
- A separate publishing Worker funded by Bitmon writes an event/attestation or append-only contract record; persist transaction hash, chain ID, confirmation state and retry status. Use unique event IDs, deduplication and retry logic to prevent double publication on network errors. Queuing/retries cannot roll back legitimate game leadership.
- UI shows the normal centralized leaderboard immediately. On-chain proof is optional behind a detail/share view; marketing may accurately describe a public history of **results certified by Bitmon**. It must **not** claim that the chain independently validated battles, which remain server-authoritative.
- Avoid real names, contact details, precise historic physical locations, or other unnecessary personal data on immutable chains. Player handles and identifiers may still be personal data when linkable; use opaque identifiers/hashes and clear privacy disclosures. A public pseudonym opt-in policy is an open decision.
- Initial preference: one inexpensive on-chain record per official win; if costs grow, consider batching commitments with public inclusion proofs later. No chain transaction is performed for failed challenges.

## 10. Truly unique event monsters and optional NFTs

- Define exceptional events where an explicitly **one-of-one**, distinguishable creature exists with unique art, lore, traits and event history. This is **not** a re-label of all Rare/Legendary creatures or a fungible generated collection. Preserve one canonical event creature ID and a contract invariant permitting **one NFT ever** for that ID.
- The event winner receives a **server-side claim entitlement** in D1. No wallet or crypto is required to win, use ordinary game features, or hold an unminted entitlement. This entitlement is **not yet a blockchain asset**.
- On optional claim, let the winner connect an existing wallet or create an **exportable/recoverable non-custodial embedded wallet**. Require proof of control of the destination address and authenticated ownership of the entitlement; guard mint with a single-use, expiry-checked claim record.
- Bitmon pays initial mint gas and mints the ERC-721 **directly to the player's wallet**, not first to a centralized treasury wallet. A transaction failure must not lose the entitlement; retry safely using minted-event uniqueness checks. Record contract, token ID, chain, transaction and status.
- After mint, **the current on-chain NFT holder** (verified via signed wallet challenge and fresh \`ownerOf(tokenId)\` at important actions) is authoritative for **in-game control of that unique creature**. A sale or external transfer removes the previous player's right to use it; the new holder can link their wallet and claim use. Never rely solely on delayed indexer events or stale D1 mirrors for an ownership-critical battle.
- Transfers/sales are unrestricted by Bitmon; no internal NFT marketplace or secondary sale commission required. Handle marketplace transfers, chain outages, wallet recovery and conflicting in-game sessions with a strict ownership-check policy. Ordinary in-game creatures remain D1 assets.
- Genuine uniqueness supports but **does not guarantee** a MiCA exclusion. Rights, series/economic substance and other EU law still need assessment before offering transferable NFTs; uniqueness is not a legal workaround.

## 11. Security and correctness invariants

1. An unauthenticated client may play locally but **cannot mint verified inventory, change a leaderboard, earn server Digital Gold or issue verified Rare/Legendary tickets**.
2. JWT subject/role are server verified; never trust client-side UID, species, capture outcome, combat win or currency balance.
3. Only a previously persisted eligible online encounter opportunity can produce a verified Rare/Legendary capture; each ticket has one immutable outcome, one consumption and an expiry.
4. Offline, cached or modified local saves do **not** get elevated to canonical combat stats without a separate audited import rule.
5. Only one authoritative gym leader transition is accepted per version; each challenge and currency charge has an idempotent ID; stale defense/duplicate victory submissions do not yield duplicate leadership or on-chain records.
6. Every gym battle turn is validated by the DO against authoritative team/seed/rules and durably persisted before acknowledgment; hibernation/restarts cannot lose a confirmed result.
7. Unranked P2P matches never create independently trusted canonical rewards; transcript mismatch or missing reveals cancels/voids the match.
8. One-of-one event token IDs cannot be minted twice, and unique-monster game usage depends on **current** NFT owner, not old entitlement or database copy.
9. Ad credits cannot be redeemed or converted into transferable NFTs. Hall-of-Fame chain writes have unique victory IDs and no player-gas prerequisites.
10. OpenFreeMap is the sole geographic data source; no missing geographic road/building is invented; virtual travel does not prove physical presence.
11. Local PWA and guest save continue functioning during Supabase, Cloudflare, network, NFT chain or publisher outages within cached-map limits.

### Essential tests when implementation begins

Following \`skill.md\`, keep automated tests minimal and protect only high-impact invariants: (a) one rare ticket cannot be rerolled or double claimed, (b) one gym win/Digital Gold debit cannot double apply after retries, and (c) an NFT transfer revokes the old holder's competitive use. Prefer extending existing tests; these are candidates, **not tests added by this documentation PR**. Use inexpensive targeted manual scenarios for WebRTC fallback, DO wake/reconnect and offline mode.

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
- **Rare ticket protocol:** Decide encounter cadence, probability, server state locks, region mapping from OpenFreeMap, drop-table versioning, rare battle retries and claim expiry. Never let a client buy extra lottery rolls by reconnecting.
- **Guest -> account conversion:** Decide whether a fixed starting roster is granted and how to preserve local progress without trusting it competitively.
- **Gym concurrency:** Leader snapshot semantics, multiple simultaneous challengers, victory race, timeout and refund behavior.
- **WebRTC:** Mobile NAT/TURN cost, disconnections, WebSocket signaling lifetime, room invitation security, cheating tolerance and whether ranked PvP is worthwhile.
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
