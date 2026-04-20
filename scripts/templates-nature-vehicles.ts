import { BuildTemplate } from './build-template-chunks'

export const NATURE_VEHICLE_TEMPLATES: BuildTemplate[] = [

  // ═══════════════════════════════════════════════════════════════════
  // NATURE (20 templates)
  // ═══════════════════════════════════════════════════════════════════

  {
    title: 'Oak Tree — wide canopy with thick trunk and root flare',
    tags: ['tree', 'oak', 'nature', 'foliage'],
    description: 'A 20-stud-tall oak tree with a thick brown trunk, visible root flare at the base, and a wide multi-sphere green canopy. 8 parts.',
    code: `local folder = getFolder("OakTree")

P("Trunk", CFrame.new(0, 5, 0), Vector3.new(3, 10, 3), Enum.Material.Wood, Color3.fromRGB(100, 65, 30))
P("RootFlare", CFrame.new(0, 0.75, 0), Vector3.new(5, 1.5, 5), Enum.Material.Wood, Color3.fromRGB(90, 58, 25))
P("CanopyCenter", CFrame.new(0, 13, 0), Vector3.new(12, 8, 12), Enum.Material.Grass, Color3.fromRGB(50, 120, 40))
P("CanopyLeft", CFrame.new(-5, 12, 0), Vector3.new(8, 7, 8), Enum.Material.Grass, Color3.fromRGB(55, 130, 45))
P("CanopyRight", CFrame.new(5, 12, 0), Vector3.new(8, 7, 8), Enum.Material.Grass, Color3.fromRGB(45, 115, 38))
P("CanopyFront", CFrame.new(0, 12, 5), Vector3.new(8, 7, 8), Enum.Material.Grass, Color3.fromRGB(48, 125, 42))
P("CanopyBack", CFrame.new(0, 13, -5), Vector3.new(8, 6, 8), Enum.Material.Grass, Color3.fromRGB(52, 118, 40))
P("CanopyTop", CFrame.new(0, 16, 0), Vector3.new(7, 5, 7), Enum.Material.Grass, Color3.fromRGB(58, 135, 48))`,
  },

  {
    title: 'Pine Tree — tall triangular evergreen',
    tags: ['tree', 'pine', 'evergreen', 'nature', 'forest'],
    description: 'A 24-stud-tall pine tree with narrow triangular foliage layers stacked on a slim trunk. 6 parts.',
    code: `local folder = getFolder("PineTree")

P("Trunk", CFrame.new(0, 4, 0), Vector3.new(2, 8, 2), Enum.Material.Wood, Color3.fromRGB(90, 55, 25))
P("FoliageBottom", CFrame.new(0, 9, 0), Vector3.new(10, 4, 10), Enum.Material.Grass, Color3.fromRGB(30, 85, 30))
P("FoliageMid", CFrame.new(0, 13, 0), Vector3.new(7, 4, 7), Enum.Material.Grass, Color3.fromRGB(35, 95, 35))
P("FoliageUpper", CFrame.new(0, 17, 0), Vector3.new(5, 4, 5), Enum.Material.Grass, Color3.fromRGB(38, 100, 38))
P("FoliageTop", CFrame.new(0, 20.5, 0), Vector3.new(3, 3, 3), Enum.Material.Grass, Color3.fromRGB(40, 105, 40))
P("TrunkBase", CFrame.new(0, 0.5, 0), Vector3.new(3, 1, 3), Enum.Material.Wood, Color3.fromRGB(85, 50, 22))`,
  },

  {
    title: 'Palm Tree — curved trunk with fronds',
    tags: ['tree', 'palm', 'tropical', 'nature', 'beach'],
    description: 'A 22-stud-tall palm tree with a slightly curved trunk and wide frond leaves at the top. 8 parts.',
    code: `local folder = getFolder("PalmTree")

P("TrunkLower", CFrame.new(0, 3, 0), Vector3.new(2.5, 6, 2.5), Enum.Material.Wood, Color3.fromRGB(140, 110, 60))
P("TrunkMid", CFrame.new(0.5, 9, 0), Vector3.new(2, 6, 2), Enum.Material.Wood, Color3.fromRGB(135, 105, 55))
P("TrunkUpper", CFrame.new(1, 15, 0), Vector3.new(1.8, 6, 1.8), Enum.Material.Wood, Color3.fromRGB(130, 100, 50))
P("FrondCenter", CFrame.new(1, 18.5, 0), Vector3.new(3, 2, 3), Enum.Material.Grass, Color3.fromRGB(60, 140, 40))
P("FrondN", CFrame.new(1, 18, -4) * CFrame.Angles(math.rad(25), 0, 0), Vector3.new(2, 0.3, 8), Enum.Material.Grass, Color3.fromRGB(55, 135, 38))
P("FrondS", CFrame.new(1, 18, 4) * CFrame.Angles(math.rad(-25), 0, 0), Vector3.new(2, 0.3, 8), Enum.Material.Grass, Color3.fromRGB(55, 135, 38))
P("FrondE", CFrame.new(5, 18, 0) * CFrame.Angles(0, 0, math.rad(-25)), Vector3.new(8, 0.3, 2), Enum.Material.Grass, Color3.fromRGB(58, 138, 40))
P("FrondW", CFrame.new(-3, 18, 0) * CFrame.Angles(0, 0, math.rad(25)), Vector3.new(8, 0.3, 2), Enum.Material.Grass, Color3.fromRGB(58, 138, 40))`,
  },

  {
    title: 'Cherry Blossom Tree — pink canopy layers',
    tags: ['tree', 'cherry', 'blossom', 'nature', 'japanese', 'pink'],
    description: 'A 18-stud-tall cherry blossom tree with a dark trunk and layered pink canopy. 7 parts.',
    code: `local folder = getFolder("CherryBlossomTree")

P("Trunk", CFrame.new(0, 4, 0), Vector3.new(2.5, 8, 2.5), Enum.Material.Wood, Color3.fromRGB(60, 35, 20))
P("Branch1", CFrame.new(-3, 9, 0) * CFrame.Angles(0, 0, math.rad(30)), Vector3.new(6, 1.2, 1.2), Enum.Material.Wood, Color3.fromRGB(55, 32, 18))
P("Branch2", CFrame.new(3, 10, 1) * CFrame.Angles(0, 0, math.rad(-25)), Vector3.new(5, 1, 1), Enum.Material.Wood, Color3.fromRGB(55, 32, 18))
P("CanopyCenter", CFrame.new(0, 13, 0), Vector3.new(11, 6, 11), Enum.Material.Grass, Color3.fromRGB(240, 150, 170))
P("CanopyLeft", CFrame.new(-5, 12, 0), Vector3.new(7, 5, 7), Enum.Material.Grass, Color3.fromRGB(245, 160, 180))
P("CanopyRight", CFrame.new(5, 12.5, 1), Vector3.new(7, 5, 7), Enum.Material.Grass, Color3.fromRGB(235, 145, 165))
P("CanopyTop", CFrame.new(0, 16, 0), Vector3.new(6, 4, 6), Enum.Material.Grass, Color3.fromRGB(250, 170, 190))`,
  },

  {
    title: 'Dead Tree — bare branches, no leaves',
    tags: ['tree', 'dead', 'nature', 'spooky', 'halloween'],
    description: 'A 16-stud-tall dead tree with a gnarled trunk and bare branches. 7 parts.',
    code: `local folder = getFolder("DeadTree")

P("Trunk", CFrame.new(0, 4.5, 0), Vector3.new(2.5, 9, 2.5), Enum.Material.Wood, Color3.fromRGB(70, 50, 30))
P("TrunkBase", CFrame.new(0, 0.5, 0), Vector3.new(4, 1, 4), Enum.Material.Wood, Color3.fromRGB(65, 45, 28))
P("BranchA", CFrame.new(-3, 11, 0) * CFrame.Angles(0, 0, math.rad(40)), Vector3.new(7, 1, 1), Enum.Material.Wood, Color3.fromRGB(65, 45, 28))
P("BranchB", CFrame.new(2.5, 12, 1) * CFrame.Angles(0, math.rad(20), math.rad(-35)), Vector3.new(6, 0.8, 0.8), Enum.Material.Wood, Color3.fromRGB(60, 42, 25))
P("BranchC", CFrame.new(0, 13, -2) * CFrame.Angles(math.rad(30), 0, math.rad(10)), Vector3.new(5, 0.7, 0.7), Enum.Material.Wood, Color3.fromRGB(60, 42, 25))
P("TwigA", CFrame.new(-5.5, 13, 0.5) * CFrame.Angles(0, 0, math.rad(55)), Vector3.new(3, 0.4, 0.4), Enum.Material.Wood, Color3.fromRGB(58, 40, 22))
P("TwigB", CFrame.new(4.5, 14, 1.5) * CFrame.Angles(0, 0, math.rad(-50)), Vector3.new(3, 0.4, 0.4), Enum.Material.Wood, Color3.fromRGB(58, 40, 22))`,
  },

  {
    title: 'Bush — overlapping green spheres',
    tags: ['bush', 'shrub', 'nature', 'foliage', 'garden'],
    description: 'A bush made of 3 overlapping green spheres on the ground. 4 parts.',
    code: `local folder = getFolder("Bush")

P("Core", CFrame.new(0, 2, 0), Vector3.new(4, 4, 4), Enum.Material.Grass, Color3.fromRGB(45, 110, 35))
P("Left", CFrame.new(-1.5, 1.8, 0.8), Vector3.new(3.5, 3.5, 3.5), Enum.Material.Grass, Color3.fromRGB(50, 120, 40))
P("Right", CFrame.new(1.5, 1.8, -0.5), Vector3.new(3.5, 3.5, 3.5), Enum.Material.Grass, Color3.fromRGB(40, 105, 32))
P("Top", CFrame.new(0, 3.2, 0), Vector3.new(2.5, 2.5, 2.5), Enum.Material.Grass, Color3.fromRGB(55, 130, 45))`,
  },

  {
    title: 'Flower Bed — rectangular dirt with colorful flowers',
    tags: ['flower', 'garden', 'nature', 'decoration'],
    description: 'A rectangular dirt bed with 5 colorful flowers. 8 parts.',
    code: `local folder = getFolder("FlowerBed")

P("DirtBed", CFrame.new(0, 0.25, 0), Vector3.new(8, 0.5, 4), Enum.Material.Grass, Color3.fromRGB(100, 70, 40))
P("Border", CFrame.new(0, 0.4, 0), Vector3.new(8.5, 0.3, 4.5), Enum.Material.Wood, Color3.fromRGB(80, 55, 30))
P("FlowerRed", CFrame.new(-2.5, 1.2, 0), Vector3.new(1, 1, 1), Enum.Material.Grass, Color3.fromRGB(220, 40, 40))
P("StemRed", CFrame.new(-2.5, 0.6, 0), Vector3.new(0.2, 0.7, 0.2), Enum.Material.Grass, Color3.fromRGB(40, 100, 30))
P("FlowerYellow", CFrame.new(0, 1.4, 0.5), Vector3.new(1.2, 1.2, 1.2), Enum.Material.Grass, Color3.fromRGB(240, 220, 50))
P("StemYellow", CFrame.new(0, 0.65, 0.5), Vector3.new(0.2, 0.8, 0.2), Enum.Material.Grass, Color3.fromRGB(40, 100, 30))
P("FlowerPurple", CFrame.new(2.5, 1.1, -0.3), Vector3.new(1, 1, 1), Enum.Material.Grass, Color3.fromRGB(160, 50, 200))
P("StemPurple", CFrame.new(2.5, 0.55, -0.3), Vector3.new(0.2, 0.6, 0.2), Enum.Material.Grass, Color3.fromRGB(40, 100, 30))`,
  },

  {
    title: 'Cactus — tall trunk with two arms',
    tags: ['cactus', 'desert', 'nature', 'plant'],
    description: 'A 12-stud-tall cactus with a main trunk and two arms. 5 parts.',
    code: `local folder = getFolder("Cactus")

P("Trunk", CFrame.new(0, 6, 0), Vector3.new(2.5, 12, 2.5), Enum.Material.Grass, Color3.fromRGB(60, 130, 50))
P("TrunkTop", CFrame.new(0, 12.25, 0), Vector3.new(2.8, 0.5, 2.8), Enum.Material.Grass, Color3.fromRGB(55, 120, 45))
P("ArmRightVert", CFrame.new(2.5, 8, 0), Vector3.new(1.8, 5, 1.8), Enum.Material.Grass, Color3.fromRGB(58, 125, 48))
P("ArmRightHoriz", CFrame.new(1.5, 5.5, 0), Vector3.new(3.5, 1.8, 1.8), Enum.Material.Grass, Color3.fromRGB(58, 125, 48))
P("ArmLeftVert", CFrame.new(-2.5, 7, 0), Vector3.new(1.8, 4, 1.8), Enum.Material.Grass, Color3.fromRGB(55, 122, 45))`,
  },

  {
    title: 'Mushroom — large fantasy mushroom',
    tags: ['mushroom', 'fantasy', 'nature', 'magic'],
    description: 'A large fantasy mushroom with a thick white stem and a wide red spotted cap. 6 parts.',
    code: `local folder = getFolder("Mushroom")

P("Stem", CFrame.new(0, 4, 0), Vector3.new(3, 8, 3), Enum.Material.Concrete, Color3.fromRGB(230, 220, 200))
P("StemBase", CFrame.new(0, 0.5, 0), Vector3.new(4, 1, 4), Enum.Material.Concrete, Color3.fromRGB(220, 210, 190))
P("CapMain", CFrame.new(0, 9, 0), Vector3.new(10, 3, 10), Enum.Material.Grass, Color3.fromRGB(200, 30, 30))
P("CapTop", CFrame.new(0, 10.5, 0), Vector3.new(7, 2, 7), Enum.Material.Grass, Color3.fromRGB(210, 40, 40))
P("SpotA", CFrame.new(-2, 10.2, 2), Vector3.new(1.5, 0.5, 1.5), Enum.Material.Concrete, Color3.fromRGB(250, 245, 240))
P("SpotB", CFrame.new(2, 10.2, -1), Vector3.new(1.2, 0.5, 1.2), Enum.Material.Concrete, Color3.fromRGB(250, 245, 240))`,
  },

  {
    title: 'Rock Formation — 3 irregular rocks clustered',
    tags: ['rock', 'stone', 'nature', 'terrain'],
    description: 'A cluster of 3 irregular-sized rocks on the ground. 4 parts.',
    code: `local folder = getFolder("RockFormation")

P("RockLarge", CFrame.new(0, 2, 0) * CFrame.Angles(0, math.rad(15), math.rad(5)), Vector3.new(5, 4, 4.5), Enum.Material.Slate, Color3.fromRGB(120, 115, 110))
P("RockMedium", CFrame.new(3, 1.5, 1) * CFrame.Angles(0, math.rad(-20), math.rad(-8)), Vector3.new(3.5, 3, 3), Enum.Material.Slate, Color3.fromRGB(130, 125, 118))
P("RockSmall", CFrame.new(-2, 1, 2) * CFrame.Angles(0, math.rad(40), 0), Vector3.new(2.5, 2, 2), Enum.Material.Slate, Color3.fromRGB(110, 105, 100))
P("Pebble", CFrame.new(1.5, 0.4, 3), Vector3.new(1.2, 0.8, 1), Enum.Material.Slate, Color3.fromRGB(140, 135, 128))`,
  },

  {
    title: 'Fallen Log — tree trunk on the ground',
    tags: ['log', 'nature', 'forest', 'fallen'],
    description: 'A fallen tree trunk lying on the ground with bark texture. 4 parts.',
    code: `local folder = getFolder("FallenLog")

P("LogMain", CFrame.new(0, 1.2, 0) * CFrame.Angles(0, math.rad(10), 0), Vector3.new(12, 2.4, 2.4), Enum.Material.Wood, Color3.fromRGB(85, 55, 28))
P("LogEndA", CFrame.new(-6.2, 1.2, 0), Vector3.new(0.5, 2.2, 2.2), Enum.Material.Wood, Color3.fromRGB(110, 80, 50))
P("LogEndB", CFrame.new(6.2, 1.2, 0), Vector3.new(0.5, 2.2, 2.2), Enum.Material.Wood, Color3.fromRGB(110, 80, 50))
P("BrokenBranch", CFrame.new(2, 2.2, 0.5) * CFrame.Angles(0, 0, math.rad(35)), Vector3.new(3, 0.6, 0.6), Enum.Material.Wood, Color3.fromRGB(80, 50, 25))`,
  },

  {
    title: 'Tree Stump — cut tree base',
    tags: ['stump', 'tree', 'nature', 'forest'],
    description: 'A cut tree stump with visible rings on top. 4 parts.',
    code: `local folder = getFolder("TreeStump")

P("StumpBody", CFrame.new(0, 1.5, 0), Vector3.new(4, 3, 4), Enum.Material.Wood, Color3.fromRGB(90, 60, 30))
P("StumpTop", CFrame.new(0, 3.05, 0), Vector3.new(4.2, 0.1, 4.2), Enum.Material.WoodPlanks, Color3.fromRGB(120, 85, 50))
P("RootA", CFrame.new(-2.5, 0.4, 0) * CFrame.Angles(0, 0, math.rad(20)), Vector3.new(3, 0.8, 1.2), Enum.Material.Wood, Color3.fromRGB(80, 55, 28))
P("RootB", CFrame.new(1, 0.4, 2.2) * CFrame.Angles(0, math.rad(50), math.rad(-15)), Vector3.new(3, 0.8, 1), Enum.Material.Wood, Color3.fromRGB(80, 55, 28))`,
  },

  {
    title: 'Pond — dug-out area with water and rocks',
    tags: ['pond', 'water', 'nature', 'lake'],
    description: 'A small pond with water surface, surrounding dirt rim, and scattered rocks. 7 parts.',
    code: `local folder = getFolder("Pond")

P("PondBasin", CFrame.new(0, -0.5, 0), Vector3.new(12, 1, 10), Enum.Material.Slate, Color3.fromRGB(80, 70, 55))
P("WaterSurface", CFrame.new(0, 0.05, 0), Vector3.new(10, 0.1, 8), Enum.Material.Glass, Color3.fromRGB(50, 120, 180))
P("DirtRim", CFrame.new(0, 0.15, 0), Vector3.new(13, 0.3, 11), Enum.Material.Grass, Color3.fromRGB(90, 65, 35))
P("RockA", CFrame.new(-5, 0.6, 3), Vector3.new(2, 1.2, 1.8), Enum.Material.Slate, Color3.fromRGB(125, 120, 115))
P("RockB", CFrame.new(4.5, 0.5, -3.5), Vector3.new(1.8, 1, 1.5), Enum.Material.Slate, Color3.fromRGB(115, 110, 105))
P("RockC", CFrame.new(2, 0.4, 4.5), Vector3.new(1.2, 0.8, 1), Enum.Material.Slate, Color3.fromRGB(130, 125, 118))
P("Lily", CFrame.new(-1, 0.15, 1), Vector3.new(1.5, 0.1, 1.5), Enum.Material.Grass, Color3.fromRGB(50, 130, 50))`,
  },

  {
    title: 'Waterfall — cliff with water cascade and pool',
    tags: ['waterfall', 'water', 'nature', 'cliff'],
    description: 'A rocky cliff face with cascading water and a pool at the base. 9 parts.',
    code: `local folder = getFolder("Waterfall")

P("CliffFace", CFrame.new(0, 8, -3), Vector3.new(12, 16, 4), Enum.Material.Slate, Color3.fromRGB(100, 95, 88))
P("CliffTop", CFrame.new(0, 16.25, -3), Vector3.new(14, 0.5, 6), Enum.Material.Grass, Color3.fromRGB(60, 110, 40))
P("WaterStream", CFrame.new(0, 8, -0.8), Vector3.new(4, 16, 0.4), Enum.Material.Glass, Color3.fromRGB(70, 150, 220))
P("MistBottom", CFrame.new(0, 0.5, 0), Vector3.new(6, 1, 4), Enum.Material.Glass, Color3.fromRGB(200, 220, 240))
P("Pool", CFrame.new(0, -0.25, 3), Vector3.new(10, 0.5, 6), Enum.Material.Glass, Color3.fromRGB(50, 120, 180))
P("PoolBasin", CFrame.new(0, -0.75, 3), Vector3.new(12, 0.5, 8), Enum.Material.Slate, Color3.fromRGB(80, 75, 68))
P("RockLeft", CFrame.new(-5, 2, 0), Vector3.new(3, 4, 3), Enum.Material.Slate, Color3.fromRGB(110, 105, 98))
P("RockRight", CFrame.new(5, 1.5, 1), Vector3.new(2.5, 3, 2.5), Enum.Material.Slate, Color3.fromRGB(105, 100, 93))
P("Ledge", CFrame.new(0, 16, -0.5), Vector3.new(5, 0.5, 2), Enum.Material.Slate, Color3.fromRGB(95, 90, 83))`,
  },

  {
    title: 'Campfire — ring of stones with logs and fire glow',
    tags: ['campfire', 'fire', 'nature', 'camping'],
    description: 'A campfire with a stone ring, crossed logs, and a glowing fire. 10 parts.',
    code: `local folder = getFolder("Campfire")

P("StoneA", CFrame.new(2, 0.4, 0), Vector3.new(1.2, 0.8, 1.2), Enum.Material.Slate, Color3.fromRGB(120, 115, 110))
P("StoneB", CFrame.new(1.4, 0.4, 1.4), Vector3.new(1.2, 0.8, 1.2), Enum.Material.Slate, Color3.fromRGB(115, 110, 105))
P("StoneC", CFrame.new(0, 0.4, 2), Vector3.new(1.2, 0.8, 1.2), Enum.Material.Slate, Color3.fromRGB(125, 118, 112))
P("StoneD", CFrame.new(-1.4, 0.4, 1.4), Vector3.new(1.2, 0.8, 1.2), Enum.Material.Slate, Color3.fromRGB(118, 112, 108))
P("StoneE", CFrame.new(-2, 0.4, 0), Vector3.new(1.2, 0.8, 1.2), Enum.Material.Slate, Color3.fromRGB(122, 116, 110))
P("StoneF", CFrame.new(-1.4, 0.4, -1.4), Vector3.new(1.2, 0.8, 1.2), Enum.Material.Slate, Color3.fromRGB(110, 108, 102))
P("StoneG", CFrame.new(0, 0.4, -2), Vector3.new(1.2, 0.8, 1.2), Enum.Material.Slate, Color3.fromRGB(128, 122, 115))
P("StoneH", CFrame.new(1.4, 0.4, -1.4), Vector3.new(1.2, 0.8, 1.2), Enum.Material.Slate, Color3.fromRGB(112, 108, 103))
P("LogA", CFrame.new(0, 0.4, 0) * CFrame.Angles(0, math.rad(30), 0), Vector3.new(3, 0.6, 0.6), Enum.Material.Wood, Color3.fromRGB(70, 45, 20))
P("LogB", CFrame.new(0, 0.4, 0) * CFrame.Angles(0, math.rad(-30), 0), Vector3.new(3, 0.6, 0.6), Enum.Material.Wood, Color3.fromRGB(65, 40, 18))

local fireGlow = Instance.new("PointLight")
fireGlow.Range = 18  fireGlow.Brightness = 1.2
fireGlow.Color = Color3.fromRGB(255, 160, 50)
fireGlow.Parent = P("FireCore", CFrame.new(0, 1.2, 0), Vector3.new(1.5, 2, 1.5), Enum.Material.Neon, Color3.fromRGB(255, 120, 20))`,
  },

  {
    title: 'Fence Section — 2 posts and 2 rails, 8 studs long',
    tags: ['fence', 'barrier', 'nature', 'garden', 'farm'],
    description: 'A wooden fence section with 2 posts and 2 horizontal rails spanning 8 studs. 4 parts.',
    code: `local folder = getFolder("FenceSection")

P("PostLeft", CFrame.new(-4, 2.5, 0), Vector3.new(0.8, 5, 0.8), Enum.Material.Wood, Color3.fromRGB(110, 75, 40))
P("PostRight", CFrame.new(4, 2.5, 0), Vector3.new(0.8, 5, 0.8), Enum.Material.Wood, Color3.fromRGB(110, 75, 40))
P("RailTop", CFrame.new(0, 4, 0), Vector3.new(8, 0.5, 0.4), Enum.Material.Wood, Color3.fromRGB(120, 82, 45))
P("RailBottom", CFrame.new(0, 2, 0), Vector3.new(8, 0.5, 0.4), Enum.Material.Wood, Color3.fromRGB(120, 82, 45))`,
  },

  {
    title: 'Stone Wall Section — rough stone, 10 studs long',
    tags: ['wall', 'stone', 'nature', 'medieval', 'barrier'],
    description: 'A rough stone wall section, 10 studs long and 5 studs tall. 5 parts.',
    code: `local folder = getFolder("StoneWallSection")

P("WallBase", CFrame.new(0, 1.5, 0), Vector3.new(10, 3, 2), Enum.Material.Cobblestone, Color3.fromRGB(130, 125, 118))
P("WallTop", CFrame.new(0, 3.75, 0), Vector3.new(10, 1.5, 1.8), Enum.Material.Cobblestone, Color3.fromRGB(125, 120, 112))
P("CapStoneA", CFrame.new(-3, 4.75, 0), Vector3.new(3, 0.5, 2.2), Enum.Material.Slate, Color3.fromRGB(140, 135, 128))
P("CapStoneB", CFrame.new(1, 4.75, 0), Vector3.new(4, 0.5, 2.2), Enum.Material.Slate, Color3.fromRGB(135, 130, 122))
P("CapStoneC", CFrame.new(4.5, 4.75, 0), Vector3.new(2.5, 0.5, 2.2), Enum.Material.Slate, Color3.fromRGB(138, 132, 125))`,
  },

  {
    title: 'Hedge — trimmed rectangular shrub',
    tags: ['hedge', 'garden', 'nature', 'topiary'],
    description: 'A neatly trimmed rectangular hedge. 3 parts.',
    code: `local folder = getFolder("Hedge")

P("HedgeBody", CFrame.new(0, 2.5, 0), Vector3.new(6, 5, 3), Enum.Material.Grass, Color3.fromRGB(40, 100, 30))
P("HedgeTop", CFrame.new(0, 5.15, 0), Vector3.new(6.2, 0.3, 3.2), Enum.Material.Grass, Color3.fromRGB(45, 110, 35))
P("DirtBase", CFrame.new(0, 0.15, 0), Vector3.new(6.5, 0.3, 3.5), Enum.Material.Grass, Color3.fromRGB(85, 60, 30))`,
  },

  {
    title: 'Garden Path — stepping stones in grass',
    tags: ['path', 'garden', 'nature', 'walkway'],
    description: 'A garden path with 4 stepping stones on a grass strip. 5 parts.',
    code: `local folder = getFolder("GardenPath")

P("GrassStrip", CFrame.new(0, 0.05, 0), Vector3.new(10, 0.1, 4), Enum.Material.Grass, Color3.fromRGB(60, 120, 40))
P("StoneA", CFrame.new(-3, 0.15, 0.3) * CFrame.Angles(0, math.rad(10), 0), Vector3.new(2, 0.2, 2), Enum.Material.Slate, Color3.fromRGB(170, 165, 158))
P("StoneB", CFrame.new(-1, 0.15, -0.4) * CFrame.Angles(0, math.rad(-15), 0), Vector3.new(1.8, 0.2, 1.8), Enum.Material.Slate, Color3.fromRGB(165, 160, 152))
P("StoneC", CFrame.new(1.2, 0.15, 0.2) * CFrame.Angles(0, math.rad(5), 0), Vector3.new(2.2, 0.2, 2), Enum.Material.Slate, Color3.fromRGB(175, 168, 160))
P("StoneD", CFrame.new(3.5, 0.15, -0.2) * CFrame.Angles(0, math.rad(-8), 0), Vector3.new(1.8, 0.2, 2), Enum.Material.Slate, Color3.fromRGB(160, 155, 148))`,
  },

  {
    title: 'Bird Nest — small nest sitting in tree fork',
    tags: ['nest', 'bird', 'nature', 'animal'],
    description: 'A small bird nest with twigs and eggs. 5 parts.',
    code: `local folder = getFolder("BirdNest")

P("NestBase", CFrame.new(0, 0.4, 0), Vector3.new(2.5, 0.8, 2.5), Enum.Material.Wood, Color3.fromRGB(100, 70, 35))
P("NestRim", CFrame.new(0, 0.9, 0), Vector3.new(3, 0.4, 3), Enum.Material.Wood, Color3.fromRGB(95, 65, 32))
P("EggA", CFrame.new(-0.4, 1, 0.2), Vector3.new(0.5, 0.6, 0.5), Enum.Material.Concrete, Color3.fromRGB(220, 225, 230))
P("EggB", CFrame.new(0.3, 1, -0.2), Vector3.new(0.5, 0.6, 0.5), Enum.Material.Concrete, Color3.fromRGB(215, 220, 225))
P("EggC", CFrame.new(0, 1, 0.5), Vector3.new(0.5, 0.6, 0.5), Enum.Material.Concrete, Color3.fromRGB(225, 228, 232))`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // VEHICLES (15 templates)
  // ═══════════════════════════════════════════════════════════════════

  {
    title: 'Pickup Truck — cab, bed, and 4 wheels',
    tags: ['truck', 'pickup', 'vehicle', 'car'],
    description: 'A pickup truck with cab, cargo bed, hood, and 4 wheels. 12 parts.',
    code: `local folder = getFolder("PickupTruck")

P("Chassis", CFrame.new(0, 1.5, 0), Vector3.new(6, 1, 14), Enum.Material.Metal, Color3.fromRGB(40, 40, 45))
P("Hood", CFrame.new(0, 2.5, 4.5), Vector3.new(6, 1.5, 4), Enum.Material.Metal, Color3.fromRGB(180, 30, 30))
P("Cab", CFrame.new(0, 4, 1.5), Vector3.new(6, 3, 4), Enum.Material.Metal, Color3.fromRGB(180, 30, 30))
P("Windshield", CFrame.new(0, 4, 3.6), Vector3.new(5, 2.2, 0.2), Enum.Material.Glass, Color3.fromRGB(180, 210, 230))
P("RearWindow", CFrame.new(0, 4, -0.6), Vector3.new(5, 2.2, 0.2), Enum.Material.Glass, Color3.fromRGB(180, 210, 230))
P("Bed", CFrame.new(0, 2.5, -4), Vector3.new(6, 1.5, 5), Enum.Material.Metal, Color3.fromRGB(170, 25, 25))
P("BedFloor", CFrame.new(0, 2, -4), Vector3.new(5.5, 0.3, 4.5), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))
P("Tailgate", CFrame.new(0, 2.5, -6.5), Vector3.new(6, 1.5, 0.3), Enum.Material.Metal, Color3.fromRGB(170, 25, 25))
P("WheelFL", CFrame.new(-3.2, 1.2, 4) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(2.4, 0.8, 2.4), Enum.Material.Concrete, Color3.fromRGB(30, 30, 30))
P("WheelFR", CFrame.new(3.2, 1.2, 4) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(2.4, 0.8, 2.4), Enum.Material.Concrete, Color3.fromRGB(30, 30, 30))
P("WheelRL", CFrame.new(-3.2, 1.2, -4) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(2.4, 0.8, 2.4), Enum.Material.Concrete, Color3.fromRGB(30, 30, 30))
P("WheelRR", CFrame.new(3.2, 1.2, -4) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(2.4, 0.8, 2.4), Enum.Material.Concrete, Color3.fromRGB(30, 30, 30))`,
  },

  {
    title: 'Bus — long body with windows and wheels',
    tags: ['bus', 'vehicle', 'transport', 'public'],
    description: 'A long yellow school-style bus with windows and 4 wheels. 10 parts.',
    code: `local folder = getFolder("Bus")

P("Body", CFrame.new(0, 3.5, 0), Vector3.new(7, 5, 20), Enum.Material.Metal, Color3.fromRGB(220, 180, 30))
P("Roof", CFrame.new(0, 6.25, 0), Vector3.new(7.2, 0.5, 20.2), Enum.Material.Metal, Color3.fromRGB(210, 170, 25))
P("Chassis", CFrame.new(0, 0.75, 0), Vector3.new(6.5, 1.5, 20), Enum.Material.Metal, Color3.fromRGB(40, 40, 45))
P("FrontBumper", CFrame.new(0, 1.5, 10.3), Vector3.new(7, 1.5, 0.6), Enum.Material.Metal, Color3.fromRGB(180, 180, 180))
P("WindowsLeft", CFrame.new(-3.55, 4, 0), Vector3.new(0.2, 2.5, 16), Enum.Material.Glass, Color3.fromRGB(180, 210, 230))
P("WindowsRight", CFrame.new(3.55, 4, 0), Vector3.new(0.2, 2.5, 16), Enum.Material.Glass, Color3.fromRGB(180, 210, 230))
P("Windshield", CFrame.new(0, 4, 10.1), Vector3.new(6, 3, 0.2), Enum.Material.Glass, Color3.fromRGB(180, 210, 230))
P("WheelFL", CFrame.new(-3.5, 1.2, 7) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(2.4, 1, 2.4), Enum.Material.Concrete, Color3.fromRGB(30, 30, 30))
P("WheelFR", CFrame.new(3.5, 1.2, 7) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(2.4, 1, 2.4), Enum.Material.Concrete, Color3.fromRGB(30, 30, 30))
P("WheelRL", CFrame.new(-3.5, 1.2, -7) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(2.4, 1, 2.4), Enum.Material.Concrete, Color3.fromRGB(30, 30, 30))`,
  },

  {
    title: 'Motorcycle — frame, 2 wheels, handlebars, seat',
    tags: ['motorcycle', 'bike', 'vehicle'],
    description: 'A motorcycle with frame, 2 wheels, handlebars, seat, and engine block. 8 parts.',
    code: `local folder = getFolder("Motorcycle")

P("Frame", CFrame.new(0, 2, 0), Vector3.new(1.2, 1, 5), Enum.Material.Metal, Color3.fromRGB(30, 30, 35))
P("FrontWheel", CFrame.new(0, 1.2, 2.5) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(2.4, 0.6, 2.4), Enum.Material.Concrete, Color3.fromRGB(25, 25, 25))
P("RearWheel", CFrame.new(0, 1.2, -2.5) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(2.4, 0.6, 2.4), Enum.Material.Concrete, Color3.fromRGB(25, 25, 25))
P("FrontFork", CFrame.new(0, 2.5, 2.5) * CFrame.Angles(math.rad(-15), 0, 0), Vector3.new(0.4, 3, 0.4), Enum.Material.Metal, Color3.fromRGB(180, 180, 185))
P("Handlebars", CFrame.new(0, 3.8, 2.2), Vector3.new(2.5, 0.3, 0.3), Enum.Material.Metal, Color3.fromRGB(180, 180, 185))
P("Seat", CFrame.new(0, 2.8, -0.5), Vector3.new(1, 0.5, 2.5), Enum.Material.Fabric, Color3.fromRGB(25, 25, 28))
P("EngineBlock", CFrame.new(0, 1.5, 0), Vector3.new(1.5, 1.5, 2), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))
P("Exhaust", CFrame.new(0.6, 1.2, -1.5), Vector3.new(0.4, 0.4, 3), Enum.Material.Metal, Color3.fromRGB(160, 155, 150))`,
  },

  {
    title: 'Bicycle — frame, 2 wheels, handlebars, seat',
    tags: ['bicycle', 'bike', 'vehicle'],
    description: 'A simple bicycle with frame, 2 wheels, handlebars, and seat. 7 parts.',
    code: `local folder = getFolder("Bicycle")

P("Frame", CFrame.new(0, 1.8, 0) * CFrame.Angles(0, 0, math.rad(-10)), Vector3.new(0.4, 0.4, 4), Enum.Material.Metal, Color3.fromRGB(40, 100, 180))
P("FrontWheel", CFrame.new(0, 1.2, 2) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(2.4, 0.3, 2.4), Enum.Material.Concrete, Color3.fromRGB(30, 30, 30))
P("RearWheel", CFrame.new(0, 1.2, -2) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(2.4, 0.3, 2.4), Enum.Material.Concrete, Color3.fromRGB(30, 30, 30))
P("FrontFork", CFrame.new(0, 2, 2) * CFrame.Angles(math.rad(-10), 0, 0), Vector3.new(0.3, 2.5, 0.3), Enum.Material.Metal, Color3.fromRGB(40, 100, 180))
P("Handlebars", CFrame.new(0, 3.2, 2.1), Vector3.new(2, 0.3, 0.3), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))
P("Seat", CFrame.new(0, 3, -0.8), Vector3.new(0.8, 0.3, 1.2), Enum.Material.Fabric, Color3.fromRGB(30, 30, 35))
P("SeatPost", CFrame.new(0, 2.3, -1), Vector3.new(0.3, 1.5, 0.3), Enum.Material.Metal, Color3.fromRGB(40, 100, 180))`,
  },

  {
    title: 'Speedboat — hull, cabin, windshield',
    tags: ['boat', 'speedboat', 'vehicle', 'water'],
    description: 'A sleek speedboat with hull, cabin, and windshield. 7 parts.',
    code: `local folder = getFolder("Speedboat")

P("Hull", CFrame.new(0, 1, 0), Vector3.new(6, 2, 16), Enum.Material.Metal, Color3.fromRGB(220, 220, 225))
P("HullBottom", CFrame.new(0, 0.25, 0), Vector3.new(5, 0.5, 14), Enum.Material.Metal, Color3.fromRGB(180, 30, 30))
P("BowTaper", CFrame.new(0, 1.2, 9) * CFrame.Angles(math.rad(10), 0, 0), Vector3.new(4, 1.5, 3), Enum.Material.Metal, Color3.fromRGB(220, 220, 225))
P("Cabin", CFrame.new(0, 2.8, -1), Vector3.new(4.5, 2, 5), Enum.Material.Metal, Color3.fromRGB(210, 210, 215))
P("Windshield", CFrame.new(0, 3, 1.8) * CFrame.Angles(math.rad(-20), 0, 0), Vector3.new(4, 2, 0.2), Enum.Material.Glass, Color3.fromRGB(180, 210, 230))
P("Seat", CFrame.new(0, 2.3, 0), Vector3.new(2, 0.6, 2), Enum.Material.Fabric, Color3.fromRGB(40, 40, 45))
P("Motor", CFrame.new(0, 1.5, -8), Vector3.new(2, 2, 1.5), Enum.Material.Metal, Color3.fromRGB(50, 50, 55))`,
  },

  {
    title: 'Airplane — fuselage, wings, tail, engines',
    tags: ['airplane', 'plane', 'vehicle', 'aircraft'],
    description: 'A small airplane with fuselage, wings, tail fin, and 2 engines. 9 parts.',
    code: `local folder = getFolder("Airplane")

P("Fuselage", CFrame.new(0, 6, 0), Vector3.new(4, 4, 20), Enum.Material.Metal, Color3.fromRGB(220, 220, 225))
P("Nose", CFrame.new(0, 6, 11), Vector3.new(3, 3, 3), Enum.Material.Metal, Color3.fromRGB(215, 215, 220))
P("Cockpit", CFrame.new(0, 7.2, 8), Vector3.new(2.5, 1.5, 3), Enum.Material.Glass, Color3.fromRGB(150, 200, 230))
P("WingLeft", CFrame.new(-9, 5.5, 0), Vector3.new(14, 0.5, 5), Enum.Material.Metal, Color3.fromRGB(210, 210, 215))
P("WingRight", CFrame.new(9, 5.5, 0), Vector3.new(14, 0.5, 5), Enum.Material.Metal, Color3.fromRGB(210, 210, 215))
P("TailFin", CFrame.new(0, 9.5, -9), Vector3.new(0.5, 5, 3), Enum.Material.Metal, Color3.fromRGB(200, 200, 205))
P("TailWing", CFrame.new(0, 7, -9), Vector3.new(8, 0.4, 3), Enum.Material.Metal, Color3.fromRGB(205, 205, 210))
P("EngineLeft", CFrame.new(-6, 4.8, 1), Vector3.new(2, 2, 4), Enum.Material.Metal, Color3.fromRGB(80, 80, 85))
P("EngineRight", CFrame.new(6, 4.8, 1), Vector3.new(2, 2, 4), Enum.Material.Metal, Color3.fromRGB(80, 80, 85))`,
  },

  {
    title: 'Helicopter — body, main rotor, tail rotor, skids',
    tags: ['helicopter', 'vehicle', 'aircraft'],
    description: 'A helicopter with body, main rotor, tail boom, tail rotor, and landing skids. 10 parts.',
    code: `local folder = getFolder("Helicopter")

P("Body", CFrame.new(0, 4, 0), Vector3.new(4, 4, 8), Enum.Material.Metal, Color3.fromRGB(50, 80, 50))
P("Cockpit", CFrame.new(0, 4.5, 4.2), Vector3.new(3.5, 2.5, 2), Enum.Material.Glass, Color3.fromRGB(180, 210, 230))
P("TailBoom", CFrame.new(0, 4, -7), Vector3.new(1.5, 1.5, 8), Enum.Material.Metal, Color3.fromRGB(50, 80, 50))
P("TailFin", CFrame.new(0, 5.5, -10.5), Vector3.new(0.3, 3, 1.5), Enum.Material.Metal, Color3.fromRGB(45, 75, 45))
P("TailRotorHub", CFrame.new(0.5, 5.5, -11), Vector3.new(0.5, 0.5, 0.5), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))
P("TailRotorBlade", CFrame.new(0.5, 5.5, -11), Vector3.new(0.3, 4, 0.3), Enum.Material.Metal, Color3.fromRGB(80, 80, 85))
P("MainRotorHub", CFrame.new(0, 6.5, 0), Vector3.new(1, 0.5, 1), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))
P("MainRotorBlade", CFrame.new(0, 6.6, 0), Vector3.new(18, 0.2, 1), Enum.Material.Metal, Color3.fromRGB(80, 80, 85))
P("SkidLeft", CFrame.new(-1.8, 1.2, 0), Vector3.new(0.3, 0.3, 8), Enum.Material.Metal, Color3.fromRGB(70, 70, 75))
P("SkidRight", CFrame.new(1.8, 1.2, 0), Vector3.new(0.3, 0.3, 8), Enum.Material.Metal, Color3.fromRGB(70, 70, 75))`,
  },

  {
    title: 'Train Engine — body, smokestack, wheels, cow catcher',
    tags: ['train', 'locomotive', 'vehicle', 'railroad'],
    description: 'A steam train engine with boiler, cab, smokestack, wheels, and cow catcher. 11 parts.',
    code: `local folder = getFolder("TrainEngine")

P("Boiler", CFrame.new(0, 4, 3), Vector3.new(5, 5, 10), Enum.Material.Metal, Color3.fromRGB(30, 30, 35))
P("Cab", CFrame.new(0, 5, -4), Vector3.new(6, 6, 4), Enum.Material.Metal, Color3.fromRGB(150, 25, 25))
P("CabRoof", CFrame.new(0, 8.25, -4), Vector3.new(7, 0.5, 5), Enum.Material.Metal, Color3.fromRGB(140, 20, 20))
P("Smokestack", CFrame.new(0, 8, 6), Vector3.new(1.5, 3, 1.5), Enum.Material.Metal, Color3.fromRGB(40, 40, 45))
P("SmokestackTop", CFrame.new(0, 9.75, 6), Vector3.new(2.2, 0.5, 2.2), Enum.Material.Metal, Color3.fromRGB(45, 45, 50))
P("CowCatcher", CFrame.new(0, 1, 8.5) * CFrame.Angles(math.rad(15), 0, 0), Vector3.new(6, 2, 2), Enum.Material.Metal, Color3.fromRGB(50, 50, 55))
P("Chassis", CFrame.new(0, 1, 0), Vector3.new(5.5, 2, 18), Enum.Material.Metal, Color3.fromRGB(35, 35, 40))
P("WheelFL", CFrame.new(-3, 1.5, 5) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(3, 0.8, 3), Enum.Material.Metal, Color3.fromRGB(50, 50, 55))
P("WheelFR", CFrame.new(3, 1.5, 5) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(3, 0.8, 3), Enum.Material.Metal, Color3.fromRGB(50, 50, 55))
P("WheelRL", CFrame.new(-3, 1.5, -3) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(3, 0.8, 3), Enum.Material.Metal, Color3.fromRGB(50, 50, 55))
P("WheelRR", CFrame.new(3, 1.5, -3) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(3, 0.8, 3), Enum.Material.Metal, Color3.fromRGB(50, 50, 55))`,
  },

  {
    title: 'Tank — hull, turret, cannon, tracks',
    tags: ['tank', 'military', 'vehicle', 'armor'],
    description: 'A military tank with hull, turret, long cannon barrel, and tracks. 9 parts.',
    code: `local folder = getFolder("Tank")

P("Hull", CFrame.new(0, 2, 0), Vector3.new(7, 2.5, 12), Enum.Material.Metal, Color3.fromRGB(70, 80, 55))
P("HullFrontSlope", CFrame.new(0, 2.8, 6.5) * CFrame.Angles(math.rad(20), 0, 0), Vector3.new(7, 1, 3), Enum.Material.Metal, Color3.fromRGB(65, 75, 50))
P("TurretBase", CFrame.new(0, 4, -0.5), Vector3.new(5, 2, 5), Enum.Material.Metal, Color3.fromRGB(65, 75, 50))
P("TurretTop", CFrame.new(0, 5.25, -0.5), Vector3.new(4, 0.5, 4), Enum.Material.Metal, Color3.fromRGB(60, 70, 48))
P("CannonBarrel", CFrame.new(0, 4, 5.5), Vector3.new(0.8, 0.8, 8), Enum.Material.Metal, Color3.fromRGB(55, 55, 60))
P("Hatch", CFrame.new(0, 5.55, -1), Vector3.new(1.5, 0.2, 1.5), Enum.Material.Metal, Color3.fromRGB(80, 90, 60))
P("TrackLeft", CFrame.new(-4, 1, 0), Vector3.new(1.5, 2.5, 13), Enum.Material.Concrete, Color3.fromRGB(40, 40, 38))
P("TrackRight", CFrame.new(4, 1, 0), Vector3.new(1.5, 2.5, 13), Enum.Material.Concrete, Color3.fromRGB(40, 40, 38))
P("MudGuard", CFrame.new(0, 3.5, 0), Vector3.new(8.5, 0.3, 12.5), Enum.Material.Metal, Color3.fromRGB(68, 78, 53))`,
  },

  {
    title: 'UFO / Flying Saucer — disc, dome, lights',
    tags: ['ufo', 'spaceship', 'vehicle', 'scifi', 'alien'],
    description: 'A classic flying saucer with a flat disc, transparent dome, and glowing lights. 7 parts.',
    code: `local folder = getFolder("UFO")

P("DiscBottom", CFrame.new(0, 4, 0), Vector3.new(14, 1.5, 14), Enum.Material.Metal, Color3.fromRGB(170, 175, 180))
P("DiscTop", CFrame.new(0, 5, 0), Vector3.new(10, 1, 10), Enum.Material.Metal, Color3.fromRGB(180, 185, 190))
P("Dome", CFrame.new(0, 6.5, 0), Vector3.new(5, 3, 5), Enum.Material.Glass, Color3.fromRGB(180, 220, 240))
P("LightN", CFrame.new(0, 4, 6.5), Vector3.new(1.2, 0.8, 1.2), Enum.Material.Neon, Color3.fromRGB(100, 255, 100))
P("LightS", CFrame.new(0, 4, -6.5), Vector3.new(1.2, 0.8, 1.2), Enum.Material.Neon, Color3.fromRGB(100, 255, 100))
P("LightE", CFrame.new(6.5, 4, 0), Vector3.new(1.2, 0.8, 1.2), Enum.Material.Neon, Color3.fromRGB(100, 255, 100))
P("LightW", CFrame.new(-6.5, 4, 0), Vector3.new(1.2, 0.8, 1.2), Enum.Material.Neon, Color3.fromRGB(100, 255, 100))`,
  },

  {
    title: 'Hot Air Balloon — basket, balloon, ropes',
    tags: ['balloon', 'vehicle', 'flying', 'hot air'],
    description: 'A hot air balloon with wicker basket, large balloon envelope, and rope connections. 7 parts.',
    code: `local folder = getFolder("HotAirBalloon")

P("Basket", CFrame.new(0, 2, 0), Vector3.new(4, 3, 4), Enum.Material.Wood, Color3.fromRGB(140, 100, 50))
P("BasketRim", CFrame.new(0, 3.65, 0), Vector3.new(4.5, 0.3, 4.5), Enum.Material.Wood, Color3.fromRGB(130, 90, 45))
P("BalloonLower", CFrame.new(0, 12, 0), Vector3.new(10, 8, 10), Enum.Material.Fabric, Color3.fromRGB(200, 50, 50))
P("BalloonUpper", CFrame.new(0, 18, 0), Vector3.new(8, 6, 8), Enum.Material.Fabric, Color3.fromRGB(240, 200, 40))
P("BalloonTop", CFrame.new(0, 22, 0), Vector3.new(4, 3, 4), Enum.Material.Fabric, Color3.fromRGB(200, 50, 50))
P("RopeA", CFrame.new(-1.8, 6, -1.8), Vector3.new(0.2, 8, 0.2), Enum.Material.Fabric, Color3.fromRGB(160, 140, 100))
P("RopeB", CFrame.new(1.8, 6, 1.8), Vector3.new(0.2, 8, 0.2), Enum.Material.Fabric, Color3.fromRGB(160, 140, 100))`,
  },

  {
    title: 'Submarine — hull, conning tower, propeller, periscope',
    tags: ['submarine', 'vehicle', 'water', 'naval'],
    description: 'A submarine with long hull, conning tower, rear propeller, and periscope. 7 parts.',
    code: `local folder = getFolder("Submarine")

P("Hull", CFrame.new(0, 3, 0), Vector3.new(5, 4, 18), Enum.Material.Metal, Color3.fromRGB(60, 65, 70))
P("BowCap", CFrame.new(0, 3, 9.5), Vector3.new(4, 3.5, 2), Enum.Material.Metal, Color3.fromRGB(55, 60, 65))
P("SternCap", CFrame.new(0, 3, -9.5), Vector3.new(3.5, 3, 2), Enum.Material.Metal, Color3.fromRGB(55, 60, 65))
P("ConningTower", CFrame.new(0, 6, 1), Vector3.new(2.5, 3, 4), Enum.Material.Metal, Color3.fromRGB(50, 55, 60))
P("Periscope", CFrame.new(0, 8.5, 1), Vector3.new(0.4, 2, 0.4), Enum.Material.Metal, Color3.fromRGB(70, 75, 80))
P("Propeller", CFrame.new(0, 3, -11) * CFrame.Angles(0, 0, math.rad(45)), Vector3.new(4, 0.3, 0.8), Enum.Material.Metal, Color3.fromRGB(150, 145, 140))
P("Rudder", CFrame.new(0, 3, -10.5), Vector3.new(0.3, 3, 1.5), Enum.Material.Metal, Color3.fromRGB(55, 60, 65))`,
  },

  {
    title: 'Police Car — car body with lightbar and markings',
    tags: ['police', 'car', 'vehicle', 'emergency'],
    description: 'A police car with black and white body, roof lightbar, and 4 wheels. 11 parts.',
    code: `local folder = getFolder("PoliceCar")

P("BodyLower", CFrame.new(0, 1.5, 0), Vector3.new(6, 1.5, 12), Enum.Material.Metal, Color3.fromRGB(240, 240, 245))
P("Hood", CFrame.new(0, 2.2, 4), Vector3.new(6, 0.8, 4), Enum.Material.Metal, Color3.fromRGB(240, 240, 245))
P("Trunk", CFrame.new(0, 2.2, -4), Vector3.new(6, 0.8, 4), Enum.Material.Metal, Color3.fromRGB(240, 240, 245))
P("Cabin", CFrame.new(0, 3.5, 0), Vector3.new(5.5, 2.5, 5), Enum.Material.Metal, Color3.fromRGB(25, 25, 30))
P("Windshield", CFrame.new(0, 3.5, 2.7) * CFrame.Angles(math.rad(-15), 0, 0), Vector3.new(5, 2, 0.2), Enum.Material.Glass, Color3.fromRGB(180, 210, 230))
P("RearWindow", CFrame.new(0, 3.5, -2.7) * CFrame.Angles(math.rad(15), 0, 0), Vector3.new(5, 2, 0.2), Enum.Material.Glass, Color3.fromRGB(180, 210, 230))
P("LightbarRed", CFrame.new(-1, 5, 0), Vector3.new(1.5, 0.6, 1.5), Enum.Material.Neon, Color3.fromRGB(255, 0, 0))
P("LightbarBlue", CFrame.new(1, 5, 0), Vector3.new(1.5, 0.6, 1.5), Enum.Material.Neon, Color3.fromRGB(0, 50, 255))
P("WheelFL", CFrame.new(-3.2, 1, 3.5) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(2, 0.8, 2), Enum.Material.Concrete, Color3.fromRGB(30, 30, 30))
P("WheelFR", CFrame.new(3.2, 1, 3.5) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(2, 0.8, 2), Enum.Material.Concrete, Color3.fromRGB(30, 30, 30))
P("WheelRL", CFrame.new(-3.2, 1, -3.5) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(2, 0.8, 2), Enum.Material.Concrete, Color3.fromRGB(30, 30, 30))`,
  },

  {
    title: 'Fire Truck — long body with ladder, hoses, lights',
    tags: ['firetruck', 'vehicle', 'emergency', 'fire'],
    description: 'A fire truck with long red body, extendable ladder, and emergency lights. 12 parts.',
    code: `local folder = getFolder("FireTruck")

P("Chassis", CFrame.new(0, 1, 0), Vector3.new(6, 2, 18), Enum.Material.Metal, Color3.fromRGB(40, 40, 45))
P("CabBody", CFrame.new(0, 3.5, 6), Vector3.new(6.5, 4, 5), Enum.Material.Metal, Color3.fromRGB(200, 25, 25))
P("Windshield", CFrame.new(0, 4, 8.6), Vector3.new(5.5, 2.5, 0.2), Enum.Material.Glass, Color3.fromRGB(180, 210, 230))
P("RearBody", CFrame.new(0, 3, -3), Vector3.new(6.5, 3.5, 12), Enum.Material.Metal, Color3.fromRGB(200, 25, 25))
P("LadderBase", CFrame.new(0, 5, -3), Vector3.new(1.2, 0.4, 10), Enum.Material.Metal, Color3.fromRGB(180, 180, 185))
P("LadderExtend", CFrame.new(0, 5.4, -1) * CFrame.Angles(math.rad(-10), 0, 0), Vector3.new(1, 0.3, 8), Enum.Material.Metal, Color3.fromRGB(190, 190, 195))
P("HoseReel", CFrame.new(2.5, 5, -7), Vector3.new(1.5, 1.5, 1.5), Enum.Material.Concrete, Color3.fromRGB(200, 180, 60))
P("LightLeft", CFrame.new(-2, 5.8, 6), Vector3.new(0.8, 0.6, 0.8), Enum.Material.Neon, Color3.fromRGB(255, 0, 0))
P("LightRight", CFrame.new(2, 5.8, 6), Vector3.new(0.8, 0.6, 0.8), Enum.Material.Neon, Color3.fromRGB(255, 0, 0))
P("WheelFL", CFrame.new(-3.5, 1.2, 5) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(2.4, 1, 2.4), Enum.Material.Concrete, Color3.fromRGB(30, 30, 30))
P("WheelFR", CFrame.new(3.5, 1.2, 5) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(2.4, 1, 2.4), Enum.Material.Concrete, Color3.fromRGB(30, 30, 30))
P("WheelRL", CFrame.new(-3.5, 1.2, -6) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(2.4, 1, 2.4), Enum.Material.Concrete, Color3.fromRGB(30, 30, 30))`,
  },

  {
    title: 'Ambulance — van body with cross and lights',
    tags: ['ambulance', 'vehicle', 'emergency', 'medical'],
    description: 'An ambulance van with white body, red cross, and emergency lights. 10 parts.',
    code: `local folder = getFolder("Ambulance")

P("Body", CFrame.new(0, 3, 0), Vector3.new(6, 4.5, 14), Enum.Material.Metal, Color3.fromRGB(240, 240, 245))
P("Roof", CFrame.new(0, 5.5, 0), Vector3.new(6.2, 0.5, 14.2), Enum.Material.Metal, Color3.fromRGB(235, 235, 240))
P("Chassis", CFrame.new(0, 0.5, 0), Vector3.new(5.5, 1, 14), Enum.Material.Metal, Color3.fromRGB(40, 40, 45))
P("Windshield", CFrame.new(0, 3.8, 7.2), Vector3.new(5, 2.5, 0.2), Enum.Material.Glass, Color3.fromRGB(180, 210, 230))
P("CrossVert", CFrame.new(0, 3.5, -7.05), Vector3.new(1, 3, 0.15), Enum.Material.Neon, Color3.fromRGB(220, 30, 30))
P("CrossHoriz", CFrame.new(0, 3.5, -7.05), Vector3.new(3, 1, 0.15), Enum.Material.Neon, Color3.fromRGB(220, 30, 30))
P("LightLeft", CFrame.new(-2, 6, 5), Vector3.new(0.8, 0.6, 0.8), Enum.Material.Neon, Color3.fromRGB(255, 0, 0))
P("LightRight", CFrame.new(2, 6, 5), Vector3.new(0.8, 0.6, 0.8), Enum.Material.Neon, Color3.fromRGB(255, 0, 0))
P("WheelFL", CFrame.new(-3.2, 1, 4.5) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(2, 0.8, 2), Enum.Material.Concrete, Color3.fromRGB(30, 30, 30))
P("WheelFR", CFrame.new(3.2, 1, 4.5) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(2, 0.8, 2), Enum.Material.Concrete, Color3.fromRGB(30, 30, 30))`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // WEAPONS & TOOLS (15 templates)
  // ═══════════════════════════════════════════════════════════════════

  {
    title: 'Axe — blade and handle',
    tags: ['axe', 'weapon', 'tool', 'medieval'],
    description: 'A woodcutting axe with a wooden handle and metal blade. 4 parts.',
    code: `local folder = getFolder("Axe")

P("Handle", CFrame.new(0, 2.5, 0), Vector3.new(0.4, 5, 0.4), Enum.Material.Wood, Color3.fromRGB(120, 80, 40))
P("Blade", CFrame.new(0.8, 4.5, 0), Vector3.new(1.5, 2, 0.3), Enum.Material.Metal, Color3.fromRGB(180, 185, 190))
P("BladeEdge", CFrame.new(1.6, 4.5, 0), Vector3.new(0.3, 2.2, 0.15), Enum.Material.Metal, Color3.fromRGB(200, 205, 210))
P("HandleGrip", CFrame.new(0, 0.5, 0), Vector3.new(0.5, 1, 0.5), Enum.Material.Fabric, Color3.fromRGB(60, 40, 20))`,
  },

  {
    title: 'Pickaxe — head and handle',
    tags: ['pickaxe', 'tool', 'mining'],
    description: 'A mining pickaxe with a wooden handle and metal dual-pointed head. 4 parts.',
    code: `local folder = getFolder("Pickaxe")

P("Handle", CFrame.new(0, 2.5, 0), Vector3.new(0.4, 5, 0.4), Enum.Material.Wood, Color3.fromRGB(120, 80, 40))
P("HeadCenter", CFrame.new(0, 5.2, 0), Vector3.new(1, 1, 0.5), Enum.Material.Metal, Color3.fromRGB(160, 160, 165))
P("PickLeft", CFrame.new(-1.5, 5.2, 0) * CFrame.Angles(0, 0, math.rad(10)), Vector3.new(2.5, 0.5, 0.3), Enum.Material.Metal, Color3.fromRGB(170, 170, 175))
P("PickRight", CFrame.new(1.5, 5.2, 0) * CFrame.Angles(0, 0, math.rad(-10)), Vector3.new(2.5, 0.5, 0.3), Enum.Material.Metal, Color3.fromRGB(170, 170, 175))`,
  },

  {
    title: 'Hammer — head and handle',
    tags: ['hammer', 'tool', 'weapon'],
    description: 'A hammer with a wooden handle and heavy metal head. 4 parts.',
    code: `local folder = getFolder("Hammer")

P("Handle", CFrame.new(0, 2.5, 0), Vector3.new(0.4, 5, 0.4), Enum.Material.Wood, Color3.fromRGB(120, 80, 40))
P("HeadMain", CFrame.new(0, 5.2, 0), Vector3.new(2.5, 1.2, 1.2), Enum.Material.Metal, Color3.fromRGB(150, 150, 155))
P("HeadFace", CFrame.new(-1.4, 5.2, 0), Vector3.new(0.3, 1.3, 1.3), Enum.Material.Metal, Color3.fromRGB(170, 170, 175))
P("HandleGrip", CFrame.new(0, 0.5, 0), Vector3.new(0.5, 1, 0.5), Enum.Material.Fabric, Color3.fromRGB(80, 50, 25))`,
  },

  {
    title: 'Shield — round with boss and rim',
    tags: ['shield', 'weapon', 'defense', 'medieval'],
    description: 'A round medieval shield with a central boss and reinforced rim. 4 parts.',
    code: `local folder = getFolder("Shield")

P("ShieldBody", CFrame.new(0, 3, 0), Vector3.new(5, 5, 0.5), Enum.Material.Wood, Color3.fromRGB(140, 90, 40))
P("Boss", CFrame.new(0, 3, -0.4), Vector3.new(1.5, 1.5, 0.8), Enum.Material.Metal, Color3.fromRGB(200, 180, 60))
P("RimOuter", CFrame.new(0, 3, -0.1), Vector3.new(5.5, 5.5, 0.2), Enum.Material.Metal, Color3.fromRGB(160, 160, 165))
P("HandleBack", CFrame.new(0, 3, 0.4), Vector3.new(0.5, 2, 0.4), Enum.Material.Fabric, Color3.fromRGB(80, 50, 25))`,
  },

  {
    title: 'Bow — curved limbs with string',
    tags: ['bow', 'weapon', 'archery', 'ranged'],
    description: 'A wooden bow with curved limbs and a taut bowstring. 4 parts.',
    code: `local folder = getFolder("Bow")

P("UpperLimb", CFrame.new(-0.5, 4, 0) * CFrame.Angles(0, 0, math.rad(15)), Vector3.new(0.5, 3.5, 0.5), Enum.Material.Wood, Color3.fromRGB(130, 85, 35))
P("LowerLimb", CFrame.new(-0.5, 1, 0) * CFrame.Angles(0, 0, math.rad(-15)), Vector3.new(0.5, 3.5, 0.5), Enum.Material.Wood, Color3.fromRGB(130, 85, 35))
P("Grip", CFrame.new(0, 2.5, 0), Vector3.new(0.6, 1.5, 0.6), Enum.Material.Fabric, Color3.fromRGB(80, 50, 25))
P("String", CFrame.new(-1, 2.5, 0), Vector3.new(0.1, 5.5, 0.1), Enum.Material.Fabric, Color3.fromRGB(200, 190, 170))`,
  },

  {
    title: 'Fishing Rod — rod, reel, line',
    tags: ['fishing', 'rod', 'tool', 'outdoor'],
    description: 'A fishing rod with reel and dangling line. 5 parts.',
    code: `local folder = getFolder("FishingRod")

P("RodLower", CFrame.new(0, 3, 0), Vector3.new(0.3, 6, 0.3), Enum.Material.Wood, Color3.fromRGB(130, 85, 40))
P("RodUpper", CFrame.new(0, 7, 0) * CFrame.Angles(math.rad(-10), 0, 0), Vector3.new(0.2, 4, 0.2), Enum.Material.Wood, Color3.fromRGB(140, 95, 45))
P("HandleGrip", CFrame.new(0, 0.5, 0), Vector3.new(0.5, 1, 0.5), Enum.Material.Fabric, Color3.fromRGB(40, 40, 45))
P("Reel", CFrame.new(0.4, 2, 0), Vector3.new(0.8, 0.8, 0.8), Enum.Material.Metal, Color3.fromRGB(160, 160, 165))
P("Line", CFrame.new(0.3, 7.5, 1.5), Vector3.new(0.05, 4, 0.05), Enum.Material.Fabric, Color3.fromRGB(220, 220, 225))`,
  },

  {
    title: 'Torch — handle with flame and PointLight',
    tags: ['torch', 'light', 'tool', 'medieval'],
    description: 'A wooden torch with a burning flame tip and warm PointLight. 4 parts.',
    code: `local folder = getFolder("Torch")

P("Handle", CFrame.new(0, 2, 0), Vector3.new(0.5, 4, 0.5), Enum.Material.Wood, Color3.fromRGB(100, 65, 30))
P("Wrap", CFrame.new(0, 3.8, 0), Vector3.new(0.7, 1, 0.7), Enum.Material.Fabric, Color3.fromRGB(140, 100, 50))
P("FlameOuter", CFrame.new(0, 5, 0), Vector3.new(0.8, 1.5, 0.8), Enum.Material.Neon, Color3.fromRGB(255, 160, 30))

local light = Instance.new("PointLight")
light.Range = 24  light.Brightness = 1.5
light.Color = Color3.fromRGB(255, 180, 80)
light.Parent = P("FlameCore", CFrame.new(0, 5.2, 0), Vector3.new(0.4, 1, 0.4), Enum.Material.Neon, Color3.fromRGB(255, 220, 80))`,
  },

  {
    title: 'Lantern — frame, glass, flame with PointLight',
    tags: ['lantern', 'light', 'tool', 'decoration'],
    description: 'A hanging lantern with metal frame, glass panels, and inner flame. 6 parts.',
    code: `local folder = getFolder("Lantern")

P("Base", CFrame.new(0, 0.2, 0), Vector3.new(1.5, 0.3, 1.5), Enum.Material.Metal, Color3.fromRGB(50, 50, 55))
P("Top", CFrame.new(0, 3, 0), Vector3.new(1.5, 0.3, 1.5), Enum.Material.Metal, Color3.fromRGB(50, 50, 55))
P("Hook", CFrame.new(0, 3.6, 0), Vector3.new(0.3, 1, 0.3), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))
P("GlassBody", CFrame.new(0, 1.6, 0), Vector3.new(1.2, 2.5, 1.2), Enum.Material.Glass, Color3.fromRGB(220, 230, 240))
P("FrameBar", CFrame.new(0, 1.6, 0), Vector3.new(0.15, 2.8, 0.15), Enum.Material.Metal, Color3.fromRGB(50, 50, 55))

local light = Instance.new("PointLight")
light.Range = 20  light.Brightness = 1.2
light.Color = Color3.fromRGB(255, 200, 100)
light.Parent = P("Flame", CFrame.new(0, 1.5, 0), Vector3.new(0.4, 0.8, 0.4), Enum.Material.Neon, Color3.fromRGB(255, 180, 50))`,
  },

  {
    title: 'Telescope — tube on tripod',
    tags: ['telescope', 'tool', 'science', 'astronomy'],
    description: 'A telescope tube mounted on a tripod stand. 6 parts.',
    code: `local folder = getFolder("Telescope")

P("Tube", CFrame.new(0, 5, 0) * CFrame.Angles(math.rad(-25), 0, 0), Vector3.new(1, 1, 6), Enum.Material.Metal, Color3.fromRGB(140, 110, 60))
P("LensCap", CFrame.new(0, 6.2, -2.5) * CFrame.Angles(math.rad(-25), 0, 0), Vector3.new(1.3, 1.3, 0.2), Enum.Material.Glass, Color3.fromRGB(180, 210, 240))
P("Eyepiece", CFrame.new(0, 4, 2.2), Vector3.new(0.5, 0.5, 1), Enum.Material.Metal, Color3.fromRGB(130, 100, 55))
P("LegA", CFrame.new(0, 2.5, -1.5) * CFrame.Angles(math.rad(10), 0, 0), Vector3.new(0.3, 5, 0.3), Enum.Material.Wood, Color3.fromRGB(120, 80, 40))
P("LegB", CFrame.new(-1.3, 2.5, 0.8) * CFrame.Angles(math.rad(-8), 0, math.rad(8)), Vector3.new(0.3, 5, 0.3), Enum.Material.Wood, Color3.fromRGB(120, 80, 40))
P("LegC", CFrame.new(1.3, 2.5, 0.8) * CFrame.Angles(math.rad(-8), 0, math.rad(-8)), Vector3.new(0.3, 5, 0.3), Enum.Material.Wood, Color3.fromRGB(120, 80, 40))`,
  },

  {
    title: 'Cannon — barrel, carriage, wheels',
    tags: ['cannon', 'weapon', 'medieval', 'artillery'],
    description: 'A field cannon with barrel, wooden carriage, and two wheels. 7 parts.',
    code: `local folder = getFolder("Cannon")

P("Barrel", CFrame.new(0, 3.5, 2), Vector3.new(1.5, 1.5, 6), Enum.Material.Metal, Color3.fromRGB(70, 70, 75))
P("BarrelMouth", CFrame.new(0, 3.5, 5.2), Vector3.new(1.8, 1.8, 0.4), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))
P("Carriage", CFrame.new(0, 2, -1), Vector3.new(3, 1.5, 6), Enum.Material.Wood, Color3.fromRGB(110, 75, 35))
P("CarriageTrail", CFrame.new(0, 1.2, -5), Vector3.new(2, 0.8, 3), Enum.Material.Wood, Color3.fromRGB(105, 70, 32))
P("WheelLeft", CFrame.new(-2.2, 1.5, 0) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(3, 0.5, 3), Enum.Material.Wood, Color3.fromRGB(90, 60, 28))
P("WheelRight", CFrame.new(2.2, 1.5, 0) * CFrame.Angles(0, 0, math.rad(90)), Vector3.new(3, 0.5, 3), Enum.Material.Wood, Color3.fromRGB(90, 60, 28))
P("FuseHole", CFrame.new(0, 4.3, -0.5), Vector3.new(0.3, 0.3, 0.3), Enum.Material.Metal, Color3.fromRGB(40, 40, 42))`,
  },

  {
    title: 'TNT Barrel — barrel with fuse and label',
    tags: ['tnt', 'explosive', 'weapon', 'barrel'],
    description: 'A classic TNT barrel with a visible fuse and danger label. 5 parts.',
    code: `local folder = getFolder("TNTBarrel")

P("Barrel", CFrame.new(0, 2, 0), Vector3.new(3, 4, 3), Enum.Material.Wood, Color3.fromRGB(120, 75, 35))
P("RimTop", CFrame.new(0, 4.1, 0), Vector3.new(3.3, 0.3, 3.3), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))
P("RimBottom", CFrame.new(0, 0.1, 0), Vector3.new(3.3, 0.3, 3.3), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))
P("Label", CFrame.new(0, 2, 1.55), Vector3.new(2, 1.5, 0.1), Enum.Material.Neon, Color3.fromRGB(220, 40, 40))
P("Fuse", CFrame.new(0.3, 4.8, 0) * CFrame.Angles(0, 0, math.rad(20)), Vector3.new(0.15, 1.5, 0.15), Enum.Material.Fabric, Color3.fromRGB(200, 180, 120))`,
  },

  {
    title: 'Treasure Chest — box, lid, lock, gold inside',
    tags: ['treasure', 'chest', 'loot', 'pirate'],
    description: 'A wooden treasure chest with open lid, gold lock, and gold coins visible inside. 7 parts.',
    code: `local folder = getFolder("TreasureChest")

P("ChestBody", CFrame.new(0, 1.5, 0), Vector3.new(4, 3, 3), Enum.Material.Wood, Color3.fromRGB(120, 75, 30))
P("Lid", CFrame.new(0, 3.5, -0.8) * CFrame.Angles(math.rad(-30), 0, 0), Vector3.new(4.2, 1.5, 3.2), Enum.Material.Wood, Color3.fromRGB(130, 82, 35))
P("MetalBandFront", CFrame.new(0, 1.5, 1.55), Vector3.new(4.2, 0.5, 0.15), Enum.Material.Metal, Color3.fromRGB(160, 140, 50))
P("MetalBandBack", CFrame.new(0, 1.5, -1.55), Vector3.new(4.2, 0.5, 0.15), Enum.Material.Metal, Color3.fromRGB(160, 140, 50))
P("Lock", CFrame.new(0, 2.8, 1.6), Vector3.new(0.8, 0.8, 0.3), Enum.Material.Metal, Color3.fromRGB(200, 180, 50))
P("GoldPile", CFrame.new(0, 2.2, 0), Vector3.new(3, 1.5, 2), Enum.Material.Neon, Color3.fromRGB(255, 215, 50))
P("GoldCoin", CFrame.new(1, 3, 0.5), Vector3.new(0.6, 0.6, 0.15), Enum.Material.Neon, Color3.fromRGB(255, 220, 60))`,
  },

  {
    title: 'Potion Bottle — body, cork, liquid glow',
    tags: ['potion', 'magic', 'item', 'fantasy'],
    description: 'A glass potion bottle with a cork stopper and glowing liquid inside. 4 parts.',
    code: `local folder = getFolder("PotionBottle")

P("Bottle", CFrame.new(0, 1.2, 0), Vector3.new(1.5, 2.4, 1.5), Enum.Material.Glass, Color3.fromRGB(200, 220, 240))
P("Neck", CFrame.new(0, 2.7, 0), Vector3.new(0.6, 0.8, 0.6), Enum.Material.Glass, Color3.fromRGB(200, 220, 240))
P("Cork", CFrame.new(0, 3.3, 0), Vector3.new(0.7, 0.5, 0.7), Enum.Material.Wood, Color3.fromRGB(160, 120, 70))
P("Liquid", CFrame.new(0, 1, 0), Vector3.new(1.2, 1.8, 1.2), Enum.Material.Neon, Color3.fromRGB(100, 255, 150))`,
  },

  {
    title: 'Crystal — jagged glowing formation',
    tags: ['crystal', 'magic', 'nature', 'neon', 'gem'],
    description: 'A cluster of jagged glowing crystals in Neon material. 5 parts.',
    code: `local folder = getFolder("Crystal")

P("ShardMain", CFrame.new(0, 3, 0) * CFrame.Angles(0, 0, math.rad(5)), Vector3.new(1.5, 6, 1.5), Enum.Material.Neon, Color3.fromRGB(100, 180, 255))
P("ShardLeft", CFrame.new(-1.2, 2, 0.5) * CFrame.Angles(0, math.rad(20), math.rad(15)), Vector3.new(1, 4, 1), Enum.Material.Neon, Color3.fromRGB(120, 190, 255))
P("ShardRight", CFrame.new(1.3, 2.5, -0.3) * CFrame.Angles(0, math.rad(-15), math.rad(-12)), Vector3.new(1.2, 5, 1.2), Enum.Material.Neon, Color3.fromRGB(80, 160, 255))
P("ShardSmall", CFrame.new(0.5, 1.5, 1) * CFrame.Angles(math.rad(10), 0, math.rad(-20)), Vector3.new(0.6, 3, 0.6), Enum.Material.Neon, Color3.fromRGB(130, 200, 255))
P("Base", CFrame.new(0, 0.3, 0), Vector3.new(4, 0.6, 3.5), Enum.Material.Slate, Color3.fromRGB(80, 75, 70))`,
  },

  {
    title: 'Magic Staff — pole with crystal top and glow',
    tags: ['staff', 'magic', 'weapon', 'fantasy', 'wizard'],
    description: 'A wizard staff with a wooden pole, ornate head, and glowing crystal orb. 5 parts.',
    code: `local folder = getFolder("MagicStaff")

P("Pole", CFrame.new(0, 3, 0), Vector3.new(0.4, 6, 0.4), Enum.Material.Wood, Color3.fromRGB(90, 55, 25))
P("PoleWrap", CFrame.new(0, 1.5, 0), Vector3.new(0.5, 1.5, 0.5), Enum.Material.Fabric, Color3.fromRGB(80, 40, 100))
P("HeadCradle", CFrame.new(0, 6.3, 0), Vector3.new(1, 1, 1), Enum.Material.Metal, Color3.fromRGB(160, 140, 50))

local glow = Instance.new("PointLight")
glow.Range = 16  glow.Brightness = 1.5
glow.Color = Color3.fromRGB(150, 100, 255)
glow.Parent = P("CrystalOrb", CFrame.new(0, 7, 0), Vector3.new(1.2, 1.2, 1.2), Enum.Material.Neon, Color3.fromRGB(150, 80, 255))

P("BaseSpike", CFrame.new(0, 0.15, 0), Vector3.new(0.3, 0.3, 0.3), Enum.Material.Metal, Color3.fromRGB(160, 140, 50))`,
  },

]
