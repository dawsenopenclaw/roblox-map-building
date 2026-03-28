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

export default function TeamHistoryPage() {
  const { getToken } = useAuth()
  const [projectId, setProjectId] = useState('')
  const [versions, setVersions] = useState<ProjectVersion[]>([])
  const [selectedFrom, setSelectedFrom] = useState<string>('')
  const [selectedTo, setSelectedTo] = useState<string>('')
  const [diff, setDiff] = useState<VersionDiff | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingDiff, setLoadingDiff] = useState(false)
  const [rollingBack, setRollingBack] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

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
      setVersions(data.versions)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [projectId, apiUrl, getToken])

  async function fetchDiff() {
    if (!selectedFrom || !selectedTo || !projectId) return
    setLoadingDiff(true)
    setDiff(null)
    try {
      const token = await getToken()
      const res = await fetch(
        `${apiUrl}/api/projects/${projectId}/diff?from=${selectedFrom}&to=${selectedTo}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) return
      const data = await res.json() as { diff: VersionDiff }
      setDiff(data.diff)
    } finally {
      setLoadingDiff(false)
    }
  }

  async function handleRollback(versionId: string) {
    if (!projectId || !confirm('Roll back to this version? A new version will be created with the old snapshot.')) return
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

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/team" className="text-[#FFB81C] hover:underline text-sm mb-2 inline-block">
          ← Back to team
        </Link>
        <h1 className="text-2xl font-bold text-white">Version History</h1>
        <p className="text-gray-400 text-sm mt-1">Browse, compare, and roll back project versions</p>
      </div>

      {/* Project ID input */}
      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-5">
        <label className="block text-xs text-gray-400 mb-2 font-medium">Project ID</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="Enter project ID to load versions"
            className="flex-1 bg-[#111640] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FFB81C]/40 transition-colors"
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

      {/* Versions timeline */}
      {versions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timeline */}
          <div className="bg-[#0D1231] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                Commit Timeline
              </h2>
              <span className="text-xs text-gray-600">{versions.length} versions</span>
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
                    <p className="text-gray-600 text-xs mt-1">{timeAgo(v.createdAt)}</p>

                    <div className="flex gap-2 mt-2">
                      {/* Select for diff */}
                      <button
                        onClick={() => setSelectedFrom(v.id)}
                        className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                          selectedFrom === v.id
                            ? 'bg-[#FFB81C]/20 text-[#FFB81C] border border-[#FFB81C]/30'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        From
                      </button>
                      <button
                        onClick={() => setSelectedTo(v.id)}
                        className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                          selectedTo === v.id
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        To
                      </button>
                      <button
                        onClick={() => handleRollback(v.id)}
                        disabled={rollingBack || idx === 0}
                        className="text-xs px-2 py-1 rounded-lg bg-white/5 text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
          <div className="bg-[#0D1231] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                Diff View
              </h2>
              {(selectedFrom || selectedTo) && (
                <p className="text-xs text-gray-600 mt-0.5">
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
                    <div key={i} className="h-8 bg-white/5 rounded animate-pulse" />
                  ))}
                </div>
              ) : diff ? (
                <div className="space-y-4">
                  {/* Summary */}
                  {diff.summary && (
                    <p className="text-xs text-gray-400 bg-white/5 rounded-lg px-3 py-2">
                      {diff.summary}
                    </p>
                  )}

                  {/* Added */}
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

                  {/* Modified */}
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

                  {/* Removed */}
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
                    <p className="text-gray-500 text-sm text-center py-8">No differences found</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-3xl mb-3">📋</div>
                  <p className="text-gray-500 text-sm">Select From and To versions to see differences</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {versions.length === 0 && !loading && projectId && !error && (
        <div className="bg-[#0D1231] border border-dashed border-white/10 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-3">📦</div>
          <p className="text-gray-400 text-sm">No versions found for this project</p>
        </div>
      )}
    </div>
  )
}
