'use client'

interface DataPoint {
  date: string
  revenueCents: number
}

export function RevenueChart({ data }: { data: DataPoint[] }) {
  if (!data.length) {
    return (
      <div className="h-40 flex items-center justify-center text-[#B0B0B0] text-sm">
        No revenue data
      </div>
    )
  }

  const maxVal = Math.max(...data.map((d) => d.revenueCents), 1)
  const totalRevenue = data.reduce((sum, d) => sum + d.revenueCents, 0)

  return (
    <div>
      <p className="text-xs text-[#B0B0B0] mb-4">
        Total: <span className="text-[#FFB81C] font-semibold">${(totalRevenue / 100).toLocaleString()}</span>
      </p>
      <div className="flex items-end gap-1 h-40">
        {data.map((point, i) => {
          const height = (point.revenueCents / maxVal) * 100
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center"
              style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}
            >
              <div
                title={`${point.date}\n$${(point.revenueCents / 100).toFixed(2)}`}
                className="w-full rounded-t bg-[#FFB81C]/25 hover:bg-[#FFB81C]/50 transition-colors cursor-pointer"
                style={{ height: `${Math.max(height, 2)}%` }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex justify-between mt-2 text-xs text-[#B0B0B0]">
        <span>{data[0]?.date?.slice(5)}</span>
        <span>{data[data.length - 1]?.date?.slice(5)}</span>
      </div>
    </div>
  )
}
