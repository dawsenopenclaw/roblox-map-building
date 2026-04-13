import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Groq from 'groq-sdk'

// ─── Types ──────────────────────────────────────────────────────────────────

interface EnhancedAsset {
  name: string
  subPrompt: string
}

interface EnhancedPlan {
  assetCount: number
  assets: EnhancedAsset[]
  styleDirective?: string
}

interface EnhancePromptResponse {
  enhancedPrompt: string
  plan: EnhancedPlan
}

type PromptMode = 'build' | 'image' | 'script' | 'terrain' | 'idea'

// ─── Mode-specific system prompts ───────────────────────────────────────────

const MODE_SYSTEM_PROMPTS: Record<PromptMode, string> = {
  build: `You are a Roblox Studio build planner. Given a user's prompt, rewrite it to be
detailed and actionable for a code-generating AI. Count every Part, Model, and Script needed.

Respond ONLY with valid JSON matching this schema:
{
  "enhancedPrompt": "Richly detailed rewrite of the user's request with exact counts, names, positions, materials, and sizes",
  "plan": {
    "assetCount": 5,
    "assets": [
      { "name": "SpawnPlatform", "subPrompt": "200x200 stud baseplate at Y=0 with Grass material, BrickColor Bright green" },
      { "name": "MainTower", "subPrompt": "40x40x80 stud tower at (0,40,0) with SmoothPlastic Concrete material, 4 windows per face" }
    ],
    "styleDirective": "Low-poly Roblox aesthetic. SmoothPlastic and Concrete materials. Bright saturated palette: royal blue (#4169E1), emerald (#50C878), gold (#FFD700). PointLight on key fixtures, Ambient 80,80,90."
  }
}

Guidelines:
- Name every Part/Model/Script the build requires (be specific: "OakTree_01" not "tree")
- Estimate positions in studs relative to world origin
- Include a build checklist in the enhancedPrompt (numbered steps)
- styleDirective should specify materials, colors (hex), lighting, and overall aesthetic
- Keep assetCount accurate to the assets array length`,

  image: `You are a Roblox asset image prompt engineer. Given a user's request, determine how
many individual image assets are needed, name each one, write an optimized sub-prompt for each,
and create a unified style directive.

Respond ONLY with valid JSON matching this schema:
{
  "enhancedPrompt": "Detailed master prompt covering all assets with consistent style direction",
  "plan": {
    "assetCount": 3,
    "assets": [
      { "name": "VillageHouse_Icon", "subPrompt": "Isometric view of a cozy medieval cottage, thatched roof, warm lantern glow from windows, Roblox low-poly style, soft evening lighting, 512x512" },
      { "name": "VillageTree_Decal", "subPrompt": "Stylized oak tree with rounded canopy, autumn orange leaves, clean vector edges, transparent background, Roblox decal style" }
    ],
    "styleDirective": "Roblox-native low-poly aesthetic. Color palette: warm earth tones (#8B4513, #DEB887, #228B22). Soft directional lighting from top-left. Clean edges, no anti-aliasing artifacts. Consistent 512x512 output."
  }
}

Guidelines:
- Identify every distinct image asset the user needs (icons, decals, textures, thumbnails)
- Each sub-prompt should be self-contained and generate one image
- styleDirective must include: color palette (3-5 hex colors), lighting direction, Roblox aesthetic notes
- Add resolution and format hints to each sub-prompt
- enhancedPrompt should tie all assets together with a cohesive visual direction`,

  script: `You are a Roblox Luau scripting architect. Given a user's request, plan the complete
script architecture: which Roblox services are needed, what modules to create, and what functions
each module exposes.

Respond ONLY with valid JSON matching this schema:
{
  "enhancedPrompt": "Detailed technical specification with service requirements, module structure, and function signatures",
  "plan": {
    "assetCount": 4,
    "assets": [
      { "name": "DataManager (ModuleScript)", "subPrompt": "ModuleScript in ServerScriptService. Uses DataStoreService and Players. Functions: loadPlayerData(player), savePlayerData(player), getLeaderboard(limit). Uses ProfileService pattern with session locking." },
      { "name": "GameLoop (Script)", "subPrompt": "Server Script in ServerScriptService. Uses RunService.Heartbeat. Manages round timer, spawn waves, score tracking. Fires RemoteEvents to clients for UI updates." }
    ],
    "styleDirective": "Clean Luau with type annotations. Follow Roblox community style guide. Prefer ModuleScripts over monolithic scripts. Use Promises for async operations. Add comments for complex logic blocks."
  }
}

Guidelines:
- Identify all Roblox services needed (DataStoreService, Players, ReplicatedStorage, etc.)
- List every Script, LocalScript, and ModuleScript with their container (ServerScriptService, StarterPlayerScripts, etc.)
- Each asset's subPrompt should list the functions/methods and their signatures
- Note Remote Events/Functions needed for client-server communication
- styleDirective should cover coding conventions and patterns`,

  terrain: `You are a Roblox terrain designer. Given a user's request, plan the complete terrain
layout: biomes, materials, elevation profiles, water features, and vegetation placement.

Respond ONLY with valid JSON matching this schema:
{
  "enhancedPrompt": "Detailed terrain specification with biome boundaries, height maps, material assignments, and feature placement",
  "plan": {
    "assetCount": 5,
    "assets": [
      { "name": "MountainBiome_North", "subPrompt": "Northern mountain range spanning X:-500 to X:500, Z:-1000 to Z:-600. Peak height Y=300. Materials: Rock (peaks), Ground (mid), Grass (base). Steep 60-degree slopes with cliff faces." },
      { "name": "RiverChannel_Central", "subPrompt": "Meandering river from Z:-800 to Z:800 following X=0 center. Width 40 studs, depth 8 studs below terrain. Water plane at Y=2. Sand material banks, Mud material riverbed." }
    ],
    "styleDirective": "Natural terrain with smooth transitions between biomes. Height range Y=0 to Y=300. Water plane at Y=2 with Foam enabled. Terrain resolution 4 studs/cell. Materials: Grass, Rock, Sand, Mud, Snow, Ground, Slate. Atmosphere: ViewDistance 1000, Haze 2."
  }
}

Guidelines:
- Identify distinct biomes/regions with coordinate boundaries
- Specify height profiles (min/max elevation, slope angles)
- List terrain materials for each zone (Roblox Terrain materials only)
- Plan water placement: rivers, lakes, oceans with exact water plane heights
- Include atmosphere/lighting settings in styleDirective
- Note vegetation and prop placement zones`,

  idea: `You are a senior Roblox game design consultant, market analyst, and growth hacker who has helped ship multiple top-100 Roblox experiences. Given a user's game idea (even if vague), enhance it into a comprehensive, actionable game concept document that rivals what professional game studios produce.

Respond ONLY with valid JSON matching this schema:
{
  "enhancedPrompt": "Comprehensive viral game concept document: game title, one-line hook, 2-3 sentence pitch, genre classification, the unique selling point, detailed core gameplay loop (micro/session/meta), mechanics list, full monetization plan, viral hooks, target demographic, trend analysis, competitive landscape, retention strategy, social features, and development roadmap.",
  "plan": {
    "assetCount": 7,
    "assets": [
      { "name": "CoreGameLoop", "subPrompt": "MICRO-LOOP (30s): [specific action]. SESSION LOOP (5-15min): [progression cycle]. META-LOOP (days/weeks): [long-term goals]. Session target: 15-20 minutes. Core hook: [what makes the loop addictive]." },
      { "name": "UniqueSellingPoint", "subPrompt": "The ONE thing that makes this different: [specific differentiator]. Why no one else has done this: [gap analysis]. How it shows up in gameplay: [concrete example]." },
      { "name": "MonetizationPlan", "subPrompt": "GAMEPASSES: [Name] ([price]R$) - [what it does], [Name] ([price]R$) - [what it does], [Name] ([price]R$) - [what it does]. DEVPRODUCTS: [Name] ([price]R$) - [consumable], [Name] ([price]R$) - [consumable]. PHILOSOPHY: Free-to-play friendly, passes accelerate but never gate content." },
      { "name": "ViralStrategy", "subPrompt": "SCREENSHOT MOMENTS: [2-3 specific shareable moments]. STREAM HOOKS: [what makes this watchable]. TIKTOK CLIPS: [15-second clip ideas]. SOCIAL DRAMA: [organic conflict/trading/competition that generates content]." },
      { "name": "TrendAlignment", "subPrompt": "CAPITALIZES ON: [2-3 specific 2026 Roblox trends]. TRENDING SCORE: [X/100]. SIMILAR SUCCESSFUL GAMES: [2-4 real Roblox games that prove this market]. COMPETITION LEVEL: [low/medium/high/saturated]." },
      { "name": "RetentionMechanics", "subPrompt": "DAILY: [login rewards, daily challenges]. WEEKLY: [seasonal events, tournaments]. FOMO: [limited-time items, expiring content]. SOCIAL: [guilds, trading, leaderboards]. PROGRESSION: [prestige/rebirth system, unlockable areas]." },
      { "name": "DevelopmentRoadmap", "subPrompt": "MVP (Week 1-2): [core loop + basic monetization]. ALPHA (Week 3-4): [social features + first content drop]. BETA (Week 5-6): [polish + retention systems]. LAUNCH: [marketing push + influencer outreach]. POST-LAUNCH: [seasonal content cadence]." }
    ],
    "styleDirective": "Target audience: [age range] [platform]. Visual style: [art direction]. UI: [design principles — large mobile touch targets, satisfying feedback]. Audio: [SFX philosophy — juicy sounds on every interaction]. Performance: [mobile optimization requirements]."
  }
}

Guidelines:
- Transform even vague ideas ("make me a fun game") into specific, buildable concepts
- Reference current 2026 Roblox trending patterns: pet/merge systems, anime TD + gacha, fashion/social, horror chapters with ARG, UGC creation, idle/AFK hybrid, trading economies
- Include SPECIFIC monetization with Robux prices (GamePasses: 99-999R$, DevProducts: 19-199R$)
- Analyze competitive landscape with REAL Roblox game names that prove the market
- Include a trending score (1-100) reflecting alignment with current trends
- Plan retention mechanics that drive daily active users (DAU)
- Plan social features that drive organic growth and content creation
- Include a realistic development roadmap with milestones
- styleDirective must cover: target age + platform, art direction, UI/UX principles, audio design, mobile optimization
- The enhancedPrompt should read like a pitch deck — exciting, specific, and actionable`,
}

