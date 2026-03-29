'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { PresenceIndicator } from '@/components/PresenceIndicator'

interface TeamSummary {
  id: string
  name: string
  description: string | null
  slug: string
  ownerId: string
  memberCount: number
  myRole: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER'
  createdAt: string
}

interface TeamDetail {
  id: string
  name: string
  description: string | null
  slug: string
  ownerId: string
  createdAt: string
  members: Array<{
    id: string
    userId: string
    role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER'
    joinedAt: string
  }>
  invites: Array<{
    id: string
    email: string | null
    token: string
    role: string
    status: string
    expiresAt: string
  }>
}

const ROLE_COLORS: Record<string, string> = {
  OWNER:  'bg-[#FFB81C]/10 text-[#FFB81C] border-[#FFB81C]/20',
  ADMIN:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  EDITOR: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  VIEWER: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner', ADMIN: 'Admin', EDITOR: 'Editor', VIEWER: 'Viewer',
}

const DEMO_TEAMS: TeamSummary[] = [
  {
    id: 'demo-team-1',
    name: 'Map Builders',
    description: 'Main city construction crew',
    slug: 'map-builders',
    ownerId: 'demo-user',
    memberCount: 3,
    myRole: 'OWNER',
    createdAt: new Date(Date.now() - 7 * 86400_000).toISOString(),
  },
]

const DEMO_DETAIL: TeamDetail = {
  id: 'demo-team-1',
  name: 'Map Builders',
  description: 'Main city construction crew',
  slug: 'map-builders',
  ownerId: 'demo-user',
  createdAt: new Date(Date.now() - 7 * 86400_000).toISOString(),
  members: [
    { id: 'm1', userId: 'Dawsen', role: 'OWNER', joinedAt: new Date(Date.now() - 7 * 86400_000).toISOString() },
    { id: 'm2', userId: 'Alex', role: 'EDITOR', joinedAt: new Date(Date.now() - 3 * 86400_000).toISOString() },
    { id: 'm3', userId: 'Sarah', role: 'VIEWER', joinedAt: new Date(Date.now() - 86400_000).toISOString() },
  ],
  invites: [],
}

