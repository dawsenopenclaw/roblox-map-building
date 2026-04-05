/**
 * GET /api/studio/installer
 *
 * Serves a platform-appropriate auto-installer script that downloads the
 * ForjeGames plugin and places it in the correct Roblox Plugins folder.
 *
 * ?os=win  → .bat file (Windows)
 * ?os=mac  → .sh file (Mac/Linux)
 *
 * Users run this once — it downloads ForjeGames.rbxmx into the Plugins folder
 * so Studio loads it automatically on next launch.
 */

import { NextRequest, NextResponse } from 'next/server'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://forjegames.com').trim().replace(/\/$/, '')

function windowsBat(): string {
  return `@echo off
setlocal
title ForjeGames Plugin Installer
echo.
echo  ======================================
echo   ForjeGames - Roblox Studio Plugin
echo  ======================================
echo.

set "PLUGINS=%LOCALAPPDATA%\\Roblox\\Plugins"

:: Create Plugins folder if it doesn't exist
if not exist "%PLUGINS%" (
    echo  Creating Plugins folder...
    mkdir "%PLUGINS%" 2>nul
    if errorlevel 1 (
        echo  ERROR: Could not create Plugins folder.
        echo  Please create it manually: %PLUGINS%
        pause
        exit /b 1
    )
)

echo  Downloading ForjeGames plugin...
echo.

:: Try PowerShell first (available on all modern Windows)
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '${APP_URL}/api/studio/plugin' -OutFile '%PLUGINS%\\ForjeGames.rbxmx' -UseBasicParsing; Write-Host '  Download complete!' } catch { Write-Host '  Download failed:' $_.Exception.Message; exit 1 }" 2>nul

if errorlevel 1 (
    :: Fallback to curl (available on Windows 10+)
    curl -sL -o "%PLUGINS%\\ForjeGames.rbxmx" "${APP_URL}/api/studio/plugin" 2>nul
    if errorlevel 1 (
        echo  ERROR: Download failed. Check your internet connection.
        pause
        exit /b 1
    )
    echo  Download complete!
)

echo.
echo  ========================================
echo   SUCCESS! Plugin installed.
echo  ========================================
echo.
echo   File: %PLUGINS%\\ForjeGames.rbxmx
echo.
echo   Next steps:
echo     1. Close Roblox Studio completely
echo     2. Reopen Roblox Studio
echo     3. Look for "ForjeGames" in the Plugins toolbar
echo     4. Click it and enter your connection code
echo        from ${APP_URL}/settings/studio
echo.
pause
`
}

function macSh(): string {
  return `#!/bin/bash
# ForjeGames - Roblox Studio Plugin Installer

echo ""
echo "  ======================================"
echo "   ForjeGames - Roblox Studio Plugin"
echo "  ======================================"
echo ""

PLUGINS="$HOME/Library/Application Support/Roblox/Plugins"

# Create Plugins folder if it doesn't exist
if [ ! -d "$PLUGINS" ]; then
    echo "  Creating Plugins folder..."
    mkdir -p "$PLUGINS" || {
        echo "  ERROR: Could not create Plugins folder."
        echo "  Please create it manually: $PLUGINS"
        exit 1
    }
fi

echo "  Downloading ForjeGames plugin..."
echo ""

curl -sL -o "$PLUGINS/ForjeGames.rbxmx" "${APP_URL}/api/studio/plugin" || {
    echo "  ERROR: Download failed. Check your internet connection."
    exit 1
}

echo "  Download complete!"
echo ""
echo "  ========================================"
echo "   SUCCESS! Plugin installed."
echo "  ========================================"
echo ""
echo "   File: $PLUGINS/ForjeGames.rbxmx"
echo "   (~/Library/Application Support/Roblox/Plugins/ForjeGames.rbxmx)"
echo ""
echo "   Next steps:"
echo "     1. Close Roblox Studio completely"
echo "     2. Reopen Roblox Studio"
echo "     3. Look for 'ForjeGames' in the Plugins toolbar"
echo "     4. Click it and enter your connection code"
echo "        from ${APP_URL}/settings/studio"
echo ""
`
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET(req: NextRequest) {
  const os = req.nextUrl.searchParams.get('os') ?? 'win'

  if (os === 'mac') {
    return new NextResponse(macSh(), {
      status: 200,
      headers: {
        ...CORS,
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="install-forjegames.sh"',
        'Cache-Control': 'no-store',
      },
    })
  }

  return new NextResponse(windowsBat(), {
    status: 200,
    headers: {
      ...CORS,
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="install-forjegames.bat"',
      'Cache-Control': 'no-store',
    },
  })
}
