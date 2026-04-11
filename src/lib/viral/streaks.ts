/**
 * Daily streak tracking with grace days. Pure module — no storage.
 *
 * A "streak" is defined as consecutive days with at least one qualifying event
 * (login, build, etc.). To reduce punishment for timezones and life, users get
 * a limited number of "grace days" per rolling window — a grace day extends the
 * streak across a missed day without resetting.
 */

export interface StreakState {
  /** Current streak in days (inclusive of today if hasActivityToday). */
  currentStreak: number
  /** All-time longest streak. */
  longestStreak: number
  /** ISO date string of the last activity (YYYY-MM-DD, UTC). */
  lastActivityDate: string | null
  /** Remaining grace days in the current window. */
  graceRemaining: number
  /** Date the grace window resets (YYYY-MM-DD). */
  graceWindowStart: string | null
}

export interface StreakConfig {
  /** Max grace days per window. Defaults to 2. */
  graceDays: number
  /** Grace window length in days. Defaults to 30. */
  graceWindowDays: number
}

export const DEFAULT_STREAK_CONFIG: StreakConfig = {
  graceDays: 2,
  graceWindowDays: 30,
}

export function emptyStreak(): StreakState {
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    graceRemaining: DEFAULT_STREAK_CONFIG.graceDays,
    graceWindowStart: null,
  }
}

/** Format a Date to YYYY-MM-DD in UTC. */
export function toUtcDateString(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseUtcDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1))
}

/** Whole-day difference in UTC (b - a). */
export function daysBetween(aIso: string, bIso: string): number {
  const a = parseUtcDate(aIso).getTime()
  const b = parseUtcDate(bIso).getTime()
  return Math.round((b - a) / 86_400_000)
}

export interface RecordActivityResult {
  state: StreakState
  streakIncremented: boolean
  streakBroken: boolean
  graceUsed: boolean
  milestone: 7 | 30 | 100 | null
}

/**
 * Record an activity for a given day (defaults to "now"). Returns the new
 * state and a diff of what happened.
 *
 * Rules:
 * - If lastActivityDate is today, nothing changes.
 * - If lastActivityDate is yesterday, currentStreak += 1.
 * - If lastActivityDate is older and a grace day is available, grace is consumed
 *   and currentStreak += 1 (treated as if the missed day counted).
 * - Otherwise the streak resets to 1.
 */
export function recordActivity(
  state: StreakState,
  now: Date = new Date(),
  config: StreakConfig = DEFAULT_STREAK_CONFIG,
): RecordActivityResult {
  const today = toUtcDateString(now)
  const next: StreakState = { ...state }

  // Reset grace window if expired
  if (next.graceWindowStart) {
    const age = daysBetween(next.graceWindowStart, today)
    if (age >= config.graceWindowDays) {
      next.graceRemaining = config.graceDays
      next.graceWindowStart = today
    }
  } else {
    next.graceWindowStart = today
    next.graceRemaining = config.graceDays
  }

  let streakIncremented = false
  let streakBroken = false
  let graceUsed = false

  if (next.lastActivityDate === null) {
    next.currentStreak = 1
    streakIncremented = true
  } else {
    const gap = daysBetween(next.lastActivityDate, today)
    if (gap === 0) {
      // Already logged today — no change
    } else if (gap === 1) {
      next.currentStreak += 1
      streakIncremented = true
    } else if (gap >= 2 && next.graceRemaining > 0 && gap - 1 <= next.graceRemaining) {
      next.graceRemaining -= gap - 1
      next.currentStreak += 1
      streakIncremented = true
      graceUsed = true
    } else {
      next.currentStreak = 1
      streakBroken = true
    }
  }

  next.lastActivityDate = today
  if (next.currentStreak > next.longestStreak) next.longestStreak = next.currentStreak

  let milestone: RecordActivityResult['milestone'] = null
  if (streakIncremented) {
    if (next.currentStreak === 7) milestone = 7
    else if (next.currentStreak === 30) milestone = 30
    else if (next.currentStreak === 100) milestone = 100
  }

  return { state: next, streakIncremented, streakBroken, graceUsed, milestone }
}

/**
 * Determine whether a streak is at risk of breaking — i.e. user hasn't logged
 * in today and grace is low. Used to power push reminders.
 */
export function isStreakAtRisk(
  state: StreakState,
  now: Date = new Date(),
): boolean {
  if (!state.lastActivityDate || state.currentStreak < 2) return false
  const today = toUtcDateString(now)
  const gap = daysBetween(state.lastActivityDate, today)
  return gap >= 1 && state.graceRemaining <= 0
}
