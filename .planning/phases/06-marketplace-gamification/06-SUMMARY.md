---
phase: 6
plan: 1
subsystem: marketplace-gamification
tags: [marketplace, gamification, stripe-connect, xp, achievements, streaks]
dependency_graph:
  requires: [prisma-schema, stripe, clerk-auth]
  provides: [template-marketplace, creator-payouts, xp-system, achievements, streaks]
  affects: [dashboard, sidebar, user-profile]
tech_stack:
  added: [Stripe Connect Express, achievement toast system]
  patterns: [70/30 creator split, daily XP cap, verified-purchase reviews, streak milestone bonuses]
key_files:
  created:
    - prisma/schema.prisma (Template, TemplateScreenshot, TemplateReview, TemplatePurchase, CreatorAccount, UserXP, XPEvent, Achievement, UserAchievement, Streak)
    - src/app/(app)/marketplace/page.tsx
    - src/app/(app)/marketplace/submit/page.tsx
    - src/app/(app)/marketplace/[id]/page.tsx
    - src/app/(app)/marketplace/[id]/PurchaseButton.tsx
    - src/app/(app)/marketplace/[id]/ReviewForm.tsx
    - src/app/(app)/marketplace/earnings/page.tsx
    - src/app/(app)/achievements/page.tsx
    - src/app/api/marketplace/templates/route.ts
    - src/app/api/marketplace/templates/[id]/purchase/route.ts
    - src/app/api/marketplace/templates/[id]/reviews/route.ts
    - src/app/api/marketplace/connect/onboard/route.ts
    - src/app/api/marketplace/earnings/route.ts
    - src/app/api/gamification/earn-xp/route.ts
    - src/app/api/gamification/streak/route.ts
    - src/app/api/gamification/status/route.ts
    - src/app/api/gamification/achievements/route.ts
    - src/components/TierBadge.tsx
    - src/components/AchievementToast.tsx
    - src/lib/achievements.ts
  modified:
    - src/components/StreakWidget.tsx (wired to live /api/gamification/status)
    - src/components/AppShell.tsx (added AchievementToastProvider)
    - src/components/AppSidebar.tsx (added Achievements nav item)
decisions:
  - 70/30 creator/platform split via Stripe Connect transfer on every paid purchase
  - Daily XP cap of 500 (achievements and streak bonuses bypass cap)
  - Review gate requires verified purchase (purchaseId unique constraint prevents duplicate reviews)
  - Free templates create purchase record directly without Stripe
  - Monthly payout when balance >= $20 via Stripe Connect Express
  - 30 achievements across 6 categories seeded from static ACHIEVEMENTS constant
metrics:
  duration: ~120 minutes
  completed: "2026-03-28"
  tasks_completed: 9
  files_created: 21
  files_modified: 3
---

# Phase 6 Plan 1: Marketplace + Gamification Summary

JWT-less marketplace with Stripe Connect Express payouts (70/30 split), 6-category template browsing with full-text search, verified-purchase review system, XP progression across 6 tiers (Novice to Mythic), 30 achievements across 6 categories, and login/build streaks with token milestone bonuses.

## What Was Built

### Marketplace (MARKET-01 through MARKET-05)

**Template Submission (MARKET-01)**
- `src/app/(app)/marketplace/submit/page.tsx` — full form with title, description, category, price, rbxm URL, thumbnail, up to 5 screenshots, and comma-separated tags
- `POST /api/marketplace/templates` — creates listing in PENDING_REVIEW status with nested screenshots

**Marketplace Browse (MARKET-02)**
- `src/app/(app)/marketplace/page.tsx` — client-side browse with SWR
- 6 categories: Game Templates, Map Templates, UI Kits, Scripts, Assets, Sounds
- Filters: category tabs, sort (trending/new/top-rated/price-asc/price-desc)
- Full-text search across title, description, tags
- Template cards with thumbnail, creator, star rating, price, download count
- Pagination at 24 per page

**Template Detail (MARKET-03)**
- `src/app/(app)/marketplace/[id]/page.tsx` — server component
- Screenshot gallery with main + thumbnail strip
- Creator profile card with TierBadge
- Purchase button with Stripe Checkout for paid templates, direct free claim for free
- Verified-purchase review form (star picker + text)
- Creator response UI within each review

**Stripe Connect Payouts (MARKET-04)**
- `POST /api/marketplace/connect/onboard` — creates Stripe Express account, generates onboarding link
- `GET /api/marketplace/earnings` — earnings dashboard with pending balance, total earned, recent 30-day sales
- `src/app/(app)/marketplace/earnings/page.tsx` — earnings UI with setup incomplete banner
- 70% creator / 30% platform split via `application_fee_amount` + `transfer_data`

**Review System (MARKET-05)**
- `POST /api/marketplace/templates/[id]/reviews` — verified purchase required, one review per purchase (unique constraint)
- `GET /api/marketplace/templates/[id]/reviews` — list all reviews
- `PATCH /api/marketplace/templates/[id]/reviews` — creator responds (creator-only guard)
- Rating recalculated on every new review using aggregate query

### Gamification (GAME-01 through GAME-04)

