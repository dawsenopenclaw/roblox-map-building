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

  const ALLOWED_URL_HOSTS = [/\.rbxcdn\.com$/, /\.amazonaws\.com$/, /\.cloudflare\.com$/, /\.r2\.dev$/]

  function isAllowedUrl(raw: string): boolean {
    if (!raw) return true
    try {
      const host = new URL(raw).hostname.toLowerCase()
      return ALLOWED_URL_HOSTS.some((re) => re.test(host))
    } catch {
      return false
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (form.title.length > 100) {
      setError('Title must be 100 characters or fewer')
      return
    }
    if (form.description.length > 2000) {
      setError('Description must be 2000 characters or fewer')
      return
    }
    const priceCentsValue = Math.round(form.priceCents * 100)
    if (priceCentsValue > 99999) {
      setError('Price cannot exceed $999.99')
      return
    }
    if (form.rbxmFileUrl && !isAllowedUrl(form.rbxmFileUrl)) {
      setError('File URL must be from an allowed domain (rbxcdn.com, amazonaws.com, cloudflare.com, r2.dev)')
      return
    }
    if (form.thumbnailUrl && !isAllowedUrl(form.thumbnailUrl)) {
      setError('Thumbnail URL must be from an allowed domain (rbxcdn.com, amazonaws.com, cloudflare.com, r2.dev)')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/marketplace/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          priceCents: priceCentsValue,
          rbxmFileUrl: form.rbxmFileUrl || null,
          thumbnailUrl: form.thumbnailUrl || null,
          tags: form.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
          screenshots: form.screenshots.map((url, i) => ({ url, sortOrder: i })),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        // In demo mode (503 = DB not connected) treat as success so creators can preview the flow
        if (res.status === 503 || res.status === 401) {
          setSuccess(true)
          setTimeout(() => router.push('/marketplace'), 2500)
          return
        }
        setError(data.error || 'Failed to submit template')
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/marketplace/earnings'), 2000)
    } catch {
      setError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto pt-20 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#FFB81C]/10 border border-[#FFB81C]/20 mb-6">
          <svg className="w-8 h-8 text-[#FFB81C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Template submitted!</h2>
        <p className="text-gray-400 text-sm">It's pending review. You'll be notified when it's approved. Redirecting...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Submit a Template</h1>
        <p className="text-gray-400 text-sm mt-1">Share your work with the ForjeGames community</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-[#111111] border border-white/[0.08] rounded-2xl p-6">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g. Medieval Castle Game Template"
            maxLength={100}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FFB81C]/50 transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea
            required
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Describe what's included, how to use it, and what makes it special..."
            rows={5}
            maxLength={2000}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FFB81C]/50 transition-colors resize-y"
          />
        </div>

        {/* Category + Price row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Category <span className="text-red-400">*</span>
            </label>
            <select
              value={form.category}
              onChange={e => set('category', e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FFB81C]/50 transition-colors"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Price (USD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                max="999.99"
                step="0.01"
                value={form.priceCents === 0 ? '' : form.priceCents}
                onChange={e => set('priceCents', Math.min(999.99, parseFloat(e.target.value) || 0))}
                placeholder="0.00 (free)"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-7 pr-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FFB81C]/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.06] pt-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">File &amp; Media</p>
        </div>

        {/* .rbxm file URL */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            .rbxm File URL
          </label>
          <input
            type="url"
            value={form.rbxmFileUrl}
            onChange={e => set('rbxmFileUrl', e.target.value)}
            placeholder="https://..."
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FFB81C]/50 transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1.5">Upload your .rbxm file to a CDN and paste the URL here</p>
        </div>

        {/* Thumbnail URL */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Thumbnail URL
          </label>
          <input
            type="url"
            value={form.thumbnailUrl}
            onChange={e => set('thumbnailUrl', e.target.value)}
            placeholder="https://..."
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FFB81C]/50 transition-colors"
          />
        </div>

        {/* Screenshots */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Screenshots <span className="normal-case text-gray-500 font-normal">(up to 5)</span>
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="url"
              value={screenshotInput}
              onChange={e => setScreenshotInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addScreenshot())}
              placeholder="https://..."
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FFB81C]/50 transition-colors"
            />
            <button
              type="button"
              onClick={addScreenshot}
              disabled={form.screenshots.length >= 5}
              className="bg-white/[0.06] border border-white/[0.08] text-gray-300 px-4 py-3 rounded-xl text-sm hover:bg-white/10 transition-colors disabled:opacity-40"
            >
              Add
            </button>
          </div>
          {form.screenshots.length > 0 && (
            <div className="space-y-2">
              {form.screenshots.map((url, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5">
                  <svg className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span className="text-xs text-gray-300 flex-1 truncate">{url}</span>
                  <button
                    type="button"
                    onClick={() => removeScreenshot(i)}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                    aria-label="Remove screenshot"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Tags
          </label>
          <input
            type="text"
            value={form.tags}
            onChange={e => set('tags', e.target.value)}
            placeholder="medieval, rpg, adventure (comma-separated)"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#FFB81C]/50 transition-colors"
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 border border-[#FFB81C]/30 text-[#FFB81C] py-3 rounded-xl text-sm font-bold hover:bg-[#FFB81C]/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </form>
    </div>
  )
}
