import { TopLoadingBar } from '@/components/TopLoadingBar'

export default function DownloadLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          {/* Badge */}
          <div className="h-7 w-36 rounded-full shimmer mx-auto mb-8" />

          {/* Icon */}
          <div className="w-24 h-24 rounded-3xl shimmer mx-auto mb-6" />

          {/* Title + sub */}
          <div className="h-9 w-64 rounded-xl shimmer-gold mx-auto mb-3" />
          <div className="h-4 w-80 rounded shimmer mx-auto mb-2" />
          <div className="h-4 w-64 rounded shimmer mx-auto mb-8" />

          {/* Download buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 w-full sm:w-36 rounded-xl shimmer" />
            ))}
          </div>

          {/* Waitlist input */}
          <div className="flex gap-2 max-w-sm mx-auto">
            <div className="h-11 flex-1 rounded-lg shimmer" />
            <div className="h-11 w-28 rounded-lg shimmer-gold flex-shrink-0" />
          </div>
        </div>
      </div>
    </>
  )
}
