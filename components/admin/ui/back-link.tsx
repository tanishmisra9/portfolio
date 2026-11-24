import { ChevronLeft } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";

/** Admin back button: in the content column, on the same left edge as the heading and the header logo. (The public BackButton hangs in the page gutter and assumes a centred column.) */
export function AdminBackLink({ href, label }: { href: string; label: string }) {
  return (
    <div className="mb-8">
      <IconButton href={href} icon={<ChevronLeft />} label={label} />
    </div>
  );
}
