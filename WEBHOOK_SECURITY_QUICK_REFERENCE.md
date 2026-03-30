# Webhook Security Quick Reference

## Critical Bugs Fixed

| Issue | Impact | Fix |
|-------|--------|-----|
| Duplicate charity donations | $19.80+ per $99 subscription | Use `payment_intent` as donation ID instead of `session.id`/`invoice.id` |
| Refund webhook retries | Tokens reversed multiple times | Added audit log deduplication check |
| Missing event handlers | Orphaned data, silent failures | Added `invoice.finalization_failed`, `invoice.voided`, `charge.dispute.*` |
| Non-atomic Clerk updates | Partial user record corruption | Wrapped user.updated in `db.$transaction()` |
| No DB downtime resilience | Lost tokens if DB is down | Created `TokenGrantJob` queue system |

---

## How Webhooks Work (After Fixes)

### Stripe Checkout → Tokens Flow

```
Stripe Checkout Session Completed
    ↓
POST /api/webhooks/stripe (signature verified ✓)
    ↓
checkout.session.completed handler
    ├─ Check isPaid (only 'paid' status processed) ✓
    ├─ Token Pack Purchase?
    │  └─ queueTokenGrant() [or earnTokens() if queue not enabled]
    ├─ Template Purchase?
    │  └─ Create templatePurchase (upsert, idempotent) ✓
    └─ Charity Donation?
       └─ processDonation(payment_intent) [deduped by invoiceId] ✓

Later: invoice.paid webhook fires
    ├─ Verify subscription exists
    ├─ Grant monthly token allowance (idempotent via invoiceId) ✓
    ├─ processDonation(payment_intent) [SAME payment_intent = deduped] ✓
    └─ Stripe doesn't retry if all successful
```

### Refund Flow

```
User initiates refund in Stripe Dashboard
    ↓
charge.refunded webhook fires
    ├─ Check if already processed [audit log lookup] ✓
    ├─ If duplicate: skip and return 200
    ├─ If new refund:
    │  ├─ Mark templatePurchase as REFUNDED
    │  ├─ Reverse tokens [spendTokens()]
    │  └─ Create audit log with charge.id [for dedup on retry]
    └─ Return 200 to Stripe

Stripe retries (3 days of retries)
    └─ [duplicate check catches it, returns 200, no double-reversal]
```

---

## Signature Verification

✓ **VERIFIED** — Using Stripe's native `constructWebhookEvent()`

```typescript
// src/lib/stripe.ts
export function constructWebhookEvent(payload: string, signature: string) {
  const secret = serverEnv.STRIPE_WEBHOOK_SECRET
  return stripe.webhooks.constructEvent(payload, signature, secret)
}
```

All webhooks verify signature before processing. Returns 400 on invalid.

---

## Event Coverage

### All Handled Events ✓

| Event | Handler | Idempotency | Status |
|-------|---------|-------------|--------|
| `checkout.session.completed` | Token pack purchase | sessionId | ✓ |
| `checkout.session.completed` | Template purchase | templateId_buyerId | ✓ |
| `checkout.session.completed` | Charity donation | payment_intent | ✓ |
| `invoice.paid` | Token grant | invoiceId | ✓ |
| `invoice.paid` | Charity donation | payment_intent | ✓ |
| `customer.subscription.created` | Sync subscription | upsert | ✓ |
| `customer.subscription.updated` | Sync subscription | upsert | ✓ |
| `customer.subscription.deleted` | Cancel subscription | — | ✓ |
| `invoice.payment_failed` | Mark PAST_DUE | — | ✓ |
| `invoice.finalization_failed` | Mark INCOMPLETE | — | ✓ NEW |
| `invoice.voided` | Cancel donations | payment_intent | ✓ NEW |
| `charge.refunded` | Reverse tokens | charge.id (audit) | ✓ |
| `charge.dispute.created` | Log dispute | — | ✓ |
| `charge.dispute.updated` | Log status change | — | ✓ NEW |
| `charge.dispute.closed` | Log resolution | — | ✓ NEW |
| `customer.subscription.trial_will_end` | Log event | — | ✓ |

---

## Key Idempotency Mechanisms

### Token Grants
```typescript
// Prevents duplicate token credits if webhook retries
const alreadyCredited = await db.tokenTransaction.findFirst({
  where: { metadata: { path: ['invoiceId'], equals: invoice.id } }
})
if (!alreadyCredited) {
  await earnTokens(...)
}
```

### Charity Donations
```typescript
// Deduped by payment_intent (same for both checkout + invoice events)
const existingDonation = await db.charityDonation.findFirst({
  where: { sourcePurchaseId: `payment_intent_${paymentIntentId}` }
})
if (existingDonation) return null
```

