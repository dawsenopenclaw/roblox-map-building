import 'server-only'

import { defaultLocale, isLocale, type Locale } from './config'
import enMessages from './messages/en.json'

type Messages = typeof enMessages

/**
 * Deep-merge a partial locale bundle onto the English base so that any
 * missing keys transparently fall back to English. This keeps translators
 * unblocked — they can ship a stub with only a few keys and the rest of the
 * UI will still render.
 */
function deepMerge<T>(base: T, override: unknown): T {
  if (
    typeof base !== 'object' ||
    base === null ||
    typeof override !== 'object' ||
    override === null ||
    Array.isArray(base) ||
    Array.isArray(override)
  ) {
    return (override as T) ?? base
  }

  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) }
  for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
    if (value === undefined || value === null || value === '') continue
    if (key in result) {
      result[key] = deepMerge((result as Record<string, unknown>)[key], value)
    } else {
      result[key] = value
    }
  }
  return result as T
}

/**
 * Server-side loader for a locale bundle.
 *
 * Always starts from the English bundle and layers the target locale on top,
 * so missing keys fall back to English rather than crashing next-intl.
 */
export async function getMessages(locale: string): Promise<Messages> {
  const resolved: Locale = isLocale(locale) ? locale : defaultLocale

  if (resolved === 'en') {
    return enMessages
  }

  try {
    const localeMessages = (await import(`./messages/${resolved}.json`)).default
    return deepMerge(enMessages, localeMessages)
  } catch {
    // Bundle missing or malformed — fall back to English so the page still renders.
    return enMessages
  }
}

export type { Messages }
