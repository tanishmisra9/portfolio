/**
 * `endDate: null` = a single-point date (e.g. a graduation date), `"present"` = ongoing,
 * anything else = a closed range ending that month. Avoids an `isPresent` boolean that
 * could disagree with `endDate` (e.g. present=true with an end date still set).
 */
export type StartEndDate = {
  startDate: string; // "YYYY-MM"
  endDate: string | "present" | null; // "YYYY-MM" | "present" | null
};

export type ExperienceEntry = StartEndDate & {
  id: string;
  org: string;
  role: string;
  tags: string[];
  description?: string;
};

export type EducationEntry = StartEndDate & {
  id: string;
  institution: string;
  credential: string;
  /** Clubs/activities row — plain pills. */
  activities?: string[];
  /** Coursework row — rendered with the glassy CoursePill hover treatment. */
  coursework?: string[];
};

export type ProjectLink = {
  id: string;
  label: string;
  url: string;
  icon?: 'external' | 'newspaper';
};

export type ProjectEntry = {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  githubUrl: string;
  links?: ProjectLink[];
  /** Label(s) shown at the top-left of the card; hidden when empty. */
  pills?: string[];
  /** Kept in the admin but left out of the published snapshot. */
  hidden?: boolean;
};

export type SkillCategory = {
  id: string;
  category: string;
  items: string[];
};

export type CertificationCourse = {
  id: string;
  title: string;
  credentialUrl: string;
};

export type CertificationEntry = {
  id: string;
  /** Kept for aria-labels; not displayed directly. */
  issuer: string;
  title: string;
  /** Omit when `courses` is set — a program card links out per-course instead. */
  credentialUrl?: string;
  /** Top-left label(s); one or more pills. */
  pills?: string[];
  /** Bottom tag row, like techStack in projects. */
  skills?: string[];
  /** When set, renders as one expandable "program" card enclosing these courses, instead of one card per course. */
  courses?: CertificationCourse[];
};

export type SocialLink = {
  id: string;
  label: string;
  href: string;
  display: string;
  /** Hover tooltip on the contact icon; falls back to `label` when empty. */
  tooltip?: string;
  /** Manual icon override — see components/social-icon.tsx's ICON_OPTIONS. Falls back to label-matching when unset. */
  icon?: string;
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

// ---- Photos ----
// Shared with data/photos.ts (the migration script's seed data) and the published-snapshot
// shape in lib/admin/publish.ts — kept here, not in data/photos.ts, so nothing that only
// needs the type has to import a file whose seed-data instructions say to delete it.

export type Photo = {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  duetWith?: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
  };
};

export type PhotoCollection = {
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  photos: Photo[];
};

export type RandomPhotoCandidate = {
  src: string;
  alt: string;
  caption?: string;
  collectionTitle: string;
  collectionSlug: string;
};

// ---- Quotes ----

export type QuoteEntry = {
  id: string;
  text: string;
  attribution?: string;
  /** Biases the size tier: 3 = can land in the largest tier. Defaults to 1. */
  emphasis?: 1 | 2 | 3;
};

// ---- Blog ----

export type BlogPostMeta = {
  slug: string;
  title: string;
  date: string;
  description: string;
};

export type BlogPost = BlogPostMeta & {
  content: string;
};
