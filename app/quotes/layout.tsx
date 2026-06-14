import type { Metadata } from "next";
import { bricolage, familjen, instrumentSerif, playfair } from "./fonts";

export const metadata: Metadata = {
  title: "Quotes — Tanish Misra",
  description: "A generative typographic cloud of collected quotes.",
};

export default function QuotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // `contents` keeps this wrapper out of layout while scoping the route-only font
  // variables here — the custom properties still inherit to the cloud.
  return (
    <div
      className={`contents ${playfair.variable} ${instrumentSerif.variable} ${bricolage.variable} ${familjen.variable}`}
    >
      {children}
    </div>
  );
}
