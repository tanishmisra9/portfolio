import { Hero } from '@/components/hero/hero';
import { PageEnter } from '@/components/page-enter';
import { SiteHeader } from '@/components/site-header';
import { AboutContactSection } from '@/components/sections/about-contact-section';
import { EducationSection } from '@/components/sections/education-section';
import { ExperienceSection } from '@/components/sections/experience-section';
import { ProjectsSection } from '@/components/sections/projects-section';
import { SkillsSection } from '@/components/sections/skills-section';
import { portfolio } from '@/data/portfolio';

export default function HomePage() {
  return (
    <PageEnter>
      <SiteHeader />
      <main>
        <Hero subtitle={portfolio.heroSubtitle} />
        <ExperienceSection entries={portfolio.experience} />
        <EducationSection entries={portfolio.education} />
        <SkillsSection skills={portfolio.skills} certifications={portfolio.certifications} />
        <ProjectsSection projects={portfolio.projects} />
        <AboutContactSection bio={portfolio.aboutBio} social={portfolio.social} />
      </main>
    </PageEnter>
  );
}
