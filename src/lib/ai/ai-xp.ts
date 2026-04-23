/**
 * AI XP & Leveling System
 *
 * The AI earns XP for every build based on quality score and complexity.
 * Level formula: level = floor(sqrt(totalXP / 50))
 * No cap — level can go to infinity (1000+).
 *
 * Stored in Redis key `forje:ai:xp` as a JSON blob.
 * Persists across deploys.
 */

import 'server-only'
import { redis } from '@/lib/redis'

const REDIS_KEY = 'forje:ai:xp'

export interface AILevel {
  totalXP: number
  level: number
  title: string
  xpToNextLevel: number
  currentLevelXP: number
  streak: number          // consecutive builds above 70 score
  bestScore: number
  totalBuilds: number
  rulesLearned: number
}

interface AIXPData {
  totalXP: number
  streak: number
  bestScore: number
  totalBuilds: number
  rulesLearned: number
}

// ─── Title Tiers ─────────────────────────────────────────────────────────────

function getTitle(level: number): string {
  if (level <= 0) return 'Uninitialized'
  if (level <= 5) return 'Apprentice Builder'
  if (level <= 10) return 'Junior Architect'
  if (level <= 20) return 'Skilled Craftsman'
  if (level <= 35) return 'Expert Builder'
  if (level <= 50) return 'Master Architect'
  if (level <= 75) return 'Grand Forge'
  if (level <= 100) return 'Legendary Forge'
  if (level <= 150) return 'Mythic Creator'
  if (level <= 200) return 'Transcendent AI'
  return 'Omega Intelligence'
}

// ─── Level Math ──────────────────────────────────────────────────────────────

function xpToLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 50))
}

function levelToXP(level: number): number {
  return level * level * 50
}

// ─── Redis I/O ───────────────────────────────────────────────────────────────

const DEFAULT_DATA: AIXPData = {
  totalXP: 0,
  streak: 0,
  bestScore: 0,
  totalBuilds: 0,
  rulesLearned: 0,
}

async function loadData(): Promise<AIXPData> {
  try {
    const raw = await redis.get(REDIS_KEY)
    if (!raw) return { ...DEFAULT_DATA }
    const parsed = JSON.parse(raw as string) as Partial<AIXPData>
    return {
      totalXP: parsed.totalXP ?? 0,
      streak: parsed.streak ?? 0,
      bestScore: parsed.bestScore ?? 0,
      totalBuilds: parsed.totalBuilds ?? 0,
      rulesLearned: parsed.rulesLearned ?? 0,
    }
  } catch {
    return { ...DEFAULT_DATA }
  }
}

async function saveData(data: AIXPData): Promise<void> {
  try {
    await redis.set(REDIS_KEY, JSON.stringify(data))
  } catch {
    // Non-blocking — XP is best-effort
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Get the AI's current level, XP, title, and stats.
 */
export async function getAILevel(): Promise<AILevel> {
  const data = await loadData()
  const level = xpToLevel(data.totalXP)
  const currentLevelStart = levelToXP(level)
  const nextLevelStart = levelToXP(level + 1)

  return {
    totalXP: data.totalXP,
    level,
    title: getTitle(level),
    xpToNextLevel: nextLevelStart - data.totalXP,
    currentLevelXP: data.totalXP - currentLevelStart,
    streak: data.streak,
    bestScore: data.bestScore,
    totalBuilds: data.totalBuilds,
    rulesLearned: data.rulesLearned,
  }
}

/**
 * Award XP to the AI for a build.
 * XP formula: score * multiplier (based on complexity bracket).
 * Even bad builds earn some XP — but quality earns way more.
 */
export async function awardXP(
  score: number,
  complexity: number,
  _category: string,
): Promise<{ xpGained: number; leveledUp: boolean; newLevel: number }> {
  const data = await loadData()

  // Complexity multiplier: 1x-3x based on part count / complexity
  const complexityMultiplier = complexity >= 100 ? 3.0
    : complexity >= 50 ? 2.0
    : complexity >= 20 ? 1.5
    : 1.0

  // Base XP = score (0-100), scaled by complexity
  const xpGained = Math.max(1, Math.round(score * complexityMultiplier))

  const oldLevel = xpToLevel(data.totalXP)

  // Update data
  data.totalXP += xpGained
  data.totalBuilds += 1
  data.bestScore = Math.max(data.bestScore, score)

  // Streak tracking: consecutive builds above 70
  if (score >= 70) {
    data.streak += 1
  } else {
    data.streak = 0
  }

  const newLevel = xpToLevel(data.totalXP)
  const leveledUp = newLevel > oldLevel

  await saveData(data)

  if (leveledUp) {
    console.log(`[AI-XP] LEVEL UP! ${oldLevel} -> ${newLevel} (${getTitle(newLevel)}) | Total XP: ${data.totalXP}`)
  }

  return { xpGained, leveledUp, newLevel }
}

/**
 * Update the rules-learned count (called when self-improve discovers new rules).
 */
export async function updateRulesCount(count: number): Promise<void> {
  const data = await loadData()
  data.rulesLearned = count
  await saveData(data)
}

/**
 * Get just the level + title for lightweight display (e.g. editor badge).
 */
export async function getAILevelBadge(): Promise<{ level: number; title: string }> {
  const data = await loadData()
  const level = xpToLevel(data.totalXP)
  return { level, title: getTitle(level) }
}
