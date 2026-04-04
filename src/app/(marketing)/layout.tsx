import MarketingNav from '@/components/MarketingNav'
import Footer from '@/components/Footer'
import NotificationBell from '@/components/marketing/NotificationBell'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050810] flex flex-col overflow-x-hidden">
      <MarketingNav />

      {/* pt-16 offsets the fixed 64px navbar */}
      <main id="main-content" className="flex-1 pt-16">
        {children}
      </main>

      <Footer />

      {/* Floating push notification bell — fixed bottom-right, always accessible */}
      <NotificationBell />
    </div>
  )
}
