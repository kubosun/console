import type { NextConfig } from 'next';

const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8000';

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      { source: '/auth/:path*', destination: `${backendUrl}/auth/:path*` },
      { source: '/api/kubernetes/:path*', destination: `${backendUrl}/api/kubernetes/:path*` },
      { source: '/api/ai/:path*', destination: `${backendUrl}/api/ai/:path*` },
      { source: '/api/watch/:path*', destination: `${backendUrl}/api/watch/:path*` },
      { source: '/api/permissions/:path*', destination: `${backendUrl}/api/permissions/:path*` },
      { source: '/api/cluster/:path*', destination: `${backendUrl}/api/cluster/:path*` },
      { source: '/api/helm/:path*', destination: `${backendUrl}/api/helm/:path*` },
      { source: '/api/resources/:path*', destination: `${backendUrl}/api/resources/:path*` },
      { source: '/api/monitoring/:path*', destination: `${backendUrl}/api/monitoring/:path*` },
      { source: '/api/events/:path*', destination: `${backendUrl}/api/events/:path*` },
      { source: '/api/health/backend', destination: `${backendUrl}/health` },
    ];
  },
};

export default nextConfig;
