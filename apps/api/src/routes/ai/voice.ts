/**
 * POST /api/ai/voice-to-game
 * Deepgram transcription → Claude intent parsing → structured game commands
 * Target: <2 second end-to-end response
 */

import { Hono } from 'hono'
import { requireAuth } from '../../middleware/auth'
import { aiRateLimit } from '../../middleware/security'
import { transcribeAudio } from '../../lib/ai/providers/deepgram'
import { claudeChat } from '../../lib/ai/providers/anthropic'
import { anthropicBreaker, deepgramBreaker } from '../../lib/ai/circuit-breaker'
import { buildCacheKey, withCache } from '../../lib/ai/cache'
import { estimateCost, usdToTokens } from '../../lib/ai/cost-estimator'
import { validateTranscript, validateAIResponse } from '../../lib/ai/quality-gate'
import { db } from '../../lib/db'
import { createLogger } from '../../lib/logger'
import { incrementCounter, recordDuration } from '../../lib/metrics'

const log = createLogger('ai:voice')

// Import spendTokens from the shared lib (path from apps/api into src/)
// We re-import db and implement inline to avoid cross-package import complexity
async function spendTokens(userId: string, amount: number, description: string) {
  return db.$transaction(async (tx) => {
    const current = await tx.tokenBalance.findUnique({ where: { userId } })
    if (!current) throw new Error('Token balance not found')
    if (current.balance < amount) throw new Error('Insufficient token balance')
    const balance = await tx.tokenBalance.update({
      where: { userId },
      data: { balance: { decrement: amount }, lifetimeSpent: { increment: amount } },
    })
    await tx.tokenTransaction.create({
      data: {
        balanceId: balance.id,
        type: 'SPEND',
        amount: -amount,
        description,
        metadata: {} as never,
      },
    })
    return balance
  })
}

export const voiceRoutes = new Hono()

voiceRoutes.use('*', requireAuth)
voiceRoutes.use('*', aiRateLimit)

const VOICE_SYSTEM_PROMPT = `You are a Roblox game command interpreter. Parse natural language into structured game commands.

Output ONLY valid JSON with this structure:
{
  "intent": "build" | "modify" | "delete" | "query" | "navigate" | "generate" | "unknown",
  "confidence": 0.0-1.0,
  "commands": [
    {
      "type": "string (e.g. place_terrain, spawn_asset, change_biome, set_lighting)",
      "target": "string (what to act on)",
      "action": "string (what to do)",
      "parameters": {}
    }
  ],
  "rawIntent": "brief description of what user wants",
  "requiresConfirmation": boolean
}

Examples:
- "add a forest to the north" → build intent, place_terrain command
- "make it night time" → modify intent, set_lighting command
- "delete all trees" → delete intent with requiresConfirmation: true`

/**
 * POST /api/ai/voice-to-game
 * Body: multipart (audio file) OR JSON { text: string }
 * Returns: { transcript, commands, tokens_spent, duration_ms }
 */
