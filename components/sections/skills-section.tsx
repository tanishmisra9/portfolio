import { ScrollReveal } from '@/components/scroll-reveal';
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
        <ScrollReveal variant="fade">
          <h2 className="mb-8 font-display text-[8.8vw] font-extrabold uppercase leading-none tracking-tighter text-neutral-800 md:mb-12">
            SKILLS
          </h2>
        </ScrollReveal>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {skills.map((group) => (
            <ScrollReveal key={group.id}>
              <section className="rounded-md border border-[var(--border)] p-5">
                <h3 className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                  {group.category}
                </h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {group.items.map((skill) => (
                    <li
                      key={skill}
                      className="rounded-full border border-white/10 bg-black/40 backdrop-blur-md px-3 py-1 text-[11px] text-neutral-400 select-none cursor-default"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              </section>
            </ScrollReveal>
          ))}
        </div>

        <section id="certifications" className="mt-20 scroll-mt-20 md:mt-24">
          <div className="flex flex-col gap-10 md:gap-12">
            <ScrollReveal variant="fade">
              <h3 className="font-display text-[8.8vw] font-extrabold uppercase leading-none tracking-tighter text-neutral-800">
                Certifications
              </h3>
            </ScrollReveal>
            <div className="flex flex-col gap-16 md:gap-20">
              {certifications.map((cert) => (
                <ScrollReveal key={cert.id}>
                  <div className="grid gap-4 md:grid-cols-[25%_1fr] md:gap-8">
                    <span className="font-mono text-sm uppercase tracking-wider text-neutral-500">
                      {cert.issuer}
                    </span>
                    <div>
                      <p className="font-display text-xl font-semibold text-white">{cert.title}</p>
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View credentials for ${cert.title}`}
                        className="mt-4 inline-flex rounded-full border border-neutral-700 bg-transparent px-4 py-1.5 font-mono text-[11px] font-normal uppercase tracking-[0.2em] text-neutral-400 transition-colors hover:border-neutral-500 hover:text-white"
                      >
                        View
                      </a>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
