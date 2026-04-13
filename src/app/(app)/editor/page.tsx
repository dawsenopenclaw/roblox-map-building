import type { Metadata } from 'next'
import SimplifiedEditor from './SimplifiedEditor'
import { withBetaGuard } from '@/lib/beta-guard'

export const metadata: Metadata = {
  title: 'Editor — ForjeGames',
  description: 'Build Roblox games with AI in the ForjeGames editor. Generate terrain, scripts, and assets from voice or image prompts.',
  robots: { index: false, follow: false },
}

export default async function EditorPage() {
  // When BETA_REQUIRED=true, bounce non-beta users to the invite page.
  // No-op in the default (public) deployment.
  await withBetaGuard()
  return <SimplifiedEditor />
}
