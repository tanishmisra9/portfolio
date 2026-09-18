import Link from "next/link";
import { SECTION_GHOST_HEADING_CLASSES } from "@/components/ui/class-constants";

const SECTIONS = [
  { href: "/admin/portfolio", title: "Portfolio", description: "Bio, experience, education, skills, certifications, projects, social." },
  { href: "/admin/photos", title: "Photos", description: "Collections, uploads, captions, ordering." },
  { href: "/admin/quotes", title: "Quotes", description: "The quote cloud on /quotes." },
  { href: "/admin/blog", title: "Blog", description: "Posts, drafts, and markdown import." },
  { href: "/admin/radio", title: "Radio", description: "Race-radio clips for the boxbox easter egg." },
];

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className={SECTION_GHOST_HEADING_CLASSES}>ADMIN</h1>
      <div className="grid gap-5 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-md border border-border bg-surface p-8 backdrop-blur-md transition-colors hover:border-hover-outline"
          >
            <p className="font-display text-xl font-semibold text-fg">{section.title}</p>
            <p className="mt-2 text-muted">{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