// ─── Groq model cascade ─────────────────────────────────────────────────────

const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'llama-3.1-8b-instant',
]

async function callGroqEnhance(
  systemPrompt: string,
  userPrompt: string,
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return null

  const groq = new Groq({ apiKey })

  for (const model of GROQ_MODELS) {
    try {
      const response = await groq.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      })

      const text = response.choices[0]?.message?.content ?? null
      if (text) {
        console.log(`[enhance-prompt] ${model} responded (${text.length} chars)`)
        return text
      }
      console.warn(`[enhance-prompt] ${model} empty response`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('rate_limit') || msg.includes('429')) {
        console.warn(`[enhance-prompt] ${model} rate limited, trying next...`)
        continue
      }
      if (msg.includes('decommissioned')) continue
      console.error(`[enhance-prompt] ${model} error:`, msg)
    }
  }

  console.error('[enhance-prompt] All Groq models exhausted')
  return null
}

// ─── Fallback when Groq is unavailable ──────────────────────────────────────

function buildFallback(prompt: string): EnhancePromptResponse {
  return {
    enhancedPrompt: prompt,
    plan: {
      assetCount: 1,
      assets: [{ name: 'MainAsset', subPrompt: prompt }],
      styleDirective: 'Use clean Roblox aesthetics with SmoothPlastic materials and bright colors.',
    },
  }
}

