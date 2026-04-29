/**
 * NPC & Character Bible — character construction, AI behaviors, dialog systems, combat AI.
 * ForjeGames AI Knowledge Base — 5000+ lines of NPC/character expertise.
 */

export const NPC_CHARACTER_BIBLE: string = `
=== NPC & CHARACTER BIBLE ===
Complete reference for building NPCs, characters, rigs, behaviors, dialog, combat AI, and spawn systems in Roblox.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1: RIG CONSTRUCTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

── R6 RIG ──
R6 is the classic Roblox rig with 6 body parts. Simple, performant, used for most NPCs.

PARTS AND EXACT SIZES:
  Head        → 2 x 1 x 1   (Width x Height x Depth in studs)
  Torso       → 2 x 2 x 1
  Left Arm    → 1 x 2 x 1
  Right Arm   → 1 x 2 x 1
  Left Leg    → 1 x 2 x 1
  Right Leg   → 1 x 2 x 1

JOINT STRUCTURE (Motor6D):
  Neck          → Torso → Head        C0: CFrame.new(0, 1, 0)          C1: CFrame.new(0, -0.5, 0)
  Left Shoulder → Torso → Left Arm   C0: CFrame.new(-1.5, 0.5, 0)     C1: CFrame.new(0.5, 0.5, 0)
  Right Shoulder→ Torso → Right Arm  C0: CFrame.new(1.5, 0.5, 0)      C1: CFrame.new(-0.5, 0.5, 0)
  Left Hip      → Torso → Left Leg   C0: CFrame.new(-0.5, -1, 0)      C1: CFrame.new(0, 1, 0)
  Right Hip     → Torso → Right Leg  C0: CFrame.new(0.5, -1, 0)       C1: CFrame.new(0, 1, 0)

ASSEMBLY ORDER:
  1. Create Model named "NPC_Name"
  2. Create HumanoidRootPart (2x2x2, Transparency=1, CanCollide=false) — this is the ROOT
  3. Create Torso, parent to Model
  4. Create Head, Left Arm, Right Arm, Left Leg, Right Leg
  5. Weld HumanoidRootPart to Torso: Motor6D named "RootJoint"
     C0 = CFrame.new(0, -1, 0) * CFrame.Angles(-math.pi/2, 0, math.pi)
     C1 = CFrame.new(0, -1, 0) * CFrame.Angles(-math.pi/2, 0, math.pi)
  6. Add all Motor6D joints inside Torso
  7. Add Humanoid to Model (MaxHealth=100, Health=100, WalkSpeed=16)
  8. Set Model.PrimaryPart = HumanoidRootPart

R6 LUAU BUILD EXAMPLE:
local function buildR6NPC(name, position)
  local model = Instance.new("Model")
  model.Name = name

  local root = Instance.new("Part")
  root.Name = "HumanoidRootPart"
  root.Size = Vector3.new(2, 2, 1)
  root.Transparency = 1
  root.CanCollide = false
  root.Parent = model

  local torso = Instance.new("Part")
  torso.Name = "Torso"
  torso.Size = Vector3.new(2, 2, 1)
  torso.BrickColor = BrickColor.new("Medium stone grey")
  torso.Material = Enum.Material.SmoothPlastic
  torso.Parent = model

  local head = Instance.new("Part")
  head.Name = "Head"
  head.Size = Vector3.new(2, 1, 1)
  head.BrickColor = BrickColor.new("Light orange")
  head.Parent = model

  local function makeLimb(n, sz)
    local p = Instance.new("Part")
    p.Name = n
    p.Size = sz
    p.BrickColor = BrickColor.new("Light orange")
    p.Parent = model
    return p
  end

  local lArm  = makeLimb("Left Arm",   Vector3.new(1, 2, 1))
  local rArm  = makeLimb("Right Arm",  Vector3.new(1, 2, 1))
  local lLeg  = makeLimb("Left Leg",   Vector3.new(1, 2, 1))
  local rLeg  = makeLimb("Right Leg",  Vector3.new(1, 2, 1))

  local function makeJoint(parent, part0, part1, jname, c0, c1)
    local j = Instance.new("Motor6D")
    j.Name = jname
    j.Part0 = part0
    j.Part1 = part1
    j.C0 = c0
    j.C1 = c1
    j.Parent = parent
    return j
  end

  makeJoint(torso, root, torso, "RootJoint",
    CFrame.new(0,-1,0)*CFrame.Angles(-math.pi/2,0,math.pi),
    CFrame.new(0,-1,0)*CFrame.Angles(-math.pi/2,0,math.pi))
  makeJoint(torso, torso, head,  "Neck",
    CFrame.new(0,1,0), CFrame.new(0,-0.5,0))
  makeJoint(torso, torso, lArm,  "Left Shoulder",
    CFrame.new(-1.5,0.5,0), CFrame.new(0.5,0.5,0))
  makeJoint(torso, torso, rArm,  "Right Shoulder",
    CFrame.new(1.5,0.5,0),  CFrame.new(-0.5,0.5,0))
  makeJoint(torso, torso, lLeg,  "Left Hip",
    CFrame.new(-0.5,-1,0), CFrame.new(0,1,0))
  makeJoint(torso, torso, rLeg,  "Right Hip",
    CFrame.new(0.5,-1,0),  CFrame.new(0,1,0))

  local hum = Instance.new("Humanoid")
  hum.MaxHealth = 100
  hum.Health = 100
  hum.WalkSpeed = 16
  hum.JumpHeight = 7.2
  hum.Parent = model

  model.PrimaryPart = root
  model:SetPrimaryPartCFrame(CFrame.new(position))
  model.Parent = workspace
  return model
end

── R15 RIG ──
R15 has 15 parts, more articulation for smoother animations. Used for hero NPCs, bosses, player-like characters.

PARTS AND EXACT SIZES:
  HumanoidRootPart  → 2 x 2 x 1     (invisible root, anchored logic part)
  LowerTorso        → 2 x 1.5 x 1
  UpperTorso        → 2 x 1.5 x 1
  Head              → 2 x 1 x 1
  LeftUpperArm      → 1 x 1.33 x 1
  LeftLowerArm      → 1 x 1.25 x 1
  LeftHand          → 1 x 0.7 x 1
  RightUpperArm     → 1 x 1.33 x 1
  RightLowerArm     → 1 x 1.25 x 1
  RightHand         → 1 x 0.7 x 1
  LeftUpperLeg      → 1 x 1.5 x 1
  LeftLowerLeg      → 1 x 1.5 x 1
  LeftFoot          → 1 x 0.6 x 1
  RightUpperLeg     → 1 x 1.5 x 1
  RightLowerLeg     → 1 x 1.5 x 1
  RightFoot         → 1 x 0.6 x 1

R15 JOINT NAMES AND C0/C1 CFRAMES:
  Root              → HumanoidRootPart → LowerTorso
    C0: CFrame.new(0,-1,0)*CFrame.Angles(-pi/2,0,pi)
    C1: CFrame.new(0,-1,0)*CFrame.Angles(-pi/2,0,pi)
  Waist             → LowerTorso → UpperTorso
    C0: CFrame.new(0,0.75,0)   C1: CFrame.new(0,-0.75,0)
  Neck              → UpperTorso → Head
    C0: CFrame.new(0,0.75,0)   C1: CFrame.new(0,-0.5,0)
  LeftShoulder      → UpperTorso → LeftUpperArm
    C0: CFrame.new(-1,0.5,0)   C1: CFrame.new(0.5,0.67,0)
  LeftElbow         → LeftUpperArm → LeftLowerArm
    C0: CFrame.new(-0.5,-0.67,0) C1: CFrame.new(-0.5,0.625,0)
  LeftWrist         → LeftLowerArm → LeftHand
    C0: CFrame.new(-0.5,-0.625,0) C1: CFrame.new(-0.5,0.35,0)
  RightShoulder     → UpperTorso → RightUpperArm
    C0: CFrame.new(1,0.5,0)    C1: CFrame.new(-0.5,0.67,0)
  RightElbow        → RightUpperArm → RightLowerArm
    C0: CFrame.new(0.5,-0.67,0) C1: CFrame.new(0.5,0.625,0)
  RightWrist        → RightLowerArm → RightHand
    C0: CFrame.new(0.5,-0.625,0) C1: CFrame.new(0.5,0.35,0)
  LeftHip           → LowerTorso → LeftUpperLeg
    C0: CFrame.new(-0.5,-0.75,0) C1: CFrame.new(-0.5,0.75,0)
  LeftKnee          → LeftUpperLeg → LeftLowerLeg
    C0: CFrame.new(-0.5,-0.75,0) C1: CFrame.new(-0.5,0.75,0)
  LeftAnkle         → LeftLowerLeg → LeftFoot
    C0: CFrame.new(-0.5,-0.75,0) C1: CFrame.new(-0.5,0.3,0)
  RightHip          → LowerTorso → RightUpperLeg
    C0: CFrame.new(0.5,-0.75,0)  C1: CFrame.new(0.5,0.75,0)
  RightKnee         → RightUpperLeg → RightLowerLeg
    C0: CFrame.new(0.5,-0.75,0)  C1: CFrame.new(0.5,0.75,0)
  RightAnkle        → RightLowerLeg → RightFoot
    C0: CFrame.new(0.5,-0.75,0)  C1: CFrame.new(0.5,0.3,0)

── HUMANOID PROPERTIES (CRITICAL) ──
  WalkSpeed       default 16  (range 0–100, fast enemies 24, slow undead 6)
  JumpPower       default 50  (legacy; UseJumpPower must be true)
  JumpHeight      default 7.2 (studs, UseJumpPower=false)
  MaxHealth       default 100 (scale for bosses: 1000–50000)
  Health          starts at MaxHealth, set lower for damaged state
  HipHeight       default 1.35 for R15, 2 for R6 (distance from ground to root)
  AutoRotate      true = faces movement direction (disable for turrets/stationary NPCs)
  UseJumpPower    false = use JumpHeight (recommended for modern games)
  DisplayName     set to empty string "" to hide nametag
  HealthDisplayType  Enum.HumanoidHealthDisplayType.AlwaysOff for enemies

── CUSTOM CHARACTER MODELS ──
MeshPart bodies:
  - Use MeshPart instead of Part for organic shapes (creatures, monsters)
  - Set MeshId to asset ID, e.g. "rbxassetid://12345678"
  - Scale via Size property, maintain proportions
  - Use SpecialMesh (Type=Sphere/Block/Wedge/Cylinder/FileMesh) for simple shapes
  - Accessory attachment: create Attachment named "BodyFrontAttachment" etc. on body part, match AccessoryWeld

ACCESSORY SYSTEM:
  local function wearAccessory(character, accessoryId)
    local acc = game:GetService("InsertService"):LoadAsset(accessoryId)
    local accessory = acc:FindFirstChildOfClass("Accessory")
    if accessory then
      character.Humanoid:AddAccessory(accessory)
    end
  end

  Common attachment names:
    HatAttachment         → top of Head
    HairAttachment        → top of Head (back)
    FaceFrontAttachment   → front of Head
    FaceBackAttachment    → back of Head
    NeckAttachment        → top of Torso/UpperTorso
    BodyFrontAttachment   → front of Torso
    BodyBackAttachment    → back of Torso
    LeftShoulderAttachment
    RightShoulderAttachment
    WaistFrontAttachment
    WaistBackAttachment
    WaistCenterAttachment
    LeftWristAttachment
    RightWristAttachment

CLOTHING SYSTEM:
  Shirt:
    local shirt = Instance.new("Shirt")
    shirt.ShirtTemplate = "rbxassetid://12345678"
    shirt.Parent = character

  Pants:
    local pants = Instance.new("Pants")
    pants.PantsTemplate = "rbxassetid://12345678"
    pants.Parent = character

  ShirtGraphic (T-shirt overlay):
    local tshirt = Instance.new("ShirtGraphic")
    tshirt.Graphic = "rbxassetid://12345678"
    tshirt.Parent = character

  BrickColor for skin tone (set on Head, Arms, Hands, Feet):
    Light skin:   BrickColor.new("Pastel brown")     -- R:255 G:204 B:153
    Medium skin:  BrickColor.new("Light orange")     -- R:240 G:163 B:10
    Dark skin:    BrickColor.new("Reddish brown")    -- R:143 G:76  B:42
    Fantasy:      any BrickColor -- green for orc, blue for alien, pale for undead

── NPC BODY SCALE (R15) ──
BodyDepthScale    → default 1.0   (thin: 0.7, fat: 1.4)
BodyHeightScale   → default 1.0   (short: 0.8, tall: 1.3, giant: 2.0)
BodyWidthScale    → default 1.0   (narrow: 0.8, wide: 1.3)
HeadScale         → default 1.0   (big head: 1.3, small: 0.85)

Set via Humanoid body scale values:
  local humanoidDesc = Instance.new("HumanoidDescription")
  humanoidDesc.BodyTypeScale = 1.0
  humanoidDesc.DepthScale = 1.0
  humanoidDesc.HeadScale = 1.0
  humanoidDesc.HeightScale = 1.0
  humanoidDesc.ProportionScale = 0
  humanoidDesc.WidthScale = 1.0
  character.Humanoid:ApplyDescription(humanoidDesc)
`;

