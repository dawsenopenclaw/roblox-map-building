'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Types ─────────────────────────────────────────────────────────────────────

type TaskStatus = 'queued' | 'running' | 'done' | 'failed'

interface BuildTask {
  id: string
  type: 'research' | 'build' | 'script' | 'terrain' | 'asset' | 'lighting' | 'audio' | 'npc' | 'ui'
  name: string
  status: TaskStatus
  progress: number
  detail?: string
}

interface BuildStatus {
  buildId: string
  status: 'queued' | 'running' | 'complete' | 'failed' | 'cancelled'
  wave: number
  totalWaves: number
  tasks: BuildTask[]
  estimatedSecondsRemaining: number
  summary?: string
  error?: string
}

export interface BuildProgressProps {
  buildId: string
  onComplete?: (summary?: string) => void
  onCancel?: () => void
}

// ─── Icon map ──────────────────────────────────────────────────────────────────

function TaskTypeIcon({ type }: { type: BuildTask['type'] }) {
  const icons: Record<BuildTask['type'], React.ReactNode> = {
    research: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <circle cx="7" cy="7" r="5" />
        <path d="m11 11 2.5 2.5" strokeLinecap="round" />
      </svg>
    ),
    build: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <rect x="2" y="2" width="5" height="5" rx="1" />
        <rect x="9" y="2" width="5" height="5" rx="1" />
        <rect x="2" y="9" width="5" height="5" rx="1" />
        <rect x="9" y="9" width="5" height="5" rx="1" />
      </svg>
    ),
    script: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <path d="M5 6 3 8l2 2M11 6l2 2-2 2M9 4l-2 8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    terrain: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <path d="M1 13 6 5l3 5 2-3 4 6H1z" strokeLinejoin="round" />
      </svg>
    ),
    asset: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <path d="M8 1 15 5v6L8 15 1 11V5L8 1z" strokeLinejoin="round" />
      </svg>
    ),
    lighting: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <circle cx="8" cy="8" r="3" />
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M11.54 4.46 10.13 5.87M3.05 12.95l1.41-1.41" strokeLinecap="round" />
      </svg>
    ),
    audio: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <path d="M2 6v4h3l4 4V2L5 6H2zM11.5 5.5a3 3 0 0 1 0 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    npc: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <circle cx="8" cy="5" r="3" />
        <path d="M2 14c0-3.31 2.69-6 6-6s6 2.69 6 6" strokeLinecap="round" />
      </svg>
    ),
    ui: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <rect x="1" y="3" width="14" height="10" rx="1.5" />
        <path d="M1 6h14" strokeLinecap="round" />
        <circle cx="3.5" cy="4.5" r=".5" fill="currentColor" />
        <circle cx="5.5" cy="4.5" r=".5" fill="currentColor" />
      </svg>
    ),
  }
  return <>{icons[type]}</>
}

// ─── Status badge ───────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: TaskStatus }) {
  if (status === 'done') {
    return (
      <motion.svg
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        viewBox="0 0 16 16"
        fill="none"
        stroke="#22C55E"
        strokeWidth="2"
        className="w-4 h-4 flex-shrink-0"
      >
        <path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
      </motion.svg>
    )
  }
  if (status === 'failed') {
    return (
      <svg viewBox="0 0 16 16" fill="none" stroke="#EF4444" strokeWidth="2" className="w-4 h-4 flex-shrink-0">
        <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
      </svg>
    )
  }
  if (status === 'running') {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        className="w-4 h-4 flex-shrink-0"
      >
        <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
          <circle cx="8" cy="8" r="6" stroke="rgba(212,175,55,0.2)" strokeWidth="2" />
          <path d="M8 2a6 6 0 0 1 6 6" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </motion.div>
    )
  }
  // queued
  return (
    <div className="w-4 h-4 flex-shrink-0 rounded-full border-2 border-white/15" />
  )
}

// ─── Time formatter ─────────────────────────────────────────────────────────────

function formatTime(secs: number): string {
  if (secs <= 0) return '< 1s'
  if (secs < 60) return `${secs}s`
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

// ─── Overall progress bar ───────────────────────────────────────────────────────

function OverallProgressBar({ pct }: { pct: number }) {
  return (
    <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          background: 'linear-gradient(90deg, #D4AF37, #FFB81C)',
          boxShadow: '0 0 8px rgba(212,175,55,0.5)',
        }}
        initial={{ width: '0%' }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
      {/* shimmer sweep */}
      <motion.div
        className="absolute inset-y-0 w-16 rounded-full"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)' }}
        animate={{ left: ['-4rem', '100%'] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'linear', repeatDelay: 0.4 }}
      />
    </div>
  )
}

// ─── Task row ──────────────────────────────────────────────────────────────────

function TaskRow({ task, index }: { task: BuildTask; index: number }) {
  const statusColors: Record<TaskStatus, string> = {
    queued:  '#52525b',
    running: '#D4AF37',
    done:    '#22C55E',
    failed:  '#EF4444',
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="flex items-start gap-3 py-2"
    >
      {/* Type icon */}
      <div
        className="mt-0.5 flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-md"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          color: statusColors[task.status],
        }}
      >
        <TaskTypeIcon type={task.type} />
      </div>

      {/* Name + detail + mini progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-xs font-medium truncate"
            style={{ color: task.status === 'queued' ? '#52525b' : task.status === 'failed' ? '#EF4444' : '#d4d4d8' }}
          >
            {task.name}
          </span>
          {task.status === 'running' && (
            <span className="text-[10px] font-mono flex-shrink-0" style={{ color: '#D4AF37' }}>
              {task.progress}%
            </span>
          )}
        </div>

        {task.detail && task.status === 'running' && (
          <p className="text-[10px] mt-0.5 truncate" style={{ color: '#52525b' }}>{task.detail}</p>
        )}

        {task.status === 'running' && (
          <div className="mt-1.5 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #D4AF37, #FFB81C)' }}
              animate={{ width: `${task.progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        )}
      </div>

      {/* Status icon */}
      <StatusIcon status={task.status} />
    </motion.div>
  )
}

