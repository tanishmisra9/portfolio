import type { ExperienceEntry } from '@/types/content';

type Props = { entries: ExperienceEntry[] };

export function ExperienceSection({ entries }: Props) {
  return (
    <section id="experience" className="scroll-mt-20 px-6 py-20 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-8 text-[8.8vw] font-black uppercase leading-none tracking-tighter text-neutral-600 md:mb-12">
          EXPERIENCE
        </h2>
        <ul className="mt-8 flex flex-col gap-10 md:gap-16">
          {entries.map((entry) => (
            <li key={entry.id} className="grid gap-4 md:grid-cols-[25%_1fr] md:gap-8">
              <div className="font-mono text-sm uppercase tracking-wider text-neutral-500">
                {entry.date}
              </div>
              <div>
                <p className="text-xl font-bold text-white">{entry.org}</p>
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
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
