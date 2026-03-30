---
phase: 01-foundation
plan: D
type: execute
wave: 2
depends_on:
  - 01-PLAN-A
files_modified:
  - src/instrumentation.ts
  - src/app/sentry.client.config.ts
  - src/app/sentry.server.config.ts
  - src/app/sentry.edge.config.ts
  - src/lib/posthog.ts
  - src/app/(app)/dashboard/cost-tracker/page.tsx
  - src/app/api/internal/cost-snapshot/route.ts
  - apps/api/src/lib/sentry.ts
  - apps/api/src/middleware/security.ts
  - apps/api/src/routes/cost-tracker.ts
autonomous: true
requirements:
  - MON-01
  - MON-02
  - MON-03
  - MON-04
  - SEC-01
  - SEC-02
  - SEC-03

must_haves:
  truths:
    - "Unhandled errors in Next.js frontend are captured in Sentry with stack traces"
    - "Unhandled errors in Hono backend are captured in Sentry with stack traces"
    - "PostHog tracks page views automatically on every navigation"
    - "Daily API cost snapshot is stored in DailyCostSnapshot table and visible in cost dashboard"
    - "CORS headers block requests from non-whitelisted origins"
    - "Rate limiting returns 429 after exceeding configured threshold"
    - "All state-changing API calls are logged to AuditLog table with userId + timestamp"
    - "AI-generated code execution is sandboxed in Deno with 5s timeout and 128MB memory limit"
  artifacts:
    - path: "src/instrumentation.ts"
      provides: "Next.js instrumentation hook that initializes Sentry"
      contains: "Sentry.init"
    - path: "src/lib/posthog.ts"
      provides: "PostHog client singleton for server-side and client-side analytics"
      exports: ["posthog", "PostHogProvider"]
    - path: "apps/api/src/middleware/security.ts"
      provides: "Hono security middleware bundle: CORS, rate limit, audit log"
      exports: ["securityMiddleware"]
    - path: "src/app/(app)/dashboard/cost-tracker/page.tsx"
      provides: "Daily API cost dashboard UI"
    - path: "apps/api/src/routes/cost-tracker.ts"
      provides: "Hono route for querying DailyCostSnapshot records"
      exports: ["costTrackerRoutes"]
  key_links:
    - from: "src/instrumentation.ts"
      to: "Sentry DSN"
      via: "NEXT_PUBLIC_SENTRY_DSN env var"
      pattern: "dsn.*SENTRY_DSN"
    - from: "apps/api/src/lib/sentry.ts"
      to: "Sentry Node SDK"
      via: "@sentry/node init"
      pattern: "Sentry.init"
    - from: "apps/api/src/middleware/security.ts"
      to: "apps/api/src/middleware/rateLimit.ts"
      via: "Redis sliding window"
      pattern: "rateLimit"
    - from: "apps/api/src/routes/cost-tracker.ts"
      to: "db.dailyCostSnapshot"
      via: "Prisma findMany"
      pattern: "dailyCostSnapshot.findMany"
---

<objective>
Install and configure Sentry (error tracking), PostHog (analytics), a daily cost tracking dashboard, and apply the security hardening layer: CORS whitelisting, Redis rate limiting, audit logging, and Deno-based AI code sandboxing.

Purpose: The platform must be observable from day one. Errors must surface before users report them. Security hardening prevents abuse and protects user data. These primitives underpin every future feature.
Output: Sentry wired to Next.js and Hono, PostHog page view tracking, cost dashboard reading from DailyCostSnapshot, security middleware applied to all Hono routes, Deno sandbox for AI code execution.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-foundation/01-A-SUMMARY.md

<interfaces>
<!-- From Plan A -->

From apps/api/src/middleware/rateLimit.ts:
```typescript
export function rateLimit(limit: number, windowSec: number): MiddlewareHandler
```

From apps/api/src/middleware/audit.ts:
```typescript
export async function auditMiddleware(c: Context, next: Next): Promise<void>
```

