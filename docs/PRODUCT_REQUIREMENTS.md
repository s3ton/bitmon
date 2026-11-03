# bitmon — Product Requirements

**Document type:** Player-facing product requirements document (PRD)  
**Version:** 0.36 — distance-based local encounters, online rarity lottery, WebSocket-only concurrent gyms
**Date:** 3 November 2026
**Status:** Draft; architecture accepted, detailed parameters remain open
**Product name / creature name:** **bitmon** (singular and plural)
**Related technical document:** [Hybrid Technical Design](TECHNICAL_DESIGN.md); implementation and decision history: [Development Tracker](DEVELOPMENT_TRACKER.md).

---

## 1. Product vision

**bitmon is a smartphone-first, installable PWA monster RPG played on the real Earth map**, rendered from OpenFreeMap-only geometry by MapLibre with original low-poly 2.5D art. No road/building missing from the actual source may be invented.

**Guest-first game:** Explore and train without an account, advertising or connectivity in cached map regions. Common/Uncommon encounters occur at randomized intervals of a few meters of virtual travel, using device randomness. **Online signed-in encounters use the full published Common/Uncommon/Rare/Legendary lottery**; Rare/Legendary chances are not available to guests or offline players. Cloudflare controls and records the rare roll, validates the online battle and stores canonical results. Normal monsters of every rarity are ordinary game records—not NFTs.

**Supabase is authentication only.** Cloudflare Workers provide authenticated APIs and rare spawn handling; D1 is the game/inventory, Digital Gold, event entitlement and leaderboard database; a SQLite-backed Durable Object per gym runs authoritative battles and hibernates between events. Casual/unranked friend PvP runs through WebRTC peer connections after lightweight signaling, without an always-on match server.

**Gym challenges cost Digital Gold**, a normal non-transferable virtual currency proposed to be earned through optional rewarded ads. The gym Durable Object receives every turn exclusively over a hibernatable WebSocket; there is **no HTTP battle-turn endpoint or fallback**. Multiple challengers can fight a frozen defense version concurrently, but only the first valid current-version victory changes leadership; others superseded by that win receive Digital Gold refunds. Bitmon pays to publish each new champion's fame to a blockchain asynchronously. Players need no wallet or crypto to compete.

**Genuinely one-of-one event monsters** are the exception. Winning a separately administered unique event creates an entitlement in D1; the winner may later connect/create a recoverable wallet and claim the unique freely transferable NFT with **Bitmon paying mint gas**. When traded or sold, the current NFT holder—not the original game winner—controls that particular creature in-game. Ad-earned Digital Gold does not mint, buy or redeem transferable NFTs.

### Product promises

1. OpenFreeMap is the only geography source, with no fabricated road/building geometry.
2. Smartphone portrait gameplay feels like an original low-poly 2.5D RPG, with a same-world battle camera.
3. Account-free offline exploration, training and Common/Uncommon encounters are real gameplay, not a time-limited demo.
4. Every eligible **online** encounter has the same published full-rarity lottery odds; the Cloudflare server issues one non-rerollable random result while offline encounters contain only Common/Uncommon.
5. Ordinary online ownership, trading, PvP and gyms do not require blockchain or NFT ownership.
6. Official gyms use **WebSocket-only Durable Object battles**, allow parallel snapshot challenges with one serialized winner, and publish company-funded Hall-of-Fame achievements.
7. Exceptional one-of-one NFT holders enjoy genuine, freely transferable blockchain ownership with synchronized in-game control.
8. Casual PvP uses peer-to-peer messaging where possible, with honest connectivity and anti-cheat limitations.
9. Optional ads/subscriptions support the business, subject to network and legal approval.

## 2. Confirmed product decisions and working assumptions

### Confirmed

- Keep all existing OpenFreeMap/MapLibre, geographic/collision, low-poly, original avatar, joystick, camera, PWA cache, Preview/Stable deployment and portrait-only E0 decisions.
- **Unregistered offline play:** Common/Uncommon encounters randomly every few meters of virtual exploration, with local device RNG, no account or wallet. We tolerate local/Common/Uncommon cheating. In official gyms all combat-relevant levels/moves/items/stats follow fixed server-approved legal templates, never client-edited stats.
- **Online rarity lottery:** Every server-eligible, logged-in online encounter uses the same published Common/Uncommon/Rare/Legendary probability table, with one secure server RNG draw, immutable D1 outcome and ticket for any Rare/Legendary result. A modest server-clock rate cap prevents script-driven extra lottery requests; we do **not** attempt to prove walking distance or stop Common/Uncommon cheating.
- **Backend:** Supabase Auth only; Cloudflare Worker API + D1 for canonical inventories, rare encounters, ordinary trades, currency, event claims and leaderboard projection; per-gym SQLite-backed Durable Object for challenge concurrency, state and results.
- **Gyms:** One immutable type each, server-normalized legal loadouts, Digital Gold per official attempt. All turns use that gym's **Durable Object WebSocket**, no HTTP turn fallback. Parallel matches bind a fixed defender version; the first completed valid win becomes champion and superseded sessions are refunded. Bitmon queues the Hall-of-Fame chain record after a win; practice fights remain free.
- **Friend PvP:** Browser-to-browser WebRTC DataChannels for casual unranked matches, with small signaling infrastructure, STUN and TURN fallback; no authoritative rewards from untrusted peer transcripts. Ranked PvP would need server arbitration later.
- **Normal creatures:** Common/Uncommon/Rare/Legendary are conventional game data; Rare/Legendary do **not** require minting to join gyms, trade or PvP after verified capture. Authenticated normal swaps retain same-tier one-for-one, once per 24h per trainer, and lower-level reset rules.
- **Exceptional NFTs:** Occasional genuinely unique, one-of-one event monsters only. Unminted winner entitlement can wait without wallet. Free, optional mint direct to a player-controlled recoverable wallet; unrestricted external transfer/sale; blockchain owner controls its in-game use.
- **On-chain Hall of Fame:** Publish only server-verified new gym champion events, asynchronously and at Bitmon's expense; players see the regular leaderboard by default. Chain publication verifies Bitmon's record, not independent battle fairness.

### Working assumptions / still open

- Virtual joystick movement, not mandatory physical GPS. Coordinate jumps and edited offline movement are accepted; basic server-clock lottery throttling avoids unlimited rare rolls without trying to certify meters traveled.
- Browser Web Crypto seeds schedule encounters after randomized distances of a few meters and make local combat reproducible on reload. These improve offline continuity, not tamper resistance.
- Exact randomized encounter-distance interval, server lottery cooldown, rarity odds, region modifiers, rejoin expiry and online rare battle action validation need balancing; the per-eligible-encounter probability rule is fixed.
- No guest-to-online inventory migration is required for gym eligibility: permitted Common/Uncommon species use fixed authoritative gym templates. Exact cosmetic roster appearance and rare/unique ownership rules still apply.
- Digital Gold credit rate, free allocation if needed, ad-network approval, optional subscription terms and consumer/privacy compliance are open.
- Matchmaking, WebRTC TURN relay costs, PvP cheating tolerance, gym simultaneous-session limits, refund deadlines and chain privacy need implementation validation. TURN has nothing to do with HTTP gym turns.
- Legal status of unique NFTs requires case-specific review; "one-of-one" is not an automatic MiCA exemption.

