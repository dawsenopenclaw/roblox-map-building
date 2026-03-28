---
phase: 01-foundation
plan: C
subsystem: billing
tags: [stripe, subscriptions, tokens, charity, webhooks]
dependency_graph:
  requires:
    - 01-A (Prisma schema: Subscription, TokenBalance, TokenTransaction, CharityDonation models)
    - 01-B (Clerk auth: requireAuthUser, getAuthUser)
  provides:
    - stripe singleton + checkout session helpers (src/lib/stripe.ts)
    - subscription tier definitions (src/lib/subscription-tiers.ts)
    - earnTokens/spendTokens server functions (src/lib/tokens-server.ts)
    - processDonation charity auto-transfer (src/lib/charity.ts)
    - Stripe webhook event handling (src/app/api/webhooks/stripe/route.ts)
    - Dashboard with live token widget (src/app/(app)/dashboard/page.tsx)
  affects:
    - Phase 3 AI engine: call spendTokens(userId, cost, description) before every AI operation
    - Phase 4 token UI: GET /api/tokens/balance, full transaction history page
    - Phase 6 analytics: CharityDonation and TokenTransaction tables ready
tech_stack:
  added:
    - stripe@17 (already installed in root workspace)
    - swr (already installed in root workspace)
    - @clerk/backend (used in Hono API auth middleware)
  patterns:
    - Prisma $transaction for atomic token balance mutations
    - Stripe Transfers API for 10% charity auto-donation
    - Next.js App Router API routes (POST/GET)
    - SWR polling at 30s intervals for live balance display
key_files:
  created:
    - src/lib/stripe.ts
    - src/lib/subscription-tiers.ts
    - src/lib/tokens-server.ts
    - src/lib/charity.ts
    - src/app/api/billing/checkout/route.ts
    - src/app/api/billing/portal/route.ts
    - src/app/api/webhooks/stripe/route.ts
    - src/app/api/tokens/balance/route.ts
    - src/app/api/user/charity/route.ts
    - src/app/(app)/layout.tsx
    - src/app/(app)/dashboard/page.tsx
    - src/components/TokenBalanceWidget.tsx
    - src/components/CharitySelector.tsx
    - apps/api/src/routes/tokens.ts
    - apps/api/src/middleware/auth.ts
  modified:
    - apps/api/src/index.ts (added /api/tokens route)
    - .env.example (added all new Stripe price ID vars)
decisions:
  - CharitySelector imports CHARITIES as inline const instead of from src/lib/charity.ts to avoid importing a server-only module (stripe) in a client component
  - Charity donation fires non-blocking (.catch) on both checkout.session.completed and invoice.paid to never block payment acknowledgment
  - Added GET /api/tokens/balance as a Next.js route (not just Hono) so TokenBalanceWidget can call it from the frontend without CORS issues
  - auth middleware in Hono API uses clerk.verifyToken from @clerk/backend (already installed) rather than adding jose dependency
metrics:
  duration: "~25 minutes"
  completed: "2026-03-28"
  tasks: 3
  files_created: 15
  files_modified: 2
---

# Phase 1 Plan C: Stripe Billing + Token Economy + Charity Donations Summary

**One-liner:** Stripe Checkout for 4 subscription tiers and 3 token packs, atomic earn/spend token balance with Prisma transactions, and 10% charity auto-transfer via Stripe Transfers API on every payment event.

## What Was Built

### Task 1: Stripe Client + Subscription Tiers + Billing Routes (commit: 9d85b78)

**src/lib/stripe.ts** — Stripe singleton and helpers:
- `stripe` singleton using `STRIPE_SECRET_KEY`
- `createCustomer({ email, userId })` — creates Stripe customer with userId metadata
- `createSubscriptionCheckoutSession(...)` — 14-day trial, automatic tax, subscription mode
- `createTokenPackCheckoutSession(...)` — one-time payment mode
- `createBillingPortalSession(...)` — customer self-service portal
- `constructWebhookEvent(payload, signature)` — verifies Stripe signature

