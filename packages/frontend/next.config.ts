import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@initia/interwovenkit-react',
    'cosmjs-types',
    '@cosmjs/amino',
    '@cosmjs/stargate',
    '@cosmjs/proto-signing',
    '@cosmjs/math',
  ],
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
      {
        protocol: 'https',
        hostname: '*.myshopify.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
  },
  devIndicators: false,
  serverExternalPackages: [
    '@walletconnect/keyvaluestorage',
    '@walletconnect/core',
    '@walletconnect/sign-client',
    '@walletconnect/universal-provider',
    '@walletconnect/ethereum-provider',
  ],
  turbopack: {
    root: path.resolve(__dirname, '../../'),
  },
};

export default nextConfig;
