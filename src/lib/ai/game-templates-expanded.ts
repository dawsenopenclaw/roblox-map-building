// game-templates-expanded.ts
// Expanded Roblox game design templates for AI build context.
// Each template gives the AI actionable knowledge: loop, systems, layout, progression, monetization, scripts, data, session length.

export const TEMPLATE_TYCOON = `
GAME TYPE: Tycoon (Dropper Factory)
TARGET SESSION: 45-90 minutes. Idle-friendly. Players leave and return.

CORE LOOP (every 30 seconds):
- Droppers produce items automatically at set rate
- Items roll along conveyor belts to upgrader machines
- Upgrader multiplies item value (x2, x5, x10)
- Items drop into collector at the end, convert to cash
- Player spends cash on new droppers, upgrades, or decorations
- Larger cash totals unlock new zones of the tycoon pad

SYSTEMS NEEDED:
1. Dropper System - produces Part or Model at interval using task.wait loop in Script
2. Conveyor System - BasePart with AssemblyLinearVelocity or BodyVelocity to push items
3. Upgrader System - detector on a block; on touch, multiplies item value stored in ObjectValue
4. Collector System - invisible block at end; on touch, reads item value, adds to player cash, destroys item
5. Button Purchase System - proximity prompts or touch-based billboard buttons to buy new buildings
6. Cash Display System - BillboardGui above collector showing current total
7. Prestige System - when player reaches cash cap, reset tycoon for permanent multiplier bonus
8. Auto-Save System - DataStore saves every 60 seconds and on player leave
9. Leaderboard System - OrderedDataStore for top earners, updates every 5 minutes
10. Team Lock System - tycoon pads belong to one player; others cannot activate buttons

MAP LAYOUT (studs):
- Total plot: 100 x 100 studs per player pad
- Dropper zone: back 20 studs, row of dropper machines spaced 8 studs apart
- Conveyor run: 60 studs long, 6 studs wide, slight downward angle (5 degrees)
- Upgrader stations: every 15 studs along conveyor, 6 x 6 x 4 stud box
- Collector zone: front 10 studs, 10 x 10 stud pit
- Cash register NPC or pedestal: center front at position (0, 0, -45)
- Lobby hub: 200 x 200 stud shared area with leaderboard boards and shop NPCs
- Sky limit: 50 studs above pad base

PROGRESSION TIMELINE:
Hour 1: Player buys first dropper (100 cash), earns 10 cash/sec, buys second dropper, unlocks first upgrader
Hour 5: Player has all tier-1 droppers, first prestige available, cash rate 500/sec, unlocks golden dropper skin
Hour 20: Player on prestige 3+, automation maxed, collecting rebirth tokens, competing on leaderboard top 10

MONETIZATION:
Gamepasses:
- 2x Cash Boost: 299 Robux - permanent double all cash earned
- Auto-Collector: 149 Robux - automatically collects cash every 10 seconds without touching collector
- VIP Dropper: 499 Robux - exclusive dropper producing 10x base value items
- Tycoon Expansion: 799 Robux - unlocks secret 50-stud extension zone with 5 bonus dropper slots
- Infinite Storage: 99 Robux - remove item despawn timer, items never disappear

DevProducts (repeatable):
- Cash Boost x10: 25 Robux - instant 10x current cash
- Prestige Skip: 199 Robux - skip one prestige grind, keep rewards
- Lucky Dropper 1 Hour: 49 Robux - droppers produce double items for 60 minutes
- Mega Upgrade: 79 Robux - one random upgrader becomes 50x for current session

KEY SCRIPTS:
Script (ServerScript in ServerScriptService):
- DropperHandler.server.lua: task.delay loop per dropper, clones item model, sets value ObjectValue, parents to workspace
- ConveyorHandler.server.lua: sets AssemblyLinearVelocity on all conveyor parts on startup
- UpgraderHandler.server.lua: .Touched connection on upgrader hitbox, reads item ObjectValue, multiplies it
- CollectorHandler.server.lua: .Touched on collector, fires RemoteEvent to server, adds cash to player leaderstats
- PurchaseHandler.server.lua: .Triggered on ProximityPrompt, checks player cash, deducts, parents new building model
- DataHandler.server.lua: DataStore2 or raw DataStoreService, saves table of owned buildings + cash + prestige count
- LeaderboardHandler.server.lua: OrderedDataStore:SetAsync on cash update, reads top 10 every 300 seconds

LocalScript (StarterPlayerScripts or StarterCharacterScripts):
- CashUI.client.lua: listens to RemoteEvent for cash updates, tweens NumberLabel display
- PurchaseUI.client.lua: shows cost on ProximityPrompt, grays out if player cannot afford
- TycoonCamera.client.lua: sets camera CFrame to isometric view of player pad on spawn

DATASTORE SCHEMA (save as JSON-encoded string per player):
{
  cash: number,
  prestige: number,
  prestigeMultiplier: number,
  ownedBuildings: string[],  -- array of building IDs like "dropper_1", "upgrader_2"
  gamepassOwned: { autocolect: bool, vip: bool, expansion: bool },
  totalEarned: number,  -- lifetime stat for leaderboard
  lastSave: number      -- os.time() stamp
}
`;