From apps/api/src/middleware/cors.ts:
```typescript
export const corsMiddleware: MiddlewareHandler
```

From prisma/schema.prisma:
```prisma
model DailyCostSnapshot {
  id           String   @id @default(cuid())
  date         DateTime @unique @db.Date
  providerCosts Json    // { claude: number, deepgram: number, meshy: number, fal: number }
  totalCostUsd Float
  totalRevenue Float
  margin       Float
}

model AuditLog {
  id         String   @id @default(cuid())
  userId     String?
  action     String
  resource   String
  resourceId String?
  ipAddress  String?
  userAgent  String?
  metadata   Json?
  createdAt  DateTime @default(now())
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Sentry error tracking + PostHog analytics</name>
  <files>
    src/instrumentation.ts
    src/app/sentry.client.config.ts
    src/app/sentry.server.config.ts
    src/app/sentry.edge.config.ts
    src/lib/posthog.ts
    src/components/PostHogProvider.tsx
    src/app/layout.tsx
    apps/api/src/lib/sentry.ts
    apps/api/src/index.ts
  </files>
  <action>
Install dependencies:
- `npm install @sentry/nextjs --workspace=.`
- `npm install @sentry/node --workspace=apps/api`
- `npm install posthog-js posthog-node --workspace=.`

**Next.js Sentry configuration:**

**src/instrumentation.ts** — Next.js 15 instrumentation hook:
```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = async (err: unknown, request: Request, context: { routerKind: string; routePath?: string }) => {
  const Sentry = await import('@sentry/nextjs')
  Sentry.captureRequestError(err, request, context)
}
```

**src/app/sentry.server.config.ts:**
```typescript
import * as Sentry from '@sentry/nextjs'
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  integrations: [Sentry.prismaIntegration()],
  beforeSend(event) {
    // Strip PII from events
    if (event.user) {
      delete event.user.ip_address
    }
    return event
  },
})
```

**src/app/sentry.client.config.ts:**
```typescript
import * as Sentry from '@sentry/nextjs'
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  integrations: [
    Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
  ],
})
```

**src/app/sentry.edge.config.ts:**
```typescript
import * as Sentry from '@sentry/nextjs'
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
})
```

**next.config.ts** — wrap with Sentry's withSentryConfig:
Update next.config.ts to wrap the existing config:
```typescript
import { withSentryConfig } from '@sentry/nextjs'
// ... existing nextConfig ...
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
})
```

**PostHog setup:**

**src/lib/posthog.ts** — server-side PostHog client:
```typescript
import { PostHog } from 'posthog-node'

let _client: PostHog | null = null

export function getPostHogClient() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null
  if (!_client) {
    _client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      flushAt: 20,
      flushInterval: 10000,
    })
  }
  return _client
}

export async function captureEvent(distinctId: string, event: string, properties?: Record<string, unknown>) {
  const client = getPostHogClient()
  if (!client) return
  client.capture({ distinctId, event, properties: { ...properties, $app: 'forjegames' } })
}

export async function identifyUser(distinctId: string, properties: { email?: string; tier?: string; isUnder13?: boolean }) {
  const client = getPostHogClient()
  if (!client) return
  client.identify({ distinctId, properties })
}
```

**src/components/PostHogProvider.tsx** — client-side PostHog with automatic page view tracking:
```tsx
'use client'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    capture_pageview: false, // Manual control
    persistence: 'localStorage',
    autocapture: true,
    disable_session_recording: false,
  })
}

function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.capture('$pageview', { $current_url: window.location.href })
    }
  }, [pathname, searchParams])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return <>{children}</>
  return (
    <PHProvider client={posthog}>
      <PageViewTracker />
      {children}
    </PHProvider>
  )
}
```

**Update src/app/layout.tsx** to wrap children with PostHogProvider:
```tsx
import { PostHogProvider } from '@/components/PostHogProvider'
// In the <body>:
<PostHogProvider>{children}</PostHogProvider>
```

**apps/api/src/lib/sentry.ts** — Sentry for Hono backend:
```typescript
import * as Sentry from '@sentry/node'

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    enabled: !!process.env.SENTRY_DSN,
    integrations: [Sentry.prismaIntegration(), Sentry.httpIntegration()],
  })
}

