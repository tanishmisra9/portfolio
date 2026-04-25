import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Photography — Tanish Misra",
  description: "TANISHTAKESPICS — photography by Tanish Misra.",
};

export default function PhotosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
