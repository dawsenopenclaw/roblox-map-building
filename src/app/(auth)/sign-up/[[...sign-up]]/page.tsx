import type { Metadata } from 'next'
import SignUpClient from './SignUpClient'

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create a free ForjeGames account and build Roblox games with AI in minutes.',
  robots: { index: false, follow: false },
}

export default function SignUpPage() {
  return <SignUpClient />
}
