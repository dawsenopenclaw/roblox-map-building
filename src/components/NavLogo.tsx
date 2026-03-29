'use client'
import Link from 'next/link'
import { GradientText } from '@/components/ui/gradient-text'

/** Animated gradient logo for nav bars. Client component. */
export function NavLogo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="font-bold text-xl tracking-tight" aria-label="RobloxForge home">
      <GradientText>RobloxForge</GradientText>
    </Link>
  )
}
