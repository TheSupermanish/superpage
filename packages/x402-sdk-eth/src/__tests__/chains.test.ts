import { describe, it, expect } from "vitest";
import {
  CHAIN_REGISTRY,
  getSupportedNetworks,
  isValidNetwork,
  getChainMetadata,
  getChainId,
  getViemChain,
  getRpcUrl,
  getExplorerUrl,
  getTxExplorerUrl,
  isNativeToken,
  getTokenDecimals,
  getTokenAddress,
  getAvailableTokens,
  getDefaultPaymentToken,
  getCurrencyDisplayName,
  getNetworkByChainId,
  getTestnetNetworks,
  getMainnetNetworks,
  buildChainsRecord,
  buildChainIdsRecord,
  buildTokenAddressesRecord,
  CHAINS,
  CHAIN_IDS,
  TOKEN_ADDRESSES,
  TOKEN_DECIMALS,
  mantleSepolia,
  cronos,
  cronosTestnet,
  biteV2Sandbox,
  type NetworkId,
} from "../chains";

describe("Chain Registry", () => {
  it("should have all expected networks", () => {
    const networks = getSupportedNetworks();
    expect(networks).toContain("mainnet");
    expect(networks).toContain("sepolia");
    expect(networks).toContain("base");
    expect(networks).toContain("base-sepolia");
    expect(networks).toContain("polygon");
    expect(networks).toContain("polygon-amoy");
    expect(networks).toContain("arbitrum");
    expect(networks).toContain("arbitrum-sepolia");
    expect(networks).toContain("optimism");
    expect(networks).toContain("optimism-sepolia");
    expect(networks).toContain("mantle-sepolia");
    expect(networks).toContain("cronos");
    expect(networks).toContain("cronos-testnet");
    expect(networks).toContain("bite-v2-sandbox");
    expect(networks.length).toBe(14);
  });

  it("should have consistent chainId across registry", () => {
    for (const [id, meta] of Object.entries(CHAIN_REGISTRY)) {
      expect(meta.viemChain.id).toBe(meta.chainId);
      expect(meta.id).toBe(id);
    }
  });

  it("should have valid RPC URLs for all chains", () => {
    for (const meta of Object.values(CHAIN_REGISTRY)) {
      expect(meta.rpcUrl).toBeTruthy();
      expect(meta.rpcUrl.startsWith("https://")).toBe(true);
    }
  });

  it("should have valid explorer URLs for all chains", () => {
    for (const meta of Object.values(CHAIN_REGISTRY)) {
      expect(meta.explorerUrl).toBeTruthy();
      expect(meta.explorerUrl.startsWith("https://")).toBe(true);
    }
  });
});

describe("isValidNetwork", () => {
  it("should return true for valid networks", () => {
    expect(isValidNetwork("mainnet")).toBe(true);
    expect(isValidNetwork("base-sepolia")).toBe(true);
    expect(isValidNetwork("bite-v2-sandbox")).toBe(true);
  });

  it("should return false for invalid networks", () => {
    expect(isValidNetwork("invalid")).toBe(false);
    expect(isValidNetwork("")).toBe(false);
    expect(isValidNetwork("ethereum")).toBe(false);
  });
});

describe("getChainMetadata", () => {
  it("should return metadata for valid networks", () => {
    const meta = getChainMetadata("mainnet");
    expect(meta.chainId).toBe(1);
    expect(meta.name).toBe("Ethereum Mainnet");
    expect(meta.isTestnet).toBe(false);
  });

  it("should return correct BITE V2 metadata", () => {
    const meta = getChainMetadata("bite-v2-sandbox");
    expect(meta.chainId).toBe(103698795);
    expect(meta.isTestnet).toBe(true);
    expect(meta.nativeToken.symbol).toBe("sFUEL");
    expect(meta.displayCurrency).toBe("USDC");
  });

  it("should throw for invalid network", () => {
    expect(() => getChainMetadata("invalid" as NetworkId)).toThrow(
      "Unsupported network: invalid"
    );
  });
});

