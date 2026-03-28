---
phase: 01-foundation
plan: A
subsystem: foundation
tags: [monorepo, nextjs, hono, prisma, cicd, postgres, redis, tailwind]
dependency_graph:
  requires: []
  provides:
    - next-15-frontend-shell
    - hono-api-scaffold
    - prisma-schema-all-models
    - github-actions-ci-cd
    - redis-singleton
    - db-singleton
  affects:
    - all subsequent plans (auth, billing, ai-engine, marketplace)
tech_stack:
  added:
    - Next.js 15 (App Router, React 19, TypeScript strict)
    - Hono 4.x (Node server via @hono/node-server)
    - Prisma 6.x (PostgreSQL, directUrl for connection pooling)
    - ioredis 5.x (Redis client)
    - Tailwind CSS 3.x (custom dark theme)
    - Vitest 2.x (test runner)
    - GitHub Actions (CI + staging + production)
    - Fly.io (API deployment via flyctl)
    - Vercel (Next.js deployment)
  patterns:
    - PrismaClient singleton safe for Next.js hot reload (globalForPrisma)
    - ioredis singleton safe for Next.js hot reload (globalForRedis)
    - Hono middleware chain (cors -> logger -> secureHeaders)
    - Redis sliding window rate limiter (zset pipeline)
    - Audit logging on all mutating HTTP methods (non-blocking)
