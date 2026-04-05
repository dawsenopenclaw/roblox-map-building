import OffersClient from './OffersClient'

export const metadata = {
  title: 'Custom Offers — Admin',
  robots: { index: false, follow: false },
}

export default function AdminOffersPage() {
  return <OffersClient />
}
