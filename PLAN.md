# MATLAB Noise Filter Configurator — MCP App for Claude

## Project Structure

```
claude-app-mcp/
├── server/
│   ├── server.ts            # MCP server: tool + resource registration
│   ├── main.ts              # Entry point: stdio + HTTP transports
│   ├── matlab-bridge.ts     # node-matlab session wrapper
│   ├── codegen.ts           # MATLAB code generation from filter params
│   └── tsconfig.json        # Server TypeScript config
├── ui/
│   ├── mcp-app.html         # HTML entry point for Vite
│   ├── mcp-app.tsx          # React root (useApp, state, wiring)
│   ├── global.css           # Base styles
│   ├── types.ts             # Shared types (FilterConfig, FilterResult)
│   ├── codegen-preview.ts   # Client-side MATLAB code preview
│   └── components/
│       ├── FilterForm.tsx    # Config form (filter type, params, noise)
│       ├── CodePreview.tsx   # MATLAB code preview block
│       ├── ImageDisplay.tsx  # Before/after image viewer
│       ├── MetricsPanel.tsx  # PSNR, SSIM, execution time
│       └── ConsoleOutput.tsx # MATLAB console log
├── dist/                     # Build output (gitignored)
├── vite.config.ts
├── tsconfig.json             # Client TypeScript config (noEmit, Vite handles)
├── package.json
├── PLAN.md
└── README.md
```

## Tech Stack

- **Server**: Node.js + TypeScript + `@modelcontextprotocol/sdk` + `@modelcontextprotocol/ext-apps`
- **UI**: React 19 + TypeScript + `@modelcontextprotocol/ext-apps/react`
- **Build**: Vite + `vite-plugin-singlefile` (bundles UI into single HTML file)
- **MATLAB bridge**: `node-matlab` npm package (wraps `matlab -batch`)
- **Transport**: stdio (Claude Desktop) or Streamable HTTP (web)

## How Claude Interacts

1. User: "Remove noise from ~/photo.jpg" → Claude calls `configure-noise-filter` with pre-filled params
2. UI renders with form pre-filled → user adjusts settings
3. UI calls `updateModelContext()` on every change → Claude stays aware
4. User: "What does kernel size do?" → Claude reads tool schema descriptions, explains
5. User clicks "Run" → UI calls `run-noise-filter` directly → MATLAB executes → results display
6. User: "SSIM is low, suggest better settings?" → Claude reads context, suggests changes

---

## Implementation Steps

### Step 1: Scaffold project
- [ ] Create directory structure
- [ ] Create `package.json` with scripts and dependencies
- [ ] Create root `tsconfig.json` (client — noEmit, Vite handles compilation)
- [ ] Create `server/tsconfig.json` (server — compiles to dist/)
- [ ] Create `vite.config.ts` (React + singlefile plugin)
- [ ] Create `ui/mcp-app.html` (Vite entry point)
- [ ] Run `npm install`

**Key dependencies:**
- Runtime: `@modelcontextprotocol/ext-apps`, `@modelcontextprotocol/sdk`, `node-matlab`, `express`, `cors`, `zod`, `react`, `react-dom`
- Dev: `vite`, `@vitejs/plugin-react`, `vite-plugin-singlefile`, `tsx`, `typescript`, `concurrently`, `cross-env`, `@types/react`, `@types/react-dom`, `@types/express`, `@types/cors`

---

### Step 2: Shared types (`ui/types.ts`)
- [ ] `FilterType`: `"gaussian" | "median" | "wiener"`
- [ ] `FilterConfig`: imagePath, filterType, per-filter params (sigma, kernelSize, noiseVariance), noise injection options (addNoise, noiseType, noiseDensity)
- [ ] `FilterResult`: originalImage (base64), filteredImage (base64), noisyImage (base64), psnr, ssim, executionTimeMs, matlabCode, consoleOutput
- [ ] `NoiseFilterToolOutput`: config + result + generatedCode + error

---

### Step 3: MATLAB code generation (`server/codegen.ts` + `ui/codegen-preview.ts`)
- [ ] Pure function: `generateMatlabCode(config: FilterConfig) -> string`
- [ ] Generates self-contained MATLAB script that:
  - Reads image with `imread()`
  - Optionally adds noise with `imnoise()`
  - Applies filter: `imgaussfilt()` / `medfilt2()` / `wiener2()`
  - Computes PSNR/SSIM metrics
  - Saves output images to temp dir via `imwrite()`
  - Prints metrics as JSON with markers for parsing
- [ ] Client-side duplicate (`ui/codegen-preview.ts`) for instant code preview (no server round-trip)

