/**
 * Furniture & interior build templates for RAG knowledge base.
 * 35 templates covering desks, appliances, bathroom, living room, etc.
 * All Y positions are mathematically calculated from ground (Y=0).
 */

import { BuildTemplate } from './build-template-chunks'

export const FURNITURE_TEMPLATES: BuildTemplate[] = [

  // 1. DESK
  {
    title: 'Office Desk with Drawer',
    tags: ['desk', 'office', 'furniture', 'workspace', 'table'],
    description: 'A 6x3 stud desk at standard 3-stud height with 4 legs and a drawer underneath. 7 parts.',
    code: `-- DESK (7 parts) — 6x3 top, 3 studs tall
local folder = getFolder("Desk")
P("DeskTop", CFrame.new(0, 3, 0), Vector3.new(6, 0.4, 3), Enum.Material.Wood, Color3.fromRGB(140, 90, 45))
P("LegFL", CFrame.new(-2.6, 1.4, 1.1), Vector3.new(0.4, 2.8, 0.4), Enum.Material.Wood, Color3.fromRGB(120, 75, 35))
P("LegFR", CFrame.new(2.6, 1.4, 1.1), Vector3.new(0.4, 2.8, 0.4), Enum.Material.Wood, Color3.fromRGB(120, 75, 35))
P("LegBL", CFrame.new(-2.6, 1.4, -1.1), Vector3.new(0.4, 2.8, 0.4), Enum.Material.Wood, Color3.fromRGB(120, 75, 35))
P("LegBR", CFrame.new(2.6, 1.4, -1.1), Vector3.new(0.4, 2.8, 0.4), Enum.Material.Wood, Color3.fromRGB(120, 75, 35))
P("DrawerBody", CFrame.new(1.5, 2.2, 0), Vector3.new(2.5, 1, 2.5), Enum.Material.Wood, Color3.fromRGB(130, 82, 40))
P("DrawerHandle", CFrame.new(1.5, 2.2, 1.3), Vector3.new(0.8, 0.2, 0.2), Enum.Material.Metal, Color3.fromRGB(180, 175, 165))`,
  },

  // 2. BOOKSHELF
  {
    title: 'Bookshelf with Books',
    tags: ['bookshelf', 'shelf', 'books', 'furniture', 'library', 'storage'],
    description: 'A tall bookshelf (8 studs) with back panel, 2 side panels, 4 shelves, and 3 colored books. 10 parts.',
    code: `-- BOOKSHELF (10 parts) — 4 wide, 8 tall, 1.5 deep
local folder = getFolder("Bookshelf")
P("BackPanel", CFrame.new(0, 4, -0.65), Vector3.new(4, 8, 0.3), Enum.Material.Wood, Color3.fromRGB(110, 70, 35))
P("SideLeft", CFrame.new(-1.85, 4, 0), Vector3.new(0.3, 8, 1.3), Enum.Material.Wood, Color3.fromRGB(120, 75, 38))
P("SideRight", CFrame.new(1.85, 4, 0), Vector3.new(0.3, 8, 1.3), Enum.Material.Wood, Color3.fromRGB(120, 75, 38))
P("Shelf1", CFrame.new(0, 0.15, 0), Vector3.new(3.7, 0.3, 1.3), Enum.Material.Wood, Color3.fromRGB(120, 75, 38))
P("Shelf2", CFrame.new(0, 2.15, 0), Vector3.new(3.7, 0.3, 1.3), Enum.Material.Wood, Color3.fromRGB(120, 75, 38))
P("Shelf3", CFrame.new(0, 4.15, 0), Vector3.new(3.7, 0.3, 1.3), Enum.Material.Wood, Color3.fromRGB(120, 75, 38))
P("Shelf4", CFrame.new(0, 6.15, 0), Vector3.new(3.7, 0.3, 1.3), Enum.Material.Wood, Color3.fromRGB(120, 75, 38))
P("BookRed", CFrame.new(-0.8, 1.2, 0), Vector3.new(0.5, 1.8, 1), Enum.Material.Fabric, Color3.fromRGB(160, 35, 30))
P("BookBlue", CFrame.new(-0.1, 1.15, 0), Vector3.new(0.6, 1.7, 1), Enum.Material.Fabric, Color3.fromRGB(40, 60, 150))
P("BookGreen", CFrame.new(0.6, 1.25, 0), Vector3.new(0.4, 1.9, 1), Enum.Material.Fabric, Color3.fromRGB(35, 110, 50))`,
  },

  // 3. COUCH / SOFA
  {
    title: 'Three-Seat Couch',
    tags: ['couch', 'sofa', 'seating', 'furniture', 'living room'],
    description: 'A 3-seat sofa with cushion base, backrest, and 2 armrests. Seat height 2.5 studs. 5 parts.',
    code: `-- COUCH (5 parts) — 8 wide, seat at 2.5 studs
local folder = getFolder("Couch")
P("SeatBase", CFrame.new(0, 1.25, 0), Vector3.new(8, 2.5, 3.5), Enum.Material.Fabric, Color3.fromRGB(75, 95, 125))
P("Backrest", CFrame.new(0, 3, -1.5), Vector3.new(8, 2.5, 0.5), Enum.Material.Fabric, Color3.fromRGB(70, 88, 118))
P("ArmLeft", CFrame.new(-3.75, 2, 0), Vector3.new(0.5, 2.5, 3.5), Enum.Material.Fabric, Color3.fromRGB(65, 82, 112))
P("ArmRight", CFrame.new(3.75, 2, 0), Vector3.new(0.5, 2.5, 3.5), Enum.Material.Fabric, Color3.fromRGB(65, 82, 112))
P("Cushion1", CFrame.new(-2.5, 2.6, 0.2), Vector3.new(2.4, 0.4, 2.8), Enum.Material.Fabric, Color3.fromRGB(80, 100, 130))`,
  },

  // 4. DRESSER
  {
    title: 'Bedroom Dresser with Drawers',
    tags: ['dresser', 'bedroom', 'furniture', 'storage', 'drawers'],
    description: 'A 5x4 stud dresser with body, 3 drawer faces, and 3 knobs. 7 parts.',
    code: `-- DRESSER (7 parts) — 5 wide, 4 tall, 2 deep
local folder = getFolder("Dresser")
P("Body", CFrame.new(0, 2, 0), Vector3.new(5, 4, 2), Enum.Material.Wood, Color3.fromRGB(130, 85, 45))
P("Top", CFrame.new(0, 4.1, 0), Vector3.new(5.2, 0.2, 2.2), Enum.Material.Wood, Color3.fromRGB(140, 90, 48))
P("Drawer1Face", CFrame.new(0, 3.2, 1.05), Vector3.new(4.4, 1, 0.1), Enum.Material.Wood, Color3.fromRGB(145, 95, 50))
P("Drawer2Face", CFrame.new(0, 2, 1.05), Vector3.new(4.4, 1, 0.1), Enum.Material.Wood, Color3.fromRGB(145, 95, 50))
P("Drawer3Face", CFrame.new(0, 0.8, 1.05), Vector3.new(4.4, 1, 0.1), Enum.Material.Wood, Color3.fromRGB(145, 95, 50))
P("Knob1", CFrame.new(0, 3.2, 1.2), Vector3.new(0.3, 0.3, 0.3), Enum.Material.Metal, Color3.fromRGB(190, 180, 160))
P("Knob2", CFrame.new(0, 2, 1.2), Vector3.new(0.3, 0.3, 0.3), Enum.Material.Metal, Color3.fromRGB(190, 180, 160))`,
  },

  // 5. TV ON STAND
  {
    title: 'TV on Stand',
    tags: ['tv', 'television', 'stand', 'entertainment', 'furniture', 'living room'],
    description: 'A flat-screen TV on a wooden stand with a base shelf. Screen is 6x4 studs. 4 parts.',
    code: `-- TV ON STAND (4 parts) — screen 6x4, stand 2 studs tall
local folder = getFolder("TV")
P("StandBase", CFrame.new(0, 1, 0), Vector3.new(7, 2, 2.5), Enum.Material.Wood, Color3.fromRGB(50, 35, 25))
P("StandNeck", CFrame.new(0, 2.4, 0), Vector3.new(1.5, 0.8, 1), Enum.Material.Metal, Color3.fromRGB(60, 60, 65))
P("Screen", CFrame.new(0, 4.8, 0), Vector3.new(6, 4, 0.3), Enum.Material.Metal, Color3.fromRGB(30, 30, 35))
P("ScreenGlass", CFrame.new(0, 4.8, 0.2), Vector3.new(5.6, 3.6, 0.05), Enum.Material.Glass, Color3.fromRGB(20, 25, 40))`,
  },

  // 6. COMPUTER SETUP
  {
    title: 'Computer Setup with Monitor, Keyboard, and Mouse',
    tags: ['computer', 'monitor', 'keyboard', 'mouse', 'desk', 'office', 'workspace'],
    description: 'A desk with monitor, keyboard, and mouse. Desk at 3 studs, monitor on top. 8 parts.',
    code: `-- COMPUTER SETUP (8 parts) — desk + monitor + peripherals
local folder = getFolder("ComputerSetup")
P("Desk", CFrame.new(0, 3, 0), Vector3.new(6, 0.4, 3), Enum.Material.Wood, Color3.fromRGB(140, 90, 45))
P("DeskLegL", CFrame.new(-2.6, 1.4, 0), Vector3.new(0.4, 2.8, 3), Enum.Material.Wood, Color3.fromRGB(120, 75, 35))
P("DeskLegR", CFrame.new(2.6, 1.4, 0), Vector3.new(0.4, 2.8, 3), Enum.Material.Wood, Color3.fromRGB(120, 75, 35))
P("MonitorStand", CFrame.new(0, 3.5, -0.8), Vector3.new(1.2, 0.6, 0.8), Enum.Material.Metal, Color3.fromRGB(55, 55, 60))
P("MonitorScreen", CFrame.new(0, 5, -1), Vector3.new(4, 2.6, 0.2), Enum.Material.Metal, Color3.fromRGB(35, 35, 40))
P("MonitorDisplay", CFrame.new(0, 5, -0.85), Vector3.new(3.6, 2.2, 0.05), Enum.Material.Glass, Color3.fromRGB(30, 40, 60))
P("Keyboard", CFrame.new(0, 3.3, 0.5), Vector3.new(2.5, 0.2, 0.8), Enum.Material.Metal, Color3.fromRGB(50, 50, 55))
P("Mouse", CFrame.new(1.8, 3.3, 0.5), Vector3.new(0.5, 0.2, 0.7), Enum.Material.Metal, Color3.fromRGB(50, 50, 55))`,
  },

  // 7. REFRIGERATOR
  {
    title: 'Refrigerator',
    tags: ['refrigerator', 'fridge', 'kitchen', 'appliance', 'furniture'],
    description: 'A tall refrigerator (7 studs) with body, door, and handle. 4 parts.',
    code: `-- REFRIGERATOR (4 parts) — 3 wide, 7 tall, 2.5 deep
local folder = getFolder("Refrigerator")
P("Body", CFrame.new(0, 3.5, 0), Vector3.new(3, 7, 2.5), Enum.Material.Metal, Color3.fromRGB(220, 220, 225))
P("Door", CFrame.new(0, 3.5, 1.3), Vector3.new(2.8, 6.8, 0.1), Enum.Material.Metal, Color3.fromRGB(230, 230, 235))
P("Handle", CFrame.new(1.1, 4.5, 1.45), Vector3.new(0.2, 2.5, 0.2), Enum.Material.Metal, Color3.fromRGB(190, 190, 195))
P("TopCap", CFrame.new(0, 7.1, 0), Vector3.new(3.1, 0.2, 2.6), Enum.Material.Metal, Color3.fromRGB(210, 210, 215))`,
  },

  // 8. STOVE / OVEN
  {
    title: 'Stove and Oven',
    tags: ['stove', 'oven', 'kitchen', 'appliance', 'cooking', 'furniture'],
    description: 'A kitchen stove with body, 4 burners on top, oven door, and handle. 8 parts.',
    code: `-- STOVE/OVEN (8 parts) — 3 wide, 4 tall, 2.5 deep
local folder = getFolder("Stove")
P("Body", CFrame.new(0, 2, 0), Vector3.new(3, 4, 2.5), Enum.Material.Metal, Color3.fromRGB(215, 215, 220))
P("Stovetop", CFrame.new(0, 4.1, 0), Vector3.new(3, 0.2, 2.5), Enum.Material.Metal, Color3.fromRGB(45, 45, 50))
P("BurnerFL", CFrame.new(-0.6, 4.25, 0.5), Vector3.new(0.8, 0.1, 0.8), Enum.Material.Metal, Color3.fromRGB(35, 35, 38))
P("BurnerFR", CFrame.new(0.6, 4.25, 0.5), Vector3.new(0.8, 0.1, 0.8), Enum.Material.Metal, Color3.fromRGB(35, 35, 38))
P("BurnerBL", CFrame.new(-0.6, 4.25, -0.5), Vector3.new(0.6, 0.1, 0.6), Enum.Material.Metal, Color3.fromRGB(35, 35, 38))
P("BurnerBR", CFrame.new(0.6, 4.25, -0.5), Vector3.new(0.6, 0.1, 0.6), Enum.Material.Metal, Color3.fromRGB(35, 35, 38))
P("OvenDoor", CFrame.new(0, 1.5, 1.3), Vector3.new(2.6, 2.2, 0.1), Enum.Material.Metal, Color3.fromRGB(50, 50, 55))
P("OvenHandle", CFrame.new(0, 2.8, 1.45), Vector3.new(1.8, 0.15, 0.15), Enum.Material.Metal, Color3.fromRGB(190, 190, 195))`,
  },

  // 9. KITCHEN SINK
  {
    title: 'Kitchen Sink',
    tags: ['sink', 'kitchen', 'plumbing', 'counter', 'furniture'],
    description: 'A kitchen counter with recessed basin and faucet. Counter at 4 studs. 5 parts.',
    code: `-- KITCHEN SINK (5 parts) — counter 4 wide, 4 tall, basin recessed
local folder = getFolder("KitchenSink")
P("Counter", CFrame.new(0, 2, 0), Vector3.new(4, 4, 2.5), Enum.Material.Concrete, Color3.fromRGB(200, 195, 185))
P("CounterTop", CFrame.new(0, 4.1, 0), Vector3.new(4.1, 0.2, 2.6), Enum.Material.Concrete, Color3.fromRGB(210, 205, 195))
P("Basin", CFrame.new(0, 3.6, 0), Vector3.new(2, 1.2, 1.5), Enum.Material.Metal, Color3.fromRGB(195, 195, 200))
P("FaucetPipe", CFrame.new(0, 4.8, -0.8), Vector3.new(0.2, 1.2, 0.2), Enum.Material.Metal, Color3.fromRGB(190, 185, 180))
P("FaucetSpout", CFrame.new(0, 5.3, -0.3), Vector3.new(0.15, 0.15, 0.8), Enum.Material.Metal, Color3.fromRGB(190, 185, 180))`,
  },

  // 10. BATHTUB
  {
    title: 'Bathtub',
    tags: ['bathtub', 'tub', 'bath', 'bathroom', 'plumbing', 'furniture'],
    description: 'A bathtub with body, rim, and faucet. 2.5 studs tall, 6 long. 5 parts.',
    code: `-- BATHTUB (5 parts) — 6 long, 3 wide, 2.5 tall
local folder = getFolder("Bathtub")
P("TubBody", CFrame.new(0, 1.25, 0), Vector3.new(6, 2.5, 3), Enum.Material.Concrete, Color3.fromRGB(230, 230, 235))
P("TubInterior", CFrame.new(0, 1.5, 0), Vector3.new(5.4, 2, 2.4), Enum.Material.Concrete, Color3.fromRGB(240, 240, 245))
P("RimFront", CFrame.new(0, 2.6, 1.4), Vector3.new(6, 0.3, 0.3), Enum.Material.Concrete, Color3.fromRGB(235, 235, 240))
P("FaucetPipe", CFrame.new(0, 3, -1.2), Vector3.new(0.3, 1, 0.3), Enum.Material.Metal, Color3.fromRGB(190, 190, 195))
P("FaucetHead", CFrame.new(0, 3.4, -0.7), Vector3.new(0.2, 0.2, 0.8), Enum.Material.Metal, Color3.fromRGB(190, 190, 195))`,
  },

  // 11. TOILET
  {
    title: 'Toilet',
    tags: ['toilet', 'bathroom', 'plumbing', 'restroom', 'furniture'],
    description: 'A toilet with bowl, tank, seat, and lid. Bowl height 2 studs. 4 parts.',
    code: `-- TOILET (4 parts) — bowl 1.5x2, tank behind
local folder = getFolder("Toilet")
P("Bowl", CFrame.new(0, 1, 0.3), Vector3.new(1.5, 2, 2), Enum.Material.Concrete, Color3.fromRGB(235, 235, 240))
P("Seat", CFrame.new(0, 2.1, 0.3), Vector3.new(1.4, 0.15, 1.8), Enum.Material.Concrete, Color3.fromRGB(240, 240, 245))
P("Tank", CFrame.new(0, 1.75, -0.9), Vector3.new(1.4, 2.5, 0.8), Enum.Material.Concrete, Color3.fromRGB(230, 230, 235))
P("Lid", CFrame.new(0, 3.1, -0.9), Vector3.new(1.5, 0.15, 0.9), Enum.Material.Concrete, Color3.fromRGB(240, 240, 245))`,
  },

  // 12. BATHROOM SINK
  {
    title: 'Bathroom Sink with Mirror',
    tags: ['sink', 'bathroom', 'mirror', 'vanity', 'plumbing', 'furniture'],
    description: 'A pedestal bathroom sink with basin, faucet, and wall mirror above. 6 parts.',
    code: `-- BATHROOM SINK (6 parts) — pedestal style with mirror
local folder = getFolder("BathroomSink")
P("Pedestal", CFrame.new(0, 1.5, 0), Vector3.new(0.8, 3, 0.8), Enum.Material.Concrete, Color3.fromRGB(230, 230, 235))
P("Basin", CFrame.new(0, 3.1, 0.1), Vector3.new(2, 0.6, 1.5), Enum.Material.Concrete, Color3.fromRGB(235, 235, 240))
P("FaucetPipe", CFrame.new(0, 3.7, -0.5), Vector3.new(0.15, 0.8, 0.15), Enum.Material.Metal, Color3.fromRGB(190, 190, 195))
P("FaucetSpout", CFrame.new(0, 4, -0.1), Vector3.new(0.12, 0.12, 0.6), Enum.Material.Metal, Color3.fromRGB(190, 190, 195))
P("MirrorFrame", CFrame.new(0, 5.5, -0.85), Vector3.new(2.5, 3, 0.2), Enum.Material.Wood, Color3.fromRGB(110, 70, 35))
P("MirrorGlass", CFrame.new(0, 5.5, -0.7), Vector3.new(2.2, 2.7, 0.05), Enum.Material.Glass, Color3.fromRGB(200, 210, 220))`,
  },

  // 13. TABLE LAMP
  {
    title: 'Table Lamp',
    tags: ['lamp', 'light', 'table lamp', 'lighting', 'furniture', 'bedroom'],
    description: 'A table lamp with round base, narrow neck, and wide shade. Total height ~2.5 studs (sits on furniture). 4 parts.',
    code: `-- TABLE LAMP (4 parts) — sits on a table/nightstand, 2.5 studs tall from surface
local folder = getFolder("TableLamp")
P("LampBase", CFrame.new(0, 0.15, 0), Vector3.new(1.2, 0.3, 1.2), Enum.Material.Metal, Color3.fromRGB(170, 140, 90))
P("LampNeck", CFrame.new(0, 0.9, 0), Vector3.new(0.3, 1.2, 0.3), Enum.Material.Metal, Color3.fromRGB(170, 140, 90))
P("LampShade", CFrame.new(0, 1.9, 0), Vector3.new(1.8, 1.2, 1.8), Enum.Material.Fabric, Color3.fromRGB(230, 215, 180))
local light = Instance.new("PointLight")
light.Range = 14  light.Brightness = 0.6  light.Color = Color3.fromRGB(255, 235, 190)
light.Parent = P("LampBulb", CFrame.new(0, 1.6, 0), Vector3.new(0.4, 0.4, 0.4), Enum.Material.Neon, Color3.fromRGB(255, 240, 200))`,
  },

  // 14. CHANDELIER
  {
    title: 'Chandelier',
    tags: ['chandelier', 'lighting', 'ceiling', 'fancy', 'light', 'decoration'],
    description: 'A chandelier with central frame, 4 arms, bulbs, and ceiling chain. Hangs from Y=10 default. 10 parts.',
    code: `-- CHANDELIER (10 parts) — hangs from ceiling, arms extend outward
local folder = getFolder("Chandelier")
P("Chain", CFrame.new(0, 10, 0), Vector3.new(0.2, 2, 0.2), Enum.Material.Metal, Color3.fromRGB(170, 145, 70))
P("CenterHub", CFrame.new(0, 8.8, 0), Vector3.new(1.2, 0.8, 1.2), Enum.Material.Metal, Color3.fromRGB(180, 155, 75))
P("ArmN", CFrame.new(0, 8.6, 1.5), Vector3.new(0.2, 0.2, 3), Enum.Material.Metal, Color3.fromRGB(175, 150, 72))
P("ArmS", CFrame.new(0, 8.6, -1.5), Vector3.new(0.2, 0.2, 3), Enum.Material.Metal, Color3.fromRGB(175, 150, 72))
P("ArmE", CFrame.new(1.5, 8.6, 0), Vector3.new(3, 0.2, 0.2), Enum.Material.Metal, Color3.fromRGB(175, 150, 72))
P("ArmW", CFrame.new(-1.5, 8.6, 0), Vector3.new(3, 0.2, 0.2), Enum.Material.Metal, Color3.fromRGB(175, 150, 72))
P("BulbN", CFrame.new(0, 8.3, 2.8), Vector3.new(0.5, 0.5, 0.5), Enum.Material.Neon, Color3.fromRGB(255, 235, 180))
P("BulbS", CFrame.new(0, 8.3, -2.8), Vector3.new(0.5, 0.5, 0.5), Enum.Material.Neon, Color3.fromRGB(255, 235, 180))
P("BulbE", CFrame.new(2.8, 8.3, 0), Vector3.new(0.5, 0.5, 0.5), Enum.Material.Neon, Color3.fromRGB(255, 235, 180))
P("BulbW", CFrame.new(-2.8, 8.3, 0), Vector3.new(0.5, 0.5, 0.5), Enum.Material.Neon, Color3.fromRGB(255, 235, 180))`,
  },

  // 15. GRANDFATHER CLOCK
  {
    title: 'Grandfather Clock',
    tags: ['clock', 'grandfather clock', 'furniture', 'antique', 'time'],
    description: 'A tall grandfather clock with body, clock face, and pendulum. 9 studs tall. 6 parts.',
    code: `-- GRANDFATHER CLOCK (6 parts) — 2.5 wide, 9 tall
local folder = getFolder("GrandfatherClock")
P("Base", CFrame.new(0, 1, 0), Vector3.new(2.5, 2, 1.5), Enum.Material.Wood, Color3.fromRGB(80, 45, 20))
P("Body", CFrame.new(0, 4.5, 0), Vector3.new(2, 5, 1.2), Enum.Material.Wood, Color3.fromRGB(90, 50, 25))
P("Head", CFrame.new(0, 8, 0), Vector3.new(2.3, 2, 1.3), Enum.Material.Wood, Color3.fromRGB(85, 48, 22))
P("ClockFace", CFrame.new(0, 8, 0.7), Vector3.new(1.5, 1.5, 0.1), Enum.Material.Concrete, Color3.fromRGB(240, 235, 220))
P("Pendulum", CFrame.new(0, 3.5, 0.5), Vector3.new(0.3, 2.5, 0.1), Enum.Material.Metal, Color3.fromRGB(180, 155, 70))
P("PendulumDisc", CFrame.new(0, 2.4, 0.5), Vector3.new(0.8, 0.8, 0.1), Enum.Material.Metal, Color3.fromRGB(190, 165, 75))`,
  },

  // 16. PIANO
  {
    title: 'Upright Piano with Bench',
    tags: ['piano', 'music', 'instrument', 'furniture', 'upright piano'],
    description: 'An upright piano with body, keyboard, lid, and a bench. Piano 4 studs tall. 7 parts.',
    code: `-- PIANO (7 parts) — upright style, 5 wide, 4.5 tall
local folder = getFolder("Piano")
P("PianoBody", CFrame.new(0, 2.25, 0), Vector3.new(5, 4.5, 2), Enum.Material.Wood, Color3.fromRGB(25, 20, 18))
P("KeyboardWhite", CFrame.new(0, 2.8, 1.1), Vector3.new(4.5, 0.15, 0.8), Enum.Material.Concrete, Color3.fromRGB(240, 238, 230))
P("KeyboardBlack", CFrame.new(0, 2.9, 0.85), Vector3.new(4.5, 0.15, 0.4), Enum.Material.Metal, Color3.fromRGB(20, 18, 15))
P("LidTop", CFrame.new(0, 4.6, 0), Vector3.new(5.1, 0.2, 2.1), Enum.Material.Wood, Color3.fromRGB(22, 18, 16))
P("MusicStand", CFrame.new(0, 3.8, 0.8), Vector3.new(3.5, 1.2, 0.15), Enum.Material.Wood, Color3.fromRGB(30, 25, 20))
P("BenchSeat", CFrame.new(0, 1.25, 2.5), Vector3.new(3, 0.4, 1.2), Enum.Material.Fabric, Color3.fromRGB(25, 22, 18))
P("BenchLegs", CFrame.new(0, 0.5, 2.5), Vector3.new(2.8, 1, 1), Enum.Material.Wood, Color3.fromRGB(25, 20, 18))`,
  },

  // 17. POOL TABLE
  {
    title: 'Pool Table',
    tags: ['pool table', 'billiards', 'game', 'furniture', 'recreation'],
    description: 'A pool table with wooden frame, green felt surface, and 6 corner/side pockets. Table height 3.5 studs. 10 parts.',
    code: `-- POOL TABLE (10 parts) — 8x4 playing surface, 3.5 stud height
local folder = getFolder("PoolTable")
P("Frame", CFrame.new(0, 1.75, 0), Vector3.new(8.5, 3.5, 4.5), Enum.Material.Wood, Color3.fromRGB(70, 40, 20))
P("FeltSurface", CFrame.new(0, 3.55, 0), Vector3.new(8, 0.1, 4), Enum.Material.Fabric, Color3.fromRGB(30, 110, 50))
P("RailN", CFrame.new(0, 3.7, 2.1), Vector3.new(8.5, 0.4, 0.3), Enum.Material.Wood, Color3.fromRGB(75, 42, 22))
P("RailS", CFrame.new(0, 3.7, -2.1), Vector3.new(8.5, 0.4, 0.3), Enum.Material.Wood, Color3.fromRGB(75, 42, 22))
P("RailE", CFrame.new(4.1, 3.7, 0), Vector3.new(0.3, 0.4, 4.5), Enum.Material.Wood, Color3.fromRGB(75, 42, 22))
P("RailW", CFrame.new(-4.1, 3.7, 0), Vector3.new(0.3, 0.4, 4.5), Enum.Material.Wood, Color3.fromRGB(75, 42, 22))
P("PocketNE", CFrame.new(3.9, 3.55, 1.9), Vector3.new(0.5, 0.15, 0.5), Enum.Material.Metal, Color3.fromRGB(30, 30, 30))
P("PocketNW", CFrame.new(-3.9, 3.55, 1.9), Vector3.new(0.5, 0.15, 0.5), Enum.Material.Metal, Color3.fromRGB(30, 30, 30))
P("PocketSE", CFrame.new(3.9, 3.55, -1.9), Vector3.new(0.5, 0.15, 0.5), Enum.Material.Metal, Color3.fromRGB(30, 30, 30))
P("PocketSW", CFrame.new(-3.9, 3.55, -1.9), Vector3.new(0.5, 0.15, 0.5), Enum.Material.Metal, Color3.fromRGB(30, 30, 30))`,
  },

  // 18. VENDING MACHINE
  {
    title: 'Vending Machine',
    tags: ['vending machine', 'machine', 'snacks', 'drinks', 'commercial', 'furniture'],
    description: 'A vending machine with body, glass front, and coin slot. 3x7x2.5 studs. 5 parts.',
    code: `-- VENDING MACHINE (5 parts) — 3 wide, 7 tall, 2.5 deep
local folder = getFolder("VendingMachine")
P("Body", CFrame.new(0, 3.5, 0), Vector3.new(3, 7, 2.5), Enum.Material.Metal, Color3.fromRGB(180, 40, 40))
P("GlassFront", CFrame.new(0, 4.2, 1.28), Vector3.new(2.4, 4, 0.1), Enum.Material.Glass, Color3.fromRGB(200, 210, 220))
P("DispenseSlot", CFrame.new(0, 1.2, 1.28), Vector3.new(2.4, 1.2, 0.1), Enum.Material.Metal, Color3.fromRGB(40, 40, 45))
P("CoinSlot", CFrame.new(1.2, 4, 1.35), Vector3.new(0.3, 0.8, 0.15), Enum.Material.Metal, Color3.fromRGB(180, 180, 185))
P("BrandPanel", CFrame.new(0, 6.5, 1.28), Vector3.new(2.6, 0.8, 0.1), Enum.Material.Metal, Color3.fromRGB(220, 200, 50))`,
  },

  // 19. ATM
  {
    title: 'ATM Machine',
    tags: ['atm', 'bank', 'machine', 'money', 'commercial', 'furniture'],
    description: 'An ATM with body, screen, keypad, and card slot. 5.5 studs tall. 5 parts.',
    code: `-- ATM (5 parts) — 2 wide, 5.5 tall, 1.5 deep
local folder = getFolder("ATM")
P("Body", CFrame.new(0, 2.75, 0), Vector3.new(2, 5.5, 1.5), Enum.Material.Metal, Color3.fromRGB(55, 75, 110))
P("Screen", CFrame.new(0, 4, 0.8), Vector3.new(1.4, 1.2, 0.1), Enum.Material.Glass, Color3.fromRGB(40, 60, 90))
P("Keypad", CFrame.new(0, 2.8, 0.8), Vector3.new(1, 0.8, 0.1), Enum.Material.Metal, Color3.fromRGB(70, 70, 75))
P("CardSlot", CFrame.new(0.5, 3.5, 0.82), Vector3.new(0.6, 0.1, 0.1), Enum.Material.Metal, Color3.fromRGB(40, 40, 45))
P("CashSlot", CFrame.new(0, 1.8, 0.82), Vector3.new(1.2, 0.15, 0.1), Enum.Material.Metal, Color3.fromRGB(40, 40, 45))`,
  },

  // 20. TRASH CAN
  {
    title: 'Trash Can',
    tags: ['trash can', 'garbage', 'bin', 'waste', 'furniture'],
    description: 'A simple trash can with body and lid. 2.5 studs tall. 2 parts.',
    code: `-- TRASH CAN (2 parts) — 1.5 diameter, 2.5 tall
local folder = getFolder("TrashCan")
P("Body", CFrame.new(0, 1.25, 0), Vector3.new(1.5, 2.5, 1.5), Enum.Material.Metal, Color3.fromRGB(80, 85, 90))
P("Lid", CFrame.new(0, 2.6, 0), Vector3.new(1.6, 0.2, 1.6), Enum.Material.Metal, Color3.fromRGB(90, 95, 100))`,
  },

  // 21. DUMPSTER
  {
    title: 'Dumpster',
    tags: ['dumpster', 'garbage', 'trash', 'waste', 'commercial', 'outdoor'],
    description: 'A large dumpster with body, 2 lids, and side wheels. 4 studs tall. 7 parts.',
    code: `-- DUMPSTER (7 parts) — 6 wide, 4 tall, 3 deep
local folder = getFolder("Dumpster")
P("Body", CFrame.new(0, 2, 0), Vector3.new(6, 4, 3), Enum.Material.Metal, Color3.fromRGB(50, 90, 55))
P("LidLeft", CFrame.new(-1.5, 4.1, 0), Vector3.new(3, 0.2, 3), Enum.Material.Metal, Color3.fromRGB(45, 80, 50))
P("LidRight", CFrame.new(1.5, 4.1, 0), Vector3.new(3, 0.2, 3), Enum.Material.Metal, Color3.fromRGB(45, 80, 50))
P("WheelFL", CFrame.new(-2.5, 0.4, 1.3), Vector3.new(0.4, 0.8, 0.8), Enum.Material.Metal, Color3.fromRGB(30, 30, 35))
P("WheelFR", CFrame.new(2.5, 0.4, 1.3), Vector3.new(0.4, 0.8, 0.8), Enum.Material.Metal, Color3.fromRGB(30, 30, 35))
P("WheelBL", CFrame.new(-2.5, 0.4, -1.3), Vector3.new(0.4, 0.8, 0.8), Enum.Material.Metal, Color3.fromRGB(30, 30, 35))
P("WheelBR", CFrame.new(2.5, 0.4, -1.3), Vector3.new(0.4, 0.8, 0.8), Enum.Material.Metal, Color3.fromRGB(30, 30, 35))`,
  },

  // 22. SHOPPING CART
  {
    title: 'Shopping Cart',
    tags: ['shopping cart', 'cart', 'store', 'grocery', 'commercial'],
    description: 'A shopping cart with wire basket, handle bar, and 4 wheels. 3.5 studs tall. 7 parts.',
    code: `-- SHOPPING CART (7 parts) — 3 long, 1.5 wide, 3.5 tall
local folder = getFolder("ShoppingCart")
P("BasketBottom", CFrame.new(0, 1.5, 0), Vector3.new(2.5, 0.1, 1.5), Enum.Material.Metal, Color3.fromRGB(160, 160, 165))
P("BasketFront", CFrame.new(0, 2.25, 0.7), Vector3.new(2.5, 1.5, 0.1), Enum.Material.Metal, Color3.fromRGB(160, 160, 165))
P("BasketBack", CFrame.new(0, 2.25, -0.7), Vector3.new(2.5, 1.5, 0.1), Enum.Material.Metal, Color3.fromRGB(160, 160, 165))
P("BasketLeft", CFrame.new(-1.2, 2.25, 0), Vector3.new(0.1, 1.5, 1.4), Enum.Material.Metal, Color3.fromRGB(160, 160, 165))
P("BasketRight", CFrame.new(1.2, 2.25, 0), Vector3.new(0.1, 1.5, 1.4), Enum.Material.Metal, Color3.fromRGB(160, 160, 165))
P("HandleBar", CFrame.new(0, 3.3, -1), Vector3.new(2.5, 0.2, 0.2), Enum.Material.Metal, Color3.fromRGB(40, 40, 45))
P("WheelFL", CFrame.new(-1, 0.3, 0.6), Vector3.new(0.15, 0.6, 0.6), Enum.Material.Metal, Color3.fromRGB(50, 50, 55))`,
  },

  // 23. WARDROBE / CLOSET
  {
    title: 'Wardrobe Closet',
    tags: ['wardrobe', 'closet', 'bedroom', 'storage', 'furniture', 'clothes'],
    description: 'A wardrobe with body, 2 doors, and an interior shelf. 8 studs tall. 5 parts.',
    code: `-- WARDROBE (5 parts) — 5 wide, 8 tall, 2.5 deep
local folder = getFolder("Wardrobe")
P("Body", CFrame.new(0, 4, 0), Vector3.new(5, 8, 2.5), Enum.Material.Wood, Color3.fromRGB(120, 75, 38))
P("DoorLeft", CFrame.new(-1.25, 4, 1.28), Vector3.new(2.4, 7.6, 0.15), Enum.Material.Wood, Color3.fromRGB(130, 82, 42))
P("DoorRight", CFrame.new(1.25, 4, 1.28), Vector3.new(2.4, 7.6, 0.15), Enum.Material.Wood, Color3.fromRGB(130, 82, 42))
P("HandleL", CFrame.new(-0.15, 4, 1.42), Vector3.new(0.2, 0.8, 0.2), Enum.Material.Metal, Color3.fromRGB(180, 175, 165))
P("HandleR", CFrame.new(0.15, 4, 1.42), Vector3.new(0.2, 0.8, 0.2), Enum.Material.Metal, Color3.fromRGB(180, 175, 165))`,
  },

  // 24. DINING TABLE (large, 6-seat)
  {
    title: 'Large Dining Table',
    tags: ['dining table', 'table', 'dining room', 'furniture', 'large table'],
    description: 'A large 10x5 dining table at standard 3.5 stud height with 4 sturdy legs. 5 parts. Pair with chair templates for a complete set.',
    code: `-- DINING TABLE (5 parts) — 10x5 top, 3.5 studs tall
local folder = getFolder("DiningTable")
P("TableTop", CFrame.new(0, 3.5, 0), Vector3.new(10, 0.5, 5), Enum.Material.Wood, Color3.fromRGB(140, 85, 40))
P("LegFL", CFrame.new(-4.3, 1.625, 1.8), Vector3.new(0.6, 3.25, 0.6), Enum.Material.Wood, Color3.fromRGB(125, 75, 35))
P("LegFR", CFrame.new(4.3, 1.625, 1.8), Vector3.new(0.6, 3.25, 0.6), Enum.Material.Wood, Color3.fromRGB(125, 75, 35))
P("LegBL", CFrame.new(-4.3, 1.625, -1.8), Vector3.new(0.6, 3.25, 0.6), Enum.Material.Wood, Color3.fromRGB(125, 75, 35))
P("LegBR", CFrame.new(4.3, 1.625, -1.8), Vector3.new(0.6, 3.25, 0.6), Enum.Material.Wood, Color3.fromRGB(125, 75, 35))`,
  },

  // 25. COFFEE TABLE
  {
    title: 'Coffee Table',
    tags: ['coffee table', 'table', 'living room', 'furniture', 'low table'],
    description: 'A low coffee table at 1.5 stud height. 4x2.5 top with 4 short legs. 5 parts.',
    code: `-- COFFEE TABLE (5 parts) — 4x2.5 top, 1.5 studs tall
local folder = getFolder("CoffeeTable")
P("Top", CFrame.new(0, 1.5, 0), Vector3.new(4, 0.3, 2.5), Enum.Material.Wood, Color3.fromRGB(130, 80, 40))
P("LegFL", CFrame.new(-1.6, 0.675, 0.9), Vector3.new(0.4, 1.35, 0.4), Enum.Material.Wood, Color3.fromRGB(115, 70, 32))
P("LegFR", CFrame.new(1.6, 0.675, 0.9), Vector3.new(0.4, 1.35, 0.4), Enum.Material.Wood, Color3.fromRGB(115, 70, 32))
P("LegBL", CFrame.new(-1.6, 0.675, -0.9), Vector3.new(0.4, 1.35, 0.4), Enum.Material.Wood, Color3.fromRGB(115, 70, 32))
P("LegBR", CFrame.new(1.6, 0.675, -0.9), Vector3.new(0.4, 1.35, 0.4), Enum.Material.Wood, Color3.fromRGB(115, 70, 32))`,
  },

  // 26. NIGHTSTAND
  {
    title: 'Nightstand with Lamp',
    tags: ['nightstand', 'bedroom', 'table', 'furniture', 'bedside', 'lamp'],
    description: 'A small nightstand (2.5 studs tall) with a drawer and a lamp sitting on top. 8 parts.',
    code: `-- NIGHTSTAND WITH LAMP (8 parts) — 2x2.5x1.5, lamp on top
local folder = getFolder("Nightstand")
P("Body", CFrame.new(0, 1.25, 0), Vector3.new(2, 2.5, 1.5), Enum.Material.Wood, Color3.fromRGB(120, 75, 38))
P("Top", CFrame.new(0, 2.6, 0), Vector3.new(2.1, 0.2, 1.6), Enum.Material.Wood, Color3.fromRGB(130, 82, 42))
P("DrawerFace", CFrame.new(0, 1.5, 0.78), Vector3.new(1.6, 1, 0.1), Enum.Material.Wood, Color3.fromRGB(135, 85, 44))
P("Knob", CFrame.new(0, 1.5, 0.9), Vector3.new(0.25, 0.25, 0.2), Enum.Material.Metal, Color3.fromRGB(185, 180, 170))
-- Lamp sits on top: base at Y = 2.7 + 0.15 = 2.85
P("LampBase", CFrame.new(0, 2.85, 0), Vector3.new(0.8, 0.2, 0.8), Enum.Material.Metal, Color3.fromRGB(165, 135, 85))
P("LampNeck", CFrame.new(0, 3.35, 0), Vector3.new(0.2, 0.8, 0.2), Enum.Material.Metal, Color3.fromRGB(165, 135, 85))
P("LampShade", CFrame.new(0, 4, 0), Vector3.new(1.2, 0.8, 1.2), Enum.Material.Fabric, Color3.fromRGB(225, 210, 175))
local light = Instance.new("PointLight")
light.Range = 12  light.Brightness = 0.5  light.Color = Color3.fromRGB(255, 235, 190)
light.Parent = P("LampBulb", CFrame.new(0, 3.8, 0), Vector3.new(0.3, 0.3, 0.3), Enum.Material.Neon, Color3.fromRGB(255, 240, 200))`,
  },

  // 27. KITCHEN COUNTER L-SHAPE
  {
    title: 'Kitchen Counter L-Shape with Sink',
    tags: ['kitchen', 'counter', 'L-shape', 'cabinets', 'sink', 'furniture'],
    description: 'An L-shaped kitchen counter with cabinets, countertop, and integrated sink. Counter at 4 studs. 10 parts.',
    code: `-- L-SHAPE KITCHEN COUNTER (10 parts) — two perpendicular runs, 4 studs tall
local folder = getFolder("KitchenCounterL")
-- Long run along Z axis: 8 long, 2.5 deep
P("CounterLongBase", CFrame.new(0, 2, 0), Vector3.new(8, 4, 2.5), Enum.Material.Wood, Color3.fromRGB(110, 68, 32))
P("CounterLongTop", CFrame.new(0, 4.1, 0), Vector3.new(8.1, 0.2, 2.6), Enum.Material.Concrete, Color3.fromRGB(210, 205, 195))
P("CabinetDoor1", CFrame.new(-2, 1.5, 1.28), Vector3.new(1.8, 2.5, 0.1), Enum.Material.Wood, Color3.fromRGB(120, 75, 38))
P("CabinetDoor2", CFrame.new(0, 1.5, 1.28), Vector3.new(1.8, 2.5, 0.1), Enum.Material.Wood, Color3.fromRGB(120, 75, 38))
P("CabinetDoor3", CFrame.new(2, 1.5, 1.28), Vector3.new(1.8, 2.5, 0.1), Enum.Material.Wood, Color3.fromRGB(120, 75, 38))
-- Short run along X axis (corner piece)
P("CounterShortBase", CFrame.new(5.25, 2, -2.5), Vector3.new(2.5, 4, 5), Enum.Material.Wood, Color3.fromRGB(110, 68, 32))
P("CounterShortTop", CFrame.new(5.25, 4.1, -2.5), Vector3.new(2.6, 0.2, 5.1), Enum.Material.Concrete, Color3.fromRGB(210, 205, 195))
-- Sink in long counter
P("SinkBasin", CFrame.new(-2, 3.6, 0), Vector3.new(1.5, 1, 1.2), Enum.Material.Metal, Color3.fromRGB(195, 195, 200))
P("FaucetPipe", CFrame.new(-2, 4.7, -0.6), Vector3.new(0.15, 1, 0.15), Enum.Material.Metal, Color3.fromRGB(190, 185, 180))
P("FaucetSpout", CFrame.new(-2, 5.1, -0.2), Vector3.new(0.12, 0.12, 0.7), Enum.Material.Metal, Color3.fromRGB(190, 185, 180))`,
  },

  // 28. WASHING MACHINE
  {
    title: 'Washing Machine',
    tags: ['washing machine', 'laundry', 'appliance', 'furniture'],
    description: 'A front-loading washing machine with body, circular door, and control panel. 3.5 studs tall. 4 parts.',
    code: `-- WASHING MACHINE (4 parts) — 2.5 wide, 3.5 tall, 2.5 deep
local folder = getFolder("WashingMachine")
P("Body", CFrame.new(0, 1.75, 0), Vector3.new(2.5, 3.5, 2.5), Enum.Material.Metal, Color3.fromRGB(225, 225, 230))
P("DoorRing", CFrame.new(0, 1.5, 1.28), Vector3.new(1.6, 1.6, 0.1), Enum.Material.Metal, Color3.fromRGB(180, 180, 185))
P("DoorGlass", CFrame.new(0, 1.5, 1.32), Vector3.new(1.3, 1.3, 0.05), Enum.Material.Glass, Color3.fromRGB(180, 200, 215))
P("ControlPanel", CFrame.new(0, 3.2, 1.28), Vector3.new(2, 0.6, 0.1), Enum.Material.Metal, Color3.fromRGB(200, 200, 205))`,
  },

  // 29. FIREPLACE
  {
    title: 'Fireplace',
    tags: ['fireplace', 'hearth', 'fire', 'mantel', 'living room', 'furniture'],
    description: 'A brick fireplace with hearth opening, mantel shelf, chimney surround, and glowing fire inside. 8 parts.',
    code: `-- FIREPLACE (8 parts) — 6 wide, 7 tall against a wall
local folder = getFolder("Fireplace")
P("BaseLeft", CFrame.new(-2.25, 3.5, 0), Vector3.new(1.5, 7, 2), Enum.Material.Brick, Color3.fromRGB(140, 65, 45))
P("BaseRight", CFrame.new(2.25, 3.5, 0), Vector3.new(1.5, 7, 2), Enum.Material.Brick, Color3.fromRGB(140, 65, 45))
P("Arch", CFrame.new(0, 5.5, 0), Vector3.new(3, 2, 2), Enum.Material.Brick, Color3.fromRGB(140, 65, 45))
P("Mantel", CFrame.new(0, 6.6, 0.2), Vector3.new(6.5, 0.4, 2.4), Enum.Material.Wood, Color3.fromRGB(100, 60, 28))
P("HearthFloor", CFrame.new(0, 0.15, 0.5), Vector3.new(3.5, 0.3, 1.5), Enum.Material.Cobblestone, Color3.fromRGB(90, 85, 80))
P("BackWall", CFrame.new(0, 2.5, -0.8), Vector3.new(3, 5, 0.3), Enum.Material.Brick, Color3.fromRGB(50, 30, 25))
P("FireGlow", CFrame.new(0, 1, 0), Vector3.new(1.5, 1.2, 0.8), Enum.Material.Neon, Color3.fromRGB(255, 120, 30))
local fire = Instance.new("Fire")
fire.Size = 4  fire.Heat = 8
fire.Parent = P("FireSource", CFrame.new(0, 0.7, 0), Vector3.new(1, 0.5, 0.5), Enum.Material.Concrete, Color3.fromRGB(40, 25, 15))`,
  },

  // 30. CEILING FAN
  {
    title: 'Ceiling Fan',
    tags: ['ceiling fan', 'fan', 'lighting', 'ceiling', 'furniture'],
    description: 'A ceiling fan with motor housing, 4 blades, and a light underneath. Mounts at Y=10 default. 7 parts.',
    code: `-- CEILING FAN (7 parts) — hangs from ceiling at Y=10
local folder = getFolder("CeilingFan")
P("Mount", CFrame.new(0, 10, 0), Vector3.new(0.5, 0.5, 0.5), Enum.Material.Metal, Color3.fromRGB(200, 195, 185))
P("MotorHousing", CFrame.new(0, 9.5, 0), Vector3.new(1.2, 0.8, 1.2), Enum.Material.Metal, Color3.fromRGB(210, 205, 195))
P("BladeN", CFrame.new(0, 9.35, 2.5), Vector3.new(1, 0.1, 4), Enum.Material.Wood, Color3.fromRGB(120, 75, 38))
P("BladeS", CFrame.new(0, 9.35, -2.5), Vector3.new(1, 0.1, 4), Enum.Material.Wood, Color3.fromRGB(120, 75, 38))
P("BladeE", CFrame.new(2.5, 9.35, 0), Vector3.new(4, 0.1, 1), Enum.Material.Wood, Color3.fromRGB(120, 75, 38))
P("BladeW", CFrame.new(-2.5, 9.35, 0), Vector3.new(4, 0.1, 1), Enum.Material.Wood, Color3.fromRGB(120, 75, 38))
local light = Instance.new("PointLight")
light.Range = 18  light.Brightness = 0.7  light.Color = Color3.fromRGB(255, 240, 210)
light.Parent = P("LightGlobe", CFrame.new(0, 8.9, 0), Vector3.new(0.8, 0.6, 0.8), Enum.Material.Glass, Color3.fromRGB(240, 235, 220))`,
  },

  // 31. WALL CLOCK
  {
    title: 'Wall Clock',
    tags: ['clock', 'wall clock', 'time', 'decoration', 'furniture'],
    description: 'A circular wall clock with frame and face. Mounts on wall at Y=6. 3 parts.',
    code: `-- WALL CLOCK (3 parts) — 2 stud diameter, mounts on wall
local folder = getFolder("WallClock")
P("ClockFrame", CFrame.new(0, 6, -0.15), Vector3.new(2.2, 2.2, 0.3), Enum.Material.Wood, Color3.fromRGB(90, 55, 28))
P("ClockFace", CFrame.new(0, 6, 0.05), Vector3.new(1.9, 1.9, 0.1), Enum.Material.Concrete, Color3.fromRGB(240, 235, 225))
P("CenterDot", CFrame.new(0, 6, 0.12), Vector3.new(0.2, 0.2, 0.05), Enum.Material.Metal, Color3.fromRGB(30, 30, 35))`,
  },

  // 32. COAT RACK
  {
    title: 'Coat Rack',
    tags: ['coat rack', 'rack', 'hooks', 'furniture', 'entryway'],
    description: 'A standing coat rack with weighted base, tall pole, and 4 hooks. 7 studs tall. 6 parts.',
    code: `-- COAT RACK (6 parts) — 7 studs tall, freestanding
local folder = getFolder("CoatRack")
P("Base", CFrame.new(0, 0.2, 0), Vector3.new(2, 0.4, 2), Enum.Material.Wood, Color3.fromRGB(80, 48, 22))
P("Pole", CFrame.new(0, 3.5, 0), Vector3.new(0.4, 6.6, 0.4), Enum.Material.Wood, Color3.fromRGB(90, 55, 28))
P("HookN", CFrame.new(0, 6.5, 0.5), Vector3.new(0.15, 0.15, 0.8), Enum.Material.Metal, Color3.fromRGB(170, 165, 155))
P("HookS", CFrame.new(0, 6.5, -0.5), Vector3.new(0.15, 0.15, 0.8), Enum.Material.Metal, Color3.fromRGB(170, 165, 155))
P("HookE", CFrame.new(0.5, 6.5, 0), Vector3.new(0.8, 0.15, 0.15), Enum.Material.Metal, Color3.fromRGB(170, 165, 155))
P("HookW", CFrame.new(-0.5, 6.5, 0), Vector3.new(0.8, 0.15, 0.15), Enum.Material.Metal, Color3.fromRGB(170, 165, 155))`,
  },

  // 33. POTTED PLANT
  {
    title: 'Potted Plant',
    tags: ['plant', 'pot', 'potted plant', 'decoration', 'nature', 'indoor'],
    description: 'A potted plant with terracotta pot, soil layer, and leafy bush on top. 4 parts.',
    code: `-- POTTED PLANT (4 parts) — pot on ground, leaves on top
local folder = getFolder("PottedPlant")
P("Pot", CFrame.new(0, 0.75, 0), Vector3.new(1.5, 1.5, 1.5), Enum.Material.Brick, Color3.fromRGB(180, 100, 55))
P("Soil", CFrame.new(0, 1.55, 0), Vector3.new(1.2, 0.15, 1.2), Enum.Material.Slate, Color3.fromRGB(65, 45, 30))
P("LeavesMain", CFrame.new(0, 2.7, 0), Vector3.new(2, 2, 2), Enum.Material.Grass, Color3.fromRGB(55, 120, 45))
P("LeavesTop", CFrame.new(0.3, 3.5, 0.2), Vector3.new(1.2, 1, 1.2), Enum.Material.Grass, Color3.fromRGB(65, 135, 50))`,
  },

  // 34. FISH TANK
  {
    title: 'Fish Tank',
    tags: ['fish tank', 'aquarium', 'fish', 'water', 'decoration', 'furniture'],
    description: 'A glass fish tank with water inside, gravel at the bottom, and a light on top. 6 parts.',
    code: `-- FISH TANK (6 parts) — 4 wide, 2.5 tall, 1.5 deep, sits on a surface
local folder = getFolder("FishTank")
P("GlassFront", CFrame.new(0, 1.25, 0.72), Vector3.new(4, 2.5, 0.1), Enum.Material.Glass, Color3.fromRGB(190, 210, 225))
P("GlassBack", CFrame.new(0, 1.25, -0.72), Vector3.new(4, 2.5, 0.1), Enum.Material.Glass, Color3.fromRGB(190, 210, 225))
P("GlassLeft", CFrame.new(-1.95, 1.25, 0), Vector3.new(0.1, 2.5, 1.44), Enum.Material.Glass, Color3.fromRGB(190, 210, 225))
P("GlassRight", CFrame.new(1.95, 1.25, 0), Vector3.new(0.1, 2.5, 1.44), Enum.Material.Glass, Color3.fromRGB(190, 210, 225))
P("Gravel", CFrame.new(0, 0.2, 0), Vector3.new(3.8, 0.4, 1.34), Enum.Material.Cobblestone, Color3.fromRGB(120, 110, 90))
P("Water", CFrame.new(0, 1.3, 0), Vector3.new(3.8, 1.8, 1.34), Enum.Material.Glass, Color3.fromRGB(60, 130, 180))`,
  },

  // 35. WORKBENCH
  {
    title: 'Workbench with Vice and Pegboard',
    tags: ['workbench', 'workshop', 'bench', 'tools', 'garage', 'furniture'],
    description: 'A sturdy workbench at 3.5 studs height with thick legs, a mounted vice, and a pegboard behind. 8 parts.',
    code: `-- WORKBENCH (8 parts) — 8 wide, 3.5 tall, sturdy build
local folder = getFolder("Workbench")
P("BenchTop", CFrame.new(0, 3.5, 0), Vector3.new(8, 0.5, 3), Enum.Material.WoodPlanks, Color3.fromRGB(140, 100, 55))
P("LegFL", CFrame.new(-3.5, 1.625, 1.1), Vector3.new(0.6, 3.25, 0.6), Enum.Material.Wood, Color3.fromRGB(120, 80, 40))
P("LegFR", CFrame.new(3.5, 1.625, 1.1), Vector3.new(0.6, 3.25, 0.6), Enum.Material.Wood, Color3.fromRGB(120, 80, 40))
P("LegBL", CFrame.new(-3.5, 1.625, -1.1), Vector3.new(0.6, 3.25, 0.6), Enum.Material.Wood, Color3.fromRGB(120, 80, 40))
P("LegBR", CFrame.new(3.5, 1.625, -1.1), Vector3.new(0.6, 3.25, 0.6), Enum.Material.Wood, Color3.fromRGB(120, 80, 40))
P("LowerShelf", CFrame.new(0, 1, 0), Vector3.new(7, 0.3, 2.5), Enum.Material.WoodPlanks, Color3.fromRGB(130, 90, 48))
P("ViceBody", CFrame.new(-3, 4.1, 0.8), Vector3.new(0.8, 0.8, 1), Enum.Material.Metal, Color3.fromRGB(80, 80, 85))
P("Pegboard", CFrame.new(0, 5.75, -1.6), Vector3.new(7, 4, 0.2), Enum.Material.Wood, Color3.fromRGB(160, 140, 100))`,
  },

]
