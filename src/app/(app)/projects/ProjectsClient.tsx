'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { listProjects, deleteProject, labelProject } from '@/hooks/useProject'
import type { ProjectData } from '@/hooks/useProject'

// ─── Types ───────────────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'draft' | 'in-progress' | 'published'

interface ProjectStatus {
  label: 'Draft' | 'In Progress' | 'Published'
  key: 'draft' | 'in-progress' | 'published'
  color: string
  bg: string
  border: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toString()
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase() || '?'
}

function getProjectTokens(project: ProjectData): number {
  return project.messages.reduce((sum, m) => sum + (m.tokensUsed ?? 0), 0)
}

function getProjectStatus(project: ProjectData): ProjectStatus {
  const tokens = getProjectTokens(project)
  // Published: has objects in scene AND significant token usage
  if (project.objectCount > 0 && tokens > 500) {
    return {
      label: 'Published',
      key: 'published',
      color: '#4ade80',
      bg: 'rgba(74,222,128,0.1)',
      border: 'rgba(74,222,128,0.25)',
    }
  }
  // In Progress: has messages or objects but not fully built
  if (project.messageCount > 1 || project.objectCount > 0) {
    return {
      label: 'In Progress',
      key: 'in-progress',
      color: '#D4AF37',
      bg: 'rgba(212,175,55,0.1)',
      border: 'rgba(212,175,55,0.25)',
    }
  }
  // Draft: brand new / empty
  return {
    label: 'Draft',
    key: 'draft',
    color: '#71717a',
    bg: 'rgba(113,113,122,0.1)',
    border: 'rgba(113,113,122,0.2)',
  }
}

// Deterministic gradient per project id
function getThumbnailGradient(id: string): string {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const gradients = [
    'linear-gradient(135deg, rgba(30,58,95,0.9) 0%, rgba(15,23,42,0.95) 100%)',
    'linear-gradient(135deg, rgba(55,28,95,0.9) 0%, rgba(15,10,42,0.95) 100%)',
    'linear-gradient(135deg, rgba(22,78,55,0.9) 0%, rgba(5,30,25,0.95) 100%)',
    'linear-gradient(135deg, rgba(92,38,12,0.9) 0%, rgba(35,10,5,0.95) 100%)',
    'linear-gradient(135deg, rgba(60,28,28,0.9) 0%, rgba(28,10,10,0.95) 100%)',
    'linear-gradient(135deg, rgba(20,48,80,0.9) 0%, rgba(5,18,45,0.95) 100%)',
  ]
  return gradients[hash % gradients.length]!
}

// ─── Thumbnail ────────────────────────────────────────────────────────────────────

function ProjectThumbnail({ project }: { project: ProjectData }) {
  const initials = getInitials(project.name)
  const gradient = getThumbnailGradient(project.id)

  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      style={{ background: gradient }}
    >
      {/* Subtle dot-grid */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20"
        aria-hidden
        style={{ pointerEvents: 'none' }}
      >
        <defs>
          <pattern id={`dot-${project.id}`} x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1" fill="rgba(255,255,255,0.4)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#dot-${project.id})`} />
      </svg>

      {/* Gold spark accent */}
      <div
        className="absolute top-3 right-4 w-1 h-1 rounded-full"
        style={{ background: '#D4AF37', boxShadow: '0 0 6px 2px rgba(212,175,55,0.5)' }}
        aria-hidden
      />
      <div
        className="absolute bottom-4 left-5 w-0.5 h-0.5 rounded-full opacity-60"
        style={{ background: '#D4AF37', boxShadow: '0 0 4px 1px rgba(212,175,55,0.4)' }}
        aria-hidden
      />

      {/* Initials */}
      <span
        className="relative z-10 font-bold select-none"
        style={{
          fontSize: initials.length > 2 ? '1.1rem' : '1.5rem',
          color: 'rgba(255,255,255,0.85)',
          textShadow: '0 2px 8px rgba(0,0,0,0.6)',
          letterSpacing: '0.05em',
        }}
      >
        {initials}
      </span>

      {/* Object count pill — bottom left */}
      {project.objectCount > 0 && (
        <div
          className="absolute bottom-2 left-2 text-[10px] font-medium px-1.5 py-0.5 rounded"
          style={{
            background: 'rgba(212,175,55,0.15)',
            border: '1px solid rgba(212,175,55,0.3)',
            color: '#D4AF37',
            backdropFilter: 'blur(4px)',
          }}
        >
          {project.objectCount} obj
        </div>
      )}
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{
        background: status.bg,
        border: `1px solid ${status.border}`,
        color: status.color,
      }}
    >
      {status.label}
    </span>
  )
}

