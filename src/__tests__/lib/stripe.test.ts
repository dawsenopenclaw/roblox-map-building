import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Stripe before importing the module
const mockCheckoutSessionsCreate = vi.fn()
const mockBillingPortalSessionsCreate = vi.fn()
const mockWebhooksConstructEvent = vi.fn()
const mockCustomersCreate = vi.fn()
const mockTransfersCreate = vi.fn()

vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      customers: { create: mockCustomersCreate },
      checkout: { sessions: { create: mockCheckoutSessionsCreate } },
      billingPortal: { sessions: { create: mockBillingPortalSessionsCreate } },
      webhooks: { constructEvent: mockWebhooksConstructEvent },
      transfers: { create: mockTransfersCreate },
    })),
  }
})

// Set required env vars before module import
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock'
process.env.STRIPE_CHARITY_ACCOUNT_ID = 'acct_charity_test'

import {
  createSubscriptionCheckoutSession,
  createTokenPackCheckoutSession,
  createBillingPortalSession,
  constructWebhookEvent,
  createCustomer,
} from '@/lib/stripe'

import { calculateDonationAmount } from '@/lib/charity'

describe('Stripe integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createSubscriptionCheckoutSession', () => {
    it('creates a subscription checkout session with correct params', async () => {
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
        mode: 'subscription',
      }
      mockCheckoutSessionsCreate.mockResolvedValue(mockSession)

      const result = await createSubscriptionCheckoutSession({
        customerId: 'cus_test',
        priceId: 'price_pro_monthly',
        userId: 'user_abc',
        successUrl: 'https://app.test/success',
        cancelUrl: 'https://app.test/cancel',
      })

      expect(result).toEqual(mockSession)
      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_test',
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [{ price: 'price_pro_monthly', quantity: 1 }],
          success_url: 'https://app.test/success',
          cancel_url: 'https://app.test/cancel',
          metadata: expect.objectContaining({ userId: 'user_abc', type: 'subscription' }),
          subscription_data: expect.objectContaining({
            trial_period_days: 3,
            metadata: { userId: 'user_abc' },
          }),
        }),
        expect.any(Object)
      )
    })

    it('includes a 3-day trial in subscription sessions', async () => {
      mockCheckoutSessionsCreate.mockResolvedValue({ id: 'cs_1' })

      await createSubscriptionCheckoutSession({
        customerId: 'cus_1',
        priceId: 'price_1',
        userId: 'user_1',
        successUrl: 'https://test.com/ok',
        cancelUrl: 'https://test.com/cancel',
      })

      const callArgs = mockCheckoutSessionsCreate.mock.calls[0][0]
      expect(callArgs.subscription_data.trial_period_days).toBe(3)
    })

    it('propagates stripe API errors', async () => {
      mockCheckoutSessionsCreate.mockRejectedValue(new Error('No such customer: cus_bad'))

      await expect(
        createSubscriptionCheckoutSession({
          customerId: 'cus_bad',
          priceId: 'price_1',
          userId: 'user_1',
          successUrl: 'https://test.com/ok',
          cancelUrl: 'https://test.com/cancel',
        })
      ).rejects.toThrow('No such customer: cus_bad')
    })
  })

  describe('createTokenPackCheckoutSession', () => {
    it('creates a one-time payment session for token pack', async () => {
      const mockSession = { id: 'cs_tokens_456', mode: 'payment' }
      mockCheckoutSessionsCreate.mockResolvedValue(mockSession)

      const result = await createTokenPackCheckoutSession({
        customerId: 'cus_2',
        priceId: 'price_tokens_1000',
        userId: 'user_2',
        tokenPackSlug: 'pack-1000',
        successUrl: 'https://app.test/success',
        cancelUrl: 'https://app.test/cancel',
      })

      expect(result).toEqual(mockSession)
      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'payment',
          metadata: expect.objectContaining({
            type: 'token_pack',
            tokenPackSlug: 'pack-1000',
          }),
        }),
        expect.any(Object)
      )
    })
  })

  describe('constructWebhookEvent', () => {
    it('constructs event from valid payload and signature', () => {
      const mockEvent = {
        id: 'evt_test',
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_test' } },
      }
      mockWebhooksConstructEvent.mockReturnValue(mockEvent)

      const result = constructWebhookEvent('raw_payload_body', 'stripe_sig_header')

      expect(result).toEqual(mockEvent)
      expect(mockWebhooksConstructEvent).toHaveBeenCalledWith(
        'raw_payload_body',
        'stripe_sig_header',
        'whsec_test_mock'
      )
    })

    it('throws on invalid signature', () => {
      mockWebhooksConstructEvent.mockImplementation(() => {
        throw new Error('No signatures found matching the expected signature for payload')
      })

      expect(() => constructWebhookEvent('payload', 'bad_sig')).toThrow(
        'No signatures found matching'
      )
    })
  })

  describe('createBillingPortalSession', () => {
    it('creates a portal session with return URL', async () => {
      const mockPortal = { id: 'bps_test', url: 'https://billing.stripe.com/session/bps_test' }
      mockBillingPortalSessionsCreate.mockResolvedValue(mockPortal)

      const result = await createBillingPortalSession({
        customerId: 'cus_3',
        returnUrl: 'https://app.test/billing',
      })

      expect(result).toEqual(mockPortal)
      expect(mockBillingPortalSessionsCreate).toHaveBeenCalledWith({
        customer: 'cus_3',
        return_url: 'https://app.test/billing',
      })
    })
  })
})

describe('Charity donation calculation', () => {
  it('calculates 10% of payment amount', () => {
    expect(calculateDonationAmount(1000)).toBe(100)
    expect(calculateDonationAmount(2999)).toBe(299)
    expect(calculateDonationAmount(5000)).toBe(500)
  })

  it('floors to whole cents (no fractional cents)', () => {
    // 10% of $9.99 = $0.999 → floor to $0.99 (99 cents)
    expect(calculateDonationAmount(999)).toBe(99)
    // 10% of $1.01 = $0.101 → floor to $0.10 (10 cents)
    expect(calculateDonationAmount(101)).toBe(10)
  })

  it('returns 0 for zero payment', () => {
    expect(calculateDonationAmount(0)).toBe(0)
  })

  it('handles large payment amounts', () => {
    // $500.00 payment → $50.00 donation
    expect(calculateDonationAmount(50000)).toBe(5000)
  })
})
