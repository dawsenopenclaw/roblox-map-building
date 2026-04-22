/**
 * ELI Autonomous Audit Cron — Runs every day on Vercel
 * Also callable manually via POST for on-demand audits.
 *
 * This performs a lightweight server-side audit (no Playwright on Vercel):
 * - Health checks all services
 * - Checks key API routes
 * - Analyzes memory for patterns
 * - Posts digest to Discord
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkSiteHealth, getUserStats, getBuildStats } from '@/lib/eli/site-ops'
import { getMemories, getMemoryStats, addMemory } from '@/lib/eli/memory'
import { callEli, buildEliSystemPrompt, parseActions, type EliContext } from '@/lib/eli/brain'
import { executeAction } from '@/lib/eli/actions'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export const maxDuration = 60

const STATE_FILE = join(process.cwd(), 'scripts', '.forje-eli-state.json')

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sets this)
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()

  // 1. Health check
  const health = await checkSiteHealth()

  // 2. User stats
  const userStats = await getUserStats()

  // 3. Build stats
  const buildStats = await getBuildStats()

  // 4. Memory stats
  const memStats = getMemoryStats()

  // 5. Bug tracker state
  let bugCount = 0
  let suggestionCount = 0
  try {
    if (existsSync(STATE_FILE)) {
      const state = JSON.parse(readFileSync(STATE_FILE, 'utf-8'))
      const items = state.items || []
      bugCount = items.filter((i: Record<string, unknown>) => i.type === 'bug').length
      suggestionCount = items.filter((i: Record<string, unknown>) => i.type === 'suggestion').length
    }
  } catch {}

  // 6. Ask ELI to analyze the situation and take action
  const context: EliContext = {
    recentBugs: [],
    recentSuggestions: [],
    stats: {
      health: health.services,
      users: userStats.stats,
      builds: buildStats,
      memory: memStats,
      bugs: bugCount,
      suggestions: suggestionCount,
    },
    contributors: [],
    memories: getMemories({ limit: 20 }),
  }

  const systemPrompt = buildEliSystemPrompt(context)

  const analysisPrompt = `You are running your daily autonomous audit. Here's the current state:

**Health:** ${JSON.stringify(health.services, null, 2)}
**Users:** ${JSON.stringify(userStats.stats, null, 2)}
**Builds:** ${JSON.stringify(buildStats, null, 2)}
**Memory:** ${memStats.totalMemories} memories, ${memStats.conversationCount} conversations
**Bugs:** ${bugCount} tracked, ${suggestionCount} suggestions

Analyze the situation. If anything looks wrong:
1. Describe the issue
2. If you can fix it, take action
3. Post a summary to Discord (channel: "general")
4. Save any new insights to memory

If everything looks good, just save a "metric" memory noting that the daily audit passed.`

  const rawResponse = await callEli(systemPrompt, [{ role: 'user', content: analysisPrompt }], {
    maxTokens: 2048,
    temperature: 0.5,
  })

  const { text, actions } = parseActions(rawResponse)
  const executedActions = []
  for (const action of actions) {
    const result = await executeAction(action)
    executedActions.push(result)
  }

  const duration = Date.now() - startTime

  return NextResponse.json({
    status: 'ok',
    duration: `${duration}ms`,
    health: health.overall,
    eli: {
      analysis: text.slice(0, 500),
      actionsExecuted: executedActions.length,
    },
    stats: {
      users: userStats.stats,
      bugs: bugCount,
      suggestions: suggestionCount,
      memories: memStats.totalMemories,
    },
  })
}

// POST for manual trigger
export async function POST(req: NextRequest) {
  return GET(req)
}
