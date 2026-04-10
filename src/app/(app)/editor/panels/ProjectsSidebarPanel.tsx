'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import type { ProjectData } from '@/hooks/useProject'

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase() || '?'
}

function getThumbnailColor(id: string): string {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const colors = [
    'rgba(30,58,95,0.9)',
    'rgba(55,28,95,0.9)',
    'rgba(22,78,55,0.9)',
    'rgba(92,38,12,0.9)',
    'rgba(60,28,28,0.9)',
    'rgba(20,48,80,0.9)',
  ]
  return colors[hash % colors.length]!
}

// ─── Save Dialog ──────────────────────────────────────────────────────────────

interface SaveDialogProps {
  initialName: string
  onSave: (name: string) => void
  onCancel: () => void
}

function SaveDialog({ initialName, onSave, onCancel }: SaveDialogProps) {
  const [name, setName] = useState(initialName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) onSave(name.trim())
  }

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 50,
        background: 'rgba(5,8,20,0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%', background: '#0d1020',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: 12, padding: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
          Save Project
        </p>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name..."
          maxLength={60}
          style={{
            width: '100%', padding: '8px 10px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(212,175,55,0.25)',
            borderRadius: 8, fontSize: 13,
            color: 'rgba(255,255,255,0.9)', outline: 'none',
            boxSizing: 'border-box', marginBottom: 10,
            fontFamily: 'Inter, sans-serif',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.25)' }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.5)', fontSize: 12,
              fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            style={{
              flex: 1, padding: '7px 0', borderRadius: 8,
              background: name.trim()
                ? 'linear-gradient(135deg, #D4AF37 0%, #E6A519 100%)'
                : 'rgba(212,175,55,0.2)',
              border: 'none',
              color: name.trim() ? '#09090b' : 'rgba(212,175,55,0.4)',
              fontSize: 12, fontWeight: 700, cursor: name.trim() ? 'pointer' : 'default',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Save
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Rename inline input ───────────────────────────────────────────────────────

interface RenameInputProps {
  initialName: string
  onCommit: (name: string) => void
  onCancel: () => void
}

function RenameInput({ initialName, onCommit, onCancel }: RenameInputProps) {
  const [val, setVal] = useState(initialName)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])

  return (
    <input
      ref={ref}
      type="text"
      value={val}
      maxLength={60}
      onChange={(e) => setVal(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); if (val.trim()) onCommit(val.trim()) }
        if (e.key === 'Escape') onCancel()
      }}
      onBlur={() => { if (val.trim()) onCommit(val.trim()); else onCancel() }}
      style={{
        flex: 1, minWidth: 0,
        padding: '2px 6px', borderRadius: 5,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(212,175,55,0.4)',
        color: 'rgba(255,255,255,0.9)', fontSize: 12,
        fontWeight: 600, outline: 'none',
        fontFamily: 'Inter, sans-serif',
      }}
    />
  )
}

// ─── Project row ───────────────────────────────────────────────────────────────

interface ProjectRowProps {
  project: ProjectData
  isActive: boolean
  onLoad: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
}

