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
    qualities: [68, 72, 75],
  },
  /* lib/image-dimensions.ts reads a dynamically-built path under public/blog/ at build
   * time, which makes Next's file tracer conservatively bundle the whole directory into
   * the [slug] fallback function — blowing past Vercel's 250MB function size limit. These
   * images are static assets served directly, never needed inside the function itself. */
  outputFileTracingExcludes: {
    "/blog/\\[slug\\]": ["./public/blog/**/*"],
  },
};

export default nextConfig;
