import { describe, it, expect } from "vitest";
import {
  CHAINS,
  CHAIN_IDS,
  TOKEN_ADDRESSES,
  TOKEN_DECIMALS,
  ERC20_ABI,
  getRpcEndpoint,
  getChainId,
  amountToBaseUnits,
  baseUnitsToAmount,
  createETHPaymentTransaction,
  createTokenPaymentTransaction,
  createPaymentTransaction,
} from "../evm-utils";
import { TransactionFailedError } from "../x402-types";

describe("CHAINS constant", () => {
  it("should have all 14 networks", () => {
    expect(Object.keys(CHAINS).length).toBe(14);
  });

  it("should have correct chain IDs", () => {
    expect(CHAINS.mainnet.id).toBe(1);
    expect(CHAINS["base-sepolia"].id).toBe(84532);
    expect(CHAINS["bite-v2-sandbox"].id).toBe(103698795);
  });
});

describe("CHAIN_IDS constant", () => {
  it("should match chain objects", () => {
    for (const [network, chainId] of Object.entries(CHAIN_IDS)) {
      expect(CHAINS[network as keyof typeof CHAINS].id).toBe(chainId);
    }
  });
});

describe("TOKEN_ADDRESSES", () => {
  it("should have USDC for all networks", () => {
    for (const [network, tokens] of Object.entries(TOKEN_ADDRESSES)) {
      expect(tokens.USDC).toBeDefined();
      expect(typeof tokens.USDC).toBe("string");
      expect(tokens.USDC.startsWith("0x")).toBe(true);
    }
  });

  it("should have BITE V2 USDC address", () => {
    expect(TOKEN_ADDRESSES["bite-v2-sandbox"].USDC).toBe(
      "0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8"
    );
  });
});

describe("TOKEN_DECIMALS", () => {
  it("should have correct decimals", () => {
    expect(TOKEN_DECIMALS.ETH).toBe(18);
    expect(TOKEN_DECIMALS.USDC).toBe(6);
    expect(TOKEN_DECIMALS.USDT).toBe(6);
    expect(TOKEN_DECIMALS.DAI).toBe(18);
    expect(TOKEN_DECIMALS.sFUEL).toBe(18);
  });
});

describe("ERC20_ABI", () => {
  it("should have transfer, balanceOf, and allowance", () => {
    expect(ERC20_ABI.length).toBe(3);
    expect(ERC20_ABI[0].name).toBe("transfer");
    expect(ERC20_ABI[1].name).toBe("balanceOf");
    expect(ERC20_ABI[2].name).toBe("allowance");
  });
});

describe("getRpcEndpoint", () => {
  it("should return custom endpoint when provided", () => {
    expect(getRpcEndpoint("mainnet", "https://my-rpc.com")).toBe(
      "https://my-rpc.com"
    );
  });

  it("should return default public RPCs", () => {
    expect(getRpcEndpoint("mainnet")).toBe("https://eth.llamarpc.com");
    expect(getRpcEndpoint("base")).toBe("https://mainnet.base.org");
    expect(getRpcEndpoint("bite-v2-sandbox")).toContain("skalenodes.com");
  });
});

describe("getChainId", () => {
  it("should return correct chain IDs", () => {
    expect(getChainId("mainnet")).toBe(1);
    expect(getChainId("base")).toBe(8453);
    expect(getChainId("bite-v2-sandbox")).toBe(103698795);
  });
});

describe("amountToBaseUnits", () => {
  it("should convert ETH amounts (18 decimals)", () => {
    expect(amountToBaseUnits("1.0", "ETH")).toBe(1000000000000000000n);
    expect(amountToBaseUnits("0.001", "ETH")).toBe(1000000000000000n);
    expect(amountToBaseUnits("0", "ETH")).toBe(0n);
  });

  it("should convert USDC amounts (6 decimals)", () => {
    expect(amountToBaseUnits("1.0", "USDC")).toBe(1000000n);
    expect(amountToBaseUnits("100.50", "USDC")).toBe(100500000n);
    expect(amountToBaseUnits("0.01", "USDC")).toBe(10000n);
  });

  it("should convert DAI amounts (18 decimals)", () => {
    expect(amountToBaseUnits("1.0", "DAI")).toBe(1000000000000000000n);
  });
});

