# x402 Test Suite (Mantle Sepolia / MNT)

Test scripts for verifying x402 payments on Mantle Sepolia testnet using native MNT tokens.

## Prerequisites

1. **Environment Variables** (in `packages/backend/.env`):
   ```bash
   X402_CHAIN=mantle-sepolia
   X402_CURRENCY=ETH
   X402_RECIPIENT_ADDRESS=0xYourWalletAddressHere
   WALLET_PRIVATE_KEY=0xYourPrivateKeyHere
   ```

2. **MNT Tokens**: Get test MNT from [Mantle Sepolia Faucet](https://faucet.sepolia.mantle.xyz/)

3. **Backend Running**: Start the backend server
   ```bash
   npm run dev
   ```

## Test Scripts

### 1. Update Resource Prices

Update all resources to 0.001 price for testing:

```bash
npm run test:update-prices
```

**Requirements**: `TEST_AUTH_TOKEN` in `.env` (get from wallet auth)

### 2. Test Resource Access

Test accessing a resource with x402 payment:

```bash
npm run test:resource-mnt [resourceId]
```

If no `resourceId` is provided, it will use the first available resource.

**What it does**:
1. Lists/finds resources
2. Attempts access without payment (gets 402)
3. Makes MNT payment on Mantle Sepolia
4. Accesses resource with payment proof
5. Displays content

### 3. Test API Resource

Test accessing an API resource with x402 payment:

```bash
npm run test:api-mnt [resourceId]
```

**What it does**:
1. Finds or creates an API resource
2. Attempts access without payment (gets 402)
3. Makes MNT payment on Mantle Sepolia
4. Accesses API with payment proof
5. Displays API response

### 4. Run All Tests

Run both resource and API tests:

```bash
npm run test:all-mnt
```

## Creating Test Resources

### Via Dashboard

1. Go to http://localhost:3000/dashboard/resources/new
2. Create a resource:
   - **Type**: API, File, or Article
   - **Price**: 0.001
   - **Name**: Test Resource
   - **Description**: Test description
3. For API resources, provide:
   - **API URL**: e.g., `https://api.github.com/users/octocat`
   - **Method**: GET

### Via Script

The `test-api.ts` script can auto-create a test API resource if `TEST_AUTH_TOKEN` is set.

## Expected Output

Successful test output:

```
🚀 x402 RESOURCE TEST (Mantle Sepolia / MNT)
======================================================================

📋 STEP 1: Finding resource...
✅ Found 1 resource(s)
   Using: Test API (abc123)
   Type: api
   Price: $0.001

🔒 STEP 2: Accessing resource without payment...
   Status: 402 Payment Required
✅ Received 402 Payment Required
   Resource: Test API
   Network: mantle-sepolia
   Currency: ETH (MNT native)
   Amount: 1000000000000000 base units

💳 STEP 3: Checking wallet configuration...
✅ Wallet loaded: 0x1234...

💸 STEP 4: Making MNT payment on Mantle Sepolia...
   Network: mantle-sepolia
   Currency: ETH (MNT native)
✅ Payment successful!
   Status: 200 OK

📦 STEP 5: Retrieving resource content...
✅ API Response received:
   { ... }

📊 TEST SUMMARY
======================================================================
✅ Step 1: Find Resource - PASSED
✅ Step 2: Get 402 Payment Required - PASSED
✅ Step 3: Check Wallet - PASSED
✅ Step 4: Make MNT Payment - PASSED
✅ Step 5: Access Content - PASSED

🎉 All tests passed!
```

## Troubleshooting

### Payment Fails

- **Insufficient MNT**: Get more from [faucet](https://faucet.sepolia.mantle.xyz/)
- **Wrong Network**: Ensure `X402_CHAIN=mantle-sepolia` in `.env`
- **Wrong Currency**: Ensure `X402_CURRENCY=ETH` (represents native MNT)

### 402 Not Received

- **Resource not active**: Check resource is active in dashboard
- **Wrong endpoint**: Verify resource ID/slug is correct
- **Backend not running**: Start backend with `npm run dev`

### Transaction Fails

- **Gas fees**: Ensure wallet has enough MNT for gas
- **Network issues**: Check Mantle Sepolia RPC is accessible
- **Invalid recipient**: Verify `X402_RECIPIENT_ADDRESS` is correct

## Notes

- Prices are set to **0.001** for testing (affordable with limited MNT)
- Native MNT payments use **ETH** as the currency type in the system
- All payments are on **Mantle Sepolia testnet** (Chain ID: 5003)
- Transactions require **1 confirmation** by default
