'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { SceneObject } from './PropertiesPanel'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ObjectListProps {
  objects: SceneObject[]
  selectedId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onRename: (id: string, name: string) => void
  className?: string
}

interface ContextMenu {
  x: number
  y: number
  objectId: string
}

// ---------------------------------------------------------------------------
// Icon per type
// ---------------------------------------------------------------------------

function TypeIcon({ type }: { type: SceneObject['type'] }) {
  const classes = 'w-3.5 h-3.5 flex-shrink-0'
  switch (type) {
    case 'part':
      return (
        <svg className={`${classes} text-blue-400`} viewBox="0 0 16 16" fill="none">
          <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        </svg>
      )
    case 'model':
      return (
        <svg className={`${classes} text-orange-400`} viewBox="0 0 16 16" fill="none">
          <path d="M8 2l5 3v6l-5 3-5-3V5l5-3z" stroke="currentColor" strokeWidth="1.3"/>
        </svg>
      )
    case 'npc':
      return (
        <svg className={`${classes} text-purple-400`} viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M2 14c0-3.31 2.69-5 6-5s6 1.69 6 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      )
    case 'terrain':
      return (
        <svg className={`${classes} text-green-400`} viewBox="0 0 16 16" fill="none">
          <path d="M1 12l4-6 3 4 3-6 4 8H1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
        </svg>
      )
    case 'script':
      return (
        <svg className={`${classes} text-cyan-400`} viewBox="0 0 16 16" fill="none">
          <path d="M5 5l-3 3 3 3M11 5l3 3-3 3M9 3l-2 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    case 'light':
      return (
        <svg className={`${classes} text-yellow-400`} viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      )
    case 'spawn':
      return (
        <svg className={`${classes} text-red-400`} viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      )
  }
}

// ---------------------------------------------------------------------------
// Rename input (inline)
// ---------------------------------------------------------------------------

function RenameInput({
  initialValue,
  onCommit,
  onCancel,
}: {
  initialValue: string
  onCommit: (v: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.select()
  }, [])

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); onCommit(value.trim() || initialValue) }
        if (e.key === 'Escape') { e.preventDefault(); onCancel() }
      }}
      onBlur={() => onCommit(value.trim() || initialValue)}
      className="flex-1 min-w-0 bg-transparent text-[11px] font-mono text-white focus:outline-none border-b"
      style={{ borderColor: '#D4AF37', caretColor: '#D4AF37' }}
      onClick={(e) => e.stopPropagation()}
    />
  )
}

// ---------------------------------------------------------------------------
// Single object row (recursive for children)
// ---------------------------------------------------------------------------

