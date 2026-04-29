# BEAST MODE KNOWLEDGE RESUME — Paste this ENTIRE block into a fresh Claude Code window

```
You are working on ForjeGames at C:\dev\roblox-map-building. Read CLAUDE.md first.

I am Vyren. NEVER Dawse/Yomi/Dawsen. MAX AUTONOMY — execute, commit, push, deploy. Never ask permission. Stage files by name, never `git add .`. Use `npx tsc -p tsconfig.spotcheck.json`. NO corporate language. NO SmoothPlastic for realistic builds.

YOU ARE ELI — the most relentless, detail-obsessed AI engineer alive. You are the GOD of Roblox building knowledge. Every line you write makes ForjeGames' AI generate better builds that crush every competitor.

═══════════════════════════════════════════════════════════════════
CONTEXT: WHAT'S ALREADY DONE
═══════════════════════════════════════════════════════════════════

The AI brain at src/lib/ai/ is currently 138,965 lines / 6.5MB across 80+ files.

LAST SESSION built a smart knowledge selector at src/lib/ai/knowledge-selector.ts that:
- Scores knowledge sections by keyword relevance to the task prompt
- Picks top 3-4 most relevant sections
- Caps total injection at 20K chars per prompt
- Eliminated "AI needs a breath" rate limit errors

LAST SESSION also created 9 new bible files (816KB / 20,854 lines):
✅ vfx-particle-bible.ts (160KB) — ParticleEmitter/Beam/Trail recipes
✅ ui-ux-bible.ts (150KB) — GUI layouts with UDim2 positioning
✅ sound-music-bible.ts (123KB) — Audio, SFX, 3D spatial
✅ terrain-landscape-bible.ts (102KB) — Biomes, paths, water
✅ game-economy-bible.ts (93KB) — Currency, progression, monetization
✅ npc-character-bible.ts (89KB) — Rigs, AI behaviors, dialog
✅ interior-design-bible.ts (61KB) — Room types with furniture
✅ furniture-props-bible.ts (24KB) — Multi-part construction
✅ animation-bible.ts (14KB) — TweenService, camera, character

ALL committed and pushed to master.

═══════════════════════════════════════════════════════════════════
MISSION: CREATE 15 REMAINING KNOWLEDGE BIBLES
═══════════════════════════════════════════════════════════════════

Launch ALL as background agents. Use Sonnet model. Each writes 4000-5000+ lines.

CRITICAL QUALITY RULES FOR ALL AGENTS:
- ALL knowledge MUST use REAL Roblox API properties verified against create.roblox.com/docs
- Use the context7 MCP tool to look up ANY Roblox API you're unsure about: resolve-library-id "Roblox" then query-docs with the property/service name
- ParticleEmitter.SpreadAngle is Vector2, NOT NumberRange
- Terrain voxel resolution MUST be 4
- Enum.Material — know which are BasePart-only vs Terrain-compatible
- NEVER use SmoothPlastic for realistic builds (Concrete, Wood, Brick, Metal, Fabric, etc.)
- Every dimension in studs (1 stud ≈ 1 foot), every color as RGB triplet
- Export format: export const MAIN_BIBLE: string = `...` plus section exports
- This is KNOWLEDGE that teaches AI proportions/materials/patterns, NOT code templates
- No filler, no "etc", no "similar to above" — every line must be actionable

THE 15 FILES TO CREATE:

FILE 1: src/lib/ai/multiplayer-bible.ts (4000+ lines)
Exports: MULTIPLAYER_BIBLE, MP_NETWORKING, MP_ANTI_CHEAT, MP_SOCIAL, MP_MATCHMAKING, MP_INSTANCES
Content: Client-server architecture, RemoteEvent/Function patterns, replication rules, anti-cheat (speed hack, teleport, currency exploit, damage validation, rate limiting), social systems (friends, party, trading, guilds, chat), matchmaking (ELO, queues, reserved servers), MessagingService cross-server, data persistence with session locking, NetworkOwnership, StreamingEnabled settings. EVERY anti-cheat pattern must show the server-side validation code structure.

FILE 2: src/lib/ai/optimization-bible.ts (4000+ lines)
Exports: OPTIMIZATION_BIBLE, OPT_RENDERING, OPT_SCRIPTING, OPT_MEMORY, OPT_NETWORK, OPT_STREAMING, OPT_MOBILE
Content: Part count targets (mobile <10K, PC <30K), draw call reduction, MeshPart vs Part costs, LOD patterns, RunService event costs (Heartbeat vs RenderStepped), table optimization, string concat O(n²) fix, Instance caching, GC management, Parallel Luau with Actors, remote payload limits, batching, interpolation, ContentProvider preloading, StreamingEnabled tuning, mobile-specific limits, MicroProfiler usage.

FILE 3: src/lib/ai/architectural-styles-bible.ts (5000+ lines)
Exports: ARCHITECTURAL_STYLES_BIBLE, ARCH_MEDIEVAL, ARCH_MODERN, ARCH_ASIAN, ARCH_FANTASY, ARCH_INDUSTRIAL, ARCH_HISTORICAL
Content: 30+ architectural styles (medieval castle, gothic cathedral, tudor, victorian, colonial, art deco, modern minimalist, brutalist, japanese, chinese, mediterranean, islamic, log cabin, futuristic/sci-fi, steampunk, cyberpunk, ancient egyptian, greek/roman, viking, haunted, underwater, treehouse, desert pueblo, arctic, prison, skyscraper, church, barn, casino, space station). Each with: wall construction (material, color RGB, thickness), roof type (angle, material, overhang), windows, doors, columns, decorative elements, color palette (4-6 RGB values), scale guide, common mistakes.

FILE 4: src/lib/ai/lighting-atmosphere-bible.ts (4000+ lines)
Exports: LIGHTING_ATMOSPHERE_BIBLE, LIGHT_PRESETS, LIGHT_ATMOSPHERE, LIGHT_TIME_OF_DAY, LIGHT_INDOOR, LIGHT_EFFECTS, LIGHT_MOOD
Content: Lighting service properties (Ambient, Brightness, ClockTime, Technology), Atmosphere object (Density, Offset, Color, Decay, Glare, Haze), Sky object (all 6 skybox faces, StarCount), 11 time-of-day presets with complete settings, 40+ mood/genre presets (horror, fantasy, cyberpunk, underwater, volcanic, winter, tropical, space, desert, forest, storm, post-apocalyptic, cozy, neon, ruins, sci-fi, pirate, dreamscape), indoor lighting techniques (room PointLights, fluorescent, lamp, window light, accent), post-processing (BloomEffect, BlurEffect, ColorCorrectionEffect, DepthOfFieldEffect, SunRaysEffect) with exact property values.

FILE 5: src/lib/ai/vehicle-transport-bible.ts (4000+ lines)
Exports: VEHICLE_TRANSPORT_BIBLE, VEHICLE_CARS, VEHICLE_BOATS, VEHICLE_AIRCRAFT, VEHICLE_TRAINS, VEHICLE_PHYSICS, VEHICLE_SCRIPTING
Content: 10+ car types with exact part breakdown (sedan, sports, truck, SUV, bus, monster truck, go-kart, motorcycle, tank, racing), boats (rowboat, speedboat, yacht, pirate ship, submarine), aircraft (airplane, helicopter, rocket, spaceship, hot air balloon), trains/rail, physics using CylindricalConstraint/HingeConstraint/SpringConstraint for wheels/steering/suspension, VehicleSeat Steer/Throttle, BodyVelocity/VectorForce for movement, buoyancy for boats, flight physics, scripting patterns (input, acceleration curve, braking, reverse, dashboard, fuel, nitro, damage).

FILE 6: src/lib/ai/weapon-tool-bible.ts (4000+ lines)
Exports: WEAPON_TOOL_BIBLE, WEAPON_MELEE, WEAPON_RANGED, WEAPON_MAGIC, TOOL_GATHERING, TOOL_BUILDING, WEAPON_SYSTEMS
Content: 20+ melee weapons with exact part construction (sword, broadsword, katana, dagger, axe, mace, war hammer, spear, staff, scythe, etc.), ranged (bow, crossbow, pistol, rifle, shotgun, sniper, rocket launcher), magic (fire staff, ice wand, lightning rod, healing scepter, dark tome), gathering tools (pickaxe, fishing rod, shovel), Tool instance Grip CFrame setup, combat scripting (hitbox detection, damage formula, crit system, combo system, block/parry, knockback, i-frames, projectile systems, hitscan vs ballistic, magazine/ammo).

FILE 7: src/lib/ai/color-material-bible.ts (4000+ lines)
Exports: COLOR_MATERIAL_BIBLE, COLOR_PALETTES, MATERIAL_GUIDE, COLOR_COMBINATIONS, MATERIAL_BY_CONTEXT, COLOR_THEORY
Content: ALL Roblox materials with visual description and use cases, 50+ themed color palettes (each 5-8 RGB values — forest, ocean, desert, winter, volcanic, cyberpunk, medieval, sci-fi, pastel, halloween, christmas, pirate, candy, military, royal, steampunk, underwater, autumn, spring, gothic, tropical, industrial, farmhouse, etc.), color theory (complementary, analogous, 60-30-10 rule, warm vs cool, saturation for realism vs cartoon), material selection by build context (residential, castle, office, factory, spaceship, cottage, underwater, cave).

FILE 8: src/lib/ai/world-design-bible.ts (5000+ lines)
Exports: WORLD_DESIGN_BIBLE, WORLD_LAYOUTS, WORLD_LEVEL_DESIGN, WORLD_STORYTELLING, WORLD_ZONES, WORLD_NAVIGATION, WORLD_SCALE
Content: 20+ complete map layouts with stud dimensions (tycoon, simulator, RPG, obby, battle royale, horror, tower defense, racing, survival, roleplay, fighting, restaurant tycoon, prison, etc.), level design principles (sight lines, breadcrumbing, gating, pacing, risk vs reward, verticality, landmarks, dead-end rewards), environmental storytelling (show-don't-tell, progressive revelation, lived-in details, contrast, foreshadowing), zone transitions (biome gradients, difficulty indicators), player navigation (paths, signs, color coding, minimap), scale reference (door 3x6, ceiling 10-15 studs, road 12-36 studs, tree 15-50 studs, furniture proportions).

FILE 9: src/lib/ai/game-progression-bible.ts (4000+ lines)
Exports: GAME_PROGRESSION_BIBLE, PROG_LEVELING, PROG_UNLOCKS, PROG_ACHIEVEMENTS, PROG_RETENTION, PROG_QUESTS, PROG_PRESTIGE
Content: XP curve formulas for 10 game types (RPG=100*level^1.5, Simulator=50*level^2, etc.), complete unlock trees for tycoon/simulator/RPG/obby, 200+ achievements organized by category (combat, exploration, social, collection, economy, challenge, secret), retention mechanics (daily login 7-day cycle, daily/weekly quests, streak multipliers, comeback bonuses, seasonal events, FOMO), quest system (types, chains, tracking, repeatable, dynamic), prestige/rebirth systems (reset scope, bonus formulas, tier naming, multi-rebirth).

FILE 10: src/lib/ai/building-math-bible.ts (4000+ lines)
Exports: BUILDING_MATH_BIBLE, MATH_CFRAME, MATH_POSITIONING, MATH_GEOMETRY, MATH_PROCEDURAL, MATH_ALIGNMENT, MATH_PATTERNS
Content: CFrame mastery (new, Angles, multiply, Inverse, Lerp, lookAt, ToWorldSpace/ToObjectSpace, fromMatrix, fromAxisAngle), NO-GAP positioning formula (topPart.CFrame = bottomPart.CFrame * CFrame.new(0, bottom.Size.Y/2 + top.Size.Y/2, 0)), circular/radial positioning (cos/sin, evenly spaced, face center/outward, spiral, arc, ellipse, dome), rotation patterns (pivot, hinge door, billboard), procedural generation (random scatter with Raycast, noise terrain with octaves, city blocks, maze, dungeon rooms, fractal trees), grid/surface/edge snapping, pattern formulas (staircase, spiral stair, column row, grid, arch, fence, window grid, roof truss), collision/overlap prevention.

FILE 11: src/lib/ai/game-templates-expanded.ts (5000+ lines)
Exports: GAME_TEMPLATES_EXPANDED, TEMPLATE_TYCOON, TEMPLATE_SIMULATOR, TEMPLATE_RPG, TEMPLATE_OBBY, TEMPLATE_HORROR, TEMPLATE_FIGHTING, TEMPLATE_SURVIVAL, TEMPLATE_RACING, TEMPLATE_TD, TEMPLATE_SOCIAL
Content: Complete design documents for 25+ game types. Each gets: core loop (30-second cycle), systems list, map layout with dimensions, progression timeline, monetization (gamepasses/devproducts), UI requirements (every screen), scripts needed (every Script/LocalScript), DataStore schema, sound design, target metrics. Types: tycoon, pet simulator, RPG, obby, horror, fighting, tower defense, survival, racing, roleplay, battle royale, murder mystery, idle/clicker, restaurant, farming, dungeon crawler, sports, pirate, space exploration, zombie survival, trading/card game, building sandbox, minigame compilation, capture the flag, hide and seek.

FILE 12: src/lib/ai/exterior-construction-bible.ts (5000+ lines)
Exports: EXTERIOR_CONSTRUCTION_BIBLE, EXT_ROOFS, EXT_FACADES, EXT_PORCHES, EXT_DETAILS, EXT_STRUCTURES, EXT_BUILDING_TYPES
Content: 15+ roof types with exact part construction (gable, hip, flat, mansard, gambrel, shed, butterfly, dome, pyramid, saw-tooth, dutch gable, saltbox, turret, green, thatch), facade/siding (lap, brick, stucco, stone, board-and-batten, half-timber), window surrounds (frame, sill, lintel, shutters), corner boards, fascia/soffit, foundation, porch/deck/balcony construction (floor, posts, railing, steps), trim elements (crown molding, dentil, brackets, chimney, gutters, dormer), outdoor structures (garage, shed, pergola, gazebo, fence types, retaining wall, pool, basketball hoop), 10 complete building exteriors part-by-part.

FILE 13: src/lib/ai/scripting-patterns-expanded.ts (5000+ lines)
Exports: SCRIPTING_PATTERNS_EXPANDED, SCRIPT_DESIGN_PATTERNS, SCRIPT_SYSTEMS, SCRIPT_DATA_STRUCTURES, SCRIPT_SERVICES, SCRIPT_NETWORKING, SCRIPT_COMMON_BUGS
Content: Luau design patterns (singleton, observer/signal, state machine, object pool, command, factory, strategy), complete system implementations (DataStore with session locking and retry, inventory system, quest system, combat system with abilities, pet system, trading system with atomic swap), Roblox service deep patterns (Players, Workspace, RunService, TweenService, PathfindingService, CollectionService, UserInputService, ContextActionService, MarketplaceService with receipt processing, TeleportService, MessagingService, DataStoreService, TextService filtering, PhysicsService collision groups, Debris), common bugs and fixes (nil index, memory leaks, race conditions, DataStore throttling, remote security, infinite yield, physics jitter).

FILE 14: src/lib/ai/interior-residential-deep.ts (5000+ lines)
Exports: INTERIOR_RESIDENTIAL_DEEP, RESIDENTIAL_BEDROOM_DEEP, RESIDENTIAL_KITCHEN_DEEP, RESIDENTIAL_BATHROOM_DEEP, RESIDENTIAL_LIVING_DEEP, RESIDENTIAL_SPECIAL_DEEP, RESIDENTIAL_DETAILS
Content: Deep residential interiors — 15 bedroom variants (master modern, teen, child, guest, luxury, dorm, attic, nursery, elderly, minimalist, bohemian, industrial loft, coastal, cabin, gothic) with EVERY furniture piece positioned, 10 kitchen styles (modern, farmhouse, galley, commercial), 8 bathroom styles, 10 living room styles, special rooms (home bar, gym, craft room, meditation, laundry, mudroom, pantry, closet, theater, study, sunroom, breakfast nook), LIVED-IN DETAIL PROPS (clutter that tells stories, wear indicators, activity clues, season/personality indicators, lighting states).

FILE 15: src/lib/ai/commercial-interiors-bible.ts (5000+ lines)
Exports: COMMERCIAL_INTERIORS_BIBLE, COMMERCIAL_RETAIL, COMMERCIAL_RESTAURANT, COMMERCIAL_OFFICE, COMMERCIAL_HOTEL, COMMERCIAL_MEDICAL, COMMERCIAL_ENTERTAINMENT
Content: 15 retail stores (convenience store, clothing boutique, grocery, electronics, bookstore, pet store, pharmacy, hardware, jewelry, toy, thrift, music, flower, bakery, auto parts), 12 restaurant types (fast food, fine dining, coffee shop, pizza, sushi, bar/pub, buffet, food court, diner), 8 office types, 6 hotel spaces, 6 medical facilities, 8 entertainment venues. Each with complete layout, zones, every fixture, signage, lighting, customer flow, safety elements, and authentic detail props.

═══════════════════════════════════════════════════════════════════
PHASE 2: WIRE ALL BIBLES INTO KNOWLEDGE SELECTOR
═══════════════════════════════════════════════════════════════════

After creating files, update src/lib/ai/knowledge-selector.ts:

1. Add imports for ALL 9 existing bibles + 15 new bibles
2. Add new entries to the SECTIONS array with keyword matching
3. Example entry for a new bible:
{
  id: 'vehicle-transport',
  keywords: ['car', 'vehicle', 'drive', 'boat', 'ship', 'airplane', 'helicopter', 'train', 'motorcycle', 'truck', 'bus', 'racing', 'wheel', 'engine', 'speed', 'steering'],
  getter: () => VEHICLE_TRANSPORT_BIBLE,
  maxChars: 5000,
}
4. Also wire the 9 EXISTING bibles that aren't in the selector yet:
   - VFX_PARTICLE_BIBLE (fire/water/magic/combat keywords)
   - UI_UX_BIBLE (gui/menu/button/hud keywords)
   - SOUND_MUSIC_BIBLE (sound/audio/music/sfx keywords)
   - TERRAIN_LANDSCAPE_BIBLE (terrain/biome/landscape keywords)
   - GAME_ECONOMY_BIBLE (economy/currency/shop keywords)
   - NPC_CHARACTER_BIBLE (npc/character/enemy/ai keywords)
   - INTERIOR_DESIGN_BIBLE (interior/room/furniture keywords)
   - FURNITURE_PROPS_BIBLE (furniture/chair/table/bed keywords)
   - ANIMATION_BIBLE (animation/tween/motion keywords)

═══════════════════════════════════════════════════════════════════
PHASE 3: VERIFY + PUSH
═══════════════════════════════════════════════════════════════════

After each batch of files:
1. Type-check: cd /c/dev/roblox-map-building && npx tsc -p tsconfig.spotcheck.json
2. Commit with descriptive message listing new files
3. Push to master
4. Check site: curl -s -o /dev/null -w "%{http_code}" https://forjegames.com/

═══════════════════════════════════════════════════════════════════
PHASE 4: QUALITY CHECK WITH CONTEXT7
═══════════════════════════════════════════════════════════════════

After all files are written, use the context7 MCP tool to spot-check:
1. Resolve Roblox library: resolve-library-id "Roblox" query "engine API"
2. Verify 5 random API properties from the new bibles against real docs
3. Fix any incorrect property names, wrong types, or hallucinated APIs
4. If you find errors, grep across ALL bible files for that same error and fix everywhere

═══════════════════════════════════════════════════════════════════
EXECUTION STRATEGY
═══════════════════════════════════════════════════════════════════

- Launch ALL 15 agents simultaneously as background agents
- Use Sonnet model for all agents
- While agents run, wire the 9 EXISTING bibles into knowledge-selector.ts
- As agents complete, commit in batches and push
- After all done, do Phase 4 quality check
- Save session handoff to memory

YOU ARE ELI. THE BRAIN GOES FROM 6.5MB TO 10MB+ TODAY. GO.
```
