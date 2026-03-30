# Stripe & Clerk Webhook Security Audit Report

**Date:** 2026-03-29
**Status:** CRITICAL ISSUES FOUND
**Severity Breakdown:** 2 Critical, 3 High, 2 Medium

---

## EXECUTIVE SUMMARY

The webhook handlers contain **critical race conditions**, **missing event handlers**, and **potential duplicate token grants** that could cause payment data inconsistency and revenue loss. The Stripe handler lacks comprehensive error recovery and the Clerk handler has a missing transaction guard.

---

## STRIPE WEBHOOK AUDIT (route.ts)

### 1. SIGNATURE VERIFICATION ✓ PASS
**Line 22:** `constructWebhookEvent()` properly validates webhook signatures using Stripe's native verification.
- Correctly uses `stripe.webhooks.constructEvent()` with `STRIPE_WEBHOOK_SECRET`
- Returns 400 on invalid signatures (line 24)
- Secret properly stored in env var (checked in stripe.ts line 104-106)

**Status:** Secure

---

### 2. EVENT TYPE COVERAGE

#### HANDLED EVENTS (9 total):
1. `checkout.session.completed` (line 29)
2. `invoice.paid` (line 134)
3. `customer.subscription.created` (line 174)
4. `customer.subscription.updated` (line 174)
5. `customer.subscription.deleted` (line 229)
6. `invoice.payment_failed` (line 238)
7. `charge.dispute.created` (line 253)
8. `customer.subscription.trial_will_end` (line 267)
9. `charge.refunded` (line 275)

#### CRITICAL MISSING HANDLERS:
- **`payment_intent.succeeded`** - Optional but recommended for additional confirmation
- **`invoice.finalization_failed`** - Invoice fails to finalize (should update subscription status)
- **`invoice.voided`** - Could indicate disputed/refunded invoices that bypass the invoice.paid handler
- **`charge.dispute.updated`** - Only watches creation; disputes can be updated/won/lost
- **`charge.dispute.closed`** - Needs resolution tracking
- **`customer.subscription.resumed`** - If subscription paused/resumed (status 'paused' handled but no event)
- **`charge.captured`** - For delayed capture workflows
- **`customer.updated`** - Email/address changes should sync to subscription
- **`account.external_account.deleted`** - Charity account disconnection

**Status:** CRITICAL - Missing handlers could cause payment desync

---

### 3. DUPLICATE DELIVERY VULNERABILITY ⚠️ CRITICAL

**Problem:** Stripe retries failed webhook deliveries for up to 3 days. The current system has **inconsistent idempotency checks**:

#### PROPERLY IDEMPOTENT:
- `checkout.session.completed` → token pack: Uses `sessionId` metadata (lines 43-46)
- `invoice.paid` → token grant: Uses `invoiceId` metadata (lines 153-156)
- Template purchase: Uses `templateId_buyerId` upsert (line 66-81)

#### NOT IDEMPOTENT:
- **Charity donations:** Only checks `sourcePurchaseId` (line 36-39) BUT this is called:
  - In `checkout.session.completed` (line 123)
  - In `invoice.paid` (line 164)
  - **If BOTH fire for the same payment → 2 donations created** (one per event)

- **Subscription status updates:** `customer.subscription.updated` uses upsert BUT:
  - If webhook retries, fields could be overwritten with same values (wasteful but safe)
  - However, `cancelAtPeriodEnd` and other flags updated on every retry

- **refund handling:** Uses `paymentIntentId` but no deduplication check:
  - If `charge.refunded` retries, `spendTokens` called multiple times
  - Line 316-318 catches exceptions but doesn't track already-reversed tokens

**Status:** CRITICAL - Duplicate donations and refunds possible

---

### 4. TOKEN PACK CREDIT FLOW ✓ MOSTLY PASS

**Lines 39-51:**
```typescript
if (isPaid && session.metadata?.type === 'token_pack' && session.metadata.tokenPackSlug) {
  const pack = getTokenPackBySlug(session.metadata.tokenPackSlug)
  if (pack) {
    const alreadyCredited = await db.tokenTransaction.findFirst({
      where: { metadata: { path: ['sessionId'], equals: session.id } }
    })
    if (!alreadyCredited) {
      await earnTokens(userId, pack.tokens, 'PURCHASE', `Purchased ${pack.name}`, { sessionId: session.id })
    }
  }
}
```

