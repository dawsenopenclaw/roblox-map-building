/**
 * Structure, building, and architecture templates.
 * Covers: small structures, shops, public buildings, fantasy/themed buildings.
 */
import { BuildTemplate } from './build-template-chunks'

export const STRUCTURE_TEMPLATES: BuildTemplate[] = [
  {
    title: 'Guard Tower — wooden watchtower with ladder and railing',
    tags: ['guard', 'tower', 'watchtower', 'medieval', 'defense', 'lookout'],
    description: 'A 4-legged wooden watchtower, 20 studs tall, with platform, railing, ladder, and small roof. 16 parts.',
    code: `local folder = getFolder("GuardTower")
P("Leg1", CFrame.new(-3, 7.5, -3), Vector3.new(0.8, 15, 0.8), Enum.Material.Wood, Color3.fromRGB(100, 65, 30))
P("Leg2", CFrame.new(3, 7.5, -3), Vector3.new(0.8, 15, 0.8), Enum.Material.Wood, Color3.fromRGB(100, 65, 30))
P("Leg3", CFrame.new(-3, 7.5, 3), Vector3.new(0.8, 15, 0.8), Enum.Material.Wood, Color3.fromRGB(100, 65, 30))
P("Leg4", CFrame.new(3, 7.5, 3), Vector3.new(0.8, 15, 0.8), Enum.Material.Wood, Color3.fromRGB(100, 65, 30))
P("Platform", CFrame.new(0, 15.25, 0), Vector3.new(8, 0.5, 8), Enum.Material.WoodPlanks, Color3.fromRGB(140, 95, 50))
P("RailN", CFrame.new(0, 16.5, 4), Vector3.new(8, 2, 0.3), Enum.Material.Wood, Color3.fromRGB(110, 70, 32))
P("RailS", CFrame.new(0, 16.5, -4), Vector3.new(8, 2, 0.3), Enum.Material.Wood, Color3.fromRGB(110, 70, 32))
P("RailE", CFrame.new(4, 16.5, 0), Vector3.new(0.3, 2, 7.5), Enum.Material.Wood, Color3.fromRGB(110, 70, 32))
P("RailW", CFrame.new(-4, 16.5, 0), Vector3.new(0.3, 2, 7.5), Enum.Material.Wood, Color3.fromRGB(110, 70, 32))
P("RoofA", CFrame.new(-2.5, 18.5, 0) * CFrame.Angles(0, 0, math.rad(20)), Vector3.new(6, 0.4, 9), Enum.Material.Wood, Color3.fromRGB(90, 55, 25))
P("RoofB", CFrame.new(2.5, 18.5, 0) * CFrame.Angles(0, 0, math.rad(-20)), Vector3.new(6, 0.4, 9), Enum.Material.Wood, Color3.fromRGB(90, 55, 25))
P("LadderRailL", CFrame.new(-1, 7.5, -4), Vector3.new(0.3, 15, 0.3), Enum.Material.Wood, Color3.fromRGB(95, 60, 28))
P("LadderRailR", CFrame.new(1, 7.5, -4), Vector3.new(0.3, 15, 0.3), Enum.Material.Wood, Color3.fromRGB(95, 60, 28))
P("Rung1", CFrame.new(0, 3, -4), Vector3.new(2, 0.2, 0.3), Enum.Material.Wood, Color3.fromRGB(120, 78, 35))
P("Rung2", CFrame.new(0, 6, -4), Vector3.new(2, 0.2, 0.3), Enum.Material.Wood, Color3.fromRGB(120, 78, 35))
P("Rung3", CFrame.new(0, 9, -4), Vector3.new(2, 0.2, 0.3), Enum.Material.Wood, Color3.fromRGB(120, 78, 35))
P("Rung4", CFrame.new(0, 12, -4), Vector3.new(2, 0.2, 0.3), Enum.Material.Wood, Color3.fromRGB(120, 78, 35))`,
  },
  {
    title: 'Lighthouse — tall cylindrical tower with light at top',
    tags: ['lighthouse', 'coast', 'beacon', 'ocean', 'nautical', 'tower'],
    description: 'A 35-stud tall lighthouse with red/white striped tower, glass lamp room, balcony, and PointLight beacon. 14 parts.',
    code: `local folder = getFolder("Lighthouse")
P("Base", CFrame.new(0, 1.5, 0), Vector3.new(10, 3, 10), Enum.Material.Concrete, Color3.fromRGB(200, 195, 185))
P("TowerLower", CFrame.new(0, 7, 0), Vector3.new(7, 8, 7), Enum.Material.Concrete, Color3.fromRGB(220, 215, 205))
P("StripeRed1", CFrame.new(0, 12, 0), Vector3.new(6.8, 2, 6.8), Enum.Material.Concrete, Color3.fromRGB(200, 50, 40))
P("TowerMid", CFrame.new(0, 16, 0), Vector3.new(6.5, 6, 6.5), Enum.Material.Concrete, Color3.fromRGB(220, 215, 205))
P("StripeRed2", CFrame.new(0, 20, 0), Vector3.new(6.3, 2, 6.3), Enum.Material.Concrete, Color3.fromRGB(200, 50, 40))
P("TowerUpper", CFrame.new(0, 24, 0), Vector3.new(6, 6, 6), Enum.Material.Concrete, Color3.fromRGB(225, 220, 210))
P("Balcony", CFrame.new(0, 27.25, 0), Vector3.new(8, 0.5, 8), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))
P("BalconyRail", CFrame.new(0, 28.5, 0), Vector3.new(8.5, 2, 8.5), Enum.Material.Metal, Color3.fromRGB(50, 50, 55))
P("LampRoom", CFrame.new(0, 30, 0), Vector3.new(5, 3, 5), Enum.Material.Glass, Color3.fromRGB(200, 220, 240))
P("LampRoof", CFrame.new(0, 32, 0), Vector3.new(6, 1, 6), Enum.Material.Metal, Color3.fromRGB(40, 40, 45))
P("LampTop", CFrame.new(0, 33, 0), Vector3.new(3, 1, 3), Enum.Material.Metal, Color3.fromRGB(45, 45, 50))
P("Spire", CFrame.new(0, 34, 0), Vector3.new(0.5, 1.5, 0.5), Enum.Material.Metal, Color3.fromRGB(200, 190, 60))
local beacon = P("Beacon", CFrame.new(0, 30, 0), Vector3.new(2, 1.5, 2), Enum.Material.Neon, Color3.fromRGB(255, 250, 200))
local bl = Instance.new("PointLight"); bl.Range = 120; bl.Brightness = 3; bl.Color = Color3.fromRGB(255, 245, 200); bl.Parent = beacon`,
  },
  {
    title: 'Gas Station — pumps, canopy, small shop building',
    tags: ['gas', 'station', 'fuel', 'petrol', 'modern', 'building', 'road'],
    description: 'A gas station with 2 fuel pumps under a canopy, small convenience store building, and parking area. 24 parts.',
    code: `local folder = getFolder("GasStation")
P("ParkingLot", CFrame.new(0, 0.05, 0), Vector3.new(30, 0.1, 25), Enum.Material.Concrete, Color3.fromRGB(140, 138, 132))
P("CanopyRoof", CFrame.new(0, 12, 8), Vector3.new(18, 0.5, 14), Enum.Material.Metal, Color3.fromRGB(220, 220, 225))
P("CanopyPillar1", CFrame.new(-7, 6, 3), Vector3.new(0.8, 12, 0.8), Enum.Material.Metal, Color3.fromRGB(200, 200, 205))
P("CanopyPillar2", CFrame.new(7, 6, 3), Vector3.new(0.8, 12, 0.8), Enum.Material.Metal, Color3.fromRGB(200, 200, 205))
P("CanopyPillar3", CFrame.new(-7, 6, 13), Vector3.new(0.8, 12, 0.8), Enum.Material.Metal, Color3.fromRGB(200, 200, 205))
P("CanopyPillar4", CFrame.new(7, 6, 13), Vector3.new(0.8, 12, 0.8), Enum.Material.Metal, Color3.fromRGB(200, 200, 205))
P("PumpIsland", CFrame.new(0, 0.3, 8), Vector3.new(12, 0.6, 4), Enum.Material.Concrete, Color3.fromRGB(160, 158, 150))
P("Pump1Body", CFrame.new(-3, 2.5, 8), Vector3.new(1.5, 4, 1), Enum.Material.Metal, Color3.fromRGB(200, 50, 40))
P("Pump1Screen", CFrame.new(-3, 3.5, 7.4), Vector3.new(1, 0.8, 0.1), Enum.Material.Neon, Color3.fromRGB(100, 200, 100))
P("Pump2Body", CFrame.new(3, 2.5, 8), Vector3.new(1.5, 4, 1), Enum.Material.Metal, Color3.fromRGB(200, 50, 40))
P("Pump2Screen", CFrame.new(3, 3.5, 7.4), Vector3.new(1, 0.8, 0.1), Enum.Material.Neon, Color3.fromRGB(100, 200, 100))
P("ShopFloor", CFrame.new(0, 0.1, -8), Vector3.new(16, 0.2, 10), Enum.Material.Concrete, Color3.fromRGB(180, 175, 168))
P("ShopWallBack", CFrame.new(0, 5, -13), Vector3.new(16, 10, 0.5), Enum.Material.Brick, Color3.fromRGB(190, 185, 175))
P("ShopWallL", CFrame.new(-8, 5, -8), Vector3.new(0.5, 10, 9.5), Enum.Material.Brick, Color3.fromRGB(185, 180, 170))
P("ShopWallR", CFrame.new(8, 5, -8), Vector3.new(0.5, 10, 9.5), Enum.Material.Brick, Color3.fromRGB(185, 180, 170))
P("ShopFront", CFrame.new(0, 5, -3), Vector3.new(16, 10, 0.5), Enum.Material.Brick, Color3.fromRGB(190, 185, 175))
P("ShopWindow", CFrame.new(-3, 4, -2.8), Vector3.new(6, 5, 0.2), Enum.Material.Glass, Color3.fromRGB(180, 210, 230))
P("ShopDoor", CFrame.new(4, 3.5, -2.8), Vector3.new(3, 7, 0.3), Enum.Material.Glass, Color3.fromRGB(170, 200, 220))
P("ShopRoof", CFrame.new(0, 10.25, -8), Vector3.new(17, 0.5, 11), Enum.Material.Concrete, Color3.fromRGB(120, 118, 112))
P("ShopSign", CFrame.new(0, 9, -2.6), Vector3.new(8, 2, 0.3), Enum.Material.Metal, Color3.fromRGB(40, 100, 180))
local canopyL = P("CanopyLight1", CFrame.new(-3, 11.5, 8), Vector3.new(1.5, 0.3, 1.5), Enum.Material.Neon, Color3.fromRGB(255, 250, 240))
local cl1 = Instance.new("PointLight"); cl1.Range = 25; cl1.Brightness = 1.5; cl1.Parent = canopyL
local canopyL2 = P("CanopyLight2", CFrame.new(3, 11.5, 8), Vector3.new(1.5, 0.3, 1.5), Enum.Material.Neon, Color3.fromRGB(255, 250, 240))
local cl2 = Instance.new("PointLight"); cl2.Range = 25; cl2.Brightness = 1.5; cl2.Parent = canopyL2`,
  },
  {
    title: 'Treehouse — platform in tree with ladder, walls, and rope bridge start',
    tags: ['treehouse', 'tree', 'house', 'adventure', 'kids', 'nature', 'fort'],
    description: 'A treehouse built around a large tree trunk: platform at Y=12, partial walls, window, trapdoor entry with ladder, and the start of a rope bridge. 20 parts.',
    code: `local folder = getFolder("Treehouse")
P("TreeTrunk", CFrame.new(0, 8, 0), Vector3.new(3, 16, 3), Enum.Material.Wood, Color3.fromRGB(95, 60, 30))
P("TreeRoots", CFrame.new(0, 0.5, 0), Vector3.new(5, 1, 5), Enum.Material.Wood, Color3.fromRGB(85, 52, 25))
P("TreeCanopy1", CFrame.new(0, 20, 0), Vector3.new(14, 6, 14), Enum.Material.Grass, Color3.fromRGB(55, 130, 45))
P("TreeCanopy2", CFrame.new(-3, 22, 2), Vector3.new(10, 4, 10), Enum.Material.Grass, Color3.fromRGB(50, 120, 40))
P("Platform", CFrame.new(0, 12.25, 0), Vector3.new(10, 0.5, 10), Enum.Material.WoodPlanks, Color3.fromRGB(150, 100, 50))
P("SupportBeam1", CFrame.new(-4.5, 10, -4.5) * CFrame.Angles(0, 0, math.rad(15)), Vector3.new(0.5, 5, 0.5), Enum.Material.Wood, Color3.fromRGB(100, 62, 28))
P("SupportBeam2", CFrame.new(4.5, 10, 4.5) * CFrame.Angles(0, 0, math.rad(-15)), Vector3.new(0.5, 5, 0.5), Enum.Material.Wood, Color3.fromRGB(100, 62, 28))
P("WallBack", CFrame.new(0, 15, -5), Vector3.new(10, 5, 0.4), Enum.Material.WoodPlanks, Color3.fromRGB(140, 90, 45))
P("WallLeft", CFrame.new(-5, 15, 0), Vector3.new(0.4, 5, 9.5), Enum.Material.WoodPlanks, Color3.fromRGB(135, 88, 42))
P("WallRightLower", CFrame.new(5, 13.5, -1), Vector3.new(0.4, 2, 7.5), Enum.Material.WoodPlanks, Color3.fromRGB(135, 88, 42))
P("Window", CFrame.new(5.1, 15, -2), Vector3.new(0.2, 2, 2.5), Enum.Material.Glass, Color3.fromRGB(180, 210, 230))
P("Roof", CFrame.new(0, 17.75, 0), Vector3.new(11, 0.4, 11), Enum.Material.WoodPlanks, Color3.fromRGB(120, 75, 35))
P("LadderRailL", CFrame.new(-1, 6, 5.2), Vector3.new(0.3, 12, 0.3), Enum.Material.Wood, Color3.fromRGB(95, 58, 28))
P("LadderRailR", CFrame.new(1, 6, 5.2), Vector3.new(0.3, 12, 0.3), Enum.Material.Wood, Color3.fromRGB(95, 58, 28))
P("LadderRung1", CFrame.new(0, 2, 5.2), Vector3.new(2, 0.2, 0.3), Enum.Material.Wood, Color3.fromRGB(120, 78, 35))
P("LadderRung2", CFrame.new(0, 5, 5.2), Vector3.new(2, 0.2, 0.3), Enum.Material.Wood, Color3.fromRGB(120, 78, 35))
P("LadderRung3", CFrame.new(0, 8, 5.2), Vector3.new(2, 0.2, 0.3), Enum.Material.Wood, Color3.fromRGB(120, 78, 35))
P("LadderRung4", CFrame.new(0, 11, 5.2), Vector3.new(2, 0.2, 0.3), Enum.Material.Wood, Color3.fromRGB(120, 78, 35))
P("RopeBridgeStart", CFrame.new(5.5, 12.5, 0), Vector3.new(3, 0.3, 2), Enum.Material.WoodPlanks, Color3.fromRGB(130, 82, 38))
P("RopeL", CFrame.new(6.5, 14, -0.8), Vector3.new(0.1, 3, 0.1), Enum.Material.Fabric, Color3.fromRGB(160, 140, 100))
P("RopeR", CFrame.new(6.5, 14, 0.8), Vector3.new(0.1, 3, 0.1), Enum.Material.Fabric, Color3.fromRGB(160, 140, 100))`,
  },
  {
    title: 'Church / Chapel — small church with steeple and stained glass',
    tags: ['church', 'chapel', 'religion', 'steeple', 'building', 'village', 'wedding'],
    description: 'A small village church: nave, steeple with bell, arched doorway, stained glass windows, pews inside. 22 parts.',
    code: `local folder = getFolder("Church")
P("Nave", CFrame.new(0, 5, 0), Vector3.new(12, 10, 20), Enum.Material.Brick, Color3.fromRGB(200, 195, 180))
P("NaveRoofL", CFrame.new(-4, 11, 0) * CFrame.Angles(0, 0, math.rad(25)), Vector3.new(8, 0.5, 21), Enum.Material.Slate, Color3.fromRGB(70, 70, 80))
P("NaveRoofR", CFrame.new(4, 11, 0) * CFrame.Angles(0, 0, math.rad(-25)), Vector3.new(8, 0.5, 21), Enum.Material.Slate, Color3.fromRGB(70, 70, 80))
P("SteepleLower", CFrame.new(0, 12, 10), Vector3.new(6, 4, 6), Enum.Material.Brick, Color3.fromRGB(205, 200, 185))
P("SteepleUpper", CFrame.new(0, 17, 10), Vector3.new(4, 6, 4), Enum.Material.Brick, Color3.fromRGB(210, 205, 190))
P("SteepleSpire", CFrame.new(0, 22, 10), Vector3.new(2, 4, 2), Enum.Material.Slate, Color3.fromRGB(65, 65, 75))
P("Cross", CFrame.new(0, 24.5, 10), Vector3.new(0.3, 1.5, 0.3), Enum.Material.Metal, Color3.fromRGB(200, 180, 60))
P("CrossArm", CFrame.new(0, 24.5, 10), Vector3.new(1, 0.3, 0.3), Enum.Material.Metal, Color3.fromRGB(200, 180, 60))
P("Doorway", CFrame.new(0, 3.5, 10.3), Vector3.new(4, 7, 0.3), Enum.Material.Wood, Color3.fromRGB(80, 48, 20))
P("StainedGlassL", CFrame.new(-6.1, 5, -3), Vector3.new(0.2, 4, 2.5), Enum.Material.Glass, Color3.fromRGB(100, 60, 180))
P("StainedGlassR", CFrame.new(6.1, 5, -3), Vector3.new(0.2, 4, 2.5), Enum.Material.Glass, Color3.fromRGB(180, 60, 60))
P("StainedGlassL2", CFrame.new(-6.1, 5, 3), Vector3.new(0.2, 4, 2.5), Enum.Material.Glass, Color3.fromRGB(60, 120, 180))
P("StainedGlassR2", CFrame.new(6.1, 5, 3), Vector3.new(0.2, 4, 2.5), Enum.Material.Glass, Color3.fromRGB(60, 180, 100))
P("Altar", CFrame.new(0, 1.5, -8), Vector3.new(4, 3, 2), Enum.Material.Slate, Color3.fromRGB(180, 175, 168))
P("Pew1", CFrame.new(-3, 1.3, -2), Vector3.new(4, 0.3, 1.5), Enum.Material.Wood, Color3.fromRGB(120, 75, 35))
P("PewBack1", CFrame.new(-3, 2, -2.6), Vector3.new(4, 1.5, 0.3), Enum.Material.Wood, Color3.fromRGB(115, 70, 32))
P("Pew2", CFrame.new(3, 1.3, -2), Vector3.new(4, 0.3, 1.5), Enum.Material.Wood, Color3.fromRGB(120, 75, 35))
P("PewBack2", CFrame.new(3, 2, -2.6), Vector3.new(4, 1.5, 0.3), Enum.Material.Wood, Color3.fromRGB(115, 70, 32))
P("Pew3", CFrame.new(-3, 1.3, 3), Vector3.new(4, 0.3, 1.5), Enum.Material.Wood, Color3.fromRGB(120, 75, 35))
P("Pew4", CFrame.new(3, 1.3, 3), Vector3.new(4, 0.3, 1.5), Enum.Material.Wood, Color3.fromRGB(120, 75, 35))
P("Floor", CFrame.new(0, 0.1, 0), Vector3.new(11.5, 0.2, 19.5), Enum.Material.Cobblestone, Color3.fromRGB(150, 145, 135))
local bellLight = P("Bell", CFrame.new(0, 15, 10), Vector3.new(1.5, 1.5, 1.5), Enum.Material.Metal, Color3.fromRGB(180, 160, 60))`,
  },
  {
    title: 'Igloo — dome-shaped snow shelter with entrance tunnel',
    tags: ['igloo', 'snow', 'ice', 'arctic', 'winter', 'shelter', 'eskimo'],
    description: 'A snow igloo with domed shape (3 stacked layers), entrance tunnel, and ice block texture. 10 parts.',
    code: `local folder = getFolder("Igloo")
P("Base", CFrame.new(0, 2.5, 0), Vector3.new(10, 5, 10), Enum.Material.Concrete, Color3.fromRGB(235, 240, 245))
P("Mid", CFrame.new(0, 5.5, 0), Vector3.new(8, 3, 8), Enum.Material.Concrete, Color3.fromRGB(230, 235, 242))
P("Top", CFrame.new(0, 7.5, 0), Vector3.new(5, 2, 5), Enum.Material.Concrete, Color3.fromRGB(225, 230, 240))
P("Cap", CFrame.new(0, 9, 0), Vector3.new(2.5, 1, 2.5), Enum.Material.Concrete, Color3.fromRGB(240, 245, 250))
P("TunnelFloor", CFrame.new(0, 0.25, 7), Vector3.new(4, 0.5, 5), Enum.Material.Concrete, Color3.fromRGB(220, 225, 235))
P("TunnelWallL", CFrame.new(-2, 2, 7), Vector3.new(0.5, 3, 5), Enum.Material.Concrete, Color3.fromRGB(225, 230, 240))
P("TunnelWallR", CFrame.new(2, 2, 7), Vector3.new(0.5, 3, 5), Enum.Material.Concrete, Color3.fromRGB(225, 230, 240))
P("TunnelRoof", CFrame.new(0, 3.75, 7), Vector3.new(4, 0.5, 5), Enum.Material.Concrete, Color3.fromRGB(230, 235, 242))
P("InteriorFloor", CFrame.new(0, 0.15, 0), Vector3.new(8, 0.3, 8), Enum.Material.Fabric, Color3.fromRGB(180, 140, 90))
local warmth = P("WarmLight", CFrame.new(0, 3, 0), Vector3.new(0.5, 0.5, 0.5), Enum.Material.Neon, Color3.fromRGB(255, 180, 80))
local wl = Instance.new("PointLight"); wl.Range = 12; wl.Brightness = 0.6; wl.Color = Color3.fromRGB(255, 200, 120); wl.Parent = warmth`,
  },
  {
    title: 'Pyramid — Egyptian style with entrance and base steps',
    tags: ['pyramid', 'egypt', 'egyptian', 'ancient', 'desert', 'monument', 'tomb'],
    description: 'An Egyptian pyramid with 5 stacked layers, entrance doorway, and surrounding sand base. 10 parts.',
    code: `local folder = getFolder("Pyramid")
P("SandBase", CFrame.new(0, -0.25, 0), Vector3.new(60, 0.5, 60), Enum.Material.Concrete, Color3.fromRGB(210, 190, 140))
P("Layer1", CFrame.new(0, 2.5, 0), Vector3.new(40, 5, 40), Enum.Material.Concrete, Color3.fromRGB(220, 200, 150))
P("Layer2", CFrame.new(0, 7.5, 0), Vector3.new(32, 5, 32), Enum.Material.Concrete, Color3.fromRGB(215, 195, 145))
P("Layer3", CFrame.new(0, 12.5, 0), Vector3.new(24, 5, 24), Enum.Material.Concrete, Color3.fromRGB(210, 190, 140))
P("Layer4", CFrame.new(0, 17.5, 0), Vector3.new(16, 5, 16), Enum.Material.Concrete, Color3.fromRGB(205, 185, 135))
P("Layer5", CFrame.new(0, 22.5, 0), Vector3.new(8, 5, 8), Enum.Material.Concrete, Color3.fromRGB(200, 180, 130))
P("Cap", CFrame.new(0, 26, 0), Vector3.new(3, 2, 3), Enum.Material.Metal, Color3.fromRGB(220, 200, 80))
P("EntranceDark", CFrame.new(0, 3, 20.3), Vector3.new(4, 5, 0.3), Enum.Material.Concrete, Color3.fromRGB(50, 40, 30))
P("EntranceFrame1", CFrame.new(-2.2, 3, 20.2), Vector3.new(0.4, 5.5, 0.5), Enum.Material.Concrete, Color3.fromRGB(200, 180, 130))
P("EntranceFrame2", CFrame.new(2.2, 3, 20.2), Vector3.new(0.4, 5.5, 0.5), Enum.Material.Concrete, Color3.fromRGB(200, 180, 130))`,
  },
  {
    title: 'Wizard Tower — spiraling magical tower with crystal top',
    tags: ['wizard', 'tower', 'magic', 'fantasy', 'mage', 'sorcerer', 'spell'],
    description: 'A fantasy wizard tower: stone base, narrowing body with shelf rings, crystal dome top with glow, and floating rune ring. 16 parts.',
    code: `local folder = getFolder("WizardTower")
P("Base", CFrame.new(0, 3, 0), Vector3.new(10, 6, 10), Enum.Material.Slate, Color3.fromRGB(80, 75, 90))
P("Body1", CFrame.new(0, 9, 0), Vector3.new(8, 6, 8), Enum.Material.Slate, Color3.fromRGB(85, 80, 95))
P("Ring1", CFrame.new(0, 12.25, 0), Vector3.new(9, 0.5, 9), Enum.Material.Slate, Color3.fromRGB(75, 70, 85))
P("Body2", CFrame.new(0, 15.5, 0), Vector3.new(7, 6, 7), Enum.Material.Slate, Color3.fromRGB(90, 85, 100))
P("Ring2", CFrame.new(0, 18.75, 0), Vector3.new(8, 0.5, 8), Enum.Material.Slate, Color3.fromRGB(75, 70, 85))
P("Body3", CFrame.new(0, 22, 0), Vector3.new(6, 6, 6), Enum.Material.Slate, Color3.fromRGB(95, 90, 105))
P("Parapet", CFrame.new(0, 25.25, 0), Vector3.new(7, 0.5, 7), Enum.Material.Slate, Color3.fromRGB(80, 75, 90))
P("CrystalDome", CFrame.new(0, 27.5, 0), Vector3.new(5, 4, 5), Enum.Material.Glass, Color3.fromRGB(120, 80, 200))
local glow = P("CrystalCore", CFrame.new(0, 27.5, 0), Vector3.new(2, 2, 2), Enum.Material.Neon, Color3.fromRGB(160, 100, 255))
local gl = Instance.new("PointLight"); gl.Range = 40; gl.Brightness = 2; gl.Color = Color3.fromRGB(150, 90, 255); gl.Parent = glow
P("RuneRing", CFrame.new(0, 29, 0), Vector3.new(8, 0.2, 8), Enum.Material.Neon, Color3.fromRGB(130, 80, 220))
P("Window1", CFrame.new(0, 10, 4.1), Vector3.new(1.5, 3, 0.2), Enum.Material.Glass, Color3.fromRGB(150, 100, 220))
P("Window2", CFrame.new(4.1, 16, 0), Vector3.new(0.2, 3, 1.5), Enum.Material.Glass, Color3.fromRGB(150, 100, 220))
P("Window3", CFrame.new(0, 22, -3.1), Vector3.new(1.5, 3, 0.2), Enum.Material.Glass, Color3.fromRGB(150, 100, 220))
P("Door", CFrame.new(0, 2.5, 5.1), Vector3.new(3, 5, 0.3), Enum.Material.Wood, Color3.fromRGB(60, 35, 18))
P("DoorArch", CFrame.new(0, 5.5, 5.1), Vector3.new(3.5, 1, 0.4), Enum.Material.Slate, Color3.fromRGB(70, 65, 80))`,
  },
  {
    title: 'Underground Bunker Entrance — hatch, stairs, reinforced walls',
    tags: ['bunker', 'underground', 'hatch', 'military', 'shelter', 'apocalypse', 'survival'],
    description: 'An underground bunker entrance: surface hatch door, stairs descending, reinforced concrete walls, emergency light. 14 parts.',
    code: `local folder = getFolder("BunkerEntrance")
P("SurfaceGround", CFrame.new(0, -0.25, 0), Vector3.new(12, 0.5, 12), Enum.Material.Grass, Color3.fromRGB(75, 140, 55))
P("HatchFrame", CFrame.new(0, 0.15, 0), Vector3.new(5, 0.3, 5), Enum.Material.Metal, Color3.fromRGB(100, 100, 105))
P("HatchDoor", CFrame.new(0, 0.4, 1) * CFrame.Angles(math.rad(-60), 0, 0), Vector3.new(4.5, 0.2, 4.5), Enum.Material.Metal, Color3.fromRGB(80, 80, 85))
P("StairWallL", CFrame.new(-2.5, -4, 0), Vector3.new(0.5, 8, 8), Enum.Material.Concrete, Color3.fromRGB(140, 138, 130))
P("StairWallR", CFrame.new(2.5, -4, 0), Vector3.new(0.5, 8, 8), Enum.Material.Concrete, Color3.fromRGB(140, 138, 130))
P("Step1", CFrame.new(0, -0.5, -1), Vector3.new(4.5, 0.5, 2), Enum.Material.Concrete, Color3.fromRGB(150, 148, 140))
P("Step2", CFrame.new(0, -1.5, -3), Vector3.new(4.5, 0.5, 2), Enum.Material.Concrete, Color3.fromRGB(148, 146, 138))
P("Step3", CFrame.new(0, -2.5, -5), Vector3.new(4.5, 0.5, 2), Enum.Material.Concrete, Color3.fromRGB(146, 144, 136))
P("Step4", CFrame.new(0, -3.5, -7), Vector3.new(4.5, 0.5, 2), Enum.Material.Concrete, Color3.fromRGB(144, 142, 134))
P("BunkerCeiling", CFrame.new(0, -0.5, -6), Vector3.new(6, 0.5, 8), Enum.Material.Concrete, Color3.fromRGB(130, 128, 120))
P("BunkerDoor", CFrame.new(0, -5, -8.3), Vector3.new(3.5, 6, 0.4), Enum.Material.Metal, Color3.fromRGB(70, 90, 70))
P("DoorWheel", CFrame.new(0.8, -5, -8.1), Vector3.new(1, 1, 0.2), Enum.Material.Metal, Color3.fromRGB(180, 50, 40))
local eLight = P("EmergencyLight", CFrame.new(0, -1, -4), Vector3.new(0.5, 0.3, 0.5), Enum.Material.Neon, Color3.fromRGB(255, 50, 50))
local el = Instance.new("PointLight"); el.Range = 15; el.Brightness = 0.8; el.Color = Color3.fromRGB(255, 80, 60); el.Parent = eLight`,
  },
  {
    title: 'Medieval Market Stall — wooden booth with awning and goods display',
    tags: ['market', 'stall', 'booth', 'medieval', 'shop', 'vendor', 'trade', 'merchant'],
    description: 'A wooden market stall with counter, fabric awning, support poles, and display shelves with goods. 14 parts.',
    code: `local folder = getFolder("MarketStall")
P("Counter", CFrame.new(0, 2, 0), Vector3.new(6, 3, 2), Enum.Material.WoodPlanks, Color3.fromRGB(140, 90, 45))
P("CounterTop", CFrame.new(0, 3.6, 0), Vector3.new(6.5, 0.3, 2.5), Enum.Material.Wood, Color3.fromRGB(150, 100, 50))
P("BackWall", CFrame.new(0, 3.5, -1.5), Vector3.new(6, 7, 0.4), Enum.Material.WoodPlanks, Color3.fromRGB(130, 82, 38))
P("PoleL", CFrame.new(-3.2, 4, 1.5), Vector3.new(0.4, 8, 0.4), Enum.Material.Wood, Color3.fromRGB(100, 62, 28))
P("PoleR", CFrame.new(3.2, 4, 1.5), Vector3.new(0.4, 8, 0.4), Enum.Material.Wood, Color3.fromRGB(100, 62, 28))
P("Awning", CFrame.new(0, 7.5, 0.5) * CFrame.Angles(math.rad(10), 0, 0), Vector3.new(7, 0.15, 4), Enum.Material.Fabric, Color3.fromRGB(180, 50, 50))
P("Shelf1", CFrame.new(0, 5, -1.2), Vector3.new(5.5, 0.2, 1), Enum.Material.Wood, Color3.fromRGB(120, 75, 35))
P("Shelf2", CFrame.new(0, 6.5, -1.2), Vector3.new(5.5, 0.2, 1), Enum.Material.Wood, Color3.fromRGB(120, 75, 35))
P("GoodsA", CFrame.new(-1.5, 5.5, -1.2), Vector3.new(1, 0.8, 0.8), Enum.Material.Fabric, Color3.fromRGB(200, 160, 60))
P("GoodsB", CFrame.new(0, 5.5, -1.2), Vector3.new(0.8, 0.8, 0.8), Enum.Material.Concrete, Color3.fromRGB(180, 80, 80))
P("GoodsC", CFrame.new(1.5, 5.5, -1.2), Vector3.new(1, 0.6, 0.8), Enum.Material.Wood, Color3.fromRGB(160, 100, 50))
P("GoodsD", CFrame.new(-1, 7, -1.2), Vector3.new(0.8, 0.8, 0.8), Enum.Material.Glass, Color3.fromRGB(100, 160, 200))
P("GoodsE", CFrame.new(1, 7, -1.2), Vector3.new(1, 0.8, 0.6), Enum.Material.Fabric, Color3.fromRGB(80, 140, 80))
P("SignBoard", CFrame.new(0, 8.5, 1.5), Vector3.new(4, 1.5, 0.2), Enum.Material.Wood, Color3.fromRGB(110, 68, 30))`,
  },
  {
    title: 'Space Station Module — sci-fi corridor section with windows and lights',
    tags: ['space', 'station', 'sci-fi', 'corridor', 'module', 'futuristic', 'spaceship'],
    description: 'A modular space station corridor: metal walls, floor panels, ceiling with strip lights, circular windows, airlock door. 18 parts. Tileable — place end-to-end for longer corridors.',
    code: `local folder = getFolder("SpaceStation")
P("Floor", CFrame.new(0, 0.25, 0), Vector3.new(8, 0.5, 20), Enum.Material.Metal, Color3.fromRGB(150, 155, 165))
P("FloorStripe", CFrame.new(0, 0.35, 0), Vector3.new(1, 0.1, 20), Enum.Material.Neon, Color3.fromRGB(80, 160, 255))
P("Ceiling", CFrame.new(0, 8, 0), Vector3.new(8, 0.5, 20), Enum.Material.Metal, Color3.fromRGB(140, 145, 155))
P("WallL", CFrame.new(-4, 4, 0), Vector3.new(0.5, 7.5, 20), Enum.Material.Metal, Color3.fromRGB(130, 135, 145))
P("WallR", CFrame.new(4, 4, 0), Vector3.new(0.5, 7.5, 20), Enum.Material.Metal, Color3.fromRGB(130, 135, 145))
P("WindowL1", CFrame.new(-4.1, 5, -5), Vector3.new(0.2, 2.5, 2.5), Enum.Material.Glass, Color3.fromRGB(30, 30, 50))
P("WindowL2", CFrame.new(-4.1, 5, 5), Vector3.new(0.2, 2.5, 2.5), Enum.Material.Glass, Color3.fromRGB(30, 30, 50))
P("WindowR1", CFrame.new(4.1, 5, -5), Vector3.new(0.2, 2.5, 2.5), Enum.Material.Glass, Color3.fromRGB(30, 30, 50))
P("WindowR2", CFrame.new(4.1, 5, 5), Vector3.new(0.2, 2.5, 2.5), Enum.Material.Glass, Color3.fromRGB(30, 30, 50))
P("WallPanelL", CFrame.new(-3.7, 2, 0), Vector3.new(0.1, 3, 18), Enum.Material.Metal, Color3.fromRGB(120, 125, 135))
P("WallPanelR", CFrame.new(3.7, 2, 0), Vector3.new(0.1, 3, 18), Enum.Material.Metal, Color3.fromRGB(120, 125, 135))
local light1 = P("CeilingLight1", CFrame.new(0, 7.6, -5), Vector3.new(1, 0.2, 1), Enum.Material.Neon, Color3.fromRGB(200, 220, 255))
local l1 = Instance.new("PointLight"); l1.Range = 18; l1.Brightness = 1; l1.Color = Color3.fromRGB(200, 220, 255); l1.Parent = light1
local light2 = P("CeilingLight2", CFrame.new(0, 7.6, 5), Vector3.new(1, 0.2, 1), Enum.Material.Neon, Color3.fromRGB(200, 220, 255))
local l2 = Instance.new("PointLight"); l2.Range = 18; l2.Brightness = 1; l2.Color = Color3.fromRGB(200, 220, 255); l2.Parent = light2
P("LightStrip", CFrame.new(0, 7.7, 0), Vector3.new(0.5, 0.1, 20), Enum.Material.Neon, Color3.fromRGB(180, 200, 240))
P("AirlockDoor", CFrame.new(0, 4, -10.3), Vector3.new(4, 7, 0.4), Enum.Material.Metal, Color3.fromRGB(100, 105, 115))
P("AirlockFrame", CFrame.new(0, 4, -10.1), Vector3.new(5, 7.5, 0.2), Enum.Material.Metal, Color3.fromRGB(80, 80, 90))
P("PipesL", CFrame.new(-3.5, 7, -8), Vector3.new(0.3, 0.3, 6), Enum.Material.Metal, Color3.fromRGB(160, 60, 60))
P("PipesR", CFrame.new(3.5, 7, 3), Vector3.new(0.3, 0.3, 8), Enum.Material.Metal, Color3.fromRGB(60, 160, 60))`,
  },
  {
    title: 'Swimming Pool — rectangular pool with deck, ladder, and diving board',
    tags: ['pool', 'swimming', 'water', 'recreation', 'summer', 'backyard', 'sports'],
    description: 'A rectangular swimming pool with tiled deck, pool water, ladder, diving board, and pool chairs. 16 parts.',
    code: `local folder = getFolder("SwimmingPool")
P("Deck", CFrame.new(0, 0.15, 0), Vector3.new(24, 0.3, 16), Enum.Material.Concrete, Color3.fromRGB(200, 195, 185))
P("PoolWalls", CFrame.new(0, -1.5, 0), Vector3.new(18, 3, 10), Enum.Material.Concrete, Color3.fromRGB(170, 210, 230))
P("PoolFloor", CFrame.new(0, -3.25, 0), Vector3.new(18, 0.5, 10), Enum.Material.Concrete, Color3.fromRGB(150, 200, 220))
P("Water", CFrame.new(0, -0.5, 0), Vector3.new(17.5, 2, 9.5), Enum.Material.Glass, Color3.fromRGB(60, 150, 210))
P("LadderRailL", CFrame.new(-8.5, 0.8, 3), Vector3.new(0.2, 2, 0.2), Enum.Material.Metal, Color3.fromRGB(190, 190, 195))
P("LadderRailR", CFrame.new(-8.5, 0.8, 4), Vector3.new(0.2, 2, 0.2), Enum.Material.Metal, Color3.fromRGB(190, 190, 195))
P("LadderRung1", CFrame.new(-8.5, 0, 3.5), Vector3.new(0.2, 0.15, 1), Enum.Material.Metal, Color3.fromRGB(180, 180, 185))
P("LadderRung2", CFrame.new(-8.5, -1, 3.5), Vector3.new(0.2, 0.15, 1), Enum.Material.Metal, Color3.fromRGB(180, 180, 185))
P("DivingBoardBase", CFrame.new(9, 0.5, 0), Vector3.new(1.5, 1, 1.5), Enum.Material.Concrete, Color3.fromRGB(180, 175, 168))
P("DivingBoard", CFrame.new(10.5, 1.2, 0), Vector3.new(4, 0.2, 1.5), Enum.Material.Metal, Color3.fromRGB(200, 200, 205))
P("Chair1Seat", CFrame.new(-10, 0.8, -5), Vector3.new(3, 0.2, 5), Enum.Material.Fabric, Color3.fromRGB(220, 220, 220))
P("Chair1Back", CFrame.new(-10, 1.5, -7.2) * CFrame.Angles(math.rad(-30), 0, 0), Vector3.new(3, 0.2, 3), Enum.Material.Fabric, Color3.fromRGB(220, 220, 220))
P("Chair2Seat", CFrame.new(10, 0.8, -5), Vector3.new(3, 0.2, 5), Enum.Material.Fabric, Color3.fromRGB(220, 220, 220))
P("Chair2Back", CFrame.new(10, 1.5, -7.2) * CFrame.Angles(math.rad(-30), 0, 0), Vector3.new(3, 0.2, 3), Enum.Material.Fabric, Color3.fromRGB(220, 220, 220))
P("Umbrella1Pole", CFrame.new(-10, 3.5, -5), Vector3.new(0.3, 5, 0.3), Enum.Material.Metal, Color3.fromRGB(180, 180, 185))
P("Umbrella1Top", CFrame.new(-10, 6, -5), Vector3.new(5, 0.3, 5), Enum.Material.Fabric, Color3.fromRGB(200, 60, 50))`,
  },
  {
    title: 'Basketball Court — court with hoops, lines, and bleachers',
    tags: ['basketball', 'court', 'sports', 'hoop', 'game', 'recreation', 'gym'],
    description: 'A basketball court with floor markings, 2 hoops with backboards, and small bleachers on one side. 20 parts.',
    code: `local folder = getFolder("BasketballCourt")
P("CourtFloor", CFrame.new(0, 0.1, 0), Vector3.new(50, 0.2, 28), Enum.Material.WoodPlanks, Color3.fromRGB(180, 140, 80))
P("CenterCircle", CFrame.new(0, 0.15, 0), Vector3.new(8, 0.05, 8), Enum.Material.Concrete, Color3.fromRGB(220, 220, 220))
P("CenterLine", CFrame.new(0, 0.15, 0), Vector3.new(0.3, 0.05, 28), Enum.Material.Concrete, Color3.fromRGB(220, 220, 220))
P("Hoop1Pole", CFrame.new(-23, 5, 0), Vector3.new(0.5, 10, 0.5), Enum.Material.Metal, Color3.fromRGB(150, 150, 155))
P("Hoop1Backboard", CFrame.new(-22, 9, 0), Vector3.new(0.3, 3, 4), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))
P("Hoop1Rim", CFrame.new(-21, 8, 0), Vector3.new(0.2, 0.2, 2), Enum.Material.Metal, Color3.fromRGB(230, 100, 30))
P("Hoop2Pole", CFrame.new(23, 5, 0), Vector3.new(0.5, 10, 0.5), Enum.Material.Metal, Color3.fromRGB(150, 150, 155))
P("Hoop2Backboard", CFrame.new(22, 9, 0), Vector3.new(0.3, 3, 4), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))
P("Hoop2Rim", CFrame.new(21, 8, 0), Vector3.new(0.2, 0.2, 2), Enum.Material.Metal, Color3.fromRGB(230, 100, 30))
P("ThreePointL", CFrame.new(-17, 0.15, 0), Vector3.new(0.2, 0.05, 18), Enum.Material.Concrete, Color3.fromRGB(220, 220, 220))
P("ThreePointR", CFrame.new(17, 0.15, 0), Vector3.new(0.2, 0.05, 18), Enum.Material.Concrete, Color3.fromRGB(220, 220, 220))
P("BleacherRow1", CFrame.new(0, 1, 16), Vector3.new(30, 1.5, 3), Enum.Material.Metal, Color3.fromRGB(60, 60, 120))
P("BleacherRow2", CFrame.new(0, 2.5, 19), Vector3.new(30, 1.5, 3), Enum.Material.Metal, Color3.fromRGB(55, 55, 115))
P("BleacherRow3", CFrame.new(0, 4, 22), Vector3.new(30, 1.5, 3), Enum.Material.Metal, Color3.fromRGB(50, 50, 110))
P("BleacherSeat1", CFrame.new(0, 2, 16), Vector3.new(30, 0.2, 2.5), Enum.Material.WoodPlanks, Color3.fromRGB(160, 120, 70))
P("BleacherSeat2", CFrame.new(0, 3.5, 19), Vector3.new(30, 0.2, 2.5), Enum.Material.WoodPlanks, Color3.fromRGB(160, 120, 70))
P("BleacherSeat3", CFrame.new(0, 5, 22), Vector3.new(30, 0.2, 2.5), Enum.Material.WoodPlanks, Color3.fromRGB(160, 120, 70))
P("Boundary", CFrame.new(0, 0.15, -14), Vector3.new(50, 0.05, 0.2), Enum.Material.Concrete, Color3.fromRGB(220, 220, 220))
P("BoundaryFar", CFrame.new(0, 0.15, 14), Vector3.new(50, 0.05, 0.2), Enum.Material.Concrete, Color3.fromRGB(220, 220, 220))
P("BoundaryL", CFrame.new(-25, 0.15, 0), Vector3.new(0.2, 0.05, 28), Enum.Material.Concrete, Color3.fromRGB(220, 220, 220))`,
  },
]
