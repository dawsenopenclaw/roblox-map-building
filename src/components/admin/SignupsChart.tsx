'use client'

interface DataPoint {
  date: string
  count: number
}

export function SignupsChart({ data }: { data: DataPoint[] }) {
  if (!data.length) {
    return (
      <div className="h-40 flex items-center justify-center text-[#B0B0B0] text-sm">
        No signup data
      </div>
    )
  }

  const maxVal = Math.max(...data.map((d) => d.count), 1)
  const totalSignups = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <div>
      <p className="text-xs text-[#B0B0B0] mb-4">
        Total: <span className="text-[#FFB81C] font-semibold">{totalSignups.toLocaleString()}</span>
      </p>
      <div className="flex items-end gap-1 h-40">
        {data.map((point, i) => {
          const height = (point.count / maxVal) * 100
          return (
            <div
              key={i}
              className="flex-1"
              style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}
            >
              <div
                title={`${point.date}\n${point.count} signups`}
                className="w-full rounded-t bg-blue-500/25 hover:bg-blue-500/50 transition-colors cursor-pointer"
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