## 3. Who the player is and what they do

1. **Start playing:** Open the PWA and explore cached OpenFreeMap tiles, train and capture Common/Uncommon locally without registration.
2. **Opt into online encounters:** Log in using Supabase Auth to receive server-issued Rare/Legendary encounter opportunities. Cloudflare decides the spawn and verifies the capture; the resulting normal creature lives in the online D1 collection.
3. **Keep local and canonical data distinct:** Local saves persist; edited/offline stats cannot silently become authoritative inventory. A new verified starting roster may be granted under published rules.
4. **Challenge a gym:** Sign in, spend Digital Gold earned from eligible optional rewarded ads, and fight a server-owned gym defender. Practice is free.
5. **Become gym champion:** Win a verified match; the familiar leaderboard updates immediately. Bitmon later publishes public on-chain fame without asking for a wallet or crypto.
6. **Fight friends:** Connect over WebRTC for unranked casual PvP without a hosted battle simulation; some network environments need TURN, and no authoritative rewards depend on the result.
7. **Trade normal monsters:** Use authenticated server-side restricted inventory swaps, not NFTs.
8. **Claim a unique event prize:** Receive an unminted server-side entitlement; optionally link/create a wallet later. Bitmon mints the one-of-one NFT directly to the recipient without charging them, and future on-chain owners can use the monster after proving wallet control.

## 4. The world: a game version of Earth

### WORLD-01 — Real geography

**As a player**, I can visit a recognizable place in bitmon and recognize its geographic layout.

**Requirements**

- The world uses real geographic coordinates and spans the Earth, not merely selected fictional towns.
- Roads, footpaths, coastlines, waterways, land-use areas, and available building footprints derive **exclusively from OpenFreeMap tiles**.
- The underlying mapped geometry is not rearranged, invented, or extended to create game levels. For a fixed OpenFreeMap data revision, the same source feature retains the same geographic position across visits.
- Movement/camera presentation may be stylized, but no invisible change of map scale may make geographic distances inconsistent. Any deliberate fast-travel mechanic must be clearly separate from walking.
- Map content is refreshed periodically; the player should not mistake outdated, incomplete, or user-contributed geographic data for guaranteed real-time facts.

**Acceptance examples**

- A player opens a known neighborhood and sees its recognizable road intersections and park locations.
- Two players visiting the same coordinates see the same physical street/building layout for the same map-data revision, even though their encounter outcomes may differ.
- Traveling to another city loads that city's actual mapped street network without a bespoke game map being authored first.

### WORLD-02 — Roads and paths

**As a player**, I can understand where streets and walkable routes are.

- Roads are drawn from OpenFreeMap-compatible vector data in a consistent bitmon art style.
- Road classes should be visually differentiated where useful: major streets, residential streets, walking paths, tracks, plazas, bridges, and tunnels.
- Decorative styling may change the appearance of **existing OpenFreeMap road/path features** (color, borders, texture, markings) but must not create new road/path segments, intersections, links, shortcuts, or altered route topology.
- Road widths, kerbs, sidewalk strips and lane markings are art: the tiles carry no width, lane or sidewalk data. A sidewalk strip is painted only beside streets whose sidewalks are not already mapped as footways. A painted pedestrian crossing may appear only where a mapped footway crosses a mapped street, covering that footway's own geometry; it does not claim that a marked crossing exists.
- Tunnels, indoor corridors and underground levels are not drawn on the street surface.
- The scene must handle intersections, overlapping bridges, waterways, and road/building ordering without confusing visual occlusion.
- **Walkability is a gameplay rule, not automatically guaranteed by a road drawn on the map.** The game must distinguish rendered map features from traversable game space, including rivers, walls, highways, railways, private areas, and missing access tags.

### WORLD-03 — Nature, neighborhoods, and habitats

**As a player**, a park looks different from an industrial area, and different real-world surroundings can support different bitmon encounters.

- Use available land-cover, land-use, water, transportation, and place data to visually distinguish, for example, parks, woods, grass, farmland, water, residential areas, commerce, and industry.
- Reuse coherent **low-poly 2.5D geometry**, simple faceted/flat materials and a restrained palette across the world, instead of displaying unmodified map colors next to unrelated art.
- Habitat information may inform encounter species or game points **only through fixed, published game rules**.
- If a place lacks reliable tags, use an explicit neutral/default visual treatment instead of asserting a specific local building type or habitat.
- More detailed art may be applied to **existing mapped surfaces and objects** at special places. It must not introduce a fictional building, road, or path.

### WORLD-04 — Global coverage and continuity

**As a player**, I can open unfamiliar regions without the game breaking because no artist has handcrafted them.

- The world should be generated from available geographic data anywhere the map provider has coverage.
- Missing buildings, incomplete roads, or inconsistent tagging must degrade gracefully.
- The game should communicate when map data are missing or a region is not yet playable under the movement rules.
- **No buildings or roads may be procedurally created unless OpenFreeMap contains the underlying feature.** Missing map features remain missing; game markers may appear as UI overlays but cannot masquerade as physical roads or buildings.
- Continents, oceans, islands, and remote settlements should not require hard-coded city maps to be shown.

## 5. Visual direction: low-poly 2.5D top-down RPG

### VIS-01 — Camera and readability

**As a player**, I see the world from a consistent elevated, top-down/oblique viewpoint with spatial depth.

- Use a **low-poly 2.5D scene**: map-aligned ground geometry, low-triangle-count raised building forms, depth-sorted sprites, controlled shadows and sparse decoration.
- Favor **clear silhouettes, simple mesh geometry, cohesive flat/faceted shading and low draw-call cost**, not photorealism or pixel-art textures.
- Frame all gameplay for a narrow **portrait smartphone viewport**; the character, mapped routes and nearby interactions must remain readable.
- **During exploration camera pitch stays fixed; geographic position follows the avatar immediately, but camera bearing uses delayed soft-follow**, only turning after a sustained, stable movement heading. The camera does not automatically flip while walking backward or coast after stopping; short sidesteps and small steering corrections must not abruptly rotate the map. Use shortest-angle damping, a speed cap and a heading dead zone. Prototype camera presets (under a top-right 44 CSS px hamburger button opening an accessible, dismissible settings panel): **Relaxed** 0.7 s delay / 35° per second / 1.2 s damping, **Balanced** (default) 0.4 s / 60° per second / 0.8 s, and **Responsive** 0.15 s / 100° per second / 0.45 s. The heading dead zone is 12° and backward guard is 135° relative to the gesture's input basis. The right-edge zoom slider remains visible outside the settings menu and changes zoom from **15.5–18**, initially **18**, in **0.1** increments. The trainer is drawn larger than true scale so it stays readable at every zoom. Manual drag rotation and camera tilt remain disabled. When a sourced building would cover the trainer, automatically reduce camera pitch only enough to restore a clear line of sight, and ease back to the normal 45° angle when the obstruction passes. Never render the trainer as an always-on-top silhouette through building walls. Render the trainer as a camera-facing textured quad inside MapLibre's 3D WebGL scene so it shares the building depth buffer: wall coverage must occlude only the pixels physically behind the extrusion, allowing legs to disappear while an unobstructed head/torso remains visible. Keep the source-driven camera pitch transition visibly gradual in both directions; brief real occlusion while the camera catches up is acceptable. Do not use DOM-marker visibility toggles, rendered-feature polling, or screen-space clipping for normal building occlusion. Use only actual mapped footprints and their map-rendering heights; preserve camera yaw, zoom, world movement and collision rules.
- The target feel is a classic handheld top-down creature RPG (the fourth/fifth-generation era is a **visual reference only**, not a license to copy character designs, tiles, interfaces, sounds, or maps).
- The main player character retains a nominal 1.8 m projection, but the displayed sprite is scaled to **2×** that projection (and to a **16 CSS px** minimum) for smartphone readability; the geographic position and collision dimensions do not change. Recalculate the sprite when the player changes zoom, keeping the feet anchored geographically. Verify apparent size against buildings on a real phone.
- Perspective, building height exaggeration, and camera pitch are art/UX parameters to test, not claims that geographic features are fully photorealistic.
- The exploration camera normally keeps a 45° 2.5D pitch but temporarily approaches overhead when the source buildings would obscure the player, while following position immediately and turning selectively through sustained movement and tile boundaries. The zoom slider changes presentation only, never position or passability. Later battles restore the exact pre-battle bearing, pitch, **user-selected zoom**, and follow state.
- Labels and major navigation cues must remain readable above or around extruded geometry.

