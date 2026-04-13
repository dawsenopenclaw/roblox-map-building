import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import Link from 'next/link'

export const metadata: Metadata = createMetadata({
  title: 'Prompt Guide',
  description:
    'Get the best results from ForjeGames AI. Learn how to write prompts for all 9 AI modes — Build, Script, Terrain, 3D, Image, Think, Ideas, Plan, and Debug.',
  path: '/prompt-guide',
  keywords: [
    'ForjeGames prompt guide',
    'Roblox AI prompts',
    'AI game building prompts',
    'Roblox prompt engineering',
    'ForjeGames AI modes',
    'how to use ForjeGames',
    'Roblox AI tips',
    'Luau AI prompts',
  ],
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Write Great Prompts for ForjeGames AI',
    description:
      'A comprehensive guide to getting the best results from ForjeGames AI across all 9 modes.',
    step: [
      {
        '@type': 'HowToStep',
        name: 'Be specific about what you want',
        text: 'Include details like dimensions, materials, colors, and player counts instead of vague descriptions.',
      },
      {
        '@type': 'HowToStep',
        name: 'Name the game genre and audience',
        text: 'Mention the Roblox genre (tycoon, obby, simulator, RPG) and target audience so the AI can tailor its output.',
      },
      {
        '@type': 'HowToStep',
        name: 'Use the right AI mode',
        text: 'ForjeGames auto-detects intent, but you can steer it by using keywords that match specific modes like build, script, terrain, 3d, or debug.',
      },
    ],
  },
})

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface ModeInfo {
  name: string
  icon: string
  color: string
  bg: string
  tagline: string
  description: string
  examples: { basic: string; enhanced: string }[]
  tips: string[]
}

