import { TopLoadingBar } from '@/components/TopLoadingBar'

/**
 * Marketing-section loading state.
 * Shows a centred ForjeGames logo with a gold pulse animation while
 * the marketing pages (home, pricing, docs, download) are streaming in.
 */
export default function MarketingLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        {/* ForjeGames logo mark */}
        <div className="relative flex items-center justify-center">
          {/* Outer glow ring */}
          <div
            className="absolute w-24 h-24 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,184,28,0.18) 0%, transparent 70%)',
              animation: 'logo-glow-ring 2s ease-in-out infinite',
            }}
          />

          {/* Icon square */}
          <div
            className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #1A1F45 0%, #141414 100%)',
              border: '1.5px solid rgba(255,184,28,0.35)',
              boxShadow: '0 0 0 0 rgba(255,184,28,0.4)',
              animation: 'logo-pulse 2s ease-in-out infinite',
            }}
          >
            {/* "F" lettermark */}
            <span
              className="text-2xl font-bold select-none"
              style={{ color: '#FFB81C', letterSpacing: '-0.02em' }}
            >
              F
            </span>
          </div>
        </div>

        {/* Wordmark */}
        <div style={{ animation: 'logo-fade-in 0.4s ease 0.1s both' }}>
          <span className="text-xl font-bold tracking-tight" style={{ color: '#FFB81C' }}>
            Forje
          </span>
          <span className="text-xl font-bold tracking-tight text-white">Games</span>
        </div>

        {/* Animated dots */}
        <div className="flex items-center gap-1.5" aria-label="Loading">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: '#FFB81C',
                opacity: 0.4,
                animation: `dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>

        <style>{`
          @keyframes logo-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(255,184,28,0.4),  0 0 16px rgba(255,184,28,0.1); }
            50%       { box-shadow: 0 0 0 8px rgba(255,184,28,0),  0 0 32px rgba(255,184,28,0.2); }
          }
          @keyframes logo-glow-ring {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50%       { opacity: 1;   transform: scale(1.15); }
          }
          @keyframes logo-fade-in {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes dot-bounce {
            0%, 80%, 100% { transform: translateY(0);    opacity: 0.4; }
            40%            { transform: translateY(-6px); opacity: 1; }
          }
        `}</style>
      </div>
    </>
  )
}
