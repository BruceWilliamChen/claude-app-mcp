# Filter Design MCP App — Implementation Plan

> Port the filter design UI from `matlab-mcp-app` into an MCP app with HTTPS support,
> using patterns from `mcp-app-doudou-ref` for the MCP server architecture.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Plan 1: Python MCP Server with HTTPS](#plan-1-python-mcp-server-with-https)
- [Plan 2: React UI (Port from Filter Design App)](#plan-2-react-ui-port-from-filter-design-app)
- [Plan 3: MCP App SDK Integration](#plan-3-mcp-app-sdk-integration)
- [Plan 4: Build, Deploy & Test](#plan-4-build-deploy--test)
- [Master Checklist](#master-checklist)

---

## Overview

### What We're Building

An MCP app that lets users design digital filters (Butterworth, Chebyshev I/II, Elliptic, FIR)
directly inside a chat interface. MATLAB runs remotely, computes filter coefficients and
frequency response data, and the UI renders interactive Plotly plots client-side.

### Reference Projects

| Project | Location | What We Take |
|---------|----------|--------------|
| `matlab-mcp-app` | `D:\projects\matlab-mcp-app` | UI (HTML/CSS/JS), Flask+MATLAB API, Plotly rendering, data contracts |
| `mcp-app-doudou-ref` | `D:\projects\mcp-app-doudou-ref` | Python FastMCP server, HTTPS setup, tool/resource registration, preview mode, MCP App SDK hooks |

### Key Decisions

1. **Server: Python FastMCP** (not Node.js) — aligns with doudou reference AND reuses `matlab.engine` from filter design app. The existing Node.js scaffold will be replaced.
2. **HTTPS: ngrok** for POC, with option for direct TLS via uvicorn later.
3. **UI: React + Vite** — port vanilla JS filter design UI into React components, bundle to single HTML via `vite-plugin-singlefile`.
4. **MATLAB bridge: `matlab.engine`** — same approach as `server.py` in filter design app.

---

## Architecture

```
User (chat) ←→ Host (Claude/ChatGPT) ←→ MCP Server (Python) ←→ MATLAB Engine
                                              ↕
                                         UI (React iframe)
                                              ↕
                                         Plotly.js (client-side)
```

### Communication Flow

1. User: "Design a lowpass filter at 1kHz"
2. Host calls `configure-filter` tool with params
3. Server returns JSON result + tells host to render UI
4. Host fetches `ui://filter-design/app.html` resource → renders React app in iframe
5. UI receives tool result via `app.ontoolresult` → pre-fills form
6. User adjusts parameters in the form
7. UI calls `app.updateModelContext()` → host stays aware of current settings
8. User clicks "Run" → UI calls `run-filter-design` tool directly (no LLM round-trip)
9. Server executes MATLAB code → returns numeric data (freq, magnitude, phase, etc.)
10. UI renders interactive Plotly plots client-side

### Data Flow

```
UI Form State
    ↓ (getParams)
FilterConfig JSON
    ↓ (app.callServerTool or fetch)
Python MCP Server
    ↓ (build_design_code + matlab.engine.eval)
MATLAB Engine
    ↓ (jsonencode + stdout)
FilterResult JSON
    ↓ (app.ontoolresult)
React State
    ↓ (Plotly.newPlot)
Interactive Charts
```

---

## Plan 1: Python MCP Server with HTTPS

### Goal
Replace the Node.js scaffold with a Python FastMCP server that:
- Registers two tools (`configure-filter`, `run-filter-design`)
- Serves the built React UI as an MCP resource
- Connects to MATLAB via `matlab.engine`
- Supports stdio (desktop) and HTTPS (web) transports

### Files to Create

| File | Purpose |
|------|---------|
| `mcp_server.py` | Main server: FastMCP init, tools, resource, HTTP mode |
| `matlab_bridge.py` | MATLAB engine wrapper: init, execute, status |
| `codegen.py` | Filter design MATLAB code generation |
| `requirements.txt` | Python dependencies |
| `scripts/start.sh` | Start server in HTTP mode |
| `scripts/start-ngrok.sh` | Start server + ngrok tunnel |
| `scripts/stop.sh` | Stop server |

### 1.1 FastMCP Server Setup (`mcp_server.py`)

Based on doudou's pattern. Key structure:

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("FilterDesign")

FILTER_UI_URI = "ui://filter-design/app.html"
FILTER_UI_PATH = Path(__file__).parent / "ui" / "dist" / "mcp-app.html"
```

### 1.2 Tool Registration

**Tool 1: `configure-filter`** (visible to model + app)
- Input schema: all filter params with descriptions (so model can explain them)
- Returns: JSON with filter config + optional results
- Meta: `{"ui": {"resourceUri": FILTER_UI_URI}}`
- Model calls this to open the UI and pre-fill settings

**Tool 2: `run-filter-design`** (visible to app only)
- Same input schema but always executes MATLAB
- UI's "Run" button calls this directly via `app.callServerTool()`
- Returns: numeric data (freq, magnitude, phase, coefficients, etc.)
- Fast path — no LLM round-trip

### 1.3 Resource Registration

```python
@mcp.resource(
    FILTER_UI_URI,
    name="filter-design-app",
    description="Interactive filter design configurator",
    mime_type="text/html;profile=mcp-app",
)
def filter_design_app() -> str:
    return FILTER_UI_PATH.read_text()
```

### 1.4 MATLAB Bridge (`matlab_bridge.py`)

Reuse pattern from `matlab-mcp-app/server.py`:

```python
# Key functions:
def init_engine()          # Start or connect to MATLAB session
def execute_filter(code)   # Run code, capture stdout/stderr, parse JSON
def check_status()         # Test connection, return version/PID
def shutdown()             # Clean up engine
```

### 1.5 Code Generation (`codegen.py`)

Port `build_design_code()` from `server.py`:
- Input: FilterConfig dict
- Output: MATLAB code string that designs filter + computes response + outputs JSON
- Supports: butterworth, chebyshev1, chebyshev2, elliptic, fir
- Response types: lowpass, highpass, bandpass, bandstop

### 1.6 HTTP/HTTPS Mode

Based on doudou's Starlette workaround:

```python
if "--http" in sys.argv:
    original_app = mcp.streamable_http_app()
    # Fix routes: add POST/DELETE/OPTIONS methods
    # Add CORS middleware
    # Set lifespan = mcp.session_manager.run()
    # Run with uvicorn on port 8000
else:
    mcp.run()  # stdio mode
```

### 1.7 ngrok for HTTPS

```bash
# Start MCP server on localhost:8000
python mcp_server.py --http &
# Tunnel with ngrok
ngrok http 8000
```

### Checklist — Plan 1

- [ ] Create `requirements.txt` (mcp>=1.26.0, uvicorn>=0.40.0, matlabengine)
- [ ] Create `matlab_bridge.py` with init_engine, execute_filter, check_status
- [ ] Create `codegen.py` with generate_filter_code()
- [ ] Create `mcp_server.py` with FastMCP, two tools, one resource
- [ ] Add HTTP mode with Starlette route fix + CORS
- [ ] Create `scripts/start.sh`
- [ ] Create `scripts/start-ngrok.sh`
- [ ] Create `scripts/stop.sh`
- [ ] Test stdio mode: `python mcp_server.py`
- [ ] Test HTTP mode: `python mcp_server.py --http`
- [ ] Test MATLAB connection: design a butterworth lowpass filter
- [ ] Test ngrok tunnel: verify HTTPS endpoint responds

---

## Plan 2: React UI (Port from Filter Design App)

### Goal
Port the vanilla JS filter design UI into React components that:
- Work standalone in preview mode (no MCP host needed)
- Support inline + fullscreen display modes
- Render interactive Plotly charts
- Bundle into a single HTML file via Vite

### Files to Create/Modify

| File | Purpose |
|------|---------|
| `ui/mcp-app.tsx` | React root: preview/production mode dispatch |
| `ui/mcp-app.html` | Vite entry point (add Plotly CDN) |
| `ui/types.ts` | FilterConfig, FilterResult, DisplayOptions types |
| `ui/global.css` | Full styles ported from filter design app |
| `ui/components/Header.tsx` | Title, Run button, Autorun toggle |
| `ui/components/ParamPanel.tsx` | Left panel: all filter parameters |
| `ui/components/PlotArea.tsx` | Plotly chart rendering |
| `ui/components/CoeffDisplay.tsx` | Coefficient + code display |
| `ui/components/StatusBar.tsx` | Connection status footer |
| `ui/components/InlineView.tsx` | Compact inline view |
| `ui/hooks/useFilterDesign.ts` | State management for params + results |
| `ui/hooks/useMcpToolResult.ts` | Production: MCP connection + tool results |
| `ui/hooks/useMockData.ts` | Preview: mock data for standalone dev |
| `ui/codegen-preview.ts` | Client-side MATLAB code preview |

### 2.1 Types (`ui/types.ts`)

```typescript
export type FilterType = "butterworth" | "chebyshev1" | "chebyshev2" | "elliptic" | "fir"
export type ResponseType = "lowpass" | "highpass" | "bandpass" | "bandstop"

export interface DisplayOptions {
  magnitude: boolean
  phase: boolean
  group_delay: boolean
  pole_zero: boolean
}

export interface FilterConfig {
  filter_type: FilterType
  response_type: ResponseType
  order: number
  cutoff_freq: number
  cutoff_freq_high?: number
  sample_rate: number
  passband_ripple?: number
  stopband_atten?: number
  display: DisplayOptions
}

export interface FilterResult {
  data: {
    b: number[]
    a: number[]
    freq: number[]
    magnitude: number[]
    phase: number[]
    group_delay?: number[]
    freq_gd?: number[]
    zeros_real?: number[]
    zeros_imag?: number[]
    poles_real?: number[]
    poles_imag?: number[]
  }
  matlab_code: string
  elapsed: number
}
```

### 2.2 Component Hierarchy

```
App
├── PreviewApp (dev mode)
│   └── FilterDesigner
└── ProductionApp (MCP mode)
    └── FilterDesigner

FilterDesigner (fullscreen)
├── Header (title, run btn, autorun, view toggle)
├── MainContent (flex row)
│   ├── ParamPanel (left sidebar)
│   │   ├── FilterTypeSection
│   │   ├── ResponseTypeSection
│   │   ├── OrderSection (slider)
│   │   ├── FrequencySection (conditional fields)
│   │   ├── RippleSection (conditional)
│   │   └── DisplaySection (checkboxes)
│   └── ResultsPanel (right)
│       ├── PlotArea (Plotly charts)
│       ├── CoeffDisplay (collapsible)
│       └── CodeDisplay (collapsible)
└── StatusBar (connection status, timing)

InlineView (compact)
├── InlineHeader (title, expand button)
├── InlineSummary (one-line filter description)
├── InlinePlot (magnitude only)
└── InlineCoefficients
```

### 2.3 Plotly Integration

Two options:
- **Option A**: Include Plotly via CDN in `mcp-app.html` `<script>` tag (simpler, but adds external dependency)
- **Option B**: `npm install plotly.js-dist-min` + import in React (bundled into single file, but increases bundle size ~3MB)

**Recommended: Option A** — CDN script tag. The `vite-plugin-singlefile` will still produce a single HTML, and Plotly is loaded at runtime. This keeps the bundle manageable.

However, note that MCP app resources are served as self-contained HTML in a sandboxed iframe. **CDN won't work in sandboxed iframes without network access.** So we need **Option B** — bundle Plotly into the single file.

**Final answer: Option B** — install `plotly.js-dist-min` and import it. The bundle will be larger (~3-4MB) but fully self-contained.

### 2.4 Preview Mode

Based on doudou's pattern:

```typescript
// Detect preview mode
const isPreview = import.meta.env.VITE_PREVIEW_MODE === 'true'
  || new URLSearchParams(window.location.search).get('preview') === 'true';
```

In preview mode:
- No MCP connection
- Mock `app` object with stub `callServerTool`, `updateModelContext`
- Either use mock data OR connect to the Flask `server.py` API directly for real MATLAB results

**Bonus**: In preview mode, we can `fetch("http://localhost:3000/api/design", ...)` to hit the existing Flask server — giving us real MATLAB results without the MCP layer.

### 2.5 CSS Strategy

Port the filter design app's CSS variables and layout into `global.css`:
- Same color scheme (`--accent: #0076c6`, etc.)
- Same layout pattern (flex column, left sidebar, right results)
- Same component styles (sections, form controls, plot area, status bar)
- Add inline view styles

### Checklist — Plan 2

- [ ] Update `ui/types.ts` with FilterConfig, FilterResult, DisplayOptions
- [ ] Install `plotly.js-dist-min` and `@types/plotly.js` (or use global Plotly type)
- [ ] Create `ui/global.css` with full styles from filter design app
- [ ] Create `ui/hooks/useFilterDesign.ts` (param state, results, run logic)
- [ ] Create `ui/hooks/useMockData.ts` (preview mode)
- [ ] Create `ui/components/Header.tsx`
- [ ] Create `ui/components/ParamPanel.tsx` (all param sections with conditional fields)
- [ ] Create `ui/components/PlotArea.tsx` (Plotly rendering for all 4 plot types)
- [ ] Create `ui/components/CoeffDisplay.tsx`
- [ ] Create `ui/components/StatusBar.tsx`
- [ ] Create `ui/components/InlineView.tsx`
- [ ] Create `ui/codegen-preview.ts` (client-side code generation for live preview)
- [ ] Update `ui/mcp-app.tsx` (preview/production dispatch)
- [ ] Update `ui/mcp-app.html` (if needed)
- [ ] Test preview mode: `npm run dev` → open in browser
- [ ] Verify all 4 plot types render correctly
- [ ] Verify conditional fields show/hide properly
- [ ] Verify inline view works

---

## Plan 3: MCP App SDK Integration

### Goal
Wire up the React UI to communicate with the MCP server via the App SDK, so it works
inside a chat host (not just standalone).

### Files to Create/Modify

| File | Purpose |
|------|---------|
| `ui/hooks/useMcpToolResult.ts` | Production: receive tool results, manage display mode |
| `ui/mcp-app.tsx` | Production vs preview dispatch |

### 3.1 Tool Result Hook (`useMcpToolResult.ts`)

Based on doudou's pattern:

```typescript
export function useMcpToolResult() {
  const [result, setResult] = useState<FilterResult | null>(null);
  const [config, setConfig] = useState<FilterConfig | null>(null);
  const [displayMode, setDisplayMode] = useState<"inline" | "fullscreen">("inline");

  const { app, isConnected, error } = useApp({
    appInfo: { name: "Filter Design", version: "1.0.0" },
    capabilities: {
      availableDisplayModes: ["inline", "fullscreen"],
    },
    onAppCreated: (app) => {
      app.ontoolresult = (result) => {
        // Parse tool output, update state
      };
      app.onhostcontextchanged = (ctx) => {
        if (ctx.displayMode) setDisplayMode(ctx.displayMode);
      };
    },
  });

  return { result, config, isConnected, error, app, displayMode };
}
```

### 3.2 Calling Server Tools from UI

When user clicks "Run":

```typescript
const result = await app.callServerTool("run-filter-design", {
  filter_type: "butterworth",
  response_type: "lowpass",
  order: 4,
  cutoff_freq: 1000,
  sample_rate: 8000,
  display: { magnitude: true, phase: true, group_delay: false, pole_zero: false },
});
```

### 3.3 Keeping Model Context Updated

On every parameter change:

```typescript
app.updateModelContext({
  currentConfig: getParams(),
  lastResult: result ? {
    matlab_code: result.matlab_code,
    elapsed: result.elapsed,
    coefficients: { b: result.data.b, a: result.data.a },
  } : null,
});
```

### Checklist — Plan 3

- [ ] Create `ui/hooks/useMcpToolResult.ts`
- [ ] Update `ui/mcp-app.tsx` with preview/production dispatch
- [ ] Wire `app.callServerTool("run-filter-design", ...)` to Run button
- [ ] Wire `app.updateModelContext()` to parameter changes
- [ ] Support `displayMode` switching (inline ↔ fullscreen)
- [ ] Test with MCP inspector or test host
- [ ] Test with desktop client (stdio mode)

---

## Plan 4: Build, Deploy & Test

### Goal
Get everything building, running, and tested end-to-end.

### 4.1 Build Pipeline

```bash
# 1. Build React UI → single HTML file
cd ui && npm install && npm run build
# Output: dist/ui/mcp-app.html (or ui/dist/mcp-app.html)

# 2. Install Python deps
pip install -r requirements.txt

# 3. Start server (HTTP mode)
python mcp_server.py --http
# → http://localhost:8000/mcp

# 4. (Optional) Start ngrok for HTTPS
ngrok http 8000
# → https://your-domain.ngrok.dev/mcp
```

### 4.2 Development Workflow

```bash
# Terminal 1: Vite dev server (UI with HMR)
cd ui && npm run dev:preview
# → http://localhost:5173?preview=true

# Terminal 2: Flask server (for real MATLAB results in preview mode)
cd ../matlab-mcp-app && python server.py
# → http://localhost:3000/api/design

# Terminal 3: MCP server (for testing MCP integration)
python mcp_server.py --http
# → http://localhost:8000/mcp
```

### 4.3 Client Configuration

Since the server is hosted remotely (via ngrok or any HTTPS endpoint), clients
just connect to the URL — no local Python or MATLAB needed on the client side.

```json
{
  "mcpServers": {
    "filter-design": {
      "url": "https://your-domain.ngrok.dev/mcp"
    }
  }
}
```

> **Note**: The `"command"` + `"args"` pattern (stdio mode) is only for when
> the client launches the server as a local subprocess. We don't need that —
> our whole point is remote MATLAB.

### 4.4 Test Scenarios

| # | Test | Expected |
|---|------|----------|
| 1 | Open preview mode in browser | UI renders, form works, no errors |
| 2 | Click Run in preview mode | Hits Flask API, plots render |
| 3 | Start MCP server HTTP mode | `/mcp` endpoint responds |
| 4 | MATLAB connection | Status shows connected + version |
| 5 | Design butterworth lowpass | Returns 1024 freq points + coefficients |
| 6 | Design bandpass filter | Upper frequency field appears, correct results |
| 7 | Toggle display options | Plots show/hide correctly |
| 8 | Pole-zero plot | Zeros, poles, unit circle render |
| 9 | Inline view | Compact view with magnitude plot |
| 10 | ngrok HTTPS | MCP endpoint accessible via HTTPS URL |
| 11 | Desktop client | Tool appears, UI renders in chat |
| 12 | Model pre-fills form | "Design a 6th order Chebyshev lowpass" → form pre-filled |

### Checklist — Plan 4

- [ ] `npm run build` succeeds without errors
- [ ] `python mcp_server.py --http` starts and `/mcp` responds
- [ ] MATLAB engine connects and executes filter design
- [ ] UI renders in browser (preview mode)
- [ ] All 4 plot types render with Plotly
- [ ] Run button executes MATLAB and returns results
- [ ] ngrok HTTPS tunnel works
- [ ] Desktop client integration works
- [ ] Inline view displays correctly
- [ ] Model context updates reach the host

---

## Master Checklist

### Phase 1: Server (Plan 1)
- [ ] `requirements.txt`
- [ ] `matlab_bridge.py`
- [ ] `codegen.py`
- [ ] `mcp_server.py`
- [ ] HTTP mode + CORS
- [ ] Startup scripts
- [ ] Server tests pass

### Phase 2: UI (Plan 2)
- [ ] Types defined
- [ ] Plotly installed
- [ ] CSS ported
- [ ] All React components created
- [ ] Preview mode works
- [ ] All plots render
- [ ] Conditional fields work
- [ ] Inline view works

### Phase 3: MCP Integration (Plan 3)
- [ ] `useMcpToolResult` hook
- [ ] Tool result handling
- [ ] `callServerTool` wiring
- [ ] `updateModelContext` wiring
- [ ] Display mode switching

### Phase 4: Build & Test (Plan 4)
- [ ] Build succeeds
- [ ] Server starts
- [ ] MATLAB connects
- [ ] End-to-end test passes
- [ ] HTTPS works
- [ ] Desktop client works
