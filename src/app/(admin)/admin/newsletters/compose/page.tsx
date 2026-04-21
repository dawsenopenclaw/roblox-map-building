'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Loader2, Check } from 'lucide-react'

export default function ComposeNewsletterPage() {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      setError('Subject and body are required')
      return
    }
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), body: body.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Failed (${res.status})`)
      }
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <Check className="h-7 w-7 text-emerald-400" />
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">Newsletter sent</h1>
        <p className="text-[#B0B0B0] text-sm mb-6">Your newsletter has been queued for delivery.</p>
        <Link
          href="/admin/newsletters"
          className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:bg-[#c9a227] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Newsletters
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/newsletters"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1c1c1c] bg-[#141414] text-[#B0B0B0] hover:text-white hover:border-[#D4AF37] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-semibold text-white">Compose Newsletter</h1>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="subject" className="block text-xs text-[#B0B0B0] uppercase tracking-wider mb-1.5">
            Subject
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Weekly update: What's new in ForjeGames"
            maxLength={200}
            className="w-full px-4 py-2.5 bg-[#141414] border border-[#1c1c1c] rounded-xl text-white text-sm placeholder:text-[#555] focus:outline-none focus:border-[#D4AF37] transition-colors"
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-xs text-[#B0B0B0] uppercase tracking-wider mb-1.5">
            Body (Markdown supported)
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your newsletter content here..."
            rows={16}
            className="w-full px-4 py-3 bg-[#141414] border border-[#1c1c1c] rounded-xl text-white text-sm placeholder:text-[#555] focus:outline-none focus:border-[#D4AF37] transition-colors resize-y font-mono leading-relaxed"
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-2">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/admin/newsletters"
            className="px-4 py-2 text-sm text-[#B0B0B0] hover:text-white transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !body.trim()}
            className="flex items-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-bold text-black hover:bg-[#c9a227] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Newsletter
          </button>
        </div>
      </div>
    </div>
  )
}
