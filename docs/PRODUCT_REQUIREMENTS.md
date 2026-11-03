# bitmon — Product Requirements

**Document type:** Player-facing product requirements document (PRD)  
**Version:** 0.34 — optional verified multiplayer, self-funded Rare/Legendary NFTs, and Digital Gold gym challenges  
**Date:** 3 November 2026  
**Status:** Draft; explicitly marked open decisions are not approved requirements  
**Product name:** **bitmon**  
**Creature name:** **bitmon** (singular and plural)  
**Related technical document:** [Technical Design](TECHNICAL_DESIGN.md) (optional verified multiplayer with registration-first authenticity, Digital Gold gym challenges, self-funded NFTs, restricted swaps). This PRD describes **what players should experience**; it is not a replacement for a protocol or security specification. Implementation status and requirement changes are maintained separately in the [Development Tracker](DEVELOPMENT_TRACKER.md).

---

## 1. Product vision

**bitmon is a smartphone-first, installable PWA creature-collection RPG set on a game version of the real Earth.** A player explores streets, paths, parks, neighborhoods, and landscapes corresponding to real places, encounters and trains bitmon, builds a collection, trades under fair rules, and competes to lead gyms.

The **world is mapped 1:1 to the real-world geography represented in OpenFreeMap**: its streets, geographic positions, and building footprints come only from features present in OpenFreeMap tiles, rather than a small fictional map that merely resembles Earth. An absent mapped building or road must stay absent; the game never creates one to fill gaps. OpenFreeMap can be incomplete, so this is a fidelity-to-source promise rather than a guarantee that every real feature has been mapped. It is **rendered as an original low-poly 2.5D top-down/oblique RPG** with simplified geometric volumes, clean silhouettes, restrained shading and materials, and minimal polygon detail. Classic handheld creature RPGs remain a reference for camera and exploration—not a requirement to imitate pixel-art textures or copyrighted assets.

**OpenFreeMap is the only geographic data source**, and **MapLibre** displays and styles its tiles. We add original game art to the **existing mapped geometry**: stylized road surfaces, raised/extruded mapped buildings, roof treatments, facades, windows, characters, and bitmon. Building appearance may be **plausibly inferred** from attributes and surrounding context that OpenFreeMap already exposes; inferred usage is an art choice, not an assertion about the real building. No additional OSM enrichment service, building dataset, custom geography source, or invented road/building geometry is required or permitted.

**The default game is a complete local single-player RPG, with no wallet, blockchain fees or ads required.** Verified multiplayer is an explicit opt-in. Players keep their entire local collection and single-player progress when they opt in, but unverified Rare/Legendary captures can never become verified NFTs or competitive monsters retroactively. The separate verified trainer starts a canonical progression lineage whose results can be validated independently of the original website. The rules, not the client software, determine which competitive rewards are legitimate.

Local single-player can explore, battle, capture and train at every rarity with self-contained saves and reproducible pseudorandomness; such captures have **no verified multiplayer provenance**. After opting in and registering a trainer, authenticated **Common/Uncommon** encounters may be continued offline from cached verified state and finalized in batches. **Verified Rare/Legendary spawns are online-only**, use fresh authenticated public randomness, and require a timely, self-funded ZK-backed claim and NFT mint after capture. Only NFT-minted Rare/Legendary creatures are eligible for gym or player-vs-player competition. Gym challenges are entered with **Digital Gold**, an optional, non-transferable, ad-earned in-app balance; leadership and fame are recorded on-chain. On-chain gym entry and victory settlement remain publicly callable without the advertising service for independent clients.

### Product promises

1. **The real Earth is the world.** A street in the map corresponds to that street's real geographic location.
2. **It feels like a low-poly mobile game, not a navigation app.** Roads and buildings remain recognizable, but everything is presented in a coherent low-poly 2.5D RPG style.
3. **Every neighborhood has a visual identity without fabricated geography.** OpenFreeMap building footprints, land use, roads, waterways, and parks influence the scene; only surface art and facade treatments may be invented.
4. **Local play is complete; competitive provenance is verifiable.** Single-player saves remain yours, while verified encounters and progression follow independently checkable rules.
5. **Most actions are immediate.** Walking, exploring, and ordinary Common/Uncommon wild play can continue locally without blockchain transactions every few seconds.
6. **High-value randomness is fair.** Rare/Legendary **spawns** and competitive chance events use fresh authenticated public randomness where unpredictability is security-critical; ordinary/local chance mechanics use deterministic pseudorandomness instead.
7. **Social competition is simple and fair.** Trading follows fixed restrictions; gyms have permanent type identities and reward reputation, not money.
8. **No single operator controls the protocol.** Players can self-pay protocol fees through independent clients, use alternative hosting, and verify canonical game state; the official gym UI uses Digital Gold.
9. **It lives on the phone.** Players can install bitmon from a browser onto their home screen and play in portrait orientation.