**src/lib/subscription-tiers.ts** — single source of truth for tiers and packs:
```
FREE:    0/mo,  500 tokens/mo
HOBBY:   $9.99/mo, 2,000 tokens/mo  (yearly: $95.90)
CREATOR: $24.99/mo, 7,000 tokens/mo (yearly: $239.90)
STUDIO:  $49.99/mo, 20,000 tokens/mo (yearly: $479.90)

TOKEN PACKS:
starter: 1,000 tokens / $10.00
creator: 5,000 tokens / $45.00
pro:    15,000 tokens / $120.00
```

**API Routes:**
- `POST /api/billing/checkout` — accepts `{ type: 'subscription', tier, yearly? }` or `{ type: 'token_pack', packSlug }`, returns `{ url: checkoutSessionUrl }`
- `POST /api/billing/portal` — returns `{ url: billingPortalUrl }`

### Task 2: Stripe Webhook + Token Balance + Charity (commit: b9e0111)

**src/lib/tokens-server.ts** — token balance operations (server-only):
```typescript
earnTokens(userId, amount, type, description, metadata?) // increments balance + creates TokenTransaction atomically
spendTokens(userId, amount, description, metadata?)      // throws 'Insufficient token balance' if balance < amount
getTokenBalance(userId)                                   // returns balance + last 20 transactions
```

**src/lib/charity.ts** — charity donation logic:
```typescript
calculateDonationAmount(paymentAmountCents) // Math.floor(amount * 0.1)
processDonation({ userId, paymentAmountCents, sourcePurchaseId })
// -> creates CharityDonation record (PROCESSING) -> stripe.transfers.create -> updates to COMPLETED
// -> on failure: updates to FAILED, re-throws
// -> skips transfer if donationAmount < 50 cents (Stripe minimum)
```

**Stripe Webhook Events Handled** (`src/app/api/webhooks/stripe/route.ts`):
| Event | Action |
|---|---|
| `checkout.session.completed` (token_pack) | `earnTokens(userId, pack.tokens, 'PURCHASE', ...)` |
| `checkout.session.completed` (all) | `processDonation(10% non-blocking)` |
| `invoice.paid` | `earnTokens(userId, tierAllowance, 'SUBSCRIPTION_GRANT', ...)` + `processDonation(10% non-blocking)` |
| `customer.subscription.created/updated` | Updates `Subscription.tier`, `status`, `currentPeriodStart/End`, `cancelAtPeriodEnd` |
| `customer.subscription.deleted` | Sets `Subscription.status = 'CANCELED'` |

**Hono API Token Route** (`apps/api/src/routes/tokens.ts`):
- `GET /api/tokens/balance` — requires Bearer auth, returns `{ balance, lifetimeEarned, lifetimeSpent, transactions }`

### Task 3: Dashboard UI (commit: f4a1d59)

**TokenBalanceWidget** — SWR fetch to `/api/tokens/balance`, 30s polling, gold `#FFB81C` balance display, skeleton loading state

**CharitySelector** — 3 charity options with selected highlight, auto-saves on click via `POST /api/user/charity`

**Dashboard** at `/dashboard` — grid layout with TokenBalanceWidget, subscription tier display, CharitySelector

**App Layout** (`src/app/(app)/layout.tsx`) — auth gate: redirects to `/sign-in` if unauthenticated, redirects under-13 without consent to `/onboarding/parental-consent`

## Environment Variables Required

Add these to `.env` (already in `.env.example`):
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_FREE_PRICE_ID=price_...
STRIPE_HOBBY_PRICE_ID=price_...
STRIPE_HOBBY_YEARLY_PRICE_ID=price_...
STRIPE_CREATOR_PRICE_ID=price_...
STRIPE_CREATOR_YEARLY_PRICE_ID=price_...
STRIPE_STUDIO_PRICE_ID=price_...
STRIPE_STUDIO_YEARLY_PRICE_ID=price_...
STRIPE_TOKEN_STARTER_PRICE_ID=price_...
STRIPE_TOKEN_CREATOR_PRICE_ID=price_...
STRIPE_TOKEN_PRO_PRICE_ID=price_...
STRIPE_CHARITY_ACCOUNT_ID=acct_...  (connected Stripe account for charity transfers)
```

## API Signatures for Phase 3 AI Engine

```typescript
// Deduct tokens before any AI operation:
import { spendTokens } from '@/lib/tokens-server'
await spendTokens(userId, tokenCost, 'AI terrain generation', { operationId })

