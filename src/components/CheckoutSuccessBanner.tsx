'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Shows a success banner after returning from Stripe Checkout.
 * Auto-dismisses after 5 seconds.
 */
export function CheckoutSuccessBanner() {
  const params = useSearchParams()
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (params.get('upgraded') === 'true') {
      setMessage('Plan upgraded! Your new tokens are available now.')
      setVisible(true)
    } else if (params.get('tokens_added') === 'true') {
      setMessage('Tokens added to your balance!')
      setVisible(true)
    }
    if (visible) {
      const t = setTimeout(() => setVisible(false), 5000)
      return () => clearTimeout(t)
    }
  }, [params])

  if (!visible) return null

  return (
    <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-xl px-5 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-green-400 text-lg">✓</span>
        <p className="text-green-300 text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="text-green-500 hover:text-green-300 text-sm"
      >
        ✕
      </button>
    </div>
  )
}