## 2. Decisions and assumptions

### Confirmed product decisions

- The game and creatures are named **bitmon** for now.
- **Smartphones are the primary target.** Bitmon ships as an **installable PWA**, not initially as a native app-store binary.
- **Portrait-only gameplay.** No landscape gameplay layout or support is planned.
- **Low-poly 2.5D** is the required art direction; simple geometric building volumes, faceted or flat-shaded treatments, original art, and low visual complexity.
- **Exploration camera keeps a fixed oblique pitch, but zoom is adjustable with a side slider**. The camera follows the geographic avatar and rotates toward walking heading (heading-up), without allowing manual bearing rotation or tilt.
- **Battles stay in the same 2.5D real-world scene**: the camera zooms/reframes to focus on the encountered bitmon with the surrounding mapped world still behind it, then restores the previous exploration camera state and resumes heading-following behavior.
- **The immediate development objective is exploration only:** a male avatar with a loopable four-direction walking animation, geographic touch movement, and a fixed-pitch, direction-following camera on the OpenFreeMap world. Battle mechanics and blockchain progression are not prerequisites for this first prototype.
- **GitHub Pages has two independently installable channels from the one public repository:** `bitmon Preview` at `/bitmon/preview/` automatically follows approved commits merged into `preview`; `bitmon Stable` at `/bitmon/` follows `main` only after a reviewed release PR. Pages deployment executes from protected `main` context, bundling both channel builds; preview changes never replace the stable code. No second repository required.
- The game world covers **Earth at a geographic 1:1 scale**, using real-world map positions.
- **OpenFreeMap is the sole geographic data source; MapLibre is the map renderer.** No independent OSM API, commercial map provider, enriched building source, or fabricated replacement data is part of the map pipeline.
- **Never generate a building or road that is not represented in OpenFreeMap.** Do not add missing footprints, invent shortcuts, or draw fictional street links. If the source omits a feature, the game omits it.
- Buildings use OpenFreeMap footprints, overlaid in **stylized 2.5D**. Their facade/window/roof art may be invented or inferred from the tile's available fields and local mapped context; visual invention must never add a new physical building or expand its footprint.
- Inferred residential-like styling is allowed as **artistic interpretation**, never as a verified residential label. Ambiguous buildings receive a neutral or plausible generic style.
- **Single-player requires no registration, wallet, ads or blockchain.** A player who opts into verified multiplayer registers a trainer before any verified encounter; registration must predate the relevant public randomness. Old local Rare/Legendary captures remain usable in single-player but are not importable as verified NFTs.
- **Offline verified-play candidates are limited to Common and Uncommon wild encounters; local-only single-player can contain any rarity.** They may be derived from previously authenticated state cached while online and finalized later. Chance-like local mechanics use deterministic pseudorandomness tied to authenticated encounter/battle state and stable event counters, so restarting cannot produce a new roll.
- **Rare and Legendary spawn issuance is online-only.** Account registration is the required prior on-chain commitment; the trainer's eligible slot, randomness round, rules version and any required region/habitat context must already be fixed before the deciding public beacon output exists. No additional pre-spawn or pre-capture transaction is required.
- After a legitimate **verified** Rare/Legendary spawn, battle and capture may use the same local PvE rules as ordinary play. The player funds the **single timely proof-and-NFT-mint transaction with their own cryptocurrency**; Digital Gold cannot fund or authorize minting. The claim verifies the spawn, unused slot and legal resulting state. Unverified local captures cannot be minted retroactively. Exact deadline remains a protocol parameter.
- **Friend battles are online.** Both players commit/sign each turn's actions to each other before the assigned future beacon round; that fresh public randomness resolves security-relevant chance events without an on-chain transaction per turn.
- **Official gym challenges are online and use Digital Gold in the Bitmon UI.** One on-chain pre-battle commitment binds the gym, defense snapshot, challenger team, rules and committed battle strategy before future beacon rounds. A successful victory uses one final proof transaction to record leadership and fame; failure needs no final transaction. The independent on-chain contract permits self-funded calls from alternative clients, without Digital Gold.
- Each gym has exactly **one permanent assigned bitmon type**. Both teams must contain only bitmon with that type; either type of a dual-type bitmon is sufficient.
- Gym leaders may update their eligible defense team but cannot alter the gym type or create additional gym-specific rules.
- **Rare/Legendary NFT swaps are self-funded**, never paid with Digital Gold; swaps remain one-for-one within the same tier, once per trainer per rolling 24 hours, with levels reset to the lower. Common/Uncommon stay as authenticated inventory entries rather than individually minted NFTs.

