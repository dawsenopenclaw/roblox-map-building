// weapon-tool-bible.ts — Roblox weapon and tool construction knowledge
// ALL properties verified against create.roblox.com/docs
// NEVER SmoothPlastic. Dimensions in studs. Colors as RGB.

export const WEAPON_MELEE: string = `
=== MELEE WEAPON CONSTRUCTION ===

--- SWORD (BASIC LONGSWORD) — 8 parts ---
Blade: Part, Size(0.2, 4.5, 0.8), Material=Metal, Color RGB(180,180,195)
  - Position: centered, extending upward from guard
BladeEdge: Part, Size(0.05, 4.2, 0.15), Material=Metal, Color RGB(220,220,230)
  - Welded to blade front edge for sharpness detail
Guard (Crossguard): Part, Size(0.3, 0.3, 2), Material=Metal, Color RGB(140,120,60)
  - Perpendicular to blade at base
Grip: Part, Size(0.25, 1.5, 0.35), Material=Fabric, Color RGB(60,40,20)
  - Below guard, cylindrical handle
Pommel: Part, Size(0.4, 0.3, 0.4), Material=Metal, Color RGB(140,120,60)
  - Sphere/cylinder at bottom of grip
FullerGroove: Part, Size(0.05, 3.5, 0.2), Material=Metal, Color RGB(150,150,165)
  - Recessed channel down center of blade
RicassoWrap: Part, Size(0.22, 0.5, 0.32), Material=Fabric, Color RGB(80,50,25)
  - Leather wrap just above guard
BladeTip: WedgePart, Size(0.2, 0.8, 0.8), Material=Metal, Color RGB(200,200,210)
  - Tapered point at blade top
Tool.GripPos = Vector3.new(0, -0.5, 0)
Tool.GripForward = Vector3.new(0, 0, -1)
Tool.GripUp = Vector3.new(0, 1, 0)

--- BROADSWORD — 10 parts ---
Blade: Part, Size(0.25, 5, 1.2), Material=Metal, Color RGB(170,170,185)
FullerLeft: Part, Size(0.05, 4, 0.15), Material=Metal, Color RGB(145,145,160)
FullerRight: Part, Size(0.05, 4, 0.15), Material=Metal, Color RGB(145,145,160)
Guard: Part, Size(0.35, 0.4, 2.8), Material=Metal, Color RGB(160,140,50)
GuardDetail: Part, Size(0.15, 0.15, 2.5), Material=Metal, Color RGB(180,160,60)
Grip: Part, Size(0.3, 2, 0.4), Material=Fabric, Color RGB(50,30,15)
GripWrap1: Part, Size(0.32, 0.15, 0.42), Material=Fabric, Color RGB(70,45,20)
GripWrap2: Part, Size(0.32, 0.15, 0.42), Material=Fabric, Color RGB(70,45,20)
Pommel: Part, Size(0.5, 0.4, 0.5), Material=Metal, Color RGB(160,140,50)
BladeTip: WedgePart, Size(0.25, 1, 1.2), Material=Metal, Color RGB(190,190,200)

--- KATANA — 9 parts ---
Blade: Part, Size(0.15, 5, 0.6), Material=Metal, Color RGB(200,200,210)
  - Slight curve: Orientation(0, 0, -5) for authentic bend
HamonLine: Part, Size(0.02, 4.5, 0.25), Material=Metal, Color RGB(230,230,240)
  - Visible temper line along cutting edge
Tsuba (Guard): Part, Size(0.3, 0.15, 1.5), Material=Metal, Color RGB(40,35,30)
  - Circular/oval disc guard
Habaki (Blade Collar): Part, Size(0.18, 0.3, 0.65), Material=Metal, Color RGB(180,160,50)
Tsuka (Handle): Part, Size(0.2, 1.8, 0.4), Material=Fabric, Color RGB(20,15,10)
TsukaIto (Wrap): 2x Part, Size(0.22, 0.12, 0.42), Material=Fabric, Color RGB(120,20,20)
  - Diamond pattern wrapping
Kashira (End Cap): Part, Size(0.25, 0.2, 0.45), Material=Metal, Color RGB(40,35,30)
Menuki (Ornament): Part, Size(0.1, 0.3, 0.15), Material=Metal, Color RGB(180,160,50)
KisssakiTip: WedgePart, Size(0.15, 0.6, 0.6), Material=Metal, Color RGB(210,210,220)

--- DAGGER — 6 parts ---
Blade: Part, Size(0.12, 2, 0.5), Material=Metal, Color RGB(190,190,200)
BladeEdge: Part, Size(0.03, 1.8, 0.1), Material=Metal, Color RGB(220,220,230)
Guard: Part, Size(0.2, 0.2, 1.2), Material=Metal, Color RGB(140,120,50)
Grip: Part, Size(0.18, 1, 0.28), Material=Fabric, Color RGB(60,35,15)
Pommel: Part, Size(0.25, 0.2, 0.25), Material=Metal, Color RGB(140,120,50)
Tip: WedgePart, Size(0.12, 0.5, 0.5), Material=Metal, Color RGB(210,210,220)

--- BATTLE AXE — 9 parts ---
Handle: Part, Size(0.3, 5, 0.3), Material=Wood, Color RGB(100,65,30)
HandleWrap: Part, Size(0.32, 1.5, 0.32), Material=Fabric, Color RGB(60,40,20)
AxeHead: Part, Size(0.2, 1.8, 2), Material=Metal, Color RGB(160,160,170)
AxeEdge: WedgePart, Size(0.15, 1.6, 0.8), Material=Metal, Color RGB(200,200,210)
BackSpike: WedgePart, Size(0.15, 0.6, 0.4), Material=Metal, Color RGB(160,160,170)
HeadMount: Part, Size(0.35, 0.4, 0.5), Material=Metal, Color RGB(120,110,100)
Rivets: 2x Part, Size(0.1, 0.1, 0.1), Material=Metal, Color RGB(140,130,120)
PommelCap: Part, Size(0.35, 0.15, 0.35), Material=Metal, Color RGB(120,110,100)

--- WAR HAMMER — 8 parts ---
Handle: Part, Size(0.3, 5.5, 0.3), Material=Wood, Color RGB(90,60,25)
HandleWrap: Part, Size(0.32, 2, 0.32), Material=Fabric, Color RGB(50,30,15)
HammerHead: Part, Size(1.2, 1, 1.2), Material=Metal, Color RGB(140,140,150)
StrikeFace: Part, Size(1.25, 0.15, 1.25), Material=Metal, Color RGB(170,170,180)
BackPoint: WedgePart, Size(0.4, 0.8, 0.8), Material=Metal, Color RGB(140,140,150)
HeadBand: Part, Size(1.3, 0.15, 1.3), Material=Metal, Color RGB(100,90,80)
TopSpike: WedgePart, Size(0.2, 0.6, 0.2), Material=Metal, Color RGB(170,170,180)
PommelCap: Part, Size(0.35, 0.15, 0.35), Material=Metal, Color RGB(100,90,80)

--- SPEAR — 7 parts ---
Shaft: Part, Size(0.25, 7, 0.25), Material=Wood, Color RGB(110,75,35)
SpearHead: WedgePart, Size(0.15, 1.5, 0.6), Material=Metal, Color RGB(180,180,195)
SpearSocket: Part, Size(0.28, 0.5, 0.28), Material=Metal, Color RGB(120,110,100)
GripWrap: Part, Size(0.27, 2, 0.27), Material=Fabric, Color RGB(60,40,20)
ShaftBand1: Part, Size(0.28, 0.1, 0.28), Material=Metal, Color RGB(120,110,100)
ShaftBand2: Part, Size(0.28, 0.1, 0.28), Material=Metal, Color RGB(120,110,100)
ButCap: Part, Size(0.28, 0.3, 0.28), Material=Metal, Color RGB(120,110,100)

--- STAFF / BO — 6 parts ---
Shaft: Part, Size(0.3, 7, 0.3), Material=Wood, Color RGB(130,90,45)
TopKnob: Part, Size(0.4, 0.4, 0.4), Material=Wood, Color RGB(110,70,30)
BottomCap: Part, Size(0.35, 0.15, 0.35), Material=Metal, Color RGB(100,90,80)
CenterWrap: Part, Size(0.32, 1.5, 0.32), Material=Fabric, Color RGB(80,50,25)
Accent1: Part, Size(0.32, 0.1, 0.32), Material=Metal, Color RGB(160,140,50)
Accent2: Part, Size(0.32, 0.1, 0.32), Material=Metal, Color RGB(160,140,50)

--- SCYTHE — 9 parts ---
Handle: Part, Size(0.25, 6, 0.25), Material=Wood, Color RGB(60,40,20)
HandleWrap: Part, Size(0.27, 2, 0.27), Material=Fabric, Color RGB(30,15,10)
Blade: Part, Size(0.1, 2, 3), Material=Metal, Color RGB(160,160,175)
  - Curved appearance via angled placement
BladeEdge: Part, Size(0.03, 1.8, 0.15), Material=Metal, Color RGB(210,210,225)
BladeTip: WedgePart, Size(0.1, 0.5, 0.8), Material=Metal, Color RGB(180,180,195)
NeckJoint: Part, Size(0.3, 0.4, 0.5), Material=Metal, Color RGB(100,90,80)
BackSpine: Part, Size(0.12, 2, 0.3), Material=Metal, Color RGB(130,130,140)
PommelSpike: WedgePart, Size(0.2, 0.5, 0.2), Material=Metal, Color RGB(100,90,80)
Rivets: Part, Size(0.08, 0.08, 0.08), Material=Metal, Color RGB(140,130,120)

--- MACE — 7 parts ---
Handle: Part, Size(0.25, 3.5, 0.25), Material=Wood, Color RGB(90,60,25)
HandleWrap: Part, Size(0.27, 1.5, 0.27), Material=Fabric, Color RGB(50,30,15)
MaceHead: Part (Ball shape), Size(1.5, 1.5, 1.5), Material=Metal, Color RGB(140,140,150)
Flanges: 4x WedgePart, Size(0.15, 0.8, 0.5), Material=Metal, Color RGB(160,160,170)
  - Evenly spaced around mace head at 90-degree intervals
NeckBand: Part, Size(0.3, 0.2, 0.3), Material=Metal, Color RGB(120,110,100)
PommelCap: Part, Size(0.3, 0.15, 0.3), Material=Metal, Color RGB(120,110,100)

COMMON MELEE MISTAKES:
- Blade too thick (>0.3 studs looks like a plank, not a blade)
- No guard between blade and handle (looks unfinished)
- Using SmoothPlastic instead of Metal for blades
- Single-part weapons (minimum 6 parts for any weapon)
- No grip wrapping detail (plain cylinder handles look lazy)
- Forgetting the pommel (balances the weapon visually)
- Same color for blade and guard (needs contrast)
`

