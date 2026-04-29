// vehicle-transport-bible.ts
// AI knowledge bible for building vehicles and transport systems in Roblox
// All API properties are real. No SmoothPlastic. Dimensions in studs. Colors as RGB.

export const VEHICLE_CARS: string = `
=== CARS COMPLETE CONSTRUCTION KNOWLEDGE ===

--- SEDAN (25 parts) ---
Dimensions: 12 studs long, 5 studs wide, 4 studs tall
Color palette: RGB(30,30,35) dark charcoal / RGB(220,50,50) red / RGB(20,60,140) navy

PART LIST:
1. MainBody (primary chassis reference part)
   Size: Vector3.new(12, 1.5, 5)
   Material: Enum.Material.Metal
   CFrame: world origin reference

2. Hood (front upper panel)
   Size: Vector3.new(3.5, 0.3, 4.8)
   Material: Enum.Material.Metal
   Offset: Vector3.new(3.5, 1.1, 0) from MainBody
   Angle: CFrame.Angles(math.rad(-5), 0, 0)

3. Trunk (rear upper panel)
   Size: Vector3.new(2.5, 0.3, 4.8)
   Material: Enum.Material.Metal
   Offset: Vector3.new(-3.8, 1.1, 0)
   Angle: CFrame.Angles(math.rad(5), 0, 0)

4. RoofPanel
   Size: Vector3.new(4, 0.25, 4.6)
   Material: Enum.Material.Metal
   Offset: Vector3.new(0, 2.2, 0)

5. FrontBumper
   Size: Vector3.new(0.4, 1.2, 5)
   Material: Enum.Material.Concrete
   Color: RGB(40,40,40)
   Offset: Vector3.new(6.2, -0.2, 0)

6. RearBumper
   Size: Vector3.new(0.4, 1.2, 5)
   Material: Enum.Material.Concrete
   Color: RGB(40,40,40)
   Offset: Vector3.new(-6.2, -0.2, 0)

7-10. Wheels (4 total)
   SpecialMesh MeshType.Cylinder
   Size: Vector3.new(1, 2.2, 2.2)
   Material: Enum.Material.Granite
   Color: RGB(25,25,25)
   Positions (offset from MainBody):
     FrontLeft:  Vector3.new(3.5, -1.2, 2.8)
     FrontRight: Vector3.new(3.5, -1.2, -2.8)
     RearLeft:   Vector3.new(-3.5, -1.2, 2.8)
     RearRight:  Vector3.new(-3.5, -1.2, -2.8)
   Each wheel needs CylindricalConstraint (see PHYSICS section)

11. Windshield
   Size: Vector3.new(0.2, 1.8, 4.4)
   Material: Enum.Material.Glass
   Transparency: 0.4
   Color: RGB(150,200,230)
   Offset: Vector3.new(2.2, 1.8, 0)
   Angle: CFrame.Angles(math.rad(-25), 0, 0)

12. RearWindow
   Size: Vector3.new(0.2, 1.4, 4.2)
   Material: Enum.Material.Glass
   Transparency: 0.4
   Offset: Vector3.new(-2.2, 1.8, 0)
   Angle: CFrame.Angles(math.rad(25), 0, 0)

13. LeftWindow
   Size: Vector3.new(3.8, 1.2, 0.15)
   Material: Enum.Material.Glass
   Transparency: 0.45
   Offset: Vector3.new(0, 1.8, 2.5)

14. RightWindow
   Size: Vector3.new(3.8, 1.2, 0.15)
   Material: Enum.Material.Glass
   Transparency: 0.45
   Offset: Vector3.new(0, 1.8, -2.5)

15. HeadlightLeft
   Size: Vector3.new(0.3, 0.6, 1.2)
   Material: Enum.Material.Neon
   Color: RGB(255,255,200)
   Offset: Vector3.new(6.1, 0.3, 1.5)

16. HeadlightRight
   Size: Vector3.new(0.3, 0.6, 1.2)
   Material: Enum.Material.Neon
   Color: RGB(255,255,200)
   Offset: Vector3.new(6.1, 0.3, -1.5)

17. TaillightLeft
   Size: Vector3.new(0.3, 0.5, 1.4)
   Material: Enum.Material.Neon
   Color: RGB(220,20,20)
   Offset: Vector3.new(-6.1, 0.3, 1.5)

18. TaillightRight
   Size: Vector3.new(0.3, 0.5, 1.4)
   Material: Enum.Material.Neon
   Color: RGB(220,20,20)
   Offset: Vector3.new(-6.1, 0.3, -1.5)

19. MirrorLeft
   Size: Vector3.new(0.8, 0.4, 0.15)
   Material: Enum.Material.Metal
   Offset: Vector3.new(2.5, 1.4, 2.65)

20. MirrorRight
   Size: Vector3.new(0.8, 0.4, 0.15)
   Material: Enum.Material.Metal
   Offset: Vector3.new(2.5, 1.4, -2.65)

21. DriverDoor
   Size: Vector3.new(2.8, 1.6, 0.2)
   Material: Enum.Material.Metal
   Offset: Vector3.new(0.5, 0.8, 2.52)
   HingeConstraint on front edge for door open animation

22. PassengerDoor
   Size: Vector3.new(2.8, 1.6, 0.2)
   Material: Enum.Material.Metal
   Offset: Vector3.new(0.5, 0.8, -2.52)

23. DriverSeat (VehicleSeat instance)
   MaxSpeed: 60
   Torque: 20
   TurnSpeed: 1.5
   HeadsUpDisplay: false
   Offset: Vector3.new(0.5, 1.2, 1.5)

24. SteeringWheel
   Size: Vector3.new(0.1, 1.4, 1.4)
   Material: Enum.Material.Metal
   Color: RGB(20,20,20)
   SpecialMesh MeshType.Cylinder Scale Vector3.new(0.1, 1, 1)
   Offset: Vector3.new(2.0, 1.5, 1.5)

25. ExhaustPipe
   Size: Vector3.new(1.2, 0.2, 0.2)
   Material: Enum.Material.Metal
   Color: RGB(80,80,80)
   Offset: Vector3.new(-6.0, -0.5, 1.8)

WELD ALL PARTS to MainBody using WeldConstraint:
  local weld = Instance.new("WeldConstraint")
  weld.Part0 = mainBody
  weld.Part1 = part
  weld.Parent = mainBody

--- SPORTS CAR (30 parts) ---
Dimensions: 11 studs long, 5 studs wide, 3 studs tall (lower profile)
Color palette: RGB(180,0,0) Ferrari red / RGB(255,220,0) yellow / RGB(10,10,10) carbon black

Body 20% lower than sedan. Hood slopes aggressively forward.
Additional parts beyond sedan base:
- SpoilerBase: Size Vector3.new(3, 0.15, 4.8), rear top of body, Metal
- SpoilerWing: Size Vector3.new(0.3, 1, 4.8), vertical blade on spoiler base, Metal
- AirIntakeLeft: Size Vector3.new(0.8, 0.4, 0.6), Concrete, front sides
- AirIntakeRight: mirror of AirIntakeLeft
- SideSkirtsLeft: Size Vector3.new(10, 0.3, 0.2), low on body sides, Metal
- SideSkirtsRight: mirror

Wheels: Size Vector3.new(1, 2.6, 2.6) — wider for grip look
VehicleSeat MaxSpeed: 120, Torque: 45, TurnSpeed: 2.0

--- PICKUP TRUCK (35 parts) ---
Dimensions: 15 studs long, 6 studs wide, 5 studs tall
Color palette: RGB(150,75,0) brown / RGB(60,90,60) army green / RGB(200,200,200) silver

Parts beyond sedan:
- TruckBed: Size Vector3.new(5, 1.2, 5.8), open top, rear half, Metal
- BedSideLeft: Size Vector3.new(5, 1.5, 0.2), tall wall on bed, Metal
- BedSideRight: mirror
- BedRearGate: Size Vector3.new(0.2, 1.5, 5.8), hinged at bottom, folds down
- CabinRoof: Size Vector3.new(5, 0.3, 5.8)
- TowHitch: Size Vector3.new(0.8, 0.4, 0.4), rear center, Metal
- Wheels offset Y -1.8 (higher ride height vs sedan -1.2)

VehicleSeat MaxSpeed: 55, Torque: 60, TurnSpeed: 1.2

--- SUV (32 parts) ---
Dimensions: 14 studs long, 6 studs wide, 5.5 studs tall
Color palette: RGB(40,40,40) black / RGB(255,255,255) white / RGB(80,120,80) forest green

Parts beyond sedan:
- TallRoof: Size Vector3.new(7, 0.3, 5.8) spanning most of vehicle
- RearHatch: Size Vector3.new(2, 0.25, 5.6), hinged top panel
- RoofRackBase: Size Vector3.new(6, 0.15, 4.5), flat on roof, Metal
- RoofRackBarFront: Size Vector3.new(0.1, 0.4, 4.5), crossbar
- RoofRackBarRear: mirror
- ThirdRowWindowLeft: Size Vector3.new(1.8, 1, 0.15)
- ThirdRowWindowRight: mirror
- RunningBoardLeft: Size Vector3.new(10, 0.3, 0.5), low side step
- RunningBoardRight: mirror

VehicleSeat MaxSpeed: 65, Torque: 50, TurnSpeed: 1.3

--- BUS (45 parts) ---
Dimensions: 24 studs long, 7 studs wide, 8 studs tall
Color palette: RGB(255,200,0) school yellow / RGB(255,140,0) city orange / RGB(200,200,200) silver metro

Structural parts:
- MainFrame: Size Vector3.new(24, 1, 7), bottom chassis, Metal
- BusBodyLeft: Size Vector3.new(22, 6, 0.3), tall side wall
- BusBodyRight: mirror
- BusRoof: Size Vector3.new(22, 0.3, 6.8)
- FrontFace: Size Vector3.new(0.4, 7, 7), flat front
- RearFace: mirror
- FrontWindshield: Size Vector3.new(0.2, 3.5, 6), Glass, Transparency 0.35
- SideWindows (8 per side, 16 total): Size Vector3.new(2, 1.8, 0.15), evenly spaced
- FrontDoor: Size Vector3.new(0.2, 5, 1.8), hinged
- RearEmergencyDoor: Size Vector3.new(0.2, 5, 2.5)
- DriverPartition: Size Vector3.new(0.15, 5, 6.5), Metal
- Wheels: 6 total — 2 front steering, 4 rear (dual axle, paired)
  DualRearLeftInner, DualRearLeftOuter, DualRearRightInner, DualRearRightOuter
  Each rear pair offset 0.7 studs apart on Z axis
- PassengerSeats (12): Seat instances NOT VehicleSeat, spaced 2 studs apart both sides

VehicleSeat MaxSpeed: 40, Torque: 120, TurnSpeed: 0.6

--- MONSTER TRUCK (28 parts) ---
Dimensions: 12 studs long, 8 studs wide, 8 studs tall with wheels
Color palette: RGB(20,80,20) toxic green / RGB(180,30,0) fire red / RGB(255,140,0) orange

- BodyChassis: Size Vector3.new(10, 2, 7), high off ground, Metal
- RollCageBars (8): Size Vector3.new(0.3, 4, 0.3) each, arching over cab, Metal, RGB(200,200,200)
- GiantWheels (4): Size Vector3.new(1.5, 5, 5), Granite material
- SuspensionArmLeft (front): Size Vector3.new(3, 0.3, 0.3), Metal
- SuspensionArmLeft (rear): same
- SuspensionArmRight (front/rear): mirrors
- ExhaustStackLeft: Size Vector3.new(0.4, 3, 0.4), tall vertical rear pipe, Metal
- ExhaustStackRight: mirror
- SkidPlate: Size Vector3.new(10, 0.4, 7), underbody armor, Metal, RGB(80,80,80)
- Headlights (4): two stacked pairs front, Neon material
Wheels at Y offset -3.5 from body center

VehicleSeat MaxSpeed: 35, Torque: 200, TurnSpeed: 0.8

--- GO-KART (18 parts) ---
Dimensions: 5 studs long, 3 studs wide, 1.5 studs tall
Color palette: RGB(255,50,50) / RGB(255,220,0) / RGB(0,120,255)

- Frame: Size Vector3.new(5, 0.3, 3), tube frame look, Metal
- VehicleSeat: Size Vector3.new(1.5, 1, 1.5), low bucket style
- SteeringColumn: Size Vector3.new(0.1, 0.8, 0.1), vertical, Metal
- HandlebarsLeft: Size Vector3.new(1, 0.1, 0.1)
- HandlebarsRight: mirror
- Wheels (4): Size Vector3.new(0.5, 1.2, 1.2)
- NoseWing: Size Vector3.new(2, 0.15, 3.2), flat front wing, Metal
- RearWingPost: Size Vector3.new(0.2, 1, 0.2), vertical
- RearWingPlane: Size Vector3.new(1.5, 0.15, 3.2), horizontal on top of post
- SideBarLeft: Size Vector3.new(4.5, 0.3, 0.15), crash protection
- SideBarRight: mirror
- EngineBlock: Size Vector3.new(1, 0.8, 1.5), rear, Metal, RGB(60,60,60)

VehicleSeat MaxSpeed: 80, Torque: 30, TurnSpeed: 2.5

--- MOTORCYCLE (20 parts) ---
Dimensions: 6 studs long, 1.5 studs wide, 4 studs tall
Color palette: RGB(10,10,10) black / RGB(180,0,0) red / RGB(200,180,0) gold

- MainFrame: Size Vector3.new(5, 0.3, 0.5), backbone, Metal
- FrontForkLeft: Size Vector3.new(0.2, 2.5, 0.2), angled forward
- FrontForkRight: offset 0.3 studs Z
- FrontWheel: Size Vector3.new(0.4, 2, 2), Granite
- RearWheel: Size Vector3.new(0.4, 2.2, 2.2)
- Engine: Size Vector3.new(1.5, 1.2, 1), center, Metal, RGB(80,80,80)
- FuelTank: Size Vector3.new(1.8, 0.8, 1.2), above engine, SpecialMesh rounded
- VehicleSeat: Size Vector3.new(2, 0.4, 0.8), flat low
- Handlebars: Size Vector3.new(0.15, 0.1, 1.6), horizontal, Metal
- HeadlightFront: Size Vector3.new(0.3, 0.6, 0.6), Neon, SpecialMesh Sphere
- TaillightRear: Size Vector3.new(0.2, 0.4, 0.4), Neon RGB(220,20,20)
- ExhaustLeft: Size Vector3.new(2, 0.2, 0.2), low sweep, Metal
- ExhaustRight: parallel, offset 0.3 studs
- FootpegFrontLeft: Size Vector3.new(0.8, 0.1, 0.1)
- FootpegFrontRight: mirror
- FootpegRearLeft: mirror
- FootpegRearRight: mirror
- FenderFront: Size Vector3.new(1.5, 0.2, 0.8), above front wheel
- FenderRear: Size Vector3.new(1.8, 0.2, 0.8)
- Windscreen: Size Vector3.new(0.1, 1, 0.8), Glass, Transparency 0.4

VehicleSeat MaxSpeed: 100, Torque: 35, TurnSpeed: 2.2

--- TANK (50 parts) ---
Dimensions: 18 studs long, 8 studs wide, 6 studs tall hull only
Color palette: RGB(80,90,50) olive drab / RGB(60,70,40) dark green / RGB(100,100,60) desert tan

- Hull: Size Vector3.new(18, 2, 8), Metal, olive
- HullFrontSlope: Size Vector3.new(3, 2.5, 8), angled 45 degrees
- HullRearPlate: Size Vector3.new(2, 2.5, 8), rear angled
- Turret: Size Vector3.new(5, 1.5, 5), Metal — HingeConstraint to hull for rotation
- TurretTop: Size Vector3.new(4, 0.3, 4)
- MainGun: Size Vector3.new(8, 0.6, 0.6), Cylinder, extends from turret front
- GunMantlet: Size Vector3.new(1, 1.5, 2), armored gun shield
- CommanderHatch: Size Vector3.new(1.5, 0.2, 1.5), top of turret
- HatchHandle: Size Vector3.new(0.5, 0.3, 0.1)
- TracksLeft (8 visual link parts): Size Vector3.new(16, 0.8, 1.5), Concrete
- TracksRight: mirror
- RoadWheelLeft (5): Size Vector3.new(0.8, 1.8, 1.8), Metal
- RoadWheelRight: mirror
- DriveWheelFrontLeft: Size Vector3.new(0.8, 2, 2)
- DriveWheelFrontRight: mirror
- IdlerWheelRearLeft: Size Vector3.new(0.8, 2, 2)
- IdlerWheelRearRight: mirror
- ExhaustGrille: Size Vector3.new(2, 1, 6), rear top, Concrete
- AntennaBase: Size Vector3.new(0.3, 0.3, 0.3)
- AntennaRod: Size Vector3.new(0.1, 4, 0.1)
- SideSkirtLeft (4 plates): Size Vector3.new(4, 1.2, 0.3), Metal
- SideSkirtRight: mirror

VehicleSeat MaxSpeed: 25, Torque: 400, TurnSpeed: 0.5
Turret HingeConstraint: ActuatorType.Motor, MotorMaxAcceleration for script control

--- RACING CAR Formula style (28 parts) ---
Dimensions: 13 studs long, 6 studs wide with wings, 2.5 studs tall
Color palette: RGB(0,0,200) blue / RGB(255,255,255) white / RGB(255,50,50) red

- MonocoqueBody: Size Vector3.new(10, 1.2, 2), Metal
- Nose: Size Vector3.new(3, 0.6, 1.5), pointed, Metal
- FrontWing: Size Vector3.new(0.15, 0.5, 5.5), low horizontal, Metal
- FrontWingEndplateLeft: Size Vector3.new(0.15, 0.8, 0.8), vertical fin
- FrontWingEndplateRight: mirror
- RearWingMainPlane: Size Vector3.new(0.15, 0.8, 5), high rear
- RearWingDRS: Size Vector3.new(0.15, 0.5, 4.8), second plane above main
- RearWingEndplateLeft: Size Vector3.new(0.15, 1.8, 0.8)
- RearWingEndplateRight: mirror
- Cockpit: Size Vector3.new(2, 1.2, 1.8), open top
- Halo: Size Vector3.new(2.5, 0.3, 0.15), safety arch over cockpit, Metal
- SidepodLeft: Size Vector3.new(4, 1, 1.2), radiator housing
- SidepodRight: mirror
- Wheels (4): Size Vector3.new(0.8, 2.8, 2.8), wide slick tires, Granite
- SuspensionRods (8): Size Vector3.new(1.5, 0.1, 0.1), thin arms

VehicleSeat MaxSpeed: 200, Torque: 80, TurnSpeed: 2.8

--- POLICE CAR (sedan + 8 extra parts) ---
Same 25-part sedan base plus:
- LightBarBase: Size Vector3.new(4, 0.3, 1.5), roof center, Metal, RGB(40,40,40)
- LightBarRedLeft: Size Vector3.new(1.5, 0.5, 1.3), Neon RGB(255,0,0)
- LightBarBlueRight: Size Vector3.new(1.5, 0.5, 1.3), Neon RGB(0,100,255)
- PushBumper: Size Vector3.new(0.8, 1.5, 5), reinforced front, Metal, RGB(60,60,60)
- DoorShieldLeft: Size Vector3.new(0.3, 0.8, 2), door exterior, Metal
- DoorShieldRight: mirror
- Spotlight: Size Vector3.new(0.4, 0.4, 0.4), Neon white, driver A-pillar
- NumberPlateFront: Size Vector3.new(0.1, 0.8, 1.8), Concrete, white

VehicleSeat MaxSpeed: 75, Torque: 35, TurnSpeed: 1.8

--- AMBULANCE van style (38 parts) ---
Dimensions: 16 studs long, 6 studs wide, 7 studs tall
Color palette: RGB(255,255,255) white / RGB(255,160,0) amber / RGB(255,0,0) red / RGB(0,120,255) blue

- VanBody: Size Vector3.new(16, 4, 6), Metal, white
- RearDoorsLeft: Size Vector3.new(0.2, 3.5, 2.5), double swing
- RearDoorsRight: mirror
- LightBarTop: Size Vector3.new(5, 0.6, 2), roof, Metal
- RedLightA: Size Vector3.new(0.8, 0.4, 1.8), Neon RGB(255,0,0)
- RedLightB: same, offset
- RedLightC: same
- BlueLightA: Size Vector3.new(0.8, 0.4, 1.8), Neon RGB(0,80,255)
- BlueLightB: same
- BlueLightC: same
- CrossVertical: Size Vector3.new(0.1, 1.2, 0.4), Neon RGB(255,0,0), front door
- CrossHorizontal: Size Vector3.new(0.1, 0.4, 1.2), Neon RGB(255,0,0)
- SideStripeLeft: Size Vector3.new(14, 0.5, 0.1), orange/red stripe, Metal
- SideStripeRight: mirror
- SirenSpeakerLeft: Size Vector3.new(0.5, 0.5, 1), front roof corner, Metal
- SirenSpeakerRight: mirror
- Wheels: 4 standard, Size Vector3.new(1, 2, 2), Granite

VehicleSeat MaxSpeed: 60, Torque: 40, TurnSpeed: 1.4
`;

