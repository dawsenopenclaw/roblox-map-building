/**
 * Asset Director — AI-driven orchestration layer.
 *
 * Given a natural-language build prompt, the director:
 *   1. Detects every distinct asset the build should have (meshes, audio,
 *      textures, voice lines) by prompting an LLM for structured intents.
 *   2. Validates with Zod.
 *   3. Pre-checks the user's credit balance and prunes enhancement-priority
 *      intents if the budget would otherwise be blown.
 *   4. Fans out one generation job per intent to the dedicated pipelines
 *      (mesh-pipeline, audio-pipeline, and — TODO — texture-pipeline) in
 *      parallel via Promise.allSettled.
 *   5. Streams per-job progress via an optional callback and returns the
 *      aggregated result.
 *
 * This module is the "magic glue" layer: it contains NO generation logic of
 * its own. All the actual work (Meshy calls, Fal audio, Roblox upload) lives
 * behind the pipeline modules so they can be tested and scaled independently.
 *
 * DEPENDENCY NOTE — mesh-pipeline / audio-pipeline
 * ------------------------------------------------
 * This file imports from './mesh-pipeline' and './audio-pipeline', which are
 * being built by parallel agents. Those modules may not exist on disk at the
 * exact moment tsc runs against this file. We import them lazily inside the
 * dispatch functions (via dynamic `import()`), and we declare their module
 * shapes near the top of this file so the rest of the code stays type-safe
 * without needing the files to exist.
 */

import 'server-only'
import { z } from 'zod'
import { callAI } from '@/lib/ai/provider'
import { spendTokens, getTokenBalance } from '@/lib/tokens-server'
import { INTENT_DETECTION_SYSTEM_PROMPT } from '@/lib/asset-director-prompts'

// ── Types ─────────────────────────────────────────────────────────────────────

export type AssetIntentType = 'mesh' | 'music' | 'sfx' | 'voice' | 'texture'
export type AssetPriority = 'critical' | 'enhancement'

export interface AssetIntent {
  /** Which pipeline to route this intent to. */
  type: AssetIntentType
  /** Short specific description fed into the generator. */
  description: string
  /** Where the asset lives inside the build (for the planner / UI). */
  context: string
  /** Whether the build loses meaning without this asset. */
  priority: AssetPriority
}

export type AssetJobStatus = 'queued' | 'generating' | 'completed' | 'failed'

export interface AssetResult extends AssetIntent {
  status: AssetJobStatus
  /** Roblox asset id once the asset has been uploaded to Roblox. */
  assetId?: string
  /** Our internal DB id (GeneratedAsset.id) while the pipeline is running. */
  generatedAssetId?: string
  /** Failure reason — only set when status === 'failed'. */
  error?: string
}

export interface AssetDirectorResult {
  intents: AssetIntent[]
  results: AssetResult[]
  totalCreditsUsed: number
  durationMs: number
  /** Set when the director bailed out early (e.g. not enough credits). */
  earlyExitReason?: string
}

export interface AssetDirectorProgressEvent {
  intentIndex: number
  status: AssetJobStatus
  assetId?: string
  generatedAssetId?: string
  error?: string
}

export interface DirectBuildAssetsParams {
  prompt: string
  userId: string
  sessionId: string
  /** Optional override model name (currently unused — provider chain handles fallback). */
  model?: string
  /** Abort signal propagated to every downstream pipeline job. */
  signal?: AbortSignal
  /** Fires once for every job status transition so the UI can stream progress. */
  onProgress?: (event: AssetDirectorProgressEvent) => void
  /** Maximum total intents allowed. Defaults to 8. */
  maxIntents?: number
}

// ── Cost matrix ───────────────────────────────────────────────────────────────
// Token costs per intent type. Kept in sync with the cost matrix documented in
// docs/ASSET_DIRECTOR.md — update both places together.

export const ASSET_DIRECTOR_COSTS: Record<AssetIntentType, number> = {
  mesh:    50,
  music:   30,
  sfx:     10,
  voice:   15,
  texture: 20,
}

/** Hard cap on intents per build call regardless of what the LLM returns. */
export const DEFAULT_MAX_INTENTS = 8

// ── Zod schema for LLM output ─────────────────────────────────────────────────