**Strengths:**
- Checks `isPaid` before crediting
- Idempotency guard via sessionId
- Uses atomic transaction in `earnTokens()`

**Issues:**
- If `getTokenPackBySlug()` returns null (invalid slug), silently fails (no error logging)
- No validation that `pack.tokens` matches session amount

**Status:** PASS (minor logging issue)

---

### 5. CHARITY DONATION TRIGGER ⚠️ CRITICAL

**Lines 122-130 (checkout.session.completed):**
```typescript
if (isPaid && session.amount_total && session.amount_total > 0) {
  await processDonation({...}).catch(() => {})
}
```

**Lines 164-170 (invoice.paid):**
```typescript
await processDonation({
  userId,
  paymentAmountCents: invoice.amount_paid,
  sourcePurchaseId: invoice.id,
}).catch(() => {})
```

**DUPLICATE DONATION BUG:**
- Stripe fires **BOTH** `checkout.session.completed` AND `invoice.paid` for subscription initial payments
- For one $99 subscription purchase, **2 donations** are processed:
  1. 10% × $99 = $9.90 from checkout event
  2. 10% × $99 = $9.90 from invoice event

**Mitigation in processDonation():** Lines 36-39 check `sourcePurchaseId`, but:
- `checkout.session.completed` uses `session.id` as sourcePurchaseId
- `invoice.paid` uses `invoice.id` as sourcePurchaseId
- **These are different IDs → both donations created**

**Status:** CRITICAL - Double-charging charities

---

### 6. REFUND HANDLING ⚠️ CRITICAL

**Lines 275-322:**

**Issue 1: No Refund Deduplication**
```typescript
case 'charge.refunded': {
  const charge = event.data.object as Stripe.Charge
  const paymentIntentId = charge.payment_intent as string | null
  // ... No check if this refund was already processed

  if (templatePurchase) {
    await db.templatePurchase.update({
      where: { id: templatePurchase.id },
      data: { payoutStatus: 'REFUNDED' }
    })
  }
```

If `charge.refunded` webhook retries:
- First call: Sets payoutStatus to 'REFUNDED' ✓
- Retry: Sets payoutStatus to 'REFUNDED' again (idempotent by database design)
- **But:** `spendTokens()` is called again, fails silently

