/**
 * /api/studio/build-result
 *
 * POST — Record a before/after build delta from the Studio plugin.
 *        When errors are detected in the delta, calls learnFromStudioError()
 *        so the AI self-improvement engine can extract rules from failures.
 *
 * Body: {
 *   sessionId: string
 *   delta: {
 *     newParts: Array<{path, className, name}>
 *     modifiedScripts: Array<{path, name, newSource}>
 *     removedParts: Array<{path, className, name}>
 *     errors: string[]
 *     partCountBefore: number
 *     partCountAfter: number
 *     scriptCountBefore: number
 *     scriptCountAfter: number
 *     timestamp: number
 *   }
 *   originalCode?: string   — the Luau code that was executed
 *   buildCategory?: string  — e.g. "house", "vehicle", "terrain"
 * }
 *
 * Response: { recorded: true, rulesLearned: number }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/studio-session'
import { getRedis } from '@/lib/redis'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Id',
}

const REDIS_KEY_PREFIX = 'fj:studio:build-result:'
const REDIS_TTL = 3600 // 1 hour

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

interface BuildDelta {
  newParts?: Array<{ path: string; className: string; name: string }>
  modifiedScripts?: Array<{ path: string; name: string; newSource: string }>
  removedParts?: Array<{ path: string; className: string; name: string }>
  errors?: string[]
  partCountBefore?: number
  partCountAfter?: number
  scriptCountBefore?: number
  scriptCountAfter?: number
  timestamp?: number
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      sessionId?: string
      delta?: BuildDelta
      originalCode?: string
      buildCategory?: string
    }

    const sessionId = body.sessionId || req.headers.get('x-session-id')
    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400, headers: CORS_HEADERS },
      )
    }

    const delta = body.delta
    if (!delta) {
      return NextResponse.json(
        { error: 'delta object is required' },
        { status: 400, headers: CORS_HEADERS },
      )
    }

    // Verify session exists
    const session = await getSession(sessionId)
    if (!session) {
      return NextResponse.json(
        { error: 'session_not_found' },
        { status: 404, headers: CORS_HEADERS },
      )
    }

    // Store the delta in Redis for recent history
    const redis = getRedis()
    if (redis) {
      try {
        const key = REDIS_KEY_PREFIX + sessionId
        await redis.lpush(key, JSON.stringify({
          delta,
          originalCode: body.originalCode?.slice(0, 2000),
          buildCategory: body.buildCategory,
          recordedAt: Date.now(),
        }))
        await redis.ltrim(key, 0, 19) // Keep last 20 build results
        await redis.expire(key, REDIS_TTL)
      } catch {
        // Redis unavailable — non-critical
      }
    }

    // If errors were detected, feed them into the self-improvement engine
    let rulesLearned = 0
    const errors = delta.errors ?? []

    if (errors.length > 0 && body.originalCode) {
      try {
        const { learnFromStudioError } = await import('@/lib/ai/self-improve')
        for (const error of errors.slice(0, 10)) {
          await learnFromStudioError(
            error,
            body.originalCode.slice(0, 2000),
            null, // no fixed code yet — this is the raw error report
            body.buildCategory ?? null,
          )
          rulesLearned++
        }
      } catch (err) {
        console.error('[studio/build-result] learnFromStudioError failed:', err)
      }
    }

    // ── Save workspace facts to user memory for long-term learning ──
    // Uses sessionId as the user key since Studio sessions don't carry userId
    try {
      const { saveUserPreference } = await import('@/lib/ai/user-memory')
      const memoryKey = sessionId

      // Total parts after this build
      if (delta.partCountAfter != null) {
        void saveUserPreference(memoryKey, 'workspace_total_parts', String(delta.partCountAfter)).catch(() => {})
      }

      // Last successful build type
      if (errors.length === 0 && body.buildCategory) {
        void saveUserPreference(memoryKey, 'last_successful_build_type', body.buildCategory).catch(() => {})
      }

      // Parts added in this build (for averaging)
      const partsAdded = (delta.partCountAfter ?? 0) - (delta.partCountBefore ?? 0)
      if (partsAdded > 0) {
        void saveUserPreference(memoryKey, 'last_build_parts_added', String(partsAdded)).catch(() => {})
        void saveUserPreference(memoryKey, 'last_build_timestamp', String(Date.now())).catch(() => {})
      }

      // Track new objects added (top-level summary)
      if (delta.newParts && delta.newParts.length > 0) {
        const topNames = delta.newParts.slice(0, 5).map(p => p.name).join(', ')
        void saveUserPreference(memoryKey, 'last_build_objects', topNames).catch(() => {})
      }
    } catch {
      // user-memory module unavailable — non-critical
    }

    return NextResponse.json(
      {
        recorded: true,
        rulesLearned,
        summary: {
          newParts: delta.newParts?.length ?? 0,
          modifiedScripts: delta.modifiedScripts?.length ?? 0,
          removedParts: delta.removedParts?.length ?? 0,
          errors: errors.length,
          partDelta: (delta.partCountAfter ?? 0) - (delta.partCountBefore ?? 0),
        },
      },
      { status: 200, headers: CORS_HEADERS },
    )
  } catch (err) {
    console.error('[studio/build-result] POST error:', err)
    return NextResponse.json(
      { error: 'internal_error' },
      { status: 500, headers: CORS_HEADERS },
    )
  }
}
