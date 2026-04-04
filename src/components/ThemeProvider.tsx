'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { THEMES, getThemeById, type Theme } from '@/lib/themes'

const STORAGE_KEY = 'forje-theme'

interface ThemeContextValue {
  theme: Theme
  setTheme: (id: string) => void
  themes: Theme[]
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: THEMES[0],
  setTheme: () => {},
  themes: THEMES,
})

export function useTheme() {
  return useContext(ThemeContext)
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value)
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(THEMES[0])

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const t = getThemeById(saved)
      setThemeState(t)
      applyTheme(t)
    }
  }, [])

  const setTheme = useCallback((id: string) => {
    const t = getThemeById(id)
    setThemeState(t)
    applyTheme(t)
    localStorage.setItem(STORAGE_KEY, id)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}
