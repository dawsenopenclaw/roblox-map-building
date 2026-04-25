import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { isBetaRequired } from '@/lib/beta-guard'
import BetaInviteForm from '@/components/BetaInviteForm'

export const metadata: Metadata = {
  title: "You're invited — ForjeGames Beta",
  description:
    'Redeem your invite code to unlock early access to the ForjeGames AI-powered Roblox map builder.',
}

/**
 * /beta/invite — landing page for invite code redemption.
 *
 * Shown automatically after sign-up when BETA_REQUIRED=true.
 * Users who already have beta access are bounced straight to the editor.
 */
export default async function BetaInvitePage() {
  // Fast-path: if beta gating is off, send the user to the editor.
  if (!isBetaRequired()) {
    redirect('/editor')
  }

  const { userId: clerkId } = await auth()
  if (!clerkId) {
    redirect('/sign-in?redirect_url=/beta/invite')
  }

  // If the user already has beta access, there's no reason to be on this page.
  const user = await db.user
    .findUnique({
      where: { clerkId },
      select: { betaAccess: true, role: true },
    })
    .catch(() => null)

  if (user?.betaAccess || user?.role === 'ADMIN') {
    redirect('/editor')
  }

  return (
    <main className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col items-center justify-center px-4 py-12">
      {/* Glow backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute left-1/2 top-1/4 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-amber-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
          </span>
          Private Beta
        </div>
        <h1 className="mb-3 bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
          You&apos;re in!
        </h1>
        <p className="mx-auto max-w-xl text-base text-neutral-400 sm:text-lg">
          Welcome to the ForjeGames early access program. Redeem your invite code
          below to unlock the editor and claim your welcome bonus.
        </p>
      </div>

      <BetaInviteForm redirectTo="/editor" />

      {/* Benefits */}
      <section className="mt-12 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
        <BenefitCard
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          title="Priority support"
          body="Direct line to the core team. Your feedback shapes the roadmap."
        />
        <BenefitCard
          icon={
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.963a1 1 0 00.95.69h4.166c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.963c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.963a1 1 0 00-.364-1.118L2.05 9.39c-.783-.57-.38-1.81.588-1.81h4.166a1 1 0 00.95-.69l1.286-3.963z" />
            </svg>
          }
          title="500 bonus credits"
          body="Claim a welcome grant on redemption. Use them on any AI generation."
        />
        <BenefitCard
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-7a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
          title="Early features"
          body="Unreleased tools, experimental AI models, and preview drops."
        />
      </section>

      <p className="mt-10 text-center text-xs text-neutral-600">
        Codes are single-use unless marked otherwise. Lost your code?{' '}
        <a href="/help" className="text-amber-500 hover:underline">
          Contact us
        </a>
        .
      </p>
    </main>
  )
}

function BenefitCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 backdrop-blur">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
        {icon}
      </div>
      <h3 className="mb-1 text-sm font-semibold text-neutral-100">{title}</h3>
      <p className="text-xs leading-relaxed text-neutral-400">{body}</p>
    </div>
  )
}
