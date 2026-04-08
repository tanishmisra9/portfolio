import { Github, Linkedin, Mail } from 'lucide-react';
import type { ReactNode } from 'react';
import type { SocialLink } from '@/types/content';

type Props = {
  bio: string;
  social: SocialLink[];
};

function iconFor(label: string) {
  const key = label.toLowerCase();
  if (key.includes('github')) return Github;
  if (key.includes('linkedin')) return Linkedin;
  return Mail;
}

const HIGHLIGHT_TERMS = [
  'applied AI',
  'machine learning systems',
  'automotive',
  'Formula 1',
  '#ShotOniPhone17Pro',
] as const;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderHighlightedParagraph(paragraph: string): ReactNode {
  const pattern = new RegExp(`(${HIGHLIGHT_TERMS.map(escapeRegExp).join('|')})`, 'g');
  return paragraph.split(pattern).map((part, index) => {
    if (HIGHLIGHT_TERMS.includes(part as (typeof HIGHLIGHT_TERMS)[number])) {
      return (
        <strong key={`${part}-${index}`} className="font-bold text-white">
          {part}
        </strong>
      );
    }
    return <span key={`text-${index}`}>{part}</span>;
  });
}

export function AboutContactSection({ bio, social }: Props) {
  const [paragraphOne = '', paragraphTwo = ''] = bio.split('\n\n');

  return (
    <section id="about" className="scroll-mt-20 px-6 py-20 md:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-16 text-center text-[8vw] font-black uppercase leading-none tracking-tighter text-neutral-800 md:mb-20">
          ABOUT
        </h2>
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-2xl leading-relaxed text-neutral-400 md:text-3xl">
            {renderHighlightedParagraph(paragraphOne)}
          </p>
          <p className="mt-8 text-lg leading-relaxed text-neutral-400 md:mt-10 md:text-xl">
            {renderHighlightedParagraph(paragraphTwo)}
          </p>
        </div>
        <div className="mt-16 flex flex-wrap items-center justify-center gap-10 md:mt-20">
          {social.map((link) => {
            const Icon = iconFor(link.label);
            return (
              <a
                key={link.href}
                href={link.href}
                aria-label={link.label}
                title={link.label}
                className="rounded-md p-2 text-neutral-400 transition-colors hover:text-white"
                {...(link.href.startsWith('http')
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
              >
                <Icon
                  className="size-[1.4375rem]"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </a>
            );
          })}
        </div>
        <p className="mt-16 text-center text-sm text-neutral-500 md:mt-20">
          © 2026 Tanish Misra
        </p>
      </div>
    </section>
  );
}
