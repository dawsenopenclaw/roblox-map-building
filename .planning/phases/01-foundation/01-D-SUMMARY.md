---
phase: 01-foundation
plan: D
subsystem: monitoring-security
tags: [sentry, posthog, analytics, rate-limiting, cors, audit-log, deno-sandbox, cost-tracking]
dependency_graph:
  requires: [01-PLAN-A]
  provides: [MON-01, MON-02, MON-03, MON-04, SEC-01, SEC-02, SEC-03]
  affects: [Phase 3 AI Engine (recordApiUsage), Phase 4+ all Hono routes (securityMiddleware)]
tech_stack:
  added: ["@sentry/nextjs@^8", "@sentry/node@^8", "posthog-js@^1", "posthog-node@^4", "@hono/zod-validator", "swr"]
  patterns:
    - "Sentry initialized before any other imports in Hono entry (side-effect first)"
    - "PostHog page views tracked manually via useEffect on pathname + searchParams change"
    - "Deno sandbox uses temp file per execution, cleaned up in finally block"
    - "Rate limiter: Redis zset sliding window pipeline (zadd + zcard + expire)"
    - "Audit log is fire-and-forget — errors logged, never propagate to caller"
key_files:
  created:
    - src/instrumentation.ts
    - sentry.server.config.ts
    - sentry.client.config.ts
    - sentry.edge.config.ts
    - src/lib/posthog.ts
    - src/components/PostHogProvider.tsx
    - apps/api/src/lib/sentry.ts
    - apps/api/src/middleware/security.ts
    - apps/api/src/lib/sandbox.ts
    - apps/api/src/routes/sandbox.ts
    - apps/api/src/routes/cost-tracker.ts
    - src/app/api/internal/cost-snapshot/route.ts
    - src/components/CostDashboard.tsx
    - src/app/(app)/dashboard/cost-tracker/page.tsx
    - src/lib/api-usage.ts
    - vercel.json
  modified:
    - src/app/layout.tsx (PostHogProvider wrapping body)
    - apps/api/src/index.ts (Sentry init + security middleware + new routes)
    - next.config.ts (withSentryConfig wrapper)
    - .env.example (SENTRY_DSN, CRON_SECRET, BETTER_UPTIME_API_KEY added)
decisions:
  - "SENTRY_DSN (backend) is separate from NEXT_PUBLIC_SENTRY_DSN (frontend) — allows different Sentry projects or shared DSN"
  - "Sandbox uses spawn() not worker_threads — Deno subprocess provides OS-level isolation, not just V8"
  - "zValidator type cast (schema as any) used due to @hono/zod-validator + zod 3.x deep type recursion issue"
  - "Vercel cron secured by x-cron-secret header (CRON_SECRET env var) — not Vercel IP range check (simpler)"
  - "costTrackerRoutes are public (no requireAuth) for Phase 1 — locked down in Phase 8 admin panel"
metrics:
  duration: "~25 minutes"
  completed: "2026-03-28"
  tasks_completed: 3
  files_created: 16
  files_modified: 4
---

# Phase 1 Plan D: Monitoring + Security Summary

Sentry, PostHog, security middleware, Deno sandbox, and cost tracking are all wired up and compiling clean.

## What Was Built

### MON-01: Sentry Error Tracking

**Frontend (Next.js):**
- `sentry.server.config.ts` — Node.js runtime init, Prisma integration, PII stripping (ip_address removed before send)
- `sentry.client.config.ts` — Browser init, session replay (10% sessions, 100% on errors)
- `sentry.edge.config.ts` — Edge runtime init (minimal, no integrations)
- `src/instrumentation.ts` — Next.js 15 hook: registers server/edge config by runtime, `onRequestError` captures route errors
- `next.config.ts` — Wrapped with `withSentryConfig` for source map uploads

Config pattern: `enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN` — silently disabled when DSN not set (dev convenience).

**Backend (Hono):**
- `apps/api/src/lib/sentry.ts` — `initSentry()` called as first line of `index.ts` before any imports that could throw
- `captureException(err, context)` called in `app.onError` with path + method context

### MON-02: PostHog Analytics

**Server-side (`src/lib/posthog.ts`):**
```typescript
// Singleton client, lazy-initialized
getPostHogClient() → PostHog | null

captureEvent(distinctId, event, properties?)
identifyUser(distinctId, { email?, tier?, isUnder13? })
```

**Client-side (`src/components/PostHogProvider.tsx`):**
- Auto-initializes posthog-js when `NEXT_PUBLIC_POSTHOG_KEY` is set
- `PageViewTracker` fires `$pageview` on every `pathname + searchParams` change
- `PostHogProvider` wraps app body in `layout.tsx`
- `capture_pageview: false` — manual control to avoid double-counting with Next.js router

### MON-03: Cost Tracking

**`src/lib/api-usage.ts`** — Helper for Phase 3 AI Engine to call after every AI API call:
```typescript
recordApiUsage({
  userId: string,
  provider: 'claude' | 'deepgram' | 'meshy' | 'fal' | 'elevenlabs' | 'openai',
  operation: string,
  tokensUsed?: number,    // defaults 0
  costUsd?: number,       // defaults 0
  durationMs?: number,
  success?: boolean,      // defaults true
  metadata?: Record<string, unknown>
})
```

**GET /api/costs/snapshots** — Last 30 days of `DailyCostSnapshot` records, ordered by date desc.

**GET /api/costs/today** — Live aggregation from `ApiUsageRecord` grouped by provider.

