'use client'

import { CheckCircle, AlertCircle, XCircle } from 'lucide-react'

type HealthStatus = 'ok' | 'degraded' | 'down'

interface Health {
  api: HealthStatus
  db: HealthStatus
  redis: HealthStatus
  ai: HealthStatus
}

const STATUS_CONFIG: Record<HealthStatus, { icon: React.ReactNode; label: string; bg: string; text: string }> = {
  ok: {
    icon: <CheckCircle className="w-4 h-4 text-green-400" />,
    label: 'Operational',
    bg: 'bg-green-900/20',
    text: 'text-green-400',
  },
  degraded: {
    icon: <AlertCircle className="w-4 h-4 text-[#D4AF37]" />,
    label: 'Degraded',
    bg: 'bg-[#D4AF37]/10',
    text: 'text-[#D4AF37]',
  },
  down: {
    icon: <XCircle className="w-4 h-4 text-red-400" />,
    label: 'Down',
    bg: 'bg-red-900/20',
    text: 'text-red-400',
  },
}

const SERVICES: { key: keyof Health; label: string }[] = [
  { key: 'api', label: 'API Server' },
  { key: 'db', label: 'Database' },
  { key: 'redis', label: 'Redis Cache' },
  { key: 'ai', label: 'AI Provider' },
]

export function SystemHealth({ health }: { health: Health }) {
  return (
    <div className="space-y-3">
      {SERVICES.map(({ key, label }) => {
        const status = health[key]
        const config = STATUS_CONFIG[status]
        return (
          <div
            key={key}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${config.bg}`}
          >
            <div className="flex items-center gap-2.5">
              {config.icon}
              <span className="text-sm text-white">{label}</span>
            </div>
            <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
          </div>
        )
      })}
    </div>
  )
}
