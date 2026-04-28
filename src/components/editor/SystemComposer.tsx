'use client'

/**
 * SystemComposer — Visual game system picker.
 * Users check which systems they want, dependencies auto-resolve,
 * and the multi-script pipeline generates all systems integrated.
 *
 * Unique to ForjeGames — no competitor has this.
 */

import { useState, useCallback, useMemo } from 'react'

interface GameSystem {
  id: string
  name: string
  icon: string
  description: string
  dependencies: string[] // IDs of required systems
}

type SystemCategory = 'Core' | 'Economy' | 'Combat' | 'Social' | 'World' | 'UI' | 'Monetization' | 'Advanced'

interface CategorizedSystem extends GameSystem {
  category: SystemCategory
}

const GAME_SYSTEMS: CategorizedSystem[] = [
  // Core
  { id: 'inventory', name: 'Inventory', icon: '🎒', description: 'Item storage, equipping, stacking', dependencies: [], category: 'Core' },
  { id: 'datastore', name: 'Data Save', icon: '💾', description: 'Player data persistence', dependencies: [], category: 'Core' },
  { id: 'spawning', name: 'Spawn System', icon: '📍', description: 'Spawn points, respawning', dependencies: [], category: 'Core' },
  { id: 'teams', name: 'Teams', icon: '👥', description: 'Team assignment, colors, balancing', dependencies: [], category: 'Core' },
  { id: 'rounds', name: 'Round System', icon: '🔄', description: 'Game rounds, timers, intermission', dependencies: [], category: 'Core' },
  { id: 'teleport', name: 'Teleportation', icon: '🌀', description: 'Place-to-place, zone warps', dependencies: [], category: 'Core' },

  // Economy
  { id: 'shop', name: 'Shop', icon: '🏪', description: 'Buy/sell items, currency, pricing', dependencies: ['inventory'], category: 'Economy' },
  { id: 'trading', name: 'Trading', icon: '🤝', description: 'Player-to-player item exchange', dependencies: ['inventory'], category: 'Economy' },
  { id: 'currency', name: 'Currency', icon: '💰', description: 'Multiple currencies, earning, spending', dependencies: [], category: 'Economy' },
  { id: 'auction', name: 'Auction House', icon: '🏛️', description: 'Player marketplace, bidding', dependencies: ['inventory', 'currency'], category: 'Economy' },
  { id: 'crafting', name: 'Crafting', icon: '🔨', description: 'Recipes, materials, workbenches', dependencies: ['inventory'], category: 'Economy' },
  { id: 'droppers', name: 'Tycoon Droppers', icon: '🏭', description: 'Conveyor belts, upgraders, collectors', dependencies: ['currency'], category: 'Economy' },

  // Combat
  { id: 'combat', name: 'Combat', icon: '⚔️', description: 'Health, damage, abilities, knockback', dependencies: [], category: 'Combat' },
  { id: 'weapons', name: 'Weapons', icon: '🗡️', description: 'Swords, guns, bows, ammo', dependencies: ['combat'], category: 'Combat' },
  { id: 'abilities', name: 'Abilities', icon: '✨', description: 'Cooldowns, mana, skill trees', dependencies: ['combat'], category: 'Combat' },
  { id: 'bossfights', name: 'Boss Fights', icon: '👹', description: 'Boss AI, phases, loot drops', dependencies: ['combat', 'npcs'], category: 'Combat' },
  { id: 'pvp', name: 'PvP Arena', icon: '🥊', description: 'Player vs player, matchmaking', dependencies: ['combat', 'teams'], category: 'Combat' },
  { id: 'tower-defense', name: 'Tower Defense', icon: '🗼', description: 'Towers, waves, paths, upgrades', dependencies: ['combat', 'currency'], category: 'Combat' },

  // Social
  { id: 'npcs', name: 'NPCs', icon: '🧑', description: 'Dialogue, spawning, pathfinding', dependencies: [], category: 'Social' },
  { id: 'quests', name: 'Quests', icon: '📜', description: 'Objectives, tracking, rewards', dependencies: [], category: 'Social' },
  { id: 'pets', name: 'Pets', icon: '🐾', description: 'Following, leveling, hatching, rarity', dependencies: [], category: 'Social' },
  { id: 'friends', name: 'Friends', icon: '💬', description: 'Friend list, invites, party system', dependencies: [], category: 'Social' },
  { id: 'guilds', name: 'Guilds/Clans', icon: '🛡️', description: 'Clan creation, ranks, wars', dependencies: ['friends'], category: 'Social' },
  { id: 'emotes', name: 'Emotes', icon: '💃', description: 'Dance, wave, custom animations', dependencies: [], category: 'Social' },

  // World
  { id: 'vehicles', name: 'Vehicles', icon: '🚗', description: 'Cars, boats, planes with controls', dependencies: [], category: 'World' },
  { id: 'daynight', name: 'Day/Night', icon: '🌙', description: 'Time cycle, lighting changes', dependencies: [], category: 'World' },
  { id: 'weather', name: 'Weather', icon: '🌧️', description: 'Rain, snow, fog, thunder', dependencies: [], category: 'World' },
  { id: 'farming', name: 'Farming', icon: '🌾', description: 'Planting, growing, harvesting', dependencies: ['inventory'], category: 'World' },
  { id: 'fishing', name: 'Fishing', icon: '🎣', description: 'Casting, reeling, fish rarity', dependencies: ['inventory'], category: 'World' },
  { id: 'mining', name: 'Mining', icon: '⛏️', description: 'Ore nodes, pickaxes, smelting', dependencies: ['inventory'], category: 'World' },

  // UI
  { id: 'leaderboard', name: 'Leaderboard', icon: '🏆', description: 'Rankings, stats display', dependencies: [], category: 'UI' },
  { id: 'minimap', name: 'Minimap', icon: '🗺️', description: 'Map overlay, markers, zoom', dependencies: [], category: 'UI' },
  { id: 'healthbar', name: 'Health Bar', icon: '❤️', description: 'HP display, damage numbers', dependencies: ['combat'], category: 'UI' },
  { id: 'settings', name: 'Settings Menu', icon: '⚙️', description: 'Graphics, audio, controls', dependencies: [], category: 'UI' },
  { id: 'notifications', name: 'Notifications', icon: '🔔', description: 'Pop-ups, toasts, alerts', dependencies: [], category: 'UI' },
  { id: 'loading', name: 'Loading Screen', icon: '⏳', description: 'Progress bar, tips, branding', dependencies: [], category: 'UI' },

  // Monetization
  { id: 'gamepass', name: 'Game Passes', icon: '🎫', description: 'VIP, speed boost, double XP', dependencies: [], category: 'Monetization' },
  { id: 'devproducts', name: 'Dev Products', icon: '💎', description: 'Coins, gems, revives', dependencies: ['currency'], category: 'Monetization' },
  { id: 'premium', name: 'Premium Perks', icon: '👑', description: 'Roblox Premium benefits', dependencies: [], category: 'Monetization' },
  { id: 'battlepass', name: 'Battle Pass', icon: '🎖️', description: 'Seasons, tiers, exclusive rewards', dependencies: ['progression'], category: 'Monetization' },
  { id: 'dailyrewards', name: 'Daily Rewards', icon: '🎁', description: 'Login streaks, reward calendar', dependencies: [], category: 'Monetization' },
  { id: 'codes', name: 'Promo Codes', icon: '🔑', description: 'Redeem codes for items/currency', dependencies: ['inventory'], category: 'Monetization' },

  // Advanced
  { id: 'progression', name: 'Leveling', icon: '📊', description: 'XP, levels, stat upgrades', dependencies: [], category: 'Advanced' },
  { id: 'achievements', name: 'Achievements', icon: '🏅', description: 'Badges, milestones, unlocks', dependencies: [], category: 'Advanced' },
  { id: 'rebirth', name: 'Rebirth/Prestige', icon: '♻️', description: 'Reset progress for multipliers', dependencies: ['progression'], category: 'Advanced' },
  { id: 'gacha', name: 'Egg Hatching', icon: '🥚', description: 'Lootboxes, rarity, luck boosts', dependencies: ['pets', 'currency'], category: 'Advanced' },
  { id: 'obby', name: 'Obby Checkpoints', icon: '🏁', description: 'Stages, saves, skips', dependencies: [], category: 'Advanced' },
  { id: 'simulator', name: 'Simulator Loop', icon: '🔁', description: 'Click-collect-upgrade-rebirth', dependencies: ['progression', 'currency'], category: 'Advanced' },
]

