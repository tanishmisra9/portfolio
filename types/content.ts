export type ExperienceEntry = {
  id: string;
  org: string;
  role: string;
  date: string;
  tags: string[];
  description?: string;
};

export type EducationEntry = {
  id: string;
  institution: string;
  credential: string;
  date: string;
  /** Each inner array is one flex-wrap row of pills (same styling as skills). */
  pillRows?: string[][];
};

export type ProjectEntry = {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  githubUrl: string;
  /** Small label shown at the top-left of the card; hidden when empty/whitespace. */
  pill?: string;
};

export type SkillCategory = {
  id: string;
  category: string;
  items: string[];
};

export type CertificationEntry = {
  id: string;
  /** Kept for aria-labels; not displayed directly. */
  issuer: string;
  title: string;
  credentialUrl: string;
  /** Top-left label(s); one or more pills. */
  pills?: string[];
  /** Bottom tag row, like techStack in projects. */
  skills?: string[];
};

export type SocialLink = {
  label: string;
  href: string;
  display: string;
};

export type PortfolioContent = {
  name: string;
  heroSubtitle: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillCategory[];
  certifications: CertificationEntry[];
  projects: ProjectEntry[];
  aboutBio: string;
  social: SocialLink[];
};
