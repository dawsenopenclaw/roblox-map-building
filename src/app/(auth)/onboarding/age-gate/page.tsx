import type { Metadata } from 'next'
import AgeGatePage from './AgeGateClient'

export const metadata: Metadata = {
  title: 'Age Verification | ForjeGames',
  description: 'Verify your age to continue',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <AgeGatePage />
}
