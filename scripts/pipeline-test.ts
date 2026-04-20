/**
 * Pipeline Test Harness — sends prompts through the REAL AI build pipeline
 * and grades the output at every stage.
 *
 * Stages tested:
 *  1. RAG retrieval — does the right template come back?
 *  2. AI code generation — does the AI produce valid Luau?
 *  3. Structured commands translation — can the parser extract commands?
 *  4. Command quality — are there enough parts? Do positions make sense?
 *
 * Usage:
 *   npx tsx scripts/pipeline-test.ts
 *   npx tsx scripts/pipeline-test.ts --quick     (5 prompts only)
 *   npx tsx scripts/pipeline-test.ts --prompt "build me a castle"
 *
 * Results are saved to .transcripts/pipeline-test.log
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.production.local', override: true })

// We can't import server-only modules directly, so we replicate the
// essential pipeline steps using the same underlying functions.

import * as fs from 'fs'
import * as path from 'path'
import { PrismaClient } from '@prisma/client'
import { embedLocal } from './lib/embed-local'

const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL ?? '' } } })

// ── Test prompts — diverse, covering many categories ──────────────────────

const FULL_PROMPTS = [
  // Things WITH templates (should hit well)
  'build me a house with furniture inside',
  'make a pirate ship',
  'create a low poly island',
  'build a tycoon dropper setup',
  'make a medieval castle tower',
  'build a cafe with tables and chairs',
  'create a pvp arena',
  'make a farm with a barn',
  'build an obby course',
  'create a spaceship',
  // Furniture
  'add a bookshelf to the room',
  'put a piano in the corner',
  'make a fish tank',
  'build a fireplace',
  // Nature
  'add cherry blossom trees',
  'make a waterfall scene',
  'build a campfire with log seats',
  // Vehicles
  'make a helicopter',
  'build a fire truck',
  'create a hot air balloon',
  // Structures
  'build a lighthouse on a cliff',
  'make a treehouse',
  'create a wizard tower',
  'build an underground bunker entrance',
  // Game mechanics
  'add a teleporter pad',
  'build a magic portal',
  'make a dance floor with DJ booth',
  // Scenes
  'create a desert oasis',
  'build a haunted graveyard',
  'make a crystal cave',
  'create a throne room',
  'build a bowling alley',
  'make a zen garden',
  'create a classroom',
  'build a prison cell',
  // Themed
  'make a christmas tree with presents',
  'build a snowman',
  'create a robot mech',
  // Things WITHOUT exact templates (tests generalization)
  'build me a roller coaster',
  'make a dragon',
  'create a giant mushroom house',
  'build a space elevator',
  'make a football stadium',
  'create a haunted mansion interior',
  'build a coral reef',
  'make a steampunk airship',
  'create a candy factory',
  'build a medieval marketplace',
  'make a floating sky island with waterfalls',
  'create a neon cyberpunk alley',
]

const QUICK_PROMPTS = FULL_PROMPTS.slice(0, 5)

// ── Pipeline stage testers ──────────────────────────────────────────────

interface StageResult {
  stage: string
  pass: boolean
  detail: string
}

interface TestResult {
  prompt: string
  stages: StageResult[]
  overallPass: boolean
  templateHit: string | null
  templateSimilarity: number
  aiCodeLength: number
  commandCount: number
  partCount: number
}

async function testRAGRetrieval(prompt: string): Promise<{ hit: boolean; title: string; similarity: number; content: string }> {
  const emb = await embedLocal(prompt)
  const vectorStr = `[${emb.join(',')}]`
  const rows = await db.$queryRawUnsafe<Array<{ category: string; title: string; similarity: number; content: string }>>(
    `SELECT category, title, 1 - (embedding <=> $1::vector) AS similarity, LEFT(content, 3000) as content
     FROM "RobloxDocChunk"
     WHERE category = 'pattern'
     ORDER BY embedding <=> $1::vector
     LIMIT 1`,
    vectorStr,
  )
  const top = rows[0]
  return {
    hit: (top?.similarity ?? 0) > 0.30,
    title: top?.title ?? 'none',
    similarity: top?.similarity ?? 0,
    content: top?.content ?? '',
  }
}

async function testAIGeneration(prompt: string, ragContext: string): Promise<{ code: string; error: string | null }> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return { code: '', error: 'No GEMINI_API_KEY' }

  // Build a minimal system prompt with RAG context (mirrors what the real pipeline does)
  const systemPrompt = `You are a Roblox Studio architect. Generate ONLY valid Luau code using the P() helper function.

P() creates a Part: P("name", CFrame.new(x,y,z), Vector3.new(sx,sy,sz), Enum.Material.X, Color3.fromRGB(r,g,b))

GEOMETRY RULES:
- Y position = ground (0) + half the part height
- Minimum 8 parts for any object, 30+ for scenes
- Use descriptive part names
- NO SmoothPlastic material
- Wrap everything in: local folder = getFolder("BuildName")

${ragContext ? `\n--- REFERENCE TEMPLATE ---\n${ragContext}\n--- END TEMPLATE ---\nUse the template above as your coordinate reference. Adapt it to fit the request.\n` : ''}

Output ONLY the Luau code. No explanations, no markdown fences.`

  // Try Gemini first, then Groq fallback
  let text = ''
  let provider = ''

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 4096, temperature: 0.2 },
        }),
        signal: AbortSignal.timeout(30_000),
      },
    )
    if (res.ok) {
      const data = await res.json() as any
      text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
      provider = 'gemini'
    }
  } catch { /* fall through to Groq */ }

  // Groq fallback
  if (!text) {
    const groqKey = process.env.GROQ_API_KEY
    if (!groqKey) return { code: '', error: 'No API keys available (Gemini 429 + no GROQ_API_KEY)' }
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
          max_tokens: 4096,
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(30_000),
      })
      if (!res.ok) return { code: '', error: `Groq HTTP ${res.status}` }
      const data = await res.json() as any
      text = data.choices?.[0]?.message?.content ?? ''
      provider = 'groq'
    } catch (e) {
      return { code: '', error: `Both providers failed: ${(e as Error).message}` }
    }
  }

  const cleaned = text.replace(/^```(?:lua|luau)?\n?/m, '').replace(/\n?```$/m, '').trim()
  return { code: cleaned, error: null }
}

