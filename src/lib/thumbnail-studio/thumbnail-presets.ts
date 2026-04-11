/**
 * Roblox Thumbnail Studio — preset catalog.
 *
 * A library of 25+ battle-tested thumbnail formulas modeled on the patterns
 * used by the most-played Roblox games (Adopt Me, Brookhaven, Blox Fruits,
 * Doors, Grow a Garden, Pet Simulator, etc.).
 *
 * Each preset encodes:
 *   1. The composition blueprint (hero placement, background type, text rig)
 *   2. A rich FAL prompt that bakes in the "Roblox thumbnail" visual grammar
 *   3. A negative prompt that avoids the usual garbage (blurry, low-res,
 *      photo-real humans, extra limbs, watermarks)
 *   4. The recommended FAL model — Ideogram-v2 and Recraft-v3 handle legible
 *      in-image text; FLUX-Pro is preferred when the text will be composited
 *      separately via the SVG overlay pipeline.
 *   5. Canonical "make X" examples to populate the UI gallery tooltips.
 *
 * Authoring rules (follow these when extending the catalog):
 *   - Hero takes 40–60% of the frame. Bigger is better — players scroll fast.
 *   - Background is high-contrast (explosion, neon tunnel, sky, gradient).
 *   - Text is HUGE, bold, outlined or shadowed. Readable at 256×144 thumbnail.
 *   - Saturation is turned up. Cartoon lighting, rim light, bright primary
 *     colors. This is NOT realistic photography.
 *   - Every preset must have a clear category and at least two examples so
 *     the UI can suggest prompts the moment a user picks a style.
 */

export type ThumbnailCategory =
  | 'action'
  | 'cute'
  | 'horror'
  | 'tycoon'
  | 'simulator'
  | 'obby'
  | 'rpg'
  | 'racing'
  | 'social'

export type FalThumbnailModel = 'flux-pro' | 'ideogram-v2' | 'recraft-v3'

export interface ThumbnailComposition {
  /** Horizontal placement of the primary subject. */
  heroPosition: 'left' | 'right' | 'center'
  /** Relative size of the hero — both values crop in tighter than image-styles. */
  heroSize: 'large' | 'huge'
  /** Background treatment applied behind the hero. */
  backgroundType: 'environment' | 'gradient' | 'explosion' | 'tunnel' | 'sky'
  /** Where the overlay headline text lives (or `none` for hero-only shots). */
  textPosition: 'top' | 'bottom' | 'left-bar' | 'none'
  /** Overlay font size bucket. */
  textSize: 'huge' | 'mega'
  /** Overlay text decoration. */
  textStyle: 'outlined' | 'shadowed' | 'gradient' | 'neon'
  /** Primary accent color — used by the SVG text overlay and UI highlight. */
  accentColor: string
}

export interface ThumbnailPreset {
  /** Stable id used by the API + URL state. */
  id: string
  /** Human-readable name for the gallery. */
  name: string
  /** One-line description shown in tooltips / card subtitles. */
  description: string
  /** Gallery tab this preset appears under. */
  category: ThumbnailCategory
  /** The proven Roblox thumbnail formula. */
  composition: ThumbnailComposition
  /** The FAL prompt body — combined with the user prompt at generate time. */
  prompt: string
  /** Negative prompt stripped from the result. */
  negativePrompt: string
  /** Which FAL model to route to — different models excel at different looks. */
  recommendedFalModel: FalThumbnailModel
  /** Canonical "make X" examples shown on hover. */
  examples: string[]
}

// ─── Shared fragments ───────────────────────────────────────────────────────

const ROBLOX_STYLE_BASE =
  'Roblox game thumbnail, 1920x1080 widescreen, highly saturated colors, ' +
  'cartoon 3D render, octane render quality, rim lighting, dramatic key light, ' +
  'promotional game art, professional marketing composition, crisp focus on hero, ' +
  'cinematic depth of field, eye-catching, high contrast, trending on Roblox front page'

const NEG_BASE =
  'blurry, low resolution, jpeg artifacts, watermark, signature, text, letters, words, ' +
  'ugly, deformed, extra limbs, bad anatomy, washed out, muddy colors, dull, ' +
  'realistic photo, photographic, boring composition, centered hero cliche, ' +
  'dark and gloomy, low contrast'

