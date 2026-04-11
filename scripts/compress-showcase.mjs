/**
 * One-shot script to compress the homepage product-preview screenshots.
 * Reads originals from public/showcase/ and overwrites in place at sane sizes.
 *
 * Usage: node scripts/compress-showcase.mjs
 */
import sharp from 'sharp'
import { readFile, writeFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]):/, '$1:')
const DIR = join(ROOT, 'public', 'showcase')

const TARGETS = [
  // Product preview gallery — rendered max ~600px wide on desktop in a 3-up grid.
  // 1600w gives plenty of headroom for retina + Vercel image optimizer to resize down.
  { name: 'forjegames-state3.png',      maxWidth: 1600, quality: 82 },
  { name: 'forjegames-state5.png',      maxWidth: 1600, quality: 82 },
  { name: 'forjegames-pricing-raw.png', maxWidth: 1600, quality: 85 },
]

function fmtBytes(n) {
  if (n > 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)}MB`
  return `${(n / 1024).toFixed(0)}KB`
}

for (const t of TARGETS) {
  const path = join(DIR, t.name)
  let before
  try {
    before = (await stat(path)).size
  } catch {
    console.log(`⊘ skip ${t.name} — not found`)
    continue
  }

  const buf = await readFile(path)
  const out = await sharp(buf)
    .resize({ width: t.maxWidth, withoutEnlargement: true })
    .png({ quality: t.quality, compressionLevel: 9, palette: true })
    .toBuffer()

  // Only overwrite if smaller
  if (out.length < before) {
    await writeFile(path, out)
    const pct = ((1 - out.length / before) * 100).toFixed(0)
    console.log(`✓ ${t.name}: ${fmtBytes(before)} → ${fmtBytes(out.length)} (-${pct}%)`)
  } else {
    console.log(`⊘ ${t.name}: ${fmtBytes(before)} (recompression larger, kept original)`)
  }
}
