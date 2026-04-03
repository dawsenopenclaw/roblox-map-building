'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface JoinResult {
  message?: string
  team?: { name: string; id: string }
  error?: string
}

export default function JoinTeamPage() {
  const params = useParams<{ token: string }>()
  const token = params?.token
  const { getToken } = useAuth()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [result, setResult] = useState<JoinResult | null>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.forjegames.com'

  useEffect(() => {
    // Guard against missing token param (malformed URL)
    if (!token) {
      setResult({ error: 'Invalid invite link — no token found.' })
      setStatus('error')
      return
    }

    async function acceptInvite() {
      try {
        const authToken = await getToken()

        // If no API is configured, treat as demo acceptance
        if (!process.env.NEXT_PUBLIC_API_URL) {
          setResult({ message: 'Joined team (demo)', team: { name: 'Demo Team', id: 'demo-team-1' } })
          setStatus('success')
          setTimeout(() => router.push('/team'), 2500)
          return
        }

        const res = await fetch(`${apiUrl}/api/teams/invite/${token}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        })
        const data = await res.json() as JoinResult
        if (!res.ok) {
          setResult({ error: data.error || 'Failed to join team' })
          setStatus('error')
          return
        }
        setResult(data)
        setStatus('success')
        setTimeout(() => router.push('/team'), 2500)
      } catch {
        setResult({ error: 'Network error. Please try again.' })
        setStatus('error')
      }
    }

    acceptInvite()
  }, [token, apiUrl, getToken, router])

  return (
    <div className="max-w-md mx-auto py-20">
      <div className="bg-[#111111] border border-white/[0.08] rounded-2xl p-8 text-center">

        {status === 'loading' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#FFB81C]/10 border border-[#FFB81C]/20 mb-6">
              <svg className="w-8 h-8 text-[#FFB81C] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <p className="text-white font-bold text-lg mb-2">Joining team...</p>
            <p className="text-gray-400 text-sm">Verifying your invite link</p>
            <div className="flex justify-center gap-1.5 mt-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#FFB81C]/50 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 mb-6">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-white font-bold text-lg mb-2">{result?.message || 'You joined the team!'}</p>
            {result?.team && (
              <p className="text-gray-400 text-sm mb-4">
                Welcome to <span className="text-white font-semibold">{result.team.name}</span>
              </p>
            )}
            <p className="text-gray-600 text-xs mb-6">Redirecting to team page...</p>
            <Link
              href="/team"
              className="inline-block bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              Go to team
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-white font-bold text-lg mb-2">Could not join team</p>
            <p className="text-red-400 text-sm mb-6">{result?.error}</p>
            <Link
              href="/team"
              className="inline-block border border-[#FFB81C]/30 text-[#FFB81C] font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-[#FFB81C]/5 transition-colors"
            >
              Back to team
            </Link>
          </>
        )}

      </div>
    </div>
  )
}
