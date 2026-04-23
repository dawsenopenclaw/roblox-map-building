import type { Metadata } from 'next'
import MarketingNav from '@/components/MarketingNav'
import Footer from '@/components/Footer'
import VerifyEmailClient from './VerifyEmailClient'

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Verify your email address to activate your ForjeGames account.',
  robots: { index: false, follow: false },
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#050810] flex flex-col overflow-x-hidden">
      <MarketingNav />
      <div className="flex-1 pt-16">
        <VerifyEmailClient />
      </div>
      <Footer />
    </div>
  )
}
