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
    <div className="max-w-md mx-auto text-center py-20">
      {status === 'loading' && (
        <>
          <div className="text-4xl mb-4 animate-pulse">👥</div>
          <p className="text-white font-semibold text-lg mb-2">Joining team…</p>
          <p className="text-gray-300 text-sm">Verifying your invite link</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="text-4xl mb-4">🎉</div>
          <p className="text-white font-semibold text-lg mb-2">{result?.message || 'You joined the team!'}</p>
          {result?.team && (
            <p className="text-gray-300 text-sm mb-4">
              Welcome to <strong className="text-white">{result.team.name}</strong>
            </p>
          )}
          <p className="text-gray-500 text-xs mb-6">Redirecting to team page…</p>
          <Link href="/team" className="text-[#FFB81C] hover:underline text-sm">
            Go to team →
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="text-4xl mb-4">⚠</div>
          <p className="text-white font-semibold text-lg mb-2">Could not join team</p>
          <p className="text-red-400 text-sm mb-6">{result?.error}</p>
          <Link href="/team" className="text-[#FFB81C] hover:underline text-sm">
            ← Back to team
          </Link>
        </>
      )}
    </div>
  )
}
