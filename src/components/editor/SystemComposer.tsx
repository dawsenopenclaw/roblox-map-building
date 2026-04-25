'use client'

/**
 * SystemComposer — Visual game system picker.
 * Users check which systems they want, dependencies auto-resolve,
 * and the multi-script pipeline generates all systems integrated.
 *
 * Unique to ForjeGames — no competitor has this.
 */

import { useState, useCallback } from 'react'

interface GameSystem {
  id: string
  name: string
  icon: string
  description: string
  dependencies: string[] // IDs of required systems
}

const GAME_SYSTEMS: GameSystem[] = [
  { id: 'inventory', name: 'Inventory', icon: '🎒', description: 'Item storage, equipping, stacking', dependencies: [] },
  { id: 'combat', name: 'Combat', icon: '⚔️', description: 'Health, damage, abilities, knockback', dependencies: [] },
  { id: 'shop', name: 'Shop', icon: '🏪', description: 'Buy/sell items, currency, pricing', dependencies: ['inventory'] },
  { id: 'quests', name: 'Quests', icon: '📜', description: 'Objectives, tracking, rewards', dependencies: [] },
  { id: 'npcs', name: 'NPCs', icon: '🧑', description: 'Dialogue, spawning, pathfinding', dependencies: [] },
  { id: 'vehicles', name: 'Vehicles', icon: '🚗', description: 'Driving, seats, physics', dependencies: [] },
  { id: 'pets', name: 'Pets', icon: '🐾', description: 'Following, leveling, abilities', dependencies: [] },
  { id: 'crafting', name: 'Crafting', icon: '🔨', description: 'Recipes, materials, workbenches', dependencies: ['inventory'] },
  { id: 'trading', name: 'Trading', icon: '🤝', description: 'Player-to-player item exchange', dependencies: ['inventory'] },
  { id: 'progression', name: 'Leveling', icon: '📊', description: 'XP, levels, stat upgrades', dependencies: [] },
  { id: 'dailyrewards', name: 'Daily Rewards', icon: '🎁', description: 'Login streaks, reward calendar', dependencies: [] },
  { id: 'leaderboard', name: 'Leaderboard', icon: '🏆', description: 'Rankings, stats display', dependencies: [] },
]

interface SystemComposerProps {
  onGenerate: (prompt: string) => void
  loading?: boolean
}

export function SystemComposer({ onGenerate, loading }: SystemComposerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState(false)

  const toggleSystem = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
        // Auto-add dependencies
        const system = GAME_SYSTEMS.find(s => s.id === id)
        if (system) {
          for (const dep of system.dependencies) {
            next.add(dep)
          }
        }
      }
      return next
    })
  }, [])

  const handleGenerate = useCallback(() => {
    if (selected.size === 0) return
    const systems = GAME_SYSTEMS.filter(s => selected.has(s.id))
    const prompt = `Create a complete, integrated game system with the following components: ${systems.map(s => `${s.name} (${s.description})`).join(', ')}. All systems should work together — for example, if there's a shop and inventory, purchased items should go into inventory. Generate all the necessary Scripts, LocalScripts, and ModuleScripts. Use RemoteEvents for client-server communication.`
    onGenerate(prompt)
  }, [selected, onGenerate])

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 8,
          border: '1px solid rgba(212,175,55,0.2)',
          background: 'rgba(212,175,55,0.05)',
          color: '#D4AF37',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        System Composer
      </button>
    )
  }

  return (
    <div
      style={{
        background: 'rgba(10,12,24,0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 16,
        backdropFilter: 'blur(20px)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#D4AF37' }}>
          Game System Composer
        </span>
        <button
          onClick={() => setExpanded(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#52525B',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p style={{ fontSize: 11, color: '#71717A', marginBottom: 12, lineHeight: 1.4 }}>
        Pick the systems you want. Dependencies auto-resolve. We generate all scripts integrated.
      </p>

      {/* System grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
        {GAME_SYSTEMS.map(system => {
          const isSelected = selected.has(system.id)
          const isDependency = !isSelected && Array.from(selected).some(sid => {
            const s = GAME_SYSTEMS.find(gs => gs.id === sid)
            return s?.dependencies.includes(system.id)
          })

          return (
            <button
              key={system.id}
              onClick={() => toggleSystem(system.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                padding: '8px 4px',
                borderRadius: 8,
                border: `1px solid ${isSelected ? 'rgba(212,175,55,0.4)' : isDependency ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.06)'}`,
                background: isSelected ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.02)',
                color: isSelected ? '#D4AF37' : '#A1A1AA',
                fontSize: 10,
                fontWeight: isSelected ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 16 }}>{system.icon}</span>
              <span>{system.name}</span>
            </button>
          )
        })}
      </div>

      {/* Selected summary + generate button */}
      {selected.size > 0 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#71717A', flex: 1 }}>
            {selected.size} system{selected.size > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              border: 'none',
              background: loading ? 'rgba(212,175,55,0.3)' : '#D4AF37',
              color: '#0a0a0a',
              fontSize: 12,
              fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {loading ? 'Generating...' : 'Generate All'}
          </button>
        </div>
      )}
    </div>
  )
}
