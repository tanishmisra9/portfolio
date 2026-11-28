import { ScrollReveal } from '@/components/scroll-reveal';
import { ENTRY_ITEM, ENTRY_MUTED } from '@/components/sections/entry-style';
import { SoftFill } from '@/components/ui/soft-fill';
import { SECTION_HEADING_CLASSES } from '@/components/ui/class-constants';
import { formatDateRange } from '@/lib/format-date-range';
import type { EducationEntry } from '@/types/content';

type Props = { entries: EducationEntry[] };

/** One look for every Education tag (activities and coursework alike), no hover. */
const TAG_CLASSES =
  'rounded-none border border-border-strong bg-fg/[0.06] px-3 py-1 font-sans text-[10px] uppercase tracking-widest text-fg select-none cursor-default';

export function EducationSection({ entries }: Props) {
  return (
    <section id="education" aria-labelledby="education-heading" className="scroll-mt-20 px-6 pb-8 pt-6 md:py-16">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal variant="fade">
          <h2
            id="education-heading"
            tabIndex={0}
            className={SECTION_HEADING_CLASSES}
          >
            Education
          </h2>
        </ScrollReveal>
        <ol className="mt-2 flex flex-col">
          {entries.map((edu) => (
            <li key={edu.id} className={ENTRY_ITEM}>
              <SoftFill />
              <ScrollReveal>
                <div className="grid gap-4 md:grid-cols-[25%_1fr] md:gap-8">
                  <span className={`font-sans text-sm md:pt-1 ${ENTRY_MUTED}`}>
                    {formatDateRange(edu)}
                  </span>
                  <div>
                    <p className="font-display text-xl font-semibold text-fg">{edu.institution}</p>
                    <p className={`mt-1 ${ENTRY_MUTED}`}>{edu.credential}</p>
                    {edu.activities?.length || edu.coursework?.length ? (
                      <div className="mt-4 flex flex-col gap-2">
                        {edu.activities?.length ? (
                          <ul className="flex flex-wrap gap-2">
                            {edu.activities.map((pill) => (
                              <li key={`${edu.id}-activity-${pill}`} className={TAG_CLASSES}>
                                {pill}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        {edu.coursework?.length ? (
                          <ul className="flex flex-wrap gap-2">
                            {edu.coursework.map((pill) => (
                              <li key={`${edu.id}-course-${pill}`} className={TAG_CLASSES}>
                                {pill}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </ScrollReveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
