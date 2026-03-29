'use client'

import { useEffect, useState, useCallback } from 'react'
import { Heart, Plus, Trash2, RefreshCw } from 'lucide-react'

interface CharityStats {
  totalDonatedAllTimeCents: number
  totalDonatedThisMonthCents: number
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

const PRESET_COLORS = ['#FFB81C', '#E6A519', '#c88d15', '#a87210', '#7a5310', '#4a3208']

export default function AdminCharityPage() {
  const [data, setData] = useState<CharityStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newCharity, setNewCharity] = useState({
    slug: '',
    name: '',
    description: '',
    url: '',
  })
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/charity')
      if (!res.ok) throw new Error(`${res.status}`)
      setData(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddCharity = async () => {
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
    try {
      await fetch(`/api/admin/charity/${slug}`, { method: 'DELETE' })
      await fetchData()
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#FFB81C] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Provide empty-state fallback so the page renders even without DB data
  const safeData: CharityStats = data ?? {
    totalDonatedAllTimeCents: 0,
    totalDonatedThisMonthCents: 0,
    byCharity: [],
    monthlyHistory: [],
    activeCharities: [],
  }

  const totalByCharity = safeData.byCharity.reduce((sum, c) => sum + c.totalCents, 0) || 1

  return (
    <div className="space-y-8 p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Charity Management</h1>
          <p className="text-[#6B7280] text-sm mt-1">
            Donation tracking and charity rotation
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 bg-[#0D1231] border border-[#1E2451] rounded-lg text-sm text-[#6B7280] hover:text-white hover:border-[#FFB81C] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 px-3 py-2 bg-[#FFB81C] text-black rounded-lg text-sm font-semibold hover:bg-[#E6A519] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Charity
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#0D1231] border border-[#1E2451] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#FFB81C]/10 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-[#FFB81C]" />
            </div>
            <p className="text-xs text-[#6B7280] uppercase tracking-wider">Total Donated — All Time</p>
          </div>
          <p className="text-3xl font-bold text-white">
            ${(safeData.totalDonatedAllTimeCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-[#0D1231] border border-[#1E2451] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#FFB81C]/10 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-[#FFB81C]" />
            </div>
            <p className="text-xs text-[#6B7280] uppercase tracking-wider">Donated — This Month</p>
          </div>
          <p className="text-3xl font-bold text-white">
            ${(safeData.totalDonatedThisMonthCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Add charity form */}
      {showAdd && (
        <div className="bg-[#0D1231] border border-[#FFB81C]/30 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white">Add Charity to Rotation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'name', label: 'Charity Name', placeholder: 'e.g. Save The Children' },
              { key: 'slug', label: 'Slug', placeholder: 'e.g. save-the-children' },
              { key: 'url', label: 'Website URL', placeholder: 'https://...' },
              { key: 'description', label: 'Description', placeholder: 'Short description...' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-[#6B7280] mb-1">{label}</label>
                <input
                  type="text"
                  placeholder={placeholder}
                  value={newCharity[key as keyof typeof newCharity]}
                  onChange={(e) => setNewCharity((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#111640] border border-[#1E2451] rounded-lg text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-[#FFB81C]"
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
              className="px-4 py-2 bg-[#111640] border border-[#1E2451] text-[#6B7280] rounded-lg text-sm hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pie chart (CSS-based) */}
        <div className="bg-[#0D1231] border border-[#1E2451] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-6">
            Donations by Charity
          </h2>
          {safeData.byCharity.length === 0 ? (
            <p className="text-[#6B7280] text-sm">No donations yet</p>
          ) : (
            <div className="space-y-3">
              {safeData.byCharity.map((charity, i) => {
                const pct = (charity.totalCents / totalByCharity) * 100
                const color = PRESET_COLORS[i % PRESET_COLORS.length]
                return (
                  <div key={charity.charitySlug}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white">{charity.charityName}</span>
                      <span style={{ color }}>
                        ${(charity.totalCents / 100).toFixed(2)} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-[#111640] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Monthly history */}
        <div className="bg-[#0D1231] border border-[#1E2451] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-4">
            Monthly Donation History
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-[#6B7280] border-b border-[#1E2451]">
                  <th className="pb-2 text-left">Month</th>
                  <th className="pb-2 text-right">Donations</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2451]">
                {safeData.monthlyHistory.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-[#6B7280]">
                      No history
                    </td>
                  </tr>
                ) : (
                  safeData.monthlyHistory.map((row) => (
                    <tr key={row.month}>
                      <td className="py-2.5 text-[#6B7280]">{row.month}</td>
                      <td className="py-2.5 text-right text-white">{row.count}</td>
                      <td className="py-2.5 text-right text-[#FFB81C] font-medium">
                        ${(row.totalCents / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Active charities list */}
      <div className="bg-[#0D1231] border border-[#1E2451] rounded-xl p-6">
        <h2 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-4">
          Charities in Rotation ({safeData.activeCharities.length})
        </h2>
        {safeData.activeCharities.length === 0 ? (
          <p className="text-[#6B7280] text-sm">No active charities configured</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {safeData.activeCharities.map((charity) => (
              <div
                key={charity.slug}
                className="flex items-start justify-between p-4 bg-[#111640] border border-[#1E2451] rounded-lg"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-white text-sm font-medium truncate">{charity.name}</p>
                  {charity.description && (
                    <p className="text-[#6B7280] text-xs mt-0.5 line-clamp-2">
                      {charity.description}
                    </p>
                  )}
                  {charity.url && (
                    <a
                      href={charity.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FFB81C] text-xs hover:text-[#E6A519] transition-colors mt-1 block truncate"
                    >
                      {charity.url}
                    </a>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveCharity(charity.slug)}
                  className="p-1.5 rounded-lg border border-[#1E2451] text-[#6B7280] hover:text-red-400 hover:border-red-500 transition-colors flex-shrink-0"
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
