"use client";

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ScrollReveal } from '@/components/scroll-reveal';
import {
  GLASS_BUTTON_CLASSES,
  GLASS_BUTTON_SHEEN_BACKGROUND,
  GLASS_BUTTON_SHEEN_CLASSES,
  PILL_CLASSES,
  SECTION_GHOST_HEADING_CLASSES,
} from '@/components/ui/class-constants';
import { Tooltip } from '@/components/ui/tooltip';
import type { ProjectEntry } from '@/types/content';
import { ExternalLink, Github, Newspaper } from 'lucide-react';

const LINK_ICONS = { external: ExternalLink, newspaper: Newspaper };

type Props = { projects: ProjectEntry[] };

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const VISIBLE_COUNT = 2;

function ProjectCard({ project }: { project: ProjectEntry }) {
  const pills = project.pills ?? [];
  return (
    <article className="relative flex h-full min-h-[15.5rem] flex-col rounded-md border border-white/10 bg-black/40 backdrop-blur-md p-8 font-sans transition-colors duration-200 hover:border-neutral-400 sm:min-h-[16.75rem]">
      <div className="flex items-center justify-between gap-4">
        {pills.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {pills.map((pill) => (
              <span
                key={pill}
                className={`${PILL_CLASSES} inline-flex font-sans text-[10px] font-semibold uppercase tracking-widest`}
              >
                {pill}
              </span>
            ))}
          </div>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-8">
          {project.links?.map(({ label, url, icon }) => {
            const Icon = LINK_ICONS[icon ?? 'external'];
            return (
              <Tooltip key={url} label={label} align="end">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-500 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 -m-1.5 p-1.5"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden />
                </a>
              </Tooltip>
            );
          })}
          <Tooltip label="GitHub repository" align="end">
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-500 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 -m-1.5 p-1.5"
              aria-label={`${project.title} on GitHub`}
            >
              <Github className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            </a>
          </Tooltip>
        </div>
      </div>
      <h3 className="mt-5 font-display text-2xl font-semibold text-white">
        {project.title}
      </h3>
      <p className="mt-4 flex-1 leading-relaxed text-neutral-400">
        {project.description}
      </p>
      <ul className="mt-10 flex flex-wrap gap-2 font-sans text-[10px] uppercase tracking-widest">
        {project.techStack.map((tag) => (
          <li
            key={tag}
            className={PILL_CLASSES}
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
    <section id="projects" className="scroll-mt-20 px-6 pb-8 pt-6 md:pb-16 md:pt-11">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal variant="fade">
          <h2 className={SECTION_GHOST_HEADING_CLASSES}>
            PROJECTS
          </h2>
        </ScrollReveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {visibleProjects.map((project, index) => {
            const isLastOdd = index === visibleProjects.length - 1 && visibleProjects.length % 2 === 1;
            return (
              <ScrollReveal key={project.id} className={isLastOdd ? "h-full sm:col-span-2 sm:w-1/2 sm:mx-auto" : "h-full"}>
                <ProjectCard project={project} />
              </ScrollReveal>
            );
          })}
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              id="projects-extra-content"
              key="extra"
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              style={{ overflow: 'hidden' }}
              transition={reducedMotion ? { duration: 0 } : { duration: 0.6, ease: EASE }}
            >
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {hiddenProjects.map((project, i) => {
                  const isLastOdd = i === hiddenProjects.length - 1 && hiddenProjects.length % 2 === 1;
                  return (
                    <motion.div
                      key={project.id}
                      className={isLastOdd ? "h-full sm:col-span-2 sm:w-1/2 sm:mx-auto" : "h-full"}
                      initial={reducedMotion ? false : { opacity: 0, filter: 'blur(10px)' }}
                      animate={reducedMotion ? {} : { opacity: 1, filter: 'blur(0px)' }}
                      exit={reducedMotion ? {} : { opacity: 0, filter: 'blur(10px)' }}
                      transition={{ duration: 0.45, ease: EASE, delay: i * 0.06 }}
                    >
                      <ProjectCard project={project} />
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Show more / Show less button */}
        {hasMore && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              aria-controls="projects-extra-content"
              className={GLASS_BUTTON_CLASSES}
            >
              <span
                aria-hidden
                className={GLASS_BUTTON_SHEEN_CLASSES}
                style={{ background: GLASS_BUTTON_SHEEN_BACKGROUND }}
              />
              <span className="relative">{expanded ? 'Show less' : 'Show more'}</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