export const TEMPLATE_SIMULATOR = `
GAME TYPE: Pet Simulator (Hatch, Collect, Fight)
TARGET SESSION: 30-60 minutes. Daily login reward hooks players back.

CORE LOOP (every 30 seconds):
- Player taps/clicks to collect coins from the ground or objects
- Coins go toward egg purchases at egg stands
- Hatch egg to get random pet with rarity tier (Common to Secret)
- Equip strongest pets (up to 3 at a time)
- Pets auto-collect nearby coins and boost tap multiplier
- Use coins to unlock new zones with better eggs and faster income
- Trade or fuse duplicate pets to get higher-tier evolution

SYSTEMS NEEDED:
1. Pet Hatch System - random roll using weighted table, tween egg animation, reveal pet model
2. Pet Equip System - up to 3 pets follow player, each adds multiplier to CoinCollected event
3. Coin Spawn System - coins respawn every 3 seconds in zone, instanced as Parts with BillboardGui value labels
4. Tap/Click System - ClickDetector or UserInputService tap, fires RemoteEvent to increment coins server-side
5. Zone Unlock System - zones gated by total coin count, invisible barrier with prompt removed when threshold met
6. Rarity System - weighted random: Common 60%, Uncommon 25%, Rare 10%, Epic 4%, Legendary 0.9%, Secret 0.1%
7. Pet Fusion System - 3 identical pets fuse into one evolved version with 3x multiplier
8. Daily Reward System - os.date check, grant coins or free hatch on login after 20 hours
9. Trading System - server-side trade session between two players, both confirm before items transfer
10. Leaderboard System - track total pets collected, coins earned, displayed on giant board in hub

MAP LAYOUT (studs):
- Hub world: 150 x 150 stud circle, egg stands on outer ring spaced 30 studs apart
- Zone 1 (Meadow): 200 x 200 studs, basic coin flowers, Common-Rare egg stand
- Zone 2 (Candy Land): 250 x 250 studs, candy cane coin taps, Rare-Epic egg stand, requires 1M coins
- Zone 3 (Space): 300 x 300 studs, floating platforms, Epic-Legendary eggs, requires 1B coins
- Zone 4 (Void): 200 x 200 studs, dark aesthetic, Secret eggs only, requires 1T coins
- Teleport pads: 10-stud glowing circles connecting zones

PROGRESSION TIMELINE:
Hour 1: Player hatches 10 Common pets, unlocks Zone 2, equips first Rare pet, earns basic multiplier
Hour 5: Player has full Legendary set, fusing duplicates, competing in coin leaderboard top 100
Hour 20: Player in Zone 4, owns multiple Secrets, trading for specific shinies, chasing hidden pets

MONETIZATION:
Gamepasses:
- VIP: 399 Robux - 2x coins, exclusive VIP egg (Legendary guaranteed), gold nametag
- Auto-Hatch: 299 Robux - hatch nearest egg automatically every 30 seconds
- Lucky Eggs: 199 Robux - permanent +5% chance on all rarity tiers
- Shiny Pets: 499 Robux - all hatched pets have 10% chance to be gold (shiny) version worth 10x
- Infinite Backpack: 149 Robux - remove pet storage cap (base is 50 pets)

DevProducts:
- 2x Coins 1 Hour: 35 Robux
- Free Hatch x5: 49 Robux
- Instant Zone Unlock: 149 Robux - skip coin requirement for current locked zone
- Rarity Boost 30 Min: 69 Robux - all rarities shift up one tier for 30 minutes

KEY SCRIPTS:
Script (ServerScriptService):
- EggHatchHandler.server.lua: receives RemoteEvent from client, rolls rarity, clones pet model, grants to player data
- CoinHandler.server.lua: manages coin spawn loop per zone, handles .Touched collection, fires update to client
- PetEquipHandler.server.lua: receives equip request, validates ownership, updates equipped array in player data
- TradeHandler.server.lua: manages trade sessions table, validates both players online, executes swap atomically
- DataHandler.server.lua: saves pet inventory, coins, unlockedZones, equippedPets, totalHatched

LocalScript:
- PetFollow.client.lua: reads equipped pets from replicated data, tweens pet models to follow HumanoidRootPart
- CoinUI.client.lua: updates coin counter on screen, plays pickup tween animation on collection
- HatchAnimation.client.lua: plays egg shake tween, screen shake, confetti particle on hatch reveal
- ZoneUI.client.lua: shows lock overlay with cost display when player approaches locked zone barrier

DATASTORE SCHEMA:
{
  coins: number,
  totalCoinsEarned: number,
  pets: [ { id: string, rarity: string, isShiny: bool, level: number } ],
  equippedPets: string[],  -- 3 pet IDs max
  unlockedZones: string[],
  dailyReward: { lastClaim: number, streak: number },
  totalHatched: number,
  gamepasses: { vip: bool, autoHatch: bool, lucky: bool, shiny: bool }
}
`;

