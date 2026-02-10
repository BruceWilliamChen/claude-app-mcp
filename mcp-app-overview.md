# Building an MCP App for Claude

## Parts of an MCP App

### 1. MCP Server (backend)
The Node.js server that handles the protocol. It:
- Connects via SSE or stdio transport
- Registers **tools** (functions Claude can call)
- Registers **UI resources** (the HTML/JS that renders in Claude)
- Handles tool call logic (your app's business logic)

### 2. UI Resource (frontend)
A bundled HTML page with JS that renders inside Claude's chat as a sandboxed iframe. You build this with React (or Vue, Svelte, Vanilla JS, etc.). It:
- Receives tool output data from Claude
- Renders your interactive UI
- Can call server tools back
- Can update the model's context (tell Claude what the user did)

### 3. SDK Wiring (`@modelcontextprotocol/ext-apps`)
The official SDK that connects your UI to the host (Claude). You use:
```js
import { App } from "@modelcontextprotocol/ext-apps";
const app = new App();
await app.connect();
```
React hooks are available via `@modelcontextprotocol/ext-apps/react`.

### 4. Tool <-> UI Linking
Each tool declares a `_meta.ui.resourceUri` pointing to a `ui://` resource. When Claude calls the tool, it fetches the linked UI and renders it.

### 5. Build System
Vite (or similar) to bundle your React/TS code into a single HTML+JS file that the server can serve as a UI resource.

### 6. Tunnel / Hosting
For dev: ngrok or similar to expose localhost to Claude. For prod: deploy to any hosting with HTTPS.

## Summary Checklist

| # | Part | What |
|---|------|------|
| 1 | **Server** | Node.js MCP server (tools + resources) |
| 2 | **UI** | React component(s) bundled as HTML |
| 3 | **SDK** | `@modelcontextprotocol/ext-apps` for UI <-> host communication |
| 4 | **Tool definitions** | Register tools with `ui://` resource URIs |
| 5 | **Build** | Vite to bundle frontend |
| 6 | **Transport** | SSE or stdio for server <-> Claude connection |
| 7 | **Hosting** | ngrok (dev) or HTTPS server (prod) |

## References
- [MCP Apps GitHub (ext-apps SDK)](https://github.com/modelcontextprotocol/ext-apps)
- [MCP Apps Blog Post](http://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/)
- [MCP Apps Spec PR](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/1865)