export const VEHICLE_BOATS: string = `
=== BOATS COMPLETE CONSTRUCTION KNOWLEDGE ===

--- ROWBOAT (12 parts) ---
Dimensions: 8 studs long, 3 studs wide, 2 studs tall
Color palette: RGB(140,90,40) wood brown / RGB(200,160,100) light wood / RGB(80,60,30) dark oak

- HullBottom: Size Vector3.new(8, 0.4, 3), Wood, RGB(140,90,40)
- HullSideLeft: Size Vector3.new(7.5, 1.5, 0.4), angled outward CFrame.Angles(0,0,math.rad(-8))
- HullSideRight: mirror, CFrame.Angles(0,0,math.rad(8))
- HullBow: Size Vector3.new(0.6, 1.5, 3), pointed front cap
- HullStern: Size Vector3.new(0.6, 1.5, 3), flat rear cap
- SeatCenter: Size Vector3.new(0.3, 0.4, 2.8), center thwart, Wood
- SeatFront: same, offset 2 studs forward
- OarLockLeft: Size Vector3.new(0.2, 0.5, 0.2), Metal, on hull rim
- OarLockRight: mirror
- OarLeft: handle Size Vector3.new(6, 0.2, 0.2) + blade Size Vector3.new(1.5, 0.1, 0.6), Wood
- OarRight: mirror

Movement: BodyVelocity for thrust, BodyAngularVelocity for turning
No VehicleSeat needed — use ProximityPrompt and script for rowing

--- SPEEDBOAT (22 parts) ---
Dimensions: 14 studs long, 5 studs wide, 3 studs tall
Color palette: RGB(255,255,255) white fiberglass / RGB(255,140,0) orange / RGB(10,10,60) navy

- HullMain: Size Vector3.new(14, 1.5, 5), Plastic, white
- HullVeeLeft: Size Vector3.new(13, 0.8, 2.2), angled CFrame.Angles(math.rad(20),0,0)
- HullVeeRight: mirror
- HullBow: Size Vector3.new(2, 2, 5), raised bow
- Windscreen: Size Vector3.new(0.2, 1.2, 3.5), Glass, Transparency 0.35
- Deck: Size Vector3.new(10, 0.3, 4.8), Plastic, white
- DriverConsole: Size Vector3.new(1.5, 1.5, 1.8), Metal
- SteeringWheel: Size Vector3.new(0.1, 1, 1), thin disk
- DriverSeat: VehicleSeat, MaxSpeed 90, Torque 60, TurnSpeed 2.0
- PassengerSeatLeft: Seat instance
- PassengerSeatRight: Seat instance
- EngineHatch: Size Vector3.new(3, 0.3, 4), rear deck, Metal
- OutboardMotorLeft: Size Vector3.new(0.8, 2.5, 0.8), stern, Metal, RGB(80,80,80)
- OutboardMotorRight: mirror
- PropellerHub: Size Vector3.new(0.3, 0.2, 1.4), Cylinder, Metal
- NavLightGreen: Size Vector3.new(0.2, 0.3, 0.2), Neon RGB(0,200,0), starboard
- NavLightRed: Size Vector3.new(0.2, 0.3, 0.2), Neon RGB(200,0,0), port
- MastLight: Size Vector3.new(0.2, 0.4, 0.2), Neon RGB(255,255,255)
- TowerLeft: Size Vector3.new(0.3, 3, 0.3), angled, Metal
- TowerRight: mirror
- TowerCrossbar: Size Vector3.new(0.3, 0.3, 4)
- WakeBoardBar: Size Vector3.new(3, 0.3, 0.3), horizontal top of tower

Buoyancy: BodyForce upward = assemblyMass * workspace.Gravity * submersionRatio
BodyVelocity for forward thrust when throttle applied

--- YACHT (55 parts) ---
Dimensions: 30 studs long, 8 studs wide, 6 studs hull height, mast 20 studs
Color palette: RGB(255,255,255) white / RGB(200,180,150) teak / RGB(30,30,80) navy trim

Hull:
- HullMain: Size Vector3.new(30, 3, 8), Plastic, white
- Keel: Size Vector3.new(6, 4, 1.5), below hull center, Metal, ballast
- BowSprit: Size Vector3.new(4, 0.3, 0.3), extending forward, Metal
- SternTransom: Size Vector3.new(0.5, 4, 8), vertical rear wall
- Rudder: Size Vector3.new(0.3, 3, 1.5), below waterline rear, Metal

Deck:
- MainDeck: Size Vector3.new(26, 0.4, 7.5), Wood, teak color
- CockpitWellFront: Size Vector3.new(6, 1, 0.3), rear depression wall
- CockpitWellRear: same
- CockpitWellLeft: Size Vector3.new(0.3, 1, 3)
- CockpitWellRight: mirror
- HelmWheel: Size Vector3.new(0.3, 1.8, 1.8), Metal
- CabinHouseTop: Size Vector3.new(10, 0.5, 5.5)
- CabinHouseLeft: Size Vector3.new(10, 1.8, 0.4)
- CabinHouseRight: mirror
- PortlightWindow (6): Size Vector3.new(0.15, 0.5, 0.8), Glass, Transparency 0.3
- AnchorFore: Size Vector3.new(0.4, 1.5, 0.8), Metal

Rigging:
- MainMast: Size Vector3.new(0.4, 20, 0.4), Metal, RGB(200,200,200)
- MainBoom: Size Vector3.new(12, 0.3, 0.3), horizontal
- MainSail: Size Vector3.new(0.1, 14, 10), Plastic, Transparency 0.1, white
- JibSail: Size Vector3.new(0.1, 12, 6), forward triangle
- Shroud (4): Size Vector3.new(0.1, 0.1, 10), angled stays, Metal
- ForestayWire: Size Vector3.new(0.1, 0.1, 12), from masthead to bow, Metal

--- PIRATE SHIP (80 parts) ---
Dimensions: 35 studs long, 10 studs wide, 8 studs hull height, tallest mast 35 studs
Color palette: RGB(80,50,20) aged wood / RGB(160,120,60) light oak / RGB(40,40,40) black sails

Hull:
- HullPort: Size Vector3.new(33, 6, 0.5), angled outward, Wood
- HullStarboard: mirror
- HullBottom: Size Vector3.new(32, 1, 10), Wood
- BowFigurehead: Size Vector3.new(3, 4, 2), carved prow, Wood
- SternCastleDeck: Size Vector3.new(8, 0.4, 10)
- SternCastleRear: Size Vector3.new(8, 4, 0.4)
- SternCastleSideLeft: Size Vector3.new(8, 4, 0.3)
- SternCastleSideRight: mirror
- ForecastlePlatform: Size Vector3.new(6, 0.4, 10)
- ForecastleRailingFront: Size Vector3.new(0.15, 1.5, 10)
- ForecastleRailingLeft: Size Vector3.new(0.15, 1.5, 5)
- ForecastleRailingRight: mirror
- MainDeck: Size Vector3.new(20, 0.4, 9.8)
- GunPortLeft (8): Size Vector3.new(0.5, 0.8, 0.8), holes in port side hull
- GunPortRight (8): mirror
- Cannon (8): Size Vector3.new(3, 0.6, 0.6), Cylinder, Metal, RGB(40,40,40)
- CannonWheels (4 per cannon x 8 = 32): Size Vector3.new(0.3, 0.5, 0.5), Wood
- AnchorChain: Size Vector3.new(0.3, 0.3, 6), Metal
- Rudder: Size Vector3.new(0.4, 5, 2.5), rear below waterline, Wood
- HelmWheel: Size Vector3.new(0.3, 2.5, 2.5), spoked, Metal

3 Masts:
- ForeMast: Size Vector3.new(0.5, 28, 0.5), 30% from bow, Metal
- MainMast: Size Vector3.new(0.6, 35, 0.6), center
- MizzenMast: Size Vector3.new(0.4, 22, 0.4), 80% toward stern
- CrossYards (9 total, 3 per mast): Size Vector3.new(0.3, 0.3, 10) each
- Sails (6 square): Size Vector3.new(0.1, 12, 10), Plastic, black or canvas
- JibSails (2): triangular, forward angled
- RiggingLines (12): Size Vector3.new(0.1, 0.1, 8), Metal, thin

--- SUBMARINE (30 parts) ---
Dimensions: 20 studs long, 4 studs wide, 4 studs tall
Color palette: RGB(40,60,40) military green / RGB(60,80,60) medium green / RGB(200,200,200) silver

- PressureHull: Size Vector3.new(18, 4, 4), SpecialMesh Cylinder, Metal
- BowCap: Size Vector3.new(3, 4, 4), SpecialMesh Sphere scaled Vector3.new(0.3, 1, 1)
- SternCap: mirror rear
- ConningTower: Size Vector3.new(3, 3, 2), top center, Metal
- ConningTowerTop: Size Vector3.new(2.5, 0.4, 1.8)
- Periscope: Size Vector3.new(0.2, 4, 0.2), extends up from tower
- RudderVertical: Size Vector3.new(0.3, 2, 1), rear, Metal
- RudderHorizontalLeft: Size Vector3.new(0.3, 0.8, 2)
- RudderHorizontalRight: mirror
- BowPlaneLeft: Size Vector3.new(0.3, 0.6, 2), forward diving planes
- BowPlaneRight: mirror
- PropellerHub: Size Vector3.new(0.6, 0.6, 0.6), rear center, Cylinder
- PropellerBlade (4): Size Vector3.new(0.2, 1.8, 0.5), Metal, twisted blades
- TorpedoTube (2): Size Vector3.new(1, 0.5, 0.5), front circular openings
- BallastVent (4): Size Vector3.new(0.3, 0.3, 0.3), top hull hatches
- HullRib (4): Size Vector3.new(0.3, 4.2, 4.2), Cylinder mesh frames, Metal

Dive: BodyForce counteracts gravity for neutral buoyancy
Vertical control: BodyVelocity Y axis for dive/surface
Orientation: BodyGyro locked to diving angle

--- FISHING BOAT (25 parts) ---
Dimensions: 12 studs long, 4 studs wide, 3 studs tall
Color palette: RGB(200,200,200) weathered white / RGB(160,100,40) wood / RGB(80,80,80) gray

- HullMain: Size Vector3.new(12, 2, 4), Plastic, weathered white
- CabinBox: Size Vector3.new(5, 3, 3.8), Plastic
- CabinRoof: Size Vector3.new(5.5, 0.4, 4)
- CabinWindowFront: Size Vector3.new(0.15, 1, 1.2), Glass
- CabinWindowLeft: same
- CabinWindowRight: same
- CabinWindowRear: same
- OutriggerBoomLeft: Size Vector3.new(10, 0.2, 0.2), Wood
- OutriggerBoomRight: mirror
- FishingReelLeft: Size Vector3.new(0.5, 0.5, 0.5), Cylinder, Metal
- FishingReelRight: mirror
- NetBox: Size Vector3.new(3, 1, 3.5), rear deck, Wood, open top
- AnchorWinch: Size Vector3.new(1, 1, 0.8), Metal
- OutboardLeft: Size Vector3.new(0.8, 2, 0.6), stern, Metal
- OutboardRight: mirror
- LivewellHatch: Size Vector3.new(1.5, 0.3, 1.5), flush deck

--- CANOE (10 parts) ---
Dimensions: 10 studs long, 2 studs wide, 1.5 studs tall
Color palette: RGB(180,120,50) cedar / RGB(140,90,30) dark cedar

- HullBottom: Size Vector3.new(10, 0.3, 2), Wood
- HullSideLeft: Size Vector3.new(9.5, 1.2, 0.25), angled outward CFrame.Angles(0,0,math.rad(-12))
- HullSideRight: mirror
- BowRib: Size Vector3.new(0.3, 1.2, 2), pointed front
- SternRib: mirror rear
- CrossBraceFront: Size Vector3.new(0.2, 0.3, 2)
- CrossBraceRear: same
- PaddleLeft: handle Size Vector3.new(5, 0.15, 0.15) + blade Size Vector3.new(0.1, 1.5, 0.6), Wood
- PaddleRight: mirror
- ThwartSeat: Size Vector3.new(0.2, 0.3, 1.8), center crossbar
`;

export const VEHICLE_AIRCRAFT: string = `
=== AIRCRAFT COMPLETE CONSTRUCTION KNOWLEDGE ===

--- PROPELLER AIRPLANE (35 parts) ---
Dimensions: 20 studs long, 22 studs wingspan, 5 studs tall
Color palette: RGB(220,220,220) aluminum / RGB(30,100,180) blue livery / RGB(255,255,255) white

Fuselage:
- FuselageMain: Size Vector3.new(18, 3, 3), Metal
- NoseCone: Size Vector3.new(3, 2.5, 2.5), SpecialMesh Sphere scaled Vector3.new(0.5,1,1)
- TailCone: Size Vector3.new(4, 2, 2), tapers rearward
- CabinWindowLeft (6): Size Vector3.new(0.1, 0.8, 1), Glass, Transparency 0.3
- CabinWindowRight (6): mirror

Wings:
- MainWingLeft: Size Vector3.new(0.4, 0.8, 10), 5 degree dihedral up, Metal
- MainWingRight: mirror
- WingRootLeft: Size Vector3.new(0.5, 1.2, 2), thick wing-body junction
- WingRootRight: mirror
- AileronLeft: Size Vector3.new(0.3, 0.4, 3.5), trailing edge, HingeConstraint
- AileronRight: mirror

Tail:
- VerticalStabilizer: Size Vector3.new(0.4, 3, 2.5), top of tail
- Rudder: Size Vector3.new(0.3, 2.5, 1.5), hinged rear of vert stab
- HorizStabLeft: Size Vector3.new(0.4, 0.5, 3.5), horizontal tail
- HorizStabRight: mirror
- ElevatorLeft: Size Vector3.new(0.3, 0.3, 3), hinged trailing
- ElevatorRight: mirror

Engine:
- EngineNacelle: Size Vector3.new(2, 1.2, 1.2), front, Metal
- PropHub: Size Vector3.new(0.4, 0.4, 0.4), Cylinder
- PropBlade (3): Size Vector3.new(0.2, 4, 0.5), Metal, twisted

Landing gear:
- NoseGearStrut: Size Vector3.new(0.4, 2, 0.4), Metal
- NoseGearWheel: Size Vector3.new(0.4, 0.8, 0.8), Granite
- MainGearLeft: Size Vector3.new(0.4, 1.5, 0.4)
- MainGearRight: mirror
- MainWheelLeftA: Size Vector3.new(0.5, 1, 1)
- MainWheelLeftB: offset 0.5 studs inner
- MainWheelRightA: mirror
- MainWheelRightB: mirror

Flight physics summary:
  Forward: BodyVelocity = lookVector * throttleSpeed
  Orientation: BodyGyro points toward flightDirection
  Lift: BodyForce Y = mass * gravity * liftCoeff * (speed/stallSpeed)^2
  Stall: when speed < stallSpeed, liftCoeff drops to 0, gravity wins

--- HELICOPTER (32 parts) ---
Dimensions: 14 studs long, 3 studs wide, 5 studs tall, rotor 16 studs diameter
Color palette: RGB(40,80,40) military green / RGB(220,220,0) rescue yellow / RGB(40,40,40) black

Fuselage:
- FuselageMain: Size Vector3.new(10, 3.5, 3), Metal
- NoseBubble: Size Vector3.new(2.5, 2.5, 3), Glass, Transparency 0.25
- TailBoom: Size Vector3.new(7, 1, 1), extending rearward, Metal
- TailFin: Size Vector3.new(0.3, 2, 1), vertical at tail
- SkidLeft (2 tubes): Size Vector3.new(10, 0.3, 0.3), Y offset -2, Metal
- SkidRight: mirror
- CrossTubeLeft (2): Size Vector3.new(0.3, 1.8, 0.3), connecting skid to body
- CrossTubeRight: mirror
- EngineDecking: Size Vector3.new(3, 1.5, 3), top rear of cabin, Metal
- ExhaustStack: Size Vector3.new(0.4, 1.5, 0.4), Metal

Main rotor:
- RotorMast: Size Vector3.new(0.3, 1.5, 0.3), vertical above fuselage
- RotorHub: Size Vector3.new(0.6, 0.5, 0.6), Cylinder, top of mast
- RotorBlade (4): Size Vector3.new(0.3, 0.5, 7.5), Metal, 8 degree twist
  Placed 90 degrees apart: 0, 90, 180, 270 degrees
  Rotate via RunService.RenderStepped for visual spin

Tail rotor:
- TailRotorHub: Size Vector3.new(0.4, 0.4, 0.4), end of tail boom
- TailRotorBlade (4): Size Vector3.new(0.2, 0.3, 1.8), perpendicular to boom

Doors:
- SlideDoorsLeft: Size Vector3.new(0.2, 2.5, 2), TweenService for opening
- SlideDoorsRight: mirror

Flight control:
  Hover: BodyForce.Force = Vector3.new(0, totalMass * workspace.Gravity, 0)
  Vertical: separate BodyVelocity Y axis
  Lateral: BodyVelocity XZ plane based on cyclic tilt
  Yaw: BodyAngularVelocity Y axis = steerInput * yawRate
  Tilt: BodyGyro tilts entire body for direction of flight (pitch/roll inputs)

--- ROCKET (20 parts) ---
Dimensions: 3 studs wide, 20 studs tall
Color palette: RGB(220,220,220) white / RGB(200,50,50) red fins / RGB(80,80,80) metal

- UpperStage: Size Vector3.new(2.5, 5, 2.5), Cylinder mesh, Metal
- NoseCone: Size Vector3.new(3, 5, 3), SpecialMesh Sphere scaled Vector3.new(1,0.7,1)
- StageSeparationRing: Size Vector3.new(3.2, 0.4, 3.2), Cylinder, Metal
- MainBodyCylinder: Size Vector3.new(3, 12, 3), Cylinder mesh, Metal
- FinLeft: Size Vector3.new(0.3, 4, 2.5), angled 15 degrees outward, Red Metal
- FinRight: mirror opposite
- FinFront: perpendicular
- FinRear: perpendicular
- NozzleBottom: Size Vector3.new(1.8, 2, 1.8), Cylinder tapered, Metal, RGB(50,50,50)
- NozzleGlow: Size Vector3.new(1.2, 0.5, 1.2), Neon RGB(255,120,0), exhaust flame
- RCSLeft: Size Vector3.new(0.3, 0.3, 0.5), attitude thruster
- RCSRight: mirror
- RCSFront: perpendicular
- RCSRear: perpendicular
- GridFinLeft: Size Vector3.new(0.2, 1.5, 1.5), deployment fin upper, Metal
- GridFinRight: mirror
- GridFinFront: perpendicular
- GridFinRear: perpendicular
- LandingLeg (3): Size Vector3.new(0.2, 3, 0.2), TweenService extension
- LandingFootPad (3): Size Vector3.new(1, 0.2, 1), end of each leg

Ascent: increase BodyVelocity Y, BodyGyro holds upright
Gravity turn: tilt BodyGyro off vertical for arc trajectory
Stage separation: destroy WeldConstraints between stages

--- SPACESHIP SciFi (45 parts) ---
Dimensions: 20 studs long, 15 studs wide, 5 studs tall
Color palette: RGB(30,30,40) space black / RGB(0,180,255) blue neon / RGB(200,200,220) steel

Hull:
- PrimaryHull: Size Vector3.new(18, 3, 8), Metal, near black
- ForwardNacelle: Size Vector3.new(5, 2, 2), front center
- NacelleTip: Size Vector3.new(2, 1.5, 1.5), SpecialMesh Sphere
- BridgeSection: Size Vector3.new(4, 2.5, 5), raised mid-forward
- BridgeViewport: Size Vector3.new(3, 1.5, 4.5), Glass, Transparency 0.2

Wings (swept delta):
- WingLeft: Size Vector3.new(0.5, 0.5, 7), swept 45 degrees back, Metal
- WingRight: mirror
- WingletLeft: Size Vector3.new(0.3, 1.5, 0.5), angled up at tip
- WingletRight: mirror

Engine nacelles:
- NacelleLeft: Size Vector3.new(6, 1.5, 1.5), under rear left wing, Metal
- NacelleRight: mirror
- EngineGlowLeft: Size Vector3.new(1.2, 1.2, 0.3), Neon RGB(0,180,255), rear nacelle
- EngineGlowRight: mirror
- EngineRingLeftA: Size Vector3.new(1.6, 1.6, 0.15), Cylinder frame, Neon
- EngineRingLeftB: offset 0.2 studs, slightly smaller
- EngineRingRightA: mirror
- EngineRingRightB: mirror

Detail parts:
- AntennaArray: Size Vector3.new(0.1, 3, 0.1), top rear, Metal
- SensorDishBase: Size Vector3.new(0.4, 0.4, 0.4)
- SensorDish: Size Vector3.new(2, 0.3, 2), hemisphere, Metal
- LandingPadFront: Size Vector3.new(2, 0.3, 2)
- LandingPadRearLeft: same
- LandingPadRearRight: same
- GlowStripsLeft (3): Size Vector3.new(12, 0.15, 0.15), Neon RGB(0,180,255), hull underside
- GlowStripsRight: mirror
- ShieldBubble: Size Vector3.new(1, 1, 1), SpecialMesh Sphere, Neon, Transparency 0.8

--- HOT AIR BALLOON (18 parts) ---
Dimensions: 10 stud balloon diameter, basket 4x4x3, total 20 studs tall
Color palette: RGB(255,50,50) red / RGB(255,220,0) yellow / RGB(255,140,0) orange / RGB(30,100,200) blue

- BalloonMain: Size Vector3.new(10, 12, 10), SpecialMesh Sphere, Plastic, red
- BalloonStripeYellow (4): Size Vector3.new(1.5, 12, 0.5), inside balloon, yellow
- BalloonStripeBlue (4): same, blue
- BalloonOpening: Size Vector3.new(3, 2, 3), bottom opening, dark
- BurnerFrameBarA: Size Vector3.new(0.3, 1.5, 0.3), upright bar
- BurnerFrameBarB: mirror
- BurnerFrameBarC: perpendicular
- BurnerFrameBarD: perpendicular
- BurnerFlame: Size Vector3.new(0.6, 1.2, 0.6), Neon RGB(255,120,0), top of frame
- BasketFloor: Size Vector3.new(4, 0.3, 4), Wood
- BasketWallFront: Size Vector3.new(4, 3, 0.4), Wood
- BasketWallRear: mirror
- BasketWallLeft: Size Vector3.new(0.4, 3, 4)
- BasketWallRight: mirror
- BasketRimTop: Size Vector3.new(4.4, 0.4, 4.4), Wood
- PropaneTank: Size Vector3.new(0.8, 1.5, 0.8), Cylinder, Metal, inside basket
- RopeLeft (4 suspension): Size Vector3.new(0.1, 8, 0.1), Metal
- RopeRight (4 suspension): mirror

Altitude: BodyForce upward adjusted by burner heat value
Drift: BodyVelocity horizontal for wind
Descent: reduce BodyForce below gravity value

--- BIPLANE (40 parts) ---
Dimensions: 16 studs long, 14 studs upper wingspan, 12 studs lower wingspan
Color palette: RGB(180,120,30) canvas / RGB(80,50,10) wood / RGB(200,50,50) red markings

- FuselageBox: Size Vector3.new(12, 2.5, 2.5), Wood, rectangular WWI style
- NoseCowling: Size Vector3.new(2, 2.5, 2.5), Metal, engine cover
- TailPost: Size Vector3.new(0.3, 2, 0.3), vertical rear, Wood
- UpperWingLeft: Size Vector3.new(0.4, 0.6, 6.5), Wood
- UpperWingRight: mirror
- LowerWingLeft: Size Vector3.new(0.4, 0.5, 5.5), slightly shorter
- LowerWingRight: mirror
- InterwingStrutLeft (2): Size Vector3.new(0.2, 3, 0.2), vertical connecting wings
- InterwingStrutRight (2): mirror
- WingBraceWires (4): Size Vector3.new(0.1, 0.1, 5), diagonal, Metal
- VertStabTop: Size Vector3.new(0.3, 2.5, 2), top tail
- VertStabBottom: mirror on bottom
- HorizStabLeft: Size Vector3.new(0.4, 0.4, 3)
- HorizStabRight: mirror
- RotaryEngine: Size Vector3.new(1.5, 1.5, 1.5), Metal
- EngineRods (7): Size Vector3.new(0.2, 1.2, 0.2), radial arranged in circle
- PropHub: Size Vector3.new(0.4, 0.4, 0.4)
- PropBladeLeft: Size Vector3.new(0.25, 5, 0.6), Wood
- PropBladeRight: mirror
- CockpitRim: Size Vector3.new(1.5, 0.3, 1.5), Cylinder top, Wood
- Windscreen: Size Vector3.new(0.1, 0.8, 0.8), Glass, tiny
- GearStrutLeft: Size Vector3.new(0.2, 1.8, 0.2), Metal
- GearStrutRight: mirror
- GearAxle: Size Vector3.new(0.2, 0.2, 3), horizontal
- LandingWheelLeft: Size Vector3.new(0.4, 1.4, 1.4), Granite
- LandingWheelRight: mirror
- TailSkid: Size Vector3.new(0.2, 1.2, 0.2), rear ground contact, angled

--- JET FIGHTER (38 parts) ---
Dimensions: 18 studs long, 12 studs wingspan, 4 studs tall
Color palette: RGB(120,130,140) air superiority gray / RGB(100,110,120) lighter gray

- FuselageMain: Size Vector3.new(14, 3, 3), Metal
- NoseCone: Size Vector3.new(5, 2, 2), pointed radar dome
- CockpitTub: Size Vector3.new(3, 2, 2.5), raised section
- CanopyGlass: Size Vector3.new(3, 1.2, 2), Glass, Transparency 0.25
- IntakeLeft: Size Vector3.new(2, 1.5, 1.2), square intake
- IntakeRight: mirror
- MainWingLeft: Size Vector3.new(0.4, 0.6, 5.5), swept 40 degrees
- MainWingRight: mirror
- WingFenceLeft: Size Vector3.new(0.15, 0.8, 0.3), small vertical fence on wing
- WingFenceRight: mirror
- CanardLeft: Size Vector3.new(0.3, 0.4, 2), small forward wing
- CanardRight: mirror
- VerticalFin: Size Vector3.new(0.4, 3.5, 2.5), single tall tail
- HorizTailLeft: Size Vector3.new(0.35, 0.4, 2.5), low tail surfaces
- HorizTailRight: mirror
- NozzleLeft: Size Vector3.new(1.2, 1.2, 2), Cylinder, Metal, RGB(60,60,60)
- NozzleRight: mirror
- AfterburnerGlowLeft: Size Vector3.new(0.8, 0.8, 0.3), Neon RGB(255,120,20)
- AfterburnerGlowRight: mirror
- MissileRailLeft (2): Size Vector3.new(2.5, 0.2, 0.2), under wing pylons
- MissileLeft (2): Size Vector3.new(2, 0.3, 0.3), Cylinder, Metal
- MissileRailRight (2): mirror
- MissileRight (2): mirror
- VentralFin: Size Vector3.new(0.3, 1.5, 0.5), below fuselage
- GearNoseStrut: Size Vector3.new(0.3, 1.5, 0.3)
- GearNoseWheel: Size Vector3.new(0.3, 0.7, 0.7)
- GearMainLeft: Size Vector3.new(0.4, 1, 0.4)
- GearMainRight: mirror

Afterburner: toggle Neon glow, increase BodyVelocity magnitude
Normal MaxSpeed: 200. Afterburner: 350
`;

