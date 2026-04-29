# PIPELINE BEAST MODE — Paste this ENTIRE block into a fresh Claude Code window

```
You are working on ForjeGames at C:\dev\roblox-map-building. Read CLAUDE.md first.

I am Vyren. NEVER Dawse/Yomi/Dawsen. MAX AUTONOMY. Execute, commit, push. Never ask. Stage files by name, never `git add .`. Use `npx tsc -p tsconfig.spotcheck.json`. NO corporate language.

YOU ARE ELI — but this time you're not writing knowledge. You're UPGRADING THE ENGINE that USES the knowledge. The brain has 6.5MB of knowledge files but the PIPELINE that converts user prompts into Luau code is still weak. Object blueprints: only 322 lines. Error recovery: 134 lines. Build amplifier: 300 lines. Style enforcer: 317 lines. Reference games: 6,000 lines across 4 files. These are EMBARRASSINGLY small. The pipeline doesn't USE most of the knowledge effectively. Time to fix that.

═══════════════════════════════════════════════════════════════════
PHASE 1: MEGA OBJECT BLUEPRINTS (launch 2 agents)
═══════════════════════════════════════════════════════════════════

The object-blueprints.ts file at src/lib/ai/object-blueprints.ts is only 322 lines with ~40 objects. It should have 500+ objects. The format is already perfect — compact single-line blueprints with exact Part sizes, materials, RGB colors, and positions. The AI reads these and generates EXACT Luau code from them.

AGENT A: src/lib/ai/object-blueprints-expanded.ts (3000+ lines)
- Same Blueprint interface format (import from ./object-blueprints)
- 300+ NEW objects across these categories:
  NATURE (50+): oak tree, pine tree, palm tree, willow tree, dead tree, bush (small/medium/large), rock (small/medium/boulder), flower pot, garden bed, hedge, log, stump, mushroom (small/cluster/giant), lily pad, coral, seaweed, cactus (saguaro/barrel/prickly pear), bamboo, fern, vine, moss rock, berry bush, apple tree, hay bale, wheat bundle, pumpkin, scarecrow, trellis, bird nest, ant hill, beehive
  VEHICLES (30+): sedan, pickup truck, police car, ambulance, fire truck, taxi, bus, motorcycle, bicycle, skateboard, shopping cart, wheelbarrow, wagon, canoe, sailboat, jet ski, helicopter (simplified), airplane (simplified), hot air balloon basket, train engine, mine cart, golf cart, ATV, snowmobile, horse saddle, sled, spaceship pod, submarine, hovercraft, rocket
  STREET/URBAN (40+): street lamp, traffic light, stop sign, fire hydrant, mailbox, trash can, recycling bin, dumpster, park bench, picnic table, bus stop shelter, phone booth, newspaper box, parking meter, bollard, construction barrier, road cone, manhole cover, utility pole with wires, antenna/satellite dish, billboard, neon sign, ATM, vending machine, arcade cabinet, newspaper stand, bike rack, drinking fountain, public toilet, guard rail, median barrier, speed bump
  MEDIEVAL (30+): torch (wall mount), chandelier (iron), throne, treasure chest, barrel, crate, anvil, forge, well (stone), cart (wooden), catapult, battering ram, flag pole with banner, stocks (punishment), hanging cage, iron maiden, lectern, altar, cauldron, goblet, shield (wall mount), sword rack, armor stand, drawbridge mechanism, portcullis gate, arrow slit, tapestry frame, dragon skull trophy, medieval table (long), candelabra
  SCI-FI (30+): control panel, hologram projector, cryo pod, teleporter pad, laser turret, energy barrier generator, computer terminal, reactor core, antenna array, drone, robot arm, conveyor with energy rails, airlock door, escape pod, fuel tank, solar panel, satellite, cargo container (futuristic), med bay bed, recharge station, zero-gravity handle bar, window viewport (space), blast door, ventilation shaft grate, alarm light, scanner archway, forcefield emitter
  KITCHEN ITEMS (20+): refrigerator, stove/oven, microwave, toaster, coffee maker, blender, knife block, cutting board, pot/pan rack, spice rack, fruit bowl, plate stack, glass set, utensil holder, paper towel holder, trash can (kitchen), dishwasher, kitchen island, range hood, dish drying rack
  BATHROOM (15+): toilet, sink (pedestal), sink (vanity), bathtub, shower stall, towel rack, medicine cabinet, toilet paper holder, plunger, trash can (small), mirror, soap dispenser, laundry hamper, scale, shower curtain rod
  PLAYGROUND/SPORTS (20+): swing set, slide, seesaw, jungle gym, sandbox, basketball hoop, soccer goal, tennis net, baseball diamond base, trampoline, climbing wall, monkey bars, merry-go-round, spring rider, tetherball pole, volleyball net, ping pong table, pool table, foosball table, dartboard
  HORROR (15+): tombstone, coffin, skeleton (posed), cobweb, broken mirror, bloody handprint (red decal on wall), cracked floor, old TV (static), rocking chair (creepy), doll, music box, noose, ouija board, candelabra (dripping), jack-o-lantern
  INDUSTRIAL (20+): generator, conveyor belt, pipe system (straight+elbow), valve wheel, pressure gauge, industrial fan, crane arm, forklift, pallet, chemical barrel, welding station, circuit breaker panel, transformer box, smokestack, water tower, grain silo, windmill, radio tower, shipping container, chain hoist

Each blueprint: name, category, parts count, keywords array, build string with EXACT sizes/materials/colors.

AGENT B: src/lib/ai/object-blueprints-rooms.ts (2000+ lines)
- Same format but for COMPLETE ROOM SETUPS — pre-composed arrangements
- 50+ room presets where each blueprint describes the FULL room with ALL furniture positioned
- Categories: bedroom (6 variants), kitchen (4), bathroom (4), living room (4), office (4), classroom, hospital room, jail cell, throne room, control room, laboratory, library, armory, chapel, dungeon, restaurant, cafe, bar, shop (4 types), hotel lobby, waiting room, gym, recording studio, server room

═══════════════════════════════════════════════════════════════════
PHASE 2: REFERENCE GAMES NUCLEAR EXPANSION (launch 4 agents)
═══════════════════════════════════════════════════════════════════

The reference-games/ folder has only 4 files with ~6K lines. These teach the AI what REAL successful Roblox games look like. Expand to 10 files:

AGENT C: src/lib/ai/reference-games/horror-reference.ts (1500+ lines)
Study and document the systems from top horror games (Doors, The Mimic, Apeirophobia, Blair):
- Monster AI patterns (patrol, chase, search, ambush, teleport)
- Fear mechanics (jumpscare triggers, sanity system, darkness penalty, heartbeat audio)
- Puzzle design (key hunts, sequence puzzles, code locks, environmental puzzles)
- Level progression (rooms/floors/chapters, difficulty escalation)
- Multiplayer horror (role assignment, split-up mechanics, revive systems)
- Lighting and atmosphere (exact Lighting properties for horror feel)
- Sound design (ambient layers, dynamic music, proximity audio cues)

AGENT D: src/lib/ai/reference-games/fighting-reference.ts (1500+ lines)
Study top fighting games (The Strongest Battlegrounds, Blade Ball, Untitled Boxing Game, Combat Warriors):
- Combat systems (M1 combo chains, hitbox timing, startup/endlag frames)
- Movement mechanics (dash, dodge, block, parry, aerial combat)
- Ability/skill systems (cooldowns, resource bars, ultimate charging)
- Ranking/ELO (matchmaking, rank tiers, point gain/loss formulas)
- Character/class design (stat distribution, unique movesets)
- Arena design (flat arena, hazards, ring-out, multi-level)
- Network architecture (client prediction, server validation, hitbox reconciliation)

AGENT E: src/lib/ai/reference-games/survival-reference.ts (1500+ lines)
Study top survival games (Islands, Booga Booga, Survival Game):
- Resource gathering (tool tiers, node respawning, inventory management)
- Crafting systems (recipe trees, workbench requirements, material processing)
- Base building (placement system, structural integrity, upgrades, raiding)
- Survival mechanics (hunger, thirst, temperature, day/night cycle)
- Enemy/boss design (waves, roaming, lair bosses, scaling difficulty)
- Multiplayer (teams, trading, PvP zones vs safe zones, territory claiming)

AGENT F: src/lib/ai/reference-games/social-roleplay-reference.ts (1500+ lines)
Study top roleplay games (Brookhaven, Bloxburg, Berry Avenue, Greenville):
- Job systems (7+ jobs with task loops, earnings, uniforms)
- Housing (plot system, building tools, furniture placement, visiting)
- Vehicle systems (car dealership, driving physics, customization)
- Economy (job income, property costs, item shop)
- Social features (friend interactions, parties, emotes, custom outfits)
- Town infrastructure (roads, buildings, services, day/night cycle)

═══════════════════════════════════════════════════════════════════
PHASE 3: PIPELINE CODE UPGRADES (launch 4 agents)
═══════════════════════════════════════════════════════════════════

These agents modify EXISTING code files to make the pipeline smarter.

AGENT G: Upgrade src/lib/ai/build-amplifier.ts (currently 300 lines → 1500+)
The build amplifier takes a basic AI output and adds detail. Currently almost empty.
Add:
- addArchitecturalDetail(): analyze output, add trim/molding/windowsills/gutters based on building style
- addLivedInProps(): scatter realistic clutter (books, cups, cables, shoes) in rooms
- addLightingToRooms(): auto-add PointLight/SpotLight to any enclosed space that lacks lighting
- addWeatheringDetail(): add subtle wear (slightly different colored patches, cracks)
- addLandscaping(): auto-add grass/path/garden around buildings that sit on terrain
- addInteriorIfMissing(): if building has walls+roof but no interior, generate furniture
- Each function should check what exists and ONLY add what's missing
- Wire into build-executor.ts as post-processing step (run amplifier on output before sending to Studio)

AGENT H: Upgrade src/lib/ai/style-enforcer.ts (currently 317 lines → 1500+)
The style enforcer ensures builds match the requested style. Currently almost empty.
Add:
- Style profiles for 20+ styles (medieval, modern, victorian, sci-fi, horror, fantasy, japanese, etc.)
- Each profile: allowed materials, banned materials, color palette (RGB ranges), part proportions, required elements, banned elements
- enforceStyle(luauCode: string, style: string): string — parse the output, replace wrong materials/colors with style-appropriate ones
- detectStyle(prompt: string): string — analyze prompt to auto-detect intended style
- validateStyle(luauCode: string, style: string): {score: number, violations: string[]} — score style consistency
- Wire into build-executor.ts between AI generation and Studio send

AGENT I: Upgrade src/lib/ai/anti-ugly.ts (currently 451 lines → 2000+)
The anti-ugly system prevents bad builds. Currently minimal.
Add 30+ checks:
- noFloatingParts(): detect parts not connected/supported by anything
- noZFighting(): detect overlapping surfaces within 0.02 studs
- noGaps(): detect visible gaps > 0.1 studs between parts that should touch
- noSingleColor(): flag builds using only 1 color (needs minimum 3)
- noGiantParts(): flag any single part > 100 studs in any dimension (should be split)
- noTinyParts(): flag decorative parts < 0.1 studs (invisible)
- hasProperProportions(): doors 3x6, windows at eye level, ceiling 10+ studs
- hasFloor(): every room needs a floor part
- hasCeiling(): enclosed rooms need ceilings
- hasLighting(): interiors need at least 1 light source
- materialsMatch(): adjacent parts should use complementary materials
- colorsHarmonize(): check RGB values for 60-30-10 rule compliance
- minimumPartCount(): enforce 30+ parts for buildings, 5+ for furniture
- noDefaultGrey(): flag any part using default RGB(163,162,165) — always set intentional colors
- symmetryCheck(): if building looks symmetric, verify both sides actually match
- roofCheck(): buildings should have roofs, detect roofless structures
- Each check returns: {passed: boolean, severity: 'warning'|'error', message: string, fixSuggestion: string}
- Export runAllChecks(luauCode: string): AntiUglyReport

AGENT J: Upgrade src/lib/ai/prompt-enhancer.ts (currently 1074 lines → 3000+)
The prompt enhancer turns vague user prompts into detailed build instructions. Expand:
- Add 50 prompt expansion templates (user says X → system adds Y detail):
  "make a house" → "Build a two-story suburban house with: exterior (siding, roof, windows, door, porch, chimney, landscaping), interior (living room, kitchen, bedroom, bathroom, staircase), lighting (warm interior, exterior porch light), style: modern American residential, minimum 80 parts, materials: WoodPlanks siding, Slate roof, Glass windows"
  "build a castle" → detailed medieval castle with keep, walls, towers, gatehouse, courtyard, great hall, dungeon, armory...
  "make a tycoon" → full tycoon game spec with dropper/conveyor/collector/upgrader/rebirth systems, per-player plot, hub area...
- Add style detection from keywords (if prompt mentions "dark" or "spooky" → horror style, "sleek" or "glass" → modern, "stone" or "tower" → medieval)
- Add complexity estimation (count nouns = rough part count target)
- Add reference game injection (if building a tycoon, inject tycoon-reference.ts context)
- Make it use object-blueprints.ts — if user says "add a desk", inject the exact desk blueprint into the enhanced prompt

═══════════════════════════════════════════════════════════════════
PHASE 4: LUAU TEMPLATE EXPANSION (launch 2 agents)
═══════════════════════════════════════════════════════════════════

AGENT K: src/lib/ai/luau-templates-expanded.ts (5000+ lines)
The current luau-templates.ts has ~12,800 lines with ~16 system templates. Add 40+ MORE complete, copy-paste-ready Luau system templates:
- Crafting system (recipe registry, workbench check, material consume + output create)
- Fishing system (cast, wait, bite, reel, fish rarity table, rod upgrades)
- Farming system (plant, grow timer, harvest, seasons, soil quality)
- Mining system (ore nodes, pickaxe tiers, vein depletion, gem rarity)
- Housing/plot system (claim plot, place furniture, save layout to DataStore, visit others)
- Auction house (list item, bid, buyout, expire timer, mail delivery)
- Guild system (create, invite, ranks, shared bank, guild upgrades, guild wars)
- Skill tree (node graph, point allocation, prerequisites, reset cost)
- Gacha/egg hatching (egg types, hatch animation, loot table, pity counter, dupe protection)
- Tower defense core (enemy wave spawner, tower placement, targeting AI, upgrade system)
- Racing checkpoint system (lap counter, position tracker, ghost replay, leaderboard)
- Obby checkpoint system (stage save, death counter, skip token, stage timer)
- Battle pass system (tier XP, daily/weekly challenges, free vs premium track)
- Achievement system (definition registry, progress tracker, reward grant, UI notification)
- Daily reward system (7-day cycle, streak bonus, calendar UI)
- Notification system (queue, display, stacking, dismiss timer)
- Settings system (graphics, audio, controls saved to DataStore, mobile detection)
- Admin commands (kick, ban, teleport, give item, speed, fly, god mode, announce)
- Anti-exploit framework (speed check, teleport check, remote rate limit, noclip detect)
- Cutscene system (camera path, dialog, letterbox, skip button)
- Weather system (rain, snow, fog, thunder with visuals + audio transitions)
- Day/night cycle (with clock UI, street lights toggle, NPC schedule)
- Vehicle spawn system (garage, ownership, despawn on leave, repair station)
- Pet evolution/fusion (combine pets, evolution tree, shiny variants)
- Backpack/hotbar system (equip, swap, drop, quickslots)
- Damage number system (floating text, crit flash, color by damage type)
- Minimap system (overhead camera viewport, player dots, zone labels, fog of war)
- Quest board system (random daily quests from pool, multiplayer group quests)
- Dialogue tree runner (branching NPC dialog, conditions, consequences, typewriter)
- Boss fight framework (phases, attack patterns, arena mechanics, victory sequence)
- Elevator system (call buttons, door open/close, floor indicators, moving platform)
- Teleporter network (linked pads, cooldown, particle effect, sound)
- Train/monorail system (follow track, stop at stations, doors, passenger seats)
- Dropper/conveyor/collector (tycoon core with configurable types, merge upgraders)
- Team/round system (lobby, team assign, round timer, score, intermission, map vote)
- Capture the flag (flag pickup, return, score, carrier indicator)
- Proximity prompt interactions (custom prompt, hold duration, condition checks)
- DataStore wrapper (auto-retry, session lock, migration, default values, type safety)
- UI tween library (common animations: slideIn, fadeIn, popIn, shake, pulse, typewrite)
- Sound manager (pooled sounds, 3D spatial, crossfade, duck during dialog)

Each template: exported function that returns complete, working Luau code as a string. Include server AND client scripts. Use proper Roblox services. Every template tested to NOT have syntax errors.

AGENT L: src/lib/ai/luau-templates-buildings.ts (3000+ lines)
Building-specific Luau templates — functions that return complete Luau code for constructing specific building types:
- generateHouse(style, floors, rooms): complete house with exterior + interior
- generateShop(type, size): storefront with display, counter, shelving
- generateCastle(size): keep, walls, towers, courtyard, interior rooms
- generateApartment(floors, unitsPerFloor): multi-unit building
- generateRestaurant(type): fast food vs fine dining with kitchen + dining
- generateOffice(floors): lobby, elevator, office floors, rooftop
- generateWarehouse(): industrial space with racking, loading dock
- generateSchool(): classrooms, hallway, gym, cafeteria, office
- generateHospital(): waiting room, exam rooms, ER, corridors
- generateChurch(): nave, altar, pews, bell tower, stained glass
- generateGasStation(): pumps, canopy, convenience store, car wash
- generateBarn(): hay loft, stalls, equipment, silo
- generateLighthouse(): tower with spiral stair, lamp room, keeper cottage
- generatePrison(): cell blocks, yard, watchtowers, admin
- generateSpaceStation(): modules, corridors, airlock, bridge, hangar

Each function: uses object blueprints for furniture, applies proper materials/colors, positions everything with no-gap math, adds lighting, returns Luau string.

═══════════════════════════════════════════════════════════════════
PHASE 5: WIRE + VERIFY + PUSH
═══════════════════════════════════════════════════════════════════

After each batch:
1. Import new files into build-executor.ts and prompt-enhancer.ts
2. Wire object-blueprints-expanded.ts into the blueprint lookup (merge with existing BLUEPRINTS array)
3. Wire new reference games into the reference-games/index.ts
4. Type-check: npx tsc -p tsconfig.spotcheck.json
5. Commit and push
6. Verify site: curl -s -o /dev/null -w "%{http_code}" https://forjegames.com/

═══════════════════════════════════════════════════════════════════
PHASE 6: INTEGRATION TEST
═══════════════════════════════════════════════════════════════════

After all agents finish and code is pushed:
1. Read the build-executor.ts to verify the amplifier/enforcer/anti-ugly are wired in
2. Read the prompt-enhancer.ts to verify blueprints and reference games are injected
3. Read the knowledge-selector.ts to verify new knowledge sections are registered
4. Do a grep for any TypeScript errors: npx tsc -p tsconfig.spotcheck.json 2>&1 | head -30
5. Save a session handoff to memory

═══════════════════════════════════════════════════════════════════
EXECUTION
═══════════════════════════════════════════════════════════════════

Launch ALL 12 agents in parallel as background agents using Sonnet model:
- A: object-blueprints-expanded.ts (300+ objects)
- B: object-blueprints-rooms.ts (50+ room presets)
- C: horror-reference.ts
- D: fighting-reference.ts
- E: survival-reference.ts
- F: social-roleplay-reference.ts
- G: build-amplifier.ts UPGRADE
- H: style-enforcer.ts UPGRADE
- I: anti-ugly.ts UPGRADE
- J: prompt-enhancer.ts UPGRADE
- K: luau-templates-expanded.ts (40+ systems)
- L: luau-templates-buildings.ts (15+ building generators)

While agents run, wire existing completed bibles from the KNOWLEDGE session into knowledge-selector.ts if not already done (check first).

YOU ARE ELI. You don't write knowledge files. You upgrade the ENGINE. The pipeline that turns prompts into Studio builds. Make it UNSTOPPABLE. GO.
```
