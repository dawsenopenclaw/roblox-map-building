'use client'

import { useState, useRef, useLayoutEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Tab {
  key: string
  label: string
}

interface AnimatedTabsProps {
  tabs: Tab[]
  defaultTab?: string
  onChange?: (key: string) => void
  children: (activeTab: string) => React.ReactNode
  className?: string
}

export function AnimatedTabs({
  tabs,
  defaultTab,
  onChange,
  children,
  className = '',
}: AnimatedTabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.key ?? '')
  const [prevIndex, setPrevIndex] = useState(0)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  const activeIndex = tabs.findIndex((t) => t.key === active)
  const direction = activeIndex > prevIndex ? 1 : -1

  useLayoutEffect(() => {
    const el = tabRefs.current[active]
    if (el) {
      setIndicatorStyle({ left: el.offsetLeft, width: el.offsetWidth })
    }
  }, [active])

  function handleSelect(key: string) {
    setPrevIndex(activeIndex)
    setActive(key)
    onChange?.(key)
  }

  return (
    <div className={className}>
      {/* Tab bar */}
      <div className="relative flex border-b border-white/10 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            ref={(el) => { tabRefs.current[tab.key] = el }}
            onClick={() => handleSelect(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative z-10 ${
              active === tab.key ? 'text-[#FFB81C]' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}

        {/* Sliding underline indicator */}
        <motion.div
          className="absolute bottom-0 h-0.5 bg-[#FFB81C] rounded-full"
          animate={indicatorStyle}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      </div>

      {/* Content with slide transition */}
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={active}
          custom={direction}
          initial={{ opacity: 0, x: direction * 24 }}
          animate={{ opacity: 1, x: 0, transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] } }}
          exit={{ opacity: 0, x: direction * -24, transition: { duration: 0.15 } }}
        >
          {children(active)}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
