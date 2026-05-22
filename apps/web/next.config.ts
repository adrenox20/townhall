import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  typedRoutes: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
