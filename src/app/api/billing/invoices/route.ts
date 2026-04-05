import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export type InvoiceRow = {
  id: string
  date: string
  amount: string
  status: 'Paid' | 'Pending' | 'Failed'
  description: string
  pdfUrl: string | null
  hostedUrl: string | null
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stripeKeyMissing = !process.env.STRIPE_SECRET_KEY
    if (stripeKeyMissing) {
      return NextResponse.json({ invoices: [], demo: true })
    }

    const { db } = await import('@/lib/db')
    const { getStripe } = await import('@/lib/stripe')

    const user = await db.user.findUnique({
      where: { clerkId },
      include: { subscription: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const customerId = user.subscription?.stripeCustomerId
    if (!customerId || customerId.startsWith('pending_')) {
      return NextResponse.json({ invoices: [], demo: false })
    }

    const stripe = getStripe()
    if (!stripe) {
      return NextResponse.json({ invoices: [], demo: true })
    }

    const stripeInvoices = await stripe.invoices.list({
      customer: customerId,
      limit: 20,
    })

    const fmt = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    })

    const invoices: InvoiceRow[] = stripeInvoices.data.map((inv) => {
      let status: InvoiceRow['status'] = 'Pending'
      if (inv.status === 'paid') status = 'Paid'
      else if (inv.status === 'uncollectible' || inv.status === 'void') status = 'Failed'

      const amountCents = inv.amount_paid ?? inv.amount_due ?? 0
      const amount = fmt.format(amountCents / 100)

      // inv.created can be null on draft invoices — fall back to current date
      const createdTs = (inv.created ?? 0) * 1000
      const date = createdTs > 0
        ? new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }).format(new Date(createdTs))
        : 'Unknown'

      // Description: use first line item, or subscription description, or fallback
      let description = 'Subscription'
      if (inv.lines?.data?.[0]?.description) {
        description = inv.lines.data[0].description
      } else if (inv.description) {
        description = inv.description
      }

      return {
        id: inv.id,
        date,
        amount,
        status,
        description,
        pdfUrl: inv.invoice_pdf ?? null,
        hostedUrl: inv.hosted_invoice_url ?? null,
      }
    })

    return NextResponse.json({ invoices, demo: false })
  } catch (err) {
    console.error('[billing/invoices] Error', err)
    return NextResponse.json({ invoices: [], demo: false })
  }
}
