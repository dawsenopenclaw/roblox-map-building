'use client'

import { useEffect, useCallback } from 'react'
import { useEditorSettings, FONT_SIZE_MAP } from '@/app/(app)/editor/hooks/useEditorSettings'
import { getThemeById, THEMES, type Theme } from '@/lib/themes'

const LIGHT_IDS = new Set(['light', 'paper'])

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useEditorSettings()

  useEffect(() => {
    const theme = getThemeById(settings.theme)
    const root = document.documentElement
    const isLight = LIGHT_IDS.has(settings.theme)
    const px = FONT_SIZE_MAP[settings.fontSize]

    // Batch all CSS var writes into a single cssText assignment to trigger one
    // style recalculation instead of one per setProperty call.
    const entries: string[] = []

    for (const [key, val] of Object.entries(theme.vars)) {
      entries.push(`${key}:${val}`)
    }

    if (settings.accentColor) {
      entries.push(`--accent:${settings.accentColor}`)
      entries.push(`--gold:${settings.accentColor}`)
    }

    entries.push(`color-scheme:${isLight ? 'light' : 'dark'}`)
    entries.push(`--font-size-base:${px}px`)

    // cssText replaces the entire inline style block — preserve any existing
    // vars that are not part of this batch by reading current style first.
    const existing = root.getAttribute('style') ?? ''
    // Strip out vars we are about to rewrite so we don't accumulate duplicates
    const keysToStrip = new Set([
      ...Object.keys(theme.vars),
      '--accent', '--gold', 'color-scheme', '--font-size-base',
    ])
    const preserved = existing
      .split(';')
      .map((s) => s.trim())
      .filter((s) => {
        if (!s) return false
        const prop = s.split(':')[0].trim()
        return !keysToStrip.has(prop)
      })
      .join('; ')

    root.setAttribute('style', [...(preserved ? [preserved] : []), ...entries].join('; '))

    // Also set body background for full-page theming
    document.body.style.backgroundColor = theme.vars['--background'] || ''
    document.body.style.color = theme.vars['--text-primary'] || ''
  }, [settings.theme, settings.accentColor, settings.fontSize])

  return <>{children}</>
}

// ─── useTheme hook ────────────────────────────────────────────────────────────

export function useTheme() {
  const { settings, update } = useEditorSettings()

  const theme = getThemeById(settings.theme)

  const setTheme = useCallback(
    (id: string) => {
      update('theme', id)
    },
    [update],
  )

  const setAccentColor = useCallback(
    (color: string | undefined) => {
      update('accentColor', color)
    },
    [update],
  )

  return {
    theme,
    themes: THEMES,
    setTheme,
    accentColor: settings.accentColor,
    setAccentColor,
  } satisfies {
    theme: Theme
    themes: Theme[]
    setTheme: (id: string) => void
    accentColor: string | undefined
    setAccentColor: (color: string | undefined) => void
  }
}
