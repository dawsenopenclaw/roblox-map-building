// game-progression-bible.ts — Game progression, leveling, and retention knowledge
// Actionable design patterns. No filler.

export const PROG_LEVELING: string = `
=== XP AND LEVELING SYSTEMS ===

--- XP CURVE FORMULAS BY GAME TYPE ---

RPG / Adventure:
  XP to next level = 100 * level ^ 1.5
  Level 1→2: 100 XP | Level 10→11: 3,162 XP | Level 50→51: 35,355 XP | Level 100→101: 100,000 XP
  XP sources: quests (50-500), enemies (10-100 per kill), exploration (25-100 per discovery)
  Feels: steady early, grinding later. Player invests in character.

Simulator (pet sim, mining sim):
  XP to next level = 50 * level ^ 2
  Level 1→2: 50 XP | Level 10→11: 5,000 XP | Level 50→51: 125,000 XP
  XP sources: actions (1-10 per action), multipliers (pet bonus, gamepass bonus, rebirth bonus)
  Feels: fast clicks/taps, exponential scaling encourages rebirth.

Tycoon:
  Income to next upgrade = basePrice * 1.15 ^ upgradeLevel
  Upgrade 1: 100 | Upgrade 10: 404 | Upgrade 25: 3,292 | Upgrade 50: 108,366
  Revenue scaling: 1.15x multiplier is standard. Higher = more grinding.
  Feels: snowballing income, satisfying growth curves.

Obby:
  Linear — no XP curve. Progress = stages completed.
  Difficulty curve: stages 1-10 easy, 11-25 medium, 26-40 hard, 41+ extreme
  Checkpoint saves progress. No grinding, pure skill.

Fighting:
  ELO/MMR: starts at 1000, gain/lose 15-30 per match
  Win vs higher rated: +25-30 | Win vs lower rated: +10-15
  Loss vs higher rated: -10-15 | Loss vs lower rated: -25-30
  Rank thresholds: Bronze <800, Silver 800-1200, Gold 1200-1600, Diamond 1600-2000, Champion 2000+

Tower Defense:
  Difficulty per wave = baseHP * 1.12 ^ waveNumber
  Wave 1: 100 HP enemies | Wave 10: 311 HP | Wave 25: 1,704 HP | Wave 50: 29,000 HP
  Currency per wave: baseCurrency + (wave * 5)
  Boss waves: every 5th wave, 5x HP, 3x currency reward

Survival:
  Day difficulty = 1 + (dayNumber * 0.15)
  Day 1: 1.15x | Day 7: 2.05x | Day 14: 3.1x | Day 30: 5.5x
  Enemy count per night: 3 + (dayNumber * 2)
  Resource scarcity increases: respawn time grows by 5% per day

Idle/Clicker:
  Cost for upgrade N = baseCost * 1.07 ^ N
  Income per upgrade: baseCost * 0.1 (10% of cost, 10 upgrades to ROI)
  Prestige multiplier: 1 + (lifetimeEarnings / 1e6) ^ 0.5
  Offline earnings: 50% of online rate, capped at 8 hours

--- LEVEL CAP DESIGN ---
Soft cap: XP curve gets very steep but no hard limit (simulators)
Hard cap: Level 100 max, endgame is gear/prestige (RPG)
Seasonal cap: Max level per season, resets (battle pass)
No cap: Infinite leveling, diminishing returns (incremental)

--- STAT GAINS PER LEVEL ---
HP per level: baseHP * (1 + level * 0.05) — 5% growth per level
Damage per level: baseDamage * (1 + level * 0.03) — 3% growth
Defense per level: baseDefense + (level * 2) — linear flat growth
Speed per level: baseSpeed + (level * 0.5) — slow linear (cap at 50% bonus)
Always have diminishing returns to prevent broken high levels.
`

