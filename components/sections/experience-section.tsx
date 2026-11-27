"use client";

import { useHomeIntroDone } from "@/components/home-intro-gate";
import { ScrollReveal } from "@/components/scroll-reveal";
import { ExpandableRow } from "@/components/sections/expandable-row";
import {
  PILL_CLASSES,
  SECTION_HEADING_CLASSES,
} from "@/components/ui/class-constants";
import type { ExperienceEntry } from "@/types/content";

type Props = { entries: ExperienceEntry[] };

export function ExperienceSection({ entries }: Props) {
  const homeIntroDone = useHomeIntroDone();

  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
      className="scroll-mt-20 px-6 pb-8 pt-5 md:pb-16 md:pt-20"
    >
      <div className="mx-auto max-w-6xl">
        <ScrollReveal variant="fade" homeIntroComplete={homeIntroDone}>
          <h2
            id="experience-heading"
            tabIndex={0}
            className={SECTION_HEADING_CLASSES}
          >
            Experience
          </h2>
        </ScrollReveal>
        <div className="mt-8 border-b border-border">
          {entries.map((entry) => (
            <ScrollReveal key={entry.id} homeIntroComplete={homeIntroDone}>
              <ExpandableRow dates={entry} title={entry.org} subtitle={entry.role}>
                {entry.description || entry.tags.length ? (
                  <>
                    {entry.description ? (
                      <p className="mb-4 max-w-2xl text-muted">{entry.description}</p>
                    ) : null}
                    {entry.tags.length ? (
                      <ul className="flex flex-wrap gap-2">
                        {entry.tags.map((tag) => (
                          <li
                            key={tag}
                            className={`${PILL_CLASSES} font-sans text-[10px] uppercase tracking-widest`}
                          >
                            {tag}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </>
                ) : null}
              </ExpandableRow>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
