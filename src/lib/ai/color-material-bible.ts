// color-material-bible.ts — Roblox color and material knowledge
// ALL properties verified. NEVER SmoothPlastic for realistic builds. RGB triplets.

export const COLOR_PALETTES: string = `
=== THEMED COLOR PALETTES (5-8 RGB values each) ===

--- FOREST ---
Dark Pine: RGB(30, 60, 25) | Moss: RGB(70, 95, 40) | Bark: RGB(85, 55, 25)
Fern: RGB(50, 120, 40) | Sunlit Leaf: RGB(100, 150, 50) | Forest Floor: RGB(65, 45, 20)
Mushroom Cap: RGB(160, 50, 30) | Lichen: RGB(140, 160, 100)

--- OCEAN ---
Deep Sea: RGB(10, 30, 80) | Ocean Mid: RGB(20, 80, 140) | Shallow: RGB(40, 150, 180)
Seafoam: RGB(120, 200, 190) | Wave Crest: RGB(200, 230, 240) | Coral: RGB(200, 100, 80)
Sand Bottom: RGB(190, 170, 130) | Kelp: RGB(40, 80, 30)

--- DESERT ---
Sand Light: RGB(220, 195, 150) | Sand Dark: RGB(185, 155, 110) | Dune Shadow: RGB(150, 120, 80)
Rock Tan: RGB(170, 145, 100) | Terracotta: RGB(180, 100, 60) | Oasis Green: RGB(60, 110, 40)
Sunset Orange: RGB(220, 130, 50) | Cactus: RGB(80, 120, 50)

--- WINTER / SNOW ---
Fresh Snow: RGB(240, 245, 250) | Shadow Snow: RGB(180, 195, 220) | Ice Blue: RGB(150, 200, 240)
Frozen Lake: RGB(120, 170, 210) | Pine Winter: RGB(35, 55, 35) | Bark Frost: RGB(100, 80, 60)
Warm Light: RGB(255, 200, 120) | Stone Cold: RGB(130, 135, 145)

--- VOLCANIC ---
Lava: RGB(255, 80, 0) | Molten Core: RGB(255, 180, 30) | Basalt: RGB(40, 35, 30)
Obsidian: RGB(20, 15, 25) | Ash: RGB(80, 75, 70) | Smoke: RGB(100, 90, 85)
Ember: RGB(200, 50, 10) | Cooled Lava: RGB(55, 35, 30)

--- CYBERPUNK ---
Neon Pink: RGB(255, 20, 147) | Neon Blue: RGB(0, 195, 255) | Neon Purple: RGB(180, 0, 255)
Dark Chrome: RGB(30, 30, 40) | Wet Asphalt: RGB(45, 45, 55) | Hologram: RGB(0, 255, 200)
Warning Yellow: RGB(255, 220, 0) | Rust: RGB(140, 70, 30)

--- MEDIEVAL ---
Stone Wall: RGB(140, 135, 125) | Castle Dark: RGB(80, 75, 70) | Wood Beam: RGB(100, 65, 30)
Banner Red: RGB(160, 30, 30) | Banner Blue: RGB(30, 50, 140) | Gold Trim: RGB(200, 170, 50)
Iron: RGB(120, 120, 130) | Torch Warm: RGB(220, 160, 60)

--- SCI-FI ---
Hull Gray: RGB(150, 155, 165) | Panel Light: RGB(200, 205, 215) | Accent Blue: RGB(50, 130, 220)
Warning Red: RGB(200, 40, 40) | Screen Green: RGB(50, 200, 100) | Black Void: RGB(15, 15, 20)
Highlight White: RGB(230, 235, 245) | Energy Core: RGB(80, 200, 255)

--- PASTEL ---
Baby Pink: RGB(255, 182, 193) | Lavender: RGB(200, 180, 230) | Mint: RGB(160, 230, 200)
Baby Blue: RGB(170, 210, 240) | Peach: RGB(255, 200, 170) | Lemon: RGB(255, 250, 180)
Cream: RGB(255, 245, 230) | Lilac: RGB(220, 190, 240)

--- HALLOWEEN ---
Pumpkin: RGB(230, 120, 20) | Black: RGB(20, 20, 25) | Ghost White: RGB(230, 230, 240)
Blood Red: RGB(140, 15, 15) | Poison Green: RGB(50, 180, 30) | Purple Night: RGB(60, 20, 80)
Cobweb: RGB(180, 180, 185) | Candle: RGB(255, 200, 80)

--- CHRISTMAS ---
Holly Green: RGB(20, 100, 30) | Red: RGB(200, 30, 30) | Gold: RGB(210, 180, 50)
Snow: RGB(240, 245, 250) | Candy Stripe: RGB(230, 50, 50) | Pine Dark: RGB(25, 60, 25)
Gift Blue: RGB(60, 100, 180) | Star: RGB(255, 230, 100)

--- PIRATE ---
Wood Plank: RGB(120, 80, 35) | Sail Cream: RGB(220, 205, 175) | Sea Blue: RGB(30, 80, 130)
Rope: RGB(160, 130, 80) | Barnacle: RGB(100, 110, 90) | Treasure Gold: RGB(220, 190, 50)
Rust Iron: RGB(130, 75, 40) | Flag Black: RGB(25, 25, 30)

--- CANDY ---
Bubblegum: RGB(255, 110, 180) | Mint Green: RGB(100, 220, 160) | Licorice: RGB(30, 20, 20)
Lollipop Red: RGB(230, 40, 50) | Caramel: RGB(190, 140, 60) | Cotton Candy: RGB(230, 180, 255)
Vanilla: RGB(255, 240, 210) | Blueberry: RGB(80, 80, 200)

--- MILITARY ---
OD Green: RGB(75, 85, 55) | Desert Tan: RGB(175, 155, 120) | Navy: RGB(25, 35, 55)
Khaki: RGB(155, 140, 105) | Camo Dark: RGB(50, 55, 35) | Steel: RGB(130, 135, 140)
Brass: RGB(180, 155, 80) | Flat Black: RGB(30, 30, 35)

--- ROYAL ---
Royal Purple: RGB(80, 25, 120) | Gold: RGB(210, 180, 50) | Crimson: RGB(150, 20, 30)
Ivory: RGB(240, 235, 220) | Navy Blue: RGB(20, 30, 80) | Emerald: RGB(20, 130, 50)
Silver: RGB(190, 195, 205) | Velvet: RGB(120, 15, 50)

--- STEAMPUNK ---
Brass: RGB(180, 150, 60) | Copper: RGB(170, 110, 60) | Dark Iron: RGB(55, 50, 45)
Leather: RGB(100, 60, 25) | Mahogany: RGB(80, 40, 20) | Gear Gold: RGB(200, 170, 50)
Steam White: RGB(220, 220, 225) | Patina Green: RGB(80, 140, 100)

--- UNDERWATER ---
Abyss: RGB(5, 15, 40) | Deep Blue: RGB(15, 40, 90) | Bioluminescent: RGB(30, 200, 180)
Coral Pink: RGB(220, 120, 110) | Coral Orange: RGB(230, 150, 80) | Seafloor: RGB(80, 90, 70)
Pearl: RGB(230, 225, 220) | Jellyfish Purple: RGB(140, 60, 200)

--- AUTUMN ---
Maple Red: RGB(180, 40, 20) | Orange Leaf: RGB(220, 130, 30) | Golden: RGB(200, 170, 50)
Brown Bark: RGB(80, 50, 25) | Olive: RGB(100, 110, 50) | Harvest: RGB(180, 140, 60)
Pumpkin Spice: RGB(190, 100, 40) | Dried Grass: RGB(160, 145, 90)

--- SPRING ---
Blossom Pink: RGB(255, 180, 195) | Leaf Green: RGB(80, 160, 50) | Sky Blue: RGB(130, 190, 240)
Daffodil: RGB(255, 230, 80) | Lilac: RGB(190, 160, 220) | Fresh Grass: RGB(60, 140, 40)
White Petal: RGB(250, 245, 240) | Robin Egg: RGB(120, 200, 210)

--- GOTHIC ---
Black: RGB(15, 10, 15) | Dark Red: RGB(100, 10, 15) | Charcoal: RGB(40, 35, 40)
Silver: RGB(170, 175, 185) | Purple: RGB(60, 20, 70) | Bone: RGB(200, 190, 170)
Candle Yellow: RGB(240, 200, 80) | Stained Glass: RGB(120, 30, 120)

--- TROPICAL ---
Ocean Teal: RGB(0, 160, 160) | Palm Green: RGB(30, 130, 40) | Sand: RGB(230, 210, 170)
Hibiscus: RGB(230, 50, 80) | Sunset: RGB(250, 150, 50) | Coconut: RGB(180, 160, 120)
Lagoon: RGB(60, 200, 200) | Fruit Yellow: RGB(255, 220, 60)

--- INDUSTRIAL ---
Concrete Gray: RGB(160, 155, 150) | Rust: RGB(140, 70, 30) | Steel Blue: RGB(100, 110, 130)
Warning Yellow: RGB(240, 200, 0) | Pipe Gray: RGB(120, 120, 125) | Oil Black: RGB(25, 25, 30)
Brick Red: RGB(140, 60, 40) | Caution Orange: RGB(230, 120, 20)

--- FARMHOUSE ---
Barn Red: RGB(140, 35, 30) | Cream: RGB(240, 230, 200) | Sage: RGB(130, 150, 120)
Wheat: RGB(210, 190, 130) | Sky Blue: RGB(150, 190, 220) | Dark Wood: RGB(70, 45, 20)
Rooster Red: RGB(170, 45, 35) | Egg Shell: RGB(245, 240, 225)
`

