import type { CertificationEntry, SkillCategory } from '@/types/content';

type Props = {
  skills: SkillCategory[];
  certifications: CertificationEntry[];
};

export function SkillsSection({ skills, certifications }: Props) {
  return (
    <section
      id="skills"
      className="scroll-mt-20 px-6 py-20 md:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-8 text-[8.8vw] font-black uppercase leading-none tracking-tighter text-neutral-700">
          SKILLS
        </h2>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {skills.map((group) => (
            <section key={group.id} className="rounded-md border border-[var(--border)] p-5">
              <h3 className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                {group.category}
              </h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {group.items.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[11px] text-[var(--muted)]"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section id="certifications" className="mt-12 scroll-mt-20">
          <div className="flex flex-col gap-10 md:gap-12">
            <h3 className="text-[8.8vw] font-black uppercase leading-none tracking-tighter text-neutral-700">
              Certifications
            </h3>
            <ul className="flex flex-col gap-16 md:gap-20">
              {certifications.map((cert) => (
                <li key={cert.id} className="grid gap-4 md:grid-cols-[25%_1fr] md:gap-8">
                  <span className="font-mono text-sm uppercase tracking-wider text-neutral-500">
                    {cert.issuer}
                  </span>
                  <div>
                    <p className="text-xl font-bold text-white">{cert.title}</p>
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`View credentials for ${cert.title}`}
                      className="mt-4 inline-flex rounded-full border border-neutral-700 bg-transparent px-4 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400 transition-colors hover:border-neutral-500 hover:text-white"
                    >
                      View
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </section>
  );
}
