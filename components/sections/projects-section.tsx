import { ScrollReveal } from '@/components/scroll-reveal';
import type { ProjectEntry } from '@/types/content';
import { Github } from 'lucide-react';

type Props = { projects: ProjectEntry[] };

export function ProjectsSection({ projects }: Props) {
  return (
    <section id="projects" className="scroll-mt-20 pb-8 pt-6 md:pb-16 md:pt-24">
      <div className="mx-auto w-full max-w-7xl px-8 md:px-16 lg:px-32">
        <ScrollReveal variant="fade">
          <h2 className="mb-8 font-display text-[9.1vw] font-extrabold uppercase leading-none tracking-tighter text-neutral-800 [text-shadow:0.55px_0_0_currentColor,-0.55px_0_0_currentColor] md:mb-12">
            PROJECTS
          </h2>
        </ScrollReveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {projects.map((project) => (
            <ScrollReveal key={project.id}>
              <article className="relative flex min-h-[300px] flex-col rounded-md border border-white/10 bg-black/40 backdrop-blur-md p-8 font-sans transition-colors duration-200 hover:border-neutral-400">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                  PROJECT
                </span>
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-6 top-6 text-neutral-500 transition-colors hover:text-white"
                  aria-label={`${project.title} on GitHub`}
                >
                  <Github className="h-4 w-4" strokeWidth={1.8} />
                </a>
                <h3 className="mt-6 pr-8 font-display text-2xl font-semibold text-white">{project.title}</h3>
                <p className="mt-4 leading-relaxed text-neutral-400">
                  {project.description}
                </p>
                <ul className="mt-auto flex flex-wrap gap-2 pt-10 font-mono text-[10px] uppercase tracking-widest">
                  {project.techStack.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-white/10 bg-black/40 backdrop-blur-md px-3 py-1 text-neutral-400 select-none cursor-default"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
