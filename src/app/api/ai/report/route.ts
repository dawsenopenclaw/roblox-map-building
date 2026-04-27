/**
 * POST /api/ai/report
 * User bug reports from the editor → saves to DB + posts to Discord bug channel.
 * Includes: user feedback, the AI's response, the original prompt, quality score.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { deliverWebhook } from '@/lib/webhook-retry'

const reportSchema = z.object({
  feedback: z.string().min(3).max(1000),
  aiResponse: z.string().max(3000).optional(),
  userPrompt: z.string().max(1000).optional(),
  luauCode: z.string().max(10000).optional(),
  qualityScore: z.number().int().min(0).max(100).optional(),
  model: z.string().max(100).optional(),
  intent: z.string().max(50).optional(),
  isNegative: z.boolean().optional(),
})

const BUG_CHANNEL_ID = '1495873976990306514' // beta-alpha-bugs

export async function POST(req: NextRequest) {
  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = reportSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message }, { status: 422 })
  }

  const { feedback, aiResponse, userPrompt, luauCode, qualityScore, model, intent, isNegative } = parsed.data

  // Get user info
  let userName = 'Anonymous'
  let userEmail = ''
  let userId = ''
  try {
    const session = await auth()
    if (session?.userId) {
      userId = session.userId
      const { clerkClient } = await import('@clerk/nextjs/server')
      const client = await clerkClient()
      const user = await client.users.getUser(session.userId)
      userName = user.firstName || user.username || 'Unknown'
      userEmail = user.emailAddresses?.[0]?.emailAddress || ''
    }
  } catch { /* anonymous report */ }

  // Save to DB as feedback
  try {
    await db.buildFeedback.create({
      data: {
        promptHash: `report_${Date.now()}`,
        prompt: userPrompt || feedback,
        code: luauCode || aiResponse || 'BUG_REPORT',
        worked: false,
        score: qualityScore ?? 10,
        model: model || 'user-report',
        category: 'bug-report',
        buildType: 'rule',
        userVote: false,
        errorMessage: feedback,
      },
    })
  } catch (dbErr) {
    console.warn('[Report] DB save failed:', dbErr instanceof Error ? dbErr.message : dbErr)
  }

  // Post to Discord
  const token = process.env.DISCORD_BOT_TOKEN
  if (token) {
    try {
      const codeSnippet = luauCode ? luauCode.slice(0, 300) : ''
      const embed = {
        title: isNegative ? 'Bug Report' : 'User Feedback',
        color: isNegative ? 0xEF4444 : 0xD4AF37,
        fields: [
          { name: 'User', value: `${userName}${userEmail ? ` (${userEmail})` : ''}`, inline: true },
          { name: 'Intent', value: intent || 'unknown', inline: true },
          { name: 'Score', value: `${qualityScore ?? '?'}/100`, inline: true },
          { name: 'Model', value: model || 'unknown', inline: true },
          { name: 'Feedback', value: feedback.slice(0, 1024) },
          ...(userPrompt ? [{ name: 'User Prompt', value: userPrompt.slice(0, 512) }] : []),
          ...(aiResponse ? [{ name: 'AI Response (preview)', value: aiResponse.slice(0, 512) }] : []),
          ...(codeSnippet ? [{ name: 'Code (preview)', value: '```lua\n' + codeSnippet + '\n```' }] : []),
        ],
        timestamp: new Date().toISOString(),
        footer: { text: `ForjeGames Bug Report${userId ? ` | ${userId}` : ''}` },
      }

      const discordUrl = `https://discord.com/api/v10/channels/${BUG_CHANNEL_ID}/messages`
      const result = await deliverWebhook({
        url: discordUrl,
        body: JSON.stringify({ embeds: [embed] }),
        headers: { Authorization: `Bot ${token}` },
        source: 'discord',
      })
      if (result.success) {
        console.log(`[Report] Posted to Discord #beta-alpha-bugs: "${feedback.slice(0, 60)}"`)
      } else {
        console.warn(`[Report] Discord delivery queued for retry id=${result.id}`)
      }
    } catch (discordErr) {
      console.warn('[Report] Discord post failed:', discordErr instanceof Error ? discordErr.message : discordErr)
    }
  }

  // Also save as learned rule so AI avoids this pattern
  if (isNegative && feedback.length > 10) {
    try {
      const { learnFromSuggestion } = await import('@/lib/ai/self-improve')
      await learnFromSuggestion(`AVOID: ${feedback}`, userPrompt || null, qualityScore || null)
    } catch { /* non-blocking */ }
  }

  return NextResponse.json({ success: true })
}