export const TEMPLATE_RPG = `
GAME TYPE: RPG / Adventure (Quests, Combat, Levels)
TARGET SESSION: 60-120 minutes. Deep progression, story hooks.

CORE LOOP (every 30 seconds):
- Player moves through open world zones
- Enemy NPCs patrol and aggro on proximity
- Player attacks using sword swing or ranged ability (cooldown 1-2 seconds)
- Defeated enemies drop XP orbs and item loot
- XP fills level bar, level-up grants stat points
- Stat points go into Strength, Defense, Speed, or Magic
- Quest NPCs give objectives (kill X, collect Y, reach Z)
- Quest rewards include rare items, gold, and XP bonuses

SYSTEMS NEEDED:
1. Combat System - hitbox detection using Region3 or GetPartsInPart, damage calculation with stats
2. Enemy AI System - Pathfinding with PathfindingService, aggro radius, idle/chase/attack states
3. Quest System - quest table with objectives, progress tracking per player, completion rewards
4. Loot System - weighted drop table per enemy type, item spawns as Part in world, proximity collect
5. Stat System - Strength adds damage, Defense reduces incoming, Speed boosts WalkSpeed, Magic for spells
6. Inventory System - grid UI with item slots, equip/unequip, item rarity coloring
7. Skill System - 4 active skills per class, cooldown managed client-side displayed server-verified
8. Class System - Warrior, Mage, Rogue, Archer - different base stats and skill sets
9. Boss System - large NPC with multiple phases, HP bar UI, special attack patterns, rare loot table
10. Party System - up to 4 players group, shared XP in radius, party-only dungeon instances

MAP LAYOUT (studs):
- Hub town: 300 x 300 studs, quest givers, shops, respawn points, portal to zones
- Zone 1 (Forest): 600 x 600 studs, level 1-10 enemies, linear paths, hidden chests
- Zone 2 (Desert): 600 x 600 studs, level 10-25 enemies, sandstorm particle effect
- Zone 3 (Dungeon): 400 x 800 studs, indoor corridors 20 studs wide, level 25-40, boss at end
- Zone 4 (Volcano): 500 x 500 studs, level 40-60, lava floor hazards, elite enemies
- Teleport stones: every zone entrance, 8-stud glowing pillar
- Player housing zone: 200 x 200, plots 30 x 30 each for personalizing

PROGRESSION TIMELINE:
Hour 1: Player picks class, completes tutorial quest chain, reaches level 10, equips first Uncommon gear set
Hour 5: Player level 30-40, has cleared first dungeon, full blue gear, unlocked second skill bar
Hour 20: Player level 60+, full legendary set, farming boss for set completion, in ranked dungeon runs

MONETIZATION:
Gamepasses:
- 2x XP Boost: 349 Robux - permanent double XP from all sources
- Premium Class - Necromancer: 499 Robux - exclusive dark class, summon skeleton minions
- Extra Inventory Slots: 199 Robux - adds 20 additional inventory slots
- VIP Server Access: 999 Robux - private server with all zones, invite friends
- Mount Pack: 299 Robux - horse mount, 25 percent speed boost while riding

DevProducts:
- XP Potion x5: 49 Robux - instant 5000 XP each
- Gold Boost 1 Hour: 39 Robux - 3x gold drops for 60 minutes
- Stat Reset: 99 Robux - reallocate all stat points
- Loot Magnet 30 Min: 29 Robux - automatically collect all nearby drops

KEY SCRIPTS:
Script (ServerScriptService):
- CombatHandler.server.lua: receives swing RemoteEvent, creates hitbox, loops GetPartsInPart, applies damage to humanoid
- EnemyAI.server.lua: per enemy using task.spawn, PathfindingService:ComputeAsync, state machine idle/chase/attack
- QuestHandler.server.lua: tracks quest table per player, increments on kill/collect events, grants reward on complete
- LootHandler.server.lua: on enemy death, rolls drop table, clones item Part to world position, connects .Touched collect
- DataHandler.server.lua: saves full player state on leave and every 120 seconds
- BossHandler.server.lua: manages boss phases by HP threshold, broadcasts special attack warnings via RemoteEvent
- PartyHandler.server.lua: maintains party table, distributes XP to all members within 50 studs of kill

LocalScript:
- CombatUI.client.lua: swing button on mobile, keyboard Q for ability 1-4, cooldown ring animation on icons
- HealthBar.client.lua: smooth tween on humanoid health change, enemy nameplate HP bars via BillboardGui
- QuestTracker.client.lua: shows active quest objectives in top-right ScreenGui, updates on RemoteEvent
- InventoryUI.client.lua: grid of ImageButtons, drag-and-drop equip, tooltip on hover with item stats

DATASTORE SCHEMA:
{
  level: number,
  xp: number,
  class: string,
  stats: { strength: number, defense: number, speed: number, magic: number },
  statPoints: number,
  gold: number,
  inventory: [ { itemId: string, rarity: string, quantity: number } ],
  equipped: { weapon: string, armor: string, helmet: string, accessory: string },
  skills: string[],
  completedQuests: string[],
  activeQuests: [ { id: string, progress: number } ],
  unlockedZones: string[]
}
`;

export const TEMPLATE_OBBY = `
GAME TYPE: Obby (Obstacle Course)
TARGET SESSION: 20-40 minutes. Replayable for completion time. Stage-based.

CORE LOOP (every 30 seconds):
- Player navigates platforming challenges: jump gaps, avoid spinners, time moving platforms
- Die and respawn at last checkpoint (Stage brick touched saves stage number)
- Reach next checkpoint brick to lock in progress
- Stages increase in difficulty: tight jumps, rotating obstacles, lava floors, speed shifts
- Finish line grants badge, rank badge, and cosmetic reward
- Players race each other for fastest time on leaderboard

SYSTEMS NEEDED:
1. Checkpoint System - touching numbered brick fires RemoteEvent, server saves stage to player data, respawn at that position
2. Kill Brick System - any Part tagged KillBrick deals 100 damage on .Touched, instant kill
3. Moving Platform System - TweenService loop on Part position between two CFrame values at set speed
4. Spinner/Rotating Obstacle System - RunService.Heartbeat rotates Part by fixed CFrame delta each frame
5. Speed Pad System - touching pad sets Humanoid.WalkSpeed to boosted value for 3 seconds
6. Low-Gravity Zone System - workspace.Gravity set locally via LocalScript in zone, reset on exit
7. Timer System - server timestamps on stage 1 enter and finish, calculates completion time
8. Leaderboard System - OrderedDataStore for fastest times and highest stages
9. Skip Stage System - DevProduct purchase skips current stage, teleports to next checkpoint
10. Cosmetic Unlock System - reaching stage milestones (50, 100, 150) grants exclusive trail effect

MAP LAYOUT (studs):
- Start line: 10 x 10 stud platform, bright color
- Each stage: average 40-80 studs long, 8-12 studs wide path
- Stage count: 100-200 stages total
- Checkpoints: every 5 stages, bright glowing pillar 4 x 8 x 4
- Total course length: 4000-10000 studs in a winding path or tower structure
- Tower variant: each stage climbs 8 studs higher, total height 800-1600 studs
- Side walls: 8 stud tall invisible ForceField Parts to prevent going off course
- Finish area: 40 x 40 stud celebration room with fireworks particle effects

PROGRESSION TIMELINE:
Hour 1: Player reaches stage 30-50 depending on skill, earns first cosmetic trail at stage 25
Hour 5: Player in top 200 stages, earned Intermediate badge, wearing unique trail
Hour 20: Player completed full course, grinding fastest time, helping others in chat, replaying elite section

MONETIZATION:
Gamepasses:
- Skip 5 Stages: 75 Robux - one-time use button, skip ahead 5 stages
- VIP: 149 Robux - golden name, exclusive VIP trail, 2x coins from stages
- Speed Coil: 199 Robux - permanent WalkSpeed 30 (base 16) and JumpPower 65 (base 50)
- Infinite Skips: 499 Robux - unlimited stage skips for session (not permanent advance)

DevProducts:
- Skip 1 Stage: 15 Robux
- Skip 10 Stages: 99 Robux
- Gravity Coil 30 Min: 29 Robux - lower gravity for 30 minutes
- Checkpoint Restore: 49 Robux - if you lose progress from server restart, restore last known stage

KEY SCRIPTS:
Script (ServerScriptService):
- CheckpointHandler.server.lua: .Touched per checkpoint brick, fires to server, saves stage number to player data
- KillBrickHandler.server.lua: tags all KillBrick Parts, loops .Touched connection, Humanoid:TakeDamage(100)
- MovingPlatformHandler.server.lua: on game start, TweenService loops for each moving platform Part
- TimerHandler.server.lua: timestamps player entering stage 1, records finish time to OrderedDataStore
- DataHandler.server.lua: saves stage, coins, cosmetics, bestTime per player

LocalScript:
- ObbyCamera.client.lua: default camera works; optionally locks to behind-player for tower sections
- StageUI.client.lua: top-center label showing current stage number, updates on RemoteEvent from server
- TrailEffect.client.lua: attaches Attachment + Trail to HumanoidRootPart based on owned cosmetic
- TimerUI.client.lua: shows elapsed time ticking on screen from stage 1 entry to finish

DATASTORE SCHEMA:
{
  stage: number,
  coins: number,
  bestTime: number,
  completions: number,
  ownedTrails: string[],
  activeTrail: string,
  gamepasses: { speedCoil: bool, vip: bool }
}
`;

