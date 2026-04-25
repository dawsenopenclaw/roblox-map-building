/**
 * ELI Brain v2 — ForjeGames AI Agent Core
 *
 * Powered by: Codegraph (code intelligence) + Memory Graph (363+ entries from Obsidian)
 *
 * ELI can:
 * - Query the full codebase via codegraph (12,737 nodes, 23,979 edges)
 * - Draw on 363+ knowledge entries migrated from Obsidian vault
 * - Take real actions: update bugs, post Discord, analyze code, create reports
 * - Learn and self-improve from every conversation
 * - Reason about architecture, business strategy, competitors, and bugs
 * - Chain multiple actions together for complex tasks
 */

import 'server-only'
import { execSync } from 'child_process'

// ─── Types ───────────────────────────────────────────────────────────────────
export interface EliMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
  action?: EliAction
}

export interface EliAction {
  type: string
  params: Record<string, unknown>
  result?: string
  success?: boolean
}

export interface EliMemoryEntry {
  id: string
  type: 'learning' | 'pattern' | 'decision' | 'user-pref' | 'bug-insight' | 'metric'
  content: string
  source: string
  confidence: number
  timestamp: string
  usageCount: number
  tags: string[]
}

export interface EliContext {
  recentBugs: unknown[]
  recentSuggestions: unknown[]
  stats: Record<string, unknown>
  contributors: unknown[]
  memories: EliMemoryEntry[]
  codeContext?: string
}

// ─── Codegraph Integration ───────────────────────────────────────────────────
// Query the indexed codebase for relevant code context
export function queryCodegraph(query: string): string {
  try {
    const result = execSync(
      `codegraph context "${query.replace(/"/g, '\\"')}" -p "C:/dev/roblox-map-building" 2>/dev/null`,
      { timeout: 10_000, encoding: 'utf-8', maxBuffer: 50_000 }
    )
    return result.trim().slice(0, 4000) // Cap context size
  } catch {
    return ''
  }
}

export function searchCodegraph(symbol: string): string {
  try {
    const result = execSync(
      `codegraph query "${symbol.replace(/"/g, '\\"')}" -p "C:/dev/roblox-map-building" 2>/dev/null`,
      { timeout: 5_000, encoding: 'utf-8', maxBuffer: 20_000 }
    )
    return result.trim().slice(0, 2000)
  } catch {
    return ''
  }
}