key_files:
  created:
    - package.json (workspaces root, scripts, all deps)
    - tsconfig.json (strict, @/* alias)
    - next.config.ts (React strict, serverActions, Clerk image domains)
    - tailwind.config.ts (dark theme: #0A0E27 bg, #FFB81C accent)
    - src/app/layout.tsx (Inter + JetBrains Mono fonts)
    - src/app/globals.css (CSS variables + utility classes)
    - src/app/page.tsx (placeholder with gold heading)
    - src/lib/db.ts (Prisma singleton)
    - src/lib/redis.ts (ioredis singleton)
    - src/lib/utils.ts (cn() helper for shadcn/ui)
    - prisma/schema.prisma (8 models, 5 enums)
    - prisma/seed.ts (dev user + FREE sub + 100 tokens)
    - apps/api/src/index.ts (Hono entry point port 3001)
    - apps/api/src/routes/health.ts (/health checks pg + redis)
    - apps/api/src/middleware/cors.ts (whitelist from ALLOWED_ORIGINS)
    - apps/api/src/middleware/rateLimit.ts (Redis sliding window)
    - apps/api/src/middleware/audit.ts (AuditLog on mutating methods)
    - apps/api/src/lib/db.ts (Prisma singleton for API)
    - apps/api/src/lib/redis.ts (ioredis singleton for API)
    - apps/api/Dockerfile (node:22-alpine, workspace build)
    - fly.toml (sjc region, /health checks, 250 req concurrency)
    - .github/workflows/ci.yml (lint+typecheck+test, postgres+redis services)
    - .github/workflows/deploy-staging.yml (Vercel + Fly on main push)
    - .github/workflows/deploy-production.yml (Vercel + Fly on v* tag)
    - scripts/backup.sh (pg_dump -> gzip -> S3 with aws cli)
    - docs/secrets-rotation.md (90-day policy, atomic 3-surface procedure)
    - .env.example (all 25+ env vars with placeholders)
    - .gitignore (node_modules, .env, .next, dist, build)
  modified: []
decisions:
  - "Used @hono/node-server instead of Bun.serve - Node 22 LTS is the Fly.io baseline"
  - "Tailwind 3.x retained (not Tailwind 4 beta) - stable plugin ecosystem needed for Phase 4 UI"
  - "Prisma 6.x used (not 7.x) - v7 is major with breaking config changes, migrate when stable"
  - "DIRECT_URL added to schema for Prisma connection pooling (Neon/Supabase PgBouncer compat)"
  - "Rate limiter uses Redis zset pipeline for O(log n) sliding window accuracy"
  - "Audit middleware is fire-and-forget (errors logged but never propagate) per correctness requirement"
metrics:
  duration: "~18 minutes"
  completed: "2026-03-28"
  tasks: 3
  files_created: 28
  files_modified: 1
---

# Phase 1 Plan A: Foundation Summary

**One-liner:** Next.js 15 + Hono 4 monorepo with Prisma schema covering all 8 Phase-1-3 models, dark theme (#0A0E27/#FFB81C), and three-workflow GitHub Actions CI/CD pipeline deploying to Vercel + Fly.io.

## What Was Built

### Task 1: Monorepo + Next.js 15 Frontend Shell

Workspace root with `apps/*` and `packages/*` workspaces. Next.js 15 App Router with:
- Dark background `#0A0E27`, gold accent `#FFB81C` in both Tailwind config and CSS variables
- Inter (400/600/700) + JetBrains Mono fonts via `next/font/google`
- `src/lib/db.ts` — PrismaClient singleton using `globalForPrisma` pattern (prevents connection exhaustion in Next.js dev hot reload)
- `src/lib/redis.ts` — ioredis singleton using same pattern
- `src/lib/utils.ts` — `cn()` utility combining `clsx` + `tailwind-merge` for shadcn/ui compatibility

### Task 2: Prisma Schema

8 models across 5 domains:

| Model | Purpose |
|-------|---------|
| `User` | Auth identity with COPPA fields (isUnder13, parentEmail, parentConsentAt) |
| `Subscription` | Stripe subscription with tier/status enums |
| `TokenBalance` | User token wallet (balance, lifetimeEarned, lifetimeSpent, rollover) |
| `TokenTransaction` | Immutable ledger of all token movements |
| `CharityDonation` | Charity transfer records with Stripe Transfer ID |
| `AuditLog` | Immutable audit trail for all mutating operations |
| `ApiUsageRecord` | Per-request AI provider usage and cost tracking |
| `DailyCostSnapshot` | Aggregated daily cost/revenue/margin snapshots |

5 enums: `UserRole`, `SubscriptionTier`, `SubscriptionStatus`, `TokenTransactionType`, `DonationStatus`

All models indexed for expected query patterns. Prisma client generated successfully.

### Task 3: Hono Backend + CI/CD

**Hono API (apps/api):**
- Entry point on `PORT` (default 3001)
- `/health` route performs parallel `Promise.allSettled` on postgres + redis
- CORS restricted to `ALLOWED_ORIGINS` env var (default `localhost:3000`)
- Redis sliding window rate limiter using zset pipeline (configurable limit + window)
- Audit middleware logs all POST/PUT/PATCH/DELETE requests to `AuditLog` — errors never propagate to caller

**GitHub Actions (3 workflows):**
- `ci.yml` — runs `lint + typecheck` then `test` (needs postgres:16 + redis:8 services)
- `deploy-staging.yml` — triggers on `main` push, deploys to Vercel preview + Fly.io staging app
- `deploy-production.yml` — triggers on `v*` tag, deploys Vercel prod then (sequentially) Fly.io prod

**Infrastructure:**
- `fly.toml` — sjc region, TCP + HTTP services, `/health` check every 10s, 250 req concurrency
- `scripts/backup.sh` — daily pg_dump | gzip → S3 via aws cli with SSE-KMS encryption
- `docs/secrets-rotation.md` — 90-day rotation schedule, atomic 3-surface procedure (GitHub + Vercel + Fly)

## Interfaces Other Plans Must Use

### Database (src/lib/db.ts or apps/api/src/lib/db.ts)
```typescript
import { db } from '@/lib/db'
// db is a PrismaClient singleton — use directly, no new PrismaClient()
await db.user.findUnique({ where: { clerkId } })
```

### Redis (src/lib/redis.ts or apps/api/src/lib/redis.ts)
```typescript
import { redis } from '@/lib/redis'
// redis is an ioredis instance — full ioredis API available
await redis.set('key', 'value', 'EX', 3600)
```

### Rate Limiting (API routes only)
```typescript
import { rateLimit } from './middleware/rateLimit'
app.use('/api/v1/generate', rateLimit(10, 60)) // 10 req/min
```

### Audit Logging (API routes only)
```typescript
import { auditMiddleware } from './middleware/audit'
// Applied globally in index.ts — set c.set('userId', userId) in auth middleware
// auditMiddleware reads c.get('userId') automatically
```

### Utility
```typescript
import { cn } from '@/lib/utils'
// cn('base-class', condition && 'conditional-class', variantClass)
```

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Minor Adjustments

**1. [Rule 2 - Critical] Added `apps/api/tsconfig.json`**
- Plan listed the file but didn't specify content
- Added standard Node.js TypeScript config with `commonjs` module for `@hono/node-server` compatibility
- Required for `npm run typecheck --workspace=apps/api` to work

**2. [Rule 2 - Critical] Added `prisma/migrations/.gitkeep`**
- Updated `.gitignore` to not exclude `prisma/migrations/` (original `.gitignore` excluded it)
- Migrations directory must be tracked in git for team collaboration and CI/CD reproducibility

**3. [Scope] Prisma `package.json#prisma` deprecation warning**
- Prisma 6.x warns that `"prisma"` key in `package.json` is deprecated (use `prisma.config.ts` in v7)
- Kept `package.json#prisma.seed` for now — migration to `prisma.config.ts` is a Phase 1 concern only when upgrading to Prisma 7

## Known Stubs

- `src/app/page.tsx` — placeholder "Coming soon" page. Intentional. Replaced by Phase 4 (Dashboard UI).
- `prisma/seed.ts` — uses `clerkId: 'dev_clerk_id_placeholder'`. Intentional — real Clerk IDs come from Phase 2 Auth setup.
- `scripts/backup.sh` — requires `AWS_*` env vars and S3 bucket that don't exist yet. Intentional — documented in `.env.example`, wired up as part of infrastructure provisioning.

## Self-Check

### Files Verified

All 16 key files confirmed present on disk.

| File | Status |
|------|--------|
| package.json | FOUND |
| tsconfig.json | FOUND |
| next.config.ts | FOUND |
| tailwind.config.ts | FOUND |
| src/app/layout.tsx | FOUND |
| src/lib/db.ts | FOUND |
| src/lib/redis.ts | FOUND |
| prisma/schema.prisma | FOUND |
| apps/api/src/index.ts | FOUND |
| apps/api/src/routes/health.ts | FOUND |
| .github/workflows/ci.yml | FOUND |
| .github/workflows/deploy-staging.yml | FOUND |
| .github/workflows/deploy-production.yml | FOUND |
| fly.toml | FOUND |
| scripts/backup.sh | FOUND |
| docs/secrets-rotation.md | FOUND |

### Commits Verified

| Commit | Message |
|--------|---------|
| d571cd7 | feat(01-A): initialize monorepo + Next.js 15 frontend shell |
| 9ae85c3 | feat(01-A): define Prisma schema + all Phase 1-3 database models |
| e1857a0 | feat(01-A): Hono 4.x backend scaffold + GitHub Actions CI/CD pipeline |

### TypeScript

- `npx tsc --noEmit` (frontend): 0 errors
- `npx tsc --noEmit -p apps/api/tsconfig.json` (API): 0 errors

### Schema

- `npx prisma validate`: schema valid
- `npx prisma generate`: client generated successfully

## Self-Check: PASSED
