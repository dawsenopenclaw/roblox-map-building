'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SerializedMessage {
  id: string
  role: string
  content: string
  tokensUsed?: number
  timestamp: string // ISO string for JSON serialization
  model?: string
  buildResult?: unknown
}

export interface SerializedSceneBlock {
  id: string
  color: string
  darkColor: string
  topColor: string
  x: number
  y: number
  w: number
  h: number
  spawned: boolean
}

export interface ProjectData {
  id: string
  name: string
  label?: string // User-defined category label (e.g., "Tycoon", "Obby", "RPG")
  createdAt: string
  updatedAt: string
  messages: SerializedMessage[]
  sceneBlocks: SerializedSceneBlock[]
  messageCount: number
  objectCount: number
}

// ─── Storage helpers ────────────────────────────────────────────────────────────

const PROJECTS_INDEX_KEY = 'forje_projects_index'
const PROJECT_KEY_PREFIX = 'forje_project_'
const CURRENT_PROJECT_KEY = 'forje_current_project_id'

const MAX_PROJECTS = 20
const MAX_MESSAGES_PER_PROJECT = 100

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// ─── Named project CRUD (exported standalone functions) ────────────────────────

/**
 * Save a named project explicitly. Trims messages to MAX_MESSAGES_PER_PROJECT.
 * Returns the saved ProjectData.
 */
export function saveProject(
  name: string,
  messages: SerializedMessage[],
  sceneBlocks: SerializedSceneBlock[],
  existingId?: string,
): ProjectData {
  const id = existingId ?? generateId()
  const now = new Date().toISOString()
  const trimmedMessages = messages.slice(-MAX_MESSAGES_PER_PROJECT)
  const data: ProjectData = {
    id,
    name: name.trim() || 'Untitled Project',
    createdAt: (() => {
      try {
        const existing = loadProjectData(id)
        return existing?.createdAt ?? now
      } catch { return now }
    })(),
    updatedAt: now,
    messages: trimmedMessages,
    sceneBlocks,
    messageCount: trimmedMessages.filter((m) => m.role === 'user' || m.role === 'assistant').length,
    objectCount: sceneBlocks.length,
  }
  saveProjectData(data)
  return data
}

/**
 * Load a project by id. Returns the ProjectData or null if not found.
 */
export function loadProject(id: string): ProjectData | null {
  return loadProjectData(id)
}

/**
 * Get a single project's data without loading (alias for loadProject).
 */
export function getProject(id: string): ProjectData | null {
  return loadProjectData(id)
}

/**
 * Rename an existing project. No-op if the project doesn't exist.
 */
export function renameProject(id: string, newName: string): void {
  const existing = loadProjectData(id)
  if (!existing) return
  saveProjectData({
    ...existing,
    name: newName.trim() || 'Untitled Project',
    updatedAt: new Date().toISOString(),
  })
}

/**
 * Set a category label on a project (e.g., "Tycoon", "Obby", "RPG").
 */
export function labelProject(id: string, label: string): void {
  const existing = loadProjectData(id)
  if (!existing) return
  saveProjectData({
    ...existing,
    label: label.trim() || undefined,
    updatedAt: new Date().toISOString(),
  })
}

export function listProjects(): ProjectData[] {
  try {
    const index = localStorage.getItem(PROJECTS_INDEX_KEY)
    if (!index) return []
    const ids: string[] = JSON.parse(index)
    const projects: ProjectData[] = []
    for (const id of ids) {
      const raw = localStorage.getItem(`${PROJECT_KEY_PREFIX}${id}`)
      if (raw) {
        try { projects.push(JSON.parse(raw) as ProjectData) } catch { /* skip corrupt */ }
      }
    }
    return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  } catch {
    return []
  }
}

export function deleteProject(id: string): void {
  try {
    localStorage.removeItem(`${PROJECT_KEY_PREFIX}${id}`)
    const index = localStorage.getItem(PROJECTS_INDEX_KEY)
    if (index) {
      const ids: string[] = JSON.parse(index)
      localStorage.setItem(PROJECTS_INDEX_KEY, JSON.stringify(ids.filter((i) => i !== id)))
    }
    const currentId = localStorage.getItem(CURRENT_PROJECT_KEY)
    if (currentId === id) localStorage.removeItem(CURRENT_PROJECT_KEY)
  } catch { /* ignore */ }
}

