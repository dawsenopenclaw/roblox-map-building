/**
 * Furniture & Props Bible — exact multi-part construction for 200+ furniture items and props.
 * Every piece broken down into individual Roblox Parts with exact sizes, materials, colors, CFrame offsets.
 * NEVER use SmoothPlastic. Use Wood, Fabric, Metal, Marble, Granite, Concrete, Brick, etc.
 */

export const FURNITURE_LIVING: string = `
=== LIVING ROOM FURNITURE — EXACT MULTI-PART CONSTRUCTION ===

--- SOFA (3-SEATER) | 18 parts total ---
Origin: floor level center of sofa
Part 1 — Frame Base
  Shape: Block | Size: 7,0.6,3 | Material: Wood | Color: 101,67,33 (dark walnut)
  CFrame: 0,0.3,0 | Note: main lower structural frame
Part 2 — Back Frame Rail
  Shape: Block | Size: 7,0.5,0.4 | Material: Wood | Color: 101,67,33
  CFrame: 0,2.2,-1.3 | Note: top rail of sofa back
Part 3 — Left Armrest Outer
  Shape: Block | Size: 0.4,1.8,3 | Material: Wood | Color: 101,67,33
  CFrame: -3.3,0.9,0 | Note: left arm outer face
Part 4 — Right Armrest Outer
  Shape: Block | Size: 0.4,1.8,3 | Material: Wood | Color: 101,67,33
  CFrame: 3.3,0.9,0 | Note: right arm outer face
Part 5 — Left Armrest Top Pad
  Shape: Block | Size: 0.8,0.25,2.8 | Material: Fabric | Color: 180,140,100 (warm linen)
  CFrame: -3.1,1.925,0 | Note: padded armrest top cushion
Part 6 — Right Armrest Top Pad
  Shape: Block | Size: 0.8,0.25,2.8 | Material: Fabric | Color: 180,140,100
  CFrame: 3.1,1.925,0 | Note: padded armrest top cushion
Part 7 — Seat Cushion Left
  Shape: Block | Size: 2.1,0.55,2.4 | Material: Fabric | Color: 180,140,100
  CFrame: -2.0,0.875,0.1 | Note: left seat cushion, slightly rounded feel
Part 8 — Seat Cushion Center
  Shape: Block | Size: 2.1,0.55,2.4 | Material: Fabric | Color: 180,140,100
  CFrame: 0,0.875,0.1 | Note: center seat cushion
Part 9 — Seat Cushion Right
  Shape: Block | Size: 2.1,0.55,2.4 | Material: Fabric | Color: 180,140,100
  CFrame: 2.0,0.875,0.1 | Note: right seat cushion
Part 10 — Back Cushion Left
  Shape: Block | Size: 2.1,1.3,0.5 | Material: Fabric | Color: 175,135,95
  CFrame: -2.0,1.75,-1.0 | Note: left back cushion, slightly darker fabric
Part 11 — Back Cushion Center
  Shape: Block | Size: 2.1,1.3,0.5 | Material: Fabric | Color: 175,135,95
  CFrame: 0,1.75,-1.0 | Note: center back cushion
Part 12 — Back Cushion Right
  Shape: Block | Size: 2.1,1.3,0.5 | Material: Fabric | Color: 175,135,95
  CFrame: 2.0,1.75,-1.0 | Note: right back cushion
Part 13 — Throw Pillow A
  Shape: Block | Size: 0.9,0.9,0.3 | Material: Fabric | Color: 140,80,60 (terracotta accent)
  CFrame: -2.8,1.6,-0.8 | Note: decorative throw pillow on left armrest
Part 14 — Throw Pillow B
  Shape: Block | Size: 0.9,0.9,0.3 | Material: Fabric | Color: 80,100,120 (slate blue accent)
  CFrame: 2.8,1.6,-0.8 | Note: decorative throw pillow on right armrest
Part 15 — Leg Front-Left
  Shape: Cylinder | Size: 0.25,0.4,0.25 | Material: Wood | Color: 80,50,20
  CFrame: -3.0,0.2,1.2 | Note: front left wooden leg
Part 16 — Leg Front-Right
  Shape: Cylinder | Size: 0.25,0.4,0.25 | Material: Wood | Color: 80,50,20
  CFrame: 3.0,0.2,1.2 | Note: front right wooden leg
Part 17 — Leg Back-Left
  Shape: Cylinder | Size: 0.25,0.4,0.25 | Material: Wood | Color: 80,50,20
  CFrame: -3.0,0.2,-1.2 | Note: back left wooden leg
Part 18 — Leg Back-Right
  Shape: Cylinder | Size: 0.25,0.4,0.25 | Material: Wood | Color: 80,50,20
  CFrame: 3.0,0.2,-1.2 | Note: back right wooden leg

--- ARMCHAIR | 14 parts total ---
Origin: floor level center
Part 1 — Frame Base
  Shape: Block | Size: 3.2,0.6,2.8 | Material: Wood | Color: 101,67,33
  CFrame: 0,0.3,0
Part 2 — Back Frame
  Shape: Block | Size: 3.2,0.4,0.35 | Material: Wood | Color: 101,67,33
  CFrame: 0,2.0,-1.1
Part 3 — Left Arm Frame
  Shape: Block | Size: 0.35,1.6,2.8 | Material: Wood | Color: 101,67,33
  CFrame: -1.55,0.8,0
Part 4 — Right Arm Frame
  Shape: Block | Size: 0.35,1.6,2.8 | Material: Wood | Color: 101,67,33
  CFrame: 1.55,0.8,0
Part 5 — Left Arm Pad
  Shape: Block | Size: 0.7,0.22,2.5 | Material: Fabric | Color: 160,120,90
  CFrame: -1.45,1.71,0
Part 6 — Right Arm Pad
  Shape: Block | Size: 0.7,0.22,2.5 | Material: Fabric | Color: 160,120,90
  CFrame: 1.45,1.71,0
Part 7 — Seat Cushion
  Shape: Block | Size: 2.5,0.6,2.1 | Material: Fabric | Color: 160,120,90
  CFrame: 0,0.9,0.1
Part 8 — Back Cushion
  Shape: Block | Size: 2.5,1.4,0.5 | Material: Fabric | Color: 155,115,85
  CFrame: 0,1.8,-0.85
Part 9 — Leg Front-Left
  Shape: Cylinder | Size: 0.22,0.4,0.22 | Material: Wood | Color: 80,50,20
  CFrame: -1.3,0.2,1.1
Part 10 — Leg Front-Right
  Shape: Cylinder | Size: 0.22,0.4,0.22 | Material: Wood | Color: 80,50,20
  CFrame: 1.3,0.2,1.1
Part 11 — Leg Back-Left
  Shape: Cylinder | Size: 0.22,0.4,0.22 | Material: Wood | Color: 80,50,20
  CFrame: -1.3,0.2,-1.1
Part 12 — Leg Back-Right
  Shape: Cylinder | Size: 0.22,0.4,0.22 | Material: Wood | Color: 80,50,20
  CFrame: 1.3,0.2,-1.1
Part 13 — Throw Pillow
  Shape: Block | Size: 0.85,0.85,0.28 | Material: Fabric | Color: 120,70,50
  CFrame: 0.6,1.55,-0.7
Part 14 — Back Top Trim
  Shape: Block | Size: 3.2,0.15,0.25 | Material: Wood | Color: 101,67,33
  CFrame: 0,2.25,-1.05 | Note: decorative wood capping on top of chair back

--- COFFEE TABLE | 11 parts total ---
Origin: floor level center
Part 1 — Tabletop
  Shape: Block | Size: 5,0.2,2.5 | Material: Wood | Color: 120,80,40 (light oak)
  CFrame: 0,1.6,0 | Note: main top surface
Part 2 — Tabletop Edge Trim Left
  Shape: Block | Size: 0.1,0.2,2.5 | Material: Wood | Color: 100,65,30
  CFrame: -2.55,1.6,0
Part 3 — Tabletop Edge Trim Right
  Shape: Block | Size: 0.1,0.2,2.5 | Material: Wood | Color: 100,65,30
  CFrame: 2.55,1.6,0
Part 4 — Lower Shelf
  Shape: Block | Size: 4.6,0.15,2.1 | Material: Wood | Color: 120,80,40
  CFrame: 0,0.55,0 | Note: lower display/storage shelf
Part 5 — Leg Front-Left
  Shape: Block | Size: 0.2,1.5,0.2 | Material: Metal | Color: 60,60,60
  CFrame: -2.2,0.75,1.0
Part 6 — Leg Front-Right
  Shape: Block | Size: 0.2,1.5,0.2 | Material: Metal | Color: 60,60,60
  CFrame: 2.2,0.75,1.0
Part 7 — Leg Back-Left
  Shape: Block | Size: 0.2,1.5,0.2 | Material: Metal | Color: 60,60,60
  CFrame: -2.2,0.75,-1.0
Part 8 — Leg Back-Right
  Shape: Block | Size: 0.2,1.5,0.2 | Material: Metal | Color: 60,60,60
  CFrame: 2.2,0.75,-1.0
Part 9 — Cross Brace Front
  Shape: Block | Size: 4.2,0.15,0.15 | Material: Metal | Color: 60,60,60
  CFrame: 0,0.35,1.0 | Note: horizontal metal cross brace connecting front legs
Part 10 — Cross Brace Back
  Shape: Block | Size: 4.2,0.15,0.15 | Material: Metal | Color: 60,60,60
  CFrame: 0,0.35,-1.0
Part 11 — Decorative Object (Tray)
  Shape: Block | Size: 2.5,0.08,1.4 | Material: Metal | Color: 180,150,80 (brushed gold)
  CFrame: 0,1.72,0 | Note: decorative tray sitting on tabletop

--- TV STAND | 16 parts total ---
Origin: floor level center
Part 1 — Main Cabinet Body
  Shape: Block | Size: 6,1.5,1.6 | Material: Wood | Color: 60,40,20 (dark espresso)
  CFrame: 0,0.75,0
Part 2 — Left Cabinet Door
  Shape: Block | Size: 1.8,1.2,0.08 | Material: Wood | Color: 65,43,22
  CFrame: -1.9,0.75,0.84 | Note: left cabinet door face
Part 3 — Right Cabinet Door
  Shape: Block | Size: 1.8,1.2,0.08 | Material: Wood | Color: 65,43,22
  CFrame: 1.9,0.75,0.84
Part 4 — Center Open Bay
  Shape: Block | Size: 1.8,1.2,1.5 | Material: Wood | Color: 50,33,15 (interior dark)
  CFrame: 0,0.75,0 | Note: recessed center open shelf area
Part 5 — Left Door Handle
  Shape: Cylinder | Size: 0.08,0.6,0.08 | Material: Metal | Color: 180,180,180
  CFrame: -1.05,0.75,0.9
Part 6 — Right Door Handle
  Shape: Cylinder | Size: 0.08,0.6,0.08 | Material: Metal | Color: 180,180,180
  CFrame: 1.05,0.75,0.9
Part 7 — Top Surface
  Shape: Block | Size: 6.1,0.12,1.7 | Material: Wood | Color: 60,40,20
  CFrame: 0,1.56,0
Part 8 — Bottom Base
  Shape: Block | Size: 6.1,0.12,1.7 | Material: Wood | Color: 60,40,20
  CFrame: 0,0.06,0
Part 9 — Left Side Panel
  Shape: Block | Size: 0.1,1.5,1.6 | Material: Wood | Color: 60,40,20
  CFrame: -3.05,0.75,0
Part 10 — Right Side Panel
  Shape: Block | Size: 0.1,1.5,1.6 | Material: Wood | Color: 60,40,20
  CFrame: 3.05,0.75,0
Part 11 — Center Shelf Divider
  Shape: Block | Size: 0.08,1.3,1.5 | Material: Wood | Color: 55,36,17
  CFrame: 0,0.75,0.05
Part 12 — TV Body (screen housing)
  Shape: Block | Size: 5.5,3.2,0.2 | Material: Metal | Color: 30,30,30 (near black)
  CFrame: 0,3.1,0.55
Part 13 — TV Screen
  Shape: Block | Size: 5.2,2.9,0.05 | Material: Neon | Color: 10,10,40 (off screen dark blue)
  CFrame: 0,3.1,0.67 | Note: screen face, use Neon material for slight glow feel
Part 14 — TV Stand Neck
  Shape: Block | Size: 0.5,0.5,0.15 | Material: Metal | Color: 30,30,30
  CFrame: 0,1.75,0.55
Part 15 — Cable Grommet Hole Cover
  Shape: Cylinder | Size: 0.3,0.08,0.3 | Material: Metal | Color: 50,50,50
  CFrame: 2.5,1.58,0 | Note: cable management hole on top surface
Part 16 — Bottom Vent Strip
  Shape: Block | Size: 5.8,0.15,0.15 | Material: Metal | Color: 40,40,40
  CFrame: 0,0.18,0.83 | Note: ventilation strip at front base

--- BOOKSHELF | 20 parts total ---
Origin: floor level center, against wall
Part 1 — Left Side Panel
  Shape: Block | Size: 0.2,7,1.4 | Material: Wood | Color: 120,80,40
  CFrame: -1.6,3.5,0
Part 2 — Right Side Panel
  Shape: Block | Size: 0.2,7,1.4 | Material: Wood | Color: 120,80,40
  CFrame: 1.6,3.5,0
Part 3 — Top Panel
  Shape: Block | Size: 3.2,0.2,1.4 | Material: Wood | Color: 120,80,40
  CFrame: 0,6.9,0
Part 4 — Bottom Panel
  Shape: Block | Size: 3.2,0.2,1.4 | Material: Wood | Color: 120,80,40
  CFrame: 0,0.1,0
Part 5 — Back Panel
  Shape: Block | Size: 3.2,7,0.1 | Material: Wood | Color: 100,65,30
  CFrame: 0,3.5,-0.65
Part 6 — Shelf 1 (bottom)
  Shape: Block | Size: 3.0,0.15,1.3 | Material: Wood | Color: 120,80,40
  CFrame: 0,1.3,0
Part 7 — Shelf 2
  Shape: Block | Size: 3.0,0.15,1.3 | Material: Wood | Color: 120,80,40
  CFrame: 0,2.7,0
Part 8 — Shelf 3
  Shape: Block | Size: 3.0,0.15,1.3 | Material: Wood | Color: 120,80,40
  CFrame: 0,4.1,0
Part 9 — Shelf 4
  Shape: Block | Size: 3.0,0.15,1.3 | Material: Wood | Color: 120,80,40
  CFrame: 0,5.5,0
Part 10 — Book A (tall red)
  Shape: Block | Size: 0.2,1.1,1.0 | Material: SmoothPlastic | Color: 180,40,40 | Note: use Granite if needed
  CFrame: -1.2,1.88,0
Part 11 — Book B (blue)
  Shape: Block | Size: 0.25,0.95,1.0 | Material: Granite | Color: 60,80,160
  CFrame: -0.9,1.83,0
Part 12 — Book C (green)
  Shape: Block | Size: 0.18,1.05,1.0 | Material: Granite | Color: 50,130,70
  CFrame: -0.6,1.86,0
Part 13 — Book D (yellow-tan)
  Shape: Block | Size: 0.22,0.9,1.0 | Material: Granite | Color: 200,170,90
  CFrame: -0.3,1.8,0
Part 14 — Book E (dark purple)
  Shape: Block | Size: 0.2,1.0,1.0 | Material: Granite | Color: 90,40,120
  CFrame: 0.0,1.85,0
Part 15 — Book F (orange)
  Shape: Block | Size: 0.25,0.85,1.0 | Material: Granite | Color: 220,110,40
  CFrame: 0.3,1.78,0
Part 16 — Book G (white)
  Shape: Block | Size: 0.2,1.15,1.0 | Material: Granite | Color: 230,225,215
  CFrame: 0.6,1.9,0
Part 17 — Book H (brown)
  Shape: Block | Size: 0.22,1.0,1.0 | Material: Granite | Color: 130,85,40
  CFrame: 0.9,1.85,0
Part 18 — Decorative Object (small plant pot)
  Shape: Cylinder | Size: 0.5,0.6,0.5 | Material: Granite | Color: 180,120,60
  CFrame: 1.3,3.05,0
Part 19 — Small Framed Photo
  Shape: Block | Size: 0.55,0.7,0.1 | Material: Wood | Color: 80,55,25
  CFrame: -0.8,5.9,0.5
Part 20 — Bookend Metal L (right side shelf 1)
  Shape: Block | Size: 0.12,0.8,0.9 | Material: Metal | Color: 100,100,100
  CFrame: 1.2,1.72,0

--- FLOOR LAMP | 8 parts total ---
Origin: floor level base center
Part 1 — Base Disc
  Shape: Cylinder | Size: 1.0,0.15,1.0 | Material: Metal | Color: 70,70,70
  CFrame: 0,0.075,0
Part 2 — Base Weight Ring
  Shape: Cylinder | Size: 0.7,0.2,0.7 | Material: Metal | Color: 60,60,60
  CFrame: 0,0.25,0
Part 3 — Lower Pole
  Shape: Cylinder | Size: 0.12,3.5,0.12 | Material: Metal | Color: 80,80,80
  CFrame: 0,1.9,0
Part 4 — Upper Pole
  Shape: Cylinder | Size: 0.1,2.5,0.1 | Material: Metal | Color: 80,80,80
  CFrame: 0,4.65,0
Part 5 — Pole Connector Knuckle
  Shape: Cylinder | Size: 0.2,0.2,0.2 | Material: Metal | Color: 90,90,90
  CFrame: 0,3.7,0
Part 6 — Shade Frame
  Shape: Cylinder | Size: 1.4,0.08,1.4 | Material: Metal | Color: 80,80,80
  CFrame: 0,5.95,0 | Note: rim of shade
Part 7 — Shade Body
  Shape: Cylinder | Size: 1.2,0.9,1.2 | Material: Fabric | Color: 220,200,160 (cream)
  CFrame: 0,5.55,0 | Note: fabric lampshade cone approximated with cylinder
Part 8 — Bulb Glow
  Shape: Ball | Size: 0.4,0.4,0.4 | Material: Neon | Color: 255,240,200
  CFrame: 0,5.3,0 | Note: neon ball simulating lit bulb inside shade

--- RUG | 3 parts total ---
Origin: floor level
Part 1 — Rug Base
  Shape: Block | Size: 7,0.08,4 | Material: Fabric | Color: 160,120,80 (warm sand)
  CFrame: 0,0.04,0
Part 2 — Rug Pattern Overlay
  Shape: Block | Size: 6.5,0.09,3.5 | Material: Fabric | Color: 130,90,55
  CFrame: 0,0.045,0 | Note: slightly smaller inner pattern block
Part 3 — Rug Fringe Strip Front
  Shape: Block | Size: 7,0.06,0.3 | Material: Fabric | Color: 200,170,130
  CFrame: 0,0.03,2.15 | Note: fringe detail at front edge

--- FIREPLACE | 14 parts total ---
Origin: floor level, flush against wall
Part 1 — Left Pillar
  Shape: Block | Size: 1.0,5,0.8 | Material: Brick | Color: 160,120,90 (sandstone brick)
  CFrame: -2.5,2.5,0
Part 2 — Right Pillar
  Shape: Block | Size: 1.0,5,0.8 | Material: Brick | Color: 160,120,90
  CFrame: 2.5,2.5,0
Part 3 — Mantle Top
  Shape: Block | Size: 6,0.35,1.1 | Material: Wood | Color: 100,70,35 (dark oak mantle)
  CFrame: 0,5.18,0.1
Part 4 — Mantle Front Fascia
  Shape: Block | Size: 6,0.6,0.2 | Material: Wood | Color: 100,70,35
  CFrame: 0,4.7,0.45
Part 5 — Arch Top (firebox header)
  Shape: Block | Size: 3,0.5,0.8 | Material: Brick | Color: 140,100,70
  CFrame: 0,3.25,0
Part 6 — Firebox Interior Back
  Shape: Block | Size: 2.8,2.8,0.3 | Material: Concrete | Color: 40,35,30 (soot black)
  CFrame: 0,1.6,-0.2
Part 7 — Firebox Interior Left
  Shape: Block | Size: 0.2,2.8,0.8 | Material: Concrete | Color: 40,35,30
  CFrame: -1.4,1.6,0
Part 8 — Firebox Interior Right
  Shape: Block | Size: 0.2,2.8,0.8 | Material: Concrete | Color: 40,35,30
  CFrame: 1.4,1.6,0
Part 9 — Hearth Slab
  Shape: Block | Size: 4,0.2,1.5 | Material: Marble | Color: 200,190,180
  CFrame: 0,0.1,0.55
Part 10 — Grate Bar 1
  Shape: Cylinder | Size: 0.08,2.6,0.08 | Material: Metal | Color: 40,40,40
  CFrame: 0,0.35,-0.05 | Note: horizontal grate bar
Part 11 — Grate Bar 2
  Shape: Cylinder | Size: 0.08,2.6,0.08 | Material: Metal | Color: 40,40,40
  CFrame: 0,0.55,-0.05
Part 12 — Fire Glow Base (neon orange)
  Shape: Block | Size: 1.5,0.3,0.6 | Material: Neon | Color: 255,120,20
  CFrame: 0,0.45,-0.05 | Note: simulates fire glow at bottom of firebox
Part 13 — Fire Glow Tip
  Shape: Block | Size: 0.8,0.6,0.4 | Material: Neon | Color: 255,200,50
  CFrame: 0,0.8,-0.05 | Note: brighter upper flame tip
Part 14 — Mantle Decor Frame (mirror outline)
  Shape: Block | Size: 2.5,3.5,0.1 | Material: Wood | Color: 90,60,30
  CFrame: 0,3.8,0.37 | Note: decorative mirror frame above mantle

--- PICTURE FRAME (wall art) | 4 parts total ---
Origin: wall-mounted, center
Part 1 — Frame Border Top
  Shape: Block | Size: 2.4,0.2,0.15 | Material: Wood | Color: 80,55,25
  CFrame: 0,0.9,0
Part 2 — Frame Border Bottom
  Shape: Block | Size: 2.4,0.2,0.15 | Material: Wood | Color: 80,55,25
  CFrame: 0,-0.9,0
Part 3 — Frame Border Left
  Shape: Block | Size: 0.2,1.6,0.15 | Material: Wood | Color: 80,55,25
  CFrame: -1.1,0,0
Part 4 — Art Canvas
  Shape: Block | Size: 2.0,1.6,0.08 | Material: Fabric | Color: 200,180,150 (canvas warm white)
  CFrame: 0,0,0.04 | Note: white canvas face, add decal for actual art

--- POTTED PLANT (medium) | 8 parts total ---
Origin: floor level base
Part 1 — Pot Body
  Shape: Cylinder | Size: 1.0,1.2,1.0 | Material: Granite | Color: 180,120,60 (terracotta)
  CFrame: 0,0.6,0
Part 2 — Pot Rim
  Shape: Cylinder | Size: 1.15,0.12,1.15 | Material: Granite | Color: 190,130,70
  CFrame: 0,1.26,0
Part 3 — Soil Top
  Shape: Cylinder | Size: 0.85,0.1,0.85 | Material: Granite | Color: 50,35,20 (dark soil)
  CFrame: 0,1.25,0
Part 4 — Main Stem
  Shape: Cylinder | Size: 0.12,1.2,0.12 | Material: Wood | Color: 60,90,40
  CFrame: 0,1.9,0
Part 5 — Branch Left
  Shape: Cylinder | Size: 0.08,0.7,0.08 | Material: Wood | Color: 60,90,40
  CFrame: -0.3,2.3,0 | Note: angled branch (rotate ~30 deg)
Part 6 — Branch Right
  Shape: Cylinder | Size: 0.08,0.7,0.08 | Material: Wood | Color: 60,90,40
  CFrame: 0.3,2.3,0 | Note: angled branch (rotate ~-30 deg)
Part 7 — Leaf Cluster A
  Shape: Ball | Size: 0.8,0.7,0.8 | Material: Granite | Color: 60,140,60 (bright green)
  CFrame: -0.4,2.75,0
Part 8 — Leaf Cluster B
  Shape: Ball | Size: 0.9,0.8,0.9 | Material: Granite | Color: 50,120,50
  CFrame: 0.3,2.9,0.1

--- SIDE TABLE | 7 parts total ---
Origin: floor level center
Part 1 — Tabletop
  Shape: Cylinder | Size: 1.8,0.12,1.8 | Material: Wood | Color: 140,90,45
  CFrame: 0,1.55,0
Part 2 — Tabletop Edge
  Shape: Cylinder | Size: 1.85,0.06,1.85 | Material: Wood | Color: 120,75,35
  CFrame: 0,1.49,0
Part 3 — Center Pedestal Upper
  Shape: Cylinder | Size: 0.3,0.6,0.3 | Material: Wood | Color: 110,70,30
  CFrame: 0,1.1,0
Part 4 — Center Pedestal Flare
  Shape: Cylinder | Size: 0.5,0.15,0.5 | Material: Wood | Color: 110,70,30
  CFrame: 0,0.825,0
Part 5 — Center Pedestal Lower
  Shape: Cylinder | Size: 0.25,0.65,0.25 | Material: Wood | Color: 110,70,30
  CFrame: 0,0.45,0
Part 6 — Base Disc
  Shape: Cylinder | Size: 1.2,0.1,1.2 | Material: Wood | Color: 120,75,35
  CFrame: 0,0.12,0
Part 7 — Small Lamp (sitting on top)
  Shape: Cylinder | Size: 0.4,0.5,0.4 | Material: Metal | Color: 160,140,80 (brass)
  CFrame: 0.3,1.86,0.1

--- OTTOMAN | 7 parts total ---
Origin: floor level center
Part 1 — Body Block
  Shape: Block | Size: 3,0.9,2 | Material: Fabric | Color: 150,110,80 (tan fabric)
  CFrame: 0,0.45,0
Part 2 — Top Pad
  Shape: Block | Size: 2.9,0.22,1.9 | Material: Fabric | Color: 165,125,90
  CFrame: 0,0.96,0 | Note: slightly lighter top cushion layer
Part 3 — Leg Front-Left
  Shape: Cylinder | Size: 0.2,0.25,0.2 | Material: Wood | Color: 80,52,20
  CFrame: -1.3,0.125,0.75
Part 4 — Leg Front-Right
  Shape: Cylinder | Size: 0.2,0.25,0.2 | Material: Wood | Color: 80,52,20
  CFrame: 1.3,0.125,0.75
Part 5 — Leg Back-Left
  Shape: Cylinder | Size: 0.2,0.25,0.2 | Material: Wood | Color: 80,52,20
  CFrame: -1.3,0.125,-0.75
Part 6 — Leg Back-Right
  Shape: Cylinder | Size: 0.2,0.25,0.2 | Material: Wood | Color: 80,52,20
  CFrame: 1.3,0.125,-0.75
Part 7 — Decorative Tray (optional on top)
  Shape: Block | Size: 1.6,0.06,1.0 | Material: Metal | Color: 170,145,75 (gold tray)
  CFrame: 0,1.09,0

--- ENTERTAINMENT CENTER | 22 parts total ---
Origin: floor level center, wall-mounted feel
Part 1 — Main Body Lower
  Shape: Block | Size: 8,2,1.8 | Material: Wood | Color: 55,38,18 (dark walnut)
  CFrame: 0,1.0,0
Part 2 — Main Body Upper
  Shape: Block | Size: 6,2.5,0.6 | Material: Wood | Color: 55,38,18
  CFrame: 0,3.25,-0.6
Part 3 — Left Lower Door
  Shape: Block | Size: 1.8,1.6,0.09 | Material: Wood | Color: 60,42,20
  CFrame: -2.9,1.0,0.91
Part 4 — Right Lower Door
  Shape: Block | Size: 1.8,1.6,0.09 | Material: Wood | Color: 60,42,20
  CFrame: 2.9,1.0,0.91
Part 5 — Center Open Bay Lower
  Shape: Block | Size: 3.0,1.6,0.15 | Material: Wood | Color: 40,28,12 (dark interior)
  CFrame: 0,1.0,0.83
Part 6 — Left Door Handle
  Shape: Cylinder | Size: 0.07,0.8,0.07 | Material: Metal | Color: 180,180,180
  CFrame: -2.05,1.0,0.97
Part 7 — Right Door Handle
  Shape: Cylinder | Size: 0.07,0.8,0.07 | Material: Metal | Color: 180,180,180
  CFrame: 2.05,1.0,0.97
Part 8 — Upper Left Cabinet
  Shape: Block | Size: 1.7,2.2,0.55 | Material: Wood | Color: 55,38,18
  CFrame: -2.15,3.25,-0.625
Part 9 — Upper Right Cabinet
  Shape: Block | Size: 1.7,2.2,0.55 | Material: Wood | Color: 55,38,18
  CFrame: 2.15,3.25,-0.625
Part 10 — Upper Left Door
  Shape: Block | Size: 1.5,2.0,0.06 | Material: Wood | Color: 60,42,20
  CFrame: -2.15,3.25,-0.32
Part 11 — Upper Right Door
  Shape: Block | Size: 1.5,2.0,0.06 | Material: Wood | Color: 60,42,20
  CFrame: 2.15,3.25,-0.32
Part 12 — Upper Left Handle
  Shape: Cylinder | Size: 0.07,0.7,0.07 | Material: Metal | Color: 180,180,180
  CFrame: -1.45,3.25,-0.27
Part 13 — Upper Right Handle
  Shape: Cylinder | Size: 0.07,0.7,0.07 | Material: Metal | Color: 180,180,180
  CFrame: 1.45,3.25,-0.27
Part 14 — TV Panel (flat black)
  Shape: Block | Size: 5.8,3.4,0.2 | Material: Metal | Color: 25,25,25
  CFrame: 0,4.8,-0.45
Part 15 — TV Screen
  Shape: Block | Size: 5.5,3.1,0.06 | Material: Neon | Color: 15,15,50
  CFrame: 0,4.8,-0.35
Part 16 — Countertop Surface
  Shape: Block | Size: 8.1,0.15,1.9 | Material: Wood | Color: 55,38,18
  CFrame: 0,2.08,0
Part 17 — Bottom Base
  Shape: Block | Size: 8.1,0.12,1.85 | Material: Wood | Color: 55,38,18
  CFrame: 0,0.06,0
Part 18 — Left Shelf Unit Side
  Shape: Block | Size: 0.12,2.2,0.55 | Material: Wood | Color: 55,38,18
  CFrame: -3.06,3.25,-0.625
Part 19 — Right Shelf Unit Side
  Shape: Block | Size: 0.12,2.2,0.55 | Material: Wood | Color: 55,38,18
  CFrame: 3.06,3.25,-0.625
Part 20 — Middle Shelf in Center Bay
  Shape: Block | Size: 2.8,0.1,0.5 | Material: Wood | Color: 50,35,15
  CFrame: 0,2.4,-0.65
Part 21 — Cable Hole Cover Left
  Shape: Cylinder | Size: 0.25,0.08,0.25 | Material: Metal | Color: 40,40,40
  CFrame: -1.0,2.15,0.92
Part 22 — Cable Hole Cover Right
  Shape: Cylinder | Size: 0.25,0.08,0.25 | Material: Metal | Color: 40,40,40
  CFrame: 1.0,2.15,0.92

--- CURTAINS (per window) | 6 parts total ---
Origin: centered at top of window
Part 1 — Curtain Rod
  Shape: Cylinder | Size: 4.5,0.1,0.1 | Material: Metal | Color: 160,140,80 (brass)
  CFrame: 0,0,0 | Note: horizontal rod at very top
Part 2 — Left Rod Bracket
  Shape: Block | Size: 0.1,0.3,0.4 | Material: Metal | Color: 160,140,80
  CFrame: -2.1,0,0.2
Part 3 — Right Rod Bracket
  Shape: Block | Size: 0.1,0.3,0.4 | Material: Metal | Color: 160,140,80
  CFrame: 2.1,0,0.2
Part 4 — Left Curtain Panel
  Shape: Block | Size: 1.2,4.5,0.15 | Material: Fabric | Color: 80,80,130 (dusty blue)
  CFrame: -1.5,-2.25,0.05
Part 5 — Right Curtain Panel
  Shape: Block | Size: 1.2,4.5,0.15 | Material: Fabric | Color: 80,80,130
  CFrame: 1.5,-2.25,0.05
Part 6 — Curtain Tieback (per side, small fabric loop)
  Shape: Block | Size: 0.2,0.35,0.35 | Material: Fabric | Color: 100,100,150
  CFrame: -1.5,-1.5,0.25 | Note: tieback holds curtain to side, duplicate for right side

--- WALL CLOCK | 7 parts total ---
Origin: wall-mounted center
Part 1 — Clock Frame Ring
  Shape: Cylinder | Size: 1.8,0.15,1.8 | Material: Wood | Color: 80,52,20
  CFrame: 0,0,0
Part 2 — Clock Face
  Shape: Cylinder | Size: 1.6,0.05,1.6 | Material: Marble | Color: 240,235,225 (cream)
  CFrame: 0,0.1,0
Part 3 — Hour Hand
  Shape: Block | Size: 0.07,0.6,0.06 | Material: Metal | Color: 30,30,30
  CFrame: 0,0.4,0.12 | Note: rotate to show 12 o'clock
Part 4 — Minute Hand
  Shape: Block | Size: 0.05,0.75,0.05 | Material: Metal | Color: 30,30,30
  CFrame: 0,0.5,0.13
Part 5 — Second Hand
  Shape: Block | Size: 0.03,0.8,0.03 | Material: Metal | Color: 200,50,30
  CFrame: 0,0.55,0.14
Part 6 — Center Pivot
  Shape: Cylinder | Size: 0.12,0.12,0.12 | Material: Metal | Color: 60,60,60
  CFrame: 0,0.06,0.15
Part 7 — Clock Number Stud (replicate x12 around face)
  Shape: Cylinder | Size: 0.1,0.08,0.1 | Material: Metal | Color: 40,40,40
  CFrame: 0,0.7,0.12 | Note: place 12 small studs at hour positions on face
`;
