'use client'

import { useEffect, useState, useCallback } from 'react'
import { Heart, Plus, Trash2, RefreshCw } from 'lucide-react'

interface CharityStats {
  totalDonatedAllTimeCents: number
  totalDonatedThisMonthCents: number
  mrrCents?: number
  byCharity: {
    charitySlug: string
    charityName: string
    totalCents: number
    count: number
  }[]
  monthlyHistory: {
    month: string
    totalCents: number
    count: number
  }[]
  activeCharities: {
    slug: string
    name: string
    description: string
    url: string
  }[]
}

const DEMO_DATA: CharityStats = {
  totalDonatedAllTimeCents: 284750,
  totalDonatedThisMonthCents: 18420,
  mrrCents: 489500,
  byCharity: [
    { charitySlug: 'save-the-children', charityName: 'Save the Children', totalCents: 112400, count: 284 },
    { charitySlug: 'direct-relief', charityName: 'Direct Relief', totalCents: 98200, count: 196 },
    { charitySlug: 'charity-water', charityName: 'Charity: Water', totalCents: 74150, count: 153 },
  ],
  monthlyHistory: [
    { month: 'Oct 2025', totalCents: 31200, count: 78 },
    { month: 'Nov 2025', totalCents: 44800, count: 112 },
    { month: 'Dec 2025', totalCents: 58300, count: 146 },
    { month: 'Jan 2026', totalCents: 62100, count: 155 },
    { month: 'Feb 2026', totalCents: 70000, count: 175 },
    { month: 'Mar 2026', totalCents: 18420, count: 46 },
  ],
  activeCharities: [
    { slug: 'save-the-children', name: 'Save the Children', description: 'Helping children in need worldwide.', url: 'https://savethechildren.org' },
    { slug: 'direct-relief', name: 'Direct Relief', description: 'Emergency medical aid for people in crisis.', url: 'https://directrelief.org' },
    { slug: 'charity-water', name: 'Charity: Water', description: 'Bringing clean water to developing nations.', url: 'https://charitywater.org' },
  ],
}

const BAR_COLORS = ['#FFB81C', '#E6A519', '#c88d15', '#a87210', '#7a5310']

