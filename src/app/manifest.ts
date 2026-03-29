import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RobloxForge — AI Roblox Game Builder',
    short_name: 'RobloxForge',
    description: 'Build Roblox games with AI. Voice-to-Game, Image-to-Map, and more.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0E27',
    theme_color: '#FFB81C',
    orientation: 'portrait-primary',
    categories: ['games', 'developer tools', 'productivity'],
    lang: 'en',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
