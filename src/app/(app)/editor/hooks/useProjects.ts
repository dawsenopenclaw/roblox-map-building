'use client'

import { useCallback } from 'react'
import {
  saveProject,
  loadProject,
  listProjects,
  deleteProject,
  renameProject,
  type SerializedMessage,
  type SerializedSceneBlock,
  type ProjectData,
} from '@/hooks/useProject'

export type { ProjectData, SerializedMessage, SerializedSceneBlock }

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface UseProjectsReturn {
  /** Save current editor state as a named project. Returns the saved project. */
  saveProject: (
    name: string,
    messages: SerializedMessage[],
    sceneBlocks: SerializedSceneBlock[],
    existingId?: string,
  ) => ProjectData
  /** Load a project by id. Returns null if not found. */
  loadProject: (id: string) => ProjectData | null
  /** List all saved projects, newest first. */
  listProjects: () => ProjectData[]
  /** Delete a project by id. */
  deleteProject: (id: string) => void
  /** Rename a project in place. */
  renameProject: (id: string, newName: string) => void
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

/**
 * Editor-local hook that wraps the shared project CRUD utilities.
 * Max 20 projects, each capped at 100 messages (enforced in saveProject).
 */
export function useProjects(): UseProjectsReturn {
  const save = useCallback(
    (
      name: string,
      messages: SerializedMessage[],
      sceneBlocks: SerializedSceneBlock[],
      existingId?: string,
    ) => saveProject(name, messages, sceneBlocks, existingId),
    [],
  )

  const load = useCallback((id: string) => loadProject(id), [])

  const list = useCallback(() => listProjects(), [])

  const del = useCallback((id: string) => deleteProject(id), [])

  const rename = useCallback((id: string, newName: string) => renameProject(id, newName), [])

  return {
    saveProject: save,
    loadProject: load,
    listProjects: list,
    deleteProject: del,
    renameProject: rename,
  }
}
