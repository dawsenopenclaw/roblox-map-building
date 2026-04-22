import type { Metadata } from 'next'
import { EliClient } from './EliClient'

export const metadata: Metadata = {
  title: 'ELI — ForjeGames AI Agent',
  description: 'Talk to ELI, the ForjeGames AI operations agent',
  robots: { index: false, follow: false },
}

export default function EliPage() {
  return <EliClient />
}
