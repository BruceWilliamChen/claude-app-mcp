# Knowledge: Current Scaffold State

> What exists in `matlab-mcp-app-smoothdata` before we start building.
> This documents what to keep, what to modify, and what to delete.

---

## Status: Minimal MVP (Hello World)

The project has infrastructure in place but zero functionality.

## What Works
- `npm install` succeeds
- `npm run build` would produce a single HTML file (if types are clean)
- Server registers one MCP tool (`open-configurator`) and one resource
- UI renders "Hello World" when connected to MCP host

## What's Missing
- No MATLAB integration
- No filter design UI (just a message display)
- No Plotly charts
- No preview mode
- No HTTPS support

---

## Files: Keep vs Modify vs Delete

| File | Action | Notes |
|------|--------|-------|
| `server/main.ts` | **DELETE** | Replacing with Python FastMCP server |
| `server/server.ts` | **DELETE** | Replacing with Python FastMCP server |
| `server/tsconfig.json` | **DELETE** | No longer needed for Python server |
| `ui/mcp-app.tsx` | **MODIFY** | Add preview/production dispatch, filter design components |
| `ui/mcp-app.html` | **MODIFY** | May need Plotly script tag or other changes |
| `ui/types.ts` | **MODIFY** | Replace with FilterConfig, FilterResult types |
| `ui/global.css` | **MODIFY** | Port full CSS from filter design app |
| `package.json` | **MODIFY** | Remove server deps (express, cors), add plotly |
| `vite.config.ts` | **KEEP** | Already configured correctly |
| `tsconfig.json` | **KEEP** | Already configured for UI only |
| `docs/` | **KEEP+ADD** | Keep existing docs, add new ones |
| `README.md` | **MODIFY** | Update to reflect filter design app |

## New Files to Create

### Server (Python)
- `mcp_server.py`
- `matlab_bridge.py`
- `codegen.py`
- `requirements.txt`
- `scripts/start.sh`
- `scripts/start-ngrok.sh`
- `scripts/stop.sh`

### UI (React components)
- `ui/components/Header.tsx`
- `ui/components/ParamPanel.tsx`
- `ui/components/PlotArea.tsx`
- `ui/components/CoeffDisplay.tsx`
- `ui/components/StatusBar.tsx`
- `ui/components/InlineView.tsx`
- `ui/hooks/useFilterDesign.ts`
- `ui/hooks/useMcpToolResult.ts`
- `ui/hooks/useMockData.ts`
- `ui/codegen-preview.ts`

---

## Current File Contents (for reference)

### server/main.ts (57 lines) — TO DELETE

Node.js Express server with stdio + HTTP transports.
Uses `StreamableHTTPServerTransport` and session management.
Listens on port 3000.

### server/server.ts (49 lines) — TO DELETE

Registers `open-configurator` tool with `registerAppTool()`.
Serves built HTML via `registerAppResource()`.
Uses `@modelcontextprotocol/ext-apps/server`.

### ui/mcp-app.tsx (34 lines) — TO REWRITE

```typescript
// Current: just displays a message
function App() {
  const [message, setMessage] = useState<string | null>(null);
  const { isConnected, error } = useApp({
    appInfo: { name: "noise-filter-configurator", version: "0.1.0" },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = (result) => {
        // Parse text content → set message
      };
    },
  });
  return (
    <div>
      <h2>Noise Filter Configurator</h2>
      <p>{message ?? "Hello World"}</p>
    </div>
  );
}
```

### ui/types.ts (12 lines) — TO REWRITE

```typescript
// Current: placeholder types
export interface ConfiguratorToolOutput { message: string; }
export interface ConfiguratorAppState { message: string; }
```

### ui/global.css (5 lines) — TO EXPAND

```css
// Current: minimal reset only
* { margin: 0; padding: 0; box-sizing: border-box; }
```

### package.json — TO MODIFY

Current dependencies include Express, cors, zod (server-side) that we won't need.
Need to add: `plotly.js-dist-min` (or keep Plotly via CDN).

### vite.config.ts — KEEP AS-IS

```typescript
// Already configured: react + singlefile, root=ui, outDir=dist/ui
```
