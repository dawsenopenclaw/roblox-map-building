import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function OnboardingLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="h-8 w-56 rounded-xl shimmer-gold mx-auto mb-3" />
          <div className="h-4 w-72 rounded shimmer mx-auto mb-8" />
          <div className="h-12 w-full rounded-lg shimmer" />
        </div>
      </div>
    </>
  )
}
