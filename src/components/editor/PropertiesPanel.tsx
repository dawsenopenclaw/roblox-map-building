'use client'

import { useState, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SceneObject {
  id: string
  type: 'part' | 'model' | 'npc' | 'terrain' | 'script' | 'light' | 'spawn'
  name: string
  position: { x: number; y: number; z: number }
  size: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  color: string
  material: string
  transparency: number
  anchored: boolean
  canCollide: boolean
  castShadow?: boolean
  reflectance?: number
  properties: Record<string, unknown>
  children?: SceneObject[]
}

interface PropertiesPanelProps {
  object: SceneObject | null
  onChange: (id: string, patch: Partial<SceneObject>) => void
  className?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PART_MATERIALS = [
  'Plastic','Wood','Slate','Concrete','CorrodedMetal','DiamondPlate','Foil',
  'Grass','Ice','Marble','Granite','Brick','Pebble','Sand','Fabric',
  'SmoothPlastic','Metal','WoodPlanks','Cobblestone','Neon','Glass','ForceField',
]

const TERRAIN_BIOMES = [
  'Grass','Sand','Rock','Water','Snow','Mud','Asphalt','BasaltSmooth',
  'CrackedLava','Glacier','Ground','LeafyGrass','Limestone','Pavement',
  'SaltFlats','Sandstone','Slate','SmoothPlastic','WoodPlanks',
]

const SCRIPT_CONTEXTS = ['Legacy','Server','Client']

const COLOR_SWATCHES = [
  '#FFFFFF','#F8F8F8','#C0C0C0','#808080','#404040','#1A1A1A',
  '#FF4444','#FF8800','#FFCC00','#44DD44','#00AAFF','#8844FF',
  '#FF69B4','#00FFCC','#D4AF37','#8B4513','#228B22','#4169E1',
]

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({
  label,
  expanded,
  onToggle,
}: {
  label: string
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-white/4"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <svg
        className="w-3 h-3 text-zinc-500 flex-shrink-0 transition-transform"
        style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
        viewBox="0 0 12 12" fill="none"
      >
        <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">{label}</span>
    </button>
  )
}

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <span className="text-[11px] text-zinc-500 w-20 flex-shrink-0 font-mono">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

function NumberInput({
  value,
  onChange,
  step = 0.1,
  min,
  max,
}: {
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
}) {
  return (
    <div className="flex items-center rounded overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#18181b' }}>
      <button
        onClick={() => onChange(Math.max(min ?? -Infinity, parseFloat((value - step).toFixed(4))))}
        className="w-5 h-6 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/8 transition-colors text-xs flex-shrink-0 border-r border-white/8"
      >−</button>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          const v = parseFloat(e.target.value)
          if (!isNaN(v)) onChange(v)
        }}
        className="flex-1 min-w-0 bg-transparent text-[11px] font-mono text-zinc-200 text-center focus:outline-none focus:text-white py-1 px-1"
        style={{ caretColor: '#D4AF37' }}
      />
      <button
        onClick={() => onChange(Math.min(max ?? Infinity, parseFloat((value + step).toFixed(4))))}
        className="w-5 h-6 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/8 transition-colors text-xs flex-shrink-0 border-l border-white/8"
      >+</button>
    </div>
  )
}

function Vec3Input({
  label,
  value,
  onChange,
  step,
}: {
  label: string
  value: { x: number; y: number; z: number }
  onChange: (v: { x: number; y: number; z: number }) => void
  step?: number
}) {
  return (
    <>
      <PropRow label={`${label} X`}>
        <NumberInput value={value.x} step={step} onChange={(v) => onChange({ ...value, x: v })} />
      </PropRow>
      <PropRow label={`${label} Y`}>
        <NumberInput value={value.y} step={step} onChange={(v) => onChange({ ...value, y: v })} />
      </PropRow>
      <PropRow label={`${label} Z`}>
        <NumberInput value={value.z} step={step} onChange={(v) => onChange({ ...value, z: v })} />
      </PropRow>
    </>
  )
}

