/**
 * Game presets — full blueprint prompts for each Roblox genre.
 *
 * These are NOT conversational prompts. They are detailed game
 * specifications that tell the AI exactly what parts, scripts,
 * leaderstats, RemoteEvents, and behaviours to generate in a single
 * Luau block so the result is a COMPLETE playable game, not a random
 * collection of parts.
 *
 * Structure per preset:
 *   - id         — stable identifier, used by analytics
 *   - label      — human-friendly name shown on the card
 *   - icon       — emoji for the card
 *   - tagline    — one-line marketing hook shown below the label
 *   - prompt     — the full game blueprint sent to the AI
 *
 * The prompts intentionally include:
 *   - World geometry (specific part sizes, materials, colors, layouts)
 *   - Script breakdown (ServerScripts and LocalScripts with filenames)
 *   - Leaderstats schema (IntValues / StringValues)
 *   - Event wiring (ClickDetectors, ProximityPrompts, RemoteEvents)
 *   - Progression mechanics (upgrades, rebirths, waves, levels)
 *   - UI elements (ScreenGuis, BillboardGuis, SurfaceGuis)
 *   - Tagging and anchoring rules
 *   - Fail-safe constraints (pcall DataStore, anchor static parts)
 *
 * Each prompt ends with an explicit "return ONE Luau block" instruction
 * so the chat streaming path gets a single code block it can extract
 * via the existing extractLuauCode / extractCodeFromResponse helpers.
 */

export interface GamePreset {
  id: string
  label: string
  icon: string
  tagline: string
  prompt: string
}

/**
 * Shared suffix appended to every preset. Keeps the "output shape" rules
 * consistent so the agentic loop's fix iteration has a stable contract.
 */
const COMMON_RULES = `

## Required constraints (always)
- Return ONE Luau code block that creates everything when executed ONCE in Studio.
- Use Instance.new for all parts and scripts, set the .Source on every Instance.new("Script") / Instance.new("LocalScript") / Instance.new("ModuleScript").
- ServerScripts go in ServerScriptService. LocalScripts go in StarterPlayerScripts or StarterGui as appropriate.
- Every created part MUST be tagged via game:GetService("CollectionService"):AddTag(part, "fj_generated").
- Anchor ALL static parts (Anchored=true). Never rely on physics simulation unless the mechanic requires it.
- Wrap any DataStore calls in pcall and leave persistence as a warn("[ForjeAI] DataStore persistence TODO").
- Do NOT return markdown fences. Do NOT explain. Return ONLY the Luau code.`

// ---------------------------------------------------------------------------
// Primary genres (shown first in onboarding)
// ---------------------------------------------------------------------------

