# TICKET-001: Clean Up stdio Leftovers

**Status:** Open
**Created:** 2026-03-22
**Priority:** Low
**Assignee:** Doudou

## Context

The project was scaffolded with a Node.js MCP server that supports both stdio and HTTP transports. Since our architecture uses HTTPS (ngrok) for remote MATLAB access, the stdio transport and the entire Node.js server are no longer needed. The Python FastMCP server replaces them.

There are also references to stdio mode scattered in docs and config that should be cleaned up for clarity.

## Scope

### Files to Delete

**Node.js server (replaced by Python FastMCP):**
- `server/main.ts` — Node.js entry point with stdio + HTTP transports
- `server/server.ts` — Node.js tool/resource registration
- `server/tsconfig.json` — TypeScript config for server

### Files to Modify

**package.json:**
- Remove server-only dependencies: `express`, `cors`, `zod`, `@types/cors`, `@types/express`
- Remove server scripts: `build:server`, `serve:http`, `serve:stdio`
- Update `build` script to only build UI

**docs/PLAN.md:**
- Remove any remaining stdio references
- Ensure all examples use `"url"` config, not `"command"` + `"args"`

**README.md:**
- Update to reflect Python server, not Node.js
- Remove stdio setup instructions

### Out of Scope

- Building the Python MCP server (separate task)
- UI changes
- Feature changes

## Acceptance Criteria

- [ ] `server/` directory deleted (all 3 files)
- [ ] Server-only npm deps removed from package.json
- [ ] Server-related npm scripts removed
- [ ] No references to `--stdio` flag in docs
- [ ] No `"command"` / `"args"` MCP config examples in docs
- [ ] `npm run build` still succeeds (UI only)
- [ ] `npm install` has no unnecessary packages

## Notes

The stdio pattern (`"command": "python", "args": [...]`) is useful when the client runs the server locally. We don't need it because our server runs remotely with MATLAB, and clients connect via HTTPS URL:

```json
{
  "mcpServers": {
    "filter-design": {
      "url": "https://your-domain.ngrok.dev/mcp"
    }
  }
}
```
