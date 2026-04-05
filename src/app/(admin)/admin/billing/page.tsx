import BillingDashboardClient from './BillingDashboardClient'

export const metadata = {
  title: 'Billing Dashboard — Admin',
  robots: { index: false, follow: false },
}

export default function AdminBillingPage() {
  return <BillingDashboardClient />
}
