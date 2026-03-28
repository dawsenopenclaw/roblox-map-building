# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-28)

**Core value:** Simple input → professional output. Speak or upload → get a playable Roblox game element in seconds.
**Current focus:** Phase 3 AI Engine complete — Ready for Phase 4

## Current Position

Phase: 3 of 8 (AI Engine)
Plan: 03 completed (1 of 1 in Phase 3)
Status: Phase 3 COMPLETE — AI engine fully implemented
Last activity: 2026-03-28 — Plan 03 executed: AI providers, circuit breakers, caching, voice/image/generate routes

Progress: [###░░░░░░░] 37%

## Performance Metrics

**Velocity:**
- Total plans completed: 4 (Phase 1: A, B, C, D)
- Average duration: ~23 minutes
- Total execution time: ~1.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| Phase 1 (Foundation) | 4 complete | ~90 min | ~23 min |
| Phase 3 (AI Engine) | 1 complete | ~25 min | ~25 min |

**Recent Trend:**
- Last 5 plans: [01-A: 18min, 01-B: 25min, 01-C: ~22min, 01-D: ~25min, 03: ~25min]
- Trend: Consistent, on track for April 8 deadline

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Init]: Start fresh (not extend roblox-auto-platform) — clean architecture, no legacy debt
- [Init]: Clerk for auth — COPPA compliance built-in, saves weeks
- [Init]: Stripe for all payments — already set up, handles tax/compliance/Connect
- [Init]: Legal compliance (Phase 2) runs parallel to AI Engine (Phase 3) — both unblock Phase 4
- [01-A]: Used @hono/node-server over Bun.serve — Node 22 LTS is Fly.io baseline
- [01-A]: Tailwind 3.x over Tailwind 4 beta — stable plugin ecosystem needed for Phase 4 UI
- [01-A]: Prisma 6.x over 7.x — v7 has breaking config changes, migrate when stable
- [01-A]: DIRECT_URL added to schema for Prisma connection pooling (Neon/Supabase PgBouncer compat)
- [01-A]: Rate limiter uses Redis zset pipeline for O(log n) sliding window accuracy
- [01-A]: Audit middleware is fire-and-forget — errors logged but never propagate to caller
- [01-B]: Used clerk.authenticateRequest (not verifyToken) in Hono — verifyToken not on ClerkClient v2
- [01-B]: Consent token stored plaintext (not hashed) — 256-bit random + unique constraint + 48hr TTL sufficient
- [01-B]: Soft delete on user.deleted — preserves audit trail for COPPA 5-year retention
- [01-B]: Under-13 dashboard blocking deferred — middleware can't do DB lookups at edge; guard enforced at API layer
- [01-D]: SENTRY_DSN (backend) separate from NEXT_PUBLIC_SENTRY_DSN (frontend) — allows different Sentry projects or shared DSN
- [01-D]: Deno sandbox uses spawn() not worker_threads — OS-level process isolation, not just V8
- [01-D]: Vercel cron secured by x-cron-secret header — simpler than IP range validation
- [01-D]: costTrackerRoutes are public (no auth) for Phase 1 — locked in Phase 8 admin panel
- [01-D]: zValidator + Zod 3.x requires (schema as any) cast — typed at c.req.valid() instead

### Pending Todos

- Wire CLERK_WEBHOOK_SECRET in .env.local and register webhook at dashboard.clerk.com
- Wire RESEND_API_KEY in .env.local for parental consent emails
- Add Clerk publicMetadata sync (isUnder13, parentConsented) for edge-compatible dashboard guard
- Set NEXT_PUBLIC_SENTRY_DSN and SENTRY_DSN in .env.local to enable error tracking
- Set NEXT_PUBLIC_POSTHOG_KEY in .env.local to enable analytics
- Set CRON_SECRET in .env.local; register Vercel cron for cost-snapshot endpoint

### Blockers/Concerns

- [Phase 1]: COPPA parental consent flow requires Clerk under-13 configuration — verify Clerk supports this before Phase 3
- [Phase 2]: DMCA agent registration (Copyright Office Form HAL) must be filed before marketplace goes live (Phase 6)
- [Phase 2]: Charity donation disclosure may require state-by-state registration — check with legal counsel before Phase 8 growth push
- [General]: Break-even at ~50 Starter users ($450 revenue after charity) — monitor closely at Phase 4 launch
- [Phase 1 stubs]: `scripts/backup.sh` requires AWS infra not yet provisioned
- [Phase 1 stubs]: Under-13 users can access /dashboard without parentConsentAt — full guard needs Clerk publicMetadata sync
- [Phase 1 stubs]: `cost-snapshot/route.ts` totalRevenue stubbed at 0 — wire to Stripe in Phase 3
- [Phase 3]: recordApiUsage() pattern established — must be called after every AI API call in Phase 3
- [03]: Two-phase generate endpoint (estimate→confirm) prevents accidental token spend on expensive pipelines
- [03]: Circuit breakers are in-process singletons — state resets on deploy; acceptable tradeoff vs Redis-backed state
- [03]: spendTokens re-implemented inline in routes — avoids cross-package TS path resolution complexity

## Session Continuity

Last session: 2026-03-28
Stopped at: Phase 3 Plan 03 complete. 2 commits: 71db71a, 2b18d7e. Summary at .planning/phases/03-ai-engine/03-SUMMARY.md
Resume file: None
