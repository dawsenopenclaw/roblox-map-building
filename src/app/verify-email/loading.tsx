import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function VerifyEmailLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          {/* Mail icon with pulse rings */}
          <div className="relative mx-auto mb-6 w-24 h-24">
            <div className="w-24 h-24 rounded-full shimmer" />
          </div>

          <div className="h-8 w-52 rounded-xl shimmer-gold mx-auto mb-3" />
          <div className="h-4 w-full rounded shimmer mb-1" />
          <div className="h-4 w-4/5 rounded shimmer mx-auto mb-8" />

          {/* Resend button */}
          <div className="h-11 w-48 rounded-lg shimmer mx-auto mb-4" />
          <div className="h-4 w-32 rounded shimmer mx-auto" />
        </div>
      </div>
    </>
  )
}
