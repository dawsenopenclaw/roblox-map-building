import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { PostHogProvider } from '@/components/PostHogProvider'
import { SkipToContent } from '@/components/SkipToContent'
import { InstallPrompt } from '@/components/InstallPrompt'
import { OfflineIndicator } from '@/components/OfflineIndicator'
import { ToastProvider } from '@/components/ui/toast-notification'
import Script from 'next/script'
import { Suspense } from 'react'
import { BASE_URL, SITE_NAME, DEFAULT_DESCRIPTION, OG_IMAGE } from '@/lib/metadata'
import { SplashScreen } from '@/components/SplashScreen'

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

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: SITE_NAME,
    template: `%s — ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    'Roblox AI',
    'Roblox map builder',
    'Roblox game development',
    'AI terrain generation',
    'Roblox Studio AI',
    'voice to game',
    'image to map',
    'Luau script generator',
    'Roblox asset generator',
  ],
  authors: [{ name: 'ForjeGames' }],
  creator: 'ForjeGames',
  publisher: 'ForjeGames LLC',
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
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'ForjeGames — AI-powered Roblox game development',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@forjegames',
    creator: '@forjegames',
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE],
  },
  verification: {
    // Add Google Search Console / Bing verification tokens here when available
    // google: 'your-token',
  },
  alternates: {
    canonical: BASE_URL,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: 'black-translucent',
  },
  other: {
    'application/ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      url: BASE_URL,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free tier available. Pro plans from $4.99/month.',
      },
      /* aggregateRating removed — no real reviews yet */
      author: {
        '@type': 'Organization',
        name: 'ForjeGames LLC',
        url: BASE_URL,
      },
    }),
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0a0a0a" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.svg" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/svg+xml" sizes="32x32" href="/favicon.svg" />
        <link rel="icon" type="image/svg+xml" sizes="16x16" href="/favicon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Runs synchronously before CSS/React — locks in dark background instantly */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var d=document.documentElement;d.style.backgroundColor='#0a0a0a';d.style.colorScheme='dark';d.setAttribute('data-loading','');})();`,
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
          signUpFallbackRedirectUrl="/onboarding"
          appearance={{
            variables: {
              colorPrimary: '#FFB81C',
              colorBackground: '#141414',
              colorText: '#ffffff',
              colorTextSecondary: '#9ca3af',
              colorInputBackground: '#141414',
              colorInputText: '#ffffff',
            },
            elements: {
              card: 'shadow-xl border border-white/10 bg-[#141414]',
              formButtonPrimary: 'bg-[#FFB81C] text-black hover:bg-[#E6A519]',
              footerActionLink: 'text-[#FFB81C] hover:text-[#E6A519]',
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
          <SplashScreen>
            <Suspense fallback={null}>
              <SkipToContent />
              <OfflineIndicator />
              <ToastProvider>
                <PostHogProvider>{children}</PostHogProvider>
              </ToastProvider>
              <InstallPrompt />
            </Suspense>
          </SplashScreen>
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
