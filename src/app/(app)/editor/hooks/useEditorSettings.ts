'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CodeStyle    = 'beginner' | 'advanced'
export type BuildScale   = 'small' | 'medium' | 'large' | 'massive'
export type EditorTheme  = string   // theme ID from themes.ts (e.g. 'default', 'light', 'midnight')
export type FontSize     = 'small' | 'medium' | 'large'
export type Language     = 'en'

export interface EditorSettings {
  // AI
  codeStyle: CodeStyle
  buildScale: BuildScale
  autoExecute: boolean
  language: Language
  // Editor
  theme: EditorTheme
  accentColor?: string    // optional user override for accent color
  fontSize: FontSize
  showLineNumbers: boolean
  soundEffects: boolean
  autoSave: boolean
  // Studio
  autoReconnect: boolean
}

const STORAGE_KEY = 'fg_editor_settings'

const DEFAULTS: EditorSettings = {
  codeStyle: 'beginner',
  buildScale: 'medium',
  autoExecute: false,
  language: 'en',
  theme: 'default',   // Forge Gold
  fontSize: 'medium',
  showLineNumbers: true,
  soundEffects: true,
  autoSave: true,
  autoReconnect: true,
}

function load(): EditorSettings {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<EditorSettings>) }
  } catch {
    return DEFAULTS
  }
}

function save(s: EditorSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    // quota exceeded or private mode — silently no-op
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useEditorSettings() {
  const [settings, setSettings] = useState<EditorSettings>(DEFAULTS)

  // Hydrate from localStorage on mount (client-only)
  useEffect(() => {
    setSettings(load())
  }, [])

  const update = useCallback(<K extends keyof EditorSettings>(
    key: K,
    value: EditorSettings[K],
  ) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value }
      save(next)
      return next
    })
  }, [])

  return { settings, update }
}

// ─── Font size map ─────────────────────────────────────────────────────────────

export const FONT_SIZE_MAP: Record<FontSize, number> = {
  small: 12,
  medium: 14,
  large: 16,
}
