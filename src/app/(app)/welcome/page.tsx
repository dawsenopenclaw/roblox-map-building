import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import WelcomeClient from './WelcomeClient'
import { hasBetaAccess, isBetaRequired } from '@/lib/beta-guard'

export const metadata: Metadata = {
  title: 'Welcome',
  description: 'Welcome to ForjeGames. Get started building AI-powered Roblox games. Complete your setup and start creating.',
  robots: { index: false, follow: false },
}

export default async function WelcomePage() {
  // Beta rollout: after Clerk sign-up we land here. If invite-only mode is on
  // and the user hasn't redeemed a code, route them to the invite page first.
  if (isBetaRequired()) {
    try {
      const { userId } = await auth()
      if (userId) {
        const allowed = await hasBetaAccess(userId)
        if (!allowed) redirect('/beta/invite')
      }
    } catch {
      // Clerk/DB unavailable — fall through and render the welcome screen.
    }
  }
  return <WelcomeClient />
}