// ─── Project card ─────────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: ProjectData
  onDelete: (id: string) => void
  onLabel: (id: string, label: string) => void
}

function ProjectCard({ project, onDelete, onLabel }: ProjectCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editingLabel, setEditingLabel] = useState(false)
  const [labelInput, setLabelInput] = useState(project.label || '')
  const status = useMemo(() => getProjectStatus(project), [project])
  const tokens = useMemo(() => getProjectTokens(project), [project])

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirmDelete) {
      onDelete(project.id)
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  return (
    <div
      className="group relative rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl"
      style={{
        background: 'rgba(10, 14, 32, 0.6)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
      }}
    >
      {/* Thumbnail */}
      <Link href={`/editor?project=${project.id}`} className="block">
        <div className="relative h-36 overflow-hidden">
          <ProjectThumbnail project={project} />

          {/* Hover overlay */}
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          >
            <span
              className="text-sm font-semibold px-4 py-2 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #C8962A 100%)',
                color: '#09090b',
                boxShadow: '0 0 16px rgba(212,175,55,0.4)',
              }}
            >
              Open in Editor
            </span>
          </div>
        </div>
      </Link>

      {/* Card body */}
      <div className="px-3.5 pt-3 pb-3.5">

        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <Link href={`/editor?project=${project.id}`} className="block">
              <h3 className="text-sm font-semibold text-zinc-100 truncate hover:text-white transition-colors">
                {project.name}
              </h3>
            </Link>
            <p
              className="text-[11px] text-zinc-500 mt-0.5 truncate"
              title={formatDate(project.updatedAt)}
            >
              {formatRelativeTime(project.updatedAt)}
            </p>
            {/* Label badge */}
            {editingLabel ? (
              <input
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onBlur={() => { onLabel(project.id, labelInput); setEditingLabel(false) }}
                onKeyDown={(e) => { if (e.key === 'Enter') { onLabel(project.id, labelInput); setEditingLabel(false) } if (e.key === 'Escape') setEditingLabel(false) }}
                placeholder="Add label..."
                autoFocus
                className="mt-1 w-full px-2 py-0.5 text-[10px] rounded-md bg-white/5 border border-purple-500/30 text-purple-300 outline-none focus:border-purple-500/60"
                onClick={(e) => e.preventDefault()}
              />
            ) : (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingLabel(true) }}
                className="mt-1 inline-flex items-center gap-1 text-[10px] transition-colors"
                style={{
                  color: project.label ? '#a855f7' : '#52525b',
                  background: project.label ? 'rgba(147,51,234,0.1)' : 'transparent',
                  border: project.label ? '1px solid rgba(147,51,234,0.2)' : '1px solid transparent',
                  borderRadius: 6,
                  padding: '1px 6px',
                }}
              >
                {project.label || '+ Label'}
              </button>
            )}
          </div>

          {/* Delete button */}
          <button
            onClick={handleDeleteClick}
            className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
            style={{
              background: confirmDelete ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${confirmDelete ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)'}`,
              color: confirmDelete ? '#F87171' : '#52525b',
            }}
            title={confirmDelete ? 'Click again to confirm delete' : 'Delete project'}
            aria-label={confirmDelete ? 'Confirm delete' : 'Delete project'}
          >
            {confirmDelete ? (
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                <path d="M6 1.5L7.2 4.5H10.5L8 6.3l.9 3L6 7.8 3.1 9.3l.9-3L1.5 4.5h3.3L6 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                <path d="M2 3h8M5 3V1.5h2V3M4.5 3v6a.5.5 0 00.5.5h2a.5.5 0 00.5-.5V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>

        {/* Status + meta row */}
        <div className="flex items-center justify-between gap-2">
          <StatusBadge status={status} />

          <div className="flex items-center gap-2.5">
            {/* Messages */}
            <span className="flex items-center gap-1 text-[10px] text-zinc-600" title="Messages">
              <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                <path d="M1.5 1.5h7a.5.5 0 01.5.5v5a.5.5 0 01-.5.5H3L1 9.5V2a.5.5 0 01.5-.5z" stroke="currentColor" strokeWidth="1"/>
              </svg>
              {project.messageCount}
            </span>

            {/* Objects */}
            <span className="flex items-center gap-1 text-[10px] text-zinc-600" title="Objects in scene">
              <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                <rect x="1" y="1" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1"/>
                <rect x="5" y="1" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1"/>
                <rect x="1" y="5" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1"/>
                <rect x="5" y="5" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1"/>
              </svg>
              {project.objectCount}
            </span>

            {/* Tokens */}
            {tokens > 0 && (
              <span
                className="flex items-center gap-1 text-[10px]"
                style={{ color: 'rgba(212,175,55,0.7)' }}
                title={`${tokens.toLocaleString()} tokens used`}
              >
                <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                  <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1"/>
                  <path d="M5 3v2l1 1" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/>
                </svg>
                {formatTokens(tokens)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
  if (filtered) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <svg className="w-5 h-5 text-zinc-500" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="text-sm font-medium text-zinc-400 mb-1">No projects match your filters</p>
        <p className="text-xs text-zinc-600">Try a different search or status filter</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      {/* Illustration area */}
      <div className="relative w-48 h-32 mb-8">
        {/* Subtle dot grid */}
        <svg className="absolute inset-0 w-full h-full opacity-30" aria-hidden>
          <defs>
            <pattern id="empty-dot-grid" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1" fill="rgba(255,255,255,0.35)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#empty-dot-grid)" />
        </svg>

        {/* Central card stack */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Back card */}
          <div
            className="absolute w-24 h-16 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              transform: 'rotate(-6deg) translateY(4px)',
            }}
          />
          {/* Mid card */}
          <div
            className="absolute w-24 h-16 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              transform: 'rotate(-2deg) translateY(2px)',
            }}
          />
          {/* Front card */}
          <div
            className="relative w-24 h-16 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.04) 100%)',
              border: '1px solid rgba(212,175,55,0.25)',
            }}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" style={{ color: '#D4AF37' }}>
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* Gold spark — top right */}
        <div
          className="absolute top-2 right-6 w-1.5 h-1.5 rounded-full"
          style={{ background: '#D4AF37', boxShadow: '0 0 8px 3px rgba(212,175,55,0.6)' }}
          aria-hidden
        />
        {/* Dim spark — bottom left */}
        <div
          className="absolute bottom-3 left-4 w-1 h-1 rounded-full opacity-50"
          style={{ background: '#D4AF37', boxShadow: '0 0 5px 2px rgba(212,175,55,0.4)' }}
          aria-hidden
        />
      </div>

      <h2 className="text-xl font-bold text-zinc-100 mb-2">No projects yet</h2>
      <p className="text-sm text-zinc-500 mb-8 max-w-xs leading-relaxed">
        Create your first Roblox game with AI. Describe it in plain English — we&apos;ll handle the rest.
      </p>

      <Link
        href="/editor"
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, #D4AF37 0%, #C8962A 100%)',
          color: '#09090b',
          boxShadow: '0 0 28px rgba(212,175,55,0.4)',
        }}
      >
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Start Building
      </Link>
    </div>
  )
}

