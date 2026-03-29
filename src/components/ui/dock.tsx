'use client'

import { useRef, useState, useCallback } from 'react'
import { motion, useSpring, useTransform, MotionValue } from 'framer-motion'

interface DockItem {
  id: string
  label: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
  active?: boolean
}

interface DockProps {
  items: DockItem[]
  /** Max scale for hovered item. Default 1.6. */
  magnification?: number
  /** Scale falloff for neighbors. Default 1.25. */
  neighborScale?: number
  /** Distance in px at which the magnification effect kicks in. Default 80. */
  distance?: number
  className?: string
  orientation?: 'vertical' | 'horizontal'
}

function DockItemComponent({
  item,
  mouseX,
  magnification,
  neighborScale,
  distance,
  orientation,
}: {
  item: DockItem
  mouseX: MotionValue<number>
  magnification: number
  neighborScale: number
  distance: number
  orientation: 'vertical' | 'horizontal'
}) {
  const ref = useRef<HTMLDivElement>(null)

  const prefersReduced =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  const center = useTransform(mouseX, (pos) => {
    if (!ref.current || prefersReduced) return 0
    const rect = ref.current.getBoundingClientRect()
    const itemCenter = orientation === 'vertical'
      ? rect.top + rect.height / 2
      : rect.left + rect.width / 2
    return itemCenter
  })

  const scale = useTransform([mouseX, center] as MotionValue[], ([mx, c]: number[]) => {
    if (mx === -Infinity || prefersReduced) return 1
    const dist = Math.abs(mx - c)
    if (dist > distance * 1.8) return 1
    if (dist <= 0) return magnification
    // Smooth falloff: cos curve
    const t = Math.max(0, 1 - dist / (distance * 1.8))
    const eased = t * t * (3 - 2 * t) // smoothstep
    return 1 + (magnification - 1) * eased * (dist < distance * 0.5 ? 1 : neighborScale / magnification)
  })

  const springScale = useSpring(scale, { stiffness: 300, damping: 25 })

  const content = (
    <motion.div
      ref={ref}
      style={{ scale: prefersReduced ? 1 : springScale }}
      className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-colors duration-150 ${
        item.active
          ? 'bg-[#FFB81C]/15 text-[#FFB81C] border border-[#FFB81C]/25'
          : 'text-gray-400 hover:text-white hover:bg-white/8'
      }`}
      title={item.label}
    >
      {item.icon}
      {/* Active dot */}
      {item.active && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -bottom-0.5 w-1.5 h-1.5 rounded-full bg-[#FFB81C]"
        />
      )}
    </motion.div>
  )

  if (item.href) {
    return (
      <a href={item.href} className="block" aria-label={item.label} aria-current={item.active ? 'page' : undefined}>
        {content}
      </a>
    )
  }

  return (
    <button onClick={item.onClick} className="block" aria-label={item.label}>
      {content}
    </button>
  )
}

/**
 * macOS-style dock effect — icons scale up on hover, neighbors scale slightly.
 * Designed for use in the sidebar nav.
 */
export function Dock({
  items,
  magnification = 1.55,
  neighborScale = 1.2,
  distance = 80,
  className = '',
  orientation = 'vertical',
}: DockProps) {
  const mousePos = useSpring(-Infinity, { stiffness: 400, damping: 30 })
  const [hovering, setHovering] = useState(false)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      mousePos.set(orientation === 'vertical' ? e.clientY : e.clientX)
      setHovering(true)
    },
    [mousePos, orientation]
  )

  const handleMouseLeave = useCallback(() => {
    mousePos.set(-Infinity)
    setHovering(false)
  }, [mousePos])

  return (
    <div
      className={`flex ${orientation === 'vertical' ? 'flex-col' : 'flex-row'} items-center gap-1 ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {items.map((item) => (
        <DockItemComponent
          key={item.id}
          item={item}
          mouseX={mousePos}
          magnification={magnification}
          neighborScale={neighborScale}
          distance={distance}
          orientation={orientation}
        />
      ))}
    </div>
  )
}
