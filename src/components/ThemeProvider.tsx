'use client'

import { useEffect, useCallback } from 'react'
import { useEditorSettings } from '@/app/(app)/editor/hooks/useEditorSettings'
import { getThemeById, THEMES, type Theme } from '@/lib/themes'

const LIGHT_IDS = new Set(['light', 'paper'])

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useEditorSettings()

  useEffect(() => {
    const theme = getThemeById(settings.theme)
    const root = document.documentElement

    // Apply all theme CSS vars (text, border, orb vars are now defined per-theme)
    for (const [key, val] of Object.entries(theme.vars)) {
      root.style.setProperty(key, val)
    }

    // Apply accent override if set
    if (settings.accentColor) {
      root.style.setProperty('--accent', settings.accentColor)
      root.style.setProperty('--gold', settings.accentColor)
    }

    // color-scheme for browser native inputs
    const isLight = LIGHT_IDS.has(settings.theme)
    root.style.setProperty('color-scheme', isLight ? 'light' : 'dark')
  }, [settings.theme, settings.accentColor])

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
