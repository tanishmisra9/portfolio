import type { PortfolioContent } from "@/types/content";

/** The portfolio is edited one block per page (/admin/portfolio/<slug>); each block owns these draft columns. */
export const PORTFOLIO_SECTIONS = [
  { slug: "bio", title: "Bio", description: "Name, hero subtitle and the About bio.", keys: ["name", "heroSubtitle", "aboutBio"] },
  { slug: "experience", title: "Experience", description: "Roles, dates and descriptions.", keys: ["experience"] },
  { slug: "education", title: "Education", description: "Institutions, credentials, coursework.", keys: ["education"] },
  { slug: "skills", title: "Skills", description: "Skill categories and their items.", keys: ["skills"] },
  { slug: "certifications", title: "Certifications", description: "Certificates and course series.", keys: ["certifications"] },
  { slug: "projects", title: "Projects", description: "Projects, links and their order.", keys: ["projects"] },
  { slug: "social", title: "Social", description: "Contact links and the resume.", keys: ["social"] },
] as const satisfies readonly { slug: string; title: string; description: string; keys: readonly (keyof PortfolioContent)[] }[];

export type PortfolioSectionSlug = (typeof PORTFOLIO_SECTIONS)[number]["slug"];

export const findPortfolioSection = (slug: string) => PORTFOLIO_SECTIONS.find((s) => s.slug === slug);
