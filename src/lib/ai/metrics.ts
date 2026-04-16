/**
 * In-memory AI build metrics collector.
 *
 * Lightweight, no DB — tracks per-lambda-instance stats over a 24-hour
 * rolling window.  Vercel lambdas don't share memory, so these numbers
 * are approximate / per-instance, but still useful for spotting trends
 * in the /api/health admin response.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AIMetrics {
  /** ISO timestamp when metrics collection started (or last midnight reset) */
  windowStart: string
  /** Total builds recorded in this window */
  totalBuilds: number
  /** Average luau-verifier score (0-100), null if no builds yet */
  avgVerificationScore: number | null
  /** Percentage of builds that required at least one retry */
  retryRate: number
  /** Per-model breakdown */
  modelStats: Record<string, { builds: number; avgScore: number; retries: number }>
  /** User feedback counters */
  feedback: { worked: number; broke: number }
}

// ── Internal state ─────────────────────────────────────────────────────────────

interface BuildRecord {
  score: number
  model: string
  retried: boolean
  ts: number // epoch ms
}

interface FeedbackRecord {
  worked: boolean
  ts: number
}

const WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

let builds: BuildRecord[] = []
let feedbacks: FeedbackRecord[] = []

// ── Pruning ────────────────────────────────────────────────────────────────────

function pruneOld() {
  const cutoff = Date.now() - WINDOW_MS
  builds = builds.filter((b) => b.ts >= cutoff)
  feedbacks = feedbacks.filter((f) => f.ts >= cutoff)
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Record the outcome of a single AI build.
 *
 * @param score   Luau-verifier quality score (0–100)
 * @param model   Model identifier (e.g. "gpt-4o", "groq-llama-3")
 * @param retried Whether this build required one or more retries
 */
export function recordBuild(score: number, model: string, retried: boolean): void {
  pruneOld()
  builds.push({ score, model, retried, ts: Date.now() })
}

/**
 * Record user feedback on a build.
 *
 * @param worked true = user said it worked, false = user said it broke
 */
export function recordFeedback(worked: boolean): void {
  pruneOld()
  feedbacks.push({ worked, ts: Date.now() })
}

/**
 * Return current rolling-window metrics snapshot.
 */
export function getMetrics(): AIMetrics {
  pruneOld()

  const totalBuilds = builds.length

  // Average verification score
  const avgVerificationScore =
    totalBuilds > 0
      ? Math.round((builds.reduce((sum, b) => sum + b.score, 0) / totalBuilds) * 10) / 10
      : null

  // Retry rate
  const retriedCount = builds.filter((b) => b.retried).length
  const retryRate = totalBuilds > 0 ? Math.round((retriedCount / totalBuilds) * 1000) / 10 : 0

  // Per-model stats
  const modelMap = new Map<string, { scores: number[]; retries: number }>()
  for (const b of builds) {
    let entry = modelMap.get(b.model)
    if (!entry) {
      entry = { scores: [], retries: 0 }
      modelMap.set(b.model, entry)
    }
    entry.scores.push(b.score)
    if (b.retried) entry.retries++
  }

  const modelStats: AIMetrics['modelStats'] = {}
  Array.from(modelMap.entries()).forEach(([model, data]) => {
    const avg = data.scores.reduce((s, v) => s + v, 0) / data.scores.length
    modelStats[model] = {
      builds: data.scores.length,
      avgScore: Math.round(avg * 10) / 10,
      retries: data.retries,
    }
  })

  // Feedback
  const worked = feedbacks.filter((f) => f.worked).length
  const broke = feedbacks.filter((f) => !f.worked).length

  // Window start: oldest record or now
  const oldest = Math.min(
    builds.length > 0 ? builds[0].ts : Date.now(),
    feedbacks.length > 0 ? feedbacks[0].ts : Date.now(),
  )

  return {
    windowStart: new Date(oldest).toISOString(),
    totalBuilds,
    avgVerificationScore,
    retryRate,
    modelStats,
    feedback: { worked, broke },
  }
}
