/**
 * Roblox OAuth 2.0 — Initiate flow
 *
 * Redirects user to Roblox's OAuth authorization page.
 * After the user approves, Roblox redirects back to our callback URL.
 *
 * Docs: https://create.roblox.com/docs/cloud/open-cloud/oauth2-overview
 *
 * Required env vars:
 *   ROBLOX_CLIENT_ID     — from Roblox OAuth app credentials
 *   ROBLOX_CLIENT_SECRET — from Roblox OAuth app credentials
 *   NEXT_PUBLIC_APP_URL  — our app's base URL (for callback)
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import crypto from 'crypto'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const clientId = process.env.ROBLOX_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'Roblox OAuth not configured' }, { status: 503 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://forjegames.com'
  const redirectUri = `${baseUrl}/api/auth/roblox/callback`

  // Generate CSRF state token with userId embedded
  const state = `${userId}:${crypto.randomBytes(16).toString('hex')}`

  // PKCE code verifier + challenge
  const codeVerifier = crypto.randomBytes(32).toString('base64url')
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')

  // Store state + verifier in a short-lived cookie (5 min)
  const stateData = JSON.stringify({ state, codeVerifier })
  const cookieValue = Buffer.from(stateData).toString('base64')

  const scopes = ['openid', 'profile']
  const authUrl = new URL('https://apis.roblox.com/oauth/v1/authorize')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', scopes.join(' '))
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('code_challenge', codeChallenge)
  authUrl.searchParams.set('code_challenge_method', 'S256')

  const response = NextResponse.redirect(authUrl.toString())
  response.cookies.set('roblox_oauth_state', cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 300, // 5 minutes
    path: '/',
  })

  return response
}
