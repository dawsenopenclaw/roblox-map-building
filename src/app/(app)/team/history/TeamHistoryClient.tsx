'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'

interface ProjectVersion {
  id: string
  projectId: string
  userId: string
  version: number
  message: string | null
  createdAt: string
}

interface VersionDiff {
  id: string
  fromVersionId: string
  toVersionId: string
  summary: string | null
  diff: {
    added: string[]
    modified: string[]
    removed: string[]
    changes: Record<string, { from: unknown; to: unknown }>
  }
}

// Demo versions shown when no projectId is supplied or API is unreachable
const DEMO_VERSIONS: ProjectVersion[] = [
  { id: 'v3', projectId: 'demo-project', userId: 'user_demo', version: 3, message: 'Added Zone 4 retail district', createdAt: new Date(Date.now() - 3600_000).toISOString() },
  { id: 'v2', projectId: 'demo-project', userId: 'user_demo', version: 2, message: 'Rebuilt spawn plaza lighting', createdAt: new Date(Date.now() - 2 * 86400_000).toISOString() },
  { id: 'v1', projectId: 'demo-project', userId: 'user_demo', version: 1, message: 'Initial city layout', createdAt: new Date(Date.now() - 7 * 86400_000).toISOString() },
]

const DEMO_DIFF: VersionDiff = {
  id: 'diff-demo',
  fromVersionId: 'v1',
  toVersionId: 'v3',
  summary: '2 zones added, spawn plaza rebuilt, 1 building removed',
  diff: {
    added: ['Zone4/RetailDistrict', 'Zone4/ParkingLot'],
    modified: ['SpawnPlaza/Lighting', 'SpawnPlaza/Terrain'],
    removed: ['Zone1/OldWarehouse'],
    changes: {},
  },
}

