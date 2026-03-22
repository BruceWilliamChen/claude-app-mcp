# Knowledge: MCP Server Patterns (from mcp-app-doudou-ref)

> Reference: `D:\projects\mcp-app-doudou-ref\mcp_server.py`
> This doc captures exact code patterns we need to replicate.

---

## FastMCP Initialization

```python
from mcp.server.fastmcp import FastMCP
mcp = FastMCP("ServerName")
```

## Tool Registration with UI Link

The `meta.ui.resourceUri` tells the host to render the UI widget when this tool is called:

```python
FILTER_UI_URI = "ui://filter-design/app.html"

@mcp.tool(meta={"ui": {"resourceUri": FILTER_UI_URI}})
def configure_filter(filter_type: str = "butterworth", ...) -> str:
    """Tool description here — model reads this to understand what params do."""
    result = { ... }
    return json.dumps(result)
```

## Resource Registration

The `mime_type="text/html;profile=mcp-app"` is **critical** — tells the host this is an MCP app widget:

```python
@mcp.resource(
    FILTER_UI_URI,
    name="filter-design-app",
    description="Interactive filter design configurator",
    mime_type="text/html;profile=mcp-app",
)
def filter_design_app() -> str:
    return Path("ui/dist/mcp-app.html").read_text()
```

## HTTP Mode with Starlette Route Fix

**Known issue**: FastMCP's `streamable_http_app()` creates Starlette routes with only GET/HEAD methods. MCP protocol needs POST/DELETE/OPTIONS too. Must manually fix:

```python
if "--http" in sys.argv:
    from starlette.applications import Starlette
    from starlette.routing import Route
    from starlette.middleware import Middleware
    from starlette.middleware.cors import CORSMiddleware
    import uvicorn

    original_app = mcp.streamable_http_app()

    # Fix routes to support all HTTP methods
    fixed_routes = []
    for route in original_app.routes:
        if isinstance(route, Route) and route.path == "/mcp":
            fixed_routes.append(
                Route(
                    route.path,
                    endpoint=route.app,
                    methods=["GET", "POST", "DELETE", "OPTIONS"],
                    name=route.name,
                )
            )
        else:
            fixed_routes.append(route)

    cors_middleware = [
        Middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_methods=["*"],
            allow_headers=["*"],
        )
    ]

    app = Starlette(
        debug=original_app.debug,
        routes=fixed_routes,
        middleware=cors_middleware + list(original_app.user_middleware),
        lifespan=lambda app: mcp.session_manager.run(),  # CRITICAL
    )

    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
else:
    mcp.run()  # stdio
```

**Key gotcha**: The `lifespan=lambda app: mcp.session_manager.run()` is required — without it the session manager never starts and connections fail silently.

## Python Dependencies

```
mcp>=1.26.0
uvicorn>=0.40.0
```

## ngrok for HTTPS

No TLS code needed — ngrok handles it:

```bash
python mcp_server.py --http &    # localhost:8000
ngrok http 8000                  # → https://xxx.ngrok.dev
```

The MCP endpoint becomes: `https://xxx.ngrok.dev/mcp`

---

## UI SDK Patterns

### Production Hook (useMcpToolResult)

```typescript
import { useApp } from "@modelcontextprotocol/ext-apps/react";

export function useMcpToolResult() {
  const [data, setData] = useState(null);
  const [displayMode, setDisplayMode] = useState<"inline" | "fullscreen">("inline");

  const { app, isConnected, error } = useApp({
    appInfo: { name: "App Name", version: "1.0.0" },
    capabilities: {
      availableDisplayModes: ["inline", "fullscreen"],
    },
    onAppCreated: (app) => {
      app.ontoolresult = (result) => {
        const text = result.content?.find(c => c.type === "text")?.text;
        if (text) {
          const parsed = JSON.parse(text);
          setData(parsed);
        }
      };
      app.onhostcontextchanged = (ctx) => {
        if (ctx.displayMode) setDisplayMode(ctx.displayMode);
      };
    },
  });

  return { data, setData, isConnected, error, app, displayMode };
}
```

### Calling Server Tools from UI

```typescript
// Direct tool call — bypasses model, goes straight to server
const result = await app.callServerTool("run-filter-design", params);
```

### Updating Model Context

```typescript
// Keep model aware of current UI state
app.updateModelContext({
  currentConfig: { filter_type: "butterworth", ... },
  lastResult: { elapsed: 0.5, coefficients: { b: [...], a: [...] } },
});
```

### Requesting Display Mode Change

```typescript
app.requestDisplayMode({ mode: "fullscreen" });
```

### Preview Mode Detection

```typescript
const isPreview = import.meta.env.VITE_PREVIEW_MODE === 'true'
  || new URLSearchParams(window.location.search).get('preview') === 'true';
```

### Preview Mock App Object

```typescript
const mockApp = {
  callServerTool: async () => ({ isError: false, content: [] }),
  updateModelContext: async () => {},
  requestDisplayMode: ({ mode }) => setDisplayMode(mode),
};
```

## NPM Dependencies for UI

```json
{
  "dependencies": {
    "@modelcontextprotocol/ext-apps": "^1.0.1",
    "@modelcontextprotocol/sdk": "^1.12.1",
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.5.2",
    "vite": "^6.3.5",
    "vite-plugin-singlefile": "^2.0.3",
    "typescript": "^5.8.3"
  }
}
```

## Vite Config for Single-File Build

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  root: "ui",
  build: {
    outDir: "../dist/ui",
    emptyOutDir: true,
  },
});
```
