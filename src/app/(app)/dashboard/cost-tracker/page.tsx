import type { Metadata } from 'next'
import { CostDashboard } from '@/components/CostDashboard'

export const metadata: Metadata = {
  title: 'Cost Dashboard',
  robots: { index: false, follow: false },
}

export default function CostTrackerPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Cost Dashboard</h1>
      <p className="text-gray-300 mb-6">
        Daily API spend by provider, with margin alerts when spend exceeds revenue.
      </p>
      <CostDashboard />
    </div>
  )
}
