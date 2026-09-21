"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { PortfolioContent } from "@/types/content";
import { ADMIN_SECTION_HEADING_CLASSES } from "@/components/ui/class-constants";
import { ArrayEditor, type Item } from "@/components/admin/array-editor";
import { EntryList } from "@/components/admin/entry-list";
import { CollapsibleSection } from "@/components/admin/collapsible-section";
import { CertificationsEditor } from "@/components/admin/certifications-editor";
import { SocialEditor } from "@/components/admin/social-editor";
import { BioEditor } from "@/components/admin/bio-editor";
import { useRegisterDirty } from "@/components/admin/dirty-context";
import { updatePortfolio } from "@/lib/admin/actions";

const inputClass =
  "w-full rounded border border-border-strong bg-transparent px-2 py-1.5 text-base outline-none focus-visible:ring-2 focus-visible:ring-fg/70";

const SECTION_KEYS = [
  "bio",
  "experience",
  "education",
  "skills",
  "certifications",
  "projects",
  "social",
] as const;

const SECTION_LABELS: Record<(typeof SECTION_KEYS)[number], string> = {
  bio: "Bio",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  certifications: "Certifications",
  projects: "Projects",
  social: "Social",
};

function sectionChanged(
  key: (typeof SECTION_KEYS)[number],
  data: PortfolioContent,
  baseline: PortfolioContent,
): boolean {
  if (key === "bio") {
    return (
      data.name !== baseline.name ||
      data.heroSubtitle !== baseline.heroSubtitle ||
      data.aboutBio !== baseline.aboutBio
    );
  }
  return JSON.stringify(data[key]) !== JSON.stringify(baseline[key]);
}

