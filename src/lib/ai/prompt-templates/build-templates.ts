/**
 * build-templates.ts
 *
 * Expert prompt prefixes for the BUILD mode, keyed by game genre.
 *
 * Each template is a 200-300 word world-class instruction that we prepend
 * to the user's prompt before passing it to the build planner. They encode
 * the knowledge a top-3% Roblox developer would bring to a scene: part
 * counts, stud ranges, material palettes, lighting, prop vocabulary, and
 * the architectural rules that make the build feel coherent.
 *
 * NEVER strip the closing instruction that says "now fulfill the user's
 * request below" — the low-context amplifier relies on it.
 */

export type Genre =
  | 'medieval-fantasy'
  | 'dark-fantasy'
  | 'sci-fi'
  | 'cyberpunk'
  | 'post-apocalyptic'
  | 'modern-city'
  | 'tropical-island'
  | 'western-frontier'
  | 'pirate-cove'
  | 'horror-mansion'
  | 'tycoon-simulator'
  | 'obby-parkour'
  | 'racing-track'
  | 'tower-defense'
  | 'rpg-adventure'
  | 'generic'

const CLOSING = `\n\nIMPORTANT BUILD RULES:
- Generate AT LEAST 30 parts for any scene. Cities need 50-100+. Full games need 100+.
- NEVER describe the build in marketing language. No "stunning", "captivating", "sleek", "vibrant", "touch of warmth", "sophistication", "grandeur", "luxurious". Talk like a real person showing a friend what they built.
- VARY your colors. Do NOT default to "royal blue, emerald, and gold" for everything. Pick colors that match the THEME — a forest is green/brown, a city is grey/white/glass, a tycoon is industrial grey/green/yellow.
- Use concrete stud values, part counts, and Color3.fromRGB(). Never say "a touch of" or "adding luxury".
- Talk about your build naturally — like showing a friend. 3-6 sentences. What you built, one cool detail, and what to try next. NOT a parts list. NOT a press release.
- Reuse parts via Clone() when possible to keep the tree tidy.`