### Working assumptions, not yet approved

- **Virtual exploration is the primary control scheme:** players move a character through the map using mouse/touch/keyboard/gamepad. A player's real GPS location is **not** assumed to be required. This is different from a location-based game that requires physically visiting coordinates. The movement/travel design must be decided explicitly (§14).
- The geographic **positions and footprints** are 1:1, but art style, perspective, visible building height, and collision presentation may be stylized for readability. This does **not** mean every meter of travel is fun at normal walking speed.
- Desktop browsers may be used for development/debugging, but **desktop-specific and landscape layouts are not product requirements**. The game is designed for upright portrait smartphone screens.
- Offline map coverage remains limited to cached app/map data; the entire Earth map is not available offline. Local-only single-player can produce unverified captures at any rarity. **Verified** offline wild encounters are limited to Common/Uncommon; verified Rare/Legendary issuance and security-critical competitive randomness require connectivity.
- Every bitmon type/rarity, battle rule, starter list, and gym location is still subject to game design unless stated as a confirmed rule above.

## 3. Who the player is and what they do

### Primary player journey

1. **Open or install bitmon on a smartphone.** Explain immediately that local single-player is fully playable without a wallet or ads; official on-chain competition is opt-in and uses Digital Gold for in-app gym challenges.
2. **Begin single-player immediately.** Choose a starter and explore with a local save; wild battles, captures, levels and practice gym fights work without the blockchain.
3. **Understand the boundary before opting in.** The player keeps every local creature and their local save, but pre-opt-in Rare/Legendary captures have no canonical provenance and cannot be minted or fielded in verified PvP/gyms. New verified Rare/Legendary captures are required. Unverified levels/history are not silently promoted to canonical competitive state.
4. **Opt into verified multiplayer when ready.** Create/connect a self-custodial wallet, register a trainer and canonical genesis context **before** any eligible public randomness, and start a separate verified progression lineage. Registration and Rare/Legendary minting are self-funded; no Digital Gold can be spent on NFTs.
5. **Earn Digital Gold optionally.** Watch explicitly opt-in rewarded ads to obtain non-transferable, off-chain Digital Gold usable **only for official gym challenge entry and successful leadership claims in the Bitmon UI**. The sponsor pays underlying network fees without transferring crypto to the player. Digital Gold is not purchased or converted into crypto.
6. **Capture verified creatures.** Common/Uncommon remain authenticated inventory records, not individual NFTs; legitimate online Rare/Legendary spawns use fresh public randomness and a successful catch needs one timely, self-funded ZK-backed NFT mint. Verified Rare/Legendary entries must be minted before use in official gyms or PvP.
7. **Challenge gyms.** Play local practice freely. For official leadership, consume Digital Gold to submit one commitment before the public-randomness battle; a victory consumes Digital Gold for one final proof and puts the winner's fame and leadership on-chain. Defeats need no final claim.
8. **Trade and battle with other trainers.** Restricted NFT swaps are self-funded, and verified PvP checks authoritative monster ownership; signing turn actions off-chain does not require a per-turn gas payment.
9. **Keep playing independently.** The ad/Digital Gold provider can disappear without changing valid smart-contract operations or preventing self-funded participation through other clients; the normal Bitmon interface need not expose gas mechanics.

### Local single-player and verified collection

Local single-player is the actual free game, not a short guest demo. Its save, captures, levels, progress, and practice battles persist after multiplayer opt-in. It is explicitly **unverified**, so no local Rare/Legendary can be backdated, imported or NFT-minted as a canonical encounter; unverified stats and XP cannot be asserted as verified competitive facts. A separate canonical lineage begins only after on-chain trainer registration. Exact treatment of locally earned Common/Uncommon for competitive onboarding is an open anti-cheat design question; any inclusion must follow published, verifier-checkable genesis/import rules (e.g., fixed baseline properties), never an arbitrary client save.

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

The game should not require disclosure of the player's real-world location merely to explore a geographic map. If an optional “go to my location” control is later added, request permission transparently and keep the physical-location data separate from the on-chain trainer identity unless deliberately specified and reviewed. **No mandatory GPS or proof-of-physical-presence rule is approved in this PRD.**

## 7. Encounters, regions, and fair randomness

### ENC-01 — Registration before opt-in verified encounters

