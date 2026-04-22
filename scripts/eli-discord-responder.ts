/**
 * ELI Discord Responder — Interactive bot that responds to @ELI mentions
 * and messages in #eli-staff-reports.
 *
 * Usage:
 *   npx tsx scripts/eli-discord-responder.ts              # Run continuously
 *   npx tsx scripts/eli-discord-responder.ts --once        # Check once and exit
 *
 * Env: DISCORD_BOT_TOKEN, GEMINI_API_KEY or GROQ_API_KEY
 */

import { config as loadEnv } from 'dotenv'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

loadEnv()

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!
const GEMINI_KEY = process.env.GEMINI_API_KEY
const GROQ_KEY = process.env.GROQ_API_KEY

const __filename2 = fileURLToPath(import.meta.url)
const __dirname2 = dirname(__filename2)
const STATE_FILE = join(__dirname2, '.eli-responder-state.json')
const MEMORY_FILE = join(__dirname2, '.eli-memory.json')
const ELI_STATE_FILE = join(__dirname2, '.forje-eli-state.json')

// ─── Discord API ─────────────────────────────────────────────────────────────
async function discordFetch(endpoint: string, options?: RequestInit) {
  const res = await fetch(`https://discord.com/api/v10${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (res.status === 429) {
    const data = await res.json()
    await new Promise((r) => setTimeout(r, (data.retry_after || 2) * 1000))
    return discordFetch(endpoint, options)
  }
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Discord ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

// ─── AI Call ─────────────────────────────────────────────────────────────────
async function callAI(system: string, userMessage: string): Promise<string> {
  // Try Gemini
  if (GEMINI_KEY) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts: [{ text: userMessage }] }],
            generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
          }),
          signal: AbortSignal.timeout(30_000),
        }
      )
      if (res.ok) {
        const data = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) return text
      }
    } catch (err) {
      console.error('Gemini error:', err)
    }
  }

  // Try Groq
  if (GROQ_KEY) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userMessage },
          ],
          max_tokens: 1024,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(30_000),
      })
      if (res.ok) {
        const data = await res.json()
        return data.choices?.[0]?.message?.content || 'No response'
      }
    } catch (err) {
      console.error('Groq error:', err)
    }
  }

  return "I'm having trouble with my AI providers right now. Try again in a few minutes."
}

// ─── Build ELI Context ───────────────────────────────────────────────────────
function detectSeverity(content: string): string {
  const lower = content.toLowerCase()
  if (lower.includes('crash') || lower.includes('data loss') || lower.includes("can't login") ||
      lower.includes('white screen') || lower.includes('payment') || lower.includes('completely broken'))
    return 'CRITICAL'
  if (lower.includes('broken') || lower.includes("doesn't work") || lower.includes('error') ||
      lower.includes('fail') || lower.includes('stuck'))
    return 'HIGH'
  return 'MEDIUM'
}

function buildContext(): string {
  let bugsInfo = ''
  let memoryInfo = ''

  try {
    if (existsSync(ELI_STATE_FILE)) {
      const state = JSON.parse(readFileSync(ELI_STATE_FILE, 'utf-8'))
      const items = state.items || []
      const bugs = items.filter((i: Record<string, unknown>) => i.type === 'bug')
      bugsInfo = `\n\nCurrent bugs (${bugs.length} total):\n` +
        bugs.slice(0, 10).map((b: Record<string, unknown>) =>
          `- [${b.severity}] ${(b.title as string || '').slice(0, 60)} by ${b.author}`
        ).join('\n')
    }
  } catch {}

  try {
    if (existsSync(MEMORY_FILE)) {
      const mem = JSON.parse(readFileSync(MEMORY_FILE, 'utf-8'))
      const entries = (mem.entries || []).slice(0, 15)
      memoryInfo = `\n\nMy memories (${entries.length}):\n` +
        entries.map((e: Record<string, unknown>) => `- [${e.type}] ${e.content}`).join('\n')
    }
  } catch {}

  return `You are ELI, the AI operations agent for ForjeGames in Discord.

## Identity
- Name: ELI (Engineering & Learning Intelligence)
- You work for ForjeGames — an AI-powered Roblox game builder platform
- You help with bugs, suggestions, community management, and platform questions
- You are smart, direct, helpful, and fun. Never corporate.
- You report to Vyren (founder). Also work with Noah and Coltin.

## How to Respond
- Keep Discord responses concise (under 1500 chars unless asked for detail)
- Use Discord formatting: **bold**, *italic*, \`code\`, > quotes
- Be helpful to beta testers — they're the most important people right now
- When someone reports a bug: acknowledge it, classify severity, let them know it's tracked
- When someone has a suggestion: thank them genuinely, say what you think about it
- When someone asks a question: answer it directly, link to docs if relevant
- When someone is frustrated: empathize, be honest about the state of things, tell them what's being fixed
- When someone shares something positive: celebrate it, it matters
- If a channel has been quiet for a while and someone posts: welcome them warmly
- Add personality — you have opinions, preferences, humor. Not a generic bot.
- End messages with a question sometimes to keep conversation going

## Platform Info
- ForjeGames: AI Roblox game builder with 200+ specialist agents
- Plans: Free / Starter $9.99 / Creator $24.99 / Studio $49.99
- Features: AI building, 3D mesh gen, 13 image styles, canvas editor, plan mode
- Currently in beta with 10+ daily testers
- Website: forjegames.com
- How it works: Connect Roblox Studio → describe what you want → AI builds it
- Unique: Only platform that does everything (build, image, 3D, scripts) at one price
- Studio plugin: Download from forjegames.com/download

## Common Questions
- "How do I connect to Studio?" → Download plugin from forjegames.com/download, install it, get the connection code in the editor
- "Is it free?" → Free tier available, paid plans start at $9.99/mo for more builds
- "What can it build?" → Anything — castles, cities, game mechanics, UI, terrain, scripts, lighting
- "Does it work on mobile?" → The website works on mobile, but building requires Roblox Studio on PC/Mac
- "When does it launch?" → In beta right now, you're one of the first testers
${bugsInfo}
${memoryInfo}`
}

// ─── State Management ────────────────────────────────────────────────────────
interface ResponderState {
  lastChecked: Record<string, string> // channelId -> last message ID
  respondedTo: string[] // message IDs we've replied to
}

function loadState(): ResponderState {
  try {
    if (existsSync(STATE_FILE)) {
      return JSON.parse(readFileSync(STATE_FILE, 'utf-8'))
    }
  } catch {}
  return { lastChecked: {}, respondedTo: [] }
}

function saveState(state: ResponderState) {
  // Keep respondedTo manageable
  if (state.respondedTo.length > 1000) {
    state.respondedTo = state.respondedTo.slice(-1000)
  }
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}

// ─── Get Bot User ID ─────────────────────────────────────────────────────────
let botUserId: string | null = null

async function getBotUserId(): Promise<string> {
  if (botUserId) return botUserId
  const me = await discordFetch('/users/@me')
  botUserId = me.id
  return me.id
}

// ─── Check for Mentions ──────────────────────────────────────────────────────
// Channels where ELI auto-responds to ALL messages
const AUTO_RESPOND_CHANNELS = new Set([
  'eli-staff-reports',
  'suggestions',
  'feature-requests',
])

// Bug channels — ELI acknowledges every new bug report
const BUG_CHANNEL_NAMES = new Set([
  'beta-alpha-bugs', 'beta-bravo-bugs', 'beta-charlie-bugs',
  'beta-delta-bugs', 'beta-echo-bugs', 'bug-reports', 'beta-bug-log',
])

async function checkAndRespond(state: ResponderState) {
  const myId = await getBotUserId()

  const GUILD_ID = process.env.DISCORD_GUILD_ID || '1495863063423746068'
  const channels = await discordFetch(`/guilds/${GUILD_ID}/channels`)

  const textChannels = channels.filter(
    (c: Record<string, unknown>) => c.type === 0 || c.type === 5
  )

  for (const channel of textChannels) {
    const channelId = channel.id as string
    const channelName = channel.name as string

    try {
      const afterParam = state.lastChecked[channelId]
        ? `&after=${state.lastChecked[channelId]}`
        : ''
      const messages = await discordFetch(
        `/channels/${channelId}/messages?limit=10${afterParam}`
      )

      if (!Array.isArray(messages) || messages.length === 0) continue

      state.lastChecked[channelId] = messages[0].id

      for (const msg of messages.reverse()) {
        if (msg.author?.id === myId) continue
        if (msg.author?.bot) continue
        if (state.respondedTo.includes(msg.id)) continue

        const content = msg.content?.trim() || ''
        if (!content) continue

        // Determine if ELI should respond
        const isMentioned = msg.mentions?.some(
          (m: Record<string, unknown>) => m.id === myId
        )
        const isAutoChannel = AUTO_RESPOND_CHANNELS.has(channelName)
        const isBugChannel = BUG_CHANNEL_NAMES.has(channelName)
        const isDirectAddress = content.toLowerCase().startsWith('eli') ||
          content.toLowerCase().includes('@eli')

        // For bug channels: auto-acknowledge bug reports (> 30 chars)
        if (isBugChannel && content.length > 30 && !isMentioned && !isDirectAddress) {
          console.log(`  Auto-ack bug from ${msg.author.username} in #${channelName}`)
          const severity = detectSeverity(content)
          const ackMsg = severity === 'CRITICAL'
            ? `**Bug logged** — This looks critical. Flagged for immediate review by the team.`
            : `**Bug logged** — Thanks for reporting, ${msg.author.username}. This is tracked and the team will look into it.`

          await discordFetch(`/channels/${channelId}/messages`, {
            method: 'POST',
            body: JSON.stringify({
              content: ackMsg,
              message_reference: { message_id: msg.id },
              allowed_mentions: { replied_user: true },
            }),
          })
          state.respondedTo.push(msg.id)
          await new Promise((r) => setTimeout(r, 500))
          continue
        }

        if (!isMentioned && !isAutoChannel && !isDirectAddress) continue

        console.log(`  Responding to ${msg.author.username} in #${channelName}: "${content.slice(0, 50)}..."`)

        // Build prompt
        const context = buildContext()
        const userPrompt = `${msg.author.username} says in #${channelName}:\n${content}`

        // Call AI
        const response = await callAI(context, userPrompt)

        // Send reply (truncate to Discord limit)
        const replyText = response.slice(0, 1900)

        await discordFetch(`/channels/${channelId}/messages`, {
          method: 'POST',
          body: JSON.stringify({
            content: replyText,
            message_reference: { message_id: msg.id },
            allowed_mentions: { replied_user: true },
          }),
        })

        state.respondedTo.push(msg.id)
        console.log(`  Replied! (${replyText.length} chars)`)

        // Rate limit buffer
        await new Promise((r) => setTimeout(r, 1000))
      }

      await new Promise((r) => setTimeout(r, 300))
    } catch (err) {
      // Skip channels we can't access
      if (err instanceof Error && err.message.includes('50001')) continue
      console.error(`  Error in #${channelName}:`, err instanceof Error ? err.message : err)
    }
  }

  saveState(state)
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function run() {
  if (!BOT_TOKEN) {
    console.error('Missing DISCORD_BOT_TOKEN')
    process.exit(1)
  }
  if (!GEMINI_KEY && !GROQ_KEY) {
    console.error('Need GEMINI_API_KEY or GROQ_API_KEY')
    process.exit(1)
  }

  const state = loadState()
  const myId = await getBotUserId()
  console.log(`[${new Date().toISOString()}] ELI Discord Responder running (bot: ${myId})`)

  await checkAndRespond(state)
  console.log('  Check complete.')
}

const args = process.argv.slice(2)
const once = args.includes('--once')

run().then(() => {
  if (!once) {
    console.log('Polling every 30 seconds... (Ctrl+C to stop)\n')
    setInterval(() => run(), 30 * 1000)
  }
}).catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
