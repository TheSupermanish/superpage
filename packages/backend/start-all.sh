#!/bin/bash

# x402 Solana - Start All Services
# This script starts both the main backend server and payment server

echo "=========================================="
echo "  🚀 Starting x402 Solana Services"
echo "=========================================="
echo ""
echo "Starting:"
echo "  📦 Main Server (port 3001)"
echo "  💳 Payment Server (port 3002)"
echo ""
echo "=========================================="
echo ""

# Run both servers concurrently
pnpm run dev:all
