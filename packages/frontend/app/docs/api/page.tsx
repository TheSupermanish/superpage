"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Server } from "lucide-react";

export default function APIDocsPage() {
  return (
    <div>
      <div>
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-6">
            <Server className="h-4 w-4" />
            REST API
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            REST API Reference
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Complete reference for x402 HTTP endpoints
          </p>
        </div>

        <div className="space-y-8">
          {/* Base URL */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-2xl">Base URL</CardTitle>
            </CardHeader>
            <CardContent>
              <code className="block px-6 py-4 bg-muted rounded-xl text-primary font-mono border border-border">
                http://localhost:3001
              </code>
              <p className="text-muted-foreground text-sm mt-4">
                Replace with your production URL when deploying
              </p>
            </CardContent>
          </Card>

          {/* Authentication */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-2xl">Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>x402 uses wallet-based authentication. Include your JWT token in the Authorization header:</p>
              <pre className="bg-muted p-6 rounded-xl overflow-x-auto text-sm border border-border">
{`Authorization: Bearer YOUR_JWT_TOKEN`}
              </pre>
            </CardContent>
          </Card>

          {/* Resources Endpoints */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-2xl">Resources</CardTitle>
              <CardDescription className="text-muted-foreground">
                Manage APIs, files, and articles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* GET Resources */}
              <div className="border-l-4 border-primary pl-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-600 rounded font-bold text-sm">GET</span>
                  <code className="text-foreground font-mono">/x402/resources</code>
                </div>
                <p className="text-muted-foreground mb-3">List all public resources</p>
                <p className="text-sm text-muted-foreground mb-2">Query Parameters:</p>
                <ul className="text-sm text-muted-foreground ml-4 space-y-1">
                  <li>• <code className="bg-muted px-2 py-1 rounded">type</code> - Filter by type (API, File, Article)</li>
                  <li>• <code className="bg-muted px-2 py-1 rounded">creatorId</code> - Filter by creator</li>
                </ul>
              </div>

              {/* POST Resource */}
              <div className="border-l-4 border-green-500 pl-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-green-500/20 text-green-600 rounded font-bold text-sm">POST</span>
                  <code className="text-foreground font-mono">/api/resources</code>
                </div>
                <p className="text-muted-foreground mb-3">Create a new resource (requires auth)</p>
                <p className="text-sm text-muted-foreground mb-2">Request Body:</p>
                <pre className="bg-muted p-4 rounded-xl overflow-x-auto text-sm border border-border text-foreground">
{`{
  "title": "Weather API",
  "description": "Real-time weather data",
  "type": "API",
  "price": "0.10",
  "url": "https://api.example.com/weather",
  "isPublic": true
}`}
                </pre>
              </div>

              {/* GET Resource by ID */}
              <div className="border-l-4 border-primary pl-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-600 rounded font-bold text-sm">GET</span>
                  <code className="text-foreground font-mono">/x402/resource/:id</code>
                </div>
                <p className="text-muted-foreground mb-3">Access a resource (auto-pays with HTTP 402)</p>
                <p className="text-sm text-muted-foreground mb-2">Headers:</p>
                <ul className="text-sm text-muted-foreground ml-4 space-y-1">
                  <li>• <code className="bg-muted px-2 py-1 rounded">X-Payment-TxHash</code> - Ethereum transaction hash (after payment)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Stores Endpoints */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-2xl">Shopify Stores</CardTitle>
              <CardDescription className="text-muted-foreground">
                Manage Shopify store integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-l-4 border-primary pl-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-600 rounded font-bold text-sm">GET</span>
                  <code className="text-foreground font-mono">/x402/stores</code>
                </div>
                <p className="text-muted-foreground">List all connected stores</p>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-600 rounded font-bold text-sm">GET</span>
                  <code className="text-foreground font-mono">/x402/stores/:storeId/products</code>
                </div>
                <p className="text-muted-foreground">List products in a store</p>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-green-500/20 text-green-600 rounded font-bold text-sm">POST</span>
                  <code className="text-foreground font-mono">/x402/eth/store/:storeId/product/:productId</code>
                </div>
                <p className="text-muted-foreground mb-3">Purchase a product with USDC (HTTP 402 enabled)</p>
                <p className="text-sm text-muted-foreground mb-2">Request Body:</p>
                <pre className="bg-muted p-4 rounded-xl overflow-x-auto text-sm border border-border text-foreground">
{`{
  "email": "customer@example.com",
  "shipping": {
    "firstName": "John",
    "lastName": "Doe",
    "address1": "123 Main St",
    "city": "New York",
    "province": "NY",
    "zip": "10001",
    "country": "US",
    "phone": "+1234567890"
  }
}`}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Orders Endpoints */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-2xl">Orders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-l-4 border-primary pl-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-600 rounded font-bold text-sm">GET</span>
                  <code className="text-foreground font-mono">/api/orders</code>
                </div>
                <p className="text-muted-foreground">List your orders (requires auth)</p>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-600 rounded font-bold text-sm">GET</span>
                  <code className="text-foreground font-mono">/api/orders/:id</code>
                </div>
                <p className="text-muted-foreground">Get order details</p>
              </div>
            </CardContent>
          </Card>

          {/* Authentication Endpoints */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-2xl">Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-l-4 border-green-500 pl-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-green-500/20 text-green-600 rounded font-bold text-sm">POST</span>
                  <code className="text-foreground font-mono">/api/auth/nonce</code>
                </div>
                <p className="text-muted-foreground mb-3">Get nonce for wallet signature</p>
                <pre className="bg-muted p-4 rounded-xl overflow-x-auto text-sm border border-border text-foreground">
{`{
  "walletAddress": "0x..."
}`}
                </pre>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-green-500/20 text-green-600 rounded font-bold text-sm">POST</span>
                  <code className="text-foreground font-mono">/api/auth/verify</code>
                </div>
                <p className="text-muted-foreground mb-3">Verify signature and get JWT</p>
                <pre className="bg-muted p-4 rounded-xl overflow-x-auto text-sm border border-border text-foreground">
{`{
  "walletAddress": "0x...",
  "signature": "0x...",
  "nonce": "abc123"
}`}
                </pre>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-600 rounded font-bold text-sm">GET</span>
                  <code className="text-foreground font-mono">/api/auth/me</code>
                </div>
                <p className="text-muted-foreground">Get current user profile (requires auth)</p>
              </div>
            </CardContent>
          </Card>

          {/* Error Responses */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-2xl">Error Responses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold text-foreground mb-2">HTTP 402 Payment Required</p>
                <pre className="bg-muted p-4 rounded-xl overflow-x-auto text-sm border border-border text-foreground">
{`{
  "error": "Payment required",
  "payment": {
    "amount": "1000000",
    "token": "USDC",
    "tokenAddress": "0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8",
    "recipient": "0x...",
    "network": "mainnet"
  }
}`}
                </pre>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-2">HTTP 401 Unauthorized</p>
                <pre className="bg-muted p-4 rounded-xl overflow-x-auto text-sm border border-border text-foreground">
{`{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}`}
                </pre>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-2">HTTP 404 Not Found</p>
                <pre className="bg-muted p-4 rounded-xl overflow-x-auto text-sm border border-border text-foreground">
{`{
  "error": "Resource not found"
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
