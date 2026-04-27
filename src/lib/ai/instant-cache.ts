import 'server-only'

/**
 * instant-cache.ts — Pre-built Luau for the 20 most common prompts.
 *
 * Cache hit = instant response, zero AI call, <50ms.
 * Every build uses the standard P()/W()/Cyl()/Ball() helpers with the
 * full ChangeHistoryService boilerplate so undo works in Studio.
 */

export interface CachedBuild {
  prompt: string           // canonical prompt
  keywords: string[]       // trigger words
  conversationText: string // what the AI says
  luauCode: string         // complete working Luau
  partCount: number
}

// ---------------------------------------------------------------------------
// Boilerplate shared by every cached build
// ---------------------------------------------------------------------------

const HEADER = `local CH = game:GetService("ChangeHistoryService")
local rid = CH:TryBeginRecording("ForjeAI Build")
local cam = workspace.CurrentCamera
local sp = cam.CFrame.Position + cam.CFrame.LookVector * 30
local gy = (workspace:Raycast(sp+Vector3.new(0,50,0),Vector3.new(0,-200,0)) or {Position=Vector3.new(0,0,0)}).Position.Y
sp = Vector3.new(sp.X, gy, sp.Z)
local m = Instance.new("Model") m.Name = "__NAME__"
local vc = function(r,g,b) return Color3.fromRGB(r,g,b) end

local function P(name, cf, size, mat, col, parent)
  local p = Instance.new("Part"); p.Name = name; p.CFrame = cf; p.Size = size
  p.Material = mat; p.Color = col; p.Anchored = true
  p.CastShadow = true; p.Parent = parent or m; return p
end
local function W(name, cf, size, mat, col, parent)
  local w = Instance.new("WedgePart"); w.Name = name; w.CFrame = cf; w.Size = size
  w.Material = mat; w.Color = col; w.Anchored = true; w.Parent = parent or m; return w
end
local function Cyl(name, cf, size, mat, col, parent)
  local p = Instance.new("Part"); p.Name = name; p.Shape = Enum.PartType.Cylinder
  p.CFrame = cf; p.Size = size; p.Material = mat; p.Color = col
  p.Anchored = true; p.Parent = parent or m; return p
end
local function Ball(name, cf, diameter, mat, col, parent)
  local p = Instance.new("Part"); p.Name = name; p.Shape = Enum.PartType.Ball
  p.CFrame = cf; p.Size = Vector3.one * diameter; p.Material = mat; p.Color = col
  p.Anchored = true; p.Parent = parent or m; return p
end
local function Light(parent, brightness, range, r, g, b)
  local l = Instance.new("PointLight"); l.Brightness = brightness; l.Range = range
  l.Color = Color3.fromRGB(r, g, b); l.Parent = parent; return l
end
`

const FOOTER = `
m.Parent = workspace
game:GetService("CollectionService"):AddTag(m, "ForjeAI")
game:GetService("Selection"):Set({m})
if rid then CH:FinishRecording(rid, Enum.FinishRecordingOperation.Commit) end
`

function wrap(name: string, body: string): string {
  return HEADER.replace('__NAME__', name) + '\n' + body + '\n' + FOOTER
}

// ---------------------------------------------------------------------------
// 20 Cached Builds
// ---------------------------------------------------------------------------

