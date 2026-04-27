import 'server-only'

/**
 * build-quality-gate.ts — Post-Generation Quality Gate
 *
 * Runs AFTER AI generates Luau code but BEFORE sending to Studio.
 * Auto-fixes common AI mistakes: bad materials, missing lights, missing finalize.
 */

export interface QualityGateResult {
  code: string           // fixed code
  fixes: string[]        // list of what was fixed
  partCount: number      // detected part count
  passedGate: boolean    // true if code meets minimum standards
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** True if the code looks like a script (not a build) */
function isScriptCode(code: string): boolean {
  return /\bgame\.Players\.PlayerAdded\b/.test(code)
    || /\bRemoteEvent\b/.test(code)
    || /\bUserInputService\b/.test(code)
    || /\bReplicatedStorage\b/.test(code)
    || /\bServerScriptService\b/.test(code)
}

/** Count parts created in the code */
function countParts(code: string): number {
  const patterns = [
    /Instance\.new\(\s*"Part"\s*\)/g,
    /Instance\.new\(\s*"WedgePart"\s*\)/g,
    /Instance\.new\(\s*"SpawnLocation"\s*\)/g,
    /Instance\.new\(\s*"MeshPart"\s*\)/g,
    /Instance\.new\(\s*"UnionOperation"\s*\)/g,
    /\bP\s*\(/g,
    /\bW\s*\(/g,
    /\bCyl\s*\(/g,
    /\bBall\s*\(/g,
  ]
  let count = 0
  for (const pat of patterns) {
    const matches = code.match(pat)
    if (matches) count += matches.length
  }
  return count
}

/** True if code has room/building parts */
function hasInteriorParts(code: string): boolean {
  return /["'](?:wall|floor|ceiling|room|interior|foundation)/i.test(code)
}

/** True if code already has PointLight */
function hasPointLight(code: string): boolean {
  return /PointLight/i.test(code)
}

// ---------------------------------------------------------------------------
// Main Quality Gate
// ---------------------------------------------------------------------------

export function runQualityGate(code: string, intent: string): QualityGateResult {
  const fixes: string[] = []
  let fixed = code
  const script = isScriptCode(code)

  // 1. Fix SmoothPlastic / Plastic in build code
  if (!script) {
    const smoothPlasticRe = /Enum\.Material\.SmoothPlastic/g
    const plasticRe = /Enum\.Material\.Plastic\b/g
    if (smoothPlasticRe.test(fixed)) {
      fixed = fixed.replace(/Enum\.Material\.SmoothPlastic/g, 'Enum.Material.Concrete')
      fixes.push('Replaced SmoothPlastic with Concrete')
    }
    if (plasticRe.test(fixed)) {
      fixed = fixed.replace(/Enum\.Material\.Plastic\b/g, 'Enum.Material.Concrete')
      fixes.push('Replaced Plastic with Concrete')
    }
  }

  // 2. Warn about thick walls (don't auto-fix — might break coordinates)
  const wallPartRe = /(?:["'](?:\w*[Ww]all\w*)["'])\s*.*?Size\s*=\s*Vector3\.new\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/g
  let wallMatch: RegExpExecArray | null
  while ((wallMatch = wallPartRe.exec(fixed)) !== null) {
    const dims = [parseFloat(wallMatch[1]), parseFloat(wallMatch[2]), parseFloat(wallMatch[3])].sort((a, b) => a - b)
    if (dims[0] > 1.5 && dims[2] > 2) {
      fixes.push(`Warning: wall thickness ${dims[0]} studs (>1.5) — check manually`)
    }
  }

  // 3. Inject missing PointLights for interior builds
  if (!script && hasInteriorParts(fixed) && !hasPointLight(fixed)) {
    const lightBlock = `
-- Auto-injected interior lighting
local _autoLight = Instance.new("PointLight")
_autoLight.Brightness = 1.5
_autoLight.Range = 20
_autoLight.Color = Color3.fromRGB(255, 220, 180)
_autoLight.Parent = m:FindFirstChild("Floor") or m:GetChildren()[1]
`
    // Insert before m.Parent = workspace (if present) or append
    const parentIdx = fixed.lastIndexOf('m.Parent = workspace')
    if (parentIdx !== -1) {
      fixed = fixed.slice(0, parentIdx) + lightBlock + '\n' + fixed.slice(parentIdx)
    } else {
      fixed += '\n' + lightBlock
    }
    fixes.push('Injected PointLight for interior lighting')
  }

  // 4. Count parts
  const partCount = countParts(fixed)

  // 5. Check minimums for build intent
  const isBuild = !['conversation', 'chat', 'help', 'undo', 'publish', 'analysis', 'marketplace', 'script'].includes(intent)
  const passedGate = !isBuild || partCount >= 5

  if (isBuild && partCount < 5) {
    fixes.push(`Part count too low: ${partCount} (minimum 5 for builds)`)
  }

  // 6. Fix missing finalize
  if (!script && !fixed.includes('m.Parent = workspace') && !fixed.includes('FinishRecording')) {
    fixed += `
m.Parent = workspace
game:GetService("CollectionService"):AddTag(m, "ForjeAI")
game:GetService("Selection"):Set({m})
if rid then CH:FinishRecording(rid, Enum.FinishRecordingOperation.Commit) end
`
    fixes.push('Appended missing finalize block')
  }

  // 7. BrickColor warning
  if (/BrickColor\.new\(/.test(fixed)) {
    // Add a comment warning inline
    fixed = fixed.replace(
      /BrickColor\.new\(/g,
      'BrickColor.new( --[[ FIXME: prefer Color3.fromRGB() ]] '
    )
    fixes.push('Added Color3 migration warnings to BrickColor.new() calls')
  }

  return { code: fixed, fixes, partCount, passedGate }
}