const CATEGORIES: SystemCategory[] = ['Core', 'Economy', 'Combat', 'Social', 'World', 'UI', 'Monetization', 'Advanced']

interface SystemComposerProps {
  onGenerate: (prompt: string) => void
  loading?: boolean
}

export function SystemComposer({ onGenerate, loading }: SystemComposerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<SystemCategory | 'All'>('All')

  const filtered = useMemo(() => {
    let systems = GAME_SYSTEMS as CategorizedSystem[]
    if (activeCategory !== 'All') systems = systems.filter(s => s.category === activeCategory)
    if (search.trim()) {
      const q = search.toLowerCase()
      systems = systems.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.category.toLowerCase().includes(q))
    }
    return systems
  }, [search, activeCategory])

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

      {/* Search */}
      <div style={{ marginBottom: 10 }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search systems..."
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
            color: '#E4E4E7',
            fontSize: 12,
            outline: 'none',
          }}
        />
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
        {(['All', ...CATEGORIES] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: 'none',
              background: activeCategory === cat ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)',
              color: activeCategory === cat ? '#D4AF37' : '#71717A',
              fontSize: 10,
              fontWeight: activeCategory === cat ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* System grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12, maxHeight: 280, overflowY: 'auto' }}>
        {filtered.map(system => {
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