### Refunds
```typescript
// Audit log check prevents double reversal on webhook retry
const existingRefundAudit = await db.auditLog.findFirst({
  where: { action: 'CHARGE_REFUNDED', resourceId: charge.id }
})
if (existingRefundAudit) break // Already processed
```

---

## Token Grant Queue (Optional)

If database is down during webhook, tokens can be queued for async processing:

```typescript
// Queue instead of immediate grant
await queueTokenGrant({
  userId,
  amount: 7000,
  type: 'SUBSCRIPTION_GRANT',
  description: 'Monthly Creator token grant',
  invoiceId: invoice.id
})

// Background worker processes jobs
await processTokenGrantJobs(batchSize = 50)
```

**Setup:**
1. Run migration: `npx prisma migrate dev --name add-token-grant-jobs`
2. Set `WORKER_SECRET` env var
3. Call `/api/admin/worker/process-token-grants` every 30s with auth header

---

## Monitoring & Alerts

### Daily Checks
```sql
-- Check for failed token grant jobs
SELECT COUNT(*) FROM "TokenGrantJob" WHERE "status" = 'FAILED';

-- Check for duplicate donations
SELECT "sourcePurchaseId", COUNT(*)
FROM "CharityDonation"
GROUP BY "sourcePurchaseId"
HAVING COUNT(*) > 1;

-- Check for inconsistent subscriptions
SELECT * FROM "Subscription" WHERE "status" = 'INCOMPLETE' AND "updatedAt" < NOW() - INTERVAL 24 HOUR;
```

### Alert Thresholds
- **>5** failed token grant jobs in 24h → Investigate
- **>1** duplicate donation → Data corruption risk
- **>10** INCOMPLETE subscriptions → Invoice finalization failures

---

## Common Scenarios & Fixes

### Scenario: User doesn't receive tokens after payment
1. Check `TokenTransaction` for user: `SELECT * FROM "TokenTransaction" WHERE "balanceId" IN (SELECT "id" FROM "TokenBalance" WHERE "userId" = '...')`
2. If missing, check `TokenGrantJob`: `SELECT * FROM "TokenGrantJob" WHERE "userId" = '...'`
3. If job is FAILED, check `lastError` field
4. Retry: `CALL retryTokenGrantJob('jobId')`

### Scenario: Double donation detected
1. Query: `SELECT * FROM "CharityDonation" WHERE "sourcePurchaseId" LIKE 'payment_intent_%' GROUP BY "sourcePurchaseId" HAVING COUNT(*) > 1`
2. Check which event fired first: `SELECT * FROM "AuditLog" WHERE "action" IN ('CHARGE_REFUNDED') ORDER BY "createdAt"`
3. Manually void duplicate donation: `UPDATE "CharityDonation" SET "status" = 'CANCELED' WHERE "id" = '...'`

### Scenario: Refund not reversed
1. Check refund audit log: `SELECT * FROM "AuditLog" WHERE "action" = 'CHARGE_REFUNDED' AND "resourceId" = 'ch_...'`
2. If missing, webhook didn't fire or was dropped
3. Check Stripe dashboard for webhook delivery status
4. Manually reverse tokens: `CALL spendTokens('userId', amount, 'Refund: manual correction')`

---

## Testing Checklist

- [ ] Spin up test Stripe account
- [ ] Create test token pack ($10)
- [ ] Complete purchase → verify tokens credited
- [ ] Refund purchase → verify tokens reversed
- [ ] Create test subscription → verify only 1 donation created
- [ ] Use Stripe Events page to resend webhook → verify no double processing
- [ ] Kill database connection mid-webhook → verify graceful failure + Sentry alert
- [ ] View `/api/admin/worker/process-token-grants` logs for async job processing

---

## When to Call Support

- Webhook keeps failing with 500 (check Sentry)
- Duplicate donations detected (manual recovery needed)
- User didn't receive tokens (check TokenGrantJob status)
- Refund not reversed (manual correction needed)
- New Stripe event type not handled (add case to switch statement)

---

## Compliance Notes

✓ **PCI-DSS:** No card data stored (delegated to Stripe)
✓ **GDPR:** Hard deletion of PII on user.deleted event
✓ **COPPA:** Parental consent tracked, audit logged
✓ **Webhook Security:** Signature verification on all events
✓ **Idempotency:** Deduplication on all critical transactions

---

**Last Updated:** 2026-03-29
**Status:** All critical fixes applied
**Next Review:** 2026-04-29
