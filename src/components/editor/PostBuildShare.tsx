'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Share2, Copy, Check, Twitter, X as XIcon, MessageSquare, Upload } from 'lucide-react'

interface PostBuildShareProps {
  visible: boolean
  prompt: string
  onDismiss: () => void
}

/**
 * Compact share bar that slides up after a successful build.
 * Shows share options: copy prompt, share to Twitter/X, share to marketplace.
 * Auto-hides after 15 seconds if not interacted with.
 */
export function PostBuildShare({ visible, prompt, onDismiss }: PostBuildShareProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(onDismiss, 15_000)
    return () => clearTimeout(timer)
  }, [visible, onDismiss])

  if (!visible) return null

  const shareText = `Just built "${prompt.slice(0, 60)}${prompt.length > 60 ? '...' : ''}" with AI on @ForjeGames. Type what you want, it builds it in Roblox Studio.`
  const shareUrl = 'https://forjegames.com/editor'
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
    } catch {
      // Fallback
      const ta = document.createElement('textarea')
      ta.value = `${shareText}\n${shareUrl}`
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-[#D4AF37]/20 bg-[#141414]/95 backdrop-blur-sm shadow-2xl"
      style={{
        animation: 'slideUpShare 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes slideUpShare {
          from { opacity: 0; transform: translate(-50%, 12px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>

      <Share2 className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
      <span className="text-xs text-white/70 font-medium hidden sm:inline">Share this build</span>

      <div className="w-px h-4 bg-white/10 mx-1" />

      {/* Copy */}
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/80 hover:text-white hover:bg-white/5 transition-colors"
        title="Copy share message"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copied' : 'Copy'}
      </button>

      {/* Twitter/X */}
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/80 hover:text-white hover:bg-white/5 transition-colors"
        title="Share on X"
      >
        <Twitter className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Post</span>
      </a>

      {/* Marketplace */}
      <Link
        href="/marketplace/submit"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#D4AF37]/80 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 transition-colors"
        title="Submit to marketplace"
      >
        <Upload className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Publish</span>
      </Link>

      {/* Dismiss */}
      <button
        onClick={onDismiss}
        className="ml-1 p-1 rounded-lg text-white/30 hover:text-white/60 transition-colors"
        aria-label="Dismiss"
      >
        <XIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
