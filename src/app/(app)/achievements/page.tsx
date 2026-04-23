import type { Metadata } from 'next'
import AchievementsClient from './AchievementsClient'

export const metadata: Metadata = {
  title: 'Achievements',
  description: 'Unlock achievements and earn badges. Track your progress, complete challenges, and climb the creator leaderboard.',
  robots: { index: false, follow: false },
}

export default function AchievementsPage() {
  return <AchievementsClient />
}
