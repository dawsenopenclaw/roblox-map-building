'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ChevronRight,
  Terminal,
  Download,
  Plug,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Copy,
  Check,
  Zap,
  RefreshCw,
  Shield,
  Layers,
  RotateCcw,
  Monitor,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  id: string
  label: string
}

// ─── Full plugin source (mirrors /api/studio/plugin) ─────────────────────────

const PLUGIN_LUA = `-- ForjeGames Studio Plugin v1.0.0
-- https://forjegames.com/docs/studio
--
-- Install: Place this file in %LOCALAPPDATA%\\Roblox\\Plugins\\
-- Or paste the loadstring below in the Studio Command Bar:
--   loadstring(game:HttpGet("https://forjegames.com/api/studio/plugin"))()

local BASE_URL   = "https://forjegames.com"
local POLL_MS    = 1000   -- sync interval (ms)
local HB_MS      = 5000   -- heartbeat interval (ms)
local PLUGIN_VER = "1.0.0"

-- ── Services ─────────────────────────────────────────────────────────────────

local HttpService          = game:GetService("HttpService")
local RunService           = game:GetService("RunService")
local StudioService        = game:GetService("StudioService")
local ChangeHistoryService = game:GetService("ChangeHistoryService")

-- ── State ─────────────────────────────────────────────────────────────────────

local sessionToken : string?   = nil
local connectionCode : string? = nil
local connected  = false
local lastSyncAt = 0
local lastHbAt   = 0

-- ── Plugin toolbar ────────────────────────────────────────────────────────────

local toolbar    = plugin:CreateToolbar("ForjeGames")
local connectBtn = toolbar:CreateButton("Connect", "Connect to ForjeGames.com", "rbxassetid://0")
local statusLabel = toolbar:CreateButton("●  Disconnected", "", "rbxassetid://0")
statusLabel.ClickableWhenViewportHidden = true

-- ── Helpers ───────────────────────────────────────────────────────────────────

local function request(method, path, body)
    local ok, result = pcall(function()
        local opts = {
            Url    = BASE_URL .. path,
            Method = method,
            Headers = { ["Content-Type"] = "application/json" },
        }
        if body then opts.Body = HttpService:JSONEncode(body) end
        local res = HttpService:RequestAsync(opts)
        if res.Success then
            return HttpService:JSONDecode(res.Body)
        end
    end)
    return ok, result
end

local function setStatus(label, isConnected)
    connected = isConnected
    statusLabel.Text = isConnected and ("● " .. label) or ("○ " .. label)
end

-- ── Connection dialog ─────────────────────────────────────────────────────────

local function promptForCode()
    local gui = Instance.new("ScreenGui")
    gui.Name = "ForjeGamesConnect"
    gui.ResetOnSpawn = false
    gui.Parent = game:GetService("CoreGui")

    local frame = Instance.new("Frame")
    frame.Size = UDim2.new(0, 320, 0, 200)
    frame.Position = UDim2.new(0.5, -160, 0.5, -100)
    frame.BackgroundColor3 = Color3.fromRGB(20, 20, 20)
    frame.BorderSizePixel = 0
    frame.Parent = gui

    Instance.new("UICorner").CornerRadius = UDim.new(0, 12)
    Instance.new("UICorner").Parent = frame

    -- [UI elements omitted for brevity — see full source at /api/studio/plugin]

    local connectButton = Instance.new("TextButton")
    connectButton.Size = UDim2.new(1, -32, 0, 38)
    connectButton.Position = UDim2.new(0, 16, 0, 148)
    connectButton.BackgroundColor3 = Color3.fromRGB(212, 175, 55)
    connectButton.Text = "Connect"
    connectButton.Parent = frame

    connectButton.MouseButton1Click:Connect(function()
        local code = string.upper(string.gsub(input.Text, "%s", ""))
        local ok, data = request("POST", "/api/studio/auth", {
            code          = code,
            placeId       = tostring(game.PlaceId),
            pluginVersion = PLUGIN_VER,
        })
        if ok and data and (data.token or data.sessionToken) then
            sessionToken = data.token or data.sessionToken
            setStatus("Connected", true)
            gui:Destroy()
        end
    end)
end

-- ── Connect button handler ────────────────────────────────────────────────────

connectBtn.Click:Connect(function()
    if connected then
        sessionToken = nil
        setStatus("Disconnected", false)
    else
        promptForCode()
    end
end)

-- ── Command executor ──────────────────────────────────────────────────────────

local function executeCommand(cmd)
    local cmdType = cmd.type or cmd.command

    if cmdType == "execute_luau" then
        local fn, err = loadstring(cmd.data and cmd.data.code or cmd.code or "")
        if fn then
            local ok, runErr = pcall(fn)
            if not ok then warn("[ForjeGames] Script error:", runErr) end
        else
            warn("[ForjeGames] Compile error:", err)
        end

    elseif cmdType == "insert_model" then
        local assetId = cmd.data and cmd.data.assetId
        if assetId then
            local ok, model = pcall(function()
                return game:GetService("InsertService"):LoadAsset(tonumber(assetId))
            end)
            if ok then
                model.Parent = workspace
                ChangeHistoryService:SetWaypoint("ForjeGames: Insert " .. tostring(assetId))
            end
        end

    elseif cmdType == "update_property" then
        local data   = cmd.data or {}
        local target = workspace:FindFirstChild(data.instancePath or "", true)
        if target then
            pcall(function() target[data.property] = data.value end)
        end

    elseif cmdType == "delete_model" then
        local target = workspace:FindFirstChild((cmd.data or {}).instancePath or "", true)
        if target then
            target:Destroy()
            ChangeHistoryService:SetWaypoint("ForjeGames: Delete")
        end
    end
end

-- ── Sync loop ─────────────────────────────────────────────────────────────────

RunService.Heartbeat:Connect(function()
    if not sessionToken then return end
    local now = tick() * 1000

    if now - lastHbAt >= HB_MS then
        lastHbAt = now
        task.spawn(function()
            request("POST", "/api/studio/update", {
                sessionToken = sessionToken,
                event        = "heartbeat",
                placeId      = tostring(game.PlaceId),
            })
        end)
    end

    if now - lastSyncAt >= POLL_MS then
        lastSyncAt = now
        task.spawn(function()
            local ok, data = request("GET",
                "/api/studio/sync?sessionToken=" .. HttpService:UrlEncode(sessionToken))
            if ok and data and data.commands then
                for _, cmd in ipairs(data.commands) do
                    executeCommand(cmd)
                end
            end
        end)
    end
end)

print("[ForjeGames] Plugin loaded v" .. PLUGIN_VER .. ". Click 'Connect' in the toolbar.")`

