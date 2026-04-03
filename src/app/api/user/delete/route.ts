import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStripe } from '@/lib/stripe'
import * as Sentry from '@sentry/nextjs'

export async function DELETE() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        subscription: {
          select: {
            stripeSubscriptionId: true,
            stripeCustomerId: true,
            status: true,
          },
        },
      },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Cancel active Stripe subscription before touching the DB so we can handle
    // Stripe failures independently and still surface them to the caller.
    const sub = user.subscription
    const activeStripeSubId =
      sub?.stripeSubscriptionId &&
      !sub.stripeSubscriptionId.startsWith('pending_') &&
      (sub.status === 'ACTIVE' || sub.status === 'TRIALING' || sub.status === 'PAST_DUE')
        ? sub.stripeSubscriptionId
        : null

    if (activeStripeSubId) {
      try {
        const stripe = getStripe()
        if (stripe) {
          await stripe.subscriptions.cancel(activeStripeSubId)
        } else {
          console.warn('[user/delete] Stripe not configured — skipping subscription cancellation')
        }
      } catch (stripeErr) {
        Sentry.captureException(stripeErr, {
          extra: { clerkId, stripeSubscriptionId: activeStripeSubId, context: 'user_deletion_stripe_cancel' },
        })
        // Non-fatal: subscription may already be cancelled or the user may have
        // no payment method. Proceed with PII wipe — billing ops can reconcile.
        console.error('[user/delete] Stripe cancellation failed (proceeding with deletion):', stripeErr)
      }
    }

    // Atomic: create audit log then nullify PII in a single transaction so we
    // never end up with a wiped user and no audit trail (or vice versa).
    await db.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_DELETION_REQUESTED',
          resource: 'user',
          resourceId: user.id,
          metadata: {
            source: 'user_request',
            stripeSubscriptionCancelled: activeStripeSubId !== null,
          },
        },
      })

      await tx.user.update({
        where: { id: user.id },
        data: {
          email: `deleted_${clerkId}@deleted.invalid`,
          displayName: null,
          avatarUrl: null,
          dateOfBirth: null,
          parentEmail: null,
          parentConsentAt: null,
          parentConsentToken: null,
          parentConsentTokenExp: null,
          deletedAt: new Date(),
        },
      })
    })

    // Delete the Stripe customer record so their PII (name, email, address)
    // is removed from Stripe's systems per GDPR Article 17.
    const stripeCustomerId = sub?.stripeCustomerId
    if (stripeCustomerId) {
      try {
        const stripe = getStripe()
        if (stripe) {
          await stripe.customers.del(stripeCustomerId)
        } else {
          console.warn('[user/delete] Stripe not configured — skipping customer deletion')
        }
      } catch (stripeErr) {
        Sentry.captureException(stripeErr, {
          extra: { clerkId, stripeCustomerId, context: 'user_deletion_stripe_customer_delete' },
        })
        // Non-fatal: log and continue. Ops can reconcile orphaned customers via
        // Stripe's dashboard. The user's local PII has already been wiped above.
        console.error('[user/delete] Stripe customer deletion failed (proceeding):', stripeErr)
      }
    }

    // TODO: Delete PostHog person record to purge behavioural event history.
    // Requires a server-side PostHog API key with person:delete scope.
    // Call: DELETE https://app.posthog.com/api/projects/<project_id>/persons/<distinct_id>/
    // See: https://posthog.com/docs/api/persons#delete-api-projects-project_id-persons-id
    // The distinct_id used is the internal user.id (set at identify() time).

    return NextResponse.json({
      success: true,
      message: 'Account scheduled for deletion. Data will be fully removed within 30 days.',
    })
  } catch (err) {
    Sentry.captureException(err)
    return NextResponse.json({ error: 'Failed to process deletion' }, { status: 500 })
  }
}
