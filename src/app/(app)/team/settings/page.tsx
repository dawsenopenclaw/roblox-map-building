'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'

interface Team {
  id: string
  name: string
  description: string | null
  slug: string
  ownerId: string
}

interface TeamSummary extends Team {
  memberCount: number
  myRole: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER'
}

interface TeamMember {
  id: string
  userId: string
  role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER'
  joinedAt: string
}

interface TeamDetail extends Team {
  members: TeamMember[]
}

const ROLE_OPTIONS = ['ADMIN', 'EDITOR', 'VIEWER'] as const
type ChangeableRole = (typeof ROLE_OPTIONS)[number]

const ROLE_COLORS = {
  OWNER:  'text-[#FFB81C]',
  ADMIN:  'text-blue-400',
  EDITOR: 'text-purple-400',
  VIEWER: 'text-gray-400',
}

// Demo data shown when API is unreachable
const DEMO_TEAMS: TeamSummary[] = [
  {
    id: 'demo-team-1',
    name: 'Map Builders',
    description: 'Main city construction crew',
    slug: 'map-builders',
    ownerId: 'demo-user',
    memberCount: 3,
    myRole: 'OWNER',
  },
]

const DEMO_DETAIL: TeamDetail = {
  id: 'demo-team-1',
  name: 'Map Builders',
  description: 'Main city construction crew',
  slug: 'map-builders',
  ownerId: 'demo-user',
  members: [
    { id: 'm1', userId: 'user_demo_owner', role: 'OWNER', joinedAt: new Date(Date.now() - 7 * 86400_000).toISOString() },
    { id: 'm2', userId: 'user_demo_alice', role: 'EDITOR', joinedAt: new Date(Date.now() - 3 * 86400_000).toISOString() },
    { id: 'm3', userId: 'user_demo_bob', role: 'VIEWER', joinedAt: new Date(Date.now() - 86400_000).toISOString() },
  ],
}

