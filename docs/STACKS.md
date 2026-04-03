# Stacks Integration Guide

SuperPage supports **Stacks** (Bitcoin L2) as a payment chain alongside EVM networks. This enables accepting **USDCx** (Circle-backed USDC on Stacks) and **sBTC** (1:1 Bitcoin-backed) payments through the x402 protocol.

## Overview

| Property | Stacks Mainnet | Stacks Testnet |
|---|---|---|
| Network ID | `stacks` | `stacks-testnet` |
| Chain ID | `1` | `2147483648` |
| Native Token | STX (6 decimals) | STX (6 decimals) |
| Payment Token | USDCx (6 decimals) | USDCx (6 decimals) |
| API | `https://api.hiro.so` | `https://api.testnet.hiro.so` |
| Explorer | `https://explorer.hiro.so` | `https://explorer.hiro.so/?chain=testnet` |
| Block Time | ~5 seconds (post-Nakamoto) | ~5 seconds |

## Token Contracts

### USDCx (Bridged USDC via Circle xReserve)

| Network | Contract | SIP-010 Asset |
|---|---|---|
| Mainnet | `SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx` | `usdcx-token` |
| Testnet | `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx-v1` | `usdcx-token` |

### sBTC (Bitcoin-backed)

| Network | Contract | SIP-010 Asset |
|---|---|---|
| Mainnet | `SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token` | `sbtc-token` |

## Setup

### 1. Environment Variables

Set these in your `.env` or `openclaw.json`:

```bash
# Switch to Stacks network
X402_CHAIN=stacks           # or stacks-testnet
X402_CURRENCY=USDCx         # or sBTC

# Stacks-compatible private key (hex, no 0x prefix)
WALLET_PRIVATE_KEY=your_stacks_private_key_hex
```

### 2. Backend

The backend automatically detects Stacks networks and routes payment verification through the Hiro API instead of EVM RPC. No code changes needed — just set `X402_CHAIN=stacks`.

Payment verification flow:
1. Backend receives `X-PAYMENT` header with `txId` (Stacks transaction ID)
2. Queries `GET /extended/v1/tx/{txId}` on Hiro API
3. Checks `tx_status === "success"` and validates `fungible_token_transfer` events
4. Confirms recipient address and amount match the payment requirements

### 3. MCP Agent

The MCP client detects Stacks networks and uses `@stacks/transactions` for SIP-010 transfers instead of viem ERC-20.

```bash
# Run MCP agent on Stacks
X402_CHAIN=stacks X402_CURRENCY=USDCx node superpage-x402.js
```

The agent wallet will derive a Stacks address (SP... for mainnet, ST... for testnet) from the same private key. Balance queries use the Hiro API.

### 4. Frontend (Browser Wallet)

For browser-based payments, users connect **Leather** or **Xverse** wallet via `@stacks/connect`:

```typescript
import { request } from '@stacks/connect';
import { Cl, Pc, PostConditionMode } from '@stacks/transactions';

// Request a USDCx transfer from the user's wallet
const response = await request('stx_callContract', {
  contract: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx',
  functionName: 'transfer',
  functionArgs: [
    Cl.uint(1000000),                  // 1 USDCx (6 decimals)
    Cl.principal(senderAddress),       // user's address
    Cl.principal(recipientAddress),    // payment recipient
    Cl.none(),                         // memo
  ],
  postConditions: [
    Pc.principal(senderAddress)
      .willSendEq(1000000n)
      .ft('SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx', 'usdcx-token'),
  ],
  postConditionMode: PostConditionMode.Deny,
  network: 'mainnet',
});
```

## Architecture

### How Stacks Differs from EVM

| Concept | EVM | Stacks |
|---|---|---|
| Token Standard | ERC-20 | SIP-010 |
| Token Address | `0x...` contract address | `principal.contract-name` |
| Transfer Function | `transfer(address, uint256)` | `transfer(uint, principal, principal, optional buff)` |
| Transaction ID | `0x...` hex hash | `0x...` hex hash |
| Wallet Address | `0x...` (20 bytes) | `SP...` / `ST...` (c32check) |
| Smart Contracts | Solidity (EVM bytecode) | Clarity (decidable, interpreted) |
| Verification | RPC `getTransactionReceipt` | Hiro API `GET /extended/v1/tx/{txId}` |
| Block Time | Varies (2s - 12s) | ~5s (post-Nakamoto) |

