/**
 * Test the build validator on sample code — good, bad, and ugly.
 */

// Replicate validator logic (can't import server-only)
const BANNED_MATERIALS = ['SmoothPlastic']
const RE_P = /P\(\s*"([^"]+)"\s*,\s*CFrame\.new\(\s*(?:sp\s*\+\s*Vector3\.new\(\s*)?([^)]+)\)?\s*\)(?:\s*\*\s*CFrame\.Angles[^)]*\))?\s*,\s*Vector3\.new\(\s*([^)]+)\)\s*,\s*Enum\.Material\.(\w+)\s*,\s*Color3\.fromRGB\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g

function validate(code: string) {
  const parts: any[] = []
  for (const line of code.split('\n')) {
    RE_P.lastIndex = 0
    const m = RE_P.exec(line)
    if (!m) continue
    const posNums = m[2].split(',').map((s: string) => parseFloat(s.trim())).filter((n: number) => !isNaN(n))
    const sizeNums = m[3].split(',').map((s: string) => parseFloat(s.trim())).filter((n: number) => !isNaN(n))
    if (posNums.length < 3 || sizeNums.length < 3) continue
    parts.push({
      name: m[1], y: posNums[posNums.length - 2],
      sizeY: sizeNums[1], material: m[4],
      r: parseInt(m[5]), g: parseInt(m[6]), b: parseInt(m[7]),
    })
  }

  const issues: string[] = []
  // Materials
  for (const p of parts) {
    if (BANNED_MATERIALS.includes(p.material)) issues.push(`❌ "${p.name}" uses SmoothPlastic → auto-fixed to contextual material`)
  }
  // Flat build
  const uniqueY = new Set(parts.map((p: any) => Math.round(p.y * 2) / 2))
  if (parts.length > 5 && uniqueY.size < 3) issues.push(`❌ FLAT BUILD: only ${uniqueY.size} Y levels across ${parts.length} parts`)
  // All at origin
  const zeroCount = parts.filter((p: any) => p.y === 0).length
  if (zeroCount > parts.length * 0.7 && parts.length > 3) issues.push(`❌ ${zeroCount}/${parts.length} parts at Y=0 — no vertical structure`)
  // Color variety
  const uniqueColors = new Set(parts.map((p: any) => `${p.r},${p.g},${p.b}`))
  if (parts.length > 5 && uniqueColors.size < 3) issues.push(`⚠️ Only ${uniqueColors.size} colors — needs variety`)
  // Part count
  if (parts.length < 3) issues.push(`❌ Only ${parts.length} parts — too simple`)

  let score = 100
  for (const i of issues) { score -= i.startsWith('❌') ? 20 : 5 }
  return { parts: parts.length, score: Math.max(0, score), issues }
}

// ═══ TEST CASES ═══

console.log('\n🧪 Build Validator Tests\n')

// GOOD BUILD — should score high
const goodBuild = `
P("Floor", CFrame.new(0, 0.25, 0), Vector3.new(20, 0.5, 16), Enum.Material.WoodPlanks, Color3.fromRGB(150, 100, 60))
P("WallFront", CFrame.new(0, 4.5, 8), Vector3.new(20, 8, 0.5), Enum.Material.Brick, Color3.fromRGB(170, 75, 55))
P("WallBack", CFrame.new(0, 4.5, -8), Vector3.new(20, 8, 0.5), Enum.Material.Brick, Color3.fromRGB(170, 75, 55))
P("WallLeft", CFrame.new(-10, 4.5, 0), Vector3.new(0.5, 8, 15), Enum.Material.Brick, Color3.fromRGB(165, 70, 50))
P("WallRight", CFrame.new(10, 4.5, 0), Vector3.new(0.5, 8, 15), Enum.Material.Brick, Color3.fromRGB(165, 70, 50))
P("Roof", CFrame.new(0, 10, 0), Vector3.new(22, 0.5, 18), Enum.Material.Slate, Color3.fromRGB(65, 65, 75))
P("Door", CFrame.new(0, 3.5, 8.2), Vector3.new(3.5, 6.5, 0.3), Enum.Material.Wood, Color3.fromRGB(90, 55, 25))
P("Table", CFrame.new(4, 3.5, -3), Vector3.new(4, 0.4, 3), Enum.Material.Wood, Color3.fromRGB(130, 85, 45))
`
const r1 = validate(goodBuild)
console.log(`✅ Good house: ${r1.parts} parts, score ${r1.score}/100`)
r1.issues.forEach(i => console.log(`   ${i}`))

