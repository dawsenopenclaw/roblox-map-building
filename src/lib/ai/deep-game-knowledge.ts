/**
 * deep-game-knowledge.ts
 * Massive game-design + Roblox scripting knowledge base.
 * Injected into AI system prompts so it can create UNIQUE games from scratch.
 * Every tycoon should be different. Every RPG should have its own personality.
 *
 * Sections:
 *   1. Complete Game Type Blueprints (15 genres)
 *   2. System Interaction Patterns
 *   3. Balance & Tuning Knowledge
 *   4. Roblox Scripting Patterns
 *   5. UI/UX Design Knowledge
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 1: COMPLETE GAME TYPE BLUEPRINTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const GAME_BLUEPRINTS = `
=== GAME TYPE BLUEPRINTS — 15 GENRES WITH FULL ARCHITECTURE ===

Every game you build must feel UNIQUE. Two tycoons should never play the same.
Two RPGs should have completely different worlds. Use these blueprints as a
FOUNDATION, then add creative twists based on the user's theme.

────────────────────────────────────────────────────────────
1. TYCOON
────────────────────────────────────────────────────────────

CORE LOOP: Earn → Spend → Upgrade → Earn Faster → Rebirth → Start Over Stronger

DROPPER MECHANICS (what separates good tycoons from bad ones):
- Droppers are the heartbeat. Each dropper type produces a different resource at a different rate.
- GOOD dropper progression: Start with a basic ore dropper (1 coin/drop, 2s interval).
  Second dropper unlocks at 500 coins (3 coins/drop, 1.5s interval). Third at 5,000 coins
  (10 coins/drop, 1s interval). The cost-to-output ratio should IMPROVE with each tier.
- Dropper variety ideas: Ore mines, crystal extractors, gem polishers, lava smelters,
  plasma generators, quantum harvesters, dark matter collectors, star forges.
- Each dropper should have a VISUAL identity: different part colors, particle effects,
  sound effects, and animations. A lava smelter should glow orange with fire particles.
  A crystal extractor should shimmer with sparkles.
- Dropper upgrade paths (3-5 levels each): Speed (reduce interval), Value (increase per-drop),
  Multi-drop (chance to drop 2-3 at once), Auto-collect (no conveyor needed).

CONVEYOR DESIGN:
- Conveyors carry dropped items to the collector/furnace. They are NOT just decoration.
- Speed tiers: Slow (10 studs/s), Normal (20), Fast (35), Ultra (50), Instant (teleport).
- Conveyor upgrades are a key money sink. Players love watching items move faster.
- Layout matters: L-shaped conveyors, merging lanes, splitters, and sorting systems
  add visual complexity. A straight line from dropper to collector is BORING.
- Advanced: Multi-lane conveyors that sort items by type into different collectors,
  each collector giving different multipliers for different item types.

REBIRTH MATH:
- Rebirth cost formula: cost = basePrice * multiplier^rebirths
  Example: basePrice=10000, multiplier=2.5 → Rebirth 1=10K, Rebirth 2=25K, Rebirth 3=62.5K
- Each rebirth grants: +25-50% income multiplier (compound), new dropper tier unlock,
  cosmetic reward (new conveyor skin, special effects), prestige currency.
- Prestige currency buys PERMANENT upgrades that persist through rebirths:
  Global speed boost, auto-collect radius, offline earnings, lucky drop chance.
- The key balance point: Rebirth N+1 should take 60-80% of the time Rebirth N took
  WITH the bonus applied. Players should feel faster each time but still challenged.

PRESTIGE LAYERS (for deep tycoons):
- Layer 1: Rebirth (resets droppers, grants income multiplier)
- Layer 2: Transcend (resets rebirths, grants rebirth cost reduction)
- Layer 3: Ascend (resets everything, grants prestige point multiplier)
- Each layer should feel like a meaningful reset with visible power growth.
- UI indicator: Show a small icon or badge for each prestige layer achieved.

FACTORY THEMES (each changes the entire visual/audio identity):
- Classic: Ore mines, conveyor belts, furnaces, smoke stacks. Industrial gray + orange.
- Candy: Gummy droppers, chocolate rivers, candy cane conveyors. Pink + pastel palette.
- Space: Asteroid miners, zero-G conveyors, plasma furnaces. Dark blue + neon cyan.
- Underwater: Coral extractors, current-based conveyors, bubble collectors. Teal + aqua.
- Medieval: Blacksmith forges, cart-track conveyors, treasure chests. Brown + gold.
- Futuristic: Nanobot assemblers, mag-lev conveyors, quantum collectors. Black + neon green.
- Volcanic: Magma taps, obsidian conveyors, lava furnaces. Red + dark gray.
- Arctic: Ice crystal miners, frozen slide conveyors, frost smelters. White + ice blue.

UNIQUE TYCOON TWISTS (add at least one to every tycoon):
- PvP raids: Players can attempt to steal from each other's factories (risk/reward).
- Merging: Players can combine two factories into one mega-factory with shared bonuses.
- Events: Random events (meteor shower = bonus drops, power outage = production halt).
- Quests: Daily/weekly objectives like "produce 10,000 gems" for bonus rewards.
- Automation: Players can wire up logic gates to create auto-sell, auto-upgrade chains.
- Blueprints: Discovery system where players find new dropper blueprints in the world.

TYCOON MAP LAYOUT:
- Each player gets a personal plot (typically 100x100 to 200x200 studs).
- Plots are arranged around a central hub with shops, leaderboards, and social space.
- Hub should have: Rebirth shrine, upgrade shop, cosmetics store, trading post, daily rewards NPC.
- Between plots: Shared mining areas where players compete for rare resources.

────────────────────────────────────────────────────────────
2. SIMULATOR
────────────────────────────────────────────────────────────

CORE LOOP: Click/Collect → Fill Backpack → Sell → Upgrade → Unlock Area → Repeat

CLICKING/COLLECTING CORE LOOP:
- The "click" action must feel SATISFYING: particles on hit, number popup, screen shake (subtle),
  sound effect that varies slightly each click (pitch randomization ±10%).
- Click power scaling: Base=1, upgrades add flat (+5, +10) and multiplicative (x1.5, x2).
  Formula: damage = (basePower + flatBonus) * multiplier * petBonus * rebirthMultiplier.
- Resource types per area: Each area drops different items. Forest=logs, Cave=ores,
  Ocean=pearls, Volcano=crystals, Space=stardust. This gives purpose to area progression.
- Backpack is the friction point. Player MUST return to sell when full. This creates
  the satisfying "dump" moment and prevents infinite grinding.

AREA UNLOCK PROGRESSION:
- Area 1 (Starter Meadow): FREE. Drops common items worth 1-5 coins. Safe, tutorial area.
- Area 2 (Dense Forest): 1,000 coins. Drops uncommon items worth 5-15 coins. First real challenge.
- Area 3 (Crystal Cave): 10,000 coins. Drops rare items worth 15-50 coins. Enemies appear.
- Area 4 (Frozen Peaks): 100,000 coins. Drops epic items worth 50-200 coins. Environmental hazards.
- Area 5 (Volcanic Depths): 1,000,000 coins. Drops legendary items worth 200-1,000 coins.
- Area 6 (Sky Islands): 10,000,000 coins. Drops mythical items worth 1K-5K coins.
- Area 7 (The Void): 100,000,000 coins. Drops celestial items worth 5K-25K coins.
- Area 8 (Developer Zone): 1,000,000,000 coins. End-game flex zone with cosmetic-only drops.
- Each area should have UNIQUE terrain, music, enemies, and visual style.
- Gate between areas: Visible barrier (force field, portal, locked gate) that disappears on purchase.

PET INTEGRATION:
- Pets are the #1 retention mechanic in Roblox simulators. Every simulator NEEDS pets.
- Pet rarity tiers: Common (60% hatch rate), Uncommon (25%), Rare (10%), Epic (4%), Legendary (0.9%), Mythical (0.1%).
- Pet abilities: Each pet has a primary stat bonus (click power x1.2 to x5.0).
  Rarer pets have secondary abilities: auto-collect, area damage, coin magnet, XP boost.
- Egg system: Players buy eggs with coins. Each egg has a fixed rarity table.
  Premium eggs cost Robux and have better odds. Seasonal eggs rotate monthly.
- Pet evolution: Feed duplicate pets to level up. Level 10 pets can evolve into a golden variant.
  Golden variants have 2x stats and a unique visual (golden glow, larger size, special particles).
- Pet inventory: Display up to 3 equipped pets floating behind the player. Show equipped pet bonuses in HUD.
- Pet trading: Server-side validated trades. Show pet value, rarity, and level. Confirm dialog for expensive pets.
- Shiny pets: 1-in-1000 chance on any hatch. Shiny pets have rainbow effects and 3x base stats.

BACKPACK CAPACITY CURVE:
- Starter: 25 items. First upgrade (100 coins): 50. Second (500): 100. Third (2,500): 200.
- Formula: capacity = baseCapacity * (1 + upgradeLevel * 0.5)
- Or exponential: capacity = baseCapacity * 1.3^upgradeLevel
- Max upgrades should cost meaningful amounts. The last backpack upgrade should cost
  roughly the same as unlocking the second-to-last area.

REBIRTH IN SIMULATORS:
- Rebirth resets: coins, area unlocks, backpack upgrades.
- Rebirth keeps: pets, cosmetics, rebirth currency, permanent upgrades.
- Rebirth bonus: +25% coins per rebirth, stacking multiplicatively.
- Rebirth milestones: At rebirth 5/10/25/50/100, unlock exclusive pets, areas, or titles.

SIMULATOR MONETIZATION (ethical):
- Coin boost (2x for 30 min): 50 Robux.
- Premium egg: Better pet odds (not guaranteed legendary — that's pay-to-win).
- Cosmetics: Trails, auras, name colors, emotes.
- Auto-sell pass: Automatically sells backpack contents when full.
- NEVER: Sell direct stat advantages. Never sell specific rare pets for cash.

────────────────────────────────────────────────────────────
3. RPG (Role-Playing Game)
────────────────────────────────────────────────────────────

CORE LOOP: Quest → Fight → Loot → Level Up → Equip → Quest Harder

QUEST STRUCTURE:
- Main Quest Chain: 15-30 sequential quests that tell a story. Each quest has:
  - Intro dialog (NPC explains the situation in 2-3 sentences, not walls of text)
  - Objective (kill X, collect Y, reach Z, escort NPC, solve puzzle)
  - Reward (XP, gold, equipment, ability unlock, area access)
  - Outro dialog (NPC thanks player, hints at next quest)
- Side Quests: 30-50 optional quests scattered across the world. Types:
  - Fetch quests: "Bring me 5 wolf pelts" (simple but satisfying with good rewards)
  - Kill quests: "Defeat the bandit captain in the forest camp"
  - Discovery quests: "Find the hidden shrine in the mountains"
  - Escort quests: "Protect the merchant on the road to town"
  - Puzzle quests: "Solve the ancient riddle to unlock the treasure room"
- Daily quests: 3 random quests that reset every 24 hours. Reward daily currency.
- World quests: Massive server-wide objectives (kill 1000 dragons collectively).

SKILL TREE BRANCHING:
- 3 main classes, each with 2 specializations at level 15:
  - Warrior → Berserker (AoE damage) or Guardian (tank/defense)
  - Mage → Elementalist (ranged damage) or Healer (support/healing)
  - Rogue → Assassin (burst damage) or Shadow (stealth/utility)
- Skill tree structure: 20-30 nodes per specialization. Linear core path with
  branching optional nodes. Each node costs 1 skill point (earned per level).
- Skill types: Active (press button to use, has cooldown), Passive (always on),
  Ultimate (charges over time, powerful effect).
- Respec option: Allow players to reset skill points for gold (increasing cost each time).

EQUIPMENT TIERS:
- Common (white): Base stats. Drops from regular enemies.
- Uncommon (green): +10-20% stats. Drops from elite enemies.
- Rare (blue): +25-40% stats + 1 bonus effect. Drops from mini-bosses.
- Epic (purple): +50-75% stats + 2 bonus effects. Drops from dungeon bosses.
- Legendary (orange): +100-150% stats + 3 bonus effects + unique visual. World bosses only.
- Mythical (red): +200% stats + set bonus when wearing multiple. Raid drops only.
- Equipment slots: Weapon, Helmet, Chest, Legs, Boots, Ring, Amulet, Cape.
- Set bonuses: Wearing 2/4/6 pieces of the same set grants escalating bonuses.
- Equipment enhancement: Spend gold + materials to upgrade equipment +1 through +10.
  Each level = +5% stats. Failure chance above +7 (with protection items available).

DUNGEON LAYOUTS:
- Linear dungeons (beginner): Straight path with 3-5 rooms, trash mobs, and a boss at the end.
- Branching dungeons (intermediate): Main path + 2-3 optional side rooms with better loot.
- Maze dungeons (advanced): Multiple paths, dead ends with traps, hidden rooms, puzzle doors.
- Raid dungeons (end-game): Multi-boss instances requiring 4-8 players. 3-5 boss encounters.
- Every dungeon room should have: Enemies OR a puzzle OR loot OR a rest point. No empty rooms.
- Dungeon difficulty scaling: Normal (solo-able) → Hard (needs 2-3 players) → Nightmare (4+ players).

BOSS PHASE DESIGN:
- Phase 1 (100-70% HP): Simple attack pattern. 1-2 telegraphed attacks. Teach the player.
- Phase 2 (70-40% HP): Add a new mechanic. Maybe the boss summons adds, or the arena changes.
  One new attack pattern. Faster tempo.
- Phase 3 (40-0% HP): Enrage. All attacks deal more damage. New devastating attack pattern.
  The arena may change again (platforms break, lava rises, darkness falls).
- Transition animations: Boss roars, arena shakes, music intensifies between phases.
- Boss loot: Guaranteed drop of rare+ quality. Chance for class-specific legendary.

NPC DIALOG TREES:
- Keep it SHORT. Max 3 sentences per dialog box. Players skip long text.
- Dialog options: 2-4 choices. At least one should be a question for lore-hungry players.
- Dialog states: Greeting → Quest Offer → Accept/Decline → In-Progress Check → Turn-In → Post-Quest.
- Personality: Each NPC has a consistent voice. The blacksmith is gruff. The innkeeper is warm.
  The wizard is cryptic. Write 3-4 personality adjectives per NPC and stick to them.
- Recurring NPCs: Have 5-8 NPCs that appear throughout the story, building relationships.

RPG WORLD DESIGN:
- Starter village: Safe, small, 4-5 essential NPCs (quest giver, shop, inn, blacksmith, trainer).
- 4-6 overworld zones of increasing difficulty. Each zone has: unique biome, 2-3 quest hubs,
  1 dungeon, scattered enemies, hidden secrets, 1 mini-boss.
- Fast travel: Unlock waypoints as you discover them. Teleport between discovered waypoints.
- Day/night cycle affects enemy spawns (stronger at night), NPC availability, and some quests.
- Hidden areas: At least 3-5 secret areas discoverable by exploration (behind waterfalls,
  under bridges, through fake walls). Reward with unique loot or lore.

────────────────────────────────────────────────────────────
4. OBBY (Obstacle Course)
────────────────────────────────────────────────────────────

CORE LOOP: Jump → Die → Retry → Pass → Checkpoint → Jump Harder

DIFFICULTY PROGRESSION:
- Stages 1-10 (Easy): Single jumps, wide platforms, no moving parts. Teach basic movement.
- Stages 11-25 (Medium): Smaller platforms, moving platforms, simple timing. Introduce mechanics.
- Stages 26-40 (Hard): Thin platforms, fast-moving obstacles, wall jumps, precision required.
- Stages 41-55 (Extreme): Multi-mechanic combinations, one-tile platforms, speed sections.
- Stages 56-70 (Insane): Frame-perfect jumps, invisible platforms, reverse gravity, chaos.
- Stages 71+ (Impossible): For the 0.1%. Community-event level difficulty.

CHECKPOINT SPACING:
- Easy stages: Checkpoint every stage (stages 1-10).
- Medium stages: Checkpoint every 2-3 stages (stages 11-25).
- Hard stages: Checkpoint every 3-5 stages (stages 26-40).
- Extreme+: Checkpoint every 5-10 stages (stages 41+).
- Visual checkpoint: Glowing pad with particles + sound effect + stage number display.
- Checkpoint should heal the player and reset any temporary stage effects.

OBSTACLE TYPES (60+ ideas):
Movement obstacles:
  1. Static platforms (varying sizes)  2. Moving platforms (left-right)
  3. Moving platforms (up-down)  4. Moving platforms (circular path)
  5. Disappearing platforms (timer)  6. Appearing platforms (timer)
  7. Conveyor platforms (push player)  8. Ice platforms (slippery)
  9. Bouncy platforms (trampoline)  10. Shrinking platforms
  11. Growing platforms  12. Rotating platforms (spin on axis)
  13. Tilting platforms (lean on step)  14. Sinking platforms (drop slowly when touched)
  15. Chain platforms (one triggers next)

Wall/ceiling obstacles:
  16. Wall jumps (alternating walls)  17. Ceiling crawl (low ceiling passage)
  18. Wall run sections  19. Chimney climb (narrow vertical shaft)
  20. Wall dodge (walls closing in)

Hazard obstacles:
  21. Lava floor  22. Spike walls  23. Spinning blades
  24. Pendulum swings  25. Laser grids (on/off timing)
  26. Falling boulders  27. Rising water  28. Fire jets (periodic)
  29. Electric fences  30. Acid pools
  31. Crusher walls  32. Arrow shooters  33. Wind gusts
  34. Gravity zones (reverse/low/high)  35. Darkness sections (limited visibility)

Puzzle obstacles:
  36. Color matching (step on right color)  37. Simon says (repeat pattern)
  38. Pressure plate sequences  39. Button hunt (find hidden buttons)
  40. Light beam redirecting  41. Lock and key (find key first)
  42. Maze sections  43. Memory game platforms
  44. Math doors (solve equation)  45. Riddle gates

Speed obstacles:
  46. Speed boost pads  47. Speed run sections (timed)
  48. Chase sequences (wall of death behind you)
  49. Slide sections (angled surfaces)  50. Ziplines

Combination obstacles:
  51. Moving platforms over lava  52. Disappearing platforms with wind
  53. Spinning blades on moving platforms  54. Ice + conveyor combo
  55. Wall jumps with laser timing  56. Bouncy platforms over spike pits
  57. Darkness + disappearing platforms  58. Reverse gravity + moving obstacles
  59. Shrinking platforms over acid  60. Speed section with crusher walls
  61. Tilting platforms + fire jets  62. Chain platforms over lava with boulders

STAGE THEMES (visual variety prevents boredom):
- Grassland (stages 1-10): Green, sunny, flowers, butterflies.
- Cave (stages 11-20): Dark, glowing crystals, stalactites, bats.
- Sky (stages 21-30): Clouds, rainbow bridges, floating islands, birds.
- Lava (stages 31-40): Red/orange, flowing lava, volcanic rock, ash particles.
- Ice (stages 41-50): Blue/white, snow, frozen waterfalls, aurora borealis.
- Space (stages 51-60): Stars, nebulae, asteroids, zero-gravity sections.
- Neon (stages 61-70): Cyberpunk, glowing lines, electronic music, grid floors.
- Void (stages 71+): Black/purple, reality-breaking visuals, impossible geometry.

SKIP STAGE MONETIZATION (ethical):
- Skip cost: 5-10 Robux per stage (or 1 skip token earned every 10 completions).
- Show the stage difficulty before offering skip. Some players will pay, some will grind.
- NEVER gate completion behind payment. Every stage must be physically possible.
- Cosmetic rewards for completing stages without skips (titles, trails, badges).

OBBY SOCIAL FEATURES:
- Leaderboard: Fastest completion times per stage and overall.
- Ghost system: See faint outlines of other players' recorded runs.
- Race mode: 2-4 players race through stages simultaneously.
- Stage creator: Players can build and submit custom stages.

────────────────────────────────────────────────────────────
5. ROLEPLAY
────────────────────────────────────────────────────────────

CORE LOOP: Choose Activity → Earn Money → Buy/Customize → Socialize → Repeat

JOB SYSTEM (10+ jobs with activities):
1. Police Officer: Patrol routes, arrest criminals (touch to cuff), respond to robberies,
   chase system, radio communication, police car spawning.
2. Criminal: Rob stores (hold E for 30s), pick locks, escape police, sell stolen goods,
   hideout system, disguise mechanic.
3. Doctor/Medic: Heal injured players (proximity + hold E), drive ambulance, hospital work
   mini-game (match medicine to symptom), revive knocked players.
4. Firefighter: Respond to fire events (random building fires), use fire hose tool,
   rescue NPCs from burning buildings, fire truck driving.
5. Chef/Baker: Cooking mini-game (combine ingredients in order), serve food to NPCs/players,
   manage restaurant, unlock recipes by level.
6. Teacher: Classroom mini-game, grade papers (click accuracy game), field trips with NPC
   students, earn more with higher student satisfaction.
7. Delivery Driver: Pick up packages, deliver to addresses within time limit, tip bonus
   for fast delivery, vehicle selection.
8. Mechanic: Fix broken vehicles (wrench tool mini-game), tow truck, custom garage.
9. Farmer: Plant seeds, water crops, harvest (each crop has growth timer), sell at market,
   animal care (feed, collect eggs/milk).
10. Lumberjack: Chop trees (hold click), process wood at sawmill, sell lumber, plant new trees.
11. Miner: Mine ore nodes, smelt bars, sell to players/NPCs, cave exploration.
12. Mayor: Special role (elected by vote). Sets tax rate, approves building permits,
    starts server events, gets percentage of all transactions.

HOUSING SYSTEM:
- Starter house: Free small apartment. 4 rooms (bedroom, bathroom, kitchen, living room).
- House tiers: Apartment (free) → House ($5K) → Mansion ($50K) → Penthouse ($200K) → Island ($1M).
- Room customization: Place furniture from inventory anywhere in rooms (grid-snap or free-place).
- Furniture categories: Seating, tables, storage, decorative, lighting, electronics, outdoor.
- Each furniture item has: cost, style tag (modern/rustic/luxury), and room-type recommendation.
- Visit system: Players can visit each other's houses. Rate houses 1-5 stars.
- House parties: Invite friends, play music, special party activities.

VEHICLE SPAWNING:
- Each player has a garage. Vehicles persist in garage between sessions.
- Vehicle tiers: Bicycle (free) → Scooter ($500) → Car ($5K) → Sports Car ($25K) → Helicopter ($100K).
- Vehicle physics: Each vehicle type has unique handling (speed, acceleration, turn radius).
- Fuel system (optional): Vehicles consume fuel, refuel at gas stations (money sink).
- Customization: Color, wheels, spoiler, decals. Cosmetic only, no stat changes.

MONEY EARNING:
- Passive: Paycheck every 5 minutes based on current job ($50-$500 depending on job level).
- Active: Job-specific activities earn bonus money (arrest = $200, delivery = $100, etc.).
- Robbery: Criminals can rob the bank (big payout, big risk), stores (small payout, low risk).
- Trading: Buy low, sell high at different shops. Price fluctuation system.
- Property: Buy businesses that generate passive income.

SOCIAL SPACES:
- Town square: Central hub with fountain, benches, bulletin board, event stage.
- Mall: Multiple shops, food court, cinema (play community videos).
- Park: Playground equipment, sports fields (soccer, basketball mini-games).
- Beach: Swimming, surfing mini-game, sandcastle building.
- Club/Arcade: Dance floor, arcade machines with mini-games, DJ booth.

PHONE GUI:
- Home screen with app icons (6-8 apps).
- Apps: Map (shows player locations), Messages (text other players), Bank (check balance,
  transfer money), Jobs (switch job, see earnings), Camera (screenshot tool),
  Music (play background music), Settings (volume, graphics, notifications).
- Notification badges on apps when new messages arrive or job events happen.
- Phone slides up from bottom of screen with smooth animation.

────────────────────────────────────────────────────────────
6. TOWER DEFENSE
────────────────────────────────────────────────────────────

CORE LOOP: Place Towers → Start Wave → Earn Gold → Upgrade/Buy → Next Wave

TOWER TYPES (8+ with upgrade paths):
1. Basic Tower: Single-target, medium range, fast fire rate. Cheap. Upgrade path:
   Damage → Speed → Range. Max level 5. The bread and butter.
2. Sniper Tower: Single-target, very long range, slow fire rate, high damage.
   Upgrade path: Damage → Crit chance → Armor pierce.
3. Splash Tower: AoE damage in radius. Short range. Great for groups.
   Upgrade path: Radius → Damage → Burn (DoT effect).
4. Freeze Tower: Slows enemies in radius. No damage. Support tower.
   Upgrade path: Slow % → Radius → Freeze (stun for 1s every 5s).
5. Poison Tower: Applies damage-over-time. Medium range.
   Upgrade path: DoT damage → Duration → Spread (infects nearby enemies).
6. Lightning Tower: Chain lightning hitting 3-5 enemies. Medium range.
   Upgrade path: Chain count → Damage → Stun chance.
7. Mortar Tower: Long range, AoE, slow fire rate, massive damage.
   Upgrade path: Radius → Damage → Cluster (splits into sub-projectiles).
8. Support Tower: Buffs nearby towers. No damage. Aura effect.
   Upgrade path: Buff range → Buff power → Double buff (2 stats at once).
9. Minigun Tower: Very fast fire rate, low per-shot damage. Short range.
   Upgrade path: Speed → Damage → Overheat (burst fire mode).
10. Laser Tower: Continuous beam. Damage ramps up the longer it stays on a target.
    Upgrade path: Ramp speed → Max damage → Multi-beam.

ENEMY WAVE SCALING:
- Wave 1-5: Basic enemies only. HP=100, Speed=10. Teach placement.
- Wave 6-10: Introduce fast enemies (Speed=18, HP=80). Test coverage.
- Wave 11-15: Introduce armored enemies (HP=500, Speed=6, reduces non-pierce damage by 50%).
- Wave 16-20: Introduce flying enemies (ignore ground-path, towers need anti-air).
- Wave 21-25: Introduce boss enemies (HP=5000, Speed=8, special abilities).
- Wave 26-30: All enemy types mixed. Increasing quantity.
- Wave 31+: Endless mode. Each wave = previous * 1.15 HP, +2 enemies per wave.
- Boss waves (every 5th wave): Single powerful enemy with:
  - HP = 10x normal enemy of that level
  - Special ability (shield every 5s, spawn minions, heal, speed burst)
  - Drops bonus gold and upgrade materials.

Enemy HP formula: baseHP * (1.12 ^ waveNumber) * typeMultiplier
Enemy count formula: baseCount + floor(waveNumber * 0.8)
Gold per kill: ceil(enemyHP / 50) + waveBonus

PATH DESIGN:
- Single path (easy maps): One winding road. Players optimize tower placement along it.
- Forked path (medium): Path splits into 2 routes. Players must cover both.
- Maze path (hard): Players BUILD the path with walls, creating their own maze.
- Multi-entrance (expert): Enemies enter from 2-3 different points.
- Path should have: Visible road texture, directional arrows, entrance/exit markers.
- Chokepoints: Design 2-3 natural chokepoints where the path narrows for strategic placement.

ECONOMY BALANCE:
- Starting gold: 200-300 (enough for 2-3 basic towers).
- Basic tower cost: 100. Each upgrade: 75/150/300/600.
- Wave completion bonus: 50 + (waveNumber * 10).
- Interest system: Earn 5% interest on unspent gold at wave end (encourages saving).
- Sell towers: Get 60% of total investment back (prevents permanent mistakes).

TOWER PLACEMENT GRID:
- Grid cells: 4x4 studs each. Tower occupies 1 cell.
- Cannot place on path or enemy spawn/exit points.
- Visual indicator: Green cell = placeable, Red = blocked, Blue = tower range preview.
- Range visualization: Circle around tower showing attack range when selected.

TD MAP THEMES:
- Castle Defense: Medieval towers, orc enemies, stone paths.
- Space Station: Laser towers, alien enemies, metal corridors.
- Jungle: Vine towers, insect enemies, dirt paths.
- Winter: Ice towers, yeti enemies, snow paths.

────────────────────────────────────────────────────────────
7. BATTLE ROYALE
────────────────────────────────────────────────────────────

CORE LOOP: Drop → Loot → Fight → Survive → Shrink → Win

SHRINKING ZONE MECHANICS:
- Total match duration target: 12-15 minutes. Zone shrinks in phases:
  - Phase 0 (0:00-2:00): Full map. No zone. Looting phase.
  - Phase 1 (2:00-4:00): Circle revealed, 60% of map. Zone closes over 45s.
  - Phase 2 (4:00-6:00): 35% of map. Zone closes over 30s.
  - Phase 3 (6:00-8:00): 15% of map. Zone closes over 25s.
  - Phase 4 (8:00-10:00): 5% of map. Zone closes over 20s.
  - Phase 5 (10:00+): Tiny circle. Forces final fight. Zone closes to nothing over 60s.
- Zone damage: Phase 1=1 HP/s, Phase 2=3 HP/s, Phase 3=7 HP/s, Phase 4=15 HP/s, Phase 5=30 HP/s.
- Zone center: Random but weighted toward map center. Never in water or off-map.
- Visual: Translucent blue/purple wall with particle effect. Visible from distance.

LOOT SPAWNING:
- Loot density: High in named locations (buildings), sparse in open areas.
- Loot tables per location type:
  - Houses: Pistols, shotguns, light ammo, bandages.
  - Military buildings: Rifles, heavy ammo, shields, armor.
  - Supply drops: Best weapons, full shields, special items. One per phase.
  - Secret rooms: Legendary loot behind puzzle/hidden door.
- Floor loot: Items sitting on the ground with a glow effect. Auto-pickup when walked over.
- Chest loot: Glowing chests that open on interact (hold E). Better odds than floor loot.
- Each item has a rarity glow: White → Green → Blue → Purple → Gold.

WEAPON TIERS (per weapon type, 5 tiers each):
- Pistol: 15/18/21/25/30 damage. Fast fire, low range.
- Shotgun: 40/50/60/75/90 damage. Close range, slow fire.
- Assault Rifle: 20/24/28/33/38 damage. Medium range, auto fire.
- Sniper: 70/85/100/120/150 damage. Long range, bolt action.
- SMG: 12/15/18/22/26 damage. Very fast fire, medium range.
- Rocket Launcher: 80/95/110/130/150 damage. AoE, very slow fire. Rare+ only.
- Each weapon has: damage, fire rate, reload time, magazine size, bloom/accuracy.

BUILDING MECHANICS (optional, Fortnite-style):
- Materials: Wood (fast build, low HP), Stone (medium, medium), Metal (slow, high HP).
- Build pieces: Wall, Ramp, Floor, Roof. Each costs 10 materials.
- Gathering: Harvest materials from trees/rocks/cars with pickaxe.
- Material carry limits: 500 Wood, 300 Stone, 200 Metal.

MATCH FLOW:
1. Lobby (0-60s): Players join. Free-for-all practice area with infinite respawn.
2. Launch (60-75s): Countdown, dramatic camera, players teleport to "bus" (moves across map).
3. Drop (75-90s): Players choose when to jump. Skydive with glider auto-deploy at low altitude.
4. Game (90s-12min): Loot, fight, survive. Zone closes on schedule.
5. Endgame: Last player/team standing wins. Victory screen with stats, XP earned.

BR UNIQUE TWISTS:
- Abilities: Each player picks 1 of 4 abilities before drop (dash, wall, heal aura, scan).
- Contracts: Optional side objectives during match (eliminate specific player, visit 3 locations)
  for bonus rewards.
- Respawn van: Teammates can revive eliminated allies at specific locations.
- Hot zones: Random areas with 2x loot but zone closes on them first.

────────────────────────────────────────────────────────────
8. SURVIVAL
────────────────────────────────────────────────────────────

CORE LOOP: Gather → Craft → Build → Survive Night → Explore → Repeat

HUNGER/THIRST/HEALTH:
- Hunger: Starts at 100. Decreases 1 per 15 seconds. At 0, lose 2 HP/s. Food restores 10-40.
- Thirst: Starts at 100. Decreases 1 per 10 seconds. At 0, lose 3 HP/s. Drinks restore 15-50.
- Health: 100 max. Regenerates 1 HP/5s when hunger AND thirst are above 50.
  Damaged by enemies, falls, environmental hazards.
- Temperature (optional): Cold biomes drain health. Hot biomes drain thirst faster.
  Clothing and shelter modify temperature resistance.
- Status display: Vertical bars on right side of screen. Color changes: Green→Yellow→Red.

CRAFTING SYSTEM:
- Material tiers: T1 (Wood, Stone, Fiber) → T2 (Iron, Leather, Cloth) → T3 (Steel, Crystal, Silk).
- Basic recipes: Wooden Pickaxe (5 wood + 3 stone), Campfire (10 wood + 5 stone),
  Wooden Shelter (30 wood + 10 fiber), Stone Axe (3 wood + 5 stone).
- Intermediate: Iron Sword (5 iron + 2 wood), Leather Armor (8 leather + 3 fiber),
  Cooking Pot (10 iron + 5 stone), Water Filter (8 stone + 5 fiber + 3 iron).
- Advanced: Steel Pickaxe (10 steel + 3 wood), Crystal Staff (5 crystal + 3 steel),
  Fortified Shelter (20 steel + 10 stone + 15 wood).
- Crafting UI: Grid of known recipes. Gray out recipes with insufficient materials.
  Show material counts. Craft button with progress bar (1-5 seconds depending on item).
- Discovery: Some recipes unlock by finding recipe scrolls, or auto-learn when picking up
  new materials for the first time.

DAY/NIGHT DANGER SCALING:
- Day (6:00-18:00, 6 real minutes): Safe. Passive animals only. Good visibility.
  Gather resources, explore, build.
- Dusk (18:00-20:00, 1 minute): Warning period. Sky turns orange. Enemies begin spawning
  at map edges. Get to shelter.
- Night (20:00-6:00, 5 minutes): Dangerous. Aggressive enemies spawn near players.
  Enemies scale with night count: Night 1=easy, Night 5=hard, Night 10=deadly.
  Darkness limits visibility to 20 studs without a torch.
  Campfires and torches create safe zones (enemies avoid light sources within 15 studs).
- Dawn (6:00-7:00, 30 seconds): Night enemies despawn. Resources respawn. New day.

SHELTER BUILDING:
- Foundation: Flat platform, snaps to grid (4x4 stud cells). Multiple shapes.
- Walls: 4-stud segments with doorframe option. Material determines HP.
- Roof: Flat or angled. Required to count as "shelter" (prevents night damage bonus).
- Furniture: Crafting bench (unlock advanced recipes), bed (set respawn point, skip night),
  storage chest (persistent inventory), cooking station.
- Upgrade: Wood walls → Stone walls → Metal walls. Each tier has more HP.
- Raid protection: Structures are immune while owner is offline (prevents griefing).

RESOURCE NODES:
- Trees: 3-5 hits = 5-10 wood. Respawn in 2 minutes. Visual: stump → sapling → full tree.
- Rocks: 4-6 hits = 3-8 stone. Respawn in 3 minutes. Sometimes drop iron ore.
- Bushes: 1 hit = 1-3 fiber/berries. Respawn in 1 minute.
- Water sources: Rivers and ponds. Interact to fill water container.
- Special nodes: Crystal formations (T3), Ancient ruins (recipe scrolls), Animal dens (leather).
- Mining: Underground caves with ore veins. Better materials but dangerous (enemies + fall risk).

ENEMY SPAWNING AT NIGHT:
- Wave 1 (Night start): 3-5 basic enemies per player. HP=50, Damage=10.
- Wave 2 (Midnight): 5-8 enemies including 1 elite (HP=200, Damage=25).
- Wave 3 (Late night): 8-12 enemies including 2 elites and 1 mini-boss.
- Blood Moon (every 7th night): Triple enemy count. Special boss spawns. Rare loot drops.
- Enemies target: Players first, then structures. Attracted by light from far away,
  but won't enter light zones. Creates tension: light draws them close but keeps them away.

────────────────────────────────────────────────────────────
9. HORROR
────────────────────────────────────────────────────────────

CORE LOOP: Explore → Get Scared → Solve → Escape (or Don't)

SCARE TIMING PATTERNS:
- Rule of 3: Set up a pattern (safe room, safe room, safe room), then BREAK it (jumpscare).
- Build-up: 30-60 seconds of quiet tension → brief scare → 15 seconds calm → bigger scare.
- Misdirection: Sound from the left, threat from the right. Look up while danger is behind.
- False scares: Door slams from wind, cat jumps out, painting falls. 60% of scares should be
  false to maintain tension without numbing players to real threats.
- Escalation: Act 1 (exploration, atmosphere), Act 2 (first encounter, chases begin),
  Act 3 (constant danger, climax). Never start at maximum fear — build to it.
- Cooldown: After a major scare, give players 1-2 minutes of QUIET to process and rebuild tension.
  Horror without relief becomes annoying, not scary.

MONSTER AI (Patrol → Chase → Lost):
- PATROL state: Monster follows a predetermined path through the map. Speed = 50% of player.
  Changes direction at patrol nodes. Makes ambient sounds (footsteps, growling, scraping).
- ALERT state: Triggered when player is within 30 studs AND line-of-sight OR makes noise.
  Monster stops, turns toward player, 2-second "stare" (build tension), then transitions to CHASE.
- CHASE state: Monster moves at 120% of player speed (catchable but player can use shortcuts).
  Pursues player's last known position. Breaks doors (after 3-second animation).
  Player can hide in closets/under beds (crouch + don't move = monster walks past after 5s search).
- LOST state: After 10 seconds without seeing player, monster enters "searching" behavior.
  Checks nearby hiding spots (walks to closets, looks under beds). After 15 seconds of searching,
  returns to patrol at nearest patrol node.
- Enrage: If monster loses player 3 times in a row, it moves faster (140% player speed)
  and checks hiding spots for 10 seconds instead of 5. Resets after catching player once.

ENVIRONMENTAL STORYTELLING:
- Notes/journals scattered through the map (10-15). Each reveals part of the backstory.
  Number them or date them so players can piece the timeline together.
- Environmental clues: Blood trails lead somewhere. Scratches on walls show monster path.
  Broken furniture tells a struggle story. Photos show what happened to previous victims.
- Audio logs: Recorded messages that play when interacted with. Voice acting adds immersion.
  Keep each log under 20 seconds.
- Room design tells stories: A child's room with toys and drawings → sympathy. A lab with
  failed experiments → explanation. A ritual circle → supernatural angle.
- Progressive reveals: Early rooms are normal. Middle rooms show subtle wrongness
  (furniture slightly moved, one extra chair, mirror shows different reflection).
  Late rooms are overtly disturbing.

SOUND DESIGN FOR TENSION:
- Ambient: Constant low drone (40-60 Hz). Occasional creaks, distant thuds, wind.
  The silence between sounds is scarier than the sounds themselves.
- Proximity: Monster footsteps increase in volume as distance decreases.
  Heartbeat sound when monster is within 20 studs. Breathing when within 10.
- Stingers: Sharp, sudden sounds for jumpscares. Violin screech, bass drop, glass shatter.
  Use SPARINGLY — overuse numbs players.
- Music: Minimal. A single dissonant note that slowly rises in pitch builds more tension
  than a full orchestral score. Cut music to silence right before a scare.
- Player sounds: Player footsteps are LOUD on wood/metal, quiet on carpet/grass.
  This creates gameplay — choose your path based on floor material.
- CRITICAL: Sound falloff. Use RollOffMode = InverseTapered with MaxDistance = 50-80 studs.
  Players should hear the monster from one room away, not the entire map.

DARKNESS MECHANICS:
- Flashlight: Limited battery (120 seconds). Drains while on. Recharges at battery stations.
  Creates a cone of visibility (45-degree angle, 30 stud range). Monster avoids direct light
  for 3 seconds (gives player a tool to survive).
- Ambient light: Moonlight through windows, candles, emergency lights. Just enough to
  see outlines but not details.
- Complete darkness: Some rooms have NO light. Players must rely on sound or use flashlight.
  These rooms should have the highest scare potential.
- Light flicker: Random 0.1-0.3 second blackouts. Increases frequency near monster.
  During flicker, monster can appear/disappear (teleport during blackout).

HORROR GAME STRUCTURE:
- Runtime: 15-30 minutes per playthrough. Horror wears off quickly — don't overstay.
- Chapters: 3 acts. Act 1: Explore (5 min). Act 2: Survive (10-15 min). Act 3: Escape (5 min).
- Multiple endings: Based on items collected, choices made, time taken.
- Replayability: Randomize item locations, monster patrol routes, and scare triggers.

────────────────────────────────────────────────────────────
10. RACING
────────────────────────────────────────────────────────────

CORE LOOP: Race → Earn → Upgrade/Buy → Race Faster

CHECKPOINT SYSTEM:
- Invisible trigger volumes at each checkpoint. When player passes through, log timestamp.
- Display: Current checkpoint / Total checkpoints on HUD.
- Miss detection: If player skips a checkpoint, display warning and don't count the lap.
- Anti-cheat: Store expected checkpoint sequence. Must be in order. Max speed validation.
- Visual: Holographic arch with number. Briefly flashes when passed. Color: next=yellow, passed=green.

LAP COUNTING:
- Start/finish line: Distinct visual (checkered pattern, overhead banner).
- Lap counter on HUD: "Lap 2/3" with best lap time.
- Split times: Show difference to best lap at each checkpoint (+0.5s red, -0.3s green).
- Final lap: Change music, add visual effects (camera shake, motion blur increase).
- Photo finish: If two players cross within 0.1s, show slow-motion replay camera angle.

VEHICLE PHYSICS TUNING:
- Speed: Top speed in studs/second. Kart=80, Sports=120, Super=160, Formula=200.
- Acceleration: Time from 0 to top speed. Kart=3s, Sports=2.5s, Super=2s, Formula=1.5s.
- Handling: Turn rate in degrees/second. Higher = more responsive. Kart=180, Sports=150, Super=120.
- Braking: Deceleration rate. Higher = stops faster. All should be 2-3x acceleration.
- Weight: Affects collision physics and drift behavior. Heavier = more stable, slower acceleration.
- Each vehicle is a trade-off. No single "best" vehicle — different tracks favor different stats.

DRIFT MECHANICS:
- Initiate: Hold brake while turning. Vehicle slides sideways with tire smoke particles.
- Boost: Longer drift = bigger boost when released. Visual indicator (spark color change):
  - 0-1s drift: No boost
  - 1-2s drift: Small boost (1.2x speed for 0.5s), blue sparks
  - 2-3s drift: Medium boost (1.4x speed for 0.75s), orange sparks
  - 3s+ drift: Large boost (1.6x speed for 1s), purple sparks
- Combo: Chain drifts on S-curves for multiplied boost duration.
- Sound: Tire screech that increases in pitch with drift duration.

BOOST PADS:
- Placed on straightaways. 1.5x speed for 1 second when driven over.
- Visual: Glowing arrows on the ground, chevron pattern.
- Shortcut boosts: Hidden off the main track. Risk-reward — take the narrow shortcut for a boost.
- Mushroom-style: Consumable boosts (pick up on track, use anytime). 3-second boost.

TRACK DESIGN PRINCIPLES:
- Track length: 30-60 seconds per lap. 3 laps total = 1.5-3 minute race.
- Flow: Alternate between wide sweeping turns and tight hairpins. Mix fast straights with technical sections.
- Width: 20-30 studs for main track. Narrower for shortcuts (8-12 studs).
- Elevation: Use hills and drops. Going downhill should feel fast. Uphill slows slightly.
- Obstacles: Moving barriers, closing gates (timing challenge), oil slicks (reduce grip).
- Shortcuts: 1-2 per track. Harder to navigate but save 2-3 seconds. Risk: miss it = slower.
- Environment variety: Half the track in one biome, half in another (forest to cave, city to beach).

RACING PROGRESSION:
- Cups: Group 4 tracks into cups. Complete all races in a cup to earn stars.
- Stars unlock: New vehicles, new tracks, cosmetic items (paint, wheels, decals).
- Time trials: Ghost of your best time. Beat it to earn bonus rewards.
- Online ranking: ELO-based matchmaking. Rank badges (Bronze→Silver→Gold→Diamond→Champion).

────────────────────────────────────────────────────────────
11. FIGHTING
────────────────────────────────────────────────────────────

CORE LOOP: Fight → Learn Combos → Win → Unlock → Fight Tougher Opponents

HITBOX DESIGN:
- Attack hitboxes: Invisible Parts that exist for the duration of the active frames.
  Created on attack, destroyed after active frames end. Use GetTouchingParts() or Touched event.
- Hurtbox: Player's character model. Always active. Head hurtbox takes 1.5x damage.
- Hitbox sizes by attack type: Jab=small (2x2x2), Heavy=medium (3x3x3), Special=large (4x4x4).
- Hitbox positioning: Spawned relative to the attacker's HumanoidRootPart + offset.
  Punch = 3 studs forward. Kick = 3 studs forward + 1 stud down. Uppercut = 2 up + 2 forward.
- NO double-hit: Each hitbox should have a "hit list" table. Once an enemy is hit,
  they can't be hit again by the same attack instance.

FRAME DATA (Startup/Active/Recovery):
- Understanding: Startup = vulnerable, Active = dealing damage, Recovery = vulnerable again.
- Jab: 5 startup / 3 active / 8 recovery (16 total frames). Fast, safe, low damage.
- Heavy punch: 12 startup / 5 active / 15 recovery (32 frames). Slow, punishable, high damage.
- Special move: 8 startup / 8 active / 20 recovery (36 frames). Strong but very punishable.
- Block: 0 startup / infinite active / 3 recovery. Reduces damage by 80%. Can be grabbed.
- Dodge: 3 startup / 10 active (i-frames) / 5 recovery. Full invincibility during active.
- At 30 FPS in Roblox, 1 frame ≈ 0.033s. So a jab is about 0.17s startup, 0.1s active, 0.27s recovery.

COMBO INPUTS:
- Light → Light → Light: Basic 3-hit combo. 10+10+15 damage.
- Light → Light → Heavy: Combo finisher. 10+10+30 damage. Knocks back.
- Light → Special: Quick special. 10+25 damage.
- Heavy → Heavy: Slow but devastating. 20+35 damage. Long recovery.
- Dodge → Light: Counter attack. 18 damage + stun (0.5s).
- Combo window: 0.5 seconds between inputs. Miss the window = combo drops.
- Combo counter: Display "2x HIT! 3x HIT!" with increasing font size and camera shake.
- Damage scaling: Each hit in a combo does 90% of the previous hit's damage (prevents infinites).

SPECIAL MOVES:
- Each character/class has 4 specials. Cooldown-based (8-20 seconds).
- Special 1: Projectile (fireball, energy blast). Medium damage, ranged.
- Special 2: Movement (teleport behind enemy, dash forward). Utility + position.
- Special 3: AoE (ground slam, tornado). Hits all nearby. 15 stud radius.
- Special 4 (Ultimate): Charges over 60 seconds of combat. Massive damage, cinematic camera.
- Specials can be blocked but not dodged. Grabs beat blocks. Dodges beat strikes. Strikes beat grabs.
  Triangle balance: Strike > Grab > Block > Strike.

HEALTH BARS:
- Display above characters (BillboardGui). Green bar depleting to red.
- Player HP: 100. Show exact number. Regen 1 HP/s when not hit for 5 seconds.
- Shield/armor: Optional secondary bar (white/blue) that absorbs damage first.
- Low HP effects: Red vignette on screen, heartbeat sound, screen shake on hit increases.
- KO animation: Ragdoll + slow motion for 1 second. Replay of final hit from cinematic angle.

ROUND SYSTEM:
- Best of 3 rounds (or 5 for ranked). 60 seconds per round.
- Between rounds: 5-second pause with round result and HP reset.
- Draw: If time runs out, player with more HP wins. If equal, sudden death (1 HP each).
- Victory screen: Winner poses, stats displayed (damage dealt, combos, longest combo, perfect rounds).
- Ranked mode: ELO system. Win = +15 to +30 points. Loss = -10 to -20.

────────────────────────────────────────────────────────────
12. PUZZLE
────────────────────────────────────────────────────────────

CORE LOOP: Observe → Think → Attempt → Solve → Reward → Harder Puzzle

PUZZLE TYPE CATALOG:
Logic puzzles:
- Pattern completion: Show 3 symbols, player picks the 4th from 4 options.
- Sudoku-lite: 4x4 grid with colored blocks, no repeats in row/column.
- Boolean gates: Wire AND/OR/NOT gates to light up the output.
- Sequence decode: Given a cipher, decode a message to get the door code.
- Deduction: 3 NPCs, one lies, find the truth-teller.

Spatial puzzles:
- Block pushing: Push blocks onto pressure plates (Sokoban-style).
- Mirror/beam: Redirect a laser beam using rotatable mirrors to hit a sensor.
- Rotation: Rotate pipe pieces to connect start to end.
- Tangram: Fit shapes into a frame perfectly.
- Bridge building: Place planks across gaps to create a path.

Sequence puzzles:
- Simon says: Lights flash in order, repeat the sequence.
- Musical: Play notes in the correct order (heard earlier in the level).
- Color chain: Step on colored tiles in a specific order shown briefly.
- Dance pad: Arrows appear on screen, step on matching floor pads in time.

Timing puzzles:
- Moving platform alignment: Wait for platforms to align, then cross.
- Door timing: Two buttons far apart, both must be pressed within 3 seconds.
- Conveyor maze: Navigate items through conveyors with switches to change direction.
- Rhythm gate: Gate opens/closes to a rhythm. Cross on the open beats.

Physics puzzles:
- Balance scale: Place items on scales to match target weight.
- Water flow: Open/close valves to fill a container to exact level.
- Catapult: Adjust angle and power to launch a ball into a target.
- Domino chain: Place dominoes to connect the trigger to the target.
- Rube Goldberg: Build a chain reaction using available parts.

HINT SYSTEM:
- Hint 1 (free, after 60s): Vague hint. "Look at the pattern on the wall."
- Hint 2 (after 120s): Medium hint. "The sequence is related to the colors."
- Hint 3 (after 180s): Direct hint. "The order is Red, Blue, Green, Yellow."
- Skip (after 240s): Option to skip with reduced reward (50% XP/coins).
- Hints deducted from a "hint budget" (5 hints per session, regenerates daily).

DIFFICULTY CURVE:
- Level 1-5: Single mechanic, obvious solution, generous timing.
- Level 6-10: Single mechanic with a twist (extra step, time limit).
- Level 11-15: Two mechanics combined (push block THEN redirect beam).
- Level 16-20: Two mechanics + time pressure or limited moves.
- Level 21-25: Three mechanics, non-obvious solution, expert timing.
- Level 26+: Community-created puzzles. Player-rated difficulty.

REWARD STRUCTURE:
- Completion: XP and coins based on puzzle difficulty.
- Speed bonus: Complete under par time = 2x rewards.
- No-hint bonus: Complete without hints = 1.5x rewards.
- Perfect bonus: Complete on first attempt = 3x rewards.
- Stars: 1 star = complete. 2 stars = under par. 3 stars = no hints + under par.

────────────────────────────────────────────────────────────
13. SANDBOX
────────────────────────────────────────────────────────────

CORE LOOP: Build → Share → Visit → Rate → Build More

BUILDING TOOL SYSTEM:
- Place tool: Select block type and click to place. Grid-snap to 1-stud increments.
  Hold Shift for free placement. Preview ghost block at cursor position.
- Destroy tool: Click block to remove. Hold to rapid-destroy. Undo support (last 50 actions).
- Paint tool: Click block to change color. Color picker with 64+ colors.
  Material picker (Concrete, Wood, Brick, Metal, Glass, Neon, etc.).
- Scale tool: Resize selected block. Drag handles on edges. Min 0.5 stud, max 50 studs.
- Rotate tool: Rotate selected block. Snap to 15-degree increments. Free-rotate with Shift.
- Clone tool: Duplicate selected block or selection group. Place the clone.
- Group tool: Select multiple blocks, group into a Model. Move/rotate as one unit.
- Terrain tool: Paint terrain in the build area. Raise, lower, smooth, paint material.

MATERIAL PALETTE:
- Categorized: Natural (Grass, Sand, Snow, Mud), Stone (Concrete, Brick, Cobblestone, Granite),
  Wood (WoodPlanks, Wood, Bamboo), Metal (CorrodedMetal, DiamondPlate, Metal),
  Modern (Glass, Neon, SmoothPlastic [only for reflective surfaces], ForceField),
  Special (Ice, Glacier, Marble, Slate, Basalt).
- Favorite materials: Pin up to 10 favorites for quick access.
- Recently used: Last 5 materials shown at top.

SAVE/LOAD:
- Auto-save every 2 minutes to DataStore. Serialize all parts: position, size, color, material, orientation.
- Manual save: Button in build menu. Confirmation dialog.
- Save slots: 3-5 slots per player. Premium players get 10.
- Load: Select slot, confirm (warns about overwriting current build).
- Data format: Compressed JSON. Each part = {pos:[x,y,z], size:[x,y,z], color:[r,g,b], mat:string, rot:[rx,ry,rz]}.
- Part limit per player: Free=500 parts, Premium=2000 parts.

SHARE BUILDS:
- Publish build: Creates a snapshot. Gets a share code (6-character alphanumeric).
- Featured builds: Admin-curated gallery on the main menu.
- Player profile: Shows all published builds with thumbnails.
- Like system: Players can like builds. Most-liked shown in "Popular" tab.

VISIT OTHERS:
- Teleport to any published build. Read-only mode (can't modify).
- Walk around, fly camera, take screenshots.
- Comment system: Leave text comments attached to specific locations in the build.
- Copy to plot: Option to clone someone's published build to your own plot (if they enable it).

PHYSICS TOGGLE:
- Build mode: All parts anchored. No physics. Focused on creation.
- Play mode: Unanchor specified parts. Enable physics. Test your creation.
  Great for marble runs, domino chains, Rube Goldberg machines, vehicles.
- Hybrid: Some parts anchored (structure), some unanchored (moving elements).

────────────────────────────────────────────────────────────
14. CLICKER / IDLE
────────────────────────────────────────────────────────────

CORE LOOP: Click → Earn → Buy Upgrades → Click Less → Prestige → Repeat

CLICK VALUE SCALING:
- Base click: 1 coin. First upgrade (10 coins): 2 per click. Second (50): 5.
- Formula: clickValue = baseValue * (1 + clickUpgrades * 0.5) * prestigeMultiplier * petBonus
- Visual feedback per click: Floating number (+5), particles, subtle screen pulse.
- Click sound: Satisfying pop/ding that varies slightly each time.
- Critical clicks: 5% chance for 5x value. Flash effect + larger number + special sound.
- Combo clicks: Click 10 times within 3 seconds = 2x multiplier for 5 seconds.

AUTO-CLICKERS AS UPGRADES:
- Tier 1 "Cursor" (100 coins): 1 coin/second. Visual: floating cursor clicking.
- Tier 2 "Grandma" (500 coins): 5 coins/second. Visual: NPC clicking.
- Tier 3 "Factory" (5,000 coins): 25 coins/second. Visual: machine with conveyor.
- Tier 4 "Laboratory" (50,000 coins): 150 coins/second. Visual: science lab.
- Tier 5 "Portal" (500,000 coins): 1,000 coins/second. Visual: interdimensional rift.
- Tier 6 "Time Machine" (5,000,000 coins): 10,000 coins/second. Visual: temporal anomaly.
- Tier 7 "Universe" (50,000,000 coins): 100,000 coins/second. Visual: cosmic entity.
- Each tier can be purchased multiple times. Each additional copy is 1.15x the previous cost.
- Upgrades for each tier: 2x production (costs 10x the tier base price).

OFFLINE PROGRESS:
- While offline, auto-clickers continue at 50% efficiency.
- On return: "Welcome back! You earned X coins while away!" with satisfying animation.
- Max offline time: 8 hours (prevents returning after weeks with trillions).
- Premium offline: 100% efficiency + 12 hour max. Monetization opportunity.

PRESTIGE LOOP:
- Prestige at: 1 million coins earned (lifetime, not current).
- Prestige currency: "Diamonds" or thematic equivalent.
- Prestige formula: diamonds = floor(sqrt(lifetimeCoins / 1000000))
- Diamond upgrades: +10% all production per diamond invested. Multiplicative with each other.
- First prestige: ~30 minutes of play. Second: ~25 minutes. Gets faster each time.
- After 10 prestiges: Second prestige layer ("Ascend"). Resets diamonds. Grants "stars."
  Stars = +50% diamond earning rate each.

ACHIEVEMENT MILESTONES:
- Click 100 times: "Beginner Clicker" + 50 coins.
- Earn 1,000 total: "Pocket Change" + 100 coins.
- Buy first auto-clicker: "Automation Begins" + 200 coins.
- Prestige once: "Born Again" + 1 diamond.
- Click 10,000 times: "Dedicated" + title.
- Earn 1 billion: "Billionaire" + special cursor.
- Each achievement pops with fanfare, slides in from right, shows reward.

NUMBER FORMATTING (critical for clickers):
- Under 1,000: Show exact (e.g., "847")
- 1,000-999,999: Use K (e.g., "45.2K")
- 1M-999M: Use M (e.g., "123.4M")
- 1B-999B: Use B (e.g., "7.89B")
- 1T+: Use T (e.g., "1.23T")
- Always show 1-2 decimal places for abbreviated numbers.

────────────────────────────────────────────────────────────
15. MURDER MYSTERY
────────────────────────────────────────────────────────────

CORE LOOP: Assign Roles → Investigate / Kill → Vote / Escape → Win

ROLE ASSIGNMENT:
- Murderer (1 player): Has a knife. Can kill with one hit. Must eliminate all innocents.
  Knife is only visible when equipped. 5-second cooldown between kills.
- Sheriff (1 player): Has a gun. Can shoot the murderer (instant kill). If sheriff kills
  an innocent, sheriff also dies. 1 bullet, 10-second reload.
- Innocents (everyone else): No weapons. Must survive. Can pick up the sheriff's gun if
  sheriff dies. Can find clues and call emergency meetings.
- Role reveal: Dramatic 3-second reveal at round start. Screen flashes role color.
  Murderer sees red, Sheriff sees blue, Innocents see green.

WEAPON MECHANICS:
- Knife: Melee range (5 studs). Click to swing. 5-second cooldown.
  Murderer can throw the knife (20 stud range, 8-second cooldown). Knife returns after 2s.
  Kill animation: Quick slash, victim ragdolls. No gore — keep it Roblox-appropriate.
- Gun: Click to shoot. Hitscan (instant). 1 bullet, 10-second reload.
  If shot hits murderer: murderer dies, round over. If shot hits innocent: shooter dies.
  Dropped gun: Glows on the floor. Any innocent can pick it up.
- Balance: Murderer is slightly faster than others (1.1x walkspeed). Knife throw gives range.
  Sheriff has ranged advantage but limited ammo and penalty for mistakes.

INVESTIGATION TOOLS:
- Footprints: Murderer leaves faint footprints for 5 seconds after a kill. Visible to all.
- Body reports: When a body is found, nearby players get a notification with location.
  Players can inspect body: see time of death, direction of last damage.
- Clue items: 3-5 clues spawn randomly. Picking one up reveals partial information:
  "The murderer has [hat type]", "The murderer was last seen near [location]."
- Emergency meeting: Any player can call once per round. All players teleport to meeting room.
  15-second discussion, then vote.

VOTING SYSTEM:
- Meeting called: All players see voting UI with player portraits.
- Discussion timer: 30 seconds. Players can text chat (or proximity voice).
- Vote timer: 15 seconds. Click on a player portrait to vote. Can vote "Skip."
- Majority rules: Player with most votes is eliminated. If tie or majority skip, no elimination.
- Eliminated player's role is revealed to all.
- Voting strategy: Murderer must blend in and deflect suspicion. Innocents must observe behavior.

ROUND TIMER:
- Round length: 5 minutes. If murderer doesn't kill everyone, innocents win.
- Overtime: At 1 minute left, arena shrinks (doors lock, lights flicker). Forces confrontation.
- Between rounds: 15 seconds in lobby. Show previous round stats (who was murderer, etc.).
- Match: Best of 5 rounds. Role rotation ensures variety.

INNOCENTS WIN CONDITIONS:
- Survive until timer runs out.
- Sheriff kills the murderer.
- Correctly vote out the murderer.
- All pick up gun and shoot the murderer after sheriff dies.

MAP DESIGN FOR MURDER MYSTERY:
- 8-12 rooms with connecting hallways. Multiple paths between any two rooms.
- Hiding spots: Closets, behind bookshelves, under tables. 3-5 per room.
- Vents/secret passages: 2-3 shortcuts only the murderer can use (adds balance + paranoia).
- Lighting: Dim but visible. Some rooms have flickering lights. One room is very dark.
- Sound design: Footsteps echo. Knife makes a sound when drawn. Doors creak.
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 2: SYSTEM INTERACTION PATTERNS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const SYSTEM_INTERACTIONS = `
=== SYSTEM INTERACTION PATTERNS ===

Games are NOT a collection of independent systems. They are a WEB of interconnected
systems where changes in one ripple through all others. Here's how to wire them together.

────────────────────────────────────────────────────────────
ECONOMY <-> COMBAT
────────────────────────────────────────────────────────────
- Kill rewards: Every enemy killed grants coins. Formula: coins = ceil(enemyHP / 10) * areaMultiplier.
  Boss kills grant 10-50x normal enemy reward plus guaranteed item drop.
- Death penalties: On player death, lose 5-10% of carried gold (not banked gold). Gold drops
  as a pickup that the killer can collect (PvP) or that despawns after 30s (PvE).
- Bounty system: Players with high kill streaks get bounties. Killing a bounty target pays bonus.
- Combat upgrades cost money: Weapon upgrades, armor, potions, special abilities all drain gold.
  This creates the earn→spend→earn cycle.
- Mercenary NPCs: Pay gold to hire AI companions for combat. 3 tiers of mercenary (weak/medium/strong).
- Repair costs: Equipment durability decreases with use. Repair at blacksmith costs gold.
  This is a crucial money SINK that prevents inflation.

────────────────────────────────────────────────────────────
ECONOMY <-> HOUSING
────────────────────────────────────────────────────────────
- House purchase: Major economic milestone. First house = first big save goal.
  House prices should be 2-5 hours of gameplay to earn.
- Furniture costs: Each item 1-10% of house value. Creates ongoing spend after purchase.
- Rent system (optional): Weekly rent based on house tier. Forces continued engagement.
  Miss rent = house downgraded, not deleted (never punish by removing content).
- Upgrades: Kitchen upgrade = cooking ability. Forge upgrade = crafting ability. Garden = farming.
  Houses aren't just cosmetic — they unlock gameplay systems.
- Property investment: Houses in popular areas appreciate in value. Resale for profit.
- Utility bills: Power, water — small recurring costs that act as money sinks.
  Can be turned off but disables house features (lights, cooking, etc.).

────────────────────────────────────────────────────────────
PETS <-> COMBAT
────────────────────────────────────────────────────────────
- Pet damage bonus: Each equipped pet adds flat or percentage damage.
  Common pet: +5% damage. Legendary pet: +50% damage. Mythical: +100%.
- Pet abilities in combat: Tank pet taunts enemies. Healer pet restores HP.
  DPS pet attacks alongside player. Support pet buffs player stats.
- Pet combat leveling: Pets gain XP from combat. Level-up increases their combat stats.
  Combat-leveled pets are worth more in trading.
- Pet death/faint: Pets can be knocked out in combat (not permanently lost).
  Revive at pet center (costs gold) or use revive item.
- Pet evolution through combat: Some pets only evolve after defeating specific bosses
  or reaching combat milestones with the pet equipped.

────────────────────────────────────────────────────────────
PETS <-> ECONOMY
────────────────────────────────────────────────────────────
- Pet value: Each pet has a trade value based on rarity + level + shiny status.
  This creates a player-driven secondary economy around pets.
- Breeding costs: Breed two pets for a chance at a rarer offspring. Costs gold + gems.
  Breeding cooldown: 4-24 hours depending on rarity.
- Pet food: Pets need feeding to maintain their bonus. Food costs gold. Unfed pets
  still work but at 50% effectiveness. Another money sink.
- Egg purchases: Primary way pets enter the economy. Egg costs scale with rarity tier.
  Common egg: 500 gold. Rare egg: 5,000. Legendary egg: 50,000. Mythical egg: 500,000.
- Pet insurance: Pay gold to protect a pet from losing levels on faint. Recurring cost.
- Lucky charm items: Consumable items that increase hatch luck. Sold by NPCs for premium currency.

────────────────────────────────────────────────────────────
SKILLS <-> COMBAT
────────────────────────────────────────────────────────────
- Ability unlocks: Skill tree nodes unlock new combat moves. Can't use an ability without
  the prerequisite skill point invested. This gates power behind progression.
- Stat bonuses: Passive nodes in skill tree grant +5% HP, +3% damage, +10% crit chance.
  These compound across 20-30 nodes for meaningful power growth.
- Skill synergies: Some skills explicitly enhance others. "Fire Mastery" makes all fire
  abilities deal 25% more damage. "Quick Recovery" reduces cooldowns by 15%.
- Skill-gated equipment: Some legendary weapons require a specific skill node to equip.
  "Requires: Master Swordsmanship (Tier 3 Warrior node)."
- Combat style identity: Skill choices define HOW you fight. Two warriors with different
  skill trees feel completely different to play.

────────────────────────────────────────────────────────────
QUESTS <-> EVERYTHING
────────────────────────────────────────────────────────────
- Quest triggers from any system: "Catch 5 fish" (crafting), "Sell 1000 coins worth of items"
  (economy), "Win 3 PvP battles" (combat), "Adopt a rare pet" (pets), "Decorate your house"
  (housing), "Complete floor 10 of the dungeon" (progression).
- Quest rewards feed any system: Quest gives gold (economy), XP (progression), equipment
  (combat), pet egg (pets), furniture blueprint (housing), skill point (skills).
- Daily quests keep all systems relevant: "Mine 50 ore AND cook 3 meals AND defeat 10 enemies."
  Players engage with systems they might otherwise ignore.
- Story quests unlock systems: "Complete the blacksmith quest to unlock forging."
  "Complete the pet trainer quest to unlock breeding."
- Quest chains create long-term goals: 10-quest chain that takes a week to complete.
  Each quest requires a different system. Final reward is exclusive and powerful.
- World quests unite players: Server-wide objective tracking. "Community has slain 0/10,000 dragons."
  When reached, everyone gets a reward. Builds community.

────────────────────────────────────────────────────────────
INVENTORY <-> CRAFTING <-> ECONOMY
────────────────────────────────────────────────────────────
- Material flow: Gather raw materials (inventory) → Combine at crafting station (crafting)
  → Produce finished goods → Sell or use (economy/combat).
- Inventory capacity creates economic decisions: "Do I keep this iron ore to craft later
  or sell it now for quick gold?" Limited space = forced choices = engagement.
- Crafting recipes as progression: Basic recipes known from start. Advanced recipes found/bought/earned.
  Recipe discovery is a collectible sub-system.
- Material marketplace: Players can list raw materials for sale. Prices set by supply/demand.
  High-level crafters buy materials from low-level gatherers. Everyone benefits.
- Crafting skill levels: Higher crafting skill = chance to make "masterwork" items with bonus stats.
  This adds value to the crafting profession itself.
- Deconstruction: Break down items you don't need into raw materials (at 50% return rate).
  Prevents inventory bloat and feeds materials back into the crafting loop.
- Storage chests: Expand inventory by building storage in your house. Links housing and inventory.

────────────────────────────────────────────────────────────
SOCIAL <-> TRADING <-> ECONOMY
────────────────────────────────────────────────────────────
- Player-driven economy: The most engaging economies are ones where players set prices.
  Auction house: List items, set starting bid and buyout price. 24-hour listings.
- Trade windows: Two players open a secure trade GUI. Both add items/gold. Both confirm.
  Server validates both sides. Anti-scam: 5-second confirmation after both accept.
- Price discovery: Show recent sale prices for items. "This item last sold for 5,000 gold."
  Prevents scamming and helps new players understand value.
- Social trading hubs: Physical locations in-game where trading is encouraged. Trade-only
  chat channel. This concentrates players and creates community.
- Guild/clan economy: Shared guild bank. Guild taxes (2-5% of member earnings). Guild shop
  with exclusive items. Guild crafting stations with bonus efficiency.
- Gifting: Send items/gold to friends. Gift wrapping for presentation. "Gift from [player]" tag.
- Economic roles emerge naturally: Some players become merchants (buy low, sell high),
  some become gatherers, some become crafters. This is GOOD — it creates interdependence.

────────────────────────────────────────────────────────────
PROGRESSION <-> AREAS
────────────────────────────────────────────────────────────
- Level gates: Area 2 requires level 10. Area 3 requires level 25. Each area's enemies
  give XP appropriate for that level range.
- Gear gates: Some areas require minimum gear score (sum of all equipment stats).
  This prevents players from rushing to high areas underequipped.
- Quest gates: Completing a specific quest unlocks the next area. Ties story to progression.
- Key items: Find/craft a key item to unlock an area. Key quest involves multiple systems.
- Gradual reveal: Show locked areas on the map with "???" and level requirement.
  Players can SEE the next area (through a fence/barrier) but can't enter. Desire.
- Backtracking value: Earlier areas should still be worth visiting. Rare spawns, daily events,
  gathering nodes that only appear in lower areas. Prevent ghost-town low zones.
- Area-specific resources: Each area has unique materials needed for area-specific recipes.
  High-level players still visit low areas for their unique materials.

────────────────────────────────────────────────────────────
ACHIEVEMENTS <-> EVERYTHING
────────────────────────────────────────────────────────────
- Track ANY stat: Enemies killed, coins earned, steps taken, items crafted, trades completed,
  quests finished, deaths, login days, friends made, houses built, pets hatched.
- Achievement categories: Combat, Economy, Social, Exploration, Collection, Mastery.
- Progressive achievements: "Kill 10 / 100 / 1,000 / 10,000 enemies" — each tier gives
  increasing rewards and a better title/badge.
- Secret achievements: Not shown in the list until earned. Discovered by doing unusual things.
  "Jump off the tallest building and survive" = "Daredevil" achievement.
- Achievement points: Each achievement has a point value. Total points = player "score."
  Leaderboard by achievement points. Milestones at 100/500/1000/5000 points.
- Reward ANY currency: Achievement rewards can be gold, gems, XP, items, pets, titles,
  cosmetics, or exclusive abilities. Mix it up.
- Display: Achievement showcase on player profile. Select 3-5 "featured" achievements
  to display as badges next to your name.
- Daily login achievements: Consecutive login streak bonuses. Day 1=100g, Day 7=500g,
  Day 30=rare item, Day 100=exclusive title, Day 365=legendary pet.
- Community achievements: "Server has collectively earned 100 million gold." Shared reward.
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 3: BALANCE & TUNING KNOWLEDGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const BALANCE_TUNING = `
=== BALANCE & TUNING — MAKING GAMES FEEL RIGHT ===

The difference between a game that's "technically functional" and one that's
"impossible to put down" is entirely in the TUNING. These principles apply to
every game type.

────────────────────────────────────────────────────────────
CURRENCY INFLATION PREVENTION
────────────────────────────────────────────────────────────
Inflation is the #1 killer of game economies. When money becomes meaningless,
progression feels empty. Every economy needs SINKS that remove currency.

Money sinks (pick 3-5 for every game with an economy):
1. Repair costs: Equipment degrades. Repair costs scale with item tier.
2. Transaction tax: 5-10% tax on player-to-player trades. Gold leaves the economy.
3. Crafting failures: Higher-tier crafting can fail, consuming materials but producing nothing.
4. Rebirth reset: Spending gold to rebirth removes it from circulation.
5. Cosmetic shop: Expensive cosmetics that are desirable but provide no gameplay advantage.
6. Property maintenance: Rent, utilities, furniture upkeep. Recurring costs.
7. Fast travel fees: Teleporting costs gold. Walking is free but slow.
8. Auction house fees: Listing fee (non-refundable) + sale tax (5% of final price).
9. Gambling/gacha: Egg hatching, loot boxes, slot machines. Controlled randomness.
10. Insurance: Pay to protect items from loss on death. Premium service.
11. Skill respec: Reset skill points for increasing gold cost each time.
12. Entrance fees: Dungeons, arenas, special events cost gold to enter.

Income vs. sink ratio: At endgame, sinks should consume 40-60% of total income.
If players accumulate too fast, add new sinks. If too slow, add new income sources.
Monitor: Track total gold in the economy per server. If it grows over 20% per week,
sinks are insufficient.

────────────────────────────────────────────────────────────
DIFFICULTY CURVES
────────────────────────────────────────────────────────────
The "Teach → Challenge → Master → New Mechanic" loop:

1. TEACH (5 minutes): Introduce ONE mechanic in a safe environment. No punishment for failure.
   Example: "Press E to swing your sword. Try hitting this training dummy."
   The player should succeed within 10 seconds. Celebrate success (particles, sound, XP).

2. CHALLENGE (15 minutes): Same mechanic, but now there's consequence. Enemies fight back.
   The environment adds complexity (moving platforms, time limits). Player might fail.
   Failure is quick to recover from (respawn nearby, no harsh penalties).

3. MASTER (10 minutes): Throw difficult scenarios using ONLY that mechanic. The player must
   demonstrate competence. Boss fights, speed challenges, precision tasks.
   Mastery feels INCREDIBLE — this is where players get hooked.

4. NEW MECHANIC (repeat): Introduce the next mechanic. Combine it with the mastered one.
   "Now you can block! Try fighting this enemy that requires blocking and attacking."

Difficulty anti-patterns (NEVER DO THESE):
- Wall of difficulty: Sudden massive spike. Players quit.
- False difficulty: Unfair mechanics (instant-kill with no warning, pixel-perfect timing).
- Grind as difficulty: Making something tedious is NOT difficulty. It's boredom.
- Unclear failure: Player doesn't know WHY they died or what to do differently.

Difficulty scaling formulas:
- Enemy HP: baseHP * (1 + (level - 1) * 0.15) — 15% increase per level
- Enemy damage: baseDamage * (1 + (level - 1) * 0.10) — 10% increase per level
- Required score: baseScore * (1 + (stage - 1) * 0.2) — 20% increase per stage
- Timer reduction: max(baseTimer * 0.95^level, minTimer) — 5% shorter each level

────────────────────────────────────────────────────────────
REWARD PSYCHOLOGY
────────────────────────────────────────────────────────────
Why do players keep playing? Understanding reward psychology makes your games addictive (ethically).

Variable ratio schedules (the slot machine effect):
- DON'T give the same reward every time. Give a RANGE with a weighted distribution.
- Kill an enemy: 70% chance of 5 coins, 20% chance of 15 coins, 8% chance of 50 coins,
  2% chance of 200 coins. The POSSIBILITY of the big drop keeps players engaged.
- Apply this to: Loot drops, egg hatches, daily rewards, quest bonuses, crafting results.

Near-miss effects:
- Show the player when they ALMOST got something great. "You almost hatched a Legendary!"
  (Show the rarity reel spinning past the legendary slot.)
- Near-misses create MORE engagement than wins in some cases. Use sparingly and honestly.

Reward timing:
- Immediate (0-3 seconds): Small rewards. Click = coin. Kill = XP popup. Action = feedback.
- Short-term (1-5 minutes): Complete a wave, finish a stage, sell inventory.
  This is your core loop reward. Players should hit this 5-10 times per session.
- Medium-term (10-30 minutes): Level up, unlock new area, complete quest chain.
  This is your session goal. Players play until they hit one of these.
- Long-term (days/weeks): Rare item completion, achievement milestones, season rewards.
  This is your retention driver. Players come BACK to make progress on these.

Loss aversion (use carefully):
- Players hate losing progress MORE than they enjoy gaining it.
- Daily login streaks: Losing the streak feels terrible, so players log in every day.
- Limited-time events: "Get this item before it's gone forever!" Creates urgency.
- Seasonal rankings: "Maintain your Diamond rank or drop to Platinum." Defensive motivation.
- NEVER remove items players already earned. That destroys trust permanently.

Endowment effect:
- Players value things they OWN more than things they don't.
- Give new players a rare-looking (but not powerful) pet immediately. They'll bond with it.
- Let players name/customize their items. Named items feel more valuable.
- Show "Your collection: 47/100 items." Completion desire kicks in.

────────────────────────────────────────────────────────────
SESSION LENGTH DESIGN
────────────────────────────────────────────────────────────
Roblox sessions average 20-30 minutes for the 9-14 age group. Design for this.

5-minute core loop: The fundamental action cycle should complete in ~5 minutes.
  Tycoon: Place dropper → earn → upgrade → 5 min. Simulator: Grind → sell → upgrade → 5 min.
  RPG: Accept quest → fight → turn in → 5 min.

20-minute session goal: Player should achieve something NOTABLE every ~20 minutes.
  Level up, unlock new area, get a rare drop, complete a quest chain, rebirth.
  This is the "one more..." feeling. "I'll stop after I level up." Then they don't.

60-minute daily goal: The game should have a clear "you've done everything for today" point.
  Daily quests completed, daily login reward claimed, daily dungeon cleared.
  This PREVENTS burnout. Players who play 6 hours burn out and quit permanently.
  Players who play 1 hour daily come back for months.

SESSION START: The first 10 seconds must show something happening.
  Don't start with a loading screen → menu → settings → tutorial → waiting.
  Start with: Loading → BOOM you're in the game, here's your daily reward, here's your quest.

SESSION END: Give a reason to come back.
  "Come back tomorrow for your Day 5 login bonus!" (show what it is)
  "Your crops will be ready to harvest in 4 hours."
  "Daily quests reset in 6 hours."

────────────────────────────────────────────────────────────
NEW PLAYER EXPERIENCE (First 5 Minutes)
────────────────────────────────────────────────────────────
80% of new players who leave in the first 5 minutes NEVER return. This is critical.

Minute 0-1: ZERO FRICTION.
  Player spawns. No dialog walls. No 30-second cutscenes. Brief (2 lines max) welcome.
  Show them ONE clear action: "Click to start!" / "Walk to the glowing point!"
  They should DO SOMETHING within 5 seconds of spawning.

Minute 1-2: FIRST WIN.
  The player should SUCCEED at something. Kill their first enemy. Earn their first coins.
  Complete their first objective. This success triggers dopamine and creates commitment.
  Celebrate this: Particles, level-up sound, "Nice!" text, reward popup.

Minute 2-3: FIRST CHOICE.
  Give the player a meaningful choice. Pick your first pet. Choose your class.
  Select your plot location. This creates OWNERSHIP and investment.
  Both options should be equally good — no "wrong" choice.

Minute 3-5: FIRST GOAL.
  Show the player what they're working toward. "Upgrade your dropper (250 more coins!)"
  "Reach the next area (need 500 more XP!)" A visible progress bar with a clear target.
  The goal should be achievable in the next 5-10 minutes.

What to NEVER do in the first 5 minutes:
- Long text tutorials (show, don't tell)
- Forced cutscenes (let players skip)
- Complex UIs (start with 1-2 buttons, reveal more as needed)
- Harsh punishment (no death penalties, no resource loss)
- Waiting (no timers, no cooldowns, no "come back later")
- Pay gates (NOTHING should cost Robux before the player has had fun for free)

────────────────────────────────────────────────────────────
POWER CURVE DESIGN
────────────────────────────────────────────────────────────
How player power grows over time determines how the game FEELS.

Linear early game (levels 1-20):
  Power = baseStats + (level * statGrowth)
  Every level feels meaningful. +10 HP is a big deal when you have 100 HP.
  Clear, predictable growth. Players understand "I need to level up to get stronger."

Exponential mid-game (levels 20-50):
  Power = baseStats * (growthRate ^ level)
  Power growth accelerates. Players feel POWERFUL. New tiers of content require this.
  But carefully controlled — too fast and players outgrow content before seeing it.

Soft cap late-game (levels 50+):
  Power growth slows dramatically. Each level gives diminishing returns.
  This is intentional — it creates a level range where players coexist and compete.
  Without a soft cap, veteran players are untouchable by newer ones.

Hard cap (max level):
  Eventually, stat growth STOPS. Max level might be 100 or 200.
  Post-max progression shifts to: cosmetics, achievements, rare loot, PvP ranking, leaderboards.
  The game doesn't end — the progression changes form.

XP curve formula:
  xpToNextLevel = floor(baseXP * (level ^ exponent))
  Moderate: baseXP=100, exponent=1.5 → Level 2=100, Level 10=3162, Level 50=35355
  Steep: baseXP=100, exponent=2.0 → Level 2=100, Level 10=10000, Level 50=250000
  Gentle: baseXP=100, exponent=1.2 → Level 2=100, Level 10=1585, Level 50=11220

────────────────────────────────────────────────────────────
MULTIPLAYER BALANCE
────────────────────────────────────────────────────────────
- Matchmaking: Pair players of similar skill/level. ELO rating for PvP. Level range for PvE.
  Solo queue and party queue should be separate when possible.
- Handicaps: In casual modes, give weaker players subtle boosts (5-10% more HP, slightly
  better loot luck). Never tell them. "Rubber banding" keeps games competitive.
- Catch-up mechanics: Players who are behind get accelerated progression.
  "Rested XP" (2x XP for first 30 min after being offline 12+ hours).
  "Mentor bonus" (high-level player groups with low-level, both get bonus XP).
- Scaling: In co-op, enemy HP scales with player count. Solo=100%, Duo=175%, Trio=250%, Quad=300%.
  Drop chance doesn't scale (everyone benefits from group play).
- Anti-grief: Players can't damage each other in safe zones. PvP only in designated areas.
  Kill same player twice in 5 min = no reward (prevents spawn camping).
  Report system with automated punishment for verified griefers.

────────────────────────────────────────────────────────────
MONETIZATION ETHICS (Roblox-specific)
────────────────────────────────────────────────────────────
- NEVER pay-to-win: No stat advantages for Robux. No exclusive powerful items behind paywall.
  If it affects gameplay, it MUST be earnable through play.
- Cosmetic-first: Skins, trails, auras, emotes, name colors, house decorations.
  These have ZERO gameplay impact but massive social value.
- Value clarity: Always show exactly what you're getting. No "mystery boxes" where the odds
  are hidden. Display hatch rates for eggs. Show item stats before purchase.
- Time-for-money trades: Sell convenience, not advantage. Skip wait timers, auto-collect,
  fast travel. These save time but don't make you stronger.
- Season pass: $5-15 worth of Robux. Free track has rewards. Premium track has more/better
  cosmetic rewards. 30-day duration. Must be achievable by playing normally.
- NEVER target children aggressively: No "Your friends all have this!" pressure tactics.
  No "Buy now or miss out forever!" for gameplay items (cosmetics can be limited).
- Robux pricing: Align with Roblox norms. 50-100 Robux for small items. 200-500 for medium.
  1000+ for premium items. Game passes: 100-500 Robux for permanent perks.

────────────────────────────────────────────────────────────
ENGAGEMENT METRICS
────────────────────────────────────────────────────────────
What to measure (and what the numbers mean for Roblox games):

- DAU (Daily Active Users): How many unique players per day.
  Good: Growing 5-10% week-over-week. Bad: Declining.
- Retention D1: % of new players who come back the next day. Target: 25-35%.
  If under 20%, the first-5-minute experience is broken.
- Retention D7: % who come back after a week. Target: 12-18%.
  If under 10%, the medium-term progression is boring.
- Retention D30: % who come back after a month. Target: 5-10%.
  If under 3%, the long-term goals are insufficient.
- Session length: Average time per session. Target: 15-30 minutes.
  Under 10 min = not engaging enough. Over 60 min = burnout risk.
- ARPDAU (Average Revenue Per Daily Active User): Revenue / DAU. Target: $0.01-0.05.
  Roblox takes 30% (DevEx rate). Your cut is 70%.
- CCU (Concurrent Users): Players online at the same time. Affects matchmaking and social.
- Playtime per user per day: Total minutes. Target: 20-40 minutes average.
- Conversion rate: % of players who buy something. Target: 2-5%.

────────────────────────────────────────────────────────────
ANTI-CHEAT DESIGN PHILOSOPHY
────────────────────────────────────────────────────────────
- SERVER AUTHORITY: The server is the source of truth. NEVER trust the client.
  Client says "I have 999,999 gold"? Server checks its own record.
  Client says "I dealt 50,000 damage"? Server calculates damage independently.
- Validation: Every client action is validated server-side before taking effect.
  Movement: Check speed (max walkspeed + 20% tolerance). Flag teleportation.
  Combat: Verify attack is possible (cooldown elapsed, target in range, ammo available).
  Economy: Verify transaction (does player have enough gold? Is item available?).
- Rate limits: Max actions per second. Max 10 clicks/second. Max 2 purchases/second.
  Max 30 remote events per second per client. Flag and kick excessive callers.
- Sanity checks: HP can't exceed max. Gold can't be negative. Level can't decrease.
  Position can't change by more than (walkspeed * deltaTime * 1.5) per frame.
- Obfuscation: Don't expose server logic to clients. Minimize data sent to clients.
  Don't send other players' inventories, bank balances, or admin status.
- Logging: Log suspicious actions. Flag accounts that trigger multiple checks.
  Don't auto-ban — review flagged accounts. False positives destroy trust.
- RemoteEvent security: NEVER put sensitive operations on RemoteEvents without validation.
  Every FireServer call should be validated: is the player allowed to do this right now?
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 4: ROBLOX SCRIPTING PATTERNS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const SCRIPTING_PATTERNS = `
=== ROBLOX SCRIPTING PATTERNS — PRODUCTION LUAU ===

These are the patterns used in TOP Roblox games. Not tutorials — real architecture.

────────────────────────────────────────────────────────────
DATASTORE ARCHITECTURE
────────────────────────────────────────────────────────────
Standard vs Ordered DataStores:
- Standard (DataStoreService:GetDataStore): Key-value storage. Use for player data (inventory,
  stats, settings, progress). Keys = player UserId as string.
- Ordered (DataStoreService:GetOrderedDataStore): Sorted by numeric value. Use for leaderboards
  ONLY. Can get top N entries. Expensive to query — cache results for 30-60 seconds.

Scopes:
- Default scope: Most games use one DataStore per data type. "PlayerData", "Inventory", "Settings".
- Scoped: "PlayerData/server1" for server-specific data. Rarely needed.
- Naming convention: "GameName_PlayerData_v1". Include version number for migrations.

Retry patterns:
- ALWAYS wrap DataStore calls in pcall. They WILL fail eventually.
- Retry logic: 3 attempts with exponential backoff (1s, 2s, 4s).
- Budget awareness: DataStore has request budgets per server. Use GetRequestBudgetForRequestType
  to check before calling. Queue requests when budget is low.
- Batch saves: Don't save on every change. Collect changes and save every 30-60 seconds.
  Also save on PlayerRemoving and game:BindToClose.
- Data loss prevention: Keep an in-memory cache of player data. Only write to DataStore periodically.
  On player join: Load from DataStore → cache. On change: update cache. On save: write cache to DataStore.

Session locking (CRITICAL for preventing data duplication):
- Problem: Player joins Server A, data loads. Player leaves, joins Server B BEFORE Server A saves.
  Server B loads stale data. Player loses progress OR duplicates items.
- Solution: When loading data, set a "session lock" key with the server JobId and timestamp.
  Before saving, verify the lock still belongs to this server. If not, DON'T save.
- Implementation: Use UpdateAsync with a transform function that checks the lock.
  On player leave: Clear the lock. On BindToClose: Clear all locks.
- Fallback: If lock is older than 10 minutes, consider it abandoned (server crashed).
  New server can claim the lock.

Data structure (recommended):
- Store as a single table per player: { coins=0, level=1, inventory={}, pets={}, settings={} }
- Version field: { _version=3, ... }. On load, if version < current, run migration function.
- Checksum (optional): Store a hash of the data. On load, verify. Detects corruption.

────────────────────────────────────────────────────────────
REMOTE COMMUNICATION PATTERNS
────────────────────────────────────────────────────────────
When to use RemoteEvent vs RemoteFunction:
- RemoteEvent: Fire-and-forget. Client tells server "I clicked" or server tells client "show UI."
  Use for: Combat actions, UI updates, notifications, movement inputs.
  MOST communication should be RemoteEvents.
- RemoteFunction: Request-response. Client asks server for data and WAITS for a reply.
  Use for: Initial data load on join, shop purchases (need confirmation), inventory queries.
  DANGER: If the server yields too long, client hangs. Set a timeout on the client side.
  DANGER: Never use InvokeClient from server — malicious clients can hang your server.

Batching:
- Problem: Player clicks 60 times per second. 60 RemoteEvent fires per second.
  Network overhead + server load = lag.
- Solution: Batch inputs on the client. Collect clicks for 0.1 seconds, then send ONE event
  with the count. Server processes in bulk.
- Example: Instead of firing "PlayerClicked" 60 times, fire "PlayerClickBatch" once with {count=60}.

Throttling:
- Server-side: Track last event time per player. If events come faster than expected, ignore extras.
  Max 30 events/second per player for most actions. Max 5/second for purchases.
- Client-side: Debounce UI buttons (0.5s cooldown after click). Prevent double-purchases.
- Rate limit response: If player exceeds rate limit, warn once, then kick on repeated violation.

Data minimization:
- Send the MINIMUM data needed. Don't send entire inventory tables in RemoteEvents.
- Use numeric IDs instead of full item data. Client looks up details from a local item database.
- Compress large data: For save/load operations, serialize tables to JSON strings.

Security rules:
- NEVER trust RemoteEvent arguments. Validate EVERYTHING on the server.
- Type checking: Is it a number? Is it a string? Is it within expected range?
- Permission checking: Is this player allowed to do this action right now?
- Existence checking: Does the item they're trying to use actually exist in their inventory?
- Cooldown checking: Has enough time passed since their last action?

────────────────────────────────────────────────────────────
MODULE ORGANIZATION
────────────────────────────────────────────────────────────
How to structure a game's codebase for maintainability and clarity:

Server structure (ServerScriptService):
  /GameServer (main Script that initializes everything)
  /Services/
    DataService     — DataStore operations, player data cache
    CombatService   — Damage calculation, hit detection, kills
    EconomyService  — Currency management, transactions, shops
    QuestService    — Quest tracking, objectives, rewards
    InventoryService — Item management, equipment, crafting
    MatchService    — Game state, rounds, teams, scoring
  /Config/
    GameConfig      — Constants (max level, base HP, etc.)
    ItemDatabase    — All items: {id, name, type, stats, rarity}
    QuestDatabase   — All quests: {id, title, objectives, rewards}

Client structure (StarterPlayerScripts):
  /GameClient (main LocalScript that initializes everything)
  /Controllers/
    UIController    — Manages all ScreenGuis, modals, notifications
    InputController — Handles keyboard/mouse/touch input
    CameraController — Camera modes (follow, fixed, first-person)
    AudioController — Sound effects, music, ambient
    EffectController — Particles, tweens, visual feedback
  /UI/
    HUDModule       — Health bar, currency display, minimap
    ShopModule      — Shop interface, purchase flow
    InventoryModule — Inventory grid, equipment drag-drop
    DialogModule    — NPC dialog, quest acceptance

Shared (ReplicatedStorage):
  /Modules/
    ItemData       — Item definitions (read-only, shared by server + client)
    GameEnums      — Enumerations (ItemType, Rarity, QuestType, etc.)
    Utility        — Shared helper functions (formatting, math, validation)
    NetworkDefs    — Remote event/function name constants
  /Assets/
    Models, Effects, Sounds (organized by type)

Why this structure matters:
- Each Service/Controller has ONE responsibility. CombatService doesn't know about UI.
  UIController doesn't know about DataStores. Clear boundaries prevent spaghetti code.
- Config modules are separate from logic. Change a number, don't change code.
- Shared modules prevent duplication. Item definitions exist in ONE place.
- New systems are easy to add — create a new Service/Controller pair.

────────────────────────────────────────────────────────────
STATE MACHINE PATTERN
────────────────────────────────────────────────────────────
Use state machines for anything with distinct phases: NPC AI, game rounds, UI transitions.

Structure:
- States: Named phases (Idle, Patrol, Chase, Attack, Dead).
- Transitions: Conditions that move from one state to another (see player → Chase).
- Enter/Exit: Each state has onEnter (start animation, set speed) and onExit (cleanup).
- Update: Each state has an update function called every frame/heartbeat.

NPC AI state machine example:
- Idle: Stand still. Play idle animation. After 3-5 seconds, transition to Patrol.
  onEnter: Play IdleAnimation. Set Humanoid.WalkSpeed = 0.
- Patrol: Walk between waypoints. Play walk animation.
  onEnter: Pick next waypoint. Set WalkSpeed = 8. Play WalkAnimation.
  update: Move toward waypoint. If reached, pick next. If see player within 30 studs, → Alert.
- Alert: Stop. Turn toward player. Play alert animation (! above head).
  onEnter: Stop moving. Play AlertAnimation. Start 2-second timer.
  update: If timer done, → Chase. If player moves out of range, → Patrol.
- Chase: Run toward player. Play run animation.
  onEnter: Set WalkSpeed = 16. Play RunAnimation.
  update: Move toward player. If within 5 studs, → Attack. If lost sight for 10s, → Lost.
- Attack: Play attack animation. Deal damage.
  onEnter: Play AttackAnimation. Create hitbox after startup frames.
  update: If attack finished, if player in range → Attack again, else → Chase.
- Lost: Search for player. Check hiding spots.
  onEnter: Play LookAroundAnimation. Pick nearby search points.
  update: Check search points. After 15 seconds, → Patrol.
- Dead: Ragdoll. Drop loot. Respawn timer.
  onEnter: Destroy hitbox. Play death effect. Drop loot table items.
  After respawnTime, → Idle at spawn position.

Game state machine:
- Lobby: Players join. Show countdown. When minPlayers reached, start 30s countdown.
- Intermission: Select map, show teams, 10-second countdown.
- Playing: Game is active. Timer running. Win/loss conditions checked every frame.
- Overtime: If tie, extend with special rules.
- Results: Show scoreboard, distribute rewards, 15-second countdown to next round.
- Cleanup: Destroy map objects, reset player states, → Lobby.

────────────────────────────────────────────────────────────
OBSERVER PATTERN
────────────────────────────────────────────────────────────
Use BindableEvents for communication between modules ON THE SAME SIDE (server↔server or client↔client).

Why not just call functions directly?
- Decoupling: CombatService fires "PlayerKilled" event. EconomyService, QuestService,
  and AchievementService all listen. CombatService doesn't know or care who's listening.
- Easy to add new listeners: New system? Just listen to existing events. No code changes elsewhere.
- Testing: Can fire events manually to test individual systems.

Common game events:
- PlayerJoined(player, data) — fired after data loads, not on raw PlayerAdded
- PlayerKilled(killer, victim, weapon) — all kill-related logic subscribes
- ItemObtained(player, itemId, source) — inventory, quest tracking, achievements
- CurrencyChanged(player, currency, oldAmount, newAmount) — UI updates, logging
- QuestCompleted(player, questId) — rewards, next quest, achievements
- LevelUp(player, newLevel) — stat recalculation, UI, rewards, area unlocks
- AreaUnlocked(player, areaId) — UI notification, fast travel update
- RoundStarted(roundNumber) — all systems reset for new round
- RoundEnded(winnerTeam, results) — scoring, rewards, cleanup

Implementation: Create BindableEvents in ReplicatedStorage/Events (or ServerStorage/Events for server-only).
Each module grabs the events it needs and connects to them in its init function.

────────────────────────────────────────────────────────────
OBJECT POOLING
────────────────────────────────────────────────────────────
Creating and destroying Instances is EXPENSIVE in Roblox. Pool reusable objects.

When to pool:
- Projectiles (bullets, arrows, fireballs): Created and destroyed constantly.
- Particle effects (hit effects, coin pickups): Short-lived, frequently spawned.
- UI elements (damage numbers, notifications): Pop up and disappear constantly.
- Enemies in tower defense: Waves of enemies spawning and dying.
- Dropped items: Items appearing and being picked up.

Pool structure:
- Pool table: { available = {}, active = {}, maxSize = 50 }
- Get: Pop from available. If empty and under maxSize, create new. If over maxSize, return nil.
- Return: Remove from active, reset properties, push to available.
- Reset: Critical — move to a hidden position (CFrame.new(0, -1000, 0)), disable scripts,
  stop particles, reset values. The object must be INDISTINGUISHABLE from a new one.

Performance gain: Pooling 100 projectiles vs creating/destroying them can be 10-50x faster
in terms of frame time, especially with complex models.

────────────────────────────────────────────────────────────
SPATIAL PARTITIONING
────────────────────────────────────────────────────────────
When you need "find all enemies within 50 studs" and there are 500 enemies,
don't check all 500. Use spatial partitioning.

Grid-based (simplest, recommended for most Roblox games):
- Divide the map into cells (e.g., 50x50 stud cells).
- Each entity registers in its current cell.
- To find nearby entities: Check current cell + 8 adjacent cells (9 total).
- When entity moves, update its cell registration.
- For a 1000x1000 map with 50-stud cells = 400 cells. Checking 9 cells instead of all entities.

When to use:
- Enemy AI detection (find nearest player)
- AoE damage calculation (find all entities in blast radius)
- Loot magnet (auto-collect items within range)
- Social features (find nearby players for interaction)

Roblox-specific optimization: Use workspace:GetPartBoundsInBox() or
workspace:GetPartBoundsInRadius() for quick spatial queries on parts.
For non-part entities (tracked in tables), use the grid approach.

────────────────────────────────────────────────────────────
TWEEN PATTERNS
────────────────────────────────────────────────────────────
Easing styles create FEEL. The right easing makes UI feel alive.

- Quad (Ease-Out): Smooth deceleration. Use for: UI elements sliding into view,
  objects settling into position. The default "safe" choice.
- Bounce: Bounces at the end. Use for: Items dropping, notifications appearing,
  playful UI elements. FUN feeling. Great for kid-focused games.
- Back: Overshoots then settles. Use for: Button presses (scale 1→1.1→1),
  modal appearances, "springy" feedback.
- Elastic: Extreme overshoot with oscillation. Use for: Special effects,
  attention-grabbing UI, celebration moments. VERY playful.
- Quint (Ease-Out): Very smooth, feels premium. Use for: Settings panels,
  menus, anything that should feel elegant and polished.
- Linear: Constant speed. Use for: Progress bars, loading indicators,
  conveyor movement. NOT for UI — feels robotic.
- Sine (Ease-In-Out): Gentle acceleration and deceleration. Use for:
  Breathing animations, hover effects, ambient movement.

Tween combinations for common UI patterns:
- Modal open: Size from 0→1 with Back easing + Transparency from 1→0 with Quad easing. 0.3s.
- Modal close: Size from 1→0 with Quad EaseIn. 0.2s (exits should be FASTER than entrances).
- Button hover: Size 1→1.05 with Sine. 0.15s. Subtle but noticeable.
- Button click: Size 1→0.95→1 with Back. 0.1s. Feels "pressed."
- Notification slide: Position off-screen→visible with Quint EaseOut. 0.4s. Hold 3s. Slide out 0.2s.
- Damage number: Position Y+0→Y-30 with Quad EaseOut + Transparency 0→1 with Linear. 0.8s.
- Coin collect: Position object→UI coin counter with Quad EaseIn. 0.5s. Then bump counter.

────────────────────────────────────────────────────────────
ANIMATION BLENDING
────────────────────────────────────────────────────────────
Animation priorities (from lowest to highest):
- Core (0): Idle animation. Always playing. Gets overridden by everything.
- Movement (1): Walk, run, swim. Overrides idle but not actions.
- Action (2): Attack, interact, emote. Overrides movement during play.
- Action4 (3): Critical actions that should never be interrupted (death, stun).

Weight transitions:
- Don't instant-swap animations. Fade out old (weight 1→0 over 0.1s) while fading in new (0→1).
- Walk→Run: Crossfade over 0.2s. Feels natural.
- Idle→Attack: Quick crossfade 0.05s. Needs to feel responsive.
- Any→Death: Immediate. No crossfade. Impact.

Animation tips for Roblox:
- Always set animation priority correctly. Most common bug: all animations at same priority,
  causing flickering.
- Use Animator:LoadAnimation() and cache the AnimationTrack. Don't reload every play.
- For procedural animation (leaning into turns, head tracking), modify Motor6D C0/C1 transforms.
- Humanoid.AutoRotate = false when you need the character to face a specific direction
  independently of movement (aiming, dialog, cutscenes).

────────────────────────────────────────────────────────────
INPUT HANDLING PATTERNS
────────────────────────────────────────────────────────────
ContextActionService vs UserInputService:
- ContextActionService: Bind actions to keys. Actions can be bound/unbound dynamically.
  Supports mobile buttons automatically. Priority system for conflicting bindings.
  USE THIS for gameplay inputs (attack, jump, interact, ability keys).
- UserInputService: Raw input events. Keyboard, mouse, touch, gamepad.
  USE THIS for UI interactions, custom cursors, raw mouse position tracking.

Mobile vs Desktop considerations:
- Touch targets: Minimum 44x44 pixels (about 2.5 studs at typical UI scale).
- Mobile buttons: Use ContextActionService:BindAction with createTouchButton=true.
  Position buttons in thumb-reach zones (bottom corners of screen).
- Gesture support: Pinch-to-zoom (camera), swipe (menu navigation), long press (inspect).
- Auto-detect platform: UserInputService.TouchEnabled for mobile. Adjust UI layout accordingly.
  Show on-screen controls only on mobile. Hide them on desktop.
- Gamepad: Support thumbstick for movement, face buttons for actions. D-pad for menu navigation.
  Test with a controller — Roblox has growing console/gamepad audience.

Input buffering:
- Problem: Player presses attack before the previous attack animation finishes. Input is lost.
- Solution: Buffer the input for 0.3 seconds. When the current action finishes, check the buffer.
  If an input is waiting, immediately start the next action.
- This makes combos feel responsive. Without buffering, combos feel clunky and dropped.

────────────────────────────────────────────────────────────
ADDITIONAL CRITICAL PATTERNS
────────────────────────────────────────────────────────────

Cooldown management:
- Store cooldowns in a dictionary: cooldowns[actionName] = os.clock() + duration.
- Check: if os.clock() >= (cooldowns[actionName] or 0) then allow action end.
- Display: Show cooldown timer on the ability button UI (circular sweep or countdown number).
- Server-side cooldowns: ALWAYS enforce on server, not just client. Client UI shows the visual.

Damage calculation:
- Formula: finalDamage = (baseDamage + weaponDamage) * skillMultiplier * critMultiplier - targetDefense
- Crit calculation: if math.random() < critChance then critMultiplier = critDamage else 1 end
- Damage types: Physical, Magical, True (ignores defense). Rock-paper-scissors resistances.
- Damage numbers: Show floating text at hit position. Color by type (white=normal, yellow=crit, red=fire).
- Minimum damage: Always deal at least 1 damage. Otherwise high-defense enemies are invincible.

Respawn system:
- On death: 3-5 second respawn timer. Show spectate camera or death screen.
- Respawn location: Last checkpoint, spawn point, or bed (survival games).
- Invincibility frames: 2-3 seconds after respawn. Visual indicator (flashing/transparent).
- Death penalty (if any): XP loss (never level loss), gold loss (% of carried), or durability loss.
  NEVER lose items on death unless the game genre expects it (hardcore survival only).

Loading and streaming:
- Use StreamingEnabled for large maps. Set StreamingMinRadius to 128-256 studs.
- Pre-load critical assets on join: Weapons, character, HUD textures.
  Use ContentProvider:PreloadAsync() during a loading screen.
- Progressive loading: Load the spawn area first. Load distant areas as player approaches.
- Loading screen: Show progress bar, game tips, and artwork. Don't show a blank screen.
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 5: UI/UX DESIGN KNOWLEDGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const UI_UX_KNOWLEDGE = `
=== UI/UX DESIGN KNOWLEDGE — PROFESSIONAL GAME INTERFACES ===

────────────────────────────────────────────────────────────
LAYOUT PRINCIPLES
────────────────────────────────────────────────────────────
F-pattern reading:
- Players scan UI in an F-pattern: top-left → top-right → down-left → across.
- Put the MOST IMPORTANT info at the top-left (HP, currency, level).
- Secondary info at the top-right (minimap, timer, settings).
- Action buttons at the bottom (abilities, inventory, chat).

Visual hierarchy (what grabs attention first):
1. Size: Bigger = more important. Main currency display should be 1.5-2x size of secondary.
2. Color: Bright on dark background. Gold/yellow draws the eye first.
3. Contrast: High contrast = notice first. Dark text on light background or vice versa.
4. Motion: Animated elements draw attention. Use ONLY for things that need attention NOW.
5. Position: Center screen = highest importance. Edges = persistent but secondary info.

Whitespace (critical and often ignored):
- Don't cram UI elements together. Leave 8-16 pixels between related elements.
- Leave 24-32 pixels between unrelated groups.
- Padding inside containers: 12-16 pixels minimum.
- Whitespace makes UIs look PROFESSIONAL. Cramped UIs look amateur.
- Rule: When in doubt, add more whitespace.

Grid system:
- Use consistent spacing multiples. If base unit = 4px: 4, 8, 12, 16, 24, 32, 48.
- Align elements to the grid. Misaligned elements look unpolished even if players can't articulate why.
- Column layouts: 1 column for mobile, 2-3 for desktop Roblox UIs.
- Consistent margins: All screens should have the same edge margins (24-32px from screen edges).

────────────────────────────────────────────────────────────
COLOR THEORY FOR GAMES
────────────────────────────────────────────────────────────
Color communicates meaning INSTANTLY. Players don't read — they see colors.

Warm colors (red, orange, yellow):
- Red: DANGER, health loss, enemy, critical, urgent. Use for: low HP warning, damage numbers,
  error messages, enemy indicators. Never use red for positive things.
- Orange: WARNING, almost-ready, transition. Use for: cooldown timers nearing ready,
  moderate-rarity items, caution indicators.
- Yellow/Gold: REWARD, premium, achievement, coins. Use for: currency, rare loot, star ratings,
  XP gains, purchase highlights. Gold = premium feel.

Cool colors (blue, green, purple):
- Blue: INFO, mana/energy, water, trust, friendly. Use for: mana bars, info tooltips,
  team indicators, safe zones, shield/armor. Roblox's primary UI color is blue.
- Green: POSITIVE, health, success, nature, go. Use for: HP bars, healing, quest complete,
  item pickup, level up, available/online status.
- Purple: RARE, magic, mystery, epic. Use for: epic-rarity items, special abilities,
  magical effects, premium features, void/space themes.

Neutral colors:
- White: Clean, common-rarity, text. Primary text color on dark backgrounds.
- Gray: Disabled, unavailable, secondary info. Grayed-out buttons, locked content.
- Black: Background, shadow, depth. Use behind UI panels (with 40-60% transparency).

Rarity color coding (UNIVERSAL across Roblox):
- Common: White/Gray
- Uncommon: Green
- Rare: Blue
- Epic: Purple
- Legendary: Orange/Gold
- Mythical: Red/Pink
Players EXPECT these colors. Breaking this convention confuses everyone.

Color accessibility:
- Never communicate information through color ALONE. Add icons, labels, or patterns.
- 8% of males are colorblind. Red-green colorblindness is most common.
- Test your UI in grayscale — if you can still read it, you're accessible.
- Minimum contrast ratio: 4.5:1 for normal text, 3:1 for large text (WCAG AA).

Color palette construction:
- Pick ONE primary color (matches your game's theme).
- Pick ONE accent color (complementary or analogous to primary).
- Use 3-4 shades of each (lighter for backgrounds, darker for borders/text).
- Add one "alert" color (usually red) and one "success" color (usually green).
- Neutral background: Dark gray (30-40 RGB) for dark mode, Light gray (230-240) for light.
- NEVER use pure black (#000000) or pure white (#FFFFFF). Too harsh. Use near-black and near-white.

────────────────────────────────────────────────────────────
TYPOGRAPHY
────────────────────────────────────────────────────────────
Roblox fonts and when to use them:
- GothamBold: HEADERS, titles, important numbers. Big, impactful, readable.
  Use at 24-48px. Currency amounts, level numbers, section headers.
- GothamMedium: Sub-headers, button text, labels. Clean and professional.
  Use at 16-24px. Button labels, stat names, menu items.
- Gotham: Body text, descriptions, longer text. Readable at small sizes.
  Use at 14-18px. Item descriptions, quest text, dialog.
- SourceSans (SourceSansPro): Compact text, small labels, tooltips. Fits more text in less space.
  Use at 12-16px. Tooltips, timestamps, secondary info.
- FredokaOne: FUN, playful, kid-friendly. Use for games targeting younger audiences.
  Use at 20-36px. Game titles, celebration text, fun notifications.
- BuilderSans: Clean, modern, tech feel. Good for sci-fi/tech themed games.

Size hierarchy (MUST have clear distinction):
- Title: 36-48px (game name, main headers)
- Heading: 24-32px (section titles, panel headers)
- Subheading: 18-22px (card titles, stat names)
- Body: 14-16px (descriptions, dialog text)
- Caption: 11-13px (tooltips, timestamps, fine print)

Each step should be OBVIOUSLY different in size. If players squint to tell heading from body, they're too close.

Text readability on Roblox:
- Always add TextStrokeTransparency = 0.5 (or lower) for text over 3D scenes.
  Without a stroke, text is UNREADABLE against complex backgrounds.
- Or use a dark semi-transparent background panel behind text.
- TextScaled = true for auto-sizing, but set MaxTextSize to prevent huge text.
- Line spacing: 1.2-1.5x font size for multi-line text. Roblox default is often too tight.

────────────────────────────────────────────────────────────
ANIMATION PRINCIPLES FOR UI
────────────────────────────────────────────────────────────
UI animation rules:
- EVERY interaction needs feedback. Button press? Scale animation. Hover? Color change.
  Purchase? Coin fly animation. Level up? Full-screen celebration.
- Timing: 0.1-0.15s for button feedback. 0.2-0.3s for panel transitions.
  0.4-0.6s for major reveals. Never longer than 1s for UI (feels sluggish).
- Ease-out for entrances: Elements accelerate IN but decelerate when arriving.
  Feels like the element is "landing" naturally.
- Ease-in for exits: Elements accelerate OUT. Quick departure. Don't linger.
- Spring for playful: Use Back or Elastic easing for fun games (tycoon, simulator).
  Overshooting and bouncing feels energetic and playful.
- Stagger for lists: When showing a list, don't show all items at once.
  Stagger each item by 0.05s. Items "cascade" in. Looks premium.

Micro-animations that make UIs feel ALIVE:
- Idle pulse: Buttons gently pulse (scale 1→1.02→1, 2s loop). Shows they're interactive.
- Coin counter bump: When coins change, the number briefly scales up (1→1.15→1, 0.2s).
- Progress bar shimmer: A subtle light sweeps across progress bars (linear gradient animation).
- Notification badge bounce: New notifications get a small bounce animation.
- Health bar shake: When taking damage, the HP bar shakes briefly (position offset ±2px, 0.15s).
- Background parallax: Slight movement of background elements when scrolling menus.

Performance warning: Don't animate more than 5-10 UI elements simultaneously.
Each TweenService:Create call adds overhead. Batch tweens and reuse them when possible.

────────────────────────────────────────────────────────────
MOBILE-FIRST DESIGN
────────────────────────────────────────────────────────────
70%+ of Roblox players are on mobile. Design for mobile FIRST, then add desktop enhancements.

Touch targets:
- MINIMUM 44x44 pixels for any tappable element. Roblox UI: about 0.06 scale on a phone.
- Spacing between touch targets: at least 8 pixels. Preventing mistaps.
- Most-used buttons: Place in the bottom 1/3 of screen (thumb reach on mobile).
- Least-used buttons: Top corners (settings, help — intentionally harder to accidentally tap).

Thumb reach zones (right-handed, most common):
- Easy reach: Bottom-right quadrant. Put primary actions here (attack, jump, interact).
- Moderate reach: Bottom-left and center. Put secondary actions (inventory, map).
- Hard reach: Top corners. Put infrequent actions (settings, menu, exit).
- Unreachable: Top-center on large phones. NEVER put important interactive elements here.

Safe areas:
- iOS notch: Don't put UI in the top 44 pixels or bottom 34 pixels.
- Android nav bar: Bottom 48 pixels may be obscured.
- Game UI safe zone: Inset all interactive UI by 10% from screen edges.
- Test: GuiService:GetGuiInset() returns the Roblox top bar offset. Account for it.

Mobile-specific UI patterns:
- Radial menus: Tap-and-hold to open, slide to select. Great for ability selection.
- Swipe tabs: Swipe left/right to switch between inventory tabs instead of tiny buttons.
- Pinch gestures: Zoom in/out on maps, build previews.
- Bottom sheet: Slide-up panel from bottom for detailed views. Standard mobile pattern.
- Auto-hide UI: In immersive moments (cutscenes, exploration), hide HUD. Tap to reveal.

────────────────────────────────────────────────────────────
FEEDBACK PATTERNS
────────────────────────────────────────────────────────────
RULE: Every action needs visual + audio response within 100ms. No silent interactions.

Feedback layers (apply multiple for important actions):
1. Visual: Color change, animation, particle effect.
2. Audio: Sound effect (click, whoosh, ding, error buzz).
3. Haptic: Screen shake (via camera manipulation). Mobile vibration (limited in Roblox).
4. Textual: Floating number (+50g), status text ("Purchased!"), notification.

Feedback by action type:
- Button press: Scale 1→0.95→1 (0.1s) + click sound.
- Successful action: Green flash + success sound + floating "+1" text.
- Failed action: Red flash + error sound + shake animation + "Not enough gold!" text.
- Damage taken: Red vignette on screen edges + damage number + hit sound + camera shake.
- Damage dealt: Floating damage number at hit location + hit sound + brief camera shake.
- Level up: Full-screen golden flash + level-up fanfare + particles + text overlay.
- Item obtained: Item icon flies to inventory slot + collection sound + inventory badge pulses.
- Currency gained: Number floats up from source + coin sound + counter bumps.

Feedback scaling:
- Small action = subtle feedback. Click a menu button: tiny scale + soft click.
- Medium action = moderate feedback. Buy an item: coin animation + moderate sound.
- Big action = BIG feedback. Level up: screen flash + particles + fanfare + text.
  The importance of the action should match the intensity of the feedback.

────────────────────────────────────────────────────────────
INFORMATION DENSITY
────────────────────────────────────────────────────────────
Show only what matters NOW. Hide everything else.

Progressive disclosure:
- Level 1 (always visible): HP, currency, level, current objective. Minimap if exploration game.
- Level 2 (on hover/focus): Detailed stats, item descriptions, enemy info.
- Level 3 (on request): Full inventory, settings, achievement list, leaderboard.
- Never show Level 3 info at Level 1 visibility. It clutters and overwhelms.

HUD minimalism:
- New players: Show more UI (tutorial hints, objective arrows, ability labels).
- Experienced players: Let them toggle off tutorial UI. Minimalist HUD option.
- Immersive mode: Double-tap a key to hide ALL HUD. For screenshot/exploration.

Contextual UI:
- Near an NPC: Show interact prompt (only when in range).
- In combat: Show enemy HP, ability cooldowns, combo counter (only during combat).
- In shop: Show gold, inventory, shop UI (only when in shop).
- The UI should reflect the player's CURRENT ACTIVITY, not every system at once.

────────────────────────────────────────────────────────────
ACCESSIBILITY
────────────────────────────────────────────────────────────
Making games accessible = more players = more revenue. It's also the right thing to do.

- Color alternatives: Never use color as the ONLY indicator. Add icons, text labels, or patterns.
  "Red enemy, blue ally" → Also use different shapes or overhead icons.
- Text size options: Let players scale UI text 80%-150% of default. Set TextScaled = true
  with min and max sizes. Test at both extremes.
- Screen reader basics: Name every important UI element meaningfully. While Roblox doesn't have
  full screen reader support, named elements help future compatibility.
- Audio alternatives: Important audio cues (enemy approaching, timer warning) should have
  visual equivalents (screen edge indicator, flashing timer).
- Reduced motion: Option to disable non-essential animations. Some players get motion sick
  from screen shake, parallax, or fast camera movement.
- Input alternatives: Support keyboard, mouse, touch, and gamepad for all core actions.
  Don't require specific input methods. Let players rebind keys.
- Subtitles: For voice acted content, always provide subtitles. Large enough to read on mobile.
- Difficulty options: "Easy mode" that reduces enemy damage, extends timers, and provides
  more hints. Never shame players for using accessibility options.

────────────────────────────────────────────────────────────
COMMON UI PATTERNS IN TOP ROBLOX GAMES
────────────────────────────────────────────────────────────
Study these patterns — players EXPECT them because they've seen them everywhere.

Shop UI:
- Grid of items, each with: icon, name, price, rarity border color.
- Click to select → show details in side panel → Buy button with confirmation.
- Category tabs at top (Weapons, Armor, Items, Cosmetics).
- "Not enough gold" button grays out. Shows how much more is needed.
- Premium items have a special gold/animated border.

Inventory UI:
- Grid of slots (6x5 or 8x6). Each slot shows item icon + count.
- Click to select → options (Equip, Use, Drop, Info).
- Equipment slots on the left (paper doll style: head, chest, legs, weapon, accessory).
- Drag-and-drop between inventory and equipment slots.
- Sort button: By rarity, by type, by recent.
- Full indicator: "Inventory Full! Sell or drop items to make room."

Quest tracker:
- Right side of screen, 3-5 active quests shown.
- Each quest: Name, brief objective, progress bar/counter (3/10 wolves).
- Click quest to see full details in a panel.
- Pin/unpin quests to tracker.
- Main quest highlighted differently from side quests.
- Completed quests: Green checkmark + "Turn in" prompt.

Notification system:
- Bottom-right corner. Notifications slide in, hold 3-5 seconds, slide out.
- Types: Achievement (gold border), Quest update (blue), System message (gray),
  Warning (red), Social (green).
- Stack: Max 3 visible. New ones push old ones up. Excess queued.
- Click notification to jump to relevant UI panel.
- Persistent badge: Small red circle on main menu icon showing unread count.

Settings menu:
- Categories: Audio (Master, Music, SFX, Voice), Graphics (Quality Low/Med/High, FPS display),
  Controls (Sensitivity, Keybinds, Mobile layout), Gameplay (Language, Difficulty, Tutorials).
- Sliders for volume/sensitivity. Toggles for on/off settings.
- "Reset to Default" button at the bottom.
- Changes apply immediately (preview) with a "Save" button.

────────────────────────────────────────────────────────────
HUD DESIGN
────────────────────────────────────────────────────────────
What to show always vs. on-demand vs. never:

ALWAYS VISIBLE (minimal footprint):
- Health bar (top-left or bottom-center)
- Primary currency (top-right, with icon)
- Current level/XP bar (thin bar, top or bottom of screen)
- Minimap or compass (top-right or bottom-left)
- Active quest objective (right side, compact text)

ON-DEMAND (shown when relevant):
- Ability cooldowns (shown during combat, hidden otherwise)
- Ammo count (shown when weapon equipped)
- Interact prompt (shown when near interactive objects)
- Enemy HP bar (shown when targeting/fighting an enemy)
- Notification toast (appears for 3-5 seconds when triggered)
- Boss HP bar (appears during boss fights, top-center)
- Combo counter (appears during combat combos)

NEVER ON HUD (in menus only):
- Full inventory
- Quest log
- Achievement list
- Settings
- Leaderboard
- Social/friends list
- Shop
- Detailed stats

HUD customization (premium feature):
- Let players move HUD elements. Drag-and-drop positioning.
- Let players resize HUD elements. Slider from 50%-150%.
- Let players hide specific HUD elements. Toggle each one.
- Save HUD layout to DataStore. Persist between sessions.
- Preset layouts: "Compact", "Default", "Expanded", "Mobile Optimized".
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Full knowledge base — all 5 sections combined. ~2500 lines. */
export const DEEP_GAME_KNOWLEDGE: string = [
  GAME_BLUEPRINTS,
  SYSTEM_INTERACTIONS,
  BALANCE_TUNING,
  SCRIPTING_PATTERNS,
  UI_UX_KNOWLEDGE,
].join('\n\n')