function saveProjectData(data: ProjectData): void {
  try {
    localStorage.setItem(`${PROJECT_KEY_PREFIX}${data.id}`, JSON.stringify(data))
    const index = localStorage.getItem(PROJECTS_INDEX_KEY)
    const ids: string[] = index ? JSON.parse(index) : []
    if (!ids.includes(data.id)) {
      // Enforce MAX_PROJECTS: evict oldest if at cap
      if (ids.length >= MAX_PROJECTS) {
        const evictId = ids[ids.length - 1]
        if (evictId) localStorage.removeItem(`${PROJECT_KEY_PREFIX}${evictId}`)
        ids.pop()
      }
      ids.unshift(data.id)
      localStorage.setItem(PROJECTS_INDEX_KEY, JSON.stringify(ids))
    } else {
      // Re-sort: move updated project to front
      const reordered = [data.id, ...ids.filter((i) => i !== data.id)]
      localStorage.setItem(PROJECTS_INDEX_KEY, JSON.stringify(reordered))
    }
    localStorage.setItem(CURRENT_PROJECT_KEY, data.id)
  } catch { /* quota exceeded etc */ }
}

function loadProjectData(id: string): ProjectData | null {
  try {
    const raw = localStorage.getItem(`${PROJECT_KEY_PREFIX}${id}`)
    return raw ? (JSON.parse(raw) as ProjectData) : null
  } catch {
    return null
  }
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

interface UseProjectOptions {
  /** Serialized messages to persist */
  messages: SerializedMessage[]
  /** Serialized scene blocks to persist */
  sceneBlocks: SerializedSceneBlock[]
}

interface UseProjectReturn {
  projectId: string
  projectName: string
  setProjectName: (name: string) => void
  savedAt: Date | null
  isSaved: boolean
  /** Force an immediate save */
  saveNow: () => void
}

export function useProject({ messages, sceneBlocks }: UseProjectOptions): UseProjectReturn {
  // Resolve or create project ID (stable across renders)
  const [projectId] = useState<string>(() => {
    try {
      const existing = localStorage.getItem(CURRENT_PROJECT_KEY)
      if (existing && localStorage.getItem(`${PROJECT_KEY_PREFIX}${existing}`)) {
        return existing
      }
    } catch { /* ignore */ }
    return generateId()
  })

  // Load initial name from storage
  const [projectName, setProjectNameState] = useState<string>(() => {
    try {
      const existing = localStorage.getItem(CURRENT_PROJECT_KEY)
      if (existing) {
        const data = loadProjectData(existing)
        if (data) return data.name
      }
    } catch { /* ignore */ }
    return 'Untitled Project'
  })

  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const pendingRef = useRef(false)
  const nameRef = useRef(projectName)
  nameRef.current = projectName

  const doSave = useCallback(() => {
    const now = new Date().toISOString()
    const data: ProjectData = {
      id: projectId,
      name: nameRef.current,
      createdAt: (() => {
        try {
          const existing = loadProjectData(projectId)
          return existing?.createdAt ?? now
        } catch { return now }
      })(),
      updatedAt: now,
      messages,
      sceneBlocks,
      messageCount: messages.filter((m) => m.role === 'user' || m.role === 'assistant').length,
      objectCount: sceneBlocks.length,
    }
    saveProjectData(data)
    setSavedAt(new Date())
    setIsSaved(true)
    pendingRef.current = false
  }, [projectId, messages, sceneBlocks])

  // Debounced auto-save: 1.5s after last change
  useEffect(() => {
    setIsSaved(false)
    pendingRef.current = true
    const timer = setTimeout(doSave, 1500)
    return () => clearTimeout(timer)
  }, [messages, sceneBlocks, projectName, doSave])

  const setProjectName = useCallback((name: string) => {
    setProjectNameState(name)
    nameRef.current = name
  }, [])

  return {
    projectId,
    projectName,
    setProjectName,
    savedAt,
    isSaved,
    saveNow: doSave,
  }
}