### VIS-02 — Buildings as stylized volumes

**As a player**, buildings occupy the same footprints as the real buildings in the map but look like buildings in a coherent RPG world.

- Convert **only OpenFreeMap-mapped building footprints** into **2.5D building volumes** anchored to their source coordinates; never add a separate building polygon or extend the mapped footprint.
- Use OpenFreeMap height/minimum-height fields when supplied; use a **deterministic visual-only fallback** for missing height data. A guessed height is not a fact about the real building.
- Draw roofs and visible facades with **simple low-poly geometry**, original bitmon flat/faceted materials, restrained shadows, and lightweight windows and facade treatments.
- Geometry and artwork must line up with the ground map; buildings cannot float, visually jump between tiles, or rotate arbitrarily as the camera moves.
- Respect building parts/minimum heights when available; avoid drawing two conflicting building shells for one mapped structure.
- If a building footprint exists but its use is unknown, render a believable **generic or context-inferred facade** without claiming the building is definitively residential, retail, industrial, or civic.

### VIS-03 — OpenFreeMap-only facade and window art

**As a player**, buildings can look like plausible houses, apartments, shops, warehouses, or civic buildings without the game inventing any additional buildings.

**All geography and all evidence for styling must come from the OpenFreeMap vector tiles the client already uses.** This includes source building polygons, available rendered height/minimum height/color data, and any nearby landuse or POI information actually encoded in those tiles. The tile schema does not guarantee a residential/commercial building classification or detailed roof/wall tags.

| Evidence available in OpenFreeMap | Possible art treatment | Guardrail |
|---|---|---|
| Mapped building footprint | Raised building on **exactly that footprint**, with original roof and facade art | No footprint means **no building**; never add another polygon |
| `render_height`, `render_min_height`, `hide_3d`, `colour` if present | Building volume, window-row rhythm, roof position, and palette | Missing values trigger a deterministic visual default, never a factual claim |
| Nearby mapped residential landuse, housing-like street context, or appropriate mapped POIs | Plausible residential-style windows, doors, shutters, or balconies | Context is a **visual heuristic**, not proof of building usage |
| Nearby mapped commercial or industrial landuse / relevant POIs | Plausible storefront, office-window, warehouse, or industrial facade | Do not display an unverified shop/business label |
| Insufficient or conflicting evidence | Neutral/generic building facade with deterministic decorative variety | Never fetch a second dataset or silently invent missing geographic features |
| Existing road/path geometry and class | Game-styled road materials, edges, or markings | No artificial road, path, driveway, bridge, or shortcut |

**Rules for the art system**

- Inventing **surface-level art** is encouraged: windows, roof textures, facade colors, doors, signs without real-world business names, shutters, and decorative details on *mapped buildings*. Their specific appearance is fictional and need not match the actual building.
- Do **not** invent extra building footprints, annexes, freestanding structures, roads, paths, entrances that imply a new traversable route, or other missing physical features.
- Art selection is **deterministic** for a stable source feature or geometry fingerprint, OpenFreeMap data revision, and bitmon art version. A guessed residential-like facade must not change randomly whenever the map scrolls.
- Window positions and facade elements must stay on the visible walls of the existing building; roof treatment and shadows must not make another building appear nearby.
- When context is ambiguous, use neutral variety rather than forcing a specific classification. If inference is used, keep it internal to rendering; no asserted real-world usage labels.
- Never add enrichment queries to raw OpenStreetMap, third-party building databases, proprietary map APIs, aerial imagery, or a custom geographic tile source. A mirror or self-hosted copy of **the same OpenFreeMap dataset/schema** is acceptable for availability.
- Keep the renderer robust across changes in OpenFreeMap tile content, source generalization, and schema versions; a missing field is a normal case.

**Data limitation and intentional trade-off:** OpenFreeMap uses the OpenMapTiles schema. Its common building fields provide geometry and approximate rendering hints, but not the rich original building-use tags needed for reliably identifying residential versus office buildings. **We accept lower classification accuracy rather than introduce another geographic source.** The player's world is faithful to mapped **features**, while building facades remain original artistic interpretations. See §15.

### VIS-04 — Layering and occlusion

**As a player**, the character can pass behind the right objects, and interactive places remain usable.

- The player and NPC sprites must interact visually with building depth, trees, bridges, and props rather than always being drawn on top of everything.
- Use shadows, roof/facade separation, and fade/cutaway behaviors where needed to keep the character visible near tall buildings.
- World markers and interactable points must not be hidden behind roofs or unreadable road labels.
- The map should support an uncomplicated pause/menu state without losing the current camera position.

### VIS-05 — Performance and visual consistency

- Nearby detail loads progressively as the camera moves; distant areas use simpler geometry and fewer decorations.
- Rendered textures/sprites should be cached and reused, not rebuilt for every frame or every building.
- **Performance, touch latency, memory, network transfer and battery life on low-/mid-range smartphones** take precedence over desktop fidelity. Define measurable budgets before settling the facade implementation.
- Dense urban scenes must limit geometry, draw calls, material variation and decoration to remain playable in portrait.
- The scene should remain usable during slow tile loads; show a clear loading/fallback state rather than silently changing geography.
- The renderer must handle dense cities, sparse rural regions, missing heights, multipolygon buildings, zoom changes, and map-tile boundaries.

## 6. Moving through the world

### MOVE-01 — Player movement

**As a player**, I control a character rather than dragging a normal web map all the time.

