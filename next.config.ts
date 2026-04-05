import type { NextConfig } from 'next'

// Content-Security-Policy directive builder.
// Keep it strict — add sources only when a real integration requires it.
// 'unsafe-inline' for style-src is required by Tailwind's runtime injection in dev;
// in production, switch to a nonce-based approach once SSR nonce support is wired up.
const isDev = process.env.NODE_ENV === 'development'

const cspDirectives = [
  // Only load scripts from our own origin and Clerk's CDN
  "default-src 'self'",
  // 'unsafe-eval' required in dev for Next.js React Fast Refresh
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://clerk.forjegames.com https://*.clerk.accounts.dev https://challenges.cloudflare.com`,
  // Styles: self + inline (Tailwind) + Google Fonts
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts
  "font-src 'self' https://fonts.gstatic.com",
  // Images: self + Clerk avatars + Roblox CDN + S3/R2 + Meshy thumbnails
  "img-src 'self' data: blob: https://img.clerk.com https://images.clerk.dev https://*.rbxcdn.com https://thumbnails.roblox.com https://*.amazonaws.com https://*.r2.dev https://assets.meshy.ai",
  // Connections: self + API calls to Anthropic, Gemini, Fal, Meshy, Stripe, Clerk + dev HMR
  `connect-src 'self' https://clerk.forjegames.com https://*.clerk.accounts.dev https://clerk-telemetry.com https://api.anthropic.com https://generativelanguage.googleapis.com https://queue.fal.run https://api.meshy.ai https://api.stripe.com https://*.ingest.sentry.io wss://*.clerk.accounts.dev${isDev ? ' ws://localhost:3000' : ''}`,
  // Frames: Stripe only (for Stripe Elements / payment UI)
  "frame-src https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com",
  // Workers: none
  "worker-src 'self' blob:",
  // Block all object/embed elements
  "object-src 'none'",
  // Block base tag overrides
  "base-uri 'self'",
  // Upgrade insecure requests in production only (breaks localhost)
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join('; ')

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Consolidated routes — redirect old pages to new locations
      { source: '/dashboard', destination: '/editor', permanent: false },
      { source: '/dashboard/:path*', destination: '/editor', permanent: false },
      { source: '/voice', destination: '/editor', permanent: false },
      { source: '/image-to-map', destination: '/editor', permanent: false },
      { source: '/billing', destination: '/settings?tab=billing', permanent: false },
      { source: '/tokens', destination: '/settings?tab=billing', permanent: false },
      // Future features — redirect to editor for now
      { source: '/game-dna', destination: '/editor', permanent: false },
      { source: '/game-dna/:path*', destination: '/editor', permanent: false },
      { source: '/marketplace', destination: '/editor', permanent: false },
      { source: '/marketplace/:path*', destination: '/editor', permanent: false },
      { source: '/achievements', destination: '/editor', permanent: false },
      { source: '/referrals', destination: '/editor', permanent: false },
      { source: '/growth', destination: '/editor', permanent: false },
      { source: '/community', destination: '/editor', permanent: false },
      { source: '/team', destination: '/settings', permanent: false },
      { source: '/team/:path*', destination: '/settings', permanent: false },
      { source: '/projects', destination: '/editor', permanent: false },
      { source: '/business', destination: '/editor', permanent: false },
      { source: '/earnings', destination: '/settings?tab=billing', permanent: false },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // microphone=(self) allows voice input feature; camera and geolocation are denied
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
          { key: 'Content-Security-Policy', value: cspDirectives },
        ],
      },
    ]
  },
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    // ESLint config references @typescript-eslint rules not installed in project.
    // Re-enable once eslint-plugin-typescript is properly configured.
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
      },
      {
        protocol: 'https',
        hostname: 'tr.rbxcdn.com',
      },
      {
        protocol: 'https',
        hostname: '*.rbxcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'thumbnails.roblox.com',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'assets.meshy.ai',
      },
    ],
  },
}

export default nextConfig
