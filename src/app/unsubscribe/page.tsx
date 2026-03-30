import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Unsubscribe — ForjeGames',
  robots: { index: false, follow: false },
}

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">Unsubscribed</h1>
        <p className="text-gray-400">You have been unsubscribed from ForjeGames marketing emails.</p>
        <p className="text-gray-500 text-sm">You will still receive important account notifications.</p>
        <a href="/" className="inline-block mt-4 text-gold hover:underline">Return to ForjeGames</a>
      </div>
    </div>
  )
}
