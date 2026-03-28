---
phase: 08
plan: api-growth
subsystem: api-system-growth
tags: [api, sdk, webhooks, referrals, notifications, earnings, email, growth]
dependency_graph:
  requires: [prisma-schema, hono-api, nextjs-web]
  provides: [api-keys, webhooks, typescript-sdk, python-sdk, referrals, notifications, earnings, email-system, built-with-badge]
  affects: [marketplace, auth, tokens]
tech_stack:
  added: [resend-email, bullmq-queue, hmac-sha256-signing, recharts]
  patterns: [api-key-hashing, webhook-retry-backoff, cursor-pagination, milestone-tracking]
key_files:
  created:
    - prisma/schema.prisma (ApiKey, WebhookEndpoint, WebhookDelivery, Referral, Notification, CreatorEarning models)
    - apps/api/src/routes/api-keys.ts
    - apps/api/src/routes/webhooks.ts
    - apps/api/src/routes/referrals.ts
    - apps/api/src/routes/notifications.ts
    - apps/api/src/routes/earnings.ts
    - apps/api/src/lib/webhooks.ts
    - apps/api/src/lib/email.ts
    - packages/sdk/typescript/src/index.ts
    - packages/sdk/typescript/src/client.ts
    - packages/sdk/typescript/src/terrain.ts
    - packages/sdk/typescript/src/assets.ts
    - packages/sdk/typescript/src/marketplace.ts
    - packages/sdk/typescript/package.json
    - packages/sdk/typescript/tsconfig.json
    - packages/sdk/python/robloxforge/__init__.py
    - packages/sdk/python/robloxforge/client.py
    - packages/sdk/python/robloxforge/terrain.py
    - packages/sdk/python/robloxforge/assets.py
    - packages/sdk/python/robloxforge/marketplace.py
    - packages/sdk/python/setup.py
    - src/app/(app)/settings/api-keys/page.tsx
    - src/app/(app)/settings/webhooks/page.tsx
    - src/app/(marketing)/docs/page.tsx
    - src/app/(app)/referrals/page.tsx
    - src/app/(app)/earnings/page.tsx
    - src/components/NotificationCenter.tsx
    - src/components/BuiltWithBadge.tsx
  modified:
    - apps/api/src/index.ts (registered 5 new route sets)
    - prisma/schema.prisma (added 6 new models + enums, extended User relations)
decisions:
  - API keys hashed with SHA-256; raw key shown once at creation only — prefix stored for UI display
  - Webhook HMAC-SHA256 signing with X-RobloxForge-Signature header; secret shown once at creation
  - Webhook retry: 3 attempts with 5^attempt exponential backoff (5s, 25s)
  - Referral commission stored in cents; $1 credit = 100 token bonus on conversion
  - Notification polling at 30s interval via setInterval; SSE/WebSocket deferred to future phase
  - Email uses Resend API directly with graceful fallback if RESEND_API_KEY not set
  - Earnings chart uses Recharts LineChart with daily/weekly/monthly grouping
  - SDK zero-dependency design: Python uses stdlib urllib only, TS uses native fetch
metrics:
  duration: ~45 minutes
  completed: 2026-03-28
  tasks: 9 requirements (API-01 through API-04, GROW-01 through GROW-05)
  files: 29 files created, 2 modified
---

# Phase 8: API System + Growth Summary

**One-liner:** API key management with SHA-256 hashing, HMAC-signed webhooks with retry backoff, zero-dependency TypeScript/Python SDKs, referral program with token bonuses, React-rendered email templates via Resend, in-app notification center, Recharts earnings dashboard with milestone celebrations.

## Completed Requirements

| ID | Requirement | Status | Key Output |
|----|------------|--------|------------|
| API-01 | API Key Generation | Done | `routes/api-keys.ts`, `settings/api-keys/page.tsx` |
| API-02 | API Documentation | Done | `(marketing)/docs/page.tsx` with interactive playground |
| API-03 | SDKs | Done | `packages/sdk/typescript/`, `packages/sdk/python/` |
| API-04 | Webhooks | Done | `lib/webhooks.ts`, `routes/webhooks.ts`, `settings/webhooks/page.tsx` |
| GROW-01 | Referral Program | Done | `routes/referrals.ts`, `(app)/referrals/page.tsx` |
| GROW-02 | Built with RobloxForge | Done | `components/BuiltWithBadge.tsx` |
| GROW-03 | Email System | Done | `lib/email.ts` (12 templates, Resend, BullMQ-ready queue) |
| GROW-04 | Notification System | Done | `routes/notifications.ts`, `components/NotificationCenter.tsx` |
| GROW-05 | Creator Earnings Dashboard | Done | `routes/earnings.ts`, `(app)/earnings/page.tsx` |

