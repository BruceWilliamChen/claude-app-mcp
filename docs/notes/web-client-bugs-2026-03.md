# Note: claude.ai Web Client MCP Bugs (March 2026)

**Date:** 2026-03-23
**Status:** Active bugs, no fix yet

## What Happened

Our MCP server is correctly built and verified working via curl (full MCP handshake, tool calls, resource reads all succeed). However, the claude.ai web client cannot maintain a stable connection.

**Pattern observed in server logs:**
1. Client sends POST → 406 Not Acceptable (wrong Accept header)
2. Client tries OAuth discovery (/.well-known/*) → all 404
3. Client retries → 200 OK, successfully lists tools/resources/prompts
4. Client immediately terminates session with DELETE
5. Repeat

## Known Bugs

- **Issue #99** (claude-ai-mcp): Session IDs broken since March 14, 2026. Stateful servers get 400 errors because session IDs aren't forwarded to subsequent requests. https://github.com/anthropics/claude-ai-mcp/issues/99

- **Issue #83** (claude-ai-mcp): Web client fails to execute `tools/list` after initialization. Shows "Connected" but zero tools. Same servers work on mobile. https://github.com/anthropics/claude-ai-mcp/issues/83

- **Issue #102** (claude-ai-mcp): `ui/update-model-context` payloads silently dropped on web. Iframe renders but context updates never reach model. https://github.com/anthropics/claude-ai-mcp/issues/102

## What Works

- Our test server with a simple `hello` tool DID connect once and execute successfully
- Full MCP handshake works perfectly via curl through ngrok
- Tool calls return correct MATLAB results
- Resource serves correctly (594KB single-file HTML)
- Preview mode (localhost:5174/?preview=true) works perfectly

## Workarounds

- Test with **Claude Desktop** (stdio or HTTP transport)
- Use **preview mode** for development (localhost:5174/?preview=true with Flask on :3000)
- Wait for web client bugs to be fixed
- Monitor the GitHub issues above

## Our Server is Correct

Verified by:
1. curl: initialize → list tools → call run_filter_design → returns coefficients
2. Resource read returns full 594KB HTML
3. Test server `hello` tool worked in web client
4. Architecture matches doudou reference (FastMCP + streamable_http_app)
