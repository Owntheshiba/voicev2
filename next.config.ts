import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "*.modal.host",
    "*.trycloudflare.com",
  ],
  serverExternalPackages: ['@farcaster/miniapp-sdk', '@farcaster/miniapp-core'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('@farcaster/miniapp-sdk');
    }
    return config;
  },
};

export default nextConfig;
