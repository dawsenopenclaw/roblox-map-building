/**
 * GET /api/studio/install-redirect
 *
 * Attempts to open the `forjegames://install-plugin` URI scheme handled by the
 * ForjeGames Electron desktop app. If the app is installed it takes over and
 * does a zero-friction one-click install. If not, we redirect to /install so
 * the user gets the web-based install flow.
 *
 * Query params forwarded to both destinations:
 *   ?userId=<clerk-user-id>   — pre-fills the connection code on success
 *   ?redirect=<url>           — where to send the user after install
 */

import { NextRequest, NextResponse } from 'next/server'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://forjegames.com').trim().replace(/\/$/, '')

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

/**
 * Returns an HTML page that:
 * 1. Immediately tries `forjegames://install-plugin` (Electron URI handler).
 * 2. After 1.5 s without a response, redirects to the web /install page.
 *    The redirect carries userId so the install page can pre-generate a code.
 */
function buildRedirectHtml(userId: string | null, fallbackUrl: string): string {
  const uriParams = userId ? `?userId=${encodeURIComponent(userId)}` : ''
  const deepLink = `forjegames://install-plugin${uriParams}`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Installing ForjeGames Plugin…</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0a0a0a;
      color: #f0f0f0;
      font-family: Inter, system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 24px;
      padding: 24px;
      text-align: center;
    }
    .logo { color: #c9a227; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
    .title { font-size: 20px; font-weight: 700; color: #fff; }
    .sub { font-size: 14px; color: #888; max-width: 420px; line-height: 1.6; }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid #1a1a1a;
      border-top-color: #c9a227;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .fallback-link {
      color: #c9a227;
      font-size: 13px;
      text-decoration: underline;
      cursor: pointer;
      background: none;
      border: none;
      font-family: inherit;
    }
    .fallback-link:hover { opacity: 0.8; }
    .status { font-size: 13px; color: #555; }
  </style>
</head>
<body>
  <div class="logo">ForjeGames</div>
  <div class="spinner" id="spinner"></div>
  <div class="title" id="title">Opening ForjeGames app…</div>
  <p class="sub" id="sub">
    If you have the ForjeGames desktop app installed, it will open automatically and install the plugin for you.
  </p>
  <p class="status" id="status">Trying deep link…</p>
  <button class="fallback-link" id="manual-btn" style="display:none" onclick="goManual()">
    Install manually instead →
  </button>

  <script>
    var fallbackUrl = ${JSON.stringify(fallbackUrl)};
    var deepLink    = ${JSON.stringify(deepLink)};
    var gone        = false;

    function goManual() {
      gone = true;
      window.location.href = fallbackUrl;
    }

    // Attempt the URI scheme
    window.location.href = deepLink;

    // Give the OS 1.5 s to hand off to the Electron app.
    // If the tab is still alive after that, the app isn't installed.
    setTimeout(function () {
      if (gone) return;
      document.getElementById('spinner').style.display = 'none';
      document.getElementById('title').textContent = 'Desktop app not detected';
      document.getElementById('sub').textContent =
        "No problem — use the web installer below. It takes less than a minute.";
      document.getElementById('status').style.display = 'none';
      document.getElementById('manual-btn').style.display = 'inline';
    }, 1500);

    // If the user returns to the tab (e.g. app opened and they came back) hide the loader
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible' && !gone) {
        document.getElementById('status').textContent = 'Returned from app — checking install…';
      }
    });
  </script>
</body>
</html>`
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const userId = searchParams.get('userId')
  const customRedirect = searchParams.get('redirect')

  // Build the web fallback URL — carry userId for code pre-generation
  const fallbackParams = new URLSearchParams()
  if (userId) fallbackParams.set('userId', userId)
  const fallbackPath = `/install${fallbackParams.size > 0 ? `?${fallbackParams.toString()}` : ''}`
  const fallbackUrl = customRedirect ?? `${APP_URL}${fallbackPath}`

  const html = buildRedirectHtml(userId, fallbackUrl)

  return new NextResponse(html, {
    status: 200,
    headers: {
      ...CORS,
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
