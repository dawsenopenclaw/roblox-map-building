import { requireAuthUser } from '@/lib/clerk'
import { redirect } from 'next/navigation'
import { AdminShell } from '@/components/admin/AdminShell'

export const metadata = {
  title: 'Admin — RobloxForge',
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuthUser().catch(() => null)
  if (!user) redirect('/sign-in')
  if (user.role !== 'ADMIN') redirect('/dashboard')

  return <AdminShell user={{ id: user.id, email: user.email, role: user.role }}>{children}</AdminShell>
}
