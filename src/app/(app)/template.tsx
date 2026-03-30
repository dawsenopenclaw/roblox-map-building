'use client'

import { PageTransition } from '@/components/PageTransition'

/**
 * App-level template — wraps every page inside the (app) route group.
 * Next.js remounts this component on every navigation, which is exactly
 * what PageTransition relies on to detect first-render vs navigation.
 *
 * Transition: 200ms fade + 8px slide-up, GPU-only (opacity + transform).
 * Initial page load: instant — no animation, no flash.
 */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>
}
