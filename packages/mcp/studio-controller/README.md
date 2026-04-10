# Studio Controller MCP Server

MCP server for direct read/write control of Roblox Studio state. Communicates with the Studio plugin's local HTTP endpoint on `localhost:33796` for real-time interaction with no cloud relay delay.

## Port

`3006` (override with `STUDIO_CONTROLLER_PORT` env var)

## Tools

| Tool | Description |
|------|-------------|
| `read_scene` | Get the full scene hierarchy (services, instances, class names) |
| `read_script` | Read a Luau script's source code by instance path |
| `write_script` | Write Luau code to a script (creates if missing) |
| `start_playtest` | Start a playtest session (play, play_here, run) |
| `stop_playtest` | Stop the current playtest and return to Edit mode |
| `capture_screenshot` | Capture the Studio viewport as PNG/JPEG |
| `get_output_log` | Get Output/console log entries (prints, warns, errors) |
| `simulate_input` | Simulate keyboard/mouse input during playtest |
| `navigate_character` | Move the player character to a world position |
| `get_instance_properties` | Get properties of a specific instance by path |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `STUDIO_CONTROLLER_PORT` | `3006` | Port for this MCP server |
| `STUDIO_PLUGIN_PORT` | `33796` | Port of the Studio plugin HTTP server |
| `STUDIO_PLUGIN_HOST` | `localhost` | Host of the Studio plugin HTTP server |

## Usage

```bash
# Development (hot reload)
npm run dev

# Production
npm run build
npm start
```

## Architecture

Unlike `studio-bridge` (which relays commands through the ForjeGames cloud API and relies on plugin polling), `studio-controller` talks directly to the Studio plugin over localhost HTTP. This provides:

- Real-time response (no 2-5s polling delay)
- No authentication/session tokens required
- Works offline (no internet needed)
- Lower latency for rapid iteration workflows