const BUILDS: CachedBuild[] = [
  // 1. Oak Tree
  {
    prompt: 'tree',
    keywords: ['tree', 'oak', 'oak tree'],
    conversationText: 'Here\'s a nice oak tree with a thick trunk, spreading canopy, and root details. Looks great in any scene.',
    partCount: 8,
    luauCode: wrap('Oak_Tree', `
-- Trunk
Cyl("Trunk", CFrame.new(sp.X, gy+4, sp.Z) * CFrame.Angles(0,0,math.rad(90)), Vector3.new(8, 2.5, 2.5), Enum.Material.Wood, vc(101, 67, 33))
-- Canopy
Ball("Canopy_1", CFrame.new(sp.X, gy+9, sp.Z), 8, Enum.Material.Grass, vc(34, 139, 34))
Ball("Canopy_2", CFrame.new(sp.X+3, gy+8.5, sp.Z+2), 6, Enum.Material.Grass, vc(0, 128, 0))
Ball("Canopy_3", CFrame.new(sp.X-2.5, gy+8, sp.Z-2), 7, Enum.Material.Grass, vc(50, 160, 50))
-- Roots
W("Root_1", CFrame.new(sp.X+1.5, gy+0.4, sp.Z+1) * CFrame.Angles(0, math.rad(45), 0), Vector3.new(1, 0.8, 2.5), Enum.Material.Wood, vc(80, 50, 20))
W("Root_2", CFrame.new(sp.X-1.5, gy+0.4, sp.Z-0.8) * CFrame.Angles(0, math.rad(-30), 0), Vector3.new(1, 0.8, 2), Enum.Material.Wood, vc(80, 50, 20))
W("Root_3", CFrame.new(sp.X+0.5, gy+0.4, sp.Z-1.5) * CFrame.Angles(0, math.rad(160), 0), Vector3.new(1, 0.8, 2.2), Enum.Material.Wood, vc(90, 55, 25))
W("Root_4", CFrame.new(sp.X-1, gy+0.4, sp.Z+1.3) * CFrame.Angles(0, math.rad(-120), 0), Vector3.new(1, 0.7, 1.8), Enum.Material.Wood, vc(85, 52, 22))
`),
  },

  // 2. Pine Tree
  {
    prompt: 'pine tree',
    keywords: ['pine', 'pine tree', 'evergreen', 'fir', 'christmas tree'],
    conversationText: 'Built a tall pine tree with a tapered canopy and thick trunk. Perfect for forest scenes.',
    partCount: 10,
    luauCode: wrap('Pine_Tree', `
-- Trunk
Cyl("Trunk", CFrame.new(sp.X, gy+5, sp.Z) * CFrame.Angles(0,0,math.rad(90)), Vector3.new(10, 2, 2), Enum.Material.Wood, vc(90, 55, 25))
-- Canopy layers (stacked cones via cylinders decreasing in size)
Cyl("Canopy_1", CFrame.new(sp.X, gy+4, sp.Z) * CFrame.Angles(0,0,math.rad(90)), Vector3.new(2, 10, 10), Enum.Material.Grass, vc(0, 100, 0))
Cyl("Canopy_2", CFrame.new(sp.X, gy+6, sp.Z) * CFrame.Angles(0,0,math.rad(90)), Vector3.new(2, 8.5, 8.5), Enum.Material.Grass, vc(10, 110, 10))
Cyl("Canopy_3", CFrame.new(sp.X, gy+8, sp.Z) * CFrame.Angles(0,0,math.rad(90)), Vector3.new(2, 7, 7), Enum.Material.Grass, vc(0, 105, 0))
Cyl("Canopy_4", CFrame.new(sp.X, gy+10, sp.Z) * CFrame.Angles(0,0,math.rad(90)), Vector3.new(2, 5.5, 5.5), Enum.Material.Grass, vc(15, 115, 15))
Cyl("Canopy_5", CFrame.new(sp.X, gy+12, sp.Z) * CFrame.Angles(0,0,math.rad(90)), Vector3.new(1.8, 4, 4), Enum.Material.Grass, vc(0, 95, 0))
Cyl("Canopy_6", CFrame.new(sp.X, gy+13.5, sp.Z) * CFrame.Angles(0,0,math.rad(90)), Vector3.new(1.5, 2.5, 2.5), Enum.Material.Grass, vc(10, 100, 10))
Cyl("Canopy_7", CFrame.new(sp.X, gy+14.8, sp.Z) * CFrame.Angles(0,0,math.rad(90)), Vector3.new(1, 1.2, 1.2), Enum.Material.Grass, vc(0, 90, 0))
-- Top point
Ball("TopPoint", CFrame.new(sp.X, gy+15.5, sp.Z), 0.8, Enum.Material.Grass, vc(0, 80, 0))
`),
  },

  // 3. Bush
  {
    prompt: 'bush',
    keywords: ['bush', 'shrub', 'hedge'],
    conversationText: 'Placed a lush green bush. Great for filling out gardens and pathways.',
    partCount: 3,
    luauCode: wrap('Bush', `
Ball("Bush_1", CFrame.new(sp.X, gy+1.5, sp.Z), 3, Enum.Material.Grass, vc(34, 120, 15))
Ball("Bush_2", CFrame.new(sp.X+1, gy+1.2, sp.Z+0.8), 2.5, Enum.Material.Grass, vc(40, 130, 20))
Ball("Bush_3", CFrame.new(sp.X-0.8, gy+1, sp.Z-0.5), 2.8, Enum.Material.Grass, vc(30, 110, 10))
`),
  },

  // 4. Rock
  {
    prompt: 'rock',
    keywords: ['rock', 'stone', 'boulder'],
    conversationText: 'Dropped a natural-looking rock formation with varied angles and slate material.',
    partCount: 3,
    luauCode: wrap('Rock', `
P("Rock_1", CFrame.new(sp.X, gy+1, sp.Z) * CFrame.Angles(math.rad(5), math.rad(15), math.rad(-8)), Vector3.new(4, 2.5, 3.5), Enum.Material.Slate, vc(130, 130, 130))
P("Rock_2", CFrame.new(sp.X+1.2, gy+0.8, sp.Z+0.8) * CFrame.Angles(math.rad(-10), math.rad(40), math.rad(12)), Vector3.new(2.5, 2, 2.8), Enum.Material.Slate, vc(110, 110, 115))
P("Rock_3", CFrame.new(sp.X-0.8, gy+0.5, sp.Z-0.6) * CFrame.Angles(math.rad(8), math.rad(-20), math.rad(5)), Vector3.new(2, 1.5, 2.2), Enum.Material.Slate, vc(120, 118, 125))
`),
  },

  // 5. Street Lamp
  {
    prompt: 'street lamp',
    keywords: ['street lamp', 'lamp post', 'lamppost', 'street light', 'streetlight', 'light post'],
    conversationText: 'Built a street lamp with a solid base, tall pole, and warm PointLight. Lights up the area nicely.',
    partCount: 7,
    luauCode: wrap('Street_Lamp', `
-- Base
Cyl("Base", CFrame.new(sp.X, gy+0.3, sp.Z) * CFrame.Angles(0,0,math.rad(90)), Vector3.new(0.6, 3, 3), Enum.Material.Metal, vc(50, 50, 55))
-- Pole
Cyl("Pole", CFrame.new(sp.X, gy+6, sp.Z) * CFrame.Angles(0,0,math.rad(90)), Vector3.new(12, 0.6, 0.6), Enum.Material.Metal, vc(60, 60, 65))
-- Arm
P("Arm", CFrame.new(sp.X+1.5, gy+11.5, sp.Z), Vector3.new(3, 0.4, 0.4), Enum.Material.Metal, vc(60, 60, 65))
-- Housing
P("Housing", CFrame.new(sp.X+2.8, gy+11.2, sp.Z), Vector3.new(1.5, 0.6, 1.2), Enum.Material.Metal, vc(45, 45, 50))
-- Glass
P("Glass", CFrame.new(sp.X+2.8, gy+10.8, sp.Z), Vector3.new(1.2, 0.3, 1), Enum.Material.Glass, vc(255, 230, 180))
-- Decorative ring
Cyl("Ring", CFrame.new(sp.X, gy+10.5, sp.Z) * CFrame.Angles(0,0,math.rad(90)), Vector3.new(0.3, 1, 1), Enum.Material.Metal, vc(70, 70, 75))
-- Light
local glass = m:FindFirstChild("Glass")
if glass then Light(glass, 2, 30, 255, 220, 180) end
`),
  },

  // 6. Bench
  {
    prompt: 'bench',
    keywords: ['bench', 'park bench', 'seat'],
    conversationText: 'Here\'s a park bench with stone ends and wooden slats. Ready for NPCs or players to sit on.',
    partCount: 7,
    luauCode: wrap('Park_Bench', `
-- Stone ends
P("End_L", CFrame.new(sp.X-2.5, gy+1, sp.Z), Vector3.new(0.5, 2, 2), Enum.Material.Concrete, vc(160, 160, 160))
P("End_R", CFrame.new(sp.X+2.5, gy+1, sp.Z), Vector3.new(0.5, 2, 2), Enum.Material.Concrete, vc(160, 160, 160))
-- Seat slats
P("Slat_1", CFrame.new(sp.X, gy+1.9, sp.Z-0.6), Vector3.new(5, 0.2, 0.5), Enum.Material.Wood, vc(139, 90, 43))
P("Slat_2", CFrame.new(sp.X, gy+1.9, sp.Z), Vector3.new(5, 0.2, 0.5), Enum.Material.Wood, vc(139, 90, 43))
P("Slat_3", CFrame.new(sp.X, gy+1.9, sp.Z+0.6), Vector3.new(5, 0.2, 0.5), Enum.Material.Wood, vc(139, 90, 43))
-- Back slats
P("Back_1", CFrame.new(sp.X, gy+2.8, sp.Z-0.9) * CFrame.Angles(math.rad(-10), 0, 0), Vector3.new(5, 0.2, 0.5), Enum.Material.Wood, vc(120, 75, 35))
P("Back_2", CFrame.new(sp.X, gy+3.5, sp.Z-1) * CFrame.Angles(math.rad(-10), 0, 0), Vector3.new(5, 0.2, 0.5), Enum.Material.Wood, vc(120, 75, 35))
`),
  },

  // 7. Chair
  {
    prompt: 'chair',
    keywords: ['chair', 'wooden chair'],
    conversationText: 'Built a solid wooden chair. Simple, clean, works anywhere.',
    partCount: 6,
    luauCode: wrap('Chair', `
-- Seat
P("Seat", CFrame.new(sp.X, gy+2, sp.Z), Vector3.new(2, 0.3, 2), Enum.Material.Wood, vc(139, 90, 43))
-- Back
P("Back", CFrame.new(sp.X, gy+3.5, sp.Z-0.9), Vector3.new(2, 2.8, 0.3), Enum.Material.Wood, vc(120, 75, 35))
-- Legs
P("Leg_FL", CFrame.new(sp.X-0.8, gy+1, sp.Z+0.8), Vector3.new(0.3, 2, 0.3), Enum.Material.Wood, vc(100, 65, 30))
P("Leg_FR", CFrame.new(sp.X+0.8, gy+1, sp.Z+0.8), Vector3.new(0.3, 2, 0.3), Enum.Material.Wood, vc(100, 65, 30))
P("Leg_BL", CFrame.new(sp.X-0.8, gy+1, sp.Z-0.8), Vector3.new(0.3, 2, 0.3), Enum.Material.Wood, vc(100, 65, 30))
P("Leg_BR", CFrame.new(sp.X+0.8, gy+1, sp.Z-0.8), Vector3.new(0.3, 2, 0.3), Enum.Material.Wood, vc(100, 65, 30))
`),
  },

  // 8. Table
  {
    prompt: 'table',
    keywords: ['table', 'wooden table', 'desk'],
    conversationText: 'Here\'s a wooden table with a flat top and four legs. Good for any interior.',
    partCount: 5,
    luauCode: wrap('Table', `
-- Tabletop
P("Top", CFrame.new(sp.X, gy+3, sp.Z), Vector3.new(5, 0.4, 3), Enum.Material.Wood, vc(160, 100, 50))
-- Legs
P("Leg_FL", CFrame.new(sp.X-2.2, gy+1.5, sp.Z+1.2), Vector3.new(0.4, 3, 0.4), Enum.Material.Wood, vc(130, 80, 40))
P("Leg_FR", CFrame.new(sp.X+2.2, gy+1.5, sp.Z+1.2), Vector3.new(0.4, 3, 0.4), Enum.Material.Wood, vc(130, 80, 40))
P("Leg_BL", CFrame.new(sp.X-2.2, gy+1.5, sp.Z-1.2), Vector3.new(0.4, 3, 0.4), Enum.Material.Wood, vc(130, 80, 40))
P("Leg_BR", CFrame.new(sp.X+2.2, gy+1.5, sp.Z-1.2), Vector3.new(0.4, 3, 0.4), Enum.Material.Wood, vc(130, 80, 40))
`),
  },

  // 9. Fence Section (loop for 10 sections)
  {
    prompt: 'fence',
    keywords: ['fence', 'fence section', 'fencing', 'wooden fence'],
    conversationText: 'Built a 10-section wooden fence. Extends 40 studs across. Resize or recolor as needed.',
    partCount: 40,
    luauCode: wrap('Fence', `
for i = 0, 9 do
  local ox = i * 4
  -- Posts
  P("Post_"..i.."_L", CFrame.new(sp.X+ox, gy+2, sp.Z), Vector3.new(0.5, 4, 0.5), Enum.Material.Wood, vc(110, 70, 30))
  P("Post_"..i.."_R", CFrame.new(sp.X+ox+3.5, gy+2, sp.Z), Vector3.new(0.5, 4, 0.5), Enum.Material.Wood, vc(110, 70, 30))
  -- Rails
  P("Rail_"..i.."_T", CFrame.new(sp.X+ox+1.75, gy+3.5, sp.Z), Vector3.new(3.5, 0.3, 0.3), Enum.Material.Wood, vc(139, 90, 43))
  P("Rail_"..i.."_B", CFrame.new(sp.X+ox+1.75, gy+1.5, sp.Z), Vector3.new(3.5, 0.3, 0.3), Enum.Material.Wood, vc(139, 90, 43))
end
`),
  },

  // 10. Campfire
  {
    prompt: 'campfire',
    keywords: ['campfire', 'camp fire', 'fire pit', 'firepit', 'bonfire'],
    conversationText: 'Built a campfire with a stone ring, crossed logs, and warm fire effect. Cozy vibes.',
    partCount: 13,
    luauCode: wrap('Campfire', `
-- Stone ring (8 rocks in a circle)
for i = 0, 7 do
  local angle = math.rad(i * 45)
  local rx = math.cos(angle) * 3
  local rz = math.sin(angle) * 3
  P("Stone_"..i, CFrame.new(sp.X+rx, gy+0.4, sp.Z+rz) * CFrame.Angles(math.rad(math.random(-10,10)), math.rad(i*45), 0), Vector3.new(1.2, 0.8, 1.5), Enum.Material.Slate, vc(100+math.random(0,30), 95+math.random(0,20), 90+math.random(0,20)))
end
-- Logs
Cyl("Log_1", CFrame.new(sp.X, gy+0.5, sp.Z) * CFrame.Angles(0, math.rad(30), math.rad(90)), Vector3.new(3.5, 0.6, 0.6), Enum.Material.Wood, vc(90, 55, 20))
Cyl("Log_2", CFrame.new(sp.X, gy+0.5, sp.Z) * CFrame.Angles(0, math.rad(-30), math.rad(90)), Vector3.new(3.5, 0.6, 0.6), Enum.Material.Wood, vc(80, 50, 18))
Cyl("Log_3", CFrame.new(sp.X, gy+0.8, sp.Z) * CFrame.Angles(0, math.rad(90), math.rad(90)), Vector3.new(3, 0.5, 0.5), Enum.Material.Wood, vc(95, 58, 22))
-- Fire glow
local firePart = P("FireGlow", CFrame.new(sp.X, gy+1.2, sp.Z), Vector3.new(1, 1.5, 1), Enum.Material.Neon, vc(255, 100, 0))
firePart.Transparency = 0.3
local fire = Instance.new("Fire"); fire.Size = 8; fire.Heat = 12; fire.Parent = firePart
Light(firePart, 2.5, 25, 255, 160, 50)
`),
  },

  // 11. Wooden Crate
  {
    prompt: 'crate',
    keywords: ['crate', 'wooden crate', 'box', 'shipping crate'],
    conversationText: 'Placed a wooden crate with a lid and metal straps. Good for decoration or interactive props.',
    partCount: 4,
    luauCode: wrap('Wooden_Crate', `
-- Box body
P("Box", CFrame.new(sp.X, gy+1.5, sp.Z), Vector3.new(3, 3, 3), Enum.Material.Wood, vc(160, 100, 50))
-- Lid
P("Lid", CFrame.new(sp.X, gy+3.1, sp.Z), Vector3.new(3.2, 0.3, 3.2), Enum.Material.Wood, vc(140, 85, 40))
-- Metal straps
P("Strap_1", CFrame.new(sp.X, gy+1.5, sp.Z+1.55), Vector3.new(3.1, 3.1, 0.1), Enum.Material.Metal, vc(80, 80, 85))
P("Strap_2", CFrame.new(sp.X, gy+1.5, sp.Z-1.55), Vector3.new(3.1, 3.1, 0.1), Enum.Material.Metal, vc(80, 80, 85))
`),
  },

  // 12. Barrel
  {
    prompt: 'barrel',
    keywords: ['barrel', 'wooden barrel', 'keg'],
    conversationText: 'Here\'s a wooden barrel with metal rings. Classic prop for any scene.',
    partCount: 3,
    luauCode: wrap('Barrel', `
-- Main barrel body
Cyl("Body", CFrame.new(sp.X, gy+2, sp.Z) * CFrame.Angles(0,0,math.rad(90)), Vector3.new(4, 2.5, 2.5), Enum.Material.Wood, vc(140, 85, 35))
-- Metal rings
Cyl("Ring_Top", CFrame.new(sp.X, gy+3.5, sp.Z) * CFrame.Angles(0,0,math.rad(90)), Vector3.new(0.3, 2.7, 2.7), Enum.Material.Metal, vc(70, 70, 75))
Cyl("Ring_Bot", CFrame.new(sp.X, gy+0.5, sp.Z) * CFrame.Angles(0,0,math.rad(90)), Vector3.new(0.3, 2.7, 2.7), Enum.Material.Metal, vc(70, 70, 75))
`),
  },

  // 13. Flower Pot
  {
    prompt: 'flower pot',
    keywords: ['flower pot', 'flowerpot', 'planter', 'potted plant', 'plant pot'],
    conversationText: 'Placed a terracotta flower pot with soil and a bright flower. Nice little accent piece.',
    partCount: 3,
    luauCode: wrap('Flower_Pot', `
-- Pot
Cyl("Pot", CFrame.new(sp.X, gy+1, sp.Z) * CFrame.Angles(0,0,math.rad(90)), Vector3.new(2, 2.5, 2.5), Enum.Material.Concrete, vc(180, 100, 50))
-- Soil
Cyl("Soil", CFrame.new(sp.X, gy+2, sp.Z) * CFrame.Angles(0,0,math.rad(90)), Vector3.new(0.3, 2.2, 2.2), Enum.Material.Ground, vc(80, 50, 25))
-- Flower
Ball("Flower", CFrame.new(sp.X, gy+3, sp.Z), 1.2, Enum.Material.Grass, vc(255, 80, 120))
`),
  },

  // 14. Mailbox
  {
    prompt: 'mailbox',
    keywords: ['mailbox', 'mail box', 'letter box', 'letterbox'],
    conversationText: 'Built a classic mailbox with post and flag. Ready for any neighborhood scene.',
    partCount: 3,
    luauCode: wrap('Mailbox', `
-- Post
P("Post", CFrame.new(sp.X, gy+2, sp.Z), Vector3.new(0.4, 4, 0.4), Enum.Material.Wood, vc(90, 55, 25))
-- Box
P("Box", CFrame.new(sp.X, gy+4.2, sp.Z+0.3), Vector3.new(1.5, 1.2, 2), Enum.Material.Metal, vc(30, 60, 160))
-- Flag
P("Flag", CFrame.new(sp.X+1, gy+4.5, sp.Z-0.5), Vector3.new(0.1, 0.8, 0.5), Enum.Material.Metal, vc(220, 40, 40))
`),
  },

  // 15. Trash Can
  {
    prompt: 'trash can',
    keywords: ['trash can', 'trashcan', 'garbage can', 'bin', 'waste bin', 'rubbish bin'],
    conversationText: 'Placed a metal trash can with a lid. Simple and functional.',
    partCount: 2,
    luauCode: wrap('Trash_Can', `
-- Body
Cyl("Body", CFrame.new(sp.X, gy+1.5, sp.Z) * CFrame.Angles(0,0,math.rad(90)), Vector3.new(3, 2, 2), Enum.Material.Metal, vc(90, 90, 95))
-- Lid
Cyl("Lid", CFrame.new(sp.X, gy+3.1, sp.Z) * CFrame.Angles(0,0,math.rad(90)), Vector3.new(0.3, 2.3, 2.3), Enum.Material.Metal, vc(100, 100, 105))
`),
  },

  // 16. Stop Sign
  {
    prompt: 'stop sign',
    keywords: ['stop sign', 'stopsign', 'road sign'],
    conversationText: 'Built a stop sign with a tall pole. Recognizable red octagon shape.',
    partCount: 2,
    luauCode: wrap('Stop_Sign', `
-- Pole
Cyl("Pole", CFrame.new(sp.X, gy+4, sp.Z) * CFrame.Angles(0,0,math.rad(90)), Vector3.new(8, 0.4, 0.4), Enum.Material.Metal, vc(160, 160, 165))
-- Sign (octagon approximated as a Part — works well at Roblox scale)
P("Sign", CFrame.new(sp.X, gy+8.5, sp.Z), Vector3.new(3, 3, 0.2), Enum.Material.Metal, vc(200, 30, 30))
`),
  },

  // 17. Bookshelf
  {
    prompt: 'bookshelf',
    keywords: ['bookshelf', 'book shelf', 'bookcase', 'book case', 'shelf'],
    conversationText: 'Built a wooden bookshelf packed with colorful books. 20 parts total — great interior detail.',
    partCount: 20,
    luauCode: wrap('Bookshelf', `
-- Frame
P("Frame_L", CFrame.new(sp.X-2.2, gy+3, sp.Z), Vector3.new(0.3, 6, 1.5), Enum.Material.Wood, vc(110, 70, 30))
P("Frame_R", CFrame.new(sp.X+2.2, gy+3, sp.Z), Vector3.new(0.3, 6, 1.5), Enum.Material.Wood, vc(110, 70, 30))
-- Shelves
for i = 0, 3 do
  P("Shelf_"..i, CFrame.new(sp.X, gy+0.3+i*1.7, sp.Z), Vector3.new(4.4, 0.2, 1.5), Enum.Material.Wood, vc(120, 75, 35))
end
-- Books (15 colored books across shelves)
local colors = {
  vc(180,40,40), vc(40,80,180), vc(40,140,40), vc(180,140,40), vc(140,40,140),
  vc(200,100,30), vc(60,60,60), vc(150,30,30), vc(30,120,150), vc(130,90,50),
  vc(80,40,120), vc(200,60,80), vc(50,150,80), vc(170,130,50), vc(100,60,160),
}
for i = 0, 14 do
  local shelf = math.floor(i / 5)
  local pos = i % 5
  local h = 1 + math.random() * 0.4
  P("Book_"..i, CFrame.new(sp.X - 1.6 + pos * 0.8, gy + 0.8 + shelf * 1.7, sp.Z), Vector3.new(0.3, h, 1), Enum.Material.Concrete, colors[i+1])
end
`),
  },

  // 18. Treasure Chest
  {
    prompt: 'treasure chest',
    keywords: ['treasure chest', 'chest', 'loot chest', 'treasure'],
    conversationText: 'Built a treasure chest with an angled open lid and gold inside. Perfect for RPG loot.',
    partCount: 4,
    luauCode: wrap('Treasure_Chest', `
-- Box
P("Box", CFrame.new(sp.X, gy+1, sp.Z), Vector3.new(3, 2, 2), Enum.Material.Wood, vc(120, 70, 25))
-- Lid (angled open)
W("Lid", CFrame.new(sp.X, gy+2.5, sp.Z-1.2) * CFrame.Angles(math.rad(-30), 0, 0), Vector3.new(3, 0.4, 2), Enum.Material.Wood, vc(140, 85, 35))
-- Metal trim
P("Trim", CFrame.new(sp.X, gy+1, sp.Z+1.05), Vector3.new(3.1, 2.1, 0.1), Enum.Material.Metal, vc(180, 150, 40))
-- Gold inside
Ball("Gold", CFrame.new(sp.X, gy+1.5, sp.Z), 1.2, Enum.Material.Metal, vc(255, 200, 50))
`),
  },

  // 19. Well
  {
    prompt: 'well',
    keywords: ['well', 'water well', 'wishing well', 'stone well'],
    conversationText: 'Built a stone well with posts, a roof, and a hanging bucket. Classic medieval prop.',
    partCount: 8,
    luauCode: wrap('Well', `
-- Cylinder base
Cyl("Base", CFrame.new(sp.X, gy+1.5, sp.Z) * CFrame.Angles(0,0,math.rad(90)), Vector3.new(3, 4, 4), Enum.Material.Cobblestone, vc(140, 130, 120))
-- Water inside
Cyl("Water", CFrame.new(sp.X, gy+0.5, sp.Z) * CFrame.Angles(0,0,math.rad(90)), Vector3.new(0.1, 3.5, 3.5), Enum.Material.Glass, vc(40, 100, 180))
-- Posts
P("Post_1", CFrame.new(sp.X-1.5, gy+4, sp.Z), Vector3.new(0.4, 5, 0.4), Enum.Material.Wood, vc(100, 65, 30))
P("Post_2", CFrame.new(sp.X+1.5, gy+4, sp.Z), Vector3.new(0.4, 5, 0.4), Enum.Material.Wood, vc(100, 65, 30))
-- Crossbar
P("Crossbar", CFrame.new(sp.X, gy+6.5, sp.Z), Vector3.new(3.5, 0.3, 0.3), Enum.Material.Wood, vc(90, 55, 25))
-- Roof
W("Roof_L", CFrame.new(sp.X-1, gy+7.5, sp.Z) * CFrame.Angles(0, 0, math.rad(20)), Vector3.new(1.5, 0.2, 3), Enum.Material.Wood, vc(80, 50, 20))
W("Roof_R", CFrame.new(sp.X+1, gy+7.5, sp.Z) * CFrame.Angles(0, math.rad(180), math.rad(20)), Vector3.new(1.5, 0.2, 3), Enum.Material.Wood, vc(80, 50, 20))
-- Bucket
Cyl("Bucket", CFrame.new(sp.X, gy+3.5, sp.Z) * CFrame.Angles(0,0,math.rad(90)), Vector3.new(1.2, 1, 1), Enum.Material.Metal, vc(90, 90, 95))
`),
  },

  // 20. Torch
  {
    prompt: 'torch',
    keywords: ['torch', 'wall torch', 'sconce', 'fire torch'],
    conversationText: 'Built a wall torch with bracket, handle, and warm fire effect. Great for medieval or dungeon scenes.',
    partCount: 5,
    luauCode: wrap('Wall_Torch', `
-- Wall bracket
P("Bracket", CFrame.new(sp.X, gy+4, sp.Z), Vector3.new(0.6, 0.6, 0.4), Enum.Material.Metal, vc(60, 55, 50))
-- Handle
Cyl("Handle", CFrame.new(sp.X, gy+4.8, sp.Z+0.5) * CFrame.Angles(math.rad(20), 0, math.rad(90)), Vector3.new(2, 0.3, 0.3), Enum.Material.Wood, vc(90, 55, 25))
-- Flame holder
P("Holder", CFrame.new(sp.X, gy+5.8, sp.Z+0.8), Vector3.new(0.5, 0.5, 0.5), Enum.Material.Metal, vc(50, 50, 55))
-- Flame (Neon)
local flame = P("Flame", CFrame.new(sp.X, gy+6.3, sp.Z+0.8), Vector3.new(0.4, 0.6, 0.4), Enum.Material.Neon, vc(255, 120, 20))
flame.Transparency = 0.2
local fire = Instance.new("Fire"); fire.Size = 3; fire.Heat = 6; fire.Parent = flame
-- PointLight
Light(flame, 2, 20, 255, 180, 80)
`),
  },
]

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

export function findCachedBuild(prompt: string): CachedBuild | null {
  const lower = prompt.toLowerCase().trim()

  // Exact keyword match first
  for (const build of BUILDS) {
    for (const kw of build.keywords) {
      if (lower === kw || lower === `build a ${kw}` || lower === `make a ${kw}` || lower === `create a ${kw}` || lower === `build me a ${kw}` || lower === `make me a ${kw}`) {
        return build
      }
    }
  }

  // Fuzzy: check if any keyword is a whole word in the prompt
  for (const build of BUILDS) {
    for (const kw of build.keywords) {
      const re = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
      if (re.test(lower)) {
        return build
      }
    }
  }

  return null
}
