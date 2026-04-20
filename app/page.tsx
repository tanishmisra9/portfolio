import { HomeIntroGateProvider } from "@/components/home-intro-gate";
import { Hero } from "@/components/hero/hero";
import { AboutContactSection } from "@/components/sections/about-contact-section";
import { EducationSection } from "@/components/sections/education-section";
import { ExperienceSection } from "@/components/sections/experience-section";
import { ProjectsSection } from "@/components/sections/projects-section";
import { SkillsSection } from "@/components/sections/skills-section";
import { portfolio } from "@/data/portfolio";

export default function HomePage() {
  return (
    <HomeIntroGateProvider>
      <main className="relative z-0 isolate">
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
