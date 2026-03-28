---
phase: 01-foundation
plan: A
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - tsconfig.json
  - next.config.ts
  - tailwind.config.ts
  - src/app/layout.tsx
  - src/app/globals.css
  - src/lib/db.ts
  - src/lib/redis.ts
  - prisma/schema.prisma
  - apps/api/src/index.ts
  - apps/api/src/lib/db.ts
  - apps/api/src/lib/redis.ts
  - fly.toml
  - .github/workflows/ci.yml
  - .github/workflows/deploy-staging.yml
  - .github/workflows/deploy-production.yml
  - .env.example
autonomous: true
requirements:
  - FOUND-01
  - FOUND-02
  - FOUND-07
  - FOUND-09
  - FOUND-10

must_haves:
  truths:
    - "Next.js 15 app runs at localhost:3000 with dark background #0A0E27"
    - "Hono API server runs at localhost:3001 and returns 200 on GET /health"
    - "Prisma can connect to PostgreSQL and run migrations"
    - "Redis client connects without error"
    - "GitHub Actions CI workflow runs lint + typecheck + test on every push"
    - "Staging deploy triggers automatically on merge to main"
    - "Production deploy triggers on version tag push"
  artifacts:
    - path: "prisma/schema.prisma"
      provides: "Database models for User, Subscription, TokenBalance, CharityDonation, AuditLog"
      contains: "model User"
    - path: "src/lib/db.ts"
      provides: "Prisma client singleton for Next.js"
      exports: ["db"]
    - path: "apps/api/src/index.ts"
      provides: "Hono app entry point with /health route"
      exports: ["app"]
    - path: ".github/workflows/ci.yml"
      provides: "CI pipeline: lint → typecheck → test"
    - path: ".github/workflows/deploy-production.yml"
      provides: "Production deploy on version tag"
  key_links:
    - from: "src/lib/db.ts"
      to: "prisma/schema.prisma"
      via: "PrismaClient import"
      pattern: "new PrismaClient"
    - from: "apps/api/src/index.ts"
      to: "apps/api/src/lib/db.ts"
      via: "db import"
      pattern: "import.*db.*from"
    - from: ".github/workflows/deploy-production.yml"
      to: "Vercel + Fly.io"
      via: "CLI deploy commands"
      pattern: "vercel.*--prod|flyctl.*deploy"
---

<objective>
Scaffold the full monorepo, define the complete database schema, configure the Hono backend, and wire up the GitHub Actions CI/CD pipeline so the project has a deployable skeleton end-to-end.

Purpose: Every subsequent plan depends on this foundation existing. Auth, billing, and monitoring all build on top of the schema, the Next.js app, the Hono API, and the deployment pipeline created here.
Output: Working monorepo with Next.js 15 frontend, Hono 4.x backend, Prisma schema with all Phase 1 models, Redis connection, and three GitHub Actions workflows (CI, staging, production).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Initialize monorepo + Next.js 15 frontend shell</name>
  <files>
    package.json
    tsconfig.json
    next.config.ts
    tailwind.config.ts
    postcss.config.mjs
    src/app/layout.tsx
    src/app/page.tsx
    src/app/globals.css
    src/lib/db.ts
    src/lib/redis.ts
    src/lib/utils.ts
    .env.example
    .gitignore
    .eslintrc.json
    prettier.config.js
  </files>
  <behavior>
    - `db` export is a PrismaClient singleton (no duplicate connections in dev)
    - `redis` export is an ioredis client singleton that throws if REDIS_URL is missing
    - layout.tsx sets background #0A0E27, text white, uses Inter font via next/font/google
    - globals.css defines CSS variables: --background: #0A0E27, --accent: #FFB81C
    - tsconfig strict: true, paths alias "@/*" → "./src/*"
    - Test: import db from "@/lib/db" resolves without error
    - Test: import redis from "@/lib/redis" resolves without error
  </behavior>
  <action>
Initialize a new Next.js 15 App Router project with TypeScript and Tailwind CSS 4 in the current directory. Use `npx create-next-app@latest . --typescript --tailwind --app --no-src-dir` if directory is empty, or manually create files.

**package.json** — workspace root, add workspaces: ["apps/*", "packages/*"]. Scripts: dev (runs both apps), build, lint, test. Dependencies: next@15, react@19, react-dom@19, typescript@5, @prisma/client, ioredis, @clerk/nextjs, @stripe/stripe-js, stripe, @sentry/nextjs, posthog-js. DevDependencies: prisma, @types/node, @types/react, eslint, prettier, vitest, @vitejs/plugin-react.

