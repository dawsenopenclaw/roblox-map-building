// Vehicle & Transport Bible — ForjeGames AI Knowledge
// Every dimension in studs. Every color as RGB. No SmoothPlastic.

export const VEHICLE_CARS: string = `
=== VEHICLE CARS BIBLE ===

--- SEDAN (28 parts) ---
Body: Part Size(8,2.5,4) Material=Metal Color=RGB(45,80,140) [main chassis]
Hood: Part Size(3,0.4,4) Material=Metal Color=RGB(45,80,140) Pos front +3.5X +1.4Y
Trunk: Part Size(2.5,0.8,4) Material=Metal Color=RGB(45,80,140) Pos rear -3.5X +1.2Y
Roof: Part Size(4,0.3,3.6) Material=Metal Color=RGB(45,80,140) Pos top +2.1Y
FrontBumper: Part Size(0.4,1.2,4.2) Material=Concrete Color=RGB(30,30,30)
RearBumper: Part Size(0.4,1.2,4.2) Material=Concrete Color=RGB(30,30,30)
WindshieldFront: Part Size(3.5,2,0.1) Material=Glass Color=RGB(180,210,255) Transparency=0.5 angled 25deg
WindshieldRear: Part Size(2.8,1.6,0.1) Material=Glass Color=RGB(180,210,255) Transparency=0.5 angled 20deg
WindowL/R x2: Part Size(2,1.2,0.1) Material=Glass Color=RGB(180,210,255) Transparency=0.4 each side
HeadlightL/R x2: Part Size(0.8,0.5,0.3) Material=Neon Color=RGB(255,250,220) each front corner
TaillightL/R x2: Part Size(0.8,0.5,0.3) Material=Neon Color=RGB(255,30,30) each rear corner
DoorFL/FR/RL/RR x4: Part Size(1.8,1.8,0.2) Material=Metal Color=RGB(45,80,140) each side
WheelFL/FR/RL/RR x4: Cylinder Size(0.5,1.5,1.5) Material=Rubber Color=RGB(20,20,20)
HubFL/FR/RL/RR x4: Cylinder Size(0.3,1.2,1.2) Material=Metal Color=RGB(160,160,160)
Exhaust: Cylinder Size(0.25,1.2,0.25) Material=Metal Color=RGB(100,90,80) rear underside
VehicleSeat: Size(1.5,0.5,2) Material=Fabric Color=RGB(40,40,60) center cabin
Engine: Part Size(2.5,1,3) Material=Metal Color=RGB(60,60,60) under hood (non-collidable)
Connections: WheelAxle via CylindricalConstraint LimitsEnabled=false; Doors via HingeConstraint MaxAngle=70

--- SPORTS CAR (32 parts) ---
Body: Part Size(9,1.8,4.2) Material=Metal Color=RGB(180,20,20) [low slung]
NoseCone: WedgePart Size(2,1.2,4) Material=Metal Color=RGB(180,20,20) front angled down
RearSpoiler: Part Size(4.5,0.8,0.3) Material=Metal Color=RGB(20,20,20) rear top +2Y
SpoilerStandL/R x2: Part Size(0.2,1.2,0.2) Material=Metal Color=RGB(20,20,20)
SideSkirtL/R x2: Part Size(6,0.5,0.2) Material=Metal Color=RGB(20,20,20) low sides
Roof: Part Size(3.5,0.2,3.8) Material=Metal Color=RGB(180,20,20)
Windshield: WedgePart Size(3.5,1.8,0.1) Material=Glass Color=RGB(120,180,255) Transparency=0.45
RearWindow: WedgePart Size(2.5,1.4,0.1) Material=Glass Color=RGB(120,180,255) Transparency=0.45
HeadlightL/R x2: Part Size(1.2,0.4,0.4) Material=Neon Color=RGB(255,255,200) thin strip style
TaillightL/R x2: Part Size(1.8,0.3,0.3) Material=Neon Color=RGB(220,0,0) strip style
AirIntakeL/R x2: Part Size(0.5,0.4,0.8) Material=Metal Color=RGB(20,20,20) front sides
WheelFL/FR/RL/RR x4: Cylinder Size(0.4,1.8,1.8) Material=Rubber Color=RGB(15,15,15) wide
HubFL/FR/RL/RR x4: Cylinder Size(0.3,1.5,1.5) Material=Metal Color=RGB(180,180,200)
ExhaustL/R x2: Cylinder Size(0.3,0.6,0.3) Material=Metal Color=RGB(120,100,80) dual
DoorL/R x2: Part Size(2.5,1.4,0.2) Material=Metal Color=RGB(180,20,20)
VehicleSeat: Size(1.4,0.4,1.8) Material=Leather Color=RGB(20,20,20)
Connections: CylindricalConstraint wheels; VehicleSeat MaxSpeed=150 Torque=35 TurnSpeed=1.6

--- PICKUP TRUCK (34 parts) ---
Cab: Part Size(5,3,4.5) Material=Metal Color=RGB(120,80,40)
BedFloor: Part Size(5.5,0.3,4.5) Material=Wood Color=RGB(100,65,30) rear
BedSideL/R x2: Part Size(5.5,1.8,0.3) Material=Metal Color=RGB(120,80,40)
BedFront: Part Size(0.3,2,4.5) Material=Metal Color=RGB(120,80,40)
Tailgate: Part Size(0.3,1.8,4.5) Material=Metal Color=RGB(120,80,40) HingeConstraint -90 open
Hood: Part Size(4,0.4,4.5) Material=Metal Color=RGB(120,80,40)
FrontBumper: Part Size(0.5,1.5,4.8) Material=Metal Color=RGB(80,60,40) steel
RearBumper: Part Size(0.5,1.2,4.8) Material=Metal Color=RGB(80,60,40)
Grille: Part Size(0.3,1.2,3.5) Material=Metal Color=RGB(30,30,30)
HeadlightL/R x2: Part Size(0.8,0.7,0.5) Material=Neon Color=RGB(255,250,200)
TaillightL/R x2: Part Size(0.8,0.6,0.4) Material=Neon Color=RGB(255,40,20)
WheelFL/FR x2: Cylinder Size(0.55,1.8,1.8) Material=Rubber Color=RGB(20,20,20)
WheelRL/RR x2 dual rear: Cylinder Size(0.55,1.8,1.8) x2 each side stacked
HubFL/FR/RL/RR x4: Cylinder Size(0.4,1.5,1.5) Material=Metal Color=RGB(150,140,130)
Roof: Part Size(4.5,0.3,4.2) Material=Metal Color=RGB(120,80,40)
DoorFL/FR/RL/RR x4: Part Size(2,2.2,0.2) Material=Metal Color=RGB(120,80,40)
Windshield: Part Size(4,2.2,0.1) Material=Glass Transparency=0.4 Color=RGB(160,200,240)
ExhaustStack: Cylinder Size(0.4,2.5,0.4) Material=Metal Color=RGB(90,80,70) cab rear top
VehicleSeat: Size(1.6,0.5,2) MaxSpeed=90 Torque=50 TurnSpeed=1.0
Connections: CylindricalConstraint all 6 wheels; HingeConstraint tailgate

--- SUV (35 parts) ---
Body: Part Size(9.5,3.2,4.8) Material=Metal Color=RGB(60,60,70)
Roof: Part Size(8,0.35,4.6) Material=Metal Color=RGB(55,55,65)
RoofRack: Part Size(7,0.15,4) Material=Metal Color=RGB(30,30,30) on roof +0.25Y
RoofRackBar x3: Part Size(0.2,0.3,4.2) Material=Metal Color=RGB(30,30,30) cross bars
Hood: Part Size(3.5,0.4,4.8) Material=Metal Color=RGB(60,60,70)
FrontBumper: Part Size(0.6,1.6,5) Material=Concrete Color=RGB(30,30,30)
RearBumper: Part Size(0.6,1.4,5) Material=Concrete Color=RGB(30,30,30)
Grille: Part Size(0.3,1,3.8) Material=Metal Color=RGB(20,20,20)
HeadlightL/R x2: Part Size(1,0.7,0.5) Material=Neon Color=RGB(255,252,220)
TaillightL/R x2: Part Size(1,0.7,0.4) Material=Neon Color=RGB(255,30,20)
FogLightL/R x2: Part Size(0.6,0.4,0.3) Material=Neon Color=RGB(255,200,100) bumper
DoorFL/FR/RL/RR x4: Part Size(2.2,2.4,0.2) Material=Metal Color=RGB(60,60,70)
Hatch: Part Size(4,2.8,0.2) Material=Metal Color=RGB(60,60,70) rear HingeConstraint
Windshield: Part Size(4.2,2.4,0.1) Material=Glass Transparency=0.38 Color=RGB(170,210,250)
SideWindowsL/R x4: Part Size(1.8,1.4,0.1) Material=Glass Transparency=0.35
WheelFL/FR/RL/RR x4: Cylinder Size(0.6,2,2) Material=Rubber Color=RGB(20,20,20)
HubFL/FR/RL/RR x4: Cylinder Size(0.4,1.7,1.7) Material=Metal Color=RGB(160,160,170)
SpareWheel: Cylinder Size(0.5,1.8,1.8) Material=Rubber Color=RGB(20,20,20) rear door
VehicleSeat: Size(1.7,0.55,2.2) MaxSpeed=100 Torque=45 TurnSpeed=1.1

--- BUS (40 parts) ---
MainBody: Part Size(22,5,5) Material=Metal Color=RGB(240,200,0)
Roof: Part Size(21,0.4,4.8) Material=Metal Color=RGB(240,200,0)
FrontFace: Part Size(0.5,5,5) Material=Metal Color=RGB(240,200,0)
RearFace: Part Size(0.5,5,5) Material=Metal Color=RGB(240,200,0)
FrontBumper: Part Size(0.6,1.5,5.2) Material=Metal Color=RGB(30,30,30)
RearBumper: Part Size(0.6,1.5,5.2) Material=Metal Color=RGB(30,30,30)
WindshieldFront: Part Size(0.2,3.5,4.6) Material=Glass Transparency=0.35 Color=RGB(180,220,255)
WindshieldRear: Part Size(0.2,3,4.6) Material=Glass Transparency=0.35
Windows x10: Part Size(0.15,1.8,2) Material=Glass Transparency=0.3 evenly spaced both sides
DoorFront: Part Size(0.2,4,1.5) Material=Glass Transparency=0.3 HingeConstraint
EmergencyDoor: Part Size(0.2,4,2) Material=Metal Color=RGB(240,200,0) rear HingeConstraint
HeadlightL/R x2: Part Size(0.5,1,0.8) Material=Neon Color=RGB(255,250,210)
TaillightL/R x2: Part Size(0.5,1,0.6) Material=Neon Color=RGB(255,20,10)
RouteSignFront: Part Size(0.2,1,3) Material=Neon Color=RGB(0,180,255) Transparency=0.1
Wheels x6: Cylinder Size(0.55,2,2) Material=Rubber Color=RGB(15,15,15)
Hubs x6: Cylinder Size(0.4,1.8,1.8) Material=Metal Color=RGB(120,120,130)
DriverSeat: Size(1.4,0.5,1.8) VehicleSeat MaxSpeed=60 Torque=60 TurnSpeed=0.7
PassengerSeats x12: Part Size(1,0.6,0.8) Material=Fabric Color=RGB(20,100,180) rows
InteriorFloor: Part Size(20,0.2,4.6) Material=Concrete Color=RGB(60,60,60) inside

--- MONSTER TRUCK (30 parts) ---
Body: Part Size(8,3.5,5) Material=Metal Color=RGB(80,0,200)
Chassis: Part Size(9,1,5.5) Material=Metal Color=RGB(30,30,30) low
RollCage: 4x Part Size(0.3,3,0.3) Material=Metal Color=RGB(30,30,30) corner uprights
RollCageTop: Part Size(8,0.3,5) Material=Metal Color=RGB(30,30,30)
Hood: Part Size(3,0.5,5) Material=Metal Color=RGB(80,0,200)
ScoopIntake: Part Size(1.5,1.5,3) Material=Metal Color=RGB(30,30,30) hood center
HeadlightL/R x2: Part Size(0.8,0.8,0.6) Material=Neon Color=RGB(255,255,180)
LightBarRoof: Part Size(6,0.6,0.6) Material=Neon Color=RGB(255,100,0)
FlamePaintL/R x2: Part Size(4,0.1,1.2) Material=Neon Color=RGB(255,80,0) Transparency=0.3 sides decal effect
WheelFL/FR/RL/RR x4: Cylinder Size(1.2,3.5,3.5) Material=Rubber Color=RGB(20,20,20) MASSIVE
HubFL/FR/RL/RR x4: Cylinder Size(0.8,3,3) Material=Metal Color=RGB(150,40,40) spiked hub
AxleF/R x2: Part Size(0.5,0.5,7) Material=Metal Color=RGB(50,50,50)
ShockFL/FR/RL/RR x4: Cylinder Size(0.3,2.5,0.3) Material=Metal Color=RGB(80,80,80)
VehicleSeat: Size(1.4,0.5,2) MaxSpeed=70 Torque=80 TurnSpeed=0.9
SuspensionSprings x4: SpringConstraint RestLength=2.5 Stiffness=3000 Damping=300

--- GO-KART (22 parts) ---
Chassis: Part Size(5,0.5,3) Material=Metal Color=RGB(200,60,0)
SeatPan: Part Size(2,1.5,2) Material=Plastic Color=RGB(30,30,30) center
BodyworkNose: WedgePart Size(2,0.8,3) Material=Metal Color=RGB(200,60,0) front
BodyworkRear: Part Size(2.5,1,3) Material=Metal Color=RGB(200,60,0)
Sidepods x2: Part Size(3,0.8,0.8) Material=Metal Color=RGB(200,60,0)
SteeringColumn: Cylinder Size(0.2,0.8,0.2) Material=Metal Color=RGB(60,60,60)
SteeringWheel: Torus-like Part Size(0.1,1.2,1.2) Material=Rubber Color=RGB(20,20,20)
WheelFL/FR x2: Cylinder Size(0.4,1,1) Material=Rubber Color=RGB(20,20,20)
WheelRL/RR x2: Cylinder Size(0.5,1.2,1.2) Material=Rubber Color=RGB(20,20,20) wider rear
HubFL/FR/RL/RR x4: Cylinder Size(0.3,0.8,0.8) Material=Metal Color=RGB(130,130,130)
NumberPlate: Part Size(0.1,0.8,1.2) Material=Neon Color=RGB(255,255,0)
AxleF/R x2: Part Size(0.3,0.3,3.5) Material=Metal Color=RGB(70,70,70)
VehicleSeat MaxSpeed=80 Torque=25 TurnSpeed=2.0

--- MOTORCYCLE (24 parts) ---
Frame: Part Size(3.5,1.5,0.4) Material=Metal Color=RGB(20,20,20)
FuelTank: Part Size(1.8,1,1) Material=Metal Color=RGB(180,0,0) center top
Seat: Part Size(2,0.6,0.8) Material=Leather Color=RGB(20,20,20)
FairingFront: WedgePart Size(1.5,1.8,1.2) Material=Metal Color=RGB(180,0,0)
FairingL/R x2: Part Size(2,1.2,0.3) Material=Metal Color=RGB(180,0,0)
Headlight: Part Size(0.6,0.5,0.4) Material=Neon Color=RGB(255,255,200) front
Taillight: Part Size(0.5,0.3,0.3) Material=Neon Color=RGB(255,0,0) rear
HandlebarsL/R x2: Cylinder Size(0.15,0.15,0.8) Material=Metal Color=RGB(150,150,160)
ForkL/R x2: Cylinder Size(0.2,1.5,0.2) Material=Metal Color=RGB(160,160,170) front suspension
FrontWheel: Cylinder Size(0.35,1.6,1.6) Material=Rubber Color=RGB(15,15,15)
RearWheel: Cylinder Size(0.45,1.8,1.8) Material=Rubber Color=RGB(15,15,15) wider
FrontHub: Cylinder Size(0.25,1.4,1.4) Material=Metal Color=RGB(140,140,150)
RearHub: Cylinder Size(0.3,1.5,1.5) Material=Metal Color=RGB(140,140,150)
ExhaustPipe: Cylinder Size(0.15,2.5,0.15) Material=Metal Color=RGB(100,90,80) right side
MufflerEnd: Cylinder Size(0.25,0.6,0.25) Material=Metal Color=RGB(120,110,100)
Footpeg x2: Part Size(0.4,0.15,0.6) Material=Metal Color=RGB(80,80,80)
VehicleSeat MaxSpeed=120 Torque=30 TurnSpeed=2.2

--- POLICE CAR (30 parts — based on sedan with additions) ---
Body: Part Size(8,2.5,4) Material=Metal Color=RGB(240,240,245) [white]
Hood: Part Size(3,0.4,4) Material=Metal Color=RGB(240,240,245)
Trunk: Part Size(2.5,0.8,4) Material=Metal Color=RGB(240,240,245)
Roof: Part Size(4,0.3,3.6) Material=Metal Color=RGB(240,240,245)
LightBarBase: Part Size(3.5,0.4,0.8) Material=Metal Color=RGB(20,20,20) roof center
LightBarRedL x3: Part Size(0.6,0.5,0.6) Material=Neon Color=RGB(255,0,0) flashing via Script
LightBarBlueR x3: Part Size(0.6,0.5,0.6) Material=Neon Color=RGB(0,80,255) alternating
PoliceSirenDome: Part Size(1,0.6,1) Material=Neon Color=RGB(255,200,0) center bar
BlackStripeL/R x2: Part Size(7,0.05,1) Material=Metal Color=RGB(0,0,0) side decals
BadgeDoor: Part Size(0.05,0.8,0.8) Material=Neon Color=RGB(0,0,200) door center
PushBar: Part Size(0.4,1.2,4.4) Material=Metal Color=RGB(60,60,70) front bumper
HeadlightL/R x2: Part Size(0.8,0.5,0.3) Material=Neon Color=RGB(255,250,220)
TaillightL/R x2: Part Size(0.8,0.5,0.3) Material=Neon Color=RGB(255,30,30)
SpotlightL: Cylinder Size(0.4,0.4,0.4) Material=Neon Color=RGB(255,255,255) driver door
WheelFL/FR/RL/RR x4: Cylinder Size(0.5,1.5,1.5) Material=Rubber Color=RGB(20,20,20)
HubFL/FR/RL/RR x4: Cylinder Size(0.35,1.3,1.3) Material=Metal Color=RGB(180,180,190)
VehicleSeat MaxSpeed=130 Torque=40 TurnSpeed=1.5

--- AMBULANCE (32 parts) ---
Cab: Part Size(5,3.2,4.5) Material=Metal Color=RGB(245,245,245)
Box: Part Size(7,3.8,4.8) Material=Metal Color=RGB(245,245,245) rear
BoxRoof: Part Size(6.8,0.35,4.6) Material=Metal Color=RGB(245,245,245)
RedCrossL/R x2: Part Size(0.05,1.2,1.2) Material=Neon Color=RGB(255,0,0) box sides
RedCrossRear: Part Size(0.05,1.2,1.2) Material=Neon Color=RGB(255,0,0) rear door
RearDoorsL/R x2: Part Size(0.2,3.4,2.3) Material=Metal Color=RGB(245,245,245) HingeConstraint
LightBarBase: Part Size(5,0.4,1) Material=Metal Color=RGB(20,20,20)
LightBarRed x4: Part Size(0.6,0.5,0.8) Material=Neon Color=RGB(255,0,0)
LightBarBlue x4: Part Size(0.6,0.5,0.8) Material=Neon Color=RGB(0,100,255)
HeadlightL/R x2: Part Size(0.8,0.7,0.5) Material=Neon Color=RGB(255,252,210)
Windshield: Part Size(0.2,2.8,4.2) Material=Glass Transparency=0.35
FrontBumper: Part Size(0.6,1.5,4.8) Material=Metal Color=RGB(200,200,200)
WheelFL/FR/RL/RR x4: Cylinder Size(0.55,1.8,1.8) Material=Rubber Color=RGB(20,20,20)
HubFL/FR/RL/RR x4: Cylinder Size(0.4,1.6,1.6) Material=Metal Color=RGB(160,160,170)
VehicleSeat MaxSpeed=110 Torque=50 TurnSpeed=1.0
InteriorEquipment: Part Size(5.5,2,4) Material=Metal Color=RGB(200,220,200) [non-collidable box interior]
`;

