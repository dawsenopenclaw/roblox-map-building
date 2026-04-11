/**
 * POST /api/studio/export-rbxm
 *
 * Generates a downloadable Roblox XML model file (.rbxmx) from a list of
 * structured commands OR raw Luau code. This is the SAFETY NET path for
 * users who can't (or don't want to) install the Studio plugin.
 *
 * Accepts:
 *   { commands: StructuredCommand[] }         // Preferred — typed commands
 *   { luauCode: string }                      // Fallback — we translate to commands
 *   { luauCode: string, fileName?: string }
 *
 * Returns: application/vnd.roblox.rbxmx+xml as an attachment.
 *
 * The resulting file can be dragged directly into a Roblox Studio viewport.
 * Only CREATE commands (parts/models/folders/scripts) contribute geometry.
 * SET/DELETE/MOVE commands are ignored since they target instances that
 * don't exist in a fresh import.
 *
 * This endpoint is PUBLIC — no auth required. Generating XML locally from
 * user-provided code leaks no server state and is harmless. Rate-limited
 * lightly via the IP-bucketed rate limiter to prevent abuse.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  luauToStructuredCommands,
  type StructuredCommand,
} from '@/lib/ai/structured-commands'
import { parseBody } from '@/lib/validations'

// ── Validation schema ────────────────────────────────────────────────────────

const exportSchema = z
  .object({
    commands: z.array(z.record(z.unknown())).optional(),
    luauCode: z.string().max(200_000).optional(),
    fileName: z.string().max(64).optional(),
  })
  .refine((b) => b.commands !== undefined || b.luauCode !== undefined, {
    message: 'Either `commands` or `luauCode` must be provided',
  })

// ── CORS ─────────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

// ── XML escape ───────────────────────────────────────────────────────────────

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// ── Referent generator ───────────────────────────────────────────────────────

let _refCounter = 0
function nextRef(): string {
  _refCounter += 1
  return `RBX${_refCounter.toString(36).toUpperCase()}${Date.now().toString(36)}`
}

// ── Material enum → Roblox numeric enum value ────────────────────────────────
// Roblox's material enum mapping. Unknown materials fall back to Plastic.
const MATERIAL_ENUM: Record<string, number> = {
  Plastic:       256,
  SmoothPlastic: 272,
  Wood:          512,
  WoodPlanks:    528,
  Marble:        784,
  Slate:         800,
  Concrete:      816,
  Granite:       832,
  Brick:         848,
  Pebble:        864,
  Cobblestone:   880,
  CorrodedMetal: 1040,
  DiamondPlate:  1056,
  Foil:          1072,
  Metal:         1088,
  Grass:         1280,
  Sand:          1296,
  Fabric:        1312,
  Glass:         1568,
  Ice:           1584,
  Neon:          288,
}

function materialToEnum(name: string | undefined): number {
  if (!name) return MATERIAL_ENUM.Plastic
  return MATERIAL_ENUM[name] ?? MATERIAL_ENUM.Plastic
}

// ── Serialize a single command into an RBXMX <Item> ─────────────────────────
// Only "creation" commands produce output. Other commands (set_property,
// delete_*, move_instance, clone_instance) are skipped because the .rbxmx
// file is a standalone model — there's nothing for those verbs to target.

function serializePart(cmd: {
  name: string
  position: { x: number; y: number; z: number }
  size: { x: number; y: number; z: number }
  color: { r: number; g: number; b: number }
  material: string
  anchored: boolean
}): string {
  const ref = nextRef()
  // Roblox stores Color3 components as 0–1 floats in RBXMX.
  const cr = (cmd.color.r / 255).toFixed(6)
  const cg = (cmd.color.g / 255).toFixed(6)
  const cb = (cmd.color.b / 255).toFixed(6)
  const materialEnum = materialToEnum(cmd.material)
  return `
  <Item class="Part" referent="${ref}">
    <Properties>
      <bool name="Anchored">${cmd.anchored ? 'true' : 'false'}</bool>
      <Color3 name="Color3uint8">
        <R>${cmd.color.r}</R>
        <G>${cmd.color.g}</G>
        <B>${cmd.color.b}</B>
      </Color3>
      <Color3 name="Color">
        <R>${cr}</R>
        <G>${cg}</G>
        <B>${cb}</B>
      </Color3>
      <CoordinateFrame name="CFrame">
        <X>${cmd.position.x}</X>
        <Y>${cmd.position.y}</Y>
        <Z>${cmd.position.z}</Z>
        <R00>1</R00><R01>0</R01><R02>0</R02>
        <R10>0</R10><R11>1</R11><R12>0</R12>
        <R20>0</R20><R21>0</R21><R22>1</R22>
      </CoordinateFrame>
      <token name="Material">${materialEnum}</token>
      <string name="Name">${escapeXml(cmd.name)}</string>
      <Vector3 name="size">
        <X>${cmd.size.x}</X>
        <Y>${cmd.size.y}</Y>
        <Z>${cmd.size.z}</Z>
      </Vector3>
    </Properties>
  </Item>`
}

function serializeModel(cmd: { name: string }, children: string[]): string {
  const ref = nextRef()
  return `
  <Item class="Model" referent="${ref}">
    <Properties>
      <string name="Name">${escapeXml(cmd.name)}</string>
    </Properties>${children.join('')}
  </Item>`
}

function serializeFolder(cmd: { name: string }): string {
  const ref = nextRef()
  return `
  <Item class="Folder" referent="${ref}">
    <Properties>
      <string name="Name">${escapeXml(cmd.name)}</string>
    </Properties>
  </Item>`
}

function serializeScript(cmd: {
  name: string
  scriptType: 'Script' | 'LocalScript' | 'ModuleScript'
  source: string
}): string {
  const ref = nextRef()
  return `
  <Item class="${cmd.scriptType}" referent="${ref}">
    <Properties>
      <string name="Name">${escapeXml(cmd.name)}</string>
      <ProtectedString name="Source">${escapeXml(cmd.source)}</ProtectedString>
    </Properties>
  </Item>`
}

// ── Build the full RBXMX document ────────────────────────────────────────────

function buildRbxmx(commands: StructuredCommand[]): string {
  // Group: model-name → child item XML strings
  const modelChildren = new Map<string, string[]>()
  // Top-level items (parts/models/folders/scripts with no parent model)
  const topLevelItems: string[] = []

  // First pass: register all models so child parts can be grouped under them.
  for (const cmd of commands) {
    if (cmd.type === 'create_model') {
      modelChildren.set(cmd.name, [])
    }
  }

  for (const cmd of commands) {
    switch (cmd.type) {
      case 'create_part': {
        const item = serializePart(cmd)
        const parentBucket = modelChildren.get(cmd.parentName)
        if (parentBucket) parentBucket.push(item)
        else topLevelItems.push(item)
        break
      }
      case 'create_model': {
        // Serialized after children are collected, below
        break
      }
      case 'create_folder': {
        topLevelItems.push(serializeFolder(cmd))
        break
      }
      case 'create_script': {
        topLevelItems.push(
          serializeScript({
            name: cmd.name,
            scriptType: cmd.scriptType,
            source: cmd.source,
          }),
        )
        break
      }
      // Intentionally skipped: create_instance, set_property, delete_*,
      // move_instance, clone_instance, insert_asset, execute_script.
      // These either target pre-existing instances (pointless in a fresh
      // import) or require runtime services (InsertService, loadstring).
      default:
        break
    }
  }

  // Emit each model with its collected children
  for (const cmd of commands) {
    if (cmd.type === 'create_model') {
      const kids = modelChildren.get(cmd.name) ?? []
      topLevelItems.push(serializeModel({ name: cmd.name }, kids))
    }
  }

  // Wrap in RBXMX root. externalmodels/externalnulls are required elements
  // for a valid .rbxmx; the empty variants below match what Studio writes.
  return `<?xml version="1.0" encoding="UTF-8"?>
<roblox version="4" xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd">
  <External>null</External>
  <External>nil</External>${topLevelItems.join('')}
</roblox>
`
}

// ── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, exportSchema)
  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, error: parsed.error },
      { status: parsed.status, headers: CORS_HEADERS },
    )
  }

  const body = parsed.data
  let commands: StructuredCommand[] = []

  if (body.commands && body.commands.length > 0) {
    // Trust the caller's typed commands — they already pass our UI validators.
    commands = body.commands as unknown as StructuredCommand[]
  } else if (body.luauCode) {
    const translated = luauToStructuredCommands(body.luauCode)
    commands = translated.commands
    if (commands.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'no_exportable_commands',
          message:
            'The provided code does not contain any Instance.new() statements '
            + 'that can be exported as a standalone .rbxmx file. Use the Copy '
            + 'Code path and paste into the Command Bar instead.',
          warnings: translated.warnings,
        },
        { status: 422, headers: CORS_HEADERS },
      )
    }
  } else {
    return NextResponse.json(
      { ok: false, error: 'no_input' },
      { status: 400, headers: CORS_HEADERS },
    )
  }

  const xml = buildRbxmx(commands)
  const fileName =
    (body.fileName && /^[\w\-. ]+$/.test(body.fileName) ? body.fileName : 'forjegames-build')
    + '.rbxmx'

  return new NextResponse(xml, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/vnd.roblox.rbxmx+xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store',
    },
  })
}