export default function TeamSettingsPage() {
  const { getToken } = useAuth()
  const [teams, setTeams] = useState<TeamSummary[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [team, setTeam] = useState<TeamDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isDemo, setIsDemo] = useState(false)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  const fetchTeams = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${apiUrl}/api/teams`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        setTeams(DEMO_TEAMS)
        setSelectedTeamId(DEMO_TEAMS[0].id)
        setIsDemo(true)
        return
      }
      const data = await res.json() as { teams: TeamSummary[] }
      const adminTeams = (data.teams ?? []).filter((t) => t.myRole === 'OWNER' || t.myRole === 'ADMIN')
      setTeams(adminTeams)
      if (adminTeams.length > 0 && !selectedTeamId) {
        setSelectedTeamId(adminTeams[0].id)
      }
    } catch {
      // API unreachable — fall back to demo
      setTeams(DEMO_TEAMS)
      setSelectedTeamId(DEMO_TEAMS[0].id)
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }, [apiUrl, getToken, selectedTeamId])

  const fetchTeamDetail = useCallback(async (teamId: string) => {
    // Demo shortcut
    if (teamId === DEMO_DETAIL.id) {
      setTeam(DEMO_DETAIL)
      return
    }
    try {
      const token = await getToken()
      const res = await fetch(`${apiUrl}/api/teams/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        setTeam(DEMO_DETAIL)
        setIsDemo(true)
        return
      }
      const data = await res.json() as { team: TeamDetail }
      setTeam(data.team)
    } catch {
      setTeam(DEMO_DETAIL)
      setIsDemo(true)
    }
  }, [apiUrl, getToken])

  useEffect(() => { fetchTeams() }, [fetchTeams])
  useEffect(() => {
    if (selectedTeamId) fetchTeamDetail(selectedTeamId)
  }, [selectedTeamId, fetchTeamDetail])

  async function handleRoleChange(memberId: string, role: ChangeableRole) {
    if (!team) return
    if (isDemo) {
      setTeam((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          members: prev.members.map((m) => m.id === memberId ? { ...m, role } : m),
        }
      })
      setSuccess(`Role updated to ${role} (demo)`)
      setTimeout(() => setSuccess(''), 3000)
      return
    }
    setUpdatingId(memberId)
    setError('')
    setSuccess('')
    try {
      const token = await getToken()
      const res = await fetch(`${apiUrl}/api/teams/${team.id}/members/${memberId}/role`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const data = await res.json() as { member?: TeamMember; error?: string }
      if (!res.ok) { setError(data.error || 'Failed to update role'); return }
      setSuccess(`Role updated to ${role}`)
      await fetchTeamDetail(team.id)
    } catch {
      setError('Network error')
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!team || !confirm('Remove this member from the team?')) return
    if (isDemo) {
      setTeam((prev) => {
        if (!prev) return prev
        return { ...prev, members: prev.members.filter((m) => m.id !== memberId) }
      })
      return
    }
    try {
      const token = await getToken()
      await fetch(`${apiUrl}/api/teams/${team.id}/members/${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      await fetchTeamDetail(team.id)
    } catch {
      setError('Network error')
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-[#242424] rounded animate-pulse" />
        <div className="h-64 bg-[#242424] rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (teams.length === 0) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <div className="text-4xl mb-4">🔑</div>
        <p className="text-gray-400 text-sm">You need to be an Owner or Admin to manage team settings.</p>
        <Link href="/editor" className="text-[#FFB81C] hover:underline text-sm mt-4 inline-block">
          ← Back to editor
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/editor" className="text-[#FFB81C] hover:underline text-sm mb-2 inline-block">
          ← Back to editor
        </Link>
        <h1 className="text-2xl font-bold text-white">Team Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage roles and permissions</p>
      </div>

      {/* Demo banner */}
      {isDemo && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs rounded-xl px-4 py-2.5">
          Demo mode — API unreachable. Changes are local only.
        </div>
      )}

      {/* Team selector */}
      {teams.length > 1 && (
        <div>
          <label className="block text-xs text-gray-400 mb-2 font-medium">Team</label>
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="bg-[#2e2e2e] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FFB81C]/40 transition-colors w-full sm:w-auto"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

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

      {/* Role management */}
      {team && (
        <div className="bg-[#242424] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
              Member Roles — {team.name}
            </h2>
          </div>

          {/* Role legend */}
          <div className="px-5 py-4 border-b border-white/5 grid grid-cols-4 gap-3">
            {[
              { role: 'OWNER', desc: 'Full control', color: 'text-[#FFB81C]' },
              { role: 'ADMIN', desc: 'Manage members', color: 'text-blue-400' },
              { role: 'EDITOR', desc: 'Edit & build', color: 'text-purple-400' },
              { role: 'VIEWER', desc: 'View only', color: 'text-gray-400' },
            ].map(({ role, desc, color }) => (
              <div key={role} className="bg-[#2e2e2e] rounded-xl p-3 text-center">
                <p className={`text-xs font-semibold ${color}`}>{role}</p>
                <p className="text-gray-600 text-xs mt-0.5">{desc}</p>
              </div>
            ))}
          </div>

          {team.members.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-gray-500 text-sm">No members yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {team.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#2e2e2e] flex items-center justify-center text-sm text-gray-400 font-medium">
                      {member.userId.slice(5, 7).toUpperCase()}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${ROLE_COLORS[member.role]}`}>
                        {member.role}
                        {member.role === 'OWNER' && ' (You)'}
                      </p>
                      <p className="text-gray-600 text-xs">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {member.role !== 'OWNER' && (
                      <>
                        <select
                          defaultValue={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value as ChangeableRole)}
                          disabled={updatingId === member.id}
                          className="bg-[#2e2e2e] border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#FFB81C]/40 transition-colors disabled:opacity-50"
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-400 hover:text-red-300 text-xs px-2 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                        >
                          Remove
                        </button>
                      </>
                    )}
                    {member.role === 'OWNER' && (
                      <span className="text-xs text-gray-600">Owner cannot be changed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Zone locking info */}
      <div className="bg-[#242424] border border-white/10 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Zone Locking
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          Editors and above can lock zones to prevent simultaneous edits. Locks expire automatically.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '🔒', label: 'Claim a zone', desc: 'Via Roblox Studio plugin' },
            { icon: '⏱', label: 'Auto-expire', desc: 'Locks clear after 30min' },
            { icon: '🔓', label: 'Manual unlock', desc: 'Owner/Admin can unlock any zone' },
          ].map((item) => (
            <div key={item.label} className="bg-[#2e2e2e] rounded-xl p-3 text-center">
              <span className="text-2xl block mb-1">{item.icon}</span>
              <p className="text-white text-xs font-medium">{item.label}</p>
              <p className="text-gray-600 text-xs mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
