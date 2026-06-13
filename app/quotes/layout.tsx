import type { Metadata } from "next";
import { playfair } from "./fonts";

export const metadata: Metadata = {
  title: "Quotes — Tanish Misra",
  description: "A generative typographic cloud of collected quotes.",
};

export default function QuotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // `contents` keeps this wrapper out of layout while scoping the serif font
  // variable to this route — the custom property still inherits to the cloud.
  return <div className={`contents ${playfair.variable}`}>{children}</div>;
}