export const TEMPLATE_HORROR = `
GAME TYPE: Horror (Survive, Solve, Escape)
TARGET SESSION: 15-30 minutes per round. High replayability from random events.

CORE LOOP (every 30 seconds):
- Players spawn in dark map with flashlight
- Monster NPC patrols or chases players with line-of-sight and sound detection
- Players find clues, pull levers, or solve puzzles to unlock escape route
- If monster catches player, jumpscare animation plays, player is eliminated or sent to ghost mode
- Last survivor or full team escape wins round
- End screen shows stats: survival time, items found, deaths

SYSTEMS NEEDED:
1. Monster AI System - PathfindingService, raycast line-of-sight check, sound detection radius, chase speed increase
2. Flashlight System - SpotLight attached to camera tool, battery drains over 3 minutes, find batteries to refill
3. Puzzle System - lever combinations, code locks with clues hidden in notes around map, door unlock on solve
4. Ghost Mode System - eliminated players become invisible ghosts, can move freely, see monster position but cannot interact
5. Jumpscare System - monster catches player, client-side full-screen image flashes, loud audio, screen shake
6. Atmosphere System - ambient sound zones, random creak sounds on timer, flickering PointLights
7. Round Manager System - lobby countdown, map selection, spawning, win/lose conditions, return to lobby
8. Vote Map System - players vote on map at end of round, top vote wins
9. Item Spawn System - batteries, notes, keys spawn at random positions from predefined spawn list each round
10. Sanity System - being near monster lowers sanity, low sanity causes visual distortion LocalScript effect

MAP LAYOUT (studs):
- Building exterior: 150 x 100 studs footprint
- Rooms: 8-12 rooms per floor, each 20 x 20 to 30 x 30 studs, 12 stud ceiling height
- Corridors: 6-8 studs wide, 30-60 studs long connecting rooms
- Floors: 2-3 floors connected by stairs (8 stud rise per floor)
- Basement: optional secret floor accessible via trapdoor, hardest puzzle
- Escape door: always at map edge, multiple locks requiring puzzle solves
- Monster start: opposite side of map from players

PROGRESSION TIMELINE:
Hour 1: Player survives first round scared, learns map layout, discovers one puzzle solution, escapes with team
Hour 5: Player knows all monster patterns, solves puzzles fast, teaching new players, collecting cosmetics
Hour 20: Player on leaderboard for most escapes, owns all badges, grinding for secret rare cosmetics

MONETIZATION:
Gamepasses:
- Extended Battery: 149 Robux - flashlight lasts 6 minutes instead of 3, drains 50 percent slower
- Ghost Speak: 99 Robux - ghosts can send one message per round visible to living players
- VIP: 249 Robux - exclusive horror character skin, purple name, private server access
- Monster Pass: 399 Robux - once per server, player can become the monster for one round

DevProducts:
- Extra Life: 49 Robux - revive once per round if caught
- Clue Reveal: 29 Robux - highlights nearest unsolved puzzle objective on screen for 30 seconds
- Speed Boost Round: 19 Robux - 20 percent faster movement for current round

KEY SCRIPTS:
Script (ServerScriptService):
- MonsterAI.server.lua: PathfindingService per monster, raycast to each player, chase on sight, growl sound on detect
- RoundManager.server.lua: lobby countdown 30 seconds, teleport players, set round state, detect win/lose, end round
- PuzzleHandler.server.lua: tracks puzzle state per round, fires unlock RemoteEvent when all objectives complete
- ItemSpawner.server.lua: on round start, picks random positions from list, clones item models
- DataHandler.server.lua: saves wins, escapes, deaths, cosmetics, total rounds played

LocalScript:
- FlashlightHandler.client.lua: equips SpotLight tool on spawn, drains enabled property on timer, battery pickup refills
- AtmosphereHandler.client.lua: random creak sounds via SoundService, flickers local PointLights with math.random
- JumpscareHandler.client.lua: listens for Caught RemoteEvent, full-screen ImageLabel flash, plays jumpscare audio
- SanityEffect.client.lua: ColorCorrectionEffect in Lighting, adjusts Saturation and TintColor based on sanity value

DATASTORE SCHEMA:
{
  totalRounds: number,
  escapes: number,
  deaths: number,
  wins: number,
  ownedCosmetics: string[],
  activeSkin: string,
  gamepasses: { extendedBattery: bool, ghostSpeak: bool, vip: bool, monsterPass: bool }
}
`;