// ─── Smart Memory Retrieval ──────────────────────────────────────────────────
// Retrieve memories most relevant to the user's query
export function retrieveRelevantMemories(
  query: string,
  allMemories: EliMemoryEntry[],
  limit: number = 25
): EliMemoryEntry[] {
  const queryWords = new Set(
    query.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
  )
  const queryTags = extractQueryTags(query)

  return allMemories
    .map((m) => {
      let score = 0

      // Tag match (highest weight)
      for (const tag of m.tags) {
        if (queryTags.has(tag)) score += 15
      }

      // Word overlap
      const memWords = m.content.toLowerCase().split(/\s+/)
      for (const w of memWords) {
        if (queryWords.has(w)) score += 2
      }

      // Type relevance boost
      if (query.toLowerCase().includes('bug') && m.type === 'bug-insight') score += 10
      if (query.toLowerCase().includes('competitor') && m.type === 'metric') score += 10
      if (query.toLowerCase().includes('architecture') && m.type === 'learning') score += 5
      if (query.toLowerCase().includes('strategy') && m.type === 'decision') score += 10
      if (query.toLowerCase().includes('fix') && m.type === 'bug-insight') score += 8
      if (query.toLowerCase().includes('plan') && m.type === 'decision') score += 8

      // Confidence and freshness boost
      score += m.confidence * 0.05
      score += m.usageCount * 2

      return { memory: m, score }
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((m) => m.memory)
}

function extractQueryTags(query: string): Set<string> {
  const tags = new Set<string>()
  const lower = query.toLowerCase()
  const tagMap: Record<string, string[]> = {
    'ai': ['ai', 'gemini', 'groq', 'generate', 'build', 'llm', 'model'],
    'auth': ['auth', 'login', 'sign', 'clerk', 'session'],
    'billing': ['billing', 'stripe', 'payment', 'subscribe', 'price', 'tier', 'revenue'],
    'studio-plugin': ['studio', 'plugin', 'roblox', 'connect', 'sync'],
    'connection': ['connection', 'websocket', 'disconnect', 'reconnect'],
    'database': ['database', 'prisma', 'postgres', 'db', 'schema', 'migration'],
    'redis': ['redis', 'upstash', 'cache', 'rate limit'],
    'deployment': ['deploy', 'vercel', 'production', 'build'],
    'competitors': ['competitor', 'rebirth', 'lemonade', 'ropilot', 'forgegui', 'bloxtoolkit'],
    'business': ['business', 'strategy', 'launch', 'market', 'growth'],
    'engineering': ['engineer', 'code', 'refactor', 'architect', 'technical'],
    'bugs': ['bug', 'fix', 'broken', 'error', 'issue', 'crash'],
    'rag': ['rag', 'embedding', 'vector', 'knowledge'],
    'agents': ['agent', 'mcp', 'specialist', 'automation'],
    'discord': ['discord', 'bot', 'community', 'beta'],
    'ui': ['ui', 'frontend', 'design', 'layout', 'component', 'page'],
  }

  for (const [tag, keywords] of Object.entries(tagMap)) {
    if (keywords.some((k) => lower.includes(k))) tags.add(tag)
  }
  return tags
}

// ─── System Prompt ───────────────────────────────────────────────────────────
export function buildEliSystemPrompt(context: EliContext, userQuery?: string): string {
  // Smart memory selection — only include memories relevant to the query
  const relevantMemories = userQuery
    ? retrieveRelevantMemories(userQuery, context.memories, 25)
    : context.memories.slice(0, 20)

  const memoryBlock = relevantMemories.length > 0
    ? `\n## Relevant Knowledge (${relevantMemories.length} of ${context.memories.length} total memories)\n` +
      relevantMemories
        .map((m) => `- **[${m.type}]** (conf: ${m.confidence}%, tags: ${m.tags.slice(0, 4).join(',')})\n  ${m.content.slice(0, 300)}${m.content.length > 300 ? '...' : ''}`)
        .join('\n')
    : ''

  const bugsBlock = context.recentBugs.length > 0
    ? `\n## Active Bugs (${context.recentBugs.length})\n` +
      (context.recentBugs as Array<Record<string, unknown>>)
        .slice(0, 15)
        .map((b) => `- [${b.severity}] ${b.title} — ${b.author} (status: ${b.status}, progress: ${b.progress}%, tags: ${(b.tags as string[])?.join(', ') || 'none'})${b.staffNotes ? ` | Notes: ${(b.staffNotes as string).slice(0, 100)}` : ''}`)
        .join('\n')
    : ''

  const suggestionsBlock = context.recentSuggestions.length > 0
    ? `\n## Suggestions (${context.recentSuggestions.length})\n` +
      (context.recentSuggestions as Array<Record<string, unknown>>)
        .slice(0, 10)
        .map((s) => `- ${s.title} — ${s.author} (priority: ${s.priority})${s.content ? `: ${(s.content as string).slice(0, 100)}` : ''}`)
        .join('\n')
    : ''

  const statsBlock = context.stats
    ? `\n## Platform Stats\n${JSON.stringify(context.stats, null, 2)}`
    : ''

  const contributorsBlock = context.contributors.length > 0
    ? `\n## Top Contributors\n` +
      (context.contributors as Array<Record<string, unknown>>)
        .slice(0, 10)
        .map((c) => `- ${c.username}: ${c.reputation} rep, ${c.bugsReported} bugs, ${c.suggestionsSubmitted} suggestions, badges: ${(c.badges as string[])?.join(', ') || 'none'}`)
        .join('\n')
    : ''

  const codeBlock = context.codeContext
    ? `\n## Code Context (from CodeGraph — 12,737 nodes indexed)\n${context.codeContext}`
    : ''

  return `You are ELI v2 — ForjeGames' AI operations brain. You are the most capable internal agent this team has.

## Your Identity
- **Name:** ELI (Engineering & Learning Intelligence)
- **Role:** Chief AI operations agent. You own: bug triage, community management, code intelligence, business analytics, and team coordination.
- **Personality:** Direct, sharp, proactive. Senior engineer energy + business awareness. Fun but never corporate. You care about shipping quality fast.
- **Team:** Vyren (founder, visionary, final call), Noah (compile reports, coordinate), Coltin (review, quality). ALWAYS call the founder "Vyren" — never Dawse/Yomi/Dawsen.

## Your Power Sources
1. **Memory Graph** — ${context.memories.length} knowledge entries (Obsidian vault fully migrated: architecture, business, competitors, engineering, patterns, user preferences)
2. **CodeGraph** — 12,737 code nodes, 23,979 edges. Full symbol relationships, call graphs, imports across 1,100 files.
3. **Bug Tracker** — Real-time bug/suggestion feed from Discord (${context.recentBugs.length} bugs, ${context.recentSuggestions.length} suggestions)
4. **Contributor Stats** — ${context.contributors.length} community members tracked with reputation scores
5. **Self-Learning** — Every conversation makes you smarter. Save insights, update confidence, learn from outcomes.

## Capabilities

### Analysis
- Deep-dive any part of the codebase (ask about any function, route, component)
- Cross-reference bugs with code to suggest root causes
- Competitor analysis with real data (Rebirth 50K users, Lemonade 100K, Ropilot BYOK)
- Revenue projections and pricing strategy
- Architecture review and tech debt assessment

### Actions
Include in response to execute:
\`\`\`action
{"type": "action_name", "params": {...}}
\`\`\`

**Code (you can READ and EDIT real files):**
- \`read_file\` — { path, startLine?, endLine? } — Read any source file
- \`edit_file\` — { path, search, replace } — Find-and-replace in a file. You write REAL code fixes.
- \`create_file\` — { path, content } — Create new files
- \`search_symbol\` — { symbol } — Find a function/class/variable via codegraph
- \`find_callers\` — { symbol } — Who calls this function?
- \`query_code\` — { query } — Natural language codebase search via codegraph

**Shell (you can run commands):**
- \`run_command\` — { command } — Run any shell command (git, npm, grep, etc.)
- \`git_status\` — {} — See current branch + changed files
- \`git_diff\` — { path? } — See what changed

**Bug Tracker:**
- \`update_bug\` — { id, status, progress, staffNotes, assignee }
- \`bulk_update_bugs\` — { updates: [{id, status, progress}] }
- \`assign_team\` — { bugId, assignee, reason }

**Discord (read AND write, real-time):**
- \`post_discord\` — { channel, message, embed? } — Post to any channel
- \`discord_read\` — { channel, limit? } — Read recent messages from any channel
- \`discord_reply\` — { channel, messageId, content } — Reply to a specific message
- \`discord_server_info\` — {} — Get server stats (member count, online, channels)
Channels: general, announcements, bug-log, leaderboard, suggestions, feature-requests

**Site Operations (full platform access):**
- \`health_check\` — {} — Check database, Redis, Gemini, Stripe, Clerk status
- \`user_stats\` — {} — Total users, by tier, active today/week
- \`lookup_user\` — { search?, tier? } — Find users by email/username/id
- \`build_stats\` — {} — Total builds, recent builds
- \`check_page\` — { url } — Hit any page, get status/latency/title/errors (e.g. "/pricing")
- \`trigger_audit\` — {} — Run full autonomous site audit right now

**Memory (self-learning):**
- \`save_memory\` — { type, content, tags, confidence }

**Reports:**
- \`create_report\` — { title, sections[] }

### FIX MODE — When asked to fix something:
1. First \`query_code\` or \`search_symbol\` to find the relevant code
2. Then \`read_file\` to see the current state
3. Then \`edit_file\` to make the fix
4. Then \`git_diff\` to confirm the change
5. Explain what you changed and why
You are a REAL agent. Your edits actually modify files on disk. Be precise.

### Reasoning Modes
Adapt your depth based on what's asked:
- **Quick answer** — Short, direct, one-liner if possible
- **Analysis** — Structured breakdown with evidence from memories + code
- **Strategy** — Multi-factor reasoning with tradeoffs, risks, recommendations
- **Report** — Formatted digest for Noah with action items, priorities, metrics
- **Debug** — Trace the code path, identify root cause, suggest fix with file:line
- **Fix** — Actually edit the code. Read → understand → edit → verify.

### Self-Improvement Protocol
After significant interactions:
1. If you discover a new pattern → save_memory type:"pattern"
2. If a previous insight was wrong → save_memory with corrected version, higher confidence
3. If you see systemic issues → save_memory type:"bug-insight" with the pattern
4. If user feedback confirms your advice → boost that memory's approach
5. Track what works: "I recommended X, it worked because Y" → save_memory type:"learning"

## Communication Rules
- Lead with the answer, then explain.
- Bullet points > paragraphs.
- Code references: include file path + line when relevant.
- For Noah: always include "Action Items" section with clear owners.
- For Vyren: fast, casual, skip the obvious. He types with typos — adapt.
- NO corporate language (stunning, captivating, vibrant, sleek, sophistication).
- NO slang (yo, bro, ngl, lowkey, sick, dope, fire, bussin, no cap).
- Be honest about confidence. "I'm 80% sure" > pretending to know.

## ForjeGames Quick Facts
- AI Roblox game builder. 200+ specialist agents. 13 image styles. 3D mesh gen.
- $30K/mo target = 1,000 Studio subs at $49.99/mo
- Stack: Next.js 15, React 19, Clerk, Neon Postgres, Upstash Redis, Stripe, Gemini/Groq
- Edge over competitors: only all-inclusive platform. No BYOK.
- Beta: 10+ testers daily, 16 bugs reported → 16 fixed
- 15+ automated agents running 24/7

${codeBlock}
${bugsBlock}
${suggestionsBlock}
${statsBlock}
${contributorsBlock}
${memoryBlock}

You have ${context.memories.length} total memories. The ones shown above are the most relevant to the current query. You can access more by asking.

Remember: You are the strongest agent this team has. Think deeply, act decisively, learn constantly.`
}

// ─── Call AI ─────────────────────────────────────────────────────────────────
async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function callEli(
  systemPrompt: string,
  messages: EliMessage[],
  opts: { maxTokens?: number; temperature?: number; jsonMode?: boolean } = {}
): Promise<string> {
  const { maxTokens = 6144, temperature = 0.7, jsonMode = false } = opts

  // Try Gemini first (higher token limits)
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_MAIN
  if (geminiKey) {
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

    const body: Record<string, unknown> = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature,
        ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
    }

    for (let attempt = 0; attempt <= 3; attempt++) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(60_000),
          }
        )
        if (res.status === 429) {
          await sleep(2000 * (attempt + 1))
          continue
        }
        if (!res.ok) break
        const data = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) return text
        break
      } catch (err) {
        console.error('Gemini error:', err)
        if (attempt < 3) await sleep(2000)
      }
    }
  }

  // Fallback to Groq
  const groqKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_MAIN
  if (groqKey) {
    const groqMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ]
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: groqMessages,
          max_tokens: maxTokens,
          temperature,
          ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        }),
        signal: AbortSignal.timeout(60_000),
      })
      if (res.ok) {
        const data = await res.json()
        return data.choices?.[0]?.message?.content || 'No response from Groq'
      }
    } catch (err) {
      console.error('Groq error:', err)
    }
  }

  return "I'm having trouble connecting to AI providers right now. Try again in a moment."
}

// ─── Parse Actions from Response ─────────────────────────────────────────────
export function parseActions(response: string): { text: string; actions: EliAction[] } {
  const actions: EliAction[] = []
  const actionRegex = /```action\n([\s\S]*?)```/g
  let match

  while ((match = actionRegex.exec(response)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim())
      actions.push({
        type: parsed.type,
        params: parsed.params || {},
      })
    } catch {}
  }

  const text = response.replace(/```action\n[\s\S]*?```/g, '').trim()
  return { text, actions }
}
