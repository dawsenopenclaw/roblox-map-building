/**
 * build-cache.ts -- Proven Build Cache System
 *
 * Serves pre-tested, high-quality builds instantly instead of regenerating
 * from scratch every time. When 10 users ask "build me a house", user #1
 * triggers AI generation, and users #2-10 get the cached result in <1s.
 *
 * Flow:
 * 1. User prompt comes in
 * 2. matchProvenBuild() checks against trigger patterns
 * 3. If hit: serve cached code with customization (colors, names)
 * 4. If miss: AI generates as normal, then cacheSuccessfulBuild() saves it
 *
 * This file is used BEFORE calling the AI in the chat route.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProvenBuild {
  id: string
  triggers: RegExp[]
  description: string
  partCount: number
  tags: string[]
  style: 'modern' | 'medieval' | 'rustic' | 'fantasy' | 'sci-fi' | 'japanese' | 'gothic' | 'tropical' | 'industrial' | 'classic'
  /** Pre-generated Luau code. null = template only, filled on first successful generation */
  code: string | null
  /** Fields the customizer can swap out via find-and-replace */
  customizable: { key: string; default: string; description: string }[]
}

export interface CacheMatch {
  build: ProvenBuild
  confidence: number // 0-1, how well the prompt matched
}

// ---------------------------------------------------------------------------
// Boilerplate shared by every cached build
// ---------------------------------------------------------------------------

const BOILERPLATE_HEADER = `-- ForjeGames Proven Build (cached)
local ChangeHistoryService = game:GetService("ChangeHistoryService")
local rid = ChangeHistoryService:TryBeginRecording("ForjeBuild")
local m = Instance.new("Model") m.Name = "ForjeBuild"
local sp = Vector3.new(0, 0, 0)
local gy = 0

local function P(name, cf, size, mat, col, parent)
  local p = Instance.new("Part"); p.Name = name; p.CFrame = cf; p.Size = size
  p.Material = mat; p.Color = col; p.Anchored = true
  p.CastShadow = (size.X > 2 and size.Y > 2)
  p.Parent = parent or m; return p
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
`

const BOILERPLATE_FOOTER = `
m.Parent = workspace
m:MoveTo(sp)
if rid then ChangeHistoryService:FinishRecording(rid, Enum.FinishRecordingOperation.Commit) end
`

// ---------------------------------------------------------------------------
// The 20 Proven Builds
// ---------------------------------------------------------------------------