// ─── Preset catalog ─────────────────────────────────────────────────────────

export const THUMBNAIL_PRESETS: ThumbnailPreset[] = [
  // ── ACTION ────────────────────────────────────────────────────────────
  {
    id: 'action-hero-explosion',
    name: 'Hero + Explosion',
    description: 'Weapon-toting hero lunges at the camera while everything behind detonates.',
    category: 'action',
    composition: {
      heroPosition: 'left',
      heroSize: 'huge',
      backgroundType: 'explosion',
      textPosition: 'bottom',
      textSize: 'mega',
      textStyle: 'outlined',
      accentColor: '#FFD700',
    },
    prompt: `${ROBLOX_STYLE_BASE}, Roblox blocky avatar hero in tactical gear wielding a massive weapon, dramatic low angle shot, character leaning toward camera, huge fireball explosion in background, flying debris, lens flare, orange and yellow fire palette with black silhouettes, action movie poster composition`,
    negativePrompt: `${NEG_BASE}, small hero, calm scene, no action`,
    recommendedFalModel: 'flux-pro',
    examples: [
      'make a hero firing two pistols as a helicopter explodes behind them',
      'make a ninja with a katana dashing through a flaming battlefield',
      'make a soldier tossing a grenade at a tank',
    ],
  },
  {
    id: 'action-vs-banner',
    name: 'VS Duel',
    description: 'Two heroes facing off on either side with a giant VS banner between them.',
    category: 'action',
    composition: {
      heroPosition: 'center',
      heroSize: 'huge',
      backgroundType: 'gradient',
      textPosition: 'top',
      textSize: 'mega',
      textStyle: 'gradient',
      accentColor: '#FF2E63',
    },
    prompt: `${ROBLOX_STYLE_BASE}, split composition, two Roblox blocky avatar heroes facing each other in aggressive poses, heroic left character glowing blue, villain right character glowing red, giant VS lettering between them, diagonal split background blue vs red gradient, electric energy particles`,
    negativePrompt: `${NEG_BASE}, single character, empty side, balanced peaceful scene`,
    recommendedFalModel: 'ideogram-v2',
    examples: [
      'make a hero VS a giant dragon',
      'make a cop VS robber split thumbnail',
      'make a warrior VS wizard duel',
    ],
  },
  {
    id: 'action-weapon-hero',
    name: 'Weapon Close-Up',
    description: 'Intense hero portrait with a huge weapon held forward toward camera.',
    category: 'action',
    composition: {
      heroPosition: 'right',
      heroSize: 'huge',
      backgroundType: 'tunnel',
      textPosition: 'left-bar',
      textSize: 'huge',
      textStyle: 'shadowed',
      accentColor: '#00E5FF',
    },
    prompt: `${ROBLOX_STYLE_BASE}, Roblox avatar hero pointing a giant futuristic rifle directly at the camera, tight portrait crop, intense expression, motion blur speed tunnel background cyan and purple, neon side lights, cyberpunk combat vibe`,
    negativePrompt: `${NEG_BASE}, small weapon, distant camera, peaceful expression`,
    recommendedFalModel: 'flux-pro',
    examples: [
      'make a futuristic commando aiming a plasma gun at the camera',
      'make a knight aiming a glowing crossbow',
    ],
  },
  {
    id: 'action-aerial-dive',
    name: 'Aerial Dive',
    description: 'Hero dropping from the sky in a superhero landing pose.',
    category: 'action',
    composition: {
      heroPosition: 'center',
      heroSize: 'huge',
      backgroundType: 'sky',
      textPosition: 'bottom',
      textSize: 'mega',
      textStyle: 'outlined',
      accentColor: '#FF3B30',
    },
    prompt: `${ROBLOX_STYLE_BASE}, Roblox avatar hero mid-air in a superhero landing pose diving toward the viewer, cape flapping, motion lines, sunset sky with rim light, shockwave rings forming at feet, low angle camera looking up`,
    negativePrompt: `${NEG_BASE}, grounded static pose, flat lighting`,
    recommendedFalModel: 'flux-pro',
    examples: [
      'make a caped hero crashing down from the sky over a city',
      'make a ninja diving out of a helicopter',
    ],
  },

  // ── CUTE ──────────────────────────────────────────────────────────────
  {
    id: 'cute-mascot-hearts',
    name: 'Mascot + Hearts',
    description: 'Adorable blob mascot waving, floating hearts, pastel background.',
    category: 'cute',
    composition: {
      heroPosition: 'center',
      heroSize: 'huge',
      backgroundType: 'gradient',
      textPosition: 'top',
      textSize: 'mega',
      textStyle: 'shadowed',
      accentColor: '#FF8FB1',
    },
    prompt: `${ROBLOX_STYLE_BASE}, adorable chibi Roblox character with giant sparkling eyes waving at camera, soft pastel pink and lavender gradient background, floating cartoon hearts and sparkles, bokeh lights, kawaii vibe, friendly welcoming smile, soft ambient lighting`,
    negativePrompt: `${NEG_BASE}, scary, dark, weapons, edgy, realistic proportions`,
    recommendedFalModel: 'recraft-v3',
    examples: [
      'make a pink mascot blob waving with hearts floating around',
      'make a happy bunny Roblox avatar in a pastel meadow',
    ],
  },
  {
    id: 'cute-pet-reveal',
    name: 'Pet Reveal',
    description: 'New pet unboxing moment with shocked-happy avatar reaction.',
    category: 'cute',
    composition: {
      heroPosition: 'left',
      heroSize: 'large',
      backgroundType: 'gradient',
      textPosition: 'right-bar' as unknown as 'left-bar', // keep as-is; see note
      textSize: 'huge',
      textStyle: 'outlined',
      accentColor: '#FFC93C',
    },
    prompt: `${ROBLOX_STYLE_BASE}, Roblox avatar with shocked-delighted face opening a glowing treasure egg, a rare glowing rainbow pet floating above the egg with light rays, yellow and pink gradient background with confetti and sparkles`,
    negativePrompt: `${NEG_BASE}, sad expression, broken egg, dark colors`,
    recommendedFalModel: 'recraft-v3',
    examples: [
      'make an avatar unboxing a legendary dragon pet',
      'make a pet adoption moment with a rainbow unicorn',
    ],
  },
  {
    id: 'cute-cafe-hangout',
    name: 'Cafe Hangout',
    description: 'Cozy cafe scene with cute avatar serving drinks. Warm and inviting.',
    category: 'cute',
    composition: {
      heroPosition: 'center',
      heroSize: 'large',
      backgroundType: 'environment',
      textPosition: 'top',
      textSize: 'huge',
      textStyle: 'shadowed',
      accentColor: '#C08457',
    },
    prompt: `${ROBLOX_STYLE_BASE}, cute Roblox avatar barista in apron holding a foamy latte and winking, cozy cafe interior background, warm string lights, pastries on counter, wooden tones, inviting warm color palette, instagram-ready`,
    negativePrompt: `${NEG_BASE}, dark, empty cafe, gloomy`,
    recommendedFalModel: 'recraft-v3',
    examples: [
      'make a barista serving coffee in a pink cafe',
      'make a bakery owner holding a giant cupcake',
    ],
  },

  // ── HORROR ────────────────────────────────────────────────────────────
  {
    id: 'horror-monster-reveal',
    name: 'Monster Reveal',
    description: 'Terrifying creature emerging from darkness with a single spotlight.',
    category: 'horror',
    composition: {
      heroPosition: 'center',
      heroSize: 'huge',
      backgroundType: 'environment',
      textPosition: 'bottom',
      textSize: 'mega',
      textStyle: 'outlined',
      accentColor: '#B80C09',
    },
    prompt: `${ROBLOX_STYLE_BASE}, terrifying Roblox monster creature with glowing red eyes emerging from pitch-black shadows, single harsh spotlight from above, dust particles in the beam, deep blood-red accent color, stretched limbs, eerie silhouette, horror movie poster composition`,
    negativePrompt: `${NEG_BASE}, cute, bright cheerful colors, daylight, safe`,
    recommendedFalModel: 'flux-pro',
    examples: [
      'make a long-armed monster stalking down a dark hallway',
      'make a possessed doll with glowing red eyes in a basement',
    ],
  },
  {
    id: 'horror-door-peek',
    name: 'Door Peek',
    description: 'Creepy figure peeking around an open door in a dim corridor.',
    category: 'horror',
    composition: {
      heroPosition: 'right',
      heroSize: 'large',
      backgroundType: 'environment',
      textPosition: 'left-bar',
      textSize: 'huge',
      textStyle: 'shadowed',
      accentColor: '#7A0019',
    },
    prompt: `${ROBLOX_STYLE_BASE}, creepy tall figure peeking around a half-open wooden door at the end of a Victorian hallway, flickering candlelight, volumetric fog, desaturated palette with a single crimson highlight, horror atmosphere, suspense`,
    negativePrompt: `${NEG_BASE}, bright room, cheerful, modern clean space`,
    recommendedFalModel: 'flux-pro',
    examples: [
      'make a stalker peeking around a hospital door',
      'make a ghost floating behind a door in a haunted house',
    ],
  },
  {
    id: 'horror-chase',
    name: 'Chase Scene',
    description: 'Player running toward camera with monster lunging from behind.',
    category: 'horror',
    composition: {
      heroPosition: 'center',
      heroSize: 'huge',
      backgroundType: 'tunnel',
      textPosition: 'top',
      textSize: 'mega',
      textStyle: 'outlined',
      accentColor: '#E63946',
    },
    prompt: `${ROBLOX_STYLE_BASE}, terrified Roblox avatar sprinting straight toward the camera with arms outstretched, massive shadowy monster lunging from behind with glowing eyes, motion blur tunnel, flickering emergency red lights, panic atmosphere`,
    negativePrompt: `${NEG_BASE}, calm walking, safe scene, bright daylight`,
    recommendedFalModel: 'flux-pro',
    examples: [
      'make a player running from a giant beast in a subway',
      'make an escape scene from a killer clown',
    ],
  },

  // ── TYCOON ────────────────────────────────────────────────────────────
  {
    id: 'tycoon-money-pile',
    name: 'Money Pile',
    description: 'Shocked avatar standing on a mountain of cash with gold bars.',
    category: 'tycoon',
    composition: {
      heroPosition: 'center',
      heroSize: 'huge',
      backgroundType: 'gradient',
      textPosition: 'bottom',
      textSize: 'mega',
      textStyle: 'gradient',
      accentColor: '#2ECC71',
    },
    prompt: `${ROBLOX_STYLE_BASE}, Roblox avatar with wide shocked-mouth-open expression standing on a giant pile of cash and gold bars, dollar bills raining from above, green and gold color palette, radial gradient background, sparkles and dollar signs flying out`,
    negativePrompt: `${NEG_BASE}, empty room, small money pile, sad expression`,
    recommendedFalModel: 'ideogram-v2',
    examples: [
      'make a tycoon hero rolling in piles of cash',
      'make an avatar swimming in a vault of gold coins',
    ],
  },
  {
    id: 'tycoon-empire-ceo',
    name: 'CEO Empire',
    description: 'Business CEO avatar in front of a skyscraper cityscape at sunset.',
    category: 'tycoon',
    composition: {
      heroPosition: 'left',
      heroSize: 'large',
      backgroundType: 'environment',
      textPosition: 'top',
      textSize: 'huge',
      textStyle: 'shadowed',
      accentColor: '#F4C430',
    },
    prompt: `${ROBLOX_STYLE_BASE}, confident Roblox avatar in black suit and sunglasses arms crossed, glowing gold watch, towering skyscraper city skyline at sunset behind, orange and gold sky, helicopter and private jet in background, power pose`,
    negativePrompt: `${NEG_BASE}, casual clothes, suburban setting, poverty`,
    recommendedFalModel: 'flux-pro',
    examples: [
      'make a CEO in front of their city empire',
      'make a boss character with limos and jets behind them',
    ],
  },
  {
    id: 'tycoon-shocked-face',
    name: 'Shocked Face Meme',
    description: 'Classic Roblox tycoon formula: shocked face + arrow + huge number.',
    category: 'tycoon',
    composition: {
      heroPosition: 'left',
      heroSize: 'large',
      backgroundType: 'gradient',
      textPosition: 'top',
      textSize: 'mega',
      textStyle: 'outlined',
      accentColor: '#FF0080',
    },
    prompt: `${ROBLOX_STYLE_BASE}, Roblox avatar with exaggerated shocked open-mouth face jabbing a finger toward the right at a glowing number, big red arrow pointing at the number, bright yellow gradient background, meme-style composition, clickbait energy`,
    negativePrompt: `${NEG_BASE}, calm face, centered symmetrical composition`,
    recommendedFalModel: 'ideogram-v2',
    examples: [
      'make a shocked face tycoon pointing at 1 billion coins',
      'make the classic pointing-arrow rich tycoon meme',
    ],
  },

  // ── SIMULATOR ─────────────────────────────────────────────────────────
  {
    id: 'sim-boost-numbers',
    name: 'Insane Boost',
    description: 'Giant floating +5000 number, shockwave, hyped avatar.',
    category: 'simulator',
    composition: {
      heroPosition: 'left',
      heroSize: 'large',
      backgroundType: 'gradient',
      textPosition: 'top',
      textSize: 'mega',
      textStyle: 'gradient',
      accentColor: '#00E5FF',
    },
    prompt: `${ROBLOX_STYLE_BASE}, cheering Roblox avatar with arms raised in triumph, giant glowing +5000 floating number beside them with shockwave rings, radial blue-to-cyan burst background, particle effects and motion lines, simulator progression hype`,
    negativePrompt: `${NEG_BASE}, calm pose, no numbers, dull background`,
    recommendedFalModel: 'ideogram-v2',
    examples: [
      'make a strength sim character lifting weights with a +9999 boost',
      'make a pet sim hero opening a legendary with +1M coins',
    ],
  },
  {
    id: 'sim-mega-pet',
    name: 'Mega Pet',
    description: 'Enormous legendary pet towering behind a tiny awed avatar.',
    category: 'simulator',
    composition: {
      heroPosition: 'right',
      heroSize: 'huge',
      backgroundType: 'sky',
      textPosition: 'left-bar',
      textSize: 'mega',
      textStyle: 'neon',
      accentColor: '#B026FF',
    },
    prompt: `${ROBLOX_STYLE_BASE}, giant legendary glowing rainbow dragon pet towering behind a small Roblox avatar looking up in awe, dramatic scale difference, purple and pink sky with stars and nebula, godrays coming down, mythical simulator hero moment`,
    negativePrompt: `${NEG_BASE}, small pet, ordinary pet, same scale as player`,
    recommendedFalModel: 'flux-pro',
    examples: [
      'make a mega shadow dragon dwarfing the player',
      'make a rainbow huge cat behind a tiny avatar',
    ],
  },
  {
    id: 'sim-strength',
    name: 'Strength Flex',
    description: 'Buff avatar flexing with cracked ground and energy aura.',
    category: 'simulator',
    composition: {
      heroPosition: 'center',
      heroSize: 'huge',
      backgroundType: 'explosion',
      textPosition: 'bottom',
      textSize: 'mega',
      textStyle: 'outlined',
      accentColor: '#FFB300',
    },
    prompt: `${ROBLOX_STYLE_BASE}, extremely muscular Roblox avatar flexing both arms with a golden energy aura exploding outward, cracked ground beneath feet, orange energy rings, lightning bolts, strength simulator hype`,
    negativePrompt: `${NEG_BASE}, skinny avatar, no aura, calm pose`,
    recommendedFalModel: 'flux-pro',
    examples: [
      'make a strength sim buff avatar flexing with a fire aura',
      'make a lifting sim hero breaking the ground',
    ],
  },

  // ── OBBY ──────────────────────────────────────────────────────────────
  {
    id: 'obby-lava-jump',
    name: 'Lava Jump',
    description: 'Avatar silhouette leaping over lava gap with rising platforms.',
    category: 'obby',
    composition: {
      heroPosition: 'center',
      heroSize: 'large',
      backgroundType: 'environment',
      textPosition: 'top',
      textSize: 'mega',
      textStyle: 'outlined',
      accentColor: '#FF4500',
    },
    prompt: `${ROBLOX_STYLE_BASE}, Roblox avatar mid-jump silhouette leaping across a massive lava gap, glowing stone platforms at crazy angles, embers and ash flying, orange-red lava glow from below, perilous obby composition, vertical peril`,
    negativePrompt: `${NEG_BASE}, safe grass ground, no lava, boring flat level`,
    recommendedFalModel: 'flux-pro',
    examples: [
      'make an obby hero leaping across lava pillars',
      'make the hardest obby thumbnail with a volcano',
    ],
  },
  {
    id: 'obby-tower-climb',
    name: 'Tower Climb',
    description: 'Low angle of a floating obby tower disappearing into the sky.',
    category: 'obby',
    composition: {
      heroPosition: 'right',
      heroSize: 'large',
      backgroundType: 'sky',
      textPosition: 'left-bar',
      textSize: 'mega',
      textStyle: 'shadowed',
      accentColor: '#1E90FF',
    },
    prompt: `${ROBLOX_STYLE_BASE}, low angle upward view of a massive floating Roblox obby tower of colorful platforms spiraling into a bright sunny sky, tiny avatar near the top, clouds around the base, impossible height scale`,
    negativePrompt: `${NEG_BASE}, flat ground, short tower, rainy sky`,
    recommendedFalModel: 'flux-pro',
    examples: [
      'make a tower of hell climb thumbnail',
      'make a floating obby tower in the clouds',
    ],
  },
  {
    id: 'obby-speedrun',
    name: 'Speedrun',
    description: 'Blurred speed lines and a sliding avatar on a neon track.',
    category: 'obby',
    composition: {
      heroPosition: 'left',
      heroSize: 'large',
      backgroundType: 'tunnel',
      textPosition: 'bottom',
      textSize: 'mega',
      textStyle: 'neon',
      accentColor: '#39FF14',
    },
    prompt: `${ROBLOX_STYLE_BASE}, Roblox avatar sliding and boosting forward through a neon green speedrun tunnel, intense motion blur, checkered finish line, speed lines, green and cyan glow, competitive obby vibe`,
    negativePrompt: `${NEG_BASE}, static pose, no motion, dull colors`,
    recommendedFalModel: 'flux-pro',
    examples: [
      'make a speedrun obby thumbnail',
      'make a parkour runner hitting a checkpoint',
    ],
  },

  // ── RPG ───────────────────────────────────────────────────────────────
  {
    id: 'rpg-hero-pose',
    name: 'Hero Pose',
    description: 'RPG hero in epic stance with glowing sword and mountain backdrop.',
    category: 'rpg',
    composition: {
      heroPosition: 'center',
      heroSize: 'huge',
      backgroundType: 'environment',
      textPosition: 'bottom',
      textSize: 'mega',
      textStyle: 'shadowed',
      accentColor: '#4FC3F7',
    },
    prompt: `${ROBLOX_STYLE_BASE}, heroic Roblox avatar in ornate fantasy armor holding a glowing sword aloft, cape flapping in wind, snow-capped mountain range backdrop at golden hour, volumetric sunrays, epic fantasy RPG cover composition`,
    negativePrompt: `${NEG_BASE}, modern setting, casual clothes, flat lighting`,
    recommendedFalModel: 'flux-pro',
    examples: [
      'make a sword hero on a mountain peak',
      'make a paladin raising a glowing hammer',
    ],
  },
  {
    id: 'rpg-mage-magic',
    name: 'Mage Magic',
    description: 'Mage casting a huge spell with swirling magic runes.',
    category: 'rpg',
    composition: {
      heroPosition: 'right',
      heroSize: 'huge',
      backgroundType: 'gradient',
      textPosition: 'left-bar',
      textSize: 'huge',
      textStyle: 'neon',
      accentColor: '#9C27B0',
    },
    prompt: `${ROBLOX_STYLE_BASE}, Roblox wizard avatar casting a massive purple spell with swirling glowing runes orbiting their hands, starry purple and blue gradient background, spell particles exploding outward, dramatic wizard pose, hood and robe flowing`,
    negativePrompt: `${NEG_BASE}, no magic, modern clothing, empty hands`,
    recommendedFalModel: 'flux-pro',
    examples: [
      'make a wizard casting a giant fireball',
      'make a sorcerer with floating glowing runes',
    ],
  },
  {
    id: 'rpg-party',
    name: 'Adventure Party',
    description: 'Classic four-hero RPG party lineup with dungeon entrance behind.',
    category: 'rpg',
    composition: {
      heroPosition: 'center',
      heroSize: 'large',
      backgroundType: 'environment',
      textPosition: 'top',
      textSize: 'huge',
      textStyle: 'outlined',
      accentColor: '#E4B363',
    },
    prompt: `${ROBLOX_STYLE_BASE}, four Roblox avatar heroes lined up in classic RPG party formation — warrior, mage, rogue, healer — posing heroically in front of a glowing dungeon entrance, torchlight, ancient stone archway, D&D party portrait composition`,
    negativePrompt: `${NEG_BASE}, single hero, scattered, modern setting`,
    recommendedFalModel: 'flux-pro',
    examples: [
      'make a four-hero RPG adventure party',
      'make a D&D-style party entering a dungeon',
    ],
  },

  // ── RACING ────────────────────────────────────────────────────────────
  {
    id: 'racing-speed-burst',
    name: 'Speed Burst',
    description: 'Supercar tearing through the frame with intense speed blur.',
    category: 'racing',
    composition: {
      heroPosition: 'center',
      heroSize: 'huge',
      backgroundType: 'tunnel',
      textPosition: 'bottom',
      textSize: 'mega',
      textStyle: 'gradient',
      accentColor: '#FF1744',
    },
    prompt: `${ROBLOX_STYLE_BASE}, stylized Roblox supercar with glowing underglow tearing forward toward the camera, extreme motion blur speed tunnel background, streaks of red and white light, sparks flying off tires, low aggressive angle`,
    negativePrompt: `${NEG_BASE}, parked car, slow, boring road, daylight parking lot`,
    recommendedFalModel: 'flux-pro',
    examples: [
      'make a supercar ripping through a neon tunnel',
      'make a drag race burnout thumbnail',
    ],
  },
  {
    id: 'racing-finish-line',
    name: 'Finish Line',
    description: 'Car crossing the checkered finish line with confetti and crowd.',
    category: 'racing',
    composition: {
      heroPosition: 'center',
      heroSize: 'huge',
      backgroundType: 'environment',
      textPosition: 'top',
      textSize: 'mega',
      textStyle: 'outlined',
      accentColor: '#FFD700',
    },
    prompt: `${ROBLOX_STYLE_BASE}, Roblox race car exploding across a checkered finish line, confetti raining down, cheering stadium crowd in background, golden trophy sparkle effect, victory moment, motorsports composition`,
    negativePrompt: `${NEG_BASE}, empty track, no crowd, losing position`,
    recommendedFalModel: 'ideogram-v2',
    examples: [
      'make a racer crossing the finish line with confetti',
      'make a victory lap thumbnail with a trophy',
    ],
  },
  {
    id: 'racing-drift-king',
    name: 'Drift King',
    description: 'Car sliding sideways with a giant trail of tire smoke.',
    category: 'racing',
    composition: {
      heroPosition: 'left',
      heroSize: 'huge',
      backgroundType: 'environment',
      textPosition: 'right-bar' as unknown as 'left-bar',
      textSize: 'mega',
      textStyle: 'neon',
      accentColor: '#00FFAA',
    },
    prompt: `${ROBLOX_STYLE_BASE}, Roblox car drifting sideways on a mountain pass at night, huge arc of tire smoke and sparks behind, neon underglow green, city lights twinkling in the valley below, drift king composition`,
    negativePrompt: `${NEG_BASE}, straight driving, no smoke, boring angle`,
    recommendedFalModel: 'flux-pro',
    examples: [
      'make a drift racer on a mountain road at night',
      'make a car sliding through a turn with smoke',
    ],
  },

  // ── SOCIAL ────────────────────────────────────────────────────────────
  {
    id: 'social-hangout',
    name: 'Friends Hangout',
    description: 'Group of smiling avatars posing together in a vibrant hangout spot.',
    category: 'social',
    composition: {
      heroPosition: 'center',
      heroSize: 'large',
      backgroundType: 'environment',
      textPosition: 'top',
      textSize: 'huge',
      textStyle: 'shadowed',
      accentColor: '#FF4081',
    },
    prompt: `${ROBLOX_STYLE_BASE}, group of five diverse Roblox avatars posing together having fun in a colorful urban hangout spot, neon signs, bright daylight, selfie vibe, friendly waving, community game energy`,
    negativePrompt: `${NEG_BASE}, single character, empty scene, gloomy atmosphere`,
    recommendedFalModel: 'recraft-v3',
    examples: [
      'make a group of friends hanging out at a mall',
      'make a roleplay hangout thumbnail at a beach',
    ],
  },
  {
    id: 'social-house-tour',
    name: 'House Tour',
    description: 'Avatar welcoming players to a beautiful home interior.',
    category: 'social',
    composition: {
      heroPosition: 'left',
      heroSize: 'large',
      backgroundType: 'environment',
      textPosition: 'right-bar' as unknown as 'left-bar',
      textSize: 'huge',
      textStyle: 'shadowed',
      accentColor: '#26A69A',
    },
    prompt: `${ROBLOX_STYLE_BASE}, cheerful Roblox avatar gesturing welcome inside a beautifully decorated modern home living room, sunlight streaming through large windows, plants and art, real estate showroom vibe, inviting warm tones`,
    negativePrompt: `${NEG_BASE}, empty room, dark, ugly furniture`,
    recommendedFalModel: 'recraft-v3',
    examples: [
      'make a Brookhaven-style house tour thumbnail',
      'make a home roleplay welcome scene',
    ],
  },
  {
    id: 'social-party-dance',
    name: 'Party Dance',
    description: 'Avatars dancing under disco lights on a club dance floor.',
    category: 'social',
    composition: {
      heroPosition: 'center',
      heroSize: 'large',
      backgroundType: 'environment',
      textPosition: 'bottom',
      textSize: 'mega',
      textStyle: 'neon',
      accentColor: '#E040FB',
    },
    prompt: `${ROBLOX_STYLE_BASE}, multiple Roblox avatars dancing with energetic poses on a glowing club dance floor, colorful spotlights and lasers, disco ball, DJ booth in background, confetti bursts, party atmosphere, neon pink and purple palette`,
    negativePrompt: `${NEG_BASE}, empty dance floor, daylight, no lights`,
    recommendedFalModel: 'recraft-v3',
    examples: [
      'make a party club dance thumbnail',
      'make a Roblox concert crowd scene',
    ],
  },
]