function ObjectRow({
  obj,
  depth,
  selectedId,
  renamingId,
  onSelect,
  onContextMenu,
  onRenameCommit,
  onRenameCancel,
}: {
  obj: SceneObject
  depth: number
  selectedId: string | null
  renamingId: string | null
  onSelect: (id: string) => void
  onContextMenu: (e: React.MouseEvent, id: string) => void
  onRenameCommit: (id: string, name: string) => void
  onRenameCancel: () => void
}) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = (obj.children?.length ?? 0) > 0
  const isSelected = selectedId === obj.id
  const isRenaming = renamingId === obj.id

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 py-1 pr-2 rounded cursor-pointer group transition-colors ${
          isSelected
            ? 'bg-[#D4AF37]/12 text-white'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
        }`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={() => onSelect(obj.id)}
        onContextMenu={(e) => onContextMenu(e, obj.id)}
      >
        {/* Expand arrow */}
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded((p) => !p) }}
            className="w-3 h-3 flex items-center justify-center text-zinc-500 hover:text-zinc-300 flex-shrink-0"
          >
            <svg
              className="w-2 h-2 transition-transform"
              style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
              viewBox="0 0 8 8" fill="none"
            >
              <path d="M2 1l4 3-4 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}

        <TypeIcon type={obj.type} />

        {isRenaming ? (
          <RenameInput
            initialValue={obj.name}
            onCommit={(v) => onRenameCommit(obj.id, v)}
            onCancel={onRenameCancel}
          />
        ) : (
          <span className="flex-1 min-w-0 text-[11px] font-mono truncate">{obj.name}</span>
        )}

        {/* Type badge on hover */}
        {!isRenaming && (
          <span className="text-[9px] text-zinc-700 group-hover:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity ml-auto flex-shrink-0">
            {obj.type}
          </span>
        )}
      </div>

      {hasChildren && expanded && (
        <div>
          {obj.children!.map((child) => (
            <ObjectRow
              key={child.id}
              obj={child}
              depth={depth + 1}
              selectedId={selectedId}
              renamingId={renamingId}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              onRenameCommit={onRenameCommit}
              onRenameCancel={onRenameCancel}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main ObjectList
// ---------------------------------------------------------------------------

export function ObjectList({
  objects,
  selectedId,
  onSelect,
  onDelete,
  onDuplicate,
  onRename,
  className = '',
}: ObjectListProps) {
  const [search, setSearch] = useState('')
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close context menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (contextMenu && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [contextMenu])

  const handleContextMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, objectId: id })
    onSelect(id)
  }, [onSelect])

  const filterObjects = useCallback(
    (list: SceneObject[], query: string): SceneObject[] => {
      if (!query) return list
      return list
        .map((obj) => {
          const matchesSelf = obj.name.toLowerCase().includes(query.toLowerCase())
          const filteredChildren = filterObjects(obj.children ?? [], query)
          if (matchesSelf || filteredChildren.length > 0) {
            return { ...obj, children: filteredChildren }
          }
          return null
        })
        .filter(Boolean) as SceneObject[]
    },
    [],
  )

  const filtered = filterObjects(objects, search)

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full overflow-hidden ${className}`}
      style={{ background: '#111113' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Scene</span>
        <span className="text-[10px] text-zinc-600 font-mono">{objects.length}</span>
      </div>

      {/* Search */}
      <div className="px-2 py-1.5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="relative">
          <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter..."
            className="w-full text-[11px] font-mono text-zinc-300 placeholder-zinc-600 pl-7 pr-2 py-1 rounded focus:outline-none"
            style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.06)', caretColor: '#D4AF37' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div
        className="flex-1 overflow-y-auto py-1 min-h-0"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
      >
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center px-4">
            <p className="text-[11px] text-zinc-600">
              {search ? 'No objects match your filter' : 'No objects in scene'}
            </p>
          </div>
        ) : (
          filtered.map((obj) => (
            <ObjectRow
              key={obj.id}
              obj={obj}
              depth={0}
              selectedId={selectedId}
              renamingId={renamingId}
              onSelect={onSelect}
              onContextMenu={handleContextMenu}
              onRenameCommit={(id, name) => {
                onRename(id, name)
                setRenamingId(null)
              }}
              onRenameCancel={() => setRenamingId(null)}
            />
          ))
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-[9999] py-1 rounded-lg overflow-hidden"
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 160),
            top: Math.min(contextMenu.y, window.innerHeight - 140),
            background: '#18181b',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            minWidth: '144px',
          }}
        >
          {[
            {
              label: 'Rename',
              icon: (
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                  <path d="M11 2l3 3-9 9H2v-3L11 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                </svg>
              ),
              action: () => {
                setRenamingId(contextMenu.objectId)
                setContextMenu(null)
              },
            },
            {
              label: 'Duplicate',
              icon: (
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                  <rect x="6" y="6" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M4 10H3a1 1 0 01-1-1V3a1 1 0 011-1h6a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
              ),
              action: () => {
                onDuplicate(contextMenu.objectId)
                setContextMenu(null)
              },
            },
            {
              label: 'Copy',
              icon: (
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="2" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                  <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
              ),
              action: () => {
                const obj = objects.find((o) => o.id === contextMenu.objectId)
                if (obj) navigator.clipboard.writeText(JSON.stringify(obj, null, 2)).catch(() => {})
                setContextMenu(null)
              },
            },
            { divider: true },
            {
              label: 'Delete',
              danger: true,
              icon: (
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                  <path d="M3 5h10M6 5V3h4v2M6 8v5M10 8v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  <rect x="2" y="5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
              ),
              action: () => {
                onDelete(contextMenu.objectId)
                setContextMenu(null)
              },
            },
          ].map((item, i) => {
            if ('divider' in item && item.divider) {
              return <div key={i} className="my-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            }
            const menuItem = item as { label: string; icon: React.ReactNode; action: () => void; danger?: boolean }
            return (
              <button
                key={menuItem.label}
                onClick={menuItem.action}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-[11px] transition-colors text-left ${
                  menuItem.danger
                    ? 'text-red-400 hover:bg-red-500/10'
                    : 'text-zinc-300 hover:bg-white/8 hover:text-white'
                }`}
              >
                {menuItem.icon}
                {menuItem.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