export const VEHICLE_BOATS: string = `
=== VEHICLE BOATS BIBLE ===

--- ROWBOAT (16 parts) ---
Hull: Part Size(7,1.2,2.8) Material=Wood Color=RGB(120,80,40) hollowed appearance via wedge sides
HullSideL/R x2: WedgePart Size(7,1.2,0.5) Material=Wood Color=RGB(100,65,30) angled outward
HullBottom: Part Size(6.8,0.3,2.4) Material=Wood Color=RGB(90,58,28)
Bow: WedgePart Size(1.5,1.2,2.8) Material=Wood Color=RGB(120,80,40) tapered front
Stern: Part Size(1,1.4,2.8) Material=Wood Color=RGB(120,80,40) flat rear
Seat x3: Part Size(0.15,0.5,2.6) Material=Wood Color=RGB(140,95,50) benches at intervals
OarLockL/R x2: Part Size(0.15,0.4,0.3) Material=Metal Color=RGB(120,110,100) mid sides
OarShaftL/R x2: Cylinder Size(0.12,4,0.12) Material=Wood Color=RGB(130,90,45)
OarBladeL/R x2: WedgePart Size(0.1,0.6,1.2) Material=Wood Color=RGB(130,90,45)
BodyForce: for buoyancy, attach to HullBottom, Force=(0,workspace.Gravity*massEstimate,0)
Note: No engine — oars animated via script on player row action

--- SPEEDBOAT (28 parts) ---
Hull: Part Size(10,2,4) Material=Metal Color=RGB(255,255,255) [fiberglass white]
HullSideL/R x2: WedgePart Size(10,2,0.6) Material=Metal Color=RGB(255,255,255) V-hull shape
KelsonBottom: Part Size(9.5,0.3,0.8) Material=Metal Color=RGB(220,220,225) center keel
Bow: WedgePart Size(2.5,1.5,4) Material=Metal Color=RGB(255,255,255) sharp nose
Windshield: Part Size(0.15,1.2,3.5) Material=Glass Transparency=0.4 Color=RGB(180,220,255)
WindshieldFrame: Part Size(0.2,1.3,3.7) Material=Metal Color=RGB(30,30,30)
DeckFront: Part Size(5,0.2,3.8) Material=Metal Color=RGB(240,235,220) non-slip texture
DeckRear: Part Size(4,0.2,3.8) Material=Metal Color=RGB(240,235,220)
CockpitRim: Part Size(0.15,0.8,3) Material=Metal Color=RGB(30,30,30) sides of cockpit
DriverSeat: Part Size(1.5,0.8,2) Material=Leather Color=RGB(20,20,20) VehicleSeat
PassengerSeat: Part Size(1.5,0.8,2) Material=Leather Color=RGB(20,20,20)
SteeringWheel: Part Size(0.1,1,1) Material=Metal Color=RGB(80,80,80)
EngineHatch: Part Size(3,0.3,3.2) Material=Metal Color=RGB(30,30,30) rear deck
PropellerHub: Cylinder Size(0.4,0.5,0.5) Material=Metal Color=RGB(150,140,120) rear under
PropellerBlade x3: Part Size(0.1,0.8,2) Material=Metal Color=RGB(150,140,120) 120deg apart
PropellerShaft: Cylinder Size(0.2,1.5,0.2) Material=Metal Color=RGB(100,90,80)
WakeEffect: Part Size(6,0.1,4) Material=Glass Transparency=0.7 Color=RGB(255,255,255) rear trail visual
SideLightRed: Part Size(0.3,0.3,0.3) Material=Neon Color=RGB(255,0,0) port bow
SideLightGreen: Part Size(0.3,0.3,0.3) Material=Neon Color=RGB(0,200,0) starboard bow
AnchorChain: Cylinder Size(0.1,1,0.1) Material=Metal Color=RGB(80,80,80) bow
BodyForce buoyancy attached to keel; Script: throttle via VehicleSeat, propeller spin CylindricalConstraint

--- YACHT (45 parts) ---
Hull: Part Size(18,3.5,6) Material=Metal Color=RGB(245,240,235) [fiberglass white]
HullSideL/R x2: WedgePart Size(18,3.5,0.8) Material=Metal Color=RGB(240,235,230)
Keel: Part Size(15,4,0.5) Material=Metal Color=RGB(60,60,70) below hull
KelsonBottom: Part Size(17,0.4,1) Material=Metal Color=RGB(220,220,225)
BowSprit: Cylinder Size(0.3,3,0.3) Material=Wood Color=RGB(80,60,40) front extending
MainDeck: Part Size(16,0.3,5.8) Material=Wood Color=RGB(140,100,60)
ForeDeck: Part Size(6,0.3,5.8) Material=Wood Color=RGB(140,100,60)
CockpitDeck: Part Size(5,0.3,4.5) Material=Wood Color=RGB(130,90,55)
Cabin: Part Size(8,2.8,5) Material=Metal Color=RGB(245,240,235) midship
CabinRoof: Part Size(7.5,0.3,4.8) Material=Metal Color=RGB(240,235,230)
CabinWindowsL/R x4: Part Size(0.15,1,1.5) Material=Glass Transparency=0.4 Color=RGB(180,220,255)
Companionway: Part Size(1.5,2.5,0.2) Material=Wood Color=RGB(120,85,45) cabin entry
Mast: Cylinder Size(0.4,14,0.4) Material=Wood Color=RGB(170,130,80) center deck
Boom: Cylinder Size(0.3,9,0.3) Material=Wood Color=RGB(160,120,75) horizontal from mast
MainsailL: WedgePart Size(0.1,12,8) Material=Fabric Color=RGB(255,255,240) Transparency=0.1
Jib: WedgePart Size(0.1,10,6) Material=Fabric Color=RGB(255,255,240) Transparency=0.1 forward
Shroud x4: Cylinder Size(0.05,10,0.05) Material=Metal Color=RGB(180,180,190) wire cables
Tiller: Part Size(0.15,0.3,2.5) Material=Wood Color=RGB(120,85,45) cockpit
HelmWheel: Part Size(0.2,2.5,2.5) Material=Wood Color=RGB(100,70,40) large spoked
LifelineL/R x2: Cylinder Size(0.05,16,0.05) Material=Metal Color=RGB(200,200,210) sides
Stanchion x6: Cylinder Size(0.1,1.2,0.1) Material=Metal Color=RGB(200,200,210) supports
Winch x2: Cylinder Size(0.5,0.4,0.5) Material=Metal Color=RGB(160,150,140) cockpit
PropellerHub: Cylinder Size(0.4,0.6,0.6) Material=Metal Color=RGB(140,130,120) aux engine
PropellerBlade x3: Part Size(0.1,0.8,2.5) Material=Metal Color=RGB(140,130,120)
AnchorL: Part Size(0.5,1.5,0.8) Material=Metal Color=RGB(60,60,70) bow
NavigationLights: Neon parts Red/Green/White at standard positions
SeatCushion x4: Part Size(3,0.3,1.5) Material=Fabric Color=RGB(20,80,140) cockpit benches
BodyForce buoyancy at keel line; aux motor BodyVelocity max 20 studs/s

--- PIRATE SHIP (60 parts) ---
HullMain: Part Size(24,5,9) Material=Wood Color=RGB(80,50,25)
HullSideL/R x2: WedgePart Size(24,5,1.2) Material=Wood Color=RGB(70,42,20) flaring sides
HullSideUpperL/R x2: Part Size(22,2,0.3) Material=Wood Color=RGB(80,50,25)
Keel: Part Size(22,2,1) Material=Wood Color=RGB(55,35,15)
BowFigurehead: Part Size(1.5,3,1.5) Material=Wood Color=RGB(200,160,100) carved skull
BowSprit: Cylinder Size(0.5,6,0.5) Material=Wood Color=RGB(90,60,30) angled 20deg up
MainDeck: Part Size(22,0.4,8.6) Material=Wood Color=RGB(100,65,30) planks
QuarterDeck: Part Size(6,0.4,8.6) Material=Wood Color=RGB(100,65,30) raised rear
ForecastleDeck: Part Size(5,0.4,8.6) Material=Wood Color=RGB(100,65,30) raised front
ForecastleWall: Part Size(0.4,2.5,8.6) Material=Wood Color=RGB(80,50,25)
QuarterDeckWall: Part Size(0.4,2.5,8.6) Material=Wood Color=RGB(80,50,25)
ForecastleRailing x8: Part Size(0.15,1.5,0.15) Material=Wood Color=RGB(70,42,20) balustrade
ForeRail x2: Part Size(5,0.15,0.15) Material=Wood Color=RGB(70,42,20) top rail
QuarterRail x2: Part Size(6,0.15,0.15) Material=Wood Color=RGB(70,42,20)
MainMast: Cylinder Size(0.6,20,0.6) Material=Wood Color=RGB(110,75,40)
ForeM mast: Cylinder Size(0.5,16,0.5) Material=Wood Color=RGB(110,75,40)
MizzenMast: Cylinder Size(0.4,12,0.4) Material=Wood Color=RGB(110,75,40) rear
MainYard: Cylinder Size(0.4,12,0.4) Material=Wood Color=RGB(100,68,35)
ForeYard: Cylinder Size(0.35,10,0.35) Material=Wood Color=RGB(100,68,35)
MainSail: WedgePart Size(0.1,10,11) Material=Fabric Color=RGB(200,185,155) weathered
ForeSail: WedgePart Size(0.1,8,9) Material=Fabric Color=RGB(200,185,155)
JollyRogerFlag: Part Size(0.1,2.5,4) Material=Fabric Color=RGB(10,10,10) skull icon neon white
CannonPortL/R x4 each side: Part Size(0.5,0.8,0.8) Material=Wood Color=RGB(70,42,20) gun ports
Cannon x4: Cylinder+wedge assembly Size(0.5,0.5,2.5) Material=Metal Color=RGB(40,40,45)
CannonWheels x8: Cylinder Size(0.3,0.5,0.5) Material=Wood Color=RGB(90,60,30)
Helm: Part Size(0.3,2.8,2.8) Material=Wood Color=RGB(100,65,30) spoked wheel
HelmPost: Cylinder Size(0.4,1.8,0.4) Material=Wood Color=RGB(90,60,30)
Capstan: Cylinder Size(0.8,1.5,0.8) Material=Wood Color=RGB(90,60,30) foredeck
AnchorL/R x2: Part Size(0.8,2.5,1.2) Material=Metal Color=RGB(55,55,60)
Lantern x4: Part Size(0.6,1,0.6) Material=Neon Color=RGB(255,160,40) mast/stern
Rigging x10: Cylinder Size(0.08,8,0.08) Material=Fabric Color=RGB(80,60,40) rope lines
SternWindows x3: Part Size(0.15,1.5,1.2) Material=Glass Transparency=0.4 Color=RGB(200,220,255)
Rudder: Part Size(0.3,4,3.5) Material=Wood Color=RGB(70,42,20) rear underwater
BodyForce buoyancy on keel; no engine, wind via BodyVelocity when sails angled to wind script

--- SUBMARINE (38 parts) ---
PressureHull: Cylinder Size(5,5,18) Material=Metal Color=RGB(40,50,40) [main elongated body]
BowDome: Part Size(3,3,3) Material=Metal Color=RGB(38,48,38) ellipsoid front cap
SternCone: WedgePart Size(3,3,4) Material=Metal Color=RGB(38,48,38)
ConningTower: Part Size(2.5,3.5,4) Material=Metal Color=RGB(45,55,45) top center
PeriscopeShaft: Cylinder Size(0.3,4,0.3) Material=Metal Color=RGB(60,70,60) tower top
PerisopeHead: Part Size(0.6,0.6,0.4) Material=Metal Color=RGB(60,70,60)
TorpedoTubeFL/FR x2: Cylinder Size(0.8,0.8,3) Material=Metal Color=RGB(35,45,35) bow
TorpedoHatch x2: Part Size(0.85,0.85,0.2) Material=Metal Color=RGB(45,55,45)
HullRibbing x6: Cylinder Size(5.2,5.2,0.3) Material=Metal Color=RGB(35,45,35) rings hull exterior
BallastTankL/R x2: Part Size(14,1.5,2) Material=Metal Color=RGB(40,50,40) underside
PropellerHub: Cylinder Size(0.8,0.8,0.8) Material=Metal Color=RGB(100,100,90) stern
PropellerBlade x4: Part Size(0.15,1.5,3) Material=Metal Color=RGB(100,100,90) 90deg apart
PropellerShaft: Cylinder Size(0.4,2,0.4) Material=Metal Color=RGB(80,80,75)
RudderV: Part Size(0.3,4,2.5) Material=Metal Color=RGB(40,50,40) vertical stern
RudderH: Part Size(0.3,2,3) Material=Metal Color=RGB(40,50,40) horizontal stern
DivingPlaneFL/FR x2: Part Size(0.3,1.5,3) Material=Metal Color=RGB(40,50,40) bow sides
DivingPlaneRL/RR x2: Part Size(0.3,1.5,2.5) Material=Metal Color=RGB(40,50,40) stern sides
HatchTop: Cylinder Size(1,1,0.4) Material=Metal Color=RGB(50,60,50) conning tower top
PortlightL/R x4: Cylinder Size(0.8,0.8,0.3) Material=Glass Transparency=0.4 Color=RGB(120,200,255)
NavigationLightRed: Part Size(0.3,0.3,0.3) Material=Neon Color=RGB(255,0,0) port
NavigationLightGreen: Part Size(0.3,0.3,0.3) Material=Neon Color=RGB(0,200,0) starboard
Script: BodyForce for buoyancy, adjust Y force to dive/surface; BodyVelocity forward; BodyGyro orientation; HingeConstraint diving planes

--- FISHING BOAT (26 parts) ---
Hull: Part Size(12,2.5,5) Material=Wood Color=RGB(100,65,30)
HullSideL/R x2: WedgePart Size(12,2.5,0.7) Material=Wood Color=RGB(88,55,24)
Transom: Part Size(0.4,2.5,5) Material=Wood Color=RGB(100,65,30) flat stern
Deck: Part Size(11,0.3,4.6) Material=Wood Color=RGB(120,80,40)
CabinSmall: Part Size(4,2.5,4) Material=Metal Color=RGB(200,190,170)
CabinRoof: Part Size(3.8,0.3,4) Material=Metal Color=RGB(180,170,150)
Windshield: Part Size(0.15,1.5,3.8) Material=Glass Transparency=0.35
FishingRodL/R x2: Cylinder Size(0.1,0.1,6) Material=Wood Color=RGB(110,75,40) angled back
ReelL/R x2: Cylinder Size(0.3,0.3,0.3) Material=Metal Color=RGB(120,110,100)
FishHold: Part Size(4,1.5,4) Material=Metal Color=RGB(150,160,155) amidship open box
LifeRing: Torus Part Size(0.3,1.2,1.2) Material=Fabric Color=RGB(255,100,20)
AnchorChain: Cylinder Size(0.15,2,0.15) Material=Metal Color=RGB(70,70,75) bow
PropellerHub: Cylinder Size(0.5,0.6,0.6) Material=Metal Color=RGB(130,120,110) stern
PropellerBlade x3: Part Size(0.1,0.7,2) Material=Metal Color=RGB(130,120,110)
OutboardMotor: Part Size(1,2.5,0.8) Material=Metal Color=RGB(30,30,40) transom mounted
VehicleSeat MaxSpeed=30 Torque=20 TurnSpeed=0.8
Buoyancy via BodyForce on hull center
`;

