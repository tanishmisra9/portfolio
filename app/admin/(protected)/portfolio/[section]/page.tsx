import { notFound } from "next/navigation";
import { getDraftPortfolio } from "@/lib/admin/actions";
import { findPortfolioSection, type PortfolioSectionSlug } from "@/lib/admin/portfolio-sections";
import { AdminHeading } from "@/components/admin/ui/panel";
import { AdminBackLink } from "@/components/admin/ui/back-link";
import { PortfolioSectionForm } from "../portfolio-form";

export default async function PortfolioSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const def = findPortfolioSection(section);
  if (!def) notFound();
  const draft = await getDraftPortfolio();

  return (
    <div className="max-w-5xl">
      <AdminBackLink href="/admin/portfolio" label="Back to portfolio" />
      <AdminHeading title={def.title} subtitle={def.description} />
      <PortfolioSectionForm
        section={def.slug as PortfolioSectionSlug}
        initial={
          draft ?? {
            name: "",
            heroSubtitle: "",
            aboutBio: "",
            experience: [],
            education: [],
            skills: [],
            certifications: [],
            projects: [],
            social: [],
          }
        }
      />
    </div>
  );
}