export const NPC_ARCHETYPES: string = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2: CHARACTER ARCHETYPES (50+)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Each archetype includes: BrickColor codes, accessories, body scale, personality, idle style, WalkSpeed, combat role.

FORMAT PER ARCHETYPE:
  Torso/Limbs   BrickColor name
  Head          BrickColor name
  Accessories   list of props and wearables
  BodyScale     Height / Width / Depth multipliers (1.0 = default)
  Personality   tone, speech style, sample lines
  IdleStyle     what the NPC does when no player is nearby
  WalkSpeed     numeric value
  Role          gameplay purpose
  Health        HP amount
  Dialog seeds  example lines

══ MEDIEVAL ARCHETYPES ══

── KNIGHT ──
  Torso/Limbs:   BrickColor "Medium stone grey"  (silver armor)
  Head:          BrickColor "Pastel brown"        (skin)
  Accessories:   Knight helmet, sword tool, shield
  BodyScale:     Height 1.05, Width 1.1, Depth 1.1  (stocky armored build)
  Personality:   Stoic, protective, honorable. Short declarative sentences.
  IdleStyle:     Stand at attention, occasional armor-clank sound, slow head-turn left-right
  WalkSpeed:     12  (heavy armor)
  JumpHeight:    5   (armor restricts jump)
  Role:          Melee tank. Guards gates, patrols walls. High HP.
  Health:        300
  Dialog seeds:  "None shall pass.", "The kingdom is safe while I stand.", "Move along, citizen."
  Loot:          Iron sword 40%, Shield fragment 25%, Gold coin 80%, Knight badge 5%

── WIZARD ──
  Torso/Limbs:   BrickColor "Royal purple"
  Head:          BrickColor "Pastel brown"
  Accessories:   Tall wizard hat, magic staff tool, spell book prop
  BodyScale:     Height 1.1, Width 0.85, Depth 0.85  (tall thin)
  Personality:   Cryptic, wise, eccentric. Speaks in riddles. Long pauses between sentences.
  IdleStyle:     Floating particles around hands, occasional "hmm" head nod, reads invisible book
  WalkSpeed:     10
  Role:          Ranged magic caster. Fireballs 30 dmg, ice shards 20 dmg. Medium HP.
  Health:        150
  Dialog seeds:  "The stars foretold your arrival.", "Knowledge is the greatest weapon.", "Fascinating..."
  Loot:          Spell tome 15%, Magic staff 8%, Mana crystal 60%, Robes 30%

── ARCHER ──
  Torso/Limbs:   BrickColor "Reddish brown"       (leather armor)
  Head:          BrickColor "Pastel brown"
  Accessories:   Green hood, bow tool, quiver on back
  BodyScale:     Height 1.0, Width 0.9, Depth 0.9  (lean athletic)
  Personality:   Quiet, observant, precise. Minimal words.
  IdleStyle:     Scanning surroundings, arrow nocked, slight crouch, weight shift foot to foot
  WalkSpeed:     18  (light on feet)
  Role:          Ranged physical. 60-stud range. Arrow = 25 dmg. Kites melee enemies.
  Health:        120
  Dialog seeds:  "I never miss.", "The forest hears everything.", "You were followed. I handled it."
  Loot:          Arrow bundle 70%, Bow 12%, Leather armor 25%, Eagle feather 40%

── BLACKSMITH ──
  Torso/Limbs:   BrickColor "Dark orange"         (leather apron)
  Head:          BrickColor "Reddish brown"
  Accessories:   Hammer tool, leather apron, goggles
  BodyScale:     Height 0.95, Width 1.2, Depth 1.1  (broad muscular)
  Personality:   Gruff but friendly. No-nonsense. Proud of craft.
  IdleStyle:     Hammering at forge looped animation, wiping sweat, inspecting tools
  WalkSpeed:     12
  Role:          Non-combat vendor. Sells and repairs weapons. Gives crafting quests.
  Health:        200
  Dialog seeds:  "Need somethin forged?", "Best blade in the realm.", "Come back when its done."
  Shop:          Iron Sword 50g, Iron Armor 120g, Repair 20g per item

── KING / QUEEN ──
  Torso/Limbs:   BrickColor "Bright red"          (royal robes)
  Head:          BrickColor "Pastel brown"
  Accessories:   Crown, royal scepter or orb, cape accessory
  BodyScale:     Height 1.1, Width 1.0, Depth 0.95
  Personality:   Commanding, benevolent, occasionally pompous. Always composed.
  IdleStyle:     Seated on throne, gracious wave, occasional yawn when bored
  WalkSpeed:     10  (dignified, never rushes)
  Role:          Quest hub. Issues royal quests, rewards with gold and titles.
  Health:        500  (scripted invincible for story)
  Dialog seeds:  "Rise, adventurer.", "Our kingdom needs a champion.", "You have our gratitude."

── PEASANT ──
  Torso/Limbs:   BrickColor "Sand green"          (rough cloth tunic)
  Head:          BrickColor "Light orange"
  Accessories:   Straw hat, pitchfork tool, potato sack prop
  BodyScale:     Height 0.95, Width 0.95, Depth 0.9
  Personality:   Fearful, helpful, worries about harvest. Easily startled by loud sounds.
  IdleStyle:     Tending crops animation, looking over shoulder nervously, sweeping floor
  WalkSpeed:     14
  Role:          Ambient NPC, gives gathering and delivery quests.
  Health:        50
  Dialog seeds:  "Please do not hurt me.", "The monsters took my goat...", "Good harvest this year."

── BARD ──
  Torso/Limbs:   BrickColor "Bright yellow"       (colorful jester tunic)
  Head:          BrickColor "Pastel brown"
  Accessories:   Feathered cap, lute tool, colorful clothing pieces
  BodyScale:     Height 1.0, Width 0.9, Depth 0.85
  Personality:   Cheerful, dramatic, theatrical. Occasionally speaks in rhyme.
  IdleStyle:     Strumming lute looped, dancing in place, bowing to passersby
  WalkSpeed:     16
  Role:          Sells music buffs, tells lore, plays songs granting party buffs.
  Health:        80
  Dialog seeds:  "Gather round, hear my tale!", "A song for the weary soul?", "Adventure in every chord!"

── THIEF ──
  Torso/Limbs:   BrickColor "Dark grey"           (dark leather)
  Head:          BrickColor "Pastel brown"
  Accessories:   Dark hood, daggers tool, lockpick prop
  BodyScale:     Height 0.95, Width 0.85, Depth 0.8  (wiry small)
  Personality:   Sly, calculating, always scanning exits. Speaks quietly and quickly.
  IdleStyle:     Leaning against wall casually, dart eyes left-right, tap foot impatiently
  WalkSpeed:     22  (fastest medieval archetype)
  Role:          Sells stolen goods, teaches lockpicking, comic pickpocket animation on interact.
  Health:        100
  Dialog seeds:  "Not a word to the guards.", "Everything has a price.", "I was never here."

── PRIEST ──
  Torso/Limbs:   BrickColor "White"               (holy robes)
  Head:          BrickColor "Pastel brown"
  Accessories:   White hood, holy symbol necklace, prayer book prop
  BodyScale:     Height 1.0, Width 0.9, Depth 0.85
  Personality:   Peaceful, compassionate, strong faith. Speaks with gentle conviction.
  IdleStyle:     Kneeling in prayer, blessing gesture with raised hand, reading scripture
  WalkSpeed:     12
  Role:          Healer. Resurrects fallen players. Sells HP potions. Cures debuffs.
  Health:        120
  Dialog seeds:  "May the light guide you.", "I sense darkness ahead, take care.", "Bless you, traveler."

── MERCHANT ──
  Torso/Limbs:   BrickColor "Bright orange"       (colorful trade clothes)
  Head:          BrickColor "Light orange"
  Accessories:   Wide-brim hat, coin purse prop, market stall
  BodyScale:     Height 1.0, Width 1.05, Depth 1.0  (slightly round)
  Personality:   Enthusiastic, money-focused, always selling.
  IdleStyle:     Organizing goods on stall, counting coins, beckoning approaching players
  WalkSpeed:     10  (prefers to stay at stall)
  Role:          Shop NPC. Opens shop GUI on interact. Restocks every 10 minutes.
  Health:        100
  Dialog seeds:  "Best deals in the land!", "For you, special price!", "Come look at my wares!"

══ MODERN ARCHETYPES ══

── POLICE OFFICER ──
  Torso/Limbs:   BrickColor "Dark blue"
  Head:          BrickColor "Pastel brown"
  Accessories:   Police cap, badge decal on torso, radio prop
  BodyScale:     Height 1.05, Width 1.05, Depth 1.0
  Personality:   Authoritative, professional, occasionally suspicious.
  IdleStyle:     Standing at post, hand on radio, surveying area, occasional foot-tap
  WalkSpeed:     16
  Role:          Law enforcement. Issues fines in crime games. Guards banks and jails.
  Health:        150

── FIREFIGHTER ──
  Torso/Limbs:   BrickColor "Bright red"
  Head:          BrickColor "Pastel brown"
  Accessories:   Yellow firefighter helmet, oxygen tank on back, axe tool
  BodyScale:     Height 1.1, Width 1.15, Depth 1.1
  Personality:   Brave, selfless, urgently calm.
  IdleStyle:     Checking equipment, polishing helmet, listening to radio crackle
  WalkSpeed:     18
  Role:          Rescue NPC. Puts out fires. Saves trapped players in disaster maps.
  Health:        200

── DOCTOR ──
  Torso/Limbs:   BrickColor "White"
  Head:          BrickColor "Pastel brown"
  Accessories:   Stethoscope necklace, white lab coat look, clipboard prop
  BodyScale:     Height 1.0, Width 0.95, Depth 0.9
  Personality:   Calm, precise, clinical. Speaks in measured tones.
  IdleStyle:     Writing on clipboard, checking watch, thinking with hand on chin
  WalkSpeed:     14
  Role:          Heals players. Hospital desk NPC. Revives at medical station.
  Health:        100