// ─── Parse and validate the Groq JSON response ─────────────────────────────

function parseGroqResponse(raw: string, originalPrompt: string): EnhancePromptResponse {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>

    const enhancedPrompt =
      typeof parsed.enhancedPrompt === 'string' && parsed.enhancedPrompt.length > 0
        ? parsed.enhancedPrompt
        : originalPrompt

    const rawPlan = (typeof parsed.plan === 'object' && parsed.plan !== null
      ? parsed.plan
      : {}) as Record<string, unknown>

    const rawAssets = Array.isArray(rawPlan.assets) ? rawPlan.assets : []
    const assets: EnhancedAsset[] = rawAssets
      .filter((a: unknown): a is Record<string, unknown> => typeof a === 'object' && a !== null)
      .map((a) => ({
        name: typeof a.name === 'string' ? a.name : 'Unnamed',
        subPrompt: typeof a.subPrompt === 'string' ? a.subPrompt : '',
      }))

    const assetCount =
      typeof rawPlan.assetCount === 'number' ? rawPlan.assetCount : assets.length

    const styleDirective =
      typeof rawPlan.styleDirective === 'string' ? rawPlan.styleDirective : undefined

    return {
      enhancedPrompt,
      plan: { assetCount, assets, styleDirective },
    }
  } catch {
    console.warn('[enhance-prompt] Failed to parse Groq JSON, using fallback')
    return buildFallback(originalPrompt)
  }
}

