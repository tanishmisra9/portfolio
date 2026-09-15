import Markdown from 'react-markdown';
import { ScrollReveal } from '@/components/scroll-reveal';
import { SECTION_GHOST_HEADING_BASE } from '@/components/ui/class-constants';
import { Tooltip } from '@/components/ui/tooltip';
import { bioMarkdownComponents } from '@/components/bio-markdown';
import { resolveIcon } from '@/components/social-icon';
import type { SocialLink } from '@/types/content';

type Props = {
  bio: string;
  social: SocialLink[];
};

/** Shared typography for both bio blocks; color applied per paragraph. (~8% smaller than 2xl/3xl scale.) */
const bioBodyClass =
  "text-[1.38rem] font-[200] subpixel-antialiased leading-[1.486] md:text-[1.725rem] md:leading-[1.53]";

export function AboutContactSection({ bio, social }: Props) {
  const [paragraphOne = '', paragraphTwo = ''] = bio.split('\n\n');

  return (
    <section id="about" className="scroll-mt-20 px-6 pb-12 pt-6 md:pb-[5.52rem] md:pt-11">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal variant="fade">
          <h2
            className={`${SECTION_GHOST_HEADING_BASE} mb-7 md:text-center md:mb-11`}
          >
            ABOUT
          </h2>
        </ScrollReveal>
        <ScrollReveal>
          <div className="mx-auto max-w-[min(44.16rem,calc(100vw-3rem))] px-6 text-center">
            <p className={`${bioBodyClass} text-fg`}>
              <Markdown components={bioMarkdownComponents}>{paragraphOne}</Markdown>
            </p>
            <p className={`${bioBodyClass} mt-7 text-muted md:mt-9`}>
              <Markdown components={bioMarkdownComponents}>{paragraphTwo}</Markdown>
            </p>
          </div>
        </ScrollReveal>
        <ScrollReveal>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-9 md:mt-[4.6rem]">
            {social.map((link) => {
              const Icon = resolveIcon(link);
              // The resume's filename lives in its own stored href (…/resume/<name>.pdf) —
              // parsed here rather than duplicated as a second hardcoded literal.
              const resumeFilename =
                link.label === 'Resume' ? link.href.split('?')[0].split('/').pop() : undefined;
              return (
                <Tooltip key={link.id} label={link.label}>
                  <a
                    href={link.href}
                    aria-label={link.label}
                    className="rounded-md p-2 text-muted transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
                    {...(resumeFilename ? { download: resumeFilename } : {})}
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
                </Tooltip>
              );
            })}
          </div>
        </ScrollReveal>
        <ScrollReveal variant="fade">
          <p className="mt-14 text-center text-[0.805rem] text-muted md:mt-[4.6rem]">
            © {new Date().getFullYear()} Tanish Misra
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
