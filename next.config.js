/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // 在开发阶段忽略构建错误
    ignoreBuildErrors: false,
  },
  eslint: {
    // 在构建期间忽略ESLint错误
    ignoreDuringBuilds: false,
  },
  experimental: {
    // 启用App Router
    appDir: true,
  },
  // 环境变量配置
  env: {
    SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
    SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET,
  },
  // 重写配置，用于处理Shopify OAuth
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
      },
    ];
  },
  // 头部配置
  async headers() {
    return [
      {
        source: '/api/pixel',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=300',
          },
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 