── CHEF ──
  Torso/Limbs:   BrickColor "White"               (chef coat)
  Head:          BrickColor "Pastel brown"
  Accessories:   Tall chef hat, frying pan tool, apron
  BodyScale:     Height 0.95, Width 1.1, Depth 1.0  (slightly round)
  Personality:   Passionate, enthusiastic about food. Hot-tempered if cooking criticized.
  IdleStyle:     Stirring pot, taste-testing, chopping looped animation
  WalkSpeed:     14
  Role:          Food vendor. Sells meals that grant stat buffs. Cooking minigame hub.
  Health:        120

── BUSINESSMAN ──
  Torso/Limbs:   BrickColor "Dark grey"           (suit)
  Head:          BrickColor "Pastel brown"
  Accessories:   Tie accessory, briefcase tool, reading glasses
  BodyScale:     Height 1.05, Width 1.0, Depth 0.9
  Personality:   Stressed, efficient, always in a hurry. Checks watch constantly.
  IdleStyle:     Speed-walking, talking on phone prop, typing on laptop prop
  WalkSpeed:     20  (always rushing)
  Role:          Quest giver. Hires players for business missions in office/city games.
  Health:        80

══ FANTASY ARCHETYPES ══

── ELF ──
  Torso/Limbs:   BrickColor "Sand green"          (nature leather)
  Head:          BrickColor "Pastel yellow"        (ethereal pale)
  Accessories:   Pointed ear mesh accessory, leaf crown, elegant bow
  BodyScale:     Height 1.15, Width 0.8, Depth 0.8  (tall slender)
  Personality:   Graceful, carries ancient wisdom. Slightly condescending to non-elves.
  IdleStyle:     Gentle sway, wind-in-hair effect, communing-with-nature look
  WalkSpeed:     20  (unnaturally graceful)
  Role:          Forest guardian, archer ally, ancient lore keeper.
  Health:        150

── DWARF ──
  Torso/Limbs:   BrickColor "Reddish brown"       (iron armor with fur trim)
  Head:          BrickColor "Bright orange"        (ruddy complexion)
  Accessories:   Viking helmet, braided beard face accessory, battle axe
  BodyScale:     Height 0.7, Width 1.2, Depth 1.15  (short and very wide)
  Personality:   Stubborn, proud of strength and craftsmanship. Loud laughter.
  IdleStyle:     Patting belly, sharpening axe, thumping ground with weapon
  WalkSpeed:     12  (short legs)
  Role:          Mining NPC, blacksmith companion, tank fighter.
  Health:        350

── ORC ──
  Torso/Limbs:   BrickColor "Bright green"
  Head:          BrickColor "Bright green"
  Accessories:   Bone necklace, spiked shoulder pads, crude club
  BodyScale:     Height 1.15, Width 1.35, Depth 1.2  (massive hulk)
  Personality:   Aggressive but befriendable. Simple short sentences.
  IdleStyle:     Scratching head, pounding chest, growling, sniffing air
  WalkSpeed:     14  (lumbering)
  Role:          Enemy melee or neutral NPC in orc village. High damage output.
  Health:        400

── FAIRY ──
  Torso/Limbs:   BrickColor "Hot pink"
  Head:          BrickColor "Pastel yellow"
  Accessories:   Sprite wings pair, sparkle particle emitter, flower crown
  BodyScale:     Height 0.5, Width 0.5, Depth 0.5  (tiny, quarter size)
  Personality:   Bubbly, helpful, easily distracted by shiny things.
  IdleStyle:     Hovering via BodyPosition, spinning, leaving sparkle trail
  WalkSpeed:     0   (flies via BodyVelocity, flight speed 14)
  Role:          Companion fairy, guide NPC, buff dispenser, puzzle helper.
  Health:        30

── DEMON ──
  Torso/Limbs:   BrickColor "Really red"
  Head:          BrickColor "Really red"
  Accessories:   Horn accessories, tail accessory, dark wings, black eyes face decal
  BodyScale:     Height 1.2, Width 1.15, Depth 1.1
  Personality:   Sinister, manipulative. Uses formal archaic language.
  IdleStyle:     Floating slightly off ground, sweeping hand gestures, slow clap
  WalkSpeed:     16  (unhurried menace)
  Role:          Boss, dark quest giver, villain NPC in story maps.
  Health:        1000

── ANGEL ──
  Torso/Limbs:   BrickColor "White"
  Head:          BrickColor "Pastel yellow"
  Accessories:   Halo part above head, white wing accessories, PointLight glow
  BodyScale:     Height 1.15, Width 0.95, Depth 0.9
  Personality:   Serene, compassionate, prophetic. Never panics or raises voice.
  IdleStyle:     Hovering, wings slowly flap via Motor6D animation, radiant glow
  WalkSpeed:     0   (flies)
  Role:          Divine guide, resurrect ally, delivers divine quests.
  Health:        500  (scripted invincible)

── NECROMANCER ──
  Torso/Limbs:   BrickColor "Dark grey"           (dark robes)
  Head:          BrickColor "Institutional white"  (deathly pale)
  Accessories:   Skull staff, dark hood, bone necklace
  BodyScale:     Height 1.1, Width 0.8, Depth 0.8  (gaunt)
  Personality:   Obsessed with death. Eerily calm. Philosophical about undeath.
  IdleStyle:     Hands clasped behind back, bone-summoning hand gesture, purple particle swirl
  WalkSpeed:     10
  Role:          Boss NPC. Summons skeleton minions. Lair guardian.
  Health:        800
  Abilities:     Summon Skeleton (spawn 2-4 R6 skeleton NPCs), Death Bolt 50 dmg, Bone Shield absorb 1 hit

── PALADIN ──
  Torso/Limbs:   BrickColor "Bright yellow"       (gold-trimmed holy armor)
  Head:          BrickColor "Pastel brown"
  Accessories:   Holy helmet, divine sword, emblem shield
  BodyScale:     Height 1.1, Width 1.1, Depth 1.05
  Personality:   Righteous, intense conviction. Every sentence is a declaration of purpose.
  IdleStyle:     Kneeling in prayer, sword raised toward sky, golden aura particle
  WalkSpeed:     14
  Role:          Holy warrior ally. Buffed against demons and undead. Quest companion.
  Health:        400

══ SCI-FI ARCHETYPES ══

── SPACE SOLDIER ──
  Torso/Limbs:   BrickColor "Dark grey"           (combat armor)
  Head:          BrickColor "Dark grey"            (full helmet)
  Accessories:   Sci-fi helmet with visor decal, shoulder pads, assault rifle tool
  BodyScale:     Height 1.05, Width 1.1, Depth 1.05
  Personality:   Military precision. Short orders. Sector clear. Move out.
  IdleStyle:     At-ease stance, scanning with rifle raised, checking wrist display
  WalkSpeed:     18  (trained soldier)
  Role:          Guard, enemy soldier, faction fighter in space and military maps.
  Health:        200

── SCIENTIST ──
  Torso/Limbs:   BrickColor "White"               (lab coat)
  Head:          BrickColor "Pastel brown"
  Accessories:   Lab goggles, clipboard tool, beaker prop
  BodyScale:     Height 1.0, Width 0.9, Depth 0.85
  Personality:   Excited by discovery, nervous in danger. Uses technical vocabulary.
  IdleStyle:     Scribbling notes, examining samples, eureka head-raise gesture loop
  WalkSpeed:     14
  Role:          Quest giver in labs. Gives upgrade quests. Runs research station.
  Health:        80

── ALIEN ──
  Torso/Limbs:   BrickColor "Bright green" or BrickColor "Cyan"
  Head:          BrickColor matching torso (large oval via HeadScale 1.5)
  Accessories:   Large black eyes face decal, antennae accessories
  BodyScale:     Height 1.0, Width 0.8, Depth 0.75, HeadScale 1.5
  Personality:   Curious, studying humans, confused by idioms. Speaks formally.
  IdleStyle:     Head-tilt animation, scanning gesture, float 0.5 studs off ground
  WalkSpeed:     16
  Role:          Mysterious stranger, tech trader, or invasion enemy depending on context.
  Health:        120

── ROBOT ──
  Torso/Limbs:   BrickColor "Medium stone grey"  (metallic)
  Head:          BrickColor "Medium stone grey"
  Accessories:   Antenna on head, glowing eyes PointLight, chest panel decal
  BodyScale:     Height 1.0, Width 1.05, Depth 1.05
  Personality:   Literal and logical. Processes emotions incorrectly. Directive-speak.
  IdleStyle:     Rigid mechanical movement, head rotates independently, servo sounds
  WalkSpeed:     12  (mechanical gait)
  Role:          Factory worker, guard drone, companion assistant, repair bot.
  Health:        250

── CYBORG ──
  Torso/Limbs:   Mixed: one arm BrickColor "Medium stone grey" (metal), rest skin tone
  Head:          BrickColor "Pastel brown" with one glowing eye decal
  Accessories:   Mechanical arm accessory, cybernetic eye mesh, wire accessories
  BodyScale:     Height 1.05, Width 1.0, Depth 1.0
  Personality:   Conflicted between human emotion and machine logic. Introspective.
  IdleStyle:     Flexing metal arm, scanning with cyber eye, occasional system-reboot animation
  WalkSpeed:     18
  Role:          Anti-hero, enhanced soldier, bounty hunter, tech faction leader.
  Health:        300

══ HORROR ARCHETYPES ══

── ZOMBIE ──
  Torso/Limbs:   BrickColor "Bright green" mixed with "Sand green"  (rotting flesh)
  Head:          BrickColor "Bright green"
  Accessories:   Torn clothing decals, wound face decal
  BodyScale:     Height 0.95, Width 1.0, Depth 0.95
  Personality:   No dialog. Groans only. Attracted to movement and sound.
  IdleStyle:     Shambling in place, arms outstretched, head lolling side to side
  WalkSpeed:     6   (slow shuffle)
  Role:          Horde enemy. Spawns in waves. Low HP, high numbers.
  Health:        60
  Behavior:      Idle -> Detect radius 25 studs -> Chase -> Bite 15 dmg per 1.5 seconds

── GHOST ──
  Torso/Limbs:   BrickColor "White" with Transparency 0.5 on all parts
  Head:          BrickColor "White" Transparency 0.5
  Accessories:   None (floating, legless silhouette via hidden legs + BodyPosition hover)
  BodyScale:     Height 1.1, Width 0.8, Depth 0.6
  Personality:   Mournful, confused about own death. Whispers and echoes.
  IdleStyle:     Float 2 studs up, phase in-out Transparency tween 0.3 to 0.7, wailing sound
  WalkSpeed:     0   (drifts via BodyVelocity speed 8 toward target)
  Role:          Haunt enemy. Phases through walls CanCollide false. Jump scare mechanic.
  Health:        80  (vulnerable to light-based weapons)

── VAMPIRE ──
  Torso/Limbs:   BrickColor "Dark grey"           (elegant black cape look)
  Head:          BrickColor "Institutional white"  (deathly pale)
  Accessories:   Black cape accessory, fangs face decal, slicked hair accessory
  BodyScale:     Height 1.1, Width 0.9, Depth 0.85
  Personality:   Aristocratic, ancient, seductive menace. Formal archaic speech.
  IdleStyle:     Cape swirl animation, bow to no one, intense stare, bats circle overhead
  WalkSpeed:     20  (supernatural speed)
  Role:          Powerful enemy. Life-steal bite. Summons bat swarm AOE.
  Health:        500
  Abilities:     Bite life-steal 40 dmg plus heal self 20, Bat Swarm AOE 10 dmg, Mist Form invincible 3s