export function captureException(err: unknown, context?: Record<string, unknown>) {
  Sentry.captureException(err, { extra: context })
}
```

**Update apps/api/src/index.ts** to call `initSentry()` before app creation:
```typescript
import { initSentry } from './lib/sentry'
initSentry() // Must be first
// ... rest of app setup
```

Also update app.onError to capture to Sentry:
```typescript
app.onError((err, c) => {
  captureException(err, { path: c.req.path, method: c.req.method })
  return c.json({ error: 'Internal server error' }, 500)
})
```

Add SENTRY_DSN (backend) to .env.example alongside NEXT_PUBLIC_SENTRY_DSN (frontend). They can be the same DSN or separate projects.
  </action>
  <verify>
    <automated>cd "C:/Users/Dawse/OneDrive/Desktop/roblox-map-building" && npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0"</automated>
  </verify>
  <done>
    TypeScript compiles without errors.
    src/instrumentation.ts exports register() and onRequestError().
    Sentry init called in server, client, and edge configs with DSN from env.
    PostHogProvider wraps the app layout and tracks page views on navigation.
    apps/api Sentry initialized before Hono app creation.
    app.onError captures exceptions to Sentry.
    Replay integration enabled (session replay on errors).
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Security hardening — CORS, rate limiting, audit logging, Deno sandbox</name>
  <files>
    apps/api/src/middleware/security.ts
    apps/api/src/lib/sandbox.ts
    apps/api/src/routes/sandbox.ts
    src/app/api/internal/sandbox/route.ts
  </files>
  <behavior>
    - corsMiddleware: returns 403 for requests from non-whitelisted origins
    - rateLimit(100, 60): returns 429 after 101 requests in 60 seconds for same IP
    - auditMiddleware: creates AuditLog row for every POST/PUT/PATCH/DELETE request
    - runInSandbox(code, timeout): executes code string in Deno subprocess, throws after timeout ms
    - runInSandbox('console.log("hello")', 5000): succeeds with stdout "hello"
    - runInSandbox(while(true){}', 1000): throws TimeoutError after ~1000ms
    - runInSandbox with code that calls fetch: throws PermissionError (no network in sandbox)
    - Test: corsMiddleware allows 'http://localhost:3000'
    - Test: corsMiddleware blocks 'https://evil.com'
    - Test: rateLimit creates Redis key with sliding window entries
  </behavior>
  <action>
**apps/api/src/middleware/security.ts** — bundle all security middleware for easy application:
```typescript
import type { Context, MiddlewareHandler, Next } from 'hono'
import { corsMiddleware } from './cors'
import { rateLimit } from './rateLimit'
import { auditMiddleware } from './audit'

// Standard API rate limit: 100 req/min per user/IP
export const apiRateLimit = rateLimit(100, 60)

// Strict rate limit for auth endpoints: 10 req/min
export const authRateLimit = rateLimit(10, 60)

// Strict rate limit for AI endpoints: 20 req/min
export const aiRateLimit = rateLimit(20, 60)

// Webhook endpoints: 200 req/min (high volume from Stripe/Clerk)
export const webhookRateLimit = rateLimit(200, 60)

export { corsMiddleware, auditMiddleware }

// Apply all security middleware at once for standard API routes
export function applySecurityMiddleware(app: { use: (path: string, ...handlers: MiddlewareHandler[]) => void }) {
  app.use('*', corsMiddleware)
  app.use('/api/*', apiRateLimit)
  app.use('/api/*', auditMiddleware)
}
```

**apps/api/src/lib/sandbox.ts** — Deno-based code sandbox (per SEC-02):

The sandbox executes AI-generated Luau/TypeScript code in an isolated Deno subprocess with:
- 5 second timeout (configurable)
- 128MB memory limit
- No network access (`--allow-net` NOT set)
- No file system access (`--allow-read` / `--allow-write` NOT set)
- No environment variable access (`--allow-env` NOT set)

```typescript
import { spawn } from 'child_process'
import * as path from 'path'
import * as fs from 'fs/promises'
import * as os from 'os'
import * as crypto from 'crypto'

