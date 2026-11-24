import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getDraftPortfolio } from "@/lib/admin/actions";
import { PORTFOLIO_SECTIONS } from "@/lib/admin/portfolio-sections";
import { AdminHeading } from "@/components/admin/ui/panel";

/** What each block holds right now, as one short line on its card. */
function summary(slug: string, d: Awaited<ReturnType<typeof getDraftPortfolio>>): string {
  if (!d) return "Empty";
  const n = (a: unknown[], word: string) => `${a.length} ${word}${a.length === 1 ? "" : "s"}`;
  switch (slug) {
    case "bio":
      return d.aboutBio.trim() ? `${d.aboutBio.trim().split(/\s+/).length} words` : "Empty";
    case "experience": return n(d.experience, "entry").replace("entrys", "entries");
    case "education": return n(d.education, "entry").replace("entrys", "entries");
    case "skills": return n(d.skills, "category").replace("categorys", "categories");
    case "certifications": return n(d.certifications, "certification");
    case "projects": return n(d.projects, "project");
    case "social": return n(d.social, "link");
    default: return "";
  }
}

export default async function PortfolioAdminPage() {
  const draft = await getDraftPortfolio();

  return (
    <div className="max-w-5xl">
      <AdminHeading title="Portfolio" subtitle="Each block is edited on its own page and saved on its own." />
      <div className="grid gap-5 sm:grid-cols-2">
        {PORTFOLIO_SECTIONS.map((s) => (
          <Link
            key={s.slug}
            href={`/admin/portfolio/${s.slug}`}
            className="group relative block border border-border bg-surface p-6 backdrop-blur-md transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-fg hover:shadow-[5px_5px_0_rgb(var(--fg-rgb)/0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70 motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0"
          >
            <ArrowUpRight aria-hidden className="absolute right-5 top-5 size-5 text-fg opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100" strokeWidth={1.75} />
            <p className="font-display text-xl font-bold text-fg">{s.title}</p>
            <p className="mt-1 text-muted">{s.description}</p>
            <p className="mt-4 text-sm text-dim">{summary(s.slug, draft)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