### Payment Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client   │────>│ Backend  │────>│ Hiro API │
│ (Browser/ │     │ (x402)   │     │          │
│  Agent)   │     │          │     │          │
└──────────┘     └──────────┘     └──────────┘
     │                │                │
     │  1. Request    │                │
     │  resource      │                │
     │───────────────>│                │
     │                │                │
     │  2. 402 +      │                │
     │  payment reqs  │                │
     │<───────────────│                │
     │                │                │
     │  3. SIP-010    │                │
     │  transfer      │                │
     │  (Leather/     │                │
     │   Agent key)   │                │
     │                │                │
     │  4. X-PAYMENT  │                │
     │  header with   │                │
     │  txId          │                │
     │───────────────>│                │
     │                │  5. Verify tx  │
     │                │───────────────>│
     │                │                │
     │                │  6. Confirmed  │
     │                │<───────────────│
     │                │                │
     │  7. Content    │                │
     │<───────────────│                │
```

## SIP-010 Token Standard

SIP-010 is the Stacks fungible token standard (equivalent to ERC-20). The `transfer` function signature in Clarity:

```clarity
(define-public (transfer
  (amount uint)
  (sender principal)
  (recipient principal)
  (memo (optional (buff 34)))
))
```

Key differences from ERC-20:
- **Sender is explicit** — must match `tx-sender` (the signing principal)
- **Memo** — optional 34-byte buffer for payment references
- **Post conditions** — Stacks enforces post conditions that guarantee token amounts, preventing unexpected transfers

## Post Conditions

Stacks has a unique **post condition** system that protects users. When making a SIP-010 transfer, you declare what tokens will be sent. If the actual transfer doesn't match, the transaction is aborted.

```typescript
// "sender will send exactly 1000000 USDCx tokens"
Pc.principal(senderAddress)
  .willSendEq(1000000n)
  .ft('SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx', 'usdcx-token')
```

Combined with `PostConditionMode.Deny`, this prevents any token from being transferred that isn't explicitly declared.

## Getting USDCx

### Mainnet
USDCx is bridged from USDC via [Circle xReserve](https://www.circle.com/blog/usdcx-on-stacks-now-available-via-circle-xreserve). Users can bridge USDC from Ethereum/Base to Stacks through the xReserve portal.

### Testnet
Use the Stacks testnet faucet for STX (gas) and deploy a test USDCx contract, or use the pre-deployed testnet contract.

**STX Faucet:**
```bash
curl -X POST https://api.testnet.hiro.so/extended/v1/faucets/stx \
  -H "Content-Type: application/json" \
  -d '{"address": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"}'
```

## API Reference

### Verify Transaction (Hiro API)

```
GET https://api.hiro.so/extended/v1/tx/{txId}
```

Response includes:
- `tx_status`: `"success"` | `"pending"` | `"abort_by_response"` | `"abort_by_post_condition"`
- `sender_address`: The transaction sender
- `events[]`: Array of events including `fungible_token_transfer`

### Get Balance (Hiro API)

```
GET https://api.hiro.so/extended/v1/address/{address}/balances
```

Returns STX balance and all fungible token balances.

## Troubleshooting

### "Token not configured for network"
Ensure `X402_CURRENCY` matches a token in the chain registry (`USDCx` or `sBTC`).

### "Broadcast failed"
- Check that the sender has enough STX for gas fees (~0.001 STX per transaction)
- Verify the private key format (hex string, no `0x` prefix for Stacks)

### Transaction stuck in "pending"
Stacks blocks are ~5 seconds post-Nakamoto. If a transaction stays pending for >60 seconds, it may have been dropped. Check the explorer or retry.

### Post condition failure
If `tx_status === "abort_by_post_condition"`, the declared post conditions didn't match the actual transfer. This usually means:
- Wrong amount in post condition
- Wrong token contract reference
- Sender doesn't have enough tokens
