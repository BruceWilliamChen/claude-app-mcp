# Filter Design MCP App

An MCP app that lets users design digital filters inside a chat interface.
MATLAB runs remotely, computes filter data, and the UI renders interactive Plotly plots client-side.

## Project Documentation System

All project docs live in `docs/`. Read `docs/README.md` for the full index.

| Folder | Purpose | When to Read |
|--------|---------|-------------|
| `docs/plan/` | Implementation plans, phased steps, checklists | Before starting work — know the plan |
| `docs/knowledge/` | Reference patterns, API contracts, architecture | When implementing — exact code to follow |
| `docs/notes/` | Gotchas, investigation findings, decisions | When stuck or making a decision |
| `docs/tickets/` | Task tracking (what/why/how + acceptance criteria) | To find what to work on next |

### How to use docs

- **Starting a new feature?** Check `plan/` for the overall plan, then find or create a ticket in `tickets/`.
- **Implementing something?** Check `knowledge/` for exact patterns and API contracts to follow.
- **Hit a gotcha?** Write it in `notes/` so the next person doesn't hit it again.
- **Done with a task?** Update the ticket status and check off acceptance criteria.
- **Found a bug?** Create a ticket with Bug Details (observed/expected/reproduce).

### Doc maintenance rules

- Keep `tickets/` up to date — update status and progress log as you work.
- Don't duplicate — if it's in `knowledge/`, don't repeat it in a ticket. Reference it.
- Notes are cheap — when in doubt, write a note. Better to have it than not.
- Plans can change — update `plan/` when scope or approach changes. Don't leave stale plans.

## Architecture

- **Server**: Python FastMCP (`mcp_server.py`) — not Node.js
- **MATLAB**: `matlab.engine` for Python — runs remotely
- **HTTPS**: ngrok tunnel (no stdio needed for remote MATLAB)
- **UI**: React + Vite, bundled to single HTML via `vite-plugin-singlefile`
- **Plots**: Plotly.js rendered client-side from numeric data (no MATLAB figures transferred)
- **Client config**: `{ "url": "https://your-domain.ngrok.dev/mcp" }` — no command/args

## Key References

- Filter design API contract: `docs/knowledge/filter-design-api.md`
- MCP server patterns (HTTPS, tools, resources): `docs/knowledge/mcp-server-patterns.md`
- Original filter design app (UI source): `D:\projects\matlab-mcp-app`
- MCP app reference (doudou): `D:\projects\mcp-app-doudou-ref`
