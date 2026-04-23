import type { Metadata } from 'next'
import ReferralsClient from './ReferralsClient'

export const metadata: Metadata = {
  title: 'Referrals',
  description: 'Invite friends to ForjeGames and earn account credit for every paid conversion.',
  robots: { index: false, follow: false },
}

export default function ReferralsPage() {
  return <ReferralsClient />
}
