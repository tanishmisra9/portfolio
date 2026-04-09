import Link from 'next/link';
import { ScrollReveal } from '@/components/scroll-reveal';
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

/** Shared typography for both bio blocks; color applied per paragraph. (~8% smaller than 2xl/3xl scale.) */
const bioBodyClass =
  "text-[1.38rem] leading-[1.486] md:text-[1.725rem] md:leading-[1.53]";

function renderHighlightedParagraph(paragraph: string): ReactNode {
  const pattern = new RegExp(`(${HIGHLIGHT_TERMS.map(escapeRegExp).join('|')})`, 'g');
  return paragraph.split(pattern).map((part, index) => {
    if (part === '#ShotOniPhone17Pro') {
      return (
        <Link
          key={`shot-${index}`}
          href="/photos"
          className="relative inline-block font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 after:pointer-events-none after:absolute after:left-0 after:top-full after:mt-[0.055em] after:block after:h-[0.055em] after:w-full after:origin-left after:scale-x-0 after:rounded-sm after:bg-current after:transition-transform after:duration-[600ms] after:ease-[cubic-bezier(0.19,1,0.22,1)] hover:after:scale-x-100 focus-visible:after:scale-x-100 motion-reduce:after:scale-x-100 motion-reduce:after:transition-none"
        >
          {part}
        </Link>
      );
    }
    if (HIGHLIGHT_TERMS.includes(part as (typeof HIGHLIGHT_TERMS)[number])) {
      return (
        <strong key={`${part}-${index}`} className="font-bold text-white">
          {part}
        </strong>
      );
    }
    return (
      <span key={`text-${index}`} className="text-inherit">
        {part}
      </span>
    );
  });
}

export function AboutContactSection({ bio, social }: Props) {
  const [paragraphOne = '', paragraphTwo = ''] = bio.split('\n\n');

  return (
    <section id="about" className="scroll-mt-20 px-6 pb-[4.6rem] pt-9 md:pb-[5.52rem] md:pt-11">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal variant="fade">
          <h2 className="mb-7 text-center font-display text-[8.74vw] font-extrabold uppercase leading-none tracking-tighter text-neutral-800 [text-shadow:0.55px_0_0_currentColor,-0.55px_0_0_currentColor] md:mb-11">
            ABOUT
          </h2>
        </ScrollReveal>
        <ScrollReveal>
          <div className="mx-auto max-w-[min(44.16rem,calc(100vw-3rem))] px-6 text-center">
            <p className={`${bioBodyClass} text-white`}>
              {renderHighlightedParagraph(paragraphOne)}
            </p>
            <p className={`${bioBodyClass} mt-7 text-neutral-400 md:mt-9`}>
              {renderHighlightedParagraph(paragraphTwo)}
            </p>
          </div>
        </ScrollReveal>
        <ScrollReveal>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-9 md:mt-[4.6rem]">
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
                    className="size-[1.3225rem]"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </a>
              );
            })}
          </div>
        </ScrollReveal>
        <ScrollReveal variant="fade">
          <p className="mt-14 text-center text-[0.805rem] text-neutral-500 md:mt-[4.6rem]">
            © 2026 Tanish Misra
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
