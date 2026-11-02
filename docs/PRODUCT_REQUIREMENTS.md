# bitmon — Product Requirements

**Document type:** Player-facing product requirements document (PRD)  
**Version:** 0.7 — Task 002: heading-following camera, geographic touch movement and directional avatar; retains main-only Pages release workflow  
**Date:** 2 November 2026  
**Status:** Draft; explicitly marked open decisions are not approved requirements  
**Product name:** **bitmon**  
**Creature name:** **bitmon** (singular and plural)  
**Related technical document:** [Technical Design](TECHNICAL_DESIGN.md) (registration-first verified play, fixed-type gyms, restricted swaps). This PRD describes **what players should experience**; it is not a replacement for a protocol or security specification. Implementation status and requirement changes are maintained separately in the [Development Tracker](DEVELOPMENT_TRACKER.md).

---

## 1. Product vision

**bitmon is a smartphone-first, installable PWA creature-collection RPG set on a game version of the real Earth.** A player explores streets, paths, parks, neighborhoods, and landscapes corresponding to real places, encounters and trains bitmon, builds a collection, trades under fair rules, and competes to lead gyms.

The **world is mapped 1:1 to the real-world geography represented in OpenFreeMap**: its streets, geographic positions, and building footprints come only from features present in OpenFreeMap tiles, rather than a small fictional map that merely resembles Earth. An absent mapped building or road must stay absent; the game never creates one to fill gaps. OpenFreeMap can be incomplete, so this is a fidelity-to-source promise rather than a guarantee that every real feature has been mapped. It is **rendered as an original low-poly 2.5D top-down/oblique RPG** with simplified geometric volumes, clean silhouettes, restrained shading and materials, and minimal polygon detail. Classic handheld creature RPGs remain a reference for camera and exploration—not a requirement to imitate pixel-art textures or copyrighted assets.

**OpenFreeMap is the only geographic data source**, and **MapLibre** displays and styles its tiles. We add original game art to the **existing mapped geometry**: stylized road surfaces, raised/extruded mapped buildings, roof treatments, facades, windows, characters, and bitmon. Building appearance may be **plausibly inferred** from attributes and surrounding context that OpenFreeMap already exposes; inferred usage is an art choice, not an assertion about the real building. No additional OSM enrichment service, building dataset, custom geography source, or invented road/building geometry is required or permitted.

The game is primarily played locally after the player registers a verifiable trainer. Its collection and progression can be validated without trusting the original game website or an always-online game server. The rules, not the client software, determine which rewards are legitimate.

### Product promises

1. **The real Earth is the world.** A street in the map corresponds to that street's real geographic location.
2. **It feels like a low-poly mobile game, not a navigation app.** Roads and buildings remain recognizable, but everything is presented in a coherent low-poly 2.5D RPG style.
3. **Every neighborhood has a visual identity without fabricated geography.** OpenFreeMap building footprints, land use, roads, waterways, and parks influence the scene; only surface art and facade treatments may be invented.
4. **The player's bitmon are earned, not fabricated.** Verified encounters and progression follow independently checkable rules.
5. **Most actions are immediate.** Walking, exploring, and battling do not require blockchain transactions every few seconds.
6. **Social competition is simple and fair.** Trading follows fixed restrictions; gyms have permanent type identities and reward reputation, not money.
7. **No single operator is required to keep playing.** The player can self-pay transaction fees, use alternative hosting, and verify the canonical game state.
8. **It lives on the phone.** Players can install bitmon from a browser onto their home screen and play in portrait orientation.

## 2. Decisions and assumptions

### Confirmed product decisions