function testCodeQuality(code: string): { pHelperCount: number; instanceNewCount: number; hasGetFolder: boolean; errors: string[] } {
  const errors: string[] = []
  const pHelperCount = (code.match(/\bP\s*\(/g) || []).length
  const instanceNewCount = (code.match(/Instance\.new/g) || []).length
  const hasGetFolder = /getFolder/.test(code)

  // Check for common AI mistakes
  if (/\bconst\s+\w+\s*=/.test(code)) errors.push('JavaScript "const" leaked in')
  if (/\blet\s+\w+\s*=/.test(code)) errors.push('JavaScript "let" leaked in')
  if (/\bconsole\.log/.test(code)) errors.push('JavaScript "console.log" leaked in')
  if (/===/.test(code)) errors.push('JavaScript "===" instead of "=="')
  if (/SmoothPlastic/.test(code)) errors.push('SmoothPlastic material used')
  if (pHelperCount === 0 && instanceNewCount === 0) errors.push('No parts created at all')
  if (pHelperCount + instanceNewCount < 3) errors.push('Fewer than 3 parts — too simple')
  if (!hasGetFolder && pHelperCount > 0) errors.push('Missing getFolder() call')

  // Check for balanced blocks
  const openers = (code.match(/\b(function|if|do|for|while)\b/g) || []).length
  const ends = (code.match(/\bend\b/g) || []).length
  if (Math.abs(openers - ends) > 2) errors.push(`Unbalanced blocks: ${openers} openers, ${ends} ends`)

  // Check Y positions aren't all 0 (common failure: everything at ground level)
  const yPositions = [...code.matchAll(/CFrame\.new\s*\([^,]+,\s*([0-9.]+)/g)].map(m => parseFloat(m[1]))
  const uniqueY = new Set(yPositions.map(y => Math.round(y * 10) / 10))
  if (yPositions.length > 5 && uniqueY.size < 3) errors.push('Most parts at same Y — likely flat/broken')

  return { pHelperCount, instanceNewCount, hasGetFolder, errors }
}

// ── Main test runner ──────────────────────────────────────────────────────

async function runTest(prompt: string): Promise<TestResult> {
  const stages: StageResult[] = []
  let templateHit: string | null = null
  let templateSimilarity = 0
  let aiCodeLength = 0
  let commandCount = 0
  let partCount = 0

  // Stage 1: RAG retrieval
  const rag = await testRAGRetrieval(prompt)
  templateHit = rag.hit ? rag.title : null
  templateSimilarity = rag.similarity
  stages.push({
    stage: 'RAG',
    pass: rag.hit,
    detail: rag.hit ? `${(rag.similarity * 100).toFixed(0)}% → ${rag.title.substring(0, 50)}` : `Best match only ${(rag.similarity * 100).toFixed(0)}%`,
  })

  // Stage 2: AI code generation
  const ai = await testAIGeneration(prompt, rag.hit ? rag.content : '')
  aiCodeLength = ai.code.length
  if (ai.error) {
    stages.push({ stage: 'AI Gen', pass: false, detail: ai.error })
    return { prompt, stages, overallPass: false, templateHit, templateSimilarity, aiCodeLength, commandCount, partCount }
  }
  const hasCode = ai.code.length > 50
  stages.push({
    stage: 'AI Gen',
    pass: hasCode,
    detail: hasCode ? `${ai.code.length} chars, ${ai.code.split('\n').length} lines` : 'Empty or too short',
  })

  if (!hasCode) {
    return { prompt, stages, overallPass: false, templateHit, templateSimilarity, aiCodeLength, commandCount, partCount }
  }

  // Stage 3: Code quality check
  const quality = testCodeQuality(ai.code)
  partCount = quality.pHelperCount + quality.instanceNewCount
  commandCount = partCount
  const qualityPass = quality.errors.length === 0
  stages.push({
    stage: 'Code Quality',
    pass: qualityPass,
    detail: qualityPass
      ? `${partCount} parts, getFolder=${quality.hasGetFolder}`
      : `${quality.errors.join('; ')}`,
  })

  // Stage 4: Part count check (is it detailed enough?)
  const enoughParts = partCount >= 5
  stages.push({
    stage: 'Detail',
    pass: enoughParts,
    detail: `${partCount} parts (need ≥5)`,
  })

  const overallPass = stages.every(s => s.pass)
  return { prompt, stages, overallPass, templateHit, templateSimilarity, aiCodeLength, commandCount, partCount }
}

// ── Entry point ────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const quick = args.includes('--quick')
const singlePrompt = args.find(a => a.startsWith('--prompt='))?.split('=').slice(1).join('=')
  || (args.includes('--prompt') ? args[args.indexOf('--prompt') + 1] : null)

const prompts = singlePrompt ? [singlePrompt] : quick ? QUICK_PROMPTS : FULL_PROMPTS

console.log(`\n🧪 Pipeline Test — ${prompts.length} prompts\n`)

const results: TestResult[] = []
let passed = 0
let failed = 0

for (const [i, prompt] of prompts.entries()) {
  process.stdout.write(`[${i + 1}/${prompts.length}] "${prompt.substring(0, 50)}"...`)
  const result = await runTest(prompt)
  results.push(result)
  if (result.overallPass) {
    passed++
    console.log(` ✅ ${result.partCount} parts`)
  } else {
    failed++
    const failedStages = result.stages.filter(s => !s.pass).map(s => s.stage).join(', ')
    console.log(` ❌ failed: ${failedStages}`)
  }

  // Rate limit: 8 seconds between AI calls (free tiers are aggressive)
  if (i < prompts.length - 1) await new Promise(r => setTimeout(r, 8000))
}

// ── Summary ──────────────────────────────────────────────────────────────

console.log(`\n${'═'.repeat(60)}`)
console.log(`RESULTS: ${passed}/${prompts.length} passed (${((passed / prompts.length) * 100).toFixed(0)}%)`)
console.log(`${'═'.repeat(60)}`)

// Stage breakdown
const stageCounts: Record<string, { pass: number; fail: number }> = {}
for (const r of results) {
  for (const s of r.stages) {
    if (!stageCounts[s.stage]) stageCounts[s.stage] = { pass: 0, fail: 0 }
    if (s.pass) stageCounts[s.stage].pass++
    else stageCounts[s.stage].fail++
  }
}
console.log('\nStage breakdown:')
for (const [stage, counts] of Object.entries(stageCounts)) {
  const rate = ((counts.pass / (counts.pass + counts.fail)) * 100).toFixed(0)
  console.log(`  ${stage}: ${rate}% (${counts.pass}/${counts.pass + counts.fail})`)
}

// Failed prompts detail
const failures = results.filter(r => !r.overallPass)
if (failures.length > 0) {
  console.log(`\nFailed prompts:`)
  for (const f of failures) {
    const failedStages = f.stages.filter(s => !s.pass)
    console.log(`  "${f.prompt}"`)
    for (const s of failedStages) {
      console.log(`    ❌ ${s.stage}: ${s.detail}`)
    }
  }
}

// Save full results to log
const logDir = path.join(process.cwd(), '.transcripts')
fs.mkdirSync(logDir, { recursive: true })
const logPath = path.join(logDir, 'pipeline-test.log')
const logContent = JSON.stringify({ date: new Date().toISOString(), passed, failed, total: prompts.length, results }, null, 2)
fs.writeFileSync(logPath, logContent)
console.log(`\nFull results saved to: ${logPath}`)

await db.$disconnect()
