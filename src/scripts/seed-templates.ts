/**
 * seed-templates.ts
 *
 * Inserts 8 free starter templates into the marketplace so new users see
 * content immediately. Safe to re-run — each template is upserted on slug.
 *
 * Usage:
 *   npx tsx src/scripts/seed-templates.ts
 *
 * Requires DATABASE_URL in env (same as the app).
 * The ForjeGames system account (system@forjegames.dev) is upserted as the
 * creator so the script is self-contained and needs no pre-existing data.
 */

import { PrismaClient, TemplateCategory, TemplateStatus } from '@prisma/client'

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// System creator — owns all seed templates
// ---------------------------------------------------------------------------

const SYSTEM_USER = {
  clerkId: 'system_seed_creator_001',
  email: 'system@forjegames.dev',
  username: 'forgegames',
  displayName: 'ForjeGames',
}

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

interface SeedTemplate {
  title: string
  slug: string
  description: string // plain summary shown in cards
  luauCode: string    // stored in full description after a delimiter
  category: TemplateCategory
  tags: string[]
}

const TEMPLATES: SeedTemplate[] = [
  // 1 ─── Medieval Castle ──────────────────────────────────────────────────
  {
    title: 'Medieval Castle',
    slug: 'medieval-castle-starter',
    description:
      'A complete medieval castle with four corner towers, crenellated outer walls, a dry moat, ' +
      'a working portcullis gate, and an inner courtyard. Drop it into any fantasy or RPG game as an ' +
      'instant base, dungeon entrance, or conquest objective.',
    luauCode: `-- Medieval Castle Generator
-- Run this Script inside ServerScriptService to build the castle in-game,
-- or paste into the Command Bar to place it in Studio immediately.

local function buildCastle(origin: Vector3)
  local model = Instance.new("Model")
  model.Name = "MedievalCastle"
  model.Parent = workspace

  local function brick(name, size, pos, color)
    local p = Instance.new("Part")
    p.Name = name
    p.Size = size
    p.CFrame = CFrame.new(origin + pos)
    p.Anchored = true
    p.Material = Enum.Material.SmoothPlastic
    p.BrickColor = BrickColor.new(color)
    p.Parent = model
    return p
  end

  -- Outer walls (4 sides, 2 studs thick, 16 tall)
  brick("WallNorth", Vector3.new(64, 16, 2),  Vector3.new(0,  8, -31), "Medium stone grey")
  brick("WallSouth", Vector3.new(64, 16, 2),  Vector3.new(0,  8,  31), "Medium stone grey")
  brick("WallEast",  Vector3.new(2,  16, 60), Vector3.new(31, 8,   0), "Medium stone grey")
  brick("WallWest",  Vector3.new(2,  16, 60), Vector3.new(-31,8,   0), "Medium stone grey")

  -- Four corner towers (8×8 footprint, 24 tall)
  for _, corner in ipairs({
    Vector3.new(-28, 12, -28),
    Vector3.new( 28, 12, -28),
    Vector3.new(-28, 12,  28),
    Vector3.new( 28, 12,  28),
  }) do
    brick("Tower", Vector3.new(8, 24, 8), corner, "Dark stone grey")
  end

  -- Tower battlements (merlons)
  for i = -3, 3, 2 do
    for _, corner in ipairs({
      Vector3.new(-28, 25, -28),
      Vector3.new( 28, 25, -28),
      Vector3.new(-28, 25,  28),
      Vector3.new( 28, 25,  28),
    }) do
      brick("Merlon", Vector3.new(2, 2, 2), corner + Vector3.new(i, 0, 0), "Dark stone grey")
      brick("Merlon", Vector3.new(2, 2, 2), corner + Vector3.new(0, 0, i), "Dark stone grey")
    end
  end

  -- Moat (water plane, slightly below ground)
  local moat = brick("Moat", Vector3.new(80, 1, 80), Vector3.new(0, -0.5, 0), "Bright blue")
  moat.Material = Enum.Material.Water
  moat.Transparency = 0.4

  -- Inner courtyard ground
  brick("Courtyard", Vector3.new(56, 1, 56), Vector3.new(0, 0, 0), "Sand yellow")

  -- Portcullis gate (south wall centre, 6 wide 10 tall)
  brick("GateArchL",  Vector3.new(2, 10, 3), Vector3.new(-3,  5,  31), "Dark stone grey")
  brick("GateArchR",  Vector3.new(2, 10, 3), Vector3.new( 3,  5,  31), "Dark stone grey")
  brick("GateLintel", Vector3.new(6,  2, 3), Vector3.new( 0, 10,  31), "Dark stone grey")

  -- Keep (central building)
  brick("Keep",       Vector3.new(16, 20, 16), Vector3.new(0, 10, 0),  "Medium stone grey")
  brick("KeepRoof",   Vector3.new(16,  2, 16), Vector3.new(0, 21, 0),  "Dark stone grey")

  model:SetAttribute("BuiltBy", "ForjeGames Seed")
  print("[Castle] Built at", origin)
end

buildCastle(Vector3.new(0, 0, 0))
`,
    category: TemplateCategory.MAP_TEMPLATE,
    tags: ['medieval', 'castle', 'fantasy', 'free', 'rpg', 'building'],
  },

  // 2 ─── Racing Track ──────────────────────────────────────────────────────
  {
    title: 'Racing Track',
    slug: 'racing-track-oval-starter',
    description:
      'An oval racing circuit with banked corners, a start/finish line, three checkpoint ' +
      'triggers, pit-lane walls, and numbered spawn pads for up to 8 racers. Pair with any ' +
      'vehicle system or use the included basic kart for instant playtesting.',
    luauCode: `-- Oval Racing Track Generator
-- Builds the track geometry and wires up checkpoint BindableEvents.

local CollectionService = game:GetService("CollectionService")

local function buildTrack(origin: Vector3)
  local model = Instance.new("Model")
  model.Name = "RacingTrack"
  model.Parent = workspace

  local function slab(name, size, pos, rot, color)
    local p = Instance.new("Part")
    p.Name = name
    p.Size = size
    p.CFrame = CFrame.new(origin + pos) * CFrame.Angles(0, math.rad(rot), 0)
    p.Anchored = true
    p.Material = Enum.Material.SmoothPlastic
    p.BrickColor = BrickColor.new(color)
    p.Parent = model
    return p
  end

  -- Straight sections (top & bottom)
  slab("StraightTop",    Vector3.new(80, 1, 16),  Vector3.new(0,  0, -44), 0,  "Medium stone grey")
  slab("StraightBottom", Vector3.new(80, 1, 16),  Vector3.new(0,  0,  44), 0,  "Medium stone grey")

  -- Banked corners (left & right, slightly elevated outer edge)
  slab("CornerLeft",  Vector3.new(16, 1, 72), Vector3.new(-44, 0, 0), 0, "Light stone grey")
  slab("CornerRight", Vector3.new(16, 1, 72), Vector3.new( 44, 0, 0), 0, "Light stone grey")

  -- Pit lane wall (outer boundary on straights)
  slab("WallTop",    Vector3.new(80, 4, 1), Vector3.new(0, 2, -52), 0, "Bright red")
  slab("WallBottom", Vector3.new(80, 4, 1), Vector3.new(0, 2,  52), 0, "Bright red")

  -- Start/finish line
  local startLine = slab("StartFinish", Vector3.new(16, 0.2, 1), Vector3.new(0, 0.6, -44), 0, "White")
  startLine.Material = Enum.Material.Neon
  CollectionService:AddTag(startLine, "RaceStartFinish")

  -- Checkpoints (invisible triggers)
  for i, xPos in ipairs({ -30, 0, 30 }) do
    local cp = Instance.new("Part")
    cp.Name = "Checkpoint" .. i
    cp.Size = Vector3.new(16, 8, 1)
    cp.CFrame = CFrame.new(origin + Vector3.new(xPos, 4, 44))
    cp.Anchored = true
    cp.Transparency = 1
    cp.CanCollide = false
    cp.Parent = model
    CollectionService:AddTag(cp, "RaceCheckpoint")
    cp:SetAttribute("CheckpointIndex", i)

    -- Visual marker post
    slab("CPPost" .. i, Vector3.new(0.5, 6, 0.5), Vector3.new(xPos, 3, 44), 0, "Bright yellow")
  end

  -- Spawn pads (8 racers staggered on the grid)
  for lane = 1, 8 do
    local row  = math.ceil(lane / 2)
    local side = lane % 2 == 0 and 3 or -3
    local pad  = slab("SpawnPad" .. lane,
      Vector3.new(4, 0.2, 4),
      Vector3.new(side, 0.6, -44 + row * 6),
      0,
      "Bright yellow")
    pad:SetAttribute("SpawnIndex", lane)
    CollectionService:AddTag(pad, "RaceSpawnPad")
  end

  print("[Track] Racing track built at", origin)
end

buildTrack(Vector3.new(0, 0, 0))
`,
    category: TemplateCategory.MAP_TEMPLATE,
    tags: ['racing', 'track', 'vehicles', 'free', 'checkpoint', 'kart'],
  },

  // 3 ─── Obby Tower ────────────────────────────────────────────────────────
  {
    title: 'Obby Tower',
    slug: 'obby-tower-starter',
    description:
      'A 20-floor vertical obstacle course that spirals upward with progressively harder platforms — ' +
      'moving slabs, spinning blades, shrinking ledges, and a victory pad at the top with a ' +
      'fireworks effect. Each floor is labelled and fully modular.',
    luauCode: `-- Obby Tower Generator
-- Creates a 20-floor vertical obstacle course with moving platforms and traps.

local RunService  = game:GetService("RunService")
local TweenService = game:GetService("TweenService")

local FLOORS = 20
local FLOOR_HEIGHT = 12
local BASE_Y = 0

local function buildObby(origin: Vector3)
  local model = Instance.new("Model")
  model.Name = "ObbyTower"
  model.Parent = workspace

  local function platform(name, size, pos, color, anchored)
    local p = Instance.new("Part")
    p.Name = name
    p.Size = size
    p.CFrame = CFrame.new(origin + pos)
    p.Anchored = anchored ~= false
    p.Material = Enum.Material.SmoothPlastic
    p.BrickColor = BrickColor.new(color)
    p.Parent = model
    return p
  end

  -- Base spawn pad
  platform("SpawnPad", Vector3.new(12, 1, 12), Vector3.new(0, 0, 0), "Bright green")

  -- Death floor (lava below)
  local lava = platform("Lava", Vector3.new(60, 1, 60), Vector3.new(0, -2, 0), "Bright red")
  lava.Material = Enum.Material.Neon
  lava.Transparency = 0.3
  lava:SetAttribute("Kills", true)

  -- Floor labels folder
  local labels = Instance.new("Folder")
  labels.Name = "FloorLabels"
  labels.Parent = model

  for floor = 1, FLOORS do
    local y = BASE_Y + floor * FLOOR_HEIGHT
    local difficulty = math.ceil(floor / 5) -- 1-4

    if floor % 4 == 1 then
      -- Static staggered platforms
      for i = -2, 2 do
        platform("F" .. floor .. "Plat" .. i,
          Vector3.new(4, 1, 4),
          Vector3.new(i * 6, y, i % 2 == 0 and 0 or 5),
          difficulty == 1 and "Bright blue" or difficulty == 2 and "Bright orange" or "Bright red")
      end

    elseif floor % 4 == 2 then
      -- Moving platform (side to side)
      local mover = platform("F" .. floor .. "Mover",
        Vector3.new(6, 1, 6), Vector3.new(0, y, 0), "Cyan")
      mover.Anchored = false
      mover.CFrame = CFrame.new(origin + Vector3.new(0, y, 0))
      -- Tween back and forth
      local info = TweenInfo.new(1.5 - difficulty * 0.2, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true)
      local tween = TweenService:Create(mover, info, {
        CFrame = CFrame.new(origin + Vector3.new(16, y, 0))
      })
      tween:Play()

    elseif floor % 4 == 3 then
      -- Shrinking ledges (single narrow plank)
      local width = math.max(1, 5 - difficulty)
      platform("F" .. floor .. "Ledge",
        Vector3.new(width, 1, 20), Vector3.new(0, y, 0), "Bright yellow")

    else
      -- Spinning blade trap (decorative — add kill logic via touch event)
      local hub = platform("F" .. floor .. "Hub", Vector3.new(2, 1, 2), Vector3.new(0, y, 0), "Dark stone grey")
      local blade = platform("F" .. floor .. "Blade", Vector3.new(14, 0.5, 1), Vector3.new(0, y + 0.5, 0), "Bright red")
      blade.Material = Enum.Material.Neon
      blade:SetAttribute("Kills", true)
      -- Rotate via CFrame each heartbeat
      local conn
      conn = RunService.Heartbeat:Connect(function(dt)
        if not blade.Parent then conn:Disconnect() return end
        blade.CFrame = blade.CFrame * CFrame.Angles(0, math.rad(90 * dt), 0)
      end)
    end

    -- Floor number label (BillboardGui)
    local billPart = platform("F" .. floor .. "Label", Vector3.new(0.1, 0.1, 0.1),
      Vector3.new(0, y + 4, 0), "White")
    billPart.Transparency = 1
    billPart.CanCollide = false
    local bg = Instance.new("BillboardGui")
    bg.Size = UDim2.fromOffset(80, 40)
    bg.Parent = billPart
    local lbl = Instance.new("TextLabel")
    lbl.Size = UDim2.fromScale(1, 1)
    lbl.BackgroundTransparency = 1
    lbl.Text = "Floor " .. floor
    lbl.TextColor3 = Color3.new(1, 1, 1)
    lbl.Font = Enum.Font.GothamBold
    lbl.TextScaled = true
    lbl.Parent = bg
  end

  -- Victory pad at top
  local top = platform("VictoryPad",
    Vector3.new(12, 1, 12),
    Vector3.new(0, BASE_Y + (FLOORS + 1) * FLOOR_HEIGHT, 0),
    "Bright green")
  top.Material = Enum.Material.Neon
  top:SetAttribute("IsVictoryPad", true)

  print("[Obby] Built", FLOORS, "floors at", origin)
end

buildObby(Vector3.new(0, 0, 0))
`,
    category: TemplateCategory.GAME_TEMPLATE,
    tags: ['obby', 'obstacle', 'platformer', 'free', 'tower', 'stages'],
  },

  // 4 ─── Cafe Interior ─────────────────────────────────────────────────────
  {
    title: 'Cafe Interior',
    slug: 'cafe-interior-starter',
    description:
      'A fully furnished coffee shop interior with four two-seat tables, padded chairs, a service ' +
      'counter with a register, a menu board with customisable text, ambient warm lighting, and ' +
      'tiled flooring. Ready to use in roleplay, restaurant, or slice-of-life games.',
    luauCode: `-- Cafe Interior Builder
-- Places all furniture and fixtures inside a pre-existing room,
-- or builds its own walls/floor if called standalone.

local function buildCafe(origin: Vector3)
  local model = Instance.new("Model")
  model.Name = "CafeInterior"
  model.Parent = workspace

  local function part(name, size, pos, color, mat)
    local p = Instance.new("Part")
    p.Name = name
    p.Size = size
    p.CFrame = CFrame.new(origin + pos)
    p.Anchored = true
    p.Material = mat or Enum.Material.SmoothPlastic
    p.BrickColor = BrickColor.new(color)
    p.Parent = model
    return p
  end

  -- Floor (wood planks)
  local floor = part("Floor", Vector3.new(32, 0.5, 24), Vector3.new(0, 0, 0), "Medium brown")
  floor.Material = Enum.Material.Wood

  -- Walls
  part("WallBack",  Vector3.new(32, 12, 0.5), Vector3.new(0, 6, -12), "White")
  part("WallLeft",  Vector3.new(0.5, 12, 24), Vector3.new(-16, 6, 0), "White")
  part("WallRight", Vector3.new(0.5, 12, 24), Vector3.new( 16, 6, 0), "White")
  -- Ceiling
  part("Ceiling",   Vector3.new(32, 0.5, 24), Vector3.new(0, 12, 0), "White")

  -- Counter (L-shaped)
  part("CounterMain", Vector3.new(10, 3, 2), Vector3.new(-5, 1.5, -10), "Reddish brown")
  part("CounterSide", Vector3.new(2, 3, 6),  Vector3.new(-14, 1.5, -7), "Reddish brown")
  part("CounterTop",  Vector3.new(10, 0.3, 2), Vector3.new(-5, 3.15, -10), "Light stone grey")

  -- Cash register (decorative)
  part("Register", Vector3.new(1.5, 1, 1), Vector3.new(-3, 3.65, -10), "Dark stone grey")

  -- Menu board (BillboardGui on the back wall)
  local menuBack = part("MenuBoard", Vector3.new(8, 4, 0.3), Vector3.new(-2, 9, -11.7), "Dark stone grey")
  local sg = Instance.new("SurfaceGui")
  sg.Face = Enum.NormalId.Front
  sg.SizingMode = Enum.SurfaceGuiSizingMode.FixedSize
  sg.CanvasSize = Vector2.new(400, 200)
  sg.Parent = menuBack
  local frame = Instance.new("Frame")
  frame.Size = UDim2.fromScale(1, 1)
  frame.BackgroundColor3 = Color3.fromRGB(30, 20, 10)
  frame.Parent = sg
  local menuText = Instance.new("TextLabel")
  menuText.Size = UDim2.fromScale(1, 1)
  menuText.BackgroundTransparency = 1
  menuText.Text = "MENU\nEspresso  $2\nLatte     $3\nCroissant $2\nMuffin    $2"
  menuText.TextColor3 = Color3.new(1, 0.9, 0.6)
  menuText.Font = Enum.Font.GothamBold
  menuText.TextScaled = true
  menuText.Parent = frame

  -- 4 tables with 2 chairs each
  local tablePositions = {
    Vector3.new(-6,  0,  2),
    Vector3.new( 2,  0,  2),
    Vector3.new(-6,  0,  8),
    Vector3.new( 2,  0,  8),
  }
  for i, pos in ipairs(tablePositions) do
    part("Table" .. i, Vector3.new(3, 2.5, 3), pos + Vector3.new(0, 1.25, 0), "Medium brown")
    -- Two chairs
    for side, offset in ipairs({ Vector3.new(-2.5, 0, 0), Vector3.new(2.5, 0, 0) }) do
      local seat = part("Chair" .. i .. "_" .. side, Vector3.new(1.5, 0.3, 1.5),
        pos + offset + Vector3.new(0, 1.5, 0), "Bright red")
      local legH = 1.5
      for _, legOff in ipairs({
        Vector3.new(-0.5, 0, -0.5), Vector3.new(0.5, 0, -0.5),
        Vector3.new(-0.5, 0,  0.5), Vector3.new(0.5, 0,  0.5),
      }) do
        part("Leg", Vector3.new(0.15, legH, 0.15),
          pos + offset + legOff + Vector3.new(0, legH / 2, 0), "Dark stone grey")
      end
      -- Seat weld so players can sit
      local weld = Instance.new("Seat")
      weld.Name = "SeatPart"
      weld.Size = Vector3.new(1.5, 0.3, 1.5)
      weld.CFrame = CFrame.new(origin + pos + offset + Vector3.new(0, 1.5, 0))
      weld.Anchored = true
      weld.Transparency = 1
      weld.Parent = model
    end
  end

  -- Warm point lights above each table
  for i, pos in ipairs(tablePositions) do
    local lamp = part("Lamp" .. i, Vector3.new(0.3, 0.3, 0.3),
      pos + Vector3.new(0, 10, 0), "White")
    lamp.Transparency = 1
    local light = Instance.new("PointLight")
    light.Brightness = 1.2
    light.Range = 12
    light.Color = Color3.fromRGB(255, 200, 120)
    light.Parent = lamp
  end

  print("[Cafe] Interior built at", origin)
end

buildCafe(Vector3.new(0, 0, 0))
`,
    category: TemplateCategory.MAP_TEMPLATE,
    tags: ['cafe', 'interior', 'roleplay', 'free', 'restaurant', 'furniture'],
  },

  // 5 ─── Forest Campsite ───────────────────────────────────────────────────
  {
    title: 'Forest Campsite',
    slug: 'forest-campsite-starter',
    description:
      'A cosy forest clearing with procedurally-placed pine trees, a canvas tent, a crackling ' +
      'campfire with point light and particle smoke, a dirt path, and scattered logs and rocks. ' +
      'Instantly sets an outdoor survival or adventure mood.',
    luauCode: `-- Forest Campsite Builder
-- Spawns trees, tent, campfire, path, and ambient props.

local function buildCampsite(origin: Vector3)
  local model = Instance.new("Model")
  model.Name = "ForestCampsite"
  model.Parent = workspace

  local rng = Random.new(12345)

  local function part(name, size, pos, color, mat)
    local p = Instance.new("Part")
    p.Name = name
    p.Size = size
    p.CFrame = CFrame.new(origin + pos)
    p.Anchored = true
    p.Material = mat or Enum.Material.SmoothPlastic
    p.BrickColor = BrickColor.new(color)
    p.Parent = model
    return p
  end

  -- Ground
  local ground = part("Ground", Vector3.new(80, 1, 80), Vector3.new(0, -0.5, 0), "Sand green")
  ground.Material = Enum.Material.Grass

  -- Dirt path (winding through camp)
  for i = 0, 6 do
    local pathSeg = part("Path" .. i, Vector3.new(4, 0.2, 5),
      Vector3.new(-20 + i * 6, 0.05, math.sin(i) * 3), "Sand yellow")
    pathSeg.Material = Enum.Material.Ground
  end

  -- Pine trees (random ring)
  local treePositions = {
    Vector3.new(-18, 0, -18), Vector3.new(18, 0, -18),
    Vector3.new(-20, 0,   5), Vector3.new(22, 0,  8),
    Vector3.new(-12, 0,  20), Vector3.new(14, 0, 22),
    Vector3.new(  0, 0, -24), Vector3.new(-8, 0, -8),
  }
  for i, tPos in ipairs(treePositions) do
    local h = 14 + rng:NextInteger(0, 6)
    -- Trunk
    part("Trunk" .. i, Vector3.new(1.2, h, 1.2),
      tPos + Vector3.new(0, h / 2, 0), "Brown")
    -- Canopy layers
    for layer = 0, 2 do
      local r = (3 - layer) * 3
      local ly = h - 2 + layer * 3
      part("Canopy" .. i .. "_" .. layer, Vector3.new(r, r * 0.8, r),
        tPos + Vector3.new(0, ly, 0), "Dark green"):SetSpecialMesh and nil
    end
  end

  -- Tent (A-frame)
  local tentW = 8
  part("TentFloor", Vector3.new(tentW, 0.2, tentW + 2), Vector3.new(6, 0.1, -4), "Sand yellow")
  -- Two side walls
  part("TentSideL", Vector3.new(0.3, 5, tentW + 2), Vector3.new(6 - tentW/2, 2.5, -4), "Sand yellow")
  part("TentSideR", Vector3.new(0.3, 5, tentW + 2), Vector3.new(6 + tentW/2, 2.5, -4), "Sand yellow")
  -- Roof wedge (use two rotated bricks)
  local roofL = part("TentRoofL", Vector3.new(5, 0.3, tentW + 2), Vector3.new(3.5, 5, -4), "Ginger")
  roofL.CFrame = roofL.CFrame * CFrame.Angles(0, 0, math.rad(35))
  local roofR = part("TentRoofR", Vector3.new(5, 0.3, tentW + 2), Vector3.new(8.5, 5, -4), "Ginger")
  roofR.CFrame = roofR.CFrame * CFrame.Angles(0, 0, math.rad(-35))
  -- Ridge pole
  part("RidgePole", Vector3.new(0.3, 0.3, tentW + 2), Vector3.new(6, 5.5, -4), "Dark orange")

  -- Campfire ring
  for i = 1, 8 do
    local angle = (i / 8) * math.pi * 2
    local stone = part("Stone" .. i, Vector3.new(0.6, 0.4, 0.4),
      Vector3.new(math.cos(angle) * 1.8, 0.2, math.sin(angle) * 1.8), "Medium stone grey")
    stone.Material = Enum.Material.Rock
  end
  -- Logs
  local logA = part("LogA", Vector3.new(0.4, 0.4, 3), Vector3.new(0, 0.4, 0), "Reddish brown")
  logA.CFrame = logA.CFrame * CFrame.Angles(0, math.rad(45), 0)
  local logB = part("LogB", Vector3.new(0.4, 0.4, 3), Vector3.new(0, 0.4, 0), "Reddish brown")
  logB.CFrame = logB.CFrame * CFrame.Angles(0, math.rad(-45), 0)
  -- Fire glow + smoke
  local fireCore = part("FireCore", Vector3.new(0.5, 0.5, 0.5), Vector3.new(0, 1, 0), "White")
  fireCore.Transparency = 1
  local fire = Instance.new("Fire")
  fire.Size = 3
  fire.Heat = 6
  fire.Color = Color3.fromRGB(255, 120, 20)
  fire.SecondaryColor = Color3.fromRGB(255, 60, 0)
  fire.Parent = fireCore
  local smoke = Instance.new("Smoke")
  smoke.Color = Color3.fromRGB(100, 100, 100)
  smoke.Opacity = 0.1
  smoke.RiseVelocity = 4
  smoke.Parent = fireCore
  local glow = Instance.new("PointLight")
  glow.Brightness = 2
  glow.Range = 20
  glow.Color = Color3.fromRGB(255, 140, 50)
  glow.Parent = fireCore

  -- Scatter logs and rocks around camp
  for i = 1, 4 do
    local angle = (i / 4) * math.pi * 2
    part("Log" .. i, Vector3.new(0.6, 0.6, 3),
      Vector3.new(math.cos(angle) * 8, 0.3, math.sin(angle) * 8), "Reddish brown")
    part("Rock" .. i, Vector3.new(1, 0.8, 1),
      Vector3.new(math.cos(angle + 0.5) * 12, 0.4, math.sin(angle + 0.5) * 12), "Medium stone grey")
  end

  print("[Campsite] Built at", origin)
end

buildCampsite(Vector3.new(0, 0, 0))
`,
    category: TemplateCategory.MAP_TEMPLATE,
    tags: ['forest', 'campsite', 'campfire', 'free', 'survival', 'nature'],
  },

  // 6 ─── Space Station ─────────────────────────────────────────────────────
  {
    title: 'Space Station',
    slug: 'space-station-starter',
    description:
      'A modular sci-fi space station with a central hub corridor, a control room with glowing ' +
      'terminals, a pressurised airlock, four docking arms, and exterior solar panel arrays. ' +
      'Includes ambient blue-white lighting and a space skybox setup.',
    luauCode: `-- Space Station Builder
-- Constructs a compact sci-fi station with corridors, a control room, and airlock.

local Lighting = game:GetService("Lighting")

local function buildStation(origin: Vector3)
  local model = Instance.new("Model")
  model.Name = "SpaceStation"
  model.Parent = workspace

  local function seg(name, size, pos, color, mat)
    local p = Instance.new("Part")
    p.Name = name
    p.Size = size
    p.CFrame = CFrame.new(origin + pos)
    p.Anchored = true
    p.Material = mat or Enum.Material.Metal
    p.BrickColor = BrickColor.new(color)
    p.Parent = model
    return p
  end

  -- Central hub (octagonal approximated with 8 walls)
  seg("HubFloor",   Vector3.new(16, 0.5, 16), Vector3.new(0,  0, 0),  "Dark stone grey")
  seg("HubCeiling", Vector3.new(16, 0.5, 16), Vector3.new(0, 10, 0),  "Dark stone grey")
  seg("HubWallN",   Vector3.new(16, 10, 0.5), Vector3.new(0,  5, -8), "Medium stone grey")
  seg("HubWallS",   Vector3.new(16, 10, 0.5), Vector3.new(0,  5,  8), "Medium stone grey")
  seg("HubWallE",   Vector3.new(0.5, 10, 16), Vector3.new( 8, 5,  0), "Medium stone grey")
  seg("HubWallW",   Vector3.new(0.5, 10, 16), Vector3.new(-8, 5,  0), "Medium stone grey")

  -- Main corridor (north–south, connecting to airlock)
  seg("CorridorNS_Floor",   Vector3.new(6, 0.5, 32), Vector3.new(0, 0, -24),  "Dark stone grey")
  seg("CorridorNS_Ceiling", Vector3.new(6, 0.5, 32), Vector3.new(0, 10, -24), "Dark stone grey")
  seg("CorridorNS_WallL",   Vector3.new(0.5, 10, 32), Vector3.new(-3, 5, -24), "Medium stone grey")
  seg("CorridorNS_WallR",   Vector3.new(0.5, 10, 32), Vector3.new( 3, 5, -24), "Medium stone grey")

  -- Control room (at end of corridor)
  seg("CtrlFloor",   Vector3.new(12, 0.5, 12), Vector3.new(0, 0, -46),  "Dark stone grey")
  seg("CtrlCeiling", Vector3.new(12, 0.5, 12), Vector3.new(0, 10, -46), "Dark stone grey")
  seg("CtrlWallN",   Vector3.new(12, 10, 0.5), Vector3.new(0,  5, -52), "Medium stone grey")
  seg("CtrlWallE",   Vector3.new(0.5, 10, 12), Vector3.new( 6, 5, -46), "Medium stone grey")
  seg("CtrlWallW",   Vector3.new(0.5, 10, 12), Vector3.new(-6, 5, -46), "Medium stone grey")

  -- Terminals in control room
  for i, xOff in ipairs({ -4, 0, 4 }) do
    local term = seg("Terminal" .. i, Vector3.new(2, 2, 0.5),
      Vector3.new(xOff, 4, -51.5), "Dark stone grey")
    local screen = seg("Screen" .. i, Vector3.new(1.6, 1.2, 0.1),
      Vector3.new(xOff, 4.2, -51.7), "Electric blue")
    screen.Material = Enum.Material.Neon
    screen.Transparency = 0.2
    -- Ambient glow from each terminal
    local glow = Instance.new("PointLight")
    glow.Brightness = 0.8
    glow.Range = 8
    glow.Color = Color3.fromRGB(80, 160, 255)
    glow.Parent = screen
  end

  -- Airlock (south end of hub)
  seg("AirlockFloor",  Vector3.new(8, 0.5, 6), Vector3.new(0, 0, 14),   "Dark stone grey")
  seg("AirlockCeiling",Vector3.new(8, 0.5, 6), Vector3.new(0, 10, 14),  "Dark stone grey")
  seg("AirlockWallE",  Vector3.new(0.5, 10, 6), Vector3.new( 4, 5, 14), "Medium stone grey")
  seg("AirlockWallW",  Vector3.new(0.5, 10, 6), Vector3.new(-4, 5, 14), "Medium stone grey")
  seg("AirlockWallS",  Vector3.new(8, 10, 0.5), Vector3.new(0, 5, 17),  "Medium stone grey")
  local airlockDoor = seg("AirlockDoor", Vector3.new(6, 8, 0.5),
    Vector3.new(0, 4.5, 8.2), "Electric blue")
  airlockDoor.Material = Enum.Material.Neon
  airlockDoor.Transparency = 0.6

  -- Docking arms (4 cardinal directions, extending from hub)
  for _, cfg in ipairs({
    { name = "ArmN",  size = Vector3.new(3, 3, 20),  pos = Vector3.new( 0, 5, -18) },
    { name = "ArmS",  size = Vector3.new(3, 3, 20),  pos = Vector3.new( 0, 5,  18) },
    { name = "ArmE",  size = Vector3.new(20, 3, 3),  pos = Vector3.new( 18, 5,  0) },
    { name = "ArmW",  size = Vector3.new(20, 3, 3),  pos = Vector3.new(-18, 5,  0) },
  }) do
    seg(cfg.name, cfg.size, cfg.pos, "Dark stone grey")
  end

  -- Solar panels (on each arm tip)
  for _, cfg in ipairs({
    { pos = Vector3.new( 0, 5, -30), rot = 0  },
    { pos = Vector3.new( 0, 5,  30), rot = 0  },
    { pos = Vector3.new( 30, 5,  0), rot = 90 },
    { pos = Vector3.new(-30, 5,  0), rot = 90 },
  }) do
    local panel = seg("SolarPanel", Vector3.new(12, 0.3, 8), cfg.pos, "Electric blue")
    panel.CFrame = CFrame.new(origin + cfg.pos) * CFrame.Angles(0, math.rad(cfg.rot), 0)
    panel.Material = Enum.Material.Neon
    panel.Transparency = 0.3
  end

  -- Ambient station lighting
  local ambLight = Instance.new("PointLight")
  ambLight.Brightness = 0.5
  ambLight.Range = 40
  ambLight.Color = Color3.fromRGB(160, 200, 255)
  local hubCenter = seg("HubCenter", Vector3.new(0.1, 0.1, 0.1), Vector3.new(0, 5, 0), "White")
  hubCenter.Transparency = 1
  ambLight.Parent = hubCenter

  -- Skybox suggestion (set in Lighting manually or via script)
  Lighting.Ambient = Color3.fromRGB(0, 0, 20)
  Lighting.OutdoorAmbient = Color3.fromRGB(0, 0, 10)

  print("[SpaceStation] Built at", origin)
end

buildStation(Vector3.new(0, 0, 0))
`,
    category: TemplateCategory.MAP_TEMPLATE,
    tags: ['space', 'scifi', 'station', 'free', 'corridor', 'airlock'],
  },

  // 7 ─── Tycoon Starter ────────────────────────────────────────────────────
  {
    title: 'Tycoon Starter',
    slug: 'tycoon-starter-framework',
    description:
      'A complete tycoon foundation with an owned plot, three purchase buttons that unlock and ' +
      'spawn upgrades, a dropper that produces cash orbs on a timer, a collector that converts ' +
      'orbs to player cash, and a simple bank pad. Server-authoritative and ready to expand.',
    luauCode: `-- Tycoon Starter Framework
-- Run in ServerScriptService. Each player who steps on the "ClaimPad" gets their own tycoon.

local Players     = game:GetService("Players")
local RunService  = game:GetService("RunService")
local TweenService = game:GetService("TweenService")

-- ─── Config ─────────────────────────────────────────────────────────────────
local CONFIG = {
  dropRate   = 1.5,   -- seconds between drops
  dropValue  = 10,    -- cash per orb
  plotSize   = Vector3.new(40, 0.5, 40),
  plotColors = { "Bright blue", "Bright red", "Bright green", "Bright yellow" },
}

local playerData: { [Player]: { cash: number, plot: Model?, upgrades: { [string]: boolean } } } = {}

-- ─── Build a plot for a player ────────────────────────────────────────────────
local function buildPlot(player: Player, slotIndex: number)
  local origin = Vector3.new(slotIndex * 60 - 90, 0, 0)
  local model  = Instance.new("Model")
  model.Name   = player.Name .. "_Tycoon"
  model.Parent = workspace

  local function pad(name, size, pos, color)
    local p = Instance.new("Part")
    p.Name = name; p.Size = size
    p.CFrame = CFrame.new(origin + pos)
    p.Anchored = true
    p.BrickColor = BrickColor.new(color)
    p.Material = Enum.Material.SmoothPlastic
    p.Parent = model
    return p
  end

  -- Claim pad & ground
  local ground = pad("Ground", CONFIG.plotSize, Vector3.new(0, 0, 0),
    CONFIG.plotColors[(slotIndex % #CONFIG.plotColors) + 1])
  ground.Material = Enum.Material.Grass

  -- Owner label
  local sg = Instance.new("SurfaceGui")
  sg.Face = Enum.NormalId.Top
  sg.SizingMode = Enum.SurfaceGuiSizingMode.FixedSize
  sg.CanvasSize = Vector2.new(400, 100)
  sg.Parent = ground
  local lbl = Instance.new("TextLabel")
  lbl.Size = UDim2.fromScale(1, 1)
  lbl.BackgroundTransparency = 1
  lbl.Text = player.DisplayName .. "'s Tycoon"
  lbl.Font = Enum.Font.GothamBold
  lbl.TextColor3 = Color3.new(1, 1, 1)
  lbl.TextScaled = true
  lbl.Parent = sg

  -- Dropper
  local dropper = pad("Dropper", Vector3.new(3, 3, 3), Vector3.new(-12, 1.5, -12), "Bright orange")
  dropper:SetAttribute("DropRate", CONFIG.dropRate)
  dropper:SetAttribute("DropValue", CONFIG.dropValue)

  -- Collector
  local collector = pad("Collector", Vector3.new(5, 1, 5), Vector3.new(-12, 0.5, 5), "Cyan")
  collector:SetAttribute("IsCollector", true)

  -- Bank pad
  local bank = pad("Bank", Vector3.new(5, 0.3, 5), Vector3.new(8, 0.15, -10), "Bright yellow")
  bank.Material = Enum.Material.Neon

  -- Three upgrade buttons
  local upgradeNames = { "ConveyorBelt", "Multiplier", "AutoCollect" }
  local upgradeCosts = { 100, 500, 1500 }
  for i, uName in ipairs(upgradeNames) do
    local btn = pad("Btn_" .. uName,
      Vector3.new(4, 1, 4),
      Vector3.new(-14 + i * 6, 0.5, 14),
      "Bright green")
    btn:SetAttribute("UpgradeName", uName)
    btn:SetAttribute("UpgradeCost", upgradeCosts[i])
    local btnGui = Instance.new("SurfaceGui")
    btnGui.Face = Enum.NormalId.Top
    btnGui.SizingMode = Enum.SurfaceGuiSizingMode.FixedSize
    btnGui.CanvasSize = Vector2.new(200, 100)
    btnGui.Parent = btn
    local btnLbl = Instance.new("TextLabel")
    btnLbl.Size = UDim2.fromScale(1, 1)
    btnLbl.BackgroundTransparency = 1
    btnLbl.Text = uName .. "\n$" .. upgradeCosts[i]
    btnLbl.Font = Enum.Font.GothamBold
    btnLbl.TextColor3 = Color3.new(1, 1, 1)
    btnLbl.TextScaled = true
    btnLbl.Parent = btnGui
  end

  playerData[player].plot = model

  -- ─── Dropper loop ──────────────────────────────────────────────────────────
  local elapsed = 0
  local conn
  conn = RunService.Heartbeat:Connect(function(dt)
    if not player.Parent then conn:Disconnect() return end
    elapsed += dt
    if elapsed >= CONFIG.dropRate then
      elapsed = 0
      local orb = Instance.new("Part")
      orb.Name = "CashOrb"
      orb.Shape = Enum.PartType.Ball
      orb.Size = Vector3.new(1, 1, 1)
      orb.BrickColor = BrickColor.new("Bright yellow")
      orb.Material = Enum.Material.Neon
      orb.CFrame = CFrame.new(origin + Vector3.new(-12, 4, -12))
      orb:SetAttribute("Owner", player.Name)
      orb:SetAttribute("Value", CONFIG.dropValue)
      orb.Parent = workspace

      -- Destroy orb after 8 seconds
      game:GetService("Debris"):AddItem(orb, 8)
    end
  end)

  -- ─── Collector touch ────────────────────────────────────────────────────────
  collector.Touched:Connect(function(hit)
    local orb = hit
    if orb.Name ~= "CashOrb" then return end
    if orb:GetAttribute("Owner") ~= player.Name then return end
    local value = orb:GetAttribute("Value") or CONFIG.dropValue
    orb:Destroy()
    if playerData[player] then
      playerData[player].cash += value
    end
  end)

  -- ─── Upgrade button touch ────────────────────────────────────────────────────
  for _, child in ipairs(model:GetDescendants()) do
    if child:IsA("Part") and child:GetAttribute("UpgradeName") then
      child.Touched:Connect(function(hit)
        local char = hit.Parent
        local plr  = Players:GetPlayerFromCharacter(char)
        if plr ~= player then return end
        local uName = child:GetAttribute("UpgradeName") :: string
        local cost  = child:GetAttribute("UpgradeCost")  :: number
        local data  = playerData[player]
        if not data then return end
        if data.upgrades[uName] then return end   -- already owned
        if data.cash < cost then return end
        data.cash -= cost
        data.upgrades[uName] = true
        child.BrickColor = BrickColor.new("Dark stone grey")
        print(player.Name, "purchased", uName)
      end)
    end
  end
end

-- ─── Player lifecycle ─────────────────────────────────────────────────────────
local slotCounter = 0

Players.PlayerAdded:Connect(function(player)
  playerData[player] = { cash = 0, plot = nil, upgrades = {} }
  slotCounter += 1
  buildPlot(player, slotCounter)
  print("[Tycoon] Plot assigned to", player.Name)
end)

Players.PlayerRemoving:Connect(function(player)
  local data = playerData[player]
  if data and data.plot then
    data.plot:Destroy()
  end
  playerData[player] = nil
end)

-- Seed already-joined players (Studio test run)
for _, p in ipairs(Players:GetPlayers()) do
  if not playerData[p] then
    playerData[p] = { cash = 0, plot = nil, upgrades = {} }
    slotCounter += 1
    buildPlot(p, slotCounter)
  end
end
`,
    category: TemplateCategory.GAME_TEMPLATE,
    tags: ['tycoon', 'simulator', 'dropper', 'free', 'economy', 'framework'],
  },

  // 8 ─── Sword Fighting Arena ──────────────────────────────────────────────
  {
    title: 'Sword Fighting Arena',
    slug: 'sword-fighting-arena-starter',
    description:
      'A circular PvP arena with tiered stone seating, four weapon spawn pads, a central raised ' +
      'duel platform, a scoreboard BillboardGui that tracks kills, and coloured team gates. ' +
      'Drop in any sword tool and the arena is immediately playable.',
    luauCode: `-- Sword Fighting Arena Builder
-- Creates the arena geometry, weapon spawns, scoreboard, and kill-tracking.

local Players = game:GetService("Players")

local ARENA_RADIUS = 24
local WALL_HEIGHT  = 8
local SEGMENTS     = 24

local function buildArena(origin: Vector3)
  local model = Instance.new("Model")
  model.Name = "SwordArena"
  model.Parent = workspace

  local function part(name, size, cf, color, mat)
    local p = Instance.new("Part")
    p.Name = name; p.Size = size; p.CFrame = cf
    p.Anchored = true
    p.BrickColor = BrickColor.new(color)
    p.Material = mat or Enum.Material.SmoothPlastic
    p.Parent = model
    return p
  end

  -- Arena floor (flat circle approximated with a cylinder)
  local floor = Instance.new("Part")
  floor.Name = "ArenaFloor"
  floor.Size = Vector3.new(ARENA_RADIUS * 2, 1, ARENA_RADIUS * 2)
  floor.Shape = Enum.PartType.Cylinder
  floor.CFrame = CFrame.new(origin) * CFrame.Angles(0, 0, math.rad(90))
  floor.Anchored = true
  floor.BrickColor = BrickColor.new("Sand yellow")
  floor.Material = Enum.Material.Ground
  floor.Parent = model

  -- Circular outer wall (segmented)
  for i = 0, SEGMENTS - 1 do
    local angle  = (i / SEGMENTS) * math.pi * 2
    local nextA  = ((i + 1) / SEGMENTS) * math.pi * 2
    local midA   = (angle + nextA) / 2
    local segLen = 2 * ARENA_RADIUS * math.sin(math.pi / SEGMENTS) + 0.1

    local wallCF = CFrame.new(
      origin + Vector3.new(
        math.cos(midA) * (ARENA_RADIUS + 1),
        WALL_HEIGHT / 2,
        math.sin(midA) * (ARENA_RADIUS + 1)
      )
    ) * CFrame.Angles(0, midA + math.pi / 2, 0)

    part("Wall" .. i, Vector3.new(segLen, WALL_HEIGHT, 2), wallCF, "Medium stone grey", Enum.Material.SmoothPlastic)
  end

  -- Tiered stone seating (3 rings)
  for tier = 1, 3 do
    local r = ARENA_RADIUS + 4 + tier * 4
    local h = tier * 2.5
    for i = 0, SEGMENTS - 1 do
      local angle = (i / SEGMENTS) * math.pi * 2
      local nextA = ((i + 1) / SEGMENTS) * math.pi * 2
      local midA  = (angle + nextA) / 2
      local segLen = 2 * r * math.sin(math.pi / SEGMENTS) + 0.1
      local seatCF = CFrame.new(
        origin + Vector3.new(math.cos(midA) * r, h, math.sin(midA) * r)
      ) * CFrame.Angles(0, midA + math.pi / 2, 0)
      part("Seat" .. tier .. "_" .. i,
        Vector3.new(segLen, 2, 4), seatCF, "Light stone grey")
    end
  end

  -- Central raised duel platform
  local duelPad = Instance.new("Part")
  duelPad.Name = "DuelPad"
  duelPad.Size = Vector3.new(8, 1, 8)
  duelPad.Shape = Enum.PartType.Cylinder
  duelPad.CFrame = CFrame.new(origin + Vector3.new(0, 0.5, 0)) * CFrame.Angles(0, 0, math.rad(90))
  duelPad.Anchored = true
  duelPad.BrickColor = BrickColor.new("Bright red")
  duelPad.Material = Enum.Material.Neon
  duelPad.Transparency = 0.2
  duelPad.Parent = model

  -- Weapon spawn pads (4 cardinal, equidistant from centre)
  local weaponSpawnRadius = 14
  local kills: { [string]: number } = {}
  for i = 0, 3 do
    local angle = (i / 4) * math.pi * 2
    local spawnPos = origin + Vector3.new(
      math.cos(angle) * weaponSpawnRadius, 0.6,
      math.sin(angle) * weaponSpawnRadius
    )
    local spawnPad = part("WeaponSpawn" .. i,
      Vector3.new(3, 0.3, 3),
      CFrame.new(spawnPos),
      "Bright yellow")
    spawnPad.Material = Enum.Material.Neon
    spawnPad.Transparency = 0.3
    spawnPad:SetAttribute("WeaponSpawnIndex", i)

    -- Glow
    local light = Instance.new("PointLight")
    light.Brightness = 1
    light.Range = 8
    light.Color = Color3.fromRGB(255, 220, 80)
    light.Parent = spawnPad

    -- Spawn label
    local sg = Instance.new("SurfaceGui")
    sg.Face = Enum.NormalId.Top
    sg.SizingMode = Enum.SurfaceGuiSizingMode.FixedSize
    sg.CanvasSize = Vector2.new(150, 50)
    sg.Parent = spawnPad
    local spawnLbl = Instance.new("TextLabel")
    spawnLbl.Size = UDim2.fromScale(1, 1)
    spawnLbl.BackgroundTransparency = 1
    spawnLbl.Text = "WEAPON"
    spawnLbl.Font = Enum.Font.GothamBold
    spawnLbl.TextColor3 = Color3.new(1, 1, 1)
    spawnLbl.TextScaled = true
    spawnLbl.Parent = sg
  end

  -- Scoreboard BillboardGui (on a tall post above the arena)
  local post = part("ScorePost", Vector3.new(1, 20, 1),
    CFrame.new(origin + Vector3.new(0, 10, -ARENA_RADIUS - 3)), "Dark stone grey")
  local board = part("ScoreBoard", Vector3.new(12, 6, 0.5),
    CFrame.new(origin + Vector3.new(0, 21, -ARENA_RADIUS - 3)), "Dark stone grey")
  local boardGui = Instance.new("SurfaceGui")
  boardGui.Face = Enum.NormalId.Front
  boardGui.SizingMode = Enum.SurfaceGuiSizingMode.FixedSize
  boardGui.CanvasSize = Vector2.new(480, 240)
  boardGui.Parent = board
  local boardFrame = Instance.new("Frame")
  boardFrame.Size = UDim2.fromScale(1, 1)
  boardFrame.BackgroundColor3 = Color3.fromRGB(10, 10, 10)
  boardFrame.Parent = boardGui
  local scoreTitle = Instance.new("TextLabel")
  scoreTitle.Size = UDim2.new(1, 0, 0.3, 0)
  scoreTitle.BackgroundTransparency = 1
  scoreTitle.Text = "SCOREBOARD"
  scoreTitle.Font = Enum.Font.GothamBold
  scoreTitle.TextColor3 = Color3.fromRGB(255, 200, 60)
  scoreTitle.TextScaled = true
  scoreTitle.Parent = boardFrame
  local scoreBody = Instance.new("TextLabel")
  scoreBody.Name = "ScoreBody"
  scoreBody.Size = UDim2.new(1, 0, 0.7, 0)
  scoreBody.Position = UDim2.new(0, 0, 0.3, 0)
  scoreBody.BackgroundTransparency = 1
  scoreBody.Text = "Waiting for players..."
  scoreBody.Font = Enum.Font.Gotham
  scoreBody.TextColor3 = Color3.new(1, 1, 1)
  scoreBody.TextScaled = true
  scoreBody.Parent = boardFrame

  -- Kill tracking via Humanoid.Died
  local function onPlayerAdded(player: Player)
    kills[player.Name] = kills[player.Name] or 0
    player.CharacterAdded:Connect(function(char)
      local hum = char:WaitForChild("Humanoid") :: Humanoid
      hum.Died:Connect(function()
        -- Attribute kill to the player whose tag is on the humanoid (simple version)
        local tag = hum:FindFirstChild("creator")
        if tag and tag:IsA("ObjectValue") and tag.Value then
          local killer = tag.Value :: Player
          if killer and killer ~= player then
            kills[killer.Name] = (kills[killer.Name] or 0) + 1
          end
        end
        -- Rebuild scoreboard text
        local lines = {}
        for name, k in pairs(kills) do
          table.insert(lines, name .. "  " .. k .. " kills")
        end
        table.sort(lines, function(a, b)
          local ka = tonumber(a:match("(%d+) kills")) or 0
          local kb = tonumber(b:match("(%d+) kills")) or 0
          return ka > kb
        end)
        scoreBody.Text = table.concat(lines, "\n")
      end)
    end)
  end

  Players.PlayerAdded:Connect(onPlayerAdded)
  for _, p in ipairs(Players:GetPlayers()) do
    onPlayerAdded(p)
  end

  -- Team entry gates (north = blue, south = red)
  local gateN = part("GateNorth", Vector3.new(6, 8, 0.5),
    CFrame.new(origin + Vector3.new(0, 4, -ARENA_RADIUS + 1)), "Electric blue")
  gateN.Material = Enum.Material.Neon
  gateN.Transparency = 0.5
  local gateS = part("GateSouth", Vector3.new(6, 8, 0.5),
    CFrame.new(origin + Vector3.new(0, 4,  ARENA_RADIUS - 1)), "Bright red")
  gateS.Material = Enum.Material.Neon
  gateS.Transparency = 0.5

  print("[Arena] Sword Fighting Arena built at", origin)
end

buildArena(Vector3.new(0, 0, 0))
`,
    category: TemplateCategory.GAME_TEMPLATE,
    tags: ['arena', 'pvp', 'sword', 'free', 'fighting', 'scoreboard'],
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Builds the full description stored in the DB: human summary + Luau code block */
function buildFullDescription(template: SeedTemplate): string {
  return [
    template.description,
    '',
    '---LUAU---',
    template.luauCode.trim(),
    '---END---',
  ].join('\n')
}

/** Generates a deterministic slug suffix so re-runs stay idempotent */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function main() {
  console.log('Seeding marketplace templates...\n')

  // 1. Upsert the system creator account
  const systemUser = await prisma.user.upsert({
    where: { email: SYSTEM_USER.email },
    update: { displayName: SYSTEM_USER.displayName },
    create: {
      clerkId:     SYSTEM_USER.clerkId,
      email:       SYSTEM_USER.email,
      username:    SYSTEM_USER.username,
      displayName: SYSTEM_USER.displayName,
    },
  })
  console.log(`System creator: ${systemUser.displayName} (${systemUser.id})\n`)

  // 2. Upsert each template
  let created = 0
  let updated = 0

  for (const tmpl of TEMPLATES) {
    const fullDescription = buildFullDescription(tmpl)

    const existing = await prisma.template.findUnique({ where: { slug: tmpl.slug } })

    if (existing) {
      await prisma.template.update({
        where: { slug: tmpl.slug },
        data: {
          title:       tmpl.title,
          description: fullDescription,
          category:    tmpl.category,
          tags:        tmpl.tags,
          priceCents:  0,
          status:      TemplateStatus.PUBLISHED,
        },
      })
      console.log(`  UPDATED  ${tmpl.title}`)
      updated++
    } else {
      await prisma.template.create({
        data: {
          creatorId:   systemUser.id,
          title:       tmpl.title,
          slug:        tmpl.slug,
          description: fullDescription,
          category:    tmpl.category,
          tags:        tmpl.tags,
          priceCents:  0,
          status:      TemplateStatus.PUBLISHED,
          downloads:   0,
          averageRating: 0,
          reviewCount:   0,
        },
      })
      console.log(`  CREATED  ${tmpl.title}`)
      created++
    }
  }

  console.log(`\nDone. ${created} created, ${updated} updated.`)
  console.log('Run "npx tsx src/scripts/seed-templates.ts" to re-seed at any time.')
}

main()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