export const VEHICLE_AIRCRAFT: string = `
=== VEHICLE AIRCRAFT BIBLE ===

--- AIRPLANE / PROPELLER PLANE (38 parts) ---
Fuselage: Cylinder Size(3,3,20) Material=Metal Color=RGB(220,225,235)
NoseCone: WedgePart Size(2.5,2.5,5) Material=Metal Color=RGB(220,225,235)
TailCone: WedgePart Size(2,2,5) Material=Metal Color=RGB(220,225,235)
WingL: WedgePart Size(0.6,1.5,12) Material=Metal Color=RGB(220,225,235) dihedral 5deg up
WingR: WedgePart Size(0.6,1.5,12) Material=Metal Color=RGB(220,225,235) mirror
WingTipL/R x2: WedgePart Size(0.4,1,2) Material=Metal Color=RGB(220,225,235) winglet
AileronL/R x2: Part Size(0.3,0.8,4) Material=Metal Color=RGB(200,205,215) HingeConstraint
HStabL/R x2: WedgePart Size(0.4,0.8,5) Material=Metal Color=RGB(220,225,235) tail
ElevatorL/R x2: Part Size(0.3,0.6,2.5) Material=Metal Color=RGB(200,205,215) HingeConstraint
VStab: WedgePart Size(0.4,4,4) Material=Metal Color=RGB(220,225,235) vertical tail fin
Rudder: Part Size(0.3,3.5,2) Material=Metal Color=RGB(200,205,215) HingeConstraint
EngineNacelleL/R x2: Cylinder Size(1.2,1.2,4) Material=Metal Color=RGB(180,185,195)
PropHub: Cylinder Size(0.5,0.5,0.5) Material=Metal Color=RGB(60,60,70) each engine
PropBlade x3 per engine: Part Size(0.15,0.5,4) Material=Metal Color=RGB(50,50,60)
LandingGearMain x2: Cylinder Size(0.4,0.4,2.5) Material=Metal Color=RGB(60,60,70)
LandingGearNose: Cylinder Size(0.3,0.3,2) Material=Metal Color=RGB(60,60,70)
WheelMain x2: Cylinder Size(0.5,1,1) Material=Rubber Color=RGB(20,20,20)
WheelNose: Cylinder Size(0.4,0.8,0.8) Material=Rubber Color=RGB(20,20,20)
WindowsL/R x6: Part Size(0.1,0.9,1.4) Material=Glass Transparency=0.35 Color=RGB(180,220,255)
CockpitGlass: Part Size(0.1,1.5,2.5) Material=Glass Transparency=0.3 Color=RGB(180,220,255)
NavLightRed: Part Size(0.3,0.3,0.3) Material=Neon Color=RGB(255,0,0) left wingtip
NavLightGreen: Part Size(0.3,0.3,0.3) Material=Neon Color=RGB(0,200,0) right wingtip
StrobeTail: Part Size(0.4,0.4,0.4) Material=Neon Color=RGB(255,255,255) tail
Script: BodyVelocity forward thrust; BodyGyro pitch/roll/yaw; HingeConstraint control surfaces; PropBlade CylindricalConstraint spin

--- HELICOPTER (36 parts) ---
FuselageMain: Part Size(8,3,3.5) Material=Metal Color=RGB(40,80,40) [military green]
NoseBubble: Part Size(3,2.5,3) Material=Glass Transparency=0.35 Color=RGB(160,210,255) front
TailBoom: Part Size(10,1,1) Material=Metal Color=RGB(40,80,40) extends rear
TailFinV: WedgePart Size(0.3,3,2.5) Material=Metal Color=RGB(40,80,40)
TailFinH: WedgePart Size(0.3,1.5,3) Material=Metal Color=RGB(40,80,40)
MainRotorHub: Cylinder Size(0.8,0.6,0.8) Material=Metal Color=RGB(30,30,35) top center
MainRotorBlade x4: Part Size(0.4,0.3,12) Material=Metal Color=RGB(35,35,40) 90deg apart
MainRotorMast: Cylinder Size(0.4,2,0.4) Material=Metal Color=RGB(50,50,55)
TailRotorHub: Cylinder Size(0.4,0.3,0.4) Material=Metal Color=RGB(30,30,35) tail tip
TailRotorBlade x3: Part Size(0.2,0.2,2.5) Material=Metal Color=RGB(35,35,40) 120deg
SkidL/R x2: Part Size(0.3,0.3,10) Material=Metal Color=RGB(25,25,30) landing skids
SkidMountFL/FR/RL/RR x4: Part Size(0.3,2.5,0.3) Material=Metal Color=RGB(25,25,30)
ExhaustStack: Cylinder Size(0.5,0.8,0.5) Material=Metal Color=RGB(50,50,50) top rear
EngineHump: Part Size(3,1.5,3) Material=Metal Color=RGB(35,70,35) above cabin
WindowL/R x4: Part Size(0.1,1.4,1.6) Material=Glass Transparency=0.35
SlidingDoorL: Part Size(0.1,2.5,3.5) Material=Metal Color=RGB(40,80,40) side
SearchLight: Cylinder Size(0.8,0.8,0.6) Material=Neon Color=RGB(255,255,240) underbelly
NavLights: Neon parts standard colors
Script: BodyVelocity vertical/horizontal thrust from rotor; BodyGyro heading; MainRotorBlade AlignOrientation; TailRotorBlade CylindricalConstraint countertorque

--- ROCKET (28 parts) ---
MainBody: Cylinder Size(3,3,16) Material=Metal Color=RGB(240,240,245)
NoseCone: WedgePart/Sphere cap Size(3,3,6) Material=Metal Color=RGB(240,240,245)
FinFL/FR/RL/RR x4: WedgePart Size(0.3,4,4) Material=Metal Color=RGB(200,200,210) 90deg apart base
FinExtFL x4: WedgePart Size(0.2,2,2) Material=Metal Color=RGB(200,200,210) secondary fins
EngineBaseRing: Cylinder Size(3.4,3.4,1) Material=Metal Color=RGB(160,160,170) bottom
NozzleOuter: Cylinder Size(2.5,2.5,3) Material=Metal Color=RGB(140,140,150) flared
NozzleInner: Cylinder Size(1.5,1.5,3.5) Material=Metal Color=RGB(120,120,130)
ExhaustFlame: Part Size(1.5,1.5,4) Material=Neon Color=RGB(255,120,20) Transparency=0.2 animated
ExhaustGlow: Part Size(2,2,6) Material=Neon Color=RGB(255,60,0) Transparency=0.5 outer
OxidizerTankStripe: Part Size(3.1,3.1,4) Material=Neon Color=RGB(255,255,255) Transparency=0.8 label band
StageRing: Part Size(3.2,3.2,0.5) Material=Metal Color=RGB(180,180,190) stage separator
Payload: Cylinder Size(2.5,2.5,4) Material=Metal Color=RGB(220,225,235) top
PayloadFairing: Cylinder Size(2.7,2.7,4.5) Material=Metal Color=RGB(245,245,250) covers payload
WindowPort: Cylinder Size(0.8,0.8,0.3) Material=Glass Transparency=0.3 mid body x2
LandingLegFL/FR/RL/RR x4: Part Size(0.3,0.3,6) Material=Metal Color=RGB(220,220,230) retractable HingeConstraint
LandingFootL x4: Part Size(0.5,0.5,1.5) Material=Metal Color=RGB(200,200,210)
Script: BodyVelocity upward thrust increasing; BodyGyro alignment; ExhaustFlame transparency oscillation; stage separation via Weld disconnect

--- SPACESHIP (40 parts) ---
CoreHull: Part Size(12,4,6) Material=Metal Color=RGB(30,35,50) [dark space aesthetic]
NoseProw: WedgePart Size(5,4,6) Material=Metal Color=RGB(28,33,48) tapered front
BridgeDome: Part Size(4,2.5,5) Material=Glass Transparency=0.35 Color=RGB(100,150,255) top forward
WingL: WedgePart Size(0.6,2,10) Material=Metal Color=RGB(30,35,50) swept back
WingR: mirror WingL
WingGlowL/R x2: Part Size(0.2,0.3,9) Material=Neon Color=RGB(0,100,255) leading edge trim
EngineNacelleL/R x2: Cylinder Size(2,2,8) Material=Metal Color=RGB(25,30,45)
EnginePodCenter: Cylinder Size(2.5,2.5,7) Material=Metal Color=RGB(25,30,45) rear center
ThrusterL/R x2: Cylinder Size(1.8,1.8,2) Material=Neon Color=RGB(0,120,255) Transparency=0.3 engine glow
ThrusterCenter: Cylinder Size(2.2,2.2,2.5) Material=Neon Color=RGB(0,80,255) Transparency=0.2
ShieldGenerator: Part Size(2,2,2) Material=Neon Color=RGB(0,200,255) Transparency=0.6 top
ShieldRingH: Cylinder Size(8,8,0.3) Material=Neon Color=RGB(0,180,255) Transparency=0.7 around ship
ShieldRingV: Cylinder Size(0.3,8,8) Material=Neon Color=RGB(0,180,255) Transparency=0.7
ArmorPlate x6: Part Size(4,0.3,3) Material=Metal Color=RGB(40,45,60) hull panels
GunTurretBase: Cylinder Size(1.2,1.2,0.8) Material=Metal Color=RGB(35,40,55) top hull
GunTurretBarrel: Cylinder Size(0.4,0.4,3) Material=Metal Color=RGB(30,35,50)
HangarDoor: Part Size(4,3,0.3) Material=Metal Color=RGB(30,35,50) underbelly HingeConstraint
WindowRowL/R x6: Part Size(0.1,0.8,1.2) Material=Glass Transparency=0.35 Color=RGB(150,200,255)
AntennaArray x3: Cylinder Size(0.1,0.1,4) Material=Metal Color=RGB(180,185,200) top
SensorDish: Part Size(1.5,0.2,1.5) Material=Metal Color=RGB(160,165,180) top rear
LandingGear x3: Part Size(0.4,0.4,4) Material=Metal Color=RGB(50,55,70) retractable
Script: BodyVelocity 3-axis control; BodyGyro full orientation; AlignOrientation for auto-level toggle; thruster glow pulses with thrust input

--- HOT AIR BALLOON (22 parts) ---
BalloonEnvelope: Part Size(10,14,10) Material=Fabric Color=RGB(220,60,20) [main sphere-like top]
EnvelopePanel x8: WedgePart Size(0.5,13,4) Material=Fabric alternating colors RGB(220,60,20)/RGB(240,200,0)/RGB(20,100,200)/RGB(200,200,200) 45deg apart around envelope
Envelope equator ring: Cylinder Size(10.5,10.5,0.5) Material=Fabric Color=RGB(50,50,50)
SkirtBase: Cylinder Size(4,4,3) Material=Fabric Color=RGB(50,50,50) bottom envelope
Burner: Cylinder Size(1.5,1.5,1.8) Material=Metal Color=RGB(80,80,80) top basket
BurnerFlame: Part Size(0.8,0.8,1.2) Material=Neon Color=RGB(255,100,0) Transparency=0.3
BasketFrame: Part Size(4,3,4) Material=Wood Color=RGB(120,85,45) wicker
BasketFloor: Part Size(3.8,0.3,3.8) Material=Wood Color=RGB(110,75,40)
BasketWallF/B/L/R x4: Part Size(3.8,2.8,0.3) Material=Wood Color=RGB(120,85,45) wicker weave
BasketRopeFL/FR/RL/RR x4: Cylinder Size(0.1,0.1,8) Material=Fabric Color=RGB(140,110,70) ropes
BurnerPilot: Part Size(0.3,0.3,0.3) Material=Neon Color=RGB(255,180,50) small flame pilot
SandBagL/R x2: Cylinder Size(0.6,0.6,1) Material=Fabric Color=RGB(150,130,80) hung outside
Script: BodyForce upward = balloon buoyancy; BodyVelocity for wind drift; burner increases BodyForce when activated

--- BIPLANE (42 parts) ---
Fuselage: Part Size(4,3,16) Material=Wood Color=RGB(100,70,40) [canvas/wood era]
NoseCowl: Cylinder Size(3,3,4) Material=Metal Color=RGB(160,155,140)
TailFin: WedgePart Size(0.3,4,4) Material=Wood Color=RGB(100,70,40)
Elevator x2: WedgePart Size(0.3,1.5,5) Material=Wood Color=RGB(100,70,40) horizontal tail
UpperWingL/R x2: WedgePart Size(0.5,1.5,14) Material=Fabric Color=RGB(200,175,120)
LowerWingL/R x2: WedgePart Size(0.5,1.2,12) Material=Fabric Color=RGB(200,175,120) below fuselage
WingWireFL/FR/RL/RR x4: Cylinder Size(0.06,0.06,6) Material=Metal Color=RGB(150,145,135) bracing wires
WingStrutFL/FR/RL/RR x4: Part Size(0.2,4,0.2) Material=Wood Color=RGB(100,70,40) between wings
AileronUpperL/R x2: Part Size(0.3,0.7,4) Material=Fabric Color=RGB(190,165,110) HingeConstraint
PropHub: Cylinder Size(0.6,0.6,0.5) Material=Metal Color=RGB(80,75,70)
PropBlade x2: Part Size(0.2,0.6,6) Material=Wood Color=RGB(90,65,35) CylindricalConstraint
OpenCockpit: Part Size(2,1.5,2) Material=Wood Color=RGB(90,63,30) cut out in fuselage
Seat: Part Size(1.2,0.6,1.5) Material=Leather Color=RGB(60,40,25)
SteeringStick: Cylinder Size(0.15,0.15,1.5) Material=Metal Color=RGB(80,80,80)
LandingGearV x2: Part Size(0.3,0.3,3) Material=Wood Color=RGB(100,70,40)
LandingWire x2: Cylinder Size(0.06,0.06,3.5) Material=Metal Color=RGB(150,145,135)
WheelF x2: Cylinder Size(0.5,1,1) Material=Rubber Color=RGB(20,20,20)
TailSkid: Part Size(0.2,0.2,1) Material=Wood Color=RGB(90,65,35) tail bottom
Strut x2: Part Size(0.2,2.5,0.2) Material=Wood Color=RGB(100,70,40) nose struts
NavLightRed/Green: Neon parts wingtips
Script: BodyVelocity forward; BodyGyro pitch/roll/yaw; PropBlade spin via CylindricalConstraint ActuatorType=Motor
`;