export const PROG_UNLOCKS: string = `
=== UNLOCK TREES ===

--- TYCOON UNLOCK PROGRESSION ---
Stage 1 (0-500 coins): Basic dropper, first conveyor, starter collector
Stage 2 (500-2K): Second dropper, upgrader x1, floor expansion
Stage 3 (2K-10K): Third dropper, upgrader x2, decoration unlock, wall
Stage 4 (10K-50K): Premium dropper, auto-collector, roof, second floor
Stage 5 (50K-200K): Super dropper, teleporter, employee NPC
Stage 6 (200K-1M): Mega dropper, full factory, vehicle, prestige option
Each stage: new visual elements appear on the tycoon base.

--- SIMULATOR UNLOCK PROGRESSION ---
Zone 1 (free): starter egg, basic pet, 10x click value
Zone 2 (1K strength): better egg (uncommon pets), x2 area
Zone 3 (10K strength): rare egg, new tool, enchant system
Zone 4 (100K strength): legendary egg, flying ability
Zone 5 (1M strength): mythical egg, teleport, rebirth shop
Zone 6 (10M strength): godly egg, special area, exclusive pets
Zone 7 (100M strength): secret zone, developer eggs, final boss

--- RPG SKILL TREE PATTERN ---
3 branches: Warrior / Mage / Rogue (or similar archetypes)
Each branch: 10-15 skills
Skill point per level (1 point, choose wisely)
Tier 1 (level 1-5): basic abilities, passive boosts (+10% damage)
Tier 2 (level 6-15): class-defining skills (fireball, stealth, shield bash)
Tier 3 (level 16-30): powerful combos, AoE, buffs
Tier 4 (level 31-50): ultimate abilities (30-60 second cooldowns)
Respec option: costs 50% of total XP earned (painful but possible)

--- OBBY STAGE UNLOCKS ---
Every 10 stages: new visual theme (grass, lava, ice, space, neon)
Every 25 stages: trail effect unlock
Every 50 stages: character skin/effect
Stage 100: title badge
Stage 200: flying ability (in lobby only)
Skips purchasable: 5 Robux per stage skip (devproduct)
`

export const PROG_ACHIEVEMENTS: string = `
=== ACHIEVEMENT SYSTEM ===

--- COMBAT ACHIEVEMENTS ---
First Blood: Deal damage for the first time
Warrior: Defeat 100 enemies
Slayer: Defeat 1,000 enemies
Unstoppable: Defeat 10,000 enemies
Boss Hunter: Defeat first boss
Dragon Slayer: Defeat hardest boss
Combo Master: Land a 10-hit combo
Pacifist: Complete a zone without killing anything
Untouchable: Defeat a boss without taking damage
Glass Cannon: Defeat a boss in under 30 seconds

--- EXPLORATION ACHIEVEMENTS ---
First Steps: Visit first zone
Explorer: Visit 5 zones
World Traveler: Visit all zones
Peak Performance: Reach highest point on map
Deep Diver: Reach lowest point on map
Secret Finder: Discover 5 hidden areas
Cartographer: Uncover 100% of the map
Off the Beaten Path: Find a path no signs point to
Night Owl: Explore during night cycle
Cliff Hanger: Stand on every cliff edge

--- SOCIAL ACHIEVEMENTS ---
Friend Maker: Add first friend in-game
Team Player: Complete a quest with a party
Trader: Complete first trade
Generous: Gift an item to another player
Guild Founder: Create a guild
Popular: Have 10 friends online simultaneously
Mentor: Help a new player complete tutorial
Party Animal: Join 10 different parties

--- COLLECTION ACHIEVEMENTS ---
Collector: Collect 10 unique items
Hoarder: Collect 100 unique items
Completionist: Collect every item in a category
Pet Lover: Own 25 unique pets
Fashionista: Own 50 unique cosmetics
Full Set: Complete an armor set
Lucky: Obtain a legendary item
Jackpot: Obtain a mythical item
Museum Curator: Display 20 items in showcase

--- ECONOMY ACHIEVEMENTS ---
First Dollar: Earn first coin
Thousandaire: Earn 1,000 coins total
Millionaire: Earn 1,000,000 coins total
Billionaire: Earn 1,000,000,000 coins total
Smart Shopper: Buy 10 items from shop
Big Spender: Spend 100,000 coins in one session
Investor: Rebirth for the first time
Magnate: Rebirth 10 times
Mogul: Rebirth 100 times

--- CHALLENGE ACHIEVEMENTS ---
Speed Runner: Complete zone in under 5 minutes
No Deaths: Complete without dying
Minimalist: Complete with starter gear only
Iron Man: Complete without healing
Flawless: Get S-rank on all stages
Dedication: Play 100 hours total
Daily Devotee: Log in 30 consecutive days
Veteran: Play for 365 days (non-consecutive OK)

--- SECRET ACHIEVEMENTS (hidden until earned) ---
Easter Egg: Find developer-hidden room
Noclip: Fall through the map and survive (teleport back)
Backwards: Complete an obby stage in reverse
Dance Battle: Dance emote near boss before fighting
Wrong Answer: Give intentionally wrong quest answers 5 times

--- ACHIEVEMENT REWARDS ---
Title/Badge: displayed on profile (every achievement)
Currency: 50-5000 coins (scales with difficulty)
XP bonus: 100-10000 XP (one-time)
Cosmetic: unique hat/trail/aura (rare achievements only)
Stat bonus: +1% permanent damage/speed (milestone achievements)
Leaderboard points: 1-100 per achievement (total = achievement score)
`

