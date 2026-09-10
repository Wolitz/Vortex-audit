import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/opengraph-image.png",
        destination: "/opengraph-image",
      },
      {
        source: "/favicon.ico",
        destination: "/icon",
      },
      {
        source: "/apple-touch-icon.png",
        destination: "/apple-icon",
      },
    ];
  },
};

export default nextConfig;
