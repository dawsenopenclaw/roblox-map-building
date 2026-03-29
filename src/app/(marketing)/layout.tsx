import { MarketingNav } from '@/components/MarketingNav'
import { Footer } from '@/components/Footer'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col overflow-x-hidden">
      <MarketingNav />

      {/* pt-16 offsets the fixed 64px navbar */}
      <main id="main-content" className="flex-1 pt-16">
        {children}
      </main>

      <Footer />
    </div>
  )
}
