'use client'
import { useState } from 'react'

// Hardcoded to avoid importing server-only module in a client component
const CHARITIES = [
  { slug: 'code-org', name: 'Code.org', description: 'Computer science education for all students' },
  { slug: 'girls-who-code', name: 'Girls Who Code', description: 'Closing the gender gap in tech' },
  { slug: 'khan-academy', name: 'Khan Academy', description: 'Free world-class education for anyone' },
] as const

type CharitySlug = typeof CHARITIES[number]['slug']

export function CharitySelector({ current }: { current?: string }) {
  const [selected, setSelected] = useState<CharitySlug | string>(current || 'code-org')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save(slug: string) {
    setSaving(true)
    await fetch('/api/user/charity', {
      method: 'POST',
      body: JSON.stringify({ charitySlug: slug }),
      headers: { 'Content-Type': 'application/json' },
    })
    setSelected(slug)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="bg-[#0D1231] border border-white/10 rounded-xl p-4">
      <p className="text-white font-medium mb-1">Your 10% goes to</p>
      <p className="text-gray-400 text-sm mb-4">10% of every payment is automatically donated.</p>
      <div className="space-y-2">
        {CHARITIES.map(charity => (
          <button
            key={charity.slug}
            onClick={() => save(charity.slug)}
            disabled={saving}
            className={`w-full text-left p-3 rounded-lg border transition-colors disabled:opacity-50 ${
              selected === charity.slug
                ? 'border-[#FFB81C] bg-[#FFB81C]/10 text-white'
                : 'border-white/10 text-gray-400 hover:border-white/30'
            }`}
          >
            <span className="font-medium">{charity.name}</span>
            <span className="block text-xs mt-0.5 opacity-70">{charity.description}</span>
          </button>
        ))}
      </div>
      {saved && <p className="text-[#FFB81C] text-sm mt-2">Saved!</p>}
    </div>
  )
}
