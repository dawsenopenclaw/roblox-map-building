/**
 * ELI Action Executor v4 — Full site access. Code, DB, Discord, health, everything.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
import type { EliAction } from './brain'
import { queryCodegraph } from './brain'
import { addMemory } from './memory'
import {
  queryUsers, getUserStats, getBuildStats, checkSiteHealth,
  getRecentDiscordMessages, getDiscordServerInfo, postDiscordReply,
} from './site-ops'

const PROJECT_ROOT = process.env.PROJECT_ROOT || 'C:/dev/roblox-map-building'
const FIXES_FILE = join(process.cwd(), 'scripts', '.forje-fixes-overrides.json')
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN

// ─── Safety: only allow edits within the project ─────────────────────────────
function isPathSafe(filePath: string): boolean {
  const resolved = join(PROJECT_ROOT, filePath).replace(/\\/g, '/')
  const root = PROJECT_ROOT.replace(/\\/g, '/')
  if (!resolved.startsWith(root)) return false
  // Block editing secrets, env, node_modules
  if (filePath.includes('node_modules')) return false
  if (filePath.match(/\.env($|\.)/)) return false
  if (filePath.includes('.git/')) return false
  return true
}

// ─── Discord Helper ──────────────────────────────────────────────────────────
async function discordPost(channelId: string, body: Record<string, unknown>) {
  if (!BOT_TOKEN) return { success: false, error: 'No bot token' }
  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text()
      return { success: false, error: `Discord ${res.status}: ${text.slice(0, 100)}` }
    }
    const data = await res.json()
    return { success: true, messageId: data.id }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

const CHANNEL_MAP: Record<string, string> = {
  'announcements': '1495873969704665248',
  'bug-log': '1495873972162789478',
  'leaderboard': '1495873973228142632',
  'general': '1495873970904236083',
  'suggestions': '1495873961580298300',
  'feature-requests': '1495873966542164078',
}

function loadOverrides(): Record<string, Record<string, unknown>> {
  try {
    if (existsSync(FIXES_FILE)) return JSON.parse(readFileSync(FIXES_FILE, 'utf-8'))
  } catch {}
  return {}
}

function saveOverrides(overrides: Record<string, Record<string, unknown>>) {
  writeFileSync(FIXES_FILE, JSON.stringify(overrides, null, 2))
}

// ─── Execute Action ──────────────────────────────────────────────────────────
export async function executeAction(action: EliAction): Promise<EliAction> {
  const result = { ...action }

  try {
    switch (action.type) {

      // ── File Operations ──────────────────────────────────────────────────
      case 'read_file': {
        const { path, startLine, endLine } = action.params as {
          path: string; startLine?: number; endLine?: number
        }
        if (!path) { result.result = 'Missing path'; result.success = false; break }
        if (!isPathSafe(path)) { result.result = 'Path blocked (security)'; result.success = false; break }

        const fullPath = join(PROJECT_ROOT, path)
        if (!existsSync(fullPath)) { result.result = `File not found: ${path}`; result.success = false; break }

        const content = readFileSync(fullPath, 'utf-8')
        const lines = content.split('\n')

        if (startLine != null && endLine != null) {
          const slice = lines.slice(Math.max(0, startLine - 1), endLine).join('\n')
          result.result = `${path}:${startLine}-${endLine} (${endLine - startLine + 1} lines)\n\`\`\`\n${slice.slice(0, 3000)}\n\`\`\``
        } else {
          result.result = `${path} (${lines.length} lines)\n\`\`\`\n${content.slice(0, 3000)}${content.length > 3000 ? '\n... truncated' : ''}\n\`\`\``
        }
        result.success = true
        break
      }

      case 'edit_file': {
        const { path, search, replace } = action.params as {
          path: string; search: string; replace: string
        }
        if (!path || search == null || replace == null) {
          result.result = 'Need path, search, and replace'; result.success = false; break
        }
        if (!isPathSafe(path)) { result.result = 'Path blocked (security)'; result.success = false; break }

        const fullPath = join(PROJECT_ROOT, path)
        if (!existsSync(fullPath)) { result.result = `File not found: ${path}`; result.success = false; break }

        const content = readFileSync(fullPath, 'utf-8')
        if (!content.includes(search)) {
          result.result = `Search string not found in ${path}. No changes made.`
          result.success = false
          break
        }

        // Only replace first occurrence to be safe
        const newContent = content.replace(search, replace)
        writeFileSync(fullPath, newContent)

        const diffPreview = `--- ${path}\n-${search.slice(0, 200)}\n+${replace.slice(0, 200)}`
        result.result = `Edited ${path}\n${diffPreview}`
        result.success = true
        break
      }

      case 'create_file': {
        const { path, content } = action.params as { path: string; content: string }
        if (!path || !content) { result.result = 'Need path and content'; result.success = false; break }
        if (!isPathSafe(path)) { result.result = 'Path blocked (security)'; result.success = false; break }

        const fullPath = join(PROJECT_ROOT, path)
        if (existsSync(fullPath)) {
          result.result = `File already exists: ${path}. Use edit_file instead.`
          result.success = false
          break
        }

        writeFileSync(fullPath, content)
        result.result = `Created ${path} (${content.length} chars)`
        result.success = true
        break
      }

      // ── Shell Commands ───────────────────────────────────────────────────
      case 'run_command': {
        const { command } = action.params as { command: string }
        if (!command) { result.result = 'Missing command'; result.success = false; break }

        // Safety: block destructive commands
        const blocked = ['rm -rf', 'del /s', 'format', 'drop database', 'git push --force',
          'git reset --hard', 'shutdown', 'reboot', 'npm publish']
        if (blocked.some((b) => command.toLowerCase().includes(b))) {
          result.result = `Blocked: "${command}" is destructive`
          result.success = false
          break
        }

        try {
          const output = execSync(command, {
            cwd: PROJECT_ROOT,
            timeout: 30_000,
            encoding: 'utf-8',
            maxBuffer: 50_000,
          })
          result.result = output.trim().slice(0, 2000) || '(no output)'
          result.success = true
        } catch (err) {
          const e = err as { stderr?: string; stdout?: string; message?: string }
          result.result = `Command failed: ${(e.stderr || e.stdout || e.message || '').slice(0, 500)}`
          result.success = false
        }
        break
      }

      // ── Git Operations ───────────────────────────────────────────────────
      case 'git_status': {
        try {
          const status = execSync('git status --short', {
            cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 10_000,
          })
          const branch = execSync('git branch --show-current', {
            cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 5_000,
          }).trim()
          result.result = `Branch: ${branch}\n${status.trim() || 'Clean working tree'}`
          result.success = true
        } catch (err) {
          result.result = `Git error: ${(err as Error).message}`
          result.success = false
        }
        break
      }

      case 'git_diff': {
        const { path: diffPath } = action.params as { path?: string }
        try {
          const diff = execSync(
            `git diff ${diffPath ? `-- "${diffPath}"` : ''}`,
            { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 10_000, maxBuffer: 50_000 }
          )
          result.result = diff.trim().slice(0, 3000) || 'No changes'
          result.success = true
        } catch (err) {
          result.result = `Git diff error: ${(err as Error).message}`
          result.success = false
        }
        break
      }

      // ── Code Intelligence ────────────────────────────────────────────────
      case 'query_code': {
        const { query } = action.params as { query: string }
        if (!query) { result.result = 'Missing query'; result.success = false; break }
        const codeResult = queryCodegraph(query)
        result.result = codeResult || 'No code context found'
        result.success = !!codeResult
        break
      }

      case 'search_symbol': {
        const { symbol } = action.params as { symbol: string }
        if (!symbol) { result.result = 'Missing symbol'; result.success = false; break }
        try {
          const searchResult = execSync(
            `codegraph query "${symbol.replace(/"/g, '\\"')}" -p "${PROJECT_ROOT}"`,
            { encoding: 'utf-8', timeout: 10_000, maxBuffer: 20_000 }
          )
          result.result = searchResult.trim().slice(0, 2000) || 'No results'
          result.success = !!searchResult.trim()
        } catch {
          result.result = 'Codegraph search failed'
          result.success = false
        }
        break
      }

      case 'find_callers': {
        const { symbol } = action.params as { symbol: string }
        if (!symbol) { result.result = 'Missing symbol'; result.success = false; break }
        try {
          const output = execSync(
            `codegraph query "${symbol.replace(/"/g, '\\"')}" -p "${PROJECT_ROOT}"`,
            { encoding: 'utf-8', timeout: 10_000, maxBuffer: 20_000 }
          )
          result.result = output.trim().slice(0, 2000) || 'No callers found'
          result.success = true
        } catch {
          result.result = 'Search failed'
          result.success = false
        }
        break
      }

      // ── Bug Tracker ──────────────────────────────────────────────────────
      case 'update_bug': {
        const { id, status, progress, staffNotes, assignee } = action.params as Record<string, unknown>
        if (!id) { result.result = 'Missing bug ID'; result.success = false; break }

        const overrides = loadOverrides()
        const existing = overrides[id as string] || {}
        overrides[id as string] = {
          ...existing,
          ...(status != null ? { status } : {}),
          ...(progress != null ? { progress } : {}),
          ...(staffNotes != null ? { staffNotes } : {}),
          ...(assignee != null ? { assignee } : {}),
          updatedAt: new Date().toISOString(),
          updatedBy: 'ELI',
        }
        saveOverrides(overrides)
        result.result = `Updated bug ${(id as string).slice(-6)}`
        result.success = true
        break
      }

      case 'bulk_update_bugs': {
        const { updates } = action.params as { updates: Array<Record<string, unknown>> }
        if (!updates?.length) { result.result = 'No updates'; result.success = false; break }

        const overrides = loadOverrides()
        let count = 0
        for (const u of updates) {
          const id = u.id as string
          if (!id) continue
          overrides[id] = {
            ...(overrides[id] || {}),
            ...(u.status != null ? { status: u.status } : {}),
            ...(u.progress != null ? { progress: u.progress } : {}),
            ...(u.staffNotes != null ? { staffNotes: u.staffNotes } : {}),
            ...(u.assignee != null ? { assignee: u.assignee } : {}),
            updatedAt: new Date().toISOString(),
            updatedBy: 'ELI',
          }
          count++
        }
        saveOverrides(overrides)
        result.result = `Bulk updated ${count} bugs`
        result.success = true
        break
      }

      case 'assign_team': {
        const { bugId, assignee, reason } = action.params as Record<string, unknown>
        if (!bugId) { result.result = 'Missing bugId'; result.success = false; break }

        const overrides = loadOverrides()
        overrides[bugId as string] = {
          ...(overrides[bugId as string] || {}),
          assignee,
          staffNotes: `Assigned to ${assignee} by ELI: ${reason || ''}`,
          updatedAt: new Date().toISOString(),
          updatedBy: 'ELI',
        }
        saveOverrides(overrides)
        result.result = `Assigned ${(bugId as string).slice(-6)} → ${assignee}`
        result.success = true
        break
      }

      // ── Discord ──────────────────────────────────────────────────────────
      case 'post_discord': {
        const { channel, message, embed } = action.params as Record<string, unknown>
        const channelId = CHANNEL_MAP[channel as string] || (channel as string)
        if (!channelId) { result.result = 'Unknown channel'; result.success = false; break }

        const body: Record<string, unknown> = {}
        if (message) body.content = (message as string).slice(0, 2000)
        if (embed) body.embeds = [embed]

        const res = await discordPost(channelId, body)
        result.result = res.success ? `Posted to #${channel}` : res.error!
        result.success = res.success
        break
      }

      // ── Memory ───────────────────────────────────────────────────────────
      case 'save_memory': {
        const { type, content, tags, confidence } = action.params as Record<string, unknown>
        const entry = addMemory(
          (type as string) as 'learning' | 'pattern' | 'decision' | 'user-pref' | 'bug-insight' | 'metric',
          content as string,
          (tags as string[]) || [],
          (confidence as number) || 70,
          'eli-conversation'
        )
        result.result = `Saved memory: ${entry.id}`
        result.success = true
        break
      }

      // ── Reports ──────────────────────────────────────────────────────────
      case 'create_report': {
        const { title, sections } = action.params as Record<string, unknown>
        result.result = [
          `# ${title || 'ELI Report'}`,
          `Generated: ${new Date().toISOString().slice(0, 16)} UTC`,
          '',
          ...((sections as string[]) || []),
        ].join('\n')
        result.success = true
        break
      }

      case 'analyze_trend':
      case 'prioritize_bugs':
      case 'suggest_fix': {
        result.result = `${action.type} included in response`
        result.success = true
        break
      }

      // ── Site Operations ────────────────────────────────────────────────
      case 'health_check': {
        const health = await checkSiteHealth()
        result.result = JSON.stringify(health, null, 2)
        result.success = health.success
        break
      }

      case 'user_stats': {
        const stats = await getUserStats()
        result.result = JSON.stringify(stats, null, 2)
        result.success = stats.success
        break
      }

      case 'lookup_user': {
        const { search, tier } = action.params as { search?: string; tier?: string }
        const users = await queryUsers({ search, tier, limit: 10 })
        result.result = JSON.stringify(users, null, 2)
        result.success = users.success
        break
      }

      case 'build_stats': {
        const bStats = await getBuildStats()
        result.result = JSON.stringify(bStats, null, 2)
        result.success = bStats.success !== false
        break
      }

      case 'check_page': {
        // Hit a page and check status + basic info (no Playwright needed)
        const { url: checkUrl } = action.params as { url: string }
        if (!checkUrl) { result.result = 'Missing url'; result.success = false; break }
        const fullUrl = checkUrl.startsWith('http') ? checkUrl : `https://forjegames.com${checkUrl}`
        try {
          const start = Date.now()
          const res = await fetch(fullUrl, {
            signal: AbortSignal.timeout(15000),
            headers: { 'User-Agent': 'ELI-Agent/4.0' },
          })
          const latency = Date.now() - start
          const body = await res.text()
          const titleMatch = body.match(/<title>(.*?)<\/title>/i)
          const hasError = body.includes('Error') || body.includes('Something went wrong')
          const contentLength = body.length

          result.result = [
            `URL: ${fullUrl}`,
            `Status: ${res.status}`,
            `Latency: ${latency}ms`,
            `Title: ${titleMatch?.[1] || '(none)'}`,
            `Size: ${(contentLength / 1024).toFixed(1)}KB`,
            `Has errors: ${hasError}`,
            hasError ? `Error text found in page body` : 'Page looks clean',
          ].join('\n')
          result.success = res.ok
        } catch (err) {
          result.result = `Failed to reach ${fullUrl}: ${(err as Error).message}`
          result.success = false
        }
        break
      }

      case 'trigger_audit': {
        // Trigger the autonomous audit script if running locally
        try {
          const output = execSync(
            'npx tsx scripts/eli-autonomous.ts --api-only 2>&1',
            { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 60000, maxBuffer: 50000 }
          )
          result.result = output.trim().slice(-2000)
          result.success = true
        } catch (err) {
          result.result = `Audit script failed: ${((err as { stderr?: string }).stderr || '').slice(0, 500)}`
          result.success = false
        }
        break
      }

      // ── Discord Live ───────────────────────────────────────────────────
      case 'discord_read': {
        const { channel: readCh, limit: readLimit } = action.params as { channel: string; limit?: number }
        const channelId = CHANNEL_MAP[readCh] || readCh
        if (!channelId) { result.result = 'Unknown channel'; result.success = false; break }
        const msgs = await getRecentDiscordMessages(channelId, readLimit || 10)
        if (msgs.success) {
          result.result = msgs.messages
            .filter((m: Record<string, unknown>) => !m.isBot)
            .map((m: Record<string, unknown>) => `[${(m.timestamp as string)?.slice(0, 16)}] ${m.author}: ${m.content}`)
            .join('\n') || 'No messages'
        } else {
          result.result = msgs.error || 'Failed to read Discord'
        }
        result.success = msgs.success
        break
      }

      case 'discord_server_info': {
        const info = await getDiscordServerInfo()
        result.result = JSON.stringify(info, null, 2)
        result.success = info.success
        break
      }

      case 'discord_reply': {
        const { channel: replyCh, messageId, content: replyContent } = action.params as {
          channel: string; messageId: string; content: string
        }
        const replyChId = CHANNEL_MAP[replyCh] || replyCh
        if (!replyChId || !messageId || !replyContent) {
          result.result = 'Need channel, messageId, and content'
          result.success = false
          break
        }
        const reply = await postDiscordReply(replyChId, messageId, replyContent)
        result.result = reply.success ? 'Replied in Discord' : (reply.error || 'Failed')
        result.success = reply.success
        break
      }

      default:
        result.result = `Unknown action: ${action.type}`
        result.success = false
    }
  } catch (err) {
    result.result = `Action failed: ${err instanceof Error ? err.message : String(err)}`
    result.success = false
  }

  return result
}
