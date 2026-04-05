import MarketingNav from '@/components/MarketingNav'
import Footer from '@/components/Footer'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050810] flex flex-col overflow-x-hidden">
      <MarketingNav />

      {/* pt-16 offsets the fixed 64px navbar */}
      <div className="flex-1 pt-16">
        {children}
      </div>

      <Footer />
    </div>
  )
}