export const WEAPON_RANGED: string = `
=== RANGED WEAPON CONSTRUCTION ===

--- BOW (LONGBOW) — 8 parts ---
UpperLimb: Part, Size(0.15, 2.5, 0.4), Material=Wood, Color RGB(120,80,35)
  - Orientation(0, 0, -8) for curve
LowerLimb: Part, Size(0.15, 2.5, 0.4), Material=Wood, Color RGB(120,80,35)
  - Orientation(0, 0, 8) for curve
Riser (Grip): Part, Size(0.2, 1, 0.5), Material=Wood, Color RGB(90,55,20)
GripWrap: Part, Size(0.22, 0.8, 0.52), Material=Fabric, Color RGB(60,40,20)
String: Part, Size(0.03, 5.5, 0.03), Material=Fabric, Color RGB(200,190,170)
ArrowRest: Part, Size(0.1, 0.15, 0.2), Material=Wood, Color RGB(90,55,20)
LimbTipUpper: Part, Size(0.1, 0.15, 0.15), Material=Wood, Color RGB(100,65,25)
LimbTipLower: Part, Size(0.1, 0.15, 0.15), Material=Wood, Color RGB(100,65,25)

--- CROSSBOW �� 10 parts ---
Stock: Part, Size(0.3, 0.5, 3), Material=Wood, Color RGB(100,65,30)
Barrel: Part, Size(0.2, 0.15, 2.5), Material=Wood, Color RGB(90,55,20)
Prod (Bow): Part, Size(0.1, 0.2, 3), Material=Wood, Color RGB(110,75,35)
  - Perpendicular to stock at front
String: Part, Size(0.03, 0.03, 2.8), Material=Fabric, Color RGB(200,190,170)
TriggerMechanism: Part, Size(0.2, 0.6, 0.4), Material=Metal, Color RGB(120,110,100)
Trigger: Part, Size(0.05, 0.3, 0.15), Material=Metal, Color RGB(140,130,120)
StockButt: Part, Size(0.35, 0.6, 0.8), Material=Wood, Color RGB(90,55,20)
Stirrup: Part, Size(0.1, 0.6, 0.6), Material=Metal, Color RGB(100,95,90)
BoltChannel: Part, Size(0.1, 0.05, 2), Material=Metal, Color RGB(130,120,110)
SightPost: Part, Size(0.05, 0.3, 0.05), Material=Metal, Color RGB(100,95,90)

--- PISTOL — 10 parts ---
Frame: Part, Size(0.25, 0.8, 1.2), Material=Metal, Color RGB(50,50,55)
Slide: Part, Size(0.22, 0.3, 1.3), Material=Metal, Color RGB(40,40,45)
Barrel: Part, Size(0.15, 0.15, 0.6), Material=Metal, Color RGB(45,45,50)
  - Extends from front of slide
Grip: Part, Size(0.28, 0.9, 0.4), Material=Fabric, Color RGB(35,30,25)
GripTexture: Part, Size(0.01, 0.7, 0.3), Material=Fabric, Color RGB(45,40,35)
Trigger: Part, Size(0.05, 0.25, 0.15), Material=Metal, Color RGB(60,55,50)
TriggerGuard: Part, Size(0.08, 0.4, 0.5), Material=Metal, Color RGB(50,50,55)
Magazine: Part, Size(0.2, 0.7, 0.3), Material=Metal, Color RGB(40,40,45)
SightFront: Part, Size(0.08, 0.1, 0.05), Material=Metal, Color RGB(60,55,50)
SightRear: Part, Size(0.15, 0.1, 0.05), Material=Metal, Color RGB(60,55,50)

--- RIFLE — 12 parts ---
Receiver: Part, Size(0.25, 0.35, 2), Material=Metal, Color RGB(50,50,55)
Barrel: Part, Size(0.12, 0.12, 3), Material=Metal, Color RGB(45,45,50)
Stock: Part, Size(0.25, 0.6, 1.5), Material=Wood, Color RGB(90,55,20)
StockPad: Part, Size(0.27, 0.55, 0.1), Material=Fabric, Color RGB(30,25,20)
Handguard: Part, Size(0.2, 0.25, 1.5), Material=Wood, Color RGB(100,65,30)
Magazine: Part, Size(0.18, 0.8, 0.4), Material=Metal, Color RGB(40,40,45)
Trigger: Part, Size(0.05, 0.2, 0.12), Material=Metal, Color RGB(60,55,50)
TriggerGuard: Part, Size(0.08, 0.35, 0.4), Material=Metal, Color RGB(50,50,55)
BoltHandle: Part, Size(0.15, 0.15, 0.3), Material=Metal, Color RGB(55,55,60)
Scope: Part, Size(0.15, 0.15, 0.8), Material=Metal, Color RGB(35,35,40)
ScopeLensFront: Part, Size(0.16, 0.16, 0.02), Material=Glass, Color RGB(100,150,200)
ScopeLensRear: Part, Size(0.12, 0.12, 0.02), Material=Glass, Color RGB(100,150,200)

--- SHOTGUN — 10 parts ---
Receiver: Part, Size(0.3, 0.35, 1.5), Material=Metal, Color RGB(55,50,45)
Barrel: Part, Size(0.18, 0.18, 2.5), Material=Metal, Color RGB(50,45,40)
Stock: Part, Size(0.28, 0.6, 1.2), Material=Wood, Color RGB(110,75,35)
Forend: Part, Size(0.22, 0.22, 0.8), Material=Wood, Color RGB(100,65,30)
Trigger: Part, Size(0.05, 0.2, 0.12), Material=Metal, Color RGB(60,55,50)
TriggerGuard: Part, Size(0.08, 0.35, 0.4), Material=Metal, Color RGB(55,50,45)
Magazine tube: Part, Size(0.12, 0.12, 2), Material=Metal, Color RGB(50,45,40)
MuzzleBrake: Part, Size(0.22, 0.22, 0.15), Material=Metal, Color RGB(45,40,35)
SightBead: Part, Size(0.06, 0.08, 0.06), Material=Metal, Color RGB(180,30,30)
StockPad: Part, Size(0.3, 0.55, 0.1), Material=Fabric, Color RGB(25,20,15)

--- ROCKET LAUNCHER — 9 parts ---
Tube: Part, Size(0.6, 0.6, 4), Material=Metal, Color RGB(70,80,60)
FrontSight: Part, Size(0.1, 0.3, 0.05), Material=Metal, Color RGB(60,65,55)
RearSight: Part, Size(0.15, 0.2, 0.05), Material=Metal, Color RGB(60,65,55)
GripFront: Part, Size(0.2, 0.6, 0.3), Material=Fabric, Color RGB(40,45,35)
GripRear: Part, Size(0.2, 0.8, 0.3), Material=Fabric, Color RGB(40,45,35)
Trigger: Part, Size(0.05, 0.2, 0.12), Material=Metal, Color RGB(50,55,45)
TriggerGuard: Part, Size(0.08, 0.3, 0.3), Material=Metal, Color RGB(60,65,55)
ShoulderPad: Part, Size(0.35, 0.4, 0.1), Material=Fabric, Color RGB(35,40,30)
ExhaustBell: Part, Size(0.65, 0.65, 0.15), Material=Metal, Color RGB(50,55,45)

RANGED WEAPON COMMON MISTAKES:
- Barrel too thick (real barrels are thin — 0.12-0.18 studs for rifles)
- No trigger guard (every gun needs one)
- Flat slab instead of shaped stock (needs contour)
- Forgetting sights (front + rear for guns, none looks toy-like)
- Magazine same color as frame (should be slightly different shade)
`

