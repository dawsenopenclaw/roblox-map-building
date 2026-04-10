import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'

import MarketingNav from '@/components/MarketingNav'
import Footer from '@/components/Footer'
import { locales, isLocale } from '@/i18n/config'

/**
 * Locale-aware segment layout.
 *
 * The root `src/app/layout.tsx` already wraps everything in
 * `NextIntlClientProvider` using the default locale, which means every
 * existing route continues to work as-is. This layout only takes over when a
 * visitor navigates to a translated marketing URL (e.g. `/es/pricing`), at
 * which point it ensures the correct locale's messages are loaded and
 * provided to any client components nested underneath.
 */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

interface LocaleLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params

  if (!isLocale(locale)) {
    notFound()
  }

  // `getMessages` reads the locale from the request config (src/i18n/request.ts)
  // which has already resolved it from the URL segment at this point.
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {/* Mirror the structure of `(marketing)/layout.tsx` so translated routes
          share the same nav + footer chrome as the default-locale site. */}
      <div className="min-h-screen bg-[#050810] flex flex-col overflow-x-hidden">
        <MarketingNav />
        <div className="flex-1 pt-16 page-fade-in">{children}</div>
        <Footer />
      </div>
    </NextIntlClientProvider>
  )
}
