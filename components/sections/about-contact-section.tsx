import Markdown from 'react-markdown';
import { ScrollReveal } from '@/components/scroll-reveal';
import { SECTION_HEADING_BASE } from '@/components/ui/class-constants';
import { bioMarkdownComponents, bioMarkdownAllowedElements } from '@/components/bio-markdown';

type Props = {
  bio: string;
};

/** Shared typography for both bio blocks; color applied per paragraph. (~8% smaller than 2xl/3xl scale.) */
const bioBodyClass =
  "text-[1.38rem] font-[300] subpixel-antialiased leading-[1.486] md:text-[1.725rem] md:leading-[1.53]";

export function AboutContactSection({ bio }: Props) {
  const [paragraphOne = '', paragraphTwo = ''] = bio.split('\n\n');

  return (
    <section id="about" className="scroll-mt-20 px-6 pb-12 pt-6 md:pb-[5.52rem] md:pt-11">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal variant="fade">
          <h2
            className={`${SECTION_HEADING_BASE} mb-5 text-center md:mb-8`}
          >
            About
          </h2>
        </ScrollReveal>
        <ScrollReveal>
          <div className="mx-auto max-w-[min(44.16rem,calc(100vw-3rem))] px-6 text-center">
            <p className={`${bioBodyClass} text-fg`}>
              <Markdown components={bioMarkdownComponents} allowedElements={bioMarkdownAllowedElements} unwrapDisallowed>{paragraphOne}</Markdown>
            </p>
            <p className={`${bioBodyClass} mt-7 text-muted md:mt-9`}>
              <Markdown components={bioMarkdownComponents} allowedElements={bioMarkdownAllowedElements} unwrapDisallowed>{paragraphTwo}</Markdown>
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
