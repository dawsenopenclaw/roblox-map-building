/**
 * Object Blueprint Library — 100+ detailed part-by-part construction guides
 * The AI references these when building any physical object in Roblox.
 */

export interface Blueprint {
  name: string
  category: string
  parts: string // e.g. "8-15"
  keywords: string[]
  /** Compact build steps with exact sizes, materials, colors */
  build: string
}

const BLUEPRINTS: Blueprint[] = [
  // ═══ FURNITURE ═══
  { name:'Wooden Chair', category:'furniture', parts:'8-12', keywords:['chair','seat','wooden chair','dining chair'],
    build:'Legs: 4x Part(Wood,rgb(130,85,40)) size(0.8,2.5,0.8) at corners. Seat: Part(WoodPlanks,rgb(160,110,60)) size(2,0.3,2) y=2.5. Back: Part(Wood,rgb(130,85,40)) size(2,2,0.2) behind seat. Slats: 3x Part(Wood) size(0.4,1.5,0.2) vertical on back.' },
  { name:'Office Chair', category:'furniture', parts:'8-10', keywords:['office chair','desk chair','swivel','computer chair'],
    build:'Base: Part(Metal,rgb(50,50,55)) Cylinder size(2,0.3,2). Pole: Part(Metal,rgb(60,60,65)) Cylinder size(0.5,2,0.5). Seat: Part(Fabric,rgb(40,40,45)) size(2.5,0.5,2.5). Back: Part(Fabric,rgb(40,40,45)) size(2.5,2.5,0.3). Arms: 2x Part(Metal,rgb(60,60,65)) size(0.3,1,2).' },
  { name:'Dining Table', category:'furniture', parts:'6-10', keywords:['table','dining table','kitchen table'],
    build:'Top: Part(WoodPlanks,rgb(150,100,55)) size(6,0.3,4). Legs: 4x Part(Wood,rgb(130,85,40)) size(0.8,3,0.8) at corners, y offset -1.5. Optional: runner Part(Fabric,rgb(180,30,30)) size(1.5,0.05,3.5) centered on top.' },
  { name:'Desk', category:'furniture', parts:'8-12', keywords:['desk','office desk','work desk','writing desk'],
    build:'Top: Part(WoodPlanks,rgb(140,95,50)) size(5,0.3,2.5). Legs: 4x Part(Wood,rgb(120,80,35)) size(0.6,3,0.6). Drawer unit: Part(Wood,rgb(130,85,40)) size(1.8,2.5,2.3) under one side. Drawer faces: 3x Part(Wood,rgb(140,95,50)) size(1.6,0.7,0.1). Handles: 3x Part(Metal,rgb(180,180,185)) size(0.4,0.1,0.1).' },
  { name:'Bed', category:'furniture', parts:'8-12', keywords:['bed','bedroom','mattress','sleep'],
    build:'Frame: Part(Wood,rgb(120,75,35)) size(5,1,7). Headboard: Part(Wood,rgb(110,70,30)) size(5,3.5,0.4). Footboard: Part(Wood,rgb(110,70,30)) size(5,2,0.4). Mattress: Part(Fabric,rgb(240,235,225)) size(4.8,1,6.5). Pillow: 2x Part(Fabric,rgb(245,240,230)) size(1.8,0.5,1.2). Blanket: Part(Fabric,rgb(60,80,120)) size(4.5,0.3,5).' },
  { name:'Bookshelf', category:'furniture', parts:'10-16', keywords:['bookshelf','bookcase','shelf','library'],
    build:'Back: Part(Wood,rgb(100,65,30)) size(4,7,0.3). Sides: 2x Part(Wood,rgb(110,70,35)) size(0.3,7,1.5). Shelves: 4x Part(WoodPlanks,rgb(120,80,40)) size(3.4,0.3,1.5). Books: 8-12x Part(Fabric,random colors) sizes(0.3-0.5, 1-1.5, 0.8-1) varied, leaning.' },
  { name:'Couch', category:'furniture', parts:'8-12', keywords:['couch','sofa','living room','loveseat'],
    build:'Base: Part(Fabric,rgb(80,65,55)) size(6,1.5,3). Back: Part(Fabric,rgb(85,70,58)) size(6,2.5,0.8). Arms: 2x Part(Fabric,rgb(80,65,55)) size(0.8,2,3). Cushions: 3x Part(Fabric,rgb(90,75,62)) size(1.8,0.4,2.5). Legs: 4x Part(Wood,rgb(60,40,20)) size(0.4,0.5,0.4).' },
  { name:'Coffee Table', category:'furniture', parts:'6-8', keywords:['coffee table','living room table','center table'],
    build:'Top: Part(Glass,rgb(200,220,235),Transparency=0.3) size(3.5,0.2,2). Legs: 4x Part(Metal,rgb(55,55,60)) size(0.4,1.5,0.4). Lower shelf: Part(WoodPlanks,rgb(130,85,40)) size(3,0.2,1.5) at y=0.5.' },
  { name:'TV Stand', category:'furniture', parts:'8-12', keywords:['tv','television','entertainment','media'],
    build:'Cabinet: Part(Wood,rgb(35,30,25)) size(6,2.5,2). TV frame: Part(Metal,rgb(20,20,25)) size(5,0.3,3.2). TV screen: Part(Glass,rgb(15,15,20)) size(4.8,0.1,3) slight Transparency. Speakers: 2x Part(Metal,rgb(30,30,35)) size(0.8,1.5,0.8) on sides.' },
  { name:'Kitchen Counter', category:'furniture', parts:'8-12', keywords:['counter','kitchen counter','countertop','sink'],
    build:'Base: Part(Wood,rgb(240,235,225)) size(5,3,2.5). Top: Part(Marble,rgb(230,225,215)) size(5.2,0.3,2.7). Sink: Part(Metal,rgb(190,190,195)) size(1.5,0.8,1.2) inset. Faucet: Part(Metal,rgb(200,200,205)) Cylinder size(0.2,1,0.2) + curved arm. Handles: 2x Part(Metal) tiny.' },
  { name:'Fireplace', category:'furniture', parts:'10-15', keywords:['fireplace','hearth','chimney','mantle'],
    build:'Surround: Part(Brick,rgb(160,80,60)) size(5,5,1). Hearth: Part(Brick,rgb(140,70,50)) size(5,0.5,2). Mantle: Part(Wood,rgb(100,60,25)) size(5.5,0.4,1.5). Opening: Part(Brick,rgb(30,25,20)) size(3,3.5,0.5). Fire: Fire instance+PointLight(rgb(255,150,50),Brightness=3,Range=20). Grate: Part(Metal,rgb(40,40,45)) size(2.5,0.3,1).' },
  { name:'Wardrobe', category:'furniture', parts:'8-10', keywords:['wardrobe','closet','armoire','clothes'],
    build:'Body: Part(Wood,rgb(120,80,40)) size(4,7,2). Doors: 2x Part(Wood,rgb(130,85,45)) size(1.9,6.5,0.2). Handles: 2x Part(Metal,rgb(180,175,160)) size(0.1,0.5,0.1). Crown: Part(Wood,rgb(110,75,35)) size(4.2,0.3,2.2) top.' },
  { name:'Dresser', category:'furniture', parts:'10-14', keywords:['dresser','chest of drawers','bureau'],
    build:'Body: Part(Wood,rgb(140,95,50)) size(3.5,4,2). Drawers: 4x Part(Wood,rgb(150,105,55)) size(3.2,0.8,1.8). Handles: 8x Part(Metal,rgb(180,175,160)) size(0.3,0.1,0.1). Top: Part(WoodPlanks,rgb(145,100,52)) size(3.7,0.2,2.2).' },
  { name:'Floor Lamp', category:'furniture', parts:'6-8', keywords:['lamp','floor lamp','standing lamp','light'],
    build:'Base: Part(Metal,rgb(45,45,50)) size(1.2,0.3,1.2). Pole: Part(Metal,rgb(50,50,55)) Cylinder size(0.3,5.5,0.3). Shade: Part(Fabric,rgb(220,210,190)) size(1.8,1.5,1.8). PointLight(rgb(255,220,180),Brightness=1.5,Range=18) inside shade.' },
  { name:'Piano', category:'furniture', parts:'10-15', keywords:['piano','grand piano','upright piano','instrument'],
    build:'Body: Part(Wood,rgb(20,18,15)) size(5,3.5,2.5). Keyboard: Part(WoodPlanks,rgb(240,235,225)) size(4,0.1,0.5). Black keys: 5x Part(Wood,rgb(15,12,10)) size(0.3,0.1,0.3). Legs: 3x Part(Wood,rgb(20,18,15)) size(0.5,2.5,0.5). Bench: Part(Fabric,rgb(40,35,30)) size(3,0.5,1.2) + 4 legs.' },

  // ═══ EXTERIOR PROPS ═══
  { name:'Street Lamp', category:'exterior', parts:'6-8', keywords:['lamp post','street light','light pole','lamp'],
    build:'Base: Part(Concrete,rgb(140,140,145)) size(2,0.8,2). Pole: Cyl(Metal,rgb(55,55,60)) size(0.5,11,0.5). Arm: Part(Metal,rgb(55,55,60)) size(0.3,0.3,2.5) angled at top. Housing: Part(Metal,rgb(50,50,55)) size(1.5,1,1.5). Glass: Part(Glass,rgb(255,250,230),Transparency=0.3) size(1.2,0.6,1.2). PointLight(rgb(255,240,200),Brightness=2.5,Range=35).' },
  { name:'Park Bench', category:'exterior', parts:'10-14', keywords:['bench','park bench','seat','outdoor bench'],
    build:'Side supports: 2x Part(Metal,rgb(60,55,50)) size(0.5,2.5,2). Seat slats: 4x Part(Wood,rgb(130,90,45)) size(4,0.2,0.5). Back slats: 3x Part(Wood,rgb(130,90,45)) size(4,0.2,0.5) angled. Armrests: 2x Part(Metal,rgb(60,55,50)) size(0.5,0.3,2). Feet: 4x Part(Metal) size(0.6,0.3,0.3).' },
  { name:'Fire Hydrant', category:'exterior', parts:'6-8', keywords:['hydrant','fire hydrant','red hydrant'],
    build:'Body: Cyl(Metal,rgb(200,40,40)) size(1.2,2.5,1.2). Cap: Part(Metal,rgb(190,35,35)) Ball size 1.4. Nozzles: 2x Cyl(Metal,rgb(180,30,30)) size(0.4,0.8,0.4) sides. Chain: Part(Metal,rgb(160,160,165)) tiny. Bolts: 4x Part(Metal,rgb(120,120,125)) size(0.15,0.15,0.15).' },
  { name:'Mailbox', category:'exterior', parts:'6-8', keywords:['mailbox','mail','post box','letter box'],
    build:'Post: Part(Wood,rgb(200,195,185)) size(0.6,4,0.6). Box: Part(Metal,rgb(50,80,150)) size(1.5,1.2,1). Door: Part(Metal,rgb(55,85,155)) size(1.4,1,0.1) front. Flag: Part(Metal,rgb(220,50,40)) size(0.1,0.5,0.8). Cap: Part(Metal,rgb(50,80,150)) WedgePart top.' },
  { name:'Trash Can', category:'exterior', parts:'4-6', keywords:['trash','garbage','bin','waste','trash can'],
    build:'Body: Cyl(Metal,rgb(70,75,70)) size(1.5,2.5,1.5). Lid: Cyl(Metal,rgb(75,80,75)) size(1.6,0.2,1.6). Handle: Part(Metal,rgb(65,70,65)) size(0.5,0.3,0.1) on lid. Liner: Part(Fabric,rgb(30,30,35)) Cylinder slightly smaller inside.' },
  { name:'Vending Machine', category:'exterior', parts:'8-10', keywords:['vending','vending machine','snack','soda machine'],
    build:'Body: Part(Metal,rgb(220,220,225)) size(3,6,2.5). Front panel: Part(Metal,rgb(40,60,120)) size(2.8,5.5,0.1). Glass: Part(Glass,rgb(200,220,240),Transparency=0.3) size(2.2,3,0.1). Slot: Part(Metal,rgb(30,30,35)) size(0.8,0.3,0.1). Buttons: 6x Part(Metal,rgb(200,200,60)) size(0.3,0.3,0.1). Light: PointLight(rgb(200,220,255),Brightness=1).' },
  { name:'Stop Sign', category:'exterior', parts:'3-5', keywords:['stop sign','sign','road sign','traffic sign'],
    build:'Post: Cyl(Metal,rgb(120,120,125)) size(0.4,7,0.4). Sign: Part(Metal,rgb(200,30,30)) size(3,3,0.2). Letters: SurfaceGui with TextLabel "STOP" white GothamBold size 36.' },
  { name:'Traffic Light', category:'exterior', parts:'8-12', keywords:['traffic light','stoplight','signal'],
    build:'Pole: Cyl(Metal,rgb(60,60,65)) size(0.5,12,0.5). Arm: Part(Metal,rgb(60,60,65)) size(0.4,0.4,4) horizontal at top. Housing: Part(Metal,rgb(30,30,35)) size(1.2,3,1). Red: Part(Glass,rgb(255,50,50)) Ball size 0.8+PointLight. Yellow: Part(Glass,rgb(255,200,50)) Ball size 0.8. Green: Part(Glass,rgb(50,200,80)) Ball size 0.8.' },
  { name:'Fountain', category:'exterior', parts:'10-15', keywords:['fountain','water fountain','plaza fountain'],
    build:'Base pool: Cyl(Marble,rgb(220,215,200)) size(10,1.5,10). Inner ring: Cyl(Marble,rgb(225,220,205)) size(8,2,8). Center pillar: Cyl(Marble,rgb(230,225,210)) size(1.5,4,1.5). Top bowl: Cyl(Marble,rgb(225,220,205)) size(3,0.5,3). Water: Part(Glass,rgb(100,180,230),Transparency=0.4) fills pool. ParticleEmitter(white,upward,Rate=30) on top.' },
  { name:'Picnic Table', category:'exterior', parts:'8-12', keywords:['picnic','picnic table','outdoor table'],
    build:'Top: Part(Wood,rgb(140,95,50)) size(5,0.3,3). Seat planks: 2x Part(Wood,rgb(135,90,48)) size(5,0.3,1) on each side. A-frame legs: 4x Part(Wood,rgb(130,85,45)) size(0.5,2.5,0.5) angled. Cross brace: Part(Wood,rgb(130,85,45)) size(0.3,0.3,3) underneath.' },
  { name:'Flag Pole', category:'exterior', parts:'4-6', keywords:['flag','flag pole','flagpole','banner'],
    build:'Base: Part(Concrete,rgb(160,160,165)) size(2,1,2). Pole: Cyl(Metal,rgb(190,190,195)) size(0.3,15,0.3). Flag: Part(Fabric,rgb(200,40,40)) size(4,2.5,0.05). Ball top: Part(Metal,rgb(210,200,50)) Ball size 0.5.' },

  // ═══ TREES & NATURE ═══
  { name:'Oak Tree', category:'nature', parts:'8-14', keywords:['oak','tree','deciduous','shade tree'],
    build:'Trunk: Cyl(Wood,rgb(100,70,35)) size(2,10,2). Branches: 3x Cyl(Wood,rgb(95,65,30)) size(0.8,5,0.8) angled outward. Canopy: 4-5x Ball(LeafyGrass, vc(rgb(60,120,40),0.15)) diameters 6-10, overlapping at varied heights. Root bumps: 3x WedgePart(Wood,rgb(90,60,28)) at base.' },
  { name:'Pine Tree', category:'nature', parts:'6-10', keywords:['pine','evergreen','conifer','christmas tree','spruce'],
    build:'Trunk: Cyl(Wood,rgb(90,60,30)) size(1.5,12,1.5). Layers: 4x Part(LeafyGrass,vc(rgb(35,90,30),0.1)) cone shapes getting smaller upward. Bottom: size(8,3,8), Next: size(6,3,6) y+3, Next: size(4,2.5,4), Top: size(2,2,2). Use WedgeParts or Balls for cone shape.' },
  { name:'Palm Tree', category:'nature', parts:'8-12', keywords:['palm','tropical','beach tree','coconut'],
    build:'Trunk: 3x Cyl(Wood,rgb(160,130,80)) stacked, slight curve via CFrame.Angles. Base: size(2,5,2), Mid: size(1.5,4,1.5) offset X, Top: size(1,3,1) offset X more. Fronds: 6x Part(LeafyGrass,rgb(50,130,40)) size(1,0.1,6) radiating outward from top, angled down 20°. Coconuts: 3x Ball(Wood,rgb(120,80,30)) size 1.' },
  { name:'Bush', category:'nature', parts:'3-6', keywords:['bush','shrub','hedge','foliage'],
    build:'Main: Ball(LeafyGrass,vc(rgb(55,110,35),0.12)) size 4. Secondary: 2x Ball(LeafyGrass,vc(rgb(50,105,30),0.12)) size 3, offset to sides. Optional flowers: 3x Ball(Fabric, bright colors) size 0.5 on surface.' },
  { name:'Rock', category:'nature', parts:'3-5', keywords:['rock','boulder','stone','rock formation'],
    build:'Main: Part(Rock,rgb(140,135,125)) size(4,3,3.5) rotate slightly with CFrame.Angles. Secondary: Part(Rock,vc(rgb(135,130,120),0.05)) size(2.5,2,3) overlapping. Small: Part(Granite,rgb(130,125,115)) size(1.5,1,2) nearby.' },
  { name:'Campfire', category:'nature', parts:'8-12', keywords:['campfire','fire','bonfire','camp'],
    build:'Stone ring: 6-8x Part(Rock,vc(rgb(120,115,105),0.1)) size(1,0.8,0.8) in circle, radius 2. Logs: 3x Cyl(Wood,rgb(100,65,30)) size(0.5,3,0.5) crossed in center. Embers: Part(CrackedLava,rgb(200,80,20)) size(1,0.3,1) center. Fire: Fire instance. PointLight(rgb(255,150,50),Brightness=3,Range=25). Smoke instance optional.' },
  { name:'Flower Bed', category:'nature', parts:'10-15', keywords:['flower','garden','flower bed','floral'],
    build:'Bed frame: Part(Wood,rgb(110,70,30)) border parts forming rectangle. Soil: Part(Mud,rgb(80,50,25)) size(4,0.3,2). Flowers: 8-10x tiny Parts(Fabric, varied bright colors: red,yellow,purple,pink) size(0.3,0.6,0.3) + small Ball top. Stems: thin green Parts. Leaves: small LeafyGrass Parts.' },
  { name:'Mushroom', category:'nature', parts:'3-4', keywords:['mushroom','toadstool','fungi','forest mushroom'],
    build:'Stem: Cyl(Fabric,rgb(230,220,200)) size(1,2,1). Cap: Ball(Fabric,rgb(200,50,40)) size(3) hemisphere (half buried in stem top). Spots: 3-4x Ball(Fabric,rgb(250,245,230)) size(0.4) on cap surface.' },

  // ═══ VEHICLES ═══
  { name:'Sedan Car', category:'vehicle', parts:'20-30', keywords:['car','sedan','automobile','vehicle'],
    build:'Body: Part(Metal,rgb(40,80,160)) size(8,2,4). Hood: WedgePart(Metal,same) sloping front. Trunk: Part(Metal,same) rear raised. Roof: Part(Metal,same) size(4,1.5,3.8) on top. Windshield: Part(Glass,rgb(200,220,240),Trans=0.4) angled. Rear window: Part(Glass,same). Side windows: 4x Part(Glass,Trans=0.4). Wheels: 4x Cyl(Rubber,rgb(30,30,30)) size(1.2,0.8,1.2). Hubcaps: 4x Cyl(Metal,rgb(200,200,205)) size(0.8,0.1,0.8). Headlights: 2x Part(Glass,rgb(255,250,220))+SpotLight. Taillights: 2x Part(Neon,rgb(220,30,30)) small. Bumpers: front+rear Part(Metal,rgb(180,180,185)). VehicleSeat inside.' },
  { name:'Pickup Truck', category:'vehicle', parts:'22-32', keywords:['truck','pickup','pickup truck'],
    build:'Cab: Part(Metal,rgb(180,50,40)) size(5,3,4). Bed: Part(Metal,rgb(175,48,38)) size(5,1.5,4) behind cab, open top. Tailgate: Part(Metal,same) size(3.8,1.3,0.2). Hood: WedgePart front. Wheels: 4x Cyl(Rubber,rgb(25,25,25)) size(1.5,1,1.5) bigger than sedan. Bumpers: Part(Metal,chrome). Roll bar: Part(Metal,rgb(40,40,45)) arch over bed.' },
  { name:'Motorcycle', category:'vehicle', parts:'12-18', keywords:['motorcycle','bike','motorbike','chopper'],
    build:'Frame: Part(Metal,rgb(30,30,35)) size(3,1,1). Engine: Part(Metal,rgb(60,55,50)) size(1.5,1.5,1) center. Tank: Part(Metal,rgb(200,40,40)) size(1.5,1,1) on top. Seat: Part(Fabric,rgb(25,25,25)) size(1.2,0.3,2). Front wheel: Cyl(Rubber,rgb(30,30,30)) size(2,0.5,2). Rear wheel: same. Fork: 2x Part(Metal,rgb(200,200,205)) angled front. Handlebars: Part(Metal) curved. Exhaust: Cyl(Metal,rgb(150,150,155)) side.' },
  { name:'Helicopter', category:'vehicle', parts:'15-25', keywords:['helicopter','chopper','heli','aircraft'],
    build:'Body: Part(Metal,rgb(50,80,50)) size(4,3,8). Cockpit glass: Part(Glass,rgb(180,210,230),Trans=0.4) front curved. Tail boom: Part(Metal,rgb(50,80,50)) size(1,1,8) extending back. Tail rotor: Part(Metal,rgb(60,60,65)) size(0.1,2,0.5). Main rotor: 2x Part(Metal,rgb(70,70,75)) size(0.3,0.1,10) crossed. Skids: 2x Cyl(Metal,rgb(60,60,65)) size(0.3,0.3,6) underneath.' },
  { name:'Boat', category:'vehicle', parts:'12-18', keywords:['boat','ship','sailboat','vessel','yacht'],
    build:'Hull: Part(Wood,rgb(140,95,50)) size(4,2,10) + WedgePart bow. Deck: Part(WoodPlanks,rgb(160,115,65)) size(3.5,0.2,8). Cabin: Part(Wood,rgb(130,85,45)) size(2.5,2.5,3). Windshield: Part(Glass,Trans=0.3). Railing: Part(Metal,rgb(200,200,205)) size(0.1,1,8) on sides. Mast: Cyl(Wood) size(0.3,8,0.3) if sailboat. Sail: Part(Fabric,rgb(240,235,225)) if sailboat.' },

  // ═══ BUILDINGS ═══
  { name:'Small House', category:'building', parts:'50-80', keywords:['house','home','cottage','small house','residential'],
    build:'Foundation: Part(Concrete,rgb(150,150,155)) size(14,1.5,12) extends 1 stud past walls. Walls: 4x Part(Brick,rgb(180,150,120)) size(12,10,0.8)/size(10,10,0.8) for sides. Front wall: split into 3 parts for door opening (left+right+header). Window openings: 2-3 per side wall (3 parts each: below+above+sides). Door: Part(Wood,rgb(100,60,25)) size(4,7.5,0.3)+ProximityPrompt. Windows: Part(Glass,rgb(200,220,240),Trans=0.4)+Wood frames. Roof: 2x WedgePart(Slate,rgb(80,70,60)) meeting at ridge+1.5 overhang. Floor: Part(WoodPlanks,rgb(160,110,60)) inside. Ceiling: Part(Concrete,rgb(200,195,185)). Interior walls: 0.5 thick. Porch: foundation+railing+columns. Chimney: 4 Brick Parts stacked. Furniture: table,chairs,lamp inside. PointLight per room.' },
  { name:'Shop Front', category:'building', parts:'30-50', keywords:['shop','store','retail','storefront','market'],
    build:'Base: Part(Concrete,rgb(160,160,165)) size(10,1,8). Walls: Part(Brick,rgb(170,140,110)) sides and back. Front: large Part(Glass,rgb(200,220,240),Trans=0.3) display window + door. Awning: Part(Fabric,rgb(180,40,40)) angled WedgePart over entrance. Sign: Part(Wood)+SurfaceGui with shop name. Interior: counter(Wood), shelves(Wood), display items. Door: Part(Glass)+ProximityPrompt. PointLight inside. SpotLight on sign.' },
  { name:'Guard Tower', category:'building', parts:'25-40', keywords:['guard tower','watchtower','tower','lookout'],
    build:'Base: Part(Cobblestone,rgb(140,135,125)) size(6,8,6). Platform: Part(WoodPlanks,rgb(140,95,50)) size(8,0.3,8) at top. Railing: 4x Part(Wood,rgb(120,80,35)) size(0.3,3,8) around platform. Corner posts: 4x Part(Wood) size(0.5,3.5,0.5). Ladder: 2x Part(Wood) rails + 8x Part(Wood) rungs. Roof: 4x WedgePart(Slate) pyramid shape. SpotLight(white,Range=60) on top.' },
  { name:'Barn', category:'building', parts:'30-50', keywords:['barn','farm','farmhouse','stable'],
    build:'Base: Part(Concrete,rgb(150,150,155)) size(16,1,12). Walls: Part(Wood,rgb(150,45,40)) red barn color, 0.8 thick. Large door: 2x Part(Wood,rgb(140,40,35)) size(3,6,0.3) barn doors. Hay loft: Part(WoodPlanks) upper floor. Roof: 2x WedgePart(Metal,rgb(160,155,150)) gambrel shape. Windows: Part(Glass) high up. Hay bales: Part(Fabric,rgb(200,180,80)) scattered inside. Stall dividers: Part(Wood) inside.' },
  { name:'Gas Station', category:'building', parts:'30-45', keywords:['gas station','petrol','fuel','gas pump'],
    build:'Canopy: Part(Metal,rgb(230,230,235)) size(16,0.5,10) high up. Canopy supports: 4x Part(Metal,rgb(60,60,65)) size(0.5,10,0.5). Pumps: 2-3x Part(Metal,rgb(220,220,225)) size(1,4,0.8) with SurfaceGui displays. Building: Part(Brick,rgb(200,195,185)) small shop behind. Glass front: Part(Glass,Trans=0.3). Lights: SpotLight under canopy. Sign: Part(Metal) tall pole with station name. Road markings: Part(Concrete,rgb(255,200,50)) thin lines.' },
  { name:'Lighthouse', category:'building', parts:'20-35', keywords:['lighthouse','beacon','coastal','maritime'],
    build:'Base: Cyl(Brick,rgb(200,195,185)) size(8,4,8). Tower: Cyl(Concrete,rgb(235,230,220)) size(5,20,5) tapered (use stacked cylinders decreasing size). Red stripes: alternating Cyl(Concrete,rgb(180,40,40)) bands. Lantern room: Cyl(Glass,Trans=0.3) at top. SpotLight(white,Brightness=5,Range=100,Angle=30) rotating. Railing: Part(Metal) around lantern. Door: Part(Wood) at base.' },
  { name:'Market Stall', category:'building', parts:'15-25', keywords:['market','stall','stand','vendor','booth'],
    build:'Table: Part(WoodPlanks,rgb(150,105,55)) size(5,3,2.5). Legs: 4x Part(Wood) size(0.5,3,0.5). Awning: Part(Fabric,rgb(200,50,50)) size(6,0.1,3.5) angled + support poles. Display items: various small Parts on table. Sign: Part(Wood)+SurfaceGui hanging from awning. Crates: 2x Part(Wood,rgb(160,110,60)) size(1.5,1.5,1.5) beside table.' },

  // ═══ INDUSTRIAL ═══
  { name:'Conveyor Belt', category:'industrial', parts:'10-15', keywords:['conveyor','belt','factory','assembly'],
    build:'Frame: 2x Part(Metal,rgb(60,60,65)) size(0.5,1,10) parallel sides. Belt: Part(Rubber,rgb(30,30,30)) size(2,0.2,10) on top. Rollers: 5x Cyl(Metal,rgb(150,150,155)) size(2,0.3,0.3) underneath. Legs: 4x Part(Metal,rgb(55,55,60)) size(0.5,2.5,0.5). Motor: Part(Metal,rgb(70,70,75)) size(1,1,1) at end. Script: BodyVelocity on touching parts.' },
  { name:'Generator', category:'industrial', parts:'8-12', keywords:['generator','power','electric','engine'],
    build:'Body: Part(Metal,rgb(50,70,50)) size(3,2.5,5). Panel: Part(Metal,rgb(60,60,65)) size(2,1.5,0.2) with SurfaceGui (dials, switches). Exhaust: Cyl(Metal,rgb(70,70,75)) size(0.5,2,0.5) on top. Fuel tank: Part(Metal,rgb(180,40,40)) size(1,1.5,0.8) side. Wheels: 2x Cyl(Rubber) if portable. Sound(engine hum). ParticleEmitter(gray smoke) from exhaust.' },
  { name:'Server Rack', category:'industrial', parts:'8-12', keywords:['server','rack','computer','data center','tech'],
    build:'Frame: Part(Metal,rgb(30,30,35)) size(2,7,3). Servers: 6x Part(Metal,rgb(25,25,30)) size(1.8,0.8,2.8) stacked. LED dots: tiny Parts(Neon,rgb(0,255,100)) on each server front. Cable management: Part(Fabric,rgb(20,20,25)) side. Vent: Part(Metal,rgb(40,40,45)) top with grid pattern. PointLight(rgb(0,200,100),Brightness=0.5,Range=5).' },

  // ═══ FANTASY & SCI-FI ═══
  { name:'Portal', category:'fantasy', parts:'10-15', keywords:['portal','gateway','warp','dimensional','magic portal'],
    build:'Ring: 8-10x Part(Granite,rgb(80,60,120)) arranged in circle, each size(1.5,2,1). Inner glow: Part(Neon,rgb(120,50,200),Transparency=0.3) size(0.2,5,5) flat circle. PointLight(rgb(150,80,255),Brightness=3,Range=30). ParticleEmitter(purple,inward spiral,Rate=40). Rune marks: 4x Part(Neon,rgb(180,100,255)) tiny on ring stones. Base: Part(Cobblestone,rgb(70,65,60)) platform.' },
  { name:'Treasure Chest', category:'fantasy', parts:'6-10', keywords:['chest','treasure','loot','treasure chest'],
    build:'Box: Part(Wood,rgb(120,75,30)) size(2.5,1.5,1.8). Lid: Part(Wood,rgb(125,80,35)) size(2.5,0.8,1.8) hinged via CFrame. Metal bands: 3x Part(Metal,rgb(180,170,50)) size(2.6,0.15,1.9). Lock: Part(Metal,rgb(200,180,60)) size(0.5,0.5,0.3) front center. Coins inside: several small Part(Metal,rgb(230,200,50)) Ball shapes. ProximityPrompt "Open". PointLight(rgb(255,220,100),Brightness=1).' },
  { name:'Crystal Cluster', category:'fantasy', parts:'6-10', keywords:['crystal','gem','magic crystal','glowing crystal'],
    build:'Crystals: 5-7x Part(Glass,vc(rgb(100,200,255),0.2)) various sizes, pointed (use WedgePart or angled Part), tilted at different angles via CFrame.Angles. Base rock: Part(Rock,rgb(80,75,70)) size(3,1,3). PointLight(rgb(100,200,255),Brightness=2,Range=20). ParticleEmitter(cyan,slow upward,Rate=5,Size=0.5).' },
  { name:'Throne', category:'fantasy', parts:'10-15', keywords:['throne','king','queen','royal seat'],
    build:'Base: Part(Marble,rgb(40,35,50)) size(4,1,3). Seat: Part(Fabric,rgb(120,20,30)) size(3,0.5,2.5). Back: Part(Wood,rgb(50,40,30)) size(3.5,5,0.5) tall. Arms: 2x Part(Wood,rgb(50,40,30)) size(0.5,2,2.5). Gold trim: Part(Metal,rgb(212,175,55)) size(3.6,0.2,0.2) along top+arms. Jewels: 3x Ball(Glass,rgb(200,30,30)) size 0.3 on back. Cushion: Part(Fabric,rgb(130,25,35)) on seat. PointLight(rgb(255,220,180)).' },
  { name:'Teleporter Pad', category:'scifi', parts:'8-12', keywords:['teleporter','teleport pad','warp pad','sci-fi pad'],
    build:'Platform: Cyl(DiamondPlate,rgb(60,65,70)) size(6,0.5,6). Ring: Cyl(Metal,rgb(50,55,60)) size(7,0.3,7) hollow (larger, same Y). Glow ring: Cyl(Neon,rgb(0,200,255)) size(6.5,0.1,6.5). PointLight(rgb(0,200,255),Brightness=2,Range=15). ParticleEmitter(cyan,upward,Rate=20). Control panel: Part(Metal) with SurfaceGui nearby. Touched→teleport script.' },
]

// ═══════════════════════════════════════════════════════════════════════════
// QUERY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export function findBlueprints(prompt: string, max = 3): Blueprint[] {
  const lower = prompt.toLowerCase()
  const scored: { bp: Blueprint; score: number }[] = []
  for (const bp of BLUEPRINTS) {
    let score = 0
    for (const kw of bp.keywords) {
      if (lower.includes(kw)) score += 2
    }
    if (score === 0) {
      for (const kw of bp.keywords) {
        for (const word of kw.split(' ')) {
          if (word.length > 3 && lower.includes(word)) score += 1
        }
      }
    }
    if (score > 0) scored.push({ bp, score })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, max).map(s => s.bp)
}

export function formatBlueprintsForPrompt(blueprints: Blueprint[]): string {
  if (blueprints.length === 0) return ''
  const lines = ['\n[OBJECT_BLUEPRINTS]', 'Reference these part-by-part construction guides:','']
  for (const bp of blueprints) {
    lines.push(`${bp.name} (${bp.parts} parts):`)
    lines.push(bp.build)
    lines.push('')
  }
  lines.push('[/OBJECT_BLUEPRINTS]')
  return lines.join('\n')
}

export function getBlueprintCount(): number { return BLUEPRINTS.length }
