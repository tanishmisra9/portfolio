"use client";

import { useHomeIntroDone } from "@/components/home-intro-gate";
import { ScrollReveal } from "@/components/scroll-reveal";
import {
  PILL_CLASSES,
  SECTION_GHOST_HEADING_CLASSES,
} from "@/components/ui/class-constants";
import type { ExperienceEntry } from "@/types/content";

type Props = { entries: ExperienceEntry[] };

export function ExperienceSection({ entries }: Props) {
  const homeIntroDone = useHomeIntroDone();

  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
      className="scroll-mt-20 px-6 pb-8 pt-5 md:pb-24 md:pt-20"
    >
      <div className="mx-auto max-w-6xl">
        <ScrollReveal variant="fade" homeIntroComplete={homeIntroDone}>
          <h2
            id="experience-heading"
            tabIndex={0}
            className={SECTION_GHOST_HEADING_CLASSES}
          >
            EXPERIENCE
          </h2>
        </ScrollReveal>
        <div className="mt-8 flex flex-col gap-10 md:gap-16">
          {entries.map((entry) => (
            <ScrollReveal key={entry.id} homeIntroComplete={homeIntroDone}>
              <div className="grid gap-4 md:grid-cols-[25%_1fr] md:gap-8">
                <div className="font-mono text-sm uppercase tracking-wider text-muted">
                  {entry.date}
                </div>
                <div>
                  <p className="font-display text-xl font-semibold text-fg">{entry.org}</p>
                  <p className="mt-1 text-muted">{entry.role}</p>
                  {entry.description ? (
                    <p className="mt-3 max-w-2xl text-muted">{entry.description}</p>
                  ) : null}
                  <ul className="mt-3 flex flex-wrap gap-2 md:mt-4">
                    {entry.tags.map((tag) => (
                      <li
                        key={tag}
                        className={`${PILL_CLASSES} font-sans text-[10px] uppercase tracking-widest`}
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