export default function AdminCharityPage() {
  const [data, setData] = useState<CharityStats>(DEMO_DATA)
  const [isDemo, setIsDemo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newCharity, setNewCharity] = useState({ slug: '', name: '', description: '', url: '' })
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/charity')
      if (!res.ok) throw new Error(`${res.status}`)
      setData(await res.json())
      setIsDemo(false)
    } catch {
      setData(DEMO_DATA)
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddCharity = async () => {
    if (isDemo) return
    setSaving(true)
    try {
      await fetch('/api/admin/charity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCharity),
      })
      setNewCharity({ slug: '', name: '', description: '', url: '' })
      setShowAdd(false)
      await fetchData()
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveCharity = async (slug: string) => {
    if (isDemo) return
    try {
      await fetch(`/api/admin/charity/${slug}`, { method: 'DELETE' })
      await fetchData()
    } catch (e) {
      // Error handling delegated to UI layer
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#FFB81C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const totalByCharity = data.byCharity.reduce((sum, c) => sum + c.totalCents, 0) || 1
  const mrrCents = data.mrrCents ?? 0
  const tenPctThisMonthCents = Math.round(mrrCents * 0.1)
  const tenPctPaceDisplay = (tenPctThisMonthCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const donatedThisMonthDisplay = (data.totalDonatedThisMonthCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const pctOfTarget = tenPctThisMonthCents > 0 ? Math.min((data.totalDonatedThisMonthCents / tenPctThisMonthCents) * 100, 100) : 0

  return (
    <div className="space-y-8 p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Charity</h1>
          <p className="text-[#B0B0B0] text-sm mt-1">Donation tracking and charity rotation</p>
        </div>
        <div className="flex items-center gap-2">
          {isDemo && (
            <span className="text-xs px-2 py-1 bg-[#FFB81C]/10 text-[#FFB81C] border border-[#FFB81C]/20 rounded-full">
              Demo data
            </span>
          )}
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 bg-[#141414] border border-[#1c1c1c] rounded-lg text-sm text-[#B0B0B0] hover:text-white hover:border-[#FFB81C] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            disabled={isDemo}
            className="flex items-center gap-2 px-3 py-2 bg-[#FFB81C] text-black rounded-lg text-sm font-semibold hover:bg-[#E6A519] transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add Charity
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#141414] border border-[#1c1c1c] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#FFB81C]/10 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-[#FFB81C]" />
            </div>
            <p className="text-xs text-[#B0B0B0] uppercase tracking-wider">Total Donated — All Time</p>
          </div>
          <p className="text-3xl font-bold text-white">
            ${(data.totalDonatedAllTimeCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-[#141414] border border-[#1c1c1c] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#FFB81C]/10 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-[#FFB81C]" />
            </div>
            <p className="text-xs text-[#B0B0B0] uppercase tracking-wider">Donated — This Month</p>
          </div>
          <p className="text-3xl font-bold text-white">${donatedThisMonthDisplay}</p>
        </div>
        {/* 10% calculation card */}
        <div className="bg-[#141414] border border-[#FFB81C]/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#FFB81C]/10 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-[#FFB81C]" />
            </div>
            <p className="text-xs text-[#B0B0B0] uppercase tracking-wider">10% of MRR Target</p>
          </div>
          <p className="text-3xl font-bold text-[#FFB81C]">${tenPctPaceDisplay}</p>
          <p className="text-xs text-[#B0B0B0] mt-1">
            10% of ${(mrrCents / 100).toLocaleString()} MRR
          </p>
          {/* Progress toward 10% target */}
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#B0B0B0]">This month</span>
              <span className="text-white font-medium">{pctOfTarget.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-[#1c1c1c] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[#FFB81C] transition-all duration-500"
                style={{ width: `${pctOfTarget}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add charity form */}
      {showAdd && (
        <div className="bg-[#141414] border border-[#FFB81C]/30 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white">Add Charity to Rotation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'name', label: 'Charity Name', placeholder: 'e.g. Save The Children' },
              { key: 'slug', label: 'Slug', placeholder: 'e.g. save-the-children' },
              { key: 'url', label: 'Website URL', placeholder: 'https://...' },
              { key: 'description', label: 'Description', placeholder: 'Short description...' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-[#B0B0B0] mb-1">{label}</label>
                <input
                  type="text"
                  placeholder={placeholder}
                  value={newCharity[key as keyof typeof newCharity]}
                  onChange={(e) => setNewCharity((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#1c1c1c] border border-[#1c1c1c] rounded-lg text-sm text-white placeholder:text-[#B0B0B0] focus:outline-none focus:border-[#FFB81C]"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddCharity}
              disabled={saving || !newCharity.name || !newCharity.slug}
              className="px-4 py-2 bg-[#FFB81C] text-black rounded-lg text-sm font-semibold hover:bg-[#E6A519] transition-colors disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Charity'}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 bg-[#1c1c1c] border border-[#1c1c1c] text-[#B0B0B0] rounded-lg text-sm hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Per-charity breakdown */}
        <div className="bg-[#141414] border border-[#1c1c1c] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-[#B0B0B0] uppercase tracking-wider mb-6">
            Donations by Charity
          </h2>
          {data.byCharity.length === 0 ? (
            <p className="text-[#B0B0B0] text-sm">No donations yet</p>
          ) : (
            <div className="space-y-4">
              {data.byCharity.map((charity, i) => {
                const pct = (charity.totalCents / totalByCharity) * 100
                const color = BAR_COLORS[i % BAR_COLORS.length]
                return (
                  <div key={charity.charitySlug}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-white font-medium">{charity.charityName}</span>
                      <span style={{ color }}>
                        ${(charity.totalCents / 100).toLocaleString()} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-[#1c1c1c] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                    <p className="text-xs text-[#B0B0B0] mt-1">{charity.count} donations</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Monthly history */}
        <div className="bg-[#141414] border border-[#1c1c1c] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-[#B0B0B0] uppercase tracking-wider mb-4">
            Monthly History
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-[#B0B0B0] border-b border-[#1c1c1c]">
                  <th className="pb-2 text-left font-medium">Month</th>
                  <th className="pb-2 text-right font-medium">Donations</th>
                  <th className="pb-2 text-right font-medium">Amount</th>
                  <th className="pb-2 text-right font-medium text-[#FFB81C]/70">10% Pledge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c1c1c]">
                {data.monthlyHistory.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-[#B0B0B0]">
                      No history
                    </td>
                  </tr>
                ) : (
                  data.monthlyHistory.map((row) => (
                    <tr key={row.month}>
                      <td className="py-2.5 text-[#B0B0B0]">{row.month}</td>
                      <td className="py-2.5 text-right text-white">{row.count}</td>
                      <td className="py-2.5 text-right text-[#FFB81C] font-medium">
                        ${(row.totalCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Active charities */}
      <div className="bg-[#141414] border border-[#1c1c1c] rounded-xl p-6">
        <h2 className="text-sm font-semibold text-[#B0B0B0] uppercase tracking-wider mb-4">
          Charities in Rotation ({data.activeCharities.length})
        </h2>
        {data.activeCharities.length === 0 ? (
          <p className="text-[#B0B0B0] text-sm">No active charities configured</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.activeCharities.map((charity) => (
              <div
                key={charity.slug}
                className="flex items-start justify-between p-4 bg-[#1c1c1c] border border-[#1c1c1c] rounded-lg"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-white text-sm font-medium truncate">{charity.name}</p>
                  {charity.description && (
                    <p className="text-[#B0B0B0] text-xs mt-0.5 line-clamp-2">{charity.description}</p>
                  )}
                  {charity.url && (
                    <a
                      href={charity.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FFB81C] text-xs hover:text-[#E6A519] transition-colors mt-1 block truncate"
                    >
                      {charity.url.replace('https://', '')}
                    </a>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveCharity(charity.slug)}
                  disabled={isDemo}
                  className="p-1.5 rounded-lg border border-[#1c1c1c] text-[#B0B0B0] hover:text-red-400 hover:border-red-500 transition-colors flex-shrink-0 disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
