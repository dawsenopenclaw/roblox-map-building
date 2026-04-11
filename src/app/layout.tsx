import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { PostHogConsentWrapper } from '@/components/PostHogConsentWrapper'
import { SkipToContent } from '@/components/SkipToContent'
import { InstallPrompt } from '@/components/InstallPrompt'
import { OfflineIndicator } from '@/components/OfflineIndicator'
import { ToastProvider } from '@/components/ui/toast-notification'
import { ToastContainer } from '@/components/ui/ToastContainer'
import Script from 'next/script'
import { Suspense } from 'react'
import { BASE_URL, SITE_NAME, DEFAULT_DESCRIPTION, OG_IMAGE } from '@/lib/metadata'
import { SplashScreen } from '@/components/SplashScreen'
import { GlassOrbEffect } from '@/components/GlassOrbEffect'
import { ThemeProvider } from '@/components/ThemeProvider'
import { CookieBanner } from '@/components/CookieBanner'
import { GlobalShortcuts } from '@/components/GlobalShortcuts'
import { GlobalScrollReveal } from '@/components/GlobalScrollReveal'
import { ProfileButton } from '@/components/ProfileButton'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#09090b',
}

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'ForjeGames — Build Roblox Games with AI | #1 AI Roblox Game Builder',
    template: `%s — ForjeGames`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    'AI Roblox game builder',
    'Roblox AI builder',
    'build Roblox games with AI',
    'Roblox game builder',
    'Roblox map builder',
    'Roblox Studio AI plugin',
    'Roblox terrain generator',
    'Roblox script generator',
    'voice to game',
    'image to map Roblox',
    'Luau script generator',
    'Roblox asset generator',
    'AI game development',
    'Roblox Studio plugin',
    'ForjeGames',
  ],
  authors: [{ name: 'ForjeGames', url: BASE_URL }],
  creator: 'ForjeGames',
  publisher: 'ForjeGames LLC',
  category: 'technology',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: SITE_NAME,
    title: 'ForjeGames — Build Roblox Games with AI | Voice to Game, 3D Generation',
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: `${OG_IMAGE}?type=editor`,
        width: 1200,
        height: 630,
        alt: 'ForjeGames — The #1 AI Roblox Game Builder. Build terrain, scripts, and 3D assets with AI.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@forjegames',
    creator: '@forjegames',
    title: 'ForjeGames — Build Roblox Games with AI | Voice to Game, 3D Generation',
    description: DEFAULT_DESCRIPTION,
    images: [`${OG_IMAGE}?type=editor`],
  },
  verification: {
    // Add Google Search Console / Bing verification tokens here when available
    // google: 'your-token',
    // other: { 'msvalidate.01': 'your-bing-token' },
  },
  alternates: {
    canonical: BASE_URL,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'ForjeGames',
    statusBarStyle: 'black-translucent',
  },
  other: {
    'application/ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'ForjeGames',
      url: BASE_URL,
      logo: `${BASE_URL}/favicon.svg`,
      description: DEFAULT_DESCRIPTION,
      sameAs: [
        'https://twitter.com/forjegames',
        'https://discord.gg/forjegames',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'support@forjegames.com',
        contactType: 'customer support',
      },
      foundingDate: '2026',
      knowsAbout: [
        'Roblox game development',
        'AI game generation',
        'Roblox Studio plugins',
        'procedural terrain generation',
        'Luau scripting',
      ],
    }),
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Resolve the active locale + messages from the next-intl request config
  // (src/i18n/request.ts). On un-prefixed routes this is the default locale;
  // on `/es`, `/fr`, … the locale layout takes over before this provider is
  // reached. Wrapping at the root ensures `useTranslations()` works in every
  // component tree without each route group needing its own provider.
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        {/* viewport + theme-color are emitted automatically via the Next.js
            `viewport` export above; no need to duplicate them here. */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/svg+xml" sizes="32x32" href="/favicon.svg" />
        <link rel="icon" type="image/svg+xml" sizes="16x16" href="/favicon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Runs synchronously before CSS/React — locks in dark background instantly */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var d=document.documentElement;d.style.backgroundColor='#09090b';d.style.colorScheme='dark';d.setAttribute('data-loading','');})();`,
          }}
        />
        {/* Suppress all transitions during initial render — removed once hydrated */}
        <style
          dangerouslySetInnerHTML={{
            __html: `[data-loading],[data-loading] *{transition:none!important;animation-duration:0.01ms!important;}`,
          }}
        />
      </head>
      <body className="bg-background text-white antialiased font-sans" suppressHydrationWarning>
        <ClerkProvider
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/editor"
          signUpFallbackRedirectUrl="/welcome"
          afterSignOutUrl="/sign-in"
          appearance={{
            variables: {
              colorPrimary: '#D4AF37',
              colorBackground: '#111113',
              colorText: '#FAFAFA',
              colorTextSecondary: '#A1A1AA',
              colorInputBackground: '#111113',
              colorInputText: '#FAFAFA',
            },
            elements: {
              card: 'shadow-xl border border-white/10 bg-[#111113]',
              formButtonPrimary: 'bg-[#D4AF37] text-black hover:bg-[#E4C04A]',
              footerActionLink: 'text-[#D4AF37] hover:text-[#E4C04A]',
            },
          }}
        >
          {/*
            SplashScreen wraps the entire app tree INSIDE ClerkProvider so Clerk
            can initialize in the background while the splash plays — but the
            children are rendered visibility:hidden until the splash completes.

            Suspense with null fallback prevents Clerk's internal lazy auth
            boundaries from rendering any intermediate loading state that
            could produce a white flash or unstyled content.
          */}
          <NextIntlClientProvider locale={locale} messages={messages}>
            <SplashScreen>
              <Suspense fallback={null}>
                <GlassOrbEffect />
                <GlobalScrollReveal />
                <SkipToContent />
                <OfflineIndicator />
                <GlobalShortcuts />
                <ThemeProvider>
                  <ProfileButton />
                  <ToastProvider>
                    <PostHogConsentWrapper>
                      <main id="main-content">
                        {children}
                      </main>
                    </PostHogConsentWrapper>
                  </ToastProvider>
                  <InstallPrompt />
                  <CookieBanner />
                  <ToastContainer />
                </ThemeProvider>
              </Suspense>
            </SplashScreen>
          </NextIntlClientProvider>
        </ClerkProvider>
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