describe("getChainId", () => {
  it("should return correct chain IDs", () => {
    expect(getChainId("mainnet")).toBe(1);
    expect(getChainId("sepolia")).toBe(11155111);
    expect(getChainId("base")).toBe(8453);
    expect(getChainId("polygon")).toBe(137);
    expect(getChainId("arbitrum")).toBe(42161);
    expect(getChainId("optimism")).toBe(10);
    expect(getChainId("mantle-sepolia")).toBe(5003);
    expect(getChainId("cronos")).toBe(25);
    expect(getChainId("bite-v2-sandbox")).toBe(103698795);
  });
});

describe("getViemChain", () => {
  it("should return viem chain objects", () => {
    const chain = getViemChain("mainnet");
    expect(chain.id).toBe(1);
    expect(chain.name).toBe("Ethereum");
  });

  it("should return custom chain for BITE V2", () => {
    const chain = getViemChain("bite-v2-sandbox");
    expect(chain.id).toBe(103698795);
  });
});

describe("getRpcUrl / getExplorerUrl", () => {
  it("should return URLs", () => {
    expect(getRpcUrl("mainnet")).toBe("https://eth.llamarpc.com");
    expect(getExplorerUrl("mainnet")).toBe("https://etherscan.io");
  });
});

describe("getTxExplorerUrl", () => {
  it("should build correct transaction URLs", () => {
    const url = getTxExplorerUrl("mainnet", "0xabc123");
    expect(url).toBe("https://etherscan.io/tx/0xabc123");
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
    expect(isNativeToken("DAI")).toBe(false);
  });
});

describe("getTokenDecimals", () => {
  it("should return 18 for native tokens", () => {
    expect(getTokenDecimals("mainnet", "ETH")).toBe(18);
    expect(getTokenDecimals("mantle-sepolia", "MNT")).toBe(18);
    expect(getTokenDecimals("cronos", "CRO")).toBe(18);
    expect(getTokenDecimals("bite-v2-sandbox", "sFUEL")).toBe(18);
  });

  it("should return 6 for USDC/USDT", () => {
    expect(getTokenDecimals("mainnet", "USDC")).toBe(6);
    expect(getTokenDecimals("mainnet", "USDT")).toBe(6);
    expect(getTokenDecimals("base", "USDC")).toBe(6);
  });

  it("should return 18 for DAI", () => {
    expect(getTokenDecimals("mainnet", "DAI")).toBe(18);
  });
});

