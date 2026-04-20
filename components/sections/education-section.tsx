import { ScrollReveal } from '@/components/scroll-reveal';
import type { EducationEntry } from '@/types/content';

type Props = { entries: EducationEntry[] };

const pillClassName =
  'rounded-full border border-white/10 bg-black/40 backdrop-blur-md px-3 py-1 text-[11px] text-neutral-400 select-none cursor-default';

export function EducationSection({ entries }: Props) {
  return (
    <section id="education" className="scroll-mt-20 px-6 pb-8 pt-6 md:py-24">
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
                  {edu.pillRows?.length ? (
                    <div className="mt-4 flex flex-col gap-2">
                      {edu.pillRows.map((row, rowIndex) => (
                        <ul key={rowIndex} className="flex flex-wrap gap-2">
                          {row.map((pill) => (
                            <li key={`${edu.id}-${rowIndex}-${pill}`} className={pillClassName}>
                              {pill}
                            </li>
                          ))}
                        </ul>
                      ))}
                    </div>
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