- Use an **invisible-by-default floating virtual joystick**: a touch/pointer starting in the middle **80% of the portrait screen** (between 10% and 90% of screen height) anchors the joystick under the finger. It appears during the gesture and disappears on release/cancel. The **top/bottom 10%** cannot initiate movement; UI controls, including the always-visible zoom slider and the hamburger settings menu, must capture gestures without initiating movement. Dragging **up** must request screen-forward movement, and dragging **down** screen-backward movement relative to the camera bearing captured at gesture start; the camera only eases toward sustained non-backward travel after a delay, so the screen can still rotate gradually during a long gesture without changing its original geographic control basis. Verify both movement and avatar orientation on a device. Maintain a small dead zone and immediate idle on release. Keyboard is optional for debugging; GPS is not required. Verify initial coordinates are outside mapped buildings/water and place the trainer on a nearby mapped route when blocked.
- Store true geographic longitude/latitude and move at **10 meters per second** at full input deflection; apply analog input magnitude and elapsed time independently of frame rate, source loading and camera presentation. Normalize diagonal speed to the same 10 m/s maximum; avoid background-time jumps.
- Convert joystick control to a stable geographic movement heading through camera turns without a camera/input feedback loop; use accepted displacement to set the camera target bearing, not noise.
- Use only OpenFreeMap source building footprints and impassable-water polygons for minimal collision. Movement continues through **previously verified cached local collision geometry** during transient tile loading and pauses at the cache boundary until new geometry is ready. Missing access data does not justify inventing traversable connections.
- Make orientation comprehensible to the player. A later navigation/access-rights system is required for comprehensive passability and long-distance travel.
- **Touch is the primary input** for moving, exploring and future battle/menu actions in portrait; gamepad support is deferred.

### EXPL-01 — Animated walking avatar

**As a player**, I can control a recognizable male trainer avatar and see him walk naturally in the direction I move.

- Provide an **original** male explorer/trainer design that reads clearly in a low-poly 2.5D portrait scene. No reused character art from existing franchises.
- Use an original **illustrated low-poly/chibi trainer sprite atlas** with **eight visible directions** (N, NE, E, SE, S, SW, W, NW), an idle frame per direction and at least four walking frames per direction. To keep the mobile asset compact, opposite left/right views may share artwork by horizontal mirroring (E↔W, NE↔NW, SE↔SW); diagonal travel must still display the correct diagonal-facing pose. Cycle the frames only while moving.
- Advance walking frames based on elapsed time or actual movement, not map tile loading or display refresh rate. Direction changes update the facing animation without teleporting or snapping the avatar's world position.
- Keep sprite/mesh scale, ground contact, facing, foot positioning, and shadow consistent across frames; the walking cycle should not visually slide or jitter.
- **Touch control** drives geographic movement; derive visible **eight-way** sprite facing from accepted geographic movement heading relative to the rotating camera. Keep sprite-facing, player position and camera orientation distinct. Retain the last heading and idle pose when stopped.
- Allow lightweight prototype sprite frames to be replaced by polished original assets without rewriting movement, animation timing, or camera logic.

### MOVE-02 — Traveling long distances

A 1:1 Earth cannot be practical to explore exclusively by walking at a human-scale speed. A long-term **verified** travel system is necessary but not yet specified. Candidate mechanisms include transport routes, regional travel, or fast travel to discovered locations.

**Exploration prototype only (DEC-030):** The settings menu contains a latitude/longitude text field and **Go** button. Players can jump to any valid Earth map coordinate if its source tile and rendered neighborhood load successfully, either from OpenFreeMap while online or the local offline tile cache. Treat the requested coordinate as a destination anchor: land exactly there when it is walkable; if it lies inside mapped building/water geometry, relocate to the nearest clear source-validated point within a small bounded radius, preferring nearby OpenFreeMap transportation geometry and otherwise searching exact loaded collision geometry. Reject and restore the previous position only when the coordinate is invalid/unavailable or no clear nearby landing can be validated. This is a prototype world-browser tool, **not** a validated travel rule, history of actual movement, region eligibility proof, or permission to choose encounters in a later verified adventure. A future canonical travel mechanic must preserve fair encounter-location rules (§7).

### MOVE-03 — Privacy and physical location

The game should not require disclosure of the player's real-world location merely to explore a geographic map. If an optional “go to my location” control is later added, request permission transparently and keep physical-location data separate from the authenticated game profile unless deliberately specified and reviewed. **No mandatory GPS or proof-of-physical-presence rule is approved in this PRD.**

## 7. Encounters, regions, and fair randomness

### ENC-01 — Every few meters, an encounter

- Using local device randomness, schedule Common/Uncommon wild encounters after a randomized **few meters** of accepted virtual avatar exploration, not a fixed meter interval. Preserve the distance accumulator, next threshold and battle seed on reload.
- **Offline or not signed in:** Only Common or Uncommon appears. Use their relative weights in the local selection. A Rare or Legendary cannot be obtained from a local-only encounter.
- **Online and signed in:** Each **server-eligible** encounter runs one server-owned lottery across **Common, Uncommon, Rare and Legendary**, using the same versioned rarity probabilities for every eligible online encounter. No separate elite-only lottery or hidden purchase. A local encounter triggering before the account's server lottery cooldown is complete remains Common/Uncommon-only.
- No account is needed to walk, train, capture locally or practice gyms.

### ENC-02 — Fair online lottery without movement policing

- Cloudflare authenticates the request, applies a minimal account-wide server-clock spacing limit to prevent automated unlimited **rare rolls**, and binds one immutable encounter ID/region before drawing using secure randomness. The result is persisted in D1; refreshes, reconnects, parallel tabs and failed capture attempts never reroll the same opportunity.
- A region or habitat may affect **species**, using OpenFreeMap-only attributes. It must not let changing coordinates instantly multiply independent rarity rolls. If source geography cannot be reliably evaluated server-side, keep rarity odds region-independent initially.
- We explicitly accept editable local Common/Uncommon saves and spoofed avatar movement. There is no GPS requirement or movement proof-of-presence protocol. Do not equate these relaxed rules with permission to fabricate the authoritative Rare/Legendary results.

### ENC-03 — Online Rare/Legendary capture

- Once the server lottery yields Rare or Legendary, issue one authenticated, expiring encounter ticket. The server validates legal battle moves, capture RNG and ownership before awarding a normal Rare/Legendary monster in D1.
- Common/Uncommon encounters are ordinary local PvE. Online Rare/Legendary encounters must be online for ticket creation and authoritative capture; a disconnected pending ticket can only resume under its explicit expiry rules.
- Normal Rare/Legendary creatures need no blockchain mint, ZK proof, gas, wallet or NFT.

### ENC-04 — Encounter rules and odds

- Keep a **single published probability table for eligible online encounters**; do not change the agreed rarity weights merely because this uses a server lottery. The offline table is explicitly restricted to Common/Uncommon.
- Draw local encounter distances from a bounded few-meter distribution and version the schedule. The exact meter distribution, probabilities and server lottery cooldown are tuning parameters, not yet numerical requirements.
- Basic rate limits protect the authoritative server lottery, not the authenticity of walking. We tolerate cheating in noncompetitive local exploration.

## 8. Collection, progression and combat

### GAME-01 — Local and canonical inventories

