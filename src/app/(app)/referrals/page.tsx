'use client'
import { useState, useEffect } from 'react'
import { useAnalytics } from '@/hooks/useAnalytics'

type ReferralStats = {
  code: string
  referralUrl: string
  stats: {
    total: number
    converted: number
    pending: number
    totalCommissionUsd: string
  }
  recent: Array<{
    id: string
    code: string
    status: string
    commission: number
    createdAt: string
    convertedAt: string | null
  }>
}

export default function ReferralsPage() {
  const { track } = useAnalytics()
  const [data, setData] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/referrals/stats`, { credentials: 'include' })
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

  function copyLink() {
    if (!data) return
    navigator.clipboard.writeText(data.referralUrl)
    setCopied(true)
    track('referral_link_shared', { channel: 'clipboard' })
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="h-8 bg-white/5 rounded-xl animate-pulse mb-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#0D1231] border border-white/10 rounded-2xl p-5 animate-pulse h-24" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Referral Program</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Earn credits when friends sign up, plus 20% lifetime commission on their purchases.
        </p>
      </div>

      {/* Referral link */}
      <div className="bg-gradient-to-br from-[#FFB81C]/10 to-transparent border border-[#FFB81C]/20 rounded-2xl p-6 mb-8">
        <h2 className="text-white font-semibold mb-2">Your Referral Link</h2>
        <p className="text-gray-400 text-sm mb-4">
          Share this link. When someone signs up, you both get <strong className="text-[#FFB81C]">$1 in credits</strong>.
        </p>
        <div className="flex gap-3">
          <div className="flex-1 bg-[#111640] border border-white/10 rounded-xl px-4 py-3 font-mono text-sm text-gray-300 truncate">
            {data?.referralUrl ?? 'Loading...'}
          </div>
          <button
            onClick={copyLink}
            className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-5 py-3 rounded-xl text-sm transition-colors whitespace-nowrap"
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
        <p className="text-gray-600 text-xs mt-2">
          Code: <span className="font-mono text-gray-400">{data?.code}</span>
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Referrals', value: data?.stats.total ?? 0 },
          { label: 'Converted', value: data?.stats.converted ?? 0 },
          { label: 'Pending', value: data?.stats.pending ?? 0 },
          { label: 'Total Earned', value: `$${data?.stats.totalCommissionUsd ?? '0.00'}` },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#0D1231] border border-white/10 rounded-2xl p-5">
            <p className="text-gray-500 text-xs mb-1">{stat.label}</p>
            <p className="text-white text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6 mb-8">
        <h2 className="text-white font-semibold mb-6">How It Works</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              step: '1',
              icon: '&#128279;',
              title: 'Share your link',
              desc: 'Send your unique referral link to friends and communities.',
            },
            {
              step: '2',
              icon: '&#128100;',
              title: 'They sign up',
              desc: 'When they create an account via your link, both of you get $1 in tokens.',
            },
            {
              step: '3',
              icon: '&#128184;',
              title: 'Earn commission',
              desc: 'You get 20% lifetime commission on everything they purchase.',
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[#FFB81C]/10 border border-[#FFB81C]/20 flex items-center justify-center text-[#FFB81C] font-bold text-sm flex-shrink-0">
                {item.step}
              </div>
              <div>
                <p className="text-white font-medium mb-1">{item.title}</p>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent referrals */}
      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-4">Recent Referrals</h2>
        {!data?.recent?.length ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No referrals yet. Share your link to get started!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-white/10">
                  <th className="text-left pb-3 pr-4">Status</th>
                  <th className="text-left pb-3 pr-4">Date</th>
                  <th className="text-right pb-3">Commission</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((ref) => (
                  <tr key={ref.id} className="border-b border-white/5">
                    <td className="py-3 pr-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          ref.status === 'CONVERTED'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : ref.status === 'PAID'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                        }`}
                      >
                        {ref.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-400">
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-right text-gray-300">
                      {ref.commission > 0 ? `$${(ref.commission / 100).toFixed(2)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
