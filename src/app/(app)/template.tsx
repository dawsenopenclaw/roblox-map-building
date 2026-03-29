'use client'

import { PageTransition } from '@/components/PageTransition'

/**
 * App-level template — wraps every page inside the (app) route group
 * with a fade + slight Y translate transition (200ms enter, 150ms exit).
 * This file must be a Client Component because PageTransition uses
 * Framer Motion's AnimatePresence and usePathname.
 */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>
}
