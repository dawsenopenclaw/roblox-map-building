/**
 * GET /api/studio/install
 *
 * Serves a visual HTML guide for installing the ForjeGames Roblox Studio plugin.
 * - Shows step-by-step instructions with OS-specific commands
 * - "Download Plugin" button fetches the .rbxm file
 * - Polls /api/studio/status client-side and shows "Connected!" when the plugin connects
 * - ?userId=<id>  — pre-generates a 6-char connection code and displays it prominently
 *
 * Also accepts ?download=rbxm to directly serve the .rbxm file.
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function buildHtml(sessionId: string | null, connectionCode: string | null = null): string {
  const sessionParam = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Install ForjeGames Plugin — Roblox Studio</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #0a0a0a;
      color: #e0e0e0;
      font-family: Inter, system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 24px 64px;
    }

    .logo {
      color: #D4AF37;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }

    .subtitle {
      color: #666;
      font-size: 14px;
      margin-bottom: 48px;
    }

    /* Connection status banner */
    #status-banner {
      display: none;
      width: 100%;
      max-width: 560px;
      background: #0d2b1e;
      border: 1px solid #10b981;
      border-radius: 12px;
      padding: 20px 24px;
      text-align: center;
      margin-bottom: 32px;
      animation: fadeIn 0.4s ease;
    }

    #status-banner.visible { display: block; }

    .banner-check {
      font-size: 40px;
      margin-bottom: 8px;
    }

    .banner-title {
      color: #10b981;
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .banner-sub {
      color: #6ee7b7;
      font-size: 13px;
    }

    /* Steps card */
    .card {
      width: 100%;
      max-width: 560px;
      background: #111;
      border: 1px solid #222;
      border-radius: 16px;
      overflow: hidden;
    }

    .card-header {
      padding: 24px 28px 20px;
      border-bottom: 1px solid #1a1a1a;
    }

    .card-title {
      font-size: 18px;
      font-weight: 700;
      color: #fff;
    }

    .card-desc {
      font-size: 13px;
      color: #666;
      margin-top: 4px;
    }

    .steps {
      padding: 0 28px;
    }

    .step {
      display: flex;
      gap: 20px;
      padding: 24px 0;
      border-bottom: 1px solid #191919;
    }

    .step:last-child { border-bottom: none; }

    .step-number {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      background: #D4AF37;
      color: #000;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      margin-top: 2px;
    }

    .step-number.done {
      background: #10b981;
      color: #fff;
    }

    .step-content { flex: 1; }

    .step-title {
      font-size: 15px;
      font-weight: 600;
      color: #e5e5e5;
      margin-bottom: 6px;
    }

    .step-desc {
      font-size: 13px;
      color: #777;
      line-height: 1.6;
      margin-bottom: 14px;
    }

    /* Download button */
    .btn-download {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #D4AF37;
      color: #000;
      font-weight: 700;
      font-size: 14px;
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      text-decoration: none;
      transition: opacity 0.15s;
    }

    .btn-download:hover { opacity: 0.88; }

    /* OS tabs */
    .os-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .os-tab {
      background: none;
      border: 1px solid #2a2a2a;
      border-radius: 6px;
      color: #888;
      font-size: 12px;
      font-family: inherit;
      padding: 6px 14px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .os-tab.active {
      border-color: #D4AF37;
      color: #D4AF37;
      background: rgba(212,175,55,0.06);
    }

    /* Code block */
    .code-block {
      background: #0a0a0a;
      border: 1px solid #222;
      border-radius: 8px;
      padding: 14px 16px;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 12px;
      color: #D4AF37;
      line-height: 1.7;
      user-select: all;
      cursor: text;
    }

    .code-note {
      font-size: 11px;
      color: #555;
      margin-top: 8px;
      font-style: italic;
    }

    /* OS-specific content visibility */
    .win-content, .mac-content { display: none; }
    .win-content.active, .mac-content.active { display: block; }

    /* Polling indicator */
    .polling-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #555;
      margin-top: 16px;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background: #D4AF37;
      border-radius: 50%;
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.7); }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* Skip link */
    .skip-row {
      text-align: center;
      margin-top: 24px;
    }

    .skip-link {
      color: #444;
      font-size: 13px;
      text-decoration: none;
    }

    .skip-link:hover { color: #888; }
  </style>
</head>
<body>
  <div class="logo">ForjeGames</div>
  <p class="subtitle">Roblox Studio Plugin Setup</p>

  <!-- Connected banner (shown when plugin polls in) -->
  <div id="status-banner">
    <div class="banner-check">✓</div>
    <div class="banner-title">Connected!</div>
    <div class="banner-sub" id="banner-place">Plugin connected to Roblox Studio. You can close this page.</div>
  </div>

  <div class="card">
    <div class="card-header">
      <div class="card-title">Install the ForjeGames Plugin</div>
      <div class="card-desc">3 steps — takes about 2 minutes</div>
    </div>

    <div class="steps">

      <!-- Step 1: Download -->
      <div class="step">
        <div class="step-number" id="step1-num">1</div>
        <div class="step-content">
          <div class="step-title">Download the plugin file</div>
          <div class="step-desc">
            Download the <code style="color:#D4AF37;font-size:12px">ForjeGames.rbxmx</code> plugin file to your computer.
          </div>
          <a href="/api/studio/plugin" download="ForjeGames.rbxmx" class="btn-download">
            ↓ Download ForjeGames.rbxmx
          </a>
        </div>
      </div>

      <!-- Step 2: Place the file -->
      <div class="step">
        <div class="step-number" id="step2-num">2</div>
        <div class="step-content">
          <div class="step-title">Place the file in your Plugins folder</div>
          <div class="step-desc">
            Move the downloaded file to the Roblox Plugins folder for your OS, then <strong style="color:#e5e5e5">fully close and reopen Roblox Studio</strong>.
          </div>

          <div class="os-tabs">
            <button class="os-tab active" onclick="setOs('win')">Windows</button>
            <button class="os-tab" onclick="setOs('mac')">Mac</button>
          </div>

          <div class="win-content active">
            <div class="code-block">%LOCALAPPDATA%\\Roblox\\Plugins\\ForjeGames.rbxmx</div>
            <div class="code-note">Tip: paste this path into File Explorer's address bar to open the folder directly.</div>
          </div>

          <div class="mac-content">
            <div class="code-block">~/Library/Application Support/Roblox/Plugins/ForjeGames.rbxmx</div>
            <div class="code-note">Tip: In Finder press ⌘ + Shift + G and paste the path to jump there.</div>
          </div>
        </div>
      </div>

      <!-- Step 3: Connect -->
      <div class="step" style="border-bottom:none">
        <div class="step-number" id="step3-num">3</div>
        <div class="step-content">
          <div class="step-title">Connect from Roblox Studio</div>
          <div class="step-desc">
            In Roblox Studio, click the <strong style="color:#D4AF37">ForjeGames</strong> button in the toolbar.
            Enter the 6-character code shown on this page (go to
            <a href="/connect" style="color:#D4AF37;text-decoration:none">/connect</a> or Settings → Studio).
          </div>

          ${connectionCode ? `
          <div style="margin:16px 0;background:#0f0f0f;border:2px solid rgba(212,175,55,0.35);border-radius:14px;padding:20px 24px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#D4AF37;">Your connection code</p>
            <p style="margin:0 0 6px;font-family:'JetBrains Mono','Courier New',monospace;font-size:42px;font-weight:700;letter-spacing:0.3em;color:#fff;">${connectionCode}</p>
            <p style="margin:0;font-size:12px;color:#555;">Enter this in Roblox Studio → ForjeGames plugin</p>
          </div>
          ` : ''}

          <div class="polling-indicator" id="poll-indicator">
            <div class="pulse-dot"></div>
            <span>Waiting for plugin connection…</span>
          </div>
        </div>
      </div>

    </div>
  </div>

  <div class="skip-row">
    <a href="/editor" class="skip-link">Already connected? Go to the editor →</a>
  </div>

  <script>
    // OS tab switcher
    function setOs(os) {
      document.querySelectorAll('.os-tab').forEach(function(t) { t.classList.remove('active'); });
      document.querySelectorAll('.win-content, .mac-content').forEach(function(el) { el.classList.remove('active'); });
      if (os === 'win') {
        document.querySelector('.win-content').classList.add('active');
        document.querySelectorAll('.os-tab')[0].classList.add('active');
      } else {
        document.querySelector('.mac-content').classList.add('active');
        document.querySelectorAll('.os-tab')[1].classList.add('active');
      }
    }

    // Auto-detect OS
    if (navigator.platform && navigator.platform.toLowerCase().includes('mac')) {
      setOs('mac');
    }

    // Poll for plugin connection
    var sessionId = ${sessionId ? `"${sessionId}"` : 'null'};
    var pollUrl   = sessionId
      ? "/api/studio/status?sessionId=" + encodeURIComponent(sessionId)
      : "/api/studio/status";

    var connected = false;
    var pollTimer = null;

    function poll() {
      if (connected) return;
      fetch(pollUrl)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.connected) {
            connected = true;
            clearInterval(pollTimer);
            var banner = document.getElementById('status-banner');
            banner.classList.add('visible');
            document.getElementById('poll-indicator').style.display = 'none';
            if (data.placeName) {
              document.getElementById('banner-place').textContent =
                'Connected to "' + data.placeName + '". You can close this page.';
            }
            // Mark all steps done
            ['step1-num','step2-num','step3-num'].forEach(function(id) {
              var el = document.getElementById(id);
              el.textContent = '✓';
              el.classList.add('done');
            });
          }
        })
        .catch(function() { /* silently ignore network errors */ });
    }

    pollTimer = setInterval(poll, 2000);
    poll(); // immediate first check
  </script>