export const VEHICLE_TRAINS: string = `
=== TRAINS COMPLETE CONSTRUCTION KNOWLEDGE ===

--- STEAM LOCOMOTIVE (55 parts) ---
Dimensions: 22 studs long, 5 studs wide, 7 studs tall
Color palette: RGB(20,20,20) gloss black / RGB(180,50,0) boiler red / RGB(200,160,0) brass gold

Boiler and cab:
- BoilerMain: Size Vector3.new(12, 3.5, 3.5), Cylinder mesh, Metal, black
- SmokestackFlange: Size Vector3.new(1.5, 1, 1.5), at front of boiler
- SmokestackTube: Size Vector3.new(1.2, 3, 1.2), Cylinder, flared top
- SandDome: Size Vector3.new(1.5, 1.5, 1.5), SpecialMesh Sphere, top boiler front
- SteamDome: Size Vector3.new(1.8, 1.8, 1.8), SpecialMesh Sphere, top boiler mid
- SafetyValve: Size Vector3.new(0.4, 0.6, 0.4), small cylinder on steam dome
- HeadlightFront: Size Vector3.new(0.8, 0.8, 0.8), Neon RGB(255,240,200)
- SmokboxDoor: Size Vector3.new(0.4, 3.5, 3.5), circular front plate, Metal
- BoilerBandingA: Size Vector3.new(12.5, 0.4, 3.8), Cylinder ring, Metal, brass
- BoilerBandingB: same, offset 3 studs along boiler
- BoilerBandingC: same, offset 6 studs
- BoilerBandingD: same, offset 9 studs
- CabFrontWall: Size Vector3.new(0.4, 4, 5), Metal
- CabLeftWall: Size Vector3.new(4, 4, 0.4)
- CabRightWall: mirror
- CabRoof: Size Vector3.new(4, 0.4, 5.5)
- CabRearWall: Size Vector3.new(0.4, 4, 5)
- CabWindowLeft: Size Vector3.new(0.1, 1.5, 1.5), Glass, Transparency 0.3
- CabWindowRight: mirror
- FireboxDoor: Size Vector3.new(0.3, 1, 0.8), Metal, hinged front inside cab

Running gear:
- MainFrame: Size Vector3.new(22, 1, 4.5), chassis, Metal
- CowCatcher: Size Vector3.new(3, 1.5, 5), wedge front, Metal
- DriveWheelLeft1: Size Vector3.new(0.8, 2.8, 2.8), Granite, large drive wheel
- DriveWheelLeft2: same, offset 2.5 studs along frame
- DriveWheelLeft3: same, offset 5 studs
- DriveWheelRight1: mirror right side
- DriveWheelRight2: mirror
- DriveWheelRight3: mirror
- LeadWheelLeft (2): Size Vector3.new(0.6, 1.8, 1.8), forward truck
- LeadWheelRight (2): mirror
- TrailingWheelLeft (2): Size Vector3.new(0.6, 1.8, 1.8), rear truck
- TrailingWheelRight (2): mirror
- ConnectingRodLeft: Size Vector3.new(6, 0.3, 0.15), links drive wheels, Metal
- ConnectingRodRight: mirror
- PistonLeft: Size Vector3.new(2, 0.4, 0.4), horizontal cylinder
- PistonRight: mirror
- ValveGearLeftA: Size Vector3.new(1.5, 0.2, 0.15), Metal
- ValveGearLeftB: Size Vector3.new(1, 0.15, 0.1)
- ValveGearRightA: mirror
- ValveGearRightB: mirror
- CouplerFront: Size Vector3.new(0.8, 0.6, 0.6), Metal
- CouplerRear: mirror

Steam effects:
  ParticleEmitter in SmokestackTube: Rate=20, Lifetime 3-6s, Speed 5-10, Color RGB(200,200,200) to RGB(100,100,100)
  ParticleEmitter in exhaust area: Rate=60 when moving, puff sync with wheel rotation

TENDER (fuel car behind locomotive, 20 parts):
- TenderFrame: Size Vector3.new(12, 0.8, 4.5), Metal
- CoalBin: Size Vector3.new(6, 2.5, 4.2), rear, open top, Metal, RGB(30,30,30)
- WaterTank: Size Vector3.new(5, 3, 4), front, closed, Metal
- TenderFrontWall: Size Vector3.new(0.3, 2.5, 4.2)
- TenderRearWall: mirror
- TenderLeftWall: Size Vector3.new(6, 2.5, 0.3)
- TenderRightWall: mirror
- TenderWheelLeft (4): Size Vector3.new(0.5, 1.4, 1.4)
- TenderWheelRight (4): mirror

--- PASSENGER CAR (30 parts) ---
Dimensions: 18 studs long, 5 studs wide, 5 studs tall
Color palette: RGB(200,50,50) + cream / RGB(30,60,120) blue + silver / RGB(40,40,40) black modern

- CarBody: Size Vector3.new(18, 3, 5), Metal, livery color
- CarRoof: Size Vector3.new(18, 0.5, 5.2), gently arched
- CarFloor: Size Vector3.new(18, 0.4, 5)
- EndWallFront: Size Vector3.new(0.4, 3.5, 5)
- EndWallRear: mirror
- SideWindowLeft (8): Size Vector3.new(0.15, 1.2, 1.6), Glass, evenly spaced
- SideWindowRight (8): mirror
- DoorLeft: Size Vector3.new(0.2, 3, 1.8), end of car
- DoorRight: mirror
- PassengerSeat (12 pairs): Seat instances, Size Vector3.new(1.2, 1.5, 1), facing direction
- OvernheadRackLeft: Size Vector3.new(14, 0.3, 1), Metal
- OvernheadRackRight: mirror
- BogieFrameFront: Size Vector3.new(3, 0.5, 5), wheeled truck
- BogieFrameRear: same
- BogieWheelFrontLeft (2): Size Vector3.new(0.5, 1.5, 1.5)
- BogieWheelFrontRight (2): mirror
- BogieWheelRearLeft (2): same
- BogieWheelRearRight (2): mirror
- CouplerFront: Size Vector3.new(1, 0.8, 0.8), knuckle coupler, Metal
- CouplerRear: mirror
- UnderbodyBoxA: Size Vector3.new(2, 0.8, 1.5), below floor, Metal
- UnderbodyBoxB: offset 4 studs
- UnderbodyBoxC: offset 8 studs
- UnderbodyBoxD: offset 12 studs

--- FREIGHT CAR boxcar (18 parts) ---
Dimensions: 16 studs long, 5 studs wide, 5 studs tall
Color palette: RGB(160,80,20) boxcar red / RGB(80,80,80) gray

- BoxcarBody: Size Vector3.new(16, 4, 5), Metal
- BoxcarRoof: Size Vector3.new(16.5, 0.4, 5.5)
- BoxcarFloor: Size Vector3.new(16, 0.4, 5)
- SlidingDoorLeft: Size Vector3.new(0.2, 3.5, 3), large mid-car door
- SlidingDoorRight: mirror
- DoorTrackLeft: Size Vector3.new(0.15, 0.15, 5), horizontal rail
- DoorTrackRight: mirror
- BogieFrameFront: Size Vector3.new(3, 0.5, 5)
- BogieFrameRear: same
- BogieWheelFrontLeft (2): Size Vector3.new(0.5, 1.5, 1.5)
- BogieWheelFrontRight (2): mirror
- BogieWheelRearLeft (2): same
- BogieWheelRearRight (2): mirror
- LadderRungA: Size Vector3.new(1, 0.1, 0.1), end of car
- LadderRungB: offset 0.4 studs up
- GrabIronLeft: Size Vector3.new(0.1, 1.5, 0.1), L-shaped handrail
- GrabIronRight: mirror
- CouplerFront: Size Vector3.new(1, 0.8, 0.8), Metal
- CouplerRear: mirror

--- TRAIN TRACKS ---
Standard gauge: 4.5 studs between inner rail faces

Rail cross-section: Size Vector3.new(0.3, 0.4, length), Metal, RGB(100,100,100)
Sleeper/Tie: Size Vector3.new(0.4, 0.3, 6), spaced every 1.5 studs, Wood, RGB(80,60,30)
Ballast bed: Size Vector3.new(length, 0.5, 7), material Gravel or Concrete, RGB(120,110,100)

Straight track segment 20 studs long (6 parts):
- RailLeft: Size Vector3.new(0.3, 0.4, 20), positioned left of center
- RailRight: mirror, offset 4.5 studs on Z axis
- Sleepers (13): evenly spaced from -9 to +9 studs Z

Curved track: approximate with 8 segments of 5 studs each, rotated 5 degrees per segment
Total arc: 40 degrees per curve unit
Segment positions: pos = center + Vector3.new(radius * math.cos(angle), 0, radius * math.sin(angle))
Segment orientation: CFrame.Angles(0, angle + math.pi/2, 0) for tangent alignment

Switch points: single track branching into two
- FrogPiece: where rails cross, Metal
- SwitchTongueA: thin movable rail, HingeConstraint, 0-8 degrees travel
- SwitchTongueB: companion tongue

--- STATION PLATFORM ---
Dimensions: 30 studs long, 8 studs wide, 2.5 studs tall at rail height
Color palette: RGB(220,210,190) concrete / RGB(60,80,60) trim green / RGB(255,255,255) white signs

- PlatformSlab: Size Vector3.new(30, 0.5, 8), Concrete
- SafetyEdgeStripe: Size Vector3.new(30, 0.2, 0.5), Neon RGB(255,220,0), at track edge
- RoofColumnA: Size Vector3.new(0.5, 6, 0.5), Metal
- RoofColumnB: offset 10 studs
- RoofColumnC: offset 20 studs
- RoofColumnD: offset 30 studs
- RoofShed: Size Vector3.new(30, 0.4, 8), Metal, slightly translucent Plastic
- BenchA: seat Size Vector3.new(4, 0.4, 1) + legs Size Vector3.new(0.2, 1.2, 1), Wood
- BenchB through BenchE: same, evenly spaced
- DestinationBoard: Size Vector3.new(0.2, 2, 3), SurfaceGui with TextLabel
- TicketWindowFrame: Size Vector3.new(0.3, 2.5, 2)
- TicketWindowGlass: Size Vector3.new(0.1, 1.5, 1.5), Glass, Transparency 0.2
- LampPostA: pole Size Vector3.new(0.2, 5, 0.2) + head Size Vector3.new(0.8, 0.5, 0.8), Neon top
- LampPostB through LampPostF: same, evenly spaced

Train movement on tracks:
Store waypoints as table of Vector3 positions along center of track
Move per Heartbeat:
  local direction = (waypoints[next] - trainRoot.Position).Unit
  local targetCFrame = CFrame.lookAt(trainRoot.Position + direction * speed * dt, waypoints[next])
  trainModel:SetPrimaryPartCFrame(targetCFrame)
  if (waypoints[next] - trainRoot.Position).Magnitude < 3 then advance waypoint index end
`;

export const VEHICLE_PHYSICS: string = `
=== VEHICLE PHYSICS REAL ROBLOX CONSTRAINTS AND PROPERTIES ===

--- CYLINDRICAL CONSTRAINT (spinning wheels) ---
Allows rotation around one axis. Essential for wheel spin.

local axle = Instance.new("CylindricalConstraint")
axle.Parent = car
axle.Attachment0 = chassisAxleAttachment   -- on chassis, X axis along axle direction
axle.Attachment1 = wheelCenterAttachment   -- in wheel center, same X axis alignment
axle.RotationAxisEnabled = true            -- allow spin around X axis
axle.AngularLimitsEnabled = false          -- no rotation limit, free spin
axle.LimitsEnabled = false                 -- no translation limit
axle.AngularSpeed = 0                      -- initial speed
axle.MotorMaxTorque = 1000                 -- for driven wheels
axle.AngularActuatorType = Enum.ActuatorType.Motor

Attachment alignment for axis:
Right-side wheel: attachment0.CFrame = CFrame.Angles(0, 0, math.pi/2)
Left-side wheel:  attachment0.CFrame = CFrame.Angles(0, 0, -math.pi/2)

Set drive wheel: axle.AngularSpeed = throttle * maxWheelRPM
Set free wheel:  axle.MotorMaxTorque = 0 and axle.AngularActuatorType = Enum.ActuatorType.None

--- HINGE CONSTRAINT (steering, doors, turrets) ---
Rotation around single axis with optional motor or servo.

local steerHinge = Instance.new("HingeConstraint")
steerHinge.Parent = car
steerHinge.Attachment0 = steeringKnuckleAttachment
steerHinge.Attachment1 = wheelHubAttachment
steerHinge.LimitsEnabled = true
steerHinge.UpperAngle = 35     -- max right turn in degrees
steerHinge.LowerAngle = -35    -- max left turn in degrees
steerHinge.ActuatorType = Enum.ActuatorType.Servo
steerHinge.TargetAngle = steerInput * 35   -- set each frame: -35 to +35
steerHinge.ServoMaxTorque = 10000
steerHinge.AngularSpeed = 5    -- degrees per second response rate

For door swing (no motor, physics driven):
hinge.LimitsEnabled = true
hinge.UpperAngle = 90
hinge.LowerAngle = 0
hinge.ActuatorType = Enum.ActuatorType.None
hinge.Restitution = 0.2   -- slight bounce at stop

For turret rotation (motor driven):
hinge.ActuatorType = Enum.ActuatorType.Motor
hinge.MotorMaxAcceleration = 200
hinge.AngularSpeed = targetTurnRate   -- set from script

--- SPRING CONSTRAINT (suspension) ---
Connects chassis mounting point to wheel carrier arm.

local suspension = Instance.new("SpringConstraint")
suspension.Parent = car
suspension.Attachment0 = bodyMountPoint    -- on chassis
suspension.Attachment1 = wheelCarrierPoint -- on suspension arm or wheel
suspension.FreeLength = 2.5    -- natural spring length in studs
suspension.Stiffness = 8000    -- spring rate, higher = stiffer ride
suspension.Damping = 500       -- dampens oscillation, higher = less bounce
suspension.LimitsEnabled = true
suspension.MaxLength = 3.5     -- droop travel limit
suspension.MinLength = 1.5     -- bump stop limit
suspension.Coils = 8           -- visual coil count (cosmetic)
suspension.Radius = 0.4        -- visual coil radius

Tuning guide:
  Sedan comfort:       Stiffness 5000,  Damping 400
  Sports car stiff:   Stiffness 12000, Damping 800
  Pickup heavy:       Stiffness 15000, Damping 600
  Monster truck soft: Stiffness 3000,  Damping 200

--- VEHICLE SEAT REAL PROPERTIES ---
VehicleSeat is a BasePart subclass with these additional real properties:

Disabled: boolean             -- false = usable, true = controls locked
Steer: number (read-only)     -- current steer input: -1, 0, or 1
Throttle: number (read-only)  -- current throttle: -1, 0, or 1
MaxSpeed: number              -- studs per second cap applied by seat physics
Torque: number                -- force applied for movement
TurnSpeed: number             -- angular velocity for steering
HeadsUpDisplay: boolean       -- true shows built-in speed/fuel overlay
Occupant: Humanoid (read-only)  -- humanoid sitting in seat, nil if empty

Listen for changes:
vehicleSeat:GetPropertyChangedSignal("Throttle"):Connect(function()
    local t = vehicleSeat.Throttle  -- value is -1, 0, or 1
end)

vehicleSeat:GetPropertyChangedSignal("Steer"):Connect(function()
    local s = vehicleSeat.Steer
end)

For fully custom vehicles: set MaxSpeed = 0 and Torque = 0
Use VehicleSeat only for detecting occupant and reading Throttle/Steer values
Apply all movement manually via BodyVelocity or LinearVelocity

--- BODY VELOCITY (legacy movement, still works in 2026) ---
local bv = Instance.new("BodyVelocity")
bv.Parent = rootPart
bv.MaxForce = Vector3.new(math.huge, 0, math.huge)
bv.Velocity = Vector3.new(0, 0, 0)
bv.P = 10000

Per Heartbeat update:
local lookDir = rootPart.CFrame.LookVector
bv.Velocity = lookDir * (throttle * maxSpeed)

For flight allow Y axis:
bv.MaxForce = Vector3.new(math.huge, math.huge, math.huge)
bv.Velocity = lookDir * speed + Vector3.new(0, verticalInput * climbRate, 0)

--- LINEAR VELOCITY (modern preferred method) ---
local lv = Instance.new("LinearVelocity")
lv.Parent = rootPart
lv.Attachment0 = rootAttachment
lv.MaxForce = math.huge
lv.VelocityConstraintMode = Enum.VelocityConstraintMode.Vector
lv.VectorVelocity = Vector3.new(0, 0, 0)
lv.RelativeTo = Enum.ActuatorRelativeTo.Attachment0

Car forward movement (local space, -Z = forward in Roblox attachment local):
lv.RelativeTo = Enum.ActuatorRelativeTo.Attachment0
lv.VectorVelocity = Vector3.new(0, 0, -throttle * maxSpeed)

--- ANGULAR VELOCITY ---
local av = Instance.new("AngularVelocity")
av.Parent = rootPart
av.Attachment0 = rootAttachment
av.MaxTorque = math.huge
av.AngularVelocity = Vector3.new(0, 0, 0)
av.RelativeTo = Enum.ActuatorRelativeTo.World

Car turning (world space Y axis):
local currentSpeed = rootPart.AssemblyLinearVelocity.Magnitude
local speedRatio = math.min(currentSpeed / 20, 1)
av.AngularVelocity = Vector3.new(0, -steerInput * turnSpeed * speedRatio, 0)
speedRatio prevents spinning in place at low speed

--- BODY GYRO (orientation locking, legacy) ---
local bg = Instance.new("BodyGyro")
bg.Parent = rootPart
bg.MaxTorque = Vector3.new(400000, 400000, 400000)
bg.P = 300000
bg.D = 10000
bg.CFrame = rootPart.CFrame

Keep car upright, only allow yaw:
bg.MaxTorque = Vector3.new(400000, 0, 400000)  -- no yaw torque
bg.CFrame = CFrame.new(Vector3.zero, rootPart.CFrame.LookVector)

Helicopter orientation:
bg.MaxTorque = Vector3.new(400000, 400000, 400000)
local pitchAngle = pitchInput * 20
local rollAngle = rollInput * 20
bg.CFrame = CFrame.Angles(0, currentYaw, 0) * CFrame.Angles(math.rad(pitchAngle), 0, math.rad(rollAngle))

--- ALIGN ORIENTATION (modern BodyGyro replacement) ---
local ao = Instance.new("AlignOrientation")
ao.Parent = rootPart
ao.Attachment0 = rootAttachment
ao.Mode = Enum.OrientationAlignmentMode.OneAttachment
ao.MaxTorque = 400000
ao.MaxAngularVelocity = 100
ao.Responsiveness = 30
ao.RigidityEnabled = false

Set orientation each frame:
ao.CFrame = desiredCFrame   -- set on the attachment, not ao itself
-- Actually: set ao.Attachment0.WorldCFrame = desiredCFrame

--- BODY FORCE (buoyancy and lift) ---
local bf = Instance.new("BodyForce")
bf.Parent = rootPart
bf.Force = Vector3.new(0, 0, 0)

Boat buoyancy calculation:
local mass = rootPart.AssemblyMass
local gravity = workspace.Gravity     -- 196.2 default
local waterY = 0                       -- water surface Y position
local hullDepth = 2                    -- how deep hull is when fully submerged
local depth = waterY - rootPart.Position.Y
local submersionRatio = math.clamp((depth + hullDepth * 0.5) / hullDepth, 0, 1)
bf.Force = Vector3.new(0, mass * gravity * submersionRatio * 1.1, 0)
-- 1.1 multiplier gives slight positive buoyancy so boat floats

Aircraft lift calculation:
local speed = rootPart.AssemblyLinearVelocity.Magnitude
local stallSpeed = 20   -- minimum speed for flight in studs/sec
local maxLiftSpeed = 60 -- speed at which full lift achieved
local liftFraction = math.clamp((speed - stallSpeed) / (maxLiftSpeed - stallSpeed), 0, 1)
bf.Force = Vector3.new(0, mass * gravity * liftFraction, 0)
-- At stall speed or below: no lift, gravity pulls down
-- At max lift speed: force exactly cancels gravity for level flight

--- ALIGN POSITION (modern BodyPosition replacement) ---
local ap = Instance.new("AlignPosition")
ap.Parent = rootPart
ap.Attachment0 = rootAttachment
ap.Attachment1 = targetAttachment
ap.MaxForce = 50000
ap.MaxVelocity = 20
ap.Responsiveness = 15
ap.RigidityEnabled = false

--- COLLISION GROUPS for vehicles ---
local PhysicsService = game:GetService("PhysicsService")
PhysicsService:RegisterCollisionGroup("VehicleBody")
PhysicsService:RegisterCollisionGroup("VehicleWheels")
PhysicsService:CollisionGroupSetCollidable("VehicleBody", "VehicleWheels", false)

Assign groups:
for _, part in ipairs(car:GetDescendants()) do
    if part:IsA("BasePart") then
        if part.Name:find("Wheel") then
            part.CollisionGroup = "VehicleWheels"
        else
            part.CollisionGroup = "VehicleBody"
        end
    end
end
Prevents wheels colliding with car body interior, eliminates jitter

--- WHEEL CUSTOM PHYSICAL PROPERTIES ---
part.CustomPhysicalProperties = PhysicalProperties.new(
    0.8,    -- density
    0.9,    -- friction coefficient (high for rubber grip)
    0.2,    -- elasticity (low bounce)
    0,      -- frictionWeight
    0       -- elasticityWeight
)

Material friction reference (built-in material coefficients):
Concrete: 0.7 friction naturally
Grass material: 0.5 friction
Ice material: 0.05 friction, vehicles slide
Sand material: 0.8 friction but high rolling resistance

--- ANTI-ROLL BAR ---
Simulate with SpringConstraint cross-linking left and right suspension arms
When left suspension compresses, right gets tension, reducing body lean in corners
Spring: FreeLength = lateral distance, Stiffness = 2000-5000, Damping = 100

--- CENTER OF MASS CONTROL ---
Low center of mass = stable, less roll
Add heavy invisible ballast part at floor level:
local ballast = Instance.new("Part")
ballast.Size = Vector3.new(4, 0.5, 3)
ballast.CustomPhysicalProperties = PhysicalProperties.new(15, 0.3, 0, 0, 0)
ballast.Transparency = 1
ballast.CanCollide = false
ballast.Position = chassis.Position - Vector3.new(0, 0.8, 0)
local w = Instance.new("WeldConstraint")
w.Part0 = chassis
w.Part1 = ballast
w.Parent = chassis
ballast.Parent = carModel
`;