/** Section 1 only: Game type blueprints for 15 genres. */
export const KNOWLEDGE_BLUEPRINTS: string = GAME_BLUEPRINTS

/** Section 2 only: How game systems connect to each other. */
export const KNOWLEDGE_INTERACTIONS: string = SYSTEM_INTERACTIONS

/** Section 3 only: Balance, tuning, and game-feel knowledge. */
export const KNOWLEDGE_BALANCE: string = BALANCE_TUNING

/** Section 4 only: Roblox scripting patterns and architecture. */
export const KNOWLEDGE_SCRIPTING: string = SCRIPTING_PATTERNS

/** Section 5 only: UI/UX design for professional game interfaces. */
export const KNOWLEDGE_UI_UX: string = UI_UX_KNOWLEDGE

/**
 * Get a trimmed knowledge snippet relevant to a specific game type.
 * Returns the blueprint for that game type + the interactions + balance sections.
 * Used when injecting into prompts with limited token budget.
 */
export function getKnowledgeForGameType(gameType: string): string {
  const lower = gameType.toLowerCase()
  const sections: string[] = []

  // Find the relevant blueprint section
  const blueprintLines = GAME_BLUEPRINTS.split('\n')
  const gameTypeMap: Record<string, string> = {
    tycoon: '1. TYCOON',
    simulator: '2. SIMULATOR',
    rpg: '3. RPG',
    obby: '4. OBBY',
    roleplay: '5. ROLEPLAY',
    'tower defense': '6. TOWER DEFENSE',
    'tower_defense': '6. TOWER DEFENSE',
    td: '6. TOWER DEFENSE',
    'battle royale': '7. BATTLE ROYALE',
    'battle_royale': '7. BATTLE ROYALE',
    br: '7. BATTLE ROYALE',
    survival: '8. SURVIVAL',
    horror: '9. HORROR',
    racing: '10. RACING',
    fighting: '11. FIGHTING',
    puzzle: '12. PUZZLE',
    sandbox: '13. SANDBOX',
    clicker: '14. CLICKER',
    idle: '14. CLICKER',
    'murder mystery': '15. MURDER MYSTERY',
    'murder_mystery': '15. MURDER MYSTERY',
    murder: '15. MURDER MYSTERY',
  }

  // Find best match
  let matchHeader = ''
  for (const [key, header] of Object.entries(gameTypeMap)) {
    if (lower.includes(key)) {
      matchHeader = header
      break
    }
  }

  if (matchHeader) {
    // Extract just that game type's section
    let capturing = false
    let depth = 0
    for (const line of blueprintLines) {
      if (line.includes(matchHeader)) {
        capturing = true
        depth = 0
      }
      if (capturing) {
        sections.push(line)
        // Stop at the next game type header (numbered section)
        if (depth > 5 && /^\d+\.\s+[A-Z]/.test(line.trim())) {
          sections.pop() // Remove the next header
          break
        }
        depth++
      }
    }
  }

  // Always include interactions and balance (they apply to everything)
  sections.push('\n--- SYSTEM INTERACTION PATTERNS (relevant to all games) ---\n')
  sections.push(SYSTEM_INTERACTIONS.slice(0, 3000)) // Trimmed version

  sections.push('\n--- BALANCE & TUNING (relevant to all games) ---\n')
  sections.push(BALANCE_TUNING.slice(0, 3000)) // Trimmed version

  return sections.join('\n')
}

/**
 * Get knowledge sections relevant to a specific task type.
 * Maps build-executor task types to the most relevant knowledge sections.
 */
export function getKnowledgeForTaskType(taskType: string): string {
  switch (taskType) {
    case 'script':
      return KNOWLEDGE_SCRIPTING + '\n\n' + KNOWLEDGE_BALANCE.slice(0, 2000)
    case 'economy':
      return KNOWLEDGE_BALANCE + '\n\n' + KNOWLEDGE_INTERACTIONS
    case 'ui':
      return KNOWLEDGE_UI_UX
    case 'npc':
      return KNOWLEDGE_SCRIPTING.slice(0, 2000) + '\n\n' + KNOWLEDGE_BLUEPRINTS.slice(0, 2000)
    case 'building':
    case 'prop':
    case 'terrain':
    case 'lighting':
    case 'audio':
      // These task types benefit from general game knowledge
      return KNOWLEDGE_BALANCE.slice(0, 1500)
    default:
      return KNOWLEDGE_SCRIPTING.slice(0, 1500) + '\n\n' + KNOWLEDGE_BALANCE.slice(0, 1500)
  }
}