function SliderInput({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 h-5 flex items-center">
        <div className="absolute inset-x-0 h-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <div
          className="absolute left-0 h-0.5 rounded-full"
          style={{ background: '#D4AF37', width: `${((value - min) / (max - min)) * 100}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          style={{ height: '20px' }}
        />
        <div
          className="absolute w-3 h-3 rounded-full border-2 pointer-events-none"
          style={{
            left: `calc(${((value - min) / (max - min)) * 100}% - 6px)`,
            background: '#D4AF37',
            borderColor: '#111113',
            boxShadow: '0 0 0 1px #D4AF37',
          }}
        />
      </div>
      <span className="text-[10px] font-mono text-zinc-400 w-8 text-right flex-shrink-0">
        {value.toFixed(2)}
      </span>
    </div>
  )
}

function ToggleSwitch({
  value,
  onChange,
}: {
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="relative flex-shrink-0 w-8 h-4 rounded-full transition-colors"
      style={{ background: value ? '#D4AF37' : 'rgba(255,255,255,0.12)' }}
      role="switch"
      aria-checked={value}
    >
      <span
        className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform"
        style={{ transform: value ? 'translateX(18px)' : 'translateX(2px)' }}
      />
    </button>
  )
}

function ColorInput({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowPicker((p) => !p)}
          className="w-5 h-5 rounded flex-shrink-0 border border-white/20"
          style={{ background: value }}
          aria-label="Open color picker"
        />
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => {
            const v = e.target.value
            if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v)
          }}
          className="flex-1 min-w-0 bg-transparent text-[11px] font-mono text-zinc-200 focus:outline-none focus:text-white py-1 px-2 rounded"
          style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', caretColor: '#D4AF37' }}
          maxLength={7}
        />
      </div>
      {showPicker && (
        <div
          className="absolute left-0 top-8 z-50 p-2 rounded-lg"
          style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}
        >
          <div className="grid grid-cols-6 gap-1 mb-2">
            {COLOR_SWATCHES.map((c) => (
              <button
                key={c}
                onClick={() => { onChange(c); setShowPicker(false) }}
                className="w-5 h-5 rounded border border-white/10 hover:scale-110 transition-transform"
                style={{ background: c }}
                title={c}
              />
            ))}
          </div>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-6 rounded cursor-pointer"
            style={{ background: 'transparent', border: 'none' }}
          />
        </div>
      )}
    </div>
  )
}

function SelectInput({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-[11px] font-mono text-zinc-200 rounded px-2 py-1 focus:outline-none appearance-none cursor-pointer"
      style={{
        background: '#18181b',
        border: '1px solid rgba(255,255,255,0.08)',
        caretColor: '#D4AF37',
      }}
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-[11px] font-mono text-zinc-200 rounded px-2 py-1 focus:outline-none"
      style={{
        background: '#18181b',
        border: '1px solid rgba(255,255,255,0.08)',
        caretColor: '#D4AF37',
      }}
    />
  )
}

// ---------------------------------------------------------------------------
// Property sections per type
// ---------------------------------------------------------------------------

function PartProperties({
  obj,
  update,
}: {
  obj: SceneObject
  update: (patch: Partial<SceneObject>) => void
}) {
  const [sections, setSections] = useState({ transform: true, appearance: true, behavior: true })
  const toggle = (k: keyof typeof sections) => setSections((s) => ({ ...s, [k]: !s[k] }))

  return (
    <>
      {/* Transform */}
      <SectionHeader label="Transform" expanded={sections.transform} onToggle={() => toggle('transform')} />
      {sections.transform && (
        <div className="pb-1">
          <Vec3Input label="Position" value={obj.position} step={1} onChange={(v) => update({ position: v })} />
          <Vec3Input label="Size" value={obj.size} step={0.5} onChange={(v) => update({ size: v })} />
          <Vec3Input label="Rotation" value={obj.rotation} step={5} onChange={(v) => update({ rotation: v })} />
        </div>
      )}

      {/* Appearance */}
      <SectionHeader label="Appearance" expanded={sections.appearance} onToggle={() => toggle('appearance')} />
      {sections.appearance && (
        <div className="pb-1">
          <PropRow label="Color">
            <ColorInput value={obj.color} onChange={(v) => update({ color: v })} />
          </PropRow>
          <PropRow label="Material">
            <SelectInput value={obj.material} options={PART_MATERIALS} onChange={(v) => update({ material: v })} />
          </PropRow>
          <PropRow label="Transparent">
            <SliderInput value={obj.transparency} onChange={(v) => update({ transparency: v })} />
          </PropRow>
          <PropRow label="Reflectance">
            <SliderInput value={obj.reflectance ?? 0} onChange={(v) => update({ reflectance: v })} />
          </PropRow>
        </div>
      )}

      {/* Behavior */}
      <SectionHeader label="Behavior" expanded={sections.behavior} onToggle={() => toggle('behavior')} />
      {sections.behavior && (
        <div className="pb-1">
          <PropRow label="Anchored">
            <ToggleSwitch value={obj.anchored} onChange={(v) => update({ anchored: v })} />
          </PropRow>
          <PropRow label="CanCollide">
            <ToggleSwitch value={obj.canCollide} onChange={(v) => update({ canCollide: v })} />
          </PropRow>
          <PropRow label="CastShadow">
            <ToggleSwitch value={obj.castShadow ?? true} onChange={(v) => update({ castShadow: v })} />
          </PropRow>
        </div>
      )}
    </>
  )
}

function NpcProperties({
  obj,
  update,
}: {
  obj: SceneObject
  update: (patch: Partial<SceneObject>) => void
}) {
  const [sections, setSections] = useState({ transform: true, npc: true })
  const toggle = (k: keyof typeof sections) => setSections((s) => ({ ...s, [k]: !s[k] }))
  const props = obj.properties as {
    health?: number
    walkSpeed?: number
    dialogueText?: string
    patrolRadius?: number
  }

  const updateProp = (key: string, val: unknown) =>
    update({ properties: { ...obj.properties, [key]: val } })

  return (
    <>
      <SectionHeader label="Transform" expanded={sections.transform} onToggle={() => toggle('transform')} />
      {sections.transform && (
        <div className="pb-1">
          <Vec3Input label="Position" value={obj.position} step={1} onChange={(v) => update({ position: v })} />
          <Vec3Input label="Rotation" value={obj.rotation} step={5} onChange={(v) => update({ rotation: v })} />
        </div>
      )}

      <SectionHeader label="NPC" expanded={sections.npc} onToggle={() => toggle('npc')} />
      {sections.npc && (
        <div className="pb-1">
          <PropRow label="Health">
            <NumberInput value={props.health ?? 100} step={10} min={0} max={10000} onChange={(v) => updateProp('health', v)} />
          </PropRow>
          <PropRow label="WalkSpeed">
            <NumberInput value={props.walkSpeed ?? 16} step={1} min={0} max={200} onChange={(v) => updateProp('walkSpeed', v)} />
          </PropRow>
          <PropRow label="Patrol R">
            <NumberInput value={props.patrolRadius ?? 20} step={5} min={0} onChange={(v) => updateProp('patrolRadius', v)} />
          </PropRow>
          <div className="px-3 pt-1 pb-2">
            <span className="text-[10px] text-zinc-500 font-mono block mb-1">DialogueText</span>
            <textarea
              value={(props.dialogueText as string) ?? ''}
              onChange={(e) => updateProp('dialogueText', e.target.value)}
              rows={4}
              className="w-full text-[11px] font-mono text-zinc-200 rounded px-2 py-1.5 resize-none focus:outline-none"
              style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', caretColor: '#D4AF37' }}
            />
          </div>
        </div>
      )}
    </>
  )
}

function TerrainProperties({
  obj,
  update,
}: {
  obj: SceneObject
  update: (patch: Partial<SceneObject>) => void
}) {
  const [open, setOpen] = useState(true)
  const props = obj.properties as {
    biome?: string
    sizeX?: number
    sizeZ?: number
    heightScale?: number
    waterLevel?: number
    terrainMaterial?: string
  }
  const updateProp = (key: string, val: unknown) =>
    update({ properties: { ...obj.properties, [key]: val } })

  return (
    <>
      <SectionHeader label="Terrain" expanded={open} onToggle={() => setOpen((p) => !p)} />
      {open && (
        <div className="pb-1">
          <PropRow label="Biome">
            <SelectInput value={props.biome ?? 'Grass'} options={TERRAIN_BIOMES} onChange={(v) => updateProp('biome', v)} />
          </PropRow>
          <PropRow label="Size X">
            <NumberInput value={props.sizeX ?? 512} step={32} min={16} onChange={(v) => updateProp('sizeX', v)} />
          </PropRow>
          <PropRow label="Size Z">
            <NumberInput value={props.sizeZ ?? 512} step={32} min={16} onChange={(v) => updateProp('sizeZ', v)} />
          </PropRow>
          <PropRow label="Height">
            <SliderInput value={(props.heightScale ?? 0.5)} onChange={(v) => updateProp('heightScale', v)} />
          </PropRow>
          <PropRow label="WaterLevel">
            <NumberInput value={props.waterLevel ?? 0} step={1} onChange={(v) => updateProp('waterLevel', v)} />
          </PropRow>
          <PropRow label="Material">
            <SelectInput value={props.terrainMaterial ?? 'Grass'} options={TERRAIN_BIOMES} onChange={(v) => updateProp('terrainMaterial', v)} />
          </PropRow>
        </div>
      )}
    </>
  )
}

function ScriptProperties({
  obj,
  update,
}: {
  obj: SceneObject
  update: (patch: Partial<SceneObject>) => void
}) {
  const [open, setOpen] = useState(true)
  const props = obj.properties as {
    source?: string
    runContext?: string
  }
  const updateProp = (key: string, val: unknown) =>
    update({ properties: { ...obj.properties, [key]: val } })

  const source = (props.source as string) ?? '-- Script source\n'
  const lines = source.split('\n')

  return (
    <>
      <SectionHeader label="Script" expanded={open} onToggle={() => setOpen((p) => !p)} />
      {open && (
        <div className="pb-1">
          <PropRow label="Context">
            <SelectInput value={props.runContext ?? 'Server'} options={SCRIPT_CONTEXTS} onChange={(v) => updateProp('runContext', v)} />
          </PropRow>
          <div className="px-3 pt-1.5 pb-2">
            <span className="text-[10px] text-zinc-500 font-mono block mb-1">Source</span>
            <div className="relative rounded overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              {/* Line numbers */}
              <div className="flex">
                <div
                  className="select-none text-right pr-2 pt-1.5 pb-1.5"
                  style={{ background: '#141416', minWidth: '28px' }}
                >
                  {lines.map((_, i) => (
                    <div key={i} className="text-[10px] font-mono leading-5 text-zinc-600">{i + 1}</div>
                  ))}
                </div>
                <textarea
                  value={source}
                  onChange={(e) => updateProp('source', e.target.value)}
                  rows={Math.min(20, Math.max(8, lines.length))}
                  spellCheck={false}
                  className="flex-1 text-[11px] font-mono text-zinc-200 px-2 py-1.5 resize-none focus:outline-none leading-5"
                  style={{ background: '#18181b', caretColor: '#D4AF37', tabSize: 2 }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Main PropertiesPanel
// ---------------------------------------------------------------------------

async function sendPropertyUpdate(
  instancePath: string,
  property: string,
  value: unknown,
) {
  try {
    await fetch('/api/studio/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'update_property', data: { instancePath, property, value } }),
    })
  } catch {
    // Fire-and-forget — UI is already updated optimistically
  }
}

export function PropertiesPanel({ object, onChange, className = '' }: PropertiesPanelProps) {
  const update = useCallback(
    (patch: Partial<SceneObject>) => {
      if (!object) return
      onChange(object.id, patch)

      // Send each changed key to Studio
      for (const [key, value] of Object.entries(patch)) {
        void sendPropertyUpdate(object.name, key, value)
      }
    },
    [object, onChange],
  )

  if (!object) {
    return (
      <div
        className={`flex flex-col h-full items-center justify-center text-center px-6 ${className}`}
        style={{ background: '#111113', borderLeft: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <svg className="w-5 h-5 text-zinc-600" viewBox="0 0 24 24" fill="none">
            <path d="M3 9h18M9 21V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed">Select an object to edit its properties</p>
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col h-full overflow-hidden ${className}`}
      style={{ background: '#111113', borderLeft: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <ObjectTypeIcon type={object.type} />
          <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-widest truncate">
            Properties
          </span>
        </div>
        <span className="text-[10px] text-zinc-600 font-mono ml-2 flex-shrink-0">{object.type}</span>
      </div>

      {/* Name row — always shown */}
      <div className="px-3 py-2 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-[10px] text-zinc-500 font-mono block mb-1">Name</span>
        <TextInput
          value={object.name}
          onChange={(v) => update({ name: v })}
          placeholder="Instance name"
        />
      </div>

      {/* Scrollable properties */}
      <div className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
        {(object.type === 'part' || object.type === 'model' || object.type === 'light' || object.type === 'spawn') && (
          <PartProperties obj={object} update={update} />
        )}
        {object.type === 'npc' && (
          <NpcProperties obj={object} update={update} />
        )}
        {object.type === 'terrain' && (
          <TerrainProperties obj={object} update={update} />
        )}
        {object.type === 'script' && (
          <ScriptProperties obj={object} update={update} />
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tiny type icon
// ---------------------------------------------------------------------------

function ObjectTypeIcon({ type }: { type: SceneObject['type'] }) {
  const icons: Record<SceneObject['type'], React.ReactNode> = {
    part: (
      <svg className="w-3.5 h-3.5 text-blue-400" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      </svg>
    ),
    model: (
      <svg className="w-3.5 h-3.5 text-orange-400" viewBox="0 0 16 16" fill="none">
        <path d="M8 2l5 3v6l-5 3-5-3V5l5-3z" stroke="currentColor" strokeWidth="1.3"/>
      </svg>
    ),
    npc: (
      <svg className="w-3.5 h-3.5 text-purple-400" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M2 14c0-3.31 2.69-5 6-5s6 1.69 6 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    terrain: (
      <svg className="w-3.5 h-3.5 text-green-400" viewBox="0 0 16 16" fill="none">
        <path d="M1 12l4-6 3 4 3-6 4 8H1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      </svg>
    ),
    script: (
      <svg className="w-3.5 h-3.5 text-cyan-400" viewBox="0 0 16 16" fill="none">
        <path d="M5 5l-3 3 3 3M11 5l3 3-3 3M9 3l-2 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    light: (
      <svg className="w-3.5 h-3.5 text-yellow-400" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.22 3.22l1.41 1.41M11.37 11.37l1.41 1.41M3.22 12.78l1.41-1.41M11.37 4.63l1.41-1.41" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    spawn: (
      <svg className="w-3.5 h-3.5 text-red-400" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  }
  return <span className="flex-shrink-0">{icons[type]}</span>
}