export const VEHICLE_SCRIPTING: string = `
=== VEHICLE SCRIPTING COMPLETE PATTERNS ===

--- CAR CONTROLLER (LocalScript) ---

local UserInputService = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")

local player = Players.LocalPlayer
local vehicleSeat = script.Parent   -- LocalScript inside VehicleSeat

local CONFIG = {
    maxSpeed        = 60,
    reverseMaxSpeed = 20,
    acceleration    = 15,
    brakeForce      = 30,
    turnSpeed       = 120,        -- degrees per second max
    turnSpeedHigh   = 60,         -- degrees at max speed
    nitroMaxSpeed   = 120,
    nitroAccelRate  = 40,
    handbrakeDecay  = 0.85,       -- per-frame velocity multiplier
    nitroRegenRate  = 5,
    nitroBurnRate   = 20,
}

local state = {
    speed     = 0,
    nitroFuel = 100,
}

-- Create movement forces
local bv = Instance.new("BodyVelocity")
bv.MaxForce = Vector3.new(1e6, 0, 1e6)
bv.Velocity = Vector3.new(0, 0, 0)
bv.P = 12000
bv.Parent = vehicleSeat

local bav = Instance.new("BodyAngularVelocity")
bav.MaxTorque = Vector3.new(0, 4e5, 0)
bav.AngularVelocity = Vector3.new(0, 0, 0)
bav.P = 30000
bav.Parent = vehicleSeat

local bg = Instance.new("BodyGyro")
bg.MaxTorque = Vector3.new(4e5, 0, 4e5)
bg.P = 200000
bg.D = 2000
bg.Parent = vehicleSeat

local function lerp(a, b, t)
    return a + (b - a) * t
end

local function getInputs()
    local throttle = vehicleSeat.Throttle
    local steer = vehicleSeat.Steer
    local handbrake = UserInputService:IsKeyDown(Enum.KeyCode.Space)
    local nitro = UserInputService:IsKeyDown(Enum.KeyCode.LeftShift)
    return throttle, steer, handbrake, nitro
end

RunService.Heartbeat:Connect(function(dt)
    if not vehicleSeat.Occupant then
        bv.Velocity = Vector3.new(0, 0, 0)
        bav.AngularVelocity = Vector3.new(0, 0, 0)
        state.speed = 0
        return
    end

    local throttle, steer, handbrake, nitro = getInputs()

    -- Nitro fuel management
    if nitro and state.nitroFuel > 0 then
        state.nitroFuel = math.max(0, state.nitroFuel - CONFIG.nitroBurnRate * dt)
    else
        state.nitroFuel = math.min(100, state.nitroFuel + CONFIG.nitroRegenRate * dt)
    end

    -- Determine target speed
    local topSpeed = (nitro and state.nitroFuel > 0) and CONFIG.nitroMaxSpeed or CONFIG.maxSpeed
    local targetSpeed = 0
    if throttle > 0 then targetSpeed = topSpeed
    elseif throttle < 0 then targetSpeed = -CONFIG.reverseMaxSpeed
    end

    -- Move toward target speed
    if handbrake then
        state.speed = state.speed * CONFIG.handbrakeDecay
    else
        local accel = CONFIG.acceleration
        if throttle == 0 or (math.sign(throttle) ~= math.sign(state.speed) and state.speed ~= 0) then
            accel = CONFIG.brakeForce
        end
        if nitro and state.nitroFuel > 0 then accel = CONFIG.nitroAccelRate end

        local diff = targetSpeed - state.speed
        local step = accel * dt
        if math.abs(diff) <= step then
            state.speed = targetSpeed
        else
            state.speed = state.speed + math.sign(diff) * step
        end
    end

    -- Apply velocity along look vector
    bv.Velocity = vehicleSeat.CFrame.LookVector * state.speed

    -- Steering rate scales with speed
    local speedFraction = math.min(math.abs(state.speed) / CONFIG.maxSpeed, 1)
    local turnRate = lerp(CONFIG.turnSpeed, CONFIG.turnSpeedHigh, speedFraction)
    local steerAngular = 0
    if math.abs(state.speed) > 2 then
        local dir = state.speed > 0 and 1 or -1
        steerAngular = steer * math.rad(turnRate) * dir
    end
    bav.AngularVelocity = Vector3.new(0, -steerAngular, 0)

    -- Keep upright (no pitch/roll forces)
    bg.CFrame = CFrame.new(Vector3.zero, vehicleSeat.CFrame.LookVector)
end)

vehicleSeat:GetPropertyChangedSignal("Occupant"):Connect(function()
    if not vehicleSeat.Occupant then
        state.speed = 0
    end
end)

--- SPEEDOMETER HUD (LocalScript in StarterGui) ---

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local player = Players.LocalPlayer
local playerGui = player.PlayerGui

local sg = Instance.new("ScreenGui")
sg.Name = "VehicleHUD"
sg.ResetOnSpawn = false
sg.Parent = playerGui

local hud = Instance.new("Frame")
hud.Size = UDim2.new(0, 200, 0, 100)
hud.Position = UDim2.new(1, -220, 1, -120)
hud.BackgroundColor3 = Color3.fromRGB(10, 10, 10)
hud.BackgroundTransparency = 0.4
hud.BorderSizePixel = 0
hud.Visible = false
hud.Parent = sg

local corner = Instance.new("UICorner")
corner.CornerRadius = UDim.new(0, 12)
corner.Parent = hud

local speedLabel = Instance.new("TextLabel")
speedLabel.Size = UDim2.new(1, 0, 0.5, 0)
speedLabel.Position = UDim2.new(0, 0, 0, 0)
speedLabel.Text = "0 MPH"
speedLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
speedLabel.TextScaled = true
speedLabel.Font = Enum.Font.GothamBold
speedLabel.BackgroundTransparency = 1
speedLabel.Parent = hud

local gearLabel = Instance.new("TextLabel")
gearLabel.Size = UDim2.new(0.4, 0, 0.4, 0)
gearLabel.Position = UDim2.new(0, 10, 0.55, 0)
gearLabel.Text = "N"
gearLabel.TextScaled = true
gearLabel.Font = Enum.Font.GothamBold
gearLabel.BackgroundTransparency = 1
gearLabel.Parent = hud

local nitroBG = Instance.new("Frame")
nitroBG.Size = UDim2.new(0.9, 0, 0.15, 0)
nitroBG.Position = UDim2.new(0.05, 0, 0.82, 0)
nitroBG.BackgroundColor3 = Color3.fromRGB(20, 20, 50)
nitroBG.BorderSizePixel = 0
nitroBG.Parent = hud

local nitroFill = Instance.new("Frame")
nitroFill.Size = UDim2.new(1, 0, 1, 0)
nitroFill.BackgroundColor3 = Color3.fromRGB(0, 150, 255)
nitroFill.BorderSizePixel = 0
nitroFill.Parent = nitroBG

RunService.Heartbeat:Connect(function()
    local char = player.Character
    if not char then hud.Visible = false return end
    local seat = char:FindFirstChildWhichIsA("VehicleSeat", true)
    if not seat or not seat.Occupant then hud.Visible = false return end

    hud.Visible = true
    local speedMS = seat.AssemblyLinearVelocity.Magnitude
    local mph = math.floor(speedMS * 0.621)   -- rough studs/s to mph conversion
    speedLabel.Text = tostring(mph) .. " MPH"

    if seat.Throttle > 0 then
        gearLabel.Text = "D"
        gearLabel.TextColor3 = Color3.fromRGB(100, 255, 100)
    elseif seat.Throttle < 0 then
        gearLabel.Text = "R"
        gearLabel.TextColor3 = Color3.fromRGB(255, 80, 80)
    else
        gearLabel.Text = "N"
        gearLabel.TextColor3 = Color3.fromRGB(255, 220, 0)
    end
end)

--- FUEL SYSTEM (Script in vehicle Model) ---

local fuelConfig = {
    maxFuel        = 100,
    idleConsume    = 0.05,   -- per second engine on
    throttleConsume = 0.5,   -- additional per second at full throttle
}

local fuel = fuelConfig.maxFuel
local seat -- reference to VehicleSeat in vehicle

local function tickFuel(dt)
    if not seat or not seat.Occupant then return end
    local throttle = math.abs(seat.Throttle)
    local consume = fuelConfig.idleConsume + fuelConfig.throttleConsume * throttle
    fuel = math.max(0, fuel - consume * dt)

    if fuel <= 0 then
        seat.MaxSpeed = 0
        seat.Torque = 0
        -- Fire RemoteEvent to show "Out of fuel" UI to client
    end
end

-- Refuel via ProximityPrompt at gas station:
local function refuel()
    fuel = fuelConfig.maxFuel
    seat.MaxSpeed = 60
    seat.Torque = 20
end

--- NITRO SYSTEM ---

local nitroCooldown = false
local nitroActive = false

local function activateNitro(vehicleSeat)
    if nitroCooldown then return end
    nitroCooldown = true
    nitroActive = true

    local origMax = vehicleSeat.MaxSpeed
    local origTorque = vehicleSeat.Torque
    vehicleSeat.MaxSpeed = origMax * 2
    vehicleSeat.Torque = origTorque * 1.5

    -- Boost exhaust particle rate if particle emitter exists
    local exhaust = vehicleSeat.Parent:FindFirstChild("ExhaustParticle", true)
    if exhaust and exhaust:IsA("ParticleEmitter") then
        exhaust.Rate = 100
    end

    task.wait(3)   -- nitro duration seconds
    vehicleSeat.MaxSpeed = origMax
    vehicleSeat.Torque = origTorque
    nitroActive = false

    if exhaust and exhaust:IsA("ParticleEmitter") then
        exhaust.Rate = 10
    end

    task.wait(10)  -- cooldown seconds
    nitroCooldown = false
end

--- HEADLIGHTS AND HORN (LocalScript) ---

local UIS = game:GetService("UserInputService")
local headlightsOn = false
local car -- reference to vehicle Model

local hornSound = Instance.new("Sound")
hornSound.SoundId = "rbxassetid://9120363441"
hornSound.Volume = 1
hornSound.Parent = workspace   -- parent to a part for 3D sound ideally

UIS.InputBegan:Connect(function(input, gameProcessed)
    if gameProcessed then return end
    if input.KeyCode == Enum.KeyCode.E then
        hornSound:Play()
    end
    if input.KeyCode == Enum.KeyCode.F then
        headlightsOn = not headlightsOn
        for _, desc in ipairs(car:GetDescendants()) do
            if desc:IsA("SpotLight") or desc:IsA("PointLight") then
                desc.Enabled = headlightsOn
            end
            if desc.Name == "HeadlightLeft" or desc.Name == "HeadlightRight" then
                desc.Material = headlightsOn and Enum.Material.Neon or Enum.Material.Metal
            end
        end
    end
end)

UIS.InputEnded:Connect(function(input)
    if input.KeyCode == Enum.KeyCode.E then
        hornSound:Stop()
    end
end)

--- SPOTLIGHT SETUP IN HEADLIGHTS ---
-- SpotLight is a child of a Part and shines from its Face

local spot = Instance.new("SpotLight")
spot.Brightness = 5
spot.Color = Color3.fromRGB(255, 255, 220)
spot.Range = 60
spot.Angle = 45
spot.Enabled = false
spot.Face = Enum.NormalId.Front
spot.Parent = headlightPart   -- the Neon headlight Part

local ambient = Instance.new("PointLight")
ambient.Brightness = 2
ambient.Color = Color3.fromRGB(255, 255, 200)
ambient.Range = 15
ambient.Enabled = false
ambient.Parent = headlightPart

--- DAMAGE MODEL ---

local health = 100
local maxHealth = 100

local function onImpact(impactSpeed, carBody)
    if impactSpeed < 20 then return end
    local damage = (impactSpeed - 20) * 0.5
    health = math.max(0, health - damage)
    local ratio = health / maxHealth

    -- Tint body toward damaged gray as health drops
    local r = math.floor(lerp(80, 200, ratio))
    local g = math.floor(lerp(30, 30, ratio))
    local b = math.floor(lerp(30, 30, ratio))
    carBody.Color = Color3.fromRGB(r, g, b)

    if health <= 0 then
        -- Spawn fire and destroy
        local fire = Instance.new("Fire")
        fire.Heat = 20
        fire.Size = 8
        fire.Parent = carBody
        task.delay(3, function()
            carBody.Parent:Destroy()
        end)
    end
end

-- Wire up collision detection per part
for _, part in ipairs(car:GetDescendants()) do
    if part:IsA("BasePart") then
        part.Touched:Connect(function(hit)
            if hit:IsDescendantOf(car) then return end
            local relVel = car.PrimaryPart.AssemblyLinearVelocity - (hit.AssemblyLinearVelocity or Vector3.zero)
            local impactMag = relVel.Magnitude
            onImpact(impactMag, car.PrimaryPart)
        end)
    end
end

--- PASSENGER SEAT SYSTEM ---

for _, seat in ipairs(car:GetDescendants()) do
    if seat:IsA("Seat") and seat ~= vehicleSeat then
        seat:GetPropertyChangedSignal("Occupant"):Connect(function()
            local occ = seat.Occupant
            if occ then
                -- Weld passenger to car
                local w = Instance.new("WeldConstraint")
                w.Part0 = seat
                w.Part1 = occ.Parent:FindFirstChild("HumanoidRootPart")
                w.Parent = seat
            else
                -- Remove weld on exit
                for _, child in ipairs(seat:GetChildren()) do
                    if child:IsA("WeldConstraint") then child:Destroy() end
                end
            end
        end)
    end
end

--- HELICOPTER FLIGHT CONTROLLER (LocalScript) ---

local UIS = game:GetService("UserInputService")
local RunService = game:GetService("RunService")

local heli = -- model reference
local heliRoot = heli.PrimaryPart
local seat = heli:FindFirstChildWhichIsA("VehicleSeat", true)

-- Calculate total assembly mass
local totalMass = 0
for _, p in ipairs(heli:GetDescendants()) do
    if p:IsA("BasePart") then totalMass = totalMass + p.Mass end
end

local gravity = workspace.Gravity

-- Hover force
local liftForce = Instance.new("BodyForce")
liftForce.Force = Vector3.new(0, totalMass * gravity, 0)
liftForce.Parent = heliRoot

-- Lateral thrust
local lateralVel = Instance.new("BodyVelocity")
lateralVel.MaxForce = Vector3.new(2e5, 0, 2e5)
lateralVel.Velocity = Vector3.new(0, 0, 0)
lateralVel.P = 8000
lateralVel.Parent = heliRoot

-- Vertical velocity
local vertVel = Instance.new("BodyVelocity")
vertVel.MaxForce = Vector3.new(0, 2e5, 0)
vertVel.Velocity = Vector3.new(0, 0, 0)
vertVel.P = 8000
vertVel.Parent = heliRoot

-- Orientation
local gyro = Instance.new("BodyGyro")
gyro.MaxTorque = Vector3.new(4e5, 4e5, 4e5)
gyro.P = 200000
gyro.D = 5000
gyro.CFrame = heliRoot.CFrame
gyro.Parent = heliRoot

local yawAngle = 0

RunService.Heartbeat:Connect(function(dt)
    if not seat or not seat.Occupant then return end

    local pitch = 0; local roll = 0; local yaw = 0; local vert = 0
    if UIS:IsKeyDown(Enum.KeyCode.W) then pitch = -1 end
    if UIS:IsKeyDown(Enum.KeyCode.S) then pitch = 1 end
    if UIS:IsKeyDown(Enum.KeyCode.A) then roll = -1 end
    if UIS:IsKeyDown(Enum.KeyCode.D) then roll = 1 end
    if UIS:IsKeyDown(Enum.KeyCode.Q) then yaw = -1 end
    if UIS:IsKeyDown(Enum.KeyCode.E) then yaw = 1 end
    if UIS:IsKeyDown(Enum.KeyCode.Space) then vert = 1 end
    if UIS:IsKeyDown(Enum.KeyCode.LeftControl) then vert = -1 end

    yawAngle = yawAngle + yaw * 60 * dt
    local baseRot = CFrame.Angles(0, math.rad(yawAngle), 0)
    gyro.CFrame = baseRot * CFrame.Angles(math.rad(pitch * 20), 0, math.rad(roll * 20))

    vertVel.Velocity = Vector3.new(0, vert * 25, 0)

    -- Move in tilted direction
    local fwd = (baseRot * CFrame.Angles(math.rad(pitch * 20), 0, math.rad(roll * 20))).LookVector
    lateralVel.Velocity = Vector3.new(fwd.X * 40, 0, fwd.Z * 40)
end)

--- BOAT BUOYANCY (Script in boat Model) ---

local RunService = game:GetService("RunService")
local boat = script.Parent
local waterY = 0  -- Y position of water plane

local totalMass = 0
for _, p in ipairs(boat:GetDescendants()) do
    if p:IsA("BasePart") then totalMass = totalMass + p.Mass end
end

local buoyForce = Instance.new("BodyForce")
buoyForce.Force = Vector3.new(0, 0, 0)
buoyForce.Parent = boat.PrimaryPart

local stabilizeGyro = Instance.new("BodyGyro")
stabilizeGyro.MaxTorque = Vector3.new(2e5, 0, 2e5)
stabilizeGyro.P = 100000
stabilizeGyro.D = 3000
stabilizeGyro.Parent = boat.PrimaryPart

RunService.Heartbeat:Connect(function()
    local pos = boat.PrimaryPart.Position
    local depth = waterY - pos.Y
    local hullHeight = 2
    local subRatio = math.clamp((depth + hullHeight * 0.5) / hullHeight, 0, 1)
    buoyForce.Force = Vector3.new(0, totalMass * workspace.Gravity * subRatio * 1.1, 0)

    -- Lock pitch and roll, allow yaw
    local _, yaw, _ = boat.PrimaryPart.CFrame:ToEulerAnglesYXZ()
    stabilizeGyro.CFrame = CFrame.Angles(0, yaw, 0)
end)

--- TRAIN TRACK FOLLOWING ---

local RunService = game:GetService("RunService")
local train = -- model reference
local trainRoot = train.PrimaryPart

local trackWaypoints = {
    Vector3.new(0, 1, 0),
    Vector3.new(50, 1, 0),
    Vector3.new(100, 1, 50),
    Vector3.new(150, 1, 100),
    Vector3.new(200, 1, 100),
}

local waypointIndex = 1
local trainSpeed = 15   -- studs per second
local stopping = false

RunService.Heartbeat:Connect(function(dt)
    if stopping then return end

    local target = trackWaypoints[waypointIndex]
    local pos = trainRoot.Position
    local dir = target - pos

    if dir.Magnitude < 2 then
        waypointIndex = waypointIndex % #trackWaypoints + 1
        return
    end

    local move = dir.Unit * trainSpeed * dt
    local newPos = pos + move
    local lookTarget = target + dir.Unit * 5   -- look slightly ahead
    train:SetPrimaryPartCFrame(CFrame.lookAt(newPos, lookTarget))
end)

--- MINIMAP COMPASS (LocalScript) ---

local RunService = game:GetService("RunService")
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local playerGui = player.PlayerGui

local compassFrame = Instance.new("Frame")
compassFrame.Size = UDim2.new(0, 80, 0, 80)
compassFrame.Position = UDim2.new(1, -100, 0, 20)
compassFrame.BackgroundColor3 = Color3.fromRGB(10, 10, 10)
compassFrame.BackgroundTransparency = 0.3
compassFrame.BorderSizePixel = 0
Instance.new("UICorner", compassFrame).CornerRadius = UDim.new(1, 0)

local northMark = Instance.new("TextLabel")
northMark.Size = UDim2.new(0, 20, 0, 20)
northMark.Text = "N"
northMark.TextColor3 = Color3.fromRGB(255, 60, 60)
northMark.Font = Enum.Font.GothamBold
northMark.TextScaled = true
northMark.BackgroundTransparency = 1
northMark.Parent = compassFrame
compassFrame.Parent = playerGui:WaitForChild("VehicleHUD")

RunService.RenderStepped:Connect(function()
    local char = player.Character
    if not char then return end
    local hrp = char:FindFirstChild("HumanoidRootPart")
    if not hrp then return end
    local _, yaw, _ = hrp.CFrame:ToEulerAnglesYXZ()
    local radius = 25
    local nX = math.sin(-yaw) * radius
    local nY = -math.cos(-yaw) * radius
    northMark.Position = UDim2.new(0.5, nX - 10, 0.5, nY - 10)
end)
`;

export const VEHICLE_TRANSPORT_BIBLE: string = `
${VEHICLE_CARS}

${VEHICLE_BOATS}

${VEHICLE_AIRCRAFT}

${VEHICLE_TRAINS}

${VEHICLE_PHYSICS}

${VEHICLE_SCRIPTING}

=== QUICK REFERENCE MATERIALS BY PART TYPE ===

Car body panels:       Enum.Material.Metal
Car bumpers:           Enum.Material.Concrete
Tires and wheels:      Enum.Material.Granite
Glass windows:         Enum.Material.Glass (Transparency 0.3-0.45)
Headlights on:         Enum.Material.Neon
Exhaust pipes:         Enum.Material.Metal
Wooden boat hull:      Enum.Material.Wood
Fiberglass hull:       Enum.Material.Plastic
Aircraft fuselage:     Enum.Material.Metal
Canvas sails:          Enum.Material.Fabric (or Plastic if Fabric unavailable)
Train rails:           Enum.Material.Metal
Train body panels:     Enum.Material.Metal
Train ties/sleepers:   Enum.Material.Wood
Suspension arms:       Enum.Material.Metal
Rocket body:           Enum.Material.Metal
Engine block:          Enum.Material.Metal
Road surface:          Enum.Material.Concrete or Enum.Material.Asphalt

=== QUICK REFERENCE VEHICLE SCALE GUIDE ===
1 stud = approximately 1 foot / 0.3 meters

Small car sedan:        12L x 5W x 4H studs
SUV:                    14L x 6W x 5.5H studs
Bus:                    24L x 7W x 8H studs
Motorcycle:             6L x 1.5W x 4H studs
Go-kart:                5L x 3W x 1.5H studs
Rowboat:                8L x 3W x 2H studs
Speedboat:              14L x 5W x 3H studs
Yacht:                  30L x 8W x 6H hull studs
Pirate ship:            35L x 10W x 8H hull studs
Propeller airplane:     20L x 22 wingspan x 5H studs
Helicopter body:        14L x 3W x 5H, rotor 16 diameter studs
Rocket:                 3W x 20H studs
Steam locomotive:       22L x 5W x 7H studs
Passenger rail car:     18L x 5W x 5H studs
Track gauge (rail gap):  4.5 studs between inner rail faces

=== QUICK REFERENCE CONSTRAINT SELECTION ===

Spinning wheel:          CylindricalConstraint, RotationAxisEnabled = true
Steering knuckle:        HingeConstraint, LimitsEnabled -35 to +35, ActuatorType.Servo
Suspension travel:       SpringConstraint, Stiffness 5000-15000
Keep car upright:        BodyGyro or AlignOrientation, MaxTorque on X and Z only
Car forward movement:    BodyVelocity or LinearVelocity
Car turning:             BodyAngularVelocity Y axis
Boat floating:           BodyForce = mass * gravity * submersionRatio
Helicopter hover:        BodyForce = mass * gravity (exact cancel)
Helicopter lateral:      BodyVelocity XZ only
Helicopter yaw:          BodyAngularVelocity Y axis
Aircraft lift:           BodyForce Y = mass * gravity * liftFraction (speed dependent)
Train path follow:       SetPrimaryPartCFrame per Heartbeat along waypoints
Door swing:              HingeConstraint 0-90 degrees, ActuatorType.None
Turret rotate:           HingeConstraint, ActuatorType.Motor
Parts fixed to vehicle:  WeldConstraint (never Motor6D for static joints)
Passenger in car:        WeldConstraint Seat to HumanoidRootPart on sit
`;

// ============================================================
// EXTENDED VEHICLE KNOWLEDGE — ADVANCED PATTERNS
// ============================================================