// ─── Resolve mode string to a valid PromptMode ─────────────────────────────

const VALID_MODES = new Set<PromptMode>(['build', 'image', 'script', 'terrain', 'idea'])

function resolveMode(raw: unknown): PromptMode {
  if (typeof raw === 'string' && VALID_MODES.has(raw as PromptMode)) {
    return raw as PromptMode
  }
  // Map related modes to the closest match
  if (raw === 'mesh' || raw === 'plan' || raw === 'think') return 'build'
  if (raw === 'debug') return 'script'
  return 'build'
}

// ─── POST handler ───────────────────────────────────────────────────────────

/**
 * POST /api/ai/enhance-prompt
 *
 * FREE prompt enhancement endpoint. Uses Groq (Llama 3.3 70B) to rewrite
 * the user's prompt with mode-specific detail: asset counts, sub-prompts,
 * style directives, and structured plans.
 *
 * This runs BEFORE expensive AI generation and costs zero credits.
 *
 * Body: { prompt: string, mode: string }
 * Response: { enhancedPrompt: string, plan: { assetCount, assets, styleDirective? } }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const isDemo = process.env.DEMO_MODE === 'true'

  if (!isDemo) {
    let userId: string | null = null
    try {
      const session = await auth()
      userId = session?.userId ?? null
    } catch {
      // Clerk unavailable — allow through for dev
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 },
      )
    }
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: { prompt?: string; mode?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
  if (!prompt) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 422 })
  }
  if (prompt.length > 4000) {
    return NextResponse.json({ error: 'prompt exceeds 4000 characters' }, { status: 422 })
  }

  const mode = resolveMode(body.mode)

  // ── Call Groq with mode-specific system prompt ────────────────────────────
  const systemPrompt = MODE_SYSTEM_PROMPTS[mode]

  const raw = await callGroqEnhance(systemPrompt, prompt)
  if (!raw) {
    // Groq unavailable — return fallback so the pipeline continues
    return NextResponse.json(buildFallback(prompt))
  }

  const result = parseGroqResponse(raw, prompt)
  return NextResponse.json(result)
}