export const PROG_RETENTION: string = `
=== RETENTION MECHANICS ===

--- DAILY LOGIN REWARD (7-day cycle) ---
Day 1: 100 coins
Day 2: 200 coins
Day 3: 500 coins + 1 common crate
Day 4: 1,000 coins
Day 5: 2,000 coins + 1 rare crate
Day 6: 5,000 coins
Day 7: 10,000 coins + 1 legendary crate + exclusive weekly cosmetic
RESET to Day 1 after Day 7. Missing a day does NOT reset streak.
Streak bonus: consecutive weeks multiply rewards (week 2 = 1.5x, week 3 = 2x, cap at 3x)

--- DAILY QUESTS (refresh every 24 hours) ---
3 daily quests, increasing difficulty:
Easy (complete in 5 min): "Defeat 10 enemies" — reward 200 coins + 50 XP
Medium (complete in 15 min): "Collect 50 resources" — reward 500 coins + 150 XP
Hard (complete in 30 min): "Complete Zone 3 dungeon" — reward 1,500 coins + 500 XP
Bonus for all 3: 2,000 coins + 1 crate
Replace quest: 1 per day free, additional costs 100 coins

--- WEEKLY QUESTS (refresh Monday) ---
3 weekly quests, major goals:
"Defeat 500 enemies this week" — 10,000 coins
"Earn 100,000 coins this week" — 5,000 bonus coins
"Play 5 hours this week" — exclusive weekly pet/cosmetic
All 3 complete: Mega crate + 1000 premium currency

--- STREAK SYSTEM ---
Play consecutive days. Each day adds 10% to all earnings.
Day 1: 1x | Day 5: 1.5x | Day 7: 1.7x | Day 14: 2.4x | Day 30: 3.9x (cap)
Missing ONE day: streak halved (not fully reset — less punishing)
Missing TWO+ days: streak resets to 0
Display streak prominently on login screen.

--- COMEBACK BONUSES ---
If player absent 3-7 days: "Welcome back!" — 2x earnings for 1 hour
If player absent 7-14 days: "We missed you!" — 3x earnings for 2 hours + free crate
If player absent 14+ days: "Welcome home!" — 5x earnings for 4 hours + free legendary crate + catch-up XP package
Purpose: reduce barrier to returning, prevent churn from snowball effect.

--- SEASONAL EVENTS ---
Duration: 2-4 weeks per event
Exclusive currency: event tokens (only earnable during event)
Exclusive rewards: limited cosmetics (FOMO driver)
Event pass: free track (10 rewards) + premium track (20 Robux, 25 rewards)
Event quests: daily + weekly specific to event theme
Countdown: display "3 days left!" urgency on HUD

--- BATTLE PASS ---
100 tiers, 30-day season
Free track: every 5 tiers a reward (20 total)
Premium track: every tier a reward (100 total), costs 200 Robux
XP per tier: 1000 base, scaling +100 per tier
Daily play earning: ~3000 XP (completes ~3 tiers/day)
Casual players reach tier 50-70. Dedicated reach 100.
Leftover tiers purchasable: 15 Robux per tier (FOMO monetization)
`