export const VEHICLE_ADVANCED_CARS: string = `
=== ADVANCED CAR CONSTRUCTION PATTERNS ===

--- BICYCLE (14 parts) ---
Dimensions: 4 studs long, 0.8 studs wide, 3 studs tall
Color palette: RGB(180,50,50) red / RGB(200,200,200) silver / RGB(30,30,30) black

- FrameTopTube: Size Vector3.new(2.5, 0.2, 0.2), Metal, connects head tube to seat tube
- FrameDownTube: Size Vector3.new(3, 0.2, 0.2), Metal, diagonal front to bottom bracket
- FrameSeatTube: Size Vector3.new(1.8, 0.2, 0.2), Metal, vertical under seat
- FrameChainStayLeft: Size Vector3.new(1.8, 0.15, 0.15), Metal, rear triangle
- FrameChainStayRight: mirror, 0.15 stud offset
- FrameSeatStayLeft: Size Vector3.new(2, 0.15, 0.15), from seat top to rear axle
- FrameSeatStayRight: mirror
- FrontFork: Size Vector3.new(0.15, 1.6, 0.15), forward angled, Metal
- FrontWheel: Size Vector3.new(0.3, 1.8, 1.8), Granite, SpecialMesh Cylinder
- RearWheel: Size Vector3.new(0.3, 1.8, 1.8), same
- Handlebars: Size Vector3.new(0.15, 0.1, 1.2), horizontal, Metal
- SaddleSeat: Size Vector3.new(1, 0.15, 0.4), narrow, Metal
- PedalCrankLeft: Size Vector3.new(0.8, 0.1, 0.1), Metal
- PedalCrankRight: mirror

Movement: ProximityPrompt to "ride", use BodyVelocity with animation script for pedaling

--- FORKLIFT (22 parts) ---
Dimensions: 6 studs long, 4 studs wide, 5 studs tall (mast up)
Color palette: RGB(255,180,0) industrial yellow / RGB(40,40,40) black / RGB(200,200,200) silver

- ChassisBase: Size Vector3.new(6, 1, 4), Metal, yellow
- CounterweightRear: Size Vector3.new(2, 2, 4), Metal, heavy cast iron look RGB(60,60,60)
- EngineHood: Size Vector3.new(2.5, 1.5, 3.5), rounded, Metal, yellow
- OperatorCage roof: Size Vector3.new(3, 0.3, 3.5), overhead guard, Metal
- OperatorCagePostLeft (2): Size Vector3.new(0.2, 2.5, 0.2)
- OperatorCagePostRight (2): mirror
- VehicleSeat: MaxSpeed 10, Torque 80, TurnSpeed 0.8, low and slow
- MastBaseLeft: Size Vector3.new(0.4, 3, 0.4), vertical rail, Metal
- MastBaseRight: mirror, offset 2 studs
- MastInnerLeft: Size Vector3.new(0.3, 3, 0.3), slides inside mast base
- MastInnerRight: mirror
- ForkCarriage: Size Vector3.new(0.3, 1.5, 2.5), horizontal backplate, Metal
- ForkArmLeft: Size Vector3.new(3, 0.4, 0.3), horizontal tine, Metal, yellow
- ForkArmRight: same, 1.2 studs offset on Z
- TiltCylinderLeft: Size Vector3.new(0.3, 2.5, 0.3), hydraulic cylinder visual
- TiltCylinderRight: mirror
- FrontWheelLeft: Size Vector3.new(0.6, 1.5, 1.5), Granite, driven
- FrontWheelRight: mirror
- RearWheelLeft: Size Vector3.new(0.4, 1, 1), Granite, steering
- RearWheelRight: mirror

Fork lift via LinearVelocity on mast inner section, script watches user holding Up arrow

--- TRACTOR (28 parts) ---
Dimensions: 10 studs long, 5 studs wide, 5 studs tall
Color palette: RGB(180,30,30) red / RGB(40,120,40) green John Deere / RGB(255,180,0) yellow

- MainBody: Size Vector3.new(8, 2.5, 4.5), Metal, primary color
- EngineBlock: Size Vector3.new(3.5, 2, 3.5), front protruding hood area, Metal
- ExhaustStack: Size Vector3.new(0.5, 3, 0.5), tall vertical, Metal, rear of engine
- FuelTankSide: Size Vector3.new(2, 1.2, 0.4), both sides of engine, Metal
- CabStructure (open or enclosed):
  - CabRollBar: Size Vector3.new(0.3, 3, 3), arch over operator, Metal
  - CabRoof: Size Vector3.new(3, 0.3, 3), Metal, optional enclosed
- VehicleSeat: MaxSpeed 15, Torque 200, TurnSpeed 0.6
- SteeringWheel: Size Vector3.new(0.1, 1.2, 1.2), SpecialMesh Cylinder
- FrontWheelLeft: Size Vector3.new(0.8, 1.8, 1.8), Granite, smaller front
- FrontWheelRight: mirror
- RearWheelLeft: Size Vector3.new(1, 3.2, 3.2), Granite, massive rear drive wheels
- RearWheelRight: mirror
- ThreepointHitchCenter: Size Vector3.new(0.5, 0.5, 0.5), rear attachment, Metal
- HitchArmLeft: Size Vector3.new(2.5, 0.3, 0.3), HingeConstraint raises/lowers
- HitchArmRight: mirror
- FenderLeft: Size Vector3.new(3, 0.3, 0.5), arched over rear wheel, Metal
- FenderRight: mirror
- StepLeft: Size Vector3.new(1, 0.3, 1.5), entry step, Metal
- StepRight: mirror
- ToolboxLeft: Size Vector3.new(1.5, 0.8, 0.5), on side of body, Metal
- ToolboxRight: mirror
- PTOShaft: Size Vector3.new(1.5, 0.3, 0.3), rear power take-off, Metal

--- BULLDOZER (35 parts) ---
Dimensions: 14 studs long, 7 studs wide, 5 studs tall
Color palette: RGB(255,160,0) construction orange / RGB(40,40,40) black / RGB(200,200,200) silver

- MainFrame: Size Vector3.new(12, 2, 7), Metal, orange
- EngineCompartment: Size Vector3.new(5, 3.5, 6.5), rear raised housing, Metal
- ExhaustPipe: Size Vector3.new(0.5, 4, 0.5), tall vertical, Metal
- CabStructure: Size Vector3.new(3, 3.5, 5.5), operator cab mid-chassis
- CabWindshield: Size Vector3.new(0.1, 2.5, 4.5), Glass, Transparency 0.3
- VehicleSeat inside cab: MaxSpeed 10, Torque 300
- DozerBlade: Size Vector3.new(0.6, 3, 8), large front pusher, Metal, RGB(255,160,0)
  HingeConstraint connects blade to frame — tilts via LinearVelocity actuated push arms
- BladeFrameLeft: Size Vector3.new(4, 0.4, 0.4), A-frame push arm
- BladeFrameRight: mirror
- TiltCylinderLeft: Size Vector3.new(2.5, 0.4, 0.4), hydraulic, Metal
- TiltCylinderRight: mirror
- TrackFrameLeft: Size Vector3.new(12, 1, 1.5), track housing left
- TrackFrameRight: mirror
- TrackPadLeft (10 pads): Size Vector3.new(1.2, 0.4, 1.8), Concrete, link style
- TrackPadRight (10 pads): mirror
- DriveSprockedLeft: Size Vector3.new(0.8, 2.2, 2.2), front drive wheel, Metal
- DriveSprockedRight: mirror
- IdlerWheelLeft: Size Vector3.new(0.8, 2, 2), rear tensioner
- IdlerWheelRight: mirror
- RollerWheelLeft (4): Size Vector3.new(0.6, 1.5, 1.5), undercarriage rollers
- RollerWheelRight (4): mirror

--- GOLF CART (16 parts) ---
Dimensions: 6 studs long, 3.5 studs wide, 4 studs tall
Color palette: RGB(255,255,255) white / RGB(0,100,200) blue / RGB(100,200,100) green

- CartFrame: Size Vector3.new(6, 0.5, 3.5), thin chassis, Metal
- CartBody: Size Vector3.new(3.5, 1, 3.2), front body shell, Plastic, white
- CartRoof: Size Vector3.new(5, 0.25, 3.4), large flat canopy, Plastic
- RoofPostFrontLeft: Size Vector3.new(0.2, 3, 0.2), Metal
- RoofPostFrontRight: mirror
- RoofPostRearLeft: mirror rear
- RoofPostRearRight: mirror rear
- VehicleSeat: MaxSpeed 15, Torque 15, TurnSpeed 1.5
- PassengerSeat: Seat instance, side by side with driver
- RearSeat: Seat, backward facing rear
- SteeringWheel: Size Vector3.new(0.1, 0.8, 0.8), Metal
- WindscreenShield: Size Vector3.new(0.1, 1.2, 3), Glass, Transparency 0.2
- FrontWheelLeft: Size Vector3.new(0.4, 1, 1), Granite
- FrontWheelRight: mirror
- RearWheelLeft: Size Vector3.new(0.5, 1.2, 1.2), Granite
- RearWheelRight: mirror

--- RACE CAR STOCK CAR (30 parts) ---
Dimensions: 13 studs long, 5.5 studs wide, 3 studs tall
Color palette: sponsor-based, e.g. RGB(255,0,0) + RGB(255,255,0) + RGB(0,0,200) number panel

- RoofPanel: Size Vector3.new(5, 0.3, 5), Metal (stock cars have large flat roof)
- RoofFlap (2): Size Vector3.new(1.5, 1, 0.1), hinged flaps open on spin to slow car
- BumperFront (steel): Size Vector3.new(1, 2, 5.5), thick metal brace, RGB(180,180,180)
- BumperRear: same
- SideSkirtLeft: Size Vector3.new(12, 0.8, 0.2), Metal, near ground
- SideSkirtRight: mirror
- HoodPin (2 per panel): Size Vector3.new(0.2, 0.4, 0.2), Metal, visible fasteners
- NumberPanel (driver door): flat part with SurfaceGui showing car number
- RollCage (visible exterior bars): 6 bars, Size Vector3.new(0.2, 3, 0.2)
- NASCARSpoilerBase: Size Vector3.new(0.3, 0.8, 5.5), high rear spoiler
- Wheels (4): Size Vector3.new(1, 2.4, 2.4), Granite, stock car tires

VehicleSeat MaxSpeed: 140, Torque: 90, TurnSpeed: 2.0

=== ADVANCED SCRIPTING PATTERNS ===

--- GEAR SHIFT SYSTEM ---
Simulate a gearbox with torque curve per gear.

local gears = {
    { ratio = 3.2, maxRPM = 3000 },   -- 1st gear: high torque low speed
    { ratio = 2.1, maxRPM = 4500 },
    { ratio = 1.4, maxRPM = 5500 },
    { ratio = 1.0, maxRPM = 6500 },
    { ratio = 0.75, maxRPM = 7500 },  -- 5th gear: high speed low torque
}
local currentGear = 1
local engineRPM = 0
local maxEngineRPM = 7000

local function updateGear(speed)
    local speedThresholds = {10, 25, 45, 70, 100}  -- shift up at these speeds
    local downThresholds  = {5,  15, 35, 55, 80}   -- shift down at these

    if currentGear < #gears and speed > speedThresholds[currentGear] then
        currentGear = currentGear + 1
    elseif currentGear > 1 and speed < downThresholds[currentGear - 1] then
        currentGear = currentGear - 1
    end
end

local function getEngineTorque(throttle, gear)
    local g = gears[gear]
    engineRPM = math.clamp(
        (rootPart.AssemblyLinearVelocity.Magnitude * g.ratio * 60) / (2 * math.pi * 0.5),
        800, maxEngineRPM
    )
    -- Torque curve: peaks at 60% of max RPM
    local rpmRatio = engineRPM / maxEngineRPM
    local torqueMult = 1 - math.pow(rpmRatio - 0.6, 2) * 2  -- parabolic peak
    return throttle * g.ratio * math.max(0.2, torqueMult) * 20
end

--- ABS (ANTI-LOCK BRAKING) ---
Prevents wheel lockup during hard braking.

local absActive = false

local function applyABS(brakePressure, wheelSpeed, vehicleSpeed)
    if vehicleSpeed < 2 then return brakePressure end  -- no ABS at very low speed
    local slipRatio = (vehicleSpeed - wheelSpeed) / math.max(vehicleSpeed, 0.01)
    if slipRatio > 0.2 then   -- wheel locking up
        absActive = true
        -- Pulse brake pressure to threshold
        return brakePressure * 0.6
    end
    absActive = false
    return brakePressure
end

--- TRACTION CONTROL ---
Limits wheel spin on acceleration (especially rear-wheel drive on slippery surfaces).

local function applyTractionControl(throttle, rearWheelSpinRate, vehicleSpeed)
    local slipRatio = (rearWheelSpinRate - vehicleSpeed) / math.max(vehicleSpeed, 0.01)
    if slipRatio > 0.15 then
        -- Reduce throttle to limit spin
        return throttle * (1 - (slipRatio - 0.15) * 3)
    end
    return throttle
end

--- ENGINE SOUND SYSTEM ---
Use a Sound instance with PlaybackSpeed adjusted to RPM.

local engineSound = Instance.new("Sound")
engineSound.SoundId = "rbxassetid://2645425045"   -- engine idle sound
engineSound.Volume = 0.5
engineSound.Looped = true
engineSound.Parent = vehicleSeat
engineSound:Play()

local function updateEngineSound(rpm, maxRPM)
    local rpmFraction = rpm / maxRPM
    engineSound.PlaybackSpeed = 0.5 + rpmFraction * 2.0   -- 0.5x idle to 2.5x redline
    engineSound.Volume = 0.3 + rpmFraction * 0.5
end

RunService.Heartbeat:Connect(function(dt)
    local speed = vehicleSeat.AssemblyLinearVelocity.Magnitude
    updateGear(speed)
    local rpm = (speed * gears[currentGear].ratio * 60) / (math.pi * 0.5)
    updateEngineSound(math.clamp(rpm, 800, maxEngineRPM), maxEngineRPM)
end)

--- SUSPENSION VISUAL ANIMATION ---
Animate wheel position based on suspension compression each frame.

local wheelPositions = {
    { part = frontLeftWheel,  baseOffset = Vector3.new(3.5, -1.2, 2.8) },
    { part = frontRightWheel, baseOffset = Vector3.new(3.5, -1.2, -2.8) },
    { part = rearLeftWheel,   baseOffset = Vector3.new(-3.5, -1.2, 2.8) },
    { part = rearRightWheel,  baseOffset = Vector3.new(-3.5, -1.2, -2.8) },
}

local suspensionTravel = 0.6   -- max compression in studs
local springRate = 0.3         -- lerp speed

RunService.Heartbeat:Connect(function(dt)
    for _, w in ipairs(wheelPositions) do
        -- Raycast downward from default wheel position
        local origin = chassis.CFrame:PointToWorldSpace(w.baseOffset + Vector3.new(0, suspensionTravel, 0))
        local rayResult = workspace:Raycast(origin, Vector3.new(0, -(suspensionTravel * 2 + 1), 0))
        local targetY = w.baseOffset.Y
        if rayResult then
            local hitDist = rayResult.Distance
            targetY = w.baseOffset.Y + (suspensionTravel - (hitDist - 1))
        end
        local currentOffset = Vector3.new(w.baseOffset.X, targetY, w.baseOffset.Z)
        w.part.CFrame = chassis.CFrame * CFrame.new(currentOffset)
    end
end)

--- DRIFT MECHANIC ---
High rear grip loss for drift-style cornering.

local driftFactor = 0       -- 0 = no drift, 1 = full drift
local driftDecay = 0.95     -- per frame grip return rate

local function applyDrift(steer, speed, handbrake)
    if handbrake and speed > 15 then
        driftFactor = math.min(1, driftFactor + 0.05)
    else
        driftFactor = driftFactor * driftDecay
    end

    -- Slide rear of car based on drift factor
    local slideVelocity = vehicleSeat.CFrame.RightVector * steer * driftFactor * speed * 0.4
    bv.Velocity = bv.Velocity + slideVelocity
end

--- CHECKPOINT SYSTEM FOR RACING ---
Use invisible Part "checkpoints" with Touched event.

local checkpoints = workspace.Checkpoints:GetChildren()
local currentCheckpoint = 1
local laps = 0

for i, checkpoint in ipairs(checkpoints) do
    checkpoint.Transparency = 1
    checkpoint.CanCollide = false
    checkpoint.Touched:Connect(function(hit)
        local char = hit.Parent
        if not char:FindFirstChildWhichIsA("Humanoid") then return end
        if i == currentCheckpoint then
            currentCheckpoint = currentCheckpoint + 1
            if currentCheckpoint > #checkpoints then
                laps = laps + 1
                currentCheckpoint = 1
                print("Lap " .. laps .. " completed!")
            end
        end
    end)
end

--- VEHICLE CAMERA (Spring Arm) ---
Smooth following camera that lags slightly behind vehicle.

local RunService = game:GetService("RunService")
local cam = workspace.CurrentCamera
local player = game:GetService("Players").LocalPlayer

local cameraOffset = Vector3.new(0, 6, -14)  -- behind and above
local cameraLagFactor = 0.08                  -- lower = more lag, more cinematic

local currentCamPos = Vector3.new(0, 10, 0)

RunService.RenderStepped:Connect(function()
    local char = player.Character
    if not char then return end
    local hrp = char:FindFirstChild("HumanoidRootPart")
    if not hrp then return end

    local targetPos = hrp.CFrame:PointToWorldSpace(cameraOffset)
    currentCamPos = currentCamPos:Lerp(targetPos, cameraLagFactor)

    local lookAtPoint = hrp.Position + hrp.CFrame.LookVector * 10
    cam.CFrame = CFrame.new(currentCamPos, lookAtPoint)
end)

--- AUTOPILOT WAYPOINT FOLLOWING ---
For AI-driven vehicles (NPCs in traffic).

local function createAutopilotVehicle(carModel, waypoints)
    local root = carModel.PrimaryPart
    local currentWP = 1
    local speed = 25

    local bv = Instance.new("BodyVelocity")
    bv.MaxForce = Vector3.new(1e5, 0, 1e5)
    bv.P = 8000
    bv.Parent = root

    local bg = Instance.new("BodyGyro")
    bg.MaxTorque = Vector3.new(4e5, 0, 4e5)
    bg.P = 100000
    bg.D = 2000
    bg.Parent = root

    RunService.Heartbeat:Connect(function(dt)
        local target = waypoints[currentWP]
        local pos = root.Position
        local dir = (target - pos)

        if dir.Magnitude < 3 then
            currentWP = currentWP % #waypoints + 1
            return
        end

        local norm = dir.Unit
        bv.Velocity = norm * speed
        bg.CFrame = CFrame.lookAt(Vector3.zero, norm)
    end)
end

--- POLICE SIREN LIGHTS SCRIPT ---
Alternating red/blue flashing pattern.

local redLight = car:FindFirstChild("LightBarRedLeft")
local blueLight = car:FindFirstChild("LightBarBlueRight")
local sirenOn = false
local flashInterval = 0.1   -- seconds per flash

local function runSiren()
    while sirenOn do
        if redLight then redLight.Material = Enum.Material.Neon end
        if blueLight then blueLight.Material = Enum.Material.Metal end
        task.wait(flashInterval)
        if redLight then redLight.Material = Enum.Material.Metal end
        if blueLight then blueLight.Material = Enum.Material.Neon end
        task.wait(flashInterval)
    end
end

local sirenSound = Instance.new("Sound")
sirenSound.SoundId = "rbxassetid://9120362436"
sirenSound.Volume = 1
sirenSound.Looped = true
sirenSound.Parent = car.PrimaryPart

game:GetService("UserInputService").InputBegan:Connect(function(input, gp)
    if gp then return end
    if input.KeyCode == Enum.KeyCode.G then
        sirenOn = not sirenOn
        if sirenOn then
            sirenSound:Play()
            task.spawn(runSiren)
        else
            sirenSound:Stop()
            if redLight then redLight.Material = Enum.Material.Neon end
            if blueLight then blueLight.Material = Enum.Material.Neon end
        end
    end
end)

--- AMBULANCE DISPATCH SYSTEM ---
Server-side: track nearest hospital and route ambulance.

local hospitals = {
    workspace.Hospital1.Position,
    workspace.Hospital2.Position,
}

local function getNearestHospital(pos)
    local nearest, dist = nil, math.huge
    for _, h in ipairs(hospitals) do
        local d = (h - pos).Magnitude
        if d < dist then nearest = h; dist = d end
    end
    return nearest
end

--- SPEEDBOAT WAKE PARTICLES ---
ParticleEmitter at hull sides, rate increases with speed.

local wakeLeft = Instance.new("ParticleEmitter")
wakeLeft.Texture = "rbxassetid://131940271"   -- splash texture
wakeLeft.Rate = 0
wakeLeft.Speed = NumberRange.new(5, 15)
wakeLeft.Lifetime = NumberRange.new(0.5, 1.5)
wakeLeft.Rotation = NumberRange.new(-45, 45)
wakeLeft.Color = ColorSequence.new(Color3.fromRGB(255, 255, 255))
wakeLeft.Transparency = NumberSequence.new({
    NumberSequenceKeypoint.new(0, 0.2),
    NumberSequenceKeypoint.new(1, 1)
})
wakeLeft.Direction = Vector3.new(0, 0, 1)     -- spray outward
wakeLeft.SpreadAngle = Vector2.new(30, 10)
wakeLeft.Parent = hullPart

RunService.Heartbeat:Connect(function()
    local speed = boat.PrimaryPart.AssemblyLinearVelocity.Magnitude
    wakeLeft.Rate = math.clamp(speed * 2, 0, 80)
end)

--- SUBMARINE TORPEDO SYSTEM ---
Fire torpedo projectile from torpedo tube.

local function fireTorpedo(tubeAttachment)
    local torpedo = Instance.new("Part")
    torpedo.Size = Vector3.new(0.4, 0.4, 3)
    torpedo.Material = Enum.Material.Metal
    torpedo.Color = Color3.fromRGB(80, 80, 80)
    torpedo.CFrame = tubeAttachment.WorldCFrame
    torpedo.Parent = workspace

    local bv = Instance.new("BodyVelocity")
    bv.MaxForce = Vector3.new(math.huge, math.huge, math.huge)
    bv.Velocity = tubeAttachment.WorldCFrame.LookVector * 60  -- torpedo speed 60 studs/s
    bv.P = math.huge
    bv.Parent = torpedo

    torpedo.Touched:Connect(function(hit)
        if hit:IsDescendantOf(submarine) then return end
        -- Explosion effect
        local explosion = Instance.new("Explosion")
        explosion.Position = torpedo.Position
        explosion.BlastRadius = 10
        explosion.BlastPressure = 500000
        explosion.Parent = workspace
        torpedo:Destroy()
    end)

    task.delay(10, function()   -- auto-destroy if no hit
        if torpedo then torpedo:Destroy() end
    end)
end

--- TRAIN DOOR SYSTEM (stations only) ---
Doors open only when train is stopped at station, close before departure.

local trainDoors = train:GetDescendants()
local stationZones = workspace.Stations:GetChildren()

local function checkAtStation()
    for _, zone in ipairs(stationZones) do
        if (zone.Position - train.PrimaryPart.Position).Magnitude < 8 then
            return true
        end
    end
    return false
end

local function openTrainDoors()
    for _, part in ipairs(trainDoors) do
        if part.Name:find("Door") then
            local goal = {CFrame = part.CFrame * CFrame.new(2, 0, 0)}
            game:GetService("TweenService"):Create(part, TweenInfo.new(1), goal):Play()
        end
    end
end

local function closeTrainDoors()
    for _, part in ipairs(trainDoors) do
        if part.Name:find("Door") then
            local goal = {CFrame = part.CFrame * CFrame.new(-2, 0, 0)}
            game:GetService("TweenService"):Create(part, TweenInfo.new(1), goal):Play()
        end
    end
end

--- AIRCRAFT LANDING GEAR RETRACTION ---
Animate gear retracting after takeoff.

local TweenService = game:GetService("TweenService")
local gearDeployed = true

local gearParts = {
    { part = noseGearStrut, deployedOffset = Vector3.new(0, -1.5, 4), retractedOffset = Vector3.new(0, 0, 4) },
    { part = mainGearLeft,  deployedOffset = Vector3.new(-2.5, -1.2, 0), retractedOffset = Vector3.new(-2.5, 0, 0) },
    { part = mainGearRight, deployedOffset = Vector3.new(2.5, -1.2, 0),  retractedOffset = Vector3.new(2.5, 0, 0) },
}

local function toggleGear()
    gearDeployed = not gearDeployed
    for _, g in ipairs(gearParts) do
        local targetOffset = gearDeployed and g.deployedOffset or g.retractedOffset
        local targetCFrame = aircraftRoot.CFrame * CFrame.new(targetOffset)
        local tween = TweenService:Create(
            g.part,
            TweenInfo.new(1.5, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
            { CFrame = targetCFrame }
        )
        tween:Play()
    end
end

-- Toggle with G key:
game:GetService("UserInputService").InputBegan:Connect(function(input, gp)
    if gp then return end
    if input.KeyCode == Enum.KeyCode.G then toggleGear() end
end)

--- HELICOPTER ROTOR VISUAL SPIN ---
Smooth rotation of rotor blades each RenderStepped.

local rotorHub = helicopter:FindFirstChild("RotorHub")
local rotorRPM = 0
local maxRotorRPM = 500   -- visual RPM

RunService.RenderStepped:Connect(function(dt)
    -- Spin up/down based on throttle
    if seat.Occupant then
        rotorRPM = math.min(maxRotorRPM, rotorRPM + 80 * dt)
    else
        rotorRPM = math.max(0, rotorRPM - 40 * dt)
    end

    local angularStep = math.rad(rotorRPM / 60 * 360) * dt
    rotorHub.CFrame = rotorHub.CFrame * CFrame.Angles(0, angularStep, 0)
end)

--- BOAT STEERING (Rudder-based) ---
Visual rudder turns with steering input, affects angular velocity.

local rudder = boat:FindFirstChild("Rudder")
local maxRudderAngle = 35  -- degrees

RunService.Heartbeat:Connect(function(dt)
    local steer = seat.Steer or 0
    local speed = boat.PrimaryPart.AssemblyLinearVelocity.Magnitude

    -- Animate rudder rotation
    if rudder then
        local targetAngle = steer * maxRudderAngle
        local currentAngle = math.deg(select(2, rudder.CFrame:ToEulerAnglesYXZ()))
        local newAngle = currentAngle + (targetAngle - currentAngle) * 0.1
        rudder.CFrame = boat.PrimaryPart.CFrame * CFrame.new(0, 0, -6) * CFrame.Angles(0, math.rad(newAngle), 0)
    end

    -- Apply turn based on speed and rudder angle
    local turnRate = steer * math.min(speed / 15, 1) * math.rad(40)
    local bav = boat.PrimaryPart:FindFirstChild("BodyAngularVelocity") or Instance.new("BodyAngularVelocity", boat.PrimaryPart)
    bav.MaxTorque = Vector3.new(0, 1e5, 0)
    bav.AngularVelocity = Vector3.new(0, -turnRate, 0)
    bav.P = 20000
end)

=== COMPLETE VEHICLE BUILD CHECKLIST ===

Before spawning any vehicle, verify:
1. All parts welded to PrimaryPart with WeldConstraint
2. PrimaryPart is set on the Model (Model.PrimaryPart = mainBody)
3. Collision groups set: body vs wheels = not collidable
4. VehicleSeat has Disabled = false
5. No SmoothPlastic material used anywhere
6. Wheel CylindricalConstraints have correct Attachment0 axis (X-axis along axle)
7. BodyGyro or AlignOrientation present to keep vehicle upright
8. BodyVelocity or LinearVelocity present for movement
9. BodyAngularVelocity or AngularVelocity present for turning
10. For boats: BodyForce present for buoyancy, updates every Heartbeat
11. For aircraft: BodyForce lift tied to speed, stall modeled
12. For trains: waypoint array defined, SetPrimaryPartCFrame used
13. Sound effects attached and looped where appropriate
14. SpotLights inside headlight parts, Face = NormalId.Front
15. ParticleEmitters in exhaust parts, Rate driven by throttle
16. All Part anchoring: PrimaryPart.Anchored = false, everything else false
17. CollisionGroup assigned to all BasePart descendants
18. Custom PhysicalProperties on wheels: friction 0.9, elasticity 0.2
19. Ballast part added low in vehicle for stable center of mass
20. ProximityPrompts on doors and seats for user interaction

=== MATERIALS NEVER TO USE ===
Enum.Material.SmoothPlastic — forbidden in all builds
Use instead:
  For plastic-like surfaces: Enum.Material.Plastic
  For smooth metal: Enum.Material.Metal
  For rubber: Enum.Material.Granite
  For glass: Enum.Material.Glass
  For concrete/stone: Enum.Material.Concrete

=== PART NAMING CONVENTIONS ===
All vehicle parts must follow this naming scheme for scripts to find them:
  MainBody, Hood, Trunk, RoofPanel
  FrontBumper, RearBumper
  HeadlightLeft, HeadlightRight
  TaillightLeft, TaillightRight
  WheelFrontLeft, WheelFrontRight, WheelRearLeft, WheelRearRight
  MirrorLeft, MirrorRight
  DriverDoor, PassengerDoor
  DriverSeat (VehicleSeat), PassengerSeat (Seat)
  ExhaustPipe, ExhaustParticle (ParticleEmitter child)
  LightBarRedLeft, LightBarBlueRight (for police)
  RotorHub (helicopter main rotor)
  TailRotorHub (helicopter tail)
  Rudder (boat/submarine)
  MainMast, MainBoom, MainSail (sailing vessels)
  BogieFrameFront, BogieFrameRear (trains)
  NozzleGlow (rockets, Neon flame visual)

Following these names lets generic vehicle scripts find parts by name without hardcoding.
`;

