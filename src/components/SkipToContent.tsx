/**
 * SkipToContent — Skip navigation link for keyboard users.
 * Renders visually hidden until focused, then jumps to #main-content.
 * Place this as the very first element inside <body>.
 * Server Component — no interactivity
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="
        sr-only focus:not-sr-only
        focus:fixed focus:top-4 focus:left-4 focus:z-[9999]
        focus:px-4 focus:py-2
        focus:bg-[#D4AF37] focus:text-black
        focus:font-semibold focus:text-sm
        focus:rounded-xl focus:shadow-lg
        focus:outline-none
        transition-none
      "
    >
      Skip to main content
    </a>
  )
}
