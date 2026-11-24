import { ChevronLeft } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";

/**
 * The back button on content pages (posts, albums). It hangs in the page gutter, left-aligned with the header's "TM"
 * logo rather than with the narrower content column. The wrapper is as wide as the header's own container
 * (`w-screen max-w-6xl`, centred on the viewport with left-1/2 + -translate-x-1/2, whatever column it sits in) and gets
 * the header's `pl-6`, so the two share one left edge at every width.
 */
export function BackButton({ href, label }: { href: string; label: string }) {
  return (
    <div className="relative left-1/2 mb-10 w-screen max-w-6xl -translate-x-1/2 pl-6 md:mb-12">
      <IconButton href={href} icon={<ChevronLeft />} label={label} />
    </div>
  );
}
