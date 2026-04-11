/**
 * Theme Presets — the visual / audio / architectural DNA of every build.
 *
 * A ThemePreset is a complete, opinionated bundle of choices that a
 * world-class Roblox developer would make for a given genre: color palette,
 * materials, lighting, audio flavor, prop vocabulary, architectural rules,
 * and forbidden elements. The Prompt Amplifier uses these to expand a terse
 * user prompt ("make a castle") into an expert-level build brief.
 *
 * These presets are REAL data, not placeholders. The `architecturalRules`
 * paragraph on each preset is the "secret sauce" — it's the prose an LLM
 * reads to understand how the genre should actually look and feel.
 *
 * Hex colors are UPPER-CASE and 6-digit. Roblox material names mirror the
 * `Enum.Material` enum (e.g. 'Slate', 'Wood', 'Metal', 'Neon').
 */

export interface ThemePreset {
  id: string
  name: string
  description: string
  // ── Visual ─────────────────────────────────────────────────────────────
  colorPalette: {
    primary: string
    secondary: string
    accent: string
    neutral: string
    highlight: string
  }
  materials: string[]
  lighting: {
    ambient: string
    brightness: number
    timeOfDay: number
    fog: { density: number; color: string }
    technology: 'Voxel' | 'ShadowMap' | 'Future' | 'Legacy'
    clockTime: number
    geographicLatitude: number
    exposureCompensation: number
  }
  skybox?: string
  // ── Audio ──────────────────────────────────────────────────────────────
  ambientMusic: string
  sfxStyle: string
  voiceStyle: string
  // ── Prop vocabulary ────────────────────────────────────────────────────
  signatureProps: string[]
  signatureMeshStyle: 'realistic' | 'cartoon' | 'low-poly'
  // ── Architecture ───────────────────────────────────────────────────────
  buildingScale: 'small' | 'medium' | 'large' | 'epic'
  architecturalRules: string
  // ── UI ─────────────────────────────────────────────────────────────────
  uiAccent: string
  uiFontFamily: string
  // ── Atmosphere ─────────────────────────────────────────────────────────
  atmosphereKeywords: string[]
  forbiddenElements: string[]
}

// ────────────────────────────────────────────────────────────────────────────
// Preset library
// ────────────────────────────────────────────────────────────────────────────

