#!/bin/bash
# Start MCP server + ngrok for HTTPS access

set -e
cd "$(dirname "$0")/.."

echo "Starting MCP server (HTTP mode on port 8000)..."
python mcp_server.py --http &
MCP_PID=$!
sleep 3

if ! kill -0 $MCP_PID 2>/dev/null; then
  echo "MCP server failed to start."
  exit 1
fi

echo "MCP server running (PID: $MCP_PID)"
echo "Starting ngrok..."
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Replace with your ngrok domain if you have one:
# ngrok http --domain=your-domain.ngrok.dev 8000 --host-header=localhost:8000
ngrok http 8000

# Cleanup on exit
kill $MCP_PID 2>/dev/null
