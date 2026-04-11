import type { Metadata } from 'next'
import MarketingNav from '@/components/MarketingNav'
import Footer from '@/components/Footer'
import UnsubscribeClient from './UnsubscribeClient'

export const metadata: Metadata = {
  title: 'Unsubscribe | ForjeGames',
  description: 'Unsubscribe from ForjeGames marketing emails.',
  robots: { index: false, follow: false },
}

export default function UnsubscribePage() {
  // Wraps the client in the same MarketingNav + Footer shell the rest of
  // the site uses so users arriving from an email can navigate back.
  return (
    <div className="min-h-screen bg-[#050810] flex flex-col overflow-x-hidden">
      <MarketingNav />
      <div className="flex-1 pt-16">
        <UnsubscribeClient />
      </div>
      <Footer />
    </div>
  )
}