- The game and creatures are named **bitmon** for now.
- **Smartphones are the primary target.** Bitmon ships as an **installable PWA**, not initially as a native app-store binary.
- **Portrait-only gameplay.** No landscape gameplay layout or support is planned.
- **Low-poly 2.5D** is the required art direction; simple geometric building volumes, faceted or flat-shaded treatments, original art, and low visual complexity.
- **Exploration camera uses a fixed oblique pitch and zoom** and follows the geographic avatar; bearing smoothly rotates toward actual walking heading (heading-up), with manual rotation/tilt disabled.
- **Battles stay in the same 2.5D real-world scene**: the camera zooms/reframes to focus on the encountered bitmon with the surrounding mapped world still behind it, then restores the previous exploration camera state and resumes heading-following behavior.
- **The immediate development objective is exploration only:** a male avatar with a loopable four-direction walking animation, geographic touch movement, and a fixed-pitch, direction-following camera on the OpenFreeMap world. Battle mechanics and blockchain progression are not prerequisites for this first prototype.
- **GitHub Pages test distribution:** `s3ton/bitmon` is public. Source changes enter `preview` via PR; a separate `preview` → `main` release PR triggers compilation and Pages deployment at `/bitmon/` only after merging to `main`. No second distribution repository is needed.
- The game world covers **Earth at a geographic 1:1 scale**, using real-world map positions.
- **OpenFreeMap is the sole geographic data source; MapLibre is the map renderer.** No independent OSM API, commercial map provider, enriched building source, or fabricated replacement data is part of the map pipeline.
- **Never generate a building or road that is not represented in OpenFreeMap.** Do not add missing footprints, invent shortcuts, or draw fictional street links. If the source omits a feature, the game omits it.
- Buildings use OpenFreeMap footprints, overlaid in **stylized 2.5D**. Their facade/window/roof art may be invented or inferred from the tile's available fields and local mapped context; visual invention must never add a new physical building or expand its footprint.
- Inferred residential-like styling is allowed as **artistic interpretation**, never as a verified residential label. Ambiguous buildings receive a neutral or plausible generic style.
- A **verified trainer must register before their first verified encounter**; registration must predate the relevant public randomness.
- Each gym has exactly **one permanent assigned bitmon type**. Both teams must contain only bitmon with that type; either type of a dual-type bitmon is sufficient.
- Gym leaders may update their eligible defense team but cannot alter the gym type or create additional gym-specific rules.
- Trades are **one-for-one, same rarity tier**, limited to **one swap per trainer per rolling 24 hours**, and both creatures reset to the lower of their prior levels.

### Working assumptions, not yet approved

- **Virtual exploration is the primary control scheme:** players move a character through the map using mouse/touch/keyboard/gamepad. A player's real GPS location is **not** assumed to be required. This is different from a location-based game that requires physically visiting coordinates. The movement/travel design must be decided explicitly (§14).
- The geographic **positions and footprints** are 1:1, but art style, perspective, visible building height, and collision presentation may be stylized for readability. This does **not** mean every meter of travel is fun at normal walking speed.
- Desktop browsers may be used for development/debugging, but **desktop-specific and landscape layouts are not product requirements**. The game is designed for upright portrait smartphone screens.
- Offline capability is scoped to cached application files and local pending progress where feasible; the entire Earth map, new authenticated randomness and blockchain settlement are not promised offline.
- Every bitmon type/rarity, battle rule, starter list, and gym location is still subject to game design unless stated as a confirmed rule above.

## 3. Who the player is and what they do

### Primary player journey

1. **Open or install bitmon on a smartphone.** Visit its public PWA URL, or launch it from the home-screen icon; see a short introduction explaining the real-Earth game world.
2. **Create a verified trainer.** Connect or create a self-custodial wallet, choose a starter under fixed rules, select an initial permitted region, and register the trainer on-chain. Fees are self-paid or optionally sponsored.
3. **Enter the world.** Start at a map coordinate and see roads, nearby buildings, parks, paths, and water in the bitmon visual language.
4. **Explore.** Move a four-direction animated trainer through the world; the fixed-pitch/zoom oblique camera follows and turns smoothly to the direction of travel. Roads and existing low-poly buildings stream in as the player travels.
5. **Encounter bitmon.** Eligible encounters are determined fairly from the previously registered trainer identity and authenticated randomness; the camera moves closer to the encountered bitmon while the **same mapped low-poly world** remains visible in the background.
6. **Battle, capture, and train.** Play turn-based battles locally in the zoomed world view; legal actions change HP, status, inventory, levels, and the pending collection. When the encounter ends, the camera smoothly returns to the prior fixed exploration perspective and follows the trainer again.
7. **Secure progress.** The UI distinguishes progress saved locally from progress verified on-chain. The player can finalize a batch when needed.
8. **Trade and challenge gyms.** Swap finalized bitmon under fixed rules and challenge a gym with a type-eligible team. Winning replaces the current player leader and earns recognition.
9. **Keep playing independently.** The user is not dependent on an ad sponsor or the original website to submit valid state changes.

