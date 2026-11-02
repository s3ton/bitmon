# bitmon — Product Requirements

**Document type:** Player-facing product requirements document (PRD)  
**Version:** 0.1 — initial development baseline  
**Date:** 2 November 2026  
**Status:** Draft; explicitly marked open decisions are not approved requirements  
**Product name:** **bitmon**  
**Creature name:** **bitmon** (singular and plural)  
**Related concept:** Project Aether v2.2 (registration-first verified play, fixed-type gyms, restricted swaps). This PRD describes **what players should experience**; it is not a replacement for a protocol or security specification.

---

## 1. Product vision

**bitmon is a browser-first creature-collection RPG set on a game version of the real Earth.** A player explores streets, paths, parks, neighborhoods, and landscapes corresponding to real places, encounters and trains bitmon, builds a collection, trades under fair rules, and competes to lead gyms.

The **world is mapped 1:1 to real-world geography**: its streets, geographic positions, and building footprints come from geographic data, rather than a small fictional map that merely resembles Earth. It is **rendered as a stylized 2.5D top-down RPG**, evoking the readable pixel-art perspective of handheld creature games from the late 2000s and early 2010s, with wholly original bitmon art and assets.

**OpenFreeMap** supplies the open basemap/vector-tile starting point, and **MapLibre** displays and styles the map. We add our own game art: stylized ground treatments, raised/extruded buildings, roof details, facades, windows, interactive points, characters, and bitmon. Building appearance is selected from the best geographic attributes available; residential buildings should look residential when the underlying data supports that classification.

The game is primarily played locally after the player registers a verifiable trainer. Its collection and progression can be validated without trusting the original game website or an always-online game server. The rules, not the client software, determine which rewards are legitimate.

### Product promises

1. **The real Earth is the world.** A street in the map corresponds to that street's real geographic location.
2. **It feels like a game, not a navigation app.** Roads and buildings remain recognizable, but everything is presented in a coherent 2.5D RPG art style.
3. **Every neighborhood has a visual identity.** Real building footprints, land use, roads, waterways, and parks influence the scene.
4. **The player's bitmon are earned, not fabricated.** Verified encounters and progression follow independently checkable rules.
5. **Most actions are immediate.** Walking, exploring, and battling do not require blockchain transactions every few seconds.
6. **Social competition is simple and fair.** Trading follows fixed restrictions; gyms have permanent type identities and reward reputation, not money.
7. **No single operator is required to keep playing.** The player can self-pay transaction fees, use alternative hosting, and verify the canonical game state.

## 2. Decisions and assumptions

### Confirmed product decisions

- The game and creatures are named **bitmon** for now.
- The game world covers **Earth at a geographic 1:1 scale**, using real-world map positions.
- The base map uses **OpenFreeMap data/style infrastructure with MapLibre rendering**.
- Streets and roads must follow the map data rather than a separately hand-drawn road network.
- Buildings are overlaid in **stylized 2.5D**, with art and facade choices determined by map-derived building data when available.
- Residential buildings should receive residential-appropriate facade/window artwork when identifiable.
- A **verified trainer must register before their first verified encounter**; registration must predate the relevant public randomness.
- Each gym has exactly **one permanent assigned bitmon type**. Both teams must contain only bitmon with that type; either type of a dual-type bitmon is sufficient.
- Gym leaders may update their eligible defense team but cannot alter the gym type or create additional gym-specific rules.
- Trades are **one-for-one, same rarity tier**, limited to **one swap per trainer per rolling 24 hours**, and both creatures reset to the lower of their prior levels.

### Working assumptions, not yet approved

- **Virtual exploration is the primary control scheme:** players move a character through the map using mouse/touch/keyboard/gamepad. A player's real GPS location is **not** assumed to be required. This is different from a location-based game that requires physically visiting coordinates. The movement/travel design must be decided explicitly (§14).
- The geographic **positions and footprints** are 1:1, but art style, perspective, visible building height, and collision presentation may be stylized for readability. This does **not** mean every meter of travel is fun at normal walking speed.
- The initial product is a browser-based progressive web app (PWA), with desktop and mobile support.
- Every bitmon type/rarity, battle rule, starter list, and gym location is still subject to game design unless stated as a confirmed rule above.

## 3. Who the player is and what they do

### Primary player journey

