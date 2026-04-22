import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import {
  buildEliSystemPrompt,
  callEli,
  parseActions,
  queryCodegraph,
  type EliMessage,
  type EliContext,
} from '@/lib/eli/brain'
import { getMemories, incrementConversationCount, getMemoryStats } from '@/lib/eli/memory'
import { executeAction } from '@/lib/eli/actions'

const STATE_FILE = join(process.cwd(), 'scripts', '.forje-eli-state.json')
const FIXES_FILE = join(process.cwd(), 'scripts', '.forje-fixes-overrides.json')

function loadContext(userQuery: string): EliContext {
  let items: Record<string, unknown>[] = []
  let contributors: unknown[] = []
  let stats: Record<string, unknown> = {}

  // Load Eli bot state
  try {
    if (existsSync(STATE_FILE)) {
      const data = JSON.parse(readFileSync(STATE_FILE, 'utf-8'))
      items = data.items || []
      contributors = Object.values(data.contributors || {})
    }
  } catch {}

  // Merge fix overrides
  let overrides: Record<string, Record<string, unknown>> = {}
  try {
    if (existsSync(FIXES_FILE)) {
      overrides = JSON.parse(readFileSync(FIXES_FILE, 'utf-8'))
    }
  } catch {}

  const mergedItems = items.map((item) => {
    const override = overrides[item.id as string]
    return {
      ...item,
      status: override?.status || item.status || 'new',
      progress: override?.progress ?? (item.status === 'fixed' ? 100 : 0),
      staffNotes: override?.staffNotes || item.staffNotes || '',
      assignee: override?.assignee || '',
    }
  })

  const bugs = mergedItems.filter((i) => i.type === 'bug')
  const suggestions = mergedItems.filter((i) => i.type === 'suggestion')

  stats = {
    totalItems: mergedItems.length,
    bugs: bugs.length,
    suggestions: suggestions.length,
    fixed: mergedItems.filter((i) => (i.progress as number) === 100).length,
    inProgress: mergedItems.filter((i) => {
      const p = i.progress as number
      return p > 0 && p < 100
    }).length,
    avgProgress: mergedItems.length > 0
      ? Math.round(
          mergedItems.reduce((sum, i) => sum + ((i.progress as number) || 0), 0) / mergedItems.length
        )
      : 0,
    contributors: contributors.length,
    memoryStats: getMemoryStats(),
  }

  // Get ALL memories (brain.ts will smart-filter them based on query)
  const memories = getMemories({ limit: 200 })

  // Query codegraph for code context if the query mentions code/technical topics
  let codeContext = ''
  const lower = userQuery.toLowerCase()
  const needsCode = [
    'code', 'function', 'file', 'route', 'component', 'api', 'import',
    'fix', 'bug', 'error', 'refactor', 'architecture', 'how does', 'where is',
    'callai', 'provider', 'plugin', 'studio', 'chat', 'build', 'deploy',
  ].some((w) => lower.includes(w))

  if (needsCode) {
    codeContext = queryCodegraph(userQuery)
  }

  return {
    recentBugs: bugs,
    recentSuggestions: suggestions,
    stats,
    contributors,
    memories,
    codeContext,
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { messages } = body as { messages: EliMessage[] }

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Messages required' }, { status: 400 })
  }

  // Get the latest user message for context retrieval
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
  const userQuery = lastUserMsg?.content || ''

  // Build context with smart memory retrieval + codegraph
  const context = loadContext(userQuery)
  const systemPrompt = buildEliSystemPrompt(context, userQuery)

  // Call ELI with higher token limit for detailed responses
  const rawResponse = await callEli(systemPrompt, messages, {
    maxTokens: 6144,
    temperature: 0.7,
  })

  // Parse and execute actions
  const { text, actions } = parseActions(rawResponse)
  const executedActions = []
  for (const action of actions) {
    const result = await executeAction(action)
    executedActions.push(result)
  }

  incrementConversationCount()

  return NextResponse.json({
    response: text,
    actions: executedActions,
    context: {
      memoriesUsed: context.memories.length,
      memoriesRelevant: text.length, // proxy — real count is in brain
      bugsTracked: context.recentBugs.length,
      codeContextLoaded: !!context.codeContext,
      stats: context.stats,
    },
  })
}