── WEREWOLF ──
  Torso/Limbs:   BrickColor "Reddish brown"       (brown fur)
  Head:          BrickColor "Reddish brown"
  Accessories:   Wolf snout face decal, claw accessories on hands, fur texture mesh
  BodyScale:     Height 1.2, Width 1.3, Depth 1.2  (hulking)
  Personality:   Feral in monster form, regretful human underneath. Howls at moon.
  IdleStyle:     Sniffing air, growling, digging at ground, howling with sound effect
  WalkSpeed:     28  (terrifyingly fast)
  Role:          Pack hunter. More dangerous at night. Transformation on moon phase trigger.
  Health:        450

── CLOWN ──
  Torso/Limbs:   Alternating BrickColor "Bright red" and "Bright yellow"
  Head:          BrickColor "White"
  Accessories:   Big red nose part, rainbow wig accessory, painted smile face decal
  BodyScale:     Height 1.0, Width 1.05, Depth 0.95
  Personality:   Unsettling cheerfulness. Laughs at wrong moments. Horror energy throughout.
  IdleStyle:     Juggling prop, exaggerated laugh, over-far head tilt, balloon pop sound
  WalkSpeed:     18  (erratic zigzag movement pattern)
  Role:          Horror enemy. Jump scare system. Unpredictable pathing confuses players.
  Health:        200

══ ANIMAL AND PET ARCHETYPES ══

── DOG ──
  Model type:    Custom mesh or block-built (4 legs, tail, snout parts)
  BrickColor:    "Reddish brown" or "Light orange" or "White"
  BodyScale:     Height 0.4, Width 0.6, Depth 1.0  (horizontal animal shape)
  Personality:   Loyal, excitable, devoted follower.
  IdleStyle:     Sit animation, tail wag (rotate tail Motor6D), panting, bark on interact
  WalkSpeed:     20
  Role:          Companion pet, guard dog, fetch quest minigame NPC.
  Health:        80

── CAT ──
  BrickColor:    "Dark grey" or "White" or "Bright orange"
  BodyScale:     Height 0.3, Width 0.45, Depth 0.85
  Personality:   Aloof, independent, occasionally deigns to acknowledge player.
  IdleStyle:     Sit and groom animation, slow blink, stretch, ignores player sometimes
  WalkSpeed:     18
  Role:          Ambient companion, luck mechanic where petting grants a buff.
  Health:        40

── HORSE ──
  Model type:    Multi-part body, 4 legs, neck, head, tail (minimum 10 parts)
  BrickColor:    "Reddish brown" or "Dark grey" or "White"
  BodyScale:     Height 1.6, Width 0.8, Depth 2.5  (large horizontal)
  Personality:   Noble, calm, reactive to threats.
  IdleStyle:     Head bob, tail swish, pawing ground, eating grass animation
  WalkSpeed:     0   (player mounts via Seat or custom mount system)
  Role:          Mount NPC. Press E to ride. Mounted WalkSpeed 40.
  Health:        300

── DRAGON ──
  Model type:    Multi-part custom build: body, neck, head, 4 legs, 2 wings, tail (25+ parts)
  BrickColor:    "Really red" or "Dark grey" or "Bright green" or "Royal purple"
  BodyScale:     Height 3.0, Width 2.0, Depth 5.0  (giant)
  Personality:   Ancient, territorial, hoards treasure. Respects demonstrated power.
  IdleStyle:     Smoke particle breath, wing stretch, surveying from high perch, tail lash
  WalkSpeed:     8   (ground) / flight via BodyVelocity speed 40
  Role:          Mega boss 10000 HP, or mount for special players, or ally quest giver.
  Health:        10000
  Abilities:     Flame Breath AOE 50 dmg per second for 3s, Wing Buffet knockback, Tail Sweep behind, Bite 200 dmg

── WOLF ──
  BrickColor:    "Medium stone grey" or "Dark grey"
  BodyScale:     Height 0.6, Width 0.65, Depth 1.2
  Personality:   Pack mentality. Lone wolves cautious, packs aggressive.
  IdleStyle:     Sniffing ground, ear-perk animation, howl triggers wolf sound effect
  WalkSpeed:     24  (predator speed)
  Role:          Forest enemy. Hunts in packs of 3-6. Alpha wolf has red PointLight eyes.
  Health:        120 regular / 300 alpha

── SPIDER ──
  Model type:    Sphere body, 8 thin cylinder legs via Motor6D hinges
  BrickColor:    "Really black"
  BodyScale:     Variable: small 0.3 for ambiance, giant 3.0 for boss
  Personality:   Ambush predator. Waits on ceiling via inverted CFrame.
  IdleStyle:     Leg-twitch animation, web-spinning gesture, drops from ceiling via Tween
  WalkSpeed:     30  (spiders are fast)
  Role:          Cave and dungeon enemy. Poison bite DoT 5 dmg per second for 10 seconds.
  Health:        80 small / 600 boss giant spider
