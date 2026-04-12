import { ScrollReveal } from '@/components/scroll-reveal';
import type { EducationEntry } from '@/types/content';

type Props = { entries: EducationEntry[] };

/** "Label: body" → separate spans so the colon inherits `text-inherit` (avoids odd colon weight/color in Safari). */
function LabeledDetailLine({
  text,
  className,
}: {
  text: string;
  className: string;
}) {
  const trimmed = text.trim();
  const colon = trimmed.indexOf(':');
  if (colon < 0) {
    return <p className={className}>{text}</p>;
  }
  const label = trimmed.slice(0, colon);
  const body = trimmed.slice(colon + 1).replace(/^\s+/, '');
  return (
    <p className={className}>
      <span className="text-inherit">{label}</span>
      <span className="text-inherit">: </span>
      <span className="text-inherit">{body}</span>
    </p>
  );
}

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
                    <LabeledDetailLine
                      text={edu.coursework}
                      className="mt-4 text-left text-base font-normal leading-relaxed text-neutral-400 antialiased"
                    />
                  ) : null}
                  {edu.activities ? (
                    <LabeledDetailLine
                      text={edu.activities}
                      className="mt-3 text-left text-base font-normal leading-relaxed text-neutral-400 antialiased"
                    />
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
