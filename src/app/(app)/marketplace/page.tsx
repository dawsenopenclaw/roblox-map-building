import { redirect } from 'next/navigation'

/** Marketplace is now the Assets panel in the editor. */
export default function MarketplacePage() {
  redirect('/editor')
}
