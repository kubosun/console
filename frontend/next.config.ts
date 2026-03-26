import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/kubernetes/:path*',
        destination: `${process.env.BACKEND_URL ?? 'http://localhost:8000'}/api/kubernetes/:path*`,
      },
      {
        source: '/api/ai/:path*',
        destination: `${process.env.BACKEND_URL ?? 'http://localhost:8000'}/api/ai/:path*`,
      },
      {
        source: '/api/health/backend',
        destination: `${process.env.BACKEND_URL ?? 'http://localhost:8000'}/health`,
      },
    ];
  },
};

export default nextConfig;
