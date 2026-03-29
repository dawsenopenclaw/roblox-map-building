import { NextRequest, NextResponse } from 'next/server'

interface ExecutePayload {
  command: string
  assetId?: number
  assetName?: string
  parameters?: Record<string, unknown>
}

/**
 * POST /api/studio/execute
 * Sends a command to the ForjeGames Roblox Studio plugin via a shared command queue.
 * The Studio plugin polls /api/studio/poll to receive pending commands.
 */

// In-memory queue (replace with Redis/DB for production multi-instance)
const commandQueue: Array<{ id: string; command: ExecutePayload; ts: number }> = []

export async function POST(req: NextRequest) {
  let body: ExecutePayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.command) {
    return NextResponse.json({ error: 'command is required' }, { status: 400 })
  }

  const entry = {
    id: `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    command: body,
    ts: Date.now(),
  }

  commandQueue.push(entry)

  // Keep queue bounded
  if (commandQueue.length > 100) commandQueue.splice(0, commandQueue.length - 100)

  return NextResponse.json({
    queued: true,
    commandId: entry.id,
    message: `Command "${body.command}" queued for Studio. Make sure the ForjeGames plugin is running in Roblox Studio.`,
  })
}

export async function GET(_req: NextRequest) {
  // Studio plugin polls this to drain the queue
  const pending = commandQueue.splice(0)
  return NextResponse.json({ commands: pending })
}