**next.config.ts** — enable React strict mode, experimental.serverActions: true. Add Sentry webpack plugin (import withSentryConfig from @sentry/nextjs — leave Sentry DSN as env var placeholder). Set images.domains for Clerk profile images.

**tailwind.config.ts** — extend theme with colors: { background: '#0A0E27', accent: '#FFB81C', 'accent-hover': '#E6A519' }. Use JetBrains Mono for `font-mono`. Content: ['./src/**/*.{ts,tsx}'].

**src/app/globals.css** — set :root CSS variables. body { background-color: var(--background); color: white; font-family: Inter, sans-serif; }. Define utility classes .text-accent { color: #FFB81C } and .bg-surface { background: #0D1231 }.

**src/app/layout.tsx** — RootLayout with Inter (weights 400,600,700) and JetBrains Mono from next/font/google. Apply font.variable to <html>. Include <body className="bg-background text-white antialiased">. Export metadata: { title: 'RobloxForge', description: 'AI-powered Roblox game development' }.

**src/app/page.tsx** — minimal placeholder: a centered div with "RobloxForge" heading in gold (#FFB81C) and "Coming soon" subtitle. This gets replaced in Phase 4.

**src/lib/db.ts** — Prisma singleton pattern safe for Next.js hot reload:
```typescript
import { PrismaClient } from '@prisma/client'
const globalForPrisma = global as unknown as { prisma: PrismaClient }
export const db = globalForPrisma.prisma || new PrismaClient({ log: ['error'] })
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

**src/lib/redis.ts** — ioredis singleton:
```typescript
import Redis from 'ioredis'
const globalForRedis = global as unknown as { redis: Redis }
export const redis = globalForRedis.redis || new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: 3, lazyConnect: false })
if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis
```

**src/lib/utils.ts** — export `cn` using clsx + tailwind-merge (required by shadcn/ui):
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }
```

**.env.example** — list all required environment variables with placeholder values (never real secrets):
```
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/robloxforge"
DIRECT_URL="postgresql://user:pass@localhost:5432/robloxforge"

# Redis
REDIS_URL="redis://localhost:6379"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/onboarding"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_FREE_PRICE_ID=""
STRIPE_HOBBY_PRICE_ID=""
STRIPE_CREATOR_PRICE_ID=""
STRIPE_STUDIO_PRICE_ID=""
STRIPE_CHARITY_ACCOUNT_ID=""

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=""
SENTRY_AUTH_TOKEN=""
SENTRY_ORG=""
SENTRY_PROJECT=""
NEXT_PUBLIC_POSTHOG_KEY=""
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
API_URL="http://localhost:3001"
```

Install shadcn/ui via `npx shadcn@latest init` in action, or manually add components.json with style: "default", baseColor: "slate", cssVariables: true. Install button and card components for later use.
  </action>
  <verify>
    <automated>cd "C:/Users/Dawse/OneDrive/Desktop/roblox-map-building" && npm run typecheck 2>&1 | tail -5</automated>
  </verify>
  <done>TypeScript compiles without errors. `next dev` starts and http://localhost:3000 shows dark page with gold "RobloxForge" heading. `src/lib/db.ts` and `src/lib/redis.ts` compile cleanly.</done>
</task>

<task type="auto">
  <name>Task 2: Define Prisma schema + database models</name>
  <files>
    prisma/schema.prisma
    prisma/migrations/.gitkeep
  </files>
  <action>
Create the complete Prisma schema covering all models needed by Phase 1 through Phase 3. This schema is the contract all subsequent plans build against — get it right now to avoid migrations mid-phase.

**prisma/schema.prisma:**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ─── Auth / Identity ───────────────────────────────────────────────────────

model User {
  id             String   @id @default(cuid())
  clerkId        String   @unique
  email          String   @unique
  username       String?  @unique
  displayName    String?
  avatarUrl      String?
  dateOfBirth    DateTime?
  isUnder13      Boolean  @default(false)
  parentEmail    String?
  parentConsentAt DateTime?
  parentConsentToken String? @unique
  parentConsentTokenExp DateTime?
  role           UserRole @default(USER)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  subscription   Subscription?
  tokenBalance   TokenBalance?
  charityChoice  String?
  donations      CharityDonation[]
  auditLogs      AuditLog[]
  apiUsage       ApiUsageRecord[]

  @@index([clerkId])
  @@index([email])
}

enum UserRole {
  USER
  ADMIN
  CREATOR
}

// ─── Subscriptions & Billing ───────────────────────────────────────────────