export const TEMPLATE_FIGHTING = `
GAME TYPE: Fighting (PvP Combat, Ranked)
TARGET SESSION: 30-60 minutes. Match-based with quick requeue.

CORE LOOP (every 30 seconds):
- Players in lobby queue for 1v1, 2v2, or FFA match
- Match starts in arena, 90-second timer or until one side eliminated
- Player combos: M1 light attack, Q block, E dodge roll, R heavy, F ability
- Landing attacks builds combo counter, combo above 5 enables finisher move
- Win match to earn ranked points (ELO), lose to lose points
- Rank up through Bronze, Silver, Gold, Platinum, Diamond, Mythic tiers
- Season resets every 30 days, top players get exclusive cosmetics

SYSTEMS NEEDED:
1. Combat System - hitbox via GetPartsInPart per swing, hitstun state prevents counterattack during stagger
2. Block System - Q hold activates shield, reduces damage 80 percent, 3-hit block break mechanic
3. Dodge System - E roll with 0.5 second iframe window, 3 second cooldown, rolls in movement direction
4. Combo System - tracks hit count server-side, combo decay if no hit within 2 seconds
5. Ability System - F key triggers class ability (fire blast, teleport dash, ground slam) with 8 second cooldown
6. Match Manager - queue pool, match creation with private server or reserved server, teleport matched players
7. ELO System - win adds 25 points, loss subtracts 20, streak bonus adds extra 5 per consecutive win
8. Spectator System - eliminated players watch match from fixed camera points, vote on winner style
9. Training Mode System - dummy NPC with HP bar, records your DPS and combo length for practice
10. Tournament System - weekly bracket, 8 or 16 players, single elimination, trophy cosmetic for winner

MAP LAYOUT (studs):
- Arena floor: 60 x 60 stud flat platform with low walls 6 studs high
- Arena variants: 4 different maps: Rooftop, Dojo, Volcano Rim, Space Station
- Out-of-bounds zone: 20 studs around arena, touching triggers ring-out death
- Lobby: 100 x 100 stud area, queue pads 10 x 10 each, dummy NPCs for practice
- Spectator stands: elevated ring around arena, 3 studs above floor level
- Tournament bracket: giant display board 40 x 20 stud screen showing bracket

PROGRESSION TIMELINE:
Hour 1: Player learns basic M1 combo, blocks a few attacks, wins first match, reaches Silver rank
Hour 5: Player mastering ability cancels, consistently hitting 10-hit combos, Platinum rank
Hour 20: Player Diamond or Mythic, in tournament brackets, known by name on server, grinding cosmetic rewards

MONETIZATION:
Gamepasses:
- VIP: 299 Robux - gold nameplate, exclusive skin, +5 ELO win bonus, VIP lounge access
- Fighting Style Pack: 199 Robux - 3 exclusive fighting stances with unique animation sets
- Emote Pack: 149 Robux - 5 exclusive battle emotes for win screen and lobby
- Private Arena: 499 Robux - reserve a private server for custom matches with friends

DevProducts:
- ELO Shield: 59 Robux - next loss does not deduct rank points (one use)
- Rank Reset: 79 Robux - reset ELO to 0 if you want a fresh start (resets rank but keeps cosmetics)
- XP Boost 1 Hour: 39 Robux - 2x season XP earned from matches for 60 minutes

KEY SCRIPTS:
Script (ServerScriptService):
- CombatHandler.server.lua: swing RemoteEvent, GetPartsInPart hitbox, Humanoid:TakeDamage, apply hitstun via BoolValue
- BlockHandler.server.lua: tracks block state per player, reduces incoming damage, breaks block on 3rd hit
- MatchManager.server.lua: maintains queue table, pairs players, teleports to arena, 90-second countdown, declares winner
- ELOHandler.server.lua: on match end, calculates ELO delta, updates player data, fires leaderboard update
- TournamentHandler.server.lua: bracket state machine, auto-advances winners, announces rounds via MessagingService

LocalScript:
- CombatInput.client.lua: M1 on click, Q hold block, E dodge, R heavy, F ability - all fire RemoteEvents to server
- ComboDisplay.client.lua: counter in center screen, scales up on each hit, fades on combo break
- ELODisplay.client.lua: shows ELO bar and rank icon in top corner, animates on rank-up with confetti
- ArenaCamera.client.lua: tighter FOV during match, shakes on receiving heavy hit

DATASTORE SCHEMA:
{
  elo: number,
  rank: string,
  wins: number,
  losses: number,
  winStreak: number,
  seasonElo: number,
  ownedSkins: string[],
  equippedSkin: string,
  tournamentWins: number,
  gamepasses: { vip: bool, stylePack: bool, emotePack: bool }
}
`;

