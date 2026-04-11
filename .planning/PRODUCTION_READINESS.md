# Production Readiness Checklist — `feat/mega-session-2026-04-10` → `master`

Last updated: 2026-04-11

**HEAD**: `f4e1d16` — compression + dashboard rate limit + dead leaderboard query removal
**Base**: `master`
**Diff**: ~31 commits, ~478 files, +89,427 / -9,996 LOC including Prisma migrations
**Status**: NOT READY TO MERGE. Preview deploy first, then work through this list.

---

## Before you merge — smoke test the preview

Vercel auto-builds a preview URL for every push to the branch. Check the
Vercel dashboard for `forjegames` project → Deployments tab → find the
deployment for `f4e1d16`. Open the preview URL and walk through:

1. **Homepage** (`/`)
   - Hero renders, rotating gold words animate (`RotatingHeroText`).
   - Scroll past "HOW IT WORKS" → "See it in action" section appears with
     3 product screenshots (editor, dashboard, pricing).
   - Screenshots load as AVIF/WebP (check network tab — each should be
     under ~150KB on first paint). Source PNGs are compressed to 81KB /
     625KB / 847KB.
   - No hydration warnings in browser console.
2. **404** (`/this-does-not-exist`)
   - Glitch "404" text animates in gold/blue chromatic aberration.
3. **Error page** — throw a deliberate error via the dev tools console or
   a known broken route. Heading should glitch.
4. **Dashboard** (`/dashboard`) — authenticated flow
   - `/api/dashboard/stats` response headers include `X-RateLimit-Limit`.
   - Spam-refresh the dashboard 10 times in 5 seconds — on the 11th refresh
     the SWR call should get a 429 with a `Retry-After` header, NOT a 500.
5. **Editor** (`/editor`)
   - Plugin pair works (Studio connect flow). This is the JWT hardening
     from `45bb3a8` — if anything studio-related is broken, it's that
     commit, not this session's work.
6. **Billing** (`/billing`)
   - Opens BillingClient, portal button routes through `POST /api/billing/portal`.
7. **Community leaderboard** — wherever it's rendered. Should show the 5
   demo entries without errors or 500s. (It was already showing demo
   before this session; now it does so without hitting the DB.)

---

## Env vars that MUST be set on Vercel production

Verify in Vercel dashboard → Project Settings → Environment Variables.
Both `Production` and `Preview` scopes should have these set.

### Database (BLOCKER if missing)
- `DATABASE_URL` — **pooled** connection string (pgbouncer / Supabase /
  Neon pooled host). Every serverless lambda invocation connects through
  this.
- `DIRECT_URL` — direct connection for `prisma migrate`. Used only by
  CI / `prisma migrate deploy`. Not hit on user requests.
- `SHADOW_DATABASE_URL` — only needed if running `prisma migrate dev`
  against the shadow DB; not required at runtime.

### Auth
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_APP_URL` — must match the production domain exactly
  (`https://forjegames.com`), no trailing slash

### Studio plugin (BLOCKER — the 45bb3a8 commit depends on this)
- `STUDIO_AUTH_SECRET` — **minimum 32 chars** or the new
  `studio-auth-secret.ts` helper will throw in production. Generate with
  `openssl rand -hex 32`. Must be the SAME value used when the plugin
  .rbxmx was last signed.

### Payments
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_*_PRICE_ID` — all 8 variants (starter/creator/studio monthly+annual)
- `ROBLOX_GAMEPASS_STARTER_ID`, `ROBLOX_GAMEPASS_PRO_ID`,
  `ROBLOX_GAMEPASS_STUDIO_ID`, `ROBUX_WEBHOOK_SECRET`

### Rate limiting (HIGH — without this every instance gets its own limiter)
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- Without these, `src/lib/rate-limit.ts` falls back to a per-instance
  in-memory limiter at 2× the Redis limit (see
  `src/lib/rate-limit.ts:108-145`). Acceptable for a preview but leaky
  across instances in production.

### AI providers
- `ANTHROPIC_API_KEY`
- `GROQ_API_KEY`
- `FAL_KEY`
- `GEMINI_API_KEY`
- `MESHY_API_KEY` — only if the mesh route is in use

### Email / notifications
- `RESEND_API_KEY`
- `RESEND_AUDIENCE_ID`
- `RESEND_FROM_EMAIL` — must be on a verified Resend domain
- `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — web push

### Ops
- `CRON_SECRET` — validates `/api/cron/*` invocations
- `TOKEN_HASH_SECRET`, `PUSH_ADMIN_SECRET` — internal HMAC
- `ADMIN_EMAILS` — comma-separated
- `SALES_NOTIFICATION_EMAIL`

### Demo mode — MUST be OFF in production
- `DEMO_MODE=false` (or unset — the code checks `=== 'true'`)
- `NEXT_PUBLIC_DEMO_MODE=false`
- If either is `true` on production the auth guards on several routes
  get bypassed. This is intentional for local dev only.

