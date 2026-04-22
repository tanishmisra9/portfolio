import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    /* Avoid dev-only SegmentViewNode / client-manifest errors with App Router + RSC */
    devtoolSegmentExplorer: false,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 896, 1080, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 448, 600],
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },
};

export default nextConfig;
