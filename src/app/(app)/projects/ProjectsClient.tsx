'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { listProjects, deleteProject } from '@/hooks/useProject'
import type { ProjectData } from '@/hooks/useProject'

// ─── Helpers ────────────────────────────────────────────────────────────────────

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

// ─── Mini scene preview ─────────────────────────────────────────────────────────

function MiniScenePreview({ objectCount }: { objectCount: number }) {
  const count = Math.min(objectCount, 6)
  const dots = Array.from({ length: count }, (_, i) => ({
    x: 15 + (i % 3) * 28 + (i > 2 ? 14 : 0),
    y: 20 + Math.floor(i / 3) * 28,
  }))

  return (
    <svg viewBox="0 0 110 80" className="w-full h-full" aria-hidden>
      <line x1="0" y1="72" x2="110" y2="72" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
      <line x1="0" y1="48" x2="110" y2="48" strokeDasharray="3 4" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
      <rect x="8" y="40" width="22" height="32" rx="1" fill="#1E3A5F" stroke="#3B6EA8" strokeWidth="0.8"/>
      <rect x="8" y="24" width="22" height="18" rx="0.5" fill="#2E5A8A" stroke="#4A7DC0" strokeWidth="0.5"/>
      <rect x="38" y="50" width="16" height="22" rx="1" fill="#3A2010" stroke="#7A5230" strokeWidth="0.8"/>
      <rect x="62" y="34" width="18" height="38" rx="1" fill="#1A3A28" stroke="#2E6644" strokeWidth="0.8"/>
      <circle cx="72" cy="28" r="5" fill="#166534" stroke="#22883C" strokeWidth="0.6"/>
      <rect x="86" y="44" width="18" height="28" rx="1" fill="#3A2860" stroke="#6B5AB6" strokeWidth="0.8"/>
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r="4"
          fill={`hsl(${(i * 57 + 200) % 360}, 60%, 55%)`}
          opacity="0.7"
          style={{ filter: 'blur(0.5px)' }}
        />
      ))}
    </svg>
  )
}

// ─── Project card ───────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: ProjectData
  onDelete: (id: string) => void
}

function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

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
      className="group relative rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Scene preview */}
      <Link href={`/editor?project=${project.id}`} className="block">
        <div
          className="relative h-32 overflow-hidden"
          style={{ background: 'radial-gradient(ellipse at 30% 60%, rgba(30,58,95,0.3) 0%, transparent 60%), #0a0a0d' }}
        >
          <div className="w-full h-full opacity-80">
            <MiniScenePreview objectCount={project.objectCount} />
          </div>

          {project.objectCount > 0 && (
            <div
              className="absolute top-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{
                background: 'rgba(212,175,55,0.15)',
                border: '1px solid rgba(212,175,55,0.25)',
                color: '#D4AF37',
              }}
            >
              {project.objectCount} obj
            </div>
          )}

          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          >
            <span
              className="text-sm font-semibold px-4 py-2 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #D4AF37 100%)',
                color: '#09090b',
              }}
            >
              Open Project
            </span>
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="px-3 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-zinc-100 truncate">{project.name}</h3>
            <p className="text-[11px] text-zinc-500 mt-0.5 truncate" title={formatDate(project.updatedAt)}>
              {formatRelativeTime(project.updatedAt)}
            </p>
          </div>

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
                <path d="M6 1L7.5 4.5H11L8.25 6.5l1 3.5L6 8.25 2.75 10l1-3.5L1 4.5h3.5L6 1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                <path d="M2 3h8M5 3V1.5h2V3M4.5 3v6a.5.5 0 00.5.5h2a.5.5 0 00.5-.5V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <span className="flex items-center gap-1 text-[10px] text-zinc-600">
            <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
              <path d="M5 1l1 3h3l-2.5 1.8.9 3L5 7.2 2.6 8.8l.9-3L1 4h3L5 1z" stroke="currentColor" strokeWidth="1"/>
            </svg>
            {project.messageCount} message{project.messageCount !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-zinc-600">
            <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
              <rect x="1" y="1" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1"/>
              <rect x="5" y="1" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1"/>
              <rect x="1" y="5" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1"/>
              <rect x="5" y="5" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1"/>
            </svg>
            {project.objectCount} object{project.objectCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Empty state ────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)' }}
      >
        <svg className="w-7 h-7" viewBox="0 0 28 28" fill="none" style={{ color: '#D4AF37' }}>
          <path d="M6 6h7v7H6zM15 6h7v7h-7zM6 15h7v7H6zM15 15h7v7h-7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-zinc-200 mb-2">No projects yet</h2>
      <p className="text-sm text-zinc-500 mb-6 max-w-xs leading-relaxed">
        Start building your first Roblox game. Projects are saved automatically as you chat.
      </p>
      <Link
        href="/editor"
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, #D4AF37 0%, #D4AF37 100%)',
          color: '#09090b',
          boxShadow: '0 0 20px rgba(212,175,55,0.25)',
        }}
      >
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        New Project
      </Link>
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────────

export function ProjectsClient() {
  const [projects, setProjects] = useState<ProjectData[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setProjects(listProjects())
    setMounted(true)
  }, [])

  const handleDelete = useCallback((id: string) => {
    deleteProject(id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Page header — inside AppShell container */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/editor"
            className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Editor
          </Link>
          <span className="text-zinc-700">/</span>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          {mounted && projects.length > 0 && (
            <span className="text-xs text-zinc-600 font-normal mt-0.5">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <Link
          href="/editor"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #D4AF37 100%)',
            color: '#09090b',
            boxShadow: '0 0 12px rgba(212,175,55,0.2)',
          }}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          New Project
        </Link>
      </div>

      {/* Content */}
      {!mounted ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden animate-pulse"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', height: 200 }}
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