const intentSchema = z.object({
  type: z.enum(['mesh', 'music', 'sfx', 'voice', 'texture']),
  description: z.string().trim().min(1).max(500),
  context: z.string().trim().min(1).max(500),
  priority: z.enum(['critical', 'enhancement']),
})

const intentListSchema = z.object({
  intents: z.array(intentSchema).max(32), // soft bound; we trim to maxIntents after
})

// ── Pipeline call shapes ──────────────────────────────────────────────────────
// The parallel pipeline agents guarantee these signatures. We redeclare them
// here as the dynamic-import contract so the dispatch layer is type-safe even
// before those files land on disk.

interface PipelineCallInput {
  prompt: string
  userId: string
  sessionId: string
  signal?: AbortSignal
  style?: string
}

interface PipelineCallResult {
  assetId?: string
  generatedAssetId?: string
  /**
   * Optional — if the pipeline reports an error rather than throwing, this
   * gets surfaced in the AssetResult.
   */
  error?: string
}

interface MeshPipelineModule {
  generateMeshFromPrompt: (input: PipelineCallInput) => Promise<PipelineCallResult>
}

interface AudioPipelineModule {
  generateMusic: (input: PipelineCallInput) => Promise<PipelineCallResult>
  generateSFX:   (input: PipelineCallInput) => Promise<PipelineCallResult>
  generateVoice: (input: PipelineCallInput) => Promise<PipelineCallResult>
}

// Cache dynamic imports so we don't re-hit the module loader for every job.
let meshPipelineModulePromise:  Promise<MeshPipelineModule>  | null = null
let audioPipelineModulePromise: Promise<AudioPipelineModule> | null = null

async function loadMeshPipeline(): Promise<MeshPipelineModule> {
  if (!meshPipelineModulePromise) {
    // Dynamic import keeps tsc happy if the module hasn't landed yet —
    // the type assertion aligns the unknown module shape with our contract.
    meshPipelineModulePromise = import('./mesh-pipeline' as string)
      .then((mod) => mod as unknown as MeshPipelineModule)
  }
  return meshPipelineModulePromise
}

async function loadAudioPipeline(): Promise<AudioPipelineModule> {
  if (!audioPipelineModulePromise) {
    audioPipelineModulePromise = import('./audio-pipeline' as string)
      .then((mod) => mod as unknown as AudioPipelineModule)
  }
  return audioPipelineModulePromise
}

// ── Step 1: Intent detection ──────────────────────────────────────────────────

/**
 * Calls the AI provider chain with the intent-detection prompt and parses
 * the structured response. Throws with a clear error if the model returned
 * malformed JSON so the caller can surface it to the user.
 */
export async function detectAssetIntents(
  prompt: string,
  opts: { maxIntents?: number } = {},
): Promise<AssetIntent[]> {
  const maxIntents = opts.maxIntents ?? DEFAULT_MAX_INTENTS

  // Use provider chain. jsonMode forces Gemini to return application/json;
  // Groq fallback ignores it but we strip markdown anyway for safety.
  const rawText = await callAI(
    INTENT_DETECTION_SYSTEM_PROMPT,
    [
      {
        role: 'user',
        content: `Build prompt:\n\n"""${prompt.slice(0, 2000)}"""\n\nReturn the JSON now.`,
      },
    ],
    {
      jsonMode: true,
      maxTokens: 1500,
      // Low temperature — we want deterministic classification, not creativity.
      temperature: 0.2,
    },
  )

  const jsonText = stripMarkdownFences(rawText)
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch (err) {
    throw new Error(
      `[asset-director] Intent detection returned invalid JSON: ${String(err)}. Raw: ${jsonText.slice(0, 200)}`,
    )
  }

  const validated = intentListSchema.safeParse(parsed)
  if (!validated.success) {
    const issues = validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new Error(`[asset-director] Intent JSON failed schema validation: ${issues}`)
  }

  // Enforce the hard cap even if the model ignored the system prompt.
  return validated.data.intents.slice(0, maxIntents)
}