export const VEHICLE_TRAINS: string = `
=== VEHICLE TRAINS BIBLE ===

--- LOCOMOTIVE (45 parts) ---
BoilerMain: Cylinder Size(4,4,16) Material=Metal Color=RGB(20,20,25) [steam classic]
BoilerBand x4: Cylinder Size(4.2,4.2,0.5) Material=Metal Color=RGB(80,70,50) rings
Smokebox: Cylinder Size(4.5,4.5,4) Material=Metal Color=RGB(25,25,30) front larger
SmokeboxDoor: Cylinder Size(4.4,4.4,0.4) Material=Metal Color=RGB(30,28,25)
Smokestack: Cylinder Size(1.2,1.2,3.5) Material=Metal Color=RGB(20,20,25) top front
StackFlare: Cylinder Size(1.8,1.8,0.5) Material=Metal Color=RGB(20,20,25) top bell
Dome x2: Cylinder Size(1.6,1.6,2) Material=Metal Color=RGB(200,160,50) brass on boiler
WhistlePipe: Cylinder Size(0.3,0.3,1.5) Material=Metal Color=RGB(200,160,50) brass
Cab: Part Size(5,5,5) Material=Metal Color=RGB(20,20,25)
CabRoof: Part Size(5.2,0.4,5) Material=Metal Color=RGB(15,15,20)
CabWindowL/R x2: Part Size(0.1,2,2.5) Material=Glass Transparency=0.3
CabWindowFront: Part Size(4.8,0.1,2) Material=Glass Transparency=0.3
Headlamp: Cylinder Size(1,1,1.2) Material=Neon Color=RGB(255,248,200) front smokebox
CowcatcherWedge: WedgePart Size(4,2.5,3) Material=Metal Color=RGB(30,30,35) pilot front
MainDriveWheelL/R x3 each: Cylinder Size(0.5,3.5,3.5) Material=Metal Color=RGB(25,25,30) large coupled
MainWheelHubL/R x3: Cylinder Size(0.4,3,3) Material=Metal Color=RGB(180,50,40) red spokes
PonyTruckWheelL/R x2: Cylinder Size(0.5,2,2) Material=Metal Color=RGB(25,25,30) front small
TrailingWheelL/R x2: Cylinder Size(0.5,2,2) Material=Metal Color=RGB(25,25,30) rear
ConnectingRodL/R x2: Part Size(0.3,0.5,10) Material=Metal Color=RGB(180,50,40) crank animated
PistonRodL/R x2: Part Size(0.3,0.4,5) Material=Metal Color=RGB(150,150,160)
ValveGearL/R x2: Part Size(0.2,0.3,6) Material=Metal Color=RGB(160,155,145)
SandboxPipe x2: Cylinder Size(0.2,0.2,3) Material=Metal Color=RGB(60,55,45)
HandRailL/R x2: Cylinder Size(0.1,0.1,14) Material=Metal Color=RGB(200,160,50) sides
HandRailPost x6: Cylinder Size(0.1,0.8,0.1) Material=Metal Color=RGB(200,160,50)
Tender: Part Size(8,4,5) Material=Metal Color=RGB(20,20,25) coal/water car behind
TenderCoal: Part Size(7,1,4) Material=Concrete Color=RGB(15,15,20) top of tender
TenderWheelL/R x4: Cylinder Size(0.5,2,2) Material=Metal Color=RGB(25,25,30)
CouplerFront/Rear x2: Part Size(1.5,1.5,1.5) Material=Metal Color=RGB(60,60,65)
Script: CylindricalConstraint on drive wheels ActuatorType=Motor; AlignOrientation keep upright; BodyVelocity on rails (constrained axis only); VehicleSeat cab center

--- PASSENGER CAR (28 parts) ---
CarBody: Part Size(4.5,4,20) Material=Metal Color=RGB(180,30,30)
Roof: Part Size(4.5,0.4,19.8) Material=Metal Color=RGB(160,25,25)
RoofVent x3: Part Size(1,0.5,1.5) Material=Metal Color=RGB(140,20,20) roof line
End x2: Part Size(4.5,4,0.4) Material=Metal Color=RGB(175,28,28)
UnderframeLong x2: Part Size(0.4,0.5,18) Material=Metal Color=RGB(40,40,45)
UnderframeCross x4: Part Size(4.5,0.5,0.4) Material=Metal Color=RGB(40,40,45)
WindowL x7: Part Size(0.1,1.8,2.2) Material=Glass Transparency=0.3 Color=RGB(180,220,255) left side
WindowR x7: mirror right side
DoorFL/FR x2: Part Size(0.1,3.2,1.5) Material=Metal Color=RGB(180,30,30) each end HingeConstraint
StepFL/FR x2: Part Size(1.5,0.4,0.6) Material=Metal Color=RGB(50,50,55)
BogieFrame x2: Part Size(4.5,1,8) Material=Metal Color=RGB(35,35,40) truck frames
BogieWheelFL/FR/RL/RR x4: Cylinder Size(0.5,2.2,2.2) Material=Metal Color=RGB(30,30,35)
BogieWheelHub x4: Cylinder Size(0.4,2,2) Material=Metal Color=RGB(50,50,55)
Coupler x2: Part Size(1.5,1.5,1.5) Material=Metal Color=RGB(55,55,60)
InteriorFloor: Part Size(4.2,0.2,19.4) Material=Wood Color=RGB(100,75,45)
Seats x24: Part Size(0.8,1.5,1.5) Material=Fabric Color=RGB(60,80,140) rows of 2 each side
LuggageRack x2: Part Size(0.2,0.4,18) Material=Metal Color=RGB(150,145,135)
Interior lighting strip x2: Part Size(0.1,0.1,18) Material=Neon Color=RGB(255,240,200) Transparency=0.3

--- FREIGHT CAR (18 parts) ---
BoxCarBody: Part Size(4.5,5,18) Material=Wood Color=RGB(100,60,30)
Roof: Part Size(4.5,0.4,18) Material=Metal Color=RGB(80,80,85)
SlideDoorsL/R x2: Part Size(0.2,4.5,6) Material=Wood Color=RGB(90,55,25) each side slide
DoorTrack x2: Part Size(0.1,0.3,12) Material=Metal Color=RGB(60,60,65)
UnderframeL x2: Part Size(0.4,0.6,16) Material=Metal Color=RGB(35,35,40)
UnderframeX x3: Part Size(4.5,0.6,0.4) Material=Metal Color=RGB(35,35,40)
BogieFrame x2: Part Size(4.5,1,8) Material=Metal Color=RGB(35,35,40)
WheelFL/FR/RL/RR x4: Cylinder Size(0.5,2.2,2.2) Material=Metal Color=RGB(30,30,35)
WheelHub x4: Cylinder Size(0.4,2,2) Material=Metal Color=RGB(50,50,55)
Coupler x2: Part Size(1.5,1.5,1.5) Material=Metal Color=RGB(55,55,60)
End x2: Part Size(4.5,5,0.4) Material=Wood Color=RGB(100,60,30)

--- TRACK SYSTEM (per 20-stud section) ---
RailL: Part Size(0.3,0.4,20) Material=Metal Color=RGB(100,95,90) elevated 0.2 above ties
RailR: mirror
TieSpacing x10 per section: Part Size(5,0.3,0.8) Material=Wood Color=RGB(80,60,35) crosswise every 2 studs
Ballast: Part Size(5.5,0.4,20) Material=Concrete Color=RGB(100,95,90) gravel under ties
JoinPlateL/R x2: Part Size(0.4,0.5,1) Material=Metal Color=RGB(90,85,80) rail joint ends
Bolt x4 per join: Part Size(0.2,0.2,0.4) Material=Metal Color=RGB(80,75,70)
Curve section: rotate 15deg per unit; use multiple sections for smooth curve (min 8 for 90deg bend)
Switch: extra rail segment with HingeConstraint rotation 15deg; lever Part near track

--- STATION (50 parts) ---
Platform: Part Size(30,1.5,8) Material=Concrete Color=RGB(200,195,185)
PlatformEdgeStripe: Part Size(30,0.1,0.5) Material=Neon Color=RGB(255,255,0) Transparency=0.2 edge warning
RoofStructure: Part Size(32,0.5,10) Material=Metal Color=RGB(160,155,145)
RoofSupportBeam x6: Part Size(0.5,5,0.5) Material=Metal Color=RGB(140,135,125)
StationBuilding: Part Size(12,7,8) Material=Brick Color=RGB(150,100,70)
BuildingRoof: Part Size(12,0.5,8) Material=Metal Color=RGB(80,75,70)
PlatformRoofConnector: Part Size(10,0.4,8) Material=Metal Color=RGB(150,145,135) joins building to canopy
MainEntrance: Part Size(4,6,0.4) Material=Wood Color=RGB(90,60,30) double doors
WindowFront x4: Part Size(0.3,2.5,2.5) Material=Glass Transparency=0.3
TicketBooth: Part Size(3,4,3) Material=Wood Color=RGB(120,80,45)
TicketWindow: Part Size(0.2,1,1.5) Material=Glass Transparency=0.3
WaitingBench x6: Part Size(3,0.5,1) Material=Wood Color=RGB(110,75,40)
BenchLeg x12: Part Size(0.2,1,0.2) Material=Metal Color=RGB(60,60,65)
SignBoards x3: Part Size(0.2,1.5,4) Material=Neon Color=RGB(0,100,220) platform name
ClockFace: Cylinder Size(2,2,0.4) Material=Neon Color=RGB(240,235,220) tower clock
ClockTower: Part Size(3,8,3) Material=Brick Color=RGB(140,90,60)
GardenBed x2: Part Size(6,0.4,2) Material=Grass Color=RGB(50,120,40) decorative
LampPost x6: Cylinder Size(0.3,0.3,6) Material=Metal Color=RGB(50,50,60)
LampHead x6: Part Size(0.8,0.6,0.8) Material=Neon Color=RGB(255,240,180) tops
TrashCan x4: Cylinder Size(0.8,0.8,1.2) Material=Metal Color=RGB(60,65,70)
VendingMachine x2: Part Size(1.5,4,1) Material=Metal Color=RGB(20,80,180)
InformationBoard: Part Size(0.2,3,5) Material=Neon Color=RGB(0,0,0) LED display
`;

