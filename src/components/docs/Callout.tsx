import type { ReactNode } from 'react'
import { Info, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react'

type CalloutVariant = 'info' | 'warning' | 'error' | 'success'

interface CalloutProps {
  variant?: CalloutVariant
  title?: string
  children: ReactNode
}

const VARIANTS: Record<
  CalloutVariant,
  {
    icon: typeof Info
    borderColor: string
    bgColor: string
    iconColor: string
    titleColor: string
  }
> = {
  info: {
    icon: Info,
    borderColor: 'border-sky-500/30',
    bgColor: 'bg-sky-500/[0.06]',
    iconColor: 'text-sky-400',
    titleColor: 'text-sky-300',
  },
  warning: {
    icon: AlertTriangle,
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/[0.06]',
    iconColor: 'text-amber-400',
    titleColor: 'text-amber-300',
  },
  error: {
    icon: XCircle,
    borderColor: 'border-rose-500/30',
    bgColor: 'bg-rose-500/[0.06]',
    iconColor: 'text-rose-400',
    titleColor: 'text-rose-300',
  },
  success: {
    icon: CheckCircle2,
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/[0.06]',
    iconColor: 'text-emerald-400',
    titleColor: 'text-emerald-300',
  },
}

const DEFAULT_TITLES: Record<CalloutVariant, string> = {
  info: 'Note',
  warning: 'Warning',
  error: 'Error',
  success: 'Success',
}

export default function Callout({
  variant = 'info',
  title,
  children,
}: CalloutProps) {
  const cfg = VARIANTS[variant]
  const Icon = cfg.icon
  const resolvedTitle = title ?? DEFAULT_TITLES[variant]

  return (
    <div
      className={`my-6 flex gap-3 rounded-xl border ${cfg.borderColor} ${cfg.bgColor} px-4 py-4`}
      role={variant === 'error' || variant === 'warning' ? 'alert' : 'note'}
    >
      <Icon size={18} className={`${cfg.iconColor} mt-0.5 flex-shrink-0`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <div className={`mb-1 text-sm font-semibold ${cfg.titleColor}`}>
          {resolvedTitle}
        </div>
        <div className="text-sm leading-relaxed text-white/70 [&>p]:m-0 [&>p+p]:mt-2 [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[12px] [&_code]:text-white/85 [&_a]:text-[#D4AF37] [&_a]:underline">
          {children}
        </div>
      </div>
    </div>
  )
}