export const MATERIAL_GUIDE: string = `
=== ROBLOX MATERIALS — COMPLETE GUIDE ===

--- PART MATERIALS (BasePart.Material) ---

Brick: Rough rectangular brick pattern. Use for: walls, chimneys, exteriors.
  Rendering cost: LOW. Good for large surfaces.
  Color well with: warm reds RGB(140,60,40), tans RGB(180,150,100), gray RGB(140,135,125)

Concrete: Rough, slightly porous. Use for: foundations, sidewalks, modern walls, bunkers.
  Rendering cost: LOW. Excellent for structural elements.
  Color well with: grays RGB(150-180, 145-175, 140-170), dark RGB(60,55,50)

CorrodedMetal: Rough rusted metal. Use for: abandoned buildings, post-apocalyptic, steampunk.
  Rendering cost: MEDIUM. Adds grit to metal surfaces.
  Color well with: rust RGB(140,70,30), dark iron RGB(55,50,45)

DiamondPlate: Metal with raised diamond pattern. Use for: industrial floors, catwalks, ramps.
  Rendering cost: MEDIUM. Strong industrial feel.
  Color well with: silver RGB(170,170,180), dark RGB(80,80,90)

Fabric: Soft cloth appearance. Use for: curtains, upholstery, rugs, banners, clothing, rope.
  Rendering cost: LOW. Versatile for soft goods.
  Color well with: ANY color. Most versatile material.

Foil: Shiny reflective thin metal. Use for: decorative accents, gift wrap, balloons.
  Rendering cost: MEDIUM. Eye-catching on small parts.

ForceField: Transparent energy field. Use for: shields, magic auras, sci-fi barriers, holograms.
  Rendering cost: HIGH. Use sparingly. Set Transparency 0.3-0.7 for best effect.
  Always pair with Neon parts underneath for glow.

Glass: Transparent smooth. Use for: windows, bottles, display cases, aquariums.
  Rendering cost: HIGH (transparency). Use Transparency 0-0.7.
  Color well with: light blues RGB(150,200,240), clear RGB(200,220,240)

Granite: Speckled stone pattern. Use for: countertops, monuments, fancy floors.
  Rendering cost: LOW. Premium stone feel.
  Color well with: grays with slight color tint, blacks, dark reds

Grass: Green organic texture. Use for: natural ground, garden beds, planters.
  Rendering cost: LOW. Only for outdoor/natural elements.
  Color well with: greens RGB(40-100, 80-160, 20-60)

Ice: Smooth translucent crystal. Use for: frozen environments, ice castles, crystals.
  Rendering cost: MEDIUM. Set Transparency 0.1-0.3 for best effect.
  Color well with: light blues RGB(150-220, 200-240, 230-255)

Marble: Smooth veined stone. Use for: pillars, fancy floors, statues, bathrooms.
  Rendering cost: LOW. Luxury feel.
  Color well with: whites RGB(230-245), creams RGB(240,230,210), black

Metal: Smooth industrial metal. Use for: weapons, vehicles, machinery, rails, pipes.
  Rendering cost: LOW. Essential material. DEFAULT for weapons/tools.
  Color well with: silvers, dark steel, colored metals

Neon: Self-illuminating, emits light. Use for: signs, magic elements, sci-fi panels, indicators.
  Rendering cost: HIGH (light emission). Use small parts. Pairs with PointLight.
  ANY color works. The part GLOWS that color.

Pebble: Small stone aggregate. Use for: garden paths, driveways, cobblestone-like areas.
  Rendering cost: LOW. Natural ground cover.

Plastic: Smooth non-reflective. Use for: toys, props, cartoon builds.
  Rendering cost: LOWEST. Good for stylized builds only.
  NOTE: For realistic builds, NEVER use Plastic or SmoothPlastic.

Sand: Grainy soft texture. Use for: beaches, sand pits, desert ground.
  Rendering cost: LOW. Natural feel.
  Color well with: tans, yellows, light browns

Slate: Layered stone. Use for: roofs, walkways, retaining walls, natural stone.
  Rendering cost: LOW. Excellent for roofing.
  Color well with: gray-blues, dark grays, dark greens

Wood: Visible grain pattern. Use for: floors, furniture, frames, fences, handles.
  Rendering cost: LOW. Essential for organic builds.
  Color well with: browns RGB(70-140, 40-90, 15-45), light pine RGB(180,150,100)

WoodPlanks: Plank pattern with gaps. Use for: decks, docks, crates, old floors, siding.
  Rendering cost: LOW. More rustic than Wood.
  Color well with: same as Wood, slightly more weathered tones

Cobblestone: Rounded stone pattern. Use for: paths, medieval streets, old walls.
  Rendering cost: LOW. Great for period builds.

--- MATERIAL COST HIERARCHY (rendering performance) ---
CHEAPEST: Plastic, Concrete, Brick, Wood, WoodPlanks, Granite, Marble, Fabric, Sand, Slate, Pebble, Cobblestone, Grass
MEDIUM: Metal, DiamondPlate, CorrodedMetal, Foil, Ice
EXPENSIVE: Glass (transparency), Neon (light emission), ForceField (transparency + special)

RULE: Use cheap materials for large surfaces (walls, floors, roofs).
Reserve expensive materials for small accent parts (windows, glowing elements).

--- TERRAIN MATERIALS (Terrain only — NOT for BasePart) ---
Grass, Sand, Rock, Water, Ground, Mud, Ice, Snow, Sandstone, Slate,
Concrete, Brick, Cobblestone, Asphalt, LeafyGrass, Salt, Limestone, Pavement, CrackedLava
Terrain voxel resolution: ALWAYS 4 studs
`

