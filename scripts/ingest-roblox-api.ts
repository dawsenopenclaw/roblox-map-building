/**
 * Ingest the Roblox API dump (every class, member, enum) into pgvector
 * as authoritative reference truth. Runs from the daily-updated dump
 * published by MaximumADHD/Roblox-Client-Tracker.
 *
 * One chunk per class — the chunk lists the class, inheritance chain,
 * memory category, every property/function/event/callback with parameter
 * + return types. This is what stops the AI from hallucinating method
 * names or property types.
 *
 * Usage:
 *   npx tsx scripts/ingest-roblox-api.ts                  # all classes
 *   npx tsx scripts/ingest-roblox-api.ts --filter=Service # only Services
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.production.local' })
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

import { PrismaClient } from '@prisma/client'
import { embedThrottled } from './lib/embed-throttled'
const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL ?? '' } } })

const API_DUMP_URL = 'https://raw.githubusercontent.com/MaximumADHD/Roblox-Client-Tracker/roblox/API-Dump.json'

interface ApiMember {
  Name: string
  MemberType: 'Property' | 'Function' | 'Event' | 'Callback'
  Tags?: string[]
  Security?: string | { Read?: string; Write?: string }
  Parameters?: Array<{ Name: string; Type: { Name: string }; Default?: string }>
  ReturnType?: { Name: string }
  ValueType?: { Name: string }
  Category?: string
}

interface ApiClass {
  Name: string
  Superclass: string
  MemoryCategory: string
  Tags?: string[]
  Members: ApiMember[]
}

interface ApiDump {
  Classes: ApiClass[]
  Enums: Array<{ Name: string; Items: Array<{ Name: string; Value: number }> }>
}

const embedText = embedThrottled

function classToText(cls: ApiClass): string {
  const parts: string[] = []
  parts.push(`Roblox Class: ${cls.Name}`)
  parts.push(`Inherits from: ${cls.Superclass}`)
  if (cls.MemoryCategory) parts.push(`Memory category: ${cls.MemoryCategory}`)
  if (cls.Tags?.length) parts.push(`Tags: ${cls.Tags.join(', ')}`)

  const props = cls.Members.filter((m) => m.MemberType === 'Property')
  const funcs = cls.Members.filter((m) => m.MemberType === 'Function')
  const events = cls.Members.filter((m) => m.MemberType === 'Event')
  const callbacks = cls.Members.filter((m) => m.MemberType === 'Callback')

  if (props.length) {
    parts.push(`\nProperties:`)
    for (const p of props.slice(0, 40)) {
      const tags = p.Tags?.length ? ` [${p.Tags.join(', ')}]` : ''
      parts.push(`  - ${p.Name}: ${p.ValueType?.Name ?? 'Variant'}${tags}`)
    }
    if (props.length > 40) parts.push(`  ... and ${props.length - 40} more properties`)
  }

  if (funcs.length) {
    parts.push(`\nFunctions:`)
    for (const f of funcs.slice(0, 30)) {
      const ps = (f.Parameters ?? []).map((p) => `${p.Name}: ${p.Type?.Name ?? 'any'}`).join(', ')
      const ret = f.ReturnType?.Name ?? 'void'
      const tags = f.Tags?.length ? ` [${f.Tags.join(', ')}]` : ''
      parts.push(`  - ${f.Name}(${ps}): ${ret}${tags}`)
    }
    if (funcs.length > 30) parts.push(`  ... and ${funcs.length - 30} more functions`)
  }

  if (events.length) {
    parts.push(`\nEvents:`)
    for (const e of events.slice(0, 20)) {
      const ps = (e.Parameters ?? []).map((p) => `${p.Name}: ${p.Type?.Name ?? 'any'}`).join(', ')
      parts.push(`  - ${e.Name}(${ps})`)
    }
  }

  if (callbacks.length) {
    parts.push(`\nCallbacks:`)
    for (const c of callbacks.slice(0, 10)) {
      const ps = (c.Parameters ?? []).map((p) => `${p.Name}: ${p.Type?.Name ?? 'any'}`).join(', ')
      const ret = c.ReturnType?.Name ?? 'void'
      parts.push(`  - ${c.Name}(${ps}): ${ret}`)
    }
  }

  return parts.join('\n')
}

function classifyClass(cls: ApiClass): 'service' | 'pattern' | 'building' | 'dev' {
  const name = cls.Name.toLowerCase()
  if (name.endsWith('service') || cls.Superclass === 'Instance' && cls.Tags?.includes('Service')) return 'service'
  if (/(part|baseplate|model|workspace|terrain|union|wedge|truss|lighting|atmosphere|sky|fog)/.test(name)) return 'building'
  if (/(gui|frame|button|label|scrollingframe)/.test(name)) return 'pattern'
  return 'dev'
}

async function ingestChunk(category: string, title: string, content: string, source: string, tags: string[]): Promise<boolean> {
  try {
    const embedding = await embedText(`${category} ${title} ${content}`)
    if (embedding.length === 0) return false
    const vectorStr = `[${embedding.join(',')}]`
    await db.$executeRawUnsafe(
      `INSERT INTO "RobloxDocChunk" (id, category, title, content, source, tags, embedding, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6::vector, NOW(), NOW())
       ON CONFLICT (category, title) DO UPDATE SET
         content = EXCLUDED.content,
         source = EXCLUDED.source,
         tags = EXCLUDED.tags,
         embedding = EXCLUDED.embedding,
         "updatedAt" = NOW()`,
      category, title, content, source, tags, vectorStr,
    )
    return true
  } catch (e) {
    console.error(`  ✗ ${title}: ${(e as Error).message.slice(0, 100)}`)
    return false
  }
}

async function main() {
  const args = process.argv.slice(2)
  const filter = args.find((a) => a.startsWith('--filter='))?.split('=')[1]

  console.log(`📥 Fetching Roblox API dump...`)
  const res = await fetch(API_DUMP_URL)
  if (!res.ok) throw new Error(`API dump fetch: ${res.status}`)
  const dump = (await res.json()) as ApiDump
  console.log(`   ${dump.Classes.length} classes, ${dump.Enums.length} enums`)

  const targetClasses = filter
    ? dump.Classes.filter((c) => c.Name.includes(filter))
    : dump.Classes
  console.log(`   ingesting ${targetClasses.length} classes${filter ? ` (filtered: ${filter})` : ''}`)

  let ok = 0
  let fail = 0
  for (let i = 0; i < targetClasses.length; i++) {
    const cls = targetClasses[i]
    const text = classToText(cls)
    const cat = classifyClass(cls)
    const success = await ingestChunk(
      cat,
      `Roblox API: ${cls.Name}`,
      text,
      `https://create.roblox.com/docs/reference/engine/classes/${cls.Name}`,
      ['roblox-api', 'reference', cls.Name.toLowerCase(), ...(cls.Tags ?? [])],
    )
    if (success) ok++; else fail++
    if ((i + 1) % 25 === 0) {
      console.log(`   ${i + 1}/${targetClasses.length} (${ok} ok, ${fail} failed)`)
    }
  }

  // Also ingest enums as one big chunk per major namespace
  console.log(`\n📥 Ingesting enums...`)
  const enumChunks = new Map<string, string[]>()
  for (const en of dump.Enums) {
    const ns = en.Name.match(/^[A-Z][a-z]+/)?.[0] ?? 'Misc'
    if (!enumChunks.has(ns)) enumChunks.set(ns, [])
    const items = en.Items.map((i) => `${i.Name}=${i.Value}`).join(', ')
    enumChunks.get(ns)!.push(`Enum.${en.Name}: ${items}`)
  }
  for (const [ns, list] of enumChunks) {
    const text = `Roblox Enums (${ns} namespace):\n\n${list.join('\n\n')}`
    const success = await ingestChunk(
      'service',
      `Roblox Enums: ${ns}`,
      text,
      'https://create.roblox.com/docs/reference/engine/enums',
      ['roblox-api', 'enum', 'reference', ns.toLowerCase()],
    )
    if (success) ok++; else fail++
  }

  console.log(`\n✅ API ingest complete: ${ok} chunks stored, ${fail} failed`)
  await db.$disconnect()
}

main().catch((e) => {
  console.error('💥', e)
  process.exit(1)
})
