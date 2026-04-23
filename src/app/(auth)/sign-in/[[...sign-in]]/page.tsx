import type { Metadata } from 'next'
import SignInClient from './SignInClient'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your ForjeGames account and start building Roblox games with AI.',
  robots: { index: false, follow: false },
}

export default function SignInPage() {
  return <SignInClient />
}