export class SandboxTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Sandbox execution timed out after ${timeoutMs}ms`)
    this.name = 'SandboxTimeoutError'
  }
}

export class SandboxError extends Error {
  constructor(message: string, public readonly stderr: string) {
    super(message)
    this.name = 'SandboxError'
  }
}

export interface SandboxResult {
  stdout: string
  stderr: string
  exitCode: number
  durationMs: number
}

export async function runInSandbox(
  code: string,
  { timeoutMs = 5000, memoryLimitMb = 128 }: { timeoutMs?: number; memoryLimitMb?: number } = {}
): Promise<SandboxResult> {
  // Write code to a temp file (Deno requires a file path)
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'forjegames-sandbox-'))
  const tempFile = path.join(tempDir, `${crypto.randomBytes(8).toString('hex')}.ts`)

  try {
    await fs.writeFile(tempFile, code, 'utf-8')

    const startMs = Date.now()

    const result = await new Promise<SandboxResult>((resolve, reject) => {
      // Deno with no permissions = full isolation
      // V8 flags for memory limit
      const denoProcess = spawn('deno', [
        'run',
        '--no-prompt',
        '--v8-flags=--max-old-space-size=' + memoryLimitMb,
        // Deliberately NO --allow-net, --allow-read, --allow-write, --allow-env
        tempFile,
      ], {
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: timeoutMs,
      })

      let stdout = ''
      let stderr = ''

      denoProcess.stdout?.on('data', (d: Buffer) => { stdout += d.toString() })
      denoProcess.stderr?.on('data', (d: Buffer) => { stderr += d.toString() })

      const timer = setTimeout(() => {
        denoProcess.kill('SIGKILL')
        reject(new SandboxTimeoutError(timeoutMs))
      }, timeoutMs)

      denoProcess.on('close', (code) => {
        clearTimeout(timer)
        const durationMs = Date.now() - startMs
        resolve({ stdout: stdout.trim(), stderr: stderr.trim(), exitCode: code ?? -1, durationMs })
      })

      denoProcess.on('error', (err) => {
        clearTimeout(timer)
        // If deno is not installed, fail gracefully
        if ((err as any).code === 'ENOENT') {
          resolve({ stdout: '', stderr: 'Deno runtime not available', exitCode: -1, durationMs: 0 })
        } else {
          reject(new SandboxError(err.message, ''))
        }
      })
    })

    if (result.exitCode !== 0 && result.exitCode !== null) {
      throw new SandboxError(`Sandbox exited with code ${result.exitCode}: ${result.stderr}`, result.stderr)
    }

    return result
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
  }
}
```

**apps/api/src/routes/sandbox.ts** — Hono route for sandbox execution (used by AI engine in Phase 3):
```typescript
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import { aiRateLimit } from '../middleware/security'
import { runInSandbox, SandboxTimeoutError, SandboxError } from '../lib/sandbox'
import { db } from '../lib/db'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

const schema = z.object({
  code: z.string().max(50000), // 50KB max
  timeoutMs: z.number().int().min(100).max(5000).optional().default(5000),
})

export const sandboxRoutes = new Hono()

sandboxRoutes.post('/execute', requireAuth, aiRateLimit, zValidator('json', schema), async (c) => {
  const { code, timeoutMs } = c.req.valid('json')
  const clerkId = c.get('clerkId')

  // Audit this execution
  const user = await db.user.findUnique({ where: { clerkId } })

  try {
    const result = await runInSandbox(code, { timeoutMs, memoryLimitMb: 128 })

    await db.auditLog.create({
      data: {
        userId: user?.id,
        action: 'SANDBOX_EXECUTE',
        resource: 'sandbox',
        metadata: { codeLength: code.length, durationMs: result.durationMs, exitCode: result.exitCode },
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
})
```