export const VEHICLE_PHYSICS: string = `
=== VEHICLE PHYSICS BIBLE ===

--- WHEEL SETUP (CylindricalConstraint) ---
Each wheel: WeldConstraint Part0=AxleStub Part1=WheelPart
CylindricalConstraint:
  Attachment0 = axle center attachment (on chassis)
  Attachment1 = wheel center attachment (on wheel)
  WorldAxis = Vector3(0,0,1) or (1,0,0) based on orientation
  RotationActuatorEnabled = true (for driven wheels)
  ActuatorType = Enum.ActuatorType.Motor
  AngularVelocity = 0 initially (set via script based on throttle)
  MotorMaxTorque = 5000 (adjust per vehicle mass)
  LimitsEnabled = false (allow free spin)
  InclinationAngle = 0 (camber in radians, negative = top tilt in = performance)
Non-driven wheels: RotationActuatorEnabled=false, friction via PhysicsService

--- STEERING (HingeConstraint) ---
FrontAxleBlock: Part anchored temporarily as steering knuckle
HingeConstraint:
  Attachment0 = chassis steering pivot
  Attachment1 = axle stub pivot
  LimitsEnabled = true
  UpperAngle = 35 (max steer degrees right)
  LowerAngle = -35 (max steer degrees left)
  ActuatorType = Enum.ActuatorType.Servo
  TargetAngle = 0 initially; set via script: TargetAngle = SteerInput * 35
  ServoMaxTorque = 50000
  Speed = 3 (servo speed rad/s)
Rear steering (advanced): second HingeConstraint same spec but inverted angle for crab steer

--- SUSPENSION (SpringConstraint) ---
Per wheel: 4 SpringConstraints (or 1 per wheel attachment point)
SpringConstraint:
  Attachment0 = chassis hard-point (unsprung)
  Attachment1 = wheel hub arm (sprung)
  RestLength = 1.5 to 3 studs (set to normal ride height)
  Stiffness = 2000 to 8000 (soft=2000 sport=5000 truck=8000)
  Damping = 200 to 800 (underdamped if too low = bouncing; overdamped=stiff)
  MaxLength = RestLength + 0.8 (droop travel)
  MinLength = RestLength - 0.4 (bump travel)
  LimitsEnabled = true
Preload: FreeLength set slightly compressed to handle vehicle weight
Tip: Total spring force must exceed (vehicleMass * Workspace.Gravity) / wheelCount

--- VEHICLESEAT PROPERTIES ---
VehicleSeat is a special BasePart:
  MaxSpeed = 100 (studs/s max — overridden by BodyVelocity if also used)
  Torque = 50 (drivetrain torque multiplier)
  TurnSpeed = 1 (steering sensitivity multiplier)
  Throttle = read-only -1/0/1 (player input)
  Steer = read-only -1/0/1 (player input)
  HeadsUpDisplay = false (recommended — build custom HUD)
  Disabled = false
Reading input: seat.Throttle, seat.Steer (update every frame in RunService loop)
Occupant: seat.Occupant — humanoid currently seated
On occupied: fire server event for physics ownership

--- BODYMOVER ALTERNATIVES (modern approach) ---
AlignOrientation (BodyGyro replacement):
  Responsiveness = 25 (higher = faster correction)
  MaxTorque = 500000
  Mode = Enum.OrientationAlignmentMode.OneAttachment or TwoAttachment
  AlignType = Enum.AlignType.AllAxes for flight; PrimaryAxis for boat/car
  CFrame = target orientation (set in script each frame)

LinearVelocity (BodyVelocity replacement):
  MaxForce = 50000
  RelativeTo = Enum.ActuatorRelativeTo.World or Attachment
  VectorVelocity = Vector3(0,0,-speed) (set each frame from throttle)
  ForceLimitMode = Enum.ForceLimitMode.Magnitude (sphere) or PerAxis

AngularVelocity (for rotors/propellers):
  AngularVelocity = Vector3(0, rotorSpeed, 0)
  MaxTorque = 999999
  RelativeTo = Enum.ActuatorRelativeTo.Attachment

BodyForce (legacy, still reliable for buoyancy/lift):
  Force = Vector3(0, buoyancyForce, 0)
  Adjust each frame: Force = Vector3(0, mass*gravity - submergenceRatio*gravity, 0)

--- BUOYANCY SYSTEM ---
Detect waterY: local waterSurface = workspace.Water.Position.Y + workspace.Water.Size.Y/2
submergence = math.clamp((waterY - hullPos.Y) / hullDepth, 0, 1)
buoyancyForce = vehicleMass * workspace.Gravity * submergence * 1.2 (1.2 = float slightly)
Apply via BodyForce or LinearVelocity each Heartbeat
Add gentle sway: apply small random lateral forces (0.5 magnitude) for waves
Drag: apply opposing horizontal force proportional to velocity squared * waterDragCoef

--- FLIGHT PHYSICS ---
Airplane lift: LiftForce = 0.5 * airDensity * velocity^2 * wingArea * liftCoefficient
Approximate in Roblox: lift = speed^2 * 0.02 clamp to max
Apply via LinearVelocity Y component increasing with forward speed
At stall speed (speed < 30), reduce lift to 0 over 0.5s
BodyGyro / AlignOrientation: pitch nose based on throttle; roll = steer input
Gravity: let workspace gravity pull naturally; lift counteracts it
Helicopter: vertical thrust from AlignOrientation-maintained rotor; collective via Y LinearVelocity

--- TRAIN PHYSICS ---
Constrain to track: CylindricalConstraint along rail axis only (Z axis)
No lateral movement: weld or very stiff SpringConstraint lateral
Bogies: separate BaseParts for each truck, weld to car body via SpringConstraint (vertical only)
Coupler: SpringConstraint between cars RestLength=1.5 Stiffness=10000 Damping=1000
Speed: BodyVelocity or CylindricalConstraint on locomotive, all following cars dragged via couplers
Braking: reduce AngularVelocity target on all drive wheels to 0 with deceleration curve
Signal system: proximity prompt triggers signal Part color change Neon Red/Green
`;