// Simple avatar initials from a display name / userId
function initials(name: string) {
  const parts = name.trim().split(/[\s_-]+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function TeamPage() {
  const { getToken } = useAuth()
  const { user } = useUser()

  const [teams, setTeams] = useState<TeamSummary[]>([])
  const [selectedTeam, setSelectedTeam] = useState<TeamDetail | null>(null)
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // create-team form
  const [teamName, setTeamName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // join-by-link
  const [joinLink, setJoinLink] = useState('')
  const [joining, setJoining] = useState(false)

  // invite panel
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'EDITOR' | 'VIEWER'>('EDITOR')
  const [inviteLink, setInviteLink] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')

  const [isDemo, setIsDemo] = useState(false)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  const myUserId = user?.id || ''
  const myDisplayName = user?.fullName || user?.primaryEmailAddress?.emailAddress || 'You'

  // ── data fetching ──────────────────────────────────────────────────────────

  const fetchTeams = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${apiUrl}/api/teams`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) { setTeams(DEMO_TEAMS); setIsDemo(true); return }
      const data = await res.json() as { teams: TeamSummary[] }
      setTeams(data.teams ?? [])
      setIsDemo(false)
    } catch {
      setTeams(DEMO_TEAMS)
      setIsDemo(true)
    } finally {
      setLoadingTeams(false)
    }
  }, [apiUrl, getToken])

  const fetchTeamDetail = useCallback(async (teamId: string) => {
    if (teamId === DEMO_DETAIL.id) { setSelectedTeam(DEMO_DETAIL); return }
    setLoadingDetail(true)
    try {
      const token = await getToken()
      const res = await fetch(`${apiUrl}/api/teams/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) { setSelectedTeam(DEMO_DETAIL); setIsDemo(true); return }
      const data = await res.json() as { team: TeamDetail }
      setSelectedTeam(data.team)
    } catch {
      setSelectedTeam(DEMO_DETAIL); setIsDemo(true)
    } finally {
      setLoadingDetail(false)
    }
  }, [apiUrl, getToken])

  useEffect(() => { fetchTeams() }, [fetchTeams])

  // auto-select first team once loaded
  useEffect(() => {
    if (!loadingTeams && teams.length > 0 && !selectedTeam) {
      fetchTeamDetail(teams[0].id)
    }
  }, [loadingTeams, teams, selectedTeam, fetchTeamDetail])

  // ── actions ────────────────────────────────────────────────────────────────

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!teamName.trim()) return
    if (isDemo) {
      const created: TeamSummary = {
        id: `demo-${Date.now()}`,
        name: teamName.trim(),
        description: null,
        slug: teamName.trim().toLowerCase().replace(/\s+/g, '-'),
        ownerId: myUserId || 'demo-user',
        memberCount: 1,
        myRole: 'OWNER',
        createdAt: new Date().toISOString(),
      }
      setTeams((prev) => [...prev, created])
      setTeamName('')
      return
    }
    setCreating(true)
    setCreateError('')
    try {
      const token = await getToken()
      const res = await fetch(`${apiUrl}/api/teams`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamName.trim() }),
      })
      const data = await res.json() as { team?: TeamSummary; error?: string }
      if (!res.ok) { setCreateError(data.error || 'Failed to create team'); return }
      setTeamName('')
      await fetchTeams()
    } catch {
      setCreateError('Network error — check API connection')
    } finally {
      setCreating(false)
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!joinLink.trim()) return
    setJoining(true)
    try {
      // Extract token from link and navigate
      const token = joinLink.trim().split('/').pop()
      if (token) window.location.href = `/team/join/${token}`
    } finally {
      setJoining(false)
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTeam) return
    if (isDemo) {
      const fakeToken = Math.random().toString(36).slice(2)
      setInviteLink(`${window.location.origin}/team/join/${fakeToken}`)
      setInviteEmail('')
      return
    }
    setInviting(true)
    setInviteError('')
    try {
      const token = await getToken()
      const res = await fetch(`${apiUrl}/api/teams/${selectedTeam.id}/invite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const data = await res.json() as { inviteUrl?: string; error?: string }
      if (!res.ok) { setInviteError(data.error || 'Failed to send invite'); return }
      setInviteLink(data.inviteUrl || '')
      setInviteEmail('')
    } catch {
      setInviteError('Network error — check API connection')
    } finally {
      setInviting(false)
    }
  }

  // ── render helpers ─────────────────────────────────────────────────────────

  const hasTeam = !loadingTeams && teams.length > 0

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-white">Team</h1>
        <p className="text-gray-400 text-sm mt-0.5">Collaborate in real time on your Roblox games.</p>
      </div>

      {/* Demo notice */}
      {isDemo && (
        <div className="text-xs text-yellow-400/80 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-2.5">
          Demo mode — API unreachable. Changes won't be saved.
        </div>
      )}

      {loadingTeams ? (
        <div className="space-y-3">
          <div className="h-24 bg-[#0D1231] rounded-2xl animate-pulse" />
          <div className="h-48 bg-[#0D1231] rounded-2xl animate-pulse" />
        </div>
      ) : !hasTeam ? (

        /* ── No team: create / join ──────────────────────────────────────── */
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-8 max-w-md mx-auto text-center space-y-6">
          <div>
            <div className="w-12 h-12 rounded-full bg-[#FFB81C]/10 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[#FFB81C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-white font-semibold text-lg">Create a Team</h2>
            <p className="text-gray-400 text-sm mt-1">Collaborate with others in real time on your Roblox games.</p>
          </div>

          <form onSubmit={handleCreate} className="space-y-3 text-left">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Team name</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Brainrot Studios"
                required
                minLength={2}
                maxLength={50}
                className="w-full bg-[#111640] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#FFB81C]/40 transition-colors"
              />
            </div>
            {createError && <p className="text-red-400 text-xs">{createError}</p>}
            <button
              type="submit"
              disabled={creating || !teamName.trim()}
              className="w-full bg-[#FFB81C] hover:bg-[#E5A619] disabled:opacity-40 text-black font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              {creating ? 'Creating…' : 'Create Team'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
            <p className="relative text-center text-xs text-gray-600 bg-[#0D1231] px-3 w-fit mx-auto">or join with an invite link</p>
          </div>

          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              type="url"
              value={joinLink}
              onChange={(e) => setJoinLink(e.target.value)}
              placeholder="Paste invite link…"
              className="flex-1 bg-[#111640] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#FFB81C]/40 transition-colors"
            />
            <button
              type="submit"
              disabled={joining || !joinLink.trim()}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-40 text-gray-300 font-medium rounded-xl text-sm transition-colors whitespace-nowrap"
            >
              {joining ? '…' : 'Join'}
            </button>
          </form>
        </div>

      ) : (

        /* ── Has team ────────────────────────────────────────────────────── */
        <div className="space-y-4">

          {/* Team selector (if multiple) + header */}
          <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                {teams.length > 1 ? (
                  <select
                    className="bg-transparent text-white text-xl font-bold focus:outline-none cursor-pointer"
                    onChange={(e) => fetchTeamDetail(e.target.value)}
                    defaultValue={teams[0].id}
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id} className="bg-[#0D1231]">{t.name}</option>
                    ))}
                  </select>
                ) : (
                  <h2 className="text-xl font-bold text-white">{teams[0].name}</h2>
                )}
                {selectedTeam && (
                  <p className="text-gray-500 text-sm mt-0.5">
                    {selectedTeam.members.length} / 10 members
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => { setShowInvite((v) => !v); setInviteLink(''); setInviteError('') }}
                  className="text-xs px-3 py-1.5 bg-[#FFB81C]/10 hover:bg-[#FFB81C]/20 text-[#FFB81C] border border-[#FFB81C]/20 rounded-lg transition-colors font-medium"
                >
                  Invite Member
                </button>
                <Link
                  href="/team/settings"
                  className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg transition-colors"
                >
                  Settings
                </Link>
              </div>
            </div>

            {selectedTeam && (
              <div className="mt-4">
                <PresenceIndicator
                  teamId={selectedTeam.id}
                  currentUserId={myUserId}
                  currentUserName={myDisplayName}
                />
              </div>
            )}
          </div>

          {/* Invite panel */}
          {showInvite && selectedTeam && (
            <div className="bg-[#0D1231] border border-[#FFB81C]/20 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">Invite to {selectedTeam.name}</h3>
              <form onSubmit={handleInvite} className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="teammate@email.com (optional)"
                  className="flex-1 bg-[#111640] border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#FFB81C]/40 transition-colors"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'EDITOR' | 'VIEWER')}
                  className="bg-[#111640] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FFB81C]/40 transition-colors"
                >
                  <option value="EDITOR">Editor</option>
                  <option value="ADMIN">Admin</option>
                  <option value="VIEWER">Viewer</option>
                </select>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-2 bg-[#FFB81C] hover:bg-[#E5A619] disabled:opacity-40 text-black font-semibold rounded-xl text-sm transition-colors whitespace-nowrap"
                >
                  {inviting ? '…' : 'Generate Link'}
                </button>
              </form>
              {inviteError && <p className="text-red-400 text-xs">{inviteError}</p>}
              {inviteLink && (
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={inviteLink}
                    className="flex-1 bg-[#111640] border border-white/10 rounded-xl px-3 py-2 text-gray-400 text-xs"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(inviteLink)}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl text-xs transition-colors"
                  >
                    Copy
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Members list */}
          {loadingDetail ? (
            <div className="h-40 bg-[#0D1231] rounded-2xl animate-pulse" />
          ) : selectedTeam && (
            <div className="bg-[#0D1231] border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Members</h3>
              </div>
              <div className="divide-y divide-white/5">
                {selectedTeam.members.map((member) => {
                  const isOnline = member.userId === myUserId
                  const name = member.userId
                  return (
                    <div key={member.id} className="flex items-center justify-between px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className="w-9 h-9 rounded-full bg-[#111640] border border-white/10 flex items-center justify-center text-xs font-semibold text-gray-300">
                            {initials(name)}
                          </div>
                          {/* online dot — only for current user (real presence needs WebSocket) */}
                          {isOnline && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#0D1231]" />
                          )}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{name}</p>
                          <p className="text-gray-600 text-xs">
                            {isOnline ? 'Online' : `Joined ${new Date(member.joinedAt).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${ROLE_COLORS[member.role]}`}>
                        {ROLE_LABELS[member.role]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