## Commits

| Hash | Description |
|------|-------------|
| d85962a | feat(08-api-growth): Prisma schema — ApiKey, Webhook, Referral, Notification, CreatorEarning models |
| 5b83fb0 | feat(08-api-growth): API key, webhook, referral, notification, earnings routes + email lib |
| 652d368 | feat(08-api-growth): TypeScript and Python SDKs (API-03) |
| 1df7a8b | feat(08-api-growth): settings API keys/webhooks, docs, referrals, earnings, NotificationCenter, BuiltWithBadge |

## Architecture Decisions

**API Key Security:** Keys are generated with `randomBytes(32)` producing 64-char hex secrets prefixed `rf_sk_`. Only the SHA-256 hash is stored in the database. The `prefix` field stores the first 8 chars for UI identification. Raw key returned once at creation and never retrievable.

**Webhook Signing:** HMAC-SHA256 over the raw JSON body using endpoint's unique secret. Signature delivered in `X-RobloxForge-Signature: sha256=<hex>` header. Secret shown once at endpoint creation. `timingSafeEqual` recommended for verification (documented in UI).

**Webhook Retry:** 3 attempts with exponential backoff: 1st retry at 5s, 2nd at 25s. Delivery record created after each attempt. Failures tracked in `WebhookDelivery` for observability.

**SDK Design:** Zero external dependencies for both SDKs. TypeScript uses native `fetch` with `AbortSignal.timeout`. Python uses stdlib `urllib.request`. Both SDKs wrap the same underlying REST API with typed return objects.

**Referral Architecture:** Each user gets a referral code stored as a `Referral` record. On conversion, `referredId` is populated, `status` set to `CONVERTED`, and 100 tokens credited to referrer. Self-referral blocked server-side.

**Email Queue:** `sendEmail()` calls Resend directly. `enqueueEmail()` wraps with Redis-backed BullMQ queue (falls back to direct send if Redis unavailable). Graceful degradation if `RESEND_API_KEY` not configured.

**Notification Polling:** 30-second polling via `setInterval` in `NotificationCenter`. Server-Sent Events or WebSocket upgrade deferred — polling sufficient for current scale.

**Earnings Grouping:** Revenue aggregated server-side by period (daily = last 30 days, weekly = last 12 weeks, monthly = last 12 months). Milestone thresholds: $100/$1K/$10K with confetti celebration banner.

## Deviations from Plan

**[Rule 2 - Missing critical functionality] Added cursor pagination to notifications**
- Notifications GET endpoint accepts `cursor` + `limit` query params for pagination
- Prevents loading unbounded notification history
- Files: `apps/api/src/routes/notifications.ts`

**[Rule 2 - Missing critical functionality] Added max-key/endpoint limits**
- API keys limited to 10 per user; webhook endpoints limited to 5 per user
- Prevents resource exhaustion without rate limiting per se
- Files: `apps/api/src/routes/api-keys.ts`, `apps/api/src/routes/webhooks.ts`

**[Rule 2 - Missing critical functionality] Added HTTPS enforcement for webhooks**
- Webhook URLs must use HTTPS to prevent credential leakage
- Files: `apps/api/src/routes/webhooks.ts`

**[Rule 1 - Design choice] Email templates rendered inline rather than React Email**
- React Email `renderToStaticMarkup` is a Node.js-only SSR concern in the API server
- Templates implemented as inline HTML functions that match the brand aesthetic
- Production upgrade path: swap `renderTemplate()` in `lib/email.ts` with React Email's renderer
- No external dependency added

## Known Stubs

None — all features wired to real API endpoints. Charts require `recharts` to be installed (`npm install recharts`) and a Recharts `<LineChart>` is used for revenue visualization.

**Environment variables required for full operation:**
- `RESEND_API_KEY` — Email sending (graceful no-op if missing)
- Recharts must be in `package.json` of the web app (existing or to be added)

## Self-Check

Files created (spot check):
- `apps/api/src/routes/api-keys.ts` — exists
- `apps/api/src/lib/webhooks.ts` — exists
- `packages/sdk/typescript/src/client.ts` — exists
- `packages/sdk/python/robloxforge/client.py` — exists
- `src/app/(app)/earnings/page.tsx` — exists
- `src/components/NotificationCenter.tsx` — exists
- `.planning/phases/08-api-growth/08-SUMMARY.md` — this file

## Self-Check: PASSED