export const THEME_PRESETS: Record<string, ThemePreset> = {
  'medieval-fantasy': {
    id: 'medieval-fantasy',
    name: 'Medieval Fantasy',
    description:
      'High-medieval European setting: stone keeps, wooden villages, candlelit halls, and iron-clad knights.',
    colorPalette: {
      primary: '#6B5A3E',
      secondary: '#3E2A14',
      accent: '#B8860B',
      neutral: '#8B8378',
      highlight: '#E8D8A0',
    },
    materials: ['Slate', 'Cobblestone', 'Wood', 'WoodPlanks', 'Brick', 'Metal', 'Grass', 'Sandstone'],
    lighting: {
      ambient: '#3A3128',
      brightness: 1.4,
      timeOfDay: 16.5,
      fog: { density: 0.002, color: '#A89876' },
      technology: 'ShadowMap',
      clockTime: 16.5,
      geographicLatitude: 41.2,
      exposureCompensation: -0.1,
    },
    skybox: 'CloudyBlueSky',
    ambientMusic:
      'medieval orchestral score, lute and wooden flute, distant choir, gentle hammer on anvil, wind through banners',
    sfxStyle:
      'crackling torches, creaking wood, iron clanks, horse hooves on stone, distant blacksmith hammering',
    voiceStyle: 'warm mid-range baritone with a slight British lilt, weathered and wise',
    signatureProps: [
      'stone tower',
      'wooden drawbridge',
      'iron portcullis',
      'flaming torch sconce',
      'wooden banner on pole',
      'oak throne',
      'anvil and forge',
      'round shield',
      'crossed swords',
      'wooden barrel',
      'crate of hay',
      'iron chandelier',
      'stone arch',
      'crenellated battlement',
      'tavern sign',
      'wooden wagon',
    ],
    signatureMeshStyle: 'realistic',
    buildingScale: 'large',
    architecturalRules:
      'Use thick stone walls (4-8 studs deep) with visible mortar joints. Towers should be cylindrical or square with crenellated tops and narrow arrow-slit windows. Every interior needs a practical light source — torches, braziers, hearths. Rooflines are steeply pitched (55-70 degrees) with wooden beams exposed inside. Courtyards are centerpieces: they should feel enclosed by curtain walls but open to the sky. Respect medieval proportions: doorways 7 studs tall, ceilings 12-16 studs. Use color-coordinated banners to mark allegiance. Never use perfectly flat, smooth walls — stone has texture. Group buildings around a keep (tallest structure) so the eye is drawn to the focal point. Add small storytelling props (carts, barrels, hay bales) to make the world feel lived-in.',
    uiAccent: '#B8860B',
    uiFontFamily: 'Garamond',
    atmosphereKeywords: ['ancient', 'torch-lit', 'dusty', 'wind-blown', 'solemn', 'timeworn', 'heraldic'],
    forbiddenElements: [
      'neon',
      'glass skyscrapers',
      'cars',
      'circuitry',
      'holograms',
      'plastic',
      'modern clothing',
      'guns',
      'lasers',
    ],
  },

  'dark-fantasy': {
    id: 'dark-fantasy',
    name: 'Dark Fantasy',
    description:
      'Grim, blood-soaked medieval world where sunlight barely reaches the ground — think Dark Souls, Elden Ring, Bloodborne.',
    colorPalette: {
      primary: '#2A2420',
      secondary: '#151015',
      accent: '#8B0000',
      neutral: '#4F4943',
      highlight: '#C8A060',
    },
    materials: ['Slate', 'Basalt', 'Metal', 'Marble', 'Cobblestone', 'CorrodedMetal', 'Rock'],
    lighting: {
      ambient: '#0F0C10',
      brightness: 0.7,
      timeOfDay: 19.0,
      fog: { density: 0.012, color: '#2A2028' },
      technology: 'Future',
      clockTime: 19.0,
      geographicLatitude: 55.0,
      exposureCompensation: -0.7,
    },
    skybox: 'DarkOminousSky',
    ambientMusic:
      'slow dirge choir, dissonant strings, distant cathedral bell, low cello drones, whispering wind',
    sfxStyle: 'dragging chains, guttural groans, heavy metal doors, distant thunder, whispered prayers',
    voiceStyle: 'gravelly low baritone, raspy, weary, speaks in fragments',
    signatureProps: [
      'impaled corpses',
      'broken gothic statue',
      'blood-stained altar',
      'iron cage',
      'rusted chains',
      'skeletal remains',
      'black cathedral spire',
      'gargoyle',
      'cracked tomb',
      'dying tree',
      'extinguished brazier',
      'tattered banner',
      'broken sword in ground',
    ],
    signatureMeshStyle: 'realistic',
    buildingScale: 'epic',
    architecturalRules:
      'Scale is oppressive — cathedrals and spires should dwarf the player, with ceilings 30+ studs high. Architecture is Gothic: pointed arches, flying buttresses, ribbed vaults, rose windows (broken). Everything is decayed: ivy on walls, cracked stonework, missing roof tiles. Lighting is dramatic chiaroscuro — a single shaft of light through a stained-glass window against total darkness. Avoid cheerful colors; only red (blood, torchlight) and gold (fallen nobility) should stand out against greys. Place storytelling tableaus: a dead knight slumped against a statue, a half-eaten meal on an abandoned table. Heavy fog is mandatory. Never place more than 3 working light sources per room — darkness is the point.',
    uiAccent: '#8B0000',
    uiFontFamily: 'Blackletter',
    atmosphereKeywords: ['grim', 'oppressive', 'blood-stained', 'forsaken', 'cursed', 'funereal', 'rotting'],
    forbiddenElements: ['cartoon', 'kawaii', 'neon', 'cheerful', 'bright pastels', 'cars', 'holograms', 'futuristic'],
  },

  'high-fantasy': {
    id: 'high-fantasy',
    name: 'High Fantasy',
    description:
      'Heroic elven-and-dwarven world: golden cities, crystal spires, floating isles — Lord of the Rings meets Final Fantasy.',
    colorPalette: {
      primary: '#F5E9C4',
      secondary: '#8FB8A8',
      accent: '#D4AF37',
      neutral: '#C9C0A8',
      highlight: '#FFFAE0',
    },
    materials: ['Marble', 'Sandstone', 'Glass', 'Wood', 'Metal', 'Grass', 'Limestone', 'Foil'],
    lighting: {
      ambient: '#C8D8E8',
      brightness: 2.2,
      timeOfDay: 10.0,
      fog: { density: 0.0008, color: '#E8F0F8' },
      technology: 'Future',
      clockTime: 10.0,
      geographicLatitude: 30.0,
      exposureCompensation: 0.4,
    },
    skybox: 'Sunny',
    ambientMusic:
      'soaring orchestral theme, harp and violin, ethereal female choir, wind chimes, distant eagle cries',
    sfxStyle: 'gentle water fountains, bird song, rustling silk banners, soft magical chimes',
    voiceStyle: 'clear tenor or alto, articulate, formal cadence',
    signatureProps: [
      'white marble column',
      'golden statue',
      'crystal chandelier',
      'silver filigree gate',
      'elven bow',
      'dwarven warhammer',
      'scrying pool',
      'ancient tome',
      'white tree of life',
      'silk banner',
      'gemstone altar',
      'arched stone bridge',
    ],
    signatureMeshStyle: 'realistic',
    buildingScale: 'epic',
    architecturalRules:
      'Symmetry is sacred. Every major structure has a clear axis with paired elements on both sides. Use white marble, polished sandstone, and gold leaf — never dull greys. Spires are tall and tapered with gold finials. Incorporate flowing water (fountains, canals) wherever possible — it reflects light and adds life. Arches are Moorish or ogival. Vegetation is manicured: topiary, flower beds, ivy along walls. Scale up vertically: buildings of 40+ studs, staircases that climb dramatically. Include sight-lines — a player standing at the entrance should see through multiple arches to a focal point (statue, altar, throne). Sunlight should feel golden and benevolent.',
    uiAccent: '#D4AF37',
    uiFontFamily: 'Cinzel',
    atmosphereKeywords: ['radiant', 'majestic', 'serene', 'golden', 'ethereal', 'pristine', 'heroic'],
    forbiddenElements: ['industrial', 'neon', 'cars', 'guns', 'holograms', 'rust', 'grime', 'modern'],
  },

  'cyberpunk-noir': {
    id: 'cyberpunk-noir',
    name: 'Cyberpunk Noir',
    description:
      'Rain-slicked megacity at 3AM: neon signs, holographic ads, chrome implants, corporate dystopia.',
    colorPalette: {
      primary: '#0A0A14',
      secondary: '#1A1028',
      accent: '#FF2A6D',
      neutral: '#3A3A48',
      highlight: '#05D9E8',
    },
    materials: ['Metal', 'Glass', 'Neon', 'Concrete', 'DiamondPlate', 'Plastic', 'CorrodedMetal'],
    lighting: {
      ambient: '#0D0820',
      brightness: 1.0,
      timeOfDay: 22.5,
      fog: { density: 0.008, color: '#1A1530' },
      technology: 'Future',
      clockTime: 22.5,
      geographicLatitude: 34.0,
      exposureCompensation: 0.2,
    },
    skybox: 'NightCity',
    ambientMusic:
      'dark synthwave, sub-bass drone, distant siren wails, modular synth arpeggios, TR-808 kick, wet reverb',
    sfxStyle: 'rain on metal, neon hum, distant chatter, mechanical door hiss, holographic glitch',
    voiceStyle: 'smoke-roughened noir detective voice, cynical, measured',
    signatureProps: [
      'neon sign (kanji)',
      'holographic billboard',
      'chrome ATM',
      'cyber-implant vendor stall',
      'rusted dumpster',
      'puddle of rainwater',
      'steaming manhole',
      'noodle cart',
      'surveillance drone',
      'chain-link fence',
      'graffiti-tagged wall',
      'flickering streetlight',
      'glass-walled megacorp tower',
    ],
    signatureMeshStyle: 'realistic',
    buildingScale: 'epic',
    architecturalRules:
      'Verticality is king — buildings should soar 60+ studs tall, with layered walkways and skybridges between them. Every street is narrow and crowded, with the sky blocked by billboards and cables. Light sources are predominantly neon — magenta, cyan, electric yellow — casting colored puddles on wet asphalt. Mix high-tech (corporate glass towers) with low-tech (street-level food stalls, tarp shelters). Rain is constant; ground materials should look reflective. Include Japanese, Chinese, and Korean signage. Never make streets clean — they should be cluttered with trash, pipes, wires, and steam. Place at least one holographic ad per scene. UI elements in-world should glow.',
    uiAccent: '#FF2A6D',
    uiFontFamily: 'Orbitron',
    atmosphereKeywords: ['rain-slicked', 'neon-drenched', 'claustrophobic', 'nocturnal', 'grimy', 'corporate', 'glitching'],
    forbiddenElements: ['medieval', 'castle', 'horse', 'wooden huts', 'sunlight', 'greenfields', 'torches', 'thatched roof'],
  },

  'post-apocalyptic': {
    id: 'post-apocalyptic',
    name: 'Post-Apocalyptic',
    description:
      'Wasteland after the fall: rusted cars, collapsed highways, scavenger camps, dust-choked sun.',
    colorPalette: {
      primary: '#8B6F47',
      secondary: '#4A3C28',
      accent: '#C44536',
      neutral: '#6B6055',
      highlight: '#E8C77A',
    },
    materials: ['CorrodedMetal', 'Concrete', 'Sand', 'Rock', 'Metal', 'WoodPlanks', 'Fabric'],
    lighting: {
      ambient: '#5A4A38',
      brightness: 1.8,
      timeOfDay: 14.0,
      fog: { density: 0.010, color: '#C0A070' },
      technology: 'Future',
      clockTime: 14.0,
      geographicLatitude: 35.0,
      exposureCompensation: 0.3,
    },
    skybox: 'DustyOrange',
    ambientMusic:
      'lonesome harmonica, distant dust storm wind, slow acoustic guitar, sparse percussion, Geiger counter clicks',
    sfxStyle: 'creaking rust, skittering debris, radio static, distant explosions, crow caws',
    voiceStyle: 'dry, parched, world-weary',
    signatureProps: [
      'rusted car wreck',
      'scrap-metal shelter',
      'barrel fire',
      'tattered tent',
      'stop sign riddled with bullet holes',
      'abandoned gas pump',
      'collapsed billboard',
      'tire pile',
      'shopping cart of junk',
      'oil drum',
      'radioactive warning sign',
      'broken asphalt',
      'scavenged antenna',
    ],
    signatureMeshStyle: 'realistic',
    buildingScale: 'medium',
    architecturalRules:
      'Nothing is intact — every structure must look patched, scavenged, or on the verge of collapse. Mix modern ruins (concrete apartments with rebar exposed) with shanty-style lean-tos made from corrugated metal, wood planks, and tarps. Color everything with a layer of rust and dust — orange/brown should dominate. Include tableaus of what was lost: a child\'s stroller in a cracked parking lot, a family photo in a burned-out home. Roads should be cracked with weeds growing through. Vehicles are universally wrecked. Every "safe" building should have barricades: sandbags, car doors welded into walls, barbed wire. Skies are often orange from dust storms. No electricity except for jerry-rigged generators.',
    uiAccent: '#C44536',
    uiFontFamily: 'Stencil',
    atmosphereKeywords: ['dusty', 'rusted', 'scorched', 'desolate', 'abandoned', 'irradiated', 'patched'],
    forbiddenElements: ['pristine', 'futuristic utopia', 'medieval', 'neon', 'magical', 'castle', 'anime'],
  },

  'sci-fi-utopia': {
    id: 'sci-fi-utopia',
    name: 'Sci-Fi Utopia',
    description:
      'Gleaming future city: white curves, clean energy, holographic interfaces, hovering transit.',
    colorPalette: {
      primary: '#F0F4F8',
      secondary: '#2A4B6D',
      accent: '#00E5FF',
      neutral: '#B0C4D8',
      highlight: '#FFFFFF',
    },
    materials: ['SmoothPlastic', 'Glass', 'Metal', 'Neon', 'Marble', 'Foil'],
    lighting: {
      ambient: '#C8E0F0',
      brightness: 2.5,
      timeOfDay: 12.0,
      fog: { density: 0.0005, color: '#E0F0FF' },
      technology: 'Future',
      clockTime: 12.0,
      geographicLatitude: 0.0,
      exposureCompensation: 0.5,
    },
    skybox: 'BrightSky',
    ambientMusic:
      'ambient pad, clean synth arpeggios, chiming bells, soft female vocalise, air-hiss of hover vehicles',
    sfxStyle: 'soft UI beeps, hover vehicle whoosh, pneumatic doors, holographic chime, gentle fan hum',
    voiceStyle: 'calm synthesized alto, articulate, inviting',
    signatureProps: [
      'hover vehicle',
      'white curved bench',
      'holographic info kiosk',
      'transparent elevator tube',
      'suspended walkway',
      'indoor garden pod',
      'drone courier',
      'clean energy pylon',
      'floating platform',
      'transparent dome',
      'interactive light panel',
    ],
    signatureMeshStyle: 'realistic',
    buildingScale: 'epic',
    architecturalRules:
      'Curves over corners — buildings should feel organic and flowing, like blown glass. White and off-white dominate, with selective accents of cyan and soft teal for glow lines. Every surface is reflective, polished, or translucent. Integrate nature: hanging gardens, indoor forests, waterfalls through glass atria. Walkways are suspended and transparent. Verticality matters but never feels oppressive — buildings taper and open skyward. Light is plentiful and soft, never harsh. Include holographic elements that glow with crisp cyan. Everyone should look clean. No rust, no grime, no visible infrastructure (pipes, cables) — it\'s all hidden or artistically designed.',
    uiAccent: '#00E5FF',
    uiFontFamily: 'Exo',
    atmosphereKeywords: ['clean', 'serene', 'luminous', 'curved', 'translucent', 'weightless', 'harmonic'],
    forbiddenElements: ['rust', 'dirt', 'medieval', 'cartoon', 'grimy alleys', 'wooden huts', 'dark gothic'],
  },

  'space-station': {
    id: 'space-station',
    name: 'Space Station',
    description:
      'Orbital habitat: riveted bulkheads, blinking consoles, airlocks, viewports onto the void.',
    colorPalette: {
      primary: '#2F3438',
      secondary: '#14181C',
      accent: '#FFAA00',
      neutral: '#5A6066',
      highlight: '#E8F0F8',
    },
    materials: ['Metal', 'DiamondPlate', 'Neon', 'Glass', 'CorrodedMetal', 'Plastic'],
    lighting: {
      ambient: '#1A1D24',
      brightness: 1.2,
      timeOfDay: 0.0,
      fog: { density: 0.0, color: '#000000' },
      technology: 'Future',
      clockTime: 0.0,
      geographicLatitude: 0.0,
      exposureCompensation: -0.2,
    },
    skybox: 'Starfield',
    ambientMusic:
      'deep ambient drone, distant mechanical rumble, heartbeat pulse, faint radio chatter, air circulation hum',
    sfxStyle: 'airlock hiss, console beeps, metal clangs, emergency klaxon, boot steps on grating',
    voiceStyle: 'clipped, professional, slight radio compression',
    signatureProps: [
      'circular airlock door',
      'control console',
      'CRT screen',
      'viewport to space',
      'overhead pipe array',
      'cryo-pod',
      'docking clamp',
      'zero-g handrail',
      'blinking warning light',
      'exposed wiring bundle',
      'mag-boot',
      'ration crate',
    ],
    signatureMeshStyle: 'realistic',
    buildingScale: 'large',
    architecturalRules:
      'Claustrophobia is a feature. Corridors are narrow (6-8 studs wide) with low ceilings (10 studs). Every surface has function: pipes, panels, rivets, grating floors. Doors are circular or hexagonal airlocks, never flat rectangles. Include large viewport windows showing the starfield — these are the emotional beats. Lighting is harsh overhead fluorescent with amber warning lights in corners. Always include a central "hub" area that opens upward (ceiling 20+ studs) for contrast. Computer consoles should have visible CRT or LED screens with scrolling text. Never make it feel "homey" — it\'s utilitarian, survival-focused. Add emergency equipment visibly (fire extinguishers, oxygen masks, escape pods).',
    uiAccent: '#FFAA00',
    uiFontFamily: 'Monospace',
    atmosphereKeywords: ['claustrophobic', 'mechanical', 'zero-g', 'industrial', 'isolated', 'cold', 'utilitarian'],
    forbiddenElements: ['medieval', 'fantasy', 'wooden', 'castle', 'trees', 'grass', 'torches'],
  },

  'alien-jungle': {
    id: 'alien-jungle',
    name: 'Alien Jungle',
    description:
      'Bioluminescent rainforest on a distant moon: giant mushrooms, floating spores, glowing creatures.',
    colorPalette: {
      primary: '#1E3A2A',
      secondary: '#0A1A14',
      accent: '#B84DFF',
      neutral: '#2C4436',
      highlight: '#7DFFB3',
    },
    materials: ['Grass', 'Slate', 'Neon', 'LeafyGrass', 'Foil', 'Rock', 'Mud'],
    lighting: {
      ambient: '#1A2820',
      brightness: 0.9,
      timeOfDay: 20.0,
      fog: { density: 0.006, color: '#2A3A30' },
      technology: 'Future',
      clockTime: 20.0,
      geographicLatitude: 0.0,
      exposureCompensation: -0.3,
    },
    skybox: 'AlienNebula',
    ambientMusic:
      'ambient pad with strange otherworldly synths, wet jungle sounds, distant alien calls, bioluminescent chimes',
    sfxStyle: 'dripping water, chittering insects, strange alien croaks, spore puffs, distant howls',
    voiceStyle: 'hushed, curious, whispered observations',
    signatureProps: [
      'giant glowing mushroom',
      'bioluminescent vine',
      'spore pod',
      'alien flower',
      'crystal formation',
      'twisted tree root',
      'glowing pool',
      'hanging moss curtain',
      'iridescent beetle',
      'pulsing coral',
      'tentacle plant',
    ],
    signatureMeshStyle: 'realistic',
    buildingScale: 'large',
    architecturalRules:
      'There are no "buildings" — structures are organic: grown, carved, or native to the environment. Foliage is layered vertically: canopy (40+ studs), mid-level vines and platforms, forest floor with ferns. Light comes from below and from plants themselves — magenta, cyan, and acid green glows should illuminate everything. Include water elements: glowing pools, dripping stalactites, waterfalls. Scale up key plants to absurd sizes — mushrooms 30 studs tall. Paths should be natural: fallen logs, vine bridges, stepping stones. Add ambient particle effects: floating spores, glowing motes, mist. Never use straight lines or right angles. Colors should be saturated and otherworldly — a blue leaf, a purple tree trunk.',
    uiAccent: '#7DFFB3',
    uiFontFamily: 'Exo',
    atmosphereKeywords: ['bioluminescent', 'humid', 'otherworldly', 'lush', 'pulsing', 'alien', 'misty'],
    forbiddenElements: ['medieval', 'castle', 'cars', 'neon city', 'concrete', 'guns', 'modern'],
  },

  'western-frontier': {
    id: 'western-frontier',
    name: 'Western Frontier',
    description:
      'Dusty 1880s frontier town: wooden saloons, cattle ranches, tumbleweeds, sun-baked adobe.',
    colorPalette: {
      primary: '#B8844A',
      secondary: '#5C3A1A',
      accent: '#8B2020',
      neutral: '#C0A878',
      highlight: '#F0D898',
    },
    materials: ['Wood', 'WoodPlanks', 'Sand', 'Sandstone', 'Rock', 'Metal', 'Fabric'],
    lighting: {
      ambient: '#7A5A38',
      brightness: 2.4,
      timeOfDay: 17.5,
      fog: { density: 0.003, color: '#D8B878' },
      technology: 'ShadowMap',
      clockTime: 17.5,
      geographicLatitude: 32.0,
      exposureCompensation: 0.4,
    },
    skybox: 'DustySunset',
    ambientMusic:
      'lonesome acoustic guitar, harmonica, distant train whistle, creaking wagon wheels, coyote howl',
    sfxStyle: 'wooden creaks, horse whinny, boot spurs jingling, saloon door swings, wind through dust',
    voiceStyle: 'slow drawl, gruff, laconic',
    signatureProps: [
      'saloon swinging door',
      'wooden hitching post',
      'water trough',
      'wagon with barrels',
      'wanted poster',
      'tumbleweed',
      'cactus',
      'porch rocker chair',
      'whiskey barrel',
      'cattle skull',
      'general store sign',
      'train depot',
      'revolver in holster',
    ],
    signatureMeshStyle: 'realistic',
    buildingScale: 'medium',
    architecturalRules:
      'Buildings are two-story max, with wooden false fronts to look bigger than they are. Every street is dirt — never paved. Line main street with buildings on both sides, covered wooden walkways (porches) connecting them. Signage is hand-painted on wood in serif type. Include hitching posts outside every building. Dust everywhere — the color palette tips orange and yellow. Sunsets are the default mood: long shadows, golden-hour light. Include a saloon (central social hub), a sheriff\'s office, a general store, a church with a steeple, and a distant railroad. Open landscape should surround — desert, mesa, or prairie. Add small details: abandoned wagons, bleached skulls, lonely crosses on graves.',
    uiAccent: '#8B2020',
    uiFontFamily: 'Rye',
    atmosphereKeywords: ['dusty', 'sun-baked', 'lonesome', 'weathered', 'sepia', 'rustic', 'lawless'],
    forbiddenElements: ['neon', 'skyscrapers', 'medieval', 'magic', 'cars', 'modern', 'futuristic'],
  },

  steampunk: {
    id: 'steampunk',
    name: 'Steampunk',
    description:
      'Brass-and-copper Victorian industrial fantasy: gears, goggles, airships, clockwork contraptions.',
    colorPalette: {
      primary: '#8B6A3F',
      secondary: '#3C2818',
      accent: '#D4A04C',
      neutral: '#A0795A',
      highlight: '#F0D88E',
    },
    materials: ['Metal', 'Wood', 'Brick', 'DiamondPlate', 'CorrodedMetal', 'Glass', 'Fabric'],
    lighting: {
      ambient: '#4A3826',
      brightness: 1.5,
      timeOfDay: 17.0,
      fog: { density: 0.006, color: '#6A5438' },
      technology: 'ShadowMap',
      clockTime: 17.0,
      geographicLatitude: 51.5,
      exposureCompensation: 0.0,
    },
    skybox: 'SmogSunset',
    ambientMusic:
      'waltz with brass instruments, ticking clockwork, chugging steam engine, distant factory whistle',
    sfxStyle: 'gear grinding, steam hiss, brass clanks, pocket watch ticking, airship propeller',
    voiceStyle: 'proper Victorian English accent, formal vocabulary',
    signatureProps: [
      'giant exposed cog',
      'brass pipe network',
      'pressure gauge cluster',
      'riveted copper boiler',
      'clockwork automaton',
      'goggles on workbench',
      'gas streetlamp',
      'airship gondola',
      'top hat on rack',
      'pocket watch',
      'brass telescope',
      'tesla coil',
    ],
    signatureMeshStyle: 'realistic',
    buildingScale: 'large',
    architecturalRules:
      'Every wall, floor, and ceiling should reveal mechanical infrastructure — visible pipes, rotating gears, steam vents. Combine Victorian-era masonry (red brick, wrought iron railings, gothic revival arches) with industrial exposed machinery. Use brass, copper, and polished wood as the dominant material combo. Include vertical transport: elevators, pneumatic tubes, hanging catwalks. Lighting is gaslight-yellow with orange firebox glow — never white or blue. Windows are small and paned with lead. Add operational elements: rotating cogs, hissing steam, swinging pendulums. Every room should have at least one functioning mechanical contraption as a centerpiece. Coal smoke hangs in the air.',
    uiAccent: '#D4A04C',
    uiFontFamily: 'Copperplate',
    atmosphereKeywords: ['brass', 'ticking', 'steam-belching', 'Victorian', 'mechanical', 'smog-choked', 'ornate'],
    forbiddenElements: ['neon', 'holograms', 'plastic', 'medieval castle', 'cartoon', 'pastel'],
  },

  'pirate-cove': {
    id: 'pirate-cove',
    name: 'Pirate Cove',
    description:
      'Tropical pirate haven: weathered ships, rum barrels, treasure chests, stilted wooden docks.',
    colorPalette: {
      primary: '#3A2414',
      secondary: '#1A8CAA',
      accent: '#D4A04C',
      neutral: '#A08060',
      highlight: '#F0E4B4',
    },
    materials: ['Wood', 'WoodPlanks', 'Sand', 'Fabric', 'Metal', 'Rope'],
    lighting: {
      ambient: '#4A5A68',
      brightness: 2.0,
      timeOfDay: 18.0,
      fog: { density: 0.002, color: '#A0B4C8' },
      technology: 'ShadowMap',
      clockTime: 18.0,
      geographicLatitude: 18.0,
      exposureCompensation: 0.2,
    },
    skybox: 'TropicalSunset',
    ambientMusic:
      'sea shanty with concertina, accordion, hearty male chorus, creaking ship timbers, gull cries, lapping waves',
    sfxStyle: 'creaking ropes, flapping sails, clinking coins, waves, seagulls, cutlass clang',
    voiceStyle: 'throaty pirate growl, "arr"-inflected, dramatic',
    signatureProps: [
      'weathered ship wheel',
      'tattered sail',
      'treasure chest',
      'rum barrel',
      'cannon',
      'skull and crossbones flag',
      'rope ladder',
      'wooden dock',
      'palm tree',
      'coconut',
      'crab trap',
      'anchor',
      'parrot on perch',
      'cutlass',
    ],
    signatureMeshStyle: 'cartoon',
    buildingScale: 'medium',
    architecturalRules:
      'Everything is wooden and weathered — wet, salt-stained planks, patched with mismatched boards. Buildings sit on stilts over water or sand with rope bridges connecting them. Include ships as set pieces — a beached galleon, a moored pirate frigate. Tropical vegetation surrounds: palm trees, ferns, bamboo. Scatter treasure clues: chests half-buried, map fragments nailed to posts, X-marked spots. Lighting is golden-hour tropical — warm, inviting, with long shadows. Add ropes and pulleys everywhere. The sea is always nearby — lapping at the edges of every scene. Include a tavern as the social hub, a lighthouse as the landmark, and hidden caves for treasure.',
    uiAccent: '#D4A04C',
    uiFontFamily: 'Pirata',
    atmosphereKeywords: ['salty', 'sun-bleached', 'briny', 'weathered', 'boisterous', 'tropical', 'creaky'],
    forbiddenElements: ['neon', 'cars', 'skyscrapers', 'medieval castle', 'holograms', 'modern'],
  },

  'victorian-horror': {
    id: 'victorian-horror',
    name: 'Victorian Horror',
    description:
      'Gaslit London fog and gothic mansions: top-hatted strangers, ticking clocks, haunted parlors.',
    colorPalette: {
      primary: '#1A1418',
      secondary: '#3A2E28',
      accent: '#8B0000',
      neutral: '#4A4038',
      highlight: '#D0C090',
    },
    materials: ['Brick', 'Wood', 'WoodPlanks', 'Marble', 'Fabric', 'Metal', 'Cobblestone'],
    lighting: {
      ambient: '#141018',
      brightness: 0.9,
      timeOfDay: 21.0,
      fog: { density: 0.015, color: '#2A2630' },
      technology: 'Future',
      clockTime: 21.0,
      geographicLatitude: 51.5,
      exposureCompensation: -0.5,
    },
    skybox: 'FoggyNight',
    ambientMusic:
      'solo cello dirge, distant music box, creaking floorboards, grandfather clock ticking, whispered gasps',
    sfxStyle: 'creaking wood, distant scream, rattling chains, clock chimes, wind through shutters',
    voiceStyle: 'whispered Victorian English, breathy, haunted',
    signatureProps: [
      'grandfather clock',
      'wrought iron gate',
      'gas streetlamp',
      'portrait in heavy frame',
      'dusty chandelier',
      'velvet armchair',
      'cracked mirror',
      'writing desk with candle',
      'ornate casket',
      'top hat and cane',
      'oil lamp',
      'pocket watch',
      'cobwebs',
      'raven on perch',
    ],
    signatureMeshStyle: 'realistic',
    buildingScale: 'large',
    architecturalRules:
      'Interiors are cluttered Victorian excess — heavy velvet curtains, Persian rugs over dark wood floors, walls lined with portraits and taxidermy. Every room has a fireplace, a grandfather clock, or a chandelier. Exteriors are soot-stained brick with wrought-iron gates, gaslamps casting yellow pools in heavy fog. Streets are cobblestone, wet with mist. Include alleyways that feel unsafe. Lighting is low and warm — candles, gas, lanterns — with deep shadows. Add specific unsettling details: a rocking chair moving with no one in it, a portrait whose eyes follow, a door ajar in an empty corridor. Fog should fill every ground-level space. Never feel "cozy" — always feel WATCHED.',
    uiAccent: '#8B0000',
    uiFontFamily: 'Didot',
    atmosphereKeywords: ['gaslit', 'fog-shrouded', 'haunted', 'velvet', 'whispered', 'ticking', 'unsettling'],
    forbiddenElements: ['cartoon', 'neon', 'bright colors', 'cars', 'modern', 'holograms', 'kawaii'],
  },

  'modern-city': {
    id: 'modern-city',
    name: 'Modern City',
    description:
      'Contemporary urban landscape: glass skyscrapers, traffic, coffee shops, neon crosswalks.',
    colorPalette: {
      primary: '#6E7B85',
      secondary: '#2A3038',
      accent: '#FF6B35',
      neutral: '#A0A8B0',
      highlight: '#F0F4F8',
    },
    materials: ['Concrete', 'Glass', 'Metal', 'Asphalt', 'Brick', 'SmoothPlastic'],
    lighting: {
      ambient: '#6A7480',
      brightness: 2.0,
      timeOfDay: 13.0,
      fog: { density: 0.001, color: '#C8D0D8' },
      technology: 'Future',
      clockTime: 13.0,
      geographicLatitude: 40.7,
      exposureCompensation: 0.2,
    },
    skybox: 'ClearDay',
    ambientMusic:
      'urban ambient, distant traffic, lo-fi hip-hop beat, subway rumble, crowd murmur',
    sfxStyle: 'car horns, footsteps on concrete, cafe door chime, bus brakes, phone notifications',
    voiceStyle: 'neutral modern, conversational',
    signatureProps: [
      'yellow taxi',
      'glass office tower',
      'traffic light',
      'subway entrance',
      'newsstand',
      'hot dog cart',
      'coffee shop sign',
      'fire hydrant',
      'parking meter',
      'bus stop',
      'crosswalk',
      'sidewalk planter',
      'pedestrian in business attire',
    ],
    signatureMeshStyle: 'realistic',
    buildingScale: 'epic',
    architecturalRules:
      'Grid streets with skyscrapers (40-80 studs tall) on major avenues, smaller 4-6 story buildings on side streets. Mix new glass towers with older brick buildings to show layered history. Sidewalks are concrete, streets are asphalt with painted lane markings. Include functional urban infrastructure: traffic lights, street signs, fire hydrants, manhole covers, storm drains. Every block has at least one piece of street furniture: bench, planter, trash can, bus stop. Windows in tall buildings should be uniform grids. Scale down to human level occasionally — ground-floor shops with signage, outdoor cafe tables. Colors are muted with pops of saturated accents (taxi yellow, crosswalk white, fire hydrant red). Sky is bright daylight by default.',
    uiAccent: '#FF6B35',
    uiFontFamily: 'Helvetica',
    atmosphereKeywords: ['bustling', 'grid-like', 'concrete', 'towering', 'commercial', 'diverse', 'cosmopolitan'],
    forbiddenElements: ['medieval', 'magic', 'dragons', 'alien', 'wooden huts', 'torches', 'castle'],
  },

  'modern-suburb': {
    id: 'modern-suburb',
    name: 'Modern Suburb',
    description:
      'Peaceful neighborhood: manicured lawns, driveways, bay windows, picket fences — Brookhaven vibe.',
    colorPalette: {
      primary: '#F0E4C8',
      secondary: '#4A7C5E',
      accent: '#C85A3C',
      neutral: '#D0C8B8',
      highlight: '#FFFFFF',
    },
    materials: ['WoodPlanks', 'Brick', 'Grass', 'Concrete', 'Glass', 'SmoothPlastic'],
    lighting: {
      ambient: '#C8D8E0',
      brightness: 2.2,
      timeOfDay: 14.5,
      fog: { density: 0.0008, color: '#E8F0F4' },
      technology: 'Future',
      clockTime: 14.5,
      geographicLatitude: 38.0,
      exposureCompensation: 0.3,
    },
    skybox: 'SunnyDay',
    ambientMusic:
      'wholesome acoustic guitar and piano, birdsong, distant lawnmower, children playing, ice cream truck jingle',
    sfxStyle: 'lawn sprinklers, dog barking, car door, screen door creak, wind chimes',
    voiceStyle: 'friendly, warm, midwestern',
    signatureProps: [
      'white picket fence',
      'mailbox',
      'front porch with rocking chair',
      'two-car garage',
      'basketball hoop in driveway',
      'barbecue grill',
      'swing set',
      'lawn gnome',
      'flower bed',
      'red fire hydrant',
      'family sedan',
      'garden hose',
      'welcome mat',
    ],
    signatureMeshStyle: 'cartoon',
    buildingScale: 'small',
    architecturalRules:
      'Houses are 1-2 story single-family with clear front yards, driveways, and garages. Mix architectural styles: colonial, ranch, craftsman, modern. Every home has a defining feature — a bay window, a dormer, a wraparound porch. Lawns are pristine green with flower beds near the foundation. Streets are clean asphalt with painted curbs and sidewalks. Front doors should be colorful focal points (red, blue, yellow). Include driveways with parked cars, mailboxes at the curb. Yards have character — a tire swing, a basketball hoop, a garden gnome. Keep palette warm and inviting: creams, tans, soft greens. Every house should feel "lived in" — a bike leaning against a garage, curtains in the windows. Scale is HUMAN, not epic.',
    uiAccent: '#C85A3C',
    uiFontFamily: 'Quicksand',
    atmosphereKeywords: ['wholesome', 'sunny', 'manicured', 'quiet', 'peaceful', 'homey', 'friendly'],
    forbiddenElements: ['medieval', 'neon', 'cyberpunk', 'dark gothic', 'alien', 'post-apocalyptic'],
  },

  'school-anime': {
    id: 'school-anime',
    name: 'School Anime',
    description:
      'Japanese high school slice-of-life: cherry blossoms, uniforms, rooftops, vending machines.',
    colorPalette: {
      primary: '#FFEDF0',
      secondary: '#A4C8E8',
      accent: '#E85078',
      neutral: '#F0E8D8',
      highlight: '#FFFFFF',
    },
    materials: ['Concrete', 'SmoothPlastic', 'Glass', 'Wood', 'Brick', 'Grass'],
    lighting: {
      ambient: '#E8D8E0',
      brightness: 2.3,
      timeOfDay: 15.5,
      fog: { density: 0.0005, color: '#F8E8F0' },
      technology: 'Future',
      clockTime: 15.5,
      geographicLatitude: 35.7,
      exposureCompensation: 0.5,
    },
    skybox: 'SpringAfternoon',
    ambientMusic:
      'cheerful J-pop guitar, piano melody, cicadas, distant school bell, choir of students',
    sfxStyle: 'school bell, footsteps on tile, chalkboard scratch, chair scrape, vending machine thunk',
    voiceStyle: 'energetic Japanese high-school vibe',
    signatureProps: [
      'cherry blossom tree',
      'school desk',
      'chalkboard',
      'vending machine',
      'school rooftop railing',
      'shoe locker',
      'bento box',
      'school uniform',
      'school gate with sign',
      'bicycle rack',
      'clock above entrance',
      'clubroom sign',
    ],
    signatureMeshStyle: 'cartoon',
    buildingScale: 'medium',
    architecturalRules:
      'Main building is 3-4 stories, concrete with long rows of identical windows, green metal roof, and a large central clock over the entrance. Include distinct spaces: entry courtyard with cherry trees, rooftop with chain-link fence (perfect for dramatic scenes), gymnasium, classrooms with wooden desks in rows. Paths are paved with planters and benches. Vending machines are a signature detail. Uniforms and shoes should be visible. Scale is realistic — corridors are 10 studs wide, ceilings 12 studs. Include Japanese signage in katakana/hiragana. Cherry blossom petals falling is mandatory ambience. Every scene should feel photogenic — soft lighting, warm colors, clear sight lines. Afternoon golden hour is the default time of day.',
    uiAccent: '#E85078',
    uiFontFamily: 'Nunito',
    atmosphereKeywords: ['cheerful', 'nostalgic', 'blossom-filled', 'sun-dappled', 'youthful', 'pastel', 'romantic'],
    forbiddenElements: ['dark gothic', 'cyberpunk', 'post-apocalyptic', 'medieval castle', 'horror', 'blood'],
  },

  'kawaii-pastel': {
    id: 'kawaii-pastel',
    name: 'Kawaii Pastel',
    description:
      'Adorable pastel world: pink clouds, candy-colored houses, smiling suns, rainbow bridges.',
    colorPalette: {
      primary: '#FFD1E0',
      secondary: '#D1E8FF',
      accent: '#FFB3D1',
      neutral: '#FFF5E8',
      highlight: '#FFFFFF',
    },
    materials: ['SmoothPlastic', 'Plastic', 'Fabric', 'Grass', 'Glass'],
    lighting: {
      ambient: '#F8E8F0',
      brightness: 2.8,
      timeOfDay: 12.0,
      fog: { density: 0.0002, color: '#FFF0F8' },
      technology: 'Future',
      clockTime: 12.0,
      geographicLatitude: 0.0,
      exposureCompensation: 0.6,
    },
    skybox: 'PastelClouds',
    ambientMusic:
      'cute ukulele, glockenspiel, whistling melody, giggling children, music box twinkles',
    sfxStyle: 'squeaky sound effects, bubbly pops, rubber ducky squeak, cash register ding, cartoon boing',
    voiceStyle: 'high-pitched, chipper, sing-song',
    signatureProps: [
      'smiling cloud',
      'candy cane lamppost',
      'heart-shaped sign',
      'giant cupcake',
      'rainbow bridge',
      'pastel balloon',
      'bunny plush',
      'ice cream cone statue',
      'cherry decoration',
      'pink picket fence',
      'lollipop tree',
      'star-shaped window',
    ],
    signatureMeshStyle: 'cartoon',
    buildingScale: 'small',
    architecturalRules:
      'Everything is round and bouncy — no sharp corners, no straight edges. Buildings look like frosted cakes with candy-bright accents. Palette is strictly pastels: pink, mint, sky blue, butter yellow, lavender. Windows are round or heart-shaped. Roofs are peaked with gumdrop colors. Scale is friendly — buildings 2-3 stories max, proportions slightly oversized like toys. Include cute details on EVERYTHING: a smile on a cloud, a bow on a tree, a heart on a door. Lighting is bright, even, and shadowless (or very soft). Ground is patterned — checkerboard, polka dots, flower meadows. Never use dark or desaturated colors. Floating hearts, sparkles, and rainbows are ambient decor.',
    uiAccent: '#FFB3D1',
    uiFontFamily: 'Pacifico',
    atmosphereKeywords: ['adorable', 'sugary', 'fluffy', 'rainbow', 'sparkly', 'bouncy', 'sweet'],
    forbiddenElements: ['horror', 'dark', 'gothic', 'blood', 'grimdark', 'cyberpunk', 'weapons', 'rust'],
  },

  'minecraft-blocky': {
    id: 'minecraft-blocky',
    name: 'Minecraft Blocky',
    description:
      'Voxel world of perfect cubes: everything is a block, textures are pixel art, simple and iconic.',
    colorPalette: {
      primary: '#7B9F4B',
      secondary: '#8B6F3F',
      accent: '#4B6FA0',
      neutral: '#888888',
      highlight: '#E8D890',
    },
    materials: ['Grass', 'Wood', 'Cobblestone', 'Sand', 'Brick', 'Ice', 'Slate'],
    lighting: {
      ambient: '#A0B080',
      brightness: 2.0,
      timeOfDay: 13.0,
      fog: { density: 0.001, color: '#D0E0F0' },
      technology: 'ShadowMap',
      clockTime: 13.0,
      geographicLatitude: 45.0,
      exposureCompensation: 0.1,
    },
    skybox: 'BlockySky',
    ambientMusic:
      'minimalist piano loop (C418 style), ambient drone, gentle cave echoes, sparse chimes',
    sfxStyle: 'block breaking, footsteps on grass, water splash, door creak, pixel UI sounds',
    voiceStyle: 'not used — voxel worlds rarely have voice',
    signatureProps: [
      'grass block',
      'oak tree',
      'crafting table',
      'furnace',
      'chest',
      'torch on wall',
      'cobblestone tower',
      'wooden door',
      'pickaxe',
      'sheep',
      'creeper',
      'redstone lamp',
    ],
    signatureMeshStyle: 'low-poly',
    buildingScale: 'medium',
    architecturalRules:
      'EVERYTHING is made of 1-stud cubes aligned to a grid. No rotations, no slopes, no fractional positions. Buildings are rectangular with cube-stair rooflines. Use blocky textures — checkerboards for grass, pixel wood grain. Colors are slightly desaturated primaries. Trees are 1-stud thick wooden trunks with cube-cluster leaves. Water is 1-stud blocks at a fixed level. Include iconic props at full fidelity: a 2x2 crafting table with visible tools, a furnace with glowing front, a chest with iron hinges. Terrain is stepped — no smooth hills, only cube elevations. Torches are standardized cubes that emit warm light. Scale up builds vertically with cube towers.',
    uiAccent: '#7B9F4B',
    uiFontFamily: 'Minecraftia',
    atmosphereKeywords: ['blocky', 'pixelated', 'grid-aligned', 'charming', 'endless', 'crafted', 'voxel'],
    forbiddenElements: ['curved', 'smooth', 'realistic', 'photorealistic', 'detailed mesh', 'gradients'],
  },

  'low-poly-cartoon': {
    id: 'low-poly-cartoon',
    name: 'Low-Poly Cartoon',
    description:
      'Clean low-polygon world: flat-shaded surfaces, bright saturated colors, friendly and readable.',
    colorPalette: {
      primary: '#4FB3D9',
      secondary: '#F0A04B',
      accent: '#E85050',
      neutral: '#90B060',
      highlight: '#F8E088',
    },
    materials: ['SmoothPlastic', 'Grass', 'Wood', 'Sand', 'Plastic'],
    lighting: {
      ambient: '#B0D0E8',
      brightness: 2.5,
      timeOfDay: 13.5,
      fog: { density: 0.0005, color: '#D8E8F0' },
      technology: 'Future',
      clockTime: 13.5,
      geographicLatitude: 30.0,
      exposureCompensation: 0.3,
    },
    skybox: 'CleanBlueSky',
    ambientMusic:
      'upbeat ukulele and marimba, playful whistling, cheerful pizzicato strings',
    sfxStyle: 'cartoon pop, whoosh, bounce, cartoon pluck, gentle chimes',
    voiceStyle: 'cheerful, bright, cartoony',
    signatureProps: [
      'cone-shaped tree',
      'low-poly mushroom',
      'triangular roof house',
      'round bush',
      'flag on pole',
      'barrel',
      'crate',
      'simple well',
      'stone arch',
      'cartoon car',
      'lamppost',
    ],
    signatureMeshStyle: 'low-poly',
    buildingScale: 'medium',
    architecturalRules:
      'All geometry is low-poly — avoid detail meshes, use simple primitives. Flat-shaded surfaces with no textures (or minimal). Colors are saturated and cheerful. Trees are cone or sphere clusters, rocks are multi-faceted chunks. Buildings are simple: rectangular walls, triangular roofs, square windows. Use SmoothPlastic material for that clean "plastic" look. Saturate everything — grass is bright green, skies are bright blue, roofs are bold red. Add decorative props scattered naturally — barrels, crates, flowers. Proportions are slightly stylized: chunky roofs, oversized doors. Avoid realism at all costs — this is a storybook world. Lighting is clean and even, with soft shadows. Include playful details like a flag on every tower.',
    uiAccent: '#E85050',
    uiFontFamily: 'Fredoka',
    atmosphereKeywords: ['clean', 'cheerful', 'saturated', 'geometric', 'friendly', 'storybook', 'bright'],
    forbiddenElements: ['photorealistic', 'gritty', 'dark horror', 'complex textures', 'blood', 'realistic meshes'],
  },

  'racing-arcade': {
    id: 'racing-arcade',
    name: 'Racing Arcade',
    description:
      'High-speed arcade racing: neon tracks, tire walls, checker flags, hairpin turns.',
    colorPalette: {
      primary: '#1A1A2E',
      secondary: '#E94560',
      accent: '#F0F050',
      neutral: '#666680',
      highlight: '#FFFFFF',
    },
    materials: ['Asphalt', 'Metal', 'Neon', 'Concrete', 'Plastic', 'Glass'],
    lighting: {
      ambient: '#4A5080',
      brightness: 1.8,
      timeOfDay: 21.0,
      fog: { density: 0.002, color: '#20203A' },
      technology: 'Future',
      clockTime: 21.0,
      geographicLatitude: 35.0,
      exposureCompensation: 0.2,
    },
    skybox: 'NightTrack',
    ambientMusic:
      'high-energy electronic rock, racing engine rev, crowd cheer, electric guitar hits',
    sfxStyle: 'engine revs, tire screech, horn honks, crowd cheers, countdown beeps',
    voiceStyle: 'energetic sports announcer, fast-paced',
    signatureProps: [
      'checker flag',
      'tire wall barrier',
      'starting line lights',
      'race car',
      'pit crew station',
      'grandstand',
      'advertising hoarding',
      'traffic cone',
      'hairpin turn sign',
      'finish line banner',
      'podium',
    ],
    signatureMeshStyle: 'realistic',
    buildingScale: 'large',
    architecturalRules:
      'Design around the TRACK — it\'s the star. Track is smooth asphalt 24+ studs wide with painted white and red curb stripes on corners. Include varied corner types: hairpin, chicane, sweeping turn, straightaway. Borders are tire walls (stacked rubber), safety barriers (white concrete), and catch fences (chain-link). Add grandstands along straights. Night mode is dramatic — floodlights on tall poles, neon billboards. Include a start/finish line with overhead gantry and countdown lights. Pit lane should have garages with open doors showing colorful tools. Signage is blocky and sponsor-branded. Skies are dramatic — night or sunset. Scale sense of speed by placing environmental details (trees, barriers) to whoosh past.',
    uiAccent: '#F0F050',
    uiFontFamily: 'Racing Sans',
    atmosphereKeywords: ['high-speed', 'neon-lit', 'adrenaline', 'smooth asphalt', 'checkered', 'floodlit', 'sponsored'],
    forbiddenElements: ['medieval', 'magic', 'horror', 'cartoon pastel', 'wooden huts', 'torches'],
  },

  'sports-stadium': {
    id: 'sports-stadium',
    name: 'Sports Stadium',
    description:
      'Packed sports arena: green field, tiered seats, jumbotron, floodlights, team colors everywhere.',
    colorPalette: {
      primary: '#2E8B3F',
      secondary: '#1A3560',
      accent: '#E83030',
      neutral: '#CCCCCC',
      highlight: '#FFFFFF',
    },
    materials: ['Grass', 'Concrete', 'Plastic', 'Metal', 'Glass', 'SmoothPlastic'],
    lighting: {
      ambient: '#B0C8D8',
      brightness: 2.5,
      timeOfDay: 18.5,
      fog: { density: 0.0002, color: '#D8E8F0' },
      technology: 'Future',
      clockTime: 18.5,
      geographicLatitude: 40.0,
      exposureCompensation: 0.4,
    },
    skybox: 'DuskSky',
    ambientMusic:
      'stadium organ, crowd chants, air horn blasts, pep-band brass, stomping feet',
    sfxStyle: 'whistle blows, ball kicks, crowd roar, scoreboard beep, referee whistle',
    voiceStyle: 'booming PA announcer voice',
    signatureProps: [
      'goal posts',
      'corner flag',
      'jumbotron screen',
      'tiered plastic seats',
      'floodlight tower',
      'scoreboard',
      'team banner',
      'referee whistle',
      'coach clipboard',
      'player bench',
      'water cooler',
      'trophy display',
    ],
    signatureMeshStyle: 'realistic',
    buildingScale: 'epic',
    architecturalRules:
      'The field is central — everything radiates outward from it. Field is perfectly flat bright green grass with white painted lines exactly to sport regulation. Tiered seating wraps 270-360 degrees with team-colored plastic seats in bowls. Install four tall floodlight towers at the corners (50+ studs high) with bright white arrays. Scoreboard/jumbotron is a focal point above one end. Include tunnel entrances for teams. Signage is sponsor-heavy with team logos. Scale is HUGE — the stadium dwarfs players. Include crowds as simple models to fill seats (don\'t leave empty). Lighting is bright even at dusk thanks to floodlights. Add team colors everywhere — flags, banners, seat colors. Include sideline details: benches, water coolers, camera rigs.',
    uiAccent: '#E83030',
    uiFontFamily: 'Impact',
    atmosphereKeywords: ['roaring', 'floodlit', 'team-colored', 'towering', 'communal', 'electric', 'regulation'],
    forbiddenElements: ['medieval', 'magic', 'horror', 'wooden huts', 'cyberpunk neon alleys'],
  },

  'beach-tropical': {
    id: 'beach-tropical',
    name: 'Beach Tropical',
    description:
      'Paradise beach resort: white sand, turquoise water, palm trees, tiki bars, surfboards.',
    colorPalette: {
      primary: '#F0E6C8',
      secondary: '#28B0C8',
      accent: '#FF8E3C',
      neutral: '#90C8A0',
      highlight: '#FFFFFF',
    },
    materials: ['Sand', 'Wood', 'Grass', 'Glass', 'Fabric', 'LeafyGrass'],
    lighting: {
      ambient: '#D0E8F0',
      brightness: 2.8,
      timeOfDay: 14.0,
      fog: { density: 0.0003, color: '#E8F4F8' },
      technology: 'Future',
      clockTime: 14.0,
      geographicLatitude: 10.0,
      exposureCompensation: 0.5,
    },
    skybox: 'TropicalBright',
    ambientMusic:
      'steel drums, reggae guitar, ocean waves, distant children laughing, gull cries, ukulele',
    sfxStyle: 'waves lapping, seagulls, sand crunch, coconut drop, beach ball bounce',
    voiceStyle: 'relaxed, laid-back, warm',
    signatureProps: [
      'palm tree',
      'surfboard',
      'tiki torch',
      'hammock',
      'beach umbrella',
      'sandcastle',
      'coconut',
      'lounge chair',
      'volleyball net',
      'lifeguard tower',
      'thatched tiki bar',
      'seashell',
      'beach ball',
      'flip-flops',
    ],
    signatureMeshStyle: 'cartoon',
    buildingScale: 'small',
    architecturalRules:
      'Center on the beach — white sand meeting turquoise water should dominate. Buildings are thatched-roof tiki huts, raised wooden bungalows on stilts, or colorful beachside shops. Use bamboo, palm thatch, and weathered wood as primary materials. Include lots of palm trees — tall and leaning. Scatter beach props: umbrellas, lounge chairs, surfboards, sandcastles. Water is turquoise/cyan, transparent, with gentle waves. Add a pier extending into the water, a lifeguard tower, a beach volleyball court. Signage is hand-painted on wood planks. Colors are tropical — cyan water, golden sand, green palms, sunset orange accents. Lighting is bright midday sun with crystal clarity. Include a tiki bar as the social hub and a thatched cabana for atmosphere.',
    uiAccent: '#FF8E3C',
    uiFontFamily: 'Kaushan',
    atmosphereKeywords: ['sunny', 'tropical', 'breezy', 'turquoise', 'relaxed', 'salty', 'sandy'],
    forbiddenElements: ['snow', 'medieval', 'cyberpunk', 'horror', 'dark', 'gothic', 'industrial'],
  },

  'arctic-tundra': {
    id: 'arctic-tundra',
    name: 'Arctic Tundra',
    description:
      'Frozen wilderness: icebergs, snowdrifts, aurora borealis, research outposts, polar night.',
    colorPalette: {
      primary: '#E8F0F8',
      secondary: '#A0C0E0',
      accent: '#5080C0',
      neutral: '#C8D8E8',
      highlight: '#FFFFFF',
    },
    materials: ['Snow', 'Ice', 'Glacier', 'Rock', 'Metal', 'Wood'],
    lighting: {
      ambient: '#B0C8E0',
      brightness: 1.8,
      timeOfDay: 16.0,
      fog: { density: 0.005, color: '#D0DCE8' },
      technology: 'Future',
      clockTime: 16.0,
      geographicLatitude: 78.0,
      exposureCompensation: 0.4,
    },
    skybox: 'AuroraSky',
    ambientMusic:
      'lonely solo violin, howling wind, distant wolf howls, creaking ice, ethereal female voice',
    sfxStyle: 'crunching snow, cracking ice, whistling wind, crackling fire, distant wolf',
    voiceStyle: 'hushed, breath-visible, determined',
    signatureProps: [
      'iceberg',
      'snowdrift',
      'igloo',
      'research tent',
      'snowmobile',
      'dog sled',
      'frozen waterfall',
      'aurora-lit sky',
      'wooden signpost',
      'oil lamp',
      'bundle of firewood',
      'ice pick',
      'arctic fox',
    ],
    signatureMeshStyle: 'realistic',
    buildingScale: 'medium',
    architecturalRules:
      'Everything is covered in snow — roofs heavy with drifts, trees laden with white. Ground is pure white with dark rock outcrops. Buildings are utilitarian research outposts: wooden cabins with steep roofs, igloos, or insulated metal modules. Include visible heat sources — smoking chimneys, campfires, glowing windows — as emotional warmth contrast. Skies are dramatic: aurora borealis at night (green/purple ribbons), pale blue by day. Add frozen elements: cracked ice, frozen lakes, icicles. Include signs of life: tracks in snow, a tethered dog team, a parked snowmobile. Visibility fades in fog/snow at distance. Colors are predominantly cool whites, blues, and greys — warm tones only from fires and windows. Scale feels isolated and vast.',
    uiAccent: '#5080C0',
    uiFontFamily: 'Oswald',
    atmosphereKeywords: ['frozen', 'isolated', 'pristine', 'howling', 'crystalline', 'aurora-lit', 'breathless'],
    forbiddenElements: ['tropical', 'desert', 'medieval castle', 'neon', 'cyberpunk', 'volcanic'],
  },

  'desert-oasis': {
    id: 'desert-oasis',
    name: 'Desert Oasis',
    description:
      'Sun-baked dunes hiding a lush oasis: sandstone temples, date palms, caravan routes.',
    colorPalette: {
      primary: '#E8C080',
      secondary: '#A06030',
      accent: '#4080A0',
      neutral: '#D0A060',
      highlight: '#F8E8B0',
    },
    materials: ['Sand', 'Sandstone', 'Rock', 'Wood', 'Fabric', 'Grass'],
    lighting: {
      ambient: '#D8B880',
      brightness: 2.6,
      timeOfDay: 11.0,
      fog: { density: 0.002, color: '#E8C890' },
      technology: 'ShadowMap',
      clockTime: 11.0,
      geographicLatitude: 25.0,
      exposureCompensation: 0.5,
    },
    skybox: 'DesertNoon',
    ambientMusic:
      'oud and tabla, breathy flute, distant camel calls, Middle Eastern vocals, wind through dunes',
    sfxStyle: 'sand shifting, camel grunts, fluttering fabric, pouring water, fire crackle',
    voiceStyle: 'warm, storyteller cadence',
    signatureProps: [
      'sand dune',
      'date palm',
      'oasis pool',
      'sandstone pyramid',
      'bedouin tent',
      'camel',
      'caravan with cargo',
      'ornate vase',
      'scimitar',
      'hookah',
      'carpet',
      'stone archway',
      'well with bucket',
      'minaret',
    ],
    signatureMeshStyle: 'realistic',
    buildingScale: 'large',
    architecturalRules:
      'Dunes roll in organic waves — never flat. The oasis is a focal point of blue water ringed by tall date palms and lush greenery, dramatic contrast against sand. Architecture is Middle Eastern: sandstone blocks, domes, pointed arches, ornate latticework windows (mashrabiya), minarets. Buildings are cream or terracotta with colorful tile accents. Streets are narrow and shaded with fabric awnings. Include caravan markers: camels, bedouin tents, cargo chests. Heat shimmer effect in the distance. Use warm golden lighting year-round. Add water features where possible — fountains, pools, irrigation channels. Scatter environmental storytelling: a broken amphora, a sun-bleached skull, a half-buried statue. Sky is clear pale blue with intense sun.',
    uiAccent: '#4080A0',
    uiFontFamily: 'Amiri',
    atmosphereKeywords: ['sun-baked', 'shimmering', 'golden', 'exotic', 'arid', 'ornate', 'ancient'],
    forbiddenElements: ['snow', 'ice', 'cyberpunk', 'medieval European castle', 'tropical rain', 'neon'],
  },

  'volcanic-hellscape': {
    id: 'volcanic-hellscape',
    name: 'Volcanic Hellscape',
    description:
      'Molten wasteland: erupting volcanoes, lava rivers, blackened rock, ash-choked sky.',
    colorPalette: {
      primary: '#2A1A14',
      secondary: '#FF4000',
      accent: '#FFC040',
      neutral: '#1A1012',
      highlight: '#FF8000',
    },
    materials: ['Basalt', 'Rock', 'Slate', 'CorrodedMetal', 'Neon'],
    lighting: {
      ambient: '#5C2010',
      brightness: 1.4,
      timeOfDay: 20.0,
      fog: { density: 0.010, color: '#4A1810' },
      technology: 'Future',
      clockTime: 20.0,
      geographicLatitude: 19.0,
      exposureCompensation: 0.3,
    },
    skybox: 'AshClouds',
    ambientMusic:
      'deep rumbling bass drone, distant eruption booms, hissing steam, ominous choir, crackling flames',
    sfxStyle: 'bubbling lava, rock cracking, steam jets, distant eruption, ember crackle',
    voiceStyle: 'deep, ominous, harsh',
    signatureProps: [
      'lava river',
      'erupting volcano',
      'basalt pillar',
      'obsidian shard',
      'bone-dry tree',
      'magma pool',
      'smoking vent',
      'ember rain',
      'charred skeleton',
      'blackened altar',
      'iron brazier',
      'ash-coated rock',
    ],
    signatureMeshStyle: 'realistic',
    buildingScale: 'epic',
    architecturalRules:
      'The land itself is dangerous — black basalt plains cracked with glowing orange lava veins. Include flowing lava rivers and pools that emit orange-red light onto everything nearby. Rock formations are jagged, sharp, and heat-cracked. Sky is perpetually dark with ash clouds, lit from below by volcanic glow. Structures are carved from black stone — obsidian fortresses, iron forges, sacrificial altars. Lighting comes from lava and fire sources — every scene should have warm orange highlights against cold black shadows. Include active eruption effects: ember particles, smoke plumes, lava fountains. Add skeletal remains and charred tree stumps for death imagery. Feel the HEAT through visual cues (heat shimmer, glowing surfaces). No vegetation except dead, petrified trees.',
    uiAccent: '#FF4000',
    uiFontFamily: 'Metamorphous',
    atmosphereKeywords: ['molten', 'ash-choked', 'cindered', 'apocalyptic', 'hellish', 'glowing', 'volcanic'],
    forbiddenElements: ['snow', 'tropical', 'cartoon pastel', 'cute', 'kawaii', 'clean futuristic'],
  },
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

export const THEME_IDS = Object.keys(THEME_PRESETS)

export function getTheme(id: string): ThemePreset {
  return THEME_PRESETS[id] ?? THEME_PRESETS['modern-city']
}

export function listThemes(): ThemePreset[] {
  return Object.values(THEME_PRESETS)
}

/**
 * Short summary line for each theme — used in the theme-detector prompt so
 * the classifier can pick the best match from a concise list.
 */
export function themeCatalogSummary(): string {
  return listThemes()
    .map((t) => `- ${t.id}: ${t.description}`)
    .join('\n')
}