---

## What this branch ships that master doesn't

31 commits. Highlights from session memory + commit log:

- **Studio JWT hardening** (`45bb3a8`) — unified secret across
  `/api/studio/{auth,sync,execute}`, prevents "works for some users not
  all" bug.
- **Build executor Vercel lambda survival** (`45bb3a8`) — uses
  `after()` from `next/server` so the wave loop isn't killed when the
  HTTP response flushes. `maxDuration` bumped to 300s.
- **Image refund on Fal failure** (`ddadac8`) — no free credit burn on
  provider failure.
- **GlitchText + ProductPreviewGallery** (`b9854d7`) — marketing polish.
- **PNG compression + dashboard rate limit + dead leaderboard query**
  (`f4e1d16`) — this session's scale pass.
- **Prisma migrations** — the branch contains new DB migrations that
  `prisma migrate deploy` will run on first deploy to production. If the
  production DB is not at the same migration state as the last `master`
  build, `migrate deploy` will apply them sequentially. Failure mid-
  migration is the biggest risk — see mitigation below.

---

## Merge-to-master procedure

**Do not run this until the preview URL is fully smoke-tested.**

1. Back up the production database before touching master. Snapshot in
   the hosting provider UI. Keep for 7 days.
2. Merge in a NEW COMMIT (no squash, no fast-forward):
   ```bash
   git checkout master
   git pull origin master
   git merge --no-ff feat/mega-session-2026-04-10 \
     -m "merge: mega session 2026-04-10 → master"
   git push origin master
   ```
3. Vercel auto-deploys from master. Watch the build log for:
   - `prisma generate` success
   - `prisma migrate deploy` output (number of migrations applied)
   - Next.js build — expect ~3-5 min
4. **If the migrate step fails**: roll back immediately by reverting
   the merge commit on master, re-push. The DB backup from step 1 is
   your safety net if the migration partially applied.
   ```bash
   git revert -m 1 HEAD
   git push origin master
   ```

---

## First-hour watchlist post-merge

Open these in separate tabs and keep them live for the first hour:

- **Vercel → Functions → Invocations** — looking for 500 spikes
- **Vercel → Analytics → Web Vitals** — LCP should drop thanks to the
  PNG compression (was ~5s on homepage with the uncompressed screenshots,
  target <2.5s now)
- **Sentry → Issues (last 1h)** — any new error events, especially on
  `/api/studio/*` (JWT issues), `/api/ai/*` (auth/tier issues),
  `/api/billing/*` (Stripe webhook issues)
- **Stripe → Developers → Webhooks → `stripe-webhook` endpoint** —
  delivery success rate. Failed deliveries = silent billing bugs.
- **Upstash → Redis → Commands/sec** — verify rate limiter traffic is
  flowing. If 0, `UPSTASH_REDIS_REST_URL` is probably unset and you're
  running on the in-memory fallback.
- **Clerk → Users → Last 1h** — verify new signups complete the
  onboarding flow and land on `/editor`.

---

## Known gaps / nice-to-haves (do NOT block the merge on these)

- `creator-leaderboard` still serves demo data. Fix: add a nightly
  materialized view joining `UserXP` → `Project` aggregates. Tracked in
  `.planning/old-windows-assets/FORJEGAMES_WAVE3_ADDITIONS.md`.
- No index on `User.role` — current `/api/admin/users` filter does a
  full scan. Low traffic endpoint, can wait.
- `roblox-auto-platform` port (43 modules, ~4000 lines) — next dedicated
  session. Ports in priority order: ai-task-splitter → orchestrator →
  sub-agents → circuit-breaker → luau-validator.
- Full-repo `tsc --noEmit` OOMs at 8GB. Use `tsconfig.spotcheck.json`
  until someone fixes that.
- `.stash-backups/stash0` and `stash1` — deferred. Stash0 doesn't apply
  cleanly; stash1 is a multi-subsystem dump that needs individual
  extraction.

---

## Rollback plan

If post-merge anything goes sideways:

1. **Auth broken** (Studio plugin can't pair, users can't sign in):
   Revert the merge commit on master, push. Previous `master` build
   comes back in ~3 min.
2. **Migration partially applied** (DB in inconsistent state): restore
   from the snapshot taken in "Merge-to-master procedure step 1". This
   is the only scenario where the backup matters.
3. **One endpoint broken** (e.g. dashboard stats 429s too aggressively):
   Hotfix on master — edit the limit, commit, push. No rollback needed.
4. **LCP regressed on homepage**: probably a ProductPreviewGallery
   image failing to load. Check Vercel's image optimizer is running —
   the source PNGs are already compressed so the optimizer just has to
   generate AVIF/WebP variants, which it does in-request-first-hit then
   caches. If one fails, comment out the slide in
   `src/components/marketing/ProductPreviewGallery.tsx:19-42`.