**As a player**, I know that my bitmon were legitimately found under the same rules as everyone else's.

- Local single-player needs no identity or blockchain. The separately opted-in verified journey starts with a trainer ID committed on-chain **before** any encounter randomness used by that trainer is published.
- Registration must be finalized and the protocol-defined activation boundary passed before the player is eligible for verified encounters.
- The player can see that registration is pending, active, or failed; a guest demo is a separate non-canonical mode.
- Every eligible trainer has personalized encounter outcomes from fixed identity plus authenticated shared randomness; the player cannot select a different seed or reroll by refreshing a browser. Common/Uncommon offline play may consume previously authenticated cached encounter material, while Rare/Legendary encounter authorization requires fresh online randomness.

### ENC-02 — Encounters belong to the world

**As a player**, I expect exploring a different environment to feel meaningfully different.

- Encounter availability and species may be influenced by a deterministic habitat/region classification derived from geography and game rules.
- **Crucial unresolved design problem:** the game must bind the relevant region/location **before** the random encounter outcome becomes knowable. Otherwise players could scan all Earth locations after seeing a beacon value and select whichever yields a legendary bitmon. This would invalidate fair, location-based rarity.
- The final solution must work with the virtual travel mechanic; map coordinates chosen solely by an untrusted client are not proof that a trainer was there at an earlier time.
- Do not implement location-specific verified encounters as a production feature until this rule is specified and tested against hindsight selection.

### ENC-03 — Familiar RPG encounter loop

- The player meets a bitmon, enters a clear turn-based encounter UI, chooses moves or items, sees the battle resolve, and may attempt capture under the rules for that rarity tier.
- **Common and Uncommon** wild encounters may be played and captured offline when the necessary map data and previously authenticated encounter state are already cached. Their wild combat and capture resolution are deterministic so no hidden client-side reroll exists.
- **Verified Rare and Legendary** encounters are not generated offline; they need fresh authenticated randomness and produce a unique, non-rerollable encounter identity. Local-only Rare/Legendary encounters are possible but remain non-canonical even if played online.
- Registration is the only required prior on-chain commitment for the high-rarity spawn path. The eligible encounter slot and any required region/habitat context must be fixed before its assigned beacon value exists; the player does **not** send a separate transaction before seeing or fighting the spawn.
- Once the Rare/Legendary spawn exists, its battle/capture uses published local PvE rules. Chance-like battle/capture presentation may use deterministic pseudorandom rolls derived from the authenticated encounter state; these rolls are reproducible and are not a second source of security-critical randomness.
- If a verified player successfully captures the Rare/Legendary bitmon, they **self-fund one proof-and-NFT-mint transaction within a short deadline measured from the spawn beacon**. The claim is invalid after that deadline. The proof establishes that the trainer/slot/beacon really produced that species/rarity, the slot was unused, and the claimed post-encounter state follows the rules.
- Ordinary Common/Uncommon local progress can remain pending for later finalization. The UI clearly distinguishes offline-capable ordinary play from online-only high-rarity spawn opportunities and displays the high-rarity claim deadline.

### ENC-04 — Rarity and time budgets

- Rarity is **personal/probabilistic**, not a globally unique cap on a species.
- The offline encounter pool contains **Common and Uncommon only**. Rare and Legendary encounter issuance requires a live authenticated randomness source and therefore does not occur while fully offline.
- Encounter opportunities and XP follow deterministic published quotas so simply running many browser actions cannot generate unlimited valid progress for one trainer.
- Specific rarity rates, epoch schedules, caps, high-rarity claim deadlines, and ordinary combat/capture balance parameters are still to validate; historic concept values are not locked product promises.

## 8. Bitmon collection, progression, and combat

### GAME-01 — Collection

**As a player**, I can view my roster and understand each bitmon's identity and status.

- Each collected bitmon has a recognizable species, assigned type or pair of types, rarity tier, current level, moves, and authenticated provenance for verified captures.
- The collection interface distinguishes **local-only**, **verified pending**, **NFT minted**, and **finalized** states; local-only captures do not gain competitive eligibility on opt-in.
- Common/Uncommon are authenticated inventory records in verified play, not individual NFTs. Rare/Legendary require minted, self-funded, randomness-verified NFTs to enter official gyms/PvP or NFT trading. The collection shows eligibility clearly.
- Original bitmon art, names, types, and UI are required; no copyrighted franchise assets are part of the product.

### GAME-02 — Battles and capture

