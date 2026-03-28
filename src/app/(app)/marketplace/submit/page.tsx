'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  { value: 'GAME_TEMPLATE', label: 'Game Template' },
  { value: 'MAP_TEMPLATE', label: 'Map Template' },
  { value: 'UI_KIT', label: 'UI Kit' },
  { value: 'SCRIPT', label: 'Script' },
  { value: 'ASSET', label: 'Asset' },
  { value: 'SOUND', label: 'Sound' },
]

interface FormState {
  title: string
  description: string
  category: string
  priceCents: number
  rbxmFileUrl: string
  thumbnailUrl: string
  tags: string
  screenshots: string[]
}

export default function SubmitTemplatePage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    category: 'GAME_TEMPLATE',
    priceCents: 0,
    rbxmFileUrl: '',
    thumbnailUrl: '',
    tags: '',
    screenshots: [],
  })
  const [screenshotInput, setScreenshotInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const set = (field: keyof FormState, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }))

  function addScreenshot() {
    if (!screenshotInput.trim()) return
    if (form.screenshots.length >= 5) {
      setError('Maximum 5 screenshots allowed')
      return
    }
    set('screenshots', [...form.screenshots, screenshotInput.trim()])
    setScreenshotInput('')
    setError(null)
  }

  function removeScreenshot(i: number) {
    set('screenshots', form.screenshots.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/marketplace/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          priceCents: Math.round(form.priceCents * 100),
          rbxmFileUrl: form.rbxmFileUrl || null,
          thumbnailUrl: form.thumbnailUrl || null,
          tags: form.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
          screenshots: form.screenshots.map((url, i) => ({ url, sortOrder: i })),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to submit template')
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/marketplace'), 2000)
    } catch {
      setError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto pt-20 text-center">
        <div className="text-6xl mb-4">🚀</div>
        <h2 className="text-2xl font-bold text-white mb-2">Template submitted!</h2>
        <p className="text-gray-400">It's pending review. You'll be notified when it's approved. Redirecting...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Submit a Template</h1>
        <p className="text-gray-400 text-sm mt-1">Share your work with the RobloxForge community</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g. Medieval Castle Game Template"
            maxLength={100}
            className="w-full bg-[#0D1231] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FFB81C]/50 transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea
            required
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Describe what's included, how to use it, and what makes it special..."
            rows={5}
            className="w-full bg-[#0D1231] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FFB81C]/50 transition-colors resize-y"
          />
        </div>

        {/* Category + Price row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Category <span className="text-red-400">*</span>
            </label>
            <select
              value={form.category}
              onChange={e => set('category', e.target.value)}
              className="w-full bg-[#0D1231] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#FFB81C]/50"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Price (USD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.priceCents === 0 ? '' : form.priceCents}
                onChange={e => set('priceCents', parseFloat(e.target.value) || 0)}
                placeholder="0.00 (free)"
                className="w-full bg-[#0D1231] border border-white/10 rounded-xl pl-7 pr-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FFB81C]/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* .rbxm file URL */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            .rbxm File URL
          </label>
          <input
            type="url"
            value={form.rbxmFileUrl}
            onChange={e => set('rbxmFileUrl', e.target.value)}
            placeholder="https://..."
            className="w-full bg-[#0D1231] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FFB81C]/50 transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">Upload your .rbxm file to a CDN and paste the URL here</p>
        </div>

        {/* Thumbnail URL */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Thumbnail URL
          </label>
          <input
            type="url"
            value={form.thumbnailUrl}
            onChange={e => set('thumbnailUrl', e.target.value)}
            placeholder="https://..."
            className="w-full bg-[#0D1231] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FFB81C]/50 transition-colors"
          />
        </div>

        {/* Screenshots */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Screenshots <span className="text-gray-500">(up to 5)</span>
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="url"
              value={screenshotInput}
              onChange={e => setScreenshotInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addScreenshot())}
              placeholder="https://..."
              className="flex-1 bg-[#0D1231] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FFB81C]/50 transition-colors"
            />
            <button
              type="button"
              onClick={addScreenshot}
              disabled={form.screenshots.length >= 5}
              className="bg-white/5 border border-white/10 text-gray-300 px-4 py-2.5 rounded-xl text-sm hover:bg-white/10 transition-colors disabled:opacity-40"
            >
              Add
            </button>
          </div>
          {form.screenshots.length > 0 && (
            <div className="space-y-2">
              {form.screenshots.map((url, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                  <span className="text-xs text-gray-400 flex-1 truncate">{url}</span>
                  <button
                    type="button"
                    onClick={() => removeScreenshot(i)}
                    className="text-gray-500 hover:text-red-400 transition-colors text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Tags
          </label>
          <input
            type="text"
            value={form.tags}
            onChange={e => set('tags', e.target.value)}
            placeholder="medieval, rpg, adventure (comma-separated)"
            className="w-full bg-[#0D1231] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FFB81C]/50 transition-colors"
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-white/5 border border-white/10 text-gray-300 py-3 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-[#FFB81C] hover:bg-[#E6A618] text-black font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </form>
    </div>
  )
}