### Guest preview

An optional guest demo can let a player see the map, walk around, and try practice combat without a wallet. Guest bitmon, XP, and encounters are **not** canonical and cannot later be imported into a verified trainer. The interface must not promise that guest progress can be upgraded retroactively.

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
- **During exploration the camera's pitch and zoom are fixed, but bearing is dynamic**. It follows the character's actual geographic position and turns smoothly toward accepted movement heading by the shortest angular path (including wraparound). Forward travel generally points up-screen; bearing holds when idle. Manual rotation and tilt remain disabled.
- The target feel is a classic handheld top-down creature RPG (the fourth/fifth-generation era is a **visual reference only**, not a license to copy character designs, tiles, interfaces, sounds, or maps).
- The main player character remains legible against the map; nearby buildings must not permanently hide the player.
- Perspective, building height exaggeration, and camera pitch are art/UX parameters to test, not claims that geographic features are fully photorealistic.
- The exploration camera keeps its fixed 2.5D pitch and zoom while following smoothly through turns and tile boundaries, without changing geographic geometry. Later battles must restore prior bearing, pitch, zoom and follow state before heading-up behavior resumes.
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

- Use a safe-area-aware portrait virtual joystick with one-thumb continuous cardinal/diagonal movement, a small dead zone, and immediate idle when released. Keyboard is optional for debugging; GPS is not required.
- Store true geographic longitude/latitude and integrate speed in meters/second using elapsed time, independently of device frame rate, source tile loads, or camera presentation. Normalize diagonal speed and avoid background-time jumps.
- Convert joystick control to a stable geographic movement heading through camera turns without a camera/input feedback loop; use accepted displacement to set the camera target bearing, not noise.
- Use only OpenFreeMap source building footprints and impassable-water polygons for minimal collision; stop on blocked geometry and temporarily pause movement while source tiles are not ready. Missing access data does not justify inventing traversable connections.
- Make orientation comprehensible to the player. A later navigation/access-rights system is required for comprehensive passability and long-distance travel.
- **Touch is the primary input** for moving, exploring and future battle/menu actions in portrait; gamepad support is deferred.

### EXPL-01 — Animated walking avatar

**As a player**, I can control a recognizable male trainer avatar and see him walk naturally in the direction I move.

- Provide an **original** male explorer/trainer design that reads clearly in a low-poly 2.5D portrait scene. No reused character art from existing franchises.
- Use a **small directional walking animation** (at minimum up, down, left, and right) made from a coherent sequence of frames. Animate only while the character moves; show an idle/standing frame when stationary.
- Advance walking frames based on elapsed time or actual movement, not map tile loading or display refresh rate. Direction changes update the facing animation without teleporting or snapping the avatar's world position.
- Keep sprite/mesh scale, ground contact, facing, foot positioning, and shadow consistent across frames; the walking cycle should not visually slide or jitter.
- **Touch control** drives geographic movement; derive visible four-direction sprite facing from geographic movement heading relative to the rotating camera. Keep sprite-facing, player position and camera orientation distinct. Retain the last heading and idle pose when stopped.
- Allow lightweight prototype sprite frames to be replaced by polished original assets without rewriting movement, animation timing, or camera logic.

### MOVE-02 — Traveling long distances

A 1:1 Earth cannot be practical to explore exclusively by walking at a human-scale speed. **A travel system is necessary but not yet specified.** Candidate mechanisms include selecting a starting location, roads/transport routes, regional travel, or fast travel to discovered locations.

Until decided, do **not** assume GPS-based teleportation, unrestricted instant teleportation, or invisible distance compression. The chosen mechanic must preserve fair encounter-location rules (§7).

