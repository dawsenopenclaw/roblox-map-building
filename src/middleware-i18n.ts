import createMiddleware from 'next-intl/middleware'

import { defaultLocale, locales } from './i18n/config'

/**
 * Locale-aware middleware for marketing / content routes.
 *
 * Uses `as-needed` prefixing so the default locale (English) is served from
 * un-prefixed paths (`/pricing`, `/docs`) and non-default locales are served
 * from prefixed paths (`/es/pricing`, `/fr/docs`). The `forje_locale` cookie
 * set by `LanguageSwitcher` is honoured automatically by next-intl.
 *
 * NOTE: This is a dedicated helper — it is composed with the existing Clerk
 * middleware in `src/middleware.ts`. It must only run for marketing routes;
 * app / API / auth routes are handled exclusively by Clerk.
 */
export const i18nMiddleware = createMiddleware({
  locales,
  defaultLocale,
  // /en is omitted from URLs; /es is shown. Matches the behaviour the
  // LanguageSwitcher's `swapLocaleInPath` helper expects.
  localePrefix: 'as-needed',
  // Do not automatically redirect users based on Accept-Language — we honour
  // the explicit cookie set by the switcher instead, which is deterministic
  // and avoids surprising visitors who land on a shared link.
  localeDetection: false,
})

export default i18nMiddleware