voiceRoutes.post('/', async (c) => {
  const start = Date.now()
  const userId = c.get('userId') as string
  const requestId = c.get('requestId') as string | undefined
  const reqLog = log.child({ requestId, userId })
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  reqLog.info('ai voice-to-game request started')
  incrementCounter('ai_requests_total', { mode: 'voice-to-game', status: 'started' })

  const contentType = c.req.header('content-type') ?? ''
  let transcript = ''
  let transcriptConfidence = 1.0
  let transcriptCostUsd = 0
  let transcriptDurationMs = 0

  // --- Step 1: Get transcript ---
  if (contentType.includes('multipart/form-data')) {
    // Audio file upload
    const formData = await c.req.formData()
    const audioFile = formData.get('audio') as File | null
    if (!audioFile) {
      return c.json({ error: 'Missing audio file in form data' }, 400)
    }

    const audioBuffer = Buffer.from(await audioFile.arrayBuffer())
    const mimeType = audioFile.type || 'audio/wav'

    reqLog.debug('ai voice-to-game: calling deepgram transcription', { mimeType, sizeBytes: audioBuffer.length })
    try {
      const result = await deepgramBreaker.execute(() =>
        transcribeAudio(audioBuffer, { mimeType })
      )
      transcript = result.transcript
      transcriptConfidence = result.confidence
      transcriptCostUsd = result.costUsd
      transcriptDurationMs = result.durationMs
      reqLog.debug('ai voice-to-game: transcription complete', { confidence: transcriptConfidence, transcriptDurationMs })

      // Quality gate on transcript
      const transcriptGate = validateTranscript(transcript, transcriptConfidence)
      if (transcriptGate.status === 'FAIL') {
        reqLog.warn('ai voice-to-game: transcript quality gate failed', { reasons: transcriptGate.failReasons, confidence: transcriptConfidence })
        incrementCounter('ai_requests_total', { mode: 'voice-to-game', status: 'quality_fail' })
        return c.json({
          error: 'Audio transcription quality too low',
          reasons: transcriptGate.failReasons,
          confidence: transcriptConfidence,
        }, 422)
      }
    } catch (err) {
      const durationMs = Date.now() - start
      reqLog.error('ai voice-to-game: transcription failed', { durationMs, error: err instanceof Error ? err.message : String(err) })
      incrementCounter('ai_requests_total', { mode: 'voice-to-game', status: 'transcription_error' })
      recordDuration('ai_request_duration_ms', durationMs, { mode: 'voice-to-game', status: 'error' })
      return c.json({
        error: 'Transcription failed',
        detail: err instanceof Error ? err.message : String(err),
      }, 502)
    }
  } else {
    // JSON body with text
    const body = await c.req.json<{ text?: string }>().catch(() => ({}))
    if (!body.text?.trim()) {
      return c.json({ error: 'Provide audio file (multipart) or text in JSON body' }, 400)
    }
    transcript = body.text.trim()
    reqLog.debug('ai voice-to-game: using text input', { transcriptLength: transcript.length })
  }

  // --- Step 2: Estimate cost ---
  const estimate = estimateCost('voice-to-game')
  const totalCostUsd = transcriptCostUsd + 0.002 // Claude intent parsing
  const tokensToSpend = usdToTokens(totalCostUsd)

  // Check balance before execution
  const balance = await db.tokenBalance.findUnique({ where: { userId } })
  if (!balance || balance.balance < tokensToSpend) {
    reqLog.warn('ai voice-to-game: insufficient tokens', { required: tokensToSpend, available: balance?.balance ?? 0 })
    incrementCounter('ai_requests_total', { mode: 'voice-to-game', status: 'insufficient_tokens' })
    return c.json({
      error: 'Insufficient tokens',
      required: tokensToSpend,
      available: balance?.balance ?? 0,
      estimate: estimate.summary,
    }, 402)
  }

  // --- Step 3: Claude intent parsing ---
  const cacheKey = buildCacheKey('claude', 'intent-parse', transcript.toLowerCase().trim())
  let commandsJson = ''
  let claudeCostUsd = 0

  try {
    reqLog.debug('ai voice-to-game: parsing intent with claude')
    const { result: intentResult, fromCache } = await withCache(cacheKey, () =>
      anthropicBreaker.execute(() =>
        claudeChat(
          [{ role: 'user', content: `Parse this game command: "${transcript}"` }],
          { systemPrompt: VOICE_SYSTEM_PROMPT, maxTokens: 1000 }
        )
      )
    )

    commandsJson = intentResult.content
    claudeCostUsd = fromCache ? 0 : intentResult.costUsd

    if (fromCache) {
      reqLog.debug('ai voice-to-game: intent cache hit')
      incrementCounter('ai_cache_hits_total', { provider: 'claude', type: 'voice-intent' })
    } else {
      incrementCounter('ai_cache_misses_total', { provider: 'claude', type: 'voice-intent' })
    }
  } catch (err) {
    const durationMs = Date.now() - start
    reqLog.error('ai voice-to-game: intent parsing failed', { durationMs, error: err instanceof Error ? err.message : String(err) })
    incrementCounter('ai_requests_total', { mode: 'voice-to-game', status: 'intent_error' })
    recordDuration('ai_request_duration_ms', durationMs, { mode: 'voice-to-game', status: 'error' })
    return c.json({
      error: 'Intent parsing failed',
      detail: err instanceof Error ? err.message : String(err),
      transcript,
    }, 502)
  }

  // --- Step 4: Validate response ---
  const gate = validateAIResponse(commandsJson, 'commands')
  if (gate.status === 'FAIL') {
    reqLog.warn('ai voice-to-game: commands quality gate failed, using fallback', { reasons: gate.failReasons })
    // Try to use raw response as fallback
    commandsJson = JSON.stringify({
      intent: 'unknown',
      confidence: 0.5,
      commands: [],
      rawIntent: transcript,
      requiresConfirmation: true,
    })
  }

  // Parse commands
  let commands: unknown
  try {
    // Strip markdown code blocks if present
    const clean = commandsJson.replace(/```(?:json)?\s*([\s\S]+?)```/g, '$1').trim()
    commands = JSON.parse(clean)
  } catch {
    commands = {
      intent: 'unknown',
      confidence: 0,
      commands: [],
      rawIntent: transcript,
      requiresConfirmation: true,
    }
  }

  // --- Step 5: Deduct tokens ---
  const actualTokens = usdToTokens(transcriptCostUsd + claudeCostUsd)
  await spendTokens(userId, actualTokens, `voice-to-game: "${transcript.slice(0, 50)}"`)

  const durationMs = Date.now() - start
  reqLog.info('ai voice-to-game: completed', {
    durationMs,
    tokensSpent: actualTokens,
    transcriptConfidence,
    cached: claudeCostUsd === 0,
  })
  incrementCounter('ai_requests_total', { mode: 'voice-to-game', status: 'success' })
  recordDuration('ai_request_duration_ms', durationMs, { mode: 'voice-to-game', status: 'success' })

  return c.json({
    transcript,
    transcriptConfidence,
    commands,
    estimate: estimate.summary,
    tokens_spent: actualTokens,
    duration_ms: durationMs,
    transcript_duration_ms: transcriptDurationMs,
    cached: claudeCostUsd === 0,
  })
})

/**
 * GET /api/ai/voice-to-game/estimate
 * Returns cost estimate for a voice command without executing
 */
voiceRoutes.get('/estimate', async (c) => {
  const estimate = estimateCost('voice-to-game')
  return c.json({
    estimate: estimate.summary,
    breakdown: estimate.breakdown,
    totalUsd: estimate.totalUsd,
    totalTokens: estimate.totalTokens,
  })
})
