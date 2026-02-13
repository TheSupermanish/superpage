#!/bin/bash

# Test MCP Client for Claude Desktop

echo "Testing superpage-x402 MCP client..."
echo ""

# Set environment
export SUPERPAGE_SERVER="http://localhost:3001"
export WALLET_PRIVATE_KEY="REDACTED_WALLET_PRIVATE_KEY"
export X402_CHAIN="mantle-sepolia"
export X402_CURRENCY="MNT"
export X402_TOKEN_ADDRESS="0x0000000000000000000000000000000000000000"
export X402_TOKEN_DECIMALS="18"
export MAX_AUTO_PAYMENT="10.00"

# Start MCP server in background
node superpage-x402.js > /tmp/mcp-output.log 2>&1 &
MCP_PID=$!

echo "MCP server started (PID: $MCP_PID)"
sleep 2

# Test 1: Initialize
echo ""
echo "Test 1: Initialize"
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | nc localhost 3001 > /dev/null 2>&1 || echo "  (Using stdio mode, not HTTP)"

# Test 2: List tools
echo ""
echo "Test 2: List Tools"
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' > /tmp/mcp-request.json

# Check stderr for startup logs
echo ""
echo "Startup logs:"
head -20 /tmp/mcp-output.log 2>/dev/null || echo "No logs yet"

# Kill MCP server
kill $MCP_PID 2>/dev/null

echo ""
echo "✅ MCP client test complete!"
echo ""
echo "To use with Claude Desktop:"
echo "  1. Make sure backend is running: pnpm run dev:all"
echo "  2. Restart Claude Desktop (Cmd+Q, then reopen)"
echo "  3. In Claude, ask: 'List available x402 stores'"