// Grant tokens (bonus, refund):
import { earnTokens } from '@/lib/tokens-server'
await earnTokens(userId, amount, 'BONUS', 'Referral bonus', { referralId })
```

## Charity Donation Flow

1. Stripe fires `checkout.session.completed` or `invoice.paid`
2. Webhook handler calls `processDonation({ userId, paymentAmountCents, sourcePurchaseId })`
3. `calculateDonationAmount(amountCents)` = `Math.floor(amountCents * 0.1)` — exact 10%, floor rounded
4. If `donationAmountCents >= 50` (Stripe minimum): creates `CharityDonation` record (status: PROCESSING)
5. `stripe.transfers.create({ amount, destination: STRIPE_CHARITY_ACCOUNT_ID, transfer_group: 'donation_...' })`
6. Updates record to COMPLETED with `stripeTransferId`, or FAILED on error
7. Donation failure is non-blocking (wrapped in `.catch`) — never blocks payment acknowledgment

**Example:** $9.99 payment → `Math.floor(999 * 0.1)` = 99 cents donated ($0.99)

## Deviations from Plan

### Auto-fixed Issue 1

**[Rule 2 - Missing Critical Functionality] Added GET /api/tokens/balance as Next.js route**
- **Found during:** Task 3
- **Issue:** TokenBalanceWidget (client component) fetches `/api/tokens/balance` via SWR. The Hono API runs on port 3001 which would cause CORS issues from the Next.js frontend on port 3000.
- **Fix:** Added `src/app/api/tokens/balance/route.ts` as a Next.js App Router GET route that runs in the same origin as the frontend.
- **Files modified:** `src/app/api/tokens/balance/route.ts` (new)

### Auto-fixed Issue 2

**[Rule 2 - Missing Critical Functionality] CharitySelector uses inline CHARITIES constant**
- **Found during:** Task 3
- **Issue:** `src/lib/charity.ts` imports `stripe` (server-only). Importing it in a client component would bundle Stripe secret key logic into the browser bundle.
- **Fix:** CharitySelector defines its own inline `CHARITIES` constant (same data, no server imports).
- **Files modified:** `src/components/CharitySelector.tsx`

### Auto-fixed Issue 3

**[Rule 1 - Bug] Auth middleware uses clerk.verifyToken instead of raw JWT decode**
- **Found during:** Task 2
- **Issue:** Initial auth middleware attempted `jose` JWT verification but `jose` was not installed. `@clerk/backend` (already installed) provides `clerk.verifyToken()` which handles JWT verification correctly.
- **Fix:** Rewrote auth middleware to use `createClerkClient` from `@clerk/backend`.
- **Files modified:** `apps/api/src/middleware/auth.ts`

## Known Stubs

None — all data flows are wired. The dashboard displays live data from the database via authenticated API routes.

## Self-Check: PASSED

Files verified:
- FOUND: src/lib/stripe.ts
- FOUND: src/lib/subscription-tiers.ts
- FOUND: src/lib/tokens-server.ts
- FOUND: src/lib/charity.ts
- FOUND: src/app/api/billing/checkout/route.ts
- FOUND: src/app/api/billing/portal/route.ts
- FOUND: src/app/api/webhooks/stripe/route.ts
- FOUND: src/app/api/tokens/balance/route.ts
- FOUND: src/components/TokenBalanceWidget.tsx
- FOUND: src/components/CharitySelector.tsx
- FOUND: src/app/(app)/dashboard/page.tsx

Commits verified:
- 9d85b78: feat(01-C): Stripe client + subscription tiers + billing checkout routes
- b9e0111: feat(01-C): Stripe webhook handler + token balance system + charity donation
- f4a1d59: feat(01-C): Token balance dashboard widget + charity selection UI

TypeScript errors: 0
