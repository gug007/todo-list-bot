import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '/todo-list-bot',
  assetPrefix: '/todo-list-bot',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
