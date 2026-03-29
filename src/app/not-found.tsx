import type { Metadata } from 'next'
import NotFoundClient from './NotFoundClient'

export const metadata: Metadata = {
  title: 'Page Not Found — ForjeGames',
  description: 'The page you are looking for does not exist. Return to the ForjeGames dashboard or use the search to find what you need.',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return <NotFoundClient />
}
