// world-design-bible.ts — World and level design knowledge for Roblox
// ALL dimensions in studs. No SmoothPlastic. No filler.

export const WORLD_LAYOUTS: string = `
=== MAP LAYOUTS BY GAME TYPE (with stud dimensions) ===

--- TYCOON MAP ---
Footprint: 512x512 studs total play area
Player plot: 80x80 studs each, fits 16 plots in grid
Central area: 120x120 stud hub (shop, leaderboard, social area)
Pathways: 12 studs wide between plots
Spawn: center of hub, elevated 3 studs for visibility
Dropper line: 40-stud conveyor per player
Key zones: Plots → Hub → Shop → Premium area (gated)

--- PET SIMULATOR MAP ---
Footprint: 1024x1024 studs main world, expandable zones
Starting zone: 200x200 studs (easy enemies, basic eggs)
Zone gates: archway 12 wide x 15 tall, requires X strength to enter
Each zone: 200x200 to 300x300 studs
Zone count: 8-12 zones of increasing difficulty
Hub island: 150x150 floating (shop, trading, egg display)
Egg locations: 3-5 per zone, spaced 40-60 studs apart
Enemy spawn radius: 30 studs from spawn markers

--- RPG / ADVENTURE MAP ---
Footprint: 2048x2048+ studs open world
Town: 300x300 studs (NPCs, shops, quest board, inn, bank)
Dungeon: 150x200 studs (linear rooms, traps, boss arena at end)
Boss arena: 60x60 studs minimum (room to dodge)
Wilderness zones: 400x400 each, 4-6 biomes
Roads: 16-24 studs wide, connect all areas
Hidden areas: 40x40 off main path for loot/secrets
Waypoint towers: every 200 studs along main route

--- OBBY (OBSTACLE COURSE) ---
Footprint: 60-100 studs wide, 2000+ studs long (linear)
Platform spacing: 4-8 studs (easy), 8-14 studs (medium), 14-20 studs (hard)
Platform size: 4x4 (standard), 2x2 (hard), 6x6 (rest stop)
Checkpoint every: 8-12 obstacles
Stage height gain: 5-15 studs per stage
Kill brick zones: below platforms at Y=-50 (teleport back to checkpoint)
Rest areas: every 3-4 stages, 20x20 with shop/upgrade

--- HORROR MAP ---
Footprint: 200x200 studs indoor (claustrophobic is key)
Hallways: 6-8 studs wide, 10-12 high (feels oppressive)
Rooms: 15x15 to 30x30 studs
Dead ends: 2-3 per floor (tension builders)
Safe room: 1 per floor, 12x12, locked door, light inside
Entity patrol path: 80-150 stud loop
Hiding spots: closets 3x3x7, under beds, lockers 2x2x6
Line of sight breaks: every 20-30 studs (corners, pillars)
Emergency exits: 1-2 per floor (locked until certain condition)

--- TOWER DEFENSE ---
Footprint: 256x256 studs
Path: 8-12 studs wide, winding S-curves or spiral, 400-600 studs total length
Tower placement zones: 6x6 grid spots along path edges
Spawn point: edge of map, clearly marked portal
Exit point: opposite edge, base to defend
Tower spots count: 25-40 per map
Path turns: minimum 6 turns for strategic placement
Elevation: path at Y=0, some tower spots at Y=4-8 for range bonus

--- BATTLE ROYALE ---
Footprint: 2048x2048 studs minimum
Map center: high-value loot area (unique landmark)
POIs (Points of Interest): 12-18, spaced 300-500 studs apart
Each POI: 100x100 to 200x200 studs (town, factory, camp)
Storm/zone circle: starts at map edge, shrinks every 60-90 seconds
Loot spawns: every 20-30 studs inside POIs, sparse in wilderness
Vehicle spawns: along roads between POIs
Elevation variety: hills, buildings, cliffs for sniper positions

--- RACING ---
Track length: 1500-3000 studs total loop
Track width: 24-36 studs (3-4 car widths)
Turns: 8-15 per lap, mix of tight (10-stud radius) and sweeping (40-stud radius)
Start/finish: 36 studs wide, grid spots for 8-12 racers
Pit lane: parallel to start, 8 studs wide
Elevation changes: 10-30 studs over the course
Barriers: Part walls 3 studs high along track edges
Shortcuts: 1-2 risky alternate paths

--- SURVIVAL ---
Footprint: 1024x1024 studs island or contained area
Base building zone: any flat area, grid snap 4 studs
Resource nodes: trees every 15-25 studs, rocks every 30-40 studs
Water source: central lake or river
Crafting station: at spawn + player-buildable
Enemy spawn zones: edges of map, 100+ studs from spawn
Day cycle: 10-15 minutes real time
Night danger zone: enemies roam 50% further at night

--- ROLEPLAY ---
Footprint: 512x512 studs town
Buildings: 12-20 enterable (house, shop, restaurant, hospital, school, police, fire station)
Roads: 24-36 studs wide (2 lanes + sidewalks)
Sidewalks: 6 studs wide
Buildings: 30x30 to 60x60 footprint, 2-3 stories (each story 12-15 studs)
Park: 80x80 central green space
Parking lots: 50x30, spots 8x4 studs each
Residential area: 8-12 houses, each on 40x40 lot
Commercial strip: 6-8 shops in a row
`