function ProjectRow({ project, isActive, onLoad, onDelete, onRename }: ProjectRowProps) {
  const [hovered, setHovered] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const thumbColor = getThumbnailColor(project.id)
  const initials = getInitials(project.name)

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirmDelete) {
      onDelete(project.id)
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRenaming(true)
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false) }}
      onClick={() => !renaming && onLoad(project.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 9, cursor: renaming ? 'default' : 'pointer',
        background: isActive
          ? 'rgba(212,175,55,0.10)'
          : hovered
          ? 'rgba(255,255,255,0.05)'
          : 'transparent',
        border: `1px solid ${isActive ? 'rgba(212,175,55,0.22)' : 'transparent'}`,
        transition: 'all 0.12s ease-out',
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: 32, height: 32, borderRadius: 7, flexShrink: 0,
          background: thumbColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.04em' }}>
          {initials}
        </span>
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {renaming ? (
          <RenameInput
            initialName={project.name}
            onCommit={(name) => { onRename(project.id, name); setRenaming(false) }}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <p style={{
            margin: 0, fontSize: 12, fontWeight: 600,
            color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.8)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {project.name}
          </p>
        )}
        {!renaming && (
          <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
            {formatRelativeTime(project.updatedAt)} · {project.messageCount} msg
          </p>
        )}
      </div>

      {/* Actions — visible on hover */}
      {hovered && !renaming && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {/* Rename */}
          <button
            onClick={handleRenameClick}
            title="Rename"
            style={{
              width: 22, height: 22, borderRadius: 5, border: 'none',
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.4)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M6.5 1.5l2 2L3 9H1V7L6.5 1.5z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
            </svg>
          </button>
          {/* Delete */}
          <button
            onClick={handleDeleteClick}
            title={confirmDelete ? 'Click again to confirm' : 'Delete'}
            style={{
              width: 22, height: 22, borderRadius: 5, border: 'none',
              background: confirmDelete ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)',
              color: confirmDelete ? '#F87171' : 'rgba(255,255,255,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1.5 2.5h7M4 2.5V1.5h2V2.5M3.5 2.5v5.5a.5.5 0 00.5.5h2a.5.5 0 00.5-.5V2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export interface ProjectsSidebarPanelProps {
  /** ID of the project currently loaded in the editor (if any). */
  activeProjectId: string | null
  /** Called when the user clicks a project row — editor should load it. */
  onLoadProject: (project: ProjectData) => void
  /** Called when the user clicks "Save Project". */
  onSaveProject: (name: string) => void
  /** Current project name (for the save dialog pre-fill). */
  currentProjectName: string
}

export function ProjectsSidebarPanel({
  activeProjectId,
  onLoadProject,
  onSaveProject,
  currentProjectName,
}: ProjectsSidebarPanelProps) {
  const [projects, setProjects] = useState<ProjectData[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [search, setSearch] = useState('')

  // Lazy import to avoid SSR issues — only runs client-side
  const refresh = useCallback(() => {
    if (typeof window === 'undefined') return
    import('@/hooks/useProject').then(({ listProjects }) => {
      setProjects(listProjects())
    }).catch(() => { /* ignore */ })
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const handleDelete = useCallback((id: string) => {
    import('@/hooks/useProject').then(({ deleteProject }) => {
      deleteProject(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
    }).catch(() => { /* ignore */ })
  }, [])

  const handleRename = useCallback((id: string, name: string) => {
    import('@/hooks/useProject').then(({ renameProject }) => {
      renameProject(id, name)
      setProjects((prev) => prev.map((p) => p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p))
    }).catch(() => { /* ignore */ })
  }, [])

  const filtered = search.trim()
    ? projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : projects

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>

      {/* Save dialog overlay */}
      {showSaveDialog && (
        <SaveDialog
          initialName={currentProjectName}
          onSave={(name) => { onSaveProject(name); setShowSaveDialog(false); setTimeout(refresh, 200) }}
          onCancel={() => setShowSaveDialog(false)}
        />
      )}

      {/* Save button */}
      <button
        onClick={() => setShowSaveDialog(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px', borderRadius: 8, marginBottom: 4,
          background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.25)',
          color: '#D4AF37', fontSize: 12, fontWeight: 600,
          fontFamily: 'Inter, sans-serif', cursor: 'pointer', width: '100%',
          transition: 'background 0.15s', flexShrink: 0,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212,175,55,0.18)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(212,175,55,0.10)' }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 2h6l2 2v6a1 1 0 01-1 1H3a1 1 0 01-1-1V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
          <path d="M4 2v3h4V2" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
          <path d="M3 6h6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
        </svg>
        Save Project
      </button>

      {/* Search */}
      {projects.length > 0 && (
        <div style={{ position: 'relative', marginBottom: 8, flexShrink: 0 }}>
          <svg
            width="11" height="11" viewBox="0 0 11 11" fill="none"
            style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <circle cx="4.5" cy="4.5" r="3.5" stroke="rgba(255,255,255,0.25)" strokeWidth="1.3"/>
            <path d="M7.5 7.5l2 2" stroke="rgba(255,255,255,0.25)" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '7px 28px', borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.8)', fontSize: 12, outline: 'none',
              boxSizing: 'border-box', fontFamily: 'Inter, sans-serif',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.3)', padding: 2, display: 'flex',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M8 2L2 8M2 2l6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Project list */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {projects.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 8, padding: '32px 16px', textAlign: 'center',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)',
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#D4AF37' }}>
                <path d="M3 3h8l2 2v8a1 1 0 01-1 1H4a1 1 0 01-1-1V3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                <path d="M6 3v4h4V3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
              No saved projects yet.<br />Click &ldquo;Save Project&rdquo; to save your work.
            </p>
          </div>
        )}

        {filtered.length === 0 && projects.length > 0 && (
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '16px 0', margin: 0 }}>
            No projects match &ldquo;{search}&rdquo;
          </p>
        )}

        {filtered.map((project) => (
          <ProjectRow
            key={project.id}
            project={project}
            isActive={project.id === activeProjectId}
            onLoad={(id) => {
              const p = projects.find((x) => x.id === id)
              if (p) onLoadProject(p)
            }}
            onDelete={handleDelete}
            onRename={handleRename}
          />
        ))}
      </div>

      {/* Footer count */}
      {projects.length > 0 && (
        <div style={{
          paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)',
          fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', flexShrink: 0,
        }}>
          {projects.length} / 20 projects saved
        </div>
      )}
    </div>
  )
}
