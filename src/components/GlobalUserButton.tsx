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
      />
    </div>
  )
}
