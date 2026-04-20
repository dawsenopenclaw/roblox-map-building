/**
 * Scene and environment templates — full explorable areas.
 * Covers: themed biomes, game-ready rooms, and interactive spaces.
 */
import { BuildTemplate } from './build-template-chunks'

export const SCENE_TEMPLATES: BuildTemplate[] = [
  {
    title: 'Desert Oasis — sand dunes, palm trees, water pool, tent',
    tags: ['desert', 'oasis', 'sand', 'palm', 'tent', 'water', 'biome', 'environment'],
    description: 'A desert oasis scene with rolling sand dunes, two palm trees, a shimmering water pool, a Bedouin tent, and scattered rocks. 22 parts.',
    code: `local folder = getFolder("DesertOasis")
P("SandBase", CFrame.new(0, 0.5, 0), Vector3.new(60, 1, 60), Enum.Material.Sand, Color3.fromRGB(220, 195, 140))
P("DuneA", CFrame.new(-18, 2, -10), Vector3.new(20, 3, 14), Enum.Material.Sand, Color3.fromRGB(215, 190, 135))
P("DuneB", CFrame.new(15, 1.8, 18), Vector3.new(16, 2.5, 12), Enum.Material.Sand, Color3.fromRGB(225, 200, 145))
P("DuneC", CFrame.new(22, 1.5, -15), Vector3.new(12, 2, 10), Enum.Material.Sand, Color3.fromRGB(210, 185, 130))
P("WaterPool", CFrame.new(0, 0.3, 5), Vector3.new(14, 0.4, 10), Enum.Material.Glass, Color3.fromRGB(60, 140, 180))
P("PoolRim", CFrame.new(0, 0.6, 5), Vector3.new(15, 0.2, 11), Enum.Material.Sand, Color3.fromRGB(200, 178, 125))
P("PalmTrunk1", CFrame.new(-5, 5, 3), Vector3.new(1, 10, 1), Enum.Material.Wood, Color3.fromRGB(110, 75, 40))
P("PalmFrond1A", CFrame.new(-5, 10.5, 1) * CFrame.Angles(0, 0, math.rad(25)), Vector3.new(6, 0.3, 2), Enum.Material.Grass, Color3.fromRGB(50, 120, 40))
P("PalmFrond1B", CFrame.new(-5, 10.5, 5) * CFrame.Angles(0, 0, math.rad(-25)), Vector3.new(6, 0.3, 2), Enum.Material.Grass, Color3.fromRGB(55, 125, 45))
P("PalmFrond1C", CFrame.new(-7, 10.3, 3) * CFrame.Angles(0, math.rad(90), math.rad(20)), Vector3.new(5, 0.3, 2), Enum.Material.Grass, Color3.fromRGB(45, 115, 38))
P("PalmTrunk2", CFrame.new(6, 4.5, 8), Vector3.new(1, 9, 1), Enum.Material.Wood, Color3.fromRGB(105, 70, 38))
P("PalmFrond2A", CFrame.new(6, 9.5, 6) * CFrame.Angles(0, 0, math.rad(20)), Vector3.new(5, 0.3, 2), Enum.Material.Grass, Color3.fromRGB(50, 118, 40))
P("PalmFrond2B", CFrame.new(6, 9.5, 10) * CFrame.Angles(0, 0, math.rad(-20)), Vector3.new(5, 0.3, 2), Enum.Material.Grass, Color3.fromRGB(52, 122, 42))
P("TentPoleCenter", CFrame.new(-12, 4, -2), Vector3.new(0.5, 8, 0.5), Enum.Material.Wood, Color3.fromRGB(100, 65, 30))
P("TentFabricA", CFrame.new(-14, 4.5, -2) * CFrame.Angles(0, 0, math.rad(25)), Vector3.new(8, 0.2, 8), Enum.Material.Fabric, Color3.fromRGB(180, 140, 80))
P("TentFabricB", CFrame.new(-10, 4.5, -2) * CFrame.Angles(0, 0, math.rad(-25)), Vector3.new(8, 0.2, 8), Enum.Material.Fabric, Color3.fromRGB(175, 135, 75))
P("TentRug", CFrame.new(-12, 1.1, -2), Vector3.new(6, 0.1, 5), Enum.Material.Fabric, Color3.fromRGB(160, 50, 40))
P("Rock1", CFrame.new(8, 1.2, -8), Vector3.new(3, 2, 3), Enum.Material.Slate, Color3.fromRGB(140, 130, 115))
P("Rock2", CFrame.new(10, 1, -6), Vector3.new(2, 1.5, 2), Enum.Material.Slate, Color3.fromRGB(135, 125, 110))
P("CactusTrunk", CFrame.new(20, 3, 5), Vector3.new(1.2, 5, 1.2), Enum.Material.Grass, Color3.fromRGB(60, 100, 45))
P("CactusArmL", CFrame.new(19, 4.5, 5), Vector3.new(1, 3, 1), Enum.Material.Grass, Color3.fromRGB(58, 95, 42))
P("CactusArmR", CFrame.new(21, 5, 5), Vector3.new(1, 2.5, 1), Enum.Material.Grass, Color3.fromRGB(62, 102, 48))`,
  },
  {
    title: 'Jungle Clearing — dense trees, vines, ancient ruins column, torch',
    tags: ['jungle', 'clearing', 'trees', 'vines', 'ruins', 'tropical', 'biome'],
    description: 'A dense jungle clearing with thick trees, hanging vines, mossy ground, an ancient stone column, and a burning torch. 24 parts.',
    code: `local folder = getFolder("JungleClearing")
P("JungleFloor", CFrame.new(0, 0.15, 0), Vector3.new(50, 0.3, 50), Enum.Material.Grass, Color3.fromRGB(45, 90, 30))
P("MossLayer", CFrame.new(5, 0.35, -3), Vector3.new(18, 0.1, 14), Enum.Material.Grass, Color3.fromRGB(55, 100, 38))
P("TreeTrunk1", CFrame.new(-15, 7, -12), Vector3.new(3, 14, 3), Enum.Material.Wood, Color3.fromRGB(80, 55, 28))
P("TreeCanopy1", CFrame.new(-15, 15, -12), Vector3.new(14, 3, 14), Enum.Material.Grass, Color3.fromRGB(30, 80, 22))
P("TreeTrunk2", CFrame.new(14, 8, -14), Vector3.new(3.5, 16, 3.5), Enum.Material.Wood, Color3.fromRGB(75, 50, 25))
P("TreeCanopy2", CFrame.new(14, 17, -14), Vector3.new(16, 4, 16), Enum.Material.Grass, Color3.fromRGB(28, 75, 20))
P("TreeTrunk3", CFrame.new(-12, 6, 16), Vector3.new(2.5, 12, 2.5), Enum.Material.Wood, Color3.fromRGB(85, 58, 30))
P("TreeCanopy3", CFrame.new(-12, 13, 16), Vector3.new(12, 3, 12), Enum.Material.Grass, Color3.fromRGB(35, 85, 25))
P("TreeTrunk4", CFrame.new(18, 7.5, 10), Vector3.new(3, 15, 3), Enum.Material.Wood, Color3.fromRGB(78, 52, 26))
P("TreeCanopy4", CFrame.new(18, 16, 10), Vector3.new(15, 3.5, 15), Enum.Material.Grass, Color3.fromRGB(32, 82, 24))
P("Vine1", CFrame.new(-14, 10, -10), Vector3.new(0.3, 12, 0.3), Enum.Material.Grass, Color3.fromRGB(40, 70, 25))
P("Vine2", CFrame.new(15, 12, -12), Vector3.new(0.3, 14, 0.3), Enum.Material.Grass, Color3.fromRGB(38, 68, 22))
P("Vine3", CFrame.new(17, 11, 12), Vector3.new(0.3, 10, 0.3), Enum.Material.Grass, Color3.fromRGB(42, 72, 28))
P("RuinColumn", CFrame.new(0, 4, 0), Vector3.new(3, 8, 3), Enum.Material.Concrete, Color3.fromRGB(155, 150, 135))
P("RuinCapital", CFrame.new(0, 8.5, 0), Vector3.new(4, 1, 4), Enum.Material.Concrete, Color3.fromRGB(160, 155, 140))
P("RuinBase", CFrame.new(0, 0.5, 0), Vector3.new(4.5, 1, 4.5), Enum.Material.Concrete, Color3.fromRGB(145, 140, 125))
P("BrokenSlab", CFrame.new(5, 0.6, 3) * CFrame.Angles(0, math.rad(35), math.rad(8)), Vector3.new(4, 0.8, 3), Enum.Material.Concrete, Color3.fromRGB(150, 145, 130))
P("TorchPole", CFrame.new(-5, 2.5, 5), Vector3.new(0.5, 5, 0.5), Enum.Material.Wood, Color3.fromRGB(90, 58, 25))
local flame = P("TorchFlame", CFrame.new(-5, 5.5, 5), Vector3.new(0.8, 1, 0.8), Enum.Material.Neon, Color3.fromRGB(255, 160, 30))
local fl = Instance.new("PointLight"); fl.Range = 20; fl.Brightness = 2; fl.Color = Color3.fromRGB(255, 160, 50); fl.Parent = flame
P("FernClump1", CFrame.new(8, 0.8, -5), Vector3.new(3, 1.5, 3), Enum.Material.Grass, Color3.fromRGB(40, 85, 28))
P("FernClump2", CFrame.new(-8, 0.7, 10), Vector3.new(2.5, 1.2, 2.5), Enum.Material.Grass, Color3.fromRGB(42, 88, 30))
P("MushroomCap", CFrame.new(3, 1.3, 8), Vector3.new(1.5, 0.5, 1.5), Enum.Material.Fabric, Color3.fromRGB(180, 50, 40))
P("MushroomStem", CFrame.new(3, 0.8, 8), Vector3.new(0.5, 1, 0.5), Enum.Material.Fabric, Color3.fromRGB(210, 200, 180))`,
  },
  {
    title: 'Swamp — murky water, dead trees, fog-like ground, lily pads',
    tags: ['swamp', 'marsh', 'bog', 'dark', 'murky', 'water', 'biome'],
    description: 'A spooky swamp with murky green water, dead leafless trees, low fog layer, lily pads, and mud mounds. 20 parts.',
    code: `local folder = getFolder("Swamp")
P("MudGround", CFrame.new(0, 0.25, 0), Vector3.new(55, 0.5, 55), Enum.Material.Mud, Color3.fromRGB(70, 55, 35))
P("MurkyWater", CFrame.new(0, 0.15, 0), Vector3.new(40, 0.3, 35), Enum.Material.Glass, Color3.fromRGB(45, 70, 35))
P("FogLayer", CFrame.new(0, 1.2, 0), Vector3.new(55, 0.4, 55), Enum.Material.Fabric, Color3.fromRGB(140, 155, 120))
P("DeadTree1", CFrame.new(-10, 5, -8), Vector3.new(1.5, 10, 1.5), Enum.Material.Wood, Color3.fromRGB(60, 45, 30))
P("DeadBranch1A", CFrame.new(-9, 8, -7) * CFrame.Angles(0, 0, math.rad(-40)), Vector3.new(4, 0.5, 0.5), Enum.Material.Wood, Color3.fromRGB(55, 40, 28))
P("DeadBranch1B", CFrame.new(-11, 9, -9) * CFrame.Angles(0, 0, math.rad(35)), Vector3.new(3.5, 0.4, 0.4), Enum.Material.Wood, Color3.fromRGB(58, 42, 30))
P("DeadTree2", CFrame.new(12, 4, 10), Vector3.new(1.8, 8, 1.8), Enum.Material.Wood, Color3.fromRGB(55, 42, 28))
P("DeadBranch2A", CFrame.new(13, 7, 11) * CFrame.Angles(0, 0, math.rad(-35)), Vector3.new(4, 0.5, 0.5), Enum.Material.Wood, Color3.fromRGB(52, 38, 25))
P("DeadTree3", CFrame.new(-5, 3.5, 15), Vector3.new(1.2, 7, 1.2), Enum.Material.Wood, Color3.fromRGB(58, 44, 30))
P("MudMound1", CFrame.new(8, 0.8, -12), Vector3.new(6, 1.2, 5), Enum.Material.Mud, Color3.fromRGB(65, 50, 32))
P("MudMound2", CFrame.new(-15, 0.7, 5), Vector3.new(5, 1, 4), Enum.Material.Mud, Color3.fromRGB(68, 52, 34))
P("LilyPad1", CFrame.new(3, 0.35, 2), Vector3.new(2, 0.1, 2), Enum.Material.Grass, Color3.fromRGB(40, 90, 30))
P("LilyPad2", CFrame.new(-4, 0.35, 6), Vector3.new(1.8, 0.1, 1.8), Enum.Material.Grass, Color3.fromRGB(45, 95, 35))
P("LilyPad3", CFrame.new(6, 0.35, -3), Vector3.new(2.2, 0.1, 2.2), Enum.Material.Grass, Color3.fromRGB(38, 88, 28))
P("LogFallen", CFrame.new(0, 1, -5) * CFrame.Angles(0, math.rad(20), math.rad(5)), Vector3.new(10, 1.5, 1.5), Enum.Material.Wood, Color3.fromRGB(50, 38, 22))
P("Cattail1", CFrame.new(-2, 1.5, 8), Vector3.new(0.2, 3, 0.2), Enum.Material.Grass, Color3.fromRGB(55, 75, 35))
P("Cattail2", CFrame.new(-1, 1.5, 9), Vector3.new(0.2, 2.8, 0.2), Enum.Material.Grass, Color3.fromRGB(50, 70, 32))
P("CattailHead1", CFrame.new(-2, 3.2, 8), Vector3.new(0.4, 0.8, 0.4), Enum.Material.Fabric, Color3.fromRGB(80, 55, 30))
P("CattailHead2", CFrame.new(-1, 3.1, 9), Vector3.new(0.4, 0.7, 0.4), Enum.Material.Fabric, Color3.fromRGB(78, 52, 28))
P("StagnantPuddle", CFrame.new(15, 0.2, -10), Vector3.new(6, 0.2, 5), Enum.Material.Glass, Color3.fromRGB(40, 60, 30))`,
  },
  {
    title: 'Volcano Crater — rim, lava pool, smoke rocks, obsidian',
    tags: ['volcano', 'crater', 'lava', 'fire', 'mountain', 'biome'],
    description: 'A volcanic crater with jagged rim walls, glowing lava pool, obsidian formations, smoke-colored boulders, and heat glow. 22 parts.',
    code: `local folder = getFolder("VolcanoCrater")
P("CraterFloor", CFrame.new(0, 0.25, 0), Vector3.new(40, 0.5, 40), Enum.Material.Slate, Color3.fromRGB(50, 40, 35))
P("LavaPool", CFrame.new(0, 0.4, 0), Vector3.new(18, 0.3, 18), Enum.Material.Neon, Color3.fromRGB(255, 80, 10))
local lavaGlow = P("LavaGlowCenter", CFrame.new(0, 0.6, 0), Vector3.new(4, 0.2, 4), Enum.Material.Neon, Color3.fromRGB(255, 200, 50))
local lg = Instance.new("PointLight"); lg.Range = 40; lg.Brightness = 3; lg.Color = Color3.fromRGB(255, 120, 20); lg.Parent = lavaGlow
P("RimN", CFrame.new(0, 5, -18), Vector3.new(38, 10, 5), Enum.Material.Slate, Color3.fromRGB(60, 48, 40))
P("RimS", CFrame.new(0, 4, 18), Vector3.new(38, 8, 5), Enum.Material.Slate, Color3.fromRGB(58, 45, 38))
P("RimE", CFrame.new(18, 4.5, 0), Vector3.new(5, 9, 32), Enum.Material.Slate, Color3.fromRGB(55, 42, 36))
P("RimW", CFrame.new(-18, 5.5, 0), Vector3.new(5, 11, 32), Enum.Material.Slate, Color3.fromRGB(62, 50, 42))
P("RimPeakNE", CFrame.new(14, 8, -14), Vector3.new(6, 6, 6), Enum.Material.Slate, Color3.fromRGB(65, 52, 44))
P("RimPeakNW", CFrame.new(-14, 9, -14), Vector3.new(5, 8, 5), Enum.Material.Slate, Color3.fromRGB(68, 55, 46))
P("Obsidian1", CFrame.new(-6, 2, -5), Vector3.new(3, 4, 2), Enum.Material.Metal, Color3.fromRGB(25, 20, 25))
P("Obsidian2", CFrame.new(8, 1.5, 6), Vector3.new(2, 3, 2.5), Enum.Material.Metal, Color3.fromRGB(22, 18, 22))
P("Obsidian3", CFrame.new(-4, 1.8, 8), Vector3.new(2.5, 3.5, 1.5), Enum.Material.Metal, Color3.fromRGB(28, 22, 28))
P("SmokeBoulder1", CFrame.new(5, 1.5, -8), Vector3.new(4, 3, 3), Enum.Material.Slate, Color3.fromRGB(80, 75, 70))
P("SmokeBoulder2", CFrame.new(-8, 1, 5), Vector3.new(3, 2, 3.5), Enum.Material.Slate, Color3.fromRGB(75, 70, 65))
P("CooledLavaStrip1", CFrame.new(10, 0.4, -3), Vector3.new(4, 0.3, 2), Enum.Material.Slate, Color3.fromRGB(35, 28, 25))
P("CooledLavaStrip2", CFrame.new(-9, 0.4, -6), Vector3.new(3, 0.3, 5), Enum.Material.Slate, Color3.fromRGB(38, 30, 28))
P("LavaVein1", CFrame.new(6, 0.35, 3), Vector3.new(6, 0.15, 0.5), Enum.Material.Neon, Color3.fromRGB(255, 100, 15))
P("LavaVein2", CFrame.new(-5, 0.35, -2), Vector3.new(0.5, 0.15, 7), Enum.Material.Neon, Color3.fromRGB(255, 90, 10))
P("AshPile1", CFrame.new(12, 0.5, 10), Vector3.new(4, 0.6, 3), Enum.Material.Concrete, Color3.fromRGB(55, 50, 48))
P("AshPile2", CFrame.new(-10, 0.4, 12), Vector3.new(3, 0.5, 4), Enum.Material.Concrete, Color3.fromRGB(52, 48, 45))
P("ScorchedRock", CFrame.new(0, 1, 10), Vector3.new(3, 2, 2), Enum.Material.Slate, Color3.fromRGB(40, 32, 28))`,
  },
  {
    title: 'Cave Entrance — rock arch, stalactites, darkness, torch',
    tags: ['cave', 'entrance', 'cavern', 'rocks', 'stalactite', 'dark', 'underground'],
    description: 'A dramatic cave entrance with rock arch, stalactites, dark interior, flickering torch, scattered boulders, and moss. 22 parts.',
    code: `local folder = getFolder("CaveEntrance")
P("GroundBase", CFrame.new(0, 0.25, 0), Vector3.new(40, 0.5, 35), Enum.Material.Slate, Color3.fromRGB(90, 82, 72))
P("CaveFloor", CFrame.new(0, 0.3, -8), Vector3.new(16, 0.3, 18), Enum.Material.Slate, Color3.fromRGB(55, 48, 42))
P("ArchLeft", CFrame.new(-7, 7, -5), Vector3.new(5, 14, 6), Enum.Material.Slate, Color3.fromRGB(75, 68, 60))
P("ArchRight", CFrame.new(7, 7, -5), Vector3.new(5, 14, 6), Enum.Material.Slate, Color3.fromRGB(72, 65, 58))
P("ArchTop", CFrame.new(0, 14.5, -5), Vector3.new(19, 3, 6), Enum.Material.Slate, Color3.fromRGB(78, 70, 62))
P("CaveWallBack", CFrame.new(0, 6, -16), Vector3.new(16, 12, 2), Enum.Material.Slate, Color3.fromRGB(40, 35, 30))
P("CaveCeiling", CFrame.new(0, 12.5, -10), Vector3.new(16, 1, 14), Enum.Material.Slate, Color3.fromRGB(45, 40, 35))
P("CaveWallL", CFrame.new(-8, 6, -10), Vector3.new(2, 12, 14), Enum.Material.Slate, Color3.fromRGB(50, 44, 38))
P("CaveWallR", CFrame.new(8, 6, -10), Vector3.new(2, 12, 14), Enum.Material.Slate, Color3.fromRGB(48, 42, 36))
P("Stalactite1", CFrame.new(-3, 11, -8), Vector3.new(0.8, 3, 0.8), Enum.Material.Slate, Color3.fromRGB(80, 72, 62))
P("Stalactite2", CFrame.new(2, 10.5, -10), Vector3.new(1, 4, 1), Enum.Material.Slate, Color3.fromRGB(82, 74, 64))
P("Stalactite3", CFrame.new(-1, 11.5, -12), Vector3.new(0.6, 2, 0.6), Enum.Material.Slate, Color3.fromRGB(78, 70, 60))
P("Stalactite4", CFrame.new(4, 11, -6), Vector3.new(0.7, 2.5, 0.7), Enum.Material.Slate, Color3.fromRGB(85, 76, 66))
P("Boulder1", CFrame.new(-12, 1.5, 5), Vector3.new(5, 3, 4), Enum.Material.Slate, Color3.fromRGB(95, 85, 75))
P("Boulder2", CFrame.new(10, 1, 8), Vector3.new(3.5, 2, 3), Enum.Material.Slate, Color3.fromRGB(92, 82, 72))
P("Boulder3", CFrame.new(-4, 0.8, 3), Vector3.new(2.5, 1.5, 2), Enum.Material.Slate, Color3.fromRGB(88, 78, 68))
P("MossPatch1", CFrame.new(-10, 0.55, 2), Vector3.new(4, 0.1, 3), Enum.Material.Grass, Color3.fromRGB(50, 80, 35))
P("MossPatch2", CFrame.new(5, 0.55, 5), Vector3.new(3, 0.1, 4), Enum.Material.Grass, Color3.fromRGB(45, 75, 30))
P("TorchPole", CFrame.new(-5, 3, -3), Vector3.new(0.4, 4, 0.4), Enum.Material.Wood, Color3.fromRGB(95, 60, 28))
local torchFlame = P("TorchFlame", CFrame.new(-5, 5.3, -3), Vector3.new(0.6, 0.8, 0.6), Enum.Material.Neon, Color3.fromRGB(255, 170, 40))
local tl = Instance.new("PointLight"); tl.Range = 18; tl.Brightness = 2; tl.Color = Color3.fromRGB(255, 150, 40); tl.Parent = torchFlame
P("Stalagmite1", CFrame.new(3, 1.5, -12), Vector3.new(1, 3, 1), Enum.Material.Slate, Color3.fromRGB(70, 62, 55))`,
  },
  {
    title: 'Mine Shaft — track rails, minecart, support beams, lantern',
    tags: ['mine', 'shaft', 'tunnel', 'minecart', 'rails', 'underground'],
    description: 'An underground mine shaft with wooden support beams, iron rails, a minecart, hanging lantern, rock walls, and ore deposits. 24 parts.',
    code: `local folder = getFolder("MineShaft")
P("TunnelFloor", CFrame.new(0, 0.15, 0), Vector3.new(12, 0.3, 40), Enum.Material.Slate, Color3.fromRGB(70, 62, 55))
P("TunnelWallL", CFrame.new(-6, 4.5, 0), Vector3.new(1, 9, 40), Enum.Material.Slate, Color3.fromRGB(65, 58, 50))
P("TunnelWallR", CFrame.new(6, 4.5, 0), Vector3.new(1, 9, 40), Enum.Material.Slate, Color3.fromRGB(62, 55, 48))
P("TunnelCeiling", CFrame.new(0, 9, 0), Vector3.new(13, 1, 40), Enum.Material.Slate, Color3.fromRGB(58, 52, 45))
P("SupportBeamL1", CFrame.new(-5, 4.5, -10), Vector3.new(0.8, 9, 0.8), Enum.Material.Wood, Color3.fromRGB(100, 65, 30))
P("SupportBeamR1", CFrame.new(5, 4.5, -10), Vector3.new(0.8, 9, 0.8), Enum.Material.Wood, Color3.fromRGB(100, 65, 30))
P("SupportCross1", CFrame.new(0, 8.5, -10), Vector3.new(11, 0.6, 0.6), Enum.Material.Wood, Color3.fromRGB(105, 68, 32))
P("SupportBeamL2", CFrame.new(-5, 4.5, 5), Vector3.new(0.8, 9, 0.8), Enum.Material.Wood, Color3.fromRGB(98, 63, 28))
P("SupportBeamR2", CFrame.new(5, 4.5, 5), Vector3.new(0.8, 9, 0.8), Enum.Material.Wood, Color3.fromRGB(98, 63, 28))
P("SupportCross2", CFrame.new(0, 8.5, 5), Vector3.new(11, 0.6, 0.6), Enum.Material.Wood, Color3.fromRGB(103, 66, 30))
P("RailL", CFrame.new(-1.2, 0.4, 0), Vector3.new(0.3, 0.3, 40), Enum.Material.Metal, Color3.fromRGB(120, 115, 110))
P("RailR", CFrame.new(1.2, 0.4, 0), Vector3.new(0.3, 0.3, 40), Enum.Material.Metal, Color3.fromRGB(120, 115, 110))
P("Tie1", CFrame.new(0, 0.25, -12), Vector3.new(3.5, 0.2, 0.8), Enum.Material.Wood, Color3.fromRGB(85, 55, 25))
P("Tie2", CFrame.new(0, 0.25, -8), Vector3.new(3.5, 0.2, 0.8), Enum.Material.Wood, Color3.fromRGB(85, 55, 25))
P("Tie3", CFrame.new(0, 0.25, -4), Vector3.new(3.5, 0.2, 0.8), Enum.Material.Wood, Color3.fromRGB(85, 55, 25))
P("Tie4", CFrame.new(0, 0.25, 0), Vector3.new(3.5, 0.2, 0.8), Enum.Material.Wood, Color3.fromRGB(85, 55, 25))
P("Tie5", CFrame.new(0, 0.25, 4), Vector3.new(3.5, 0.2, 0.8), Enum.Material.Wood, Color3.fromRGB(85, 55, 25))
P("CartBase", CFrame.new(0, 1.2, -2), Vector3.new(3, 0.3, 4), Enum.Material.Metal, Color3.fromRGB(100, 95, 88))
P("CartSideL", CFrame.new(-1.4, 2, -2), Vector3.new(0.2, 1.5, 4), Enum.Material.Metal, Color3.fromRGB(105, 100, 92))
P("CartSideR", CFrame.new(1.4, 2, -2), Vector3.new(0.2, 1.5, 4), Enum.Material.Metal, Color3.fromRGB(105, 100, 92))
P("CartFront", CFrame.new(0, 2, -3.9), Vector3.new(2.8, 1.5, 0.2), Enum.Material.Metal, Color3.fromRGB(105, 100, 92))
P("CartBack", CFrame.new(0, 2, -0.1), Vector3.new(2.8, 1.5, 0.2), Enum.Material.Metal, Color3.fromRGB(105, 100, 92))
P("OreDeposit", CFrame.new(-5.2, 2, 12), Vector3.new(1.5, 2, 1.5), Enum.Material.Metal, Color3.fromRGB(160, 130, 50))
local lanternBody = P("Lantern", CFrame.new(0, 7.5, 5), Vector3.new(0.6, 1, 0.6), Enum.Material.Neon, Color3.fromRGB(255, 200, 80))
local ll = Instance.new("PointLight"); ll.Range = 20; ll.Brightness = 1.5; ll.Color = Color3.fromRGB(255, 190, 70); ll.Parent = lanternBody`,
  },
  {
    title: 'Underwater Ruins — coral, broken columns, treasure, kelp',
    tags: ['underwater', 'ocean', 'ruins', 'coral', 'treasure', 'atlantis', 'aquatic'],
    description: 'An underwater ruins scene with sandy seabed, broken columns, colorful coral, kelp strands, a treasure chest, and ambient blue glow. 24 parts.',
    code: `local folder = getFolder("UnderwaterRuins")
P("Seabed", CFrame.new(0, 0.25, 0), Vector3.new(50, 0.5, 50), Enum.Material.Sand, Color3.fromRGB(160, 150, 120))
P("WaterTint", CFrame.new(0, 15, 0), Vector3.new(55, 30, 55), Enum.Material.Glass, Color3.fromRGB(30, 80, 130))
P("Column1Base", CFrame.new(-8, 3, -5), Vector3.new(2.5, 6, 2.5), Enum.Material.Concrete, Color3.fromRGB(150, 148, 135))
P("Column1Cap", CFrame.new(-8, 6.5, -5), Vector3.new(3.5, 1, 3.5), Enum.Material.Concrete, Color3.fromRGB(155, 152, 140))
P("Column2Broken", CFrame.new(6, 2, -8), Vector3.new(2.5, 4, 2.5), Enum.Material.Concrete, Color3.fromRGB(145, 142, 130))
P("FallenColumn", CFrame.new(3, 1.2, 2) * CFrame.Angles(0, math.rad(40), math.rad(85)), Vector3.new(2.5, 8, 2.5), Enum.Material.Concrete, Color3.fromRGB(140, 138, 125))
P("BrokenArch", CFrame.new(-2, 5, -8), Vector3.new(10, 2, 2), Enum.Material.Concrete, Color3.fromRGB(148, 145, 132))
P("FloorTiles", CFrame.new(-2, 0.4, -6), Vector3.new(12, 0.2, 10), Enum.Material.Concrete, Color3.fromRGB(155, 150, 138))
P("CoralRed", CFrame.new(10, 2, 5), Vector3.new(3, 4, 3), Enum.Material.Brick, Color3.fromRGB(200, 60, 50))
P("CoralPink", CFrame.new(12, 1.5, 8), Vector3.new(2, 3, 2.5), Enum.Material.Brick, Color3.fromRGB(220, 100, 120))
P("CoralOrange", CFrame.new(-12, 2, 8), Vector3.new(2.5, 3.5, 2), Enum.Material.Brick, Color3.fromRGB(220, 130, 50))
P("CoralBranch", CFrame.new(-10, 1.8, 4), Vector3.new(1.5, 3, 1.5), Enum.Material.Brick, Color3.fromRGB(180, 80, 100))
P("Kelp1", CFrame.new(5, 5, 10), Vector3.new(0.4, 10, 0.4), Enum.Material.Grass, Color3.fromRGB(30, 80, 30))
P("Kelp2", CFrame.new(7, 4, 12), Vector3.new(0.4, 8, 0.4), Enum.Material.Grass, Color3.fromRGB(35, 85, 35))
P("Kelp3", CFrame.new(-8, 4.5, 12), Vector3.new(0.4, 9, 0.4), Enum.Material.Grass, Color3.fromRGB(28, 75, 28))
P("TreasureChestBase", CFrame.new(0, 0.8, 6), Vector3.new(3, 1.5, 2), Enum.Material.Wood, Color3.fromRGB(100, 60, 25))
P("TreasureChestLid", CFrame.new(0, 1.8, 5.5) * CFrame.Angles(math.rad(-20), 0, 0), Vector3.new(3, 0.3, 2), Enum.Material.Wood, Color3.fromRGB(105, 65, 28))
P("GoldCoins", CFrame.new(0, 1.3, 6), Vector3.new(2, 0.8, 1.2), Enum.Material.Metal, Color3.fromRGB(220, 190, 50))
P("SeaShell1", CFrame.new(6, 0.5, -3), Vector3.new(1, 0.5, 1.2), Enum.Material.Concrete, Color3.fromRGB(225, 210, 190))
P("SeaShell2", CFrame.new(-6, 0.5, 3), Vector3.new(1.2, 0.5, 1), Enum.Material.Concrete, Color3.fromRGB(220, 200, 185))
P("Anemone", CFrame.new(14, 1, -2), Vector3.new(2, 2, 2), Enum.Material.Fabric, Color3.fromRGB(180, 50, 150))
P("StarfishFloor", CFrame.new(-5, 0.4, 10), Vector3.new(1.5, 0.15, 1.5), Enum.Material.Fabric, Color3.fromRGB(200, 80, 40))
local glowOrb = P("AmbientGlow", CFrame.new(0, 4, -5), Vector3.new(1.5, 1.5, 1.5), Enum.Material.Neon, Color3.fromRGB(80, 160, 220))
local ag = Instance.new("PointLight"); ag.Range = 30; ag.Brightness = 1.5; ag.Color = Color3.fromRGB(60, 140, 200); ag.Parent = glowOrb`,
  },
  {
    title: 'Cloud City Platform — floating cloud blocks, golden columns, bridges',
    tags: ['cloud', 'city', 'floating', 'sky', 'golden', 'fantasy', 'platform'],
    description: 'A floating cloud city platform with fluffy cloud blocks, golden pillars, marble bridges, ornate railing, and sky glow. 22 parts.',
    code: `local folder = getFolder("CloudCity")
P("MainCloud", CFrame.new(0, 0, 0), Vector3.new(30, 6, 30), Enum.Material.Fabric, Color3.fromRGB(240, 240, 250))
P("CloudPuff1", CFrame.new(-12, -1, -10), Vector3.new(10, 5, 8), Enum.Material.Fabric, Color3.fromRGB(235, 235, 248))
P("CloudPuff2", CFrame.new(10, -2, 12), Vector3.new(12, 4, 10), Enum.Material.Fabric, Color3.fromRGB(238, 238, 250))
P("CloudPuff3", CFrame.new(14, -1.5, -8), Vector3.new(8, 4, 8), Enum.Material.Fabric, Color3.fromRGB(232, 232, 245))
P("Platform", CFrame.new(0, 3.25, 0), Vector3.new(24, 0.5, 24), Enum.Material.Concrete, Color3.fromRGB(230, 225, 215))
P("GoldPillar1", CFrame.new(-10, 7, -10), Vector3.new(1.5, 8, 1.5), Enum.Material.Metal, Color3.fromRGB(220, 190, 60))
P("GoldPillar2", CFrame.new(10, 7, -10), Vector3.new(1.5, 8, 1.5), Enum.Material.Metal, Color3.fromRGB(220, 190, 60))
P("GoldPillar3", CFrame.new(-10, 7, 10), Vector3.new(1.5, 8, 1.5), Enum.Material.Metal, Color3.fromRGB(220, 190, 60))
P("GoldPillar4", CFrame.new(10, 7, 10), Vector3.new(1.5, 8, 1.5), Enum.Material.Metal, Color3.fromRGB(220, 190, 60))
P("PillarCapN1", CFrame.new(-10, 11.25, -10), Vector3.new(2.5, 0.5, 2.5), Enum.Material.Metal, Color3.fromRGB(225, 195, 65))
P("PillarCapN2", CFrame.new(10, 11.25, -10), Vector3.new(2.5, 0.5, 2.5), Enum.Material.Metal, Color3.fromRGB(225, 195, 65))
P("Canopy", CFrame.new(0, 12, 0), Vector3.new(22, 0.5, 22), Enum.Material.Concrete, Color3.fromRGB(235, 230, 220))
P("BridgeDeck", CFrame.new(20, 3.25, 0), Vector3.new(14, 0.5, 6), Enum.Material.Concrete, Color3.fromRGB(225, 220, 210))
P("BridgeRailL", CFrame.new(20, 4.75, -3), Vector3.new(14, 2.5, 0.3), Enum.Material.Metal, Color3.fromRGB(215, 185, 55))
P("BridgeRailR", CFrame.new(20, 4.75, 3), Vector3.new(14, 2.5, 0.3), Enum.Material.Metal, Color3.fromRGB(215, 185, 55))
P("BridgeCloud", CFrame.new(28, 0, 0), Vector3.new(12, 5, 10), Enum.Material.Fabric, Color3.fromRGB(236, 236, 248))
P("FarPlatform", CFrame.new(35, 3.25, 0), Vector3.new(10, 0.5, 10), Enum.Material.Concrete, Color3.fromRGB(230, 225, 215))
P("Fountain", CFrame.new(0, 4.5, 0), Vector3.new(5, 2, 5), Enum.Material.Concrete, Color3.fromRGB(220, 215, 205))
P("FountainWater", CFrame.new(0, 4.8, 0), Vector3.new(4, 0.5, 4), Enum.Material.Glass, Color3.fromRGB(150, 200, 240))
P("GoldOrb", CFrame.new(0, 7, 0), Vector3.new(1.5, 1.5, 1.5), Enum.Material.Metal, Color3.fromRGB(230, 200, 70))
local skyGlow = P("SkyGlow", CFrame.new(0, 6, 0), Vector3.new(2, 2, 2), Enum.Material.Neon, Color3.fromRGB(200, 220, 255))
local sg = Instance.new("PointLight"); sg.Range = 35; sg.Brightness = 2; sg.Color = Color3.fromRGB(200, 220, 255); sg.Parent = skyGlow`,
  },
  {
    title: 'Haunted Graveyard — tombstones, iron fence, dead tree, fog ground',
    tags: ['haunted', 'graveyard', 'cemetery', 'spooky', 'halloween', 'horror', 'fog'],
    description: 'A haunted graveyard with tombstones, iron fence perimeter, dead gnarled tree, low fog, a moon well, and eerie green glow. 26 parts.',
    code: `local folder = getFolder("HauntedGraveyard")
P("DirtGround", CFrame.new(0, 0.15, 0), Vector3.new(50, 0.3, 40), Enum.Material.Mud, Color3.fromRGB(50, 42, 30))
P("FogLayer", CFrame.new(0, 0.8, 0), Vector3.new(50, 0.6, 40), Enum.Material.Fabric, Color3.fromRGB(120, 130, 120))
P("FencePostN1", CFrame.new(-20, 2.5, -18), Vector3.new(0.5, 5, 0.5), Enum.Material.Metal, Color3.fromRGB(40, 40, 45))
P("FencePostN2", CFrame.new(-12, 2.5, -18), Vector3.new(0.5, 5, 0.5), Enum.Material.Metal, Color3.fromRGB(40, 40, 45))
P("FencePostN3", CFrame.new(-4, 2.5, -18), Vector3.new(0.5, 5, 0.5), Enum.Material.Metal, Color3.fromRGB(40, 40, 45))
P("FencePostN4", CFrame.new(4, 2.5, -18), Vector3.new(0.5, 5, 0.5), Enum.Material.Metal, Color3.fromRGB(40, 40, 45))
P("FenceRailN", CFrame.new(-8, 3.5, -18), Vector3.new(24, 0.3, 0.3), Enum.Material.Metal, Color3.fromRGB(38, 38, 42))
P("FenceRailN2", CFrame.new(-8, 1.5, -18), Vector3.new(24, 0.3, 0.3), Enum.Material.Metal, Color3.fromRGB(38, 38, 42))
P("Tombstone1", CFrame.new(-8, 1.8, -8), Vector3.new(2, 3, 0.5), Enum.Material.Concrete, Color3.fromRGB(130, 125, 118))
P("Tombstone2", CFrame.new(-3, 1.5, -10), Vector3.new(1.8, 2.5, 0.5), Enum.Material.Concrete, Color3.fromRGB(125, 120, 112))
P("Tombstone3", CFrame.new(3, 2, -6), Vector3.new(2.2, 3.5, 0.5), Enum.Material.Concrete, Color3.fromRGB(135, 128, 120))
P("TombstoneCross", CFrame.new(8, 2.5, -9), Vector3.new(0.4, 5, 0.4), Enum.Material.Concrete, Color3.fromRGB(128, 122, 115))
P("CrossArm", CFrame.new(8, 3.5, -9), Vector3.new(2.5, 0.4, 0.4), Enum.Material.Concrete, Color3.fromRGB(128, 122, 115))
P("DirtMound1", CFrame.new(-8, 0.5, -6), Vector3.new(3, 0.6, 5), Enum.Material.Mud, Color3.fromRGB(55, 45, 32))
P("DirtMound2", CFrame.new(3, 0.45, -4), Vector3.new(3, 0.5, 5), Enum.Material.Mud, Color3.fromRGB(52, 42, 30))
P("DeadTrunk", CFrame.new(12, 5, 5), Vector3.new(2, 10, 2), Enum.Material.Wood, Color3.fromRGB(50, 38, 25))
P("DeadBranch1", CFrame.new(14, 8, 6) * CFrame.Angles(0, 0, math.rad(-40)), Vector3.new(6, 0.6, 0.6), Enum.Material.Wood, Color3.fromRGB(48, 36, 22))
P("DeadBranch2", CFrame.new(10, 9, 4) * CFrame.Angles(0, 0, math.rad(30)), Vector3.new(5, 0.5, 0.5), Enum.Material.Wood, Color3.fromRGB(45, 34, 20))
P("MoonWellBase", CFrame.new(-12, 1, 8), Vector3.new(5, 2, 5), Enum.Material.Concrete, Color3.fromRGB(100, 95, 88))
P("MoonWellWater", CFrame.new(-12, 1.5, 8), Vector3.new(3.5, 0.3, 3.5), Enum.Material.Glass, Color3.fromRGB(80, 120, 90))
local wellGlow = P("MoonWellGlow", CFrame.new(-12, 2, 8), Vector3.new(2, 0.5, 2), Enum.Material.Neon, Color3.fromRGB(80, 200, 100))
local wg = Instance.new("PointLight"); wg.Range = 15; wg.Brightness = 1.5; wg.Color = Color3.fromRGB(80, 200, 100); wg.Parent = wellGlow
P("CofflinLid", CFrame.new(5, 0.7, 8) * CFrame.Angles(0, math.rad(15), 0), Vector3.new(6, 0.3, 2.5), Enum.Material.Wood, Color3.fromRGB(55, 35, 18))
P("Lantern", CFrame.new(-3, 1.5, 0), Vector3.new(0.5, 1, 0.5), Enum.Material.Neon, Color3.fromRGB(200, 180, 80))
P("Raven", CFrame.new(12, 10.5, 5), Vector3.new(1, 0.5, 1.5), Enum.Material.Slate, Color3.fromRGB(20, 18, 22))
P("BrokenPot", CFrame.new(15, 0.6, -5), Vector3.new(1.5, 1.2, 1.5), Enum.Material.Brick, Color3.fromRGB(140, 80, 50))`,
  },
  {
    title: 'Enchanted Forest — glowing mushrooms, fairy lights, magical tree, sparkle stones',
    tags: ['enchanted', 'forest', 'magical', 'fairy', 'mushroom', 'glow', 'fantasy'],
    description: 'A magical enchanted forest with a grand ancient tree, glowing mushrooms, fairy light orbs, sparkle stones, and a mossy clearing. 28 parts.',
    code: `local folder = getFolder("EnchantedForest")
P("ForestFloor", CFrame.new(0, 0.15, 0), Vector3.new(50, 0.3, 50), Enum.Material.Grass, Color3.fromRGB(35, 75, 28))
P("MossyPatch", CFrame.new(-5, 0.25, 3), Vector3.new(12, 0.1, 10), Enum.Material.Grass, Color3.fromRGB(50, 100, 40))
P("AncientTrunk", CFrame.new(0, 8, 0), Vector3.new(5, 16, 5), Enum.Material.Wood, Color3.fromRGB(70, 50, 25))
P("AncientRoot1", CFrame.new(-4, 1, -2) * CFrame.Angles(0, math.rad(-30), math.rad(15)), Vector3.new(6, 1.5, 1.5), Enum.Material.Wood, Color3.fromRGB(65, 45, 22))
P("AncientRoot2", CFrame.new(3, 1, 3) * CFrame.Angles(0, math.rad(50), math.rad(-12)), Vector3.new(5, 1.2, 1.2), Enum.Material.Wood, Color3.fromRGB(68, 48, 24))
P("AncientCanopy", CFrame.new(0, 17, 0), Vector3.new(20, 4, 20), Enum.Material.Grass, Color3.fromRGB(25, 65, 18))
P("AncientCanopyLayer2", CFrame.new(2, 19, -2), Vector3.new(14, 3, 14), Enum.Material.Grass, Color3.fromRGB(30, 70, 22))
P("GlowShroom1Cap", CFrame.new(-10, 1.8, -8), Vector3.new(2.5, 1, 2.5), Enum.Material.Neon, Color3.fromRGB(100, 200, 255))
P("GlowShroom1Stem", CFrame.new(-10, 0.9, -8), Vector3.new(0.6, 1.5, 0.6), Enum.Material.Concrete, Color3.fromRGB(200, 195, 180))
local gs1 = P("GlowShroom1Light", CFrame.new(-10, 1.8, -8), Vector3.new(0.5, 0.3, 0.5), Enum.Material.Neon, Color3.fromRGB(100, 200, 255))
local g1l = Instance.new("PointLight"); g1l.Range = 12; g1l.Brightness = 1.5; g1l.Color = Color3.fromRGB(100, 200, 255); g1l.Parent = gs1
P("GlowShroom2Cap", CFrame.new(-8, 1.2, -6), Vector3.new(1.5, 0.6, 1.5), Enum.Material.Neon, Color3.fromRGB(120, 80, 220))
P("GlowShroom2Stem", CFrame.new(-8, 0.6, -6), Vector3.new(0.4, 1, 0.4), Enum.Material.Concrete, Color3.fromRGB(195, 190, 175))
P("GlowShroom3Cap", CFrame.new(12, 1.5, 8), Vector3.new(2, 0.8, 2), Enum.Material.Neon, Color3.fromRGB(80, 255, 150))
P("GlowShroom3Stem", CFrame.new(12, 0.7, 8), Vector3.new(0.5, 1.2, 0.5), Enum.Material.Concrete, Color3.fromRGB(198, 192, 178))
local fo1 = P("FairyOrb1", CFrame.new(-6, 5, 8), Vector3.new(0.6, 0.6, 0.6), Enum.Material.Neon, Color3.fromRGB(255, 220, 100))
local fo1l = Instance.new("PointLight"); fo1l.Range = 10; fo1l.Brightness = 1; fo1l.Color = Color3.fromRGB(255, 220, 100); fo1l.Parent = fo1
local fo2 = P("FairyOrb2", CFrame.new(8, 6, -5), Vector3.new(0.5, 0.5, 0.5), Enum.Material.Neon, Color3.fromRGB(255, 150, 220))
local fo2l = Instance.new("PointLight"); fo2l.Range = 8; fo2l.Brightness = 1; fo2l.Color = Color3.fromRGB(255, 150, 220); fo2l.Parent = fo2
local fo3 = P("FairyOrb3", CFrame.new(3, 4, 10), Vector3.new(0.5, 0.5, 0.5), Enum.Material.Neon, Color3.fromRGB(150, 255, 200))
local fo3l = Instance.new("PointLight"); fo3l.Range = 8; fo3l.Brightness = 1; fo3l.Color = Color3.fromRGB(150, 255, 200); fo3l.Parent = fo3
P("SparkleStone1", CFrame.new(15, 1, -12), Vector3.new(2, 2, 2), Enum.Material.Metal, Color3.fromRGB(200, 200, 220))
P("SparkleStone2", CFrame.new(-14, 0.8, 12), Vector3.new(1.5, 1.5, 1.5), Enum.Material.Metal, Color3.fromRGB(210, 210, 230))
P("SmallTree1", CFrame.new(-18, 4, 5), Vector3.new(1.5, 8, 1.5), Enum.Material.Wood, Color3.fromRGB(75, 52, 26))
P("SmallTreeCanopy1", CFrame.new(-18, 9, 5), Vector3.new(8, 3, 8), Enum.Material.Grass, Color3.fromRGB(32, 78, 24))
P("SmallTree2", CFrame.new(18, 3.5, -10), Vector3.new(1.5, 7, 1.5), Enum.Material.Wood, Color3.fromRGB(72, 48, 24))
P("SmallTreeCanopy2", CFrame.new(18, 8, -10), Vector3.new(7, 2.5, 7), Enum.Material.Grass, Color3.fromRGB(28, 72, 20))
P("FlowerPatch", CFrame.new(6, 0.4, 5), Vector3.new(3, 0.5, 3), Enum.Material.Grass, Color3.fromRGB(180, 80, 160))
P("Fireflies", CFrame.new(-3, 3, -4), Vector3.new(0.3, 0.3, 0.3), Enum.Material.Neon, Color3.fromRGB(200, 255, 120))`,
  },
  {
    title: 'Crystal Cave — large crystals, reflecting pool, geode formations',
    tags: ['crystal', 'cave', 'gem', 'geode', 'underground', 'glow', 'fantasy'],
    description: 'A dazzling crystal cave with towering crystal formations, a reflecting pool, geode clusters, and ambient prismatic light. 24 parts.',
    code: `local folder = getFolder("CrystalCave")
P("CaveFloor", CFrame.new(0, 0.15, 0), Vector3.new(40, 0.3, 40), Enum.Material.Slate, Color3.fromRGB(55, 50, 60))
P("CaveWallN", CFrame.new(0, 8, -20), Vector3.new(40, 16, 2), Enum.Material.Slate, Color3.fromRGB(50, 45, 55))
P("CaveWallS", CFrame.new(0, 8, 20), Vector3.new(40, 16, 2), Enum.Material.Slate, Color3.fromRGB(48, 43, 53))
P("CaveWallE", CFrame.new(20, 8, 0), Vector3.new(2, 16, 40), Enum.Material.Slate, Color3.fromRGB(52, 47, 57))
P("CaveWallW", CFrame.new(-20, 8, 0), Vector3.new(2, 16, 40), Enum.Material.Slate, Color3.fromRGB(46, 42, 52))
P("CaveCeiling", CFrame.new(0, 16.5, 0), Vector3.new(40, 1, 40), Enum.Material.Slate, Color3.fromRGB(42, 38, 48))
P("CrystalTall1", CFrame.new(-8, 5, -8) * CFrame.Angles(0, math.rad(15), math.rad(8)), Vector3.new(2, 10, 2), Enum.Material.Neon, Color3.fromRGB(100, 150, 255))
P("CrystalTall2", CFrame.new(-6, 4, -6) * CFrame.Angles(0, math.rad(-20), math.rad(-5)), Vector3.new(1.5, 8, 1.5), Enum.Material.Neon, Color3.fromRGB(120, 100, 255))
local mainCrystal = P("CrystalMega", CFrame.new(8, 6, -5) * CFrame.Angles(0, math.rad(30), math.rad(10)), Vector3.new(3, 12, 3), Enum.Material.Neon, Color3.fromRGB(180, 100, 255))
local mcl = Instance.new("PointLight"); mcl.Range = 35; mcl.Brightness = 2.5; mcl.Color = Color3.fromRGB(180, 120, 255); mcl.Parent = mainCrystal
P("CrystalMed1", CFrame.new(6, 3, -3) * CFrame.Angles(0, math.rad(-10), math.rad(-12)), Vector3.new(1.5, 6, 1.5), Enum.Material.Neon, Color3.fromRGB(200, 80, 220))
P("CrystalSmall1", CFrame.new(-12, 2, 5), Vector3.new(1, 4, 1), Enum.Material.Neon, Color3.fromRGB(80, 220, 200))
P("CrystalSmall2", CFrame.new(14, 1.5, 8), Vector3.new(0.8, 3, 0.8), Enum.Material.Neon, Color3.fromRGB(255, 150, 180))
P("CrystalCeiling1", CFrame.new(-5, 14, 5), Vector3.new(1.5, 5, 1.5), Enum.Material.Neon, Color3.fromRGB(100, 200, 255))
P("CrystalCeiling2", CFrame.new(3, 14.5, -10), Vector3.new(1, 3.5, 1), Enum.Material.Neon, Color3.fromRGB(150, 100, 255))
P("ReflectingPool", CFrame.new(-3, 0.2, 8), Vector3.new(12, 0.3, 8), Enum.Material.Glass, Color3.fromRGB(80, 100, 160))
P("PoolRim", CFrame.new(-3, 0.35, 8), Vector3.new(13, 0.15, 9), Enum.Material.Slate, Color3.fromRGB(60, 55, 65))
P("Geode1Shell", CFrame.new(15, 1.5, -12), Vector3.new(4, 3, 3), Enum.Material.Slate, Color3.fromRGB(70, 65, 72))
P("Geode1Interior", CFrame.new(15, 1.5, -11.5), Vector3.new(3, 2.5, 2), Enum.Material.Neon, Color3.fromRGB(200, 100, 255))
P("Geode2Shell", CFrame.new(-15, 1, 14), Vector3.new(3, 2.5, 3), Enum.Material.Slate, Color3.fromRGB(68, 62, 70))
P("Geode2Interior", CFrame.new(-15, 1, 14.5), Vector3.new(2, 2, 2), Enum.Material.Neon, Color3.fromRGB(100, 255, 200))
P("LooseGem1", CFrame.new(0, 0.5, 0), Vector3.new(0.8, 0.8, 0.8), Enum.Material.Neon, Color3.fromRGB(255, 80, 120))
P("LooseGem2", CFrame.new(2, 0.4, 3), Vector3.new(0.6, 0.6, 0.6), Enum.Material.Neon, Color3.fromRGB(80, 255, 160))
P("StalagmiteBase", CFrame.new(-10, 1.5, -14), Vector3.new(2, 3, 2), Enum.Material.Slate, Color3.fromRGB(58, 52, 62))`,
  },
  {
    title: 'Lava River Crossing — stone platforms over lava, rope bridge, heat rocks',
    tags: ['lava', 'river', 'crossing', 'bridge', 'volcanic', 'platformer', 'obstacle'],
    description: 'A perilous lava river crossing with stone stepping platforms, a rope bridge, heat-scorched rocks, and glowing lava flow. 22 parts.',
    code: `local folder = getFolder("LavaRiverCrossing")
P("RiverBed", CFrame.new(0, 0.15, 0), Vector3.new(50, 0.3, 30), Enum.Material.Slate, Color3.fromRGB(40, 32, 28))
P("LavaFlow", CFrame.new(0, 0.35, 0), Vector3.new(50, 0.3, 18), Enum.Material.Neon, Color3.fromRGB(255, 80, 10))
local lavaG = P("LavaGlow", CFrame.new(0, 0.5, 0), Vector3.new(6, 0.2, 6), Enum.Material.Neon, Color3.fromRGB(255, 180, 40))
local lvg = Instance.new("PointLight"); lvg.Range = 40; lvg.Brightness = 2; lvg.Color = Color3.fromRGB(255, 100, 20); lvg.Parent = lavaG
P("BankNorth", CFrame.new(0, 1.5, -13), Vector3.new(50, 3, 8), Enum.Material.Slate, Color3.fromRGB(75, 65, 55))
P("BankSouth", CFrame.new(0, 1.5, 13), Vector3.new(50, 3, 8), Enum.Material.Slate, Color3.fromRGB(72, 62, 52))
P("Platform1", CFrame.new(-12, 1.5, -4), Vector3.new(5, 3, 4), Enum.Material.Slate, Color3.fromRGB(85, 75, 65))
P("Platform2", CFrame.new(-8, 1, 2), Vector3.new(4, 2, 4), Enum.Material.Slate, Color3.fromRGB(80, 70, 60))
P("Platform3", CFrame.new(-3, 1.3, -2), Vector3.new(4.5, 2.5, 3.5), Enum.Material.Slate, Color3.fromRGB(82, 72, 62))
P("Platform4", CFrame.new(4, 1, 3), Vector3.new(4, 2, 4), Enum.Material.Slate, Color3.fromRGB(78, 68, 58))
P("Platform5", CFrame.new(10, 1.5, -1), Vector3.new(5, 3, 4), Enum.Material.Slate, Color3.fromRGB(84, 74, 64))
P("BridgePostL", CFrame.new(15, 4, -9), Vector3.new(0.6, 5, 0.6), Enum.Material.Wood, Color3.fromRGB(90, 58, 25))
P("BridgePostR", CFrame.new(15, 4, 9), Vector3.new(0.6, 5, 0.6), Enum.Material.Wood, Color3.fromRGB(90, 58, 25))
P("BridgePlank1", CFrame.new(15, 1.5, -5), Vector3.new(3, 0.3, 1.5), Enum.Material.WoodPlanks, Color3.fromRGB(100, 65, 30))
P("BridgePlank2", CFrame.new(15, 1.5, -1), Vector3.new(3, 0.3, 1.5), Enum.Material.WoodPlanks, Color3.fromRGB(95, 62, 28))
P("BridgePlank3", CFrame.new(15, 1.5, 3), Vector3.new(3, 0.3, 1.5), Enum.Material.WoodPlanks, Color3.fromRGB(100, 65, 30))
P("RopeL", CFrame.new(15, 4, -4.5), Vector3.new(0.2, 0.2, 12), Enum.Material.Fabric, Color3.fromRGB(140, 110, 60))
P("RopeR", CFrame.new(15, 3, -4.5), Vector3.new(0.2, 0.2, 12), Enum.Material.Fabric, Color3.fromRGB(135, 105, 55))
P("ScorchedRock1", CFrame.new(-18, 1, 3), Vector3.new(3, 2, 2.5), Enum.Material.Slate, Color3.fromRGB(45, 35, 30))
P("ScorchedRock2", CFrame.new(20, 0.8, -3), Vector3.new(2.5, 1.5, 2), Enum.Material.Slate, Color3.fromRGB(48, 38, 32))
P("LavaBubble1", CFrame.new(-5, 0.6, 4), Vector3.new(1.5, 0.8, 1.5), Enum.Material.Neon, Color3.fromRGB(255, 120, 20))
P("LavaBubble2", CFrame.new(8, 0.5, -3), Vector3.new(1, 0.6, 1), Enum.Material.Neon, Color3.fromRGB(255, 140, 30))`,
  },
  {
    title: 'Ice Palace Entrance — ice walls, frozen pillars, snow floor',
    tags: ['ice', 'palace', 'frozen', 'winter', 'snow', 'castle', 'arctic'],
    description: 'An ice palace entrance with translucent ice walls, frozen crystal pillars, snow-covered ground, icicles, and cold blue glow. 22 parts.',
    code: `local folder = getFolder("IcePalaceEntrance")
P("SnowGround", CFrame.new(0, 0.25, 0), Vector3.new(50, 0.5, 40), Enum.Material.Concrete, Color3.fromRGB(235, 240, 248))
P("IceWallL", CFrame.new(-10, 8, -8), Vector3.new(2, 16, 16), Enum.Material.Glass, Color3.fromRGB(150, 200, 240))
P("IceWallR", CFrame.new(10, 8, -8), Vector3.new(2, 16, 16), Enum.Material.Glass, Color3.fromRGB(145, 195, 235))
P("IceArch", CFrame.new(0, 14, -8), Vector3.new(20, 3, 4), Enum.Material.Glass, Color3.fromRGB(160, 210, 245))
P("IceArchPeak", CFrame.new(0, 16, -8), Vector3.new(10, 2, 3), Enum.Material.Glass, Color3.fromRGB(170, 215, 250))
P("FrozenPillar1", CFrame.new(-6, 6, 5), Vector3.new(2, 12, 2), Enum.Material.Glass, Color3.fromRGB(140, 190, 235))
P("FrozenPillar2", CFrame.new(6, 6, 5), Vector3.new(2, 12, 2), Enum.Material.Glass, Color3.fromRGB(135, 185, 230))
P("PillarCap1", CFrame.new(-6, 12.25, 5), Vector3.new(3, 0.5, 3), Enum.Material.Glass, Color3.fromRGB(155, 205, 245))
P("PillarCap2", CFrame.new(6, 12.25, 5), Vector3.new(3, 0.5, 3), Enum.Material.Glass, Color3.fromRGB(155, 205, 245))
P("IceFloorTiles", CFrame.new(0, 0.35, -5), Vector3.new(18, 0.2, 12), Enum.Material.Glass, Color3.fromRGB(180, 215, 240))
P("SnowDrift1", CFrame.new(-15, 1, 10), Vector3.new(8, 2, 6), Enum.Material.Concrete, Color3.fromRGB(230, 235, 245))
P("SnowDrift2", CFrame.new(14, 0.8, 12), Vector3.new(6, 1.5, 5), Enum.Material.Concrete, Color3.fromRGB(228, 233, 242))
P("Icicle1", CFrame.new(-3, 13, -8), Vector3.new(0.5, 3, 0.5), Enum.Material.Glass, Color3.fromRGB(180, 220, 250))
P("Icicle2", CFrame.new(2, 12.5, -8), Vector3.new(0.4, 4, 0.4), Enum.Material.Glass, Color3.fromRGB(175, 215, 248))
P("Icicle3", CFrame.new(-1, 13.5, -8), Vector3.new(0.6, 2.5, 0.6), Enum.Material.Glass, Color3.fromRGB(185, 225, 252))
P("Icicle4", CFrame.new(4, 13, -8), Vector3.new(0.5, 3.5, 0.5), Enum.Material.Glass, Color3.fromRGB(178, 218, 248))
P("FrozenFountain", CFrame.new(0, 2, 5), Vector3.new(4, 4, 4), Enum.Material.Glass, Color3.fromRGB(160, 210, 245))
P("FrozenWaterSpout", CFrame.new(0, 4.5, 5), Vector3.new(1, 2, 1), Enum.Material.Glass, Color3.fromRGB(170, 220, 250))
P("IceBoulder", CFrame.new(-16, 2, -5), Vector3.new(5, 4, 4), Enum.Material.Glass, Color3.fromRGB(155, 200, 238))
local iceGlow = P("IceGlow", CFrame.new(0, 5, -8), Vector3.new(2, 2, 2), Enum.Material.Neon, Color3.fromRGB(120, 180, 255))
local igl = Instance.new("PointLight"); igl.Range = 30; igl.Brightness = 2; igl.Color = Color3.fromRGB(120, 180, 255); igl.Parent = iceGlow
P("FrostPattern", CFrame.new(8, 0.35, -3), Vector3.new(6, 0.05, 6), Enum.Material.Glass, Color3.fromRGB(200, 230, 255))`,
  },
  {
    title: 'Candy Land Path — candy cane posts, gumball boulders, frosting ground, lollipop trees',
    tags: ['candy', 'sweet', 'lollipop', 'gumball', 'whimsical', 'kids', 'fantasy'],
    description: 'A whimsical candy land path with candy cane posts, gumball boulders, frosting-textured ground, lollipop trees, and a gumdrop bridge. 26 parts.',
    code: `local folder = getFolder("CandyLand")
P("FrostingGround", CFrame.new(0, 0.25, 0), Vector3.new(50, 0.5, 40), Enum.Material.Concrete, Color3.fromRGB(255, 220, 230))
P("PathWay", CFrame.new(0, 0.4, 0), Vector3.new(8, 0.2, 40), Enum.Material.Concrete, Color3.fromRGB(255, 240, 200))
P("CanePost1Stripe1", CFrame.new(-6, 3, -12), Vector3.new(1, 6, 1), Enum.Material.Concrete, Color3.fromRGB(255, 50, 50))
P("CanePost1Stripe2", CFrame.new(-6, 3, -12), Vector3.new(1.1, 2, 1.1), Enum.Material.Concrete, Color3.fromRGB(255, 255, 255))
P("CanePost2Stripe1", CFrame.new(6, 3, -12), Vector3.new(1, 6, 1), Enum.Material.Concrete, Color3.fromRGB(255, 50, 50))
P("CanePost2Stripe2", CFrame.new(6, 3, -12), Vector3.new(1.1, 2, 1.1), Enum.Material.Concrete, Color3.fromRGB(255, 255, 255))
P("CanePost3", CFrame.new(-6, 3, 0), Vector3.new(1, 6, 1), Enum.Material.Concrete, Color3.fromRGB(255, 50, 50))
P("CanePost4", CFrame.new(6, 3, 0), Vector3.new(1, 6, 1), Enum.Material.Concrete, Color3.fromRGB(255, 50, 50))
P("GumballRed", CFrame.new(-14, 2.5, -5), Vector3.new(5, 5, 5), Enum.Material.Concrete, Color3.fromRGB(220, 40, 40))
P("GumballBlue", CFrame.new(12, 2, 8), Vector3.new(4, 4, 4), Enum.Material.Concrete, Color3.fromRGB(60, 120, 220))
P("GumballGreen", CFrame.new(-10, 1.5, 10), Vector3.new(3, 3, 3), Enum.Material.Concrete, Color3.fromRGB(60, 200, 80))
P("GumballYellow", CFrame.new(16, 1.5, -8), Vector3.new(3, 3, 3), Enum.Material.Concrete, Color3.fromRGB(255, 220, 50))
P("LollipopStick1", CFrame.new(-12, 4, 0), Vector3.new(0.5, 8, 0.5), Enum.Material.Wood, Color3.fromRGB(200, 180, 140))
P("LollipopHead1", CFrame.new(-12, 8.5, 0), Vector3.new(5, 5, 1), Enum.Material.Concrete, Color3.fromRGB(255, 100, 200))
P("LollipopSwirl1", CFrame.new(-12, 8.5, 0.3), Vector3.new(3, 3, 0.5), Enum.Material.Concrete, Color3.fromRGB(255, 255, 255))
P("LollipopStick2", CFrame.new(14, 3.5, -14), Vector3.new(0.5, 7, 0.5), Enum.Material.Wood, Color3.fromRGB(200, 180, 140))
P("LollipopHead2", CFrame.new(14, 7.5, -14), Vector3.new(4, 4, 1), Enum.Material.Concrete, Color3.fromRGB(100, 200, 255))
P("GumDropBridge1", CFrame.new(0, 0.8, 12), Vector3.new(3, 1.5, 2), Enum.Material.Concrete, Color3.fromRGB(200, 50, 180))
P("GumDropBridge2", CFrame.new(0, 0.8, 15), Vector3.new(3, 1.5, 2), Enum.Material.Concrete, Color3.fromRGB(50, 200, 100))
P("GumDropBridge3", CFrame.new(0, 0.8, 18), Vector3.new(3, 1.5, 2), Enum.Material.Concrete, Color3.fromRGB(255, 180, 50))
P("ChocolateRiver", CFrame.new(0, 0.15, 14), Vector3.new(6, 0.2, 12), Enum.Material.Concrete, Color3.fromRGB(80, 40, 20))
P("WhippedCreamHill1", CFrame.new(18, 2, 5), Vector3.new(6, 4, 6), Enum.Material.Concrete, Color3.fromRGB(255, 250, 245))
P("WhippedCreamHill2", CFrame.new(-18, 1.5, -12), Vector3.new(5, 3, 5), Enum.Material.Concrete, Color3.fromRGB(255, 248, 242))
P("CherryOnTop", CFrame.new(18, 4.5, 5), Vector3.new(1.5, 1.5, 1.5), Enum.Material.Concrete, Color3.fromRGB(200, 20, 30))
P("CookieFloor", CFrame.new(-5, 0.35, -18), Vector3.new(8, 0.15, 5), Enum.Material.WoodPlanks, Color3.fromRGB(190, 150, 90))
P("SprinklesDecor", CFrame.new(3, 0.5, 5), Vector3.new(0.5, 0.3, 0.5), Enum.Material.Neon, Color3.fromRGB(255, 100, 150))`,
  },
  {
    title: 'Mushroom Forest — giant mushrooms, mossy ground, fairy ring',
    tags: ['mushroom', 'forest', 'giant', 'fairy', 'moss', 'whimsical', 'fantasy'],
    description: 'A whimsical mushroom forest with giant mushrooms in varying sizes, mossy ground, a fairy ring of stones, and soft ambient glow. 24 parts.',
    code: `local folder = getFolder("MushroomForest")
P("MossyGround", CFrame.new(0, 0.15, 0), Vector3.new(50, 0.3, 50), Enum.Material.Grass, Color3.fromRGB(40, 85, 32))
P("MossThick", CFrame.new(-5, 0.25, 5), Vector3.new(15, 0.1, 12), Enum.Material.Grass, Color3.fromRGB(55, 105, 42))
P("GiantStem1", CFrame.new(0, 6, 0), Vector3.new(3, 12, 3), Enum.Material.Concrete, Color3.fromRGB(210, 200, 180))
P("GiantCap1", CFrame.new(0, 13, 0), Vector3.new(14, 3, 14), Enum.Material.Fabric, Color3.fromRGB(200, 50, 40))
P("GiantCapSpots1", CFrame.new(-2, 14.2, 2), Vector3.new(2, 0.3, 2), Enum.Material.Concrete, Color3.fromRGB(255, 255, 240))
P("GiantCapSpots2", CFrame.new(3, 14.2, -1), Vector3.new(1.5, 0.3, 1.5), Enum.Material.Concrete, Color3.fromRGB(255, 255, 240))
P("GiantStem2", CFrame.new(-14, 5, -10), Vector3.new(2.5, 10, 2.5), Enum.Material.Concrete, Color3.fromRGB(205, 195, 175))
P("GiantCap2", CFrame.new(-14, 11, -10), Vector3.new(12, 2.5, 12), Enum.Material.Fabric, Color3.fromRGB(180, 80, 160))
P("MedStem1", CFrame.new(12, 3.5, 8), Vector3.new(1.5, 7, 1.5), Enum.Material.Concrete, Color3.fromRGB(200, 190, 170))
P("MedCap1", CFrame.new(12, 7.5, 8), Vector3.new(8, 2, 8), Enum.Material.Fabric, Color3.fromRGB(220, 150, 50))
P("MedStem2", CFrame.new(8, 3, -14), Vector3.new(1.5, 6, 1.5), Enum.Material.Concrete, Color3.fromRGB(198, 188, 168))
P("MedCap2", CFrame.new(8, 6.5, -14), Vector3.new(7, 1.8, 7), Enum.Material.Fabric, Color3.fromRGB(60, 140, 200))
P("SmallShroom1Stem", CFrame.new(-8, 1.2, 12), Vector3.new(0.6, 2.2, 0.6), Enum.Material.Concrete, Color3.fromRGB(195, 185, 165))
P("SmallShroom1Cap", CFrame.new(-8, 2.5, 12), Vector3.new(2.5, 0.8, 2.5), Enum.Material.Fabric, Color3.fromRGB(255, 200, 80))
P("SmallShroom2Stem", CFrame.new(-6, 0.8, 14), Vector3.new(0.5, 1.5, 0.5), Enum.Material.Concrete, Color3.fromRGB(192, 182, 162))
P("SmallShroom2Cap", CFrame.new(-6, 1.7, 14), Vector3.new(1.8, 0.6, 1.8), Enum.Material.Fabric, Color3.fromRGB(100, 200, 80))
P("FairyStone1", CFrame.new(3, 0.6, 5), Vector3.new(1, 1, 1), Enum.Material.Slate, Color3.fromRGB(140, 135, 128))
P("FairyStone2", CFrame.new(5, 0.5, 4), Vector3.new(0.8, 0.8, 0.8), Enum.Material.Slate, Color3.fromRGB(145, 140, 132))
P("FairyStone3", CFrame.new(4.5, 0.5, 6.5), Vector3.new(0.9, 0.8, 0.9), Enum.Material.Slate, Color3.fromRGB(138, 132, 125))
P("FairyStone4", CFrame.new(2.5, 0.55, 7), Vector3.new(1, 0.9, 1), Enum.Material.Slate, Color3.fromRGB(142, 136, 130))
P("FairyStone5", CFrame.new(1.5, 0.5, 5.5), Vector3.new(0.8, 0.8, 0.8), Enum.Material.Slate, Color3.fromRGB(136, 130, 124))
local shroomGlow = P("GlowShroomCap", CFrame.new(18, 1.5, 0), Vector3.new(3, 0.8, 3), Enum.Material.Neon, Color3.fromRGB(100, 255, 180))
P("GlowShroomStem", CFrame.new(18, 0.7, 0), Vector3.new(0.6, 1.2, 0.6), Enum.Material.Concrete, Color3.fromRGB(190, 180, 160))
local gsl = Instance.new("PointLight"); gsl.Range = 15; gsl.Brightness = 1.5; gsl.Color = Color3.fromRGB(100, 255, 180); gsl.Parent = shroomGlow`,
  },
  {
    title: "Dragon's Lair — treasure pile, scorch marks, bone pile, large nest",
    tags: ['dragon', 'lair', 'treasure', 'bones', 'nest', 'cave', 'fantasy'],
    description: "A dragon's lair cavern with a massive treasure pile, scorched walls, bone piles, a huge nest, and glowing embers. 24 parts.",
    code: `local folder = getFolder("DragonsLair")
P("CavernFloor", CFrame.new(0, 0.15, 0), Vector3.new(45, 0.3, 45), Enum.Material.Slate, Color3.fromRGB(55, 48, 42))
P("CavernWallBack", CFrame.new(0, 10, -22), Vector3.new(45, 20, 2), Enum.Material.Slate, Color3.fromRGB(50, 44, 38))
P("CavernWallL", CFrame.new(-22, 10, 0), Vector3.new(2, 20, 45), Enum.Material.Slate, Color3.fromRGB(48, 42, 36))
P("CavernWallR", CFrame.new(22, 10, 0), Vector3.new(2, 20, 45), Enum.Material.Slate, Color3.fromRGB(52, 46, 40))
P("CavernCeiling", CFrame.new(0, 20.5, 0), Vector3.new(45, 1, 45), Enum.Material.Slate, Color3.fromRGB(42, 38, 32))
P("TreasurePileGold", CFrame.new(-5, 2, -8), Vector3.new(10, 4, 8), Enum.Material.Metal, Color3.fromRGB(220, 190, 50))
P("TreasurePileCoins", CFrame.new(-3, 1, -5), Vector3.new(6, 1.5, 5), Enum.Material.Metal, Color3.fromRGB(230, 200, 60))
P("TreasureGemRed", CFrame.new(-6, 3.5, -9), Vector3.new(1, 1, 1), Enum.Material.Neon, Color3.fromRGB(220, 30, 40))
P("TreasureGemBlue", CFrame.new(-3, 3, -10), Vector3.new(0.8, 0.8, 0.8), Enum.Material.Neon, Color3.fromRGB(40, 80, 220))
P("TreasureChest", CFrame.new(-8, 1.5, -6), Vector3.new(3, 2.5, 2), Enum.Material.Wood, Color3.fromRGB(100, 60, 25))
P("ScorchMark1", CFrame.new(5, 0.2, 5), Vector3.new(8, 0.05, 12), Enum.Material.Slate, Color3.fromRGB(25, 20, 18))
P("ScorchMark2", CFrame.new(-10, 0.2, 10), Vector3.new(6, 0.05, 8), Enum.Material.Slate, Color3.fromRGB(28, 22, 20))
P("ScorchedWall", CFrame.new(0, 5, -21.5), Vector3.new(12, 8, 0.5), Enum.Material.Slate, Color3.fromRGB(30, 25, 22))
P("BonePile1", CFrame.new(12, 0.8, -10), Vector3.new(4, 1.5, 3), Enum.Material.Concrete, Color3.fromRGB(220, 215, 200))
P("BoneLarge", CFrame.new(14, 1, -8) * CFrame.Angles(0, math.rad(30), math.rad(15)), Vector3.new(5, 0.8, 0.8), Enum.Material.Concrete, Color3.fromRGB(215, 210, 195))
P("Skull", CFrame.new(11, 1.2, -12), Vector3.new(2, 1.8, 2), Enum.Material.Concrete, Color3.fromRGB(225, 220, 205))
P("NestBase", CFrame.new(10, 1, 10), Vector3.new(12, 2, 10), Enum.Material.Wood, Color3.fromRGB(80, 55, 28))
P("NestRimBack", CFrame.new(10, 3, 15), Vector3.new(12, 2, 1.5), Enum.Material.Wood, Color3.fromRGB(75, 50, 25))
P("NestRimSide", CFrame.new(16, 3, 10), Vector3.new(1.5, 2, 10), Enum.Material.Wood, Color3.fromRGB(78, 52, 26))
P("DragonEgg1", CFrame.new(9, 2.5, 11), Vector3.new(2, 3, 2), Enum.Material.Metal, Color3.fromRGB(80, 30, 30))
P("DragonEgg2", CFrame.new(12, 2.5, 10), Vector3.new(2, 3, 2), Enum.Material.Metal, Color3.fromRGB(30, 80, 50))
local ember1 = P("Ember1", CFrame.new(3, 0.4, 8), Vector3.new(0.8, 0.5, 0.8), Enum.Material.Neon, Color3.fromRGB(255, 100, 20))
local eb1 = Instance.new("PointLight"); eb1.Range = 10; eb1.Brightness = 1; eb1.Color = Color3.fromRGB(255, 100, 20); eb1.Parent = ember1
P("Ember2", CFrame.new(-8, 0.3, 12), Vector3.new(0.5, 0.3, 0.5), Enum.Material.Neon, Color3.fromRGB(255, 80, 10))`,
  },
  {
    title: "Wizard's Study — desk with books, potion shelves, crystal ball, floating candles",
    tags: ['wizard', 'study', 'magic', 'potions', 'books', 'crystal', 'fantasy', 'room'],
    description: "A wizard's study room with a grand desk, stacked books, potion shelf, glowing crystal ball, floating candles, and arcane rug. 28 parts.",
    code: `local folder = getFolder("WizardStudy")
P("StoneFloor", CFrame.new(0, 0.15, 0), Vector3.new(20, 0.3, 20), Enum.Material.Cobblestone, Color3.fromRGB(100, 95, 85))
P("WallBack", CFrame.new(0, 6, -10), Vector3.new(20, 12, 0.5), Enum.Material.Cobblestone, Color3.fromRGB(95, 90, 80))
P("WallLeft", CFrame.new(-10, 6, 0), Vector3.new(0.5, 12, 19.5), Enum.Material.Cobblestone, Color3.fromRGB(92, 88, 78))
P("WallRight", CFrame.new(10, 6, 0), Vector3.new(0.5, 12, 19.5), Enum.Material.Cobblestone, Color3.fromRGB(98, 92, 82))
P("Ceiling", CFrame.new(0, 12.25, 0), Vector3.new(20, 0.5, 20), Enum.Material.Wood, Color3.fromRGB(80, 55, 28))
P("DeskTop", CFrame.new(-3, 3.5, -6), Vector3.new(8, 0.4, 4), Enum.Material.Wood, Color3.fromRGB(100, 65, 30))
P("DeskLegFL", CFrame.new(-6.5, 1.75, -4.5), Vector3.new(0.5, 3.5, 0.5), Enum.Material.Wood, Color3.fromRGB(90, 58, 25))
P("DeskLegFR", CFrame.new(0.5, 1.75, -4.5), Vector3.new(0.5, 3.5, 0.5), Enum.Material.Wood, Color3.fromRGB(90, 58, 25))
P("DeskLegBL", CFrame.new(-6.5, 1.75, -7.5), Vector3.new(0.5, 3.5, 0.5), Enum.Material.Wood, Color3.fromRGB(90, 58, 25))
P("DeskLegBR", CFrame.new(0.5, 1.75, -7.5), Vector3.new(0.5, 3.5, 0.5), Enum.Material.Wood, Color3.fromRGB(90, 58, 25))
P("BookStack1", CFrame.new(-5, 4.2, -6), Vector3.new(1.5, 1, 2), Enum.Material.Fabric, Color3.fromRGB(140, 40, 30))
P("BookStack2", CFrame.new(-4, 4.4, -6.5), Vector3.new(2, 1.2, 1.5), Enum.Material.Fabric, Color3.fromRGB(30, 60, 120))
P("BookSingle", CFrame.new(-1, 4, -5.5) * CFrame.Angles(0, math.rad(20), 0), Vector3.new(1.5, 0.3, 1), Enum.Material.Fabric, Color3.fromRGB(50, 100, 40))
P("PotionShelf", CFrame.new(8, 4, -9), Vector3.new(3, 8, 1.5), Enum.Material.Wood, Color3.fromRGB(85, 55, 25))
P("PotionBottle1", CFrame.new(7.5, 5, -9), Vector3.new(0.4, 0.8, 0.4), Enum.Material.Glass, Color3.fromRGB(100, 200, 80))
P("PotionBottle2", CFrame.new(8.3, 5, -9), Vector3.new(0.4, 0.8, 0.4), Enum.Material.Glass, Color3.fromRGB(200, 60, 180))
P("PotionBottle3", CFrame.new(7.8, 7, -9), Vector3.new(0.4, 0.8, 0.4), Enum.Material.Glass, Color3.fromRGB(60, 120, 220))
P("CrystalBallBase", CFrame.new(-2, 3.9, -7), Vector3.new(1.5, 0.3, 1.5), Enum.Material.Metal, Color3.fromRGB(80, 70, 60))
local crystalBall = P("CrystalBall", CFrame.new(-2, 4.7, -7), Vector3.new(1.2, 1.2, 1.2), Enum.Material.Neon, Color3.fromRGB(150, 100, 255))
local cbl = Instance.new("PointLight"); cbl.Range = 12; cbl.Brightness = 1.5; cbl.Color = Color3.fromRGB(150, 100, 255); cbl.Parent = crystalBall
P("ArcaneRug", CFrame.new(0, 0.2, 2), Vector3.new(8, 0.05, 6), Enum.Material.Fabric, Color3.fromRGB(100, 30, 50))
P("RugPattern", CFrame.new(0, 0.22, 2), Vector3.new(5, 0.03, 3.5), Enum.Material.Fabric, Color3.fromRGB(180, 150, 50))
local candle1 = P("FloatingCandle1", CFrame.new(-5, 8, 2), Vector3.new(0.3, 1, 0.3), Enum.Material.Neon, Color3.fromRGB(255, 220, 100))
local fc1 = Instance.new("PointLight"); fc1.Range = 10; fc1.Brightness = 1; fc1.Color = Color3.fromRGB(255, 200, 80); fc1.Parent = candle1
P("FloatingCandle2", CFrame.new(3, 9, -3), Vector3.new(0.3, 1, 0.3), Enum.Material.Neon, Color3.fromRGB(255, 215, 95))
P("FloatingCandle3", CFrame.new(0, 7.5, 5), Vector3.new(0.3, 1, 0.3), Enum.Material.Neon, Color3.fromRGB(255, 225, 105))
P("ScrollRack", CFrame.new(-9, 3, 5), Vector3.new(1.5, 6, 1.5), Enum.Material.Wood, Color3.fromRGB(88, 56, 26))
P("GlobeStand", CFrame.new(6, 2, 5), Vector3.new(0.5, 4, 0.5), Enum.Material.Wood, Color3.fromRGB(82, 52, 22))
P("Globe", CFrame.new(6, 4.5, 5), Vector3.new(2, 2, 2), Enum.Material.Concrete, Color3.fromRGB(60, 120, 80))`,
  },
  {
    title: 'Dungeon Room — stone walls, barred door, torch sconces, chains, drain',
    tags: ['dungeon', 'prison', 'dark', 'medieval', 'chains', 'torch', 'room'],
    description: 'A dark dungeon room with thick stone walls, barred iron door, wall-mounted torch sconces, hanging chains, floor drain, and straw. 22 parts.',
    code: `local folder = getFolder("DungeonRoom")
P("StoneFloor", CFrame.new(0, 0.15, 0), Vector3.new(16, 0.3, 16), Enum.Material.Cobblestone, Color3.fromRGB(70, 65, 58))
P("WallN", CFrame.new(0, 5, -8), Vector3.new(16, 10, 1), Enum.Material.Cobblestone, Color3.fromRGB(65, 60, 52))
P("WallS", CFrame.new(0, 5, 8), Vector3.new(16, 10, 1), Enum.Material.Cobblestone, Color3.fromRGB(62, 58, 50))
P("WallE", CFrame.new(8, 5, 0), Vector3.new(1, 10, 15), Enum.Material.Cobblestone, Color3.fromRGB(68, 62, 55))
P("WallW", CFrame.new(-8, 5, 0), Vector3.new(1, 10, 15), Enum.Material.Cobblestone, Color3.fromRGB(66, 60, 53))
P("Ceiling", CFrame.new(0, 10.25, 0), Vector3.new(16, 0.5, 16), Enum.Material.Cobblestone, Color3.fromRGB(58, 54, 48))
P("BarredDoor", CFrame.new(0, 4, 7.6), Vector3.new(4, 8, 0.3), Enum.Material.Metal, Color3.fromRGB(50, 48, 45))
P("DoorBar1", CFrame.new(-1, 4, 7.4), Vector3.new(0.3, 8, 0.3), Enum.Material.Metal, Color3.fromRGB(55, 52, 48))
P("DoorBar2", CFrame.new(0, 4, 7.4), Vector3.new(0.3, 8, 0.3), Enum.Material.Metal, Color3.fromRGB(55, 52, 48))
P("DoorBar3", CFrame.new(1, 4, 7.4), Vector3.new(0.3, 8, 0.3), Enum.Material.Metal, Color3.fromRGB(55, 52, 48))
P("TorchSconce1", CFrame.new(-7.3, 5, -4), Vector3.new(0.5, 0.5, 0.8), Enum.Material.Metal, Color3.fromRGB(60, 55, 50))
local torch1 = P("TorchFlame1", CFrame.new(-7.3, 5.8, -4), Vector3.new(0.4, 0.6, 0.4), Enum.Material.Neon, Color3.fromRGB(255, 160, 40))
local dt1 = Instance.new("PointLight"); dt1.Range = 15; dt1.Brightness = 1.5; dt1.Color = Color3.fromRGB(255, 150, 40); dt1.Parent = torch1
P("TorchSconce2", CFrame.new(7.3, 5, 3), Vector3.new(0.5, 0.5, 0.8), Enum.Material.Metal, Color3.fromRGB(60, 55, 50))
P("TorchFlame2", CFrame.new(7.3, 5.8, 3), Vector3.new(0.4, 0.6, 0.4), Enum.Material.Neon, Color3.fromRGB(255, 160, 40))
P("ChainHang1", CFrame.new(-3, 7, -6), Vector3.new(0.2, 5, 0.2), Enum.Material.Metal, Color3.fromRGB(80, 78, 72))
P("ChainHang2", CFrame.new(5, 8, -5), Vector3.new(0.2, 4, 0.2), Enum.Material.Metal, Color3.fromRGB(78, 75, 70))
P("Shackle", CFrame.new(-3, 4.5, -6), Vector3.new(0.8, 0.3, 0.8), Enum.Material.Metal, Color3.fromRGB(75, 72, 68))
P("FloorDrain", CFrame.new(2, 0.12, 2), Vector3.new(2, 0.1, 2), Enum.Material.Metal, Color3.fromRGB(45, 42, 38))
P("StrawPile", CFrame.new(-5, 0.3, -5), Vector3.new(3, 0.3, 3), Enum.Material.Grass, Color3.fromRGB(180, 160, 80))
P("WaterPuddle", CFrame.new(4, 0.18, -3), Vector3.new(2, 0.05, 3), Enum.Material.Glass, Color3.fromRGB(60, 70, 80))
P("BrokenBucket", CFrame.new(5, 0.6, 5), Vector3.new(1, 1.2, 1), Enum.Material.Wood, Color3.fromRGB(90, 60, 30))`,
  },
  {
    title: 'Throne Room — grand throne, red carpet, pillars, banners, chandelier',
    tags: ['throne', 'room', 'castle', 'royal', 'medieval', 'king', 'palace'],
    description: 'A grand throne room with an ornate throne on a dais, red carpet runner, stone pillars, hanging banners, and a chandelier. 30 parts.',
    code: `local folder = getFolder("ThroneRoom")
P("MarbleFloor", CFrame.new(0, 0.15, 0), Vector3.new(30, 0.3, 40), Enum.Material.Concrete, Color3.fromRGB(200, 195, 185))
P("RedCarpet", CFrame.new(0, 0.25, 5), Vector3.new(6, 0.1, 30), Enum.Material.Fabric, Color3.fromRGB(160, 30, 30))
P("DaisStep1", CFrame.new(0, 0.5, -14), Vector3.new(14, 0.6, 8), Enum.Material.Concrete, Color3.fromRGB(190, 185, 175))
P("DaisStep2", CFrame.new(0, 1.1, -16), Vector3.new(10, 0.6, 5), Enum.Material.Concrete, Color3.fromRGB(195, 190, 180))
P("ThroneSeat", CFrame.new(0, 2.5, -17), Vector3.new(4, 1, 3), Enum.Material.Wood, Color3.fromRGB(100, 35, 25))
P("ThroneBack", CFrame.new(0, 5.5, -18), Vector3.new(4, 6, 0.8), Enum.Material.Wood, Color3.fromRGB(105, 38, 28))
P("ThroneArmL", CFrame.new(-2, 3.2, -17), Vector3.new(0.6, 1, 3), Enum.Material.Wood, Color3.fromRGB(100, 35, 25))
P("ThroneArmR", CFrame.new(2, 3.2, -17), Vector3.new(0.6, 1, 3), Enum.Material.Wood, Color3.fromRGB(100, 35, 25))
P("ThroneCrown", CFrame.new(0, 8.8, -18), Vector3.new(3, 1, 0.5), Enum.Material.Metal, Color3.fromRGB(220, 190, 50))
P("ThroneGem", CFrame.new(0, 8, -18), Vector3.new(0.8, 0.8, 0.3), Enum.Material.Neon, Color3.fromRGB(200, 30, 40))
P("ThroneCushion", CFrame.new(0, 2.8, -17), Vector3.new(3.5, 0.5, 2.5), Enum.Material.Fabric, Color3.fromRGB(140, 25, 25))
P("PillarL1", CFrame.new(-12, 7, -5), Vector3.new(2, 14, 2), Enum.Material.Concrete, Color3.fromRGB(195, 190, 180))
P("PillarL2", CFrame.new(-12, 7, 8), Vector3.new(2, 14, 2), Enum.Material.Concrete, Color3.fromRGB(195, 190, 180))
P("PillarR1", CFrame.new(12, 7, -5), Vector3.new(2, 14, 2), Enum.Material.Concrete, Color3.fromRGB(195, 190, 180))
P("PillarR2", CFrame.new(12, 7, 8), Vector3.new(2, 14, 2), Enum.Material.Concrete, Color3.fromRGB(195, 190, 180))
P("WallBack", CFrame.new(0, 8, -20), Vector3.new(30, 16, 1), Enum.Material.Cobblestone, Color3.fromRGB(120, 115, 105))
P("WallL", CFrame.new(-15, 8, 0), Vector3.new(1, 16, 40), Enum.Material.Cobblestone, Color3.fromRGB(118, 112, 102))
P("WallR", CFrame.new(15, 8, 0), Vector3.new(1, 16, 40), Enum.Material.Cobblestone, Color3.fromRGB(115, 110, 100))
P("Ceiling", CFrame.new(0, 16.25, 0), Vector3.new(30, 0.5, 40), Enum.Material.Wood, Color3.fromRGB(90, 60, 30))
P("BannerL1", CFrame.new(-14.3, 10, -5), Vector3.new(0.1, 8, 3), Enum.Material.Fabric, Color3.fromRGB(150, 25, 25))
P("BannerL2", CFrame.new(-14.3, 10, 8), Vector3.new(0.1, 8, 3), Enum.Material.Fabric, Color3.fromRGB(150, 25, 25))
P("BannerR1", CFrame.new(14.3, 10, -5), Vector3.new(0.1, 8, 3), Enum.Material.Fabric, Color3.fromRGB(150, 25, 25))
P("BannerR2", CFrame.new(14.3, 10, 8), Vector3.new(0.1, 8, 3), Enum.Material.Fabric, Color3.fromRGB(150, 25, 25))
P("BannerCrest1", CFrame.new(-14.25, 10, -5), Vector3.new(0.08, 3, 1.5), Enum.Material.Fabric, Color3.fromRGB(220, 190, 50))
P("BannerCrest2", CFrame.new(14.25, 10, -5), Vector3.new(0.08, 3, 1.5), Enum.Material.Fabric, Color3.fromRGB(220, 190, 50))
P("ChandelierRing", CFrame.new(0, 14, 0), Vector3.new(6, 0.5, 6), Enum.Material.Metal, Color3.fromRGB(180, 160, 50))
P("ChandelierChain", CFrame.new(0, 15.5, 0), Vector3.new(0.2, 3, 0.2), Enum.Material.Metal, Color3.fromRGB(170, 150, 45))
local chandelierLight = P("ChandelierGlow", CFrame.new(0, 14, 0), Vector3.new(2, 1, 2), Enum.Material.Neon, Color3.fromRGB(255, 220, 120))
local chl = Instance.new("PointLight"); chl.Range = 35; chl.Brightness = 2.5; chl.Color = Color3.fromRGB(255, 210, 100); chl.Parent = chandelierLight
P("WindowArch", CFrame.new(14.5, 10, 0), Vector3.new(0.3, 6, 4), Enum.Material.Glass, Color3.fromRGB(180, 200, 230))`,
  },
  {
    title: 'Treasure Room — gold pile, gem clusters, treasure chests, crown display',
    tags: ['treasure', 'gold', 'gems', 'riches', 'vault', 'loot', 'fantasy'],
    description: 'A treasure vault room overflowing with gold piles, gem clusters, ornate treasure chests, a crown on a pedestal, and torchlight. 26 parts.',
    code: `local folder = getFolder("TreasureRoom")
P("VaultFloor", CFrame.new(0, 0.15, 0), Vector3.new(24, 0.3, 24), Enum.Material.Cobblestone, Color3.fromRGB(80, 75, 65))
P("VaultWallN", CFrame.new(0, 6, -12), Vector3.new(24, 12, 1), Enum.Material.Cobblestone, Color3.fromRGB(75, 70, 60))
P("VaultWallS", CFrame.new(0, 6, 12), Vector3.new(24, 12, 1), Enum.Material.Cobblestone, Color3.fromRGB(72, 68, 58))
P("VaultWallE", CFrame.new(12, 6, 0), Vector3.new(1, 12, 23), Enum.Material.Cobblestone, Color3.fromRGB(78, 72, 62))
P("VaultWallW", CFrame.new(-12, 6, 0), Vector3.new(1, 12, 23), Enum.Material.Cobblestone, Color3.fromRGB(76, 70, 60))
P("VaultCeiling", CFrame.new(0, 12.25, 0), Vector3.new(24, 0.5, 24), Enum.Material.Cobblestone, Color3.fromRGB(68, 64, 55))
P("GoldPileMain", CFrame.new(-4, 2.5, -5), Vector3.new(10, 5, 8), Enum.Material.Metal, Color3.fromRGB(225, 195, 55))
P("GoldPileSpill", CFrame.new(-1, 1, -1), Vector3.new(6, 1.5, 5), Enum.Material.Metal, Color3.fromRGB(230, 200, 60))
P("GoldPileSmall", CFrame.new(6, 1, 5), Vector3.new(4, 2, 4), Enum.Material.Metal, Color3.fromRGB(220, 190, 50))
P("GemClusterRuby", CFrame.new(-8, 3.5, -7), Vector3.new(1.5, 2, 1.5), Enum.Material.Neon, Color3.fromRGB(220, 30, 40))
P("GemClusterEmerald", CFrame.new(-2, 3, -8), Vector3.new(1, 1.5, 1), Enum.Material.Neon, Color3.fromRGB(30, 200, 60))
P("GemClusterSapphire", CFrame.new(5, 2, 3), Vector3.new(1.2, 1.8, 1.2), Enum.Material.Neon, Color3.fromRGB(40, 80, 220))
P("GemClusterAmethyst", CFrame.new(8, 1.5, 7), Vector3.new(1, 1.5, 1), Enum.Material.Neon, Color3.fromRGB(160, 50, 200))
P("Chest1Base", CFrame.new(8, 1.2, -8), Vector3.new(3, 2, 2), Enum.Material.Wood, Color3.fromRGB(100, 60, 25))
P("Chest1Lid", CFrame.new(8, 2.5, -8.5) * CFrame.Angles(math.rad(-30), 0, 0), Vector3.new(3, 0.3, 2), Enum.Material.Wood, Color3.fromRGB(105, 65, 28))
P("Chest1Band", CFrame.new(8, 1.2, -8), Vector3.new(3.2, 0.3, 0.3), Enum.Material.Metal, Color3.fromRGB(180, 160, 45))
P("Chest2", CFrame.new(-8, 1, 6), Vector3.new(2.5, 1.8, 1.8), Enum.Material.Wood, Color3.fromRGB(95, 58, 22))
P("Chest2Band", CFrame.new(-8, 1, 6), Vector3.new(2.7, 0.3, 0.3), Enum.Material.Metal, Color3.fromRGB(175, 155, 42))
P("Pedestal", CFrame.new(0, 2, -10), Vector3.new(2, 4, 2), Enum.Material.Concrete, Color3.fromRGB(160, 155, 145))
P("CrownBase", CFrame.new(0, 4.3, -10), Vector3.new(1.2, 0.5, 1.2), Enum.Material.Metal, Color3.fromRGB(225, 200, 55))
P("CrownGem", CFrame.new(0, 4.8, -10), Vector3.new(0.4, 0.4, 0.4), Enum.Material.Neon, Color3.fromRGB(220, 30, 40))
P("CoinTrail1", CFrame.new(2, 0.25, 3), Vector3.new(2, 0.2, 0.5), Enum.Material.Metal, Color3.fromRGB(218, 188, 48))
P("CoinTrail2", CFrame.new(3, 0.25, 1), Vector3.new(1.5, 0.2, 0.5), Enum.Material.Metal, Color3.fromRGB(215, 185, 45))
local vaultTorch1 = P("VaultTorch1", CFrame.new(-11.3, 6, -5), Vector3.new(0.5, 0.8, 0.5), Enum.Material.Neon, Color3.fromRGB(255, 180, 50))
local vt1 = Instance.new("PointLight"); vt1.Range = 20; vt1.Brightness = 2; vt1.Color = Color3.fromRGB(255, 170, 40); vt1.Parent = vaultTorch1
P("VaultTorch2", CFrame.new(11.3, 6, 5), Vector3.new(0.5, 0.8, 0.5), Enum.Material.Neon, Color3.fromRGB(255, 180, 50))`,
  },
  {
    title: 'Race Track Curve — banked curve section, barriers, tire wall, arrow signs',
    tags: ['race', 'track', 'racing', 'curve', 'car', 'motorsport', 'barrier'],
    description: 'A banked racing curve section with asphalt track, concrete barriers, tire wall on the outside, directional arrow signs, and rumble strips. 22 parts.',
    code: `local folder = getFolder("RaceTrackCurve")
P("TrackSurface", CFrame.new(0, 0.1, 0), Vector3.new(40, 0.2, 40), Enum.Material.Concrete, Color3.fromRGB(55, 55, 58))
P("TrackBank", CFrame.new(15, 0.5, 0) * CFrame.Angles(0, 0, math.rad(-8)), Vector3.new(15, 0.2, 40), Enum.Material.Concrete, Color3.fromRGB(50, 50, 53))
P("WhiteLine1", CFrame.new(-5, 0.15, 0), Vector3.new(0.4, 0.05, 40), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))
P("WhiteLine2", CFrame.new(5, 0.15, 0), Vector3.new(0.4, 0.05, 40), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))
P("YellowCenter", CFrame.new(0, 0.15, 0), Vector3.new(0.3, 0.05, 40), Enum.Material.Concrete, Color3.fromRGB(240, 200, 40))
P("BarrierInner1", CFrame.new(-18, 1.5, -10), Vector3.new(1, 3, 12), Enum.Material.Concrete, Color3.fromRGB(180, 175, 168))
P("BarrierInner2", CFrame.new(-18, 1.5, 10), Vector3.new(1, 3, 12), Enum.Material.Concrete, Color3.fromRGB(180, 175, 168))
P("BarrierRedStripe1", CFrame.new(-18, 2.5, -10), Vector3.new(1.1, 0.5, 12), Enum.Material.Concrete, Color3.fromRGB(200, 40, 35))
P("BarrierRedStripe2", CFrame.new(-18, 2.5, 10), Vector3.new(1.1, 0.5, 12), Enum.Material.Concrete, Color3.fromRGB(200, 40, 35))
P("TireWall1", CFrame.new(20, 1, -12), Vector3.new(2, 2, 4), Enum.Material.Concrete, Color3.fromRGB(30, 30, 32))
P("TireWall2", CFrame.new(20, 1, -6), Vector3.new(2, 2, 4), Enum.Material.Concrete, Color3.fromRGB(28, 28, 30))
P("TireWall3", CFrame.new(20, 1, 0), Vector3.new(2, 2, 4), Enum.Material.Concrete, Color3.fromRGB(30, 30, 32))
P("TireWall4", CFrame.new(20, 1, 6), Vector3.new(2, 2, 4), Enum.Material.Concrete, Color3.fromRGB(28, 28, 30))
P("TireWall5", CFrame.new(20, 1, 12), Vector3.new(2, 2, 4), Enum.Material.Concrete, Color3.fromRGB(30, 30, 32))
P("ArrowSign1Post", CFrame.new(18, 3, -15), Vector3.new(0.5, 6, 0.5), Enum.Material.Metal, Color3.fromRGB(120, 118, 112))
P("ArrowSign1", CFrame.new(18, 5, -15), Vector3.new(3, 2, 0.2), Enum.Material.Metal, Color3.fromRGB(255, 200, 40))
P("ArrowSign2Post", CFrame.new(18, 3, 15), Vector3.new(0.5, 6, 0.5), Enum.Material.Metal, Color3.fromRGB(120, 118, 112))
P("ArrowSign2", CFrame.new(18, 5, 15), Vector3.new(3, 2, 0.2), Enum.Material.Metal, Color3.fromRGB(255, 200, 40))
P("RumbleStripL", CFrame.new(-12, 0.15, 0), Vector3.new(2, 0.1, 40), Enum.Material.Concrete, Color3.fromRGB(200, 50, 40))
P("RumbleStripR", CFrame.new(12, 0.15, 0), Vector3.new(2, 0.1, 40), Enum.Material.Concrete, Color3.fromRGB(200, 50, 40))
P("GravelRunoff", CFrame.new(-22, 0.08, 0), Vector3.new(6, 0.15, 40), Enum.Material.Slate, Color3.fromRGB(140, 135, 125))
P("CatchFence", CFrame.new(22, 3, 0), Vector3.new(0.2, 6, 40), Enum.Material.Metal, Color3.fromRGB(150, 148, 142))`,
  },
  {
    title: 'Soccer Field — pitch markings, 2 goals, center circle, corner flags',
    tags: ['soccer', 'football', 'field', 'pitch', 'sport', 'goal', 'game'],
    description: 'A soccer field with green pitch, white line markings, two goals with nets, center circle, and corner flags. 26 parts.',
    code: `local folder = getFolder("SoccerField")
P("Pitch", CFrame.new(0, 0.15, 0), Vector3.new(60, 0.3, 40), Enum.Material.Grass, Color3.fromRGB(50, 120, 40))
P("PitchStripeLight", CFrame.new(0, 0.18, 0), Vector3.new(10, 0.05, 40), Enum.Material.Grass, Color3.fromRGB(55, 130, 45))
P("SidelineN", CFrame.new(0, 0.2, -20), Vector3.new(60, 0.05, 0.3), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))
P("SidelineS", CFrame.new(0, 0.2, 20), Vector3.new(60, 0.05, 0.3), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))
P("EndlineW", CFrame.new(-30, 0.2, 0), Vector3.new(0.3, 0.05, 40), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))
P("EndlineE", CFrame.new(30, 0.2, 0), Vector3.new(0.3, 0.05, 40), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))
P("CenterLine", CFrame.new(0, 0.2, 0), Vector3.new(0.3, 0.05, 40), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))
P("CenterCircle", CFrame.new(0, 0.2, 0), Vector3.new(14, 0.03, 14), Enum.Material.Concrete, Color3.fromRGB(235, 235, 235))
P("CenterSpot", CFrame.new(0, 0.22, 0), Vector3.new(0.5, 0.03, 0.5), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))
P("GoalPostLW", CFrame.new(-30, 2, -3.5), Vector3.new(0.4, 4, 0.4), Enum.Material.Metal, Color3.fromRGB(240, 240, 240))
P("GoalPostRW", CFrame.new(-30, 2, 3.5), Vector3.new(0.4, 4, 0.4), Enum.Material.Metal, Color3.fromRGB(240, 240, 240))
P("GoalCrossbarW", CFrame.new(-30, 4.2, 0), Vector3.new(0.4, 0.4, 7.4), Enum.Material.Metal, Color3.fromRGB(240, 240, 240))
P("GoalNetW", CFrame.new(-32, 2, 0), Vector3.new(0.1, 4, 7), Enum.Material.Fabric, Color3.fromRGB(230, 230, 230))
P("GoalNetTopW", CFrame.new(-31, 4.2, 0), Vector3.new(2, 0.1, 7), Enum.Material.Fabric, Color3.fromRGB(230, 230, 230))
P("GoalPostLE", CFrame.new(30, 2, -3.5), Vector3.new(0.4, 4, 0.4), Enum.Material.Metal, Color3.fromRGB(240, 240, 240))
P("GoalPostRE", CFrame.new(30, 2, 3.5), Vector3.new(0.4, 4, 0.4), Enum.Material.Metal, Color3.fromRGB(240, 240, 240))
P("GoalCrossbarE", CFrame.new(30, 4.2, 0), Vector3.new(0.4, 0.4, 7.4), Enum.Material.Metal, Color3.fromRGB(240, 240, 240))
P("GoalNetE", CFrame.new(32, 2, 0), Vector3.new(0.1, 4, 7), Enum.Material.Fabric, Color3.fromRGB(230, 230, 230))
P("GoalNetTopE", CFrame.new(31, 4.2, 0), Vector3.new(2, 0.1, 7), Enum.Material.Fabric, Color3.fromRGB(230, 230, 230))
P("PenaltyBoxW", CFrame.new(-24, 0.2, 0), Vector3.new(0.3, 0.05, 20), Enum.Material.Concrete, Color3.fromRGB(238, 238, 238))
P("PenaltyBoxE", CFrame.new(24, 0.2, 0), Vector3.new(0.3, 0.05, 20), Enum.Material.Concrete, Color3.fromRGB(238, 238, 238))
P("CornerFlagNW", CFrame.new(-30, 2.5, -20), Vector3.new(0.2, 5, 0.2), Enum.Material.Metal, Color3.fromRGB(240, 240, 240))
P("CornerFlagFabricNW", CFrame.new(-30, 4.5, -19.6), Vector3.new(0.05, 1, 0.8), Enum.Material.Fabric, Color3.fromRGB(255, 50, 40))
P("CornerFlagNE", CFrame.new(30, 2.5, -20), Vector3.new(0.2, 5, 0.2), Enum.Material.Metal, Color3.fromRGB(240, 240, 240))
P("CornerFlagSW", CFrame.new(-30, 2.5, 20), Vector3.new(0.2, 5, 0.2), Enum.Material.Metal, Color3.fromRGB(240, 240, 240))
P("CornerFlagSE", CFrame.new(30, 2.5, 20), Vector3.new(0.2, 5, 0.2), Enum.Material.Metal, Color3.fromRGB(240, 240, 240))`,
  },
  {
    title: 'Mini Golf Hole — tee area, winding path, obstacles, hole with flag',
    tags: ['mini', 'golf', 'putt', 'course', 'hole', 'game', 'sport'],
    description: 'A mini golf hole with tee area, winding green path, windmill obstacle, sand trap, bumper wall, and hole with flag. 24 parts.',
    code: `local folder = getFolder("MiniGolfHole")
P("TeePad", CFrame.new(0, 0.15, -15), Vector3.new(5, 0.3, 4), Enum.Material.Grass, Color3.fromRGB(50, 130, 50))
P("TeeMarker", CFrame.new(0, 0.25, -15), Vector3.new(0.5, 0.1, 0.5), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))
P("Fairway1", CFrame.new(0, 0.15, -8), Vector3.new(5, 0.3, 12), Enum.Material.Grass, Color3.fromRGB(55, 140, 55))
P("FairwayCurve", CFrame.new(5, 0.15, -1), Vector3.new(12, 0.3, 5), Enum.Material.Grass, Color3.fromRGB(55, 140, 55))
P("Fairway2", CFrame.new(10, 0.15, 8), Vector3.new(5, 0.3, 14), Enum.Material.Grass, Color3.fromRGB(50, 135, 50))
P("WallL1", CFrame.new(-2.7, 0.7, -8), Vector3.new(0.4, 1, 12), Enum.Material.Wood, Color3.fromRGB(120, 80, 35))
P("WallR1", CFrame.new(2.7, 0.7, -12), Vector3.new(0.4, 1, 4), Enum.Material.Wood, Color3.fromRGB(120, 80, 35))
P("WallCornerOuter", CFrame.new(2.7, 0.7, -3), Vector3.new(0.4, 1, 6), Enum.Material.Wood, Color3.fromRGB(118, 78, 33))
P("WallCurveTop", CFrame.new(5, 0.7, -3.7), Vector3.new(6, 1, 0.4), Enum.Material.Wood, Color3.fromRGB(118, 78, 33))
P("WallCurveBot", CFrame.new(5, 0.7, 1.7), Vector3.new(6, 1, 0.4), Enum.Material.Wood, Color3.fromRGB(118, 78, 33))
P("WallL2", CFrame.new(7.3, 0.7, 8), Vector3.new(0.4, 1, 14), Enum.Material.Wood, Color3.fromRGB(120, 80, 35))
P("WallR2", CFrame.new(12.7, 0.7, 8), Vector3.new(0.4, 1, 14), Enum.Material.Wood, Color3.fromRGB(120, 80, 35))
P("WindmillBase", CFrame.new(0, 1, -4), Vector3.new(3, 2, 2), Enum.Material.Wood, Color3.fromRGB(150, 100, 45))
P("WindmillTower", CFrame.new(0, 3, -4), Vector3.new(1.5, 4, 1.5), Enum.Material.Wood, Color3.fromRGB(145, 95, 42))
P("WindmillBlade1", CFrame.new(0, 4.5, -3.2) * CFrame.Angles(0, 0, math.rad(45)), Vector3.new(5, 0.3, 0.8), Enum.Material.Wood, Color3.fromRGB(200, 195, 180))
P("WindmillBlade2", CFrame.new(0, 4.5, -3.2) * CFrame.Angles(0, 0, math.rad(-45)), Vector3.new(5, 0.3, 0.8), Enum.Material.Wood, Color3.fromRGB(200, 195, 180))
P("SandTrap", CFrame.new(10, 0.1, 3), Vector3.new(3, 0.15, 3), Enum.Material.Sand, Color3.fromRGB(220, 200, 150))
P("BumperWall", CFrame.new(10, 0.7, 10), Vector3.new(3, 1, 0.5), Enum.Material.Concrete, Color3.fromRGB(180, 50, 50))
P("HoleCup", CFrame.new(10, 0.1, 14), Vector3.new(1, 0.2, 1), Enum.Material.Metal, Color3.fromRGB(40, 40, 42))
P("FlagPole", CFrame.new(10, 2.5, 14), Vector3.new(0.15, 5, 0.15), Enum.Material.Metal, Color3.fromRGB(200, 200, 200))
P("Flag", CFrame.new(10.6, 4.5, 14), Vector3.new(1.2, 0.8, 0.05), Enum.Material.Fabric, Color3.fromRGB(255, 50, 40))
P("Surround", CFrame.new(5, 0.08, 0), Vector3.new(30, 0.15, 35), Enum.Material.Grass, Color3.fromRGB(40, 100, 35))
P("DecoRock1", CFrame.new(-4, 0.5, 5), Vector3.new(2, 1, 1.5), Enum.Material.Slate, Color3.fromRGB(130, 125, 118))
P("DecoRock2", CFrame.new(15, 0.4, -5), Vector3.new(1.5, 0.8, 1.5), Enum.Material.Slate, Color3.fromRGB(125, 120, 112))`,
  },
  {
    title: 'Carnival Booth — counter, backdrop, prizes shelf, banner, lights',
    tags: ['carnival', 'booth', 'fair', 'prizes', 'game', 'festival', 'fun'],
    description: 'A carnival game booth with counter, striped backdrop, prize shelves, overhead banner, and festive string lights. 24 parts.',
    code: `local folder = getFolder("CarnivalBooth")
P("BoothBase", CFrame.new(0, 0.15, 0), Vector3.new(12, 0.3, 8), Enum.Material.WoodPlanks, Color3.fromRGB(140, 95, 50))
P("Counter", CFrame.new(0, 3, 3), Vector3.new(12, 0.5, 2), Enum.Material.Wood, Color3.fromRGB(130, 85, 40))
P("CounterFront", CFrame.new(0, 1.5, 3.8), Vector3.new(12, 3, 0.4), Enum.Material.Wood, Color3.fromRGB(200, 50, 45))
P("CounterStripeW", CFrame.new(0, 1.5, 3.85), Vector3.new(12, 1, 0.3), Enum.Material.Concrete, Color3.fromRGB(255, 255, 255))
P("BackdropCenter", CFrame.new(0, 5, -3), Vector3.new(12, 10, 0.4), Enum.Material.Fabric, Color3.fromRGB(200, 50, 45))
P("BackdropStripe1", CFrame.new(0, 7, -2.95), Vector3.new(12, 2, 0.3), Enum.Material.Fabric, Color3.fromRGB(255, 255, 255))
P("BackdropStripe2", CFrame.new(0, 3, -2.95), Vector3.new(12, 2, 0.3), Enum.Material.Fabric, Color3.fromRGB(255, 255, 255))
P("SideWallL", CFrame.new(-6, 5, 0), Vector3.new(0.4, 10, 6), Enum.Material.Wood, Color3.fromRGB(130, 85, 40))
P("SideWallR", CFrame.new(6, 5, 0), Vector3.new(0.4, 10, 6), Enum.Material.Wood, Color3.fromRGB(130, 85, 40))
P("Roof", CFrame.new(0, 10.25, 0), Vector3.new(13, 0.5, 8), Enum.Material.Fabric, Color3.fromRGB(200, 50, 45))
P("RoofScallop", CFrame.new(0, 10, 4), Vector3.new(13, 1.5, 0.3), Enum.Material.Fabric, Color3.fromRGB(255, 220, 50))
P("PrizeShelf1", CFrame.new(0, 6, -2.5), Vector3.new(10, 0.3, 1.5), Enum.Material.Wood, Color3.fromRGB(120, 78, 35))
P("PrizeShelf2", CFrame.new(0, 8, -2.5), Vector3.new(10, 0.3, 1.5), Enum.Material.Wood, Color3.fromRGB(120, 78, 35))
P("PrizeBear", CFrame.new(-3, 6.8, -2.5), Vector3.new(1, 1.5, 1), Enum.Material.Fabric, Color3.fromRGB(160, 100, 50))
P("PrizeBunny", CFrame.new(0, 6.7, -2.5), Vector3.new(0.8, 1.2, 0.8), Enum.Material.Fabric, Color3.fromRGB(230, 180, 200))
P("PrizeDuck", CFrame.new(3, 6.5, -2.5), Vector3.new(1, 1, 0.8), Enum.Material.Fabric, Color3.fromRGB(240, 220, 60))
P("PrizeBigBear", CFrame.new(-2, 8.8, -2.5), Vector3.new(1.5, 2, 1.2), Enum.Material.Fabric, Color3.fromRGB(180, 60, 60))
P("PrizeStar", CFrame.new(2, 9, -2.5), Vector3.new(1.2, 1.2, 0.5), Enum.Material.Fabric, Color3.fromRGB(255, 200, 50))
P("BannerTop", CFrame.new(0, 10.8, 4.5), Vector3.new(10, 1.5, 0.2), Enum.Material.Fabric, Color3.fromRGB(255, 220, 50))
local bulb1 = P("StringLight1", CFrame.new(-4, 10.5, 4), Vector3.new(0.5, 0.5, 0.5), Enum.Material.Neon, Color3.fromRGB(255, 80, 80))
local bulb2 = P("StringLight2", CFrame.new(-1, 10.5, 4), Vector3.new(0.5, 0.5, 0.5), Enum.Material.Neon, Color3.fromRGB(80, 255, 80))
local bulb3 = P("StringLight3", CFrame.new(2, 10.5, 4), Vector3.new(0.5, 0.5, 0.5), Enum.Material.Neon, Color3.fromRGB(80, 80, 255))
local bulb4 = P("StringLight4", CFrame.new(5, 10.5, 4), Vector3.new(0.5, 0.5, 0.5), Enum.Material.Neon, Color3.fromRGB(255, 255, 80))
local sl = Instance.new("PointLight"); sl.Range = 15; sl.Brightness = 1.5; sl.Color = Color3.fromRGB(255, 240, 200); sl.Parent = bulb2`,
  },
  {
    title: 'Roller Coaster Section — track, support structure, car on track',
    tags: ['roller', 'coaster', 'ride', 'amusement', 'park', 'track', 'theme'],
    description: 'A roller coaster section with track rails, lattice support structure, a coaster car, and safety barriers. 24 parts.',
    code: `local folder = getFolder("RollerCoaster")
P("GroundBase", CFrame.new(0, 0.1, 0), Vector3.new(40, 0.2, 30), Enum.Material.Concrete, Color3.fromRGB(140, 138, 132))
P("TrackRailL", CFrame.new(-1.5, 15, 0), Vector3.new(0.4, 0.4, 40), Enum.Material.Metal, Color3.fromRGB(180, 40, 35))
P("TrackRailR", CFrame.new(1.5, 15, 0), Vector3.new(0.4, 0.4, 40), Enum.Material.Metal, Color3.fromRGB(180, 40, 35))
P("TrackTie1", CFrame.new(0, 15, -15), Vector3.new(3.5, 0.3, 0.6), Enum.Material.Metal, Color3.fromRGB(160, 35, 30))
P("TrackTie2", CFrame.new(0, 15, -8), Vector3.new(3.5, 0.3, 0.6), Enum.Material.Metal, Color3.fromRGB(160, 35, 30))
P("TrackTie3", CFrame.new(0, 15, -1), Vector3.new(3.5, 0.3, 0.6), Enum.Material.Metal, Color3.fromRGB(160, 35, 30))
P("TrackTie4", CFrame.new(0, 15, 6), Vector3.new(3.5, 0.3, 0.6), Enum.Material.Metal, Color3.fromRGB(160, 35, 30))
P("TrackTie5", CFrame.new(0, 15, 13), Vector3.new(3.5, 0.3, 0.6), Enum.Material.Metal, Color3.fromRGB(160, 35, 30))
P("SupportLegA1", CFrame.new(-3, 7.5, -12), Vector3.new(0.6, 15, 0.6), Enum.Material.Metal, Color3.fromRGB(200, 200, 205))
P("SupportLegA2", CFrame.new(3, 7.5, -12), Vector3.new(0.6, 15, 0.6), Enum.Material.Metal, Color3.fromRGB(200, 200, 205))
P("SupportCrossA", CFrame.new(0, 7.5, -12) * CFrame.Angles(0, 0, math.rad(45)), Vector3.new(0.4, 10, 0.4), Enum.Material.Metal, Color3.fromRGB(190, 190, 195))
P("SupportLegB1", CFrame.new(-3, 7.5, 5), Vector3.new(0.6, 15, 0.6), Enum.Material.Metal, Color3.fromRGB(200, 200, 205))
P("SupportLegB2", CFrame.new(3, 7.5, 5), Vector3.new(0.6, 15, 0.6), Enum.Material.Metal, Color3.fromRGB(200, 200, 205))
P("SupportCrossB", CFrame.new(0, 7.5, 5) * CFrame.Angles(0, 0, math.rad(-45)), Vector3.new(0.4, 10, 0.4), Enum.Material.Metal, Color3.fromRGB(190, 190, 195))
P("SupportHorizA", CFrame.new(0, 10, -12), Vector3.new(6.5, 0.4, 0.4), Enum.Material.Metal, Color3.fromRGB(195, 195, 200))
P("SupportHorizB", CFrame.new(0, 10, 5), Vector3.new(6.5, 0.4, 0.4), Enum.Material.Metal, Color3.fromRGB(195, 195, 200))
P("CarBase", CFrame.new(0, 15.8, 0), Vector3.new(3, 0.6, 5), Enum.Material.Metal, Color3.fromRGB(40, 100, 200))
P("CarSeatBack", CFrame.new(0, 16.8, 1.5), Vector3.new(2.5, 2, 0.3), Enum.Material.Metal, Color3.fromRGB(35, 90, 180))
P("CarFront", CFrame.new(0, 16.5, -2.2), Vector3.new(3, 1.5, 0.3), Enum.Material.Metal, Color3.fromRGB(40, 100, 200))
P("CarLapBar", CFrame.new(0, 16.5, 0), Vector3.new(2.5, 0.2, 0.3), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))
P("SafetyFenceL", CFrame.new(-6, 1.5, 0), Vector3.new(0.3, 3, 30), Enum.Material.Metal, Color3.fromRGB(180, 180, 185))
P("SafetyFenceR", CFrame.new(6, 1.5, 0), Vector3.new(0.3, 3, 30), Enum.Material.Metal, Color3.fromRGB(180, 180, 185))
P("QueuePost1", CFrame.new(-5, 1.5, -15), Vector3.new(0.3, 3, 0.3), Enum.Material.Metal, Color3.fromRGB(170, 170, 175))
P("QueueRope", CFrame.new(-5, 2.5, -12), Vector3.new(0.15, 0.15, 6), Enum.Material.Fabric, Color3.fromRGB(180, 40, 40))`,
  },
  {
    title: 'Campsite — tent, campfire ring, log seats, sleeping bags, cooler',
    tags: ['camp', 'campsite', 'tent', 'campfire', 'outdoor', 'nature', 'camping'],
    description: 'A cozy campsite with an A-frame tent, campfire ring with logs for seating, sleeping bags, a cooler, and surrounding trees. 26 parts.',
    code: `local folder = getFolder("Campsite")
P("GroundClearing", CFrame.new(0, 0.1, 0), Vector3.new(30, 0.2, 30), Enum.Material.Grass, Color3.fromRGB(50, 100, 38))
P("DirtPatch", CFrame.new(0, 0.15, 0), Vector3.new(18, 0.1, 18), Enum.Material.Mud, Color3.fromRGB(100, 80, 50))
P("TentPoleA", CFrame.new(-8, 3, -5), Vector3.new(0.4, 6, 0.4), Enum.Material.Wood, Color3.fromRGB(95, 60, 28))
P("TentFabricL", CFrame.new(-10, 3, -5) * CFrame.Angles(0, 0, math.rad(30)), Vector3.new(6, 0.15, 7), Enum.Material.Fabric, Color3.fromRGB(80, 130, 60))
P("TentFabricR", CFrame.new(-6, 3, -5) * CFrame.Angles(0, 0, math.rad(-30)), Vector3.new(6, 0.15, 7), Enum.Material.Fabric, Color3.fromRGB(75, 125, 55))
P("TentFloor", CFrame.new(-8, 0.2, -5), Vector3.new(6, 0.05, 6), Enum.Material.Fabric, Color3.fromRGB(60, 100, 45))
P("FireRingStone1", CFrame.new(0, 0.4, 3), Vector3.new(1, 0.8, 1), Enum.Material.Slate, Color3.fromRGB(100, 92, 80))
P("FireRingStone2", CFrame.new(1.5, 0.4, 2), Vector3.new(1, 0.8, 1), Enum.Material.Slate, Color3.fromRGB(105, 95, 82))
P("FireRingStone3", CFrame.new(1.5, 0.4, 4), Vector3.new(1, 0.8, 1), Enum.Material.Slate, Color3.fromRGB(98, 90, 78))
P("FireRingStone4", CFrame.new(-1.5, 0.4, 2), Vector3.new(1, 0.8, 1), Enum.Material.Slate, Color3.fromRGB(102, 94, 82))
P("FireRingStone5", CFrame.new(-1.5, 0.4, 4), Vector3.new(1, 0.8, 1), Enum.Material.Slate, Color3.fromRGB(96, 88, 76))
P("FireRingStone6", CFrame.new(0, 0.4, 5), Vector3.new(1, 0.8, 1), Enum.Material.Slate, Color3.fromRGB(104, 96, 84))
P("FireWoodLog", CFrame.new(0, 0.5, 3.5) * CFrame.Angles(0, math.rad(30), 0), Vector3.new(2, 0.5, 0.5), Enum.Material.Wood, Color3.fromRGB(80, 52, 22))
local campfire = P("CampfireFlame", CFrame.new(0, 1, 3.5), Vector3.new(1, 1.5, 1), Enum.Material.Neon, Color3.fromRGB(255, 150, 30))
local cf = Instance.new("PointLight"); cf.Range = 20; cf.Brightness = 2; cf.Color = Color3.fromRGB(255, 140, 30); cf.Parent = campfire
P("LogSeat1", CFrame.new(3, 0.7, 3) * CFrame.Angles(0, math.rad(90), 0), Vector3.new(4, 1.2, 1.2), Enum.Material.Wood, Color3.fromRGB(90, 60, 28))
P("LogSeat2", CFrame.new(-3, 0.6, 4) * CFrame.Angles(0, math.rad(-80), 0), Vector3.new(3.5, 1, 1), Enum.Material.Wood, Color3.fromRGB(85, 55, 25))
P("SleepingBag1", CFrame.new(-7, 0.2, -3), Vector3.new(5, 0.3, 2), Enum.Material.Fabric, Color3.fromRGB(50, 80, 150))
P("SleepingBag2", CFrame.new(-9, 0.2, -3), Vector3.new(5, 0.3, 2), Enum.Material.Fabric, Color3.fromRGB(150, 50, 50))
P("Cooler", CFrame.new(4, 0.7, -3), Vector3.new(2, 1.2, 1.5), Enum.Material.Concrete, Color3.fromRGB(40, 80, 160))
P("CoolerLid", CFrame.new(4, 1.4, -3), Vector3.new(2.1, 0.3, 1.6), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))
P("Lantern", CFrame.new(2, 1, -5), Vector3.new(0.6, 1, 0.6), Enum.Material.Metal, Color3.fromRGB(120, 115, 108))
P("Tree1Trunk", CFrame.new(12, 5, -10), Vector3.new(2, 10, 2), Enum.Material.Wood, Color3.fromRGB(75, 50, 25))
P("Tree1Canopy", CFrame.new(12, 11, -10), Vector3.new(10, 3, 10), Enum.Material.Grass, Color3.fromRGB(35, 85, 28))
P("Tree2Trunk", CFrame.new(-12, 4, 10), Vector3.new(1.5, 8, 1.5), Enum.Material.Wood, Color3.fromRGB(80, 55, 28))
P("Tree2Canopy", CFrame.new(-12, 9, 10), Vector3.new(8, 2.5, 8), Enum.Material.Grass, Color3.fromRGB(30, 80, 25))`,
  },
  {
    title: 'Ski Lodge Exterior — A-frame building, snow ground, ski rack, hot tub',
    tags: ['ski', 'lodge', 'winter', 'snow', 'mountain', 'cabin', 'resort'],
    description: 'A ski lodge exterior with A-frame timber building, snow-covered ground, ski rack, outdoor hot tub, and chimney. 24 parts.',
    code: `local folder = getFolder("SkiLodge")
P("SnowGround", CFrame.new(0, 0.25, 0), Vector3.new(50, 0.5, 40), Enum.Material.Concrete, Color3.fromRGB(235, 240, 248))
P("Foundation", CFrame.new(0, 1.25, -5), Vector3.new(18, 2, 16), Enum.Material.Concrete, Color3.fromRGB(130, 125, 118))
P("RoofLeft", CFrame.new(-5, 8.5, -5) * CFrame.Angles(0, 0, math.rad(35)), Vector3.new(12, 0.5, 17), Enum.Material.Wood, Color3.fromRGB(80, 50, 22))
P("RoofRight", CFrame.new(5, 8.5, -5) * CFrame.Angles(0, 0, math.rad(-35)), Vector3.new(12, 0.5, 17), Enum.Material.Wood, Color3.fromRGB(78, 48, 20))
P("FrontWall", CFrame.new(0, 5, 3), Vector3.new(14, 8, 0.5), Enum.Material.WoodPlanks, Color3.fromRGB(140, 95, 50))
P("BackWall", CFrame.new(0, 5, -13), Vector3.new(14, 8, 0.5), Enum.Material.WoodPlanks, Color3.fromRGB(135, 90, 45))
P("SideWallL", CFrame.new(-7, 4, -5), Vector3.new(0.5, 6, 15.5), Enum.Material.WoodPlanks, Color3.fromRGB(138, 92, 48))
P("SideWallR", CFrame.new(7, 4, -5), Vector3.new(0.5, 6, 15.5), Enum.Material.WoodPlanks, Color3.fromRGB(138, 92, 48))
P("FrontDoor", CFrame.new(0, 4, 3.1), Vector3.new(3, 6, 0.3), Enum.Material.Wood, Color3.fromRGB(100, 60, 25))
P("WindowL", CFrame.new(-3.5, 5, 3.1), Vector3.new(2.5, 3, 0.2), Enum.Material.Glass, Color3.fromRGB(180, 210, 235))
P("WindowR", CFrame.new(3.5, 5, 3.1), Vector3.new(2.5, 3, 0.2), Enum.Material.Glass, Color3.fromRGB(180, 210, 235))
P("Chimney", CFrame.new(5, 10.5, -10), Vector3.new(2, 5, 2), Enum.Material.Brick, Color3.fromRGB(140, 70, 45))
P("SnowOnRoofL", CFrame.new(-5, 9, -5), Vector3.new(10, 0.5, 16), Enum.Material.Concrete, Color3.fromRGB(240, 245, 252))
P("SnowOnRoofR", CFrame.new(5, 9, -5), Vector3.new(10, 0.5, 16), Enum.Material.Concrete, Color3.fromRGB(240, 245, 252))
P("SkiRackBase", CFrame.new(12, 1, 5), Vector3.new(4, 0.3, 1), Enum.Material.Wood, Color3.fromRGB(95, 62, 28))
P("SkiRackPostL", CFrame.new(10.5, 2, 5), Vector3.new(0.4, 3, 0.4), Enum.Material.Wood, Color3.fromRGB(95, 62, 28))
P("SkiRackPostR", CFrame.new(13.5, 2, 5), Vector3.new(0.4, 3, 0.4), Enum.Material.Wood, Color3.fromRGB(95, 62, 28))
P("Ski1", CFrame.new(11, 2, 5.3), Vector3.new(0.3, 3.5, 0.1), Enum.Material.Metal, Color3.fromRGB(200, 40, 35))
P("Ski2", CFrame.new(12, 2, 5.3), Vector3.new(0.3, 3.5, 0.1), Enum.Material.Metal, Color3.fromRGB(40, 100, 200))
P("HotTubBase", CFrame.new(-12, 1.5, 5), Vector3.new(6, 3, 6), Enum.Material.Wood, Color3.fromRGB(110, 72, 35))
P("HotTubWater", CFrame.new(-12, 2.5, 5), Vector3.new(5, 1, 5), Enum.Material.Glass, Color3.fromRGB(100, 170, 220))
P("HotTubRim", CFrame.new(-12, 3.1, 5), Vector3.new(6.2, 0.3, 6.2), Enum.Material.Wood, Color3.fromRGB(115, 75, 38))
P("PorchDeck", CFrame.new(0, 2, 5), Vector3.new(14, 0.3, 4), Enum.Material.WoodPlanks, Color3.fromRGB(130, 88, 42))
P("PorchRailing", CFrame.new(0, 3.5, 7), Vector3.new(14, 2, 0.3), Enum.Material.Wood, Color3.fromRGB(125, 82, 38))`,
  },
  {
    title: 'Skate Park Ramp — half pipe, rails, flat ground, graffiti wall',
    tags: ['skate', 'park', 'ramp', 'halfpipe', 'rail', 'grind', 'urban'],
    description: 'A skate park section with a half pipe, grind rails, flat ground area, graffiti-colored wall, and bench. 20 parts.',
    code: `local folder = getFolder("SkatePark")
P("ConcreteGround", CFrame.new(0, 0.1, 0), Vector3.new(40, 0.2, 35), Enum.Material.Concrete, Color3.fromRGB(160, 155, 148))
P("HalfPipeFloor", CFrame.new(-10, 0.2, 0), Vector3.new(14, 0.2, 20), Enum.Material.Concrete, Color3.fromRGB(150, 145, 138))
P("HalfPipeWallL", CFrame.new(-17, 3.5, 0) * CFrame.Angles(0, 0, math.rad(10)), Vector3.new(0.5, 7, 20), Enum.Material.Concrete, Color3.fromRGB(145, 140, 132))
P("HalfPipeWallR", CFrame.new(-3, 3.5, 0) * CFrame.Angles(0, 0, math.rad(-10)), Vector3.new(0.5, 7, 20), Enum.Material.Concrete, Color3.fromRGB(145, 140, 132))
P("HalfPipeLipL", CFrame.new(-17.5, 7.2, 0), Vector3.new(1, 0.3, 20), Enum.Material.Metal, Color3.fromRGB(120, 118, 112))
P("HalfPipeLipR", CFrame.new(-2.5, 7.2, 0), Vector3.new(1, 0.3, 20), Enum.Material.Metal, Color3.fromRGB(120, 118, 112))
P("HalfPipeCurveL", CFrame.new(-16, 0.8, 0), Vector3.new(3, 1.5, 20), Enum.Material.Concrete, Color3.fromRGB(148, 143, 135))
P("HalfPipeCurveR", CFrame.new(-4, 0.8, 0), Vector3.new(3, 1.5, 20), Enum.Material.Concrete, Color3.fromRGB(148, 143, 135))
P("GrindRailPost1", CFrame.new(8, 1, -5), Vector3.new(0.4, 2, 0.4), Enum.Material.Metal, Color3.fromRGB(100, 98, 92))
P("GrindRailPost2", CFrame.new(8, 1, 5), Vector3.new(0.4, 2, 0.4), Enum.Material.Metal, Color3.fromRGB(100, 98, 92))
P("GrindRail", CFrame.new(8, 2.2, 0), Vector3.new(0.3, 0.3, 10.5), Enum.Material.Metal, Color3.fromRGB(140, 138, 132))
P("FunBox", CFrame.new(12, 0.75, -8), Vector3.new(5, 1.5, 5), Enum.Material.Concrete, Color3.fromRGB(155, 150, 142))
P("FunBoxLedge", CFrame.new(12, 1.55, -8), Vector3.new(5.2, 0.1, 5.2), Enum.Material.Metal, Color3.fromRGB(130, 128, 122))
P("GraffitiWall", CFrame.new(18, 5, 0), Vector3.new(1, 10, 20), Enum.Material.Concrete, Color3.fromRGB(170, 165, 158))
P("GraffitiBlob1", CFrame.new(17.4, 4, -4), Vector3.new(0.1, 3, 4), Enum.Material.Concrete, Color3.fromRGB(200, 50, 180))
P("GraffitiBlob2", CFrame.new(17.4, 6, 2), Vector3.new(0.1, 2.5, 5), Enum.Material.Concrete, Color3.fromRGB(50, 180, 220))
P("GraffitiBlob3", CFrame.new(17.4, 3, 5), Vector3.new(0.1, 2, 3), Enum.Material.Concrete, Color3.fromRGB(255, 220, 50))
P("Bench", CFrame.new(12, 1, 12), Vector3.new(5, 0.4, 1.5), Enum.Material.Wood, Color3.fromRGB(100, 65, 30))
P("BenchLeg1", CFrame.new(10, 0.5, 12), Vector3.new(0.4, 1, 1.5), Enum.Material.Metal, Color3.fromRGB(60, 58, 55))
P("BenchLeg2", CFrame.new(14, 0.5, 12), Vector3.new(0.4, 1, 1.5), Enum.Material.Metal, Color3.fromRGB(60, 58, 55))`,
  },
  {
    title: 'Stage / Concert — stage platform, speaker stacks, light rig, mic stand',
    tags: ['stage', 'concert', 'music', 'performance', 'speakers', 'lights', 'event'],
    description: 'A concert stage with raised platform, speaker stacks, overhead light rig with colored spotlights, mic stand, and crowd barrier. 26 parts.',
    code: `local folder = getFolder("ConcertStage")
P("StageFloor", CFrame.new(0, 2, -5), Vector3.new(24, 0.5, 16), Enum.Material.WoodPlanks, Color3.fromRGB(50, 45, 40))
P("StageFront", CFrame.new(0, 1, 3), Vector3.new(24, 2, 0.5), Enum.Material.Metal, Color3.fromRGB(30, 30, 32))
P("StageSkirtL", CFrame.new(-12, 1, -5), Vector3.new(0.5, 2, 16), Enum.Material.Fabric, Color3.fromRGB(25, 25, 28))
P("StageSkirtR", CFrame.new(12, 1, -5), Vector3.new(0.5, 2, 16), Enum.Material.Fabric, Color3.fromRGB(25, 25, 28))
P("BackDrop", CFrame.new(0, 8, -12.5), Vector3.new(24, 12, 0.3), Enum.Material.Fabric, Color3.fromRGB(20, 20, 25))
P("SpeakerL1", CFrame.new(-10, 4, -10), Vector3.new(4, 4, 3), Enum.Material.Metal, Color3.fromRGB(25, 25, 28))
P("SpeakerL2", CFrame.new(-10, 8, -10), Vector3.new(4, 4, 3), Enum.Material.Metal, Color3.fromRGB(25, 25, 28))
P("SpeakerConeL", CFrame.new(-10, 4, -8.3), Vector3.new(2.5, 2.5, 0.3), Enum.Material.Fabric, Color3.fromRGB(50, 50, 55))
P("SpeakerR1", CFrame.new(10, 4, -10), Vector3.new(4, 4, 3), Enum.Material.Metal, Color3.fromRGB(25, 25, 28))
P("SpeakerR2", CFrame.new(10, 8, -10), Vector3.new(4, 4, 3), Enum.Material.Metal, Color3.fromRGB(25, 25, 28))
P("SpeakerConeR", CFrame.new(10, 4, -8.3), Vector3.new(2.5, 2.5, 0.3), Enum.Material.Fabric, Color3.fromRGB(50, 50, 55))
P("LightRigBar", CFrame.new(0, 14, -2), Vector3.new(22, 0.5, 0.5), Enum.Material.Metal, Color3.fromRGB(40, 40, 45))
P("LightRigTrussL", CFrame.new(-11, 8, -2), Vector3.new(0.5, 12, 0.5), Enum.Material.Metal, Color3.fromRGB(45, 45, 50))
P("LightRigTrussR", CFrame.new(11, 8, -2), Vector3.new(0.5, 12, 0.5), Enum.Material.Metal, Color3.fromRGB(45, 45, 50))
local spotR = P("SpotlightRed", CFrame.new(-6, 13.5, -2), Vector3.new(1, 1.5, 1), Enum.Material.Neon, Color3.fromRGB(255, 40, 40))
local sr = Instance.new("PointLight"); sr.Range = 30; sr.Brightness = 2; sr.Color = Color3.fromRGB(255, 40, 40); sr.Parent = spotR
local spotB = P("SpotlightBlue", CFrame.new(0, 13.5, -2), Vector3.new(1, 1.5, 1), Enum.Material.Neon, Color3.fromRGB(40, 80, 255))
local sb = Instance.new("PointLight"); sb.Range = 30; sb.Brightness = 2; sb.Color = Color3.fromRGB(40, 80, 255); sb.Parent = spotB
local spotG = P("SpotlightGreen", CFrame.new(6, 13.5, -2), Vector3.new(1, 1.5, 1), Enum.Material.Neon, Color3.fromRGB(40, 255, 80))
local sgl = Instance.new("PointLight"); sgl.Range = 30; sgl.Brightness = 2; sgl.Color = Color3.fromRGB(40, 255, 80); sgl.Parent = spotG
P("MicStandBase", CFrame.new(0, 2.4, -2), Vector3.new(1.5, 0.3, 1.5), Enum.Material.Metal, Color3.fromRGB(35, 35, 38))
P("MicStandPole", CFrame.new(0, 4.5, -2), Vector3.new(0.2, 4, 0.2), Enum.Material.Metal, Color3.fromRGB(40, 40, 45))
P("Microphone", CFrame.new(0, 6.5, -2), Vector3.new(0.4, 0.6, 0.4), Enum.Material.Metal, Color3.fromRGB(50, 50, 55))
P("CrowdBarrier1", CFrame.new(-6, 1.5, 6), Vector3.new(8, 3, 0.4), Enum.Material.Metal, Color3.fromRGB(130, 128, 122))
P("CrowdBarrier2", CFrame.new(6, 1.5, 6), Vector3.new(8, 3, 0.4), Enum.Material.Metal, Color3.fromRGB(130, 128, 122))
P("AudienceFloor", CFrame.new(0, 0.05, 12), Vector3.new(30, 0.1, 15), Enum.Material.Concrete, Color3.fromRGB(80, 78, 72))`,
  },
  {
    title: 'Maze Section — hedge walls forming T-junction, dead end variant',
    tags: ['maze', 'hedge', 'labyrinth', 'puzzle', 'garden', 'walls'],
    description: 'A hedge maze section with T-junction, dead end, tall green hedges, gravel path, and decorative fountain. 18 parts.',
    code: `local folder = getFolder("MazeSection")
P("GravelPath", CFrame.new(0, 0.1, 0), Vector3.new(30, 0.2, 30), Enum.Material.Slate, Color3.fromRGB(170, 165, 155))
P("GrassBase", CFrame.new(0, 0.08, 0), Vector3.new(32, 0.15, 32), Enum.Material.Grass, Color3.fromRGB(50, 110, 40))
P("HedgeMainN", CFrame.new(0, 3, -12), Vector3.new(30, 6, 2), Enum.Material.Grass, Color3.fromRGB(35, 85, 28))
P("HedgeMainS", CFrame.new(0, 3, 12), Vector3.new(30, 6, 2), Enum.Material.Grass, Color3.fromRGB(32, 82, 25))
P("HedgeWallW", CFrame.new(-14, 3, 0), Vector3.new(2, 6, 22), Enum.Material.Grass, Color3.fromRGB(38, 88, 30))
P("HedgeWallE", CFrame.new(14, 3, 0), Vector3.new(2, 6, 22), Enum.Material.Grass, Color3.fromRGB(36, 86, 28))
P("HedgeTJunctionMain", CFrame.new(0, 3, 0), Vector3.new(2, 6, 22), Enum.Material.Grass, Color3.fromRGB(34, 84, 26))
P("HedgeTJunctionArm", CFrame.new(7, 3, 0), Vector3.new(14, 6, 2), Enum.Material.Grass, Color3.fromRGB(37, 87, 29))
P("HedgeDeadEndWall", CFrame.new(-7, 3, 6), Vector3.new(12, 6, 2), Enum.Material.Grass, Color3.fromRGB(33, 83, 25))
P("HedgeDeadEndCap", CFrame.new(-7, 3, 3), Vector3.new(2, 6, 4), Enum.Material.Grass, Color3.fromRGB(36, 86, 28))
P("PathStone1", CFrame.new(-5, 0.15, -6), Vector3.new(2, 0.1, 2), Enum.Material.Cobblestone, Color3.fromRGB(150, 145, 135))
P("PathStone2", CFrame.new(5, 0.15, 5), Vector3.new(1.8, 0.1, 1.8), Enum.Material.Cobblestone, Color3.fromRGB(148, 142, 132))
P("FountainBase", CFrame.new(8, 1, -6), Vector3.new(4, 2, 4), Enum.Material.Concrete, Color3.fromRGB(180, 175, 165))
P("FountainBowl", CFrame.new(8, 2.3, -6), Vector3.new(3, 0.5, 3), Enum.Material.Concrete, Color3.fromRGB(185, 180, 170))
P("FountainWater", CFrame.new(8, 2.3, -6), Vector3.new(2.5, 0.4, 2.5), Enum.Material.Glass, Color3.fromRGB(120, 180, 220))
P("TopiarySphere", CFrame.new(-10, 3, -6), Vector3.new(3, 3, 3), Enum.Material.Grass, Color3.fromRGB(40, 100, 35))
P("TopiaryCone", CFrame.new(10, 3, 6), Vector3.new(2, 5, 2), Enum.Material.Grass, Color3.fromRGB(42, 105, 38))
P("Bench", CFrame.new(-5, 1.2, -3), Vector3.new(3, 0.4, 1), Enum.Material.Wood, Color3.fromRGB(100, 65, 30))`,
  },
  {
    title: 'Classroom — desks in rows, teacher desk, whiteboard, bookshelf',
    tags: ['classroom', 'school', 'education', 'desks', 'whiteboard', 'interior'],
    description: 'A school classroom with student desks in rows, teacher desk, whiteboard, bookshelf, clock, and door. 26 parts.',
    code: `local folder = getFolder("Classroom")
P("Floor", CFrame.new(0, 0.1, 0), Vector3.new(24, 0.2, 20), Enum.Material.WoodPlanks, Color3.fromRGB(160, 120, 70))
P("WallBack", CFrame.new(0, 5, -10), Vector3.new(24, 10, 0.5), Enum.Material.Concrete, Color3.fromRGB(220, 215, 205))
P("WallFront", CFrame.new(0, 5, 10), Vector3.new(24, 10, 0.5), Enum.Material.Concrete, Color3.fromRGB(218, 212, 202))
P("WallL", CFrame.new(-12, 5, 0), Vector3.new(0.5, 10, 19.5), Enum.Material.Concrete, Color3.fromRGB(215, 210, 200))
P("WallR", CFrame.new(12, 5, 0), Vector3.new(0.5, 10, 19.5), Enum.Material.Concrete, Color3.fromRGB(215, 210, 200))
P("Ceiling", CFrame.new(0, 10.1, 0), Vector3.new(24, 0.2, 20), Enum.Material.Concrete, Color3.fromRGB(240, 238, 232))
P("Whiteboard", CFrame.new(0, 5.5, -9.6), Vector3.new(10, 4, 0.2), Enum.Material.Concrete, Color3.fromRGB(250, 250, 250))
P("WhiteboardTray", CFrame.new(0, 3.5, -9.5), Vector3.new(10, 0.3, 0.5), Enum.Material.Metal, Color3.fromRGB(120, 118, 112))
P("TeacherDesk", CFrame.new(0, 2.5, -6), Vector3.new(5, 0.4, 2.5), Enum.Material.Wood, Color3.fromRGB(120, 78, 35))
P("TeacherDeskPanel", CFrame.new(0, 1.5, -5), Vector3.new(5, 2.5, 0.3), Enum.Material.Wood, Color3.fromRGB(115, 75, 32))
P("TeacherChair", CFrame.new(0, 1.8, -7), Vector3.new(1.5, 0.3, 1.5), Enum.Material.Fabric, Color3.fromRGB(40, 40, 45))
P("TeacherChairBack", CFrame.new(0, 3.5, -7.5), Vector3.new(1.5, 3, 0.3), Enum.Material.Fabric, Color3.fromRGB(40, 40, 45))
P("StudentDesk1", CFrame.new(-6, 2, -1), Vector3.new(3, 0.3, 2), Enum.Material.Wood, Color3.fromRGB(140, 95, 50))
P("StudentDesk2", CFrame.new(-2, 2, -1), Vector3.new(3, 0.3, 2), Enum.Material.Wood, Color3.fromRGB(140, 95, 50))
P("StudentDesk3", CFrame.new(2, 2, -1), Vector3.new(3, 0.3, 2), Enum.Material.Wood, Color3.fromRGB(140, 95, 50))
P("StudentDesk4", CFrame.new(6, 2, -1), Vector3.new(3, 0.3, 2), Enum.Material.Wood, Color3.fromRGB(140, 95, 50))
P("StudentDesk5", CFrame.new(-6, 2, 3), Vector3.new(3, 0.3, 2), Enum.Material.Wood, Color3.fromRGB(138, 92, 48))
P("StudentDesk6", CFrame.new(-2, 2, 3), Vector3.new(3, 0.3, 2), Enum.Material.Wood, Color3.fromRGB(138, 92, 48))
P("StudentDesk7", CFrame.new(2, 2, 3), Vector3.new(3, 0.3, 2), Enum.Material.Wood, Color3.fromRGB(138, 92, 48))
P("StudentDesk8", CFrame.new(6, 2, 3), Vector3.new(3, 0.3, 2), Enum.Material.Wood, Color3.fromRGB(138, 92, 48))
P("StudentChair1", CFrame.new(-6, 1.5, 0.5), Vector3.new(1.2, 0.2, 1.2), Enum.Material.Metal, Color3.fromRGB(60, 80, 160))
P("StudentChair2", CFrame.new(-2, 1.5, 0.5), Vector3.new(1.2, 0.2, 1.2), Enum.Material.Metal, Color3.fromRGB(60, 80, 160))
P("Bookshelf", CFrame.new(-11, 3.5, -8), Vector3.new(1.5, 7, 3), Enum.Material.Wood, Color3.fromRGB(110, 72, 32))
P("BookRow1", CFrame.new(-11, 5, -8), Vector3.new(1.3, 1, 2.5), Enum.Material.Fabric, Color3.fromRGB(140, 40, 30))
P("Clock", CFrame.new(0, 8.5, -9.6), Vector3.new(1.5, 1.5, 0.2), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))
P("Door", CFrame.new(11, 4, 9.7), Vector3.new(3, 7, 0.3), Enum.Material.Wood, Color3.fromRGB(130, 85, 40))`,
  },
  {
    title: 'Library Reading Room — tall shelves, reading tables, globe, ladder',
    tags: ['library', 'books', 'reading', 'shelves', 'interior', 'study', 'room'],
    description: 'A grand library reading room with tall bookshelves, reading tables with lamps, a globe, rolling ladder, and arched window. 26 parts.',
    code: `local folder = getFolder("LibraryRoom")
P("WoodFloor", CFrame.new(0, 0.1, 0), Vector3.new(26, 0.2, 22), Enum.Material.WoodPlanks, Color3.fromRGB(130, 85, 40))
P("WallBack", CFrame.new(0, 7, -11), Vector3.new(26, 14, 0.5), Enum.Material.Concrete, Color3.fromRGB(180, 165, 140))
P("WallL", CFrame.new(-13, 7, 0), Vector3.new(0.5, 14, 21.5), Enum.Material.Concrete, Color3.fromRGB(178, 162, 138))
P("WallR", CFrame.new(13, 7, 0), Vector3.new(0.5, 14, 21.5), Enum.Material.Concrete, Color3.fromRGB(175, 160, 135))
P("Ceiling", CFrame.new(0, 14.1, 0), Vector3.new(26, 0.2, 22), Enum.Material.Wood, Color3.fromRGB(100, 65, 30))
P("ShelfL1", CFrame.new(-11, 5, -8), Vector3.new(2, 10, 5), Enum.Material.Wood, Color3.fromRGB(100, 60, 25))
P("ShelfL1Books", CFrame.new(-11, 6, -8), Vector3.new(1.8, 1.2, 4.5), Enum.Material.Fabric, Color3.fromRGB(140, 40, 30))
P("ShelfL1Books2", CFrame.new(-11, 8, -8), Vector3.new(1.8, 1.2, 4.5), Enum.Material.Fabric, Color3.fromRGB(30, 60, 120))
P("ShelfR1", CFrame.new(11, 5, -8), Vector3.new(2, 10, 5), Enum.Material.Wood, Color3.fromRGB(98, 58, 22))
P("ShelfR1Books", CFrame.new(11, 6, -8), Vector3.new(1.8, 1.2, 4.5), Enum.Material.Fabric, Color3.fromRGB(50, 100, 40))
P("ShelfR1Books2", CFrame.new(11, 8, -8), Vector3.new(1.8, 1.2, 4.5), Enum.Material.Fabric, Color3.fromRGB(80, 40, 100))
P("ShelfBack", CFrame.new(0, 5, -10.5), Vector3.new(20, 10, 1.5), Enum.Material.Wood, Color3.fromRGB(105, 65, 28))
P("ShelfBackBooks", CFrame.new(0, 7, -10.5), Vector3.new(19, 1.2, 1.2), Enum.Material.Fabric, Color3.fromRGB(120, 80, 30))
P("ReadTable1", CFrame.new(-4, 2.5, 2), Vector3.new(6, 0.4, 3), Enum.Material.Wood, Color3.fromRGB(110, 70, 30))
P("ReadTable1LegFL", CFrame.new(-6.5, 1.25, 3), Vector3.new(0.4, 2.5, 0.4), Enum.Material.Wood, Color3.fromRGB(100, 62, 25))
P("ReadTable1LegFR", CFrame.new(-1.5, 1.25, 3), Vector3.new(0.4, 2.5, 0.4), Enum.Material.Wood, Color3.fromRGB(100, 62, 25))
P("ReadTable2", CFrame.new(4, 2.5, 2), Vector3.new(6, 0.4, 3), Enum.Material.Wood, Color3.fromRGB(108, 68, 28))
local lamp = P("DeskLamp", CFrame.new(-4, 3.5, 2), Vector3.new(0.8, 1.5, 0.8), Enum.Material.Neon, Color3.fromRGB(255, 230, 160))
local dl = Instance.new("PointLight"); dl.Range = 12; dl.Brightness = 1; dl.Color = Color3.fromRGB(255, 220, 140); dl.Parent = lamp
P("GlobeStand", CFrame.new(8, 2, 8), Vector3.new(0.5, 3.5, 0.5), Enum.Material.Wood, Color3.fromRGB(95, 58, 22))
P("Globe", CFrame.new(8, 4.2, 8), Vector3.new(2.5, 2.5, 2.5), Enum.Material.Concrete, Color3.fromRGB(60, 120, 80))
P("LadderRailL", CFrame.new(-10.5, 5, -5), Vector3.new(0.3, 10, 0.3), Enum.Material.Wood, Color3.fromRGB(90, 55, 22))
P("LadderRailR", CFrame.new(-9, 5, -5), Vector3.new(0.3, 10, 0.3), Enum.Material.Wood, Color3.fromRGB(90, 55, 22))
P("LadderRung1", CFrame.new(-9.75, 3, -5), Vector3.new(1.5, 0.2, 0.3), Enum.Material.Wood, Color3.fromRGB(105, 68, 28))
P("LadderRung2", CFrame.new(-9.75, 5, -5), Vector3.new(1.5, 0.2, 0.3), Enum.Material.Wood, Color3.fromRGB(105, 68, 28))
P("ArchedWindow", CFrame.new(12.7, 7, 0), Vector3.new(0.2, 8, 5), Enum.Material.Glass, Color3.fromRGB(180, 210, 235))
P("Rug", CFrame.new(0, 0.15, 3), Vector3.new(12, 0.05, 8), Enum.Material.Fabric, Color3.fromRGB(120, 40, 40))`,
  },
  {
    title: 'Hospital Room — bed, IV stand, curtain divider, monitor, door',
    tags: ['hospital', 'medical', 'bed', 'room', 'health', 'clinic', 'interior'],
    description: 'A hospital room with adjustable bed, IV stand, privacy curtain, vital signs monitor, bedside table, and door. 22 parts.',
    code: `local folder = getFolder("HospitalRoom")
P("Floor", CFrame.new(0, 0.1, 0), Vector3.new(16, 0.2, 14), Enum.Material.Concrete, Color3.fromRGB(210, 215, 210))
P("WallBack", CFrame.new(0, 5, -7), Vector3.new(16, 10, 0.5), Enum.Material.Concrete, Color3.fromRGB(225, 230, 225))
P("WallL", CFrame.new(-8, 5, 0), Vector3.new(0.5, 10, 13.5), Enum.Material.Concrete, Color3.fromRGB(222, 228, 222))
P("WallR", CFrame.new(8, 5, 0), Vector3.new(0.5, 10, 13.5), Enum.Material.Concrete, Color3.fromRGB(220, 225, 220))
P("Ceiling", CFrame.new(0, 10.1, 0), Vector3.new(16, 0.2, 14), Enum.Material.Concrete, Color3.fromRGB(240, 242, 240))
P("BedFrame", CFrame.new(-2, 1.5, -2), Vector3.new(4, 0.3, 7), Enum.Material.Metal, Color3.fromRGB(200, 200, 205))
P("BedMattress", CFrame.new(-2, 1.9, -2), Vector3.new(3.5, 0.5, 6.5), Enum.Material.Fabric, Color3.fromRGB(230, 235, 240))
P("BedPillow", CFrame.new(-2, 2.3, -5), Vector3.new(2.5, 0.5, 1.5), Enum.Material.Fabric, Color3.fromRGB(240, 242, 245))
P("BedHeadboard", CFrame.new(-2, 3, -5.5), Vector3.new(4, 2.5, 0.3), Enum.Material.Metal, Color3.fromRGB(195, 195, 200))
P("BedFootboard", CFrame.new(-2, 2.5, 1.5), Vector3.new(4, 1.5, 0.3), Enum.Material.Metal, Color3.fromRGB(195, 195, 200))
P("BedRail", CFrame.new(-4, 2.5, -2), Vector3.new(0.2, 1.5, 5), Enum.Material.Metal, Color3.fromRGB(190, 190, 195))
P("IVPole", CFrame.new(-5, 4, -4), Vector3.new(0.3, 8, 0.3), Enum.Material.Metal, Color3.fromRGB(190, 190, 195))
P("IVBag", CFrame.new(-5, 7.5, -4), Vector3.new(0.5, 1, 0.3), Enum.Material.Glass, Color3.fromRGB(200, 220, 240))
P("IVHook", CFrame.new(-5, 8.2, -4), Vector3.new(1, 0.15, 0.15), Enum.Material.Metal, Color3.fromRGB(185, 185, 190))
P("CurtainRod", CFrame.new(2, 8, 0), Vector3.new(0.2, 0.2, 14), Enum.Material.Metal, Color3.fromRGB(180, 180, 185))
P("CurtainFabric", CFrame.new(2, 5, -1), Vector3.new(0.1, 6, 6), Enum.Material.Fabric, Color3.fromRGB(180, 200, 190))
P("Monitor", CFrame.new(0, 4.5, -6.5), Vector3.new(1.5, 1.2, 0.3), Enum.Material.Metal, Color3.fromRGB(40, 42, 45))
P("MonitorScreen", CFrame.new(0, 4.5, -6.3), Vector3.new(1.3, 1, 0.1), Enum.Material.Neon, Color3.fromRGB(50, 200, 80))
P("MonitorArm", CFrame.new(0, 3.5, -6.6), Vector3.new(0.3, 2.5, 0.3), Enum.Material.Metal, Color3.fromRGB(45, 45, 48))
P("BedsideTable", CFrame.new(1, 1.5, -4), Vector3.new(1.5, 2.5, 1.5), Enum.Material.Wood, Color3.fromRGB(140, 100, 55))
P("WaterCup", CFrame.new(1, 2.9, -4), Vector3.new(0.4, 0.5, 0.4), Enum.Material.Glass, Color3.fromRGB(180, 210, 230))
P("Door", CFrame.new(7, 4, 6.7), Vector3.new(3.5, 7.5, 0.3), Enum.Material.Wood, Color3.fromRGB(160, 140, 110))`,
  },
  {
    title: 'Prison Cell — bunk bed, toilet, sink, barred window, locked door',
    tags: ['prison', 'cell', 'jail', 'bunk', 'bars', 'interior', 'room'],
    description: 'A prison cell with bunk bed, stainless toilet and sink, barred window, locked barred door, and concrete walls. 22 parts.',
    code: `local folder = getFolder("PrisonCell")
P("CellFloor", CFrame.new(0, 0.1, 0), Vector3.new(10, 0.2, 12), Enum.Material.Concrete, Color3.fromRGB(140, 138, 130))
P("WallBack", CFrame.new(0, 5, -6), Vector3.new(10, 10, 0.5), Enum.Material.Concrete, Color3.fromRGB(155, 150, 142))
P("WallL", CFrame.new(-5, 5, 0), Vector3.new(0.5, 10, 11.5), Enum.Material.Concrete, Color3.fromRGB(152, 148, 140))
P("WallR", CFrame.new(5, 5, 0), Vector3.new(0.5, 10, 11.5), Enum.Material.Concrete, Color3.fromRGB(150, 145, 138))
P("Ceiling", CFrame.new(0, 10.1, 0), Vector3.new(10, 0.2, 12), Enum.Material.Concrete, Color3.fromRGB(160, 155, 148))
P("BunkLowerFrame", CFrame.new(-3, 1.2, -3), Vector3.new(3.5, 0.3, 6), Enum.Material.Metal, Color3.fromRGB(120, 118, 112))
P("BunkLowerMattress", CFrame.new(-3, 1.5, -3), Vector3.new(3, 0.4, 5.5), Enum.Material.Fabric, Color3.fromRGB(80, 90, 100))
P("BunkUpperFrame", CFrame.new(-3, 4.5, -3), Vector3.new(3.5, 0.3, 6), Enum.Material.Metal, Color3.fromRGB(118, 116, 110))
P("BunkUpperMattress", CFrame.new(-3, 4.8, -3), Vector3.new(3, 0.4, 5.5), Enum.Material.Fabric, Color3.fromRGB(78, 88, 98))
P("BunkPostFL", CFrame.new(-4.5, 2.5, 0), Vector3.new(0.3, 5, 0.3), Enum.Material.Metal, Color3.fromRGB(115, 112, 108))
P("BunkPostFR", CFrame.new(-1.5, 2.5, 0), Vector3.new(0.3, 5, 0.3), Enum.Material.Metal, Color3.fromRGB(115, 112, 108))
P("BunkPostBL", CFrame.new(-4.5, 2.5, -5.8), Vector3.new(0.3, 5, 0.3), Enum.Material.Metal, Color3.fromRGB(115, 112, 108))
P("BunkPostBR", CFrame.new(-1.5, 2.5, -5.8), Vector3.new(0.3, 5, 0.3), Enum.Material.Metal, Color3.fromRGB(115, 112, 108))
P("Toilet", CFrame.new(3.5, 1, -4.5), Vector3.new(1.2, 1.8, 1.5), Enum.Material.Metal, Color3.fromRGB(180, 185, 190))
P("Sink", CFrame.new(3.5, 2.5, -5.5), Vector3.new(1, 0.5, 0.8), Enum.Material.Metal, Color3.fromRGB(185, 190, 195))
P("SinkPipe", CFrame.new(3.5, 1.5, -5.5), Vector3.new(0.3, 2, 0.3), Enum.Material.Metal, Color3.fromRGB(170, 175, 180))
P("BarredWindow", CFrame.new(0, 7.5, -5.8), Vector3.new(3, 2, 0.2), Enum.Material.Glass, Color3.fromRGB(180, 200, 220))
P("WindowBar1", CFrame.new(-0.8, 7.5, -5.7), Vector3.new(0.2, 2, 0.2), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))
P("WindowBar2", CFrame.new(0.8, 7.5, -5.7), Vector3.new(0.2, 2, 0.2), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))
P("CellDoor", CFrame.new(0, 4, 5.7), Vector3.new(4, 8, 0.3), Enum.Material.Metal, Color3.fromRGB(70, 70, 75))
P("DoorBar1", CFrame.new(-1.2, 4, 5.5), Vector3.new(0.2, 8, 0.2), Enum.Material.Metal, Color3.fromRGB(65, 65, 70))
P("DoorBar2", CFrame.new(1.2, 4, 5.5), Vector3.new(0.2, 8, 0.2), Enum.Material.Metal, Color3.fromRGB(65, 65, 70))`,
  },
  {
    title: 'Art Gallery — white walls, framed paintings, bench, spotlight',
    tags: ['art', 'gallery', 'museum', 'paintings', 'exhibit', 'interior', 'modern'],
    description: 'A modern art gallery with white walls, colorful framed paintings, a viewing bench, track lighting spotlights, and polished floor. 24 parts.',
    code: `local folder = getFolder("ArtGallery")
P("PolishedFloor", CFrame.new(0, 0.1, 0), Vector3.new(30, 0.2, 20), Enum.Material.Concrete, Color3.fromRGB(220, 218, 212))
P("WallBack", CFrame.new(0, 6, -10), Vector3.new(30, 12, 0.5), Enum.Material.Concrete, Color3.fromRGB(245, 245, 245))
P("WallL", CFrame.new(-15, 6, 0), Vector3.new(0.5, 12, 19.5), Enum.Material.Concrete, Color3.fromRGB(245, 245, 245))
P("WallR", CFrame.new(15, 6, 0), Vector3.new(0.5, 12, 19.5), Enum.Material.Concrete, Color3.fromRGB(245, 245, 245))
P("Ceiling", CFrame.new(0, 12.1, 0), Vector3.new(30, 0.2, 20), Enum.Material.Concrete, Color3.fromRGB(248, 248, 248))
P("PaintingFrame1", CFrame.new(-8, 6, -9.6), Vector3.new(5, 4, 0.3), Enum.Material.Wood, Color3.fromRGB(60, 45, 20))
P("PaintingCanvas1", CFrame.new(-8, 6, -9.4), Vector3.new(4.2, 3.2, 0.1), Enum.Material.Concrete, Color3.fromRGB(40, 80, 160))
P("PaintingFrame2", CFrame.new(0, 6, -9.6), Vector3.new(6, 4.5, 0.3), Enum.Material.Metal, Color3.fromRGB(180, 175, 165))
P("PaintingCanvas2", CFrame.new(0, 6, -9.4), Vector3.new(5.2, 3.7, 0.1), Enum.Material.Concrete, Color3.fromRGB(200, 60, 50))
P("PaintingFrame3", CFrame.new(8, 6, -9.6), Vector3.new(4, 5, 0.3), Enum.Material.Wood, Color3.fromRGB(55, 40, 18))
P("PaintingCanvas3", CFrame.new(8, 6, -9.4), Vector3.new(3.2, 4.2, 0.1), Enum.Material.Concrete, Color3.fromRGB(50, 160, 80))
P("PaintingFrameL", CFrame.new(-14.6, 6, -3), Vector3.new(0.3, 3.5, 4.5), Enum.Material.Wood, Color3.fromRGB(58, 42, 19))
P("PaintingCanvasL", CFrame.new(-14.4, 6, -3), Vector3.new(0.1, 2.7, 3.7), Enum.Material.Concrete, Color3.fromRGB(240, 200, 50))
P("PaintingFrameR", CFrame.new(14.6, 6, 3), Vector3.new(0.3, 4, 5), Enum.Material.Metal, Color3.fromRGB(175, 170, 160))
P("PaintingCanvasR", CFrame.new(14.4, 6, 3), Vector3.new(0.1, 3.2, 4.2), Enum.Material.Concrete, Color3.fromRGB(120, 50, 180))
P("BenchSeat", CFrame.new(0, 1.5, 3), Vector3.new(6, 0.4, 1.5), Enum.Material.Wood, Color3.fromRGB(140, 95, 50))
P("BenchLeg1", CFrame.new(-2.5, 0.75, 3), Vector3.new(0.4, 1.5, 1.5), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))
P("BenchLeg2", CFrame.new(2.5, 0.75, 3), Vector3.new(0.4, 1.5, 1.5), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))
P("TrackLightBar", CFrame.new(0, 11.5, -6), Vector3.new(20, 0.3, 0.3), Enum.Material.Metal, Color3.fromRGB(40, 40, 45))
local spot1 = P("Spotlight1", CFrame.new(-8, 11.2, -6), Vector3.new(0.6, 0.8, 0.6), Enum.Material.Neon, Color3.fromRGB(255, 245, 230))
local sp1 = Instance.new("PointLight"); sp1.Range = 15; sp1.Brightness = 2; sp1.Color = Color3.fromRGB(255, 240, 220); sp1.Parent = spot1
local spot2 = P("Spotlight2", CFrame.new(0, 11.2, -6), Vector3.new(0.6, 0.8, 0.6), Enum.Material.Neon, Color3.fromRGB(255, 245, 230))
local sp2 = Instance.new("PointLight"); sp2.Range = 15; sp2.Brightness = 2; sp2.Color = Color3.fromRGB(255, 240, 220); sp2.Parent = spot2
local spot3 = P("Spotlight3", CFrame.new(8, 11.2, -6), Vector3.new(0.6, 0.8, 0.6), Enum.Material.Neon, Color3.fromRGB(255, 245, 230))
local sp3 = Instance.new("PointLight"); sp3.Range = 15; sp3.Brightness = 2; sp3.Color = Color3.fromRGB(255, 240, 220); sp3.Parent = spot3`,
  },
  {
    title: 'Movie Theater Row — seats in row, cup holders, screen at front',
    tags: ['movie', 'theater', 'cinema', 'seats', 'screen', 'entertainment', 'interior'],
    description: 'A movie theater section with rows of red seats, cup holders, large projection screen, dim wall lights, and sloped floor. 22 parts.',
    code: `local folder = getFolder("MovieTheater")
P("SlopedFloor", CFrame.new(0, 1, 0) * CFrame.Angles(math.rad(5), 0, 0), Vector3.new(24, 0.3, 25), Enum.Material.Concrete, Color3.fromRGB(50, 48, 45))
P("Carpet", CFrame.new(0, 1.1, 0) * CFrame.Angles(math.rad(5), 0, 0), Vector3.new(24, 0.05, 25), Enum.Material.Fabric, Color3.fromRGB(80, 30, 30))
P("Screen", CFrame.new(0, 7, -14), Vector3.new(20, 10, 0.3), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))
P("ScreenFrame", CFrame.new(0, 7, -14.2), Vector3.new(21, 11, 0.2), Enum.Material.Metal, Color3.fromRGB(25, 25, 28))
P("SeatRow1_1", CFrame.new(-6, 2, -5), Vector3.new(2, 0.3, 2), Enum.Material.Fabric, Color3.fromRGB(160, 35, 30))
P("SeatRow1_1Back", CFrame.new(-6, 3.5, -6), Vector3.new(2, 2.5, 0.3), Enum.Material.Fabric, Color3.fromRGB(155, 32, 28))
P("SeatRow1_2", CFrame.new(-2, 2, -5), Vector3.new(2, 0.3, 2), Enum.Material.Fabric, Color3.fromRGB(160, 35, 30))
P("SeatRow1_2Back", CFrame.new(-2, 3.5, -6), Vector3.new(2, 2.5, 0.3), Enum.Material.Fabric, Color3.fromRGB(155, 32, 28))
P("SeatRow1_3", CFrame.new(2, 2, -5), Vector3.new(2, 0.3, 2), Enum.Material.Fabric, Color3.fromRGB(160, 35, 30))
P("SeatRow1_3Back", CFrame.new(2, 3.5, -6), Vector3.new(2, 2.5, 0.3), Enum.Material.Fabric, Color3.fromRGB(155, 32, 28))
P("SeatRow1_4", CFrame.new(6, 2, -5), Vector3.new(2, 0.3, 2), Enum.Material.Fabric, Color3.fromRGB(160, 35, 30))
P("SeatRow1_4Back", CFrame.new(6, 3.5, -6), Vector3.new(2, 2.5, 0.3), Enum.Material.Fabric, Color3.fromRGB(155, 32, 28))
P("SeatRow2_1", CFrame.new(-6, 3, 2), Vector3.new(2, 0.3, 2), Enum.Material.Fabric, Color3.fromRGB(160, 35, 30))
P("SeatRow2_1Back", CFrame.new(-6, 4.5, 1), Vector3.new(2, 2.5, 0.3), Enum.Material.Fabric, Color3.fromRGB(155, 32, 28))
P("SeatRow2_2", CFrame.new(-2, 3, 2), Vector3.new(2, 0.3, 2), Enum.Material.Fabric, Color3.fromRGB(160, 35, 30))
P("SeatRow2_2Back", CFrame.new(-2, 4.5, 1), Vector3.new(2, 2.5, 0.3), Enum.Material.Fabric, Color3.fromRGB(155, 32, 28))
P("Armrest1", CFrame.new(-4, 2.5, -5), Vector3.new(0.3, 1, 2), Enum.Material.Metal, Color3.fromRGB(40, 40, 45))
P("Armrest2", CFrame.new(0, 2.5, -5), Vector3.new(0.3, 1, 2), Enum.Material.Metal, Color3.fromRGB(40, 40, 45))
P("CupHolder1", CFrame.new(-4, 2.7, -4.5), Vector3.new(0.6, 0.3, 0.6), Enum.Material.Metal, Color3.fromRGB(35, 35, 38))
P("CupHolder2", CFrame.new(0, 2.7, -4.5), Vector3.new(0.6, 0.3, 0.6), Enum.Material.Metal, Color3.fromRGB(35, 35, 38))
local wallLight = P("WallSconce", CFrame.new(-11.7, 4, 0), Vector3.new(0.3, 1, 0.6), Enum.Material.Neon, Color3.fromRGB(200, 150, 80))
local wl = Instance.new("PointLight"); wl.Range = 8; wl.Brightness = 0.5; wl.Color = Color3.fromRGB(200, 150, 80); wl.Parent = wallLight`,
  },
  {
    title: 'Bowling Alley Lane — lane, gutter walls, pin deck, ball return',
    tags: ['bowling', 'alley', 'lane', 'pins', 'sport', 'game', 'entertainment'],
    description: 'A bowling alley lane with polished lane surface, gutter walls, pin deck area, ball return machine, and approach dots. 20 parts.',
    code: `local folder = getFolder("BowlingAlley")
P("LaneSurface", CFrame.new(0, 0.15, 0), Vector3.new(5, 0.3, 40), Enum.Material.WoodPlanks, Color3.fromRGB(200, 160, 90))
P("GutterL", CFrame.new(-3, 0.1, 0), Vector3.new(1, 0.2, 40), Enum.Material.Metal, Color3.fromRGB(120, 118, 112))
P("GutterR", CFrame.new(3, 0.1, 0), Vector3.new(1, 0.2, 40), Enum.Material.Metal, Color3.fromRGB(120, 118, 112))
P("GutterWallL", CFrame.new(-3.6, 0.5, 0), Vector3.new(0.2, 0.8, 40), Enum.Material.Metal, Color3.fromRGB(130, 128, 122))
P("GutterWallR", CFrame.new(3.6, 0.5, 0), Vector3.new(0.2, 0.8, 40), Enum.Material.Metal, Color3.fromRGB(130, 128, 122))
P("PinDeck", CFrame.new(0, 0.15, -18), Vector3.new(5, 0.3, 4), Enum.Material.WoodPlanks, Color3.fromRGB(190, 150, 85))
P("Pin1", CFrame.new(0, 0.9, -18), Vector3.new(0.4, 1.2, 0.4), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))
P("Pin2", CFrame.new(-0.6, 0.9, -19), Vector3.new(0.4, 1.2, 0.4), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))
P("Pin3", CFrame.new(0.6, 0.9, -19), Vector3.new(0.4, 1.2, 0.4), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))
P("Pin4", CFrame.new(-1.2, 0.9, -20), Vector3.new(0.4, 1.2, 0.4), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))
P("Pin5", CFrame.new(0, 0.9, -20), Vector3.new(0.4, 1.2, 0.4), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))
P("Pin6", CFrame.new(1.2, 0.9, -20), Vector3.new(0.4, 1.2, 0.4), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))
P("PinStripe", CFrame.new(0, 1.2, -18), Vector3.new(0.42, 0.3, 0.42), Enum.Material.Concrete, Color3.fromRGB(200, 40, 35))
P("ApproachArea", CFrame.new(0, 0.15, 16), Vector3.new(5, 0.3, 6), Enum.Material.WoodPlanks, Color3.fromRGB(180, 140, 75))
P("FoulLine", CFrame.new(0, 0.2, 13), Vector3.new(5, 0.05, 0.2), Enum.Material.Concrete, Color3.fromRGB(30, 30, 35))
P("ApproachDot1", CFrame.new(-1, 0.2, 17), Vector3.new(0.3, 0.05, 0.3), Enum.Material.Concrete, Color3.fromRGB(40, 40, 45))
P("ApproachDot2", CFrame.new(1, 0.2, 17), Vector3.new(0.3, 0.05, 0.3), Enum.Material.Concrete, Color3.fromRGB(40, 40, 45))
P("BallReturn", CFrame.new(-5, 1.2, 16), Vector3.new(3, 2, 3), Enum.Material.Metal, Color3.fromRGB(40, 40, 45))
P("BallReturnTop", CFrame.new(-5, 2.3, 16), Vector3.new(3.2, 0.2, 3.2), Enum.Material.Metal, Color3.fromRGB(50, 50, 55))
P("BowlingBall", CFrame.new(-5, 2.7, 16), Vector3.new(1, 1, 1), Enum.Material.Concrete, Color3.fromRGB(30, 80, 160))`,
  },
  {
    title: 'Arcade Machine — cabinet with screen, joystick, buttons, coin slot',
    tags: ['arcade', 'machine', 'cabinet', 'game', 'retro', 'gaming', 'entertainment'],
    description: 'A classic arcade cabinet with screen, joystick, button panel, coin slot, marquee header, and side art panels. 20 parts.',
    code: `local folder = getFolder("ArcadeMachine")
P("CabinetBase", CFrame.new(0, 1, 0), Vector3.new(3, 2, 3), Enum.Material.Wood, Color3.fromRGB(25, 25, 30))
P("CabinetBody", CFrame.new(0, 4, -0.3), Vector3.new(3, 4, 2.5), Enum.Material.Wood, Color3.fromRGB(20, 20, 25))
P("CabinetTop", CFrame.new(0, 7, -0.5), Vector3.new(3, 2, 2), Enum.Material.Wood, Color3.fromRGB(22, 22, 28))
P("CabinetHeader", CFrame.new(0, 8.5, -0.5), Vector3.new(3, 1, 1.5), Enum.Material.Wood, Color3.fromRGB(25, 25, 30))
P("Marquee", CFrame.new(0, 8.5, 0.1), Vector3.new(2.6, 0.8, 0.1), Enum.Material.Neon, Color3.fromRGB(255, 50, 50))
local marq = P("MarqueeGlow", CFrame.new(0, 8.5, 0.2), Vector3.new(0.5, 0.5, 0.1), Enum.Material.Neon, Color3.fromRGB(255, 80, 80))
local mg = Instance.new("PointLight"); mg.Range = 6; mg.Brightness = 1; mg.Color = Color3.fromRGB(255, 80, 80); mg.Parent = marq
P("Screen", CFrame.new(0, 5.5, 0.8) * CFrame.Angles(math.rad(-10), 0, 0), Vector3.new(2.4, 2, 0.1), Enum.Material.Neon, Color3.fromRGB(20, 40, 80))
local screenGlow = P("ScreenGlow", CFrame.new(0, 5.5, 1), Vector3.new(0.5, 0.5, 0.1), Enum.Material.Neon, Color3.fromRGB(40, 80, 160))
local sgl2 = Instance.new("PointLight"); sgl2.Range = 8; sgl2.Brightness = 1; sgl2.Color = Color3.fromRGB(40, 80, 160); sgl2.Parent = screenGlow
P("ControlPanel", CFrame.new(0, 3.5, 1) * CFrame.Angles(math.rad(-20), 0, 0), Vector3.new(2.8, 0.3, 1.5), Enum.Material.Metal, Color3.fromRGB(30, 30, 35))
P("Joystick", CFrame.new(-0.5, 4, 1.2), Vector3.new(0.3, 0.8, 0.3), Enum.Material.Metal, Color3.fromRGB(180, 180, 185))
P("JoystickTop", CFrame.new(-0.5, 4.5, 1.2), Vector3.new(0.5, 0.3, 0.5), Enum.Material.Concrete, Color3.fromRGB(200, 40, 35))
P("Button1", CFrame.new(0.3, 3.8, 1), Vector3.new(0.5, 0.2, 0.5), Enum.Material.Concrete, Color3.fromRGB(255, 50, 50))
P("Button2", CFrame.new(0.9, 3.8, 0.8), Vector3.new(0.5, 0.2, 0.5), Enum.Material.Concrete, Color3.fromRGB(50, 50, 255))
P("Button3", CFrame.new(0.6, 3.8, 1.5), Vector3.new(0.5, 0.2, 0.5), Enum.Material.Concrete, Color3.fromRGB(50, 255, 50))
P("CoinSlot", CFrame.new(0.8, 2.5, 1.3), Vector3.new(0.8, 0.3, 0.1), Enum.Material.Metal, Color3.fromRGB(160, 150, 50))
P("CoinSlotLabel", CFrame.new(0.8, 2.8, 1.3), Vector3.new(0.6, 0.2, 0.08), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))
P("SideArtL", CFrame.new(-1.55, 4, 0), Vector3.new(0.1, 5, 2.5), Enum.Material.Concrete, Color3.fromRGB(200, 50, 180))
P("SideArtR", CFrame.new(1.55, 4, 0), Vector3.new(0.1, 5, 2.5), Enum.Material.Concrete, Color3.fromRGB(50, 180, 220))
P("FloorMat", CFrame.new(0, 0.05, 1.5), Vector3.new(4, 0.08, 3), Enum.Material.Fabric, Color3.fromRGB(30, 30, 35))`,
  },
  {
    title: 'Diner / 50s Restaurant — booth seating, jukebox, checkered floor, counter with stools',
    tags: ['diner', 'restaurant', '50s', 'retro', 'jukebox', 'booth', 'interior'],
    description: 'A 1950s diner with red vinyl booth seating, checkered floor, chrome counter with stools, jukebox, and neon sign glow. 28 parts.',
    code: `local folder = getFolder("RetrosDiner")
P("CheckerFloor1", CFrame.new(0, 0.1, 0), Vector3.new(26, 0.2, 20), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))
P("CheckerFloor2", CFrame.new(-5, 0.12, -5), Vector3.new(5, 0.05, 5), Enum.Material.Concrete, Color3.fromRGB(30, 30, 32))
P("CheckerFloor3", CFrame.new(5, 0.12, -5), Vector3.new(5, 0.05, 5), Enum.Material.Concrete, Color3.fromRGB(30, 30, 32))
P("CheckerFloor4", CFrame.new(-5, 0.12, 5), Vector3.new(5, 0.05, 5), Enum.Material.Concrete, Color3.fromRGB(30, 30, 32))
P("CheckerFloor5", CFrame.new(5, 0.12, 5), Vector3.new(5, 0.05, 5), Enum.Material.Concrete, Color3.fromRGB(30, 30, 32))
P("CheckerFloor6", CFrame.new(0, 0.12, 0), Vector3.new(5, 0.05, 5), Enum.Material.Concrete, Color3.fromRGB(30, 30, 32))
P("WallBack", CFrame.new(0, 5, -10), Vector3.new(26, 10, 0.5), Enum.Material.Concrete, Color3.fromRGB(200, 220, 210))
P("BoothSeatL", CFrame.new(-10, 1.5, -5), Vector3.new(3, 1.5, 5), Enum.Material.Fabric, Color3.fromRGB(180, 40, 35))
P("BoothBackL", CFrame.new(-11.2, 3.5, -5), Vector3.new(0.5, 3, 5), Enum.Material.Fabric, Color3.fromRGB(175, 38, 32))
P("BoothSeatR", CFrame.new(-10, 1.5, 3), Vector3.new(3, 1.5, 5), Enum.Material.Fabric, Color3.fromRGB(180, 40, 35))
P("BoothBackR", CFrame.new(-11.2, 3.5, 3), Vector3.new(0.5, 3, 5), Enum.Material.Fabric, Color3.fromRGB(175, 38, 32))
P("BoothTable", CFrame.new(-8.5, 2.5, -1), Vector3.new(3, 0.3, 3), Enum.Material.Concrete, Color3.fromRGB(240, 230, 210))
P("BoothTableLeg", CFrame.new(-8.5, 1.25, -1), Vector3.new(0.5, 2.5, 0.5), Enum.Material.Metal, Color3.fromRGB(180, 180, 185))
P("CounterTop", CFrame.new(5, 3.5, 0), Vector3.new(10, 0.4, 2), Enum.Material.Concrete, Color3.fromRGB(220, 210, 195))
P("CounterFront", CFrame.new(5, 2, 1), Vector3.new(10, 3, 0.3), Enum.Material.Metal, Color3.fromRGB(190, 190, 195))
P("CounterBase", CFrame.new(5, 0.5, -0.5), Vector3.new(10, 1, 2.5), Enum.Material.Concrete, Color3.fromRGB(200, 195, 185))
P("Stool1Seat", CFrame.new(2, 2, 2), Vector3.new(1.2, 0.3, 1.2), Enum.Material.Fabric, Color3.fromRGB(180, 40, 35))
P("Stool1Pole", CFrame.new(2, 1, 2), Vector3.new(0.3, 2, 0.3), Enum.Material.Metal, Color3.fromRGB(185, 185, 190))
P("Stool2Seat", CFrame.new(5, 2, 2), Vector3.new(1.2, 0.3, 1.2), Enum.Material.Fabric, Color3.fromRGB(180, 40, 35))
P("Stool2Pole", CFrame.new(5, 1, 2), Vector3.new(0.3, 2, 0.3), Enum.Material.Metal, Color3.fromRGB(185, 185, 190))
P("Stool3Seat", CFrame.new(8, 2, 2), Vector3.new(1.2, 0.3, 1.2), Enum.Material.Fabric, Color3.fromRGB(180, 40, 35))
P("Stool3Pole", CFrame.new(8, 1, 2), Vector3.new(0.3, 2, 0.3), Enum.Material.Metal, Color3.fromRGB(185, 185, 190))
P("JukeboxBody", CFrame.new(10, 2.5, -8), Vector3.new(2.5, 5, 1.5), Enum.Material.Wood, Color3.fromRGB(120, 50, 30))
P("JukeboxTop", CFrame.new(10, 5.2, -8), Vector3.new(2.5, 1, 1.5), Enum.Material.Metal, Color3.fromRGB(190, 190, 195))
P("JukeboxGrill", CFrame.new(10, 2, -7.2), Vector3.new(2, 2, 0.1), Enum.Material.Metal, Color3.fromRGB(180, 160, 50))
local jukeGlow = P("JukeboxGlow", CFrame.new(10, 3.5, -7.2), Vector3.new(1.5, 1, 0.1), Enum.Material.Neon, Color3.fromRGB(255, 100, 200))
local jg = Instance.new("PointLight"); jg.Range = 10; jg.Brightness = 1; jg.Color = Color3.fromRGB(255, 100, 200); jg.Parent = jukeGlow
P("NapkinHolder", CFrame.new(-8.5, 2.9, -1), Vector3.new(0.5, 0.6, 0.3), Enum.Material.Metal, Color3.fromRGB(185, 185, 190))`,
  },
  {
    title: 'Zen Garden — raked sand, stepping stones, bonsai tree, bamboo fence, water feature',
    tags: ['zen', 'garden', 'japanese', 'peaceful', 'bonsai', 'bamboo', 'meditation'],
    description: 'A tranquil zen garden with raked sand patterns, stepping stones, a bonsai tree, bamboo fence, water basin, and stone lantern. 26 parts.',
    code: `local folder = getFolder("ZenGarden")
P("SandBase", CFrame.new(0, 0.15, 0), Vector3.new(30, 0.3, 25), Enum.Material.Sand, Color3.fromRGB(210, 200, 175))
P("SandRake1", CFrame.new(0, 0.2, -3), Vector3.new(20, 0.02, 0.15), Enum.Material.Sand, Color3.fromRGB(195, 185, 160))
P("SandRake2", CFrame.new(0, 0.2, -1.5), Vector3.new(20, 0.02, 0.15), Enum.Material.Sand, Color3.fromRGB(195, 185, 160))
P("SandRake3", CFrame.new(0, 0.2, 0), Vector3.new(20, 0.02, 0.15), Enum.Material.Sand, Color3.fromRGB(195, 185, 160))
P("SandRake4", CFrame.new(0, 0.2, 1.5), Vector3.new(20, 0.02, 0.15), Enum.Material.Sand, Color3.fromRGB(195, 185, 160))
P("SandRake5", CFrame.new(0, 0.2, 3), Vector3.new(20, 0.02, 0.15), Enum.Material.Sand, Color3.fromRGB(195, 185, 160))
P("StepStone1", CFrame.new(-5, 0.25, -6), Vector3.new(2, 0.2, 2), Enum.Material.Slate, Color3.fromRGB(130, 125, 115))
P("StepStone2", CFrame.new(-3, 0.25, -3), Vector3.new(1.8, 0.2, 1.8), Enum.Material.Slate, Color3.fromRGB(135, 130, 120))
P("StepStone3", CFrame.new(-1, 0.25, -1), Vector3.new(2, 0.2, 2), Enum.Material.Slate, Color3.fromRGB(128, 122, 112))
P("StepStone4", CFrame.new(1, 0.25, 2), Vector3.new(1.8, 0.2, 1.8), Enum.Material.Slate, Color3.fromRGB(132, 126, 116))
P("StepStone5", CFrame.new(3, 0.25, 5), Vector3.new(2, 0.2, 2), Enum.Material.Slate, Color3.fromRGB(130, 124, 114))
P("BonsaiPot", CFrame.new(8, 0.8, -6), Vector3.new(2, 1.2, 2), Enum.Material.Concrete, Color3.fromRGB(100, 70, 40))
P("BonsaiTrunk", CFrame.new(8, 2, -6), Vector3.new(0.5, 2, 0.5), Enum.Material.Wood, Color3.fromRGB(80, 55, 28))
P("BonsaiCanopy", CFrame.new(8, 3.5, -6), Vector3.new(3, 1.5, 3), Enum.Material.Grass, Color3.fromRGB(40, 90, 32))
P("BonsaiCanopyTop", CFrame.new(8.5, 4.5, -5.5), Vector3.new(2, 1, 2), Enum.Material.Grass, Color3.fromRGB(45, 95, 35))
P("BambooFencePost1", CFrame.new(-14, 2, -10), Vector3.new(0.5, 4, 0.5), Enum.Material.Wood, Color3.fromRGB(140, 150, 80))
P("BambooFencePost2", CFrame.new(-14, 2, -5), Vector3.new(0.5, 4, 0.5), Enum.Material.Wood, Color3.fromRGB(135, 145, 75))
P("BambooFencePost3", CFrame.new(-14, 2, 0), Vector3.new(0.5, 4, 0.5), Enum.Material.Wood, Color3.fromRGB(140, 150, 80))
P("BambooFenceRail1", CFrame.new(-14, 3, -7.5), Vector3.new(0.3, 0.3, 5.5), Enum.Material.Wood, Color3.fromRGB(138, 148, 78))
P("BambooFenceRail2", CFrame.new(-14, 1.5, -7.5), Vector3.new(0.3, 0.3, 5.5), Enum.Material.Wood, Color3.fromRGB(138, 148, 78))
P("BambooFenceRail3", CFrame.new(-14, 3, -2.5), Vector3.new(0.3, 0.3, 5.5), Enum.Material.Wood, Color3.fromRGB(138, 148, 78))
P("BambooFenceRail4", CFrame.new(-14, 1.5, -2.5), Vector3.new(0.3, 0.3, 5.5), Enum.Material.Wood, Color3.fromRGB(138, 148, 78))
P("WaterBasin", CFrame.new(-8, 1, 8), Vector3.new(3, 2, 3), Enum.Material.Slate, Color3.fromRGB(100, 95, 85))
P("WaterBasinWater", CFrame.new(-8, 1.5, 8), Vector3.new(2, 0.3, 2), Enum.Material.Glass, Color3.fromRGB(100, 160, 200))
P("StoneLanternBase", CFrame.new(5, 0.6, 8), Vector3.new(2, 1, 2), Enum.Material.Slate, Color3.fromRGB(120, 115, 105))
P("StoneLanternPillar", CFrame.new(5, 2, 8), Vector3.new(1, 2, 1), Enum.Material.Slate, Color3.fromRGB(125, 120, 110))
P("StoneLanternRoof", CFrame.new(5, 3.5, 8), Vector3.new(2.5, 0.5, 2.5), Enum.Material.Slate, Color3.fromRGB(115, 110, 100))
local lanternGlow = P("StoneLanternGlow", CFrame.new(5, 2.5, 8), Vector3.new(0.5, 0.5, 0.5), Enum.Material.Neon, Color3.fromRGB(255, 220, 120))
local zlg = Instance.new("PointLight"); zlg.Range = 10; zlg.Brightness = 1; zlg.Color = Color3.fromRGB(255, 210, 100); zlg.Parent = lanternGlow`,
  },
]