### MOVE-03 — Privacy and physical location

The game should not require disclosure of the player's real-world location merely to explore a geographic map. If an optional “go to my location” control is later added, request permission transparently and keep the physical-location data separate from the on-chain trainer identity unless deliberately specified and reviewed. **No mandatory GPS or proof-of-physical-presence rule is approved in this PRD.**

## 7. Encounters, regions, and fair randomness

### ENC-01 — First verified encounter requires registered identity

**As a player**, I know that my bitmon were legitimately found under the same rules as everyone else's.

- The verified journey starts with a trainer ID committed on-chain **before** any encounter randomness used by that trainer is published.
- Registration must be finalized and the protocol-defined activation boundary passed before the player is eligible for verified encounters.
- The player can see that registration is pending, active, or failed; a guest demo is a separate non-canonical mode.
- Every eligible trainer has personalized encounter outcomes from fixed identity plus authenticated shared randomness; the player cannot select a different seed or reroll by refreshing a browser.

### ENC-02 — Encounters belong to the world

**As a player**, I expect exploring a different environment to feel meaningfully different.

- Encounter availability and species may be influenced by a deterministic habitat/region classification derived from geography and game rules.
- **Crucial unresolved design problem:** the game must bind the relevant region/location **before** the random encounter outcome becomes knowable. Otherwise players could scan all Earth locations after seeing a beacon value and select whichever yields a legendary bitmon. This would invalidate fair, location-based rarity.
- The final solution must work with the virtual travel mechanic; map coordinates chosen solely by an untrusted client are not proof that a trainer was there at an earlier time.
- Do not implement location-specific verified encounters as a production feature until this rule is specified and tested against hindsight selection.

### ENC-03 — Familiar RPG encounter loop

- The player meets a bitmon, enters a clear turn-based encounter UI, chooses moves or items, sees the battle resolve, and may capture the bitmon if fixed conditions are met.
- Ordinary battles and exploration run locally with immediate feedback and do not each require a chain transaction.
- Valuable rare encounters may require an **expiring on-chain reservation** before the battle is finished, clearly communicated to the player.
- The UI must explain when an encounter is still pending and whether a missed claim deadline makes it ineligible for canonical capture.

### ENC-04 — Rarity and time budgets

- Rarity is **personal/probabilistic**, not a globally unique cap on a species.
- Encounter opportunities and XP follow deterministic published quotas so simply running many browser actions cannot generate unlimited valid progress for one trainer.
- Specific rates, epoch schedules, caps, and rare-claim windows are balance parameters to validate; historic concept values are not locked product promises.

## 8. Bitmon collection, progression, and combat

### GAME-01 — Collection

**As a player**, I can view my roster and understand each bitmon's identity and status.

- Each collected bitmon has a recognizable species, assigned type or pair of types, rarity tier, current level, moves, and authenticated provenance for verified captures.
- The collection interface distinguishes **local pending** changes from **finalized** canonical ownership.
- The player can build a party, inspect bitmon, and understand which ones are eligible to trade or assign to gym defense.
- Original bitmon art, names, types, and UI are required; no copyrighted franchise assets are part of the product.

### GAME-02 — Battles and capture

- Battles are turn-based, strategically understandable, and consistent across supported clients.
- Damage, status, items, move legality, XP, and capture outcomes follow deterministic, published rules that can be independently verified.
- Capture is deterministic after the encounter exists and required battle/resource conditions are satisfied; the player cannot brute-force an extra hidden catch roll.
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

- Progress is saved locally while playing and can later be proven/finalized on-chain in batches.
- The interface uses distinct states such as **Guest**, **Local pending**, **Submitted**, **Finalized**, and **Needs attention**.
- The player can export or restore user-controlled saved information; a cryptographic state root alone cannot recreate lost game history.
- The player must never be led to believe unsent local state is already guaranteed recoverable from the blockchain.

## 9. Trading with other players

### TRADE-01 — Restricted, understandable swaps

**As a player**, I can exchange a bitmon without enabling one account to receive unlimited farmed rarity or training.

