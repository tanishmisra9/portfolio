import { ScrollReveal } from '@/components/scroll-reveal';
import { PILL_CLASSES } from '@/components/ui/class-constants';
import type { EducationEntry } from '@/types/content';

type Props = { entries: EducationEntry[] };

const orgPillClassName =
  `${PILL_CLASSES} font-mono text-[10px] uppercase tracking-widest`;

function CoursePill({ label }: { label: string }) {
  return (
    <li className="group relative inline-flex rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-xl px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-neutral-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_4px_12px_-4px_rgba(0,0,0,0.5)] select-none cursor-default transition-[border-color,background-color,transform] duration-300 hover:-translate-y-[1px] hover:border-white/30 hover:bg-white/[0.1]">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.13) 0%, transparent 70%)',
        }}
      />
      <span className="relative">{label}</span>
    </li>
  );
}

export function EducationSection({ entries }: Props) {
  return (
    <section id="education" className="scroll-mt-20 px-6 pb-8 pt-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal variant="fade">
          <h2 className="mb-8 select-none font-display text-[10vw] font-extrabold uppercase leading-none tracking-tighter text-[var(--heading-ghost)] md:mb-12">
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
                          {row.map((pill) =>
                            rowIndex === 1 ? (
                              <CoursePill key={`${edu.id}-${rowIndex}-${pill}`} label={pill} />
                            ) : (
                              <li key={`${edu.id}-${rowIndex}-${pill}`} className={orgPillClassName}>
                                {pill}
                              </li>
                            )
                          )}
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
