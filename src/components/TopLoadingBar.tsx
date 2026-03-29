'use client'

/**
 * TopLoadingBar — a thin 2px gold progress bar that appears at the very top
 * of the viewport during Next.js route transitions / page loading states.
 *
 * Drop this into any loading.tsx to show the bar while the page suspends,
 * or import it into layout files that need a persistent loader indicator.
 *
 * The bar auto-advances to 85% then completes + fades when the component
 * unmounts (i.e. when the real page content replaces the loading state).
 */
export function TopLoadingBar() {
  return (
    <div
      className="top-loading-bar"
      role="progressbar"
      aria-label="Page loading"
      aria-valuemin={0}
      aria-valuemax={100}
    />
  )
}