export const WEAPON_MAGIC: string = `
=== MAGIC WEAPON CONSTRUCTION ===

--- FIRE STAFF — 10 parts ---
Shaft: Part, Size(0.25, 6, 0.25), Material=Wood, Color RGB(80,40,15)
ShaftDetail1: Part, Size(0.27, 0.1, 0.27), Material=Metal, Color RGB(180,80,20)
ShaftDetail2: Part, Size(0.27, 0.1, 0.27), Material=Metal, Color RGB(180,80,20)
GripWrap: Part, Size(0.27, 1.5, 0.27), Material=Fabric, Color RGB(120,30,10)
HeadFrame: Part, Size(0.6, 0.8, 0.6), Material=Metal, Color RGB(160,70,15)
  - Ornate cage at top
Crystal: Part, Size(0.3, 0.5, 0.3), Material=Neon, Color RGB(255,120,20)
  - Glowing ember crystal inside head frame
InnerGlow: Part, Size(0.35, 0.55, 0.35), Material=ForceField, Color RGB(255,80,0)
  - Slightly larger, transparent glow layer
FireParticle: ParticleEmitter on Crystal
  - Rate=15, Lifetime=NumberRange.new(0.3, 0.8), Speed=NumberRange.new(1, 3)
  - SpreadAngle=Vector2.new(20, 20), Color=ColorSequence Red-Orange-Yellow
PointLight on Crystal: Range=12, Brightness=1.5, Color=Color3.fromRGB(255,120,40)
PommelCap: Part, Size(0.3, 0.2, 0.3), Material=Metal, Color RGB(160,70,15)

--- ICE WAND — 8 parts ---
Handle: Part, Size(0.2, 2, 0.2), Material=Wood, Color RGB(160,180,200)
HandleWrap: Part, Size(0.22, 1, 0.22), Material=Fabric, Color RGB(100,140,180)
IceCrystal: Part, Size(0.4, 1.2, 0.4), Material=Glass, Color RGB(150,210,255)
  - Transparent, faceted appearance at top
IceShard1: WedgePart, Size(0.1, 0.5, 0.2), Material=Glass, Color RGB(180,225,255)
IceShard2: WedgePart, Size(0.08, 0.4, 0.15), Material=Glass, Color RGB(170,220,255)
FrostAura: Part, Size(0.5, 1.3, 0.5), Material=ForceField, Color RGB(200,235,255)
  - Transparency=0.7
PointLight: Range=10, Brightness=0.8, Color=Color3.fromRGB(150,200,255)
SnowParticle: ParticleEmitter
  - Rate=8, Lifetime=NumberRange.new(1, 2), Speed=NumberRange.new(0.5, 1.5)
  - SpreadAngle=Vector2.new(30, 30), Color=White

--- LIGHTNING ROD — 9 parts ---
Shaft: Part, Size(0.2, 5, 0.2), Material=Metal, Color RGB(100,100,120)
Coil1: Part, Size(0.35, 0.15, 0.35), Material=Metal, Color RGB(180,160,40)
Coil2: Part, Size(0.35, 0.15, 0.35), Material=Metal, Color RGB(180,160,40)
Coil3: Part, Size(0.35, 0.15, 0.35), Material=Metal, Color RGB(180,160,40)
TopOrb: Part (Ball), Size(0.6, 0.6, 0.6), Material=Neon, Color RGB(120,180,255)
OrbGlow: Part (Ball), Size(0.7, 0.7, 0.7), Material=ForceField, Color RGB(80,140,255)
GripInsulator: Part, Size(0.25, 1.5, 0.25), Material=Fabric, Color RGB(40,35,50)
SparkParticle: ParticleEmitter on TopOrb
  - Rate=20, Lifetime=NumberRange.new(0.1, 0.3), Speed=NumberRange.new(2, 5)
  - SpreadAngle=Vector2.new(180, 180), Color=Electric blue RGB(100,180,255)
PointLight on TopOrb: Range=15, Brightness=2, Color=Color3.fromRGB(100,160,255)

--- HEALING SCEPTER — 9 parts ---
Shaft: Part, Size(0.2, 4.5, 0.2), Material=Wood, Color RGB(200,180,140)
ShaftVine: Part, Size(0.08, 3, 0.08), Material=Grass, Color RGB(60,140,40)
  - Spiral wrapped around shaft
Crown: Part, Size(0.6, 0.4, 0.6), Material=Metal, Color RGB(180,160,50)
  - Ornate top frame
GemCenter: Part, Size(0.25, 0.35, 0.25), Material=Neon, Color RGB(80,255,120)
GemGlow: Part (Ball), Size(0.4, 0.4, 0.4), Material=ForceField, Color RGB(100,255,150)
  - Transparency=0.6
LeafDetail1: Part, Size(0.3, 0.15, 0.1), Material=Grass, Color RGB(50,130,35)
LeafDetail2: Part, Size(0.3, 0.15, 0.1), Material=Grass, Color RGB(50,130,35)
HealParticle: ParticleEmitter
  - Rate=10, Lifetime=NumberRange.new(1, 2), Speed=NumberRange.new(0.5, 2)
  - SpreadAngle=Vector2.new(40, 40), Color=Green to White
PointLight: Range=12, Brightness=1, Color=Color3.fromRGB(80,255,120)

--- DARK TOME (SPELL BOOK) — 8 parts ---
Cover: Part, Size(0.8, 1.2, 0.2), Material=Fabric, Color RGB(30,15,40)
Spine: Part, Size(0.15, 1.2, 0.2), Material=Fabric, Color RGB(25,10,35)
BackCover: Part, Size(0.8, 1.2, 0.05), Material=Fabric, Color RGB(30,15,40)
Pages: Part, Size(0.75, 1.15, 0.12), Material=Fabric, Color RGB(220,210,190)
Clasp: Part, Size(0.15, 0.1, 0.25), Material=Metal, Color RGB(120,100,50)
RuneGlow: Part, Size(0.4, 0.4, 0.02), Material=Neon, Color RGB(160,40,200)
  - Glowing symbol on front cover
EyeCenter: Part (Ball), Size(0.15, 0.15, 0.08), Material=Neon, Color RGB(200,50,255)
ShadowParticle: ParticleEmitter
  - Rate=5, Lifetime=NumberRange.new(1, 3), Speed=NumberRange.new(0.3, 1)
  - Color=Dark purple to black, Transparency fades in

MAGIC WEAPON PRINCIPLES:
- Every magic weapon needs a GLOW SOURCE (Neon material part + PointLight)
- ForceField material at 0.5-0.7 Transparency creates ethereal aura
- ParticleEmitter on the magic element adds life (5-20 Rate, not too spammy)
- Color-code by element: Fire=Red/Orange, Ice=Blue/Cyan, Lightning=Electric Blue, Nature=Green, Dark=Purple, Holy=Gold/White
- Shaft/handle grounds the weapon — always Wood or Metal, never Neon
- PointLight Range 10-15, Brightness 0.8-2.0 for ambient glow
`