**XP System (GAME-01)**
- Prisma models: UserXP, XPEvent (with XPEventType enum)
- XP rates: BUILD=10, PUBLISH=100, SALE=50-500 (tiered by amount), REFERRAL=200, DAILY_LOGIN=5
- 500 XP daily cap; achievements and streak bonuses bypass cap
- `POST /api/gamification/earn-xp` returns awarded amount, tier change signal, daily remaining

**6-Tier Progression (GAME-02)**
- Tiers: NOVICE(0), APPRENTICE(500), BUILDER(2000), MASTER(5000), LEGEND(15000), MYTHIC(50000)
- `src/components/TierBadge.tsx` — inline badge with tier-specific color + icon
- `TierProgressBar` component shows progress to next tier
- TierBadge used on marketplace creator cards and profile

**30 Achievements (GAME-03)**
- `src/lib/achievements.ts` — static definitions, 30 achievements across 6 categories
- FIRST_STEPS(6): first build, publish, profile complete, purchase, review, sale
- VELOCITY(5): 10/50/100 builds, speed builder, weekend warrior
- MARKETPLACE(6): 5 publishes, 10/100 sales, 5-star, perfect rating, $100 earned
- COMMUNITY(5): 1/10 referrals, 10 reviews, 10 purchases, Stripe connected
- QUALITY(4): XP tier milestones (500/2000/5000/15000)
- EXPLORATION(4): 7/30/100 day streaks, all categories published
- `GET /api/gamification/achievements` — returns all 30 with unlock status per user
- `src/app/(app)/achievements/page.tsx` — grid grouped by category with unlock progress bar
- `src/components/AchievementToast.tsx` — in-memory event bus for unlock toast notifications

**Streaks (GAME-04)**
- Prisma model: Streak (login + build streak, longest, totals)
- `POST /api/gamification/streak` — records login or build, handles consecutive day detection
- Milestone bonuses: 7-day=50 tokens, 30-day=200 tokens, 100-day=1000 tokens
- `GET /api/gamification/streak` — current streak data
- `src/components/StreakWidget.tsx` — now live-wired to `/api/gamification/status`, shows both login and build streaks

## Commits

| Hash | Description |
|------|-------------|
| d168777 | chore: initial commit before phase 7 (schema already included) |
| 4c68675 | feat(06-marketplace): marketplace browse, submit, detail, purchase, reviews, Stripe Connect earnings |
| 58fbb55 | feat(06-gamification): achievement toast provider, sidebar nav, AppShell integration |
| a23912b | fix(06-marketplace): fix TypeScript errors in earn-xp and purchase routes |

## Deviations from Plan

### Auto-added Missing Critical Functionality

**1. [Rule 2 - Missing] Added /api/gamification/status combined endpoint**
- Found during: GAME-04 implementation
- Issue: StreakWidget needed XP + streak data in a single fetch to avoid waterfall
- Fix: Created `GET /api/gamification/status` that returns xp, streak, and recent achievements together
- Files: `src/app/api/gamification/status/route.ts`

**2. [Rule 1 - Bug] Fixed TypeScript null/JSON type mismatch in earn-xp**
- Found during: tsc --noEmit check
- Issue: Prisma JSON field required `Prisma.JsonNull` not `null`
- Fix: Import Prisma namespace, use `Prisma.JsonNull`

**3. [Rule 1 - Bug] Fixed Stripe session params type**
- Found during: tsc --noEmit check
- Issue: `Parameters<typeof stripe.checkout.sessions.create>[0]` resolved to RequestOptions
- Fix: Use explicit `Stripe.Checkout.SessionCreateParams` type

## Known Stubs

- `StreakWidget`: Previously showed hardcoded streak=7, xp=1240. **Now wired** to `/api/gamification/status`. Initial render shows loading skeleton.
- Achievement unlock toast: `notifyAchievementUnlock()` is exported but caller integration (e.g., in earn-xp API response handler) is not yet wired in a client component. The toast system is ready; callers need to import and call `notifyAchievementUnlock` after a successful XP earn that triggers an achievement. This will be connected in Phase 8 when a dashboard activity feed polls for new achievements.

## Self-Check: PASSED

Files verified present:
- src/app/(app)/marketplace/page.tsx — FOUND
- src/app/(app)/marketplace/submit/page.tsx — FOUND
- src/app/(app)/marketplace/[id]/page.tsx — FOUND
- src/app/(app)/marketplace/earnings/page.tsx — FOUND
- src/app/(app)/achievements/page.tsx — FOUND
- src/components/TierBadge.tsx — FOUND
- src/components/AchievementToast.tsx — FOUND
- src/lib/achievements.ts — FOUND
- src/app/api/gamification/earn-xp/route.ts — FOUND
- src/app/api/gamification/streak/route.ts — FOUND
- src/app/api/marketplace/templates/route.ts — FOUND
- src/app/api/marketplace/connect/onboard/route.ts — FOUND

Commits verified: a23912b, 58fbb55, 4c68675 all present in git log.
TypeScript: zero errors in Phase 6 files (tsc --noEmit passes for all src/app/(app)/marketplace/**, src/app/(app)/achievements/**, src/app/api/gamification/**, src/app/api/marketplace/**).
