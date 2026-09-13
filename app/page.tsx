import type { Metadata } from "next";
import { HomeIntroGateProvider } from "@/components/home-intro-gate";
import { Hero } from "@/components/hero/hero";
import { AboutContactSection } from "@/components/sections/about-contact-section";
import { EducationSection } from "@/components/sections/education-section";
import { ExperienceSection } from "@/components/sections/experience-section";
import { ProjectsSection } from "@/components/sections/projects-section";
import { SkillsSection } from "@/components/sections/skills-section";
import { getPublishedData } from "@/lib/site-content";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getPublishedData();
  const homeDescription = data.portfolio.heroSubtitle.replace(/\n+/g, " ");
  return {
    title: "Tanish Misra",
    description: homeDescription,
    openGraph: {
      title: "Tanish Misra",
      description: homeDescription,
      url: "https://tanishmisra.com",
      type: "website",
    },
  };
}

export default async function HomePage() {
  const { portfolio } = await getPublishedData();
  return (
    <HomeIntroGateProvider>
      <main id="main-content" tabIndex={-1} className="relative z-0 isolate">
        <Hero subtitle={portfolio.heroSubtitle} />
        <ExperienceSection entries={portfolio.experience} />
        <EducationSection entries={portfolio.education} />
        <SkillsSection
          skills={portfolio.skills}
          certifications={portfolio.certifications}
        />
        <ProjectsSection projects={portfolio.projects} />
        <AboutContactSection bio={portfolio.aboutBio} social={portfolio.social} />
      </main>
    </HomeIntroGateProvider>
  );
}