`;

export const NPC_AI_BEHAVIORS: string = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3: AI BEHAVIOR PATTERNS — FULL STATE MACHINES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STATE MACHINE FRAMEWORK:
  Every NPC runs one active state at a time.
  States transition based on triggers (distance, HP, timer, events).
  Use a module with a currentState variable, tick-based update loop.
  Recommended tick rate: 0.1 seconds (10 Hz) for active combat, 0.5s for ambient NPCs.

LUAU STATE MACHINE BASE:
  local NPC_AI = {}
  NPC_AI.__index = NPC_AI

  function NPC_AI.new(npcModel, config)
    local self = setmetatable({}, NPC_AI)
    self.model = npcModel
    self.humanoid = npcModel:FindFirstChild("Humanoid")
    self.rootPart = npcModel.PrimaryPart
    self.state = "IDLE"
    self.target = nil
    self.config = config or {}
    self.stateTimer = 0
    self.lastAttackTime = 0
    self.waypoints = config.waypoints or {}
    self.waypointIndex = 1
    return self
  end

  function NPC_AI:setState(newState)
    self.state = newState
    self.stateTimer = 0
  end

  function NPC_AI:update(dt)
    self.stateTimer = self.stateTimer + dt
    if self.state == "IDLE" then self:updateIdle(dt)
    elseif self.state == "PATROL" then self:updatePatrol(dt)
    elseif self.state == "ALERT" then self:updateAlert(dt)
    elseif self.state == "CHASE" then self:updateChase(dt)
    elseif self.state == "ATTACK" then self:updateAttack(dt)
    elseif self.state == "FLEE" then self:updateFlee(dt)
    elseif self.state == "DEAD" then return
    end
  end

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEHAVIOR 1: PATROL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PURPOSE: NPC walks between a list of waypoints indefinitely.

STATE FLOW:
  IDLE (wait at waypoint, 2-5 seconds)
    -> timer expires -> MOVE_TO_NEXT (walk to next waypoint)
  MOVE_TO_NEXT
    -> arrived (within 2 studs) -> IDLE at next waypoint
    -> player detected within detectionRadius -> ALERT

EXACT NUMBERS:
  waitTime at each waypoint:   math.random(2, 5) seconds
  detectionRadius:             30 studs
  arrivalThreshold:            2 studs (close enough = arrived)
  returnToStartOnDisplace:     if distance from waypoint loop > 100 studs, teleport to first waypoint
  faceDirection:               humanoid auto-rotate, or manually set CFrame during movement

LUAU IMPLEMENTATION:
  local PathfindingService = game:GetService("PathfindingService")

  local function patrolNPC(npcModel, waypointPositions)
    local hum = npcModel:FindFirstChild("Humanoid")
    local root = npcModel.PrimaryPart
    local currentWP = 1
    local waitTimer = 0
    local waiting = true
    local waitDuration = math.random(2, 5)

    local function moveToWaypoint(index)
      local path = PathfindingService:CreatePath({
        AgentRadius = 2,
        AgentHeight = 5,
        AgentCanJump = true,
        AgentCanClimb = false,
      })
      local success, err = pcall(function()
        path:ComputeAsync(root.Position, waypointPositions[index])
      end)
      if success and path.Status == Enum.PathStatus.Success then
        local waypoints = path:GetWaypoints()
        for _, wp in ipairs(waypoints) do
          if wp.Action == Enum.PathWaypointAction.Jump then
            hum.Jump = true
          end
          hum:MoveTo(wp.Position)
          local reached = hum.MoveToFinished:Wait(5)
          if not reached then break end
        end
      end
    end

    game:GetService("RunService").Heartbeat:Connect(function(dt)
      if waiting then
        waitTimer = waitTimer + dt
        if waitTimer >= waitDuration then
          waiting = false
          waitTimer = 0
          waitDuration = math.random(2, 5)
          currentWP = (currentWP % #waypointPositions) + 1
          moveToWaypoint(currentWP)
          waiting = true
        end
      end

      -- Detection check
      for _, player in ipairs(game.Players:GetPlayers()) do
        local char = player.Character
        if char and char.PrimaryPart then
          local dist = (char.PrimaryPart.Position - root.Position).Magnitude
          if dist <= 30 then
            -- Transition to ALERT state
          end
        end
      end
    end)
  end

PATROL VARIANTS:
  Loop patrol:      1 → 2 → 3 → 4 → 1 → 2 ...  (cycle through array)
  Ping-pong patrol: 1 → 2 → 3 → 4 → 3 → 2 → 1  (reverse at ends)
  Random patrol:    pick random waypoint from list each time, no repetition until all visited
  Guard post:       only one waypoint, NPC stands there and slowly rotates 360 degrees every 10s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEHAVIOR 2: GUARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PURPOSE: Stands at designated post. Detects and confronts threats.

STATE FLOW:
  IDLE (stand at post, rotate slowly)
    -> player enters detection radius 40 studs -> ALERT
  ALERT (face player, play alert sound, hold 2s)
    -> player leaves 60+ studs -> IDLE (return to post)
    -> player stays/approaches closer than 20 studs -> CHASE
  CHASE (pathfind toward target)
    -> target within attack range 5 studs -> ATTACK
    -> target > 50 studs from post -> RETURN_TO_POST
  ATTACK (play attack animation, deal damage)
    -> attack cooldown 1.5s -> back to CHASE
    -> target dies or teleports away -> IDLE
  RETURN_TO_POST (walk back to original post position)
    -> arrived -> IDLE

EXACT NUMBERS:
  postPosition:         Vector3 saved on spawn
  detectionRadius:      40 studs
  alertRadius:          20 studs (triggers chase immediately)
  chaseAbandonDist:     50 studs from post (guard wont chase infinitely)
  attackRange:          5 studs
  attackDamage:         20
  attackCooldown:       1.5 seconds
  alertHoldTime:        2 seconds before chasing
  returnSpeed:          same as WalkSpeed
  facingRotationSpeed:  360 degrees per 10 seconds while idle

LUAU GUARD STATE MACHINE:
  function GuardAI:updateIdle(dt)
    -- Slow rotation
    self.rootPart.CFrame = self.rootPart.CFrame * CFrame.Angles(0, math.rad(3) * dt, 0)
    -- Detection
    local target = self:findClosestPlayer(40)
    if target then
      self:setState("ALERT")
      self.target = target
      -- Play alert sound
      local sound = Instance.new("Sound")
      sound.SoundId = "rbxassetid://131961136"
      sound.Parent = self.rootPart
      sound:Play()
      game:GetService("Debris"):AddItem(sound, 3)
    end
  end

  function GuardAI:updateAlert(dt)
    if self.target then
      -- Face target
      local lookDir = (self.target.Position - self.rootPart.Position)
      lookDir = Vector3.new(lookDir.X, 0, lookDir.Z).Unit
      self.rootPart.CFrame = CFrame.new(self.rootPart.Position, self.rootPart.Position + lookDir)
      local dist = (self.target.Position - self.rootPart.Position).Magnitude
      if dist < 20 or self.stateTimer >= 2 then
        self:setState("CHASE")
      elseif dist > 60 then
        self:setState("IDLE")
        self.target = nil
      end
    end
  end

  function GuardAI:updateChase(dt)
    if not self.target then self:setState("IDLE") return end
    local distFromPost = (self.rootPart.Position - self.postPosition).Magnitude
    if distFromPost > 50 then
      self:setState("RETURN_TO_POST")
      return
    end
    local dist = (self.target.Position - self.rootPart.Position).Magnitude
    if dist <= 5 then
      self:setState("ATTACK")
    else
      self.humanoid:MoveTo(self.target.Position)
    end
  end

  function GuardAI:updateAttack(dt)
    local now = tick()
    if now - self.lastAttackTime >= 1.5 then
      -- Deal damage
      local targetHum = self.target.Parent:FindFirstChild("Humanoid")
      if targetHum then
        targetHum:TakeDamage(20)
      end
      self.lastAttackTime = now
      -- Play attack animation
    end
    local dist = (self.target.Position - self.rootPart.Position).Magnitude
    if dist > 8 then
      self:setState("CHASE")
    end
    if not self.target or self.target.Parent == nil then
      self:setState("IDLE")
    end
  end

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEHAVIOR 3: MERCHANT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PURPOSE: Stands at stall, faces approaching players, opens shop GUI on interaction.

STATE FLOW:
  IDLE_AT_STALL (play idle animation, face stall direction)
    -> player within 10 studs -> GREET (face player, play greeting animation, show prompt)
  GREET
    -> player presses E or clicks -> OPEN_SHOP (fire GUI open RemoteEvent)
    -> player leaves 15+ studs -> IDLE_AT_STALL
  OPEN_SHOP
    -> GUI closed event -> IDLE_AT_STALL

EXACT NUMBERS:
  greetRadius:          10 studs
  leaveRadius:          15 studs
  interactKey:          "E" (ProximityPrompt or keybind)
  restockInterval:      600 seconds (10 minutes)
  stockCapacity:        varies per item (potions: 99, rare items: 1-5)

PROXIMITY PROMPT SETUP:
  local prompt = Instance.new("ProximityPrompt")
  prompt.ActionText = "Shop"
  prompt.ObjectText = merchantName
  prompt.KeyboardKeyCode = Enum.KeyCode.E
  prompt.MaxActivationDistance = 10
  prompt.Parent = npcModel.PrimaryPart

  prompt.Triggered:Connect(function(player)
    openShopForPlayer(player, shopInventory)
  end)

SHOP GUI STRUCTURE:
  ScreenGui (ResetOnSpawn=false)
    Frame (main panel, 400x500, centered)
      TextLabel (shop name at top)
      ScrollingFrame (item list)
        For each item:
          Frame (item row, 400x60)
            ImageLabel (item icon, 50x50)
            TextLabel (item name)
            TextLabel (price)
            TextButton ("Buy") -> fires BuyItem remote
      TextButton ("Close") -> hides GUI

MERCHANT RESTOCK LOGIC:
  local function restockMerchant(merchantData)
    for itemName, stockData in pairs(merchantData.inventory) do
      stockData.currentStock = stockData.maxStock
    end
    merchantData.lastRestock = tick()
  end

  game:GetService("RunService").Heartbeat:Connect(function()
    if tick() - merchantData.lastRestock >= 600 then
      restockMerchant(merchantData)
    end
  end)

CLOSE AT NIGHT VARIANT:
  If game has day/night cycle:
    if LightingService.ClockTime >= 20 or LightingService.ClockTime < 6 then
      merchantData.isOpen = false
      showClosedSign()
      prompt.Enabled = false
    else
      merchantData.isOpen = true
      prompt.Enabled = true
    end

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEHAVIOR 4: QUEST GIVER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PURPOSE: Idle near location, show quest indicator, give/track/complete quests.

STATE FLOW:
  IDLE (wander within 5 studs of home, show "!" if quest available)
    -> player within 8 studs AND quest available -> AVAILABLE (face player, pulse "!")
    -> player within 8 studs AND quest in progress -> IN_PROGRESS (face player, show "?")
    -> player within 8 studs AND quest completable -> COMPLETABLE (face player, pulse "!")
  AVAILABLE
    -> player interacts -> open quest dialog -> give quest -> NO_QUEST state
  IN_PROGRESS
    -> player interacts -> show progress dialog ("You killed 3/5 wolves")
  COMPLETABLE
    -> player interacts -> reward dialog -> complete quest -> NO_QUEST
  NO_QUEST
    -> idle wander near home, no indicator shown
    -> questRespawnTime expires -> quest available again -> IDLE

QUEST INDICATOR (Billboard GUI above head):
  local billboard = Instance.new("BillboardGui")
  billboard.Size = UDim2.new(0, 40, 0, 40)
  billboard.StudsOffset = Vector3.new(0, 3, 0)
  billboard.AlwaysOnTop = true
  billboard.Parent = npcModel.Head

  local indicator = Instance.new("TextLabel")
  indicator.Size = UDim2.fromScale(1, 1)
  indicator.BackgroundTransparency = 1
  indicator.TextScaled = true
  indicator.Font = Enum.Font.GothamBold
  indicator.Parent = billboard

  -- "!" for new quest (yellow), "?" for in progress (grey), "!" for completable (gold/green)
  local function updateIndicator(state)
    if state == "AVAILABLE" then
      indicator.Text = "!"
      indicator.TextColor3 = Color3.fromRGB(255, 215, 0)
      billboard.Enabled = true
    elseif state == "IN_PROGRESS" then
      indicator.Text = "?"
      indicator.TextColor3 = Color3.fromRGB(180, 180, 180)
      billboard.Enabled = true
    elseif state == "COMPLETABLE" then
      indicator.Text = "!"
      indicator.TextColor3 = Color3.fromRGB(0, 255, 100)
      billboard.Enabled = true
    else
      billboard.Enabled = false
    end
  end

PULSE ANIMATION FOR INDICATOR:
  local TweenService = game:GetService("TweenService")
  local function pulseIndicator()
    local tween = TweenService:Create(indicator,
      TweenInfo.new(0.8, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true),
      {TextTransparency = 0.3}
    )
    tween:Play()
    return tween
  end

QUEST DATA STRUCTURE:
  {
    id = "kill_wolves_01",
    name = "Wolf Problem",
    description = "Kill 5 wolves in the forest.",
    objectives = {
      { type = "KILL", target = "Wolf", count = 5, current = 0 }
    },
    rewards = {
      { type = "GOLD", amount = 100 },
      { type = "XP",   amount = 250 },
      { type = "ITEM", itemId = "IronSword", quantity = 1 }
    },
    prerequisites = {},      -- quest IDs that must be completed first
    repeatable = false,
    respawnTime = 0,         -- 0 = not repeatable
    giverId = "blacksmith_01"
  }

QUEST TRACKING (per player, stored in DataStore or session):
  playerQuestData = {
    active   = { questId = progressTable },
    completed = { questId = true },
  }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEHAVIOR 5: ENEMY MELEE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PURPOSE: Idles, detects players, chases, attacks in melee range. Classic enemy loop.

STATE FLOW:
  IDLE
    -> player within detectionRadius 40 studs AND line-of-sight -> CHASE
  CHASE (pathfind to target, recompute path every 2 seconds)
    -> target within attackRange 5 studs -> ATTACK
    -> target > leashRadius 80 studs away from spawn -> RETURN
    -> target dead or gone -> IDLE
  ATTACK (play attack animation, apply damage, enter cooldown)
    -> attackCooldown 1.5s expires AND target still in range -> ATTACK again
    -> target moves out of range > 8 studs -> CHASE
    -> self HP <= 0 -> DEAD
  RETURN (walk back to spawn position)
    -> arrived (within 3 studs) -> IDLE with full HP regen
  DEAD (play death animation, drop loot, despawn after 5 seconds)

EXACT NUMBERS:
  detectionRadius:   40 studs
  attackRange:       5 studs (melee)
  attackDamage:      20 per hit (scales with level: baseAtkDmg * (1 + (level-1) * 0.15))
  attackCooldown:    1.5 seconds
  leashRadius:       80 studs from spawn
  pathRecomputeRate: every 2 seconds (not every frame)
  despawnTime:       5 seconds after death
  regenRate:         full HP regen when returning to spawn (HP regen not during combat)

LUAU MELEE ENEMY FULL SCRIPT:
  local RunService = game:GetService("RunService")
  local PathfindingService = game:GetService("PathfindingService")

  local function createMeleeEnemy(model, config)
    local hum = model:FindFirstChild("Humanoid")
    local root = model.PrimaryPart
    local spawnPos = root.Position
    local state = "IDLE"
    local target = nil
    local lastAttack = 0
    local lastPathCompute = 0

    local function findTarget()
      local closestDist = config.detectionRadius or 40
      local closestPlayer = nil
      for _, plr in ipairs(game.Players:GetPlayers()) do
        local char = plr.Character
        if char and char.PrimaryPart and char:FindFirstChild("Humanoid") and char.Humanoid.Health > 0 then
          local d = (char.PrimaryPart.Position - root.Position).Magnitude
          if d < closestDist then
            closestDist = d
            closestPlayer = char
          end
        end
      end
      return closestPlayer
    end

    local function computePathTo(pos)
      local path = PathfindingService:CreatePath({
        AgentRadius = 2, AgentHeight = 5,
        AgentCanJump = true, WaypointSpacing = 4
      })
      local ok = pcall(function() path:ComputeAsync(root.Position, pos) end)
      if ok and path.Status == Enum.PathStatus.Success then
        for _, wp in ipairs(path:GetWaypoints()) do
          if wp.Action == Enum.PathWaypointAction.Jump then hum.Jump = true end
          hum:MoveTo(wp.Position)
          local arrived = hum.MoveToFinished:Wait(3)
          if not arrived or state ~= "CHASE" then break end
        end
      end
    end

    hum.Died:Connect(function()
      state = "DEAD"
      -- Drop loot
      task.delay(5, function() model:Destroy() end)
    end)

    RunService.Heartbeat:Connect(function(dt)
      if state == "IDLE" then
        local found = findTarget()
        if found then target = found; state = "CHASE" end

      elseif state == "CHASE" then
        if not target or target.Parent == nil then state = "IDLE"; target = nil; return end
        local dist = (target.PrimaryPart.Position - root.Position).Magnitude
        local distFromSpawn = (root.Position - spawnPos).Magnitude
        if distFromSpawn > (config.leashRadius or 80) then
          state = "RETURN"; target = nil; return
        end
        if dist <= (config.attackRange or 5) then
          state = "ATTACK"; return
        end
        if tick() - lastPathCompute >= 2 then
          lastPathCompute = tick()
          task.spawn(computePathTo, target.PrimaryPart.Position)
        end

      elseif state == "ATTACK" then
        if not target or target.Parent == nil then state = "IDLE"; return end
        local dist = (target.PrimaryPart.Position - root.Position).Magnitude
        if dist > 8 then state = "CHASE"; return end
        if tick() - lastAttack >= (config.attackCooldown or 1.5) then
          lastAttack = tick()
          local th = target:FindFirstChild("Humanoid")
          if th then th:TakeDamage(config.damage or 20) end
        end

      elseif state == "RETURN" then
        hum:MoveTo(spawnPos)
        local d = (root.Position - spawnPos).Magnitude
        if d < 3 then
          state = "IDLE"
          hum.Health = hum.MaxHealth  -- full regen
        end
      end
    end)
  end

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEHAVIOR 6: ENEMY RANGED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PURPOSE: Detects players, chases to preferred range, shoots projectiles, retreats if too close.

STATE FLOW:
  IDLE -> detect player within 60 studs -> CHASE_TO_RANGE
  CHASE_TO_RANGE (close gap to 30-50 studs)
    -> in preferred range -> SHOOT
    -> player too close < 15 studs -> RETREAT
  SHOOT (face target, fire projectile every shootCooldown)
    -> player < 15 studs -> RETREAT
    -> player > 70 studs -> CHASE_TO_RANGE
  RETREAT (move away from player, maintain 20+ studs)
    -> player > 20 studs -> SHOOT
  RETURN_TO_SPAWN -> if leash broken

EXACT NUMBERS:
  detectionRadius:     60 studs
  preferredRangeMin:   25 studs
  preferredRangeMax:   50 studs
  retreatTriggerDist:  15 studs  (player too close)
  retreatTargetDist:   25 studs  (retreat until this far)
  shootCooldown:       2 seconds
  projectileSpeed:     80 studs/second
  projectileDamage:    25
  projectileLifetime:  5 seconds (despawn if no hit)
  leashRadius:         100 studs from spawn

PROJECTILE SYSTEM:
  local function fireProjectile(origin, direction, damage, speed, lifetime)
    local projectile = Instance.new("Part")
    projectile.Name = "EnemyProjectile"
    projectile.Size = Vector3.new(0.3, 0.3, 1.5)
    projectile.BrickColor = BrickColor.new("Really red")
    projectile.Material = Enum.Material.Neon
    projectile.CanCollide = false
    projectile.CastShadow = false
    projectile.CFrame = CFrame.new(origin, origin + direction)
    projectile.Parent = workspace

    local vel = Instance.new("LinearVelocity")
    vel.Attachment0 = Instance.new("Attachment", projectile)
    vel.VectorVelocity = direction.Unit * speed
    vel.MaxForce = math.huge
    vel.Parent = projectile

    local function onTouch(hit)
      local char = hit.Parent
      if char then
        local hum = char:FindFirstChild("Humanoid")
        if hum and hum.Health > 0 then
          hum:TakeDamage(damage)
          projectile:Destroy()
        end
      end
    end
    projectile.Touched:Connect(onTouch)
    game:GetService("Debris"):AddItem(projectile, lifetime)
  end

RANGED RETREAT LOGIC:
  function RangedAI:updateRetreat(dt)
    if not self.target then self:setState("IDLE") return end
    local toTarget = self.target.PrimaryPart.Position - self.rootPart.Position
    local dist = toTarget.Magnitude
    if dist > 25 then
      self:setState("SHOOT")
      return
    end
    -- Move away from player
    local awayDir = -toTarget.Unit
    local retreatPos = self.rootPart.Position + awayDir * 10
    self.humanoid:MoveTo(retreatPos)
  end

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEHAVIOR 7: BOSS ENEMY (MULTI-PHASE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PURPOSE: Complex boss with multiple phases, special attacks, invincibility frames, arena mechanics.

PHASE THRESHOLDS:
  Phase 1: HP > 75%   Normal attacks. WalkSpeed 14.
  Phase 2: HP 50-75%  New attack unlocked. WalkSpeed 16. Visual change (color shift).
  Phase 3: HP 25-50%  AOE slam added. WalkSpeed 18. Music changes.
  Phase 4: HP < 25%   Enrage. All attacks faster. WalkSpeed 22. Invincibility frames between attacks.

PHASE TRANSITION:
  local function checkPhaseTransition(boss)
    local hpPercent = boss.humanoid.Health / boss.humanoid.MaxHealth
    local newPhase = 1
    if hpPercent <= 0.25 then newPhase = 4
    elseif hpPercent <= 0.50 then newPhase = 3
    elseif hpPercent <= 0.75 then newPhase = 2
    end
    if newPhase ~= boss.currentPhase then
      boss.currentPhase = newPhase
      onPhaseChange(boss, newPhase)
    end
  end

  local function onPhaseChange(boss, newPhase)
    -- Invincibility during transition
    boss.humanoid.MaxHealth = boss.humanoid.MaxHealth  -- no actual invincibility trick:
    -- Use: tags["Invincible"] = true for 3 seconds, TakeDamage returns 0 if invincible
    boss.invincible = true
    task.delay(3, function() boss.invincible = false end)

    -- Visual change
    for _, part in ipairs(boss.model:GetDescendants()) do
      if part:IsA("BasePart") then
        if newPhase == 2 then part.BrickColor = BrickColor.new("Bright orange")
        elseif newPhase == 3 then part.BrickColor = BrickColor.new("Really red")
        elseif newPhase == 4 then
          part.BrickColor = BrickColor.new("Dark red")
          local neonLight = Instance.new("PointLight")
          neonLight.Brightness = 3
          neonLight.Color = Color3.fromRGB(255, 50, 0)
          neonLight.Range = 20
          neonLight.Parent = part
        end
      end
    end

    -- Speed change
    local speeds = {14, 16, 18, 22}
    boss.humanoid.WalkSpeed = speeds[newPhase]

    -- Announce phase (BillboardGui or screen message)
    announcePhase(newPhase)
  end

BOSS ATTACK POOL:
  Phase 1: BasicMelee (20 dmg, 1.5s cooldown), ChargeAttack (40 dmg forward dash)
  Phase 2: + GroundSlam (AOE 30 dmg, 8 stud radius, telegraphed 1.5s before)
  Phase 3: + ProjectileBarrage (5 shots in spread, 15 dmg each, 3s cooldown)
  Phase 4: + DeathNova (on taking damage chance 20%: AOE 50 dmg 15 stud radius)

BOSS ATTACK SELECTION:
  local attackWeights = {
    ["BasicMelee"]         = 40,
    ["ChargeAttack"]       = 20,
    ["GroundSlam"]         = 25,  -- only phase 2+
    ["ProjectileBarrage"]  = 15,  -- only phase 3+
  }

  local function selectAttack(boss)
    local available = {}
    local total = 0
    for name, weight in pairs(attackWeights) do
      if isAttackAvailable(boss, name) then
        table.insert(available, {name=name, weight=weight})
        total = total + weight
      end
    end
    local roll = math.random(1, total)
    local cumulative = 0
    for _, entry in ipairs(available) do
      cumulative = cumulative + entry.weight
      if roll <= cumulative then return entry.name end
    end
  end

GROUND SLAM TELEGRAPH:
  local function groundSlam(bossRoot, damage, radius)
    -- Warning ring on floor
    local ring = Instance.new("Part")
    ring.Shape = Enum.PartType.Cylinder
    ring.Size = Vector3.new(0.2, radius*2, radius*2)
    ring.CFrame = CFrame.new(bossRoot.Position.X, 0.1, bossRoot.Position.Z)
              * CFrame.Angles(0, 0, math.pi/2)
    ring.Anchored = true
    ring.CanCollide = false
    ring.BrickColor = BrickColor.new("Bright red")
    ring.Material = Enum.Material.Neon
    ring.Transparency = 0.5
    ring.Parent = workspace

    -- Wait for telegraph duration
    task.wait(1.5)

    -- Deal damage in radius
    for _, player in ipairs(game.Players:GetPlayers()) do
      local char = player.Character
      if char and char.PrimaryPart then
        local dist = (char.PrimaryPart.Position - bossRoot.Position).Magnitude
        if dist <= radius then
          local hum = char:FindFirstChild("Humanoid")
          if hum then hum:TakeDamage(damage) end
        end
      end
    end

    -- Cleanup
    ring:Destroy()
  end

ENRAGE TIMER:
  If boss fight exceeds X minutes, trigger enrage:
  enrageTime = 600 -- 10 minutes
  If tick() - fightStartTime > enrageTime:
    boss.isEnraged = true
    boss.humanoid.WalkSpeed = boss.humanoid.WalkSpeed * 1.5
    All damage multiplied by 2
    boss model flashes red rapidly

INVINCIBILITY FRAME IMPLEMENTATION:
  -- Override TakeDamage using Humanoid HealthChanged event instead
  -- Or: use a BindableFunction that other scripts call instead of TakeDamage directly
  local function bossTakeDamage(boss, amount)
    if boss.invincible then return end
    boss.humanoid:TakeDamage(amount)
    checkPhaseTransition(boss)
  end

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEHAVIOR 8: AMBIENT NPC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PURPOSE: Brings life to the world. Wanders, sits, interacts with objects, talks to other NPCs.

STATE FLOW:
  WANDER (pick random point within homeRadius 20 studs, walk there, wait 3-8s, repeat)
  SIT (walk to nearest bench/chair, sit animation via CFrame, wait 10-30s, stand)
  TALK_TO_NPC (walk to nearest ambient NPC within 15 studs, face each other, both play talk animation for 5-10s)
  INTERACT_OBJECT (walk to prop like well/mailbox/sign, play use animation, wait 3-5s)

WANDER LOGIC:
  local function getWanderTarget(homePos, radius)
    local angle = math.random() * math.pi * 2
    local dist  = math.random(5, radius)
    local offset = Vector3.new(math.cos(angle)*dist, 0, math.sin(angle)*dist)
    local target = homePos + offset
    -- Raycast down to find ground
    local ray = workspace:Raycast(target + Vector3.new(0,50,0), Vector3.new(0,-100,0))
    if ray then
      return Vector3.new(target.X, ray.Position.Y, target.Z)
    end
    return homePos
  end

  local function ambientLoop(npc)
    local homePos = npc.PrimaryPart.Position
    while true do
      local target = getWanderTarget(homePos, 20)
      npc:FindFirstChild("Humanoid"):MoveTo(target)
      npc.Humanoid.MoveToFinished:Wait(10)
      task.wait(math.random(3, 8))
    end
  end
  task.spawn(ambientLoop, npcModel)

SIT BEHAVIOR:
  local function sitOnObject(npc, seatPart)
    local hum = npc:FindFirstChild("Humanoid")
    -- Walk to seat
    hum:MoveTo(seatPart.Position)
    hum.MoveToFinished:Wait(8)
    -- Sit animation via CFrame manipulation
    npc:SetPrimaryPartCFrame(seatPart.CFrame * CFrame.new(0, 1, 0))
    hum.WalkSpeed = 0
    hum.JumpHeight = 0
    task.wait(math.random(10, 30))
    hum.WalkSpeed = 16
    hum.JumpHeight = 7.2
  end

NPC TO NPC CONVERSATION:
  local function talkToNearbyNPC(npc1, allAmbientNPCs)
    for _, npc2 in ipairs(allAmbientNPCs) do
      if npc2 ~= npc1 then
        local dist = (npc1.PrimaryPart.Position - npc2.PrimaryPart.Position).Magnitude
        if dist <= 15 then
          -- Both face each other
          local dir1 = (npc2.PrimaryPart.Position - npc1.PrimaryPart.Position).Unit
          npc1.PrimaryPart.CFrame = CFrame.new(npc1.PrimaryPart.Position, npc1.PrimaryPart.Position + dir1)
          local dir2 = -dir1
          npc2.PrimaryPart.CFrame = CFrame.new(npc2.PrimaryPart.Position, npc2.PrimaryPart.Position + dir2)
          -- Play talk animations on both
          task.wait(math.random(5, 10))
          break
        end
      end
    end
  end

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEHAVIOR 9: FOLLOWER / COMPANION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PURPOSE: Follows assigned player, assists in combat, teleports if too far behind.

STATE FLOW:
  FOLLOW (maintain 5-8 studs behind player)
    -> enemy within 20 studs -> ASSIST_COMBAT
    -> player > 50 studs away -> TELEPORT_TO_PLAYER
    -> player dismisses -> IDLE_AT_LOCATION
  ASSIST_COMBAT (attack nearest enemy targeting player)
    -> enemy dead or out of range -> FOLLOW
  TELEPORT_TO_PLAYER
    -> teleport to 5 studs behind player -> FOLLOW

FOLLOW OFFSET CALCULATION:
  local function getFollowPosition(playerRoot)
    local backDir = -playerRoot.CFrame.LookVector
    return playerRoot.Position + backDir * 6 + Vector3.new(0, 0, 0)
  end

  function FollowerAI:updateFollow(dt)
    local playerRoot = self.owner.Character and self.owner.Character.PrimaryPart
    if not playerRoot then return end

    local dist = (self.rootPart.Position - playerRoot.Position).Magnitude

    -- Teleport if very far
    if dist > 50 then
      local teleportPos = getFollowPosition(playerRoot)
      self.model:SetPrimaryPartCFrame(CFrame.new(teleportPos))
      return
    end

    -- Move toward follow position
    if dist > 8 then
      local target = getFollowPosition(playerRoot)
      self.humanoid:MoveTo(target)
    else
      self.humanoid:MoveTo(self.rootPart.Position)  -- stop in place
    end

    -- Check for nearby enemies
    for _, enemy in ipairs(getActiveEnemies()) do
      local enemyDist = (enemy.PrimaryPart.Position - self.rootPart.Position).Magnitude
      if enemyDist < 20 then
        self.target = enemy
        self:setState("ASSIST_COMBAT")
        return
      end
    end
  end

OBSTACLE AVOIDANCE:
  Companions use PathfindingService with same settings as enemies.
  Recompute path every 1 second instead of 2 for tighter following.
  If stuck for >3 seconds (position unchanged by < 0.5 studs): teleport to follow position.

  local lastPos = Vector3.zero
  local stuckTimer = 0
  RunService.Heartbeat:Connect(function(dt)
    if (rootPart.Position - lastPos).Magnitude < 0.5 then
      stuckTimer = stuckTimer + dt
      if stuckTimer > 3 then
        -- Teleport
        stuckTimer = 0
      end
    else
      stuckTimer = 0
      lastPos = rootPart.Position
    end
  end)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEHAVIOR 10: SHOPKEEPER (FULL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GREET SYSTEM:
  Detect player within 12 studs.
  Pick greeting line based on player visit count:
    First visit:   "Welcome, new friend! Take a look around."
    Return visit:  "Good to see you again! I just restocked."
    After purchase: "Excellent choice. Come back anytime."
  Play greeting animation (wave or nod).
  Show speech bubble via SurfaceGui or BillboardGui briefly (3 seconds).

HAGGLE SYSTEM (optional):
  If player presses "Haggle" button in shop GUI:
  - Random chance based on Charisma stat (if game has stats):
    Success (30% base): item cost reduced by 10-25%
    Failure (70%):      NPC "offended," price increases 5% for this session
  - Can only haggle once per item per shop visit
  - Charisma modifier: +5% success per charisma point above 10

RESTOCK SYSTEM:
  Items restock individually based on item rarity:
    Common items:     restock every 10 minutes, max stock 99
    Uncommon items:   restock every 30 minutes, max stock 10
    Rare items:       restock every 2 hours, max stock 3
    Unique items:     restock only on server restart, max stock 1

  local RESTOCK_TIMES = {
    Common   = 600,
    Uncommon = 1800,
    Rare     = 7200,
    Unique   = math.huge,
  }
`;

