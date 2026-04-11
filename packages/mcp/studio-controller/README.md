# Studio Controller MCP Server

A specialized MCP tool surface for Roblox Studio control, alongside `studio-bridge`. It communicates with the ForjeGames Studio plugin via the **same cloud relay pattern** that `studio-bridge` uses: commands are queued through `/api/studio/execute` and the plugin polls for them; responses are returned through `/api/studio/bridge-result`.

> **Why not talk to the plugin directly?**
> Roblox Studio plugins cannot open inbound HTTP sockets. There is no way for an external process to connect straight to a running plugin. Every Studio-side tool the AI can invoke must go through the ForjeGames cloud relay.

## Port

`3006` (override with `STUDIO_CONTROLLER_PORT` env var)

## Tools

| Tool | Description |
|------|-------------|
| `read_scene` | Get the full scene hierarchy (services, instances, class names) |
| `read_script` | Read a Luau script's source code by instance path |
| `write_script` | Write Luau code to a script (creates if missing) |
| `start_playtest` | **Limited** -- see note below |
| `stop_playtest` | **Limited** -- see note below |
| `capture_screenshot` | **Limited** -- see note below |
| `get_output_log` | Get Output/console log entries (prints, warns, errors) |
| `simulate_input` | Simulate keyboard/mouse input during an active playtest |
| `navigate_character` | Move the player character to a world position |
| `get_instance_properties` | Get properties of a specific instance by path |

### Limitations (honest list)

Several tools exist for API symmetry with the long-term roadmap but currently return a `user_action_required` status because Roblox does not expose the required APIs to plugins:

- **`start_playtest` / `stop_playtest`** — Roblox plugins cannot start or stop a Play / Run session programmatically. The plugin will display a Studio notification telling the user to press **F5** (or **Shift+F5** to stop) and the tool response will indicate `user_action_required`.
- **`capture_screenshot`** — The `ScreenshotHud` API is not a functional capture surface from plugin edit context, and `CaptureService` is not plugin-accessible. The tool returns `user_action_required`; use Roblox's built-in screenshot shortcut (`PrtScn` in Studio) or the session screenshot uploader on the ForjeGames web app instead.

If and when Roblox exposes real APIs for these, these handlers will be upgraded. Until then, the MCP layer will not pretend they worked.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `STUDIO_CONTROLLER_PORT` | `3006` | Port this MCP server listens on |
| `FORJE_API_BASE` | `https://forjegames.com` | ForjeGames API base URL |
| `FORJE_API_TOKEN` | *(required)* | Session token used by the Studio plugin |
| `FORJE_SESSION_ID` | *(required)* | Target Studio session id |
| `STUDIO_CONTROLLER_ALLOWED_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000,https://forjegames.com,https://www.forjegames.com` | Comma-separated CORS allow-list |

`FORJE_SESSION_TOKEN` is accepted as a fallback for `FORJE_API_TOKEN`.

## Usage

```bash
# Development (hot reload)
npm run dev

# Production
npm run build
npm start
```

## Architecture

```
  AI client (Claude / Cursor / etc.)
              |
              v
  studio-controller MCP server  (this package, port 3006)
              |
              |  HTTP POST /api/studio/execute   (command)
              |  HTTP GET  /api/studio/bridge-result?requestId=...
              v
  ForjeGames API   (cloud relay -- same queue studio-bridge uses)
              ^
              |  long-poll / push
              |
  Roblox Studio Plugin  (packages/studio-plugin)
```

`studio-controller` provides a **different tool surface** than `studio-bridge` (focused on read/write + playtest control primitives); both servers ultimately share the same cloud relay and plugin. There is no direct-localhost mode, and adding one is not possible on current Roblox Studio.
