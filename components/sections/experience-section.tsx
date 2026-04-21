"use client";

import { useHomeIntroDone } from "@/components/home-intro-gate";
import { ScrollReveal } from "@/components/scroll-reveal";
import type { ExperienceEntry } from "@/types/content";

type Props = { entries: ExperienceEntry[] };

export function ExperienceSection({ entries }: Props) {
  const homeIntroDone = useHomeIntroDone();

  return (
    <section
      id="experience"
      className="scroll-mt-20 px-6 pb-8 pt-6 md:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <ScrollReveal variant="fade" homeIntroComplete={homeIntroDone}>
          <h2 className="mb-8 select-none font-display text-[8.8vw] font-extrabold uppercase leading-none tracking-tighter text-neutral-800 md:mb-12">
            EXPERIENCE
          </h2>
        </ScrollReveal>
        <div className="mt-8 flex flex-col gap-10 md:gap-16">
          {entries.map((entry) => (
            <ScrollReveal key={entry.id} homeIntroComplete={homeIntroDone}>
              <div className="grid gap-4 md:grid-cols-[25%_1fr] md:gap-8">
                <div className="font-mono text-sm uppercase tracking-wider text-neutral-500">
                  {entry.date}
                </div>
                <div>
                  <p className="font-display text-xl font-semibold text-white">{entry.org}</p>
                  <p className="mt-1 text-neutral-400">{entry.role}</p>
                  {entry.description ? (
                    <p className="mt-3 max-w-2xl text-neutral-400">{entry.description}</p>
                  ) : null}
                  <ul className="mt-3 flex flex-wrap gap-2 md:mt-4">
                    {entry.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-white/10 bg-black/40 backdrop-blur-md px-3 py-1 text-xs text-neutral-400 select-none cursor-default"
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
