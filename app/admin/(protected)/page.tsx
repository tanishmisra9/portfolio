import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AdminHeading } from "@/components/admin/ui/panel";
import { ADMIN_SECTIONS } from "@/components/admin/sections";

export default function AdminDashboardPage() {
  return (
    <div>
      <AdminHeading title="Admin" subtitle="Edits save as drafts. Nothing goes live until you publish." />
      <div className="grid gap-5 sm:grid-cols-2">
        {ADMIN_SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group relative block border border-border bg-surface p-8 backdrop-blur-md transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-fg hover:shadow-[5px_5px_0_rgb(var(--fg-rgb)/0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70 motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
          >
            <ArrowUpRight aria-hidden className="absolute right-6 top-6 size-6 text-fg opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100" strokeWidth={1.75} />
            <p className="font-display text-xl font-bold text-fg">{section.title}</p>
            <p className="mt-2 text-muted">{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