export const PRIMARY_PRESETS: GamePreset[] = [
  {
    id: 'simulator',
    label: 'Simulator',
    icon: '🎮',
    tagline: 'Mine → upgrade → rebirth. The #1 Roblox genre.',
    prompt: `Build a COMPLETE working Roblox mining simulator in one Luau block.

## World (create via Instance.new, all anchored, tagged fj_generated)
- Floating 60x60 stud Concrete platform at y=50 (grey)
- Giant cyan crystal rock in the center: 10-stud Part with SpecialMesh Diamond shape and ClickDetector
- Wooden Shop hut 20 studs north of the rock (12x10x12 wooden parts) with a ProximityPrompt "Buy Upgrades"
- 5 glowing pedestal parts around the rock (one per pickaxe level)
- Set Lighting: ClockTime=14, Brightness=2, Ambient=(120,100,60) for a gold skybox feel

## Leaderstats (ServerScript "LeaderstatsSetup" in ServerScriptService)
- On PlayerAdded, create Folder "leaderstats" with IntValues: Coins, PickaxeLevel, Rebirths

## Scripts to create
1. **MainMiner** (ServerScript) — ClickDetector.MouseClick on the crystal awards coins = (1 + PickaxeLevel.Value) * (2^Rebirths.Value). Plays a click sound.
2. **ShopHandler** (ServerScript) — ProximityPrompt.Triggered checks player Coins and price table (Wood=10, Stone=100, Iron=1000, Gold=10000, Diamond=100000), deducts on success, increments PickaxeLevel (max 5), fires BillboardGui "Level Up!" for 2 seconds.
3. **RebirthHandler** (ServerScript) — Second ProximityPrompt on the shop, enabled only when Coins >= 10000, resets Coins to 0 and PickaxeLevel to 0, increments Rebirths by 1 (permanent 2x coin multiplier).
4. **HUDClient** (LocalScript in StarterPlayerScripts) — ScreenGui with a top-right TextLabel showing "⛏ Coins: X | Rebirth: Y" updating from leaderstats.

## Player experience
On join → sees coin counter at 0 → clicks crystal → earns 1 coin → visits shop → buys Stone pickaxe (10 coins) → clicks faster → reaches 10K → rebirths for permanent multiplier.${COMMON_RULES}`,
  },
  {
    id: 'tycoon',
    label: 'Tycoon',
    icon: '💰',
    tagline: 'Droppers → conveyors → upgrades. Classic Roblox.',
    prompt: `Build a COMPLETE working Roblox tycoon with the full drop→collect→upgrade loop in one Luau block.

## World (all anchored, tagged fj_generated)
- 50x50 stud concrete Base pad with a glowing green "Claim Base" ProximityPrompt in the center
- Dropper structure: metal pipe 15 studs north of the pad, dropping small colored cash Parts every 1.5 seconds
- Conveyor belt (4 flat grey Parts with TextureId scrolling) leading from dropper to a yellow Collector pad
- Three upgrade button pedestals (cyan glowing parts) around the base:
  * "+$1 per drop" (cost: $50)
  * "Faster droppers" (cost: $200, halves interval)
  * "Double value" (cost: $500, doubles drop value)
- A wall with a ProximityPrompt "Unlock 2nd Dropper — $1000" that removes the wall on purchase
- Set Lighting ClockTime=12, Brightness=1.5

## Leaderstats (ServerScript "LeaderstatsSetup")
- On PlayerAdded: Folder "leaderstats" with IntValue "Money"

## Scripts to create
1. **OwnershipHandler** (ServerScript) — ProximityPrompt.Triggered sets a StringValue "Owner" attribute on the tycoon model, hides the claim prompt, enables the dropper loop for this player only.
2. **DropperLoop** (ServerScript) — while loop: every 1.5s (or shorter after upgrade) spawn a small 1x1x1 cash Part at dropper position with attribute Value and Owner, give it gravity+velocity so it rolls down the conveyor.
3. **CollectorTouch** (ServerScript) — Part.Touched on the Collector pad: if touched by a cash part with matching Owner, add Value to that player's Money leaderstat, destroy the cash, play ding sound.
4. **UpgradeButtons** (ServerScript) — ProximityPrompt.Triggered on each pedestal: deduct cost from Money, apply upgrade (increment DropValue attribute / halve DropInterval / set DoubleValue flag), destroy the pedestal.
5. **HUDClient** (LocalScript) — ScreenGui top-right "💰 Money: X" updating from leaderstats.

## Player experience
Join → claim base → watch droppers produce cash → buy upgrades → unlock second dropper → scale money exponentially.${COMMON_RULES}`,
  },
  {
    id: 'obby',
    label: 'Obby',
    icon: '🧗',
    tagline: '20 stages, checkpoints, leaderboard.',
    prompt: `Build a COMPLETE Roblox obby with 20 stages, checkpoints, kill bricks, and a leaderboard in one Luau block.

## World (all anchored, tagged fj_generated)
- 20 rectangular concrete stage platforms in a line along +Z axis, each 15x1x15 studs, spaced 30 studs apart
- **Stages 1-5**: Simple jumps. Gaps of 4-6 studs between platforms, narrow beam variations.
- **Stages 6-10**: Red kill bricks scattered as obstacles — Touched kills the player.
- **Stages 11-15**: Moving grey platforms — TweenService cycles position left-right on X axis over 3 sec.
- **Stages 16-20**: Narrow 2-stud beams over a lava floor. The lava Part slowly rises (TweenService Y from -5 to +0 over 60 sec), forcing players to move fast.
- Each stage has a **gold Checkpoint Part** with a ProximityPrompt "Save Checkpoint"
- Spawn location at stage 0 entry
- Sign at stage 0 with SurfaceGui showing leaderboard top 5

## Leaderstats (ServerScript "LeaderstatsSetup")
- Folder "leaderstats" with IntValue "Stage"

## Scripts to create
1. **CheckpointHandler** (ServerScript) — ProximityPrompt.Triggered stores the player's current stage (looks up the checkpoint's Parent stage index), updates Stage leaderstat, sets player.RespawnLocation to that stage's spawn Part.
2. **KillBrick** (ServerScript) — on each red kill brick, Touched resets Humanoid.Health to 0 with "[Obby] Lava!" hint.
3. **MovingPlatform** (ServerScript) — TweenService loop on stages 11-15 cycling position left-right over 3 sec.
4. **LavaRiser** (ServerScript) — TweenService Lighting-wide lava Y position from -5 to 0 over 60 sec, loops back.
5. **LeaderboardUpdater** (ServerScript) — every 2 sec, query all players, sort by Stage value descending, update the SurfaceGui with top 5 names + stages.

## Player experience
Spawn at stage 0 → jump through stages → hit checkpoints for progress → climb leaderboard.${COMMON_RULES}`,
  },
  {
    id: 'tower_defense',
    label: 'Tower Defense',
    icon: '🏹',
    tagline: '10 waves, 4 towers, base to defend.',
    prompt: `Build a COMPLETE Roblox tower defense game with 10 waves, buildable towers, and a base to defend in one Luau block.

## World (all anchored, tagged fj_generated)
- 120x120 stud grass field, lit with Lighting ClockTime=10 for daylight
- A curved brown path (made of 10 Path parts) from one edge (enemy spawn) to the player Base on the opposite edge
- Player Base: blue 10x10x10 Part with attribute "BaseHP"=100 and a BillboardGui showing "BASE: 100 HP"
- 4 buildable tower slots (cyan 6x6x1 pads) alongside the path, each with a ProximityPrompt "Buy Tower"
- A start button Part near the base with ProximityPrompt "Start Next Wave"
- SurfaceGui on a sign showing "Wave X / 10 | Lives: Y | Money: $Z"

## Leaderstats (ServerScript "LeaderstatsSetup")
- Folder "leaderstats" with IntValues: Money (starts 200), Wave (starts 0), Lives (starts 20)

## Scripts to create
1. **WaveSpawner** (ServerScript) — on start button triggered, increment Wave leaderstat, spawn (Wave+2) red enemy humanoid models at the path start, each enemy has 10*Wave HP. Wait 4 seconds between enemies, 10 seconds between waves.
2. **EnemyPath** (ServerScript) — on each spawned enemy, sequentially MoveTo each path waypoint in order. On reaching the final waypoint, subtract 1 from Lives leaderstat and Destroy() the enemy. Play alarm sound if Lives reaches 0.
3. **TowerShop** (ServerScript) — ProximityPrompt on each tower slot offers three options (Basic Tower $50 / Fast Tower $150 / Cannon Tower $300). On purchase, deduct from Money, spawn a tower Part on the slot with attributes Damage, FireRate, Range.
4. **TowerCombat** (ServerScript) — Heartbeat loop: each tower scans workspace for the nearest tagged enemy within Range, decrements enemy Humanoid.Health by Damage every 1/FireRate seconds, plays tower-specific shoot sound.
5. **EnemyReward** (ServerScript) — on Humanoid.Died for any tagged enemy, award killer Money += 10 * Wave.
6. **HUDClient** (LocalScript) — update the wave/lives/money SurfaceGui from leaderstats every Heartbeat.

## Player experience
Spawn → buy first tower → start wave 1 → earn money from kills → buy more towers → survive to wave 10.${COMMON_RULES}`,
  },
  {
    id: 'rpg',
    label: 'RPG',
    icon: '⚔️',
    tagline: 'Quests, NPCs, combat, loot drops.',
    prompt: `Build a COMPLETE Roblox RPG with quests, NPCs, combat, and gear drops in one Luau block.

## World (all anchored, tagged fj_generated)
- 200x200 stud grass plain with: a starter village of 5 wooden huts, a shop sign Part, an NPC quest-giver Humanoid (wood-colored body) near the village center
- A cave entrance to the north (dark rock arch Parts)
- 3 skeleton enemy spawn zones marked with red circle Parts on the ground (around the cave)
- A central plaza with a bronze statue (decorative anchor point)
- Lighting ClockTime=15 for golden afternoon

## Leaderstats (ServerScript "LeaderstatsSetup")
- Folder "leaderstats" with IntValues: XP, Gold, Level (starts at 1)

## Scripts to create
1. **QuestGiver** (ServerScript) — ProximityPrompt "Accept Quest" sets player attribute CurrentQuest="slay5skeletons" and attribute QuestProgress=0. Shows a BillboardGui above NPC with "Slay 5 skeletons — 100 XP, 50 Gold".
2. **EnemySpawner** (ServerScript) — every 10 seconds, spawn a skeleton at each spawn zone: grey 5-stud Humanoid model with 50 HP, tagged "enemy", given a sword Tool in its hand.
3. **CombatScript** (ServerScript) — on a Player's character Touched with an enemy, if player has a sword Tool equipped and attacking, damage enemy Humanoid by 15. On enemy death award killer XP+=20, Gold+=10, and if CurrentQuest=="slay5skeletons" increment QuestProgress.
4. **QuestCompletion** (ServerScript) — when QuestProgress >= 5, award 100 XP and 50 Gold, clear CurrentQuest, show BillboardGui "Quest Complete!" for 3 sec.
5. **LevelUp** (ServerScript) — on XP >= Level*100, increment Level, reset XP to 0, heal player to max HP, play level-up sound, show SurfaceGui "LEVEL UP!" for 2 sec.
6. **ShopHandler** (ServerScript) — ProximityPrompt on the shop sign offers "Iron Sword — $50". On purchase deduct Gold, give Tool "IronSword" to player Backpack.
7. **HUDClient** (LocalScript) — ScreenGui showing XP/Level/Gold with a progress bar for XP to next level.

## Player experience
Spawn → talk to NPC → accept quest → hunt skeletons in the cave → level up → buy sword → repeat.${COMMON_RULES}`,
  },
  {
    id: 'horror',
    label: 'Horror',
    icon: '😱',
    tagline: 'Dark house, jump scares, find the key.',
    prompt: `Build a COMPLETE Roblox horror game with a dark atmospheric house, jump scares, and an escape objective in one Luau block.

## World (all anchored, tagged fj_generated)
- 120x80 stud dark haunted house with 4 connected rooms (Wood material walls, dark grey floor, black ceiling)
- Dim Lighting: Brightness=0.3, Ambient=(30,30,40), FogEnd=50, ClockTime=0 (night), FogColor=(20,20,30)
- Flickering lamps: 4 lamp Parts with PointLights, TweenService cycles Brightness 0.5→0→0.5 every 0.8 sec
- Locked front door: red Part at the exit with SurfaceGui "EXIT — Find the Key"
- A golden Key Part hidden in the 4th (back) room, under a table
- Ambient sound: looping low heartbeat from SoundService

## Leaderstats (ServerScript "LeaderstatsSetup")
- Folder "leaderstats" with BoolValue "Escaped"

## Scripts to create
1. **KeyPickup** (ServerScript) — on the Key Part, ClickDetector.MouseClick sets the clicking player's attribute "HasKey"=true, plays pickup sound, destroys the key, shows BillboardGui above player "You found the key!" for 2 sec.
2. **DoorUnlock** (ServerScript) — ProximityPrompt on the exit door: checks if player's HasKey=true. On success, plays creaking door sound, TweenService swings door open 90°, teleports player to a green-lit "YOU ESCAPED" victory room with SurfaceGui, sets Escaped=true.
3. **JumpscareTrigger1** (ServerScript) — invisible Part in hallway, Touched spawns a white skeleton Humanoid model 8 studs in front of the player with a loud scream Sound, destroys the skeleton after 2 sec.
4. **JumpscareTrigger2** (ServerScript) — another invisible Part in room 3, Touched darkens Lighting.Brightness to 0 for 1 sec then restores, plays bang sound.
5. **MonsterPatrol** (ServerScript) — a slow-moving dark-grey zombie Humanoid wandering the hallway via Humanoid:MoveTo to random points. On Touched with a player, subtract 25 from player Humanoid.Health, play attack growl sound.
6. **AmbientSound** (ServerScript) — looping heartbeat Sound on SoundService, playback volume spikes when player is near the monster.

## Player experience
Spawn in dim entry → explore 4 rooms → jumpscares increase tension → find hidden key → unlock exit → escape to victory room.${COMMON_RULES}`,
  },
]

