/**
 * Studio command execution
 * POST /api/studio/execute — queues a command for the Studio plugin to execute
 * GET  /api/studio/execute/poll — Studio plugin polls for pending commands
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { requireAuth } from '../../middleware/auth'
import { redis } from '../../lib/redis'

export const executeRoutes = new Hono()

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface StudioCommand {
  id: string
  command: string
  args: Record<string, unknown>
  queuedAt: number
  status: 'pending' | 'executing' | 'done' | 'failed'
  result?: unknown
  error?: string
}

// ---------------------------------------------------------------------------
// Redis key helpers
// ---------------------------------------------------------------------------
function commandQueueKey(userId: string): string {
  return `studio:commands:${userId}`
}

function commandResultKey(userId: string, commandId: string): string {
  return `studio:commands:${userId}:result:${commandId}`
}

// ---------------------------------------------------------------------------
// Auth on all routes
// ---------------------------------------------------------------------------
executeRoutes.use('*', requireAuth)

// ---------------------------------------------------------------------------
// POST /api/studio/execute
// Web app enqueues a command for the Studio plugin to pick up and run.
// Body: { command: string, args: Record<string, unknown> }
// ---------------------------------------------------------------------------
const executeBodySchema = z.object({
  command: z.string().min(1).max(100),
  args: z.record(z.unknown()).default({}),
})

executeRoutes.post('/', zValidator('json', executeBodySchema), async (c) => {
  const userId = c.get('userId') as string
  const body   = c.req.valid('json')
  const now    = Math.floor(Date.now() / 1000)

  const cmd: StudioCommand = {
    id: `cmd_${now}_${Math.random().toString(36).slice(2, 8)}`,
    command: body.command,
    args: body.args,
    queuedAt: now,
    status: 'pending',
  }

  const queueKey = commandQueueKey(userId)

  try {
    await redis.rpush(queueKey, JSON.stringify(cmd))
    // Cap queue at 50 pending commands, TTL 10 minutes
    await redis.ltrim(queueKey, -50, -1)
    await redis.expire(queueKey, 600)
  } catch (err) {
    console.error('[studio/execute] Redis enqueue error:', err)
    return c.json({ error: 'Failed to queue command' }, 500)
  }

  return c.json(
    {
      queued: true,
      commandId: cmd.id,
      command: cmd.command,
      args: cmd.args,
      queuedAt: now,
    },
    200
  )
})

// ---------------------------------------------------------------------------
// GET /api/studio/execute/poll
// Studio plugin calls this to retrieve pending commands.
// Returns up to 10 pending commands and removes them from the queue.
// ---------------------------------------------------------------------------
executeRoutes.get('/poll', async (c) => {
  const userId   = c.get('userId') as string
  const queueKey = commandQueueKey(userId)

  let commands: StudioCommand[] = []

  try {
    const raw = await redis.lrange(queueKey, 0, 9)  // up to 10 at a time

    for (const item of raw) {
      try {
        commands.push(JSON.parse(item) as StudioCommand)
      } catch {
        // Skip malformed
      }
    }

    // Remove the commands we just returned
    if (commands.length > 0) {
      await redis.ltrim(queueKey, commands.length, -1)
    }
  } catch (err) {
    console.error('[studio/execute] Redis poll error:', err)
    return c.json({ commands: [], error: 'Redis unavailable' }, 200)
  }

  return c.json(
    {
      commands,
      count: commands.length,
      serverTime: Math.floor(Date.now() / 1000),
    },
    200
  )
})

// ---------------------------------------------------------------------------
// POST /api/studio/execute/result
// Studio plugin reports the result of a command it executed.
// Body: { commandId: string, status: 'done' | 'failed', result?: any, error?: string }
// ---------------------------------------------------------------------------
const resultBodySchema = z.object({
  commandId: z.string().min(1),
  status: z.enum(['done', 'failed']),
  result: z.unknown().optional(),
  error: z.string().optional(),
})

executeRoutes.post('/result', zValidator('json', resultBodySchema), async (c) => {
  const userId = c.get('userId') as string
  const body   = c.req.valid('json')
  const now    = Math.floor(Date.now() / 1000)

  const resultKey = commandResultKey(userId, body.commandId)
  const resultPayload = {
    commandId: body.commandId,
    status: body.status,
    result: body.result ?? null,
    error: body.error ?? null,
    completedAt: now,
  }

  try {
    // Store result for 5 minutes so the web app can poll for it
    await redis.set(resultKey, JSON.stringify(resultPayload), 'EX', 300)
  } catch (err) {
    console.error('[studio/execute] Redis result store error:', err)
    return c.json({ error: 'Failed to store result' }, 500)
  }

  return c.json({ stored: true, commandId: body.commandId }, 200)
})

// ---------------------------------------------------------------------------
// GET /api/studio/execute/result/:commandId
// Web app checks the result of a command.
// ---------------------------------------------------------------------------
executeRoutes.get('/result/:commandId', async (c) => {
  const userId    = c.get('userId') as string
  const commandId = c.req.param('commandId')

  if (!commandId) {
    return c.json({ error: 'Missing commandId' }, 400)
  }

  const resultKey = commandResultKey(userId, commandId)
  let raw: string | null = null

  try {
    raw = await redis.get(resultKey)
  } catch (err) {
    console.error('[studio/execute] Redis result fetch error:', err)
    return c.json({ error: 'Redis unavailable' }, 500)
  }

  if (!raw) {
    return c.json({ status: 'pending', commandId }, 200)
  }

  try {
    return c.json(JSON.parse(raw), 200)
  } catch {
    return c.json({ error: 'Corrupted result data' }, 500)
  }
})
