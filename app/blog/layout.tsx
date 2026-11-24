import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thoughts — Tanish Misra",
  description: "Writing from Tanish Misra.",
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
