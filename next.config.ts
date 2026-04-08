import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    /* Avoid dev-only SegmentViewNode / client-manifest errors with App Router + RSC */
    devtoolSegmentExplorer: false,
  },
};

export default nextConfig;
