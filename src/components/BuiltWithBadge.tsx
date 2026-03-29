import Link from 'next/link'

interface BuiltWithBadgeProps {
  variant?: 'dark' | 'light' | 'minimal'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** UTM source for tracking */
  utm?: string
}

/**
 * "Built with ForjeGames" badge for use in published games and websites.
 * Watermarks ForjeGames-generated content and drives awareness.
 */
export function BuiltWithBadge({
  variant = 'dark',
  size = 'md',
  className = '',
  utm = 'badge',
}: BuiltWithBadgeProps) {
  const href = `https://ForjeGames.com/?utm_source=${utm}&utm_medium=badge&utm_campaign=built_with`

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs gap-1.5',
    md: 'px-3.5 py-2 text-sm gap-2',
    lg: 'px-5 py-3 text-base gap-2.5',
  }

  const variantClasses = {
    dark: 'bg-[#060918] border border-white/10 text-white hover:border-[#FFB81C]/40 hover:bg-[#0D1231]',
    light: 'bg-white border border-gray-200 text-gray-900 hover:border-[#FFB81C] hover:bg-gray-50',
    minimal: 'text-gray-400 hover:text-white',
  }

  const logoSize = { sm: 14, md: 18, lg: 22 }[size]

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center rounded-xl transition-all ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      title="Built with ForjeGames — AI-powered Roblox game builder"
    >
      {/* Logo mark */}
      <svg
        width={logoSize}
        height={logoSize}
        viewBox="0 0 24 24"
        fill="none"
        className="flex-shrink-0"
        aria-hidden="true"
      >
        <rect width="24" height="24" rx="6" fill="#FFB81C" />
        <path d="M7 7h5a3 3 0 0 1 0 6H7V7z" fill="#000" />
        <rect x="7" y="15" width="4" height="2" rx="1" fill="#000" />
        <rect x="13" y="13" width="4" height="4" rx="1" fill="#000" />
      </svg>

      <span className="font-medium whitespace-nowrap">
        Built with{' '}
        <span className={variant === 'dark' ? 'text-[#FFB81C]' : 'text-[#E6A519] font-bold'}>
          ForjeGames
        </span>
      </span>
    </Link>
  )
}

/**
 * Compact icon-only version for tight spaces.
 */
export function BuiltWithIcon({ className = '' }: { className?: string }) {
  return (
    <Link
      href="https://ForjeGames.com/?utm_source=icon&utm_medium=badge&utm_campaign=built_with"
      target="_blank"
      rel="noopener noreferrer"
      title="Built with ForjeGames"
      className={`inline-flex items-center justify-center ${className}`}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-label="ForjeGames">
        <rect width="24" height="24" rx="6" fill="#FFB81C" />
        <path d="M7 7h5a3 3 0 0 1 0 6H7V7z" fill="#000" />
        <rect x="7" y="15" width="4" height="2" rx="1" fill="#000" />
        <rect x="13" y="13" width="4" height="4" rx="1" fill="#000" />
      </svg>
    </Link>
  )
}