export const WORLD_LEVEL_DESIGN: string = `
=== LEVEL DESIGN PRINCIPLES ===

--- SIGHT LINES ---
Players should see their next objective from current position.
Tall landmark visible from 300+ studs: tower, mountain, glowing structure.
Door frames and corridors naturally guide the eye forward.
Never put critical paths behind the player facing direction at spawn.

--- BREADCRUMBING ---
Lead players with visual cues along the intended path:
- Coins/pickups spaced 5-8 studs along the route
- Lights pointing the way (PointLight at intervals)
- Color contrast: bright path on dark surroundings
- Decreasing/increasing Part size creating visual flow
- NPCs facing toward the next area

--- GATING ---
Block access to advanced areas until players earn it:
Visual gate: see the area but cant reach it (glass wall, high ledge)
Currency gate: costs X coins to unlock (tycoon, simulator)
Level gate: "Requires Level 10" sign + invisible wall
Quest gate: complete quest to unlock path
Key gate: find key item in previous area
Gradual reveal: fog/darkness clears as player progresses

--- PACING ---
Alternate tension and relief:
- Action zone (30-60 seconds of enemies/obstacles)
- Rest zone (15-30 seconds of safe area, shop, story)
- Escalation (each action zone slightly harder)
- Climax (boss fight or final challenge)
- Resolution (reward, cutscene, portal to next area)
Never maintain constant high intensity — players fatigue.

--- RISK VS REWARD ---
Optional dangerous paths yield better loot.
Visible reward (glowing chest) at end of risky platforming.
Side rooms in dungeons: harder enemies but rare drops.
Risk indicators: lava, darkness, warning signs, skulls.
Always ensure reward matches the difficulty invested.

--- VERTICALITY ---
Flat maps are boring. Layer the play space:
Underground: caves, basements, mines (risk/mystery)
Ground level: main gameplay, towns, roads
Rooftops: sniper spots, shortcuts, hidden collectibles
Sky: floating islands, airships (endgame/premium)
Each vertical layer should have distinct gameplay purpose.

--- LANDMARKS ---
Every 200 studs, place a unique recognizable structure.
Landmarks serve as: navigation aids, meeting points, quest locations.
Make landmarks visible from multiple angles and distances.
Use unique color or material (one red building in gray town).
Name landmarks for player communication ("meet at the tower").

--- DEAD END REWARDS ---
Every dead end MUST have a reward. Never waste player exploration.
Small: coin pile, health pickup, lore note
Medium: chest with random loot
Large: rare item, achievement, shortcut back to main path
`

export const WORLD_STORYTELLING: string = `
=== ENVIRONMENTAL STORYTELLING ===

--- SHOW DONT TELL ---
Instead of text: "There was a battle here"
Show: scattered weapons, broken walls, scorch marks, overturned carts, cracked ground
Instead of text: "This building is abandoned"
Show: broken windows, overgrown vines, dusty furniture, cobwebs, fallen ceiling tiles

--- PROGRESSIVE REVELATION ---
Zone 1: peaceful village, all is well
Zone 2: village with some damage, worried NPCs
Zone 3: heavily damaged, abandoned
Zone 4: completely destroyed, the source of destruction visible
Each zone tells MORE of the story through environment alone.

--- LIVED-IN DETAILS ---
Kitchen: plates on table, food props, stain on counter, open cookbook
Bedroom: unmade bed, slippers by bed, photo on nightstand, clothes on chair
Office: papers scattered, coffee cup ring, pen on open notebook, family photo
Workshop: tools on wall, sawdust on floor, half-finished project on bench
These details make spaces feel real without any text.

--- CONTRAST STORYTELLING ---
Beautiful garden next to burned ruin = something happened here
Cozy house in dangerous forest = safe haven, NPC story
Luxurious mansion next to slum = economic inequality narrative
Bright flowers growing through concrete = hope/resilience
Contrast creates emotional narrative automatically.

--- FORESHADOWING ---
Show evidence of boss before encountering it:
- Claw marks on walls getting deeper as you progress
- Increasingly large footprints
- Destroyed structures getting more recent
- NPC dialogue about "the creature" becomes more fearful
- Environmental damage matches boss abilities (fire scorch = fire boss)
`

export const WORLD_ZONES: string = `
=== ZONE TRANSITIONS ===

--- BIOME GRADIENTS ---
Never hard-cut between biomes. Blend over 40-80 studs:
Forest → Desert: trees get sparser, ground browns, grass patches shrink
Snow → Forest: snow-dusted trees, melting edges, icy streams
Town → Wilderness: buildings thin out, pavement cracks, nature encroaches
Use material mixing: 70% new biome + 30% old biome in transition

--- DIFFICULTY INDICATORS ---
Easy zones: bright lighting, green/blue palette, open spaces, gentle music
Medium zones: slightly darker, orange/yellow warnings, tighter spaces
Hard zones: dark, red accents, tight corridors, intense music, environmental hazards
Boss zone: unique color that exists nowhere else (signals importance)

--- ZONE DESIGN CHECKLIST ---
Each zone needs:
1. Unique visual identity (color palette + signature material)
2. Clear entrance (gate, arch, bridge, portal)
3. Internal landmark (recognizable from within)
4. Purpose (quest hub, farming, exploration, combat)
5. Escalating difficulty (front=easier, back=harder)
6. Connection to 2-3 other zones (no dead-end zones)
7. Safe spot (respawn, heal, shop access)
`