- Battles are turn-based, strategically understandable, and consistent across supported clients.
- **Wild PvE is deterministic/reproducible at the protocol level.** Mechanics intended to feel random—such as critical hits, accuracy, status procs or an ordinary catch roll if the final combat design uses one—use a deterministic pseudorandom stream derived from authenticated encounter state plus stable domain/event counters. The same state always yields the same sequence, so restarting cannot reroll it.
- **Verified Rare/Legendary security randomness applies to the spawn, not the catch.** A registered trainer's predetermined eligible slot uses fresh authenticated public randomness; one timely self-funded ZK-backed claim mints the NFT after a legal capture. Local-only high-rarity captures are not eligible for retrospective minting; no extra pre-catch commitment is required.
- **Friend PvP is online and interactive.** Players exchange signed/committed turn actions before the assigned future beacon value is revealed. Security-relevant crit/accuracy/status randomness comes from that beacon; normal turn commitments remain off-chain.
- **Official gyms are online and asynchronous against a published defense policy.** The official app requires Digital Gold for the initial on-chain commitment and, on victory, for the final on-chain leadership/fame proof. A free local practice fight has no shared effect. Independent clients can self-fund equivalent permissionless contract calls.
- The same battle rules/UI should consume a common RNG interface: authenticated public randomness when unpredictability is security-critical, deterministic pseudorandomness otherwise. Exact chance mechanics and multipliers remain balance decisions.
- Difficulty and pacing should be tuned for enjoyable play, not just cryptographic convenience.

### CAM-01 — Battle framing in the existing world

**As a player**, when I encounter a bitmon, the view zooms in to show that bitmon **inside the same real-world 2.5D environment**, then returns to normal exploration after the battle.

- Do **not** load a separate abstract battle arena, unrelated illustration, or replacement background. Keep existing OpenFreeMap roads, terrain, and mapped building volumes visible behind the bitmon, rendered in the same low-poly art style.
- On encounter start, smoothly **zoom and reframe** the active exploration camera onto the encountered bitmon (and relevant combat participants), retaining the scene's actual geographic setting and mapping revision.
- Use a combat-suitable close perspective while keeping the same world scene and a readable portrait touch UI.
- When combat finishes or exits, restore the **precise pre-battle bearing, pitch, zoom, avatar-follow framing and heading-follow state**, then smoothly resume automatic direction-following exploration without a fixed north-up bearing or abrupt jump.
- Preserve valid world/avatar location and encounter state across the transition. Camera animation must not change map geometry, prove movement, or create additional road/building features.
- **Implementation timing:** define this behavior now, but defer battle framing until the exploration-only prototype meets its acceptance criteria. The first prototype needs no combat implementation.

### GAME-03 — Saving and restoration

- Single-player saves remain local and playable but cannot automatically become canonical. After verified opt-in, authenticated progress can be proven/finalized on-chain in batches.
- The interface uses distinct states such as **Guest**, **Local pending**, **Submitted**, **Finalized**, and **Needs attention**.
- The player can export or restore user-controlled saved information; a cryptographic state root alone cannot recreate lost game history.
- The player must never be led to believe unsent local state is already guaranteed recoverable from the blockchain.

## 9. Trading with other players

### TRADE-01 — Restricted, understandable swaps

**As a player**, I can exchange a bitmon without enabling one account to receive unlimited farmed rarity or training.

- NFT trades exchange **exactly one finalized, unlocked, NFT-minted Rare/Legendary bitmon for exactly one** from another trainer. Common/Uncommon are not individually NFT-minted.
- Both NFTs must belong to the **same rarity tier**, with self-funded blockchain fees. Digital Gold cannot mint, trade, escrow or transfer NFTs. No gifting, one-sided transfers, cross-tier swaps, or ordinary free NFT transfers are supported.
- After the swap, **both bitmon become the lower of their two prior levels**; non-transferable training-related attributes are reset or remain bound to their original trainer according to the game rules.
- Each trainer can complete at most **one swap per rolling 24 hours**; both parties consume their quota.
- Players preview the exact result, including level changes and cooldowns, before signing.
- A swap succeeds atomically or not at all. The UI communicates failures without leaving a contradictory collection.

## 10. Player-led gyms

### GYM-01 — Permanent gym identity

**As a player**, I can recognize a gym by its permanent required bitmon type.

- Every gym has exactly one assigned type, such as Fire. That type **never changes**.
- Every bitmon on the challenger team and on the current leader's defense team must have the gym's type among its one or two types.
- Example: a **Fire** gym allows **Fire** and **Fire/Wind**, but not **Water/Wind**.
- A leader cannot add gym-specific bans or restrictions on levels, tiers, species, items, or team sizes. Standard global battle rules still apply.
- Team size and other globally applicable battle settings are fixed by the game; the leader does not customize them.