Install @hono/zod-validator: `npm install @hono/zod-validator --workspace=apps/api`

Register sandboxRoutes in apps/api/src/index.ts:
```typescript
import { sandboxRoutes } from './routes/sandbox'
app.route('/api/sandbox', sandboxRoutes)
```

**Also update apps/api/src/index.ts** to apply full security middleware bundle:
```typescript
import { corsMiddleware, apiRateLimit, auditMiddleware } from './middleware/security'

app.use('*', corsMiddleware)
app.use('*', logger())
app.use('*', secureHeaders())
app.use('/api/*', apiRateLimit)
app.use('/api/*', auditMiddleware)
```

(Remove the raw corsMiddleware import and replace with the security bundle.)
  </action>
  <verify>
    <automated>cd "C:/Users/Dawse/OneDrive/Desktop/roblox-map-building" && npx tsc --noEmit -p apps/api/tsconfig.json 2>&1 | grep -c "error TS" || echo "0"</automated>
  </verify>
  <done>
    TypeScript compiles without errors.
    security.ts exports apiRateLimit, authRateLimit, aiRateLimit, webhookRateLimit.
    sandbox.ts exports runInSandbox, SandboxTimeoutError, SandboxError.
    POST /api/sandbox/execute with valid code returns { stdout, stderr, exitCode, durationMs }.
    Timeout test: infinite loop with 1000ms timeout kills process and returns 408.
    Security middleware applied to all /api/* routes.
    CORS: requests from non-whitelisted origins get 403.
  </done>
</task>

<task type="auto">
  <name>Task 3: Cost tracking dashboard + daily snapshot cron</name>
  <files>
    apps/api/src/routes/cost-tracker.ts
    src/app/api/internal/cost-snapshot/route.ts
    src/app/(app)/dashboard/cost-tracker/page.tsx
    src/components/CostDashboard.tsx
  </files>
  <action>
**apps/api/src/routes/cost-tracker.ts** — Hono routes for cost data. Reads from ApiUsageRecord and DailyCostSnapshot:
```typescript
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import { db } from '../lib/db'

export const costTrackerRoutes = new Hono()

// Get daily snapshots for the last 30 days (admin only for now, relaxed in Phase 8)
costTrackerRoutes.get('/snapshots', requireAuth, async (c) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const snapshots = await db.dailyCostSnapshot.findMany({
    where: { date: { gte: thirtyDaysAgo } },
    orderBy: { date: 'desc' },
  })
  return c.json(snapshots)
})

// Get today's running cost (aggregated from ApiUsageRecord)
costTrackerRoutes.get('/today', requireAuth, async (c) => {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const records = await db.apiUsageRecord.groupBy({
    by: ['provider'],
    where: { createdAt: { gte: todayStart } },
    _sum: { costUsd: true, tokensUsed: true },
    _count: { id: true },
  })

  const totalCostUsd = records.reduce((sum, r) => sum + (r._sum.costUsd || 0), 0)
  const byProvider = Object.fromEntries(records.map(r => [r.provider, {
    costUsd: r._sum.costUsd || 0,
    tokensUsed: r._sum.tokensUsed || 0,
    calls: r._count.id,
  }]))

  return c.json({ date: todayStart.toISOString().split('T')[0], totalCostUsd, byProvider })
})
```

Register costTrackerRoutes in apps/api/src/index.ts:
```typescript
import { costTrackerRoutes } from './routes/cost-tracker'
app.route('/api/costs', costTrackerRoutes)
```

**src/app/api/internal/cost-snapshot/route.ts** — daily cron endpoint that aggregates ApiUsageRecord into DailyCostSnapshot. Called by GitHub Actions cron or Vercel cron:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Secured by CRON_SECRET header
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)

  const dayEnd = new Date(yesterday)
  dayEnd.setHours(23, 59, 59, 999)

  // Aggregate API usage by provider
  const records = await db.apiUsageRecord.groupBy({
    by: ['provider'],
    where: { createdAt: { gte: yesterday, lte: dayEnd } },
    _sum: { costUsd: true },
  })

  const providerCosts = Object.fromEntries(records.map(r => [r.provider, r._sum.costUsd || 0]))
  const totalCostUsd = Object.values(providerCosts).reduce((a, b) => a + b, 0)

  // TODO in Phase 3: pull actual revenue from Stripe invoices for the day
  const totalRevenue = 0
  const margin = totalRevenue > 0 ? ((totalRevenue - totalCostUsd) / totalRevenue) * 100 : 0

  await db.dailyCostSnapshot.upsert({
    where: { date: yesterday },
    create: { date: yesterday, providerCosts, totalCostUsd, totalRevenue, margin },
    update: { providerCosts, totalCostUsd, totalRevenue, margin },
  })

  return NextResponse.json({ ok: true, date: yesterday.toISOString().split('T')[0], totalCostUsd })
}
```

Add CRON_SECRET to .env.example. Add a Vercel cron entry (vercel.json) to call this daily at midnight:
```json
{
  "crons": [
    {
      "path": "/api/internal/cost-snapshot",
      "schedule": "0 0 * * *"
    }
  ]
}
```

Note: Vercel cron calls don't send the x-cron-secret header — use `VERCEL_CRON_SECRET` env var or validate by checking that the request came from Vercel's IP range. For simplicity, use a shared secret in the request body for now.

**src/components/CostDashboard.tsx** — cost tracking UI:
```tsx
'use client'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

type ProviderCosts = Record<string, number>
type Snapshot = {
  date: string
  totalCostUsd: number
  totalRevenue: number
  margin: number
  providerCosts: ProviderCosts
}

function formatCurrency(usd: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usd)
}

export function CostDashboard() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  const { data: snapshots, isLoading } = useSWR<Snapshot[]>(`${apiBase}/api/costs/snapshots`, fetcher)
  const { data: today } = useSWR<{ totalCostUsd: number; byProvider: ProviderCosts }>(`${apiBase}/api/costs/today`, fetcher, { refreshInterval: 60000 })

  return (
    <div className="space-y-6">
      {/* Today's running cost */}
      <div className="bg-[#0D1231] border border-white/10 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">Today's API Spend</h2>
        <p className="text-4xl font-bold text-[#FFB81C]">{formatCurrency(today?.totalCostUsd || 0)}</p>
        {today?.byProvider && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {Object.entries(today.byProvider).map(([provider, data]) => (
              <div key={provider} className="bg-[#0A0E27] rounded-lg p-3">
                <p className="text-gray-400 text-xs uppercase">{provider}</p>
                <p className="text-white font-medium">{formatCurrency((data as any).costUsd || data as number)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 30-day history */}
      <div className="bg-[#0D1231] border border-white/10 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">30-Day Cost History</h2>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {(snapshots || []).map(s => (
              <div key={s.date} className="flex items-center justify-between py-2 border-b border-white/5">
                <span className="text-gray-400 text-sm">{new Date(s.date).toLocaleDateString()}</span>
                <span className="text-white font-medium">{formatCurrency(s.totalCostUsd)}</span>
                <span className={`text-sm font-medium ${s.margin >= 60 ? 'text-green-400' : s.margin > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                  {s.margin > 0 ? `${s.margin.toFixed(1)}% margin` : 'No revenue data'}
                </span>
              </div>
            ))}
            {(!snapshots || snapshots.length === 0) && (
              <p className="text-gray-500 text-sm text-center py-4">No cost data yet. Data appears after the first day of API usage.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

**src/app/(app)/dashboard/cost-tracker/page.tsx:**
```tsx
import { CostDashboard } from '@/components/CostDashboard'

export default function CostTrackerPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Cost Dashboard</h1>
      <p className="text-gray-400 mb-6">Daily API spend by provider, with margin alerts when spend exceeds revenue.</p>
      <CostDashboard />
    </div>
  )
}
```

Add a navigation link to /dashboard/cost-tracker in the app layout nav bar (alongside Dashboard).

Also add a helper function `recordApiUsage` to `src/lib/api-usage.ts` that other parts of the codebase call after every AI API call:
```typescript
import { db } from './db'

export async function recordApiUsage({
  userId,
  provider,
  operation,
  tokensUsed = 0,
  costUsd = 0,
  durationMs,
  success = true,
  metadata,
}: {
  userId: string
  provider: 'claude' | 'deepgram' | 'meshy' | 'fal' | 'elevenlabs' | 'openai'
  operation: string
  tokensUsed?: number
  costUsd?: number
  durationMs?: number
  success?: boolean
  metadata?: Record<string, unknown>
}) {
  return db.apiUsageRecord.create({
    data: { userId, provider, operation, tokensUsed, costUsd, durationMs, success, metadata: metadata as any },
  })
}
```

This function will be heavily used in Phase 3 (AI Engine). Defining it now establishes the pattern.
  </action>
  <verify>
    <automated>cd "C:/Users/Dawse/OneDrive/Desktop/roblox-map-building" && npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0"</automated>
  </verify>
  <done>
    TypeScript compiles without errors.
    GET /api/costs/snapshots returns last 30 days of DailyCostSnapshot records.
    GET /api/costs/today returns live aggregation from ApiUsageRecord.
    POST /api/internal/cost-snapshot with correct CRON_SECRET header creates/upserts DailyCostSnapshot for yesterday.
    CostDashboard component renders today's spend and 30-day history table.
    /dashboard/cost-tracker page accessible from navigation.
    recordApiUsage() function exported from src/lib/api-usage.ts.
    vercel.json created with daily cron schedule.
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` — zero errors across all workspaces
2. Sentry: throw an intentional error in a Server Component → verify error appears in Sentry dashboard
3. PostHog: navigate between pages → verify $pageview events appear in PostHog
4. CORS: `curl -H "Origin: https://evil.com" http://localhost:3001/api/health` → 403 or no CORS headers
5. Rate limit: fire 101 requests in 60s to same endpoint → 102nd returns 429
6. Audit log: POST to any /api endpoint → AuditLog row created with action, userId, IP
7. Sandbox: POST /api/sandbox/execute with `{ code: "console.log(42)" }` → `{ stdout: "42", exitCode: 0 }`
8. Sandbox timeout: POST with infinite loop + timeoutMs:500 → returns 408
9. Cost snapshot: POST /api/internal/cost-snapshot with CRON_SECRET header → upserts DailyCostSnapshot
10. Cost dashboard: /dashboard/cost-tracker renders without errors
</verification>

<success_criteria>
- MON-01: Sentry initialized in Next.js (server + client + edge) and Hono. Errors captured with stack traces. Source maps uploaded via withSentryConfig.
- MON-02: PostHog client-side captures page views on every navigation. Server-side captureEvent/identifyUser functions available for Phase 3+ use.
- MON-03: DailyCostSnapshot table populated by nightly cron. /dashboard/cost-tracker shows daily spend by provider with margin. recordApiUsage() function ready for Phase 3 AI calls.
- MON-04: vercel.json cron fires /api/internal/cost-snapshot nightly. (Better Uptime external monitoring is manual setup — documented in .env.example with BETTER_UPTIME_API_KEY placeholder.)
- SEC-01: CORS whitelist enforced via corsMiddleware on all Hono routes. ALLOWED_ORIGINS env var controls list.
- SEC-02: Deno sandbox with 5s timeout and 128MB memory limit. POST /api/sandbox/execute executes code in isolation with no network/FS access.
- SEC-03: auditMiddleware creates AuditLog row for every state-changing operation with userId + timestamp.
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation/01-D-SUMMARY.md` with:
- Sentry DSN configuration (frontend vs backend)
- PostHog events already being captured
- Security middleware stack applied to Hono routes
- recordApiUsage() signature (for Phase 3 AI Engine to call)
- Sandbox execution patterns and limitations
- Any deviations from the plan
</output>
