'use client'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function TokenBalanceWidget() {
  const { data, isLoading } = useSWR('/api/tokens/balance', fetcher, { refreshInterval: 30000 })

  if (isLoading) return (
    <div className="bg-[#0D1231] border border-white/10 rounded-xl p-4 animate-pulse">
      <div className="h-4 bg-white/10 rounded w-24 mb-2" />
      <div className="h-8 bg-white/10 rounded w-16" />
    </div>
  )

  return (
    <div className="bg-[#0D1231] border border-white/10 rounded-xl p-4">
      <p className="text-gray-400 text-sm font-medium uppercase tracking-wide">Token Balance</p>
      <p className="text-3xl font-bold text-[#FFB81C] mt-1">{(data?.balance || 0).toLocaleString()}</p>
      <p className="text-gray-500 text-xs mt-1">{(data?.lifetimeSpent || 0).toLocaleString()} spent lifetime</p>
    </div>
  )
}