const MODES: ModeInfo[] = [
  {
    name: 'Build',
    icon: 'B',
    color: '#D4AF37',
    bg: 'rgba(212,175,55,0.15)',
    tagline: 'Autonomous full-game builder',
    description:
      'The Build agent constructs complete game environments end-to-end. It generates Luau code that creates terrain, structures, NPCs, scripts, and systems in a single pass. Use it when you want the AI to build everything from a single description.',
    examples: [
      {
        basic: 'Make me a tycoon game',
        enhanced:
          'Build a pizza tycoon game with 4 upgrade tiers, a conveyor belt system, customer NPCs that walk in and order, a cash register UI, and a leaderboard. Target 20 concurrent players, mobile-friendly.',
      },
      {
        basic: 'Create an obby',
        enhanced:
          'Build a 30-stage obby with increasing difficulty. Stages 1-10 use basic jumps, 11-20 add moving platforms and spinners, 21-30 add wall jumps and timed disappearing blocks. Include checkpoints every 5 stages and a completion time leaderboard.',
      },
    ],
    tips: [
      'Mention player count so the AI optimizes for server performance',
      'Specify mobile vs. PC so the AI adapts controls and UI scale',
      'Name specific game systems you want (leaderboard, shop, inventory)',
    ],
  },
  {
    name: 'Script',
    icon: 'S',
    color: '#60A5FA',
    bg: 'rgba(96,165,250,0.15)',
    tagline: 'Production-quality Luau code',
    description:
      'The Script agent writes typed Luau with proper service access, error handling, and Roblox best practices. It outputs clean, commented code ready to drop into Studio.',
    examples: [
      {
        basic: 'Make a gun script',
        enhanced:
          'Write a raycast weapon system with: FireServer remote event, 10-round magazine with 2s reload, bullet drop over 200 studs, hit detection using workspace:Raycast with a FilterDescendantsInstances whitelist, damage falloff from 50 at close range to 15 at max range, and muzzle flash VFX using a PointLight + BillboardGui.',
      },
      {
        basic: 'Add a shop',
        enhanced:
          'Write a ModuleScript shop system with: a RemoteFunction for purchases, server-side validation against a price table, DataStore persistence for owned items, a client-side ScreenGui with a scrolling frame of items showing name/price/owned status, and a purchase confirmation dialog. Use TweenService for open/close animations.',
      },
    ],
    tips: [
      'Specify Script vs. LocalScript vs. ModuleScript when it matters',
      'Mention which services the code should interact with (DataStoreService, TweenService, etc.)',
      'Ask for typed Luau (--!strict) if you want full type annotations',
    ],
  },
  {
    name: 'Terrain',
    icon: 'T',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.15)',
    tagline: 'Biome, heightmap, and voxel terrain',
    description:
      'The Terrain agent generates Luau code that operates on Workspace.Terrain using WriteVoxels, FillBlock, FillBall, and FillRegion. It handles biomes, rivers, mountains, caves, and custom landscapes.',
    examples: [
      {
        basic: 'Make a mountain',
        enhanced:
          'Generate a volcanic island biome: a central mountain (400 studs tall, basalt material) with a lava-filled crater at the top (FillBall with Enum.Material.CrackedLava), surrounded by a tropical beach ring (sand, 30 studs wide) transitioning to grass with scattered rock outcrops. Add a river flowing from the mountainside to the ocean.',
      },
      {
        basic: 'Create a map',
        enhanced:
          'Build a 2048x2048 survival map with 4 biomes: snow mountains in the north (Enum.Material.Snow, peaks at 300 studs), dense forest in the east (Enum.Material.LeafyGrass with tree-sized FillBlock pillars), desert in the south (Enum.Material.Sand, flat with dune ridges), and a swamp in the west (Enum.Material.Mud, low elevation with water pools). Connect them with a river system.',
      },
    ],
    tips: [
      'Specify stud dimensions so the AI scales terrain correctly',
      'Name Roblox terrain materials (Enum.Material.Snow, Basalt, etc.) for precision',
      'Mention water features explicitly — rivers, lakes, and oceans need FillRegion with Water material',
    ],
  },
  {
    name: '3D',
    icon: '3',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.15)',
    tagline: 'Meshy-powered 3D model generation',
    description:
      'The 3D agent produces specifications for the Meshy text-to-3D pipeline. It outputs structured prompts with art style, polycount targets, texture requirements, and optional Luau placement code.',
    examples: [
      {
        basic: 'Make a sword',
        enhanced:
          'Generate a fantasy greatsword with a glowing blue crystal embedded in the crossguard, dark steel blade with runic engravings, leather-wrapped grip, and a skull pommel. Style: stylized PBR, mid polycount. Textures: base color, normal map, metallic-roughness, emissive for the crystal.',
      },
      {
        basic: 'Create a house',
        enhanced:
          'Generate a medieval blacksmith shop: stone foundation, half-timber upper floor, thatched roof with a chimney emitting smoke, open front wall showing an anvil and forge inside. Art style: low-poly stylized. Include a hanging wooden sign. Optimize for Roblox (under 5K triangles).',
      },
    ],
    tips: [
      'Specify art style: "low-poly", "realistic PBR", "stylized", or "voxel"',
      'Mention polycount targets for Roblox performance (low/mid/high)',
      'Request specific texture maps if you need PBR materials',
    ],
  },
  {
    name: 'Image',
    icon: 'I',
    color: '#FB923C',
    bg: 'rgba(251,146,60,0.15)',
    tagline: 'Image generation prompts for textures and decals',
    description:
      'The Image agent creates optimized prompts for Fal, Meshy image-to-3D, or Roblox decal uploads. It outputs structured specs with subject, style, composition, lighting, and negative prompts.',
    examples: [
      {
        basic: 'Make a texture',
        enhanced:
          'Generate a seamless PBR cobblestone texture for a medieval town square. Irregularly shaped gray stones with moss growing between cracks, slightly wet look. Top-down orthographic view, diffuse lighting, no shadows. Output at 1024x1024 for tiling.',
      },
      {
        basic: 'Create a game thumbnail',
        enhanced:
          'Generate a Roblox game thumbnail (1920x1080) for a zombie survival game: a group of 3 blocky Roblox characters with weapons standing on a rooftop at sunset, horde of zombies below in a destroyed city. Dramatic orange/red lighting, cinematic composition with the game title "DEAD ZONE" in bold metallic text at the top.',
      },
    ],
    tips: [
      'Specify the exact resolution you need (1024x1024 for textures, 1920x1080 for thumbnails)',
      'Mention "seamless" or "tileable" for textures that need to repeat',
      'Include art direction: camera angle, lighting mood, and what to avoid',
    ],
  },
  {
    name: 'Think',
    icon: 'T',
    color: '#F472B6',
    bg: 'rgba(244,114,182,0.15)',
    tagline: 'Strategic framing and decomposition',
    description:
      'The Think agent reasons about your goal before any code is written. It identifies the concrete deliverable, hidden constraints, which downstream agents should handle which parts, and the biggest risk or ambiguity. Use it for complex or open-ended requests.',
    examples: [
      {
        basic: 'I want to make a game',
        enhanced:
          'I want to build a competitive multiplayer racing game for Roblox with vehicle customization, 6 tracks, and a ranking system. My target audience is 10-16 year olds on mobile. I have no Luau experience. What should I build first, and what are the biggest technical risks?',
      },
    ],
    tips: [
      'Use Think for planning, not building — it hands off to other agents',
      'Mention your skill level so it calibrates recommendations',
      'Ask about risks and trade-offs explicitly if you want strategic advice',
    ],
  },
  {
    name: 'Ideas',
    icon: 'I',
    color: '#E879F9',
    bg: 'rgba(232,121,249,0.15)',
    tagline: 'Concept brainstorming and direction',
    description:
      'The Ideas agent generates 3-5 concrete game concepts you can choose from. Each includes a name, core gameplay loop, signature mechanics, and target audience. Use it when you need inspiration or want to explore directions.',
    examples: [
      {
        basic: 'Give me game ideas',
        enhanced:
          'Suggest 5 Roblox game concepts that combine the tycoon genre with horror elements. Target audience: 13-18 year olds. Each idea should have a unique twist that differentiates it from existing Roblox tycoons. Prefer ideas that work well with 10-30 concurrent players.',
      },
    ],
    tips: [
      'Mention genres you like and genres you want to avoid',
      'Specify your target audience and player count',
      'Ask it to focus on differentiators from existing Roblox games',
    ],
  },
  {
    name: 'Plan',
    icon: 'P',
    color: '#34D399',
    bg: 'rgba(52,211,153,0.15)',
    tagline: 'Ordered build plan decomposed by agent',
    description:
      'The Plan agent takes your goal and breaks it into an ordered build plan with numbered steps. Each step names which agent should execute it (Terrain, Script, Build, 3D, Image). Use it before a big build to get a roadmap.',
    examples: [
      {
        basic: 'Plan my RPG',
        enhanced:
          'Create a build plan for a fantasy RPG with: an open-world map (forest, desert, snow biomes), 5 enemy types with scaling difficulty, a quest system with 10 main quests, an inventory and equipment system, a crafting system with 3 tiers, and an NPC dialog system. List each step in build order with which AI agent handles it.',
      },
    ],
    tips: [
      'Be exhaustive about the systems you want — the plan only covers what you mention',
      'Ask for playtest criteria so you know when each step is "done"',
      'Use the plan output to guide follow-up prompts to specific agents',
    ],
  },
  {
    name: 'Debug',
    icon: 'D',
    color: '#F87171',
    bg: 'rgba(248,113,113,0.15)',
    tagline: 'Error diagnosis and minimal fix',
    description:
      'The Debug agent reads Luau error messages, stack traces, and output logs, then returns a root cause, minimal code fix, and a regression check. Paste your error and it identifies the problem.',
    examples: [
      {
        basic: 'My script is broken',
        enhanced:
          'Getting this error in my combat script: "ServerScriptService.CombatHandler:47: attempt to index nil with \'Humanoid\'" — happens when a player attacks an NPC that was just destroyed. The NPC is stored in a table by Instance reference. Here is the relevant code: [paste code]. How do I fix the nil reference without breaking the combat flow?',
      },
    ],
    tips: [
      'Always paste the exact error message and line number',
      'Include the relevant code around the error, not just the single line',
      'Mention what triggers the error (timing, specific actions, edge cases)',
    ],
  },
]

