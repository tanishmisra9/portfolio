import type { Metadata } from "next";
import { HomeIntroGateProvider } from "@/components/home-intro-gate";
import { Hero } from "@/components/hero/hero";
import { AboutContactSection } from "@/components/sections/about-contact-section";
import { TimelineSection } from "@/components/sections/timeline-section";
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
        {/* ponytail: "now" is the month this page was rendered; a role ending since then shows as running until the next render. */}
        <TimelineSection
          experience={portfolio.experience}
          education={portfolio.education}
          now={new Date().toISOString().slice(0, 7)}
        />
        <SkillsSection
          skills={portfolio.skills}
          certifications={portfolio.certifications}
        />
        <ProjectsSection projects={portfolio.projects} />
        <AboutContactSection bio={portfolio.aboutBio} />
      </main>
    </HomeIntroGateProvider>
  );
}
