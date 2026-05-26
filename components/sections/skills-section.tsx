"use client";

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ScrollReveal } from '@/components/scroll-reveal';
import {
  GLASS_BUTTON_CLASSES,
  GLASS_BUTTON_SHEEN_BACKGROUND,
  GLASS_BUTTON_SHEEN_CLASSES,
  PILL_CLASSES,
} from '@/components/ui/class-constants';
import type { CertificationEntry, SkillCategory } from '@/types/content';
import { ExternalLink } from 'lucide-react';

type Props = {
  skills: SkillCategory[];
  certifications: CertificationEntry[];
};

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const CERT_VISIBLE_COUNT = 4;

function CertCard({ cert }: { cert: CertificationEntry }) {
  const pills = cert.pills ?? [];
  const skills = cert.skills ?? [];
  const hasPills = pills.length > 0;
  return (
    <article className="relative flex h-full min-h-[12rem] flex-col rounded-md border border-white/10 bg-black/40 backdrop-blur-md p-8 font-sans transition-colors duration-200 hover:border-neutral-400 sm:min-h-[13.5rem]">
      {hasPills && (
        <div className="flex flex-wrap gap-1.5">
          {pills.map((pill) => (
            <span
              key={pill}
              className={`${PILL_CLASSES} inline-flex font-mono text-[10px] font-semibold uppercase tracking-widest`}
            >
              {pill}
            </span>
          ))}
        </div>
      )}
      <a
        href={cert.credentialUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-6 top-6 text-neutral-500 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 -m-1.5 p-1.5"
        aria-label={`View credential for ${cert.title}`}
      >
        <ExternalLink className="h-4 w-4" strokeWidth={1.8} />
      </a>
      <h4 className={`${hasPills ? 'mt-5 ' : ''}pr-10 font-display text-xl font-semibold text-white`}>
        {cert.title}
      </h4>
      {skills.length > 0 && (
        <ul className="mt-auto flex flex-wrap gap-2 pt-8 font-mono text-[10px] uppercase tracking-widest">
          {skills.map((skill) => (
            <li
              key={skill}
              className={`${PILL_CLASSES} font-mono text-[10px] uppercase tracking-widest`}
            >
              {skill}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export function SkillsSection({ skills, certifications }: Props) {
  const [certExpanded, setCertExpanded] = useState(false);
  const reducedMotion = useReducedMotion();

  const visibleCerts = certifications.slice(0, CERT_VISIBLE_COUNT);
  const hiddenCerts = certifications.slice(CERT_VISIBLE_COUNT);
  const hasMoreCerts = hiddenCerts.length > 0;

  return (
    <section
      id="skills"
      className="scroll-mt-20 px-6 pb-8 pt-6 md:pb-16 md:pt-24"
    >
      <div className="mx-auto max-w-6xl">
        <ScrollReveal variant="fade">
          <h2 className="mb-8 select-none font-display text-[10vw] font-extrabold uppercase leading-none tracking-tighter text-[var(--heading-ghost)] md:mb-12">
            SKILLS
          </h2>
        </ScrollReveal>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {skills.map((group, index) => {
            const isLastOdd = index === skills.length - 1 && skills.length % 2 === 1;
            return (
            <ScrollReveal key={group.id} className={isLastOdd ? "md:col-span-2 md:w-1/2 md:mx-auto" : undefined}>
              <section className="rounded-md border border-[var(--border)] p-6 md:p-7">
                <h3 className="select-none font-mono text-sm uppercase tracking-[0.12em] text-[var(--muted)] md:text-base">
                  {group.category}
                </h3>
                <ul className="mt-5 flex flex-wrap gap-2.5 md:gap-3">
                  {group.items.map((skill) => (
                    <li
                      key={skill}
                      className={`${PILL_CLASSES} font-mono text-[10px] uppercase tracking-widest`}
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              </section>
            </ScrollReveal>
            );
          })}
        </div>

        <section id="certifications" className="mt-10 scroll-mt-20 md:mt-24">
            <ScrollReveal variant="fade">
              <h3 className="select-none font-display text-[10vw] font-extrabold uppercase leading-none tracking-tighter text-[var(--heading-ghost)]">
                Certifications
              </h3>
            </ScrollReveal>

            {/* First 4 certs */}
            <div className="mt-10 grid gap-5 sm:grid-cols-2 md:mt-12">
              {visibleCerts.map((cert) => (
                <ScrollReveal key={cert.id} className="h-full">
                  <CertCard cert={cert} />
                </ScrollReveal>
              ))}
            </div>

            {/* Height-animated shell — not a flex child, so no gap snap on removal */}
            <AnimatePresence initial={false}>
              {certExpanded && (
                <motion.div
                  key="extra-certs"
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  style={{ overflow: 'hidden' }}
                  transition={reducedMotion ? { duration: 0 } : { duration: 0.6, ease: EASE }}
                >
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    {hiddenCerts.map((cert, i) => (
                      <motion.div
                        key={cert.id}
                        className="h-full"
                        initial={reducedMotion ? false : { opacity: 0, filter: 'blur(10px)' }}
                        animate={reducedMotion ? {} : { opacity: 1, filter: 'blur(0px)' }}
                        exit={reducedMotion ? {} : { opacity: 0, filter: 'blur(10px)' }}
                        transition={{ duration: 0.45, ease: EASE, delay: i * 0.06 }}
                      >
                        <CertCard cert={cert} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Show more / Show less button */}
            {hasMoreCerts && (
              <div className="mt-10 flex justify-center md:mt-12">
                <button
                  onClick={() => setCertExpanded((v) => !v)}
                  aria-expanded={certExpanded}
                  className={GLASS_BUTTON_CLASSES}
                >
                  <span
                    aria-hidden
                    className={GLASS_BUTTON_SHEEN_CLASSES}
                    style={{ background: GLASS_BUTTON_SHEEN_BACKGROUND }}
                  />
                  <span className="relative">{certExpanded ? 'Show less' : 'Show more'}</span>
                </button>
              </div>
            )}
        </section>
      </div>
    </section>
  );
}