- Display local-only and verified-online ownership clearly. Guest saves survive login/restarts. **Official gym Common/Uncommon selection uses permitted species and server-owned standardized levels, stats, moves and items**; no guest save import or proof of historical local training is required. Rare/Legendary eligibility still uses online D1 records and unique event monsters use current NFT owner.
- Normal Common, Uncommon, Rare and Legendary creatures are **database game assets**. None needs an NFT to fight, progress, trade or qualify for gym and ordinary PvP once verified online.
- The online authoritative inventory, XP, trade locks, species, abilities, ownership and gameplay history are written only by Cloudflare server logic to D1.
- Truly unique event monsters are marked as unminted entitlements or minted linked NFTs. After minting, current contract `ownerOf`, checked with wallet signature, decides who may use that creature in-game.

### GAME-02 — Combat and capture

- Keep a **single versioned deterministic battle engine** shared between client presentation and server validation. Randomness is explicit seed/stream input; no client result is blindly trusted as a verified award.
- Local encounters and battles can use private device randomness and tolerate local cheating. Online Rare/Legendary captures and official gyms remain server-authoritative; all official gym stats/items/moves are normalized from a published template.
- Maintain the same-world camera zoom to the battle and restore pre-battle map framing afterward (CAM-01).

### CAM-01 — Battle framing in the existing world

- Camera frames trainer and opponent against the existing OpenFreeMap low-poly scene, not a separate invented battle map.
- Movement, map tile assets and collision remain consistent before and after the transition; a canceled/disconnected battle restores the normal walking scene.

### GAME-03 — Saves and restoration

- Browser IndexedDB stores offline guest collection/progression, map tile PBF cache, camera settings, avatar position and deterministic local encounter state; local writes are bounded and durable as browser storage permits.
- Authenticated canonical monsters, Digital Gold and gyms survive client deletion via Cloudflare data stores. Supabase supplies account identity, not game state.
- Connection loss during rare or gym battle must restore the server-side session by idempotent session ID or apply a documented timeout/failure rule; never duplicate a capture/fee/leader result.

## 9. Trading and player-versus-player battles

### TRADE-01 — Normal monster trading

- For server-owned ordinary game monsters, authenticated trades exchange **one for one in the same rarity tier**, at most one completed swap per trainer per rolling 24 hours. Both revert to the lower of their pre-swap levels. Server validates both owners and executes an atomic trade with replay protection.
- These normal trades use D1 records, **not** NFTs, crypto or gas fees.
- One-of-one event NFTs are **different**: their owner may transfer or sell them externally without Bitmon limits or commission. Bitmon recognizes the new current NFT holder as eligible to use that creature.

### PVP-01 — Casual direct battles without hosted simulation

- Casual guest/unranked player battles use a WebRTC `RTCDataChannel` to exchange match invite, parties, versioned rules, actions and deterministic outcome confirmations.
- Use a lightweight signaling endpoint (Cloudflare Worker) for discovery/ICE exchange; STUN allows peer connectivity in many cases, and a TURN relay is necessary when direct connectivity fails. No continuous Cloudflare battle process is necessary for these matches.
- Peers commit to their choices/seeds before revealing when turn order or randomness could be manipulated; check deterministic transcript hashes. **Client cheating, disconnects and withholding reveal remain possible.** Such battles award no canonical rarity, gym fame, transferable NFT or official leaderboard points.
- If ranked/rewarded PvP is introduced, authenticate users and add authoritative arbitration/result verification; do not call direct peer agreement a secure ranked system.

## 10. Player-led gyms and on-chain Hall of Fame

### GYM-01 — Stable identity and roster rules

- Each gym occupies a fixed mapped location and has exactly one permanent bitmon type; teams qualify when creatures contain that type, including dual-type creatures. Do not invent new world geometry for gyms.
- Gym defender roster and battle policy can be updated only under the published leader update/lock rules. Current state and challenge session are owned by that gym's **SQLite-backed Cloudflare Durable Object**.

### GYM-02 — Digital Gold official challenge

- Only authenticated players can issue official challenges. Spend **Digital Gold before an attempt**; the balance is a Cloudflare-managed off-chain game ledger, not a blockchain transaction, gas-sponsorship service or cryptocurrency.
- The Worker verifies identity; the gym Durable Object accepts the player's **WebSocket**, reserves Digital Gold once, freezes the current leader/defense version, runs and persists each battle turn, and handles reconnect/timeout over the socket. Multiple simultaneous snapshot challenges may coexist.
- **Only a hibernatable WebSocket connects a player to gym gameplay.** No HTTP turn endpoint, polling, or HTTP fallback. The initial connection uses HTTP Upgrade (a transport handshake, not a turn API); DOs wake per message and SQLite persists game state across hibernation/redeployment.
- **Concurrency:** many players may battle the same frozen defense version; the **first serialized valid win** against the currently active version becomes champion. Other sessions made stale by that change cannot take the gym and receive an idempotent **Digital Gold refund**. Valid losses charged before a leadership change remain normal losses. D1 projects the resulting leader read model.
- A valid victory also queues one asynchronous **Bitmon-funded** public-chain Hall-of-Fame record. The result is visible in-game before chain confirmation; players need no wallet, NFT or cryptocurrency.
- The blockchain **certifies Bitmon's published result**, not independently enforced battle fairness; server-authoritative gym rules determine winners.

### GYM-03 — Fame and history, not money

- Historical leaders, reigns, champion records, badges and ranked dates are ordinary server data visible in a traditional leaderboard.
- Public-chain records contain minimal pseudonymous achievement metadata; no unnecessary real names or location histories. On-chain history exists for bragging rights and publicity, not financial rewards.

## 11. Authentication, Digital Gold, and one-of-one collectibles

### ACCOUNT-01 — Supabase only for opt-in identity

- No login while exploring, training or capturing ordinary local Common/Uncommon. Login is needed for online Rare/Legendary eligibility, server-stored competitive inventory, official gyms, unique event claims and any ranked system.
- Supabase Auth provides signed identity; Cloudflare Workers verify tokens and own all gameplay authorization. Do not use Supabase Postgres tables to store bitmon or currency.
- Signing out preserves the guest collection and disables new verified requests without erasing already earned server collection.

### FEES-01 — Conventional in-game Digital Gold

- Digital Gold is an off-chain, non-transferable, non-redeemable **in-game** balance, initially intended to be earned via explicit opt-in rewarded ads. No gas-equivalent dollar balance or blockchain fee mechanism.
- Official gym attempts consume a published amount; free local practice continues without ads. Bitmon separately budgets/pay for Hall-of-Fame chain fees on **wins only**.
- Advertising, any subscriptions, age-appropriate consent, and reward policies require approval/compliance validation. No Digital Gold or purchased credits may redeem or entitle a transferable unique NFT.

### NFT-01 — Exceptional one-of-one monsters only

- Separate free gameplay events may award an exactly-one-off creature with distinct art, lore and historic provenance. One D1 grant reserves that singular monster to the winner while unminted.
- Player can keep playing without creating a wallet. Later they may connect an external wallet or create a **non-custodial recoverable/exportable embedded wallet**; Bitmon mints the NFT directly to that address and pays gas.
- After minting, **current NFT ownership controls use of that particular bitmon in-game**; external sale/transfer removes original owner's right and grants the new holder's right after wallet authentication/current ownership check. No Bitmon NFT marketplace or resale commission required.
- Contract prevents duplicate issuance for the unique event monster. A one-of-one is not automatically outside MiCA or other applicable laws; obtain a legal review before launch.

