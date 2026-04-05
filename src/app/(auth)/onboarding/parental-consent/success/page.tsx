import type { Metadata } from 'next'
import ParentalConsentSuccessPage from './SuccessClient'

export const metadata: Metadata = {
  title: 'Consent Verified | ForjeGames',
  description: 'Parental consent verified successfully',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <ParentalConsentSuccessPage />
}