export const BUILD_TEMPLATES: Record<Genre, string> = {
  'medieval-fantasy': `You are building a medieval fantasy scene for Roblox. Think "Kingdom of the Sun" or "Elder Kingdom" — chunky low-poly hand-painted stylings, warm golden-hour lighting, 55° geographic latitude, Voxel shadow technology. Keep the silhouette strong: crenellated battlements at the top of every wall, slit windows every 12 studs, buttresses every 20 studs. Material palette is Slate for walls, Wood for doors and trim, Metal for hinges and banded reinforcements, Cobblestone for courtyards. Colors: primary #5B5D69 slate, secondary #6A3909 wood, accent #DA863B copper, highlight #F5CD30 gold. Use Part instances 4-24 studs per dimension — never spawn hundreds of tiny 1x1s when a single scaled Part will do. Include: at least one tower 30+ studs tall, at minimum 6 props (torch sconces, wooden barrels, hay bales, banners, crates, shields), and a primary "hero asset" the user's prompt revolves around. Lighting: clock 8.5, brightness 2, ambient #8B7355, exposure -0.2, fog density 0.003. Respect these forbidden elements: no neon, no chrome, no sci-fi textures.${CLOSING}`,

  'dark-fantasy': `You are building a dark fantasy scene for Roblox — the Dark Souls, Bloodborne, Elden Ring register. Towering gothic silhouettes, fog, oppressive scale. Material palette is Slate and CorrodedMetal for everything structural, Wood only for rotted beams, Grass only for overgrown moss patches. Colors: primary #2A2A33, secondary #4B3C2E, accent #8B0000 blood red, highlight #C9B37A tarnished gold. Use epic scale: cathedral ceilings 40+ studs tall, cracked pillars every 18 studs, gargoyles or braziers at every corner. Lighting is Future technology, clock 18.5 (dusk), brightness 1.2, ambient #1A1A25, fog density 0.015, fog color #2A2A33, exposure -0.6. Include visible wear: Transparency 0.05-0.15 on select decorative parts to hint at decay, CFrame rotations of ±3° on "fallen" stones, and at least one broken column or collapsed archway. Prefer curved arches via Wedge parts, flying buttresses via angled Parts joined with WeldConstraints. Forbidden: bright saturated colors, modern materials, cheerful props.${CLOSING}`,

  'sci-fi': `You are building a sci-fi scene for Roblox in the clean-futurism register — think The Expanse, Mass Effect, or "Star Citizen hangar bay". Material palette is Metal and SmoothPlastic exclusively for structure, Neon for accent lines and holographic panels, Glass for viewports. Colors: primary #2C3E50 deep steel, secondary #ECF0F1 white, accent #00C2FF cyan, highlight #00FFA0 neon green. Geometry is precise: all angles 90° or 45°, all stud values multiples of 2, panel seams every 8 studs via thin 0.2-stud Parts as greebles. Lighting is Future technology, clock 12, brightness 3, ambient #5F7F9F, exposure 0.2, fog density 0 (clean atmosphere). Use Beam or PointLight instances with Color3 #00C2FF at 3-5 stud range along corridor floors. Include: at least 3 "greebled" panels with visible bolts/vents/pipes, 1-2 holographic displays (flat Neon Parts), and a clear ingress/egress route. The scene must read as "engineered" — no random clutter. Forbidden: wood, cobblestone, medieval details.${CLOSING}`,

  'cyberpunk': `You are building a cyberpunk scene for Roblox — rainy neon Tokyo, Blade Runner, Cyberpunk 2077. Material palette is DiamondPlate, Concrete, and CorrodedMetal for structure, Neon for every sign and light fixture, Glass with Transparency 0.6 for storefront windows. Colors: primary #0D0221 near-black purple, secondary #450A9E deep purple, accent #FF2E93 hot pink, highlight #00F0FF electric cyan. Lighting is Future tech, clock 21.5 (night), brightness 0.8, ambient #1A0A3A, fog density 0.008, fog color #2A0A4A, exposure 0.1. Scene must feel wet and overcrowded: overlapping signs, dangling cables (thin cylinder Parts), ventilation vents, air conditioning units bolted to walls. At least 8 Neon parts with distinct colors acting as signs, 3 PointLight instances with Range 12 and Brightness 2 for local neon glow, and visible "rain" feel via slight reflections. Use part scales 2-16 studs. Forbidden: daylight, clean corporate sterility, rural props.${CLOSING}`,

  'post-apocalyptic': `You are building a post-apocalyptic scene for Roblox — Fallout, Metro Exodus, The Last of Us. Material palette is Rust, CorrodedMetal, CrackedLava, WoodPlanks (weathered), and Sand for the ground. Colors: primary #3E2E1F weathered brown, secondary #6B5B3F dust, accent #9C4A2F rust, highlight #D4B460 dirty yellow. Lighting is ShadowMap, clock 16 (late afternoon dust), brightness 1.8, ambient #6B5B3F, fog density 0.012, fog color #A89060 sepia haze, exposure -0.1. Every structure is partially collapsed: at least one tilted wall at ±5°, exposed rebar (thin black Cylinder parts), shattered windows (Transparency 1 with broken glass fragments as Wedges around the frame). Props: rusted car hulks, abandoned crates, tattered cloth flags, old tires, scattered papers. Use 2-12 stud part scales for debris. Forbidden: pristine anything, bright colors, intact glass.${CLOSING}`,

  'modern-city': `You are building a modern city scene for Roblox — NYC, Tokyo, Downtown LA. Material palette is SmoothPlastic and Concrete for buildings, Glass (Transparency 0.4) for office windows, Asphalt for roads. Colors: primary #4A5568 steel grey, secondary #E2E8F0 glass white, accent #3B82F6 signage blue, highlight #FBBF24 taxi yellow. Buildings are rectilinear, 30-80 studs tall for mid-rises, 100+ studs for skyscrapers, all with flat or stepped rooftops. Add 4-stud-wide sidewalks along every road edge. Lighting is ShadowMap, clock 13 (midday), brightness 2.5, ambient #7A8699, exposure 0, fog density 0.001. Include street-level detail: lampposts every 16 studs, fire hydrants, trash cans, parked cars (primitive shapes), crosswalk stripes via SurfaceGui. At least one distinctive landmark building with stepped massing. Forbidden: fantasy props, medieval materials, rural elements.${CLOSING}`,

  'tropical-island': `You are building a tropical island scene for Roblox — think "paradise cove". Material palette is Sand for beaches, Grass for inland, Wood (light) for huts and docks, LeafyGrass for foliage, Water (Terrain) for ocean. Colors: primary #F4E4BC sand, secondary #2ECC71 palm green, accent #00CED1 turquoise water, highlight #FF6B35 sunset orange. Lighting is Future tech, clock 14.5 (bright afternoon), brightness 3, ambient #A0C4E4, exposure 0.3, fog density 0, geographic latitude 5. Ocean via Terrain:FillBlock with Material Water. Include: at least 5 palm trees (Cylinder trunks + scaled Wedge fronds), a wooden dock extending 20+ studs into the water, tiki torches with PointLight, beach chairs. Ground is Sand within 30 studs of shoreline, Grass beyond. Forbidden: snow, gothic elements, industrial materials.${CLOSING}`,

  'western-frontier': `You are building a western frontier scene for Roblox — Red Dead, Tombstone. Material palette is WoodPlanks for buildings, Sand and Slate for ground, Metal for railings and sheriff star details. Colors: primary #8B4513 saddle brown, secondary #D2B48C tan, accent #8B0000 dark red, highlight #DAA520 goldenrod. Lighting is ShadowMap, clock 17 (golden hour), brightness 2.3, ambient #C19A6B, fog density 0.004, fog color #D2B48C dust, exposure 0. Buildings are 1-2 stories, false-front wooden facades 18 studs wide and 24 studs tall, boardwalks 4 studs wide in front, hitching posts with horse-sized gaps. Include: saloon with swinging doors, general store, a main dirt street 24 studs wide, at least one wagon or wooden barrel set. Props are rough and hand-made. Forbidden: neon, chrome, anything from after 1900.${CLOSING}`,

  'pirate-cove': `You are building a pirate cove scene for Roblox — Sea of Thieves, Caribbean. Material palette is WoodPlanks for ships and docks, Sand and Rock for the cove, Water (Terrain) for the bay. Colors: primary #3D2817 dark wood, secondary #D4A24C aged brass, accent #8B0000 sail red, highlight #F4E4BC sand. Lighting is ShadowMap, clock 15 (afternoon), brightness 2.4, ambient #90A8C0, fog density 0.002, exposure 0.1. Feature at least one galleon or sloop: Hull as stretched Wedge + Box parts 40+ studs long, mast as Cylinder 30 studs tall, sails as flat Parts with printed Decal or tinted Color3. Add barrels, coiled rope (Torus proxies), a treasure chest, lanterns with PointLight (orange Color3 #FFA500). Dock extends from rocky shore, ship tied via thin cylinder "ropes". Forbidden: modern machinery, sci-fi, clean geometry.${CLOSING}`,

  'horror-mansion': `You are building a horror mansion scene for Roblox — Resident Evil 1, Amnesia. Material palette is Wood (dark) and Fabric for interiors, Slate for exteriors, Glass (cracked, Transparency 0.3) for windows. Colors: primary #1A0F08 almost-black wood, secondary #4A2F1F aged mahogany, accent #8B0000 blood, highlight #C4A77D candle gold. Lighting is Future tech, clock 2 (dead of night), brightness 0.3, ambient #0A0A15, fog density 0.02, fog color #0A0A15, exposure -0.8. Light the scene with SPECIFIC PointLights only — a candelabra here, a fireplace there — leaving deep shadow between. Every room should have 4-6 decorative props: portraits (Decal on Part), old books, candlesticks, covered furniture (cloth-draped parts with Fabric material). At least one unsettling detail: dragging footprints, an open door, a fallen chandelier. Forbidden: bright lights, cheerful colors, modern materials.${CLOSING}`,

  'tycoon-simulator': `You are building a tycoon game base for Roblox — the genre where players buy droppers, upgrade conveyors, and watch cash stack up. Use a modular 32x32 stud base pad as the player's plot, clearly bordered by a thin Part frame in Neon accent color. Material palette is SmoothPlastic for clean modular look, Metal for machinery, Neon for accent signs and buttons. Colors: primary #2C3E50 dark grey, secondary #ECF0F1 white, accent #27AE60 cash green, highlight #F39C12 gold. Layout: a clear "main path" from droppers → conveyor → collector, with purchase buttons (Color3 #27AE60 Part with SurfaceGui "BUY $100") placed every 10 studs along upgrade paths. Each building tier is labeled with SurfaceGui text. Include starter dropper (small Metal box), a conveyor belt made of 8 Parts with Texture scrolling, and a collector that will emit parts. Lighting: ShadowMap, clock 12, brightness 2, ambient #E0E0E0. Forbidden: organic shapes, unclear ownership borders, props without purpose.${CLOSING}`,

  'obby-parkour': `You are building an obby (obstacle course) for Roblox. Layout is a linear sequence of 8-15 stages, each 12-24 studs long, separated by checkpoint Parts (distinct color #00FF00 Neon). Material palette is SmoothPlastic for all jumps (predictable physics), Neon for checkpoints, Metal for moving/rotating obstacles. Each stage tests ONE mechanic: narrow beam, gap jump, moving kill brick, rotating platform, disappearing tile, truss climb, wall-hop. Use stud values that exactly match Roblox player physics: max jump distance ~24 studs horizontal, max jump height ~7 studs. Colors: primary #3498DB blue path, secondary #ECF0F1 white, accent #E74C3C kill red, highlight #2ECC71 checkpoint green. Kill bricks MUST be Neon red with Touched damage script. Start platform is 16x16 studs. Lighting: ShadowMap, clock 14, brightness 3, ambient #B0D0E0. Forbidden: impossible gaps, invisible walls, ambiguous kill zones.${CLOSING}`,

  'racing-track': `You are building a racing track for Roblox — Mario Kart, Forza. Track surface is a continuous ribbon of SmoothPlastic Parts 24 studs wide, with clearly painted lane stripes (Decal or thin Neon parts). Use CFrame rotation to create banked turns (roll ±15° on corners). Colors: primary #2C3E50 asphalt, secondary #ECF0F1 stripe white, accent #E74C3C start-line red, highlight #F39C12 warning orange. Include: start/finish line with arch, 4-6 corners of varying radius (8-40 studs), at least one chicane, barriers on every turn (WoodPlanks for rustic, Metal for modern), and distance markers every 50 studs. Lighting is ShadowMap, clock 13, brightness 2.5, ambient #B0B0B0, exposure 0. Track must be a closed loop (last Part meets first). Forbidden: narrow choke points <20 studs wide, unprotected drop-offs, unclear racing lines.${CLOSING}`,

  'tower-defense': `You are building a tower defense map for Roblox — Bloons TD, Tower Battles. Layout centers a fixed enemy Path (Folder of Part waypoints the AI walks), flanked by tower placement pads (8x8 stud Parts with subtle green tint Color3 #90EE90). Map is 200x200 studs maximum. Material palette matches a theme — grass / sand / rock / stone pads. Path is a clear winding route with at least 6 corners to give tower variety. Colors: primary #6B4226 earth path, secondary #2ECC71 placement green, accent #E74C3C enemy red, highlight #F39C12 gold. Include: spawn zone (red Neon Part), end zone (king's castle or base), 8+ tower placement pads spread across strategic chokes, decorative terrain between pads. Lighting is ShadowMap, clock 14, brightness 2.5, ambient #C0C0B0. Forbidden: ambiguous paths, towers blocking the path itself, unclear spawn/end.${CLOSING}`,

  'rpg-adventure': `You are building an RPG adventure zone for Roblox — think a "starting village" from Hollow Knight, Zelda BotW, or Dragon Quest. Layout is a small hub: 5-8 interactable buildings (shop, inn, quest-giver house, blacksmith, well) arranged around a central plaza with a focal prop (statue, fountain, well). Material palette matches a chosen sub-theme (default medieval fantasy: Wood, Slate, Cobblestone). Colors: primary #6B3B1A wood, secondary #8E857A stone, accent #F5CD30 quest gold, highlight #3AA6FF magic blue. Each building needs a door (distinct Part), a window, and a sign (Part + SurfaceGui with building name). Add NPCs' stand points (invisible markers). Lighting: ShadowMap, clock 10 (morning), brightness 2.2, ambient #B0A890, exposure 0. The plaza must feel "lived in" — add crates, barrels, flower pots, a market stall. Forbidden: empty dead space, identical buildings, purely decorative builds without gameplay anchors.${CLOSING}`,

  generic: `You are building a real Roblox scene — not a demo, not a concept, a REAL build players will explore. Build it like you care: at least 30 distinct parts, coherent material palette (3-5 materials), theme-appropriate colors (NOT default grey), clear focal point, and enough detail that it feels like a place, not a prototype. Use stud values that are multiples of 2. Set Lighting to match the mood. Use Color3.fromRGB() for all colors. Every Part needs a purpose — no random spam, but also no empty spaces. Fill the scene.${CLOSING}`,
}

/**
 * Resolve the best template for a free-text genre hint. Falls back to
 * `generic` when no close match is found.
 */
export function resolveBuildTemplate(genreHint: string | undefined): string {
  if (!genreHint) return BUILD_TEMPLATES.generic
  const normalized = genreHint.toLowerCase().trim()
  if (normalized in BUILD_TEMPLATES) {
    return BUILD_TEMPLATES[normalized as Genre]
  }
  // Fuzzy match on substrings.
  for (const key of Object.keys(BUILD_TEMPLATES) as Genre[]) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return BUILD_TEMPLATES[key]
    }
  }
  return BUILD_TEMPLATES.generic
}