1. **Open bitmon.** See a short introduction explaining that the setting is the real Earth, presented as a game world.
2. **Create a verified trainer.** Connect or create a self-custodial wallet, choose a starter under fixed rules, select an initial permitted region, and register the trainer on-chain. Fees are self-paid or optionally sponsored.
3. **Enter the world.** Start at a map coordinate and see roads, nearby buildings, parks, paths, and water in the bitmon visual language.
4. **Explore.** Move through the world, follow recognizable streets, pass 2.5D buildings, and discover places and habitats. The world streams in as the player travels.
5. **Encounter bitmon.** Eligible encounters are determined fairly from the previously registered trainer identity and authenticated randomness; the local game presents them as familiar RPG encounters.
6. **Battle, capture, and train.** Play turn-based battles locally; legal actions change HP, status, inventory, levels, and the pending collection.
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
- Roads, footpaths, coastlines, waterways, land-use areas, and available building footprints derive from the map dataset.
- The underlying map geometry is not randomly rearranged to create game levels. The same real feature retains the same geographic position across visits.
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
- Decorative styling may change road color, borders, texture, and markings; it must not invent a different route topology.
- The scene must handle intersections, overlapping bridges, waterways, and road/building ordering without confusing visual occlusion.
- **Walkability is a gameplay rule, not automatically guaranteed by a road drawn on the map.** The game must distinguish rendered map features from traversable game space, including rivers, walls, highways, railways, private areas, and missing access tags.

### WORLD-03 — Nature, neighborhoods, and habitats

**As a player**, a park looks different from an industrial area, and different real-world surroundings can support different bitmon encounters.

- Use available land-cover, land-use, water, transportation, and place data to visually distinguish, for example, parks, woods, grass, farmland, water, residential areas, commerce, and industry.
- Reuse a coherent 2.5D tiles/sprites/material style across the world instead of displaying unmodified map colors next to unrelated game artwork.
- Habitat information may inform encounter species or game points **only through fixed, published game rules**.
- If a place lacks reliable tags, use an explicit neutral/default visual treatment instead of asserting a specific local building type or habitat.
- More detailed local art can be added to special places without destroying the geographic correspondence.

### WORLD-04 — Global coverage and continuity

**As a player**, I can open unfamiliar regions without the game breaking because no artist has handcrafted them.

- The world should be generated from available geographic data anywhere the map provider has coverage.
- Missing buildings, incomplete roads, or inconsistent tagging must degrade gracefully.
- The game should communicate when map data are missing or a region is not yet playable under the movement rules.
- The map must not silently fabricate real-world buildings and present them as mapped facts. Fictional gameplay props must be visually distinguishable from map-derived geometry.
- Continents, oceans, islands, and remote settlements should not require hard-coded city maps to be shown.

## 5. Visual direction: 2.5D top-down RPG

### VIS-01 — Camera and readability

**As a player**, I see the world from a consistent elevated, top-down/oblique viewpoint with spatial depth.

- Use a **2.5D scene**: largely map-aligned ground geometry plus raised buildings, depth-sorted sprites, shadows, and decorative geometry.
- The target feel is a classic handheld top-down creature RPG (the fourth/fifth-generation era is a **visual reference only**, not a license to copy character designs, tiles, interfaces, sounds, or maps).
- The main player character remains legible against the map; nearby buildings must not permanently hide the player.
- Perspective, building height exaggeration, and camera pitch are art/UX parameters to test, not claims that geographic features are fully photorealistic.
- Zoom and camera motion should preserve a consistent spatial understanding of where the player is.
- Labels and major navigation cues must remain readable above or around extruded geometry.

### VIS-02 — Buildings as stylized volumes

**As a player**, buildings occupy the same footprints as the real buildings in the map but look like buildings in a coherent RPG world.

- Convert mapped building footprints into **2.5D building volumes** anchored to their real coordinates.
- Use mapped or derived heights when available; use a **deterministic, visually reasonable fallback** for missing height data.
- Draw roofs and visible facades with original bitmon materials, outlines, shadows, and facade details.
- Geometry and artwork must line up with the ground map; buildings cannot float, visually jump between tiles, or rotate arbitrarily as the camera moves.
- Respect building parts/minimum heights when available; avoid drawing two conflicting building shells for one mapped structure.
- If a building footprint is present but no type is known, render a believable **generic building**, not a confidently labeled residence, shop, or school.

### VIS-03 — Data-driven facade and window art

**As a player**, different kinds of buildings visibly feel different without manually designing every building in the world.