export const COLOR_COMBINATIONS: string = `
=== COLOR THEORY FOR ROBLOX BUILDS ===

--- 60-30-10 RULE ---
60% dominant color: walls, large surfaces (neutral/subdued)
30% secondary color: trim, accents, furniture (complementary)
10% accent color: details, highlights (pop of contrast)
Example medieval: 60% Stone Gray RGB(140,135,125) walls, 30% Wood Brown RGB(100,65,30) beams, 10% Banner Red RGB(160,30,30)

--- COMPLEMENTARY PAIRS (high contrast, bold) ---
Red RGB(180,40,40) + Cyan RGB(40,180,180)
Blue RGB(40,60,180) + Orange RGB(220,140,30)
Green RGB(40,140,50) + Magenta RGB(180,40,140)
Purple RGB(100,40,160) + Yellow-Green RGB(160,200,40)

--- ANALOGOUS (harmonious, calming) ---
Ocean: Blue RGB(30,80,150) + Teal RGB(30,130,140) + Cyan RGB(50,170,180)
Forest: Green RGB(40,120,30) + Yellow-Green RGB(100,150,40) + Olive RGB(120,130,50)
Sunset: Red RGB(200,50,30) + Orange RGB(230,130,40) + Yellow RGB(240,200,50)
Berry: Purple RGB(100,30,130) + Magenta RGB(170,40,110) + Pink RGB(220,80,120)

--- WARM VS COOL ---
Warm palette (cozy, inviting, energetic):
  Use reds, oranges, yellows, warm browns, gold
  PointLight Color warm: RGB(255,200,150) or RGB(255,180,100)
  Ambient warm: Color3.fromRGB(80,60,40)

Cool palette (calm, mysterious, professional):
  Use blues, teals, purples, cool grays, silver
  PointLight Color cool: RGB(150,180,255) or RGB(180,200,240)
  Ambient cool: Color3.fromRGB(40,50,80)

--- SATURATION FOR STYLE ---
High saturation = cartoon/stylized: bright, pure colors
  Example: RGB(255,50,50) pure red, RGB(50,255,50) pure green
Low saturation = realistic: muted, grayed colors
  Example: RGB(140,60,50) muted red, RGB(70,110,60) muted green
  ALWAYS desaturate for realistic builds — pure colors look fake

--- VALUE CONTRAST ---
Light on dark = readable, dramatic: white text on dark wall
Dark on light = classic, clean: dark trim on light walls
Low contrast = subtle, elegant: dark gray on medium gray
Use at least 30% value difference for important details to be visible

--- MATERIAL-COLOR INTERACTION ---
Metal + light color = shiny chrome look
Metal + dark color = wrought iron / dark steel
Wood + warm brown = natural, realistic
Wood + gray = weathered/driftwood
Brick + red/brown = classic residential
Brick + gray = industrial/urban
Concrete + gray = modern/brutalist
Concrete + warm = Mediterranean stucco look
Neon + ANY = glowing version of that color
`