function stripMarkdownFences(text: string): string {
  return text
    .replace(/^\s*```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim()
}

// ── Step 2: Credit gating ─────────────────────────────────────────────────────

export interface CreditGateResult {
  approvedIntents: AssetIntent[]
  droppedIntents: AssetIntent[]
  totalCost: number
  balance: number
  /** True if we didn't have room for even the critical intents. */
  insufficientForCritical: boolean
}

/**
 * Checks the user's current balance and drops enhancement-priority intents
 * in reverse order (cheapest cut first) until the remaining set fits. If
 * critical intents alone exceed the balance, returns insufficientForCritical.
 */
export async function gateIntentsByCredits(
  userId: string,
  intents: AssetIntent[],
): Promise<CreditGateResult> {
  const balanceRecord = await getTokenBalance(userId)
  const balance = balanceRecord?.balance ?? 0

  const costOf = (i: AssetIntent) => ASSET_DIRECTOR_COSTS[i.type]
  const sum = (list: AssetIntent[]) => list.reduce((acc, i) => acc + costOf(i), 0)

  // Preserve original order, but drop enhancements from the tail of the
  // enhancement sub-list first so we shed the most speculative work first.
  let approved = [...intents]
  const dropped: AssetIntent[] = []

  while (sum(approved) > balance) {
    // Find the last enhancement intent by original position and drop it.
    let dropIdx = -1
    for (let i = approved.length - 1; i >= 0; i--) {
      if (approved[i].priority === 'enhancement') {
        dropIdx = i
        break
      }
    }
    if (dropIdx === -1) break // no more enhancements to drop
    dropped.push(approved[dropIdx])
    approved = approved.slice(0, dropIdx).concat(approved.slice(dropIdx + 1))
  }

  const insufficientForCritical = sum(approved) > balance

  return {
    approvedIntents: approved,
    droppedIntents: dropped,
    totalCost: sum(approved),
    balance,
    insufficientForCritical,
  }
}

// ── Step 3: Dispatch a single intent ──────────────────────────────────────────

async function dispatchIntent(
  intent: AssetIntent,
  ctx: { userId: string; sessionId: string; signal?: AbortSignal },
): Promise<PipelineCallResult> {
  const input: PipelineCallInput = {
    prompt: intent.description,
    userId: ctx.userId,
    sessionId: ctx.sessionId,
    signal: ctx.signal,
  }

  switch (intent.type) {
    case 'mesh': {
      const mod = await loadMeshPipeline()
      return mod.generateMeshFromPrompt(input)
    }
    case 'music': {
      const mod = await loadAudioPipeline()
      return mod.generateMusic(input)
    }
    case 'sfx': {
      const mod = await loadAudioPipeline()
      return mod.generateSFX(input)
    }
    case 'voice': {
      const mod = await loadAudioPipeline()
      return mod.generateVoice(input)
    }
    case 'texture': {
      // TODO(asset-director): wire to texture-pipeline once it exists.
      // For now we fail gracefully so the rest of the fan-out completes.
      return { error: 'Texture pipeline not yet wired' }
    }
    default: {
      const _exhaustive: never = intent.type
      void _exhaustive
      return { error: `Unknown intent type: ${String(intent.type)}` }
    }
  }
}

// ── Public: directBuildAssets ─────────────────────────────────────────────────

/**
 * Full orchestration: detect → gate → fan out → aggregate.
 *
 * Throws only for catastrophic failures (bad auth, provider outage during
 * intent detection). Individual job failures are surfaced on the AssetResult
 * so the caller can decide whether to retry or ignore.
 */
export async function directBuildAssets(
  params: DirectBuildAssetsParams,
): Promise<AssetDirectorResult> {
  const startedAt = Date.now()
  const {
    prompt,
    userId,
    sessionId,
    signal,
    onProgress,
    maxIntents = DEFAULT_MAX_INTENTS,
  } = params

  // ── Step 1: intent detection ───────────────────────────────────────────────
  const intents = await detectAssetIntents(prompt, { maxIntents })

  if (intents.length === 0) {
    return {
      intents: [],
      results: [],
      totalCreditsUsed: 0,
      durationMs: Date.now() - startedAt,
      earlyExitReason: 'No asset intents detected for this prompt.',
    }
  }

  // ── Step 2: credit pre-check + enhancement pruning ─────────────────────────
  const gate = await gateIntentsByCredits(userId, intents)

  if (gate.insufficientForCritical) {
    return {
      intents,
      results: intents.map<AssetResult>((intent) => ({
        ...intent,
        status: 'failed',
        error: `Insufficient credits (have ${gate.balance}, need ${gate.totalCost}).`,
      })),
      totalCreditsUsed: 0,
      durationMs: Date.now() - startedAt,
      earlyExitReason:
        `Insufficient credits for even the critical intents. ` +
        `Have ${gate.balance}, need ${gate.totalCost}.`,
    }
  }

  const approved = gate.approvedIntents

  // Track approval by reference-identity against the original intents array
  // so duplicate (type, description) pairs survive deduping correctly.
  const approvedSet = new Set<AssetIntent>(approved)

  // Build the initial result rows so even dropped intents show up in the
  // returned list — the caller may want to render them as "skipped".
  const results: AssetResult[] = intents.map<AssetResult>((intent) => {
    const wasApproved = approvedSet.has(intent)
    return {
      ...intent,
      status: wasApproved ? 'queued' : 'failed',
      error: wasApproved ? undefined : 'Dropped — budget too tight for enhancement intents.',
    }
  })

  // Indices of approved intents inside `results` (preserves original order).
  const approvedIndices: number[] = []
  intents.forEach((intent, idx) => {
    if (approvedSet.has(intent)) approvedIndices.push(idx)
  })

  // ── Step 3: parallel fan-out ───────────────────────────────────────────────
  const emit = (event: AssetDirectorProgressEvent) => {
    try {
      onProgress?.(event)
    } catch (err) {
      // A bad progress callback should never take down the director.
      console.error('[asset-director] onProgress callback threw:', err)
    }
  }

  // Early abort path — if the caller aborted before we even started, short-
  // circuit everything and mark all approved jobs failed.
  if (signal?.aborted) {
    for (const idx of approvedIndices) {
      results[idx].status = 'failed'
      results[idx].error = 'Aborted before dispatch.'
      emit({ intentIndex: idx, status: 'failed', error: results[idx].error })
    }
    return {
      intents,
      results,
      totalCreditsUsed: 0,
      durationMs: Date.now() - startedAt,
      earlyExitReason: 'Aborted before any job was dispatched.',
    }
  }

  // Fan out. Each job emits "generating" immediately, then "completed" or
  // "failed" on settle. Promise.allSettled so one bad apple never blocks the
  // rest of the fan-out.
  const jobPromises = approvedIndices.map(async (idx) => {
    const intent = results[idx]
    results[idx].status = 'generating'
    emit({ intentIndex: idx, status: 'generating' })

    try {
      const out = await dispatchIntent(intent, { userId, sessionId, signal })

      if (out.error) {
        results[idx].status = 'failed'
        results[idx].error = out.error
        emit({ intentIndex: idx, status: 'failed', error: out.error })
        return
      }

      results[idx].status = 'completed'
      results[idx].assetId = out.assetId
      results[idx].generatedAssetId = out.generatedAssetId
      emit({
        intentIndex: idx,
        status: 'completed',
        assetId: out.assetId,
        generatedAssetId: out.generatedAssetId,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      results[idx].status = 'failed'
      results[idx].error = msg
      emit({ intentIndex: idx, status: 'failed', error: msg })
    }
  })

  await Promise.allSettled(jobPromises)

  // ── Step 4: spend credits for completed jobs only ──────────────────────────
  // Failed jobs are refunded implicitly (we never spent for them). We use a
  // single aggregated spend call so the user sees one row in their usage log.
  const completed = results.filter((r) => r.status === 'completed')
  const totalCreditsUsed = completed.reduce(
    (acc, r) => acc + ASSET_DIRECTOR_COSTS[r.type],
    0,
  )

  if (totalCreditsUsed > 0) {
    try {
      await spendTokens(
        userId,
        totalCreditsUsed,
        `Asset Director: ${completed.length} asset${completed.length === 1 ? '' : 's'} generated`,
        {
          sessionId,
          breakdown: completed.map((c) => ({
            type: c.type,
            description: c.description,
            cost: ASSET_DIRECTOR_COSTS[c.type],
          })),
        },
      )
    } catch (err) {
      // Credits failed after work was done — log loud. We don't roll back the
      // assets themselves because that's the pipeline agents' responsibility.
      console.error('[asset-director] spendTokens failed post-generation:', err)
    }
  }

  return {
    intents,
    results,
    totalCreditsUsed,
    durationMs: Date.now() - startedAt,
  }
}