export const TOOL_GATHERING: string = `
=== GATHERING TOOL CONSTRUCTION ===

--- PICKAXE — 8 parts ---
Handle: Part, Size(0.25, 4, 0.25), Material=Wood, Color RGB(110,75,35)
HandleWrap: Part, Size(0.27, 1.2, 0.27), Material=Fabric, Color RGB(70,45,20)
PickHead: Part, Size(0.2, 0.5, 2.5), Material=Metal, Color RGB(150,150,160)
PickPoint: WedgePart, Size(0.18, 0.4, 0.8), Material=Metal, Color RGB(170,170,180)
FlatEnd: Part, Size(0.2, 0.5, 0.8), Material=Metal, Color RGB(150,150,160)
HeadMount: Part, Size(0.3, 0.6, 0.4), Material=Metal, Color RGB(120,115,110)
  - Where head meets handle
PommelCap: Part, Size(0.3, 0.15, 0.3), Material=Metal, Color RGB(120,115,110)
HandleBand: Part, Size(0.28, 0.1, 0.28), Material=Metal, Color RGB(120,115,110)

--- FISHING ROD — 7 parts ---
Rod: Part, Size(0.12, 5, 0.12), Material=Wood, Color RGB(130,90,45)
  - Slight taper by using thinner top
RodTip: Part, Size(0.06, 1, 0.06), Material=Wood, Color RGB(120,80,35)
Handle: Part, Size(0.2, 1.5, 0.2), Material=Fabric, Color RGB(40,35,30)
Reel: Part, Size(0.3, 0.3, 0.15), Material=Metal, Color RGB(100,100,110)
ReelHandle: Part, Size(0.05, 0.2, 0.05), Material=Metal, Color RGB(120,120,130)
Line: Part, Size(0.02, 4, 0.02), Material=Fabric, Color RGB(220,220,220)
  - Transparency=0.3 for thin fishing line look
Guides: 3x Part, Size(0.08, 0.08, 0.08), Material=Metal, Color RGB(100,100,110)
  - Small rings along rod

--- SHOVEL — 7 parts ---
Handle: Part, Size(0.25, 4, 0.25), Material=Wood, Color RGB(110,75,35)
DGrip: Part, Size(0.15, 0.4, 0.6), Material=Wood, Color RGB(100,65,30)
  - D-shaped top grip
Shaft: Part, Size(0.15, 0.5, 0.15), Material=Metal, Color RGB(120,115,110)
  - Connects handle to blade
Blade: Part, Size(0.08, 1.2, 1), Material=Metal, Color RGB(140,140,150)
BladeEdge: Part, Size(0.04, 0.1, 0.9), Material=Metal, Color RGB(170,170,180)
BladeBack: Part, Size(0.1, 0.3, 1), Material=Metal, Color RGB(130,130,140)
RivetPair: 2x Part, Size(0.06, 0.06, 0.06), Material=Metal, Color RGB(100,95,90)

--- AXE (WOODCUTTING) — 7 parts ---
Handle: Part, Size(0.25, 3.5, 0.25), Material=Wood, Color RGB(100,65,30)
HandleGrip: Part, Size(0.27, 1.2, 0.27), Material=Fabric, Color RGB(60,40,20)
AxeHead: Part, Size(0.2, 1.2, 1.5), Material=Metal, Color RGB(160,160,170)
AxeEdge: WedgePart, Size(0.15, 1, 0.5), Material=Metal, Color RGB(190,190,200)
HeadMount: Part, Size(0.3, 0.4, 0.4), Material=Metal, Color RGB(120,115,110)
Wedge: Part, Size(0.08, 0.3, 0.15), Material=Metal, Color RGB(100,95,90)
PommelCap: Part, Size(0.3, 0.15, 0.3), Material=Metal, Color RGB(120,115,110)
`

