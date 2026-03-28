import { requireAuthUser } from '@/lib/clerk'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuthUser().catch(() => null)
  if (!user) redirect('/sign-in')
  if (user.isUnder13 && !user.parentConsentAt) redirect('/onboarding/parental-consent')
  return (
    <div className="min-h-screen bg-[#0A0E27]">
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <span className="text-[#FFB81C] font-bold text-lg">RobloxForge</span>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">{user.email}</span>
        </div>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}