### GYM-02 — Become the leader

- A gym initially has a fixed NPC defense until a player defeats it.
- A local practice battle never changes leadership. For an official gym challenge, the player assembles an eligible verified team; **Rare/Legendary team members must already be minted as self-funded, randomness-verified NFTs**, while Common/Uncommon may appear as authenticated, non-NFT inventory entries. In the official UI, Digital Gold pays for the pre-battle on-chain commitment and, on victory, the final proof that replaces the leader. Future authenticated randomness resolves security-critical chance events. Permissionless self-paid contract calls remain possible through independent clients.
- The successful challenger becomes the current gym leader; the winning team becomes the initial defense snapshot.
- Leaders can update their defense team within published cooldown/activation rules, but **only** with bitmon matching the gym type.
- Defense creatures are locked against trading while assigned, and their battle snapshots are stable until a permitted update.
- The system must reject victories against a stale or incompatible defense state.

### GYM-03 — Recognition, not money

- Official gym success records **on-chain fame and history**: current leader, previous leaders, reigns, successful defenses, and non-transferable badges or equivalent recognition. Digital Gold itself never becomes an on-chain asset.
- No monetary reward or freely transferable reward is attached to gym control.
- The UI shows the gym's type prominently, with a clear explanation of why a bitmon is or is not eligible.

**Placement of gyms in the global Earth map is open.** A gym might be tied to a mapped location, a generated cell, or a curated game point. The mechanism must be consistent worldwide and must not accidentally give map-data-rich regions exclusive access to the core competitive mode.

## 11. Registration, Digital Gold, and independent access

### ACCOUNT-01 — Opt into verified multiplayer

- Local single-player is the default and requires no wallet, fee, Digital Gold or ads. From the first launch, the player learns that official multiplayer requires a separate verified account/provenance path.
- When opting into verified multiplayer, the player creates/connects a self-custodial wallet and registers a stable trainer ID **before** any eligible authenticated encounter randomness. Registration is paid with the player's cryptocurrency, not Digital Gold.
- Previously captured unverified Rare/Legendary bitmon remain in the local collection but **cannot** be minted or used in official gym/PvP teams. New valid verified encounters and timely self-funded NFT claims are required.
- Registration is permissionless and stable across wallet-control rotation under fixed recovery rules; no proof-of-personhood or centralized game account is needed for the on-chain protocol.

### FEES-01 — Digital Gold for gym competition only

- **Digital Gold** is a fictional, off-chain, non-transferable and non-redeemable in-game credit obtained **only through optional, verified rewarded ads**. It cannot be bought, sold, gifted, withdrawn or exchanged for crypto.
- The official Bitmon interface presents **only Digital Gold** as payment for an official gym challenge's pre-battle commitment and successful post-battle fame/leadership claim. Free local/practice gym battles need none.
- An optional independent advertising operator maintains the balance, checks reward completion, and pays transaction gas directly for Digital Gold gym operations. The player receives no cryptocurrency, transferable reward, or gas token. Fee funding is an implementation detail, not a player-facing reward.
- **Never** allow Digital Gold to fund trainer registration, Rare/Legendary NFT minting, NFT swaps/transfers, NFT escrow or self-funded PvP ownership transactions. These operations use the player's own cryptocurrency.
- The sponsor can withhold its own optional service but cannot control game outcomes, mint NFTs, approve canonical rules, or veto a valid independent self-funded contract call. Smart contracts **must not check Digital Gold or require sponsorship**; independent clients may call the same gym contracts and pay their own gas. Therefore "Digital Gold-only" is an **official Bitmon UI rule**, not an on-chain monopoly or a promise of sponsor-independent UI access.
- Do not claim Google or any ad network has approved Digital Gold. Seek explicit rewarded-ad policy review, maintain privacy/consent and anti-fraud safeguards, and provide a policy-independent self-pay protocol route.

### INDEPENDENCE-01 — Continuity

- Users keep local single-player gameplay and saves if the sponsor or blockchain is unavailable; chain-backed competition requires network availability.
- Players should be able to use an alternative compatible client to verify and submit the same canonical gym, capture, swap and PvP-related operations using self-funded cryptocurrency, even without Digital Gold.
- Required map, assets, protocol, and rules versions must support independently maintained compatible clients.
- If the public OpenFreeMap tile endpoint becomes unavailable, players can switch to a mirror or self-hosted copy of the **same OpenFreeMap geographic dataset**; no alternative geometry may be substituted.

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
- Show map loading, offline/unavailable regions, wallet failures, slow proofs, and transaction finality explicitly.
- Do not place interactive content where map attribution, safety messaging, or critical UI overlays become hidden.
- The visual style should support localization and geographic names in different languages and scripts where data permit.