export const TOOL_BUILDING: string = `
=== BUILDING/CRAFTING TOOL CONSTRUCTION ===

--- HAMMER (CRAFTING) — 6 parts ---
Handle: Part, Size(0.2, 2.5, 0.2), Material=Wood, Color RGB(110,75,35)
Head: Part, Size(0.5, 0.5, 1), Material=Metal, Color RGB(140,140,150)
StrikeFace: Part, Size(0.52, 0.15, 0.52), Material=Metal, Color RGB(170,170,180)
ClawEnd: WedgePart, Size(0.3, 0.45, 0.5), Material=Metal, Color RGB(140,140,150)
HeadMount: Part, Size(0.25, 0.3, 0.3), Material=Metal, Color RGB(120,115,110)
GripWrap: Part, Size(0.22, 1, 0.22), Material=Fabric, Color RGB(60,40,20)

--- WRENCH — 5 parts ---
Handle: Part, Size(0.15, 3, 0.5), Material=Metal, Color RGB(160,160,170)
Jaw1: Part, Size(0.15, 0.4, 0.8), Material=Metal, Color RGB(160,160,170)
Jaw2: Part, Size(0.15, 0.4, 0.6), Material=Metal, Color RGB(160,160,170)
JawGap: Part, Size(0.15, 0.3, 0.2), Material=Metal, Color RGB(140,140,150)
GripTexture: Part, Size(0.17, 1.5, 0.52), Material=Fabric, Color RGB(200,50,50)

--- TORCH — 6 parts ---
Handle: Part, Size(0.25, 3, 0.25), Material=Wood, Color RGB(90,55,20)
HandleWrap: Part, Size(0.27, 0.8, 0.27), Material=Fabric, Color RGB(120,80,30)
TorchHead: Part, Size(0.35, 0.5, 0.35), Material=Fabric, Color RGB(60,40,15)
  - Wrapped cloth soaked in fuel
FireGlow: Part (Ball), Size(0.5, 0.5, 0.5), Material=Neon, Color RGB(255,150,30)
  - Transparency=0.3
PointLight: Range=20, Brightness=1.5, Color=Color3.fromRGB(255,180,80)
FireParticle: ParticleEmitter on TorchHead
  - Rate=25, Lifetime=NumberRange.new(0.3, 0.8), Speed=NumberRange.new(2, 4)
  - SpreadAngle=Vector2.new(15, 15)
`

