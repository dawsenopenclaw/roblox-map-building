'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

const LS_KEY = 'forje-first-build-celebrated'

interface FirstBuildModalProps {
  /** True when a build has just succeeded */
  buildJustSucceeded: boolean
  /** Called when the user dismisses the modal */
  onDismiss: () => void
}

/**
 * "First build success" upgrade modal.
 *
 * Shows once ever (localStorage gated) for free-tier users after their first
 * successful AI build lands in Studio. The goal is conversion — strike while
 * they are pumped about their build.
 */
export function FirstBuildModal({ buildJustSucceeded, onDismiss }: FirstBuildModalProps) {
  const [visible, setVisible] = useState(false)
  const [tier, setTier] = useState<string | null>(null)
  const [tierLoaded, setTierLoaded] = useState(false)

  // Fetch the user's current tier once on mount
  useEffect(() => {
    let cancelled = false
    fetch('/api/billing/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.tier) {
          setTier(data.tier)
        }
        if (!cancelled) setTierLoaded(true)
      })
      .catch(() => {
        if (!cancelled) setTierLoaded(true)
      })
    return () => { cancelled = true }
  }, [])

  // Decide whether to show the modal when a build succeeds
  useEffect(() => {
    if (!buildJustSucceeded || !tierLoaded) return

    // Only show for free-tier users
    const isFree = !tier || tier === 'FREE' || tier === 'free'
    if (!isFree) return

    // Only show once ever
    try {
      if (typeof window !== 'undefined' && localStorage.getItem(LS_KEY)) return
    } catch {
      return
    }

    // Mark as shown
    try { localStorage.setItem(LS_KEY, '1') } catch { /* noop */ }

    // Small delay so the build-success toast can land first
    const timer = setTimeout(() => setVisible(true), 1200)
    return () => clearTimeout(timer)
  }, [buildJustSucceeded, tier, tierLoaded])

  const dismiss = useCallback(() => {
    setVisible(false)
    onDismiss()
  }, [onDismiss])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="first-build-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={dismiss}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(6px)',
            padding: 20,
          }}
        >
          <motion.div
            key="first-build-card"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 420,
              background: '#141414',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderRadius: 16,
              padding: '36px 32px 28px',
              boxShadow:
                '0 0 40px rgba(212, 175, 55, 0.12), 0 0 80px rgba(212, 175, 55, 0.06), 0 24px 48px rgba(0, 0, 0, 0.5)',
              textAlign: 'center',
            }}
          >
            {/* Gold accent line at top */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60%',
                height: 2,
                background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
                borderRadius: '0 0 2px 2px',
              }}
            />

            {/* Heading */}
            <h2
              style={{
                margin: '0 0 12px',
                fontSize: 22,
                fontWeight: 700,
                color: '#FAFAFA',
                lineHeight: 1.3,
                letterSpacing: '-0.01em',
              }}
            >
              Nice. Your first build just landed in Studio.
            </h2>

            {/* Subtext */}
            <p
              style={{
                margin: '0 0 28px',
                fontSize: 14,
                lineHeight: 1.6,
                color: '#A1A1AA',
              }}
            >
              You have got 9 more free builds today. Upgrade to never run out
              — plus unlock 3D meshes, marketplace selling, and priority AI.
            </p>

            {/* Primary CTA */}
            <Link
              href="/pricing"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: 44,
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #D4AF37 0%, #B8962E 100%)',
                color: '#09090b',
                fontSize: 15,
                fontWeight: 600,
                textDecoration: 'none',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(212, 175, 55, 0.25), inset 0 1px 0 rgba(255, 230, 160, 0.3)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow =
                  '0 0 28px rgba(212, 175, 55, 0.35), inset 0 1px 0 rgba(255, 230, 160, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow =
                  '0 0 20px rgba(212, 175, 55, 0.25), inset 0 1px 0 rgba(255, 230, 160, 0.3)'
              }}
            >
              See Plans
            </Link>

            {/* Secondary dismiss */}
            <button
              onClick={dismiss}
              style={{
                display: 'block',
                width: '100%',
                marginTop: 14,
                padding: '8px 0',
                background: 'transparent',
                border: 'none',
                color: '#71717A',
                fontSize: 13,
                cursor: 'pointer',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#A1A1AA' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#71717A' }}
            >
              Keep building
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
