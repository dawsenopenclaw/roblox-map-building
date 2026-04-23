import { Metadata } from 'next'
import { LearningClient } from './LearningClient'

export const metadata: Metadata = {
  title: 'AI Learning Dashboard — ForjeGames Admin',
}

export const dynamic = 'force-dynamic'

export default function LearningPage() {
  return <LearningClient />
}
