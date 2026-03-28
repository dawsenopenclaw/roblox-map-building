'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PurchaseButtonProps {
  templateId: string
  priceCents: number
  title: string
  isFree: boolean
}

export function PurchaseButton({ templateId, priceCents, title, isFree }: PurchaseButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePurchase() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/marketplace/templates/${templateId}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Purchase failed')
        return
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else if (data.success) {
        router.refresh()
      }
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handlePurchase}
        disabled={loading}
        className="w-full bg-[#FFB81C] hover:bg-[#E6A618] text-black font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
      >
        {loading ? 'Processing...' : isFree ? 'Get for Free' : `Buy for $${(priceCents / 100).toFixed(2)}`}
      </button>
      {error && (
        <p className="text-xs text-red-400 text-center">{error}</p>
      )}
    </div>
  )
}
