'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import type { ProjectData } from '@/hooks/useProject'

// ─── Cloud session type ──────────────────────────────────────────────────────

interface CloudSession {
  id: string
  title: string
  aiMode: string
  createdAt: string
  updatedAt: string
  _count?: { messages: number }
}

// ─── Folder helpers ──────────────────────────────────────────────────────────

const FOLDERS_KEY = 'forje_project_folders'

interface FolderData {
  id: string
  name: string
  projectIds: string[]
}

function loadFolders(): FolderData[] {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveFolders(folders: FolderData[]) {
  try { localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders)) } catch {}
}

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
  const [cloudSessions, setCloudSessions] = useState<CloudSession[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [search, setSearch] = useState('')
  const [folders, setFolders] = useState<FolderData[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [activeTab, setActiveTab] = useState<'local' | 'cloud'>('local')

  // Load folders from localStorage
  useEffect(() => { setFolders(loadFolders()) }, [])

  // Lazy import to avoid SSR issues — only runs client-side
  const refresh = useCallback(() => {
    if (typeof window === 'undefined') return
    import('@/hooks/useProject').then(({ listProjects }) => {
      setProjects(listProjects())
    }).catch(() => { /* ignore */ })
  }, [])

  // Fetch cloud chat sessions from DB
  const refreshCloud = useCallback(() => {
    fetch('/api/sessions')
      .then(r => r.ok ? r.json() : { sessions: [] })
      .then((data: { sessions: CloudSession[] }) => {
        setCloudSessions(data.sessions ?? [])
      })
      .catch(() => {})
  }, [])

  useEffect(() => { refresh(); refreshCloud() }, [refresh, refreshCloud])

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

      {/* Tabs: Local / Cloud */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 6, flexShrink: 0 }}>
        {(['local', 'cloud'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '6px 0', borderRadius: 7, border: 'none',
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              background: activeTab === tab ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)',
              color: activeTab === tab ? '#D4AF37' : 'rgba(255,255,255,0.35)',
              transition: 'all 0.15s',
            }}
          >
            {tab === 'local' ? `Local (${projects.length})` : `Cloud (${cloudSessions.length})`}
          </button>
        ))}
      </div>

      {/* Search */}
      {(projects.length > 0 || cloudSessions.length > 0) && (
        <div style={{ position: 'relative', marginBottom: 6, flexShrink: 0 }}>
          <svg
            width="11" height="11" viewBox="0 0 11 11" fill="none"
            style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <circle cx="4.5" cy="4.5" r="3.5" stroke="rgba(255,255,255,0.25)" strokeWidth="1.3"/>
            <path d="M7.5 7.5l2 2" stroke="rgba(255,255,255,0.25)" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search..."
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

      {/* New Folder button */}
      {activeTab === 'local' && (
        <div style={{ marginBottom: 6, flexShrink: 0 }}>
          {creatingFolder ? (
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                type="text"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newFolderName.trim()) {
                    const f: FolderData = { id: `folder-${Date.now()}`, name: newFolderName.trim(), projectIds: [] }
                    const updated = [...folders, f]
                    setFolders(updated)
                    saveFolders(updated)
                    setCreatingFolder(false)
                    setNewFolderName('')
                  }
                  if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName('') }
                }}
                placeholder="Folder name..."
                autoFocus
                maxLength={30}
                style={{
                  flex: 1, padding: '5px 8px', borderRadius: 6,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(212,175,55,0.3)',
                  color: 'rgba(255,255,255,0.8)', fontSize: 11, outline: 'none',
                  fontFamily: 'Inter, sans-serif',
                }}
              />
              <button
                onClick={() => { setCreatingFolder(false); setNewFolderName('') }}
                style={{
                  padding: '4px 8px', borderRadius: 6, border: 'none',
                  background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)',
                  fontSize: 10, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCreatingFolder(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                padding: '5px 10px', borderRadius: 7, border: 'none',
                background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.3)',
                fontSize: 11, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M1 3h4l1-1h5v8H1V3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                <path d="M6 5v4M4 7h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
              </svg>
              New Folder
            </button>
          )}
        </div>
      )}

      {/* Project / Session list */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {activeTab === 'local' ? (
          <>
            {/* Folders */}
            {folders.map(folder => {
              const isExpanded = expandedFolders.has(folder.id)
              const folderProjects = projects.filter(p => folder.projectIds.includes(p.id))
              const filteredFolderProjects = search.trim()
                ? folderProjects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
                : folderProjects
              if (search.trim() && filteredFolderProjects.length === 0) return null
              return (
                <div key={folder.id}>
                  <div
                    onClick={() => {
                      const next = new Set(expandedFolders)
                      isExpanded ? next.delete(folder.id) : next.add(folder.id)
                      setExpandedFolders(next)
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 10px', borderRadius: 7, cursor: 'pointer',
                      color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600,
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                      style={{ transform: isExpanded ? 'rotate(90deg)' : '', transition: 'transform 0.15s' }}
                    >
                      <path d="M3 1l5 4-5 4V1z" fill="currentColor" />
                    </svg>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M1 3h4l1-1h5v8H1V3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                    </svg>
                    {folder.name}
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginLeft: 'auto' }}>{folderProjects.length}</span>
                  </div>
                  {isExpanded && filteredFolderProjects.map(project => (
                    <div key={project.id} style={{ paddingLeft: 16 }}>
                      <ProjectRow
                        project={project}
                        isActive={project.id === activeProjectId}
                        onLoad={(id) => { const p = projects.find(x => x.id === id); if (p) onLoadProject(p) }}
                        onDelete={handleDelete}
                        onRename={handleRename}
                      />
                    </div>
                  ))}
                </div>
              )
            })}

            {/* Unfiled projects */}
            {(() => {
              const folderedIds = new Set(folders.flatMap(f => f.projectIds))
              const unfiled = projects.filter(p => !folderedIds.has(p.id))
              const filteredUnfiled = search.trim()
                ? unfiled.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
                : unfiled
              if (unfiled.length === 0 && projects.length === 0) {
                return (
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: 8, padding: '32px 16px', textAlign: 'center',
                  }}>
                    <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                      No saved projects yet.<br />Click &ldquo;Save Project&rdquo; to save your work.
                    </p>
                  </div>
                )
              }
              return filteredUnfiled.map(project => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  isActive={project.id === activeProjectId}
                  onLoad={(id) => { const p = projects.find(x => x.id === id); if (p) onLoadProject(p) }}
                  onDelete={handleDelete}
                  onRename={handleRename}
                />
              ))
            })()}
          </>
        ) : (
          <>
            {/* Cloud chat sessions */}
            {cloudSessions.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 8, padding: '32px 16px', textAlign: 'center',
              }}>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                  No cloud chats yet.<br />Your AI conversations are automatically saved here.
                </p>
              </div>
            ) : (
              cloudSessions
                .filter(s => !search.trim() || s.title.toLowerCase().includes(search.toLowerCase()))
                .map(session => (
                  <div
                    key={session.id}
                    onClick={() => {
                      // Load cloud session as a project
                      const asProject: ProjectData = {
                        id: session.id,
                        name: session.title,
                        createdAt: session.createdAt,
                        updatedAt: session.updatedAt,
                        messages: [],
                        sceneBlocks: [],
                        messageCount: session._count?.messages ?? 0,
                        objectCount: 0,
                      }
                      onLoadProject(asProject)
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', borderRadius: 9, cursor: 'pointer',
                      background: session.id === activeProjectId ? 'rgba(212,175,55,0.10)' : 'transparent',
                      border: `1px solid ${session.id === activeProjectId ? 'rgba(212,175,55,0.22)' : 'transparent'}`,
                      transition: 'all 0.12s ease-out',
                    }}
                    onMouseEnter={e => { if (session.id !== activeProjectId) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                    onMouseLeave={e => { if (session.id !== activeProjectId) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 7, flexShrink: 0,
                      background: 'rgba(96,165,250,0.15)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      border: '1px solid rgba(96,165,250,0.2)',
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(96,165,250,0.8)" strokeWidth="1.5">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: 0, fontSize: 12, fontWeight: 600,
                        color: session.id === activeProjectId ? '#D4AF37' : 'rgba(255,255,255,0.8)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {session.title}
                      </p>
                      <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                        {formatRelativeTime(session.updatedAt)} · {session._count?.messages ?? 0} msg
                      </p>
                    </div>
                  </div>
                ))
            )}
          </>
        )}
      </div>

      {/* Footer count */}
      <div style={{
        paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)',
        fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', flexShrink: 0,
      }}>
        {activeTab === 'local'
          ? `${projects.length} local · ${folders.length} folders`
          : `${cloudSessions.length} cloud sessions`
        }
      </div>
    </div>
  )
}
