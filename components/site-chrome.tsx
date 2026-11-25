"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { RadioKeystrokeListener } from "@/components/easter-eggs/radio-keystroke-listener";

/** The public nav + radio easter egg don't belong on /admin — it has its own minimal header. */
export function SiteChrome({
  radioSamples,
  radioGains,
  radioTriggers,
}: {
  radioSamples: string[];
  radioGains: Record<string, number>;
  radioTriggers: string[];
}) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <RadioKeystrokeListener samples={radioSamples} gains={radioGains} triggers={radioTriggers} />
      <SiteHeader />
    </>
  );
}
