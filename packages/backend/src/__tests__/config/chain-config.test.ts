import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  CHAIN_REGISTRY,
  TOKEN_DECIMALS,
  DEFAULT_NETWORK,
  DEFAULT_ASSET,
  SPAY_SCHEME,
  isValidNetwork,
  getChainMetadata,
  getChainId,
  isNativeToken,
  getTokenDecimalsForNetwork,
  getTokenAddressForNetwork,
  getAvailableTokens,
  getDefaultPaymentToken,
  getCurrencyDisplayName,
  getSupportedNetworks,
  getChainConfig,
  getNetwork,
  getCurrency,
  getTokenAddress,
  getTokenDecimals,
  isTestnet,
  getCurrencyDisplay,
  getTxUrl,
  type NetworkId,
} from "../../config/chain-config.js";

describe("Module constants", () => {
  it("should export DEFAULT_NETWORK as a valid network", () => {
    expect(isValidNetwork(DEFAULT_NETWORK)).toBe(true);
  });

  it("should export DEFAULT_ASSET", () => {
    expect(DEFAULT_ASSET).toBe("USDC");
  });

  it("should export SPAY_SCHEME", () => {
    expect(SPAY_SCHEME).toBe("spay");
  });
});

describe("CHAIN_REGISTRY", () => {
  it("should have 14 networks", () => {
    expect(Object.keys(CHAIN_REGISTRY).length).toBe(14);
  });

  it("should have BITE V2 Sandbox", () => {
    const bite = CHAIN_REGISTRY["bite-v2-sandbox"];
    expect(bite.chainId).toBe(103698795);
    expect(bite.name).toBe("BITE V2 Sandbox 2");
    expect(bite.isTestnet).toBe(true);
    expect(bite.tokens.USDC?.address).toBe(
      "0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8"
    );
  });
});

describe("isValidNetwork", () => {
  it("should return true for valid networks", () => {
    expect(isValidNetwork("mainnet")).toBe(true);
    expect(isValidNetwork("bite-v2-sandbox")).toBe(true);
  });

  it("should return false for invalid networks", () => {
    expect(isValidNetwork("bogus")).toBe(false);
    expect(isValidNetwork("")).toBe(false);
  });
});

describe("getChainMetadata", () => {
  it("should return metadata for valid network", () => {
    const meta = getChainMetadata("mainnet");
    expect(meta.chainId).toBe(1);
    expect(meta.name).toBe("Ethereum Mainnet");
  });

  it("should throw for invalid network", () => {
    expect(() => getChainMetadata("bogus" as NetworkId)).toThrow();
  });
});

describe("getChainId", () => {
  it("should return chain IDs", () => {
    expect(getChainId("mainnet")).toBe(1);
    expect(getChainId("bite-v2-sandbox")).toBe(103698795);
  });
});

describe("isNativeToken", () => {
  it("should identify native tokens", () => {
    expect(isNativeToken("ETH")).toBe(true);
    expect(isNativeToken("CRO")).toBe(true);
    expect(isNativeToken("MNT")).toBe(true);
    expect(isNativeToken("sFUEL")).toBe(true);
  });

  it("should identify non-native tokens", () => {
    expect(isNativeToken("USDC")).toBe(false);
    expect(isNativeToken("USDT")).toBe(false);
  });
});

describe("getTokenDecimalsForNetwork", () => {
  it("should return native token decimals", () => {
    expect(getTokenDecimalsForNetwork("mainnet", "ETH")).toBe(18);
  });

  it("should return ERC20 decimals", () => {
    expect(getTokenDecimalsForNetwork("mainnet", "USDC")).toBe(6);
  });
});

describe("getTokenAddressForNetwork", () => {
  it("should return null for native tokens", () => {
    expect(getTokenAddressForNetwork("mainnet", "ETH")).toBeNull();
  });

  it("should return address for ERC20", () => {
    const addr = getTokenAddressForNetwork("mainnet", "USDC");
    expect(addr).toBeTruthy();
    expect(addr!.startsWith("0x")).toBe(true);
  });
});

describe("getAvailableTokens", () => {
  it("should include native and ERC20 tokens", () => {
    const tokens = getAvailableTokens("bite-v2-sandbox");
    expect(tokens).toContain("sFUEL");
    expect(tokens).toContain("USDC");
  });
});

describe("getDefaultPaymentToken", () => {
  it("should return defaults", () => {
    expect(getDefaultPaymentToken("mainnet")).toBe("USDC");
    expect(getDefaultPaymentToken("mantle-sepolia")).toBe("MNT");
  });
});

describe("getCurrencyDisplayName", () => {
  it("should use displayCurrency for special networks", () => {
    expect(getCurrencyDisplayName("bite-v2-sandbox", "USDC")).toBe("USDC");
    expect(getCurrencyDisplayName("cronos-testnet", "USDC")).toBe("devUSDC.e");
  });

  it("should return symbol for normal networks", () => {
    expect(getCurrencyDisplayName("mainnet", "USDC")).toBe("USDC");
  });
});

describe("getSupportedNetworks", () => {
  it("should return all networks", () => {
    const networks = getSupportedNetworks();
    expect(networks.length).toBe(14);
    expect(networks).toContain("mainnet");
    expect(networks).toContain("bite-v2-sandbox");
  });
});

describe("getChainConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should default to bite-v2-sandbox", () => {
    delete process.env.X402_CHAIN;
    delete process.env.X402_CURRENCY;
    delete process.env.X402_TOKEN_ADDRESS;
    delete process.env.X402_TOKEN_DECIMALS;
    const config = getChainConfig();
    expect(config.network).toBe("bite-v2-sandbox");
    expect(config.chainId).toBe(103698795);
    expect(config.isTestnet).toBe(true);
  });

  it("should respect X402_CHAIN env var", () => {
    process.env.X402_CHAIN = "mainnet";
    const config = getChainConfig();
    expect(config.network).toBe("mainnet");
    expect(config.chainId).toBe(1);
  });

  it("should fall back for unknown network", () => {
    process.env.X402_CHAIN = "nonexistent";
    const config = getChainConfig();
    expect(config.network).toBe("bite-v2-sandbox");
  });

  it("should respect X402_CURRENCY env var", () => {
    process.env.X402_CURRENCY = "ETH";
    const config = getChainConfig();
    expect(config.currency).toBe("ETH");
  });

  it("should respect X402_TOKEN_DECIMALS env var", () => {
    process.env.X402_TOKEN_DECIMALS = "8";
    const config = getChainConfig();
    expect(config.tokenDecimals).toBe(8);
  });
});

describe("Convenience functions", () => {
  it("getTxUrl should build explorer URL", () => {
    const url = getTxUrl("0xabc");
    expect(url).toContain("/tx/0xabc");
  });
});

describe("TOKEN_DECIMALS", () => {
  it("should have all token decimals", () => {
    expect(TOKEN_DECIMALS.ETH).toBe(18);
    expect(TOKEN_DECIMALS.USDC).toBe(6);
    expect(TOKEN_DECIMALS.USDT).toBe(6);
    expect(TOKEN_DECIMALS.DAI).toBe(18);
    expect(TOKEN_DECIMALS.sFUEL).toBe(18);
  });
});