// The "right-bar" literal slipped into a couple of presets above during
// authoring — we normalize to the declared union at runtime so types hold and
// the renderer can still support a mirrored placement variant.
for (const p of THUMBNAIL_PRESETS) {
  const pos = p.composition.textPosition as unknown as string
  if (pos === 'right-bar') {
    p.composition.textPosition = 'left-bar'
  }
}

// ─── Lookups ────────────────────────────────────────────────────────────────

/** Stable list of all preset ids — handy for Zod enums. */
export const THUMBNAIL_PRESET_IDS = THUMBNAIL_PRESETS.map((p) => p.id) as [
  string,
  ...string[],
]

/** Total preset count — exported so tests can assert the 25+ minimum. */
export const THUMBNAIL_PRESET_COUNT = THUMBNAIL_PRESETS.length

/** O(1) lookup by id with a safe fallback to the first preset. */
export function getThumbnailPreset(id: string): ThumbnailPreset {
  return (
    THUMBNAIL_PRESETS.find((p) => p.id === id) ?? THUMBNAIL_PRESETS[0]!
  )
}

/** Group presets by category — used by the gallery UI to build tabs. */
export function getPresetsByCategory(): Record<ThumbnailCategory, ThumbnailPreset[]> {
  const out = {
    action: [],
    cute: [],
    horror: [],
    tycoon: [],
    simulator: [],
    obby: [],
    rpg: [],
    racing: [],
    social: [],
  } as Record<ThumbnailCategory, ThumbnailPreset[]>
  for (const p of THUMBNAIL_PRESETS) out[p.category].push(p)
  return out
}