export const WORLD_NAVIGATION: string = `
=== PLAYER NAVIGATION ===

--- PATH HIERARCHY ---
Main roads: 24-36 studs wide, clear material (Brick, Cobblestone, Concrete)
Secondary paths: 12-16 studs wide, lighter material
Trails: 6-8 studs wide, Grass or Sand (subtle)
Secret paths: 3-4 studs wide, hidden behind objects

--- SIGNAGE ---
Wooden signs: Part 3x2x0.2 + SurfaceGui with TextLabel
Material=Wood, Color RGB(110,75,35)
Arrow signs: WedgePart pointing direction, bright color
Glowing signs: Neon material + SurfaceGui for important locations
NPC guides: station NPCs at forks pointing the right way

--- COLOR CODING ---
Assign each zone a signature color:
Zone 1 (forest): Green markers
Zone 2 (desert): Orange markers
Zone 3 (snow): Blue markers
Zone 4 (volcano): Red markers
Use this color on: path borders, signs, building accents, map UI

--- MINIMAP PRINCIPLES ---
Track key locations: spawn, shops, quest objectives, zone borders
Player dot: white or bright color, always center
North indicator: arrow or compass rose
Fog of war: gray out unvisited areas
Scale: show 200-400 stud radius around player
`

export const WORLD_SCALE: string = `
=== SCALE REFERENCE (1 stud ≈ 1 foot ≈ 0.3 meters) ===

--- HUMAN PROPORTIONS (R15 character) ---
Character height: ~5.2 studs (head to foot)
Character width: ~2 studs (shoulder to shoulder)
Eye level: ~4.8 studs from ground
Reach height: ~7 studs
Step height: 0.5-1 stud (HumanoidStateType climb threshold)
Jump height: ~7.2 studs (default JumpPower=50)

--- ARCHITECTURE ---
Door: 3 wide x 6.5 tall (standard single)
Double door: 6 wide x 7 tall
Window: 2-3 wide x 3-4 tall, sill at 3 studs above floor
Ceiling height: 10-12 studs (residential), 15-20 (commercial), 25+ (cathedral)
Wall thickness: 0.5-1 stud (interior), 1-2 studs (exterior)
Floor thickness: 0.5-1 stud
Stair step: 0.75 high x 1 deep (comfortable), total run: 12 steps = 9 high x 12 deep
Hallway: 5-6 studs wide (tight), 8-10 (comfortable), 12+ (grand)
Elevator: 6x6 interior space

--- FURNITURE ---
Table height: 3 studs (dining), 2.5 (coffee)
Chair seat: 1.8 studs from floor
Counter height: 3.5 studs (kitchen), 4 (bar)
Bed: 3 wide x 7 long x 2 tall (twin), 5 wide (queen), 6 wide (king)
Desk: 5 wide x 2.5 deep x 3 tall
Bookshelf: 3 wide x 1 deep x 7 tall
Sofa: 6-8 wide x 3 deep x 3 tall
TV: 4-6 wide x 0.3 deep x 2.5-4 tall (mounted at 4 studs)

--- OUTDOOR ---
Road: 12 (one lane), 24 (two lane), 36 (four lane with median)
Sidewalk: 5-6 studs wide
Parking spot: 8 wide x 16 deep
Tree: trunk 1-2 wide, canopy 8-20 wide, height 15-50 studs
Bush: 3-5 wide x 2-4 tall
Fence: 4 studs tall, posts every 8 studs
Lamp post: 12-15 tall, light at top
Fire hydrant: 1x1x2.5
Mailbox: 1x1x4
Stop sign: 0.3x3x3 on 7-stud pole
Bench: 5 wide x 2 deep x 3 tall

--- VEHICLES ---
Sedan: 6 wide x 15 long x 5 tall
Truck: 7 wide x 20 long x 7 tall
Bus: 8 wide x 30 long x 10 tall
Motorcycle: 3 wide x 8 long x 4 tall
Bicycle: 2 wide x 6 long x 4 tall

--- GAME-SPECIFIC ---
Tycoon dropper: 2x2x2 each
Conveyor: 4 wide
Obby platform: 4x4 (standard), 2x2 (hard)
Tower defense path: 8-12 wide
Arena ring: 40-60 diameter
Shop counter: 8 wide x 2 deep x 3.5 tall
`

export const WORLD_DESIGN_BIBLE: string = WORLD_LAYOUTS + '\n\n' + WORLD_LEVEL_DESIGN + '\n\n' + WORLD_STORYTELLING + '\n\n' + WORLD_ZONES + '\n\n' + WORLD_NAVIGATION + '\n\n' + WORLD_SCALE
