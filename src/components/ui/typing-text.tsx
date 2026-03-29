'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useInView } from 'framer-motion'

interface TypingTextProps {
  /** The text to type out. */
  text: string
  /** Characters per second. Default 40. */
  speed?: number
  /** Delay in ms before typing starts. Default 0. */
  delay?: number
  /** Show blinking cursor. Default true. */
  cursor?: boolean
  /** Whether to trigger once when element enters viewport. Default true. */
  triggerOnView?: boolean
  className?: string
  /** HTML element to render as. Default 'span'. */
  as?: React.ElementType
}

/**
 * Typewriter effect for headings. Characters appear one at a time with a
 * blinking cursor. Respects prefers-reduced-motion by showing all text instantly.
 */
export function TypingText({
  text,
  speed = 40,
  delay = 0,
  cursor = true,
  triggerOnView = true,
  className = '',
  as: Tag = 'span',
}: TypingTextProps) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref as React.RefObject<Element>, { once: true, margin: '-40px' })

  const prefersReduced =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  // Trigger on view or immediately
  useEffect(() => {
    if (prefersReduced) {
      setDisplayed(text)
      setDone(true)
      return
    }
    if (!triggerOnView || inView) {
      const timer = setTimeout(() => setStarted(true), delay)
      return () => clearTimeout(timer)
    }
  }, [inView, triggerOnView, delay, prefersReduced, text])

  // Type characters
  useEffect(() => {
    if (!started || prefersReduced) return
    if (displayed.length >= text.length) {
      setDone(true)
      return
    }
    const interval = 1000 / speed
    const timer = setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + 1))
    }, interval)
    return () => clearTimeout(timer)
  }, [started, displayed, text, speed, prefersReduced])

  return (
    <>
      <Tag ref={ref} className={className}>
        {displayed}
        {cursor && (
          <span
            aria-hidden="true"
            className="inline-block w-[2px] h-[1em] bg-current ml-[1px] align-text-bottom"
            style={{
              opacity: 1,
              animation: done ? 'typing-cursor-blink 1.1s step-end infinite' : 'none',
            }}
          />
        )}
      </Tag>
      <style>{`
        @keyframes typing-cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </>
  )
}
