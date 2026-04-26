/**
 * Build Timeline — Records the step-by-step creation of a build.
 *
 * Used for:
 * 1. TikTok-style timelapse content (show build creation in 15 seconds)
 * 2. Build replay / history in the editor
 * 3. Debugging (see exactly what happened during generation)
 *
 * Each build gets a timeline of events:
 *   prompt_received → plan_generated → code_generated → sent_to_studio →
 *   verification_passed → error_detected → error_fixed → completed
 *
 * The timeline is stored in Redis (24h TTL) and can be fetched via API.
 * A future frontend component will render it as an animated timeline or
 * generate a video/GIF timelapse for social sharing.
 */

import 'server-only'
import { getRedis } from '@/lib/redis'

// ─── Types ──────────────────────────────────────────────────────────────────

export type TimelineEventType =
  | 'prompt_received'
  | 'intent_classified'
  | 'template_matched'
  | 'cache_hit'
  | 'plan_generated'
  | 'code_generating'
  | 'code_generated'
  | 'amplified'
  | 'sent_to_studio'
  | 'error_detected'
  | 'error_fixed'
  | 'verification_started'
  | 'verification_passed'
  | 'verification_failed'
  | 'missing_components_added'
  | 'completed'

export interface TimelineEvent {
  type: TimelineEventType
  timestamp: number       // Date.now()
  durationMs?: number     // how long this step took
  details?: string        // human-readable description
  metadata?: Record<string, unknown> // extra data (part count, model used, etc)
}

export interface BuildTimeline {
  id: string              // unique build ID
  userId?: string
  prompt: string
  intent: string
  startedAt: number
  completedAt?: number
  events: TimelineEvent[]
  finalPartCount?: number
  finalScore?: number
  model?: string
}

const REDIS_TTL = 24 * 60 * 60 // 24 hours

// ─── In-memory timeline for current build (flushed to Redis on complete) ────

const activeTimelines = new Map<string, BuildTimeline>()

/** Start tracking a new build */
export function startTimeline(buildId: string, prompt: string, intent: string, userId?: string): BuildTimeline {
  const timeline: BuildTimeline = {
    id: buildId,
    userId,
    prompt,
    intent,
    startedAt: Date.now(),
    events: [{
      type: 'prompt_received',
      timestamp: Date.now(),
      details: prompt.slice(0, 200),
    }],
  }
  activeTimelines.set(buildId, timeline)
  return timeline
}

/** Add an event to an active timeline */
export function addTimelineEvent(
  buildId: string,
  type: TimelineEventType,
  details?: string,
  metadata?: Record<string, unknown>,
): void {
  const timeline = activeTimelines.get(buildId)
  if (!timeline) return

  const prevEvent = timeline.events[timeline.events.length - 1]
  const now = Date.now()

  timeline.events.push({
    type,
    timestamp: now,
    durationMs: prevEvent ? now - prevEvent.timestamp : 0,
    details,
    metadata,
  })
}

/** Complete a timeline and flush to Redis */
export async function completeTimeline(
  buildId: string,
  finalPartCount?: number,
  finalScore?: number,
  model?: string,
): Promise<void> {
  const timeline = activeTimelines.get(buildId)
  if (!timeline) return

  timeline.completedAt = Date.now()
  timeline.finalPartCount = finalPartCount
  timeline.finalScore = finalScore
  timeline.model = model

  addTimelineEvent(buildId, 'completed', `${finalPartCount || 0} parts, score ${finalScore || 0}`)

  // Flush to Redis
  const redis = getRedis()
  if (redis) {
    try {
      await redis.set(
        `timeline:${buildId}`,
        JSON.stringify(timeline),
        { ex: REDIS_TTL },
      )
    } catch { /* non-blocking */ }
  }

  activeTimelines.delete(buildId)
}

/** Fetch a timeline from Redis */
export async function getTimeline(buildId: string): Promise<BuildTimeline | null> {
  // Check active first
  const active = activeTimelines.get(buildId)
  if (active) return active

  // Check Redis
  const redis = getRedis()
  if (!redis) return null

  try {
    const raw = await redis.get<string>(`timeline:${buildId}`)
    if (!raw) return null
    return JSON.parse(raw) as BuildTimeline
  } catch {
    return null
  }
}

/** Generate a shareable summary of the build process */
export function generateTimelineSummary(timeline: BuildTimeline): string {
  const totalMs = (timeline.completedAt || Date.now()) - timeline.startedAt
  const totalSec = (totalMs / 1000).toFixed(1)
  const steps = timeline.events.length

  const lines: string[] = [
    `Built "${timeline.prompt.slice(0, 60)}" in ${totalSec}s`,
    `${steps} steps | ${timeline.finalPartCount || '?'} parts | Score: ${timeline.finalScore || '?'}/100`,
    '',
  ]

  for (const event of timeline.events) {
    const label = event.type.replace(/_/g, ' ')
    const dur = event.durationMs ? ` (${(event.durationMs / 1000).toFixed(1)}s)` : ''
    lines.push(`  ${label}${dur}${event.details ? ` — ${event.details.slice(0, 80)}` : ''}`)
  }

  return lines.join('\n')
}