- Trades exchange **exactly one finalized, unlocked bitmon for exactly one** from another trainer.
- Both bitmon must belong to the **same rarity tier**. No gifting, one-sided transfers, cross-tier swaps, or ordinary free NFT transfers are supported.
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
- A challenger assembles an eligible finalized team, fights the current defense locally under fixed battle rules, and submits a valid victory proof.
- The successful challenger becomes the current gym leader; the winning team becomes the initial defense snapshot.
- Leaders can update their defense team within published cooldown/activation rules, but **only** with bitmon matching the gym type.
- Defense creatures are locked against trading while assigned, and their battle snapshots are stable until a permitted update.
- The system must reject victories against a stale or incompatible defense state.

### GYM-03 — Recognition, not money

- Gym success grants **fame and history**: current leader, previous leaders, reigns, successful defenses, and non-transferable badges or equivalent recognition.
- No monetary reward or freely transferable reward is attached to gym control.
- The UI shows the gym's type prominently, with a clear explanation of why a bitmon is or is not eligible.

**Placement of gyms in the global Earth map is open.** A gym might be tied to a mapped location, a generated cell, or a curated game point. The mechanism must be consistent worldwide and must not accidentally give map-data-rich regions exclusive access to the core competitive mode.

## 11. Registration, fees, and independent access

### ACCOUNT-01 — Register at the start

- A verified player creates or connects a self-custodial wallet and registers a stable trainer ID **before** verified play.
- The app must explain why this first transaction is necessary and whether an optional fee sponsor is available.
- A registered trainer's ID remains stable even if their wallet control later rotates under fixed recovery rules.
- Registration is permissionless; no proof-of-personhood or mandatory centralized account is required.

### FEES-01 — Optional sponsorship

- The player may pay blockchain network fees directly, or use an independent sponsor when one is available.
- Advertising is **never mandatory** for playing or submitting an otherwise valid self-paid transaction.
- The sponsor cannot change spawn probabilities, issue bitmon, determine a battle winner, or veto a valid self-paid action.
- Ad-funded sponsorship is an optional business integration and must **not** be represented as approved by Google or another ad provider without a policy review.

### INDEPENDENCE-01 — Continuity

- Players should be able to load an alternative compatible client and continue using verifiable progression rules if the original website disappears.
- Required map, asset, protocol, and rules versions should be documented sufficiently for independent compatible clients.
- If the public OpenFreeMap tile endpoint becomes unavailable, the player should be able to switch to a mirror or self-hosted copy of the **same OpenFreeMap geographic dataset**; this must not introduce alternative map geometry.

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
- Cache a lightweight application shell and preserve unsent local progress where feasible. Do not imply the whole Earth, missing map tiles, network randomness, or blockchain transactions are available offline.
- A connectivity loss or app update must not silently discard pending progress. Clearly indicate unavailable features, loading failures, and the distinction between locally saved and finalized state.

### DIST-01 — Test distribution from the public source repository

**As a player**, I can open and install the exploration test at `https://s3ton.github.io/bitmon/`.

- The repository **`s3ton/bitmon` is public**. For this exploration prototype, GitHub Actions deploys directly to its GitHub Pages site; do not create a separate distribution repository.
- Publish **only the compiled `dist/` output**—HTML, CSS, JavaScript, manifest, service worker and icons/assets. Never include credentials, development sources, docs or Git history in the deployed artifact. Public repository content is independently visible by design.
- Set GitHub Pages **Build and deployment → Source → GitHub Actions**. Only pushes to `main` deploy. Feature changes must enter `preview` by PR, followed by a separate, reviewed `preview` → `main` release PR. `preview` and feature branches never publish the live Pages site.
- Manifest scope/start URL, application assets and the service worker must work under the GitHub Pages `/bitmon/` repository subpath.
- The site is a **public test prototype**, not a completed or verified game. The deployed application can cache the shell but requires connectivity for uncached OpenFreeMap tiles.
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
3. Show an original **male walking avatar** with **up/down/left/right frame cycles** and an idle pose; frames advance only while moving.
4. Move the avatar through real coordinates with a **portrait-safe touch joystick**, diagonals, frame-rate-independent speed and basic source-footprint building/water collision; pause during missing source tiles.
5. Use a **fixed-pitch/zoom oblique exploration camera** that follows the avatar and smoothly turns toward walking heading via the shortest angular path, retaining direction when idle and disabling manual camera rotation/tilt.
6. Retain smooth rendering, camera position and walking animation when crossing map tile boundaries.
7. Repeat the demo on a sparsely mapped area; no missing roads or buildings may be procedurally invented.