export const MATERIAL_BY_CONTEXT: string = `
=== MATERIAL SELECTION BY BUILD CONTEXT ===

--- RESIDENTIAL HOUSE ---
Exterior walls: Brick or Concrete (painted look)
Roof: Slate (shingles) or Concrete (tiles)
Foundation: Concrete (dark gray)
Window frames: Wood or Metal
Doors: Wood
Interior walls: Concrete (smooth painted)
Floors: Wood or WoodPlanks
Trim/molding: Wood
Counters: Granite or Marble

--- MEDIEVAL CASTLE ---
Walls: Cobblestone or Concrete (stone blocks)
Towers: Cobblestone with Concrete corners
Roof: Slate or WoodPlanks
Floors: Cobblestone or Slate
Beams: Wood
Doors: Wood with Metal hardware
Flags: Fabric
Torches: Wood handle, Neon flame
Chains: Metal

--- MODERN OFFICE ---
Exterior: Concrete + Glass curtain wall
Interior walls: Concrete (white/light)
Floors: Granite (polished) or Marble (lobby)
Ceiling: Concrete (white panels)
Furniture: Metal frames + Fabric seats
Desks: Wood surface + Metal legs
Reception: Marble counter + Metal frame
Elevator: Metal + DiamondPlate floor

--- FACTORY / INDUSTRIAL ---
Walls: Concrete or Metal panels
Roof: Metal (corrugated look)
Floor: Concrete or DiamondPlate
Pipes: Metal
Catwalks: DiamondPlate + Metal rails
Crates: WoodPlanks
Machinery: Metal + CorrodedMetal
Warning signs: Neon yellow

--- SPACESHIP ---
Hull: Metal (light gray/white)
Interior panels: Metal or Concrete (white)
Floor: DiamondPlate or Metal
Windows: Glass (dark tinted)
Consoles: Metal base + Neon displays
Lights: Neon strips (accent color)
Doors: Metal (sliding)
Wiring: Fabric or Metal (small)
Force fields: ForceField material

--- COTTAGE / CABIN ---
Walls: Wood or WoodPlanks
Roof: WoodPlanks or Slate
Floor: WoodPlanks
Fireplace: Cobblestone or Brick
Furniture: Wood frames + Fabric cushions
Windows: Glass + Wood frames
Door: Wood (thick)
Chimney: Brick or Cobblestone

--- UNDERWATER BASE ---
Exterior hull: Metal (dark)
Windows: Glass (large dome sections)
Interior: Metal + Concrete (white)
Airlocks: Metal (heavy)
Control panels: Metal + Neon
Pipes: Metal (exposed)
Floor: DiamondPlate or Metal
Coral outside: Neon + Glass for bioluminescence
`

