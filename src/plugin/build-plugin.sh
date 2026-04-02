#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
#  ForjeGames Studio Plugin — Build Script
#  Converts ForjeGamesPlugin.lua into an installable Roblox .rbxm file.
#
#  OPTION A (Recommended — Rojo): automated .rbxm packaging
#  OPTION B (Manual):              copy-paste in Roblox Studio
#  OPTION C (Roblox Open Cloud):   publish plugin directly via API
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_LUA="$SCRIPT_DIR/ForjeGamesPlugin.lua"
OUT_DIR="$SCRIPT_DIR/dist"
PLUGIN_NAME="ForjeGamesPlugin"
PLUGIN_VER="4.0.0"

mkdir -p "$OUT_DIR"

echo "ForjeGames Plugin Build  v${PLUGIN_VER}"
echo "========================================="
echo ""

# ─── OPTION A: Rojo (https://rojo.space) ──────────────────────────────────────
# Rojo is the standard tool for building .rbxm files from .lua source.
# Install: cargo install rojo  OR  aftman install rojo-rbx/rojo
#
# If rojo is on PATH, build automatically.

if command -v rojo &>/dev/null; then
    echo "[Rojo] Found rojo at $(which rojo)"
    echo "[Rojo] Building $PLUGIN_NAME.rbxm ..."

    # Write a minimal default.project.json pointing at our plugin script
    cat > "$SCRIPT_DIR/default.project.json" <<ROJO_JSON
{
    "name": "${PLUGIN_NAME}",
    "tree": {
        "\$className": "Script",
        "\$path": "ForjeGamesPlugin.lua",
        "\$properties": {
            "RunContext": "Plugin"
        }
    }
}
ROJO_JSON

    rojo build "$SCRIPT_DIR/default.project.json" \
        --output "$OUT_DIR/${PLUGIN_NAME}-v${PLUGIN_VER}.rbxm"

    echo ""
    echo "[OK] Output: $OUT_DIR/${PLUGIN_NAME}-v${PLUGIN_VER}.rbxm"
    echo ""
    echo "Installation:"
    echo "  1. Open Roblox Studio"
    echo "  2. Plugins menu → Manage Plugins → Install from file"
    echo "  3. Select $OUT_DIR/${PLUGIN_NAME}-v${PLUGIN_VER}.rbxm"
    echo "  OR drag-drop the .rbxm into an open Studio window."
    echo ""
    exit 0
fi

# ─── OPTION B: Roblox Studio manual install ───────────────────────────────────
# No Rojo found — print manual steps.

echo "[Manual Install — No Rojo found]"
echo ""
echo "Step 1: Open Roblox Studio"
echo ""
echo "Step 2: In the Explorer panel, create a new Script inside ServerStorage"
echo "        (or anywhere — it's temporary):"
echo "          Insert Object → Script"
echo ""
echo "Step 3: Open the Script and paste the full contents of:"
echo "          $PLUGIN_LUA"
echo ""
echo "Step 4: Right-click the Script in Explorer → Save to File"
echo "        Save as: $OUT_DIR/${PLUGIN_NAME}-v${PLUGIN_VER}.rbxm"
echo ""
echo "Step 5: To install the plugin:"
echo "          Plugins → Manage Plugins → Install from file"
echo "          Select the .rbxm you just saved."
echo ""
echo "Step 6 (Development mode — faster iteration):"
echo "        Place the .lua file directly in your Studio plugins folder:"
echo ""

# Detect OS and print the correct plugins folder path
if [[ "$OSTYPE" == "msys"* ]] || [[ "$OSTYPE" == "win32"* ]] || [[ -n "${WINDIR:-}" ]]; then
    PLUGINS_DIR="%LOCALAPPDATA%\\Roblox\\Plugins"
    echo "          Windows: $PLUGINS_DIR"
    echo ""
    echo "        Copy command (PowerShell):"
    echo "          Copy-Item '$(cygpath -w "$PLUGIN_LUA")' -Destination \"$PLUGINS_DIR\\${PLUGIN_NAME}.lua\""
elif [[ "$OSTYPE" == "darwin"* ]]; then
    PLUGINS_DIR="$HOME/Documents/Roblox/Plugins"
    echo "          macOS: $PLUGINS_DIR"
    echo ""
    echo "        Copy command:"
    echo "          cp \"$PLUGIN_LUA\" \"$PLUGINS_DIR/${PLUGIN_NAME}.lua\""
else
    echo "          Linux: ~/.local/share/roblox/Plugins (Wine) or your Roblox install path"
fi

echo ""
echo "        After copying, restart Roblox Studio for the plugin to appear."
echo ""

# ─── OPTION C: Quick-copy to local Studio Plugins folder (Windows) ────────────
# Detect Windows and attempt direct file copy

if [[ -n "${LOCALAPPDATA:-}" ]]; then
    WIN_PLUGINS="$LOCALAPPDATA/Roblox/Plugins"
    if [[ -d "$WIN_PLUGINS" ]]; then
        echo "[Quick Install] Roblox Plugins folder found at:"
        echo "  $WIN_PLUGINS"
        echo ""
        read -rp "Copy plugin directly for development? [y/N] " confirm
        if [[ "$confirm" =~ ^[Yy]$ ]]; then
            cp "$PLUGIN_LUA" "$WIN_PLUGINS/${PLUGIN_NAME}.lua"
            echo "[OK] Copied to $WIN_PLUGINS/${PLUGIN_NAME}.lua"
            echo "     Restart Roblox Studio to load the plugin."
        else
            echo "Skipped."
        fi
    fi
fi

echo ""
echo "Done. See README or ForjeGames docs for plugin setup instructions."