export function PortfolioForm({ initial }: { initial: PortfolioContent }) {
  const [data, setData] = useState(initial);
  // The baseline for the dirty check — starts as the server-loaded value, then moves to
  // whatever was last saved so "Unsaved changes" doesn't stay stuck on after a save
  // (the `initial` prop itself never updates without a full page reload).
  const [baseline, setBaseline] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState<Record<(typeof SECTION_KEYS)[number], boolean>>({
    bio: true,
    experience: true,
    education: false,
    skills: false,
    certifications: false,
    projects: false,
    social: false,
  });

  const dirty = useMemo(() => JSON.stringify(data) !== JSON.stringify(baseline), [data, baseline]);
  const changedKeys = useMemo(
    () => SECTION_KEYS.filter((key) => sectionChanged(key, data, baseline)),
    [data, baseline],
  );
  const changes = useMemo(
    () => changedKeys.map((key) => ({ key, label: SECTION_LABELS[key] })),
    [changedKeys],
  );
  useRegisterDirty(dirty, changes);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function save() {
    startTransition(async () => {
      await updatePortfolio(data);
      setBaseline(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  function setAll(nextOpen: boolean) {
    setOpen(Object.fromEntries(SECTION_KEYS.map((key) => [key, nextOpen])) as typeof open);
  }

  return (
    <div className="space-y-0 pb-24">
      <div className="mb-4 flex items-center gap-3">
        <h1 className={ADMIN_SECTION_HEADING_CLASSES}>Portfolio</h1>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={() => setAll(true)} className="text-base text-muted hover:text-fg">
            Expand all
          </button>
          <button type="button" onClick={() => setAll(false)} className="text-base text-muted hover:text-fg">
            Collapse all
          </button>
        </div>
      </div>

      <CollapsibleSection
        id="section-bio"
        title="Bio"
        open={open.bio}
        onToggle={(v) => setOpen({ ...open, bio: v })}
        changed={changedKeys.includes("bio")}
      >
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-base text-dim">Name</span>
            <input
              className={inputClass}
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
            />
          </label>
          {(["Line 1", "Line 2"] as const).map((label, index) => {
            const lines = data.heroSubtitle.split("\n");
            return (
              <label key={label} className="block">
                <span className="mb-1 block text-base text-dim">Hero subtitle, {label.toLowerCase()}</span>
                <input
                  className={inputClass}
                  value={lines[index] ?? ""}
                  onChange={(e) => {
                    const next = [lines[0] ?? "", lines[1] ?? ""];
                    next[index] = e.target.value;
                    setData({ ...data, heroSubtitle: next.filter((l, i) => i === 0 || l).join("\n") });
                  }}
                />
              </label>
            );
          })}
          <div>
            <span className="mb-1 block text-base text-dim">About bio</span>
            <BioEditor value={data.aboutBio} onChange={(aboutBio) => setData({ ...data, aboutBio })} />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="section-experience"
        title="Experience"
        open={open.experience}
        onToggle={(v) => setOpen({ ...open, experience: v })}
        changed={changedKeys.includes("experience")}
      >
        <EntryList
          items={data.experience as unknown as Item[]}
          onChange={(v) => setData({ ...data, experience: v as unknown as PortfolioContent["experience"] })}
          hasDateRange
          summary={(item) => (item.org as string) || "Untitled"}
          newItem={() => ({
            id: crypto.randomUUID(),
            org: "",
            role: "",
            startDate: "",
            endDate: "present",
            tags: [],
          })}
          fields={[
            { key: "org", label: "Organization", type: "text" },
            { key: "role", label: "Role", type: "text" },
            { key: "tags", label: "Tags", type: "tags" },
            { key: "description", label: "Description", type: "textarea" },
          ]}
        />
      </CollapsibleSection>

      <CollapsibleSection
        id="section-education"
        title="Education"
        open={open.education}
        onToggle={(v) => setOpen({ ...open, education: v })}
        changed={changedKeys.includes("education")}
      >
        <EntryList
          items={data.education as unknown as Item[]}
          onChange={(v) => setData({ ...data, education: v as unknown as PortfolioContent["education"] })}
          hasDateRange
          summary={(item) => (item.credential as string) || "Untitled"}
          newItem={() => ({
            id: crypto.randomUUID(),
            institution: "",
            credential: "",
            startDate: "",
            endDate: null,
          })}
          fields={[
            { key: "institution", label: "Institution", type: "text" },
            { key: "credential", label: "Credential", type: "text" },
            { key: "activities", label: "Activities & clubs", type: "tags" },
            { key: "coursework", label: "Coursework", type: "tags" },
          ]}
        />
      </CollapsibleSection>

      <CollapsibleSection
        id="section-skills"
        title="Skills"
        open={open.skills}
        onToggle={(v) => setOpen({ ...open, skills: v })}
        changed={changedKeys.includes("skills")}
      >
        <ArrayEditor
          layout="cards"
          cardLabel={(item) => item.category as string}
          items={data.skills as unknown as Item[]}
          onChange={(v) => setData({ ...data, skills: v as unknown as PortfolioContent["skills"] })}
          newItem={() => ({ id: crypto.randomUUID(), category: "", items: [] })}
          fields={[
            { key: "category", label: "Category", type: "text" },
            { key: "items", label: "Items", type: "tags" },
          ]}
        />
      </CollapsibleSection>

      <CollapsibleSection
        id="section-certifications"
        title="Certifications"
        open={open.certifications}
        onToggle={(v) => setOpen({ ...open, certifications: v })}
        changed={changedKeys.includes("certifications")}
      >
        <CertificationsEditor
          items={data.certifications as unknown as Item[]}
          onChange={(v) => setData({ ...data, certifications: v as unknown as PortfolioContent["certifications"] })}
        />
      </CollapsibleSection>

      <CollapsibleSection
        id="section-projects"
        title="Projects"
        open={open.projects}
        onToggle={(v) => setOpen({ ...open, projects: v })}
        changed={changedKeys.includes("projects")}
      >
        <ArrayEditor
          layout="cards"
          cardLabel={(item) => item.title as string}
          hideToggle
          items={data.projects as unknown as Item[]}
          onChange={(v) => setData({ ...data, projects: v as unknown as PortfolioContent["projects"] })}
          newItem={() => ({
            id: crypto.randomUUID(),
            title: "",
            description: "",
            techStack: [],
            githubUrl: "",
          })}
          fields={[
            { key: "title", label: "Title", type: "text" },
            { key: "description", label: "Description", type: "textarea" },
            { key: "techStack", label: "Tech stack", type: "tags" },
            { key: "githubUrl", label: "GitHub URL", type: "text" },
            { key: "pills", label: "Pills", type: "tags" },
            {
              key: "links",
              label: "Links",
              type: "sublist",
              subFields: [
                { key: "label", label: "Label", type: "text" },
                { key: "url", label: "URL", type: "text" },
                {
                  key: "icon",
                  label: "Icon",
                  type: "select",
                  options: [
                    { value: "", label: "None" },
                    { value: "external", label: "External" },
                    { value: "newspaper", label: "Newspaper" },
                  ],
                },
              ],
              newSubItem: () => ({ id: crypto.randomUUID(), label: "", url: "" }),
            },
          ]}
        />
      </CollapsibleSection>

      <CollapsibleSection
        id="section-social"
        title="Social"
        open={open.social}
        onToggle={(v) => setOpen({ ...open, social: v })}
        changed={changedKeys.includes("social")}
      >
        <SocialEditor
          items={data.social}
          onChange={(social) => setData({ ...data, social })}
        />
      </CollapsibleSection>

      <div className="fixed bottom-0 left-0 right-0 flex items-center gap-3 border-t border-fg/10 bg-bg p-4">
        {dirty && <span className="text-base text-dim">Unsaved changes</span>}
        <button
          type="button"
          disabled={pending || !dirty}
          onClick={save}
          className="rounded bg-fg px-4 py-1.5 text-base text-bg disabled:opacity-50"
        >
          {pending ? "Saving..." : saved ? "Saved ✓" : "Save draft"}
        </button>
      </div>
    </div>
  );
}
