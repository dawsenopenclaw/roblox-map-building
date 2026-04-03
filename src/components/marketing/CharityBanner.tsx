import Link from 'next/link'

export default function CharityBanner() {
  return (
    <div
      style={{
        background: 'linear-gradient(to right, rgba(255,184,28,0.03), transparent, rgba(255,184,28,0.03))',
        borderTop: '1px solid rgba(255,184,28,0.08)',
        borderBottom: '1px solid rgba(255,184,28,0.08)',
      }}
    >
      <div
        className="max-w-4xl mx-auto py-6 px-6 flex items-center justify-center gap-3"
      >
        {/* Heart icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          style={{ flexShrink: 0 }}
        >
          <path
            d="M10 17.5s-7.5-4.74-7.5-9.38A4.38 4.38 0 0 1 10 4.64a4.38 4.38 0 0 1 7.5 3.48C17.5 12.76 10 17.5 10 17.5Z"
            fill="#FFB81C"
            opacity="0.9"
          />
        </svg>

        <p className="text-sm text-center" style={{ color: '#8B95B0' }}>
          10% of every payment supports education charities teaching kids to code.{' '}
          <Link
            href="/pricing"
            className="font-medium transition-opacity hover:opacity-80"
            style={{ color: '#FFB81C' }}
          >
            Learn more
          </Link>
        </p>
      </div>
    </div>
  )
}
