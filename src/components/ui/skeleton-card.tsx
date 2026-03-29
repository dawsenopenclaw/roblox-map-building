'use client'

import { motion } from 'framer-motion'

interface SkeletonCardProps {
  /** Height of the image/thumbnail area in px */
  imageHeight?: number
  /** Number of text lines to render */
  lines?: number
  className?: string
}

const shimmerVariants = {
  initial: { x: '-100%' },
  animate: {
    x: '100%',
    transition: {
      repeat: Infinity,
      repeatType: 'loop' as const,
      duration: 1.4,
      ease: 'easeInOut',
    },
  },
}

function ShimmerLine({ width = 'w-full', height = 'h-3' }: { width?: string; height?: string }) {
  return (
    <div className={`relative overflow-hidden rounded ${height} ${width} bg-white/8`}>
      <motion.div
        variants={shimmerVariants}
        initial="initial"
        animate="animate"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)',
        }}
      />
    </div>
  )
}

export function SkeletonCard({
  imageHeight = 160,
  lines = 2,
  className = '',
}: SkeletonCardProps) {
  return (
    <motion.div
      className={`bg-[#141414] border border-white/10 rounded-xl overflow-hidden ${className}`}
      animate={{ opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Image area */}
      <div
        className="relative overflow-hidden bg-white/5"
        style={{ height: imageHeight }}
      >
        <motion.div
          variants={shimmerVariants}
          initial="initial"
          animate="animate"
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
          }}
        />
      </div>

      {/* Text lines */}
      <div className="p-3 space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <ShimmerLine key={i} width={i === 0 ? 'w-3/4' : 'w-1/2'} />
        ))}
        <div className="flex items-center justify-between pt-1">
          <ShimmerLine width="w-20" height="h-2.5" />
          <ShimmerLine width="w-12" height="h-2.5" />
        </div>
      </div>
    </motion.div>
  )
}
