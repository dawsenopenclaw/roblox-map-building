'use client'

import { useState } from 'react'

export type ApiErrorVariant =
  | 'network_error'
  | 'timeout'
  | 'rate_limited'
  | 'unauthorized'
  | 'server_error'

interface ApiErrorCardProps {
  variant: ApiErrorVariant
  onRetry?: () => Promise<void> | void
  className?: string
}

interface VariantConfig {
  icon: JSX.Element
  title: string
  description: string
  action: string
  borderColor: string
  iconBg: string
}

const VARIANTS: Record<ApiErrorVariant, VariantConfig> = {
  network_error: {
    icon: (
      <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
      </svg>
    ),
    title: 'No connection',
    description: 'Check your internet connection and try again.',
    action: 'Retry',
    borderColor: 'border-orange-500/20',
    iconBg: 'bg-orange-500/10',
  },
  timeout: {
    icon: (
      <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    title: 'Request timed out',
    description: 'The server took too long to respond. It may be under heavy load.',
    action: 'Try again',
    borderColor: 'border-yellow-500/20',
    iconBg: 'bg-yellow-500/10',
  },
  rate_limited: {
    icon: (
      <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    title: 'Slow down',
    description: "You've hit the rate limit. Wait a moment before trying again.",
    action: 'Wait & retry',
    borderColor: 'border-purple-500/20',
    iconBg: 'bg-purple-500/10',
  },
  unauthorized: {
    icon: (
      <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
    title: 'Session expired',
    description: 'Your session has expired. Sign in again to continue.',
    action: 'Sign in',
    borderColor: 'border-red-500/20',
    iconBg: 'bg-red-500/10',
  },
  server_error: {
    icon: (
      <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z" />
      </svg>
    ),
    title: 'Server error',
    description: "Something went wrong on our end. We've been notified and are investigating.",
    action: 'Retry',
    borderColor: 'border-red-500/20',
    iconBg: 'bg-red-500/10',
  },
}

export function ApiErrorCard({ variant, onRetry, className = '' }: ApiErrorCardProps) {
  const [loading, setLoading] = useState(false)
  const [autoRetry, setAutoRetry] = useState(false)
  const config = VARIANTS[variant]

  const handleRetry = async () => {
    if (!onRetry) return
    setLoading(true)
    try {
      await onRetry()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`bg-[#242424] border ${config.borderColor} rounded-2xl p-6 text-center ${className}`}
    >
      {/* Icon */}
      <div
        className={`w-12 h-12 mx-auto mb-4 rounded-full ${config.iconBg} border ${config.borderColor} flex items-center justify-center`}
      >
        {config.icon}
      </div>

      <h3 className="text-base font-semibold text-white mb-1">{config.title}</h3>
      <p className="text-gray-400 text-sm mb-5 leading-relaxed">{config.description}</p>

      {onRetry && (
        <>
          <button
            onClick={handleRetry}
            disabled={loading}
            className="bg-[#FFB81C] hover:bg-[#E6A519] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold px-5 py-2.5 rounded-xl transition-colors text-sm inline-flex items-center gap-2"
          >
            {loading && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
              </svg>
            )}
            {loading ? 'Retrying...' : config.action}
          </button>

          <label className="flex items-center justify-center gap-2 mt-4 cursor-pointer group">
            <input
              type="checkbox"
              checked={autoRetry}
              onChange={e => setAutoRetry(e.target.checked)}
              className="w-3.5 h-3.5 accent-[#FFB81C] cursor-pointer"
            />
            <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
              Auto-retry on next error
            </span>
          </label>
        </>
      )}
    </div>
  )
}
