'use client'

import React, { useState, useCallback } from 'react'
import type { Checkpoint } from '@/lib/checkpoints'

interface CheckpointPanelProps {
  checkpoints: Checkpoint[]
  messageCount: number
  /** Called to create a new checkpoint with optional label */
  onSave: (label?: string) => void
  /** Called when user wants to restore to a checkpoint */
  onRestore: (checkpointId: string) => void
  /** Called when user wants to delete a checkpoint */
  onDelete: (checkpointId: string) => void
  /** Whether the AI is currently loading/streaming */
  loading: boolean
}

export function CheckpointPanel({
  checkpoints,
  messageCount,
  onSave,
  onRestore,
  onDelete,
  loading,
}: CheckpointPanelProps) {
  const [showInput, setShowInput] = useState(false)
  const [labelInput, setLabelInput] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const handleCreate = useCallback(() => {
    if (messageCount < 1) return
    const label = labelInput.trim() || undefined
    onSave(label)
    setLabelInput('')
    setShowInput(false)
  }, [messageCount, labelInput, onSave])

  const handleRestore = useCallback((cpId: string) => {
    onRestore(cpId)
  }, [onRestore])

  const handleDelete = useCallback((cpId: string) => {
    onDelete(cpId)
    setConfirmDeleteId(null)
  }, [onDelete])

  if (messageCount < 1) return null

  return (
    <div style={{
      padding: '8px 10px',
      borderTop: '1px solid rgba(212,175,55,0.12)',
      background: 'rgba(0,0,0,0.15)',
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: checkpoints.length > 0 || showInput ? 6 : 0,
      }}>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'rgba(212,175,55,0.7)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontFamily: 'Inter, sans-serif',
        }}>
          Checkpoints
        </span>
        <button
          onClick={() => setShowInput((v) => !v)}
          disabled={loading}
          title="Save checkpoint"
          style={{
            height: 22,
            padding: '0 8px',
            borderRadius: 6,
            border: '1px solid rgba(212,175,55,0.25)',
            background: 'rgba(212,175,55,0.08)',
            color: loading ? 'rgba(255,255,255,0.2)' : 'rgba(212,175,55,0.85)',
            fontSize: 10,
            fontWeight: 500,
            fontFamily: 'Inter, sans-serif',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M8 3v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Save
        </button>
      </div>

      {/* Create checkpoint input */}
      {showInput && (
        <div style={{
          display: 'flex',
          gap: 4,
          marginBottom: 6,
          animation: 'msgFadeUp 0.15s ease-out forwards',
        }}>
          <input
            type="text"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowInput(false) }}
            placeholder="Label (optional)"
            autoFocus
            style={{
              flex: 1,
              height: 24,
              padding: '0 8px',
              borderRadius: 6,
              border: '1px solid rgba(212,175,55,0.2)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.8)',
              fontSize: 11,
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
            }}
          />
          <button
            onClick={handleCreate}
            style={{
              height: 24,
              padding: '0 10px',
              borderRadius: 6,
              border: 'none',
              background: 'rgba(212,175,55,0.2)',
              color: '#D4AF37',
              fontSize: 10,
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Save
          </button>
        </div>
      )}

      {/* Checkpoint list */}
      {checkpoints.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 140, overflowY: 'auto' }}>
          {checkpoints.map((cp) => (
            <div
              key={cp.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 6px',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                transition: 'all 0.15s',
              }}
            >
              {/* Checkpoint icon */}
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="8" cy="8" r="3" stroke="rgba(212,175,55,0.6)" strokeWidth="1.2"/>
                <circle cx="8" cy="8" r="1" fill="rgba(212,175,55,0.6)"/>
              </svg>

              {/* Label + time */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.7)',
                  fontFamily: 'Inter, sans-serif',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {cp.label}
                </div>
                <div style={{
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.25)',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  {cp.messageIndex} msgs · {new Date(cp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Restore button */}
              <button
                onClick={() => handleRestore(cp.id)}
                disabled={loading}
                title="Restore to this checkpoint"
                style={{
                  height: 20,
                  padding: '0 6px',
                  borderRadius: 4,
                  border: '1px solid rgba(74,222,128,0.2)',
                  background: 'rgba(74,222,128,0.06)',
                  color: loading ? 'rgba(255,255,255,0.2)' : 'rgba(74,222,128,0.8)',
                  fontSize: 9,
                  fontWeight: 600,
                  fontFamily: 'Inter, sans-serif',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
              >
                Restore
              </button>

              {/* Delete button */}
              {confirmDeleteId === cp.id ? (
                <button
                  onClick={() => handleDelete(cp.id)}
                  style={{
                    height: 20,
                    padding: '0 6px',
                    borderRadius: 4,
                    border: '1px solid rgba(239,68,68,0.3)',
                    background: 'rgba(239,68,68,0.12)',
                    color: 'rgba(239,68,68,0.9)',
                    fontSize: 9,
                    fontWeight: 600,
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  Confirm
                </button>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(cp.id)}
                  title="Delete checkpoint"
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.02)',
                    color: 'rgba(255,255,255,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.15s',
                  }}
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