model Subscription {
  id                   String             @id @default(cuid())
  userId               String             @unique
  user                 User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  stripeCustomerId     String             @unique
  stripeSubscriptionId String?            @unique
  stripePriceId        String?
  tier                 SubscriptionTier   @default(FREE)
  status               SubscriptionStatus @default(ACTIVE)
  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean            @default(false)
  trialEnd             DateTime?
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt

  @@index([stripeCustomerId])
  @@index([userId])
}

enum SubscriptionTier {
  FREE
  HOBBY
  CREATOR
  STUDIO
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  TRIALING
  INCOMPLETE
  PAUSED
}

// ─── Token Economy ─────────────────────────────────────────────────────────

model TokenBalance {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  balance       Int      @default(0)
  lifetimeEarned Int     @default(0)
  lifetimeSpent  Int     @default(0)
  rolloverTokens Int     @default(0)
  updatedAt     DateTime @updatedAt

  transactions  TokenTransaction[]
}

model TokenTransaction {
  id          String              @id @default(cuid())
  balanceId   String
  balance     TokenBalance        @relation(fields: [balanceId], references: [id])
  type        TokenTransactionType
  amount      Int
  description String
  metadata    Json?
  createdAt   DateTime            @default(now())

  @@index([balanceId])
  @@index([createdAt])
}

enum TokenTransactionType {
  PURCHASE
  SPEND
  REFUND
  BONUS
  ROLLOVER
  SUBSCRIPTION_GRANT
}

// ─── Charity ───────────────────────────────────────────────────────────────

model CharityDonation {
  id               String   @id @default(cuid())
  userId           String
  user             User     @relation(fields: [userId], references: [id])
  stripeTransferId String?  @unique
  charitySlug      String
  charityName      String
  amountCents      Int
  sourcePurchaseId String?
  status           DonationStatus @default(PENDING)
  createdAt        DateTime @default(now())
  processedAt      DateTime?

  @@index([userId])
  @@index([createdAt])
}

enum DonationStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

// ─── Audit Logging ─────────────────────────────────────────────────────────

model AuditLog {
  id         String   @id @default(cuid())
  userId     String?
  user       User?    @relation(fields: [userId], references: [id])
  action     String
  resource   String
  resourceId String?
  ipAddress  String?
  userAgent  String?
  metadata   Json?
  createdAt  DateTime @default(now())

  @@index([userId])
  @@index([action])
  @@index([createdAt])
  @@index([resource, resourceId])
}

// ─── API Usage Tracking ────────────────────────────────────────────────────

model ApiUsageRecord {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  provider     String
  operation    String
  tokensUsed   Int      @default(0)
  costUsd      Float    @default(0)
  durationMs   Int?
  success      Boolean  @default(true)
  metadata     Json?
  createdAt    DateTime @default(now())

  @@index([userId])
  @@index([provider])
  @@index([createdAt])
}

// ─── Cost Tracking (aggregated daily) ──────────────────────────────────────

model DailyCostSnapshot {
  id          String   @id @default(cuid())
  date        DateTime @unique @db.Date
  providerCosts Json
  totalCostUsd Float
  totalRevenue Float
  margin       Float
  createdAt   DateTime @default(now())

  @@index([date])
}
```

After writing the schema, run `npx prisma generate` to generate the Prisma client. Also run `npx prisma db push --skip-generate` to push the schema to the development database (only if DATABASE_URL is available; if not, skip and note it).

Add a `prisma/seed.ts` script that creates a test user with FREE subscription and 100 token balance for development. Add `"prisma": { "seed": "tsx prisma/seed.ts" }` to package.json.
  </action>
  <verify>
    <automated>cd "C:/Users/Dawse/OneDrive/Desktop/roblox-map-building" && npx prisma validate 2>&1</automated>
  </verify>
  <done>
    `npx prisma validate` passes with no errors.
    `npx prisma generate` completes and generates type-safe client.
    Schema contains: User, Subscription, TokenBalance, TokenTransaction, CharityDonation, AuditLog, ApiUsageRecord, DailyCostSnapshot models.
    All enums defined: UserRole, SubscriptionTier, SubscriptionStatus, TokenTransactionType, DonationStatus.
  </done>
</task>

<task type="auto">
  <name>Task 3: Hono backend scaffold + GitHub Actions CI/CD</name>
  <files>
    apps/api/package.json
    apps/api/tsconfig.json
    apps/api/src/index.ts
    apps/api/src/lib/db.ts
    apps/api/src/lib/redis.ts
    apps/api/src/middleware/cors.ts
    apps/api/src/middleware/rateLimit.ts
    apps/api/src/middleware/audit.ts
    apps/api/src/routes/health.ts
    apps/api/Dockerfile
    fly.toml
    .github/workflows/ci.yml
    .github/workflows/deploy-staging.yml
    .github/workflows/deploy-production.yml
  </files>
  <action>
**apps/api/package.json** — Hono backend package. Name: "@robloxforge/api". Scripts: dev (tsx watch src/index.ts), build (tsc), start (node dist/index.js). Dependencies: hono@4, @hono/node-server, @prisma/client, ioredis, @sentry/node, zod. DevDependencies: typescript, tsx, @types/node, prisma.

**apps/api/src/index.ts** — Hono app entry:
```typescript
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { healthRoute } from './routes/health'
import { corsMiddleware } from './middleware/cors'

