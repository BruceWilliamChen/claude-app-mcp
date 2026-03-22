#!/bin/bash
# Start MCP server in HTTP mode

set -e
cd "$(dirname "$0")/.."

echo "Starting MCP server (HTTP mode on port 8000)..."
python mcp_server.py --http
