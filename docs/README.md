# Project Documentation

## Structure

```
docs/
├── plan/        ← What to build, in what order
├── knowledge/   ← Reference patterns, API contracts, architecture
├── notes/       ← Investigation findings, gotchas, decisions
└── tickets/     ← Progress tracking (what/why/how per task)
```

## Folder Purposes

### `plan/`
Implementation plans with phased steps and checklists.
- **When to write**: Before starting a major feature or phase
- **When to update**: When scope or approach changes
- **Format**: Markdown with `- [ ]` checklists

### `knowledge/`
Stable reference material — things that don't change often.
Extracted from reference projects, API docs, architecture decisions.
- **When to write**: After researching a pattern or contract
- **When to update**: When the source changes (new API version, etc.)
- **Format**: Code snippets + explanations, organized by topic

### `notes/`
Investigation findings, gotchas, debugging notes, decision records.
Things discovered while working that others should know.
- **When to write**: When you hit a gotcha, make a non-obvious decision, or investigate a bug
- **When to update**: When the finding is confirmed or invalidated
- **Format**: Free-form, include "what happened" and "what to do about it"

### `tickets/`
Task tracking with what/why/how structure.
See `tickets/README.md` for the template and conventions.
- **When to write**: Before starting work on a discrete task
- **When to update**: As work progresses — update status and progress log
- **Format**: Structured template (see tickets/README.md)

## Current Files

### Plan
- `plan/PLAN.md` — 4-phase implementation plan (server, UI, MCP integration, deploy)

### Knowledge
- `knowledge/mcp-server-patterns.md` — FastMCP, HTTPS, App SDK patterns (from doudou ref)
- `knowledge/filter-design-api.md` — API contract, MATLAB codegen, Plotly charts (from filter app)
- `knowledge/mcp-app-overview.md` — What an MCP app is (original scaffold doc)
- `knowledge/project-architecture.md` — Communication flow, build system (original scaffold doc)

### Notes
- `notes/current-scaffold.md` — What exists vs what needs to change

### Tickets
- `tickets/TICKET-001` — Python MCP server with HTTPS (High)
- `tickets/TICKET-002` — Port filter design UI to React (High)
- `tickets/TICKET-003` — MCP SDK integration (Medium, blocked by 001+002)
- `tickets/TICKET-004` — End-to-end test and deploy (Medium, blocked by 001-003)
