import { getDraftPortfolio } from "@/lib/admin/actions";
import { PortfolioForm } from "./portfolio-form";

export default async function PortfolioAdminPage() {
  const draft = await getDraftPortfolio();

  return (
    <div className="max-w-3xl">
      <h1 className="mb-4 font-display text-xl">Portfolio</h1>
      <PortfolioForm
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
