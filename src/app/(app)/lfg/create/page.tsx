'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users, Send } from 'lucide-react'
import Link from 'next/link'

const GAME_TYPES = [
  { value: 'tycoon', label: 'Tycoon' },
  { value: 'simulator', label: 'Simulator' },
  { value: 'obby', label: 'Obby' },
  { value: 'rpg', label: 'RPG' },
  { value: 'horror', label: 'Horror' },
  { value: 'racing', label: 'Racing' },
  { value: 'survival', label: 'Survival' },
  { value: 'other', label: 'Other' },
]

const LOOKING_FOR = [
  { value: 'builders', label: 'Builders' },
  { value: 'scripters', label: 'Scripters' },
  { value: 'ui-designers', label: 'UI Designers' },
  { value: 'all-rounders', label: 'All-Rounders' },
]

export default function LfgCreatePage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [gameType, setGameType] = useState('tycoon')
  const [lookingFor, setLookingFor] = useState('builders')
  const [maxMembers, setMaxMembers] = useState(4)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/lfg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, gameType, lookingFor, maxMembers }),
      })

      if (res.ok) {
        router.push('/lfg')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to create post')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'rgb(15,18,30)' }}>
      <div className="mx-auto max-w-xl px-4 py-8">
        {/* Back link */}
        <Link
          href="/lfg"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-white"
        >
          <ArrowLeft size={14} />
          Back to groups
        </Link>

        <h1 className="mb-2 text-2xl font-bold text-white">Create LFG Post</h1>
        <p className="mb-8 text-sm text-gray-400">
          Find teammates to build with. Your post expires in 24 hours.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Building a medieval RPG — need scripters"
              maxLength={100}
              className="w-full rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-[rgb(212,175,55)]"
              style={{ background: 'rgb(25,28,45)' }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you building? What do you need help with?"
              maxLength={500}
              rows={4}
              className="w-full resize-none rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-[rgb(212,175,55)]"
              style={{ background: 'rgb(25,28,45)' }}
            />
            <p className="mt-1 text-right text-xs text-gray-600">
              {description.length}/500
            </p>
          </div>

          {/* Game Type */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Game Type
            </label>
            <select
              value={gameType}
              onChange={(e) => setGameType(e.target.value)}
              className="w-full rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-[rgb(212,175,55)]"
              style={{ background: 'rgb(25,28,45)' }}
            >
              {GAME_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Looking For */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Looking For
            </label>
            <select
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
              className="w-full rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-[rgb(212,175,55)]"
              style={{ background: 'rgb(25,28,45)' }}
            >
              {LOOKING_FOR.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Max Members */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Max Members: {maxMembers}
            </label>
            <input
              type="range"
              min={2}
              max={10}
              value={maxMembers}
              onChange={(e) => setMaxMembers(parseInt(e.target.value, 10))}
              className="w-full accent-[rgb(212,175,55)]"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-600">
              <span>2</span>
              <span>10</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: 'rgb(212,175,55)' }}
          >
            {submitting ? (
              'Creating...'
            ) : (
              <>
                <Send size={14} />
                Create Post
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