### INDEPENDENCE-01 — Outages and durability

- Network/server/auth outages do not block cached local game exploration or Common/Uncommon training. Online rare spawns, official gyms and authenticated multiplayer necessarily need Cloudflare/Supabase.
- Unlike the former decentralized proposal, **canonical game progress and gym rules are operator-controlled**. On-chain Hall of Fame only preserves what Bitmon published; unique NFT ownership remains independent, although in-game use requires Bitmon's running server.

## 12. Mobile PWA experience, UX, and accessibility

### MOBILE-01 — Smartphone-first, portrait-only gameplay

**As a player**, I can play bitmon on my smartphone held upright, using touch controls throughout.

- Registration, exploration, combat, collection, trades, gyms, menus, and wallet prompts are laid out for **upright portrait phone screens**.
- **No landscape gameplay UI** is designed or maintained. Where the device/browser ignores the portrait preference and rotates to landscape, preserve local state, temporarily pause gameplay if necessary, and show a concise **rotate your phone** prompt.
- Respect notches, rounded corners, safe areas, virtual keyboards, and varying portrait aspect ratios; keep controls and the playable world visible and accessible.
- All essential actions must be usable by touch with comfortable thumb targets. Do not require keyboard, mouse, controller, or desktop display.

### PWA-01 — Installable mobile web app

**As a player**, I can visit a public HTTPS link, install/add bitmon to my phone's home screen, and launch it without an app store.

- Provide a standards-based PWA manifest (name, icons, start URL, scope, `display: "standalone"`, and `orientation: "portrait"`) with installable HTTPS hosting.
- On Android and iOS, provide the appropriate install/Add to Home Screen guidance. The first release needs **no downloadable APK/IPA** and no store listing.
- **Portrait preference is not a universal hardware lock**. Some browsers, notably iOS browsers, may not honor orientation settings; use the **MOBILE-01** fallback instead of relying on an unsupported API.
- Cache a lightweight application shell and preserve unsent local progress where feasible. For exploration, remember the last verified playable geographic avatar coordinate in channel-prefixed browser local storage and restore it on launch. Cache only OpenFreeMap vector tiles actually requested through normal play, with a **100 MiB per-channel tile-data budget**: when full, remove the geographically farthest stored tiles from the current player position first, protecting the player's own tile. Movement into uncached/unloaded map tiles must be blocked offline; coordinate jumps also require usable destination map data and collision validation. Remember user-selected **camera responsiveness and zoom** across app restarts, independently for Preview and Stable. Use a single channel-specific settings store for all present and future configurable input/select controls, rather than separate per-setting storage implementations. Future settings must opt into this store; one-off action fields (such as coordinate teleportation input) must not be saved as preferences.
- On installed standalone PWA launches, check whether browser origin storage is persistent and request `navigator.storage.persist()` if not. Show the granted/denied/unsupported state in Settings, with a user-initiated retry after denial; do **not** request persistence from an ordinary browser tab. Granting persistence protects against automatic storage eviction, but cannot prevent users from clearing app/site data. **Permission and quota belong to the website origin rather than the manifest app ID or service-worker scope:** Preview and Stable still share the same origin-level storage permission and quota on GitHub Pages, although their map databases and player saves are separated by channel. True installation-exclusive storage is not guaranteed by the current hosting arrangement. The 100 MiB tile budget does not include browser-managed HTTP cache or application shell. `Preview` and `Stable` must have genuinely distinct, browser-computed manifest IDs, start URLs, visible names/icons and service-worker scopes. **Do not use relative `id: "."` for both**; that may resolve both to the same origin-root install identity. Keep the currently installed Stable manifest ID unchanged; Preview must use an explicit unique origin-relative path. Use channel-prefixed CacheStorage and future local-save keys. Updating either channel must not delete or overwrite the other's shell or progress. Do not imply the whole Earth, missing map tiles, network randomness, or blockchain transactions are available offline.
- A connectivity loss or app update must not silently discard pending progress. When a new application version is ready, notify the player and offer a deliberate reload rather than interrupting their active exploration. Clearly indicate unavailable features, loading failures, and the distinction between locally saved and finalized state.

### DIST-01 — Test distribution from the public source repository

**As a tester**, I can install `bitmon Preview` from `https://s3ton.github.io/bitmon/preview/` while keeping an independently installable `bitmon Stable` at `https://s3ton.github.io/bitmon/`.

- The repository **`s3ton/bitmon` is public**. For this exploration prototype, GitHub Actions deploys directly to its GitHub Pages site; do not create a separate distribution repository.
- Publish **only the compiled `dist/` output**—HTML, CSS, JavaScript, manifest, service worker and icons/assets. Never include credentials, development sources, docs or Git history in the deployed artifact. Public repository content is independently visible by design.
- Set GitHub Pages **Build and deployment → Source → GitHub Actions**. The protected Pages job runs from `main` on a `main` push, manual dispatch, or successful **push CI** completion on `preview` (trusted same-repository branch only). The job compiles both `main` and the checked `preview` SHA and uploads a single Pages artifact, with `/bitmon/` stable and `/bitmon/preview/` experimental. Only a separate reviewed release PR changes stable gameplay; no feature branch or pull request may directly deploy Pages.
- Both channels must have correct relative asset URLs, **different computed manifest IDs** (Preview explicitly `/bitmon/preview/`), visibly different home-screen names/icons, and individual service-worker scopes (`/bitmon/` and `/bitmon/preview/`). The original Stable ID remains unchanged. Cache cleanup is restricted to the owning channel. Main's broader worker must not intercept preview-subpath requests. Because browser storage is origin-wide, future local saves must be prefixed by channel rather than relying on distinct URL paths.
- The site is a **public test prototype**, not a completed or verified game. The shell and previously visited source tiles can load offline; unexplored or evicted OpenFreeMap map areas require connectivity.
- Production release hosting is a separate future decision. Do not automatically deploy from every pull request.

### UX-01 — Usability and accessibility

- The player has a clear world view, an obvious current position, nearby interactive points, and a readable party/collection panel.
- **Touch is mandatory** for all player-facing interactions; text, overlays, actions and maps must fit common **portrait smartphone** screens. Keyboard controls are optional for developers.
- Use clear contrasts and symbolic cues alongside type colors, especially for color-vision accessibility.
- Important game interactions do not rely on tiny map markers or precise pixel tapping.
- Show map loading, offline/unavailable regions, optional login errors, verified encounter expiry, gym reconnect status, and delayed Hall-of-Fame publication clearly.
- Do not place interactive content where map attribution, safety messaging, or critical UI overlays become hidden.
- The visual style should support localization and geographic names in different languages and scripts where data permit.

## 13. Release scope and user-visible acceptance tests

The first playable milestone is an **installable portrait-smartphone PWA vertical slice** rather than a finished planet-sized RPG. It demonstrates one real neighborhood with the same generalized pipeline intended for the rest of Earth.

### E0 — First development milestone: exploration-only prototype