**Explicitly deferred after E0:** battle camera transition (CAM-01), encounter rules, wallet registration, proving/finality, trade, gyms, advertising. Their product requirements remain valid for later work.

### P0 — Must work in the first map/game vertical slice

1. Load an arbitrary supported city coordinate with **MapLibre + OpenFreeMap** and display real street/land-use/building geometry.
2. Show the animated walking avatar and a **smooth heading-following, fixed-pitch/zoom exploration camera** in a low-poly 2.5D portrait smartphone scene, with correct camera-relative sprite facing.
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
| Animated explorer | Geographic joystick movement animates the camera-relative four-direction pose; camera turns smoothly toward actual heading and holds orientation while idle. |
| Same-world battle camera | On battle start the active camera zooms toward the encountered bitmon while the mapped world remains visible; after battle it returns to the exact exploration framing. **Deferred until after E0.** |
| Fire gym | Fire and Fire/Wind are accepted; Water/Wind is rejected for both attack and defense. |
| Sponsor outage | A player with their own gas and a valid proof can still finalize progress. |
| Installable phone PWA | The app can be installed/launched from Android and iOS home screens with a portrait-first UI. |
| Landscape rotation | Unsupported orientation lock shows a rotate-phone message and preserves session state; no landscape gameplay is implemented. |
| GitHub Pages distribution | The compiled PWA loads from the public repository subpath without publishing private source, secrets or source maps. |

## 14. Open decisions blocking detailed development

These questions need product decisions; implementing guesses as if already settled would create significant rework.

1. **Virtual travel versus physical travel:** Is bitmon entirely joystick-driven, GPS-driven, or a hybrid? This draft assumes joystick-driven virtual exploration with **no GPS requirement**, pending confirmation.
2. **Scale and speed:** How quickly should one traverse an actual kilometer? How do players visit distant cities without trivializing exploration?
3. **Map coordinate access:** Can anyone pick any starting coordinate? Can they freely revisit different regions? How does the game avoid location-based encounter seed shopping?
4. **Encounter location commitment:** Exactly when and how is a region/habitat fixed relative to the public randomness beacon? This is essential to fair, worldwide encounters.
5. **Walkable space:** Does play primarily follow mapped paths, or allow free walking through parks, fields, and plazas? What to do with roads lacking foot-access information?
6. **Facade inference rulebook:** Which existing OpenFreeMap attributes/context influence facade variants, how should uncertain inferences be weighted, and how do source-tile updates affect deterministic art? **No additional geographic data source is allowed.**
7. **Camera/art direction:** **Heading-following bearing is now decided**; open tuning includes fixed pitch/zoom values, turning smoothness, input dead zone, sprite scale/timing, battle easing, roof presentation and building-height stylization. Same-world battle framing remains decided and deferred.
8. **Interiors:** Are any buildings enterable in the first release? No such feature is assumed here.
9. **Gym placement:** How are gyms distributed fairly across a worldwide map? How does a player find and reach them?
10. **Starter and habitat design:** Initial bitmon types, starting conditions, balance of cities/rural areas, and whether region influences **species only** or also rarity.
11. **Map revision consistency:** How often does basemap data refresh, and how do updated streets/buildings interact with saved gameplay/collisions and proof rules?
12. **Device targets:** Minimum Android/iOS versions, smartphone portrait viewport sizes, touch target dimensions, frame rate, offline behavior, download and storage budgets. **Portrait-only smartphone-first is already fixed.**
13. **Release automation:** GitHub Pages currently deploys from the public source repository's `main` only, after reviewed `preview` → `main` promotion. Long-term distribution/privacy remains open.

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