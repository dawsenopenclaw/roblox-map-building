'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { ActivityFeed } from '@/components/ActivityFeed'
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
  activities: Array<{
    id: string
    userId: string
    action: string
    description: string
    createdAt: string
  }>
}

const ROLE_COLORS = {
  OWNER:  'bg-[#FFB81C]/10 text-[#FFB81C] border-[#FFB81C]/20',
  ADMIN:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  EDITOR: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  VIEWER: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

export default function TeamPage() {
  const { getToken } = useAuth()
  const { user } = useUser()
  const [teams, setTeams] = useState<TeamSummary[]>([])
  const [selectedTeam, setSelectedTeam] = useState<TeamDetail | null>(null)
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '' })
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'EDITOR' as const })
  const [inviteLink, setInviteLink] = useState('')
  const [creating, setCreating] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState('')

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  const fetchTeams = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${apiUrl}/api/teams`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json() as { teams: TeamSummary[] }
      setTeams(data.teams)
    } finally {
      setLoadingTeams(false)
    }
  }, [apiUrl, getToken])

  const fetchTeamDetail = useCallback(async (teamId: string) => {
    setLoadingDetail(true)
    try {
      const token = await getToken()
      const res = await fetch(`${apiUrl}/api/teams/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json() as { team: TeamDetail }
      setSelectedTeam(data.team)
    } finally {
      setLoadingDetail(false)
    }
  }, [apiUrl, getToken])

  useEffect(() => { fetchTeams() }, [fetchTeams])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError('')
    try {
      const token = await getToken()
      const res = await fetch(`${apiUrl}/api/teams`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      const data = await res.json() as { team?: TeamSummary; error?: string }
      if (!res.ok) { setError(data.error || 'Failed to create team'); return }
      setShowCreate(false)
      setCreateForm({ name: '', description: '' })
      await fetchTeams()
    } catch {
      setError('Network error')
    } finally {
      setCreating(false)
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTeam) return
    setInviting(true)
    setError('')
    try {
      const token = await getToken()
      const res = await fetch(`${apiUrl}/api/teams/${selectedTeam.id}/invite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      })
      const data = await res.json() as { inviteUrl?: string; error?: string }
      if (!res.ok) { setError(data.error || 'Failed to send invite'); return }
      setInviteLink(data.inviteUrl || '')
      setInviteForm({ email: '', role: 'EDITOR' })
    } catch {
      setError('Network error')
    } finally {
      setInviting(false)
    }
  }

  const myUserId = user?.id || ''
  const myDisplayName = user?.fullName || user?.primaryEmailAddress?.emailAddress || 'You'

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Collaboration</h1>
          <p className="text-gray-400 text-sm mt-1">Build together in real time</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-[#FFB81C] hover:bg-[#E5A619] text-black font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          + New Team
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-white mb-4">Create Team</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Team Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Awesome Builders"
                  className="w-full bg-[#111640] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FFB81C]/40 transition-colors"
                  required
                  minLength={2}
                  maxLength={50}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Description (optional)</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="What are you building together?"
                  rows={3}
                  className="w-full bg-[#111640] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FFB81C]/40 transition-colors resize-none"
                  maxLength={200}
                />
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setError('') }}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 font-medium py-2.5 rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-[#FFB81C] hover:bg-[#E5A619] disabled:opacity-50 text-black font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  {creating ? 'Creating…' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teams list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Your Teams</h2>

          {loadingTeams ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-[#0D1231] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : teams.length === 0 ? (
            <div className="bg-[#0D1231] border border-dashed border-white/10 rounded-xl p-8 text-center">
              <p className="text-gray-500 text-sm">No teams yet</p>
              <p className="text-gray-600 text-xs mt-1">Create one to get started</p>
            </div>
          ) : (
            teams.map((team) => (
              <button
                key={team.id}
                onClick={() => fetchTeamDetail(team.id)}
                className={`w-full text-left bg-[#0D1231] border rounded-xl px-4 py-3 transition-colors ${
                  selectedTeam?.id === team.id ? 'border-[#FFB81C]/40' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-white text-sm font-medium truncate">{team.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${ROLE_COLORS[team.myRole]}`}>
                    {team.myRole}
                  </span>
                </div>
                <p className="text-gray-500 text-xs">
                  {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Team detail */}
        <div className="lg:col-span-2 space-y-4">
          {loadingDetail ? (
            <div className="space-y-4">
              <div className="h-32 bg-[#0D1231] rounded-2xl animate-pulse" />
              <div className="h-48 bg-[#0D1231] rounded-2xl animate-pulse" />
            </div>
          ) : selectedTeam ? (
            <>
              {/* Team header */}
              <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedTeam.name}</h2>
                    {selectedTeam.description && (
                      <p className="text-gray-400 text-sm mt-1">{selectedTeam.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href="/team/settings"
                      className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors"
                    >
                      Settings
                    </Link>
                    <Link
                      href="/team/history"
                      className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors"
                    >
                      History
                    </Link>
                  </div>
                </div>

                {/* Presence */}
                <div className="flex items-center justify-between">
                  <PresenceIndicator
                    teamId={selectedTeam.id}
                    currentUserId={myUserId}
                    currentUserName={myDisplayName}
                  />
                  <button
                    onClick={() => setShowInvite(true)}
                    className="text-xs px-3 py-1.5 bg-[#FFB81C]/10 hover:bg-[#FFB81C]/20 text-[#FFB81C] rounded-lg transition-colors border border-[#FFB81C]/20"
                  >
                    + Invite Member
                  </button>
                </div>
              </div>

              {/* Invite panel */}
              {showInvite && (
                <div className="bg-[#0D1231] border border-[#FFB81C]/20 rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-white mb-3">Invite to {selectedTeam.name}</h3>
                  <form onSubmit={handleInvite} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5">Email (optional)</label>
                        <input
                          type="email"
                          value={inviteForm.email}
                          onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                          placeholder="teammate@email.com"
                          className="w-full bg-[#111640] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FFB81C]/40 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5">Role</label>
                        <select
                          value={inviteForm.role}
                          onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value as 'ADMIN' | 'EDITOR' | 'VIEWER' }))}
                          className="w-full bg-[#111640] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FFB81C]/40 transition-colors"
                        >
                          <option value="EDITOR">Editor</option>
                          <option value="ADMIN">Admin</option>
                          <option value="VIEWER">Viewer</option>
                        </select>
                      </div>
                    </div>
                    {error && <p className="text-red-400 text-xs">{error}</p>}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setShowInvite(false); setInviteLink(''); setError('') }}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-2 rounded-xl text-sm transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={inviting}
                        className="flex-1 bg-[#FFB81C] hover:bg-[#E5A619] disabled:opacity-50 text-black font-semibold py-2 rounded-xl text-sm transition-colors"
                      >
                        {inviting ? 'Creating…' : 'Generate Link'}
                      </button>
                    </div>
                  </form>

                  {inviteLink && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <p className="text-xs text-gray-400 mb-2">Share this link:</p>
                      <div className="flex gap-2">
                        <input
                          readOnly
                          value={inviteLink}
                          className="flex-1 bg-[#111640] border border-white/10 rounded-xl px-3 py-2 text-gray-300 text-xs"
                        />
                        <button
                          onClick={() => navigator.clipboard.writeText(inviteLink)}
                          className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl text-xs transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Members list */}
              <div className="bg-[#0D1231] border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                    Members ({selectedTeam.members.length})
                  </h3>
                </div>
                <div className="divide-y divide-white/5">
                  {selectedTeam.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#111640] flex items-center justify-center text-xs text-gray-400">
                          {member.userId.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white text-sm">{member.userId.slice(0, 12)}…</p>
                          <p className="text-gray-600 text-xs">
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${ROLE_COLORS[member.role]}`}>
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity feed */}
              <div className="bg-[#0D1231] border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Activity</h3>
                </div>
                <div className="p-2">
                  <ActivityFeed
                    teamId={selectedTeam.id}
                    initialActivities={selectedTeam.activities.map((a) => ({
                      id: a.id,
                      userId: a.userId,
                      teamId: selectedTeam.id,
                      action: a.action,
                      description: a.description,
                      timestamp: new Date(a.createdAt).getTime(),
                      createdAt: a.createdAt,
                    }))}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="bg-[#0D1231] border border-dashed border-white/10 rounded-2xl p-12 text-center">
              <div className="text-4xl mb-3">👥</div>
              <p className="text-gray-400 text-sm">Select a team to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
