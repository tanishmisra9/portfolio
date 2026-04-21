"use client";

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ScrollReveal } from '@/components/scroll-reveal';
import type { ProjectEntry } from '@/types/content';
import { Github } from 'lucide-react';

type Props = { projects: ProjectEntry[] };

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const VISIBLE_COUNT = 4;

function ProjectCard({ project }: { project: ProjectEntry }) {
  const pillLabel = project.pill?.trim() ?? '';
  return (
    <article className="relative flex h-full min-h-[15.5rem] flex-col rounded-md border border-white/10 bg-black/40 backdrop-blur-md p-8 font-sans transition-colors duration-200 hover:border-neutral-400 sm:min-h-[16.75rem]">
      {pillLabel ? (
        <span className="inline-flex self-start rounded-full border border-white/10 bg-black/40 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
          {pillLabel}
        </span>
      ) : null}
      <a
        href={project.githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-6 top-6 text-neutral-500 transition-colors hover:text-white"
        aria-label={`${project.title} on GitHub`}
      >
        <Github className="h-4 w-4" strokeWidth={1.8} />
      </a>
      <h3 className={`${pillLabel ? 'mt-5 ' : ''}pr-10 font-display text-2xl font-semibold text-white`}>
        {project.title}
      </h3>
      <p className="mt-4 flex-1 leading-relaxed text-neutral-400">
        {project.description}
      </p>
      <ul className="mt-10 flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-widest">
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
  );
}

export function ProjectsSection({ projects }: Props) {
  const [expanded, setExpanded] = useState(false);
  const reducedMotion = useReducedMotion();

  const visibleProjects = projects.slice(0, VISIBLE_COUNT);
  const hiddenProjects = projects.slice(VISIBLE_COUNT);
  const hasMore = hiddenProjects.length > 0;

  return (
    <section id="projects" className="scroll-mt-20 pb-8 pt-6 md:pb-16 md:pt-11">
      <div className="mx-auto w-full max-w-7xl px-8 md:px-16 lg:px-32">
        <ScrollReveal variant="fade">
          <h2 className="mb-8 select-none font-display text-[9.1vw] font-extrabold uppercase leading-none tracking-tighter text-neutral-800 [text-shadow:0.55px_0_0_currentColor,-0.55px_0_0_currentColor] md:mb-12">
            PROJECTS
          </h2>
        </ScrollReveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {visibleProjects.map((project) => (
            <ScrollReveal key={project.id} className="h-full">
              <ProjectCard project={project} />
            </ScrollReveal>
          ))}
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="extra"
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              style={{ overflow: 'hidden' }}
              transition={reducedMotion ? { duration: 0 } : { duration: 0.6, ease: EASE }}
            >
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {hiddenProjects.map((project, i) => (
                  <motion.div
                    key={project.id}
                    className="h-full"
                    initial={reducedMotion ? false : { opacity: 0, filter: 'blur(10px)' }}
                    animate={reducedMotion ? {} : { opacity: 1, filter: 'blur(0px)' }}
                    exit={reducedMotion ? {} : { opacity: 0, filter: 'blur(10px)' }}
                    transition={{ duration: 0.45, ease: EASE, delay: i * 0.06 }}
                  >
                    <ProjectCard project={project} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Show more / Show less button */}
        {hasMore && (
          <div className="mt-10 flex justify-center" id="projects-extra">
            <button
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              aria-controls="projects-extra"
              className="group relative inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-6 py-3 font-sans text-xs uppercase tracking-[0.2em] text-neutral-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_10px_30px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-[border-color,background-color,transform] duration-300 hover:-translate-y-[1px] hover:border-white/30 hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              {/* Specular sheen on hover */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background:
                    'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.13) 0%, transparent 70%)',
                }}
              />
              <span className="relative">{expanded ? 'Show less' : 'Show more'}</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
