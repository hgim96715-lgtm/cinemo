import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@cinemo/shared',
    '@nivo/bar',
    '@nivo/core',
    '@nivo/heatmap',
    '@nivo/line',
    '@nivo/pie',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
      {
        protocol: 'http',
        hostname: 'file.koreafilm.or.kr',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'file.koreafilm.or.kr',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
