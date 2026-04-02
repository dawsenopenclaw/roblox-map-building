/**
 * GET /api/studio/install
 *
 * Returns a one-click installer script (.bat for Windows, .sh for Mac).
 * User downloads and double-clicks it — plugin auto-installs to the right folder.
 */

import { NextRequest, NextResponse } from 'next/server'

const WINDOWS_INSTALLER = `@echo off
title ForjeGames Plugin Installer
echo.
echo  ================================
echo   ForjeGames Plugin Installer
echo  ================================
echo.

set "PLUGIN_DIR=%LOCALAPPDATA%\\Roblox\\Plugins"

if not exist "%PLUGIN_DIR%" (
    echo Creating Plugins folder...
    mkdir "%PLUGIN_DIR%"
)

echo Downloading ForjeGames plugin...
powershell -Command "Invoke-WebRequest -Uri 'https://forjegames.com/api/studio/plugin' -OutFile '%PLUGIN_DIR%\\ForjeGames.lua'"

if exist "%PLUGIN_DIR%\\ForjeGames.lua" (
    echo.
    echo  SUCCESS! Plugin installed.
    echo.
    echo  Location: %PLUGIN_DIR%\\ForjeGames.lua
    echo.
    echo  Next steps:
    echo  1. Close Roblox Studio if it's open
    echo  2. Reopen Studio
    echo  3. Click "ForjeGames" in the toolbar
    echo  4. Enter the code from forjegames.com/editor
    echo.
) else (
    echo.
    echo  ERROR: Download failed. Check your internet connection.
    echo.
)

pause
`

const MAC_INSTALLER = `#!/bin/bash
echo ""
echo "================================"
echo " ForjeGames Plugin Installer"
echo "================================"
echo ""

PLUGIN_DIR="$HOME/Documents/Roblox/Plugins"

mkdir -p "$PLUGIN_DIR"

echo "Downloading ForjeGames plugin..."
curl -sL "https://forjegames.com/api/studio/plugin" -o "$PLUGIN_DIR/ForjeGames.lua"

if [ -f "$PLUGIN_DIR/ForjeGames.lua" ]; then
    echo ""
    echo "SUCCESS! Plugin installed."
    echo ""
    echo "Location: $PLUGIN_DIR/ForjeGames.lua"
    echo ""
    echo "Next steps:"
    echo "1. Close Roblox Studio if it's open"
    echo "2. Reopen Studio"
    echo "3. Click 'ForjeGames' in the toolbar"
    echo "4. Enter the code from forjegames.com/editor"
    echo ""
else
    echo ""
    echo "ERROR: Download failed. Check your internet connection."
    echo ""
fi
`

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function GET(req: NextRequest) {
  const ua = req.headers.get('user-agent') || ''
  const isMac = ua.includes('Mac')

  if (isMac) {
    return new NextResponse(MAC_INSTALLER, {
      status: 200,
      headers: {
        ...CORS,
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="Install-ForjeGames.sh"',
        'Cache-Control': 'no-store',
      },
    })
  }

  return new NextResponse(WINDOWS_INSTALLER, {
    status: 200,
    headers: {
      ...CORS,
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment; filename="Install-ForjeGames.bat"',
      'Cache-Control': 'no-store',
    },
  })
}