// ─── Complete overlay ───────────────────────────────────────────────────────────

function CompleteCard({ summary, onDismiss }: { summary?: string; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="flex flex-col items-center gap-3 py-4 text-center"
    >
      {/* Burst icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 18 }}
        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(255,184,28,0.1))',
          border: '1px solid rgba(212,175,55,0.3)',
          boxShadow: '0 0 24px rgba(212,175,55,0.25)',
        }}
      >
        🎉
      </motion.div>

      <div>
        <p className="text-sm font-bold text-white mb-0.5">Build Complete!</p>
        {summary && <p className="text-xs leading-relaxed" style={{ color: '#a1a1aa' }}>{summary}</p>}
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onDismiss}
        className="px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
        style={{
          background: 'rgba(212,175,55,0.15)',
          border: '1px solid rgba(212,175,55,0.3)',
          color: '#D4AF37',
        }}
      >
        Continue editing
      </motion.button>
    </motion.div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function BuildProgressDashboard({ buildId, onComplete, onCancel }: BuildProgressProps) {
  const [status, setStatus] = useState<BuildStatus | null>(null)
  const [visible, setVisible] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const completedRef = useRef(false)

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/ai/build/status?buildId=${encodeURIComponent(buildId)}`)
      if (!res.ok) return
      const data = (await res.json()) as BuildStatus
      setStatus(data)

      if ((data.status === 'complete' || data.status === 'failed') && !completedRef.current) {
        completedRef.current = true
        if (intervalRef.current) clearInterval(intervalRef.current)
        if (data.status === 'complete') {
          onComplete?.(data.summary)
        }
      }
    } catch {
      // network error — keep polling
    }
  }, [buildId, onComplete])

  useEffect(() => {
    setVisible(true)
    void poll()
    intervalRef.current = setInterval(() => { void poll() }, 2000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [poll])

  const handleCancel = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    try {
      await fetch(`/api/ai/build/cancel?buildId=${encodeURIComponent(buildId)}`, { method: 'POST' })
    } catch { /* best-effort */ }
    onCancel?.()
  }

  if (!status) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl p-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            className="w-5 h-5"
          >
            <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
              <circle cx="10" cy="10" r="8" stroke="rgba(212,175,55,0.2)" strokeWidth="2" />
              <path d="M10 2a8 8 0 0 1 8 8" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </motion.div>
          <span className="text-xs font-medium" style={{ color: '#71717a' }}>Initializing build…</span>
        </div>
      </motion.div>
    )
  }

  const doneTasks = status.tasks.filter((t) => t.status === 'done').length
  const totalTasks = status.tasks.length
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  const isComplete = status.status === 'complete'
  const isFailed = status.status === 'failed'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 6 }}
        transition={{ duration: 0.25 }}
        className="rounded-xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.025)',
          border: `1px solid ${isFailed ? 'rgba(239,68,68,0.25)' : isComplete ? 'rgba(34,197,94,0.25)' : 'rgba(212,175,55,0.15)'}`,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center gap-2.5">
            {!isComplete && !isFailed && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4"
              >
                <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                  <circle cx="8" cy="8" r="6" stroke="rgba(212,175,55,0.2)" strokeWidth="2" />
                  <path d="M8 2a6 6 0 0 1 6 6" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </motion.div>
            )}
            <span className="text-xs font-semibold" style={{ color: isFailed ? '#EF4444' : isComplete ? '#22C55E' : '#D4AF37' }}>
              {isFailed ? 'Build Failed' : isComplete ? 'Build Complete' : `Building… Wave ${status.wave}/${status.totalWaves}`}
            </span>
          </div>

          {/* ETA + cancel */}
          <div className="flex items-center gap-3">
            {!isComplete && !isFailed && status.estimatedSecondsRemaining > 0 && (
              <span className="text-[10px] font-mono" style={{ color: '#52525b' }}>
                ~{formatTime(status.estimatedSecondsRemaining)}
              </span>
            )}
            {!isComplete && !isFailed && (
              <button
                onClick={() => void handleCancel()}
                className="text-[10px] font-medium transition-colors hover:text-red-400"
                style={{ color: '#52525b' }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          {isComplete ? (
            <CompleteCard summary={status.summary} onDismiss={() => onComplete?.(status.summary)} />
          ) : (
            <>
              {/* Overall progress */}
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-medium" style={{ color: '#52525b' }}>
                  {doneTasks}/{totalTasks} tasks
                </span>
                <span className="text-[10px] font-mono font-semibold" style={{ color: '#D4AF37' }}>{pct}%</span>
              </div>
              <div className="mb-4">
                <OverallProgressBar pct={pct} />
              </div>

              {/* Task list */}
              <div
                className="divide-y max-h-60 overflow-y-auto pr-1 scrollbar-thin"
                style={{ '--scrollbar-thumb': 'rgba(255,255,255,0.08)' } as React.CSSProperties}
              >
                {status.tasks.map((task, i) => (
                  <TaskRow key={task.id} task={task} index={i} />
                ))}
              </div>

              {/* Error */}
              {isFailed && status.error && (
                <p className="mt-3 text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {status.error}
                </p>
              )}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
