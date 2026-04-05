import type { Metadata } from 'next'
import ConsentDeniedPage from './DeniedClient'

export const metadata: Metadata = {
  title: 'Consent Required | ForjeGames',
  description: 'Parental consent is required',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <ConsentDeniedPage />
}