**Build this before authentication, battles, captures, gyms, trades, server randomness, blockchain achievements, or advertising.** E0 remains a focused visual/movement prototype, not the complete RPG.

1. Run an installable **portrait-only smartphone PWA** that loads OpenFreeMap through MapLibre.
2. Display a real neighborhood with the original **low-poly 2.5D** rendering, using only actual OpenFreeMap roads and building footprints.
3. Show a small, normal-person-proportioned original **male walking avatar** with **eight directional frame cycles** (including diagonals), an idle pose, and frames advancing only while moving.
4. Move the avatar through real coordinates at **10 m/s maximum** via a **floating joystick that appears only during gestures begun within the middle 80%** of the portrait screen. Support diagonals, frame-rate independence and source-footprint building/water collision; halt at genuinely unknown source geometry.
5. Use an **oblique 45° exploration camera that tilts toward overhead only to reveal the player behind mapped buildings, with a right-side 15.5–18 zoom slider**; follow the avatar and smoothly turn toward actual walking heading, hold bearing while idle, and disable manual camera rotation/tilt.
6. Retain smooth rendering, camera position and walking animation when crossing map tile boundaries.
7. Repeat the demo on a sparsely mapped area; no missing roads or buildings may be procedurally invented.
8. In settings, enter latitude and longitude to jump to a source-validated map location; when the exact coordinate is inside mapped building/water geometry, land at the nearest validated clear point nearby instead of rolling back. Reload the installed PWA to restore last playable coordinates. Walk online to cache map tiles, reopen offline and walk only in cached terrain. At the 100 MiB limit, evict the geographically farthest tiles rather than deleting the player's current area. Reload and confirm camera responsiveness and zoom preferences are restored; keep temporary coordinate-entry text out of the saved settings. When launched from its installed home-screen icon, check Settings for the offline storage protection result and retry if denied; launching in an ordinary browser tab must not request persistence.

**Explicitly deferred after E0:** battle camera transition (CAM-01), local encounters, server-authoritative online rare eligibility, PvP signaling, gym Durable Objects, advertising and optional on-chain publishing/NFT claims. E0 does not depend on any backend.

### P0 — First map/game vertical slice

1. Preserve E0 OpenFreeMap-only real geometry, collision and smartphone controls, without fabricated missing roads/buildings.
2. Add a complete account-free local Common/Uncommon encounter/capture loop using browser device randomness, deterministic combat animation and IndexedDB save/reload; offline on cached map data.
3. Provide a distinct login affordance only when requesting online Rare/Legendary access, official gyms or saved verified progression. Supabase is not needed for opening the game.
4. Demonstrate one authenticated Cloudflare-issued online Rare/Legendary opportunity: one server roll, no refresh reroll, authoritative battle/capture and D1 collection, with no wallet or NFT.
5. Run same-world camera battle framing and restore geographic exploration controls afterward.
6. Continue to support portrait-only installed Android/iOS PWA, the GitHub Pages Preview/Stable identities and map-source integrity gates.

### P1 — Required for a usable release

- Cloudflare Worker API, D1 authoritative inventory/currency, Supabase Auth-only integration, abuse controls and account/guest save boundaries.
- One type-fixed gym with server-owned, SQLite-backed Durable Object challenge state, persistent battles, Digital Gold debits, leadership/defense updates and centralized leaderboard.
- Optional rewarded-ad integration only after publisher/privacy review, with appropriate non-ad availability for the rest of the game.
- WebRTC direct casual/unranked PvP with lightweight signaling and tested TURN fallback; no invented claim of cheat-proof ranked results.
- A Bitmon-financed, asynchronous, idempotent Hall-of-Fame publication for verified gym wins; failure of chain publication cannot block the result.
- Stable mobile PWA, ordinary inventory swaps, multiple real mapped regions, original battle art, accessibility, export/recovery, GDPR/privacy and cost monitoring.
- Keep E0's source-fidelity/portrait/PWA deployment gates unchanged.

### P2 — Optional later additions

- Exceptional unique event-monster entitlement and free-to-player one-of-one NFT minting, recoverable wallet creation, current-holder in-game access after external transfer, and legal/security review.
- Ranked PvP with authoritative arbiter if demand warrants it; more extensive matchmaking, habitat detail from OpenFreeMap-only tags, art packs, additional gym modes and optional cosmetic subscription.
- More elaborate public on-chain gym explorer or batched proof strategy if public records become expensive.
- Decorative/seasonal art strictly on mapped geometry; never invent missing geography.

### Acceptance scenarios for the map team

| Scenario | Pass condition |
|---|---|
| Real intersection | A selected intersection represented in OpenFreeMap has matching road geometry and connectivity; no new road links are generated. |
| Mapped residential-looking block | At least one OpenFreeMap building receives the approved residential-like window set based on documented tile context; it is not presented as a verified residence. |
| Building with unknown class | A generic or tentative context-based facade appears without asserting an actual residential/commercial building use. |
| Tall vs short building | Different OpenFreeMap `render_height` values produce appropriately distinct raised forms, with a documented visual-only fallback when unknown. |
| Tile seam | A road and facade crossing a tile boundary do not visibly separate or change style. |
| Dense city on smartphone | Low-poly gameplay remains responsive on an agreed low-/mid-range portrait device, with predictable level-of-detail fallback. |
| Sparse rural area | The scene degrades gracefully when buildings or roads are missing in the tiles; the renderer never fills them in by invention. |
| Different trainer at same location | Physical map layout is consistent; encounters may differ by trainer identity. |
| Online rare farming | Refreshing, reconnecting, changing tabs or teleporting cannot grant extra independent Rare/Legendary rolls beyond the account's server-issued opportunity quota. |
| Guest training | Common/Uncommon training works offline without account; attempts to request an authoritative Rare/Legendary encounter require a valid Supabase session. |
| Animated explorer | Geographic joystick movement uses camera-relative eight-direction poses; vertical thumb input matches the intended direction, the camera turns smoothly toward heading, and idle retains the bearing. |
| Same-world battle camera | On battle start the active camera zooms toward the encountered bitmon while the mapped world remains visible; after battle it returns to the exact exploration framing. **Deferred until after E0.** |
| Fire gym | Fire and Fire/Wind are accepted; Water/Wind is rejected for both attack and defense. |
| Chain outage | Gym victories update D1/DO leaderboards without waiting for the Bitmon-funded on-chain Hall-of-Fame transaction; publication retries later. |
| Installable phone PWA | The app can be installed/launched from Android and iOS home screens with a portrait-first UI. |
| Landscape rotation | Unsupported orientation lock shows a rotate-phone message and preserves session state; no landscape gameplay is implemented. |
| GitHub Pages distribution | Preview installs as a distinct PWA with its own browser-computed manifest ID, purple Preview icon and name, while Stable retains its original identity and `main`-only gameplay. Preview updates after `preview` CI and each service-worker cache remains isolated. No credentials, private code or source maps appear in the Pages artifact. |

## 14. Open decisions blocking detailed development

These questions need explicit product decisions; do not mistake unmeasured parameters for confirmed requirements.

