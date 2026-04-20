/**
 * Game mechanic and interactive object templates.
 * These teach the AI how to build FUNCTIONAL game elements, not just decorations.
 */
import { BuildTemplate } from './build-template-chunks'

export const GAME_MECHANIC_TEMPLATES: BuildTemplate[] = [
  {
    title: 'Teleporter Pad — glowing pad that teleports players',
    tags: ['teleporter', 'teleport', 'pad', 'portal', 'warp', 'transport', 'game'],
    description: 'A glowing teleporter pad with base ring, inner glow, particle-ready center, and destination marker. 8 parts. Named for script attachment.',
    code: `local folder = getFolder("Teleporter")
P("TeleBase", CFrame.new(0, 0.15, 0), Vector3.new(6, 0.3, 6), Enum.Material.Metal, Color3.fromRGB(60, 60, 70))
P("TeleRing", CFrame.new(0, 0.35, 0), Vector3.new(5.5, 0.1, 5.5), Enum.Material.Neon, Color3.fromRGB(80, 200, 255))
P("TeleInner", CFrame.new(0, 0.25, 0), Vector3.new(4, 0.2, 4), Enum.Material.Neon, Color3.fromRGB(100, 220, 255))
P("TeleCenter", CFrame.new(0, 0.5, 0), Vector3.new(2, 0.1, 2), Enum.Material.Neon, Color3.fromRGB(200, 240, 255))
P("TelePillarL", CFrame.new(-3.2, 3, 0), Vector3.new(0.4, 5, 0.4), Enum.Material.Metal, Color3.fromRGB(70, 70, 80))
P("TelePillarR", CFrame.new(3.2, 3, 0), Vector3.new(0.4, 5, 0.4), Enum.Material.Metal, Color3.fromRGB(70, 70, 80))
P("TeleArch", CFrame.new(0, 5.75, 0), Vector3.new(6.8, 0.5, 0.4), Enum.Material.Neon, Color3.fromRGB(80, 200, 255))
local glow = P("TeleGlow", CFrame.new(0, 1, 0), Vector3.new(1, 1, 1), Enum.Material.Neon, Color3.fromRGB(150, 230, 255))
local gl = Instance.new("PointLight"); gl.Range = 20; gl.Brightness = 1.5; gl.Color = Color3.fromRGB(100, 200, 255); gl.Parent = glow`,
  },
  {
    title: 'Bounce Pad / Trampoline — launches players upward',
    tags: ['bounce', 'trampoline', 'jump', 'pad', 'launcher', 'obby', 'game'],
    description: 'A bouncy pad that launches players: metal frame, spring-like supports, colorful bounce surface. 8 parts.',
    code: `local folder = getFolder("BouncePad")
P("Frame", CFrame.new(0, 0.3, 0), Vector3.new(5, 0.6, 5), Enum.Material.Metal, Color3.fromRGB(80, 80, 85))
P("SpringFL", CFrame.new(-1.8, 0.8, -1.8), Vector3.new(0.3, 0.5, 0.3), Enum.Material.Metal, Color3.fromRGB(200, 200, 205))
P("SpringFR", CFrame.new(1.8, 0.8, -1.8), Vector3.new(0.3, 0.5, 0.3), Enum.Material.Metal, Color3.fromRGB(200, 200, 205))
P("SpringBL", CFrame.new(-1.8, 0.8, 1.8), Vector3.new(0.3, 0.5, 0.3), Enum.Material.Metal, Color3.fromRGB(200, 200, 205))
P("SpringBR", CFrame.new(1.8, 0.8, 1.8), Vector3.new(0.3, 0.5, 0.3), Enum.Material.Metal, Color3.fromRGB(200, 200, 205))
P("BounceSurface", CFrame.new(0, 1.1, 0), Vector3.new(4.5, 0.2, 4.5), Enum.Material.Fabric, Color3.fromRGB(50, 200, 50))
P("BounceCenter", CFrame.new(0, 1.15, 0), Vector3.new(2, 0.1, 2), Enum.Material.Neon, Color3.fromRGB(100, 255, 100))
P("Arrow", CFrame.new(0, 1.2, 0), Vector3.new(0.5, 0.05, 1.5), Enum.Material.Neon, Color3.fromRGB(255, 255, 100))`,
  },
  {
    title: 'Loot Crate / Supply Drop — openable crate with glow',
    tags: ['loot', 'crate', 'supply', 'drop', 'chest', 'reward', 'item', 'game'],
    description: 'A supply drop crate with military markings: crate body, lid (hinged open), parachute remnant, glow beam, and smoke particle anchor. 10 parts.',
    code: `local folder = getFolder("LootCrate")
P("CrateBody", CFrame.new(0, 1.5, 0), Vector3.new(4, 3, 3), Enum.Material.Metal, Color3.fromRGB(60, 80, 60))
P("CrateRim", CFrame.new(0, 3.1, 0), Vector3.new(4.2, 0.2, 3.2), Enum.Material.Metal, Color3.fromRGB(50, 70, 50))
P("CrateLid", CFrame.new(0, 3.4, -1.2) * CFrame.Angles(math.rad(-30), 0, 0), Vector3.new(4, 0.3, 3), Enum.Material.Metal, Color3.fromRGB(55, 75, 55))
P("CrateLatch", CFrame.new(0, 2.5, 1.55), Vector3.new(0.8, 0.5, 0.2), Enum.Material.Metal, Color3.fromRGB(180, 160, 40))
P("CrateStripe", CFrame.new(0, 1.5, 1.55), Vector3.new(3.5, 0.5, 0.1), Enum.Material.Concrete, Color3.fromRGB(200, 180, 40))
P("ParachuteCanopy", CFrame.new(0, 8, 0), Vector3.new(6, 1, 6), Enum.Material.Fabric, Color3.fromRGB(220, 220, 220))
P("ParachuteRopeL", CFrame.new(-1.5, 5, 0), Vector3.new(0.1, 5, 0.1), Enum.Material.Fabric, Color3.fromRGB(180, 180, 170))
P("ParachuteRopeR", CFrame.new(1.5, 5, 0), Vector3.new(0.1, 5, 0.1), Enum.Material.Fabric, Color3.fromRGB(180, 180, 170))
local beam = P("GlowBeam", CFrame.new(0, 6, 0), Vector3.new(1, 8, 1), Enum.Material.Neon, Color3.fromRGB(255, 220, 50))
local bl = Instance.new("PointLight"); bl.Range = 30; bl.Brightness = 2; bl.Color = Color3.fromRGB(255, 200, 50); bl.Parent = beam
P("SmokeAnchor", CFrame.new(0, 0.5, 0), Vector3.new(0.5, 0.5, 0.5), Enum.Material.Concrete, Color3.fromRGB(100, 100, 100))`,
  },
  {
    title: 'Elevator — enclosed lift with doors and floor indicator',
    tags: ['elevator', 'lift', 'vertical', 'transport', 'building', 'game'],
    description: 'An elevator car: floor, 3 walls, ceiling, sliding door pair, control panel, and floor indicator light. 12 parts.',
    code: `local folder = getFolder("Elevator")
P("ElevFloor", CFrame.new(0, 0.15, 0), Vector3.new(6, 0.3, 6), Enum.Material.Metal, Color3.fromRGB(160, 158, 150))
P("ElevCeiling", CFrame.new(0, 8.25, 0), Vector3.new(6, 0.3, 6), Enum.Material.Metal, Color3.fromRGB(150, 148, 140))
P("WallBack", CFrame.new(0, 4.2, -3), Vector3.new(6, 7.8, 0.3), Enum.Material.Metal, Color3.fromRGB(170, 168, 160))
P("WallLeft", CFrame.new(-3, 4.2, 0), Vector3.new(0.3, 7.8, 5.7), Enum.Material.Metal, Color3.fromRGB(165, 163, 155))
P("WallRight", CFrame.new(3, 4.2, 0), Vector3.new(0.3, 7.8, 5.7), Enum.Material.Metal, Color3.fromRGB(165, 163, 155))
P("DoorLeft", CFrame.new(-1.25, 4, 3), Vector3.new(2.5, 7.5, 0.2), Enum.Material.Metal, Color3.fromRGB(180, 178, 170))
P("DoorRight", CFrame.new(1.25, 4, 3), Vector3.new(2.5, 7.5, 0.2), Enum.Material.Metal, Color3.fromRGB(180, 178, 170))
P("DoorFrame", CFrame.new(0, 4, 3.15), Vector3.new(5.5, 8, 0.1), Enum.Material.Metal, Color3.fromRGB(140, 138, 130))
P("ControlPanel", CFrame.new(-2.7, 4, 1), Vector3.new(0.1, 2, 1), Enum.Material.Metal, Color3.fromRGB(50, 50, 55))
P("ButtonUp", CFrame.new(-2.65, 4.5, 1), Vector3.new(0.1, 0.3, 0.3), Enum.Material.Neon, Color3.fromRGB(50, 200, 50))
P("ButtonDown", CFrame.new(-2.65, 3.5, 1), Vector3.new(0.1, 0.3, 0.3), Enum.Material.Neon, Color3.fromRGB(200, 50, 50))
local indicator = P("FloorIndicator", CFrame.new(0, 7.5, -2.8), Vector3.new(1.5, 0.8, 0.1), Enum.Material.Neon, Color3.fromRGB(50, 200, 255))
local il = Instance.new("PointLight"); il.Range = 5; il.Brightness = 0.5; il.Color = Color3.fromRGB(50, 200, 255); il.Parent = indicator`,
  },
  {
    title: 'Race Start Gate — starting line with lights and countdown',
    tags: ['race', 'start', 'gate', 'racing', 'countdown', 'track', 'car', 'game'],
    description: 'A race starting gate: archway over road, 3 traffic lights (red/yellow/green), checkered banner, and start line on ground. 14 parts.',
    code: `local folder = getFolder("RaceGate")
P("StartLine", CFrame.new(0, 0.08, 0), Vector3.new(16, 0.05, 1), Enum.Material.Concrete, Color3.fromRGB(240, 240, 240))
P("CheckerStripe1", CFrame.new(-4, 0.09, 0), Vector3.new(2, 0.05, 1), Enum.Material.Concrete, Color3.fromRGB(30, 30, 30))
P("CheckerStripe2", CFrame.new(0, 0.09, 0), Vector3.new(2, 0.05, 1), Enum.Material.Concrete, Color3.fromRGB(30, 30, 30))
P("CheckerStripe3", CFrame.new(4, 0.09, 0), Vector3.new(2, 0.05, 1), Enum.Material.Concrete, Color3.fromRGB(30, 30, 30))
P("PillarL", CFrame.new(-8, 6, 0), Vector3.new(1, 12, 1), Enum.Material.Metal, Color3.fromRGB(200, 200, 205))
P("PillarR", CFrame.new(8, 6, 0), Vector3.new(1, 12, 1), Enum.Material.Metal, Color3.fromRGB(200, 200, 205))
P("Crossbar", CFrame.new(0, 12.25, 0), Vector3.new(17, 0.5, 1), Enum.Material.Metal, Color3.fromRGB(50, 50, 55))
P("LightBoxRed", CFrame.new(0, 11, 0.6), Vector3.new(1.2, 1.2, 0.3), Enum.Material.Neon, Color3.fromRGB(255, 30, 30))
P("LightBoxYellow", CFrame.new(0, 9.5, 0.6), Vector3.new(1.2, 1.2, 0.3), Enum.Material.Metal, Color3.fromRGB(80, 80, 40))
P("LightBoxGreen", CFrame.new(0, 8, 0.6), Vector3.new(1.2, 1.2, 0.3), Enum.Material.Metal, Color3.fromRGB(40, 80, 40))
P("LightHousing", CFrame.new(0, 9.5, 0.4), Vector3.new(1.8, 5, 0.5), Enum.Material.Metal, Color3.fromRGB(30, 30, 35))
P("Banner", CFrame.new(0, 12.5, -0.5), Vector3.new(12, 2, 0.1), Enum.Material.Fabric, Color3.fromRGB(240, 240, 240))
P("BannerStripe1", CFrame.new(-3, 12.5, -0.55), Vector3.new(2, 2, 0.05), Enum.Material.Fabric, Color3.fromRGB(30, 30, 30))
P("BannerStripe2", CFrame.new(3, 12.5, -0.55), Vector3.new(2, 2, 0.05), Enum.Material.Fabric, Color3.fromRGB(30, 30, 30))`,
  },
  {
    title: 'Tower Defense Tower Spot — buildable platform with range indicator',
    tags: ['tower', 'defense', 'td', 'spot', 'build', 'placement', 'game', 'strategy'],
    description: 'A tower defense placement spot: circular platform with glowing ring showing range, and a sample turret on top. 10 parts.',
    code: `local folder = getFolder("TDSpot")
P("SpotBase", CFrame.new(0, 0.15, 0), Vector3.new(4, 0.3, 4), Enum.Material.Concrete, Color3.fromRGB(160, 158, 150))
P("SpotRing", CFrame.new(0, 0.2, 0), Vector3.new(4.2, 0.05, 4.2), Enum.Material.Neon, Color3.fromRGB(100, 255, 100))
P("RangeIndicator", CFrame.new(0, 0.1, 0), Vector3.new(20, 0.02, 20), Enum.Material.Neon, Color3.fromRGB(100, 255, 100))
P("TurretBase", CFrame.new(0, 0.75, 0), Vector3.new(2, 1, 2), Enum.Material.Metal, Color3.fromRGB(80, 100, 80))
P("TurretBody", CFrame.new(0, 1.8, 0), Vector3.new(1.5, 1.5, 1.5), Enum.Material.Metal, Color3.fromRGB(70, 90, 70))
P("TurretBarrel", CFrame.new(0, 1.8, -1.5), Vector3.new(0.4, 0.4, 2.5), Enum.Material.Metal, Color3.fromRGB(50, 50, 55))
P("TurretMuzzle", CFrame.new(0, 1.8, -2.8), Vector3.new(0.6, 0.6, 0.2), Enum.Material.Metal, Color3.fromRGB(40, 40, 45))
P("AmmoBox", CFrame.new(1.2, 0.5, 0.5), Vector3.new(0.8, 0.6, 0.6), Enum.Material.Metal, Color3.fromRGB(60, 80, 60))
P("LevelStar", CFrame.new(0, 2.8, 0), Vector3.new(0.5, 0.5, 0.1), Enum.Material.Neon, Color3.fromRGB(255, 220, 50))
P("CostTag", CFrame.new(0, 0.5, 2.2), Vector3.new(1.5, 0.8, 0.1), Enum.Material.Metal, Color3.fromRGB(40, 40, 45))`,
  },
  {
    title: 'Shop / Store NPC Counter — where players buy items',
    tags: ['shop', 'store', 'npc', 'counter', 'buy', 'sell', 'merchant', 'game'],
    description: 'An NPC shop counter: L-shaped counter with register, display shelves behind, item display cases, and glowing "SHOP" sign. 16 parts.',
    code: `local folder = getFolder("ShopCounter")
P("CounterFront", CFrame.new(0, 2, 0), Vector3.new(8, 4, 1.5), Enum.Material.Wood, Color3.fromRGB(130, 82, 38))
P("CounterTop", CFrame.new(0, 4.1, 0), Vector3.new(8.5, 0.3, 2), Enum.Material.Slate, Color3.fromRGB(60, 60, 65))
P("CounterSide", CFrame.new(-4, 2, -2), Vector3.new(1.5, 4, 3), Enum.Material.Wood, Color3.fromRGB(125, 78, 35))
P("Register", CFrame.new(2, 4.7, 0), Vector3.new(1.2, 0.9, 1.2), Enum.Material.Metal, Color3.fromRGB(50, 50, 55))
P("RegisterScreen", CFrame.new(2, 5.4, 0.1), Vector3.new(0.9, 0.5, 0.1), Enum.Material.Neon, Color3.fromRGB(80, 200, 80))
P("ShelfBack", CFrame.new(0, 4, -4), Vector3.new(10, 8, 0.5), Enum.Material.Wood, Color3.fromRGB(120, 75, 35))
P("Shelf1", CFrame.new(0, 2.5, -3.5), Vector3.new(9.5, 0.3, 1.5), Enum.Material.Wood, Color3.fromRGB(130, 82, 38))
P("Shelf2", CFrame.new(0, 5, -3.5), Vector3.new(9.5, 0.3, 1.5), Enum.Material.Wood, Color3.fromRGB(130, 82, 38))
P("Shelf3", CFrame.new(0, 7.5, -3.5), Vector3.new(9.5, 0.3, 1.5), Enum.Material.Wood, Color3.fromRGB(130, 82, 38))
P("DisplayCase", CFrame.new(-2, 4.7, 0.3), Vector3.new(2.5, 1, 1.2), Enum.Material.Glass, Color3.fromRGB(200, 220, 240))
P("ItemA", CFrame.new(-2.5, 3, -3.5), Vector3.new(0.8, 0.8, 0.8), Enum.Material.Metal, Color3.fromRGB(200, 180, 60))
P("ItemB", CFrame.new(-0.5, 3, -3.5), Vector3.new(0.6, 1, 0.6), Enum.Material.Glass, Color3.fromRGB(200, 60, 60))
P("ItemC", CFrame.new(2, 5.5, -3.5), Vector3.new(1, 0.8, 0.6), Enum.Material.Fabric, Color3.fromRGB(60, 120, 200))
P("ItemD", CFrame.new(-1, 5.5, -3.5), Vector3.new(0.8, 0.8, 0.8), Enum.Material.Wood, Color3.fromRGB(140, 90, 45))
local sign = P("ShopSign", CFrame.new(0, 8.5, -4.3), Vector3.new(6, 1.5, 0.3), Enum.Material.Neon, Color3.fromRGB(255, 220, 50))
local sl = Instance.new("PointLight"); sl.Range = 15; sl.Brightness = 1; sl.Color = Color3.fromRGB(255, 220, 50); sl.Parent = sign`,
  },
  {
    title: 'Voting Podium — 3 voting pedestals with buttons',
    tags: ['vote', 'voting', 'podium', 'choice', 'selection', 'minigame', 'game', 'lobby'],
    description: 'Three voting pedestals in a row, each with a colored button and display screen. Used for map/mode voting in lobbies. 15 parts.',
    code: `local folder = getFolder("VotingPodium")
P("VoteFloor", CFrame.new(0, 0.1, 0), Vector3.new(18, 0.2, 6), Enum.Material.Concrete, Color3.fromRGB(170, 168, 160))
P("Pedestal1", CFrame.new(-6, 2, 0), Vector3.new(3, 3.5, 3), Enum.Material.Concrete, Color3.fromRGB(200, 195, 185))
P("Button1", CFrame.new(-6, 3.9, 1), Vector3.new(1.2, 0.3, 1.2), Enum.Material.Neon, Color3.fromRGB(255, 80, 80))
P("Screen1", CFrame.new(-6, 5, 0), Vector3.new(2.5, 1.5, 0.2), Enum.Material.Metal, Color3.fromRGB(30, 30, 35))
P("Screen1Glow", CFrame.new(-6, 5, -0.05), Vector3.new(2.2, 1.2, 0.1), Enum.Material.Neon, Color3.fromRGB(255, 100, 100))
P("Pedestal2", CFrame.new(0, 2, 0), Vector3.new(3, 3.5, 3), Enum.Material.Concrete, Color3.fromRGB(200, 195, 185))
P("Button2", CFrame.new(0, 3.9, 1), Vector3.new(1.2, 0.3, 1.2), Enum.Material.Neon, Color3.fromRGB(80, 200, 80))
P("Screen2", CFrame.new(0, 5, 0), Vector3.new(2.5, 1.5, 0.2), Enum.Material.Metal, Color3.fromRGB(30, 30, 35))
P("Screen2Glow", CFrame.new(0, 5, -0.05), Vector3.new(2.2, 1.2, 0.1), Enum.Material.Neon, Color3.fromRGB(100, 255, 100))
P("Pedestal3", CFrame.new(6, 2, 0), Vector3.new(3, 3.5, 3), Enum.Material.Concrete, Color3.fromRGB(200, 195, 185))
P("Button3", CFrame.new(6, 3.9, 1), Vector3.new(1.2, 0.3, 1.2), Enum.Material.Neon, Color3.fromRGB(80, 120, 255))
P("Screen3", CFrame.new(6, 5, 0), Vector3.new(2.5, 1.5, 0.2), Enum.Material.Metal, Color3.fromRGB(30, 30, 35))
P("Screen3Glow", CFrame.new(6, 5, -0.05), Vector3.new(2.2, 1.2, 0.1), Enum.Material.Neon, Color3.fromRGB(100, 150, 255))
P("VoteSign", CFrame.new(0, 7, 0), Vector3.new(10, 2, 0.3), Enum.Material.Metal, Color3.fromRGB(40, 40, 45))
P("VoteSignGlow", CFrame.new(0, 7, -0.1), Vector3.new(9, 1.5, 0.1), Enum.Material.Neon, Color3.fromRGB(255, 255, 200))`,
  },
  {
    title: 'Dance Floor — lit-up floor tiles with DJ booth',
    tags: ['dance', 'floor', 'disco', 'dj', 'party', 'music', 'nightclub', 'game'],
    description: 'A dance floor with 9 colored light-up tiles, DJ booth with turntables, speakers, and disco ball. 20 parts.',
    code: `local folder = getFolder("DanceFloor")
P("FloorBase", CFrame.new(0, 0.1, 0), Vector3.new(15, 0.2, 15), Enum.Material.Metal, Color3.fromRGB(30, 30, 35))
P("Tile1", CFrame.new(-4, 0.15, -4), Vector3.new(4.5, 0.1, 4.5), Enum.Material.Neon, Color3.fromRGB(255, 50, 50))
P("Tile2", CFrame.new(0, 0.15, -4), Vector3.new(4.5, 0.1, 4.5), Enum.Material.Neon, Color3.fromRGB(50, 255, 50))
P("Tile3", CFrame.new(4, 0.15, -4), Vector3.new(4.5, 0.1, 4.5), Enum.Material.Neon, Color3.fromRGB(50, 50, 255))
P("Tile4", CFrame.new(-4, 0.15, 0), Vector3.new(4.5, 0.1, 4.5), Enum.Material.Neon, Color3.fromRGB(255, 255, 50))
P("Tile5", CFrame.new(0, 0.15, 0), Vector3.new(4.5, 0.1, 4.5), Enum.Material.Neon, Color3.fromRGB(255, 50, 255))
P("Tile6", CFrame.new(4, 0.15, 0), Vector3.new(4.5, 0.1, 4.5), Enum.Material.Neon, Color3.fromRGB(50, 255, 255))
P("Tile7", CFrame.new(-4, 0.15, 4), Vector3.new(4.5, 0.1, 4.5), Enum.Material.Neon, Color3.fromRGB(255, 150, 50))
P("Tile8", CFrame.new(0, 0.15, 4), Vector3.new(4.5, 0.1, 4.5), Enum.Material.Neon, Color3.fromRGB(150, 50, 255))
P("Tile9", CFrame.new(4, 0.15, 4), Vector3.new(4.5, 0.1, 4.5), Enum.Material.Neon, Color3.fromRGB(50, 255, 150))
P("DJBooth", CFrame.new(0, 2, -9), Vector3.new(6, 3.5, 2), Enum.Material.Metal, Color3.fromRGB(40, 40, 45))
P("DJTable", CFrame.new(0, 3.9, -9), Vector3.new(6.5, 0.3, 2.5), Enum.Material.Metal, Color3.fromRGB(50, 50, 55))
P("Turntable1", CFrame.new(-1.5, 4.2, -9), Vector3.new(1.5, 0.2, 1.5), Enum.Material.Metal, Color3.fromRGB(30, 30, 35))
P("Turntable2", CFrame.new(1.5, 4.2, -9), Vector3.new(1.5, 0.2, 1.5), Enum.Material.Metal, Color3.fromRGB(30, 30, 35))
P("SpeakerL", CFrame.new(-5, 3, -9), Vector3.new(2, 5, 2), Enum.Material.Metal, Color3.fromRGB(25, 25, 30))
P("SpeakerR", CFrame.new(5, 3, -9), Vector3.new(2, 5, 2), Enum.Material.Metal, Color3.fromRGB(25, 25, 30))
P("SpeakerConeL", CFrame.new(-5, 3, -7.9), Vector3.new(1.2, 1.2, 0.2), Enum.Material.Concrete, Color3.fromRGB(50, 50, 55))
P("SpeakerConeR", CFrame.new(5, 3, -7.9), Vector3.new(1.2, 1.2, 0.2), Enum.Material.Concrete, Color3.fromRGB(50, 50, 55))
local disco = P("DiscoBall", CFrame.new(0, 12, 0), Vector3.new(2, 2, 2), Enum.Material.Metal, Color3.fromRGB(220, 220, 230))
local dl = Instance.new("PointLight"); dl.Range = 40; dl.Brightness = 2; dl.Color = Color3.fromRGB(255, 255, 255); dl.Parent = disco`,
  },
  {
    title: 'Portal — magical doorway with swirling energy',
    tags: ['portal', 'magic', 'gateway', 'dimension', 'teleport', 'fantasy', 'game', 'warp'],
    description: 'A magical portal: stone archway frame with glowing inner surface and energy ring. 10 parts.',
    code: `local folder = getFolder("Portal")
P("ArchBase", CFrame.new(0, 0.5, 0), Vector3.new(8, 1, 2), Enum.Material.Slate, Color3.fromRGB(60, 55, 70))
P("ArchPillarL", CFrame.new(-3.5, 5.5, 0), Vector3.new(1.5, 10, 1.5), Enum.Material.Slate, Color3.fromRGB(65, 60, 75))
P("ArchPillarR", CFrame.new(3.5, 5.5, 0), Vector3.new(1.5, 10, 1.5), Enum.Material.Slate, Color3.fromRGB(65, 60, 75))
P("ArchTop", CFrame.new(0, 11, 0), Vector3.new(9, 1.5, 1.5), Enum.Material.Slate, Color3.fromRGB(70, 65, 80))
P("ArchKeystone", CFrame.new(0, 12, 0), Vector3.new(2, 1.5, 1.8), Enum.Material.Slate, Color3.fromRGB(80, 75, 90))
P("RuneL", CFrame.new(-3.5, 5.5, 0.8), Vector3.new(0.8, 6, 0.1), Enum.Material.Neon, Color3.fromRGB(120, 60, 220))
P("RuneR", CFrame.new(3.5, 5.5, 0.8), Vector3.new(0.8, 6, 0.1), Enum.Material.Neon, Color3.fromRGB(120, 60, 220))
local portalSurface = P("PortalSurface", CFrame.new(0, 5.5, 0), Vector3.new(5.5, 9, 0.2), Enum.Material.Neon, Color3.fromRGB(100, 50, 200))
local pl = Instance.new("PointLight"); pl.Range = 30; pl.Brightness = 2; pl.Color = Color3.fromRGB(120, 60, 220); pl.Parent = portalSurface
P("EnergyRing", CFrame.new(0, 5.5, 0), Vector3.new(6.5, 10, 0.3), Enum.Material.Neon, Color3.fromRGB(150, 80, 255))
P("GroundGlow", CFrame.new(0, 0.2, 0), Vector3.new(6, 0.1, 4), Enum.Material.Neon, Color3.fromRGB(100, 50, 180))`,
  },
]
