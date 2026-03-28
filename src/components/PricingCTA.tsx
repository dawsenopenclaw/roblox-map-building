'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PricingCTAProps {
  tier: 'HOBBY' | 'CREATOR' | 'STUDIO'
  yearly: boolean
  children: React.ReactNode
  className?: string
}

/**
 * Pricing CTA button — initiates Stripe Checkout for authenticated users,
 * otherwise redirects to sign-up with plan intent stored.
 */
export function PricingCTA({ tier, yearly, children, className }: PricingCTAProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'subscription', tier, yearly }),
      })

      if (res.status === 401) {
        // Not logged in — send to sign-up with plan intent
        router.push(`/sign-up?plan=${tier.toLowerCase()}&yearly=${yearly}`)
        return
      }

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      // Fallback to sign-up
      router.push(`/sign-up?plan=${tier.toLowerCase()}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {loading ? 'Loading...' : children}
    </button>
  )
}
