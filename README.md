# Filter Design — MCP App

Design digital filters (Butterworth, Chebyshev I/II, Elliptic, FIR) inside a chat interface.
MATLAB runs remotely, computes filter data, and the UI renders interactive Plotly plots client-side.

## How It Works

```
User (chat) ←→ Host (ChatGPT, Claude, etc.) ←→ MCP Server (Python, HTTPS) ←→ MATLAB Engine
                                                        ↕
                                                   UI (React iframe)
                                                        ↕
                                                   Plotly.js (interactive plots)
```

1. User: "Design a lowpass filter" → inline view shows filter type buttons
2. User clicks Lowpass → fullscreen UI opens with MATLAB-style parameter panel
3. User adjusts parameters (order, frequency, method) → UI updates live
4. User clicks Run → MATLAB computes → Plotly renders interactive plots
5. User: "Try a Chebyshev instead" → AI calls `set_filter_settings`, UI updates

## MCP Tools

| Tool | Purpose |
|------|---------|
| `configure_filter` | Opens the filter design UI with pre-filled parameters |
| `get_filter_settings` | Returns available filter types, parameter ranges, MATLAB status |
| `set_filter_settings` | Updates specific parameters (e.g. "change order to 8") |
| `run_filter_design` | Executes MATLAB filter design, returns numeric data for plots |

## Project Structure

```
├── server_py/                 # Python MCP server
│   ├── mcp_server.py          # FastMCP server (4 tools + resource + HTTPS)
│   ├── matlab_bridge.py       # MATLAB engine wrapper (init, execute, status)
│   ├── codegen.py             # MATLAB code generation from filter params
│   └── requirements.txt       # Python: mcp, uvicorn, matlabengine
├── ui/                        # React frontend
│   ├── index.html             # Vite entry point
│   ├── mcp-app.tsx            # React root (preview/production mode)
│   ├── types.ts               # FilterConfig, FilterResult types
│   ├── global.css             # Styles
│   ├── hooks/                 # React hooks
│   │   ├── useFilterDesign.ts # Param state + results
│   │   ├── useMcpToolResult.ts# Production: MCP connection
│   │   └── useMockData.ts     # Data fetching (preview + REST fallback)
│   └── components/            # React components
│       ├── Header.tsx         # Title, Run, Autorun, Show Code
│       ├── ParamPanel.tsx     # FILTERS / PARAMETERS / FILTER INFO panels
│       ├── PlotArea.tsx       # Tabbed Plotly charts (magnitude, phase, etc.)
│       ├── CoeffDisplay.tsx   # Code dialog with Copy button
│       ├── StatusBar.tsx      # Connection status + timing
│       └── InlineView.tsx     # Filter type selector (inline mode)
├── scripts/                   # Startup scripts
│   ├── start.sh               # Start server (HTTP mode)
│   └── start-ngrok.sh         # Start server + ngrok HTTPS tunnel
├── docs/                      # Project documentation
├── CLAUDE.md                  # Project instructions
├── package.json               # UI dependencies
├── vite.config.ts             # Vite build config
└── tsconfig.json              # TypeScript config (UI)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Server | Python + FastMCP + Starlette + uvicorn |
| MATLAB | `matlab.engine` for Python |
| HTTPS | ngrok tunnel (`.ngrok.app` domain) |
| UI | React 19 + TypeScript + Vite |
| Plots | Plotly.js (client-side, interactive) |
| Build | `vite-plugin-singlefile` (bundles UI into single HTML) |

## Quick Start

### Development (UI only, preview mode)

```bash
cd ui && npm install && npm run dev
# → http://localhost:5174?preview=true
# Needs Flask server on :3000 for MATLAB data (see matlab-mcp-app)
```

### Full stack (with MATLAB)

```bash
# 1. Install Python deps
pip install -r server_py/requirements.txt

# 2. Build UI
cd ui && npm install && npm run build

# 3. Start server
python server_py/mcp_server.py --http
# → MCP at http://localhost:8000/mcp
# → REST at http://localhost:8000/api/design

# 4. HTTPS via ngrok
ngrok http --url=matlab-mcp-app.ngrok.app 8000 --host-header=localhost:8000
# → https://matlab-mcp-app.ngrok.app/mcp
```

### Client Configuration

Add as a custom MCP connector:

```
https://matlab-mcp-app.ngrok.app/mcp
```

Works with ChatGPT, Claude (intermittent due to web client bugs), and any MCP-compatible host.

## UI Views

### Inline View
Shows 4 filter type buttons (Lowpass, Highpass, Bandpass, Bandstop).
Clicking a button expands to fullscreen with that filter selected.

### Fullscreen View
MATLAB Filter Designer-style interface:
- **Left panel**: FILTERS table, PARAMETERS (expandable sub-sections), FILTER INFORMATION
- **Right panel**: Tabbed Plotly plots (add/remove tabs, one plot at a time)
- **Header**: Run button, Autorun toggle, Show Code (`</>`) dialog
- **Status bar**: MATLAB connection status + execution timing

## Filter Types

| Type | MATLAB Function | Extra Params |
|------|----------------|-------------|
| Butterworth | `butter()` | — |
| Chebyshev I | `cheby1()` | Passband ripple (dB) |
| Chebyshev II | `cheby2()` | Stopband attenuation (dB) |
| Elliptic | `ellip()` | Ripple + attenuation |
| FIR (Window) | `fir1()` | — |

**Response types:** Lowpass, Highpass, Bandpass, Bandstop

**Plots:** Magnitude response, Phase response, Group delay, Pole-zero

## REST Fallback

The server exposes REST endpoints alongside MCP for when `callServerTool` fails
(known web client session bugs):

- `POST /api/design` — filter design (same as `run_filter_design` tool)
- `GET /api/status` — MATLAB connection status

The UI automatically falls back to REST when MCP tool calls fail.

## Known Issues

- **Claude web client** has intermittent session bugs (Issues #99, #83, #102) causing
  connection failures. The app renders when it connects but sessions are unstable.
  See `docs/notes/web-client-bugs-2026-03.md`.
- **ChatGPT** works more reliably for MCP connections.
- **`callServerTool`** hangs on some web clients — the UI skips it and uses REST fallback.

## Documentation

All project docs in `docs/`. See `docs/README.md` for the full index.

| Folder | Purpose |
|--------|---------|
| `docs/plan/` | Implementation plans with phased steps and checklists |
| `docs/knowledge/` | Reference patterns, API contracts, architecture |
| `docs/notes/` | Investigation findings, gotchas, decisions |
| `docs/tickets/` | Task tracking — what/why/how with acceptance criteria |

## Status

All 4 implementation tickets complete. App is functional end-to-end.

- TICKET-001: Python MCP server with HTTPS — Done
- TICKET-002: Port filter design UI to React — Done
- TICKET-003: MCP SDK integration — Done
- TICKET-004: End-to-end test and deploy — Done (tested on ChatGPT + Claude)
