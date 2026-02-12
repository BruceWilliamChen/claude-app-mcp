# Scaffold an MCP App Project

---

```
name: Scaffold an MCP App Project
description: How to set up the directory structure, configuration files, and dependencies for a Model Context Protocol (MCP) app that runs inside Claude. This covers a Node.js + TypeScript server with a React frontend bundled as a single-file HTML resource.
```

---

## Directory Structure

```
project-root/
├── server/              # MCP server (Node.js + TypeScript)
│   ├── server.ts        # Tool + resource registration
│   ├── main.ts          # Entry point (stdio + HTTP transports)
│   └── tsconfig.json    # Server-specific TS config (compiles to dist/)
├── ui/                  # Frontend (React + TypeScript)
│   ├── mcp-app.html     # Vite HTML entry point
│   ├── mcp-app.tsx      # React root component
│   ├── global.css       # Base styles
│   ├── types.ts         # Shared types
│   └── components/      # React components
├── dist/                # Build output (gitignored)
├── package.json
├── tsconfig.json        # Client TS config (noEmit — Vite handles compilation)
└── vite.config.ts
```

**Why two tsconfig files?**
- The root `tsconfig.json` is for the UI. It uses `noEmit` because Vite handles the actual compilation and bundling.
- `server/tsconfig.json` compiles the server code to `dist/` with Node.js-appropriate settings.

**Why `dist/` is gitignored?**
- It contains build artifacts that can be regenerated. Only source files belong in version control.

---

## package.json

Key sections:

```json
{
  "name": "claude-app-mcp",
  "type": "module",
  "scripts": {
    "build:ui": "vite build",
    "build:server": "tsc -p server/tsconfig.json",
    "build": "npm run build:ui && npm run build:server",
    "dev:ui": "vite",
    "serve:http": "tsx server/main.ts",
    "serve:stdio": "node dist/main.js --stdio"
  }
}
```

**Why `"type": "module"`?**
- Enables native ES modules (`import`/`export`) in Node.js. The MCP SDK and most modern packages expect this.

### Dependencies

| Package | Purpose |
|---------|---------|
| `@modelcontextprotocol/sdk` | Core MCP server SDK — tools, resources, transports |
| `@modelcontextprotocol/ext-apps` | MCP Apps extension — `registerAppTool`, `registerAppResource`, and React hooks |
| `react`, `react-dom` | UI framework |
| `zod` | Schema validation for tool inputs |
| `express`, `cors` | HTTP transport server |

### Dev Dependencies

| Package | Purpose |
|---------|---------|
| `typescript` | Type checking and server compilation |
| `vite` | Frontend bundler (fast, HMR in dev) |
| `@vitejs/plugin-react` | React JSX/refresh support for Vite |
| `vite-plugin-singlefile` | Bundles entire UI into one HTML file (required for MCP resource serving) |
| `tsx` | Run TypeScript directly in Node.js (for dev server) |
| `concurrently` | Run multiple npm scripts in parallel |
| `@types/react`, `@types/react-dom`, `@types/express`, `@types/cors` | Type definitions |

---

## TypeScript Configs

### Root `tsconfig.json` (Client)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["ui"]
}
```

- `noEmit: true` — Vite does the actual compilation; TypeScript is only used for type checking.
- `moduleResolution: "bundler"` — tells TS to resolve imports the way Vite does.
- `jsx: "react-jsx"` — enables JSX transform without needing `import React` in every file.

### Server `server/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "../dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["."]
}
```

- `module: "NodeNext"` — matches Node.js ES module resolution with `"type": "module"` in package.json.
- `outDir: "../dist"` — compiled JS goes to project root's `dist/` folder.

---

## Vite Config

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  root: "ui",
  build: {
    outDir: "../dist/ui",
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, "ui/mcp-app.html"),
    },
  },
});
```

- `root: "ui"` — tells Vite the frontend source lives in `ui/`.
- `viteSingleFile()` — inlines all JS/CSS into one HTML file. This is critical because MCP serves the UI as a single resource.
- `outDir: "../dist/ui"` — built HTML goes alongside compiled server code.

---

## HTML Entry Point

```html
<!-- ui/mcp-app.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Noise Filter Configurator</title>
  <link rel="stylesheet" href="./global.css" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./mcp-app.tsx"></script>
</body>
</html>
```

- Vite resolves the `.tsx` import and bundles it.
- `<div id="root">` is the React mount point.

---

## Install Steps

```bash
cd project-root
npm install
```

Verify with:
```bash
npx tsc --noEmit          # type check client
npx tsc -p server/tsconfig.json --noEmit  # type check server
npx vite build             # test UI build
```

---

## Gotchas

- **`vite-plugin-singlefile`** must come after `@vitejs/plugin-react` in the plugins array.
- **`"type": "module"`** in package.json means all `.js` files are treated as ES modules. Use `.cjs` extension if you ever need CommonJS.
- **Don't put server code in the root `tsconfig.json` include path** — it has different module resolution needs than the UI code.
- **`@modelcontextprotocol/ext-apps`** — this is the MCP Apps UI SDK (React hooks, `registerAppTool`, etc.). It's a newer/separate package from `@modelcontextprotocol/sdk`. Don't install it during scaffolding — add it when you actually wire up the server and UI, so you can verify it exists on npm and pin the right version.
- **Run `npm install` from the project directory** — if your shell doesn't have `node`/`npm` on PATH by default (e.g. nvm users on macOS), make sure to `source ~/.bashrc` or equivalent first. npm resolves `package.json` relative to the working directory; running from the wrong dir can install to the wrong place.
- **Typo in Vite HTML entry**: the skill doc originally said "Vite resolses" — it's "resolves". Small thing, but skill docs should be accurate since they're reference material.
- **Custom HTML entry point**: If your HTML file is not named `index.html`, Vite won't find it by default. You must set `build.rollupOptions.input` with an absolute path: `resolve(__dirname, "ui/mcp-app.html")`. Relative paths won't resolve correctly when `root` is set to a subdirectory.
- **`emptyOutDir: true`**: Needed when `outDir` is outside the Vite `root`. Without it, Vite warns and refuses to clean the output directory.
- **Placeholder source files are needed to verify the build**: `tsc --noEmit` will fail with "No inputs found" if there are no `.ts`/`.tsx` files yet — that's expected. But Vite will fail hard if the HTML references a `.tsx` that doesn't exist. Create minimal placeholder files (`mcp-app.tsx`, `global.css`) so you can verify the full build pipeline works during scaffolding.
