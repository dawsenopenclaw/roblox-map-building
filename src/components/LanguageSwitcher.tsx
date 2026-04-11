'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Check, ChevronDown, Globe } from 'lucide-react'

import {
  LOCALE_COOKIE_NAME,
  defaultLocale,
  isLocale,
  localeFlags,
  localeNames,
  locales,
  type Locale,
} from '@/i18n/config'

interface LanguageSwitcherProps {
  /**
   * Current active locale. If omitted, the component will try to detect it
   * from the first path segment; otherwise it falls back to the default.
   */
  currentLocale?: Locale
  /** Optional Tailwind classes applied to the trigger button. */
  className?: string
  /** Render a compact flag-only button (useful in dense nav bars). */
  compact?: boolean
}

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 // 1 year

function detectLocaleFromPath(pathname: string): Locale {
  const segments = pathname.split('/').filter(Boolean)
  const first = segments[0]
  return first && isLocale(first) ? first : defaultLocale
}

function persistLocaleCookie(locale: Locale) {
  if (typeof document === 'undefined') return
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`
}

function swapLocaleInPath(pathname: string, nextLocale: Locale): string {
  const segments = pathname.split('/').filter(Boolean)
  const hasPrefix = segments.length > 0 && isLocale(segments[0])
  // next-intl is configured with `localePrefix: 'as-needed'`, so the default
  // locale (English) MUST NOT appear in the URL — `/en/pricing` 404s.
  // Strip the prefix when switching to the default locale.
  if (nextLocale === defaultLocale) {
    if (hasPrefix) segments.shift()
    return '/' + segments.join('/')
  }
  if (hasPrefix) {
    segments[0] = nextLocale
  } else {
    segments.unshift(nextLocale)
  }
  return '/' + segments.join('/')
}

export function LanguageSwitcher({
  currentLocale,
  className = '',
  compact = false,
}: LanguageSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname() || '/'
  const detected: Locale = currentLocale ?? detectLocaleFromPath(pathname)

  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const handleSelect = (next: Locale) => {
    setOpen(false)
    persistLocaleCookie(next)
    if (next === detected) return
    const nextPath = swapLocaleInPath(pathname, next)
    router.push(nextPath)
    router.refresh()
  }

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Change language (current: ${localeNames[detected]})`}
        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/90 backdrop-blur-md transition-colors hover:border-white/20 hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
      >
        {compact ? (
          <span className="text-base leading-none" aria-hidden="true">
            {localeFlags[detected]}
          </span>
        ) : (
          <>
            <Globe className="h-4 w-4 opacity-70" aria-hidden="true" />
            <span className="text-base leading-none" aria-hidden="true">
              {localeFlags[detected]}
            </span>
            <span className="font-medium">{localeNames[detected]}</span>
            <ChevronDown
              className={`h-4 w-4 opacity-70 transition-transform ${open ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </>
        )}
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select a language"
          className="absolute right-0 z-50 mt-2 max-h-[70vh] w-56 overflow-y-auto rounded-xl border border-white/10 bg-zinc-950/95 p-1 shadow-2xl shadow-black/60 backdrop-blur-xl"
        >
          {locales.map((locale) => {
            const isActive = locale === detected
            return (
              <button
                key={locale}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(locale)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  isActive
                    ? 'bg-orange-500/15 text-orange-200'
                    : 'text-white/85 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-lg leading-none" aria-hidden="true">
                  {localeFlags[locale]}
                </span>
                <span className="flex-1 truncate font-medium">{localeNames[locale]}</span>
                {isActive && (
                  <Check className="h-4 w-4 text-orange-400" aria-hidden="true" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default LanguageSwitcher