1. **Encounter cadence/lottery:** keep the agreed online rarity probabilities every eligible encounter; tune few-meter local trigger distribution and a minimal account-clock lottery throttle, ticket expiry and retries. No client-distance anti-cheat.
2. **Habitat balance:** validate any species/region modifier from OpenFreeMap-only data; until safe, use location-independent rare odds.
3. **Gym roster templates:** decide exact allowed levels, species, stats, moves and items for local Common/Uncommon in official gyms; do not import untrusted local stats. No separate guest-to-online migration blocker.
4. **Gym concurrence:** parallel frozen-defense fights and first serialized current-version winner are decided; tune session capacity, stale refund idempotency, expiration and disconnect policy.
5. **PvP connectivity:** acceptable STUN/TURN coverage, QR invites/signaling, mobile network fallbacks and whether ranked reward-bearing matches justify a server arbiter.
6. **Advertising and subscriptions:** Digital Gold pricing, age/consent eligibility, no forced ads for offline game, reward policy approval, subscription terms and fees.
7. **Hall of Fame:** on-chain network, one transaction per win versus batch threshold, publisher retry costs, privacy treatment of public pseudonyms, on-chain record schema.
8. **Unique event NFTs:** actual one-of-one criteria, event award fairness, mint wallet recovery and contract chain, transfer/owner synchronization, licensing and MiCA/legal assessment.
9. **Map controls and world:** fast virtual travel, world geometry integrity, walkable/offroad rules, gym distribution, map revision cadence and no alternate geography sources.
10. **Art and device targets:** original creature art, battle rules and chance tables, camera tuning, minimum portrait mobile devices, PWA storage/cache limits and source attribution.
11. **Production infrastructure:** Cloudflare Worker/D1/DO/Queues costs, persistent backups, Supabase Auth recovery, monitoring, operational security and alternative hosting after GitHub Pages prototype.

## 15. Map data and implementation constraints (supporting notes, not player-facing features)

These notes distinguish the desired player experience from the information actually available in the selected map source.

### Geographic-source rule

**Only OpenFreeMap vector tiles and their included attributes are permitted as the geographic source for the bitmon world.** MapLibre renders and styles those data. Original art and deterministic game logic are permitted, but must not invent geographically represented buildings or roads.

- **Allowed:** OpenFreeMap public tiles, downloaded OpenFreeMap tile extracts, or self-hosted/mirrored copies of the same source data; MapLibre; original bitmon sprites, textures, procedural building facades, and visual effects.
- **Not allowed for map geometry or inference:** supplementary raw OpenStreetMap lookups, separate OSM enrichment feeds, other basemap providers, third-party building data, satellite/aerial interpretation, or user-generated geometry that changes the canonical map.
- **No fabricated geometry:** buildings may be raised only where a building footprint appears in the current tile data; roads/paths may be drawn only where corresponding transportation features appear. The game cannot insert a missing residential block, alley, street, driveway, bridge, or shortcut.
- **Source incompleteness:** If OpenFreeMap omits a real-world feature, bitmon omits it as well. Do not claim completeness of Earth beyond the source's coverage or precision.
- **Game features:** UI markers for battles, gyms, and other gameplay objects can exist without pretending to be new geographic roads or buildings. If a location needs physical representation, attach it to an existing mapped feature or represent it as a non-physical interface element.

### Map stack

- **OpenFreeMap:** sole source of world geography. Its public service and downloadable/self-hostable tiles are based on OpenStreetMap and use the OpenMapTiles schema. The OpenFreeMap map-layer information is not a comprehensive database of every original OSM tag.
- **MapLibre GL JS:** map visualization and polygon extrusion, with a custom rendering layer or sprites where needed for facade/roof/window art.
- **bitmon art layer:** deterministic render rules, sprite textures, building volume treatments, ambient decoration, collision rules, and cache management, always anchored to existing map geometry.
- **No enriched geographic feed:** the deliberate product decision is to infer a believable visual language from the OpenFreeMap attributes already delivered. Trade precision for simplicity; do not expand to separate data sources without a new, explicit product decision.

### Building and road rendering precedence

1. **Existence test:** Build a visual structure **only if** OpenFreeMap contains a building polygon; draw a road/path **only if** the transportation layer contains that line or area. No source feature means no rendered physical feature.
2. **Building geometry:** Use its polygon, mapped parts, `render_height`, `render_min_height`, `hide_3d`, and `colour` when available. Respect building-outline or part flags; avoid overlapping duplicate volumes.
3. **Unknown height:** Choose a deterministic, visually sensible fallback **for an already-mapped building**; never present it as a measured height.
4. **Facade selection:** Evaluate only tile-provided contextual signals (including mapped nearby landuse/POIs where present) and stable feature/geometry fingerprints. Choose a visual facade category with an explicit fallback for missing or conflicting evidence. Inference is **art**, not an asserted building classification.
5. **Windows and roofs:** Place original decorative patterns on the mapped building's visible surfaces; do not extend its footprint or create neighboring structures.
6. **Road styling:** Keep mapped road/path positions and topology intact. Stylized widths, textures, colors, or outlines must not create fictitious navigable connections.
7. **Consistency:** Version the OpenFreeMap source snapshot and art rules when practical so player views and collision behavior can be reproduced across sessions.

### Important restrictions

- **Attribution:** display the required credits for OpenFreeMap/OpenMapTiles/OpenStreetMap in accordance with the chosen tile style and source licenses, including when rendering with original bitmon art.
- **License:** OpenFreeMap software licensing does not erase OpenStreetMap underlying database obligations; confirm requirements for redistribution/self-hosted tile copies.
- **Availability:** OpenFreeMap public hosting is an external dependency and has no guaranteed SLA. Permit compatible self-hosted/mirrored OpenFreeMap tiles without mixing in new geography.
- **Tile generalization:** Tiles may simplify or omit features at different zooms. Gameplay should use a documented appropriate zoom/detail level and should not extrapolate unobserved building/road geometry.
- **Claims:** building type and facade visualizations are not authoritative real-world descriptions or navigation advice.
- **Visual IP:** all bitmon art, sprites, music, text, and UI must be original or appropriately licensed.

### Reference material (reviewed 2 November 2026)

- OpenFreeMap overview, data distribution, attribution, licensing: https://openfreemap.org/
- OpenMapTiles schema and available `building`, `transportation`, `landuse`, and POI attributes: https://openmaptiles.org/docs/schema/
- MapLibre building extrusion: https://maplibre.org/maplibre-gl-js/docs/examples/display-buildings-in-3d/
- MapLibre custom layers: https://maplibre.org/maplibre-gl-js/docs/API/interfaces/CustomLayerInterface/

---

## 16. Definition of done for this document

This PRD is a **versioned development baseline** that guides implementation by describing the experience a player should receive. Every numbered requirement has a row in the [Development Tracker](DEVELOPMENT_TRACKER.md); progress and decision history are updated there, separately from normative product requirements. Exact game mechanics, cryptographic circuits, smart contracts, map-data processing, art pipeline, and architecture should live in separate implementation specs aligned to this PRD.

**The next product decision with the highest downstream impact is how players travel through 1:1 Earth and when their encounter region is committed.** It directly affects navigation, world design, fair spawns, and whether real-world map data can safely drive gameplay.