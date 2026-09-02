import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse', '@elastic/elasticsearch'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