const app = new Hono()

app.use('*', corsMiddleware)
app.use('*', logger())
app.use('*', secureHeaders())

app.route('/health', healthRoute)

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

const port = parseInt(process.env.PORT || '3001')
serve({ fetch: app.fetch, port }, () => console.log(`API running on :${port}`))

export { app }
```

**apps/api/src/routes/health.ts:**
```typescript
import { Hono } from 'hono'
import { db } from '../lib/db'
import { redis } from '../lib/redis'

export const healthRoute = new Hono()

healthRoute.get('/', async (c) => {
  const checks = await Promise.allSettled([
    db.$queryRaw`SELECT 1`,
    redis.ping(),
  ])
  const postgres = checks[0].status === 'fulfilled' ? 'ok' : 'down'
  const redisStatus = checks[1].status === 'fulfilled' ? 'ok' : 'down'
  const healthy = postgres === 'ok' && redisStatus === 'ok'
  return c.json({ status: healthy ? 'ok' : 'degraded', postgres, redis: redisStatus, version: '1.0.0' }, healthy ? 200 : 503)
})
```

**apps/api/src/middleware/cors.ts** — CORS middleware allowing only whitelisted origins (per SEC-01):
```typescript
import { cors } from 'hono/cors'
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',')
export const corsMiddleware = cors({
  origin: (origin) => ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  maxAge: 86400,
})
```

**apps/api/src/middleware/rateLimit.ts** — Redis sliding window rate limiter (per FOUND-08):
```typescript
import type { Context, Next } from 'hono'
import { redis } from '../lib/redis'

export function rateLimit(limit: number, windowSec: number) {
  return async (c: Context, next: Next) => {
    const userId = c.get('userId') || c.req.header('x-forwarded-for') || 'anonymous'
    const key = `rl:${c.req.path}:${userId}`
    const now = Date.now()
    const windowMs = windowSec * 1000
    const pipe = redis.pipeline()
    pipe.zremrangebyscore(key, 0, now - windowMs)
    pipe.zadd(key, now, `${now}-${Math.random()}`)
    pipe.zcard(key)
    pipe.expire(key, windowSec)
    const results = await pipe.exec()
    const count = results?.[2]?.[1] as number
    if (count > limit) {
      return c.json({ error: 'Rate limit exceeded' }, 429)
    }
    c.header('X-RateLimit-Limit', String(limit))
    c.header('X-RateLimit-Remaining', String(Math.max(0, limit - count)))
    await next()
  }
}
```

**apps/api/src/middleware/audit.ts** — Audit logging middleware (per SEC-03):
```typescript
import type { Context, Next } from 'hono'
import { db } from '../lib/db'

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export async function auditMiddleware(c: Context, next: Next) {
  await next()
  if (!MUTATING_METHODS.has(c.req.method)) return
  const userId = c.get('userId') as string | undefined
  try {
    await db.auditLog.create({
      data: {
        userId: userId || null,
        action: `${c.req.method} ${c.req.path}`,
        resource: c.req.path.split('/')[2] || 'unknown',
        ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
        userAgent: c.req.header('user-agent'),
        metadata: { status: c.res.status },
      }
    })
  } catch (e) {
    // audit failures must never break the request
    console.error('Audit log failed:', e)
  }
}
```

**apps/api/Dockerfile:**
```dockerfile
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
RUN npm ci --workspace=apps/api --omit=dev
COPY prisma ./prisma
COPY apps/api ./apps/api
RUN npm run build --workspace=apps/api
EXPOSE 3001
CMD ["node", "apps/api/dist/index.js"]
```

**fly.toml** — Fly.io app config:
```toml
app = "robloxforge-api"
primary_region = "sjc"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "3001"
  NODE_ENV = "production"

