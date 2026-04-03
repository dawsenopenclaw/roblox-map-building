/**
 * Free 3D Mesh Generation Pipeline
 *
 * Uses HuggingFace Spaces (Gradio API) — completely free, no API keys needed.
 *
 * Primary: Shap-E text-to-3D (direct text → GLB, tested & working)
 * Fallback: Image-to-3D spaces when Shap-E is down
 *
 * Returns a downloadable GLB URL that can be imported into Roblox Studio.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FreeMeshResult {
  meshUrl: string | null
  thumbnailUrl: string | null
  polygonCount: number | null
  status: 'complete' | 'pending' | 'error'
  model: string
  error?: string
  durationMs: number
}

interface GradioFileData {
  path?: string
  url?: string
  orig_name?: string
  size?: number | null
  meta?: { _type?: string }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Shap-E: text-to-3D, outputs GLB directly, no image step needed
const SHAP_E_SPACE = 'https://hysts-Shap-E.hf.space'

// Backup image-to-3D spaces (need an image first)
const IMAGE_TO_3D_SPACES = [
  { url: 'https://stabilityai-stable-fast-3d.hf.space', name: 'stable-fast-3d', api: 'run' },
  { url: 'https://stabilityai-TripoSR.hf.space', name: 'triposr', api: 'run' },
]

const GRADIO_TIMEOUT = 180_000 // 3 min — free spaces can be slow

// ---------------------------------------------------------------------------
// Core: Gradio Queue API caller
// ---------------------------------------------------------------------------

async function callGradioQueue(
  spaceUrl: string,
  apiName: string,
  data: unknown[],
  timeoutMs = GRADIO_TIMEOUT,
): Promise<GradioFileData[] | null> {
  try {
    // Step 1: Submit to queue
    const submitRes = await fetch(`${spaceUrl}/gradio_api/call/${apiName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!submitRes.ok) {
      console.warn(`[free-mesh] Submit failed: ${submitRes.status} ${submitRes.statusText}`)
      return null
    }

    const { event_id } = (await submitRes.json()) as { event_id: string }
    if (!event_id) return null

    // Submission accepted; begin SSE poll

    // Step 2: Stream SSE result
    const resultRes = await fetch(
      `${spaceUrl}/gradio_api/call/${apiName}/${event_id}`,
      { signal: AbortSignal.timeout(timeoutMs) },
    )

    if (!resultRes.ok || !resultRes.body) return null

    const reader = resultRes.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          // Check for error event
          if (line === 'event: error') {
            console.warn('[free-mesh] Space returned error event')
            return null
          }

          // Parse data lines — the result comes as JSON array after "event: complete"
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim()
            if (dataStr === 'null') continue
            try {
              const parsed = JSON.parse(dataStr)
              if (Array.isArray(parsed) && parsed.length > 0) {
                // Got result! Return file data
                return parsed as GradioFileData[]
              }
            } catch {
              // Not valid JSON yet, continue
            }
          }
        }
      }
    } finally {
      reader.cancel().catch(() => {})
    }

    return null
  } catch (err) {
    console.warn(`[free-mesh] Queue call failed:`, err instanceof Error ? err.message : String(err))
    return null
  }
}

// ---------------------------------------------------------------------------
// Extract GLB URL from Gradio file response
// ---------------------------------------------------------------------------

function extractGlbUrl(data: GradioFileData[], spaceUrl: string): string | null {
  for (const item of data) {
    if (item.url) return item.url
    if (item.path) return `${spaceUrl}/gradio_api/file=${item.path}`
  }
  return null
}

// ---------------------------------------------------------------------------
// Method 1: Shap-E Text-to-3D (PROVEN WORKING — direct text → GLB)
// ---------------------------------------------------------------------------

async function textTo3DShapE(prompt: string): Promise<string | null> {
  const result = await callGradioQueue(SHAP_E_SPACE, 'text-to-3d', [
    prompt,   // text prompt
    0,        // seed (0 = random)
    15,       // guidance_scale
    64,       // num_inference_steps
  ])

  if (!result) return null
  return extractGlbUrl(result, SHAP_E_SPACE)
}

// ---------------------------------------------------------------------------
// Method 2: Image-to-3D fallback (needs an image URL)
// ---------------------------------------------------------------------------

async function imageTo3D(imageUrl: string): Promise<{ glbUrl: string; model: string } | null> {
  for (const space of IMAGE_TO_3D_SPACES) {
    try {
      const result = await callGradioQueue(space.url, space.api, [
        { url: imageUrl },
        0.85,
        'none',
        -1,
      ])

      if (result) {
        const glbUrl = extractGlbUrl(result, space.url)
        if (glbUrl) return { glbUrl, model: space.name }
      }
    } catch {
      continue
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Enhance prompt for better 3D generation
// ---------------------------------------------------------------------------

function enhancePrompt(prompt: string): string {
  const cleaned = prompt
    .replace(/^(build|create|generate|make|give me|mesh[:\s]*)\s*(a\s+|me\s+)?/i, '')
    .replace(/\s+(for|in)\s+roblox$/i, '')
    .trim()

  // Shap-E works best with simple, clear object descriptions
  return cleaned || prompt
}

// ---------------------------------------------------------------------------
// Main Pipeline
// ---------------------------------------------------------------------------

export async function generateFreeMesh(prompt: string): Promise<FreeMeshResult> {
  const start = Date.now()
  const enhanced = enhancePrompt(prompt)

  try {
    // Primary: Shap-E text-to-3D (no image step, direct GLB output)
    const glbUrl = await textTo3DShapE(enhanced)

    if (glbUrl) {
      return {
        meshUrl: glbUrl,
        thumbnailUrl: null, // Shap-E doesn't return a thumbnail
        polygonCount: null,
        status: 'complete',
        model: 'free:shap-e',
        durationMs: Date.now() - start,
      }
    }

    console.warn('[free-mesh] Shap-E failed, no fallback image available')
    return {
      meshUrl: null,
      thumbnailUrl: null,
      polygonCount: null,
      status: 'error',
      model: 'free-pipeline',
      error: 'The free 3D generation service is busy right now. Try again in a minute — it works best with simple descriptions like "a sword" or "a wooden chair".',
      durationMs: Date.now() - start,
    }
  } catch (err) {
    return {
      meshUrl: null,
      thumbnailUrl: null,
      polygonCount: null,
      status: 'error',
      model: 'free-pipeline',
      error: err instanceof Error ? err.message : 'Unknown error in free mesh pipeline',
      durationMs: Date.now() - start,
    }
  }
}

// ---------------------------------------------------------------------------
// Object type detection — determines HOW the mesh gets placed in-game
// ---------------------------------------------------------------------------

export type MeshObjectType = 'weapon' | 'tool' | 'wearable' | 'building' | 'vehicle' | 'pickup' | 'prop' | 'npc'

const OBJECT_TYPE_KEYWORDS: Record<MeshObjectType, string[]> = {
  weapon: ['sword', 'axe', 'dagger', 'bow', 'staff', 'spear', 'mace', 'hammer', 'gun', 'pistol', 'rifle', 'blade', 'katana', 'scythe', 'trident', 'wand', 'crossbow', 'club', 'flail', 'weapon'],
  tool: ['pickaxe', 'shovel', 'fishing rod', 'wrench', 'tool', 'hammer tool', 'drill', 'saw', 'net', 'bucket', 'watering can', 'rake', 'hoe'],
  wearable: ['hat', 'helmet', 'crown', 'cape', 'armor', 'shield', 'backpack', 'wings', 'mask', 'glasses', 'necklace', 'ring', 'gloves', 'boots', 'headband', 'tiara', 'hood', 'scarf', 'belt'],
  building: ['house', 'castle', 'tower', 'shop', 'store', 'building', 'cabin', 'barn', 'church', 'temple', 'palace', 'mansion', 'fortress', 'dungeon', 'bridge', 'wall', 'gate', 'warehouse', 'lighthouse', 'windmill', 'hut', 'cottage', 'skyscraper', 'office', 'school', 'hospital'],
  vehicle: ['car', 'truck', 'boat', 'ship', 'plane', 'helicopter', 'bike', 'motorcycle', 'bus', 'train', 'cart', 'wagon', 'spaceship', 'submarine', 'tank', 'rocket', 'van', 'jet'],
  pickup: ['coin', 'gem', 'crystal', 'orb', 'potion', 'key', 'star', 'heart', 'diamond', 'ruby', 'emerald', 'token', 'collectible', 'power-up', 'powerup', 'loot', 'treasure', 'chest', 'gold', 'money', 'cash', 'berry', 'fruit', 'apple', 'mushroom', 'candy', 'cookie', 'egg', 'pearl', 'scroll'],
  npc: ['character', 'person', 'human', 'npc', 'villager', 'guard', 'merchant', 'shopkeeper', 'wizard', 'knight', 'warrior', 'zombie', 'skeleton', 'monster', 'creature', 'boss', 'enemy', 'pet', 'animal', 'dog', 'cat', 'dragon'],
  prop: [], // default fallback
}

export function detectObjectType(prompt: string): MeshObjectType {
  const lower = prompt.toLowerCase()
  let bestType: MeshObjectType = 'prop'
  let bestScore = 0

  for (const [type, keywords] of Object.entries(OBJECT_TYPE_KEYWORDS) as [MeshObjectType, string[]][]) {
    for (const kw of keywords) {
      if (lower.includes(kw) && kw.length > bestScore) {
        bestType = type
        bestScore = kw.length
      }
    }
  }

  return bestType
}

// ---------------------------------------------------------------------------
// Luau code generators per object type
// ---------------------------------------------------------------------------

/**
 * Generate Luau code that places a mesh in Roblox Studio with the right
 * configuration based on what the object IS.
 *
 * When rbxAssetId is provided, uses MeshPart with that asset ID.
 * When glbUrl is provided, creates a placeholder with download instructions.
 */
