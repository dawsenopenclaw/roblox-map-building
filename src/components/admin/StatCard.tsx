interface StatCardProps {
  title: string
  value: string
  icon: React.ReactNode
  subtitle?: string
  trend?: { direction: 'up' | 'down'; value: string }
}

export function StatCard({ title, value, icon, subtitle, trend }: StatCardProps) {
  return (
    <div className="bg-[#141414] border border-[#1c1c1c] rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#6B7280] uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-[#6B7280] mt-1">{subtitle}</p>}
          {trend && (
            <p
              className={`text-xs font-medium mt-2 ${trend.direction === 'up' ? 'text-green-400' : 'text-red-400'}`}
            >
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value} vs last month
            </p>
          )}
        </div>
        <div className="w-10 h-10 bg-[#FFB81C]/10 rounded-lg flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      </div>
    </div>
  )
}
