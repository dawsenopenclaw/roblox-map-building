/**
 * Roblox OAuth 2.0 — Callback handler
 *
 * Receives the authorization code from Roblox, exchanges it for tokens,
 * fetches user info, and links the Roblox account to the Clerk user.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://forjegames.com'

  // Handle error from Roblox
  if (error) {
    console.error('[RobloxOAuth] Error from Roblox:', error, url.searchParams.get('error_description'))
    return NextResponse.redirect(`${baseUrl}/settings/roblox?error=denied`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/settings/roblox?error=missing_params`)
  }

  // Validate state from cookie
  const cookieValue = req.cookies.get('roblox_oauth_state')?.value
  if (!cookieValue) {
    return NextResponse.redirect(`${baseUrl}/settings/roblox?error=expired`)
  }

  let stateData: { state: string; codeVerifier: string }
  try {
    stateData = JSON.parse(Buffer.from(cookieValue, 'base64').toString())
  } catch {
    return NextResponse.redirect(`${baseUrl}/settings/roblox?error=invalid_state`)
  }

  if (stateData.state !== state) {
    return NextResponse.redirect(`${baseUrl}/settings/roblox?error=state_mismatch`)
  }

  // Extract userId from state
  const clerkUserId = state.split(':')[0]
  if (!clerkUserId) {
    return NextResponse.redirect(`${baseUrl}/settings/roblox?error=no_user`)
  }

  const clientId = process.env.ROBLOX_CLIENT_ID
  const clientSecret = process.env.ROBLOX_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/settings/roblox?error=not_configured`)
  }

  const redirectUri = `${baseUrl}/api/auth/roblox/callback`

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://apis.roblox.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: stateData.codeVerifier,
      }),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text().catch(() => '')
      console.error('[RobloxOAuth] Token exchange failed:', tokenRes.status, err)
      return NextResponse.redirect(`${baseUrl}/settings/roblox?error=token_failed`)
    }

    const tokens = await tokenRes.json() as {
      access_token: string
      refresh_token?: string
      expires_in: number
      token_type: string
    }

    // Fetch user info from Roblox
    const userInfoRes = await fetch('https://apis.roblox.com/oauth/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!userInfoRes.ok) {
      console.error('[RobloxOAuth] UserInfo failed:', userInfoRes.status)
      return NextResponse.redirect(`${baseUrl}/settings/roblox?error=userinfo_failed`)
    }

    const userInfo = await userInfoRes.json() as {
      sub: string        // Roblox user ID
      name?: string      // Display name
      nickname?: string  // Username
      preferred_username?: string
      picture?: string   // Avatar URL
    }

    const robloxUserId = userInfo.sub
    const robloxUsername = userInfo.preferred_username || userInfo.nickname || userInfo.name || 'Unknown'
    const robloxDisplayName = userInfo.name || robloxUsername
    const robloxAvatarUrl = userInfo.picture || `https://www.roblox.com/headshot-thumbnail/image?userId=${robloxUserId}&width=150&height=150`

    // Check if this Roblox account is already linked to another user
    const existingLink = await db.user.findFirst({
      where: {
        robloxUserId,
        clerkId: { not: clerkUserId },
      },
    })

    if (existingLink) {
      return NextResponse.redirect(`${baseUrl}/settings/roblox?error=already_linked`)
    }

    // Link Roblox account to user
    await db.user.updateMany({
      where: { clerkId: clerkUserId },
      data: {
        robloxUserId,
        robloxUsername,
        robloxDisplayName,
        robloxAvatarUrl,
        robloxVerifiedAt: new Date(),
      },
    })

    console.log(`[RobloxOAuth] Linked Roblox user ${robloxUsername} (${robloxUserId}) to Clerk user ${clerkUserId}`)

    // Clear the state cookie
    const response = NextResponse.redirect(`${baseUrl}/settings/roblox?success=linked`)
    response.cookies.delete('roblox_oauth_state')
    return response

  } catch (err) {
    console.error('[RobloxOAuth] Unexpected error:', err)
    return NextResponse.redirect(`${baseUrl}/settings/roblox?error=unexpected`)
  }
}