export const VEHICLE_SCRIPTING: string = `
=== VEHICLE SCRIPTING BIBLE ===

--- INPUT HANDLING (UserInputService + VehicleSeat) ---
-- LocalScript inside VehicleSeat or StarterPlayerScripts

local seat = script.Parent -- or path to VehicleSeat
local uis = game:GetService('UserInputService')
local rs = game:GetService('RunService')

local throttle = 0
local steer = 0
local braking = false
local nitroActive = false

-- Keyboard input (for motorcycles/aircraft without VehicleSeat auto-input)
uis.InputBegan:Connect(function(input, gpe)
  if gpe then return end
  if input.KeyCode == Enum.KeyCode.W then throttle = 1 end
  if input.KeyCode == Enum.KeyCode.S then throttle = -1 end
  if input.KeyCode == Enum.KeyCode.A then steer = -1 end
  if input.KeyCode == Enum.KeyCode.D then steer = 1 end
  if input.KeyCode == Enum.KeyCode.Space then braking = true end
  if input.KeyCode == Enum.KeyCode.LeftShift then nitroActive = true end
end)

uis.InputEnded:Connect(function(input, gpe)
  if input.KeyCode == Enum.KeyCode.W or input.KeyCode == Enum.KeyCode.S then throttle = 0 end
  if input.KeyCode == Enum.KeyCode.A or input.KeyCode == Enum.KeyCode.D then steer = 0 end
  if input.KeyCode == Enum.KeyCode.Space then braking = false end
  if input.KeyCode == Enum.KeyCode.LeftShift then nitroActive = false end
end)

-- VehicleSeat read (use seat values for ground vehicles):
rs.Heartbeat:Connect(function(dt)
  local t = seat.Throttle -- -1, 0, 1
  local s = seat.Steer   -- -1, 0, 1
  -- drive wheels:
  for _, cyl in pairs(driveConstraints) do
    cyl.AngularVelocity = t * maxWheelRPS
  end
  -- steering:
  for _, hinge in pairs(steerConstraints) do
    hinge.TargetAngle = s * maxSteerAngle
  end
end)

--- ACCELERATION & BRAKING ---
-- Smooth acceleration curve (LocalScript):
local currentSpeed = 0
local targetSpeed = 0
local acceleration = 15  -- studs/s^2
local deceleration = 25  -- braking deceleration
local maxSpeed = 100
local reverseMax = 30
local nitroMultiplier = 1.6

rs.Heartbeat:Connect(function(dt)
  local input = seat.Throttle
  if braking then
    currentSpeed = currentSpeed - deceleration * dt * math.sign(currentSpeed)
    if math.abs(currentSpeed) < 1 then currentSpeed = 0 end
  else
    targetSpeed = input * (nitroActive and maxSpeed * nitroMultiplier or maxSpeed)
    if input < 0 then targetSpeed = input * reverseMax end
    currentSpeed = currentSpeed + (targetSpeed - currentSpeed) * math.min(acceleration * dt / math.abs(targetSpeed - currentSpeed + 0.1), 1)
  end
  -- apply to bodyVelocity or wheel angular velocity
  local fwd = vehicle.CFrame.LookVector
  bodyVelocity.VectorVelocity = fwd * currentSpeed
end)

--- DASHBOARD UI (ScreenGui / SurfaceGui) ---
-- Speedometer (circular or digital):
-- Place SurfaceGui on dashboard Part, Face=Front
-- TextLabel 'Speed' center large font
-- ImageLabel arc needle
rs.Heartbeat:Connect(function()
  local speed = math.floor(vehicle.AssemblyLinearVelocity.Magnitude * 3.6) -- convert to kph
  speedLabel.Text = tostring(speed) .. ' KPH'
  -- rotate needle: needleFrame.Rotation = -120 + (speed / maxSpeedKPH) * 240
  needleFrame.Rotation = -120 + math.clamp(speed / maxSpeedKPH, 0, 1) * 240
  -- RPM gauge: rpmLabel.Text = tostring(math.floor(currentRPM))
end)

--- FUEL SYSTEM ---
-- Server script:
local fuel = 100      -- percent
local fuelBurnRate = 0.8   -- percent per second at full throttle
local fuelRefillRate = 20  -- percent per second at fuel station

rs.Heartbeat:Connect(function(dt)
  if seat.Occupant and fuel > 0 then
    fuel = math.max(0, fuel - math.abs(seat.Throttle) * fuelBurnRate * dt)
    if fuel <= 0 then
      -- cut engine
      for _, cyl in pairs(driveConstraints) do
        cyl.AngularVelocity = 0
        cyl.MotorMaxTorque = 0
      end
      fuelEmptyEvent:FireAllClients()
    end
  end
  -- UI update via RemoteEvent to client
  fuelUpdateEvent:FireClient(seat.Occupant and seat.Occupant.Parent, fuel)
end)

-- Fuel bar UI (LocalScript):
fuelUpdateEvent.OnClientEvent:Connect(function(amount)
  fuelBarFrame.Size = UDim2.new(amount/100, 0, 1, 0)
  fuelBarFrame.BackgroundColor3 = amount > 25 and Color3.fromRGB(0,200,80) or Color3.fromRGB(220,40,0)
  fuelLabel.Text = math.floor(amount) .. '%'
end)

--- NITRO SYSTEM ---
local nitroCharge = 100
local nitroDeplete = 25   -- per second when active
local nitroRecharge = 8   -- per second when inactive

rs.Heartbeat:Connect(function(dt)
  if nitroActive and nitroCharge > 0 and seat.Throttle > 0 then
    nitroCharge = math.max(0, nitroCharge - nitroDeplete * dt)
    -- visual: exhaust neon glow bright blue
    exhaustNeon.Color = Color3.fromRGB(0, 100, 255)
    exhaustNeon.Transparency = 0.1
  else
    nitroCharge = math.min(100, nitroCharge + nitroRecharge * dt)
    exhaustNeon.Color = Color3.fromRGB(255, 80, 20)
    exhaustNeon.Transparency = 0.4
  end
  nitroBarFrame.Size = UDim2.new(nitroCharge/100, 0, 1, 0)
end)

--- VEHICLE DAMAGE SYSTEM ---
-- Server script with collision detection:
local maxHealth = 100
local vehicleHealth = maxHealth
local damagedAt = 0

local function onCollision(hit)
  local collisionSpeed = vehicle.AssemblyLinearVelocity.Magnitude
  if collisionSpeed > 20 and tick() - damagedAt > 0.5 then
    damagedAt = tick()
    local dmg = (collisionSpeed - 20) * 1.5
    vehicleHealth = math.max(0, vehicleHealth - dmg)
    -- visual damage: smoke Part transparency decreases
    smokeEmitter.Enabled = vehicleHealth < 50
    firePart.Enabled = vehicleHealth < 20
    -- health UI update
    healthUpdateEvent:FireAllClients(vehicleHealth / maxHealth)
    if vehicleHealth <= 0 then
      -- destroy vehicle explosion effect then remove
      explosionEffect:Fire(vehicle.PrimaryPart.Position)
      task.wait(0.5)
      vehicle:Destroy()
    end
  end
end

vehicle.PrimaryPart.Touched:Connect(onCollision)

--- PASSENGER SYSTEM ---
-- Multiple seat parts (Seat or VehicleSeat):
-- Mark first seat as driver VehicleSeat, rest as Seat
-- RemoteEvent for enterVehicle / exitVehicle

local passengerSeats = {}
for _, part in pairs(vehicle:GetDescendants()) do
  if part:IsA('Seat') and not part:IsA('VehicleSeat') then
    table.insert(passengerSeats, part)
  end
end

-- Detect passengers:
rs.Heartbeat:Connect(function()
  local count = 0
  for _, s in pairs(passengerSeats) do
    if s.Occupant then count = count + 1 end
  end
  passengerCountLabel.Text = 'Passengers: ' .. count
end)

--- HORN / SIREN SOUNDS ---
-- Sound in PrimaryPart:
local hornSound = Instance.new('Sound', vehicle.PrimaryPart)
hornSound.SoundId = 'rbxassetid://HORN_ID'
hornSound.RollOffMaxDistance = 80
hornSound.Volume = 1

local sirenSound = Instance.new('Sound', vehicle.PrimaryPart)
sirenSound.SoundId = 'rbxassetid://SIREN_ID'
sirenSound.Looped = true
sirenSound.RollOffMaxDistance = 150

uis.InputBegan:Connect(function(input, gpe)
  if input.KeyCode == Enum.KeyCode.H then hornSound:Play() end
  if input.KeyCode == Enum.KeyCode.L then
    if sirenSound.Playing then sirenSound:Stop() else sirenSound:Play() end
  end
end)

--- ENGINE SOUND SYSTEM ---
local engineIdle = Instance.new('Sound', vehicle.PrimaryPart)
engineIdle.SoundId = 'rbxassetid://ENGINE_ID'
engineIdle.Looped = true
engineIdle.Volume = 0.5
engineIdle:Play()

rs.Heartbeat:Connect(function()
  local speedRatio = math.clamp(currentSpeed / maxSpeed, 0, 1)
  engineIdle.Pitch = 0.8 + speedRatio * 1.4  -- pitch rises with speed
  engineIdle.Volume = 0.4 + speedRatio * 0.6
end)

--- CAMERA MODES ---
-- LocalScript camera control:
local cam = workspace.CurrentCamera
local cameraMode = 'thirdPerson'  -- 'thirdPerson', 'firstPerson', 'topDown'
local camOffset = Vector3.new(0, 8, 20)  -- third person offset

uis.InputBegan:Connect(function(input)
  if input.KeyCode == Enum.KeyCode.C then
    if cameraMode == 'thirdPerson' then cameraMode = 'firstPerson'
    elseif cameraMode == 'firstPerson' then cameraMode = 'topDown'
    else cameraMode = 'thirdPerson' end
  end
end)

rs.RenderStepped:Connect(function()
  if cameraMode == 'thirdPerson' then
    cam.CFrame = CFrame.new(vehicle.PrimaryPart.Position + vehicle.PrimaryPart.CFrame:VectorToWorldSpace(camOffset), vehicle.PrimaryPart.Position)
  elseif cameraMode == 'firstPerson' then
    local driverEye = vehicle.PrimaryPart.CFrame * CFrame.new(0, 2.5, -3)
    cam.CFrame = driverEye
  elseif cameraMode == 'topDown' then
    cam.CFrame = CFrame.new(vehicle.PrimaryPart.Position + Vector3.new(0, 40, 0), vehicle.PrimaryPart.Position)
  end
end)
`;

export const VEHICLE_TRANSPORT_BIBLE: string = `
${VEHICLE_CARS}

${VEHICLE_BOATS}

${VEHICLE_AIRCRAFT}

${VEHICLE_TRAINS}

${VEHICLE_PHYSICS}

${VEHICLE_SCRIPTING}

=== END VEHICLE TRANSPORT BIBLE ===
Total vehicles: 19 (10 cars + 6 boats + 6 aircraft + 5 train types)
Total station: 1 full station build
Physics: wheel/steering/suspension/buoyancy/flight/train constraints
Scripting: input/accel/braking/fuel/nitro/damage/passengers/sound/camera
`;