export const TEMPLATE_SURVIVAL = `
GAME TYPE: Survival (Gather, Build, Defend)
TARGET SESSION: 60-180 minutes. Persistent world or server-based cycle.

CORE LOOP (every 30 seconds):
- Player chops trees, mines rocks, or hunts animals to gather resources
- Resources convert to materials: Wood, Stone, Iron, Food
- Build walls, floors, and roofs by placing gridded Parts using a build tool
- Hunger and thirst bars drain over time, eat food to refill
- Night cycle triggers enemy spawns (zombies, wolves) that attack player base
- Survive until morning, repeat cycle, expand base, craft better tools and weapons
- Optional: team with others, raid other bases, become server dominant faction

SYSTEMS NEEDED:
1. Resource Gathering System - .Touched or ClickDetector on trees/rocks, increments resource count, plays chop animation
2. Build System - client-side grid preview Part follows mouse raycast, click places via RemoteEvent, server validates
3. Hunger/Thirst System - DecreaseHunger loop every 10 seconds, Humanoid health drain below 20 hunger
4. Crafting System - recipe table, check player has required resources, remove resources and grant item
5. Day/Night Cycle System - workspace.ClockTime tween over 600 seconds per full cycle, ambient light changes
6. Enemy Spawn System - on ClockTime > 18 (night), spawn zombie/wolf NPCs near player bases using PathfindingService
7. Base Ownership System - placed structures tagged with PlacedBy attribute, only owner or ally can remove
8. Alliance System - two players agree to ally, share map markers, cannot damage each other
9. Loot Chest System - random chests spawn at dawn, contain rare resources and crafted items
10. Respawn System - player dies, respawns at their bed if placed, otherwise at map spawn with basic gear

MAP LAYOUT (studs):
- World size: 1000 x 1000 studs open terrain
- Biomes: Forest (northwest), Desert (southeast), Mountain (northeast), Swamp (southwest)
- Forest: dense trees 8-16 studs tall, spaced 12 studs apart
- Mountain: elevated terrain 40-80 studs high, iron ore veins on rock faces
- River: 10-stud wide water strip crossing center of map, fishing spots
- Starting zone: cleared 100 x 100 area in center with basic resource nodes

PROGRESSION TIMELINE:
Hour 1: Player gathers wood and stone, builds small 3-room base, survives first night with basic tools
Hour 5: Player has iron gear, medium base with 10 rooms, farm plot, ally formed, raiding weaker bases
Hour 20: Player running faction of 4, fortified base, endgame boss defeated, crafting legendary weapons

MONETIZATION:
Gamepasses:
- VIP Starter Kit: 299 Robux - spawn with iron tools and 200 of each resource every server
- Builder Pro: 199 Robux - 2x build speed, snap grid size options (1/2/4 stud), undo last 5 placements
- Infinite Hunger: 149 Robux - hunger and thirst never drop below 50 percent
- Private Server: 999 Robux - personal server, set day cycle speed, invite-only

DevProducts:
- Resource Pack: 49 Robux - 500 of each basic resource (Wood, Stone, Iron, Food)
- Base Shield 1 Hour: 79 Robux - structures cannot be damaged for 60 minutes
- Full Heal: 19 Robux - instant max health and hunger restore
- Skip Night: 29 Robux - if majority votes agree (or purchaser uses it), immediately advance to dawn

KEY SCRIPTS:
Script (ServerScriptService):
- GatherHandler.server.lua: ClickDetector.MouseClick per resource node, grants items, plays particle, respawns node after 60s
- BuildHandler.server.lua: PlacePart RemoteEvent, validates grid position, checks no overlap, parents Part with owner tag
- HungerHandler.server.lua: per-player loop every 10 seconds, decrements hunger value, applies damage if starving
- DayNightHandler.server.lua: TweenService on workspace.ClockTime, 600 second day, 200 second night, broadcasts state
- EnemySpawner.server.lua: on night state, spawns zombie models near each active base using random offset, PathfindingService
- CraftingHandler.server.lua: receives craft RemoteEvent with recipe ID, validates resources, removes and grants item

LocalScript:
- BuildPreview.client.lua: raycast from mouse to terrain, snaps preview Part to grid, shows red if blocked, green if valid
- HungerUI.client.lua: updates hunger and thirst bars in bottom-left corner, flashes red below 25 percent
- DayCycleUI.client.lua: shows sun/moon icon and time of day, warns 30 seconds before night
- ResourceUI.client.lua: resource counts in corner of screen, animates on collection

DATASTORE SCHEMA:
{
  hunger: number,
  thirst: number,
  resources: { wood: number, stone: number, iron: number, food: number },
  inventory: [ { itemId: string, quantity: number } ],
  equippedTool: string,
  baseParts: [ { position: Vector3, size: Vector3, material: string } ],
  allies: string[],
  kills: number,
  daysAlived: number
}
`;

export const TEMPLATE_RACING = `
GAME TYPE: Racing (Vehicles, Tracks, Upgrades)
TARGET SESSION: 30-60 minutes. Race-per-race with quick requeue.

CORE LOOP (every 30 seconds):
- Player selects car from garage (own or rent)
- Join race lobby, vote on track, countdown 3-2-1 go
- Race along marked track with checkpoints, 3 laps
- Collect boost pads on track for temporary speed burst
- First to cross finish all 3 laps wins coins and XP
- Use coins to upgrade car engine, tires, turbo, body
- Unlock new cars as XP level increases

SYSTEMS NEEDED:
1. Vehicle System - VehicleSeat-based car model, client-side input fires server-side force application, realistic handling
2. Checkpoint System - invisible Part checkpoints in order, player must hit each one per lap, detects wrong-way driving
3. Lap Counter System - tracks lap count per player, fires finish event on lap 3 checkpoint cross
4. Boost Pad System - glowing flat Parts on track, .Touched adds temporary BodyVelocity boost for 2 seconds
5. Race Manager System - lobby queue, countdown, spawn positions, lap tracking, finish order, rewards
6. Upgrade System - engine (top speed), tires (handling/grip), turbo (boost pad strength), nitro (manual boost charge)
7. Garage System - owned cars list, preview car on turntable, apply purchased upgrades
8. Track Selector System - vote system pre-race, random tiebreak, loads track module on selection
9. Drift System - tap brake while turning for drift, drift builds nitro meter, release for burst speed
10. Replay System - after finish, 30-second replay of player best lap shown (record via RunService position log)

MAP LAYOUT (studs):
- Race tracks: 3-5 different tracks, each 1200-2000 studs total circuit length
- Track width: 20-24 studs wide, enough for 4 cars side by side
- Track surface: smooth flat Parts or terrain, distinct color per track theme (asphalt grey, dirt brown, ice blue)
- Boost pads: spaced every 200 studs on straight sections, 8 x 8 stud glowing platforms
- Spectator zone: 40 stud wide viewing area along main straight
- Lobby garage: 200 x 100 stud building, car display pedestals, upgrade stations, queue pads
- Car spawn line: 4 or 8 positions staggered 8 studs apart at race start

PROGRESSION TIMELINE:
Hour 1: Player races with starter car, wins first race, buys engine level 2, sees visible speed improvement
Hour 5: Player has 3 cars, max tier-2 upgrades, in top 5 consistently, unlocked drift mechanic car skin
Hour 20: Player has legendary car, max all upgrades, setting track records, winning tournament brackets

MONETIZATION:
Gamepasses:
- VIP Car Pack: 399 Robux - 3 exclusive VIP-only cars with better base stats than earnable cars
- Unlimited Nitro: 249 Robux - nitro meter recharges 2x faster, starts every race at 50 percent
- Garage Expansion: 149 Robux - hold 10 cars instead of default 3
- Track Creator: 599 Robux - access to track builder tool, publish track for others to vote on

DevProducts:
- Coin Boost 1 Hour: 39 Robux - 3x coins from race results for 60 minutes
- Full Upgrade: 149 Robux - instantly max all upgrades on one selected car
- Exclusive Paint Job: 29 Robux - one premium color option for selected car
- Race Entry Skip: 19 Robux - skip race queue, join next race immediately

KEY SCRIPTS:
Script (ServerScriptService):
- VehicleHandler.server.lua: assigns VehicleSeat to player, applies motor forces based on client input RemoteEvent
- CheckpointHandler.server.lua: .Touched per ordered checkpoint, validates sequence, increments lap on finish line
- RaceManager.server.lua: lobby countdown, teleports players to grid, watches lap counters, awards coins and XP on finish
- BoostPadHandler.server.lua: .Touched on boost pads, fires RemoteEvent to client for visual, applies BodyVelocity on server
- UpgradeHandler.server.lua: validates coin cost, updates upgrade table in player data, adjusts car stats via BodyThrust values

LocalScript:
- VehicleInput.client.lua: UserInputService WASD or mobile joystick, fires RemoteEvent with throttle/steer/brake values
- NitroUI.client.lua: nitro bar display, flashes on boost, depletes on use, recharges when drifting
- RaceUI.client.lua: lap counter, position (1st/2nd/3rd), race timer, mini-map with car dots
- SpeedometerUI.client.lua: analog dial or numeric display of current speed in studs per second

DATASTORE SCHEMA:
{
  coins: number,
  xp: number,
  level: number,
  ownedCars: string[],
  selectedCar: string,
  upgrades: { carId: { engine: number, tires: number, turbo: number, nitro: number } },
  wins: number,
  races: number,
  bestLapTimes: { trackId: number },
  gamepasses: { vipPack: bool, unlimitedNitro: bool, expansion: bool }
}
`;

