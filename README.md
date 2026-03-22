# Filter Design — MCP App

Design digital filters (Butterworth, Chebyshev I/II, Elliptic, FIR) inside a chat interface.
MATLAB runs remotely, computes filter data, and the UI renders interactive Plotly plots client-side.

## How It Works

```
User (chat) ←→ Host ←→ MCP Server (Python, HTTPS) ←→ MATLAB Engine
                             ↕
                        UI (React iframe)
                             ↕
                        Plotly.js (interactive plots)
```

1. User: "Design a 4th-order Butterworth lowpass at 1kHz" → model calls `configure-filter`
2. UI opens in chat with form pre-filled → user adjusts parameters
3. User clicks Run → UI calls `run-filter-design` directly (no model round-trip)
4. MATLAB computes → numeric data returned → Plotly renders interactive plots
5. User: "Try a Chebyshev instead" → model reads context, suggests changes

## Project Structure

```
├── mcp_server.py              # Python FastMCP server (tools + resource + HTTPS)
├── matlab_bridge.py           # MATLAB engine wrapper (init, execute, status)
├── codegen.py                 # MATLAB code generation from filter params
├── requirements.txt           # Python: mcp, uvicorn, matlabengine
├── scripts/
│   ├── start.sh               # Start server (HTTP mode)
│   └── start-ngrok.sh         # Start server + ngrok HTTPS tunnel
├── ui/
│   ├── mcp-app.html           # Vite entry point
│   ├── mcp-app.tsx            # React root (preview/production mode)
│   ├── types.ts               # FilterConfig, FilterResult types
│   ├── global.css             # Styles
│   ├── codegen-preview.ts     # Client-side MATLAB code preview
│   ├── hooks/
│   │   ├── useFilterDesign.ts # Param state + results
│   │   ├── useMcpToolResult.ts# Production: MCP connection
│   │   └── useMockData.ts     # Preview: standalone dev mode
│   └── components/
│       ├── Header.tsx         # Title, Run, Autorun
│       ├── ParamPanel.tsx     # Filter params (left sidebar)
│       ├── PlotArea.tsx       # Plotly charts
│       ├── CoeffDisplay.tsx   # Coefficients + code
│       ├── StatusBar.tsx      # Connection status
│       └── InlineView.tsx     # Compact view
├── docs/                      # Project documentation (see below)
├── CLAUDE.md                  # Project instructions for AI assistants
├── package.json               # UI dependencies
├── vite.config.ts             # Vite build config
└── tsconfig.json              # TypeScript config (UI)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Server | Python + FastMCP + Starlette + uvicorn |
| MATLAB | `matlab.engine` for Python |
| HTTPS | ngrok tunnel (or direct TLS via uvicorn) |
| UI | React 19 + TypeScript + Vite |
| Plots | Plotly.js (client-side, interactive) |
| Build | `vite-plugin-singlefile` (bundles UI into single HTML) |

## Quick Start

### Development (UI only, preview mode)

```bash
cd ui && npm install && npm run dev:preview
# → http://localhost:5173?preview=true
```

### Full stack (with MATLAB)

```bash
# 1. Install Python deps
pip install -r requirements.txt

# 2. Build UI
cd ui && npm install && npm run build

# 3. Start server
python mcp_server.py --http
# → http://localhost:8000/mcp

# 4. (Optional) HTTPS via ngrok
ngrok http 8000
# → https://your-domain.ngrok.dev/mcp
```

### Client Configuration

```json
{
  "mcpServers": {
    "filter-design": {
      "url": "https://your-domain.ngrok.dev/mcp"
    }
  }
}
```

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

## Documentation

All project docs live in `docs/`. See `docs/README.md` for the full index.

| Folder | Purpose |
|--------|---------|
| `docs/plan/` | Implementation plans with phased steps and checklists |
| `docs/knowledge/` | Reference patterns, API contracts, architecture |
| `docs/notes/` | Investigation findings, gotchas, decisions |
| `docs/tickets/` | Task tracking — what/why/how with acceptance criteria |

## Status

**Phase:** Documentation complete, implementation starting.

See `docs/tickets/` for current work items:
- TICKET-001: Python MCP server with HTTPS (High)
- TICKET-002: Port filter design UI to React (High)
- TICKET-003: MCP SDK integration (Medium)
- TICKET-004: End-to-end test and deploy (Medium)