export const VEHICLE_WORLD_INTEGRATION: string = `
=== VEHICLE WORLD INTEGRATION — ROADS, GARAGES, FUEL, TRAFFIC ===

--- ROAD CONSTRUCTION ---
Road segment: 20 studs long, 8 studs wide, 0.5 studs tall
Material: Enum.Material.Concrete, Color: RGB(60,60,60)

Lane markings:
- CenterLine: Size Vector3.new(18, 0.1, 0.3), Neon RGB(255,220,0), flush on road surface
- LaneMarkLeft: Size Vector3.new(4, 0.1, 0.2), RGB(255,255,255), dashed, 3 per segment
- LaneMarkRight: mirror

Curbs (both sides):
- CurbLeft: Size Vector3.new(20, 0.3, 0.5), Concrete, RGB(180,180,180)
- CurbRight: mirror

Sidewalk:
- SidewalkLeft: Size Vector3.new(20, 0.3, 3), Concrete, RGB(200,190,180)
- SidewalkRight: mirror

Intersection (cross roads, 16x16 studs):
- MainSlab: Size Vector3.new(16, 0.5, 16), Concrete, RGB(60,60,60)
- StopLineNorth: Size Vector3.new(8, 0.1, 0.3), RGB(255,255,255), at entry
- StopLineSouth: mirror
- StopLineEast: mirror rotated
- StopLineWest: mirror rotated
- CrosswalkStripes (6 per crossing): Size Vector3.new(3, 0.1, 0.5), RGB(255,255,255)

Traffic lights (per intersection corner, each 4 parts):
- LightPole: Size Vector3.new(0.3, 8, 0.3), Metal, RGB(60,60,60)
- LightHousing: Size Vector3.new(0.6, 1.8, 0.6), Metal, RGB(40,40,40)
- LightRed: Size Vector3.new(0.4, 0.5, 0.4), Neon RGB(255,30,30), default on
- LightGreen: Size Vector3.new(0.4, 0.5, 0.4), Neon RGB(30,255,30), default off

Traffic light cycle script (Server):
  local lights = { red = lightRedPart, green = lightGreenPart }
  local state = "red"
  local timings = { red = 15, green = 12, yellow = 3 }

  while true do
      lights.red.Material = Enum.Material.Neon
      lights.green.Material = Enum.Material.Metal
      task.wait(timings.red)
      lights.red.Material = Enum.Material.Metal
      -- Yellow phase: no separate part, just brief pause
      task.wait(timings.yellow)
      lights.green.Material = Enum.Material.Neon
      task.wait(timings.green)
      lights.green.Material = Enum.Material.Metal
      task.wait(1)
  end

--- GARAGE / SPAWN SYSTEM ---
Spawn pad: Part 6x6x0.3 studs, Neon RGB(0,200,255), ProximityPrompt "Spawn Vehicle"

Vehicle spawning script (Server):
  local function spawnCar(playerCharacter, spawnPad)
      local carTemplate = ServerStorage.Vehicles.Sedan:Clone()
      local spawnCFrame = spawnPad.CFrame * CFrame.new(0, 3, 0)
      carTemplate:SetPrimaryPartCFrame(spawnCFrame)
      carTemplate.Parent = workspace

      -- Assign ownership tag
      local tag = Instance.new("StringValue")
      tag.Name = "Owner"
      tag.Value = playerCharacter.Name
      tag.Parent = carTemplate

      return carTemplate
  end

Vehicle despawn (when player leaves or on request):
  local function despawnCar(car)
      -- Smooth despawn with shrink tween
      local TweenService = game:GetService("TweenService")
      for _, part in ipairs(car:GetDescendants()) do
          if part:IsA("BasePart") then
              TweenService:Create(part, TweenInfo.new(0.5), { Size = Vector3.new(0.01, 0.01, 0.01) }):Play()
          end
      end
      task.wait(0.6)
      car:Destroy()
  end

--- FUEL STATION SYSTEM ---
Fuel station structure (20 parts):
- CanopyRoof: Size Vector3.new(20, 0.5, 14), Metal, RGB(200,30,30)
- CanopyColumnA: Size Vector3.new(0.5, 5, 0.5), Metal, RGB(200,200,200)
- CanopyColumnB: offset 10 studs
- CanopyColumnC: offset 20 studs
- GasPumpBodyA: Size Vector3.new(1.5, 3, 0.8), Metal, RGB(220,220,220)
- GasPumpBodyB: second pump, offset
- PumpDisplayA: Size Vector3.new(0.1, 0.8, 0.6), SurfaceGui showing price/fuel%
- PumpHoseA: Size Vector3.new(0.2, 0.2, 1.5), Metal, dark
- PumpNozzleA: Size Vector3.new(0.4, 0.3, 0.3), Metal
- IslandBase: Size Vector3.new(10, 0.4, 2), Concrete
- GroundSlab: Size Vector3.new(22, 0.3, 16), Concrete, RGB(70,70,70)
- PaymentTerminal: Size Vector3.new(0.5, 1.5, 0.5), Metal with SurfaceGui
- PriceSign: Size Vector3.new(0.3, 3, 2), with SurfaceGui TextLabel
- LightFixtureA: Neon RGB(255,255,200), under canopy
- LightFixtureB: mirror
- TireStop (2): Size Vector3.new(3, 0.3, 0.5), Concrete, bright yellow

Refuel ProximityPrompt on each GasPump:
  pump.ProximityPrompt.Triggered:Connect(function(player)
      local char = player.Character
      local vehSeat = char:FindFirstChildWhichIsA("VehicleSeat", true)
      if not vehSeat then return end
      local car = vehSeat.Parent
      local fuelTag = car:FindFirstChild("FuelLevel")
      if fuelTag then fuelTag.Value = 100 end
      -- Refuel cost via Stripe/token system RemoteEvent
  end)

--- HIGHWAY TOLLBOOTH ---
Structure (12 parts):
- TollBoothBuilding: Size Vector3.new(3, 4, 5), Concrete, RGB(180,180,180)
- BoothWindow: Size Vector3.new(0.1, 1.5, 2), Glass
- BoothDoor: Size Vector3.new(0.2, 2.5, 1.5)
- BarrierArm: Size Vector3.new(6, 0.3, 0.3), Metal, RGB(255,60,60) + white stripes
  HingeConstraint opens arm (0 to 90 degrees)
- BarrierPost: Size Vector3.new(0.4, 2, 0.4), Metal
- PaySignLeft: SurfaceGui with TextLabel "TOLL 1 TOKEN"
- PaySignRight: mirror
- TrafficConeA: Size Vector3.new(0.6, 1.2, 0.6), Neon RGB(255,100,0)
- TrafficConeB: mirror
- GroundMarkings: Size Vector3.new(8, 0.1, 0.5), Neon yellow lines

Auto-open on approach using Region3 or Part.Touched:
  local debounce = {}
  tollSensor.Touched:Connect(function(hit)
      local char = hit.Parent
      if not char:FindFirstChild("Humanoid") then return end
      if debounce[char] then return end
      debounce[char] = true
      -- Open barrier
      barrierHinge.TargetAngle = 90
      task.wait(3)
      barrierHinge.TargetAngle = 0
      task.wait(2)
      debounce[char] = nil
  end)

--- CAR WASH SYSTEM ---
Structure (18 parts):
- WashTunnelLeft: Size Vector3.new(16, 5, 0.5), Concrete, RGB(100,150,200)
- WashTunnelRight: mirror
- WashTunnelRoof: Size Vector3.new(16, 0.5, 8)
- WashCurtainA (foam, 3): Size Vector3.new(0.5, 4, 7.5), Plastic, Transparency 0.5, RGB(255,255,255)
- SpinnerBrushLeft (2): Size Vector3.new(0.8, 4, 0.8), Cylinder, Plastic, RGB(200,100,200)
- SpinnerBrushRight (2): mirror
- WaterNozzleBar (2): Size Vector3.new(0.3, 0.3, 7.5), Metal, horizontal bar of nozzles
- DryerBlowerLeft: Size Vector3.new(1.5, 3, 0.5), Metal
- DryerBlowerRight: mirror
- ConveyorBelt: Size Vector3.new(14, 0.3, 4), Concrete, dark, moves car through
- EntrySign: SurfaceGui "Car Wash 2 Tokens"
- PayPad: ProximityPrompt triggers wash sequence

Wash animation sequence (5 steps, total 15 seconds):
  1. Car enters on conveyor (BodyVelocity X axis slow push)
  2. SpinnerBrushes rotate (CFrame * CFrame.Angles each frame)
  3. WaterNozzles fire ParticleEmitter (water droplets)
  4. Foam curtains visible
  5. DryerBlowers active (sound effect), car exits

--- PARKING LOT ---
Layout: 20 studs x 10 studs per space, white lined
- ParkingSpace: Size Vector3.new(20, 0.1, 10), Concrete, RGB(60,60,60)
- SpaceLineLeft: Size Vector3.new(20, 0.1, 0.3), RGB(255,255,255), at left edge
- SpaceLineRight: mirror
- HdcpSymbol: SurfaceGui on floor for accessible spaces
- Bumper stop: Size Vector3.new(6, 0.4, 0.4), Concrete, at head of space

4x10 lot (40 spaces total), center driving aisle 14 studs wide

Parking detection:
  local parkZone = workspace.ParkingZone  -- invisible Part covering lot
  parkZone.Touched:Connect(function(hit)
      if hit.Name == "WheelRearLeft" then
          local car = hit:FindFirstAncestorWhichIsA("Model")
          if car then
              -- Register car as parked, save position
          end
      end
  end)

--- RACETRACK CONSTRUCTION ---
Oval track: 200 studs long, 80 studs wide, banked turns 15 degrees

Straight sections (2 segments of 80 studs each):
  - TrackStraight: Size Vector3.new(80, 0.5, 20), Concrete, RGB(50,50,50)
  - InnerWallStraight: Size Vector3.new(80, 2, 0.5), Concrete, RGB(200,200,200)
  - OuterWallStraight: mirror 20 studs out

Banked turn (4 segments of 15 degree arc each):
  - TurnSegment: Size Vector3.new(25, 0.5, 20)
    CFrame.Angles(math.rad(15), math.rad(angle), 0) for banking + rotation
  - InnerWallTurn, OuterWallTurn per segment

Pit lane (parallel to main straight):
  - PitLane: Size Vector3.new(80, 0.5, 8), Concrete
  - PitWall: Size Vector3.new(80, 1.5, 0.5)
  - PitBoxes (10): Size Vector3.new(8, 0, 8) floor areas, no walls
  - PitBoxNumber: SurfaceGui on floor

Grandstand (spectator stand facing main straight):
  - StandBase: Size Vector3.new(80, 1, 20), Concrete
  - BleacherTier1: Size Vector3.new(78, 0.5, 6), 0.5 above base, stepped back 1 stud
  - BleacherTier2: Size Vector3.new(76, 0.5, 6), 1.5 above base, 2 studs back
  - BleacherTier3: Size Vector3.new(74, 0.5, 6), 2.5 above base, 4 studs back
  - SeatsPerTier: Seat instances spaced 1.5 studs apart
  - Roof: Size Vector3.new(80, 0.5, 22), Metal, angled for coverage

--- VEHICLE PHYSICS EDGE CASES ---

Problem: Car flips on hard turns
Fix: Lower center of mass (ballast part). Increase BodyGyro MaxTorque X and Z axes.
Specific values: MaxTorque = Vector3.new(8e5, 0, 8e5), P = 500000

Problem: Car bounces wildly on bumps
Fix: Increase SpringConstraint Damping value (try 800-1200 for sedan).
Also reduce MaxSpeed so impacts are less severe.

Problem: Car sinks into ground
Fix: Check wheel radius matches Cylinder mesh dimensions.
Wheel Size Vector3.new(1, 2.2, 2.2) = radius 1.1 studs.
Floor surface must be above Y where wheel center sits.

Problem: Car slides sideways at low speed
Fix: Add minimum speed threshold for BodyAngularVelocity: only steer if math.abs(speed) > 3.
Also ensure WheelPhysicalProperties friction is 0.9 not 0.1.

Problem: Helicopter drifts when releasing controls
Fix: Add damping to lateral BodyVelocity: lerp velocity toward 0 when no input.
lateralVel.Velocity = lateralVel.Velocity * 0.9  -- each frame, decays

Problem: Boat spins in circles
Fix: BodyAngularVelocity.AngularVelocity must be multiplied by speed ratio.
No speed = no turning. Boats cannot turn while stationary (no water push on rudder).

Problem: Train derails on curves
Fix: Use smooth waypoint interpolation. Avoid sharp angle changes between waypoints.
Minimum 15 studs between waypoints on curves.

Problem: Propeller airplane falls on takeoff
Fix: Increase lift coefficient and lower stall speed.
liftCoeff = 0.12 (up from 0.08). stallSpeed = 15 (down from 20).

Problem: Rocket spins out of control
Fix: BodyGyro P value too low. Increase to 500000 minimum.
Also MaxTorque must be Vector3.new(5e5, 5e5, 5e5).

--- VEHICLE NETWORKING (MULTIPLAYER) ---

All vehicle physics run on SERVER for authoritative state.
LocalScripts handle camera and input only.
Use RemoteEvents to send input from client to server.

RemoteEvent setup:
  -- Client:
  local inputEvent = game.ReplicatedStorage.VehicleInput
  RunService.Heartbeat:Connect(function()
      inputEvent:FireServer(throttle, steer, handbrake, nitro)
  end)

  -- Server:
  inputEvent.OnServerEvent:Connect(function(player, throttle, steer, handbrake, nitro)
      local car = getCarForPlayer(player)
      if not car then return end
      updateCarPhysics(car, throttle, steer, handbrake, nitro, dt)
  end)

Lag compensation: server applies received inputs immediately, trusts client.
For anti-cheat: validate speed never exceeds maxSpeed * 1.2 (20% tolerance for lag).
If exceeded, reset car velocity to zero.

Car ownership:
  car:SetAttribute("OwnerId", player.UserId)
  -- Only allow input from matching OwnerId
  if player.UserId ~= car:GetAttribute("OwnerId") then return end

--- SOUND LIBRARY FOR VEHICLES ---
Real Roblox asset IDs for vehicle sounds:

Engine sounds:
  Idle:           rbxassetid://2645425045
  RevHigh:        rbxassetid://138249019
  SportsCar:      rbxassetid://1847641781
  Truck:          rbxassetid://1851791817
  Motorcycle:     rbxassetid://138250455

Horn sounds:
  CarHorn:        rbxassetid://9120363441
  TruckHorn:      rbxassetid://9120363462
  BikeHorn:       rbxassetid://131072910

Crash/impact:
  MetalCrash:     rbxassetid://260433368
  GlassBreak:     rbxassetid://154235138

Tire:
  Screech:        rbxassetid://255030170
  Gravel:         rbxassetid://1192830816

Boat:
  BoatEngine:     rbxassetid://1851791817
  WaterSplash:    rbxassetid://131313958

Aircraft:
  PropellerLoop:  rbxassetid://1847641781
  JetEngine:      rbxassetid://2861316892
  Rotorwash:      rbxassetid://1735974829

Train:
  SteamLoco:      rbxassetid://1851791817
  TrainHorn:      rbxassetid://9120363462
  RailClack:      rbxassetid://138249019

Siren:
  PoliceSiren:    rbxassetid://9120362436
  AmbulanceSiren: rbxassetid://9120362416
  FireTruck:      rbxassetid://9120362429

Sound playback per RPM:
  local sound = vehicleEngine  -- Sound instance
  RunService.Heartbeat:Connect(function()
      local speed = root.AssemblyLinearVelocity.Magnitude
      sound.PlaybackSpeed = 0.5 + (speed / maxSpeed) * 2.5
      sound.Volume = 0.3 + (speed / maxSpeed) * 0.6
  end)

--- LIVERY AND CUSTOMIZATION SYSTEM ---
Allow players to change vehicle color and add decals.

Color change:
  local function paintCar(car, colorRGB)
      local col = Color3.fromRGB(colorRGB.r, colorRGB.g, colorRGB.b)
      for _, part in ipairs(car:GetDescendants()) do
          if part:IsA("BasePart") and part:GetAttribute("Paintable") then
              part.Color = col
          end
      end
  end

  -- Tag paintable parts during build:
  mainBody:SetAttribute("Paintable", true)
  hood:SetAttribute("Paintable", true)
  -- Do NOT tag wheels, glass, or lights

Decal application:
  local function applyDecal(car, decalId, partName)
      local targetPart = car:FindFirstChild(partName)
      if not targetPart then return end
      local decal = Instance.new("Decal")
      decal.Texture = "rbxassetid://" .. tostring(decalId)
      decal.Face = Enum.NormalId.Front
      decal.Parent = targetPart
  end

Number plate text:
  local function setPlateText(car, text)
      local plate = car:FindFirstChild("NumberPlateFront")
      if not plate then return end
      local sg = plate:FindFirstChildWhichIsA("SurfaceGui") or Instance.new("SurfaceGui", plate)
      sg.Face = Enum.NormalId.Front
      local label = sg:FindFirstChildWhichIsA("TextLabel") or Instance.new("TextLabel", sg)
      label.Size = UDim2.new(1, 0, 1, 0)
      label.Text = text
      label.TextColor3 = Color3.fromRGB(20, 20, 20)
      label.Font = Enum.Font.GothamBold
      label.TextScaled = true
      label.BackgroundColor3 = Color3.fromRGB(255, 255, 200)
  end

--- VEHICLE LEADERBOARD / RACING STATS ---
Track lap times, top speed, distance traveled.

local stats = {}
stats[player.UserId] = {
    lapTime = 0,
    bestLap = math.huge,
    topSpeed = 0,
    laps = 0,
    distance = 0,
}

RunService.Heartbeat:Connect(function(dt)
    local s = stats[player.UserId]
    if not s then return end
    local speed = root.AssemblyLinearVelocity.Magnitude
    s.topSpeed = math.max(s.topSpeed, speed)
    s.distance = s.distance + speed * dt
    s.lapTime = s.lapTime + dt
end)

On lap complete:
  local s = stats[player.UserId]
  if s.lapTime < s.bestLap then
      s.bestLap = s.lapTime
      print("New best lap: " .. string.format("%.2f", s.bestLap) .. "s")
  end
  s.lapTime = 0
  s.laps = s.laps + 1

Leaderboard GUI: SurfaceGui on board in world, or ScreenGui sorted by fastest lap.

--- VEHICLE GRAVITY AND PLANET SCALE ---
Default workspace.Gravity = 196.2 studs/sec^2 (matches Earth roughly at Roblox scale)
For moon level: workspace.Gravity = 32
For heavy planet: workspace.Gravity = 500

All BodyForce buoyancy and lift calculations use workspace.Gravity dynamically:
  local g = workspace.Gravity  -- always read live, not hardcoded

If gravity changes mid-game (e.g., entering low-gravity zone via Region3):
  workspace.Gravity = 50  -- server only, replicates to clients
  -- All physics update automatically — BodyForce needs manual recalculation

Gravity zone using Part with Touched:
  gravityZone.Touched:Connect(function()
      workspace.Gravity = 40  -- moon zone
  end)
  gravityZone.TouchEnded:Connect(function()
      workspace.Gravity = 196.2  -- restore
  end)
`;

