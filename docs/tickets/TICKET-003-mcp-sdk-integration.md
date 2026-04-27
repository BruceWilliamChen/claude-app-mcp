# TICKET-003: Wire MCP App SDK Integration

**Status:** Done
**Created:** 2026-03-22
**Priority:** Medium
**Assignee:** TBD
**Blocked by:** TICKET-001, TICKET-002

## What
Connect the React UI to the MCP server via the App SDK so it works inside a chat host (not just standalone preview mode).

## Why
Preview mode proves the UI works. But the real value is running inside a chat — model pre-fills params, user adjusts, clicks Run, sees results, asks model for advice. This requires the MCP App SDK wiring.

## How

**Create:**
- `ui/hooks/useMcpToolResult.ts` — production hook: receives tool results, manages display mode
- Update `ui/mcp-app.tsx` — preview/production dispatch based on `VITE_PREVIEW_MODE`

**Wire up:**
1. `app.ontoolresult` → parse filter config/results from tool output → update React state
2. `app.callServerTool("run-filter-design", params)` → Run button calls server directly
3. `app.updateModelContext()` → on every param change, push current config to model
4. `app.onhostcontextchanged` → handle inline ↔ fullscreen switching
5. `app.requestDisplayMode()` → inline expand button

**Reference:** See `docs/knowledge/mcp-server-patterns.md` for exact SDK hook patterns.

## Acceptance Criteria
- [ ] `useMcpToolResult` hook created with ontoolresult + onhostcontextchanged
- [ ] Preview mode still works (no regression)
- [ ] Production mode connects to MCP host
- [ ] Run button calls `run-filter-design` tool directly
- [ ] Parameter changes trigger `updateModelContext()`
- [ ] Inline ↔ fullscreen display mode switching works
- [ ] Model can pre-fill form via `configure-filter` tool

## Progress Log
_Updates will be added here as work proceeds_