**Cost dashboard** at `/dashboard/cost-tracker`:
- Today's spend (refreshes every 60s) with per-provider breakdown
- 30-day history table with margin color coding (green ≥60%, yellow >0%, gray = no revenue)

### MON-04: Uptime Monitoring

**Vercel cron** in `vercel.json` fires `POST /api/internal/cost-snapshot` at midnight UTC.

**`src/app/api/internal/cost-snapshot/route.ts`** — Nightly aggregation:
- Secured by `x-cron-secret` header matching `CRON_SECRET` env var
- Aggregates yesterday's `ApiUsageRecord` by provider → upserts `DailyCostSnapshot`
- Revenue stubbed at 0 (wired to Stripe in Phase 3)

Better Uptime external monitoring: `BETTER_UPTIME_API_KEY` placeholder added to `.env.example`. Monitors `/health` endpoint — manual setup at betteruptime.com.

### SEC-01: CORS Whitelisting

`corsMiddleware` from `apps/api/src/middleware/cors.ts` is applied to all `*` routes. Origin whitelist controlled by `ALLOWED_ORIGINS` env var (comma-separated). Requests from non-whitelisted origins receive no CORS headers (browser blocks them).

Now exported from `security.ts` bundle for single-import convenience.

### SEC-02: Deno AI Code Sandbox

**`apps/api/src/lib/sandbox.ts`** — `runInSandbox(code, { timeoutMs?, memoryLimitMb? })`:
- Writes code to temp file in OS tmpdir, spawns `deno run --no-prompt` subprocess
- No permissions granted: `--allow-net`, `--allow-read`, `--allow-write`, `--allow-env` are all absent
- `--v8-flags=--max-old-space-size=128` caps heap at 128MB
- `setTimeout + SIGKILL` enforces timeout; rejects with `SandboxTimeoutError`
- Temp directory cleaned up in `finally` block regardless of outcome
- Graceful `ENOENT` fallback: returns `{ stderr: 'Deno runtime not available' }` instead of crashing

**POST /api/sandbox/execute** — AI rate limited (20 req/min), 50KB code size cap, audit logged.

### SEC-03: Audit Logging

`auditMiddleware` (from Plan A, unchanged) fires on all `POST/PUT/PATCH/DELETE` requests after response. Logs: `userId`, `action` (`METHOD /path`), `resource`, `ipAddress`, `userAgent`, `status`. Fire-and-forget — audit failures never break the request.

**`apps/api/src/middleware/security.ts`** — Bundle exporting all rate limit variants + middleware:

| Export | Limit |
|---|---|
| `apiRateLimit` | 100 req/60s |
| `authRateLimit` | 10 req/60s |
| `aiRateLimit` | 20 req/60s |
| `webhookRateLimit` | 200 req/60s |
| `corsMiddleware` | re-exported |
| `auditMiddleware` | re-exported |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] zValidator type compatibility with Zod 3.x**
- **Found during:** Task 2
- **Issue:** `@hono/zod-validator` has a deep type recursion issue with Zod 3.x `ZodObject`. TypeScript error TS2589 "type instantiation is excessively deep".
- **Fix:** Cast schema to `any` at the `zValidator` call site in `sandbox.ts`. Types remain correct at the `c.req.valid('json')` cast.
- **Files modified:** `apps/api/src/routes/sandbox.ts`

**2. [Rule 2 - Missing critical functionality] `c.get('clerkId')` type narrowing**
- **Found during:** Task 2
- **Issue:** Hono context doesn't know about `clerkId` variable without type augmentation. TypeScript error on `c.get('clerkId')`.
- **Fix:** Used `(c as any).get('clerkId')` cast. Auth middleware (Plan B) sets this at runtime; typed context augmentation is Phase 2 work.
- **Files modified:** `apps/api/src/routes/sandbox.ts`

### Out of Scope (Deferred)

- `apps/api/src/routes/tokens.ts` has pre-existing TypeScript errors about `tokenBalance` — not caused by Plan D changes, not fixed here. Tracked as pre-existing.

## Known Stubs

- **`src/app/api/internal/cost-snapshot/route.ts` line 27** — `const totalRevenue = 0` — Revenue stubbed pending Stripe invoice pull in Phase 3. Margin will show "No revenue data" until then. Intentional — tracked in STATE.md blockers.

## Self-Check: PASSED

Files verified to exist:
- `src/instrumentation.ts` ✓
- `sentry.server.config.ts` ✓
- `sentry.client.config.ts` ✓
- `sentry.edge.config.ts` ✓
- `src/lib/posthog.ts` ✓
- `src/components/PostHogProvider.tsx` ✓
- `apps/api/src/lib/sentry.ts` ✓
- `apps/api/src/middleware/security.ts` ✓
- `apps/api/src/lib/sandbox.ts` ✓
- `apps/api/src/routes/sandbox.ts` ✓
- `apps/api/src/routes/cost-tracker.ts` ✓
- `src/app/api/internal/cost-snapshot/route.ts` ✓
- `src/components/CostDashboard.tsx` ✓
- `src/app/(app)/dashboard/cost-tracker/page.tsx` ✓
- `src/lib/api-usage.ts` ✓
- `vercel.json` ✓

Commits verified:
- `779575f` — feat(01-D): Sentry + PostHog ✓
- `c7727dc` — feat(01-D): Security + Sandbox ✓
- `6d8ce19` — feat(01-D): Cost tracking ✓

TypeScript: `npx tsc --noEmit` — 0 errors across Next.js workspace.
TypeScript: `npx tsc --noEmit -p apps/api/tsconfig.json` — 0 errors in Plan D files (pre-existing tokens.ts errors excluded).