const GENERAL_TIPS = [
  {
    title: 'Be specific, not vague',
    description:
      'Instead of "make a building", say "make a 3-story medieval tavern with a stone ground floor, timber upper floors, and a thatched roof, 40x30x45 studs." The AI fills in gaps with generic defaults — your specificity is what makes the output unique.',
  },
  {
    title: 'Mention the player experience',
    description:
      'Tell the AI how many players, what platform (mobile/PC), and what the player should feel. "A cozy cabin for 2-4 players on mobile" produces very different output than "an epic fortress for 50 players on PC."',
  },
  {
    title: 'Use Roblox vocabulary',
    description:
      'The AI understands Roblox-specific terms: studs, Enum.Material, ScreenGui, RemoteEvent, DataStore, TweenService, CollectionService. Using them gets you more precise results than generic game-dev language.',
  },
  {
    title: 'Iterate, don\'t restart',
    description:
      'The AI remembers your conversation. Instead of starting over, say "make the mountain taller" or "add a shop to the village I just built." Building on previous context produces better results than repeating your full description.',
  },
  {
    title: 'Ask for what you need, skip what you don\'t',
    description:
      'If you only need a script, don\'t describe terrain. If you only need terrain, don\'t describe UI. Focused prompts get focused results. The auto-detect system routes your prompt to the right agent.',
  },
  {
    title: 'Describe the "why" for better systems',
    description:
      'Saying "I need an inventory system because players collect crafting materials from 3 biomes" gives the AI enough context to design the data structure correctly. The "why" informs architecture decisions the AI can\'t guess from the "what" alone.',
  },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PromptGuidePage() {
  return (
    <div className="min-h-screen text-white" style={{ background: '#050810' }}>

      {/* Hero */}
      <section
        className="relative overflow-hidden border-b px-6 pb-24 pt-32 text-center"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#050810' }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(212,175,55,0.10) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 mx-auto max-w-3xl">
          <p
            className="reveal mb-4 text-[12px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: 'rgba(212,175,55,0.6)' }}
          >
            Prompt Guide
          </p>
          <h1
            className="reveal mb-6 font-bold tracking-tight"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.1, color: '#FAFAFA' }}
          >
            Get the best results from{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #C8962A 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ForjeGames AI
            </span>
          </h1>
          <p className="reveal mx-auto max-w-xl text-base leading-relaxed" style={{ color: '#71717A' }}>
            ForjeGames has 9 specialized AI modes that auto-detect your intent. Learn how to write
            prompts that produce exactly what you want — from terrain to scripts to full games.
          </p>
        </div>
      </section>

      {/* General Tips */}
      <section className="border-b px-6 py-20" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <p
              className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'rgba(212,175,55,0.6)' }}
            >
              Fundamentals
            </p>
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#FAFAFA' }}>
              6 rules for better prompts
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {GENERAL_TIPS.map((tip) => (
              <div
                key={tip.title}
                className="reveal rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <h3 className="mb-2 text-base font-semibold" style={{ color: '#FAFAFA' }}>
                  {tip.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#71717A' }}>
                  {tip.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mode-by-mode guide */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <p
              className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'rgba(212,175,55,0.6)' }}
            >
              9 AI Modes
            </p>
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#FAFAFA' }}>
              Mode-by-mode prompt guide
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed" style={{ color: '#71717A' }}>
              Each mode has a specialized agent with its own system prompt and expertise. The
              orchestrator auto-detects which mode to use, but you can steer it with the right keywords.
            </p>
          </div>

          <div className="flex flex-col gap-16">
            {MODES.map((mode) => (
              <div key={mode.name} className="reveal">
                {/* Mode header */}
                <div className="mb-6 flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                    style={{ background: mode.bg, color: mode.color, border: `1px solid ${mode.color}33` }}
                  >
                    {mode.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: '#FAFAFA' }}>
                      {mode.name}
                    </h3>
                    <p className="text-xs" style={{ color: mode.color }}>
                      {mode.tagline}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="mb-6 text-sm leading-relaxed" style={{ color: '#71717A' }}>
                  {mode.description}
                </p>

                {/* Before / After examples */}
                <div className="mb-6 flex flex-col gap-4">
                  {mode.examples.map((ex, i) => (
                    <div
                      key={i}
                      className="overflow-hidden rounded-xl"
                      style={{ border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      {/* Basic (before) */}
                      <div className="px-5 py-4" style={{ background: 'rgba(248,113,113,0.05)' }}>
                        <div className="mb-1.5 flex items-center gap-2">
                          <span
                            className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                            style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171' }}
                          >
                            Before
                          </span>
                          <span className="text-[11px] font-medium" style={{ color: '#52525B' }}>
                            Vague prompt
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: '#A1A1AA' }}>
                          &ldquo;{ex.basic}&rdquo;
                        </p>
                      </div>

                      {/* Enhanced (after) */}
                      <div
                        className="border-t px-5 py-4"
                        style={{
                          background: 'rgba(16,185,129,0.05)',
                          borderColor: 'rgba(255,255,255,0.05)',
                        }}
                      >
                        <div className="mb-1.5 flex items-center gap-2">
                          <span
                            className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                            style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
                          >
                            After
                          </span>
                          <span className="text-[11px] font-medium" style={{ color: '#52525B' }}>
                            Enhanced prompt
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: '#D4D4D8' }}>
                          &ldquo;{ex.enhanced}&rdquo;
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tips */}
                <div
                  className="rounded-xl px-5 py-4"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: mode.color }}>
                    Tips for {mode.name}
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {mode.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#71717A' }}>
                        <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full" style={{ background: mode.color }} />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How auto-detect works */}
      <section className="border-t px-6 py-20" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <p
              className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'rgba(212,175,55,0.6)' }}
            >
              Under the hood
            </p>
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: '#FAFAFA' }}>
              How auto-detect works
            </h2>
          </div>
          <div className="space-y-5 text-sm leading-relaxed" style={{ color: '#71717A' }}>
            <p>
              You do not need to pick a mode manually. ForjeGames uses a multi-signal intent
              classifier that scores your prompt against all 9 agents simultaneously:
            </p>
            <div
              className="rounded-xl px-5 py-4"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <ol className="flex flex-col gap-3">
                <li className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}
                  >
                    1
                  </span>
                  <span>
                    <strong style={{ color: '#FAFAFA' }}>Intent classification</strong> — your prompt
                    is scored against categories like &ldquo;building&rdquo;, &ldquo;script&rdquo;,
                    &ldquo;terrain&rdquo;, &ldquo;mesh&rdquo;, &ldquo;fullgame&rdquo;, and
                    &ldquo;general&rdquo;.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}
                  >
                    2
                  </span>
                  <span>
                    <strong style={{ color: '#FAFAFA' }}>Keyword matching</strong> — each agent has a
                    set of trigger keywords. Mentioning &ldquo;terrain&rdquo;, &ldquo;biome&rdquo;, or
                    &ldquo;mountain&rdquo; boosts the Terrain agent score.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}
                  >
                    3
                  </span>
                  <span>
                    <strong style={{ color: '#FAFAFA' }}>Complexity heuristic</strong> — longer,
                    more ambitious prompts (30+ words, phrases like &ldquo;full game&rdquo; or
                    &ldquo;complete&rdquo;) trigger the Think and Plan agents to run first.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}
                  >
                    4
                  </span>
                  <span>
                    <strong style={{ color: '#FAFAFA' }}>Agent chaining</strong> — up to 4 agents
                    run in sequence. Each agent reads the output of the previous ones, building on their
                    work instead of starting from scratch.
                  </span>
                </li>
              </ol>
            </div>
            <p>
              The result: you type naturally, and the right combination of agents activates
              automatically. A simple &ldquo;make me a sword&rdquo; routes to the 3D agent. A complex
              &ldquo;build me a complete RPG with crafting, quests, and 3 biomes&rdquo; triggers Think,
              Plan, Terrain, Script, and Build in sequence.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section
        className="relative overflow-hidden border-t px-6 py-24 text-center"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(212,175,55,0.07) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 mx-auto max-w-xl">
          <h2
            className="mb-4 font-bold tracking-tight"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', lineHeight: 1.1, color: '#FAFAFA' }}
          >
            Ready to build?
          </h2>
          <p className="mb-8 text-base" style={{ color: '#71717A' }}>
            Take these prompting techniques to the editor. Free to start, no credit card required.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold transition-opacity hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #D4AF37 100%)',
                color: '#09090b',
              }}
            >
              Start building free
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold transition-colors hover:text-white"
              style={{
                color: '#A1A1AA',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
