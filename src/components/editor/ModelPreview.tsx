'use client'

/**
 * ModelPreview — lightweight GLB/GLTF 3D preview using React Three Fiber.
 *
 * Features:
 * - Accepts a glbUrl prop; falls back to thumbnailUrl img on error
 * - Auto-rotate orbit animation
 * - Mouse drag to orbit, scroll to zoom
 * - Dark bg matching editor theme (#080B16)
 * - Grid floor for scale reference
 * - Ambient + directional lighting for material visibility
 * - Loading spinner while model loads
 * - Error state with optional image fallback
 * - Compact mode for sidebar panels
 * - Expandable fullscreen on click (optional)
 */

import { Suspense, useRef, useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'

// ---------------------------------------------------------------------------
// Types — exported so callers can import them
// ---------------------------------------------------------------------------

export interface ModelPreviewProps {
  /** URL to a .glb or .gltf file */
  glbUrl: string
  /** Fallback image shown if GLB fails to load */
  thumbnailUrl?: string | null
  /** px — container width  (default: 100%) */
  width?: number | string
  /** px — container height (default: 200) */
  height?: number | string
  /** Whether the viewer auto-rotates when idle */
  autoRotate?: boolean
  /** Show a View 3D / View 2D toggle button */
  showToggle?: boolean
  /** If true, clicking the viewer opens it in a fullscreen modal */
  expandable?: boolean
  className?: string
}

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

function Spinner({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'mp-spin 0.9s linear infinite' }}
    >
      <style>{`@keyframes mp-spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="rgba(212,175,55,0.2)" strokeWidth="2.5"/>
      <path d="M12 2a10 10 0 0110 10" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

// ---------------------------------------------------------------------------
// 2D thumbnail fallback
// ---------------------------------------------------------------------------

function ThumbnailFallback({ src, alt = '3D model preview' }: { src: string; alt?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
    />
  )
}

// ---------------------------------------------------------------------------
// Toggle button — 3D / 2D
// ---------------------------------------------------------------------------

function ViewToggle({ is3D, onClick }: { is3D: boolean; onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      title={is3D ? 'Switch to 2D thumbnail' : 'Switch to 3D preview'}
      style={{
        position: 'absolute',
        top: 6,
        right: 6,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 7px',
        borderRadius: 4,
        background: 'rgba(0,0,0,0.55)',
        border: '1px solid rgba(212,175,55,0.35)',
        color: '#D4AF37',
        fontSize: 9,
        fontWeight: 700,
        fontFamily: 'Inter, sans-serif',
        cursor: 'pointer',
        backdropFilter: 'blur(4px)',
        transition: 'background 0.15s',
        letterSpacing: '0.03em',
      }}
    >
      {is3D ? (
        <>
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
            <rect x="1.5" y="1.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M3.5 5h3M5 3.5v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          2D
        </>
      ) : (
        <>
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
            <path d="M5 1L9 3.5V6.5L5 9L1 6.5V3.5L5 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
          3D
        </>
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Canvas — dynamically imported (no SSR) to keep the initial bundle light
// ---------------------------------------------------------------------------

const ModelCanvas = dynamic(() => import('./ModelPreviewCanvas'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner />
    </div>
  ),
})

// ---------------------------------------------------------------------------
// Fullscreen modal wrapper
// ---------------------------------------------------------------------------

function FullscreenModal({
  glbUrl,
  thumbnailUrl,
  onClose,
}: {
  glbUrl: string
  thumbnailUrl?: string | null
  onClose: () => void
}) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '80vw',
          maxWidth: 720,
          height: '70vh',
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid rgba(212,175,55,0.3)',
          position: 'relative',
        }}
      >
        <ModelCanvas glbUrl={glbUrl} thumbnailUrl={thumbnailUrl} autoRotate />
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 10,
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 6,
            color: '#fff',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 14,
          }}
          title="Close"
        >
          ×
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function ModelPreview({
  glbUrl,
  thumbnailUrl,
  width = '100%',
  height = 200,
  autoRotate = true,
  showToggle = false,
  expandable = false,
  className = '',
}: ModelPreviewProps) {
  const [show3D, setShow3D]       = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [glbFailed, setGlbFailed] = useState(false)

  const handleGlbError = useCallback(() => {
    setGlbFailed(true)
    setShow3D(false)
  }, [])

  const showingThumbnail = !show3D || glbFailed

  return (
    <>
      <div
        className={className}
        onClick={expandable && !showingThumbnail ? () => setFullscreen(true) : undefined}
        style={{
          width,
          height,
          position: 'relative',
          background: '#080B16',
          borderRadius: 'inherit',
          overflow: 'hidden',
          cursor: expandable && !showingThumbnail ? 'pointer' : 'default',
        }}
      >
        {showingThumbnail ? (
          thumbnailUrl ? (
            <ThumbnailFallback src={thumbnailUrl} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ opacity: 0.3 }}>
                <path d="M14 3L25 9V19L14 25L3 19V9L14 3Z" stroke="#D4AF37" strokeWidth="1.2" strokeLinejoin="round"/>
                <path d="M14 3V25M3 9L14 15M25 9L14 15" stroke="#D4AF37" strokeWidth="0.8" strokeOpacity="0.4"/>
              </svg>
            </div>
          )
        ) : (
          <ModelCanvas
            glbUrl={glbUrl}
            thumbnailUrl={thumbnailUrl}
            autoRotate={autoRotate}
            onError={handleGlbError}
          />
        )}

        {showToggle && (glbUrl) && (thumbnailUrl ?? true) && (
          <ViewToggle is3D={show3D && !glbFailed} onClick={() => setShow3D((v) => !v)} />
        )}

        {expandable && !showingThumbnail && (
          <div
            style={{
              position: 'absolute',
              bottom: 6,
              right: 6,
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 4,
              padding: '2px 5px',
              fontSize: 8,
              color: 'rgba(255,255,255,0.4)',
              fontFamily: 'Inter, sans-serif',
              pointerEvents: 'none',
              letterSpacing: '0.04em',
            }}
          >
            CLICK TO EXPAND
          </div>
        )}
      </div>

      {fullscreen && (
        <FullscreenModal
          glbUrl={glbUrl}
          thumbnailUrl={thumbnailUrl}
          onClose={() => setFullscreen(false)}
        />
      )}
    </>
  )
}