export const TEMPLATE_TD = `
GAME TYPE: Tower Defense (Place Towers, Survive Waves)
TARGET SESSION: 30-60 minutes per game. Strategic, escalating tension.

CORE LOOP (every 30 seconds):
- Enemies follow a fixed path from spawn to base
- Player places towers alongside the path using earned coins
- Towers auto-attack nearest enemy in range, dealing damage per second
- Killing enemies drops coins for more tower purchases
- Survive wave, earn bonus coins, upgrade towers between waves
- Each wave escalates: more enemies, faster move speed, higher HP
- Boss waves every 5 rounds: one giant enemy with special ability
- If enemies reach base, lose HP; base HP hits 0 = game over

SYSTEMS NEEDED:
1. Enemy Pathing System - enemies follow waypoint list using TweenService or BodyPosition along CFrame path
2. Tower Placement System - client-side grid preview, snap to placement zone Parts, RemoteEvent to server to place
3. Tower Attack System - per tower using task.spawn loop, FindPartsInRadius or GetPartsInPart to find nearest enemy
4. Wave Spawner System - wave table defines enemy type, count, delay between spawns, boss every 5th wave
5. Economy System - coins per kill based on enemy type, wave completion bonus, starting coins
6. Tower Upgrade System - 3 upgrade tiers per tower, each increases damage, range, or attack speed
7. Tower Sell System - sell tower for 60 percent of total investment, refunds to player coins
8. Base HP System - IntValue in workspace, enemy reaching final waypoint damages it, 0 triggers game over
9. Status Effect System - slow towers (ice, mud), stun towers (lightning), poison towers (damage over time)
10. Multiplayer System - multiple players share economy, all can place towers, combined defense effort

MAP LAYOUT (studs):
- Path width: 10 studs, clearly colored (gray asphalt or dirt)
- Path length: 600-1200 studs total, 4-8 turns
- Placement zones: grass areas beside path, 8 x 8 stud grid cells, highlighted green
- Base structure: 30 x 30 stud castle/tower at path end with HP billboard
- Enemy spawn: glowing red portal 20 x 20 studs at path start
- UI display areas: screen overlays only, no world-space UI beyond enemy HP bars
- Tower preview area: 60 x 20 stud shop panel shows all purchasable towers

PROGRESSION TIMELINE:
Hour 1: Player learns basic tower placement, survives to wave 15, discovers ice+cannon combo, loses on wave 20 boss
Hour 5: Player consistently reaching wave 30-40, strategically placing upgrade paths, winning with friends
Hour 20: Player completing all 50 waves, attempting hardcore mode, min-maxing DPS per coin spent

MONETIZATION:
Gamepasses:
- Bonus Starting Coins: 199 Robux - start every game with 500 extra coins
- Premium Tower Pack: 349 Robux - access to 3 exclusive towers (Railgun, Freeze Cannon, Nuke Tower)
- Faster Waves: 99 Robux - force next wave early with a button, earn 1.5x coins for early start
- VIP: 249 Robux - gold nametag, 10 percent coin bonus per kill, exclusive tower skin for all towers

DevProducts:
- Emergency Coins: 49 Robux - instant 300 coins during a match
- Skip Wave: 79 Robux - skip current wave, receive half wave completion bonus
- Mega Upgrade: 99 Robux - instantly fully upgrade one selected tower for free

KEY SCRIPTS:
Script (ServerScriptService):
- WaveSpawner.server.lua: reads wave table, clones enemy models at spawn, applies WalkSpeed per enemy type
- EnemyPathing.server.lua: each enemy task.spawn, TweenService waypoint loop, on final waypoint damages BaseHP
- TowerHandler.server.lua: receives PlaceTower RemoteEvent, validates position, clones tower model, starts attack loop
- TowerAttack.server.lua: per tower loop, GetPartsInRadius, finds enemy with lowest remaining HP, deals damage per second
- EconomyHandler.server.lua: on enemy death, fires CoinReward RemoteEvent to all players, tracks shared coin pool
- WaveManager.server.lua: tracks wave number, spawns wave on countdown, detects wave clear, awards bonus coins

LocalScript:
- TowerPlacement.client.lua: mouse raycast to placement zone, shows preview model, green/red validity, click fires RemoteEvent
- WaveUI.client.lua: wave counter top center, timer to next wave, enemy count remaining in current wave
- TowerShopUI.client.lua: bottom panel with tower cards, cost display, selected tower follows cursor for placement
- BaseHPUI.client.lua: displays base HP as segmented bar at top of screen, shakes screen on base taking damage

DATASTORE SCHEMA:
{
  totalWins: number,
  highestWave: number,
  totalKills: number,
  coinsEarned: number,
  ownedTowerSkins: string[],
  activeSkin: string,
  gamepasses: { bonusCoins: bool, premiumPack: bool, fasterWaves: bool, vip: bool }
}
`;

