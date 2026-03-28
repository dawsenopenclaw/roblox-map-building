import { Hono } from 'hono'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { aiRateLimit } from '../middleware/security'
import { runInSandbox, SandboxTimeoutError, SandboxError } from '../lib/sandbox'
import { db } from '../lib/db'

const schema = z.object({
  code: z.string().max(50000), // 50KB max
  timeoutMs: z.number().int().min(100).max(5000).optional().default(5000),
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHono = Hono<any>
export const sandboxRoutes: AnyHono = new Hono()

sandboxRoutes.post(
  '/execute',
  aiRateLimit,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  zValidator('json', schema as any),
  async (c) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { code, timeoutMs } = (c.req as any).valid('json') as z.infer<typeof schema>
    // clerkId may not be present during early Phase 1 (no auth middleware applied yet)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clerkId = ((c as any).get('clerkId') as string | undefined) || null

    let userId: string | undefined
    if (clerkId) {
      const user = await db.user.findUnique({ where: { clerkId } })
      userId = user?.id
    }

    try {
      const result = await runInSandbox(code, { timeoutMs, memoryLimitMb: 128 })

      await db.auditLog.create({
        data: {
          userId: userId || null,
          action: 'SANDBOX_EXECUTE',
          resource: 'sandbox',
          metadata: {
            codeLength: code.length,
            durationMs: result.durationMs,
            exitCode: result.exitCode,
          },
        },
      })

      return c.json(result)
    } catch (err) {
      if (err instanceof SandboxTimeoutError) {
        return c.json({ error: 'Execution timed out', durationMs: timeoutMs }, 408)
      }
      if (err instanceof SandboxError) {
        return c.json({ error: 'Execution failed', stderr: err.stderr }, 422)
      }
      throw err
    }
  }
)
