'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

interface NumberTickerProps {
  /** Target number to animate to. */
  value: number
  /** Number of decimal places. Default 0. */
  decimals?: number
  /** Animation duration in ms. Default 1400. */
  duration?: number
  /** Delay before animation starts in ms. Default 0. */
  delay?: number
  /** Prefix (e.g. "$"). Default ''. */
  prefix?: string
  /** Suffix (e.g. "+", "%"). Default ''. */
  suffix?: string
  className?: string
  /** Number of digit slots to display (left-pads with 0s). Default derived from value. */
  digits?: number
}

/**
 * Odometer-style number animation — digits roll like a slot machine.
 * Each digit slides vertically into position. Respects prefers-reduced-motion
 * by showing the final value instantly without animation.
 */
export function NumberTicker({
  value,
  decimals = 0,
  duration = 1400,
  delay = 0,
  prefix = '',
  suffix = '',
  className = '',
  digits,
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref as React.RefObject<Element>, { once: true, margin: '-40px' })
  const [current, setCurrent] = useState(0)
  const [animated, setAnimated] = useState(false)

  const prefersReduced =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  useEffect(() => {
    if (!inView) return
    if (prefersReduced) {
      setCurrent(value)
      setAnimated(true)
      return
    }
    const startTime = performance.now() + delay
    let raf: number

    const tick = (now: number) => {
      if (now < startTime) {
        raf = requestAnimationFrame(tick)
        return
      }
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(eased * value)
      if (progress < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setCurrent(value)
        setAnimated(true)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, duration, delay, prefersReduced])

  // Format into digit array
  const formatted = current.toFixed(decimals)
  const [intPart, decPart] = formatted.split('.')
  const totalDigits = digits ?? intPart.length
  const paddedInt = intPart.padStart(totalDigits, '0')

  // Insert thousands commas
  const withCommas = paddedInt.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  return (
    <span ref={ref} className={`inline-flex items-end overflow-hidden leading-none ${className}`} aria-label={`${prefix}${value.toFixed(decimals)}${suffix}`}>
      {prefix && <span className="mr-0.5">{prefix}</span>}
      <span className="inline-flex items-end">
        {withCommas.split('').map((char, i) => {
          if (char === ',') {
            return (
              <span key={`sep-${i}`} className="self-end pb-[0.05em]">
                ,
              </span>
            )
          }
          const digit = parseInt(char, 10)
          return (
            <DigitSlot
              key={i}
              digit={digit}
              animated={!prefersReduced && animated}
            />
          )
        })}
        {decPart !== undefined && (
          <>
            <span className="self-end pb-[0.05em]">.</span>
            {decPart.split('').map((char, i) => (
              <DigitSlot
                key={`dec-${i}`}
                digit={parseInt(char, 10)}
                animated={!prefersReduced && animated}
              />
            ))}
          </>
        )}
      </span>
      {suffix && <span className="ml-0.5">{suffix}</span>}
    </span>
  )
}

function DigitSlot({ digit, animated }: { digit: number; animated: boolean }) {
  return (
    <span
      className="relative inline-block overflow-hidden"
      style={{ height: '1.1em', width: '0.6em' }}
    >
      <span
        className="absolute inset-x-0 flex flex-col items-center"
        style={{
          transform: `translateY(${animated ? `-${digit * 10}%` : '0'})`,
          transition: animated ? 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
          top: 0,
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span
            key={n}
            className="flex items-center justify-center tabular-nums"
            style={{ height: '1.1em', lineHeight: '1.1em', minWidth: '0.6em' }}
          >
            {n}
          </span>
        ))}
      </span>
    </span>
  )
}
