import type { Metadata } from 'next'
import ConsentDeniedPage from './DeniedClient'

export const metadata: Metadata = {
  title: 'Consent Required',
  description: 'Parental consent is required',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <ConsentDeniedPage />
}