export const NPC_DIALOG: string = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4: DIALOG SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

── DIALOG TREE STRUCTURE ──

A dialog tree is a directed graph where each NODE has:
  id          unique string identifier
  text        what the NPC says
  speaker     NPC name (for multi-character cutscenes)
  portrait    optional image asset ID for character portrait
  choices     array of CHOICE objects (empty = end of conversation)
  actions     array of ACTIONS to execute when this node is reached
  conditions  array of CONDITIONS that must be true to show this node

A CHOICE object:
  text          what the player sees as a button
  nextNodeId    which node to go to when selected
  conditions    conditions that must be true to show this choice
  actions       actions to execute when this choice is selected

LUAU DIALOG DATA EXAMPLE:
  local dialogTree = {
    nodes = {
      ["start"] = {
        id = "start",
        text = "Welcome, traveler. I have been expecting someone of your... caliber.",
        speaker = "Wizard Aldren",
        choices = {
          { text = "What do you need?",          nextNodeId = "need_help",   conditions = {} },
          { text = "Who are you?",               nextNodeId = "who_are_you", conditions = {} },
          { text = "I am busy. Farewell.",        nextNodeId = "farewell",    conditions = {} },
          { text = "I completed the task.",       nextNodeId = "quest_done",
            conditions = { {type="QUEST_COMPLETE", questId="retrieve_tome"} } },
        }
      },
      ["need_help"] = {
        id = "need_help",
        text = "My ancient tome was stolen by goblins in the eastern cave. Retrieve it and I shall reward you handsomely.",
        choices = {
          { text = "I will find it.",  nextNodeId = "accept_quest",
            conditions = { {type="QUEST_NOT_ACTIVE", questId="retrieve_tome"} }
          },
          { text = "Already on it.",   nextNodeId = "already_active",
            conditions = { {type="QUEST_ACTIVE", questId="retrieve_tome"} }
          },
          { text = "Not interested.",  nextNodeId = "farewell", conditions = {} },
        },
      },
      ["accept_quest"] = {
        id = "accept_quest",
        text = "Splendid! The cave is north of the old mill. Be wary — the goblin shaman is cunning.",
        actions = { {type="START_QUEST", questId="retrieve_tome"} },
        choices = {
          { text = "Understood.",  nextNodeId = "farewell", conditions = {} },
        }
      },
      ["quest_done"] = {
        id = "quest_done",
        text = "You found it! Extraordinary. Here is your reward, as promised.",
        actions = {
          { type = "COMPLETE_QUEST", questId = "retrieve_tome" },
          { type = "GIVE_ITEM",      itemId = "WizardStaff", quantity = 1 },
          { type = "GIVE_GOLD",      amount = 500 },
          { type = "GIVE_XP",        amount = 1000 },
        },
        choices = {
          { text = "Thank you.",  nextNodeId = "farewell", conditions = {} },
        }
      },
      ["farewell"] = {
        id = "farewell",
        text = "Safe travels, adventurer.",
        choices = {}  -- empty = close dialog
      },
    },
    startNode = "start",
  }

