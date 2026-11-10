import type { Metadata } from "next";
import { F1Intro } from "@/components/f1/f1-intro";

export const metadata: Metadata = {
  title: "F1 — Tanish Misra",
  description: "Everything F1, in one place.",
};

export default function F1Page() {
  return (
    <main id="main-content" tabIndex={-1} className="relative z-0 isolate outline-none">
      <F1Intro />
    </main>
  );
}