// BAD BUILD — SmoothPlastic, flat
const badBuild = `
P("Part1", CFrame.new(0, 0, 0), Vector3.new(10, 1, 10), Enum.Material.SmoothPlastic, Color3.fromRGB(200, 200, 200))
P("Part2", CFrame.new(5, 0, 0), Vector3.new(10, 1, 10), Enum.Material.SmoothPlastic, Color3.fromRGB(200, 200, 200))
P("Part3", CFrame.new(-5, 0, 0), Vector3.new(10, 1, 10), Enum.Material.SmoothPlastic, Color3.fromRGB(200, 200, 200))
P("Part4", CFrame.new(0, 0, 5), Vector3.new(10, 1, 10), Enum.Material.SmoothPlastic, Color3.fromRGB(200, 200, 200))
P("Part5", CFrame.new(5, 0, 5), Vector3.new(10, 1, 10), Enum.Material.SmoothPlastic, Color3.fromRGB(200, 200, 200))
P("Part6", CFrame.new(-5, 0, 5), Vector3.new(10, 1, 10), Enum.Material.SmoothPlastic, Color3.fromRGB(200, 200, 200))
`
const r2 = validate(badBuild)
console.log(`\n❌ Bad flat build: ${r2.parts} parts, score ${r2.score}/100`)
r2.issues.forEach(i => console.log(`   ${i}`))

// UGLY BUILD — too few parts
const uglyBuild = `
P("Box", CFrame.new(0, 2, 0), Vector3.new(10, 4, 10), Enum.Material.Concrete, Color3.fromRGB(150, 150, 150))
`
const r3 = validate(uglyBuild)
console.log(`\n💀 Ugly single box: ${r3.parts} parts, score ${r3.score}/100`)
r3.issues.forEach(i => console.log(`   ${i}`))

// TEMPLATE BUILD — from our templates, should score perfectly
const templateBuild = `
P("Seat", CFrame.new(0, 2.5, 0), Vector3.new(2, 0.3, 2), Enum.Material.Wood, Color3.fromRGB(140, 90, 45))
P("Backrest", CFrame.new(0, 3.9, -0.85), Vector3.new(2, 2.5, 0.3), Enum.Material.Wood, Color3.fromRGB(135, 85, 40))
P("LegFL", CFrame.new(-0.75, 1.25, 0.75), Vector3.new(0.3, 2.35, 0.3), Enum.Material.Wood, Color3.fromRGB(130, 82, 38))
P("LegFR", CFrame.new(0.75, 1.25, 0.75), Vector3.new(0.3, 2.35, 0.3), Enum.Material.Wood, Color3.fromRGB(130, 82, 38))
P("LegBL", CFrame.new(-0.75, 1.25, -0.75), Vector3.new(0.3, 2.35, 0.3), Enum.Material.Wood, Color3.fromRGB(130, 82, 38))
P("LegBR", CFrame.new(0.75, 1.25, -0.75), Vector3.new(0.3, 2.35, 0.3), Enum.Material.Wood, Color3.fromRGB(130, 82, 38))
`
const r4 = validate(templateBuild)
console.log(`\n🪑 Template chair: ${r4.parts} parts, score ${r4.score}/100`)
r4.issues.forEach(i => console.log(`   ${i}`))

console.log('\n' + '═'.repeat(40))
console.log('Validator catches: SmoothPlastic, flat builds, single-box builds,')
console.log('no color variety, generic names, and auto-fixes what it can.')