</body>
</html>`
}

/**
 * Generates a deterministic but hard-to-guess 6-char alphanumeric code for a
 * given userId. The code rotates every 10 minutes using a time bucket so it
 * stays valid long enough for the user to act, but expires automatically.
 *
 * Format: ABC123 (uppercase alpha + digits, no ambiguous chars like 0/O/1/I)
 */
function generateConnectionCode(userId: string): string {
  const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  // 10-minute bucket — code is valid for up to 10 min
  const bucket = Math.floor(Date.now() / (10 * 60 * 1000))
  const secret = process.env.CODE_HMAC_SECRET ?? 'forjegames-install-code-secret'
  const hash = crypto
    .createHmac('sha256', secret)
    .update(`${userId}:${bucket}`)
    .digest()

  let code = ''
  for (let i = 0; i < 6; i++) {
    code += CHARSET[hash[i]! % CHARSET.length]
  }
  return code
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const sessionId = searchParams.get('sessionId')
  const userId    = searchParams.get('userId')

  // JSON response for the /install page client (userId-only requests)
  const acceptHeader = req.headers.get('accept') ?? ''
  const wantsJson = acceptHeader.includes('application/json') || acceptHeader.includes('*/*')

  if (userId && wantsJson && !acceptHeader.includes('text/html')) {
    const code = generateConnectionCode(userId)
    return NextResponse.json({ code }, {
      status: 200,
      headers: { ...CORS, 'Cache-Control': 'no-store' },
    })
  }

  // HTML guide — embed code prominently if userId provided
  const code = userId ? generateConnectionCode(userId) : null
  const html = buildHtml(sessionId, code)

  return new NextResponse(html, {
    status: 200,
    headers: {
      ...CORS,
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
