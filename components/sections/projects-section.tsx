import type { ProjectEntry } from '@/types/content';
import { Github } from 'lucide-react';

type Props = { projects: ProjectEntry[] };

export function ProjectsSection({ projects }: Props) {
  return (
    <section id="projects" className="scroll-mt-20 py-20 md:py-24">
      <div className="mx-auto w-full max-w-7xl px-8 md:px-16 lg:px-32">
        <h2 className="mb-8 text-[8.8vw] font-black uppercase leading-none tracking-tighter text-neutral-600 md:mb-12">
          PROJECTS
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {projects.map((project) => (
            <article
              key={project.id}
              className="relative flex min-h-[300px] flex-col rounded-md border border-white/10 bg-black/40 backdrop-blur-md p-8 font-sans transition-colors duration-200 hover:border-neutral-400"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
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
              <h3 className="mt-6 pr-8 text-2xl font-bold text-white">{project.title}</h3>
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
          ))}
        </div>
      </div>
    </section>
  );
}