export const TEMPLATE_SOCIAL = `
GAME TYPE: Social / Roleplay (Jobs, Houses, Vehicles)
TARGET SESSION: 60-240 minutes. Hangout game, players create their own fun.

CORE LOOP (every 30 seconds):
- Player walks around town interacting with NPCs and players
- Get a job: Barista, Police, Doctor, Teacher, Chef, Banker
- Work job by completing mini-tasks at job location (pressing prompts, serving items)
- Earn money per task completed
- Spend money on housing upgrades, vehicles, clothing, furniture
- Visit other players houses, hang out in shops, drive around town
- Social interactions: waving, sitting, emotes, chat bubbles

SYSTEMS NEEDED:
1. Job System - player takes job at NPC stand, mini-task loop fires ProximityPrompts, pays per completion
2. House System - each player owns a plot, places furniture using build mode, decorates interior and exterior
3. Vehicle System - purchase vehicles, park at home, drive around town with client-side input
4. Economy System - money currency stored per player, shops deduct money, jobs add money
5. Furniture Placement System - select item from catalog, drag with mouse using PVInstance:PivotTo, save positions
6. Clothing Store System - buy shirts, pants, hats using in-game money, applies to character via HumanoidDescription
7. Social Emote System - emote wheel (E key), 8+ animations selectable, plays AnimationTrack
8. Day/Night Cycle System - town ambiance changes, some jobs only available at night (security guard, DJ)
9. Housing Plot System - each player gets assigned plot on join, persists between sessions, visitors allowed
10. Leaderboard System - richest players, most hours worked, most visitors displayed on town hall board

MAP LAYOUT (studs):
- Town size: 800 x 800 studs
- Main street: 500 studs long, 30 studs wide, shops on both sides
- Town square: 100 x 100 stud center plaza with fountain, benches, trees
- Job buildings: 40 x 40 stud each, positioned around main street (cafe, hospital, police station, school)
- Housing district: 300 x 300 area, plots 30 x 30 studs each, up to 20 plots per server
- Vehicle road: 12-stud wide roads connecting all areas, roundabout at center
- Park: 80 x 80 stud green zone with benches and gazebo
- Car lot: 60 x 40 stud vehicle dealership building

PROGRESSION TIMELINE:
Hour 1: Player explores town, picks first job, earns $200, buys starter furniture for house, decorates one room
Hour 5: Player has fully decorated 3-room house, owns a car, working high-tier job, well-known on server
Hour 20: Player has premium house plot with custom exterior, rare vehicle collection, running in-game business events

MONETIZATION:
Gamepasses:
- VIP House: 399 Robux - larger 50 x 50 plot, exclusive house exterior skins, more furniture slots
- Premium Vehicle Pack: 299 Robux - 5 exclusive vehicles not available in in-game store (sports car, yacht, helicopter)
- Infinite Furniture: 199 Robux - remove furniture slot cap (default 50 items), add 10 extra furniture types
- Job Bonus: 149 Robux - earn 2x money from all jobs permanently
- Emote Pack Pro: 99 Robux - 10 additional premium emotes (dance styles, reactions, poses)

DevProducts:
- Money Bundle Small: 25 Robux - $1000 in-game cash
- Money Bundle Large: 99 Robux - $5000 in-game cash
- House Reset: 49 Robux - clears all furniture from house for clean slate
- VIP Name Color: 29 Robux - choose custom chat name color for current session

KEY SCRIPTS:
Script (ServerScriptService):
- JobHandler.server.lua: assigns player to job, ProximityPrompt.Triggered per task, grants money, limits one job at a time
- HouseHandler.server.lua: assigns plot on join, saves and loads furniture positions via DataStore
- FurnitureHandler.server.lua: receives PlaceFurniture RemoteEvent, validates player owns item and has slot, parents model to plot
- VehicleHandler.server.lua: assigns vehicle seat, server-side physics via BodyVelocity, despawns on player leave
- EconomyHandler.server.lua: centralized money add/subtract, validates all purchases server-side before granting items

LocalScript:
- FurniturePlacement.client.lua: drag mode when item selected, raycast to floor, preview Part tinted green/red, click to place
- EmoteWheel.client.lua: E key opens radial menu, mouse hover selects emote, click plays AnimationTrack on character
- VehicleInput.client.lua: WASD for vehicle, fires throttle/steer to server via RemoteEvent
- MoneyUI.client.lua: top-right money display, animates count-up when money added, shows transaction popup

DATASTORE SCHEMA:
{
  money: number,
  totalEarned: number,
  job: string,
  houseItems: [ { itemId: string, position: Vector3, rotation: Vector3, color: string } ],
  ownedVehicles: string[],
  ownedClothing: string[],
  equippedOutfit: { shirt: string, pants: string, hat: string },
  activeEmotes: string[],
  gamepasses: { vipHouse: bool, premiumVehicles: bool, jobBonus: bool, emotePro: bool },
  totalHoursPlayed: number,
  visitors: number
}
`;

export const GAME_TEMPLATES_EXPANDED: Record<string, string> = {
  tycoon: TEMPLATE_TYCOON,
  simulator: TEMPLATE_SIMULATOR,
  rpg: TEMPLATE_RPG,
  obby: TEMPLATE_OBBY,
  horror: TEMPLATE_HORROR,
  fighting: TEMPLATE_FIGHTING,
  survival: TEMPLATE_SURVIVAL,
  racing: TEMPLATE_RACING,
  td: TEMPLATE_TD,
  social: TEMPLATE_SOCIAL,
};

export function getGameTemplate(type: string): string {
  const key = type.toLowerCase().replace(/[^a-z]/g, "");
  const aliases: Record<string, string> = {
    dropper: "tycoon",
    factory: "tycoon",
    pet: "simulator",
    petsim: "simulator",
    pets: "simulator",
    adventure: "rpg",
    quest: "rpg",
    obstacle: "obby",
    parkour: "obby",
    jumpscare: "horror",
    scary: "horror",
    pvp: "fighting",
    combat: "fighting",
    battle: "fighting",
    gather: "survival",
    craft: "survival",
    crafting: "survival",
    kart: "racing",
    drive: "racing",
    car: "racing",
    towerdefense: "td",
    waves: "td",
    defend: "td",
    roleplay: "social",
    rp: "social",
    hangout: "social",
    town: "social",
    city: "social",
  };
  const resolved = aliases[key] || key;
  return GAME_TEMPLATES_EXPANDED[resolved] || "";
}
