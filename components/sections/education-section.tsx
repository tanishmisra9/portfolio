import { ScrollReveal } from '@/components/scroll-reveal';
import type { EducationEntry } from '@/types/content';

type Props = { entries: EducationEntry[] };

export function EducationSection({ entries }: Props) {
  return (
    <section id="education" className="scroll-mt-20 px-6 py-20 md:py-24">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal variant="fade">
          <h2 className="mb-8 font-display text-[8.8vw] font-extrabold uppercase leading-none tracking-tighter text-neutral-800 md:mb-12">
            EDUCATION
          </h2>
        </ScrollReveal>
        <div className="mt-8 flex flex-col gap-10 md:gap-16">
          {entries.map((edu) => (
            <ScrollReveal key={edu.id}>
              <div className="grid gap-4 md:grid-cols-[25%_1fr] md:gap-8">
                <span className="font-mono text-sm uppercase tracking-wider text-neutral-500">
                  {edu.date}
                </span>
                <div>
                  <p className="font-display text-xl font-semibold text-white">{edu.institution}</p>
                  <p className="mt-1 text-neutral-400">{edu.credential}</p>
                  {edu.coursework ? (
                    <p className="mt-4 text-left text-base leading-relaxed text-neutral-400">
                      {edu.coursework}
                    </p>
                  ) : null}
                  {edu.activities ? (
                    <p className="mt-3 text-left text-base leading-relaxed text-neutral-400">
                      {edu.activities}
                    </p>
                  ) : null}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
