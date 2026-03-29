import type { Metadata } from 'next'
import GameDnaReportClient from './GameDnaReportClient'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://forjegames.com'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params

  const ogUrl = new URL(`${APP_URL}/api/og`)
  ogUrl.searchParams.set('type', 'game-dna')

  // Attempt to fetch game name from the internal API for rich metadata.
  // Falls back to a generic title if unavailable (unauthenticated server context).
  let gameName = 'Game DNA Report'
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.forjegames.com'
    const res = await fetch(`${apiUrl}/api/dna/${id}`, { cache: 'no-store' })
    if (res.ok) {
      const data = (await res.json()) as { scan?: { gameName?: string | null } }
      if (data.scan?.gameName) {
        gameName = data.scan.gameName
        ogUrl.searchParams.set('name', data.scan.gameName)
      }
    }
  } catch {
    // Non-blocking — fall back to generic title
  }

  const title = `${gameName} DNA Report - ForjeGames`
  const description = `AI-powered game DNA analysis for ${gameName}. See genome breakdown, monetization score, and strategic recommendations.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogUrl.toString(), width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogUrl.toString()],
    },
  }
}

export default function GameDnaReportPage() {
  return <GameDnaReportClient />
}
