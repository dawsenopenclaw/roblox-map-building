export const locales = ['en', 'es', 'pt-BR', 'fr', 'de', 'ja', 'ko', 'zh-CN', 'ru', 'it', 'ar', 'tr', 'hi'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  'pt-BR': 'Português (Brasil)',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  ko: '한국어',
  'zh-CN': '中文 (简体)',
  ru: 'Русский',
  it: 'Italiano',
  ar: 'العربية',
  tr: 'Türkçe',
  hi: 'हिन्दी',
}

/**
 * Unicode flag emojis used by the language switcher.
 * pt-BR uses the Brazilian flag; zh-CN uses the PRC flag.
 * English falls back to the UK flag — swap for US (🇺🇸) if preferred.
 */
export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  es: '🇪🇸',
  'pt-BR': '🇧🇷',
  fr: '🇫🇷',
  de: '🇩🇪',
  ja: '🇯🇵',
  ko: '🇰🇷',
  'zh-CN': '🇨🇳',
  ru: '🇷🇺',
  it: '🇮🇹',
  ar: '🇸🇦',
  tr: '🇹🇷',
  hi: '🇮🇳',
}

/** RTL locales that require dir="rtl" on the html element */
export const RTL_LOCALES = new Set<Locale>(['ar'])

export const LOCALE_COOKIE_NAME = 'forje_locale'

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}