export const VEHICLE_SPECIAL_MECHANICS: string = `
=== SPECIAL VEHICLE MECHANICS AND SYSTEM RECIPES ===

--- TOWING AND TRAILER SYSTEM ---
Attach a trailer behind a truck or car using a HingeConstraint at hitch point.

Trailer structure (20 parts):
- TrailerFrame: Size Vector3.new(16, 0.6, 5), Metal, the PrimaryPart
- TrailerBed: Size Vector3.new(15, 0.4, 4.8), Wood or Metal, flat deck
- TrailerWallFront: Size Vector3.new(0.3, 2, 5), front wall
- TrailerWallLeft: Size Vector3.new(15, 2, 0.3), side
- TrailerWallRight: mirror
- TrailerWallRear: Size Vector3.new(0.3, 2, 5) with HingeConstraint gate
- TailLightLeft: Size Vector3.new(0.3, 0.5, 0.8), Neon RGB(220,20,20)
- TailLightRight: mirror
- TrailerAxle: Size Vector3.new(0.3, 0.3, 5.5), axle bar
- TrailerWheelLeft (2): Size Vector3.new(0.8, 1.6, 1.6), Granite
- TrailerWheelRight (2): mirror
- HitchSocket: Size Vector3.new(0.6, 0.6, 0.6), Metal, front center of trailer
- JackStandLeft: Size Vector3.new(0.3, 2, 0.3), Metal, retracts when hitched
- JackStandRight: mirror

Hitch connection code:
  local hinge = Instance.new("HingeConstraint")
  hinge.LimitsEnabled = true
  hinge.UpperAngle = 60    -- trailer can swing 60 degrees left
  hinge.LowerAngle = -60   -- and right (prevents jackknife beyond this)
  hinge.ActuatorType = Enum.ActuatorType.None
  hinge.Attachment0 = truckHitchAttachment      -- at truck tow hitch
  hinge.Attachment1 = trailerSocketAttachment    -- at trailer front
  hinge.Parent = truckModel

  -- Also add BallSocketConstraint for vertical freedom (trailer bounces independently):
  local ball = Instance.new("BallSocketConstraint")
  ball.Attachment0 = truckHitchAttachment
  ball.Attachment1 = trailerSocketAttachment
  ball.LimitsEnabled = true
  ball.MaxFrictionTorque = 0
  ball.UpperAngle = 30   -- max vertical tilt 30 degrees
  ball.Parent = truckModel

--- HOVER VEHICLE (Maglev / Sci-Fi Speeder) ---
Floats above ground using downward raycast + BodyForce upward.

Hover bike structure (15 parts):
- FuselagePod: Size Vector3.new(6, 1, 2), Metal, sleek
- NoseCone: Size Vector3.new(2, 0.8, 1.8), SpecialMesh Sphere
- ThrusterLeft: Size Vector3.new(1, 0.8, 0.8), Cylinder, Neon RGB(0,150,255)
- ThrusterRight: mirror
- ThrusterGlowLeft: Size Vector3.new(0.7, 0.7, 0.3), Neon RGB(0,200,255), inside thruster
- ThrusterGlowRight: mirror
- FootpadLeft: Size Vector3.new(2, 0.2, 1), flat landing pad below
- FootpadRight: mirror
- ControlVanes (4): Size Vector3.new(0.1, 0.8, 0.5), fins on sides and top/bottom
- GlowUnderLeft: Size Vector3.new(5, 0.1, 0.8), Neon RGB(0,100,255), underside glow strip
- GlowUnderRight: mirror

Hover physics:
  local hoverHeight = 3   -- studs above ground
  local hoverForce = Instance.new("BodyForce")
  hoverForce.Parent = fusePod

  local hoverDamp = Instance.new("BodyVelocity")
  hoverDamp.MaxForce = Vector3.new(0, 2e5, 0)
  hoverDamp.P = 5000
  hoverDamp.Parent = fusePod

  RunService.Heartbeat:Connect(function(dt)
      local origin = fusePod.Position + Vector3.new(0, 1, 0)
      local rayResult = workspace:Raycast(origin, Vector3.new(0, -(hoverHeight + 2), 0))
      local groundDist = rayResult and rayResult.Distance or (hoverHeight + 2)

      -- Spring force toward target height
      local error = hoverHeight - groundDist
      local mass = fusePod.AssemblyMass
      local springK = 3000
      local damping = 200

      local vertVel = fusePod.AssemblyLinearVelocity.Y
      local force = springK * error - damping * vertVel
      hoverForce.Force = Vector3.new(0, mass * workspace.Gravity + force, 0)
  end)

--- WATER JET SKI (12 parts) ---
Dimensions: 4 studs long, 1.5 studs wide, 1.5 studs tall
Color palette: RGB(255,100,0) orange / RGB(40,40,40) black / RGB(255,255,255) white

- HullMain: Size Vector3.new(4, 0.8, 1.5), Plastic, orange
- HullBow: Size Vector3.new(1, 0.8, 1.4), tapered front
- EngineHump: Size Vector3.new(2, 0.6, 1.3), raised rear deck, Plastic
- HandlebarLeft: Size Vector3.new(0.1, 0.1, 0.6), Metal
- HandlebarRight: mirror
- VehicleSeat: MaxSpeed 55, Torque 30, TurnSpeed 2.5, straddle-style
- IntakeGrille: Size Vector3.new(0.5, 0.3, 0.4), Concrete, bottom center
- JetNozzle: Size Vector3.new(0.4, 0.3, 0.3), rear center, steerable
- JetNozzleGrille: Size Vector3.new(0.3, 0.2, 0.3), Concrete, inside nozzle
- FootTrayLeft: Size Vector3.new(2, 0.15, 0.6), flat standing platform
- FootTrayRight: mirror
- WakeParticle: ParticleEmitter child of HullMain, white spray, Rate increases with speed

Movement: BodyVelocity for thrust, BodyAngularVelocity for jet nozzle yaw, buoyancy for float

--- CABLE CAR / GONDOLA ---
Suspended cabin that travels along a fixed cable between two towers.

Towers (each 10 parts):
- TowerBase: Size Vector3.new(4, 1, 4), Concrete
- TowerShaft: Size Vector3.new(1.5, 20, 1.5), Metal, Color RGB(180,180,180)
- TowerCrossbeamLeft: Size Vector3.new(0.5, 0.5, 6), Metal
- TowerCrossbeamRight: mirror
- TowerPulleyLeft: Size Vector3.new(0.8, 0.8, 0.8), Cylinder, Metal
- TowerPulleyRight: mirror

Cable (visible rope):
- CableMain: Size Vector3.new(0.2, 0.2, distance), Metal, RGB(80,80,80)
  Positioned along travel path, slightly catenary sag achieved by multiple segments

Gondola cabin (12 parts):
- CabinBody: Size Vector3.new(4, 3, 3), Metal, blue/red livery
- CabinRoof: Size Vector3.new(4.5, 0.3, 3.5)
- CabinGlassLeft: Size Vector3.new(3.5, 2, 0.1), Glass, Transparency 0.2
- CabinGlassRight: mirror
- CabinGlassFront: Size Vector3.new(0.1, 2, 3), Glass
- CabinGlassRear: mirror
- DoorLeft: Size Vector3.new(0.1, 2.5, 1.5), hinged
- DoorRight: mirror
- HangerRod: Size Vector3.new(0.3, 2, 0.3), Metal, connecting cabin to trolley
- TrolleyFrame: Size Vector3.new(2, 0.5, 1), Metal, on top of hanger
- TrolleyWheelLeft (2): Size Vector3.new(0.4, 0.4, 0.4), on cable groove
- TrolleyWheelRight (2): mirror

Movement: AlignPosition moves gondola along cable path waypoints
  local t = (tick() - startTime) / journeyDuration
  local pos = Vector3.new(
      math.lerp(towerAPos.X, towerBPos.X, t),
      math.lerp(towerAPos.Y, towerBPos.Y, t) - math.sin(t * math.pi) * 3,  -- cable sag
      math.lerp(towerAPos.Z, towerBPos.Z, t)
  )
  gondola:SetPrimaryPartCFrame(CFrame.new(pos))

--- ESCALATOR / MOVING WALKWAY ---
For airports, malls, and stations.

Walkway structure (8 parts):
- WalkwayFloor: Size Vector3.new(20, 0.3, 3), Metal, RGB(180,180,180)
- WalkwaySideLeft: Size Vector3.new(20, 1.5, 0.3), Glass, Transparency 0.3
- WalkwaySideRight: mirror
- HandrailLeft: Size Vector3.new(20, 0.2, 0.2), on top of side glass, Metal, black rubber look = Granite
- HandrailRight: mirror
- EntryRamp: Size Vector3.new(3, 0.3, 3), angled CFrame.Angles(math.rad(-10),0,0)
- ExitRamp: mirror, opposite angle
- Belt (visual): Size Vector3.new(18, 0.1, 2.8), Plastic, textured, Transparency 0.0

Movement: Part on walkway hits -> add horizontal BodyVelocity push to characters
  walkway.Touched:Connect(function(hit)
      local hrp = hit.Parent:FindFirstChild("HumanoidRootPart")
      if hrp then
          local push = Instance.new("BodyVelocity")
          push.Velocity = Vector3.new(3, 0, 0)  -- direction of walkway
          push.MaxForce = Vector3.new(5000, 0, 0)
          push.P = 2000
          push.Parent = hrp
          game:GetService("Debris"):AddItem(push, 0.1)  -- re-apply each 0.1s
      end
  end)

--- BUMPER CARS ---
Electric bumper car for fair / carnival rides.

Part list (14 parts):
- CarBody: Size Vector3.new(4, 1, 3), Plastic, bright color, round edges via SpecialMesh
- BumperRingFront: Size Vector3.new(4.8, 0.8, 0.5), Plastic, black, thick rubber bumper
- BumperRingRear: mirror
- BumperRingSideLeft: Size Vector3.new(0.5, 0.8, 3.8), Plastic, black
- BumperRingSideRight: mirror
- CeilingPole: Size Vector3.new(0.2, 3, 0.2), Metal, telescoping
- ElectricContactTop: Size Vector3.new(0.3, 0.5, 0.3), Metal, touches ceiling grid
- VehicleSeat: MaxSpeed 8, Torque 15, TurnSpeed 2.0
- SteeringWheel: Size Vector3.new(0.1, 0.6, 0.6)
- WheelFrontLeft: Size Vector3.new(0.4, 0.8, 0.8), Granite
- WheelFrontRight: mirror
- WheelRearLeft: same
- WheelRearRight: mirror

Arena floor: Size Vector3.new(40, 0.5, 40), Concrete, smooth
Ceiling grid: Size Vector3.new(40, 0.3, 40) with SurfaceGui grid pattern

Collision response: Touched event detects other bumper cars, apply opposite BodyVelocity burst

--- AMPHIBIOUS VEHICLE ---
Drives on land AND floats on water. Switches mode automatically.

Detection: Raycast downward, check if hit surface is tagged "Water"
Land mode: standard car physics (BodyVelocity forward, wheels drive)
Water mode: switch to boat physics (buoyancy BodyForce, propeller thrust)

Transition script:
  local function detectMode()
      local ray = workspace:Raycast(root.Position + Vector3.new(0,0.5,0), Vector3.new(0,-2,0))
      if ray and ray.Instance:GetAttribute("IsWater") then
          return "water"
      end
      return "land"
  end

  RunService.Heartbeat:Connect(function(dt)
      local mode = detectMode()
      if mode == "water" then
          -- Enable buoyancy
          buoyForce.Force = Vector3.new(0, mass * workspace.Gravity * 1.05, 0)
          -- Disable wheel friction (wheels spin freely in water)
          for _, axle in ipairs(wheelAxles) do axle.MotorMaxTorque = 0 end
          -- Enable propeller thrust
          bv.Velocity = root.CFrame.LookVector * throttle * waterSpeed
      else
          -- Disable buoyancy
          buoyForce.Force = Vector3.new(0, 0, 0)
          -- Enable wheel drive
          for _, axle in ipairs(wheelAxles) do axle.MotorMaxTorque = 1000 end
          -- Normal car physics
          bv.Velocity = root.CFrame.LookVector * throttle * landSpeed
      end
  end)

--- AIRCRAFT CARRIER (MEGA BUILD, 100 parts) ---
Dimensions: 80 studs long, 20 studs wide, 6 studs hull height, flight deck 3 studs above waterline
Color palette: RGB(130,140,130) naval gray / RGB(80,90,80) dark gray / RGB(255,220,0) deck markings

Hull:
- HullPort: Size Vector3.new(78, 5, 0.8), Metal, naval gray, angled sides
- HullStarboard: mirror
- HullBottom: Size Vector3.new(78, 1.5, 20), Metal
- BowCap: Size Vector3.new(4, 5, 20), angled bow
- SternCap: Size Vector3.new(3, 5, 20), flat stern

Flight deck (angled):
- FlightDeckMain: Size Vector3.new(75, 0.5, 18), Concrete, gray
- AngledeckLeft: Size Vector3.new(35, 0.5, 10), angled 9 degrees to port
- DeckStripeCenter: Size Vector3.new(75, 0.1, 0.5), Neon RGB(255,220,0)
- RunwayMarkings (4): Size Vector3.new(30, 0.1, 0.8), Neon white, touchdown zone
- JetBlastDeflector (3): Size Vector3.new(8, 3, 0.3), hinged panel rises before launch
- CatapultTrackLeft: Size Vector3.new(30, 0.2, 0.4), Metal, steam catapult groove
- CatapultTrackRight: mirror
- ArrestingWires (4): Size Vector3.new(0.1, 0.1, 18), Metal, thin cross-deck cables

Island superstructure:
- IslandBase: Size Vector3.new(8, 12, 10), Metal, on starboard side
- Bridge: Size Vector3.new(7, 3, 9), top of island, Glass windscreen forward
- RadarMastA: Size Vector3.new(0.5, 8, 0.5), Metal
- RadarDishA: Size Vector3.new(4, 0.3, 4), rotating radar, Metal
- RadioMasts (3): Size Vector3.new(0.2, 6, 0.2), antenna rods
- StackExhaust: Size Vector3.new(2, 3, 1.5), angled, Metal, exhaust grill

Weapons:
- CIWSMount (2): Size Vector3.new(1.5, 1.5, 1.5), Metal, radar-directed gun mounts
- CIWSBarrel (6): Size Vector3.new(0.3, 0.3, 1.5), Cylinder, rapid fire barrels

Below deck elevators (2):
- ElevatorPlatform: Size Vector3.new(14, 0.5, 14), Metal, flush with deck
- ElevatorRails (4): Size Vector3.new(0.3, 12, 0.3), Metal, vertical travel
  Elevator moves via TweenService: Y + 12 to surface, Y - 12 below deck

Propulsion (4 shafts):
- PropShaftLeft (2): Size Vector3.new(0.5, 0.5, 8), Metal, below stern
- PropShaftRight (2): mirror
- PropellerBlades (4 per shaft): Size Vector3.new(0.4, 4, 0.8), Metal, large naval props

Movement: BodyVelocity very slow (max 15 knots = 8 studs/s), BodyAngularVelocity slow turns
Buoyancy: Large BodyForce, high mass, use multiple BodyForce instances spread across hull for stability

--- VEHICLE DAMAGE STATES (VISUAL TIERS) ---

Tier 1 (100-75% health): No visual change, normal appearance
Tier 2 (75-50% health):
  - Add smoke ParticleEmitter to engine area: Rate=5, Color gray
  - Headlight Materials change to Metal (flickering)

Tier 3 (50-25% health):
  - Heavier smoke: Rate=15, darker color
  - Body Color darkened: lerp toward RGB(40,40,40)
  - Body Parts slightly deformed: Size *= Vector3.new(1.05, 0.95, 1.02) (random small change)

Tier 4 (25-10% health):
  - Fire ParticleEmitter: Rate=20, Size=3
  - Sound: crackling fire audio
  - SpotLights disabled

Tier 5 (0% health):
  - Explosion: Instance.new("Explosion") at position, BlastRadius=12, BlastPressure=400000
  - All Parts: Material = Enum.Material.Metal, Color = RGB(30,20,10) charred
  - Anchored = true (dead car stops in place)
  - task.delay(5, car.Destroy, car)

Repair station: ProximityPrompt "Repair (5 Tokens)", restores health to 100, resets all visual tiers

=== VEHICLE CONSTRUCTION DO AND DO NOT ===

DO:
- Use WeldConstraint for ALL static part connections
- Set Model.PrimaryPart to the main chassis part
- Use Enum.Material.Metal for all metal surfaces
- Use Enum.Material.Granite for all rubber/tire surfaces
- Use Enum.Material.Glass for all transparent windows
- Use Enum.Material.Neon for lights, glows, and emissive surfaces
- Use Enum.Material.Wood for all wooden parts
- Use Enum.Material.Concrete for bumpers, road, station platforms
- Set VehicleSeat.HeadsUpDisplay = false and build custom HUD
- Use CylindricalConstraint for wheel spin
- Use HingeConstraint for steering, doors, hinged panels
- Use SpringConstraint for suspension
- Set CollisionGroup so wheels do not collide with body
- Add BodyGyro to keep vehicle upright
- Add ballast part at floor level for low center of mass
- Use ParticleEmitter for exhaust smoke, tied to engine RPM
- Use SpotLight inside headlight parts with Face = NormalId.Front
- Use Sound inside vehicle parts for engine, horn, crash sounds
- Use ProximityPrompt for all interactive vehicle elements
- Name all parts consistently for script access by name

DO NOT:
- Use Enum.Material.SmoothPlastic on any part
- Anchor the PrimaryPart (it must be unanchored to move)
- Use Motor6D for static connections (use WeldConstraint instead)
- Build single-part vehicles (minimum 15 parts for any vehicle)
- Set VehicleSeat as the PrimaryPart (it will misalign on occupant)
- Forget to set CollisionGroup (causes body/wheel collision jitter)
- Use BodyPosition for vehicle movement (use BodyVelocity instead)
- Run physics loops on LocalScript server-side (desync)
- Place LocalScripts inside Model without StarterCharacterScripts safety
- Use Workspace.CurrentCamera manipulation from Server scripts
- Leave Fire or Explosion instances parented to nil (memory leak)
- Chain too many nested Models (causes lookup performance issues)
- Use SetPrimaryPartCFrame while parts are unanchored and physics active (causes snap issues, prefer BodyVelocity and BodyGyro instead for moving vehicles)
`;

export const VEHICLE_DETAILED_PARTS: string = `
=== DETAILED PART RECIPES — EVERY COMPONENT BROKEN DOWN ===

--- WHEEL ASSEMBLY (Complete) ---
A correct wheel assembly requires 5 components working together:

1. WheelPart (visible tire):
   Type: Part with SpecialMesh
   SpecialMesh.MeshType = Enum.MeshType.Cylinder
   Size: Vector3.new(0.9, 2.2, 2.2)   -- thickness, diameter, diameter
   Material: Enum.Material.Granite
   Color: RGB(25,25,25)
   CanCollide: true
   Mass-related: leave CustomPhysicalProperties default unless tuning grip

2. WheelHubCap (cosmetic center):
   Type: Part with SpecialMesh Sphere or Cylinder
   Size: Vector3.new(0.2, 1.2, 1.2)
   Material: Enum.Material.Metal
   Color: RGB(180,180,180) chrome silver
   CanCollide: false
   WeldConstraint to WheelPart

3. Axle Attachment on Chassis:
   Type: Attachment inside chassis Part
   CFrame: positioned at wheel center X position
   Orientation: X axis pointing outward along axle direction
   Name: "AxleAttachment_FrontLeft" (descriptive)

4. Wheel Attachment:
   Type: Attachment inside WheelPart
   CFrame: at center of wheel
   Orientation: X axis matching chassis axle attachment

5. CylindricalConstraint:
   Attachment0: AxleAttachment on chassis
   Attachment1: WheelAttachment in wheel
   RotationAxisEnabled: true
   AngularLimitsEnabled: false
   LimitsEnabled: false
   For driven wheel: AngularActuatorType = Enum.ActuatorType.Motor, MotorMaxTorque = 1000
   For free wheel: AngularActuatorType = Enum.ActuatorType.None

--- DOOR ASSEMBLY (Complete) ---
A swinging door requires 4 components:

1. DoorPart:
   Size: Vector3.new(2.8, 1.8, 0.2) for car door
   Material: Enum.Material.Metal
   CanCollide: true

2. HingeAttachment0 (on car body at door hinge edge):
   Parent: chassis Part at door front edge
   CFrame: offset so hinge axis is vertical

3. HingeAttachment1 (on door):
   Parent: DoorPart at front edge
   CFrame: matching attachment0

4. HingeConstraint:
   Attachment0/1: as above
   LimitsEnabled: true
   LowerAngle: 0 (closed)
   UpperAngle: 90 (fully open)
   ActuatorType: Enum.ActuatorType.Servo for scripted open
   TargetAngle: 0 (closed) or 90 (open)
   ServoMaxTorque: 5000
   AngularSpeed: 3

Open/close door:
  hinge.TargetAngle = isOpen and 90 or 0

--- SUSPENSION ASSEMBLY (Complete) ---
Full 4-part suspension linkage:

1. UpperControlArm:
   Size: Vector3.new(2, 0.3, 0.3), Metal
   Hinged to chassis at inner end (HingeConstraint, vertical axis)
   Connected to spindle at outer end

2. LowerControlArm:
   Same, slightly longer, lower mount point

3. Spindle/Knuckle:
   Size: Vector3.new(0.6, 1.5, 0.6), Metal
   Connects upper and lower arms at ball joints (BallSocketConstraint)
   Holds wheel and brake rotor

4. SpringDamper (SpringConstraint):
   Attachment0: on chassis above lower arm
   Attachment1: on lower arm outboard point
   FreeLength: 2.5, Stiffness: 8000, Damping: 500

5. SteeringTieRod (front only):
   Size: Vector3.new(2, 0.15, 0.15), Metal
   Connected via BallSocketConstraint to steering rack at inner, spindle at outer
   Moves spindle (and wheel) side to side when rack moves

--- SEAT ASSEMBLY (Complete) ---
Both VehicleSeat and Seat (passenger) setup:

VehicleSeat:
  -- It is a Part subclass, has SeatPart and Occupant properties
  vehicleSeat.Size = Vector3.new(2, 1, 2)
  vehicleSeat.MaxSpeed = 60
  vehicleSeat.Torque = 20
  vehicleSeat.TurnSpeed = 1.5
  vehicleSeat.HeadsUpDisplay = false

  Weld to car chassis: WeldConstraint Part0=chassis, Part1=vehicleSeat

  SeatBack (cosmetic):
    Size: Vector3.new(0.2, 1.5, 2), Plastic
    WeldConstraint to vehicleSeat rear face

  Headrest:
    Size: Vector3.new(0.2, 0.6, 0.6), Plastic
    WeldConstraint to seatback top

Seat (passenger):
  seat.Size = Vector3.new(1.5, 0.5, 1.5)
  seat.Disabled = false
  -- Seat.Occupant is nil when empty
  seat:GetPropertyChangedSignal("Occupant"):Connect(function() ... end)

--- ENGINE ASSEMBLY (Visual) ---
Internal combustion engine detail parts:

EngineBlock:
  Size: Vector3.new(2.5, 1.8, 2), Metal, RGB(60,60,60)

Cylinder heads (4 or 6):
  Size: Vector3.new(2.5, 0.5, 0.4) each, Metal, top of block
  Offset evenly spaced along block top

ValveCover:
  Size: Vector3.new(2.4, 0.4, 0.35), Metal, black or chrome
  CFrame slightly above cylinder head

AirIntake:
  Size: Vector3.new(0.8, 0.8, 0.8), Metal, top center
  Short snout or bonnet scoop look

Alternator:
  Size: Vector3.new(0.8, 0.8, 0.8), Cylinder, Metal
  Attached to block side front

Serpentine belt (visual):
  Size: Vector3.new(0.1, 0.1, 2), Plastic, black, connecting pulleys

Exhaust Manifold:
  Size: Vector3.new(2, 0.4, 0.4), Metal, RGB(120,80,40) heat discoloration
  Bends toward exhaust pipe

Oil Filter:
  Size: Vector3.new(0.4, 0.7, 0.4), Cylinder, Metal, black

--- BRAKE ROTOR AND CALIPER ---
For sports cars and detailed vehicles:

BrakeRotor:
  Size: Vector3.new(0.2, 2, 2), SpecialMesh Cylinder
  Material: Enum.Material.Metal
  Color: RGB(80,80,80)
  Positioned inside wheel, concentric
  WeldConstraint to WheelPart (rotates with wheel)

BrakeCaliper:
  Size: Vector3.new(0.8, 1.2, 0.6), Metal, RGB(180,30,30) for performance look or RGB(120,120,120) standard
  WeldConstraint to chassis (stays fixed while rotor spins through it)
  CanCollide: false

Brake pad wear visual (optional):
  As damage accumulates: caliper color fades from red to orange, eventually gray

--- HEADLIGHT ASSEMBLY (Complete) ---
Full headlight with housing, lens, bulb, and light sources:

HeadlightHousing:
  Size: Vector3.new(0.4, 0.8, 1.5), Plastic, body color
  CanCollide: false

HeadlightLens (neon when on):
  Size: Vector3.new(0.3, 0.7, 1.3), Glass, Transparency 0.2
  Material: Enum.Material.Glass when off
  Material: Enum.Material.Neon when on, Color RGB(255,255,200)

DRLAccent (daytime running light strip):
  Size: Vector3.new(0.1, 0.1, 1.2), Neon, RGB(255,255,255), always on

SpotLight instance inside HeadlightLens:
  Brightness: 5
  Range: 60
  Angle: 45
  Color: RGB(255,255,220)
  Face: Enum.NormalId.Front
  Enabled: false until headlights toggled

PointLight for ambient glow near headlight:
  Brightness: 1.5
  Range: 10
  Color: RGB(255,255,200)
  Enabled: false until headlights toggled

--- EXHAUST SYSTEM (Complete) ---
Full exhaust from manifold to tip:

DownPipe:
  Size: Vector3.new(0.3, 0.3, 2), Cylinder, Metal, exits engine
  First section of exhaust

CatalyticConverter:
  Size: Vector3.new(0.8, 0.5, 0.5), Metal, under car mid-body
  Slightly fatter than pipes

MidPipe:
  Size: Vector3.new(0.25, 0.25, 5), Cylinder, Metal, long run under car

Muffler:
  Size: Vector3.new(1.2, 0.6, 0.6), Cylinder, Metal, oval canister
  Offset near rear axle

TailPipe:
  Size: Vector3.new(0.3, 0.3, 1.5), Cylinder, Metal, exits rear bumper area

TipEnd (exhaust tip):
  Size: Vector3.new(0.5, 0.5, 0.3), Cylinder, Metal, RGB(180,180,180) chrome or RGB(20,20,20) black

ExhaustParticle (ParticleEmitter inside TipEnd):
  Texture: rbxassetid://1401307091   -- smoke puff
  Rate: 3 at idle, up to 30 at full throttle
  Speed: NumberRange.new(2, 5)
  Lifetime: NumberRange.new(0.5, 2)
  Size: NumberSequence.new({NumberSequenceKeypoint.new(0, 0.5), NumberSequenceKeypoint.new(1, 2)})
  Color: ColorSequence.new(Color3.fromRGB(80,80,80))
  Transparency: NumberSequence.new({NumberSequenceKeypoint.new(0, 0.6), NumberSequenceKeypoint.new(1, 1)})
  EmissionDirection: Enum.NormalId.Front  -- emit forward (rearward from tip perspective)

--- INTERIOR DASHBOARD (Complete) ---
For visible interiors through windshield:

Dashboard:
  Size: Vector3.new(0.3, 1, 4.5), Plastic, RGB(20,20,20)
  Positioned below windshield inside cabin

InstrumentCluster:
  Size: Vector3.new(0.2, 0.6, 1.5), Plastic, dark
  SurfaceGui on front face: shows speedometer, RPM, gear

SpeedometerGauge (circular):
  ImageLabel with speedometer dial asset, or TextLabel with speed number
  Updates every Heartbeat from server via RemoteEvent

CenterConsole:
  Size: Vector3.new(0.3, 0.8, 1.2), Plastic, black
  Between driver and passenger seats
  Cupholder (2): Size Vector3.new(0.4, 0.3, 0.4), Cylinder, Metal

GearShiftKnob:
  Size: Vector3.new(0.3, 0.6, 0.3), Cylinder, Plastic, black
  On console, small spherical top

InfotainmentScreen:
  Size: Vector3.new(0.1, 0.6, 0.8), Glass, SurfaceGui showing map or music
  Transparency: 0.1

HVAC vents (3):
  Size: Vector3.new(0.2, 0.2, 0.3), Concrete, horizontal slots

Glove box:
  Size: Vector3.new(0.2, 0.5, 1), Plastic, passenger side

SunVisorLeft:
  Size: Vector3.new(0.05, 0.3, 0.8), Plastic, beige
  Hinged at windshield header, folds down

RearviewMirror:
  Size: Vector3.new(0.05, 0.3, 0.6), Metal
  Mounted at top center of windshield interior

--- CONVERTIBLE TOP ---
Retractable soft-top for roadster or convertible:

TopFrame (3 bows):
  FrameBowA: Size Vector3.new(0.2, 0.2, 4.4), Metal, front of top
  FrameBowB: same, middle
  FrameBowC: same, rear

TopFabric:
  Size: Vector3.new(4, 0.1, 4.4), Plastic, Transparency 0, Color RGB(40,40,40)
  Drapes over bows

Raised position: bows evenly spaced, forming arch
Lowered position: all three bows collapse rearward (TweenService CFrame animation)

Lowering sequence:
  local tween1 = TweenService:Create(bowC, TweenInfo.new(1), { CFrame = bowC.CFrame * CFrame.Angles(math.rad(-90), 0, 0) })
  local tween2 = TweenService:Create(bowB, TweenInfo.new(1), { CFrame = bowB.CFrame * CFrame.Angles(math.rad(-85), 0, 0) })
  local tween3 = TweenService:Create(bowA, TweenInfo.new(1), { CFrame = bowA.CFrame * CFrame.Angles(math.rad(-75), 0, 0) })
  tween1:Play()
  tween1.Completed:Connect(function() tween2:Play() end)
  tween2.Completed:Connect(function() tween3:Play() end)

--- LICENSE PLATE SYSTEM ---
Dynamic text plate on front and rear of vehicle:

FrontPlate:
  Size: Vector3.new(0.1, 0.7, 1.6), Plastic, RGB(255,255,200) yellow or white
  SurfaceGui on front face

PlateText (TextLabel inside SurfaceGui):
  Size: UDim2.new(1, 0, 1, 0)
  Text: "FOR3G" or player username abbreviation
  TextColor3: RGB(10,10,10)
  Font: Enum.Font.SourceSansBold
  TextScaled: true
  BackgroundTransparency: 1

State abbreviation stripe (decorative):
  Frame at top of SurfaceGui: Height UDim.new(0.25, 0), background RGB(0,80,200)
  TextLabel: "ROBLOX STATE", white, small

--- ODOMETER AND TRIP METER ---
Track real distance driven for achievements/stats.

local odometer = 0      -- lifetime miles/studs
local tripMeter = 0     -- resettable

RunService.Heartbeat:Connect(function(dt)
    if seat.Occupant then
        local vel = seat.AssemblyLinearVelocity.Magnitude
        local distThisFrame = vel * dt   -- studs this frame
        odometer = odometer + distThisFrame
        tripMeter = tripMeter + distThisFrame
    end
end)

-- Store odometer in DataStore:
local DataStoreService = game:GetService("DataStoreService")
local odometerStore = DataStoreService:GetDataStore("PlayerOdometer")

-- Save on leave:
game.Players.PlayerRemoving:Connect(function(player)
    pcall(function()
        odometerStore:SetAsync(tostring(player.UserId), odometer)
    end)
end)

-- Achievements based on distance:
if odometer > 10000 then  -- 10,000 studs driven
    -- Award "Road Warrior" badge
    local BadgeService = game:GetService("BadgeService")
    BadgeService:AwardBadge(player.UserId, ROAD_WARRIOR_BADGE_ID)
end
`;