describe("baseUnitsToAmount", () => {
  it("should convert ETH base units to display", () => {
    expect(baseUnitsToAmount(1000000000000000000n, "ETH")).toBe("1");
    expect(baseUnitsToAmount(1000000000000000n, "ETH")).toBe("0.001");
  });

  it("should convert USDC base units to display", () => {
    expect(baseUnitsToAmount(1000000n, "USDC")).toBe("1");
    expect(baseUnitsToAmount(100500000n, "USDC")).toBe("100.5");
  });

  it("should be inverse of amountToBaseUnits", () => {
    expect(baseUnitsToAmount(amountToBaseUnits("1.5", "ETH"), "ETH")).toBe(
      "1.5"
    );
    expect(baseUnitsToAmount(amountToBaseUnits("99.99", "USDC"), "USDC")).toBe(
      "99.99"
    );
  });
});

describe("createETHPaymentTransaction", () => {
  it("should create correct ETH transaction", () => {
    const tx = createETHPaymentTransaction(
      "0x1234567890abcdef1234567890abcdef12345678",
      1000000000000000000n
    );
    expect(tx.to).toBe("0x1234567890abcdef1234567890abcdef12345678");
    expect(tx.value).toBe(1000000000000000000n);
    expect(tx.data).toBeUndefined();
  });
});

describe("createTokenPaymentTransaction", () => {
  it("should create correct ERC20 transfer transaction", () => {
    const tx = createTokenPaymentTransaction(
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "0x1234567890abcdef1234567890abcdef12345678",
      1000000n
    );
    expect(tx.to).toBe("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
    expect(tx.value).toBe(0n);
    expect(tx.data).toBeDefined();
    // Should start with transfer selector 0xa9059cbb
    expect(tx.data.startsWith("0xa9059cbb")).toBe(true);
    // Should contain the recipient address (padded to 32 bytes)
    expect(tx.data).toContain(
      "1234567890abcdef1234567890abcdef12345678".padStart(64, "0")
    );
  });
});

describe("createPaymentTransaction", () => {
  it("should create ETH transaction for ETH token", () => {
    const tx = createPaymentTransaction({
      scheme: "exact",
      network: "mainnet",
      chainId: 1,
      amount: "1000000000000000000",
      token: "ETH",
      recipient: "0x1234567890abcdef1234567890abcdef12345678",
    });
    expect("value" in tx && tx.value).toBe(1000000000000000000n);
  });

  it("should create ETH transaction for sFUEL (BITE V2 native)", () => {
    const tx = createPaymentTransaction({
      scheme: "exact",
      network: "bite-v2-sandbox",
      chainId: 103698795,
      amount: "1000000000000000000",
      token: "sFUEL",
      recipient: "0x1234567890abcdef1234567890abcdef12345678",
    });
    expect("value" in tx && tx.value).toBe(1000000000000000000n);
  });

  it("should create ERC20 transaction for USDC", () => {
    const tx = createPaymentTransaction({
      scheme: "exact",
      network: "mainnet",
      chainId: 1,
      amount: "1000000",
      token: "USDC",
      recipient: "0x1234567890abcdef1234567890abcdef12345678",
    });
    expect(tx.to).toBe("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
    expect("data" in tx).toBe(true);
  });

  it("should throw for unsupported token on network", () => {
    expect(() =>
      createPaymentTransaction({
        scheme: "exact",
        network: "base-sepolia",
        chainId: 84532,
        amount: "1000000",
        token: "DAI",
        recipient: "0x1234567890abcdef1234567890abcdef12345678",
      })
    ).toThrow(TransactionFailedError);
  });

  it("should create MNT transaction for Mantle", () => {
    const tx = createPaymentTransaction({
      scheme: "exact",
      network: "mantle-sepolia",
      chainId: 5003,
      amount: "1000000000000000000",
      token: "MNT",
      recipient: "0x1234567890abcdef1234567890abcdef12345678",
    });
    expect("value" in tx && tx.value).toBe(1000000000000000000n);
  });

  it("should create CRO transaction for Cronos", () => {
    const tx = createPaymentTransaction({
      scheme: "exact",
      network: "cronos",
      chainId: 25,
      amount: "1000000000000000000",
      token: "CRO",
      recipient: "0x1234567890abcdef1234567890abcdef12345678",
    });
    expect("value" in tx && tx.value).toBe(1000000000000000000n);
  });
});
