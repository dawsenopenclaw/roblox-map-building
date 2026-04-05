import type { Metadata } from 'next'
import OnboardingWizardPage from './OnboardingClient'

export const metadata: Metadata = {
  title: 'Get Started | ForjeGames',
  description: 'Set up your ForjeGames account',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <OnboardingWizardPage />
}
