/**
 * Discord Interaction Webhook — Receives slash commands and message events
 *
 * Discord sends interactions here when:
 * - Someone uses a slash command (/eli)
 * - A component interaction occurs
 *
 * Setup: In Discord Developer Portal → Application → General Information → Interactions Endpoint URL
 * Set to: https://forjegames.com/api/webhooks/discord
 *
 * For now this also serves as a general webhook endpoint for Discord bot events.
 */

import { NextRequest, NextResponse } from 'next/server'

// Discord interaction types
const PING = 1
const APPLICATION_COMMAND = 2

export async function POST(req: NextRequest) {
  const body = await req.text()
  let data: Record<string, unknown>

  try {
    data = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Discord sends a PING to verify the endpoint
  if (data.type === PING) {
    return NextResponse.json({ type: 1 })
  }

  // Slash command: /eli <message>
  if (data.type === APPLICATION_COMMAND) {
    const commandName = (data.data as Record<string, unknown>)?.name
    const options = (data.data as Record<string, unknown>)?.options as Array<Record<string, unknown>> | undefined
    const userMessage = options?.find((o) => o.name === 'message')?.value as string || ''
    const user = (data.member as Record<string, unknown>)?.user as Record<string, unknown> || data.user as Record<string, unknown>
    const username = (user?.username as string) || 'unknown'

    if (commandName === 'eli' && userMessage) {
      // Defer the response (we'll follow up)
      // For now, respond immediately with a processing message
      // In production, use deferred responses for AI calls

      // Quick response — ELI will process and follow up
      return NextResponse.json({
        type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
        data: {
          content: `Processing your request, ${username}... ELI is thinking.`,
          flags: 64, // Ephemeral — only sender sees this
        },
      })
    }
  }

  // Unknown interaction type
  return NextResponse.json({ type: 1 })
}

// Also support GET for health checks
export async function GET() {
  return NextResponse.json({ status: 'ok', agent: 'ELI', version: 4 })
}
