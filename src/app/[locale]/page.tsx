import HomeClient from '@/app/(marketing)/HomeClient'

/**
 * Translated marketing home page.
 *
 * This re-uses the existing `HomeClient` component so translated routes show
 * the same hero, feature sections, pricing, etc. Any component inside that
 * calls `useTranslations(...)` will automatically pick up the active locale's
 * messages via the `NextIntlClientProvider` wired in `[locale]/layout.tsx`.
 */
export default function LocaleHomePage() {
  return <HomeClient />
}