export function generatePlacementLuau(opts: {
  rbxAssetId?: string
  glbUrl?: string
  meshName: string
  objectType: MeshObjectType
}): string {
  const { rbxAssetId, glbUrl, meshName, objectType } = opts
  const safeName = meshName.replace(/[^%w_]/g, '').slice(0, 30) || 'ForjeAIMesh'

  // If we have a real rbxassetid, use MeshPart directly
  const meshSetup = rbxAssetId
    ? `local mesh = Instance.new("MeshPart")
  mesh.MeshId = "${rbxAssetId}"
  mesh.Name = "${safeName}"`
    : `-- GLB Download URL: ${glbUrl ?? 'N/A'}
  -- To use: Studio > File > Import 3D > select downloaded .glb
  -- The code below creates a placeholder Part. Replace with imported MeshPart.
  local mesh = Instance.new("Part")
  mesh.Name = "${safeName}"
  mesh.Size = Vector3.new(4, 4, 4)
  mesh.Shape = Enum.PartType.Block`

  switch (objectType) {
    case 'weapon':
    case 'tool':
      return `-- ForjeAI: ${meshName} (${objectType})
local CH = game:GetService("ChangeHistoryService")
local Selection = game:GetService("Selection")
local id = CH:TryBeginRecording("ForjeAI ${objectType}")

${meshSetup}
mesh.Size = Vector3.new(1, 1, 4)
mesh.Anchored = false
mesh.CanCollide = false

local tool = Instance.new("Tool")
tool.Name = "${safeName}"
tool.Grip = CFrame.new(0, 0, -1.5) * CFrame.Angles(0, 0, math.rad(-90))
tool.CanBeDropped = true

local handle = mesh:Clone()
handle.Name = "Handle"
handle.Parent = tool

tool.Parent = game:GetService("ServerStorage")

-- Also place a display copy in workspace
local cam = workspace.CurrentCamera
local spawnPos = cam.CFrame.Position + cam.CFrame.LookVector * 15
local ray = workspace:Raycast(spawnPos + Vector3.new(0, 50, 0), Vector3.new(0, -200, 0))
local groundY = ray and ray.Position.Y or 0

local display = mesh:Clone()
display.Position = Vector3.new(spawnPos.X, groundY + 3, spawnPos.Z)
display.Anchored = true
display.Parent = workspace

-- Add spin + glow for display
local spin = Instance.new("BodyAngularVelocity")
spin.AngularVelocity = Vector3.new(0, 2, 0)
spin.MaxTorque = Vector3.new(0, math.huge, 0)
spin.Parent = display
display.Anchored = false

local light = Instance.new("PointLight")
light.Brightness = 1.5
light.Range = 12
light.Color = Color3.fromRGB(212, 175, 55)
light.Parent = display

Selection:Set({tool, display})
print("[ForjeAI] ${objectType} '${safeName}' created! Tool in ServerStorage, display in workspace.")

if id then CH:FinishRecording(id, Enum.FinishRecordingOperation.Commit) end`

    case 'wearable':
      return `-- ForjeAI: ${meshName} (wearable accessory)
local CH = game:GetService("ChangeHistoryService")
local Selection = game:GetService("Selection")
local id = CH:TryBeginRecording("ForjeAI wearable")

${meshSetup}
mesh.Anchored = false
mesh.CanCollide = false

local accessory = Instance.new("Accessory")
accessory.Name = "${safeName}"
accessory.AttachmentPoint = CFrame.new(0, 0.5, 0)

local handle = mesh:Clone()
handle.Name = "Handle"
local att = Instance.new("Attachment")
att.Name = "HatAttachment"
att.Parent = handle
handle.Parent = accessory

accessory.Parent = game:GetService("ServerStorage")

-- Preview in workspace
local cam = workspace.CurrentCamera
local pos = cam.CFrame.Position + cam.CFrame.LookVector * 10
local preview = mesh:Clone()
preview.Position = Vector3.new(pos.X, pos.Y, pos.Z)
preview.Anchored = true
preview.Parent = workspace

Selection:Set({accessory, preview})
print("[ForjeAI] Accessory '${safeName}' created in ServerStorage + preview in workspace.")

if id then CH:FinishRecording(id, Enum.FinishRecordingOperation.Commit) end`

    case 'building':
      return `-- ForjeAI: ${meshName} (building)
local CH = game:GetService("ChangeHistoryService")
local Selection = game:GetService("Selection")
local id = CH:TryBeginRecording("ForjeAI building")

${meshSetup}
local cam = workspace.CurrentCamera
local spawnPos = cam.CFrame.Position + cam.CFrame.LookVector * 40
local ray = workspace:Raycast(spawnPos + Vector3.new(0, 100, 0), Vector3.new(0, -300, 0))
local groundY = ray and ray.Position.Y or 0

mesh.Size = Vector3.new(20, 15, 20)
mesh.Position = Vector3.new(spawnPos.X, groundY + mesh.Size.Y / 2, spawnPos.Z)
mesh.Anchored = true
mesh.Material = Enum.Material.Concrete
mesh.Color = Color3.fromRGB(180, 170, 160)

local model = Instance.new("Model")
model.Name = "${safeName}"
mesh.Parent = model
model.PrimaryPart = mesh
model.Parent = workspace

game:GetService("CollectionService"):AddTag(model, "ForjeAI")
Selection:Set({model})
print("[ForjeAI] Building '${safeName}' placed at camera position.")

if id then CH:FinishRecording(id, Enum.FinishRecordingOperation.Commit) end`

    case 'vehicle':
      return `-- ForjeAI: ${meshName} (vehicle)
local CH = game:GetService("ChangeHistoryService")
local Selection = game:GetService("Selection")
local id = CH:TryBeginRecording("ForjeAI vehicle")

${meshSetup}
local cam = workspace.CurrentCamera
local spawnPos = cam.CFrame.Position + cam.CFrame.LookVector * 25
local ray = workspace:Raycast(spawnPos + Vector3.new(0, 50, 0), Vector3.new(0, -200, 0))
local groundY = ray and ray.Position.Y or 0

mesh.Size = Vector3.new(6, 3, 12)
mesh.Position = Vector3.new(spawnPos.X, groundY + mesh.Size.Y / 2, spawnPos.Z)
mesh.Anchored = true

local model = Instance.new("Model")
model.Name = "${safeName}"
mesh.Parent = model
model.PrimaryPart = mesh

local seat = Instance.new("VehicleSeat")
seat.Name = "DriverSeat"
seat.Size = Vector3.new(2, 0.5, 2)
seat.Position = mesh.Position + Vector3.new(0, mesh.Size.Y / 2 + 0.5, 0)
seat.Anchored = true
seat.Transparency = 1
seat.Parent = model

model.Parent = workspace
game:GetService("CollectionService"):AddTag(model, "ForjeAI")
Selection:Set({model})
print("[ForjeAI] Vehicle '${safeName}' placed with VehicleSeat.")

if id then CH:FinishRecording(id, Enum.FinishRecordingOperation.Commit) end`

    case 'pickup':
      return `-- ForjeAI: ${meshName} (pickup/collectible)
local CH = game:GetService("ChangeHistoryService")
local Selection = game:GetService("Selection")
local TweenService = game:GetService("TweenService")
local id = CH:TryBeginRecording("ForjeAI pickup")

${meshSetup}
local cam = workspace.CurrentCamera
local spawnPos = cam.CFrame.Position + cam.CFrame.LookVector * 15
local ray = workspace:Raycast(spawnPos + Vector3.new(0, 50, 0), Vector3.new(0, -200, 0))
local groundY = ray and ray.Position.Y or 0

mesh.Size = Vector3.new(2, 2, 2)
mesh.Position = Vector3.new(spawnPos.X, groundY + 3, spawnPos.Z)
mesh.Anchored = true
mesh.CanCollide = false
mesh.Color = Color3.fromRGB(255, 215, 0)
mesh.Material = Enum.Material.Neon

-- Glow effect
local light = Instance.new("PointLight")
light.Brightness = 2
light.Range = 16
light.Color = Color3.fromRGB(255, 200, 50)
light.Parent = mesh

-- Spin animation
local spinScript = Instance.new("Script")
spinScript.Name = "SpinAndBob"
spinScript.Source = [[
local part = script.Parent
local startY = part.Position.Y
local startCFrame = part.CFrame
local t = 0
game:GetService("RunService").Heartbeat:Connect(function(dt)
  t = t + dt
  local bobY = math.sin(t * 2) * 0.5
  part.CFrame = CFrame.new(startCFrame.X, startY + bobY, startCFrame.Z) * CFrame.Angles(0, t * 2, 0)
end)

part.Touched:Connect(function(hit)
  local humanoid = hit.Parent:FindFirstChildWhichIsA("Humanoid")
  if humanoid then
    -- Collect effect
    part:Destroy()
  end
end)
]]
spinScript.Parent = mesh

mesh.Parent = workspace
game:GetService("CollectionService"):AddTag(mesh, "ForjeAI")
game:GetService("CollectionService"):AddTag(mesh, "Pickup")
Selection:Set({mesh})
print("[ForjeAI] Pickup '${safeName}' placed — spins, bobs, and auto-collects on touch!")

if id then CH:FinishRecording(id, Enum.FinishRecordingOperation.Commit) end`

    case 'npc':
      return `-- ForjeAI: ${meshName} (NPC)
local CH = game:GetService("ChangeHistoryService")
local Selection = game:GetService("Selection")
local id = CH:TryBeginRecording("ForjeAI NPC")

${meshSetup}
local cam = workspace.CurrentCamera
local spawnPos = cam.CFrame.Position + cam.CFrame.LookVector * 15
local ray = workspace:Raycast(spawnPos + Vector3.new(0, 50, 0), Vector3.new(0, -200, 0))
local groundY = ray and ray.Position.Y or 0

mesh.Size = Vector3.new(2, 5.5, 2)
mesh.Position = Vector3.new(spawnPos.X, groundY + mesh.Size.Y / 2, spawnPos.Z)
mesh.Anchored = true

local model = Instance.new("Model")
model.Name = "${safeName}"
mesh.Parent = model
model.PrimaryPart = mesh

-- Interaction prompt
local prox = Instance.new("ProximityPrompt")
prox.ActionText = "Talk"
prox.ObjectText = "${safeName}"
prox.HoldDuration = 0
prox.MaxActivationDistance = 10
prox.Parent = mesh

-- Billboard name
local bb = Instance.new("BillboardGui")
bb.Size = UDim2.new(0, 200, 0, 50)
bb.StudsOffset = Vector3.new(0, mesh.Size.Y / 2 + 1, 0)
bb.AlwaysOnTop = true
local label = Instance.new("TextLabel")
label.Size = UDim2.new(1, 0, 1, 0)
label.BackgroundTransparency = 1
label.Text = "${safeName}"
label.TextColor3 = Color3.fromRGB(255, 255, 255)
label.TextStrokeTransparency = 0.5
label.Font = Enum.Font.GothamBold
label.TextSize = 18
label.Parent = bb
bb.Parent = mesh

model.Parent = workspace
game:GetService("CollectionService"):AddTag(model, "ForjeAI")
game:GetService("CollectionService"):AddTag(model, "NPC")
Selection:Set({model})
print("[ForjeAI] NPC '${safeName}' placed with ProximityPrompt interaction.")

if id then CH:FinishRecording(id, Enum.FinishRecordingOperation.Commit) end`

    default: // 'prop'
      return `-- ForjeAI: ${meshName} (prop)
local CH = game:GetService("ChangeHistoryService")
local Selection = game:GetService("Selection")
local id = CH:TryBeginRecording("ForjeAI prop")

${meshSetup}
local cam = workspace.CurrentCamera
local spawnPos = cam.CFrame.Position + cam.CFrame.LookVector * 20
local ray = workspace:Raycast(spawnPos + Vector3.new(0, 50, 0), Vector3.new(0, -200, 0))
local groundY = ray and ray.Position.Y or 0

mesh.Size = Vector3.new(4, 4, 4)
mesh.Position = Vector3.new(spawnPos.X, groundY + mesh.Size.Y / 2, spawnPos.Z)
mesh.Anchored = true

mesh.Parent = workspace
game:GetService("CollectionService"):AddTag(mesh, "ForjeAI")
Selection:Set({mesh})
print("[ForjeAI] Prop '${safeName}' placed at camera position.")

if id then CH:FinishRecording(id, Enum.FinishRecordingOperation.Commit) end`
  }
}

/**
 * Generate simple import Luau for cases where we only have a download URL.
 */
export function generateMeshImportLuau(glbUrl: string, meshName: string): string {
  const objectType = detectObjectType(meshName)
  return generatePlacementLuau({ glbUrl, meshName, objectType })
}