// ─── Search + filter bar ──────────────────────────────────────────────────────────

interface FilterBarProps {
  query: string
  onQueryChange: (q: string) => void
  statusFilter: StatusFilter
  onStatusChange: (s: StatusFilter) => void
  labelFilter: string
  onLabelChange: (l: string) => void
  labels: string[]
  total: number
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'published', label: 'Published' },
]

function FilterBar({ query, onQueryChange, statusFilter, onStatusChange, labelFilter, onLabelChange, labels, total }: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      {/* Search */}
      <div className="relative flex-1">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none"
          viewBox="0 0 16 16"
          fill="none"
        >
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          placeholder="Search projects..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)'
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(212,175,55,0.08)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
        {query && (
          <button
            onClick={() => onQueryChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
            aria-label="Clear search"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
              <path d="M10.5 3.5l-7 7M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Status filter pills */}
      <div
        className="flex items-center gap-1 p-1 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onStatusChange(opt.value)}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
            style={
              statusFilter === opt.value
                ? {
                    background: 'rgba(212,175,55,0.15)',
                    border: '1px solid rgba(212,175,55,0.3)',
                    color: '#D4AF37',
                  }
                : {
                    background: 'transparent',
                    border: '1px solid transparent',
                    color: '#71717a',
                  }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Label filter pills */}
      {labels.length > 0 && (
        <div
          className="flex items-center gap-1 p-1 rounded-xl flex-wrap"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button
            onClick={() => onLabelChange('all')}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
            style={labelFilter === 'all'
              ? { background: 'rgba(147,51,234,0.15)', border: '1px solid rgba(147,51,234,0.3)', color: '#a855f7' }
              : { background: 'transparent', border: '1px solid transparent', color: '#71717a' }
            }
          >
            All Labels
          </button>
          {labels.map((label) => (
            <button
              key={label}
              onClick={() => onLabelChange(label)}
              className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
              style={labelFilter === label
                ? { background: 'rgba(147,51,234,0.15)', border: '1px solid rgba(147,51,234,0.3)', color: '#a855f7' }
                : { background: 'transparent', border: '1px solid transparent', color: '#71717a' }
              }
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Count */}
      <div className="hidden sm:flex items-center text-xs text-zinc-600 whitespace-nowrap self-center">
        {total} project{total !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="rounded-xl overflow-hidden animate-pulse"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            height: 220,
          }}
        >
          <div style={{ height: 144, background: 'rgba(255,255,255,0.02)' }} />
          <div className="px-3.5 pt-3">
            <div
              className="h-3.5 rounded-md w-3/4 mb-2"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            />
            <div
              className="h-2.5 rounded-md w-1/3"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────────

export function ProjectsClient() {
  const [projects, setProjects] = useState<ProjectData[]>([])
  const [mounted, setMounted] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [labelFilter, setLabelFilter] = useState<string>('all')

  useEffect(() => {
    setProjects(listProjects())
    setMounted(true)
  }, [])

  const handleDelete = useCallback((id: string) => {
    deleteProject(id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const handleLabel = useCallback((id: string, label: string) => {
    labelProject(id, label)
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, label: label.trim() || undefined } : p))
  }, [])

  // Get unique labels from all projects
  const allLabels = useMemo(() => {
    const labels = new Set<string>()
    projects.forEach((p) => { if (p.label) labels.add(p.label) })
    return Array.from(labels).sort()
  }, [projects])

  const filtered = useMemo(() => {
    let result = projects
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter((p) => p.name.toLowerCase().includes(q) || (p.label && p.label.toLowerCase().includes(q)))
    }
    if (statusFilter !== 'all') {
      result = result.filter((p) => getProjectStatus(p).key === statusFilter)
    }
    if (labelFilter !== 'all') {
      result = result.filter((p) => p.label === labelFilter)
    }
    return result
  }, [projects, query, statusFilter, labelFilter])

  const isFiltered = query.trim().length > 0 || statusFilter !== 'all' || labelFilter !== 'all'

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">My Projects</h1>
          {mounted && projects.length > 0 && (
            <p className="text-xs text-zinc-600 mt-0.5">
              {projects.length} project{projects.length !== 1 ? 's' : ''} saved locally
            </p>
          )}
        </div>

        <Link
          href="/editor"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #C8962A 100%)',
            color: '#09090b',
            boxShadow: '0 0 16px rgba(212,175,55,0.3)',
          }}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          New Project
        </Link>
      </div>

      {/* Loading skeletons */}
      {!mounted && <SkeletonGrid />}

      {/* Empty state — no projects at all */}
      {mounted && projects.length === 0 && <EmptyState filtered={false} />}

      {/* Projects exist: show filter bar + grid */}
      {mounted && projects.length > 0 && (
        <>
          <FilterBar
            query={query}
            onQueryChange={setQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            labelFilter={labelFilter}
            onLabelChange={setLabelFilter}
            labels={allLabels}
            total={filtered.length}
          />

          {filtered.length === 0 ? (
            <EmptyState filtered={isFiltered} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((project) => (
                <ProjectCard key={project.id} project={project} onDelete={handleDelete} onLabel={handleLabel} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
