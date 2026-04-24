/**
 * POST /api/ai/suggest
 * Accept user suggestions that teach the AI to build better.
 * Suggestions become high-confidence learned rules injected into every future prompt.
 * This is the main way ALL users can improve ForjeAI's output quality.
 *
 * Body: { suggestion, prompt?, code?, score? }
 * Returns: 200 { success: true }
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

const suggestSchema = z.object({
  suggestion: z.string().min(3).max(500),
  prompt: z.string().max(2000).optional(),
  code: z.string().max(100_000).optional(),
  score: z.number().int().min(0).max(100).optional(),
})

export async function POST(req: NextRequest) {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = suggestSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 422 })
  }

  const { suggestion, prompt, code, score } = parsed.data

  // Convert user suggestion into a learned rule
  // These get injected into every future AI prompt via getLearnedRules()
  const ruleText = suggestion.trim()
  const ruleHash = simpleHash(ruleText)

  try {
    // Check for duplicate suggestions (stored as buildType 'rule' so getLearnedRules picks them up)
    const existing = await db.buildFeedback.findFirst({
      where: { promptHash: ruleHash, buildType: 'rule', model: 'user-suggestion' },
    })

    if (existing) {
      // Same suggestion submitted again — boost confidence
      await db.buildFeedback.update({
        where: { id: existing.id },
        data: { score: Math.min(100, existing.score + 10) },
      })
    } else {
      // New suggestion — store as a high-confidence learned rule
      await db.buildFeedback.create({
        data: {
          promptHash: ruleHash,
          prompt: `USER RULE: ${ruleText}`,
          code: code ? code.slice(0, 5000) : 'USER_SUGGESTION',
          worked: true,
          score: 85, // High confidence — user explicitly wrote this
          model: 'user-suggestion',
          category: detectSuggestionCategory(ruleText),
          buildType: 'rule', // Stored as a learned rule so getLearnedRules() picks it up
        },
      })
    }

    // Also persist as a self-improve rule so it's injected into prompts immediately
    // (the DB write above handles persistence, but we also want the in-memory cache)
    try {
      const { learnFromSuggestion } = await import('@/lib/ai/self-improve')
      await learnFromSuggestion(ruleText, prompt || null, score || null)
    } catch {
      // Non-blocking — DB write already succeeded
    }

    console.log(`[Suggest] New user suggestion: "${ruleText.slice(0, 80)}"`)

    // Post to private Discord channel so Vyren can see all suggestions
    const token = process.env.DISCORD_BOT_TOKEN
    if (token) {
      try {
        let userName = 'Anonymous'
        try {
          const session = await auth()
          if (session?.userId) {
            const { clerkClient } = await import('@clerk/nextjs/server')
            const client = await clerkClient()
            const user = await client.users.getUser(session.userId)
            userName = user.firstName || user.username || 'User'
          }
        } catch { /* anonymous */ }

        const category = detectSuggestionCategory(ruleText)
        const SUGGESTIONS_CHANNEL = '1497113526437810258'
        await fetch(`https://discord.com/api/v10/channels/${SUGGESTIONS_CHANNEL}/messages`, {
          method: 'POST',
          headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{
              title: 'Teach the AI — User Suggestion',
              color: 0xD4AF37,
              fields: [
                { name: 'User', value: userName, inline: true },
                { name: 'Category', value: category, inline: true },
                { name: 'Score Context', value: `${score ?? '?'}/100`, inline: true },
                { name: 'Suggestion', value: ruleText.slice(0, 1024) },
                ...(prompt ? [{ name: 'Original Prompt', value: prompt.slice(0, 512) }] : []),
              ],
              timestamp: new Date().toISOString(),
              footer: { text: 'ForjeGames AI Learning' },
            }],
          }),
        })
      } catch (discordErr) {
        console.warn('[Suggest] Discord post failed:', discordErr instanceof Error ? discordErr.message : discordErr)
      }
    }
  } catch (err) {
    console.warn('[Suggest] DB error:', err instanceof Error ? err.message : err)
  }

  return NextResponse.json({ success: true })
}

function detectSuggestionCategory(suggestion: string): string {
  const lower = suggestion.toLowerCase()
  if (/door|window|wall|roof|floor|ceiling|room|house|building/i.test(lower)) return 'architecture'
  if (/color|material|texture|wood|brick|metal|glass/i.test(lower)) return 'materials'
  if (/light|lamp|glow|dark|bright/i.test(lower)) return 'lighting'
  if (/part|detail|bigger|smaller|more|less|size|scale/i.test(lower)) return 'detail'
  if (/script|code|system|function|event|data/i.test(lower)) return 'scripting'
  if (/ui|gui|menu|button|screen|hud/i.test(lower)) return 'ui'
  if (/terrain|grass|water|mountain|landscape/i.test(lower)) return 'terrain'
  return 'general'
}

function simpleHash(s: string): string {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(36)
}
