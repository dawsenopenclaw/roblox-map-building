'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Users,
  Plus,
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Clock,
  Crown,
  Shield,
  Code,
  Eye,
  LogIn,
  Share2,
} from 'lucide-react'

type TeamSummary = {
  id: string
  name: string
  slug: string
  description: string | null
  myRole: 'OWNER' | 'ADMIN' | 'EDITOR' | 'DEVELOPER' | 'VIEWER'
  memberCount: number
  projectCount: number
  joinedAt: string
  createdAt: string
  inviteCode?: string | null
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Crown }> = {
  OWNER:     { label: 'Owner',     color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/15 border-[#D4AF37]/30', icon: Crown },
  ADMIN:     { label: 'Admin',     color: 'text-blue-400',  bg: 'bg-blue-500/15 border-blue-500/30',    icon: Shield },
  EDITOR:    { label: 'Editor',    color: 'text-purple-400', bg: 'bg-purple-500/15 border-purple-500/30', icon: Code },
  DEVELOPER: { label: 'Developer', color: 'text-purple-400', bg: 'bg-purple-500/15 border-purple-500/30', icon: Code },
  VIEWER:    { label: 'Viewer',    color: 'text-gray-400',  bg: 'bg-gray-500/15 border-gray-500/30',    icon: Eye },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

export default function TeamClient() {
  const [teams, setTeams] = useState<TeamSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Create team form
  const [newTeamName, setNewTeamName] = useState('')
  const [creating, setCreating] = useState(false)

  // Join team form
  const [inviteCode, setInviteCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinSuccess, setJoinSuccess] = useState('')

  // Invite code copy tracking per team
  const [copiedId, setCopiedId] = useState<string | null>(null)
  // Invite codes fetched per team
  const [inviteCodes, setInviteCodes] = useState<Record<string, string | null>>({})
  const [loadingInvite, setLoadingInvite] = useState<string | null>(null)

  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch('/api/team')
      if (!res.ok) {
        setError('Failed to load teams')
        return
      }
      const data = await res.json()
      setTeams(data.teams ?? [])
    } catch {
      setError('Failed to connect. Check your internet connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault()
    const name = newTeamName.trim()
    if (!name) return

    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create team')
        return
      }
      setNewTeamName('')
      // If the response includes an invite code, store it
      if (data.team?.inviteCode) {
        setInviteCodes((prev) => ({ ...prev, [data.team.id]: data.team.inviteCode }))
      }
      await fetchTeams()
    } catch {
      setError('Failed to create team')
    } finally {
      setCreating(false)
    }
  }

  async function handleJoinTeam(e: React.FormEvent) {
    e.preventDefault()
    const code = inviteCode.trim()
    if (!code) return

    setJoining(true)
    setError('')
    setJoinSuccess('')
    try {
      const res = await fetch(`/api/team/join/${encodeURIComponent(code)}`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to join team')
        return
      }
      setInviteCode('')
      setJoinSuccess(`Joined "${data.team?.name || 'team'}" as ${data.role || 'member'}`)
      setTimeout(() => setJoinSuccess(''), 4000)
      await fetchTeams()
    } catch {
      setError('Failed to join team')
    } finally {
      setJoining(false)
    }
  }

  async function fetchInviteCode(teamId: string) {
    if (inviteCodes[teamId] !== undefined) return
    setLoadingInvite(teamId)
    try {
      const res = await fetch(`/api/team/${teamId}/invite`)
      if (res.ok) {
        const data = await res.json()
        setInviteCodes((prev) => ({ ...prev, [teamId]: data.inviteCode || null }))
      } else {
        setInviteCodes((prev) => ({ ...prev, [teamId]: null }))
      }
    } catch {
      setInviteCodes((prev) => ({ ...prev, [teamId]: null }))
    } finally {
      setLoadingInvite(null)
    }
  }

  function copyInviteLink(teamId: string, code: string) {
    navigator.clipboard.writeText(`https://forjegames.com/team/join/${code}`)
    setCopiedId(teamId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="max-w-4xl mx-auto pb-16 pt-2 px-4">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#D4AF37] transition-colors mb-6 group"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Teams</h1>
          <p className="text-sm text-gray-400 mt-1">
            Create teams, invite collaborators, and build together.
          </p>
        </div>
        <Link
          href="/team/history"
          className="text-xs text-gray-400 hover:text-[#D4AF37] transition-colors"
        >
          Build History
        </Link>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-6">
          {error}
          <button
            onClick={() => setError('')}
            className="ml-3 text-red-300 hover:text-red-200 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Success display */}
      {joinSuccess && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm rounded-xl px-4 py-3 mb-6">
          {joinSuccess}
        </div>
      )}

      {/* Create + Join forms */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Create Team */}
        <form
          onSubmit={handleCreateTeam}
          className="rounded-2xl p-5 border border-white/10"
          style={{ background: 'rgb(25,28,45)' }}
        >
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            Create a Team
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Team name..."
              maxLength={100}
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
            />
            <button
              type="submit"
              disabled={creating || !newTeamName.trim()}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-black transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              style={{ background: 'rgb(212,175,55)' }}
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>

        {/* Join Team */}
        <form
          onSubmit={handleJoinTeam}
          className="rounded-2xl p-5 border border-white/10"
          style={{ background: 'rgb(25,28,45)' }}
        >
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <LogIn className="w-4 h-4 text-[#D4AF37]" />
            Have an invite code?
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Paste invite code..."
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
            />
            <button
              type="submit"
              disabled={joining || !inviteCode.trim()}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-black transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              style={{ background: 'rgb(212,175,55)' }}
            >
              {joining ? 'Joining...' : 'Join'}
            </button>
          </div>
        </form>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-2xl border border-white/5"
              style={{ background: 'rgb(25,28,45)' }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && teams.length === 0 && (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 border border-white/10 mb-4">
            <Users className="w-7 h-7 text-gray-500" />
          </div>
          <p className="text-white font-semibold text-base mb-2">
            You&apos;re not in any teams yet
          </p>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Create a team to start collaborating, or join one with an invite code.
          </p>
        </div>
      )}

      {/* Team cards grid */}
      {!loading && teams.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {teams.map((team) => {
            const roleConf = ROLE_CONFIG[team.myRole] || ROLE_CONFIG.VIEWER
            const RoleIcon = roleConf.icon
            const code = inviteCodes[team.id]

            return (
              <div
                key={team.id}
                className="rounded-2xl border border-white/10 p-5 transition-all duration-200 hover:scale-[1.02] hover:border-white/15 flex flex-col"
                style={{ background: 'rgb(25,28,45)' }}
              >
                {/* Top row: name + role */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-white truncate">
                      {team.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Users className="w-3 h-3" />
                        {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                      </span>
                      {team.projectCount > 0 && (
                        <span className="text-xs text-gray-500">
                          {team.projectCount} project{team.projectCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold uppercase border ${roleConf.bg} ${roleConf.color} shrink-0`}
                  >
                    <RoleIcon className="w-3 h-3" />
                    {roleConf.label}
                  </span>
                </div>

                {/* Timestamps */}
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Joined {timeAgo(team.joinedAt)}
                  </span>
                </div>

                {/* Invite code section */}
                {(team.myRole === 'OWNER' || team.myRole === 'ADMIN') && (
                  <div className="mb-4">
                    {code === undefined ? (
                      <button
                        onClick={() => fetchInviteCode(team.id)}
                        disabled={loadingInvite === team.id}
                        className="text-xs text-[#D4AF37] hover:text-[#e5c54b] transition-colors flex items-center gap-1"
                      >
                        <Share2 className="w-3 h-3" />
                        {loadingInvite === team.id ? 'Loading...' : 'Get invite link'}
                      </button>
                    ) : code ? (
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-gray-400 bg-white/[0.04] border border-white/[0.06] rounded px-2 py-1 truncate flex-1">
                          {code}
                        </code>
                        <button
                          onClick={() => copyInviteLink(team.id, code)}
                          className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors text-gray-400 hover:text-white shrink-0"
                          title="Copy invite link"
                        >
                          {copiedId === team.id ? (
                            <Check className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">No active invite link</span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-auto pt-3 border-t border-white/5">
                  <Link
                    href="/team/settings"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-white/[0.06] hover:bg-white/[0.10] transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
