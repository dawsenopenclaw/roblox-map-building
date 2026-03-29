'use client'

import { useState } from 'react'
import { X, Link2, MessageCircle, Check } from 'lucide-react'

interface ShareButtonsProps {
  url: string
  text: string
  compact?: boolean
}

export function ShareButtons({ url, text, compact = false }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const encodedUrl = encodeURIComponent(url)
  const encodedText = encodeURIComponent(text)

  const twitterHref = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
  const discordText = `${text}\n${url}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for environments without clipboard API
      const el = document.createElement('textarea')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function handleDiscord() {
    // Discord doesn't have a web intent; copy to clipboard with Discord-friendly format
    navigator.clipboard.writeText(discordText).catch(() => {
      const el = document.createElement('textarea')
      el.value = discordText
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <a
          href={twitterHref}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 hover:text-blue-400 transition-all text-xs font-medium"
          title="Share on X / Twitter"
        >
          <X className="w-3 h-3" />
          <span>Share</span>
        </a>
        <button
          onClick={handleDiscord}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 hover:text-[#5865F2] transition-all text-xs font-medium"
          title="Copy for Discord"
        >
          <MessageCircle className="w-3 h-3" />
          <span>Discord</span>
        </button>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            copied
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-gray-300 hover:text-blue-400'
          }`}
          title="Copy link"
        >
          {copied ? <Check className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <a
        href={twitterHref}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-300 hover:text-blue-400 transition-all text-sm font-medium"
      >
        <X className="w-4 h-4" />
        <span>Share on X</span>
      </a>
      <button
        onClick={handleDiscord}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-[#5865F2]/10 border border-white/10 hover:border-[#5865F2]/30 text-gray-300 hover:text-[#5865F2] transition-all text-sm font-medium"
      >
        <MessageCircle className="w-4 h-4" />
        <span>Copy for Discord</span>
      </button>
      <button
        onClick={handleCopy}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
          copied
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-gray-300 hover:text-blue-400'
        }`}
      >
        {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
        <span>{copied ? 'Copied!' : 'Copy link'}</span>
      </button>
    </div>
  )
}