// ---------------------------------------------------------------------------
// Secondary genres (behind "Explore more" — shorter prompts but still complete)
// ---------------------------------------------------------------------------

export const SECONDARY_PRESETS: GamePreset[] = [
  {
    id: 'racing',
    label: 'Racing',
    icon: '🏎️',
    tagline: 'Tracks, cars, lap timer, power-ups.',
    prompt: `Build a COMPLETE Roblox racing game in one Luau block.

## World
- Closed-loop 3-lap track: start/finish line, 4 banked curves, 2 straights, finish arch
- Grass border Parts around the track
- 3 selectable car models in a spawn area (differently-colored 6-stud chassis with 4 wheel Parts + VehicleSeat)
- 3 yellow boost-pad Parts on the track straights
- Lighting ClockTime=12

## Scripts
1. **CarSelector** (ServerScript) — ProximityPrompt on each car welds player to its VehicleSeat.
2. **LapTracker** (ServerScript) — 3 invisible checkpoint zones around the track must be hit in order. After 3 full laps, broadcast "Winner: <name>" via BillboardGui.
3. **BoostPad** (ServerScript) — Part.Touched on boost pads adds a short VectorForce to the touching car.
4. **LeaderstatsSetup** — IntValues BestLapTime, Laps.${COMMON_RULES}`,
  },
  {
    id: 'fighting',
    label: 'Fighting',
    icon: '🥊',
    tagline: '5 fighters, special moves, KO system.',
    prompt: `Build a COMPLETE Roblox fighting arena with 5 fighter classes in one Luau block.

## World
- Circular 20-stud radius ring elevated 5 studs, red rope Parts around the edge
- 5 character selection pedestals labeled Warrior/Mage/Assassin/Tank/Ranger outside the ring
- Lighting ClockTime=18 for dramatic lighting

## Scripts
1. **ClassSelector** (ServerScript) — ProximityPrompt on each pedestal sets attribute FighterClass and gives a class-specific Tool (Sword/Fireball/Dagger/Shield/Bow).
2. **CombatScript** (ServerScript) — Tool.Activated deals damage based on class: Warrior 20, Mage 30 AoE, Assassin 15 crit x2, Tank 10+block, Ranger 25 ranged.
3. **RingOut** (ServerScript) — Part.Touched with an out-of-ring zone resets player position to their spawn pedestal.
4. **KOCounter** (ServerScript) — on Humanoid.Died, award killer KOs+=1 via leaderstats.
5. **LeaderstatsSetup** — IntValues KOs, Wins.${COMMON_RULES}`,
  },
  {
    id: 'roleplay',
    label: 'Roleplay',
    icon: '🏙️',
    tagline: 'City with jobs, houses, shops.',
    prompt: `Build a COMPLETE Roblox roleplay city in one Luau block.

## World
- 300x300 stud urban map: 3 asphalt streets forming a T, sidewalks, 4 shop buildings, a residential row of 3 enterable houses, a police station, a park with benches
- Lighting ClockTime=14

## Scripts
1. **JobBoard** (ServerScript) — ProximityPrompt at city hall: pick Cop/Chef/Doctor/Builder, sets Job attribute, gives class Tool.
2. **EarnMoney** (ServerScript) — every 30 sec while player has a Job, add $20 to Money leaderstat.
3. **ShopBuy** (ServerScript) — ProximityPrompts on shop counters: food $5 restores 25 HP, hat $20 gives an Accessory.
4. **HouseDoors** (ServerScript) — all house door Parts have ProximityPrompts to open/close via TweenService rotation.
5. **LeaderstatsSetup** — IntValue Money (starts 200), StringValue Job.${COMMON_RULES}`,
  },
  {
    id: 'survival',
    label: 'Survival',
    icon: '🔥',
    tagline: 'Hunger, crafting, night monsters.',
    prompt: `Build a COMPLETE Roblox survival game in one Luau block.

## World
- 150x150 stud forest with tree Parts (brown trunk + green leaves), scattered rock Parts, a river across the middle (Water material)
- A central crafting bench Part with a ProximityPrompt
- Lighting starts at ClockTime=7 (morning)

## Scripts
1. **LeaderstatsSetup** — IntValues Hunger (100), Thirst (100), Wood, Stone.
2. **HungerLoop** (ServerScript) — every 5 sec drain Hunger and Thirst by 2. At 0, drain Humanoid.Health by 5.
3. **ResourceGather** (ServerScript) — ClickDetectors on trees/rocks add 5 to Wood/Stone.
4. **Crafting** (ServerScript) — bench ProximityPrompt: 5 Wood = Torch Tool, 10 Wood + 5 Stone = Shelter Part placed in front of player.
5. **DayNightCycle** (ServerScript) — TweenService Lighting.ClockTime 6→18 over 120 sec, at night (ClockTime > 20) spawn 3 grey zombie Humanoids that MoveTo nearest player, dealing 10 damage on Touched.${COMMON_RULES}`,
  },
  {
    id: 'shooter',
    label: 'Shooter',
    icon: '🔫',
    tagline: 'PvP with weapons, spawns, kill feed.',
    prompt: `Build a COMPLETE Roblox PvP shooter map in one Luau block.

## World
- 100x100 stud urban combat map: 4 concrete buildings with doorways, cover crates, 2 spawn zones on opposite sides (red team north, blue team south), a central capture point (yellow Part)
- Lighting ClockTime=16

## Scripts
1. **LeaderstatsSetup** — IntValues Kills, Deaths, StringValue Team.
2. **TeamAssign** (ServerScript) — on PlayerAdded, auto-assign red/blue alternating, teleport to correct spawn zone.
3. **WeaponGive** (ServerScript) — on spawn, give a Pistol Tool that raycasts on Activated, 20 damage per shot, 10-shot magazine.
4. **KillFeed** (ServerScript) — on Humanoid.Died broadcast to all clients via a RemoteEvent with killer+victim names, update Kills/Deaths leaderstats.
5. **CapturePoint** (ServerScript) — Touched with yellow Part adds to a team timer; after 10 sec of holding, award 5 points to that team.${COMMON_RULES}`,
  },
  {
    id: 'kart',
    label: 'Kart Race',
    icon: '🏁',
    tagline: 'Figure-8 track, power-ups, 4 laps.',
    prompt: `Build a COMPLETE Roblox kart racing map in one Luau block.

## World
- Figure-8 track with 4-lap loop: checkered start/finish line, 2 jump ramps, grass borders, 4 yellow banana-peel power-up Parts, 2 blue boost-pad Parts
- 4 selectable kart models (VehicleSeat + 4 wheels each)

## Scripts
1. **KartSelector** (ServerScript) — ProximityPrompt welds player to kart VehicleSeat.
2. **LapTracker** (ServerScript) — 4 invisible checkpoints in order, 4 laps to win.
3. **BoostPad** (ServerScript) — Touched adds VectorForce to kart for 2 sec.
4. **BananaPeel** (ServerScript) — Touched applies random rotational Velocity to kart for 1 sec.
5. **LeaderstatsSetup** — IntValue Laps.${COMMON_RULES}`,
  },
  {
    id: 'adventure',
    label: 'Adventure',
    icon: '🗺️',
    tagline: 'Treasures, puzzles, story NPCs.',
    prompt: `Build a COMPLETE Roblox adventure game in one Luau block.

## World
- 200x200 stud mountain valley with: 3 hidden treasure chests (one in a cave, one behind a waterfall, one on a floating platform), a pressure-plate puzzle that opens a stone door, a 3-torch lighting puzzle that reveals a hidden bridge, a storyteller NPC Humanoid at the start
- Lighting ClockTime=14

## Scripts
1. **StorytellerNPC** (ServerScript) — ProximityPrompt "Talk" shows multi-line dialogue via BillboardGui above NPC.
2. **TreasureChest** (ServerScript) — ClickDetectors on each chest increment TreasuresFound leaderstat, spawn gold particle effect, play chest-open sound.
3. **PressurePlatePuzzle** (ServerScript) — Touched on plate moves a nearby stone-door Part via TweenService out of the way.
4. **TorchPuzzle** (ServerScript) — ClickDetector on 3 torches, if clicked in correct order reveals a hidden bridge Part.
5. **LeaderstatsSetup** — IntValues TreasuresFound, PuzzlesSolved.${COMMON_RULES}`,
  },
  {
    id: 'sandbox',
    label: 'Sandbox',
    icon: '🏗️',
    tagline: 'Place blocks, build anything.',
    prompt: `Build a COMPLETE Roblox sandbox building game in one Luau block.

## World
- 300x300 stud grey BasePlate
- Block palette at spawn: 5 pedestal Parts each showing a previewable block type (Wood, Stone, Glass, Metal, Grass)
- A BillboardGui sign "Left-click to place | Right-click to delete"

## Scripts
1. **BlockSelector** (ServerScript) — ProximityPrompt on each pedestal sets the player attribute SelectedBlock.
2. **PlaceBlockClient** (LocalScript in StarterPlayerScripts) — on Mouse.Button1Down, raycast from mouse to hit position, fire PlaceBlock RemoteEvent with position.
3. **PlaceBlockServer** (ServerScript) — receives remote, creates a 4x4x4 Part of SelectedBlock material at that position, anchors it, tags "fj_player_build".
4. **DeleteBlockClient** (LocalScript) — Mouse.Button2Down raycasts for a part tagged "fj_player_build", fires DeleteBlock RemoteEvent.
5. **DeleteBlockServer** (ServerScript) — destroys the given part if it's tagged.${COMMON_RULES}`,
  },
  {
    id: 'city',
    label: 'City Map',
    icon: '🌆',
    tagline: 'Roads, skyscrapers, parks, traffic.',
    prompt: `Build a COMPLETE Roblox modern city map in one Luau block.

## World
- 3x3 grid of city blocks separated by dark grey asphalt roads
- Each block has a randomly-selected skyscraper (4 height variations, glass SurfaceGui windows)
- Street lamps every 30 studs along roads (pole Parts with PointLights)
- 2 parks with tree Parts and bench Parts
- Central plaza with a fountain Part (blue Water material surface + ParticleEmitter spray)
- Lighting starts ClockTime=18 (evening)

## Scripts
1. **DayNightCycle** (ServerScript) — TweenService Lighting.ClockTime 6→22 over 180 sec.
2. **StreetLamps** (ServerScript) — connect Lighting.Changed, toggle lamp PointLight.Enabled based on ClockTime (on at night, off at day).
3. **FountainParticles** (ServerScript) — ParticleEmitter on fountain with water-like spray, Rate=20.${COMMON_RULES}`,
  },
  {
    id: 'castle',
    label: 'Castle',
    icon: '🏰',
    tagline: 'Moat, towers, drawbridge, throne.',
    prompt: `Build a COMPLETE Roblox medieval castle in one Luau block.

## World
- 100x100 stud stone castle: 4 corner towers (cylinder Parts with battlement crenellations), 20-stud-high walls with arrow slits (SurfaceGui "slit" textures)
- Working drawbridge: a horizontal Part with a hinge that tweens rotation up/down
- Moat: blue Water material ring around the castle
- Throne room in the center with a throne Part, red carpet leading from the entry gate, wall torches with PointLights
- Lighting ClockTime=16 for golden-hour glow

## Scripts
1. **DrawbridgeToggle** (ServerScript) — ProximityPrompt "Raise/Lower Drawbridge" tweens rotation 0°→90°.
2. **TorchFlicker** (ServerScript) — each wall torch PointLight cycles Brightness 1.2→0.8 every 0.5 sec.
3. **ThroneRoomPrompt** (ServerScript) — ProximityPrompt on the throne "Sit" CFrames player onto the throne.${COMMON_RULES}`,
  },
  {
    id: 'island',
    label: 'Island',
    icon: '🌴',
    tagline: 'Beach, palm trees, cave, shipwreck.',
    prompt: `Build a COMPLETE Roblox tropical island in one Luau block.

## World
- 120x120 stud sandy beach (Sand material), palm tree Parts around the edges, a wooden dock extending into blue Water
- A hidden cave carved into a hillside on the north edge
- Central firepit with ParticleEmitter flames and a crackling Sound
- A ruined shipwreck on the beach (brown plank Parts arranged)
- Lighting ClockTime=14, FogStart=100 for tropical haze

## Scripts
1. **FireParticles** (ServerScript) — ParticleEmitter on firepit with orange particle texture, Rate=30.
2. **WaveSound** (ServerScript) — looping ocean ambient Sound on SoundService.
3. **HiddenTreasure** (ServerScript) — a gold Chest Part in the cave with a ClickDetector that awards 100 gold to a Gold leaderstat IntValue and plays celebration sound.
4. **LeaderstatsSetup** — IntValue Gold.${COMMON_RULES}`,
  },
  {
    id: 'space',
    label: 'Space',
    icon: '🚀',
    tagline: 'Station, airlock, zero-G, docking bays.',
    prompt: `Build a COMPLETE Roblox space station in one Luau block.

## World
- 80x80 stud metallic central hub with 4 modular wings connecting to the center
- Airlock: two sliding doors that open/close sequentially via TweenService
- 3 docking bays with docked ship prop Parts
- Zero-gravity zones: Parts that cancel gravity on players who touch them
- Control room with blinking console Parts (cycling SurfaceGui lights)
- Lighting: dark with starfield skybox (Lighting.Ambient low, Brightness=0.5)

## Scripts
1. **AirlockSequence** (ServerScript) — ProximityPrompt triggers door1 open → wait 3 sec → door1 close → door2 open.
2. **ZeroGravityZone** (ServerScript) — Touched adds a BodyForce to player Humanoid's Part canceling Workspace.Gravity for 5 sec.
3. **ConsoleBlink** (ServerScript) — each console cycles SurfaceGui BackgroundColor3 green/red every 0.4 sec.${COMMON_RULES}`,
  },
]

// ---------------------------------------------------------------------------
// Combined export for the onboarding picker
// ---------------------------------------------------------------------------

export const ALL_GAME_PRESETS: GamePreset[] = [...PRIMARY_PRESETS, ...SECONDARY_PRESETS]

/**
 * Find a preset by id. Returns undefined if not found.
 * Used by /editor?preset=<id> deep links.
 */
export function getPresetById(id: string): GamePreset | undefined {
  return ALL_GAME_PRESETS.find((p) => p.id === id)
}