## 13. Release scope and user-visible acceptance tests

The first playable milestone is an **installable portrait-smartphone PWA vertical slice** rather than a finished planet-sized RPG. It demonstrates one real neighborhood with the same generalized pipeline intended for the rest of Earth.

### E0 — First development milestone: exploration-only prototype

**Build this before registration, battles, captures, gyms, trades, ZK proofs, or advertising.** E0 is a focused visual/movement prototype, **not yet the verified game**.

1. Run an installable **portrait-only smartphone PWA** that loads OpenFreeMap through MapLibre.
2. Display a real neighborhood with the original **low-poly 2.5D** rendering, using only actual OpenFreeMap roads and building footprints.
3. Show a small, normal-person-proportioned original **male walking avatar** with **eight directional frame cycles** (including diagonals), an idle pose, and frames advancing only while moving.
4. Move the avatar through real coordinates at **10 m/s maximum** via a **floating joystick that appears only during gestures begun within the middle 80%** of the portrait screen. Support diagonals, frame-rate independence and source-footprint building/water collision; halt at genuinely unknown source geometry.
5. Use an **oblique 45° exploration camera that tilts toward overhead only to reveal the player behind mapped buildings, with a right-side 15.5–18 zoom slider**; follow the avatar and smoothly turn toward actual walking heading, hold bearing while idle, and disable manual camera rotation/tilt.
6. Retain smooth rendering, camera position and walking animation when crossing map tile boundaries.
7. Repeat the demo on a sparsely mapped area; no missing roads or buildings may be procedurally invented.
8. In settings, enter latitude and longitude to jump to a source-validated map location; when the exact coordinate is inside mapped building/water geometry, land at the nearest validated clear point nearby instead of rolling back. Reload the installed PWA to restore last playable coordinates. Walk online to cache map tiles, reopen offline and walk only in cached terrain. At the 100 MiB limit, evict the geographically farthest tiles rather than deleting the player's current area. Reload and confirm camera responsiveness and zoom preferences are restored; keep temporary coordinate-entry text out of the saved settings. When launched from its installed home-screen icon, check Settings for the offline storage protection result and retry if denied; launching in an ordinary browser tab must not request persistence.

**Explicitly deferred after E0:** battle camera transition (CAM-01), encounter rules, wallet registration, proving/finality, trade, gyms, advertising. Their product requirements remain valid for later work.

### P0 — Must work in the first map/game vertical slice

1. Load an arbitrary supported city coordinate with **MapLibre + OpenFreeMap** and display real street/land-use/building geometry.
2. Show the **human-scale, eight-direction animated avatar** and a smooth heading-following, fixed-pitch exploration camera with a visible right-side zoom slider, correct diagonal facing, and an independent middle-screen joystick activation zone.
3. Raise building footprints into stylized volumes and use available building heights or deterministic fallbacks.
4. Show at least **two distinguishable facade treatments** on buildings present in OpenFreeMap (for example generic and residential-like), selected deterministically from available tile fields/context; never claim inferred usage is verified.
5. Keep roads, buildings, player collision, and camera aligned while **moving via touch controls on a portrait smartphone** and crossing tile boundaries.
6. Create a verified trainer before issuing the first authenticated encounter, with clear registration/activation state.
7. Complete one local deterministic encounter, one capture, local pending save, and successful verified finalization.
8. Show errors or degraded rendering rather than falsely implying detailed map data exist where they do not; verify that areas with no source footprints contain **no generated buildings**, and no roads appear where OpenFreeMap contains none.
9. Open the PWA on Android and iOS, install it to a home screen, and launch in an app-like standalone display with all core controls **portrait-first**.
10. Rotate a device that does not enforce portrait orientation; gameplay pauses safely with a **rotate-phone** prompt instead of a landscape gameplay layout.
11. Load the installed PWA from the **GitHub Pages repository subpath**; verify manifest, app assets and service worker paths resolve.

### P1 — Required for a usable first game release

- Map/world streaming across multiple urban and rural test regions; a documented travel mechanism.
- A polished visual vocabulary for existing OpenFreeMap roads, parks, water, vegetation, and several **inferred facade styles**; no additional geographic dataset.
- More species, levels, moves, inventory, quests/progression, and reliable recovery/export.
- Regional/habitat encounter design with a **specified anti-hindsight location commitment model**.
- Same-tier swaps with level reset and 24-hour rate limiting.
- Fixed-type NPC/player gyms, defense team updates, fame history, and challenge validation.
- **Portrait smartphone** performance and touch usability, installability on Android/iOS, offline/error states, map attribution, and alternative OpenFreeMap mirror tests.
- GitHub-only publishing of compiled artifacts to the public PWA repository; exclude original source, credentials, unpublished assets and development source maps.