── CONDITION TYPES ──
  QUEST_NOT_STARTED    questId not in player quest data
  QUEST_ACTIVE         questId is in player active quests
  QUEST_COMPLETE       questId is in player completed quests
  HAS_ITEM             player has item in inventory (itemId, quantity)
  STAT_GTE             player stat >= value (stat="level", value=10)
  STAT_LTE             player stat <= value
  REPUTATION_GTE       player reputation with faction >= value
  FIRST_TALK           player has never talked to this NPC before
  TIME_OF_DAY          LightingService.ClockTime in range (min, max)
  FLAG_SET             player has flag set (arbitrary boolean flags)
  PLAYER_CLASS         player class matches (class="warrior")

CONDITION EVALUATOR:
  local function evaluateCondition(player, condition)
    local pd = getPlayerData(player)
    if condition.type == "QUEST_COMPLETE" then
      return pd.completedQuests[condition.questId] == true
    elseif condition.type == "QUEST_ACTIVE" then
      return pd.activeQuests[condition.questId] ~= nil
    elseif condition.type == "HAS_ITEM" then
      local qty = pd.inventory[condition.itemId] or 0
      return qty >= (condition.quantity or 1)
    elseif condition.type == "STAT_GTE" then
      return (pd.stats[condition.stat] or 0) >= condition.value
    elseif condition.type == "REPUTATION_GTE" then
      return (pd.reputation[condition.faction] or 0) >= condition.value
    elseif condition.type == "TIME_OF_DAY" then
      local t = game:GetService("Lighting").ClockTime
      return t >= condition.min and t <= condition.max
    end
    return true  -- unknown condition = always true
  end

  local function getAvailableChoices(player, node)
    local result = {}
    for _, choice in ipairs(node.choices) do
      local ok = true
      for _, cond in ipairs(choice.conditions) do
        if not evaluateCondition(player, cond) then ok = false; break end
      end
      if ok then table.insert(result, choice) end
    end
    return result
  end

── ACTION TYPES ──
  START_QUEST       questId → begin tracking quest
  COMPLETE_QUEST    questId → mark done, give rewards
  FAIL_QUEST        questId → mark failed, cleanup
  GIVE_ITEM         itemId, quantity → add to player inventory
  TAKE_ITEM         itemId, quantity → remove from player inventory
  GIVE_GOLD         amount → add to player currency
  GIVE_XP           amount → add experience points
  OPEN_SHOP         shopId → open merchant GUI
  TELEPORT_PLAYER   position → move player to Vector3
  TRIGGER_CUTSCENE  cutsceneId → start cinematic sequence
  SET_FLAG          flagName, value → set player boolean flag
  PLAY_SOUND        soundId → play audio effect
  SPAWN_NPC         npcId, position → spawn another NPC
  SET_REPUTATION    faction, delta → change reputation value

ACTION EXECUTOR:
  local function executeAction(player, action)
    if action.type == "GIVE_ITEM" then
      addItemToInventory(player, action.itemId, action.quantity)
    elseif action.type == "GIVE_GOLD" then
      addGold(player, action.amount)
    elseif action.type == "START_QUEST" then
      startQuest(player, action.questId)
    elseif action.type == "COMPLETE_QUEST" then
      completeQuest(player, action.questId)
    elseif action.type == "TELEPORT_PLAYER" then
      local char = player.Character
      if char and char.PrimaryPart then
        char:SetPrimaryPartCFrame(CFrame.new(action.position))
      end
    elseif action.type == "OPEN_SHOP" then
      openShopForPlayer(player, action.shopId)
    elseif action.type == "TRIGGER_CUTSCENE" then
      triggerCutscene(player, action.cutsceneId)
    elseif action.type == "SET_FLAG" then
      setPlayerFlag(player, action.flagName, action.value)
    end
  end

── DIALOG GUI (TYPEWRITER EFFECT) ──

LAYOUT:
  ScreenGui
    Frame (bottom of screen, 100% width, ~200px tall)
      Frame (portrait box, left side 160x160)
        ImageLabel (character portrait)
        TextLabel (speaker name)
      Frame (text area, fills rest)
        TextLabel (dialog text — typewriter reveals here)
        Frame (choices container, appears after text done)
          TextButton (choice 1)
          TextButton (choice 2)
          TextButton (choice 3)
      TextLabel ("Press SPACE to skip" hint, bottom right, small)

