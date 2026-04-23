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
const MESSAGE_COMPONENT = 3 // Buttons, select menus, etc.

// Team role IDs — map custom_id values to Discord role IDs
// These need to match the role IDs in the Discord server
const GUILD_ID = process.env.DISCORD_GUILD_ID || '1495863063423746068'

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

  // Component interaction — team selection, buttons, etc.
  if (data.type === MESSAGE_COMPONENT) {
    const componentData = data.data as Record<string, unknown> | undefined
    const customId = componentData?.custom_id as string || ''
    const values = componentData?.values as string[] || []
    const member = data.member as Record<string, unknown> | undefined
    const userId = (member?.user as Record<string, unknown>)?.id as string || ''

    // Team selection dropdown
    if (customId === 'team_select' || customId.startsWith('team_')) {
      const selectedRole = values[0]
      if (selectedRole && userId) {
        try {
          const token = process.env.DISCORD_BOT_TOKEN
          if (token) {
            // Add the selected role to the user
            const res = await fetch(
              `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}/roles/${selectedRole}`,
              {
                method: 'PUT',
                headers: { Authorization: `Bot ${token}` },
              }
            )
            if (res.ok) {
              return NextResponse.json({
                type: 4,
                data: {
                  content: `You've been assigned to the team! Check your new channels.`,
                  flags: 64,
                },
              })
            } else {
              console.error('[Discord] Role assign failed:', res.status, await res.text().catch(() => ''))
            }
          }
        } catch (err) {
          console.error('[Discord] Team select error:', err instanceof Error ? err.message : err)
        }
      }

      // Fallback — acknowledge even if role assignment fails
      return NextResponse.json({
        type: 4,
        data: {
          content: `Team selection received! If your roles didn't update, ask a moderator for help.`,
          flags: 64,
        },
      })
    }

    // Generic component acknowledgement — prevents "interaction failed"
    return NextResponse.json({
      type: 6, // DEFERRED_UPDATE_MESSAGE — silently acknowledge
    })
  }

  // Slash command: /eli <message>
  if (data.type === APPLICATION_COMMAND) {
    const commandName = (data.data as Record<string, unknown>)?.name
    const options = (data.data as Record<string, unknown>)?.options as Array<Record<string, unknown>> | undefined
    const userMessage = options?.find((o) => o.name === 'message')?.value as string || ''
    const user = (data.member as Record<string, unknown>)?.user as Record<string, unknown> || data.user as Record<string, unknown>
    const username = (user?.username as string) || 'unknown'

    if (commandName === 'eli' && userMessage) {
      return NextResponse.json({
        type: 4,
        data: {
          content: `Processing your request, ${username}... ELI is thinking.`,
          flags: 64,
        },
      })
    }
  }

  // Unknown interaction type — acknowledge to prevent "interaction failed"
  return NextResponse.json({ type: 6 })
}

// Also support GET for health checks
export async function GET() {
  return NextResponse.json({ status: 'ok', agent: 'ELI', version: 4 })
}
