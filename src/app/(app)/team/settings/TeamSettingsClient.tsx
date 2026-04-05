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
  myRole: 'OWNER' | 'ADMIN' | 'DEVELOPER' | 'VIEWER'
}

interface TeamMember {
  id: string
  userId: string
  role: 'OWNER' | 'ADMIN' | 'DEVELOPER' | 'VIEWER'
  joinedAt: string
}

interface TeamDetail extends Team {
  members: TeamMember[]
}

const ROLE_OPTIONS = ['ADMIN', 'DEVELOPER', 'VIEWER'] as const
type ChangeableRole = (typeof ROLE_OPTIONS)[number]

const ROLE_COLORS = {
  OWNER:     'text-[#D4AF37]',
  ADMIN:     'text-blue-400',
  DEVELOPER: 'text-purple-400',
  VIEWER:    'text-gray-300',
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
    { id: 'm1', userId: 'user_demo_owner', role: 'OWNER',     joinedAt: new Date(Date.now() - 7 * 86400_000).toISOString() },
    { id: 'm2', userId: 'user_demo_alice', role: 'DEVELOPER', joinedAt: new Date(Date.now() - 3 * 86400_000).toISOString() },
    { id: 'm3', userId: 'user_demo_bob',   role: 'VIEWER',    joinedAt: new Date(Date.now() - 86400_000).toISOString() },
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

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.forjegames.com'

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
        <div className="h-8 w-48 bg-[#141414] rounded animate-pulse" />
        <div className="h-64 bg-[#141414] rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (teams.length === 0) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 border border-white/10 mb-4">
          <svg className="w-7 h-7 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
        </div>
        <p className="text-white font-semibold text-base mb-2">No team yet</p>
        <p className="text-gray-400 text-sm mb-6">
          You don&apos;t belong to any team as an Owner or Admin.<br />
          Create a team to invite collaborators and manage roles.
        </p>
        <Link
          href="/team/create"
          className="inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#E5A619] text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create a team
        </Link>
        <div>
          <Link href="/team" className="text-[#D4AF37] hover:underline text-sm inline-block">
            ← Back to team
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/team" className="text-[#D4AF37] hover:underline text-sm mb-2 inline-block">
          ← Back to team
        </Link>
        <h1 className="text-2xl font-bold text-white">Team Settings</h1>
        <p className="text-gray-300 text-sm mt-1">Manage roles and permissions</p>
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
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Team</label>
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-colors w-full sm:w-auto"
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
        <div className="bg-[#141414] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
              Member Roles — {team.name}
            </h2>
          </div>

          {/* Role legend */}
          <div className="px-5 py-4 border-b border-white/5 grid grid-cols-4 gap-3">
            {[
              { role: 'OWNER',     desc: 'Full control',   color: 'text-[#D4AF37]' },
              { role: 'ADMIN',     desc: 'Manage members', color: 'text-blue-400' },
              { role: 'DEVELOPER', desc: 'Edit & build',   color: 'text-purple-400' },
              { role: 'VIEWER',    desc: 'View only',      color: 'text-gray-300' },
            ].map(({ role, desc, color }) => (
              <div key={role} className="bg-[#1c1c1c] rounded-xl p-3 text-center">
                <p className={`text-xs font-semibold ${color}`}>{role}</p>
                <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
              </div>
            ))}
          </div>

          {team.members.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-gray-400 text-sm">No members yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {team.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#1c1c1c] flex items-center justify-center text-sm text-gray-300 font-medium">
                      {member.userId.slice(5, 7).toUpperCase()}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${ROLE_COLORS[member.role]}`}>
                        {member.role}
                        {member.role === 'OWNER' && ' (You)'}
                      </p>
                      <p className="text-gray-500 text-xs">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {member.role !== 'OWNER' && (
                      <>
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value as ChangeableRole)}
                          disabled={updatingId === member.id}
                          className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]/50 transition-colors disabled:opacity-50"
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
                      <span className="text-xs text-gray-500">Owner cannot be changed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Zone locking info */}
      <div className="bg-[#141414] border border-white/10 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-3">
          Zone Locking
        </h2>
        <p className="text-gray-300 text-sm mb-4">
          Editors and above can lock zones to prevent simultaneous edits. Locks expire automatically.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              icon: (
                <svg className="w-5 h-5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              ),
              label: 'Claim a zone', desc: 'Via Roblox Studio plugin',
            },
            {
              icon: (
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              label: 'Auto-expire', desc: 'Locks clear after 30min',
            },
            {
              icon: (
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              ),
              label: 'Manual unlock', desc: 'Owner/Admin can unlock any zone',
            },
          ].map((item) => (
            <div key={item.label} className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 text-center">
              <div className="flex justify-center mb-2">{item.icon}</div>
              <p className="text-white text-xs font-medium">{item.label}</p>
              <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
