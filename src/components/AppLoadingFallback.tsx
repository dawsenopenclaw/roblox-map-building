/**
 * Skeleton fallback shown by the Suspense boundary in (app)/layout.tsx
 * while async Server Components on each page are streaming in.
 *
 * Uses the project's dark-mode palette (bg-gray-950, gold accent).
 */
export function AppLoadingFallback() {
  return (
    <div
      className="flex min-h-[calc(100vh-4rem)] items-center justify-center"
      style={{ background: '#050810' }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @media (prefers-reduced-motion: no-preference) {
          @keyframes afl-fade-in {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes afl-glow-pulse {
            0%, 100% { opacity: 0.35; transform: scale(1); }
            50%       { opacity: 0.65; transform: scale(1.18); }
          }
          @keyframes afl-dot-bounce {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
            40%           { transform: translateY(-5px); opacity: 1; }
          }
          .afl-wrap   { animation: afl-fade-in 0.45s ease-out both; }
          .afl-glow   { animation: afl-glow-pulse 2s ease-in-out infinite; }
          .afl-d1     { animation: afl-dot-bounce 1.2s ease-in-out 0ms   infinite; }
          .afl-d2     { animation: afl-dot-bounce 1.2s ease-in-out 180ms infinite; }
          .afl-d3     { animation: afl-dot-bounce 1.2s ease-in-out 360ms infinite; }
        }
      ` }} />

      <div className="afl-wrap flex flex-col items-center gap-5" aria-live="polite" aria-label="Loading">
        {/* Glow halo behind logo */}
        <div style={{ position: 'relative', width: 64, height: 64 }}>
          <div
            className="afl-glow"
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: -12,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(212,175,55,0.30) 0%, transparent 70%)',
            }}
          />

          {/* Logo square — gold gradient "F" */}
          <div
            aria-hidden="true"
            style={{
              position: 'relative',
              width: 64,
              height: 64,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #FFB81C 0%, #D4AF37 55%, #A07C10 100%)',
              boxShadow: '0 0 0 1px rgba(255,184,28,0.25), 0 4px 24px rgba(212,175,55,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 800,
                fontSize: 34,
                color: '#050810',
                lineHeight: 1,
                letterSpacing: '-0.5px',
                userSelect: 'none',
              }}
            >
              F
            </span>
          </div>
        </div>

        {/* Animated dots */}
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span
            className="afl-d1"
            style={{
              display: 'inline-block',
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#D4AF37',
            }}
          />
          <span
            className="afl-d2"
            style={{
              display: 'inline-block',
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#D4AF37',
            }}
          />
          <span
            className="afl-d3"
            style={{
              display: 'inline-block',
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#D4AF37',
            }}
          />
        </div>

        <p
          className="text-sm font-inter select-none"
          style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em' }}
        >
          Loading&hellip;
        </p>
      </div>
    </div>
  )
}
