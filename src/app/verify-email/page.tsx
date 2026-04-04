import type { Metadata } from 'next'
import VerifyEmailClient from './VerifyEmailClient'

export const metadata: Metadata = {
  title: 'Verify Email | ForjeGames',
  description: 'Verify your email address to activate your ForjeGames account.',
  robots: { index: false, follow: false },
}

export default function VerifyEmailPage() {
  return <VerifyEmailClient />
}