| Building evidence available | Desired player-visible treatment | When evidence is missing |
|---|---|---|
| Residential building classification (`building=house`, `apartments`, `residential`, etc.) | Residential window pattern, doors, balconies or shutters where the art style supports them; scale pattern to height/width | Generic facade; do not claim residential use |
| Commercial/retail/office classification | Appropriate shopfront, office-window rhythm, or larger ground-floor glazing | Generic facade |
| Industrial/warehouse classification | Larger blank walls, loading-door-style details, fewer windows | Generic facade |
| Civic, educational, or other specialized class | Distinctive but restrained building art chosen from mapped tags | Generic facade |
| Reliable height/level data | Taller facade with proportionate window rows and roof position | Deterministic default height and row count |
| Material, wall color, or roof characteristics | Use available colors/material cues when they can be normalized into the art palette | Bitmon default material/roof palette |

**Rules for the art system**

- Art selection must be **deterministic** for a fixed building ID, data revision, and art version, so a building does not change facade each time it scrolls into view.
- Window positions must be computed from the available wall dimensions and should not spill past edges, corners, or roofs.
- Facades must remain visually distinct from the ground map and avoid excessive texture repetition.
- Missing labels and ambiguous classifications must lead to neutral art, not unfounded assumptions.
- The system should allow future localized art packs without making manually authored cities a prerequisite for worldwide coverage.

**Important data constraint:** Standard OpenFreeMap/OpenMapTiles building vector tiles expose geometry and fields such as approximate rendered height, minimum height, color, and 3D-visibility flags. They do **not necessarily expose original `building=*`, `building:levels`, `roof:shape`, or other detailed OSM tags needed to pick residential-vs-office facade art.** This product requirement therefore implies an **additional enriched building-feature source or a custom vector-tile pipeline** preserving the needed attributes. Do not plan to infer residential class from `render_height` alone. See §15.

### VIS-04 — Layering and occlusion

**As a player**, the character can pass behind the right objects, and interactive places remain usable.

- The player and NPC sprites must interact visually with building depth, trees, bridges, and props rather than always being drawn on top of everything.
- Use shadows, roof/facade separation, and fade/cutaway behaviors where needed to keep the character visible near tall buildings.
- World markers and interactable points must not be hidden behind roofs or unreadable road labels.
- The map should support an uncomplicated pause/menu state without losing the current camera position.

### VIS-05 — Performance and visual consistency

- Nearby detail loads progressively as the camera moves; distant areas use simpler geometry and fewer decorations.
- Rendered textures/sprites should be cached and reused, not rebuilt for every frame or every building.
- Set measurable performance and memory budgets using real low- and mid-range mobile devices before committing to a final facade implementation.
- The scene should remain usable during slow tile loads; show a clear loading/fallback state rather than silently changing geography.
- The renderer must handle dense cities, sparse rural regions, missing heights, multipolygon buildings, zoom changes, and map-tile boundaries.

## 6. Moving through the world

### MOVE-01 — Player movement

**As a player**, I control a character rather than dragging a normal web map all the time.

- Provide familiar directional movement with responsive input and a camera following the character.
- Define where the player may walk based on a deterministic game navigation representation consistent with the map, not just painted road pixels.
- Prevent walking through solid building volumes and impassable water by default unless a game mechanic explicitly allows it.
- Allow the player to inspect surroundings and understand the map orientation.
- Support touch-friendly controls as well as desktop keyboard/mouse controls; consider gamepad later.

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
- If the public map-tile endpoint becomes unavailable, switching to a compatible mirror or self-hosted OpenFreeMap/OpenMapTiles tiles should remain feasible.

## 12. UX and accessibility

- The player has a clear world view, an obvious current position, nearby interactive points, and a readable party/collection panel.
- Basic UI is usable with keyboard and touch; controls and text should work on common phone screen sizes.
- Use clear contrasts and symbolic cues alongside type colors, especially for color-vision accessibility.
- Important game interactions do not rely on tiny map markers or precise pixel tapping.
- Show map loading, offline/unavailable regions, wallet failures, slow proofs, and transaction finality explicitly.
- Do not place interactive content where map attribution, safety messaging, or critical UI overlays become hidden.
- The visual style should support localization and geographic names in different languages and scripts where data permit.

## 13. Release scope and user-visible acceptance tests

