# TICKET-001: Build Python MCP Server with HTTPS

**Status:** Open
**Created:** 2026-03-22
**Priority:** High
**Assignee:** TBD

## What
Create a Python FastMCP server that replaces the Node.js scaffold. The server registers two tools and one resource, connects to MATLAB via `matlab.engine`, and supports HTTPS via ngrok.

## Why
The Node.js server can't easily connect to MATLAB. Python has `matlab.engine` which we already proved works in the filter design app (`matlab-mcp-app/server.py`). FastMCP (from doudou reference) gives us clean tool/resource registration and HTTPS via Starlette + uvicorn.

## How

**Files to create:**
- `mcp_server.py` — FastMCP server with tools, resource, HTTP mode
- `matlab_bridge.py` — MATLAB engine wrapper (init, execute, status)
- `codegen.py` — Generate MATLAB filter design code from params
- `requirements.txt` — mcp>=1.26.0, uvicorn>=0.40.0, matlabengine
- `scripts/start.sh` — Start server in HTTP mode
- `scripts/start-ngrok.sh` — Start server + ngrok tunnel

**Key patterns (see `docs/NOTES-mcp-server-patterns.md`):**
- FastMCP route fix: recreate `/mcp` route with explicit methods
- CORS middleware for cross-origin access
- Session manager lifespan
- Resource MIME type: `text/html;profile=mcp-app`

**Tools:**
1. `configure-filter` (model + app visible) — opens UI, pre-fills params
2. `run-filter-design` (app only) — executes MATLAB, returns data

**Reference code:**
- MATLAB bridge: `D:\projects\matlab-mcp-app\server.py` (init_engine, build_design_code)
- MCP patterns: `D:\projects\mcp-app-doudou-ref\mcp_server.py`

## Acceptance Criteria
- [ ] `python mcp_server.py --http` starts on port 8000
- [ ] `/mcp` endpoint responds to MCP protocol
- [ ] MATLAB engine connects and returns version/PID
- [ ] `configure-filter` tool registered with UI resource link
- [ ] `run-filter-design` tool executes MATLAB and returns filter data
- [ ] Resource serves built HTML file
- [ ] ngrok tunnel exposes HTTPS endpoint
- [ ] Butterworth lowpass filter design returns correct coefficients

## Progress Log
_Updates will be added here as work proceeds_
