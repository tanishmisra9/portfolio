import type { EducationEntry } from '@/types/content';

type Props = { entries: EducationEntry[] };

export function EducationSection({ entries }: Props) {
  return (
    <section id="education" className="scroll-mt-20 px-6 py-20 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-8 text-[8vw] font-black uppercase leading-none tracking-tighter text-neutral-800">
          EDUCATION
        </h2>
        <ul className="mt-8 flex flex-col gap-16 md:gap-20">
          {entries.map((edu) => (
            <li key={edu.id} className="grid gap-4 md:grid-cols-[25%_1fr] md:gap-8">
              <span className="font-mono text-sm uppercase tracking-wider text-neutral-500">
                {edu.date}
              </span>
              <div>
                <p className="text-xl font-bold text-white">{edu.institution}</p>
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
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
