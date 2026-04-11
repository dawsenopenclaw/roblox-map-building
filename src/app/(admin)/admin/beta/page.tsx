import type { Metadata } from 'next'
import BetaCodeGenerator from '@/components/admin/BetaCodeGenerator'

export const metadata: Metadata = {
  title: 'Beta invites — Admin',
  robots: { index: false, follow: false },
}

export default function AdminBetaPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-100">Beta program</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Mint, distribute, and revoke invite codes for the invite-only beta rollout.
          Toggle <code className="rounded bg-neutral-800 px-1 py-0.5 text-xs text-amber-300">BETA_REQUIRED=true</code>{' '}
          in the environment to enforce invite gating site-wide.
        </p>
      </header>
      <BetaCodeGenerator />
    </div>
  )
}
