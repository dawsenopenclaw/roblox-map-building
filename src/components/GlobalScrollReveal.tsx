'use client'

import { useEffect } from 'react'

/**
 * Global scroll reveal — observes ALL sections, cards, headings, and paragraphs
 * across every page and applies a fade-in-up animation when they enter the viewport.
 *
 * Uses the existing .reveal / .visible CSS classes from globals.css.
 * Elements that already have .reveal are left alone (they're manually managed).
 */
export function GlobalScrollReveal() {
  useEffect(() => {
    // Auto-tag elements that should reveal on scroll but don't already have .reveal
    const selectors = [
      'section > div',
      'section > h2',
      'section > p',
      '.bento-card',
      '.pricing-card',
      '.feature-card',
    ].join(', ')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    )

    // Observe all .reveal elements site-wide (including those added by page components)
    const revealEls = document.querySelectorAll('.reveal:not(.visible)')
    revealEls.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return null
}
