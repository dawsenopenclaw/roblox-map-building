import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function SignInLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-sm w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="h-8 w-36 rounded-xl shimmer-gold mx-auto mb-2" />
            <div className="h-4 w-44 rounded shimmer mx-auto" />
          </div>

          {/* Clerk card skeleton */}
          <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 space-y-4">
            {/* Social buttons */}
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-11 w-full rounded-lg shimmer" />
            ))}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <div className="h-3 w-6 rounded shimmer" />
              <div className="flex-1 h-px bg-white/10" />
            </div>
            {/* Email + password fields */}
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-3 w-16 rounded shimmer" />
                <div className="h-11 w-full rounded-lg shimmer" />
              </div>
            ))}
            <div className="h-11 w-full rounded-lg shimmer-gold" />
          </div>

          <div className="mt-4 text-center">
            <div className="h-4 w-40 rounded shimmer mx-auto" />
          </div>
        </div>
      </div>
    </>
  )
}