### P2 — Later enhancements, not release blockers

- Additional decorative variants and roof treatments **on existing mapped buildings**, richer nighttime lighting, seasonal art, animated crowds, and surface-only landmark art (never new building/road geometry).
- Optional localized art packs, more extensive points of interest, or enhanced environmental audio.
- Advanced portability/mirroring, third-party sponsorship integrations, and independently hosted game portals.

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
| Known-beacon location exploit | A player cannot choose a better location **after** seeing encounter randomness and still claim the result as a valid earlier slot. |
| Unregistered account | No verified bitmon can be claimed without pre-registered eligible trainer identity. |
| Animated explorer | Geographic joystick movement uses camera-relative eight-direction poses; vertical thumb input matches the intended direction, the camera turns smoothly toward heading, and idle retains the bearing. |
| Same-world battle camera | On battle start the active camera zooms toward the encountered bitmon while the mapped world remains visible; after battle it returns to the exact exploration framing. **Deferred until after E0.** |
| Fire gym | Fire and Fire/Wind are accepted; Water/Wind is rejected for both attack and defense. |
| Sponsor outage | A player with their own gas and a valid proof can still finalize progress. |
| Installable phone PWA | The app can be installed/launched from Android and iOS home screens with a portrait-first UI. |
| Landscape rotation | Unsupported orientation lock shows a rotate-phone message and preserves session state; no landscape gameplay is implemented. |
| GitHub Pages distribution | Preview installs as a distinct PWA with its own browser-computed manifest ID, purple Preview icon and name, while Stable retains its original identity and `main`-only gameplay. Preview updates after `preview` CI and each service-worker cache remains isolated. No credentials, private code or source maps appear in the Pages artifact. |

## 14. Open decisions blocking detailed development

These questions need product decisions; implementing guesses as if already settled would create significant rework.

1. **Virtual travel versus physical travel:** Is bitmon entirely joystick-driven, GPS-driven, or a hybrid? This draft assumes joystick-driven virtual exploration with **no GPS requirement**, pending confirmation.
2. **Scale and speed:** How quickly should one traverse an actual kilometer? How do players visit distant cities without trivializing exploration?
3. **Map coordinate access:** E0 prototype coordinate jumps are approved for testing anywhere with available map data. Whether a **verified** adventure allows arbitrary starting regions, unrestricted revisits or instant travel remains open; future anti-seed-shopping rules must not trust local saved coordinates.
4. **Encounter location commitment:** Exactly when and how is a region/habitat fixed relative to the public randomness beacon? This is essential to fair, worldwide encounters.
5. **Walkable space:** Does play primarily follow mapped paths, or allow free walking through parks, fields, and plazas? What to do with roads lacking foot-access information?
6. **Facade inference rulebook:** Which existing OpenFreeMap attributes/context influence facade variants, how should uncertain inferences be weighted, and how do source-tile updates affect deterministic art? **No additional geographic data source is allowed.**
7. **Camera/art direction:** **Heading-following bearing is now decided**; open tuning includes fixed pitch/zoom values, turning smoothness, input dead zone, sprite scale/timing, battle easing, roof presentation and building-height stylization. Same-world battle framing remains decided and deferred.
8. **Interiors:** Are any buildings enterable in the first release? No such feature is assumed here.
9. **Gym placement:** How are gyms distributed fairly across a worldwide map? How does a player find and reach them?
10. **Starter and habitat design:** Initial bitmon types, starting conditions, balance of cities/rural areas, and whether region influences **species only** or also rarity.
11. **Map revision consistency:** How often does basemap data refresh, and how do updated streets/buildings interact with saved gameplay/collisions and proof rules?
12. **Device targets:** Minimum Android/iOS versions, smartphone portrait viewport sizes, touch target dimensions, frame rate, browser storage persistence permission/eviction and offline behavior. **100 MiB of cached vector tile data per channel** is the current prototype limit; device-level storage availability and update policies remain to be tested. **Portrait-only smartphone-first is already fixed.**
13. **Release automation:** Main-context dual-channel Pages publishing is decided; only the Stable channel waits for a reviewed `preview` → `main` promotion. Preview publishes after successful `preview` push checks. Long-term release hosting/privacy remains open.

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