/** The admin's top-level sections: one list for the top bar and the dashboard. */
export const ADMIN_SECTIONS = [
  { href: "/admin/portfolio", title: "Portfolio", description: "Bio, experience, education, skills, certifications, projects, social." },
  { href: "/admin/photos", title: "Photos", description: "Collections, uploads, captions, ordering." },
  { href: "/admin/blog", title: "Thoughts", description: "Posts, drafts, and markdown import." },
  { href: "/admin/quotes", title: "Quotes", description: "The quote cloud on /quotes." },
  { href: "/admin/radio", title: "Radio", description: "Race-radio clips for the boxbox easter egg." },
] as const;