[[services]]
  protocol = "tcp"
  internal_port = 3001

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [services.concurrency]
    type = "requests"
    hard_limit = 250
    soft_limit = 200

  [[services.tcp_checks]]
    interval = "15s"
    timeout = "2s"
    grace_period = "1s"

  [[services.http_checks]]
    interval = "10s"
    timeout = "2s"
    grace_period = "5s"
    method = "get"
    path = "/health"
    protocol = "http"
```

**GitHub Actions — .github/workflows/ci.yml:**
```yaml
name: CI

on:
  push:
    branches: ['**']
  pull_request:
    branches: [main, staging]

jobs:
  lint-typecheck:
    name: Lint + Typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  test:
    name: Tests
    runs-on: ubuntu-latest
    needs: lint-typecheck
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: robloxforge_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      redis:
        image: redis:8
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    env:
      DATABASE_URL: postgresql://postgres:test@localhost:5432/robloxforge_test
      DIRECT_URL: postgresql://postgres:test@localhost:5432/robloxforge_test
      REDIS_URL: redis://localhost:6379
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npx prisma db push --skip-generate
      - run: npm test
```

**GitHub Actions — .github/workflows/deploy-staging.yml:**
```yaml
name: Deploy Staging

on:
  push:
    branches: [main]

jobs:
  deploy-frontend-staging:
    name: Deploy Frontend → Vercel Staging
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npx vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}
      - run: npx vercel build --token=${{ secrets.VERCEL_TOKEN }}
      - run: npx vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}

  deploy-api-staging:
    name: Deploy API → Fly.io Staging
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only --app robloxforge-api-staging
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

**GitHub Actions — .github/workflows/deploy-production.yml:**
```yaml
name: Deploy Production

on:
  push:
    tags: ['v*']

jobs:
  deploy-frontend-production:
    name: Deploy Frontend → Vercel Production
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npx vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      - run: npx vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      - run: npx vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}

  deploy-api-production:
    name: Deploy API → Fly.io Production
    runs-on: ubuntu-latest
    needs: deploy-frontend-production
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only --app robloxforge-api
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

Add a `scripts/backup.sh` for FOUND-10 PostgreSQL backup (WAL archiving to S3 via pg_dump piped to aws s3 cp). This script is invoked by a daily cron in fly.toml (machine cron or external scheduler). Add it even if the S3 bucket isn't created yet — document the env vars needed in .env.example.

For secrets management (FOUND-09), add a `docs/secrets-rotation.md` noting the 90-day rotation policy, which secrets need rotation (CLERK_SECRET_KEY, STRIPE_SECRET_KEY, DATABASE_URL credentials), and the procedure (GitHub Actions secrets + Vercel env vars + Fly.io secrets all updated atomically).
  </action>
  <verify>
    <automated>cd "C:/Users/Dawse/OneDrive/Desktop/roblox-map-building" && npx tsc --noEmit -p apps/api/tsconfig.json 2>&1 | tail -10</automated>
  </verify>
  <done>
    `apps/api` TypeScript compiles without errors.
    `node apps/api/dist/index.js` (after build) starts and `curl http://localhost:3001/health` returns 200 with `{"status":"ok"}`.
    `.github/workflows/ci.yml`, `deploy-staging.yml`, `deploy-production.yml` all exist with valid YAML syntax.
    `fly.toml` exists with health check pointing to `/health`.
  </done>
</task>

</tasks>

<verification>
Run these checks after all tasks complete:

1. `npm run typecheck` — zero TypeScript errors across all workspaces
2. `npx prisma validate` — schema is valid
3. `npx prisma generate` — client generates cleanly
4. `curl http://localhost:3001/health` — returns `{"status":"ok","postgres":"ok","redis":"ok"}`
5. `curl http://localhost:3000` — returns HTML with dark background
6. Lint YAML: `npx js-yaml .github/workflows/ci.yml` — valid
7. `.env.example` contains all required env vars with placeholder values
</verification>

<success_criteria>
- FOUND-01: Next.js 15 app exists with dark mode (#0A0E27) and gold accent (#FFB81C) in design tokens
- FOUND-02: Hono 4.x app exists, runs on port 3001, /health endpoint returns 200 with DB + Redis status
- FOUND-07: Three GitHub Actions workflows exist: CI (lint+test on push), staging (deploy on main), production (deploy on tag)
- FOUND-09: .env.example documents all secrets with rotation policy in docs/secrets-rotation.md
- FOUND-10: `scripts/backup.sh` exists with pg_dump → S3 pattern; fly.toml includes daily cron trigger
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation/01-A-SUMMARY.md` with:
- What was built (files created, key patterns established)
- Key decisions made
- Interfaces other plans should use (db export, redis export, Hono middleware patterns)
- Any deviations from the plan
</output>