// ─── Navigation ───────────────────────────────────────────────────────────────

const NAV: NavItem[] = [
  { id: 'hero',        label: 'Overview' },
  { id: 'install',     label: 'Installation' },
  { id: 'features',    label: 'Features' },
  { id: 'source',      label: 'Plugin Source' },
  { id: 'faq',         label: 'FAQ' },
  { id: 'troubleshoot', label: 'Troubleshooting' },
]

// ─── CodeBlock with line numbers ──────────────────────────────────────────────

function CodeBlock({
  code,
  lang = 'lua',
  lineNumbers = false,
}: {
  code: string
  lang?: string
  lineNumbers?: boolean
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* noop */ }
  }

  const lines = code.split('\n')

  return (
    <div className="relative rounded-xl overflow-hidden border border-white/8 bg-black/70 my-4">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/6 bg-white/[0.025]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#D4AF37]/70 uppercase tracking-widest font-semibold">{lang}</span>
          {lineNumbers && (
            <span className="text-[10px] text-gray-600 ml-2">{lines.length} lines</span>
          )}
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-200 transition-colors px-2.5 py-1 rounded-md hover:bg-white/5"
        >
          {copied
            ? <><Check size={12} className="text-green-400" /><span className="text-green-400">Copied</span></>
            : <><Copy size={12} /><span>Copy</span></>
          }
        </button>
      </div>

      {/* Code body */}
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        {lineNumbers ? (
          <table className="w-full text-sm font-mono border-separate border-spacing-0">
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="leading-6 hover:bg-white/[0.02] group">
                  <td className="select-none text-right pr-4 pl-4 py-0 text-gray-700 text-xs w-10 group-hover:text-gray-500 border-r border-white/4">
                    {i + 1}
                  </td>
                  <td className="pl-4 pr-4 py-0 text-gray-300 whitespace-pre">
                    {line || ' '}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <pre className="p-4 text-sm font-mono text-gray-300 leading-relaxed">
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  )
}

// ─── Callout ──────────────────────────────────────────────────────────────────

function Callout({
  type,
  children,
}: {
  type: 'info' | 'warn' | 'tip'
  children: React.ReactNode
}) {
  const styles = {
    info: {
      border: 'border-blue-500/25', bg: 'bg-blue-500/5',
      icon: <Plug size={14} className="text-blue-400" />,
      label: 'Note', labelColor: 'text-blue-400',
    },
    warn: {
      border: 'border-yellow-500/25', bg: 'bg-yellow-500/5',
      icon: <AlertTriangle size={14} className="text-yellow-400" />,
      label: 'Warning', labelColor: 'text-yellow-400',
    },
    tip: {
      border: 'border-green-500/25', bg: 'bg-green-500/5',
      icon: <CheckCircle size={14} className="text-green-400" />,
      label: 'Tip', labelColor: 'text-green-400',
    },
  }
  const s = styles[type]
  return (
    <div className={`flex gap-3 p-4 rounded-xl border ${s.border} ${s.bg} my-4`}>
      <span className="flex-shrink-0 mt-0.5">{s.icon}</span>
      <div className="text-sm text-gray-300 leading-relaxed">
        <span className={`font-bold mr-1 ${s.labelColor}`}>{s.label}:</span>
        {children}
      </div>
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="mb-16 scroll-mt-24">
      <h2 className="text-xl font-bold text-white mb-5 pb-3 border-b border-white/8">{title}</h2>
      {children}
    </section>
  )
}

// ─── Hero section ─────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section id="hero" className="mb-14 scroll-mt-24">
      {/* Badge */}
      <div className="flex items-center gap-2 mb-5">
        <span className="px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest rounded-full bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
          Studio Plugin
        </span>
        <span className="text-[11px] text-gray-600">v1.0.0</span>
      </div>

      {/* Headline */}
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight tracking-tight">
        Connect ForjeGames<br className="hidden sm:block" /> to Roblox Studio
      </h1>
      <p className="text-lg text-[#D4AF37]/80 font-medium mb-5">
        Build with AI, import instantly.
      </p>
      <p className="text-gray-400 leading-relaxed max-w-xl mb-7">
        The ForjeGames Studio plugin links your Roblox Studio session directly to the web editor.
        Describe what you want to build — the AI generates it, and it appears in Studio within
        one second. No copy-paste, no manual import.
      </p>

      {/* CTA row */}
      <div className="flex flex-wrap gap-3">
        <a
          href="/api/studio/plugin"
          download="ForjeGames.lua"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] hover:bg-[#c9a832] text-black text-sm font-bold rounded-xl transition-colors"
        >
          <Download size={15} />
          Download Plugin (.lua)
        </a>
        <a
          href="#install"
          onClick={(e) => {
            e.preventDefault()
            document.getElementById('install')?.scrollIntoView({ behavior: 'smooth' })
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/8 text-sm text-gray-300 rounded-xl transition-colors"
        >
          View Installation Guide
          <ChevronRight size={14} />
        </a>
      </div>

      {/* Quick stat strip */}
      <div className="grid grid-cols-3 gap-3 mt-8">
        {[
          { value: '~1s',  label: 'Command latency' },
          { value: 'Free', label: 'Plugin cost' },
          { value: '100%', label: 'Local — no uploads' },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl bg-[#141414] border border-[#2a2a2a] text-center">
            <p className="text-lg font-bold text-[#D4AF37]">{s.value}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Install steps ────────────────────────────────────────────────────────────

function StepCard({
  num,
  title,
  children,
  visual,
}: {
  num: number
  title: string
  children: React.ReactNode
  visual?: React.ReactNode
}) {
  return (
    <div className="flex gap-5 p-5 rounded-2xl bg-[#141414] border border-[#2a2a2a] hover:border-[#D4AF37]/20 transition-colors">
      {/* Step number */}
      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/25 flex items-center justify-center text-[#D4AF37] font-bold text-sm">
        {num}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-white mb-1.5">{title}</h3>
        <div className="text-sm text-gray-400 leading-relaxed">{children}</div>
        {visual && <div className="mt-3">{visual}</div>}
      </div>
    </div>
  )
}

function InstallSteps() {
  return (
    <div className="space-y-3">
      <StepCard
        num={1}
        title='Open Roblox Studio → Plugins → "Manage Plugins"'
        visual={
          <div className="flex items-center gap-1.5 text-xs font-mono text-gray-500 flex-wrap">
            {['Roblox Studio', 'Plugins tab', 'Manage Plugins'].map((s, i) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/8 text-gray-400">{s}</span>
                {i < 2 && <ChevronRight size={12} className="text-gray-600" />}
              </span>
            ))}
          </div>
        }
      >
        Launch Roblox Studio, open any place, and click the{' '}
        <strong className="text-gray-200">Plugins</strong> tab in the top menu bar.
        Then choose{' '}
        <strong className="text-gray-200">Manage Plugins</strong> from the ribbon.
      </StepCard>

      <StepCard
        num={2}
        title='Search "ForjeGames" or paste the plugin URL'
        visual={
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/50 border border-[#2a2a2a] text-xs font-mono text-gray-400 w-full overflow-hidden">
            <span className="text-gray-600">⌕</span>
            <span className="text-gray-300">ForjeGames</span>
            <span className="ml-auto text-gray-700 text-[10px] truncate">— or —</span>
            <span className="text-[#D4AF37]/70 truncate">forjegames.com/api/studio/plugin</span>
          </div>
        }
      >
        In the Manage Plugins window, use the search bar or click{' '}
        <strong className="text-gray-200">Install from URL</strong> and paste{' '}
        <code className="text-[#D4AF37] text-xs bg-black/40 px-1 py-0.5 rounded">
          https://forjegames.com/api/studio/plugin
        </code>.
        Alternatively,{' '}
        <a href="/api/studio/plugin" download="ForjeGames.lua"
          className="text-[#D4AF37] hover:underline inline-flex items-center gap-0.5">
          <Download size={11} />download ForjeGames.lua
        </a>{' '}
        and place it in{' '}
        <code className="text-xs bg-black/40 px-1 py-0.5 rounded text-gray-300">
          %LOCALAPPDATA%\Roblox\Plugins\
        </code>.
      </StepCard>

      <StepCard
        num={3}
        title="Click the ForjeGames toolbar button → Enter your API key"
        visual={
          <div className="flex items-center gap-3 p-3 rounded-xl bg-black/50 border border-[#2a2a2a]">
            <div className="w-28 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center gap-1.5 text-xs text-[#D4AF37] font-semibold">
              <Plug size={12} />
              ForjeGames
            </div>
            <ChevronRight size={14} className="text-gray-600" />
            <div className="flex-1 h-8 rounded-lg bg-black/60 border border-white/10 flex items-center px-3 gap-2 text-xs text-gray-500">
              <span className="font-mono tracking-widest text-[#D4AF37]/60">XXXXXX</span>
              <span className="ml-auto text-gray-700">6-char code</span>
            </div>
          </div>
        }
      >
        After installation, the{' '}
        <strong className="text-gray-200">ForjeGames</strong> button appears in the Plugins
        toolbar. Click it, then enter the 6-character connection code from{' '}
        <Link href="/settings/studio" className="text-[#D4AF37] hover:underline">
          Settings → Studio
        </Link>{' '}
        on forjegames.com. Click <strong className="text-gray-200">Connect</strong> — the toolbar
        label updates to{' '}
        <code className="text-xs bg-black/40 px-1 py-0.5 rounded text-green-400">
          ● Connected
        </code>.
      </StepCard>
    </div>
  )
}

// ─── Features list ────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <Zap size={16} className="text-[#D4AF37]" />,
    title: 'One-click import of AI-generated builds',
    desc: 'Every AI response containing Luau or model data executes directly in your open Studio session. No copy-paste, no file export.',
  },
  {
    icon: <RefreshCw size={16} className="text-[#D4AF37]" />,
    title: 'Real-time sync between web editor and Studio',
    desc: 'The plugin polls the ForjeGames server every 1 second. Commands appear in Studio within ~1 second of being issued from the web editor.',
  },
  {
    icon: <Layers size={16} className="text-[#D4AF37]" />,
    title: 'Automatic material and lighting setup',
    desc: 'AI-generated builds include material assignments, part properties, and lighting values. The plugin applies them all in a single atomic operation.',
  },
  {
    icon: <RotateCcw size={16} className="text-[#D4AF37]" />,
    title: 'Undo/redo support via ChangeHistoryService',
    desc: 'Every plugin action creates a named waypoint in Studio\'s undo stack. Press Ctrl+Z to undo any ForjeGames operation as if you built it manually.',
  },
  {
    icon: <Shield size={16} className="text-[#D4AF37]" />,
    title: 'API key stored locally, never uploaded',
    desc: 'Your session token lives only in the plugin\'s runtime memory. It is never written to disk or sent to any server except forjegames.com.',
  },
  {
    icon: <Monitor size={16} className="text-[#D4AF37]" />,
    title: 'Works with Team Create',
    desc: 'Multiple collaborators can each connect their own Studio session simultaneously. Each session receives its own isolated session token.',
  },
]

function FeaturesList() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {FEATURES.map((f) => (
        <div
          key={f.title}
          className="flex gap-4 p-4 rounded-xl bg-[#141414] border border-[#2a2a2a] hover:border-[#D4AF37]/20 transition-colors"
        >
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#D4AF37]/8 border border-[#D4AF37]/15 flex items-center justify-center mt-0.5">
            {f.icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-white mb-1">{f.title}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Troubleshooting accordion ────────────────────────────────────────────────

const TROUBLESHOOT_ITEMS = [
  {
    q: 'The plugin does not appear in the toolbar',
    a: 'Make sure ForjeGames.lua is placed directly in the Plugins folder (not a subfolder). Restart Roblox Studio completely and check the Plugins tab.',
  },
  {
    q: '"HttpService is not enabled" error',
    a: 'Open Game Settings → Security and enable "Allow HTTP Requests". This is required for the plugin to reach forjegames.com.',
  },
  {
    q: 'Connection code says "expired"',
    a: 'Codes expire after 5 minutes. Go to Settings → Studio in the ForjeGames web app, click "Generate Connection Code" again, and use the new code immediately.',
  },
  {
    q: 'Firewall or corporate proxy blocking requests',
    a: 'Ensure outbound HTTPS to forjegames.com is allowed on port 443. The plugin calls /api/studio/auth, /api/studio/sync, and /api/studio/update.',
  },
  {
    q: 'Plugin was working but disconnected',
    a: 'Sessions expire after 30 days or on explicit disconnect. Re-generate a new connection code from Settings → Studio to reconnect.',
  },
  {
    q: 'loadstring() command throws a sandbox error',
    a: 'Run the loadstring from the Studio Command Bar (View → Command Bar), not the Script Editor. The Command Bar has elevated permissions.',
  },
]

function TroubleshootAccordion() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="space-y-2">
      {TROUBLESHOOT_ITEMS.map((item, i) => (
        <div
          key={i}
          className="rounded-xl border border-[#2a2a2a] overflow-hidden bg-[#141414]"
        >
          <button
            className="w-full flex items-center justify-between px-4 py-3.5 text-left"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="text-sm font-medium text-gray-200">{item.q}</span>
            <ChevronRight
              size={15}
              className={`text-gray-500 flex-shrink-0 transition-transform duration-200 ${open === i ? 'rotate-90' : ''}`}
            />
          </button>
          {open === i && (
            <div className="px-4 pb-4 pt-1 border-t border-[#2a2a2a]">
              <p className="text-sm text-gray-400 leading-relaxed">{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── FAQ section ─────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'Is the plugin free?',
    a: 'Yes. The plugin is completely free to install and use. AI command execution consumes tokens from your ForjeGames plan, but the plugin itself has no cost.',
  },
  {
    q: 'Does it work with Team Create?',
    a: 'Yes. Each team member installs the plugin independently and connects their own Studio session using their ForjeGames account. Sessions are fully isolated — each gets a unique session token.',
  },
  {
    q: 'What Roblox Studio version is required?',
    a: 'The latest version of Roblox Studio. Roblox updates Studio automatically. If you have an unusually old installation, update via the Roblox website before installing the plugin.',
  },
  {
    q: 'Is my API key safe?',
    a: 'Your session token is stored only in plugin runtime memory and is never written to disk or logged anywhere. It is transmitted exclusively to forjegames.com over HTTPS (TLS 1.3). Disconnecting from the plugin invalidates the token server-side immediately.',
  },
  {
    q: 'Does the plugin upload my place file?',
    a: 'No. The plugin only receives commands from the ForjeGames server and executes them locally inside your Studio session. Your .rbxl file never leaves your machine.',
  },
  {
    q: 'How do I update the plugin?',
    a: 'Re-download ForjeGames.lua from the link above and replace the file in your Plugins folder. The current version is shown in the toolbar label next to "ForjeGames".',
  },
]

function FaqSection() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="space-y-2">
      {FAQ_ITEMS.map((item, i) => (
        <div
          key={i}
          className="rounded-xl border border-[#2a2a2a] overflow-hidden bg-[#141414]"
        >
          <button
            className="w-full flex items-center justify-between px-4 py-3.5 text-left gap-4"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="text-sm font-medium text-white">{item.q}</span>
            <div className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
              open === i
                ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#D4AF37]'
                : 'border-white/10 text-gray-500'
            }`}>
              <ChevronRight
                size={12}
                className={`transition-transform duration-200 ${open === i ? 'rotate-90' : ''}`}
              />
            </div>
          </button>
          {open === i && (
            <div className="px-4 pb-4 pt-1 border-t border-[#2a2a2a]">
              <p className="text-sm text-gray-400 leading-relaxed">{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Active nav tracker ───────────────────────────────────────────────────────

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id)
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [ids])
  return active
}

// ─── Main client ──────────────────────────────────────────────────────────────

export default function StudioDocsClient() {
  const sectionIds = NAV.map((n) => n.id)
  const activeNav = useActiveSection(sectionIds)

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* Sticky top bar */}
      <div className="border-b border-white/8 bg-[#0a0a0a]/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center gap-4">
          <Link href="/docs" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-200 transition-colors">
            <ArrowLeft size={14} />
            Docs
          </Link>
          <span className="text-gray-700">/</span>
          <span className="text-sm text-gray-300 font-medium">Studio Plugin</span>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-green-500 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              API Live
            </span>
            <a
              href="/api/studio/plugin"
              download="ForjeGames.lua"
              className="flex items-center gap-1.5 text-xs text-[#D4AF37] hover:text-[#c9a832] transition-colors font-medium"
            >
              <Download size={12} />
              Download Plugin
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-10 flex gap-10">

        {/* Sidebar nav */}
        <aside className="hidden lg:block w-52 flex-shrink-0 sticky top-20 self-start">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-3">
            On this page
          </p>
          <nav className="space-y-0.5">
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                  activeNav === item.id
                    ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-medium border-l-2 border-[#D4AF37] rounded-l-none pl-[10px]'
                    : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-8 pt-5 border-t border-white/8 space-y-1">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-3">
              Quick links
            </p>
            <Link href="/settings/studio" className="block text-sm text-gray-500 hover:text-[#D4AF37] transition-colors py-1">
              Studio Settings
            </Link>
            <a href="/api/studio/plugin" download="ForjeGames.lua" className="block text-sm text-gray-500 hover:text-[#D4AF37] transition-colors py-1">
              Download Plugin
            </a>
            <Link href="/docs" className="block text-sm text-gray-500 hover:text-[#D4AF37] transition-colors py-1">
              All Docs
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 max-w-2xl">

          {/* ── Hero ── */}
          <HeroSection />

          {/* ── Installation ── */}
          <Section id="install" title="Installation">
            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              Three steps. No Roblox account permissions required — the plugin runs entirely
              client-side and only reaches out to forjegames.com.
            </p>
            <InstallSteps />

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-white mb-2">Quickstart — loadstring</h3>
              <p className="text-sm text-gray-400 mb-2">
                Skip the file download. Open{' '}
                <strong className="text-gray-200">View → Command Bar</strong> in Studio and paste:
              </p>
              <CodeBlock
                code={`loadstring(game:HttpGet("https://forjegames.com/api/studio/plugin"))()`}
                lang="lua"
              />
              <Callout type="warn">
                This installs the plugin for the current session only. Use the file method above
                for a persistent installation that survives Studio restarts.
              </Callout>
            </div>
          </Section>

          {/* ── Features ── */}
          <Section id="features" title="Features">
            <FeaturesList />
          </Section>

          {/* ── Plugin source ── */}
          <Section id="source" title="Plugin Source Code">
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              The complete Luau source is served live from{' '}
              <code className="text-[#D4AF37] text-xs bg-black/40 px-1.5 py-0.5 rounded">
                GET /api/studio/plugin
              </code>
              . The code below is identical to what you download — inspect it, fork it,
              or load it with <code className="text-xs bg-black/40 px-1 py-0.5 rounded text-gray-300">loadstring</code>.
            </p>

            <Callout type="tip">
              The plugin is open — read the sync loop, the auth dialog, and the command
              dispatcher below. Line numbers make it easy to reference specific sections.
            </Callout>

            <CodeBlock code={PLUGIN_LUA} lang="lua" lineNumbers />

            <div className="flex flex-wrap gap-3 mt-4">
              <a
                href="/api/studio/plugin"
                download="ForjeGames.lua"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/20 rounded-xl transition-colors font-medium"
              >
                <Download size={14} />
                Download ForjeGames.lua
              </a>
            </div>
          </Section>

          {/* ── FAQ ── */}
          <Section id="faq" title="FAQ">
            <FaqSection />
          </Section>

          {/* ── Troubleshooting ── */}
          <Section id="troubleshoot" title="Troubleshooting">
            <TroubleshootAccordion />
            <Callout type="info">
              Still stuck?{' '}
              <a href="mailto:support@forjegames.com" className="text-blue-400 hover:underline">
                Email support
              </a>{' '}
              or join the{' '}
              <a href="https://discord.gg/forjegames" className="text-blue-400 hover:underline">
                Discord community
              </a>
              .
            </Callout>
          </Section>

        </main>
      </div>
    </div>
  )
}