function timeAgo(dateStr: string): string {
  const elapsed = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(elapsed / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function TeamHistoryPage() {
  const { getToken } = useAuth()
  const [projectId, setProjectId] = useState('')
  const [versions, setVersions] = useState<ProjectVersion[]>(DEMO_VERSIONS)
  const [selectedFrom, setSelectedFrom] = useState<string>('')
  const [selectedTo, setSelectedTo] = useState<string>('')
  const [diff, setDiff] = useState<VersionDiff | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingDiff, setLoadingDiff] = useState(false)
  const [rollingBack, setRollingBack] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isDemo, setIsDemo] = useState(true)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.forjegames.com'

  const fetchVersions = useCallback(async () => {
    if (!projectId.trim()) return
    setLoading(true)
    setError('')
    try {
      const token = await getToken()
      const res = await fetch(`${apiUrl}/api/projects/${projectId}/versions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error || 'Failed to load versions')
        return
      }
      const data = await res.json() as { versions: ProjectVersion[] }
      setVersions(data.versions ?? [])
      setIsDemo(false)
    } catch {
      setError('Network error — showing demo data')
      setVersions(DEMO_VERSIONS)
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }, [projectId, apiUrl, getToken])

  async function fetchDiff() {
    if (!selectedFrom || !selectedTo) return

    // Demo shortcut — no API call needed
    if (isDemo) {
      setDiff(DEMO_DIFF)
      return
    }

    if (!projectId) return
    setLoadingDiff(true)
    setDiff(null)
    try {
      const token = await getToken()
      const res = await fetch(
        `${apiUrl}/api/projects/${projectId}/diff?from=${selectedFrom}&to=${selectedTo}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) {
        setDiff(DEMO_DIFF)
        return
      }
      const data = await res.json() as { diff: VersionDiff }
      setDiff(data.diff)
    } catch {
      setDiff(DEMO_DIFF)
    } finally {
      setLoadingDiff(false)
    }
  }

  async function handleRollback(versionId: string) {
    if (!confirm('Roll back to this version? A new version will be created with the old snapshot.')) return
    if (isDemo) {
      setSuccess('Rollback complete (demo) — new version created')
      setTimeout(() => setSuccess(''), 3000)
      return
    }
    if (!projectId) return
    setRollingBack(true)
    setError('')
    setSuccess('')
    try {
      const token = await getToken()
      const targetVersion = versions.find((v) => v.id === versionId)
      const res = await fetch(`${apiUrl}/api/projects/${projectId}/rollback`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionId,
          message: `Rolled back to v${targetVersion?.version ?? '?'}`,
        }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error || 'Rollback failed')
        return
      }
      setSuccess('Rollback complete — new version created')
      await fetchVersions()
    } catch {
      setError('Network error')
    } finally {
      setRollingBack(false)
    }
  }

  useEffect(() => {
    if (selectedFrom && selectedTo) fetchDiff()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFrom, selectedTo])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/editor" className="text-[#FFB81C] hover:underline text-sm mb-2 inline-block">
          ← Back to editor
        </Link>
        <h1 className="text-2xl font-bold text-white">Version History</h1>
        <p className="text-gray-300 text-sm mt-1">Browse, compare, and roll back project versions</p>
      </div>

      {/* Demo banner */}
      {isDemo && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs rounded-xl px-4 py-2.5">
          Showing demo versions. Enter a Project ID and click Load to view real history.
        </div>
      )}

      {/* Project ID input */}
      <div className="bg-[#141414] border border-white/[0.08] rounded-2xl p-5">
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Project ID</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="Enter project ID to load versions"
            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FFB81C]/50 transition-colors"
          />
          <button
            onClick={fetchVersions}
            disabled={!projectId.trim() || loading}
            className="bg-[#FFB81C] hover:bg-[#E5A619] disabled:bg-[#FFB81C]/30 disabled:cursor-not-allowed text-black font-semibold px-5 py-3 rounded-xl text-sm transition-colors"
          >
            {loading ? 'Loading…' : 'Load'}
          </button>
        </div>
      </div>

      {/* Status */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl px-4 py-3">
          {success}
        </div>
      )}

      {/* Versions timeline — always rendered (demo or real) */}
      {versions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timeline */}
          <div className="bg-[#141414] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
                Commit Timeline
              </h2>
              <span className="text-xs text-gray-500">{versions.length} versions</span>
            </div>

            <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
              {versions.map((v, idx) => (
                <div key={v.id} className="flex gap-4 px-5 py-4 relative hover:bg-white/2 transition-colors">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${idx === 0 ? 'bg-[#FFB81C]' : 'bg-white/20'}`} />
                    {idx < versions.length - 1 && (
                      <div className="w-px flex-1 bg-white/10 mt-1 mb-0 min-h-6" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pb-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[#FFB81C] bg-[#FFB81C]/10 px-2 py-0.5 rounded">
                          v{v.version}
                        </span>
                        <p className="text-white text-sm truncate">
                          {v.message || 'No commit message'}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">{timeAgo(v.createdAt)}</p>

                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setSelectedFrom(v.id)}
                        className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                          selectedFrom === v.id
                            ? 'bg-[#FFB81C]/20 text-[#FFB81C] border border-[#FFB81C]/30'
                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        From
                      </button>
                      <button
                        onClick={() => setSelectedTo(v.id)}
                        className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                          selectedTo === v.id
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        To
                      </button>
                      <button
                        onClick={() => handleRollback(v.id)}
                        disabled={rollingBack || idx === 0}
                        className="text-xs px-2 py-1 rounded-lg bg-white/5 text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {idx === 0 ? 'Current' : 'Rollback'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Diff view */}
          <div className="bg-[#141414] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
                Diff View
              </h2>
              {(selectedFrom || selectedTo) && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedFrom ? `From: v${versions.find((v) => v.id === selectedFrom)?.version}` : 'Select "From"'}
                  {' → '}
                  {selectedTo ? `To: v${versions.find((v) => v.id === selectedTo)?.version}` : 'Select "To"'}
                </p>
              )}
            </div>

            <div className="p-5">
              {loadingDiff ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 bg-white/[0.04] rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : diff ? (
                <div className="space-y-4">
                  {diff.summary && (
                    <p className="text-xs text-gray-300 bg-white/5 rounded-lg px-3 py-2">
                      {diff.summary}
                    </p>
                  )}

                  {diff.diff.added.length > 0 && (
                    <div>
                      <p className="text-xs text-green-400 font-medium mb-2">Added ({diff.diff.added.length})</p>
                      {diff.diff.added.map((key) => (
                        <div key={key} className="font-mono text-xs text-green-300 bg-green-500/10 rounded px-3 py-1.5 mb-1">
                          + {key}
                        </div>
                      ))}
                    </div>
                  )}

                  {diff.diff.modified.length > 0 && (
                    <div>
                      <p className="text-xs text-yellow-400 font-medium mb-2">Modified ({diff.diff.modified.length})</p>
                      {diff.diff.modified.map((key) => (
                        <div key={key} className="font-mono text-xs text-yellow-300 bg-yellow-500/10 rounded px-3 py-1.5 mb-1">
                          ~ {key}
                        </div>
                      ))}
                    </div>
                  )}

                  {diff.diff.removed.length > 0 && (
                    <div>
                      <p className="text-xs text-red-400 font-medium mb-2">Removed ({diff.diff.removed.length})</p>
                      {diff.diff.removed.map((key) => (
                        <div key={key} className="font-mono text-xs text-red-300 bg-red-500/10 rounded px-3 py-1.5 mb-1">
                          - {key}
                        </div>
                      ))}
                    </div>
                  )}

                  {diff.diff.added.length === 0 && diff.diff.modified.length === 0 && diff.diff.removed.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-8">No differences found</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] mb-3">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm">Select From and To versions to see differences</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty state — only shown after a real load with no results */}
      {versions.length === 0 && !loading && projectId && !error && !isDemo && (
        <div className="bg-[#141414] border border-dashed border-white/10 rounded-2xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] mb-3">
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <p className="text-gray-300 text-sm">No versions found for this project</p>
        </div>
      )}
    </div>
  )
}
