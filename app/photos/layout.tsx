import type { Metadata } from "next";
import { NYCAssetsWarmup } from "@/components/photos/nyc-assets-warmup";

export const metadata: Metadata = {
  title: "Photography — Tanish Misra",
  description: "TANISHTAKESPICS — photography by Tanish Misra.",
};

export default function PhotosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link
        rel="preload"
        href="/fonts/itc-american-typewriter-medium.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link rel="preload" href="/heart.png" as="image" />
      <NYCAssetsWarmup />
      {children}
    </>
  );
}
