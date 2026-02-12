# Project Architecture

---

```
name: Project Architecture
description: How the MATLAB Noise Filter MCP app is structured — the server, UI, build system, and how they communicate with each other and with Claude.
```

---

## Big Picture

A user says something like "Remove noise from my photo" in Claude. Claude opens an interactive UI right in the chat where they can tweak filter settings, preview MATLAB code, click Run, and see before/after results — all without leaving the conversation.

---

## The Two Halves

```
claude-app-mcp/
├── server/        ← backend (runs on your machine)
└── ui/            ← frontend (renders inside Claude's chat)
```

### Server (`server/`)

A Node.js process that speaks the **MCP protocol** — the same way Claude talks to any MCP server (like file systems, databases, etc.). It does three things:

1. **Registers tools** — functions Claude can call. For example, `configure-noise-filter` tells Claude "hey, I can filter images."
2. **Serves the UI** — the built HTML file is registered as a resource. When Claude calls the tool, it fetches this HTML and renders it in an iframe.
3. **Runs MATLAB** — when the user clicks "Run" in the UI, it executes MATLAB code and returns results.

Two transport modes:
- **stdio** — for Claude Desktop (Claude launches the server as a subprocess)
- **HTTP** — for web/testing (server runs standalone, Claude connects over the network)

### UI (`ui/`)

A React app that gets **bundled into a single HTML file** by Vite. This is important — MCP serves the UI as one resource, so everything (JS, CSS) must be inlined into one file.

The UI:
- Renders a form (filter type, parameters, image path)
- Shows a live MATLAB code preview as you change settings
- Calls the server directly when you click "Run" (no LLM round-trip needed)
- Tells Claude what the user is doing via `updateModelContext()` so Claude can make suggestions

---

## Communication Flow

```
User ←→ Claude ←→ MCP Server ←→ MATLAB
                       ↕
                   UI (iframe)
```

Step by step:

1. **User → Claude**: "Remove noise from photo.jpg"
2. **Claude → Server**: Calls `configure-noise-filter` tool with params
3. **Server → Claude**: Returns result + tells Claude to render the UI
4. **UI renders** in chat: form pre-filled with Claude's suggested settings
5. **User tweaks form**: UI calls `updateModelContext()` so Claude stays aware
6. **User clicks Run**: UI calls `run-noise-filter` directly on the server (skips Claude for speed)
7. **Server → MATLAB**: Executes the filter code
8. **Server → UI**: Returns images, metrics, console output
9. **User → Claude**: "SSIM is low, what should I change?" — Claude reads the context and suggests

---

## Config Files

| File | What it does |
|------|-------------|
| `package.json` | Dependencies + npm scripts (`build`, `dev`, `serve`) |
| `tsconfig.json` (root) | TypeScript config for the **UI** — type checking only, Vite does the actual build |
| `server/tsconfig.json` | TypeScript config for the **server** — compiles to `dist/` |
| `vite.config.ts` | Bundles the React UI into a single HTML file |

---

## Build Output

```
dist/
├── ui/
│   └── mcp-app.html    ← single-file UI (React + CSS inlined)
├── main.js              ← compiled server entry point
├── server.js            ← compiled tool/resource registration
└── ...                  ← other compiled server files
```

---

## Key Concepts

### Why single-file HTML?
MCP serves the UI as a **resource** — a single blob of content. The host (Claude) fetches it and renders it in a sandboxed iframe. There's no web server serving static assets, so everything must be self-contained in one HTML file. `vite-plugin-singlefile` handles this by inlining all JS and CSS.

### Why two tools?
- **`configure-noise-filter`** (visible to Claude + UI): Claude calls this to open the UI and pre-fill settings from natural language. This is the "smart" path — LLM interprets what the user wants.
- **`run-noise-filter`** (visible to UI only): The UI's "Run" button calls this directly. No LLM round-trip needed — just execute and return results. This is the "fast" path.

### Why `updateModelContext()`?
When the user changes settings in the UI, Claude doesn't automatically know. Calling `updateModelContext()` pushes the current form state to Claude, so when the user asks "what should I change?", Claude has the latest settings to reason about.
