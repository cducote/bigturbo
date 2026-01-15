import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  poweredByHeader: false,

  // Typescript and ESLint configuration
  typescript: {
    // Fail builds on type errors
    ignoreBuildErrors: false,
  },
  eslint: {
    // Fail builds on lint errors
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