TYPEWRITER REVEAL:
  local CHARS_PER_SECOND = 40  -- characters revealed per second (0.025s per char)

  local function typewriterReveal(textLabel, fullText, onComplete)
    textLabel.Text = ""
    local i = 0
    local connection
    connection = game:GetService("RunService").Heartbeat:Connect(function(dt)
      i = i + dt * CHARS_PER_SECOND
      local charCount = math.min(math.floor(i), #fullText)
      textLabel.Text = string.sub(fullText, 1, charCount)
      if charCount >= #fullText then
        connection:Disconnect()
        if onComplete then onComplete() end
      end
    end)

    -- Allow skip with Space
    local skipConn
    skipConn = game:GetService("UserInputService").InputBegan:Connect(function(input)
      if input.KeyCode == Enum.KeyCode.Space then
        connection:Disconnect()
        textLabel.Text = fullText
        skipConn:Disconnect()
        if onComplete then onComplete() end
      end
    end)

    return connection
  end

VOICE PITCH VARIATION:
  Each character has a base pitch. Text reveal plays a soft "blip" sound for each character.
  Pitch varies slightly +/- 0.1 semitones per character for natural variation.

  local BASE_PITCHES = {
    ["Wizard Aldren"] = 0.9,
    ["Knight Captain"] = 1.1,
    ["Fairy Guide"]     = 1.5,
    ["Dragon"]          = 0.6,
  }

  local function playTextBlip(speakerName)
    local sound = Instance.new("Sound")
    sound.SoundId = "rbxassetid://3087917897"  -- short click/blip
    sound.Volume = 0.3
    sound.PlaybackSpeed = (BASE_PITCHES[speakerName] or 1.0) + (math.random() * 0.2 - 0.1)
    sound.Parent = game:GetService("SoundService")
    sound:Play()
    game:GetService("Debris"):AddItem(sound, 0.1)
  end

CHAT BUBBLE (speech above NPC head):
  game:GetService("Chat"):Chat(npcModel.Head, dialogText, Enum.ChatColor.White)
  -- This uses Roblox built-in chat bubbles, appears above head, auto-despawns

  -- Custom speech bubble via BillboardGui:
  local function showSpeechBubble(npc, text, duration)
    local billboard = Instance.new("BillboardGui")
    billboard.Size = UDim2.new(0, 200, 0, 60)
    billboard.StudsOffset = Vector3.new(0, 4, 0)
    billboard.AlwaysOnTop = false
    billboard.Parent = npc.Head

    local bg = Instance.new("Frame")
    bg.Size = UDim2.fromScale(1,1)
    bg.BackgroundColor3 = Color3.new(1,1,1)
    bg.BackgroundTransparency = 0.1
    bg.Parent = billboard

    local label = Instance.new("TextLabel")
    label.Size = UDim2.fromScale(1,1)
    label.BackgroundTransparency = 1
    label.TextWrapped = true
    label.Font = Enum.Font.Gotham
    label.TextSize = 14
    label.Text = text
    label.Parent = bg

    game:GetService("Debris"):AddItem(billboard, duration or 4)
  end

── PER-PLAYER DIALOG STATE ──
  Each player has their own dialog state, stored in session:
  {
    playerId      = player.UserId,
    talkHistory   = { npcId → { lastNodeId, visitCount, lastTalkTime } },
    flags         = { flagName → true/false },
    reputation    = { factionName → number },
  }

  First-talk detection:
    if not talkHistory[npcId] then
      talkHistory[npcId] = { visitCount=0 }
    end
    talkHistory[npcId].visitCount += 1
    local isFirstTalk = talkHistory[npcId].visitCount == 1

── MULTI-CHARACTER CUTSCENE DIALOG ──
  For story scenes with multiple speakers:
  - Dialog nodes have a "speaker" field
  - Camera tweens to face the speaking character during their turn
  - Other characters react with idle animations (nodding, looking)
  - Player choices hidden during pure cutscene sequences
  - Cutscene ends when a node with choices=[] AND cutsceneEnd=true is reached

  Example multi-speaker sequence:
    node["cs_01"] = { text="The village is under attack!", speaker="Village Chief", actions={}, choices={} }
    node["cs_02"] = { text="I will defend it!", speaker="Knight", actions={}, choices={} }
    node["cs_03"] = { text="Then go. Quickly.", speaker="Village Chief",
      choices={ { text="(Begin quest)", nextNodeId="accept", conditions={} } }
    }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5: PATHFINDING (PathfindingService)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PATHFINDING SERVICE OVERVIEW:
  game:GetService("PathfindingService"):CreatePath(agentParams)
  path:ComputeAsync(startPosition, endPosition)
  path:GetWaypoints()  -- returns array of PathWaypoint
  path.Status         -- Enum.PathStatus (Success, NoPath, ClosestNoPath, etc.)

  PathWaypoint properties:
    Position    Vector3 where to move
    Action      Enum.PathWaypointAction (Walk or Jump)
    Label       string (optional, for custom navigation modifier regions)

AGENT PARAMETERS:
  {
    AgentRadius       = 2,      -- NPC width / 2 (studs). Use 2 for humanoids.
    AgentHeight       = 5,      -- NPC height (studs). Use 5 for standard humanoid.
    AgentCanJump      = true,   -- can the NPC jump over gaps?
    AgentCanClimb     = false,  -- can NPC climb TrussParts? (usually false for enemies)
    WaypointSpacing   = 4,      -- distance between waypoints (lower = more precise, higher = perf)
    Costs             = {       -- custom terrain/material costs
      Water  = math.huge,       -- never walk through water
      Grass  = 1,               -- default terrain cost
      Road   = 0.5,             -- prefer roads
    }
  }

FULL PATH FOLLOWING FUNCTION:
  local PathfindingService = game:GetService("PathfindingService")

  local function followPath(humanoid, rootPart, destination, onComplete, onBlocked)
    local path = PathfindingService:CreatePath({
      AgentRadius = 2,
      AgentHeight = 5,
      AgentCanJump = true,
      AgentCanClimb = false,
      WaypointSpacing = 4,
    })

    local success, err = pcall(function()
      path:ComputeAsync(rootPart.Position, destination)
    end)

    if not success or path.Status ~= Enum.PathStatus.Success then
      if onBlocked then onBlocked(err) end
      return
    end

    local waypoints = path:GetWaypoints()
    local blocked = false

    local blockedConn = path.Blocked:Connect(function(blockedWpIndex)
      blocked = true
      if onBlocked then onBlocked("path blocked at waypoint " .. blockedWpIndex) end
    end)

    for i, waypoint in ipairs(waypoints) do
      if blocked then break end
      if waypoint.Action == Enum.PathWaypointAction.Jump then
        humanoid.Jump = true
      end
      humanoid:MoveTo(waypoint.Position)
      local reached = humanoid.MoveToFinished:Wait(5)
      if not reached then
        -- Timed out on this waypoint, recompute
        blockedConn:Disconnect()
        return followPath(humanoid, rootPart, destination, onComplete, onBlocked)
      end
    end

    blockedConn:Disconnect()
    if not blocked and onComplete then onComplete() end
  end

RECOMPUTE STRATEGY (2-3 second rule):
  NEVER call ComputeAsync every frame. It is expensive.
  Recommended: recompute when:
    1. Path is blocked (path.Blocked event fires)
    2. Target has moved more than 8 studs since last compute
    3. 2-3 seconds have elapsed since last compute

  local lastComputeTime = 0
  local lastTargetPos = Vector3.zero

  RunService.Heartbeat:Connect(function(dt)
    if not target then return end
    local targetMoved = (target.Position - lastTargetPos).Magnitude
    local timeSince = tick() - lastComputeTime
    if timeSince >= 2 or targetMoved >= 8 then
      lastComputeTime = tick()
      lastTargetPos = target.Position
      task.spawn(followPath, humanoid, root, target.Position, nil, recomputeCallback)
    end
  end)

NAVIGATION MESH CONSIDERATIONS:
  - PathfindingService uses Roblox internal navmesh, auto-generated from workspace geometry
  - Parts must be anchored to be included in navmesh
  - Small gaps (< AgentRadius * 2 = 4 studs) will be treated as walls — NPC cannot pass
  - Steep slopes (> 89 degree incline) are impassable
  - Water terrain: set cost to math.huge to prevent NPCs from walking through
  - Use PathfindingModifier (BasePart with PathfindingModifier SpecialMesh) to:
      - Mark regions as passable/impassable
      - Assign custom label to trigger special NPC behavior (e.g., "danger zone")
  - Prefer keeping floors flat for reliable pathing
  - Avoid very thin corridors (< 4 studs wide) as they can confuse pathfinding

PATH SMOOTHING:
  Roblox paths are sometimes jagged (zigzag). Smooth them:
  - Skip waypoints that are nearly collinear (angle < 15 degrees)
  - Only use every other waypoint for long straight paths
  - For very large areas (>200 studs): break into segments, path each segment

  local function smoothWaypoints(waypoints, threshold)
    threshold = threshold or math.rad(15)
    local result = { waypoints[1] }
    for i = 2, #waypoints - 1 do
      local prev = waypoints[i-1].Position
      local curr = waypoints[i].Position
      local next = waypoints[i+1].Position
      local dir1 = (curr - prev).Unit
      local dir2 = (next - curr).Unit
      local angle = math.acos(math.clamp(dir1:Dot(dir2), -1, 1))
      if angle > threshold then
        table.insert(result, waypoints[i])
      end
    end
    table.insert(result, waypoints[#waypoints])
    return result
  end

PERFORMANCE TIPS:
  - Cache computed paths for NPCs that patrol the same route every loop
  - Use PathfindingService:FindPathAsync is deprecated — always use CreatePath + ComputeAsync
  - Group NPCs into update buckets: update 10 NPCs per frame instead of all at once
  - Only compute paths for NPCs within camera/player range (< 150 studs of nearest player)
  - Disable pathfinding entirely for NPCs > 200 studs from all players (sleep state)

NPC SLEEP/WAKE SYSTEM:
  local function updateNPCSleepState(npc, players)
    local npcPos = npc.PrimaryPart.Position
    local closest = math.huge
    for _, plr in ipairs(players) do
      if plr.Character and plr.Character.PrimaryPart then
        local d = (plr.Character.PrimaryPart.Position - npcPos).Magnitude
        if d < closest then closest = d end
      end
    end
    npc.aiEnabled = closest < 200
    -- When sleeping: disable Heartbeat updates for this NPC
    -- When waking: re-enable and set state = "IDLE"
  end

ALTERNATIVE ROUTES:
  If path is repeatedly blocked (3+ attempts):
    1. Try a wider AgentRadius to find alternate path
    2. Find a waypoint halfway to destination and path there first
    3. If completely stuck, teleport to last known reachable position

  local function findAlternatePath(root, destination, attempts)
    if attempts > 3 then
      -- Give up and teleport to safe position near start
      return nil
    end
    local midpoint = (root.Position + destination) / 2
    midpoint = midpoint + Vector3.new(math.random(-10,10), 0, math.random(-10,10))
    -- Try pathing to midpoint first
    local path1 = createAndComputePath(root.Position, midpoint)
    if path1 then
      return { path1, createAndComputePath(midpoint, destination) }
    end
    return findAlternatePath(root, destination, attempts + 1)
  end

FLYING NPC MOVEMENT (NO PATHFINDING):
  For flying NPCs (fairies, ghosts, dragons), use BodyVelocity instead of Humanoid.

  local function moveFlying(root, targetPos, speed)
    local direction = (targetPos - root.Position)
    local distance = direction.Magnitude
    if distance < 2 then
      -- Arrived, set velocity to zero
      local bv = root:FindFirstChild("FlyVelocity")
      if bv then bv.VectorVelocity = Vector3.zero end
      return true
    end
    local bv = root:FindFirstChildOfClass("BodyVelocity")
    if not bv then
      bv = Instance.new("BodyVelocity")
      bv.Name = "FlyVelocity"
      bv.MaxForce = Vector3.new(math.huge, math.huge, math.huge)
      bv.Parent = root
    end
    bv.VectorVelocity = direction.Unit * math.min(speed, distance * 3)
    return false
  end
`;
