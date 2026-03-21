# @super-x402/sdk

> TypeScript SDK for implementing HTTP 402 payment flows on Ethereum and EVM chains

**@super-x402/sdk** enables you to build payment-gated APIs and applications using the HTTP 402 Payment Required status code with MNT stablecoin payments on Ethereum.

## Features

- ✅ **HTTP 402 Payment Protocol** - Standard-based payment flow
- ✅ **Ethereum Native** - Built on Ethereum Mainnet with MNT token
- ✅ **TypeScript First** - Fully typed for excellent DX
- ✅ **Express Middleware** - Drop-in server-side protection
- ✅ **Automatic Client** - Client that auto-pays when 402 is returned
- ✅ **On-Chain Verification** - Payment verification via blockchain
- ✅ **Zero Fees** - Peer-to-peer payments, no middleman

## Installation

```bash
npm install @super-x402/sdk viem
# or
pnpm add @super-x402/sdk viem
# or
yarn add @super-x402/sdk viem
```

## Quick Start

### Server-Side (Express)

```typescript
import express from 'express';
import { X402Server } from '@super-x402/sdk';

const app = express();
const x402 = new X402Server({
  network: 'mainnet',
  privateKey: process.env.ETH_PRIVATE_KEY!,
  recipientAddress: process.env.ETH_RECIPIENT_ADDRESS!,
  tokenAddress: '0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF', // MNT
});

// Protected endpoint requiring 1.00 MNT payment
app.get('/api/premium-data', 
  x402.middleware({ price: '1.00' }),
  (req, res) => {
    res.json({ 
      message: 'This is premium data!',
      data: { /* your protected content */ }
    });
  }
);

app.listen(3001);
```

### Client-Side

```typescript
import { X402Client } from '@super-x402/sdk';

const client = new X402Client({
  network: 'mainnet',
  privateKey: process.env.WALLET_PRIVATE_KEY!,
  tokenAddress: '0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF', // MNT
});

// Automatically pays if 402 is returned
const response = await client.fetch('https://api.example.com/premium-data');
const data = await response.json();

console.log(data);
```

## API Reference

### X402Server

Server-side payment verification and middleware.

#### Constructor

```typescript
const x402 = new X402Server({
  network: 'mainnet' | 'sepolia',
  privateKey: string,              // Your private key
  recipientAddress: string,        // Address to receive payments
  tokenAddress: string,            // MNT token address
  rpcUrl?: string,                 // Optional custom RPC
});
```

#### Middleware

```typescript
app.get('/api/resource',
  x402.middleware({
    price: '1.00',                 // Price in MNT (e.g., "1.00" = $1.00)
    metadata?: {                   // Optional metadata
      resourceId: 'xyz',
      description: 'Premium data access'
    }
  }),
  (req, res) => {
    // Payment verified, serve content
    res.json({ data: 'protected content' });
  }
);
```

#### Verify Payment

```typescript
const result = await x402.verifyPayment({
  txHash: '0xabc123...',           // Transaction hash
  expectedAmount: '1000000',       // Amount in token decimals
  expectedRecipient: '0x...',      // Your recipient address
});

if (result.verified) {
  console.log('Payment verified!');
  console.log('From:', result.from);
  console.log('Amount:', result.amount);
}
```

### X402Client

Client-side automatic payment handling.

#### Constructor

```typescript
const client = new X402Client({
  network: 'mainnet' | 'sepolia',
  privateKey: string,              // Your wallet private key
  tokenAddress: string,            // MNT token address
  rpcUrl?: string,                 // Optional custom RPC
  maxAutoPayment?: string,         // Max auto-payment (default: "10.00")
});
```

#### Fetch

```typescript
// Automatically handles 402 responses and makes payment
const response = await client.fetch(
  'https://api.example.com/resource',
  {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  }
);

const data = await response.json();
```

#### Manual Payment

```typescript
const txHash = await client.pay({
  to: '0x...',                     // Recipient address
  amount: '1.00',                  // Amount in MNT
});

console.log('Payment sent:', txHash);
```

#### Check Balance

```typescript
const balance = await client.getBalance();
console.log('MNT Balance:', balance.formatted);
console.log('ETH Balance:', balance.eth);
```

## TypeScript Types

```typescript
interface X402ServerConfig {
  network: 'mainnet' | 'sepolia';
  privateKey: string;
  recipientAddress: string;
  tokenAddress: string;
  rpcUrl?: string;
}

interface X402ClientConfig {
  network: 'mainnet' | 'sepolia';
  privateKey: string;
  tokenAddress: string;
  rpcUrl?: string;
  maxAutoPayment?: string;
}

interface MiddlewareOptions {
  price: string;
  metadata?: Record<string, any>;
  onPaymentVerified?: (payment: PaymentVerification) => Promise<void>;
}

interface PaymentVerification {
  verified: boolean;
  txHash: string;
  from: string;
  to: string;
  amount: string;
  blockNumber: number;
}
```

## MNT Token

**MNT** is a USD-backed stablecoin on Ethereum (1 MNT = $1.00 USD)

| Property | Value |
|----------|-------|
| Contract | `0x8ccedbAe4916b79da7F3F612EfB2EB93A2bFD6cF` |
| Decimals | 6 |
| Network | Ethereum Mainnet |
| Peg | 1 MNT = 1 USD |

## Examples

### Dynamic Pricing

```typescript
app.get('/api/dynamic',
  async (req, res, next) => {
    const price = calculatePrice(req.user);
    await x402.middleware({ price })(req, res, next);
  },
  (req, res) => {
    res.json({ data: 'content' });
  }
);
```

### Payment Callbacks

```typescript
app.get('/api/resource',
  x402.middleware({ 
    price: '1.00',
    onPaymentVerified: async (payment) => {
      await db.orders.create({
        txHash: payment.txHash,
        from: payment.from,
        amount: payment.amount,
      });
    }
  }),
  (req, res) => {
    res.json({ data: 'content' });
  }
);
```

### Error Handling

```typescript
try {
  const response = await client.fetch('https://api.example.com/resource');
  const data = await response.json();
} catch (error) {
  if (error.code === 'INSUFFICIENT_BALANCE') {
    console.error('Not enough MNT tokens');
  } else if (error.code === 'PAYMENT_REQUIRED') {
    console.error('Payment required but auto-pay disabled');
  } else if (error.code === 'PAYMENT_FAILED') {
    console.error('Payment transaction failed');
  }
}
```

## Contributing

Contributions are welcome! Please open an issue or PR.

## License

MIT

## Links

- [Documentation](https://x402.io/docs)
- [HTTP 402 Payment Required](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402)
- [viem](https://viem.sh)
