import { stripe } from './stripe'
import { db } from './db'
import { serverEnv } from './env'

export const CHARITIES = [
  { slug: 'code-org', name: 'Code.org', description: 'Computer science education for all students', url: 'https://code.org' },
  { slug: 'girls-who-code', name: 'Girls Who Code', description: 'Closing the gender gap in tech', url: 'https://girlswhocode.com' },
  { slug: 'khan-academy', name: 'Khan Academy', description: 'Free world-class education for anyone', url: 'https://khanacademy.org' },
] as const

export type CharitySlug = typeof CHARITIES[number]['slug']

export function calculateDonationAmount(paymentAmountCents: number): number {
  return Math.floor(paymentAmountCents * 0.1)
}

export async function processDonation({
  userId,
  paymentAmountCents,
  sourcePurchaseId,
}: {
  userId: string
  paymentAmountCents: number
  sourcePurchaseId: string
}) {
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  const charitySlug = (user.charityChoice as CharitySlug) || 'code-org'
  const charity = CHARITIES.find(c => c.slug === charitySlug) || CHARITIES[0]
  const donationAmountCents = calculateDonationAmount(paymentAmountCents)

  if (donationAmountCents < 50) return null // Stripe minimum transfer is $0.50

  // Idempotency guard — if a donation for this purchase already exists, skip creation
  const existingDonation = await db.charityDonation.findFirst({
    where: { sourcePurchaseId },
  })
  if (existingDonation) return null

  const donationRecord = await db.charityDonation.create({
    data: {
      userId,
      charitySlug: charity.slug,
      charityName: charity.name,
      amountCents: donationAmountCents,
      sourcePurchaseId,
      status: 'PROCESSING',
    },
  })

  const charityAccountId = serverEnv.STRIPE_CHARITY_ACCOUNT_ID
  if (!charityAccountId) {
    await db.charityDonation.update({
      where: { id: donationRecord.id },
      data: { status: 'FAILED' },
    })
    return null
  }

  try {
    const transfer = await stripe.transfers.create({
      amount: donationAmountCents,
      currency: 'usd',
      destination: charityAccountId,
      transfer_group: `donation_${donationRecord.id}`,
      metadata: {
        donationId: donationRecord.id,
        userId,
        charitySlug: charity.slug,
        sourcePurchaseId,
      },
    })

    await db.charityDonation.update({
      where: { id: donationRecord.id },
      data: { stripeTransferId: transfer.id, status: 'COMPLETED', processedAt: new Date() },
    })

    return transfer
  } catch (err) {
    await db.charityDonation.update({
      where: { id: donationRecord.id },
      data: { status: 'FAILED' },
    })
    throw err
  }
}
