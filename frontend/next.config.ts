import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/auth/:path*',
        destination: `${process.env.BACKEND_URL ?? 'http://localhost:8000'}/auth/:path*`,
      },
      {
        source: '/api/kubernetes/:path*',
        destination: `${process.env.BACKEND_URL ?? 'http://localhost:8000'}/api/kubernetes/:path*`,
      },
      {
        source: '/api/ai/:path*',
        destination: `${process.env.BACKEND_URL ?? 'http://localhost:8000'}/api/ai/:path*`,
      },
      {
        source: '/api/watch/:path*',
        destination: `${process.env.BACKEND_URL ?? 'http://localhost:8000'}/api/watch/:path*`,
      },
      {
        source: '/api/permissions/:path*',
        destination: `${process.env.BACKEND_URL ?? 'http://localhost:8000'}/api/permissions/:path*`,
      },
      {
        source: '/api/cluster/:path*',
        destination: `${process.env.BACKEND_URL ?? 'http://localhost:8000'}/api/cluster/:path*`,
      },
      {
        source: '/api/resources/:path*',
        destination: `${process.env.BACKEND_URL ?? 'http://localhost:8000'}/api/resources/:path*`,
      },
      {
        source: '/api/health/backend',
        destination: `${process.env.BACKEND_URL ?? 'http://localhost:8000'}/health`,
      },
    ];
  },
};

export default nextConfig;
