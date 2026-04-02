'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-950 px-6 text-center">
      <p className="text-sm font-semibold" style={{ color: '#ef4444' }}>
        Something went wrong
      </p>
      <p className="max-w-sm text-sm" style={{ color: '#666' }}>
        {error.message ?? 'An unexpected error occurred.'}
      </p>
      <button
        onClick={reset}
        className="rounded-lg px-5 py-2.5 text-sm font-bold"
        style={{ background: '#D4AF37', color: '#000' }}
      >
        Try again
      </button>
    </div>
  )
}