export const COLOR_THEORY: string = `
=== ADVANCED COLOR THEORY ===

--- MOOD THROUGH COLOR ---
Horror: Desaturated, dark. Grays, muted reds, sickly greens. Max value ~60%.
Fantasy: Rich saturated. Deep blues, vibrant greens, gold accents.
Sci-fi: Cool blues, neon accents on dark backgrounds. High contrast.
Cozy: Warm browns, creams, soft oranges. Low contrast.
Tropical: Saturated warm + cool. Bright greens, turquoise, coral.
Post-apocalyptic: Browns, grays, rust. Desaturated everything.

--- ROBLOX-SPECIFIC COLOR TIPS ---
BrickColor vs Color3: Always use Color3.fromRGB() for precise control.
  BrickColor has limited palette. Color3 gives full RGB range.
Lighting affects perceived color: Ambient light tints everything.
  Test colors with your Lighting setup active.
Neon parts glow their exact Color3 — choose carefully.
  Too bright Neon (255,255,255) washes out in bright scenes.
  Use slightly desaturated Neon: RGB(200,230,255) instead of pure white.

--- NATURAL COLOR VARIATION ---
Real buildings are not one flat color. Vary within 10-20 RGB per section:
  Wall section 1: RGB(140,135,125)
  Wall section 2: RGB(135,130,120)
  Wall section 3: RGB(145,140,130)
This creates realistic weathering / age variation.
Use 2-3 slightly different shades for large surfaces.
`

export const COLOR_MATERIAL_BIBLE: string = COLOR_PALETTES + '\n\n' + MATERIAL_GUIDE + '\n\n' + COLOR_COMBINATIONS + '\n\n' + MATERIAL_BY_CONTEXT + '\n\n' + COLOR_THEORY