The first playable milestone is a **vertical slice** rather than a finished planet-sized RPG. It demonstrates one real neighborhood with the same generalized pipeline intended for the rest of Earth.

### P0 — Must work in the first map/game vertical slice

1. Load an arbitrary supported city coordinate with **MapLibre + OpenFreeMap** and display real street/land-use/building geometry.
2. Show a controlled player character and a usable, consistent top-down/oblique **2.5D view**.
3. Raise building footprints into stylized volumes and use available building heights or deterministic fallbacks.
4. Show at least **two distinguishable facade treatments**, including residential windows when **verified building classification data** are available; unknown buildings receive neutral art.
5. Keep roads, buildings, player collision, and camera aligned while moving and crossing tile boundaries.
6. Create a verified trainer before issuing the first authenticated encounter, with clear registration/activation state.
7. Complete one local deterministic encounter, one capture, local pending save, and successful verified finalization.
8. Show errors or degraded rendering rather than falsely implying detailed map data exist where they do not.

### P1 — Required for a usable first game release

- Map/world streaming across multiple urban and rural test regions; a documented travel mechanism.
- A polished visual vocabulary for roads, parks, water, vegetation, and several building categories.
- More species, levels, moves, inventory, quests/progression, and reliable recovery/export.
- Regional/habitat encounter design with a **specified anti-hindsight location commitment model**.
- Same-tier swaps with level reset and 24-hour rate limiting.
- Fixed-type NPC/player gyms, defense team updates, fame history, and challenge validation.
- Mobile performance, usability, error states, map attribution, and alternative tile source tests.

### P2 — Later enhancements, not release blockers

- Additional decorative building variants, roof shapes, richer nighttime lighting, seasonal art, animated crowds, and curated landmark scenes.
- Optional localized art packs, more extensive points of interest, or enhanced environmental audio.
- Advanced portability/mirroring, third-party sponsorship integrations, and independently hosted game portals.

### Acceptance scenarios for the map team

| Scenario | Pass condition |
|---|---|
| Real intersection | A selected real-world intersection has matching road geometry and connectivity on the map. |
| Residential block with known tags | At least one mapped residence uses the approved residential facade/window set; the decision is traceable to data fields. |
| Building with unknown class | A generic facade appears; the app does not invent a residential/commercial classification. |
| Tall vs short building | Different recorded heights or levels produce appropriately distinct raised forms, with a documented fallback when unknown. |
| Tile seam | A road and facade crossing a tile boundary do not visibly separate or change style. |
| Dense city | Gameplay remains responsive under the agreed device and frame-time budget, with predictable level-of-detail fallback. |
| Sparse rural area | The scene remains navigable even if building metadata are incomplete. |
| Different trainer at same location | Physical map layout is consistent; encounters may differ by trainer identity. |
| Known-beacon location exploit | A player cannot choose a better location **after** seeing encounter randomness and still claim the result as a valid earlier slot. |
| Unregistered account | No verified bitmon can be claimed without pre-registered eligible trainer identity. |
| Fire gym | Fire and Fire/Wind are accepted; Water/Wind is rejected for both attack and defense. |
| Sponsor outage | A player with their own gas and a valid proof can still finalize progress. |

## 14. Open decisions blocking detailed development

These questions need product decisions; implementing guesses as if already settled would create significant rework.

1. **Virtual travel versus physical travel:** Is bitmon entirely joystick-driven, GPS-driven, or a hybrid? This draft assumes joystick-driven virtual exploration with **no GPS requirement**, pending confirmation.
2. **Scale and speed:** How quickly should one traverse an actual kilometer? How do players visit distant cities without trivializing exploration?
3. **Map coordinate access:** Can anyone pick any starting coordinate? Can they freely revisit different regions? How does the game avoid location-based encounter seed shopping?
4. **Encounter location commitment:** Exactly when and how is a region/habitat fixed relative to the public randomness beacon? This is essential to fair, worldwide encounters.
5. **Walkable space:** Does play primarily follow mapped paths, or allow free walking through parks, fields, and plazas? What to do with roads lacking foot-access information?
6. **Building data source:** Which enriched OSM tags must be preserved, how is the data tiled or fetched, and how are updates versioned?
7. **Camera/art direction:** Exact angle, camera rotation policy, sprite resolution, texture treatment, roof presentation, and building-height stylization.
8. **Interiors:** Are any buildings enterable in the first release? No such feature is assumed here.
9. **Gym placement:** How are gyms distributed fairly across a worldwide map? How does a player find and reach them?
10. **Starter and habitat design:** Initial bitmon types, starting conditions, balance of cities/rural areas, and whether region influences **species only** or also rarity.
11. **Map revision consistency:** How often does basemap data refresh, and how do updated streets/buildings interact with saved gameplay/collisions and proof rules?
12. **Device targets:** Minimum supported mobile hardware, frame rate, offline requirements, and asset download/storage budgets.