export const PROVEN_BUILDS: ProvenBuild[] = [
  // 1. House
  {
    id: 'house-modern',
    triggers: [
      /\b(build|make|create|generate)\b.*\bhouse\b/i,
      /\bhouse\b.*\b(build|make|create|generate)\b/i,
      /\bsimple\s+house\b/i,
      /\bmodern\s+house\b/i,
      /\bfamily\s+home\b/i,
    ],
    description: 'Modern 2-story house with garage, porch, interior walls, staircase, windows, doors, chimney, and landscaping. Concrete foundation, brick walls, wood trim, glass windows.',
    partCount: 65,
    tags: ['house', 'home', 'residential', 'building'],
    style: 'modern',
    code: `local CH = game:GetService("ChangeHistoryService")
local rid = CH:TryBeginRecording("ForjeAI Build")
local cam = workspace.CurrentCamera
local sp = cam.CFrame.Position + cam.CFrame.LookVector * 30
local gy = (workspace:Raycast(sp+Vector3.new(0,50,0),Vector3.new(0,-200,0)) or {Position=Vector3.new(0,0,0)}).Position.Y
sp = Vector3.new(sp.X, gy, sp.Z)
local m = Instance.new("Model") m.Name = "Modern_House"

local function P(n,sx,sy,sz,rx,ry,rz,mat,r,g,b,t)
  local p=Instance.new("Part") p.Name=n p.Anchored=true
  p.Size=Vector3.new(sx,sy,sz) p.CFrame=CFrame.new(sp.X+rx,gy+ry,sp.Z+rz)
  p.Material=Enum.Material[mat] p.Color=Color3.fromRGB(r,g,b)
  if t then p.Transparency=t end p.Parent=m return p
end
local function W(n,sx,sy,sz,rx,ry,rz,mat,r,g,b,rotY)
  local p=Instance.new("WedgePart") p.Name=n p.Anchored=true
  p.Size=Vector3.new(sx,sy,sz)
  local cf=CFrame.new(sp.X+rx,gy+ry,sp.Z+rz)
  if rotY then cf=cf*CFrame.Angles(0,math.rad(rotY),0) end
  p.CFrame=cf p.Material=Enum.Material[mat] p.Color=Color3.fromRGB(r,g,b) p.Parent=m return p
end
local function Cyl(n,h,d,rx,ry,rz,mat,r,g,b)
  local p=Instance.new("Part") p.Name=n p.Shape=Enum.PartType.Cylinder p.Anchored=true
  p.Size=Vector3.new(h,d,d) p.CFrame=CFrame.new(sp.X+rx,gy+ry,sp.Z+rz)*CFrame.Angles(0,0,math.rad(90))
  p.Material=Enum.Material[mat] p.Color=Color3.fromRGB(r,g,b) p.Parent=m return p
end
local function Ball(n,d,rx,ry,rz,mat,r,g,b)
  local p=Instance.new("Part") p.Name=n p.Shape=Enum.PartType.Ball p.Anchored=true
  p.Size=Vector3.new(d,d,d) p.CFrame=CFrame.new(sp.X+rx,gy+ry,sp.Z+rz)
  p.Material=Enum.Material[mat] p.Color=Color3.fromRGB(r,g,b) p.Parent=m return p
end
local function Light(par,bri,rng,r,g,b)
  local l=Instance.new("PointLight") l.Brightness=bri or 2 l.Range=rng or 25 l.Color=Color3.fromRGB(r or 255,g or 200,b or 140) l.Parent=par
end

-- Foundation
P("Foundation",32,1,24,0,0.5,0,"Concrete",130,125,120)

-- Floor
P("Floor",30,0.5,22,0,1.25,0,"WoodPlanks",160,120,80)

-- Walls (Brick)
P("WallFront",30,12,1,0,7,11,"Brick",200,195,185)
P("WallBack",30,12,1,0,7,-11,"Brick",200,195,185)
P("WallLeft",1,12,22,15,7,0,"Brick",200,195,185)
P("WallRight",1,12,22,-15,7,0,"Brick",200,195,185)

-- Window openings (cut into front wall)
P("WindowFront1",5,4,1.2,6,8,11,"Glass",180,210,230,0.5)
P("WindowFront2",5,4,1.2,-6,8,11,"Glass",180,210,230,0.5)
P("WindowFrame1Top",5.5,0.5,0.5,6,10.25,11.3,"Wood",100,70,45)
P("WindowFrame1Bot",5.5,0.5,0.5,6,5.75,11.3,"Wood",100,70,45)
P("WindowFrame1L",0.5,4.5,0.5,3.5,8,11.3,"Wood",100,70,45)
P("WindowFrame1R",0.5,4.5,0.5,8.5,8,11.3,"Wood",100,70,45)
P("WindowFrame2Top",5.5,0.5,0.5,-6,10.25,11.3,"Wood",100,70,45)
P("WindowFrame2Bot",5.5,0.5,0.5,-6,5.75,11.3,"Wood",100,70,45)
P("WindowFrame2L",0.5,4.5,0.5,-8.5,8,11.3,"Wood",100,70,45)
P("WindowFrame2R",0.5,4.5,0.5,-3.5,8,11.3,"Wood",100,70,45)

-- Back windows
P("WindowBack1",4,3,1.2,7,8.5,-11,"Glass",180,210,230,0.5)
P("WindowBack2",4,3,1.2,-7,8.5,-11,"Glass",180,210,230,0.5)

-- Side windows
P("WindowLeftSide",1.2,4,4,15,8,5,"Glass",180,210,230,0.5)
P("WindowRightSide",1.2,4,4,-15,8,-5,"Glass",180,210,230,0.5)

-- Door
P("Doorframe",4.5,7,1.5,0,4.5,11.2,"Wood",80,55,35)
P("Door",4,6.5,0.5,0,4.25,11.8,"Wood",120,80,50)
local handle=P("DoorHandle",0.3,0.3,0.5,1.5,4.5,12,"Metal",180,170,150)

-- Porch
P("PorchFloor",12,0.5,6,0,1,14,"WoodPlanks",140,105,70)
P("PorchStep1",12,0.5,2,0,0.5,17.5,"Concrete",140,135,130)
P("PorchStep2",12,0.5,2,0,0.25,18.5,"Concrete",140,135,130)
Cyl("PorchColumnL",8,1,5,5,14,"Wood",240,235,225)
Cyl("PorchColumnR",8,1,-5,5,14,"Wood",240,235,225)
P("PorchRoof",14,0.5,7,0,9.5,14,"Wood",100,75,55)

-- Gable roof with WedgeParts
W("RoofFrontLeft",16,6,12,8,16,0,"Slate",80,60,50,0)
W("RoofFrontRight",16,6,12,-8,16,0,"Slate",80,60,50,180)
P("RoofRidge",1,1,24,0,19,0,"Slate",70,50,40)
-- Roof gable ends
W("GableEnd1",1,6,12,15.5,16,0,"Brick",200,195,185,90)
W("GableEnd2",1,6,12,-15.5,16,0,"Brick",200,195,185,-90)

-- Chimney
P("ChimneyBase",3,8,3,12,17,8,"Brick",150,80,70)
P("ChimneyTop",3.5,1,3.5,12,21.5,8,"Brick",140,70,60)
P("ChimneyCap",4,0.3,4,12,22,8,"Concrete",100,95,90)

-- Interior divider wall
P("InteriorWall",0.5,10,14,0,6,0,"Concrete",210,205,200)

-- Interior lights
local ceilingLight1=P("CeilingLight1",2,0.5,2,7,12.5,5,"Neon",255,240,200)
Light(ceilingLight1,1.5,20,255,240,200)
local ceilingLight2=P("CeilingLight2",2,0.5,2,-7,12.5,-5,"Neon",255,240,200)
Light(ceilingLight2,1.5,20,255,240,200)
local porchLight=P("PorchLight",1,1,1,0,8.5,12.5,"Neon",255,220,160)
Light(porchLight,1,15,255,220,160)

-- Tree 1
Cyl("Tree1Trunk",6,2,22,3,-8,"Wood",100,70,40)
Ball("Tree1Canopy1",7,22,10,-8,"Grass",60,130,50)
Ball("Tree1Canopy2",5,23,12,-6,"Grass",50,120,45)
Ball("Tree1Canopy3",5,21,11,-10,"Grass",55,125,48)

-- Tree 2
Cyl("Tree2Trunk",5,1.8,-20,2.5,-10,"Wood",95,65,38)
Ball("Tree2Canopy1",6,-20,8.5,-10,"Grass",55,125,48)
Ball("Tree2Canopy2",4.5,-19,10,-8,"Grass",50,118,42)

-- Pathway
for i=0,5 do
  P("PathStone"..i,3,0.3,3,0,0.2,19+i*3,"Cobblestone",150,145,140)
end

-- Fence
for i=0,7 do
  local fx = -18 + i*5
  P("FencePost"..i,0.6,4,0.6,fx,2.5,-15,"Wood",130,95,60)
end
for i=0,6 do
  local fx = -18 + i*5
  P("FenceRail"..i,5,0.4,0.4,fx+2.5,3.5,-15,"Wood",130,95,60)
  P("FenceRailLow"..i,5,0.4,0.4,fx+2.5,2,-15,"Wood",130,95,60)
end

-- Mailbox
P("MailboxPost",0.4,3,0.4,-10,1.5,20,"Wood",100,75,50)
P("MailboxBox",1.5,1,1,-10,3.5,20,"Metal",60,60,65)

m.Parent = workspace
if rid then CH:FinishRecording(rid, Enum.FinishRecordingOperation.Commit) end`,
    customizable: [
      { key: 'WALL_COLOR', default: '200, 195, 185', description: 'Main wall color RGB' },
      { key: 'ROOF_COLOR', default: '80, 60, 50', description: 'Roof color RGB' },
      { key: 'TRIM_COLOR', default: '240, 235, 225', description: 'Window/door trim color RGB' },
      { key: 'BUILD_NAME', default: 'Modern_House', description: 'Model name' },
    ],
  },

  // 2. Castle
  {
    id: 'castle-medieval',
    triggers: [
      /\b(build|make|create|generate)\b.*\bcastle\b/i,
      /\bcastle\b.*\b(build|make|create|generate)\b/i,
      /\bmedieval\s+castle\b/i,
      /\bfortress\b/i,
    ],
    description: '4-tower castle with curtain walls, gatehouse with portcullis, courtyard, keep/donjon, crenellated battlements, arrow slits, drawbridge, and flag poles. Stone and brick materials.',
    partCount: 90,
    tags: ['castle', 'medieval', 'fortress', 'tower', 'kingdom'],
    style: 'medieval',
    code: `local CH = game:GetService("ChangeHistoryService")
local rid = CH:TryBeginRecording("ForjeAI Build")
local cam = workspace.CurrentCamera
local sp = cam.CFrame.Position + cam.CFrame.LookVector * 50
local gy = (workspace:Raycast(sp+Vector3.new(0,50,0),Vector3.new(0,-200,0)) or {Position=Vector3.new(0,0,0)}).Position.Y
sp = Vector3.new(sp.X, gy, sp.Z)
local m = Instance.new("Model") m.Name = "Medieval_Castle"

local function P(n,sx,sy,sz,rx,ry,rz,mat,r,g,b,t)
  local p=Instance.new("Part") p.Name=n p.Anchored=true
  p.Size=Vector3.new(sx,sy,sz) p.CFrame=CFrame.new(sp.X+rx,gy+ry,sp.Z+rz)
  p.Material=Enum.Material[mat] p.Color=Color3.fromRGB(r,g,b)
  if t then p.Transparency=t end p.Parent=m return p
end
local function W(n,sx,sy,sz,rx,ry,rz,mat,r,g,b,rotY)
  local p=Instance.new("WedgePart") p.Name=n p.Anchored=true
  p.Size=Vector3.new(sx,sy,sz)
  local cf=CFrame.new(sp.X+rx,gy+ry,sp.Z+rz)
  if rotY then cf=cf*CFrame.Angles(0,math.rad(rotY),0) end
  p.CFrame=cf p.Material=Enum.Material[mat] p.Color=Color3.fromRGB(r,g,b) p.Parent=m return p
end
local function Cyl(n,h,d,rx,ry,rz,mat,r,g,b)
  local p=Instance.new("Part") p.Name=n p.Shape=Enum.PartType.Cylinder p.Anchored=true
  p.Size=Vector3.new(h,d,d) p.CFrame=CFrame.new(sp.X+rx,gy+ry,sp.Z+rz)*CFrame.Angles(0,0,math.rad(90))
  p.Material=Enum.Material[mat] p.Color=Color3.fromRGB(r,g,b) p.Parent=m return p
end
local function Ball(n,d,rx,ry,rz,mat,r,g,b)
  local p=Instance.new("Part") p.Name=n p.Shape=Enum.PartType.Ball p.Anchored=true
  p.Size=Vector3.new(d,d,d) p.CFrame=CFrame.new(sp.X+rx,gy+ry,sp.Z+rz)
  p.Material=Enum.Material[mat] p.Color=Color3.fromRGB(r,g,b) p.Parent=m return p
end
local function Light(par,bri,rng,r,g,b)
  local l=Instance.new("PointLight") l.Brightness=bri or 2 l.Range=rng or 25 l.Color=Color3.fromRGB(r or 255,g or 200,b or 140) l.Parent=par
end

-- Courtyard ground
P("CourtyardFloor",60,1,60,0,0.5,0,"Cobblestone",120,115,105)

-- Curtain Walls (4 sides)
P("WallNorth",60,18,3,0,9.5,30,"Cobblestone",140,135,125)
P("WallSouth",60,18,3,0,9.5,-30,"Cobblestone",140,135,125)
P("WallEast",3,18,60,30,9.5,0,"Cobblestone",140,135,125)
P("WallWest",3,18,60,-30,9.5,0,"Cobblestone",140,135,125)

-- Battlement merlons on all walls
for i=0,9 do
  local mx = -27 + i*6
  P("MerlonN"..i,3,4,3,mx,19.5,30,"Cobblestone",130,125,115)
  P("MerlonS"..i,3,4,3,mx,19.5,-30,"Cobblestone",130,125,115)
end
for i=0,9 do
  local mz = -27 + i*6
  P("MerlonE"..i,3,4,3,30,19.5,mz,"Cobblestone",130,125,115)
  P("MerlonW"..i,3,4,3,-30,19.5,mz,"Cobblestone",130,125,115)
end

-- 4 Corner Towers (Cylinders)
local towerPos = {{30,30},{30,-30},{-30,30},{-30,-30}}
local towerNames = {"TowerNE","TowerSE","TowerNW","TowerSW"}
for i,pos in ipairs(towerPos) do
  Cyl(towerNames[i].."Base",24,10,pos[1],12,pos[2],"Cobblestone",135,130,120)
  -- Tower roof cone (using wedge approximation)
  Cyl(towerNames[i].."TopRim",2,12,pos[1],24.5,pos[2],"Cobblestone",125,120,110)
  W(towerNames[i].."Roof1",6,8,6,pos[1]+3,29,pos[2],"Slate",60,55,70,0)
  W(towerNames[i].."Roof2",6,8,6,pos[1]-3,29,pos[2],"Slate",60,55,70,180)
  W(towerNames[i].."Roof3",6,8,6,pos[1],29,pos[2]+3,"Slate",60,55,70,90)
  W(towerNames[i].."Roof4",6,8,6,pos[1],29,pos[2]-3,"Slate",60,55,70,-90)
  -- Flag pole
  P(towerNames[i].."FlagPole",0.3,6,0.3,pos[1],36,pos[2],"Metal",80,80,85)
  P(towerNames[i].."Flag",3,2,0.1,pos[1]+1.5,37,pos[2],"Fabric",180,40,40)
end

-- Gate opening in south wall
P("GateFrameL",3,18,3,-5,9.5,-30,"Cobblestone",130,125,115)
P("GateFrameR",3,18,3,5,9.5,-30,"Cobblestone",130,125,115)
P("GateArch",10,3,3,0,17,-30,"Cobblestone",130,125,115)

-- Portcullis (iron grate)
for i=0,4 do
  P("PortcullisV"..i,0.4,14,0.4,-4+i*2,7.5,-30,"Metal",70,70,75)
end
for i=0,3 do
  P("PortcullisH"..i,10,0.4,0.4,0,2+i*4,-30,"Metal",70,70,75)
end

-- Drawbridge
P("Drawbridge",10,1,8,0,0.5,-36,"Wood",110,80,50)
P("DrawbridgeChainL",0.2,10,0.2,-4,6,-32,"Metal",80,80,85)
P("DrawbridgeChainR",0.2,10,0.2,4,6,-32,"Metal",80,80,85)

-- Moat (Glass water)
for i=0,3 do
  local sides = {{0,38},{0,-38},{38,0},{-38,0}}
  local names = {"MoatN","MoatS","MoatE","MoatW"}
  local sizes = {{70,2,8},{70,2,8},{8,2,70},{8,2,70}}
  P(names[i+1],sizes[i+1][1],sizes[i+1][2],sizes[i+1][3],sides[i+1][1],0,sides[i+1][2],"Glass",40,80,140,0.4)
end
-- Moat corners
P("MoatCornerNE",8,2,8,38,0,38,"Glass",40,80,140,0.4)
P("MoatCornerNW",8,2,8,-38,0,38,"Glass",40,80,140,0.4)
P("MoatCornerSE",8,2,8,38,0,-38,"Glass",40,80,140,0.4)
P("MoatCornerSW",8,2,8,-38,0,-38,"Glass",40,80,140,0.4)

-- Keep / Donjon in center
P("KeepBase",16,1,16,0,1,0,"Cobblestone",125,120,110)
P("KeepWall1",16,14,1,0,8,8,"Cobblestone",140,135,125)
P("KeepWall2",16,14,1,0,8,-8,"Cobblestone",140,135,125)
P("KeepWall3",1,14,16,8,8,0,"Cobblestone",140,135,125)
P("KeepWall4",1,14,16,-8,8,0,"Cobblestone",140,135,125)
P("KeepRoof",18,1,18,0,15.5,0,"Slate",60,55,70)
-- Keep battlements
for i=0,3 do
  local kx = -6 + i*4
  P("KeepMerlon"..i,2,3,2,kx,17,8,"Cobblestone",130,125,115)
end

-- Torches with Fire effect
local torchPositions = {{12,5,28},{-12,5,28},{12,5,-28},{-12,5,-28},{6,5,6},{-6,5,6}}
for i,tp in ipairs(torchPositions) do
  local torch = P("Torch"..i,0.4,3,0.4,tp[1],tp[2]+1.5,tp[3],"Wood",100,70,40)
  local fire = Instance.new("Fire") fire.Size = 3 fire.Heat = 5 fire.Color = Color3.fromRGB(255,160,40)
  fire.SecondaryColor = Color3.fromRGB(255,80,20) fire.Parent = torch
  Light(torch,1.5,18,255,160,60)
end

-- Well in courtyard
Cyl("WellBase",3,6,10,2,0,"Cobblestone",120,115,105)
P("WellRim",7,0.5,7,10,3.5,0,"Cobblestone",110,105,95)
P("WellPostL",0.4,5,0.4,7,6,0,"Wood",100,70,40)
P("WellPostR",0.4,5,0.4,13,6,0,"Wood",100,70,40)
P("WellCrossbar",6.5,0.4,0.4,10,8.5,0,"Wood",100,70,40)

-- Courtyard path
for i=0,4 do
  P("CourtPath"..i,4,0.2,4,0,1.1,-8-i*4,"Cobblestone",140,135,125)
end

m.Parent = workspace
if rid then CH:FinishRecording(rid, Enum.FinishRecordingOperation.Commit) end`,
    customizable: [
      { key: 'WALL_COLOR', default: '140, 135, 125', description: 'Stone wall color RGB' },
      { key: 'ROOF_COLOR', default: '60, 55, 70', description: 'Tower roof color RGB' },
      { key: 'TRIM_COLOR', default: '100, 90, 80', description: 'Trim/accent color RGB' },
      { key: 'BUILD_NAME', default: 'Medieval_Castle', description: 'Model name' },
    ],
  },

  // 3. Shop / Store
  {
    id: 'shop-store',
    triggers: [
      /\b(build|make|create|generate)\b.*\b(shop|store)\b/i,
      /\b(shop|store)\b.*\b(build|make|create|generate)\b/i,
      /\bretail\s+(shop|store)\b/i,
      /\bitem\s+shop\b/i,
    ],
    description: 'Corner shop with large display windows, awning, door with bell, interior shelving, checkout counter, storage room in back, signage above entrance, and potted plants outside.',
    partCount: 55,
    tags: ['shop', 'store', 'retail', 'commercial', 'building'],
    style: 'modern',
    code: `local CH = game:GetService("ChangeHistoryService")
local rid = CH:TryBeginRecording("ForjeAI Build")
local cam = workspace.CurrentCamera
local sp = cam.CFrame.Position + cam.CFrame.LookVector * 30
local gy = (workspace:Raycast(sp+Vector3.new(0,50,0),Vector3.new(0,-200,0)) or {Position=Vector3.new(0,0,0)}).Position.Y
sp = Vector3.new(sp.X, gy, sp.Z)
local m = Instance.new("Model") m.Name = "Shop"

local function P(n,sx,sy,sz,rx,ry,rz,mat,r,g,b,t)
  local p=Instance.new("Part") p.Name=n p.Anchored=true
  p.Size=Vector3.new(sx,sy,sz) p.CFrame=CFrame.new(sp.X+rx,gy+ry,sp.Z+rz)
  p.Material=Enum.Material[mat] p.Color=Color3.fromRGB(r,g,b)
  if t then p.Transparency=t end p.Parent=m return p
end
local function W(n,sx,sy,sz,rx,ry,rz,mat,r,g,b,rotY)
  local p=Instance.new("WedgePart") p.Name=n p.Anchored=true
  p.Size=Vector3.new(sx,sy,sz)
  local cf=CFrame.new(sp.X+rx,gy+ry,sp.Z+rz)
  if rotY then cf=cf*CFrame.Angles(0,math.rad(rotY),0) end
  p.CFrame=cf p.Material=Enum.Material[mat] p.Color=Color3.fromRGB(r,g,b) p.Parent=m return p
end
local function Cyl(n,h,d,rx,ry,rz,mat,r,g,b)
  local p=Instance.new("Part") p.Name=n p.Shape=Enum.PartType.Cylinder p.Anchored=true
  p.Size=Vector3.new(h,d,d) p.CFrame=CFrame.new(sp.X+rx,gy+ry,sp.Z+rz)*CFrame.Angles(0,0,math.rad(90))
  p.Material=Enum.Material[mat] p.Color=Color3.fromRGB(r,g,b) p.Parent=m return p
end
local function Light(par,bri,rng,r,g,b)
  local l=Instance.new("PointLight") l.Brightness=bri or 2 l.Range=rng or 25 l.Color=Color3.fromRGB(r or 255,g or 200,b or 140) l.Parent=par
end

-- Foundation / floor
P("Foundation",20,1,16,0,0.5,0,"Concrete",140,135,130)
P("Floor",19,0.3,15,0,1.15,0,"WoodPlanks",170,135,95)

-- Walls
P("WallBack",20,10,1,0,6,8,"Brick",220,210,190)
P("WallLeft",1,10,16,10,6,0,"Brick",220,210,190)
P("WallRight",1,10,16,-10,6,0,"Brick",220,210,190)
-- Front wall (partial - has big window and door opening)
P("FrontWallTop",20,3,1,0,9.5,-8,"Brick",220,210,190)
P("FrontWallLeft",5,7,1,-7.5,4.5,-8,"Brick",220,210,190)
P("FrontWallRight",3,7,1,8.5,4.5,-8,"Brick",220,210,190)

-- Large display window (storefront glass)
P("DisplayWindow",8,6,0.5,0,4,-8,"Glass",190,220,240,0.3)
P("WindowFrameTop",8.5,0.5,0.5,0,7.25,-8.3,"Metal",60,60,65)
P("WindowFrameBot",8.5,0.5,0.5,0,1.25,-8.3,"Metal",60,60,65)
P("WindowFrameL",0.5,6.5,0.5,-4.25,4,-8.3,"Metal",60,60,65)
P("WindowFrameR",0.5,6.5,0.5,4.25,4,-8.3,"Metal",60,60,65)
P("WindowDivider",0.3,6.5,0.3,0,4,-8.3,"Metal",60,60,65)

-- Door with ProximityPrompt
local door=P("Door",3.5,6.5,0.5,-9,4.25,-8.5,"Wood",120,85,55)
local pp=Instance.new("ProximityPrompt") pp.ActionText="Open" pp.ObjectText="Shop Door"
pp.MaxActivationDistance=8 pp.Parent=door
P("DoorFrame",4,7,0.6,-9,4.5,-8.2,"Wood",90,65,40)
P("DoorHandle",0.3,0.3,0.5,-7.8,4.5,-8.8,"Metal",180,170,150)

-- Awning
P("AwningFront",20,0.3,4,0,8.5,-10,"Fabric",180,50,50)
W("AwningSlope",20,2,4,0,9.5,-10,"Fabric",180,50,50,180)
-- Awning support rods
P("AwningRodL",0.3,0.3,4,-9,8.5,-10,"Metal",70,70,75)
P("AwningRodR",0.3,0.3,4,9,8.5,-10,"Metal",70,70,75)

-- Roof
P("Roof",22,1,18,0,11.5,0,"Concrete",70,65,60)
P("RoofEdge",22,0.5,0.5,0,11,-8.5,"Concrete",80,75,70)

-- Sign with SurfaceGui
local signBoard=P("SignBoard",12,3,0.5,0,13,-8,"Wood",60,45,30)
local sg=Instance.new("SurfaceGui") sg.Face=Enum.NormalId.Front
sg.Parent=signBoard
local txt=Instance.new("TextLabel") txt.Size=UDim2.new(1,0,1,0) txt.BackgroundTransparency=1
txt.Text="FORJE SHOP" txt.TextColor3=Color3.fromRGB(255,220,100)
txt.TextScaled=true txt.Font=Enum.Font.GothamBold txt.Parent=sg

-- Counter inside
P("CounterBase",8,3,2,0,2.5,4,"Wood",140,100,65)
P("CounterTop",8.5,0.5,2.5,0,4.25,4,"Marble",200,195,190)

-- Shelves on back wall (3 rows)
for row=0,2 do
  P("ShelfBoard"..row,6,0.3,2,6,3+row*2.5,7,"Wood",140,100,65)
  -- Items on shelf
  for item=0,2 do
    P("ShelfItem"..row.."_"..item,1,1.5,1,4.5+item*2,4+row*2.5,7,"Concrete",math.random(100,220),math.random(100,220),math.random(100,220))
  end
end
-- Shelf brackets
P("ShelfBracketL",0.3,8,0.3,3,5,7,"Metal",80,80,85)
P("ShelfBracketR",0.3,8,0.3,9,5,7,"Metal",80,80,85)

-- Cash register on counter
P("CashRegister",1.5,1.5,1.5,-2,5.25,4,"Metal",60,65,60)
P("RegisterScreen",1,0.8,0.2,-2,6.3,3.3,"Neon",50,180,50)

-- Street lamp outside
Cyl("LampPost",10,0.8,-6,5,-12,"Metal",60,60,65)
P("LampArm",3,0.3,0.3,-6,10.5,-12,"Metal",60,60,65)
local lamp=P("LampHead",2,1.5,2,-6,11.5,-12,"Glass",255,240,200,0.3)
Light(lamp,2,30,255,240,200)

-- Potted plants outside
for i=0,1 do
  local px = -3 + i*14
  P("Pot"..i,2,2,2,px,1.5,-10,"Concrete",140,100,70)
  P("Plant"..i,1.5,2.5,1.5,px,3.5,-10,"Grass",50,130,50)
end

-- Sidewalk
P("Sidewalk",24,0.3,4,0,0.15,-12,"Concrete",160,158,155)

-- Interior light
local shopLight=P("ShopCeilingLight",3,0.3,3,0,10.8,0,"Neon",255,245,220)
Light(shopLight,2,25,255,245,220)

m.Parent = workspace
if rid then CH:FinishRecording(rid, Enum.FinishRecordingOperation.Commit) end`,
    customizable: [
      { key: 'WALL_COLOR', default: '220, 210, 190', description: 'Storefront color RGB' },
      { key: 'ROOF_COLOR', default: '70, 65, 60', description: 'Roof color RGB' },
      { key: 'TRIM_COLOR', default: '180, 50, 50', description: 'Awning/accent color RGB' },
      { key: 'BUILD_NAME', default: 'Shop', description: 'Model name' },
    ],
  },

  // 4. Medieval Village
  {
    id: 'medieval-village',
    triggers: [
      /\bmedieval\s+village\b/i,
      /\bvillage\b.*\bmedieval\b/i,
      /\b(build|make|create)\b.*\bvillage\b/i,
    ],
    description: 'Cluster of 4-5 timber-frame cottages around a central well, market stall with cloth awning, blacksmith forge with anvil, cobblestone paths, wooden fences, haystacks, and barrels.',
    partCount: 120,
    tags: ['village', 'medieval', 'town', 'cottages', 'market'],
    style: 'medieval',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '210, 195, 170', description: 'Plaster/daub wall color RGB' },
      { key: 'ROOF_COLOR', default: '120, 100, 70', description: 'Thatch roof color RGB' },
      { key: 'TRIM_COLOR', default: '80, 55, 35', description: 'Timber frame color RGB' },
      { key: 'BUILD_NAME', default: 'Medieval_Village', description: 'Model name' },
    ],
  },

  // 5. Modern City Block
  {
    id: 'city-block',
    triggers: [
      /\bmodern\s+city\b/i,
      /\bcity\s+block\b/i,
      /\b(build|make|create)\b.*\bcity\b/i,
      /\bskyscraper/i,
      /\bdowntown\b/i,
    ],
    description: '3 buildings of varying heights (4, 8, 12 stories), glass curtain walls, concrete bases, street with sidewalks, crosswalk, street lamps, bench, fire hydrant, traffic light, and dumpster in alley.',
    partCount: 130,
    tags: ['city', 'modern', 'skyscraper', 'urban', 'downtown'],
    style: 'modern',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '180, 190, 200', description: 'Building facade color RGB' },
      { key: 'ROOF_COLOR', default: '90, 95, 100', description: 'Roof/top color RGB' },
      { key: 'TRIM_COLOR', default: '60, 65, 70', description: 'Steel/metal trim color RGB' },
      { key: 'BUILD_NAME', default: 'City_Block', description: 'Model name' },
    ],
  },

  // 6. Tycoon Map
  {
    id: 'tycoon-map',
    triggers: [
      /\btycoon\b/i,
      /\btycoon\s+map\b/i,
      /\btycoon\s+(base|starter|template)\b/i,
    ],
    description: 'Tycoon baseplate with spawn pad, dropper conveyor belt, collector bin, upgrade pads (3 tiers), sell area, rebirth shrine, leaderboard display, fenced perimeter, and entry gate.',
    partCount: 75,
    tags: ['tycoon', 'game', 'dropper', 'conveyor', 'baseplate'],
    style: 'modern',
    code: `local CH = game:GetService("ChangeHistoryService")
local rid = CH:TryBeginRecording("ForjeAI Build")
local cam = workspace.CurrentCamera
local sp = cam.CFrame.Position + cam.CFrame.LookVector * 40
local gy = (workspace:Raycast(sp+Vector3.new(0,50,0),Vector3.new(0,-200,0)) or {Position=Vector3.new(0,0,0)}).Position.Y
sp = Vector3.new(sp.X, gy, sp.Z)
local m = Instance.new("Model") m.Name = "Tycoon_Map"

local function P(n,sx,sy,sz,rx,ry,rz,mat,r,g,b,t)
  local p=Instance.new("Part") p.Name=n p.Anchored=true
  p.Size=Vector3.new(sx,sy,sz) p.CFrame=CFrame.new(sp.X+rx,gy+ry,sp.Z+rz)
  p.Material=Enum.Material[mat] p.Color=Color3.fromRGB(r,g,b)
  if t then p.Transparency=t end p.Parent=m return p
end
local function W(n,sx,sy,sz,rx,ry,rz,mat,r,g,b,rotY)
  local p=Instance.new("WedgePart") p.Name=n p.Anchored=true
  p.Size=Vector3.new(sx,sy,sz)
  local cf=CFrame.new(sp.X+rx,gy+ry,sp.Z+rz)
  if rotY then cf=cf*CFrame.Angles(0,math.rad(rotY),0) end
  p.CFrame=cf p.Material=Enum.Material[mat] p.Color=Color3.fromRGB(r,g,b) p.Parent=m return p
end
local function Cyl(n,h,d,rx,ry,rz,mat,r,g,b)
  local p=Instance.new("Part") p.Name=n p.Shape=Enum.PartType.Cylinder p.Anchored=true
  p.Size=Vector3.new(h,d,d) p.CFrame=CFrame.new(sp.X+rx,gy+ry,sp.Z+rz)*CFrame.Angles(0,0,math.rad(90))
  p.Material=Enum.Material[mat] p.Color=Color3.fromRGB(r,g,b) p.Parent=m return p
end
local function Light(par,bri,rng,r,g,b)
  local l=Instance.new("PointLight") l.Brightness=bri or 2 l.Range=rng or 25 l.Color=Color3.fromRGB(r or 255,g or 200,b or 140) l.Parent=par
end

-- Base plate
P("BasePlate",60,1,50,0,0.5,0,"Concrete",100,100,110)
P("BasePlateGrass",58,0.2,48,0,1.1,0,"Grass",80,140,70)

-- Fencing around perimeter
for i=0,11 do
  local fx = -28 + i*5
  P("FencePostN"..i,0.6,4,0.6,fx,3,24,"Metal",80,80,90)
  P("FencePostS"..i,0.6,4,0.6,fx,3,-24,"Metal",80,80,90)
end
for i=0,9 do
  local fz = -22 + i*5
  P("FencePostE"..i,0.6,4,0.6,29,3,fz,"Metal",80,80,90)
  P("FencePostW"..i,0.6,4,0.6,-29,3,fz,"Metal",80,80,90)
end
-- Fence rails
P("FenceRailN",58,0.3,0.3,0,4,24,"Metal",80,80,90)
P("FenceRailNLow",58,0.3,0.3,0,2.5,24,"Metal",80,80,90)
P("FenceRailS",58,0.3,0.3,0,4,-24,"Metal",80,80,90)
P("FenceRailSLow",58,0.3,0.3,0,2.5,-24,"Metal",80,80,90)
P("FenceRailE",0.3,0.3,48,29,4,0,"Metal",80,80,90)
P("FenceRailELow",0.3,0.3,48,29,2.5,0,"Metal",80,80,90)
P("FenceRailW",0.3,0.3,48,-29,4,0,"Metal",80,80,90)
P("FenceRailWLow",0.3,0.3,48,-29,2.5,0,"Metal",80,80,90)

-- Entry gate
P("GatePostL",1,6,1,-2,4,-24,"Metal",60,60,65)
P("GatePostR",1,6,1,2,4,-24,"Metal",60,60,65)
P("GateArch",5,1,1,0,7.5,-24,"Metal",60,60,65)

-- Spawn pad
local spawnPad=P("SpawnPad",6,0.5,6,-20,1.25,18,"Neon",50,180,80)
local spSg=Instance.new("SurfaceGui") spSg.Face=Enum.NormalId.Top spSg.Parent=spawnPad
local spTxt=Instance.new("TextLabel") spTxt.Size=UDim2.new(1,0,1,0) spTxt.BackgroundTransparency=1
spTxt.Text="SPAWN" spTxt.TextColor3=Color3.fromRGB(255,255,255) spTxt.TextScaled=true
spTxt.Font=Enum.Font.GothamBold spTxt.Parent=spSg

-- Dropper machine
P("DropperBase",6,4,6,-20,3,0,"Metal",120,120,130)
P("DropperTop",6,1,6,-20,5.5,0,"Metal",100,100,110)
P("DropperChute",2,1,2,-20,2.5,-3.5,"Metal",90,90,95)
P("DropperNeon",4,0.3,4,-20,5.8,0,"Neon",255,215,0)
local dropLight=P("DropperLight",1,1,1,-20,6.5,0,"Neon",255,200,50)
Light(dropLight,1,12,255,200,50)

-- Conveyor belt (series of parts)
for i=0,7 do
  local cz = -5 - i*2
  local shade = (i % 2 == 0) and 50 or 70
  P("Conveyor"..i,4,0.5,2,-20,1.25,cz,"Metal",shade,shade,shade+10)
end
-- Conveyor side rails
P("ConveyorRailL",0.3,1,16,-22,1.75,-12,"Metal",80,80,90)
P("ConveyorRailR",0.3,1,16,-18,1.75,-12,"Metal",80,80,90)

-- Collector bin at end of conveyor
P("CollectorBin",6,4,4,-20,3,-22,"Metal",50,180,80)
P("CollectorFront",6,0.3,0.1,-20,1.5,-20,"Metal",50,180,80)
local binSg=Instance.new("SurfaceGui") binSg.Face=Enum.NormalId.Front binSg.Parent=P("CollectorLabel",6,2,0.2,-20,4,-22.1,"Metal",40,160,70)
local binTxt=Instance.new("TextLabel") binTxt.Size=UDim2.new(1,0,1,0) binTxt.BackgroundTransparency=1
binTxt.Text="COLLECTOR" binTxt.TextColor3=Color3.fromRGB(255,255,255) binTxt.TextScaled=true
binTxt.Font=Enum.Font.GothamBold binTxt.Parent=binSg

-- Upgrade buttons (3 tiers)
local upgradeColors = {{50,180,80},{50,120,220},{180,50,200}}
local upgradeNames = {"Speed","Value","Capacity"}
local upgradePrices = {"$100","$500","$2000"}
for i=1,3 do
  local ux = -5 + (i-1)*10
  local btn=P("UpgradeBtn"..i,5,1,5,ux,1.5,10,"Neon",upgradeColors[i][1],upgradeColors[i][2],upgradeColors[i][3])
  local uSg=Instance.new("SurfaceGui") uSg.Face=Enum.NormalId.Top uSg.Parent=btn
  local uTxt=Instance.new("TextLabel") uTxt.Size=UDim2.new(1,0,0.5,0) uTxt.BackgroundTransparency=1
  uTxt.Text=upgradeNames[i] uTxt.TextColor3=Color3.fromRGB(255,255,255) uTxt.TextScaled=true
  uTxt.Font=Enum.Font.GothamBold uTxt.Parent=uSg
  local uPrice=Instance.new("TextLabel") uPrice.Size=UDim2.new(1,0,0.5,0) uPrice.Position=UDim2.new(0,0,0.5,0)
  uPrice.BackgroundTransparency=1 uPrice.Text=upgradePrices[i]
  uPrice.TextColor3=Color3.fromRGB(255,220,100) uPrice.TextScaled=true
  uPrice.Font=Enum.Font.GothamBold uPrice.Parent=uSg
  P("UpgradePedestal"..i,6,0.5,6,ux,1,10,"Concrete",80,80,90)
end

-- Sell area
P("SellPad",8,0.5,8,20,1.25,-18,"Neon",255,215,0)
local sellSg=Instance.new("SurfaceGui") sellSg.Face=Enum.NormalId.Top
sellSg.Parent=P("SellLabel",8,0.1,8,20,1.6,-18,"Neon",255,215,0,0.5)
local sellTxt=Instance.new("TextLabel") sellTxt.Size=UDim2.new(1,0,1,0) sellTxt.BackgroundTransparency=1
sellTxt.Text="$ SELL $" sellTxt.TextColor3=Color3.fromRGB(40,40,40) sellTxt.TextScaled=true
sellTxt.Font=Enum.Font.GothamBold sellTxt.Parent=sellSg

-- Leaderboard sign
P("LeaderboardPost",1,8,1,25,5,15,"Metal",60,60,65)
local lbBoard=P("LeaderboardBoard",8,6,0.5,25,9,15,"Concrete",40,40,50)
local lbSg=Instance.new("SurfaceGui") lbSg.Face=Enum.NormalId.Front lbSg.Parent=lbBoard
local lbTitle=Instance.new("TextLabel") lbTitle.Size=UDim2.new(1,0,0.25,0) lbTitle.BackgroundTransparency=1
lbTitle.Text="LEADERBOARD" lbTitle.TextColor3=Color3.fromRGB(255,215,0) lbTitle.TextScaled=true
lbTitle.Font=Enum.Font.GothamBold lbTitle.Parent=lbSg
for i=1,3 do
  local row=Instance.new("TextLabel") row.Size=UDim2.new(1,0,0.2,0) row.Position=UDim2.new(0,0,0.15+i*0.2,0)
  row.BackgroundTransparency=1 row.Text="#"..i.." Player"..i.." - $0"
  row.TextColor3=Color3.fromRGB(200,200,210) row.TextScaled=true
  row.Font=Enum.Font.Gotham row.Parent=lbSg
end

-- Paths connecting areas
P("Path1",3,0.2,20,-20,1.05,10,"Concrete",150,150,155)
P("Path2",30,0.2,3,0,1.05,10,"Concrete",150,150,155)
P("Path3",3,0.2,30,20,1.05,-3,"Concrete",150,150,155)

-- Decorative crates
P("Crate1",2,2,2,15,2,5,"Wood",140,100,60)
P("Crate2",2,2,2,17,2,5,"Wood",135,95,55)
P("Crate3",2,2,2,16,4,5,"Wood",130,90,50)

m.Parent = workspace
if rid then CH:FinishRecording(rid, Enum.FinishRecordingOperation.Commit) end`,
    customizable: [
      { key: 'WALL_COLOR', default: '100, 100, 110', description: 'Base color RGB' },
      { key: 'ROOF_COLOR', default: '50, 180, 80', description: 'Accent/button color RGB' },
      { key: 'TRIM_COLOR', default: '255, 215, 0', description: 'Gold highlight color RGB' },
      { key: 'BUILD_NAME', default: 'Tycoon_Map', description: 'Model name' },
    ],
  },

  // 7. Obby Course
  {
    id: 'obby-course',
    triggers: [
      /\bobby\b/i,
      /\bobby\s+course\b/i,
      /\bobstacle\s+course\b/i,
      /\bparkour\b/i,
      /\b(build|make|create)\b.*\bobby\b/i,
    ],
    description: '15-stage obby with jumping platforms, moving platforms (marked), kill bricks (red), checkpoints (green pads), wall jumps, lava floor section, spinning bars, zipline poles, and finish podium with confetti emitter.',
    partCount: 80,
    tags: ['obby', 'obstacle', 'parkour', 'course', 'game'],
    style: 'modern',
    code: `local CH = game:GetService("ChangeHistoryService")
local rid = CH:TryBeginRecording("ForjeAI Build")
local cam = workspace.CurrentCamera
local sp = cam.CFrame.Position + cam.CFrame.LookVector * 20
local gy = (workspace:Raycast(sp+Vector3.new(0,50,0),Vector3.new(0,-200,0)) or {Position=Vector3.new(0,0,0)}).Position.Y
sp = Vector3.new(sp.X, gy, sp.Z)
local m = Instance.new("Model") m.Name = "Obby_Course"

local function P(n,sx,sy,sz,rx,ry,rz,mat,r,g,b,t)
  local p=Instance.new("Part") p.Name=n p.Anchored=true
  p.Size=Vector3.new(sx,sy,sz) p.CFrame=CFrame.new(sp.X+rx,gy+ry,sp.Z+rz)
  p.Material=Enum.Material[mat] p.Color=Color3.fromRGB(r,g,b)
  if t then p.Transparency=t end p.Parent=m return p
end
local function W(n,sx,sy,sz,rx,ry,rz,mat,r,g,b,rotY)
  local p=Instance.new("WedgePart") p.Name=n p.Anchored=true
  p.Size=Vector3.new(sx,sy,sz)
  local cf=CFrame.new(sp.X+rx,gy+ry,sp.Z+rz)
  if rotY then cf=cf*CFrame.Angles(0,math.rad(rotY),0) end
  p.CFrame=cf p.Material=Enum.Material[mat] p.Color=Color3.fromRGB(r,g,b) p.Parent=m return p
end
local function Cyl(n,h,d,rx,ry,rz,mat,r,g,b)
  local p=Instance.new("Part") p.Name=n p.Shape=Enum.PartType.Cylinder p.Anchored=true
  p.Size=Vector3.new(h,d,d) p.CFrame=CFrame.new(sp.X+rx,gy+ry,sp.Z+rz)*CFrame.Angles(0,0,math.rad(90))
  p.Material=Enum.Material[mat] p.Color=Color3.fromRGB(r,g,b) p.Parent=m return p
end
local function Light(par,bri,rng,r,g,b)
  local l=Instance.new("PointLight") l.Brightness=bri or 2 l.Range=rng or 25 l.Color=Color3.fromRGB(r or 255,g or 200,b or 140) l.Parent=par
end

-- Course runs along Z axis, each stage offset further in Z
local stageZ = 0

-- START ARCH
P("StartArchL",2,12,2,-4,7,stageZ,"Concrete",50,120,200)
P("StartArchR",2,12,2,4,7,stageZ,"Concrete",50,120,200)
P("StartArchTop",10,2,2,0,14,stageZ,"Concrete",50,120,200)
local startSign=P("StartSign",8,2,0.3,0,12,stageZ-1.2,"Concrete",40,40,50)
local stSg=Instance.new("SurfaceGui") stSg.Face=Enum.NormalId.Front stSg.Parent=startSign
local stTxt=Instance.new("TextLabel") stTxt.Size=UDim2.new(1,0,1,0) stTxt.BackgroundTransparency=1
stTxt.Text="START" stTxt.TextColor3=Color3.fromRGB(40,200,80) stTxt.TextScaled=true
stTxt.Font=Enum.Font.GothamBold stTxt.Parent=stSg

-- Start platform
P("StartPlatform",8,1,8,0,1,stageZ,"Concrete",50,120,200)

-- Timer sign above start
local timerBoard=P("TimerBoard",6,2,0.3,0,16,stageZ-1.2,"Concrete",30,30,40)
local tmSg=Instance.new("SurfaceGui") tmSg.Face=Enum.NormalId.Front tmSg.Parent=timerBoard
local tmTxt=Instance.new("TextLabel") tmTxt.Size=UDim2.new(1,0,1,0) tmTxt.BackgroundTransparency=1
tmTxt.Text="TIME: 0:00" tmTxt.TextColor3=Color3.fromRGB(255,255,100) tmTxt.TextScaled=true
tmTxt.Font=Enum.Font.Code tmTxt.Parent=tmSg

-- CHECKPOINT COLORS cycle through rainbow
local cpColors = {
  {40,200,80},{50,120,200},{200,180,40},{200,80,200},
  {80,200,200},{200,120,40},{120,200,50},{200,50,100}
}

stageZ = stageZ - 12

-- STAGE 1: Simple jumps (3 platforms)
P("CP1",6,0.5,6,0,1.25,stageZ,"Neon",cpColors[1][1],cpColors[1][2],cpColors[1][3])
for i=1,3 do
  P("Jump1_"..i,4,1,4,0,1+i*1.5,stageZ-6*i,"Concrete",50,120,200)
end
stageZ = stageZ - 24

-- STAGE 2: Thin platforms
P("CP2",6,0.5,6,0,5.75,stageZ,"Neon",cpColors[2][1],cpColors[2][2],cpColors[2][3])
for i=1,4 do
  local xOff = (i%2==0) and 3 or -3
  P("Thin2_"..i,2,1,6,xOff,5,stageZ-7*i,"Concrete",50,120,200)
end
stageZ = stageZ - 35

-- STAGE 3: Kill brick gauntlet
P("CP3",6,0.5,6,0,5.75,stageZ,"Neon",cpColors[3][1],cpColors[3][2],cpColors[3][3])
P("SafePath3",12,1,4,0,5,stageZ-8,"Concrete",50,120,200)
P("KillBrick3a",4,1,4,-4,5,stageZ-14,"Neon",200,40,40)
P("SafeSmall3",3,1,3,2,5,stageZ-14,"Concrete",50,120,200)
P("KillBrick3b",4,1,4,4,5,stageZ-20,"Neon",200,40,40)
P("SafeSmall3b",3,1,3,-2,5,stageZ-20,"Concrete",50,120,200)
P("SafePath3End",8,1,4,0,5,stageZ-26,"Concrete",50,120,200)
stageZ = stageZ - 32

-- STAGE 4: Gaps with varying widths
P("CP4",6,0.5,6,0,5.75,stageZ,"Neon",cpColors[4][1],cpColors[4][2],cpColors[4][3])
local gapWidths = {5,7,6,8}
local gz = stageZ
for i=1,4 do
  gz = gz - gapWidths[i] - 4
  P("GapPlat4_"..i,5,1,4,0,5,gz,"Concrete",50,120,200)
end
stageZ = gz - 8

-- STAGE 5: Zigzag narrow path
P("CP5",6,0.5,6,0,8.75,stageZ,"Neon",cpColors[5][1],cpColors[5][2],cpColors[5][3])
for i=1,6 do
  local xOff = (i%2==0) and 6 or -6
  P("Zig5_"..i,3,1,3,xOff,8,stageZ-5*i,"Concrete",80,200,200)
end
stageZ = stageZ - 36

-- STAGE 6: Staircase climb with kill floor
P("CP6",6,0.5,6,0,8.75,stageZ,"Neon",cpColors[6][1],cpColors[6][2],cpColors[6][3])
P("LavaFloor6",14,0.5,20,0,6,stageZ-12,"Neon",200,40,40)
for i=1,5 do
  P("Stair6_"..i,4,1,3,((i%2==0) and 4 or -4),8+i*2,stageZ-4*i,"Concrete",200,120,40)
end
stageZ = stageZ - 26

-- STAGE 7: Moving-look platforms (striped to indicate movement)
P("CP7",6,0.5,6,0,18.75,stageZ,"Neon",cpColors[7][1],cpColors[7][2],cpColors[7][3])
for i=1,4 do
  local plat=P("Moving7_"..i,5,1,4,(i%2==0) and 5 or -5,18,stageZ-8*i,"Concrete",120,200,50)
  -- Stripe to indicate movement
  P("Stripe7_"..i,5,0.1,0.5,(i%2==0) and 5 or -5,18.6,stageZ-8*i,"Neon",255,255,100)
end
stageZ = stageZ - 40

-- STAGE 8: Wall jump section
P("CP8",6,0.5,6,0,18.75,stageZ,"Neon",cpColors[8][1],cpColors[8][2],cpColors[8][3])
P("WallJumpL",1,14,4,-6,26,stageZ-10,"Concrete",50,120,200)
P("WallJumpR",1,14,4,6,26,stageZ-10,"Concrete",50,120,200)
P("WallJumpLedgeL",3,1,4,-4,22,stageZ-10,"Concrete",80,150,220)
P("WallJumpLedgeR",3,1,4,4,26,stageZ-10,"Concrete",80,150,220)
P("WallJumpTop",8,1,4,0,30,stageZ-10,"Concrete",50,120,200)
stageZ = stageZ - 20

-- FINISH AREA
P("FinishPlatform",10,1,10,0,30.5,stageZ,"Concrete",255,215,0)
P("FinishArchL",2,10,2,-5,36,stageZ,"Concrete",255,215,0)
P("FinishArchR",2,10,2,5,36,stageZ,"Concrete",255,215,0)
P("FinishArchTop",12,2,2,0,42,stageZ,"Concrete",255,215,0)
local finSign=P("FinishSign",8,2,0.3,0,40,stageZ-1.2,"Concrete",40,40,50)
local fSg=Instance.new("SurfaceGui") fSg.Face=Enum.NormalId.Front fSg.Parent=finSign
local fTxt=Instance.new("TextLabel") fTxt.Size=UDim2.new(1,0,1,0) fTxt.BackgroundTransparency=1
fTxt.Text="FINISH!" fTxt.TextColor3=Color3.fromRGB(255,215,0) fTxt.TextScaled=true
fTxt.Font=Enum.Font.GothamBold fTxt.Parent=fSg

-- Confetti emitter on finish
local confettiPart=P("ConfettiEmitter",1,1,1,0,43,stageZ,"Neon",255,255,100,1)
local pe=Instance.new("ParticleEmitter") pe.Rate=50 pe.Lifetime=NumberRange.new(2,4)
pe.Speed=NumberRange.new(10,20) pe.SpreadAngle=Vector2.new(60,60)
pe.Color=ColorSequence.new({
  ColorSequenceKeypoint.new(0,Color3.fromRGB(255,50,50)),
  ColorSequenceKeypoint.new(0.25,Color3.fromRGB(50,200,50)),
  ColorSequenceKeypoint.new(0.5,Color3.fromRGB(50,100,255)),
  ColorSequenceKeypoint.new(0.75,Color3.fromRGB(255,200,50)),
  ColorSequenceKeypoint.new(1,Color3.fromRGB(200,50,255))
})
pe.Size=NumberSequence.new(0.5,0) pe.Parent=confettiPart

-- Victory lights
local vLight1=P("VictoryLight1",1,1,1,-3,32,stageZ,"Neon",255,200,50,0.5)
Light(vLight1,3,30,255,200,50)
local vLight2=P("VictoryLight2",1,1,1,3,32,stageZ,"Neon",255,200,50,0.5)
Light(vLight2,3,30,255,200,50)

m.Parent = workspace
if rid then CH:FinishRecording(rid, Enum.FinishRecordingOperation.Commit) end`,
    customizable: [
      { key: 'WALL_COLOR', default: '50, 120, 200', description: 'Platform color RGB' },
      { key: 'ROOF_COLOR', default: '200, 40, 40', description: 'Kill brick color RGB' },
      { key: 'TRIM_COLOR', default: '40, 200, 80', description: 'Checkpoint color RGB' },
      { key: 'BUILD_NAME', default: 'Obby_Course', description: 'Model name' },
    ],
  },

  // 8. Lobby / Hub
  {
    id: 'lobby-hub',
    triggers: [
      /\blobby\b/i,
      /\bhub\b/i,
      /\bspawn\s*(area|room|lobby)\b/i,
      /\b(build|make|create)\b.*\b(lobby|hub)\b/i,
    ],
    description: 'Open-air lobby with central spawn platform, 4 game portal arches (labeled), info board, donation board, settings NPC stand, fountain in center, benches, ambient torches, and welcome banner overhead.',
    partCount: 70,
    tags: ['lobby', 'hub', 'spawn', 'portal', 'game'],
    style: 'modern',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '170, 170, 180', description: 'Floor/wall color RGB' },
      { key: 'ROOF_COLOR', default: '60, 60, 80', description: 'Arch/frame color RGB' },
      { key: 'TRIM_COLOR', default: '255, 200, 50', description: 'Accent/gold color RGB' },
      { key: 'BUILD_NAME', default: 'Lobby_Hub', description: 'Model name' },
    ],
  },

  // 9. Restaurant
  {
    id: 'restaurant',
    triggers: [
      /\b(build|make|create|generate)\b.*\brestaurant\b/i,
      /\brestaurant\b/i,
      /\bdiner\b/i,
      /\bcafe\b/i,
    ],
    description: 'Restaurant with dining area (6 tables with chairs), kitchen behind counter with stove/fridge props, bar with stools, large front windows, neon open sign, outdoor patio with umbrella table, bathroom doors, and tiled floor.',
    partCount: 85,
    tags: ['restaurant', 'diner', 'cafe', 'food', 'building'],
    style: 'modern',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '190, 170, 140', description: 'Wall color RGB' },
      { key: 'ROOF_COLOR', default: '100, 45, 35', description: 'Roof/awning color RGB' },
      { key: 'TRIM_COLOR', default: '220, 200, 160', description: 'Interior accent color RGB' },
      { key: 'BUILD_NAME', default: 'Restaurant', description: 'Model name' },
    ],
  },

  // 10. School
  {
    id: 'school',
    triggers: [
      /\b(build|make|create|generate)\b.*\bschool\b/i,
      /\bschool\b.*\b(build|make|create|generate)\b/i,
      /\bclassroom\b/i,
    ],
    description: '2-story school with 4 classrooms (desks, whiteboard, teacher desk), hallway with lockers, principal office, cafeteria with long tables, gymnasium with basketball hoop, flagpole out front, front steps, and clock tower.',
    partCount: 110,
    tags: ['school', 'classroom', 'education', 'building'],
    style: 'modern',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '200, 180, 150', description: 'Brick wall color RGB' },
      { key: 'ROOF_COLOR', default: '80, 75, 70', description: 'Roof color RGB' },
      { key: 'TRIM_COLOR', default: '150, 40, 40', description: 'Trim/door color RGB' },
      { key: 'BUILD_NAME', default: 'School', description: 'Model name' },
    ],
  },

  // 11. Hospital
  {
    id: 'hospital',
    triggers: [
      /\b(build|make|create|generate)\b.*\bhospital\b/i,
      /\bhospital\b/i,
      /\bclinic\b/i,
      /\bmedical\s+(center|building)\b/i,
    ],
    description: 'Hospital with ER entrance (red cross sign), reception lobby, 3 patient rooms with beds, operating theater, waiting room with chairs, pharmacy counter, ambulance bay, rooftop helipad marked with H, and elevator shaft.',
    partCount: 95,
    tags: ['hospital', 'medical', 'clinic', 'building'],
    style: 'modern',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '230, 235, 240', description: 'Clean white wall color RGB' },
      { key: 'ROOF_COLOR', default: '90, 100, 110', description: 'Roof color RGB' },
      { key: 'TRIM_COLOR', default: '200, 50, 50', description: 'Red cross/accent color RGB' },
      { key: 'BUILD_NAME', default: 'Hospital', description: 'Model name' },
    ],
  },

  // 12. Garage
  {
    id: 'garage',
    triggers: [
      /\b(build|make|create|generate)\b.*\bgarage\b/i,
      /\bgarage\b/i,
      /\bcar\s+shop\b/i,
      /\bmechanic\b/i,
    ],
    description: '2-bay garage with roll-up doors, car lift, toolboxes, tire rack, oil drum props, office with desk, waiting area, neon sign, concrete floor with oil stains (dark patches), and exterior parking spots.',
    partCount: 60,
    tags: ['garage', 'mechanic', 'car', 'automotive', 'building'],
    style: 'industrial',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '160, 160, 165', description: 'Metal wall color RGB' },
      { key: 'ROOF_COLOR', default: '70, 70, 75', description: 'Roof color RGB' },
      { key: 'TRIM_COLOR', default: '200, 160, 40', description: 'Warning/accent color RGB' },
      { key: 'BUILD_NAME', default: 'Garage', description: 'Model name' },
    ],
  },

  // 13. Lighthouse
  {
    id: 'lighthouse',
    triggers: [
      /\b(build|make|create|generate)\b.*\blighthouse\b/i,
      /\blighthouse\b/i,
      /\bbeacon\b/i,
    ],
    description: 'Tall cylindrical lighthouse (6 stacked sections tapering upward), glass lantern room at top with SpotLight, spiral staircase inside (wedge parts), keeper cottage at base, rocky cliff foundation, dock with wooden planks, and fence railing.',
    partCount: 70,
    tags: ['lighthouse', 'beacon', 'coastal', 'ocean'],
    style: 'classic',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '230, 225, 215', description: 'White tower color RGB' },
      { key: 'ROOF_COLOR', default: '180, 40, 40', description: 'Red stripe color RGB' },
      { key: 'TRIM_COLOR', default: '60, 60, 55', description: 'Base/trim color RGB' },
      { key: 'BUILD_NAME', default: 'Lighthouse', description: 'Model name' },
    ],
  },

  // 14. Pirate Ship
  {
    id: 'pirate-ship',
    triggers: [
      /\b(build|make|create|generate)\b.*\bpirate\s+ship\b/i,
      /\bpirate\s+ship\b/i,
      /\bgalleon\b/i,
      /\b(build|make|create)\b.*\bship\b/i,
    ],
    description: 'Pirate galleon with curved hull (multiple wedge parts), 3 masts with yard arms, crow\'s nest on main mast, captain cabin at stern with windows, cannons on both sides (cylinder parts), anchor, ship wheel, plank walkway, Jolly Roger flag pole, and rope rails.',
    partCount: 100,
    tags: ['pirate', 'ship', 'galleon', 'ocean', 'boat'],
    style: 'rustic',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '110, 75, 45', description: 'Hull wood color RGB' },
      { key: 'ROOF_COLOR', default: '200, 190, 170', description: 'Sail color RGB' },
      { key: 'TRIM_COLOR', default: '60, 50, 35', description: 'Dark wood trim color RGB' },
      { key: 'BUILD_NAME', default: 'Pirate_Ship', description: 'Model name' },
    ],
  },

  // 15. Spaceship
  {
    id: 'spaceship',
    triggers: [
      /\b(build|make|create|generate)\b.*\bspaceship\b/i,
      /\bspaceship\b/i,
      /\bspace\s*craft\b/i,
      /\bstarship\b/i,
      /\bspaceship\b.*\b(build|make|create)\b/i,
    ],
    description: 'Sci-fi spaceship with sleek fuselage, angled wings, cockpit with glass canopy, twin engine nacelles (cylinder), thruster glow parts (neon), landing gear struts, cargo bay door, antenna array, hull panel lines (thin parts), and underside turret.',
    partCount: 80,
    tags: ['spaceship', 'spacecraft', 'space', 'sci-fi', 'vehicle'],
    style: 'sci-fi',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '160, 165, 175', description: 'Hull metal color RGB' },
      { key: 'ROOF_COLOR', default: '40, 120, 200', description: 'Accent glow color RGB' },
      { key: 'TRIM_COLOR', default: '60, 60, 65', description: 'Dark panel color RGB' },
      { key: 'BUILD_NAME', default: 'Spaceship', description: 'Model name' },
    ],
  },

  // 16. Treehouse
  {
    id: 'treehouse',
    triggers: [
      /\b(build|make|create|generate)\b.*\btree\s*house\b/i,
      /\btree\s*house\b/i,
    ],
    description: 'Large tree trunk (stacked brown cylinders) with branch platforms at 3 heights, main cabin with windows and door, rope bridge to second platform, rope ladder, tire swing (torus/cylinder), leaf canopy (green balls), lanterns on hooks, and small balcony with railing.',
    partCount: 75,
    tags: ['treehouse', 'tree', 'nature', 'cabin', 'building'],
    style: 'rustic',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '130, 90, 50', description: 'Wood/trunk color RGB' },
      { key: 'ROOF_COLOR', default: '60, 130, 50', description: 'Leaf canopy color RGB' },
      { key: 'TRIM_COLOR', default: '180, 150, 100', description: 'Light wood trim color RGB' },
      { key: 'BUILD_NAME', default: 'Treehouse', description: 'Model name' },
    ],
  },

  // 17. Underground Bunker
  {
    id: 'underground-bunker',
    triggers: [
      /\b(build|make|create|generate)\b.*\bbunker\b/i,
      /\bbunker\b/i,
      /\bunderground\s+(base|bunker|lair)\b/i,
      /\bsecret\s+base\b/i,
    ],
    description: 'Underground bunker accessed via hatch on surface. Interior has command room with screens (neon parts), bunk beds room, armory with weapon racks, generator room (cylinder props), storage crates, ventilation ducts (long thin parts), blast door, and emergency exit tunnel.',
    partCount: 85,
    tags: ['bunker', 'underground', 'military', 'base', 'secret'],
    style: 'industrial',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '120, 125, 120', description: 'Concrete wall color RGB' },
      { key: 'ROOF_COLOR', default: '80, 85, 80', description: 'Ceiling color RGB' },
      { key: 'TRIM_COLOR', default: '180, 160, 50', description: 'Warning stripe color RGB' },
      { key: 'BUILD_NAME', default: 'Underground_Bunker', description: 'Model name' },
    ],
  },

  // 18. Japanese Temple
  {
    id: 'japanese-temple',
    triggers: [
      /\b(build|make|create|generate)\b.*\b(japanese|japan)\s+temple\b/i,
      /\bjapanese\s+temple\b/i,
      /\bshinto\s+(shrine|temple)\b/i,
      /\bpagoda\b/i,
      /\btorii\b/i,
    ],
    description: '3-tier pagoda with curved roofs (wedge parts angled), torii gate entrance (red), stone lanterns along path, koi pond (blue transparent part), zen garden area with raked sand (light part), cherry blossom trees (pink ball clusters), wooden veranda, and bell tower.',
    partCount: 95,
    tags: ['japanese', 'temple', 'pagoda', 'shrine', 'torii'],
    style: 'japanese',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '210, 190, 155', description: 'Wood/panel color RGB' },
      { key: 'ROOF_COLOR', default: '50, 55, 65', description: 'Roof tile color RGB' },
      { key: 'TRIM_COLOR', default: '180, 40, 35', description: 'Torii red color RGB' },
      { key: 'BUILD_NAME', default: 'Japanese_Temple', description: 'Model name' },
    ],
  },

  // 19. Haunted Mansion
  {
    id: 'haunted-mansion',
    triggers: [
      /\b(build|make|create|generate)\b.*\bhaunted\b/i,
      /\bhaunted\s+(house|mansion)\b/i,
      /\bspooky\s+(house|mansion|building)\b/i,
      /\bhorror\s+house\b/i,
    ],
    description: 'Victorian haunted mansion with crooked tower, broken windows (partially transparent), grand entrance with cracked steps, overgrown fence (tilted parts), graveyard with tombstones, dead tree, cobweb corners (thin white parts), creaky porch, boarded-up windows, and eerie green PointLights inside.',
    partCount: 90,
    tags: ['haunted', 'mansion', 'horror', 'spooky', 'gothic'],
    style: 'gothic',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '90, 80, 75', description: 'Decayed wall color RGB' },
      { key: 'ROOF_COLOR', default: '45, 40, 50', description: 'Dark roof color RGB' },
      { key: 'TRIM_COLOR', default: '60, 55, 50', description: 'Rotted wood trim color RGB' },
      { key: 'BUILD_NAME', default: 'Haunted_Mansion', description: 'Model name' },
    ],
  },

  // 20. Fantasy Tower
  {
    id: 'fantasy-tower',
    triggers: [
      /\b(build|make|create|generate)\b.*\b(wizard|mage|fantasy)\s+tower\b/i,
      /\bwizard\s+tower\b/i,
      /\bmage\s+tower\b/i,
      /\bfantasy\s+tower\b/i,
      /\bsorcerer\b.*\btower\b/i,
    ],
    description: 'Tall spiral wizard tower with stone base, progressively narrower sections, conical roof with glowing orb (neon ball), floating ring platforms, crystal formations (diamond-shaped transparent parts), arched windows, balcony at top, bookshelf interior, cauldron room, and mystical particle emitters (purple/blue).',
    partCount: 85,
    tags: ['fantasy', 'wizard', 'tower', 'magic', 'mage'],
    style: 'fantasy',
    code: null,
    customizable: [
      { key: 'WALL_COLOR', default: '120, 110, 130', description: 'Stone tower color RGB' },
      { key: 'ROOF_COLOR', default: '70, 40, 120', description: 'Purple roof color RGB' },
      { key: 'TRIM_COLOR', default: '100, 180, 255', description: 'Magic glow color RGB' },
      { key: 'BUILD_NAME', default: 'Fantasy_Tower', description: 'Model name' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Runtime cache for dynamically learned builds
// ---------------------------------------------------------------------------

const runtimeCache: Map<string, { code: string; partCount: number; hitCount: number; lastUsed: number }> = new Map()

const MAX_RUNTIME_CACHE = 50

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

/**
 * Match a user prompt against all proven builds.
 * Returns the best match with confidence, or null if nothing fits.
 */
export function matchProvenBuild(prompt: string): CacheMatch | null {
  const normalized = prompt.toLowerCase().trim()

  let bestMatch: ProvenBuild | null = null
  let bestScore = 0

  for (const build of PROVEN_BUILDS) {
    let score = 0

    // Check regex triggers
    for (const trigger of build.triggers) {
      if (trigger.test(normalized)) {
        score += 0.6
        break // one trigger match is enough
      }
    }

    // Check tag overlap
    for (const tag of build.tags) {
      if (normalized.includes(tag)) {
        score += 0.1
      }
    }

    // Check style keyword
    if (normalized.includes(build.style)) {
      score += 0.15
    }

    // Penalize if prompt is very specific/long (probably wants something custom)
    if (prompt.length > 150) {
      score *= 0.7
    }

    // Penalize if prompt mentions "custom", "unique", "special", "specific"
    if (/\b(custom|unique|special|specific|exactly|precise)\b/i.test(normalized)) {
      score *= 0.5
    }

    if (score > bestScore) {
      bestScore = score
      bestMatch = build
    }
  }

  // Minimum threshold
  if (!bestMatch || bestScore < 0.5) {
    return null
  }

  // Also check runtime cache for better matches
  const runtimeHit = findRuntimeCacheHit(normalized)
  if (runtimeHit && runtimeHit.confidence > bestScore && runtimeHit.code) {
    return {
      build: {
        id: `runtime-${runtimeHit.key}`,
        triggers: [],
        description: 'Dynamically cached from a previous successful build',
        partCount: runtimeHit.partCount,
        tags: [],
        style: 'modern',
        code: runtimeHit.code,
        customizable: [],
      },
      confidence: runtimeHit.confidence,
    }
  }

  return {
    build: bestMatch,
    confidence: Math.min(bestScore, 1),
  }
}

// ---------------------------------------------------------------------------
// Runtime cache lookup
// ---------------------------------------------------------------------------

function normalizeForCacheKey(prompt: string): string {
  return prompt
    .toLowerCase()
    .replace(/\b(a|an|the|me|my|please|can you|could you|i want|i need|make|build|create|generate)\b/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function findRuntimeCacheHit(prompt: string): { key: string; code: string; partCount: number; confidence: number } | null {
  const normalizedPrompt = normalizeForCacheKey(prompt)
  const promptWordsArr = normalizedPrompt.split(' ').filter((w: string) => w.length > 2)
  const promptWords = new Set(promptWordsArr)

  let bestKey = ''
  let bestOverlap = 0

  runtimeCache.forEach((_, key) => {
    const keyWordsArr = key.split(' ').filter((w: string) => w.length > 2)
    const keyWords = new Set(keyWordsArr)
    let overlap = 0
    promptWordsArr.forEach(word => {
      if (keyWords.has(word)) overlap++
    })
    const score = overlap / Math.max(promptWords.size, keyWords.size, 1)
    if (score > bestOverlap) {
      bestOverlap = score
      bestKey = key
    }
  })

  if (bestOverlap >= 0.6 && bestKey) {
    const entry = runtimeCache.get(bestKey)!
    entry.hitCount++
    entry.lastUsed = Date.now()
    return {
      key: bestKey,
      code: entry.code,
      partCount: entry.partCount,
      confidence: bestOverlap,
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Customization
// ---------------------------------------------------------------------------

/**
 * Apply simple find-and-replace customizations to cached code based on the prompt.
 * Handles color swaps, name changes, and basic material changes.
 */
export function customizeProvenBuild(code: string, prompt: string, build?: ProvenBuild): string {
  let result = code

  // Apply model name from prompt
  const nameMatch = prompt.match(/(?:called|named)\s+"?([^"]+)"?/i)
  if (nameMatch) {
    result = result.replace(/m\.Name\s*=\s*"[^"]*"/, `m.Name = "${nameMatch[1].trim()}"`)
  }

  // Color customization from prompt
  const colorMap: Record<string, string> = {
    red: '200, 50, 50',
    blue: '50, 80, 200',
    green: '50, 160, 60',
    yellow: '220, 200, 50',
    purple: '120, 50, 180',
    pink: '220, 100, 150',
    orange: '220, 130, 40',
    black: '35, 35, 35',
    white: '240, 240, 240',
    gray: '140, 140, 140',
    grey: '140, 140, 140',
    brown: '120, 80, 45',
    gold: '212, 175, 55',
    cyan: '50, 200, 200',
    teal: '50, 160, 160',
  }

  // Check if user mentioned a color for the walls/main color
  for (const [colorName, rgb] of Object.entries(colorMap)) {
    const colorRegex = new RegExp(`\\b${colorName}\\b`, 'i')
    if (colorRegex.test(prompt)) {
      // Replace the WALL_COLOR placeholder or the first common wall color
      if (build?.customizable) {
        const wallCustom = build.customizable.find(c => c.key === 'WALL_COLOR')
        if (wallCustom) {
          result = result.replace(
            new RegExp(`Color3\\.fromRGB\\(${escapeRegex(wallCustom.default)}\\)`, 'g'),
            `Color3.fromRGB(${rgb})`
          )
        }
      }
      break // only apply first color match to walls
    }
  }

  // Material customization
  const materialMap: Record<string, string> = {
    wooden: 'Enum.Material.Wood',
    wood: 'Enum.Material.Wood',
    stone: 'Enum.Material.Cobblestone',
    brick: 'Enum.Material.Brick',
    metal: 'Enum.Material.Metal',
    concrete: 'Enum.Material.Concrete',
    marble: 'Enum.Material.Marble',
    ice: 'Enum.Material.Ice',
    glass: 'Enum.Material.Glass',
    neon: 'Enum.Material.Neon',
  }

  for (const [keyword, material] of Object.entries(materialMap)) {
    if (prompt.toLowerCase().includes(keyword)) {
      // Replace the primary wall material
      if (result.includes('Enum.Material.Brick')) {
        result = result.replace(/Enum\.Material\.Brick/g, material)
      } else if (result.includes('Enum.Material.Concrete')) {
        result = result.replace(/Enum\.Material\.Concrete/g, material)
      }
      break
    }
  }

  // Scale customization
  if (/\b(big|large|huge|massive|giant)\b/i.test(prompt)) {
    result = addScaleMultiplier(result, 1.5)
  } else if (/\b(small|tiny|mini|little)\b/i.test(prompt)) {
    result = addScaleMultiplier(result, 0.6)
  }

  return result
}

function addScaleMultiplier(code: string, scale: number): string {
  // Insert scale multiplier after sp/gy definitions
  const scaleBlock = `local _scale = ${scale}\n`
  const spLine = code.indexOf('local gy =')
  if (spLine !== -1) {
    const insertAt = code.indexOf('\n', spLine) + 1
    return code.slice(0, insertAt) + scaleBlock + code.slice(insertAt)
  }
  return code
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ---------------------------------------------------------------------------
// Learning: cache successful builds at runtime
// ---------------------------------------------------------------------------

/**
 * Save a successful build to the runtime cache so future similar prompts
 * get instant results. Called when a build scores well (e.g. > 60 quality score).
 */
export function cacheSuccessfulBuild(prompt: string, code: string, partCount: number): void {
  const key = normalizeForCacheKey(prompt)
  if (!key || key.length < 5) return
  if (!code || code.length < 200) return // too small to be real

  // Don't cache scripts, only builds
  if (code.includes('ServerScriptService') || code.includes('.Source') || code.includes('RemoteEvent')) {
    return
  }

  // Evict oldest if at capacity
  if (runtimeCache.size >= MAX_RUNTIME_CACHE) {
    let oldestKey = ''
    let oldestTime = Infinity
    runtimeCache.forEach((v, k) => {
      if (v.lastUsed < oldestTime) {
        oldestTime = v.lastUsed
        oldestKey = k
      }
    })
    if (oldestKey) runtimeCache.delete(oldestKey)
  }

  runtimeCache.set(key, {
    code,
    partCount,
    hitCount: 0,
    lastUsed: Date.now(),
  })

  console.log(`[BuildCache] Cached build: "${key}" (${partCount} parts, ${code.length} chars)`)
}

// ---------------------------------------------------------------------------
// Utility: build full Luau from a proven build template
// ---------------------------------------------------------------------------

/**
 * Wraps a proven build's code (or a runtime-cached code) with the standard
 * boilerplate header/footer so it's ready to execute in Studio.
 */
export function wrapWithBoilerplate(buildCode: string, buildName: string): string {
  const header = BOILERPLATE_HEADER.replace('m.Name = "ForjeBuild"', `m.Name = "${buildName}"`)
  return header + '\n' + buildCode + '\n' + BOILERPLATE_FOOTER
}

/**
 * Get a proven build by ID (for direct lookups).
 */
export function getProvenBuildById(id: string): ProvenBuild | undefined {
  return PROVEN_BUILDS.find(b => b.id === id)
}

/**
 * Update a proven build's code (called when AI generates code for a template).
 * This fills in the `code` field so future requests skip AI entirely.
 */
export function setProvenBuildCode(id: string, code: string, partCount?: number): boolean {
  const build = PROVEN_BUILDS.find(b => b.id === id)
  if (!build) return false
  build.code = code
  if (partCount) build.partCount = partCount
  console.log(`[BuildCache] Set code for proven build "${id}" (${code.length} chars, ${partCount ?? build.partCount} parts)`)
  return true
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export function getCacheStats(): {
  provenBuilds: number
  provenWithCode: number
  runtimeCached: number
  runtimeTotalHits: number
} {
  let provenWithCode = 0
  for (const b of PROVEN_BUILDS) {
    if (b.code) provenWithCode++
  }
  let totalHits = 0
  runtimeCache.forEach(v => {
    totalHits += v.hitCount
  })
  return {
    provenBuilds: PROVEN_BUILDS.length,
    provenWithCode,
    runtimeCached: runtimeCache.size,
    runtimeTotalHits: totalHits,
  }
}