export const VEHICLE_FINAL_REFERENCE: string = `
=== VEHICLE FINAL REFERENCE TABLES ===

--- VEHICLE SEAT VALUES BY TYPE ---
Go-kart:          MaxSpeed=80,  Torque=30,  TurnSpeed=2.5
Bicycle:          MaxSpeed=25,  Torque=10,  TurnSpeed=2.0
Motorcycle:       MaxSpeed=100, Torque=35,  TurnSpeed=2.2
Sports car:       MaxSpeed=120, Torque=45,  TurnSpeed=2.0
Sedan:            MaxSpeed=60,  Torque=20,  TurnSpeed=1.5
Police car:       MaxSpeed=75,  Torque=35,  TurnSpeed=1.8
SUV:              MaxSpeed=65,  Torque=50,  TurnSpeed=1.3
Pickup truck:     MaxSpeed=55,  Torque=60,  TurnSpeed=1.2
Ambulance:        MaxSpeed=60,  Torque=40,  TurnSpeed=1.4
Bus:              MaxSpeed=40,  Torque=120, TurnSpeed=0.6
Monster truck:    MaxSpeed=35,  Torque=200, TurnSpeed=0.8
Tank:             MaxSpeed=25,  Torque=400, TurnSpeed=0.5
Racing car:       MaxSpeed=200, Torque=80,  TurnSpeed=2.8
Tractor:          MaxSpeed=15,  Torque=200, TurnSpeed=0.6
Forklift:         MaxSpeed=10,  Torque=80,  TurnSpeed=0.8
Golf cart:        MaxSpeed=15,  Torque=15,  TurnSpeed=1.5
Bulldozer:        MaxSpeed=10,  Torque=300, TurnSpeed=0.4
Speedboat:        MaxSpeed=90,  Torque=60,  TurnSpeed=2.0
Jet ski:          MaxSpeed=55,  Torque=30,  TurnSpeed=2.5
Hover bike:       MaxSpeed=70,  Torque=0,   TurnSpeed=0  -- physics driven, seat for occupant only
Bumper car:       MaxSpeed=8,   Torque=15,  TurnSpeed=2.0
Submarine:        MaxSpeed=20,  Torque=0,   TurnSpeed=0  -- all physics driven

--- SPRING CONSTRAINT TUNING TABLE ---
Vehicle type:     Stiffness  Damping  FreeLength  MaxLength  MinLength
Bicycle:          2000       200      1.5         2.0        1.0
Motorcycle:       4000       350      2.0         2.8        1.3
Go-kart:          6000       400      1.0         1.5        0.6
Sports car:       12000      800      2.2         3.0        1.5
Sedan:            5000       400      2.5         3.5        1.5
SUV:              8000       600      2.8         4.0        1.8
Pickup truck:     15000      600      3.0         4.2        2.0
Monster truck:    3000       200      4.0         5.5        2.5
Bus:              20000      1200     3.5         4.5        2.5
Tank (roadwheel): 25000      800      2.0         2.8        1.2
Racing car:       18000      1000     1.8         2.5        1.2
Tractor:          10000      500      3.5         4.8        2.2

--- WHEEL SIZE TABLE ---
Vehicle:          Thickness  Diameter  Notes
Bicycle:          0.3        1.0       narrow road tire
Motorcycle:       0.4        2.0-2.2   front smaller, rear larger
Go-kart:          0.5        1.2       small square profile
Sports car:       1.0        2.6       wide low profile
Sedan:            1.0        2.2       standard all-season
SUV:              1.2        2.6       tall sidewall
Pickup truck:     1.2        2.8       LT tire
Monster truck:    1.5        5.0       massive ground clearance
Bus:              1.5        2.8       commercial service
Tank (drive):     0.8        2.0       road wheel, metal
Go-kart racing:   0.8        1.2       slick, no tread
Racing car:       0.8        2.8       wide slick
Tractor (front):  0.8        1.8       narrow guide wheel
Tractor (rear):   1.0        3.2       massive rear drive

--- PART COUNT TARGETS ---
Vehicle type:     Min parts  Target parts  Max parts (detail)
Bicycle:          8          14            20
Go-kart:          12         18            25
Motorcycle:       14         20            30
Small car/sedan:  20         25            40
Sports car:       25         30            45
SUV/Truck:        28         35            50
Bus:              35         45            60
Tank:             40         50            70
Monster truck:    22         28            40
Racing car:       22         28            42
Rowboat:          8          12            18
Canoe:            6          10            16
Speedboat:        16         22            32
Yacht:            40         55            80
Pirate ship:      60         80            120
Submarine:        22         30            45
Airplane prop:    28         35            50
Helicopter:       25         32            48
Hot air balloon:  14         18            28
Biplane:          30         40            55
Jet fighter:      30         38            55
Steam locomotive: 45         55            75
Passenger car:    22         30            45
Aircraft carrier: 80         100           150

--- ATTACHMENT NAMING CONVENTION ---
Name all attachments clearly for constraint connections:
  AxleAttachment_FrontLeft        -- wheel axle on chassis, front left
  AxleAttachment_FrontRight
  AxleAttachment_RearLeft
  AxleAttachment_RearRight
  WheelCenter_FrontLeft           -- matching attachment inside wheel part
  WheelCenter_FrontRight
  WheelCenter_RearLeft
  WheelCenter_RearRight
  SteerKnuckle_FrontLeft          -- hinge for steering
  SteerKnuckle_FrontRight
  SuspensionMount_FrontLeft       -- spring top mount on chassis
  SuspensionMount_FrontRight
  SuspensionMount_RearLeft
  SuspensionMount_RearRight
  SuspensionArm_FrontLeft         -- spring bottom on suspension arm
  SuspensionArm_FrontRight
  SuspensionArm_RearLeft
  SuspensionArm_RearRight
  TowHitchPoint                   -- on truck/car rear for trailer
  TrailerCouplePoint              -- on trailer front
  DoorHinge_Driver                -- door hinge axis
  DoorHinge_Passenger
  TurretPivot                     -- tank turret rotation axis
  RotorMastTop                    -- helicopter rotor mounting
  PropellerAxis                   -- boat/aircraft propeller spin axis
  RudderHingeAxis                 -- boat rudder pivot

--- AI PROMPT PATTERNS FOR VEHICLES ---
When the AI receives a vehicle request, it should follow this checklist:

Step 1 - Identify vehicle type and get baseline specs from this bible
Step 2 - Determine color palette from request or use defaults
Step 3 - Generate PrimaryPart (chassis/hull/fuselage) first
Step 4 - Generate all exterior body panels with correct offsets
Step 5 - Generate wheels/tracks/rotors with correct materials and sizes
Step 6 - Generate VehicleSeat with correct MaxSpeed/Torque/TurnSpeed
Step 7 - Generate lights (headlights Neon, taillights Neon red)
Step 8 - Generate glass windows (Glass material, correct transparency)
Step 9 - Generate detail parts (mirrors, exhausts, antennae)
Step 10 - Generate WeldConstraints for all parts to PrimaryPart
Step 11 - Generate CylindricalConstraints for driven wheels
Step 12 - Generate BodyVelocity, BodyAngularVelocity, BodyGyro on PrimaryPart
Step 13 - Generate PhysicsService CollisionGroup setup
Step 14 - Generate LocalScript for input handling (throttle, steer, lights, horn)
Step 15 - Generate HUD ScreenGui (speedometer, gear, nitro bar)

Minimum part counts:
  Any driveable vehicle: 15 parts
  Car: 25 parts
  Boat: 10 parts
  Aircraft: 28 parts
  Train locomotive: 45 parts

Never output just a single Part for a vehicle.
Never use SmoothPlastic on any part.
Always include VehicleSeat for any player-driven vehicle.
Always include WeldConstraints (no exceptions).

--- COMMON MISTAKES AND EXACT FIXES ---

Mistake: Wheels don't spin visually
Fix: CylindricalConstraint must have RotationAxisEnabled = true
     AND Attachment axes must align (both X-axis pointing along axle)
     AND AngularActuatorType must be Motor not None

Mistake: Vehicle teleports when sitting
Fix: VehicleSeat is not the PrimaryPart. Set PrimaryPart to chassis only.

Mistake: Car tips over on hard turns
Fix: Add BodyGyro with MaxTorque Vector3.new(6e5, 0, 6e5) — X and Z only.
     Add ballast Part density=15 at chassis floor. Lower center of mass.

Mistake: Vehicle falls through floor
Fix: WheelPart CanCollide must be true.
     WheelPart CollisionGroup must collide with Workspace Default group.
     Check wheel Y position — wheel center must be above floor by radius.

Mistake: Passengers fly off on turns
Fix: WeldConstraint Seat Part0 to HumanoidRootPart when occupant sits.
     Remove weld when occupant stands.

Mistake: Boat sinks immediately
Fix: BodyForce upward must equal or exceed mass * workspace.Gravity.
     Check AssemblyMass — it includes ALL welded parts.
     Formula: bf.Force = Vector3.new(0, assemblyMass * workspace.Gravity * 1.05, 0)

Mistake: Helicopter spins uncontrollably
Fix: BodyGyro P value must be at least 300000.
     BodyGyro D value must be at least 5000.
     Set MaxTorque Vector3.new(5e5, 5e5, 5e5).

Mistake: Aircraft gains no altitude
Fix: Lift BodyForce calculation must account for full AssemblyMass.
     liftFraction must reach 1.0 at target speed.
     Check workspace.Gravity — default is 196.2, not 9.8.

Mistake: Train jiggles and bounces
Fix: SetPrimaryPartCFrame clashes with physics — use BodyVelocity approach instead.
     Or: set all train parts Anchored = true, update CFrame directly each Heartbeat.

Mistake: Police siren lights not visible in daylight
Fix: Neon material always visible regardless of lighting — no fix needed.
     Ensure part Size is at least 0.5 studs in visible dimension.

Mistake: ProximityPrompt doesn't appear on vehicle seat
Fix: ProximityPrompt must be inside a BasePart. Parent it to the VehicleSeat directly.
     Set ProximityPrompt.RequiresLineOfSight = false for enclosed vehicles.

--- BENCHMARK: QUALITY SCORING ---
Score your vehicle build 1-10 based on:

10 - Perfect:
     25+ parts, correct materials, physics constraints, custom HUD, sounds, particles, damage model, livery system, all named correctly

8-9 - Great:
     20+ parts, correct materials, physics constraints, basic HUD, some sounds

6-7 - Good:
     15+ parts, mostly correct materials, basic movement, VehicleSeat working

4-5 - Acceptable:
     10+ parts, some wrong materials, movement works but no refinement

1-3 - Poor:
     Fewer than 10 parts, single block with VehicleSeat, SmoothPlastic used

Target for all ForjeGames AI-generated vehicles: Score 8 or higher.
`;

export const VEHICLE_COLOR_PALETTES: string = `
=== VEHICLE COLOR PALETTES — READY TO USE ===

--- CLASSIC AMERICAN MUSCLE ---
Primary body:   RGB(180, 20, 20) deep red
Accent stripe:  RGB(255, 255, 255) white
Chrome trim:    RGB(200, 200, 210) silver chrome
Interior:       RGB(20, 15, 10) near black leather
Engine:         RGB(180, 120, 0) polished chrome orange

--- EUROPEAN SPORTS ---
Primary body:   RGB(200, 50, 0) Italian racing red
Accent:         RGB(255, 215, 0) gold badge
Interior:       RGB(15, 15, 15) carbon black
Brake calipers: RGB(255, 220, 0) yellow (Brembo style)
Wheels:         RGB(40, 40, 40) dark gunmetal

--- JAPANESE TUNER ---
Primary body:   RGB(255, 255, 255) pearl white
Accent:         RGB(0, 120, 200) electric blue
Underbody glow: RGB(0, 200, 255) cyan neon (Neon material)
Interior:       RGB(30, 30, 30) black with RGB(0,150,255) blue stitching parts
Exhaust tip:    RGB(180, 180, 180) polished silver

--- MILITARY / TACTICAL ---
Primary body:   RGB(80, 90, 50) olive drab
Secondary:      RGB(60, 70, 40) dark green
Markings:       RGB(255, 255, 255) white stencil numbers (SurfaceGui)
Undercarriage:  RGB(40, 40, 30) very dark
Metal fittings: RGB(80, 80, 80) worn steel

--- CONSTRUCTION / HEAVY EQUIPMENT ---
Primary body:   RGB(255, 160, 0) CAT yellow
Secondary:      RGB(40, 40, 40) machine black
Safety stripes: RGB(0, 0, 0) black alternating with RGB(255, 160, 0) yellow
Warning lights: RGB(255, 140, 0) amber Neon
Hydraulics:     RGB(200, 140, 0) chrome yellow

--- POLICE / EMERGENCY ---
Base vehicle:   RGB(255, 255, 255) white or RGB(20, 20, 60) dark blue
Light bar red:  RGB(255, 0, 0) Neon
Light bar blue: RGB(0, 80, 255) Neon
Lettering:      RGB(0, 0, 0) black text on door SurfaceGui
Push bumper:    RGB(80, 80, 80) brushed steel

--- AMBULANCE ---
Base:           RGB(255, 255, 255) white
Cross symbol:   RGB(255, 0, 0) Neon red cross on sides and roof
Stripe:         RGB(255, 160, 0) orange/amber horizontal band
Lights red:     RGB(255, 0, 0) Neon
Lights blue:    RGB(0, 80, 255) Neon

--- FIRE TRUCK ---
Base:           RGB(200, 20, 20) fire red or RGB(255, 220, 0) lime yellow (modern)
Accent:         RGB(200, 200, 200) polished aluminum
Ladders:        RGB(160, 160, 160) aluminum
Equipment boxes: RGB(180, 18, 18) dark red
Warning lights: RGB(255, 100, 0) amber Neon
Reflective strips: RGB(255, 255, 0) Neon yellow horizontal bands

--- VINTAGE / CLASSIC ---
Primary body:   RGB(40, 80, 140) heritage blue or RGB(180, 130, 20) cream gold
Chrome bumpers: RGB(200, 210, 220) bright chrome
Running boards: RGB(20, 20, 20) black rubber look (Granite)
Interior:       RGB(180, 140, 80) tan leather
Wood paneling:  RGB(140, 100, 40) walnut

--- SPACE / SCI-FI SHIP ---
Hull primary:   RGB(20, 25, 35) space black
Hull secondary: RGB(40, 50, 70) dark slate
Engine glow:    RGB(0, 180, 255) blue plasma Neon
Accent glow:    RGB(0, 255, 200) teal Neon
Shield:         RGB(100, 200, 255) translucent blue (Transparency 0.7-0.8)
Rust details:   RGB(120, 60, 20) for old freighter style

--- RACING LIVERY TEMPLATES ---
Template 1 (Speed Demon):
  Base: RGB(255, 0, 0) red
  Number panel: RGB(255, 255, 255) white
  Number color: RGB(255, 0, 0) red on white
  Sponsor decal areas: RGB(0, 0, 0) black

Template 2 (Night Runner):
  Base: RGB(10, 10, 20) midnight black
  Accent: RGB(0, 200, 255) neon cyan stripes
  Wheels: RGB(20, 20, 20) gloss black
  Brake calipers: RGB(0, 200, 255) cyan

Template 3 (Rally Sport):
  Base: RGB(240, 240, 240) rally white
  Hood stripe: RGB(0, 60, 200) blue center stripe
  Roof: RGB(0, 60, 200) matching blue
  Side decals: RGB(255, 0, 0) red accents

--- BOAT COLOR PALETTES ---
Wooden rowboat:
  Hull exterior: RGB(120, 80, 30) dark oak
  Hull interior: RGB(180, 130, 60) lighter wood
  Oars: RGB(160, 110, 50) cedar

Speedboat:
  Hull: RGB(255, 255, 255) bright white
  Racing stripe: RGB(255, 100, 0) orange
  Interior: RGB(20, 20, 20) black

Pirate ship aged look:
  Hull above waterline: RGB(60, 40, 15) aged dark wood
  Hull below waterline: RGB(40, 60, 80) barnacled hull teal-gray
  Sails: RGB(200, 185, 150) aged canvas
  Black sails variant: RGB(30, 30, 30)
  Rope: RGB(140, 120, 80) hemp brown

Naval ship:
  Hull: RGB(35, 45, 55) battleship gray
  Deck: RGB(55, 60, 55) non-slip deck gray
  Superstructure: RGB(120, 125, 120) lighter gray
  Waterline boot topping: RGB(180, 30, 30) red anti-fouling

--- AIRCRAFT COLOR PALETTES ---
Commercial airliner:
  Fuselage: RGB(240, 240, 245) white
  Tail livery: carrier color (varies)
  Belly: RGB(200, 200, 210) aluminum gray
  Engines: RGB(80, 80, 90) dark graphite

Military fighter:
  Air superiority: RGB(120, 130, 140) bluish gray
  Desert scheme: RGB(180, 150, 100) tan + RGB(140, 100, 60) brown
  Low observable: RGB(30, 30, 35) near black matte

Classic biplane:
  Canvas: RGB(200, 175, 120) natural linen
  Struts: RGB(100, 70, 30) wood brown
  Cowling: RGB(50, 50, 50) black
  Roundels: RGB(255, 0, 0) red / RGB(255, 255, 255) white / RGB(0, 50, 160) blue

Spaceship:
  Primary: RGB(15, 15, 25) space black
  Thruster glow: RGB(0, 150, 255) electric blue Neon
  Window tint: RGB(100, 200, 255) glass blue
  Hull detail: RGB(80, 90, 100) steel gray panels

--- TRAIN COLOR PALETTES ---
Classic steam:
  Boiler: RGB(15, 15, 15) gloss black
  Running gear: RGB(15, 15, 15) black
  Boiler banding: RGB(200, 160, 0) polished brass
  Cab roof: RGB(15, 15, 15) black
  Nameplate: RGB(200, 160, 0) brass

Heritage diesel:
  Body: RGB(0, 60, 120) corporate blue
  Stripe: RGB(255, 200, 0) gold band
  Roof: RGB(100, 100, 100) dark gray

Modern high speed:
  Body: RGB(255, 255, 255) pure white
  Nose: RGB(200, 30, 30) red pointed nose
  Accent stripe: RGB(200, 30, 30) red along body
  Windows: RGB(50, 70, 100) tinted blue-gray

Freight:
  Boxcar red: RGB(160, 50, 20) classic boxcar red
  Hopper: RGB(60, 60, 60) dark gray carbon
  Tank car: RGB(100, 100, 100) aluminum or RGB(0, 60, 120) blue chemical
  Flatcar: RGB(80, 80, 80) steel gray
`;