describe("getTokenAddress", () => {
  it("should return null for native tokens", () => {
    expect(getTokenAddress("mainnet", "ETH")).toBeNull();
    expect(getTokenAddress("cronos", "CRO")).toBeNull();
    expect(getTokenAddress("mantle-sepolia", "MNT")).toBeNull();
  });

  it("should return addresses for ERC20 tokens", () => {
    const usdcAddress = getTokenAddress("mainnet", "USDC");
    expect(usdcAddress).toBe("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
  });

  it("should return BITE V2 USDC address", () => {
    const addr = getTokenAddress("bite-v2-sandbox", "USDC");
    expect(addr).toBe("0xc4083B1E81ceb461Ccef3FDa8A9F24F0d764B6D8");
  });
});

describe("getAvailableTokens", () => {
  it("should include native token and ERC20s", () => {
    const tokens = getAvailableTokens("mainnet");
    expect(tokens).toContain("ETH");
    expect(tokens).toContain("USDC");
    expect(tokens).toContain("USDT");
    expect(tokens).toContain("DAI");
  });

  it("should include sFUEL for BITE V2", () => {
    const tokens = getAvailableTokens("bite-v2-sandbox");
    expect(tokens).toContain("sFUEL");
    expect(tokens).toContain("USDC");
  });
});

describe("getDefaultPaymentToken", () => {
  it("should return default tokens", () => {
    expect(getDefaultPaymentToken("mainnet")).toBe("USDC");
    expect(getDefaultPaymentToken("sepolia")).toBe("ETH");
    expect(getDefaultPaymentToken("mantle-sepolia")).toBe("MNT");
    expect(getDefaultPaymentToken("bite-v2-sandbox")).toBe("USDC");
  });
});

describe("getCurrencyDisplayName", () => {
  it("should return display name for special currencies", () => {
    expect(getCurrencyDisplayName("cronos-testnet", "USDC")).toBe("devUSDC.e");
    expect(getCurrencyDisplayName("bite-v2-sandbox", "USDC")).toBe("USDC");
  });

  it("should return symbol for normal currencies", () => {
    expect(getCurrencyDisplayName("mainnet", "USDC")).toBe("USDC");
    expect(getCurrencyDisplayName("mainnet", "ETH")).toBe("ETH");
  });
});

describe("getNetworkByChainId", () => {
  it("should find network by chain ID", () => {
    expect(getNetworkByChainId(1)).toBe("mainnet");
    expect(getNetworkByChainId(8453)).toBe("base");
    expect(getNetworkByChainId(103698795)).toBe("bite-v2-sandbox");
  });

  it("should return null for unknown chain ID", () => {
    expect(getNetworkByChainId(99999)).toBeNull();
  });
});

describe("getTestnetNetworks / getMainnetNetworks", () => {
  it("should separate testnets and mainnets", () => {
    const testnets = getTestnetNetworks();
    const mainnets = getMainnetNetworks();

    expect(testnets).toContain("sepolia");
    expect(testnets).toContain("bite-v2-sandbox");
    expect(testnets).not.toContain("mainnet");

    expect(mainnets).toContain("mainnet");
    expect(mainnets).toContain("base");
    expect(mainnets).not.toContain("sepolia");

    // All networks should be accounted for
    expect(testnets.length + mainnets.length).toBe(getSupportedNetworks().length);
  });
});

describe("Legacy compatibility builders", () => {
  it("buildChainsRecord should match CHAINS", () => {
    const built = buildChainsRecord();
    expect(built.mainnet.id).toBe(CHAINS.mainnet.id);
    expect(Object.keys(built).length).toBe(Object.keys(CHAINS).length);
  });

  it("buildChainIdsRecord should match CHAIN_IDS", () => {
    const built = buildChainIdsRecord();
    expect(built.mainnet).toBe(1);
    expect(built).toEqual(CHAIN_IDS);
  });

  it("buildTokenAddressesRecord should match TOKEN_ADDRESSES", () => {
    const built = buildTokenAddressesRecord();
    expect(built.mainnet.USDC).toBe(TOKEN_ADDRESSES.mainnet.USDC);
  });
});

describe("TOKEN_DECIMALS", () => {
  it("should have correct decimal values", () => {
    expect(TOKEN_DECIMALS.ETH).toBe(18);
    expect(TOKEN_DECIMALS.USDC).toBe(6);
    expect(TOKEN_DECIMALS.USDT).toBe(6);
    expect(TOKEN_DECIMALS.DAI).toBe(18);
    expect(TOKEN_DECIMALS.CRO).toBe(18);
    expect(TOKEN_DECIMALS.MNT).toBe(18);
    expect(TOKEN_DECIMALS.sFUEL).toBe(18);
  });
});

describe("Custom chain definitions", () => {
  it("mantleSepolia should be correct", () => {
    expect(mantleSepolia.id).toBe(5003);
    expect(mantleSepolia.name).toBe("Mantle Sepolia");
  });

  it("cronos should be correct", () => {
    expect(cronos.id).toBe(25);
    expect(cronos.name).toBe("Cronos");
  });

  it("cronosTestnet should be correct", () => {
    expect(cronosTestnet.id).toBe(338);
  });

  it("biteV2Sandbox should be correct", () => {
    expect(biteV2Sandbox.id).toBe(103698795);
    expect(biteV2Sandbox.name).toBe("BITE V2 Sandbox 2");
  });
});
