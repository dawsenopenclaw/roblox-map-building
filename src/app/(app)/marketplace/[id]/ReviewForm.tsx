'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ReviewForm({ templateId }: { templateId: string }) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { setError('Please select a rating'); return }
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch(`/api/marketplace/templates/${templateId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, body: body.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to submit review'); return }
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#242424] border border-[#FFB81C]/20 rounded-xl p-4 mb-6">
      <h3 className="text-sm font-medium text-white mb-3">Leave a Review</h3>

      {/* Star picker */}
      <div className="flex gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => {
          const value = i + 1
          return (
            <button
              key={i}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoveredRating(value)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none"
            >
              <svg
                className={`w-7 h-7 transition-colors ${value <= (hoveredRating || rating) ? 'text-[#FFB81C]' : 'text-gray-600'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          )
        })}
        {rating > 0 && (
          <span className="text-sm text-gray-400 ml-2 self-center">
            {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
          </span>
        )}
      </div>

      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Share your experience (optional)..."
        rows={3}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FFB81C]/50 resize-none mb-3"
      />

      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-[#FFB81C] hover:bg-[#E6A618] text-black font-semibold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-60"
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  )
}