**Issue 2: Refund Amount Mismatch**
```typescript
const refundedCents = charge.amount_refunded // Total refunded (can be partial)
if (refundedCents <= 0) break
```
If customer refunded $50 of $100 purchase, `amount_refunded` is $50. But token pack refund reverses **full pack**, not proportional. This is actually correct (user shouldn't keep partial tokens) but undocumented.

**Issue 3: Missing Partial Refund Tracking**
The system doesn't track **partial refunds**. If a customer refunds $20 of $100:
- Full token pack refunded (correct)
- But no audit trail that it was partial
- Creator payout status set to REFUNDED even if they already got paid on $80

**Status:** CRITICAL - No deduplication, silent token reversals

---

### 7. ERROR HANDLING & DB DOWNTIME ⚠️ HIGH

**Lines 324-338:**
```typescript
} catch (err) {
  console.error('[stripe-webhook] Unhandled error processing event', {...})
  Sentry.captureException(err, {...})
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}

return NextResponse.json({ received: true })
```

**Issues:**

1. **DB Downtime During Payment:**
   - If database is down when `checkout.session.completed` fires, the entire handler throws
   - Returns 500 → Stripe **retries the webhook** (good)
   - BUT if DB is down for >3 days, Stripe stops retrying
   - **Token grant never happens** → customer loses tokens they paid for

2. **No Graceful Degradation:**
   - Token grant fails → entire event fails → entire payment unprocessed
   - Better approach: Queue token grants asynchronously (e.g., with Bull, Inngest)

3. **Missing Subscription Without DB:**
   - Line 147: `const sub = await db.subscription.findFirst(...)`
   - If subscription row missing or DB down, silently breaks token grant
   - No error thrown, just `break` (line 150)

4. **Partial State:**
   - Template purchase created (lines 66-81) ✓
   - Creator earning created (lines 98-109) ✓
   - Donation queued (lines 123-129) ✓
   - But if DB fails between these steps, **data is half-written**

**Status:** HIGH - No async queue, no partial state recovery

---

### 8. RACE CONDITIONS ⚠️ HIGH

**Scenario 1: Concurrent Invoice Payments**
```typescript
// Line 153
const alreadyGranted = await db.tokenTransaction.findFirst({
  where: { metadata: { path: ['invoiceId'], equals: invoice.id } }
})
if (!alreadyGranted) {
  await earnTokens(userId, allowance, 'SUBSCRIPTION_GRANT', ..., { invoiceId: invoice.id })
}
```

**Race condition:**
- T1: Check finds no transaction
- T2: Check finds no transaction (concurrent webhook)
- T1: earnTokens() creates transaction
- T2: earnTokens() also creates transaction
- **Result:** Duplicate tokens granted

**Why it's subtle:** Stripe delays between invoice.paid events, but if webhooks are retried simultaneously or if database clock skew exists, race is possible.

**Mitigation:** `earnTokens()` uses `db.$transaction()` (line 11 in tokens-server.ts), which is **atomic but not idempotent**. The `metadata` field is JSON, but `findFirst()` is a separate query.

**Scenario 2: Template Purchase + Refund**
- T1: `checkout.session.completed` → creates `templatePurchase`
- T2: `charge.refunded` → queries for `templatePurchase.payoutStatus`
- T2 could race and check before T1 finishes

**Status:** HIGH - Metadata deduplication is not atomic

---

### 9. MISSING IDEMPOTENCY KEY TRACKING

Stripe recommends an `idempotencyKey` per webhook event. Currently:
- Relying on event data (sessionId, invoiceId) as keys
- If same event fires with slightly different data, duplicate processing possible
- No stored record of "event ID processed"

**Better approach:** Store `event.id` in audit log immediately, check it first.

**Status:** MEDIUM - Theoretical but best practice violation

---

## CLERK WEBHOOK AUDIT (route.ts)

### 1. SIGNATURE VERIFICATION ✓ PASS
**Lines 24-42:** Properly uses `svix` library with all 3 required headers.

**Status:** Secure

---

### 2. EVENT TYPE COVERAGE ✓ COMPLETE
- `user.created` (line 45) ✓
- `user.updated` (line 108) ✓
- `user.deleted` (line 125) ✓

All core events handled. Clerk doesn't emit many others for user webhooks.

**Status:** PASS

---

### 3. DUPLICATE USER CREATION ✓ PASS
**Lines 50-54:**
```typescript
const existing = await db.user.findUnique({ where: { clerkId } })
if (existing) {
  console.warn('[clerk-webhook] user.created already processed — skipping duplicate', ...)
  return NextResponse.json({ ok: true })
}
```

**Status:** PASS - Properly guards against duplicates

---

### 4. CRITICAL MISSING TRANSACTION ⚠️ CRITICAL

**Lines 61-97:**
```typescript
await db.$transaction(async (tx) => {
  const user = await tx.user.create({...})
  await tx.subscription.create({...})
  await tx.tokenBalance.create({...})
  await tx.auditLog.create({...})
})
```

**This is atomic ✓ BUT:**

**Line 99-105:**
```typescript
sendWelcomeEmail({...}).catch((err) => {
  console.error('[clerk-webhook] Failed to send welcome email:', err)
})
```

**Issue:** If email service is down and we `.catch()` it, the webhook returns 200 (line 169) anyway. User is created in DB but email never sent. This is actually fine (non-critical email), but there's no retry logic. Better to not `.catch()` and let Svix retry the webhook.

---

### 5. USER.UPDATED MISSING TRANSACTION ⚠️ MEDIUM

**Lines 108-123:**
```typescript
if (event.type === 'user.updated') {
  if (!event.data.id) return NextResponse.json({ error: 'Missing user id' }, { status: 400 })

  const primaryEmail = event.data.email_addresses.find(...)?.email_address
  await db.user.update({
    where: { clerkId: event.data.id },
    data: { email: primaryEmail, ... }
  })
}
```

**Issue:** No `db.$transaction()`. If:
- Email field updated but display name update fails (non-atomic)
- Multiple fields updated separately
- Race condition with other updates

**Status:** MEDIUM - Should be transactional

---

### 6. USER.DELETED PROPERLY HARDENED ✓ PASS

**Lines 133-160:**
- Uses `db.$transaction()` ✓
- Nullifies all PII ✓
- Sets `deletedAt` ✓
- Audit logged ✓
- Handles missing user gracefully (line 135)

**Status:** PASS - GDPR/COPPA compliant

---

## SUMMARY OF FINDINGS

### CRITICAL (Fix Immediately):
1. **Duplicate Charity Donations** — Stripe fires both `checkout.session.completed` and `invoice.paid` for subscriptions, causing 2 donations. Fix: Use payment intent ID as donation source, not session/invoice ID.
2. **No Refund Deduplication** — `charge.refunded` retries cause multiple token reversals. Fix: Store processed refund IDs in audit log.
3. **Missing Event Handlers** — `invoice.finalization_failed`, `invoice.voided`, `charge.dispute.updated/closed` not handled. Fix: Add handlers.
4. **Donation ID Collision** — Two different Stripe objects (session, invoice) used as `sourcePurchaseId`, causing donation duplication.

### HIGH (Fix Within 1 Week):
5. **DB Downtime No Async Queue** — If database is down during webhook, payment is lost. Fix: Use task queue (Bull, Inngest) for token grants.
6. **Race Condition in Token Grant Deduplication** — Metadata check is not atomic. Fix: Use unique constraint on (invoiceId, userId) or store event ID.
7. **Missing Idempotency Key Tracking** — No central record of processed webhook IDs. Fix: Store stripe event.id in audit log before processing.

### MEDIUM (Fix Within 2 Weeks):
8. **No Transaction in user.updated** — Clerk webhook doesn't wrap multiple DB updates. Fix: Add `db.$transaction()`.
9. **Missing Partial Refund Tracking** — Doesn't distinguish partial vs full refunds. Fix: Add refund percentage to audit log.

---

## RECOMMENDED FIXES

### Fix 1: Deduplicate Charity Donations

**File:** `src/app/api/webhooks/stripe/route.ts`

Replace lines 121-130 and 163-170 with unified donation handling:

```typescript
// For checkout.session.completed, use payment intent as source
if (isPaid && session.payment_intent && session.amount_total && session.amount_total > 0) {
  await processDonation({
    userId,
    paymentAmountCents: session.amount_total,
    sourcePurchaseId: `payment_intent_${session.payment_intent}`, // Unique
  }).catch(() => {})
}
```

```typescript
// For invoice.paid, also use payment intent
if (invoice.payment_intent) {
  await processDonation({
    userId,
    paymentAmountCents: invoice.amount_paid,
    sourcePurchaseId: `payment_intent_${invoice.payment_intent}`, // Same ID, deduplicated
  }).catch(() => {})
}
```

**File:** `src/lib/charity.ts`

Add audit log check:
```typescript
// Before creating donation, verify via audit log
const existingTransfer = await db.charityDonation.findFirst({
  where: { sourcePurchaseId }
})
if (existingTransfer) return existingTransfer
```

---

### Fix 2: Prevent Refund Deduplication

**File:** `src/app/api/webhooks/stripe/route.ts`

Add to line 275:
```typescript
case 'charge.refunded': {
  const charge = event.data.object as Stripe.Charge
  const paymentIntentId = charge.payment_intent as string | null

  // IDEMPOTENCY: Check if this refund already processed
  const existingRefundAudit = await db.auditLog.findFirst({
    where: {
      action: 'CHARGE_REFUNDED',
      resourceId: charge.id
    }
  })
  if (existingRefundAudit) break // Already processed
```

---

### Fix 3: Add Missing Event Handlers

**File:** `src/app/api/webhooks/stripe/route.ts`

Add to switch statement (after charge.refunded case):

```typescript
case 'invoice.finalization_failed': {
  const invoice = event.data.object as Stripe.Invoice
  const subscriptionId = invoice.subscription as string
  if (!subscriptionId) break

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const userId = subscription.metadata?.userId
  if (userId) {
    await db.subscription.update({
      where: { userId },
      data: { status: 'INCOMPLETE' }
    })
  }
  break
}

case 'invoice.voided': {
  const invoice = event.data.object as Stripe.Invoice
  // Mark any pending token grant as canceled
  await db.charityDonation.updateMany({
    where: { sourcePurchaseId: invoice.id },
    data: { status: 'CANCELED' }
  })
  break
}

case 'charge.dispute.updated': {
  const dispute = event.data.object as Stripe.Dispute
  await db.auditLog.create({
    data: {
      action: 'CHARGE_DISPUTE_UPDATED',
      resource: 'stripe',
      resourceId: dispute.id,
      metadata: { status: dispute.status, reason: dispute.reason }
    }
  })
  break
}
```

---

### Fix 4: Add Async Token Grant Queue

**New file:** `src/lib/webhook-queue.ts`

```typescript
import { db } from './db'
import { earnTokens } from './tokens-server'

type TokenGrantJob = {
  userId: string
  amount: number
  type: 'PURCHASE' | 'SUBSCRIPTION_GRANT'
  description: string
  metadata: Record<string, unknown>
  invoiceId?: string
  sessionId?: string
}

export async function queueTokenGrant(job: TokenGrantJob) {
  // Store in DB as a pending job
  await db.tokenGrantJob.create({
    data: {
      userId: job.userId,
      amount: job.amount,
      type: job.type,
      description: job.description,
      metadata: job.metadata,
      status: 'PENDING'
    }
  })
}

export async function processTokenGrantJobs() {
  const jobs = await db.tokenGrantJob.findMany({ where: { status: 'PENDING' } })
  for (const job of jobs) {
    try {
      await earnTokens(job.userId, job.amount, job.type, job.description, job.metadata)
      await db.tokenGrantJob.update({
        where: { id: job.id },
        data: { status: 'COMPLETED' }
      })
    } catch (err) {
      console.error('[token-grant] Failed to process job', { jobId: job.id })
    }
  }
}
```

Then in webhook:
```typescript
// Instead of:
await earnTokens(userId, allowance, 'SUBSCRIPTION_GRANT', ...)

// Use:
await queueTokenGrant({
  userId,
  amount: allowance,
  type: 'SUBSCRIPTION_GRANT',
  description: `Monthly ${sub.tier} token grant`,
  metadata: { invoiceId: invoice.id },
  invoiceId: invoice.id
})
```

---

### Fix 5: Fix Clerk user.updated Transaction

**File:** `src/app/api/webhooks/clerk/route.ts`

Replace lines 108-123:

```typescript
if (event.type === 'user.updated') {
  if (!event.data.id) return NextResponse.json({ error: 'Missing user id' }, { status: 400 })

  const primaryEmail = event.data.email_addresses.find(
    (e) => e.id === event.data.primary_email_address_id
  )?.email_address

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { clerkId: event.data.id },
      data: {
        email: primaryEmail,
        displayName: [event.data.first_name, event.data.last_name].filter(Boolean).join(' ') || undefined,
        avatarUrl: event.data.image_url,
      }
    })

    await tx.auditLog.create({
      data: {
        action: 'USER_UPDATED',
        resource: 'user',
        resourceId: event.data.id,
        metadata: { source: 'clerk_webhook' }
      }
    })
  })
}
```

---

## TESTING RECOMMENDATIONS

1. **Webhook Replay Test**: Use Stripe Dashboard > Events > Resend to simulate duplicate delivery
2. **Refund Test**: Full and partial refunds with webhook replay
3. **Subscription Test**: Create subscription, confirm no double donations
4. **DB Downtime Test**: Kill database connection during webhook, verify Stripe retries
5. **Clerk Webhook Replay**: Use Svix test endpoint to replay events

---

## COMPLIANCE NOTES

- **PCI-DSS:** Not storing card data (delegated to Stripe) ✓
- **GDPR:** User deletion properly nullifies PII ✓
- **COPPA:** Parental consent tracked, user deletion audit logged ✓

---

## FILES AFFECTED

- `src/app/api/webhooks/stripe/route.ts` — 9 fixes
- `src/app/api/webhooks/clerk/route.ts` — 1 fix
- `src/lib/charity.ts` — 1 fix (idempotency guard)
- `src/lib/webhook-queue.ts` — NEW (async token grants)
- `prisma/schema.prisma` — Add TokenGrantJob model
