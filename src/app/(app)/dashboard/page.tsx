import { requireAuthUser } from '@/lib/clerk'
import { TokenBalanceWidget } from '@/components/TokenBalanceWidget'
import { CharitySelector } from '@/components/CharitySelector'

export default async function DashboardPage() {
  const user = await requireAuthUser()
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <TokenBalanceWidget />
        <div className="bg-[#0D1231] border border-white/10 rounded-xl p-4">
          <p className="text-gray-400 text-sm font-medium uppercase tracking-wide">Subscription</p>
          <p className="text-3xl font-bold text-white mt-1">{user.subscription?.tier || 'FREE'}</p>
        </div>
      </div>
      <div className="max-w-md">
        <CharitySelector current={user.charityChoice || undefined} />
      </div>
    </div>
  )
}
