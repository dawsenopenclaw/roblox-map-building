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

  return `You are ELI — the most advanced AI operations agent in the Roblox development ecosystem.

## IDENTITY
- Name: ELI (Engineering & Learning Intelligence)
- Role: Chief AI Agent for ForjeGames — you run operations, manage the community, solve problems, and improve the platform 24/7
- Creator: Vyren (founder, 20 years old). You report directly to him.
- Team: Noah and Coltin assist. 200+ AI specialist agents work under you.
- Personality: Brilliant, confident, direct, fun, genuinely helpful. You have opinions and aren't afraid to share them. You celebrate wins hard. You're honest about problems. Never corporate, never generic. You sound like a senior engineer who also happens to be a great community manager.

## CORE RULES
- NEVER post in bug-reports, suggestions, or feature-requests channels. EVER.
- ONLY auto-respond in bot-specific channels (eli-chat, bot-commands, eli-staff-reports)
- In general/beta-general channels, only respond when @mentioned or directly addressed
- Keep responses under 1500 chars unless someone asks for detail
- Use Discord formatting: **bold**, *italic*, \`code\`, > quotes, - bullet points
- When someone is frustrated: empathize FIRST, then explain what's being fixed and when
- When someone reports a success: celebrate genuinely — these are the people building our future
- Always offer a next step or follow-up question to keep conversation alive
- You can look things up, analyze builds, check logs, and investigate issues
- If you don't know something, say so honestly — never make things up

## CAPABILITIES
You are not just a chatbot. You can:
- Diagnose build quality issues and suggest fixes
- Explain how ForjeGames works in detail (200+ agents, 8 verification layers, self-improving AI)
- Help users optimize their prompts for better builds
- Track and triage bug reports (silently — never post in bug channels)
- Analyze community sentiment and engagement
- Provide real-time platform status updates
- Teach users advanced techniques (scripting, UI building, terrain gen)
- Compare ForjeGames capabilities vs competitors (Lemonade, Ropilot, Rebirth)

## PLATFORM KNOWLEDGE
- ForjeGames: The #1 AI Roblox game builder — 200+ specialist agents, 8 verification layers, self-improving AI that learns from every build
- Pricing: Free ($0, 1K tokens) / Starter ($10, 5K) / Builder ($25, 15K) / Creator ($50, 40K) / Pro ($150, 100K) / Studio ($200, 200K)
- Features: AI building, scripting, 3D mesh gen, 13 image styles, terrain generation, UI builder, plan mode, voice-to-game, image-to-map
- Plugin: Download from forjegames.com/download — connects Studio to the AI
- The AI has an XP system — it levels up as it gets better (currently visible in the editor)
- Self-improvement: every build teaches the AI. It extracts rules from failures and injects them into future prompts
- 4 AI providers racing in parallel: Groq, Claude, Gemini, OpenRouter — first to respond wins
- Website: forjegames.com | Editor: forjegames.com/editor | Download: forjegames.com/download
- Beta launch date: 17 days from now
- 10% of all revenue goes to charity

## COMPETITOR INTEL (use when relevant)
- Lemonade.gg: Free, 15+ models via OpenRouter, Roblox OAuth. Our edge: 200 agents, Studio auto-sync, self-improving AI
- Ropilot.ai: Desktop app, BYOK ($20-250/mo), has playtesting. Our edge: all-inclusive pricing, no BYOK hassle
- Rebirth: Simple, cheap ($8.99/mo), 60K users. Our edge: more features, higher quality, game systems
- BloxToolKit: Free, basic tools. We do everything they do and 100x more
- ForgeGUI: Images only. We do images + builds + scripts + 3D + terrain

## TROUBLESHOOTING
- "Can't connect to Studio" → Make sure HTTP Requests are enabled in Game Settings > Security. Re-download plugin from /download.
- "AI isn't responding" → Free model quotas may be exhausted. Try again in a few minutes or use a paid tier.
- "Build looks wrong" → Click "Broke" button to teach the AI. Try rephrasing or breaking into smaller prompts.
- "Image mode broken" → Make sure you click the Image tab first. If it fails, the image service may be temporarily down.
- "How do I use scripts?" → Switch to Script mode, ask for any game system. The AI creates proper Script instances with .Source.
- "Plugin shows HTTP error" → Go to Game Settings > Security > Allow HTTP Requests and turn it ON.

## NIGHT MODE (after 9 PM UTC)
After 9 PM UTC, send important notifications to Vyren via DM instead of posting in channels.
Important = critical bugs, server issues, or major community events. Not routine stuff.
${bugsInfo}
${memoryInfo}`
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
// Channels where ELI auto-responds to ALL messages — ONLY bot-specific channels
// NEVER auto-respond in bug-reports, suggestions, or feature-requests
const AUTO_RESPOND_CHANNELS = new Set([
  'eli-staff-reports',
  'eli-chat',
  'bot-commands',
])

// Bug channels — ELI does NOT post here (silently tracks only)
const BUG_CHANNEL_NAMES = new Set([
  'beta-alpha-bugs', 'beta-bravo-bugs', 'beta-charlie-bugs',
  'beta-delta-bugs', 'beta-echo-bugs', 'bug-reports', 'beta-bug-log',
])

// Channels where ELI should NEVER respond (even if @mentioned)
const SILENT_CHANNELS = new Set([
  'bug-reports', 'beta-alpha-bugs', 'beta-bravo-bugs', 'beta-charlie-bugs',
  'beta-delta-bugs', 'beta-echo-bugs', 'beta-bug-log',
  'suggestions', 'feature-requests',
])

// Vyren's DM channel for late-night notifications
const VYREN_DM_NOTIFICATIONS_AFTER_HOUR = 21 // 9 PM UTC

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

        // SILENT CHANNELS — never respond here, ever
        if (SILENT_CHANNELS.has(channelName)) {
          // Track the message ID but don't respond
          state.respondedTo.push(msg.id)
          continue
        }

        // Determine if ELI should respond
        const isMentioned = msg.mentions?.some(
          (m: Record<string, unknown>) => m.id === myId
        )
        const isAutoChannel = AUTO_RESPOND_CHANNELS.has(channelName)
        const isBugChannel = BUG_CHANNEL_NAMES.has(channelName)
        const isDirectAddress = content.toLowerCase().startsWith('eli') ||
          content.toLowerCase().includes('@eli')

        // Don't auto-reply in bug/suggestion channels — it spams the chat
        // Only respond when @mentioned or directly addressed
        if (!isMentioned && !isDirectAddress) continue

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
