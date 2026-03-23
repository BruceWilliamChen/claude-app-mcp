# Filter Design MCP App

An MCP app that lets users design digital filters inside a chat interface.
MATLAB runs remotely, computes filter data, and the UI renders interactive Plotly plots client-side.

## Architecture

- **Server**: Python FastMCP (`server_py/mcp_server.py`)
- **MATLAB**: `matlab.engine` for Python — runs remotely
- **HTTPS**: ngrok tunnel at `matlab-mcp-app.ngrok.app` (use `--host-header=localhost:8000`)
- **UI**: React + Vite, bundled to single HTML via `vite-plugin-singlefile`
- **Plots**: Plotly.js rendered client-side from numeric data
- **REST fallback**: `/api/design` endpoint for when MCP `callServerTool` fails
- **Client config**: Just a URL — `https://matlab-mcp-app.ngrok.app/mcp`

## MCP Tools (4 total)

| Tool | Called by | Purpose |
|------|-----------|---------|
| `configure_filter` | AI | Opens UI with pre-filled params, has `meta.ui.resourceUri` |
| `get_filter_settings` | AI | Returns available types, parameter ranges, MATLAB status |
| `set_filter_settings` | AI | Updates params — "change order to 8", "use Chebyshev" |
| `run_filter_design` | UI (Run button) | Executes MATLAB, returns freq response data |

## UI Modes

- **Inline**: Filter type buttons (Lowpass/Highpass/Bandpass/Bandstop) → click expands to fullscreen
- **Fullscreen**: MATLAB-style left panel (FILTERS, PARAMETERS, FILTER INFO) + tabbed Plotly plots

## Running

```bash
# Build UI
cd ui && npm install && npm run build

# Start server (needs MATLAB installed)
pip install -r server_py/requirements.txt
python server_py/mcp_server.py --http

# HTTPS tunnel
ngrok http --url=matlab-mcp-app.ngrok.app 8000 --host-header=localhost:8000
```

## Known Gotchas

- **Claude web client**: Intermittent session bugs (March 2026). See `docs/notes/web-client-bugs-2026-03.md`
- **`callServerTool` hangs**: UI skips it and uses REST fallback (`/api/design`)
- **ngrok `--host-header`**: Required — without it, Starlette rejects the Host header (421)
- **Plotly CDN**: Loaded via `<script>` tag in `index.html`, not bundled (keeps build size ~594KB)
- **MATLAB startup**: Takes ~60s — server logs "MATLAB ready" when done

## Project Documentation

All docs in `docs/`. See `docs/README.md` for full index.

| Folder | Purpose | When to Read |
|--------|---------|-------------|
| `docs/plan/` | Implementation plans, checklists | Before starting work |
| `docs/knowledge/` | Reference patterns, API contracts | When implementing |
| `docs/notes/` | Gotchas, investigation findings | When stuck |
| `docs/tickets/` | Task tracking (what/why/how) | To find work items |

## Key References

- Filter design API contract: `docs/knowledge/filter-design-api.md`
- MCP server patterns: `docs/knowledge/mcp-server-patterns.md`
- Web client bugs: `docs/notes/web-client-bugs-2026-03.md`
- Original filter design app: `D:\projects\matlab-mcp-app`
- MCP app reference (doudou): `D:\projects\mcp-app-doudou-ref`
