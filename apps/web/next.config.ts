import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@nivo/bar', '@nivo/core', '@nivo/heatmap', '@nivo/line', '@nivo/pie'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
    ],
  },
};

export default nextConfig;