export const WEAPON_SYSTEMS: string = `
=== COMBAT SYSTEM KNOWLEDGE ===

--- TOOL INSTANCE SETUP ---
Tool must be in StarterPack or player Backpack
Tool.RequiresHandle = true (Handle part must exist inside Tool)
Tool.CanBeDropped = true/false
Tool.Enabled = true
Tool.Grip = CFrame.new(0, -0.5, 0) * CFrame.Angles(0, 0, 0)
  - GripPos: offset from hand attachment point
  - GripForward/GripRight/GripUp: orientation vectors
Tool.ToolTip = "Weapon Name"

Activated event fires on Tool when player clicks
Equipped event fires when player selects tool
Deactivated fires on button release
Unequipped fires when player switches away

--- HITBOX DETECTION PATTERNS ---

Pattern 1: RAYCAST HITBOX (best for melee)
- On swing, cast 3-5 rays from weapon blade in arc
- workspace:Raycast(origin, direction, RaycastParams)
- RaycastParams.FilterDescendantsInstances = {character}
- RaycastParams.FilterType = Enum.RaycastFilterType.Exclude
- Check result.Instance, find parent Humanoid
- Server validates: was attacker actually swinging? Is target in range?

Pattern 2: REGION/OVERLAP HITBOX (area damage)
- Create invisible hitbox Part at swing location
- Use workspace:GetPartsInPart(hitbox, overlapParams)
- OverlapParams.FilterDescendantsInstances = {character}
- Collect unique humanoids from results
- Destroy hitbox after check

Pattern 3: MAGNITUDE CHECK (simple proximity)
- (target.Position - weapon.Position).Magnitude < range
- Cheapest but least accurate
- Good for AoE abilities, not precision swings

--- DAMAGE FORMULA PATTERNS ---
BaseDamage = weapon.BaseDamage
CritChance = 0.15 (15%)
CritMultiplier = 2.0
ArmorReduction = target.Defense / (target.Defense + 100)
FinalDamage = BaseDamage * (1 - ArmorReduction)
If math.random() < CritChance then FinalDamage = FinalDamage * CritMultiplier

Level scaling: BaseDamage = weaponBase + (level * scalingFactor)
Element bonus: if weapon.Element matches target.Weakness then 1.5x

--- COMBO SYSTEM ---
ComboWindow = 0.8 seconds between hits
MaxCombo = 4 hits
Each hit in combo: 1x, 1.2x, 1.5x, 2x damage multiplier
If player clicks within ComboWindow, advance combo counter
If ComboWindow expires, reset to hit 1
On max combo (hit 4), add special effect (knockback, AoE, stun)

--- BLOCK/PARRY SYSTEM ---
Block: hold button, reduce incoming damage by 60-80%
  - BlockStamina drains while blocking
  - When stamina = 0, guard breaks (stunned 1.5s)
Parry: block within 0.2s of incoming hit = perfect parry
  - Deflects 100% damage
  - Staggers attacker for 1s
  - ParryWindow is TIGHT (0.15-0.25s) for skill expression

--- KNOCKBACK ---
KnockbackForce = damage * 2
Direction = (target.Position - attacker.Position).Unit
Apply via: target.HumanoidRootPart.AssemblyLinearVelocity = Direction * KnockbackForce + Vector3.new(0, KnockbackForce * 0.3, 0)
Duration: brief (0.2-0.5s), then restore normal movement

--- I-FRAMES (Invincibility Frames) ---
After taking damage, grant 0.3-0.5s invincibility
Set character attribute: character:SetAttribute("Invincible", true)
task.delay(0.5, function() character:SetAttribute("Invincible", false) end)
Check before applying damage: if target:GetAttribute("Invincible") then return end

--- PROJECTILE SYSTEMS ---

Hitscan (instant): raycast from muzzle to crosshair point
  - Instant damage, no travel time
  - Best for: rifles, lasers, sniper

Ballistic (physics): create projectile Part
  - Set AssemblyLinearVelocity = aimDirection * bulletSpeed
  - Touched event or Heartbeat raycast for collision
  - Gravity affects trajectory (arcing arrows, grenades)
  - Best for: bows, rockets, grenades

Projectile Part setup:
  Size(0.2, 0.2, 0.8), Material=Neon
  CanCollide=false, Anchored=false, Massless=true
  Add BodyForce to counteract gravity for straight flight if needed
  Destroy after 5-10 seconds (max lifetime) via Debris:AddItem

--- MAGAZINE/AMMO SYSTEM ---
MaxAmmo = 30 (magazine)
ReserveAmmo = 120
ReloadTime = 2.0 seconds
FireRate = 0.1 seconds between shots (600 RPM)

On fire: if currentAmmo > 0, subtract 1, fire projectile
On reload: if reserveAmmo > 0, fill magazine, subtract from reserve
Reload animation: disable firing for ReloadTime seconds
Empty click: play click sound, prompt reload

--- SERVER VALIDATION (CRITICAL) ---
NEVER trust client for:
- Damage values (server calculates)
- Hit detection (server verifies range + line of sight)
- Ammo count (server tracks authoritative count)
- Cooldowns (server tracks last action time)
- Fire rate (server rejects if too fast)

Client sends: "I want to attack" + target ID
Server checks: is weapon equipped? Is target in range? Has cooldown elapsed? Is target alive?
Server applies: damage, effects, broadcasts to other clients
`

export const WEAPON_TOOL_BIBLE: string = WEAPON_MELEE + '\n\n' + WEAPON_RANGED + '\n\n' + WEAPON_MAGIC + '\n\n' + TOOL_GATHERING + '\n\n' + TOOL_BUILDING + '\n\n' + WEAPON_SYSTEMS
