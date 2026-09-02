import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/docs",
        destination: "/api/docs/index.html",
      },
    ];
  },
};

export default nextConfig;