export const PROG_QUESTS: string = `
=== QUEST SYSTEM ===

--- QUEST TYPES ---
Main quest: linear story progression, required for area unlocks
Side quest: optional, reward currency/XP/items, discoverable
Daily quest: refreshes every 24h, small quick tasks
Weekly quest: refreshes Monday, larger goals
Event quest: limited-time during seasonal events
Hidden quest: no quest marker, triggered by exploration/interaction
Repeatable quest: can be done multiple times (usually farming)

--- QUEST CHAIN PATTERN ---
Quest 1: "Talk to NPC" (introduction, lore setup)
Quest 2: "Collect 5 items nearby" (teach gathering mechanic)
Quest 3: "Defeat 3 enemies" (teach combat)
Quest 4: "Deliver item to NPC across map" (teach navigation)
Quest 5: "Defeat mini-boss" (skill check)
Quest 6: "Return to quest giver" (reward, unlock next chain)
Each quest in chain gives escalating rewards.

--- QUEST TRACKING ---
Active quests list: max 5 active at once
Objective text: "Defeat Wolves (3/5)" with progress bar
Map markers: diamond icon at objective location
Distance indicator: "150 studs away" below marker
Completion popup: centered screen, reward preview, "Complete" button
Quest log: full list of available, active, completed quests

--- DYNAMIC QUESTS ---
Generated from templates:
"Defeat [count] [enemy_type] in [zone]"
"Collect [count] [resource] from [zone]"
"Travel to [location] and interact with [object]"
"Survive [duration] in [danger_zone]"
"Reach [score] in [minigame]"
Populate variables from current content tables.
`

export const PROG_PRESTIGE: string = `
=== PRESTIGE / REBIRTH SYSTEMS ===

--- BASIC REBIRTH ---
Requirement: reach level cap or earn X total currency
On rebirth: reset level to 1, reset currency to 0, reset upgrades
Keep: achievements, cosmetics, rebirth count, special rebirth currency
Gain: permanent multiplier = 1 + (rebirths * 0.1) — 10% boost per rebirth
UI: big "REBIRTH" button with confirmation, shows what you keep/lose

--- MULTI-TIER REBIRTH ---
Rebirth 1 (Prestige): reset levels, gain 1.1x multiplier per prestige
  Requirement: Level 50 or 1M coins
Rebirth 2 (Ascension): reset prestiges AND levels, gain 2x multiplier per ascension
  Requirement: Prestige 25
Rebirth 3 (Transcendence): reset everything, gain 5x multiplier per transcend
  Requirement: Ascension 10
Each tier has unique currency and shop.

--- REBIRTH BONUS FORMULAS ---
Linear: multiplier = 1 + (rebirths * 0.1) — simple, predictable
Square root: multiplier = 1 + math.sqrt(rebirths) — fast early, slow late
Logarithmic: multiplier = 1 + math.log(rebirths + 1) — very diminishing
Exponential (soft): multiplier = 1.05 ^ rebirths — snowballs dangerously
RECOMMENDED: Square root for most games. Feels rewarding without breaking.

--- PRESTIGE SHOP ---
Exclusive items only purchasable with prestige currency:
Auto-clicker: 5 prestige tokens
Permanent 2x coins: 20 prestige tokens
Skip first 10 levels: 10 prestige tokens
Unique pet/cosmetic: 15 prestige tokens
Extra daily quest slot: 25 prestige tokens
VIP area access: 50 prestige tokens

--- REBIRTH NAMING ---
Tier 1: Rebirth, Prestige, Ascend, Evolve
Tier 2: Super Rebirth, Mega Prestige, Transcend
Tier 3: Ultra Rebirth, Omega Prestige, Godhood
Use consistent theme. Space games: "Launch → Orbit → Warp → Galaxy"
Fantasy: "Rebirth → Ascension → Apotheosis → Divinity"
`

export const GAME_PROGRESSION_BIBLE: string = PROG_LEVELING + '\n\n' + PROG_UNLOCKS + '\n\n' + PROG_ACHIEVEMENTS + '\n\n' + PROG_RETENTION + '\n\n' + PROG_QUESTS + '\n\n' + PROG_PRESTIGE