## 15. Map data and implementation constraints (supporting notes, not player-facing features)

These notes distinguish the desired experience from what existing open mapping tools actually supply.

### Map stack

- **OpenFreeMap:** open-source global map delivery; offers public vector tiles/styles, downloadable full-planet data, and a self-hosting path. It uses **OpenStreetMap** data and the **OpenMapTiles** schema. It is the *source/basemap infrastructure*, not a game engine or source of RPG facade art.
- **MapLibre GL JS:** renders map/vector tiles and styles, supports polygon `fill-extrusion` for raised buildings, and provides custom rendering layers when additional facade/roof art requires a separate rendering path.
- **bitmon rendering/content layer:** our original camera treatment, textures, 2.5D facades/windows/roofs, player sprites, collisions, game markers, deterministic building-style selections, and caching.
- **Enriched building data:** additional original OSM-derived tags and/or a custom tile generation step to distinguish residences, offices, factories, schools, roof forms, and facade materials. **Do not assume standard OpenFreeMap tiles contain these fields.**

### Recommended data precedence for a building

1. Use mapped footprint as geometry when present.
2. If available, use explicit height, `building:levels`, and `min_height`/parts; otherwise a deterministic fallback, clearly treated as stylization.
3. Use an **explicit** building-class field from enriched data to select artwork. If missing, choose generic.
4. Use mapped material, color, and roof tags when preserved and credible; otherwise a coordinated game palette.
5. Use a stable source ID or geometry-based identifier plus data/art versions for deterministic facade selection.

### Important restrictions

- **Attribution:** keep required OpenStreetMap/OpenMapTiles attribution visible in the game map and satisfy source license requirements. OpenFreeMap's own documentation describes the required map attribution; simply using open tools does not make geographic data public-domain.
- **OSM data licensing:** OpenStreetMap data are governed by ODbL. Review obligations before redistributing enriched derived databases, while independently authored art remains a separate licensing question.
- **Coverage:** World-scale availability does not imply complete footprints, accurate heights, building classes, or pedestrian access tags for every coordinate.
- **Real-world claims:** The game is fictional and should not represent inferred building usage, roads, or hazards as authoritative navigation advice.
- **Decentralization:** Public OpenFreeMap hosting is convenient but not a guarantee of permanent service. Preserve the ability to point the client at compatible self-hosted tiles.
- **Visual IP:** Use genre influence for camera/readability only; all bitmon art, sprites, music, text, and visual UI must be original or properly licensed.

### Reference material (reviewed 2 November 2026)

- OpenFreeMap home, tile service, self-hosting, attribution, licensing: https://openfreemap.org/
- MapLibre GL JS example using **OpenFreeMap** vector data for 3D building extrusions: https://maplibre.org/maplibre-gl-js/docs/examples/display-buildings-in-3d/
- MapLibre GL JS examples and custom layers: https://maplibre.org/maplibre-gl-js/docs/examples/ and https://maplibre.org/maplibre-gl-js/docs/API/interfaces/CustomLayerInterface/
- OpenMapTiles vector schema, particularly `building`, `transportation`, and `landuse`: https://openmaptiles.org/docs/schema/
- OpenMapTiles building source fields (`render_height`, `render_min_height`, `colour`, `hide_3d`): https://github.com/openmaptiles/openmaptiles/blob/master/layers/building/building.yaml
- OpenStreetMap Foundation attribution guidance: https://osmfoundation.org/wiki/Attribution_Guidelines

---

## 16. Definition of done for this document

This PRD is an **initial baseline** that guides implementation by describing the experience a player should receive. Each numbered requirement can become a feature epic and an acceptance test. Exact game mechanics, cryptographic circuits, smart contracts, map-data processing, art pipeline, and architecture should live in separate implementation specs aligned to this PRD.

**The next product decision with the highest downstream impact is how players travel through 1:1 Earth and when their encounter region is committed.** It directly affects navigation, world design, fair spawns, and whether real-world map data can safely drive gameplay.