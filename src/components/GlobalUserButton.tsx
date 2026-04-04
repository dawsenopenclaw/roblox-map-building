'use client'

import { useAuth, UserButton } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'

const HIDDEN_PATHS = ['/sign-in', '/sign-up', '/onboarding']

export function GlobalUserButton() {
  const { isSignedIn, isLoaded } = useAuth()
  const pathname = usePathname()

  if (!isLoaded || !isSignedIn) return null
  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null

  return (
    <div className="fixed top-4 right-4 z-[9999]">
      <UserButton
        afterSignOutUrl="/sign-in"
        appearance={{
          elements: {
            avatarBox: '!w-9 !h-9 !ring-2 !ring-[#FFB81C]/30 hover:!ring-[#FFB81C]/60 !transition-all',
            userButtonPopoverCard: '!bg-[#111113] !border !border-white/10 !shadow-2xl',
            userButtonPopoverActionButton: '!text-zinc-300 hover:!text-white hover:!bg-white/5',
            userButtonPopoverActionButtonText: '!text-zinc-300',
            userButtonPopoverActionButtonIcon: '!text-zinc-500',
            userButtonPopoverFooter: 'hidden',
            userPreviewMainIdentifier: '!text-white',
            userPreviewSecondaryIdentifier: '!text-zinc-500',
          },
        }}
      >
        <UserButton.MenuItems>
          <UserButton.Link
            label="Settings"
            labelIcon={<SettingsIcon />}
            href="/settings"
          />
          <UserButton.Link
            label="Appearance"
            labelIcon={<PaletteIcon />}
            href="/settings?tab=appearance"
          />
          <UserButton.Link
            label="Billing"
            labelIcon={<CreditCardIcon />}
            href="/billing"
          />
          <UserButton.Link
            label="Admin Dashboard"
            labelIcon={<ChartIcon />}
            href="/admin"
          />
        </UserButton.MenuItems>
      </UserButton>
    </div>
  )
}

function SettingsIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )
}

function PaletteIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-1 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9z" />
      <circle cx="6.5" cy="11.5" r="1.5" />
      <circle cx="9.5" cy="7.5" r="1.5" />
      <circle cx="14.5" cy="7.5" r="1.5" />
      <circle cx="17.5" cy="11.5" r="1.5" />
    </svg>
  )
}

function CreditCardIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth={2} />
      <path strokeWidth={2} d="M2 10h20" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}