---

### Step 4: MATLAB bridge (`server/matlab-bridge.ts`)
- [ ] Use `node-matlab`'s `createSession()` for persistent MATLAB session (avoids 5-15s startup per call)
- [ ] `executeFilter(matlabCode: string)` → runs code, reads output images as base64, parses metrics JSON from stdout
- [ ] `checkMatlabAvailable()` → verifies MATLAB is installed and on PATH
- [ ] Handle timeouts (60s default), session crashes, and restarts
- [ ] Clean up temp files after reading

---

### Step 5: MCP server (`server/server.ts`)
- [ ] **Tool 1: `configure-noise-filter`** (visibility: model + app)
  - Claude calls this to open the UI and optionally pre-fill settings from natural language
  - Input schema describes all configurable params with descriptions (so Claude can explain them)
  - Optional `execute: true` flag to also run the code
  - Returns text summary (for Claude) + structuredContent (for UI)
  - `_meta.ui.resourceUri: "ui://noise-filter/mcp-app.html"` links to the UI
- [ ] **Tool 2: `run-noise-filter`** (visibility: app only — hidden from Claude)
  - UI's "Run" button calls this directly via `app.callServerTool()`
  - Always executes MATLAB, returns results
  - Faster path — no LLM round-trip needed
- [ ] **Resource**: `ui://noise-filter/mcp-app.html` serves the built single-file HTML
- [ ] Use `registerAppTool()` and `registerAppResource()` from ext-apps SDK

---

### Step 6: Server entry point (`server/main.ts`)
- [ ] `--stdio` flag → `StdioServerTransport` (for Claude Desktop)
- [ ] Default → Express + `StreamableHTTPServerTransport` on port 3001 (for web/testing)
- [ ] Graceful shutdown handling

---

### Step 7: React UI root (`ui/mcp-app.tsx`)
- [ ] `useApp()` hook connects to Claude host
- [ ] `app.ontoolresult` → receives config/results when Claude calls the tool
- [ ] `app.ontoolinput` → receives tool arguments (for pre-filling form)
- [ ] `app.updateModelContext()` → called on every form change so Claude stays aware of current settings
- [ ] `app.callServerTool("run-noise-filter", {...})` → called when user clicks "Run"
- [ ] Compose all child components

---

### Step 8: UI components (`ui/components/`)
- [ ] **FilterForm.tsx**: Image path input, filter type dropdown, dynamic params (sigma slider for gaussian, kernel size for all, noise variance for wiener), noise injection toggle with type/density
- [ ] **CodePreview.tsx**: Monospace `<pre>` block with basic MATLAB syntax highlighting, auto-updates as form changes
- [ ] **ImageDisplay.tsx**: Side-by-side original / noisy / filtered images from base64
- [ ] **MetricsPanel.tsx**: PSNR (dB), SSIM (0-1), execution time cards with color coding
- [ ] **ConsoleOutput.tsx**: Scrollable terminal-style MATLAB stdout display

---

### Step 9: Styling (`ui/global.css`)
- [ ] Light/dark theme support via CSS variables + `prefers-color-scheme`
- [ ] System font stack
- [ ] MATLAB livescript aesthetic: section borders, monospace code blocks
- [ ] MATLAB-blue accent color (`#0076A8`)
- [ ] Responsive grid for image display

---

### Step 10: Build and test
- [ ] `npm run build` succeeds without errors
- [ ] Start server with `npm run serve:http`, verify `/mcp` endpoint responds
- [ ] Test MATLAB bridge independently: `node -e "import('node-matlab').then(m => m.Matlab.run('disp(1+1)'))"`
- [ ] Open UI in ext-apps test host, verify form renders and code preview updates
- [ ] Click "Run" with a test image, verify MATLAB executes and results display
- [ ] Configure in Claude Desktop, test natural language → UI pre-fill flow

**Claude Desktop config (`claude_desktop_config.json`):**
```json
{
  "mcpServers": {
    "claude-app-mcp": {
      "command": "node",
      "args": ["/Users/bchen/Documents/Projects/claude-app-mcp/dist/main.js", "--stdio"]
    }
  }
}
```

---

## Verification Checklist

- [ ] `npm run build` succeeds without errors
- [ ] HTTP server starts and `/mcp` endpoint responds
- [ ] MATLAB bridge can execute simple commands
- [ ] UI renders in ext-apps test host
- [ ] Form changes update code preview in real-time
- [ ] "Run" button executes MATLAB and displays results
- [ ] Claude Desktop integration works end-to-end
