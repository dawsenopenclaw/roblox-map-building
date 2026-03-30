/**
 * Skeleton fallback shown by the Suspense boundary in (app)/layout.tsx
 * while async Server Components on each page are streaming in.
 *
 * Uses the project's dark-mode palette (bg-gray-950, gold accent).
 */
export function AppLoadingFallback() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        {/* Animated gold ring */}
        <div
          className="h-10 w-10 rounded-full border-2 border-gray-800 border-t-[#D4AF37] animate-spin"
          aria-hidden="true"
        />
        <p className="text-sm font-inter text-gray-500 select-none">Loading&hellip;</p>
      </div>
    </div>
  )
}
